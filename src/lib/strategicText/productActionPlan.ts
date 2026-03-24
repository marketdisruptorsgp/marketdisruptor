/**
 * PRODUCT MODE ACTION PLAN BUILDER — §5.4
 *
 * Generates a sequenced action plan for product entrepreneurs.
 * The plan follows a specific product-market logic:
 *
 *   1. Validate product-market fit (prototype + willingness-to-pay)
 *   2. Confirm unit economics (COGS, ASP, channel margin)
 *   3. Prove GTM model at small scale (DTC pre-order or small batch)
 *   4. Launch recurring revenue / retention model (parts, subscription, software)
 *   5. Scale channel (premium retail, distribution expansion)
 *
 * This replaces the generic founder-coaching action plan that assumes
 * a service-business model (billable hours, owner bottleneck, etc.).
 */

import type { StructuralProfile } from "@/lib/reconfiguration/structuralProfile";
import type { DeepenedOpportunity } from "@/lib/reconfiguration/opportunityDeepening";

// ─────────────────────────────────────────────────────────────────────────────
//  ACTION PLAN ITEM TYPE
// ─────────────────────────────────────────────────────────────────────────────

export interface ActionPlanItem {
  /** 1-indexed sequence position */
  sequence: number;
  /** Time horizon label (e.g. "Weeks 1–4") */
  horizon: string;
  /** The concrete action to take */
  action: string;
  /** Why this step comes before the next one */
  rationale: string;
  /** Measurable go/no-go success gate before advancing to next step */
  successGate: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PRODUCT ACTION PLAN BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a sequenced, product-market–specific action plan.
 *
 * The plan is always anchored to the product entrepreneur's actual decision
 * sequence: validate demand → confirm economics → prove GTM → expand revenue
 * → scale distribution. Context from the structural profile personalises
 * the action descriptions.
 */
export function buildProductActionPlan(
  profile: StructuralProfile,
  deepenedOpps: DeepenedOpportunity[] = [],
): ActionPlanItem[] {
  const plan: ActionPlanItem[] = [];

  // ── Determine top constraint for Step 1 personalisation ──────────────────
  const topConstraint = profile.bindingConstraints[0];
  const hasDurabilityConstraint = profile.bindingConstraints.some(c =>
    /durabil|fail|break|crack|snap|wear|repair|replac|longevit|lifespan/i.test(
      c.constraintName + " " + c.explanation,
    ),
  );
  const hasPricingConstraint = profile.bindingConstraints.some(c =>
    /commodit|price.*parity|feature.*war|undifferentiat|spec.*parity/i.test(
      c.constraintName + " " + c.explanation,
    ),
  );
  const hasChannelConstraint =
    profile.distributionControl === "intermediated" ||
    profile.distributionControl === "no_control" ||
    profile.bindingConstraints.some(c =>
      /channel|retail|distribut|intermediar|wholesale/i.test(c.constraintName + " " + c.explanation),
    );
  const hasThinMargin =
    profile.marginStructure === "thin_margin" || profile.marginStructure === "negative_margin";
  const hasRecurringGap = profile.revenueModel === "transactional";

  // ── Determine primary differentiator from top opportunity ────────────────
  const topOpp = deepenedOpps[0];
  const differentiatorLabel =
    topOpp?.label ||
    (hasDurabilityConstraint ? "repairability / durability" : "your core differentiator");

  // ─────────────────────────────────────────────────────────────────────────
  //  STEP 1: Validate product-market fit
  // ─────────────────────────────────────────────────────────────────────────
  const step1Action = hasDurabilityConstraint
    ? `Prototype the durability / modular improvement (${topConstraint?.constraintName || "primary failure mode"}). ` +
      `Test with 20–30 users: measure willingness-to-pay for the improvement at a 15–25% price premium.`
    : hasPricingConstraint
      ? `Test non-feature differentiation positioning: present your product to 20–30 target buyers at a 20% ` +
        `premium vs. the leading mass-market alternative. Measure willingness-to-pay and stated switching intent.`
      : `Validate ${differentiatorLabel} with 20–30 target customers before committing capital. ` +
        `Measure: willingness-to-pay at target ASP, top stated reason for preference.`;

  plan.push({
    sequence: 1,
    horizon: "Weeks 1–4",
    action: step1Action,
    rationale:
      "Before committing to manufacturing tooling and inventory, confirm customers value the differentiator " +
      "enough to pay a meaningful premium. This is the cheapest way to avoid building the wrong product.",
    successGate:
      "≥60% of test participants express willingness-to-pay at target ASP. " +
      "Clear articulation of which product dimension drives the preference.",
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  STEP 2: Confirm unit economics
  // ─────────────────────────────────────────────────────────────────────────
  const step2Action = hasChannelConstraint
    ? "Map the full margin stack: manufacturing cost estimate + target ASP + DTC margin vs. retail channel margin. " +
      "Model unit economics at 500-unit and 2,000-unit production volumes. Identify minimum viable ASP for profitability."
    : hasThinMargin
      ? "Get binding manufacturing quotes for the prototyped design at 500-unit, 1,000-unit, and 5,000-unit volumes. " +
        "Model gross margin at each tier. Identify which volume makes the business sustainable."
      : "Confirm COGS, ASP, and channel margin assumptions at target volume. " +
        "Build a unit economics model at 500-unit production run with explicit margin per channel.";

  plan.push({
    sequence: 2,
    horizon: "Weeks 5–8",
    action: step2Action,
    rationale:
      "Ensure the math works at your target volume and price point before scaling. " +
      "Hardware businesses die on unit economics — this step confirms you have a viable model, " +
      "not just a good product.",
    successGate:
      "Gross margin per unit ≥ 40% at DTC price point, " +
      "OR a clear path to 40%+ at a defined production volume milestone.",
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  STEP 3: Prove GTM model at small scale
  // ─────────────────────────────────────────────────────────────────────────
  plan.push({
    sequence: 3,
    horizon: "Weeks 9–16",
    action:
      "Launch DTC pre-order or small batch (100–500 units). " +
      "Validate brand positioning, customer acquisition cost, and product-market fit at real purchase intent. " +
      "Track: pre-order conversion rate, NPS after delivery, and repeat/referral behaviour.",
    rationale:
      "Proves you can acquire customers at sustainable cost and deliver a product experience that earns " +
      "positive reviews and referrals. All retail and distribution decisions should follow this proof point.",
    successGate:
      "≥60% pre-order to delivery conversion. NPS ≥40. Customer acquisition cost ≤35% of gross margin per unit.",
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  STEP 4: Launch recurring revenue / retention model
  // ─────────────────────────────────────────────────────────────────────────
  const step4Action = hasRecurringGap
    ? "Launch recurring revenue layer: parts/accessories marketplace, software subscription tier, or repair plan. " +
      "Target: 25–30% of delivered unit buyers make at least one recurring purchase within 6 months."
    : "Activate retention mechanics: parts marketplace, community membership, or upgrade programme. " +
      "Measure: % of customers purchasing again within 12 months and LTV vs. hardware-only baseline.";

  plan.push({
    sequence: 4,
    horizon: "Months 4–6",
    action: step4Action,
    rationale:
      "Reduces dependency on per-unit gross margin. Increases lifetime value and creates defensibility " +
      "through ecosystem attachment. Recurring revenue also provides cash flow predictability for manufacturing planning.",
    successGate:
      "≥25% of delivered units have at least one recurring purchase. " +
      "Churn from recurring layer ≤15% per month. LTV at least 1.5× hardware-only ASP.",
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  STEP 5: Scale channel
  // ─────────────────────────────────────────────────────────────────────────
  plan.push({
    sequence: 5,
    horizon: "Months 6+",
    action:
      "Approach 3–5 premium retail partners (specialty audio, sustainability-focused retail, design shops). " +
      "Use proven DTC metrics (NPS, conversion, reviews) as the pitch. " +
      "Expand distribution while maintaining DTC as the primary margin and data channel.",
    rationale:
      "Scale volume and credibility through retail while recovering direct margin via DTC. " +
      "Proven metrics are required before retail conversations — retailers want evidence of sell-through, not just a pitch.",
    successGate:
      "3–5 premium retail partners onboarded. DTC still ≥50% of total revenue. " +
      "Retail channel NPS and review scores consistent with DTC baseline.",
  });

  return plan;
}
