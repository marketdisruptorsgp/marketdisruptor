/**
 * FACET EXTRACTION — Infer structured metadata from evidence text
 *
 * Extracts all three tiers:
 *   Tier 1: Structured facets via pattern matching
 *   Tier 2: Derived metrics via numeric/keyword extraction
 *   Tier 3: Raw constraint signals via snippet capture
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type {
  EvidenceFacets,
  BusinessFacets,
  ObjectFacets,
  DemandFacets,
  MarketFacets,
  DerivedMetric,
  RawConstraintSignal,
  EvidenceMetadata,
} from "./types";
import { FACET_SCHEMA_VERSION, SIGNAL_LIFECYCLE } from "./types";

// ═══════════════════════════════════════════════════════════════
//  TIER 1: STRUCTURED FACET EXTRACTION
// ═══════════════════════════════════════════════════════════════

export function extractFacetsFromEvidence(evidence: Evidence): EvidenceFacets | null {
  const text = `${evidence.label} ${evidence.description || ""}`.toLowerCase();

  const businessFacets = tryExtractBusinessFacets(text);
  if (businessFacets) return businessFacets;

  const objectFacets = tryExtractObjectFacets(text);
  if (objectFacets) return objectFacets;

  const demandFacets = tryExtractDemandFacets(text);
  if (demandFacets) return demandFacets;

  const marketFacets = tryExtractMarketFacets(text);
  if (marketFacets) return marketFacets;

  return null;
}

function tryExtractBusinessFacets(text: string): BusinessFacets | null {
  const facets: BusinessFacets = { domain: "business" };
  let matched = false;

  if (text.match(/owner[\s-]?depend|key[\s-]?person|founder[\s-]?driven|single[\s-]?point/)) {
    facets.laborProfile = { intensity: "high", ownerDependency: true };
    matched = true;
  } else if (text.match(/labor[\s-]?intensive|headcount|staffing|manual[\s-]?labor|workforce/)) {
    facets.laborProfile = { intensity: "high", ownerDependency: false };
    matched = true;
  }

  if (text.match(/customer[\s-]?concentration|single[\s-]?customer|top[\s-]?client|revenue[\s-]?dependent/)) {
    facets.concentrationRisk = { type: "customer" };
    matched = true;
  } else if (text.match(/vendor[\s-]?depend|single[\s-]?supplier|sole[\s-]?source/)) {
    facets.concentrationRisk = { type: "vendor" };
    matched = true;
  }

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

  if (text.match(/margin[\s-]?compress|margin[\s-]?declin|shrinking[\s-]?margin|race[\s-]?to[\s-]?bottom/)) {
    facets.marginStructure = { marginTrend: "declining", marginDriver: "competitive pressure" };
    matched = true;
  }

  if (text.match(/bottleneck|capacity[\s-]?constraint|throughput[\s-]?limit|backlog/)) {
    const processMatch = text.match(/bottleneck\s+(?:in|at|for)\s+(\w[\w\s]{2,30})/);
    facets.operationalBottleneck = {
      process: processMatch?.[1]?.trim() || "core operations",
      constraint: "throughput limited",
    };
    matched = true;
  }

  // V2: Extract capacity utilization if mentioned
  const capMatch = text.match(/(\d{1,3})%?\s*(?:capacity|utiliz)/);
  if (capMatch) {
    facets.capacityUtilization = parseInt(capMatch[1]) / 100;
    matched = true;
  }

  // V2: Extract cash cycle days
  const cashMatch = text.match(/(\d{1,3})\s*(?:day|days)\s*(?:to\s*)?(?:collect|payment|receivable|dso)/);
  if (cashMatch) {
    facets.cashCycleDays = parseInt(cashMatch[1]);
    matched = true;
  }

  return matched ? facets : null;
}

function tryExtractObjectFacets(text: string): ObjectFacets | null {
  const facets: ObjectFacets = { domain: "object" };
  let matched = false;

  if (text.match(/structural|load[\s-]?bearing|frame|chassis|skeleton/)) {
    facets.componentRole = "structural"; matched = true;
  } else if (text.match(/button|handle|grip|interface|control|dial|screen/)) {
    facets.componentRole = "interface"; matched = true;
  } else if (text.match(/motor|engine|pump|actuator|sensor|mechanism/)) {
    facets.componentRole = "functional"; matched = true;
  } else if (text.match(/safety|guard|shield|protect|brake|fuse|failsafe/)) {
    facets.componentRole = "safety"; matched = true;
  }

  if (text.match(/high[\s-]?maintenance|frequent[\s-]?repair|constant[\s-]?upkeep|break[\s-]?down/)) {
    facets.maintenanceBurden = "high"; matched = true;
  } else if (text.match(/low[\s-]?maintenance|maintenance[\s-]?free|durable|long[\s-]?lasting/)) {
    facets.maintenanceBurden = "low"; matched = true;
  }

  if (text.match(/injection[\s-]?mold|plastic[\s-]?mold/)) {
    facets.manufacturingMethod = "injection_molding"; matched = true;
  } else if (text.match(/3d[\s-]?print|additive[\s-]?manufactur/)) {
    facets.manufacturingMethod = "3d_print"; matched = true;
  } else if (text.match(/cnc|machined|milled|turned/)) {
    facets.manufacturingMethod = "cnc"; matched = true;
  } else if (text.match(/cast|forged|stamped/)) {
    facets.manufacturingMethod = "casting"; matched = true;
  }

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
//  TIER 2: DERIVED METRIC EXTRACTION
// ═══════════════════════════════════════════════════════════════

export function extractDerivedMetrics(evidence: Evidence): DerivedMetric[] {
  const text = `${evidence.label} ${evidence.description || ""}`.toLowerCase();
  const metrics: DerivedMetric[] = [];

  // Capacity utilization
  const capMatch = text.match(/(\d{1,3})%?\s*(?:capacity|utiliz)/);
  if (capMatch) {
    metrics.push({
      key: "capacity_utilization",
      value: parseInt(capMatch[1]) / 100,
      unit: "ratio",
      derivation: "extracted",
      confidence: 0.7,
      sourceEvidenceId: evidence.id,
    });
  }

  // Collection days / DSO
  const dsoMatch = text.match(/(\d{1,3})\s*(?:day|days)\s*(?:to\s*)?(?:collect|payment|receivable|dso)/);
  if (dsoMatch) {
    metrics.push({
      key: "collection_days",
      value: parseInt(dsoMatch[1]),
      unit: "days",
      derivation: "extracted",
      confidence: 0.75,
      sourceEvidenceId: evidence.id,
    });
  }

  // Margin percentage
  const marginMatch = text.match(/(\d{1,3})%?\s*(?:margin|gross\s*margin|ebitda)/);
  if (marginMatch) {
    metrics.push({
      key: "margin_percentage",
      value: parseInt(marginMatch[1]) / 100,
      unit: "ratio",
      derivation: "extracted",
      confidence: 0.65,
      sourceEvidenceId: evidence.id,
    });
  }

  // Revenue concentration percentage
  const concMatch = text.match(/(\d{1,3})%?\s*(?:of\s*)?(?:revenue|sales)\s*(?:from|comes?\s*from)/);
  if (concMatch) {
    metrics.push({
      key: "revenue_concentration",
      value: parseInt(concMatch[1]) / 100,
      unit: "ratio",
      derivation: "extracted",
      confidence: 0.7,
      sourceEvidenceId: evidence.id,
    });
  }

  // Labor cost ratio
  const laborMatch = text.match(/labor\s*(?:cost)?\s*(?:is\s*)?(\d{1,3})%/);
  if (laborMatch) {
    metrics.push({
      key: "labor_cost_ratio",
      value: parseInt(laborMatch[1]) / 100,
      unit: "ratio",
      derivation: "extracted",
      confidence: 0.7,
      sourceEvidenceId: evidence.id,
    });
  }

  return metrics;
}

// ═══════════════════════════════════════════════════════════════
//  TIER 3: RAW SIGNAL EXTRACTION
// ═══════════════════════════════════════════════════════════════

let rawSignalCounter = 0;

/**
 * Extract raw constraint signals from evidence text.
 * These are unstructured snippets that may indicate constraints
 * but don't fit cleanly into structured facets.
 */
export function extractRawSignals(evidence: Evidence): RawConstraintSignal[] {
  const text = `${evidence.label} ${evidence.description || ""}`;
  const signals: RawConstraintSignal[] = [];

  // Constraint-indicative patterns that aren't covered by structured facets
  const constraintPatterns: { pattern: RegExp; constraint: string }[] = [
    { pattern: /(?:always|constantly|frequently)\s+(?:running\s+out|short\s+on|lacking)/i, constraint: "resource_scarcity" },
    { pattern: /(?:wait|waiting|queue|delay)\s+(?:time|period|list)/i, constraint: "capacity_ceiling" },
    { pattern: /(?:can't|cannot|unable\s+to)\s+(?:scale|grow|expand)/i, constraint: "linear_scaling" },
    { pattern: /(?:compliance|regulatory|legal)\s+(?:cost|burden|overhead)/i, constraint: "regulatory_barrier" },
    { pattern: /(?:seasonal|cyclical|volatile)\s+(?:demand|revenue|cash)/i, constraint: "demand_volatility" },
    { pattern: /(?:aging|retirement|succession)\s+(?:owner|founder|workforce)/i, constraint: "owner_dependency" },
    { pattern: /(?:price|pricing)\s+(?:war|pressure|erosion|squeeze)/i, constraint: "commoditized_pricing" },
    { pattern: /(?:inventory|stock)\s+(?:risk|waste|write[\s-]?off|obsolescence)/i, constraint: "inventory_burden" },
  ];

  for (const { pattern, constraint } of constraintPatterns) {
    const match = text.match(pattern);
    if (match && signals.length < SIGNAL_LIFECYCLE.MAX_RAW_SIGNALS_PER_EVIDENCE) {
      // Extract a contextual snippet around the match
      const matchIndex = match.index || 0;
      const start = Math.max(0, matchIndex - 30);
      const end = Math.min(text.length, matchIndex + match[0].length + 30);
      const snippet = text.slice(start, end).trim();

      signals.push({
        id: `rs-${++rawSignalCounter}`,
        snippet,
        mappedConstraint: constraint,
        activationCount: 0,
        status: "active",
        createdAt: Date.now(),
        sourceEvidenceId: evidence.id,
      });
    }
  }

  return signals;
}

// ═══════════════════════════════════════════════════════════════
//  RAW SIGNAL LIFECYCLE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Apply lifecycle rules to raw signals:
 * - Signals with activationCount >= PROMOTE_THRESHOLD → status: "promoted"
 * - Signals older than ARCHIVE_AGE_MS with activationCount <= ARCHIVE_THRESHOLD → status: "archived"
 */
export function applySignalLifecycle(signals: RawConstraintSignal[]): RawConstraintSignal[] {
  const now = Date.now();
  return signals.map(s => {
    if (s.status !== "active") return s;

    if (s.activationCount >= SIGNAL_LIFECYCLE.PROMOTE_THRESHOLD) {
      return { ...s, status: "promoted" as const };
    }

    if (
      now - s.createdAt > SIGNAL_LIFECYCLE.ARCHIVE_AGE_MS &&
      s.activationCount <= SIGNAL_LIFECYCLE.ARCHIVE_THRESHOLD
    ) {
      return { ...s, status: "archived" as const };
    }

    return s;
  });
}

/**
 * Convert a promoted raw signal into a derived metric.
 * Returns null if the signal doesn't contain extractable numeric data.
 */
export function promoteSignalToMetric(signal: RawConstraintSignal): DerivedMetric | null {
  if (signal.status !== "promoted" || !signal.mappedConstraint) return null;

  return {
    key: `promoted_${signal.mappedConstraint}`,
    value: signal.activationCount,
    unit: "activation_count",
    derivation: "inferred",
    confidence: Math.min(0.9, 0.5 + signal.activationCount * 0.05),
    sourceEvidenceId: signal.sourceEvidenceId,
  };
}

// ═══════════════════════════════════════════════════════════════
//  COMPOSITE EXTRACTION — All three tiers
// ═══════════════════════════════════════════════════════════════

/**
 * Extract full three-tier metadata from a single evidence item.
 */
export function extractFullMetadata(evidence: Evidence): EvidenceMetadata {
  return {
    schemaVersion: FACET_SCHEMA_VERSION,
    facets: extractFacetsFromEvidence(evidence) ?? undefined,
    derivedMetrics: extractDerivedMetrics(evidence),
    rawSignals: extractRawSignals(evidence),
  };
}

/**
 * Populate three-tier metadata on an array of evidence items.
 * Non-mutating — returns new array with metadata attached.
 */
export function populateMetadata(evidence: Evidence[]): (Evidence & { metadata: EvidenceMetadata })[] {
  return evidence.map(ev => {
    const metadata = extractFullMetadata(ev);
    // Also set facets on the evidence for backward compatibility
    const updatedEv = metadata.facets ? { ...ev, facets: metadata.facets } : ev;
    return { ...updatedEv, metadata };
  });
}
