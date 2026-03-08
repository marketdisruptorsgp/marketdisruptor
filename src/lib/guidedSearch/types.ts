/**
 * Guided Search Loop — Type Definitions
 */

import type {
  EvaluableConcept,
  EvaluationContext,
  ConceptEvaluationResult,
  StructuralFeatures,
} from "@/lib/conceptEvaluation";
import type { OpportunityArchetype } from "@/lib/marketStructure";

// ═══════════════════════════════════════════════════════════════
//  ZONE-AWARE MUTATION CONFIG
// ═══════════════════════════════════════════════════════════════

/** Which structural feature keys are mutable per archetype */
export type MutableDimensions = (keyof StructuralFeatures)[];

export interface ArchetypeMutationProfile {
  archetype: OpportunityArchetype;
  /** Primary dimensions to mutate (high probability) */
  primaryDimensions: MutableDimensions;
  /** Secondary dimensions (low probability, for diversity) */
  secondaryDimensions: MutableDimensions;
  /** Possible values per dimension for this archetype context */
  dimensionOptions: Partial<Record<keyof StructuralFeatures, string[]>>;
}

// ═══════════════════════════════════════════════════════════════
//  SEARCH LOOP CONFIG
// ═══════════════════════════════════════════════════════════════

export interface SearchConfig {
  /** Initial population size (default 20) */
  populationSize: number;
  /** Fraction of population kept as survivors (default 0.2) */
  survivorRate: number;
  /** Fraction of next gen from mutations (default 0.5) */
  mutationRate: number;
  /** Fraction of next gen from recombinations (default 0.3) */
  recombinationRate: number;
  /** Remaining fraction filled with fresh random (default 0.2) */
  /** Max iterations before forced stop */
  maxIterations: number;
  /** Minimum score improvement to continue (default 0.02) */
  convergenceThreshold: number;
  /** Consecutive plateau iterations before stopping (default 3) */
  plateauPatience: number;
  /** Final output count (default 5) */
  finalOutputCount: number;
}

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  populationSize: 20,
  survivorRate: 0.2,
  mutationRate: 0.5,
  recombinationRate: 0.3,
  maxIterations: 8,
  convergenceThreshold: 0.02,
  plateauPatience: 3,
  finalOutputCount: 5,
};

// ═══════════════════════════════════════════════════════════════
//  SEARCH RESULTS
// ═══════════════════════════════════════════════════════════════

export interface SearchIteration {
  iteration: number;
  populationSize: number;
  bestScore: number;
  avgScore: number;
  survivorCount: number;
}

export interface GuidedSearchResult {
  /** Final top concepts with evaluations */
  concepts: (EvaluableConcept & { evaluation: ConceptEvaluationResult })[];
  /** Iteration history for diagnostics */
  iterations: SearchIteration[];
  /** Total concepts evaluated across all iterations */
  totalEvaluated: number;
  /** Why the loop stopped */
  stopReason: "converged" | "max_iterations" | "population_exhausted";
}

/** Seed concept template from an opportunity zone */
export interface ConceptSeed {
  domain: string;
  concept_type: string;
  archetype: OpportunityArchetype;
  opportunity_zone_id: string;
  baseFeatures: StructuralFeatures;
}
