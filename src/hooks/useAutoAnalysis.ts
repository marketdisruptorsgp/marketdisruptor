/**
 * AUTO-ANALYSIS ENGINE — Strategic Intelligence Hook
 *
 * Thin orchestrator that composes focused sub-modules:
 * - useEngineReset: clears state on analysis switch
 * - useEngineHydration: restores persisted engine state from DB
 * - useEvidenceRecompute: auto-triggers recompute on evidence changes
 * - runMorphologicalEngines: deterministic constraint/opportunity search
 * - persistEngineState: saves engine + graph to Supabase
 */

import { useRef, useCallback, useMemo, useState } from "react";
import type { Evidence } from "@/lib/evidenceEngine";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { isPipelineRunning } from "@/lib/pipelineSignal";
import {
  runStrategicAnalysis,
  runStrategicAnalysisAsync,
  type StrategicInsight,
  type StrategicNarrative,
  type StrategicAnalysisInput,
  type StrategicDiagnostic,
} from "@/lib/strategicEngine";
import { type InsightGraph } from "@/lib/insightGraph";
import { type MetricDomain, type MetricEvidence } from "@/lib/evidenceEngine";
import type { StructuralProfile } from "@/lib/reconfiguration";
import {
  buildSystemIntelligence,
  invalidateIntelligence,
  type SystemIntelligenceInput,
  type SystemIntelligence,
} from "@/lib/systemIntelligence";
import { type ScenarioComparison } from "@/lib/scenarioComparisonEngine";
import { type SensitivityReport } from "@/lib/sensitivityEngine";
import { type OpportunityZone, type OpportunityVector } from "@/lib/opportunityDesignEngine";
import { type ConstraintInversion } from "@/lib/constraintInverter";
import { type SecondOrderUnlock } from "@/lib/secondOrderEngine";
import { type TemporalUnlock } from "@/lib/temporalArbitrageEngine";
import { type CompetitiveGap } from "@/lib/negativeSpaceEngine";
import { extractLensConfig } from "@/lib/diagnosticContext";

// Decomposed modules
import { type AutoAnalysisResult, type EngineSetters } from "./autoAnalysis/types";
import { useEngineReset } from "./autoAnalysis/useEngineReset";
import { useEngineHydration } from "./autoAnalysis/useEngineHydration";
import { useEvidenceRecompute } from "./autoAnalysis/useEvidenceRecompute";
import { runMorphologicalEngines } from "./autoAnalysis/runMorphologicalEngines";
import { persistEngineState } from "./autoAnalysis/persistEngineState";

export type { AutoAnalysisResult };

export function useAutoAnalysis(): AutoAnalysisResult {
  const analysis = useAnalysis();
  const {
    analysisId, products, selectedProduct,
    governedData, disruptData, redesignData,
    stressTestData, pitchDeckData, businessAnalysisData,
    geoData, regulatoryData, activeLens,
    saveStepData, isHydrating,
  } = analysis;

  // ── State ──
  const [intelligence, setIntelligence] = useState<SystemIntelligence | null>(null);
  const [structuralProfile, setStructuralProfile] = useState<StructuralProfile | null>(null);
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
  const [morphologicalZones, setMorphologicalZones] = useState<OpportunityZone[]>([]);
  const [morphologicalVectors, setMorphologicalVectors] = useState<OpportunityVector[]>([]);
  const [constraintInversions, setConstraintInversions] = useState<ConstraintInversion[]>([]);
  const [secondOrderUnlocks, setSecondOrderUnlocks] = useState<SecondOrderUnlock[]>([]);
  const [temporalUnlocks, setTemporalUnlocks] = useState<TemporalUnlock[]>([]);
  const [competitiveGaps, setCompetitiveGaps] = useState<CompetitiveGap[]>([]);
  const [isComputing, setIsComputing] = useState(false);
  const isComputingRef = useRef(false);
  const [hasRun, setHasRun] = useState(false);
  const runIdRef = useRef(0);
  const hydratedRef = useRef(false);

  const setters: EngineSetters = useMemo(() => ({
    setIntelligence, setStructuralProfile, setGraph, setEvidence,
    setFlatEvidenceState, setInsights, setOpportunities, setNarrative,
    setDiagnostic, setScenarioComparison, setSensitivityReports,
    setDeepenedOpportunities, setMorphologicalZones, setMorphologicalVectors,
    setConstraintInversions, setSecondOrderUnlocks, setTemporalUnlocks,
    setCompetitiveGaps, setIsComputing, setHasRun,
  }), []);

  // ── Reset on analysis switch ──
  useEngineReset(analysisId, setters, isComputingRef, hydratedRef, runIdRef);

  // ── Completed steps tracking ──
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

  const analysisMode = useMemo(() => {
    const mode = (analysis as any).activeMode;
    if (mode === "service") return "service" as const;
    if (mode === "business") return "business_model" as const;
    return "product" as const;
  }, [(analysis as any).activeMode]);

  // ── Core recompute function ──
  const runAnalysis = useCallback(() => {
    const hasComputableData = !!selectedProduct || !!businessAnalysisData || !!disruptData || !!redesignData || !!stressTestData;
    if (!analysisId || !hasComputableData) return;
    if (isHydrating) return;

    const thisRunId = ++runIdRef.current;
    setIsComputing(true);
    isComputingRef.current = true;

    // Build system intelligence
    invalidateIntelligence(analysisId);
    const siInput: SystemIntelligenceInput = {
      analysisId, governedData,
      disruptData: disruptData as Record<string, unknown> | null,
      businessAnalysisData: businessAnalysisData as Record<string, unknown> | null,
      intelData: null, flipIdeas: null, activeLenses: [],
    };
    const newIntelligence = buildSystemIntelligence(siInput);

    // Lens config
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

    const biExtraction = (analysis as any)?.biExtraction ?? (analysis as any)?.adaptiveContext?.biExtraction ?? null;

    const input: StrategicAnalysisInput = {
      products, selectedProduct, disruptData, redesignData,
      stressTestData, pitchDeckData, governedData, businessAnalysisData,
      intelligence: newIntelligence, analysisType: analysisMode,
      analysisId, completedSteps,
      geoMarketData: geoData, regulatoryData, lensConfig, biExtraction,
      suppressAIDeepening: isPipelineRunning(),
    };

    const applyResult = (result: ReturnType<typeof runStrategicAnalysis>) => {
      if (thisRunId !== runIdRef.current) {
        console.log("[StrategicEngine] Skipping stale run result (run", thisRunId, "superseded by", runIdRef.current, ")");
        return;
      }

      // Apply core state
      setIntelligence(newIntelligence);
      setStructuralProfile(result.structuralProfile ?? null);
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

      // Run deterministic morphological engines
      const morphResult = runMorphologicalEngines(
        result.flatEvidence,
        result.activeConstraints ?? [],
        result.insights ?? [],
        analysisMode,
        lensConfig as Record<string, unknown> | null,
      );
      setMorphologicalZones(morphResult.zones);
      setMorphologicalVectors(morphResult.vectors);
      setConstraintInversions(morphResult.constraintInversions);
      setSecondOrderUnlocks(morphResult.secondOrderUnlocks);
      setTemporalUnlocks(morphResult.temporalUnlocks);
      setCompetitiveGaps(morphResult.competitiveGaps);

      // Log diagnostics
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

      // Persist to DB
      const capturedAnalysisId = analysisId;
      if (capturedAnalysisId) {
        persistEngineState(result, capturedAnalysisId, saveStepData);
      }
    };

    // Safety timeout: force-clear isComputing after 45s
    const safetyTimer = setTimeout(() => {
      if (isComputingRef.current && thisRunId === runIdRef.current) {
        console.warn("[StrategicEngine] Safety timeout — force-clearing isComputing after 45s");
        setIsComputing(false);
        isComputingRef.current = false;
      }
    }, 45_000);

    // Run async pipeline, sync fallback
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
      .finally(() => {
        clearTimeout(safetyTimer);
        if (thisRunId === runIdRef.current) {
          setIsComputing(false);
          isComputingRef.current = false;
        }
      });
  }, [
    analysisId, selectedProduct, governedData, disruptData, businessAnalysisData,
    products, redesignData, stressTestData, pitchDeckData, analysisMode, completedSteps,
    geoData, regulatoryData, activeLens, isHydrating,
  ]);

  // ── Hydrate from DB on load ──
  useEngineHydration(analysisId, hasRun, narrative, deepenedOpportunities, hydratedRef, setters, runAnalysis);

  // ── Auto-recompute on evidence changes ──
  useEvidenceRecompute(
    analysisId, selectedProduct, businessAnalysisData,
    disruptData, redesignData, stressTestData, pitchDeckData,
    completedSteps, isComputing, isComputingRef, isHydrating, runAnalysis,
  );

  return {
    intelligence, structuralProfile, graph, evidence,
    flatEvidence: flatEvidenceState,
    insights, opportunities, narrative, diagnostic,
    scenarioComparison, sensitivityReports, deepenedOpportunities,
    morphologicalZones, morphologicalVectors,
    constraintInversions, secondOrderUnlocks, temporalUnlocks, competitiveGaps,
    isComputing, completedSteps, pipelineCompletion, runAnalysis, hasRun,
  };
}
