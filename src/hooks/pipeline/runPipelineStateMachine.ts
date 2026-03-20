/**
 * Pipeline State Machine — orchestrates the sequential step runners.
 * Pure async function, no React dependencies.
 */
import { profileFromDecomposition } from "@/lib/strategySearch/profileAdapter";
import { hasUsableBusinessSynthesisData } from "./compressPayload";
import { runStrategySearch } from "@/lib/strategySearch";
import { runDecompose } from "./stepDecompose";
import { runStrategicSynthesis } from "./stepSynthesis";
import { runConceptSynthesis } from "./stepConcepts";
import { runStressTest } from "./stepStressTest";
import { runPitch } from "./stepPitch";
import type { StepRunnerContext, StepRunnerCallbacks, StepDataStore } from "./types";
import { toast } from "sonner";

interface PipelineOptions {
  runAll: boolean;
  existingDecomp: unknown;
  existingDisrupt: unknown;
  existingRedesign?: unknown; // deprecated — redesign is derived from disrupt
  existingConcepts: unknown;
  existingStressTest: unknown;
  existingPitchDeck: unknown;
}

export async function runPipelineStateMachine(
  ctx: StepRunnerContext,
  cb: StepRunnerCallbacks,
  store: StepDataStore,
  opts: PipelineOptions,
): Promise<void> {
  // ═══ PHASE 1: Structural Decomposition (~20s) ═══
  // Skip decomposition entirely if businessAnalysisData already provides rich synthesis
  // (this prevents a redundant, expensive edge function call that often times out)
  const canSkipDecomp = hasUsableBusinessSynthesisData(store.businessAnalysisData);
  let decompResult = opts.existingDecomp;
  if (!decompResult && canSkipDecomp) {
    console.log("[Pipeline] Skipping decomposition — businessAnalysisData has usable synthesis");
    cb.updateStatus("decompose", "done");
    decompResult = store.businessAnalysisData; // Use biz data as a proxy
  } else if (!decompResult) {
    decompResult = await runDecompose(ctx, cb, store);
    if (!decompResult) {
      console.log("[Pipeline] Decomposition failed, retrying once...");
      decompResult = await runDecompose(ctx, cb, store);
      if (!decompResult) {
        toast.error("Structural decomposition failed after retry. Pipeline aborted.");
        return;
      }
    }
  } else {
    console.log("[Pipeline] Reusing existing decomposition data");
    cb.updateStatus("decompose", "done");
  }

  // ═══ PHASE 1.5: Strategy Search (deterministic, ~50ms) ═══
  let strategyContext: any = undefined;
  try {
    const structuralProfile = profileFromDecomposition(decompResult);
    if (structuralProfile && structuralProfile.bindingConstraints.length > 0) {
      const searchResult = runStrategySearch(structuralProfile, { outputCount: 8 });
      const analogyStrategies = searchResult.strategies.filter((s: any) => s.sourceAnalogy);
      const topStrategies = searchResult.strategies.slice(0, 6);
      strategyContext = {
        topStrategies: topStrategies.map((s: any) => ({
          patternName: s.patternName,
          mechanism: s.mechanism,
          constraintName: s.constraintName,
          score: s.evaluation.composite,
          sourceAnalogy: s.sourceAnalogy || null,
        })),
        analogyCount: analogyStrategies.length,
        totalEvaluated: searchResult.totalEvaluated,
      };
      console.log(`[Pipeline] Strategy search: ${searchResult.totalEvaluated} evaluated, ${analogyStrategies.length} cross-domain`);
    }
  } catch (e) {
    console.warn("[Pipeline] Strategy search failed (non-blocking):", e);
  }

  // ═══ PHASE 2: Strategic Synthesis (~45s) ═══
  const hasFullSynthesis = opts.existingDisrupt && !(opts.existingDisrupt as any)?._earlyInsights;
  let synthesisResult = hasFullSynthesis ? opts.existingDisrupt : null;
  if (!synthesisResult) {
    synthesisResult = await runStrategicSynthesis(ctx, cb, store, decompResult, strategyContext);
    if (!synthesisResult) {
      console.warn("[Pipeline] Synthesis failed — generating thin-data fallback");
      const decompObj = decompResult as Record<string, unknown> | null;
      const earlyAssumptions = decompObj?._earlyAssumptions as any[] || [];
      const earlyFlips = decompObj?._earlyFlippedLogic as any[] || [];
      const fallbackSynthesis: Record<string, unknown> = {
        hiddenAssumptions: earlyAssumptions.length > 0 ? earlyAssumptions : [{ assumption: "This market operates as expected", confidence: 5, leverage: 5 }],
        flippedLogic: earlyFlips.length > 0 ? earlyFlips : [],
        governed: decompObj?.governed || {},
        _thinDataFallback: true,
      };
      synthesisResult = fallbackSynthesis;
      store.setDisruptData(fallbackSynthesis);
      await cb.saveStepData("disrupt", fallbackSynthesis, ctx.analysisId);
      cb.updateStatus("synthesis", "done");
      toast.info("Limited data available — upload financial documents for deeper strategic analysis.");
    }
  } else {
    console.log("[Pipeline] Reusing existing synthesis data");
    cb.updateStatus("synthesis", "done");
  }

  // ═══ Phase 2.5: Concept Synthesis (Product Mode only, NON-BLOCKING) ═══
  const isProductMode = ctx.activeMode === "custom" || ctx.activeMode === "product";
  if (isProductMode && !opts.existingConcepts && synthesisResult) {
    (async () => {
      try {
        let conceptResult = await runConceptSynthesis(ctx, cb, store, synthesisResult, decompResult);
        if (!conceptResult) {
          console.log("[Pipeline] Concept synthesis failed, retrying once...");
          cb.updateStatus("concepts", "running");
          conceptResult = await runConceptSynthesis(ctx, cb, store, synthesisResult, decompResult);
        }
        if (!conceptResult) {
          console.warn("[Pipeline] Concept synthesis failed after retry — continuing");
        }
        cb.onRecompute?.();
      } catch (err) {
        console.warn("[Pipeline] Concept synthesis background error:", err);
      }
    })();
  } else if (isProductMode && opts.existingConcepts) {
    console.log("[Pipeline] Reusing existing concepts data");
    cb.updateStatus("concepts", "done");
  } else if (!isProductMode) {
    cb.updateStatus("concepts", "skipped");
  }

  console.log("[Pipeline] Core phases complete. Stress Test & Pitch available on-demand.");

  // ═══ PHASE 3: Stress Test + Pitch (auto-run if runAll) ═══
  if (opts.existingStressTest) {
    cb.updateStatus("stressTest", "done");
  } else if (opts.runAll && synthesisResult) {
    const stressResult = await runStressTest(ctx, cb, store, synthesisResult, decompResult);
    if (stressResult && !opts.existingPitchDeck) {
      await runPitch(ctx, cb, store, synthesisResult, stressResult);
    }
  }

  if (opts.existingPitchDeck) {
    cb.updateStatus("pitch", "done");
  }
}
