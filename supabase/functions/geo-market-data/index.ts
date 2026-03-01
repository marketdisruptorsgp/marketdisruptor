import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildRegulatoryProfile } from "../_shared/regulatoryIntelligence.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── US Census ACS 5-Year API (free, no key needed for ≤500 req/day) ──
const CENSUS_BASE = "https://api.census.gov/data";
const ACS_YEAR = "2022"; // latest stable ACS 5-year
const ACS_DATASET = "acs/acs5";

// Variables: B01003_001E = total pop, B19013_001E = median income,
// B01002_001E = median age, B25010_001E = avg household size,
// B15003_022E = bachelor's degree+, B23025_002E = labor force
const CENSUS_VARS = "B01003_001E,B19013_001E,B01002_001E,B25010_001E,B15003_022E,B23025_002E,NAME";

async function fetchCensusStateData(): Promise<any[]> {
  try {
    const url = `${CENSUS_BASE}/${ACS_YEAR}/${ACS_DATASET}?get=${CENSUS_VARS}&for=state:*`;
    console.log("[GeoData] Fetching Census state data:", url);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Census API error: ${res.status}`);
      return [];
    }
    const raw = await res.json();
    if (!Array.isArray(raw) || raw.length < 2) return [];

    const headers = raw[0] as string[];
    const rows = raw.slice(1);

    return rows.map((row: string[]) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return {
        name: obj["NAME"],
        stateCode: obj["state"],
        population: parseInt(obj["B01003_001E"]) || 0,
        medianIncome: parseInt(obj["B19013_001E"]) || 0,
        medianAge: parseFloat(obj["B01002_001E"]) || 0,
        avgHouseholdSize: parseFloat(obj["B25010_001E"]) || 0,
        bachelorsDegreeHolders: parseInt(obj["B15003_022E"]) || 0,
        laborForce: parseInt(obj["B23025_002E"]) || 0,
      };
    }).filter(s => s.population > 0);
  } catch (err) {
    console.error("[GeoData] Census fetch failed:", err);
    return [];
  }
}

// ── US Census County Business Patterns (business density by NAICS) ──
async function fetchBusinessPatterns(naicsCode?: string): Promise<any[]> {
  try {
    const naics = naicsCode || "44-45"; // default: retail trade
    const url = `${CENSUS_BASE}/2021/cbp?get=ESTAB,EMP,PAYANN,NAICS2017_LABEL,NAME&for=state:*&NAICS2017=${naics}`;
    console.log("[GeoData] Fetching CBP data:", url);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`CBP API error: ${res.status}`);
      return [];
    }
    const raw = await res.json();
    if (!Array.isArray(raw) || raw.length < 2) return [];

    const headers = raw[0] as string[];
    const rows = raw.slice(1);

    return rows.map((row: string[]) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return {
        state: obj["NAME"],
        establishments: parseInt(obj["ESTAB"]) || 0,
        employees: parseInt(obj["EMP"]) || 0,
        annualPayroll: parseInt(obj["PAYANN"]) || 0,
        naicsLabel: obj["NAICS2017_LABEL"],
      };
    });
  } catch (err) {
    console.error("[GeoData] CBP fetch failed:", err);
    return [];
  }
}

// ── World Bank API (free, no key) ──
const WB_BASE = "https://api.worldbank.org/v2";

interface WBIndicator {
  indicator: string;
  label: string;
}

const WB_INDICATORS: WBIndicator[] = [
  { indicator: "SP.POP.TOTL", label: "population" },
  { indicator: "NY.GDP.PCAP.CD", label: "gdpPerCapita" },
  { indicator: "SP.POP.GROW", label: "populationGrowth" },
  { indicator: "SP.URB.TOTL.IN.ZS", label: "urbanizationRate" },
  { indicator: "NE.CON.PRVT.PC.KD", label: "consumerSpendingPerCapita" },
];

// Top 20 economies for global coverage
const WB_COUNTRIES = "USA;CHN;JPN;DEU;GBR;IND;FRA;BRA;ITA;CAN;KOR;AUS;MEX;ESP;IDN;NLD;SAU;TUR;CHE;SWE";

async function fetchWorldBankData(): Promise<any[]> {
  const countryData: Record<string, any> = {};

  await Promise.all(
    WB_INDICATORS.map(async ({ indicator, label }) => {
      try {
        const url = `${WB_BASE}/country/${WB_COUNTRIES}/indicator/${indicator}?format=json&date=2022&per_page=100`;
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        const entries = json[1];
        if (!Array.isArray(entries)) return;

        for (const entry of entries) {
          const code = entry.country?.id;
          const name = entry.country?.value;
          if (!code || entry.value === null) continue;

          if (!countryData[code]) {
            countryData[code] = { countryCode: code, name };
          }
          countryData[code][label] = entry.value;
        }
      } catch (err) {
        console.error(`[GeoData] World Bank ${indicator} failed:`, err);
      }
    })
  );

  return Object.values(countryData).filter(c => c.population);
}

// ── Category-to-NAICS mapping ──
function categoryToNaics(category: string): string {
  const map: Record<string, string> = {
    "Consumer Electronics": "443",
    "Electronics": "443",
    "EdTech": "6111",
    "Education": "6111",
    "Health & Wellness": "446",
    "Health": "446",
    "Sustainable Fashion": "448",
    "Fashion": "448",
    "Clothing": "448",
    "Pet Care": "453",
    "Pets": "453",
    "Food & Beverage": "445",
    "Food": "445",
    "Fitness Tech": "713",
    "Fitness": "713",
    "Beauty": "446",
    "Home": "442",
    "Automotive": "441",
    "Software": "5112",
    "SaaS": "5112",
    "Micro-SaaS": "5112",
    "Service": "812",
    "Business Model": "55",
    "Business": "55",
  };

  for (const [key, naics] of Object.entries(map)) {
    if (category.toLowerCase().includes(key.toLowerCase())) return naics;
  }
  return "44-45"; // retail fallback
}

// ── Opportunity scoring ──
function scoreOpportunity(
  states: any[],
  businessData: any[],
  category: string
): any[] {
  if (!states.length) return [];

  // Merge business data with state demographics
  const stateMap = new Map(states.map(s => [s.name, s]));
  const bizMap = new Map(businessData.map(b => [b.state, b]));

  const scored = states.map(state => {
    const biz = bizMap.get(state.name);
    const popMillions = state.population / 1_000_000;
    const bizPerCapita = biz ? (biz.establishments / state.population) * 100_000 : 0;

    // Opportunity = high income + high population + low business density
    const incomeScore = Math.min(state.medianIncome / 100_000, 1) * 30;
    const popScore = Math.min(popMillions / 10, 1) * 25;
    const densityScore = bizPerCapita > 0 ? Math.max(0, 1 - bizPerCapita / 50) * 25 : 12.5;
    const educationScore = state.bachelorsDegreeHolders > 0
      ? Math.min((state.bachelorsDegreeHolders / state.population) * 10, 1) * 20
      : 10;

    return {
      ...state,
      establishments: biz?.establishments || 0,
      employees: biz?.employees || 0,
      bizPerCapita: Math.round(bizPerCapita * 10) / 10,
      opportunityScore: Math.round(incomeScore + popScore + densityScore + educationScore),
    };
  });

  return scored.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

function scoreGlobalOpportunity(countries: any[]): any[] {
  if (!countries.length) return [];

  return countries.map(c => {
    const gdpScore = Math.min((c.gdpPerCapita || 0) / 80_000, 1) * 30;
    const popScore = Math.min((c.population || 0) / 500_000_000, 1) * 20;
    const growthScore = Math.min(Math.max((c.populationGrowth || 0) + 1, 0) / 3, 1) * 20;
    const urbanScore = Math.min((c.urbanizationRate || 0) / 100, 1) * 15;
    const spendingScore = Math.min((c.consumerSpendingPerCapita || 0) / 30_000, 1) * 15;

    return {
      ...c,
      opportunityScore: Math.round(gdpScore + popScore + growthScore + urbanScore + spendingScore),
    };
  }).sort((a, b) => b.opportunityScore - a.opportunityScore);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category, geography, productName } = await req.json();
    const naicsCode = categoryToNaics(category || "");

    console.log(`[GeoData] Category: ${category}, NAICS: ${naicsCode}, Geography: ${geography || "all"}`);

    // Fetch all data sources in parallel (including adaptive regulatory data)
    const [stateData, businessData, globalData, regulatoryProfile] = await Promise.all([
      fetchCensusStateData(),
      fetchBusinessPatterns(naicsCode),
      fetchWorldBankData(),
      buildRegulatoryProfile(category || "", productName),
    ]);

    console.log(`[GeoData] Regulatory relevance: ${regulatoryProfile.regulatoryRelevance} (${regulatoryProfile.matchedCategory || "none"})`);

    console.log(`[GeoData] Census: ${stateData.length} states, CBP: ${businessData.length} states, World Bank: ${globalData.length} countries`);

    // Score opportunities
    const usOpportunities = scoreOpportunity(stateData, businessData, category);
    const globalOpportunities = scoreGlobalOpportunity(globalData);

    // Compute national aggregates
    const totalUSPop = stateData.reduce((s, d) => s + d.population, 0);
    const avgIncome = stateData.length > 0
      ? Math.round(stateData.reduce((s, d) => s + d.medianIncome, 0) / stateData.length)
      : 0;
    const totalEstablishments = businessData.reduce((s, d) => s + d.establishments, 0);
    const totalEmployees = businessData.reduce((s, d) => s + d.employees, 0);

    const result = {
      category,
      naicsCode,
      dataSources: {
        census: stateData.length > 0 ? "US Census ACS 2022 (5-Year Estimates)" : "unavailable",
        businessPatterns: businessData.length > 0 ? "US Census County Business Patterns 2021" : "unavailable",
        worldBank: globalData.length > 0 ? "World Bank Open Data 2022" : "unavailable",
        regulatory: regulatoryProfile.regulatoryRelevance !== "none"
          ? `Federal Register API + Firecrawl (${regulatoryProfile.matchedCategory})`
          : "not applicable",
      },
      us: {
        totalPopulation: totalUSPop,
        avgMedianIncome: avgIncome,
        totalEstablishments,
        totalEmployees,
        topStates: usOpportunities.slice(0, 10),
        bottomStates: usOpportunities.slice(-5),
      },
      global: {
        topMarkets: globalOpportunities.slice(0, 10),
      },
      regulatoryProfile,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ success: true, geoData: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[GeoData] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
