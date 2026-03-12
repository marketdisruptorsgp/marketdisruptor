/**
 * CROSS-DOMAIN ANALOGY MATCHER
 *
 * Deterministic structural similarity scoring between a target business's
 * StructuralProfile and entries in the cross-domain analogy library.
 *
 * Zero latency, zero API cost. Runs client-side during strategy search.
 */

import type { StructuralProfile } from "@/lib/reconfiguration/structuralProfile";
import { CROSS_DOMAIN_ANALOGIES, type CrossDomainAnalogy } from "./analogyLibrary";
import type { StrategyCandidate, StrategyFeatures } from "./types";

// ═══════════════════════════════════════════════════════════════
//  STRUCTURAL SIMILARITY SCORING
// ═══════════════════════════════════════════════════════════════

const DIMENSION_WEIGHTS: Record<string, number> = {
  supplyFragmentation: 0.20,
  switchingCosts: 0.15,
  laborIntensity: 0.15,
  distributionControl: 0.15,
  revenueModel: 0.10,
  marginStructure: 0.10,
  customerConcentration: 0.08,
  assetUtilization: 0.07,
};

/**
 * Score how structurally similar a cross-domain analogy's constraint shape
 * is to the target business profile. Returns 0-1.
 */
function scoreAnalogyFit(analogy: CrossDomainAnalogy, profile: StructuralProfile): number {
  let matchWeight = 0;
  let totalWeight = 0;

  const shape = analogy.constraintShape;

  for (const [dim, weight] of Object.entries(DIMENSION_WEIGHTS)) {
    const analogyValue = shape[dim as keyof typeof shape];
    if (analogyValue === undefined) continue; // analogy doesn't constrain this dimension

    totalWeight += weight;
    const profileValue = profile[dim as keyof StructuralProfile];

    if (analogyValue === profileValue) {
      matchWeight += weight; // exact match
    } else if (isAdjacent(dim, analogyValue as string, profileValue as string)) {
      matchWeight += weight * 0.5; // adjacent value
    }
  }

  return totalWeight === 0 ? 0 : matchWeight / totalWeight;
}

/**
 * Check if two values on an ordinal scale are adjacent.
 */
function isAdjacent(dimension: string, a: string, b: string): boolean {
  const scales: Record<string, string[]> = {
    supplyFragmentation: ["consolidated", "moderate", "fragmented", "atomized"],
    switchingCosts: ["high", "moderate", "low", "none"],
    laborIntensity: ["automated", "mixed", "labor_heavy", "artisan"],
    distributionControl: ["owned", "shared", "intermediated", "no_control"],
    marginStructure: ["high_margin", "moderate_margin", "thin_margin", "negative_margin"],
    customerConcentration: ["diversified", "moderate", "concentrated", "single_customer"],
    assetUtilization: ["high", "moderate", "underutilized", "idle"],
  };

  const scale = scales[dimension];
  if (!scale) return false;

  const idxA = scale.indexOf(a);
  const idxB = scale.indexOf(b);
  if (idxA === -1 || idxB === -1) return false;

  return Math.abs(idxA - idxB) === 1;
}

// ═══════════════════════════════════════════════════════════════
//  MATCHING & CANDIDATE GENERATION
// ═══════════════════════════════════════════════════════════════

export interface MatchedAnalogy {
  analogy: CrossDomainAnalogy;
  similarityScore: number;
}

/**
 * Find top N cross-domain analogies that structurally match the target profile.
 * Returns sorted by similarity score (highest first).
 */
export function matchAnalogies(
  profile: StructuralProfile,
  maxResults: number = 6,
  minSimilarity: number = 0.3,
): MatchedAnalogy[] {
  return CROSS_DOMAIN_ANALOGIES
    .map(analogy => ({
      analogy,
      similarityScore: scoreAnalogyFit(analogy, profile),
    }))
    .filter(m => m.similarityScore >= minSimilarity)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, maxResults);
}

// ═══════════════════════════════════════════════════════════════
//  PATTERN → FEATURES MAPPING (mirrors generator.ts logic)
// ═══════════════════════════════════════════════════════════════

function patternToFamily(patternId: string): StrategyFeatures["patternFamily"] {
  const map: Record<string, StrategyFeatures["patternFamily"]> = {
    aggregation: "supply_side",
    unbundling: "supply_side",
    rebundling: "supply_side",
    supply_chain_relocation: "integration",
    stakeholder_monetization: "supply_side",
    infrastructure_abstraction: "supply_side",
    demand_reframing: "demand_side",
    outcome_pricing: "pricing",
    network_effect: "network",
    vertical_integration: "integration",
    regulatory_arbitrage: "timing",
    freemium_flip: "pricing",
    temporal_arbitrage: "timing",
    loss_leader_ecosystem: "pricing",
    data_moat: "network",
  };
  return map[patternId] ?? "supply_side";
}

function patternToRevenue(patternId: string): StrategyFeatures["revenueShift"] {
  const map: Record<string, StrategyFeatures["revenueShift"]> = {
    aggregation: "marketplace",
    outcome_pricing: "outcome",
    freemium_flip: "freemium",
    network_effect: "recurring",
    loss_leader_ecosystem: "ecosystem",
    stakeholder_monetization: "recurring",
    infrastructure_abstraction: "recurring",
  };
  return map[patternId] ?? "none";
}

function patternToMoat(patternId: string): StrategyFeatures["moatType"] {
  const map: Record<string, StrategyFeatures["moatType"]> = {
    network_effect: "network_effect",
    data_moat: "data",
    vertical_integration: "scale",
    regulatory_arbitrage: "regulatory",
    loss_leader_ecosystem: "switching_cost",
    demand_reframing: "brand",
  };
  return map[patternId] ?? "none";
}

function inferDistributionChange(patternId: string): StrategyFeatures["distributionChange"] {
  const map: Record<string, StrategyFeatures["distributionChange"]> = {
    supply_chain_relocation: "direct",
    aggregation: "platform",
    network_effect: "network",
    vertical_integration: "vertical",
    freemium_flip: "direct",
  };
  return map[patternId] ?? "none";
}

let _analogyCounter = 0;

/**
 * Convert matched analogies into StrategyCandidate objects
 * that can compete in the evolutionary search loop.
 */
export function analogiesToCandidates(
  matches: MatchedAnalogy[],
  profile: StructuralProfile,
): StrategyCandidate[] {
  if (profile.bindingConstraints.length === 0) return [];

  return matches.map(({ analogy, similarityScore }) => {
    // Pair with the most relevant binding constraint
    const bestConstraint = profile.bindingConstraints[0]; // highest-severity

    return {
      id: `analogy-${Date.now()}-${++_analogyCounter}`,
      constraintId: bestConstraint.constraintName,
      constraintName: bestConstraint.explanation,
      patternId: analogy.patternId,
      patternName: `${analogy.structuralPrimitive} (via ${analogy.company})`,
      mechanism: analogy.mechanism,
      operatorFit: profile.etaActive ? "eta" : "any",
      features: {
        constraintCategory: bestConstraint.constraintName.split("_")[0] ?? "general",
        patternFamily: patternToFamily(analogy.patternId),
        revenueShift: patternToRevenue(analogy.patternId),
        distributionChange: inferDistributionChange(analogy.patternId),
        moatType: patternToMoat(analogy.patternId),
        timeHorizon: "medium" as const,
      },
      sourceAnalogy: {
        company: analogy.company,
        industry: analogy.sourceIndustry,
        primitive: analogy.structuralPrimitive,
        similarityScore,
      },
    };
  });
}
