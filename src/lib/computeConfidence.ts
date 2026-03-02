/**
 * EVIDENCE-GOVERNED CONFIDENCE COMPUTATION
 * 
 * Replaces AI-generated narrative confidence with computed confidence
 * derived from evidence quality distribution.
 */

export type EvidenceStatus = "verified" | "modeled" | "speculative" | "assumption";

export interface ViabilityAssumption {
  assumption: string;
  evidence_status: EvidenceStatus;
  leverage_if_wrong: number; // 1-10
}

export interface ConfidenceResult {
  confidence_score: number; // 0-100
  evidence_distribution: {
    verified: number;
    modeled: number;
    speculative: number;
    assumption: number;
  };
  decision_grade: "proceed" | "conditional" | "blocked";
  computation_trace: string;
  blocking_reasons: string[];
}

const EVIDENCE_WEIGHTS: Record<string, number> = {
  verified: 1.0,
  modeled: 0.6,
  speculative: 0.3,
  assumption: 0.3,
};

/**
 * Compute confidence from evidence quality distribution.
 * 
 * confidence = weighted_mean(evidence) * constraint_proof_quality * falsification_resilience
 */
export function computeConfidence(
  assumptions: ViabilityAssumption[],
  constraintProofQuality: number, // 0-1, based on dominance_proof presence
  falsificationResilience: number, // 0-1, inverse of model_fragility_score/100
  evidenceThreshold: number = 0.3 // from lens weighting
): ConfidenceResult {
  const blockingReasons: string[] = [];
  
  if (!assumptions || assumptions.length === 0) {
    return {
      confidence_score: 20,
      evidence_distribution: { verified: 0, modeled: 0, speculative: 0, assumption: 0 },
      decision_grade: "blocked",
      computation_trace: "No viability assumptions provided — cannot compute confidence",
      blocking_reasons: ["No evidence base for confidence computation"],
    };
  }
  
  // Count evidence distribution
  const distribution = { verified: 0, modeled: 0, speculative: 0, assumption: 0 };
  for (const a of assumptions) {
    const status = normalizeStatus(a.evidence_status);
    distribution[status] = (distribution[status] || 0) + 1;
  }
  
  const total = assumptions.length;
  const verifiedRatio = distribution.verified / total;
  
  // Weighted evidence mean
  const weightedSum = assumptions.reduce((sum, a) => {
    return sum + (EVIDENCE_WEIGHTS[normalizeStatus(a.evidence_status)] || 0.3);
  }, 0);
  const weightedMean = weightedSum / total;
  
  // Compute raw confidence
  let rawConfidence = weightedMean * constraintProofQuality * falsificationResilience * 100;
  
  // Cap confidence based on evidence quality
  if (distribution.verified === 0) {
    rawConfidence = Math.min(rawConfidence, 65);
    if (rawConfidence > 50) {
      blockingReasons.push("No verified evidence — confidence capped at 65");
    }
  }
  
  // Assumption-only chains get heavy penalty
  if (distribution.verified === 0 && distribution.modeled === 0) {
    rawConfidence = Math.min(rawConfidence, 40);
    blockingReasons.push("Assumption-only evidence chain — confidence capped at 40");
  }
  
  const confidence = Math.round(Math.max(0, Math.min(100, rawConfidence)));
  
  // Determine decision grade
  let decisionGrade: "proceed" | "conditional" | "blocked";
  
  if (confidence > 80 && verifiedRatio < evidenceThreshold) {
    // Can't have high confidence without verified evidence
    blockingReasons.push(`Confidence ${confidence} requires verified evidence ratio ≥ ${evidenceThreshold}`);
    decisionGrade = "conditional";
  } else if (distribution.verified === 0 && distribution.modeled === 0) {
    decisionGrade = "blocked";
    blockingReasons.push("Cannot proceed with assumption-only evidence");
  } else if (confidence >= 60 && verifiedRatio >= evidenceThreshold) {
    decisionGrade = "proceed";
  } else if (confidence >= 35) {
    decisionGrade = "conditional";
  } else {
    decisionGrade = "blocked";
    blockingReasons.push(`Confidence too low (${confidence}) for any decision`);
  }
  
  const trace = [
    `Evidence: ${distribution.verified}v/${distribution.modeled}m/${distribution.speculative + distribution.assumption}s`,
    `Weighted mean: ${weightedMean.toFixed(2)}`,
    `Constraint proof: ${constraintProofQuality.toFixed(2)}`,
    `Falsification resilience: ${falsificationResilience.toFixed(2)}`,
    `Raw: ${rawConfidence.toFixed(1)} → Final: ${confidence}`,
  ].join(" | ");
  
  return {
    confidence_score: confidence,
    evidence_distribution: distribution,
    decision_grade: decisionGrade,
    computation_trace: trace,
    blocking_reasons: blockingReasons,
  };
}

function normalizeStatus(status: string): keyof typeof EVIDENCE_WEIGHTS {
  if (status === "verified") return "verified";
  if (status === "modeled") return "modeled";
  if (status === "speculative" || status === "assumption") return "speculative";
  return "assumption";
}

/**
 * Extract constraint proof quality from a governed constraint_map.
 */
export function getConstraintProofQuality(constraintMap: Record<string, unknown> | undefined): number {
  if (!constraintMap) return 0.3;
  
  let quality = 0.5; // base
  
  if (constraintMap.binding_constraint_id && String(constraintMap.binding_constraint_id).trim()) quality += 0.1;
  if (constraintMap.dominance_proof && String(constraintMap.dominance_proof).trim().length > 20) quality += 0.2;
  if (constraintMap.counterfactual_removal_result && String(constraintMap.counterfactual_removal_result).trim().length > 10) quality += 0.1;
  if (constraintMap.next_binding_constraint && String(constraintMap.next_binding_constraint).trim()) quality += 0.1;
  
  return Math.min(1, quality);
}

/**
 * Extract falsification resilience from a governed falsification artifact.
 */
export function getFalsificationResilience(falsification: Record<string, unknown> | undefined): number {
  if (!falsification) return 0.5; // moderate default
  
  const fragility = Number(falsification.model_fragility_score || 50);
  // Resilience is inverse of fragility
  return Math.max(0.1, Math.min(1, 1 - (fragility / 100)));
}
