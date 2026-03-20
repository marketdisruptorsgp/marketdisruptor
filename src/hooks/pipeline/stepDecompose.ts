/**
 * Step Runner: Structural Decomposition (~20s)
 * Includes smart retry with reduced payload on failure.
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

  // First attempt — full payload, 55s timeout, 1 automatic retry via invokeWithTimeout
  const { data: result, error } = await invokeWithTimeout("structural-decomposition", {
    body: {
      product: ctx.product,
      upstreamIntel: Object.keys(upstreamIntel).length > 0 ? upstreamIntel : undefined,
      adaptiveContext: ctx.adaptiveContext || undefined,
      extractedContext: ctx.extractedContext || undefined,
      steeringText: ctx.steeringText || undefined,
    },
  }, 55_000, 1); // 55s timeout, 1 auto-retry with backoff

  if (!error && result?.success) {
    return applyDecompResult(result.decomposition, ctx, cb, store);
  }

  // Second attempt — reduced payload to fit in tighter token/time budget
  console.warn("[Pipeline] Decompose full-payload failed, retrying with minimal payload...");
  cb.updateStatus("decompose", "running", "Retrying with simplified input...");

  const minimalProduct = {
    name: pp.name,
    category: pp.category,
    description: pp.description,
    specs: pp.specs,
    id: pp.id,
  };

  const { data: result2, error: error2 } = await invokeWithTimeout("structural-decomposition", {
    body: {
      product: minimalProduct,
      steeringText: ctx.steeringText || undefined,
    },
  }, 55_000); // single attempt, no retry

  if (error2 || !result2?.success) {
    const msg = result2?.error || error2?.message || "Structural decomposition failed after retry";
    console.warn("[Pipeline] Decompose minimal also failed:", msg);
    cb.updateStatus("decompose", "error", msg);
    return null;
  }

  return applyDecompResult(result2.decomposition, ctx, cb, store);
}

function applyDecompResult(
  decompResult: any,
  ctx: StepRunnerContext,
  cb: StepRunnerCallbacks,
  store: StepDataStore,
): unknown {
  store.setDecompositionData(decompResult);
  cb.saveStepData("decomposition", decompResult, ctx.analysisId);
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
