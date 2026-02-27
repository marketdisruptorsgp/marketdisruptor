/**
 * Legacy Schema Detection
 *
 * Detects old analysis data formats and returns which steps need regeneration
 * to use the updated friction framework.
 */

interface LegacyDetectionResult {
  isLegacy: boolean;
  legacySteps: string[];
}

/**
 * Scans analysis_data JSON blob for legacy schema markers.
 * Returns affected step keys that should be flagged as outdated.
 */
export function detectLegacySchema(
  analysisData: Record<string, unknown> | null | undefined
): LegacyDetectionResult {
  if (!analysisData) return { isLegacy: false, legacySteps: [] };

  const legacySteps: string[] = [];

  // Check intelData for legacy physical-biased fields
  const intel = analysisData.intelData as Record<string, unknown> | undefined;
  if (intel) {
    // Legacy: physicalDimensions without frictionDimensions
    const hasLegacyPhysical = hasNestedField(intel, "physicalDimensions") && !hasNestedField(intel, "frictionDimensions");
    // Legacy: redditSentiment without communitySentiment
    const hasLegacyReddit = hasNestedField(intel, "redditSentiment") && !hasNestedField(intel, "communitySentiment");
    // Legacy: ebayAvgSold without resaleAvgSold
    const hasLegacyEbay = hasNestedField(intel, "ebayAvgSold") && !hasNestedField(intel, "resaleAvgSold");

    if (hasLegacyPhysical || hasLegacyReddit || hasLegacyEbay) {
      legacySteps.push("intelData");
    }
  }

  // Check products array for legacy physicalDimensions in individual product data
  // Products are stored at the row level, but their analysis may reference old fields

  // Check disrupt step for legacy schema (assumptions referencing only physical friction)
  const disrupt = analysisData.disrupt as Record<string, unknown> | undefined;
  if (disrupt) {
    const hasLegacyPhysical = hasNestedField(disrupt, "physicalDimensions") && !hasNestedField(disrupt, "frictionDimensions");
    if (hasLegacyPhysical) {
      legacySteps.push("disrupt");
    }
  }

  // If intel is legacy, downstream steps should also be flagged
  if (legacySteps.includes("intelData")) {
    // Flag downstream steps that depend on intel data
    if (analysisData.disrupt && !legacySteps.includes("disrupt")) {
      legacySteps.push("disrupt");
    }
    if (analysisData.redesign) {
      legacySteps.push("redesign");
    }
    if (analysisData.stressTest) {
      legacySteps.push("stressTest");
    }
    if (analysisData.pitchDeck) {
      legacySteps.push("pitchDeck");
    }
  }

  return {
    isLegacy: legacySteps.length > 0,
    legacySteps,
  };
}

/**
 * Recursively checks if a field name exists anywhere in a nested object.
 */
function hasNestedField(obj: unknown, fieldName: string): boolean {
  if (!obj || typeof obj !== "object") return false;
  if (fieldName in (obj as Record<string, unknown>)) return true;

  for (const value of Object.values(obj as Record<string, unknown>)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (hasNestedField(value, fieldName)) return true;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (hasNestedField(item, fieldName)) return true;
      }
    }
  }
  return false;
}
