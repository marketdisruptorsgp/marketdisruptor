/**
 * STRATEGIC OUTCOME SIMULATOR ENGINE
 *
 * Given a playbook + evidence + narrative, projects the economic
 * and operational consequences of executing the recommended strategy.
 *
 * All projections are deterministic derivations from evidence signals,
 * playbook impact scores, and detected patterns. No AI inference.
 */

import type { TransformationPlaybook } from "@/lib/playbookEngine";
import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicNarrative } from "@/lib/strategicEngine";

/* ── Types ── */

export interface ProjectedOutcome {
  revenueModelShift: {
    from: string;
    to: string;
  };
  marginImpact: {
    label: string;         // e.g. "18–35%"
    direction: "expansion" | "compression" | "stable";
    confidence: "high" | "moderate" | "low";
    rationale: string;
  };
  scalabilityImpact: {
    multiplier: string;    // e.g. "4–6×"
    description: string;
    confidence: "high" | "moderate" | "low";
  };
  timeToRealize: {
    range: string;         // e.g. "12–18 months"
    phases: number;
  };
  strategicRisk: {
    level: "low" | "moderate" | "high";
    description: string;
  };
  economicSignals: {
    label: string;
    value: string;
    direction: "positive" | "neutral" | "negative";
  }[];
}

/* ── Helpers ── */

function marginRange(marginScore: number): { label: string; direction: "expansion" | "compression" | "stable" } {
  if (marginScore >= 8) return { label: "30–50%", direction: "expansion" };
  if (marginScore >= 6) return { label: "18–35%", direction: "expansion" };
  if (marginScore >= 4) return { label: "8–18%", direction: "expansion" };
  if (marginScore >= 2) return { label: "3–8%", direction: "expansion" };
  return { label: "Minimal", direction: "stable" };
}

function scalabilityMultiplier(revenueScore: number, capitalScore: number): string {
  const avg = (revenueScore + capitalScore) / 2;
  if (avg >= 8) return "6–10×";
  if (avg >= 6) return "4–6×";
  if (avg >= 4) return "2–4×";
  if (avg >= 2) return "1.5–2×";
  return "1–1.5×";
}

function timeRange(difficulty: number, phases: number): string {
  if (difficulty >= 8) return "24–36 months";
  if (difficulty >= 6) return "12–24 months";
  if (difficulty >= 4) return "6–18 months";
  return "3–6 months";
}

function riskLevel(difficulty: number): { level: "low" | "moderate" | "high"; desc: string } {
  if (difficulty >= 7) return { level: "high", desc: "Significant organizational change required" };
  if (difficulty >= 4) return { level: "moderate", desc: "Manageable execution complexity" };
  return { level: "low", desc: "Incremental execution path" };
}

function confidenceFromEvidence(evidence: Evidence[], category?: string): "high" | "moderate" | "low" {
  const relevant = category
    ? evidence.filter(e => e.category?.toLowerCase().includes(category.toLowerCase()))
    : evidence;
  if (relevant.length >= 6) return "high";
  if (relevant.length >= 3) return "moderate";
  return "low";
}

function deriveRevenueShift(playbook: TransformationPlaybook, narrative: StrategicNarrative | null): { from: string; to: string } {
  // Use playbook comparables if available
  if (playbook.comparables?.length > 0) {
    return { from: playbook.comparables[0].from, to: playbook.comparables[0].to };
  }
  // Derive from narrative constraint/opportunity
  const from = narrative?.primaryConstraint
    ? `${narrative.primaryConstraint}-bound model`
    : "Current revenue model";
  const to = narrative?.breakthroughOpportunity
    ? narrative.breakthroughOpportunity
    : playbook.strategicShift || "Optimized model";
  return { from, to };
}

function deriveEconomicSignals(
  playbook: TransformationPlaybook,
  evidence: Evidence[],
  narrative: StrategicNarrative | null,
): ProjectedOutcome["economicSignals"] {
  const signals: ProjectedOutcome["economicSignals"] = [];

  // Revenue signal
  const revScore = playbook.impact.revenueExpansion;
  if (revScore >= 6) {
    signals.push({
      label: "Revenue Growth Potential",
      value: revScore >= 8 ? "Significant — new revenue streams unlocked" : "Moderate — existing channels expand",
      direction: "positive",
    });
  }

  // Cost structure signal
  const costEvidence = evidence.filter(e => e.category === "cost_structure");
  if (costEvidence.length > 0) {
    signals.push({
      label: "Cost Structure Impact",
      value: playbook.impact.marginImprovement >= 6
        ? "Variable costs shift to fixed — unit economics improve at scale"
        : "Incremental cost optimization",
      direction: playbook.impact.marginImprovement >= 4 ? "positive" : "neutral",
    });
  }

  // Competitive position signal
  const compEvidence = evidence.filter(e => e.category === "competitive_pressure");
  if (compEvidence.length > 0) {
    signals.push({
      label: "Competitive Positioning",
      value: playbook.impact.capitalEfficiency >= 6
        ? "Creates structural differentiation vs. incumbent approaches"
        : "Improves relative positioning",
      direction: "positive",
    });
  }

  // Operational dependency signal
  if (narrative?.primaryConstraint) {
    signals.push({
      label: "Constraint Resolution",
      value: `Directly addresses: ${narrative.primaryConstraint}`,
      direction: "positive",
    });
  }

  return signals.slice(0, 4);
}

/* ── Main Projection Function ── */

export function projectStrategicOutcome(
  playbook: TransformationPlaybook,
  evidence: Evidence[],
  narrative: StrategicNarrative | null,
): ProjectedOutcome {
  const { impact } = playbook;
  const margin = marginRange(impact.marginImprovement);
  const shift = deriveRevenueShift(playbook, narrative);
  const risk = riskLevel(impact.executionDifficulty);

  return {
    revenueModelShift: shift,
    marginImpact: {
      label: margin.label,
      direction: margin.direction,
      confidence: confidenceFromEvidence(evidence, "cost_structure"),
      rationale: impact.marginImprovement >= 6
        ? "Reducing variable cost dependency enables margin expansion at scale"
        : "Operational improvements contribute to incremental margin gains",
    },
    scalabilityImpact: {
      multiplier: scalabilityMultiplier(impact.revenueExpansion, impact.capitalEfficiency),
      description: impact.revenueExpansion >= 6
        ? "Delivery capacity increases without proportional resource growth"
        : "Moderate throughput improvement within existing structure",
      confidence: confidenceFromEvidence(evidence, "demand"),
    },
    timeToRealize: {
      range: timeRange(impact.executionDifficulty, playbook.phases.length),
      phases: playbook.phases.length,
    },
    strategicRisk: {
      level: risk.level,
      description: risk.desc,
    },
    economicSignals: deriveEconomicSignals(playbook, evidence, narrative),
  };
}
