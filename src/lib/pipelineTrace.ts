/**
 * PIPELINE TRACE — Global diagnostic capture store
 *
 * Captures every stage of the analysis pipeline in a single
 * downloadable JSON object for end-to-end debugging.
 */

export interface EdgeFunctionTrace {
  functionName: string;
  calledAt: string;
  durationMs: number;
  status: "success" | "error" | "timeout";
  requestBodyKeys: string[];
  responseData: any;
  error?: string;
}

export interface EvidenceExtractionTrace {
  extractorCounts: Record<string, number>;
  evidenceLabels: { label: string; type: string; tier: string; mode?: string; sourceEngine?: string }[];
  rawTotalBeforeDedup: number;
  dedupedTotal: number;
  dedupLosses: number;
}

export interface StrategicStageTrace {
  stage1_rawEvidenceCount: number;
  stage2_normalizedCount: number;
  stage2_dedupLosses: number;
  stage2b_facetsPopulated: boolean;
  stage2b_facetSkipReason?: string;
  stage3_constraintHypotheses: { name: string; evidenceCount: number }[];
  stage4_structuralProfile: Record<string, any> | null;
  stage4_bindingConstraints: string[];
  stage5_qualifiedPatterns: {
    name: string;
    signalDensity: number;
    strengthSignals: string[];
    weaknessSignals: string[];
  }[];
  stage6_aiGatePassed: boolean;
  stage6_aiGateDetails: Record<string, any>;
  stage6_deepenedLabels: string[];
  stage6_mode: "ai" | "deterministic" | "skipped";
  narrative: {
    strategicVerdict: string;
    primaryConstraint: string;
    whyThisMatters: string;
  } | null;
}

export interface MorphologicalTrace {
  runMode: string;
  evidenceCount: number;
  fullThreshold: number;
  limitedThreshold: number;
  zoneCount: number;
  vectorCount: number;
  constraintInversionCount: number;
  secondOrderUnlockCount: number;
  temporalUnlockCount: number;
  competitiveGapCount: number;
  degradedConfidence: boolean;
}

export interface PipelineTrace {
  traceId: string;
  analysisId: string | null;
  startedAt: string;
  completedAt: string | null;
  edgeFunctions: EdgeFunctionTrace[];
  evidenceExtraction: EvidenceExtractionTrace | null;
  strategicStages: StrategicStageTrace | null;
  morphological: MorphologicalTrace | null;
  pipelineDiagnosticSummary: Record<string, any> | null;
  events: string[];
  errors: string[];
}

// ── Global singleton trace ──────────────────────────────────────

let _currentTrace: PipelineTrace | null = null;

export function startTrace(analysisId: string | null): PipelineTrace {
  _currentTrace = {
    traceId: `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    analysisId,
    startedAt: new Date().toISOString(),
    completedAt: null,
    edgeFunctions: [],
    evidenceExtraction: null,
    strategicStages: null,
    morphological: null,
    pipelineDiagnosticSummary: null,
    events: [],
    errors: [],
  };
  console.log("[PipelineTrace] Started trace:", _currentTrace.traceId);
  return _currentTrace;
}

export function getTrace(): PipelineTrace | null {
  return _currentTrace;
}

export function completeTrace(): void {
  if (_currentTrace) {
    _currentTrace.completedAt = new Date().toISOString();
    console.log("[PipelineTrace] Completed:", _currentTrace.traceId);
  }
}

export function traceEdgeFunction(entry: EdgeFunctionTrace): void {
  if (_currentTrace) {
    _currentTrace.edgeFunctions.push(entry);
  }
}

export function traceEvidenceExtraction(data: EvidenceExtractionTrace): void {
  if (_currentTrace) {
    _currentTrace.evidenceExtraction = data;
  }
}

export function traceStrategicStages(data: StrategicStageTrace): void {
  if (_currentTrace) {
    _currentTrace.strategicStages = data;
  }
}

export function traceMorphological(data: MorphologicalTrace): void {
  if (_currentTrace) {
    _currentTrace.morphological = data;
  }
}

export function traceEvent(event: string): void {
  if (_currentTrace) {
    _currentTrace.events.push(`${new Date().toISOString()} | ${event}`);
  }
}

export function traceError(error: string): void {
  if (_currentTrace) {
    _currentTrace.errors.push(`${new Date().toISOString()} | ${error}`);
  }
}

export function setPipelineDiagnosticSummary(summary: Record<string, any>): void {
  if (_currentTrace) {
    _currentTrace.pipelineDiagnosticSummary = summary;
  }
}

export function downloadTrace(): void {
  const trace = _currentTrace;
  if (!trace) {
    console.warn("[PipelineTrace] No trace to download");
    return;
  }
  const json = JSON.stringify(trace, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pipeline-trace-${trace.analysisId || "unknown"}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
