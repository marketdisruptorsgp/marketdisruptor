/**
 * DIAGNOSTIC CONTEXT — Canonical Mode + Lens Contract
 *
 * DiagnosticContext is the single source of truth for the active analysis
 * mode and lens configuration. It flows through every major engine:
 *   - constraintDetectionEngine
 *   - opportunityDesignEngine
 *   - trizEngine
 *   - blockedPathEngine
 *   - strategicEngine
 *
 * Engines use DiagnosticContext to:
 *   1. Bias constraint scoring toward mode-relevant dimensions
 *   2. Prioritize morphological dimensions relevant to the active mode
 *   3. Filter/reorder TRIZ principles for the current lens
 *   4. Weight blocked paths by mode
 *
 * Build with: buildDiagnosticContext()
 * Extract raw lens config with: extractLensConfig()
 */

import type { LensConfig } from "@/lib/lensWeighting";

// ═══════════════════════════════════════════════════════════════
//  CORE TYPES
// ═══════════════════════════════════════════════════════════════

/** The three analysis modes. "product" maps from the "custom" UI tab. */
export type DiagnosticMode = "product" | "service" | "business_model";

/** The three lens types aligned with LensConfig */
export type DiagnosticLensType = "default" | "eta" | "custom";

/**
 * DiagnosticContext — the canonical context object that every major engine
 * accepts as an optional parameter. When absent, engines fall back to
 * mode-neutral defaults so they remain fully backward-compatible.
 */
export interface DiagnosticContext {
  /** Active analysis mode */
  mode: DiagnosticMode;
  /** Active lens type */
  lensType: DiagnosticLensType;
  /**
   * Full lens configuration when lensType is "eta" or "custom".
   * null for "default" lens.
   */
  lensConfig: LensConfig | null;
  /**
   * Human-readable label for traceability in outputs / UI.
   * E.g. "Product · ETA Acquisition Lens"
   */
  label: string;
}

// ═══════════════════════════════════════════════════════════════
//  MODE DIMENSION PRIORITIES
//  Defines which evidence categories matter most for each mode.
// ═══════════════════════════════════════════════════════════════

/**
 * Evidence category priority weights per mode.
 * Used by opportunityDesignEngine to bias dimension activation.
 */
export const MODE_DIMENSION_PRIORITIES: Record<
  DiagnosticMode,
  Record<string, number>
> = {
  product: {
    demand_signal: 1.3,
    cost_structure: 1.2,
    technology_dependency: 1.2,
    customer_behavior: 1.1,
    distribution_channel: 1.0,
    pricing_model: 0.9,
    operational_dependency: 0.8,
    regulatory_constraint: 0.7,
    competitive_pressure: 1.0,
  },
  service: {
    operational_dependency: 1.4,
    customer_behavior: 1.3,
    distribution_channel: 1.2,
    demand_signal: 1.1,
    pricing_model: 1.1,
    competitive_pressure: 1.0,
    cost_structure: 0.9,
    technology_dependency: 0.8,
    regulatory_constraint: 0.7,
  },
  business_model: {
    cost_structure: 1.5,
    pricing_model: 1.4,
    competitive_pressure: 1.3,
    distribution_channel: 1.2,
    demand_signal: 1.1,
    regulatory_constraint: 1.1,
    operational_dependency: 1.0,
    customer_behavior: 0.9,
    technology_dependency: 0.8,
  },
};

/**
 * Constraint category priority weights per mode.
 * Used by constraintDetectionEngine to bias ranking.
 */
export const MODE_CONSTRAINT_PRIORITIES: Record<
  DiagnosticMode,
  Record<string, number>
> = {
  product: {
    market_adoption: 1.3,
    technology_information: 1.2,
    structural_economic: 1.1,
    supply_distribution: 1.0,
    labor_operations: 0.9,
    revenue_pricing: 0.9,
    demand: 1.1,
  },
  service: {
    labor_operations: 1.4,
    structural_economic: 1.2,
    market_adoption: 1.1,
    revenue_pricing: 1.1,
    demand: 1.0,
    supply_distribution: 1.0,
    technology_information: 0.9,
  },
  business_model: {
    revenue_pricing: 1.5,
    structural_economic: 1.4,
    market_adoption: 1.1,
    supply_distribution: 1.1,
    demand: 1.1,
    labor_operations: 0.9,
    technology_information: 0.9,
  },
};

// ═══════════════════════════════════════════════════════════════
//  FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Build a DiagnosticContext from the UI mode + lens selections.
 *
 * @param uiMode   The active AnalysisMode from AnalysisContext ("custom" | "service" | "business")
 * @param lensId   Optional lens ID (e.g. "__eta__") from UserLens.id
 * @param lensName Optional human-readable lens name
 * @param rawLens  Optional full lens config object (UserLens shape)
 */
export function buildDiagnosticContext(
  uiMode: "custom" | "service" | "business" | string,
  lensId?: string | null,
  lensName?: string | null,
  rawLens?: {
    lensType?: "default" | "eta" | "custom";
    name?: string;
    risk_tolerance?: string;
    constraints?: string;
    time_horizon?: string;
    evaluation_priorities?: Record<string, number>;
    primary_objective?: string;
    target_outcome?: string;
    available_resources?: string;
  } | null,
): DiagnosticContext {
  // Map UI mode → DiagnosticMode
  const mode: DiagnosticMode =
    uiMode === "service"
      ? "service"
      : uiMode === "business"
        ? "business_model"
        : "product";

  // Resolve lens type
  let lensType: DiagnosticLensType = "default";
  if (rawLens?.lensType) {
    lensType = rawLens.lensType;
  } else if (lensId === "__eta__") {
    lensType = "eta";
  } else if (lensId && lensId !== "__default__") {
    lensType = "custom";
  }

  // Build LensConfig if lens is active.
  // Only the fields defined in LensConfig are included; optional fields are
  // omitted (not set to undefined) to keep the object clean for consumers
  // like computeLensWeights() that read these properties explicitly.
  let lensConfig: LensConfig | null = null;
  if (lensType !== "default") {
    const name = rawLens?.name ?? lensName ?? (lensType === "eta" ? "ETA Acquisition Lens" : "Custom Lens");
    const config: LensConfig = { lensType, name };
    if (rawLens?.risk_tolerance != null) config.risk_tolerance = rawLens.risk_tolerance;
    if (rawLens?.constraints != null) config.constraints = rawLens.constraints;
    if (rawLens?.time_horizon != null) config.time_horizon = rawLens.time_horizon;
    if (rawLens?.evaluation_priorities != null) config.evaluation_priorities = rawLens.evaluation_priorities;
    lensConfig = config;
  }

  // Build human-readable label for traceability
  const modeLabel =
    mode === "product"
      ? "Product"
      : mode === "service"
        ? "Service"
        : "Business Model";
  const lensLabel =
    lensType === "eta"
      ? "ETA Acquisition Lens"
      : lensType === "custom"
        ? (lensConfig?.name ?? "Custom Lens")
        : "Default Lens";
  const label = `${modeLabel} · ${lensLabel}`;

  return { mode, lensType, lensConfig, label };
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Extract a raw LensConfig from a DiagnosticContext, suitable for
 * passing to computeLensWeights() or applyLensAdaptation().
 */
export function extractLensConfig(ctx: DiagnosticContext): LensConfig | null {
  return ctx.lensConfig;
}

/**
 * Get the constraint category priority weight for a given mode and category.
 * Returns 1.0 (neutral) when no specific priority is defined.
 */
export function getConstraintPriorityWeight(
  ctx: DiagnosticContext,
  category: string,
): number {
  return MODE_CONSTRAINT_PRIORITIES[ctx.mode][category] ?? 1.0;
}

/**
 * Get the dimension priority weight for a given mode and evidence category.
 * Returns 1.0 (neutral) when no specific priority is defined.
 */
export function getDimensionPriorityWeight(
  ctx: DiagnosticContext,
  category: string,
): number {
  return MODE_DIMENSION_PRIORITIES[ctx.mode][category] ?? 1.0;
}

/**
 * Returns true if the context represents a lens that adjusts evidence
 * thresholds or scoring (eta or custom with evaluation priorities).
 */
export function isLensActive(ctx: DiagnosticContext): boolean {
  return ctx.lensType !== "default";
}
