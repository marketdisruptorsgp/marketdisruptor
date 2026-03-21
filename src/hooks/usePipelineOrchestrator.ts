/**
 * PIPELINE ORCHESTRATOR — Thin hook wrapper around the state machine.
 *
 * All step logic lives in src/hooks/pipeline/ step runners.
 * This hook manages React state and wires the state machine to the AnalysisContext.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { toast } from "sonner";
import { runPipelineStateMachine, type PipelineResult } from "./pipeline/runPipelineStateMachine";
import { acquireKeepAlive, releaseKeepAlive } from "./pipeline/keepAlive";
import { setPipelineRunning } from "@/lib/pipelineSignal";
import { runDecompose } from "./pipeline/stepDecompose";
import { runStrategicSynthesis } from "./pipeline/stepSynthesis";
import { runConceptSynthesis } from "./pipeline/stepConcepts";
import { runStressTest } from "./pipeline/stepStressTest";
import { runPitch } from "./pipeline/stepPitch";
import { STEP_DEFS, type PipelineStepStatus, type StepTiming, type StepRunnerContext, type StepRunnerCallbacks, type StepDataStore } from "./pipeline/types";

export type { PipelineStepStatus, StepTiming };

export interface PipelineProgress {
  isRunning: boolean;
  currentStep: string | null;
  steps: { key: string; label: string; status: PipelineStepStatus; error?: string }[];
  completedCount: number;
  totalCount: number;
  retryStep: (stepKey: string) => void;
  runAllSteps: () => void;
  pipelineStartedAt: number | null;
  stepTimings: Record<string, StepTiming>;
  /** Last pipeline error — persists until next successful run */
  pipelineError: string | null;
}

export function usePipelineOrchestrator(
  onRecompute?: () => void,
  onStepComplete?: (stepKey: string) => void,
): PipelineProgress {
  const analysis = useAnalysis();
  const {
    step, selectedProduct, analysisId,
    decompositionData, disruptData, redesignData, stressTestData, pitchDeckData,
    setDecompositionData, setDisruptData, setRedesignData, setStressTestData, setPitchDeckData,
    setGovernedData, saveStepData, markStepOutdated, clearStepOutdated,
    conceptsData, setConceptsData,
    loadedFromSaved,
  } = analysis;

  const businessAnalysisData = (analysis as any).businessAnalysisData;
  const businessModelInput = (analysis as any).businessModelInput as { type?: string; description?: string } | null;

  const runningRef = useRef(false);
  const triggeredForRef = useRef<string | null>(null);
  const runAllRef = useRef(false);

  const [stepStatuses, setStepStatuses] = useState<Record<string, PipelineStepStatus>>({
    decompose: "pending", synthesis: "pending", concepts: "pending",
    stressTest: "pending", pitch: "pending",
  });
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [pipelineStartedAt, setPipelineStartedAt] = useState<number | null>(null);
  const [stepTimings, setStepTimings] = useState<Record<string, StepTiming>>({});
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  // Warn user on navigate-away during active pipeline
  useEffect(() => {
    if (!isRunning) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Analysis pipeline is still running.";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isRunning]);

  const updateStatus = useCallback((key: string, status: PipelineStepStatus, error?: string) => {
    setStepStatuses(prev => ({ ...prev, [key]: status }));
    if (status === "running") {
      setStepTimings(prev => ({ ...prev, [key]: { startedAt: Date.now() } }));
    } else if (status === "done" || status === "error") {
      setStepTimings(prev => {
        const existing = prev[key];
        if (!existing) return prev;
        const completedAt = Date.now();
        return { ...prev, [key]: { ...existing, completedAt, elapsedMs: completedAt - existing.startedAt } };
      });
    }
    if (error) {
      setStepErrors(prev => ({ ...prev, [key]: error }));
    } else if (status === "done" || status === "running") {
      setStepErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  }, []);

  // Synthetic product for business model analyses
  const effectiveProduct = selectedProduct || (businessAnalysisData ? {
    id: analysisId || "business-model",
    name: businessModelInput?.type || "Business Model",
    category: "Business", image: "", revivalScore: 0, flippedIdeas: [],
    description: businessModelInput?.description || "",
  } as any : null);

  // ── Build shared context/callbacks/store objects ──
  const buildCtx = useCallback((): StepRunnerContext => ({
    analysisId: analysisId!,
    product: effectiveProduct,
    extractedContext: analysis.adaptiveContext?.extractedContext || "",
    steeringText: (analysis as any).steeringText || undefined,
    adaptiveContext: analysis.adaptiveContext || undefined,
    activeMode: analysis.activeMode,
    insightPreferences: (analysis as any).insightPreferences || undefined,
    userScores: (analysis as any).userScores || undefined,
    analysisData: (analysis as any).analysisData || undefined,
    focusTerritory: (analysis.geoData as any)?.focusTerritory || undefined,
    activeLens: analysis.activeLens || undefined,
  }), [analysisId, effectiveProduct, analysis]);

  const buildCb = useCallback((): StepRunnerCallbacks => ({
    updateStatus,
    setCurrentStep,
    onRecompute,
    onStepComplete,
    saveStepData,
  }), [updateStatus, onRecompute, onStepComplete, saveStepData]);

  const buildStore = useCallback((): StepDataStore => ({
    decompositionData, disruptData, redesignData, stressTestData, pitchDeckData, conceptsData,
    businessAnalysisData, businessModelInput,
    setDecompositionData, setDisruptData, setRedesignData, setStressTestData, setPitchDeckData,
    setGovernedData, setConceptsData, clearStepOutdated,
  }), [decompositionData, disruptData, redesignData, stressTestData, pitchDeckData, conceptsData,
       businessAnalysisData, businessModelInput,
       setDecompositionData, setDisruptData, setRedesignData, setStressTestData, setPitchDeckData,
       setGovernedData, setConceptsData, clearStepOutdated]);

  // ── Run full pipeline ──
  const runPipeline = useCallback(async () => {
    if (!effectiveProduct || !analysisId) return;
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);
    setPipelineRunning(true);
    setPipelineStartedAt(Date.now());
    setPipelineError(null);
    acquireKeepAlive();
    setStepTimings({});

    const ctx = buildCtx();
    const cb = buildCb();
    const store = buildStore();

    let result: PipelineResult = { success: false, error: "Unknown error" };
    try {
      result = await runPipelineStateMachine(ctx, cb, store, {
        runAll: runAllRef.current,
        existingDecomp: decompositionData,
        existingDisrupt: disruptData,
        existingConcepts: conceptsData,
        existingStressTest: stressTestData,
        existingPitchDeck: pitchDeckData,
      });
    } catch (err) {
      console.error("[Pipeline] Unexpected pipeline error:", err);
      result = { success: false, error: String(err) };
    } finally {
      setCurrentStep(null);
      setIsRunning(false);
      setPipelineRunning(false);
      runningRef.current = false;
      runAllRef.current = false;
      releaseKeepAlive();

      if (!result.success) {
        setPipelineError(result.error || "Pipeline failed");
      }

      setStepStatuses(prev => {
        const coreSteps = ["decompose", "synthesis", "concepts"];
        const coreErrors = coreSteps.filter(k => prev[k] === "error").length;
        if (coreErrors > 0) {
          toast.warning(`Pipeline complete with ${coreErrors} step${coreErrors > 1 ? "s" : ""} needing attention.`);
        } else if (result.success) {
          toast.success("Analysis ready — explore your strategic intelligence.");
        }
        return prev;
      });
    }
  }, [effectiveProduct, analysisId, decompositionData, disruptData, redesignData, conceptsData, stressTestData, pitchDeckData, buildCtx, buildCb, buildStore]);

  // ── Retry a single failed step ──
  const retryStep = useCallback(async (stepKey: string) => {
    if (!effectiveProduct || !analysisId) return;
    const ctx = buildCtx();
    const cb = buildCb();
    const store = buildStore();

    try {
      switch (stepKey) {
        case "decompose":
          await runDecompose(ctx, cb, store);
          break;
        case "synthesis":
          await runStrategicSynthesis(ctx, cb, store, decompositionData);
          break;
        case "concepts":
          await runConceptSynthesis(ctx, cb, store, disruptData, decompositionData);
          break;
        case "stressTest":
          await runStressTest(ctx, cb, store, disruptData, decompositionData);
          break;
        case "pitch":
          await runPitch(ctx, cb, store, disruptData, stressTestData);
          break;
      }
    } catch (err) {
      console.error(`[Pipeline] Retry ${stepKey} failed:`, err);
      toast.error(`Retry failed for ${stepKey}`);
    }
  }, [effectiveProduct, analysisId, decompositionData, disruptData, stressTestData, buildCtx, buildCb, buildStore]);

  // Auto-trigger when analysis is done but missing core data.
  // Fresh analyses (not loaded from saved) trigger immediately — no hydration delay needed.
  // Saved analyses keep a 1500ms buffer to let hydration settle.
  useEffect(() => {
    const hasAnalyzableData = !!selectedProduct || !!businessAnalysisData;
    const hasMissingCoreStep = !disruptData || !decompositionData;
    if (
      step === "done" &&
      hasAnalyzableData &&
      analysisId &&
      hasMissingCoreStep &&
      !runningRef.current &&
      triggeredForRef.current !== analysisId
    ) {
      triggeredForRef.current = analysisId;
      const delayMs = loadedFromSaved ? 1500 : 0;
      console.log(`[Pipeline] Auto-trigger: missing core steps (delay=${delayMs}ms, saved=${loadedFromSaved})`);
      const timer = setTimeout(() => runPipeline(), delayMs);
      return () => clearTimeout(timer);
    }
  }, [step, selectedProduct, businessAnalysisData, analysisId, disruptData, decompositionData, runPipeline, loadedFromSaved]);

  const runAllSteps = useCallback(() => {
    runAllRef.current = true;
    runPipeline();
  }, [runPipeline]);

  const steps = STEP_DEFS.map(d => ({
    key: d.key, label: d.label,
    status: stepStatuses[d.key] || "pending",
    error: stepErrors[d.key],
  }));

  return {
    isRunning, currentStep, steps,
    completedCount: steps.filter(s => s.status === "done").length,
    totalCount: steps.length,
    retryStep, runAllSteps, pipelineStartedAt, stepTimings,
    pipelineError,
  };
}
