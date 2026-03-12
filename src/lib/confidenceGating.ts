/**
 * CONFIDENCE GATING SYSTEM
 * 
 * Determines data reliability and converts low-confidence areas
 * into research questions instead of fabricated insights.
 * 
 * Every insight is tagged: SCRAPED | PARAMETRIC | AI_INFERRED | USER_INPUT
 */

export type DataConfidenceLevel = "verified" | "scraped" | "parametric" | "ai_inferred" | "user_input";

export interface ConfidenceTag {
  level: DataConfidenceLevel;
  source: string;
  reasoning: string;
  /** 0-1 confidence score */
  score: number;
}

export interface ResearchQuestion {
  /** The question to investigate */
  question: string;
  /** Why this matters */
  rationale: string;
  /** What data would answer it */
  dataNeeded: string;
  /** Priority: high = directly impacts viability, medium = improves precision, low = nice to have */
  priority: "high" | "medium" | "low";
  /** Which analysis area this affects */
  affectedArea: "pricing" | "supply_chain" | "competitive" | "technical" | "regulatory" | "market_size" | "customer";
}

export interface ConfidenceAssessment {
  /** Overall data reliability for this analysis */
  overallScore: number;
  /** Per-area breakdown */
  areas: {
    area: string;
    confidence: DataConfidenceLevel;
    score: number;
    hasRealData: boolean;
    source: string;
  }[];
  /** Generated research questions for low-confidence areas */
  researchQuestions: ResearchQuestion[];
  /** Summary: what we know vs what we're guessing */
  knownVsInferred: {
    knownCount: number;
    inferredCount: number;
    ratio: number;
  };
}

/**
 * Assess data confidence based on what upstream intelligence was available.
 * Returns per-area confidence levels and research questions for gaps.
 */
export function assessDataConfidence(
  upstreamIntel: Record<string, unknown> | null | undefined,
  decomposition: Record<string, unknown> | null | undefined,
  productContext: { name?: string; category?: string; description?: string } | null,
): ConfidenceAssessment {
  const areas: ConfidenceAssessment["areas"] = [];
  const researchQuestions: ResearchQuestion[] = [];

  const intel = upstreamIntel || {};
  const name = productContext?.name || "this product";
  const category = productContext?.category || "this category";

  // ── Pricing ──
  const hasPricing = !!(intel.pricingIntel || (intel as any).pricing);
  areas.push({
    area: "Pricing Model",
    confidence: hasPricing ? "scraped" : "ai_inferred",
    score: hasPricing ? 0.7 : 0.25,
    hasRealData: hasPricing,
    source: hasPricing ? "Scraped from market data" : "AI inference only",
  });
  if (!hasPricing) {
    researchQuestions.push({
      question: `What is the actual pricing structure across ${category}? Is the dominant pricing model subscription, one-time, or per-use?`,
      rationale: "Without verified pricing data, any pricing inversions are speculative",
      dataNeeded: "Competitor pricing pages, industry pricing reports, distributor catalogs",
      priority: "high",
      affectedArea: "pricing",
    });
  }

  // ── Supply Chain ──
  const hasSupplyChain = !!(intel.supplyChain || (intel as any).supply_chain);
  areas.push({
    area: "Supply Chain",
    confidence: hasSupplyChain ? "scraped" : "ai_inferred",
    score: hasSupplyChain ? 0.65 : 0.2,
    hasRealData: hasSupplyChain,
    source: hasSupplyChain ? "Scraped supplier data" : "AI inference — generic industry knowledge",
  });
  if (!hasSupplyChain) {
    researchQuestions.push({
      question: `Who are the actual raw material suppliers and contract manufacturers for ${name}?`,
      rationale: "Supply chain inversions require knowing real sourcing structure, not generic assumptions",
      dataNeeded: "Supplier directories, trade show exhibitor lists, import/export records",
      priority: "high",
      affectedArea: "supply_chain",
    });
  }

  // ── Competitive Landscape ──
  const hasCompetitors = !!(intel.competitorAnalysis || (intel as any).competitors);
  areas.push({
    area: "Competitive Defaults",
    confidence: hasCompetitors ? "scraped" : "ai_inferred",
    score: hasCompetitors ? 0.7 : 0.3,
    hasRealData: hasCompetitors,
    source: hasCompetitors ? "Scraped competitor data" : "AI inference from general knowledge",
  });
  if (!hasCompetitors) {
    researchQuestions.push({
      question: `What do ALL competitors in ${category} do identically? What's the industry-wide default that nobody questions?`,
      rationale: "Competitive blind spots can only be identified when you know what competitors actually do",
      dataNeeded: "3-5 competitor product pages, feature comparison matrices, industry reviews",
      priority: "high",
      affectedArea: "competitive",
    });
  }

  // ── Patent / IP ──
  const hasPatents = !!(intel.patentLandscape || intel.patentData);
  areas.push({
    area: "Patent / IP Landscape",
    confidence: hasPatents ? "scraped" : "ai_inferred",
    score: hasPatents ? 0.75 : 0.15,
    hasRealData: hasPatents,
    source: hasPatents ? "Patent database search" : "No patent search conducted",
  });
  if (!hasPatents) {
    researchQuestions.push({
      question: `Are the proposed mechanisms already patented? What IP white space exists in ${category}?`,
      rationale: "Concepts overlapping existing patents are not novel — this is critical for inventors",
      dataNeeded: "Google Patents search, USPTO database query",
      priority: "high",
      affectedArea: "technical",
    });
  }

  // ── BOM / Cost Data ──
  const hasBOM = !!(decomposition && (
    (decomposition as any).costDrivers?.length > 0 ||
    (decomposition as any).costStructure
  ));
  areas.push({
    area: "Bill of Materials / Costs",
    confidence: hasBOM ? "parametric" : "ai_inferred",
    score: hasBOM ? 0.5 : 0.15,
    hasRealData: false, // BOM is always modeled, never truly verified
    source: hasBOM ? "Parametric estimate from decomposition" : "AI-generated estimates — not verified",
  });
  researchQuestions.push({
    question: `What are the actual per-unit material and manufacturing costs for ${name} at 10K unit volume?`,
    rationale: "Cost estimates directly impact viability of redesign concepts — AI guesses are not reliable here",
    dataNeeded: "Supplier quotes, Alibaba/Thomasnet listings, contract manufacturer RFQs",
    priority: "medium",
    affectedArea: "supply_chain",
  });

  // ── Market Trends ──
  const hasTrends = !!(intel.trendAnalysis || (intel as any).trends);
  areas.push({
    area: "Market Trends",
    confidence: hasTrends ? "scraped" : "ai_inferred",
    score: hasTrends ? 0.6 : 0.3,
    hasRealData: hasTrends,
    source: hasTrends ? "Trend signal data" : "AI general knowledge",
  });

  // ── Community / Customer ──
  const hasCommunity = !!(
    (intel as any).communityInsights?.topComplaints?.length > 0 ||
    (intel as any).communityContent
  );
  areas.push({
    area: "Customer Pain Points",
    confidence: hasCommunity ? "scraped" : "ai_inferred",
    score: hasCommunity ? 0.75 : 0.3,
    hasRealData: hasCommunity,
    source: hasCommunity ? "Scraped reviews/forums" : "AI inference — no real customer data",
  });
  if (!hasCommunity) {
    researchQuestions.push({
      question: `What are actual customers saying about ${name} in reviews, forums, and social media?`,
      rationale: "Without real customer friction data, pain point analysis is speculative",
      dataNeeded: "Amazon reviews, Reddit threads, industry forums, Google reviews",
      priority: "medium",
      affectedArea: "customer",
    });
  }

  // ── Regulatory ──
  areas.push({
    area: "Regulatory Environment",
    confidence: "ai_inferred",
    score: 0.25,
    hasRealData: false,
    source: "AI general knowledge — not verified against actual regulations",
  });
  researchQuestions.push({
    question: `What specific certifications, standards, and regulatory approvals apply to ${category}?`,
    rationale: "Regulatory requirements directly constrain concept feasibility — guesses can lead to non-viable concepts",
    dataNeeded: "Industry association standards, UL/CSA/CE requirements, jurisdiction-specific codes",
    priority: "medium",
    affectedArea: "regulatory",
  });

  // ── Compute overall ──
  const knownCount = areas.filter(a => a.hasRealData).length;
  const inferredCount = areas.filter(a => !a.hasRealData).length;
  const overallScore = areas.reduce((sum, a) => sum + a.score, 0) / areas.length;

  // Sort research questions by priority
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  researchQuestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    overallScore,
    areas,
    researchQuestions,
    knownVsInferred: {
      knownCount,
      inferredCount,
      ratio: knownCount / (knownCount + inferredCount),
    },
  };
}

/**
 * Get a confidence badge label and color for a given confidence level.
 */
export function getConfidenceBadgeStyle(level: DataConfidenceLevel): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  switch (level) {
    case "verified":
      return { label: "VERIFIED", color: "hsl(142 70% 35%)", bgColor: "hsl(142 70% 35% / 0.1)", borderColor: "hsl(142 70% 35% / 0.25)" };
    case "scraped":
      return { label: "SCRAPED", color: "hsl(217 91% 45%)", bgColor: "hsl(217 91% 45% / 0.1)", borderColor: "hsl(217 91% 45% / 0.25)" };
    case "parametric":
      return { label: "MODELED", color: "hsl(271 70% 45%)", bgColor: "hsl(271 70% 45% / 0.1)", borderColor: "hsl(271 70% 45% / 0.25)" };
    case "user_input":
      return { label: "USER INPUT", color: "hsl(142 70% 35%)", bgColor: "hsl(142 70% 35% / 0.1)", borderColor: "hsl(142 70% 35% / 0.25)" };
    case "ai_inferred":
    default:
      return { label: "AI-INFERRED", color: "hsl(38 92% 42%)", bgColor: "hsl(38 92% 42% / 0.1)", borderColor: "hsl(38 92% 42% / 0.25)" };
  }
}

/**
 * Should this area generate an insight or a research question?
 * Returns true if confidence is too low for reliable insight generation.
 */
export function shouldConvertToResearchQuestion(score: number): boolean {
  return score < 0.4;
}
