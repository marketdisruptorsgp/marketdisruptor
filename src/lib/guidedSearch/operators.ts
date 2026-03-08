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
 * Mutate a survivor by changing 1-2 primary dimensions.
 * 20% chance of also mutating a secondary dimension.
 */
export function mutate(
  parent: EvaluableConcept,
  seed: ConceptSeed,
  iteration: number
): EvaluableConcept {
  const profile = getMutationProfile(seed.archetype);
  const features = { ...parent.structural_features };

  // Pick 1-2 primary dimensions to mutate
  const mutationCount = Math.random() < 0.6 ? 1 : 2;
  const dims = pickRandomN(profile.primaryDimensions, mutationCount);

  for (const dim of dims) {
    features[dim] = randomDimensionValue(dim, profile, features[dim]);
  }

  // 20% chance of secondary mutation
  if (Math.random() < 0.2 && profile.secondaryDimensions.length > 0) {
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
