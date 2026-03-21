/**
 * Step Runner: Strategic Synthesis (~45s)
 */
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { assemblePreContext } from "@/lib/preContextAssembly";
import { compressProductPayload, hasUsableBusinessSynthesisData } from "./compressPayload";
import type { StepRunnerContext, StepRunnerCallbacks, StepDataStore } from "./types";

/**
 * After reuse path, ensure governed.constraint_map.root_hypotheses exists.
 * If already present in BA data, no-op. Otherwise fire backfill-strategic-os async.
 * Accepts optional serialized lens to pass through to hypothesis generation.
 */
async function ensureHypotheses(
  ba: any,
  ctx: StepRunnerContext,
  cb: StepRunnerCallbacks,
  store: StepDataStore,
  lens?: any,
): Promise<void> {
  const governed = ba?.governed;
  const existingHypotheses = governed?.constraint_map?.root_hypotheses;

  if (Array.isArray(existingHypotheses) && existingHypotheses.length > 0) {
    console.log(`[Pipeline] Reuse path: ${existingHypotheses.length} hypotheses already present — skipping backfill`);
    return;
  }

  // Also check top-level governed.root_hypotheses (alternate location)
  if (Array.isArray(governed?.root_hypotheses) && governed.root_hypotheses.length > 0) {
    console.log(`[Pipeline] Reuse path: migrating ${governed.root_hypotheses.length} hypotheses into constraint_map`);
    if (!ba.governed.constraint_map) ba.governed.constraint_map = {};
    ba.governed.constraint_map.root_hypotheses = governed.root_hypotheses;
    store.setDisruptData({ ...ba });
    await cb.saveStepData("disrupt", ba, ctx.analysisId);
    return;
  }

  // Fire backfill-strategic-os async — non-blocking
  console.log("[Pipeline] Reuse path: no hypotheses found — firing backfill-strategic-os async");
  invokeWithTimeout("backfill-strategic-os", {
    body: {
      singleAnalysisId: ctx.analysisId,
      ...(lens ? { lens } : {}),
    },
  }, 30_000).then(({ data, error }) => {
    if (error || !data) {
      console.warn("[Pipeline] Hypothesis backfill failed:", error?.message || "no data");
      return;
    }
    console.log("[Pipeline] Hypothesis backfill completed async — updating in-memory state");

    // Merge backfilled hypotheses into in-memory governed state
    const hypotheses = data.hypotheses;
    if (Array.isArray(hypotheses) && hypotheses.length > 0) {
      const existingGoverned = (ba?.governed || {});
      if (!existingGoverned.constraint_map) existingGoverned.constraint_map = {};
      existingGoverned.constraint_map.root_hypotheses = hypotheses;
      existingGoverned.root_hypotheses = hypotheses;
      store.setGovernedData({ ...existingGoverned });
      store.setDisruptData({ ...ba, governed: existingGoverned });
    }

    cb.onRecompute?.();
  }).catch((err) => {
    console.warn("[Pipeline] Hypothesis backfill error:", err);
  });
}

export async function runStrategicSynthesis(
  ctx: StepRunnerContext,
  cb: StepRunnerCallbacks,
  store: StepDataStore,
  decompResult: unknown,
  strategyContext?: any,
): Promise<unknown> {
  // Reuse business analysis when it has actionable structural artifacts
  const canReuse = hasUsableBusinessSynthesisData(store.businessAnalysisData);
  if (canReuse) {
    console.log("[Pipeline] Reusing businessAnalysisData as synthesis step");
    const ba = store.businessAnalysisData as any;
    store.setDisruptData(ba);
    await cb.saveStepData("disrupt", ba, ctx.analysisId);

    // NOTE: redesignData is derived from disruptData — no separate save needed.
    // RedesignPage falls back to disruptData when redesignData is null.

    cb.updateStatus("synthesis", "done");
    cb.onStepComplete?.("synthesis");
    cb.onRecompute?.();

    // Non-blocking: ensure hypotheses exist for downstream consumers
    ensureHypotheses(ba, ctx, cb, store, ctx.activeLens).catch(() => {});

    return ba;
  }

  if (store.businessAnalysisData && !canReuse) {
    console.log("[Pipeline] businessAnalysisData too thin; running strategic-synthesis");
  }

  cb.setCurrentStep("synthesis");
  cb.updateStatus("synthesis", "running");

  const preContext = assemblePreContext(ctx.product);

  const { data: result, error } = await invokeWithTimeout("strategic-synthesis", {
    body: {
      product: compressProductPayload(ctx.product),
      structuralDecomposition: decompResult || undefined,
      adaptiveContext: ctx.adaptiveContext || undefined,
      extractedContext: ctx.extractedContext || undefined,
      preContext,
      strategyContext: strategyContext || undefined,
      insightPreferences: ctx.insightPreferences || undefined,
      userScores: ctx.userScores || undefined,
      steeringText: ctx.steeringText || undefined,
      focusTerritory: ctx.focusTerritory || undefined,
    },
  }, 75_000);

  if (error || !result?.success) {
    const msg = result?.error || error?.message || "Strategic synthesis failed";
    console.warn("[Pipeline] Synthesis failed:", msg);
    cb.updateStatus("synthesis", "error", msg);
    return null;
  }

  const synthesisResult = result.analysis;

  if (synthesisResult?.governed) {
    store.setGovernedData(synthesisResult.governed);
  }

  store.setDisruptData(synthesisResult);
  await cb.saveStepData("disrupt", synthesisResult, ctx.analysisId);

  // NOTE: redesignData fields (redesignedConcept, visualSpecs, actionPlans) are already
  // in disruptData/synthesisResult. No separate save — RedesignPage falls back to disruptData.
  store.clearStepOutdated("redesign");
  cb.updateStatus("synthesis", "done");
  cb.onStepComplete?.("synthesis");
  cb.onRecompute?.();
  return synthesisResult;
}
