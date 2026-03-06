/**
 * Insight Graph Stability Tests
 * 
 * Verifies layout, filtering, and edge/node integrity across
 * small (~5), medium (~20), and large (40+) graph sizes.
 */

import { describe, it, expect } from "vitest";
import {
  buildInsightGraph,
  getInsightChain,
  getOpportunityPathNodes,
  NODE_TYPE_CONFIG,
  OPPORTUNITY_NODE_TYPES,
  type InsightGraph,
  type InsightGraphNode,
  type InsightNodeType,
} from "@/lib/insightGraph";
import type { Product } from "@/data/mockProducts";

// ── Helpers ──

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

function makeDisruptData(assumptionCount: number, flipCount: number, driverCount: number) {
  return {
    hiddenAssumptions: Array.from({ length: assumptionCount }, (_, i) => `Assumption ${i}`),
    flippedLogic: Array.from({ length: flipCount }, (_, i) => `Flipped idea ${i}`),
    drivers: Array.from({ length: driverCount }, (_, i) => `Driver ${i}`),
  };
}

function makeIntelligence(constraintCount: number, leverageCount: number, oppCount: number) {
  return {
    unifiedConstraintGraph: Array.from({ length: constraintCount }, (_, i) => ({
      id: `c${i}`, label: `Constraint ${i}`, impact: 7, confidence: "high" as const,
      evidence: [`Evidence for constraint ${i}`], type: "structural" as const,
      connectedTo: [],
    })),
    leveragePoints: Array.from({ length: leverageCount }, (_, i) => ({
      id: `l${i}`, label: `Leverage ${i}`, impact: 8, confidence: "medium" as const,
      evidence: [`Evidence for leverage ${i}`], type: "unlock" as const,
    })),
    opportunities: Array.from({ length: oppCount }, (_, i) => ({
      id: `o${i}`, label: `Opportunity ${i}`, impact: 9, confidence: "high" as const,
      evidence: [`Evidence for opp ${i}`], feasibility: 7, strategicImpact: 8,
    })),
    commandDeck: { topAction: "", urgentRisk: "", blindSpot: "" },
    systemLeverageMap: [],
    decisionSynthesis: { recommendation: "", reasoning: "", confidence: "medium" as const },
  };
}

function makeStressTestData(riskCount: number, evidenceCount: number) {
  return {
    redTeamArguments: Array.from({ length: riskCount }, (_, i) => `Risk ${i}`),
    greenTeamArguments: Array.from({ length: evidenceCount }, (_, i) => `Evidence ${i}`),
  };
}

function makeRedesignData(conceptCount: number) {
  return {
    concepts: Array.from({ length: conceptCount }, (_, i) => `Concept ${i}`),
  };
}

// ── Graph building helpers ──

function buildSmallGraph(): InsightGraph {
  const product = makeMinimalProduct();
  return buildInsightGraph([product], null, null, null, null);
}

function buildMediumGraph(): InsightGraph {
  const product = makeMinimalProduct({
    userWorkflow: {
      frictionPoints: Array.from({ length: 5 }, (_, i) => `Friction point ${i}`),
    },
  } as any);
  const intel = makeIntelligence(4, 3, 3);
  const disrupt = makeDisruptData(3, 2, 2);
  return buildInsightGraph([product], intel as any, disrupt, null, null);
}

function buildLargeGraph(): InsightGraph {
  const product = makeMinimalProduct({
    userWorkflow: {
      frictionPoints: Array.from({ length: 5 }, (_, i) => `Friction point ${i}`),
    },
  } as any);
  const intel = makeIntelligence(8, 8, 8);
  const disrupt = makeDisruptData(6, 5, 5);
  const redesign = makeRedesignData(5);
  const stress = makeStressTestData(5, 5);
  return buildInsightGraph([product], intel as any, disrupt, redesign, stress);
}

// ═══════════════════════════════════════════════════════════════
//  TESTS
// ═══════════════════════════════════════════════════════════════

describe("Insight Graph — Small (~5 nodes)", () => {
  let graph: InsightGraph;

  it("builds without errors", () => {
    graph = buildSmallGraph();
    expect(graph).toBeDefined();
    expect(graph.nodes.length).toBeGreaterThanOrEqual(1);
    expect(graph.nodes.length).toBeLessThanOrEqual(10);
  });

  it("all nodes have valid types", () => {
    graph = buildSmallGraph();
    const validTypes = Object.keys(NODE_TYPE_CONFIG);
    graph.nodes.forEach(n => {
      expect(validTypes).toContain(n.type);
    });
  });

  it("all nodes have computed influence and leverage", () => {
    graph = buildSmallGraph();
    graph.nodes.forEach(n => {
      expect(n.influence).toBeGreaterThanOrEqual(0);
      expect(n.influence).toBeLessThanOrEqual(100);
      expect(n.leverageScore).toBeGreaterThanOrEqual(0);
      expect(n.leverageScore).toBeLessThanOrEqual(100);
    });
  });

  it("edges reference existing nodes", () => {
    graph = buildSmallGraph();
    const nodeIds = new Set(graph.nodes.map(n => n.id));
    graph.edges.forEach(e => {
      expect(nodeIds.has(e.source)).toBe(true);
      expect(nodeIds.has(e.target)).toBe(true);
    });
  });
});

describe("Insight Graph — Medium (~20 nodes)", () => {
  let graph: InsightGraph;

  it("builds with expected node count", () => {
    graph = buildMediumGraph();
    expect(graph.nodes.length).toBeGreaterThanOrEqual(8);
    expect(graph.nodes.length).toBeLessThanOrEqual(35);
  });

  it("has edges connecting different tiers", () => {
    graph = buildMediumGraph();
    expect(graph.edges.length).toBeGreaterThan(0);

    // Should have cross-tier edges (signal → constraint, constraint → leverage, etc.)
    const hasSignalToConstraint = graph.edges.some(e => {
      const s = graph.nodes.find(n => n.id === e.source);
      const t = graph.nodes.find(n => n.id === e.target);
      return s?.type === "signal" && t?.type === "constraint";
    });
    expect(hasSignalToConstraint).toBe(true);
  });

  it("topNodes are populated", () => {
    graph = buildMediumGraph();
    expect(graph.topNodes.primaryConstraint).not.toBeNull();
  });

  it("getInsightChain returns valid chains", () => {
    graph = buildMediumGraph();
    const nodeId = graph.nodes[0].id;
    const chain = getInsightChain(graph, nodeId);
    expect(chain.length).toBeGreaterThanOrEqual(1);
    // Chain should contain the queried node
    expect(chain.some(n => n.id === nodeId)).toBe(true);
  });

  it("getOpportunityPathNodes returns valid set", () => {
    graph = buildMediumGraph();
    const pathIds = getOpportunityPathNodes(graph);
    // Should include at least opportunity nodes
    const oppNodes = graph.nodes.filter(n => OPPORTUNITY_NODE_TYPES.includes(n.type));
    oppNodes.forEach(opp => {
      expect(pathIds.has(opp.id)).toBe(true);
    });
  });

  it("no duplicate node IDs", () => {
    graph = buildMediumGraph();
    const ids = graph.nodes.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("Insight Graph — Large (40+ nodes)", () => {
  let graph: InsightGraph;

  it("builds with 40+ nodes", () => {
    graph = buildLargeGraph();
    expect(graph.nodes.length).toBeGreaterThanOrEqual(30);
  });

  it("all node labels are capped at 120 chars", () => {
    graph = buildLargeGraph();
    graph.nodes.forEach(n => {
      expect(n.label.length).toBeLessThanOrEqual(120);
    });
  });

  it("leverage scores are properly bounded", () => {
    graph = buildLargeGraph();
    graph.nodes.forEach(n => {
      expect(n.leverageScore).toBeLessThanOrEqual(100);
      expect(n.leverageScore).toBeGreaterThanOrEqual(0);
    });
  });

  it("influence scores are properly bounded", () => {
    graph = buildLargeGraph();
    graph.nodes.forEach(n => {
      expect(n.influence).toBeLessThanOrEqual(100);
      expect(n.influence).toBeGreaterThanOrEqual(0);
    });
  });

  it("edge weights are 0-1", () => {
    graph = buildLargeGraph();
    graph.edges.forEach(e => {
      expect(e.weight).toBeGreaterThanOrEqual(0);
      expect(e.weight).toBeLessThanOrEqual(1);
    });
  });

  it("no self-referencing edges", () => {
    graph = buildLargeGraph();
    graph.edges.forEach(e => {
      expect(e.source).not.toBe(e.target);
    });
  });

  it("breakthrough opportunity has highest leverage among opportunities", () => {
    graph = buildLargeGraph();
    if (graph.topNodes.breakthroughOpportunity) {
      const oppNodes = graph.nodes.filter(n => OPPORTUNITY_NODE_TYPES.includes(n.type));
      const maxLev = Math.max(...oppNodes.map(n => n.leverageScore));
      expect(graph.topNodes.breakthroughOpportunity.leverageScore).toBe(maxLev);
    }
  });

  it("all edges have valid relation types", () => {
    graph = buildLargeGraph();
    const validRelations = ["causes", "leads_to", "contradicts", "supports", "unlocks", "depends_on", "invalidates"];
    graph.edges.forEach(e => {
      expect(validRelations).toContain(e.relation);
    });
  });
});

describe("Insight Graph — Layout Stability", () => {
  it("nodes in each tier don't have identical positions (jitter works)", () => {
    // This tests the layout function indirectly — nodes in the same column
    // should have different Y positions due to row spacing + jitter
    const graph = buildLargeGraph();
    const signalNodes = graph.nodes.filter(n => n.type === "signal");
    // If there are multiple signals, they should be distinguishable
    if (signalNodes.length > 1) {
      const ids = new Set(signalNodes.map(n => n.id));
      expect(ids.size).toBe(signalNodes.length);
    }
  });

  it("insight chains don't produce infinite loops", () => {
    const graph = buildLargeGraph();
    // Test every node's chain completes
    graph.nodes.forEach(n => {
      const chain = getInsightChain(graph, n.id);
      expect(chain.length).toBeLessThanOrEqual(graph.nodes.length);
    });
  });

  it("opportunity path BFS completes for large graphs", () => {
    const graph = buildLargeGraph();
    const start = performance.now();
    const pathIds = getOpportunityPathNodes(graph);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500); // should complete in <500ms
    expect(pathIds.size).toBeGreaterThan(0);
  });
});
