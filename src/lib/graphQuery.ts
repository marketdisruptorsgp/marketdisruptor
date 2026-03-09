/**
 * GRAPH QUERY LAYER — Typed utilities for querying the Insight Graph
 *
 * Provides a thin, consistent API for UI components to read from the
 * persisted reasoning graph without duplicating filter logic.
 *
 * All UI components should use these utilities instead of directly
 * filtering graph.nodes or graph.edges.
 */

import type { InsightGraph, InsightGraphNode, InsightGraphEdge, InsightNodeType, EdgeRelation } from "@/lib/insightGraph";

// ═══════════════════════════════════════════════════════════════
//  NODE QUERIES
// ═══════════════════════════════════════════════════════════════

/** Get all nodes of a specific type */
export function getNodesByType(graph: InsightGraph | null, type: InsightNodeType): InsightGraphNode[] {
  if (!graph) return [];
  return graph.nodes.filter(n => n.type === type);
}

/** Get all opportunity-class nodes (strategic outcomes, not structural internals) */
export function getOpportunityNodes(graph: InsightGraph | null): InsightGraphNode[] {
  if (!graph) return [];
  const OPPORTUNITY_TYPES: Set<InsightNodeType> = new Set([
    "outcome", "flipped_idea", "concept", "opportunity_vector",
  ]);
  return graph.nodes.filter(n => OPPORTUNITY_TYPES.has(n.type));
}

/** Get all constraint nodes */
export function getConstraintNodes(graph: InsightGraph | null): InsightGraphNode[] {
  return getNodesByType(graph, "constraint");
}

/** Get all scenario nodes */
export function getScenarioNodes(graph: InsightGraph | null): InsightGraphNode[] {
  return getNodesByType(graph, "scenario");
}

/** Get all insight nodes */
export function getInsightNodes(graph: InsightGraph | null): InsightGraphNode[] {
  return getNodesByType(graph, "insight");
}

/** Get all pathway nodes */
export function getPathwayNodes(graph: InsightGraph | null): InsightGraphNode[] {
  return getNodesByType(graph, "pathway");
}

/** Get a node by ID */
export function getNodeById(graph: InsightGraph | null, id: string): InsightGraphNode | undefined {
  if (!graph) return undefined;
  return graph.nodes.find(n => n.id === id);
}

// ═══════════════════════════════════════════════════════════════
//  EDGE QUERIES
// ═══════════════════════════════════════════════════════════════

/** Get all edges of a specific relation type */
export function getEdgesByRelation(graph: InsightGraph | null, relation: EdgeRelation): InsightGraphEdge[] {
  if (!graph) return [];
  return graph.edges.filter(e => e.relation === relation);
}

/** Get all edges connected to a specific node (as source or target) */
export function getEdgesForNode(graph: InsightGraph | null, nodeId: string): InsightGraphEdge[] {
  if (!graph) return [];
  return graph.edges.filter(e => e.source === nodeId || e.target === nodeId);
}

/** Get upstream nodes (nodes that have edges pointing TO this node) */
export function getUpstreamNodes(graph: InsightGraph | null, nodeId: string): InsightGraphNode[] {
  if (!graph) return [];
  const sourceIds = graph.edges.filter(e => e.target === nodeId).map(e => e.source);
  return graph.nodes.filter(n => sourceIds.includes(n.id));
}

/** Get downstream nodes (nodes that this node points TO) */
export function getDownstreamNodes(graph: InsightGraph | null, nodeId: string): InsightGraphNode[] {
  if (!graph) return [];
  const targetIds = graph.edges.filter(e => e.source === nodeId).map(e => e.target);
  return graph.nodes.filter(n => targetIds.includes(n.id));
}

// ═══════════════════════════════════════════════════════════════
//  TRAVERSAL QUERIES
// ═══════════════════════════════════════════════════════════════

/** Get all constraint nodes upstream of a specific opportunity node */
export function getUpstreamConstraints(graph: InsightGraph | null, opportunityNodeId: string): InsightGraphNode[] {
  if (!graph) return [];
  const visited = new Set<string>();
  const constraints: InsightGraphNode[] = [];

  function walk(nodeId: string, depth: number) {
    if (depth > 5 || visited.has(nodeId)) return;
    visited.add(nodeId);
    const upstream = getUpstreamNodes(graph, nodeId);
    for (const node of upstream) {
      if (node.type === "constraint") {
        constraints.push(node);
      }
      walk(node.id, depth + 1);
    }
  }

  walk(opportunityNodeId, 0);
  return constraints;
}

/** Get all paths from constraints to a specific opportunity (up to depth 5) */
export function getPathsToOpportunity(graph: InsightGraph | null, opportunityNodeId: string): InsightGraphNode[][] {
  if (!graph) return [];
  const paths: InsightGraphNode[][] = [];
  const maxDepth = 5;

  function dfs(nodeId: string, currentPath: InsightGraphNode[], depth: number) {
    if (depth > maxDepth) return;
    const node = getNodeById(graph, nodeId);
    if (!node) return;

    const newPath = [...currentPath, node];

    if (node.type === "constraint") {
      paths.push(newPath.reverse()); // Return constraint → opportunity order
      return;
    }

    const upstream = getUpstreamNodes(graph, nodeId);
    for (const up of upstream) {
      if (!currentPath.some(p => p.id === up.id)) {
        dfs(up.id, newPath, depth + 1);
      }
    }
  }

  dfs(opportunityNodeId, [], 0);
  return paths;
}

// ═══════════════════════════════════════════════════════════════
//  GRAPH STATISTICS
// ═══════════════════════════════════════════════════════════════

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<string, number>;
  edgesByRelation: Record<string, number>;
  opportunityCount: number;
  constraintCount: number;
  scenarioCount: number;
}

export function getGraphStats(graph: InsightGraph | null): GraphStats {
  if (!graph) return {
    totalNodes: 0, totalEdges: 0, nodesByType: {}, edgesByRelation: {},
    opportunityCount: 0, constraintCount: 0, scenarioCount: 0,
  };

  const nodesByType: Record<string, number> = {};
  for (const n of graph.nodes) {
    nodesByType[n.type] = (nodesByType[n.type] || 0) + 1;
  }

  const edgesByRelation: Record<string, number> = {};
  for (const e of graph.edges) {
    edgesByRelation[e.relation] = (edgesByRelation[e.relation] || 0) + 1;
  }

  return {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    nodesByType,
    edgesByRelation,
    opportunityCount: getOpportunityNodes(graph).length,
    constraintCount: getConstraintNodes(graph).length,
    scenarioCount: getScenarioNodes(graph).length,
  };
}
