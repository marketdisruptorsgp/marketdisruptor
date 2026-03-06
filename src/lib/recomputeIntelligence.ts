/**
 * RECOMPUTE INTELLIGENCE — Unified Intelligence Pipeline
 *
 * Single entry point for full intelligence recomputation.
 * Pipeline: Evidence → Insights → Graph → Metrics
 *
 * Merges simulation evidence into the canonical evidence set
 * before running the reasoning engine.
 *
 * Now includes full diagnostic tracing and hash-guarded recompute.
 */

import { extractAllEvidence, flattenEvidence, type Evidence, type MetricDomain, type MetricEvidence } from "@/lib/evidenceEngine";
import { clusterEvidenceIntoInsights, type Insight } from "@/lib/insightLayer";
import { buildInsightGraph, type InsightGraph } from "@/lib/insightGraph";
import { computeCommandDeckMetrics, aggregateOpportunities, type CommandDeckMetrics } from "@/lib/commandDeckMetrics";
import { allScenariosToEvidence, getScenarios } from "@/lib/scenarioEngine";
import { compareScenarios, type ScenarioComparison } from "@/lib/scenarioComparisonEngine";
import { computeAllSensitivityReports, type SensitivityReport } from "@/lib/sensitivityEngine";
import type { SystemIntelligence } from "@/lib/systemIntelligence";
import {
  traceStage,
  buildDiagnostic,
  computeRecomputeHash,
  shouldRecompute,
  type PipelineStageResult,
} from "@/lib/pipelineDiagnostics";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface IntelligenceInput {
  products: any[];
  selectedProduct: any | null;
  disruptData: any | null;
  redesignData: any | null;
  stressTestData: any | null;
  pitchDeckData: any | null;
  governedData: Record<string, unknown> | null;
  businessAnalysisData: any | null;
  intelligence: SystemIntelligence | null;
  analysisType: "product" | "service" | "business_model";
  analysisId: string;
  completedSteps: Set<string>;
  /** If true, skip hash guard and force recompute */
  force?: boolean;
}

export interface IntelligenceOutput {
  evidence: Record<MetricDomain, MetricEvidence>;
  flatEvidence: Evidence[];
  insights: Insight[];
  graph: InsightGraph;
  metrics: CommandDeckMetrics;
  opportunities: any[];
  events: string[];
  scenarioCount: number;
  scenarioComparison: ScenarioComparison | null;
  sensitivityReports: SensitivityReport[];
  skipped?: boolean;
}

// ═══════════════════════════════════════════════════════════════
//  UNIFIED RECOMPUTE
// ═══════════════════════════════════════════════════════════════

export function recomputeIntelligence(input: IntelligenceInput): IntelligenceOutput {
  const events: string[] = [];
  const stages: PipelineStageResult[] = [];

  // 1. Extract all pipeline evidence
  const { result: evidence, stage: s1 } = traceStage("Evidence Extraction", 1, () =>
    extractAllEvidence({
      products: input.products,
      selectedProduct: input.selectedProduct,
      disruptData: input.disruptData,
      redesignData: input.redesignData,
      stressTestData: input.stressTestData,
      pitchDeckData: input.pitchDeckData,
      governedData: input.governedData,
      businessAnalysisData: input.businessAnalysisData,
      intelligence: input.intelligence,
      analysisType: input.analysisType,
    })
  );
  stages.push(s1);

  // 2. Flatten + merge simulation evidence
  const { result: flat, stage: s2 } = traceStage("Evidence Flattening", 1, () => {
    const f = flattenEvidence(evidence);
    const mode = input.analysisType === "service" ? "service" as const
      : input.analysisType === "business_model" ? "business_model" as const
      : "product" as const;
    const simEvidence = allScenariosToEvidence(input.analysisId, mode);
    if (simEvidence.length > 0) {
      f.push(...simEvidence);
      events.push(`${simEvidence.length} simulation evidence objects merged`);
    }
    return f;
  });
  stages.push(s2);

  // 3. Hash guard — skip if nothing changed (unless forced)
  const scenarios = getScenarios(input.analysisId);
  const hash = computeRecomputeHash(flat.length, 0, scenarios.length);
  if (!input.force && !shouldRecompute(hash)) {
    events.push("No intelligence changes detected — skipping recompute");
    console.log("[Pipeline] Recompute skipped (hash unchanged)");
    // Return minimal output (caller should use cached)
    return {
      evidence,
      flatEvidence: flat,
      insights: [],
      graph: { nodes: [], edges: [], topNodes: { primaryConstraint: null, keyDriver: null, breakthroughOpportunity: null, highestConfidence: null } },
      metrics: {} as CommandDeckMetrics,
      opportunities: [],
      events,
      scenarioCount: scenarios.length,
      scenarioComparison: null,
      sensitivityReports: [],
      skipped: true,
    };
  }

  // 4. Generate insights from evidence
  const { result: insights, stage: s3 } = traceStage("Insight Clustering", flat.length, () =>
    clusterEvidenceIntoInsights(flat)
  );
  stages.push(s3);

  if (insights.length > 0) {
    events.push(`${insights.length} insights generated from ${flat.length} evidence items`);
  }

  // Categorize insights for diagnostics
  const insightsByType: Record<string, number> = {};
  for (const ins of insights) {
    insightsByType[ins.insightType] = (insightsByType[ins.insightType] || 0) + 1;
  }
  console.log("[Pipeline] Insight distribution:", insightsByType);

  // Tool recommendation count
  const toolRecs = insights.filter(i => i.recommendedTools && i.recommendedTools.length > 0);
  if (toolRecs.length > 0) {
    const totalTools = toolRecs.reduce((sum, i) => sum + (i.recommendedTools?.length || 0), 0);
    events.push(`${totalTools} tool recommendations from reasoning engine`);
  }

  // 5. Scenario comparison & sensitivity analysis
  const { result: scenarioComparison, stage: s4 } = traceStage("Scenario Comparison", scenarios.length, () =>
    scenarios.length > 0 ? compareScenarios(scenarios) : null
  );
  stages.push(s4);

  const { result: sensitivityReports, stage: s5 } = traceStage("Sensitivity Analysis", scenarios.length, () =>
    computeAllSensitivityReports(scenarios)
  );
  stages.push(s5);

  // 6. Build insight graph — pass insights + scenarios for full node generation
  const insightsForGraph = insights.map(i => ({
    id: i.id, label: i.label, description: i.description,
    insightType: i.insightType, impact: i.impact,
    confidenceScore: i.confidenceScore, evidenceIds: i.evidenceIds,
    recommendedTools: i.recommendedTools,
  }));
  const scenariosForGraph = scenarioComparison?.scenarios;

  const { result: graph, stage: s6 } = traceStage("Graph Construction", flat.length + insights.length, () =>
    buildInsightGraph(
      flat, undefined, undefined, undefined, undefined,
      insightsForGraph.length > 0 ? insightsForGraph : undefined,
      scenariosForGraph && scenariosForGraph.length > 0 ? scenariosForGraph : undefined,
    )
  );
  stages.push(s6);

  // 7. Compute command deck metrics
  const metricsInput = {
    products: input.products,
    selectedProduct: input.selectedProduct,
    disruptData: input.disruptData,
    redesignData: input.redesignData,
    stressTestData: input.stressTestData,
    pitchDeckData: input.pitchDeckData,
    governedData: input.governedData,
    businessAnalysisData: input.businessAnalysisData,
    intelligence: input.intelligence,
    completedSteps: input.completedSteps,
    evidence,
  };

  const { result: metrics, stage: s7 } = traceStage("Metrics Computation", flat.length, () =>
    computeCommandDeckMetrics(metricsInput)
  );
  stages.push(s7);

  const { result: opportunities, stage: s8 } = traceStage("Opportunity Aggregation", flat.length, () =>
    aggregateOpportunities(metricsInput)
  );
  stages.push(s8);

  if (scenarioComparison && scenarioComparison.scenarios.length > 1) {
    events.push(`${scenarioComparison.scenarios.length} scenarios compared`);
  }
  if (sensitivityReports.length > 0) {
    const totalVars = sensitivityReports.reduce((s, r) => s + r.variables.length, 0);
    events.push(`${totalVars} sensitivity variables analyzed`);
  }

  events.push("Strategic intelligence updated");

  // 8. Build diagnostic summary
  buildDiagnostic(stages, graph.nodes, flat.length, insights.length, scenarios.length);

  return {
    evidence,
    flatEvidence: flat,
    insights,
    graph,
    metrics,
    opportunities,
    events,
    scenarioCount: scenarios.length,
    scenarioComparison,
    sensitivityReports,
  };
}
