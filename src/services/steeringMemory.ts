import { supabase } from "@/integrations/supabase/client";

export interface SteeringEntry {
  stepKey: string;
  context: string;
  timestamp: string;
}

/**
 * Save steering context for a step into the analysis_data blob
 */
export async function saveSteeringContext(
  analysisId: string,
  stepKey: string,
  context: string
): Promise<void> {
  if (!analysisId || !context.trim()) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from("saved_analyses") as any)
      .select("analysis_data")
      .eq("id", analysisId)
      .single();

    const prev = (existing?.analysis_data as Record<string, unknown>) || {};
    const memory = (prev.steeringMemory as Record<string, SteeringEntry>) || {};

    memory[stepKey] = {
      stepKey,
      context: context.trim(),
      timestamp: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("saved_analyses") as any)
      .update({ analysis_data: { ...prev, steeringMemory: memory } })
      .eq("id", analysisId);
  } catch (err) {
    console.error("Failed to save steering context:", err);
  }
}

/**
 * Load steering context for a specific step from analysis_data
 */
export function loadSteeringContext(
  analysisData: Record<string, unknown> | null,
  stepKey: string
): string {
  if (!analysisData) return "";
  const memory = analysisData.steeringMemory as Record<string, SteeringEntry> | undefined;
  return memory?.[stepKey]?.context || "";
}

/**
 * Get all steering entries across steps
 */
export function getAllSteeringHistory(
  analysisData: Record<string, unknown> | null
): SteeringEntry[] {
  if (!analysisData) return [];
  const memory = analysisData.steeringMemory as Record<string, SteeringEntry> | undefined;
  if (!memory) return [];
  return Object.values(memory).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
