/**
 * CONVERGENCE ENGINE
 *
 * Detects cross-lens convergence zones — areas where multiple
 * analytical lenses identify the same constraint or leverage point.
 *
 * Convergence scoring:
 *   2 lenses → convergence (strength 0.6)
 *   3 lenses → strategic convergence (strength 1.0)
 *
 * When a DiagnosticContext is provided, the active mode influences how
 * convergence zones are classified and ranked so the most relevant ones
 * for the current analysis are surfaced first.
 */

import type { LensType } from "@/lib/multiLensEngine";
import type { LensOutput } from "@/lib/lensOrchestrator";
import { type DiagnosticContext } from "@/lib/diagnosticContext";

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
  /** Optional: which mode foregrounded this zone */
  modeContext?: string;
}

// ═══════════════════════════════════════════════════════════════
//  MODE-SPECIFIC CONVERGENCE TYPE WEIGHTS
// ═══════════════════════════════════════════════════════════════

/** Mode-aware score multipliers for convergence zone types */
const MODE_CONVERGENCE_WEIGHTS: Record<
  string,
  Partial<Record<"constraint" | "leverage" | "opportunity", number>>
> = {
  product:        { constraint: 1.3, leverage: 1.1, opportunity: 1.0 },
  service:        { constraint: 1.2, leverage: 1.3, opportunity: 1.0 },
  business_model: { opportunity: 1.4, leverage: 1.2, constraint: 1.0 },
};

// ═══════════════════════════════════════════════════════════════
//  DETECTION
// ═══════════════════════════════════════════════════════════════

function normalizeForMatch(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export function detectConvergenceZones(
  lensOutputs: LensOutput[],
  context?: DiagnosticContext,
): ConvergenceZone[] {
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

  // Mode weight lookup
  const modeWeights = context ? (MODE_CONVERGENCE_WEIGHTS[context.mode] ?? {}) : {};

  // Filter to items found in 2+ lenses
  const zones: ConvergenceZone[] = [];
  for (const [, entry] of labelMap) {
    if (entry.lenses.size < 2) continue;

    const lensCount = entry.lenses.size;
    const baseStrength = lensCount >= 3 ? 1.0 : 0.6;
    const modeBoost = modeWeights[entry.type] ?? 1.0;

    zones.push({
      id: entry.id,
      label: entry.originalLabel,
      type: entry.type,
      lenses: Array.from(entry.lenses),
      evidence: Array.from(entry.evidence),
      strength: Math.min(1.0, baseStrength * modeBoost),
      isStrategic: lensCount >= 3,
      modeContext: context?.mode,
    });
  }

  // Sort by strength desc, then by evidence count
  zones.sort((a, b) => b.strength - a.strength || b.evidence.length - a.evidence.length);

  return zones;
}
