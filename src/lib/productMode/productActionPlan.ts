/**
 * Product Mode — Action Plan Builder
 *
 * Generates a product-specific 8-12 week validation and launch roadmap.
 * All logic is deterministic, fully testable, and executable by a founder
 * working alone or with a small team.
 *
 * Key design rules:
 *   - All success criteria are binary (specific number / percentage thresholds)
 *   - Cost estimates are realistic founder-stage ranges
 *   - Phases de-risk sequentially: validate → prototype → early cohort → pre-order → manufacture
 *   - No vague goals ("explore further", "gather feedback") — only measurable gates
 */

import type { ProductAction } from "./types";
import type { ProductConstraint, ConstraintSelectionResult } from "./productConstraints";
import type { ProductOpportunity } from "./productOpportunities";

// ═══════════════════════════════════════════════════════════════
//  PHASE TEMPLATE LIBRARY
// ═══════════════════════════════════════════════════════════════

/**
 * Phase template functions.  Each one is called with the top constraint and
 * top opportunity selected for this product, so the output is contextualised.
 */
type PhaseBuilder = (
  primaryConstraint: ProductConstraint | null,
  primaryOpportunity: ProductOpportunity | null,
) => Omit<ProductAction, "phase">;

const PHASE_TEMPLATES: PhaseBuilder[] = [
  // Phase 1 — Validate willingness-to-pay (Week 1-2)
  (constraint, opportunity) => ({
    weekRange: "Week 1-2",
    title: "Validate willingness-to-pay",
    hypothesis: opportunity
      ? `Customers will pay a premium for a product that addresses: ${opportunity.label.toLowerCase()}.`
      : "Customers will pay a premium for a meaningfully differentiated product.",
    successCriteria: [
      "≥40% of 50 surveyed target users say 'definitely would buy' at the premium price point",
      "Median price sensitivity test reveals ≥15% premium acceptance over current market price",
    ],
    failureFallback:
      "If fewer than 36/50 users express willingness-to-pay premium, " +
      "reframe the value proposition and retest with a different benefit angle before investing in a prototype.",
    estimatedCost: "$500",
    estimatedTimeCommitment: "20 hours",
  }),

  // Phase 2 — Build prototype and validate core claim (Week 3-8)
  (constraint, opportunity) => ({
    weekRange: "Week 3-8",
    title: "Build prototype and validate core claim",
    hypothesis: constraint
      ? `A redesigned product that eliminates "${constraint.label.toLowerCase()}" does not compromise core performance.`
      : "A prototype addressing the primary constraint performs at or above baseline on core metrics.",
    successCriteria: [
      "3,000+ stress cycles without structural failure on redesigned component",
      "10 independent testers rate core performance ≥4.5/5 (equal to or better than original)",
    ],
    failureFallback:
      "If prototype fails stress test or performance drops below 4.5/5, " +
      "pivot to material substitution or mechanism redesign before proceeding to user cohort.",
    estimatedCost: "$8K-$15K",
    estimatedTimeCommitment: "120 hours",
  }),

  // Phase 3 — Early adopter cohort (Week 9-14)
  (constraint, opportunity) => ({
    weekRange: "Week 9-14",
    title: "Early adopter cohort (50 units)",
    hypothesis: opportunity
      ? `The target customer segment identified by "${opportunity.label.toLowerCase()}" will buy, use, and advocate for the product.`
      : "An early cohort of 50 buyers will validate product-market fit at the target price point.",
    successCriteria: [
      "Net Promoter Score (NPS) ≥70 after 4 weeks of use",
      "≥30% of cohort users make an accessory or replacement part purchase within 8 weeks",
    ],
    failureFallback:
      "If NPS < 70 or repeat purchase rate < 1 per user, conduct structured interviews to identify " +
      "the friction causing dissatisfaction before scaling to pre-order.",
    estimatedCost: "$8K",
    estimatedTimeCommitment: "80 hours",
  }),

  // Phase 4 — DTC pre-order (Week 15-20)
  (constraint, opportunity) => ({
    weekRange: "Week 15-20",
    title: "DTC pre-order campaign (target 200 units)",
    hypothesis:
      "The differentiation story is strong enough to drive ≥150 pre-orders within 2 weeks of launch, " +
      "with customer acquisition cost (CAC) below $15.",
    successCriteria: [
      "≥150 pre-orders in first 14 days of campaign",
      "CAC ≤$15 (total ad spend ÷ confirmed pre-orders)",
    ],
    failureFallback:
      "If pre-orders < 150 in 14 days, pause ad spend, audit messaging, and A/B test landing page " +
      "headline before extending campaign. Do not proceed to manufacturing without hitting this gate.",
    estimatedCost: "$3K",
    estimatedTimeCommitment: "60 hours",
  }),

  // Phase 5 — Manufacturing + ecosystem launch (Week 21-36)
  (constraint, opportunity) => ({
    weekRange: "Week 21-36",
    title: "Manufacturing run and ecosystem launch",
    hypothesis: opportunity?.id === "parts_marketplace"
      ? "Parts / accessories marketplace drives ≥30% repeat purchase rate within 12 months, validating the ecosystem revenue thesis."
      : "First manufacturing run delivers on quality commitments and the unit economics model holds at scale.",
    successCriteria: [
      ">90% of units shipped on-time (within 5 days of committed date)",
      "<2% DOA (dead-on-arrival) rate across first production run",
      "3-year LTV > 2.5× Average Selling Price (ASP) based on observed cohort behaviour",
    ],
    failureFallback:
      "If DOA > 2% or LTV trajectory is below 2.5× ASP at 6-month mark, " +
      "pause reorder, conduct root-cause analysis with manufacturing partner, and resolve before scaling.",
    estimatedCost: "$50K-$80K",
    estimatedTimeCommitment: "200 hours",
  }),
];

// ═══════════════════════════════════════════════════════════════
//  ACTION PLAN BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Builds a 5-phase product validation and launch roadmap tailored to the
 * top constraint and top opportunity identified for this product.
 *
 * @param productCategory      Free-text description of the product
 * @param selectedConstraints  Output of `selectProductConstraints()`
 * @param selectedOpportunities Output of `selectProductOpportunities()`
 * @returns Array of 5 ProductAction phases in chronological order
 */
export function buildProductActionPlan(
  productCategory: string,
  selectedConstraints: ConstraintSelectionResult[],
  selectedOpportunities: ProductOpportunity[],
): ProductAction[] {
  const primaryConstraint = selectedConstraints[0]?.constraint ?? null;
  const primaryOpportunity = selectedOpportunities[0] ?? null;

  return PHASE_TEMPLATES.map((buildPhase, index) => {
    const partial = buildPhase(primaryConstraint, primaryOpportunity);
    return {
      phase: index + 1,
      ...partial,
    };
  });
}
