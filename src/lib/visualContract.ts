/* =========================================================
   UNIVERSAL VISUAL INTELLIGENCE PLATFORM CONTRACT
   Canonical Structural Authority + Global Enforcement
   Single Source of Truth for types, derivation, validation
   ========================================================= */

/* ── 1. CANONICAL ROLE SYSTEM ── */

export type NodeRole = "system" | "force" | "mechanism" | "leverage" | "outcome";
export type Certainty = "verified" | "modeled" | "assumption";

/** Legacy type alias for backward compatibility */
export type LegacyNodeType = "constraint" | "effect" | "leverage" | "intervention" | "outcome";

export interface VisualNode {
  id: string;
  label: string;
  /** Canonical role in the system model */
  role?: NodeRole;
  /** @deprecated Use `role` instead. Kept for legacy data compatibility. */
  type?: LegacyNodeType;
  priority?: 1 | 2 | 3;
  attributes?: string | string[];
  certainty?: Certainty;
}

export interface VisualEdge {
  from: string;
  to: string;
  relationship?: string;
  label?: string;
  strength?: number;
}

export interface VisualSpec {
  visual_type?: "system_model" | "constraint_map" | "causal_chain" | "leverage_hierarchy";
  system?: string;
  title?: string;
  purpose?: string;
  nodes: VisualNode[];
  edges: VisualEdge[];
  layout?: "linear" | "vertical" | "hierarchical";
  interpretation?: string;
  confidence?: number;
  assumptions?: string[];
  version?: number;
}

export interface ActionPlan {
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

/* ── Legacy → Canonical Role Migration ── */
const LEGACY_TO_ROLE: Record<string, NodeRole> = {
  constraint: "system",
  effect: "force",
  leverage: "leverage",
  intervention: "mechanism",
  outcome: "outcome",
};

export function resolveRole(node: VisualNode): NodeRole {
  if (node.role) return node.role;
  if (node.type) return LEGACY_TO_ROLE[node.type] || "force";
  return "force";
}

/* ── 2. CANONICAL STRUCTURE DERIVATION ── */

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

export function deriveVisualSystemModel(data: Record<string, unknown>): VisualSpec {
  const system = extractField(data, "problemStatement", "coreProblem", "keyInsight", "description") || "Primary system constraint";
  const forces = extractArray(data, "factors", "marketForces", "vulnerabilities", "blindSpots", "hiddenStrengths");
  const mechanism = extractField(data, "mechanism", "coreStrategy", "approach", "primaryFriction");
  const leverage = extractField(data, "leveragePoint", "recommendation", "strategicRecommendation");
  const outcome = extractField(data, "impact", "verdict", "tagline", "completionMessage", "recommendation");

  const nodes: VisualNode[] = [
    { id: "system", label: truncate(system, 60), role: "system", priority: 1, certainty: "verified" },
  ];
  const edges: VisualEdge[] = [];

  // Force nodes
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

  // Mechanism
  if (mechanism) {
    nodes.push({ id: "mechanism", label: truncate(mechanism, 55), role: "mechanism", priority: 2, certainty: "modeled" });
    edges.push({ from: "system", to: "mechanism", relationship: "operates through" });
    edges.push({ from: "mechanism", to: "outcome", relationship: "produces" });
  } else {
    edges.push({ from: "system", to: "outcome", relationship: "produces" });
  }

  // Leverage
  if (leverage) {
    nodes.push({ id: "leverage", label: truncate(leverage, 55), role: "leverage", priority: 1, certainty: "modeled" });
    edges.push({ from: "leverage", to: mechanism ? "mechanism" : "system", relationship: "intervenes at" });
  }

  // Outcome (always present)
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

/* ── 3. STRICT STRUCTURAL VALIDATION ── */

function isValidVisualSpec(spec: unknown): boolean {
  const s = spec as Record<string, unknown>;
  const nodes = s?.nodes as VisualNode[] | undefined;
  if (!Array.isArray(nodes) || nodes.length < 3) return false;
  const roles = new Set(nodes.map(n => resolveRole(n)));
  return (roles.has("system") || roles.has("force")) && (roles.has("outcome") || roles.has("leverage"));
}

/* ── 4. LEGACY → CANONICAL MERGE ── */

export function resolveCanonicalVisualModel(data: Record<string, unknown>): VisualSpec {
  const canonical = deriveVisualSystemModel(data);
  const legacySpecs = data.visualSpecs as unknown[] | undefined;
  const legacy = Array.isArray(legacySpecs) ? legacySpecs.find(isValidVisualSpec) as VisualSpec | undefined : undefined;

  if (!legacy) return canonical;

  // Merge: canonical provides structural guarantee, legacy provides AI-enriched labels
  const roleMap = new Map(canonical.nodes.map(n => [n.role, n]));
  const mergedNodes: VisualNode[] = legacy.nodes.map((n): VisualNode => {
    const role = resolveRole(n);
    const canonicalNode = roleMap.get(role);
    return {
      ...canonicalNode,
      ...n,
      role,
      priority: n.priority ?? canonicalNode?.priority ?? 2,
      certainty: n.certainty ?? "modeled",
    } as VisualNode;
  });

  // Ensure all canonical roles are represented
  canonical.nodes.forEach(n => {
    if (!mergedNodes.find(m => resolveRole(m) === n.role)) {
      mergedNodes.push(n);
    }
  });

  return {
    ...canonical,
    nodes: mergedNodes,
    edges: legacy.edges?.length ? legacy.edges : canonical.edges,
  };
}

/* ── 5. GLOBAL VISUAL ENFORCEMENT ── */

function generateFallbackAction(data: Record<string, unknown>): ActionPlan[] {
  const recs = extractArray(data, "recommendations", "strategicRecommendations", "keyChanges");

  if (recs.length > 0) {
    return recs.slice(0, 2).map((r) => ({
      initiative: truncate(r, 80),
      objective: "Improve system performance by addressing identified constraint",
      leverage_type: "structural_improvement" as const,
      mechanism: r,
      complexity: "medium" as const,
      time_horizon: "near_term" as const,
      confidence: "medium" as const,
    }));
  }

  return [{
    initiative: "Address primary constraint",
    objective: "Stabilize and improve the dominant system bottleneck",
    leverage_type: "structural_improvement",
    mechanism: "Identify the binding constraint, apply a targeted intervention, then measure results",
    complexity: "medium",
    time_horizon: "near_term",
    confidence: "exploratory",
  }];
}

export function enforceVisualContract<T extends Record<string, unknown>>(data: T): T & { visualSpecs: VisualSpec[]; actionPlans: ActionPlan[] } {
  const canonical = resolveCanonicalVisualModel(data);
  const existingPlans = (data.v3ActionPlans || data.actionPlans) as ActionPlan[] | undefined;
  const actionPlans = Array.isArray(existingPlans) && existingPlans.length > 0 ? existingPlans : generateFallbackAction(data);

  return { ...data, visualSpecs: [canonical], actionPlans };
}
