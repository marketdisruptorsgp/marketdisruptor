/**
 * Shared Lens Prompt Builder
 * 
 * Generates evaluation lens context to inject into AI system/user prompts
 * when a custom lens is active. Returns empty string for default lens.
 */

export interface LensData {
  name: string;
  primary_objective?: string;
  target_outcome?: string;
  risk_tolerance?: string;
  time_horizon?: string;
  available_resources?: string;
  constraints?: string;
  evaluation_priorities?: Record<string, number>;
}

/**
 * Build lens prompt injection string.
 * Returns empty string when no lens is provided (default behavior).
 */
export function buildLensPrompt(lens?: LensData | null): string {
  if (!lens) return "";

  const priorities = lens.evaluation_priorities || {};
  const priorityStr = Object.entries(priorities)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return `

EVALUATION LENS (Custom — "${lens.name}"):
- Primary Objective: ${lens.primary_objective || "Not specified"}
- Target Outcome: ${lens.target_outcome || "Not specified"}
- Risk Tolerance: ${lens.risk_tolerance || "medium"}
- Time Horizon: ${lens.time_horizon || "Not specified"}
- Available Resources: ${lens.available_resources || "Not specified"}
- Constraints: ${lens.constraints || "None specified"}
- Priority Weights: ${priorityStr || "equal weights"}

LENS APPLICATION RULES:
1. Adjust ALL scoring, rankings, and recommendations according to the priority weights above.
2. Interpret risk through the stated risk tolerance — high tolerance means bolder suggestions, low tolerance means conservative feasibility.
3. Frame time-sensitive recommendations within the stated time horizon.
4. Account for resource constraints when evaluating feasibility and implementation paths.
5. Prioritize actionable recommendations aligned with the stated primary objective.
6. When ranking multiple options, weight them according to the evaluation priorities.
`;
}
