/**
 * Product Mode — Test Suite
 *
 * Verifies that the product-category-aware constraint and opportunity libraries
 * produce correct, deterministic output.
 *
 * Fixtures used:
 *   1. Sony WH-CH720N (over-ear headphones) — primary fixture
 *   2. Handmade leather wallet (apparel/accessories) — secondary fixture
 */

import { describe, it, expect } from "vitest";
import {
  PRODUCT_CONSTRAINT_TEMPLATES,
  selectProductConstraints,
} from "../productConstraints";
import {
  PRODUCT_OPPORTUNITY_TEMPLATES,
  PRODUCT_MODE_EXCLUDED_PATTERNS,
  selectProductOpportunities,
} from "../productOpportunities";
import { buildProductActionPlan } from "../productActionPlan";

// ═══════════════════════════════════════════════════════════════
//  SONY WH-CH720N HEADPHONES FIXTURE
// ═══════════════════════════════════════════════════════════════

const HEADPHONES_CATEGORY = "Sony WH-CH720N over-ear wireless headphones";

const HEADPHONES_EVIDENCE = [
  "The earcup foam is already flaking after 8 months of use — looks terrible.",
  "Headband snapped in half after 14 months. Sony refused warranty replacement.",
  "Can't replace the battery — glued shut, so the whole unit is disposable after 2 years.",
  "Sound quality is decent but so is every other $79 headphone. Nothing special.",
  "ANC is okay but the app crashes constantly on Android. Firmware update broke pairing.",
  "Returned mine because the clamping force gave me headaches after 30 minutes.",
  "These are so cheap-feeling compared to Sony's premium line. Price race to the bottom.",
  "Battery barely holds a charge after 18 months. Non-replaceable battery is a design flaw.",
  "Customer service told me to buy a new pair instead of honoring the warranty. Useless.",
  "27% of negative reviews on Amazon mention durability issues.",
  "6% of reviews mention irreparable design or glued construction.",
  "Chinese brands sell similar specs for $35. Hard to justify $109.",
];

// ─── Constraints ──────────────────────────────────────────────

describe("selectProductConstraints — Sony WH-CH720N headphones", () => {
  const result = selectProductConstraints(HEADPHONES_CATEGORY, HEADPHONES_EVIDENCE);

  it("selects durability_gap as a constraint", () => {
    const ids = result.map(r => r.constraint.id);
    expect(ids).toContain("durability_gap");
  });

  it("selects repairability_friction as a constraint", () => {
    const ids = result.map(r => r.constraint.id);
    expect(ids).toContain("repairability_friction");
  });

  it("selects battery_degradation as a constraint", () => {
    const ids = result.map(r => r.constraint.id);
    expect(ids).toContain("battery_degradation");
  });

  it("durability_gap constraint has high impact", () => {
    const durability = result.find(r => r.constraint.id === "durability_gap");
    expect(durability?.constraint.impact).toBe("high");
  });

  it("repairability_friction constraint has high impact", () => {
    const repair = result.find(r => r.constraint.id === "repairability_friction");
    expect(repair?.constraint.impact).toBe("high");
  });

  it("each selected constraint has at least one matched evidence item", () => {
    for (const r of result) {
      expect(r.matchedEvidence.length).toBeGreaterThan(0);
    }
  });

  it("does not select more than maxConstraints results (default 5)", () => {
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it("does NOT select service-mode constraints like billable hours or owner dependency", () => {
    const ids = result.map(r => r.constraint.id);
    expect(ids).not.toContain("labor_intensity");
    expect(ids).not.toContain("owner_dependency");
    expect(ids).not.toContain("manual_process");
    expect(ids).not.toContain("linear_scaling");
    expect(ids).not.toContain("skill_scarcity");
  });

  it("does NOT select constraints unrelated to the evidence", () => {
    // No supply chain evidence in the headphones fixture
    const supplyChain = result.find(r => r.constraint.id === "supply_chain_fragility");
    // supply chain fragility should not appear unless a keyword match exists
    if (supplyChain) {
      expect(supplyChain.matchedEvidence.length).toBeGreaterThan(0);
    }
  });

  it("result is ordered: high-impact constraints appear before medium-impact ones", () => {
    for (let i = 0; i < result.length - 1; i++) {
      const currentImpact = result[i].constraint.impact;
      const nextImpact = result[i + 1].constraint.impact;
      const impactOrder = { high: 3, medium: 2, low: 1 };
      expect(impactOrder[currentImpact]).toBeGreaterThanOrEqual(impactOrder[nextImpact]);
    }
  });
});

// ─── Opportunities ────────────────────────────────────────────

describe("selectProductOpportunities — Sony WH-CH720N headphones", () => {
  const constraints = selectProductConstraints(HEADPHONES_CATEGORY, HEADPHONES_EVIDENCE);
  const opportunities = selectProductOpportunities(HEADPHONES_CATEGORY, constraints);

  it("selects modular_design as an opportunity", () => {
    const ids = opportunities.map(o => o.id);
    expect(ids).toContain("modular_design");
  });

  it("selects parts_marketplace as an opportunity", () => {
    const ids = opportunities.map(o => o.id);
    expect(ids).toContain("parts_marketplace");
  });

  it("does NOT select booking_platform opportunity", () => {
    const ids = opportunities.map(o => o.id);
    expect(ids).not.toContain("booking_platform");
  });

  it("does NOT select aggregation opportunity", () => {
    const ids = opportunities.map(o => o.id);
    expect(ids).not.toContain("aggregation");
  });

  it("does NOT select stakeholder_monetization opportunity", () => {
    const ids = opportunities.map(o => o.id);
    expect(ids).not.toContain("stakeholder_monetization");
  });

  it("each opportunity has a non-empty GTM implication", () => {
    for (const opp of opportunities) {
      expect(opp.gtmImplication.length).toBeGreaterThan(0);
    }
  });

  it("each opportunity has a non-empty defensibility statement", () => {
    for (const opp of opportunities) {
      expect(opp.defensibility.length).toBeGreaterThan(0);
    }
  });

  it("each opportunity has a timeline to competition", () => {
    for (const opp of opportunities) {
      expect(opp.timelineToCompetition.length).toBeGreaterThan(0);
    }
  });

  it("does not return more than maxOpportunities (default 4)", () => {
    expect(opportunities.length).toBeLessThanOrEqual(4);
  });
});

// ─── Action Plan ──────────────────────────────────────────────

describe("buildProductActionPlan — Sony WH-CH720N headphones", () => {
  const constraints = selectProductConstraints(HEADPHONES_CATEGORY, HEADPHONES_EVIDENCE);
  const opportunities = selectProductOpportunities(HEADPHONES_CATEGORY, constraints);
  const actionPlan = buildProductActionPlan(HEADPHONES_CATEGORY, constraints, opportunities);

  it("returns exactly 5 phases", () => {
    expect(actionPlan.length).toBe(5);
  });

  it("phases are numbered 1 through 5", () => {
    const phaseNumbers = actionPlan.map(a => a.phase);
    expect(phaseNumbers).toEqual([1, 2, 3, 4, 5]);
  });

  it("each phase has a weekRange", () => {
    for (const phase of actionPlan) {
      expect(phase.weekRange).toMatch(/week/i);
    }
  });

  it("each phase has an estimatedCost", () => {
    for (const phase of actionPlan) {
      expect(phase.estimatedCost.length).toBeGreaterThan(0);
      expect(phase.estimatedCost).toMatch(/\$/);
    }
  });

  it("each phase has an estimatedTimeCommitment", () => {
    for (const phase of actionPlan) {
      expect(phase.estimatedTimeCommitment).toMatch(/hours?/i);
    }
  });

  it("each phase has binary success criteria (not vague goals)", () => {
    for (const phase of actionPlan) {
      expect(phase.successCriteria.length).toBeGreaterThan(0);
      // Each criterion must contain a numeric threshold (digit + % or ≥ or ≤ or a number)
      for (const criterion of phase.successCriteria) {
        const hasMeasurableThreshold = /[\d%≥≤<>]/.test(criterion);
        expect(hasMeasurableThreshold).toBe(true);
      }
    }
  });

  it("each phase has a failureFallback", () => {
    for (const phase of actionPlan) {
      expect(phase.failureFallback.length).toBeGreaterThan(0);
    }
  });

  it("each phase has a hypothesis", () => {
    for (const phase of actionPlan) {
      expect(phase.hypothesis.length).toBeGreaterThan(0);
    }
  });

  it("phase 1 starts at Week 1-2 (early validation, low cost)", () => {
    const phase1 = actionPlan[0];
    expect(phase1.weekRange).toMatch(/week 1/i);
    // Phase 1 should be inexpensive — under $5,000
    expect(phase1.estimatedCost).toBe("$500");
  });

  it("phase 5 is manufacturing (highest cost phase)", () => {
    const phase5 = actionPlan[4];
    // Phase 5 includes manufacturing and should be the most expensive
    expect(phase5.estimatedCost).toMatch(/\$[0-9,KkMm]/);
    expect(phase5.title.toLowerCase()).toMatch(/manufactur/);
  });
});

// ═══════════════════════════════════════════════════════════════
//  SECONDARY FIXTURE — Handmade leather wallet (apparel/accessories)
// ═══════════════════════════════════════════════════════════════

const WALLET_CATEGORY = "handmade leather bifold wallet";

const WALLET_EVIDENCE = [
  "The stitching came apart after 6 months. Expected better from a $45 wallet.",
  "Card slots are too tight, leather cracked around the edges after a year.",
  "There are hundreds of identical leather wallets on Etsy and Amazon. Nothing stands out.",
  "My previous wallet lasted 8 years. This one feels cheap and disposable.",
  "No care instructions included. The leather dried out and cracked.",
  "Price is competitive but so is everyone else's. I can't tell these apart.",
];

describe("selectProductConstraints — leather wallet", () => {
  const result = selectProductConstraints(WALLET_CATEGORY, WALLET_EVIDENCE);

  it("selects durability_gap for a wallet with stitching/cracking complaints", () => {
    const ids = result.map(r => r.constraint.id);
    expect(ids).toContain("durability_gap");
  });

  it("selects feature_commoditization for an undifferentiated wallet", () => {
    const ids = result.map(r => r.constraint.id);
    expect(ids).toContain("feature_commoditization");
  });

  it("does not return service-mode constraints", () => {
    const narratives = result.map(r => r.constraint.narrative.toLowerCase());
    for (const narrative of narratives) {
      expect(narrative).not.toContain("billable hours");
      expect(narrative).not.toContain("owner dependency");
    }
  });
});

describe("selectProductOpportunities — leather wallet", () => {
  const constraints = selectProductConstraints(WALLET_CATEGORY, WALLET_EVIDENCE);
  const opportunities = selectProductOpportunities(WALLET_CATEGORY, constraints);

  it("returns at least one opportunity", () => {
    expect(opportunities.length).toBeGreaterThan(0);
  });

  it("does NOT select any excluded patterns (booking platform, aggregation, etc.)", () => {
    const ids = opportunities.map(o => o.id);
    for (const excluded of PRODUCT_MODE_EXCLUDED_PATTERNS) {
      expect(ids).not.toContain(excluded);
    }
  });
});

describe("buildProductActionPlan — leather wallet", () => {
  const constraints = selectProductConstraints(WALLET_CATEGORY, WALLET_EVIDENCE);
  const opportunities = selectProductOpportunities(WALLET_CATEGORY, constraints);
  const actionPlan = buildProductActionPlan(WALLET_CATEGORY, constraints, opportunities);

  it("returns 5 phases", () => {
    expect(actionPlan.length).toBe(5);
  });

  it("each phase has estimated cost and time", () => {
    for (const phase of actionPlan) {
      expect(phase.estimatedCost).toMatch(/\$/);
      expect(phase.estimatedTimeCommitment).toMatch(/hours?/i);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
//  TEMPLATE LIBRARY INTEGRITY CHECKS
// ═══════════════════════════════════════════════════════════════

describe("PRODUCT_CONSTRAINT_TEMPLATES integrity", () => {
  it("all templates have unique IDs", () => {
    const ids = PRODUCT_CONSTRAINT_TEMPLATES.map(t => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all templates have at least one evidenceKeyword", () => {
    for (const template of PRODUCT_CONSTRAINT_TEMPLATES) {
      expect(template.evidenceKeywords.length).toBeGreaterThan(0);
    }
  });

  it("all templates have valid impact values", () => {
    const validImpacts = ["high", "medium", "low"];
    for (const template of PRODUCT_CONSTRAINT_TEMPLATES) {
      expect(validImpacts).toContain(template.impact);
    }
  });
});

describe("PRODUCT_OPPORTUNITY_TEMPLATES integrity", () => {
  it("all templates have unique IDs", () => {
    const ids = PRODUCT_OPPORTUNITY_TEMPLATES.map(t => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all templates have at least one precondition", () => {
    for (const template of PRODUCT_OPPORTUNITY_TEMPLATES) {
      expect(template.preconditions.length).toBeGreaterThan(0);
    }
  });

  it("no template ID matches an excluded pattern", () => {
    const ids = PRODUCT_OPPORTUNITY_TEMPLATES.map(t => t.id);
    for (const excluded of PRODUCT_MODE_EXCLUDED_PATTERNS) {
      expect(ids).not.toContain(excluded);
    }
  });

  it("all templates have non-empty GTM implication", () => {
    for (const template of PRODUCT_OPPORTUNITY_TEMPLATES) {
      expect(template.gtmImplication.length).toBeGreaterThan(0);
    }
  });

  it("all templates have non-empty defensibility statement", () => {
    for (const template of PRODUCT_OPPORTUNITY_TEMPLATES) {
      expect(template.defensibility.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
//  EDGE CASES
// ═══════════════════════════════════════════════════════════════

describe("selectProductConstraints — edge cases", () => {
  it("returns empty array when no evidence matches any keyword", () => {
    const result = selectProductConstraints(
      "mystery product",
      ["totally irrelevant sentence with no matching words"],
    );
    expect(result.length).toBe(0);
  });

  it("respects maxConstraints parameter", () => {
    const result = selectProductConstraints(HEADPHONES_CATEGORY, HEADPHONES_EVIDENCE, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("handles empty evidence array gracefully", () => {
    const result = selectProductConstraints("headphones", []);
    expect(result.length).toBe(0);
  });
});

describe("selectProductOpportunities — edge cases", () => {
  it("returns empty array when no constraints are selected", () => {
    const result = selectProductOpportunities("headphones", []);
    expect(result.length).toBe(0);
  });

  it("respects maxOpportunities parameter", () => {
    const constraints = selectProductConstraints(HEADPHONES_CATEGORY, HEADPHONES_EVIDENCE);
    const result = selectProductOpportunities(HEADPHONES_CATEGORY, constraints, 1);
    expect(result.length).toBeLessThanOrEqual(1);
  });
});
