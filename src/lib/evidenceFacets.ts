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
  extractDerivedMetrics,
  extractRawSignals,
  extractFullMetadata,
  populateMetadata,
  applySignalLifecycle,
  promoteSignalToMetric,
} from "@/lib/facets";

// Legacy API: populateFacets (wraps populateMetadata for backward compat)
import type { Evidence } from "@/lib/evidenceEngine";
import { extractFacetsFromEvidence } from "@/lib/facets";

export function populateFacets(evidence: Evidence[]): Evidence[] {
  return evidence.map(ev => {
    if ((ev as any).facets) return ev;
    const facets = extractFacetsFromEvidence(ev);
    if (!facets) return ev;
    return { ...ev, facets } as Evidence & { facets: import("@/lib/facets").EvidenceFacets };
  });
}
