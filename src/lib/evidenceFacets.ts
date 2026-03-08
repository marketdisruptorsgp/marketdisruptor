/**
 * EVIDENCE FACETS — Domain-Specific Structured Metadata
 *
 * Extends the Evidence model with typed metadata payloads (facets)
 * that vary by domain. Facets enable deterministic constraint detection
 * by providing structured fields rather than text-only evidence.
 *
 * Three facet domains:
 *   - ObjectFacets: physical product / object reinvention analysis
 *   - BusinessFacets: business acquisition / operational analysis
 *   - MarketFacets: market environment context
 *   - DemandFacets: customer demand constraints
 *
 * Facets are optional on Evidence items. When present, constraint
 * detection operates on structured fields; when absent, it falls
 * back to keyword-based detection with lower confidence.
 */

import type { Evidence } from "@/lib/evidenceEngine";

// ═══════════════════════════════════════════════════════════════
//  OBJECT REINVENTION FACETS
// ═══════════════════════════════════════════════════════════════

export type ComponentRole = "structural" | "functional" | "interface" | "aesthetic" | "safety";

export interface ObjectFacets {
  domain: "object";
  /** Role this component plays in the overall system */
  componentRole?: ComponentRole;
  /** Material class (polymer, steel, composite, wood, etc.) */
  materialClass?: string;
  /** Manufacturing method (injection_molding, cnc, casting, 3d_print, etc.) */
  manufacturingMethod?: string;
  /** Primary failure mode — what breaks or degrades */
  failureMode?: string;
  /** Maintenance burden level */
  maintenanceBurden?: "none" | "low" | "moderate" | "high";
  /** Specific usability/ergonomic limitation */
  ergonomicConstraint?: string;
  /** Where/how the product is used */
  usageContext?: string;
  /** What makes this component/product expensive */
  costDriver?: string;
  /** How often replaced or upgraded */
  replacementCycle?: string;
}

// ═══════════════════════════════════════════════════════════════
//  BUSINESS ACQUISITION FACETS
// ═══════════════════════════════════════════════════════════════

export interface ConcentrationRisk {
  type: "customer" | "vendor" | "geographic" | "channel";
  /** % revenue/dependency from largest entity */
  topEntityShare?: number;
  /** % revenue/dependency from top 3 entities */
  top3Share?: number;
}

export interface LaborProfile {
  intensity: "low" | "moderate" | "high";
  ownerDependency: boolean;
  /** Roles that are hard to replace */
  specializedRoles?: string[];
  /** Labor cost as % of revenue */
  laborCostRatio?: number;
}

export interface PricingArchitecture {
  model: "fixed" | "hourly" | "project" | "subscription" | "usage" | "hybrid";
  priceSettingPower: "weak" | "moderate" | "strong";
  contractDuration?: string;
  switchingCost: "low" | "moderate" | "high";
}

export interface MarginStructure {
  grossMargin?: number;
  adjustedEbitda?: number;
  marginTrend: "declining" | "stable" | "improving";
  /** Primary determinant of margin */
  marginDriver?: string;
}

export interface OperationalBottleneck {
  process: string;
  constraint: string;
  capacityUtilization?: number;
}

export interface BusinessFacets {
  domain: "business";
  concentrationRisk?: ConcentrationRisk;
  laborProfile?: LaborProfile;
  pricingArchitecture?: PricingArchitecture;
  marginStructure?: MarginStructure;
  operationalBottleneck?: OperationalBottleneck;
}

// ═══════════════════════════════════════════════════════════════
//  MARKET FACETS
// ═══════════════════════════════════════════════════════════════

export interface MarketFacets {
  domain: "market";
  marketGrowth?: "declining" | "stagnant" | "moderate" | "high";
  competitiveDensity?: "fragmented" | "moderate" | "concentrated" | "monopolistic";
  regulatoryEnvironment?: "permissive" | "moderate" | "restrictive" | "prohibitive";
}

// ═══════════════════════════════════════════════════════════════
//  DEMAND FACETS
// ═══════════════════════════════════════════════════════════════

export interface DemandFacets {
  domain: "demand";
  /** Awareness gap — target audience doesn't know the solution exists */
  awarenessGap?: boolean;
  /** Access constraint — solution exists but customers can't reach it */
  accessConstraint?: "geographic" | "financial" | "credential" | "knowledge";
  /** Motivation decay — customers start but don't persist */
  motivationDecay?: boolean;
  /** Perceived value mismatch — customers undervalue the offering */
  perceivedValueMismatch?: boolean;
  /** Trust barrier — customers skeptical of claims or provider */
  trustBarrier?: boolean;
}

// ═══════════════════════════════════════════════════════════════
//  UNION TYPE
// ═══════════════════════════════════════════════════════════════

export type EvidenceFacets = ObjectFacets | BusinessFacets | MarketFacets | DemandFacets;

// ═══════════════════════════════════════════════════════════════
//  FACET EXTRACTION — Infer from text evidence (graceful degradation)
// ═══════════════════════════════════════════════════════════════

/**
 * Attempt to extract structured facets from an evidence item's text fields.
 * Returns null if insufficient signal for facet inference.
 * This is a fallback — proper facets should be populated during ingestion.
 */
export function extractFacetsFromEvidence(evidence: Evidence): EvidenceFacets | null {
  const text = `${evidence.label} ${evidence.description || ""}`.toLowerCase();

  // Try business facets first (most common in current pipeline)
  const businessFacets = tryExtractBusinessFacets(text);
  if (businessFacets) return businessFacets;

  // Try object facets
  const objectFacets = tryExtractObjectFacets(text);
  if (objectFacets) return objectFacets;

  // Try demand facets
  const demandFacets = tryExtractDemandFacets(text);
  if (demandFacets) return demandFacets;

  // Try market facets
  const marketFacets = tryExtractMarketFacets(text);
  if (marketFacets) return marketFacets;

  return null;
}

// ── Business facet inference ──

function tryExtractBusinessFacets(text: string): BusinessFacets | null {
  const facets: BusinessFacets = { domain: "business" };
  let matched = false;

  // Labor profile
  if (text.match(/owner[\s-]?depend|key[\s-]?person|founder[\s-]?driven|single[\s-]?point/)) {
    facets.laborProfile = {
      intensity: "high",
      ownerDependency: true,
    };
    matched = true;
  } else if (text.match(/labor[\s-]?intensive|headcount|staffing|manual[\s-]?labor|workforce/)) {
    facets.laborProfile = {
      intensity: "high",
      ownerDependency: false,
    };
    matched = true;
  }

  // Concentration risk
  if (text.match(/customer[\s-]?concentration|single[\s-]?customer|top[\s-]?client|revenue[\s-]?dependent/)) {
    facets.concentrationRisk = { type: "customer" };
    matched = true;
  } else if (text.match(/vendor[\s-]?depend|single[\s-]?supplier|sole[\s-]?source/)) {
    facets.concentrationRisk = { type: "vendor" };
    matched = true;
  }

  // Pricing
  if (text.match(/hourly|per[\s-]?hour|time[\s-]?and[\s-]?material|billable[\s-]?hour/)) {
    facets.pricingArchitecture = { model: "hourly", priceSettingPower: "weak", switchingCost: "low" };
    matched = true;
  } else if (text.match(/project[\s-]?based|per[\s-]?project|fixed[\s-]?bid|quote[\s-]?based/)) {
    facets.pricingArchitecture = { model: "project", priceSettingPower: "moderate", switchingCost: "low" };
    matched = true;
  } else if (text.match(/subscription|recurring|monthly[\s-]?fee|annual[\s-]?contract/)) {
    facets.pricingArchitecture = { model: "subscription", priceSettingPower: "moderate", switchingCost: "moderate" };
    matched = true;
  }

  // Margin
  if (text.match(/margin[\s-]?compress|margin[\s-]?declin|shrinking[\s-]?margin|race[\s-]?to[\s-]?bottom/)) {
    facets.marginStructure = { marginTrend: "declining", marginDriver: "competitive pressure" };
    matched = true;
  }

  // Operational bottleneck
  if (text.match(/bottleneck|capacity[\s-]?constraint|throughput[\s-]?limit|backlog/)) {
    const processMatch = text.match(/bottleneck\s+(?:in|at|for)\s+(\w[\w\s]{2,30})/);
    facets.operationalBottleneck = {
      process: processMatch?.[1]?.trim() || "core operations",
      constraint: "throughput limited",
    };
    matched = true;
  }

  return matched ? facets : null;
}

// ── Object facet inference ──

function tryExtractObjectFacets(text: string): ObjectFacets | null {
  const facets: ObjectFacets = { domain: "object" };
  let matched = false;

  // Component role
  if (text.match(/structural|load[\s-]?bearing|frame|chassis|skeleton/)) {
    facets.componentRole = "structural"; matched = true;
  } else if (text.match(/button|handle|grip|interface|control|dial|screen/)) {
    facets.componentRole = "interface"; matched = true;
  } else if (text.match(/motor|engine|pump|actuator|sensor|mechanism/)) {
    facets.componentRole = "functional"; matched = true;
  } else if (text.match(/safety|guard|shield|protect|brake|fuse|failsafe/)) {
    facets.componentRole = "safety"; matched = true;
  }

  // Maintenance
  if (text.match(/high[\s-]?maintenance|frequent[\s-]?repair|constant[\s-]?upkeep|break[\s-]?down/)) {
    facets.maintenanceBurden = "high"; matched = true;
  } else if (text.match(/low[\s-]?maintenance|maintenance[\s-]?free|durable|long[\s-]?lasting/)) {
    facets.maintenanceBurden = "low"; matched = true;
  }

  // Manufacturing
  if (text.match(/injection[\s-]?mold|plastic[\s-]?mold/)) {
    facets.manufacturingMethod = "injection_molding"; matched = true;
  } else if (text.match(/3d[\s-]?print|additive[\s-]?manufactur/)) {
    facets.manufacturingMethod = "3d_print"; matched = true;
  } else if (text.match(/cnc|machined|milled|turned/)) {
    facets.manufacturingMethod = "cnc"; matched = true;
  } else if (text.match(/cast|forged|stamped/)) {
    facets.manufacturingMethod = "casting"; matched = true;
  }

  // Material
  if (text.match(/steel|metal|aluminum|iron|alloy/)) {
    facets.materialClass = "metal"; matched = true;
  } else if (text.match(/plastic|polymer|nylon|abs|pvc|polyethylene/)) {
    facets.materialClass = "polymer"; matched = true;
  } else if (text.match(/wood|timber|plywood|mdf/)) {
    facets.materialClass = "wood"; matched = true;
  } else if (text.match(/composite|carbon[\s-]?fiber|fiberglass/)) {
    facets.materialClass = "composite"; matched = true;
  }

  return matched ? facets : null;
}

// ── Demand facet inference ──

function tryExtractDemandFacets(text: string): DemandFacets | null {
  const facets: DemandFacets = { domain: "demand" };
  let matched = false;

  if (text.match(/awareness[\s-]?gap|don.?t[\s-]?know|unaware|unknown[\s-]?solution/)) {
    facets.awarenessGap = true; matched = true;
  }
  if (text.match(/can.?t[\s-]?access|out[\s-]?of[\s-]?reach|geographic[\s-]?limit|underserved[\s-]?area/)) {
    facets.accessConstraint = "geographic"; matched = true;
  } else if (text.match(/too[\s-]?expensive|can.?t[\s-]?afford|price[\s-]?barrier|cost[\s-]?prohibitive/)) {
    facets.accessConstraint = "financial"; matched = true;
  }
  if (text.match(/drop[\s-]?off|abandon|churn|don.?t[\s-]?persist|lose[\s-]?interest|motivation[\s-]?decay/)) {
    facets.motivationDecay = true; matched = true;
  }
  if (text.match(/trust|skeptic|credib|reputation[\s-]?risk|unproven/)) {
    facets.trustBarrier = true; matched = true;
  }

  return matched ? facets : null;
}

// ── Market facet inference ──

function tryExtractMarketFacets(text: string): MarketFacets | null {
  const facets: MarketFacets = { domain: "market" };
  let matched = false;

  if (text.match(/declining[\s-]?market|shrinking[\s-]?demand|sunset|commoditized[\s-]?market/)) {
    facets.marketGrowth = "declining"; matched = true;
  } else if (text.match(/high[\s-]?growth|rapid[\s-]?growth|booming|emerging[\s-]?market/)) {
    facets.marketGrowth = "high"; matched = true;
  }

  if (text.match(/fragmented|many[\s-]?small|cottage|dispersed[\s-]?player/)) {
    facets.competitiveDensity = "fragmented"; matched = true;
  } else if (text.match(/monopol|dominat|single[\s-]?player|duopoly/)) {
    facets.competitiveDensity = "monopolistic"; matched = true;
  }

  if (text.match(/heavily[\s-]?regulat|strict[\s-]?compliance|regulatory[\s-]?burden|license[\s-]?required/)) {
    facets.regulatoryEnvironment = "restrictive"; matched = true;
  }

  return matched ? facets : null;
}

// ═══════════════════════════════════════════════════════════════
//  BATCH FACET POPULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Populate facets on an array of evidence items that don't already have them.
 * Non-mutating — returns a new array.
 */
export function populateFacets(evidence: Evidence[]): Evidence[] {
  return evidence.map(ev => {
    if ((ev as any).facets) return ev;
    const facets = extractFacetsFromEvidence(ev);
    if (!facets) return ev;
    return { ...ev, facets } as Evidence & { facets: EvidenceFacets };
  });
}
