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

// ── US State name → FIPS code map ──
const STATE_FIPS: Record<string, string> = {
  "Alabama": "01", "Alaska": "02", "Arizona": "04", "Arkansas": "05",
  "California": "06", "Colorado": "08", "Connecticut": "09", "Delaware": "10",
  "Florida": "12", "Georgia": "13", "Hawaii": "15", "Idaho": "16",
  "Illinois": "17", "Indiana": "18", "Iowa": "19", "Kansas": "20",
  "Kentucky": "21", "Louisiana": "22", "Maine": "23", "Maryland": "24",
  "Massachusetts": "25", "Michigan": "26", "Minnesota": "27", "Mississippi": "28",
  "Missouri": "29", "Montana": "30", "Nebraska": "31", "Nevada": "32",
  "New Hampshire": "33", "New Jersey": "34", "New Mexico": "35", "New York": "36",
  "North Carolina": "37", "North Dakota": "38", "Ohio": "39", "Oklahoma": "40",
  "Oregon": "41", "Pennsylvania": "42", "Rhode Island": "44", "South Carolina": "45",
  "South Dakota": "46", "Tennessee": "47", "Texas": "48", "Utah": "49",
  "Vermont": "50", "Virginia": "51", "Washington": "53", "West Virginia": "54",
  "Wisconsin": "55", "Wyoming": "56", "District of Columbia": "11",
};

// Abbreviation → full name
const STATE_ABBR: Record<string, string> = {
  "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
  "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
  "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
  "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
  "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
  "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
  "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
  "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
  "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
  "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
  "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
  "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
  "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
};

/**
 * Detect a US state from a geography string.
 * Returns { stateName, fipsCode } or null.
 */
function detectUSState(geography: string): { stateName: string; fipsCode: string } | null {
  const geo = geography.trim();
  // Try abbreviation (2-letter, exact match)
  const upper = geo.toUpperCase();
  if (STATE_ABBR[upper]) {
    const name = STATE_ABBR[upper];
    return { stateName: name, fipsCode: STATE_FIPS[name] };
  }
  // Try full name (case-insensitive)
  for (const [name, fips] of Object.entries(STATE_FIPS)) {
    if (geo.toLowerCase().includes(name.toLowerCase())) {
      return { stateName: name, fipsCode: fips };
    }
  }
  return null;
}

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
    // ── Product / Retail ──
    "Consumer Electronics": "443",
    "Electronics": "443",
    "Home": "442",
    "Automotive": "441",
    "Food & Beverage": "445",
    "Food": "445",
    "Cannabis": "445",
    "Beauty": "446",
    "Health & Wellness": "446",
    "Health": "446",
    "Pet Care": "453",
    "Pets": "453",
    "Sustainable Fashion": "448",
    "Fashion": "448",
    "Clothing": "448",

    // ── Technology / Software ──
    "EdTech": "6111",
    "Education": "6111",
    "Software": "5112",
    "SaaS": "5112",
    "Micro-SaaS": "5112",
    "Fitness Tech": "713",
    "Fitness": "713",

    // ── Construction & Specialty Trades (CRITICAL for BA mode) ──
    "Plumbing": "238220",
    "HVAC": "238220",
    "Heating": "238220",
    "Air Conditioning": "238220",
    "Electrical": "238210",
    "Electrician": "238210",
    "Roofing": "238160",
    "Painting": "238320",
    "Carpentry": "238350",
    "Flooring": "238330",
    "Concrete": "238110",
    "Masonry": "238140",
    "Demolition": "238910",
    "Insulation": "238310",
    "General Contractor": "236220",
    "Construction": "236220",
    "Remodel": "236118",
    "Renovation": "236118",
    "Landscaping": "561730",
    "Lawn Care": "561730",
    "Tree Service": "561730",

    // ── Professional Services ──
    "Accounting": "541211",
    "CPA": "541211",
    "Bookkeeping": "541219",
    "Legal": "541110",
    "Law Firm": "541110",
    "Consulting": "541611",
    "Management Consulting": "541611",
    "IT Services": "541512",
    "Marketing": "541810",
    "Advertising": "541810",
    "Architecture": "541310",
    "Engineering": "541330",
    "Real Estate": "531210",
    "Insurance": "524210",
    "Staffing": "561311",
    "Recruiting": "561311",

    // ── Healthcare / Medical ──
    "Dental": "621210",
    "Dentist": "621210",
    "Medical": "621111",
    "Physician": "621111",
    "Veterinary": "541940",
    "Vet": "541940",
    "Physical Therapy": "621340",
    "Chiropractic": "621310",
    "Optometry": "621320",
    "Pharmacy": "446110",
    "Home Health": "621610",

    // ── Auto Services ──
    "Auto Repair": "811111",
    "Auto Body": "811121",
    "Car Wash": "811192",
    "Oil Change": "811191",
    "Towing": "488410",

    // ── Food Service / Hospitality ──
    "Restaurant": "722511",
    "Catering": "722320",
    "Bar": "722410",
    "Hotel": "721110",
    "Bakery": "311811",
    "Coffee Shop": "722515",

    // ── Personal Services ──
    "Salon": "812111",
    "Barber": "812111",
    "Spa": "812199",
    "Dry Cleaning": "812320",
    "Laundry": "812310",
    "Funeral": "812210",
    "Child Care": "624410",
    "Daycare": "624410",
    "Gym": "713940",

    // ── Industrial / Manufacturing ──
    "Manufacturing": "332",
    "Machine Shop": "332710",
    "Metal Fabrication": "332312",
    "Welding": "332313",
    "Printing": "323111",
    "Woodwork": "321999",
    "Millwork": "321911",
    "Cabinet": "337110",

    // ── Transportation / Logistics ──
    "Trucking": "484110",
    "Freight": "484121",
    "Moving": "484210",
    "Courier": "492110",
    "Warehouse": "493110",

    // ── Cleaning / Maintenance ──
    "Janitorial": "561720",
    "Cleaning": "561720",
    "Pest Control": "561710",
    "Waste Management": "562111",

    // ── Broad fallbacks ──
    "Service": "811",
    "Home Services": "238",
    "Skilled Trades": "238",
    "Professional Services": "541",
    "Business Model": "55",
    "Business": "55",
  };

  const lower = category.toLowerCase();
  for (const [key, naics] of Object.entries(map)) {
    if (lower.includes(key.toLowerCase())) return naics;
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

/**
 * Build the focusTerritory object for a detected US state.
 */
function buildFocusTerritory(
  stateName: string,
  fipsCode: string,
  stateData: any[],
  businessData: any[],
  scored: any[],
  regulatoryProfile: any
): any {
  const state = stateData.find(s => s.name === stateName || s.stateCode === fipsCode);
  if (!state) return null;

  const biz = businessData.find(b => b.state === stateName);
  const scoredState = scored.find(s => s.name === stateName);
  const nationalRank = scored.findIndex(s => s.name === stateName) + 1;

  const bizPerCapita = biz && state.population > 0
    ? Math.round((biz.establishments / state.population) * 100_000 * 10) / 10
    : 0;

  const educationRate = state.population > 0
    ? Math.round((state.bachelorsDegreeHolders / state.population) * 100 * 10) / 10
    : 0;

  const laborForceParticipation = state.population > 0
    ? Math.round((state.laborForce / state.population) * 100 * 10) / 10
    : 0;

  // Extract regulatory intelligence for this territory
  const hasRegData = regulatoryProfile && regulatoryProfile.regulatoryRelevance !== "none";
  const legalStatus = hasRegData
    ? (regulatoryProfile.targetStateLegalStatus || "not_applicable")
    : "not_applicable";
  const keyRules: string[] = hasRegData ? (regulatoryProfile.risks || []).slice(0, 3) : [];
  const agencies: string[] = hasRegData ? (regulatoryProfile.agencies || []) : [];
  const stateSpecificRules: { rule: string; source: string }[] = hasRegData
    ? (regulatoryProfile.stateSpecificRules || [])
    : [];
  const complianceNotes = hasRegData
    ? (regulatoryProfile.stateComplianceNotes || `Compliance required with ${agencies.join(", ")}`)
    : "No specific regulatory requirements detected for this category";

  return {
    name: stateName,
    type: "us_state",
    census: {
      population: state.population,
      medianIncome: state.medianIncome,
      medianAge: state.medianAge,
      educationRate,
      laborForceParticipation,
      avgHouseholdSize: state.avgHouseholdSize,
    },
    business: {
      establishments: biz?.establishments || 0,
      employees: biz?.employees || 0,
      bizPerCapita,
      opportunityScore: scoredState?.opportunityScore || 0,
      nationalRank,
    },
    regulatory: {
      legalStatus,
      keyRules,
      agencies,
      stateSpecificRules,
      complianceNotes,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category, geography, productName } = await req.json();
    const naicsCode = categoryToNaics(category || "");

    console.log(`[GeoData] Category: ${category}, NAICS: ${naicsCode}, Geography: ${geography || "all"}`);

    // Detect US state from geography string
    const detectedState = geography ? detectUSState(geography) : null;
    if (detectedState) {
      console.log(`[GeoData] Detected US state: ${detectedState.stateName} (FIPS: ${detectedState.fipsCode})`);
    }

    // Fetch all data sources in parallel (including adaptive regulatory data)
    const [stateData, businessData, globalData, regulatoryProfile] = await Promise.all([
      fetchCensusStateData(),
      fetchBusinessPatterns(naicsCode),
      fetchWorldBankData(),
      buildRegulatoryProfile(category || "", productName, detectedState?.stateName),
    ]);

    console.log(`[GeoData] Regulatory relevance: ${regulatoryProfile.regulatoryRelevance} (${regulatoryProfile.matchedCategory || "none"})`);

    console.log(`[GeoData] Census: ${stateData.length} states, CBP: ${businessData.length} states, World Bank: ${globalData.length} countries`);

    // Score opportunities
    const usOpportunities = scoreOpportunity(stateData, businessData, category);
    const globalOpportunities = scoreGlobalOpportunity(globalData);

    // Build focusTerritory if a US state was detected
    let focusTerritory: any = null;
    if (detectedState) {
      focusTerritory = buildFocusTerritory(
        detectedState.stateName,
        detectedState.fipsCode,
        stateData,
        businessData,
        usOpportunities,
        regulatoryProfile
      );
      if (focusTerritory) {
        console.log(`[GeoData] Built focusTerritory for ${detectedState.stateName}: pop=${focusTerritory.census.population}, rank=${focusTerritory.business.nationalRank}`);
      }
    } else if (geography && !detectedState) {
      // Non-US territory — surface as a named region using World Bank data
      const geoLower = geography.toLowerCase();
      const matchedCountry = globalOpportunities.find(c =>
        c.name?.toLowerCase().includes(geoLower) ||
        c.countryCode?.toLowerCase() === geoLower.slice(0, 3)
      );
      if (matchedCountry) {
        focusTerritory = {
          name: matchedCountry.name,
          type: "country",
          census: {
            population: matchedCountry.population || 0,
            medianIncome: matchedCountry.gdpPerCapita || 0,
            medianAge: null,
            educationRate: null,
            laborForceParticipation: null,
          },
          business: {
            establishments: null,
            employees: null,
            bizPerCapita: null,
            opportunityScore: matchedCountry.opportunityScore || 0,
            nationalRank: globalOpportunities.indexOf(matchedCountry) + 1,
          },
          regulatory: {
            legalStatus: "not_applicable",
            keyRules: [],
            agencies: [],
            stateSpecificRules: [],
            complianceNotes: "International regulatory data not available — consult local legal counsel",
          },
        };
      } else {
        // Named region (Southeast Asia, EU, etc.)
        focusTerritory = {
          name: geography.trim(),
          type: "region",
          census: null,
          business: null,
          regulatory: {
            legalStatus: "not_applicable",
            keyRules: [],
            agencies: [],
            stateSpecificRules: [],
            complianceNotes: "Regional regulatory data not available — consult local legal counsel",
          },
        };
      }
    }

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
      geography: geography || null,
      focusTerritory,
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
