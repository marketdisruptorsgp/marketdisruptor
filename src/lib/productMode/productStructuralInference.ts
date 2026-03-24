/**
 * PRODUCT MODE STRUCTURAL INFERENCE
 *
 * Mode-specific structural profile inference for physical product analyses.
 * Maps evidence about durability, repairability, supply chain, and pricing
 * to product-relevant structural facets.
 *
 * Key guarantee: never returns service-specific facets such as
 * labor_intensity, owner_dependency, or billable_hours.
 */

import type { Evidence } from "@/lib/evidenceEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type RiskLevel = "high" | "moderate" | "low" | "none";

export interface ProductFacetProfile {
  /** Risk that the product's features become indistinguishable from cheaper alternatives */
  feature_commoditization: RiskLevel;
  /** Risk that physical durability defects erode brand trust */
  durability_risk: RiskLevel;
  /** Friction customers face when trying to repair or service the product */
  repairability_friction: RiskLevel;
  /** Pressure on unit economics from COGS, manufacturing, or pricing */
  unit_economics_pressure: RiskLevel;
  /** Vulnerability to supply chain disruption, single-source dependencies, or input cost volatility */
  supply_chain_risk: RiskLevel;
}

// ═══════════════════════════════════════════════════════════════
//  KEYWORD PATTERNS
// ═══════════════════════════════════════════════════════════════

const DURABILITY_SIGNALS = /flak|peel|crack|break|snap|worn|deteriorat|chip|rust|corrode|fall\s*apart|poor\s*quality|cheap\s*feel|build\s*quality|durabilit|last|longevit|wear/gi;

const REPAIRABILITY_SIGNALS = /repair|replac|parts\s*not\s*availabl|hard\s*to\s*fix|no\s*spare|proprietary\s*screw|glued\s*shut|non.?serviceable|right\s*to\s*repair|service\s*center|warranty\s*void/gi;

const COMMODITIZATION_SIGNALS = /feature\s*parity|same\s*as|competitor|cheaper\s*alternative|commodity|no\s*different|identical|generic\s*version|white.?label|knockoff|clone/gi;

const UNIT_ECON_SIGNALS = /margin|cogs|cost\s*of\s*goods|manufacturing\s*cost|bill\s*of\s*materials|bom|overhead|pricing\s*pressure|underpriced|overpriced|retail\s*price|wholesale|mark.?up/gi;

const SUPPLY_CHAIN_SIGNALS = /supply\s*chain|single\s*source|sole\s*supplier|vendor\s*concentration|out\s*of\s*stock|stockout|lead\s*time|sourcing|procurement|import|tariff|component\s*shortage/gi;

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function countMatches(corpus: string, pattern: RegExp): number {
  // Reset lastIndex since we're reusing global regexes across calls
  pattern.lastIndex = 0;
  return (corpus.match(pattern) ?? []).length;
}

function scoreToLevel(count: number): RiskLevel {
  if (count >= 4) return "high";
  if (count >= 2) return "moderate";
  if (count >= 1) return "low";
  return "none";
}

// ═══════════════════════════════════════════════════════════════
//  MAIN INFERENCE FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Infer a product-mode structural profile from the evidence corpus.
 *
 * Only maps evidence to product-relevant dimensions.
 * Never produces service-mode facets (labor_intensity, owner_dependency, billable_hours).
 *
 * @param evidence - Array of evidence items extracted from the product analysis
 * @param _product - Product context (reserved for future category-specific weighting)
 */
export function inferProductStructuralProfile(
  evidence: Evidence[],
  _product?: unknown,
): ProductFacetProfile {
  const corpus = evidence
    .map(e => `${e.label ?? ""} ${e.description ?? ""}`)
    .join(" ");

  return {
    feature_commoditization: scoreToLevel(countMatches(corpus, COMMODITIZATION_SIGNALS)),
    durability_risk: scoreToLevel(countMatches(corpus, DURABILITY_SIGNALS)),
    repairability_friction: scoreToLevel(countMatches(corpus, REPAIRABILITY_SIGNALS)),
    unit_economics_pressure: scoreToLevel(countMatches(corpus, UNIT_ECON_SIGNALS)),
    supply_chain_risk: scoreToLevel(countMatches(corpus, SUPPLY_CHAIN_SIGNALS)),
  };
}

// ═══════════════════════════════════════════════════════════════
//  BINDING CONSTRAINT SELECTION
// ═══════════════════════════════════════════════════════════════

/** Ordered list of product-mode constraint names, from most to least structurally critical */
const PRODUCT_CONSTRAINT_PRIORITY: (keyof ProductFacetProfile)[] = [
  "durability_risk",
  "repairability_friction",
  "supply_chain_risk",
  "unit_economics_pressure",
  "feature_commoditization",
];

/**
 * Select 2–4 binding constraints from the product facet profile.
 *
 * Only returns product-relevant constraint names.
 * Never returns labor_intensity, owner_dependency, or other service-mode constraints.
 *
 * @param profile - Product facet profile from `inferProductStructuralProfile`
 * @param _evidence - Evidence array (reserved for tie-breaking by evidence density)
 */
export function selectProductBindingConstraints(
  profile: ProductFacetProfile,
  _evidence?: Evidence[],
): string[] {
  const active = PRODUCT_CONSTRAINT_PRIORITY.filter(key => {
    const level = profile[key];
    return level === "high" || level === "moderate";
  });

  if (active.length >= 2) return active.slice(0, 4);

  // Promote "low" signals to reach at least 2 constraints
  const low = PRODUCT_CONSTRAINT_PRIORITY.filter(
    key => profile[key] === "low" && !active.includes(key),
  );
  const combined = [...active, ...low];
  if (combined.length >= 2) return combined.slice(0, 4);

  // Last resort: fill from the priority list regardless of signal level
  const fallback = PRODUCT_CONSTRAINT_PRIORITY.filter(key => !combined.includes(key));
  return [...combined, ...fallback].slice(0, 4);
}
