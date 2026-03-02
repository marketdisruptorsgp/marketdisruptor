/**
 * Visual Fallback Generator — Universal Visual Intelligence Platform Contract
 *
 * Backend counterpart of src/lib/visualContract.ts.
 * Ensures every pipeline response includes a canonical VisualSystemModel.
 * Uses the 5-role semantic grammar: system → force → mechanism → leverage → outcome
 */

type NodeRole = "system" | "force" | "mechanism" | "leverage" | "outcome";
type Certainty = "verified" | "modeled" | "assumption";

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
  label?: string;
  strength?: number;
}

interface VisualSpec {
  visual_type: "system_model";
  system?: string;
  title: string;
  nodes: VisualNode[];
  edges: VisualEdge[];
  layout: "linear" | "vertical" | "hierarchical";
  interpretation: string;
  version: number;
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

/* ── Helpers ── */

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

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

/* ── Derivation ── */

function deriveVisualSystemModel(data: Record<string, unknown>): VisualSpec {
  const system = extractField(data, "problemStatement", "coreProblem", "keyInsight", "primaryFriction") || "Primary system constraint";
  const forces = extractArray(data, "factors", "marketForces", "vulnerabilities", "blindSpots");
  const mechanism = extractField(data, "mechanism", "coreStrategy", "approach");
  const leverage = extractField(data, "leveragePoint", "recommendation", "strategicRecommendation");
  const outcome = extractField(data, "impact", "verdict", "completionMessage");

  const nodes: VisualNode[] = [
    { id: "system", label: truncate(system, 60), role: "system", priority: 1, certainty: "verified" },
  ];
  const edges: VisualEdge[] = [];

  if (forces.length > 0) {
    forces.slice(0, 3).forEach((f, i) => {
      const id = `force_${i}`;
      nodes.push({ id, label: truncate(f, 50), role: "force", priority: 2, certainty: "modeled" });
      edges.push({ from: id, to: "system", relationship: "acts on" });
    });
  } else {
    nodes.push({ id: "force_0", label: "Structural driver", role: "force", priority: 2, certainty: "assumption" });
    edges.push({ from: "force_0", to: "system", relationship: "acts on" });
  }

  if (mechanism) {
    nodes.push({ id: "mechanism", label: truncate(mechanism, 55), role: "mechanism", priority: 2, certainty: "modeled" });
    edges.push({ from: "system", to: "mechanism", relationship: "operates through" });
    edges.push({ from: "mechanism", to: "outcome", relationship: "produces" });
  } else {
    edges.push({ from: "system", to: "outcome", relationship: "produces" });
  }

  if (leverage) {
    nodes.push({ id: "leverage", label: truncate(leverage, 55), role: "leverage", priority: 1, certainty: "modeled" });
    edges.push({ from: "leverage", to: mechanism ? "mechanism" : "system", relationship: "intervenes at" });
  }

  nodes.push({
    id: "outcome",
    label: outcome ? truncate(outcome, 60) : "System outcome",
    role: "outcome",
    priority: 3,
    certainty: "assumption",
  });

  return {
    visual_type: "system_model",
    system: truncate(system, 40),
    title: "System Structure",
    nodes,
    edges,
    layout: "vertical",
    interpretation: leverage
      ? `Target "${truncate(leverage, 40)}" to shift system outcome.`
      : `Address "${truncate(system, 40)}" to improve outcome.`,
    version: 1,
  };
}

/* ── Validation ── */

function legacyToRole(type?: string): NodeRole {
  const map: Record<string, NodeRole> = {
    constraint: "system", effect: "force", leverage: "leverage", intervention: "mechanism", outcome: "outcome",
  };
  return map[type || ""] || "force";
}

function isValidVisualSpec(spec: Record<string, unknown>): boolean {
  const nodes = spec.nodes as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(nodes) || nodes.length < 3) return false;
  const roles = new Set(nodes.map(n => n.role || legacyToRole(n.type as string)));
  return (roles.has("system") || roles.has("force")) && (roles.has("outcome") || roles.has("leverage"));
}

/* ── Fallback Action Plan ── */

function buildFallbackActionPlan(data: Record<string, unknown>): ActionPlan {
  const system = extractField(data, "problemStatement", "coreProblem") || "Primary constraint";
  const leverage = extractField(data, "leveragePoint", "recommendation");
  return {
    initiative: leverage ? `Leverage: ${truncate(leverage, 40)}` : `Address: ${truncate(system, 40)}`,
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
 * Mutates the object in place and returns it.
 */
export function enforceVisualContract<T extends Record<string, unknown>>(data: T): T {
  const specs = data.visualSpecs as unknown[] | undefined;
  if (!Array.isArray(specs) || specs.length === 0 || !specs.every(s => isValidVisualSpec(s as Record<string, unknown>))) {
    data.visualSpecs = [deriveVisualSystemModel(data)] as unknown as T[keyof T];
  }

  const plans = data.actionPlans as unknown[] | undefined;
  if (!Array.isArray(plans) || plans.length === 0) {
    data.actionPlans = [buildFallbackActionPlan(data)] as unknown as T[keyof T];
  }

  return data;
}
