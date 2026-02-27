/**
 * Step completion detection and resume logic.
 * Single source of truth for determining analysis progress.
 */

export interface StepStatus {
  key: string;
  label: string;
  route: string;
  completed: boolean;
}

const STEP_DEFINITIONS = [
  { key: "intelData",      label: "Intelligence Report", route: "report",      order: 1, uiStep: 2 },
  { key: "disrupt",        label: "Disrupt",             route: "disrupt",     order: 2, uiStep: 3 },
  { key: "redesign",       label: "Redesign",            route: "redesign",    order: 3, uiStep: 4 },
  { key: "stressTest",     label: "Stress Test",         route: "stress-test", order: 4, uiStep: 5 },
  { key: "pitchDeck",      label: "Pitch Deck",          route: "pitch",       order: 5, uiStep: 6 },
] as const;

/**
 * Returns an ordered list of steps with completion status.
 */
export function getCompletedSteps(
  analysisData: Record<string, unknown> | null | undefined
): StepStatus[] {
  return STEP_DEFINITIONS.map((def) => ({
    key: def.key,
    label: def.label,
    route: def.route,
    completed: !!analysisData?.[def.key],
  }));
}

/**
 * Determines the route for the next incomplete step.
 * If all steps are done, returns the last step (pitch).
 * Products always start at "report" since intel is derived from products.
 */
export function getResumeRoute(
  analysisData: Record<string, unknown> | null | undefined,
  hasProducts: boolean
): { route: string; label: string } {
  if (!hasProducts) {
    return { route: "report", label: "Intelligence Report" };
  }

  const steps = getCompletedSteps(analysisData);

  // Find the highest completed step, then return the next one
  let lastCompletedIdx = -1;
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].completed) {
      lastCompletedIdx = i;
      break;
    }
  }

  // If nothing completed, start at report
  if (lastCompletedIdx === -1) {
    return { route: "report", label: "Intelligence Report" };
  }

  // If last completed is the final step, resume there
  if (lastCompletedIdx >= steps.length - 1) {
    const last = steps[steps.length - 1];
    return { route: last.route, label: last.label };
  }

  // Otherwise go to next step
  const next = steps[lastCompletedIdx + 1];
  return { route: next.route, label: next.label };
}

/**
 * Check if a specific step has persisted data.
 */
export function hasStepData(
  analysisData: Record<string, unknown> | null | undefined,
  stepKey: string
): boolean {
  return !!analysisData?.[stepKey];
}
