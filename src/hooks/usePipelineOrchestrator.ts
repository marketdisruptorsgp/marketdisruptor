/**
 * PIPELINE ORCHESTRATOR — 90-Second Architecture
 *
 * 3-Phase Pipeline:
 *   Phase 1: Structural Decomposition (Flash, ~20s)
 *   Phase 2: Strategic Synthesis (Pro, ~45s) — replaces transform + concept
 *   Phase 3: Deep Validation + Pitch (Flash, parallel, NON-BLOCKING)
 *
 * Key behaviors:
 *   - Decomposition mandatory with retry
 *   - Strategic synthesis produces ALL analysis + concept in one call
 *   - Phase 3 fires after UI renders Phase 2 — results stream in
 *   - Reuses existing step data (skips completed steps)
 *   - Payload compression reduces token usage
 *   - Pre-context assembly (zero AI cost)
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { assemblePreContext } from "@/lib/preContextAssembly";
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
  { key: "synthesis", label: "Strategic Synthesis" },
  { key: "concepts", label: "Concept Synthesis" },
  { key: "stressTest", label: "Deep Validation" },
  { key: "pitch", label: "Pitch Synthesis" },
] as const;

/**
 * Compress product payload to reduce inter-stage token usage.
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
  if (product.reviews) compressed.reviews = product.reviews.slice(0, 5);
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
    conceptsData, setConceptsData,
  } = analysis;

  const businessAnalysisData = (analysis as any).businessAnalysisData;
  const businessModelInput = (analysis as any).businessModelInput as { type?: string; description?: string } | null;

  const runningRef = useRef(false);
  const triggeredForRef = useRef<string | null>(null);

  const [stepStatuses, setStepStatuses] = useState<Record<string, PipelineStepStatus>>({
    decompose: "pending",
    synthesis: "pending",
    concepts: "pending",
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

  // Build a synthetic product for business model analyses
  const effectiveProduct = selectedProduct || (businessAnalysisData ? {
    id: analysisId || "business-model",
    name: businessModelInput?.type || "Business Model",
    category: "Business",
    image: "",
    revivalScore: 0,
    flippedIdeas: [],
    description: businessModelInput?.description || "",
  } as any : null);

  // ── Phase 1: Structural Decomposition ──

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
    // DON'T call onRecompute here — wait until pipeline is fully complete
    return decompResult;
  }, [analysisId, analysis.adaptiveContext, saveStepData, setDecompositionData, updateStatus, onStepComplete]);

  // ── Phase 2: Strategic Synthesis (replaces transform + concept) ──

  const runStrategicSynthesis = useCallback(async (product: any, extractedContext: string, decompResult: unknown): Promise<unknown> => {
    // If businessAnalysisData exists, reuse it
    if (businessAnalysisData) {
      console.log("[Pipeline] Reusing businessAnalysisData as synthesis step");
      setDisruptData(businessAnalysisData);
      await saveStepData("disrupt", businessAnalysisData, analysisId!);

      // Also set redesignData from business analysis to prevent re-trigger loops
      const redesignPayload = {
        redesignedConcept: (businessAnalysisData as any)?.redesignedConcept || null,
        visualSpecs: (businessAnalysisData as any)?.visualSpecs || null,
        actionPlans: (businessAnalysisData as any)?.actionPlans || null,
      };
      setRedesignData(redesignPayload);
      await saveStepData("redesign", redesignPayload, analysisId!);

      updateStatus("synthesis", "done");
      onStepComplete?.("synthesis");
      onRecompute?.();
      return businessAnalysisData;
    }

    setCurrentStep("synthesis");
    updateStatus("synthesis", "running");

    // Pre-context assembly (zero AI cost)
    const preContext = assemblePreContext(product);

    const { data: result, error } = await invokeWithTimeout("strategic-synthesis", {
      body: {
        product: compressProductPayload(product),
        structuralDecomposition: decompResult || undefined,
        adaptiveContext: analysis.adaptiveContext || undefined,
        extractedContext: extractedContext || undefined,
        preContext,
        // Curation context
        insightPreferences: (analysis as any).insightPreferences || undefined,
        userScores: (analysis as any).userScores || undefined,
        steeringText: (analysis as any).steeringText || undefined,
      },
    }, 180_000);

    if (error || !result?.success) {
      const msg = result?.error || error?.message || "Strategic synthesis failed";
      console.warn("[Pipeline] Synthesis failed:", msg);
      updateStatus("synthesis", "error", msg);
      return null;
    }

    const synthesisResult = result.analysis;

    // Extract governed data
    if (synthesisResult?.governed) {
      setGovernedData(synthesisResult.governed);
    }

    // Set BOTH disrupt and redesign data from the unified result
    // disruptData = full analysis (assumptions, flips, transformations, etc.)
    // redesignData = { redesignedConcept, visualSpecs, actionPlans }
    setDisruptData(synthesisResult);
    await saveStepData("disrupt", synthesisResult, analysisId!);

    const redesignPayload = {
      redesignedConcept: synthesisResult.redesignedConcept,
      visualSpecs: synthesisResult.visualSpecs,
      actionPlans: synthesisResult.actionPlans,
    };
    setRedesignData(redesignPayload);
    await saveStepData("redesign", redesignPayload, analysisId!);

    clearStepOutdated("redesign");
    updateStatus("synthesis", "done");
    onStepComplete?.("synthesis");
    // DON'T call onRecompute here — wait until pipeline is fully complete
    return synthesisResult;
  }, [businessAnalysisData, analysisId, analysis.adaptiveContext, saveStepData, setDisruptData, setRedesignData, setGovernedData, clearStepOutdated, updateStatus, onStepComplete]);

  // ── Phase 2.5: Concept Synthesis (Product Mode only) ──

  const runConceptSynthesis = useCallback(async (product: any, synthesisResult: unknown, decompResult: unknown): Promise<unknown> => {
    setCurrentStep("concepts");
    updateStatus("concepts", "running");

    const sr = synthesisResult as Record<string, unknown> | null;

    const { data: result, error } = await invokeWithTimeout("concept-synthesis", {
      body: {
        product: compressProductPayload(product),
        structuralDecomposition: decompResult || undefined,
        assumptions: sr?.hiddenAssumptions || [],
        flippedLogic: sr?.flippedLogic || [],
        conceptCount: 5,
      },
    }, 180_000);

    if (error || !result?.success) {
      const msg = result?.error || error?.message || "Concept synthesis failed";
      console.warn("[Pipeline] Concept synthesis failed:", msg);
      updateStatus("concepts", "error", msg);
      return null;
    }

    const conceptResult = result.result;
    setConceptsData(conceptResult);
    await saveStepData("concepts", conceptResult, analysisId!);
    updateStatus("concepts", "done");
    onStepComplete?.("concepts");
    return conceptResult;
  }, [analysisId, saveStepData, setConceptsData, updateStatus, onStepComplete]);

  // ── Phase 3: Deep Validation (background enrichment) ──


  const runStressTest = useCallback(async (product: any, extractedContext: string, synthesisResult?: unknown, decompResult?: unknown): Promise<unknown> => {
    updateStatus("stressTest", "running");

    const analysisPayload: Record<string, unknown> = { ...product };
    if (synthesisResult && typeof synthesisResult === "object") {
      const sr = synthesisResult as Record<string, unknown>;
      if (sr.redesignedConcept) analysisPayload.redesignedConcept = sr.redesignedConcept;
      if (sr.hiddenAssumptions) analysisPayload.hiddenAssumptions = sr.hiddenAssumptions;
      if (sr.flippedLogic) analysisPayload.flippedLogic = sr.flippedLogic;
      if (sr.frictionDimensions) analysisPayload.frictionDimensions = sr.frictionDimensions;
      if (sr.coreReality) analysisPayload.coreReality = sr.coreReality;
      if (sr.smartTechAnalysis) analysisPayload.smartTechAnalysis = sr.smartTechAnalysis;
      if (sr.currentStrengths) analysisPayload.currentStrengths = sr.currentStrengths;
      if (sr.structuralTransformations) analysisPayload.structuralTransformations = sr.structuralTransformations;
      if (sr.transformationClusters) analysisPayload.transformationClusters = sr.transformationClusters;
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
      const msg = result?.error || error?.message || "Deep validation failed";
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
    // DON'T call onRecompute here — wait until pipeline is fully complete
    return stressResult;
  }, [analysisId, analysis.adaptiveContext, analysis.decompositionData, saveStepData, setStressTestData, clearStepOutdated, updateStatus, onStepComplete]);

  // ── Phase 3: Pitch (background enrichment) ──

  const runPitch = useCallback(async (product: any, extractedContext: string, synthesisResult: unknown, stressResult: unknown): Promise<void> => {
    updateStatus("pitch", "running");

    const { data: result, error } = await invokeWithTimeout("generate-pitch-deck", {
      body: {
        product: compressProductPayload(product),
        disruptData: synthesisResult || undefined,
        stressTestData: stressResult || undefined,
        redesignData: synthesisResult || undefined,
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
    // DON'T call onRecompute here — wait until pipeline is fully complete
  }, [analysisId, analysis.adaptiveContext, saveStepData, setPitchDeckData, clearStepOutdated, updateStatus, onStepComplete]);

  // ── Full 3-Phase Pipeline ──

  const runPipeline = useCallback(async () => {
    if (!effectiveProduct || !analysisId) return;
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);

    const product = effectiveProduct;
    const extractedContext = analysis.adaptiveContext?.extractedContext || "";

    try {
      // ═══ PHASE 1: Structural Decomposition (~20s) ═══
      let decompResult = decompositionData;
      if (!decompResult) {
        decompResult = await runDecompose(product, extractedContext);
        if (!decompResult) {
          console.log("[Pipeline] Decomposition failed, retrying once...");
          decompResult = await runDecompose(product, extractedContext);
          if (!decompResult) {
            toast.error("Structural decomposition failed after retry. Pipeline aborted.");
            return;
          }
        }
      } else {
        console.log("[Pipeline] Reusing existing decomposition data");
        updateStatus("decompose", "done");
      }

      // ═══ PHASE 2: Strategic Synthesis (~45s) ═══
      // Check if we already have BOTH disrupt + redesign data
      let synthesisResult = (disruptData && redesignData) ? disruptData : null;
      if (!synthesisResult) {
        synthesisResult = await runStrategicSynthesis(product, extractedContext, decompResult);
        if (!synthesisResult) {
          console.warn("[Pipeline] Synthesis failed — continuing to Phase 3 with partial data");
          toast.warning("Strategic synthesis had issues. Running validation with available data.");
          // Don't return — let Phase 3 still fire with whatever we have
        }
      } else {
        console.log("[Pipeline] Reusing existing synthesis data");
        updateStatus("synthesis", "done");
      }

      // ═══ Phase 2.5: Concept Synthesis (Product Mode only) ═══
      const isProductMode = analysis.activeMode === "custom" || (analysis.activeMode as string) === "product";
      if (isProductMode && !conceptsData && synthesisResult) {
        const conceptResult = await runConceptSynthesis(product, synthesisResult, decompResult);
        if (!conceptResult) {
          console.warn("[Pipeline] Concept synthesis failed — continuing");
          toast.warning("Concept synthesis had issues. Continuing with validation.");
        }
      } else if (isProductMode && conceptsData) {
        console.log("[Pipeline] Reusing existing concepts data");
        updateStatus("concepts", "done");
      } else if (!isProductMode) {
        updateStatus("concepts", "skipped");
      }

      // ═══ UI renders now — Phase 2/2.5 complete ═══
      console.log("[Pipeline] Synthesis phases complete. Entering Phase 3 enrichment.");

      // ═══ PHASE 3: Background Enrichment (non-blocking) ═══
      const needsStress = !stressTestData;
      const needsPitch = !pitchDeckData;
      // Use whatever synthesis data we have (even partial) for Phase 3
      const phase3Data = synthesisResult || disruptData || null;

      if (needsStress || needsPitch) {
        setCurrentStep("stressTest");
        console.log(`[Pipeline] Phase 3: stress=${needsStress}, pitch=${needsPitch}`);

        // Fire both in parallel — these are background enrichment
        const enrichmentPromises: Promise<unknown>[] = [];

        if (needsStress) {
          enrichmentPromises.push(
            runStressTest(product, extractedContext, phase3Data, decompResult)
              .catch(err => { console.error("[Pipeline] Stress test error:", err); return null; })
          );
        } else {
          updateStatus("stressTest", "done");
          enrichmentPromises.push(Promise.resolve(stressTestData));
        }

        if (needsPitch) {
          enrichmentPromises.push(
            runPitch(product, extractedContext, phase3Data, null)
              .catch(err => { console.error("[Pipeline] Pitch error:", err); return null; })
          );
        } else {
          updateStatus("pitch", "done");
          enrichmentPromises.push(Promise.resolve(pitchDeckData));
        }

        // Run enrichment in parallel
        const [stressSettled, pitchSettled] = await Promise.allSettled(enrichmentPromises);

        if (stressSettled.status === "rejected") {
          console.error("[Pipeline] Stress test rejected:", stressSettled.reason);
        }
        if (pitchSettled.status === "rejected") {
          console.error("[Pipeline] Pitch rejected:", pitchSettled.reason);
        }
        console.log("[Pipeline] Phase 3 enrichment settled.");
      } else {
        console.log("[Pipeline] All steps already complete — skipping");
        updateStatus("stressTest", "done");
        updateStatus("pitch", "done");
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
  }, [effectiveProduct, analysisId, analysis.adaptiveContext, decompositionData, disruptData, redesignData, stressTestData, pitchDeckData, runDecompose, runStrategicSynthesis, runStressTest, runPitch, stepStatuses, updateStatus, onRecompute]);

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
        case "synthesis":
          await runStrategicSynthesis(product, extractedContext, decompositionData);
          break;
        case "stressTest":
          await runStressTest(product, extractedContext, disruptData, decompositionData);
          break;
        case "pitch":
          await runPitch(product, extractedContext, disruptData, stressTestData);
          break;
      }
    } catch (err) {
      console.error(`[Pipeline] Retry ${stepKey} failed:`, err);
      toast.error(`Retry failed for ${stepKey}`);
    }
  }, [effectiveProduct, analysisId, analysis.adaptiveContext, decompositionData, disruptData, stressTestData, runDecompose, runStrategicSynthesis, runStressTest, runPitch]);

  // Auto-trigger when analysis is done but missing ANY pipeline step data
  useEffect(() => {
    const hasAnalyzableData = !!selectedProduct || !!businessAnalysisData;
    const hasMissingCriticalStep = !disruptData || !decompositionData;
    const hasMissingDownstreamStep = !stressTestData || !pitchDeckData || !redesignData;
    const hasMissingAnyStep = hasMissingCriticalStep || hasMissingDownstreamStep;
    if (
      step === "done" &&
      hasAnalyzableData &&
      analysisId &&
      hasMissingAnyStep &&
      !runningRef.current &&
      triggeredForRef.current !== analysisId
    ) {
      triggeredForRef.current = analysisId;
      console.log(`[Pipeline] Auto-trigger: missing critical=${hasMissingCriticalStep}, downstream=${hasMissingDownstreamStep}`);
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
