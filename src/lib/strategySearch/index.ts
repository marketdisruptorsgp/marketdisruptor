/**
 * Strategy Search Engine — Public API
 *
 * Evolutionary search over strategy candidates that crosses
 * constraints × patterns × mechanisms to discover non-obvious
 * strategic configurations.
 */

export { runStrategySearch } from "./engine";
export { generateInitialPopulation, mutateCandidate, generateFreshCandidate } from "./generator";
export { evaluateStrategies, strategyDistance, selectDiverseSurvivors, selectDiverseOutput } from "./evaluator";

export type {
  StrategyCandidate,
  StrategyFeatures,
  StrategyEvaluation,
  StrategySearchConfig,
  StrategySearchResult,
} from "./types";

export { DEFAULT_STRATEGY_SEARCH_CONFIG } from "./types";
