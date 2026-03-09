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

  // ── Labor Profile ──
  if (text.match(/owner[\s-]?depend|key[\s-]?person|founder[\s-]?driven|single[\s-]?point|practitioner[\s-]?depend|solo[\s-]?practitioner/)) {
    facets.laborProfile = { intensity: "high", ownerDependency: true };
    matched = true;
  } else if (text.match(
    /labor[\s-]?intensive|headcount|staffing|manual[\s-]?labor|workforce|staff[\s-]?shortage|hiring[\s-]?difficult|talent[\s-]?scarcit|employee[\s-]?turnover|turnover[\s-]?rate|retention[\s-]?challenge|recruitment|hard[\s-]?to[\s-]?hire|skilled[\s-]?labor|hygienist|technician[\s-]?shortage|dentist[\s-]?shortage|nurse[\s-]?shortage|labor[\s-]?cost|personnel[\s-]?cost|payroll|wages?\s+(?:are|represent|account)|compensation|(?:staff|team|crew|employee)[\s-]?(?:depend|relian)|human[\s-]?capital|labor[\s-]?market|revenue[\s-]?(?:scales?|tied|linked|proportional)\s*(?:linearly|directly)?\s*(?:with|to)\s*headcount|revenue[\s-]?per[\s-]?(?:employee|worker|provider|clinician)|production[\s-]?(?:capacity|output)\s+(?:limited|constrained|tied)\s+(?:by|to)\s+(?:staff|people|labor)/
  )) {
    facets.laborProfile = { intensity: "high", ownerDependency: false };
    matched = true;
  } else if (text.match(
    /automat|self[\s-]?service|unmanned|minimal[\s-]?staff|low[\s-]?labor|capital[\s-]?intensive(?!\s*labor)/
  )) {
    facets.laborProfile = { intensity: "low", ownerDependency: false };
    matched = true;
  }

  // ── Concentration Risk ──
  if (text.match(/customer[\s-]?concentration|single[\s-]?customer|top[\s-]?client|revenue[\s-]?dependent|few[\s-]?large[\s-]?(?:client|account|customer)|client[\s-]?concentration/)) {
    facets.concentrationRisk = { type: "customer" };
    matched = true;
  } else if (text.match(/vendor[\s-]?depend|single[\s-]?supplier|sole[\s-]?source|supply[\s-]?chain[\s-]?concentrat|supplier[\s-]?depend/)) {
    facets.concentrationRisk = { type: "vendor" };
    matched = true;
  } else if (text.match(/insurance[\s-]?(?:depend|relian|reimburse|payer|dominat)|payer[\s-]?mix|third[\s-]?party[\s-]?payer|reimburse[\s-]?rate|insurance[\s-]?company|managed[\s-]?care/)) {
    facets.concentrationRisk = { type: "customer" };
    matched = true;
  }

  // ── Pricing Architecture ──
  if (text.match(
    /hourly[\s-]?(?:rate|billing|charge|fee|pricing)|(?:bill|charg|pric)[\w]*[\s-]?(?:per|by)[\s-]?(?:the[\s-]?)?hour|time[\s-]?and[\s-]?material|billable[\s-]?hour|per[\s-]?visit|fee[\s-]?for[\s-]?service|per[\s-]?appointment|per[\s-]?procedure|procedure[\s-]?based|per[\s-]?treatment|per[\s-]?session|per[\s-]?job|per[\s-]?wash|per[\s-]?clean|transactional[\s-]?(?:revenue|pricing|model)|pay[\s-]?per[\s-]?use/
  )) {
    facets.pricingArchitecture = { model: "hourly", priceSettingPower: "weak", switchingCost: "low" };
    matched = true;
  } else if (text.match(/project[\s-]?based|per[\s-]?project|fixed[\s-]?bid|quote[\s-]?based|contract[\s-]?based|flat[\s-]?(?:rate|fee)/)) {
    facets.pricingArchitecture = { model: "project", priceSettingPower: "moderate", switchingCost: "low" };
    matched = true;
  } else if (text.match(/subscription|recurring|monthly[\s-]?fee|annual[\s-]?contract|membership[\s-]?(?:fee|model|based|dues|revenue)|retainer|ongoing[\s-]?(?:fee|contract)/)) {
    facets.pricingArchitecture = { model: "subscription", priceSettingPower: "moderate", switchingCost: "moderate" };
    matched = true;
  }

  // Detect weak price-setting power independently
  if (text.match(
    /weak[\s-]?price[\s-]?setting|no[\s-]?pricing[\s-]?power|race[\s-]?to[\s-]?(?:the[\s-]?)?bottom|commoditized[\s-]?pric|price[\s-]?taker|price[\s-]?(?:pressure|squeeze|competition|war|erosion|sensitive)|downward[\s-]?price|insurance[\s-]?(?:sets?|controls?|dictates?|determines?)\s*(?:the\s*)?(?:price|rate|fee|reimburse)|reimburse[\s-]?rate[\s-]?(?:declin|compress|squeez|pressur|low|set\s+by)|negotiated[\s-]?rate|payer[\s-]?(?:pressure|squeeze)/
  )) {
    if (!facets.pricingArchitecture) {
      facets.pricingArchitecture = { model: "fixed", priceSettingPower: "weak", switchingCost: "low" };
    } else {
      facets.pricingArchitecture = { ...facets.pricingArchitecture, priceSettingPower: "weak" };
    }
    matched = true;
  }

  // ── Margin Structure ──
  if (text.match(
    /margin[\s-]?compress|margin[\s-]?declin|shrinking[\s-]?margin|race[\s-]?to[\s-]?bottom|tight[\s-]?margin|thin[\s-]?margin|low[\s-]?margin|margin[\s-]?pressure|overhead[\s-]?(?:high|rising|increas|burden)|rising[\s-]?(?:cost|expense|overhead)|cost[\s-]?(?:pressure|squeeze|escalat|increas)/
  )) {
    facets.marginStructure = { marginTrend: "declining", marginDriver: "competitive pressure" };
    matched = true;
  } else if (text.match(
    /high[\s-]?margin|strong[\s-]?margin|healthy[\s-]?margin|premium[\s-]?pric|pricing[\s-]?power|margin[\s-]?(?:expan|growth|improv)/
  )) {
    facets.marginStructure = { marginTrend: "stable", marginDriver: "pricing power" };
    matched = true;
  }

  // ── Operational Bottleneck / Capacity ──
  if (text.match(
    /bottleneck|capacity[\s-]?constraint|throughput[\s-]?limit|backlog|congestion|queue|wait[\s-]?(?:time|list)|waiting[\s-]?(?:time|list|room)|appointment[\s-]?(?:backlog|wait|availab|delay|lead[\s-]?time|book(?:ed|ing)\s+(?:out|weeks|months|far))|schedul[\w]*[\s-]?(?:full|constrain|limit|pressure|difficult|tight)|fully[\s-]?booked|no[\s-]?(?:open|available)\s+(?:slot|appointment|time)|chair[\s-]?(?:utiliz|time|occupan)|bay[\s-]?(?:utiliz|occupan)|room[\s-]?(?:utiliz|occupan|turnover)|table[\s-]?(?:turnover|utiliz|turn\s+time)|equipment[\s-]?(?:utiliz|idle|downtime)|idle[\s-]?(?:time|capacity|equipment|asset|resource)|underutiliz|(?:at|near|approaching)\s+(?:full\s+)?capacity|capacity[\s-]?(?:ceiling|cap|max|limited)|peak[\s-]?(?:hour|time|demand|period|capacity)|demand[\s-]?(?:exceed|outstrip|outpace)\s*(?:capacity|supply)/
  )) {
    const processMatch = text.match(/(?:bottleneck|constraint|limit)\s+(?:in|at|for|is)\s+(\w[\w\s]{2,30})/);
    facets.operationalBottleneck = {
      process: processMatch?.[1]?.trim() || "core operations",
      constraint: "throughput limited",
    };
    matched = true;
  }

  // ── Capacity Utilization (numeric) ──
  const capMatch = text.match(/(\d{1,3})%?\s*(?:capacity|utiliz|occupan)/);
  if (capMatch) {
    facets.capacityUtilization = parseInt(capMatch[1]) / 100;
    matched = true;
  }

  // ── Cash Cycle Days ──
  const cashMatch = text.match(/(\d{1,3})\s*(?:day|days)\s*(?:to\s*)?(?:collect|payment|receivable|dso|pay[\s-]?cycle|billing[\s-]?cycle)/);
  if (cashMatch) {
    facets.cashCycleDays = parseInt(cashMatch[1]);
    matched = true;
  }

  // ── Technology / Automation Gap ──
  if (text.match(
    /manual[\s-]?(?:process|workflow|entry|data|record|paper|booking)|paper[\s-]?(?:based|record|form|chart)|legacy[\s-]?(?:system|software|technology)|outdated[\s-]?(?:system|technology|software|equipment)|tech[\s-]?(?:debt|gap|lag)|no[\s-]?(?:automation|software|system|digital)|digitiz|lack[\s-]?of[\s-]?(?:technolog|automation|software)/
  )) {
    if (!facets.operationalBottleneck) {
      facets.operationalBottleneck = { process: "manual processes", constraint: "automation gap" };
    }
    matched = true;
  }

  // ── Fixed Cost Burden ──
  if (text.match(
    /(?:high|significant|substantial|heavy)\s+(?:fixed[\s-]?cost|overhead|rent|lease|mortgage)|fixed[\s-]?cost[\s-]?(?:heavy|burden|structure|high)|(?:rent|lease|facility|equipment)\s+(?:cost|expense|payment)\s+(?:high|significant|represent|account)/
  )) {
    if (!facets.marginStructure) {
      facets.marginStructure = { marginTrend: "declining", marginDriver: "fixed cost leverage" };
    }
    matched = true;
  }

  // ── Geographic Constraint ──
  if (text.match(
    /geographic[\s-]?(?:limit|constrain|bound|radius|barrier)|service[\s-]?(?:area|radius|territory|zone)|local[\s-]?(?:market|only|bound)|trade[\s-]?area|drive[\s-]?(?:time|distance)|commute|catchment|limited[\s-]?(?:radius|reach|geography)/
  )) {
    if (!facets.concentrationRisk) {
      facets.concentrationRisk = { type: "geographic" as any };
    }
    matched = true;
  }

  // ── Seasonal / Cyclical ──
  if (text.match(
    /seasonal|cyclical|off[\s-]?season|peak[\s-]?season|demand[\s-]?(?:fluctuat|volatil|variab|unpredict)|uneven[\s-]?(?:demand|revenue|cash[\s-]?flow)|lumpy[\s-]?(?:revenue|demand|cash)/
  )) {
    if (!facets.operationalBottleneck) {
      facets.operationalBottleneck = { process: "demand pattern", constraint: "demand volatility" };
    }
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

  if (text.match(/awareness[\s-]?gap|don.?t[\s-]?know|unaware|unknown[\s-]?solution|low[\s-]?awareness|brand[\s-]?(?:recognition|awareness)|discovery[\s-]?problem|hard[\s-]?to[\s-]?find|visib[\w]*[\s-]?(?:low|poor|limited)/)) {
    facets.awarenessGap = true; matched = true;
  }
  if (text.match(/can.?t[\s-]?access|out[\s-]?of[\s-]?reach|geographic[\s-]?limit|underserved[\s-]?area|food[\s-]?desert|care[\s-]?desert|access[\s-]?(?:barrier|gap|issue|problem)|transportation[\s-]?barrier|rural|remote[\s-]?(?:area|location|communit)/)) {
    facets.accessConstraint = "geographic"; matched = true;
  } else if (text.match(/too[\s-]?expensive|can.?t[\s-]?afford|price[\s-]?barrier|cost[\s-]?prohibitive|uninsured|out[\s-]?of[\s-]?pocket|deductible[\s-]?(?:high|barrier)|financial[\s-]?barrier|price[\s-]?sensitive|budget[\s-]?constrain|affordab/)) {
    facets.accessConstraint = "financial"; matched = true;
  }
  if (text.match(/drop[\s-]?off|abandon|churn|don.?t[\s-]?persist|lose[\s-]?interest|motivation[\s-]?decay|customer[\s-]?(?:churn|attrition|loss|defect)|member[\s-]?(?:churn|cancel|attrition)|retention[\s-]?(?:problem|issue|challenge|low|poor)|high[\s-]?(?:churn|attrition|cancel)|cancel[\s-]?rate/)) {
    facets.motivationDecay = true; matched = true;
  }
  if (text.match(/trust|skeptic|credib|reputation[\s-]?risk|unproven|review[\s-]?(?:depend|driven|importan)|word[\s-]?of[\s-]?mouth|referral[\s-]?(?:depend|driven|based|importan)|social[\s-]?proof|testimonial|online[\s-]?(?:review|rating|reputation)/)) {
    facets.trustBarrier = true; matched = true;
  }
  if (text.match(/switching[\s-]?cost|lock[\s-]?in|vendor[\s-]?lock|sticky|habit|inertia|relationship[\s-]?(?:driven|dependent|based)|loyalty|long[\s-]?term[\s-]?(?:relationship|client|patient|customer)/)) {
    facets.trustBarrier = true; matched = true;
  }

  return matched ? facets : null;
}

function tryExtractMarketFacets(text: string): MarketFacets | null {
  const facets: MarketFacets = { domain: "market" };
  let matched = false;

  if (text.match(/declining[\s-]?market|shrinking[\s-]?demand|sunset|commoditized[\s-]?market|market[\s-]?(?:declin|contract|shrink|mature|saturat)|flat[\s-]?(?:growth|market|demand)|stagnant|no[\s-]?growth|slow[\s-]?growth|population[\s-]?(?:declin|shrink|flat|stagnant)/)) {
    facets.marketGrowth = "declining"; matched = true;
  } else if (text.match(/high[\s-]?growth|rapid[\s-]?growth|booming|emerging[\s-]?market|growing[\s-]?(?:market|demand|population|segment)|population[\s-]?(?:growth|increas|boom)|demand[\s-]?(?:increas|grow|rising|surge)/)) {
    facets.marketGrowth = "high"; matched = true;
  } else if (text.match(/stable[\s-]?(?:market|demand|growth)|steady[\s-]?(?:demand|market|growth)|mature[\s-]?market|established[\s-]?market/)) {
    facets.marketGrowth = "stagnant"; matched = true;
  }

  if (text.match(/fragmented|many[\s-]?small|cottage|dispersed[\s-]?player|no[\s-]?dominant|low[\s-]?concentration|highly[\s-]?competitive|intense[\s-]?competition|many[\s-]?competitor|crowded[\s-]?market|competitive[\s-]?(?:landscape|market|pressure|intensity)|(?:hundreds?|thousands?)\s+of[\s-]?(?:competitor|provider|practice|operator|player)/)) {
    facets.competitiveDensity = "fragmented"; matched = true;
  } else if (text.match(/monopol|dominat|single[\s-]?player|duopoly|oligopol|(?:few|2|3|two|three)\s+(?:major|large|dominant)\s+(?:player|competitor|company)/)) {
    facets.competitiveDensity = "monopolistic"; matched = true;
  } else if (text.match(/dso[\s-]?(?:chain|group|corporate)|corporate[\s-]?(?:chain|consolidat|roll[\s-]?up)|private[\s-]?equity|consolidat[\w]*[\s-]?(?:trend|wave|pressure)|roll[\s-]?up|aggregat/)) {
    facets.competitiveDensity = "concentrated"; matched = true;
  }

  if (text.match(/heavily[\s-]?regulat|strict[\s-]?compliance|regulatory[\s-]?burden|license[\s-]?required|licens[\w]+|permit[\s-]?required|(?:state|federal|government|hipaa|osha)\s+(?:regulat|compliance|requirement|mandated)|compliance[\s-]?(?:cost|burden|requirement|complex)|zoning|inspection[\s-]?(?:required|mandate)/)) {
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
    // Expanded: natural language patterns from AI evidence
    { pattern: /staffing\s+(?:shortage|challenge|difficult|crisis)/i, constraint: "labor_intensity" },
    { pattern: /(?:hiring|recruit)\s+(?:difficult|challenge|hard|competitive)/i, constraint: "labor_intensity" },
    { pattern: /employee\s+(?:turnover|retention|attrition)/i, constraint: "labor_intensity" },
    { pattern: /revenue\s+(?:scales?|tied|linked)\s+(?:linearly|directly|proportional)/i, constraint: "linear_scaling" },
    { pattern: /insurance\s+(?:reimburse|payer|dictate|control|set)/i, constraint: "commoditized_pricing" },
    { pattern: /(?:appointment|schedule|booking)\s+(?:backlog|full|constrain|weeks?\s+out)/i, constraint: "capacity_ceiling" },
    { pattern: /(?:chair|bay|room|table|equipment)\s+(?:utiliz|idle|occupan)/i, constraint: "asset_underutilization" },
    { pattern: /(?:fixed|high|significant)\s+(?:overhead|rent|lease|facility)\s+cost/i, constraint: "margin_compression" },
    { pattern: /(?:manual|paper|legacy)\s+(?:process|system|workflow|record)/i, constraint: "operational_bottleneck" },
    { pattern: /(?:referral|word[\s-]?of[\s-]?mouth|reputation)\s+(?:depend|driven|based|critical)/i, constraint: "channel_dependency" },
    { pattern: /(?:geographic|local|radius|territory)\s+(?:limit|constrain|bound)/i, constraint: "geographic_constraint" },
    { pattern: /(?:member|customer|patient)\s+(?:churn|cancel|attrition|loss)/i, constraint: "demand_volatility" },
    { pattern: /(?:peak|off[\s-]?peak|seasonal)\s+(?:demand|hour|period|fluctuat)/i, constraint: "demand_volatility" },
    { pattern: /(?:cost|expense|overhead)\s+(?:rising|increas|escalat|growing)/i, constraint: "margin_compression" },
    { pattern: /(?:consolidat|roll[\s-]?up|private\s+equity|dso\s+chain)/i, constraint: "competitive_pressure" },
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
