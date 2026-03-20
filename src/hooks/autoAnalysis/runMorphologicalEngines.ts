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
}

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
  if (activeConstraints.length < 1 || flatEvidence.length < 18) return result;

  const morphDiagnosticContext = buildDiagnosticContext(analysisMode, extractLensConfig(lensConfig));

  try {
    const morphResult = runMorphologicalSearch(flatEvidence, activeConstraints, leveragePoints, [], morphDiagnosticContext);
    result.zones = morphResult.zones;
    result.vectors = morphResult.vectors;
    console.log(`[Morphological] Auto-ran: ${morphResult.vectors.length} vectors, ${morphResult.zones.length} zones`);
  } catch (err) {
    console.warn("[Morphological] Auto-run failed:", err);
  }

  try {
    const constraintShapes = extractConstraintShapes(activeConstraints, flatEvidence);
    const rawBaseline = extractBaseline(flatEvidence, activeConstraints, leveragePoints);
    const baseline = identifyActiveDimensions(rawBaseline, activeConstraints, leveragePoints, morphDiagnosticContext);
    const hotDims = getDimensionsByStatus(baseline, "hot");
    const warmDims = getDimensionsByStatus(baseline, "warm");
    const activeDims = [...hotDims, ...warmDims];

    result.constraintInversions = generateInversions(constraintShapes, 2, 4);
    result.secondOrderUnlocks = generateSecondOrderUnlocks(constraintShapes, 2, 4);
    result.temporalUnlocks = generateTemporalUnlocks(constraintShapes, activeDims, 5);
    result.competitiveGaps = exploreNegativeSpace(flatEvidence, activeDims, 4);
    console.log("[StrategicEngines] Surfaced constraint inversions, second-order unlocks, temporal unlocks, competitive gaps");
  } catch (err) {
    console.warn("[StrategicEngines] Engine run failed:", err);
  }

  return result;
}
