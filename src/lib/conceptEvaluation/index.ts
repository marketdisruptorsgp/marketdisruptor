/**
 * Concept Evaluation Engine — Public API
 */

export { evaluateConcept, evaluateConceptBatch, resultToEvaluationRows } from "./engine";
export type { ConceptEvaluationRow } from "./engine";

export {
  scoreStructuralAlignment,
  scoreAnalogFeasibility,
  scoreMarketPotential,
  scoreNovelty,
  computeExecutionPenalty,
} from "./scorers";

export type {
  StructuralFeatures,
  AnalogMatch,
  PriorArtMatch,
  EvaluationDimension,
  StructuralEvaluation,
  FeasibilityEvaluation,
  MarketEvaluation,
  NoveltyEvaluation,
  ConceptEvaluationResult,
  EvaluableConcept,
  EvaluableZone,
  EvaluableMarketSignals,
  EvaluableAnalog,
  EvaluablePriorConcept,
  MarketContext,
  EvaluationContext,
} from "./types";

export { EVAL_WEIGHTS, OUTCOME_WEIGHTS, VERDICT_THRESHOLDS } from "./types";
