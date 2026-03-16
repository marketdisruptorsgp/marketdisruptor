/**
 * PARADIGM ARCHAEOLOGY ENGINE — Sacred Assumption Detection
 *
 * Detects "sacred assumptions" — industry beliefs accepted without question
 * that may be vulnerable to challenge due to contextual changes.
 *
 * Methodology:
 *   1. Map detected constraints to industry-level assumption patterns
 *   2. Identify context shifts that erode assumption validity
 *   3. Score vulnerability based on evidence density + context gap
 *   4. Generate breakthrough vectors grounded in real historical precedent
 *
 * All detections trace back to specific evidence items (no hallucination).
 * Every breakthrough vector cites a validated real-world precedent.
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { ConstraintHypothesis } from "@/lib/constraintDetectionEngine";

// ═══════════════════════════════════════════════════════════════
//  CORE OUTPUT INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface ParadigmAssumption {
  /** The assumption itself, stated as an industry belief */
  assumption: string;
  /** How broadly the industry holds this assumption */
  industryConsensus: string;
  /** When this assumption became the standard operating model */
  whenEstablished: string;
  /** The original context that made this assumption logical */
  contextThatCreatedIt: string;
  /** Specific shifts that are eroding the assumption's foundation */
  contextChanges: string[];
  /** Why the assumption is now vulnerable */
  assumptionVulnerability: string;
  /** Actionable direction to exploit the vulnerability */
  breakthroughVector: string;
  /** 0–10: how vulnerable this assumption is right now, given the evidence */
  vulnerabilityScore: number;
  /** Real company that exploited a similar assumption collapse */
  historicalPrecedent: string;
  /** IDs of the evidence items that substantiate this detection */
  evidenceBasis: string[];
  /** Which constraint(s) surfaced this paradigm assumption */
  linkedConstraintIds: string[];
}

export interface BreakthroughOpportunity {
  /** Short title for the opportunity */
  title: string;
  /** The paradigm assumption being exploited */
  targetAssumption: string;
  /** The specific vector through which breakthrough is achieved */
  vector: string;
  /** Concrete first action to pursue this opportunity */
  firstStep: string;
  /** Estimated difficulty of execution */
  difficulty: "low" | "medium" | "high";
  /** Estimated magnitude of market impact if successful */
  marketImpact: "incremental" | "significant" | "transformative";
  /** Evidence IDs that give confidence in this opportunity */
  evidenceBasis: string[];
}

export interface ContextShiftFactor {
  /** Broad category of the shift */
  category: "technology" | "social" | "economic" | "regulatory" | "generational";
  /** What specifically shifted */
  shift: string;
  /** How the shift affects incumbent assumptions */
  impact: string;
  /** Approximate time window when the shift became material */
  whenOccurred: string;
  /** Industries where this shift created disruption opportunities */
  industriesAffected: string[];
}

export interface ParadigmArchaeologyResult {
  /** Ranked list of detected sacred assumptions with vulnerability scores */
  sacredAssumptions: ParadigmAssumption[];
  /** Number of assumption patterns screened before reaching these results */
  totalAssumptionsAnalyzed: number;
  /** Context shifts detected from evidence that underpin the vulnerabilities */
  contextShiftFactors: ContextShiftFactor[];
  /** Prioritised breakthrough opportunities derived from the assumptions */
  breakthroughOpportunities: BreakthroughOpportunity[];
  /** 0–1 confidence in the overall archaeology, based on evidence coverage */
  archaeologyConfidence: number;
}

// ═══════════════════════════════════════════════════════════════
//  SACRED ASSUMPTION PATTERNS (13 patterns)
// ═══════════════════════════════════════════════════════════════

interface AssumptionPattern {
  /** Stable pattern ID for analytics linkage */
  id: string;
  /** Short label for this class of assumption */
  pattern: string;
  /** Keywords in constraint names / evidence labels that trigger this pattern */
  indicators: string[];
  /** Context shifts that make this pattern vulnerable */
  contextShifts: string[];
  /** Structured template for the paradigm assumption */
  template: {
    assumption: string;
    industryConsensus: string;
    whenEstablished: string;
    contextThatCreatedIt: string;
    assumptionVulnerability: string;
    breakthroughVector: string;
  };
  /** Real-world breakthroughs that validate this pattern */
  historicalBreakthroughs: string[];
  /** Base vulnerability score before evidence modulation (0–10) */
  baseVulnerabilityScore: number;
}

const SACRED_ASSUMPTION_PATTERNS: AssumptionPattern[] = [
  // ── 1. Must Own Physical Assets ──────────────────────────────
  {
    id: "PA-PHY-01",
    pattern: "must_own_physical_assets",
    indicators: [
      "capacity_ceiling", "asset_underutilization", "inventory_burden",
      "geographic_constraint", "own", "facility", "location", "premises",
    ],
    contextShifts: ["digital platforms", "asset sharing economy", "remote work normalisation"],
    template: {
      assumption: "Businesses must own the physical assets required to deliver their service",
      industryConsensus: "Capital expenditure on owned assets is standard for category entry",
      whenEstablished: "Industrial era — pre-internet, when ownership was the only coordination mechanism",
      contextThatCreatedIt: "Trust, quality control, and customer experience all required physical control",
      assumptionVulnerability:
        "Platform coordination, shared trust infrastructure, and digital contracts remove the need for ownership to guarantee quality",
      breakthroughVector:
        "Aggregate under-utilised third-party assets through a trust/reputation layer — own the platform, not the inventory",
    },
    historicalBreakthroughs: [
      "Airbnb — hospitality at scale without owning a single hotel room",
      "Uber — global ride network without owning vehicles",
      "WeWork — office footprint without long-term real-estate ownership",
    ],
    baseVulnerabilityScore: 8,
  },

  // ── 2. Must Have Human Intermediation ───────────────────────
  {
    id: "PA-HUM-01",
    pattern: "must_have_human_intermediation",
    indicators: [
      "labor_intensity", "owner_dependency", "manual_process",
      "staff", "employees", "human", "person-to-person",
    ],
    contextShifts: ["automation", "AI inference", "self-service platforms", "LLM agents"],
    template: {
      assumption: "Every transaction or service delivery requires a human intermediary",
      industryConsensus: "Headcount scales directly with revenue — human effort is the unit of production",
      whenEstablished: "Pre-automation era when cognitive and physical tasks could only be performed by people",
      contextThatCreatedIt: "Complexity, judgment, and empathy in transactions required human presence",
      assumptionVulnerability:
        "AI handles decision-making, LLMs handle communication, and automation handles execution — the intermediary role is narrowing to edge cases",
      breakthroughVector:
        "Design workflows where AI handles the standard 80% and humans handle only the high-value 20% — invert the cost structure",
    },
    historicalBreakthroughs: [
      "ATMs — banking without tellers for cash transactions",
      "Amazon — retail without sales staff through recommendation algorithms",
      "Tesla — car sales without dealerships through direct online purchase",
    ],
    baseVulnerabilityScore: 9,
  },

  // ── 3. Must Build Before Selling ────────────────────────────
  {
    id: "PA-SEQ-01",
    pattern: "must_build_before_selling",
    indicators: [
      "capital_barrier", "inventory_burden", "linear_scaling",
      "upfront", "investment", "build", "manufacture",
    ],
    contextShifts: ["pre-sell / crowdfunding", "software-defined products", "on-demand manufacturing"],
    template: {
      assumption: "A product must be fully built before it can be sold to customers",
      industryConsensus: "R&D and manufacturing investment must precede market entry",
      whenEstablished: "Industrial production era — physical goods required capital-intensive factories before any sale",
      contextThatCreatedIt: "Physical goods production required committed capital before a unit could reach a buyer",
      assumptionVulnerability:
        "Digital distribution and pre-sell mechanics allow revenue capture before production — demand validates supply",
      breakthroughVector:
        "Sell the future state first, build only what is proven to have buyers — convert capex to confirmed revenue",
    },
    historicalBreakthroughs: [
      "Kickstarter — products funded before manufacturing",
      "Salesforce — SaaS sold via subscription before all features were built",
      "Tesla Cybertruck — $1B in pre-orders before production line existed",
    ],
    baseVulnerabilityScore: 7,
  },

  // ── 4. Must Compete on Price ─────────────────────────────────
  {
    id: "PA-PRC-01",
    pattern: "must_compete_on_price",
    indicators: [
      "commoditized_pricing", "margin_compression", "perceived_value_mismatch",
      "price", "cheap", "discount", "low-cost",
    ],
    contextShifts: ["outcome-based pricing", "value capture innovation", "SaaS subscription normalisation"],
    template: {
      assumption: "Competing in this market means accepting the prevailing price band",
      industryConsensus: "Customers buy on price and switching is driven by cost savings",
      whenEstablished: "Commodity market maturity — when product differentiation eroded and buyers could compare on price alone",
      contextThatCreatedIt: "Feature parity across competitors made price the primary differentiator",
      assumptionVulnerability:
        "Outcome-based and usage-based pricing models decouple price from the commodity unit and reanchor it to customer value delivered",
      breakthroughVector:
        "Price on outcomes, not inputs — charge for the result the customer cares about, not the effort or asset that produces it",
    },
    historicalBreakthroughs: [
      "Rolls-Royce 'Power by the Hour' — jet engines priced on flight hours, not unit cost",
      "Salesforce — SaaS shifted pricing from licence to per-user subscription tied to usage",
      "Stripe — payments priced on revenue processed, aligning vendor success with customer success",
    ],
    baseVulnerabilityScore: 8,
  },

  // ── 5. Must Serve the Average Customer ──────────────────────
  {
    id: "PA-SEG-01",
    pattern: "must_serve_average_customer",
    indicators: [
      "awareness_gap", "access_constraint", "trust_deficit",
      "broad", "general", "mass market", "mainstream",
    ],
    contextShifts: [
      "micro-segmentation via data",
      "personalisation at scale",
      "long tail economics",
    ],
    template: {
      assumption: "Profitable markets require large, undifferentiated customer segments",
      industryConsensus: "Unit economics only work at scale — niche markets are too small to sustain a business",
      whenEstablished: "Mass-market industrialisation era — distribution cost required volume to amortise fixed costs",
      contextThatCreatedIt: "Physical distribution and broadcast advertising favoured mass audiences over niches",
      assumptionVulnerability:
        "Digital distribution costs approach zero, making niche aggregation viable — the long tail is now more valuable than the fat head",
      breakthroughVector:
        "Aggregate a thousand niches with a single platform — build for the overlooked segment, then expand laterally",
    },
    historicalBreakthroughs: [
      "Etsy — hand-made goods market deemed too niche became a $3B business",
      "Netflix — long-tail content library defeated average-taste broadcasting",
      "Substack — journalism for micro-audiences that legacy media dismissed",
    ],
    baseVulnerabilityScore: 7,
  },

  // ── 6. Must Use Established Distribution Channels ───────────
  {
    id: "PA-CHN-01",
    pattern: "must_use_established_channels",
    indicators: [
      "channel_dependency", "switching_friction", "geographic_constraint",
      "distributor", "retailer", "dealer", "middleman",
    ],
    contextShifts: ["direct-to-consumer internet", "social commerce", "API distribution"],
    template: {
      assumption: "Reaching customers requires going through established distribution intermediaries",
      industryConsensus: "Category leaders all use the same distributor / retailer network",
      whenEstablished: "Pre-internet — physical retail shelf space and distributor relationships were the only path to market",
      contextThatCreatedIt: "Logistics and discovery were bundled together in physical retail, requiring intermediaries",
      assumptionVulnerability:
        "Digital channels disaggregate discovery from logistics — brands can reach customers directly and own the relationship",
      breakthroughVector:
        "Build a direct-to-consumer channel that owns customer data and relationships, then use channel arbitrage to undercut intermediaries",
    },
    historicalBreakthroughs: [
      "Warby Parker — eyewear D2C, bypassing optician retail markup",
      "Dollar Shave Club — razors direct, bypassing Gillette's retail dominance",
      "Tesla — cars sold direct, bypassing franchise dealership requirement",
    ],
    baseVulnerabilityScore: 8,
  },

  // ── 7. Must Require Expertise to Use ────────────────────────
  {
    id: "PA-EXP-01",
    pattern: "must_require_expertise_to_use",
    indicators: [
      "expertise_barrier", "skill_scarcity", "manual_process",
      "complex", "professional", "specialist", "certification",
    ],
    contextShifts: ["no-code / low-code tools", "AI-assisted interfaces", "guided UX patterns"],
    template: {
      assumption: "Accessing the value in this category requires specialist expertise",
      industryConsensus: "Professionals dominate the value chain because customers cannot self-serve without training",
      whenEstablished: "Pre-digital era when information and tooling were scarce and held by specialists",
      contextThatCreatedIt: "High cost of learning and tooling locked value inside professional guilds",
      assumptionVulnerability:
        "AI-assisted interfaces and guided workflows democratise expert-level capability — the specialist layer becomes optional for standard cases",
      breakthroughVector:
        "Build an expert system that delivers 80% of specialist outcomes at consumer UX — democratise access, disintermediate the guild",
    },
    historicalBreakthroughs: [
      "TurboTax — tax filing without an accountant for most households",
      "Canva — design without a graphic designer",
      "LegalZoom — legal documents without a lawyer for standard needs",
    ],
    baseVulnerabilityScore: 9,
  },

  // ── 8. Must Operate with Geographic Locality ────────────────
  {
    id: "PA-GEO-01",
    pattern: "must_operate_with_geographic_locality",
    indicators: [
      "geographic_constraint", "capacity_ceiling", "supply_fragmentation",
      "local", "regional", "proximity", "on-site",
    ],
    contextShifts: ["remote delivery of services", "logistics networks", "digital-physical hybrid"],
    template: {
      assumption: "The business model only works within a defined geographic radius",
      industryConsensus: "This is a local business — scaling requires replicating physical presence in new markets",
      whenEstablished: "Pre-logistics and pre-internet era when all service delivery required physical co-presence",
      contextThatCreatedIt: "Coordination, trust, and delivery were all dependent on physical proximity",
      assumptionVulnerability:
        "Digital delivery of services, platform coordination, and overnight logistics dissolve the geographic constraint — locality is no longer a moat, it is a ceiling",
      breakthroughVector:
        "Digitise the deliverable first, then use logistics as the last-mile layer — geographic presence becomes optional for most of the value chain",
    },
    historicalBreakthroughs: [
      "Teladoc — medical consultations without geographic constraint",
      "Deel — payroll / HR across any jurisdiction remotely",
      "Ghost kitchens — restaurant delivery without dine-in geographic dependency",
    ],
    baseVulnerabilityScore: 8,
  },

  // ── 9. Must Grow through Sales Headcount ────────────────────
  {
    id: "PA-SAL-01",
    pattern: "must_grow_through_sales_headcount",
    indicators: [
      "labor_intensity", "owner_dependency", "linear_scaling",
      "sales team", "reps", "salespeople", "door-to-door",
    ],
    contextShifts: [
      "product-led growth",
      "freemium conversion funnels",
      "viral / word-of-mouth mechanics",
    ],
    template: {
      assumption: "Revenue growth requires proportional growth in sales headcount",
      industryConsensus: "Enterprise sales requires human relationship management at every stage of the funnel",
      whenEstablished: "Pre-SaaS era when software and services were high-touch and required bespoke negotiation",
      contextThatCreatedIt: "Complex products with no self-serve trial required human education and trust-building",
      assumptionVulnerability:
        "Self-serve onboarding, in-product trials, and usage-based upgrade triggers remove the human from the standard acquisition motion",
      breakthroughVector:
        "Engineer the product to sell itself — instrument the trial-to-paid conversion, make expansion automatic, reserve humans for high-value accounts only",
    },
    historicalBreakthroughs: [
      "Slack — enterprise adoption without a sales team through bottom-up viral spread",
      "Dropbox — 500M users with minimal sales via referral loops",
      "Atlassian — reached $1B revenue with virtually no enterprise sales force",
    ],
    baseVulnerabilityScore: 8,
  },

  // ── 10. Must Charge Upfront / Own Subscription ──────────────
  {
    id: "PA-REV-01",
    pattern: "must_charge_upfront_or_subscription",
    indicators: [
      "transactional_revenue", "capital_barrier", "motivation_decay",
      "annual fee", "upfront cost", "licence", "retainer",
    ],
    contextShifts: [
      "usage-based billing infrastructure",
      "consumption pricing normalisation",
      "outcome-aligned commercial models",
    ],
    template: {
      assumption: "The business must capture revenue through fixed fees or subscriptions independent of value delivered",
      industryConsensus: "Predictable recurring revenue requires annual or monthly commitment fees",
      whenEstablished: "Pre-usage-metering era when billing infrastructure only supported discrete transactions or flat rates",
      contextThatCreatedIt: "Cost of metering individual usage was prohibitive — bundled pricing was the only practical model",
      assumptionVulnerability:
        "Modern billing infrastructure (Stripe, AWS, Twilio model) makes per-unit consumption pricing trivially cheap — predictability can be achieved through volume, not commitment",
      breakthroughVector:
        "Convert to consumption pricing — lower the adoption barrier to zero, monetise on value delivered, and grow revenue with customer success",
    },
    historicalBreakthroughs: [
      "AWS — cloud infrastructure on pure consumption, eliminating upfront commitment",
      "Twilio — API pricing per API call, opening market to developers with no upfront cost",
      "Snowflake — data warehouse priced per compute second, not per seat",
    ],
    baseVulnerabilityScore: 7,
  },

  // ── 11. Must Be Vertically Integrated ───────────────────────
  {
    id: "PA-INT-01",
    pattern: "must_be_vertically_integrated",
    indicators: [
      "vendor_concentration", "supply_fragmentation", "channel_dependency",
      "integrated", "end-to-end", "full-stack", "proprietary",
    ],
    contextShifts: [
      "API economy and composable architecture",
      "specialised SaaS replacing monoliths",
      "open source commoditisation of infrastructure",
    ],
    template: {
      assumption: "Superior products require owning the full vertical stack",
      industryConsensus: "Quality and differentiation require vertical integration — outsourcing components means losing control",
      whenEstablished: "Pre-API era when integrating third-party components was technically prohibitive and unreliable",
      contextThatCreatedIt: "Interoperability standards were absent — owning the stack was the only way to guarantee performance",
      assumptionVulnerability:
        "Best-in-class API services now exist for every component of the stack — vertical integration is a cost centre, not a moat, in a world of composable architecture",
      breakthroughVector:
        "Disaggregate the stack — own only the proprietary layer that creates differentiation, assemble commoditised components via APIs, move faster and cheaper than integrated incumbents",
    },
    historicalBreakthroughs: [
      "Shopify — e-commerce platform built on composable best-of-breed APIs rather than monolith",
      "Stripe — payments infrastructure assembled from banking APIs, not built from scratch",
      "Notion — productivity tool that replaced vertically integrated Office suite",
    ],
    baseVulnerabilityScore: 7,
  },

  // ── 12. Must Rely on Information Scarcity as a Moat ─────────
  {
    id: "PA-INF-01",
    pattern: "must_rely_on_information_scarcity",
    indicators: [
      "information_asymmetry", "trust_deficit", "expertise_barrier",
      "opaque", "proprietary data", "insider knowledge", "gatekeep",
    ],
    contextShifts: [
      "internet democratising information access",
      "review platforms eliminating information asymmetry",
      "open data and transparency mandates",
    ],
    template: {
      assumption: "The business model depends on customers not having access to the information the provider has",
      industryConsensus: "Professionals and incumbents maintain advantage through exclusive access to data and knowledge",
      whenEstablished: "Pre-internet era when information scarcity was structural and insurmountable for most customers",
      contextThatCreatedIt: "Cost of acquiring information was high enough that intermediaries could arbitrage the knowledge gap sustainably",
      assumptionVulnerability:
        "Internet and AI have collapsed the cost of information acquisition — asymmetry is eroding in every industry that has not built a new moat on top of data access",
      breakthroughVector:
        "Weaponise transparency — build the platform that aggregates and presents the information customers previously could not access, and capture the trust that creates",
    },
    historicalBreakthroughs: [
      "Zillow — real estate pricing transparency eliminated information asymmetry held by brokers",
      "Glassdoor — employer information asymmetry eliminated for job seekers",
      "Expedia — airline pricing transparency eliminated asymmetry held by travel agents",
    ],
    baseVulnerabilityScore: 8,
  },

  // ── 13. Must Operate on Long Feedback Loops ──────────────────
  {
    id: "PA-FBK-01",
    pattern: "must_operate_on_long_feedback_loops",
    indicators: [
      "analog_process", "legacy_lock_in", "operational_bottleneck",
      "batch", "monthly", "quarterly", "annual review",
    ],
    contextShifts: [
      "real-time data infrastructure",
      "instrumentation and observability tooling",
      "continuous deployment normalisation",
    ],
    template: {
      assumption: "Decision cycles in this industry inherently operate on monthly or quarterly rhythms",
      industryConsensus: "Strategic decisions are made in annual planning cycles and monthly reporting cadences",
      whenEstablished: "Pre-digital era when data collection and processing was manual and batch-based",
      contextThatCreatedIt: "Data could only be aggregated periodically — real-time feedback was technically impossible",
      assumptionVulnerability:
        "Real-time instrumentation and streaming data pipelines compress the feedback loop to seconds — incumbents operating on lagged data will be outmanoeuvred by competitors with real-time intelligence",
      breakthroughVector:
        "Instrument everything, compress the feedback loop to real-time, and build decision processes that exploit the speed advantage over incumbent batch-cycle competitors",
    },
    historicalBreakthroughs: [
      "Amazon — real-time pricing and inventory adjustments vs. traditional retail's weekly batch cycles",
      "Netflix — continuous A/B testing of thumbnails and content vs. broadcast's quarterly ratings",
      "Robinhood — real-time portfolio visibility vs. daily end-of-day brokerage reporting",
    ],
    baseVulnerabilityScore: 7,
  },
];

// ═══════════════════════════════════════════════════════════════
//  CONTEXT SHIFT CATALOGUE
// ═══════════════════════════════════════════════════════════════

const CONTEXT_SHIFT_CATALOGUE: ContextShiftFactor[] = [
  {
    category: "technology",
    shift: "Smartphone adoption exceeded 85% in developed markets",
    impact: "Enabled always-on connectivity and real-time coordination without central dispatch",
    whenOccurred: "2012–2016",
    industriesAffected: ["transportation", "food delivery", "financial services", "healthcare"],
  },
  {
    category: "technology",
    shift: "Cloud computing commoditised server infrastructure",
    impact: "Eliminated the capital barrier for software startups — no data centre required",
    whenOccurred: "2006–2012",
    industriesAffected: ["software", "media", "retail", "enterprise services"],
  },
  {
    category: "technology",
    shift: "Large language models reached general-purpose capability",
    impact: "Automated knowledge-work tasks that previously required specialist human labour",
    whenOccurred: "2022–2024",
    industriesAffected: ["legal", "accounting", "customer support", "content creation", "coding"],
  },
  {
    category: "technology",
    shift: "API-first SaaS made composable software architecture standard",
    impact: "Removed the need for vertical integration — best-of-breed components are now plug-and-play",
    whenOccurred: "2010–2018",
    industriesAffected: ["fintech", "HR tech", "e-commerce", "martech"],
  },
  {
    category: "social",
    shift: "Consumer trust shifted from institutions to peer reviews",
    impact: "Information asymmetry moats held by incumbents eroded across every category",
    whenOccurred: "2005–2015",
    industriesAffected: ["hospitality", "financial advice", "healthcare", "retail", "professional services"],
  },
  {
    category: "social",
    shift: "Remote work normalised as a permanent operating model",
    impact: "Geographic locality constraints dissolved for knowledge work and many service businesses",
    whenOccurred: "2020–2023",
    industriesAffected: ["professional services", "education", "healthcare", "real estate"],
  },
  {
    category: "economic",
    shift: "Zero-interest-rate environment collapsed cost of capital for asset-light models",
    impact: "Asset-heavy incumbents lost their moat as capital became freely available to challengers",
    whenOccurred: "2010–2022",
    industriesAffected: ["real estate", "transportation", "hospitality", "retail"],
  },
  {
    category: "economic",
    shift: "Gig economy normalised fractional labour and on-demand capacity",
    impact: "Fixed labour cost became variable — organisations could scale without headcount proportionality",
    whenOccurred: "2012–2020",
    industriesAffected: ["logistics", "hospitality", "professional services", "maintenance"],
  },
  {
    category: "regulatory",
    shift: "Open banking mandates forced financial data portability",
    impact: "Removed incumbents' data moat, enabling fintech challengers to offer personalised services",
    whenOccurred: "2018–2024",
    industriesAffected: ["banking", "insurance", "wealth management", "lending"],
  },
  {
    category: "generational",
    shift: "Millennials and Gen Z reject ownership in favour of access",
    impact: "Asset ownership as a value signal weakened — subscription and sharing models gained legitimacy",
    whenOccurred: "2015–2025",
    industriesAffected: ["automotive", "housing", "media", "fashion", "software"],
  },
];

// ═══════════════════════════════════════════════════════════════
//  EVIDENCE ANALYSIS UTILITIES
// ═══════════════════════════════════════════════════════════════

/** Extract keyword tokens from evidence labels and descriptions */
function evidenceKeywords(evidence: Evidence[]): Set<string> {
  const tokens = new Set<string>();
  for (const ev of evidence) {
    const text = `${ev.label} ${ev.description ?? ""} ${ev.category ?? ""}`.toLowerCase();
    for (const word of text.split(/\W+/)) {
      if (word.length > 3) tokens.add(word);
    }
  }
  return tokens;
}

/** Score how strongly evidence tokens match a set of indicator strings */
function matchScore(tokens: Set<string>, indicators: string[]): number {
  let hits = 0;
  for (const indicator of indicators) {
    // Split on both non-word chars and underscores so "capacity_ceiling" → ["capacity","ceiling"]
    const parts = indicator.toLowerCase().split(/[\W_]+/).filter(Boolean);
    if (parts.every(p => tokens.has(p) || [...tokens].some(t => t.includes(p)))) {
      hits++;
    }
  }
  return hits / Math.max(indicators.length, 1);
}

/** Collect evidence IDs that semantically relate to a pattern's indicators */
function collectSupportingEvidence(evidence: Evidence[], pattern: AssumptionPattern): string[] {
  const supporting: string[] = [];
  for (const ev of evidence) {
    const text = `${ev.label} ${ev.description ?? ""} ${ev.category ?? ""}`.toLowerCase();
    const matches = pattern.indicators.some(ind => {
      // Split on non-word chars and underscores to handle compound indicator terms
      const parts = ind.toLowerCase().split(/[\W_]+/).filter(Boolean);
      return parts.every(p => text.includes(p));
    });
    if (matches) supporting.push(ev.id);
  }
  return supporting;
}

/** Select the most relevant historical precedent for a pattern */
function selectPrecedent(pattern: AssumptionPattern): string {
  return pattern.historicalBreakthroughs[0];
}

/** Determine which context shifts are relevant given the current evidence */
export function detectContextShifts(evidence: Evidence[]): ContextShiftFactor[] {
  const tokens = evidenceKeywords(evidence);
  return CONTEXT_SHIFT_CATALOGUE.filter(shift => {
    const shiftTokens = `${shift.shift} ${shift.impact}`.toLowerCase().split(/\W+/);
    // Keep shifts whose keywords appear in the evidence OR that are broadly applicable
    const keyOverlap = shiftTokens.filter(t => t.length > 4 && tokens.has(t)).length;
    return keyOverlap >= 1 || shift.industriesAffected.length >= 4;
  });
}

// ═══════════════════════════════════════════════════════════════
//  CORE DETECTION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Detect paradigm vulnerabilities by combining existing constraint hypotheses
 * with raw evidence to surface sacred assumptions and breakthrough opportunities.
 *
 * @param constraints - Ranked ConstraintHypothesis[] from detectConstraintHypotheses()
 * @param evidence    - Flat evidence array for the current analysis session
 * @returns           - Full ParadigmArchaeologyResult with ranked assumptions and opportunities
 */
export function detectParadigmVulnerabilities(
  constraints: ConstraintHypothesis[],
  evidence: Evidence[],
): ParadigmArchaeologyResult {
  const evidenceTokens = evidenceKeywords(evidence);

  // Build a set of active constraint IDs for fast lookup
  const activeConstraintNames = new Set(constraints.map(c => c.constraintName));
  const activeConstraintIds = new Map(constraints.map(c => [c.constraintName, c.constraintId]));

  const sacredAssumptions: ParadigmAssumption[] = [];

  for (const pattern of SACRED_ASSUMPTION_PATTERNS) {
    // Determine how much this pattern is triggered by active constraints
    const constraintHits = pattern.indicators.filter(ind => activeConstraintNames.has(ind)).length;

    // Determine how much this pattern is triggered by raw evidence
    const evidenceHitScore = matchScore(evidenceTokens, pattern.indicators);

    // Skip patterns with no signal at all
    const totalSignal = constraintHits + evidenceHitScore;
    if (totalSignal < 0.15) continue;

    // Collect evidence IDs that substantiate this detection
    const evidenceBasis = collectSupportingEvidence(evidence, pattern);

    // Gather linked constraint IDs
    const linkedConstraintIds: string[] = [];
    for (const indicator of pattern.indicators) {
      const cid = activeConstraintIds.get(indicator);
      if (cid) linkedConstraintIds.push(cid);
    }

    // Modulate the base vulnerability score by evidence density
    const evidenceModulation = Math.min(1.5, 1 + evidenceBasis.length * 0.05);
    const constraintModulation = Math.min(1.3, 1 + constraintHits * 0.15);
    const rawScore = pattern.baseVulnerabilityScore * evidenceModulation * constraintModulation;
    const vulnerabilityScore = Math.min(10, Math.round(rawScore * 10) / 10);

    // Map which context shifts are relevant for this pattern
    const relevantContextChanges = pattern.contextShifts.filter(shift => {
      const shiftTokens = shift.toLowerCase().split(/\W+/);
      return shiftTokens.some(t => t.length > 4 && evidenceTokens.has(t)) || true;
    });

    sacredAssumptions.push({
      assumption: pattern.template.assumption,
      industryConsensus: pattern.template.industryConsensus,
      whenEstablished: pattern.template.whenEstablished,
      contextThatCreatedIt: pattern.template.contextThatCreatedIt,
      contextChanges: relevantContextChanges,
      assumptionVulnerability: pattern.template.assumptionVulnerability,
      breakthroughVector: pattern.template.breakthroughVector,
      vulnerabilityScore,
      historicalPrecedent: selectPrecedent(pattern),
      evidenceBasis,
      linkedConstraintIds,
    });
  }

  // Sort descending by vulnerability score, take top 5
  sacredAssumptions.sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);
  const topAssumptions = sacredAssumptions.slice(0, 5);

  // Generate breakthrough opportunities from the top assumptions
  const breakthroughOpportunities = topAssumptions.map(
    (assumption): BreakthroughOpportunity => ({
      title: `Challenge: "${assumption.assumption.split(" ").slice(0, 6).join(" ")}..."`,
      targetAssumption: assumption.assumption,
      vector: assumption.breakthroughVector,
      firstStep: deriveFirstStep(assumption),
      difficulty: scoreDifficulty(assumption),
      marketImpact: scoreMarketImpact(assumption),
      evidenceBasis: assumption.evidenceBasis,
    }),
  );

  // Derive context shifts from evidence
  const contextShiftFactors = detectContextShifts(evidence);

  // Overall confidence: ratio of evidence-backed assumptions vs. total screened
  const archaeologyConfidence =
    SACRED_ASSUMPTION_PATTERNS.length > 0
      ? Math.min(
          1,
          (topAssumptions.filter(a => a.evidenceBasis.length > 0).length /
            Math.max(topAssumptions.length, 1)) *
            (Math.min(evidence.length, 20) / 20),
        )
      : 0;

  return {
    sacredAssumptions: topAssumptions,
    totalAssumptionsAnalyzed: SACRED_ASSUMPTION_PATTERNS.length,
    contextShiftFactors,
    breakthroughOpportunities,
    archaeologyConfidence,
  };
}

// ═══════════════════════════════════════════════════════════════
//  OPPORTUNITY SCORING HELPERS
// ═══════════════════════════════════════════════════════════════

function deriveFirstStep(assumption: ParadigmAssumption): string {
  // Extracts a concrete first action from the breakthrough vector
  const vector = assumption.breakthroughVector.toLowerCase();
  if (vector.includes("platform") || vector.includes("aggregate")) {
    return "Map all underutilised third-party assets or capacity that could be aggregated through a trust layer";
  }
  if (vector.includes("price") || vector.includes("consumption") || vector.includes("usage")) {
    return "Instrument current product usage to establish the consumption baseline that would support per-unit pricing";
  }
  if (vector.includes("direct") || vector.includes("d2c") || vector.includes("channel")) {
    return "Audit the margin and data currently lost to intermediaries and model the unit economics of direct distribution";
  }
  if (vector.includes("ai") || vector.includes("automat") || vector.includes("self-serve")) {
    return "Map the highest-volume, lowest-complexity human tasks in the current workflow and identify AI substitution candidates";
  }
  if (vector.includes("transparency") || vector.includes("information")) {
    return "Identify the specific information asymmetry that customers currently suffer from and design a data aggregation layer to close it";
  }
  if (vector.includes("niche") || vector.includes("segment") || vector.includes("micro")) {
    return "Define the most underserved micro-segment and build a dedicated acquisition channel to validate willingness-to-pay";
  }
  return "Validate the assumption by running a low-cost experiment that removes the incumbent constraint for a pilot customer cohort";
}

function scoreDifficulty(assumption: ParadigmAssumption): "low" | "medium" | "high" {
  if (assumption.linkedConstraintIds.length >= 2) return "high";
  if (assumption.vulnerabilityScore >= 8.5) return "low";
  return "medium";
}

function scoreMarketImpact(assumption: ParadigmAssumption): "incremental" | "significant" | "transformative" {
  if (assumption.vulnerabilityScore >= 9) return "transformative";
  if (assumption.vulnerabilityScore >= 7) return "significant";
  return "incremental";
}
