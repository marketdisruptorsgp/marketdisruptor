/**
 * Product Mode — Opportunity Library
 *
 * Defines product-specific strategic opportunities and a deterministic selection
 * function. No LLM calls. All logic is pure and fully testable.
 *
 * IMPORTANT: This library NEVER generates service-mode or platform-aggregation
 * patterns. The following are explicitly excluded:
 *   - Booking platform / aggregation / marketplace for services
 *   - Stakeholder monetization (ad-based, data-selling)
 *   - Subscription to billable hours
 *   - Any pattern that requires owning a labor-side supply
 */

import type { ProductOpportunity } from "./types";
import type { ConstraintSelectionResult } from "./productConstraints";

// ═══════════════════════════════════════════════════════════════
//  OPPORTUNITY TEMPLATE LIBRARY
// ═══════════════════════════════════════════════════════════════

export const PRODUCT_OPPORTUNITY_TEMPLATES: ProductOpportunity[] = [
  {
    id: "modular_design",
    label: "Own the durability segment with modular design",
    narrative:
      "Redesign the product with user-swappable modules (earcups, headbands, batteries, cables). " +
      "Users repair and upgrade instead of replacing. Product lifespan extends to 4+ years.",
    preconditions: ["durability_gap", "repairability_friction"],
    gtmImplication:
      "Premium durability positioning with 15-20% price premium. " +
      "Messaging: 'Built to last a decade, not a year.' " +
      "DTC-first distribution to capture margin and own the customer relationship.",
    defensibility:
      "Modular mechanism patent + supply chain relationships for spare parts. " +
      "First-mover brand equity as the 'repair-first' product brand in the category.",
    timelineToCompetition:
      "18+ months — requires design iteration, tooling investment, and durability certification.",
  },
  {
    id: "parts_marketplace",
    label: "Recurring revenue from spare parts ecosystem",
    narrative:
      "Sell branded replacement parts (pads, batteries, cables, structural components) direct-to-consumer. " +
      "Parts carry 60-70%+ gross margin and create a recurring revenue stream from the existing customer base.",
    preconditions: ["repairability_friction", "battery_degradation"],
    gtmImplication:
      "Messaging: 'Keep your product, upgrade your parts.' " +
      "Parts sold at $15-$35 each via DTC storefront. " +
      "Appeal to sustainability and longevity audience. Cross-sell at point of durability complaint.",
    defensibility:
      "Customer investment in compatible parts creates high switching cost. " +
      "Community repair guides and tutorials build brand equity. First-mover community ownership.",
    timelineToCompetition:
      "12+ months — competitors can copy the model but cannot replicate the first-mover community.",
  },
  {
    id: "dtc_premium_positioning",
    label: "DTC channel captures margin and customer relationship",
    narrative:
      "Bypass retail middlemen and sell direct-to-consumer. " +
      "Recaptured margin funds R&D, better packaging, and superior post-sale support that reinforces brand.",
    preconditions: ["unit_economics_pressure", "feature_commoditization"],
    gtmImplication:
      "DTC storefront as primary channel. Premium pricing justified by direct brand story and support quality. " +
      "Lower effective price to customer vs retail (no retailer markup) while maintaining higher margins.",
    defensibility:
      "Direct customer data enables faster product iteration than retail-dependent competitors. " +
      "Customer lifetime value compounds with parts ecosystem and loyalty programs.",
    timelineToCompetition:
      "6-12 months for DTC setup — differentiation only holds if paired with product improvement.",
  },
  {
    id: "sustainability_premium",
    label: "Sustainability story commands price premium",
    narrative:
      "Position the product as the sustainable choice in the category. " +
      "Repairability, longevity, recycled materials, and carbon-neutral manufacturing justify premium pricing " +
      "and attract a growing segment that actively avoids disposable electronics.",
    preconditions: ["durability_gap", "unit_economics_pressure"],
    gtmImplication:
      "Messaging: 'One product. Years of use. Not years of waste.' " +
      "B-Corp certification or equivalent third-party sustainability validation. " +
      "10-20% price premium to sustainability-focused segment.",
    defensibility:
      "Authentic sustainability story is hard to fake and easy to audit. " +
      "First-mover certification creates credibility competitors cannot quickly replicate.",
    timelineToCompetition:
      "18+ months — certification and authentic supply chain transformation takes time.",
  },
  {
    id: "enterprise_b2b_channel",
    label: "Enterprise/B2B channel unlocks volume and stable margins",
    narrative:
      "Corporate buyers (offices, schools, call centers) purchase in bulk and prioritize " +
      "durability and support over price. A dedicated B2B offering commands stable pricing " +
      "insulated from consumer price competition.",
    preconditions: ["unit_economics_pressure", "feature_commoditization"],
    gtmImplication:
      "Volume pricing tiers (10+, 50+, 250+ unit discounts). " +
      "Centralized management or fleet replacement programs as differentiators. " +
      "Direct sales or VAR channel — not retail.",
    defensibility:
      "IT procurement switching costs are high. Incumbent product gets reordered by default. " +
      "Support SLAs and device management integrations create institutional lock-in.",
    timelineToCompetition:
      "12-18 months for enterprise-grade support and compliance credentials.",
  },
  {
    id: "premium_materials_upgrade",
    label: "Premium materials justify higher price tier",
    narrative:
      "Replace commodity materials with premium alternatives (aluminum vs. plastic, " +
      "genuine leather vs. synthetic, aircraft-grade alloys). " +
      "Material upgrade is immediately perceptible and justifies a price tier jump.",
    preconditions: ["durability_gap", "feature_commoditization"],
    gtmImplication:
      "New SKU at 20-35% higher price point. " +
      "Messaging: 'Built from materials that last.' Teardown videos and material certifications as social proof. " +
      "Premium unboxing and packaging reinforce perception.",
    defensibility:
      "Premium material sourcing relationships and minimum order commitments. " +
      "Certification or testing credentials (MIL-SPEC, IP rating, third-party durability tests).",
    timelineToCompetition:
      "6-9 months for a well-funded competitor to replicate. Moat is brand story, not materials alone.",
  },
  {
    id: "software_ecosystem_lock_in",
    label: "Companion software ecosystem creates switching cost",
    narrative:
      "Invest in companion app / firmware features that make the product more valuable over time: " +
      "personalized EQ profiles, usage analytics, maintenance reminders, and firmware updates. " +
      "The longer a user owns the product, the more it adapts to them.",
    preconditions: ["software_hardware_integration_gap", "feature_commoditization"],
    gtmImplication:
      "App as a retention tool, not a checkbox. Freemium features with premium subscription tier ($3-5/month). " +
      "Cross-sell accessories and parts through the app when usage anomalies are detected.",
    defensibility:
      "Personalized profiles, historical data, and learned preferences are not transferable to a competitor's app. " +
      "Switching means starting over — strong retention flywheel.",
    timelineToCompetition:
      "12-24 months — building a truly differentiated app experience takes multiple release cycles.",
  },
  {
    id: "community_driven_development",
    label: "Community co-development builds loyalty and reduces R&D risk",
    narrative:
      "Involve power users in product decisions: share roadmap previews, beta test new features, " +
      "run public teardowns and repair guides. Community becomes a cost-free focus group and " +
      "organic marketing channel.",
    preconditions: ["durability_gap", "customer_support_failure"],
    gtmImplication:
      "Public roadmap as marketing. Community Discord/forum drives organic awareness. " +
      "Ambassadors create repair guides, which become inbound SEO content for 'how to repair [product]' searches.",
    defensibility:
      "Community engagement is not replicable by incumbents with closed product development. " +
      "Community co-ownership creates brand loyalty that survives price competition.",
    timelineToCompetition:
      "18+ months for a genuine community to form — engagement cannot be faked or bought.",
  },
];

// ═══════════════════════════════════════════════════════════════
//  EXPLICIT EXCLUSION LIST
// ═══════════════════════════════════════════════════════════════

/**
 * Pattern IDs that must NEVER be selected in product mode.
 * These are service-mode or platform-aggregation plays that generate
 * nonsensical or misleading output for physical/digital products.
 */
export const PRODUCT_MODE_EXCLUDED_PATTERNS = [
  "aggregation",
  "booking_platform",
  "stakeholder_monetization",
  "labor_arbitrage",
  "service_marketplace",
  "franchise",
  "staffing_model",
  "billable_hours",
  "platform_aggregation",
] as const;

// ═══════════════════════════════════════════════════════════════
//  SELECTION FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Deterministically selects product-relevant opportunities based on
 * the constraints that were already identified for this product.
 *
 * An opportunity is selected when at least one of its `preconditions`
 * matches a constraint ID that was returned by `selectProductConstraints()`.
 *
 * @param productCategory      Free-text description of the product
 * @param selectedConstraints  Output of `selectProductConstraints()`
 * @param maxOpportunities     Maximum number of opportunities to return (default: 4)
 * @returns Ordered array of opportunities, precondition-match count descending
 */
export function selectProductOpportunities(
  productCategory: string,
  selectedConstraints: ConstraintSelectionResult[],
  maxOpportunities: number = 4,
): ProductOpportunity[] {
  const activeConstraintIds = new Set(
    selectedConstraints.map(r => r.constraint.id),
  );

  const scored: Array<{ opportunity: ProductOpportunity; matchCount: number }> = [];

  for (const opp of PRODUCT_OPPORTUNITY_TEMPLATES) {
    // Count how many preconditions are satisfied by active constraints
    const matchCount = opp.preconditions.filter(p => activeConstraintIds.has(p)).length;

    if (matchCount > 0) {
      scored.push({ opportunity: opp, matchCount });
    }
  }

  // Sort by number of precondition matches (most relevant first)
  scored.sort((a, b) => b.matchCount - a.matchCount);

  return scored.slice(0, maxOpportunities).map(s => s.opportunity);
}
