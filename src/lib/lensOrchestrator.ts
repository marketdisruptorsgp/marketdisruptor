/**
 * LENS ORCHESTRATOR
 *
 * Controls lens execution, merges outputs into unified format,
 * deduplicates constraints/leverage across lenses, and detects
 * cross-lens convergence before handing off to SystemIntelligence.
 */

import type { LensType, LeverageNode } from "@/lib/multiLensEngine";
import type { ConstraintNode, OpportunityNode } from "@/lib/systemIntelligence";
import { detectConvergenceZones, type ConvergenceZone } from "@/lib/convergenceEngine";
import { type DiagnosticContext } from "@/lib/diagnosticContext";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface LensOutput {
  lens: LensType;
  constraints: ConstraintNode[];
  leveragePoints: LeverageNode[];
  opportunities: OpportunityNode[];
}

export interface MergedLensOutput {
  constraints: ConstraintNode[];
  leveragePoints: LeverageNode[];
  opportunities: OpportunityNode[];
  convergenceZones: ConvergenceZone[];
  lensContributions: Record<LensType, { constraints: number; leverage: number; opportunities: number }>;
}

// ═══════════════════════════════════════════════════════════════
//  DEDUPLICATION
// ═══════════════════════════════════════════════════════════════

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function deduplicateNodes<T extends { id: string; label: string; evidence: string[] }>(
  items: T[],
): T[] {
  const seen = new Map<string, T>();

  for (const item of items) {
    const key = normalizeLabel(item.label);
    const existing = seen.get(key);
    if (existing) {
      // Merge evidence arrays
      const mergedEvidence = [...new Set([...existing.evidence, ...item.evidence])];
      seen.set(key, { ...existing, evidence: mergedEvidence });
    } else {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}

// ═══════════════════════════════════════════════════════════════
//  LENS EXTRACTION — per-lens node extraction from shared model
// ═══════════════════════════════════════════════════════════════

export function extractLensOutput(
  lens: LensType,
  allNodes: LeverageNode[],
): LensOutput {
  const lensNodes = allNodes.filter(n =>
    n.lensScores.some(ls => ls.lens === lens && ls.score >= 5),
  );

  return {
    lens,
    constraints: lensNodes
      .filter(n => n.type === "constraint")
      .map(n => ({
        id: n.id,
        label: n.label,
        impact: n.impact,
        confidence: n.confidence,
        evidence: n.evidence,
        attributes: n.attributes,
      })),
    leveragePoints: lensNodes.filter(n => n.type === "leverage"),
    opportunities: lensNodes
      .filter(n => n.type === "opportunity")
      .map(n => ({
        id: n.id,
        label: n.label,
        impact: n.impact,
        confidence: n.confidence,
        evidence: n.evidence,
        attributes: n.attributes,
      })),
  };
}

// ═══════════════════════════════════════════════════════════════
//  MERGE — combines multiple lens outputs
// ═══════════════════════════════════════════════════════════════

export function mergeLensOutputs(outputs: LensOutput[], context?: DiagnosticContext): MergedLensOutput {
  // Track per-lens contributions
  const lensContributions = {} as Record<LensType, { constraints: number; leverage: number; opportunities: number }>;
  for (const out of outputs) {
    lensContributions[out.lens] = {
      constraints: out.constraints.length,
      leverage: out.leveragePoints.length,
      opportunities: out.opportunities.length,
    };
  }

  // Merge and deduplicate
  const allConstraints = outputs.flatMap(o => o.constraints);
  const allLeverage = outputs.flatMap(o => o.leveragePoints);
  const allOpportunities = outputs.flatMap(o => o.opportunities);

  const constraints = deduplicateNodes(allConstraints);
  const leveragePoints = deduplicateNodes(allLeverage);
  const opportunities = deduplicateNodes(allOpportunities);

  // Detect convergence
  const convergenceZones = detectConvergenceZones(outputs, context);

  return {
    constraints,
    leveragePoints,
    opportunities,
    convergenceZones,
    lensContributions,
  };
}

// ═══════════════════════════════════════════════════════════════
//  ORCHESTRATE — run selected lenses and merge
// ═══════════════════════════════════════════════════════════════

export function orchestrateLenses(
  selectedLenses: LensType[],
  allNodes: LeverageNode[],
  context?: DiagnosticContext,
): MergedLensOutput {
  const outputs = selectedLenses.map(lens => extractLensOutput(lens, allNodes));
  return mergeLensOutputs(outputs, context);
}
