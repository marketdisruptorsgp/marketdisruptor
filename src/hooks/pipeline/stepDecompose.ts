/**
 * Step Runner: Structural Decomposition (~20s)
 */
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import type { StepRunnerContext, StepRunnerCallbacks, StepDataStore } from "./types";

export async function runDecompose(
  ctx: StepRunnerContext,
  cb: StepRunnerCallbacks,
  store: StepDataStore,
): Promise<unknown> {
  cb.setCurrentStep("decompose");
  cb.updateStatus("decompose", "running");

  const upstreamIntel: Record<string, unknown> = {};
  const pp = ctx.product as any;
  if (pp.supplyChain) upstreamIntel.supplyChain = pp.supplyChain;
  if (pp.pricingIntel) upstreamIntel.pricingIntel = pp.pricingIntel;
  if (pp.competitorAnalysis) upstreamIntel.competitorAnalysis = pp.competitorAnalysis;
  if (pp.operationalIntel) upstreamIntel.operationalIntel = pp.operationalIntel;
  if (pp.patentLandscape) upstreamIntel.patentLandscape = pp.patentLandscape;
  if (pp.trendAnalysis) upstreamIntel.trendAnalysis = pp.trendAnalysis;
  if (pp.patentData) upstreamIntel.patentData = pp.patentData;

  const { data: result, error } = await invokeWithTimeout("structural-decomposition", {
    body: {
      product: ctx.product,
      upstreamIntel: Object.keys(upstreamIntel).length > 0 ? upstreamIntel : undefined,
      adaptiveContext: ctx.adaptiveContext || undefined,
      extractedContext: ctx.extractedContext || undefined,
      steeringText: ctx.steeringText || undefined,
    },
  }, 60_000);

  if (error || !result?.success) {
    const msg = result?.error || error?.message || "Structural decomposition failed";
    console.warn("[Pipeline] Decompose failed:", msg);
    cb.updateStatus("decompose", "error", msg);
    return null;
  }

  const decompResult = result.decomposition;
  store.setDecompositionData(decompResult);
  await cb.saveStepData("decomposition", decompResult, ctx.analysisId);
  cb.updateStatus("decompose", "done");
  cb.onStepComplete?.("decompose");

  // ── EARLY INSIGHTS: Surface assumptions/flips immediately ──
  const dr = decompResult as Record<string, unknown> | null;
  if (dr?._earlyAssumptions || dr?._earlyFlippedLogic) {
    const earlyDisrupt: Record<string, unknown> = {
      hiddenAssumptions: dr._earlyAssumptions || [],
      flippedLogic: dr._earlyFlippedLogic || [],
      _earlyInsights: true,
    };
    store.setDisruptData(earlyDisrupt);
    console.log(`[Pipeline] Early insights surfaced: ${(dr._earlyAssumptions as any[])?.length || 0} assumptions, ${(dr._earlyFlippedLogic as any[])?.length || 0} flips`);
  }

  cb.onRecompute?.();
  return decompResult;
}
