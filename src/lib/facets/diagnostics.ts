/**
 * FACET EXTRACTION DIAGNOSTICS
 *
 * Generates diagnostic reports showing:
 * - Overall evidence-to-facet mapping coverage
 * - Facet frequency distribution
 * - Unmapped evidence items
 * - Semantic vs pattern match breakdown
 * - Latent constraint inference results
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { EvidenceFacets } from "./types";
import type { SemanticFacetMatch } from "./semanticAlignment";
import type { InferredConstraint } from "./latentInference";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface FacetDiagnosticReport {
  /** Total evidence items processed */
  totalEvidence: number;
  /** Evidence items with at least one facet assigned */
  mappedCount: number;
  /** Coverage percentage (0–100) */
  coveragePercent: number;

  /** Breakdown by match source */
  patternMatchCount: number;
  semanticOnlyMatchCount: number;

  /** Facet field frequency (how often each facet field appears) */
  facetFrequency: { field: string; count: number; domain: string }[];

  /** Evidence items that received no facet mapping */
  unmappedEvidence: { id: string; label: string; snippet: string }[];

  /** Average number of facet matches per mapped evidence item */
  avgMatchesPerItem: number;

  /** Average confidence of semantic matches */
  avgSemanticConfidence: number;

  /** Latent constraint inference results */
  inferredConstraints: {
    constraintId: string;
    name: string;
    confidence: number;
    conditionsMet: number;
    totalConditions: number;
  }[];

  /** Top semantic concept matches across all evidence */
  topConcepts: { conceptId: string; name: string; frequency: number; avgSimilarity: number }[];
}

// ═══════════════════════════════════════════════════════════════
//  REPORT GENERATION
// ═══════════════════════════════════════════════════════════════

export function generateDiagnosticReport(
  evidence: Evidence[],
  facetResults: {
    evidenceId: string;
    primaryFacets: EvidenceFacets | null;
    matches: SemanticFacetMatch[];
    patternMatched: boolean;
  }[],
  inferredConstraints: InferredConstraint[],
): FacetDiagnosticReport {
  const totalEvidence = evidence.length;

  // Count mapped items
  let mappedCount = 0;
  let patternMatchCount = 0;
  let semanticOnlyMatchCount = 0;
  let totalMatches = 0;
  let totalSemanticConfidence = 0;
  let semanticMatchCount = 0;

  // Facet field frequency
  const fieldCounts = new Map<string, { count: number; domain: string }>();

  // Concept frequency
  const conceptStats = new Map<string, { name: string; count: number; totalSim: number }>();

  // Unmapped evidence
  const unmapped: FacetDiagnosticReport["unmappedEvidence"] = [];

  for (const result of facetResults) {
    if (result.primaryFacets) {
      mappedCount++;
      if (result.patternMatched) {
        patternMatchCount++;
      } else {
        semanticOnlyMatchCount++;
      }
    } else {
      const ev = evidence.find(e => e.id === result.evidenceId);
      if (ev) {
        const text = `${ev.label} ${ev.description || ""}`;
        unmapped.push({
          id: ev.id,
          label: ev.label,
          snippet: text.slice(0, 120),
        });
      }
    }

    totalMatches += result.matches.length;

    for (const m of result.matches) {
      totalSemanticConfidence += m.confidence;
      semanticMatchCount++;

      // Track facet field frequency
      const key = `${m.domain}:${m.facetField}`;
      const existing = fieldCounts.get(key) || { count: 0, domain: m.domain };
      existing.count++;
      fieldCounts.set(key, existing);

      // Track concept frequency
      const cs = conceptStats.get(m.conceptId) || { name: m.conceptName, count: 0, totalSim: 0 };
      cs.count++;
      cs.totalSim += m.similarity;
      conceptStats.set(m.conceptId, cs);
    }
  }

  // Build facet frequency list
  const facetFrequency = [...fieldCounts.entries()]
    .map(([key, val]) => ({
      field: key.split(":")[1],
      count: val.count,
      domain: val.domain,
    }))
    .sort((a, b) => b.count - a.count);

  // Build top concepts list
  const topConcepts = [...conceptStats.entries()]
    .map(([id, stats]) => ({
      conceptId: id,
      name: stats.name,
      frequency: stats.count,
      avgSimilarity: stats.count > 0 ? stats.totalSim / stats.count : 0,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  return {
    totalEvidence,
    mappedCount,
    coveragePercent: totalEvidence > 0 ? Math.round((mappedCount / totalEvidence) * 100) : 0,
    patternMatchCount,
    semanticOnlyMatchCount,
    facetFrequency,
    unmappedEvidence: unmapped,
    avgMatchesPerItem: mappedCount > 0 ? Math.round((totalMatches / mappedCount) * 10) / 10 : 0,
    avgSemanticConfidence: semanticMatchCount > 0
      ? Math.round((totalSemanticConfidence / semanticMatchCount) * 100) / 100
      : 0,
    inferredConstraints: inferredConstraints.map(ic => ({
      constraintId: ic.inferredConstraint,
      name: ic.ruleName,
      confidence: Math.round(ic.confidence * 100) / 100,
      conditionsMet: ic.satisfiedConditions.length,
      totalConditions: ic.satisfiedConditions.length, // We don't expose total from rule
    })),
    topConcepts,
  };
}
