/**
 * SERVICE MODE STRUCTURAL INFERENCE
 *
 * Mode-specific structural profile inference for service-based analyses.
 * Maps evidence about hours, team capacity, delivery scaling, and billing
 * to service-relevant structural facets.
 *
 * Key guarantee: never returns product-specific facets such as
 * durability_risk, repairability_friction, or feature_commoditization.
 */

import type { Evidence } from "@/lib/evidenceEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type IntensityLevel = "high" | "moderate" | "low" | "none";

export interface ServiceFacetProfile {
  /** How tightly revenue is coupled to hours worked */
  labor_intensity: IntensityLevel;
  /** Degree to which the business cannot function without its founding operator */
  owner_dependency: IntensityLevel;
  /** How much capacity exists to grow delivery without proportional headcount growth */
  delivery_scalability: IntensityLevel;
  /** Revenue model reliance on time-billed engagements */
  billable_hours: IntensityLevel;
}

// ═══════════════════════════════════════════════════════════════
//  KEYWORD PATTERNS
// ═══════════════════════════════════════════════════════════════

const LABOR_INTENSITY_SIGNALS = /billable\s*hours|hourly\s*rate|time.?based|time\s*for\s*money|labor.?intensive|manual\s*process|hands.?on|headcount|staffing|team\s*capacity|overwhelmed|burnout|overworked/gi;

const OWNER_DEPENDENCY_SIGNALS = /owner.?dependent|founder.?led|single\s*point\s*of\s*failure|can.?t\s*scale\s*without|bottleneck|relies\s*on\s*(me|you|founder|owner)|key\s*person\s*risk|operator.?dependent|founder\s*bottleneck/gi;

const DELIVERY_SCALABILITY_SIGNALS = /can.?t\s*scale|scaling\s*problem|hard\s*to\s*grow|constrained\s*capacity|capacity\s*ceiling|waitlist|backlog\s*growing|booked\s*out|turning\s*away\s*clients|leverage/gi;

const BILLABLE_HOURS_SIGNALS = /billable|per\s*hour|hourly|time\s*sheet|retainer|per\s*diem|day\s*rate|project\s*fee|engagement\s*fee|consulting\s*fee|service\s*fee/gi;

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function countMatches(corpus: string, pattern: RegExp): number {
  pattern.lastIndex = 0;
  return (corpus.match(pattern) ?? []).length;
}

function scoreToLevel(count: number): IntensityLevel {
  if (count >= 4) return "high";
  if (count >= 2) return "moderate";
  if (count >= 1) return "low";
  return "none";
}

// ═══════════════════════════════════════════════════════════════
//  MAIN INFERENCE FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Infer a service-mode structural profile from the evidence corpus.
 *
 * Only maps evidence to service-relevant dimensions.
 * Never produces product-mode facets (durability_risk, feature_commoditization).
 *
 * @param evidence - Array of evidence items extracted from the service analysis
 * @param _service - Service context (reserved for future category-specific weighting)
 */
export function inferServiceStructuralProfile(
  evidence: Evidence[],
  _service?: unknown,
): ServiceFacetProfile {
  const corpus = evidence
    .map(e => `${e.label ?? ""} ${e.description ?? ""}`)
    .join(" ");

  return {
    labor_intensity: scoreToLevel(countMatches(corpus, LABOR_INTENSITY_SIGNALS)),
    owner_dependency: scoreToLevel(countMatches(corpus, OWNER_DEPENDENCY_SIGNALS)),
    delivery_scalability: scoreToLevel(countMatches(corpus, DELIVERY_SCALABILITY_SIGNALS)),
    billable_hours: scoreToLevel(countMatches(corpus, BILLABLE_HOURS_SIGNALS)),
  };
}

// ═══════════════════════════════════════════════════════════════
//  BINDING CONSTRAINT SELECTION
// ═══════════════════════════════════════════════════════════════

/** Ordered list of service-mode constraint names, from most to least structurally critical */
const SERVICE_CONSTRAINT_PRIORITY: (keyof ServiceFacetProfile)[] = [
  "labor_intensity",
  "owner_dependency",
  "delivery_scalability",
  "billable_hours",
];

/**
 * Select 2–4 binding constraints from the service facet profile.
 *
 * Only returns service-relevant constraint names.
 * Never returns durability_risk, feature_commoditization, or other product-mode constraints.
 *
 * @param profile - Service facet profile from `inferServiceStructuralProfile`
 * @param _evidence - Evidence array (reserved for tie-breaking by evidence density)
 */
export function selectServiceBindingConstraints(
  profile: ServiceFacetProfile,
  _evidence?: Evidence[],
): string[] {
  const active = SERVICE_CONSTRAINT_PRIORITY.filter(key => {
    const level = profile[key];
    return level === "high" || level === "moderate";
  });

  if (active.length >= 2) return active.slice(0, 4);

  // Promote "low" signals to reach at least 2 constraints
  const low = SERVICE_CONSTRAINT_PRIORITY.filter(
    key => profile[key] === "low" && !active.includes(key),
  );
  const combined = [...active, ...low];
  if (combined.length >= 2) return combined.slice(0, 4);

  // Last resort: fill from the priority list regardless of signal level
  const fallback = SERVICE_CONSTRAINT_PRIORITY.filter(key => !combined.includes(key));
  return [...combined, ...fallback].slice(0, 4);
}
