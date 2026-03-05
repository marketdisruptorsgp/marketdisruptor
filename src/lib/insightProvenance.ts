/**
 * INSIGHT PROVENANCE REGISTRY
 *
 * Every strategic insight is traceable back to:
 *   - the original observation
 *   - the reasoning layer that produced it
 *   - the lens that surfaced it
 *
 * This ensures transparency and prevents ungrounded outputs.
 */

import type { LensType } from "@/lib/multiLensEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type ReasoningLayer =
  | "raw_observation"
  | "assumption_extraction"
  | "friction_detection"
  | "constraint_mapping"
  | "leverage_identification"
  | "strategic_opportunity";

export interface ProvenanceRecord {
  insightId: string;
  label: string;
  originObservation: string;
  reasoningLayer: ReasoningLayer;
  lens: LensType | "cross-lens";
  evidence: string[];
  parentInsightId?: string;
  timestamp: number;
}

export interface ProvenanceRegistry {
  records: ProvenanceRecord[];
  layerCounts: Record<ReasoningLayer, number>;
  crossLensCount: number;
}

// ═══════════════════════════════════════════════════════════════
//  BUILDER
// ═══════════════════════════════════════════════════════════════

export function buildProvenanceRegistry(
  constraints: Array<{ id: string; label: string; evidence: string[]; type?: string }>,
  leveragePoints: Array<{ id: string; label: string; evidence: string[]; isConvergenceZone?: boolean }>,
  opportunities: Array<{ id: string; label: string; evidence: string[]; sourceInsightId?: string }>,
  dominantLens: LensType,
): ProvenanceRegistry {
  const records: ProvenanceRecord[] = [];
  const now = Date.now();

  // Constraints → constraint_mapping layer
  for (const c of constraints) {
    records.push({
      insightId: c.id,
      label: c.label,
      originObservation: c.evidence[0] || c.label,
      reasoningLayer: "constraint_mapping",
      lens: dominantLens,
      evidence: c.evidence,
      timestamp: now,
    });
  }

  // Leverage points → leverage_identification layer
  for (const l of leveragePoints) {
    records.push({
      insightId: l.id,
      label: l.label,
      originObservation: l.evidence[0] || l.label,
      reasoningLayer: "leverage_identification",
      lens: l.isConvergenceZone ? "cross-lens" : dominantLens,
      evidence: l.evidence,
      timestamp: now,
    });
  }

  // Opportunities → strategic_opportunity layer
  for (const o of opportunities) {
    records.push({
      insightId: o.id,
      label: o.label,
      originObservation: o.evidence[0] || o.label,
      reasoningLayer: "strategic_opportunity",
      lens: dominantLens,
      evidence: o.evidence,
      parentInsightId: o.sourceInsightId,
      timestamp: now,
    });
  }

  // Compute layer counts
  const layerCounts: Record<ReasoningLayer, number> = {
    raw_observation: 0,
    assumption_extraction: 0,
    friction_detection: 0,
    constraint_mapping: 0,
    leverage_identification: 0,
    strategic_opportunity: 0,
  };
  let crossLensCount = 0;
  for (const r of records) {
    layerCounts[r.reasoningLayer]++;
    if (r.lens === "cross-lens") crossLensCount++;
  }

  return { records, layerCounts, crossLensCount };
}

/**
 * Trace an insight back to its full chain of reasoning.
 */
export function traceInsight(
  insightId: string,
  registry: ProvenanceRegistry,
): ProvenanceRecord[] {
  const chain: ProvenanceRecord[] = [];
  let current = registry.records.find(r => r.insightId === insightId);
  const visited = new Set<string>();

  while (current && !visited.has(current.insightId)) {
    visited.add(current.insightId);
    chain.unshift(current);
    if (current.parentInsightId) {
      current = registry.records.find(r => r.insightId === current!.parentInsightId);
    } else {
      break;
    }
  }

  return chain;
}
