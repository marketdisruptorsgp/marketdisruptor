/**
 * PIPELINE DIAGNOSTICS — Full Intelligence Pipeline Tracing
 *
 * Provides stage-by-stage logging, validation, hash-guarded
 * recompute protection, and a diagnostic summary for debugging.
 */

export interface PipelineStageResult {
  stage: string;
  inputCount: number;
  outputCount: number;
  durationMs: number;
  warnings: string[];
}

export interface PipelineDiagnostic {
  stages: PipelineStageResult[];
  graphNodeCounts: Record<string, number>;
  totalEvidence: number;
  totalInsights: number;
  totalConstraints: number;
  totalOpportunities: number;
  totalScenarios: number;
  totalPathways: number;
  warnings: string[];
  lastHash: string;
  timestamp: number;
}

let _lastDiagnostic: PipelineDiagnostic | null = null;
let _lastRecomputeHash = "";

export function getLastDiagnostic(): PipelineDiagnostic | null {
  return _lastDiagnostic;
}

export function setLastDiagnostic(d: PipelineDiagnostic): void {
  _lastDiagnostic = d;
}

/** Compute a hash to prevent duplicate recomputes */
export function computeRecomputeHash(evidenceCount: number, insightCount: number, scenarioCount: number): string {
  return `${evidenceCount}:${insightCount}:${scenarioCount}`;
}

export function shouldRecompute(newHash: string): boolean {
  if (newHash === _lastRecomputeHash) return false;
  _lastRecomputeHash = newHash;
  return true;
}

export function resetRecomputeHash(): void {
  _lastRecomputeHash = "";
}

/** Trace a pipeline stage with timing and warnings */
export function traceStage<T>(
  stageName: string,
  inputCount: number,
  fn: () => T,
): { result: T; stage: PipelineStageResult } {
  const start = performance.now();
  const result = fn();
  const durationMs = Math.round(performance.now() - start);

  const outputCount = Array.isArray(result) ? result.length : typeof result === "object" && result !== null ? 1 : 0;
  const warnings: string[] = [];

  if (outputCount === 0 && inputCount > 0) {
    warnings.push(`[PipelineWarning] ${stageName}: produced 0 outputs from ${inputCount} inputs`);
  }

  const stage: PipelineStageResult = { stage: stageName, inputCount, outputCount, durationMs, warnings };

  if (warnings.length > 0) {
    console.warn(`[Pipeline] ${stageName}:`, warnings.join("; "));
  }
  console.log(`[Pipeline] ${stageName}: ${inputCount} → ${outputCount} (${durationMs}ms)`);

  return { result, stage };
}

/** Validate an insight object has required fields */
export function validateInsight(obj: any): string[] {
  const errors: string[] = [];
  const required = ["id", "label", "insightType", "evidenceIds"];
  for (const field of required) {
    if (obj[field] === undefined || obj[field] === null) {
      errors.push(`Insight missing field: ${field}`);
    }
  }
  if (obj.evidenceIds && !Array.isArray(obj.evidenceIds)) {
    errors.push("Insight.evidenceIds is not an array");
  }
  return errors;
}

/** Validate a graph node has valid coordinates */
export function validateNodePosition(node: { position?: { x: number; y: number }; id: string }): string[] {
  const errors: string[] = [];
  if (!node.position) {
    errors.push(`Node ${node.id}: missing position`);
    return errors;
  }
  if (isNaN(node.position.x) || isNaN(node.position.y)) {
    errors.push(`Node ${node.id}: NaN position (${node.position.x}, ${node.position.y})`);
  }
  if (Math.abs(node.position.x) > 10000 || Math.abs(node.position.y) > 10000) {
    errors.push(`Node ${node.id}: offscreen position (${node.position.x}, ${node.position.y})`);
  }
  return errors;
}

/** Build diagnostic summary from pipeline outputs */
export function buildDiagnostic(
  stages: PipelineStageResult[],
  graphNodes: Array<{ type: string }>,
  evidenceCount: number,
  insightCount: number,
  scenarioCount: number,
): PipelineDiagnostic {
  const warnings: string[] = stages.flatMap(s => s.warnings);

  const graphNodeCounts: Record<string, number> = {};
  for (const node of graphNodes) {
    graphNodeCounts[node.type] = (graphNodeCounts[node.type] || 0) + 1;
  }

  const totalConstraints = graphNodeCounts["constraint"] || 0;
  const totalOpportunities = (graphNodeCounts["outcome"] || 0) + (graphNodeCounts["concept"] || 0) + (graphNodeCounts["flipped_idea"] || 0);
  const totalScenarios = graphNodeCounts["scenario"] || 0;
  const totalPathways = graphNodeCounts["pathway"] || 0;

  // Check for incomplete graph
  if (totalConstraints === 0) warnings.push("[PipelineWarning] No constraint nodes in graph");
  if (totalOpportunities === 0) warnings.push("[PipelineWarning] No opportunity nodes in graph");
  if (totalPathways === 0) warnings.push("[PipelineWarning] No pathway nodes in graph");

  const hash = computeRecomputeHash(evidenceCount, insightCount, scenarioCount);

  const diagnostic: PipelineDiagnostic = {
    stages,
    graphNodeCounts,
    totalEvidence: evidenceCount,
    totalInsights: insightCount,
    totalConstraints,
    totalOpportunities,
    totalScenarios,
    totalPathways,
    warnings,
    lastHash: hash,
    timestamp: Date.now(),
  };

  if (warnings.length > 0) {
    console.warn("[Pipeline Diagnostic]", warnings);
  }
  console.log("[Pipeline Diagnostic] Summary:", {
    evidence: evidenceCount,
    insights: insightCount,
    constraints: totalConstraints,
    opportunities: totalOpportunities,
    scenarios: totalScenarios,
    pathways: totalPathways,
    graphNodeCounts,
  });

  _lastDiagnostic = diagnostic;
  return diagnostic;
}
