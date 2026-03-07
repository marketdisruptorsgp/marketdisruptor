/**
 * STRATEGIC SCENARIO SIMULATION ENGINE
 *
 * Users define "what if" scenarios (pricing change, distribution shift,
 * productization). The engine adjusts evidence weights and projects
 * how key strategic metrics shift.
 *
 * All projections are deterministic — no AI inference.
 */

import type { Evidence, EvidenceMode } from "@/lib/evidenceEngine";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { TransformationPlaybook } from "@/lib/playbookEngine";

/* ── Scenario Types ── */

export type ScenarioType =
  | "pricing_change"
  | "distribution_change"
  | "productization"
  | "cost_restructure"
  | "market_expansion"
  | "custom";

export interface ScenarioDefinition {
  id: string;
  type: ScenarioType;
  label: string;
  description: string;
  /** The user's hypothesis text */
  hypothesis: string;
  /** Numeric magnitude where applicable (-100 to +300) */
  magnitude: number;
  /** Evidence categories this scenario affects */
  affectedCategories: string[];
}

export interface ScenarioProjection {
  scenarioId: string;
  scenarioLabel: string;
  metrics: ProjectedMetric[];
  confidence: "high" | "moderate" | "low";
  confidenceRationale: string;
  strategicImplication: string;
  risks: string[];
}

export interface ProjectedMetric {
  label: string;
  direction: "up" | "down" | "neutral";
  magnitude: string;       // e.g. "+35%", "-40%", "2–4×"
  description: string;
}

/* ── Preset Scenario Templates ── */

export interface ScenarioTemplate {
  type: ScenarioType;
  label: string;
  icon: string;
  description: string;
  defaultMagnitude: number;
  magnitudeLabel: string;
  magnitudeUnit: string;
  affectedCategories: string[];
}

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    type: "pricing_change",
    label: "Pricing Change",
    icon: "💰",
    description: "What if you changed your pricing strategy?",
    defaultMagnitude: 30,
    magnitudeLabel: "Price adjustment",
    magnitudeUnit: "%",
    affectedCategories: ["pricing_model", "demand_signal", "competitive_pressure"],
  },
  {
    type: "distribution_change",
    label: "Distribution Shift",
    icon: "🌐",
    description: "What if you added or changed distribution channels?",
    defaultMagnitude: 50,
    magnitudeLabel: "Channel expansion",
    magnitudeUnit: "%",
    affectedCategories: ["distribution_channel", "customer_behavior", "demand_signal"],
  },
  {
    type: "productization",
    label: "Productize the Offering",
    icon: "📦",
    description: "What if custom services became repeatable products?",
    defaultMagnitude: 60,
    magnitudeLabel: "Standardization level",
    magnitudeUnit: "%",
    affectedCategories: ["operational_dependency", "cost_structure", "demand_signal"],
  },
  {
    type: "cost_restructure",
    label: "Cost Restructuring",
    icon: "✂️",
    description: "What if you fundamentally changed the cost model?",
    defaultMagnitude: 25,
    magnitudeLabel: "Cost reduction target",
    magnitudeUnit: "%",
    affectedCategories: ["cost_structure", "operational_dependency"],
  },
  {
    type: "market_expansion",
    label: "Market Expansion",
    icon: "🚀",
    description: "What if you entered an adjacent market or segment?",
    defaultMagnitude: 40,
    magnitudeLabel: "Market size increase",
    magnitudeUnit: "%",
    affectedCategories: ["demand_signal", "competitive_pressure", "customer_behavior"],
  },
];

/* ── Projection Logic ── */

function evidenceStrength(evidence: Evidence[], categories: string[]): number {
  const relevant = evidence.filter(e =>
    categories.some(c => e.category?.toLowerCase().includes(c.toLowerCase()))
  );
  if (relevant.length >= 8) return 3; // strong
  if (relevant.length >= 4) return 2; // moderate
  return 1; // low
}

function confidenceFromStrength(s: number): "high" | "moderate" | "low" {
  if (s >= 3) return "high";
  if (s >= 2) return "moderate";
  return "low";
}

function computePricingProjection(magnitude: number, evidence: Evidence[], narrative: StrategicNarrative | null): ProjectedMetric[] {
  const metrics: ProjectedMetric[] = [];
  const isIncrease = magnitude > 0;

  // Revenue impact — price elasticity estimation
  const revImpact = isIncrease
    ? Math.round(magnitude * 0.6)  // partial demand loss
    : Math.round(magnitude * 1.2); // volume increase
  metrics.push({
    label: "Revenue Potential",
    direction: isIncrease ? "up" : (Math.abs(revImpact) > 15 ? "up" : "down"),
    magnitude: `${revImpact > 0 ? "+" : ""}${revImpact}%`,
    description: isIncrease
      ? "Higher per-unit revenue partially offset by demand elasticity"
      : "Lower pricing drives volume but compresses per-unit margin",
  });

  // Margin impact
  const marginImpact = isIncrease ? Math.round(magnitude * 0.7) : Math.round(magnitude * 0.4);
  metrics.push({
    label: "Margin Impact",
    direction: isIncrease ? "up" : "down",
    magnitude: `${isIncrease ? "+" : ""}${marginImpact}%`,
    description: isIncrease
      ? "Direct margin expansion from higher price points"
      : "Volume gains partially compensate margin compression",
  });

  // Demand pressure
  const demandShift = isIncrease ? -Math.round(magnitude * 0.3) : Math.round(magnitude * 0.5);
  metrics.push({
    label: "Demand Pressure",
    direction: demandShift > 0 ? "up" : "down",
    magnitude: `${demandShift > 0 ? "+" : ""}${demandShift}%`,
    description: isIncrease
      ? "Price sensitivity may reduce demand volume"
      : "Lower barriers increase market accessibility",
  });

  // Competitive position
  metrics.push({
    label: "Competitive Positioning",
    direction: isIncrease ? "up" : "down",
    magnitude: isIncrease ? "Premium positioning" : "Market penetration",
    description: isIncrease
      ? "Higher prices signal quality and reduce price competition"
      : "Lower prices intensify competitive pressure on margins",
  });

  return metrics;
}

function computeDistributionProjection(magnitude: number, evidence: Evidence[], narrative: StrategicNarrative | null): ProjectedMetric[] {
  return [
    {
      label: "Growth Trajectory",
      direction: "up",
      magnitude: `+${Math.round(magnitude * 1.5)}%`,
      description: "New channels expand addressable market reach",
    },
    {
      label: "CAC Pressure",
      direction: magnitude > 40 ? "up" : "neutral",
      magnitude: magnitude > 40 ? `+${Math.round(magnitude * 0.3)}%` : "Stable",
      description: magnitude > 40
        ? "Multi-channel management increases acquisition costs"
        : "Existing infrastructure absorbs moderate expansion",
    },
    {
      label: "Scale Potential",
      direction: "up",
      magnitude: `${Math.round(1 + magnitude / 30)}–${Math.round(2 + magnitude / 20)}×`,
      description: "Parallel channels create multiplicative distribution leverage",
    },
    {
      label: "Operational Complexity",
      direction: "up",
      magnitude: `+${Math.round(magnitude * 0.5)}%`,
      description: "Channel coordination and fulfillment complexity increases",
    },
  ];
}

function computeProductizationProjection(magnitude: number, evidence: Evidence[], narrative: StrategicNarrative | null): ProjectedMetric[] {
  const standardization = magnitude / 100;
  return [
    {
      label: "Labor Dependency",
      direction: "down",
      magnitude: `-${Math.round(standardization * 60)}%`,
      description: "Repeatable production reduces per-unit labor requirement",
    },
    {
      label: "Margin Structure",
      direction: "up",
      magnitude: `+${Math.round(standardization * 45)}%`,
      description: "Standardization converts variable costs to fixed, improving unit economics",
    },
    {
      label: "Scalability",
      direction: "up",
      magnitude: `${Math.round(1 + standardization * 5)}–${Math.round(2 + standardization * 8)}×`,
      description: "Output scales without proportional resource growth",
    },
    {
      label: "Revenue Predictability",
      direction: "up",
      magnitude: standardization > 0.4 ? "High" : "Moderate",
      description: "Product packages enable recurring revenue and pipeline forecasting",
    },
  ];
}

function computeCostProjection(magnitude: number, evidence: Evidence[]): ProjectedMetric[] {
  return [
    {
      label: "Margin Expansion",
      direction: "up",
      magnitude: `+${Math.round(magnitude * 0.8)}%`,
      description: "Direct cost reduction flows through to bottom line",
    },
    {
      label: "Execution Risk",
      direction: magnitude > 30 ? "up" : "neutral",
      magnitude: magnitude > 30 ? "High" : "Manageable",
      description: magnitude > 30
        ? "Deep restructuring carries significant operational risk"
        : "Incremental optimization within existing structure",
    },
    {
      label: "Competitive Position",
      direction: "up",
      magnitude: "Strengthened",
      description: "Lower cost basis enables pricing flexibility and margin advantage",
    },
  ];
}

function computeExpansionProjection(magnitude: number, evidence: Evidence[]): ProjectedMetric[] {
  return [
    {
      label: "Revenue Potential",
      direction: "up",
      magnitude: `+${Math.round(magnitude * 1.8)}%`,
      description: "Adjacent markets expand total addressable opportunity",
    },
    {
      label: "Competitive Dynamics",
      direction: "neutral",
      magnitude: "New landscape",
      description: "Different competitive set requires positioning adaptation",
    },
    {
      label: "Execution Timeline",
      direction: "up",
      magnitude: magnitude > 30 ? "12–24 months" : "6–12 months",
      description: "Market entry requires customer discovery and channel development",
    },
    {
      label: "Cannibalization Risk",
      direction: magnitude > 50 ? "neutral" : "down",
      magnitude: magnitude > 50 ? "Monitor" : "Low",
      description: magnitude > 50
        ? "Large expansion may overlap existing segments"
        : "Adjacent positioning minimizes self-competition",
    },
  ];
}

/* ── Main Simulation Function ── */

export function simulateScenario(
  scenario: ScenarioDefinition,
  evidence: Evidence[],
  narrative: StrategicNarrative | null,
): ScenarioProjection {
  const strength = evidenceStrength(evidence, scenario.affectedCategories);
  const confidence = confidenceFromStrength(strength);

  let metrics: ProjectedMetric[];
  let strategicImplication: string;
  let risks: string[];

  switch (scenario.type) {
    case "pricing_change":
      metrics = computePricingProjection(scenario.magnitude, evidence, narrative);
      strategicImplication = scenario.magnitude > 0
        ? "Premium pricing can strengthen margins if demand remains elastic enough to sustain volume"
        : "Aggressive pricing captures market share but compresses margins — requires volume to compensate";
      risks = scenario.magnitude > 0
        ? ["Demand elasticity may be higher than projected", "Competitor undercutting risk"]
        : ["Margin compression may exceed volume gains", "Perceived value dilution"];
      break;

    case "distribution_change":
      metrics = computeDistributionProjection(scenario.magnitude, evidence, narrative);
      strategicImplication = "Multi-channel expansion multiplies market reach but increases operational coordination complexity";
      risks = ["Channel conflict potential", "Quality consistency across channels", "Increased management overhead"];
      break;

    case "productization":
      metrics = computeProductizationProjection(scenario.magnitude, evidence, narrative);
      strategicImplication = "Converting services to products removes labor constraints and enables exponential scaling at improved margins";
      risks = ["Customer resistance to standardized offering", "Transition period revenue dip", "Premium segment cannibalization"];
      break;

    case "cost_restructure":
      metrics = computeCostProjection(scenario.magnitude, evidence);
      strategicImplication = "Cost restructuring improves competitive positioning through margin flexibility and pricing power";
      risks = ["Execution risk during transition", "Service quality impact", "Employee morale and retention"];
      break;

    case "market_expansion":
      metrics = computeExpansionProjection(scenario.magnitude, evidence);
      strategicImplication = "Market expansion diversifies revenue streams and reduces single-market dependency risk";
      risks = ["Unknown competitive dynamics", "Cultural/regulatory differences", "Resource distraction from core"];
      break;

    default:
      metrics = [{
        label: "Strategic Impact",
        direction: "neutral",
        magnitude: "To be determined",
        description: "Custom scenario requires specific evidence for projection",
      }];
      strategicImplication = "Custom scenario — outcome depends on specific execution variables";
      risks = ["Insufficient data for reliable projection"];
      break;
  }

  const weakCategories = scenario.affectedCategories
    .filter(c => {
      const count = evidence.filter(e => e.category?.toLowerCase().includes(c.toLowerCase())).length;
      return count < 3;
    })
    .map(c => c.replace(/_/g, " "));

  const confidenceRationale = confidence === "high"
    ? `Strong evidence across ${scenario.affectedCategories.length} business domains supports this projection`
    : confidence === "moderate"
      ? `Moderate evidence available — projections would strengthen with more data on ${weakCategories.slice(0, 2).join(" and ") || "related areas"}`
      : `Early estimate — confidence would improve with more information about ${weakCategories.slice(0, 2).join(" and ") || "affected business areas"}`;

  return {
    scenarioId: scenario.id,
    scenarioLabel: scenario.label,
    metrics,
    confidence,
    confidenceRationale,
    strategicImplication,
    risks,
  };
}
