import type { UserLens } from "@/components/LensToggle";

export type LensType = "default" | "eta" | "custom";

export interface TypedUserLens extends Omit<UserLens, "id"> {
  id?: string;
  lensType: LensType;
}

/**
 * Operator context fields — configurable per-user for the ETA lens.
 * Stored in localStorage and injected into the AI deepening prompt.
 */
export interface OperatorContext {
  /** Available capital (e.g., "$250,000 cash") */
  availableCapital: string;
  /** Time horizon (e.g., "3 years") */
  timeHorizon: string;
  /** Core skills/strengths (e.g., "Tech-savvy, sales/marketing, analytical") */
  coreSkills: string;
  /** Strategic preference (e.g., "Partnerships/ecosystem for leverage") */
  strategyPreference: string;
  /** Additional financing capacity */
  financingCapacity: string;
}

const OPERATOR_CONTEXT_KEY = "eta-operator-context";

export function getOperatorContext(): OperatorContext {
  try {
    const stored = localStorage.getItem(OPERATOR_CONTEXT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    availableCapital: "",
    timeHorizon: "3 years",
    coreSkills: "",
    strategyPreference: "",
    financingCapacity: "",
  };
}

export function saveOperatorContext(ctx: OperatorContext): void {
  localStorage.setItem(OPERATOR_CONTEXT_KEY, JSON.stringify(ctx));
}

/**
 * Build the available_resources string from operator context for lens injection.
 */
export function buildOperatorResourceString(ctx: OperatorContext): string {
  const parts: string[] = [];
  if (ctx.availableCapital) parts.push(`Capital: ${ctx.availableCapital}`);
  if (ctx.financingCapacity) parts.push(`Financing: ${ctx.financingCapacity}`);
  if (ctx.coreSkills) parts.push(`Skills: ${ctx.coreSkills}`);
  if (ctx.strategyPreference) parts.push(`Strategy: ${ctx.strategyPreference}`);
  if (parts.length === 0) return "Owner-operator with acquisition capital";
  return parts.join(". ");
}

/**
 * ETA (Entrepreneurship Through Acquisition) Lens
 * Prebuilt lens that evaluates opportunities from an ownership and value-creation perspective.
 * Call getEtaLens() to get a copy with current operator context merged in.
 */
export const ETA_LENS: TypedUserLens = {
  id: "__eta__",
  name: "ETA Acquisition Lens",
  lensType: "eta",
  primary_objective: "Evaluate from ownership and value-creation perspective",
  target_outcome: "Assess acquisition viability, improvement pathways, and realistic value creation timeline",
  risk_tolerance: "medium",
  time_horizon: "3 years",
  available_resources: "Owner-operator with acquisition capital",
  constraints:
    "Do not default to AI/technology solutions. Prioritize: 1) process improvement, 2) pricing/positioning change, 3) structural model change, 4) operational optimization, 5) technology enablement only if justified.",
  evaluation_priorities: {
    value_durability: 0.15,
    operational_leverage: 0.12,
    defensibility: 0.12,
    improvement_pathways: 0.12,
    implementation_complexity: 0.1,
    downside_risk: 0.1,
    scalability: 0.1,
    cost_flexibility: 0.1,
    ownership_risk: 0.09,
  },
  is_default: false,
};

/**
 * Returns an ETA lens with operator context merged into available_resources and time_horizon.
 */
export function getEtaLensWithContext(): TypedUserLens {
  const ctx = getOperatorContext();
  return {
    ...ETA_LENS,
    available_resources: buildOperatorResourceString(ctx),
    time_horizon: ctx.timeHorizon || ETA_LENS.time_horizon,
  };
}

/** Helper to determine lens type from a UserLens object */
export function getLensType(lens: UserLens | TypedUserLens | null): LensType {
  if (!lens) return "default";
  if ("lensType" in lens) return lens.lensType;
  if (lens.id === "__eta__") return "eta";
  return "custom";
}
