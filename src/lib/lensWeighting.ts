/**
 * STRUCTURAL LENS WEIGHTING ENGINE
 * 
 * Lenses modify COMPUTATION, not just prompts.
 * This module computes structural weights that alter constraint ranking,
 * confidence thresholds, and decision admissibility rules.
 */

export interface LensWeights {
  constraint_priority_weights: Record<string, number>;
  evidence_threshold: number; // minimum verified evidence ratio for "proceed"
  acceptable_risk: "low" | "medium" | "high";
  time_horizon_months: number;
  decision_penalty_rules: string[];
}

export interface LensImpactReport {
  constraint_priority_shift: Record<string, { before: number; after: number }>;
  decision_rule_changes: string[];
  evidence_threshold_change: { before: number; after: number };
  lens_name: string;
  structural_impact: boolean; // true if lens changed any ranking
}

export interface LensConfig {
  name: string;
  lensType?: "default" | "eta" | "custom";
  evaluation_priorities?: Record<string, number>;
  risk_tolerance?: string;
  time_horizon?: string;
  constraints?: string;
}

const DEFAULT_WEIGHTS: LensWeights = {
  constraint_priority_weights: {
    cost: 1.0,
    time: 1.0,
    adoption: 1.0,
    scale: 1.0,
    reliability: 1.0,
    risk: 1.0,
  },
  evidence_threshold: 0.3,
  acceptable_risk: "medium",
  time_horizon_months: 18,
  decision_penalty_rules: [],
};

const ETA_WEIGHTS: LensWeights = {
  constraint_priority_weights: {
    cost: 1.3,       // cost flexibility matters more for acquisition
    time: 0.8,       // less urgent — owner-operator has patience
    adoption: 0.9,
    scale: 1.2,      // scalability under ownership
    reliability: 1.4, // value durability is top priority
    risk: 1.3,       // downside risk matters for acquisition
  },
  evidence_threshold: 0.5, // higher bar — acquisition decisions need more evidence
  acceptable_risk: "medium",
  time_horizon_months: 36,
  decision_penalty_rules: [
    "Penalize solutions requiring >$500K upfront capital",
    "Penalize solutions with >12 month payback period",
    "Favor operational improvements over technology-first solutions",
    "Require due diligence evidence for ownership-specific risks",
  ],
};

/**
 * Compute structural lens weights from a lens configuration.
 */
export function computeLensWeights(lens: LensConfig | null | undefined): LensWeights {
  if (!lens) return { ...DEFAULT_WEIGHTS };
  
  const lensType = lens.lensType || (lens.name === "ETA Acquisition Lens" ? "eta" : "custom");
  
  if (lensType === "eta") return { ...ETA_WEIGHTS };
  
  if (lensType === "custom" && lens.evaluation_priorities) {
    return buildCustomWeights(lens);
  }
  
  return { ...DEFAULT_WEIGHTS };
}

function buildCustomWeights(lens: LensConfig): LensWeights {
  const priorities = lens.evaluation_priorities || {};
  const riskTolerance = (lens.risk_tolerance || "medium") as "low" | "medium" | "high";
  
  // Map evaluation priorities to constraint dimension weights
  const constraintWeights: Record<string, number> = { ...DEFAULT_WEIGHTS.constraint_priority_weights };
  
  // Higher feasibility priority → increase cost/time weights
  if (priorities.feasibility) constraintWeights.cost = 1 + (priorities.feasibility - 0.25) * 2;
  if (priorities.feasibility) constraintWeights.time = 1 + (priorities.feasibility - 0.25) * 1.5;
  
  // Higher desirability → increase adoption weight
  if (priorities.desirability) constraintWeights.adoption = 1 + (priorities.desirability - 0.25) * 2;
  
  // Higher profitability → increase scale weight
  if (priorities.profitability) constraintWeights.scale = 1 + (priorities.profitability - 0.25) * 2;
  
  // Risk-related priorities
  if (priorities.downside_risk) constraintWeights.risk = 1 + (priorities.downside_risk - 0.1) * 3;
  if (priorities.value_durability) constraintWeights.reliability = 1 + (priorities.value_durability - 0.15) * 3;
  
  // Parse time horizon
  let timeHorizonMonths = 18;
  if (lens.time_horizon) {
    const match = lens.time_horizon.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (lens.time_horizon.includes("year")) timeHorizonMonths = num * 12;
      else if (lens.time_horizon.includes("month")) timeHorizonMonths = num;
    }
  }
  
  // Evidence threshold based on risk tolerance
  const evidenceThreshold = riskTolerance === "low" ? 0.6 : riskTolerance === "high" ? 0.2 : 0.4;
  
  const penalties: string[] = [];
  if (lens.constraints) {
    penalties.push(`User constraint: ${lens.constraints}`);
  }
  if (riskTolerance === "low") {
    penalties.push("Penalize speculative-only evidence chains");
  }
  
  return {
    constraint_priority_weights: constraintWeights,
    evidence_threshold: evidenceThreshold,
    acceptable_risk: riskTolerance,
    time_horizon_months: timeHorizonMonths,
    decision_penalty_rules: penalties,
  };
}

/**
 * Apply lens weights to rank constraints.
 * Returns constraints sorted by weighted priority (highest first).
 */
export function rankConstraintsWithLens(
  constraints: Array<{ friction_id: string; impact_dimension: string; system_impact: string }>,
  weights: LensWeights
): Array<{ friction_id: string; impact_dimension: string; system_impact: string; weighted_score: number }> {
  return constraints
    .map(c => ({
      ...c,
      weighted_score: (weights.constraint_priority_weights[c.impact_dimension] || 1.0) * 10,
    }))
    .sort((a, b) => b.weighted_score - a.weighted_score);
}

/**
 * Compute lens impact report by comparing default vs lens-weighted outcomes.
 */
export function computeLensImpactReport(
  lens: LensConfig | null | undefined,
  constraints: Array<{ friction_id: string; impact_dimension: string; system_impact: string }>
): LensImpactReport {
  const defaultWeights = computeLensWeights(null);
  const lensWeights = computeLensWeights(lens);
  
  const priorityShift: Record<string, { before: number; after: number }> = {};
  let hasStructuralChange = false;
  
  for (const dim of Object.keys(defaultWeights.constraint_priority_weights)) {
    const before = defaultWeights.constraint_priority_weights[dim] || 1;
    const after = lensWeights.constraint_priority_weights[dim] || 1;
    if (Math.abs(before - after) > 0.01) {
      priorityShift[dim] = { before, after };
      hasStructuralChange = true;
    }
  }
  
  // Check if constraint ranking order changes
  const defaultRanking = rankConstraintsWithLens(constraints, defaultWeights);
  const lensRanking = rankConstraintsWithLens(constraints, lensWeights);
  
  if (defaultRanking.length > 0 && lensRanking.length > 0 &&
      defaultRanking[0].friction_id !== lensRanking[0].friction_id) {
    hasStructuralChange = true;
  }
  
  const ruleChanges: string[] = [];
  if (defaultWeights.evidence_threshold !== lensWeights.evidence_threshold) {
    ruleChanges.push(`Evidence threshold: ${defaultWeights.evidence_threshold} → ${lensWeights.evidence_threshold}`);
  }
  if (defaultWeights.acceptable_risk !== lensWeights.acceptable_risk) {
    ruleChanges.push(`Risk tolerance: ${defaultWeights.acceptable_risk} → ${lensWeights.acceptable_risk}`);
  }
  ruleChanges.push(...lensWeights.decision_penalty_rules);
  
  return {
    constraint_priority_shift: priorityShift,
    decision_rule_changes: ruleChanges,
    evidence_threshold_change: {
      before: defaultWeights.evidence_threshold,
      after: lensWeights.evidence_threshold,
    },
    lens_name: lens?.name || "Default",
    structural_impact: hasStructuralChange,
  };
}
