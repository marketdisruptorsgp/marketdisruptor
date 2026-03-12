/**
 * Overview Page Data Extractors
 * 
 * Distills strategic narrative into operator-briefing format:
 *   - Business Reality (strengths, weaknesses, risks)
 *   - Key Insights (what + why it matters)
 *   - Recommended Focus (single takeaway)
 */

import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { AggregatedOpportunity } from "@/lib/commandDeckMetrics";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import { humanizeLabel } from "@/lib/humanize";

/* ── Business Reality (replaces SWOT) ── */

export interface BusinessReality {
  strengths: string[];
  weaknesses: string[];
  risks: string[];
}

export function extractBusinessReality(
  narrative: StrategicNarrative | null,
): BusinessReality {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const risks: string[] = [];

  if (narrative?.keyDriver) strengths.push(clean(narrative.keyDriver));
  if (narrative?.leveragePoint) strengths.push(clean(narrative.leveragePoint));
  if (narrative?.unlockPotential) strengths.push(clean(narrative.unlockPotential));

  if (narrative?.primaryConstraint) weaknesses.push(clean(narrative.primaryConstraint));
  if (narrative?.trappedValue) weaknesses.push(clean(narrative.trappedValue));

  if (narrative?.killQuestion) risks.push(clean(narrative.killQuestion));
  if (narrative?.verdictRationale) risks.push(clean(narrative.verdictRationale));

  return {
    strengths: strengths.filter(Boolean).slice(0, 4),
    weaknesses: weaknesses.filter(Boolean).slice(0, 4),
    risks: risks.filter(Boolean).slice(0, 4),
  };
}

/* ── Key Insights ── */

export interface KeyInsight {
  insight: string;
  whyItMatters: string;
}

export function extractKeyInsights(
  narrative: StrategicNarrative | null,
): KeyInsight[] {
  if (!narrative) return [];
  const insights: KeyInsight[] = [];

  // Insight 1: Primary constraint / bottleneck
  if (narrative.primaryConstraint) {
    insights.push({
      insight: clean(narrative.primaryConstraint),
      whyItMatters: narrative.whyThisMatters
        ? clean(narrative.whyThisMatters)
        : "This is the main bottleneck limiting progress or value.",
    });
  }

  // Insight 2: Key driver / core advantage
  if (narrative.keyDriver) {
    insights.push({
      insight: clean(narrative.keyDriver),
      whyItMatters: narrative.leveragePoint
        ? clean(narrative.leveragePoint)
        : "This is the strongest lever available to create advantage.",
    });
  }

  // Insight 3: Kill question / biggest risk
  if (narrative.killQuestion) {
    insights.push({
      insight: clean(narrative.killQuestion),
      whyItMatters: narrative.verdictRationale
        ? clean(narrative.verdictRationale)
        : "If this risk materializes, it could undermine the entire strategy.",
    });
  }

  return insights.slice(0, 3);
}

/* ── Recommended Focus ── */

export function extractRecommendedFocus(
  narrative: StrategicNarrative | null,
): string {
  if (!narrative) return "";

  const parts: string[] = [];

  if (narrative.breakthroughOpportunity) {
    parts.push(clean(narrative.breakthroughOpportunity));
  }
  if (narrative.strategicPathway) {
    parts.push(clean(narrative.strategicPathway));
  }
  if (narrative.strategicVerdict && parts.length < 2) {
    parts.push(clean(narrative.strategicVerdict));
  }

  return parts.join(" ") || "";
}

/* ── Legacy export for backward compat ── */

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
  const reality = extractBusinessReality(narrative);
  const oppLabels = new Set<string>();
  const opportunities: string[] = [];
  for (const opp of topOpps.slice(0, 3)) {
    if (!oppLabels.has(opp.label)) {
      opportunities.push(clean(opp.label));
      oppLabels.add(opp.label);
    }
  }
  return {
    strengths: reality.strengths,
    weaknesses: reality.weaknesses,
    opportunities: opportunities.filter(Boolean).slice(0, 4),
    threats: reality.risks,
  };
}

/** Clean and humanize a label, truncate to ~12 words */
function clean(text: string): string {
  return humanizeLabel(text);
}
