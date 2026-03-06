/**
 * INSIGHT GRAPH ENGINE — Evidence-First Architecture
 *
 * Builds a navigable graph from canonical Evidence objects.
 * Every node is backed by an Evidence item. Edges represent
 * causal relationships between evidence signals.
 *
 * Graph flow: signal → assumption → constraint → friction → leverage → opportunity
 */

import type {
  Evidence,
  EvidenceType,
  EvidenceTier,
  EvidenceMode,
  EvidencePipelineStep,
  MetricDomain,
  MetricEvidence,
} from "@/lib/evidenceEngine";
import { flattenEvidence } from "@/lib/evidenceEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type InsightNodeType =
  | "signal"
  | "constraint"
  | "assumption"
  | "driver"
  | "outcome"
  | "leverage_point"
  | "flipped_idea"
  | "concept"
  | "risk"
  | "evidence"
  | "friction"
  | "competitor"
  | "simulation";

export type EdgeRelation =
  | "causes"
  | "leads_to"
  | "contradicts"
  | "supports"
  | "unlocks"
  | "depends_on"
  | "invalidates";

export interface InsightGraphNode {
  id: string;
  type: InsightNodeType;
  label: string;
  detail?: string;
  impact: number;
  confidence: "high" | "medium" | "low";
  evidenceCount: number;
  influence: number;
  leverageScore: number;
  pipelineStep: EvidencePipelineStep;
  evidence: string[];
  reasoning?: string;
  relatedNodeIds: string[];
  tier?: EvidenceTier;
  mode?: EvidenceMode;
  sourceEngine?: string;
  confidenceScore?: number;
}

export interface InsightGraphEdge {
  id: string;
  source: string;
  target: string;
  relation: EdgeRelation;
  weight: number;
}

export interface InsightGraph {
  nodes: InsightGraphNode[];
  edges: InsightGraphEdge[];
  topNodes: {
    primaryConstraint: InsightGraphNode | null;
    keyDriver: InsightGraphNode | null;
    breakthroughOpportunity: InsightGraphNode | null;
    highestConfidence: InsightGraphNode | null;
  };
}

// ═══════════════════════════════════════════════════════════════
//  NODE TYPE CONFIG
// ═══════════════════════════════════════════════════════════════

export const NODE_TYPE_CONFIG: Record<InsightNodeType, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  label: string;
}> = {
  signal:         { color: "hsl(199 89% 48%)",  bgColor: "hsl(199 89% 48% / 0.08)", borderColor: "hsl(199 89% 48% / 0.25)", icon: "Radio",         label: "Signal" },
  constraint:     { color: "hsl(0 72% 52%)",    bgColor: "hsl(0 72% 52% / 0.08)",   borderColor: "hsl(0 72% 52% / 0.25)",   icon: "ShieldAlert",   label: "Constraint" },
  assumption:     { color: "hsl(38 92% 50%)",   bgColor: "hsl(38 92% 50% / 0.08)",  borderColor: "hsl(38 92% 50% / 0.25)",  icon: "HelpCircle",    label: "Assumption" },
  driver:         { color: "hsl(262 83% 58%)",  bgColor: "hsl(262 83% 58% / 0.08)", borderColor: "hsl(262 83% 58% / 0.25)", icon: "TrendingUp",    label: "Driver" },
  outcome:        { color: "hsl(152 60% 44%)",  bgColor: "hsl(152 60% 44% / 0.08)", borderColor: "hsl(152 60% 44% / 0.25)", icon: "Target",        label: "Outcome" },
  leverage_point: { color: "hsl(229 89% 63%)",  bgColor: "hsl(229 89% 63% / 0.08)", borderColor: "hsl(229 89% 63% / 0.25)", icon: "Crosshair",     label: "Leverage" },
  flipped_idea:   { color: "hsl(326 78% 55%)",  bgColor: "hsl(326 78% 55% / 0.08)", borderColor: "hsl(326 78% 55% / 0.25)", icon: "Lightbulb",     label: "Flipped Idea" },
  concept:        { color: "hsl(172 66% 50%)",  bgColor: "hsl(172 66% 50% / 0.08)", borderColor: "hsl(172 66% 50% / 0.25)", icon: "Layers",        label: "Concept" },
  risk:           { color: "hsl(14 90% 55%)",   bgColor: "hsl(14 90% 55% / 0.08)",  borderColor: "hsl(14 90% 55% / 0.25)",  icon: "AlertTriangle", label: "Risk" },
  evidence:       { color: "hsl(210 14% 53%)",  bgColor: "hsl(210 14% 53% / 0.08)", borderColor: "hsl(210 14% 53% / 0.25)", icon: "FileText",      label: "Evidence" },
  friction:       { color: "hsl(0 72% 52%)",    bgColor: "hsl(0 72% 52% / 0.08)",   borderColor: "hsl(0 72% 52% / 0.25)",   icon: "AlertTriangle", label: "Friction" },
  competitor:     { color: "hsl(262 83% 58%)",  bgColor: "hsl(262 83% 58% / 0.08)", borderColor: "hsl(262 83% 58% / 0.25)", icon: "Building2",     label: "Competitor" },
  simulation:     { color: "hsl(172 66% 50%)",  bgColor: "hsl(172 66% 50% / 0.08)", borderColor: "hsl(172 66% 50% / 0.25)", icon: "FlaskConical",  label: "Simulation" },
};

export const OPPORTUNITY_NODE_TYPES: InsightNodeType[] = [
  "outcome", "flipped_idea", "concept",
];

// ═══════════════════════════════════════════════════════════════
//  EVIDENCE TYPE → NODE TYPE MAPPING
// ═══════════════════════════════════════════════════════════════

const EVIDENCE_TO_NODE: Record<EvidenceType, InsightNodeType> = {
  signal: "signal",
  assumption: "assumption",
  constraint: "constraint",
  friction: "friction",
  opportunity: "outcome",
  leverage: "leverage_point",
  risk: "risk",
  competitor: "competitor",
};

// ═══════════════════════════════════════════════════════════════
//  GRAPH BUILDER — Evidence-First
// ═══════════════════════════════════════════════════════════════

let edgeCounter = 0;
function eid() { return `e-${++edgeCounter}`; }

function confidenceLabel(score?: number): "high" | "medium" | "low" {
  if (!score) return "medium";
  return score >= 0.7 ? "high" : score >= 0.4 ? "medium" : "low";
}

/**
 * Build insight graph from Evidence objects (canonical pipeline).
 * Also accepts legacy product/intelligence args for backward compat.
 */
export function buildInsightGraph(
  productsOrEvidence: any[] | Record<MetricDomain, MetricEvidence>,
  intelligence?: any,
  disruptData?: unknown,
  redesignData?: unknown,
  stressTestData?: unknown,
): InsightGraph {
  edgeCounter = 0;

  // Determine if called with Evidence or legacy args
  let allEvidence: Evidence[];
  if (productsOrEvidence && !Array.isArray(productsOrEvidence) && "opportunity" in productsOrEvidence) {
    // Evidence-first path
    allEvidence = flattenEvidence(productsOrEvidence as Record<MetricDomain, MetricEvidence>);
  } else {
    // Legacy path — still works but won't have full canonical fields
    allEvidence = buildLegacyEvidence(productsOrEvidence as any[], intelligence, disruptData, redesignData, stressTestData);
  }

  return buildGraphFromEvidence(allEvidence);
}

function buildGraphFromEvidence(allEvidence: Evidence[]): InsightGraph {
  const nodes: InsightGraphNode[] = [];
  const edges: InsightGraphEdge[] = [];
  const nodeIndex = new Map<string, InsightGraphNode>();

  const addNode = (n: InsightGraphNode) => {
    if (nodeIndex.has(n.id)) return;
    nodes.push(n);
    nodeIndex.set(n.id, n);
  };

  const addEdge = (source: string, target: string, relation: EdgeRelation, weight = 0.5) => {
    if (!nodeIndex.has(source) || !nodeIndex.has(target)) return;
    if (source === target) return;
    edges.push({ id: eid(), source, target, relation, weight });
    const s = nodeIndex.get(source);
    const t = nodeIndex.get(target);
    if (s && !s.relatedNodeIds.includes(target)) s.relatedNodeIds.push(target);
    if (t && !t.relatedNodeIds.includes(source)) t.relatedNodeIds.push(source);
  };

  // ── Step 1: Convert Evidence → Graph Nodes ──
  for (const ev of allEvidence) {
    // Sanitize: skip [object Object] or empty labels
    const rawLabel = typeof ev.label === "string" ? ev.label : String(ev.label ?? "");
    if (!rawLabel || rawLabel === "[object Object]" || rawLabel.startsWith("[object")) continue;
    
    // Simulation-sourced evidence becomes simulation nodes
    const isSimulation = ev.category === "simulation" || ev.id.startsWith("sim-");
    const nodeType: InsightNodeType = isSimulation ? "simulation" : (EVIDENCE_TO_NODE[ev.type] || "evidence");
    
    addNode({
      id: ev.id,
      type: nodeType,
      label: rawLabel.slice(0, 120),
      detail: ev.description,
      impact: ev.impact ?? 5,
      confidence: confidenceLabel(ev.confidenceScore),
      evidenceCount: ev.sourceCount ?? 1,
      influence: 0,
      leverageScore: 0,
      pipelineStep: ev.pipelineStep,
      evidence: ev.relatedSignals || [],
      relatedNodeIds: [],
      tier: ev.tier,
      mode: ev.mode,
      sourceEngine: ev.sourceEngine,
      confidenceScore: ev.confidenceScore,
    });
  }

  // ── Deduplicate nodes with similar labels ──
  const seen = new Map<string, string>(); // normalized label → node id
  const dupeIds = new Set<string>();
  for (const n of nodes) {
    const normalized = n.label.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(normalized)) {
      dupeIds.add(n.id);
    } else {
      seen.set(normalized, n.id);
    }
  }
  // Remove duplicates
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (dupeIds.has(nodes[i].id)) {
      nodeIndex.delete(nodes[i].id);
      nodes.splice(i, 1);
    }
  }

  // ── Step 2: Build causal edges based on reasoning chain ──
  // signal → assumption (same tier, signal from report, assumption from disrupt)
  const signals = nodes.filter(n => n.type === "signal");
  const assumptions = nodes.filter(n => n.type === "assumption");
  const constraints = nodes.filter(n => n.type === "constraint");
  const frictions = nodes.filter(n => n.type === "friction");
  const leverages = nodes.filter(n => n.type === "leverage_point");
  const opportunities = nodes.filter(n => OPPORTUNITY_NODE_TYPES.includes(n.type));
  const risks = nodes.filter(n => n.type === "risk");
  const simulations = nodes.filter(n => n.type === "simulation");

  // Simulation → Opportunity (simulations support opportunities)
  for (const sim of simulations.slice(0, 8)) {
    for (const opp of opportunities.slice(0, 3)) {
      addEdge(sim.id, opp.id, "supports", 0.7);
    }
    // Simulation → Constraint (simulations can address constraints)
    for (const con of constraints.filter(c => c.tier === sim.tier).slice(0, 2)) {
      addEdge(sim.id, con.id, "supports", 0.5);
    }
  }

  // Signal → Assumption (signals reveal assumptions)
  for (const sig of signals.slice(0, 8)) {
    for (const asm of assumptions.filter(a => a.tier === sig.tier).slice(0, 2)) {
      addEdge(sig.id, asm.id, "leads_to", 0.5);
    }
  }

  // Assumption → Constraint (assumptions create constraints)
  for (const asm of assumptions.slice(0, 8)) {
    for (const con of constraints.filter(c => c.tier === asm.tier).slice(0, 2)) {
      addEdge(asm.id, con.id, "causes", 0.6);
    }
  }

  // Constraint → Friction (constraints produce friction)
  for (const con of constraints.slice(0, 8)) {
    for (const fric of frictions.filter(f => f.tier === con.tier).slice(0, 2)) {
      addEdge(con.id, fric.id, "causes", 0.6);
    }
  }

  // Constraint → Leverage (constraints unlock leverage)
  for (const con of constraints.slice(0, 6)) {
    for (const lev of leverages.slice(0, 3)) {
      addEdge(con.id, lev.id, "leads_to", 0.6);
    }
  }

  // Leverage → Opportunity (leverage unlocks opportunity)
  for (const lev of leverages.slice(0, 6)) {
    for (const opp of opportunities.slice(0, 3)) {
      addEdge(lev.id, opp.id, "unlocks", 0.7);
    }
  }

  // Risk → Opportunity (risks contradict opportunities)
  for (const rsk of risks.slice(0, 5)) {
    for (const opp of opportunities.slice(0, 2)) {
      addEdge(rsk.id, opp.id, "contradicts", 0.5);
    }
  }

  // ── Step 3: Compute influence & leverage scores ──
  computeInfluence(nodes, edges);
  computeLeverageScores(nodes, edges);

  // ── Step 4: Derive top nodes ──
  const sorted = [...nodes].sort((a, b) => b.influence - a.influence);
  const sortedByLeverage = [...nodes].sort((a, b) => b.leverageScore - a.leverageScore);

  return {
    nodes,
    edges,
    topNodes: {
      primaryConstraint: sorted.find(n => n.type === "constraint") ?? null,
      keyDriver: sorted.find(n => n.type === "leverage_point") ?? null,
      breakthroughOpportunity: sortedByLeverage.find(n => OPPORTUNITY_NODE_TYPES.includes(n.type)) ?? null,
      highestConfidence: sorted.find(n => n.confidence === "high") ?? null,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
//  LEGACY COMPAT — Build evidence from old-style args
// ═══════════════════════════════════════════════════════════════

function buildLegacyEvidence(
  products: any[],
  intelligence: any,
  disruptData: unknown,
  redesignData: unknown,
  stressTestData: unknown,
): Evidence[] {
  const items: Evidence[] = [];
  let id = 0;
  const mkId = (p: string) => `legacy-${p}-${++id}`;

  const product = products?.[0];
  if (product?.keyInsight) {
    items.push({ id: mkId("sig"), type: "signal", label: product.keyInsight, pipelineStep: "report", tier: "structural", impact: 8, sourceEngine: "pipeline" });
  }

  const dd = disruptData as any;
  if (dd) {
    (dd.hiddenAssumptions || dd.assumptions || []).slice(0, 6).forEach((a: any) => {
      const label = typeof a === "string" ? a : a.assumption || a.label || String(a);
      items.push({ id: mkId("asm"), type: "assumption", label, pipelineStep: "disrupt", tier: "structural", sourceEngine: "pipeline" });
    });
    (dd.flippedLogic || dd.flippedIdeas || []).slice(0, 5).forEach((f: any) => {
      const label = typeof f === "string" ? f : f.title || f.idea || String(f);
      items.push({ id: mkId("opp"), type: "opportunity", label, pipelineStep: "disrupt", tier: "structural", impact: 7, sourceEngine: "pipeline" });
    });
  }

  const rd = redesignData as any;
  if (rd) {
    (rd.concepts || rd.redesignedConcepts || []).slice(0, 5).forEach((c: any) => {
      const label = typeof c === "string" ? c : c.title || c.name || String(c);
      items.push({ id: mkId("cpt"), type: "opportunity", label, pipelineStep: "redesign", tier: "system", impact: 7, sourceEngine: "pipeline" });
    });
  }

  const st = stressTestData as any;
  if (st) {
    (st.redTeamArguments || st.weaknesses || []).slice(0, 5).forEach((r: any) => {
      const label = typeof r === "string" ? r : r.argument || r.title || String(r);
      items.push({ id: mkId("risk"), type: "risk", label, pipelineStep: "stress_test", tier: "structural", sourceEngine: "pipeline" });
    });
  }

  if (intelligence) {
    (intelligence.unifiedConstraintGraph || []).slice(0, 8).forEach((c: any) => {
      items.push({ id: mkId("con"), type: "constraint", label: c.label, pipelineStep: "disrupt", tier: "structural", impact: c.impact, sourceEngine: "system_intelligence" });
    });
    (intelligence.leveragePoints || []).slice(0, 8).forEach((l: any) => {
      items.push({ id: mkId("lev"), type: "leverage", label: l.label, pipelineStep: "redesign", tier: "system", impact: l.impact, sourceEngine: "system_intelligence" });
    });
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════
//  INFLUENCE & LEVERAGE SCORING
// ═══════════════════════════════════════════════════════════════

function computeInfluence(nodes: InsightGraphNode[], edges: InsightGraphEdge[]) {
  const confWeight = { high: 1.0, medium: 0.7, low: 0.4 };
  const connectionCount = new Map<string, number>();

  edges.forEach(e => {
    connectionCount.set(e.source, (connectionCount.get(e.source) ?? 0) + 1);
    connectionCount.set(e.target, (connectionCount.get(e.target) ?? 0) + 1);
  });

  const maxConnections = Math.max(1, ...Array.from(connectionCount.values()));

  nodes.forEach(n => {
    const base = n.impact * confWeight[n.confidence] * 10;
    const connectivity = ((connectionCount.get(n.id) ?? 0) / maxConnections) * 20;
    n.influence = Math.min(100, Math.round(base + connectivity));
  });
}

function computeLeverageScores(nodes: InsightGraphNode[], edges: InsightGraphEdge[]) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  nodes.forEach(n => {
    const visited = new Set<string>();
    const queue = [n.id];
    let downstreamOpps = 0;
    let chainDepth = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      chainDepth++;

      const outgoing = edges.filter(e => e.source === current);
      for (const e of outgoing) {
        const target = nodeMap.get(e.target);
        if (target && OPPORTUNITY_NODE_TYPES.includes(target.type)) downstreamOpps++;
        if (!visited.has(e.target)) queue.push(e.target);
      }
    }

    const connectedConstraints = edges.filter(e => {
      const other = e.source === n.id ? nodeMap.get(e.target) : e.target === n.id ? nodeMap.get(e.source) : null;
      return other?.type === "constraint";
    }).length;

    const oppScore = Math.min(downstreamOpps * 15, 50);
    const constraintScore = Math.min(connectedConstraints * 10, 30);
    const depthBonus = Math.min(chainDepth * 3, 20);
    n.leverageScore = Math.min(100, oppScore + constraintScore + depthBonus);
  });
}

// ═══════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getInsightChain(graph: InsightGraph, nodeId: string): InsightGraphNode[] {
  const chain: InsightGraphNode[] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

  function walkBack(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    graph.edges.filter(e => e.target === id).forEach(e => walkBack(e.source));
    const node = nodeMap.get(id);
    if (node) chain.push(node);
  }

  function walkForward(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodeMap.get(id);
    if (node) chain.push(node);
    graph.edges.filter(e => e.source === id).forEach(e => walkForward(e.target));
  }

  walkBack(nodeId);
  visited.delete(nodeId);
  walkForward(nodeId);

  return chain;
}

export function getOpportunityPathNodes(graph: InsightGraph): Set<string> {
  const oppNodes = graph.nodes.filter(n => OPPORTUNITY_NODE_TYPES.includes(n.type));
  const pathIds = new Set<string>();

  for (const opp of oppNodes) {
    const visited = new Set<string>();
    function walkBack(id: string) {
      if (visited.has(id)) return;
      visited.add(id);
      pathIds.add(id);
      graph.edges.filter(e => e.target === id).forEach(e => walkBack(e.source));
    }
    walkBack(opp.id);
  }

  return pathIds;
}
