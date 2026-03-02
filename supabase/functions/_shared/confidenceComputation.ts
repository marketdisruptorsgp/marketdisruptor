/**
 * EDGE FUNCTION: Evidence-Governed Confidence Computation
 * Server-side confidence calculation from evidence quality.
 */

interface ViabilityAssumption {
  assumption: string;
  evidence_status: string;
  leverage_if_wrong: number;
}

const EVIDENCE_WEIGHTS: Record<string, number> = {
  verified: 1.0,
  modeled: 0.6,
  speculative: 0.3,
  assumption: 0.3,
};

function normalizeStatus(status: string): string {
  if (status === "verified" || status === "modeled") return status;
  return "speculative";
}

/**
 * Compute confidence from evidence quality.
 * Returns adjusted confidence and decision grade.
 */
export function computeGovernedConfidence(
  governed: Record<string, unknown>,
  evidenceThreshold: number = 0.3
): {
  computed_confidence: number;
  computed_decision_grade: "proceed" | "conditional" | "blocked";
  evidence_distribution: Record<string, number>;
  computation_trace: string;
} {
  const fp = governed.first_principles as Record<string, unknown> | undefined;
  const assumptions = (fp?.viability_assumptions as ViabilityAssumption[]) || [];
  const cm = governed.constraint_map as Record<string, unknown> | undefined;
  const falsification = governed.falsification as Record<string, unknown> | undefined;

  if (assumptions.length === 0) {
    return {
      computed_confidence: 25,
      computed_decision_grade: "blocked",
      evidence_distribution: { verified: 0, modeled: 0, speculative: 0 },
      computation_trace: "No viability assumptions — confidence blocked",
    };
  }

  // Evidence distribution
  const dist: Record<string, number> = { verified: 0, modeled: 0, speculative: 0 };
  for (const a of assumptions) {
    const s = normalizeStatus(a.evidence_status);
    dist[s] = (dist[s] || 0) + 1;
  }

  const total = assumptions.length;
  const verifiedRatio = dist.verified / total;

  // Weighted mean
  const weightedSum = assumptions.reduce((sum, a) => sum + (EVIDENCE_WEIGHTS[normalizeStatus(a.evidence_status)] || 0.3), 0);
  const weightedMean = weightedSum / total;

  // Constraint proof quality
  let proofQuality = 0.5;
  if (cm?.binding_constraint_id && String(cm.binding_constraint_id).trim()) proofQuality += 0.15;
  if (cm?.dominance_proof && String(cm.dominance_proof).trim().length > 20) proofQuality += 0.2;
  if (cm?.counterfactual_removal_result && String(cm.counterfactual_removal_result).trim().length > 10) proofQuality += 0.15;

  // Falsification resilience
  const fragility = Number(falsification?.model_fragility_score || 50);
  const resilience = Math.max(0.1, 1 - fragility / 100);

  let confidence = Math.round(weightedMean * proofQuality * resilience * 100);

  // Caps
  if (dist.verified === 0) confidence = Math.min(confidence, 65);
  if (dist.verified === 0 && dist.modeled === 0) confidence = Math.min(confidence, 40);
  confidence = Math.max(0, Math.min(100, confidence));

  // Decision grade
  let grade: "proceed" | "conditional" | "blocked";
  if (dist.verified === 0 && dist.modeled === 0) {
    grade = "blocked";
  } else if (confidence >= 60 && verifiedRatio >= evidenceThreshold) {
    grade = "proceed";
  } else if (confidence >= 35) {
    grade = "conditional";
  } else {
    grade = "blocked";
  }

  const trace = `${dist.verified}v/${dist.modeled}m/${dist.speculative}s | wm=${weightedMean.toFixed(2)} pq=${proofQuality.toFixed(2)} fr=${resilience.toFixed(2)} → ${confidence}`;

  return { computed_confidence: confidence, computed_decision_grade: grade, evidence_distribution: dist, computation_trace: trace };
}
