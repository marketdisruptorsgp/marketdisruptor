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
import type { InnovationMode } from "@/lib/modeIntelligence";
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
  /** All active engine modes — populated in multi-mode analyses */
  activeModes?: InnovationMode[],
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

  // Scale evidence thresholds by the number of active modes.
  // Multi-mode evidence is spread across schemas so the per-mode density
  // is lower — raise the floor to avoid false "full confidence" with thin coverage.
  const modeCount = activeModes && activeModes.length > 1 ? activeModes.length : 1;
  const fullThreshold  = 18 + (modeCount - 1) * 8;  // 18 → 26 → 34
  const limitedThreshold = 10 + (modeCount - 1) * 4; // 10 → 14 → 18

  // Tiered run mode based on evidence depth
  const runMode: MorphRunMode = evidenceCount >= fullThreshold ? "full"
    : evidenceCount >= limitedThreshold ? "limited"
    : "inversions_only";
  result.runMode = runMode;
  result.degradedConfidence = runMode !== "full";

  // Build a blended DiagnosticContext that carries all active modes
  const morphDiagnosticContext = buildDiagnosticContext(
    analysisMode,
    extractLensConfig(lensConfig),
    activeModes && activeModes.length > 1 ? activeModes : undefined,
  );

  // Full and limited modes run morphological search
  if (runMode === "full" || runMode === "limited") {
    try {
      const morphResult = runMorphologicalSearch(flatEvidence, activeConstraints, leveragePoints, [], morphDiagnosticContext);
      result.zones = morphResult.zones;
      // Cap vectors in limited mode to reduce noise from thin evidence
      result.vectors = runMode === "limited" ? morphResult.vectors.slice(0, 3) : morphResult.vectors;
      console.log(`[Morphological] Auto-ran (${runMode}): ${result.vectors.length} vectors, ${result.zones.length} zones`);

      // ── Pipeline Trace: morphological results ──
      try {
        const { traceMorphological, traceEvent } = await import("@/lib/pipelineTrace");
        traceEvent(`morphological_search: ${result.vectors.length} vectors, ${result.zones.length} zones (${runMode})`);
        traceMorphological({
          runMode,
          evidenceCount: evidenceCount,
          fullThreshold,
          limitedThreshold,
          zoneCount: result.zones.length,
          vectorCount: result.vectors.length,
          constraintInversionCount: 0, // updated after inversions
          secondOrderUnlockCount: 0,
          temporalUnlockCount: 0,
          competitiveGapCount: 0,
          degradedConfidence: result.degradedConfidence ?? false,
        });
      } catch (_) { /* trace not initialized */ }

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

    result.constraintInversions = generateInversions(constraintShapes, 2, 4, analysisMode);
    result.secondOrderUnlocks = generateSecondOrderUnlocks(constraintShapes, 2, 4);

    if (runMode !== "inversions_only") {
      result.temporalUnlocks = generateTemporalUnlocks(constraintShapes, activeDims, 5);
      result.competitiveGaps = exploreNegativeSpace(flatEvidence, activeDims, 4);
    }
    console.log(`[StrategicEngines] Surfaced constraint inversions, second-order unlocks (${runMode} mode)`);

    // ── Pipeline Trace: final morphological counts ──
    try {
      const { traceMorphological } = require("@/lib/pipelineTrace");
      traceMorphological({
        runMode,
        evidenceCount: evidenceCount,
        fullThreshold,
        limitedThreshold,
        zoneCount: result.zones.length,
        vectorCount: result.vectors.length,
        constraintInversionCount: result.constraintInversions.length,
        secondOrderUnlockCount: result.secondOrderUnlocks.length,
        temporalUnlockCount: result.temporalUnlocks.length,
        competitiveGapCount: result.competitiveGaps.length,
        degradedConfidence: result.degradedConfidence ?? false,
      });
    } catch (_) { /* trace not initialized */ }
  } catch (err) {
    console.warn("[StrategicEngines] Engine run failed:", err);
  }

  return result;
}
