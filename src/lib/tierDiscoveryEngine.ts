/**
 * TIER DISCOVERY ENGINE
 *
 * Three-tier progressive discovery model:
 *   Tier 1 — Structural: foundational business architecture
 *   Tier 2 — System: operational mechanics
 *   Tier 3 — Optimization: execution improvements
 *
 * Tiers unlock progressively based on signal accumulation.
 */

import type { Evidence, EvidenceTier, MetricDomain, MetricEvidence } from "@/lib/evidenceEngine";

/* ── Tier metadata ── */
export const TIER_META = {
  1: {
    tier: "structural" as EvidenceTier,
    label: "Structural Assumptions",
    narrative: "Break the industry's assumptions",
    description: "Revenue models, ownership, customer definitions, distribution, value metrics, cost structure",
    color: "hsl(0 72% 52%)",
    bgColor: "hsl(0 72% 52% / 0.08)",
    borderColor: "hsl(0 72% 52% / 0.2)",
  },
  2: {
    tier: "system" as EvidenceTier,
    label: "System Architecture",
    narrative: "Reimagine how the business model is structured",
    description: "Distribution, monetization, supply chain, platform models",
    color: "hsl(38 92% 50%)",
    bgColor: "hsl(38 92% 50% / 0.08)",
    borderColor: "hsl(38 92% 50% / 0.2)",
  },
  3: {
    tier: "optimization" as EvidenceTier,
    label: "Optimization Signals",
    narrative: "Refine the model with incremental improvements",
    description: "Process efficiency, cost reduction, feature optimization",
    color: "hsl(229 89% 63%)",
    bgColor: "hsl(229 89% 63% / 0.08)",
    borderColor: "hsl(229 89% 63% / 0.2)",
  },
} as const;

export type TierNumber = 1 | 2 | 3;

/* ── Tier state ── */
export interface TierState {
  activeTier: TierNumber;
  tierUnlocked: [boolean, boolean, boolean]; // index 0=T1, 1=T2, 2=T3
  tierSignalCounts: [number, number, number];
  tierInsights: {
    structural: Evidence[];
    system: Evidence[];
    optimization: Evidence[];
  };
}

/* ── Unlock thresholds ── */
const TIER2_UNLOCK_THRESHOLD = 5; // structural signals needed

/* ── Classify tier from text content ── */
const STRUCTURAL_KEYWORDS = [
  "revenue", "ownership", "platform", "network", "business model",
  "distribution", "value metric", "cost structure", "marketplace",
  "subscription", "monetization", "customer definition", "flywheel",
];

const SYSTEM_KEYWORDS = [
  "logistics", "operations", "fulfillment", "supply chain", "pricing",
  "onboarding", "process", "workflow", "scaling", "infrastructure",
  "delivery", "manufacturing", "procurement", "automation",
];

const OPTIMIZATION_KEYWORDS = [
  "ux", "feature", "messaging", "marketing", "funnel", "packaging",
  "branding", "conversion", "engagement", "retention", "interface",
  "copy", "design", "landing page", "checkout",
];

export function classifyTier(text: string): EvidenceTier {
  const lower = text.toLowerCase();
  const scores = {
    structural: STRUCTURAL_KEYWORDS.filter(k => lower.includes(k)).length,
    system: SYSTEM_KEYWORDS.filter(k => lower.includes(k)).length,
    optimization: OPTIMIZATION_KEYWORDS.filter(k => lower.includes(k)).length,
  };
  if (scores.structural >= scores.system && scores.structural >= scores.optimization) return "structural";
  if (scores.system >= scores.optimization) return "system";
  return "optimization";
}

/* ── Compute tier state from evidence ── */
export function computeTierState(
  allEvidence: Record<MetricDomain, MetricEvidence>,
  manualUnlocks: Set<TierNumber> = new Set(),
): TierState {
  const allItems: Evidence[] = Object.values(allEvidence).flatMap(e => e.items);

  const structural = allItems.filter(e => e.tier === "structural");
  const system = allItems.filter(e => e.tier === "system");
  const optimization = allItems.filter(e => e.tier === "optimization");

  const t1Count = structural.length;
  const t2Count = system.length;
  const t3Count = optimization.length;

  // Tier 2 unlocks when: T1 signals >= threshold OR manual unlock
  const tier2Unlocked = t1Count >= TIER2_UNLOCK_THRESHOLD || manualUnlocks.has(2);

  // Tier 3 unlocks when: T2 system signals exist from redesign step OR manual unlock
  const hasRedesignSystemSignals = system.some(e => e.pipelineStep === "redesign");
  const tier3Unlocked = (tier2Unlocked && (hasRedesignSystemSignals || t2Count >= 3)) || manualUnlocks.has(3);

  // Active tier = highest unlocked tier (users explore upward)
  // But default to tier 1 — user activates tiers by clicking
  const activeTier: TierNumber = 1;

  return {
    activeTier,
    tierUnlocked: [true, tier2Unlocked, tier3Unlocked],
    tierSignalCounts: [t1Count, t2Count, t3Count],
    tierInsights: { structural, system, optimization },
  };
}

/* ── Get top insights for a tier ── */
export function getTierInsights(
  tierState: TierState,
  tier: TierNumber,
  limit: number = 12,
): Evidence[] {
  const tierKey = TIER_META[tier].tier;
  const items = tierState.tierInsights[tierKey];
  return [...items]
    .sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0))
    .slice(0, limit);
}

/* ── Quality controls: downgrade weak ideas ── */
export function applyQualityControls(items: Evidence[]): Evidence[] {
  return items.map(item => {
    let conf = item.confidenceScore ?? 0.5;

    // Low evidence count → reduce confidence
    if ((item.relatedSignals?.length ?? 0) < 2) {
      conf = Math.min(conf, 0.4);
    }

    return { ...item, confidenceScore: conf };
  });
}

/* ── Filter evidence by tier ── */
export function filterEvidenceByTier(
  allEvidence: Record<MetricDomain, MetricEvidence>,
  tier: EvidenceTier | null,
): Record<MetricDomain, MetricEvidence> {
  if (!tier) return allEvidence;

  const result: Record<MetricDomain, MetricEvidence> = {} as any;
  for (const [domain, data] of Object.entries(allEvidence) as [MetricDomain, MetricEvidence][]) {
    const filtered = data.items.filter(e => e.tier === tier);
    result[domain] = { domain, evidenceCount: filtered.length, items: filtered };
  }
  return result;
}

/* ── Unlock condition text ── */
export function getUnlockCondition(tier: TierNumber, tierState: TierState): string | null {
  if (tierState.tierUnlocked[tier - 1]) return null;
  if (tier === 2) {
    const remaining = TIER2_UNLOCK_THRESHOLD - tierState.tierSignalCounts[0];
    return remaining > 0
      ? `Need ${remaining} more structural signal${remaining !== 1 ? "s" : ""} to unlock`
      : "Mark Tier 1 complete to unlock";
  }
  if (tier === 3) {
    return "Complete system-level redesign analysis to unlock";
  }
  return null;
}
