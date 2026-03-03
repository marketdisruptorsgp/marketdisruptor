/**
 * MULTI-HYPOTHESIS ROOT BRANCHING — RANKING ENGINE
 * 
 * Computes dominance scores for competing root hypotheses
 * derived from Tier 1 constraint mapping.
 * 
 * dominance_score = (leverage * 0.35) + (impact * 0.30) + (evidence_weight * 0.20) + ((10 - fragility) * 0.15)
 */

export type ConstraintType = "cost" | "time" | "adoption" | "scale" | "reliability" | "risk" | "physical" | "structural" | "economic";

export interface RootHypothesis {
  id: string;
  constraint_type: ConstraintType;
  hypothesis_statement: string;
  causal_chain: Array<{
    friction_id: string;
    structural_constraint: string;
    system_impact: string;
    impact_dimension: string;
  }>;
  friction_sources: string[];
  leverage_score: number; // 0-10
  impact_score: number;   // 0-10
  evidence_mix: {
    verified: number; // 0-1 ratio
    modeled: number;
    assumption: number;
  };
  fragility_score: number; // 0-10
  confidence: number;      // bounded by evidence_mix + fragility
  downstream_implications: string;
  dominance_score?: number; // computed
}

export interface HypothesisRankingResult {
  hypotheses: RootHypothesis[];
  primary_id: string;
  competing: boolean; // delta < 1.5 between #1 and #2
  delta: number;
  interpretation: "competing_structural_interpretations" | "primary_structural_driver";
  trace: string;
}

/**
 * Compute evidence weight from mix ratios.
 */
function computeEvidenceWeight(mix: RootHypothesis["evidence_mix"]): number {
  return (mix.verified * 1.0) + (mix.modeled * 0.6) + (mix.assumption * 0.3);
}

/**
 * Compute dominance score for a single hypothesis.
 */
export function computeDominanceScore(h: RootHypothesis): number {
  const ew = computeEvidenceWeight(h.evidence_mix);
  return (h.leverage_score * 0.35) +
         (h.impact_score * 0.30) +
         (ew * 0.20) +
         ((10 - h.fragility_score) * 0.15);
}

/**
 * Bound confidence by evidence quality and fragility.
 */
export function boundConfidence(h: RootHypothesis): number {
  const ew = computeEvidenceWeight(h.evidence_mix);
  // Max confidence = evidence_weight * (1 - fragility/10) * 100
  const maxConfidence = ew * (1 - h.fragility_score / 10) * 100;
  return Math.round(Math.max(0, Math.min(100, Math.min(h.confidence, maxConfidence))));
}

/**
 * Rank hypotheses and determine structural interpretation.
 */
export function rankHypotheses(hypotheses: RootHypothesis[]): HypothesisRankingResult {
  if (!hypotheses || hypotheses.length === 0) {
    return {
      hypotheses: [],
      primary_id: "",
      competing: false,
      delta: 0,
      interpretation: "primary_structural_driver",
      trace: "No hypotheses provided",
    };
  }

  // Compute scores and bound confidence
  const scored = hypotheses.map(h => ({
    ...h,
    dominance_score: computeDominanceScore(h),
    confidence: boundConfidence(h),
  }));

  // Sort descending by dominance_score
  scored.sort((a, b) => (b.dominance_score ?? 0) - (a.dominance_score ?? 0));

  // Enforce max 4
  const capped = scored.slice(0, 4);

  const delta = capped.length >= 2
    ? (capped[0].dominance_score ?? 0) - (capped[1].dominance_score ?? 0)
    : Infinity;

  const competing = delta < 1.5;
  const interpretation = delta > 3 ? "primary_structural_driver" : "competing_structural_interpretations";

  const trace = capped.map((h, i) =>
    `#${i + 1} ${h.id}: dom=${h.dominance_score?.toFixed(2)} lev=${h.leverage_score} imp=${h.impact_score} frag=${h.fragility_score} conf=${h.confidence}`
  ).join(" | ");

  return {
    hypotheses: capped,
    primary_id: capped[0]?.id ?? "",
    competing,
    delta,
    interpretation,
    trace: `[HypothesisRanking] ${trace} | delta=${delta.toFixed(2)} interp=${interpretation}`,
  };
}

/**
 * Validate hypothesis set meets governed requirements.
 */
export function validateHypotheses(hypotheses: RootHypothesis[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!hypotheses || hypotheses.length === 0) {
    errors.push("No root hypotheses generated");
    return { valid: false, errors };
  }

  if (hypotheses.length > 4) {
    errors.push(`Too many hypotheses (${hypotheses.length}), max 4 allowed`);
  }

  // Check for cosmetic duplicates (same constraint_type)
  const types = hypotheses.map(h => h.constraint_type);
  const uniqueTypes = new Set(types);
  if (uniqueTypes.size < types.length) {
    errors.push("Duplicate constraint_type detected — no cosmetic variations allowed");
  }

  // Validate each hypothesis has required fields
  for (const h of hypotheses) {
    if (!h.id) errors.push("Hypothesis missing id");
    if (!h.hypothesis_statement) errors.push(`Hypothesis ${h.id}: missing hypothesis_statement`);
    if (!h.causal_chain || h.causal_chain.length === 0) errors.push(`Hypothesis ${h.id}: empty causal_chain`);
    if (h.leverage_score < 0 || h.leverage_score > 10) errors.push(`Hypothesis ${h.id}: leverage_score out of range`);
    if (h.impact_score < 0 || h.impact_score > 10) errors.push(`Hypothesis ${h.id}: impact_score out of range`);
    if (h.fragility_score < 0 || h.fragility_score > 10) errors.push(`Hypothesis ${h.id}: fragility_score out of range`);
  }

  // Check minimum 2 if delta < 2 leverage points between top constraints
  if (hypotheses.length === 1) {
    const scored = hypotheses.map(h => ({ ...h, dominance_score: computeDominanceScore(h) }));
    // Single hypothesis is OK only if clearly dominant (no competing constraint)
    // We allow it but note it
  }

  return { valid: errors.length === 0, errors };
}
