/**
 * RECOMPUTE INTELLIGENCE — Unified Intelligence Pipeline
 *
 * Single entry point for full intelligence recomputation.
 * Pipeline: Evidence → Insights → Graph → Metrics
 *
 * Merges simulation evidence into the canonical evidence set
 * before running the reasoning engine.
 */

import { extractAllEvidence, flattenEvidence, type Evidence, type MetricDomain, type MetricEvidence } from "@/lib/evidenceEngine";
import { clusterEvidenceIntoInsights, type Insight } from "@/lib/insightLayer";
import { buildInsightGraph, type InsightGraph } from "@/lib/insightGraph";
import { computeCommandDeckMetrics, aggregateOpportunities, type CommandDeckMetrics } from "@/lib/commandDeckMetrics";
import { allScenariosToEvidence, getScenarios } from "@/lib/scenarioEngine";
import { compareScenarios, type ScenarioComparison } from "@/lib/scenarioComparisonEngine";
import { computeAllSensitivityReports, type SensitivityReport } from "@/lib/sensitivityEngine";
import type { SystemIntelligence } from "@/lib/systemIntelligence";

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
}

// ═══════════════════════════════════════════════════════════════
//  UNIFIED RECOMPUTE
// ═══════════════════════════════════════════════════════════════

export function recomputeIntelligence(input: IntelligenceInput): IntelligenceOutput {
  const events: string[] = [];

  // 1. Extract all pipeline evidence
  const evidence = extractAllEvidence({
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
  });

  // 2. Merge simulation evidence into the flat set
  const flat = flattenEvidence(evidence);
  const mode = input.analysisType === "service" ? "service" as const
    : input.analysisType === "business_model" ? "business_model" as const
    : "product" as const;
  const simEvidence = allScenariosToEvidence(input.analysisId, mode);

  if (simEvidence.length > 0) {
    flat.push(...simEvidence);
    events.push(`${simEvidence.length} simulation evidence objects merged`);
  }

  // 3. Generate insights from evidence
  const insights = clusterEvidenceIntoInsights(flat);
  if (insights.length > 0) {
    events.push(`${insights.length} insights generated from ${flat.length} evidence items`);
  }

  // Tool recommendation count
  const toolRecs = insights.filter(i => i.recommendedTools && i.recommendedTools.length > 0);
  if (toolRecs.length > 0) {
    const totalTools = toolRecs.reduce((sum, i) => sum + (i.recommendedTools?.length || 0), 0);
    events.push(`${totalTools} tool recommendations from reasoning engine`);
  }

  // 4. Build insight graph — pass insights + scenarios for full node generation
  const insightsForGraph = insights.map(i => ({
    id: i.id, label: i.label, description: i.description,
    insightType: i.insightType, impact: i.impact,
    confidenceScore: i.confidenceScore, evidenceIds: i.evidenceIds,
    recommendedTools: i.recommendedTools,
  }));
  const scenariosForGraph = scenarios.length > 0
    ? compareScenarios(scenarios).scenarios
    : scenarioComparison?.scenarios;
  const graph = buildInsightGraph(
    flat, undefined, undefined, undefined, undefined,
    insightsForGraph.length > 0 ? insightsForGraph : undefined,
    scenariosForGraph && scenariosForGraph.length > 0 ? scenariosForGraph : undefined,
  );

  // 5. Compute command deck metrics
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

  const metrics = computeCommandDeckMetrics(metricsInput);
  const opportunities = aggregateOpportunities(metricsInput);

  // 6. Scenario comparison & sensitivity analysis
  const scenarios = getScenarios(input.analysisId);
  const scenarioComparison = scenarios.length > 0 ? compareScenarios(scenarios) : null;
  const sensitivityReports = computeAllSensitivityReports(scenarios);

  if (scenarioComparison && scenarioComparison.scenarios.length > 1) {
    events.push(`${scenarioComparison.scenarios.length} scenarios compared`);
  }
  if (sensitivityReports.length > 0) {
    const totalVars = sensitivityReports.reduce((s, r) => s + r.variables.length, 0);
    events.push(`${totalVars} sensitivity variables analyzed`);
  }

  events.push("Strategic intelligence updated");

  return {
    evidence,
    flatEvidence: flat,
    insights,
    graph,
    metrics,
    opportunities,
    events,
    scenarioCount: simEvidence.length,
    scenarioComparison,
    sensitivityReports,
  };
}
