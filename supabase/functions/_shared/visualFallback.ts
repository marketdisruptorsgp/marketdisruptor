/**
 * Visual Fallback Generator — Universal Visual Intelligence Platform Contract
 *
 * Backend counterpart of src/lib/visualContract.ts.
 * Ensures every pipeline response includes a canonical VisualSystemModel
 * ONLY when sufficient structural signal exists.
 * Uses the 5-role semantic grammar: system → force → mechanism → leverage → outcome
 *
 * NO fallback diagrams. NO placeholder labels. NO truncation.
 */

type NodeRole = "system" | "force" | "mechanism" | "leverage" | "outcome";
type Certainty = "verified" | "modeled" | "assumption";
type RelationshipType = "causal" | "reinforcing" | "limiting" | "tradeoff" | "dependency";
type VisualGrammar =
  | "causal_pathway"
  | "system_influence"
  | "loop_diagram"
  | "tiered_intervention"
  | "tension_map"
  | "process_architecture"
  | "scenario_tree";

interface VisualNode {
  id: string;
  label: string;
  role: NodeRole;
  priority?: 1 | 2 | 3;
  certainty?: Certainty;
  attributes?: string[];
}

interface VisualEdge {
  from: string;
  to: string;
  relationship?: string;
  relationship_type?: RelationshipType;
  label?: string;
  strength?: number;
}

interface VisualSpec {
  visual_type: "system_model";
  visual_grammar?: VisualGrammar;
  system?: string;
  title: string;
  nodes: VisualNode[];
  edges: VisualEdge[];
  layout: "linear" | "vertical" | "hierarchical";
  interpretation: string;
  version: number;
  structurally_grounded?: boolean;
}

interface ActionPlan {
  initiative: string;
  objective: string;
  leverage_type: "optimization" | "structural_improvement" | "redesign";
  mechanism: string;
  complexity: "low" | "medium" | "high";
  time_horizon: "near_term" | "mid_term" | "long_term";
  confidence: "high" | "medium" | "exploratory";
  risk?: { execution: string; adoption: string; market: string };
  validation?: string;
  decision_readiness?: number;
}

/* ── Helpers (NO truncation) ── */

function extractField(data: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = data[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function extractArray(data: Record<string, unknown>, ...keys: string[]): string[] {
  for (const k of keys) {
    const v = data[k];
    if (Array.isArray(v) && v.length > 0) {
      return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 4);
    }
  }
  return [];
}

/* ── Structural Signal Assessment ── */

function hasStructuralSignal(data: Record<string, unknown>): boolean {
  const system = extractField(data, "problemStatement", "coreProblem", "keyInsight", "primaryFriction");
  const forces = extractArray(data, "factors", "marketForces", "vulnerabilities", "blindSpots");
  const mechanism = extractField(data, "mechanism", "coreStrategy", "approach");
  const outcome = extractField(data, "impact", "verdict", "completionMessage");

  const hasSystem = !!system;
  const hasForces = forces.length > 0;
  const hasMechanism = !!mechanism;
  const hasOutcome = !!outcome;

  return hasSystem && (hasForces || hasMechanism) && hasOutcome;
}

/* ── Visual Grammar Selection ── */

function selectVisualGrammar(data: Record<string, unknown>, nodes: VisualNode[], edges: VisualEdge[]): VisualGrammar {
  const edgeSet = new Set(edges.map(e => `${e.from}->${e.to}`));
  const hasLoop = edges.some(e => edgeSet.has(`${e.to}->${e.from}`));
  if (hasLoop) return "loop_diagram";

  const tradeoffs = extractArray(data, "tradeoffs", "tensions", "paradoxes");
  if (tradeoffs.length > 0) return "tension_map";

  const scenarios = extractArray(data, "scenarios", "alternatives", "possibleOutcomes");
  if (scenarios.length >= 2) return "scenario_tree";

  const leverageCount = nodes.filter(n => n.role === "leverage").length;
  if (leverageCount >= 2) return "tiered_intervention";

  const forceCount = nodes.filter(n => n.role === "force").length;
  if (forceCount >= 3) return "system_influence";

  const stages = extractArray(data, "stages", "steps", "phases", "workflowStages");
  if (stages.length >= 2) return "process_architecture";

  return "causal_pathway";
}

/* ── Derivation ── */

function deriveVisualSystemModel(data: Record<string, unknown>): VisualSpec | null {
  if (!hasStructuralSignal(data)) return null;

  const system = extractField(data, "problemStatement", "coreProblem", "keyInsight", "primaryFriction")!;
  const forces = extractArray(data, "factors", "marketForces", "vulnerabilities", "blindSpots");
  const mechanism = extractField(data, "mechanism", "coreStrategy", "approach");
  const leverage = extractField(data, "leveragePoint", "recommendation", "strategicRecommendation");
  const outcome = extractField(data, "impact", "verdict", "completionMessage")!;

  const nodes: VisualNode[] = [
    { id: "system", label: system, role: "system", priority: 1, certainty: "verified" },
  ];
  const edges: VisualEdge[] = [];

  // Only real extracted forces — no placeholders
  forces.slice(0, 3).forEach((f, i) => {
    const id = `force_${i}`;
    nodes.push({ id, label: f, role: "force", priority: 2, certainty: "modeled" });
    edges.push({ from: id, to: "system", relationship: "acts on", relationship_type: "causal" });
  });

  if (mechanism) {
    nodes.push({ id: "mechanism", label: mechanism, role: "mechanism", priority: 2, certainty: "modeled" });
    edges.push({ from: "system", to: "mechanism", relationship: "operates through", relationship_type: "causal" });
    edges.push({ from: "mechanism", to: "outcome", relationship: "produces", relationship_type: "causal" });
  } else {
    edges.push({ from: "system", to: "outcome", relationship: "produces", relationship_type: "causal" });
  }

  if (leverage) {
    nodes.push({ id: "leverage", label: leverage, role: "leverage", priority: 1, certainty: "modeled" });
    edges.push({ from: "leverage", to: mechanism ? "mechanism" : "system", relationship: "intervenes at", relationship_type: "causal" });
  }

  nodes.push({ id: "outcome", label: outcome, role: "outcome", priority: 3, certainty: "assumption" });

  const grammar = selectVisualGrammar(data, nodes, edges);

  return {
    visual_type: "system_model",
    visual_grammar: grammar,
    system,
    title: "System Structure",
    nodes,
    edges,
    layout: "vertical",
    interpretation: leverage
      ? `Target "${leverage}" to shift system outcome.`
      : `Address "${system}" to improve outcome.`,
    version: 1,
    structurally_grounded: true,
  };
}

/* ── Validation ── */

const PLACEHOLDER_LABELS = new Set([
  "Primary system constraint",
  "Structural driver",
  "System outcome",
  "Primary constraint",
]);

function legacyToRole(type?: string): NodeRole {
  const map: Record<string, NodeRole> = {
    constraint: "system", effect: "force", leverage: "leverage", intervention: "mechanism", outcome: "outcome",
  };
  return map[type || ""] || "force";
}

function isValidVisualSpec(spec: Record<string, unknown>): boolean {
  const nodes = spec.nodes as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(nodes) || nodes.length < 3) return false;
  // Reject placeholder labels
  if (nodes.some(n => PLACEHOLDER_LABELS.has(n.label as string))) return false;
  const roles = new Set(nodes.map(n => n.role || legacyToRole(n.type as string)));
  return (roles.has("system") || roles.has("force")) && (roles.has("outcome") || roles.has("leverage"));
}

/* ── Fallback Action Plan ── */

function buildFallbackActionPlan(data: Record<string, unknown>): ActionPlan | null {
  const leverage = extractField(data, "leveragePoint", "recommendation");
  const system = extractField(data, "problemStatement", "coreProblem");
  if (!leverage && !system) return null;

  return {
    initiative: leverage ? `Leverage: ${leverage}` : `Address: ${system}`,
    objective: "Remove or relax the dominant system constraint",
    leverage_type: "structural_improvement",
    mechanism: "Target the root cause of the primary system limitation",
    complexity: "medium",
    time_horizon: "near_term",
    confidence: "exploratory",
    risk: {
      execution: "Requires focused resource allocation",
      adoption: "Stakeholder alignment needed",
      market: "Market response uncertain",
    },
    validation: "Run a minimum viable test targeting the constraint within 30 days",
    decision_readiness: 2,
  };
}

/**
 * Ensures the parsed analysis object contains valid visualSpecs and actionPlans.
 * Returns null visualSpecs if insufficient structural signal exists — no decorative diagrams.
 */
export function enforceVisualContract<T extends Record<string, unknown>>(data: T): T {
  const specs = data.visualSpecs as unknown[] | undefined;
  const hasValidSpecs = Array.isArray(specs) && specs.length > 0 && specs.every(s => isValidVisualSpec(s as Record<string, unknown>));

  if (!hasValidSpecs) {
    const derived = deriveVisualSystemModel(data);
    data.visualSpecs = (derived ? [derived] : []) as unknown as T[keyof T];
  }

  const plans = data.actionPlans as unknown[] | undefined;
  if (!Array.isArray(plans) || plans.length === 0) {
    const fallback = buildFallbackActionPlan(data);
    data.actionPlans = (fallback ? [fallback] : []) as unknown as T[keyof T];
  }

  return data;
}
