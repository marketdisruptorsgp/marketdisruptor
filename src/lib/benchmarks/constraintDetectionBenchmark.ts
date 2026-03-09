/**
 * CONSTRAINT DETECTION BENCHMARK HARNESS
 *
 * Tests the current constraint detection pipeline against known-constraint
 * business cases WITHOUT modifying detection logic.
 *
 * Outputs:
 *   - Top-1 and Top-2 accuracy
 *   - False positive rate
 *   - Failure mode classification
 *   - Full reasoning trace per test case
 *
 * Target benchmarks:
 *   - Top-1 accuracy: ≈60%
 *   - Top-2 accuracy: ≈85%
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { EvidenceFacets } from "@/lib/facets";
import { extractFacetsFromEvidence } from "@/lib/facets";
import {
  detectCandidateConstraints,
  rankConstraintCandidates,
  type ConstraintCandidate,
} from "@/lib/constraintDetectionEngine";

// ═══════════════════════════════════════════════════════════════
//  BENCHMARK TEST CASE TYPES
// ═══════════════════════════════════════════════════════════════

export interface BenchmarkTestCase {
  /** Unique test case ID */
  id: string;
  /** Business domain name */
  businessName: string;
  /** Short description */
  description: string;
  /** The ground-truth binding constraint(s) for this business */
  expectedConstraints: string[];
  /** Evidence items that describe this business */
  evidence: Evidence[];
}

export type FailureMode =
  | "facet_extraction_failure"   // Facets not extracted from relevant evidence
  | "keyword_coverage_failure"   // Keywords don't match relevant text
  | "constraint_ranking_error"   // Correct constraint detected but ranked too low
  | "ambiguous_evidence"         // Evidence supports multiple interpretations
  | "incorrect_taxonomy_mapping" // Constraint detected but wrong category
  | "no_detection"               // No constraint detected at all
  | "success";                   // Correct detection

export interface ReasoningTrace {
  /** Input evidence items */
  inputEvidence: { id: string; label: string; description?: string }[];
  /** Extracted facets per evidence */
  extractedFacets: { evidenceId: string; facets: EvidenceFacets | null }[];
  /** All candidate constraints detected */
  candidatesDetected: ConstraintCandidate[];
  /** Ranked constraints with scores */
  rankedConstraints: { rank: number; constraintName: string; confidence: string; evidenceCount: number; facetBasis: string[] }[];
  /** Final top-3 constraints */
  topThree: string[];
}

export interface BenchmarkResult {
  testCaseId: string;
  businessName: string;
  expectedConstraints: string[];
  predictedTop1: string | null;
  predictedTop2: string[];
  predictedTop3: string[];
  top1Correct: boolean;
  top2Correct: boolean;
  failureMode: FailureMode;
  failureExplanation: string;
  reasoningTrace: ReasoningTrace;
}

export interface BenchmarkSummary {
  totalTestCases: number;
  top1Accuracy: number;
  top2Accuracy: number;
  falsePositives: number;
  failureModeDistribution: Record<FailureMode, number>;
  results: BenchmarkResult[];
}

// ═══════════════════════════════════════════════════════════════
//  KNOWN-CONSTRAINT TEST CASES
// ═══════════════════════════════════════════════════════════════

let evidenceCounter = 0;
function makeEvidence(label: string, description?: string): Evidence {
  return {
    id: `bench-ev-${++evidenceCounter}`,
    type: "signal",
    label,
    description,
    pipelineStep: "report",
    tier: "system",
  };
}

export const BENCHMARK_TEST_CASES: BenchmarkTestCase[] = [
  {
    id: "bench-restaurant",
    businessName: "Restaurant",
    description: "Full-service restaurant with fixed seating capacity",
    expectedConstraints: ["capacity_ceiling", "operational_bottleneck"],
    evidence: [
      makeEvidence("Limited seating capacity", "Restaurant has 50 tables and cannot serve more than 200 covers per night"),
      makeEvidence("Table turnover is the primary revenue driver", "Revenue directly tied to how many times tables turn over during service"),
      makeEvidence("Peak hour congestion", "Friday and Saturday nights at capacity, turning away customers"),
      makeEvidence("Kitchen bottleneck during rush", "Kitchen backs up during peak hours, slowing table turnover"),
      makeEvidence("Fixed real estate footprint", "Cannot expand seating without major renovation"),
    ],
  },
  {
    id: "bench-dental",
    businessName: "Dental Practice",
    description: "Private dental practice with chair utilization as primary constraint",
    expectedConstraints: ["capacity_ceiling", "owner_dependency"],
    evidence: [
      makeEvidence("Chair utilization is the bottleneck", "Practice has 4 chairs but can only use 3 due to staffing"),
      makeEvidence("Dentist time is the limiting factor", "Revenue scales directly with dentist's hours in the chair"),
      makeEvidence("Key person dependency on lead dentist", "Owner-dentist handles all complex procedures personally"),
      makeEvidence("Scheduling inefficiency", "Gaps between appointments reduce effective chair utilization to 70%"),
      makeEvidence("Cannot scale without adding dentists", "Growth requires hiring additional dentists"),
    ],
  },
  {
    id: "bench-carwash",
    businessName: "Car Wash",
    description: "Automatic car wash with throughput-limited operations",
    expectedConstraints: ["capacity_ceiling", "operational_bottleneck"],
    evidence: [
      makeEvidence("Throughput limited by wash time", "Each vehicle takes 5 minutes, limiting to 12 cars per hour"),
      makeEvidence("Queue backs up during peak hours", "Wait times exceed 30 minutes on Saturday mornings"),
      makeEvidence("Fixed equipment capacity", "Tunnel can only process one vehicle at a time"),
      makeEvidence("Weather dependency", "Demand spikes after rain but capacity remains fixed"),
      makeEvidence("Real estate constraint", "Cannot add second tunnel without major capital investment"),
    ],
  },
  {
    id: "bench-logistics",
    businessName: "Logistics Fleet",
    description: "Regional trucking company with empty miles as primary inefficiency",
    expectedConstraints: ["asset_underutilization", "geographic_constraint"],
    evidence: [
      makeEvidence("Empty miles erode margins", "Trucks return empty on 40% of trips"),
      makeEvidence("Asset underutilization", "Fleet utilization averages only 60% across the week"),
      makeEvidence("Regional service area limits reach", "Only serve 200-mile radius from depot"),
      makeEvidence("Backhaul matching is manual", "No systematic way to find return loads"),
      makeEvidence("Driver idle time", "Drivers wait 2-3 hours between loads on average"),
    ],
  },
  {
    id: "bench-marketplace",
    businessName: "Marketplace Startup",
    description: "Two-sided marketplace with classic chicken-and-egg supply problem",
    expectedConstraints: ["supply_fragmentation", "trust_deficit"],
    evidence: [
      makeEvidence("Supply liquidity is the constraint", "Not enough service providers to meet demand"),
      makeEvidence("Fragmented supplier base", "Market has many small providers, none with scale"),
      makeEvidence("Trust barrier for new providers", "Suppliers skeptical about platform fees and policies"),
      makeEvidence("Chicken and egg problem", "Need supply to attract demand, need demand to attract supply"),
      makeEvidence("Provider acquisition cost is high", "Spending $200 to acquire each new provider"),
    ],
  },
  {
    id: "bench-gym",
    businessName: "Gym / Fitness Center",
    description: "Fitness facility with equipment capacity and peak congestion",
    expectedConstraints: ["capacity_ceiling", "asset_underutilization"],
    evidence: [
      makeEvidence("Equipment capacity during peak hours", "All treadmills occupied 5-8pm, members waiting"),
      makeEvidence("Off-peak underutilization", "Facility runs at 20% capacity during daytime"),
      makeEvidence("Membership churn from congestion", "Members cancel due to peak hour crowding"),
      makeEvidence("Fixed square footage", "Cannot add more equipment without expansion"),
      makeEvidence("Seasonal demand volatility", "January surge followed by February drop-off"),
    ],
  },
  {
    id: "bench-airline",
    businessName: "Airline",
    description: "Regional airline with aircraft utilization as primary efficiency metric",
    expectedConstraints: ["asset_underutilization", "capacity_ceiling"],
    evidence: [
      makeEvidence("Aircraft utilization is key metric", "Planes need to fly 10+ hours daily to break even"),
      makeEvidence("Seat capacity per flight is fixed", "Cannot add seats without different aircraft"),
      makeEvidence("Turnaround time affects daily utilization", "45-minute turnaround limits daily rotations"),
      makeEvidence("Route profitability varies widely", "Some routes profitable, others subsidize network"),
      makeEvidence("Load factor drives margin", "Need 75% load factor for route profitability"),
    ],
  },
  {
    id: "bench-insurance-broker",
    businessName: "Insurance Brokerage",
    description: "Insurance broker with lead acquisition as primary constraint",
    expectedConstraints: ["commoditized_pricing", "channel_dependency"],
    evidence: [
      makeEvidence("Lead acquisition cost is unsustainable", "Paying $50 per lead, closing 10%"),
      makeEvidence("Commoditized pricing environment", "Race to bottom on premiums, weak price setting power"),
      makeEvidence("Dependent on aggregator platforms", "80% of leads from comparison sites that take margin"),
      makeEvidence("Low switching cost for customers", "Customers switch providers annually for small savings"),
      makeEvidence("Commission compression", "Carrier commissions declining year over year"),
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
//  BENCHMARK EXECUTION
// ═══════════════════════════════════════════════════════════════

function classifyFailureMode(
  expectedConstraints: string[],
  rankedConstraints: ConstraintCandidate[],
  extractedFacets: { evidenceId: string; facets: EvidenceFacets | null }[],
  top1Correct: boolean,
  top2Correct: boolean
): { mode: FailureMode; explanation: string } {
  // Success case
  if (top1Correct) {
    return { mode: "success", explanation: "Correct constraint identified as top-1" };
  }
  if (top2Correct) {
    return { mode: "constraint_ranking_error", explanation: "Correct constraint detected but ranked #2 instead of #1" };
  }

  // Check if expected constraint was detected at all
  const allDetectedNames = rankedConstraints.map(c => c.constraintName);
  const expectedWasDetected = expectedConstraints.some(exp => allDetectedNames.includes(exp));

  if (expectedWasDetected) {
    // Found but ranked too low
    const rank = allDetectedNames.findIndex(n => expectedConstraints.includes(n)) + 1;
    return {
      mode: "constraint_ranking_error",
      explanation: `Correct constraint detected but ranked #${rank} (outside top-2)`,
    };
  }

  // Check if no constraints detected at all
  if (rankedConstraints.length === 0) {
    return { mode: "no_detection", explanation: "No constraints detected from evidence" };
  }

  // Check if facets were extracted
  const facetCount = extractedFacets.filter(ef => ef.facets !== null).length;
  if (facetCount === 0) {
    return {
      mode: "facet_extraction_failure",
      explanation: "No facets extracted from any evidence item — detection relied entirely on keyword fallback",
    };
  }

  // Check if detected constraints have facet basis vs keyword only
  const topConstraint = rankedConstraints[0];
  if (topConstraint && topConstraint.facetBasis.length === 0) {
    // Keyword-only detection for top constraint
    return {
      mode: "keyword_coverage_failure",
      explanation: `Top constraint "${topConstraint.constraintName}" detected via keywords only; expected constraint keywords may not be covered`,
    };
  }

  // Check for ambiguous evidence (multiple strong candidates)
  if (rankedConstraints.length >= 2) {
    const top2 = rankedConstraints.slice(0, 2);
    const bothStrong = top2.every(c => c.confidence === "strong" || c.evidenceIds.length >= 3);
    if (bothStrong && !expectedConstraints.includes(top2[0].constraintName)) {
      return {
        mode: "ambiguous_evidence",
        explanation: `Evidence supports multiple constraints; top candidate "${top2[0].constraintName}" outranked expected constraint`,
      };
    }
  }

  // Default: incorrect taxonomy mapping
  return {
    mode: "incorrect_taxonomy_mapping",
    explanation: `Detected "${rankedConstraints[0]?.constraintName}" but expected one of: ${expectedConstraints.join(", ")}`,
  };
}

function runSingleTestCase(testCase: BenchmarkTestCase): BenchmarkResult {
  // Step 1: Attach facets to evidence
  const evidenceWithFacets = testCase.evidence.map(ev => {
    const facets = extractFacetsFromEvidence(ev);
    return facets ? { ...ev, facets } : ev;
  });

  // Step 2: Build reasoning trace - extracted facets
  const extractedFacets = testCase.evidence.map(ev => ({
    evidenceId: ev.id,
    facets: extractFacetsFromEvidence(ev),
  }));

  // Step 3: Detect candidate constraints
  const candidates = detectCandidateConstraints(evidenceWithFacets);

  // Step 4: Rank candidates
  const ranked = rankConstraintCandidates(candidates, testCase.evidence);

  // Step 5: Extract top predictions
  const predictedTop1 = ranked[0]?.constraintName || null;
  const predictedTop2 = ranked.slice(0, 2).map(c => c.constraintName);
  const predictedTop3 = ranked.slice(0, 3).map(c => c.constraintName);

  // Step 6: Evaluate accuracy
  const top1Correct = predictedTop1 !== null && testCase.expectedConstraints.includes(predictedTop1);
  const top2Correct = predictedTop2.some(p => testCase.expectedConstraints.includes(p));

  // Step 7: Classify failure mode
  const { mode: failureMode, explanation: failureExplanation } = classifyFailureMode(
    testCase.expectedConstraints,
    ranked,
    extractedFacets,
    top1Correct,
    top2Correct
  );

  // Step 8: Build reasoning trace
  const reasoningTrace: ReasoningTrace = {
    inputEvidence: testCase.evidence.map(e => ({ id: e.id, label: e.label, description: e.description })),
    extractedFacets,
    candidatesDetected: candidates,
    rankedConstraints: ranked.map((c, i) => ({
      rank: i + 1,
      constraintName: c.constraintName,
      confidence: c.confidence,
      evidenceCount: c.evidenceIds.length,
      facetBasis: c.facetBasis,
    })),
    topThree: predictedTop3,
  };

  return {
    testCaseId: testCase.id,
    businessName: testCase.businessName,
    expectedConstraints: testCase.expectedConstraints,
    predictedTop1,
    predictedTop2,
    predictedTop3,
    top1Correct,
    top2Correct,
    failureMode,
    failureExplanation,
    reasoningTrace,
  };
}

export function runConstraintDetectionBenchmark(testCases: BenchmarkTestCase[] = BENCHMARK_TEST_CASES): BenchmarkSummary {
  const results = testCases.map(runSingleTestCase);

  const top1Correct = results.filter(r => r.top1Correct).length;
  const top2Correct = results.filter(r => r.top2Correct).length;
  const falsePositives = results.filter(r => !r.top2Correct && r.predictedTop1 !== null).length;

  const failureModeDistribution: Record<FailureMode, number> = {
    success: 0,
    facet_extraction_failure: 0,
    keyword_coverage_failure: 0,
    constraint_ranking_error: 0,
    ambiguous_evidence: 0,
    incorrect_taxonomy_mapping: 0,
    no_detection: 0,
  };

  for (const r of results) {
    failureModeDistribution[r.failureMode]++;
  }

  return {
    totalTestCases: testCases.length,
    top1Accuracy: top1Correct / testCases.length,
    top2Accuracy: top2Correct / testCases.length,
    falsePositives,
    failureModeDistribution,
    results,
  };
}

// ═══════════════════════════════════════════════════════════════
//  REPORTING UTILITIES
// ═══════════════════════════════════════════════════════════════

export function formatBenchmarkReport(summary: BenchmarkSummary): string {
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("  CONSTRAINT DETECTION BENCHMARK RESULTS");
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push(`Total Test Cases: ${summary.totalTestCases}`);
  lines.push(`Top-1 Accuracy:   ${(summary.top1Accuracy * 100).toFixed(1)}% (target: 60%)`);
  lines.push(`Top-2 Accuracy:   ${(summary.top2Accuracy * 100).toFixed(1)}% (target: 85%)`);
  lines.push(`False Positives:  ${summary.falsePositives}`);
  lines.push("");
  lines.push("─── FAILURE MODE DISTRIBUTION ───");
  for (const [mode, count] of Object.entries(summary.failureModeDistribution)) {
    if (count > 0) {
      const pct = ((count / summary.totalTestCases) * 100).toFixed(1);
      lines.push(`  ${mode}: ${count} (${pct}%)`);
    }
  }
  lines.push("");
  lines.push("─── DETAILED RESULTS ───");

  for (const r of summary.results) {
    lines.push("");
    lines.push(`┌── ${r.businessName} [${r.testCaseId}]`);
    lines.push(`│   Expected:   ${r.expectedConstraints.join(", ")}`);
    lines.push(`│   Predicted:  ${r.predictedTop3.join(", ") || "(none)"}`);
    lines.push(`│   Top-1:      ${r.top1Correct ? "✓" : "✗"} | Top-2: ${r.top2Correct ? "✓" : "✗"}`);
    lines.push(`│   Failure:    ${r.failureMode}`);
    lines.push(`│   Explanation: ${r.failureExplanation}`);
    lines.push("│");
    lines.push("│   Reasoning Trace:");
    lines.push(`│     Evidence items: ${r.reasoningTrace.inputEvidence.length}`);
    lines.push(`│     Facets extracted: ${r.reasoningTrace.extractedFacets.filter(f => f.facets).length}/${r.reasoningTrace.inputEvidence.length}`);
    lines.push(`│     Candidates detected: ${r.reasoningTrace.candidatesDetected.length}`);
    lines.push("│     Ranked constraints:");
    for (const rc of r.reasoningTrace.rankedConstraints.slice(0, 5)) {
      const facetNote = rc.facetBasis.length > 0 ? ` [facets: ${rc.facetBasis.join(", ")}]` : " [keywords only]";
      lines.push(`│       #${rc.rank}: ${rc.constraintName} (${rc.confidence}, ${rc.evidenceCount} evidence)${facetNote}`);
    }
    lines.push("└──────────────────────────────────────");
  }

  return lines.join("\n");
}

/**
 * Run benchmark and return both structured data and formatted report
 */
export function executeBenchmark(): { summary: BenchmarkSummary; report: string } {
  const summary = runConstraintDetectionBenchmark();
  const report = formatBenchmarkReport(summary);
  return { summary, report };
}
