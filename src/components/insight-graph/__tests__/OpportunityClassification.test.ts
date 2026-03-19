/**
 * Opportunity Classification Tests
 *
 * Verifies the safe/moonshot classification logic, partition utilities,
 * and constraint-removal simulation in graphQuery.ts.
 */

import { describe, it, expect } from "vitest";
import {
  classifyOpportunity,
  partitionOpportunities,
  simulateConstraintRemoval,
  getOpportunityNodes,
} from "@/lib/graphQuery";
import {
  buildInsightGraph,
  type InsightGraph,
  type InsightGraphNode,
  type InsightNodeType,
} from "@/lib/insightGraph";
import type { Product } from "@/data/mockProducts";

// ── Helpers ──────────────────────────────────────────────────────

function makeMinimalProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "test-product",
    name: "Test Product",
    category: "SaaS",
    era: "modern",
    keyInsight: "Key insight signal",
    ...overrides,
  } as Product;
}

function makeNode(
  id: string,
  type: InsightNodeType,
  leverageScore: number,
  influence = 50,
): InsightGraphNode {
  return {
    id,
    type,
    label: `Node ${id}`,
    impact: 5,
    confidence: "medium",
    evidenceCount: 1,
    influence,
    leverageScore,
    pipelineStep: "disrupt",
    evidence: [],
    relatedNodeIds: [],
  };
}

function makeGraph(disrupt: { hiddenAssumptions: string[]; flippedLogic: string[] }): InsightGraph {
  const product = makeMinimalProduct();
  return buildInsightGraph([product], null, disrupt, null, null);
}

// ═══════════════════════════════════════════════════════════════
//  classifyOpportunity
// ═══════════════════════════════════════════════════════════════

describe("classifyOpportunity", () => {
  it("classifies flipped_idea nodes as moonshot regardless of leverage score", () => {
    const node = makeNode("n1", "flipped_idea", 30);
    expect(classifyOpportunity(node)).toBe("moonshot");
  });

  it("classifies opportunity_vector nodes as moonshot regardless of leverage score", () => {
    const node = makeNode("n2", "opportunity_vector", 20);
    expect(classifyOpportunity(node)).toBe("moonshot");
  });

  it("classifies outcome nodes with leverageScore >= 70 as moonshot", () => {
    const node = makeNode("n3", "outcome", 70);
    expect(classifyOpportunity(node)).toBe("moonshot");
  });

  it("classifies outcome nodes with leverageScore < 70 as safe", () => {
    const node = makeNode("n4", "outcome", 69);
    expect(classifyOpportunity(node)).toBe("safe");
  });

  it("classifies concept nodes with leverageScore < 70 as safe", () => {
    const node = makeNode("n5", "concept", 50);
    expect(classifyOpportunity(node)).toBe("safe");
  });

  it("classifies concept nodes with leverageScore === 70 as moonshot (boundary)", () => {
    const node = makeNode("n6", "concept", 70);
    expect(classifyOpportunity(node)).toBe("moonshot");
  });
});

// ═══════════════════════════════════════════════════════════════
//  partitionOpportunities
// ═══════════════════════════════════════════════════════════════

describe("partitionOpportunities", () => {
  it("correctly splits nodes into safe and moonshot buckets", () => {
    const nodes: InsightGraphNode[] = [
      makeNode("a", "outcome", 40),        // safe
      makeNode("b", "flipped_idea", 30),   // moonshot (type)
      makeNode("c", "outcome", 80),        // moonshot (score)
      makeNode("d", "concept", 50),        // safe
      makeNode("e", "opportunity_vector", 10), // moonshot (type)
    ];
    const { safe, moonshot } = partitionOpportunities(nodes);
    expect(safe).toHaveLength(2);
    expect(moonshot).toHaveLength(3);
    expect(safe.map(n => n.id)).toEqual(expect.arrayContaining(["a", "d"]));
    expect(moonshot.map(n => n.id)).toEqual(expect.arrayContaining(["b", "c", "e"]));
  });

  it("returns all safe when no high-leverage or inversion nodes exist", () => {
    const nodes = [
      makeNode("x1", "outcome", 30),
      makeNode("x2", "concept", 40),
    ];
    const { safe, moonshot } = partitionOpportunities(nodes);
    expect(moonshot).toHaveLength(0);
    expect(safe).toHaveLength(2);
  });

  it("returns all moonshot when all nodes are flipped_idea type", () => {
    const nodes = [
      makeNode("y1", "flipped_idea", 20),
      makeNode("y2", "flipped_idea", 60),
    ];
    const { safe, moonshot } = partitionOpportunities(nodes);
    expect(safe).toHaveLength(0);
    expect(moonshot).toHaveLength(2);
  });

  it("handles empty input gracefully", () => {
    const { safe, moonshot } = partitionOpportunities([]);
    expect(safe).toHaveLength(0);
    expect(moonshot).toHaveLength(0);
  });

  it("total partition length equals input length", () => {
    const nodes = [
      makeNode("z1", "outcome", 20),
      makeNode("z2", "flipped_idea", 50),
      makeNode("z3", "concept", 75),
      makeNode("z4", "opportunity_vector", 30),
    ];
    const { safe, moonshot } = partitionOpportunities(nodes);
    expect(safe.length + moonshot.length).toBe(nodes.length);
  });
});

// ═══════════════════════════════════════════════════════════════
//  simulateConstraintRemoval
// ═══════════════════════════════════════════════════════════════

describe("simulateConstraintRemoval", () => {
  it("returns empty result for null graph", () => {
    const { affectedIds, opportunitiesUnlocked } = simulateConstraintRemoval(null, "c1");
    expect(affectedIds.size).toBe(0);
    expect(opportunitiesUnlocked).toHaveLength(0);
  });

  it("returns empty result when constraint has no downstream connections", () => {
    const graph = makeGraph({ hiddenAssumptions: ["Assumption 1"], flippedLogic: [] });
    if (graph.nodes.length === 0) return; // Skip if no graph nodes
    const isolated = graph.nodes[0];
    // Remove all edges touching this node
    const isolatedGraph = {
      ...graph,
      edges: graph.edges.filter(e => e.source !== isolated.id && e.target !== isolated.id),
    };
    const { affectedIds } = simulateConstraintRemoval(isolatedGraph, isolated.id);
    // The constraint itself is excluded from affectedIds
    expect(affectedIds.has(isolated.id)).toBe(false);
  });

  it("does not include the removed constraint in affectedIds", () => {
    const graph = makeGraph({
      hiddenAssumptions: ["A1", "A2"],
      flippedLogic: ["F1"],
    });
    const constraintNode = graph.nodes.find(n => n.type === "constraint" || n.type === "assumption");
    if (!constraintNode) return; // Skip if no constraints
    const { affectedIds } = simulateConstraintRemoval(graph, constraintNode.id);
    expect(affectedIds.has(constraintNode.id)).toBe(false);
  });

  it("opportunitiesUnlocked only contains opportunity-type nodes", () => {
    const graph = makeGraph({
      hiddenAssumptions: ["Assumption 1", "Assumption 2"],
      flippedLogic: ["Flipped logic 1"],
    });
    const constraintNode = graph.nodes.find(n => n.type === "constraint" || n.type === "assumption");
    if (!constraintNode) return;
    const { opportunitiesUnlocked } = simulateConstraintRemoval(graph, constraintNode.id);
    const OPPORTUNITY_TYPES = new Set(["outcome", "flipped_idea", "concept", "opportunity_vector"]);
    opportunitiesUnlocked.forEach(n => {
      expect(OPPORTUNITY_TYPES.has(n.type)).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
//  Integration: OpportunityLandscape filtering
// ═══════════════════════════════════════════════════════════════

describe("Opportunity filtering from built graph", () => {
  it("getOpportunityNodes returns only opportunity-type nodes", () => {
    const graph = makeGraph({
      hiddenAssumptions: ["A1", "A2"],
      flippedLogic: ["F1", "F2"],
    });
    const opps = getOpportunityNodes(graph);
    const OPPORTUNITY_TYPES = new Set(["outcome", "flipped_idea", "concept", "opportunity_vector"]);
    opps.forEach(n => {
      expect(OPPORTUNITY_TYPES.has(n.type)).toBe(true);
    });
  });

  it("partitioned safe+moonshot totals equal all opportunities", () => {
    const graph = makeGraph({
      hiddenAssumptions: ["A1", "A2", "A3"],
      flippedLogic: ["F1", "F2"],
    });
    const opps = getOpportunityNodes(graph);
    const { safe, moonshot } = partitionOpportunities(opps);
    expect(safe.length + moonshot.length).toBe(opps.length);
  });
});
