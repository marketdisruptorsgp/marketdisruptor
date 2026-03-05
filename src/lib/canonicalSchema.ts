/**
 * CANONICAL DATA SCHEMA
 *
 * Universal internal data structure used across all three analysis modes
 * (Product, Service, Business Model). Each mode maps its inputs into
 * this shared structure, enabling unified intelligence processing while
 * preserving mode-specific UI experiences.
 *
 * Core Layers: Problem, Customer, Value, Delivery, Economics, Constraints
 * Derived Layers: Assumptions, Frictions, Hidden Costs, Market Norms, Strategic Leverage Points
 */

import type { LensType } from "@/lib/multiLensEngine";

// ═══════════════════════════════════════════════════════════════
//  CORE LAYERS
// ═══════════════════════════════════════════════════════════════

export interface ProblemLayer {
  statement: string;
  rootCauses: string[];
  affectedSegments: string[];
  severity: number; // 1-10
}

export interface CustomerLayer {
  segments: string[];
  behaviors: string[];
  painPoints: string[];
  unmetNeeds: string[];
}

export interface ValueLayer {
  coreProposition: string;
  deliveryMechanism: string;
  differentiators: string[];
  valueGaps: string[];
}

export interface DeliveryLayer {
  channels: string[];
  dependencies: string[];
  bottlenecks: string[];
  scalabilityConstraints: string[];
}

export interface EconomicsLayer {
  revenueModel: string;
  costDrivers: string[];
  margins: string;
  unitEconomics: string;
}

export interface ConstraintsLayer {
  structural: string[];
  regulatory: string[];
  technological: string[];
  behavioral: string[];
}

// ═══════════════════════════════════════════════════════════════
//  DERIVED LAYERS
// ═══════════════════════════════════════════════════════════════

export interface DerivedAssumption {
  id: string;
  statement: string;
  originLayer: "problem" | "customer" | "value" | "delivery" | "economics" | "constraints";
  confidence: "verified" | "modeled" | "speculative";
  leverageIfWrong: number; // 1-10
}

export interface DerivedFriction {
  id: string;
  description: string;
  category: "customer_effort" | "time_delay" | "cost_inefficiency" | "process_complexity" | "information_asymmetry" | "industry_inertia";
  score: number; // 1-10
  originLayer: string;
}

export interface HiddenCost {
  id: string;
  description: string;
  estimatedImpact: "high" | "medium" | "low";
  originLayer: string;
}

export interface MarketNorm {
  id: string;
  norm: string;
  challengeability: number; // 1-10
  originLayer: string;
}

export interface StrategicLeveragePoint {
  id: string;
  description: string;
  impactPotential: number; // 1-10
  feasibility: number; // 1-10
  originLayer: string;
  connectedAssumptions: string[];
}

// ═══════════════════════════════════════════════════════════════
//  CANONICAL MODEL
// ═══════════════════════════════════════════════════════════════

export interface CanonicalModel {
  mode: LensType;
  core: {
    problem: ProblemLayer;
    customer: CustomerLayer;
    value: ValueLayer;
    delivery: DeliveryLayer;
    economics: EconomicsLayer;
    constraints: ConstraintsLayer;
  };
  derived: {
    assumptions: DerivedAssumption[];
    frictions: DerivedFriction[];
    hiddenCosts: HiddenCost[];
    marketNorms: MarketNorm[];
    leveragePoints: StrategicLeveragePoint[];
  };
  computedAt: number;
}

// ═══════════════════════════════════════════════════════════════
//  EXTRACTOR — Maps raw analysis data into canonical form
// ═══════════════════════════════════════════════════════════════

export function extractCanonicalModel(
  mode: LensType,
  governedData: Record<string, unknown> | null,
  disruptData: Record<string, unknown> | null,
  businessData: Record<string, unknown> | null,
): CanonicalModel {
  const g = governedData || {};
  const d = disruptData || {};
  const b = businessData || {};

  const fp = g.first_principles as Record<string, unknown> | undefined;
  const cm = g.constraint_map as Record<string, unknown> | undefined;

  // ── Core Layers ──
  const problem: ProblemLayer = {
    statement: str(g.problem_statement || d.problem_statement || ""),
    rootCauses: arr(fp?.fundamental_constraints),
    affectedSegments: arr(fp?.behavioral_realities),
    severity: 7,
  };

  const customer: CustomerLayer = {
    segments: arr((d as any)?.targetCustomers),
    behaviors: arr(fp?.behavioral_realities),
    painPoints: arr((d as any)?.coreReality?.normalizedFrustrations),
    unmetNeeds: arr((d as any)?.userWorkflow?.frictionPoints?.map((f: any) => f.friction)),
  };

  const value: ValueLayer = {
    coreProposition: str((d as any)?.coreReality?.trueProblem || ""),
    deliveryMechanism: str(fp?.minimum_viable_system || ""),
    differentiators: [],
    valueGaps: arr((d as any)?.smartTechAnalysis?.limitationsOfCurrentApproach),
  };

  const delivery: DeliveryLayer = {
    channels: [],
    dependencies: arr(fp?.dependency_structure),
    bottlenecks: arr(fp?.resource_limits),
    scalabilityConstraints: arr(fp?.fundamental_constraints),
  };

  const economics: EconomicsLayer = {
    revenueModel: str((b as any)?.revenueReinvention?.currentRevenueMix || ""),
    costDrivers: [],
    margins: "",
    unitEconomics: "",
  };

  const constraints: ConstraintsLayer = {
    structural: arr(fp?.fundamental_constraints),
    regulatory: [],
    technological: [],
    behavioral: arr(fp?.behavioral_realities),
  };

  // ── Derived Layers ──
  const assumptions: DerivedAssumption[] = [];
  const viabilityAssumptions = (fp?.viability_assumptions as any[]) || [];
  for (const va of viabilityAssumptions) {
    assumptions.push({
      id: `da_${assumptions.length}`,
      statement: va.assumption || "",
      originLayer: "constraints",
      confidence: va.evidence_status || "speculative",
      leverageIfWrong: va.leverage_if_wrong || 5,
    });
  }

  const hiddenAssumptions = (d as any)?.hiddenAssumptions as any[] || [];
  for (const ha of hiddenAssumptions) {
    assumptions.push({
      id: `da_${assumptions.length}`,
      statement: ha.assumption || "",
      originLayer: "value",
      confidence: "speculative",
      leverageIfWrong: ha.leverageScore || 5,
    });
  }

  // Extract frictions from constraint map
  const frictions: DerivedFriction[] = [];
  const frictionTiers = g.friction_tiers as Record<string, unknown> | undefined;
  if (frictionTiers) {
    for (const [tier, items] of Object.entries(frictionTiers)) {
      const list = Array.isArray(items) ? items : items ? [items] : [];
      for (const item of list) {
        frictions.push({
          id: `df_${frictions.length}`,
          description: item.description || item.root_cause || "",
          category: detectFrictionCategory(item.description || ""),
          score: tier === "tier_1" ? 8 : tier === "tier_2" ? 5 : 3,
          originLayer: "constraints",
        });
      }
    }
  }

  const hiddenCosts: HiddenCost[] = [];
  const marketNorms: MarketNorm[] = [];
  const leveragePoints: StrategicLeveragePoint[] = [];

  // Extract leverage points from governed leverage_map
  const leverageMap = g.leverage_map as any[] | Record<string, unknown> | undefined;
  const levItems = Array.isArray(leverageMap) ? leverageMap : leverageMap ? [leverageMap] : [];
  for (const lev of levItems) {
    leveragePoints.push({
      id: `slp_${leveragePoints.length}`,
      description: lev.lever_id || lev.highest_leverage_point || lev.label || "",
      impactPotential: lev.impact_multiplier || lev.impact || 7,
      feasibility: 6,
      originLayer: "constraints",
      connectedAssumptions: [],
    });
  }

  return {
    mode,
    core: { problem, customer, value, delivery, economics, constraints },
    derived: { assumptions, frictions, hiddenCosts, marketNorms, leveragePoints },
    computedAt: Date.now(),
  };
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}

const FRICTION_CATEGORY_KEYWORDS: Record<DerivedFriction["category"], string[]> = {
  customer_effort: ["effort", "manual", "complex", "difficult", "confusing"],
  time_delay: ["delay", "wait", "slow", "latency", "lead time"],
  cost_inefficiency: ["cost", "expensive", "overhead", "waste", "margin"],
  process_complexity: ["process", "steps", "workflow", "bureaucra", "compliance"],
  information_asymmetry: ["information", "transparency", "hidden", "opaque", "asymmetr"],
  industry_inertia: ["legacy", "tradition", "inertia", "incumben", "standard"],
};

function detectFrictionCategory(text: string): DerivedFriction["category"] {
  const lower = text.toLowerCase();
  let best: DerivedFriction["category"] = "process_complexity";
  let bestHits = 0;
  for (const [cat, keywords] of Object.entries(FRICTION_CATEGORY_KEYWORDS)) {
    const hits = keywords.filter(kw => lower.includes(kw)).length;
    if (hits > bestHits) {
      bestHits = hits;
      best = cat as DerivedFriction["category"];
    }
  }
  return best;
}
