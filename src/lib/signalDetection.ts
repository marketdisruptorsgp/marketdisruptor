/* =========================================================
   SEMANTIC SIGNAL DETECTION ENGINE
   Classifies analysis intelligence into domain-specific ontologies
   for multi-panel visual rendering.
   ========================================================= */

export type SignalType =
  | "PRICING_INTEL"
  | "PATENT_LANDSCAPE"
  | "USER_BEHAVIOR"
  | "FRICTION_ANALYSIS"
  | "SENTIMENT_EVIDENCE"
  | "ASSUMPTIONS"
  | "LOGIC_REVERSAL"
  | "IDEATION"
  | "WORKFLOW_STRUCTURE"
  | "COMPETITIVE_POSITION"
  | "VALUE_MECHANICS";

export type VisualOntology =
  | "price_architecture"
  | "innovation_territory"
  | "behavior_flow"
  | "value_perception"
  | "constraint_stack"
  | "assumption_risk_matrix"
  | "inversion_model"
  | "opportunity_portfolio"
  | "positioning_field"
  | "system_interaction";

export interface DetectedSignal {
  type: SignalType;
  ontology: VisualOntology;
  confidence: "high" | "medium" | "low";
  sourceFields: string[];
  label: string;
}

/* ── Field presence helpers ── */
function hasFields(data: Record<string, unknown>, ...keys: string[]): string[] {
  return keys.filter(k => {
    const v = data[k];
    if (v === undefined || v === null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v as object).length > 0;
    return true;
  });
}

function hasAny(data: Record<string, unknown>, ...keys: string[]): boolean {
  return hasFields(data, ...keys).length > 0;
}

/* ── Signal Detection Rules ── */

const SIGNAL_RULES: Array<{
  type: SignalType;
  ontology: VisualOntology;
  label: string;
  detect: (d: Record<string, unknown>) => string[];
}> = [
  {
    type: "PRICING_INTEL",
    ontology: "price_architecture",
    label: "Price Architecture",
    detect: (d) => hasFields(d,
      "pricingAnalysis", "priceComparison", "pricing", "pricingTiers",
      "marginAnalysis", "priceElasticity", "pricingStrategy",
      "revenueMechanics", "pricingModel"
    ),
  },
  {
    type: "PATENT_LANDSCAPE",
    ontology: "innovation_territory",
    label: "Innovation Territory",
    detect: (d) => hasFields(d,
      "patentAnalysis", "patents", "patentFilings", "ipLandscape",
      "patentGaps", "expiredGoldmines", "defensibleClusters"
    ),
  },
  {
    type: "USER_BEHAVIOR",
    ontology: "behavior_flow",
    label: "Behavior Flow",
    detect: (d) => hasFields(d,
      "userJourney", "userBehavior", "engagementData", "dropOffPoints",
      "conversionFunnel", "userFlow", "touchpoints", "journeyMap"
    ),
  },
  {
    type: "FRICTION_ANALYSIS",
    ontology: "constraint_stack",
    label: "Constraint Stack",
    detect: (d) => hasFields(d,
      "frictionPoints", "primaryFriction", "barriers", "painPoints",
      "constraints", "bottlenecks", "blockingConstraints"
    ),
  },
  {
    type: "SENTIMENT_EVIDENCE",
    ontology: "value_perception",
    label: "Value Perception",
    detect: (d) => hasFields(d,
      "sentimentAnalysis", "sentiment", "customerFeedback", "nps",
      "reviewAnalysis", "brandPerception", "emotionalDrivers",
      "communityInsight", "communityPulse"
    ),
  },
  {
    type: "ASSUMPTIONS",
    ontology: "assumption_risk_matrix",
    label: "Assumption Risk",
    detect: (d) => hasFields(d,
      "assumptions", "blindSpots", "untested", "riskFactors",
      "criticalAssumptions", "validationNeeds"
    ),
  },
  {
    type: "LOGIC_REVERSAL",
    ontology: "inversion_model",
    label: "Inversion Model",
    detect: (d) => hasFields(d,
      "flippedIdeas", "invertedLogic", "contrarian", "reversals",
      "disruptiveFlips", "paradigmShifts"
    ),
  },
  {
    type: "IDEATION",
    ontology: "opportunity_portfolio",
    label: "Opportunity Portfolio",
    detect: (d) => hasFields(d,
      "ideas", "opportunities", "concepts", "innovations",
      "newProductIdeas", "adjacencies", "expansionPaths"
    ),
  },
  {
    type: "WORKFLOW_STRUCTURE",
    ontology: "behavior_flow",
    label: "Workflow Structure",
    detect: (d) => hasFields(d,
      "workflowStages", "processSteps", "operationalFlow",
      "valueChain", "supplyChain", "stages"
    ),
  },
  {
    type: "COMPETITIVE_POSITION",
    ontology: "positioning_field",
    label: "Competitive Position",
    detect: (d) => hasFields(d,
      "competitiveAnalysis", "competitors", "marketPosition",
      "competitiveLandscape", "positioning", "moat", "defensibility"
    ),
  },
  {
    type: "VALUE_MECHANICS",
    ontology: "system_interaction",
    label: "Value Mechanics",
    detect: (d) => hasFields(d,
      "valueMechanics", "valueDrivers", "businessModel",
      "revenueEngine", "valueCreation", "coreStrategy"
    ),
  },
];

/* ── Public API ── */

export function detectSignals(data: Record<string, unknown>): DetectedSignal[] {
  const signals: DetectedSignal[] = [];

  for (const rule of SIGNAL_RULES) {
    const matched = rule.detect(data);
    if (matched.length > 0) {
      signals.push({
        type: rule.type,
        ontology: rule.ontology,
        confidence: matched.length >= 3 ? "high" : matched.length >= 2 ? "medium" : "low",
        sourceFields: matched,
        label: rule.label,
      });
    }
  }

  return signals;
}

/** Returns unique ontologies that should be rendered as separate panels */
export function getRequiredPanels(signals: DetectedSignal[]): VisualOntology[] {
  const seen = new Set<VisualOntology>();
  const result: VisualOntology[] = [];
  for (const s of signals) {
    if (!seen.has(s.ontology)) {
      seen.add(s.ontology);
      result.push(s.ontology);
    }
  }
  return result;
}

/** Human-readable label for an ontology */
export function getOntologyLabel(ontology: VisualOntology): string {
  const labels: Record<VisualOntology, string> = {
    price_architecture: "Price Architecture Map",
    innovation_territory: "Innovation Territory Map",
    behavior_flow: "Behavior Flow Model",
    value_perception: "Value Perception Field",
    constraint_stack: "Constraint Stack",
    assumption_risk_matrix: "Assumption Risk Matrix",
    inversion_model: "Inversion Model",
    opportunity_portfolio: "Opportunity Portfolio Map",
    positioning_field: "Positioning Field",
    system_interaction: "System Interaction Map",
  };
  return labels[ontology] || ontology;
}
