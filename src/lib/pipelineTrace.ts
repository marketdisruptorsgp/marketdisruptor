/**
 * PIPELINE TRACE — Run-safe diagnostic capture store
 *
 * Captures every stage of the analysis pipeline in a single
 * downloadable JSON object for end-to-end debugging.
 *
 * Architecture:
 *  - Each pipeline run gets a unique `runId` (analysisId + counter).
 *  - Traces are stored in an in-memory Map keyed by `${analysisId}:${runId}`.
 *  - `_currentTrace` still acts as the active cursor for backward-compatible
 *    callers (traceEvent, traceError, etc.) but startTrace will NOT overwrite
 *    an already-running trace for the same analysisId — preventing run stomping.
 *  - `completeTrace()` must be called once per run from the top-level finally.
 *  - `getLatestTrace(analysisId)` returns the most recent completed (or running)
 *    trace for a given analysis, used by download and the diagnostics viewer.
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
  /** Explicit skip reason — populated when stage6_mode is "skipped" */
  stage6_skipReason?: string;
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
  /** Populated when morphological engine did not run */
  skipReason?: string;
}

export interface PipelineTrace {
  traceId: string;
  /** Stable per analysis session */
  analysisId: string | null;
  /**
   * Unique identifier for this pipeline run within the analysis.
   * Monotonically incrementing counter scoped to the analysis session.
   */
  runId: string;
  /** ISO timestamp of when this run started */
  startedAt: string;
  /** ISO timestamp of when this run completed (null while still running) */
  completedAt: string | null;
  /** Overall run status */
  status: "running" | "completed" | "failed";
  edgeFunctions: EdgeFunctionTrace[];
  evidenceExtraction: EvidenceExtractionTrace | null;
  strategicStages: StrategicStageTrace | null;
  morphological: MorphologicalTrace | null;
  pipelineDiagnosticSummary: Record<string, any> | null;
  events: string[];
  errors: string[];
}

// ── Multi-run trace store ───────────────────────────────────────
// Key format: `${analysisId}:${runId}`  (or `unknown:${runId}` for null analysisId)

const _traces = new Map<string, PipelineTrace>();

// Active cursor — updated by startTrace, read by all trace-mutation helpers
let _currentTrace: PipelineTrace | null = null;

// Monotonic per-analysis run counter (resets per page load, which is fine)
const _runCounters = new Map<string, number>();

function makeRunId(analysisId: string | null): string {
  const key = analysisId ?? "unknown";
  const next = (_runCounters.get(key) ?? 0) + 1;
  _runCounters.set(key, next);
  return `run_${next}`;
}

function traceKey(analysisId: string | null, runId: string): string {
  return `${analysisId ?? "unknown"}:${runId}`;
}

/**
 * Start a new pipeline trace for a given analysis + run.
 *
 * SAFETY: If there is already a *running* (not yet completed) trace for the
 * same `analysisId`, this call is a no-op and returns the existing trace.
 * This prevents concurrent or re-entrant callers (e.g. useAutoAnalysis
 * triggering while usePipelineOrchestrator's trace is still active) from
 * stomping the top-level trace.
 *
 * Pass `force: true` to unconditionally create a new trace (e.g. for
 * "Run All" scenarios where you explicitly want a fresh run).
 */
export function startTrace(
  analysisId: string | null,
  options?: { source?: string; force?: boolean },
): PipelineTrace {
  // Non-destructive: reuse existing running trace for the same analysis
  if (!options?.force && _currentTrace && _currentTrace.analysisId === analysisId && !_currentTrace.completedAt) {
    return _currentTrace;
  }

  const runId = makeRunId(analysisId);
  const trace: PipelineTrace = {
    traceId: `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    analysisId,
    runId,
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: "running",
    edgeFunctions: [],
    evidenceExtraction: null,
    strategicStages: null,
    morphological: null,
    pipelineDiagnosticSummary: null,
    events: options?.source ? [`${new Date().toISOString()} | trace_started source=${options.source}`] : [],
    errors: [],
  };

  _traces.set(traceKey(analysisId, runId), trace);
  _currentTrace = trace;
  console.log(`[PipelineTrace] Started trace: ${trace.traceId} runId=${runId}${options?.source ? ` source=${options.source}` : ""}`);
  return trace;
}

/**
 * Returns the current active trace (may be running or completed).
 * Falls back to sessionStorage if no in-memory trace exists.
 */
export function getTrace(): PipelineTrace | null {
  if (_currentTrace) return _currentTrace;
  // Attempt to restore from sessionStorage (survives page reload within same tab)
  try {
    const key = sessionStorage.getItem("pipeline_trace_latest_key");
    if (key) {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        _currentTrace = JSON.parse(raw) as PipelineTrace;
        return _currentTrace;
      }
    }
  } catch (_) { /* parse error or no sessionStorage */ }
  return null;
}

/**
 * Returns the most recent trace for a given analysisId — prefers the latest
 * completed run but falls back to a still-running trace if that's all we have.
 */
export function getLatestTrace(analysisId: string): PipelineTrace | null {
  // Scan in-memory map for matching traces (most recently inserted wins)
  let latest: PipelineTrace | null = null;
  for (const trace of _traces.values()) {
    if (trace.analysisId !== analysisId) continue;
    if (!latest) { latest = trace; continue; }
    // Prefer completed traces over running ones
    if (!latest.completedAt && trace.completedAt) { latest = trace; continue; }
    if (latest.completedAt && !trace.completedAt) continue;
    // Both same completion state: take the newer one
    if (trace.startedAt > latest.startedAt) latest = trace;
  }
  if (latest) return latest;

  // Fall back to sessionStorage
  try {
    const latestKey = sessionStorage.getItem(`pipeline_trace_latest_key_${analysisId}`);
    if (latestKey) {
      const raw = sessionStorage.getItem(latestKey);
      if (raw) return JSON.parse(raw) as PipelineTrace;
    }
  } catch (_) { /* parse error or no sessionStorage */ }
  return null;
}

/**
 * Complete the current trace and persist it to sessionStorage.
 * Call this exactly once in the top-level `finally` of each pipeline run.
 *
 * @param status "completed" (default) or "failed"
 */
export function completeTrace(status: "completed" | "failed" = "completed"): void {
  if (_currentTrace) {
    _currentTrace.completedAt = new Date().toISOString();
    _currentTrace.status = status;
    console.log(`[PipelineTrace] ${status === "failed" ? "Failed" : "Completed"}: ${_currentTrace.traceId} runId=${_currentTrace.runId}`);
    // Persist to sessionStorage keyed by analysisId:runId
    try {
      const key = `pipeline_trace_${_currentTrace.analysisId ?? "unknown"}:${_currentTrace.runId}`;
      sessionStorage.setItem(key, JSON.stringify(_currentTrace));
      // Store the latest completed trace key for quick lookup per analysisId
      sessionStorage.setItem(`pipeline_trace_latest_key_${_currentTrace.analysisId ?? "unknown"}`, key);
      // Legacy key for backward compatibility with existing restoreTraceForAnalysis callers
      sessionStorage.setItem(`pipeline_trace_${_currentTrace.analysisId ?? "unknown"}`, JSON.stringify(_currentTrace));
      sessionStorage.setItem("pipeline_trace_latest_key", key);
    } catch (_) { /* sessionStorage quota — silently ignore */ }
  } else {
    console.warn("[PipelineTrace] completeTrace() called but no active trace — was startTrace() called?");
  }
}

/**
 * Restore the latest persisted trace for a given analysisId from sessionStorage.
 * Does NOT set `_currentTrace` — call `getLatestTrace` to find an in-memory trace.
 */
export function restoreTraceForAnalysis(analysisId: string): PipelineTrace | null {
  // First check if we have an in-memory trace for this analysis
  const inMemory = getLatestTrace(analysisId);
  if (inMemory) return inMemory;

  // Fall back to sessionStorage (legacy key format)
  try {
    const key = `pipeline_trace_${analysisId}`;
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as PipelineTrace;
      // Update the in-memory map so subsequent calls use the cached version
      _traces.set(traceKey(analysisId, parsed.runId ?? "restored"), parsed);
      return parsed;
    }
  } catch (_) { /* parse error or no sessionStorage */ }
  return null;
}

export function traceEdgeFunction(entry: EdgeFunctionTrace): void {
  if (_currentTrace) {
    _currentTrace.edgeFunctions.push(entry);
  }
}

export function traceEvidenceExtraction(data: EvidenceExtractionTrace): void {
  if (_currentTrace) {
    _currentTrace.evidenceExtraction = data;
  } else {
    console.warn("[PipelineTrace] traceEvidenceExtraction called but no active trace");
  }
}

export function traceStrategicStages(data: StrategicStageTrace): void {
  if (_currentTrace) {
    _currentTrace.strategicStages = data;
  } else {
    console.warn("[PipelineTrace] traceStrategicStages called but no active trace");
  }
}

export function traceMorphological(data: MorphologicalTrace): void {
  if (_currentTrace) {
    _currentTrace.morphological = data;
  } else {
    console.warn("[PipelineTrace] traceMorphological called but no active trace");
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
  } else {
    console.warn(`[PipelineTrace] traceError called but no active trace: ${error}`);
  }
}

export function setPipelineDiagnosticSummary(summary: Record<string, any>): void {
  if (_currentTrace) {
    _currentTrace.pipelineDiagnosticSummary = summary;
  } else {
    console.warn("[PipelineTrace] setPipelineDiagnosticSummary called but no active trace");
  }
}

/**
 * Download the best available trace for an analysis as a JSON file.
 *
 * Priority:
 *   1. Latest completed trace for `analysisId` (if provided)
 *   2. Current active trace (even if still running)
 *   3. Warn and abort if nothing found
 *
 * The filename includes: analysisId + runId + timestamp for unambiguous identification.
 */
export function downloadTrace(analysisId?: string | null, productName?: string): void {
  let trace: PipelineTrace | null = null;

  if (analysisId) {
    trace = getLatestTrace(analysisId);
  }
  if (!trace) {
    trace = _currentTrace;
  }

  if (!trace) {
    console.warn("[PipelineTrace] No trace to download");
    return;
  }

  // Attach a warning flag if the trace is still running
  const exportPayload = trace.completedAt
    ? trace
    : { ...trace, _warning: "INCOMPLETE — trace is still running; completedAt is null and data may be partial" };

  const json = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  // Filename: [productSlug-][analysisId-][runId-]timestamp.json
  const slug = productName ? productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) + "-" : "";
  const aid = (trace.analysisId ?? "unknown").slice(0, 8);
  const rid = trace.runId ?? "r0";
  a.download = `pipeline-trace-${slug}${aid}-${rid}-${Date.now()}.json`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
