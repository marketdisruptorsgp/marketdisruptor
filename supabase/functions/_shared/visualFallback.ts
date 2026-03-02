/**
 * Visual Fallback Generator — Universal Visual Intelligence Platform Contract
 *
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
  visual_type: "system_model" | "constraint_map" | "causal_chain" | "leverage_hierarchy";
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
  risk: { execution: string; adoption: string; market: string };
  validation: string;
  decision_readiness: number;
  confidence: "high" | "medium" | "exploratory";
}

/**
 * Extract structural components from analysis output.
 */
function extractSystemComponents(data: Record<string, unknown>): {
  system: string;
  forces: string[];
  mechanism: string | null;
  leverage: string | null;
  outcome: string;
} {
  // System / constraint
  let system = "Primary system constraint";
  const opAudit = data.operationalAudit as Record<string, unknown> | undefined;
  if (opAudit?.revenueLeaks) {
    const leaks = opAudit.revenueLeaks as string[];
    if (leaks.length > 0) system = leaks[0].slice(0, 60);
  } else if (data.problemStatement) {
    system = String(data.problemStatement).slice(0, 60);
  }

  const friction = data.frictionDimensions as Record<string, unknown> | undefined;
  if (friction?.primaryFriction) {
    system = String(friction.primaryFriction).slice(0, 60);
  }

  // Forces
  const forces: string[] = [];
  const redTeam = data.redTeam as Record<string, unknown> | undefined;
  if (redTeam?.killShot) forces.push(String(redTeam.killShot).slice(0, 50));
  const vulns = data.vulnerabilities as string[] | undefined;
  if (Array.isArray(vulns)) forces.push(...vulns.slice(0, 2).map(v => String(v).slice(0, 50)));
  if (forces.length === 0) forces.push("Structural limitation");

  // Mechanism
  const mechanism = data.mechanism || data.coreStrategy || data.approach;
  const mechanismStr = mechanism ? String(mechanism).slice(0, 55) : null;

  // Leverage
  const leverageRaw = data.leveragePoint || data.recommendation || data.strategicRecommendation;
  const leverageStr = leverageRaw ? String(leverageRaw).slice(0, 55) : null;

  // Outcome
  const outcomeRaw = data.impact || data.verdict || data.completionMessage;
  const outcome = outcomeRaw ? String(outcomeRaw).slice(0, 60) : "Performance ceiling";

  return { system, forces, mechanism: mechanismStr, leverage: leverageStr, outcome };
}

function buildFallbackVisual(data: Record<string, unknown>): VisualSpec {
  const { system, forces, mechanism, leverage, outcome } = extractSystemComponents(data);

  const nodes: VisualNode[] = [
    { id: "system", label: system, role: "system", priority: 1, certainty: "verified" },
  ];
  const edges: VisualEdge[] = [];

  // Force nodes
  forces.forEach((f, i) => {
    const id = `force_${i}`;
    nodes.push({ id, label: f, role: "force", priority: 2, certainty: "modeled" });
    edges.push({ from: id, to: "system", relationship: "acts on" });
  });

  // Mechanism
  if (mechanism) {
    nodes.push({ id: "mechanism", label: mechanism, role: "mechanism", priority: 2, certainty: "modeled" });
    edges.push({ from: "system", to: "mechanism", relationship: "operates through" });
    edges.push({ from: "mechanism", to: "outcome", relationship: "produces" });
  } else {
    edges.push({ from: "system", to: "outcome", relationship: "produces" });
  }

  // Leverage
  if (leverage) {
    nodes.push({ id: "leverage", label: leverage, role: "leverage", priority: 1, certainty: "modeled" });
    edges.push({ from: "leverage", to: mechanism ? "mechanism" : "system", relationship: "intervenes at" });
  }

  // Outcome
  nodes.push({ id: "outcome", label: outcome, role: "outcome", priority: 3, certainty: "assumption" });

  return {
    visual_type: "system_model",
    system,
    title: "System Structure",
    nodes,
    edges,
    layout: "vertical",
    interpretation: leverage
      ? `Target "${leverage}" to shift the system outcome.`
      : `Address "${system}" to improve "${outcome}".`,
    version: 1,
  };
}

function buildFallbackActionPlan(data: Record<string, unknown>): ActionPlan {
  const { system, leverage } = extractSystemComponents(data);
  return {
    initiative: leverage ? `Leverage: ${leverage.slice(0, 40)}` : `Address: ${system.slice(0, 40)}`,
    objective: `Remove or relax the dominant system constraint`,
    leverage_type: "structural_improvement",
    mechanism: "Target the root cause of the primary system limitation",
    complexity: "medium",
    time_horizon: "near_term",
    risk: {
      execution: "Requires focused resource allocation",
      adoption: "Stakeholder alignment needed",
      market: "Market response uncertain",
    },
    validation: "Run a minimum viable test targeting the constraint within 30 days",
    decision_readiness: 2,
    confidence: "exploratory",
  };
}

/**
 * Validates structural density: must have system + mechanism/force + outcome.
 */
function isValidVisualSpec(spec: Record<string, unknown>): boolean {
  const nodes = spec.nodes as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(nodes) || nodes.length < 3) return false;
  const roles = new Set(nodes.map(n => n.role || legacyToRole(n.type as string)));
  return (roles.has("system") || roles.has("force")) && (roles.has("outcome") || roles.has("leverage"));
}

function legacyToRole(type?: string): NodeRole {
  const map: Record<string, NodeRole> = {
    constraint: "system", effect: "force", leverage: "leverage", intervention: "mechanism", outcome: "outcome",
  };
  return map[type || ""] || "force";
}

/**
 * Ensures the parsed analysis object contains valid visualSpecs and actionPlans.
 * Mutates the object in place and returns it.
 */
export function enforceVisualContract<T extends Record<string, unknown>>(data: T): T {
  const specs = data.visualSpecs as unknown[] | undefined;
  if (!Array.isArray(specs) || specs.length === 0 || !specs.every(s => isValidVisualSpec(s as Record<string, unknown>))) {
    data.visualSpecs = [buildFallbackVisual(data)] as unknown as T[keyof T];
  }

  const plans = data.actionPlans as unknown[] | undefined;
  if (!Array.isArray(plans) || plans.length === 0) {
    data.actionPlans = [buildFallbackActionPlan(data)] as unknown as T[keyof T];
  }

  return data;
}
