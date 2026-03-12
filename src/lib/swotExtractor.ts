/**
 * SWOT Extractor — Distills strategic narrative + evidence into concise SWOT bullets.
 * Each bullet: max 8 words, no filler, action-oriented.
 */

import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { AggregatedOpportunity } from "@/lib/commandDeckMetrics";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";

export interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export function extractSwot(
  narrative: StrategicNarrative | null,
  topOpps: AggregatedOpportunity[],
  deepenedOpps: DeepenedOpportunity[],
): SwotData {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  // Strengths — from drivers, leverage, unlock potential
  if (narrative?.keyDriver) strengths.push(truncate(narrative.keyDriver));
  if (narrative?.leveragePoint) strengths.push(truncate(narrative.leveragePoint));
  if (narrative?.unlockPotential) strengths.push(truncate(narrative.unlockPotential));

  // Weaknesses — from constraints
  if (narrative?.primaryConstraint) weaknesses.push(truncate(narrative.primaryConstraint));
  if (narrative?.trappedValue) weaknesses.push(truncate(narrative.trappedValue));

  // Opportunities — from top aggregated + deepened
  const oppLabels = new Set<string>();
  for (const opp of topOpps.slice(0, 3)) {
    if (!oppLabels.has(opp.label)) {
      opportunities.push(truncate(opp.label));
      oppLabels.add(opp.label);
    }
  }
  for (const d of deepenedOpps.slice(0, 2)) {
    const label = d.label || "";
    if (label && !oppLabels.has(label)) {
      opportunities.push(truncate(label));
      oppLabels.add(label);
    }
  }

  // Threats — from kill question, verdict rationale
  if (narrative?.killQuestion) threats.push(truncate(narrative.killQuestion));
  if (narrative?.verdictRationale) threats.push(truncate(narrative.verdictRationale));

  return {
    strengths: strengths.filter(Boolean).slice(0, 4),
    weaknesses: weaknesses.filter(Boolean).slice(0, 4),
    opportunities: opportunities.filter(Boolean).slice(0, 4),
    threats: threats.filter(Boolean).slice(0, 4),
  };
}

/** Truncate to ~8 words, strip filler */
function truncate(text: string): string {
  const cleaned = text
    .replace(/^(the |a |an |this |that |our |their )/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ");
  if (words.length <= 8) return cleaned;
  return words.slice(0, 8).join(" ") + "…";
}
