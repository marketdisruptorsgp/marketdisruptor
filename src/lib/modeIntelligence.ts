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

const PRODUCT_SIGNALS = [
  "product", "design", "feature", "hardware", "software architecture",
  "materials", "manufacturing", "technology", "performance", "component",
  "device", "build", "physical", "form factor", "too complex",
  "too expensive to produce", "technical limitation",
];

const SERVICE_SIGNALS = [
  "process", "workflow", "experience", "onboarding", "delivery",
  "operations", "efficiency", "slow", "manual", "scaling",
  "support", "journey", "handoff", "coordination",
  "takes too long", "bottleneck",
];

const BUSINESS_MODEL_SIGNALS = [
  "pricing", "revenue", "margin", "profit", "cost structure",
  "monetization", "subscription", "who pays", "growth model",
  "unit economics", "lifetime value", "acquisition cost",
  "financial", "economics",
];

// ── Scoring Engine ──

function scoreText(text: string, signals: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const signal of signals) {
    if (lower.includes(signal)) score += 1;
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
Explain three innovation modes in plain language for non-experts.
GOAL: Users should instantly understand what changes when they choose a mode.
PRINCIPLE: Describe real-world change, not analysis method.
DISTINCTIONS:
Product → changes the offering itself
Service → changes how value is delivered
Business Model → changes how value is captured
OUTPUT JSON:
{
  productMode: { name, plainMeaning, whatChanges, whatStaysSame, whenToUse, realWorldOutcome },
  serviceMode: {...},
  businessModelMode: {...}
}
`;
