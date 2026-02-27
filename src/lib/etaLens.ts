import type { UserLens } from "@/components/LensToggle";

export type LensType = "default" | "eta" | "custom";

export interface TypedUserLens extends Omit<UserLens, "id"> {
  id?: string;
  lensType: LensType;
}

/**
 * ETA (Entrepreneurship Through Acquisition) Lens
 * Prebuilt lens that evaluates opportunities from an ownership and value-creation perspective.
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

/** Helper to determine lens type from a UserLens object */
export function getLensType(lens: UserLens | TypedUserLens | null): LensType {
  if (!lens) return "default";
  if ("lensType" in lens) return lens.lensType;
  if (lens.id === "__eta__") return "eta";
  return "custom";
}
