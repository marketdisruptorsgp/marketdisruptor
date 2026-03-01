/**
 * Regulatory Intelligence — Category-aware adaptive regulatory data enrichment.
 * Only triggers for categories with known regulatory complexity.
 */

// ── Regulatory sensitivity map ──
interface RegulatoryDomain {
  keywords: string[];
  agencies: string[];
  federalRegisterTerms: string[];
  firecrawlQueries: string[];
}

const REGULATORY_CATEGORIES: Record<string, RegulatoryDomain> = {
  Cannabis: {
    keywords: ["cannabis", "thc", "cbd", "marijuana", "hemp", "edible", "dispensary", "weed", "gummy", "gummies"],
    agencies: ["DEA", "FDA", "State Cannabis Boards"],
    federalRegisterTerms: ["cannabis", "marijuana", "hemp", "cannabidiol"],
    firecrawlQueries: [
      '"cannabis legal status" state-by-state 2025 2026',
      '"THC regulation" OR "cannabis licensing" recent changes 2025',
      'federal cannabis legislation bill 2025 2026',
    ],
  },
  Alcohol: {
    keywords: ["alcohol", "spirits", "liquor", "beer", "wine", "brewery", "distillery", "cocktail", "hard seltzer"],
    agencies: ["TTB", "State ABC Boards", "FDA"],
    federalRegisterTerms: ["alcohol", "distilled spirits", "beer", "wine"],
    firecrawlQueries: [
      '"alcohol licensing" state requirements 2025',
      '"craft beverage" regulation changes 2025 2026',
    ],
  },
  Firearms: {
    keywords: ["firearm", "gun", "weapon", "ammunition", "ammo", "rifle", "pistol", "holster"],
    agencies: ["ATF", "State Firearms Boards"],
    federalRegisterTerms: ["firearms", "ammunition", "weapons"],
    firecrawlQueries: [
      '"firearms regulation" state-by-state 2025',
      '"gun laws" changes 2025 2026',
    ],
  },
  Healthcare: {
    keywords: ["healthcare", "medical", "health", "hospital", "clinic", "telehealth", "pharma", "pharmaceutical", "drug", "supplement", "nutraceutical", "vitamin"],
    agencies: ["FDA", "CMS", "State Medical Boards", "HIPAA"],
    federalRegisterTerms: ["healthcare", "medical device", "pharmaceutical", "dietary supplement"],
    firecrawlQueries: [
      '"healthcare regulation" changes 2025 2026',
      '"FDA approval" OR "medical device regulation" recent 2025',
    ],
  },
  FinTech: {
    keywords: ["fintech", "payment", "banking", "lending", "crypto", "cryptocurrency", "blockchain", "defi", "neobank", "money transfer", "remittance"],
    agencies: ["SEC", "CFPB", "FinCEN", "State Money Transmitter"],
    federalRegisterTerms: ["financial technology", "cryptocurrency", "money transmission", "consumer finance"],
    firecrawlQueries: [
      '"fintech regulation" state licensing 2025',
      '"cryptocurrency" OR "digital assets" regulation 2025 2026',
    ],
  },
  "Food Safety": {
    keywords: ["food", "beverage", "restaurant", "meal kit", "catering", "snack", "organic", "farm", "dairy", "meat"],
    agencies: ["FDA", "USDA", "State Health Departments"],
    federalRegisterTerms: ["food safety", "USDA", "dietary", "food labeling"],
    firecrawlQueries: [
      '"food safety regulation" changes 2025',
      '"FDA food labeling" requirements 2025 2026',
    ],
  },
  "Real Estate": {
    keywords: ["real estate", "property", "housing", "rental", "mortgage", "landlord", "tenant", "zoning", "construction"],
    agencies: ["HUD", "State Real Estate Commissions", "Local Zoning"],
    federalRegisterTerms: ["real estate", "housing", "fair housing", "mortgage"],
    firecrawlQueries: [
      '"real estate licensing" state requirements 2025',
      '"housing regulation" OR "zoning changes" 2025 2026',
    ],
  },
  Education: {
    keywords: ["education", "edtech", "school", "university", "tutoring", "learning", "course", "training", "certification"],
    agencies: ["Department of Education", "State Accreditation", "FERPA"],
    federalRegisterTerms: ["education", "FERPA", "accreditation", "student privacy"],
    firecrawlQueries: [
      '"education regulation" OR "edtech compliance" 2025',
    ],
  },
  Gambling: {
    keywords: ["gambling", "betting", "casino", "sportsbook", "lottery", "poker", "wagering"],
    agencies: ["State Gaming Commissions", "DOJ"],
    federalRegisterTerms: ["gambling", "sports betting", "gaming"],
    firecrawlQueries: [
      '"online gambling" OR "sports betting" legal status state-by-state 2025 2026',
    ],
  },
  Tobacco: {
    keywords: ["tobacco", "vape", "vaping", "e-cigarette", "nicotine", "cigar", "smoking"],
    agencies: ["FDA", "TTB", "State Tobacco Boards"],
    federalRegisterTerms: ["tobacco", "e-cigarette", "vaping", "nicotine"],
    firecrawlQueries: [
      '"vaping regulation" OR "tobacco regulation" state-by-state 2025',
      '"FDA tobacco" OR "e-cigarette ban" 2025 2026',
    ],
  },
};

export interface RegulatoryProfile {
  regulatoryRelevance: "high" | "medium" | "low" | "none";
  matchedCategory: string | null;
  agencies: string[];
  activeRulemaking: RulemakingEntry[];
  firecrawlInsights: FirecrawlInsight[];
  risks: string[];
  stateVariance: string[];
  timestamp: string;
}

interface RulemakingEntry {
  title: string;
  type: string; // RULE, PROPOSED_RULE, NOTICE
  publishedDate: string;
  agencyNames: string[];
  abstractSnippet: string;
  url: string;
}

interface FirecrawlInsight {
  query: string;
  title: string;
  url: string;
  snippet: string;
}

/**
 * Detect which regulatory domain (if any) a category + product name maps to.
 * Returns null for categories with no known regulatory complexity.
 */
export function detectRegulatoryDomain(
  category: string,
  productName?: string
): { domain: RegulatoryDomain; categoryName: string } | null {
  const searchText = `${category} ${productName || ""}`.toLowerCase();

  for (const [catName, domain] of Object.entries(REGULATORY_CATEGORIES)) {
    for (const keyword of domain.keywords) {
      if (searchText.includes(keyword)) {
        return { domain, categoryName: catName };
      }
    }
  }
  return null;
}

/**
 * Fetch active/proposed rules from the Federal Register API (free, no key).
 */
export async function fetchFederalRegister(terms: string[]): Promise<RulemakingEntry[]> {
  const results: RulemakingEntry[] = [];

  for (const term of terms.slice(0, 2)) { // limit to 2 terms to control latency
    try {
      const url = `https://www.federalregister.gov/api/v1/documents?conditions[term]=${encodeURIComponent(term)}&conditions[type][]=RULE&conditions[type][]=PROPOSED_RULE&per_page=5&order=newest`;
      console.log("[Regulatory] Federal Register query:", url);
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[Regulatory] Federal Register ${res.status} for term "${term}"`);
        continue;
      }
      const json = await res.json();
      const docs = json.results || [];

      for (const doc of docs) {
        results.push({
          title: doc.title || "Untitled",
          type: doc.type || "RULE",
          publishedDate: doc.publication_date || "",
          agencyNames: (doc.agencies || []).map((a: any) => a.name || a.raw_name || ""),
          abstractSnippet: (doc.abstract || "").slice(0, 300),
          url: doc.html_url || doc.pdf_url || "",
        });
      }
    } catch (err) {
      console.error(`[Regulatory] Federal Register fetch failed for "${term}":`, err);
    }
  }

  return results;
}

/**
 * Search for regulatory context via Firecrawl (uses existing FIRECRAWL_API_KEY).
 */
export async function fetchFirecrawlRegulatory(
  queries: string[],
  firecrawlApiKey: string | undefined
): Promise<FirecrawlInsight[]> {
  if (!firecrawlApiKey) {
    console.warn("[Regulatory] FIRECRAWL_API_KEY not set — skipping web search");
    return [];
  }

  const insights: FirecrawlInsight[] = [];

  // Run queries in parallel, limit to 2 for latency
  const queryPromises = queries.slice(0, 2).map(async (query) => {
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, limit: 3, scrapeOptions: { formats: ["markdown"] } }),
      });

      if (!res.ok) {
        console.warn(`[Regulatory] Firecrawl search failed ${res.status} for "${query}"`);
        return [];
      }

      const json = await res.json();
      const results = json.data || [];
      return results.map((r: any) => ({
        query,
        title: r.title || "Untitled",
        url: r.url || "",
        snippet: (r.description || r.markdown || "").slice(0, 400),
      }));
    } catch (err) {
      console.error(`[Regulatory] Firecrawl search error for "${query}":`, err);
      return [];
    }
  });

  const settled = await Promise.all(queryPromises);
  for (const batch of settled) {
    insights.push(...batch);
  }

  return insights;
}

/**
 * Build the full regulatory profile for a given category.
 * Returns { regulatoryRelevance: "none" } for non-regulated categories.
 */
export async function buildRegulatoryProfile(
  category: string,
  productName?: string
): Promise<RegulatoryProfile> {
  const match = detectRegulatoryDomain(category, productName);

  if (!match) {
    return {
      regulatoryRelevance: "none",
      matchedCategory: null,
      agencies: [],
      activeRulemaking: [],
      firecrawlInsights: [],
      risks: [],
      stateVariance: [],
      timestamp: new Date().toISOString(),
    };
  }

  const { domain, categoryName } = match;
  console.log(`[Regulatory] Detected domain: ${categoryName} — fetching regulatory data`);

  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

  // Fetch Federal Register + Firecrawl in parallel
  const [rulemaking, firecrawlInsights] = await Promise.all([
    fetchFederalRegister(domain.federalRegisterTerms),
    fetchFirecrawlRegulatory(domain.firecrawlQueries, firecrawlKey),
  ]);

  // Determine relevance level based on data richness
  const relevance: "high" | "medium" | "low" =
    rulemaking.length >= 3 || firecrawlInsights.length >= 3 ? "high" :
    rulemaking.length >= 1 || firecrawlInsights.length >= 1 ? "medium" : "low";

  // Extract risk signals from findings
  const risks: string[] = [];
  if (rulemaking.some(r => r.type === "PROPOSED_RULE")) {
    risks.push(`Active proposed rulemaking detected — regulatory landscape may shift`);
  }
  if (firecrawlInsights.length > 0) {
    risks.push(`State-by-state regulatory variance identified for ${categoryName}`);
  }
  risks.push(`${categoryName} businesses require compliance with ${domain.agencies.join(", ")}`);

  // State variance signals
  const stateVariance: string[] = [];
  for (const insight of firecrawlInsights) {
    if (insight.snippet.toLowerCase().includes("state") || insight.snippet.toLowerCase().includes("legal")) {
      stateVariance.push(insight.snippet.slice(0, 200));
    }
  }

  return {
    regulatoryRelevance: relevance,
    matchedCategory: categoryName,
    agencies: domain.agencies,
    activeRulemaking: rulemaking,
    firecrawlInsights,
    risks,
    stateVariance: stateVariance.slice(0, 5),
    timestamp: new Date().toISOString(),
  };
}
