/**
 * ADAPTIVE EXECUTION ENGINE — §10-11
 * 
 * System adapts based on input quality, mode, lens, and evidence strength.
 * Provides decision-grade classification with structural criteria.
 */

import type { AnalysisModeType } from "./modeConstraintWeights";
import { getModeDecisionThresholds } from "./modeConstraintWeights";
import type { LensWeights } from "./lensWeighting";
import { computeLensWeights } from "./lensWeighting";
import type { EvidenceRegistry } from "./evidenceRegistry";
import { getProvenanceConfidenceMultiplier } from "./evidenceRegistry";

export interface ExecutionGate {
  canProceed: boolean;
  blockReason: string | null;
  requiredAction: string | null;
  dataCompleteness: number; // 0-1
  evidenceQuality: number; // 0-1
}

export interface DecisionGradeResult {
  grade: "proceed" | "conditional" | "blocked";
  confidence: number;
  blocking_reasons: string[];
  required_evidence: string[];
  structural_criteria: {
    constraint_proof_present: boolean;
    evidence_quality_sufficient: boolean;
    falsification_resilient: boolean;
    data_provenance_traceable: boolean;
    lens_thresholds_met: boolean;
  };
}

/**
 * Check if execution can proceed for a given step.
 * Blocks when data is insufficient or constraints not proven.
 */
export function checkExecutionGate(
  stepKey: string,
  analysisData: Record<string, unknown> | null,
  mode: AnalysisModeType
): ExecutionGate {
  if (!analysisData) {
    return {
      canProceed: false,
      blockReason: "No analysis data available",
      requiredAction: "Run initial analysis first",
      dataCompleteness: 0,
      evidenceQuality: 0,
    };
  }

  const governed = analysisData.governed as Record<string, unknown> | undefined;

  // Steps that require governed data
  const governedRequiredSteps = ["redesign", "stressTest", "pitchDeck", "businessStressTest", "businessPitchDeck"];
  
  if (governedRequiredSteps.includes(stepKey) && !governed) {
    return {
      canProceed: false,
      blockReason: "Governed reasoning artifacts not yet generated",
      requiredAction: "Complete the analysis pipeline from the beginning",
      dataCompleteness: 0.3,
      evidenceQuality: 0,
    };
  }

  // Check constraint proof for redesign steps
  if (stepKey === "redesign" && governed) {
    const cm = governed.constraint_map as Record<string, unknown> | undefined;
    if (!cm?.binding_constraint_id) {
      return {
        canProceed: false,
        blockReason: "Binding constraint not yet identified",
        requiredAction: "Complete constraint analysis before redesign",
        dataCompleteness: 0.5,
        evidenceQuality: 0.3,
      };
    }
  }

  // Check causal chain completeness
  if (stepKey === "stressTest" && governed) {
    const cm = governed.constraint_map as Record<string, unknown> | undefined;
    const chains = (cm?.causal_chains as unknown[]) || [];
    if (chains.length === 0) {
      return {
        canProceed: false,
        blockReason: "Causal chain incomplete — cannot stress test without structural model",
        requiredAction: "Regenerate analysis to produce causal chains",
        dataCompleteness: 0.6,
        evidenceQuality: 0.4,
      };
    }
  }

  // Data completeness check
  const dataKeys = Object.keys(analysisData).filter(k => !["governed", "governedHashes", "previousSnapshot", "outdatedSteps"].includes(k));
  const completeness = Math.min(1, dataKeys.length / 5);

  return {
    canProceed: true,
    blockReason: null,
    requiredAction: null,
    dataCompleteness: completeness,
    evidenceQuality: governed ? 0.7 : 0.3,
  };
}

/**
 * Compute decision grade from all structural criteria.
 * This is the definitive classification for any analysis output.
 */
export function computeDecisionGrade(
  governed: Record<string, unknown> | null,
  mode: AnalysisModeType,
  lens: { name: string; lensType?: string; evaluation_priorities?: Record<string, number>; risk_tolerance?: string; time_horizon?: string } | null,
  registry: EvidenceRegistry | null
): DecisionGradeResult {
  const blockingReasons: string[] = [];
  const requiredEvidence: string[] = [];

  if (!governed) {
    return {
      grade: "blocked",
      confidence: 0,
      blocking_reasons: ["No governed reasoning artifacts available"],
      required_evidence: ["Complete the analysis pipeline"],
      structural_criteria: {
        constraint_proof_present: false,
        evidence_quality_sufficient: false,
        falsification_resilient: false,
        data_provenance_traceable: false,
        lens_thresholds_met: false,
      },
    };
  }

  // 1. Constraint proof strength
  const cm = governed.constraint_map as Record<string, unknown> | undefined;
  const constraintProofPresent = !!(cm?.binding_constraint_id && cm?.dominance_proof);
  if (!constraintProofPresent) {
    blockingReasons.push("Binding constraint not proven with dominance evidence");
    requiredEvidence.push("Comparative constraint analysis with dominance proof");
  }

  // 2. Evidence quality
  const fp = governed.first_principles as Record<string, unknown> | undefined;
  const assumptions = (fp?.viability_assumptions as Array<{ evidence_status: string }>) || [];
  const hasVerified = assumptions.some(a => a.evidence_status === "verified");
  const hasModeled = assumptions.some(a => a.evidence_status === "modeled");
  const thresholds = getModeDecisionThresholds(mode);
  const evidenceQualitySufficient = thresholds.require_verified_evidence ? hasVerified : (hasVerified || hasModeled);
  if (!evidenceQualitySufficient) {
    blockingReasons.push(`${mode} mode requires ${thresholds.require_verified_evidence ? "verified" : "modeled or verified"} evidence`);
    requiredEvidence.push("Upgrade evidence from speculative to modeled or verified");
  }

  // 3. Falsification resilience
  const falsification = governed.falsification as Record<string, unknown> | undefined;
  const fragility = Number(falsification?.model_fragility_score || 50);
  const falsificationResilient = fragility < 70;
  if (!falsificationResilient) {
    blockingReasons.push(`Model fragility too high (${fragility}/100)`);
    requiredEvidence.push("Address fragility conditions or gather evidence to reduce uncertainty");
  }

  // 4. Data provenance
  const provenanceMultiplier = registry ? getProvenanceConfidenceMultiplier(registry) : 0.7;
  const dataProvenanceTraceable = provenanceMultiplier >= 0.7;
  if (!dataProvenanceTraceable) {
    blockingReasons.push("Data provenance insufficient — too many unverified or stale sources");
  }

  // 5. Lens thresholds
  const lensWeights = computeLensWeights(lens as any);
  const ds = governed.decision_synthesis as Record<string, unknown> | undefined;
  const storedConfidence = Number(ds?.confidence_score || 0);
  const lensThresholdsMet = storedConfidence >= (lensWeights.evidence_threshold * 100);
  if (!lensThresholdsMet && storedConfidence > 0) {
    blockingReasons.push(`Confidence ${storedConfidence} below lens threshold ${Math.round(lensWeights.evidence_threshold * 100)}`);
  }

  // Apply mode-adjusted confidence
  const adjustedConfidence = Math.round(storedConfidence * provenanceMultiplier);

  // Grade determination
  let grade: "proceed" | "conditional" | "blocked";
  if (blockingReasons.length === 0 && adjustedConfidence >= thresholds.proceed_min_confidence) {
    grade = "proceed";
  } else if (adjustedConfidence >= thresholds.conditional_min_confidence && blockingReasons.length <= 2) {
    grade = "conditional";
  } else {
    grade = "blocked";
  }

  return {
    grade,
    confidence: adjustedConfidence,
    blocking_reasons: blockingReasons,
    required_evidence: requiredEvidence,
    structural_criteria: {
      constraint_proof_present: constraintProofPresent,
      evidence_quality_sufficient: evidenceQualitySufficient,
      falsification_resilient: falsificationResilient,
      data_provenance_traceable: dataProvenanceTraceable,
      lens_thresholds_met: lensThresholdsMet,
    },
  };
}
