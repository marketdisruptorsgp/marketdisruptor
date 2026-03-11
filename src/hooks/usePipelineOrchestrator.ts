/**
 * PIPELINE ORCHESTRATOR — Auto-runs all pipeline steps after analysis creation
 *
 * Pipeline: Decompose → Transform → Concept → Stress Test + Pitch (parallel)
 *
 * Key behaviors:
 *   - Decomposition is mandatory with retry (pipeline aborts if it fails)
 *   - Transformation engine produces assumptions, flips, transformations, viability, clustering
 *   - Concept architecture generates redesigned concept from viable clusters
 *   - Early termination if all transformations fail viability
 *   - Stress test & pitch run in parallel for speed
 *   - Payload compression reduces inter-stage token usage
 *   - Skips disrupt AI call if businessAnalysisData already exists
 *   - Triggers incremental recompute after each step
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
  retryStep: (stepKey: string) => void;
}

const STEP_DEFS = [
  { key: "decompose", label: "Structural Decomposition" },
  { key: "disrupt", label: "Structural Analysis" },
  { key: "redesign", label: "Redesign Concept" },
  { key: "stressTest", label: "Strategy Development" },
  { key: "pitch", label: "Pitch Synthesis" },
] as const;

/**
 * Compress product payload to reduce inter-stage token usage.
 * Strips large arrays to essential subsets.
 */
function compressProductPayload(product: any): any {
  if (!product) return product;
  const compressed: any = {
    name: product.name,
    category: product.category,
    era: product.era,
    description: product.description,
    specs: product.specs,
    keyInsight: product.keyInsight,
    marketSizeEstimate: product.marketSizeEstimate,
    assumptionsMap: product.assumptionsMap,
    id: product.id,
    revivalScore: product.revivalScore,
  };
  if (product.reviews) {
    compressed.reviews = product.reviews.slice(0, 5);
  }
  if (product.communityInsights) {
    compressed.communityInsights = {
      ...product.communityInsights,
      topComplaints: product.communityInsights.topComplaints?.slice(0, 5),
      improvementRequests: product.communityInsights.improvementRequests?.slice(0, 5),
    };
  }
  if (product.supplyChain) {
    compressed.supplyChain = {
      suppliers: product.supplyChain.suppliers?.slice(0, 3),
      manufacturers: product.supplyChain.manufacturers?.slice(0, 3),
      distributors: product.supplyChain.distributors?.slice(0, 3),
    };
  }
  if (product.pricingIntel) compressed.pricingIntel = product.pricingIntel;
  if (product.patentData) compressed.patentData = product.patentData;
  return compressed;
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
  } = analysis;

  const businessAnalysisData = (analysis as any).businessAnalysisData;
  const businessModelInput = (analysis as any).businessModelInput as { type?: string; description?: string } | null;

  const runningRef = useRef(false);
  const triggeredForRef = useRef<string | null>(null);

  const [stepStatuses, setStepStatuses] = useState<Record<string, PipelineStepStatus>>({
    decompose: "pending",
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

  // ── Individual step runners ──

  const runDecompose = useCallback(async (product: any, extractedContext: string): Promise<unknown> => {
    setCurrentStep("decompose");
    updateStatus("decompose", "running");

    const upstreamIntel: Record<string, unknown> = {};
    const pp = product as any;
    if (pp.supplyChain) upstreamIntel.supplyChain = pp.supplyChain;
    if (pp.pricingIntel) upstreamIntel.pricingIntel = pp.pricingIntel;
    if (pp.competitorAnalysis) upstreamIntel.competitorAnalysis = pp.competitorAnalysis;
    if (pp.operationalIntel) upstreamIntel.operationalIntel = pp.operationalIntel;
    if (pp.patentLandscape) upstreamIntel.patentLandscape = pp.patentLandscape;
    if (pp.trendAnalysis) upstreamIntel.trendAnalysis = pp.trendAnalysis;
    if (pp.patentData) upstreamIntel.patentData = pp.patentData;

    const { data: result, error } = await invokeWithTimeout("structural-decomposition", {
      body: {
        product,
        upstreamIntel: Object.keys(upstreamIntel).length > 0 ? upstreamIntel : undefined,
        adaptiveContext: analysis.adaptiveContext || undefined,
        extractedContext: extractedContext || undefined,
      },
    }, 120_000);

    if (error || !result?.success) {
      const msg = result?.error || error?.message || "Structural decomposition failed";
      console.warn("[Pipeline] Decompose failed:", msg);
      updateStatus("decompose", "error", msg);
      return null;
    }

    const decompResult = result.decomposition;
    setDecompositionData(decompResult);
    await saveStepData("decomposition", decompResult, analysisId!);
    updateStatus("decompose", "done");
    onStepComplete?.("decompose");
    onRecompute?.();
    return decompResult;
  }, [analysisId, analysis.adaptiveContext, saveStepData, setDecompositionData, updateStatus, onStepComplete, onRecompute]);

  const runDisrupt = useCallback(async (product: any, extractedContext: string, decompResult?: unknown): Promise<unknown> => {
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

    // ── Compress upstream intel to reduce token usage ──
    const upstreamIntel: Record<string, unknown> = {};
    const pp = product as any;
    if (pp.pricingIntel) upstreamIntel.pricingIntel = pp.pricingIntel;
    if (pp.supplyChain) upstreamIntel.supplyChain = {
      suppliers: pp.supplyChain.suppliers?.slice(0, 3),
      manufacturers: pp.supplyChain.manufacturers?.slice(0, 3),
    };
    if (pp.communityInsights) upstreamIntel.communityInsights = {
      communitySentiment: pp.communityInsights.communitySentiment,
      topComplaints: pp.communityInsights.topComplaints?.slice(0, 5),
      improvementRequests: pp.communityInsights.improvementRequests?.slice(0, 5),
    };
    if (pp.competitorAnalysis) upstreamIntel.competitorAnalysis = pp.competitorAnalysis;
    if (pp.trendAnalysis) upstreamIntel.trendAnalysis = pp.trendAnalysis;
    if (pp.patentData || pp.patentLandscape) upstreamIntel.patentLandscape = pp.patentLandscape || pp.patentData;

    const { data: result, error } = await invokeWithTimeout("transformation-engine", {
      body: {
        product: compressProductPayload(product),
        upstreamIntel: Object.keys(upstreamIntel).length > 0 ? upstreamIntel : undefined,
        adaptiveContext: analysis.adaptiveContext || undefined,
        extractedContext: extractedContext || undefined,
        structuralDecomposition: decompResult || undefined,
      },
    }, 180_000);

    if (error || !result?.success) {
      const msg = result?.error || error?.message || "Structural analysis failed";
      console.warn("[Pipeline] Disrupt failed:", msg);
      updateStatus("disrupt", "error", msg);
      return null;
    }

    const disruptResult = result.analysis;

    // Extract governed data for downstream steps
    if (disruptResult?.governed) {
      setGovernedData(disruptResult.governed);
    }

    setDisruptData(disruptResult);
    await saveStepData("disrupt", disruptResult, analysisId!);
    updateStatus("disrupt", "done");
    onStepComplete?.("disrupt");
    onRecompute?.();
    return disruptResult;
  }, [businessAnalysisData, analysisId, analysis.adaptiveContext, saveStepData, setDisruptData, setGovernedData, updateStatus, onStepComplete, onRecompute]);

  const runRedesign = useCallback(async (product: any, extractedContext: string, disruptResult: unknown, decompResult?: unknown): Promise<unknown> => {
    setCurrentStep("redesign");
    updateStatus("redesign", "running");

    // ── VIABILITY GATE ENFORCEMENT ──
    let viableTransformations: any[] = [];
    let viableClusters: any[] = [];
    let hiddenAssumptions: any = null;
    let flippedLogic: any = null;

    if (disruptResult) {
      const dd = disruptResult as Record<string, unknown>;
      hiddenAssumptions = dd.hiddenAssumptions || null;
      flippedLogic = dd.flippedLogic || null;

      if (Array.isArray(dd.structuralTransformations)) {
        const before = (dd.structuralTransformations as any[]).length;
        viableTransformations = (dd.structuralTransformations as any[]).filter(
          (t: any) => !t.filtered && (t.viabilityGate?.compositeScore ?? 5) >= 2.5
        );
        console.log(`[Pipeline] Viability gate: ${viableTransformations.length}/${before} transformations passed`);
      }

      if (Array.isArray(dd.transformationClusters)) {
        const viableIds = new Set(viableTransformations.map((t: any) => t.id));
        viableClusters = (dd.transformationClusters as any[]).filter((c: any) =>
          c.transformationIds?.some((id: string) => viableIds.has(id))
        );
      }
    }

    // ── Call concept-architecture (focused concept generation) ──
    const { data: result, error } = await invokeWithTimeout("concept-architecture", {
      body: {
        product: compressProductPayload(product),
        viableTransformations,
        allClusters: viableClusters,
        hiddenAssumptions,
        flippedLogic,
        governedContext: analysis.governedData ? {
          reasoning_synopsis: analysis.governedData.reasoning_synopsis,
          constraint_map: analysis.governedData.constraint_map,
          root_hypotheses: analysis.governedData.root_hypotheses,
        } : undefined,
        decomposition: decompResult || analysis.decompositionData || undefined,
        // Curation context
        insightPreferences: (analysis as any).insightPreferences || undefined,
        userScores: (analysis as any).userScores || undefined,
        steeringText: (analysis as any).steeringText || undefined,
      },
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
  }, [analysisId, analysis.adaptiveContext, analysis.governedData, analysis.decompositionData, saveStepData, setRedesignData, clearStepOutdated, updateStatus, onStepComplete, onRecompute]);

  const runStressTest = useCallback(async (product: any, extractedContext: string, disruptResult?: unknown, redesignResult?: unknown, decompResult?: unknown): Promise<unknown> => {
    updateStatus("stressTest", "running");

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
      if (rr.redesignedConcept) analysisPayload.redesignedConcept = rr.redesignedConcept;
    }

    const { data: result, error } = await invokeWithTimeout("critical-validation", {
      body: {
        product: compressProductPayload(product),
        analysisData: analysisPayload,
        adaptiveContext: analysis.adaptiveContext || undefined,
        extractedContext: extractedContext || undefined,
        structuralDecomposition: decompResult || analysis.decompositionData || undefined,
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
  }, [analysisId, analysis.adaptiveContext, analysis.decompositionData, saveStepData, setStressTestData, clearStepOutdated, updateStatus, onStepComplete, onRecompute]);

  const runPitch = useCallback(async (product: any, extractedContext: string, disruptResult: unknown, redesignResult: unknown, stressResult: unknown): Promise<void> => {
    updateStatus("pitch", "running");

    const { data: result, error } = await invokeWithTimeout("generate-pitch-deck", {
      body: {
        product: compressProductPayload(product),
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
      // Step 0: Structural Decomposition — MANDATORY with retry
      let decompResult = await runDecompose(product, extractedContext);
      if (!decompResult) {
        console.log("[Pipeline] Decomposition failed, retrying once...");
        decompResult = await runDecompose(product, extractedContext);
        if (!decompResult) {
          toast.error("Structural decomposition failed after retry. Pipeline aborted — please try again.");
          return;
        }
      }

      // Step 1: Transformation Engine (assumptions, flips, transformations, viability, clustering)
      const disruptResult = await runDisrupt(product, extractedContext, decompResult);
      if (!disruptResult) {
        toast.error("Transformation analysis failed. Pipeline stopped.");
        return;
      }

      // ── EARLY TERMINATION: Check if all transformations were filtered ──
      const transforms = (disruptResult as any).structuralTransformations;
      const allFiltered = Array.isArray(transforms) && transforms.length > 0 &&
        transforms.every((t: any) => t.filtered || (t.viabilityGate?.compositeScore ?? 5) < 2.5);

      let redesignResult: unknown = null;
      if (allFiltered) {
        console.log("[Pipeline] All transformations filtered by viability gate — skipping concept generation");
        toast.info("Low disruption potential detected — skipping concept generation.");
        updateStatus("redesign", "skipped");
      } else {
        // Step 2: Concept Architecture (redesigned concept from viable clusters)
        redesignResult = await runRedesign(product, extractedContext, disruptResult, decompResult);
      }

      // Steps 3 & 4: Stress Test + Pitch — RUN IN PARALLEL
      setCurrentStep("stressTest");
      const [stressSettled, pitchSettled] = await Promise.allSettled([
        runStressTest(product, extractedContext, disruptResult, redesignResult, decompResult),
        runPitch(product, extractedContext, disruptResult, redesignResult, null),
      ]);

      const stressResult = stressSettled.status === "fulfilled" ? stressSettled.value : null;
      const _pitchResult = pitchSettled.status === "fulfilled" ? pitchSettled.value : null;

      if (stressSettled.status === "rejected") {
        console.error("[Pipeline] Stress test rejected:", stressSettled.reason);
      }
      if (pitchSettled.status === "rejected") {
        console.error("[Pipeline] Pitch rejected:", pitchSettled.reason);
      }

    } catch (err) {
      console.error("[Pipeline] Unexpected pipeline error:", err);
    } finally {
      setCurrentStep(null);
      setIsRunning(false);
      runningRef.current = false;
      onRecompute?.();

      const statuses = { ...stepStatuses };
      const errorCount = Object.values(statuses).filter(s => s === "error").length;
      if (errorCount > 0) {
        toast.warning(`Pipeline complete with ${errorCount} step${errorCount > 1 ? "s" : ""} needing attention.`);
      } else {
        toast.success("Full pipeline complete — strategic intelligence updated.");
      }
    }
  }, [effectiveProduct, analysisId, analysis.adaptiveContext, runDecompose, runDisrupt, runRedesign, runStressTest, runPitch, stepStatuses, updateStatus, onRecompute]);

  // ── Retry a single failed step ──
  const retryStep = useCallback(async (stepKey: string) => {
    if (!effectiveProduct || !analysisId) return;
    const product = effectiveProduct;
    const extractedContext = analysis.adaptiveContext?.extractedContext || "";

    try {
      switch (stepKey) {
        case "decompose":
          await runDecompose(product, extractedContext);
          break;
        case "disrupt":
          await runDisrupt(product, extractedContext, decompositionData);
          break;
        case "redesign":
          await runRedesign(product, extractedContext, disruptData, decompositionData);
          break;
        case "stressTest":
          await runStressTest(product, extractedContext, disruptData, redesignData, decompositionData);
          break;
        case "pitch":
          await runPitch(product, extractedContext, disruptData, redesignData, stressTestData);
          break;
      }
    } catch (err) {
      console.error(`[Pipeline] Retry ${stepKey} failed:`, err);
      toast.error(`Retry failed for ${stepKey}`);
    }
  }, [effectiveProduct, analysisId, analysis.adaptiveContext, decompositionData, disruptData, redesignData, stressTestData, runDecompose, runDisrupt, runRedesign, runStressTest, runPitch]);

  // Auto-trigger when analysis is done with product/business data but missing critical step data
  // Also triggers when decomposition is missing (backfill for existing analyses)
  useEffect(() => {
    const hasAnalyzableData = !!selectedProduct || !!businessAnalysisData;
    const hasMissingCriticalStep = !disruptData || !decompositionData;
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
  }, [step, selectedProduct, businessAnalysisData, analysisId, disruptData, decompositionData, redesignData, stressTestData, pitchDeckData, runPipeline]);

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
