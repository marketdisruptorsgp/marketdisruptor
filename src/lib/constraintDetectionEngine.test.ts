import { describe, it, expect } from "vitest";
import type { ConstraintHypothesis } from "@/lib/constraintDetectionEngine";
import {
  identifyBindingConstraintDataDriven,
  detectConstraintHypotheses,
  CONSTRAINT_TAXONOMY,
} from "@/lib/constraintDetectionEngine";
import type { Evidence } from "@/lib/evidenceEngine";

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

function makeHypothesis(
  overrides: Partial<ConstraintHypothesis> & { constraintName: string }
): ConstraintHypothesis {
  const def = CONSTRAINT_TAXONOMY.find(c => c.name === overrides.constraintName);
  return {
    constraintId: def?.id ?? "C-TEST-01",
    constraintName: overrides.constraintName,
    definition: def ?? {
      id: "C-TEST-01",
      name: overrides.constraintName,
      category: "labor_operations",
      description: "",
      defaultTier: 2,
    },
    tier: def?.defaultTier ?? 2,
    evidenceIds: ["ev-001"],
    facetBasis: [],
    confidence: "strong",
    explanation: "Detected via test fixture",
    counterfactualImpact: 5,
    counterfactualExplanation: "Removing this constraint would free 5 evidence items",
    stackRole: "binding",
    confidenceInterval: { point: 0.7, lower: 0.55, upper: 0.85 },
    rankingFactors: { evidenceDensity: 0.5, evidenceQuality: 0.8, networkCentrality: 0.4 },
    ...overrides,
  } as ConstraintHypothesis;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("identifyBindingConstraintDataDriven", () => {
  it("returns null binding constraint when hypothesis set is empty", () => {
    const result = identifyBindingConstraintDataDriven({
      hypotheses: [],
      totalCandidates: 0,
      evidenceGaps: [],
      evidenceRequests: [],
      bindingUncertain: false,
      stackSummary: "No constraints detected",
    });

    expect(result.bindingConstraint).toBeNull();
    expect(result.scores).toHaveLength(0);
    expect(result.highConfidence).toBe(false);
    expect(result.selectionRationale).toMatch(/no constraint/i);
  });

  it("selects the single hypothesis as binding when only one exists", () => {
    const h = makeHypothesis({ constraintName: "labor_intensity" });
    const result = identifyBindingConstraintDataDriven({
      hypotheses: [h],
      totalCandidates: 1,
      evidenceGaps: [],
      evidenceRequests: [],
      bindingUncertain: false,
      stackSummary: "Binding: labor_intensity",
    });

    expect(result.bindingConstraint).toBeDefined();
    expect(result.bindingConstraint?.constraintName).toBe("labor_intensity");
    // With only one hypothesis, gapToNext equals its own composite score → high confidence
    expect(result.highConfidence).toBe(true);
    expect(result.scores).toHaveLength(1);
  });

  it("selects the hypothesis with the highest composite score", () => {
    // Hypothesis A: Tier 1, strong confidence, many evidence items, high counterfactual
    const hA = makeHypothesis({
      constraintName: "labor_intensity",
      tier: 1,
      confidence: "strong",
      evidenceIds: Array.from({ length: 10 }, (_, i) => `ev-a-${i}`), // evidenceDensityScore = 1.0
      counterfactualImpact: 30, // counterfactualScore = 1.0
    });

    // Hypothesis B: Tier 2, limited confidence, fewer evidence items
    const hB = makeHypothesis({
      constraintName: "awareness_gap",
      tier: 2,
      confidence: "limited",
      evidenceIds: ["ev-b-1"], // evidenceDensityScore = 0.1
      counterfactualImpact: 2,  // counterfactualScore ≈ 0.067
    });

    const result = identifyBindingConstraintDataDriven({
      hypotheses: [hB, hA], // intentionally put weaker one first
      totalCandidates: 2,
      evidenceGaps: [],
      evidenceRequests: [],
      bindingUncertain: false,
      stackSummary: "",
    });

    expect(result.bindingConstraint?.constraintName).toBe("labor_intensity");
    expect(result.scores[0].constraintName).toBe("labor_intensity");
    expect(result.scores[0].compositeScore).toBeGreaterThan(result.scores[1].compositeScore);
  });

  it("flags as uncertain when gap between top two is below threshold", () => {
    // Two nearly-identical hypotheses
    const hA = makeHypothesis({
      constraintName: "labor_intensity",
      tier: 1,
      confidence: "strong",
      evidenceIds: Array.from({ length: 5 }, (_, i) => `ev-a-${i}`),
      counterfactualImpact: 10,
    });
    const hB = makeHypothesis({
      constraintName: "commoditized_pricing",
      tier: 1,
      confidence: "strong",
      evidenceIds: Array.from({ length: 5 }, (_, i) => `ev-b-${i}`),
      counterfactualImpact: 10,
    });

    const result = identifyBindingConstraintDataDriven({
      hypotheses: [hA, hB],
      totalCandidates: 2,
      evidenceGaps: [],
      evidenceRequests: [],
      bindingUncertain: true,
      stackSummary: "",
    });

    // Both have the same score → gap = 0 → uncertain
    expect(result.highConfidence).toBe(false);
    expect(result.selectionRationale).toMatch(/uncertain/i);
  });

  it("assigns non-zero scores for all score components", () => {
    const h = makeHypothesis({
      constraintName: "capacity_ceiling",
      tier: 1,
      confidence: "strong",
      evidenceIds: Array.from({ length: 5 }, (_, i) => `ev-${i}`),
      counterfactualImpact: 15,
    });

    const result = identifyBindingConstraintDataDriven({
      hypotheses: [h],
      totalCandidates: 1,
      evidenceGaps: [],
      evidenceRequests: [],
      bindingUncertain: false,
      stackSummary: "",
    });

    const score = result.scores[0];
    expect(score.evidenceDensityScore).toBeGreaterThan(0);
    expect(score.counterfactualScore).toBeGreaterThan(0);
    expect(score.tierWeight).toBeGreaterThan(0);
    expect(score.qualityBonus).toBeGreaterThan(0);
    expect(score.compositeScore).toBeGreaterThan(0);
    expect(score.compositeScore).toBeLessThanOrEqual(1);
  });

  it("caps scores at 1.0", () => {
    const h = makeHypothesis({
      constraintName: "labor_intensity",
      tier: 1,
      confidence: "strong",
      evidenceIds: Array.from({ length: 50 }, (_, i) => `ev-${i}`), // > 10, should cap at 1.0
      counterfactualImpact: 100, // > 30, should cap at 1.0
    });

    const result = identifyBindingConstraintDataDriven({
      hypotheses: [h],
      totalCandidates: 1,
      evidenceGaps: [],
      evidenceRequests: [],
      bindingUncertain: false,
      stackSummary: "",
    });

    const score = result.scores[0];
    expect(score.evidenceDensityScore).toBeLessThanOrEqual(1);
    expect(score.counterfactualScore).toBeLessThanOrEqual(1);
    expect(score.compositeScore).toBeLessThanOrEqual(1);
  });

  it("integration: runs full pipeline on labor-intensive evidence and picks binding constraint", () => {
    const evidence: Evidence[] = [
      makeEvidence({ id: "ev-001", label: "Labor-intensive operations require high headcount", description: "Revenue scales linearly with headcount — every new contract requires two new hires" }),
      makeEvidence({ id: "ev-002", label: "Manual process in customer onboarding", description: "Staff manually process each customer signup, taking 2 hours per customer" }),
      makeEvidence({ id: "ev-003", label: "Owner dependency on key staff", description: "Three employees are single points of failure for core workflows" }),
      makeEvidence({ id: "ev-004", label: "Bottleneck in production throughput", description: "Production process limited to 50 units/day due to manual assembly requirement" }),
      makeEvidence({ id: "ev-005", label: "Skill scarcity in specialized roles", description: "Hard to hire certified professionals, leading to 3-month vacancy times" }),
    ];

    const hypothesisSet = detectConstraintHypotheses(evidence);
    expect(hypothesisSet.hypotheses.length).toBeGreaterThan(0);

    const binding = identifyBindingConstraintDataDriven(hypothesisSet);
    expect(binding.bindingConstraint).not.toBeNull();
    expect(binding.scores.length).toBeGreaterThan(0);
    // Scores should be in descending order
    for (let i = 1; i < binding.scores.length; i++) {
      expect(binding.scores[i - 1].compositeScore).toBeGreaterThanOrEqual(binding.scores[i].compositeScore);
    }
  });
});
