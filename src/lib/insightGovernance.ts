/**
 * INSIGHT GOVERNANCE LAYER
 *
 * Lightweight background validation that prevents:
 *   - Duplicate insights
 *   - Orphan opportunities (no source insight)
 *   - Runaway expansion (max 5 opportunities per insight)
 *   - Conflicting logic
 *
 * Non-blocking: returns a governed copy of the data with
 * duplicates removed and caps enforced.
 */

import type { ScoredOpportunity } from "@/lib/frictionEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface GovernedInsight {
  id: string;
  label: string;
  sourceAssumptionId?: string;
  evidence: string[];
}

export interface GovernanceReport {
  duplicatesRemoved: number;
  opportunitiesCapped: number;
  orphansRemoved: number;
  totalInsights: number;
  totalOpportunities: number;
}

export interface GovernedOutput {
  insights: GovernedInsight[];
  opportunities: ScoredOpportunity[];
  report: GovernanceReport;
}

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

const MAX_OPPORTUNITIES_PER_INSIGHT = 5;
const SIMILARITY_THRESHOLD = 0.7; // Jaccard similarity

// ═══════════════════════════════════════════════════════════════
//  DEDUPLICATION
// ═══════════════════════════════════════════════════════════════

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(w => w.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const w of a) { if (b.has(w)) intersection++; }
  return intersection / (a.size + b.size - intersection);
}

function deduplicateByLabel<T extends { label: string }>(items: T[]): { unique: T[]; removed: number } {
  const result: T[] = [];
  const tokenCache: Set<string>[] = [];
  let removed = 0;

  for (const item of items) {
    const tokens = tokenize(item.label);
    const isDuplicate = tokenCache.some(existing => jaccardSimilarity(existing, tokens) >= SIMILARITY_THRESHOLD);
    if (isDuplicate) {
      removed++;
      continue;
    }
    result.push(item);
    tokenCache.push(tokens);
  }

  return { unique: result, removed };
}

// ═══════════════════════════════════════════════════════════════
//  GOVERNANCE PIPELINE
// ═══════════════════════════════════════════════════════════════

export function governInsights(
  rawInsights: GovernedInsight[],
  rawOpportunities: ScoredOpportunity[],
): GovernedOutput {
  // Stage 1: Deduplicate insights
  const { unique: insights, removed: duplicatesRemoved } = deduplicateByLabel(rawInsights);
  const insightIds = new Set(insights.map(i => i.id));

  // Stage 2: Remove orphan opportunities (no matching source insight)
  // Only enforce if source references exist
  let opportunities = rawOpportunities;
  let orphansRemoved = 0;
  const hasReferences = rawOpportunities.some(o => o.sourceInsightId);
  if (hasReferences) {
    const beforeCount = opportunities.length;
    opportunities = opportunities.filter(o => !o.sourceInsightId || insightIds.has(o.sourceInsightId));
    orphansRemoved = beforeCount - opportunities.length;
  }

  // Stage 3: Cap opportunities per source insight
  let opportunitiesCapped = 0;
  if (hasReferences) {
    const countBySource = new Map<string, number>();
    const capped: ScoredOpportunity[] = [];
    for (const opp of opportunities) {
      const key = opp.sourceInsightId || "__global__";
      const current = countBySource.get(key) || 0;
      if (current >= MAX_OPPORTUNITIES_PER_INSIGHT) {
        opportunitiesCapped++;
        continue;
      }
      countBySource.set(key, current + 1);
      capped.push(opp);
    }
    opportunities = capped;
  }

  // Stage 4: Deduplicate opportunities
  const { unique: dedupedOpps, removed: oppDupsRemoved } = deduplicateByLabel(opportunities);
  opportunities = dedupedOpps;

  return {
    insights,
    opportunities,
    report: {
      duplicatesRemoved: duplicatesRemoved + oppDupsRemoved,
      opportunitiesCapped,
      orphansRemoved,
      totalInsights: insights.length,
      totalOpportunities: opportunities.length,
    },
  };
}
