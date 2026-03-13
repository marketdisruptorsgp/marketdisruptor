/**
 * PIPELINE ORCHESTRATOR — Progressive Rendering Architecture
 *
 * 3-Phase Pipeline with Progressive UI Updates:
 *   Phase 1: Structural Decomposition (Flash, ~20s) → renders immediately
 *   Phase 2: Strategic Synthesis (Pro, ~45s) → renders immediately
 *   Phase 2.5: Concept Synthesis (~20s) → renders immediately
 *   Phase 3: Stress Test + Pitch (LAZY — on-demand only)
 *
 * Key behaviors:
 *   - Each phase triggers onRecompute() for progressive rendering
 *   - Decomposition results appear within ~20s
 *   - Synthesis cards appear within ~60s
 *   - Stress Test + Pitch are user-triggered (not auto-run)
 *   - Reuses existing step data (skips completed steps)
 *   - Payload compression reduces token usage
 *   - Pre-context assembly (zero AI cost)
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { assemblePreContext } from "@/lib/preContextAssembly";
import { runStrategySearch } from "@/lib/strategySearch";
import { profileFromDecomposition } from "@/lib/strategySearch/profileAdapter";
import { toast } from "sonner";

export type PipelineStepStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface StepTiming {
  startedAt: number;
  completedAt?: number;
  elapsedMs?: number;
}

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
}

const STEP_DEFS = [
  { key: "decompose", label: "Understanding Structure" },
  { key: "synthesis", label: "Finding Opportunities" },
  { key: "concepts", label: "Generating Concepts" },
  { key: "stressTest", label: "Stress Testing", lazy: true },
  { key: "pitch", label: "Building Pitch", lazy: true },
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

function hasUsableBusinessSynthesisData(data: any): boolean {
  if (!data || typeof data !== "object") return false;

  const governed = data.governed;
  const hasGovernedStructure = !!(
    governed?.constraint_map?.binding_constraint_id ||
    governed?.constraint_map?.causal_chains?.length ||
    governed?.first_principles?.viability_assumptions?.length ||
    governed?.root_hypotheses?.length
  );

  const hasStrategicArtifacts = !!(
    data.flippedIdeas?.length ||
    data.ideas?.length ||
    data.opportunities?.length ||
    data.redesignedConcept ||
    data.structuralTransformations?.length
  );

  return hasGovernedStructure || hasStrategicArtifacts;
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
  const lastCompletedStepRef = useRef<string | null>(null); // Track for resume
  const runAllRef = useRef(false);

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
  const [pipelineStartedAt, setPipelineStartedAt] = useState<number | null>(null);
  const [stepTimings, setStepTimings] = useState<Record<string, StepTiming>>({});

  // Warn user if navigating away during active pipeline
  useEffect(() => {
    if (!isRunning) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Analysis pipeline is still running. Completed steps are saved, but the current step will need to re-run.";
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
    }, 60_000);

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

    // ── EARLY INSIGHTS: Surface assumptions/flips from decomposition immediately ──
    const dr = decompResult as Record<string, unknown> | null;
    if (dr?._earlyAssumptions || dr?._earlyFlippedLogic) {
      const earlyDisrupt: Record<string, unknown> = {
        hiddenAssumptions: dr._earlyAssumptions || [],
        flippedLogic: dr._earlyFlippedLogic || [],
        _earlyInsights: true, // Flag so synthesis knows to replace
      };
      setDisruptData(earlyDisrupt);
      console.log(`[Pipeline] Early insights surfaced: ${(dr._earlyAssumptions as any[])?.length || 0} assumptions, ${(dr._earlyFlippedLogic as any[])?.length || 0} flips`);
    }

    // Progressive render: show decomposition + early insights immediately
    onRecompute?.();
    return decompResult;
  }, [analysisId, analysis.adaptiveContext, saveStepData, setDecompositionData, updateStatus, onStepComplete]);

  // ── Phase 2: Strategic Synthesis (replaces transform + concept) ──

  const runStrategicSynthesis = useCallback(async (product: any, extractedContext: string, decompResult: unknown, strategyContext?: any): Promise<unknown> => {
    // Reuse business analysis only when it already contains actionable structural artifacts.
    const canReuseBusinessData = hasUsableBusinessSynthesisData(businessAnalysisData);
    if (canReuseBusinessData) {
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

    if (businessAnalysisData && !canReuseBusinessData) {
      console.log("[Pipeline] businessAnalysisData is too thin; running strategic-synthesis for enrichment");
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
        strategyContext: strategyContext || undefined,
        // Curation context
        insightPreferences: (analysis as any).insightPreferences || undefined,
        userScores: (analysis as any).userScores || undefined,
        steeringText: (analysis as any).steeringText || undefined,
      },
    }, 75_000);

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
    // Progressive render: show synthesis results immediately
    onRecompute?.();
    return synthesisResult;
  }, [businessAnalysisData, analysisId, analysis.adaptiveContext, saveStepData, setDisruptData, setRedesignData, setGovernedData, clearStepOutdated, updateStatus, onStepComplete]);

  // ── Phase 2.5: Concept Synthesis (Product Mode only) ──

  const runConceptSynthesis = useCallback(async (product: any, synthesisResult: unknown, decompResult: unknown): Promise<unknown> => {
    setCurrentStep("concepts");
    updateStatus("concepts", "running");

    const sr = synthesisResult as Record<string, unknown> | null;

    // Pull morphological vectors if user ran the explorer
    const morphData = (analysis as any).analysisData?.morphologicalExploration;
    const morphologicalVectors = morphData?.selectedVectors || undefined;

    const { data: result, error } = await invokeWithTimeout("concept-synthesis", {
      body: {
        product: compressProductPayload(product),
        structuralDecomposition: decompResult || undefined,
        assumptions: sr?.hiddenAssumptions || [],
        flippedLogic: sr?.flippedLogic || [],
        conceptCount: 5,
        morphologicalVectors,
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

    // Extract governed data from synthesis result for confidence computation
    const upstreamGoverned = (synthesisResult as any)?.governed || undefined;

    const { data: result, error } = await invokeWithTimeout("critical-validation", {
      body: {
        product: compressProductPayload(product),
        analysisData: analysisPayload,
        adaptiveContext: analysis.adaptiveContext || undefined,
        extractedContext: extractedContext || undefined,
        structuralDecomposition: decompResult || analysis.decompositionData || undefined,
        upstreamGoverned,
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
    // Progressive render: update intelligence with stress test data
    onRecompute?.();
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
    // Progressive render: update with pitch data
    onRecompute?.();
  }, [analysisId, analysis.adaptiveContext, saveStepData, setPitchDeckData, clearStepOutdated, updateStatus, onStepComplete]);

  // ── Full 3-Phase Pipeline ──

  const runPipeline = useCallback(async () => {
    if (!effectiveProduct || !analysisId) return;
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);
    setPipelineStartedAt(Date.now());
    setStepTimings({});

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

      // ═══ PHASE 1.5: Strategy Search (deterministic, ~50ms) ═══
      let strategyContext: any = undefined;
      try {
        const structuralProfile = profileFromDecomposition(decompResult);
        if (structuralProfile && structuralProfile.bindingConstraints.length > 0) {
          const searchResult = runStrategySearch(structuralProfile, { outputCount: 8 });
          const analogyStrategies = searchResult.strategies.filter(s => s.sourceAnalogy);
          const topStrategies = searchResult.strategies.slice(0, 6);
          strategyContext = {
            topStrategies: topStrategies.map(s => ({
              patternName: s.patternName,
              mechanism: s.mechanism,
              constraintName: s.constraintName,
              score: s.evaluation.composite,
              sourceAnalogy: s.sourceAnalogy || null,
            })),
            analogyCount: analogyStrategies.length,
            totalEvaluated: searchResult.totalEvaluated,
          };
          console.log(`[Pipeline] Strategy search: ${searchResult.totalEvaluated} evaluated, ${analogyStrategies.length} cross-domain, ${topStrategies.length} output`);
        }
      } catch (e) {
        console.warn("[Pipeline] Strategy search failed (non-blocking):", e);
      }

      // ═══ PHASE 2: Strategic Synthesis (~45s) ═══
      // Check if we already have FULL synthesis data (not just early insights from decomposition)
      const hasFullSynthesis = disruptData && redesignData && !(disruptData as any)?._earlyInsights;
      let synthesisResult = hasFullSynthesis ? disruptData : null;
      if (!synthesisResult) {
        synthesisResult = await runStrategicSynthesis(product, extractedContext, decompResult, strategyContext);
        if (!synthesisResult) {
          console.warn("[Pipeline] Synthesis failed — generating thin-data fallback");
          // Generate minimal disruptData from decomposition so UI isn't empty
          const decompObj = decompResult as Record<string, unknown> | null;
          const fallbackSynthesis: Record<string, unknown> = {
            hiddenAssumptions: (decompObj?.assumptions as any[])?.slice(0, 5)?.map((a: any, i: number) => ({
              assumption: typeof a === "string" ? a : a?.assumption || a?.text || `Assumption ${i + 1}`,
              confidence: typeof a === "object" ? (a?.confidence ?? 6) : 6,
              leverage: typeof a === "object" ? (a?.leverage ?? 5) : 5,
            })) || [{ assumption: "This market operates as expected", confidence: 5, leverage: 5 }],
            flippedLogic: (decompObj?.assumptions as any[])?.slice(0, 3)?.map((a: any, i: number) => ({
              originalAssumption: typeof a === "string" ? a : a?.assumption || a?.text || `Assumption ${i + 1}`,
              boldAlternative: `What if the opposite were true?`,
              rationale: "Generated from structural decomposition — run with richer data (upload CIM/financials) for deeper analysis.",
              leverageScore: 5,
            })) || [],
            governed: decompObj?.governed || {},
            _thinDataFallback: true,
          };
          synthesisResult = fallbackSynthesis;
          setDisruptData(fallbackSynthesis);
          await saveStepData("disrupt", fallbackSynthesis, analysisId!);
          updateStatus("synthesis", "done");
          toast.info("Limited data available — upload financial documents for deeper strategic analysis.");
        }
      } else {
        console.log("[Pipeline] Reusing existing synthesis data");
        updateStatus("synthesis", "done");
      }

      // ═══ Phase 2.5: Concept Synthesis (Product Mode only, NON-BLOCKING) ═══
      // Fire-and-forget so UI renders immediately after synthesis completes
      const isProductMode = analysis.activeMode === "custom" || (analysis.activeMode as string) === "product";
      if (isProductMode && !conceptsData && synthesisResult) {
        const conceptProduct = product;
        const conceptSynthesis = synthesisResult;
        const conceptDecomp = decompResult;
        // Non-blocking: run in background, update UI when done
        (async () => {
          try {
            let conceptResult = await runConceptSynthesis(conceptProduct, conceptSynthesis, conceptDecomp);
            if (!conceptResult) {
              console.log("[Pipeline] Concept synthesis failed, retrying once...");
              updateStatus("concepts", "running");
              conceptResult = await runConceptSynthesis(conceptProduct, conceptSynthesis, conceptDecomp);
            }
            if (!conceptResult) {
              console.warn("[Pipeline] Concept synthesis failed after retry — continuing");
            }
            onRecompute?.();
          } catch (err) {
            console.warn("[Pipeline] Concept synthesis background error:", err);
          }
        })();
      } else if (isProductMode && conceptsData) {
        console.log("[Pipeline] Reusing existing concepts data");
        updateStatus("concepts", "done");
      } else if (!isProductMode) {
        updateStatus("concepts", "skipped");
      }

      // ═══ UI renders now — Phase 2/2.5 complete ═══
      console.log("[Pipeline] Core phases complete. Stress Test & Pitch are available on-demand.");

      // ═══ PHASE 3: Stress Test + Pitch (auto-run if runAllMode) ═══
      if (stressTestData) {
        updateStatus("stressTest", "done");
      } else if (runAllRef.current && synthesisResult) {
        const stressResult = await runStressTest(product, extractedContext, synthesisResult, decompResult);
        if (stressResult && !pitchDeckData) {
          await runPitch(product, extractedContext, synthesisResult, stressResult);
        }
      }

      if (pitchDeckData) {
        updateStatus("pitch", "done");
      } else if (runAllRef.current && !stressTestData && synthesisResult) {
        // Pitch was already run above after stress test
      }

    } catch (err) {
      console.error("[Pipeline] Unexpected pipeline error:", err);
    } finally {
      setCurrentStep(null);
      setIsRunning(false);
      runningRef.current = false;
      runAllRef.current = false;

      const statuses = { ...stepStatuses };
      const coreSteps = ["decompose", "synthesis", "concepts"];
      const coreErrors = coreSteps.filter(k => statuses[k] === "error").length;
      if (coreErrors > 0) {
        toast.warning(`Pipeline complete with ${coreErrors} step${coreErrors > 1 ? "s" : ""} needing attention.`);
      } else {
        toast.success("Analysis ready — explore your strategic intelligence.");
      }
    }
  }, [effectiveProduct, analysisId, analysis.adaptiveContext, analysis.activeMode, decompositionData, disruptData, redesignData, conceptsData, stressTestData, pitchDeckData, runDecompose, runStrategicSynthesis, runConceptSynthesis, runStressTest, runPitch, stepStatuses, updateStatus, onRecompute]);

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
        case "concepts":
          await runConceptSynthesis(product, disruptData, decompositionData);
          break;
        case "pitch":
          await runPitch(product, extractedContext, disruptData, stressTestData);
          break;
      }
    } catch (err) {
      console.error(`[Pipeline] Retry ${stepKey} failed:`, err);
      toast.error(`Retry failed for ${stepKey}`);
    }
  }, [effectiveProduct, analysisId, analysis.adaptiveContext, decompositionData, disruptData, stressTestData, runDecompose, runStrategicSynthesis, runConceptSynthesis, runStressTest, runPitch]);

  // Auto-trigger when analysis is done but missing CORE pipeline step data
  // Stress test + pitch are lazy — don't auto-trigger for them
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
      console.log(`[Pipeline] Auto-trigger: missing core steps (decomposition=${!decompositionData}, disrupt=${!disruptData})`);
      const timer = setTimeout(() => {
        runPipeline();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step, selectedProduct, businessAnalysisData, analysisId, disruptData, decompositionData, runPipeline]);

  // Run ALL steps including lazy (stress test + pitch)
  const runAllSteps = useCallback(() => {
    runAllRef.current = true;
    runPipeline();
  }, [runPipeline]);

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
    runAllSteps,
    pipelineStartedAt,
    stepTimings,
  };
}
