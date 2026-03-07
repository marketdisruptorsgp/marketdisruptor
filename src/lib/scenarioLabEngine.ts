/**
 * SCENARIO LAB ENGINE — Multi-scenario storage and comparison
 *
 * Stores snapshots of strategic analysis results under different
 * challenge hypotheses, enabling side-by-side comparison.
 */

import type { ActiveChallenge } from "@/components/command-deck/ScenarioBanner";

export interface ScenarioSnapshot {
  id: string;
  name: string;
  challenges: ActiveChallenge[];
  verdict: string | null;
  verdictConfidence: number;
  primaryConstraint: string | null;
  breakthroughOpportunity: string | null;
  trappedValue: string | null;
  trappedValueEstimate: string | null;
  topPlaybookTitle: string | null;
  leverageScore: number;
  strategicPotential: number;
  timestamp: number;
}

// In-memory store keyed by analysisId
const scenarioStore = new Map<string, ScenarioSnapshot[]>();

export function getSavedScenarios(analysisId: string): ScenarioSnapshot[] {
  return scenarioStore.get(analysisId) || [];
}

export function saveScenarioSnapshot(analysisId: string, scenario: ScenarioSnapshot): void {
  const existing = scenarioStore.get(analysisId) || [];
  // Replace if same id exists
  const idx = existing.findIndex(s => s.id === scenario.id);
  if (idx >= 0) existing[idx] = scenario;
  else existing.push(scenario);
  scenarioStore.set(analysisId, existing);
}

export function deleteScenarioSnapshot(analysisId: string, scenarioId: string): void {
  const existing = scenarioStore.get(analysisId) || [];
  scenarioStore.set(analysisId, existing.filter(s => s.id !== scenarioId));
}

export interface ScenarioComparisonItem {
  metric: string;
  values: { scenarioName: string; value: string; isBest: boolean }[];
}

export function compareScenarioSnapshots(scenarios: ScenarioSnapshot[]): ScenarioComparisonItem[] {
  if (scenarios.length < 2) return [];

  const metrics: { label: string; getter: (s: ScenarioSnapshot) => string; higherIsBetter: boolean }[] = [
    { label: "Strategic Verdict", getter: s => s.verdict || "—", higherIsBetter: true },
    { label: "Confidence", getter: s => `${Math.round(s.verdictConfidence * 100)}%`, higherIsBetter: true },
    { label: "Primary Constraint", getter: s => s.primaryConstraint || "—", higherIsBetter: false },
    { label: "Opportunity", getter: s => s.breakthroughOpportunity || "—", higherIsBetter: true },
    { label: "Trapped Value", getter: s => s.trappedValueEstimate || s.trappedValue || "—", higherIsBetter: false },
    { label: "Top Playbook", getter: s => s.topPlaybookTitle || "—", higherIsBetter: true },
    { label: "Leverage Score", getter: s => s.leverageScore.toFixed(1), higherIsBetter: true },
    { label: "Strategic Potential", getter: s => s.strategicPotential.toFixed(1), higherIsBetter: true },
  ];

  return metrics.map(m => {
    const values = scenarios.map(s => ({
      scenarioName: s.name,
      value: m.getter(s),
      isBest: false,
    }));

    // Mark best for numeric metrics
    if (m.label === "Confidence" || m.label === "Leverage Score" || m.label === "Strategic Potential") {
      const nums = scenarios.map(s => {
        const v = m.getter(s).replace("%", "");
        return parseFloat(v) || 0;
      });
      const bestIdx = m.higherIsBetter
        ? nums.indexOf(Math.max(...nums))
        : nums.indexOf(Math.min(...nums));
      if (bestIdx >= 0) values[bestIdx].isBest = true;
    }

    return { metric: m.label, values };
  });
}
