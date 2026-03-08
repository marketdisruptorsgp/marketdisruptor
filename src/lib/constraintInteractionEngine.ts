/**
 * CONSTRAINT INTERACTION ENGINE — Stage 4c
 *
 * Evaluates pairs of active constraints to discover interaction
 * patterns: reinforcing, causal, or limiting relationships.
 *
 * Output: ConstraintInteraction objects that feed downstream
 * pattern matching and opportunity generation with multi-constraint
 * resolution patterns.
 */

import type { StrategicInsight } from "@/lib/strategicEngine";
import type { ConstraintHypothesisSet } from "@/lib/constraintDetectionEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type InteractionType = "reinforcing" | "causal" | "limiting";

export interface ConstraintInteraction {
  /** IDs of the two interacting constraints */
  constraintIds: [string, string];
  /** Labels for readability */
  constraintLabels: [string, string];
  /** How these constraints interact */
  interactionType: InteractionType;
  /** Strength of the interaction (0-1) */
  strength: number;
  /** Human explanation of the interaction */
  explanation: string;
  /** Candidate resolution patterns that typically address this pair */
  candidatePatterns: string[];
}

export interface ConstraintInteractionSet {
  interactions: ConstraintInteraction[];
  /** Total pairs evaluated */
  pairsEvaluated: number;
  /** Whether any reinforcing loops were found (high-value signal) */
  hasReinforcingLoops: boolean;
}

// ═══════════════════════════════════════════════════════════════
//  INTERACTION CATEGORY MAP
//  Maps constraint category pairs to expected interaction types
//  and candidate resolution patterns
// ═══════════════════════════════════════════════════════════════

interface InteractionRule {
  categories: [string, string];
  interactionType: InteractionType;
  explanation: string;
  candidatePatterns: string[];
}

const INTERACTION_RULES: InteractionRule[] = [
  // Reinforcing pairs — two constraints that amplify each other
  {
    categories: ["labor_operations", "revenue_pricing"],
    interactionType: "reinforcing",
    explanation: "Labor-intensive operations combined with pricing pressure create a margin squeeze — each makes the other harder to resolve",
    candidatePatterns: ["service_to_product", "manual_to_automated", "expert_to_guided"],
  },
  {
    categories: ["labor_operations", "structural_economic"],
    interactionType: "reinforcing",
    explanation: "Labor scaling constraints reinforce structural economic limitations — growth increases cost proportionally",
    candidatePatterns: ["manual_to_automated", "service_to_product", "closed_to_platform"],
  },
  {
    categories: ["supply_distribution", "market_adoption"],
    interactionType: "reinforcing",
    explanation: "Distribution fragmentation limits market reach, while adoption barriers reduce per-channel efficiency",
    candidatePatterns: ["fragmented_to_aggregated", "intermediated_to_direct", "centralized_to_distributed"],
  },
  {
    categories: ["revenue_pricing", "demand"],
    interactionType: "reinforcing",
    explanation: "Pricing constraints and demand barriers reinforce each other — customers can't see value and pricing can't communicate it",
    candidatePatterns: ["fixed_to_usage", "ownership_to_access", "complex_to_simplified"],
  },
  {
    categories: ["technology_information", "labor_operations"],
    interactionType: "reinforcing",
    explanation: "Legacy technology forces manual workarounds, which entrench the technology further",
    candidatePatterns: ["analog_to_digital_twin", "manual_to_automated", "reactive_to_predictive"],
  },

  // Causal pairs — one constraint causes or worsens the other
  {
    categories: ["labor_operations", "supply_distribution"],
    interactionType: "causal",
    explanation: "Operational bottlenecks create supply/distribution constraints — fixing upstream labor issues may resolve downstream distribution",
    candidatePatterns: ["service_to_product", "synchronous_to_async", "inventory_to_on_demand"],
  },
  {
    categories: ["technology_information", "market_adoption"],
    interactionType: "causal",
    explanation: "Technology limitations cause market adoption barriers — customers can't use what technology can't deliver",
    candidatePatterns: ["analog_to_digital_twin", "complex_to_simplified", "expert_to_guided"],
  },
  {
    categories: ["structural_economic", "revenue_pricing"],
    interactionType: "causal",
    explanation: "Structural cost pressure forces pricing compromises that further erode margins",
    candidatePatterns: ["linear_to_circular", "single_use_to_multi_use", "onetime_to_recurring"],
  },
  {
    categories: ["demand", "structural_economic"],
    interactionType: "causal",
    explanation: "Demand constraints reduce volume which worsens unit economics in the structural model",
    candidatePatterns: ["ownership_to_access", "individual_to_community", "bundled_to_unbundled"],
  },

  // Limiting pairs — one constraint limits the effectiveness of solving the other
  {
    categories: ["market_adoption", "revenue_pricing"],
    interactionType: "limiting",
    explanation: "Market adoption barriers limit the upside of pricing model changes — even better pricing won't help if customers can't adopt",
    candidatePatterns: ["complex_to_simplified", "expert_to_guided", "fixed_to_usage"],
  },
  {
    categories: ["supply_distribution", "technology_information"],
    interactionType: "limiting",
    explanation: "Distribution constraints limit the impact of technology improvements — better tech can't reach customers through broken channels",
    candidatePatterns: ["intermediated_to_direct", "centralized_to_distributed", "closed_to_platform"],
  },
];

// ═══════════════════════════════════════════════════════════════
//  EVIDENCE OVERLAP ANALYSIS
// ═══════════════════════════════════════════════════════════════

function computeEvidenceOverlap(a: StrategicInsight, b: StrategicInsight): number {
  const setA = new Set(a.evidenceIds);
  const overlap = b.evidenceIds.filter(id => setA.has(id)).length;
  const union = new Set([...a.evidenceIds, ...b.evidenceIds]).size;
  return union > 0 ? overlap / union : 0;
}

function extractConstraintCategory(constraint: StrategicInsight): string | null {
  // Try to extract from hypothesis metadata in description
  const idMatch = constraint.description.match(/\[(C-([A-Z]+)-\d+):/);
  if (idMatch) {
    const prefix = idMatch[2];
    const prefixMap: Record<string, string> = {
      LAB: "labor_operations",
      REV: "revenue_pricing",
      SUP: "supply_distribution",
      TEC: "technology_information",
      MKT: "market_adoption",
      STR: "structural_economic",
      DEM: "demand",
    };
    return prefixMap[prefix] || null;
  }

  // Fall back to keyword analysis
  const text = `${constraint.label} ${constraint.description}`.toLowerCase();
  if (/labor|workforce|headcount|manual|bottleneck|skill/.test(text)) return "labor_operations";
  if (/pric|revenue|margin|cost|commodit/.test(text)) return "revenue_pricing";
  if (/supply|distribut|channel|inventor|geograph|capacity/.test(text)) return "supply_distribution";
  if (/tech|legacy|digital|data|analog|information/.test(text)) return "technology_information";
  if (/market|adopt|trust|switch|expert|regulat/.test(text)) return "market_adoption";
  if (/structur|scale|linear|asset|vendor/.test(text)) return "structural_economic";
  if (/demand|awareness|access|motivation|perceived/.test(text)) return "demand";
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN: DISCOVER CONSTRAINT INTERACTIONS
// ═══════════════════════════════════════════════════════════════

export function discoverConstraintInteractions(
  activeConstraints: StrategicInsight[],
  hypotheses: ConstraintHypothesisSet | null,
): ConstraintInteractionSet {
  const interactions: ConstraintInteraction[] = [];
  let pairsEvaluated = 0;

  if (activeConstraints.length < 2) {
    return { interactions: [], pairsEvaluated: 0, hasReinforcingLoops: false };
  }

  // Evaluate all pairs
  for (let i = 0; i < activeConstraints.length; i++) {
    for (let j = i + 1; j < activeConstraints.length; j++) {
      pairsEvaluated++;
      const a = activeConstraints[i];
      const b = activeConstraints[j];

      const catA = extractConstraintCategory(a);
      const catB = extractConstraintCategory(b);

      // Evidence overlap indicates potential interaction
      const evidenceOverlap = computeEvidenceOverlap(a, b);

      // Check against known interaction rules
      let matchedRule: InteractionRule | null = null;
      if (catA && catB) {
        matchedRule = INTERACTION_RULES.find(
          r =>
            (r.categories[0] === catA && r.categories[1] === catB) ||
            (r.categories[0] === catB && r.categories[1] === catA)
        ) || null;
      }

      // Determine interaction
      if (matchedRule || evidenceOverlap >= 0.15) {
        const interactionType: InteractionType = matchedRule?.interactionType
          ?? (evidenceOverlap >= 0.3 ? "reinforcing" : "causal");

        const strength = matchedRule
          ? Math.min(1, 0.5 + evidenceOverlap * 2)
          : evidenceOverlap;

        const explanation = matchedRule?.explanation
          ?? `Constraints share ${Math.round(evidenceOverlap * 100)}% evidence overlap, suggesting a ${interactionType} relationship`;

        const candidatePatterns = matchedRule?.candidatePatterns ?? [];

        interactions.push({
          constraintIds: [a.id, b.id],
          constraintLabels: [a.label, b.label],
          interactionType,
          strength,
          explanation,
          candidatePatterns,
        });
      }
    }
  }

  // Sort by strength descending
  interactions.sort((a, b) => b.strength - a.strength);

  return {
    interactions,
    pairsEvaluated,
    hasReinforcingLoops: interactions.some(i => i.interactionType === "reinforcing"),
  };
}
