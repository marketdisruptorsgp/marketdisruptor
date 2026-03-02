/* =========================================================
   VISUAL ENFORCEMENT HELPERS
   Entry points for consumers to get adaptive-engine-resolved
   visual specs and action plans. Avoids circular dependency
   by living outside visualContract.ts.
   ========================================================= */

import type { VisualSpec, ActionPlan } from "./visualContract";
import { resolveAdaptiveVisuals } from "./adaptiveVisualEngine";

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
