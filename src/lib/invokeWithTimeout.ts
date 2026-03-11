import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps supabase.functions.invoke with a client-side timeout and optional auto-retry.
 * Prevents the UI from hanging forever when edge functions time out
 * (e.g., AI gateway slow responses causing Supabase 504s that never reach the client).
 */
export async function invokeWithTimeout<T = any>(
  functionName: string,
  options: { body?: any },
  timeoutMs = 180_000, // 3 minutes default — generous but prevents infinite hang
  retries = 0, // Number of automatic retries on transient failures
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await Promise.race([
        supabase.functions.invoke(functionName, {
          ...options,
        }),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error(`${functionName} timed out after ${Math.round(timeoutMs / 1000)}s. The analysis may still be processing — please try again.`));
          });
        }),
      ]);
      clearTimeout(timeoutId);

      // Check for transient server errors that are retryable
      const r = result as { data: T | null; error: any };
      if (r.error && attempt < retries && isRetryable(r.error)) {
        lastError = r.error;
        console.warn(`[invokeWithTimeout] ${functionName} attempt ${attempt + 1} failed (retryable), retrying...`);
        await delay(Math.min(2000 * (attempt + 1), 6000)); // backoff: 2s, 4s, 6s
        continue;
      }
      return r;
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      if (attempt < retries && isRetryable(err)) {
        console.warn(`[invokeWithTimeout] ${functionName} attempt ${attempt + 1} threw (retryable), retrying...`);
        await delay(Math.min(2000 * (attempt + 1), 6000));
        continue;
      }
      return { data: null, error: err };
    }
  }

  return { data: null, error: lastError };
}

function isRetryable(err: any): boolean {
  if (!err) return false;
  const msg = String(err?.message || err || "").toLowerCase();
  return msg.includes("timeout") || msg.includes("timed out") ||
    msg.includes("504") || msg.includes("502") || msg.includes("503") ||
    msg.includes("rate limit") || msg.includes("429") ||
    msg.includes("network") || msg.includes("fetch");
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
