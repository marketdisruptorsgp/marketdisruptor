/**
 * DIAGNOSTIC CONTEXT — Unified mode + lens propagation
 *
 * DiagnosticContext is the single contract that carries the user's
 * active Mode (product / service / business_model) and Lens configuration
 * through every engine: constraint detection, Zwicky morphological search,
 * TRIZ seeding, blocked-path surfacing, and convergence analysis.
 *
 * All engines accept this as an optional trailing parameter so existing
 * call-sites continue to work while progressively adopting context-aware
 * behaviour.
 */

import type { LensConfig } from "@/lib/lensWeighting";
import type { InnovationMode, FrontendMode } from "@/lib/modeIntelligence";

export type { InnovationMode, FrontendMode };
export type { LensConfig };

// ─────────────────────────────────────────────────────────────────────────────
//  CORE CONTEXT TYPE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The canonical context object passed to every diagnostic / opportunity engine.
 *
 * `mode`  — engine-layer mode ("product" | "service" | "business_model")
 * `lens`  — structural lens config (null = default weights)
 */
export interface DiagnosticContext {
  mode: InnovationMode;
  lens: LensConfig | null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  FACTORY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Default context when no mode/lens is specified */
export const DEFAULT_DIAGNOSTIC_CONTEXT: DiagnosticContext = {
  mode: "product",
  lens: null,
};

/**
 * Build a DiagnosticContext from the frontend AnalysisMode and an optional
 * UserLens-like object. This is called in AnalysisContext and hooks.
 */
export function buildDiagnosticContext(
  frontendMode: FrontendMode | string | null | undefined,
  lens: LensConfig | null | undefined,
): DiagnosticContext {
  return {
    mode: toEngineMode(frontendMode),
    lens: lens ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODE MAPPING UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert any frontend/legacy mode string to the canonical engine InnovationMode.
 *
 * Maps:
 *   "custom"         → "product"
 *   "service"        → "service"
 *   "business"       → "business_model"
 *   "product"        → "product"
 *   "business_model" → "business_model"
 */
export function toEngineMode(mode: string | null | undefined): InnovationMode {
  switch (mode) {
    case "service":       return "service";
    case "business":
    case "business_model": return "business_model";
    case "product":
    case "custom":
    default:              return "product";
  }
}

/**
 * Convert an engine InnovationMode back to the frontend AnalysisMode.
 */
export function toFrontendMode(mode: InnovationMode): FrontendMode {
  switch (mode) {
    case "service":        return "service";
    case "business_model": return "business";
    default:               return "custom";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DIMENSION PRIORITY MAPS — which dimensions each mode foregrounds
// ─────────────────────────────────────────────────────────────────────────────

/** Evidence category priorities per mode (higher = more important in ordering) */
export const MODE_DIMENSION_PRIORITIES: Record<
  InnovationMode,
  Partial<Record<string, number>>
> = {
  product: {
    cost_structure: 1.4,
    technology_dependency: 1.3,
    operational_dependency: 1.2,
    demand_signal: 1.1,
    competitive_pressure: 1.0,
    distribution_channel: 0.9,
    regulatory_constraint: 0.8,
    pricing_model: 0.9,
    customer_behavior: 1.0,
  },
  service: {
    operational_dependency: 1.5,
    customer_behavior: 1.4,
    distribution_channel: 1.3,
    demand_signal: 1.2,
    cost_structure: 1.0,
    technology_dependency: 1.0,
    pricing_model: 0.9,
    regulatory_constraint: 0.8,
    competitive_pressure: 0.9,
  },
  business_model: {
    pricing_model: 1.5,
    cost_structure: 1.4,
    distribution_channel: 1.3,
    competitive_pressure: 1.3,
    demand_signal: 1.1,
    customer_behavior: 1.0,
    operational_dependency: 0.9,
    technology_dependency: 0.8,
    regulatory_constraint: 1.0,
  },
  // object_reinvention treated same as product for dimension priorities
  object_reinvention: {
    cost_structure: 1.3,
    technology_dependency: 1.3,
    operational_dependency: 1.1,
    demand_signal: 1.0,
    competitive_pressure: 1.0,
    distribution_channel: 0.9,
    regulatory_constraint: 0.9,
    pricing_model: 0.8,
    customer_behavior: 1.0,
  },
};

/**
 * Extract a `LensConfig` from any lens-like object (UserLens, DiagnosisLensConfig, etc.).
 * Returns null when no lens is provided. Used to avoid repeated `as any` casts.
 */
export function extractLensConfig(lens: Record<string, unknown> | null | undefined): LensConfig | null {
  if (!lens) return null;
  return {
    name: (lens["name"] as string) ?? "Lens",
    lensType: (lens["lensType"] as LensConfig["lensType"]) ?? "default",
    evaluation_priorities: lens["evaluation_priorities"] as Record<string, number> | undefined,
    risk_tolerance: lens["risk_tolerance"] as string | undefined,
    time_horizon: lens["time_horizon"] as string | undefined,
    constraints: lens["constraints"] as string | undefined,
  };
}
/**
 * Get the dimension priority weight for a given evidence category + mode.
 * Returns 1.0 if not specified.
 */
export function getDimensionPriority(
  category: string,
  context: DiagnosticContext,
): number {
  return MODE_DIMENSION_PRIORITIES[context.mode]?.[category] ?? 1.0;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTRAINT CATEGORY WEIGHTS — how much each constraint category matters
// ─────────────────────────────────────────────────────────────────────────────

/** Constraint category boosts per mode */
export const MODE_CONSTRAINT_CATEGORY_BOOSTS: Record<
  InnovationMode,
  Partial<Record<string, number>>
> = {
  product: {
    labor_operations: 1.2,
    technology_information: 1.3,
    supply_distribution: 1.2,
    market_adoption: 1.2,
    revenue_pricing: 1.0,
    structural_economic: 0.9,
    demand: 1.0,
  },
  service: {
    labor_operations: 1.4,
    supply_distribution: 1.2,
    market_adoption: 1.2,
    demand: 1.3,
    revenue_pricing: 1.0,
    technology_information: 1.0,
    structural_economic: 0.9,
  },
  business_model: {
    revenue_pricing: 1.5,
    structural_economic: 1.4,
    market_adoption: 1.2,
    supply_distribution: 1.0,
    labor_operations: 0.9,
    technology_information: 0.9,
    demand: 1.1,
  },
  object_reinvention: {
    technology_information: 1.3,
    supply_distribution: 1.2,
    labor_operations: 1.1,
    market_adoption: 1.1,
    revenue_pricing: 1.0,
    structural_economic: 1.0,
    demand: 1.0,
  },
};

/**
 * Get the constraint category boost for a given category + mode.
 * Returns 1.0 if not found.
 */
export function getConstraintCategoryBoost(
  category: string,
  context: DiagnosticContext,
): number {
  return MODE_CONSTRAINT_CATEGORY_BOOSTS[context.mode]?.[category] ?? 1.0;
}

// ─────────────────────────────────────────────────────────────────────────────
//  LENS COMPOSITE WEIGHTS — combine mode + lens into a unified priority map
// ─────────────────────────────────────────────────────────────────────────────

import { computeLensWeights } from "@/lib/lensWeighting";

/**
 * Compute the combined dimension weight by multiplying mode priority with
 * lens constraint weight for a given dimension.
 *
 * Used by engines to score dimensions for prioritization.
 */
export function getCombinedDimensionWeight(
  dimension: string,
  context: DiagnosticContext,
): number {
  const modeWeight = getDimensionPriority(dimension, context);
  const lensWeights = computeLensWeights(context.lens);
  const lensWeight = lensWeights.constraint_priority_weights[dimension] ?? 1.0;
  return modeWeight * lensWeight;
}
