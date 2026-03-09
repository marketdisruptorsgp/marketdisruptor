/**
 * LATENT CONSTRAINT INFERENCE
 *
 * After facets are extracted, this module identifies structural constraints
 * implied by the *combination* of facets, even when no single evidence item
 * explicitly mentions the constraint.
 *
 * Example: labor scarcity + appointment backlog + high utilization → capacity constraint
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { EvidenceFacets, BusinessFacets, RawConstraintSignal } from "./types";
import type { SemanticFacetMatch } from "./semanticAlignment";

// ═══════════════════════════════════════════════════════════════
//  INFERENCE RULES
// ═══════════════════════════════════════════════════════════════

interface InferenceRule {
  id: string;
  name: string;
  /** Constraint to infer */
  inferredConstraint: string;
  /** Description for diagnostics */
  description: string;
  /** Minimum number of conditions that must be present */
  minConditions: number;
  /** Conditions — each is a facet field + value check */
  conditions: InferenceCondition[];
  /** Confidence multiplier (0-1) based on how strong the inference is */
  baseConfidence: number;
}

interface InferenceCondition {
  /** Which facet concept IDs or field names satisfy this condition */
  matchingConceptIds?: string[];
  matchingFields?: { field: string; check: (value: any) => boolean }[];
  /** Human-readable label */
  label: string;
}

const INFERENCE_RULES: InferenceRule[] = [
  {
    id: "infer_capacity_constraint",
    name: "Capacity Constraint (Inferred)",
    inferredConstraint: "capacity_ceiling",
    description: "Labor scarcity combined with scheduling pressure and high utilization implies a capacity-constrained system",
    minConditions: 2,
    baseConfidence: 0.7,
    conditions: [
      {
        label: "Labor intensity or scarcity",
        matchingConceptIds: ["labor_high", "labor_high_owner"],
        matchingFields: [{ field: "laborProfile", check: (v) => v?.intensity === "high" }],
      },
      {
        label: "Operational bottleneck or backlog",
        matchingConceptIds: ["bottleneck_capacity"],
        matchingFields: [{ field: "operationalBottleneck", check: (v) => !!v }],
      },
      {
        label: "High utilization or demand pressure",
        matchingConceptIds: ["seasonal_demand"],
        matchingFields: [{ field: "capacityUtilization", check: (v) => v !== undefined && v > 0.6 }],
      },
    ],
  },
  {
    id: "infer_margin_squeeze",
    name: "Structural Margin Squeeze (Inferred)",
    inferredConstraint: "margin_compression",
    description: "Weak pricing power combined with high labor costs and rising expenses implies systemic margin compression",
    minConditions: 2,
    baseConfidence: 0.65,
    conditions: [
      {
        label: "Weak pricing power",
        matchingConceptIds: ["pricing_weak_power", "pricing_hourly"],
        matchingFields: [{ field: "pricingArchitecture", check: (v) => v?.priceSettingPower === "weak" }],
      },
      {
        label: "High labor intensity",
        matchingConceptIds: ["labor_high", "labor_high_owner"],
        matchingFields: [{ field: "laborProfile", check: (v) => v?.intensity === "high" }],
      },
      {
        label: "Declining margins or high fixed costs",
        matchingConceptIds: ["margin_declining", "fixed_cost_burden"],
        matchingFields: [{ field: "marginStructure", check: (v) => v?.marginTrend === "declining" }],
      },
    ],
  },
  {
    id: "infer_scaling_wall",
    name: "Linear Scaling Wall (Inferred)",
    inferredConstraint: "linear_scaling",
    description: "Labor-intensive operations with geographic constraints and per-service pricing create a hard ceiling on growth",
    minConditions: 2,
    baseConfidence: 0.7,
    conditions: [
      {
        label: "Labor-intensive operations",
        matchingConceptIds: ["labor_high", "labor_high_owner"],
        matchingFields: [{ field: "laborProfile", check: (v) => v?.intensity === "high" }],
      },
      {
        label: "Geographic or reach limitation",
        matchingConceptIds: ["geographic_constraint", "demand_access_geographic"],
      },
      {
        label: "Per-service or hourly pricing",
        matchingConceptIds: ["pricing_hourly", "pricing_project"],
        matchingFields: [{ field: "pricingArchitecture", check: (v) => v?.model === "hourly" || v?.model === "project" }],
      },
    ],
  },
  {
    id: "infer_owner_trap",
    name: "Owner Dependency Trap (Inferred)",
    inferredConstraint: "owner_dependency",
    description: "Owner-dependent labor with customer concentration and trust barriers creates an exit-proof business",
    minConditions: 2,
    baseConfidence: 0.65,
    conditions: [
      {
        label: "Owner dependency",
        matchingConceptIds: ["labor_high_owner"],
        matchingFields: [{ field: "laborProfile", check: (v) => v?.ownerDependency === true }],
      },
      {
        label: "Customer concentration or relationship dependency",
        matchingConceptIds: ["concentration_customer", "demand_trust"],
      },
      {
        label: "Trust or referral-based acquisition",
        matchingConceptIds: ["demand_trust"],
        matchingFields: [{ field: "trustBarrier", check: (v) => v === true }],
      },
    ],
  },
  {
    id: "infer_commoditization_spiral",
    name: "Commoditization Spiral (Inferred)",
    inferredConstraint: "commoditized_pricing",
    description: "Fragmented market with weak pricing power and competitive pressure leads to a pricing death spiral",
    minConditions: 2,
    baseConfidence: 0.6,
    conditions: [
      {
        label: "Fragmented market",
        matchingConceptIds: ["competitive_fragmented"],
        matchingFields: [{ field: "competitiveDensity", check: (v) => v === "fragmented" }],
      },
      {
        label: "Weak pricing power",
        matchingConceptIds: ["pricing_weak_power"],
        matchingFields: [{ field: "pricingArchitecture", check: (v) => v?.priceSettingPower === "weak" }],
      },
      {
        label: "Margin pressure",
        matchingConceptIds: ["margin_declining"],
        matchingFields: [{ field: "marginStructure", check: (v) => v?.marginTrend === "declining" }],
      },
    ],
  },
  {
    id: "infer_demand_fragility",
    name: "Demand Fragility (Inferred)",
    inferredConstraint: "demand_volatility",
    description: "Seasonal demand combined with customer churn and financial access barriers creates unpredictable revenue",
    minConditions: 2,
    baseConfidence: 0.6,
    conditions: [
      {
        label: "Seasonal or cyclical demand",
        matchingConceptIds: ["seasonal_demand"],
      },
      {
        label: "Customer churn or retention issues",
        matchingConceptIds: ["demand_churn"],
        matchingFields: [{ field: "motivationDecay", check: (v) => v === true }],
      },
      {
        label: "Financial access barrier",
        matchingConceptIds: ["demand_access_financial"],
        matchingFields: [{ field: "accessConstraint", check: (v) => v === "financial" }],
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
//  INFERENCE ENGINE
// ═══════════════════════════════════════════════════════════════

export interface InferredConstraint {
  ruleId: string;
  ruleName: string;
  inferredConstraint: string;
  description: string;
  confidence: number;
  /** Which conditions were satisfied */
  satisfiedConditions: string[];
  /** Evidence IDs that contributed */
  contributingEvidenceIds: string[];
}

/**
 * Run latent constraint inference across all evidence items.
 * Checks whether the aggregate facet patterns satisfy inference rules.
 */
export function inferLatentConstraints(
  evidence: (Evidence & { facets?: EvidenceFacets })[],
  allMatches: { evidenceId: string; matches: SemanticFacetMatch[] }[],
): InferredConstraint[] {
  // Collect all concept IDs present across all evidence
  const presentConceptIds = new Set<string>();
  const conceptToEvidence = new Map<string, string[]>();

  for (const { evidenceId, matches } of allMatches) {
    for (const m of matches) {
      presentConceptIds.add(m.conceptId);
      const existing = conceptToEvidence.get(m.conceptId) || [];
      existing.push(evidenceId);
      conceptToEvidence.set(m.conceptId, existing);
    }
  }

  // Collect all facet field values from structured facets
  const facetFieldValues = new Map<string, { value: any; evidenceIds: string[] }[]>();
  for (const ev of evidence) {
    if (!ev.facets || ev.facets.domain === "object") continue;
    const facets = ev.facets as any;
    for (const [field, value] of Object.entries(facets)) {
      if (field === "domain" || value === undefined) continue;
      if (!facetFieldValues.has(field)) facetFieldValues.set(field, []);
      facetFieldValues.get(field)!.push({ value, evidenceIds: [ev.id] });
    }
  }

  // Evaluate each inference rule
  const results: InferredConstraint[] = [];

  for (const rule of INFERENCE_RULES) {
    const satisfied: string[] = [];
    const contributingIds = new Set<string>();

    for (const condition of rule.conditions) {
      let met = false;

      // Check concept IDs
      if (condition.matchingConceptIds) {
        for (const cid of condition.matchingConceptIds) {
          if (presentConceptIds.has(cid)) {
            met = true;
            const eids = conceptToEvidence.get(cid) || [];
            eids.forEach(id => contributingIds.add(id));
          }
        }
      }

      // Check facet field values
      if (!met && condition.matchingFields) {
        for (const { field, check } of condition.matchingFields) {
          const entries = facetFieldValues.get(field) || [];
          for (const entry of entries) {
            if (check(entry.value)) {
              met = true;
              entry.evidenceIds.forEach(id => contributingIds.add(id));
            }
          }
        }
      }

      if (met) {
        satisfied.push(condition.label);
      }
    }

    if (satisfied.length >= rule.minConditions) {
      // Confidence scales with how many conditions are met
      const conditionRatio = satisfied.length / rule.conditions.length;
      const confidence = Math.min(0.95, rule.baseConfidence * (0.7 + 0.3 * conditionRatio));

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        inferredConstraint: rule.inferredConstraint,
        description: rule.description,
        confidence,
        satisfiedConditions: satisfied,
        contributingEvidenceIds: [...contributingIds],
      });
    }
  }

  return results;
}

/**
 * Convert inferred constraints to raw signals for integration with existing pipeline.
 */
let inferredSignalCounter = 0;

export function inferredConstraintsToRawSignals(
  inferred: InferredConstraint[],
): RawConstraintSignal[] {
  return inferred.map(ic => ({
    id: `rs-inferred-${++inferredSignalCounter}`,
    snippet: `[Inferred] ${ic.description}`,
    mappedConstraint: ic.inferredConstraint,
    activationCount: ic.satisfiedConditions.length,
    status: "active" as const,
    createdAt: Date.now(),
    sourceEvidenceId: ic.contributingEvidenceIds[0] || "inferred",
  }));
}
