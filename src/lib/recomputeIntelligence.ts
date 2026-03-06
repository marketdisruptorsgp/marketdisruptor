/**
 * RECOMPUTE INTELLIGENCE — Delegates to Strategic Engine
 *
 * Single entry point for full intelligence recomputation.
 * No hash guards during development — always recomputes.
 * Delegates all reasoning to runStrategicAnalysis().
 */

import { type Evidence, type MetricDomain, type MetricEvidence } from "@/lib/evidenceEngine";
import { type Insight } from "@/lib/insightLayer";
import { type InsightGraph } from "@/lib/insightGraph";
import { type CommandDeckMetrics } from "@/lib/commandDeckMetrics";
import { type ScenarioComparison } from "@/lib/scenarioComparisonEngine";
import { type SensitivityReport } from "@/lib/sensitivityEngine";
import type { SystemIntelligence } from "@/lib/systemIntelligence";
import {
  runStrategicAnalysis,
  type StrategicAnalysisInput,
  type StrategicInsight,
} from "@/lib/strategicEngine";

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
  force?: boolean;
  lensState?: string;
}

export interface IntelligenceOutput {
  evidence: Record<MetricDomain, MetricEvidence>;
  flatEvidence: Evidence[];
  insights: StrategicInsight[];
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
//  UNIFIED RECOMPUTE — Delegates to Strategic Engine
// ═══════════════════════════════════════════════════════════════

export function recomputeIntelligence(input: IntelligenceInput): IntelligenceOutput {
  const engineInput: StrategicAnalysisInput = {
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
    analysisId: input.analysisId,
    completedSteps: input.completedSteps,
  };

  const result = runStrategicAnalysis(engineInput);

  return {
    evidence: result.evidence,
    flatEvidence: result.flatEvidence,
    insights: result.insights,
    graph: result.graph,
    metrics: result.metrics,
    opportunities: result.opportunities,
    events: result.events,
    scenarioCount: result.scenarioComparison?.scenarios?.length ?? 0,
    scenarioComparison: result.scenarioComparison,
    sensitivityReports: result.sensitivityReports,
  };
}
