/**
 * AUTO-ANALYSIS ENGINE
 *
 * Replaces manual "Run Analysis" triggers with automatic debounced computation.
 * Watches for step completion, input changes, and navigation events.
 * Produces canonical Evidence, SystemIntelligence, InsightGraph,
 * ScenarioComparison, and SensitivityReports.
 *
 * Includes full pipeline diagnostics tracing and hash-guarded recompute.
 */

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  clusterEvidenceIntoInsights,
  generateOpportunities,
  generateStrategicNarrative,
  type Insight,
  type Opportunity,
  type StrategicNarrative,
} from "@/lib/insightLayer";
import {
  buildSystemIntelligence,
  invalidateIntelligence,
  type SystemIntelligenceInput,
  type SystemIntelligence,
} from "@/lib/systemIntelligence";
import { buildInsightGraph, type InsightGraph } from "@/lib/insightGraph";
import {
  extractAllEvidence,
  flattenEvidence,
  type MetricDomain,
  type MetricEvidence,
} from "@/lib/evidenceEngine";
import { getScenarios, allScenariosToEvidence } from "@/lib/scenarioEngine";
import { compareScenarios, type ScenarioComparison } from "@/lib/scenarioComparisonEngine";
import { computeAllSensitivityReports, type SensitivityReport } from "@/lib/sensitivityEngine";
import { traceStage, buildDiagnostic, type PipelineStageResult } from "@/lib/pipelineDiagnostics";

const DEBOUNCE_MS = 600;

export interface AutoAnalysisResult {
  intelligence: SystemIntelligence | null;
  graph: InsightGraph | null;
  evidence: Record<MetricDomain, MetricEvidence> | null;
  insights: Insight[];
  opportunities: Opportunity[];
  narrative: StrategicNarrative | null;
  scenarioComparison: ScenarioComparison | null;
  sensitivityReports: SensitivityReport[];
  isComputing: boolean;
  completedSteps: Set<string>;
  pipelineCompletion: number;
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
  const [insights, setInsights] = useState<Insight[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [narrative, setNarrative] = useState<StrategicNarrative | null>(null);
  const [scenarioComparison, setScenarioComparison] = useState<ScenarioComparison | null>(null);
  const [sensitivityReports, setSensitivityReports] = useState<SensitivityReport[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (mode === "service") return "service";
    if (mode === "business") return "business_model";
    return "product";
  }, [(analysis as any).activeMode]);

  // Core computation function
  const compute = useCallback(() => {
    const hasComputableData = !!selectedProduct || !!businessAnalysisData || !!disruptData || !!redesignData || !!stressTestData;
    if (!analysisId || !hasComputableData) {
      setIntelligence(null);
      setGraph(null);
      setEvidence(null);
      return;
    }

    setIsComputing(true);

    try {
      const stages: PipelineStageResult[] = [];
      invalidateIntelligence(analysisId);

      const input: SystemIntelligenceInput = {
        analysisId,
        governedData,
        disruptData: disruptData as Record<string, unknown> | null,
        businessAnalysisData: businessAnalysisData as Record<string, unknown> | null,
        intelData: null,
        flipIdeas: null,
        activeLenses: [],
      };

      const { result: newIntelligence, stage: s0 } = traceStage("System Intelligence", 1, () =>
        buildSystemIntelligence(input)
      );
      stages.push(s0);

      // ── Evidence Pipeline ──
      const { result: newEvidence, stage: s1 } = traceStage("Evidence Extraction", 1, () =>
        extractAllEvidence({
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
        })
      );
      stages.push(s1);

      // Step 2: Merge simulation evidence
      const allEvItems = Object.values(newEvidence).flatMap(m => m.items);
      const mode = analysisMode === "service" ? "service" as const
        : analysisMode === "business_model" ? "business_model" as const
        : "product" as const;
      const simEvidence = allScenariosToEvidence(analysisId, mode);
      const mergedEvidence = simEvidence.length > 0 ? [...allEvItems, ...simEvidence] : allEvItems;

      // Step 3: Cluster evidence into Insights
      const { result: newInsights, stage: s2 } = traceStage("Insight Clustering", mergedEvidence.length, () =>
        clusterEvidenceIntoInsights(mergedEvidence)
      );
      stages.push(s2);

      // Log insight type distribution
      const insightsByType: Record<string, number> = {};
      for (const ins of newInsights) {
        insightsByType[ins.insightType] = (insightsByType[ins.insightType] || 0) + 1;
      }
      console.log("[AutoAnalysis] Insight distribution:", insightsByType);

      // Step 4: Generate opportunities from insights
      const { result: newOpps, stage: s3 } = traceStage("Opportunity Generation", newInsights.length, () =>
        generateOpportunities(newInsights, mergedEvidence)
      );
      stages.push(s3);

      // Step 5: Generate strategic narrative
      const newNarrative = generateStrategicNarrative(newInsights, mergedEvidence);

      // Step 6: Scenario comparison & sensitivity (needed before graph)
      const scenarios = getScenarios(analysisId);
      const newComparison = scenarios.length > 0 ? compareScenarios(scenarios) : null;
      const newSensitivity = computeAllSensitivityReports(scenarios);

      // Step 7: Build insight graph from evidence + insights + scenarios
      const insightsForGraph = newInsights.map(i => ({
        id: i.id, label: i.label, description: i.description,
        insightType: i.insightType, impact: i.impact,
        confidenceScore: i.confidenceScore, evidenceIds: i.evidenceIds,
        recommendedTools: i.recommendedTools,
      }));
      const scenariosForGraph = newComparison?.scenarios;

      const { result: newGraph, stage: s4 } = traceStage("Graph Construction", mergedEvidence.length + newInsights.length, () =>
        buildInsightGraph(
          newEvidence, undefined, undefined, undefined, undefined,
          insightsForGraph.length > 0 ? insightsForGraph : undefined,
          scenariosForGraph && scenariosForGraph.length > 0 ? scenariosForGraph : undefined,
        )
      );
      stages.push(s4);

      // Build diagnostic summary
      buildDiagnostic(stages, newGraph.nodes, mergedEvidence.length, newInsights.length, scenarios.length);

      setIntelligence(newIntelligence);
      setGraph(newGraph);
      setEvidence(newEvidence);
      setInsights(newInsights);
      setOpportunities(newOpps);
      setNarrative(newNarrative);
      setScenarioComparison(newComparison);
      setSensitivityReports(newSensitivity);
    } catch (err) {
      console.warn("[AutoAnalysis] Computation error:", err);
    } finally {
      setIsComputing(false);
    }
  }, [analysisId, selectedProduct, governedData, disruptData, businessAnalysisData, products, redesignData, stressTestData, pitchDeckData, analysisMode]);

  // Debounced recompute on data changes
  useEffect(() => {
    const hasComputableData = !!selectedProduct || !!businessAnalysisData || !!disruptData || !!redesignData || !!stressTestData;
    if (!analysisId || !hasComputableData) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      compute();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    analysisId, selectedProduct, businessAnalysisData,
    governedData, disruptData, redesignData,
    stressTestData, pitchDeckData,
    compute,
  ]);

  // Initial compute
  useEffect(() => {
    const hasComputableData = !!selectedProduct || !!businessAnalysisData || !!disruptData || !!redesignData || !!stressTestData;
    if (analysisId && hasComputableData && !intelligence) {
      compute();
    }
  }, [analysisId, selectedProduct, businessAnalysisData, disruptData, redesignData, stressTestData, compute, intelligence]);

  return {
    intelligence,
    graph,
    evidence,
    insights,
    opportunities,
    narrative,
    scenarioComparison,
    sensitivityReports,
    isComputing,
    completedSteps,
    pipelineCompletion,
  };
}
