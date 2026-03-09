/**
 * SEMANTIC FACET ALIGNMENT — TF-IDF Cosine Similarity Engine
 *
 * Instead of relying solely on regex patterns, this module:
 *   1. Tokenizes evidence text and facet definitions into term vectors
 *   2. Computes cosine similarity between evidence and each facet concept
 *   3. Returns ranked multi-facet assignments with confidence scores
 *
 * Runs entirely client-side — no API calls. Uses a lightweight
 * bag-of-words approach with IDF weighting across the facet corpus.
 */

import type {
  EvidenceFacets,
  BusinessFacets,
  MarketFacets,
  DemandFacets,
} from "./types";

// ═══════════════════════════════════════════════════════════════
//  FACET CONCEPT DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export interface FacetConcept {
  /** Unique ID for this facet concept */
  id: string;
  /** Human-readable name */
  name: string;
  /** The facet domain */
  domain: "business" | "market" | "demand";
  /** Which facet field this maps to */
  facetField: string;
  /** The value to assign */
  facetValue: any;
  /** Descriptive text used for semantic matching */
  definition: string;
  /** Additional semantic terms to boost matching */
  semanticTerms: string[];
}

/**
 * Pre-defined facet concepts — each one is a "semantic anchor"
 * that evidence items are compared against.
 */
export const FACET_CONCEPTS: FacetConcept[] = [
  // ── Business: Labor Profile ──
  {
    id: "labor_high_owner",
    name: "Owner-Dependent Labor",
    domain: "business",
    facetField: "laborProfile",
    facetValue: { intensity: "high", ownerDependency: true },
    definition: "Business relies heavily on the owner or a single key person for core delivery. Solo practitioner model where the founder is the primary revenue generator.",
    semanticTerms: ["owner", "founder", "key person", "solo", "practitioner", "single point", "dependent", "irreplaceable", "personal expertise", "cannot delegate"],
  },
  {
    id: "labor_high",
    name: "Labor-Intensive Operations",
    domain: "business",
    facetField: "laborProfile",
    facetValue: { intensity: "high", ownerDependency: false },
    definition: "Business requires substantial human labor for core operations. Revenue scales with headcount. Staffing shortages, hiring difficulties, and high turnover are operational challenges.",
    semanticTerms: ["labor", "staffing", "workforce", "headcount", "hiring", "recruitment", "turnover", "retention", "employee", "wages", "payroll", "compensation", "skilled workers", "technician", "hygienist", "nurse", "therapist", "driver", "crew", "team", "personnel", "human capital", "labor market", "talent", "shortage", "scarcity", "manual work", "hands-on", "service delivery", "billable hours", "utilization rate", "productive hours", "labor cost"],
  },
  {
    id: "labor_low",
    name: "Low-Labor / Automated Operations",
    domain: "business",
    facetField: "laborProfile",
    facetValue: { intensity: "low", ownerDependency: false },
    definition: "Business operates with minimal human labor through automation, self-service, or capital-intensive infrastructure.",
    semanticTerms: ["automated", "self-service", "unmanned", "minimal staff", "capital intensive", "technology driven", "software", "platform", "scalable", "low headcount", "machine", "equipment"],
  },

  // ── Business: Pricing Architecture ──
  {
    id: "pricing_hourly",
    name: "Hourly / Per-Service Pricing",
    domain: "business",
    facetField: "pricingArchitecture",
    facetValue: { model: "hourly", priceSettingPower: "weak", switchingCost: "low" },
    definition: "Revenue earned per hour, per visit, per appointment, or per procedure. Fee-for-service model with transactional pricing tied to individual interactions.",
    semanticTerms: ["hourly", "per visit", "per appointment", "per procedure", "fee for service", "per session", "per treatment", "per wash", "per clean", "per job", "transactional", "pay per use", "billable", "time and materials", "per unit", "per load", "per mile", "per trip"],
  },
  {
    id: "pricing_project",
    name: "Project-Based Pricing",
    domain: "business",
    facetField: "pricingArchitecture",
    facetValue: { model: "project", priceSettingPower: "moderate", switchingCost: "low" },
    definition: "Revenue earned per project, contract, or fixed bid. Pricing based on scope of work rather than time.",
    semanticTerms: ["project based", "fixed bid", "quote", "contract", "scope", "flat rate", "flat fee", "estimate", "proposal", "job pricing"],
  },
  {
    id: "pricing_subscription",
    name: "Subscription / Membership Pricing",
    domain: "business",
    facetField: "pricingArchitecture",
    facetValue: { model: "subscription", priceSettingPower: "moderate", switchingCost: "moderate" },
    definition: "Recurring revenue through subscriptions, memberships, or retainer agreements. Monthly or annual billing cycles.",
    semanticTerms: ["subscription", "membership", "recurring", "monthly fee", "annual contract", "retainer", "dues", "ongoing", "auto-renew", "recurring revenue", "MRR", "ARR"],
  },
  {
    id: "pricing_weak_power",
    name: "Weak Price-Setting Power",
    domain: "business",
    facetField: "pricingArchitecture",
    facetValue: { model: "fixed", priceSettingPower: "weak", switchingCost: "low" },
    definition: "Business cannot set its own prices. Prices are dictated by insurance, government reimbursement, competitive pressure, or commodity markets. Race to the bottom dynamics.",
    semanticTerms: ["price taker", "insurance sets price", "reimbursement rate", "negotiated rate", "payer pressure", "price war", "price erosion", "commoditized", "price sensitive", "race to bottom", "price competition", "downward pressure", "no pricing power", "managed care", "third party payer"],
  },

  // ── Business: Concentration Risk ──
  {
    id: "concentration_customer",
    name: "Customer Concentration Risk",
    domain: "business",
    facetField: "concentrationRisk",
    facetValue: { type: "customer" },
    definition: "Revenue depends on a small number of large customers or a single dominant payer. Loss of one client would significantly impact revenue.",
    semanticTerms: ["customer concentration", "top client", "single customer", "key account", "revenue dependent", "payer mix", "insurance company", "dominant payer", "few large clients", "client dependency"],
  },
  {
    id: "concentration_vendor",
    name: "Vendor / Supply Concentration Risk",
    domain: "business",
    facetField: "concentrationRisk",
    facetValue: { type: "vendor" },
    definition: "Business depends on a single or limited number of suppliers for critical inputs. Supply chain vulnerability from sole-source dependencies.",
    semanticTerms: ["vendor dependency", "single supplier", "sole source", "supply chain", "supplier concentration", "limited suppliers", "supply risk", "vendor lock-in", "supplier", "manufacturer", "MOQ", "minimum order", "supply chain participant", "procurement"],
  },

  // ── Business: Margin Structure ──
  {
    id: "margin_declining",
    name: "Margin Compression",
    domain: "business",
    facetField: "marginStructure",
    facetValue: { marginTrend: "declining", marginDriver: "competitive pressure" },
    definition: "Margins are declining due to rising costs, competitive pressure, or pricing erosion. Overhead is growing faster than revenue.",
    semanticTerms: ["margin compression", "margin decline", "shrinking margin", "thin margin", "low margin", "tight margin", "overhead rising", "cost increase", "cost pressure", "cost escalation", "expense growing", "profit squeeze", "margin erosion", "break even", "estimated margin", "margin range"],
  },
  {
    id: "margin_strong",
    name: "Strong / Healthy Margins",
    domain: "business",
    facetField: "marginStructure",
    facetValue: { marginTrend: "stable", marginDriver: "pricing power" },
    definition: "Business has healthy margins with pricing power and controlled costs.",
    semanticTerms: ["high margin", "strong margin", "healthy margin", "premium pricing", "pricing power", "margin expansion", "margin improvement", "good profitability"],
  },

  // ── Business: Operational Bottleneck ──
  {
    id: "bottleneck_capacity",
    name: "Capacity Constraint / Bottleneck",
    domain: "business",
    facetField: "operationalBottleneck",
    facetValue: { process: "core operations", constraint: "throughput limited" },
    definition: "Operations constrained by physical capacity, scheduling limits, or throughput ceilings. Demand exceeds ability to serve. Long wait times, backlogs, fully booked.",
    semanticTerms: ["bottleneck", "capacity constraint", "throughput", "backlog", "queue", "wait time", "waiting list", "fully booked", "appointment delay", "schedule full", "no availability", "at capacity", "capacity ceiling", "peak demand", "utilization", "idle time", "underutilized", "equipment downtime", "chair time", "bay occupancy", "room turnover", "table turnover"],
  },
  {
    id: "bottleneck_manual",
    name: "Manual Process / Automation Gap",
    domain: "business",
    facetField: "operationalBottleneck",
    facetValue: { process: "manual processes", constraint: "automation gap" },
    definition: "Operations rely on manual, paper-based, or legacy processes that could be automated. Technology debt slows operations.",
    semanticTerms: ["manual process", "paper based", "legacy system", "outdated technology", "tech debt", "no automation", "no software", "digitization", "spreadsheet", "handwritten", "phone-based scheduling", "fax"],
  },

  // ── Business: Fixed Cost / Geographic ──
  {
    id: "fixed_cost_burden",
    name: "High Fixed Cost Burden",
    domain: "business",
    facetField: "marginStructure",
    facetValue: { marginTrend: "declining", marginDriver: "fixed cost leverage" },
    definition: "Business carries significant fixed costs through rent, leases, equipment, or facility expenses that must be covered regardless of revenue.",
    semanticTerms: ["fixed cost", "overhead", "rent", "lease", "mortgage", "facility cost", "equipment cost", "depreciation", "capital expenditure", "debt service", "fixed expense", "break even point"],
  },
  {
    id: "geographic_constraint",
    name: "Geographic Service Limitation",
    domain: "business",
    facetField: "concentrationRisk",
    facetValue: { type: "geographic" as any },
    definition: "Business is limited to a specific geographic area, service radius, or local market. Growth constrained by physical reach.",
    semanticTerms: ["geographic limit", "service area", "service radius", "local market", "trade area", "drive time", "catchment", "limited reach", "territory", "local only", "neighborhood", "community", "physical location"],
  },

  // ── Business: Seasonal / Cyclical ──
  {
    id: "seasonal_demand",
    name: "Seasonal / Cyclical Demand",
    domain: "business",
    facetField: "operationalBottleneck",
    facetValue: { process: "demand pattern", constraint: "demand volatility" },
    definition: "Business experiences significant seasonal or cyclical fluctuations in demand, revenue, or cash flow.",
    semanticTerms: ["seasonal", "cyclical", "off season", "peak season", "fluctuation", "volatile demand", "uneven revenue", "lumpy", "weather dependent", "holiday", "summer", "winter"],
  },

  // ── Business: IP / Patent Constraints ──
  {
    id: "ip_constraint",
    name: "IP / Patent Barrier",
    domain: "business",
    facetField: "operationalBottleneck",
    facetValue: { process: "intellectual property", constraint: "IP restriction" },
    definition: "Business faces intellectual property constraints including patent thickets, licensing requirements, or IP-controlled markets. Freedom to operate is limited by existing patents.",
    semanticTerms: ["patent", "intellectual property", "IP", "patent thicket", "patent holder", "patent controlled", "licensing", "freedom to operate", "IP barrier", "patent landscape", "infringement", "patent risk", "dominant holder", "IP dominance", "prior art", "patent dense"],
  },
  {
    id: "ip_opportunity",
    name: "IP Opportunity / Expired Patents",
    domain: "business",
    facetField: "operationalBottleneck",
    facetValue: { process: "intellectual property", constraint: "IP opportunity" },
    definition: "Expired patents, patent white space, or innovation angles based on prior art analysis create opportunities for market entry without IP barriers.",
    semanticTerms: ["expired patent", "public domain", "patent white space", "patent gap", "unprotected", "innovation angle", "prior art", "expired IP", "commercial opportunity", "defensible", "patent free", "open technology", "patent informed"],
  },

  // ── Business: Supply Chain / Distribution ──
  {
    id: "supply_chain_dependency",
    name: "Supply Chain Dependency",
    domain: "business",
    facetField: "concentrationRisk",
    facetValue: { type: "vendor" },
    definition: "Business relies on complex supply chains with suppliers, manufacturers, and distributors. Supply chain disruption risks and dependencies on specific regions or providers.",
    semanticTerms: ["supply chain", "supplier", "manufacturer", "distributor", "procurement", "sourcing", "logistics", "fulfillment", "warehouse", "inventory", "lead time", "MOQ", "minimum order", "region", "import", "export", "shipping", "freight"],
  },
  {
    id: "distribution_channel",
    name: "Distribution Channel Structure",
    domain: "business",
    facetField: "concentrationRisk",
    facetValue: { type: "channel" as any },
    definition: "How the business distributes its product or service to customers. Channel strategy, intermediaries, direct-to-consumer, wholesale, or marketplace models.",
    semanticTerms: ["distribution", "channel", "distributor", "direct to consumer", "wholesale", "marketplace", "retail", "online", "ecommerce", "dealer", "broker", "intermediary", "fulfillment", "delivery", "last mile"],
  },

  // ── Business: Equipment / Asset Dependency ──
  {
    id: "asset_dependency",
    name: "Equipment / Asset Dependency",
    domain: "business",
    facetField: "operationalBottleneck",
    facetValue: { process: "asset management", constraint: "equipment dependency" },
    definition: "Business operations depend heavily on specialized equipment, vehicles, facilities, or physical assets. Asset maintenance, replacement, and utilization drive profitability.",
    semanticTerms: ["equipment", "vehicle", "fleet", "machinery", "facility", "asset", "capital equipment", "maintenance", "repair", "replacement", "depreciation", "utilization", "uptime", "downtime", "truck", "machine", "tool", "infrastructure"],
  },

  // ── Business: Cash Flow / Working Capital ──
  {
    id: "cash_flow_pressure",
    name: "Cash Flow / Working Capital Pressure",
    domain: "business",
    facetField: "marginStructure",
    facetValue: { marginTrend: "declining", marginDriver: "cash flow timing" },
    definition: "Business faces cash flow challenges from slow collections, high upfront costs, payment delays, or working capital needs.",
    semanticTerms: ["cash flow", "working capital", "accounts receivable", "collections", "payment delay", "DSO", "days sales outstanding", "billing cycle", "payment terms", "cash conversion", "float", "prepayment", "deposit", "invoicing", "cash crunch"],
  },

  // ── Business: Scalability Constraint ──
  {
    id: "scalability_constraint",
    name: "Linear Scaling / Growth Ceiling",
    domain: "business",
    facetField: "operationalBottleneck",
    facetValue: { process: "growth model", constraint: "linear scaling" },
    definition: "Business growth is linearly tied to adding more people, locations, or physical resources. Cannot scale efficiently without proportional cost increases.",
    semanticTerms: ["scalability", "scaling", "growth ceiling", "linear growth", "add more", "open more locations", "hire more", "cannot scale", "growth constraint", "expansion limited", "replication", "franchise", "multi-location", "multi-unit"],
  },

  // ── Business: Quality / Consistency ──
  {
    id: "quality_consistency",
    name: "Quality / Consistency Challenge",
    domain: "business",
    facetField: "operationalBottleneck",
    facetValue: { process: "quality control", constraint: "consistency gap" },
    definition: "Business struggles with maintaining consistent quality across deliveries, locations, or service encounters. Variability in outcomes creates customer satisfaction issues.",
    semanticTerms: ["quality", "consistency", "variability", "standardization", "quality control", "inconsistent", "defect", "error rate", "rework", "customer complaint", "satisfaction", "standard operating procedure", "SOP", "training gap"],
  },

  // ── Business: Market Pricing Intelligence ──
  {
    id: "market_pricing_data",
    name: "Market Pricing Intelligence",
    domain: "business",
    facetField: "pricingArchitecture",
    facetValue: { model: "fixed", priceSettingPower: "moderate", switchingCost: "low" },
    definition: "Market pricing data including price ranges, average prices, pricing strategies, and competitive pricing benchmarks.",
    semanticTerms: ["market pricing", "price range", "average price", "pricing strategy", "competitive pricing", "price point", "price benchmark", "price comparison", "cost analysis", "pricing data", "pricing intelligence"],
  },

  // ── Market Facets ──
  {
    id: "market_declining",
    name: "Declining / Stagnant Market",
    domain: "market",
    facetField: "marketGrowth",
    facetValue: "declining",
    definition: "Market is contracting, mature, or saturated with flat or negative growth trends.",
    semanticTerms: ["declining market", "shrinking demand", "mature market", "saturated", "stagnant", "no growth", "slow growth", "sunset", "commoditized market", "population decline", "flat demand"],
  },
  {
    id: "market_growing",
    name: "Growing / Emerging Market",
    domain: "market",
    facetField: "marketGrowth",
    facetValue: "high",
    definition: "Market shows strong growth signals with increasing demand, population growth, or emerging segments.",
    semanticTerms: ["high growth", "rapid growth", "booming", "emerging market", "growing demand", "population growth", "demand surge", "expansion", "new segment", "untapped"],
  },
  {
    id: "competitive_fragmented",
    name: "Fragmented / Highly Competitive Market",
    domain: "market",
    facetField: "competitiveDensity",
    facetValue: "fragmented",
    definition: "Market has many small players with no dominant leader. Intense competition, low barriers to entry.",
    semanticTerms: ["fragmented", "many competitors", "cottage industry", "no dominant player", "low concentration", "intense competition", "crowded market", "competitive pressure", "low barriers", "easy entry", "hundreds of providers", "mom and pop", "establishments", "business density", "industry density"],
  },
  {
    id: "competitive_concentrated",
    name: "Concentrated / Consolidated Market",
    domain: "market",
    facetField: "competitiveDensity",
    facetValue: "concentrated",
    definition: "Market dominated by a few large players or experiencing consolidation through private equity roll-ups.",
    semanticTerms: ["monopoly", "dominant player", "duopoly", "oligopoly", "consolidation", "roll-up", "private equity", "corporate chain", "aggregation", "few major players", "market leader"],
  },
  {
    id: "regulatory_restrictive",
    name: "Restrictive Regulatory Environment",
    domain: "market",
    facetField: "regulatoryEnvironment",
    facetValue: "restrictive",
    definition: "Industry faces heavy regulation, licensing requirements, compliance burdens, active rulemaking, state-by-state variance, or government oversight that limits operations.",
    semanticTerms: ["heavily regulated", "compliance", "licensing", "permit required", "regulatory burden", "HIPAA", "OSHA", "FDA", "state regulation", "federal regulation", "inspection", "zoning", "certificate", "accreditation", "bonding", "insurance required", "regulatory complexity", "rulemaking", "regulatory variance", "state variance", "oversight", "agency", "regulatory risk", "proposed rule", "regulatory change"],
  },

  // ── Market: Geographic Opportunity ──
  {
    id: "market_geographic_opportunity",
    name: "Geographic Market Opportunity",
    domain: "market",
    facetField: "marketGrowth",
    facetValue: "moderate",
    definition: "Specific geographic markets showing opportunity signals based on population, income, demand-supply gaps, or underserved areas.",
    semanticTerms: ["high opportunity market", "opportunity score", "population", "median income", "underserved", "market gap", "geographic opportunity", "metro", "state", "region", "census", "demographic", "market size", "addressable market"],
  },

  // ── Market: Competitive Intelligence ──
  {
    id: "competitive_intelligence",
    name: "Competitive Intelligence / Competitor Data",
    domain: "market",
    facetField: "competitiveDensity",
    facetValue: "moderate",
    definition: "Direct competitor data including names, pricing, positioning, and market share. Competitive landscape analysis.",
    semanticTerms: ["competitor", "competitive analysis", "market share", "competitor pricing", "competitive landscape", "rival", "alternative", "substitute", "incumbent", "market position", "competitive advantage", "differentiation"],
  },

  // ── Demand Facets ──
  {
    id: "demand_awareness_gap",
    name: "Customer Awareness Gap",
    domain: "demand",
    facetField: "awarenessGap",
    facetValue: true,
    definition: "Potential customers are unaware of the product, service, or brand. Discovery and visibility are challenges.",
    semanticTerms: ["awareness gap", "unaware", "unknown", "low visibility", "brand recognition", "discovery problem", "hard to find", "marketing challenge", "lead generation"],
  },
  {
    id: "demand_access_geographic",
    name: "Geographic Access Barrier",
    domain: "demand",
    facetField: "accessConstraint",
    facetValue: "geographic",
    definition: "Customers cannot physically access the service due to location, distance, or lack of local availability.",
    semanticTerms: ["access barrier", "geographic limit", "underserved area", "food desert", "care desert", "transportation barrier", "rural", "remote", "distance", "commute"],
  },
  {
    id: "demand_access_financial",
    name: "Financial Access Barrier",
    domain: "demand",
    facetField: "accessConstraint",
    facetValue: "financial",
    definition: "Customers cannot afford the product or service. Price is a barrier to adoption.",
    semanticTerms: ["too expensive", "cannot afford", "price barrier", "cost prohibitive", "uninsured", "out of pocket", "deductible", "financial barrier", "price sensitive", "budget constrained", "affordability"],
  },
  {
    id: "demand_churn",
    name: "Customer Churn / Retention Problem",
    domain: "demand",
    facetField: "motivationDecay",
    facetValue: true,
    definition: "Customers drop off, cancel, or fail to return. Retention and re-engagement are challenges.",
    semanticTerms: ["churn", "attrition", "cancel", "drop off", "retention problem", "customer loss", "member cancel", "don't return", "lose interest", "motivation decay", "lapsed", "inactive"],
  },
  {
    id: "demand_trust",
    name: "Trust / Credibility Barrier",
    domain: "demand",
    facetField: "trustBarrier",
    facetValue: true,
    definition: "Customers hesitate due to lack of trust, poor reputation, or need for social proof.",
    semanticTerms: ["trust", "skepticism", "credibility", "reputation", "reviews", "word of mouth", "referral", "social proof", "testimonial", "online rating", "unproven", "risk averse"],
  },

  // ── Demand: Customer Acquisition ──
  {
    id: "demand_acquisition_cost",
    name: "High Customer Acquisition Cost",
    domain: "demand",
    facetField: "awarenessGap",
    facetValue: true,
    definition: "Acquiring new customers is expensive relative to lifetime value. Marketing, sales, and lead generation costs are high.",
    semanticTerms: ["customer acquisition", "CAC", "acquisition cost", "cost per lead", "marketing spend", "sales cost", "lead generation", "conversion rate", "funnel", "pipeline", "advertising", "outreach", "cold call"],
  },

  // ── Business: Strategic Risk / Vulnerability ──
  {
    id: "strategic_vulnerability",
    name: "Strategic Vulnerability / Fragility",
    domain: "business",
    facetField: "operationalBottleneck",
    facetValue: { process: "strategic resilience", constraint: "fragility" },
    definition: "Business model has structural vulnerabilities, fragility risks, blocking uncertainties, or feasibility gaps that threaten viability.",
    semanticTerms: ["vulnerability", "fragility", "risk", "red team", "feasibility", "blocking", "uncertainty", "threat", "weakness", "exposure", "disruption risk", "model risk", "execution risk", "confidence", "decision grade", "viability"],
  },

  // ── Business: Technology / Innovation Opportunity ──
  {
    id: "technology_opportunity",
    name: "Technology / Innovation Opportunity",
    domain: "business",
    facetField: "operationalBottleneck",
    facetValue: { process: "technology adoption", constraint: "innovation gap" },
    definition: "Opportunity to leverage technology, innovation, or digital transformation to improve operations, reduce costs, or create new value.",
    semanticTerms: ["technology", "innovation", "digital transformation", "automation opportunity", "software solution", "platform", "SaaS", "AI", "machine learning", "data analytics", "IoT", "mobile app", "online", "digital", "modernize", "upgrade", "novel approach", "competitive advantage"],
  },
];

// ═══════════════════════════════════════════════════════════════
//  TF-IDF ENGINE
// ═══════════════════════════════════════════════════════════════

/** Tokenize text into normalized terms */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2)
    .map(t => t.replace(/-/g, ""));
}

/** Build term frequency map */
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  // Normalize by max frequency
  const maxFreq = Math.max(...tf.values(), 1);
  for (const [k, v] of tf) {
    tf.set(k, v / maxFreq);
  }
  return tf;
}

/** Pre-computed IDF across the facet corpus */
let _idfCache: Map<string, number> | null = null;
let _conceptVectors: Map<string, Map<string, number>> | null = null;

function getIDF(): Map<string, number> {
  if (_idfCache) return _idfCache;

  const docCount = FACET_CONCEPTS.length;
  const docFreq = new Map<string, number>();

  for (const concept of FACET_CONCEPTS) {
    const text = `${concept.definition} ${concept.semanticTerms.join(" ")}`;
    const uniqueTokens = new Set(tokenize(text));
    for (const t of uniqueTokens) {
      docFreq.set(t, (docFreq.get(t) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, df] of docFreq) {
    idf.set(term, Math.log((docCount + 1) / (df + 1)) + 1);
  }

  _idfCache = idf;
  return idf;
}

function getConceptVectors(): Map<string, Map<string, number>> {
  if (_conceptVectors) return _conceptVectors;

  const idf = getIDF();
  const vectors = new Map<string, Map<string, number>>();

  for (const concept of FACET_CONCEPTS) {
    const text = `${concept.definition} ${concept.semanticTerms.join(" ")}`;
    const tokens = tokenize(text);
    const tf = termFrequency(tokens);
    const tfidf = new Map<string, number>();

    for (const [term, tfVal] of tf) {
      const idfVal = idf.get(term) || 1;
      tfidf.set(term, tfVal * idfVal);
    }

    vectors.set(concept.id, tfidf);
  }

  _conceptVectors = vectors;
  return vectors;
}

/** Cosine similarity between two term vectors */
function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const [term, val] of a) {
    magA += val * val;
    const bVal = b.get(term);
    if (bVal !== undefined) {
      dot += val * bVal;
    }
  }

  for (const [, val] of b) {
    magB += val * val;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ═══════════════════════════════════════════════════════════════
//  SEMANTIC MATCHING
// ═══════════════════════════════════════════════════════════════

export interface SemanticFacetMatch {
  conceptId: string;
  conceptName: string;
  domain: "business" | "market" | "demand";
  facetField: string;
  facetValue: any;
  /** Cosine similarity score (0–1) */
  similarity: number;
  /** Adjusted confidence after combining pattern + semantic signals */
  confidence: number;
}

/** Minimum similarity threshold for a semantic match */
const SIMILARITY_THRESHOLD = 0.12;

/** Maximum matches per evidence item */
const MAX_MATCHES = 5;

/**
 * Compute semantic similarity between evidence text and all facet concepts.
 * Returns ranked matches above the similarity threshold.
 */
export function semanticMatch(evidenceText: string): SemanticFacetMatch[] {
  const idf = getIDF();
  const conceptVecs = getConceptVectors();

  const tokens = tokenize(evidenceText);
  const tf = termFrequency(tokens);
  const evidenceVec = new Map<string, number>();

  for (const [term, tfVal] of tf) {
    const idfVal = idf.get(term) || 1;
    evidenceVec.set(term, tfVal * idfVal);
  }

  const matches: SemanticFacetMatch[] = [];

  for (const concept of FACET_CONCEPTS) {
    const conceptVec = conceptVecs.get(concept.id);
    if (!conceptVec) continue;

    const similarity = cosineSimilarity(evidenceVec, conceptVec);
    if (similarity >= SIMILARITY_THRESHOLD) {
      matches.push({
        conceptId: concept.id,
        conceptName: concept.name,
        domain: concept.domain,
        facetField: concept.facetField,
        facetValue: concept.facetValue,
        similarity,
        confidence: similarity, // Will be adjusted in merging step
      });
    }
  }

  // Sort by similarity descending, limit to top matches
  matches.sort((a, b) => b.similarity - a.similarity);
  return matches.slice(0, MAX_MATCHES);
}

// ═══════════════════════════════════════════════════════════════
//  MULTI-FACET ASSEMBLY
// ═══════════════════════════════════════════════════════════════

export interface MultiFacetResult {
  /** Primary (highest confidence) facets object for backward compatibility */
  primaryFacets: EvidenceFacets | null;
  /** All matched facet concepts with confidence scores */
  matches: SemanticFacetMatch[];
  /** Whether primary facets came from pattern (true) or semantic (false) */
  patternMatched: boolean;
}

/**
 * Combine pattern-based and semantic facet extraction.
 * Pattern matches get a confidence boost (they're more precise).
 * Semantic matches fill gaps for evidence patterns miss.
 */
export function extractMultiFacets(
  evidenceText: string,
  patternFacets: EvidenceFacets | null,
): MultiFacetResult {
  const semanticMatches = semanticMatch(evidenceText);

  if (patternFacets) {
    // Boost confidence of semantic matches that agree with patterns
    const boosted = semanticMatches.map(m => {
      const domain = patternFacets.domain;
      if (m.domain === domain) {
        return { ...m, confidence: Math.min(1, m.similarity * 1.3 + 0.2) };
      }
      return { ...m, confidence: Math.min(1, m.similarity * 0.9) };
    });

    return {
      primaryFacets: patternFacets,
      matches: boosted,
      patternMatched: true,
    };
  }

  // No pattern match — use best semantic match as primary
  if (semanticMatches.length > 0) {
    const best = semanticMatches[0];
    const primaryFacets = buildFacetsFromConcept(best);

    // Adjust confidence: semantic-only gets moderate confidence
    const adjusted = semanticMatches.map(m => ({
      ...m,
      confidence: Math.min(1, m.similarity * 1.1),
    }));

    return {
      primaryFacets,
      matches: adjusted,
      patternMatched: false,
    };
  }

  return { primaryFacets: null, matches: [], patternMatched: false };
}

/**
 * Build an EvidenceFacets object from a semantic match.
 */
function buildFacetsFromConcept(match: SemanticFacetMatch): EvidenceFacets {
  if (match.domain === "business") {
    const facets: BusinessFacets = { domain: "business" };
    (facets as any)[match.facetField] = match.facetValue;
    return facets;
  }
  if (match.domain === "market") {
    const facets: MarketFacets = { domain: "market" };
    (facets as any)[match.facetField] = match.facetValue;
    return facets;
  }
  // demand
  const facets: DemandFacets = { domain: "demand" };
  (facets as any)[match.facetField] = match.facetValue;
  return facets;
}
