/**
 * Product Mode — Constraint Library
 *
 * Defines product-specific structural constraints and a deterministic selection
 * function. No LLM calls. All logic is pure and fully testable.
 *
 * Constraints here are ONLY relevant for physical or digital products — never
 * for service-mode or business-model-mode analysis. Service-mode patterns like
 * "billable hours" or "owner dependency" must never appear here.
 */

import type { ProductConstraint } from "./types";

// ═══════════════════════════════════════════════════════════════
//  CONSTRAINT TEMPLATE LIBRARY
// ═══════════════════════════════════════════════════════════════

export const PRODUCT_CONSTRAINT_TEMPLATES: ProductConstraint[] = [
  {
    id: "durability_gap",
    label: "Poor durability reduces customer lifetime value",
    narrative:
      "Users report premature failure (broken parts, flaking coatings, snapping frames). " +
      "Competitors that ignore durability create an opening for a brand that treats longevity as a feature.",
    evidenceKeywords: [
      "durability", "durable", "broke", "broken", "snap", "snapping", "crack", "cracking",
      "flake", "flaking", "peel", "peeling", "wear", "wearing out", "fell apart",
      "cheap", "fragile", "brittle", "deteriorat", "degrad",
    ],
    impact: "high",
  },
  {
    id: "repairability_friction",
    label: "Non-repairable design forces premature replacement",
    narrative:
      "Glued or proprietary components make user repair impossible, forcing replacement purchases " +
      "instead of low-cost part swaps. Right-to-repair advocates treat repairability as a purchase criterion.",
    evidenceKeywords: [
      "repair", "repairable", "irreparable", "can't fix", "cannot fix", "glued",
      "proprietary", "right to repair", "spare part", "replacement part", "inaccessible",
      "soldered", "sealed", "non-replaceable", "no replacement",
    ],
    impact: "high",
  },
  {
    id: "unit_economics_pressure",
    label: "Thin margins under mass-market price competition",
    narrative:
      "The product category is in a price race-to-the-bottom driven by low-cost manufacturers. " +
      "Without a defensible premium position, margins compress and reinvestment in R&D becomes impossible.",
    evidenceKeywords: [
      "cheap", "cheaper", "price", "pricing", "margin", "cost", "commodity", "undercut",
      "low-cost", "budget", "affordable", "expensive", "overpriced", "value for money",
      "price point", "race to the bottom", "competition on price",
    ],
    impact: "medium",
  },
  {
    id: "supply_chain_fragility",
    label: "Single-source supply chain creates fragility",
    narrative:
      "Dependence on a single supplier or manufacturing region concentrates risk. " +
      "Disruption in one node (weather, geopolitics, component shortage) can halt production entirely.",
    evidenceKeywords: [
      "supply chain", "supplier", "sourcing", "out of stock", "backorder", "shortage",
      "manufacturing", "factory", "component", "parts availability", "lead time",
      "single source", "dependency", "logistics", "import", "tariff",
    ],
    impact: "high",
  },
  {
    id: "feature_commoditization",
    label: "Core features commoditized — no differentiation",
    narrative:
      "All competitors offer the same feature set at similar price points. " +
      "Without a structural differentiator (material, mechanism, or ecosystem), the product competes on price alone.",
    evidenceKeywords: [
      "same as", "no different", "generic", "commodity", "indistinguishable", "similar",
      "copy", "clone", "knockoff", "me too", "feature parity", "comparable", "equivalent",
      "nothing special", "basic", "standard", "all the same", "identical", "nothing stands out",
      "can't tell", "cannot tell", "stands out", "look the same", "feel the same",
    ],
    impact: "medium",
  },
  {
    id: "battery_degradation",
    label: "Battery degradation limits product lifespan",
    narrative:
      "Rechargeable battery life degrades over 1-2 years, making the product feel disposable even if " +
      "all other components remain functional. Non-replaceable battery design amplifies perceived obsolescence.",
    evidenceKeywords: [
      "battery", "battery life", "battery degradation", "doesn't hold charge", "charge",
      "charging", "battery dead", "battery dies", "battery replacement", "wont charge",
      "short battery", "bad battery", "battery drains",
    ],
    impact: "high",
  },
  {
    id: "comfort_ergonomics_gap",
    label: "Comfort or ergonomics issues limit extended use",
    narrative:
      "Users report discomfort after extended use (pressure, heat, weight). " +
      "Ergonomic failure limits use cases and drives churn toward competitors with better fit.",
    evidenceKeywords: [
      "comfort", "uncomfortable", "pain", "hurts", "pressure", "heavy", "weight",
      "hot", "heat", "sweat", "fit", "clamp", "clamp force", "squeeze", "tight",
      "loose", "slipping", "ergonomic", "ergonomics",
    ],
    impact: "medium",
  },
  {
    id: "audio_quality_gap",
    label: "Sound quality lags behind competitor benchmark",
    narrative:
      "Objective or perceived audio quality (bass, clarity, noise cancellation) is rated below " +
      "comparable products at the same price point, reducing willingness to pay a premium.",
    evidenceKeywords: [
      "sound quality", "audio quality", "bass", "treble", "midrange", "clarity",
      "noise cancell", "anc", "passive noise", "tinny", "muffled", "distort",
      "eq", "equalizer", "flat", "dull sound", "poor audio",
    ],
    impact: "medium",
  },
  {
    id: "software_hardware_integration_gap",
    label: "Software/app experience undermines hardware quality",
    narrative:
      "Companion app is buggy, hard to use, or lacks features expected at the product's price tier. " +
      "Poor software erodes perceived product value even when hardware is competitive.",
    evidenceKeywords: [
      "app", "application", "software", "companion app", "bluetooth", "connection",
      "pairing", "connect", "disconnect", "drops", "glitch", "bug", "crash",
      "update", "firmware", "latency", "lag", "sync", "setup",
    ],
    impact: "medium",
  },
  {
    id: "customer_support_failure",
    label: "After-sales support erodes brand trust",
    narrative:
      "Warranty claims, returns, or support requests are handled poorly, amplifying negative word-of-mouth. " +
      "For a product with durability complaints, poor support multiplies brand damage.",
    evidenceKeywords: [
      "customer service", "support", "warranty", "return", "refund", "replacement",
      "no response", "ignored", "rude", "unhelpful", "slow", "waiting", "denied",
      "refused", "poor service", "terrible service",
    ],
    impact: "medium",
  },
];

// ═══════════════════════════════════════════════════════════════
//  SELECTION FUNCTION
// ═══════════════════════════════════════════════════════════════

export interface ConstraintSelectionResult {
  constraint: ProductConstraint;
  /** Evidence items that triggered this constraint's selection */
  matchedEvidence: string[];
}

/**
 * Deterministically selects product-relevant constraints based on evidence keywords.
 *
 * @param productCategory  Free-text description of the product (e.g. "over-ear headphones")
 * @param evidenceTexts    Array of evidence strings (review snippets, competitive signals, etc.)
 * @param maxConstraints   Maximum number of constraints to return (default: 5)
 * @returns Ordered array of constraints, highest-impact first, each with matched evidence
 */
export function selectProductConstraints(
  productCategory: string,
  evidenceTexts: string[],
  maxConstraints: number = 5,
): ConstraintSelectionResult[] {
  const lowerCategory = productCategory.toLowerCase();
  const lowerEvidence = evidenceTexts.map(e => e.toLowerCase());

  // Score each constraint by the number of evidence items that contain matching keywords
  const scored: Array<{ template: ProductConstraint; matches: string[]; score: number }> = [];

  for (const template of PRODUCT_CONSTRAINT_TEMPLATES) {
    const matchedEvidence: string[] = [];

    for (let i = 0; i < evidenceTexts.length; i++) {
      const evLower = lowerEvidence[i];
      const hasMatch = template.evidenceKeywords.some(kw => evLower.includes(kw));
      if (hasMatch) {
        matchedEvidence.push(evidenceTexts[i]);
      }
    }

    // Also check if the keyword appears in the product category itself
    const categoryMatch = template.evidenceKeywords.some(kw => lowerCategory.includes(kw));

    const score = matchedEvidence.length + (categoryMatch ? 0.5 : 0);

    // Only include constraints that have at least one evidence match or category match
    if (score > 0) {
      scored.push({ template, matches: matchedEvidence, score });
    }
  }

  // Sort: high-impact first, then by match count descending
  const impactOrder: Record<ProductConstraint["impact"], number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  scored.sort((a, b) => {
    const impactDiff = impactOrder[b.template.impact] - impactOrder[a.template.impact];
    if (impactDiff !== 0) return impactDiff;
    return b.score - a.score;
  });

  return scored.slice(0, maxConstraints).map(s => ({
    constraint: s.template,
    matchedEvidence: s.matches,
  }));
}
