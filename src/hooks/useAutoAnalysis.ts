/**
 * AUTO-ANALYSIS ENGINE — Strategic Intelligence Hook
 *
 * Automatically recomputes strategic intelligence whenever the
 * evidence dataset changes (new pipeline steps complete).
 * Also exposes a manual runAnalysis() for explicit recompute.
 */

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import type { Evidence } from "@/lib/evidenceEngine";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  runStrategicAnalysis,
  runStrategicAnalysisAsync,
  type StrategicInsight,
  type StrategicNarrative,
  type StrategicAnalysisInput,
  type StrategicDiagnostic,
} from "@/lib/strategicEngine";
import { type InsightGraph } from "@/lib/insightGraph";
import {
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

export interface AutoAnalysisResult {
  intelligence: SystemIntelligence | null;
  graph: InsightGraph | null;
  evidence: Record<MetricDomain, MetricEvidence> | null;
  flatEvidence: Evidence[];
  insights: StrategicInsight[];
  opportunities: any[];
  narrative: StrategicNarrative | null;
  diagnostic: StrategicDiagnostic | null;
  scenarioComparison: ScenarioComparison | null;
  sensitivityReports: SensitivityReport[];
  deepenedOpportunities: DeepenedOpportunity[];
  isComputing: boolean;
  completedSteps: Set<string>;
  pipelineCompletion: number;
  runAnalysis: () => void;
  hasRun: boolean;
}

export function useAutoAnalysis(): AutoAnalysisResult {
  const analysis = useAnalysis();
  const {
    analysisId, products, selectedProduct,
    governedData, disruptData, redesignData,
    stressTestData, pitchDeckData, businessAnalysisData,
    geoData, regulatoryData, activeLens,
    saveStepData,
  } = analysis;

  const [intelligence, setIntelligence] = useState<SystemIntelligence | null>(null);
  const [graph, setGraph] = useState<InsightGraph | null>(null);
  const [evidence, setEvidence] = useState<Record<MetricDomain, MetricEvidence> | null>(null);
  const [flatEvidenceState, setFlatEvidenceState] = useState<Evidence[]>([]);
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [narrative, setNarrative] = useState<StrategicNarrative | null>(null);
  const [diagnostic, setDiagnostic] = useState<StrategicDiagnostic | null>(null);
  const [scenarioComparison, setScenarioComparison] = useState<ScenarioComparison | null>(null);
  const [sensitivityReports, setSensitivityReports] = useState<SensitivityReport[]>([]);
  const [deepenedOpportunities, setDeepenedOpportunities] = useState<DeepenedOpportunity[]>([]);
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

  // Run the full strategic analysis (async — AI-powered deepening)
  const runAnalysis = useCallback(() => {
    const hasComputableData = !!selectedProduct || !!businessAnalysisData || !!disruptData || !!redesignData || !!stressTestData;
    if (!analysisId || !hasComputableData) return;

    setIsComputing(true);

    // Build system intelligence (for legacy compat)
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

    // Build lens config for structural diagnosis
    const lensConfig = activeLens
      ? {
          lensType: (activeLens.id === "__eta__" ? "eta" : "custom") as "default" | "eta" | "custom",
          name: activeLens.name,
          risk_tolerance: activeLens.risk_tolerance ?? undefined,
          constraints: activeLens.constraints ?? undefined,
          primary_objective: activeLens.primary_objective ?? undefined,
          target_outcome: activeLens.target_outcome ?? undefined,
          time_horizon: activeLens.time_horizon ?? undefined,
          available_resources: activeLens.available_resources ?? undefined,
          evaluation_priorities: activeLens.evaluation_priorities ?? undefined,
        }
      : null;

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
      geoMarketData: geoData,
      regulatoryData,
      lensConfig,
    };

    const applyResult = (result: ReturnType<typeof runStrategicAnalysis>) => {
      setIntelligence(newIntelligence);
      setGraph(result.graph);
      setEvidence(result.evidence);
      setFlatEvidenceState(result.flatEvidence);
      setInsights(result.insights);
      setOpportunities(result.opportunities);
      setNarrative(result.narrative);
      setDiagnostic(result.diagnostic);
      setScenarioComparison(result.scenarioComparison);
      setSensitivityReports(result.sensitivityReports);
      setDeepenedOpportunities(result.deepenedOpportunities ?? []);
      setHasRun(true);

      console.log("[StrategicEngine] Analysis complete:", {
        evidence: result.flatEvidence.length,
        constraints: result.diagnostic.constraintCount,
        opportunities: result.diagnostic.opportunityCount,
        events: result.events,
      });

      if (result.structuralProfile) {
        const sp = result.structuralProfile;
        console.log("[Reconfiguration] Structural Profile:", {
          supplyFragmentation: sp.supplyFragmentation,
          marginStructure: sp.marginStructure,
          switchingCosts: sp.switchingCosts,
          distributionControl: sp.distributionControl,
          laborIntensity: sp.laborIntensity,
          revenueModel: sp.revenueModel,
          bindingConstraints: sp.bindingConstraints.map(c => c.constraintName),
          ...(sp.etaActive ? {
            etaActive: true,
            ownerDependency: sp.ownerDependency,
            acquisitionComplexity: sp.acquisitionComplexity,
            improvementRunway: sp.improvementRunway,
          } : {}),
        });
      }
      if (result.qualifiedPatterns.length > 0) {
        console.log("[Reconfiguration] Qualified Patterns:", result.qualifiedPatterns.map(qp => ({
          pattern: qp.pattern.name,
          signalDensity: qp.signalDensity,
          etaAdjustment: qp.etaAdjustment,
          bet: `"${qp.strategicBet.contrarianBelief}"`,
        })));
      }
      if (result.deepenedOpportunities.length > 0) {
        console.log("[Reconfiguration] Theses:", result.deepenedOpportunities.map(d => ({
          reconfiguration: d.reconfigurationLabel,
          constraint: d.causalChain.constraint,
          mechanism: d.economicMechanism.valueCreation,
          firstMove: d.firstMove.action.slice(0, 80),
        })));
      }

      // ── Persist strategic engine output for thesis auditing ──
      if (analysisId) {
        const strategicEnginePayload = {
          structuralProfile: result.structuralProfile ?? null,
          qualifiedPatterns: (result.qualifiedPatterns ?? []).map(qp => ({
            patternName: qp.pattern.name,
            signalDensity: qp.signalDensity,
            etaAdjustment: qp.etaAdjustment,
            strategicBet: qp.strategicBet,
          })),
          deepenedOpportunities: (result.deepenedOpportunities ?? []).map(d => ({
            reconfigurationLabel: d.reconfigurationLabel,
            causalChain: d.causalChain,
            economicMechanism: d.economicMechanism,
            firstMove: d.firstMove,
            aiDeepened: (d as any).aiDeepened ?? false,
          })),
          pipelineEvents: result.events ?? [],
          evidenceCount: result.flatEvidence.length,
          constraintCount: result.diagnostic.constraintCount,
          opportunityCount: result.diagnostic.opportunityCount,
          aiGateResult: (result.diagnostic as any).aiGateResult ?? null,
          computedAt: new Date().toISOString(),
        };
        saveStepData("strategicEngine", strategicEnginePayload).catch(err => {
          console.warn("[StrategicEngine] Failed to persist thesis data:", err);
        });
      }
    };

    // Run async (AI-powered) pipeline, then apply results
    runStrategicAnalysisAsync(input)
      .then(applyResult)
      .catch((err) => {
        console.warn("[StrategicEngine] Async failed, running sync fallback:", err);
        try {
          const syncResult = runStrategicAnalysis(input);
          applyResult(syncResult);
        } catch (syncErr) {
          console.warn("[StrategicEngine] Sync fallback also failed:", syncErr);
        }
      })
      .finally(() => setIsComputing(false));
  }, [
    analysisId, selectedProduct, governedData, disruptData, businessAnalysisData,
    products, redesignData, stressTestData, pitchDeckData, analysisMode, completedSteps,
    geoData, regulatoryData, activeLens,
  ]);

  // ── Auto-recompute whenever evidence dataset changes ──
  const evidenceHashRef = useRef<string>("");

  useEffect(() => {
    const hasComputableData = !!selectedProduct || !!businessAnalysisData || !!disruptData || !!redesignData || !!stressTestData;
    if (!analysisId || !hasComputableData || isComputing) return;

    const hash = [
      completedSteps.size,
      !!disruptData ? "d" : "",
      !!redesignData ? "r" : "",
      !!stressTestData ? "s" : "",
      !!pitchDeckData ? "p" : "",
      !!businessAnalysisData ? "b" : "",
    ].join("|");

    if (hash === evidenceHashRef.current) return;
    evidenceHashRef.current = hash;

    const timer = setTimeout(() => {
      console.log("[StrategicEngine] Auto-recompute triggered — evidence changed:", hash);
      runAnalysis();
    }, 400);
    return () => clearTimeout(timer);
  }, [analysisId, selectedProduct, businessAnalysisData, disruptData, redesignData, stressTestData, pitchDeckData, completedSteps, isComputing, runAnalysis]);

  return {
    intelligence,
    graph,
    evidence,
    flatEvidence: flatEvidenceState,
    insights,
    opportunities,
    narrative,
    diagnostic,
    scenarioComparison,
    sensitivityReports,
    deepenedOpportunities,
    isComputing,
    completedSteps,
    pipelineCompletion,
    runAnalysis,
    hasRun,
  };
}
