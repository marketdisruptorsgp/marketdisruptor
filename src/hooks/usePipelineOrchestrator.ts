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
  onStepComplete?: (stepKey: string) => void,
): PipelineProgress {
  const analysis = useAnalysis();
  const {
    step, selectedProduct, analysisId,
    disruptData, redesignData, stressTestData, pitchDeckData,
    setDisruptData, setRedesignData, setStressTestData, setPitchDeckData,
    setGovernedData, saveStepData, markStepOutdated, clearStepOutdated,
  } = analysis;

  const businessAnalysisData = (analysis as any).businessAnalysisData;
  const businessModelInput = (analysis as any).businessModelInput as { type?: string; description?: string } | null;

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

  // Build a synthetic product for business model analyses that lack a real selectedProduct
  const effectiveProduct = selectedProduct || (businessAnalysisData ? {
    id: analysisId || "business-model",
    name: businessModelInput?.type || "Business Model",
    category: "Business",
    image: "",
    revivalScore: 0,
    flippedIdeas: [],
    description: businessModelInput?.description || "",
  } as any : null);

  const runPipeline = useCallback(async () => {
    if (!effectiveProduct || !analysisId) return;
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);

    const product = effectiveProduct;
    const extractedContext = analysis.adaptiveContext?.extractedContext || "";

    // ── Step 1: Disrupt — SKIP if businessAnalysisData already exists ──
    let disruptResult: unknown = null;
    if (businessAnalysisData) {
      // Business model analysis already produced structural analysis — reuse it
      console.log("[Pipeline] Reusing businessAnalysisData as disrupt step (skipping redundant AI call)");
      disruptResult = businessAnalysisData;
      setDisruptData(disruptResult);
      await saveStepData("disrupt", disruptResult, analysisId);
      updateStatus("disrupt", "done");
      onStepComplete?.("disrupt");
      // Trigger incremental recompute so UI updates immediately
      onRecompute?.();
    } else {
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
            extractedContext: extractedContext || undefined,
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
          onStepComplete?.("disrupt");
          // Incremental recompute — UI sees disrupt data immediately
          onRecompute?.();
        }
      } catch (err) {
        console.warn("[Pipeline] Disrupt error:", err);
        updateStatus("disrupt", "error");
      }
    }

    // ── Step 2: Redesign ──
    let redesignResult: unknown = null;
    try {
      setCurrentStep("redesign");
      updateStatus("redesign", "running");

      const requestBody: Record<string, unknown> = {
        product,
        adaptiveContext: analysis.adaptiveContext || undefined,
        extractedContext: extractedContext || undefined,
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
        onStepComplete?.("redesign");
        // Incremental recompute
        onRecompute?.();
      }
    } catch (err) {
      console.warn("[Pipeline] Redesign error:", err);
      updateStatus("redesign", "error");
    }

    // ── Steps 3 & 4: Stress Test + Pitch — run in PARALLEL ──
    setCurrentStep("stressTest");
    updateStatus("stressTest", "running");
    updateStatus("pitch", "running");

    const stressTestPromise = (async () => {
      try {
        const { data: result, error } = await invokeWithTimeout("critical-validation", {
          body: {
            product,
            analysisData: product,
            adaptiveContext: analysis.adaptiveContext || undefined,
            extractedContext: extractedContext || undefined,
          },
        }, 180_000);

        if (error || !result?.success) {
          console.warn("[Pipeline] Stress Test failed:", result?.error || error?.message);
          updateStatus("stressTest", "error");
          return null;
        } else {
          const stressResult = result.validation || result;
          setStressTestData(stressResult);
          await saveStepData("stressTest", stressResult, analysisId);
          clearStepOutdated("stressTest");
          updateStatus("stressTest", "done");
          onStepComplete?.("stressTest");
          onRecompute?.();
          return stressResult;
        }
      } catch (err) {
        console.warn("[Pipeline] Stress Test error:", err);
        updateStatus("stressTest", "error");
        return null;
      }
    })();

    const pitchPromise = (async () => {
      try {
        const { data: result, error } = await invokeWithTimeout("generate-pitch-deck", {
          body: {
            product,
            disruptData: disruptResult || undefined,
            stressTestData: undefined, // can't wait for stress test in parallel
            redesignData: redesignResult || undefined,
            adaptiveContext: analysis.adaptiveContext || undefined,
            extractedContext: extractedContext || undefined,
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
          onStepComplete?.("pitch");
          onRecompute?.();
        }
      } catch (err) {
        console.warn("[Pipeline] Pitch error:", err);
        updateStatus("pitch", "error");
      }
    })();

    // Wait for both parallel steps to complete
    await Promise.allSettled([stressTestPromise, pitchPromise]);

    // ── Done ──
    setCurrentStep(null);
    setIsRunning(false);
    runningRef.current = false;

    // Final recompute with all data
    onRecompute?.();
    toast.success("Full pipeline complete — strategic intelligence updated.");
  }, [effectiveProduct, analysisId, analysis.adaptiveContext, analysis.governedData, businessAnalysisData]);

  // Auto-trigger when analysis is done with product/business data but no step data
  useEffect(() => {
    const hasAnalyzableData = !!selectedProduct || !!businessAnalysisData;
    if (
      step === "done" &&
      hasAnalyzableData &&
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
  }, [step, selectedProduct, businessAnalysisData, analysisId, disruptData, redesignData, stressTestData, pitchDeckData, runPipeline]);

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
