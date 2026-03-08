/**
 * Guided Search Loop — Main Engine
 *
 * Implements: generate → evaluate → select diverse survivors →
 * mutate + recombine + exploration-balanced fresh → evaluate →
 * repeat until convergence → diversity-enforced final selection.
 */

import type { EvaluationContext, ConceptEvaluationResult, EvaluableConcept } from "@/lib/conceptEvaluation";
import { evaluateConceptBatch } from "@/lib/conceptEvaluation";
import type {
  SearchConfig,
  SearchIteration,
  GuidedSearchResult,
  ConceptSeed,
} from "./types";
import { DEFAULT_SEARCH_CONFIG } from "./types";
import { generateInitialPopulation, mutate, recombine, generateFresh } from "./operators";
import { selectDiverseSurvivors, pickUnderexploredSeed, selectDiverseFinalOutput } from "./diversity";

// ── Helpers ──────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ═══════════════════════════════════════════════════════════════
//  MAIN SEARCH LOOP
// ═══════════════════════════════════════════════════════════════

export function runGuidedSearch(
  seeds: ConceptSeed[],
  context: EvaluationContext,
  config: Partial<SearchConfig> = {}
): GuidedSearchResult {
  const cfg: SearchConfig = { ...DEFAULT_SEARCH_CONFIG, ...config };
  const iterations: SearchIteration[] = [];
  let totalEvaluated = 0;
  let plateauCount = 0;
  let previousBest = -1;
  let stopReason: GuidedSearchResult["stopReason"] = "max_iterations";

  // Track all evaluated concepts with their scores
  const allEvaluated: { concept: EvaluableConcept; evaluation: ConceptEvaluationResult }[] = [];

  // Track cumulative population for exploration balancing
  const cumulativePopulation: EvaluableConcept[] = [];

  // ── Initial population ────────────────────────────────────
  let population = generateInitialPopulation(seeds, cfg.populationSize);

  for (let iter = 0; iter < cfg.maxIterations; iter++) {
    if (population.length === 0) {
      stopReason = "population_exhausted";
      break;
    }

    // ── Evaluate ────────────────────────────────────────────
    const results = evaluateConceptBatch(population, context);
    totalEvaluated += results.length;

    // Merge into tracking
    for (let i = 0; i < population.length; i++) {
      allEvaluated.push({ concept: population[i], evaluation: results[i] });
      cumulativePopulation.push(population[i]);
    }

    const bestScore = results[0]?.weightedComposite ?? 0;
    const avgScore =
      results.reduce((s, r) => s + r.weightedComposite, 0) / results.length;

    const survivorCount = Math.max(2, Math.ceil(population.length * cfg.survivorRate));

    iterations.push({
      iteration: iter,
      populationSize: population.length,
      bestScore,
      avgScore,
      survivorCount,
    });

    // ── Convergence check ───────────────────────────────────
    const improvement = bestScore - previousBest;
    if (previousBest >= 0 && improvement < cfg.convergenceThreshold) {
      plateauCount++;
      if (plateauCount >= cfg.plateauPatience) {
        stopReason = "converged";
        break;
      }
    } else {
      plateauCount = 0;
    }
    previousBest = bestScore;

    // ── Diversity-aware survivor selection ───────────────────
    const survivorConcepts = selectDiverseSurvivors(
      population,
      results,
      survivorCount
    );

    // ── Build next generation ───────────────────────────────
    const nextGen: EvaluableConcept[] = [];
    const targetSize = cfg.populationSize;

    const mutationCount = Math.floor(targetSize * cfg.mutationRate);
    const recombCount = Math.floor(targetSize * cfg.recombinationRate);
    const freshCount = targetSize - mutationCount - recombCount;

    // Mutations from survivors
    for (let i = 0; i < mutationCount; i++) {
      const parent = pickRandom(survivorConcepts);
      const seed = seeds.find((s) => s.opportunity_zone_id === parent.opportunity_zone_id) ?? pickRandom(seeds);
      nextGen.push(mutate(parent, seed, iter));
    }

    // Recombinations between survivors
    if (survivorConcepts.length >= 2) {
      for (let i = 0; i < recombCount; i++) {
        const [a, b] = [pickRandom(survivorConcepts), pickRandom(survivorConcepts)];
        const seed = seeds.find((s) => s.opportunity_zone_id === a.opportunity_zone_id) ?? pickRandom(seeds);
        if (a.id !== b.id) {
          nextGen.push(recombine(a, b, seed));
        } else {
          nextGen.push(mutate(a, seed, iter));
        }
      }
    } else {
      for (let i = 0; i < recombCount; i++) {
        const parent = pickRandom(survivorConcepts);
        const seed = seeds.find((s) => s.opportunity_zone_id === parent.opportunity_zone_id) ?? pickRandom(seeds);
        nextGen.push(mutate(parent, seed, iter));
      }
    }

    // Exploration-balanced fresh generation
    for (let i = 0; i < freshCount; i++) {
      const seed = pickUnderexploredSeed(seeds, cumulativePopulation);
      nextGen.push(generateFresh(seed));
    }

    population = nextGen;
  }

  // ── Diversity-enforced final selection ─────────────────────
  const finalEntries = selectDiverseFinalOutput(
    allEvaluated,
    cfg.finalOutputCount
  );

  const finalConcepts = finalEntries.map((e) => ({
    ...e.concept,
    evaluation: e.evaluation,
  }));

  return {
    concepts: finalConcepts,
    iterations,
    totalEvaluated,
    stopReason,
  };
}
