/**
 * Overview & Command Deck Data Extractors
 *
 * Distills strategic narrative into founder-readable format:
 *   - Single Insight (most surprising finding)
 *   - Assumption Banner (everyone assumes / evidence suggests / so what)
 *   - Business Reality prose (working / blocking / opening / risk)
 *   - Critical Question (max 20 words)
 *   - Opportunities with badges (exactly 3)
 */

import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { AggregatedOpportunity } from "@/lib/commandDeckMetrics";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import { humanizeLabel, trimAt, enforceWordLimit, enforceCharLimit, scrubBannedWords } from "@/lib/humanize";

/* ── Single Insight — the most surprising finding ── */

export interface SingleInsight {
  headline: string;   // max 8 words
  body: string;       // max 2 sentences
}

/**
 * Select the single most counterintuitive insight.
 * Priority: contrarian belief from primary thesis > kill question > primary constraint.
 * Returns null if nothing specific enough exists.
 */
export function extractSingleInsight(
  narrative: StrategicNarrative | null,
  deepenedOpps: DeepenedOpportunity[],
): SingleInsight | null {
  const primary = deepenedOpps[0];

  // Best: the contrarian belief IS the insight
  if (primary?.strategicBet?.contrarianBelief && primary?.strategicBet?.implication) {
    const headline = enforceWordLimit(primary.strategicBet.contrarianBelief, 8);
    const body = enforceCharLimit(
      `${primary.strategicBet.contrarianBelief}. ${primary.strategicBet.implication}`,
      250,
    );
    if (headline && body) return { headline, body };
  }

  // Second: kill question as headline + trapped value as body
  if (narrative?.killQuestion && narrative?.trappedValue) {
    const headline = enforceWordLimit(narrative.killQuestion, 8);
    const body = enforceCharLimit(narrative.trappedValue, 250);
    if (headline && body) return { headline, body };
  }

  // Third: primary constraint + breakthrough opportunity
  if (narrative?.primaryConstraint && narrative?.breakthroughOpportunity) {
    const headline = enforceWordLimit(narrative.primaryConstraint, 8);
    const body = enforceCharLimit(
      `${narrative.primaryConstraint}. ${narrative.breakthroughOpportunity}`,
      250,
    );
    if (headline && body) return { headline, body };
  }

  return null;
}

/* ── Assumption Banner ── */

export interface AssumptionBanner {
  everyone_assumes: string;  // max 20 words
  evidence_suggests: string; // max 20 words
  so_what: string;           // max 15 words, starts with entity name
}

export function extractAssumptionBanner(
  narrative: StrategicNarrative | null,
  deepenedOpps: DeepenedOpportunity[],
  entityName: string,
): AssumptionBanner | null {
  const primary = deepenedOpps[0];
  if (!primary?.strategicBet?.industryAssumption || !primary?.strategicBet?.contrarianBelief) {
    return null;
  }

  const everyone_assumes = enforceWordLimit(primary.strategicBet.industryAssumption, 20);
  const evidence_suggests = enforceWordLimit(primary.strategicBet.contrarianBelief, 20);

  if (!everyone_assumes || !evidence_suggests) return null;

  // Build so_what from implication, prefixed with entity name
  const implication = primary.strategicBet.implication || primary.economicMechanism?.valueCreation || "";
  const rawSoWhat = implication
    ? `${entityName} ${scrubBannedWords(implication).toLowerCase()}`
    : `${entityName} can act on this before competitors do`;
  const so_what = enforceWordLimit(rawSoWhat, 15);

  if (!so_what) return null;

  return { everyone_assumes, evidence_suggests, so_what };
}

/* ── Critical Question ── */

export function extractCriticalQuestion(
  narrative: StrategicNarrative | null,
  deepenedOpps: DeepenedOpportunity[],
): string | null {
  const primary = deepenedOpps[0];

  // Best: the kill question from narrative
  if (narrative?.killQuestion) {
    const q = enforceWordLimit(narrative.killQuestion, 20);
    if (q) return q.endsWith("?") ? q : `${q}?`;
  }

  // Second: build from contrarian belief
  if (primary?.strategicBet?.contrarianBelief) {
    const belief = scrubBannedWords(primary.strategicBet.contrarianBelief).toLowerCase();
    const q = enforceWordLimit(`Can this business prove that ${belief}`, 20);
    if (q) return `${q}?`;
  }

  return null;
}

/* ── Execution-focused Critical Question (for Command Deck) ── */

export function extractExecutionQuestion(
  narrative: StrategicNarrative | null,
  deepenedOpps: DeepenedOpportunity[],
): string | null {
  const primary = deepenedOpps[0];

  // Use validation experiment or first move
  if (primary?.firstMove?.action) {
    const q = enforceWordLimit(`What happens if ${scrubBannedWords(primary.firstMove.action).toLowerCase()} fails`, 20);
    if (q) return `${q}?`;
  }

  // Fallback: feasibility risk
  if (primary?.feasibility?.executionRisks?.[0]) {
    const risk = scrubBannedWords(primary.feasibility.executionRisks[0]).toLowerCase();
    const q = enforceWordLimit(`How will you handle ${risk}`, 20);
    if (q) return `${q}?`;
  }

  // Last resort: different angle on kill question
  if (narrative?.validationExperiment) {
    const q = enforceWordLimit(`What's the cheapest way to test this in two weeks`, 20);
    if (q) return `${q}?`;
  }

  return null;
}

/* ── SWOT Prose (2 sentences each) ── */

export interface SwotProse {
  working: string | null;   // strength
  blocking: string | null;  // weakness
  opening: string | null;   // opportunity
  risk: string | null;      // threat
}

export function extractSwotProse(
  narrative: StrategicNarrative | null,
  deepenedOpps: DeepenedOpportunity[],
): SwotProse {
  const primary = deepenedOpps[0];

  // Working: key driver + why it's defensible
  const working = buildTwoSentences(
    narrative?.keyDriver,
    narrative?.leveragePoint || primary?.economicMechanism?.defensibility,
  );

  // Blocking: primary constraint + what breaks
  const blocking = buildTwoSentences(
    narrative?.primaryConstraint,
    primary?.causalChain?.reasoning || narrative?.trappedValue,
  );

  // Opening: breakthrough opportunity + why now
  const opening = buildTwoSentences(
    narrative?.breakthroughOpportunity,
    primary?.economicMechanism?.valueCreation,
  );

  // Risk: top execution risk + how to test
  const riskText = primary?.feasibility?.executionRisks?.[0] || null;
  const testText = primary?.firstMove?.successCriteria
    ? `Test it by: ${primary.firstMove.successCriteria}`
    : null;
  const riskResult = buildTwoSentences(riskText, testText);

  return { working, blocking, opening, risk: riskResult };
}

/** Build exactly 2 sentences from two source strings. Returns null if insufficient data. */
function buildTwoSentences(first: string | null | undefined, second: string | null | undefined): string | null {
  const s1 = enforceCharLimit(first, 150);
  const s2 = enforceCharLimit(second, 150);
  if (!s1) return null;
  if (!s2) return s1.endsWith(".") ? s1 : `${s1}.`;
  const a = s1.endsWith(".") ? s1 : `${s1}.`;
  const b = s2.endsWith(".") ? s2 : `${s2}.`;
  return `${a} ${b}`;
}

/* ── Opportunities with Badges ── */

export type OpportunityBadge =
  | "New revenue"
  | "Recurring"
  | "Hard to copy"
  | "Fast to test"
  | "Needs validation"
  | "Low cost to start";

export interface OpportunityWithBadges {
  title: string;        // verb-first, max 8 words
  description: string;  // 2 sentences
  badges: OpportunityBadge[];
}

export function extractOpportunitiesWithBadges(
  topOpps: AggregatedOpportunity[],
  deepenedOpps: DeepenedOpportunity[],
): OpportunityWithBadges[] {
  const results: OpportunityWithBadges[] = [];

  // Prefer deepened opportunities (richer data)
  for (const opp of deepenedOpps.slice(0, 3)) {
    const title = enforceWordLimit(opp.reconfigurationLabel, 8);
    if (!title) continue;

    const desc = buildTwoSentences(
      opp.summary || opp.causalChain?.outcome,
      opp.economicMechanism?.valueCreation || opp.economicMechanism?.revenueImplication,
    );
    if (!desc) continue;

    const badges = inferBadges(opp);
    results.push({ title, description: desc, badges });
  }

  // Fill remaining slots from aggregated opps
  if (results.length < 3) {
    for (const opp of topOpps) {
      if (results.length >= 3) break;
      // Skip if we already have this label
      if (results.some(r => r.title.toLowerCase() === humanizeLabel(opp.label).toLowerCase())) continue;
      const title = enforceWordLimit(opp.label, 8);
      if (!title) continue;
      const desc = enforceCharLimit(opp.source || opp.firstMove || opp.label, 200);
      if (!desc) continue;
      results.push({
        title,
        description: desc,
        badges: ["Needs validation"],
      });
    }
  }

  return results.slice(0, 3);
}

function inferBadges(opp: DeepenedOpportunity): OpportunityBadge[] {
  const badges: OpportunityBadge[] = [];
  const rev = (opp.economicMechanism?.revenueImplication || "").toLowerCase();
  const cost = (opp.economicMechanism?.costStructureShift || "").toLowerCase();
  const defense = (opp.economicMechanism?.defensibility || "").toLowerCase();
  const feasibility = opp.feasibility?.level;
  const timeframe = (opp.firstMove?.timeframe || "").toLowerCase();

  if (rev.includes("recurring") || rev.includes("subscription") || rev.includes("repeat")) badges.push("Recurring");
  else if (rev.includes("revenue") || rev.includes("income") || rev.includes("monetiz")) badges.push("New revenue");

  if (defense.includes("hard") || defense.includes("moat") || defense.includes("barrier") || defense.includes("patent")) badges.push("Hard to copy");

  if (feasibility === "achievable" || timeframe.includes("week") || timeframe.includes("30 day")) badges.push("Fast to test");
  else if (feasibility === "requires_validation") badges.push("Needs validation");

  if (cost.includes("low") || cost.includes("minimal") || cost.includes("no upfront")) badges.push("Low cost to start");

  // Cap at 2 badges
  return badges.slice(0, 2).length > 0 ? badges.slice(0, 2) : ["Needs validation"];
}

/* ── Legacy exports for backward compat ── */

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

export interface KeyInsight {
  insight: string;
  whyItMatters: string;
}

export function extractKeyInsights(
  narrative: StrategicNarrative | null,
): KeyInsight[] {
  if (!narrative) return [];
  const insights: KeyInsight[] = [];
  if (narrative.primaryConstraint) {
    insights.push({
      insight: clean(narrative.primaryConstraint),
      whyItMatters: narrative.whyThisMatters
        ? clean(narrative.whyThisMatters)
        : "This is the main bottleneck limiting progress or value.",
    });
  }
  if (narrative.keyDriver) {
    insights.push({
      insight: clean(narrative.keyDriver),
      whyItMatters: narrative.leveragePoint
        ? clean(narrative.leveragePoint)
        : "This is the strongest lever available to create advantage.",
    });
  }
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

export function extractRecommendedFocus(
  narrative: StrategicNarrative | null,
): string {
  if (!narrative) return "";
  const parts: string[] = [];
  if (narrative.breakthroughOpportunity) parts.push(clean(narrative.breakthroughOpportunity));
  if (narrative.strategicPathway) parts.push(clean(narrative.strategicPathway));
  if (narrative.strategicVerdict && parts.length < 2) parts.push(clean(narrative.strategicVerdict));
  return parts.join(" ") || "";
}

export interface StructuralAssumption {
  assumption: string;
  question: string;
  alternative: string;
}

export function extractStructuralAssumptions(
  deepenedOpps: DeepenedOpportunity[],
): StructuralAssumption[] {
  if (!deepenedOpps || deepenedOpps.length === 0) return [];
  const assumptions: StructuralAssumption[] = [];
  for (const opp of deepenedOpps.slice(0, 2)) {
    const bet = opp.strategicBet;
    if (bet?.industryAssumption && bet?.contrarianBelief) {
      assumptions.push({
        assumption: humanizeLabel(bet.industryAssumption),
        question: `Is this actually true, or is there a better way?`,
        alternative: humanizeLabel(bet.contrarianBelief),
      });
    }
  }
  return assumptions.slice(0, 2);
}

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

function clean(text: string): string {
  return humanizeLabel(text);
}
