/**
 * STRATEGY SEARCH — Fast Deterministic Evaluator
 *
 * Scores strategy candidates without AI calls.
 * Three dimensions: structural fit, novelty, feasibility.
 */

import type { StructuralProfile } from "@/lib/reconfiguration/structuralProfile";
import type { StrategyCandidate, StrategyEvaluation, StrategyFeatures } from "./types";

// ═══════════════════════════════════════════════════════════════
//  STRUCTURAL FIT — Does this strategy match the profile?
// ═══════════════════════════════════════════════════════════════

function scoreStructuralFit(
  candidate: StrategyCandidate,
  profile: StructuralProfile,
): number {
  let score = 0.3; // Base — pattern already qualified

  // Constraint resolution bonus
  const constraintResolves = profile.bindingConstraints.some(
    c => c.constraintName === candidate.constraintId
  );
  if (constraintResolves) score += 0.2;

  // Pattern-profile alignment bonuses
  const f = candidate.features;

  // Revenue shift alignment
  if (f.revenueShift === "recurring" && profile.revenueModel === "project_based") score += 0.15;
  if (f.revenueShift === "outcome" && profile.laborIntensity === "labor_heavy") score += 0.15;
  if (f.revenueShift === "marketplace" && profile.supplyFragmentation !== "consolidated") score += 0.1;

  // Distribution alignment
  if (f.distributionChange === "direct" && profile.distributionControl === "intermediated") score += 0.15;
  if (f.distributionChange === "platform" && profile.supplyFragmentation !== "consolidated") score += 0.1;

  // Moat alignment
  if (f.moatType === "data" && profile.customerConcentration === "diversified") score += 0.1;
  if (f.moatType === "network_effect" && profile.switchingCosts === "low") score += 0.1;
  if (f.moatType === "switching_cost" && profile.switchingCosts === "none") score += 0.1;

  // ETA alignment
  if (candidate.operatorFit === "eta" && profile.etaActive) score += 0.1;

  return Math.min(1, score);
}

// ═══════════════════════════════════════════════════════════════
//  NOVELTY — How different is this from the current business?
// ═══════════════════════════════════════════════════════════════

function scoreNovelty(
  candidate: StrategyCandidate,
  profile: StructuralProfile,
): number {
  let novelty = 0;

  // Revenue model change
  if (candidate.features.revenueShift !== "none") {
    const currentModel = profile.revenueModel;
    if (candidate.features.revenueShift === "recurring" && currentModel !== "recurring") novelty += 0.25;
    if (candidate.features.revenueShift === "outcome") novelty += 0.3;
    if (candidate.features.revenueShift === "freemium") novelty += 0.25;
    if (candidate.features.revenueShift === "marketplace") novelty += 0.3;
    if (candidate.features.revenueShift === "ecosystem") novelty += 0.2;
  }

  // Distribution change
  if (candidate.features.distributionChange !== "none") novelty += 0.2;

  // Pattern family novelty — demand-side and timing patterns are more novel
  if (candidate.features.patternFamily === "demand_side") novelty += 0.2;
  if (candidate.features.patternFamily === "timing") novelty += 0.15;
  if (candidate.features.patternFamily === "network") novelty += 0.15;
  if (candidate.features.patternFamily === "pricing") novelty += 0.1;

  // Cross-domain analogy bonus — ideas from unrelated industries are inherently more novel
  if (candidate.sourceAnalogy) {
    novelty += 0.15;
  }

  return Math.min(1, novelty);
}

// ═══════════════════════════════════════════════════════════════
//  FEASIBILITY — Can this realistically be executed?
// ═══════════════════════════════════════════════════════════════

function scoreFeasibility(
  candidate: StrategyCandidate,
  profile: StructuralProfile,
): number {
  let feasibility = 0.6; // Base — assume moderately feasible

  // Penalties
  if (candidate.features.timeHorizon === "long") feasibility -= 0.15;
  if (profile.regulatorySensitivity === "heavy" && candidate.features.patternFamily !== "timing") feasibility -= 0.1;
  if (profile.laborIntensity === "artisan" && candidate.features.revenueShift === "marketplace") feasibility -= 0.15;

  // Bonuses
  if (candidate.features.timeHorizon === "immediate") feasibility += 0.15;
  if (candidate.features.timeHorizon === "short") feasibility += 0.1;
  if (profile.marginStructure === "high_margin") feasibility += 0.1; // Resources to invest
  if (profile.laborIntensity === "automated" || profile.laborIntensity === "mixed") feasibility += 0.05;

  // ETA bonuses
  if (profile.etaActive) {
    if (profile.improvementRunway === "transformative") feasibility += 0.1;
    if (profile.acquisitionComplexity === "turnkey") feasibility += 0.05;
    if (profile.ownerDependency === "owner_critical") feasibility -= 0.1;
  }

  return Math.max(0.1, Math.min(1, feasibility));
}

// ═══════════════════════════════════════════════════════════════
//  COMPOSITE EVALUATION
// ═══════════════════════════════════════════════════════════════

/**
 * Evaluate a batch of strategy candidates.
 * Weights: 40% structural fit, 30% novelty, 30% feasibility
 */
export function evaluateStrategies(
  candidates: StrategyCandidate[],
  profile: StructuralProfile,
): StrategyEvaluation[] {
  return candidates.map(c => {
    const structuralFit = scoreStructuralFit(c, profile);
    const novelty = scoreNovelty(c, profile);
    const feasibility = scoreFeasibility(c, profile);
    const composite = structuralFit * 0.4 + novelty * 0.3 + feasibility * 0.3;

    return {
      candidateId: c.id,
      structuralFit,
      novelty,
      feasibility,
      composite,
    };
  }).sort((a, b) => b.composite - a.composite);
}

// ═══════════════════════════════════════════════════════════════
//  DIVERSITY — Feature distance between strategies
// ═══════════════════════════════════════════════════════════════

const FEATURE_KEYS: (keyof StrategyFeatures)[] = [
  "constraintCategory",
  "patternFamily",
  "revenueShift",
  "distributionChange",
  "moatType",
  "timeHorizon",
];

const FEATURE_WEIGHTS: Record<keyof StrategyFeatures, number> = {
  constraintCategory: 0.15,
  patternFamily: 0.30,
  revenueShift: 0.20,
  distributionChange: 0.15,
  moatType: 0.15,
  timeHorizon: 0.05,
};

export function strategyDistance(a: StrategyFeatures, b: StrategyFeatures): number {
  let diff = 0;
  let totalWeight = 0;
  for (const key of FEATURE_KEYS) {
    const w = FEATURE_WEIGHTS[key];
    totalWeight += w;
    if (a[key] !== b[key]) diff += w;
  }
  return totalWeight === 0 ? 1 : diff / totalWeight;
}

/**
 * Select diverse survivors — top 50% by score, bottom 50% by max-min distance.
 */
export function selectDiverseSurvivors(
  candidates: StrategyCandidate[],
  evaluations: StrategyEvaluation[],
  count: number,
): StrategyCandidate[] {
  if (candidates.length <= count) return [...candidates];

  const evalMap = new Map(evaluations.map(e => [e.candidateId, e]));
  const sorted = [...candidates].sort(
    (a, b) => (evalMap.get(b.id)?.composite ?? 0) - (evalMap.get(a.id)?.composite ?? 0)
  );

  const eliteCount = Math.max(1, Math.ceil(count * 0.5));
  const selected = sorted.slice(0, eliteCount);
  const remaining = sorted.slice(eliteCount);

  // Fill rest with most diverse
  for (let i = selected.length; i < count && remaining.length > 0; i++) {
    let bestIdx = 0;
    let bestDist = -1;

    for (let j = 0; j < remaining.length; j++) {
      const minDist = Math.min(
        ...selected.map(s => strategyDistance(remaining[j].features, s.features))
      );
      const score = evalMap.get(remaining[j].id)?.composite ?? 0;
      const combined = minDist * 0.6 + score * 0.4;
      if (combined > bestDist) {
        bestDist = combined;
        bestIdx = j;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  return selected;
}

/**
 * Select diverse final output strategies.
 */
export function selectDiverseOutput(
  candidates: StrategyCandidate[],
  evaluations: StrategyEvaluation[],
  count: number,
  minDiversity: number = 0.2,
): (StrategyCandidate & { evaluation: StrategyEvaluation })[] {
  const evalMap = new Map(evaluations.map(e => [e.candidateId, e]));
  const sorted = [...candidates].sort(
    (a, b) => (evalMap.get(b.id)?.composite ?? 0) - (evalMap.get(a.id)?.composite ?? 0)
  );

  const result: (StrategyCandidate & { evaluation: StrategyEvaluation })[] = [];

  for (const candidate of sorted) {
    if (result.length >= count) break;

    const eval_ = evalMap.get(candidate.id);
    if (!eval_) continue;

    // Check diversity against already selected
    const tooSimilar = result.some(
      r => strategyDistance(r.features, candidate.features) < minDiversity
    );
    if (tooSimilar && result.length > 0 && sorted.length > count) continue;

    result.push({ ...candidate, evaluation: eval_ });
  }

  return result;
}
