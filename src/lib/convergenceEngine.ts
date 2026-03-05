/**
 * CONVERGENCE ENGINE
 *
 * Detects cross-lens convergence zones — areas where multiple
 * analytical lenses identify the same constraint or leverage point.
 *
 * Convergence scoring:
 *   2 lenses → convergence (strength 0.6)
 *   3 lenses → strategic convergence (strength 1.0)
 */

import type { LensType } from "@/lib/multiLensEngine";
import type { LensOutput } from "@/lib/lensOrchestrator";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface ConvergenceZone {
  id: string;
  label: string;
  type: "constraint" | "leverage" | "opportunity";
  lenses: LensType[];
  evidence: string[];
  strength: number; // 0-1, higher = more lenses agree
  isStrategic: boolean; // 3+ lenses
}

// ═══════════════════════════════════════════════════════════════
//  DETECTION
// ═══════════════════════════════════════════════════════════════

function normalizeForMatch(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export function detectConvergenceZones(lensOutputs: LensOutput[]): ConvergenceZone[] {
  if (lensOutputs.length < 2) return [];

  // Build a map: normalized label → { lenses, evidence, type, originalLabel }
  const labelMap = new Map<string, {
    lenses: Set<LensType>;
    evidence: Set<string>;
    type: "constraint" | "leverage" | "opportunity";
    originalLabel: string;
    id: string;
  }>();

  for (const output of lensOutputs) {
    const allItems = [
      ...output.constraints.map(c => ({ ...c, type: "constraint" as const })),
      ...output.leveragePoints.map(l => ({ id: l.id, label: l.label, evidence: l.evidence, type: "leverage" as const })),
      ...output.opportunities.map(o => ({ ...o, type: "opportunity" as const })),
    ];

    for (const item of allItems) {
      const key = normalizeForMatch(item.label);
      if (!key) continue;

      const existing = labelMap.get(key);
      if (existing) {
        existing.lenses.add(output.lens);
        for (const e of item.evidence) existing.evidence.add(e);
      } else {
        labelMap.set(key, {
          lenses: new Set([output.lens]),
          evidence: new Set(item.evidence),
          type: item.type,
          originalLabel: item.label,
          id: item.id,
        });
      }
    }
  }

  // Filter to items found in 2+ lenses
  const zones: ConvergenceZone[] = [];
  for (const [, entry] of labelMap) {
    if (entry.lenses.size < 2) continue;

    const lensCount = entry.lenses.size;
    zones.push({
      id: entry.id,
      label: entry.originalLabel,
      type: entry.type,
      lenses: Array.from(entry.lenses),
      evidence: Array.from(entry.evidence),
      strength: lensCount >= 3 ? 1.0 : 0.6,
      isStrategic: lensCount >= 3,
    });
  }

  // Sort by strength desc, then by evidence count
  zones.sort((a, b) => b.strength - a.strength || b.evidence.length - a.evidence.length);

  return zones;
}
