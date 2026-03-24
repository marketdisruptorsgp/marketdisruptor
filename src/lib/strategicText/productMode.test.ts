/**
 * PRODUCT MODE STRATEGIC NARRATIVES — Test Suite
 *
 * Tests the product-mode constraint, opportunity, first-move, and action-plan
 * libraries using a Sony WHCH720N headphone market case.
 *
 * Acceptance criteria (§5.6):
 *   ✅ Constraints mention: differentiation, unit economics, retail margin,
 *      manufacturing moat, customer acquisition cost
 *   ✅ Opportunities mention: modularity, durability, premium positioning, DTC,
 *      vertical integration, recurring revenue
 *   ✅ First moves are concrete: prototype, willingness-to-pay, pre-order 500 units
 *   ✅ Action plan is sequential: PMF → unit economics → GTM → recurring → distribution
 *   ❌ No billable hours, founder bottleneck, or booking platform language
 *   ❌ No Hermès handbag or "PREMIUM SIGNAL" analogy for mass-market electronics
 */

import { describe, it, expect } from "vitest";
import {
  mapStructureToProductConstraint,
  findProductConstraintFromProfile,
} from "./productConstraints";
import {
  PRODUCT_OPPORTUNITY_PATTERNS,
  selectProductOpportunities,
} from "./productOpportunities";
import { generateProductFirstMove } from "./productFirstMoves";
import { buildProductActionPlan } from "./productActionPlan";
import {
  translateConstraintForMode,
  translateConstraintToBusinessLanguage,
  SERVICE_ONLY_CONSTRAINTS,
  PRODUCT_CONSTRAINT_LANGUAGE,
} from "@/lib/businessLanguage";
import type { StructuralProfile } from "@/lib/reconfiguration/structuralProfile";
import type { ConstraintCandidate } from "@/lib/constraintDetectionEngine";

// ─────────────────────────────────────────────────────────────────────────────
//  FIXTURES — Sony WHCH720N headphone market scenario
// ─────────────────────────────────────────────────────────────────────────────

function makeConstraint(name: string, explanation: string): ConstraintCandidate {
  return {
    constraintId: `C-TEST-${name.replace(/\W+/g, "_").toUpperCase()}`,
    constraintName: name,
    explanation,
    tier: 1,
    evidenceIds: ["ev-001", "ev-002"],
    facetBasis: ["pricing", "competition"],
    confidence: "strong",
  };
}

/** Headphone market profile: thin margin, intermediated distribution, transactional revenue */
const headphoneProfile: StructuralProfile = {
  supplyFragmentation: "moderate",
  marginStructure: "thin_margin",
  switchingCosts: "low",
  distributionControl: "intermediated",
  laborIntensity: "mixed",
  revenueModel: "transactional",
  customerConcentration: "diversified",
  assetUtilization: "moderate",
  regulatorySensitivity: "light",
  valueChainPosition: "application",
  ownerDependency: null,
  acquisitionComplexity: null,
  improvementRunway: null,
  etaActive: false,
  bindingConstraints: [
    makeConstraint(
      "Feature commoditization at $150–250",
      "Mid-range ANC headphones are spec-parity commoditized — Sony, Bose, Sennheiser all hit 30h battery, ANC, multipoint. Buyers see no differentiation.",
    ),
    makeConstraint(
      "Retail channel margin squeeze",
      "Retail takes 30–35% margin. With $65–80 COGS, gross margin per unit is $40–50. Insufficient for paid acquisition at scale.",
    ),
    makeConstraint(
      "Design imitation risk",
      "Any modular or premium design can be replicated by incumbents in 6–12 months. No hardware moat exists.",
    ),
  ],
  evidenceDepth: 8,
  evidenceCategories: ["user_complaint", "pricing", "competition", "market_structure"],
};

/** Minimal profile with no product constraints */
const serviceProfile: StructuralProfile = {
  supplyFragmentation: "atomized",
  marginStructure: "high_margin",
  switchingCosts: "high",
  distributionControl: "owned",
  laborIntensity: "labor_heavy",
  revenueModel: "project_based",
  customerConcentration: "concentrated",
  assetUtilization: "underutilized",
  regulatorySensitivity: "light",
  valueChainPosition: "end_service",
  ownerDependency: "owner_critical",
  acquisitionComplexity: null,
  improvementRunway: null,
  etaActive: false,
  bindingConstraints: [
    makeConstraint("Labor intensity", "Revenue is directly tied to billable hours — cannot scale without headcount"),
    makeConstraint("Owner dependency", "Business depends on founder for all client relationships"),
  ],
  evidenceDepth: 6,
  evidenceCategories: ["user_complaint", "operations"],
};

// ─────────────────────────────────────────────────────────────────────────────
//  §5.1 — Product Constraint Library
// ─────────────────────────────────────────────────────────────────────────────

describe("mapStructureToProductConstraint — §5.1 product constraint library", () => {
  it("maps feature commoditization pattern to differentiation ceiling", () => {
    const result = mapStructureToProductConstraint(headphoneProfile, "feature commoditization spec parity");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Differentiation ceiling in mass market");
    expect(result!.narrative).toMatch(/spec parity|differentiation|established players/i);
    expect(result!.narrative).toMatch(/Sony|Bose|Sennheiser/i);
  });

  it("maps retail margin squeeze pattern to unit economics pressure", () => {
    const result = mapStructureToProductConstraint(headphoneProfile, "retail margin squeeze channel margin");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Unit economics pressure");
    expect(result!.narrative).toMatch(/retail|30%|DTC|premium/i);
  });

  it("maps design imitation risk to manufacturing moat weakness", () => {
    const result = mapStructureToProductConstraint(headphoneProfile, "design imitation risk copycat");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Manufacturing moat is weak");
    expect(result!.narrative).toMatch(/copy|incumbents|6.12 months|brand|community/i);
  });

  it("maps customer acquisition cost to CAC efficiency constraint", () => {
    const result = mapStructureToProductConstraint(headphoneProfile, "channel acquisition cost CAC paid channel");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Customer acquisition efficiency");
    expect(result!.narrative).toMatch(/\$40.60|paid advertising|lifetime value|recurring/i);
  });

  it("maps hardware capital intensity to capital intensity constraint", () => {
    const result = mapStructureToProductConstraint(headphoneProfile, "capital intensity tooling inventory risk MOQ");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Capital intensity of hardware launch");
    expect(result!.narrative).toMatch(/tooling|pre-orders|manufacturing/i);
  });

  it("returns null for patterns with no product-specific mapping", () => {
    const result = mapStructureToProductConstraint(headphoneProfile, "completely unrelated unknown pattern");
    expect(result).toBeNull();
  });

  it("findProductConstraintFromProfile picks up differentiation constraint from binding constraints", () => {
    const result = findProductConstraintFromProfile(headphoneProfile);
    expect(result).not.toBeNull();
    // Should match the first constraint (feature commoditization)
    expect(result!.label).toBe("Differentiation ceiling in mass market");
  });

  it("narratives do NOT contain billable hours or founder bottleneck language", () => {
    const patterns = [
      "feature commoditization spec parity",
      "retail margin squeeze channel margin",
      "design imitation risk copycat",
      "channel acquisition cost CAC",
      "capital intensity tooling",
    ];
    for (const pattern of patterns) {
      const result = mapStructureToProductConstraint(headphoneProfile, pattern);
      if (result) {
        expect(result.narrative).not.toMatch(/billable hours/i);
        expect(result.narrative).not.toMatch(/founder bottleneck|you'?re the bottleneck/i);
        expect(result.narrative).not.toMatch(/booking platform/i);
        expect(result.narrative).not.toMatch(/Hermès|hermes/i);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  §5.2 — Product Opportunity Library
// ─────────────────────────────────────────────────────────────────────────────

describe("PRODUCT_OPPORTUNITY_PATTERNS — §5.2 product opportunity library", () => {
  it("contains the 5 required product opportunity archetypes", () => {
    const ids = PRODUCT_OPPORTUNITY_PATTERNS.map(p => p.id);
    expect(ids).toContain("durability_as_moat");
    expect(ids).toContain("vertical_integration_experience");
    expect(ids).toContain("subscription_hardware_model");
    expect(ids).toContain("premium_community_moat");
    expect(ids).toContain("dtc_premium_channel");
  });

  it("all patterns have required fields: id, name, description, rationale, gtm, risk, aiPromptHint, relevance", () => {
    for (const p of PRODUCT_OPPORTUNITY_PATTERNS) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.rationale).toBeTruthy();
      expect(p.gtm).toBeTruthy();
      expect(p.risk).toBeTruthy();
      expect(p.aiPromptHint).toBeTruthy();
      expect(typeof p.relevance).toBe("function");
    }
  });

  it("all relevance functions return scores in 0–10 range", () => {
    for (const pattern of PRODUCT_OPPORTUNITY_PATTERNS) {
      const score = pattern.relevance(headphoneProfile);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(10);
    }
  });

  it("durability_as_moat scores higher for profiles with durability binding constraints", () => {
    const durabilityProfile: StructuralProfile = {
      ...headphoneProfile,
      bindingConstraints: [
        makeConstraint("Earcup failure", "earcups crack and fail after 6 months — #1 warranty claim"),
      ],
    };
    const noFailureProfile: StructuralProfile = {
      ...headphoneProfile,
      bindingConstraints: [],
    };
    const p = PRODUCT_OPPORTUNITY_PATTERNS.find(p => p.id === "durability_as_moat")!;
    expect(p.relevance(durabilityProfile)).toBeGreaterThan(p.relevance(noFailureProfile));
    expect(p.relevance(durabilityProfile)).toBeGreaterThanOrEqual(8);
  });

  it("dtc_premium_channel scores higher for intermediated distribution profiles", () => {
    const intermediated: StructuralProfile = { ...headphoneProfile, distributionControl: "intermediated" };
    const owned: StructuralProfile = { ...headphoneProfile, distributionControl: "owned", bindingConstraints: [] };
    const p = PRODUCT_OPPORTUNITY_PATTERNS.find(p => p.id === "dtc_premium_channel")!;
    expect(p.relevance(intermediated)).toBeGreaterThan(p.relevance(owned));
  });

  it("subscription_hardware_model scores higher for transactional revenue profiles", () => {
    const transactional: StructuralProfile = { ...headphoneProfile, revenueModel: "transactional" };
    const recurring: StructuralProfile = { ...headphoneProfile, revenueModel: "recurring", bindingConstraints: [] };
    const p = PRODUCT_OPPORTUNITY_PATTERNS.find(p => p.id === "subscription_hardware_model")!;
    expect(p.relevance(transactional)).toBeGreaterThan(p.relevance(recurring));
  });

  it("selectProductOpportunities returns top N by relevance for headphone profile", () => {
    const opps = selectProductOpportunities(headphoneProfile, 3);
    expect(opps.length).toBeLessThanOrEqual(3);
    // Should be sorted descending by relevance score
    for (let i = 0; i < opps.length - 1; i++) {
      expect(opps[i].relevanceScore).toBeGreaterThanOrEqual(opps[i + 1].relevanceScore);
    }
    // For headphone profile with thin margin + intermediated distribution + transactional revenue,
    // dtc_premium_channel and subscription_hardware_model should be in top 3
    const ids = opps.map(o => o.pattern.id);
    expect(ids.some(id => ["dtc_premium_channel", "subscription_hardware_model", "durability_as_moat"].includes(id))).toBe(true);
  });

  it("opportunity descriptions mention DTC, premium, durability, or recurring revenue — not booking platforms", () => {
    for (const p of PRODUCT_OPPORTUNITY_PATTERNS) {
      expect(p.description).not.toMatch(/booking platform|multi-sided marketplace|aggregat.*supplier/i);
      expect(p.gtm).not.toMatch(/booking platform/i);
    }
    const allText = PRODUCT_OPPORTUNITY_PATTERNS.map(p => [p.description, p.rationale, p.gtm, p.risk].join(" ")).join(" ");
    expect(allText).toMatch(/DTC|direct.to.consumer|premium|durability|modular|recurring/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  §5.3 — Product First Move Planner
// ─────────────────────────────────────────────────────────────────────────────

describe("generateProductFirstMove — §5.3 product first move planner", () => {
  it("durability_as_moat generates a prototype + willingness-to-pay first move", () => {
    const fm = generateProductFirstMove("durability_as_moat", headphoneProfile);
    expect(fm.action).toMatch(/prototype|modular|repairable|earcup/i);
    expect(fm.action).toMatch(/willingness.to.pay|repairability|premium/i);
    expect(fm.timeline).toBeTruthy();
    expect(fm.successCriteria.length).toBeGreaterThan(0);
    expect(fm.successCriteria.join(" ")).toMatch(/\d+%|premium|users/i);
  });

  it("subscription_hardware_model generates a pre-order campaign first move", () => {
    const fm = generateProductFirstMove("subscription_hardware_model", headphoneProfile);
    expect(fm.action).toMatch(/pre.order|500 units|marketplace|parts/i);
    expect(fm.successCriteria.join(" ")).toMatch(/conversion|NPS|parts|purchase/i);
  });

  it("vertical_integration_experience generates a subscription MVP first move", () => {
    const fm = generateProductFirstMove("vertical_integration_experience", headphoneProfile);
    expect(fm.action).toMatch(/calibration|subscription|\$5|50 users|app/i);
    expect(fm.successCriteria.join(" ")).toMatch(/retention|beta|perceived/i);
  });

  it("premium_community_moat generates a blind listening test first move", () => {
    const fm = generateProductFirstMove("premium_community_moat", headphoneProfile);
    expect(fm.action).toMatch(/blind|listening test|audio enthusiast|willingness.to.pay|\$350/i);
  });

  it("dtc_premium_channel generates a DTC pre-order first move", () => {
    const fm = generateProductFirstMove("dtc_premium_channel", headphoneProfile);
    expect(fm.action).toMatch(/DTC|pre.order|landing page/i);
    expect(fm.successCriteria.join(" ")).toMatch(/conversion|NPS/i);
  });

  it("first moves are concrete — not generic 'interview 20 suppliers'", () => {
    const patternIds = ["durability_as_moat", "subscription_hardware_model", "vertical_integration_experience", "premium_community_moat", "dtc_premium_channel"];
    for (const id of patternIds) {
      const fm = generateProductFirstMove(id, headphoneProfile);
      // Should not contain generic "interview N suppliers" language
      expect(fm.action).not.toMatch(/interview.*suppliers/i);
      // Should contain concrete product-market actions
      expect(fm.action.length).toBeGreaterThan(50);
    }
  });

  it("all first moves have required fields: action, learningObjective, timeframe, timeline, successCriteria, risks", () => {
    const patternIds = ["durability_as_moat", "subscription_hardware_model", "vertical_integration_experience", "premium_community_moat", "dtc_premium_channel", "unknown_pattern"];
    for (const id of patternIds) {
      const fm = generateProductFirstMove(id, headphoneProfile);
      expect(fm.action).toBeTruthy();
      expect(fm.learningObjective).toBeTruthy();
      expect(fm.timeframe).toBeTruthy();
      expect(fm.timeline).toBeTruthy();
      expect(Array.isArray(fm.successCriteria)).toBe(true);
      expect(fm.successCriteria.length).toBeGreaterThan(0);
      expect(Array.isArray(fm.risks)).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  §5.4 — Product Action Plan Builder
// ─────────────────────────────────────────────────────────────────────────────

describe("buildProductActionPlan — §5.4 product action plan", () => {
  it("returns exactly 5 steps for any profile", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    expect(plan.length).toBe(5);
  });

  it("steps are numbered 1–5 in sequence", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    plan.forEach((item, i) => {
      expect(item.sequence).toBe(i + 1);
    });
  });

  it("plan follows product-market sequence: PMF → unit economics → GTM → recurring → distribution", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    // Step 1: validate PMF
    expect(plan[0].action).toMatch(/prototype|differentiat|willingness.to.pay|test|customer/i);
    expect(plan[0].horizon).toMatch(/week.*1.4|weeks? 1/i);
    // Step 2: unit economics
    expect(plan[1].action).toMatch(/unit economics|COGS|margin|ASP|manufactur/i);
    expect(plan[1].horizon).toMatch(/week.*5.8|weeks? 5/i);
    // Step 3: GTM
    expect(plan[2].action).toMatch(/DTC|pre.order|small batch|launch|100.500/i);
    // Step 4: recurring revenue
    expect(plan[3].action).toMatch(/recurring|parts|subscription|marketplace|retention/i);
    // Step 5: channel scale
    expect(plan[4].action).toMatch(/retail|channel|partners|premium retail|distribution/i);
  });

  it("each step has a non-empty successGate and rationale", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    for (const item of plan) {
      expect(item.successGate).toBeTruthy();
      expect(item.rationale).toBeTruthy();
    }
  });

  it("plan success gates reference measurable metrics", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    const allGates = plan.map(p => p.successGate).join(" ");
    // Should contain percentage thresholds, NPS, or conversion rate metrics
    expect(allGates).toMatch(/\d+%|NPS|conversion|gross margin/i);
  });

  it("action plan does NOT reference billable hours, owner bottleneck, or booking platforms", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    const allText = plan.map(p => [p.action, p.rationale, p.successGate].join(" ")).join(" ");
    expect(allText).not.toMatch(/billable hours/i);
    expect(allText).not.toMatch(/you'?re the bottleneck|founder bottleneck/i);
    expect(allText).not.toMatch(/booking platform/i);
    expect(allText).not.toMatch(/Hermès|hermes/i);
    expect(allText).not.toMatch(/PREMIUM SIGNAL/i);
  });

  it("step 1 mentions durability/willingness-to-pay when durability constraint is present", () => {
    const durabilityHeadphones: StructuralProfile = {
      ...headphoneProfile,
      bindingConstraints: [
        makeConstraint("Earcup durability failure", "earcups crack and fail after 6 months of use"),
      ],
    };
    const plan = buildProductActionPlan(durabilityHeadphones);
    expect(plan[0].action).toMatch(/durabilit|modular|repair/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  §5.5 — businessLanguage.ts mode-aware translation
// ─────────────────────────────────────────────────────────────────────────────

describe("translateConstraintForMode — §5.5 mode-aware language", () => {
  it("returns null for service-only constraints in product mode", () => {
    for (const constraint of SERVICE_ONLY_CONSTRAINTS) {
      const result = translateConstraintForMode(constraint, "product");
      expect(result).toBeNull();
    }
  });

  it("suppresses labor_intensity in product mode", () => {
    expect(translateConstraintForMode("labor_intensity", "product")).toBeNull();
  });

  it("suppresses owner_dependency in product mode", () => {
    expect(translateConstraintForMode("owner_dependency", "product")).toBeNull();
  });

  it("does NOT suppress labor_intensity in service mode", () => {
    const result = translateConstraintForMode("labor_intensity", "service");
    expect(result).not.toBeNull();
    expect(result).toMatch(/billable hours/i);
  });

  it("uses product-specific language for commoditized_pricing in product mode", () => {
    const result = translateConstraintForMode("commoditized_pricing", "product");
    expect(result).not.toBeNull();
    // Product language should NOT be the service-business version
    expect(result).not.toMatch(/you'?re competing on price and losing ground/i);
    expect(result).toMatch(/spec parity|differentiation|established players/i);
  });

  it("uses product-specific language for channel_dependency in product mode", () => {
    const result = translateConstraintForMode("channel_dependency", "product");
    expect(result).not.toBeNull();
    expect(result).toMatch(/DTC|retail|30.40%|direct customer/i);
  });

  it("falls back to generic language for unknown constraints in product mode", () => {
    const result = translateConstraintForMode("completely_unknown_constraint", "product");
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
  });

  it("uses generic language in service mode (no product overrides)", () => {
    // In service mode, commoditized_pricing should use the original service language
    const result = translateConstraintForMode("commoditized_pricing", "service");
    expect(result).toMatch(/competing on price|interchangeable/i);
  });

  it("PRODUCT_CONSTRAINT_LANGUAGE contains product-specific overrides", () => {
    expect(typeof PRODUCT_CONSTRAINT_LANGUAGE.commoditized_pricing).toBe("string");
    expect(typeof PRODUCT_CONSTRAINT_LANGUAGE.channel_dependency).toBe("string");
    expect(typeof PRODUCT_CONSTRAINT_LANGUAGE.margin_compression).toBe("string");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  INTEGRATION — Sony WHCH720N headphone market fixture
// ─────────────────────────────────────────────────────────────────────────────

describe("Sony WHCH720N product mode fixture — integration", () => {
  it("constraint library identifies product-market relevant constraints from headphone profile", () => {
    const constraint = findProductConstraintFromProfile(headphoneProfile);
    expect(constraint).not.toBeNull();
    // Should be about differentiation or retail margin (first two binding constraints)
    expect(constraint!.label).toMatch(/differentiation|unit economics/i);
    expect(constraint!.narrative).not.toMatch(/billable hours|founder/i);
  });

  it("opportunity library selects product-market relevant opportunities for headphone profile", () => {
    const opps = selectProductOpportunities(headphoneProfile, 5);
    expect(opps.length).toBe(5);
    const ids = opps.map(o => o.pattern.id);
    // At least one of the product-specific opportunities should be highly ranked
    const productRelevantIds = ["dtc_premium_channel", "subscription_hardware_model", "durability_as_moat"];
    expect(ids.some(id => productRelevantIds.includes(id))).toBe(true);
  });

  it("first move for top opportunity is concrete and product-market specific", () => {
    const topOpp = selectProductOpportunities(headphoneProfile, 1)[0];
    const fm = generateProductFirstMove(topOpp.pattern.id, headphoneProfile);
    // Should not be a generic supplier interview
    expect(fm.action).not.toMatch(/interview.*supplier/i);
    // Should reference a concrete product action
    expect(fm.action.length).toBeGreaterThan(80);
  });

  it("action plan for headphone profile is product-market specific and sequential", () => {
    const plan = buildProductActionPlan(headphoneProfile);
    expect(plan.length).toBe(5);
    // Step 1 mentions commodity/differentiation context (the #1 binding constraint)
    const step1Text = plan[0].action + " " + plan[0].rationale;
    expect(step1Text).toMatch(/differentiat|willingness.to.pay|prototype|premium/i);
    // Step 3 mentions DTC or small batch launch
    expect(plan[2].action).toMatch(/DTC|pre.order|launch|batch/i);
    // Step 4 mentions recurring revenue
    expect(plan[3].action).toMatch(/recurring|parts|subscription/i);
    // No wrong-mode language anywhere in the plan
    const fullPlanText = plan.map(p => [p.action, p.rationale, p.successGate].join(" ")).join(" ");
    expect(fullPlanText).not.toMatch(/billable hours|you'?re the bottleneck|booking platform|Hermès/i);
  });

  it("service-mode constraints are completely suppressed for headphone profile", () => {
    const serviceConstraintIds = Array.from(SERVICE_ONLY_CONSTRAINTS);
    for (const id of serviceConstraintIds) {
      expect(translateConstraintForMode(id, "product")).toBeNull();
    }
  });
});
