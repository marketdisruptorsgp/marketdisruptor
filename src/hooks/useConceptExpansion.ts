/**
 * useConceptExpansion — Hook for generating and managing concept spaces
 */

import { useState, useCallback } from "react";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import type { ConceptSpace } from "@/lib/conceptExpansion";
import type { InsightGraph, InsightGraphNode } from "@/lib/insightGraph";
import { toast } from "sonner";

export function useConceptExpansion(graph: InsightGraph) {
  const [conceptSpaces, setConceptSpaces] = useState<Map<string, ConceptSpace>>(new Map());
  const [loading, setLoading] = useState<string | null>(null); // opportunityNodeId being generated

  const getUpstreamContext = useCallback((nodeId: string) => {
    const constraints: string[] = [];
    const leveragePoints: string[] = [];
    const visited = new Set<string>();

    function walkUp(id: string) {
      if (visited.has(id)) return;
      visited.add(id);
      const node = graph.nodes.find(n => n.id === id);
      if (node) {
        if (node.type === "constraint" || node.type === "friction") constraints.push(node.label);
        if (node.type === "leverage_point") leveragePoints.push(node.label);
      }
      graph.edges
        .filter(e => e.target === id)
        .forEach(e => walkUp(e.source));
    }

    walkUp(nodeId);
    return { constraints: constraints.slice(0, 8), leveragePoints: leveragePoints.slice(0, 6) };
  }, [graph]);

  const generateConceptSpace = useCallback(async (node: InsightGraphNode) => {
    if (loading) return;
    setLoading(node.id);

    try {
      const { constraints, leveragePoints } = getUpstreamContext(node.id);

      const { data, error } = await invokeWithTimeout<any>(
        "generate-concept-space",
        {
          body: {
            opportunityLabel: node.label,
            opportunityDetail: node.detail || node.reasoning || "",
            constraints,
            leveragePoints,
          },
        },
        120_000,
      );

      if (error) {
        const msg = error?.message || String(error);
        toast.error(msg.includes("Rate limit") ? "Rate limit exceeded — try again shortly" :
                     msg.includes("Usage limit") ? "Usage limit reached — add credits to continue" :
                     "Failed to generate concept space");
        return null;
      }

      if (!data?.dimensions || !data?.variants) {
        toast.error("AI returned incomplete concept space — try again");
        return null;
      }

      const space: ConceptSpace = {
        id: `cs-${node.id}-${Date.now()}`,
        opportunityNodeId: node.id,
        opportunityLabel: node.label,
        dimensions: data.dimensions.map((d: any) => ({
          ...d,
          derivedFromType: constraints.some(c => c === d.derivedFrom) ? "constraint" as const : "leverage_point" as const,
        })),
        variants: data.variants.map((v: any) => ({
          ...v,
          selectedForStressTest: false,
        })),
        generatedAt: new Date().toISOString(),
        upstreamConstraintIds: graph.edges
          .filter(e => e.target === node.id)
          .map(e => graph.nodes.find(n => n.id === e.source))
          .filter(n => n?.type === "constraint")
          .map(n => n!.id),
        upstreamLeverageIds: graph.edges
          .filter(e => e.target === node.id)
          .map(e => graph.nodes.find(n => n.id === e.source))
          .filter(n => n?.type === "leverage_point")
          .map(n => n!.id),
      };

      setConceptSpaces(prev => new Map(prev).set(node.id, space));
      toast.success(`Generated ${space.variants.length} concept directions across ${space.dimensions.length} dimensions`);
      return space;
    } catch (err) {
      console.error("Concept expansion error:", err);
      toast.error("Concept generation failed — please try again");
      return null;
    } finally {
      setLoading(null);
    }
  }, [loading, getUpstreamContext, graph]);

  const toggleVariantSelection = useCallback((opportunityNodeId: string, variantId: string) => {
    setConceptSpaces(prev => {
      const next = new Map(prev);
      const space = next.get(opportunityNodeId);
      if (!space) return prev;
      next.set(opportunityNodeId, {
        ...space,
        variants: space.variants.map(v =>
          v.id === variantId ? { ...v, selectedForStressTest: !v.selectedForStressTest } : v
        ),
      });
      return next;
    });
  }, []);

  const getConceptSpace = useCallback((opportunityNodeId: string) => {
    return conceptSpaces.get(opportunityNodeId) ?? null;
  }, [conceptSpaces]);

  return {
    generateConceptSpace,
    getConceptSpace,
    toggleVariantSelection,
    loading,
    conceptSpaces,
  };
}
