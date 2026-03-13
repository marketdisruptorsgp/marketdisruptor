/**
 * Step Runner: Pitch Deck Generation
 */
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { compressProductPayload } from "./compressPayload";
import type { StepRunnerContext, StepRunnerCallbacks, StepDataStore } from "./types";

export async function runPitch(
  ctx: StepRunnerContext,
  cb: StepRunnerCallbacks,
  store: StepDataStore,
  synthesisResult: unknown,
  stressResult: unknown,
): Promise<void> {
  cb.updateStatus("pitch", "running");

  const { data: result, error } = await invokeWithTimeout("generate-pitch-deck", {
    body: {
      product: compressProductPayload(ctx.product),
      disruptData: synthesisResult || undefined,
      stressTestData: stressResult || undefined,
      redesignData: synthesisResult || undefined,
      adaptiveContext: ctx.adaptiveContext || undefined,
      extractedContext: ctx.extractedContext || undefined,
      patentData: (ctx.product as any).patentData || undefined,
    },
  }, 180_000);

  if (error || !result?.success) {
    const msg = result?.error || error?.message || "Pitch generation failed";
    console.warn("[Pipeline] Pitch failed:", msg);
    cb.updateStatus("pitch", "error", msg);
    return;
  }

  const pitchResult = result.deck;
  store.setPitchDeckData(pitchResult);
  await cb.saveStepData("pitchDeck", pitchResult, ctx.analysisId);
  store.clearStepOutdated("pitch");
  cb.updateStatus("pitch", "done");
  cb.onStepComplete?.("pitch");
  cb.onRecompute?.();
}
