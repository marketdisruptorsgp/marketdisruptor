/**
 * Concept Expansion Engine — Design Space Types & Utilities
 *
 * Manages the structured design space generated from Opportunity nodes.
 * The dimension matrix is a separate data structure from the InsightGraph —
 * concept_variant nodes in the graph are lightweight references, while the
 * full generative matrix lives here.
 */

import type { InsightGraphNode, InsightGraphEdge, InsightGraph } from "@/lib/insightGraph";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

/** A single design dimension (e.g., "Form Factor", "Input Mechanism") */
export interface DesignDimension {
  id: string;
  name: string;
  /** Where this dimension was derived from (constraint or leverage point ID) */
  derivedFrom: string;
  derivedFromType: "constraint" | "leverage_point" | "driver" | "insight";
  /** Possible values along this dimension */
  values: DimensionValue[];
}

/** A specific value within a dimension (e.g., "Desk mat", "Wearable") */
export interface DimensionValue {
  id: string;
  label: string;
  feasibility: "high" | "medium" | "low";
  novelty: "high" | "medium" | "low";
}

export type QualitativeTier = "strong" | "moderate" | "early";

/** A concept variant — a specific combination of dimension values */
export interface ConceptVariant {
  id: string;
  name: string;
  description: string;
  /** Map of dimensionId → selected valueId */
  dimensionValues: Record<string, string>;
  /** Human-readable summary of the combination */
  formula: string;
  /** Qualitative assessments */
  feasibility: QualitativeTier;
  novelty: QualitativeTier;
  marketReadiness: QualitativeTier;
  /** Whether user has selected this for stress testing */
  selectedForStressTest: boolean;
}

/** The full concept space generated from a single Opportunity */
export interface ConceptSpace {
  id: string;
  opportunityNodeId: string;
  opportunityLabel: string;
  dimensions: DesignDimension[];
  variants: ConceptVariant[];
  generatedAt: string;
  /** Upstream context used to generate this space */
  upstreamConstraintIds: string[];
  upstreamLeverageIds: string[];
}

// ═══════════════════════════════════════════════════════════════
//  GRAPH INJECTION — Convert ConceptSpace → Graph Nodes/Edges
// ═══════════════════════════════════════════════════════════════

/**
 * Inject concept variant nodes into an existing InsightGraph.
 * Returns a new graph with the concept nodes added.
 */
export function injectConceptVariants(
  graph: InsightGraph,
  conceptSpace: ConceptSpace,
): InsightGraph {
  const newNodes: InsightGraphNode[] = [];
  const newEdges: InsightGraphEdge[] = [];
  let edgeIdx = graph.edges.length;

  for (const variant of conceptSpace.variants) {
    const nodeId = `cv-${variant.id}`;

    newNodes.push({
      id: nodeId,
      type: "concept_variant",
      label: variant.name,
      detail: variant.description,
      impact: 0,
      confidence: variant.feasibility === "strong" ? "high" : variant.feasibility === "moderate" ? "medium" : "low",
      evidenceCount: conceptSpace.dimensions.length,
      influence: 0,
      leverageScore: 0,
      pipelineStep: "redesign",
      evidence: [variant.formula],
      relatedNodeIds: [conceptSpace.opportunityNodeId],
      intelligenceLayer: "opportunity",
      conceptVariantData: {
        dimensionValues: variant.dimensionValues,
        formula: variant.formula,
        feasibility: variant.feasibility,
        novelty: variant.novelty,
        marketReadiness: variant.marketReadiness,
        selectedForStressTest: variant.selectedForStressTest,
        conceptSpaceId: conceptSpace.id,
      },
    });

    // Edge: Opportunity → Concept Variant
    newEdges.push({
      id: `e-cv-${++edgeIdx}`,
      source: conceptSpace.opportunityNodeId,
      target: nodeId,
      relation: "variant_of",
      weight: 0.8,
      category: "design",
    });
  }

  return {
    nodes: [...graph.nodes, ...newNodes],
    edges: [...graph.edges, ...newEdges],
    topNodes: graph.topNodes,
  };
}

/**
 * Remove concept variants for a specific opportunity from the graph.
 */
export function removeConceptVariants(
  graph: InsightGraph,
  opportunityNodeId: string,
): InsightGraph {
  const variantIds = new Set(
    graph.edges
      .filter(e => e.source === opportunityNodeId && e.relation === "variant_of")
      .map(e => e.target)
  );

  return {
    nodes: graph.nodes.filter(n => !variantIds.has(n.id)),
    edges: graph.edges.filter(e => !variantIds.has(e.target) && !variantIds.has(e.source)),
    topNodes: graph.topNodes,
  };
}
