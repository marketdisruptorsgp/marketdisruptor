/**
 * Concept Evaluation Engine — Main Entry Point
 *
 * Orchestrates the four scoring dimensions, applies execution penalty,
 * computes composite + verdict, and returns structured results.
 */

import type {
  EvaluableConcept,
  EvaluationContext,
  ConceptEvaluationResult,
} from "./types";
import { EVAL_WEIGHTS, VERDICT_THRESHOLDS } from "./types";
import {
  scoreStructuralAlignment,
  scoreAnalogFeasibility,
  scoreMarketPotential,
  scoreNovelty,
  computeExecutionPenalty,
} from "./scorers";

// ═══════════════════════════════════════════════════════════════
//  EVALUATE A SINGLE CONCEPT
// ═══════════════════════════════════════════════════════════════

export function evaluateConcept(
  concept: EvaluableConcept,
  context: EvaluationContext
): ConceptEvaluationResult {
  const structural = scoreStructuralAlignment(
    concept,
    context.zone,
    context.marketSignals
  );

  const feasibility = scoreAnalogFeasibility(concept, context.analogs);

  const market = scoreMarketPotential(
    concept,
    context.marketContext,
    context.analogs
  );

  const novelty = scoreNovelty(
    concept,
    context.priorConcepts,
    context.analogs
  );

  const executionPenalty = computeExecutionPenalty(concept.structural_features);

  // Weighted composite
  const composite =
    structural.score * EVAL_WEIGHTS.structural +
    feasibility.score * EVAL_WEIGHTS.feasibility +
    market.score * EVAL_WEIGHTS.market +
    novelty.score * EVAL_WEIGHTS.novelty -
    executionPenalty;

  const clampedComposite = Math.max(0, Math.min(1, composite));

  // Average confidence across all dimensions
  const avgConfidence =
    (structural.confidence +
      feasibility.confidence +
      market.confidence +
      novelty.confidence) /
    4;

  const weightedComposite = clampedComposite * avgConfidence;

  // Verdict
  let verdict: ConceptEvaluationResult["verdict"];
  if (weightedComposite >= VERDICT_THRESHOLDS.strong) verdict = "strong";
  else if (weightedComposite >= VERDICT_THRESHOLDS.moderate) verdict = "moderate";
  else if (weightedComposite >= VERDICT_THRESHOLDS.weak) verdict = "weak";
  else verdict = "rejected";

  return {
    conceptId: concept.id,
    structural,
    feasibility,
    market,
    novelty,
    executionPenalty: Math.round(executionPenalty * 1000) / 1000,
    composite: Math.round(clampedComposite * 1000) / 1000,
    weightedComposite: Math.round(weightedComposite * 1000) / 1000,
    verdict,
  };
}

// ═══════════════════════════════════════════════════════════════
//  BATCH EVALUATE (for guided search loop)
// ═══════════════════════════════════════════════════════════════

export function evaluateConceptBatch(
  concepts: EvaluableConcept[],
  context: EvaluationContext
): ConceptEvaluationResult[] {
  return concepts
    .map((c) => evaluateConcept(c, context))
    .sort((a, b) => b.weightedComposite - a.weightedComposite);
}

// ═══════════════════════════════════════════════════════════════
//  CONVERT RESULT → DB ROWS (concept_evaluations)
// ═══════════════════════════════════════════════════════════════

export interface ConceptEvaluationRow {
  concept_id: string;
  user_id: string;
  evaluation_type: string;
  score: number;
  confidence_score: number;
  reasoning: string;
  nearest_analogs: unknown[];
  nearest_prior_art: unknown[];
  signal_strengths: Record<string, unknown>;
  tam_estimate_low: number | null;
  tam_estimate_high: number | null;
  tam_basis: string | null;
}

export function resultToEvaluationRows(
  result: ConceptEvaluationResult,
  userId: string
): ConceptEvaluationRow[] {
  const base = {
    concept_id: result.conceptId,
    user_id: userId,
    nearest_analogs: [],
    nearest_prior_art: [],
    signal_strengths: {},
    tam_estimate_low: null,
    tam_estimate_high: null,
    tam_basis: null,
  };

  return [
    {
      ...base,
      evaluation_type: "structural",
      score: result.structural.score,
      confidence_score: result.structural.confidence,
      reasoning: `${result.structural.matchedSignals}/${result.structural.totalSignals} contributing signals above threshold`,
      signal_strengths: {
        matchedSignals: result.structural.matchedSignals,
        totalSignals: result.structural.totalSignals,
      },
    },
    {
      ...base,
      evaluation_type: "feasibility",
      score: result.feasibility.score,
      confidence_score: result.feasibility.confidence,
      reasoning: result.feasibility.nearestAnalogs.length > 0
        ? `Top analog: ${result.feasibility.nearestAnalogs[0].name} (${Math.round(result.feasibility.nearestAnalogs[0].similarity * 100)}% similar, ${result.feasibility.nearestAnalogs[0].outcome})`
        : "No analogs available for comparison",
      nearest_analogs: result.feasibility.nearestAnalogs,
    },
    {
      ...base,
      evaluation_type: "market",
      score: result.market.score,
      confidence_score: result.market.confidence,
      reasoning: `${result.market.tamBasis}. Competition modifier: ${result.market.competitionModifier}`,
      tam_estimate_low: result.market.tamLow,
      tam_estimate_high: result.market.tamHigh,
      tam_basis: result.market.tamBasis,
      signal_strengths: { competitionModifier: result.market.competitionModifier },
    },
    {
      ...base,
      evaluation_type: "novelty",
      score: result.novelty.score,
      confidence_score: result.novelty.confidence,
      reasoning: result.novelty.nearestPriorArt.length > 0
        ? `Nearest: ${result.novelty.nearestPriorArt[0].name} (distance: ${result.novelty.rawDistance.toFixed(2)})`
        : "No prior art found — highly novel but unvalidated",
      nearest_prior_art: result.novelty.nearestPriorArt,
    },
  ];
}
