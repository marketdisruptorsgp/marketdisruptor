/**
 * PRODUCT MODE OPPORTUNITY LIBRARY — §5.2
 *
 * Defines the canonical product-market opportunity patterns for Product mode
 * analyses. Each pattern describes a structural strategic move that a product
 * entrepreneur can execute — with GTM positioning, economic rationale, risk
 * profile, and a concrete first-move validation step.
 *
 * These are the patterns the AI uses as scaffolding when generating
 * product-specific opportunities. They replace the generic business-model
 * narratives (intermediation, aggregation, asset monetisation) with
 * product-specific strategies: DTC, premium positioning, durability moats,
 * vertical integration, subscription + hardware.
 */

import type { StructuralProfile } from "@/lib/reconfiguration/structuralProfile";

// ─────────────────────────────────────────────────────────────────────────────
//  PRODUCT OPPORTUNITY PATTERN TYPE
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductOpportunityPattern {
  /** Stable identifier */
  id: string;
  /** Short human-readable name */
  name: string;
  /** One-sentence description of the strategic move */
  description: string;
  /** Why this pattern creates durable advantage for a product entrepreneur */
  rationale: string;
  /** Go-to-market positioning guidance */
  gtm: string;
  /** Primary execution risk */
  risk: string;
  /** Prompt hint for AI opportunity generation */
  aiPromptHint: string;
  /** Returns a relevance score 0–10 for this pattern given the structural profile */
  relevance: (profile: StructuralProfile) => number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  PRODUCT OPPORTUNITY PATTERNS
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCT_OPPORTUNITY_PATTERNS: ProductOpportunityPattern[] = [
  // ── 1. Durability-as-Moat ──────────────────────────────────────────────────
  {
    id: "durability_as_moat",
    name: "Durability-as-Moat",
    description: "Modular, repairable design addresses the #1 customer pain point (premature product failure) and justifies a premium price point.",
    rationale:
      "Repairability and longevity justify premium pricing (sustainability + longevity = brand loyalty + parts revenue). " +
      "DTC at premium ASP recovers the retail margin and builds direct customer relationships for repeat sales.",
    gtm:
      "DTC + repair/upgrade subscription model. " +
      "Target sustainability-conscious buyers and audio/product enthusiasts who reject planned obsolescence.",
    risk:
      "Manufacturing complexity of modular connectors adds 20–40% to first-unit costs. " +
      "Reliability tradeoffs on modular joints must be validated before volume production.",
    aiPromptHint:
      "Identify the #1 durability failure point in the current product. " +
      "Design a modular or field-repairable alternative: what component breaks first? " +
      "Propose a snap-fit or tool-free replacement mechanism. " +
      "Estimate: (a) parts margin on replacements, (b) premium ASP increase justified by repairability claim, " +
      "(c) first-unit BOM cost delta vs. non-modular design. " +
      "Anchor to sustainability-conscious buyer persona willing to pay 20–30% premium.",
    relevance: (p) => {
      let score = 5;
      const hasDurability = p.bindingConstraints.some(c =>
        /durabil|fail|break|crack|snap|wear|repair|replac|longevit|lifespan|defect|warranty|brittle/i.test(
          c.constraintName + " " + c.explanation,
        ),
      );
      if (hasDurability) score += 4;
      if (p.marginStructure === "thin_margin") score += 1;
      return Math.min(10, score);
    },
  },

  // ── 2. Vertical Integration of Audio/Product Experience ───────────────────
  {
    id: "vertical_integration_experience",
    name: "Vertical Integration of Product Experience",
    description: "Own the full product experience — hardware, software, personalisation, and community — not just the physical device.",
    rationale:
      "Software/ecosystem lock-in is harder to copy than hardware specifications. " +
      "Ownership of the personalisation layer (sound profiles, app, calibration) creates switching costs " +
      "that hardware-only competitors cannot replicate without matching the full stack.",
    gtm:
      "Premium DTC positioning. Bundle hardware with AI-powered personalisation, companion app, and user community. " +
      "Position as the 'hardware that learns you' vs commodity hardware with static firmware.",
    risk:
      "Requires backend infrastructure, ongoing software development, and audio engineering talent. " +
      "Software bugs damage brand trust in a way hardware-only companies do not experience.",
    aiPromptHint:
      "Identify what currently happens after the customer unboxes the product. " +
      "What personalisation, calibration, or software layer is currently absent or undifferentiated? " +
      "Propose a specific software/app/community layer: hearing-profile calibration, firmware personalisation, " +
      "user community content, upgrade subscription. " +
      "Estimate: (a) monthly/annual subscription ASP, (b) % of customers who would activate, " +
      "(c) retention after 3 months. Reference: Peloton, Sonos, Oura Ring software + hardware stacks.",
    relevance: (p) => {
      let score = 4;
      const hasSoftwareGap = p.bindingConstraints.some(c =>
        /software|app|personaliz|calibrat|digital|firmware|ecosystem|lock.?in|switch/i.test(
          c.constraintName + " " + c.explanation,
        ),
      );
      if (hasSoftwareGap) score += 4;
      if (p.revenueModel === "transactional") score += 2;
      return Math.min(10, score);
    },
  },

  // ── 3. Subscription + Hardware Model ──────────────────────────────────────
  {
    id: "subscription_hardware_model",
    name: "Subscription + Hardware Model",
    description: "Base hardware at sustainable unit margin; recurring revenue from premium audio/software profiles, repair plans, replacement parts, and upgrades.",
    rationale:
      "Reduces dependency on per-unit gross margin. " +
      "Increases lifetime value and generates predictable recurring revenue. " +
      "Builds a parts/accessories marketplace that competitors cannot easily replicate without the installed base.",
    gtm:
      "DTC positioning as 'hardware that evolves with you.' " +
      "Parts, software, and accessories marketplace alongside the core product. " +
      "Price the base hardware at margin break-even; earn on the recurring layer.",
    risk:
      "Requires ongoing product development and logistics for parts. " +
      "Retention challenges: if customers don't see value in recurring layer, churn reduces LTV. " +
      "Risk of 'nickel and diming' brand perception if recurring items feel mandatory.",
    aiPromptHint:
      "Map all consumable, replaceable, or upgradeable components in the product. " +
      "Which have meaningful replacement cycles? (earcups, cables, batteries, firmware, parts) " +
      "Design a recurring revenue layer: parts subscription, premium software tier, or upgrade plan. " +
      "Estimate: (a) % of hardware buyers likely to subscribe, (b) annual recurring revenue per subscriber, " +
      "(c) LTV improvement vs. hardware-only model. " +
      "Reference: Dyson, Vitamix, Bose (warranty extensions + accessories).",
    relevance: (p) => {
      let score = 4;
      if (p.revenueModel === "transactional") score += 3;
      const hasMarginalConstraint = p.bindingConstraints.some(c =>
        /margin|revenue|monetiz|recurring|subscription|lifetime|ltv|repeat/i.test(
          c.constraintName + " " + c.explanation,
        ),
      );
      if (hasMarginalConstraint) score += 2;
      if (p.marginStructure === "thin_margin" || p.marginStructure === "negative_margin") score += 1;
      return Math.min(10, score);
    },
  },

  // ── 4. Premium Positioning + Community Brand Moat ─────────────────────────
  {
    id: "premium_community_moat",
    name: "Premium Positioning + Community Brand Moat",
    description: "Position at a $300–400+ price point via craftsmanship, audio quality, repairability, and sustainability ethos. Build community as a defensible moat.",
    rationale:
      "Lower volumes but higher gross margins per unit. " +
      "Community becomes a defensible moat: product enthusiasts are brand advocates who resist switching. " +
      "Premium positioning bypasses the mid-range commoditisation trap entirely.",
    gtm:
      "DTC primary + selective premium retail (specialty audio, sustainability platforms). " +
      "Heavy content and influencer seeding in audio enthusiast and sustainability communities. " +
      "Position against $250 mass-market alternatives on dimensions mass-market cannot compete on.",
    risk:
      "Requires meaningful, demonstrable audio quality gains beyond EQ curves. " +
      "Brand narrative must be authentic and consistent — premium claims that cannot be substantiated damage trust.",
    aiPromptHint:
      "Identify the specific quality/craftsmanship dimensions that justify $300–400+ pricing. " +
      "What does a $350 buyer get that a $150 Sony buyer does not? (materials, repairability, sound science, community) " +
      "Design the community layer: what does membership look like? (forums, user groups, beta access, events) " +
      "Estimate: (a) target ASP, (b) gross margin at target ASP, (c) break-even unit volume. " +
      "Reference: Grado Labs, Sennheiser (audiophile tier), Tivoli Audio — premium hardware + community positioning.",
    relevance: (p) => {
      let score = 4;
      const hasCommoditisation = p.bindingConstraints.some(c =>
        /commodit|price.*parity|price.*war|undifferentiat|mass.*market|spec.*parity/i.test(
          c.constraintName + " " + c.explanation,
        ),
      );
      if (hasCommoditisation) score += 4;
      if (p.marginStructure === "high_margin") score += 1;
      if (p.switchingCosts === "low" || p.switchingCosts === "none") score += 1;
      return Math.min(10, score);
    },
  },

  // ── 5. Strategic Channel: DTC-First + Premium Retail ─────────────────────
  {
    id: "dtc_premium_channel",
    name: "DTC-First + Premium Retail Channel",
    description: "Hybrid channel strategy: DTC for early adopters, brand control, and repeat sales; premium retail for credibility and distribution scale.",
    rationale:
      "DTC captures retail margin (30% recovery) and builds direct customer relationships and data. " +
      "Premium retail (specialty audio, sustainability platforms) adds credibility and reach " +
      "once unit economics and brand metrics are proven at DTC scale.",
    gtm:
      "Build brand and unit economics on DTC first. " +
      "Approach 3–5 premium retailers (specialty audio shops, sustainability-focused retail) " +
      "once 60%+ pre-order delivery rate and NPS >40 are demonstrated.",
    risk:
      "Retail still takes 30% margin — DTC must be profitable first. " +
      "Premium retail requires inventory commitment and may create minimum order obligations. " +
      "Brand narrative must be consistent across both channels.",
    aiPromptHint:
      "Design the DTC-first channel playbook: pre-order page, launch timing, pricing. " +
      "What are the go/no-go metrics for approaching retail? (conversion rate, NPS, delivery rate) " +
      "Identify 3–5 premium retail partners by name that fit the brand positioning. " +
      "Estimate: (a) DTC margin per unit, (b) retail margin per unit, " +
      "(c) % of revenue that should remain DTC to maintain economics. " +
      "Reference: Casper (DTC then Nordstrom), Away luggage (DTC then specialty retail).",
    relevance: (p) => {
      let score = 5;
      if (p.distributionControl === "intermediated" || p.distributionControl === "no_control") score += 3;
      const hasChannelConstraint = p.bindingConstraints.some(c =>
        /channel|retail|distribut|intermediar|wholesale|margin/i.test(
          c.constraintName + " " + c.explanation,
        ),
      );
      if (hasChannelConstraint) score += 2;
      return Math.min(10, score);
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  SELECTION HELPER
// ─────────────────────────────────────────────────────────────────────────────

export interface ScoredProductOpportunity {
  pattern: ProductOpportunityPattern;
  relevanceScore: number;
}

/**
 * Select and rank the most relevant product opportunity patterns for a given
 * structural profile. Returns top N patterns sorted by relevance score.
 */
export function selectProductOpportunities(
  profile: StructuralProfile,
  topN: number = 3,
): ScoredProductOpportunity[] {
  return PRODUCT_OPPORTUNITY_PATTERNS.map(p => ({
    pattern: p,
    relevanceScore: p.relevance(profile),
  }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topN);
}
