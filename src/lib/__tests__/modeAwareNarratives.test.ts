/**
 * Mode-Aware Narrative Tests — §3.6
 *
 * Validates that:
 * 1. Product-mode analyses do NOT emit service/founder-specific constraint language
 *    ("billable hours", "founder bottleneck", "Custom Work → Productized Systems").
 * 2. Service-mode analyses DO emit service-appropriate language
 *    ("billable hours", "founder bottleneck", "capacity").
 * 3. The translateConstraintForMode helper correctly gates service-only constraints.
 */

import { describe, it, expect } from "vitest";
import {
  translateConstraintToBusinessLanguage,
  translateConstraintForMode,
  isServiceOnlyConstraint,
  SERVICE_ONLY_CONSTRAINTS,
  PRODUCT_CONSTRAINT_LANGUAGE,
  CONSTRAINT_BUSINESS_LANGUAGE,
} from "@/lib/businessLanguage";

// ─────────────────────────────────────────────────────────────────────────────
//  SERVICE-ONLY CONSTRAINT GATING
// ─────────────────────────────────────────────────────────────────────────────

describe("isServiceOnlyConstraint", () => {
  it("marks labor_intensity as service-only", () => {
    expect(isServiceOnlyConstraint("labor_intensity")).toBe(true);
  });

  it("marks owner_dependency as service-only", () => {
    expect(isServiceOnlyConstraint("owner_dependency")).toBe(true);
  });

  it("marks linear_scaling as service-only", () => {
    expect(isServiceOnlyConstraint("linear_scaling")).toBe(true);
  });

  it("marks geographic_constraint as service-only", () => {
    expect(isServiceOnlyConstraint("geographic_constraint")).toBe(true);
  });

  it("does NOT mark vendor_concentration as service-only (valid for products)", () => {
    expect(isServiceOnlyConstraint("vendor_concentration")).toBe(false);
  });

  it("does NOT mark channel_dependency as service-only (valid for products)", () => {
    expect(isServiceOnlyConstraint("channel_dependency")).toBe(false);
  });

  it("does NOT mark commoditized_pricing as service-only (valid for products)", () => {
    expect(isServiceOnlyConstraint("commoditized_pricing")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  translateConstraintForMode — PRODUCT MODE
// ─────────────────────────────────────────────────────────────────────────────

describe("translateConstraintForMode — product mode", () => {
  it("returns null for labor_intensity in product mode (service-only)", () => {
    const result = translateConstraintForMode("labor_intensity", "product");
    expect(result).toBeNull();
  });

  it("returns null for owner_dependency in product mode (service-only)", () => {
    const result = translateConstraintForMode("owner_dependency", "product");
    expect(result).toBeNull();
  });

  it("returns null for linear_scaling in product mode (service-only)", () => {
    const result = translateConstraintForMode("linear_scaling", "product");
    expect(result).toBeNull();
  });

  it("does NOT include 'billable hours' language in product mode", () => {
    const result = translateConstraintForMode("labor_intensity", "product");
    // Returns null — no output at all, so no billable hours language
    expect(result).toBeNull();
  });

  it("does NOT include 'founder bottleneck' language in product mode", () => {
    const result = translateConstraintForMode("owner_dependency", "product");
    expect(result).toBeNull();
  });

  it("returns product-specific label for commoditized_pricing", () => {
    const result = translateConstraintForMode("commoditized_pricing", "product");
    expect(result).not.toBeNull();
    expect(result).toContain("Feature commoditization");
  });

  it("returns product-specific label for channel_dependency", () => {
    const result = translateConstraintForMode("channel_dependency", "product");
    expect(result).not.toBeNull();
    expect(result).toContain("Channel power");
  });

  it("returns product-specific label for vendor_concentration", () => {
    const result = translateConstraintForMode("vendor_concentration", "product");
    expect(result).not.toBeNull();
    expect(result).toContain("supply chain");
  });

  it("returns non-null label for margin_compression in product mode", () => {
    const result = translateConstraintForMode("margin_compression", "product");
    expect(result).not.toBeNull();
    expect(result).toContain("BOM");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  translateConstraintForMode — SERVICE MODE
// ─────────────────────────────────────────────────────────────────────────────

describe("translateConstraintForMode — service mode", () => {
  it("returns billable hours language for labor_intensity in service mode", () => {
    const result = translateConstraintForMode("labor_intensity", "service");
    expect(result).not.toBeNull();
    expect(result).toContain("billable hours");
  });

  it("returns founder bottleneck language for owner_dependency in service mode", () => {
    const result = translateConstraintForMode("owner_dependency", "service");
    expect(result).not.toBeNull();
    expect(result).toContain("bottleneck");
  });

  it("returns capacity language for linear_scaling in service mode", () => {
    const result = translateConstraintForMode("linear_scaling", "service");
    expect(result).not.toBeNull();
    expect(result).toContain("hiring");
  });

  it("returns geographic language for geographic_constraint in service mode", () => {
    const result = translateConstraintForMode("geographic_constraint", "service");
    expect(result).not.toBeNull();
    expect(result).toContain("team");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  translateConstraintForMode — BUSINESS_MODEL MODE
// ─────────────────────────────────────────────────────────────────────────────

describe("translateConstraintForMode — business_model mode", () => {
  it("returns language for supply_fragmentation in business_model mode", () => {
    const result = translateConstraintForMode("supply_fragmentation", "business_model");
    expect(result).not.toBeNull();
    expect(result).toContain("aggregates");
  });

  it("returns language for channel_dependency in business_model mode", () => {
    const result = translateConstraintForMode("channel_dependency", "business_model");
    expect(result).not.toBeNull();
    expect(result).toContain("margin");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PRODUCT-MODE FIXTURE — Sony WHCH720N Headphones scenario
// ─────────────────────────────────────────────────────────────────────────────

describe("Product-mode fixture — Sony WHCH720N headphones", () => {
  /**
   * Simulate the constraint labels that would appear in a product-mode Insight Graph
   * for a Sony headphone analysis where the constraint detection engine has identified
   * typical hardware/product constraints.
   */
  const productModeConstraintNames = [
    "commoditized_pricing",    // Feature commoditization — common for mid-range headphones
    "channel_dependency",      // Retail channel power (Sony → retailers)
    "vendor_concentration",    // Supply chain risk (ANC chips, drivers)
    "margin_compression",      // BOM pressure in mid-range consumer electronics
    "trust_deficit",           // Brand credibility vs Apple/Bose/Sony
  ];

  const productModeServiceOnlyNames = [
    "labor_intensity",         // "billable hours" — WRONG for hardware product
    "owner_dependency",        // "founder bottleneck" — WRONG for hardware product
    "linear_scaling",          // "growth requires hiring" — WRONG for hardware product
  ];

  it("does not emit service-only constraint language for product-mode constraints", () => {
    for (const name of productModeServiceOnlyNames) {
      const label = translateConstraintForMode(name, "product");
      expect(label).toBeNull();
    }
  });

  it("emits valid product-mode labels for product-relevant constraints", () => {
    for (const name of productModeConstraintNames) {
      const label = translateConstraintForMode(name, "product");
      expect(label).not.toBeNull();
      expect(typeof label).toBe("string");
      expect((label as string).length).toBeGreaterThan(10);
    }
  });

  it("does NOT include 'Your revenue is handcuffed to billable hours' for product mode", () => {
    const label = translateConstraintForMode("labor_intensity", "product");
    expect(label).toBeNull();
    const offendingPhrase = "handcuffed to billable hours";
    expect(label ?? "").not.toContain(offendingPhrase);
  });

  it("does NOT include 'can't grow beyond what you can personally handle' for product mode", () => {
    const label = translateConstraintForMode("owner_dependency", "product");
    expect(label).toBeNull();
    const offendingPhrase = "can't grow beyond what you can personally handle";
    expect(label ?? "").not.toContain(offendingPhrase);
  });

  it("product-mode commoditized_pricing label references product-relevant terms", () => {
    const label = translateConstraintForMode("commoditized_pricing", "product") ?? "";
    const productTerms = ["Feature commoditization", "margin", "competitors", "product"];
    const hasTerm = productTerms.some(t => label.toLowerCase().includes(t.toLowerCase()));
    expect(hasTerm).toBe(true);
  });

  it("product-mode vendor_concentration label references supply chain", () => {
    const label = translateConstraintForMode("vendor_concentration", "product") ?? "";
    expect(label.toLowerCase()).toContain("supply");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  SERVICE-MODE FIXTURE — Consulting / agency scenario
// ─────────────────────────────────────────────────────────────────────────────

describe("Service-mode fixture — consulting agency", () => {
  /**
   * Simulate constraint labels that should appear in a service-mode analysis
   * for a consulting or agency business.
   */
  const serviceModeConstraintNames = [
    "labor_intensity",     // "billable hours" — core service constraint
    "owner_dependency",    // "founder bottleneck" — key service growth constraint
    "linear_scaling",      // "growth requires hiring" — service delivery constraint
    "skill_scarcity",      // talent acquisition — service constraint
  ];

  it("emits billable hours language for service mode", () => {
    const label = translateConstraintForMode("labor_intensity", "service");
    expect(label).not.toBeNull();
    expect(label).toContain("billable hours");
  });

  it("emits founder bottleneck language for service mode", () => {
    const label = translateConstraintForMode("owner_dependency", "service");
    expect(label).not.toBeNull();
    expect(label).toContain("bottleneck");
  });

  it("emits capacity/hiring language for service mode linear_scaling", () => {
    const label = translateConstraintForMode("linear_scaling", "service");
    expect(label).not.toBeNull();
    expect(label).toContain("hiring");
  });

  it("all service-mode constraints return non-null labels", () => {
    for (const name of serviceModeConstraintNames) {
      const label = translateConstraintForMode(name, "service");
      expect(label).not.toBeNull();
      expect(typeof label).toBe("string");
      expect((label as string).length).toBeGreaterThan(10);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  BACKWARDS COMPATIBILITY — translateConstraintToBusinessLanguage unchanged
// ─────────────────────────────────────────────────────────────────────────────

describe("translateConstraintToBusinessLanguage (unchanged public API)", () => {
  it("still returns original labor_intensity label without mode arg", () => {
    const label = translateConstraintToBusinessLanguage("labor_intensity");
    expect(label).toContain("billable hours");
  });

  it("still returns original owner_dependency label without mode arg", () => {
    const label = translateConstraintToBusinessLanguage("owner_dependency");
    expect(label).toContain("bottleneck");
  });

  it("returns humanized fallback for unknown constraint", () => {
    const label = translateConstraintToBusinessLanguage("totally_unknown_constraint");
    expect(typeof label).toBe("string");
    expect(label.length).toBeGreaterThan(0);
  });

  it("SERVICE_ONLY_CONSTRAINTS set is exported and non-empty", () => {
    expect(SERVICE_ONLY_CONSTRAINTS.size).toBeGreaterThan(0);
  });

  it("PRODUCT_CONSTRAINT_LANGUAGE map is exported and non-empty", () => {
    expect(Object.keys(PRODUCT_CONSTRAINT_LANGUAGE).length).toBeGreaterThan(0);
  });

  it("CONSTRAINT_BUSINESS_LANGUAGE map is exported (backwards compat)", () => {
    expect(CONSTRAINT_BUSINESS_LANGUAGE["labor_intensity"]).toContain("billable hours");
  });
});
