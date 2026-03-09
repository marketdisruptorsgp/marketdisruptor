/**
 * NARRATIVE SYNTHESIS — Human-Readable Strategic Recommendations
 *
 * Converts raw dimension shift labels into coherent strategic narratives
 * that explain what the opportunity is, why it works, and what to watch for.
 */

// ═══════════════════════════════════════════════════════════════
//  SHIFT PARSING
// ═══════════════════════════════════════════════════════════════

interface ParsedShift {
  dimension: string;
  from: string;
  to: string;
}

function parseShifts(shiftsStr: string): ParsedShift[] {
  // Format: "Dimension: from → to; Dimension2: from2 → to2"
  return shiftsStr.split(";").map(s => {
    const match = s.trim().match(/^(.+?):\s*(.+?)\s*→\s*(.+)$/);
    if (match) return { dimension: match[1].trim(), from: match[2].trim(), to: match[3].trim() };
    return { dimension: "Strategy", from: "current state", to: s.trim() };
  }).filter(s => s.to.length > 0);
}

// ═══════════════════════════════════════════════════════════════
//  DIMENSION-TO-STRATEGY MAPPING
// ═══════════════════════════════════════════════════════════════

const STRATEGY_VERBS: Record<string, string> = {
  "Pricing Model": "restructure pricing toward",
  "Distribution Channel": "shift distribution to",
  "Operational Model": "transform operations via",
  "Cost Structure": "reduce costs through",
  "Customer Behavior": "realign customer engagement around",
  "Competitive Landscape": "differentiate by",
  "Technology Stack": "leverage technology for",
  "Demand & Market Signal": "capture demand through",
  "Regulatory Environment": "navigate regulation via",
};

function getStrategyVerb(dimension: string): string {
  return STRATEGY_VERBS[dimension] || `transform ${dimension.toLowerCase()} toward`;
}

// ═══════════════════════════════════════════════════════════════
//  NARRATIVE GENERATORS
// ═══════════════════════════════════════════════════════════════

export function synthesizeRecommendationNarrative(
  shiftsStr: string,
  constraintName: string,
  businessName: string,
): string {
  const shifts = parseShifts(shiftsStr);
  if (shifts.length === 0) return `Strategic transformation for ${businessName}`;

  const primary = shifts[0];
  const verb = getStrategyVerb(primary.dimension);
  const constraintHuman = constraintName.replace(/_/g, " ");

  if (shifts.length === 1) {
    return `${capitalize(verb)} ${cleanValue(primary.to)}, directly addressing the ${constraintHuman} constraint in ${businessName}`;
  }

  const secondary = shifts[1];
  return `${capitalize(verb)} ${cleanValue(primary.to)} while shifting ${secondary.dimension.toLowerCase()} to ${cleanValue(secondary.to)}, creating a structural response to ${constraintHuman}`;
}

export function synthesizeWhyItWins(
  shiftsStr: string,
  constraintName: string,
  constraintExplanation: string,
  viabilityLabel: string,
): string {
  const shifts = parseShifts(shiftsStr);
  const constraintHuman = constraintName.replace(/_/g, " ");

  const parts: string[] = [];

  // Core strategic logic
  if (constraintExplanation) {
    parts.push(`The ${constraintHuman} constraint means ${constraintExplanation.toLowerCase().slice(0, 120)}`);
  }

  // Why this shift addresses it
  if (shifts.length > 0) {
    const primary = shifts[0];
    parts.push(`Moving from ${cleanValue(primary.from)} to ${cleanValue(primary.to)} directly restructures the business around this limitation`);
  }

  // Viability context
  if (viabilityLabel === "strong") {
    parts.push("This transformation scores high on feasibility and market readiness");
  } else if (viabilityLabel === "moderate") {
    parts.push("This transformation is feasible with manageable implementation complexity");
  }

  return parts.join(". ") + ".";
}

export function generateContextualAssumptions(
  shiftsStr: string,
  constraintName: string,
  businessName: string,
): string[] {
  const shifts = parseShifts(shiftsStr);
  const assumptions: string[] = [];

  for (const shift of shifts.slice(0, 2)) {
    const dim = shift.dimension.toLowerCase();

    if (dim.includes("pricing")) {
      assumptions.push(`Customers of ${businessName} will accept the pricing shift to ${cleanValue(shift.to)} without significant churn`);
    } else if (dim.includes("distribution")) {
      assumptions.push(`The new distribution channel (${cleanValue(shift.to)}) can reach the existing customer base effectively`);
    } else if (dim.includes("operational") || dim.includes("cost")) {
      assumptions.push(`The operational shift to ${cleanValue(shift.to)} is achievable within current resource constraints`);
    } else if (dim.includes("technology")) {
      assumptions.push(`Technology infrastructure for ${cleanValue(shift.to)} is accessible and affordable`);
    } else if (dim.includes("customer")) {
      assumptions.push(`Customer adoption of ${cleanValue(shift.to)} behavior pattern will reach critical mass within 6-12 months`);
    } else {
      assumptions.push(`The shift from ${cleanValue(shift.from)} to ${cleanValue(shift.to)} is operationally feasible`);
    }
  }

  // Always add competitive assumption
  assumptions.push(`Competitive response to this structural change will be slow enough to establish defensible advantage`);

  return assumptions.slice(0, 4);
}

export function generateContextualRisks(
  shiftsStr: string,
  constraintName: string,
  businessName: string,
): string[] {
  const shifts = parseShifts(shiftsStr);
  const risks: string[] = [];
  const constraintHuman = constraintName.replace(/_/g, " ");

  for (const shift of shifts.slice(0, 2)) {
    const dim = shift.dimension.toLowerCase();

    if (dim.includes("pricing")) {
      risks.push(`Revenue disruption during pricing transition — existing customers may resist ${cleanValue(shift.to)}`);
    } else if (dim.includes("distribution")) {
      risks.push(`Channel conflict between existing and new distribution model (${cleanValue(shift.to)})`);
    } else if (dim.includes("operational") || dim.includes("cost")) {
      risks.push(`Operational transformation requires capability building that may exceed available talent/capital`);
    } else if (dim.includes("technology")) {
      risks.push(`Technology implementation risk — ${cleanValue(shift.to)} may have higher integration costs than projected`);
    } else {
      risks.push(`Execution risk in shifting ${shift.dimension.toLowerCase()} — transition period creates vulnerability`);
    }
  }

  // Always add the constraint-specific risk
  risks.push(`The ${constraintHuman} constraint may reassert itself if the structural change is incomplete`);

  return risks.slice(0, 4);
}

// ═══════════════════════════════════════════════════════════════
//  DETERMINISTIC DIMENSION ALTERNATIVES
// ═══════════════════════════════════════════════════════════════

/**
 * Generate deterministic alternative values for business dimensions
 * when AI alternatives are unavailable (benchmark/offline mode).
 *
 * Each evidence category maps to a set of canonical structural
 * transformations drawn from real business model innovation patterns.
 */
export function generateDeterministicAlternatives(
  dimensions: { id: string; name: string; category: string; currentValue: string; status: string }[],
  constraints: { id: string; label: string; description: string }[],
): { dimensionId: string; value: string; rationale: string }[] {
  const alternatives: { dimensionId: string; value: string; rationale: string }[] = [];

  const CATEGORY_ALTERNATIVES: Record<string, { value: string; rationale: string }[]> = {
    pricing_model: [
      { value: "Subscription/recurring revenue model", rationale: "Convert transactional revenue to predictable recurring streams, reducing revenue volatility" },
      { value: "Value-based pricing tied to customer outcomes", rationale: "Align price with value delivered rather than cost-plus, improving margins" },
      { value: "Tiered pricing with premium service layer", rationale: "Segment customers by willingness to pay, capturing more value from high-end segment" },
      { value: "Usage-based dynamic pricing", rationale: "Match price to consumption patterns, improving unit economics and reducing waste" },
    ],
    distribution_channel: [
      { value: "Direct-to-consumer digital platform", rationale: "Eliminate intermediary margin capture and own the customer relationship" },
      { value: "Marketplace/aggregator distribution", rationale: "Leverage network effects for customer acquisition at lower CAC" },
      { value: "Partnership-embedded distribution", rationale: "Distribute through complementary services that already have customer trust" },
      { value: "Self-service automated delivery", rationale: "Remove human bottleneck from distribution, enabling 24/7 availability" },
    ],
    operational_dependency: [
      { value: "Systematized process with minimal owner involvement", rationale: "Break owner dependency by encoding expertise into repeatable systems" },
      { value: "Technology-automated operations", rationale: "Replace manual processes with automated workflows, reducing labor intensity" },
      { value: "Outsourced/distributed operations model", rationale: "Shift from centralized capacity to distributed execution, removing geographic bottleneck" },
      { value: "Platform-mediated service delivery", rationale: "Transform from service provider to platform operator, enabling supply-side scaling" },
    ],
    cost_structure: [
      { value: "Variable cost structure with minimal fixed overhead", rationale: "Shift from fixed to variable costs, reducing breakeven point and risk" },
      { value: "Asset-light model leveraging shared infrastructure", rationale: "Eliminate owned asset burden through shared/rented capacity" },
      { value: "Vertical integration to capture margin", rationale: "Absorb supplier margin by bringing key cost drivers in-house" },
    ],
    demand_signal: [
      { value: "Demand aggregation and smoothing platform", rationale: "Aggregate fragmented demand to achieve scale economics" },
      { value: "Predictive demand management system", rationale: "Shift from reactive to predictive capacity allocation" },
      { value: "Community-driven demand generation", rationale: "Build owned audience that generates organic demand, reducing CAC" },
    ],
    customer_behavior: [
      { value: "Self-service customer journey", rationale: "Enable customers to serve themselves, reducing service cost per customer" },
      { value: "Membership/loyalty-driven retention", rationale: "Create switching costs through community and accumulated benefits" },
      { value: "Data-driven personalization engine", rationale: "Use behavioral data to improve retention and increase LTV" },
    ],
    competitive_pressure: [
      { value: "Category-defining differentiation", rationale: "Create a new category rather than competing in existing one" },
      { value: "Network-effect moat", rationale: "Build defensibility through usage that makes the product better for everyone" },
      { value: "Vertical specialization strategy", rationale: "Own a specific niche deeply rather than competing broadly" },
    ],
    technology_dependency: [
      { value: "API-first platform architecture", rationale: "Build composable technology that enables ecosystem development" },
      { value: "AI/automation layer for core processes", rationale: "Apply intelligence to the highest-cost or lowest-quality processes" },
      { value: "Digital twin of physical operations", rationale: "Create a data model that enables optimization without physical experimentation" },
    ],
    regulatory_constraint: [
      { value: "Compliance-as-competitive-advantage", rationale: "Turn regulatory burden into barrier to entry for competitors" },
      { value: "Regulatory arbitrage through structural redesign", rationale: "Restructure offering to operate in a more favorable regulatory category" },
    ],
  };

  // Build constraint context for rationale enrichment
  const constraintText = constraints.map(c => c.label.toLowerCase()).join(" ");

  for (const dim of dimensions) {
    if (dim.status !== "hot" && dim.status !== "warm") continue;

    const categoryAlts = CATEGORY_ALTERNATIVES[dim.category] || [];
    const normalizedId = dim.id.startsWith("dim-") ? dim.id : `dim-${dim.id}`;

    // Give hot dimensions more alternatives
    const maxAlts = dim.status === "hot" ? 3 : 2;

    for (let i = 0; i < Math.min(maxAlts, categoryAlts.length); i++) {
      const alt = categoryAlts[i];
      // Enrich rationale with constraint context if relevant
      const enrichedRationale = constraintText.includes(dim.category.replace(/_/g, " ").split(" ")[0])
        ? `${alt.rationale}. Directly addresses detected ${dim.category.replace(/_/g, " ")} constraint.`
        : alt.rationale;

      alternatives.push({
        dimensionId: normalizedId,
        value: alt.value,
        rationale: enrichedRationale,
      });
    }
  }

  return alternatives;
}

// ═══════════════════════════════════════════════════════════════
//  BUSINESS-SPECIFIC STRATEGIC ASSUMPTIONS
// ═══════════════════════════════════════════════════════════════

const BUSINESS_ASSUMPTIONS: Record<string, string[]> = {
  dental: [
    "Patient acquisition cost is high due to trust requirements in healthcare",
    "Insurance reimbursement rates constrain pricing power",
    "Chair time is the fundamental capacity unit — revenue scales linearly with chairs and hours",
    "Regulatory compliance (HIPAA, state dental boards) creates operational overhead",
  ],
  "car wash": [
    "Revenue is weather-dependent and highly seasonal",
    "Customer loyalty is low — price and convenience drive selection",
    "Water/utility costs are the primary variable expense",
    "Location is the dominant competitive advantage",
  ],
  gym: [
    "Membership churn is the primary revenue risk (typical 30-50% annual)",
    "Fixed facility costs create high breakeven utilization requirements",
    "Peak-hour capacity constraints limit revenue per square foot",
    "Customer engagement correlates directly with retention",
  ],
  trucking: [
    "Empty miles (deadhead) are the largest source of margin erosion",
    "Driver acquisition and retention is the binding labor constraint",
    "Fuel cost volatility creates margin unpredictability",
    "Regulatory compliance (DOT, ELD mandates) adds fixed operational cost",
  ],
  insurance: [
    "Client acquisition cost is high due to trust and comparison-shopping behavior",
    "Carrier relationships determine available product portfolio",
    "Renewal retention is the primary driver of long-term profitability",
    "Regulatory licensing creates barriers but also defensibility",
  ],
  restaurant: [
    "Food cost (typically 28-35%) and labor (25-35%) compress margins to single digits",
    "Seat turnover rate is the fundamental throughput constraint",
    "Location and foot traffic drive organic customer acquisition",
    "Consistency at scale is the primary operational challenge",
  ],
  "property management": [
    "Revenue scales with doors under management — acquisition is the growth constraint",
    "Maintenance coordination is the highest-friction operational process",
    "Owner retention depends on transparent reporting and responsive communication",
    "Regulatory landscape varies significantly by jurisdiction",
  ],
  cleaning: [
    "Labor is the binding constraint — revenue scales linearly with cleaners",
    "Quality control at scale requires systematic inspection processes",
    "Customer churn is driven by inconsistency more than price",
    "Geographic density determines route efficiency and margins",
  ],
};

/**
 * Returns business-specific strategic assumptions for a given business type.
 * Falls back to generic assumptions if no specific match is found.
 */
export function getBusinessAssumptions(businessName: string): string[] {
  const nameLower = businessName.toLowerCase();
  
  for (const [key, assumptions] of Object.entries(BUSINESS_ASSUMPTIONS)) {
    if (nameLower.includes(key)) return assumptions;
  }

  // Generic fallback
  return [
    "Revenue model has inherent scaling limitations that constrain growth",
    "Customer acquisition cost and retention rate are the primary unit economics drivers",
    "Operational complexity increases non-linearly with scale",
    "Competitive moats are thin without structural differentiation",
  ];
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function cleanValue(s: string): string {
  // Truncate very long evidence labels
  if (s.length > 100) return s.slice(0, 97) + "…";
  return s;
}
