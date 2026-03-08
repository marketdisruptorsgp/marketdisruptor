/**
 * Guided Search Loop — Public API
 */

export { runGuidedSearch } from "./engine";
export { getMutationProfile } from "./mutationProfiles";
export { generateInitialPopulation, mutate, recombine, generateFresh } from "./operators";

export type {
  SearchConfig,
  SearchIteration,
  GuidedSearchResult,
  ConceptSeed,
  ArchetypeMutationProfile,
  MutableDimensions,
} from "./types";

export { DEFAULT_SEARCH_CONFIG } from "./types";
