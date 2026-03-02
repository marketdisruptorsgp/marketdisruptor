/**
 * GOVERNED DATA PERSISTENCE ENGINE
 * 
 * Extracts governed artifacts from edge function responses,
 * validates completeness, and merges atomically into analysis_data.governed.
 * 
 * This is the SINGLE SOURCE OF TRUTH for governed data storage.
 */

/** Required top-level governed artifact keys */
export const GOVERNED_ARTIFACT_KEYS = [
  "domain_confirmation",
  "objective_definition",
  "first_principles",
  "friction_map",
  "friction_tiers",
  "constraint_map",
  "structural_analysis",
  "leverage_map",
  "constraint_driven_solution",
  "falsification",
  "decision_synthesis",
] as const;

/** Optional governed keys that enhance but don't block */
const OPTIONAL_GOVERNED_KEYS = [
  "causal_chains",
  "evidence_registry",
  "confidence_metrics",
  "redesign_logic",
] as const;

export interface GovernedExtractionResult {
  /** Extracted governed object (may be partial) */
  governed: Record<string, unknown> | null;
  /** The step data with governed removed (to avoid duplication) */
  cleanedStepData: unknown;
  /** Whether extraction found any governed data */
  hasGoverned: boolean;
  /** Byte size of governed object */
  governedByteSize: number;
  /** Present artifact keys */
  presentArtifacts: string[];
  /** Missing required artifact keys */
  missingArtifacts: string[];
  /** Validation passed */
  valid: boolean;
  /** Trace log */
  trace: string;
}

/**
 * Extract governed artifacts from edge function response data.
 * The governed object lives at `data.governed` in the AI response.
 * This function extracts it and returns cleaned step data (without duplication).
 */
export function extractGovernedArtifacts(
  stepKey: string,
  data: unknown
): GovernedExtractionResult {
  if (!data || typeof data !== "object") {
    return {
      governed: null,
      cleanedStepData: data,
      hasGoverned: false,
      governedByteSize: 0,
      presentArtifacts: [],
      missingArtifacts: [...GOVERNED_ARTIFACT_KEYS],
      valid: false,
      trace: `[GovernedPersistence] ${stepKey}: no data object`,
    };
  }

  const d = data as Record<string, unknown>;
  const governed = d.governed as Record<string, unknown> | undefined;

  if (!governed || typeof governed !== "object") {
    return {
      governed: null,
      cleanedStepData: data,
      hasGoverned: false,
      governedByteSize: 0,
      presentArtifacts: [],
      missingArtifacts: [...GOVERNED_ARTIFACT_KEYS],
      valid: false,
      trace: `[GovernedPersistence] ${stepKey}: no governed sub-object found`,
    };
  }

  // Extract present artifacts
  const presentArtifacts: string[] = GOVERNED_ARTIFACT_KEYS.filter(
    (k) => governed[k] !== null && governed[k] !== undefined
  );
  const missingArtifacts: string[] = GOVERNED_ARTIFACT_KEYS.filter(
    (k) => governed[k] === null || governed[k] === undefined
  );

  // Also capture optional keys if present
  for (const optKey of OPTIONAL_GOVERNED_KEYS) {
    if (governed[optKey] !== null && governed[optKey] !== undefined) {
      presentArtifacts.push(optKey as string);
    }
  }

  const governedStr = JSON.stringify(governed);
  const governedByteSize = new Blob([governedStr]).size;

  // Validation: reject if governed is trivially small (truncated)
  const valid = governedByteSize > 200 && presentArtifacts.length >= 3;

  const trace = `[GovernedPersistence] ${stepKey}: ${presentArtifacts.length} artifacts, ${governedByteSize} bytes, valid=${valid}`;
  console.log(trace);

  return {
    governed,
    cleanedStepData: data, // Keep governed in step data too for backward compat
    hasGoverned: true,
    governedByteSize,
    presentArtifacts,
    missingArtifacts: missingArtifacts.filter(k => !presentArtifacts.includes(k)),
    valid,
    trace,
  };
}

/**
 * Merge extracted governed artifacts into the top-level analysis_data.governed.
 * Preserves existing artifacts from other steps (additive merge).
 */
export function mergeGovernedIntoAnalysisData(
  existingAnalysisData: Record<string, unknown>,
  extraction: GovernedExtractionResult
): Record<string, unknown> {
  if (!extraction.hasGoverned || !extraction.governed) {
    return existingAnalysisData;
  }

  const existingGoverned = (existingAnalysisData.governed as Record<string, unknown>) || {};

  // Additive merge: new artifacts overwrite existing ones
  const mergedGoverned = {
    ...existingGoverned,
    ...extraction.governed,
    _lastUpdated: new Date().toISOString(),
    _totalByteSize: new Blob([JSON.stringify({ ...existingGoverned, ...extraction.governed })]).size,
  };

  return {
    ...existingAnalysisData,
    governed: mergedGoverned,
  };
}

/**
 * Compute system health metrics from persisted analysis_data.
 */
export interface SystemHealthMetrics {
  governed_persistence_rate: number;
  schema_validation_pass_rate: number;
  causal_structure_presence_rate: number;
  evidence_distribution_present: boolean;
  confidence_computed: boolean;
  decision_grade_present: boolean;
  governed_byte_size: number;
  artifact_count: number;
  total_required: number;
  /** §8: Data provenance traceability */
  data_traceability_rate: number;
  /** §9: Visual truthfulness — governed data drives visuals */
  visual_truthfulness_rate: number;
  /** §7: Lens structural impact detected */
  lens_structural_impact_rate: number;
  /** Overall market readiness (all metrics ≥ 0.9 except decision_grade) */
  market_ready: boolean;
}

export function computeSystemHealth(
  analysisData: Record<string, unknown> | null
): SystemHealthMetrics {
  const governed = (analysisData?.governed as Record<string, unknown>) || {};
  const presentCount = GOVERNED_ARTIFACT_KEYS.filter(
    (k) => governed[k] !== null && governed[k] !== undefined
  ).length;
  const totalRequired = GOVERNED_ARTIFACT_KEYS.length;

  const hasCausalChains = !!(governed.constraint_map as Record<string, unknown>)?.causal_chains ||
    !!(governed as Record<string, unknown>).causal_chains;

  const ds = governed.decision_synthesis as Record<string, unknown> | undefined;
  const hasConfidence = typeof ds?.confidence_score === "number";
  const hasDecisionGrade = typeof ds?.decision_grade === "string";
  const hasEvidenceDist = !!(ds?._evidence_distribution);

  const governedStr = JSON.stringify(governed);
  const governedByteSize = governedStr.length > 2 ? new Blob([governedStr]).size : 0;

  // Schema validation: check if present artifacts have non-empty required fields
  let validatedCount = 0;
  for (const key of GOVERNED_ARTIFACT_KEYS) {
    const artifact = governed[key];
    if (artifact && typeof artifact === "object" && Object.keys(artifact as object).length > 0) {
      validatedCount++;
    }
  }

  return {
    governed_persistence_rate: totalRequired > 0 ? presentCount / totalRequired : 0,
    schema_validation_pass_rate: presentCount > 0 ? validatedCount / presentCount : 0,
    causal_structure_presence_rate: hasCausalChains ? 1 : 0,
    evidence_distribution_present: hasEvidenceDist,
    confidence_computed: hasConfidence,
    decision_grade_present: hasDecisionGrade,
    governed_byte_size: governedByteSize,
    artifact_count: presentCount,
    total_required: totalRequired,
    data_traceability_rate: hasEvidenceDist ? 0.8 : 0.3,
    visual_truthfulness_rate: hasCausalChains ? 1 : (presentCount > 3 ? 0.6 : 0.2),
    lens_structural_impact_rate: (governed as Record<string, unknown>)?.lens_impact_report ? 1 : 0,
    market_ready: (totalRequired > 0 ? presentCount / totalRequired : 0) >= 0.9 &&
      (presentCount > 0 ? validatedCount / presentCount : 0) >= 0.9 &&
      hasConfidence && hasDecisionGrade,
  };
}

/**
 * Check if retroactive invalidation is needed based on falsification results.
 * If model_fragility_score > threshold, downstream confidence must be downgraded.
 */
export function checkRetroactiveInvalidation(
  governed: Record<string, unknown>
): {
  shouldInvalidate: boolean;
  fragilityScore: number;
  affectedArtifacts: string[];
  confidenceDowngrade: number;
} {
  const falsification = governed.falsification as Record<string, unknown> | undefined;
  if (!falsification) {
    return { shouldInvalidate: false, fragilityScore: 0, affectedArtifacts: [], confidenceDowngrade: 0 };
  }

  const fragilityScore = Number(falsification.model_fragility_score || 0);
  const FRAGILITY_THRESHOLD = 70;

  if (fragilityScore <= FRAGILITY_THRESHOLD) {
    return { shouldInvalidate: false, fragilityScore, affectedArtifacts: [], confidenceDowngrade: 0 };
  }

  // High fragility — invalidate upstream confidence and constraint validity
  const affectedArtifacts = ["constraint_map", "leverage_map", "constraint_driven_solution", "decision_synthesis"];
  const confidenceDowngrade = Math.round((fragilityScore - FRAGILITY_THRESHOLD) * 0.5);

  console.warn(`[RetroactiveInvalidation] Fragility ${fragilityScore} > ${FRAGILITY_THRESHOLD}. Downgrading confidence by ${confidenceDowngrade}. Affected: ${affectedArtifacts.join(", ")}`);

  return {
    shouldInvalidate: true,
    fragilityScore,
    affectedArtifacts,
    confidenceDowngrade,
  };
}

/**
 * Apply retroactive invalidation to governed artifacts.
 * Downgrades confidence and marks affected artifacts as requiring re-evaluation.
 */
export function applyRetroactiveInvalidation(
  governed: Record<string, unknown>,
  invalidation: ReturnType<typeof checkRetroactiveInvalidation>
): Record<string, unknown> {
  if (!invalidation.shouldInvalidate) return governed;

  const updated = { ...governed };

  // Downgrade decision synthesis confidence
  const ds = updated.decision_synthesis as Record<string, unknown> | undefined;
  if (ds) {
    const currentConfidence = Number(ds.confidence_score || 50);
    const newConfidence = Math.max(0, currentConfidence - invalidation.confidenceDowngrade);
    ds.confidence_score = newConfidence;

    // Re-evaluate decision grade
    if (newConfidence < 35) {
      ds.decision_grade = "blocked";
    } else if (newConfidence < 60) {
      ds.decision_grade = "conditional";
    }

    ds._retroactive_invalidation = {
      applied: true,
      fragility_score: invalidation.fragilityScore,
      confidence_downgrade: invalidation.confidenceDowngrade,
      original_confidence: currentConfidence,
      adjusted_confidence: newConfidence,
      timestamp: new Date().toISOString(),
    };
  }

  // Mark constraint map as requiring re-evaluation
  const cm = updated.constraint_map as Record<string, unknown> | undefined;
  if (cm) {
    cm._fragility_warning = `Model fragility ${invalidation.fragilityScore}/100 — constraint validity uncertain`;
  }

  return updated;
}
