/**
 * MODE-SPECIFIC CONSTRAINT WEIGHTS ENGINE — §6
 * 
 * Modes alter reasoning structure, not just prompts.
 * Each mode defines which constraint dimensions matter most.
 */

export type AnalysisModeType = "product" | "service" | "business";

export interface ModeConstraintProfile {
  mode: AnalysisModeType;
  /** Weights for constraint dimensions (higher = more important) */
  dimension_weights: Record<string, number>;
  /** Which data sources to prioritize */
  data_priority: string[];
  /** Decision threshold adjustments */
  decision_thresholds: {
    proceed_min_confidence: number;
    conditional_min_confidence: number;
    require_verified_evidence: boolean;
  };
  /** Structural focus areas for the mode */
  structural_focus: string[];
  /** Recommendation structure emphasis */
  recommendation_emphasis: string[];
}

export const MODE_PROFILES: Record<AnalysisModeType, ModeConstraintProfile> = {
  product: {
    mode: "product",
    dimension_weights: {
      cost: 1.2,        // BOM, manufacturing cost matters
      time: 0.9,        // time-to-market moderate
      adoption: 1.3,    // usability friction is primary
      scale: 1.0,       // manufacturing scale standard
      reliability: 1.1, // product quality matters
      risk: 0.8,        // lower risk weighting for products
    },
    data_priority: ["patents", "supply_chain", "materials", "community_feedback", "pricing"],
    decision_thresholds: {
      proceed_min_confidence: 55,
      conditional_min_confidence: 30,
      require_verified_evidence: false,
    },
    structural_focus: [
      "physical_interaction",
      "usability_friction",
      "manufacturing_constraints",
      "adoption_drivers",
    ],
    recommendation_emphasis: [
      "Design iteration path",
      "Manufacturing feasibility",
      "User testing protocol",
      "BOM optimization",
    ],
  },
  service: {
    mode: "service",
    dimension_weights: {
      cost: 0.9,
      time: 1.3,        // delivery speed critical
      adoption: 1.1,    // behavior change for services
      scale: 1.2,       // capacity constraints
      reliability: 1.4, // service reliability is paramount
      risk: 1.0,
    },
    data_priority: ["workflow_analysis", "customer_journey", "capacity_data", "satisfaction_metrics"],
    decision_thresholds: {
      proceed_min_confidence: 50,
      conditional_min_confidence: 28,
      require_verified_evidence: false,
    },
    structural_focus: [
      "workflow_bottlenecks",
      "handoff_friction",
      "capacity_constraints",
      "experience_reliability",
    ],
    recommendation_emphasis: [
      "Process redesign",
      "Capacity optimization",
      "Customer journey simplification",
      "Technology integration",
    ],
  },
  business: {
    mode: "business",
    dimension_weights: {
      cost: 1.4,        // cost structure is primary
      time: 0.7,        // longer horizon acceptable
      adoption: 0.8,    // market adoption
      scale: 1.5,       // scalability is king
      reliability: 1.0, // revenue reliability
      risk: 1.3,        // business risk matters heavily
    },
    data_priority: ["unit_economics", "market_data", "competitive_landscape", "regulatory"],
    decision_thresholds: {
      proceed_min_confidence: 60,
      conditional_min_confidence: 35,
      require_verified_evidence: true, // business decisions need harder evidence
    },
    structural_focus: [
      "margin_drivers",
      "cost_structure",
      "revenue_mechanics",
      "scalability_constraints",
    ],
    recommendation_emphasis: [
      "Unit economics improvement",
      "Revenue model innovation",
      "Competitive moat building",
      "Scale path identification",
    ],
  },
};

/**
 * Get mode profile for constraint scoring.
 */
export function getModeProfile(mode: AnalysisModeType): ModeConstraintProfile {
  return MODE_PROFILES[mode] || MODE_PROFILES.product;
}

/**
 * Apply mode-specific weights to rank constraints.
 * Returns constraints sorted by mode-weighted priority.
 */
export function rankConstraintsWithMode(
  constraints: Array<{ friction_id: string; impact_dimension: string; system_impact: string }>,
  mode: AnalysisModeType
): Array<{ friction_id: string; impact_dimension: string; system_impact: string; mode_weighted_score: number }> {
  const profile = getModeProfile(mode);
  return constraints
    .map(c => ({
      ...c,
      mode_weighted_score: (profile.dimension_weights[c.impact_dimension] || 1.0) * 10,
    }))
    .sort((a, b) => b.mode_weighted_score - a.mode_weighted_score);
}

/**
 * Compute mode impact on confidence thresholds.
 * Returns adjusted thresholds based on mode requirements.
 */
export function getModeDecisionThresholds(mode: AnalysisModeType) {
  return getModeProfile(mode).decision_thresholds;
}
