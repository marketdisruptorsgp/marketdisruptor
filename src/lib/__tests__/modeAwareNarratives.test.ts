/**
 * MODE-AWARE NARRATIVES — Test Suite
 *
 * Tests that the strategic pipeline produces mode-appropriate language for
 * both product and service analysis types.
 *
 * Acceptance criteria:
 *   ✅ Product mode: no "billable hours", "founder bottleneck", "booking platform"
 *   ✅ Product mode: shows product-specific constraints (durability, unit economics, supply chain)
 *   ✅ Service mode: shows service-specific constraints (labor intensity, owner dependency)
 *   ✅ translateConstraintForMode suppresses service-only constraints in product mode
 *   ✅ translateConstraintForMode uses product-specific language in product mode
 *   ❌ Product mode NEVER mentions billable hours, founder bottleneck, booking platforms
 *   ❌ Service mode NEVER mentions durability risk or repairability friction
 */

import { describe, it, expect } from "vitest";
import {
  translateConstraintForMode,
  translateConstraintToBusinessLanguage,
  SERVICE_ONLY_CONSTRAINTS,
  PRODUCT_CONSTRAINT_LANGUAGE,
} from "@/lib/businessLanguage";
import {
  selectProductConstraints,
  PRODUCT_CONSTRAINT_TEMPLATES,
} from "@/lib/productMode/productConstraints";
import {
  selectProductOpportunities,
  PRODUCT_MODE_EXCLUDED_PATTERNS,
} from "@/lib/productMode/productOpportunities";
import {
  inferProductStructuralProfile,
  selectProductBindingConstraints,
} from "@/lib/productMode/productStructuralInference";
import {
  inferServiceStructuralProfile,
  selectServiceBindingConstraints,
} from "@/lib/serviceMode/serviceStructuralInference";
import type { Evidence } from "@/lib/evidenceEngine";

// ─────────────────────────────────────────────────────────────────────────────
//  FIXTURES
// ─────────────────────────────────────────────────────────────────────────────

function makeEvidence(label: string, description: string): Evidence {
  return {
    id: `ev-${Math.random().toString(36).slice(2, 8)}`,
    type: "constraint",
    label,
    pipelineStep: "report",
    tier: "structural",
    description,
  };
}

const headphoneEvidence: Evidence[] = [
  makeEvidence("earcups flaking after 6 months", "build quality deteriorating rapidly"),
  makeEvidence("plastic hinge cracks after normal use", "durability issues with hinges"),
  makeEvidence("repair parts unavailable from manufacturer", "hard to fix — proprietary components"),
  makeEvidence("glued shut — non-serviceable design", "right to repair issue"),
  makeEvidence("competitors have same spec at lower price", "feature parity race to the bottom"),
  makeEvidence("retail margin takes 35% of ASP", "channel economics squeeze unit economics"),
];

const consultancyEvidence: Evidence[] = [
  makeEvidence("revenue tied to billable hours", "time-based billing model caps growth"),
  makeEvidence("hourly rate capped at team utilization", "labor-intensive delivery model"),
  makeEvidence("founder bottleneck — can't scale without founder", "owner dependency issue"),
  makeEvidence("single point of failure in client delivery", "key person risk"),
];

// ─────────────────────────────────────────────────────────────────────────────
//  §5.5 — businessLanguage.ts mode-aware translation
// ─────────────────────────────────────────────────────────────────────────────

describe("translateConstraintForMode — product mode suppression", () => {
  it("returns null for labor_intensity in product mode", () => {
    expect(translateConstraintForMode("labor_intensity", "product")).toBeNull();
  });

  it("returns null for owner_dependency in product mode", () => {
    expect(translateConstraintForMode("owner_dependency", "product")).toBeNull();
  });

  it("returns null for manual_process in product mode", () => {
    expect(translateConstraintForMode("manual_process", "product")).toBeNull();
  });

  it("returns null for linear_scaling in product mode", () => {
    expect(translateConstraintForMode("linear_scaling", "product")).toBeNull();
  });

  it("returns null for skill_scarcity in product mode", () => {
    expect(translateConstraintForMode("skill_scarcity", "product")).toBeNull();
  });

  it("returns null for all SERVICE_ONLY_CONSTRAINTS in product mode", () => {
    for (const constraint of SERVICE_ONLY_CONSTRAINTS) {
      expect(translateConstraintForMode(constraint, "product")).toBeNull();
    }
  });

  it("does NOT return null for labor_intensity in service mode", () => {
    expect(translateConstraintForMode("labor_intensity", "service")).not.toBeNull();
  });

  it("does NOT return null for owner_dependency in service mode", () => {
    expect(translateConstraintForMode("owner_dependency", "service")).not.toBeNull();
  });

  it("returns a non-null string for labor_intensity in business_model mode", () => {
    expect(translateConstraintForMode("labor_intensity", "business_model")).not.toBeNull();
  });
});

describe("translateConstraintForMode — product-specific language", () => {
  it("uses product-specific language for commoditized_pricing in product mode", () => {
    const result = translateConstraintForMode("commoditized_pricing", "product");
    expect(result).not.toBeNull();
    expect(result).not.toMatch(/billable|founder|booking/i);
  });

  it("uses product-specific language for channel_dependency in product mode", () => {
    const result = translateConstraintForMode("channel_dependency", "product");
    expect(result).not.toBeNull();
    expect(result).not.toMatch(/billable|founder|booking/i);
  });

  it("falls back to generic language for unknown constraints in product mode", () => {
    const result = translateConstraintForMode("unknown_constraint_xyz", "product", "default text");
    expect(result).not.toBeNull();
  });

  it("uses generic language for known constraints in service mode (no product overrides)", () => {
    const result = translateConstraintForMode("commoditized_pricing", "service");
    expect(result).not.toBeNull();
  });

  it("PRODUCT_CONSTRAINT_LANGUAGE contains product-specific overrides", () => {
    expect(Object.keys(PRODUCT_CONSTRAINT_LANGUAGE).length).toBeGreaterThan(0);
  });

  it("all PRODUCT_CONSTRAINT_LANGUAGE values are non-empty strings", () => {
    for (const [key, value] of Object.entries(PRODUCT_CONSTRAINT_LANGUAGE)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
      expect(key.length).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Product mode constraint language — negative assertions
// ─────────────────────────────────────────────────────────────────────────────

describe("product mode constraint language — negative assertions", () => {
  it("product constraint labels do NOT mention billable hours", () => {
    for (const template of PRODUCT_CONSTRAINT_TEMPLATES) {
      expect(template.label).not.toMatch(/billable|hours/i);
      expect(template.description).not.toMatch(/billable\s*hours/i);
    }
  });

  it("product constraint labels do NOT mention founder bottleneck", () => {
    for (const template of PRODUCT_CONSTRAINT_TEMPLATES) {
      expect(template.description).not.toMatch(/founder\s*bottleneck/i);
    }
  });

  it("product constraint labels do NOT mention booking platforms", () => {
    for (const template of PRODUCT_CONSTRAINT_TEMPLATES) {
      expect(template.description).not.toMatch(/booking\s*platform/i);
    }
  });

  it("product constraint narratives do NOT use Hermès handbag analogies", () => {
    for (const template of PRODUCT_CONSTRAINT_TEMPLATES) {
      expect(template.description).not.toMatch(/herm[eèé]s|handbag|PREMIUM\s*SIGNAL/i);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Product mode opportunity language — negative assertions
// ─────────────────────────────────────────────────────────────────────────────

describe("product mode opportunity language — negative assertions", () => {
  it("PRODUCT_MODE_EXCLUDED_PATTERNS includes booking_platform", () => {
    expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has("booking_platform")).toBe(true);
  });

  it("PRODUCT_MODE_EXCLUDED_PATTERNS includes aggregation", () => {
    expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has("aggregation")).toBe(true);
  });

  it("PRODUCT_MODE_EXCLUDED_PATTERNS includes labor_arbitrage", () => {
    expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has("labor_arbitrage")).toBe(true);
  });

  it("PRODUCT_MODE_EXCLUDED_PATTERNS includes billable_hours_expansion", () => {
    expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has("billable_hours_expansion")).toBe(true);
  });

  it("selected product opportunities do NOT include any excluded pattern IDs", () => {
    const headphoneProfile = inferProductStructuralProfile(headphoneEvidence);
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 5);
    for (const opp of opps) {
      expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has(opp.id)).toBe(false);
    }
  });

  it("product opportunity descriptions do NOT mention booking platforms", () => {
    const headphoneProfile = inferProductStructuralProfile(headphoneEvidence);
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 5);
    for (const opp of opps) {
      expect(opp.description).not.toMatch(/booking\s*platform/i);
      expect(opp.gtmImplication).not.toMatch(/booking\s*platform/i);
    }
  });

  it("product opportunity descriptions do NOT mention billable hours", () => {
    const headphoneProfile = inferProductStructuralProfile(headphoneEvidence);
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 5);
    for (const opp of opps) {
      expect(opp.description).not.toMatch(/billable\s*hours/i);
      expect(opp.economicRationale).not.toMatch(/billable\s*hours/i);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Product mode vs service mode — cross-contamination prevention
// ─────────────────────────────────────────────────────────────────────────────

describe("product mode structural inference — no service language", () => {
  it("product inference does NOT produce labor_intensity", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    expect((profile as unknown as Record<string, unknown>).labor_intensity).toBeUndefined();
  });

  it("product inference does NOT produce owner_dependency", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    expect((profile as unknown as Record<string, unknown>).owner_dependency).toBeUndefined();
  });

  it("product inference does NOT produce billable_hours", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    expect((profile as unknown as Record<string, unknown>).billable_hours).toBeUndefined();
  });

  it("product binding constraints do NOT include labor_intensity", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const constraints = selectProductBindingConstraints(profile, headphoneEvidence);
    expect(constraints).not.toContain("labor_intensity");
  });

  it("product binding constraints do NOT include owner_dependency", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const constraints = selectProductBindingConstraints(profile, headphoneEvidence);
    expect(constraints).not.toContain("owner_dependency");
  });
});

describe("service mode structural inference — no product language", () => {
  it("service inference does NOT produce durability_risk", () => {
    const profile = inferServiceStructuralProfile(consultancyEvidence);
    expect((profile as Record<string, unknown>).durability_risk).toBeUndefined();
  });

  it("service inference does NOT produce repairability_friction", () => {
    const profile = inferServiceStructuralProfile(consultancyEvidence);
    expect((profile as Record<string, unknown>).repairability_friction).toBeUndefined();
  });

  it("service inference does NOT produce feature_commoditization", () => {
    const profile = inferServiceStructuralProfile(consultancyEvidence);
    expect((profile as Record<string, unknown>).feature_commoditization).toBeUndefined();
  });

  it("service binding constraints include labor_intensity", () => {
    const profile = inferServiceStructuralProfile(consultancyEvidence);
    const constraints = selectServiceBindingConstraints(profile, consultancyEvidence);
    expect(constraints).toContain("labor_intensity");
  });

  it("service binding constraints do NOT include durability_risk", () => {
    const profile = inferServiceStructuralProfile(consultancyEvidence);
    const constraints = selectServiceBindingConstraints(profile, consultancyEvidence);
    expect(constraints).not.toContain("durability_risk");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Product constraint selection — Sony WHCH720N integration
// ─────────────────────────────────────────────────────────────────────────────

describe("selectProductConstraints — Sony WHCH720N fixture", () => {
  it("returns at least 2 constraints for headphone evidence", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const constraints = selectProductConstraints(profile, headphoneEvidence);
    expect(constraints.length).toBeGreaterThanOrEqual(2);
  });

  it("returns at most 4 constraints", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const constraints = selectProductConstraints(profile, headphoneEvidence, 4);
    expect(constraints.length).toBeLessThanOrEqual(4);
  });

  it("includes durability_risk for headphone evidence", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const constraints = selectProductConstraints(profile, headphoneEvidence);
    const ids = constraints.map(c => c.id);
    expect(ids).toContain("durability_risk");
  });

  it("constraints have required fields: id, label, description, impact, dimension", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const constraints = selectProductConstraints(profile, headphoneEvidence);
    for (const c of constraints) {
      expect(c.id).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(["high", "medium", "low"]).toContain(c.impact);
      expect(["product", "channel", "economics", "supply_chain", "market"]).toContain(c.dimension);
    }
  });

  it("constraints do NOT contain service-mode language", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const constraints = selectProductConstraints(profile, headphoneEvidence);
    for (const c of constraints) {
      expect(c.description).not.toMatch(/billable\s*hours/i);
      expect(c.description).not.toMatch(/founder\s*bottleneck/i);
      expect(c.description).not.toMatch(/booking\s*platform/i);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Product opportunity selection — integration
// ─────────────────────────────────────────────────────────────────────────────

describe("selectProductOpportunities — Sony WHCH720N fixture", () => {
  it("returns at least 1 opportunity for headphone evidence", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const opps = selectProductOpportunities(profile, headphoneEvidence);
    expect(opps.length).toBeGreaterThanOrEqual(1);
  });

  it("returns top N by relevance score", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const opps = selectProductOpportunities(profile, headphoneEvidence, 3);
    expect(opps.length).toBeLessThanOrEqual(3);
    // Should be sorted descending by relevance
    for (let i = 0; i < opps.length - 1; i++) {
      expect(opps[i].relevanceScore).toBeGreaterThanOrEqual(opps[i + 1].relevanceScore);
    }
  });

  it("durability_as_moat scores highest for headphone profile with durability evidence", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const opps = selectProductOpportunities(profile, headphoneEvidence, 3);
    expect(opps[0].id).toBe("durability_as_moat");
  });

  it("opportunities have required fields: id, label, description, gtmImplication, economicRationale, relevanceScore", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const opps = selectProductOpportunities(profile, headphoneEvidence, 3);
    for (const opp of opps) {
      expect(opp.id).toBeTruthy();
      expect(opp.label).toBeTruthy();
      expect(opp.description).toBeTruthy();
      expect(opp.gtmImplication).toBeTruthy();
      expect(opp.economicRationale).toBeTruthy();
      expect(typeof opp.relevanceScore).toBe("number");
    }
  });

  it("opportunity relevance scores are in 0–10 range", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const opps = selectProductOpportunities(profile, headphoneEvidence, 5);
    for (const opp of opps) {
      expect(opp.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(opp.relevanceScore).toBeLessThanOrEqual(10);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  generateInversions — premium_signal suppression in product mode
// ─────────────────────────────────────────────────────────────────────────────

import { generateInversions } from "@/lib/constraintInverter";
import type { ConstraintShape } from "@/lib/analogEngine";

describe("generateInversions — product mode premium_signal suppression", () => {
  const humanCapacityShape: ConstraintShape = {
    id: "cs-human-capacity",
    bottleneckType: "human_capacity",
    sourceConstraintLabel: "craft assembly requires skilled workers",
    scarceResource: "skilled labor",
    scalingBehavior: "linear",
    bindingMechanism: "capacity",
  };

  it("includes premium_signal inversions in service mode (no suppression)", () => {
    const inversions = generateInversions([humanCapacityShape], 2, 4, "service");
    const types = inversions.map(i => i.inversionType);
    expect(types).toContain("premium_signal");
  });

  it("suppresses premium_signal inversions in product mode", () => {
    const inversions = generateInversions([humanCapacityShape], 2, 4, "product");
    const types = inversions.map(i => i.inversionType);
    expect(types).not.toContain("premium_signal");
  });

  it("suppresses premium_signal in product mode — no Hermès language in output", () => {
    const inversions = generateInversions([humanCapacityShape], 2, 4, "product");
    for (const inv of inversions) {
      expect(inv.precedent).not.toMatch(/herm[eèé]s/i);
      expect(inv.invertedFrame).not.toMatch(/PREMIUM\s*SIGNAL/i);
    }
  });

  it("does NOT suppress premium_signal when analysisType is undefined (backward compat)", () => {
    const inversions = generateInversions([humanCapacityShape], 2, 4);
    const types = inversions.map(i => i.inversionType);
    expect(types).toContain("premium_signal");
  });

  it("still returns other inversion types in product mode (no blanket suppression)", () => {
    const regulatoryShape: ConstraintShape = {
      id: "cs-regulatory",
      bottleneckType: "regulatory_cage",
      sourceConstraintLabel: "CE marking compliance for electronics",
      scarceResource: "regulatory approval",
      scalingBehavior: "binary",
      bindingMechanism: "regulation",
    };
    const inversions = generateInversions([regulatoryShape], 2, 4, "product");
    const types = inversions.map(i => i.inversionType);
    expect(types).toContain("regulatory_shield");
  });
});
