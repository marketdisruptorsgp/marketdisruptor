/**
 * RECOMPUTE INTELLIGENCE — Delegates to Strategic Engine
 *
 * Single entry point for full intelligence recomputation.
 * Provides both sync (fallback) and async (morphological) paths.
 *
 * The async path:
 *   1. Runs deterministic analysis FIRST (evidence → constraints)
 *   2. Uses constraint results to inform AI alternative generation
 *   3. Re-runs full pipeline with AI alternatives injected
 */

import { type Evidence, type MetricDomain, type MetricEvidence } from "@/lib/evidenceEngine";
import type { ConstraintHypothesisSet } from "@/lib/constraintDetectionEngine";
import type { ConstraintInteractionSet } from "@/lib/constraintInteractionEngine";
import type { SeverityReport } from "@/lib/constraintSeverityEngine";
import type { ViabilityReport } from "@/lib/viabilityEngine";
import type { MarketStructureReport } from "@/lib/marketStructureEngine";

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
import { extractConstraintShapes, findAnalogs } from "@/lib/analogEngine";
import { generateInversions } from "@/lib/constraintInverter";
import { generateSecondOrderUnlocks } from "@/lib/secondOrderEngine";
import { generateTemporalUnlocks } from "@/lib/temporalArbitrageEngine";
import { exploreNegativeSpace } from "@/lib/negativeSpaceEngine";

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
  geoMarketData?: any | null;
  regulatoryData?: any | null;
  lensConfig?: import("@/lib/reconfiguration/structuralProfile").DiagnosisLensConfig | null;
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
  constraintHypotheses: ConstraintHypothesisSet | null;
  legacyConstraints: StrategicInsight[];
  activeConstraints: StrategicInsight[];
  constraintInteractions: ConstraintInteractionSet | null;
  severityReport: SeverityReport | null;
  viabilityReport: ViabilityReport | null;
  marketStructure: MarketStructureReport | null;
}

// ═══════════════════════════════════════════════════════════════
//  BUILD ENGINE INPUT
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
    geoMarketData: input.geoMarketData,
    regulatoryData: input.regulatoryData,
    lensConfig: input.lensConfig,
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
    constraintHypotheses: result.constraintHypotheses,
    legacyConstraints: result.legacyConstraints,
    activeConstraints: result.activeConstraints,
    constraintInteractions: result.constraintInteractions,
    severityReport: result.severityReport,
    viabilityReport: result.viabilityReport,
    marketStructure: result.marketStructure,
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
//  ASYNC RECOMPUTE — Constraints-first, then AI exploration
// ═══════════════════════════════════════════════════════════════

/**
 * Two-pass pipeline:
 *   Pass 1: Run deterministic analysis to get constraints and leverage
 *   Pass 2: Use constraint structure to target AI alternative generation
 *   Pass 3: Re-run full pipeline with AI alternatives injected
 *
 * Falls back to sync (Pass 1) result if AI step fails.
 */
export async function recomputeIntelligenceAsync(input: IntelligenceInput): Promise<IntelligenceOutput> {
  // Pass 1: Full deterministic analysis (no AI)
  const syncResult = runStrategicAnalysis(buildEngineInput(input));
  const syncOutput = buildOutput(syncResult);

  // Only attempt AI exploration if we have sufficient structure
  const constraints = syncResult.activeConstraints;
  const leveragePoints = syncResult.insights.filter(i => i.insightType === "leverage_point");
  const flat = syncResult.flatEvidence;

  if (constraints.length < 1 || flat.length < 18) {
    console.log(`[Morphological] Skipping AI: ${constraints.length} constraints, ${flat.length} evidence`);
    return syncOutput;
  }

  let aiAlternatives: DimensionAlternative[] | undefined;

  try {
    // Build baseline from Pass 1 results (with real constraints/leverage)
    const rawBaseline = extractBaseline(flat, constraints, leveragePoints);
    const baseline = identifyActiveDimensions(rawBaseline, constraints, leveragePoints);

    const hotDims = getDimensionsByStatus(baseline, "hot");
    const warmDims = getDimensionsByStatus(baseline, "warm");
    const activeDimCount = hotDims.length + warmDims.length;

    if (activeDimCount >= 2) {
      const payload = prepareEdgeFunctionPayload(
        baseline, constraints, leveragePoints, input.analysisType
      );

      // ── Layer 2: Inject cross-industry analogs ──────────────────────
      // Extract constraint shapes and find cross-domain analogs from different industries
      const constraintShapes = extractConstraintShapes(constraints, flat);
      const analogMatches = findAnalogs(constraintShapes, 2, 5);

      // ── Layer 3: Inject constraint inversions ───────────────────────
      // Generate inversions — exploring if constraints can become competitive advantages
      const inversions = generateInversions(constraintShapes, 2, 4);

      // ── Layer 4: Inject second-order unlocks ────────────────────────
      // Explore what becomes possible if constraints were removed
      const unlocks = generateSecondOrderUnlocks(constraintShapes, 2, 4);

      // ── Layer 5: Inject temporal arbitrage ──────────────────────────
      // Find ideas that exploit recent changes (were impossible 1-2 years ago)
      const temporalUnlocks = generateTemporalUnlocks(constraintShapes, [...hotDims, ...warmDims], 5);

      // ── Layer 6: Explore competitive negative space ─────────────────
      // Identify what NO competitor is doing and why
      const gaps = exploreNegativeSpace(flat, [...hotDims, ...warmDims], 4);

      // Enrich payload with all strategic reasoning layers
      const enrichedPayload = {
        ...payload,
        crossIndustryAnalogs: analogMatches.map(m => ({
          company: m.analog.company,
          industry: m.analog.industry,
          constraintShape: m.analog.constraintShape,
          solutionMechanism: m.analog.solutionMechanism,
          structuralShift: m.analog.structuralShift,
          transferInsight: m.analog.transferInsight,
          targetConstraint: m.targetConstraint.sourceConstraintLabel,
        })),
        constraintInversions: inversions.map(inv => ({
          sourceConstraintLabel: inv.sourceConstraint.sourceConstraintLabel,
          invertedFrame: inv.invertedFrame,
          mechanism: inv.mechanism,
          precedent: inv.precedent,
          viability: inv.viability,
        })),
        secondOrderUnlocks: unlocks.map(u => ({
          sourceConstraintLabel: u.sourceConstraint.sourceConstraintLabel,
          unlockedBusinessModel: u.unlockedBusinessModel,
          valueMechanism: u.valueMechanism,
          precedents: u.precedents,
          viability: u.viability,
        })),
        temporalUnlocks: temporalUnlocks.map(t => ({
          recentChange: t.recentChange,
          previouslyImpossible: t.previouslyImpossible,
          nowPossible: t.nowPossible,
          timingEvidence: t.timingEvidence,
          timingWindow: t.timingWindow,
        })),
        competitiveGaps: gaps.map(g => ({
          gapDescription: g.gapDescription,
          opportunityHypothesis: g.opportunityHypothesis,
          gapReason: g.gapReason,
          opportunityConfidence: g.opportunityConfidence,
        })),
      };

      console.log(`[Morphological] Injecting ${analogMatches.length} analogs + ${inversions.length} inversions + ${unlocks.length} unlocks + ${temporalUnlocks.length} temporal + ${gaps.length} gaps into AI prompt`);

      const { data, error } = await invokeWithTimeout<{ alternatives: DimensionAlternative[] }>(
        "generate-opportunity-vectors",
        { body: enrichedPayload },
        120_000,
      );

      if (!error && data?.alternatives && data.alternatives.length > 0) {
        aiAlternatives = data.alternatives;
        console.log(`[Morphological] Received ${aiAlternatives.length} AI alternatives for ${activeDimCount} dimensions (full multi-lens enrichment)`);
      } else {
        console.warn("[Morphological] Edge function returned no alternatives", error);
      }
    } else {
      console.log(`[Morphological] Only ${activeDimCount} active dims, skipping AI`);
    }
  } catch (err) {
    console.warn("[Morphological] Failed to fetch AI alternatives:", err);
  }

  // If no AI alternatives, return the sync result
  if (!aiAlternatives || aiAlternatives.length === 0) {
    return syncOutput;
  }

  // Pass 2: Re-run full pipeline with AI alternatives injected
  const enhancedResult = runStrategicAnalysis(buildEngineInput(input, aiAlternatives));
  return buildOutput(enhancedResult);
}
