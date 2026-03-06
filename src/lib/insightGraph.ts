/**
 * INSIGHT GRAPH ENGINE
 *
 * Transforms analysis pipeline data into a navigable graph of typed nodes
 * and relationship edges. Each analysis object becomes a graph node with
 * influence scoring, confidence, and evidence chains.
 *
 * Node types: Signal, Constraint, Assumption, Driver, Outcome,
 *             LeveragePoint, FlippedIdea, Concept, Risk, Evidence
 *
 * Edge types: causes, leads_to, contradicts, supports, unlocks,
 *             depends_on, invalidates
 */

import type { Product } from "@/data/mockProducts";
import type { SystemIntelligence, ConstraintNode, OpportunityNode, CommandDeck } from "@/lib/systemIntelligence";
import type { LeverageNode } from "@/lib/multiLensEngine";
import { classifyTier } from "@/lib/tierDiscoveryEngine";

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
  | "evidence";

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
  impact: number;          // 1-10
  confidence: "high" | "medium" | "low";
  evidenceCount: number;
  influence: number;       // computed: 0-100
  leverageScore: number;   // computed: 0-100 — downstream opportunities + constraint connections + chain influence
  pipelineStep: "report" | "disrupt" | "redesign" | "stress_test" | "pitch";
  evidence: string[];
  reasoning?: string;
  relatedNodeIds: string[];
  /** Discovery tier: structural / system / optimization */
  tier?: "structural" | "system" | "optimization";
}

export interface InsightGraphEdge {
  id: string;
  source: string;
  target: string;
  relation: EdgeRelation;
  weight: number; // 0-1
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
//  NODE TYPE CONFIG — icons and colors
// ═══════════════════════════════════════════════════════════════

export const NODE_TYPE_CONFIG: Record<InsightNodeType, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string; // lucide icon name
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
};

/** Opportunity-type node types */
export const OPPORTUNITY_NODE_TYPES: InsightNodeType[] = [
  "outcome", "flipped_idea", "concept",
];

// ═══════════════════════════════════════════════════════════════
//  EXTRACTION ENGINE
// ═══════════════════════════════════════════════════════════════

let edgeCounter = 0;
function eid() { return `e-${++edgeCounter}`; }

function makeNode(
  id: string,
  type: InsightNodeType,
  label: string,
  opts: Partial<Omit<InsightGraphNode, "id" | "type" | "label">> = {},
): InsightGraphNode {
  const trimmedLabel = label.slice(0, 120);
  return {
    id,
    type,
    label: trimmedLabel,
    detail: opts.detail,
    impact: opts.impact ?? 5,
    confidence: opts.confidence ?? "medium",
    evidenceCount: opts.evidenceCount ?? (opts.evidence?.length ?? 0),
    influence: 0,
    leverageScore: 0,
    pipelineStep: opts.pipelineStep ?? "report",
    evidence: opts.evidence ?? [],
    reasoning: opts.reasoning,
    relatedNodeIds: opts.relatedNodeIds ?? [],
    tier: opts.tier ?? classifyTier(trimmedLabel),
  };
}

/**
 * Build an insight graph from the full analysis pipeline data.
 */
export function buildInsightGraph(
  products: Product[],
  intelligence: SystemIntelligence | null,
  disruptData: unknown,
  redesignData: unknown,
  stressTestData: unknown,
): InsightGraph {
  edgeCounter = 0;
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
    edges.push({ id: eid(), source, target, relation, weight });
    const s = nodeIndex.get(source);
    const t = nodeIndex.get(target);
    if (s && !s.relatedNodeIds.includes(target)) s.relatedNodeIds.push(target);
    if (t && !t.relatedNodeIds.includes(source)) t.relatedNodeIds.push(source);
  };

  // ── Step 1: Report layer — extract signals from products ──
  const product = products[0];
  if (product) {
    if (product.keyInsight) {
      addNode(makeNode("sig-key", "signal", product.keyInsight, {
        pipelineStep: "report", impact: 8, confidence: "high",
      }));
    }
    const uw = (product as any).userWorkflow || (product as any).userJourney;
    const frictionPts = uw?.frictionPoints || [];
    frictionPts.slice(0, 5).forEach((fp: any, i: number) => {
      const label = typeof fp === "string" ? fp : fp.description || fp.label || String(fp);
      addNode(makeNode(`sig-friction-${i}`, "signal", label, {
        pipelineStep: "report", impact: 6, confidence: "medium",
      }));
    });
  }

  // ── Step 2: SystemIntelligence layer ──
  if (intelligence) {
    const { unifiedConstraintGraph, leveragePoints, opportunities } = intelligence;

    unifiedConstraintGraph.slice(0, 8).forEach((c) => {
      addNode(makeNode(`con-${c.id}`, "constraint", c.label, {
        pipelineStep: "report", impact: c.impact, confidence: c.confidence,
        evidence: c.evidence,
      }));
    });

    leveragePoints.slice(0, 8).forEach((l) => {
      addNode(makeNode(`lev-${l.id}`, "leverage_point", l.label, {
        pipelineStep: "report", impact: l.impact, confidence: l.confidence,
        evidence: l.evidence,
      }));
    });

    opportunities.slice(0, 8).forEach((o) => {
      addNode(makeNode(`opp-${o.id}`, "outcome", o.label, {
        pipelineStep: "report", impact: o.impact, confidence: o.confidence,
        evidence: o.evidence,
      }));
    });

    frictionSignalIds().forEach((sigId) => {
      unifiedConstraintGraph.slice(0, 3).forEach((c) => {
        addEdge(sigId, `con-${c.id}`, "causes", 0.7);
      });
    });

    unifiedConstraintGraph.slice(0, 5).forEach((c) => {
      leveragePoints.slice(0, 3).forEach((l) => {
        addEdge(`con-${c.id}`, `lev-${l.id}`, "leads_to", 0.6);
      });
    });

    leveragePoints.slice(0, 5).forEach((l) => {
      opportunities.slice(0, 3).forEach((o) => {
        addEdge(`lev-${l.id}`, `opp-${o.id}`, "unlocks", 0.7);
      });
    });
  }

  // ── Step 3: Disrupt layer ──
  const dd = disruptData as any;
  if (dd) {
    const assumptions = dd.hiddenAssumptions || dd.assumptions || [];
    assumptions.slice(0, 6).forEach((a: any, i: number) => {
      const label = typeof a === "string" ? a : a.assumption || a.label || a.title || String(a);
      addNode(makeNode(`asn-${i}`, "assumption", label, {
        pipelineStep: "disrupt", impact: 5, confidence: "medium",
      }));
      nodes.filter(n => n.type === "constraint").slice(0, 2).forEach(c => {
        addEdge(`asn-${i}`, c.id, "causes", 0.5);
      });
    });

    const flipped = dd.flippedLogic || dd.flippedIdeas || [];
    flipped.slice(0, 5).forEach((f: any, i: number) => {
      const label = typeof f === "string" ? f : f.title || f.idea || f.concept || String(f);
      addNode(makeNode(`flip-${i}`, "flipped_idea", label, {
        pipelineStep: "disrupt", impact: 7, confidence: "medium",
      }));
      nodes.filter(n => n.type === "outcome").slice(0, 2).forEach(o => {
        addEdge(`flip-${i}`, o.id, "unlocks", 0.6);
      });
    });

    const drivers = dd.drivers || dd.keyDrivers || [];
    drivers.slice(0, 5).forEach((d: any, i: number) => {
      const label = typeof d === "string" ? d : d.driver || d.label || String(d);
      addNode(makeNode(`drv-${i}`, "driver", label, {
        pipelineStep: "disrupt", impact: 6, confidence: "medium",
      }));
    });
  }

  // ── Step 4: Redesign layer ──
  const rd = redesignData as any;
  if (rd) {
    const concepts = rd.concepts || rd.redesignedConcepts || rd.ideas || [];
    concepts.slice(0, 5).forEach((c: any, i: number) => {
      const label = typeof c === "string" ? c : c.title || c.concept || c.name || String(c);
      addNode(makeNode(`cpt-${i}`, "concept", label, {
        pipelineStep: "redesign", impact: 7, confidence: "medium",
      }));
      nodes.filter(n => n.type === "leverage_point").slice(0, 2).forEach(l => {
        addEdge(l.id, `cpt-${i}`, "leads_to", 0.5);
      });
    });
  }

  // ── Step 5: Stress test layer ──
  const st = stressTestData as any;
  if (st) {
    const risks = st.redTeamArguments || st.weaknesses || st.risks || [];
    risks.slice(0, 5).forEach((r: any, i: number) => {
      const label = typeof r === "string" ? r : r.argument || r.title || r.risk || String(r);
      addNode(makeNode(`rsk-${i}`, "risk", label, {
        pipelineStep: "stress_test", impact: 6, confidence: "medium",
      }));
      nodes.filter(n => n.type === "outcome").slice(0, 2).forEach(o => {
        addEdge(`rsk-${i}`, o.id, "contradicts", 0.6);
      });
    });

    const evidence = st.greenTeamArguments || st.strengths || [];
    evidence.slice(0, 5).forEach((e: any, i: number) => {
      const label = typeof e === "string" ? e : e.argument || e.title || String(e);
      addNode(makeNode(`evi-${i}`, "evidence", label, {
        pipelineStep: "stress_test", impact: 5, confidence: "high",
      }));
      nodes.filter(n => n.type === "concept").slice(0, 2).forEach(c => {
        addEdge(`evi-${i}`, c.id, "supports", 0.7);
      });
    });
  }

  // ── Compute influence and leverage scores ──
  computeInfluence(nodes, edges);
  computeLeverageScores(nodes, edges);

  // ── Derive top nodes ──
  const sorted = [...nodes].sort((a, b) => b.influence - a.influence);
  const sortedByLeverage = [...nodes].sort((a, b) => b.leverageScore - a.leverageScore);
  const topNodes = {
    primaryConstraint: sorted.find(n => n.type === "constraint") ?? null,
    keyDriver: sorted.find(n => n.type === "driver" || n.type === "leverage_point") ?? null,
    breakthroughOpportunity: sortedByLeverage.find(n => OPPORTUNITY_NODE_TYPES.includes(n.type)) ?? null,
    highestConfidence: sorted.find(n => n.confidence === "high") ?? null,
  };

  return { nodes, edges, topNodes };

  function frictionSignalIds(): string[] {
    return nodes.filter(n => n.type === "signal" && n.id.startsWith("sig-friction")).map(n => n.id);
  }
}

/**
 * Compute influence as: (impact * confidence_weight) + edge_connectivity_bonus
 */
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

/**
 * Compute leverage score per node:
 *  - downstream opportunity count (nodes of type outcome/flipped_idea/concept reachable)
 *  - connected constraint count
 *  - chain depth bonus
 */
function computeLeverageScores(nodes: InsightGraphNode[], edges: InsightGraphEdge[]) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  nodes.forEach(n => {
    // Count downstream opportunities (BFS forward)
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
        if (target && OPPORTUNITY_NODE_TYPES.includes(target.type)) {
          downstreamOpps++;
        }
        if (!visited.has(e.target)) queue.push(e.target);
      }
    }

    // Count connected constraints (direct edges)
    const connectedConstraints = edges.filter(e => {
      const other = e.source === n.id ? nodeMap.get(e.target) : e.target === n.id ? nodeMap.get(e.source) : null;
      return other?.type === "constraint";
    }).length;

    // Score: weighted combination
    const oppScore = Math.min(downstreamOpps * 15, 50); // up to 50
    const constraintScore = Math.min(connectedConstraints * 10, 30); // up to 30
    const depthBonus = Math.min(chainDepth * 3, 20); // up to 20

    n.leverageScore = Math.min(100, oppScore + constraintScore + depthBonus);
  });
}

/**
 * Get the insight chain (threading) from a node back to root causes and forward to outcomes.
 */
export function getInsightChain(
  graph: InsightGraph,
  nodeId: string,
): InsightGraphNode[] {
  const chain: InsightGraphNode[] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

  function walkBack(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const incoming = graph.edges.filter(e => e.target === id);
    incoming.forEach(e => walkBack(e.source));
    const node = nodeMap.get(id);
    if (node) chain.push(node);
  }

  function walkForward(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodeMap.get(id);
    if (node) chain.push(node);
    const outgoing = graph.edges.filter(e => e.source === id);
    outgoing.forEach(e => walkForward(e.target));
  }

  walkBack(nodeId);
  visited.delete(nodeId);
  walkForward(nodeId);

  return chain;
}

/**
 * Get all nodes on chains that terminate in opportunity-type nodes.
 */
export function getOpportunityPathNodes(graph: InsightGraph): Set<string> {
  const oppNodes = graph.nodes.filter(n => OPPORTUNITY_NODE_TYPES.includes(n.type));
  const pathIds = new Set<string>();

  for (const opp of oppNodes) {
    // Walk backward from each opportunity
    const visited = new Set<string>();
    function walkBack(id: string) {
      if (visited.has(id)) return;
      visited.add(id);
      pathIds.add(id);
      const incoming = graph.edges.filter(e => e.target === id);
      incoming.forEach(e => walkBack(e.source));
    }
    walkBack(opp.id);
  }

  return pathIds;
}
