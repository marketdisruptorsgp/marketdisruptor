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
