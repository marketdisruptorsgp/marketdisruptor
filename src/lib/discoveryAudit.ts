/**
 * DISCOVERY AUDIT — Internal diagnostic engine
 *
 * Assesses health of the discovery system:
 * - Engine connectivity
 * - Evidence coverage by mode/lens/archetype
 * - Duplicate insight clusters
 * - Orphan evidence
 */

import type {
  Evidence,
  EvidenceMode,
  EvidenceLens,
  EvidenceArchetype,
  EvidenceSourceEngine,
  EvidenceTier,
  MetricDomain,
  MetricEvidence,
} from "@/lib/evidenceEngine";
import { flattenEvidence } from "@/lib/evidenceEngine";
import type { Insight } from "@/lib/insightLayer";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface DiscoveryAuditResult {
  enginesConnected: EvidenceSourceEngine[];
  enginesDisconnected: EvidenceSourceEngine[];
  evidenceCoverageByMode: Record<EvidenceMode, number>;
  evidenceCoverageByLens: Partial<Record<EvidenceLens, number>>;
  evidenceCoverageByTier: Record<EvidenceTier, number>;
  archetypeCoverage: Partial<Record<EvidenceArchetype, number>>;
  duplicateInsightClusters: number;
  orphanEvidence: number;
  totalEvidence: number;
  totalInsights: number;
  healthScore: number; // 0-100
}

// ═══════════════════════════════════════════════════════════════
//  AUDIT ENGINE
// ═══════════════════════════════════════════════════════════════

const ALL_ENGINES: EvidenceSourceEngine[] = [
  "pipeline", "innovation", "signal_detection",
  "financial_model", "competitor_scout", "system_intelligence",
];

const ALL_MODES: EvidenceMode[] = ["product", "service", "business_model"];
const ALL_TIERS: EvidenceTier[] = ["structural", "system", "optimization"];

export function runDiscoveryAudit(
  evidence: Record<MetricDomain, MetricEvidence> | null,
  insights: Insight[] = [],
): DiscoveryAuditResult {
  const all = evidence ? flattenEvidence(evidence) : [];

  // Engine connectivity
  const activeEngines = new Set(all.map(e => e.sourceEngine).filter(Boolean) as EvidenceSourceEngine[]);
  const enginesConnected = ALL_ENGINES.filter(e => activeEngines.has(e));
  const enginesDisconnected = ALL_ENGINES.filter(e => !activeEngines.has(e));

  // Mode coverage
  const evidenceCoverageByMode = {} as Record<EvidenceMode, number>;
  for (const mode of ALL_MODES) {
    evidenceCoverageByMode[mode] = all.filter(e => e.mode === mode).length;
  }

  // Lens coverage
  const evidenceCoverageByLens: Partial<Record<EvidenceLens, number>> = {};
  for (const e of all) {
    if (e.lens) {
      evidenceCoverageByLens[e.lens] = (evidenceCoverageByLens[e.lens] || 0) + 1;
    }
  }

  // Tier coverage
  const evidenceCoverageByTier = {} as Record<EvidenceTier, number>;
  for (const tier of ALL_TIERS) {
    evidenceCoverageByTier[tier] = all.filter(e => e.tier === tier).length;
  }

  // Archetype coverage
  const archetypeCoverage: Partial<Record<EvidenceArchetype, number>> = {};
  for (const e of all) {
    if (e.archetype) {
      archetypeCoverage[e.archetype] = (archetypeCoverage[e.archetype] || 0) + 1;
    }
  }

  // Duplicate insight detection (insights with >80% overlapping evidence)
  let duplicateInsightClusters = 0;
  for (let i = 0; i < insights.length; i++) {
    for (let j = i + 1; j < insights.length; j++) {
      const aSet = new Set(insights[i].evidenceIds);
      const bSet = new Set(insights[j].evidenceIds);
      let overlap = 0;
      for (const id of aSet) if (bSet.has(id)) overlap++;
      const smaller = Math.min(aSet.size, bSet.size);
      if (smaller > 0 && overlap / smaller > 0.8) {
        duplicateInsightClusters++;
      }
    }
  }

  // Orphan evidence (not referenced by any insight)
  const referencedIds = new Set(insights.flatMap(i => i.evidenceIds));
  const orphanEvidence = all.filter(e => !referencedIds.has(e.id)).length;

  // Health score (0-100)
  const engineScore = (enginesConnected.length / ALL_ENGINES.length) * 25;
  const modeScore = (ALL_MODES.filter(m => evidenceCoverageByMode[m] > 0).length / ALL_MODES.length) * 25;
  const tierScore = (ALL_TIERS.filter(t => evidenceCoverageByTier[t] > 0).length / ALL_TIERS.length) * 25;
  const orphanPenalty = all.length > 0 ? (orphanEvidence / all.length) * 15 : 0;
  const dupePenalty = duplicateInsightClusters * 2;
  const healthScore = Math.max(0, Math.min(100, Math.round(engineScore + modeScore + tierScore + 25 - orphanPenalty - dupePenalty)));

  return {
    enginesConnected,
    enginesDisconnected,
    evidenceCoverageByMode,
    evidenceCoverageByLens,
    evidenceCoverageByTier,
    archetypeCoverage,
    duplicateInsightClusters,
    orphanEvidence,
    totalEvidence: all.length,
    totalInsights: insights.length,
    healthScore,
  };
}
