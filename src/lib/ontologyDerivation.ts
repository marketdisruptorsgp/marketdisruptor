/* =========================================================
   ONTOLOGY-SPECIFIC VISUAL MODEL DERIVATION
   Each ontology produces a domain-appropriate VisualSpec
   with nodes/edges that reflect that domain's logic.
   ========================================================= */

import type { VisualSpec, VisualNode, VisualEdge } from "./visualContract";
import type { VisualOntology, DetectedSignal } from "./signalDetection";

function arr(data: Record<string, unknown>, ...keys: string[]): string[] {
  for (const k of keys) {
    const v = data[k];
    if (Array.isArray(v) && v.length > 0) return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  }
  return [];
}

function str(data: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = data[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function makeSpec(title: string, nodes: VisualNode[], edges: VisualEdge[], interp: string, ontology: VisualOntology): VisualSpec {
  return {
    visual_type: "system_model",
    title,
    nodes,
    edges,
    interpretation: interp,
    structurally_grounded: true,
    version: 1,
  };
}

/* ── Derivation per ontology ── */

function derivePriceArchitecture(data: Record<string, unknown>): VisualSpec | null {
  const tiers = arr(data, "pricingTiers", "pricingAnalysis");
  const strategy = str(data, "pricingStrategy", "pricingModel");
  const competitors = arr(data, "priceComparison", "competitorPricing");
  if (!strategy && tiers.length === 0) return null;

  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];

  if (strategy) {
    nodes.push({ id: "strategy", label: strategy, role: "system", priority: 1, certainty: "verified" });
  }
  tiers.slice(0, 4).forEach((t, i) => {
    const id = `tier_${i}`;
    nodes.push({ id, label: t, role: "mechanism", priority: 2, certainty: "modeled" });
    if (strategy) edges.push({ from: "strategy", to: id, relationship: "structures", relationship_type: "causal" });
  });
  competitors.slice(0, 3).forEach((c, i) => {
    const id = `comp_${i}`;
    nodes.push({ id, label: c, role: "force", priority: 3, certainty: "modeled" });
    if (strategy) edges.push({ from: id, to: "strategy", relationship: "pressures", relationship_type: "limiting" });
  });
  const margin = str(data, "marginAnalysis", "marginPressure");
  if (margin) {
    nodes.push({ id: "margin", label: margin, role: "outcome", priority: 2, certainty: "assumption" });
    edges.push({ from: tiers.length > 0 ? "tier_0" : "strategy", to: "margin", relationship: "produces", relationship_type: "causal" });
  }

  if (nodes.length < 3) return null;
  return makeSpec("Price Architecture Map", nodes, edges, strategy ? `Pricing structured around "${strategy}".` : "Pricing tier analysis.", "price_architecture");
}

function deriveInnovationTerritory(data: Record<string, unknown>): VisualSpec | null {
  const patents = arr(data, "patentFilings", "patents", "patentAnalysis");
  const gaps = arr(data, "patentGaps", "whiteSpace");
  const expired = arr(data, "expiredGoldmines", "expiredPatents");
  if (patents.length === 0 && gaps.length === 0) return null;

  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];

  patents.slice(0, 3).forEach((p, i) => {
    nodes.push({ id: `pat_${i}`, label: p, role: "system", priority: 2, certainty: "verified" });
  });
  gaps.slice(0, 2).forEach((g, i) => {
    const id = `gap_${i}`;
    nodes.push({ id, label: g, role: "leverage", priority: 1, certainty: "modeled" });
    if (nodes.length > 1) edges.push({ from: nodes[0].id, to: id, relationship: "reveals gap", relationship_type: "dependency" });
  });
  expired.slice(0, 2).forEach((e, i) => {
    nodes.push({ id: `exp_${i}`, label: e, role: "outcome", priority: 2, certainty: "verified" });
  });

  if (nodes.length < 3) return null;
  return makeSpec("Innovation Territory Map", nodes, edges, gaps.length > 0 ? `${gaps.length} white-space opportunities identified.` : "Patent landscape analysis.", "innovation_territory");
}

function deriveBehaviorFlow(data: Record<string, unknown>): VisualSpec | null {
  const stages = arr(data, "workflowStages", "userJourney", "processSteps", "stages", "touchpoints");
  const dropoffs = arr(data, "dropOffPoints", "frictionPoints");
  if (stages.length < 2) return null;

  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];

  stages.slice(0, 5).forEach((s, i) => {
    const isDropoff = dropoffs.some(d => s.toLowerCase().includes(d.toLowerCase()));
    nodes.push({ id: `stage_${i}`, label: s, role: isDropoff ? "system" : "mechanism", priority: i === 0 ? 1 : 2, certainty: "verified" });
    if (i > 0) edges.push({ from: `stage_${i - 1}`, to: `stage_${i}`, relationship: "leads to", relationship_type: "causal" });
  });

  dropoffs.slice(0, 2).forEach((d, i) => {
    if (!nodes.some(n => n.label.toLowerCase().includes(d.toLowerCase()))) {
      const id = `drop_${i}`;
      nodes.push({ id, label: d, role: "force", priority: 1, certainty: "modeled" });
      if (nodes.length > 1) edges.push({ from: id, to: nodes[Math.min(2, nodes.length - 1)].id, relationship: "blocks", relationship_type: "limiting" });
    }
  });

  if (nodes.length < 3) return null;
  return makeSpec("Behavior Flow Model", nodes, edges, `${stages.length}-stage flow with ${dropoffs.length} friction points.`, "behavior_flow");
}

function deriveConstraintStack(data: Record<string, unknown>): VisualSpec | null {
  const friction = arr(data, "frictionPoints", "barriers", "painPoints", "constraints", "bottlenecks", "blockingConstraints");
  const primary = str(data, "primaryFriction", "primaryConstraint");
  if (friction.length === 0 && !primary) return null;

  const allItems = primary ? [primary, ...friction.filter(f => f !== primary)] : friction;
  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];

  allItems.slice(0, 5).forEach((f, i) => {
    nodes.push({ id: `constraint_${i}`, label: f, role: i === 0 ? "system" : "force", priority: i === 0 ? 1 : (i < 3 ? 2 : 3), certainty: "modeled" });
    if (i > 0) edges.push({ from: `constraint_${i}`, to: "constraint_0", relationship: `compounds (#${i + 1})`, relationship_type: "reinforcing" });
  });

  const outcome = str(data, "impact", "verdict", "recommendation");
  if (outcome) {
    nodes.push({ id: "outcome", label: outcome, role: "outcome", priority: 2, certainty: "assumption" });
    edges.push({ from: "constraint_0", to: "outcome", relationship: "blocks", relationship_type: "limiting" });
  }

  if (nodes.length < 3) return null;
  return makeSpec("Constraint Stack", nodes, edges, `${allItems.length} constraints identified — primary: "${allItems[0]}".`, "constraint_stack");
}

function deriveValuePerception(data: Record<string, unknown>): VisualSpec | null {
  const positive = arr(data, "emotionalDrivers", "brandStrengths", "positiveSignals");
  const negative = arr(data, "painPoints", "complaints", "negativeSignals");
  const sentiment = str(data, "sentimentAnalysis", "communityPulse", "communityInsight");
  if (positive.length === 0 && negative.length === 0 && !sentiment) return null;

  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];

  if (sentiment) {
    nodes.push({ id: "sentiment", label: sentiment, role: "system", priority: 1, certainty: "modeled" });
  }
  positive.slice(0, 3).forEach((p, i) => {
    const id = `pos_${i}`;
    nodes.push({ id, label: p, role: "leverage", priority: 2, certainty: "modeled" });
    if (sentiment) edges.push({ from: id, to: "sentiment", relationship: "drives love", relationship_type: "reinforcing" });
  });
  negative.slice(0, 3).forEach((n, i) => {
    const id = `neg_${i}`;
    nodes.push({ id, label: n, role: "force", priority: 2, certainty: "modeled" });
    if (sentiment) edges.push({ from: id, to: "sentiment", relationship: "drives rejection", relationship_type: "limiting" });
  });

  if (nodes.length < 3) return null;
  return makeSpec("Value Perception Field", nodes, edges, sentiment || "Sentiment analysis of value drivers.", "value_perception");
}

function deriveAssumptionRisk(data: Record<string, unknown>): VisualSpec | null {
  const assumptions = arr(data, "assumptions", "blindSpots", "criticalAssumptions", "untested");
  if (assumptions.length < 2) return null;

  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];

  assumptions.slice(0, 5).forEach((a, i) => {
    nodes.push({ id: `asn_${i}`, label: a, role: i === 0 ? "system" : "force", priority: i < 2 ? 1 : 2, certainty: "assumption" });
    if (i > 0) edges.push({ from: `asn_${i}`, to: "asn_0", relationship: "depends on", relationship_type: "dependency" });
  });

  const validation = str(data, "validationNeeds", "recommendation");
  if (validation) {
    nodes.push({ id: "validation", label: validation, role: "leverage", priority: 1, certainty: "modeled" });
    edges.push({ from: "validation", to: "asn_0", relationship: "validates", relationship_type: "causal" });
  }

  if (nodes.length < 3) return null;
  return makeSpec("Assumption Risk Matrix", nodes, edges, `${assumptions.length} assumptions — ${assumptions.filter((_, i) => i < 2).length} critical.`, "assumption_risk_matrix");
}

function deriveInversionModel(data: Record<string, unknown>): VisualSpec | null {
  const flips = arr(data, "flippedIdeas", "reversals", "disruptiveFlips", "paradigmShifts");
  if (flips.length === 0) return null;

  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];
  const current = str(data, "currentBelief", "problemStatement", "coreProblem");

  if (current) {
    nodes.push({ id: "current", label: current, role: "system", priority: 2, certainty: "verified" });
  }

  flips.slice(0, 3).forEach((f, i) => {
    const id = `flip_${i}`;
    nodes.push({ id, label: f, role: "leverage", priority: 1, certainty: "modeled" });
    if (current) edges.push({ from: "current", to: id, relationship: "inverts to", relationship_type: "tradeoff" });
  });

  const impact = str(data, "impact", "implication");
  if (impact) {
    nodes.push({ id: "impact", label: impact, role: "outcome", priority: 2, certainty: "assumption" });
    edges.push({ from: flips.length > 0 ? "flip_0" : "current", to: "impact", relationship: "implies", relationship_type: "causal" });
  }

  if (nodes.length < 3) return null;
  return makeSpec("Inversion Model", nodes, edges, `${flips.length} logic reversal(s) identified.`, "inversion_model");
}

function deriveOpportunityPortfolio(data: Record<string, unknown>): VisualSpec | null {
  const ideas = arr(data, "ideas", "opportunities", "concepts", "innovations", "newProductIdeas");
  if (ideas.length < 2) return null;

  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];

  ideas.slice(0, 5).forEach((idea, i) => {
    nodes.push({ id: `idea_${i}`, label: idea, role: i === 0 ? "leverage" : "mechanism", priority: i < 2 ? 1 : 2, certainty: "modeled" });
    if (i > 0) edges.push({ from: `idea_${i}`, to: "idea_0", relationship: "complements", relationship_type: "reinforcing" });
  });

  const outcome = str(data, "impact", "verdict", "recommendation");
  if (outcome) {
    nodes.push({ id: "outcome", label: outcome, role: "outcome", priority: 2, certainty: "assumption" });
    edges.push({ from: "idea_0", to: "outcome", relationship: "achieves", relationship_type: "causal" });
  }

  if (nodes.length < 3) return null;
  return makeSpec("Opportunity Portfolio Map", nodes, edges, `${ideas.length} opportunities mapped by leverage potential.`, "opportunity_portfolio");
}

function derivePositioningField(data: Record<string, unknown>): VisualSpec | null {
  const competitors = arr(data, "competitors", "competitiveLandscape");
  const position = str(data, "marketPosition", "positioning", "moat");
  if (competitors.length === 0 && !position) return null;

  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];

  if (position) {
    nodes.push({ id: "position", label: position, role: "system", priority: 1, certainty: "modeled" });
  }
  competitors.slice(0, 4).forEach((c, i) => {
    const id = `comp_${i}`;
    nodes.push({ id, label: c, role: "force", priority: 2, certainty: "modeled" });
    if (position) edges.push({ from: id, to: "position", relationship: "competes with", relationship_type: "limiting" });
  });

  const moat = str(data, "moat", "defensibility");
  if (moat && moat !== position) {
    nodes.push({ id: "moat", label: moat, role: "leverage", priority: 1, certainty: "modeled" });
    edges.push({ from: "moat", to: "position", relationship: "defends", relationship_type: "reinforcing" });
  }

  if (nodes.length < 3) return null;
  return makeSpec("Positioning Field", nodes, edges, position ? `Positioned via "${position}".` : "Competitive landscape analysis.", "positioning_field");
}

function deriveSystemInteraction(data: Record<string, unknown>): VisualSpec | null {
  const drivers = arr(data, "valueDrivers", "valueMechanics", "valueCreation");
  const strategy = str(data, "coreStrategy", "businessModel", "revenueEngine");
  if (drivers.length === 0 && !strategy) return null;

  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];

  if (strategy) {
    nodes.push({ id: "strategy", label: strategy, role: "system", priority: 1, certainty: "modeled" });
  }
  drivers.slice(0, 4).forEach((d, i) => {
    const id = `driver_${i}`;
    nodes.push({ id, label: d, role: "mechanism", priority: 2, certainty: "modeled" });
    if (strategy) edges.push({ from: "strategy", to: id, relationship: "drives through", relationship_type: "causal" });
  });

  const outcome = str(data, "impact", "verdict", "revenue");
  if (outcome) {
    nodes.push({ id: "outcome", label: outcome, role: "outcome", priority: 2, certainty: "assumption" });
    const last = drivers.length > 0 ? `driver_${Math.min(drivers.length - 1, 3)}` : "strategy";
    edges.push({ from: last, to: "outcome", relationship: "produces", relationship_type: "causal" });
  }

  if (nodes.length < 3) return null;
  return makeSpec("System Interaction Map", nodes, edges, strategy ? `Value system anchored by "${strategy}".` : "Value mechanics analysis.", "system_interaction");
}

/* ── Router ── */

const ONTOLOGY_DERIVERS: Record<VisualOntology, (d: Record<string, unknown>) => VisualSpec | null> = {
  price_architecture: derivePriceArchitecture,
  innovation_territory: deriveInnovationTerritory,
  behavior_flow: deriveBehaviorFlow,
  constraint_stack: deriveConstraintStack,
  value_perception: deriveValuePerception,
  assumption_risk_matrix: deriveAssumptionRisk,
  inversion_model: deriveInversionModel,
  opportunity_portfolio: deriveOpportunityPortfolio,
  positioning_field: derivePositioningField,
  system_interaction: deriveSystemInteraction,
};

/** Derive a VisualSpec for a specific ontology from analysis data. Returns null if insufficient signal. */
export function deriveOntologySpec(data: Record<string, unknown>, ontology: VisualOntology): VisualSpec | null {
  const deriver = ONTOLOGY_DERIVERS[ontology];
  return deriver ? deriver(data) : null;
}

/** Derive all valid ontology specs from detected signals */
export function deriveAllOntologySpecs(data: Record<string, unknown>, signals: DetectedSignal[]): VisualSpec[] {
  const seen = new Set<VisualOntology>();
  const specs: VisualSpec[] = [];

  for (const signal of signals) {
    if (seen.has(signal.ontology)) continue;
    seen.add(signal.ontology);
    const spec = deriveOntologySpec(data, signal.ontology);
    if (spec) specs.push(spec);
  }

  return specs;
}
