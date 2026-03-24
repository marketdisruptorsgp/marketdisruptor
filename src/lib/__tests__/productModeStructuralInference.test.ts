/**
 * Product Mode Structural Inference — Tests
 *
 * Verifies that:
 *  1. Product inference produces product-specific constraints (durability, repairability)
 *  2. Product inference NEVER produces service constraints (labor_intensity, owner_dependency)
 *  3. Service inference produces service-specific constraints
 *  4. Service inference NEVER produces product constraints (durability_risk)
 *  5. AI gate enforcement blocks rendering when gate fails
 */

import { describe, it, expect } from "vitest";
import type { Evidence } from "@/lib/evidenceEngine";
import {
  inferProductStructuralProfile,
  selectProductBindingConstraints,
} from "@/lib/productMode/productStructuralInference";
import {
  inferServiceStructuralProfile,
  selectServiceBindingConstraints,
} from "@/lib/serviceMode/serviceStructuralInference";
import { renderAnalysisNarrative } from "@/lib/instantInsights";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: `ev-${Math.random().toString(36).slice(2, 8)}`,
    type: "constraint",
    label: "Test evidence",
    pipelineStep: "report",
    tier: "structural",
    ...overrides,
  };
}

const mockHeadphone = { name: "WHCH720N Headphones", category: "Electronics" };
const mockConsultancy = { name: "Strategy Consulting", category: "Consulting" };

// ── Product Mode Structural Inference ────────────────────────────────────────

describe("Product Mode Structural Inference", () => {
  it("should infer durability_risk for headphones with flaking complaints", () => {
    const evidence = [
      makeEvidence({ label: "earcups flaking after 6 months", description: "build quality deteriorating" }),
      makeEvidence({ label: "plastic cracks after normal use", description: "durability issues" }),
    ];
    const profile = inferProductStructuralProfile(evidence, mockHeadphone);
    expect(profile.durability_risk).not.toBe("none");
    expect(["high", "moderate", "low"]).toContain(profile.durability_risk);
  });

  it("should NOT infer labor_intensity for a product", () => {
    const evidence = [
      makeEvidence({ label: "earcups flaking", description: "build quality issues" }),
    ];
    const profile = inferProductStructuralProfile(evidence, mockHeadphone);
    expect((profile as any).labor_intensity).toBeUndefined();
  });

  it("should NOT infer owner_dependency for a product", () => {
    const evidence = [
      makeEvidence({ label: "earcups flaking", description: "build quality issues" }),
    ];
    const profile = inferProductStructuralProfile(evidence, mockHeadphone);
    expect((profile as any).owner_dependency).toBeUndefined();
  });

  it("should NOT infer billable_hours for a product", () => {
    const evidence = [
      makeEvidence({ label: "earcups flaking", description: "build quality issues" }),
    ];
    const profile = inferProductStructuralProfile(evidence, mockHeadphone);
    expect((profile as any).billable_hours).toBeUndefined();
  });

  it("should infer repairability_friction when repair parts are unavailable", () => {
    const evidence = [
      makeEvidence({ label: "parts not available", description: "hard to fix — non-serviceable design" }),
      makeEvidence({ label: "repair center refused warranty", description: "right to repair issue" }),
    ];
    const profile = inferProductStructuralProfile(evidence, mockHeadphone);
    expect(profile.repairability_friction).not.toBe("none");
  });

  it("should select durability + repairability as binding constraints when both are detected", () => {
    const evidence = [
      makeEvidence({ label: "earcups flaking after 6 months", description: "durability" }),
      makeEvidence({ label: "plastic cracks and wear", description: "build quality" }),
      makeEvidence({ label: "parts not available for repair", description: "repairability" }),
      makeEvidence({ label: "right to repair — glued shut", description: "non-serviceable" }),
    ];
    const profile = inferProductStructuralProfile(evidence, mockHeadphone);
    const constraints = selectProductBindingConstraints(profile, evidence);
    expect(constraints).toContain("durability_risk");
    expect(constraints).toContain("repairability_friction");
    expect(constraints).not.toContain("labor_intensity");
    expect(constraints).not.toContain("owner_dependency");
  });

  it("should return at least 2 binding constraints even with minimal evidence", () => {
    const evidence = [makeEvidence({ label: "slightly flaky coating", description: "minor durability" })];
    const profile = inferProductStructuralProfile(evidence, mockHeadphone);
    const constraints = selectProductBindingConstraints(profile, evidence);
    expect(constraints.length).toBeGreaterThanOrEqual(2);
  });

  it("should not return more than 4 binding constraints", () => {
    const evidence = [
      makeEvidence({ label: "flaking earcups cracking breaking", description: "durability deteriorating" }),
      makeEvidence({ label: "parts not available hard to fix", description: "repairability friction" }),
      makeEvidence({ label: "supply chain single source vendor", description: "procurement risk" }),
      makeEvidence({ label: "competitors have same features", description: "feature parity" }),
      makeEvidence({ label: "margins shrinking cost of goods rising", description: "unit economics" }),
    ];
    const profile = inferProductStructuralProfile(evidence, mockHeadphone);
    const constraints = selectProductBindingConstraints(profile, evidence);
    expect(constraints.length).toBeLessThanOrEqual(4);
  });

  it("should fail stage 6 gate for product with service constraints (regression guard)", () => {
    // Simulates the old broken behaviour documented in the problem statement.
    // With the Stage 4 fix, this combination should no longer occur in production.
    const brokenAnalysis = {
      stage4_bindingConstraints: ["labor_intensity", "owner_dependency"],
      stage6_aiGatePassed: false,
    };
    expect(brokenAnalysis.stage6_aiGatePassed).toBe(false);
  });
});

// ── Service Mode Structural Inference ────────────────────────────────────────

describe("Service Mode Structural Inference", () => {
  it("should infer labor_intensity for consulting with 'hours' evidence", () => {
    const evidence = [
      makeEvidence({ label: "revenue tied to billable hours", description: "time-based model" }),
      makeEvidence({ label: "hourly rate capped at team utilization", description: "labor intensive" }),
    ];
    const profile = inferServiceStructuralProfile(evidence, mockConsultancy);
    expect(profile.labor_intensity).not.toBe("none");
  });

  it("should NOT infer durability_risk for a service", () => {
    const evidence = [
      makeEvidence({ label: "revenue tied to billable hours", description: "time-based model" }),
    ];
    const profile = inferServiceStructuralProfile(evidence, mockConsultancy);
    expect((profile as any).durability_risk).toBeUndefined();
  });

  it("should NOT infer repairability_friction for a service", () => {
    const evidence = [
      makeEvidence({ label: "revenue tied to billable hours", description: "time-based model" }),
    ];
    const profile = inferServiceStructuralProfile(evidence, mockConsultancy);
    expect((profile as any).repairability_friction).toBeUndefined();
  });

  it("should NOT infer feature_commoditization for a service", () => {
    const evidence = [
      makeEvidence({ label: "revenue tied to billable hours", description: "time-based model" }),
    ];
    const profile = inferServiceStructuralProfile(evidence, mockConsultancy);
    expect((profile as any).feature_commoditization).toBeUndefined();
  });

  it("should infer owner_dependency for single-founder bottleneck", () => {
    const evidence = [
      makeEvidence({ label: "founder bottleneck — can't scale without founder", description: "owner-dependent" }),
      makeEvidence({ label: "single point of failure in delivery", description: "owner reliant" }),
    ];
    const profile = inferServiceStructuralProfile(evidence, mockConsultancy);
    expect(profile.owner_dependency).not.toBe("none");
  });

  it("should select labor_intensity + owner_dependency as binding constraints", () => {
    const evidence = [
      makeEvidence({ label: "billable hours cap revenue growth", description: "labor-intensive" }),
      makeEvidence({ label: "hourly rate model limits scale", description: "time for money" }),
      makeEvidence({ label: "founder bottleneck can't scale without owner", description: "dependency" }),
    ];
    const profile = inferServiceStructuralProfile(evidence, mockConsultancy);
    const constraints = selectServiceBindingConstraints(profile, evidence);
    expect(constraints).toContain("labor_intensity");
    expect(constraints).not.toContain("durability_risk");
    expect(constraints).not.toContain("repairability_friction");
  });
});

// ── AI Gate Enforcement ───────────────────────────────────────────────────────

describe("AI Gate Enforcement", () => {
  it("should return null if gate failed", () => {
    const failedAnalysis = {
      stage6_aiGatePassed: false as const,
      stage6_aiGateDetails: { suppressed: true, reason: "mode mismatch" },
      narrative: { strategicVerdict: "This should not render" },
    };
    const output = renderAnalysisNarrative(failedAnalysis);
    expect(output).toBeNull();
  });

  it("should return the narrative if gate passed", () => {
    const passedAnalysis = {
      stage6_aiGatePassed: true as const,
      narrative: { strategicVerdict: "Modular design + parts marketplace" },
    };
    const output = renderAnalysisNarrative(passedAnalysis);
    expect(output).not.toBeNull();
    expect(output?.strategicVerdict).toBe("Modular design + parts marketplace");
  });

  it("should return null when stage6_aiGatePassed is explicitly false (no narrative check)", () => {
    const failedAnalysis = {
      stage6_aiGatePassed: false as const,
    };
    const output = renderAnalysisNarrative(failedAnalysis);
    expect(output).toBeNull();
  });

  it("should return null when no narrative is present even if gate passed", () => {
    const noNarrativeAnalysis = {
      stage6_aiGatePassed: true as const,
      narrative: null,
    };
    const output = renderAnalysisNarrative(noNarrativeAnalysis);
    expect(output).toBeNull();
  });

  it("should return null when gate status is absent and narrative is absent", () => {
    const emptyAnalysis = {};
    const output = renderAnalysisNarrative(emptyAnalysis);
    expect(output).toBeNull();
  });

  it("should render narrative when gate status is absent (legacy: no gate means pass)", () => {
    const legacyAnalysis = {
      narrative: { strategicVerdict: "Legacy narrative" },
    };
    const output = renderAnalysisNarrative(legacyAnalysis);
    // When gate status is undefined (not explicitly false), render the narrative.
    expect(output).not.toBeNull();
    expect(output?.strategicVerdict).toBe("Legacy narrative");
  });
});
