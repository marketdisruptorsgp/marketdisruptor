/**
 * EVIDENCE REGISTRY — §8: Data Governance System
 * 
 * Every signal must be traceable. Tracks provenance,
 * verification status, and degrades confidence on weak provenance.
 */

export type SourceType = "scraped" | "database" | "modeled" | "assumed" | "user_input" | "verified";

export interface EvidenceEntry {
  signal_id: string;
  source_type: SourceType;
  timestamp: string;
  verification_status: "verified" | "unverified" | "stale";
  supports_which_claim: string;
  freshness_hours?: number;
}

export interface EvidenceRegistry {
  entries: EvidenceEntry[];
  provenance_score: number; // 0-1
  stale_count: number;
  unverified_count: number;
  trace: string;
}

const PROVENANCE_WEIGHTS: Record<SourceType, number> = {
  verified: 1.0,
  scraped: 0.8,
  database: 0.7,
  user_input: 0.6,
  modeled: 0.4,
  assumed: 0.2,
};

const STALENESS_THRESHOLD_HOURS = 72; // 3 days

/**
 * Build an evidence registry from analysis data.
 * Extracts provenance signals from scraped data, governed artifacts, and user inputs.
 */
export function buildEvidenceRegistry(
  analysisData: Record<string, unknown> | null
): EvidenceRegistry {
  if (!analysisData) {
    return { entries: [], provenance_score: 0, stale_count: 0, unverified_count: 0, trace: "No analysis data" };
  }

  const entries: EvidenceEntry[] = [];
  const now = Date.now();

  // Extract from governed viability assumptions
  const governed = analysisData.governed as Record<string, unknown> | undefined;
  if (governed?.first_principles) {
    const fp = governed.first_principles as Record<string, unknown>;
    const assumptions = (fp?.viability_assumptions as Array<{ assumption: string; evidence_status: string }>) || [];
    for (const a of assumptions) {
      entries.push({
        signal_id: `assumption_${entries.length}`,
        source_type: a.evidence_status === "verified" ? "verified" : a.evidence_status === "modeled" ? "modeled" : "assumed",
        timestamp: new Date().toISOString(),
        verification_status: a.evidence_status === "verified" ? "verified" : "unverified",
        supports_which_claim: a.assumption,
      });
    }
  }

  // Extract from scraped product data
  const intelData = analysisData.intelData as Record<string, unknown> | undefined;
  if (intelData) {
    for (const key of ["overview", "pricing", "supply", "community", "patents"]) {
      if (intelData[key]) {
        entries.push({
          signal_id: `scraped_${key}`,
          source_type: "scraped",
          timestamp: new Date().toISOString(),
          verification_status: "unverified",
          supports_which_claim: `${key} intelligence data`,
        });
      }
    }
  }

  // Extract from geo data
  if (analysisData.geoOpportunity) {
    entries.push({
      signal_id: "geo_census_data",
      source_type: "database",
      timestamp: new Date().toISOString(),
      verification_status: "verified",
      supports_which_claim: "Geographic market opportunity from US Census ACS",
    });
  }

  // Check freshness
  let staleCount = 0;
  for (const entry of entries) {
    const entryAge = (now - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60);
    entry.freshness_hours = Math.round(entryAge);
    if (entryAge > STALENESS_THRESHOLD_HOURS) {
      entry.verification_status = "stale";
      staleCount++;
    }
  }

  const unverifiedCount = entries.filter(e => e.verification_status === "unverified").length;

  // Compute provenance score
  const totalWeight = entries.reduce((sum, e) => sum + (PROVENANCE_WEIGHTS[e.source_type] || 0.2), 0);
  const maxWeight = entries.length * 1.0;
  const provenanceScore = maxWeight > 0 ? totalWeight / maxWeight : 0;

  // Apply staleness penalty
  const stalenessPenalty = entries.length > 0 ? staleCount / entries.length : 0;
  const adjustedScore = Math.max(0, provenanceScore - stalenessPenalty * 0.3);

  const trace = `${entries.length} signals | ${staleCount} stale | ${unverifiedCount} unverified | provenance=${adjustedScore.toFixed(2)}`;

  return {
    entries,
    provenance_score: Math.round(adjustedScore * 100) / 100,
    stale_count: staleCount,
    unverified_count: unverifiedCount,
    trace,
  };
}

/**
 * Compute confidence degradation from weak provenance.
 * Returns a multiplier (0-1) to apply to confidence score.
 */
export function getProvenanceConfidenceMultiplier(registry: EvidenceRegistry): number {
  if (registry.entries.length === 0) return 0.5; // No data = heavy penalty
  
  // Strong provenance: no degradation
  if (registry.provenance_score >= 0.8 && registry.stale_count === 0) return 1.0;
  
  // Moderate provenance
  if (registry.provenance_score >= 0.5) return 0.85;
  
  // Weak provenance
  if (registry.provenance_score >= 0.3) return 0.7;
  
  // Very weak
  return 0.5;
}
