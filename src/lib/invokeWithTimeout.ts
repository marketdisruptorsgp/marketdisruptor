import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps supabase.functions.invoke with a client-side timeout and optional auto-retry.
 * Prevents the UI from hanging forever when edge functions time out
 * (e.g., AI gateway slow responses causing Supabase 504s that never reach the client).
 */

export type InvokeErrorType = "timeout" | "rate_limit" | "credits_exhausted" | "network" | "server" | "unknown";

export interface TypedInvokeError {
  type: InvokeErrorType;
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
  raw?: any;
}

/** Classify an error into a user-actionable type */
export function classifyError(err: any): TypedInvokeError {
  if (!err) return { type: "unknown", message: "Unknown error", retryable: false };
  const msg = String(err?.message || err || "").toLowerCase();
  const statusCode = err?.status || err?.statusCode || (msg.match(/\b(4\d\d|5\d\d)\b/)?.[0]);

  if (String(statusCode) === "402" || msg.includes("402") || msg.includes("credits") || msg.includes("insufficient")) {
    return { type: "credits_exhausted", message: "Your analysis credits are exhausted. Please upgrade your plan to continue.", retryable: false, raw: err };
  }
  if (String(statusCode) === "429" || msg.includes("429") || msg.includes("rate limit")) {
    return { type: "rate_limit", message: "Too many requests — please wait a moment and try again.", retryable: true, retryAfterMs: 15_000, raw: err };
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return { type: "timeout", message: "The analysis timed out. This usually resolves on retry.", retryable: true, retryAfterMs: 5_000, raw: err };
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
    return { type: "network", message: "Network error — check your connection and try again.", retryable: true, retryAfterMs: 3_000, raw: err };
  }
  if (msg.includes("502") || msg.includes("503") || msg.includes("504")) {
    return { type: "server", message: "Server temporarily unavailable — retrying automatically.", retryable: true, retryAfterMs: 5_000, raw: err };
  }
  return { type: "unknown", message: err?.message || "Analysis failed — please try again.", retryable: true, raw: err };
}

export async function invokeWithTimeout<T = any>(
  functionName: string,
  options: { body?: any },
  timeoutMs = 150_000,
  retries = 0,
): Promise<{ data: T | null; error: any; errorType?: TypedInvokeError }> {
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

      const r = result as { data: T | null; error: any };
      if (r.error && attempt < retries && isRetryable(r.error)) {
        lastError = r.error;
        console.warn(`[invokeWithTimeout] ${functionName} attempt ${attempt + 1} failed (retryable), retrying...`);
        await delay(Math.min(2000 * (attempt + 1), 6000));
        continue;
      }
      if (r.error) {
        return { ...r, errorType: classifyError(r.error) };
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
      return { data: null, error: err, errorType: classifyError(err) };
    }
  }

  return { data: null, error: lastError, errorType: classifyError(lastError) };
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
