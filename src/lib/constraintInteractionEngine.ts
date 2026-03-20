/**
 * CONSTRAINT INTERACTION ENGINE — Stage 4c
 *
 * Evaluates pairs of active constraints to discover interaction
 * patterns: reinforcing, causal, or limiting relationships.
 *
 * Output: ConstraintInteraction objects that feed downstream
 * pattern matching and opportunity generation with multi-constraint
 * resolution patterns.
 *
 * PR #20 upgrade:
 * - Dimension-dimension constraint matrix: a structural profile interaction
 *   table that maps EVERY pair of active dimensions and surfaces the binding
 *   constraint logic via pairwise interaction, not just dimension value lookup.
 */

import type { StrategicInsight } from "@/lib/strategicEngine";
import type { ConstraintHypothesisSet } from "@/lib/constraintDetectionEngine";
import type { BusinessDimension, EvidenceCategory } from "@/lib/opportunityDesignEngine";

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
//  CATEGORY GROUPING — Reduces O(N²) to O(group pairs)
// ═══════════════════════════════════════════════════════════════

/** Categories that are "related" and should be evaluated against each other */
const RELATED_CATEGORY_GROUPS: string[][] = [
  ["labor_operations", "revenue_pricing", "structural_economic"],
  ["supply_distribution", "market_adoption", "demand"],
  ["technology_information", "labor_operations", "market_adoption"],
  ["revenue_pricing", "demand", "market_adoption"],
];

function getRelatedCategories(category: string): Set<string> {
  const related = new Set<string>([category]);
  for (const group of RELATED_CATEGORY_GROUPS) {
    if (group.includes(category)) {
      group.forEach(c => related.add(c));
    }
  }
  return related;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN: DISCOVER CONSTRAINT INTERACTIONS
//  Groups constraints by category first, then evaluates pairs
//  only within related groups to avoid O(N²) over all constraints.
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

  // Categorize all constraints
  const categorized = activeConstraints.map(c => ({
    constraint: c,
    category: extractConstraintCategory(c),
  }));

  // Build category → constraint index
  const byCat = new Map<string, typeof categorized>();
  for (const entry of categorized) {
    const cat = entry.category ?? "unknown";
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(entry);
  }

  // Track evaluated pairs to avoid duplicates
  const evaluatedPairs = new Set<string>();

  function pairKey(a: string, b: string): string {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  // Evaluate pairs within related category groups
  for (const entry of categorized) {
    const catA = entry.category ?? "unknown";
    const relatedCats = getRelatedCategories(catA);

    for (const relCat of relatedCats) {
      const candidates = byCat.get(relCat) ?? [];
      for (const candidate of candidates) {
        if (candidate.constraint.id === entry.constraint.id) continue;
        const pk = pairKey(entry.constraint.id, candidate.constraint.id);
        if (evaluatedPairs.has(pk)) continue;
        evaluatedPairs.add(pk);
        pairsEvaluated++;

        const a = entry.constraint;
        const b = candidate.constraint;
        const catB = candidate.category;

        // Evidence overlap
        const evidenceOverlap = computeEvidenceOverlap(a, b);

        // Check interaction rules
        let matchedRule: InteractionRule | null = null;
        if (catA && catB) {
          matchedRule = INTERACTION_RULES.find(
            r =>
              (r.categories[0] === catA && r.categories[1] === catB) ||
              (r.categories[0] === catB && r.categories[1] === catA)
          ) || null;
        }

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
  }

  // Sort by strength descending
  interactions.sort((a, b) => b.strength - a.strength);

  return {
    interactions,
    pairsEvaluated,
    hasReinforcingLoops: interactions.some(i => i.interactionType === "reinforcing"),
  };
}

// ═══════════════════════════════════════════════════════════════
//  PR #20 — DIMENSION-DIMENSION CONSTRAINT MATRIX
//
//  Builds a structural profile interaction table: a square matrix
//  where each cell represents how two morphological dimensions interact
//  at the constraint level.
//
//  This surfaces actual BINDING CONSTRAINT LOGIC via pairwise analysis,
//  not just dimension value lookup. Each cell answers:
//  "When dimension A is constrained AND dimension B is constrained,
//   what is the combined effect on the system?"
// ═══════════════════════════════════════════════════════════════

export type DimensionBindingType =
  | "amplifying"     // Both constraints worsen each other (super-additive)
  | "neutralizing"   // Resolving one reduces the other's severity
  | "sequential"     // One must be resolved before the other (dependency)
  | "independent"    // Constraints exist independently, no interaction
  | "competing";     // Resolving one makes the other harder to resolve

export interface DimensionPairInteraction {
  /** First dimension in the pair */
  dimA: { id: string; name: string; category: EvidenceCategory };
  /** Second dimension in the pair */
  dimB: { id: string; name: string; category: EvidenceCategory };
  /** How these dimension-level constraints interact */
  bindingType: DimensionBindingType;
  /** Combined binding strength when both are active (0-1) */
  combinedBindingStrength: number;
  /** Explanation of the combined constraint effect */
  combinedEffectExplanation: string;
  /**
   * Which constraint should be addressed first?
   * null = either can be addressed independently
   */
  resolutionPriority: "dimA_first" | "dimB_first" | "simultaneous" | null;
  /** Evidence-backed: is this interaction observed in the data? */
  isEvidenceBacked: boolean;
}

export interface DimensionConstraintMatrix {
  /** All pairwise dimension interactions */
  pairs: DimensionPairInteraction[];
  /** The pair with the highest combined binding strength (the true bottleneck) */
  bindingPair: DimensionPairInteraction | null;
  /** Total dimension pairs evaluated */
  totalPairs: number;
  /** Amplifying pairs — indicate super-additive constraint pressure */
  amplifyingPairs: DimensionPairInteraction[];
  /** Neutralizing pairs — resolving one eases the other */
  neutralizingPairs: DimensionPairInteraction[];
}

// ─── Category Interaction Rules for Dimension Matrix ─────────────────────────

interface DimensionInteractionRule {
  catA: EvidenceCategory;
  catB: EvidenceCategory;
  bindingType: DimensionBindingType;
  combinedEffectExplanation: string;
  resolutionPriority: "dimA_first" | "dimB_first" | "simultaneous" | null;
  baseStrengthMultiplier: number; // applied to average constraint strength
}

const DIMENSION_INTERACTION_RULES: DimensionInteractionRule[] = [
  // Amplifying pairs — super-additive constraint pressure
  {
    catA: "cost_structure",
    catB: "pricing_model",
    bindingType: "amplifying",
    combinedEffectExplanation: "High cost structure constrains pricing power, while pricing pressure prevents the margin headroom needed to reduce costs — a self-reinforcing trap that deepens without a structural break",
    resolutionPriority: "simultaneous",
    baseStrengthMultiplier: 1.5,
  },
  {
    catA: "operational_dependency",
    catB: "demand_signal",
    bindingType: "amplifying",
    combinedEffectExplanation: "Operational constraints limit delivery capacity while demand signals show unmet need — the system cannot capture available demand because operations are the bottleneck",
    resolutionPriority: "dimA_first",
    baseStrengthMultiplier: 1.4,
  },
  {
    catA: "distribution_channel",
    catB: "customer_behavior",
    bindingType: "amplifying",
    combinedEffectExplanation: "Channel constraints limit reach while customer behavior shows reluctance to switch or discover — acquisition is doubly constrained by both supply-side channel and demand-side inertia",
    resolutionPriority: "simultaneous",
    baseStrengthMultiplier: 1.3,
  },
  {
    catA: "technology_dependency",
    catB: "operational_dependency",
    bindingType: "amplifying",
    combinedEffectExplanation: "Legacy technology forces manual operational workarounds, which entrench the technology dependency further — each prevents the other from being resolved",
    resolutionPriority: "dimA_first",
    baseStrengthMultiplier: 1.4,
  },

  // Neutralizing pairs — resolving one eases the other
  {
    catA: "pricing_model",
    catB: "customer_behavior",
    bindingType: "neutralizing",
    combinedEffectExplanation: "Improving the pricing model (e.g., shifting to subscription or outcome-based) directly reduces the customer behavior barrier — customers adopt more readily when pricing aligns with their usage patterns",
    resolutionPriority: "dimA_first",
    baseStrengthMultiplier: 0.8,
  },
  {
    catA: "technology_dependency",
    catB: "distribution_channel",
    bindingType: "neutralizing",
    combinedEffectExplanation: "Resolving technology constraints enables new digital distribution channels — technology and distribution are linked, so tech improvement unlocks channel expansion",
    resolutionPriority: "dimA_first",
    baseStrengthMultiplier: 0.85,
  },
  {
    catA: "demand_signal",
    catB: "competitive_pressure",
    bindingType: "neutralizing",
    combinedEffectExplanation: "Strong demand signals offset competitive pressure — when demand is clearly evidenced, competitive intensity matters less because the market is growing, not zero-sum",
    resolutionPriority: "simultaneous",
    baseStrengthMultiplier: 0.7,
  },

  // Sequential pairs — dependency ordering
  {
    catA: "operational_dependency",
    catB: "distribution_channel",
    bindingType: "sequential",
    combinedEffectExplanation: "Operational capacity must be resolved before distribution expansion can succeed — expanding channels before operations are scalable creates fulfillment failures that damage brand and customer retention",
    resolutionPriority: "dimA_first",
    baseStrengthMultiplier: 1.1,
  },
  {
    catA: "technology_dependency",
    catB: "competitive_pressure",
    bindingType: "sequential",
    combinedEffectExplanation: "Technology gaps must be closed before competitive repositioning can succeed — competing without closing the technology gap creates a defensibility problem that undermines new positioning",
    resolutionPriority: "dimA_first",
    baseStrengthMultiplier: 1.0,
  },

  // Competing pairs — resolving one makes the other harder
  {
    catA: "cost_structure",
    catB: "customer_behavior",
    bindingType: "competing",
    combinedEffectExplanation: "Reducing costs often requires operational standardization that reduces the flexibility customers expect — cost efficiency and customer behavior customization are structurally competing priorities",
    resolutionPriority: null,
    baseStrengthMultiplier: 1.2,
  },
  {
    catA: "pricing_model",
    catB: "competitive_pressure",
    bindingType: "competing",
    combinedEffectExplanation: "Raising prices to improve margins intensifies competitive pressure as price-sensitive customers defect — price increases and competitive positioning must be sequenced carefully",
    resolutionPriority: "simultaneous",
    baseStrengthMultiplier: 1.1,
  },
];

/**
 * Build the dimension-dimension constraint matrix for a structural profile.
 *
 * PR #20 requirement: surfaces actual binding constraint logic via pairwise
 * interaction, not just dimension value lookup.
 *
 * @param activeDimensions  All active dimensions from the morphological baseline
 * @param constraints       Active constraints from the strategic engine
 * @returns Full dimension-dimension interaction matrix
 */
export function buildDimensionConstraintMatrix(
  activeDimensions: BusinessDimension[],
  constraints: StrategicInsight[],
): DimensionConstraintMatrix {
  const pairs: DimensionPairInteraction[] = [];

  // Build constraint strength map per evidence ID
  const evidenceConstraintMap = new Map<string, number>();
  for (const c of constraints) {
    const strength = c.impact * (c.confidenceScore ?? (typeof c.confidence === "number" ? c.confidence : 0.5));
    for (const eid of c.evidenceIds) {
      evidenceConstraintMap.set(eid, Math.max(evidenceConstraintMap.get(eid) ?? 0, strength));
    }
  }

  // Evaluate all dimension pairs
  for (let i = 0; i < activeDimensions.length; i++) {
    for (let j = i + 1; j < activeDimensions.length; j++) {
      const dimA = activeDimensions[i];
      const dimB = activeDimensions[j];

      // Find the average constraint strength for each dimension
      const aStrength = dimA.evidenceIds.reduce((s, eid) => s + (evidenceConstraintMap.get(eid) ?? 0), 0) / Math.max(1, dimA.evidenceIds.length);
      const bStrength = dimB.evidenceIds.reduce((s, eid) => s + (evidenceConstraintMap.get(eid) ?? 0), 0) / Math.max(1, dimB.evidenceIds.length);
      const baseStrength = (aStrength + bStrength) / 2;

      // Find applicable interaction rule
      const rule = DIMENSION_INTERACTION_RULES.find(r =>
        (r.catA === dimA.category && r.catB === dimB.category) ||
        (r.catA === dimB.category && r.catB === dimA.category)
      );

      const bindingType: DimensionBindingType = rule?.bindingType ?? "independent";
      const multiplier = rule?.baseStrengthMultiplier ?? 1.0;
      const combinedBindingStrength = Math.min(1, baseStrength * multiplier);
      const explanation = rule?.combinedEffectExplanation ??
        `${dimA.name} and ${dimB.name} operate independently — resolving either does not directly affect the other`;

      // Determine if evidence-backed (both dims have constraint-linked evidence)
      const isEvidenceBacked = (dimA.hasConstraint || dimA.hasLeverage) &&
        (dimB.hasConstraint || dimB.hasLeverage);

      pairs.push({
        dimA: { id: dimA.id, name: dimA.name, category: dimA.category },
        dimB: { id: dimB.id, name: dimB.name, category: dimB.category },
        bindingType,
        combinedBindingStrength,
        combinedEffectExplanation: explanation,
        resolutionPriority: rule?.resolutionPriority ?? null,
        isEvidenceBacked,
      });
    }
  }

  // Sort by combined binding strength descending
  pairs.sort((a, b) => b.combinedBindingStrength - a.combinedBindingStrength);

  const bindingPair = pairs.length > 0 ? pairs[0] : null;
  const amplifyingPairs = pairs.filter(p => p.bindingType === "amplifying");
  const neutralizingPairs = pairs.filter(p => p.bindingType === "neutralizing");

  return {
    pairs,
    bindingPair,
    totalPairs: pairs.length,
    amplifyingPairs,
    neutralizingPairs,
  };
}

// ═══════════════════════════════════════════════════════════════
//  EVIDENCE-BACKED CONSTRAINT MATRIX
// ═══════════════════════════════════════════════════════════════

/** A single cell in the constraint interaction matrix */
export interface ConstraintMatrixCell {
  rowId: string;
  colId: string;
  rowLabel: string;
  colLabel: string;
  /** null = no interaction detected */
  interaction: ConstraintInteraction | null;
  /** Raw evidence overlap ratio (0–1) between the two constraints */
  evidenceOverlap: number;
  /** Whether this cell is on the diagonal (same constraint) */
  isDiagonal: boolean;
}

/** Full N×N constraint interaction matrix with evidence backing */
export interface ConstraintInteractionMatrix {
  /** Ordered list of constraints (defines row and column order) */
  constraintIds: string[];
  constraintLabels: string[];
  /** Flat list of all cells, row-major order */
  cells: ConstraintMatrixCell[];
  /** Interaction set used to build the matrix */
  interactionSet: ConstraintInteractionSet;
  /** Total number of evidence-backed interactions found */
  evidenceBackedCount: number;
  /** Constraint ID with the most interactions (highest row sum of strength) */
  mostConnectedConstraintId: string | null;
}

/**
 * Builds a full N×N constraint interaction matrix backed by evidence overlap.
 *
 * For each pair (i, j):
 *   - If an interaction was discovered by `discoverConstraintInteractions`, the
 *     corresponding `ConstraintInteraction` record is embedded in the cell.
 *   - Raw evidence overlap is always computed so the UI can render gradient
 *     fill even when no structural rule matched.
 *   - Diagonal cells are flagged (same constraint with itself).
 */
export function buildEvidenceBackedConstraintMatrix(
  activeConstraints: StrategicInsight[],
  hypotheses: ConstraintHypothesisSet | null,
): ConstraintInteractionMatrix {
  const interactionSet = discoverConstraintInteractions(activeConstraints, hypotheses);

  // Build a lookup: sorted pair key → interaction
  const interactionLookup = new Map<string, ConstraintInteraction>();
  for (const ix of interactionSet.interactions) {
    const key = ix.constraintIds[0] < ix.constraintIds[1]
      ? `${ix.constraintIds[0]}|${ix.constraintIds[1]}`
      : `${ix.constraintIds[1]}|${ix.constraintIds[0]}`;
    interactionLookup.set(key, ix);
  }

  const ids = activeConstraints.map(c => c.id);
  const labels = activeConstraints.map(c => c.label);
  const cells: ConstraintMatrixCell[] = [];
  let evidenceBackedCount = 0;

  // Row-sum of strength per constraint for "most connected" detection
  const strengthSums = new Map<string, number>();
  for (const id of ids) strengthSums.set(id, 0);

  for (let r = 0; r < activeConstraints.length; r++) {
    for (let c = 0; c < activeConstraints.length; c++) {
      const a = activeConstraints[r];
      const b = activeConstraints[c];
      const isDiagonal = a.id === b.id;

      let interaction: ConstraintInteraction | null = null;
      let evidenceOverlap = 0;

      if (!isDiagonal) {
        const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
        interaction = interactionLookup.get(key) ?? null;

        // Compute evidence overlap inline
        const setA = new Set(a.evidenceIds);
        const union = new Set([...a.evidenceIds, ...b.evidenceIds]);
        const overlapCount = b.evidenceIds.filter(eid => setA.has(eid)).length;
        evidenceOverlap = union.size > 0 ? overlapCount / union.size : 0;

        if (interaction) {
          evidenceBackedCount++;
          strengthSums.set(a.id, (strengthSums.get(a.id) ?? 0) + interaction.strength);
        } else if (evidenceOverlap > 0) {
          evidenceBackedCount++;
          strengthSums.set(a.id, (strengthSums.get(a.id) ?? 0) + evidenceOverlap);
        }
      }

      cells.push({
        rowId: a.id,
        colId: b.id,
        rowLabel: a.label,
        colLabel: b.label,
        interaction,
        evidenceOverlap,
        isDiagonal,
      });
    }
  }

  // Find the most connected constraint
  let mostConnectedConstraintId: string | null = null;
  let maxStrength = 0;
  for (const [id, sum] of strengthSums) {
    if (sum > maxStrength) {
      maxStrength = sum;
      mostConnectedConstraintId = id;
    }
  }

  return {
    constraintIds: ids,
    constraintLabels: labels,
    cells,
    interactionSet,
    evidenceBackedCount,
    mostConnectedConstraintId,
  };
}
