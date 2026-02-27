/**
 * Shared Lens Prompt Builder
 * 
 * Generates evaluation lens context to inject into AI system/user prompts
 * when a custom or ETA lens is active. Returns empty string for default lens.
 */

export interface LensData {
  name: string;
  lensType?: "default" | "eta" | "custom";
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
export function buildLensPrompt(lens?: LensData | null, mode?: string): string {
  if (!lens) return "";

  const lensType = lens.lensType || (lens.name === "ETA Acquisition Lens" ? "eta" : "custom");

  if (lensType === "eta") {
    return buildEtaPrompt(lens, mode);
  }

  return buildCustomPrompt(lens);
}

function buildCustomPrompt(lens: LensData): string {
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

function buildEtaPrompt(lens: LensData, mode?: string): string {
  const modeContext = getModeContext(mode);

  return `

EVALUATION LENS (ETA Acquisition — "${lens.name}"):
You are evaluating this from the perspective of an owner-operator considering acquisition.

ETA EVALUATION PRIORITIES (apply these weights to ALL scoring and ranking):
- Value Durability (0.15): How resilient is the core value proposition over time?
- Operational Leverage (0.12): What operational improvements can a new owner implement?
- Defensibility (0.12): How protected is this from competitive disruption?
- Improvement Pathways (0.12): What realistic improvements can drive value creation?
- Implementation Complexity (0.10): How difficult are changes for a new owner to execute?
- Downside Risk (0.10): What are the realistic worst-case scenarios?
- Scalability (0.10): What are the constraints and opportunities for growth?
- Cost Flexibility (0.10): How adaptable is the cost structure?
- Ownership Risk (0.09): What risks are specific to ownership transition?

${modeContext}

OUTPUT FRAMING RULES:
1. Replace innovation-focused language with ownership-oriented framing:
   - Instead of "disruption opportunity" → "ownership viability"
   - Instead of "innovation potential" → "improvement pathway"
   - Instead of "market opportunity" → "value creation timeline"
   - Instead of "competitive advantage" → "defensibility strength"
   - Instead of "growth potential" → "scalability under ownership"
2. Frame all recommendations as actions a new owner could take within ${lens.time_horizon || "3 years"}.
3. Distinguish between quick wins (0-6 months), medium-term plays (6-18 months), and structural changes (18+ months).

NON-AI BIAS RULE:
Do NOT default to AI or technology solutions. When recommending improvements, prioritize in this order:
1. Process improvement (operational efficiency, workflow optimization)
2. Pricing or positioning change (market repositioning, tier restructuring)
3. Structural model change (revenue model, delivery model, channel strategy)
4. Operational optimization (supply chain, staffing, automation of manual processes)
5. Technology enablement (ONLY when directly justified by the problem domain)
AI should only appear when it is the most practical solution, not the default recommendation.

VALIDATION RULES:
- If a priority CANNOT be evaluated using the available data, explicitly label it as: "Not directly measurable with current data — requires due diligence"
- Do NOT fabricate ownership conclusions or financial projections without supporting signals
- If a claim cannot be supported by pipeline data, label it as a hypothesis or omit it
- The lens changes interpretation and framing, NOT the underlying factual analysis
- Every ownership-related conclusion must cite which pipeline signal supports it

PIPELINE ALIGNMENT:
For each ETA priority, internally assess:
A) Which analysis step evaluates it (intelligence, disrupt, stress-test)
B) What signals are available (market data, competitive analysis, operational review)
C) Whether evaluation is DIRECT (signal exists), PARTIAL (inferred), or NOT SUPPORTED
If NOT SUPPORTED: do not infer — mark as a limitation requiring additional due diligence.
`;
}

function getModeContext(mode?: string): string {
  switch (mode) {
    case "custom":
    case "product":
      return `MODE-SPECIFIC INTERPRETATION (Product):
Evaluate ownership value through: product improvement opportunities, cost structure optimization, 
differentiation potential, supply chain leverage, and brand/IP defensibility.
Focus on: unit economics, manufacturing alternatives, quality improvements, and distribution channel ownership.`;

    case "service":
      return `MODE-SPECIFIC INTERPRETATION (Service):
Evaluate ownership value through: operational efficiency gains, delivery model scalability, 
client retention mechanics, and service differentiation.
Focus on: labor leverage, process standardization, recurring revenue conversion, and client concentration risk.`;

    case "business":
      return `MODE-SPECIFIC INTERPRETATION (Business Model):
Evaluate ownership value through: structural economics, revenue durability, 
scalability mechanics, and margin expansion opportunities.
Focus on: revenue model resilience, customer acquisition cost efficiency, switching costs, and competitive moat depth.`;

    default:
      return `MODE-SPECIFIC INTERPRETATION:
Evaluate ownership value through all applicable dimensions: product/service quality, operational efficiency, 
market position, and structural economics. Apply the most relevant framing based on the subject matter.`;
  }
}
