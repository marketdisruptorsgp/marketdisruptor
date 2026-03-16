import { describe, it, expect } from "vitest";
import type { Evidence } from "@/lib/evidenceEngine";
import type { ConstraintHypothesis } from "@/lib/constraintDetectionEngine";
import {
  detectParadigmVulnerabilities,
  detectContextShifts,
} from "@/lib/paradigmArchaeologyEngine";

// ── Minimal Evidence Fixtures ────────────────────────────────────────────────

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

// Evidence that triggers "must own physical assets" and "must operate with
// geographic locality" patterns
const assetHeavyEvidence: Evidence[] = [
  makeEvidence({ id: "ev-001", label: "High capacity ceiling from owned warehouse", description: "Warehouse owned outright, under-utilised at 40% average capacity" }),
  makeEvidence({ id: "ev-002", label: "Geographic constraint limits growth to 50-mile radius", description: "All service delivery requires on-site technician visit" }),
  makeEvidence({ id: "ev-003", label: "Asset underutilisation in fleet", description: "Company vehicles sit idle 60% of the day" }),
];

// Evidence that triggers "must have human intermediation" pattern
const laborDependentEvidence: Evidence[] = [
  makeEvidence({ id: "ev-010", label: "Labor intensity drives costs", description: "Every unit of revenue requires proportional headcount" }),
  makeEvidence({ id: "ev-011", label: "Manual process in onboarding", description: "Staff manually process each customer signup" }),
  makeEvidence({ id: "ev-012", label: "Owner dependency on key staff", description: "Three employees are single points of failure for core workflows" }),
];

// ── Minimal ConstraintHypothesis Fixture ─────────────────────────────────────

function makeConstraint(
  constraintName: string,
  constraintId = "C-LAB-01",
): ConstraintHypothesis {
  return {
    constraintId,
    constraintName,
    // @ts-expect-error — minimal stub; definition not needed for detection logic
    definition: { id: constraintId, name: constraintName, category: "labor_operations", description: "", defaultTier: 1 },
    tier: 1,
    evidenceIds: ["ev-001"],
    facetBasis: [],
    confidence: "strong",
    explanation: "Detected via facet matching",
    counterfactualImpact: 5,
    counterfactualExplanation: "Removing this constraint would improve margins",
    stackRole: "binding",
    confidenceInterval: { point: 0.8, lower: 0.6, upper: 0.95 },
    rankingFactors: { evidenceDensity: 0.7, evidenceQuality: 0.8, networkCentrality: 0.5 },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  detectParadigmVulnerabilities
// ═══════════════════════════════════════════════════════════════════════════════

describe("detectParadigmVulnerabilities", () => {
  it("returns a valid ParadigmArchaeologyResult structure", () => {
    const result = detectParadigmVulnerabilities([], []);
    expect(result).toHaveProperty("sacredAssumptions");
    expect(result).toHaveProperty("totalAssumptionsAnalyzed");
    expect(result).toHaveProperty("contextShiftFactors");
    expect(result).toHaveProperty("breakthroughOpportunities");
    expect(result).toHaveProperty("archaeologyConfidence");
    expect(typeof result.archaeologyConfidence).toBe("number");
    expect(result.archaeologyConfidence).toBeGreaterThanOrEqual(0);
    expect(result.archaeologyConfidence).toBeLessThanOrEqual(1);
  });

  it("reports the correct total number of screened patterns", () => {
    const result = detectParadigmVulnerabilities([], []);
    // Must equal the number of patterns in the catalogue (13)
    expect(result.totalAssumptionsAnalyzed).toBe(13);
  });

  it("detects asset-ownership assumptions when evidence contains relevant keywords", () => {
    const result = detectParadigmVulnerabilities([], assetHeavyEvidence);
    expect(result.sacredAssumptions.length).toBeGreaterThan(0);

    const ownershipAssumption = result.sacredAssumptions.find(a =>
      a.assumption.toLowerCase().includes("physical assets"),
    );
    expect(ownershipAssumption).toBeDefined();
  });

  it("returns no more than 5 sacred assumptions", () => {
    const richEvidence: Evidence[] = [
      ...assetHeavyEvidence,
      ...laborDependentEvidence,
    ];
    const result = detectParadigmVulnerabilities(
      [makeConstraint("labor_intensity"), makeConstraint("capacity_ceiling", "C-SUP-05")],
      richEvidence,
    );
    expect(result.sacredAssumptions.length).toBeLessThanOrEqual(5);
  });

  it("sorts sacred assumptions by descending vulnerabilityScore", () => {
    const result = detectParadigmVulnerabilities([], [...assetHeavyEvidence, ...laborDependentEvidence]);
    const scores = result.sacredAssumptions.map(a => a.vulnerabilityScore);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it("every assumption has a non-empty historicalPrecedent", () => {
    const result = detectParadigmVulnerabilities([], [...assetHeavyEvidence, ...laborDependentEvidence]);
    for (const assumption of result.sacredAssumptions) {
      expect(assumption.historicalPrecedent).toBeTruthy();
      expect(assumption.historicalPrecedent.length).toBeGreaterThan(0);
    }
  });

  it("links assumptions to constraint IDs when matching constraints are passed", () => {
    const constraints = [makeConstraint("labor_intensity", "C-LAB-01")];
    const result = detectParadigmVulnerabilities(constraints, laborDependentEvidence);

    const laborAssumption = result.sacredAssumptions.find(a =>
      a.linkedConstraintIds.includes("C-LAB-01"),
    );
    expect(laborAssumption).toBeDefined();
  });

  it("produces a breakthroughOpportunity for each top assumption", () => {
    const result = detectParadigmVulnerabilities([], [...assetHeavyEvidence, ...laborDependentEvidence]);
    expect(result.breakthroughOpportunities.length).toBe(result.sacredAssumptions.length);
  });

  it("each breakthrough opportunity has required fields", () => {
    const result = detectParadigmVulnerabilities([], assetHeavyEvidence);
    for (const opp of result.breakthroughOpportunities) {
      expect(opp.title).toBeTruthy();
      expect(opp.targetAssumption).toBeTruthy();
      expect(opp.vector).toBeTruthy();
      expect(opp.firstStep).toBeTruthy();
      expect(["low", "medium", "high"]).toContain(opp.difficulty);
      expect(["incremental", "significant", "transformative"]).toContain(opp.marketImpact);
    }
  });

  it("keeps vulnerabilityScore within 0–10 bounds", () => {
    const result = detectParadigmVulnerabilities(
      [makeConstraint("labor_intensity"), makeConstraint("capacity_ceiling", "C-SUP-05")],
      [...assetHeavyEvidence, ...laborDependentEvidence],
    );
    for (const assumption of result.sacredAssumptions) {
      expect(assumption.vulnerabilityScore).toBeGreaterThanOrEqual(0);
      expect(assumption.vulnerabilityScore).toBeLessThanOrEqual(10);
    }
  });

  it("is deterministic — same input produces same output", () => {
    const constraints = [makeConstraint("labor_intensity")];
    const evidence = [...laborDependentEvidence];
    const resultA = detectParadigmVulnerabilities(constraints, evidence);
    const resultB = detectParadigmVulnerabilities(constraints, evidence);
    expect(resultA.sacredAssumptions.map(a => a.assumption)).toEqual(
      resultB.sacredAssumptions.map(a => a.assumption),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  detectContextShifts
// ═══════════════════════════════════════════════════════════════════════════════

describe("detectContextShifts", () => {
  it("returns an array of ContextShiftFactor objects", () => {
    const shifts = detectContextShifts([]);
    expect(Array.isArray(shifts)).toBe(true);
  });

  it("each shift has required fields", () => {
    const shifts = detectContextShifts(assetHeavyEvidence);
    for (const shift of shifts) {
      expect(["technology", "social", "economic", "regulatory", "generational"]).toContain(
        shift.category,
      );
      expect(shift.shift).toBeTruthy();
      expect(shift.impact).toBeTruthy();
      expect(shift.whenOccurred).toBeTruthy();
      expect(Array.isArray(shift.industriesAffected)).toBe(true);
      expect(shift.industriesAffected.length).toBeGreaterThan(0);
    }
  });

  it("returns broadly-applicable shifts even for empty evidence", () => {
    const shifts = detectContextShifts([]);
    // Shifts affecting 4+ industries are always returned
    expect(shifts.length).toBeGreaterThan(0);
  });
});
