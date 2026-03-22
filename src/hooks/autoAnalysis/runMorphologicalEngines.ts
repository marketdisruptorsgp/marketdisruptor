/**
 * Pure function that runs deterministic morphological search and
 * constraint-based idea-generation engines (<100ms total, no AI cost).
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicInsight } from "@/lib/strategicEngine";
import type { OpportunityZone, OpportunityVector } from "@/lib/opportunityDesignEngine";
import type { ConstraintInversion } from "@/lib/constraintInverter";
import type { SecondOrderUnlock } from "@/lib/secondOrderEngine";
import type { TemporalUnlock } from "@/lib/temporalArbitrageEngine";
import type { CompetitiveGap } from "@/lib/negativeSpaceEngine";
import {
  runMorphologicalSearch,
  extractBaseline,
  identifyActiveDimensions,
  getDimensionsByStatus,
} from "@/lib/opportunityDesignEngine";
import { buildDiagnosticContext, extractLensConfig } from "@/lib/diagnosticContext";
import { extractConstraintShapes } from "@/lib/analogEngine";
import { generateInversions } from "@/lib/constraintInverter";
import { generateSecondOrderUnlocks } from "@/lib/secondOrderEngine";
import { generateTemporalUnlocks } from "@/lib/temporalArbitrageEngine";
import { exploreNegativeSpace } from "@/lib/negativeSpaceEngine";

export interface MorphologicalResult {
  zones: OpportunityZone[];
  vectors: OpportunityVector[];
  constraintInversions: ConstraintInversion[];
  secondOrderUnlocks: SecondOrderUnlock[];
  temporalUnlocks: TemporalUnlock[];
  competitiveGaps: CompetitiveGap[];
  /** Run mode used for this analysis — full/limited/inversions_only */
  runMode?: MorphRunMode;
  /** True when evidence was below ideal threshold but above minimum */
  degradedConfidence?: boolean;
}

/** Tiered run mode based on evidence depth */
export type MorphRunMode = "full" | "limited" | "inversions_only";

export function runMorphologicalEngines(
  flatEvidence: Evidence[],
  activeConstraints: any[],
  insights: StrategicInsight[],
  analysisMode: "product" | "service" | "business_model",
  lensConfig: Record<string, unknown> | null,
): MorphologicalResult {
  const result: MorphologicalResult = {
    zones: [],
    vectors: [],
    constraintInversions: [],
    secondOrderUnlocks: [],
    temporalUnlocks: [],
    competitiveGaps: [],
  };

  const leveragePoints = insights.filter(i => i.insightType === "leverage_point");

  const evidenceCount = flatEvidence.length;
  const hasSufficientConstraints = activeConstraints.length >= 1;

  // Hard minimum: need at least 1 constraint and 5 evidence items
  if (!hasSufficientConstraints || evidenceCount < 5) return result;

  // Tiered run mode based on evidence depth
  const runMode: MorphRunMode = evidenceCount >= 18 ? "full" : evidenceCount >= 10 ? "limited" : "inversions_only";
  result.runMode = runMode;
  result.degradedConfidence = runMode !== "full";

  const morphDiagnosticContext = buildDiagnosticContext(analysisMode, extractLensConfig(lensConfig));

  // Full and limited modes run morphological search
  if (runMode === "full" || runMode === "limited") {
    try {
      const morphResult = runMorphologicalSearch(flatEvidence, activeConstraints, leveragePoints, [], morphDiagnosticContext);
      result.zones = morphResult.zones;
      // Cap vectors in limited mode to reduce noise from thin evidence
      result.vectors = runMode === "limited" ? morphResult.vectors.slice(0, 3) : morphResult.vectors;
      console.log(`[Morphological] Auto-ran (${runMode}): ${result.vectors.length} vectors, ${result.zones.length} zones`);
    } catch (err) {
      console.warn("[Morphological] Auto-run failed:", err);
    }
  }

  // All modes run inversions and unlocks
  try {
    const constraintShapes = extractConstraintShapes(activeConstraints, flatEvidence);
    const rawBaseline = extractBaseline(flatEvidence, activeConstraints, leveragePoints);
    const baseline = identifyActiveDimensions(rawBaseline, activeConstraints, leveragePoints, morphDiagnosticContext);
    const hotDims = getDimensionsByStatus(baseline, "hot");
    const warmDims = getDimensionsByStatus(baseline, "warm");
    const activeDims = [...hotDims, ...warmDims];

    result.constraintInversions = generateInversions(constraintShapes, 2, 4);
    result.secondOrderUnlocks = generateSecondOrderUnlocks(constraintShapes, 2, 4);

    if (runMode !== "inversions_only") {
      result.temporalUnlocks = generateTemporalUnlocks(constraintShapes, activeDims, 5);
      result.competitiveGaps = exploreNegativeSpace(flatEvidence, activeDims, 4);
    }
    console.log(`[StrategicEngines] Surfaced constraint inversions, second-order unlocks (${runMode} mode)`);
  } catch (err) {
    console.warn("[StrategicEngines] Engine run failed:", err);
  }

  return result;
}
