/**
 * §7 — LENS ADAPTATION ENGINE
 * 
 * Lenses structurally alter evaluation thresholds, not just prompts.
 * This module applies lens parameters directly into:
 * - Confidence computation
 * - Decision synthesis
 * - Constraint re-scoring
 * - Evidence threshold enforcement
 */

import { computeLensWeights, type LensConfig, type LensWeights, type LensImpactReport, computeLensImpactReport } from "./lensWeighting";
import { computeConfidence, getConstraintProofQuality, getFalsificationResilience, type ConfidenceResult } from "./computeConfidence";

export interface LensAdaptedResult {
  /** Confidence recomputed under lens thresholds */
  confidence: ConfidenceResult;
  /** How the lens changed constraint rankings */
  lensImpact: LensImpactReport;
  /** Which constraints shifted position */
  constraintRankingShifts: Array<{
    friction_id: string;
    default_rank: number;
    lens_rank: number;
    shifted: boolean;
  }>;
  /** Whether the lens changed the decision grade */
  decisionGradeChanged: boolean;
  /** Log of structural changes */
  structuralChangeLog: string[];
}

/**
 * Apply lens adaptation to governed analysis data.
 * Returns the structural impact of the lens on confidence and constraints.
 */
export function applyLensAdaptation(
  governed: Record<string, unknown> | null | undefined,
  lens: LensConfig | null | undefined
): LensAdaptedResult | null {
  if (!governed) return null;

  const lensWeights = computeLensWeights(lens);
  const defaultWeights = computeLensWeights(null);
  const changeLog: string[] = [];

  // 1. Extract governed artifacts
  const fp = governed.first_principles as Record<string, unknown> | undefined;
  const cm = governed.constraint_map as Record<string, unknown> | undefined;
  const fals = governed.falsification as Record<string, unknown> | undefined;
  const ds = governed.decision_synthesis as Record<string, unknown> | undefined;

  // 2. Recompute confidence under lens thresholds
  const assumptions = (fp?.viability_assumptions as Array<{
    assumption: string;
    evidence_status: string;
    leverage_if_wrong: number;
  }>) || [];

  const proofQuality = getConstraintProofQuality(cm);
  const resilience = getFalsificationResilience(fals);

  const defaultConfidence = computeConfidence(
    assumptions as any, proofQuality, resilience, defaultWeights.evidence_threshold
  );
  const lensConfidence = computeConfidence(
    assumptions as any, proofQuality, resilience, lensWeights.evidence_threshold
  );

  if (defaultConfidence.decision_grade !== lensConfidence.decision_grade) {
    changeLog.push(
      `Decision grade shifted: ${defaultConfidence.decision_grade} → ${lensConfidence.decision_grade} (lens evidence threshold: ${lensWeights.evidence_threshold})`
    );
  }

  if (Math.abs(defaultConfidence.confidence_score - lensConfidence.confidence_score) > 3) {
    changeLog.push(
      `Confidence shifted: ${defaultConfidence.confidence_score} → ${lensConfidence.confidence_score}`
    );
  }

  // 3. Re-rank constraints under lens weights
  const causalChains = (cm?.causal_chains as Array<{
    friction_id: string;
    impact_dimension: string;
    system_impact: string;
  }>) || [];

  const defaultRanked = rankWithWeights(causalChains, defaultWeights);
  const lensRanked = rankWithWeights(causalChains, lensWeights);

  const rankingShifts = causalChains.map(c => {
    const dIdx = defaultRanked.findIndex(r => r.friction_id === c.friction_id);
    const lIdx = lensRanked.findIndex(r => r.friction_id === c.friction_id);
    return {
      friction_id: c.friction_id,
      default_rank: dIdx + 1,
      lens_rank: lIdx + 1,
      shifted: dIdx !== lIdx,
    };
  });

  const hasRankingShift = rankingShifts.some(s => s.shifted);
  if (hasRankingShift) {
    const shifts = rankingShifts.filter(s => s.shifted)
      .map(s => `${s.friction_id}: #${s.default_rank} → #${s.lens_rank}`)
      .join(", ");
    changeLog.push(`Constraint ranking shifted: ${shifts}`);
  }

  // 4. Check if binding constraint changed
  if (defaultRanked.length > 0 && lensRanked.length > 0) {
    if (defaultRanked[0].friction_id !== lensRanked[0].friction_id) {
      changeLog.push(
        `Binding constraint changed: ${defaultRanked[0].friction_id} → ${lensRanked[0].friction_id}`
      );
    }
  }

  // 5. Compute lens impact report
  const lensImpact = computeLensImpactReport(lens, causalChains);

  return {
    confidence: lensConfidence,
    lensImpact,
    constraintRankingShifts: rankingShifts,
    decisionGradeChanged: defaultConfidence.decision_grade !== lensConfidence.decision_grade,
    structuralChangeLog: changeLog,
  };
}

function rankWithWeights(
  constraints: Array<{ friction_id: string; impact_dimension: string; system_impact: string }>,
  weights: LensWeights
): Array<{ friction_id: string; weighted_score: number }> {
  return constraints
    .map(c => ({
      friction_id: c.friction_id,
      weighted_score: (weights.constraint_priority_weights[c.impact_dimension] || 1.0) * 10,
    }))
    .sort((a, b) => b.weighted_score - a.weighted_score);
}

/**
 * Read stored lens adaptation from analysis_data.
 * Returns null if no lens was applied.
 */
export function readStoredLensImpact(
  analysisData: Record<string, unknown> | null | undefined
): LensAdaptedResult | null {
  if (!analysisData) return null;
  const stored = analysisData._lensAdaptation as LensAdaptedResult | undefined;
  return stored || null;
}
