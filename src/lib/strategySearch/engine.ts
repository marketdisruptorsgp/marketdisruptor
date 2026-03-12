/**
 * STRATEGY SEARCH ENGINE — Main Loop
 *
 * Evolutionary search over strategy candidates:
 *   generate → evaluate → select diverse survivors →
 *   mutate + fresh → evaluate → repeat → diverse final output
 *
 * Operates at the STRATEGY level (constraints × patterns × mechanisms)
 * rather than the concept level (pricing models, distribution channels).
 */

import type { StructuralProfile } from "@/lib/reconfiguration/structuralProfile";
import type {
  StrategyCandidate,
  StrategySearchConfig,
  StrategySearchResult,
} from "./types";
import { DEFAULT_STRATEGY_SEARCH_CONFIG } from "./types";
import {
  generateInitialPopulation,
  mutateCandidate,
  generateFreshCandidate,
} from "./generator";
import {
  evaluateStrategies,
  selectDiverseSurvivors,
  selectDiverseOutput,
} from "./evaluator";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Run evolutionary strategy search.
 *
 * Input: StructuralProfile (from Stage 2)
 * Output: 5-8 diverse strategy candidates for AI deepening
 *
 * This replaces the simple "qualify patterns → deepen top 3" pipeline
 * with an exploratory search that can discover non-obvious combinations.
 */
export function runStrategySearch(
  profile: StructuralProfile,
  config: Partial<StrategySearchConfig> = {},
): StrategySearchResult {
  const cfg = { ...DEFAULT_STRATEGY_SEARCH_CONFIG, ...config };
  let totalEvaluated = 0;
  let iterationsRun = 0;
  let previousBest = -1;
  let plateauCount = 0;
  let stopReason: StrategySearchResult["stopReason"] = "max_iterations";

  // Track all evaluated candidates
  const allCandidates: StrategyCandidate[] = [];

  // ── Initial population ──
  let population = generateInitialPopulation(profile, cfg.populationSize);

  if (population.length === 0) {
    return {
      strategies: [],
      totalEvaluated: 0,
      iterationsRun: 0,
      stopReason: "max_iterations",
    };
  }

  for (let iter = 0; iter < cfg.maxIterations; iter++) {
    iterationsRun = iter + 1;

    // ── Evaluate ──
    const evaluations = evaluateStrategies(population, profile);
    totalEvaluated += evaluations.length;
    allCandidates.push(...population);

    const bestScore = evaluations[0]?.composite ?? 0;

    // ── Convergence check ──
    if (previousBest >= 0 && bestScore - previousBest < cfg.convergenceThreshold) {
      plateauCount++;
      if (plateauCount >= 2) {
        stopReason = "converged";
        break;
      }
    } else {
      plateauCount = 0;
    }
    previousBest = bestScore;

    // ── Select survivors ──
    const survivorCount = Math.max(3, Math.ceil(population.length * cfg.survivorRate));
    const survivors = selectDiverseSurvivors(population, evaluations, survivorCount);

    // ── Build next generation ──
    const nextGen: StrategyCandidate[] = [];
    const mutationCount = Math.floor(cfg.populationSize * cfg.mutationRate);
    const freshCount = Math.floor(cfg.populationSize * cfg.freshRate);
    const carryCount = cfg.populationSize - mutationCount - freshCount;

    // Carry forward best survivors
    for (let i = 0; i < carryCount && i < survivors.length; i++) {
      nextGen.push(survivors[i]);
    }

    // Mutations
    for (let i = 0; i < mutationCount; i++) {
      const parent = pickRandom(survivors);
      nextGen.push(mutateCandidate(parent, profile));
    }

    // Fresh candidates
    for (let i = 0; i < freshCount; i++) {
      const fresh = generateFreshCandidate(profile);
      if (fresh) nextGen.push(fresh);
    }

    population = nextGen;
  }

  // ── Final evaluation on all candidates ──
  const finalEvaluations = evaluateStrategies(allCandidates, profile);

  // ── Diverse final selection ──
  const strategies = selectDiverseOutput(
    allCandidates,
    finalEvaluations,
    cfg.outputCount,
  );

  return {
    strategies,
    totalEvaluated,
    iterationsRun,
    stopReason,
  };
}
