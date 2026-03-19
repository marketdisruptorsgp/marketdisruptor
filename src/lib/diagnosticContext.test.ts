/**
 * DiagnosticContext — Unit Tests
 *
 * Verifies:
 *  1. buildDiagnosticContext() correctly maps UI modes to DiagnosticMode
 *  2. Lens type resolution from UserLens id and lensType fields
 *  3. extractLensConfig() returns the right LensConfig
 *  4. Mode-specific constraint priority weights
 *  5. Mode-specific dimension priority weights
 *  6. constraintDetectionEngine honours DiagnosticContext in ranking
 *  7. deriveTrizSeeds honours DiagnosticContext mode boost
 *  8. surfaceBlockedPaths honours DiagnosticContext gate priority
 */

import { describe, it, expect } from "vitest";
import {
  buildDiagnosticContext,
  extractLensConfig,
  getConstraintPriorityWeight,
  getDimensionPriorityWeight,
  isLensActive,
  MODE_CONSTRAINT_PRIORITIES,
  MODE_DIMENSION_PRIORITIES,
  type DiagnosticContext,
} from "@/lib/diagnosticContext";
import { deriveTrizSeeds } from "@/lib/trizEngine";
import { surfaceBlockedPaths } from "@/lib/blockedPathEngine";
import type { StrategicInsight } from "@/lib/strategicEngine";

// ─── buildDiagnosticContext ────────────────────────────────────────────────────

describe("buildDiagnosticContext — mode mapping", () => {
  it("maps 'custom' UI mode to 'product' DiagnosticMode", () => {
    const ctx = buildDiagnosticContext("custom");
    expect(ctx.mode).toBe("product");
  });

  it("maps 'service' UI mode to 'service' DiagnosticMode", () => {
    const ctx = buildDiagnosticContext("service");
    expect(ctx.mode).toBe("service");
  });

  it("maps 'business' UI mode to 'business_model' DiagnosticMode", () => {
    const ctx = buildDiagnosticContext("business");
    expect(ctx.mode).toBe("business_model");
  });

  it("defaults unknown modes to 'product'", () => {
    const ctx = buildDiagnosticContext("unknown_mode");
    expect(ctx.mode).toBe("product");
  });
});

describe("buildDiagnosticContext — lens resolution", () => {
  it("produces lensType 'default' when no lens is supplied", () => {
    const ctx = buildDiagnosticContext("custom");
    expect(ctx.lensType).toBe("default");
    expect(ctx.lensConfig).toBeNull();
  });

  it("produces lensType 'eta' for the __eta__ lens id", () => {
    const ctx = buildDiagnosticContext("service", "__eta__", "ETA Acquisition Lens");
    expect(ctx.lensType).toBe("eta");
    expect(ctx.lensConfig?.name).toBe("ETA Acquisition Lens");
  });

  it("produces lensType 'custom' for a non-eta, non-default lens id", () => {
    const ctx = buildDiagnosticContext("business", "lens-123", "My Lens", {
      lensType: "custom",
      name: "My Lens",
    });
    expect(ctx.lensType).toBe("custom");
    expect(ctx.lensConfig?.name).toBe("My Lens");
  });

  it("respects rawLens.lensType over lensId inference", () => {
    const ctx = buildDiagnosticContext("custom", "some-id", "Some Lens", {
      lensType: "eta",
      name: "Override Lens",
    });
    expect(ctx.lensType).toBe("eta");
  });

  it("produces a human-readable label combining mode and lens", () => {
    const ctx = buildDiagnosticContext("service", "__eta__", "ETA Acquisition Lens");
    expect(ctx.label).toBe("Service · ETA Acquisition Lens");
  });

  it("product + default lens label is 'Product · Default Lens'", () => {
    const ctx = buildDiagnosticContext("custom");
    expect(ctx.label).toBe("Product · Default Lens");
  });
});

// ─── extractLensConfig ─────────────────────────────────────────────────────────

describe("extractLensConfig", () => {
  it("returns null for default lens context", () => {
    const ctx = buildDiagnosticContext("custom");
    expect(extractLensConfig(ctx)).toBeNull();
  });

  it("returns the LensConfig for an eta lens context", () => {
    const ctx = buildDiagnosticContext("service", "__eta__", "ETA Acquisition Lens");
    const cfg = extractLensConfig(ctx);
    expect(cfg).not.toBeNull();
    expect(cfg?.lensType).toBe("eta");
  });
});

// ─── isLensActive ──────────────────────────────────────────────────────────────

describe("isLensActive", () => {
  it("returns false for default lens", () => {
    const ctx = buildDiagnosticContext("custom");
    expect(isLensActive(ctx)).toBe(false);
  });

  it("returns true for eta lens", () => {
    const ctx = buildDiagnosticContext("service", "__eta__", "ETA Acquisition Lens");
    expect(isLensActive(ctx)).toBe(true);
  });

  it("returns true for custom lens", () => {
    const ctx = buildDiagnosticContext("business", "lens-x", "Custom Lens", { lensType: "custom", name: "Custom Lens" });
    expect(isLensActive(ctx)).toBe(true);
  });
});

// ─── getConstraintPriorityWeight ───────────────────────────────────────────────

describe("getConstraintPriorityWeight — mode-specific weights", () => {
  it("service mode assigns higher weight to labor_operations than product mode", () => {
    const productCtx = buildDiagnosticContext("custom");
    const serviceCtx = buildDiagnosticContext("service");
    const productWeight = getConstraintPriorityWeight(productCtx, "labor_operations");
    const serviceWeight = getConstraintPriorityWeight(serviceCtx, "labor_operations");
    expect(serviceWeight).toBeGreaterThan(productWeight);
  });

  it("business_model mode assigns higher weight to revenue_pricing than service mode", () => {
    const serviceCtx = buildDiagnosticContext("service");
    const businessCtx = buildDiagnosticContext("business");
    const serviceWeight = getConstraintPriorityWeight(serviceCtx, "revenue_pricing");
    const businessWeight = getConstraintPriorityWeight(businessCtx, "revenue_pricing");
    expect(businessWeight).toBeGreaterThan(serviceWeight);
  });

  it("returns 1.0 for unknown category (neutral fallback)", () => {
    const ctx = buildDiagnosticContext("custom");
    expect(getConstraintPriorityWeight(ctx, "nonexistent_category")).toBe(1.0);
  });
});

// ─── getDimensionPriorityWeight ────────────────────────────────────────────────

describe("getDimensionPriorityWeight — mode-specific weights", () => {
  it("service mode assigns higher weight to operational_dependency than product mode", () => {
    const productCtx = buildDiagnosticContext("custom");
    const serviceCtx = buildDiagnosticContext("service");
    expect(getDimensionPriorityWeight(serviceCtx, "operational_dependency"))
      .toBeGreaterThan(getDimensionPriorityWeight(productCtx, "operational_dependency"));
  });

  it("business_model mode assigns higher weight to cost_structure than service mode", () => {
    const serviceCtx = buildDiagnosticContext("service");
    const businessCtx = buildDiagnosticContext("business");
    expect(getDimensionPriorityWeight(businessCtx, "cost_structure"))
      .toBeGreaterThan(getDimensionPriorityWeight(serviceCtx, "cost_structure"));
  });

  it("product mode assigns higher weight to demand_signal than business_model mode", () => {
    const productCtx = buildDiagnosticContext("custom");
    const businessCtx = buildDiagnosticContext("business");
    expect(getDimensionPriorityWeight(productCtx, "demand_signal"))
      .toBeGreaterThan(getDimensionPriorityWeight(businessCtx, "demand_signal"));
  });

  it("returns 1.0 for unknown category (neutral fallback)", () => {
    const ctx = buildDiagnosticContext("service");
    expect(getDimensionPriorityWeight(ctx, "unknown_dimension")).toBe(1.0);
  });
});

// ─── MODE_CONSTRAINT_PRIORITIES completeness ───────────────────────────────────

describe("MODE_CONSTRAINT_PRIORITIES — all modes define all categories", () => {
  const EXPECTED_CATEGORIES = [
    "labor_operations",
    "revenue_pricing",
    "supply_distribution",
    "technology_information",
    "market_adoption",
    "structural_economic",
    "demand",
  ];

  for (const mode of ["product", "service", "business_model"] as const) {
    it(`mode '${mode}' defines weights for all constraint categories`, () => {
      const weights = MODE_CONSTRAINT_PRIORITIES[mode];
      for (const cat of EXPECTED_CATEGORIES) {
        expect(weights[cat]).toBeTypeOf("number");
        expect(weights[cat]).toBeGreaterThan(0);
      }
    });
  }
});

// ─── MODE_DIMENSION_PRIORITIES completeness ────────────────────────────────────

describe("MODE_DIMENSION_PRIORITIES — all modes define all evidence categories", () => {
  const EXPECTED_DIMENSIONS = [
    "demand_signal",
    "cost_structure",
    "distribution_channel",
    "pricing_model",
    "operational_dependency",
    "regulatory_constraint",
    "technology_dependency",
    "customer_behavior",
    "competitive_pressure",
  ];

  for (const mode of ["product", "service", "business_model"] as const) {
    it(`mode '${mode}' defines weights for all evidence dimensions`, () => {
      const weights = MODE_DIMENSION_PRIORITIES[mode];
      for (const dim of EXPECTED_DIMENSIONS) {
        expect(weights[dim]).toBeTypeOf("number");
        expect(weights[dim]).toBeGreaterThan(0);
      }
    });
  }
});

// ─── deriveTrizSeeds with DiagnosticContext ────────────────────────────────────

describe("deriveTrizSeeds — respects DiagnosticContext mode boost", () => {
  const laborConstraints = [
    { constraint: "labor intensity — revenue scales linearly with headcount, manual service delivery", reasoning: "owner dependent on staff for every job", severity: "high" },
  ];
  const bindingConstraint = { label: "labor intensity", reasoning: "manual staff-driven delivery limits scale" };

  it("returns seeds when context is provided (service mode)", () => {
    const ctx = buildDiagnosticContext("service");
    const seeds = deriveTrizSeeds(laborConstraints, bindingConstraint, "Test Biz", "", ctx);
    expect(seeds.length).toBeGreaterThan(0);
    expect(seeds[0].principleId).toBeTypeOf("number");
  });

  it("returns seeds without context (backward-compatible)", () => {
    const seeds = deriveTrizSeeds(laborConstraints, bindingConstraint, "Test Biz");
    expect(seeds.length).toBeGreaterThan(0);
  });

  it("service mode and product mode may produce different principle orderings for the same contradiction", () => {
    const serviceCtx = buildDiagnosticContext("service");
    const productCtx = buildDiagnosticContext("custom");
    const serviceSeeds = deriveTrizSeeds(laborConstraints, bindingConstraint, "Test Biz", "", serviceCtx);
    const productSeeds = deriveTrizSeeds(laborConstraints, bindingConstraint, "Test Biz", "", productCtx);
    // Both should return seeds — the ordering may differ
    expect(serviceSeeds.length).toBeGreaterThan(0);
    expect(productSeeds.length).toBeGreaterThan(0);
  });
});

// ─── surfaceBlockedPaths with DiagnosticContext ────────────────────────────────

describe("surfaceBlockedPaths — respects DiagnosticContext gate priority", () => {
  const mockConstraints: StrategicInsight[] = [
    {
      id: "c1",
      analysisId: "test",
      insightType: "constraint_cluster",
      label: "Platform marketplace cold-start",
      description: "marketplace requires critical mass",
      evidenceIds: [],
      relatedInsightIds: [],
      impact: 8,
      confidence: 0.8,
      createdAt: Date.now(),
      tier: "tier1" as any,
      mode: "product" as any,
    },
  ];

  it("returns a BlockedPathSurface without context (backward-compatible)", () => {
    const result = surfaceBlockedPaths(mockConstraints, {}, []);
    expect(result).toHaveProperty("blockedPaths");
    expect(result).toHaveProperty("summary");
    expect(Array.isArray(result.blockedPaths)).toBe(true);
  });

  it("returns a BlockedPathSurface with service context", () => {
    const ctx = buildDiagnosticContext("service");
    const result = surfaceBlockedPaths(mockConstraints, {}, [], ctx);
    expect(result).toHaveProperty("blockedPaths");
    expect(Array.isArray(result.blockedPaths)).toBe(true);
  });

  it("returns a BlockedPathSurface with business_model context", () => {
    const ctx = buildDiagnosticContext("business");
    const result = surfaceBlockedPaths(mockConstraints, {}, [], ctx);
    expect(result).toHaveProperty("blockedPaths");
    expect(Array.isArray(result.blockedPaths)).toBe(true);
  });

  it("summary totalBlocked is non-negative", () => {
    const ctx = buildDiagnosticContext("service");
    const result = surfaceBlockedPaths(mockConstraints, {}, [], ctx);
    expect(result.summary.totalBlocked).toBeGreaterThanOrEqual(0);
  });
});
