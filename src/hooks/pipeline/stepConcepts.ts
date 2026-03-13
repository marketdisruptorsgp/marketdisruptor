/**
 * Step Runner: Concept Synthesis (Product Mode only, ~20s)
 */
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { compressProductPayload } from "./compressPayload";
import type { StepRunnerContext, StepRunnerCallbacks, StepDataStore } from "./types";

export async function runConceptSynthesis(
  ctx: StepRunnerContext,
  cb: StepRunnerCallbacks,
  store: StepDataStore,
  synthesisResult: unknown,
  decompResult: unknown,
): Promise<unknown> {
  cb.setCurrentStep("concepts");
  cb.updateStatus("concepts", "running");

  const sr = synthesisResult as Record<string, unknown> | null;
  const morphData = ctx.analysisData?.morphologicalExploration;
  const morphologicalVectors = morphData?.selectedVectors || undefined;

  const { data: result, error } = await invokeWithTimeout("concept-synthesis", {
    body: {
      product: compressProductPayload(ctx.product),
      structuralDecomposition: decompResult || undefined,
      assumptions: sr?.hiddenAssumptions || [],
      flippedLogic: sr?.flippedLogic || [],
      conceptCount: 5,
      morphologicalVectors,
      steeringText: ctx.steeringText || undefined,
    },
  }, 180_000);

  if (error || !result?.success) {
    const msg = result?.error || error?.message || "Concept synthesis failed";
    console.warn("[Pipeline] Concept synthesis failed:", msg);
    cb.updateStatus("concepts", "error", msg);
    return null;
  }

  const conceptResult = result.result;
  store.setConceptsData(conceptResult);
  await cb.saveStepData("concepts", conceptResult, ctx.analysisId);
  cb.updateStatus("concepts", "done");
  cb.onStepComplete?.("concepts");
  return conceptResult;
}
