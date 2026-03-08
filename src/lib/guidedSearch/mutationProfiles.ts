/**
 * Guided Search Loop — Zone-Aware Mutation Profiles
 *
 * Defines which structural features are mutable per archetype
 * and the option space for each dimension.
 */

import type { ArchetypeMutationProfile } from "./types";

// ── Shared dimension option pools ────────────────────────────

const CUSTOMER_SEGMENTS = [
  "smb", "mid_market", "enterprise", "consumer", "prosumer",
  "franchise", "government", "nonprofit", "solo_operator",
];

const PRICING_MODELS = [
  "subscription", "transaction_fee", "per_unit", "usage_based",
  "freemium", "outcome_based", "flat_rate", "tiered", "auction",
  "rev_share", "licensing",
];

const DISTRIBUTION_MODELS = [
  "direct_digital", "direct_sales", "channel_partner", "marketplace",
  "embedded", "referral_network", "franchise", "white_label",
  "self_serve", "field_sales", "api_first",
];

const WORKFLOW_STAGES = [
  "discovery", "intake", "scheduling", "dispatch", "execution",
  "quality_control", "billing", "reporting", "compliance",
  "procurement", "fulfillment", "customer_success",
];

const FUNCTIONS = [
  "automation", "aggregation", "matching", "analytics",
  "coordination", "compliance", "procurement", "scheduling",
  "quality_assurance", "financial_management", "inventory",
  "workforce_management", "customer_acquisition",
];

const REGULATORY_CLASSES = ["unregulated", "light", "moderate", "heavy"];
const CAPITAL_INTENSITIES = ["low", "moderate", "high"];

// ═══════════════════════════════════════════════════════════════
//  ARCHETYPE MUTATION PROFILES
// ═══════════════════════════════════════════════════════════════

export const MUTATION_PROFILES: ArchetypeMutationProfile[] = [
  {
    archetype: "rollup_strategy",
    primaryDimensions: ["customer", "function", "distribution"],
    secondaryDimensions: ["pricing_model", "workflow_stage"],
    dimensionOptions: {
      customer: CUSTOMER_SEGMENTS,
      function: ["aggregation", "coordination", "quality_assurance", "financial_management", "procurement"],
      distribution: ["direct_sales", "channel_partner", "field_sales", "franchise"],
      pricing_model: ["subscription", "rev_share", "flat_rate"],
    },
  },
  {
    archetype: "succession_acquisition",
    primaryDimensions: ["customer", "function", "distribution"],
    secondaryDimensions: ["pricing_model"],
    dimensionOptions: {
      customer: CUSTOMER_SEGMENTS,
      function: FUNCTIONS,
      distribution: ["direct_sales", "field_sales", "channel_partner", "franchise"],
      pricing_model: PRICING_MODELS,
    },
  },
  {
    archetype: "productization",
    primaryDimensions: ["workflow_stage", "pricing_model", "function"],
    secondaryDimensions: ["distribution", "customer"],
    dimensionOptions: {
      workflow_stage: WORKFLOW_STAGES,
      pricing_model: ["subscription", "usage_based", "tiered", "freemium", "outcome_based"],
      function: ["automation", "analytics", "coordination", "scheduling", "compliance"],
      distribution: ["direct_digital", "self_serve", "api_first", "marketplace"],
    },
  },
  {
    archetype: "vertical_integration",
    primaryDimensions: ["function", "distribution", "workflow_stage"],
    secondaryDimensions: ["pricing_model", "customer"],
    dimensionOptions: {
      function: ["procurement", "fulfillment", "quality_assurance", "inventory", "coordination"],
      distribution: ["direct_sales", "direct_digital", "channel_partner", "white_label"],
      workflow_stage: WORKFLOW_STAGES,
      pricing_model: PRICING_MODELS,
    },
  },
  {
    archetype: "distribution_capture",
    primaryDimensions: ["distribution", "function", "pricing_model"],
    secondaryDimensions: ["customer", "workflow_stage"],
    dimensionOptions: {
      distribution: DISTRIBUTION_MODELS,
      function: ["aggregation", "matching", "customer_acquisition", "analytics"],
      pricing_model: ["transaction_fee", "rev_share", "subscription", "freemium"],
    },
  },
  {
    archetype: "asset_light_restructuring",
    primaryDimensions: ["distribution", "pricing_model", "function"],
    secondaryDimensions: ["workflow_stage", "customer"],
    dimensionOptions: {
      distribution: ["direct_digital", "self_serve", "marketplace", "api_first", "embedded"],
      pricing_model: ["subscription", "usage_based", "outcome_based", "transaction_fee"],
      function: ["automation", "coordination", "analytics", "matching"],
    },
  },
  {
    archetype: "pricing_model_redesign",
    primaryDimensions: ["pricing_model", "distribution"],
    secondaryDimensions: ["function", "customer"],
    dimensionOptions: {
      pricing_model: PRICING_MODELS,
      distribution: DISTRIBUTION_MODELS,
      function: ["analytics", "automation", "financial_management"],
    },
  },
  {
    archetype: "workflow_automation",
    primaryDimensions: ["workflow_stage", "function", "pricing_model"],
    secondaryDimensions: ["distribution", "customer"],
    dimensionOptions: {
      workflow_stage: WORKFLOW_STAGES,
      function: ["automation", "scheduling", "coordination", "compliance", "analytics"],
      pricing_model: ["subscription", "usage_based", "tiered", "outcome_based"],
      distribution: ["direct_digital", "self_serve", "api_first", "embedded"],
    },
  },
  {
    archetype: "marketplace",
    primaryDimensions: ["distribution", "function", "pricing_model"],
    secondaryDimensions: ["customer", "workflow_stage"],
    dimensionOptions: {
      distribution: ["marketplace", "self_serve", "direct_digital", "referral_network"],
      function: ["matching", "aggregation", "coordination", "customer_acquisition"],
      pricing_model: ["transaction_fee", "rev_share", "freemium", "subscription"],
    },
  },
  {
    archetype: "vertical_saas",
    primaryDimensions: ["workflow_stage", "function", "pricing_model"],
    secondaryDimensions: ["distribution", "customer"],
    dimensionOptions: {
      workflow_stage: WORKFLOW_STAGES,
      function: ["automation", "analytics", "compliance", "scheduling", "coordination"],
      pricing_model: ["subscription", "tiered", "usage_based", "freemium"],
      distribution: ["direct_digital", "self_serve", "api_first"],
    },
  },
  // Fallback for archetypes without a specific profile
  {
    archetype: "aggregation_platform",
    primaryDimensions: ["distribution", "function", "customer"],
    secondaryDimensions: ["pricing_model", "workflow_stage"],
    dimensionOptions: {
      distribution: DISTRIBUTION_MODELS,
      function: FUNCTIONS,
      customer: CUSTOMER_SEGMENTS,
      pricing_model: PRICING_MODELS,
    },
  },
  {
    archetype: "embedded_fintech",
    primaryDimensions: ["function", "pricing_model", "distribution"],
    secondaryDimensions: ["customer", "workflow_stage"],
    dimensionOptions: {
      function: ["financial_management", "automation", "analytics"],
      pricing_model: ["transaction_fee", "rev_share", "usage_based"],
      distribution: ["embedded", "api_first", "white_label"],
    },
  },
  {
    archetype: "data_network_effect",
    primaryDimensions: ["function", "distribution", "pricing_model"],
    secondaryDimensions: ["customer", "workflow_stage"],
    dimensionOptions: {
      function: ["analytics", "automation", "matching", "quality_assurance"],
      distribution: ["direct_digital", "api_first", "embedded", "self_serve"],
      pricing_model: ["subscription", "usage_based", "freemium", "tiered"],
    },
  },
  {
    archetype: "disintermediation",
    primaryDimensions: ["distribution", "function", "pricing_model"],
    secondaryDimensions: ["customer"],
    dimensionOptions: {
      distribution: ["direct_digital", "direct_sales", "self_serve", "marketplace"],
      function: ["matching", "customer_acquisition", "coordination", "aggregation"],
      pricing_model: ["subscription", "transaction_fee", "flat_rate"],
    },
  },
];

/**
 * Get the mutation profile for a given archetype.
 * Falls back to a generic profile if none found.
 */
export function getMutationProfile(archetype: string): ArchetypeMutationProfile {
  const found = MUTATION_PROFILES.find((p) => p.archetype === archetype);
  if (found) return found;

  // Generic fallback
  return {
    archetype: archetype as any,
    primaryDimensions: ["function", "customer", "pricing_model"],
    secondaryDimensions: ["distribution", "workflow_stage"],
    dimensionOptions: {
      function: FUNCTIONS,
      customer: CUSTOMER_SEGMENTS,
      pricing_model: PRICING_MODELS,
      distribution: DISTRIBUTION_MODELS,
      workflow_stage: WORKFLOW_STAGES,
    },
  };
}
