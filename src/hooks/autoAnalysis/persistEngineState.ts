/**
 * Persists strategic engine + insight graph state to Supabase.
 */

import type { runStrategicAnalysis } from "@/lib/strategicEngine";

type StrategicResult = ReturnType<typeof runStrategicAnalysis>;

export function persistEngineState(
  result: StrategicResult,
  analysisId: string,
  saveStepData: (key: string, data: unknown, targetId?: string) => Promise<void>,
) {
  const strategicEnginePayload = {
    structuralProfile: result.structuralProfile ?? null,
    narrative: result.narrative ?? null,
    insights: (result.insights ?? []).map(i => ({
      id: i.id, label: i.label, description: i.description,
      insightType: i.insightType, impact: i.impact, confidence: i.confidence,
      evidenceIds: i.evidenceIds,
    })),
    qualifiedPatterns: (result.qualifiedPatterns ?? []).map(qp => ({
      patternName: qp.pattern.name,
      signalDensity: qp.signalDensity,
      etaAdjustment: qp.etaAdjustment,
      strategicBet: qp.strategicBet,
    })),
    deepenedOpportunities: (result.deepenedOpportunities ?? []).map(d => ({
      reconfigurationLabel: d.reconfigurationLabel,
      summary: d.summary,
      causalChain: d.causalChain,
      strategicBet: d.strategicBet,
      economicMechanism: d.economicMechanism,
      firstMove: d.firstMove,
      feasibility: d.feasibility,
      whyThisMatters: (d as any).whyThisMatters ?? null,
      strategicPrecedents: (d as any).strategicPrecedents ?? [],
      secondOrderEffects: (d as any).secondOrderEffects ?? [],
      aiDeepened: (d as any).aiDeepened ?? false,
    })),
    pipelineEvents: result.events ?? [],
    evidenceCount: result.flatEvidence.length,
    constraintCount: result.diagnostic.constraintCount,
    opportunityCount: result.diagnostic.opportunityCount,
    aiGateResult: (result.diagnostic as any).aiGateResult ?? null,
    computedAt: new Date().toISOString(),
  };

  const insightGraphPayload = result.graph ? {
    nodes: result.graph.nodes,
    edges: result.graph.edges,
    metadata: {
      generatedAt: new Date().toISOString(),
      version: 1,
      nodeCount: result.graph.nodes.length,
      edgeCount: result.graph.edges.length,
    },
  } : null;

  const engineSave = saveStepData("strategicEngine", strategicEnginePayload, analysisId)
    .then(() => {
      console.log("[StrategicEngine] ✓ Persisted strategicEngine for", analysisId);
    })
    .catch(err => {
      console.error("[StrategicEngine] ✗ Failed to persist strategicEngine:", err);
      setTimeout(() => {
        saveStepData("strategicEngine", strategicEnginePayload, analysisId).catch(retryErr => {
          console.error("[StrategicEngine] ✗ Retry also failed:", retryErr);
        });
      }, 2000);
    });

  const graphSave = insightGraphPayload
    ? saveStepData("insightGraph", insightGraphPayload, analysisId)
        .then(() => {
          console.log("[StrategicEngine] ✓ Persisted insightGraph for", analysisId,
            `(${insightGraphPayload.metadata.nodeCount} nodes, ${insightGraphPayload.metadata.edgeCount} edges)`);
        })
        .catch(err => {
          console.error("[StrategicEngine] ✗ Failed to persist insightGraph:", err);
        })
    : Promise.resolve();

  Promise.all([engineSave, graphSave]).catch(() => {});
}
