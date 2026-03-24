/**
 * PRODUCT MODE OPPORTUNITY TEMPLATES — §6.2
 *
 * 8+ product-specific opportunity templates with relevance scoring.
 * Includes PRODUCT_MODE_EXCLUDED_PATTERNS blocklist to suppress
 * service-mode patterns (aggregation, booking platforms) from product analyses.
 *
 * Usage:
 *   const opps = selectProductOpportunities(profile, evidence);
 *   // Returns top 3 ProductOpportunity objects by relevance score
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { ProductFacetProfile } from "./productStructuralInference";
import type { ProductOpportunity, GTMStrategy } from "./types";

// ═══════════════════════════════════════════════════════════════
//  EXCLUDED PATTERNS (service/intermediation patterns)
// ═══════════════════════════════════════════════════════════════

/**
 * Pattern IDs that are SERVICE-mode specific and must never appear in
 * product-mode opportunity recommendations.
 */
export const PRODUCT_MODE_EXCLUDED_PATTERNS = new Set<string>([
  "aggregation",
  "booking_platform",
  "marketplace_aggregator",
  "service_aggregation",
  "labor_arbitrage",
  "demand_aggregation",
  "platform_intermediation",
  "franchise_model",
  "staffing_model",
  "hourly_rate_optimization",
  "billable_hours_expansion",
  "service_delivery_automation",
  "consultant_leverage",
  "owner_extraction",
]);

// ═══════════════════════════════════════════════════════════════
//  OPPORTUNITY TEMPLATES
// ═══════════════════════════════════════════════════════════════

interface ProductOpportunityTemplate {
  id: string;
  label: string;
  description: string;
  gtmImplication: string;
  economicRationale: string;
  gtmStrategy: GTMStrategy;
  /** Score this template for a given facet profile (0–10) */
  scoreFor: (profile: ProductFacetProfile, corpus: string) => number;
}

const PRODUCT_OPPORTUNITY_TEMPLATES: ProductOpportunityTemplate[] = [
  // ── 1. Durability-as-Moat ─────────────────────────────────────────────────
  {
    id: "durability_as_moat",
    label: "Durability-as-Moat",
    description:
      "Modular, repairable design addresses the #1 customer complaint (premature failure) " +
      "and justifies a 20–30% price premium over disposable alternatives.",
    gtmImplication:
      "DTC positioning as 'the headphone that lasts' — target sustainability-conscious and enthusiast buyers " +
      "who have abandoned the replace-every-2-years cycle.",
    economicRationale:
      "Repairability generates a parts/accessories marketplace at 60–80% gross margin. " +
      "Premium ASP at DTC recovers the retail margin taken by channel intermediaries. " +
      "Loyalty from repairability reduces customer acquisition cost on repeat purchase.",
    gtmStrategy: {
      channel: "DTC-first + specialty sustainability retail",
      positioning: "The only [product category] engineered to last a decade",
      firstMove: "Prototype modular component + willingness-to-pay test with 30 current users",
      timeline: "4 weeks to prototype + WTP validation",
    },
    scoreFor: (profile) => {
      let score = 4;
      if (profile.durability_risk === "high") score += 4;
      else if (profile.durability_risk === "moderate") score += 2;
      if (profile.repairability_friction === "high") score += 2;
      else if (profile.repairability_friction === "moderate") score += 1;
      if (profile.unit_economics_pressure !== "none") score += 1;
      return Math.min(10, score);
    },
  },

  // ── 2. Modular Design + Parts Marketplace ─────────────────────────────────
  {
    id: "parts_marketplace",
    label: "Modular Design + Parts Marketplace",
    description:
      "Convert wear components (earcups, cables, batteries) from a cost centre (warranty returns) " +
      "into a recurring revenue stream (parts subscription, upgrade kits, aftermarket ecosystem).",
    gtmImplication:
      "Launch a parts marketplace alongside DTC hardware. " +
      "Position replacement parts as 'upgrade kits' at 60–80% margin. " +
      "Attract modding/enthusiast community to seed organic growth.",
    economicRationale:
      "Parts gross margin (60–80%) is 3–4× higher than hardware (15–25%). " +
      "Recurring parts revenue increases lifetime value without increasing customer acquisition cost. " +
      "Installed base grows parts revenue automatically as hardware units accumulate in the market.",
    gtmStrategy: {
      channel: "DTC parts store + platform integrations (iFixit, community forums)",
      positioning: "Designed for repairability — every component is replaceable",
      firstMove: "Launch parts page before full product DTC — measure pre-orders for replacement components",
      timeline: "2 weeks to parts landing page + demand validation",
    },
    scoreFor: (profile) => {
      let score = 4;
      if (profile.repairability_friction === "high") score += 4;
      else if (profile.repairability_friction === "moderate") score += 2;
      if (profile.durability_risk !== "none") score += 2;
      return Math.min(10, score);
    },
  },

  // ── 3. DTC Premium Channel ───────────────────────────────────────────────
  {
    id: "dtc_premium_channel",
    label: "DTC-First + Premium Retail",
    description:
      "Sell direct-to-consumer to capture retail margin (30%) and build direct customer relationships, " +
      "then expand to 3–5 premium retail partners once DTC unit economics are proven.",
    gtmImplication:
      "DTC as primary channel recovers margin and enables direct customer data collection. " +
      "Premium retail adds credibility and distribution scale after DTC success is demonstrated.",
    economicRationale:
      "DTC gross margin per unit is 30% higher than retail channel. " +
      "Direct customer relationship enables retargeting, referral incentives, and parts upsell. " +
      "Premium retail at lower volume maintains brand positioning without volume pressure.",
    gtmStrategy: {
      channel: "DTC-first (own website) → specialty audio/sustainability retail",
      positioning: "Buy direct, get the full experience — not a watered-down retail version",
      firstMove: "DTC pre-order campaign for first production run (100–500 units)",
      timeline: "6–8 weeks to pre-order validation + first fulfilment",
    },
    scoreFor: (profile) => {
      let score = 5;
      if (profile.unit_economics_pressure !== "none") score += 3;
      if (profile.feature_commoditization !== "none") score += 1;
      if (profile.supply_chain_risk !== "none") score += 1;
      return Math.min(10, score);
    },
  },

  // ── 4. Sustainability Positioning ────────────────────────────────────────
  {
    id: "sustainability_positioning",
    label: "Sustainability + Longevity Positioning",
    description:
      "Position repairability and longevity as environmental leadership, tapping into " +
      "the growing consumer preference for products that don't contribute to e-waste.",
    gtmImplication:
      "Target sustainability-conscious buyer segment (ages 25–40, willing to pay 20–30% premium). " +
      "Partner with environmental certification bodies and right-to-repair advocates. " +
      "Content marketing around product lifespan vs. competitors.",
    economicRationale:
      "Sustainability-positioned products command 15–25% price premium in consumer electronics. " +
      "ESG/sustainability certification opens B2B and institutional sales channels. " +
      "Lower return and replacement rates reduce reverse logistics cost.",
    gtmStrategy: {
      channel: "DTC + sustainability-focused retail (Patagonia, REI equivalents)",
      positioning: "Engineered against planned obsolescence — built to last, designed to repair",
      firstMove: "Right-to-repair certification + sustainability audit to validate positioning claims",
      timeline: "4–6 weeks for certification assessment",
    },
    scoreFor: (profile) => {
      let score = 3;
      if (profile.durability_risk !== "none") score += 3;
      if (profile.repairability_friction !== "none") score += 2;
      if (profile.feature_commoditization !== "none") score += 2;
      return Math.min(10, score);
    },
  },

  // ── 5. Subscription + Hardware Model ─────────────────────────────────────
  {
    id: "subscription_hardware",
    label: "Subscription + Hardware Recurring Revenue",
    description:
      "Layer recurring revenue (parts subscription, software personalisation tier, warranty extension) " +
      "on top of the initial hardware sale to increase lifetime value and reduce revenue volatility.",
    gtmImplication:
      "Price base hardware at sustainable unit margin; earn the lifetime value on the recurring layer. " +
      "Position as 'hardware that evolves with you' rather than a one-time purchase.",
    economicRationale:
      "Recurring revenue reduces dependency on per-unit hardware margin. " +
      "25% of delivered unit buyers converting to a $10/month subscription generates LTV 3–4× hardware-only. " +
      "Predictable recurring revenue enables manufacturing planning and cash flow management.",
    gtmStrategy: {
      channel: "DTC hardware + in-app/website subscription upsell",
      positioning: "The hardware subscription — one price for hardware, software, and lifetime parts",
      firstMove: "Beta test subscription tier with 50 existing product users — measure 60-day retention",
      timeline: "6 weeks to beta + retention data",
    },
    scoreFor: (profile) => {
      let score = 3;
      if (profile.unit_economics_pressure !== "none") score += 3;
      if (profile.feature_commoditization !== "none") score += 2;
      if (profile.repairability_friction !== "none") score += 2;
      return Math.min(10, score);
    },
  },

  // ── 6. Premium Community Moat ────────────────────────────────────────────
  {
    id: "premium_community_moat",
    label: "Premium Positioning + Community Brand Moat",
    description:
      "Escape the mass-market commodity trap by targeting enthusiast buyers at $300–400+ " +
      "and building community as a defensible brand moat.",
    gtmImplication:
      "DTC + specialty audio retail. Heavy community seeding in enthusiast forums (r/headphones, audiophile groups). " +
      "Premium positioning bypasses mid-range commoditisation entirely.",
    economicRationale:
      "Lower volumes but 40–60% gross margins per unit at premium ASP. " +
      "Community becomes a self-sustaining acquisition channel (NPS >50 drives referral). " +
      "Enthusiast brand advocates are resistant to competitor switching.",
    gtmStrategy: {
      channel: "DTC + specialty audio retail (B&H, Crutchfield, specialty hi-fi)",
      positioning: "Audiophile-grade durability at a lifetime ownership cost that beats the disposable cycle",
      firstMove: "Blind listening test with 50 audio enthusiasts — validate audio quality advantage at premium price",
      timeline: "3 weeks for blind test + positioning validation",
    },
    scoreFor: (profile) => {
      let score = 3;
      if (profile.feature_commoditization === "high") score += 4;
      else if (profile.feature_commoditization === "moderate") score += 2;
      if (profile.durability_risk !== "none") score += 2;
      if (profile.unit_economics_pressure !== "none") score += 1;
      return Math.min(10, score);
    },
  },

  // ── 7. Vertical Integration of Product Experience ────────────────────────
  {
    id: "vertical_integration_experience",
    label: "Vertical Integration: Own the Full Product Experience",
    description:
      "Own hardware, software, personalisation, and community — not just the physical device. " +
      "Software/ecosystem lock-in is harder to copy than hardware specifications.",
    gtmImplication:
      "Premium DTC positioning. Bundle hardware with AI-powered personalisation, companion app, " +
      "and user community. Position against commodity hardware with static firmware.",
    economicRationale:
      "Software layer at $5–15/month per user generates recurring revenue. " +
      "Switching cost increases dramatically when software personalisation is embedded. " +
      "Platform revenue from third-party app/accessory integrations at higher margin than hardware.",
    gtmStrategy: {
      channel: "DTC hardware + software subscription",
      positioning: "Hardware that learns you — personalised sound, updated over time",
      firstMove: "MVP personalisation app with 50 beta users — measure perceived value at $5/month",
      timeline: "6 weeks to MVP app + willingness-to-pay validation",
    },
    scoreFor: (profile) => {
      let score = 3;
      if (profile.feature_commoditization !== "none") score += 3;
      if (profile.unit_economics_pressure !== "none") score += 2;
      if (profile.supply_chain_risk !== "none") score += 1;
      if (profile.durability_risk !== "none") score += 1;
      return Math.min(10, score);
    },
  },

  // ── 8. B2B / Enterprise Channel ──────────────────────────────────────────
  {
    id: "b2b_enterprise_channel",
    label: "B2B / Enterprise Sales Channel",
    description:
      "Target corporate buyers (remote work, audio production, education) who buy in volume " +
      "and value durability, warranty, and support over price.",
    gtmImplication:
      "Corporate procurement bypasses consumer retail margin and brand-awareness requirements. " +
      "Volume contracts at lower per-unit margin but predictable revenue and lower CAC.",
    economicRationale:
      "B2B CAC is 50–70% lower than consumer marketing for hardware. " +
      "Volume contracts reduce manufacturing risk by providing demand visibility. " +
      "Durability and repairability are valued — not just as marketing claims but as functional requirements.",
    gtmStrategy: {
      channel: "Direct B2B sales (enterprise procurement) + B2B SaaS channels",
      positioning: "Built for professional use — durability, repairability, enterprise support",
      firstMove: "Outreach to 20 remote-work or audio-production companies — validate enterprise pricing",
      timeline: "2–3 weeks for enterprise discovery calls + LOI validation",
    },
    scoreFor: (profile) => {
      let score = 2;
      if (profile.unit_economics_pressure !== "none") score += 2;
      if (profile.durability_risk !== "none") score += 2;
      if (profile.feature_commoditization !== "none") score += 2;
      if (profile.supply_chain_risk !== "none") score += 2;
      return Math.min(10, score);
    },
  },
];

// ═══════════════════════════════════════════════════════════════
//  SELECTION LOGIC
// ═══════════════════════════════════════════════════════════════

/**
 * Select and score the most relevant product opportunities for the given
 * facet profile and evidence. Returns top N sorted by relevance score.
 *
 * Automatically filters out any pattern IDs in PRODUCT_MODE_EXCLUDED_PATTERNS.
 *
 * @param profile   - Product facet profile from inferProductStructuralProfile()
 * @param evidence  - Raw evidence array for corpus keyword scoring
 * @param topN      - Number of opportunities to return (default 3)
 */
export function selectProductOpportunities(
  profile: ProductFacetProfile,
  evidence: Evidence[] = [],
  topN: number = 3,
): ProductOpportunity[] {
  const corpus = evidence
    .map(e => `${e.label ?? ""} ${e.description ?? ""}`)
    .join(" ")
    .toLowerCase();

  return PRODUCT_OPPORTUNITY_TEMPLATES
    .filter(t => !PRODUCT_MODE_EXCLUDED_PATTERNS.has(t.id))
    .map(t => ({
      id: t.id,
      label: t.label,
      description: t.description,
      gtmImplication: t.gtmImplication,
      economicRationale: t.economicRationale,
      gtmStrategy: t.gtmStrategy,
      relevanceScore: t.scoreFor(profile, corpus),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topN);
}
