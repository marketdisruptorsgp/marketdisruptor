/**
 * AUTO-ANALYSIS ENGINE — Manual Strategic Analysis Trigger
 *
 * Watches for step completion to track pipeline state.
 * Intelligence is ONLY computed when the user explicitly clicks
 * "Run Strategic Analysis" on the Command Deck.
 *
 * No automatic insight generation. Steps only collect evidence.
 */

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  runStrategicAnalysis,
  type StrategicInsight,
  type StrategicNarrative,
  type StrategicAnalysisInput,
  type StrategicAnalysisOutput,
  type StrategicDiagnostic,
} from "@/lib/strategicEngine";
import { buildInsightGraph, type InsightGraph } from "@/lib/insightGraph";
import {
  extractAllEvidence,
  flattenEvidence,
  type MetricDomain,
  type MetricEvidence,
} from "@/lib/evidenceEngine";
import {
  buildSystemIntelligence,
  invalidateIntelligence,
  type SystemIntelligenceInput,
  type SystemIntelligence,
} from "@/lib/systemIntelligence";
import { type ScenarioComparison } from "@/lib/scenarioComparisonEngine";
import { type SensitivityReport } from "@/lib/sensitivityEngine";
import {
  computeCommandDeckMetrics,
  type CommandDeckMetrics,
} from "@/lib/commandDeckMetrics";

export interface AutoAnalysisResult {
  intelligence: SystemIntelligence | null;
  graph: InsightGraph | null;
  evidence: Record<MetricDomain, MetricEvidence> | null;
  insights: StrategicInsight[];
  opportunities: any[];
  narrative: StrategicNarrative | null;
  diagnostic: StrategicDiagnostic | null;
  scenarioComparison: ScenarioComparison | null;
  sensitivityReports: SensitivityReport[];
  isComputing: boolean;
  completedSteps: Set<string>;
  pipelineCompletion: number;
  /** Manually trigger the full strategic analysis */
  runAnalysis: () => void;
  /** Whether analysis has been run at least once */
  hasRun: boolean;
}

export function useAutoAnalysis(): AutoAnalysisResult {
  const analysis = useAnalysis();
  const {
    analysisId, products, selectedProduct,
    governedData, disruptData, redesignData,
    stressTestData, pitchDeckData, businessAnalysisData,
  } = analysis;

  const [intelligence, setIntelligence] = useState<SystemIntelligence | null>(null);
  const [graph, setGraph] = useState<InsightGraph | null>(null);
  const [evidence, setEvidence] = useState<Record<MetricDomain, MetricEvidence> | null>(null);
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [narrative, setNarrative] = useState<StrategicNarrative | null>(null);
  const [diagnostic, setDiagnostic] = useState<StrategicDiagnostic | null>(null);
  const [scenarioComparison, setScenarioComparison] = useState<ScenarioComparison | null>(null);
  const [sensitivityReports, setSensitivityReports] = useState<SensitivityReport[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  // Track completed steps
  const completedSteps = useMemo(() => {
    const set = new Set<string>();
    if (products.length > 0 || businessAnalysisData) set.add("report");
    if (disruptData) set.add("disrupt");
    if (redesignData) set.add("redesign");
    if (stressTestData) set.add("stress-test");
    if (pitchDeckData) set.add("pitch");
    return set;
  }, [products, businessAnalysisData, disruptData, redesignData, stressTestData, pitchDeckData]);

  const pipelineCompletion = Math.round((completedSteps.size / 5) * 100);

  // Infer analysis mode
  const analysisMode = useMemo(() => {
    const mode = (analysis as any).activeMode;
    if (mode === "service") return "service" as const;
    if (mode === "business") return "business_model" as const;
    return "product" as const;
  }, [(analysis as any).activeMode]);

  // Run the full strategic analysis
  const runAnalysis = useCallback(() => {
    const hasComputableData = !!selectedProduct || !!businessAnalysisData || !!disruptData || !!redesignData || !!stressTestData;
    if (!analysisId || !hasComputableData) return;

    setIsComputing(true);

    try {
      // Build system intelligence first (for legacy compat)
      invalidateIntelligence(analysisId);
      const siInput: SystemIntelligenceInput = {
        analysisId,
        governedData,
        disruptData: disruptData as Record<string, unknown> | null,
        businessAnalysisData: businessAnalysisData as Record<string, unknown> | null,
        intelData: null,
        flipIdeas: null,
        activeLenses: [],
      };
      const newIntelligence = buildSystemIntelligence(siInput);

      // Run the strategic engine
      const input: StrategicAnalysisInput = {
        products,
        selectedProduct,
        disruptData,
        redesignData,
        stressTestData,
        pitchDeckData,
        governedData,
        businessAnalysisData,
        intelligence: newIntelligence,
        analysisType: analysisMode,
        analysisId,
        completedSteps,
      };

      const result = runStrategicAnalysis(input);

      setIntelligence(newIntelligence);
      setGraph(result.graph);
      setEvidence(result.evidence);
      setInsights(result.insights);
      setOpportunities(result.opportunities);
      setNarrative(result.narrative);
      setDiagnostic(result.diagnostic);
      setScenarioComparison(result.scenarioComparison);
      setSensitivityReports(result.sensitivityReports);
      setHasRun(true);

      console.log("[StrategicEngine] Analysis complete:", {
        evidence: result.flatEvidence.length,
        constraints: result.diagnostic.constraintCount,
        drivers: result.diagnostic.driverCount,
        leverage: result.diagnostic.leverageCount,
        opportunities: result.diagnostic.opportunityCount,
        pathways: result.diagnostic.pathwayCount,
      });
    } catch (err) {
      console.warn("[StrategicEngine] Computation error:", err);
    } finally {
      setIsComputing(false);
    }
  }, [
    analysisId, selectedProduct, governedData, disruptData, businessAnalysisData,
    products, redesignData, stressTestData, pitchDeckData, analysisMode, completedSteps,
  ]);

  // Auto-run on first load if data exists (to show existing analysis results)
  useEffect(() => {
    const hasComputableData = !!selectedProduct || !!businessAnalysisData || !!disruptData || !!redesignData || !!stressTestData;
    if (analysisId && hasComputableData && !hasRun && !isComputing) {
      runAnalysis();
    }
  }, [analysisId, selectedProduct, businessAnalysisData, disruptData, redesignData, stressTestData, hasRun, isComputing, runAnalysis]);

  return {
    intelligence,
    graph,
    evidence,
    insights,
    opportunities,
    narrative,
    diagnostic,
    scenarioComparison,
    sensitivityReports,
    isComputing,
    completedSteps,
    pipelineCompletion,
    runAnalysis,
    hasRun,
  };
}
