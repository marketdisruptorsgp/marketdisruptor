/**
 * Product Mode — Shared TypeScript interfaces
 *
 * These types are the canonical contract for product-category-aware
 * constraint selection, opportunity selection, and action-plan generation.
 * All logic using these types must be deterministic (no LLM calls).
 */

/** A structural risk that limits growth or defensibility for a physical/digital product */
export interface ProductConstraint {
  /** Unique identifier used to cross-reference with opportunities and action plan */
  id: string;
  /** Short label shown in the UI (≤ 8 words) */
  label: string;
  /** 1-2 sentence explanation of why this constraint matters for this type of product */
  narrative: string;
  /**
   * Keywords that, when found in evidence text, indicate this constraint is active.
   * Matching is case-insensitive; any single match activates the constraint.
   */
  evidenceKeywords: string[];
  /** Severity of the constraint's impact on the business */
  impact: "high" | "medium" | "low";
}

/** A product-market fit lever that turns a constraint into a competitive advantage */
export interface ProductOpportunity {
  /** Unique identifier */
  id: string;
  /** Short label shown in the UI (≤ 8 words) */
  label: string;
  /** Brief explanation of the opportunity (1-2 sentences) */
  narrative: string;
  /**
   * Conditions that must be true before this opportunity is worth pursuing.
   * Written as human-readable strings, e.g. "durability_complaint_rate > 20%".
   * Used by `selectProductOpportunities()` to gate selection.
   */
  preconditions: string[];
  /**
   * How pursuing this opportunity changes the go-to-market strategy —
   * specifically pricing, messaging, and distribution.
   */
  gtmImplication: string;
  /** Why competitors cannot quickly copy this move */
  defensibility: string;
  /** Human-readable estimate of how long until a well-funded competitor can respond */
  timelineToCompetition: string;
}

/** A single phase in a product validation or launch roadmap */
export interface ProductAction {
  /** Phase number (1 = first) */
  phase: number;
  /** Human-readable week span, e.g. "Week 1-2" */
  weekRange: string;
  /** Short action title shown in the timeline (≤ 8 words) */
  title: string;
  /** The falsifiable question this phase is designed to answer */
  hypothesis: string;
  /**
   * Binary go/no-go gates.  Each string must describe a measurable outcome
   * with a specific threshold (e.g. "≥36/50 surveyed users say 'definitely'").
   * Vague goals like "explore interest" are not allowed.
   */
  successCriteria: string[];
  /** What happens next if the phase fails its success criteria */
  failureFallback: string;
  /** Realistic cost range for this phase, e.g. "$5K" or "$8K-$15K" */
  estimatedCost: string;
  /** Realistic founder / small-team time commitment, e.g. "20 hours" */
  estimatedTimeCommitment: string;
}

/** Complete go-to-market strategy for a product opportunity */
export interface GTMStrategy {
  /** How the product is positioned relative to competitors */
  positioning: string;
  /** Pricing approach and rationale */
  pricingApproach: string;
  /** Primary distribution channel */
  distributionChannel: string;
  /** Core message that resonates with the target customer */
  messagingHook: string;
  /** Structural moat that makes the position defensible */
  defensibilityMoat: string;
}
