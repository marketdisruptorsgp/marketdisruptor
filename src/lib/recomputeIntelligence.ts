/**
 * RECOMPUTE INTELLIGENCE — Delegates to Strategic Engine
 *
 * Single entry point for full intelligence recomputation.
 * Provides both sync (fallback) and async (morphological) paths.
 * The async path fetches AI alternatives from the edge function
 * before running the strategic engine with the full morphological pipeline.
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
import {
  extractBaseline,
  identifyActiveDimensions,
  getDimensionsByStatus,
  prepareEdgeFunctionPayload,
  type DimensionAlternative,
} from "@/lib/opportunityDesignEngine";
import {
  extractAllEvidence,
  flattenEvidence,
} from "@/lib/evidenceEngine";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";

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
//  BUILD ENGINE INPUT (shared between sync and async paths)
// ═══════════════════════════════════════════════════════════════

function buildEngineInput(
  input: IntelligenceInput,
  aiAlternatives?: DimensionAlternative[],
): StrategicAnalysisInput {
  return {
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
    aiAlternatives,
  };
}

function buildOutput(result: ReturnType<typeof runStrategicAnalysis>): IntelligenceOutput {
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

// ═══════════════════════════════════════════════════════════════
//  SYNC RECOMPUTE — Fallback path (no AI alternatives)
// ═══════════════════════════════════════════════════════════════

export function recomputeIntelligence(input: IntelligenceInput): IntelligenceOutput {
  const result = runStrategicAnalysis(buildEngineInput(input));
  return buildOutput(result);
}

// ═══════════════════════════════════════════════════════════════
//  ASYNC RECOMPUTE — Full morphological pipeline with AI
// ═══════════════════════════════════════════════════════════════

/**
 * Fetches AI-generated dimension alternatives from the edge function,
 * then runs the full strategic analysis with morphological search.
 *
 * Falls back to sync path if the edge function fails or returns no alternatives.
 */
export async function recomputeIntelligenceAsync(input: IntelligenceInput): Promise<IntelligenceOutput> {
  let aiAlternatives: DimensionAlternative[] | undefined;

  try {
    // Pre-compute a quick evidence pass to extract baseline dimensions
    const evidenceResult = extractAllEvidence({
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
    });
    const flat = flattenEvidence(evidenceResult);

    // We need constraints and leverage from a preliminary sync run to build baseline
    // But that's expensive — instead, build baseline from evidence alone with empty constraints
    // The baseline extraction only needs evidence + constraint/leverage overlap checks
    const emptyConstraints: StrategicInsight[] = [];
    const emptyLeverage: StrategicInsight[] = [];

    const rawBaseline = extractBaseline(flat, emptyConstraints, emptyLeverage);
    const baseline = identifyActiveDimensions(rawBaseline, emptyConstraints, emptyLeverage);

    const hotDims = getDimensionsByStatus(baseline, "hot");
    const warmDims = getDimensionsByStatus(baseline, "warm");
    const activeDimCount = hotDims.length + warmDims.length;

    // Only call edge function if we have ≥2 active dimensions and enough evidence
    if (activeDimCount >= 2 && flat.length >= 18) {
      const payload = prepareEdgeFunctionPayload(
        baseline, emptyConstraints, emptyLeverage, input.analysisType
      );

      const { data, error } = await invokeWithTimeout<{ alternatives: DimensionAlternative[] }>(
        "generate-opportunity-vectors",
        { body: payload },
        120_000,
      );

      if (!error && data?.alternatives && data.alternatives.length > 0) {
        aiAlternatives = data.alternatives;
        console.log(`[Morphological] Received ${aiAlternatives.length} AI alternatives for ${activeDimCount} dimensions`);
      } else {
        console.warn("[Morphological] Edge function returned no alternatives, using fallback", error);
      }
    } else {
      console.log(`[Morphological] Skipping edge function: ${activeDimCount} active dims, ${flat.length} evidence`);
    }
  } catch (err) {
    console.warn("[Morphological] Failed to fetch AI alternatives, falling back to sync:", err);
  }

  // Run strategic analysis — with or without AI alternatives
  const result = runStrategicAnalysis(buildEngineInput(input, aiAlternatives));
  return buildOutput(result);
}
