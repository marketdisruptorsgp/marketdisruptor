/* =========================================================
   UNIVERSAL VISUAL INTELLIGENCE PLATFORM CONTRACT
   Canonical Structural Authority + Global Enforcement
   Single Source of Truth for types, derivation, validation
   ========================================================= */

import { detectSignals, getRequiredPanels } from "./signalDetection";
import { deriveAllOntologySpecs } from "./ontologyDerivation";
export type { SignalType, VisualOntology, DetectedSignal } from "./signalDetection";
export { detectSignals, getRequiredPanels, getOntologyLabel } from "./signalDetection";
export { deriveOntologySpec, deriveAllOntologySpecs } from "./ontologyDerivation";

/* ── 1. CANONICAL ROLE SYSTEM ── */

export type NodeRole = "system" | "force" | "mechanism" | "leverage" | "outcome";
export type Certainty = "verified" | "modeled" | "assumption";
export type RelationshipType = "causal" | "reinforcing" | "limiting" | "tradeoff" | "dependency";

/** Adaptive visual grammar — chosen by structural content, never defaulted */
export type VisualGrammar =
  | "causal_pathway"
  | "system_influence"
  | "loop_diagram"
  | "tiered_intervention"
  | "tension_map"
  | "process_architecture"
  | "scenario_tree";

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
  relationship_type?: RelationshipType;
  label?: string;
  strength?: number;
}

export interface VisualSpec {
  visual_type?: "system_model" | "constraint_map" | "causal_chain" | "leverage_hierarchy";
  visual_grammar?: VisualGrammar;
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
  /** If true, the model was derived from real content. If false/missing, treat as insufficient. */
  structurally_grounded?: boolean;
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

/* ── 2. STRUCTURAL EXTRACTION HELPERS ── */

/** NO truncation — labels must carry full meaning */
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

/* ── 3. SEMANTIC SIGNAL ASSESSMENT ── */

/** Returns true only if the data contains enough real semantic content to ground a structural model. */
function hasStructuralSignal(data: Record<string, unknown>): boolean {
  const system = extractField(data, "problemStatement", "coreProblem", "keyInsight", "description", "primaryFriction");
  const forces = extractArray(data, "factors", "marketForces", "vulnerabilities", "blindSpots", "hiddenStrengths");
  const mechanism = extractField(data, "mechanism", "coreStrategy", "approach");
  const outcome = extractField(data, "impact", "verdict", "tagline", "completionMessage", "recommendation");

  // Must have at least a real system AND (forces or mechanism) AND outcome
  const hasSystem = !!system && system !== "Primary system constraint";
  const hasForces = forces.length > 0;
  const hasMechanism = !!mechanism;
  const hasOutcome = !!outcome && outcome !== "System outcome";

  return hasSystem && (hasForces || hasMechanism) && hasOutcome;
}

/* ── 4. ADAPTIVE VISUAL GRAMMAR SELECTION ── */

function selectVisualGrammar(data: Record<string, unknown>, nodes: VisualNode[], edges: VisualEdge[]): VisualGrammar {
  // Detect reinforcing loops
  const edgeSet = new Set(edges.map(e => `${e.from}->${e.to}`));
  const hasLoop = edges.some(e => edgeSet.has(`${e.to}->${e.from}`));
  if (hasLoop) return "loop_diagram";

  // Detect tradeoffs / tensions
  const tradeoffs = extractArray(data, "tradeoffs", "tensions", "paradoxes");
  if (tradeoffs.length > 0) return "tension_map";

  // Detect scenarios / uncertainty dominance
  const scenarios = extractArray(data, "scenarios", "alternatives", "possibleOutcomes");
  if (scenarios.length >= 2) return "scenario_tree";

  // Detect leverage hierarchy (multiple leverage nodes)
  const leverageCount = nodes.filter(n => resolveRole(n) === "leverage").length;
  if (leverageCount >= 2) return "tiered_intervention";

  // Detect multiple interacting drivers (system influence)
  const forceCount = nodes.filter(n => resolveRole(n) === "force").length;
  if (forceCount >= 3) return "system_influence";

  // Detect stage/process structure
  const stages = extractArray(data, "stages", "steps", "phases", "workflowStages");
  if (stages.length >= 2) return "process_architecture";

  // Default: causal pathway
  return "causal_pathway";
}

/* ── 5. CANONICAL STRUCTURE DERIVATION ── */

export function deriveVisualSystemModel(data: Record<string, unknown>): VisualSpec | null {
  // Stage 1: Check for sufficient structural signal
  if (!hasStructuralSignal(data)) {
    return null; // Fallback diagrams are forbidden
  }

  const system = extractField(data, "problemStatement", "coreProblem", "keyInsight", "description")!;
  const forces = extractArray(data, "factors", "marketForces", "vulnerabilities", "blindSpots", "hiddenStrengths");
  const mechanism = extractField(data, "mechanism", "coreStrategy", "approach", "primaryFriction");
  const leverage = extractField(data, "leveragePoint", "recommendation", "strategicRecommendation");
  const outcome = extractField(data, "impact", "verdict", "tagline", "completionMessage", "recommendation")!;

  const nodes: VisualNode[] = [
    { id: "system", label: system, role: "system", priority: 1, certainty: "verified" },
  ];
  const edges: VisualEdge[] = [];

  // Force nodes — only real extracted forces, no placeholders
  forces.slice(0, 3).forEach((f, i) => {
    const id = `force_${i}`;
    nodes.push({ id, label: f, role: "force", priority: 2, certainty: "modeled" });
    edges.push({ from: id, to: "system", relationship: "acts on", relationship_type: "causal" });
  });

  // Mechanism
  if (mechanism) {
    nodes.push({ id: "mechanism", label: mechanism, role: "mechanism", priority: 2, certainty: "modeled" });
    edges.push({ from: "system", to: "mechanism", relationship: "operates through", relationship_type: "causal" });
    edges.push({ from: "mechanism", to: "outcome", relationship: "produces", relationship_type: "causal" });
  } else {
    edges.push({ from: "system", to: "outcome", relationship: "produces", relationship_type: "causal" });
  }

  // Leverage
  if (leverage) {
    nodes.push({ id: "leverage", label: leverage, role: "leverage", priority: 1, certainty: "modeled" });
    edges.push({ from: "leverage", to: mechanism ? "mechanism" : "system", relationship: "intervenes at", relationship_type: "causal" });
  }

  // Outcome
  nodes.push({ id: "outcome", label: outcome, role: "outcome", priority: 3, certainty: "assumption" });

  // Stage 3: Select visual grammar
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

/* ── 6. STRUCTURAL VALIDATION ── */

const PLACEHOLDER_LABELS = new Set([
  "Primary system constraint",
  "Structural driver",
  "System outcome",
  "Primary constraint",
]);

/** Relaxed meaningfulness check: 2+ non-decorative nodes with an anchor, OR 1+ relationship edge */
export function isStructurallyMeaningful(nodes: VisualNode[], edges: VisualEdge[]): boolean {
  const meaningfulNodes = nodes.filter(n => !PLACEHOLDER_LABELS.has(n.label));
  const hasRelationship = edges.length >= 1;
  const hasBinaryInsight = meaningfulNodes.length >= 2;
  const hasAnchor = meaningfulNodes.some(n => resolveRole(n) === "system");
  return hasRelationship || (hasBinaryInsight && hasAnchor);
}

function isValidVisualSpec(spec: unknown): boolean {
  const s = spec as Record<string, unknown>;
  const nodes = s?.nodes as VisualNode[] | undefined;
  const edges = (s?.edges as VisualEdge[] | undefined) || [];
  if (!Array.isArray(nodes) || nodes.length < 2) return false;

  // No placeholder labels allowed
  if (nodes.some(n => PLACEHOLDER_LABELS.has(n.label))) return false;

  return isStructurallyMeaningful(nodes, edges);
}

/* ── 7. LEGACY → CANONICAL MERGE ── */

export function resolveCanonicalVisualModel(data: Record<string, unknown>): VisualSpec | null {
  const canonical = deriveVisualSystemModel(data);
  const legacySpecs = data.visualSpecs as unknown[] | undefined;
  const legacy = Array.isArray(legacySpecs) ? legacySpecs.find(isValidVisualSpec) as VisualSpec | undefined : undefined;

  // If no canonical and no valid legacy → null (no diagram)
  if (!canonical && !legacy) return null;
  if (!canonical) return legacy!;
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

/* ── 8. GLOBAL VISUAL ENFORCEMENT ── */

function generateFallbackAction(data: Record<string, unknown>): ActionPlan[] {
  const recs = extractArray(data, "recommendations", "strategicRecommendations", "keyChanges");

  if (recs.length > 0) {
    return recs.slice(0, 2).map((r) => ({
      initiative: r,
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

export function enforceVisualContract<T extends Record<string, unknown>>(data: T): T & { visualSpecs: VisualSpec[]; actionPlans: ActionPlan[]; ontologySpecs: VisualSpec[] } {
  const canonical = resolveCanonicalVisualModel(data);
  const existingPlans = (data.v3ActionPlans || data.actionPlans) as ActionPlan[] | undefined;
  const actionPlans = Array.isArray(existingPlans) && existingPlans.length > 0 ? existingPlans : generateFallbackAction(data);

  // Only structurally meaningful models render — no decorative diagrams
  const visualSpecs = canonical && isStructurallyMeaningful(canonical.nodes, canonical.edges) ? [canonical] : [];

  // Multi-signal ontology detection — derive domain-specific panels, validated for meaningfulness
  const signals = detectSignals(data);
  const rawOntology = signals.length > 0 ? deriveAllOntologySpecs(data, signals) : [];
  const ontologySpecs = rawOntology.filter(s => isStructurallyMeaningful(s.nodes, s.edges));

  return { ...data, visualSpecs, actionPlans, ontologySpecs };
}

/* ── 9. INLINE ENFORCEMENT HELPERS ──
   Used by consumers that render StructuralVisualList / ActionPlanList directly,
   ensuring they always go through the canonical derivation pipeline. */

/** Extract enforced visualSpecs from any analysis-shaped object */
export function getEnforcedVisualSpecs(data: Record<string, unknown> | null | undefined): VisualSpec[] {
  if (!data) return [];
  const enforced = enforceVisualContract({ ...data });
  return enforced.visualSpecs;
}

/** Extract enforced actionPlans from any analysis-shaped object (handles v3ActionPlans alias) */
export function getEnforcedActionPlans(data: Record<string, unknown> | null | undefined): ActionPlan[] {
  if (!data) return [];
  const enforced = enforceVisualContract({ ...data });
  return enforced.actionPlans;
}

/** Extract ontology-specific visual specs for multi-panel rendering */
export function getEnforcedOntologySpecs(data: Record<string, unknown> | null | undefined): VisualSpec[] {
  if (!data) return [];
  const enforced = enforceVisualContract({ ...data });
  return enforced.ontologySpecs;
}
