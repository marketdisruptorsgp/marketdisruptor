/**
 * Step Runner: Strategic Synthesis (~45s)
 */
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { assemblePreContext } from "@/lib/preContextAssembly";
import { compressProductPayload, hasUsableBusinessSynthesisData } from "./compressPayload";
import type { StepRunnerContext, StepRunnerCallbacks, StepDataStore } from "./types";

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
