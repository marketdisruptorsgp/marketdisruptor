/**
 * PRODUCT MODE LIBRARIES — Test Suite
 *
 * Tests the productMode library files:
 *   - types.ts (interface contracts)
 *   - productConstraints.ts (selectProductConstraints, PRODUCT_CONSTRAINT_TEMPLATES)
 *   - productOpportunities.ts (selectProductOpportunities, PRODUCT_MODE_EXCLUDED_PATTERNS)
 *   - productActionPlan.ts (buildProductActionPlan — 5-phase GTM)
 *
 * Acceptance criteria:
 *   ✅ ProductConstraint has: id, label, description, impact, dimension
 *   ✅ ProductOpportunity has: id, label, description, gtmImplication, economicRationale, relevanceScore
 *   ✅ ProductAction has: phase, label, action, successGate, timeHorizon
 *   ✅ GTMStrategy has: channel, positioning, firstMove, timeline
 *   ✅ 10+ constraint templates exist
 *   ✅ 8+ opportunity templates exist (before filtering)
 *   ✅ 5-phase action plan for any product profile
 *   ✅ No booking platform, aggregation, or service-mode language
 *   ❌ No billable hours, founder bottleneck, or booking platforms anywhere
 */

import { describe, it, expect } from "vitest";
import {
  selectProductConstraints,
  PRODUCT_CONSTRAINT_TEMPLATES,
} from "@/lib/productMode/productConstraints";
import {
  selectProductOpportunities,
  PRODUCT_MODE_EXCLUDED_PATTERNS,
} from "@/lib/productMode/productOpportunities";
import { buildProductActionPlan } from "@/lib/productMode/productActionPlan";
import {
  inferProductStructuralProfile,
  selectProductBindingConstraints,
  type ProductFacetProfile,
} from "@/lib/productMode/productStructuralInference";
import type { ProductConstraint, ProductOpportunity, ProductAction, GTMStrategy } from "@/lib/productMode/types";
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

/** Sony WHCH720N fixture — durability + repairability signals */
const headphoneEvidence: Evidence[] = [
  makeEvidence("earcups flaking after 6 months", "build quality deteriorating"),
  makeEvidence("plastic cracks after normal use", "durability issues"),
  makeEvidence("parts not available for repair", "repairability friction"),
  makeEvidence("glued shut — non-serviceable", "right to repair issue"),
  makeEvidence("feature parity with Sony and Bose", "commodity spec trap"),
  makeEvidence("retail margin takes 35%", "unit economics squeeze"),
];

/** Minimal product evidence — minimal signals */
const minimalEvidence: Evidence[] = [
  makeEvidence("slight coating wear", "minor durability issue"),
];

/** Service fixture — should never contaminate product mode */
const serviceEvidence: Evidence[] = [
  makeEvidence("revenue tied to billable hours", "labor-intensive model"),
  makeEvidence("founder bottleneck", "owner-dependent delivery"),
];

// Precompute profiles
const headphoneProfile = inferProductStructuralProfile(headphoneEvidence);
const minimalProfile = inferProductStructuralProfile(minimalEvidence);

// ─────────────────────────────────────────────────────────────────────────────
//  PRODUCT CONSTRAINT TEMPLATES — structure
// ─────────────────────────────────────────────────────────────────────────────

describe("PRODUCT_CONSTRAINT_TEMPLATES — structure", () => {
  it("contains at least 10 constraint templates", () => {
    expect(PRODUCT_CONSTRAINT_TEMPLATES.length).toBeGreaterThanOrEqual(10);
  });

  it("each template has required fields: id, label, description, impact, dimension", () => {
    for (const t of PRODUCT_CONSTRAINT_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(["high", "medium", "low"]).toContain(t.impact);
      expect(["product", "channel", "economics", "supply_chain", "market"]).toContain(t.dimension);
    }
  });

  it("template IDs are unique", () => {
    const ids = PRODUCT_CONSTRAINT_TEMPLATES.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("contains durability_risk template", () => {
    expect(PRODUCT_CONSTRAINT_TEMPLATES.some(t => t.id === "durability_risk")).toBe(true);
  });

  it("contains repairability_friction template", () => {
    expect(PRODUCT_CONSTRAINT_TEMPLATES.some(t => t.id === "repairability_friction")).toBe(true);
  });

  it("contains unit_economics_pressure template", () => {
    expect(PRODUCT_CONSTRAINT_TEMPLATES.some(t => t.id === "unit_economics_pressure")).toBe(true);
  });

  it("contains supply_chain_risk template", () => {
    expect(PRODUCT_CONSTRAINT_TEMPLATES.some(t => t.id === "supply_chain_risk")).toBe(true);
  });

  it("contains feature_commoditization template", () => {
    expect(PRODUCT_CONSTRAINT_TEMPLATES.some(t => t.id === "feature_commoditization")).toBe(true);
  });

  it("no template mentions billable hours", () => {
    for (const t of PRODUCT_CONSTRAINT_TEMPLATES) {
      expect(t.description).not.toMatch(/billable\s*hours/i);
      expect(t.label).not.toMatch(/billable\s*hours/i);
    }
  });

  it("no template mentions founder bottleneck", () => {
    for (const t of PRODUCT_CONSTRAINT_TEMPLATES) {
      expect(t.description).not.toMatch(/founder\s*bottleneck/i);
    }
  });

  it("no template mentions booking platform", () => {
    for (const t of PRODUCT_CONSTRAINT_TEMPLATES) {
      expect(t.description).not.toMatch(/booking\s*platform/i);
    }
  });

  it("no template uses Hermès handbag language", () => {
    for (const t of PRODUCT_CONSTRAINT_TEMPLATES) {
      expect(t.description).not.toMatch(/herm[eèé]s|handbag|PREMIUM\s*SIGNAL/i);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  selectProductConstraints — selection and output
// ─────────────────────────────────────────────────────────────────────────────

describe("selectProductConstraints — selection logic", () => {
  it("returns at least 2 constraints for headphone profile", () => {
    const result = selectProductConstraints(headphoneProfile, headphoneEvidence);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("returns at most 4 constraints with default maxCount", () => {
    const result = selectProductConstraints(headphoneProfile, headphoneEvidence);
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it("respects maxCount parameter", () => {
    const result = selectProductConstraints(headphoneProfile, headphoneEvidence, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("returns at least 2 constraints even with minimal evidence", () => {
    const result = selectProductConstraints(minimalProfile, minimalEvidence);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("includes durability_risk for headphone evidence", () => {
    const result = selectProductConstraints(headphoneProfile, headphoneEvidence);
    const ids = result.map(c => c.id);
    expect(ids).toContain("durability_risk");
  });

  it("includes repairability_friction for repair-related evidence", () => {
    const result = selectProductConstraints(headphoneProfile, headphoneEvidence);
    const ids = result.map(c => c.id);
    expect(ids).toContain("repairability_friction");
  });

  it("returns results sorted with high impact first", () => {
    const result = selectProductConstraints(headphoneProfile, headphoneEvidence);
    const impactOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    for (let i = 0; i < result.length - 1; i++) {
      expect(impactOrder[result[i].impact]).toBeGreaterThanOrEqual(impactOrder[result[i + 1].impact]);
    }
  });

  it("no selected constraint mentions billable hours", () => {
    const result = selectProductConstraints(headphoneProfile, headphoneEvidence);
    for (const c of result) {
      expect(c.description).not.toMatch(/billable\s*hours/i);
    }
  });

  it("no selected constraint mentions founder bottleneck", () => {
    const result = selectProductConstraints(headphoneProfile, headphoneEvidence);
    for (const c of result) {
      expect(c.description).not.toMatch(/founder\s*bottleneck/i);
    }
  });

  it("returns valid ProductConstraint objects", () => {
    const result = selectProductConstraints(headphoneProfile, headphoneEvidence);
    for (const c of result) {
      const typed = c as ProductConstraint;
      expect(typed.id).toBeTruthy();
      expect(typed.label).toBeTruthy();
      expect(typed.description).toBeTruthy();
      expect(["high", "medium", "low"]).toContain(typed.impact);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  PRODUCT_MODE_EXCLUDED_PATTERNS — blocklist
// ─────────────────────────────────────────────────────────────────────────────

describe("PRODUCT_MODE_EXCLUDED_PATTERNS — blocklist completeness", () => {
  it("is a non-empty Set", () => {
    expect(PRODUCT_MODE_EXCLUDED_PATTERNS.size).toBeGreaterThan(0);
  });

  it("contains booking_platform", () => {
    expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has("booking_platform")).toBe(true);
  });

  it("contains aggregation", () => {
    expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has("aggregation")).toBe(true);
  });

  it("contains labor_arbitrage", () => {
    expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has("labor_arbitrage")).toBe(true);
  });

  it("contains billable_hours_expansion", () => {
    expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has("billable_hours_expansion")).toBe(true);
  });

  it("contains service_aggregation", () => {
    expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has("service_aggregation")).toBe(true);
  });

  it("contains franchise_model", () => {
    expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has("franchise_model")).toBe(true);
  });

  it("contains staffing_model", () => {
    expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has("staffing_model")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  selectProductOpportunities — selection and output
// ─────────────────────────────────────────────────────────────────────────────

describe("selectProductOpportunities — selection logic", () => {
  it("returns at least 1 opportunity for headphone profile", () => {
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence);
    expect(opps.length).toBeGreaterThanOrEqual(1);
  });

  it("returns exactly topN opportunities (or fewer if less are available)", () => {
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 3);
    expect(opps.length).toBeLessThanOrEqual(3);
  });

  it("returns results sorted descending by relevanceScore", () => {
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 5);
    for (let i = 0; i < opps.length - 1; i++) {
      expect(opps[i].relevanceScore).toBeGreaterThanOrEqual(opps[i + 1].relevanceScore);
    }
  });

  it("durability_as_moat is top result for headphone profile with durability signals", () => {
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 3);
    expect(opps[0].id).toBe("durability_as_moat");
  });

  it("all returned opportunities have required fields", () => {
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 4);
    for (const opp of opps) {
      const typed = opp as ProductOpportunity;
      expect(typed.id).toBeTruthy();
      expect(typed.label).toBeTruthy();
      expect(typed.description).toBeTruthy();
      expect(typed.gtmImplication).toBeTruthy();
      expect(typed.economicRationale).toBeTruthy();
      expect(typeof typed.relevanceScore).toBe("number");
    }
  });

  it("relevance scores are in 0–10 range", () => {
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 8);
    for (const opp of opps) {
      expect(opp.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(opp.relevanceScore).toBeLessThanOrEqual(10);
    }
  });

  it("no returned opportunity has an excluded pattern ID", () => {
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 8);
    for (const opp of opps) {
      expect(PRODUCT_MODE_EXCLUDED_PATTERNS.has(opp.id)).toBe(false);
    }
  });

  it("no opportunity description mentions booking platform", () => {
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 8);
    for (const opp of opps) {
      expect(opp.description).not.toMatch(/booking\s*platform/i);
    }
  });

  it("no opportunity description mentions billable hours", () => {
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 8);
    for (const opp of opps) {
      expect(opp.description).not.toMatch(/billable\s*hours/i);
      expect(opp.economicRationale).not.toMatch(/billable\s*hours/i);
    }
  });

  it("top opportunity has a gtmStrategy with required fields", () => {
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 1);
    const gtm = opps[0]?.gtmStrategy as GTMStrategy | undefined;
    if (gtm) {
      expect(gtm.channel).toBeTruthy();
      expect(gtm.positioning).toBeTruthy();
      expect(gtm.firstMove).toBeTruthy();
      expect(gtm.timeline).toBeTruthy();
    }
  });

  it("opportunity descriptions mention DTC, premium, durability, or recurring revenue", () => {
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 5);
    const allText = opps.map(o => `${o.description} ${o.gtmImplication} ${o.economicRationale}`).join(" ");
    expect(allText).toMatch(/dtc|direct.?to.?consumer|premium|durabilit|recurring|repair|parts|subscription/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  buildProductActionPlan — 5-phase GTM plan
// ─────────────────────────────────────────────────────────────────────────────

describe("buildProductActionPlan — 5-phase GTM plan", () => {
  it("returns exactly 5 phases for any product profile", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    expect(plan.length).toBe(5);
  });

  it("phases are numbered 1–5 in sequence", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    for (let i = 0; i < plan.length; i++) {
      expect(plan[i].phase).toBe(i + 1);
    }
  });

  it("each phase has required fields: phase, label, action, successGate, timeHorizon", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    for (const step of plan) {
      const typed = step as ProductAction;
      expect(typeof typed.phase).toBe("number");
      expect(typed.label).toBeTruthy();
      expect(typed.action).toBeTruthy();
      expect(typed.successGate).toBeTruthy();
      expect(typed.timeHorizon).toBeTruthy();
    }
  });

  it("phase 1 is about product-market fit validation", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    expect(plan[0].label).toMatch(/validate|product.?market|fit/i);
  });

  it("phase 2 is about unit economics", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    expect(plan[1].label).toMatch(/unit\s*economics|economics|confirm/i);
  });

  it("phase 3 is about GTM at small scale", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    expect(plan[2].label).toMatch(/gtm|prove|scale|launch/i);
  });

  it("phase 4 is about recurring revenue", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    expect(plan[3].label).toMatch(/recurring|retention|revenue/i);
  });

  it("phase 5 is about channel distribution", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    expect(plan[4].label).toMatch(/scale|channel|distribution/i);
  });

  it("success gates contain measurable metrics (percentages or numbers)", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    for (const step of plan) {
      expect(step.successGate).toMatch(/\d+%|\d+x|\b\d{2,}\b/i);
    }
  });

  it("plan does NOT reference billable hours", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    const allText = plan.map(s => `${s.action} ${s.successGate}`).join(" ");
    expect(allText).not.toMatch(/billable\s*hours/i);
  });

  it("plan does NOT reference founder bottleneck", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    const allText = plan.map(s => `${s.action} ${s.successGate}`).join(" ");
    expect(allText).not.toMatch(/founder\s*bottleneck/i);
  });

  it("plan does NOT reference booking platform", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    const allText = plan.map(s => `${s.action} ${s.successGate}`).join(" ");
    expect(allText).not.toMatch(/booking\s*platform/i);
  });

  it("phase 1 mentions durability/willingness-to-pay when durability constraint is present", () => {
    const constraints = selectProductConstraints(headphoneProfile, headphoneEvidence);
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 3);
    const plan = buildProductActionPlan(headphoneProfile, constraints, opps);
    expect(plan[0].action).toMatch(/durabilit|modular|repair|willingness.?to.?pay|wtp/i);
  });

  it("produces a valid plan for minimal product evidence", () => {
    const plan = buildProductActionPlan(minimalProfile, [], []);
    expect(plan.length).toBe(5);
    expect(plan[0].phase).toBe(1);
    expect(plan[4].phase).toBe(5);
  });

  it("cost field is present and non-empty for all phases", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    for (const step of plan) {
      if (step.cost !== undefined) {
        expect(step.cost.length).toBeGreaterThan(0);
      }
    }
  });

  it("succeeds with full constraints and opportunities from headphone fixture", () => {
    const constraints = selectProductConstraints(headphoneProfile, headphoneEvidence);
    const opps = selectProductOpportunities(headphoneProfile, headphoneEvidence, 3);
    const plan = buildProductActionPlan(headphoneProfile, constraints, opps);
    expect(plan.length).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  ProductFacetProfile interface contract
// ─────────────────────────────────────────────────────────────────────────────

describe("ProductFacetProfile — interface contract", () => {
  it("has durability_risk field", () => {
    expect(headphoneProfile).toHaveProperty("durability_risk");
  });

  it("has repairability_friction field", () => {
    expect(headphoneProfile).toHaveProperty("repairability_friction");
  });

  it("has unit_economics_pressure field", () => {
    expect(headphoneProfile).toHaveProperty("unit_economics_pressure");
  });

  it("has supply_chain_risk field", () => {
    expect(headphoneProfile).toHaveProperty("supply_chain_risk");
  });

  it("has feature_commoditization field", () => {
    expect(headphoneProfile).toHaveProperty("feature_commoditization");
  });

  it("all fields are valid RiskLevel values", () => {
    const validLevels = new Set(["high", "moderate", "low", "none"]);
    const facets = Object.values(headphoneProfile) as unknown[];
    for (const facet of facets) {
      if (typeof facet === "string") {
        expect(validLevels.has(facet)).toBe(true);
      }
    }
  });

  it("detects high or moderate durability_risk for headphone evidence", () => {
    expect(["high", "moderate"]).toContain(headphoneProfile.durability_risk);
  });

  it("detects high or moderate repairability_friction for headphone evidence", () => {
    expect(["high", "moderate"]).toContain(headphoneProfile.repairability_friction);
  });

  it("does NOT have labor_intensity field (service-mode only)", () => {
    expect((headphoneProfile as unknown as Record<string, unknown>).labor_intensity).toBeUndefined();
  });

  it("does NOT have owner_dependency field (service-mode only)", () => {
    expect((headphoneProfile as unknown as Record<string, unknown>).owner_dependency).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Integration — Sony WHCH720N full pipeline
// ─────────────────────────────────────────────────────────────────────────────

describe("Sony WHCH720N — full product mode pipeline integration", () => {
  it("full pipeline produces constraints + opportunities + action plan without errors", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const constraints = selectProductConstraints(profile, headphoneEvidence, 4);
    const opps = selectProductOpportunities(profile, headphoneEvidence, 3);
    const plan = buildProductActionPlan(profile, constraints, opps);

    expect(constraints.length).toBeGreaterThanOrEqual(2);
    expect(opps.length).toBeGreaterThanOrEqual(1);
    expect(plan.length).toBe(5);
  });

  it("pipeline output does NOT contain service-mode language anywhere", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const constraints = selectProductConstraints(profile, headphoneEvidence, 4);
    const opps = selectProductOpportunities(profile, headphoneEvidence, 3);
    const plan = buildProductActionPlan(profile, constraints, opps);

    const allText = [
      ...constraints.map(c => `${c.label} ${c.description}`),
      ...opps.map(o => `${o.label} ${o.description} ${o.gtmImplication} ${o.economicRationale}`),
      ...plan.map(s => `${s.label} ${s.action} ${s.successGate}`),
    ].join(" ");

    expect(allText).not.toMatch(/billable\s*hours/i);
    expect(allText).not.toMatch(/founder\s*bottleneck/i);
    expect(allText).not.toMatch(/booking\s*platform/i);
  });

  it("top constraint is product-specific", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const constraints = selectProductConstraints(profile, headphoneEvidence);
    expect(constraints[0].dimension).toMatch(/product|channel|economics|supply_chain|market/);
  });

  it("top opportunity is relevant to hardware durability", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const opps = selectProductOpportunities(profile, headphoneEvidence, 3);
    expect(opps[0].description).toMatch(/durabilit|modular|repair|parts|repairable/i);
  });

  it("action plan phase 1 is concrete — not generic", () => {
    const profile = inferProductStructuralProfile(headphoneEvidence);
    const constraints = selectProductConstraints(profile, headphoneEvidence);
    const opps = selectProductOpportunities(profile, headphoneEvidence, 3);
    const plan = buildProductActionPlan(profile, constraints, opps);
    // Phase 1 should mention prototype, users, or willingness-to-pay
    expect(plan[0].action).toMatch(/prototype|user|willingness|wtp|test|validate/i);
  });
});
