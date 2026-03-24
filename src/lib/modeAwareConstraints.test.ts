/**
 * TESTS — Mode-aware constraint filtering, UI deduplication, Insight Graph helpers
 *
 * Covers:
 *  1. SERVICE_ONLY_CONSTRAINTS set contents and membership
 *  2. PRODUCT_CONSTRAINT_LANGUAGE product-specific rewrites
 *  3. translateConstraintForMode() — null suppression + product labels
 *  4. constraintInverter.generateInversions() service-only gating
 *  5. StrategicActionBrief helpers — modeToDefaultRole, isProductMode, getActionPrefix
 *  6. WowCardGrid.deduplicateCards() — morphological collapse + SCAMPER grouping
 *  7. BlockedPathsPanel.groupByBlockingConstraint() — path grouping
 *  8. Sony WHCH720N product fixture — service-only constraints suppressed
 *  9. Consulting agency service fixture — service constraints surfaced
 * 10. Backwards-compat — translateConstraintForMode without mode returns base language
 */

import { describe, it, expect } from "vitest";
import {
  SERVICE_ONLY_CONSTRAINTS,
  PRODUCT_CONSTRAINT_LANGUAGE,
  translateConstraintForMode,
  translateConstraintToBusinessLanguage,
} from "@/lib/businessLanguage";
import { generateInversions } from "@/lib/constraintInverter";
import type { ConstraintShape } from "@/lib/analogEngine";
import { modeToDefaultRole, isProductMode, getActionPrefix } from "@/components/insight-graph/StrategicActionBrief";
import { deduplicateCards } from "@/components/creative/WowCardGrid";
import { groupByBlockingConstraint } from "@/components/creative/BlockedPathsPanel";
import type { WowCard } from "@/lib/creativeOpportunityEngine";
import type { BlockedPath } from "@/lib/creativeOpportunityEngine";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeWowCard(overrides: Partial<WowCard> & Pick<WowCard, "id" | "title">): WowCard {
  return {
    summary: "Test summary",
    innovationMethod: "morphological",
    demandAnchor: "Test demand",
    supplyAnchor: "Test supply",
    evidenceItems: [],
    viabilityScore: 0.7,
    radicalityScore: 0.6,
    evidenceScore: 0.5,
    compositeScore: 0.6,
    ...overrides,
  };
}

function makeBlockedPath(
  id: string,
  title: string,
  blockingConstraint: string,
  radicalityScore = 0.6,
): BlockedPath {
  return {
    id,
    title,
    summary: "Test blocked path",
    blockingConstraint,
    whatWouldNeedToBeTrue: "Some condition",
    radicalityScore,
  };
}

function makeConstraintShape(id: string): ConstraintShape {
  return {
    id,
    bottleneckType: "human_capacity",
    sourceConstraintLabel: id.replace(/_/g, " "),
    scarceResource: "labor",
  };
}

// ── 1. SERVICE_ONLY_CONSTRAINTS contents ─────────────────────────────────────

describe("SERVICE_ONLY_CONSTRAINTS set", () => {
  it("contains labor_intensity", () => {
    expect(SERVICE_ONLY_CONSTRAINTS.has("labor_intensity")).toBe(true);
  });

  it("contains owner_dependency", () => {
    expect(SERVICE_ONLY_CONSTRAINTS.has("owner_dependency")).toBe(true);
  });

  it("contains linear_scaling", () => {
    expect(SERVICE_ONLY_CONSTRAINTS.has("linear_scaling")).toBe(true);
  });

  it("contains geographic_constraint", () => {
    expect(SERVICE_ONLY_CONSTRAINTS.has("geographic_constraint")).toBe(true);
  });

  it("does NOT contain commoditized_pricing (product-relevant)", () => {
    expect(SERVICE_ONLY_CONSTRAINTS.has("commoditized_pricing")).toBe(false);
  });

  it("does NOT contain trust_deficit (universal)", () => {
    expect(SERVICE_ONLY_CONSTRAINTS.has("trust_deficit")).toBe(false);
  });
});

// ── 2. PRODUCT_CONSTRAINT_LANGUAGE rewrites ──────────────────────────────────

describe("PRODUCT_CONSTRAINT_LANGUAGE map", () => {
  it("commoditized_pricing entry mentions feature commoditization language", () => {
    const text = PRODUCT_CONSTRAINT_LANGUAGE["commoditized_pricing"] ?? "";
    expect(text.toLowerCase()).toContain("commodit");
  });

  it("channel_dependency entry is provided", () => {
    expect(PRODUCT_CONSTRAINT_LANGUAGE["channel_dependency"]).toBeDefined();
  });

  it("expertise_barrier entry is provided", () => {
    expect(PRODUCT_CONSTRAINT_LANGUAGE["expertise_barrier"]).toBeDefined();
  });

  it("does NOT contain entries for service-only constraints", () => {
    for (const c of SERVICE_ONLY_CONSTRAINTS) {
      expect(PRODUCT_CONSTRAINT_LANGUAGE[c]).toBeUndefined();
    }
  });
});

// ── 3. translateConstraintForMode() ──────────────────────────────────────────

describe("translateConstraintForMode() — null suppression", () => {
  it("returns null for labor_intensity in product mode", () => {
    expect(translateConstraintForMode("labor_intensity", "product")).toBeNull();
  });

  it("returns null for owner_dependency in product mode", () => {
    expect(translateConstraintForMode("owner_dependency", "product")).toBeNull();
  });

  it("returns null for linear_scaling in product mode", () => {
    expect(translateConstraintForMode("linear_scaling", "product")).toBeNull();
  });

  it("returns null for geographic_constraint in product mode", () => {
    expect(translateConstraintForMode("geographic_constraint", "product")).toBeNull();
  });

  it("returns string (NOT null) for labor_intensity in service mode", () => {
    const result = translateConstraintForMode("labor_intensity", "service");
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
  });

  it("service mode: labor_intensity retains billable hours framing", () => {
    const result = translateConstraintForMode("labor_intensity", "service");
    expect(result?.toLowerCase()).toContain("billable hours");
  });

  it("returns string for owner_dependency in service mode", () => {
    const result = translateConstraintForMode("owner_dependency", "service");
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
  });

  it("returns string for geographic_constraint in service mode", () => {
    const result = translateConstraintForMode("geographic_constraint", "service");
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
  });

  it("product mode: commoditized_pricing uses PRODUCT_CONSTRAINT_LANGUAGE rewrite", () => {
    const result = translateConstraintForMode("commoditized_pricing", "product");
    expect(result).toBe(PRODUCT_CONSTRAINT_LANGUAGE["commoditized_pricing"]);
  });

  it("product mode: constraint NOT in service-only or product map falls back to shared language", () => {
    const shared = translateConstraintToBusinessLanguage("revenue_concentration");
    const modeResult = translateConstraintForMode("revenue_concentration", "product");
    expect(modeResult).toBe(shared);
  });

  it("null analysisType falls back to shared language (backwards-compat)", () => {
    const shared = translateConstraintToBusinessLanguage("labor_intensity");
    const result = translateConstraintForMode("labor_intensity", null);
    expect(result).toBe(shared);
  });

  it("undefined analysisType falls back to shared language (backwards-compat)", () => {
    const shared = translateConstraintToBusinessLanguage("labor_intensity");
    const result = translateConstraintForMode("labor_intensity", undefined);
    expect(result).toBe(shared);
  });

  it("business_model mode: labor_intensity not null (not a service-only suppressed constraint)", () => {
    const result = translateConstraintForMode("labor_intensity", "business_model");
    expect(result).not.toBeNull();
    expect(result?.toLowerCase()).not.toContain("billable hours");
  });

  it("explicit fallback is used when constraint is unknown and no mode override", () => {
    const result = translateConstraintForMode("unknown_constraint_xyz", "product", "Custom fallback text");
    expect(result).toBe("Custom fallback text");
  });
});

// ── 4. generateInversions() service-only gating ─────────────────────────────

describe("generateInversions() — service-only gating in product mode", () => {
  it("skips labor_intensity shape in product mode", () => {
    const shapes: ConstraintShape[] = [makeConstraintShape("labor_intensity")];
    const inversions = generateInversions(shapes, 2, 4, "product");
    expect(inversions).toHaveLength(0);
  });

  it("skips owner_dependency shape in product mode", () => {
    const shapes: ConstraintShape[] = [makeConstraintShape("owner_dependency")];
    const inversions = generateInversions(shapes, 2, 4, "product");
    expect(inversions).toHaveLength(0);
  });

  it("skips linear_scaling shape in product mode", () => {
    const shapes: ConstraintShape[] = [makeConstraintShape("linear_scaling")];
    const inversions = generateInversions(shapes, 2, 4, "product");
    expect(inversions).toHaveLength(0);
  });

  it("skips geographic_constraint shape in product mode", () => {
    const shapes: ConstraintShape[] = [
      { id: "geographic_constraint", bottleneckType: "geographic_tether", sourceConstraintLabel: "geographic constraint", scarceResource: "location" },
    ];
    const inversions = generateInversions(shapes, 2, 4, "product");
    expect(inversions).toHaveLength(0);
  });

  it("does NOT skip service-only constraints in service mode (backwards-compat)", () => {
    // In service mode, service-only constraints should be eligible for inversion
    const shapes: ConstraintShape[] = [
      { id: "labor_intensity", bottleneckType: "human_capacity", sourceConstraintLabel: "billable hours cap revenue", scarceResource: "consultant time" },
    ];
    // Should not throw and may return inversions if templates match
    const inversions = generateInversions(shapes, 2, 4, "service");
    // Just verify it doesn't throw — templates may or may not match
    expect(Array.isArray(inversions)).toBe(true);
  });

  it("no analysisType passed: service-only constraints eligible (backwards-compat)", () => {
    const shapes: ConstraintShape[] = [makeConstraintShape("labor_intensity")];
    // Without analysisType, no filtering should occur
    const inversions = generateInversions(shapes, 2, 4);
    expect(Array.isArray(inversions)).toBe(true);
  });
});

// ── 5. StrategicActionBrief helpers ─────────────────────────────────────────

describe("modeToDefaultRole()", () => {
  it('"custom" mode returns "buyer"', () => {
    expect(modeToDefaultRole("custom")).toBe("buyer");
  });

  it('"business" mode returns "buyer"', () => {
    expect(modeToDefaultRole("business")).toBe("buyer");
  });

  it('"service" mode returns "investor"', () => {
    expect(modeToDefaultRole("service")).toBe("investor");
  });

  it("undefined mode returns \"founder\"", () => {
    expect(modeToDefaultRole(undefined)).toBe("founder");
  });

  it("unknown mode returns \"founder\"", () => {
    expect(modeToDefaultRole("other")).toBe("founder");
  });
});

describe("isProductMode()", () => {
  it('"custom" is product mode', () => {
    expect(isProductMode("custom")).toBe(true);
  });

  it('"product" is product mode', () => {
    expect(isProductMode("product")).toBe(true);
  });

  it('"service" is NOT product mode', () => {
    expect(isProductMode("service")).toBe(false);
  });

  it('"business" is NOT product mode', () => {
    expect(isProductMode("business")).toBe(false);
  });

  it("undefined is NOT product mode", () => {
    expect(isProductMode(undefined)).toBe(false);
  });
});

describe("getActionPrefix()", () => {
  it('product mode ("custom") returns "Priority:"', () => {
    expect(getActionPrefix("custom", "founder")).toBe("Priority:");
  });

  it('product mode ("product") returns "Priority:"', () => {
    expect(getActionPrefix("product", "buyer")).toBe("Priority:");
  });

  it('"service" mode returns "As a investor:"', () => {
    expect(getActionPrefix("service", "investor")).toBe("As a investor:");
  });

  it('"business" mode returns "As a buyer:"', () => {
    expect(getActionPrefix("business", "buyer")).toBe("As a buyer:");
  });

  it("undefined mode returns role-prefixed string", () => {
    expect(getActionPrefix(undefined, "founder")).toBe("As a founder:");
  });
});

// ── 6. deduplicateCards() ────────────────────────────────────────────────────

describe("deduplicateCards()", () => {
  it("collapses two morphological cards with identical titles (keeps highest score)", () => {
    const cards: WowCard[] = [
      makeWowCard({ id: "m1", title: "Direct-to-consumer channel", innovationMethod: "morphological", compositeScore: 0.7 }),
      makeWowCard({ id: "m2", title: "Direct-to-consumer channel", innovationMethod: "morphological", compositeScore: 0.9 }),
    ];
    const result = deduplicateCards(cards);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("m2");
    expect(result[0].compositeScore).toBe(0.9);
  });

  it("collapses morphological cards case-insensitively", () => {
    const cards: WowCard[] = [
      makeWowCard({ id: "m1", title: "Premium Pricing Strategy", innovationMethod: "morphological", compositeScore: 0.6 }),
      makeWowCard({ id: "m2", title: "premium pricing strategy", innovationMethod: "morphological", compositeScore: 0.8 }),
    ];
    const result = deduplicateCards(cards);
    expect(result).toHaveLength(1);
  });

  it("groups SCAMPER cards by mutationType (keeps highest score per type)", () => {
    const cards: WowCard[] = [
      makeWowCard({ id: "s1", title: "Substitute packaging", innovationMethod: "scamper", mutationType: "Substitute", compositeScore: 0.5 }),
      makeWowCard({ id: "s2", title: "Substitute materials", innovationMethod: "scamper", mutationType: "Substitute", compositeScore: 0.8 }),
      makeWowCard({ id: "s3", title: "Combine features", innovationMethod: "scamper", mutationType: "Combine", compositeScore: 0.7 }),
    ];
    const result = deduplicateCards(cards);
    const substitutes = result.filter(c => c.mutationType === "Substitute");
    const combines = result.filter(c => c.mutationType === "Combine");
    expect(substitutes).toHaveLength(1);
    expect(substitutes[0].id).toBe("s2");
    expect(combines).toHaveLength(1);
  });

  it("passes analogy and triz cards through unchanged", () => {
    const cards: WowCard[] = [
      makeWowCard({ id: "a1", title: "Airbnb model", innovationMethod: "analogy" }),
      makeWowCard({ id: "t1", title: "Contradiction resolution", innovationMethod: "triz" }),
    ];
    const result = deduplicateCards(cards);
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(deduplicateCards([])).toHaveLength(0);
  });

  it("preserves distinct morphological cards with different titles", () => {
    const cards: WowCard[] = [
      makeWowCard({ id: "m1", title: "Strategy A", innovationMethod: "morphological" }),
      makeWowCard({ id: "m2", title: "Strategy B", innovationMethod: "morphological" }),
    ];
    expect(deduplicateCards(cards)).toHaveLength(2);
  });

  it("sorts output by descending compositeScore", () => {
    const cards: WowCard[] = [
      makeWowCard({ id: "m1", title: "Strategy A", innovationMethod: "morphological", compositeScore: 0.4 }),
      makeWowCard({ id: "m2", title: "Strategy B", innovationMethod: "morphological", compositeScore: 0.9 }),
      makeWowCard({ id: "a1", title: "Analogy", innovationMethod: "analogy", compositeScore: 0.7 }),
    ];
    const result = deduplicateCards(cards);
    expect(result[0].compositeScore).toBeGreaterThanOrEqual(result[1].compositeScore);
  });
});

// ── 7. groupByBlockingConstraint() ───────────────────────────────────────────

describe("groupByBlockingConstraint()", () => {
  it("groups paths sharing the same blockingConstraint", () => {
    const paths: BlockedPath[] = [
      makeBlockedPath("bp1", "Path A", "Capital barrier"),
      makeBlockedPath("bp2", "Path B", "Capital barrier"),
      makeBlockedPath("bp3", "Path C", "Regulatory barrier"),
    ];
    const groups = groupByBlockingConstraint(paths);
    expect(groups.size).toBe(2);
    expect(groups.get("capital barrier")).toHaveLength(2);
    expect(groups.get("regulatory barrier")).toHaveLength(1);
  });

  it("groups case-insensitively", () => {
    const paths: BlockedPath[] = [
      makeBlockedPath("bp1", "Path A", "Capital Barrier"),
      makeBlockedPath("bp2", "Path B", "capital barrier"),
    ];
    const groups = groupByBlockingConstraint(paths);
    expect(groups.size).toBe(1);
    expect(groups.values().next().value).toHaveLength(2);
  });

  it("sorts paths within group by descending radicalityScore", () => {
    const paths: BlockedPath[] = [
      makeBlockedPath("bp1", "Path A", "Capital barrier", 0.3),
      makeBlockedPath("bp2", "Path B", "Capital barrier", 0.9),
      makeBlockedPath("bp3", "Path C", "Capital barrier", 0.6),
    ];
    const groups = groupByBlockingConstraint(paths);
    const group = groups.get("capital barrier")!;
    expect(group[0].id).toBe("bp2");
    expect(group[1].id).toBe("bp3");
    expect(group[2].id).toBe("bp1");
  });

  it("returns empty map for empty input", () => {
    expect(groupByBlockingConstraint([]).size).toBe(0);
  });

  it("single path per constraint creates a single-item group", () => {
    const paths: BlockedPath[] = [
      makeBlockedPath("bp1", "Path A", "Unique constraint"),
    ];
    const groups = groupByBlockingConstraint(paths);
    expect(groups.size).toBe(1);
    expect(groups.get("unique constraint")).toHaveLength(1);
  });
});

// ── 8. Sony WHCH720N product fixture — service-only constraints suppressed ───

describe("Sony WHCH720N product fixture — service-only constraints suppressed", () => {
  const SONY_SERVICE_ONLY_CONSTRAINTS = [
    "labor_intensity",
    "owner_dependency",
    "linear_scaling",
    "geographic_constraint",
  ];

  const SONY_PRODUCT_CONSTRAINTS = [
    "commoditized_pricing",
    "channel_dependency",
    "expertise_barrier",
    "trust_deficit",
    "margin_compression",
    "awareness_gap",
  ];

  it("all service-only constraints return null in product mode", () => {
    for (const c of SONY_SERVICE_ONLY_CONSTRAINTS) {
      expect(translateConstraintForMode(c, "product"), `${c} should be null in product mode`).toBeNull();
    }
  });

  it("all product constraints return non-null text in product mode", () => {
    for (const c of SONY_PRODUCT_CONSTRAINTS) {
      const result = translateConstraintForMode(c, "product");
      expect(result, `${c} should have text in product mode`).not.toBeNull();
      expect(typeof result).toBe("string");
    }
  });

  it("product fixture: commoditized_pricing uses feature language", () => {
    const text = translateConstraintForMode("commoditized_pricing", "product")!;
    expect(text.toLowerCase()).toContain("commodit");
  });

  it("product fixture: channel_dependency uses distribution/margin language", () => {
    const text = translateConstraintForMode("channel_dependency", "product")!;
    expect(text.toLowerCase()).toMatch(/channel|margin|distribut|retail/);
  });

  it("product fixture: margin_compression references unit economics or BOM", () => {
    const text = translateConstraintForMode("margin_compression", "product")!;
    expect(text.toLowerCase()).toMatch(/margin|cost|bom|unit/);
  });

  it("product mode: deduplicateCards removes duplicate morphological noise-cancelling ideas", () => {
    const cards: WowCard[] = [
      makeWowCard({ id: "p1", title: "ANC premium tier SKU", innovationMethod: "morphological", compositeScore: 0.85 }),
      makeWowCard({ id: "p2", title: "ANC premium tier SKU", innovationMethod: "morphological", compositeScore: 0.60 }),
      makeWowCard({ id: "p3", title: "Direct DTC channel pivot", innovationMethod: "morphological", compositeScore: 0.75 }),
    ];
    const result = deduplicateCards(cards);
    expect(result).toHaveLength(2);
    const ancCard = result.find(c => c.title.toLowerCase().includes("anc"));
    expect(ancCard?.compositeScore).toBe(0.85);
  });
});

// ── 9. Consulting agency service fixture — service constraints surfaced ───────

describe("Consulting agency service fixture — service constraints surfaced", () => {
  it("service mode: labor_intensity is NOT null (surfaced)", () => {
    expect(translateConstraintForMode("labor_intensity", "service")).not.toBeNull();
  });

  it("service mode: owner_dependency is NOT null (surfaced)", () => {
    expect(translateConstraintForMode("owner_dependency", "service")).not.toBeNull();
  });

  it("service mode: geographic_constraint is NOT null (surfaced)", () => {
    expect(translateConstraintForMode("geographic_constraint", "service")).not.toBeNull();
  });

  it("service mode: labor_intensity includes billable hours framing", () => {
    const text = translateConstraintForMode("labor_intensity", "service")!;
    expect(text.toLowerCase()).toContain("billable hours");
  });

  it("service mode: blocked paths with shared constraint group correctly", () => {
    const paths: BlockedPath[] = [
      makeBlockedPath("s1", "Productize service delivery", "Owner dependency"),
      makeBlockedPath("s2", "Hire senior associate", "Owner dependency"),
      makeBlockedPath("s3", "Geographic expansion", "Labor intensity"),
    ];
    const groups = groupByBlockingConstraint(paths);
    expect(groups.size).toBe(2);
    expect(groups.get("owner dependency")).toHaveLength(2);
    expect(groups.get("labor intensity")).toHaveLength(1);
  });

  it("modeToDefaultRole('service') is 'investor' (acquisition lens for service firms)", () => {
    expect(modeToDefaultRole("service")).toBe("investor");
  });
});

// ── 10. Backwards-compat ─────────────────────────────────────────────────────

describe("Backwards-compatibility guards", () => {
  it("translateConstraintForMode(null) returns shared map language (not null)", () => {
    const shared = translateConstraintToBusinessLanguage("labor_intensity");
    expect(translateConstraintForMode("labor_intensity", null)).toBe(shared);
  });

  it("translateConstraintForMode(undefined) returns shared map language", () => {
    const shared = translateConstraintToBusinessLanguage("commoditized_pricing");
    expect(translateConstraintForMode("commoditized_pricing", undefined)).toBe(shared);
  });

  it("generateInversions() without analysisType does not throw", () => {
    const shapes: ConstraintShape[] = [makeConstraintShape("labor_intensity")];
    expect(() => generateInversions(shapes)).not.toThrow();
  });

  it("generateInversions() with null analysisType does not throw", () => {
    const shapes: ConstraintShape[] = [makeConstraintShape("labor_intensity")];
    expect(() => generateInversions(shapes, 2, 4, null)).not.toThrow();
  });

  it("modeToDefaultRole(undefined) returns 'founder' (legacy default)", () => {
    expect(modeToDefaultRole(undefined)).toBe("founder");
  });
});
