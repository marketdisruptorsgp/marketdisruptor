/**
 * PRODUCT MODE ACTION PLAN — §6.3
 *
 * Builds a 5-phase product GTM action plan from a facet profile and
 * selected constraints/opportunities.
 *
 * The plan follows product-market logic:
 *   1. Validate product-market fit (prototype + WTP)
 *   2. Confirm unit economics (COGS, ASP, channel margin)
 *   3. Prove GTM model at small scale (DTC pre-order)
 *   4. Launch recurring revenue / retention model
 *   5. Scale channel (premium retail, distribution expansion)
 *
 * This replaces generic founder-coaching action plans that assume a service
 * model (billable hours, owner bottleneck, booking platforms).
 */

import type { ProductFacetProfile } from "./productStructuralInference";
import type { ProductConstraint } from "./types";
import type { ProductOpportunity } from "./types";
import type { ProductAction } from "./types";

// ═══════════════════════════════════════════════════════════════
//  ACTION PLAN BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build a sequenced 5-phase product GTM action plan.
 *
 * Each phase has a concrete action, time horizon, cost estimate,
 * and a measurable go/no-go success gate.
 *
 * @param profile      - Product facet profile
 * @param constraints  - Selected binding constraints (from selectProductConstraints)
 * @param opportunities - Selected top opportunities (from selectProductOpportunities)
 */
export function buildProductActionPlan(
  profile: ProductFacetProfile,
  constraints: ProductConstraint[] = [],
  opportunities: ProductOpportunity[] = [],
): ProductAction[] {
  const plan: ProductAction[] = [];

  // Determine top context signals for personalised plan
  const hasDurability =
    profile.durability_risk === "high" || profile.durability_risk === "moderate" ||
    constraints.some(c => c.id === "durability_risk" || c.id === "repairability_friction");
  const hasEconomics =
    profile.unit_economics_pressure !== "none" ||
    constraints.some(c => c.id === "unit_economics_pressure");
  const hasChannelConstraint =
    profile.feature_commoditization !== "none" ||
    constraints.some(c => c.id === "channel_dependency");
  const hasRecurringGap = constraints.some(
    c => c.id === "unit_economics_pressure" || c.id === "low_switching_costs",
  );

  const topOpp = opportunities[0];
  const topConstraint = constraints[0];

  // ── Phase 1: Validate product-market fit ─────────────────────────────────
  const phase1Action = hasDurability
    ? `Prototype the durability / modular improvement (fix: ${topConstraint?.label ?? "primary failure mode"}). ` +
      "Test with 20–30 current product users: measure willingness-to-pay at a 15–25% price premium."
    : topOpp
      ? `Validate the "${topOpp.label}" opportunity with 20–30 target customers before committing capital. ` +
        `First move: ${topOpp.gtmStrategy?.firstMove ?? "present concept + measure willingness-to-pay"}.`
      : "Validate core product differentiation with 20–30 target customers. " +
        "Measure: willingness-to-pay at target ASP, top stated reason for preference.";

  plan.push({
    phase: 1,
    label: "Validate Product-Market Fit",
    action: phase1Action,
    successGate:
      "≥60% of test participants express willingness-to-pay at target ASP. " +
      "Clear articulation of which product dimension drives the preference.",
    timeHorizon: "Weeks 1–4",
    cost: "$2,000–5,000",
  });

  // ── Phase 2: Confirm unit economics ──────────────────────────────────────
  const phase2Action = hasEconomics
    ? "Map the full margin stack: COGS estimate + target ASP + DTC margin vs. retail channel margin. " +
      "Model unit economics at 500-unit and 2,000-unit production volumes. " +
      "Identify minimum viable ASP and volume for profitability."
    : hasChannelConstraint
      ? "Get binding manufacturing quotes at 500, 1,000, and 5,000-unit volumes. " +
        "Model gross margin at each tier. Confirm unit economics are viable at target DTC price point."
      : "Confirm COGS, ASP, and channel margin assumptions at target volume. " +
        "Build a unit economics model at 500-unit run with explicit margin per channel.";

  plan.push({
    phase: 2,
    label: "Confirm Unit Economics",
    action: phase2Action,
    successGate:
      "Gross margin per unit ≥40% at DTC price point, " +
      "OR a clear path to ≥40% at a defined production volume milestone.",
    timeHorizon: "Weeks 5–8",
    cost: "$1,000–3,000 (quotes + financial modelling)",
  });

  // ── Phase 3: Prove GTM model at small scale ───────────────────────────────
  plan.push({
    phase: 3,
    label: "Prove GTM at Small Scale",
    action:
      "Launch DTC pre-order or small batch (100–500 units). " +
      "Validate brand positioning, customer acquisition cost, and product-market fit at real purchase intent. " +
      "Track: pre-order conversion rate, NPS after delivery, and repeat/referral behaviour.",
    successGate:
      "≥60% pre-order-to-delivery conversion. NPS ≥40. Customer acquisition cost ≤35% of gross margin per unit.",
    timeHorizon: "Weeks 9–16",
    cost: "$15,000–50,000 (inventory + fulfilment + acquisition)",
  });

  // ── Phase 4: Launch recurring revenue / retention model ───────────────────
  const phase4Action = hasRecurringGap
    ? "Launch recurring revenue layer: parts/accessories marketplace, software subscription tier, or warranty plan. " +
      "Target: ≥25% of delivered unit buyers make at least one recurring purchase within 6 months."
    : "Activate retention mechanics: parts marketplace, community membership, or upgrade programme. " +
      "Measure: % of customers purchasing again within 12 months vs. hardware-only baseline.";

  plan.push({
    phase: 4,
    label: "Launch Recurring Revenue",
    action: phase4Action,
    successGate:
      "≥25% of delivered units have at least one recurring purchase. " +
      "Churn ≤15%/month. LTV at least 1.5× hardware-only ASP.",
    timeHorizon: "Months 4–6",
    cost: "$5,000–20,000 (parts catalogue + subscription infrastructure)",
  });

  // ── Phase 5: Scale channel ───────────────────────────────────────────────
  plan.push({
    phase: 5,
    label: "Scale Channel Distribution",
    action:
      "Approach 3–5 premium retail partners (specialty audio, sustainability-focused retail, design shops). " +
      "Use proven DTC metrics (NPS, conversion, reviews) as the pitch. " +
      "Expand distribution while maintaining DTC as the primary margin and data channel.",
    successGate:
      "3–5 premium retail partners onboarded. DTC still ≥50% of total revenue. " +
      "Retail channel NPS and review scores consistent with DTC baseline.",
    timeHorizon: "Months 6+",
    cost: "$10,000–30,000 (retail samples + trade terms + logistics)",
  });

  return plan;
}
