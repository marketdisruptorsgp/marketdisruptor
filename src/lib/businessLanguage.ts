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
 * Mode-specific overrides ensure that service tropes (e.g. "billable hours")
 * never appear in product-mode analyses, and vice-versa.
 */

import { humanizeLabel } from "@/lib/humanize";
import type { InnovationMode } from "@/lib/diagnosticContext";

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
//  MODE-SPECIFIC OVERRIDES
//  Constraints whose plain-English framing differs materially
//  between product, service, and business-model analyses.
//  Only constraints with genuinely different semantics per-mode
//  are listed here — the shared map above remains the default.
// ═══════════════════════════════════════════════════════════════

/**
 * Per-mode constraint language overrides.
 *
 * Keys must be InnovationMode values ("product" | "service" | "business_model").
 * Inner keys are constraint IDs from CONSTRAINT_BUSINESS_LANGUAGE.
 * Only list constraints that need a genuinely different framing for that mode.
 *
 * Service mode inherits all defaults from CONSTRAINT_BUSINESS_LANGUAGE
 * (including "billable hours" for labor_intensity, which is appropriate).
 */
const CONSTRAINT_BUSINESS_LANGUAGE_BY_MODE: Partial<
  Record<InnovationMode, Partial<Record<string, string>>>
> = {
  product: {
    // In a product business, labor intensity is about manufacturing/support cost-per-unit,
    // NOT about billing hours to clients (which is a service concept).
    labor_intensity:
      "High labor costs per unit are compressing your margins — every new sale requires proportional headcount",
    // Owner dependency in product mode is about founder being a single point of failure in ops/R&D.
    owner_dependency:
      "Growth stalls when everything flows through you — your product operation needs systems that run without your constant input",
    // Linear scaling in product mode is about inability to grow revenue without adding headcount.
    linear_scaling:
      "Your product growth is directly tied to headcount — you haven't yet unlocked revenue that scales faster than your team",
  },
  business_model: {
    // Business model mode focuses on structural revenue constraints rather than operational ones.
    labor_intensity:
      "Your revenue model is structurally dependent on human effort — scaling revenue requires scaling cost at the same rate",
    linear_scaling:
      "Your business model scales linearly: more revenue means proportionally more cost or headcount, eliminating leverage",
  },
};

/**
 * Translate a constraint ID to entrepreneur-facing language, respecting the
 * active analysis mode so that service tropes like "billable hours" never
 * appear in product-mode output.
 *
 * Falls back to the shared map, then to an explicit fallback string, then to
 * a humanized version of the constraint ID.
 */
export function translateConstraintToBusinessLanguageForMode(
  constraint: string,
  mode: InnovationMode | null | undefined,
  fallback?: string,
): string {
  if (mode) {
    const modeOverride = CONSTRAINT_BUSINESS_LANGUAGE_BY_MODE[mode]?.[constraint];
    if (modeOverride) return modeOverride;
  }
  return translateConstraintToBusinessLanguage(constraint, fallback);
}
