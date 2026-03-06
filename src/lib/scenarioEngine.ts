/**
 * SCENARIO ENGINE — Strategy Simulation → Evidence Feedback Loop
 *
 * Manages tool scenario persistence (database + in-memory cache)
 * and converts simulation outputs into canonical Evidence objects
 * that feed back into the intelligence engine.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Evidence, EvidenceMode, EvidencePipelineStep } from "@/lib/evidenceEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface ToolScenario {
  scenarioId: string;
  analysisId: string;
  toolId: string;
  scenarioName: string;
  inputVariables: Record<string, number | string>;
  outputResults: Record<string, number | string>;
  strategicImpact: "high" | "medium" | "low";
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
//  IN-MEMORY CACHE (fast reads, synced with DB)
// ═══════════════════════════════════════════════════════════════

const scenarioCache = new Map<string, ToolScenario[]>();

let scenarioIdCounter = 0;

export function generateScenarioId(): string {
  return `scenario-${Date.now()}-${++scenarioIdCounter}`;
}

// ═══════════════════════════════════════════════════════════════
//  DATABASE PERSISTENCE
// ═══════════════════════════════════════════════════════════════

/**
 * Save scenario to database and update in-memory cache.
 */
export async function saveScenarioToDb(scenario: ToolScenario): Promise<void> {
  // Update in-memory cache immediately for fast UI response
  saveScenarioToCache(scenario);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Anonymous users fall back to cache only

    const { error } = await supabase
      .from("tool_scenarios" as any)
      .upsert({
        id: scenario.scenarioId,
        analysis_id: scenario.analysisId,
        user_id: user.id,
        tool_id: scenario.toolId,
        scenario_name: scenario.scenarioName,
        inputs: scenario.inputVariables,
        outputs: scenario.outputResults,
        strategic_impact: scenario.strategicImpact,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "id" });

    if (error) {
      console.warn("[ScenarioEngine] DB save failed, using cache:", error.message);
    }
  } catch {
    // Silent fallback to cache-only
  }
}

/**
 * Load scenarios from database for an analysis.
 */
export async function loadScenariosFromDb(analysisId: string): Promise<ToolScenario[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getScenarios(analysisId);

    const { data, error } = await supabase
      .from("tool_scenarios" as any)
      .select("*")
      .eq("analysis_id", analysisId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }) as any;

    if (error || !data) return getScenarios(analysisId);

    const scenarios: ToolScenario[] = (data as any[]).map((row: any) => ({
      scenarioId: row.id,
      analysisId: row.analysis_id,
      toolId: row.tool_id,
      scenarioName: row.scenario_name,
      inputVariables: row.inputs || {},
      outputResults: row.outputs || {},
      strategicImpact: row.strategic_impact || "medium",
      timestamp: new Date(row.created_at).getTime(),
    }));

    // Sync to cache
    if (scenarios.length > 0) {
      scenarioCache.set(analysisId, scenarios);
    }

    return scenarios;
  } catch {
    return getScenarios(analysisId);
  }
}

/**
 * Delete scenario from database and cache.
 */
export async function deleteScenarioFromDb(analysisId: string, scenarioId: string): Promise<void> {
  deleteScenario(analysisId, scenarioId);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("tool_scenarios" as any)
      .delete()
      .eq("id", scenarioId)
      .eq("user_id", user.id);
  } catch {
    // Silent fallback
  }
}

// ═══════════════════════════════════════════════════════════════
//  IN-MEMORY CACHE OPERATIONS (synchronous, for fast reads)
// ═══════════════════════════════════════════════════════════════

function saveScenarioToCache(scenario: ToolScenario): void {
  const key = scenario.analysisId;
  const existing = scenarioCache.get(key) || [];
  const idx = existing.findIndex(s => s.scenarioId === scenario.scenarioId);
  if (idx >= 0) {
    existing[idx] = scenario;
  } else {
    existing.push(scenario);
  }
  scenarioCache.set(key, existing);
}

/** @deprecated Use saveScenarioToDb for persistence */
export function saveScenario(scenario: ToolScenario): void {
  saveScenarioToCache(scenario);
  // Fire-and-forget DB save
  saveScenarioToDb(scenario).catch(() => {});
}

export function getScenarios(analysisId: string): ToolScenario[] {
  return scenarioCache.get(analysisId) || [];
}

export function deleteScenario(analysisId: string, scenarioId: string): void {
  const existing = scenarioCache.get(analysisId) || [];
  scenarioCache.set(analysisId, existing.filter(s => s.scenarioId !== scenarioId));
}

export function clearScenarios(analysisId: string): void {
  scenarioCache.delete(analysisId);
}

// ═══════════════════════════════════════════════════════════════
//  SERIALIZATION (for analysis_data persistence)
// ═══════════════════════════════════════════════════════════════

export function serializeScenarios(analysisId: string): ToolScenario[] {
  return getScenarios(analysisId);
}

export function hydrateScenarios(analysisId: string, scenarios: ToolScenario[]): void {
  if (Array.isArray(scenarios) && scenarios.length > 0) {
    scenarioCache.set(analysisId, scenarios);
  }
}

// ═══════════════════════════════════════════════════════════════
//  SCENARIO → EVIDENCE BRIDGE
// ═══════════════════════════════════════════════════════════════

const TOOL_EVIDENCE_TYPE_MAP: Record<string, Evidence["type"]> = {
  "sba-loan-calculator": "signal",
  "deal-structure-simulator": "signal",
  "dscr-calculator": "signal",
  "acquisition-roi-model": "signal",
  "tam-calculator": "signal",
  "unit-economics-model": "signal",
  "revenue-model-simulator": "signal",
  "cash-flow-quality": "signal",
  "industry-fragmentation-detector": "opportunity",
  "seller-motivation-signals": "signal",
  "deal-risk-scanner": "risk",
  "competitive-moat-analyzer": "signal",
  "assumption-stress-tester": "assumption",
  "innovation-pathway-mapper": "opportunity",
  "value-chain-analyzer": "leverage",
};

/**
 * Convert a saved scenario into a canonical Evidence object.
 * This is the feedback loop: Simulation → Evidence → Reasoning → Intelligence
 */
export function scenarioToEvidence(
  scenario: ToolScenario,
  mode: EvidenceMode = "product",
): Evidence {
  const evidenceType = TOOL_EVIDENCE_TYPE_MAP[scenario.toolId] || "signal";

  const outputEntries = Object.entries(scenario.outputResults).slice(0, 4);
  const outputDesc = outputEntries
    .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").trim()}: ${typeof v === "number" ? v.toLocaleString() : v}`)
    .join(", ");

  const impactScore = scenario.strategicImpact === "high" ? 8 : scenario.strategicImpact === "medium" ? 6 : 4;

  return {
    id: `sim-${scenario.scenarioId}`,
    type: evidenceType,
    label: `${scenario.scenarioName} (${scenario.toolId.replace(/-/g, " ")})`,
    description: `Simulation output: ${outputDesc}`,
    pipelineStep: "stress_test" as EvidencePipelineStep,
    tier: "system",
    impact: impactScore,
    confidenceScore: 0.85,
    category: "simulation",
    mode,
    sourceEngine: "pipeline" as const,
  };
}

/**
 * Convert ALL saved scenarios for an analysis into Evidence objects.
 */
export function allScenariosToEvidence(
  analysisId: string,
  mode: EvidenceMode = "product",
): Evidence[] {
  return getScenarios(analysisId).map(s => scenarioToEvidence(s, mode));
}
