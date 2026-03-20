/**
 * DiagnosticContext Unit Tests
 *
 * Verifies:
 *  - buildDiagnosticContext() factory
 *  - extractLensConfig() helper
 *  - MODE_CATEGORY_WEIGHTS scoring tables
 *  - MODE_DIMENSION_PRIORITIES tables
 *  - getModeCategoryWeight() helper
 *  - getModePriorityDimensions() helper
 *  - contextKeyMatches() cache utility
 *  - createDiagnosticContextEmitter() pub/sub
 */

import { describe, it, expect, vi } from "vitest";
import {
  buildDiagnosticContext,
  extractLensConfig,
  getModeCategoryWeight,
  getModePriorityDimensions,
  contextKeyMatches,
  createDiagnosticContextEmitter,
  MODE_CATEGORY_WEIGHTS,
  MODE_DIMENSION_PRIORITIES,
  type DiagnosticContext,
  type DiagnosticMode,
} from "@/lib/diagnosticContext";
import type { UserLens } from "@/components/LensToggle";

// ── Fixtures ──────────────────────────────────────────────────

function makeLens(overrides: Partial<UserLens> = {}): UserLens {
  return {
    id: "lens-001",
    name: "Test Lens",
    lensType: "custom",
    evaluation_priorities: { cost: 0.3, time: 0.2, adoption: 0.5 },
    risk_tolerance: "medium",
    time_horizon: "18 months",
    ...overrides,
  };
}

const ETA_LENS: UserLens = {
  id: "__eta__",
  name: "ETA Acquisition Lens",
  lensType: "eta",
};

// ═══════════════════════════════════════════════════════════════
//  buildDiagnosticContext
// ═══════════════════════════════════════════════════════════════

describe("buildDiagnosticContext", () => {
  it("returns frozen object", () => {
    const ctx = buildDiagnosticContext("product");
    expect(Object.isFrozen(ctx)).toBe(true);
  });

  it("sets mode correctly", () => {
    const modes: DiagnosticMode[] = ["custom", "product", "service", "business"];
    for (const mode of modes) {
      const ctx = buildDiagnosticContext(mode);
      expect(ctx.mode).toBe(mode);
    }
  });

  it("defaults to lensType=default and lens=null when no lens provided", () => {
    const ctx = buildDiagnosticContext("custom");
    expect(ctx.lensType).toBe("default");
    expect(ctx.lens).toBeNull();
  });

  it("defaults to lensType=default when null lens is provided", () => {
    const ctx = buildDiagnosticContext("product", null);
    expect(ctx.lensType).toBe("default");
    expect(ctx.lens).toBeNull();
  });

  it("defaults to lensType=default when undefined lens is provided", () => {
    const ctx = buildDiagnosticContext("service", undefined);
    expect(ctx.lensType).toBe("default");
    expect(ctx.lens).toBeNull();
  });

  it("resolves lensType=eta from __eta__ lens id", () => {
    const ctx = buildDiagnosticContext("business", ETA_LENS);
    expect(ctx.lensType).toBe("eta");
  });

  it("resolves lensType=eta from ETA Acquisition Lens name", () => {
    const lens: UserLens = { id: "some-id", name: "ETA Acquisition Lens" };
    const ctx = buildDiagnosticContext("custom", lens);
    expect(ctx.lensType).toBe("eta");
  });

  it("resolves lensType=eta from lensType field", () => {
    const lens: UserLens = { id: "x", name: "My ETA", lensType: "eta" };
    const ctx = buildDiagnosticContext("product", lens);
    expect(ctx.lensType).toBe("eta");
  });

  it("resolves lensType=custom from custom lensType field", () => {
    const lens = makeLens({ lensType: "custom" });
    const ctx = buildDiagnosticContext("service", lens);
    expect(ctx.lensType).toBe("custom");
  });

  it("resolves lensType=default for a lens with lensType=default", () => {
    const lens: UserLens = { id: "def-1", name: "Default Lens", lensType: "default" };
    const ctx = buildDiagnosticContext("product", lens);
    expect(ctx.lensType).toBe("default");
    expect(ctx.lens).toBeNull();
  });

  it("populates lens config from custom lens", () => {
    const lens = makeLens();
    const ctx = buildDiagnosticContext("product", lens);
    expect(ctx.lens).not.toBeNull();
    expect(ctx.lens?.name).toBe("Test Lens");
    expect(ctx.lens?.lensType).toBe("custom");
    expect(ctx.lens?.evaluation_priorities).toEqual({ cost: 0.3, time: 0.2, adoption: 0.5 });
  });

  it("generates a deterministic contextKey", () => {
    const lens = makeLens({ id: "abc" });
    const ctx1 = buildDiagnosticContext("product", lens);
    const ctx2 = buildDiagnosticContext("product", lens);
    expect(ctx1.contextKey).toBe(ctx2.contextKey);
  });

  it("contextKey encodes mode, lensType, and lens id", () => {
    const lens = makeLens({ id: "abc" });
    const ctx = buildDiagnosticContext("product", lens);
    expect(ctx.contextKey).toContain("product");
    expect(ctx.contextKey).toContain("custom");
    expect(ctx.contextKey).toContain("abc");
  });

  it("contextKey differs for different modes", () => {
    const lens = makeLens();
    const ctx1 = buildDiagnosticContext("product", lens);
    const ctx2 = buildDiagnosticContext("service", lens);
    expect(ctx1.contextKey).not.toBe(ctx2.contextKey);
  });

  it("contextKey differs for different lens types", () => {
    const ctx1 = buildDiagnosticContext("product", null);
    const ctx2 = buildDiagnosticContext("product", ETA_LENS);
    expect(ctx1.contextKey).not.toBe(ctx2.contextKey);
  });

  it("contextKey uses 'none' when no lens id", () => {
    const ctx = buildDiagnosticContext("custom", null);
    expect(ctx.contextKey).toBe("custom:default:none");
  });
});

// ═══════════════════════════════════════════════════════════════
//  extractLensConfig
// ═══════════════════════════════════════════════════════════════

describe("extractLensConfig", () => {
  it("returns null for null input", () => {
    expect(extractLensConfig(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(extractLensConfig(undefined)).toBeNull();
  });

  it("returns null for a default-type lens", () => {
    const lens: UserLens = { id: "d1", name: "Default", lensType: "default" };
    expect(extractLensConfig(lens)).toBeNull();
  });

  it("returns LensConfig for a custom lens", () => {
    const lens = makeLens();
    const cfg = extractLensConfig(lens);
    expect(cfg).not.toBeNull();
    expect(cfg?.name).toBe("Test Lens");
    expect(cfg?.lensType).toBe("custom");
  });

  it("returns LensConfig for an ETA lens", () => {
    const cfg = extractLensConfig(ETA_LENS);
    expect(cfg).not.toBeNull();
    expect(cfg?.lensType).toBe("eta");
  });

  it("maps all UserLens fields into LensConfig", () => {
    const lens = makeLens({
      risk_tolerance: "low",
      time_horizon: "24 months",
      constraints: "no debt",
    });
    const cfg = extractLensConfig(lens);
    expect(cfg?.risk_tolerance).toBe("low");
    expect(cfg?.time_horizon).toBe("24 months");
    expect(cfg?.constraints).toBe("no debt");
  });
});

// ═══════════════════════════════════════════════════════════════
//  MODE_CATEGORY_WEIGHTS
// ═══════════════════════════════════════════════════════════════

describe("MODE_CATEGORY_WEIGHTS", () => {
  const ALL_MODES: DiagnosticMode[] = ["custom", "product", "service", "business"];
  const KNOWN_CATEGORIES = [
    "labor_operations",
    "revenue_pricing",
    "supply_distribution",
    "technology_information",
    "market_adoption",
    "structural_economic",
    "demand",
  ];

  it("has entries for all four modes", () => {
    for (const mode of ALL_MODES) {
      expect(MODE_CATEGORY_WEIGHTS[mode]).toBeDefined();
    }
  });

  it("has entries for all known categories in each mode", () => {
    for (const mode of ALL_MODES) {
      for (const cat of KNOWN_CATEGORIES) {
        expect(MODE_CATEGORY_WEIGHTS[mode][cat]).toBeDefined();
      }
    }
  });

  it("custom mode has all weights === 1.0 (neutral baseline)", () => {
    for (const cat of KNOWN_CATEGORIES) {
      expect(MODE_CATEGORY_WEIGHTS.custom[cat]).toBe(1.0);
    }
  });

  it("product mode boosts market_adoption above 1.0", () => {
    expect(MODE_CATEGORY_WEIGHTS.product.market_adoption).toBeGreaterThan(1.0);
  });

  it("service mode boosts labor_operations above 1.0", () => {
    expect(MODE_CATEGORY_WEIGHTS.service.labor_operations).toBeGreaterThan(1.0);
  });

  it("business mode boosts structural_economic above 1.0", () => {
    expect(MODE_CATEGORY_WEIGHTS.business.structural_economic).toBeGreaterThan(1.0);
  });

  it("all weights are positive numbers", () => {
    for (const mode of ALL_MODES) {
      for (const cat of KNOWN_CATEGORIES) {
        const w = MODE_CATEGORY_WEIGHTS[mode][cat];
        expect(typeof w).toBe("number");
        expect(w).toBeGreaterThan(0);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
//  MODE_DIMENSION_PRIORITIES
// ═══════════════════════════════════════════════════════════════

describe("MODE_DIMENSION_PRIORITIES", () => {
  it("custom mode has empty priority list", () => {
    expect(MODE_DIMENSION_PRIORITIES.custom).toEqual([]);
  });

  it("product mode has at least one priority dimension", () => {
    expect(MODE_DIMENSION_PRIORITIES.product.length).toBeGreaterThan(0);
  });

  it("service mode has at least one priority dimension", () => {
    expect(MODE_DIMENSION_PRIORITIES.service.length).toBeGreaterThan(0);
  });

  it("business mode has at least one priority dimension", () => {
    expect(MODE_DIMENSION_PRIORITIES.business.length).toBeGreaterThan(0);
  });

  it("priority dimensions are valid EvidenceCategory strings", () => {
    const VALID = new Set([
      "demand_signal", "cost_structure", "distribution_channel", "pricing_model",
      "operational_dependency", "regulatory_constraint", "technology_dependency",
      "customer_behavior", "competitive_pressure",
    ]);
    for (const [, dims] of Object.entries(MODE_DIMENSION_PRIORITIES)) {
      for (const d of dims) {
        expect(VALID.has(d)).toBe(true);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
//  getModeCategoryWeight
// ═══════════════════════════════════════════════════════════════

describe("getModeCategoryWeight", () => {
  it("returns 1.0 for null context", () => {
    expect(getModeCategoryWeight("labor_operations", null)).toBe(1.0);
  });

  it("returns 1.0 for undefined context", () => {
    expect(getModeCategoryWeight("labor_operations", undefined)).toBe(1.0);
  });

  it("returns 1.0 for custom mode", () => {
    const ctx = buildDiagnosticContext("custom");
    expect(getModeCategoryWeight("labor_operations", ctx)).toBe(1.0);
  });

  it("returns mode-specific weight for product mode", () => {
    const ctx = buildDiagnosticContext("product");
    const w = getModeCategoryWeight("supply_distribution", ctx);
    expect(w).toBe(MODE_CATEGORY_WEIGHTS.product.supply_distribution);
  });

  it("returns mode-specific weight for service mode", () => {
    const ctx = buildDiagnosticContext("service");
    const w = getModeCategoryWeight("labor_operations", ctx);
    expect(w).toBe(MODE_CATEGORY_WEIGHTS.service.labor_operations);
  });

  it("returns mode-specific weight for business mode", () => {
    const ctx = buildDiagnosticContext("business");
    const w = getModeCategoryWeight("structural_economic", ctx);
    expect(w).toBe(MODE_CATEGORY_WEIGHTS.business.structural_economic);
  });

  it("returns 1.0 for unknown category", () => {
    const ctx = buildDiagnosticContext("product");
    expect(getModeCategoryWeight("unknown_category", ctx)).toBe(1.0);
  });
});

// ═══════════════════════════════════════════════════════════════
//  getModePriorityDimensions
// ═══════════════════════════════════════════════════════════════

describe("getModePriorityDimensions", () => {
  it("returns [] for null context", () => {
    expect(getModePriorityDimensions(null)).toEqual([]);
  });

  it("returns [] for undefined context", () => {
    expect(getModePriorityDimensions(undefined)).toEqual([]);
  });

  it("returns [] for custom mode", () => {
    const ctx = buildDiagnosticContext("custom");
    expect(getModePriorityDimensions(ctx)).toEqual([]);
  });

  it("returns non-empty array for product mode", () => {
    const ctx = buildDiagnosticContext("product");
    expect(getModePriorityDimensions(ctx).length).toBeGreaterThan(0);
  });

  it("returns non-empty array for service mode", () => {
    const ctx = buildDiagnosticContext("service");
    expect(getModePriorityDimensions(ctx).length).toBeGreaterThan(0);
  });

  it("returns non-empty array for business mode", () => {
    const ctx = buildDiagnosticContext("business");
    expect(getModePriorityDimensions(ctx).length).toBeGreaterThan(0);
  });

  it("returns the exact MODE_DIMENSION_PRIORITIES entry for the active mode", () => {
    const ctx = buildDiagnosticContext("business");
    expect(getModePriorityDimensions(ctx)).toEqual(MODE_DIMENSION_PRIORITIES.business);
  });
});

// ═══════════════════════════════════════════════════════════════
//  contextKeyMatches
// ═══════════════════════════════════════════════════════════════

describe("contextKeyMatches", () => {
  it("returns false for undefined key", () => {
    const ctx = buildDiagnosticContext("product");
    expect(contextKeyMatches(undefined, ctx)).toBe(false);
  });

  it("returns false for null context", () => {
    expect(contextKeyMatches("product:default:none", null)).toBe(false);
  });

  it("returns false for undefined context", () => {
    expect(contextKeyMatches("product:default:none", undefined)).toBe(false);
  });

  it("returns true when key matches context", () => {
    const ctx = buildDiagnosticContext("product");
    expect(contextKeyMatches(ctx.contextKey, ctx)).toBe(true);
  });

  it("returns false when key does not match context", () => {
    const ctx1 = buildDiagnosticContext("product");
    const ctx2 = buildDiagnosticContext("service");
    expect(contextKeyMatches(ctx1.contextKey, ctx2)).toBe(false);
  });

  it("returns false when both are falsy", () => {
    expect(contextKeyMatches(undefined, null)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
//  createDiagnosticContextEmitter (Pub/Sub)
// ═══════════════════════════════════════════════════════════════

describe("createDiagnosticContextEmitter", () => {
  it("starts with 0 listeners", () => {
    const emitter = createDiagnosticContextEmitter();
    expect(emitter.listenerCount).toBe(0);
  });

  it("increments listenerCount on subscribe", () => {
    const emitter = createDiagnosticContextEmitter();
    emitter.subscribe(() => {});
    expect(emitter.listenerCount).toBe(1);
    emitter.subscribe(() => {});
    expect(emitter.listenerCount).toBe(2);
  });

  it("decrements listenerCount on unsubscribe", () => {
    const emitter = createDiagnosticContextEmitter();
    const unsub = emitter.subscribe(() => {});
    expect(emitter.listenerCount).toBe(1);
    unsub();
    expect(emitter.listenerCount).toBe(0);
  });

  it("notifies all listeners on emit", () => {
    const emitter = createDiagnosticContextEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    emitter.subscribe(listener1);
    emitter.subscribe(listener2);

    const ctx = buildDiagnosticContext("product");
    emitter.emit(ctx);

    expect(listener1).toHaveBeenCalledOnce();
    expect(listener1).toHaveBeenCalledWith(ctx);
    expect(listener2).toHaveBeenCalledOnce();
    expect(listener2).toHaveBeenCalledWith(ctx);
  });

  it("does not notify unsubscribed listeners", () => {
    const emitter = createDiagnosticContextEmitter();
    const listener = vi.fn();
    const unsub = emitter.subscribe(listener);
    unsub();

    emitter.emit(buildDiagnosticContext("service"));
    expect(listener).not.toHaveBeenCalled();
  });

  it("supports multiple emits and delivers each to subscribers", () => {
    const emitter = createDiagnosticContextEmitter();
    const received: DiagnosticContext[] = [];
    emitter.subscribe(ctx => received.push(ctx));

    const ctx1 = buildDiagnosticContext("product");
    const ctx2 = buildDiagnosticContext("service");
    emitter.emit(ctx1);
    emitter.emit(ctx2);

    expect(received).toHaveLength(2);
    expect(received[0]).toBe(ctx1);
    expect(received[1]).toBe(ctx2);
  });

  it("handles empty subscriber list gracefully on emit", () => {
    const emitter = createDiagnosticContextEmitter();
    expect(() => emitter.emit(buildDiagnosticContext("custom"))).not.toThrow();
  });

  it("calling unsubscribe twice does not throw", () => {
    const emitter = createDiagnosticContextEmitter();
    const unsub = emitter.subscribe(() => {});
    unsub();
    expect(() => unsub()).not.toThrow();
  });

  it("allows subscribing in listener callback without infinite loop", () => {
    const emitter = createDiagnosticContextEmitter();
    const inner = vi.fn();
    emitter.subscribe(() => {
      // Subscribe during emit — should not cause recursion
      emitter.subscribe(inner);
    });
    emitter.emit(buildDiagnosticContext("business"));
    expect(inner).not.toHaveBeenCalled(); // newly added after current emit loop
  });

  it("each subscribe returns a distinct unsubscribe function", () => {
    const emitter = createDiagnosticContextEmitter();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const unsub1 = emitter.subscribe(fn1);
    const unsub2 = emitter.subscribe(fn2);
    unsub1();
    emitter.emit(buildDiagnosticContext("product"));
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledOnce();
    unsub2();
    emitter.emit(buildDiagnosticContext("service"));
    expect(fn2).toHaveBeenCalledOnce(); // still only 1 call
  });
});

// ═══════════════════════════════════════════════════════════════
//  Integration: buildDiagnosticContext + emitter round-trip
// ═══════════════════════════════════════════════════════════════

describe("DiagnosticContext integration", () => {
  it("emitter correctly propagates mode/lens changes in sequence", () => {
    const emitter = createDiagnosticContextEmitter();
    const received: DiagnosticContext[] = [];
    emitter.subscribe(ctx => received.push(ctx));

    emitter.emit(buildDiagnosticContext("product", null));
    emitter.emit(buildDiagnosticContext("service", ETA_LENS));
    emitter.emit(buildDiagnosticContext("business", makeLens()));

    expect(received).toHaveLength(3);
    expect(received[0].mode).toBe("product");
    expect(received[0].lensType).toBe("default");
    expect(received[1].mode).toBe("service");
    expect(received[1].lensType).toBe("eta");
    expect(received[2].mode).toBe("business");
    expect(received[2].lensType).toBe("custom");
  });

  it("contextKey uniquely identifies each mode+lens combination", () => {
    const keys = new Set<string>();
    const configs: [DiagnosticMode, UserLens | null][] = [
      ["custom", null],
      ["product", null],
      ["service", null],
      ["business", null],
      ["product", ETA_LENS],
      ["service", ETA_LENS],
      ["business", makeLens({ id: "u1" })],
      ["product", makeLens({ id: "u2" })],
    ];
    for (const [mode, lens] of configs) {
      keys.add(buildDiagnosticContext(mode, lens).contextKey);
    }
    expect(keys.size).toBe(configs.length);
  });

  it("same mode+lens always produces the same contextKey", () => {
    const lens = makeLens({ id: "stable" });
    const k1 = buildDiagnosticContext("product", lens).contextKey;
    const k2 = buildDiagnosticContext("product", lens).contextKey;
    expect(k1).toBe(k2);
  });

  it("getModeCategoryWeight + getModePriorityDimensions are consistent with mode", () => {
    const ctx = buildDiagnosticContext("service");
    // Service mode should heavily weight labor
    const laborW = getModeCategoryWeight("labor_operations", ctx);
    expect(laborW).toBeGreaterThan(1.0);
    // And include operational_dependency in priorities
    const dims = getModePriorityDimensions(ctx);
    expect(dims).toContain("operational_dependency");
  });
});
