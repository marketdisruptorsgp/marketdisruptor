/**
 * Background-tab keepalive — prevents browser throttling of timers/fetch
 * during the pipeline run.
 *
 * Strategy: acquire a Web Lock for the duration of the pipeline.
 * Web Locks keep the tab's event loop active even when backgrounded.
 * Falls back to a periodic self-ping via BroadcastChannel if Web Locks
 * are unavailable.
 */

let _release: (() => void) | null = null;
let _fallbackInterval: ReturnType<typeof setInterval> | null = null;

export function acquireKeepAlive(): void {
  if (_release) return; // already held

  // Prefer Web Locks API (Chrome 69+, Firefox 96+, Safari 15.4+)
  if ("locks" in navigator) {
    const controller = new AbortController();
    let resolveHolder: (() => void) | null = null;

    navigator.locks.request(
      "pipeline-keepalive",
      { signal: controller.signal },
      () => new Promise<void>((resolve) => {
        resolveHolder = resolve;
      }),
    ).catch(() => { /* aborted or unavailable */ });

    _release = () => {
      resolveHolder?.();
      controller.abort();
      _release = null;
    };
    return;
  }

  // Fallback: BroadcastChannel ping keeps event loop alive
  try {
    const ch = new BroadcastChannel("pipeline-keepalive");
    _fallbackInterval = setInterval(() => ch.postMessage("ping"), 15_000);
    _release = () => {
      if (_fallbackInterval) clearInterval(_fallbackInterval);
      _fallbackInterval = null;
      ch.close();
      _release = null;
    };
  } catch {
    // Neither API available — best effort
  }
}

export function releaseKeepAlive(): void {
  _release?.();
  _release = null;
  if (_fallbackInterval) {
    clearInterval(_fallbackInterval);
    _fallbackInterval = null;
  }
}
