/**
 * Guided Search Loop — Main Engine
 *
 * Implements: generate → evaluate → select survivors →
 * mutate + recombine + fresh → evaluate → repeat until convergence.
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
  let allEvaluated: { concept: EvaluableConcept; evaluation: ConceptEvaluationResult }[] = [];

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

    // Merge into all-time tracked
    for (let i = 0; i < population.length; i++) {
      allEvaluated.push({
        concept: population[i],
        evaluation: results[i],
      });
    }

    const bestScore = results[0]?.weightedComposite ?? 0;
    const avgScore =
      results.reduce((s, r) => s + r.weightedComposite, 0) / results.length;

    iterations.push({
      iteration: iter,
      populationSize: population.length,
      bestScore,
      avgScore,
      survivorCount: Math.ceil(population.length * cfg.survivorRate),
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

    // ── Select survivors ────────────────────────────────────
    const survivorCount = Math.max(2, Math.ceil(population.length * cfg.survivorRate));
    const survivors = results.slice(0, survivorCount);
    const survivorConcepts = survivors.map((r) =>
      population.find((c) => c.id === r.conceptId)!
    ).filter(Boolean);

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
          // Same parent picked twice → mutate instead
          nextGen.push(mutate(a, seed, iter));
        }
      }
    } else {
      // Not enough survivors for recombination → fill with mutations
      for (let i = 0; i < recombCount; i++) {
        const parent = pickRandom(survivorConcepts);
        const seed = seeds.find((s) => s.opportunity_zone_id === parent.opportunity_zone_id) ?? pickRandom(seeds);
        nextGen.push(mutate(parent, seed, iter));
      }
    }

    // Fresh random for diversity
    for (let i = 0; i < freshCount; i++) {
      nextGen.push(generateFresh(pickRandom(seeds)));
    }

    population = nextGen;
  }

  // ── Select final outputs ──────────────────────────────────
  // De-duplicate by picking the best evaluation per unique feature fingerprint
  const seen = new Map<string, { concept: EvaluableConcept; evaluation: ConceptEvaluationResult }>();
  const sorted = allEvaluated.sort(
    (a, b) => b.evaluation.weightedComposite - a.evaluation.weightedComposite
  );

  for (const entry of sorted) {
    const fingerprint = JSON.stringify(entry.concept.structural_features);
    if (!seen.has(fingerprint)) {
      seen.set(fingerprint, entry);
    }
    if (seen.size >= cfg.finalOutputCount) break;
  }

  const finalConcepts = [...seen.values()].map((e) => ({
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
