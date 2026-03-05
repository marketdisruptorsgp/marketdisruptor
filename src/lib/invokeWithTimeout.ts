import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps supabase.functions.invoke with a client-side timeout.
 * Prevents the UI from hanging forever when edge functions time out
 * (e.g., AI gateway slow responses causing Supabase 504s that never reach the client).
 */
export async function invokeWithTimeout<T = any>(
  functionName: string,
  options: { body?: any },
  timeoutMs = 180_000, // 3 minutes default — generous but prevents infinite hang
): Promise<{ data: T | null; error: any }> {
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
    return result as { data: T | null; error: any };
  } catch (err) {
    clearTimeout(timeoutId);
    return { data: null, error: err };
  }
}
