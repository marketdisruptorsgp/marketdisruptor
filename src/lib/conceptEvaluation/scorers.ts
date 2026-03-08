/**
 * Concept Evaluation Engine — Scoring Functions
 *
 * Four deterministic scoring dimensions:
 *   1. Structural Alignment
 *   2. Analog Feasibility (Jaccard + outcome weights)
 *   3. Market Potential (TAM + competition modifier)
 *   4. Novelty (adjacent innovation band)
 *
 * Plus execution complexity penalty.
 */

import type {
  StructuralFeatures,
  EvaluableConcept,
  EvaluableZone,
  EvaluableMarketSignals,
  EvaluableAnalog,
  EvaluablePriorConcept,
  MarketContext,
  StructuralEvaluation,
  FeasibilityEvaluation,
  MarketEvaluation,
  NoveltyEvaluation,
  AnalogMatch,
  PriorArtMatch,
  OUTCOME_WEIGHTS as OutcomeWeightsType,
} from "./types";
import { OUTCOME_WEIGHTS } from "./types";

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

const FEATURE_KEYS: (keyof StructuralFeatures)[] = [
  "function",
  "customer",
  "workflow_stage",
  "pricing_model",
  "distribution",
  "regulatory_class",
];

function jaccardSimilarity(a: StructuralFeatures, b: StructuralFeatures): number {
  let matches = 0;
  let total = 0;
  for (const key of FEATURE_KEYS) {
    const va = a[key];
    const vb = b[key];
    if (!va && !vb) continue; // both empty → skip
    total++;
    if (va && vb && va.toLowerCase() === vb.toLowerCase()) matches++;
  }
  return total === 0 ? 0 : matches / total;
}

// ═══════════════════════════════════════════════════════════════
//  1. STRUCTURAL ALIGNMENT
// ═══════════════════════════════════════════════════════════════

export function scoreStructuralAlignment(
  _concept: EvaluableConcept,
  zone: EvaluableZone | null | undefined,
  marketSignals: EvaluableMarketSignals | null | undefined
): StructuralEvaluation {
  if (!zone || !marketSignals) {
    return { score: 0.3, confidence: 0.1, matchedSignals: 0, totalSignals: 0 };
  }

  const contributing = zone.contributing_signals ?? {};
  const signalKeys = Object.keys(contributing);
  if (signalKeys.length === 0) {
    return { score: zone.signal_strength * 0.5, confidence: 0.2, matchedSignals: 0, totalSignals: 0 };
  }

  const signalMap: Record<string, number | null> = {
    fragmentation: marketSignals.fragmentation_index,
    margin_concentration: marketSignals.margin_distribution,
    margin_distribution: marketSignals.margin_distribution,
    outdated_pricing_model: marketSignals.pricing_model_age,
    pricing_model_age: marketSignals.pricing_model_age,
    productizable_service: marketSignals.productizability_score,
    productizability: marketSignals.productizability_score,
    manual_workflow_prevalence: marketSignals.productizability_score,
    asset_heavy_incumbents: marketSignals.asset_intensity_score,
    asset_intensity: marketSignals.asset_intensity_score,
    aging_ownership: marketSignals.ownership_demographics_score,
    ownership_demographics: marketSignals.ownership_demographics_score,
    distribution_bottleneck: marketSignals.distribution_control_score,
    distribution_control_point: marketSignals.distribution_control_score,
    distribution_control: marketSignals.distribution_control_score,
  };

  const THRESHOLD = 0.3;
  let matched = 0;
  let evidenceBackingCount = 0;

  for (const key of signalKeys) {
    const val = signalMap[key] ?? null;
    if (val !== null && val >= THRESHOLD) {
      matched++;
      evidenceBackingCount += Math.ceil(val * 5); // rough proxy
    }
  }

  const score = (matched / signalKeys.length) * zone.signal_strength;
  const confidence = Math.min(1, evidenceBackingCount / (signalKeys.length * 3));

  return {
    score: Math.min(1, score),
    confidence: Math.min(1, confidence),
    matchedSignals: matched,
    totalSignals: signalKeys.length,
  };
}

// ═══════════════════════════════════════════════════════════════
//  2. ANALOG FEASIBILITY
// ═══════════════════════════════════════════════════════════════

export function scoreAnalogFeasibility(
  concept: EvaluableConcept,
  analogs: EvaluableAnalog[]
): FeasibilityEvaluation {
  if (analogs.length === 0) {
    return { score: 0.3, confidence: 0.05, nearestAnalogs: [] };
  }

  // Filter to same domain if possible, fall back to all
  const domainAnalogs = concept.domain
    ? analogs.filter(
        (a) => a.domain?.toLowerCase() === concept.domain?.toLowerCase()
      )
    : [];
  const pool = domainAnalogs.length >= 2 ? domainAnalogs : analogs;

  const scored: AnalogMatch[] = pool
    .map((a) => ({
      analogId: a.id,
      name: a.name,
      similarity: jaccardSimilarity(concept.structural_features, a.structural_features),
      outcome: a.outcome || "unknown",
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const top3 = scored.slice(0, 3);

  // Score: avg(similarity × outcome_weight), clamped 0-1
  const rawScores = top3.map((m) => {
    const ow = OUTCOME_WEIGHTS[m.outcome] ?? 0.5;
    return m.similarity * ow;
  });

  const avgScore = rawScores.length > 0
    ? rawScores.reduce((s, v) => s + v, 0) / rawScores.length
    : 0;

  // Clamp to 0-1 (failed analogs can push negative)
  const score = Math.max(0, Math.min(1, avgScore));

  // Confidence based on analog density
  const matchedCount = scored.filter((s) => s.similarity >= 0.2).length;
  const confidence = Math.min(1, matchedCount / 5);

  return { score, confidence, nearestAnalogs: top3 };
}

// ═══════════════════════════════════════════════════════════════
//  3. MARKET POTENTIAL
// ═══════════════════════════════════════════════════════════════

function parseTamValue(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[,$\s]/g, "").toLowerCase();
  const multipliers: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*([kmbt])?/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const mult = match[2] ? multipliers[match[2]] ?? 1 : 1;
  return num * mult;
}

function tamToScore(tam: number | null): number {
  if (tam === null) return 0.3; // unknown → neutral
  if (tam < 10e6) return 0.2;
  if (tam < 100e6) return 0.4;
  if (tam < 1e9) return 0.7;
  return 0.9;
}

export function scoreMarketPotential(
  _concept: EvaluableConcept,
  marketContext: MarketContext | null | undefined,
  analogs: EvaluableAnalog[]
): MarketEvaluation {
  const tamParsed = parseTamValue(marketContext?.market_size_estimate);

  const demandValues = marketContext?.demand_evidence_values ?? [];
  const tamLow = demandValues.length > 0 ? Math.min(...demandValues) : tamParsed;
  const tamHigh = tamParsed ?? (demandValues.length > 0 ? Math.max(...demandValues) : null);

  const baseScore = tamToScore(tamHigh);

  let tamBasis = "No direct TAM data available";
  if (tamParsed !== null) {
    tamBasis = `Market size estimate: ${marketContext?.market_size_estimate}`;
  } else if (demandValues.length > 0) {
    tamBasis = `Extrapolated from ${demandValues.length} demand evidence signals`;
  }

  // Competition density modifier
  const competitorCount = marketContext?.competitor_count ?? 0;
  const analogDensity = analogs.length;
  const density = competitorCount + analogDensity * 0.5;
  const competitionModifier = 1 / (1 + density * 0.1);

  const score = Math.min(1, baseScore * competitionModifier);
  const confidence = tamParsed !== null ? 0.7 : demandValues.length > 0 ? 0.4 : 0.15;

  return {
    score,
    confidence,
    tamLow: tamLow ?? null,
    tamHigh: tamHigh ?? null,
    tamBasis,
    competitionModifier: Math.round(competitionModifier * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════════
//  4. NOVELTY (adjacent innovation band)
// ═══════════════════════════════════════════════════════════════

export function scoreNovelty(
  concept: EvaluableConcept,
  priorConcepts: EvaluablePriorConcept[],
  analogs: EvaluableAnalog[]
): NoveltyEvaluation {
  const priorArt: PriorArtMatch[] = [];

  // Compare against prior concepts in same domain
  const domainConcepts = concept.domain
    ? priorConcepts.filter((c) => c.domain?.toLowerCase() === concept.domain?.toLowerCase())
    : priorConcepts;

  for (const pc of domainConcepts) {
    const sim = jaccardSimilarity(concept.structural_features, pc.structural_features);
    priorArt.push({ id: pc.id, name: pc.title, distance: 1 - sim, source: "concept" });
  }

  // Compare against analogs in same domain
  const domainAnalogs = concept.domain
    ? analogs.filter((a) => a.domain?.toLowerCase() === concept.domain?.toLowerCase())
    : analogs;

  for (const a of domainAnalogs) {
    const sim = jaccardSimilarity(concept.structural_features, a.structural_features);
    priorArt.push({ id: a.id, name: a.name, distance: 1 - sim, source: "analog" });
  }

  priorArt.sort((a, b) => a.distance - b.distance);
  const nearest = priorArt.slice(0, 5);
  const minDistance = nearest.length > 0 ? nearest[0].distance : 1;

  // Adjacent innovation band: sweet spot at 0.35-0.65 distance
  // Peak score at ~0.5 distance, drops for both extremes
  let score: number;
  if (minDistance < 0.15) {
    // Too similar — low novelty
    score = minDistance / 0.15 * 0.3;
  } else if (minDistance <= 0.35) {
    // Approaching sweet spot
    score = 0.3 + ((minDistance - 0.15) / 0.20) * 0.5;
  } else if (minDistance <= 0.65) {
    // Sweet spot — adjacent innovation
    score = 0.8 + ((0.5 - Math.abs(minDistance - 0.5)) / 0.15) * 0.2;
  } else {
    // Very novel — diminishing returns, lower confidence
    score = 0.7 - (minDistance - 0.65) * 0.5;
  }
  score = Math.max(0, Math.min(1, score));

  // Confidence: high novelty = low confidence, moderate novelty = high confidence
  const confidence = minDistance > 0.8 ? 0.2 : minDistance < 0.1 ? 0.9 : 0.5 + (1 - Math.abs(minDistance - 0.4)) * 0.4;

  return {
    score,
    confidence: Math.min(1, Math.max(0, confidence)),
    nearestPriorArt: nearest,
    rawDistance: minDistance,
  };
}

// ═══════════════════════════════════════════════════════════════
//  EXECUTION COMPLEXITY PENALTY
// ═══════════════════════════════════════════════════════════════

const REGULATORY_PENALTY: Record<string, number> = {
  heavy: 0.12,
  moderate: 0.05,
  light: 0.02,
  unregulated: 0,
};

const CAPITAL_PENALTY: Record<string, number> = {
  high: 0.10,
  moderate: 0.04,
  low: 0,
};

export function computeExecutionPenalty(features: StructuralFeatures): number {
  const regPenalty = REGULATORY_PENALTY[features.regulatory_class ?? ""] ?? 0;
  const capPenalty = CAPITAL_PENALTY[features.capital_intensity ?? ""] ?? 0;
  return regPenalty + capPenalty;
}
