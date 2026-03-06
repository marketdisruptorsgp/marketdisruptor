/**
 * SCENARIO ENGINE — Strategy Simulation → Evidence Feedback Loop
 *
 * Manages tool scenario persistence and converts simulation outputs
 * into canonical Evidence objects that feed back into the intelligence engine.
 */

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
//  SCENARIO STORAGE (in-memory + analysis_data persistence)
// ═══════════════════════════════════════════════════════════════

const scenarioStore = new Map<string, ToolScenario[]>();

let scenarioIdCounter = 0;

export function generateScenarioId(): string {
  return `scenario-${Date.now()}-${++scenarioIdCounter}`;
}

export function saveScenario(scenario: ToolScenario): void {
  const key = scenario.analysisId;
  const existing = scenarioStore.get(key) || [];
  // Replace if same scenarioId exists, otherwise append
  const idx = existing.findIndex(s => s.scenarioId === scenario.scenarioId);
  if (idx >= 0) {
    existing[idx] = scenario;
  } else {
    existing.push(scenario);
  }
  scenarioStore.set(key, existing);
}

export function getScenarios(analysisId: string): ToolScenario[] {
  return scenarioStore.get(analysisId) || [];
}

export function deleteScenario(analysisId: string, scenarioId: string): void {
  const existing = scenarioStore.get(analysisId) || [];
  scenarioStore.set(analysisId, existing.filter(s => s.scenarioId !== scenarioId));
}

export function clearScenarios(analysisId: string): void {
  scenarioStore.delete(analysisId);
}

// ═══════════════════════════════════════════════════════════════
//  SERIALIZATION (for analysis_data persistence)
// ═══════════════════════════════════════════════════════════════

export function serializeScenarios(analysisId: string): ToolScenario[] {
  return getScenarios(analysisId);
}

export function hydrateScenarios(analysisId: string, scenarios: ToolScenario[]): void {
  if (Array.isArray(scenarios) && scenarios.length > 0) {
    scenarioStore.set(analysisId, scenarios);
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

  // Build a description from key outputs
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
    confidenceScore: 0.85, // Simulations have high confidence (deterministic)
    category: "simulation",
    mode,
    sourceEngine: "pipeline" as const, // Use pipeline as source since simulations are user-driven
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
