/**
 * PIPELINE ORCHESTRATOR — Auto-runs all pipeline steps after analysis creation
 *
 * When analysis reaches "done" state with a selected product but no step data,
 * this hook sequentially invokes all 5 edge functions, saves results to
 * context + DB, then triggers a strategic recompute.
 *
 * Pipeline: Disrupt → Redesign → Stress Test → Pitch → Recompute
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { toast } from "sonner";

export type PipelineStepStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface PipelineProgress {
  isRunning: boolean;
  currentStep: string | null;
  steps: { key: string; label: string; status: PipelineStepStatus }[];
  completedCount: number;
  totalCount: number;
}

const STEP_DEFS = [
  { key: "disrupt", label: "Structural Analysis" },
  { key: "redesign", label: "Redesign Concept" },
  { key: "stressTest", label: "Strategy Development" },
  { key: "pitch", label: "Pitch Synthesis" },
] as const;

export function usePipelineOrchestrator(
  onRecompute?: () => void,
): PipelineProgress {
  const analysis = useAnalysis();
  const {
    step, selectedProduct, analysisId,
    disruptData, redesignData, stressTestData, pitchDeckData,
    setDisruptData, setRedesignData, setStressTestData, setPitchDeckData,
    setGovernedData, saveStepData, markStepOutdated, clearStepOutdated,
  } = analysis;

  const runningRef = useRef(false);
  const triggeredForRef = useRef<string | null>(null);

  const [stepStatuses, setStepStatuses] = useState<Record<string, PipelineStepStatus>>({
    disrupt: "pending",
    redesign: "pending",
    stressTest: "pending",
    pitch: "pending",
  });
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const updateStatus = useCallback((key: string, status: PipelineStepStatus) => {
    setStepStatuses(prev => ({ ...prev, [key]: status }));
  }, []);

  const runPipeline = useCallback(async () => {
    if (!selectedProduct || !analysisId) return;
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);

    const product = selectedProduct;

    // ── Step 1: Disrupt (first-principles-analysis) ──
    let disruptResult: unknown = null;
    try {
      setCurrentStep("disrupt");
      updateStatus("disrupt", "running");
      
      const upstreamIntel: Record<string, unknown> = {};
      const pp = product as any;
      if (pp.pricingIntel) upstreamIntel.pricingIntel = pp.pricingIntel;
      if (pp.supplyChain) upstreamIntel.supplyChain = pp.supplyChain;

      const { data: result, error } = await invokeWithTimeout("first-principles-analysis", {
        body: {
          product,
          upstreamIntel: Object.keys(upstreamIntel).length > 0 ? upstreamIntel : undefined,
          adaptiveContext: analysis.adaptiveContext || undefined,
        },
      }, 180_000);

      if (error || !result?.success) {
        console.warn("[Pipeline] Disrupt failed:", result?.error || error?.message);
        updateStatus("disrupt", "error");
      } else {
        disruptResult = result.analysis;
        setDisruptData(disruptResult);
        await saveStepData("disrupt", disruptResult, analysisId);
        updateStatus("disrupt", "done");
      }
    } catch (err) {
      console.warn("[Pipeline] Disrupt error:", err);
      updateStatus("disrupt", "error");
    }

    // ── Step 2: Redesign (first-principles-analysis with redesign mode) ──
    let redesignResult: unknown = null;
    try {
      setCurrentStep("redesign");
      updateStatus("redesign", "running");

      const requestBody: Record<string, unknown> = {
        product,
        adaptiveContext: analysis.adaptiveContext || undefined,
      };
      if (disruptResult) {
        const dd = disruptResult as Record<string, unknown>;
        requestBody.disruptContext = {
          hiddenAssumptions: dd.hiddenAssumptions || null,
          flippedLogic: dd.flippedLogic || null,
        };
      }
      if (analysis.governedData) {
        requestBody.governedContext = {
          reasoning_synopsis: analysis.governedData.reasoning_synopsis,
          constraint_map: analysis.governedData.constraint_map,
          root_hypotheses: analysis.governedData.root_hypotheses,
        };
      }

      const { data: result, error } = await invokeWithTimeout("first-principles-analysis", {
        body: requestBody,
      }, 180_000);

      if (error || !result?.success) {
        console.warn("[Pipeline] Redesign failed:", result?.error || error?.message);
        updateStatus("redesign", "error");
      } else {
        redesignResult = result.analysis;
        setRedesignData(redesignResult);
        await saveStepData("redesign", redesignResult, analysisId);
        clearStepOutdated("redesign");
        updateStatus("redesign", "done");
      }
    } catch (err) {
      console.warn("[Pipeline] Redesign error:", err);
      updateStatus("redesign", "error");
    }

    // ── Step 3: Stress Test (critical-validation) ──
    let stressResult: unknown = null;
    try {
      setCurrentStep("stressTest");
      updateStatus("stressTest", "running");

      const { data: result, error } = await invokeWithTimeout("critical-validation", {
        body: {
          product,
          analysisData: product,
          adaptiveContext: analysis.adaptiveContext || undefined,
        },
      }, 180_000);

      if (error || !result?.success) {
        console.warn("[Pipeline] Stress Test failed:", result?.error || error?.message);
        updateStatus("stressTest", "error");
      } else {
        stressResult = result.validation || result;
        setStressTestData(stressResult);
        await saveStepData("stressTest", stressResult, analysisId);
        clearStepOutdated("stressTest");
        updateStatus("stressTest", "done");
      }
    } catch (err) {
      console.warn("[Pipeline] Stress Test error:", err);
      updateStatus("stressTest", "error");
    }

    // ── Step 4: Pitch (generate-pitch-deck) ──
    try {
      setCurrentStep("pitch");
      updateStatus("pitch", "running");

      const { data: result, error } = await invokeWithTimeout("generate-pitch-deck", {
        body: {
          product,
          disruptData: disruptResult || undefined,
          stressTestData: stressResult || undefined,
          redesignData: redesignResult || undefined,
          adaptiveContext: analysis.adaptiveContext || undefined,
          patentData: (product as any).patentData || undefined,
        },
      }, 180_000);

      if (error || !result?.success) {
        console.warn("[Pipeline] Pitch failed:", result?.error || error?.message);
        updateStatus("pitch", "error");
      } else {
        const pitchResult = result.deck;
        setPitchDeckData(pitchResult);
        await saveStepData("pitchDeck", pitchResult, analysisId);
        clearStepOutdated("pitch");
        updateStatus("pitch", "done");
      }
    } catch (err) {
      console.warn("[Pipeline] Pitch error:", err);
      updateStatus("pitch", "error");
    }

    // ── Step 5: Recompute ──
    setCurrentStep(null);
    setIsRunning(false);
    runningRef.current = false;

    // Trigger strategic recompute
    onRecompute?.();
    toast.success("Full pipeline complete — strategic intelligence updated.");
  }, [selectedProduct, analysisId, analysis.adaptiveContext, analysis.governedData]);

  // Auto-trigger when analysis is done with product but no step data
  useEffect(() => {
    if (
      step === "done" &&
      selectedProduct &&
      analysisId &&
      !disruptData &&
      !redesignData &&
      !stressTestData &&
      !pitchDeckData &&
      !runningRef.current &&
      triggeredForRef.current !== analysisId
    ) {
      triggeredForRef.current = analysisId;
      // Small delay to let context stabilize
      const timer = setTimeout(() => {
        runPipeline();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, selectedProduct, analysisId, disruptData, redesignData, stressTestData, pitchDeckData, runPipeline]);

  const steps = STEP_DEFS.map(d => ({
    key: d.key,
    label: d.label,
    status: stepStatuses[d.key] || "pending",
  }));

  return {
    isRunning,
    currentStep,
    steps,
    completedCount: steps.filter(s => s.status === "done").length,
    totalCount: steps.length,
  };
}
