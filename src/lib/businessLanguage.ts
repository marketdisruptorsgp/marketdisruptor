/**
 * BUSINESS LANGUAGE TRANSLATION
 *
 * Shared utility that maps internal technical constraint names to
 * entrepreneur-facing plain English. Used across the entire platform
 * to ensure consistent strategic advisor voice in all user-facing text.
 *
 * Two-layer approach:
 *   1. Business translation (full context sentence)
 *   2. Humanized fallback (snake_case → readable sentence case)
 *
 * Mode-aware layer (§5.5):
 *   Product mode suppresses service-business constraints that assume
 *   billable hours / owner bottleneck worldview, and maps constraints
 *   to product-market language instead.
 */

import { humanizeLabel } from "@/lib/humanize";

// ═══════════════════════════════════════════════════════════════
//  CONSTRAINT → BUSINESS LANGUAGE MAP
//  Maps internal constraint taxonomy IDs to plain business English
// ═══════════════════════════════════════════════════════════════

export const CONSTRAINT_BUSINESS_LANGUAGE: Record<string, string> = {
  labor_intensity: "Your revenue is handcuffed to billable hours — every dollar requires someone's time",
  owner_dependency: "The business can't grow beyond what you can personally handle — you're the bottleneck",
  operational_bottleneck: "A single process step is choking your throughput — growth piles up behind the bottleneck",
  skill_scarcity: "The talent you need is hard to find and expensive to keep — growth is gated by who you can hire",
  manual_process: "You're paying people to do work that could be systematized — every error and delay is structural, not personal",
  commoditized_pricing: "You're competing on price and losing ground — customers treat your offering as interchangeable",
  revenue_concentration: "A handful of clients hold your revenue hostage — lose one, feel the pain immediately",
  transactional_revenue: "You start from zero every month — no recurring base means no compounding",
  forced_bundling: "Customers buy your whole package when they only need part of it — you're creating objections and leaving money on the table",
  capital_barrier: "The upfront cost is killing demand — good prospects walk away before they start",
  supply_fragmentation: "Supply is scattered across dozens of small providers — whoever aggregates it first captures the relationship premium",
  geographic_constraint: "Your value can only travel as far as your team — geography is your ceiling",
  channel_dependency: "Intermediaries own your customer relationships and capture your margin — you're working for the middleman",
  inventory_burden: "Unsold inventory is cash sitting in a warehouse — every day it doesn't sell, it costs you",
  capacity_ceiling: "Your fixed assets have a hard ceiling — you're turning away business because you can't say yes",
  legacy_lock_in: "Outdated systems are costing you speed and flexibility — your tech stack is slowing down every decision",
  information_asymmetry: "You're making decisions blind — the data exists but you're not capturing or using it",
  analog_process: "Manual, paper-based workflows are creating delays and errors that compound as you grow",
  expertise_barrier: "Your product requires specialist knowledge to use — most potential customers give up before they get the value",
  switching_friction: "Customers are locked in and so are you — high switching costs cut both ways",
  trust_deficit: "The market doesn't believe you yet — trust is the bottleneck, not the product",
  regulatory_barrier: "Compliance is a cost and a constraint — whoever turns it into a structural moat wins",
  margin_compression: "Margins are shrinking from all sides — the current model doesn't have a structural answer",
  asset_underutilization: "Your biggest assets sit idle half the time — every hour of downtime is revenue you'll never recover",
  linear_scaling: "Growth requires hiring — you can't scale revenue faster than you can scale headcount",
  vendor_concentration: "You're one supplier failure away from a crisis — concentrated supply is concentrated risk",
  awareness_gap: "The people who need this don't know it exists — distribution, not product, is the bottleneck",
  access_constraint: "Your ideal customers can't reach you — access, not demand, is the real problem",
  motivation_decay: "Customers start but don't stick — the drop-off is structural, not a sales problem",
  perceived_value_mismatch: "Customers don't see what you're worth — the value exists but you're not communicating it in their language",
};

/**
 * Translate a technical constraint name to entrepreneur-facing business language.
 *
 * Fallback chain:
 *   1. Business language map (full context sentence)
 *   2. Explicit fallback (e.g., the constraint's explanation field)
 *   3. Humanized version (snake_case → sentence case)
 */
export function translateConstraintToBusinessLanguage(
  constraint: string,
  fallback?: string,
): string {
  const business = CONSTRAINT_BUSINESS_LANGUAGE[constraint];
  if (business) return business;
  return fallback || humanizeLabel(constraint.replace(/_/g, " "));
}

// ═══════════════════════════════════════════════════════════════
//  SERVICE-ONLY CONSTRAINTS (§5.5)
//  Constraints that assume a service/founder worldview.
//  Suppressed in Product mode so product entrepreneurs don't
//  receive advice about billable hours, owner bottlenecks, etc.
// ═══════════════════════════════════════════════════════════════

/**
 * Constraint IDs that carry a service-business / founder-coaching worldview.
 * These are suppressed when analysisType === "product" to avoid giving
 * headphone (or other physical-product) entrepreneurs advice about
 * billable hours, hiring their way out of owner dependency, etc.
 */
export const SERVICE_ONLY_CONSTRAINTS = new Set<string>([
  "labor_intensity",
  "owner_dependency",
  "manual_process",
  "linear_scaling",
  "skill_scarcity",
]);

// ═══════════════════════════════════════════════════════════════
//  PRODUCT-SPECIFIC CONSTRAINT LANGUAGE MAP (§5.5)
//  Overrides generic business language for product mode with
//  product-market–specific constraint narratives.
// ═══════════════════════════════════════════════════════════════

export const PRODUCT_CONSTRAINT_LANGUAGE: Record<string, string> = {
  commoditized_pricing:
    "You compete on spec parity with established players — feature improvements cost more to build than buyers perceive as value. Non-feature differentiation (durability, customization, community) is your leverage.",
  channel_dependency:
    "Retail channels capture 30–40% margin, compressing your unit economics. DTC positioning recovers that margin while building direct customer relationships for repeat sales.",
  margin_compression:
    "Thin per-unit margins leave insufficient room for customer acquisition, reinvestment, or manufacturing risk. Premium positioning, DTC channel, or recurring revenue are the structural paths forward.",
  inventory_burden:
    "Unsold inventory is tied-up capital — every unit that doesn't ship costs you carrying cost and cash flow. Pre-orders and made-to-demand production reduce this structural risk.",
  vendor_concentration:
    "Reliance on a small number of component suppliers creates production continuity risk. A single disruption can halt your entire product line.",
  switching_friction:
    "Without ecosystem lock-in (software, parts, community), customers have no structural reason to stay. Build switching costs through personalisation, subscriptions, or parts ecosystems.",
};

// ═══════════════════════════════════════════════════════════════
//  MODE-AWARE TRANSLATION (§5.5)
// ═══════════════════════════════════════════════════════════════

/**
 * Translate a constraint name to entrepreneur-facing language, mode-aware.
 *
 * In product mode:
 *   - Returns null for service-only constraints (caller should suppress them)
 *   - Uses product-specific language map when available
 *   - Falls back to generic business language otherwise
 *
 * In service/business mode:
 *   - Behaves identically to translateConstraintToBusinessLanguage()
 *
 * @param constraint    Internal constraint ID (e.g., "labor_intensity")
 * @param analysisType  Engine analysis type ("product" | "service" | "business_model")
 * @param fallback      Optional fallback text (e.g., constraint explanation)
 * @returns             Translated string, or null if the constraint should be suppressed
 */
export function translateConstraintForMode(
  constraint: string,
  analysisType: string,
  fallback?: string,
): string | null {
  const isProduct = analysisType === "product";

  // Suppress service-only constraints in product mode
  if (isProduct && SERVICE_ONLY_CONSTRAINTS.has(constraint)) {
    return null;
  }

  // Use product-specific language in product mode when available
  if (isProduct) {
    const productLanguage = PRODUCT_CONSTRAINT_LANGUAGE[constraint];
    if (productLanguage) return productLanguage;
  }

  // Fall back to generic translation
  return translateConstraintToBusinessLanguage(constraint, fallback);
}
