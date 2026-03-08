/**
 * Guided Search Loop — Genetic Operators
 *
 * Mutation: change 1-2 dimensions on a survivor, zone-aware.
 * Recombination: crossover features from two survivors.
 * Fresh: random concept within the archetype's option space.
 */

import type { EvaluableConcept, StructuralFeatures } from "@/lib/conceptEvaluation";
import type { ArchetypeMutationProfile, ConceptSeed } from "./types";
import { getMutationProfile } from "./mutationProfiles";

let _idCounter = 0;
function nextId(prefix: string): string {
  _idCounter++;
  return `${prefix}-${Date.now()}-${_idCounter}`;
}

/** Reset counter (for testing) */
export function resetIdCounter(): void {
  _idCounter = 0;
}

// ── Helpers ──────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomDimensionValue(
  dim: keyof StructuralFeatures,
  profile: ArchetypeMutationProfile,
  exclude?: string
): string {
  const options = profile.dimensionOptions[dim] ?? [];
  const filtered = exclude ? options.filter((o) => o !== exclude) : options;
  return filtered.length > 0 ? pickRandom(filtered) : exclude ?? "";
}

// ═══════════════════════════════════════════════════════════════
//  MUTATION
// ═══════════════════════════════════════════════════════════════

/**
 * Mutate a survivor with adaptive strength.
 * Early iterations: 1-2 primary mutations, 20% secondary.
 * Later iterations: 2-3 primary mutations, 40%+ secondary.
 * maxIterations defaults to 8 if not provided.
 */
export function mutate(
  parent: EvaluableConcept,
  seed: ConceptSeed,
  iteration: number,
  maxIterations: number = 8
): EvaluableConcept {
  const profile = getMutationProfile(seed.archetype);
  const features = { ...parent.structural_features };

  // Adaptive mutation strength: increases with iteration progress
  const progress = Math.min(1, iteration / Math.max(1, maxIterations - 1));

  // Base: 60% chance of 1, 40% chance of 2
  // At max progress: 20% chance of 1, 50% chance of 2, 30% chance of 3
  let mutationCount: number;
  const roll = Math.random();
  if (progress < 0.3) {
    mutationCount = roll < 0.6 ? 1 : 2;
  } else if (progress < 0.7) {
    mutationCount = roll < 0.35 ? 1 : roll < 0.85 ? 2 : 3;
  } else {
    mutationCount = roll < 0.2 ? 1 : roll < 0.7 ? 2 : 3;
  }

  const capped = Math.min(mutationCount, profile.primaryDimensions.length);
  const dims = pickRandomN(profile.primaryDimensions, capped);

  for (const dim of dims) {
    features[dim] = randomDimensionValue(dim, profile, features[dim]);
  }

  // Secondary mutation probability scales with progress (20% → 45%)
  const secondaryProb = 0.2 + progress * 0.25;
  if (Math.random() < secondaryProb && profile.secondaryDimensions.length > 0) {
    const secDim = pickRandom(profile.secondaryDimensions);
    features[secDim] = randomDimensionValue(secDim, profile, features[secDim]);
  }

  return {
    id: nextId("mut"),
    domain: parent.domain,
    concept_type: parent.concept_type,
    structural_features: features,
    opportunity_zone_id: parent.opportunity_zone_id,
  };
}

// ═══════════════════════════════════════════════════════════════
//  RECOMBINATION
// ═══════════════════════════════════════════════════════════════

/**
 * Crossover: for each feature, randomly pick from parent A or B.
 */
export function recombine(
  parentA: EvaluableConcept,
  parentB: EvaluableConcept,
  seed: ConceptSeed
): EvaluableConcept {
  const features: StructuralFeatures = {};
  const allKeys = new Set([
    ...Object.keys(parentA.structural_features),
    ...Object.keys(parentB.structural_features),
  ]);

  for (const key of allKeys) {
    const valA = parentA.structural_features[key];
    const valB = parentB.structural_features[key];
    if (valA && valB) {
      features[key] = Math.random() < 0.5 ? valA : valB;
    } else {
      features[key] = valA ?? valB;
    }
  }

  return {
    id: nextId("rec"),
    domain: parentA.domain,
    concept_type: parentA.concept_type,
    structural_features: features,
    opportunity_zone_id: parentA.opportunity_zone_id,
  };
}

// ═══════════════════════════════════════════════════════════════
//  FRESH RANDOM
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a fresh random concept within the archetype's option space.
 */
export function generateFresh(seed: ConceptSeed): EvaluableConcept {
  const profile = getMutationProfile(seed.archetype);
  const features: StructuralFeatures = { ...seed.baseFeatures };

  // Randomize all primary + secondary dimensions
  for (const dim of [...profile.primaryDimensions, ...profile.secondaryDimensions]) {
    const options = profile.dimensionOptions[dim];
    if (options && options.length > 0) {
      features[dim] = pickRandom(options);
    }
  }

  return {
    id: nextId("fresh"),
    domain: seed.domain,
    concept_type: seed.concept_type,
    structural_features: features,
    opportunity_zone_id: seed.opportunity_zone_id,
  };
}

// ═══════════════════════════════════════════════════════════════
//  INITIAL POPULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate initial population from seeds.
 * Distributes population across seeds, then fills with fresh randoms.
 */
export function generateInitialPopulation(
  seeds: ConceptSeed[],
  populationSize: number
): EvaluableConcept[] {
  if (seeds.length === 0) return [];

  const population: EvaluableConcept[] = [];
  const perSeed = Math.max(1, Math.floor(populationSize / seeds.length));

  for (const seed of seeds) {
    for (let i = 0; i < perSeed && population.length < populationSize; i++) {
      population.push(generateFresh(seed));
    }
  }

  // Fill remaining slots
  while (population.length < populationSize) {
    population.push(generateFresh(pickRandom(seeds)));
  }

  return population;
}
