/**
 * EDGE FUNCTION: Mode-Specific Constraint Weights
 * 
 * Server-side mode weights for edge functions.
 * Each mode defines structural emphasis for constraint ranking.
 */

export type AnalysisMode = "product" | "service" | "business";

export interface ModeWeights {
  dimension_weights: Record<string, number>;
  structural_focus: string[];
  decision_thresholds: {
    proceed_min_confidence: number;
    conditional_min_confidence: number;
    require_verified_evidence: boolean;
  };
}

const MODE_WEIGHT_MAP: Record<AnalysisMode, ModeWeights> = {
  product: {
    dimension_weights: { cost: 1.2, time: 0.9, adoption: 1.3, scale: 1.0, reliability: 1.1, risk: 0.8 },
    structural_focus: ["physical_interaction", "usability_friction", "manufacturing_constraints", "adoption_drivers"],
    decision_thresholds: { proceed_min_confidence: 55, conditional_min_confidence: 30, require_verified_evidence: false },
  },
  service: {
    dimension_weights: { cost: 0.9, time: 1.3, adoption: 1.1, scale: 1.2, reliability: 1.4, risk: 1.0 },
    structural_focus: ["workflow_bottlenecks", "handoff_friction", "capacity_constraints", "experience_reliability"],
    decision_thresholds: { proceed_min_confidence: 50, conditional_min_confidence: 28, require_verified_evidence: false },
  },
  business: {
    dimension_weights: { cost: 1.4, time: 0.7, adoption: 0.8, scale: 1.5, reliability: 1.0, risk: 1.3 },
    structural_focus: ["margin_drivers", "cost_structure", "revenue_mechanics", "scalability_constraints"],
    decision_thresholds: { proceed_min_confidence: 60, conditional_min_confidence: 35, require_verified_evidence: true },
  },
};

export function getModeWeights(mode: AnalysisMode): ModeWeights {
  return MODE_WEIGHT_MAP[mode] || MODE_WEIGHT_MAP.product;
}

/**
 * Build a mode weighting prompt section for AI system prompts.
 * Tells the AI how mode weights should affect constraint ranking.
 */
export function buildModeWeightingPrompt(mode: AnalysisMode): string {
  const weights = getModeWeights(mode);
  const dims = Object.entries(weights.dimension_weights)
    .filter(([, v]) => Math.abs(v - 1.0) > 0.05)
    .map(([k, v]) => `${k}: ${v > 1 ? "↑" : "↓"} ${v.toFixed(1)}x`)
    .join(", ");

  return `

MODE-SPECIFIC CONSTRAINT WEIGHTING (${mode.toUpperCase()} MODE):
Constraint dimension weights: ${dims}
Structural focus areas: ${weights.structural_focus.join(", ")}
Decision thresholds: proceed ≥ ${weights.decision_thresholds.proceed_min_confidence}%, conditional ≥ ${weights.decision_thresholds.conditional_min_confidence}%
${weights.decision_thresholds.require_verified_evidence ? "⚠ REQUIRES verified evidence for proceed grade" : ""}

MODE IMPACT ON GOVERNED OUTPUT:
- Rank binding constraints using the mode dimension weights above
- Emphasize structural focus areas in constraint discovery
- Apply mode-specific decision thresholds to decision_synthesis
`;
}
