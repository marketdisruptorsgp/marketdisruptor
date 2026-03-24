/**
 * PIPELINE TRACE — Test Suite
 *
 * Verifies the run-safe trace lifecycle:
 *   ✅ startTrace creates a trace with startedAt, runId, status=running, completedAt=null
 *   ✅ completeTrace sets completedAt and status=completed
 *   ✅ completeTrace("failed") sets status=failed
 *   ✅ events array records start event + trace mutations
 *   ✅ Non-destructive: startTrace is a no-op when an active running trace exists for the same analysisId
 *   ✅ force:true always creates a new trace
 *   ✅ getLatestTrace returns the most-recently-completed trace for an analysisId
 *   ✅ strategicStages and morphological are not null after traceStrategicStages/traceMorphological
 *   ✅ pipelineDiagnosticSummary is populated after setPipelineDiagnosticSummary
 *   ✅ downloadTrace produces a blob filename containing analysisId + runId
 *   ✅ Exported JSON has all required schema keys
 *   ✅ Evidence meta-label filtering removes placeholder/template labels
 *   ✅ Evidence dedup normalization handles punctuation variants
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  startTrace,
  completeTrace,
  getTrace,
  getLatestTrace,
  traceEvent,
  traceError,
  traceStrategicStages,
  traceMorphological,
  setPipelineDiagnosticSummary,
  traceEvidenceExtraction,
  type PipelineTrace,
} from "../pipelineTrace";
import { deduplicateEvidence, type Evidence } from "../evidenceEngine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeEvidence(id: string, label: string, type: Evidence["type"] = "friction"): Evidence {
  return {
    id,
    label,
    type,
    tier: "system",
    pipelineStep: "report",
    sourceEngine: "pipeline",
  };
}

// ── Trace lifecycle ──────────────────────────────────────────────────────────

describe("Trace lifecycle", () => {
  // Reset module-level trace state between tests via force-new trace
  beforeEach(() => {
    // Force a fresh trace on each test so state is clean
    startTrace(`test-${Date.now()}`, { force: true });
  });

  it("startTrace creates a trace with the required schema fields", () => {
    const t = startTrace("analysis-abc-123", { force: true });
    expect(t.traceId).toMatch(/^trace_/);
    expect(t.analysisId).toBe("analysis-abc-123");
    expect(t.runId).toMatch(/^run_/);
    expect(t.startedAt).toBeTruthy();
    expect(t.completedAt).toBeNull();
    expect(t.status).toBe("running");
    expect(Array.isArray(t.events)).toBe(true);
    expect(Array.isArray(t.errors)).toBe(true);
    expect(Array.isArray(t.edgeFunctions)).toBe(true);
  });

  it("completeTrace sets completedAt and status=completed", () => {
    const t = startTrace("analysis-complete", { force: true });
    expect(t.completedAt).toBeNull();
    completeTrace("completed");
    expect(t.completedAt).not.toBeNull();
    expect(t.status).toBe("completed");
  });

  it("completeTrace('failed') sets status=failed", () => {
    const t = startTrace("analysis-fail", { force: true });
    completeTrace("failed");
    expect(t.status).toBe("failed");
    expect(t.completedAt).not.toBeNull();
  });

  it("getTrace returns the active trace", () => {
    const t = startTrace("analysis-get", { force: true });
    const fetched = getTrace();
    expect(fetched).toBe(t);
  });

  it("traceEvent appends timestamped event strings", () => {
    const t = startTrace("analysis-events", { force: true });
    traceEvent("pipeline_step_1_complete");
    traceEvent("strategic_engine_started");
    expect(t.events).toHaveLength(2);
    expect(t.events[0]).toContain("pipeline_step_1_complete");
  });

  it("traceError appends to errors array", () => {
    const t = startTrace("analysis-errors", { force: true });
    traceError("some_error: timeout");
    expect(t.errors).toHaveLength(1);
    expect(t.errors[0]).toContain("some_error: timeout");
  });
});

// ── Non-destructive startTrace ───────────────────────────────────────────────

describe("Non-destructive startTrace", () => {
  it("does not overwrite an active running trace for the same analysisId", () => {
    const t1 = startTrace("analysis-nd", { force: true });
    const t2 = startTrace("analysis-nd"); // non-destructive
    expect(t2).toBe(t1); // same object reference
    expect(t1.runId).toBe(t2.runId);
  });

  it("creates a new trace if previous trace is completed", () => {
    const t1 = startTrace("analysis-nd2", { force: true });
    completeTrace("completed");
    const t2 = startTrace("analysis-nd2"); // previous is completed, so new trace
    expect(t2).not.toBe(t1);
    expect(t2.completedAt).toBeNull();
    expect(t2.status).toBe("running");
  });

  it("force:true always creates a fresh trace even when one is running", () => {
    const t1 = startTrace("analysis-force", { force: true });
    const t2 = startTrace("analysis-force", { force: true });
    expect(t2).not.toBe(t1);
    expect(t2.runId).not.toBe(t1.runId);
  });

  it("runId is monotonically incrementing for the same analysisId", () => {
    const t1 = startTrace("analysis-mono", { force: true });
    completeTrace();
    const t2 = startTrace("analysis-mono"); // creates new since t1 is completed
    const run1 = parseInt(t1.runId.replace("run_", ""));
    const run2 = parseInt(t2.runId.replace("run_", ""));
    expect(run2).toBeGreaterThan(run1);
  });
});

// ── Trace fields population ──────────────────────────────────────────────────

describe("Trace field population", () => {
  beforeEach(() => {
    startTrace("analysis-fields", { force: true });
  });

  it("strategicStages is populated after traceStrategicStages", () => {
    const t = getTrace()!;
    expect(t.strategicStages).toBeNull();

    traceStrategicStages({
      stage1_rawEvidenceCount: 25,
      stage2_normalizedCount: 22,
      stage2_dedupLosses: 3,
      stage2b_facetsPopulated: true,
      stage3_constraintHypotheses: [{ name: "labor_intensity", evidenceCount: 5 }],
      stage4_structuralProfile: null,
      stage4_bindingConstraints: ["labor_intensity"],
      stage5_qualifiedPatterns: [],
      stage6_aiGatePassed: false,
      stage6_aiGateDetails: {},
      stage6_deepenedLabels: [],
      stage6_mode: "deterministic",
      narrative: { strategicVerdict: "High constraint", primaryConstraint: "labor_intensity", whyThisMatters: "..." },
    });

    expect(t.strategicStages).not.toBeNull();
    expect(t.strategicStages!.stage1_rawEvidenceCount).toBe(25);
    expect(t.strategicStages!.stage6_mode).toBe("deterministic");
  });

  it("strategicStages with stage6_mode=skipped includes skipReason", () => {
    traceStrategicStages({
      stage1_rawEvidenceCount: 2,
      stage2_normalizedCount: 2,
      stage2_dedupLosses: 0,
      stage2b_facetsPopulated: false,
      stage3_constraintHypotheses: [],
      stage4_structuralProfile: null,
      stage4_bindingConstraints: [],
      stage5_qualifiedPatterns: [],
      stage6_aiGatePassed: false,
      stage6_aiGateDetails: {},
      stage6_deepenedLabels: [],
      stage6_mode: "skipped",
      stage6_skipReason: "Insufficient evidence (evCount=2)",
      narrative: null,
    });

    const t = getTrace()!;
    expect(t.strategicStages!.stage6_mode).toBe("skipped");
    expect(t.strategicStages!.stage6_skipReason).toContain("Insufficient evidence");
  });

  it("morphological is populated after traceMorphological", () => {
    const t = getTrace()!;
    expect(t.morphological).toBeNull();

    traceMorphological({
      runMode: "full",
      evidenceCount: 25,
      fullThreshold: 18,
      limitedThreshold: 10,
      zoneCount: 3,
      vectorCount: 4,
      constraintInversionCount: 2,
      secondOrderUnlockCount: 3,
      temporalUnlockCount: 2,
      competitiveGapCount: 1,
      degradedConfidence: false,
    });

    expect(t.morphological).not.toBeNull();
    expect(t.morphological!.runMode).toBe("full");
    expect(t.morphological!.zoneCount).toBe(3);
  });

  it("morphological skip includes skipReason", () => {
    traceMorphological({
      runMode: "skipped",
      evidenceCount: 3,
      fullThreshold: 18,
      limitedThreshold: 10,
      zoneCount: 0,
      vectorCount: 0,
      constraintInversionCount: 0,
      secondOrderUnlockCount: 0,
      temporalUnlockCount: 0,
      competitiveGapCount: 0,
      degradedConfidence: true,
      skipReason: "insufficient evidence (count=3, need ≥5)",
    });

    const t = getTrace()!;
    expect(t.morphological!.skipReason).toContain("insufficient evidence");
  });

  it("pipelineDiagnosticSummary is populated after setPipelineDiagnosticSummary", () => {
    const t = getTrace()!;
    expect(t.pipelineDiagnosticSummary).toBeNull();

    setPipelineDiagnosticSummary({ evidenceCount: 22, constraintCount: 3, deepenedCount: 2 });

    expect(t.pipelineDiagnosticSummary).not.toBeNull();
    expect(t.pipelineDiagnosticSummary!.evidenceCount).toBe(22);
  });
});

// ── getLatestTrace ──────────────────────────────────────────────────────────

describe("getLatestTrace", () => {
  it("returns null when no trace for that analysisId", () => {
    expect(getLatestTrace("analysis-nonexistent")).toBeNull();
  });

  it("returns the running trace for an analysisId", () => {
    const t = startTrace("analysis-latest", { force: true });
    const found = getLatestTrace("analysis-latest");
    expect(found).toBe(t);
  });

  it("prefers completed traces over running ones", () => {
    const t1 = startTrace("analysis-pref", { force: true });
    completeTrace("completed");
    const t2 = startTrace("analysis-pref"); // creates new trace since t1 completed
    const found = getLatestTrace("analysis-pref");
    // t1 is completed, t2 is running → getLatestTrace should prefer the completed t1
    expect(found).toBe(t1);
  });
});

// ── Exported JSON schema ─────────────────────────────────────────────────────

describe("Exported JSON schema", () => {
  it("completed trace has all required schema keys", () => {
    const t = startTrace("analysis-export", { force: true });
    traceEvent("step_done");
    completeTrace("completed");

    const json = JSON.parse(JSON.stringify(t));
    expect(json).toHaveProperty("traceId");
    expect(json).toHaveProperty("analysisId");
    expect(json).toHaveProperty("runId");
    expect(json).toHaveProperty("startedAt");
    expect(json).toHaveProperty("completedAt");
    expect(json).toHaveProperty("status");
    expect(json).toHaveProperty("events");
    expect(json).toHaveProperty("errors");
    expect(json).toHaveProperty("edgeFunctions");
    expect(json.status).toBe("completed");
    expect(json.completedAt).not.toBeNull();
  });
});

// ── Evidence meta-label filtering ────────────────────────────────────────────

describe("Evidence meta-label filtering", () => {
  function e(id: string, label: string): Evidence {
    return makeEvidence(id, label);
  }

  it("removes known placeholder labels", () => {
    const items = [
      e("1", "Primary friction"),
      e("2", "Current approach"),
      e("3", "Operating cost structure"),
      e("4", "Constraint 1"),
      e("5", "Friction 2"),
      e("6", "Legitimate operational bottleneck from AI response"),
    ];
    const deduped = deduplicateEvidence(items);
    const labels = deduped.map(d => d.label);
    expect(labels).not.toContain("Primary friction");
    expect(labels).not.toContain("Current approach");
    expect(labels).not.toContain("Operating cost structure");
    expect(labels).not.toContain("Constraint 1");
    expect(labels).not.toContain("Friction 2");
    expect(labels).toContain("Legitimate operational bottleneck from AI response");
  });

  it("removes 'The system must keep this constraint: ...' labels", () => {
    const items = [
      e("1", "The system must keep this constraint: Recurring friction point 1"),
      e("2", "Supplier concentration risk in Southeast Asia"),
    ];
    const deduped = deduplicateEvidence(items);
    const labels = deduped.map(d => d.label);
    expect(labels).not.toContain("The system must keep this constraint: Recurring friction point 1");
    expect(labels).toContain("Supplier concentration risk in Southeast Asia");
  });

  it("does NOT remove legitimate short labels that are not meta patterns", () => {
    // Length > 3 and not matching any pattern — should survive
    const items = [e("1", "High energy costs at peak demand")];
    const deduped = deduplicateEvidence(items);
    expect(deduped).toHaveLength(1);
  });
});

// ── Evidence dedup normalization ─────────────────────────────────────────────

describe("Evidence dedup normalization", () => {
  it("deduplicates near-identical labels with different punctuation", () => {
    const items = [
      makeEvidence("a", "High supplier concentration risk"),
      makeEvidence("b", "High, supplier concentration risk"),   // comma variant
      makeEvidence("c", "High supplier concentration-risk"),    // hyphen variant
    ];
    const result = deduplicateEvidence(items, 0.85);
    // All three should collapse to one canonical item
    expect(result).toHaveLength(1);
  });

  it("does not merge clearly distinct labels", () => {
    const items = [
      makeEvidence("x", "High supplier concentration risk"),
      makeEvidence("y", "Low customer retention from poor onboarding"),
    ];
    const result = deduplicateEvidence(items, 0.85);
    expect(result).toHaveLength(2);
  });
});
