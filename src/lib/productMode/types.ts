/**
 * PRODUCT MODE TYPES — §6.0
 *
 * Shared type definitions for the product-mode strategic analysis pipeline.
 * These types are used across productConstraints, productOpportunities, and
 * productActionPlan modules to ensure a consistent interface for product-mode
 * consumers (UI cards, test assertions, narrative generators).
 */

// ═══════════════════════════════════════════════════════════════
//  PRODUCT CONSTRAINT
// ═══════════════════════════════════════════════════════════════

/**
 * A product-mode–specific constraint identified in the structural analysis.
 * Uses product-market language (unit economics, durability, supply chain)
 * rather than service-mode language (billable hours, owner bottleneck).
 */
export interface ProductConstraint {
  /** Stable identifier (e.g. "durability_risk", "unit_economics_pressure") */
  id: string;
  /** Short human-readable label (e.g. "Durability-as-competitive-gap") */
  label: string;
  /** One-paragraph product-market narrative */
  description: string;
  /** How severely this constraint limits the business */
  impact: "high" | "medium" | "low";
  /** The structural dimension this constraint belongs to */
  dimension: "product" | "channel" | "economics" | "supply_chain" | "market";
}

// ═══════════════════════════════════════════════════════════════
//  GTM STRATEGY
// ═══════════════════════════════════════════════════════════════

/**
 * Go-to-market strategy for a product opportunity.
 */
export interface GTMStrategy {
  /** Distribution channel (e.g. "DTC-first", "premium retail", "subscription") */
  channel: string;
  /** Positioning statement for the chosen channel */
  positioning: string;
  /** Concrete first move to validate the GTM hypothesis */
  firstMove: string;
  /** Expected timeline for the first GTM experiment */
  timeline: string;
}

// ═══════════════════════════════════════════════════════════════
//  PRODUCT OPPORTUNITY
// ═══════════════════════════════════════════════════════════════

/**
 * A product-mode–specific strategic opportunity.
 * Uses product-market language (DTC, durability moat, parts marketplace)
 * rather than service-mode language (aggregation, booking platform).
 */
export interface ProductOpportunity {
  /** Stable identifier (e.g. "durability_as_moat", "dtc_premium_channel") */
  id: string;
  /** Short human-readable label (e.g. "Durability-as-Moat") */
  label: string;
  /** One-sentence opportunity description */
  description: string;
  /** Go-to-market implication (what this means for channel and positioning) */
  gtmImplication: string;
  /** Why this creates durable economic advantage */
  economicRationale: string;
  /** Relevance score for this profile (0–10) */
  relevanceScore: number;
  /** Optional go-to-market strategy detail */
  gtmStrategy?: GTMStrategy;
}

// ═══════════════════════════════════════════════════════════════
//  PRODUCT ACTION
// ═══════════════════════════════════════════════════════════════

/**
 * A single phase in the 5-step product GTM action plan.
 * Each phase has a clear success gate (go/no-go) before advancing.
 */
export interface ProductAction {
  /** 1-indexed phase number (1–5) */
  phase: number;
  /** Phase label (e.g. "Validate Product-Market Fit") */
  label: string;
  /** Concrete action the founder/team should take */
  action: string;
  /** Measurable go/no-go gate before advancing to the next phase */
  successGate: string;
  /** Time horizon for this phase (e.g. "Weeks 1–4") */
  timeHorizon: string;
  /** Estimated capital required (optional, e.g. "$5,000–15,000") */
  cost?: string;
}
