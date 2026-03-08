/**
 * Concept Evaluation Engine — Type Definitions
 */

export interface StructuralFeatures {
  function?: string;
  customer?: string;
  workflow_stage?: string;
  pricing_model?: string;
  distribution?: string;
  regulatory_class?: string;
  capital_intensity?: string;
  [key: string]: string | undefined;
}

export interface AnalogMatch {
  analogId: string;
  name: string;
  similarity: number;
  outcome: string;
}

export interface PriorArtMatch {
  id: string;
  name: string;
  distance: number;
  source: "concept" | "analog";
}

export interface EvaluationDimension {
  score: number;
  confidence: number;
}

export interface StructuralEvaluation extends EvaluationDimension {
  matchedSignals: number;
  totalSignals: number;
}

export interface FeasibilityEvaluation extends EvaluationDimension {
  nearestAnalogs: AnalogMatch[];
}

export interface MarketEvaluation extends EvaluationDimension {
  tamLow: number | null;
  tamHigh: number | null;
  tamBasis: string;
  competitionModifier: number;
}

export interface NoveltyEvaluation extends EvaluationDimension {
  nearestPriorArt: PriorArtMatch[];
  rawDistance: number;
}

export interface ConceptEvaluationResult {
  conceptId: string;
  structural: StructuralEvaluation;
  feasibility: FeasibilityEvaluation;
  market: MarketEvaluation;
  novelty: NoveltyEvaluation;
  executionPenalty: number;
  composite: number;
  weightedComposite: number;
  verdict: "strong" | "moderate" | "weak" | "rejected";
}

/** Minimal concept shape needed for evaluation */
export interface EvaluableConcept {
  id: string;
  domain?: string;
  concept_type?: string;
  structural_features: StructuralFeatures;
  opportunity_zone_id?: string;
}

/** Minimal opportunity zone shape */
export interface EvaluableZone {
  id: string;
  archetype: string;
  signal_strength: number;
  contributing_signals: Record<string, number>;
}

/** Minimal market signal shape */
export interface EvaluableMarketSignals {
  fragmentation_index: number | null;
  margin_distribution: number | null;
  pricing_model_age: number | null;
  productizability_score: number | null;
  asset_intensity_score: number | null;
  ownership_demographics_score: number | null;
  distribution_control_score: number | null;
}

/** Minimal analog shape */
export interface EvaluableAnalog {
  id: string;
  name: string;
  domain?: string;
  structural_features: StructuralFeatures;
  outcome: string;
}

/** Minimal prior concept shape for novelty */
export interface EvaluablePriorConcept {
  id: string;
  title: string;
  domain?: string;
  structural_features: StructuralFeatures;
}

/** Market context for TAM estimation */
export interface MarketContext {
  market_size_estimate?: string | null;
  competitor_count?: number;
  demand_evidence_values?: number[];
}

/** Full context bundle passed to the evaluator */
export interface EvaluationContext {
  zone?: EvaluableZone | null;
  marketSignals?: EvaluableMarketSignals | null;
  marketContext?: MarketContext | null;
  analogs: EvaluableAnalog[];
  priorConcepts: EvaluablePriorConcept[];
}

// ── Weights ──────────────────────────────────────────────────

export const EVAL_WEIGHTS = {
  structural: 0.35,
  feasibility: 0.30,
  market: 0.25,
  novelty: 0.10,
} as const;

export const OUTCOME_WEIGHTS: Record<string, number> = {
  successful: 1.0,
  acquired: 0.9,
  unknown: 0.5,
  failed: -0.15,
};

export const VERDICT_THRESHOLDS = {
  strong: 0.65,
  moderate: 0.45,
  weak: 0.25,
} as const;
