/**
 * Background-tab keepalive — prevents browser throttling of timers/fetch
 * during the pipeline run.
 *
 * Strategy: acquire a Web Lock for the duration of the pipeline.
 * Web Locks keep the tab's event loop active even when backgrounded.
 * Falls back to a periodic self-ping via BroadcastChannel if Web Locks
 * are unavailable.
 */

let releaseLock: (() => void) | null = null;
let fallbackInterval: ReturnType<typeof setInterval> | null = null;

export function acquireKeepAlive(): void {
  if (releaselock()) return; // already held

  // Prefer Web Locks API (Chrome 69+, Firefox 96+, Safari 15.4+)
  if ("locks" in navigator) {
    const controller = new AbortController();
    navigator.locks.request(
      "pipeline-keepalive",
      { signal: controller.signal },
      () => new Promise<void>((resolve) => {
        releaselock = () => {
          resolve();
          releaselock = null;
        };
      }),
    ).catch(() => { /* aborted or unavailable */ });

    releaseLock = () => {
      controller.abort();
      releaselock = null;
    };
    return;
  }

  // Fallback: BroadcastChannel ping keeps event loop alive
  try {
    const ch = new BroadcastChannel("pipeline-keepalive");
    fallbackInterval = setInterval(() => ch.postMessage("ping"), 15_000);
    releaselock = () => {
      if (fallbackInterval) clearInterval(fallbackInterval);
      fallbackInterval = null;
      ch.close();
      releaselock = null;
    };
  } catch {
    // Neither API available — best effort, nothing to do
  }
}

export function releaseKeepAlive(): void {
  releaselock?.();
  releaselock = null;
  if (fallbackInterval) {
    clearInterval(fallbackInterval);
    fallbackInterval = null;
  }
}

// internal mutable ref
function releaselock(): boolean {
  return releaselock !== null;
}
