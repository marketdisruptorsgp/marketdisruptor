/**
 * EDGE FUNCTION: Multi-Hypothesis Ranking Engine
 * Server-side dominance score computation for root hypotheses.
 */

interface RootHypothesis {
  id: string;
  constraint_type: string;
  hypothesis_statement: string;
  causal_chain: Array<{
    friction_id: string;
    structural_constraint: string;
    system_impact: string;
    impact_dimension: string;
  }>;
  friction_sources: string[];
  leverage_score: number;
  impact_score: number;
  evidence_mix: { verified: number; modeled: number; assumption: number };
  fragility_score: number;
  confidence: number;
  downstream_implications: string;
  dominance_score?: number;
}

function computeEvidenceWeight(mix: RootHypothesis["evidence_mix"]): number {
  return (mix.verified * 1.0) + (mix.modeled * 0.6) + (mix.assumption * 0.3);
}

function computeDominanceScore(h: RootHypothesis): number {
  const ew = computeEvidenceWeight(h.evidence_mix);
  return (h.leverage_score * 0.35) +
         (h.impact_score * 0.30) +
         (ew * 0.20) +
         ((10 - h.fragility_score) * 0.15);
}

function boundConfidence(h: RootHypothesis): number {
  const ew = computeEvidenceWeight(h.evidence_mix);
  const maxConf = ew * (1 - h.fragility_score / 10) * 100;
  return Math.round(Math.max(0, Math.min(100, Math.min(h.confidence, maxConf))));
}

/**
 * Rank and validate root hypotheses from governed constraint_map.
 * Called server-side after AI generates root_hypotheses.
 */
export function rankAndValidateHypotheses(governed: Record<string, unknown>): {
  ranked: RootHypothesis[];
  primary_id: string;
  competing: boolean;
  delta: number;
  trace: string;
} {
  const cm = governed.constraint_map as Record<string, unknown> | undefined;
  const raw = (cm?.root_hypotheses as RootHypothesis[]) || [];

  if (raw.length === 0) {
    return { ranked: [], primary_id: "", competing: false, delta: 0, trace: "No root_hypotheses" };
  }

  // Score, bound confidence, cap at 4, sort
  const scored = raw.slice(0, 4).map(h => ({
    ...h,
    dominance_score: computeDominanceScore(h),
    confidence: boundConfidence(h),
  }));

  scored.sort((a, b) => (b.dominance_score ?? 0) - (a.dominance_score ?? 0));

  const delta = scored.length >= 2
    ? (scored[0].dominance_score ?? 0) - (scored[1].dominance_score ?? 0)
    : Infinity;

  const trace = scored.map((h, i) =>
    `#${i + 1} ${h.id}: dom=${h.dominance_score?.toFixed(2)} conf=${h.confidence}`
  ).join(" | ");

  return {
    ranked: scored,
    primary_id: scored[0]?.id ?? "",
    competing: delta < 1.5,
    delta,
    trace: `[HypothesisRanking] ${trace} | delta=${delta.toFixed(2)}`,
  };
}
