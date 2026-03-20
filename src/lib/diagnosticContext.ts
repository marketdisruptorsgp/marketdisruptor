/**
 * DIAGNOSTIC CONTEXT — Centralized mode/lens propagation contract
 *
 * Lightweight, SRP-focused module that serves as the canonical contract
 * for mode and lens propagation across all diagnostic engines.
 *
 * Design Principles:
 * - Single Responsibility: manages mode + lens state only
 * - Immutable: context objects are created via factory, not mutated
 * - Pub/Sub: event-driven model for downstream engine reactions (zero React deps)
 * - Factory: buildDiagnosticContext() is the sole creation path
 *
 * Usage:
 *   const ctx = buildDiagnosticContext("product", userLens);
 *   const lensConfig = extractLensConfig(userLens);
 */

import type { UserLens } from "@/components/LensToggle";
import type { LensConfig } from "@/lib/lensWeighting";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type DiagnosticMode = "custom" | "product" | "service" | "business";
export type DiagnosticLensType = "default" | "eta" | "custom";

/**
 * Immutable contract passed to all diagnostic engines and opportunity
 * pipelines. Encapsulates the current analysis mode and active lens.
 */
export interface DiagnosticContext {
  /** Active analysis mode — drives constraint tier weights and dimension priority */
  readonly mode: DiagnosticMode;
  /** Resolved lens configuration, or null when the default lens is active */
  readonly lens: LensConfig | null;
  /** Lens type shorthand for fast branching */
  readonly lensType: DiagnosticLensType;
  /**
   * Deterministic cache key that uniquely identifies this mode+lens combination.
   * Engines can use this to skip redundant recomputation.
   */
  readonly contextKey: string;
}

/** Listener notified whenever the DiagnosticContext changes */
export type DiagnosticContextListener = (ctx: DiagnosticContext) => void;

/** Unsubscribe handle returned by subscribe() */
export type Unsubscribe = () => void;

/**
 * Pub/Sub emitter for DiagnosticContext changes.
 * Used by engines and components to react to mode/lens updates without
 * tight coupling to React state or AnalysisContext.
 */
export interface DiagnosticContextEmitter {
  /** Register a listener — returns an unsubscribe function */
  subscribe(listener: DiagnosticContextListener): Unsubscribe;
  /** Broadcast a new DiagnosticContext to all registered listeners */
  emit(ctx: DiagnosticContext): void;
  /** Number of currently active subscribers */
  readonly listenerCount: number;
}

// ═══════════════════════════════════════════════════════════════
//  MODE-AWARE SCORING TABLES
// ═══════════════════════════════════════════════════════════════

/**
 * Per-mode constraint category weight multipliers.
 * Applied by rankConstraintCandidates() when a DiagnosticContext is provided.
 */
export const MODE_CATEGORY_WEIGHTS: Record<DiagnosticMode, Record<string, number>> = {
  custom: {
    labor_operations: 1.0,
    revenue_pricing: 1.0,
    supply_distribution: 1.0,
    technology_information: 1.0,
    market_adoption: 1.0,
    structural_economic: 1.0,
    demand: 1.0,
  },
  product: {
    labor_operations: 0.9,
    revenue_pricing: 1.1,
    supply_distribution: 1.3,  // supply chain + Bill of Materials are critical for products
    technology_information: 1.2,
    market_adoption: 1.3,      // adoption friction is top constraint for products
    structural_economic: 0.9,
    demand: 1.1,
  },
  service: {
    labor_operations: 1.4,     // labor intensity is primary service constraint
    revenue_pricing: 1.2,
    supply_distribution: 0.8,
    technology_information: 1.0,
    market_adoption: 1.1,
    structural_economic: 1.1,
    demand: 1.0,
  },
  business: {
    labor_operations: 1.0,
    revenue_pricing: 1.3,      // revenue model durability is critical
    supply_distribution: 1.0,
    technology_information: 0.9,
    market_adoption: 1.1,
    structural_economic: 1.4,  // structural economics are primary for business model analysis
    demand: 1.2,
  },
};

/**
 * Per-mode dimension prioritization for morphological search.
 * Dimensions listed here are boosted to "hot" status regardless of evidence
 * density when a matching mode is active.
 */
export const MODE_DIMENSION_PRIORITIES: Record<DiagnosticMode, string[]> = {
  custom: [],
  product: ["cost_structure", "distribution_channel", "technology_dependency", "customer_behavior"],
  service: ["operational_dependency", "pricing_model", "customer_behavior"],
  business: ["pricing_model", "cost_structure", "competitive_pressure", "demand_signal"],
};

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve the lens type from a UserLens.
 * Guards against missing or malformed lens objects.
 */
function resolveLensType(lens: UserLens | null | undefined): DiagnosticLensType {
  if (!lens) return "default";
  if (lens.lensType === "eta") return "eta";
  if (lens.lensType === "custom") return "custom";
  // Legacy fallback: ETA lens identified by well-known ID or name
  if (lens.id === "__eta__" || lens.name === "ETA Acquisition Lens") return "eta";
  return "default";
}

/**
 * Build a deterministic cache key from mode + lens identity.
 * Format: `{mode}:{lensType}:{lensId}` — cheap string concat, no crypto.
 */
function buildContextKey(mode: DiagnosticMode, lensType: DiagnosticLensType, lensId: string | null): string {
  return `${mode}:${lensType}:${lensId ?? "none"}`;
}

// ═══════════════════════════════════════════════════════════════
//  FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Extract a LensConfig from a UserLens for use in downstream engines.
 * Returns null when no lens is active (default lens).
 */
export function extractLensConfig(lens: UserLens | null | undefined): LensConfig | null {
  if (!lens) return null;
  const lensType = resolveLensType(lens);
  if (lensType === "default") return null;
  return {
    name: lens.name,
    lensType,
    evaluation_priorities: lens.evaluation_priorities,
    risk_tolerance: lens.risk_tolerance,
    time_horizon: lens.time_horizon,
    constraints: lens.constraints,
  };
}

/**
 * Factory: build an immutable DiagnosticContext from an active mode + optional lens.
 *
 * @param mode    - The active AnalysisMode / DiagnosticMode
 * @param lens    - The currently active UserLens, or null/undefined for default
 */
export function buildDiagnosticContext(
  mode: DiagnosticMode,
  lens?: UserLens | null,
): DiagnosticContext {
  const lensType = resolveLensType(lens);
  const lensConfig = extractLensConfig(lens);
  const contextKey = buildContextKey(mode, lensType, lens?.id ?? null);

  return Object.freeze({
    mode,
    lens: lensConfig,
    lensType,
    contextKey,
  });
}

// ═══════════════════════════════════════════════════════════════
//  PUB/SUB EMITTER
// ═══════════════════════════════════════════════════════════════

/**
 * Create a DiagnosticContext Pub/Sub emitter.
 *
 * Engines and components can subscribe to receive new context objects
 * whenever the user changes mode or lens, without depending on React state.
 *
 * @example
 * const emitter = createDiagnosticContextEmitter();
 * const unsub = emitter.subscribe(ctx => console.log(ctx.mode));
 * emitter.emit(buildDiagnosticContext("product", null));
 * unsub(); // clean up
 */
export function createDiagnosticContextEmitter(): DiagnosticContextEmitter {
  const listeners = new Set<DiagnosticContextListener>();

  return {
    subscribe(listener: DiagnosticContextListener): Unsubscribe {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    emit(ctx: DiagnosticContext): void {
      // Snapshot listeners before iterating so that listeners added during
      // the emit cycle are not called until the next emit.
      const snapshot = Array.from(listeners);
      snapshot.forEach(fn => fn(ctx));
    },
    get listenerCount(): number {
      return listeners.size;
    },
  };
}

// ═══════════════════════════════════════════════════════════════
//  SCORING HELPERS (used by engines)
// ═══════════════════════════════════════════════════════════════

/**
 * Get the mode-aware weight multiplier for a constraint category.
 * Returns 1.0 (neutral) when context is null or mode is "custom".
 */
export function getModeCategoryWeight(
  category: string,
  ctx: DiagnosticContext | null | undefined,
): number {
  if (!ctx || ctx.mode === "custom") return 1.0;
  return MODE_CATEGORY_WEIGHTS[ctx.mode]?.[category] ?? 1.0;
}

/**
 * Return the dimension categories that should be prioritized (boosted to "hot")
 * for the active mode in the context.
 */
export function getModePriorityDimensions(
  ctx: DiagnosticContext | null | undefined,
): string[] {
  if (!ctx) return [];
  return MODE_DIMENSION_PRIORITIES[ctx.mode] ?? [];
}

/**
 * Check whether a given contextKey matches the provided context.
 * Useful for cache invalidation in memoized engine results.
 */
export function contextKeyMatches(
  key: string | undefined,
  ctx: DiagnosticContext | null | undefined,
): boolean {
  if (!ctx || !key) return false;
  return key === ctx.contextKey;
}
