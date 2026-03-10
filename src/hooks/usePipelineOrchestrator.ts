/**
 * PIPELINE ORCHESTRATOR — Auto-runs all pipeline steps after analysis creation
 *
 * When analysis reaches "done" state with a selected product but no step data,
 * this hook sequentially invokes all 5 edge functions, saves results to
 * context + DB, then triggers a strategic recompute.
 *
 * Pipeline: Disrupt → Redesign → Stress Test + Pitch (parallel)
 *
 * Key behaviors:
 *   - Skips disrupt AI call if businessAnalysisData already exists
 *   - Runs stress test & pitch in parallel for speed
 *   - Feeds stress test results into pitch when available
 *   - Triggers incremental recompute after each step
 *   - Shows error recovery UI when steps fail
 *   - Deduplicates by analysisId to prevent double runs
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { toast } from "sonner";

export type PipelineStepStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface PipelineProgress {
  isRunning: boolean;
  currentStep: string | null;
  steps: { key: string; label: string; status: PipelineStepStatus; error?: string }[];
  completedCount: number;
  totalCount: number;
  /** Allows UI to retry a specific failed step */
  retryStep: (stepKey: string) => void;
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
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const updateStatus = useCallback((key: string, status: PipelineStepStatus, error?: string) => {
    setStepStatuses(prev => ({ ...prev, [key]: status }));
    if (error) {
      setStepErrors(prev => ({ ...prev, [key]: error }));
    } else if (status === "done" || status === "running") {
      setStepErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
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

  // ── Individual step runners (reusable for retry) ──

  const runDisrupt = useCallback(async (product: any, extractedContext: string): Promise<unknown> => {
    if (businessAnalysisData) {
      console.log("[Pipeline] Reusing businessAnalysisData as disrupt step (skipping redundant AI call)");
      const result = businessAnalysisData;
      setDisruptData(result);
      await saveStepData("disrupt", result, analysisId!);
      updateStatus("disrupt", "done");
      onStepComplete?.("disrupt");
      onRecompute?.();
      return result;
    }

    setCurrentStep("disrupt");
    updateStatus("disrupt", "running");

    // ── Extract ALL upstream intelligence from the product object ──
    const upstreamIntel: Record<string, unknown> = {};
    const pp = product as any;
    if (pp.pricingIntel) upstreamIntel.pricingIntel = pp.pricingIntel;
    if (pp.supplyChain) upstreamIntel.supplyChain = pp.supplyChain;
    if (pp.communityInsights) upstreamIntel.communityInsights = pp.communityInsights;
    if (pp.userWorkflow) upstreamIntel.userWorkflow = pp.userWorkflow;
    if (pp.competitorAnalysis) upstreamIntel.competitorAnalysis = pp.competitorAnalysis;
    if (pp.operationalIntel) upstreamIntel.operationalIntel = pp.operationalIntel;
    if (pp.trendAnalysis) upstreamIntel.trendAnalysis = pp.trendAnalysis;

    const { data: result, error } = await invokeWithTimeout("first-principles-analysis", {
      body: {
        product,
        upstreamIntel: Object.keys(upstreamIntel).length > 0 ? upstreamIntel : undefined,
        adaptiveContext: analysis.adaptiveContext || undefined,
        extractedContext: extractedContext || undefined,
      },
    }, 180_000);

    if (error || !result?.success) {
      const msg = result?.error || error?.message || "Structural analysis failed";
      console.warn("[Pipeline] Disrupt failed:", msg);
      updateStatus("disrupt", "error", msg);
      return null;
    }

    const disruptResult = result.analysis;
    setDisruptData(disruptResult);
    await saveStepData("disrupt", disruptResult, analysisId!);
    updateStatus("disrupt", "done");
    onStepComplete?.("disrupt");
    onRecompute?.();
    return disruptResult;
  }, [businessAnalysisData, analysisId, analysis.adaptiveContext, saveStepData, setDisruptData, updateStatus, onStepComplete, onRecompute]);

  const runRedesign = useCallback(async (product: any, extractedContext: string, disruptResult: unknown): Promise<unknown> => {
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
      const msg = result?.error || error?.message || "Redesign failed";
      console.warn("[Pipeline] Redesign failed:", msg);
      updateStatus("redesign", "error", msg);
      return null;
    }

    const redesignResult = result.analysis;
    setRedesignData(redesignResult);
    await saveStepData("redesign", redesignResult, analysisId!);
    clearStepOutdated("redesign");
    updateStatus("redesign", "done");
    onStepComplete?.("redesign");
    onRecompute?.();
    return redesignResult;
  }, [analysisId, analysis.adaptiveContext, analysis.governedData, saveStepData, setRedesignData, clearStepOutdated, updateStatus, onStepComplete, onRecompute]);

  const runStressTest = useCallback(async (product: any, extractedContext: string, disruptResult?: unknown, redesignResult?: unknown): Promise<unknown> => {
    updateStatus("stressTest", "running");

    // ── CRITICAL FIX: Pass actual disrupt/redesign data as analysisData ──
    // The critical-validation edge function reads analysisData.redesignedConcept,
    // analysisData.hiddenAssumptions, etc. Without these, it generates GENERIC output.
    const analysisPayload: Record<string, unknown> = { ...product };
    if (disruptResult && typeof disruptResult === "object") {
      const dr = disruptResult as Record<string, unknown>;
      if (dr.redesignedConcept) analysisPayload.redesignedConcept = dr.redesignedConcept;
      if (dr.hiddenAssumptions) analysisPayload.hiddenAssumptions = dr.hiddenAssumptions;
      if (dr.flippedLogic) analysisPayload.flippedLogic = dr.flippedLogic;
      if (dr.frictionDimensions) analysisPayload.frictionDimensions = dr.frictionDimensions;
      if (dr.coreReality) analysisPayload.coreReality = dr.coreReality;
      if (dr.smartTechAnalysis) analysisPayload.smartTechAnalysis = dr.smartTechAnalysis;
      if (dr.currentStrengths) analysisPayload.currentStrengths = dr.currentStrengths;
    }
    if (redesignResult && typeof redesignResult === "object") {
      const rr = redesignResult as Record<string, unknown>;
      // If redesign produced a different concept, use that instead
      if (rr.redesignedConcept) analysisPayload.redesignedConcept = rr.redesignedConcept;
    }

    const { data: result, error } = await invokeWithTimeout("critical-validation", {
      body: {
        product,
        analysisData: analysisPayload,
        adaptiveContext: analysis.adaptiveContext || undefined,
        extractedContext: extractedContext || undefined,
      },
    }, 180_000);

    if (error || !result?.success) {
      const msg = result?.error || error?.message || "Stress test failed";
      console.warn("[Pipeline] Stress Test failed:", msg);
      updateStatus("stressTest", "error", msg);
      return null;
    }

    const stressResult = result.validation || result;
    setStressTestData(stressResult);
    await saveStepData("stressTest", stressResult, analysisId!);
    clearStepOutdated("stressTest");
    updateStatus("stressTest", "done");
    onStepComplete?.("stressTest");
    onRecompute?.();
    return stressResult;
  }, [analysisId, analysis.adaptiveContext, saveStepData, setStressTestData, clearStepOutdated, updateStatus, onStepComplete, onRecompute]);

  const runPitch = useCallback(async (product: any, extractedContext: string, disruptResult: unknown, redesignResult: unknown, stressResult: unknown): Promise<void> => {
    updateStatus("pitch", "running");

    const { data: result, error } = await invokeWithTimeout("generate-pitch-deck", {
      body: {
        product,
        disruptData: disruptResult || undefined,
        stressTestData: stressResult || undefined,
        redesignData: redesignResult || undefined,
        adaptiveContext: analysis.adaptiveContext || undefined,
        extractedContext: extractedContext || undefined,
        patentData: (product as any).patentData || undefined,
      },
    }, 180_000);

    if (error || !result?.success) {
      const msg = result?.error || error?.message || "Pitch generation failed";
      console.warn("[Pipeline] Pitch failed:", msg);
      updateStatus("pitch", "error", msg);
      return;
    }

    const pitchResult = result.deck;
    setPitchDeckData(pitchResult);
    await saveStepData("pitchDeck", pitchResult, analysisId!);
    clearStepOutdated("pitch");
    updateStatus("pitch", "done");
    onStepComplete?.("pitch");
    onRecompute?.();
  }, [analysisId, analysis.adaptiveContext, saveStepData, setPitchDeckData, clearStepOutdated, updateStatus, onStepComplete, onRecompute]);

  // ── Full pipeline ──

  const runPipeline = useCallback(async () => {
    if (!effectiveProduct || !analysisId) return;
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);

    const product = effectiveProduct;
    const extractedContext = analysis.adaptiveContext?.extractedContext || "";

    try {
      // Step 1: Disrupt
      const disruptResult = await runDisrupt(product, extractedContext);

      // Step 2: Redesign
      const redesignResult = await runRedesign(product, extractedContext, disruptResult);

      // Steps 3 & 4: Stress Test + Pitch — run stress test first with disrupt+redesign data, then pitch
      setCurrentStep("stressTest");
      const stressResult = await runStressTest(product, extractedContext, disruptResult, redesignResult);

      // Pitch now gets all upstream data
      setCurrentStep("pitch");
      await runPitch(product, extractedContext, disruptResult, redesignResult, stressResult);

    } catch (err) {
      console.error("[Pipeline] Unexpected pipeline error:", err);
    } finally {
      setCurrentStep(null);
      setIsRunning(false);
      runningRef.current = false;
      onRecompute?.();

      // Show completion message based on results
      const statuses = { ...stepStatuses };
      const errorCount = Object.values(statuses).filter(s => s === "error").length;
      if (errorCount > 0) {
        toast.warning(`Pipeline complete with ${errorCount} step${errorCount > 1 ? "s" : ""} needing attention.`);
      } else {
        toast.success("Full pipeline complete — strategic intelligence updated.");
      }
    }
  }, [effectiveProduct, analysisId, analysis.adaptiveContext, runDisrupt, runRedesign, runStressTest, runPitch, stepStatuses, onRecompute]);

  // ── Retry a single failed step ──
  const retryStep = useCallback(async (stepKey: string) => {
    if (!effectiveProduct || !analysisId) return;
    const product = effectiveProduct;
    const extractedContext = analysis.adaptiveContext?.extractedContext || "";

    try {
      switch (stepKey) {
        case "disrupt":
          await runDisrupt(product, extractedContext);
          break;
        case "redesign":
          await runRedesign(product, extractedContext, disruptData);
          break;
        case "stressTest":
          await runStressTest(product, extractedContext, disruptData, redesignData);
          break;
        case "pitch":
          await runPitch(product, extractedContext, disruptData, redesignData, stressTestData);
          break;
      }
    } catch (err) {
      console.error(`[Pipeline] Retry ${stepKey} failed:`, err);
      toast.error(`Retry failed for ${stepKey}`);
    }
  }, [effectiveProduct, analysisId, analysis.adaptiveContext, disruptData, redesignData, stressTestData, runDisrupt, runRedesign, runStressTest, runPitch]);

  // Auto-trigger when analysis is done with product/business data but missing critical step data
  useEffect(() => {
    const hasAnalyzableData = !!selectedProduct || !!businessAnalysisData;
    const hasMissingCriticalStep = !disruptData;
    const hasNoStepData = !disruptData && !redesignData && !stressTestData && !pitchDeckData;
    if (
      step === "done" &&
      hasAnalyzableData &&
      analysisId &&
      (hasNoStepData || hasMissingCriticalStep) &&
      !runningRef.current &&
      triggeredForRef.current !== analysisId
    ) {
      triggeredForRef.current = analysisId;
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
    error: stepErrors[d.key],
  }));

  return {
    isRunning,
    currentStep,
    steps,
    completedCount: steps.filter(s => s.status === "done").length,
    totalCount: steps.length,
    retryStep,
  };
}
