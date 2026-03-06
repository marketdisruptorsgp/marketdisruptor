/**
 * EVIDENCE BRIDGE — Converts local engine outputs into canonical Evidence objects.
 *
 * Bridges:
 *   innovationEngine → opportunity/leverage evidence
 *   signalDetection → signal evidence
 *   financialModelingEngine → constraint/leverage evidence
 *   competitorScout → competitor evidence
 */

import type {
  Evidence,
  EvidenceMode,
  EvidencePipelineStep,
} from "@/lib/evidenceEngine";
import { classifyTier } from "@/lib/tierDiscoveryEngine";
import type { InnovationOutput, InnovationOpportunity } from "@/lib/innovationEngine";
import type { DetectedSignal } from "@/lib/signalDetection";

let bridgeId = 0;
function bid(prefix: string): string { return `bridge-${prefix}-${++bridgeId}`; }

// ═══════════════════════════════════════════════════════════════
//  INNOVATION ENGINE → Evidence
// ═══════════════════════════════════════════════════════════════

export function bridgeInnovationToEvidence(
  output: InnovationOutput,
  mode: EvidenceMode = "product",
): Evidence[] {
  bridgeId = 0;
  const items: Evidence[] = [];

  const categoryStepMap: Record<string, EvidencePipelineStep> = {
    structural_leverage: "disrupt",
    pricing_model_shifts: "redesign",
    automation_opportunities: "redesign",
    cost_breakthroughs: "stress_test",
    acquisition_rollup_opportunities: "redesign",
    platform_expansion_paths: "redesign",
  };

  for (const [category, opportunities] of Object.entries(output)) {
    if (!Array.isArray(opportunities)) continue;
    opportunities.forEach((opp: InnovationOpportunity) => {
      items.push({
        id: bid("innov"),
        type: category === "structural_leverage" ? "leverage" : "opportunity",
        label: opp.title,
        description: opp.description,
        pipelineStep: categoryStepMap[category] || "redesign",
        tier: classifyTier(opp.title + " " + opp.description),
        impact: opp.impactPotential === "high" ? 8 : opp.impactPotential === "medium" ? 6 : 4,
        confidenceScore: opp.confidence,
        category,
        mode,
        sourceEngine: "innovation",
      });
    });
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════
//  SIGNAL DETECTION → Evidence
// ═══════════════════════════════════════════════════════════════

export function bridgeSignalsToEvidence(
  signals: DetectedSignal[],
  mode: EvidenceMode = "product",
): Evidence[] {
  bridgeId = 0;
  return signals.map((signal) => ({
    id: bid("sig"),
    type: "signal" as const,
    label: signal.label,
    description: `Detected: ${signal.type} (${signal.ontology})`,
    pipelineStep: "report" as const,
    tier: classifyTier(signal.label),
    confidenceScore: signal.confidence === "high" ? 0.8 : signal.confidence === "medium" ? 0.6 : 0.4,
    category: signal.ontology,
    mode,
    sourceEngine: "signal_detection" as const,
  }));
}

// ═══════════════════════════════════════════════════════════════
//  FINANCIAL MODEL → Evidence
// ═══════════════════════════════════════════════════════════════

export function bridgeFinancialToEvidence(
  sbaResult: any | null,
  valuationResult: any | null,
  mode: EvidenceMode = "business_model",
): Evidence[] {
  bridgeId = 0;
  const items: Evidence[] = [];

  if (sbaResult) {
    if (sbaResult.dscrStatus === "not_viable" || sbaResult.dscrStatus === "high_risk") {
      items.push({
        id: bid("fin"),
        type: "constraint",
        label: `DSCR ${sbaResult.dscrStatus === "not_viable" ? "Not Viable" : "High Risk"}: ${(sbaResult.dscr?.value ?? 0).toFixed(2)}x`,
        description: "Debt service coverage ratio indicates financial stress under current assumptions.",
        pipelineStep: "report",
        tier: "structural",
        impact: sbaResult.dscrStatus === "not_viable" ? 9 : 7,
        mode,
        sourceEngine: "financial_model",
        category: "financial_viability",
      });
    }

    if (sbaResult.ownerCashFlowAfterDebt?.value < 0) {
      items.push({
        id: bid("fin"),
        type: "risk",
        label: "Negative Owner Cash Flow After Debt Service",
        description: "Owner would need to inject capital to sustain operations.",
        pipelineStep: "stress_test",
        tier: "structural",
        impact: 9,
        mode,
        sourceEngine: "financial_model",
        category: "cash_flow",
      });
    }
  }

  if (valuationResult) {
    if (valuationResult.multipleStatus === "premium") {
      items.push({
        id: bid("fin"),
        type: "risk",
        label: `Premium Valuation: ${(valuationResult.sdeMultiple?.value ?? 0).toFixed(1)}x SDE`,
        description: "Purchase price implies premium multiples relative to earnings.",
        pipelineStep: "report",
        tier: "structural",
        impact: 7,
        mode,
        sourceEngine: "financial_model",
        category: "valuation",
      });
    } else if (valuationResult.multipleStatus === "strong_value") {
      items.push({
        id: bid("fin"),
        type: "leverage",
        label: `Strong Value: ${(valuationResult.sdeMultiple?.value ?? 0).toFixed(1)}x SDE Multiple`,
        description: "Purchase price represents strong value relative to earnings.",
        pipelineStep: "report",
        tier: "structural",
        impact: 7,
        mode,
        sourceEngine: "financial_model",
        category: "valuation",
      });
    }
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════
//  COMPETITOR SCOUT → Evidence
// ═══════════════════════════════════════════════════════════════

export function bridgeCompetitorsToEvidence(
  competitors: any[],
  mode: EvidenceMode = "product",
): Evidence[] {
  bridgeId = 0;
  if (!Array.isArray(competitors)) return [];

  return competitors.slice(0, 8).map((comp: any) => ({
    id: bid("comp"),
    type: "competitor" as const,
    label: comp.name || comp.company || comp.competitor || "Competitor",
    description: comp.advantage || comp.description || comp.threat || undefined,
    pipelineStep: "report" as const,
    tier: classifyTier(comp.name || ""),
    impact: comp.threatLevel === "high" ? 8 : comp.threatLevel === "medium" ? 6 : 4,
    mode,
    sourceEngine: "competitor_scout" as const,
    category: "competitive_landscape",
  }));
}
