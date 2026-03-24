/**
 * Pipeline State Machine — orchestrates the sequential step runners.
 * Pure async function, no React dependencies.
 *
 * MAX PIPELINE TIME BUDGET: 150s (2.5 min) to stay under 3-minute UX goal.
 */
import { profileFromDecomposition } from "@/lib/strategySearch/profileAdapter";
import { hasUsableBusinessSynthesisData } from "./compressPayload";
import { runStrategySearch } from "@/lib/strategySearch";
import { runDecompose } from "./stepDecompose";
import { runStrategicSynthesis } from "./stepSynthesis";
import { runConceptSynthesis } from "./stepConcepts";
import { runStressTest } from "./stepStressTest";
import { runPitch } from "./stepPitch";
import { traceEvent, traceError } from "@/lib/pipelineTrace";
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

/** Result indicates whether core phases succeeded */
export interface PipelineResult {
  success: boolean;
  error?: string;
}

export async function runPipelineStateMachine(
  ctx: StepRunnerContext,
  cb: StepRunnerCallbacks,
  store: StepDataStore,
  opts: PipelineOptions,
): Promise<PipelineResult> {
  const pipelineStart = Date.now();
  const PIPELINE_BUDGET_MS = 150_000; // 2.5 min hard limit

  const isOverBudget = () => (Date.now() - pipelineStart) > PIPELINE_BUDGET_MS;
  const elapsed = () => Math.round((Date.now() - pipelineStart) / 1000);

  traceEvent("pipeline_started");

  // ═══ PHASE 1: Structural Decomposition (~20s) ═══
  // Skip decomposition entirely if businessAnalysisData already provides rich synthesis
  const canSkipDecomp = hasUsableBusinessSynthesisData(store.businessAnalysisData);
  let decompResult = opts.existingDecomp;
  if (!decompResult && canSkipDecomp) {
    console.log("[Pipeline] Skipping decomposition — businessAnalysisData has usable synthesis");
    traceEvent("step:decompose skipped (businessAnalysisData has usable synthesis)");
    cb.updateStatus("decompose", "done");
    decompResult = store.businessAnalysisData; // Use biz data as a proxy
  } else if (!decompResult) {
    traceEvent("step:decompose running");
    decompResult = await runDecompose(ctx, cb, store);
    if (!decompResult) {
      traceError("Decomposition failed after retries");
      traceEvent(`step:decompose error (elapsed=${elapsed()}s)`);
      toast.error("Structural decomposition failed. Try again or upload additional context.");
      return { success: false, error: "Decomposition failed after retries" };
    }
    traceEvent(`step:decompose done (elapsed=${elapsed()}s)`);
  } else {
    console.log("[Pipeline] Reusing existing decomposition data");
    traceEvent("step:decompose reused");
    cb.updateStatus("decompose", "done");
  }

  if (isOverBudget()) {
    traceError(`Pipeline exceeded time budget after decomposition (${elapsed()}s)`);
    console.warn("[Pipeline] Over time budget after decomposition — aborting");
    return { success: false, error: "Pipeline exceeded time budget" };
  }

  // ═══ PHASE 1.5: Strategy Search (deterministic, ~50ms) ═══
  let strategyContext: any = undefined;
  try {
    traceEvent("step:strategy_search running");
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
      traceEvent(`step:strategy_search done (evaluated=${searchResult.totalEvaluated}, cross-domain=${analogyStrategies.length})`);
      console.log(`[Pipeline] Strategy search: ${searchResult.totalEvaluated} evaluated, ${analogyStrategies.length} cross-domain`);
    } else {
      traceEvent("step:strategy_search skipped (no binding constraints)");
    }
  } catch (e) {
    traceError(`Strategy search failed: ${e}`);
    console.warn("[Pipeline] Strategy search failed (non-blocking):", e);
  }

  // ═══ PHASE 2: Strategic Synthesis (~45s) ═══
  const hasFullSynthesis = opts.existingDisrupt && !(opts.existingDisrupt as any)?._earlyInsights;
  let synthesisResult = hasFullSynthesis ? opts.existingDisrupt : null;
  if (!synthesisResult) {
    traceEvent("step:synthesis running");
    synthesisResult = await runStrategicSynthesis(ctx, cb, store, decompResult, strategyContext);
    if (!synthesisResult) {
      traceError("Synthesis failed — generating thin-data fallback");
      traceEvent(`step:synthesis fallback (elapsed=${elapsed()}s)`);
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
    } else {
      traceEvent(`step:synthesis done (elapsed=${elapsed()}s)`);
    }
  } else {
    console.log("[Pipeline] Reusing existing synthesis data");
    traceEvent("step:synthesis reused");
    cb.updateStatus("synthesis", "done");
  }

  if (isOverBudget()) {
    traceError(`Pipeline exceeded time budget after synthesis (${elapsed()}s)`);
    console.warn("[Pipeline] Over time budget after synthesis — skipping concepts");
    cb.updateStatus("concepts", "skipped");
    return { success: true }; // Core phases done, just skipping enrichment
  }

  // ═══ Phase 2.5: Concept Synthesis (Product Mode only, NON-BLOCKING) ═══
  const isProductMode = ctx.activeMode === "custom" || ctx.activeMode === "product";
  if (isProductMode && !opts.existingConcepts && synthesisResult) {
    traceEvent("step:concepts running (background)");
    (async () => {
      try {
        let conceptResult = await runConceptSynthesis(ctx, cb, store, synthesisResult, decompResult);
        if (!conceptResult) {
          console.log("[Pipeline] Concept synthesis failed, retrying once...");
          cb.updateStatus("concepts", "running");
          conceptResult = await runConceptSynthesis(ctx, cb, store, synthesisResult, decompResult);
        }
        if (!conceptResult) {
          traceError("Concept synthesis failed after retry");
          traceEvent("step:concepts error");
          console.warn("[Pipeline] Concept synthesis failed after retry — continuing");
          cb.updateStatus("concepts", "error", "Concept generation unavailable");
        } else {
          traceEvent("step:concepts done");
        }
        cb.onRecompute?.();
      } catch (err) {
        traceError(`Concept synthesis background error: ${err}`);
        traceEvent("step:concepts error");
        console.warn("[Pipeline] Concept synthesis background error:", err);
        cb.updateStatus("concepts", "error", "Concept generation failed");
      }
    })();
  } else if (isProductMode && opts.existingConcepts) {
    console.log("[Pipeline] Reusing existing concepts data");
    traceEvent("step:concepts reused");
    cb.updateStatus("concepts", "done");
  } else if (!isProductMode) {
    traceEvent("step:concepts skipped (not product mode)");
    cb.updateStatus("concepts", "skipped");
  }

  traceEvent(`pipeline_core_complete (elapsed=${elapsed()}s)`);
  console.log(`[Pipeline] Core phases complete in ${elapsed()}s. Stress Test & Pitch available on-demand.`);

  // ═══ PHASE 3: Stress Test + Pitch (auto-run if runAll) ═══
  if (opts.existingStressTest) {
    traceEvent("step:stressTest reused");
    cb.updateStatus("stressTest", "done");
  } else if (opts.runAll && synthesisResult && !isOverBudget()) {
    traceEvent("step:stressTest running");
    const stressResult = await runStressTest(ctx, cb, store, synthesisResult, decompResult);
    if (stressResult) {
      traceEvent(`step:stressTest done (elapsed=${elapsed()}s)`);
      if (!opts.existingPitchDeck && !isOverBudget()) {
        traceEvent("step:pitch running");
        await runPitch(ctx, cb, store, synthesisResult, stressResult);
        traceEvent(`step:pitch done (elapsed=${elapsed()}s)`);
      }
    } else {
      traceError("Stress test failed");
      traceEvent("step:stressTest error");
    }
  }

  if (opts.existingPitchDeck) {
    traceEvent("step:pitch reused");
    cb.updateStatus("pitch", "done");
  }

  traceEvent(`pipeline_finished (elapsed=${elapsed()}s)`);
  return { success: true };
}
