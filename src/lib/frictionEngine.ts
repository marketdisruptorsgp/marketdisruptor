/**
 * FRICTION INDEX ENGINE
 *
 * Quantifies how difficult an assumption, constraint, or insight
 * would be to change in the real world.
 *
 * Four dimensions scored 1–5:
 *   Structural  — infrastructure, supply chains, capital intensity, regulation
 *   Economic    — cost structure, switching costs, margin compression, complexity
 *   Behavioral  — customer habits, trust, adoption inertia, cultural norms
 *   Competitive — incumbents, network effects, lock-in, distribution power
 *
 * Mode-aware weighting adjusts emphasis per analysis lens.
 */

import type { LensType } from "@/lib/multiLensEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface FrictionDimensions {
  structural: number; // 1–5
  economic: number;
  behavioral: number;
  competitive: number;
}

export interface FrictionScore {
  dimensions: FrictionDimensions;
  index: number; // weighted average 1–5
  label: "very_low" | "low" | "moderate" | "high" | "very_high";
}

export interface LeverageScoreDimensions {
  valueExpansion: number;   // 1–5
  marketExpansion: number;
  structuralAdvantage: number;
  strategicOptionality: number;
}

export interface LeverageScore {
  dimensions: LeverageScoreDimensions;
  index: number; // weighted average 1–5
  label: "minimal" | "moderate" | "strong" | "exceptional";
}

export type OpportunityPriority = "breakthrough" | "strategic_bet" | "quick_win" | "low_priority";

export interface ScoredOpportunity {
  id: string;
  label: string;
  description: string;
  category: string;
  friction: FrictionScore;
  leverage: LeverageScore;
  priority: OpportunityPriority;
  sourceInsightId?: string;
  evidence: string[];
}

// ═══════════════════════════════════════════════════════════════
//  MODE-AWARE WEIGHTS
// ═══════════════════════════════════════════════════════════════

const FRICTION_WEIGHTS: Record<LensType, FrictionDimensions> = {
  product:  { structural: 0.35, economic: 0.25, behavioral: 0.20, competitive: 0.20 },
  service:  { structural: 0.20, economic: 0.25, behavioral: 0.30, competitive: 0.25 },
  business: { structural: 0.20, economic: 0.30, behavioral: 0.15, competitive: 0.35 },
};

const LEVERAGE_WEIGHTS: Record<LensType, LeverageScoreDimensions> = {
  product:  { valueExpansion: 0.30, marketExpansion: 0.25, structuralAdvantage: 0.30, strategicOptionality: 0.15 },
  service:  { valueExpansion: 0.25, marketExpansion: 0.30, structuralAdvantage: 0.20, strategicOptionality: 0.25 },
  business: { valueExpansion: 0.25, marketExpansion: 0.25, structuralAdvantage: 0.20, strategicOptionality: 0.30 },
};

// ═══════════════════════════════════════════════════════════════
//  FRICTION INDEX CALCULATOR
// ═══════════════════════════════════════════════════════════════

const FRICTION_KEYWORDS: Record<keyof FrictionDimensions, string[]> = {
  structural: [
    "infrastructure", "supply chain", "capital", "regulation", "regulatory",
    "manufacturing", "hardware", "facility", "compliance", "permits",
    "logistics", "inventory", "warehouse", "physical", "equipment",
  ],
  economic: [
    "cost", "price", "margin", "switching", "expense", "investment",
    "revenue", "profit", "budget", "subscription", "contract", "fee",
    "unit economics", "cac", "ltv", "arpu", "burn rate",
  ],
  behavioral: [
    "habit", "trust", "adoption", "culture", "behavior", "user",
    "customer", "resistance", "learning curve", "onboarding",
    "perception", "brand loyalty", "inertia", "familiarity",
  ],
  competitive: [
    "incumbent", "network effect", "lock-in", "distribution",
    "market share", "moat", "defensibility", "competition",
    "patent", "monopoly", "platform", "ecosystem", "data advantage",
  ],
};

function scoreDimension(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) hits++;
  }
  // Map hits to 1–5 scale
  if (hits === 0) return 2; // baseline — some friction assumed
  if (hits === 1) return 3;
  if (hits === 2) return 4;
  return 5;
}

export function computeFrictionIndex(
  label: string,
  evidence: string[],
  mode: LensType = "product",
): FrictionScore {
  const text = [label, ...evidence].join(" ");
  const weights = FRICTION_WEIGHTS[mode];

  const dimensions: FrictionDimensions = {
    structural: scoreDimension(text, FRICTION_KEYWORDS.structural),
    economic: scoreDimension(text, FRICTION_KEYWORDS.economic),
    behavioral: scoreDimension(text, FRICTION_KEYWORDS.behavioral),
    competitive: scoreDimension(text, FRICTION_KEYWORDS.competitive),
  };

  const index = clamp(
    dimensions.structural * weights.structural +
    dimensions.economic * weights.economic +
    dimensions.behavioral * weights.behavioral +
    dimensions.competitive * weights.competitive,
    1, 5,
  );

  return {
    dimensions,
    index: round2(index),
    label: index <= 1.5 ? "very_low" : index <= 2.5 ? "low" : index <= 3.5 ? "moderate" : index <= 4.5 ? "high" : "very_high",
  };
}

// ═══════════════════════════════════════════════════════════════
//  OPPORTUNITY LEVERAGE SCORE
// ═══════════════════════════════════════════════════════════════

const LEVERAGE_KEYWORDS: Record<keyof LeverageScoreDimensions, string[]> = {
  valueExpansion: [
    "revenue", "margin", "willingness to pay", "premium", "upsell",
    "monetiz", "pricing power", "value capture", "profit",
  ],
  marketExpansion: [
    "segment", "geographic", "international", "scale", "platform",
    "channel", "distribution", "adjacent", "new market", "expansion",
  ],
  structuralAdvantage: [
    "cost advantage", "speed", "defensib", "moat", "patent",
    "proprietary", "first mover", "network effect", "data advantage",
  ],
  strategicOptionality: [
    "optionality", "pivot", "adjacent", "portfolio", "leverage",
    "compound", "ecosystem", "platform play", "strategic",
  ],
};

export function computeLeverageScore(
  label: string,
  evidence: string[],
  impactRaw: number,
  mode: LensType = "product",
): LeverageScore {
  const text = [label, ...evidence].join(" ");
  const weights = LEVERAGE_WEIGHTS[mode];

  const dimensions: LeverageScoreDimensions = {
    valueExpansion: scoreDimension(text, LEVERAGE_KEYWORDS.valueExpansion),
    marketExpansion: scoreDimension(text, LEVERAGE_KEYWORDS.marketExpansion),
    structuralAdvantage: scoreDimension(text, LEVERAGE_KEYWORDS.structuralAdvantage),
    strategicOptionality: scoreDimension(text, LEVERAGE_KEYWORDS.strategicOptionality),
  };

  // Blend keyword-derived scores with the raw impact signal
  const keywordIndex =
    dimensions.valueExpansion * weights.valueExpansion +
    dimensions.marketExpansion * weights.marketExpansion +
    dimensions.structuralAdvantage * weights.structuralAdvantage +
    dimensions.strategicOptionality * weights.strategicOptionality;

  const impactNormalized = clamp(impactRaw / 2, 1, 5); // 0-10 → 1-5
  const index = clamp(keywordIndex * 0.6 + impactNormalized * 0.4, 1, 5);

  return {
    dimensions,
    index: round2(index),
    label: index <= 2 ? "minimal" : index <= 3 ? "moderate" : index <= 4 ? "strong" : "exceptional",
  };
}

// ═══════════════════════════════════════════════════════════════
//  PRIORITY MATRIX
// ═══════════════════════════════════════════════════════════════

export function classifyPriority(friction: FrictionScore, leverage: LeverageScore): OpportunityPriority {
  const highLeverage = leverage.index >= 3;
  const lowFriction = friction.index <= 3;

  if (highLeverage && lowFriction) return "breakthrough";
  if (highLeverage && !lowFriction) return "strategic_bet";
  if (!highLeverage && lowFriction) return "quick_win";
  return "low_priority";
}

export const PRIORITY_META: Record<OpportunityPriority, { label: string; color: string; bg: string }> = {
  breakthrough:   { label: "Breakthrough", color: "hsl(152 60% 40%)", bg: "hsl(152 60% 40% / 0.12)" },
  strategic_bet:  { label: "Strategic Bet", color: "hsl(229 89% 60%)", bg: "hsl(229 89% 60% / 0.12)" },
  quick_win:      { label: "Quick Win", color: "hsl(38 92% 50%)", bg: "hsl(38 92% 50% / 0.12)" },
  low_priority:   { label: "Low Priority", color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

// ═══════════════════════════════════════════════════════════════
//  BATCH SCORER — Score all opportunities from innovation engine
// ═══════════════════════════════════════════════════════════════

export interface ScoringInput {
  opportunities: Array<{
    id: string;
    label: string;
    description: string;
    category: string;
    impact: number;
    evidence: string[];
    sourceInsightId?: string;
  }>;
  mode: LensType;
}

export interface ScoringOutput {
  scored: ScoredOpportunity[];
  summary: {
    breakthroughs: number;
    strategicBets: number;
    quickWins: number;
    lowPriority: number;
    avgFriction: number;
    avgLeverage: number;
  };
}

export function scoreOpportunities(input: ScoringInput): ScoringOutput {
  const scored: ScoredOpportunity[] = input.opportunities.map(opp => {
    const friction = computeFrictionIndex(opp.label, [...opp.evidence, opp.description], input.mode);
    const leverage = computeLeverageScore(opp.label, [...opp.evidence, opp.description], opp.impact, input.mode);
    const priority = classifyPriority(friction, leverage);

    return {
      id: opp.id,
      label: opp.label,
      description: opp.description,
      category: opp.category,
      friction,
      leverage,
      priority,
      sourceInsightId: opp.sourceInsightId,
      evidence: opp.evidence,
    };
  });

  // Sort: breakthroughs first, then by leverage descending
  const PRIORITY_ORDER: Record<OpportunityPriority, number> = {
    breakthrough: 0, strategic_bet: 1, quick_win: 2, low_priority: 3,
  };
  scored.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || b.leverage.index - a.leverage.index);

  const summary = {
    breakthroughs: scored.filter(s => s.priority === "breakthrough").length,
    strategicBets: scored.filter(s => s.priority === "strategic_bet").length,
    quickWins: scored.filter(s => s.priority === "quick_win").length,
    lowPriority: scored.filter(s => s.priority === "low_priority").length,
    avgFriction: round2(scored.reduce((s, o) => s + o.friction.index, 0) / (scored.length || 1)),
    avgLeverage: round2(scored.reduce((s, o) => s + o.leverage.index, 0) / (scored.length || 1)),
  };

  return { scored, summary };
}

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function round2(v: number) { return Math.round(v * 100) / 100; }
