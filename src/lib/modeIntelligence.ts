/**
 * Mode Intelligence Engine — Auto-classifies problem descriptions
 * into product / service / business_model via signal-based text scoring.
 *
 * Runs purely client-side. Zero latency, no API calls.
 */

// ── Types ──

export type InnovationMode = "product" | "service" | "business_model";

/** Frontend mode key used across the app */
export type FrontendMode = "custom" | "service" | "business";

export interface ModeScore {
  product: number;
  service: number;
  business_model: number;
}

export interface RoutingResult {
  primaryMode: InnovationMode;
  secondaryModes: InnovationMode[];
  scores: ModeScore;
  confidence: number;
  reasoning: string;
}

export interface AnalysisPlan {
  primaryMode: InnovationMode;
  supportingModes: InnovationMode[];
  executionOrder: InnovationMode[];
}

export interface UserFacingRouting {
  focus: InnovationMode;
  alsoConsidered: InnovationMode[];
  confidence: number;
  explanation: string;
}

// ── Signal Dictionaries ──

const PRODUCT_SIGNALS: [string, number][] = [
  ["product", 1], ["design", 1], ["feature", 1], ["hardware", 2], ["software architecture", 2],
  ["materials", 1], ["manufacturing", 2], ["technology", 1], ["performance", 1], ["component", 1],
  ["device", 2], ["build", 1], ["physical", 1], ["form factor", 2], ["too complex", 1],
  ["too expensive to produce", 2], ["technical limitation", 2], ["packaging", 1],
  ["formulation", 2], ["recipe", 2], ["ingredient", 1], ["quality", 1], ["durability", 1],
  ["usability", 1], ["app", 1], ["platform", 1], ["tool", 1], ["drink", 2], ["food", 2], ["beverage", 2],
  ["selling", 1], ["sell", 1], ["our product", 2], ["we make", 2], ["we produce", 2], ["we sell", 2],
  ["white label", 1], ["private label", 2], ["brand", 1], ["sku", 2], ["catalog", 1],
  ["item", 1], ["merchandise", 2], ["goods", 1], ["inventory", 1],
];

const SERVICE_SIGNALS: [string, number][] = [
  ["process", 1], ["workflow", 2], ["experience", 1], ["onboarding", 2], ["delivery", 1],
  ["operations", 2], ["efficiency", 1], ["slow", 1], ["manual", 1], ["scaling", 1],
  ["support", 1], ["journey", 1], ["handoff", 2], ["coordination", 1],
  ["takes too long", 2], ["bottleneck", 2], ["customer service", 2], ["logistics", 1],
  ["fulfillment", 2], ["shipping", 1], ["distribution", 1], ["distributor", 1],
  ["distributing", 1], ["supply chain", 1], ["warehouse", 1],
  ["repair", 2], ["mechanic", 2], ["appointment", 2], ["scheduling", 2],
  ["wait time", 2], ["convenience", 1], ["staffing", 2], ["employee", 1],
  ["customer experience", 2], ["service quality", 2], ["turnaround", 2],
  ["mobile service", 2], ["on-site", 2], ["pickup", 1], ["drop-off", 1],
];

const BUSINESS_MODEL_SIGNALS: [string, number][] = [
  ["pricing", 2], ["revenue", 2], ["margin", 2], ["profit", 2], ["cost structure", 2],
  ["monetization", 2], ["subscription", 2], ["who pays", 2], ["growth model", 2],
  ["unit economics", 2], ["lifetime value", 2], ["acquisition cost", 2],
  ["financial", 1], ["economics", 1], ["competition", 2], ["competitor", 2], ["saturated", 2],
  ["market", 1], ["expand", 2], ["expansion", 2], ["new market", 2], ["grow", 1], ["growth", 1],
  ["white label", 2], ["franchise", 2], ["scale", 1], ["profitability", 2], ["profitable", 2],
  ["cash flow", 2], ["investment", 2], ["funding", 2], ["roi", 2], ["break even", 2],
  ["business model", 3], ["distribution", 1], ["distributor", 1], ["wholesale", 2],
  ["retail", 1], ["b2b", 2], ["b2c", 2], ["saas", 1], ["recurring revenue", 2],
  ["market share", 2], ["differentiation", 2], ["competitive advantage", 2],
  ["florida", 1], ["missouri", 1], ["state", 1], ["region", 1], ["territory", 1],
  ["beat", 1], ["stand out", 2], ["how to compete", 3], ["too many competitors", 3],
  ["market entry", 2], ["go-to-market", 2], ["channel", 1], ["partnership", 1],
];

// ── Scoring Engine ──

function scoreText(text: string, signals: [string, number][]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const [signal, weight] of signals) {
    if (lower.includes(signal)) score += weight;
  }
  return score;
}

function normalizeScores(scores: ModeScore): ModeScore {
  const total = scores.product + scores.service + scores.business_model || 1;
  return {
    product: scores.product / total,
    service: scores.service / total,
    business_model: scores.business_model / total,
  };
}

// ── Routing Engine ──

export function routeInnovationMode(problem: string): RoutingResult {
  const rawScores: ModeScore = {
    product: scoreText(problem, PRODUCT_SIGNALS),
    service: scoreText(problem, SERVICE_SIGNALS),
    business_model: scoreText(problem, BUSINESS_MODEL_SIGNALS),
  };

  const scores = normalizeScores(rawScores);
  const sorted = (Object.entries(scores) as [InnovationMode, number][])
    .sort((a, b) => b[1] - a[1]);

  const primaryMode = sorted[0][0];
  const primaryScore = sorted[0][1];

  const secondaryModes = sorted
    .slice(1)
    .filter(([, score]) => score > 0.25)
    .map(([mode]) => mode);

  return {
    primaryMode,
    secondaryModes,
    scores,
    confidence: primaryScore,
    reasoning: generateReasoning(primaryMode, secondaryModes),
  };
}

// ── Multi-Mode Orchestration ──

export function createAnalysisPlan(problem: string): AnalysisPlan {
  const routing = routeInnovationMode(problem);
  return {
    primaryMode: routing.primaryMode,
    supportingModes: routing.secondaryModes,
    executionOrder: [routing.primaryMode, ...routing.secondaryModes],
  };
}

// ── Explanation ──

function generateReasoning(primary: InnovationMode, secondary: InnovationMode[]): string {
  if (secondary.length === 0) {
    return `Primary constraint detected in **${formatMode(primary)}**.`;
  }
  return `Primary constraint detected in **${formatMode(primary)}** with contributing factors in ${secondary.map(m => `**${formatMode(m)}**`).join(" and ")}.`;
}

export function explainRouting(result: RoutingResult): UserFacingRouting {
  return {
    focus: result.primaryMode,
    alsoConsidered: result.secondaryModes,
    confidence: Math.round(result.confidence * 100),
    explanation: result.reasoning,
  };
}

function formatMode(mode: InnovationMode): string {
  if (mode === "business_model") return "business model";
  return mode;
}

// ── Mode Mapping (engine ↔ frontend) ──

const ENGINE_TO_FRONTEND: Record<InnovationMode, FrontendMode> = {
  product: "custom",
  service: "service",
  business_model: "business",
};

/** Map frontend card id ("product"|"service"|"business") to engine mode */
const CARD_TO_ENGINE: Record<string, InnovationMode> = {
  product: "product",
  service: "service",
  business: "business_model",
};

export function toFrontendMode(engine: InnovationMode): FrontendMode {
  return ENGINE_TO_FRONTEND[engine];
}

export function toEngineMode(cardId: string): InnovationMode {
  return CARD_TO_ENGINE[cardId] ?? "product";
}

/** Convert engine mode to the card id used in NewAnalysisPage */
export function toCardId(engine: InnovationMode): string {
  if (engine === "business_model") return "business";
  return engine; // product → product, service → service
}

// ── Multi-Mode Expansion ──

/**
 * Expand any mode string (including "multi" / "all") into an ordered array
 * of engine-layer InnovationMode values.
 *
 * - Single modes → single-element array (backwards compatible)
 * - "multi" / "all" / unrecognised → all three modes in plan order when
 *   problemText is provided, otherwise the full set as a fallback
 */
export function expandMultiMode(
  mode: string | null | undefined,
  problemText?: string,
): InnovationMode[] {
  switch (mode) {
    case "product":
    case "custom":
      return ["product"];
    case "service":
      return ["service"];
    case "business":
    case "business_model":
      return ["business_model"];
    default: {
      // "multi", "all", or any unrecognised string → multi-mode
      if (problemText) {
        const plan = createAnalysisPlan(problemText);
        return plan.executionOrder;
      }
      return ["product", "service", "business_model"];
    }
  }
}

// ── Master Entry Point ──

export function analyzeProblem(problem: string) {
  const routing = routeInnovationMode(problem);
  const plan = createAnalysisPlan(problem);
  const userExplanation = explainRouting(routing);
  return { routing, plan, userExplanation };
}

// ── LLM Prompts (reserved for future backend integration) ──

export const MODE_CLASSIFICATION_PROMPT = `
Classify the user's problem by where the main constraint exists.
Return JSON:
{
  primaryMode: "product" | "service" | "business_model",
  secondaryModes: string[],
  reasoning: string
}
Definitions:
Product → issue with the thing itself
Service → issue with delivery or process
Business Model → issue with revenue or cost logic

User problem:
{{problem}}
`;

export const MODE_EXPLANATION_PROMPT = `
ROLE
You are helping explain three innovation modes to non-expert users.

GOAL
Make each mode instantly understandable in under 3 seconds.
Users should know what changes in the real world when they pick a mode.

CORE PRINCIPLE
Describe each mode by:
• what changes
• what does NOT change
• when someone would choose it
Do NOT describe analysis methods or internal system behavior.

CLARITY REQUIREMENTS
• Use everyday language
• Use short, concrete sentences
• Avoid jargon, frameworks, or strategy terminology
• Avoid buzzwords and abstractions
• If a high-school student wouldn't understand immediately, simplify
• Each mode must feel clearly different from the others
• Explanations must not overlap conceptually

CONCEPTUAL DISTINCTION TO PRESERVE
Each mode operates at a different layer of a business:
Product Mode → changes the offering itself
Service Mode → changes how value is delivered
Business Model Mode → changes how value is captured
These layers must remain clearly separated.

USER MENTAL MODEL TARGET
After reading, a user should intuitively understand:
• one mode redesigns the thing
• one mode redesigns the experience/process
• one mode redesigns the economics

STRUCTURE TO PRODUCE FOR EACH MODE
Return an object with:
{
  name: string,
  plainMeaning: string,        // one short sentence
  whatChanges: string[],       // 2–4 concrete items
  whatStaysSame: string[],     // 2–4 concrete items
  whenToUse: string,           // one simple scenario
  realWorldOutcome: string     // tangible result a user would recognize
}

TONE
Clear, neutral, human, direct.
No hype. No metaphors. No teaching voice.

VALIDATION CHECK BEFORE OUTPUT
A user should be able to answer:
"What exactly is changing?"
in one thought after reading.

OUTPUT FORMAT
Return structured JSON with three objects:
productMode
serviceMode
businessModelMode
`;
