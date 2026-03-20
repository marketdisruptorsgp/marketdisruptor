/**
 * Lightweight global signal for pipeline running state.
 * Avoids coupling useAutoAnalysis ↔ usePipelineOrchestrator via React context.
 * The orchestrator sets this; the strategic engine reads it.
 */

let _pipelineRunning = false;

export function setPipelineRunning(running: boolean): void {
  _pipelineRunning = running;
}

export function isPipelineRunning(): boolean {
  return _pipelineRunning;
}
