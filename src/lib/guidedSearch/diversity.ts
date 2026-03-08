/**
 * Guided Search Loop — Diversity Utilities
 *
 * Provides structural similarity measures and diversity-aware
 * selection algorithms for survivor selection, fresh generation
 * balancing, and final output diversity enforcement.
 */

import type { EvaluableConcept, StructuralFeatures, ConceptEvaluationResult } from "@/lib/conceptEvaluation";
import type { ConceptSeed } from "./types";

// ═══════════════════════════════════════════════════════════════
//  STRUCTURAL SIMILARITY
// ═══════════════════════════════════════════════════════════════

/**
 * Dimension weights reflecting strategic significance.
 * Larger weights = bigger strategic shift when values differ.
 */
const DIMENSION_WEIGHTS: Record<string, number> = {
  concept_type:   0.30,
  distribution:   0.25,
  customer:       0.20,
  function:       0.15,
  pricing_model:  0.10,
  workflow_stage: 0.08,
  regulatory_class: 0.05,
  capital_intensity: 0.05,
};

const WEIGHTED_DIMS = Object.keys(DIMENSION_WEIGHTS);

/**
 * Weighted feature distance between two concepts (0 = identical, 1 = fully different).
 * Dimensions with higher strategic significance contribute more to distance.
 */
export function featureDistance(a: StructuralFeatures, b: StructuralFeatures): number {
  let weightedDiff = 0;
  let totalWeight = 0;

  for (const key of WEIGHTED_DIMS) {
    const va = a[key];
    const vb = b[key];
    if (!va && !vb) continue;
    const w = DIMENSION_WEIGHTS[key] ?? 0.1;
    totalWeight += w;
    if (!va || !vb || va.toLowerCase() !== vb.toLowerCase()) {
      weightedDiff += w;
    }
  }

  return totalWeight === 0 ? 1 : weightedDiff / totalWeight;
}

/**
 * Minimum distance from a concept to any concept in a set.
 */
function minDistanceToSet(
  candidate: StructuralFeatures,
  selected: StructuralFeatures[]
): number {
  if (selected.length === 0) return 1;
  let min = 1;
  for (const s of selected) {
    const d = featureDistance(candidate, s);
    if (d < min) min = d;
  }
  return min;
}

// ═══════════════════════════════════════════════════════════════
//  1. DIVERSITY-AWARE SURVIVOR SELECTION
// ═══════════════════════════════════════════════════════════════

interface ScoredEntry {
  concept: EvaluableConcept;
  result: ConceptEvaluationResult;
}

/**
 * Select survivors preserving diversity:
 * - Top 50% of slots go to highest-scoring concepts
 * - Remaining 50% filled greedily by max-min distance to already selected
 *   (among candidates scoring above median)
 */
export function selectDiverseSurvivors(
  population: EvaluableConcept[],
  results: ConceptEvaluationResult[],
  survivorCount: number,
  diversityThreshold: number = 0.3
): EvaluableConcept[] {
  if (population.length <= survivorCount) return [...population];

  // Build scored entries sorted by score desc
  const entries: ScoredEntry[] = results.map((r) => ({
    concept: population.find((c) => c.id === r.conceptId)!,
    result: r,
  })).filter((e) => e.concept);

  const eliteCount = Math.max(1, Math.ceil(survivorCount * 0.5));
  const diversitySlots = survivorCount - eliteCount;

  // Elite: top N by score
  const selected: EvaluableConcept[] = entries.slice(0, eliteCount).map((e) => e.concept);
  const selectedFeatures: StructuralFeatures[] = selected.map((c) => c.structural_features);

  // Remaining candidates: above-median score, not already selected
  const selectedIds = new Set(selected.map((c) => c.id));
  const median = entries.length > 0
    ? entries[Math.floor(entries.length / 2)].result.weightedComposite
    : 0;

  const candidates = entries.filter(
    (e) => !selectedIds.has(e.concept.id) && e.result.weightedComposite >= median * 0.8
  );

  // Greedy max-min diversity fill
  for (let i = 0; i < diversitySlots && candidates.length > 0; i++) {
    let bestIdx = 0;
    let bestDist = -1;

    for (let j = 0; j < candidates.length; j++) {
      const dist = minDistanceToSet(candidates[j].concept.structural_features, selectedFeatures);
      // Combine distance with score: 70% diversity, 30% score
      const combined = dist * 0.7 + candidates[j].result.weightedComposite * 0.3;
      if (combined > bestDist) {
        bestDist = combined;
        bestIdx = j;
      }
    }

    const pick = candidates.splice(bestIdx, 1)[0];
    selected.push(pick.concept);
    selectedFeatures.push(pick.concept.structural_features);
  }

  return selected;
}

// ═══════════════════════════════════════════════════════════════
//  2. EXPLORATION-BALANCED FRESH GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Pick seeds for fresh generation, favoring under-explored zones.
 * Returns seeds weighted inversely by their representation in the population.
 */
export function pickUnderexploredSeed(
  seeds: ConceptSeed[],
  population: EvaluableConcept[]
): ConceptSeed {
  if (seeds.length <= 1) return seeds[0];

  // Count how many concepts exist per zone
  const zoneCounts = new Map<string, number>();
  for (const s of seeds) {
    zoneCounts.set(s.opportunity_zone_id, 0);
  }
  for (const c of population) {
    if (c.opportunity_zone_id) {
      zoneCounts.set(
        c.opportunity_zone_id,
        (zoneCounts.get(c.opportunity_zone_id) ?? 0) + 1
      );
    }
  }

  // Inverse frequency weights
  const maxCount = Math.max(1, ...zoneCounts.values());
  const weights = seeds.map((s) => {
    const count = zoneCounts.get(s.opportunity_zone_id) ?? 0;
    return maxCount - count + 1; // +1 so even fully explored zones have some chance
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;

  for (let i = 0; i < seeds.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return seeds[i];
  }

  return seeds[seeds.length - 1];
}

// ═══════════════════════════════════════════════════════════════
//  3. DIVERSITY-ENFORCED FINAL SELECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Select final outputs enforcing structural diversity.
 * Uses greedy max-min distance selection after taking the #1 concept.
 * Also prefers different concept_type / opportunity_zone where possible.
 */
export function selectDiverseFinalOutput(
  allEvaluated: { concept: EvaluableConcept; evaluation: ConceptEvaluationResult }[],
  count: number,
  minDiversity: number = 0.25
): { concept: EvaluableConcept; evaluation: ConceptEvaluationResult }[] {
  if (allEvaluated.length <= count) return [...allEvaluated];

  // Sort by score desc
  const sorted = [...allEvaluated].sort(
    (a, b) => b.evaluation.weightedComposite - a.evaluation.weightedComposite
  );

  // Take the best concept first
  const selected: typeof sorted = [sorted[0]];
  const selectedFeatures: StructuralFeatures[] = [sorted[0].concept.structural_features];
  const selectedZones = new Set<string>();
  if (sorted[0].concept.opportunity_zone_id) {
    selectedZones.add(sorted[0].concept.opportunity_zone_id);
  }

  const remaining = sorted.slice(1);

  while (selected.length < count && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -1;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const dist = minDistanceToSet(candidate.concept.structural_features, selectedFeatures);

      // Skip near-duplicates
      if (dist < minDiversity && remaining.length > count - selected.length) continue;

      // Bonus for different zone
      const zoneBonus = candidate.concept.opportunity_zone_id &&
        !selectedZones.has(candidate.concept.opportunity_zone_id) ? 0.15 : 0;

      // Combined: 50% diversity + 35% score + 15% zone bonus
      const combined =
        dist * 0.50 +
        candidate.evaluation.weightedComposite * 0.35 +
        zoneBonus;

      if (combined > bestScore) {
        bestScore = combined;
        bestIdx = i;
      }
    }

    const pick = remaining.splice(bestIdx, 1)[0];
    selected.push(pick);
    selectedFeatures.push(pick.concept.structural_features);
    if (pick.concept.opportunity_zone_id) {
      selectedZones.add(pick.concept.opportunity_zone_id);
    }
  }

  return selected;
}
