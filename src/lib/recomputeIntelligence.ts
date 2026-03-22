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
  runStrategicAnalysisAsync,
  type StrategicAnalysisInput,
  type StrategicInsight,
} from "@/lib/strategicEngine";
import {
  extractBaseline,
  identifyActiveDimensions,
  getDimensionsByStatus,
  prepareEdgeFunctionPayload,
  runMorphologicalSearch,
  type DimensionAlternative,
} from "@/lib/opportunityDesignEngine";
import { buildDiagnosticContext, extractLensConfig } from "@/lib/diagnosticContext";
import {
  extractAllEvidence,
  flattenEvidence,
} from "@/lib/evidenceEngine";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { extractConstraintShapes, findAnalogs } from "@/lib/analogEngine";
import { generateInversions, type ConstraintInversion } from "@/lib/constraintInverter";
import { generateSecondOrderUnlocks, type SecondOrderUnlock } from "@/lib/secondOrderEngine";
import { generateTemporalUnlocks, type TemporalUnlock } from "@/lib/temporalArbitrageEngine";
import { exploreNegativeSpace, type CompetitiveGap } from "@/lib/negativeSpaceEngine";

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
  morphologicalZones?: import("@/lib/opportunityDesignEngine").OpportunityZone[];
  morphologicalVectors?: import("@/lib/opportunityDesignEngine").OpportunityVector[];
  constraintInversions?: ConstraintInversion[];
  secondOrderUnlocks?: SecondOrderUnlock[];
  temporalUnlocks?: TemporalUnlock[];
  competitiveGaps?: CompetitiveGap[];
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
    morphologicalZones: [],
    morphologicalVectors: [],
    constraintInversions: [],
    secondOrderUnlocks: [],
    temporalUnlocks: [],
    competitiveGaps: [],
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
  // Use the AI-powered async engine (falls back to deterministic internally)
  const asyncResult = await runStrategicAnalysisAsync(buildEngineInput(input));
  const asyncOutput = buildOutput(asyncResult);

  // Only attempt morphological exploration if we have sufficient structure
  const constraints = asyncResult.activeConstraints;
  const leveragePoints = asyncResult.insights.filter(i => i.insightType === "leverage_point");
  const flat = asyncResult.flatEvidence;

  const evidenceCount = flat.length;
  const hasSufficientConstraints = constraints.length >= 1;

  if (!hasSufficientConstraints || evidenceCount < 5) {
    console.log(`[Morphological] Skipping AI: ${constraints.length} constraints, ${evidenceCount} evidence`);
    return asyncOutput;
  }

  // Tiered run mode based on evidence depth
  const morphRunMode: "full" | "limited" | "inversions_only" =
    evidenceCount >= 18 ? "full" : evidenceCount >= 10 ? "limited" : "inversions_only";

  console.log(`[Morphological] Running in ${morphRunMode} mode (${evidenceCount} evidence items)`);

  // Build diagnostic context for mode-aware morphological search
  const morphContext = buildDiagnosticContext(input.analysisType, extractLensConfig(input.lensConfig as unknown as Record<string, unknown> | null));

  // Run morphological search deterministically — no AI cost, <100ms
  let morphologicalZones: import("@/lib/opportunityDesignEngine").OpportunityZone[] = [];
  let morphologicalVectors: import("@/lib/opportunityDesignEngine").OpportunityVector[] = [];
  if (morphRunMode === "full" || morphRunMode === "limited") {
    try {
      // Pass empty aiAlternatives — morphological search is purely deterministic (no AI cost)
      const morphResult = runMorphologicalSearch(flat, constraints, leveragePoints, [], morphContext);
      morphologicalZones = morphResult.zones;
      // Cap vectors in limited mode
      morphologicalVectors = morphRunMode === "limited" ? morphResult.vectors.slice(0, 3) : morphResult.vectors;
      console.log(`[Morphological] Auto-ran (${morphRunMode}): ${morphologicalVectors.length} vectors, ${morphologicalZones.length} zones`);
    } catch (err) {
      console.warn("[Morphological] Auto-run failed:", err);
    }
  }

  let aiAlternatives: DimensionAlternative[] | undefined;

  try {
    // Build baseline from Pass 1 results (with real constraints/leverage)
    const rawBaseline = extractBaseline(flat, constraints, leveragePoints);
    const baseline = identifyActiveDimensions(rawBaseline, constraints, leveragePoints, morphContext);

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

      console.log(`[Morphological] Skipping AI alternative generation (generate-opportunity-vectors removed). Using deterministic alternatives only.`);
      // generate-opportunity-vectors was removed in the architecture cleanup.
      // The deterministic engines (analogs, inversions, unlocks, temporal, gaps) above
      // already provide sufficient alternative generation without the AI call.

      // Surface the computed engine results instead of dropping them
      asyncOutput.constraintInversions = inversions.map(inv => ({
        id: inv.id,
        sourceConstraint: inv.sourceConstraint,
        inversionType: inv.inversionType,
        invertedFrame: inv.invertedFrame,
        mechanism: inv.mechanism,
        precedent: inv.precedent,
        requiredConditions: inv.requiredConditions,
        viability: inv.viability,
      }));
      asyncOutput.secondOrderUnlocks = unlocks.map(u => ({
        id: u.id,
        sourceConstraint: u.sourceConstraint,
        unlockedBusinessModel: u.unlockedBusinessModel,
        valueMechanism: u.valueMechanism,
        unlockPath: u.unlockPath,
        precedents: u.precedents,
        enablers: u.enablers,
        viability: u.viability,
      }));
      asyncOutput.temporalUnlocks = temporalUnlocks.map(t => ({
        id: t.id,
        recentChange: t.recentChange,
        changeTimeframe: t.changeTimeframe,
        changeCategory: t.changeCategory,
        previouslyImpossible: t.previouslyImpossible,
        nowPossible: t.nowPossible,
        unlockedDimension: t.unlockedDimension,
        timingEvidence: t.timingEvidence,
        timingWindow: t.timingWindow,
      }));
      asyncOutput.competitiveGaps = gaps.map(g => ({
        id: g.id,
        gapDescription: g.gapDescription,
        gapType: g.gapType,
        gapReason: g.gapReason,
        opportunityHypothesis: g.opportunityHypothesis,
        supportingEvidence: g.supportingEvidence,
        validationApproach: g.validationApproach,
        opportunityConfidence: g.opportunityConfidence,
      }));
    } else {
      console.log(`[Morphological] Only ${activeDimCount} active dims, skipping AI`);
    }
  } catch (err) {
    console.warn("[Morphological] Failed to fetch AI alternatives:", err);
  }

  // If no AI alternatives, return the async result
  if (!aiAlternatives || aiAlternatives.length === 0) {
    asyncOutput.morphologicalZones = morphologicalZones;
    asyncOutput.morphologicalVectors = morphologicalVectors;
    return asyncOutput;
  }

  // Pass 2: Re-run full pipeline with AI alternatives injected
  const enhancedResult = await runStrategicAnalysisAsync(buildEngineInput(input, aiAlternatives));
  const enhancedOutput = buildOutput(enhancedResult);
  enhancedOutput.morphologicalZones = morphologicalZones;
  enhancedOutput.morphologicalVectors = morphologicalVectors;
  enhancedOutput.constraintInversions = asyncOutput.constraintInversions;
  enhancedOutput.secondOrderUnlocks = asyncOutput.secondOrderUnlocks;
  enhancedOutput.temporalUnlocks = asyncOutput.temporalUnlocks;
  enhancedOutput.competitiveGaps = asyncOutput.competitiveGaps;
  return enhancedOutput;
}
