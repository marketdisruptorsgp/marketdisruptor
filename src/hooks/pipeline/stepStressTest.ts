/**
 * Step Runner: Stress Test / Critical Validation
 */
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { compressProductPayload } from "./compressPayload";
import type { StepRunnerContext, StepRunnerCallbacks, StepDataStore } from "./types";

export async function runStressTest(
  ctx: StepRunnerContext,
  cb: StepRunnerCallbacks,
  store: StepDataStore,
  synthesisResult?: unknown,
  decompResult?: unknown,
): Promise<unknown> {
  cb.updateStatus("stressTest", "running");

  const analysisPayload: Record<string, unknown> = { ...ctx.product };
  if (synthesisResult && typeof synthesisResult === "object") {
    const sr = synthesisResult as Record<string, unknown>;
    for (const k of ["redesignedConcept", "hiddenAssumptions", "flippedLogic", "frictionDimensions", "coreReality", "smartTechAnalysis", "currentStrengths", "structuralTransformations", "transformationClusters"]) {
      if (sr[k]) analysisPayload[k] = sr[k];
    }
  }

  const upstreamGoverned = (synthesisResult as any)?.governed || undefined;

  const { data: result, error } = await invokeWithTimeout("critical-validation", {
    body: {
      product: compressProductPayload(ctx.product),
      analysisData: analysisPayload,
      adaptiveContext: ctx.adaptiveContext || undefined,
      extractedContext: ctx.extractedContext || undefined,
      structuralDecomposition: decompResult || store.decompositionData || undefined,
      upstreamGoverned,
    },
  }, 180_000);

  if (error || !result?.success) {
    const msg = result?.error || error?.message || "Deep validation failed";
    console.warn("[Pipeline] Stress Test failed:", msg);
    cb.updateStatus("stressTest", "error", msg);
    return null;
  }

  const stressResult = result.validation || result;
  store.setStressTestData(stressResult);
  await cb.saveStepData("stressTest", stressResult, ctx.analysisId);
  store.clearStepOutdated("stressTest");
  cb.updateStatus("stressTest", "done");
  cb.onStepComplete?.("stressTest");
  cb.onRecompute?.();
  return stressResult;
}
