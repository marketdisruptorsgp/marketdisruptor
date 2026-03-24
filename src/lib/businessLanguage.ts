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
 * Mode awareness:
 *   SERVICE_ONLY_CONSTRAINTS lists constraint IDs that are only meaningful
 *   in service or business-model analyses. These are suppressed in product mode.
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

// ═══════════════════════════════════════════════════════════════
//  PRODUCT-MODE CONSTRAINT LABELS
//  Product-specific rewrites of constraints that are otherwise
//  phrased in founder/service language.
// ═══════════════════════════════════════════════════════════════

export const PRODUCT_CONSTRAINT_LANGUAGE: Record<string, string> = {
  commoditized_pricing: "Feature commoditization is compressing margins — the product is increasingly interchangeable with competitors",
  channel_dependency: "Channel power is limiting direct customer access — intermediaries capture margin and own the relationship",
  vendor_concentration: "Concentrated supply chain is a structural risk — one supplier failure threatens product availability",
  inventory_burden: "Inventory carrying costs are eroding unit economics — unsold stock is a structural drag",
  capital_barrier: "High upfront cost is suppressing adoption — price point is a structural barrier for mass-market reach",
  expertise_barrier: "Product complexity creates a steep learning curve — usability friction limits addressable market",
  switching_friction: "Platform lock-in cuts both ways — high switching costs slow competitive displacement but limit user freedom",
  trust_deficit: "Brand credibility is the bottleneck — the product needs to earn trust before the value proposition lands",
  regulatory_barrier: "Regulatory compliance constrains product design — whoever turns compliance into a feature wins",
  margin_compression: "BOM and channel costs are compressing margins — the current unit economics don't support growth",
  legacy_lock_in: "Component dependencies are limiting design freedom — the tech stack constrains product evolution",
  information_asymmetry: "Customer usage data is not being captured — product decisions are made without behavioral signal",
  perceived_value_mismatch: "The product's value is not landing with buyers — positioning, not capability, is the constraint",
  awareness_gap: "Product discovery is the bottleneck — distribution reach, not product quality, limits growth",
  motivation_decay: "Retention is the structural problem — users start but don't stick, which erodes lifetime value",
};

// ═══════════════════════════════════════════════════════════════
//  SERVICE-ONLY CONSTRAINTS
//  These constraint IDs are only contextually meaningful for
//  service or business-model analyses. They should be suppressed
//  (skipped) when analysisType === "product".
// ═══════════════════════════════════════════════════════════════

export const SERVICE_ONLY_CONSTRAINTS = new Set<string>([
  "labor_intensity",        // "billable hours" — only relevant for service firms
  "owner_dependency",       // "founder bottleneck" — only relevant for service/BM
  "linear_scaling",         // "growth requires hiring" — only for people-scaled services
  "geographic_constraint",  // "value can only travel as far as your team" — service delivery
  "skill_scarcity",         // "talent you need is hard to find" — service delivery
  "manual_process",         // "paying people to do work that could be systematized" — service ops
  "operational_bottleneck", // "single process step choking throughput" — service delivery
]);

/**
 * Returns true if a constraint is only applicable in service/business-model contexts
 * and should be suppressed for product-mode analyses.
 */
export function isServiceOnlyConstraint(constraintName: string): boolean {
  return SERVICE_ONLY_CONSTRAINTS.has(constraintName);
}

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

/**
 * Translate a constraint name to mode-appropriate business language.
 * - For product mode: uses PRODUCT_CONSTRAINT_LANGUAGE when available,
 *   and skips service-only constraints (returns null).
 * - For other modes: delegates to translateConstraintToBusinessLanguage.
 *
 * Returns null if the constraint should be suppressed for the given mode.
 */
export function translateConstraintForMode(
  constraint: string,
  analysisType: "product" | "service" | "business_model" | string,
  fallback?: string,
): string | null {
  if (analysisType === "product") {
    // Suppress service-only constraints in product analyses
    if (isServiceOnlyConstraint(constraint)) return null;
    // Use product-specific label if available, otherwise fall back to generic
    const productLabel = PRODUCT_CONSTRAINT_LANGUAGE[constraint];
    if (productLabel) return productLabel;
  }
  return translateConstraintToBusinessLanguage(constraint, fallback);
}
