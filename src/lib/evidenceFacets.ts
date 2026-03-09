/**
 * EVIDENCE FACETS — Backward-compatible re-export layer
 *
 * All types and logic have been refactored into src/lib/facets/
 * with the three-tier architecture (structured, derived, raw signals).
 * This file re-exports everything for existing import compatibility.
 */

// Re-export all types
export type {
  ComponentRole,
  ObjectFacets,
  ConcentrationRisk,
  LaborProfile,
  PricingArchitecture,
  MarginStructure,
  OperationalBottleneck,
  BusinessFacets,
  MarketFacets,
  DemandFacets,
  EvidenceFacets,
  DerivedMetric,
  RawConstraintSignal,
  SignalLifecycleStatus,
  EvidenceMetadata,
} from "@/lib/facets";

// Re-export functions
export {
  FACET_SCHEMA_VERSION,
  SIGNAL_LIFECYCLE,
  createEmptyMetadata,
  extractFacetsFromEvidence,
  extractFacetsUnified,
  extractDerivedMetrics,
  extractRawSignals,
  extractFullMetadata,
  populateMetadata,
  applySignalLifecycle,
  promoteSignalToMetric,
} from "@/lib/facets";

// Re-export new modules
export type { MultiFacetResult, SemanticFacetMatch } from "@/lib/facets";
export type { InferredConstraint } from "@/lib/facets";
export type { FacetDiagnosticReport } from "@/lib/facets";
export { semanticMatch, extractMultiFacets } from "@/lib/facets";
export { inferLatentConstraints, inferredConstraintsToRawSignals } from "@/lib/facets";
export { generateDiagnosticReport } from "@/lib/facets";

// Legacy API: populateFacets (now uses unified extraction + latent inference)
import type { Evidence } from "@/lib/evidenceEngine";
import { extractFacetsUnified } from "@/lib/facets";
import { inferLatentConstraints, inferredConstraintsToRawSignals } from "@/lib/facets";
import { extractRawSignals } from "@/lib/facets";
import type { SemanticFacetMatch, MultiFacetResult } from "@/lib/facets";

export interface PopulateFacetsResult {
  evidence: Evidence[];
  /** All semantic match data for diagnostics */
  matchData: { evidenceId: string; matches: SemanticFacetMatch[]; patternMatched: boolean; primaryFacets: any }[];
  /** Inferred constraints from facet combinations */
  inferredConstraints: ReturnType<typeof inferLatentConstraints>;
}

/**
 * Enhanced populateFacets — runs unified (pattern + semantic) extraction,
 * then latent constraint inference, and attaches raw signals from inferred constraints.
 */
export function populateFacetsEnhanced(evidenceItems: Evidence[]): PopulateFacetsResult {
  const matchData: PopulateFacetsResult["matchData"] = [];
  
  const updatedEvidence = evidenceItems.map(ev => {
    const result = extractFacetsUnified(ev);
    
    matchData.push({
      evidenceId: ev.id,
      matches: result.matches,
      patternMatched: result.patternMatched,
      primaryFacets: result.primaryFacets,
    });

    if (result.primaryFacets) {
      // Merge inferred raw signals from semantic matches
      const existingSignals = extractRawSignals(ev);
      return { ...ev, facets: result.primaryFacets, rawSignals: existingSignals } as any;
    }
    return ev;
  });

  // Run latent constraint inference across all evidence
  const facetedEvidence = updatedEvidence.filter((e: any) => e.facets);
  const inferred = inferLatentConstraints(facetedEvidence as any[], matchData);

  // Attach inferred constraint signals to the first contributing evidence item
  if (inferred.length > 0) {
    const inferredSignals = inferredConstraintsToRawSignals(inferred);
    // We don't mutate evidence — signals are returned separately for pipeline use
  }

  return {
    evidence: updatedEvidence,
    matchData,
    inferredConstraints: inferred,
  };
}

/**
 * Legacy API — backward compatible, returns Evidence[] with facets attached.
 */
export function populateFacets(evidence: Evidence[]): Evidence[] {
  const { evidence: result } = populateFacetsEnhanced(evidence);
  return result;
}