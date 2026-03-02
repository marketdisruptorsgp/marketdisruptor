/**
 * EDGE FUNCTION: Structural Lens Weighting
 * 
 * Server-side lens weighting for edge functions.
 * Mirrors src/lib/lensWeighting.ts logic for server-side use.
 */

export interface LensWeights {
  constraint_priority_weights: Record<string, number>;
  evidence_threshold: number;
  acceptable_risk: "low" | "medium" | "high";
  time_horizon_months: number;
  decision_penalty_rules: string[];
}

export interface LensConfig {
  name: string;
  lensType?: "default" | "eta" | "custom";
  evaluation_priorities?: Record<string, number>;
  risk_tolerance?: string;
  time_horizon?: string;
  constraints?: string;
}

const DEFAULT_WEIGHTS: LensWeights = {
  constraint_priority_weights: {
    cost: 1.0, time: 1.0, adoption: 1.0, scale: 1.0, reliability: 1.0, risk: 1.0,
  },
  evidence_threshold: 0.3,
  acceptable_risk: "medium",
  time_horizon_months: 18,
  decision_penalty_rules: [],
};

const ETA_WEIGHTS: LensWeights = {
  constraint_priority_weights: {
    cost: 1.3, time: 0.8, adoption: 0.9, scale: 1.2, reliability: 1.4, risk: 1.3,
  },
  evidence_threshold: 0.5,
  acceptable_risk: "medium",
  time_horizon_months: 36,
  decision_penalty_rules: [
    "Penalize solutions requiring >$500K upfront capital",
    "Favor operational improvements over technology-first solutions",
  ],
};

export function computeLensWeights(lens: LensConfig | null | undefined): LensWeights {
  if (!lens) return { ...DEFAULT_WEIGHTS };
  const lensType = lens.lensType || (lens.name === "ETA Acquisition Lens" ? "eta" : "custom");
  if (lensType === "eta") return { ...ETA_WEIGHTS };
  if (lensType === "custom" && lens.evaluation_priorities) {
    return buildCustomWeights(lens);
  }
  return { ...DEFAULT_WEIGHTS };
}

function buildCustomWeights(lens: LensConfig): LensWeights {
  const p = lens.evaluation_priorities || {};
  const riskTolerance = (lens.risk_tolerance || "medium") as "low" | "medium" | "high";
  const cw: Record<string, number> = { cost: 1, time: 1, adoption: 1, scale: 1, reliability: 1, risk: 1 };
  if (p.feasibility) { cw.cost = 1 + (p.feasibility - 0.25) * 2; cw.time = 1 + (p.feasibility - 0.25) * 1.5; }
  if (p.desirability) cw.adoption = 1 + (p.desirability - 0.25) * 2;
  if (p.profitability) cw.scale = 1 + (p.profitability - 0.25) * 2;
  if (p.downside_risk) cw.risk = 1 + (p.downside_risk - 0.1) * 3;
  if (p.value_durability) cw.reliability = 1 + (p.value_durability - 0.15) * 3;
  let thMonths = 18;
  if (lens.time_horizon) {
    const m = lens.time_horizon.match(/(\d+)/);
    if (m) { const n = parseInt(m[1]); thMonths = lens.time_horizon.includes("year") ? n * 12 : n; }
  }
  const et = riskTolerance === "low" ? 0.6 : riskTolerance === "high" ? 0.2 : 0.4;
  const penalties: string[] = [];
  if (lens.constraints) penalties.push(`Constraint: ${lens.constraints}`);
  if (riskTolerance === "low") penalties.push("Penalize speculative-only evidence chains");
  return { constraint_priority_weights: cw, evidence_threshold: et, acceptable_risk: riskTolerance, time_horizon_months: thMonths, decision_penalty_rules: penalties };
}

/**
 * Build a lens impact prompt section for injection into AI prompts.
 * This tells the AI how lens weights should affect structural outputs.
 */
export function buildLensWeightingPrompt(lens: LensConfig | null | undefined): string {
  if (!lens) return "";
  const weights = computeLensWeights(lens);
  const dims = Object.entries(weights.constraint_priority_weights)
    .filter(([, v]) => Math.abs(v - 1.0) > 0.01)
    .map(([k, v]) => `${k}: ${v > 1 ? "↑" : "↓"} ${v.toFixed(1)}x`)
    .join(", ");
  if (!dims) return "";
  return `

STRUCTURAL LENS WEIGHTING (${lens.name}):
Constraint dimension weights: ${dims}
Evidence threshold: ${weights.evidence_threshold} (ratio of verified evidence required)
Risk tolerance: ${weights.acceptable_risk}
Time horizon: ${weights.time_horizon_months} months
${weights.decision_penalty_rules.length > 0 ? `Decision penalties:\n${weights.decision_penalty_rules.map(r => `  - ${r}`).join("\n")}` : ""}

LENS IMPACT ON GOVERNED OUTPUT:
- Rank binding constraints using the dimension weights above
- Adjust confidence thresholds: confidence > 80 requires verified evidence ratio ≥ ${weights.evidence_threshold}
- Include lens_impact_report in governed output showing which constraint rankings shifted
`;
}
