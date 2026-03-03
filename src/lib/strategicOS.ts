/**
 * STRATEGIC OPERATING SYSTEM — CORE ENGINE
 * 
 * Profile-aware dominance scoring that replaces static ranking.
 * Archetypes shift constraint weights, evidence thresholds,
 * capital/time penalties, and macro posture modifiers.
 */

export type Archetype =
  | "operator"
  | "eta_acquirer"
  | "venture_growth"
  | "bootstrapped_founder"
  | "enterprise_strategist";

export interface StrategicProfile {
  archetype: Archetype;
  risk_tolerance: "low" | "medium" | "high";
  capital_intensity_tolerance: number; // 0–10
  time_horizon_months: number;
  evidence_threshold: number; // 0.3–0.7
  macro_posture: {
    capital_discipline_bias: number; // 0–1
    speed_bias: number;
    reliability_bias: number;
    defensibility_bias: number;
  };
  version: number;
  updated_at: string;
}

interface ConstraintWeights {
  cost?: number;
  reliability?: number;
  adoption?: number;
  scale?: number;
  speed?: number;
  defensibility?: number;
  risk?: number;
  time?: number;
  physical?: number;
  structural?: number;
  economic?: number;
}

export const ARCHETYPE_WEIGHTS: Record<Archetype, ConstraintWeights> = {
  operator: {
    cost: 1.2,
    reliability: 1.3,
    scale: 1.1,
    speed: 0.9,
  },
  eta_acquirer: {
    cost: 1.3,
    reliability: 1.4,
    risk: 1.3,
    scale: 1.2,
    speed: 0.8,
  },
  venture_growth: {
    scale: 1.4,
    speed: 1.3,
    adoption: 1.2,
    cost: 0.9,
    reliability: 0.9,
  },
  bootstrapped_founder: {
    cost: 1.4,
    speed: 1.1,
  },
  enterprise_strategist: {
    defensibility: 1.4,
    reliability: 1.3,
  },
};

export const DEFAULT_PROFILES: Record<Archetype, StrategicProfile> = {
  operator: {
    archetype: "operator",
    risk_tolerance: "medium",
    capital_intensity_tolerance: 5,
    time_horizon_months: 24,
    evidence_threshold: 0.4,
    macro_posture: { capital_discipline_bias: 0.5, speed_bias: 0.4, reliability_bias: 0.6, defensibility_bias: 0.3 },
    version: 1,
    updated_at: new Date().toISOString(),
  },
  eta_acquirer: {
    archetype: "eta_acquirer",
    risk_tolerance: "medium",
    capital_intensity_tolerance: 7,
    time_horizon_months: 36,
    evidence_threshold: 0.5,
    macro_posture: { capital_discipline_bias: 0.7, speed_bias: 0.3, reliability_bias: 0.7, defensibility_bias: 0.5 },
    version: 1,
    updated_at: new Date().toISOString(),
  },
  venture_growth: {
    archetype: "venture_growth",
    risk_tolerance: "high",
    capital_intensity_tolerance: 8,
    time_horizon_months: 18,
    evidence_threshold: 0.3,
    macro_posture: { capital_discipline_bias: 0.3, speed_bias: 0.8, reliability_bias: 0.3, defensibility_bias: 0.4 },
    version: 1,
    updated_at: new Date().toISOString(),
  },
  bootstrapped_founder: {
    archetype: "bootstrapped_founder",
    risk_tolerance: "low",
    capital_intensity_tolerance: 3,
    time_horizon_months: 12,
    evidence_threshold: 0.4,
    macro_posture: { capital_discipline_bias: 0.8, speed_bias: 0.6, reliability_bias: 0.4, defensibility_bias: 0.2 },
    version: 1,
    updated_at: new Date().toISOString(),
  },
  enterprise_strategist: {
    archetype: "enterprise_strategist",
    risk_tolerance: "low",
    capital_intensity_tolerance: 6,
    time_horizon_months: 48,
    evidence_threshold: 0.6,
    macro_posture: { capital_discipline_bias: 0.5, speed_bias: 0.2, reliability_bias: 0.8, defensibility_bias: 0.8 },
    version: 1,
    updated_at: new Date().toISOString(),
  },
};

// Re-export hypothesis type for compatibility
export interface StrategicHypothesis {
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
  estimated_capital_required?: number;
  estimated_time_to_impact_months?: number;
  dominance_score?: number;
}

/**
 * Profile-aware dominance calculation.
 * This replaces the static linear formula with archetype-weighted scoring.
 */
export function calculateDominance(
  hypothesis: StrategicHypothesis,
  profile: StrategicProfile
): number {
  const base = hypothesis.leverage_score * hypothesis.impact_score;

  const archetypeWeights = ARCHETYPE_WEIGHTS[profile.archetype] || {};
  const constraintWeight =
    (archetypeWeights as Record<string, number>)[hypothesis.constraint_type] || 1;

  const evidenceModifier =
    hypothesis.evidence_mix.verified >= profile.evidence_threshold
      ? 1
      : hypothesis.evidence_mix.verified / profile.evidence_threshold;

  const fragilityPenalty =
    hypothesis.fragility_score > 6
      ? 1 - (hypothesis.fragility_score - 6) * 0.05
      : 1;

  let capitalPenalty = 1;
  if (
    hypothesis.estimated_capital_required &&
    profile.capital_intensity_tolerance < 5
  ) {
    capitalPenalty =
      1 -
      (hypothesis.estimated_capital_required / 1_000_000) *
        (1 - profile.capital_intensity_tolerance / 10);
    capitalPenalty = Math.max(capitalPenalty, 0.3);
  }

  let timePenalty = 1;
  if (
    hypothesis.estimated_time_to_impact_months &&
    hypothesis.estimated_time_to_impact_months > profile.time_horizon_months
  ) {
    timePenalty = 0.8;
  }

  const macroModifier =
    1 +
    profile.macro_posture.capital_discipline_bias * 0.05 +
    profile.macro_posture.reliability_bias * 0.05 -
    profile.macro_posture.speed_bias * 0.03;

  const dominance =
    base *
    constraintWeight *
    evidenceModifier *
    fragilityPenalty *
    capitalPenalty *
    timePenalty *
    macroModifier;

  return Math.max(Math.round(dominance * 100) / 100, 0);
}

/**
 * Bound confidence by evidence quality and fragility, respecting profile threshold.
 */
function boundConfidence(h: StrategicHypothesis, profile: StrategicProfile): number {
  const ew = (h.evidence_mix.verified * 1.0) + (h.evidence_mix.modeled * 0.6) + (h.evidence_mix.assumption * 0.3);
  const maxConfidence = ew * (1 - h.fragility_score / 10) * 100;
  // Additional penalty if below evidence threshold
  const thresholdPenalty = h.evidence_mix.verified < profile.evidence_threshold ? 0.85 : 1;
  return Math.round(Math.max(0, Math.min(100, Math.min(h.confidence, maxConfidence * thresholdPenalty))));
}

/**
 * Profile-aware ranking engine. Replaces static rankHypotheses.
 */
export interface StrategicRankingResult {
  hypotheses: StrategicHypothesis[];
  primary_id: string;
  competing: boolean;
  delta: number;
  interpretation: "competing_structural_interpretations" | "primary_structural_driver";
  archetype: Archetype;
  trace: string;
}

export function rankWithProfile(
  hypotheses: StrategicHypothesis[],
  profile: StrategicProfile
): StrategicRankingResult {
  if (!hypotheses || hypotheses.length === 0) {
    return {
      hypotheses: [],
      primary_id: "",
      competing: false,
      delta: 0,
      interpretation: "primary_structural_driver",
      archetype: profile.archetype,
      trace: "No hypotheses",
    };
  }

  const scored = hypotheses.slice(0, 4).map(h => ({
    ...h,
    dominance_score: calculateDominance(h, profile),
    confidence: boundConfidence(h, profile),
  }));

  scored.sort((a, b) => (b.dominance_score ?? 0) - (a.dominance_score ?? 0));

  const delta = scored.length >= 2
    ? (scored[0].dominance_score ?? 0) - (scored[1].dominance_score ?? 0)
    : Infinity;

  const competing = delta < (scored[0].dominance_score ?? 0) * 0.15; // 15% relative threshold
  const interpretation = competing ? "competing_structural_interpretations" : "primary_structural_driver";

  const trace = scored.map((h, i) =>
    `#${i + 1} ${h.id}: dom=${h.dominance_score?.toFixed(1)} conf=${h.confidence}`
  ).join(" | ");

  return {
    hypotheses: scored,
    primary_id: scored[0]?.id ?? "",
    competing,
    delta,
    interpretation,
    archetype: profile.archetype,
    trace: `[StrategicOS:${profile.archetype}] ${trace} | delta=${delta.toFixed(1)}`,
  };
}

/**
 * Build branch isolation context that includes strategic profile.
 */
export function buildStrategicBranchContext(
  hypothesis: StrategicHypothesis,
  profile: StrategicProfile
): string {
  return `
ACTIVE BRANCH: ${hypothesis.id}
CONSTRAINT: ${hypothesis.constraint_type}
STRATEGIC PROFILE:
  Archetype: ${profile.archetype}
  Evidence Threshold: ${profile.evidence_threshold}
  Time Horizon: ${profile.time_horizon_months} months
  Capital Tolerance: ${profile.capital_intensity_tolerance}/10
  Risk Tolerance: ${profile.risk_tolerance}
RULES:
- Reason ONLY within this constraint universe.
- Bound confidence by evidence mix (threshold: ${Math.round(profile.evidence_threshold * 100)}% verified).
- Penalize solutions beyond ${profile.time_horizon_months}-month horizon.
- Respect capital tolerance: ${profile.capital_intensity_tolerance}/10.
- Weight ${hypothesis.constraint_type} constraints at ${(ARCHETYPE_WEIGHTS[profile.archetype] as Record<string, number>)?.[hypothesis.constraint_type] || 1}x.
`;
}

/**
 * Snapshot for persistence.
 */
export interface AnalysisSnapshot {
  active_branch_id: string;
  branch_snapshot: StrategicHypothesis;
  strategic_profile_snapshot: StrategicProfile;
  dominance_score_at_time: number;
  evidence_mix_snapshot: StrategicHypothesis["evidence_mix"];
  created_at: string;
}

/**
 * Controlled adaptive drift — subtle profile evolution based on user behavior.
 */
export function adaptStrategicProfile(
  profile: StrategicProfile,
  signals: {
    selected_high_capital?: boolean;
    selected_high_risk?: boolean;
    selected_long_horizon?: boolean;
  }
): StrategicProfile {
  const drift = 0.02;
  const next = { ...profile, macro_posture: { ...profile.macro_posture } };

  if (signals.selected_high_capital) {
    next.macro_posture.capital_discipline_bias = Math.max(0, next.macro_posture.capital_discipline_bias - drift);
  }
  if (signals.selected_high_risk) {
    next.risk_tolerance = "high";
  }
  if (signals.selected_long_horizon) {
    next.time_horizon_months = Math.min(next.time_horizon_months + 3, 60);
  }

  next.version += 1;
  next.updated_at = new Date().toISOString();
  return next;
}

export const ARCHETYPE_META: Record<Archetype, { label: string; description: string; icon: string }> = {
  operator: { label: "Operator", description: "Optimize operations, cost discipline, reliability focus", icon: "wrench" },
  eta_acquirer: { label: "ETA Acquirer", description: "Acquisition lens — capital discipline, risk assessment, value creation", icon: "building" },
  venture_growth: { label: "Venture Growth", description: "Speed & scale priority, higher risk tolerance", icon: "rocket" },
  bootstrapped_founder: { label: "Bootstrapped Founder", description: "Capital-constrained, speed-to-revenue focus", icon: "wallet" },
  enterprise_strategist: { label: "Enterprise Strategist", description: "Defensibility & reliability, long time horizons", icon: "shield" },
};
