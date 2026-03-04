/* =========================================================
   VISUAL ENFORCEMENT HELPERS
   Validation gate + adaptive-engine entry points.
   Prevents generic visuals from rendering.
   ========================================================= */

import type { VisualSpec, ActionPlan } from "./visualContract";
import { resolveAdaptiveVisuals } from "./adaptiveVisualEngine";
import type { VisualStory } from "./visualStoryCompiler";
import type { RankedSignal } from "./signalRanking";

/* ── Validation Result ── */
export interface VisualValidation {
  valid: boolean;
  reason?: string;
  /** If invalid, should fall back to PRIORITIZED_SIGNAL_FIELD */
  fallbackToSignalField: boolean;
}

/**
 * VISUAL MEANING ENFORCEMENT LAYER
 * Validates that a compiled story meets minimum quality thresholds
 * before rendering. Returns validation result with fallback guidance.
 */
export function validateVisualStory(story: VisualStory, signals: RankedSignal[]): VisualValidation {
  // 1. Must have at least 2 ranked signals
  if (signals.length < 2) {
    return { valid: false, reason: "Insufficient signals (<2)", fallbackToSignalField: false };
  }

  // 2. Signals must be semantically distinct (no duplicates by label)
  const uniqueLabels = new Set(signals.slice(0, 8).map(s => s.label.toLowerCase().slice(0, 30)));
  if (uniqueLabels.size < Math.min(signals.length, 3)) {
    return { valid: false, reason: "Signals not semantically distinct", fallbackToSignalField: true };
  }

  // 3. For non-fallback story types, relationships must exist
  if (
    story.type !== "PRIORITIZED_SIGNAL_FIELD" &&
    story.type !== "CLUSTERED_INTELLIGENCE" &&
    story.relationships.length === 0
  ) {
    return { valid: false, reason: "No relationships for structural story", fallbackToSignalField: true };
  }

  // 4. Story must have a verdict
  if (!story.verdict || !story.verdict.summary) {
    return { valid: false, reason: "Missing verdict synthesis", fallbackToSignalField: true };
  }

  // 5. Top signals must exist (3-8 range)
  if (story.topSignals.length < 2) {
    return { valid: false, reason: "Too few top signals for rendering", fallbackToSignalField: true };
  }

  return { valid: true, fallbackToSignalField: false };
}

/**
 * Normalize signal labels to max 6 words for visual rendering.
 * Returns a display-safe label.
 */
export function normalizeSignalLabel(label: string, maxWords = 6): string {
  let clean = label.trim();
  // Strip JSON fragments, code identifiers, and technical prefixes
  clean = clean.replace(/[{}\[\]"]/g, ""); // remove JSON brackets/quotes
  clean = clean.replace(/^(F\d+_|inputs?:|outputs?:)/i, ""); // strip function IDs
  clean = clean.replace(/\b[A-Z][a-z]+[A-Z]\w+/g, (m) => m.replace(/([a-z])([A-Z])/g, "$1 $2")); // camelCase → words
  clean = clean.replace(/[_]+/g, " "); // underscores to spaces
  clean = clean.replace(/\s{2,}/g, " ").trim();
  if (!clean || clean.length < 3) return label.trim().slice(0, 30);
  const words = clean.split(/\s+/);
  if (words.length <= maxWords) return clean;
  return words.slice(0, maxWords).join(" ") + "…";
}

/* ── Adaptive Engine Entry Points (unchanged API) ── */

/** Extract all visual specs (canonical + ontology + surface) via adaptive engine */
export function getEnforcedVisualSpecs(data: Record<string, unknown> | null | undefined): VisualSpec[] {
  if (!data) return [];
  const result = resolveAdaptiveVisuals(data);
  const specs: VisualSpec[] = [];
  if (result.canonicalSpec) specs.push(result.canonicalSpec);
  specs.push(...result.ontologySpecs);
  specs.push(...result.surfaceSpecs);
  return specs;
}

/** Extract enforced actionPlans via adaptive engine */
export function getEnforcedActionPlans(data: Record<string, unknown> | null | undefined): ActionPlan[] {
  if (!data) return [];
  const result = resolveAdaptiveVisuals(data);
  return result.actionPlans;
}

/** Extract ontology-specific visual specs via adaptive engine */
export function getEnforcedOntologySpecs(data: Record<string, unknown> | null | undefined): VisualSpec[] {
  if (!data) return [];
  const result = resolveAdaptiveVisuals(data);
  return [...result.ontologySpecs, ...result.surfaceSpecs];
}
