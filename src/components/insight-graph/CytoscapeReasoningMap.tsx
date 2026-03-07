/**
 * Cytoscape Reasoning Map — Interactive Strategic Discovery Engine
 *
 * Progressive reveal: starts with Opportunities + Leverage Points,
 * click-to-expand upstream. Auto-highlights strongest reasoning path.
 * Uses dagre layout for left-to-right causal flow.
 */

import { memo, useRef, useEffect, useMemo, useState, useCallback } from "react";
import cytoscape, { type Core, type EventObject, type NodeSingular } from "cytoscape";
import dagre from "cytoscape-dagre";
import { motion, AnimatePresence } from "framer-motion";
import type { InsightGraph, InsightGraphNode, InsightNodeType, InsightGraphEdge } from "@/lib/insightGraph";
import { NODE_TYPE_CONFIG, OPPORTUNITY_NODE_TYPES } from "@/lib/insightGraph";

// Register dagre layout
cytoscape.use(dagre);

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Core reasoning chain layers for progressive reveal */
const REVEAL_LAYERS: InsightNodeType[][] = [
  // Layer 0 (default): Opportunities + Pathways
  ["outcome", "flipped_idea", "concept", "pathway"],
  // Layer 1: + Leverage + Scenarios
  ["leverage_point", "driver", "scenario"],
  // Layer 2: + Constraints + Insights
  ["constraint", "insight", "friction"],
  // Layer 3: + Assumptions + Risks
  ["assumption", "risk", "competitor"],
  // Layer 4: + Signals + Evidence + Simulations
  ["signal", "evidence", "simulation"],
];

const EDGE_RELATION_COLORS: Record<string, string> = {
  causes: "hsl(0, 72%, 52%)",
  leads_to: "hsl(229, 89%, 63%)",
  contradicts: "hsl(14, 90%, 55%)",
  supports: "hsl(152, 60%, 44%)",
  unlocks: "hsl(262, 83%, 58%)",
  depends_on: "hsl(210, 14%, 53%)",
  invalidates: "hsl(0, 72%, 52%)",
  creates: "hsl(172, 66%, 50%)",
  enables: "hsl(152, 60%, 44%)",
  blocks: "hsl(14, 90%, 55%)",
  tests: "hsl(271, 81%, 55%)",
  variant_of: "hsl(180, 65%, 45%)",
};

// ═══════════════════════════════════════════════════════════════
//  BREAKTHROUGH PATH DETECTION
// ═══════════════════════════════════════════════════════════════

function findStrongestPath(graph: InsightGraph): string[] {
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
  const signalNodes = graph.nodes.filter(n => n.type === "signal" || n.type === "evidence");
  const oppNodes = graph.nodes.filter(n => OPPORTUNITY_NODE_TYPES.includes(n.type) || n.type === "pathway");

  if (signalNodes.length === 0 || oppNodes.length === 0) return [];

  // BFS from each signal to find paths to opportunities
  let bestPath: string[] = [];
  let bestScore = 0;

  for (const start of signalNodes.slice(0, 10)) {
    const visited = new Map<string, string[]>();
    const queue: { id: string; path: string[] }[] = [{ id: start.id, path: [start.id] }];
    visited.set(start.id, [start.id]);

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      if (path.length > 8) continue; // Limit chain depth

      const outEdges = graph.edges.filter(e => e.source === id);
      for (const edge of outEdges) {
        if (visited.has(edge.target)) continue;
        const newPath = [...path, edge.target];
        visited.set(edge.target, newPath);

        const targetNode = nodeMap.get(edge.target);
        if (targetNode && (OPPORTUNITY_NODE_TYPES.includes(targetNode.type) || targetNode.type === "pathway")) {
          // Score: path length * cumulative evidence count
          const score = newPath.reduce((sum, nid) => {
            const n = nodeMap.get(nid);
            return sum + (n?.evidenceCount ?? 0) + (n?.influence ?? 0) * 0.1;
          }, 0);
          if (score > bestScore) {
            bestScore = score;
            bestPath = newPath;
          }
        }
        queue.push({ id: edge.target, path: newPath });
      }
    }
  }

  return bestPath;
}

// ═══════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════

interface CytoscapeReasoningMapProps {
  graph: InsightGraph;
  onSelectNode?: (nodeId: string | null) => void;
  selectedNodeId?: string | null;
  onRequestSimulation?: (nodeId: string) => void;
}

export const CytoscapeReasoningMap = memo(function CytoscapeReasoningMap({
  graph,
  onSelectNode,
  selectedNodeId,
  onRequestSimulation,
}: CytoscapeReasoningMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [revealDepth, setRevealDepth] = useState(0);
  const [showAllSignals, setShowAllSignals] = useState(false);
  const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set());

  // Compute visible node types based on reveal depth
  const visibleTypes = useMemo(() => {
    const types = new Set<InsightNodeType>();
    for (let i = 0; i <= revealDepth; i++) {
      REVEAL_LAYERS[i]?.forEach(t => types.add(t));
    }
    return types;
  }, [revealDepth]);

  // Filter nodes based on progressive reveal
  const visibleNodes = useMemo(() => {
    return graph.nodes.filter(n => {
      if (!visibleTypes.has(n.type)) return false;
      // Auto-collapse weak signals unless toggled
      if (!showAllSignals && n.confidence === "low" && n.evidenceCount < 2 &&
          (n.type === "signal" || n.type === "evidence")) {
        return false;
      }
      return true;
    });
  }, [graph.nodes, visibleTypes, showAllSignals]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  const visibleEdges = useMemo(() => {
    return graph.edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [graph.edges, visibleNodeIds]);

  // Strongest path
  const strongestPath = useMemo(() => findStrongestPath(graph), [graph]);

  // Auto-highlight strongest path on load
  useEffect(() => {
    if (strongestPath.length > 0 && !selectedNodeId) {
      setHighlightedPath(new Set(strongestPath));
    }
  }, [strongestPath, selectedNodeId]);

  // Build Cytoscape elements
  const elements = useMemo(() => {
    const nodeEls = visibleNodes.map(n => {
      const cfg = NODE_TYPE_CONFIG[n.type];
      const isOnPath = highlightedPath.has(n.id);
      const isSelected = n.id === selectedNodeId;
      const isTopLeverage = n.id === graph.topNodes.primaryConstraint?.id;
      const isBreakthrough = n.id === graph.topNodes.breakthroughOpportunity?.id;
      const isDimmed = highlightedPath.size > 0 && !isOnPath && !isSelected;

      return {
        group: "nodes" as const,
        data: {
          id: n.id,
          label: n.label.length > 60 ? n.label.slice(0, 57) + "…" : n.label,
          fullLabel: n.label,
          nodeType: n.type,
          typeName: cfg.label,
          color: cfg.color,
          bgColor: cfg.bgColor,
          borderColor: isSelected || isBreakthrough || isTopLeverage ? cfg.color : cfg.borderColor,
          confidence: n.confidence,
          evidenceCount: n.evidenceCount,
          influence: n.influence,
          leverageScore: n.leverageScore,
          isOnPath,
          isSelected,
          isDimmed,
          isBreakthrough,
          isTopLeverage,
        },
      };
    });

    const edgeEls = visibleEdges.map(e => ({
      group: "edges" as const,
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        relation: e.relation,
        weight: e.weight,
        color: EDGE_RELATION_COLORS[e.relation] || "hsl(210, 14%, 53%)",
        isOnPath: highlightedPath.has(e.source) && highlightedPath.has(e.target),
      },
    }));

    return [...nodeEls, ...edgeEls];
  }, [visibleNodes, visibleEdges, highlightedPath, selectedNodeId, graph.topNodes]);

  // Initialize/update Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      layout: {
        name: "dagre",
        rankDir: "LR",
        nodeSep: 60,
        rankSep: 180,
        edgeSep: 30,
        padding: 40,
        animate: true,
        animationDuration: 600,
      } as any,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-wrap": "wrap" as any,
            "text-max-width": "160px",
            "font-size": "11px",
            "font-weight": 700,
            "text-valign": "center",
            "text-halign": "center",
            "background-color": "data(bgColor)",
            "border-width": 2,
            "border-color": "data(borderColor)",
            color: "data(color)",
            width: 180,
            height: 70,
            shape: "round-rectangle",
            "padding-top": "8px" as any,
            "padding-bottom": "8px" as any,
            "padding-left": "12px" as any,
            "padding-right": "12px" as any,
          },
        },
        {
          selector: "node[?isDimmed]",
          style: {
            opacity: 0.15,
          },
        },
        {
          selector: "node[?isOnPath]",
          style: {
            "border-width": 3,
            "border-color": "data(color)",
            opacity: 1,
          },
        },
        {
          selector: "node[?isSelected]",
          style: {
            "border-width": 4,
            "border-color": "data(color)",
            "background-color": "data(bgColor)",
            opacity: 1,
          },
        },
        {
          selector: "node[?isBreakthrough]",
          style: {
            "border-width": 3,
            "border-color": "data(color)",
            "border-style": "double" as any,
            opacity: 1,
          },
        },
        {
          selector: "edge",
          style: {
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "target-arrow-color": "data(color)",
            "line-color": "data(color)",
            width: 1.5,
            opacity: 0.3,
            "arrow-scale": 0.8,
          },
        },
        {
          selector: "edge[?isOnPath]",
          style: {
            width: 3,
            opacity: 0.85,
            "line-style": "solid",
            "target-arrow-color": "data(color)",
            "line-color": "data(color)",
          },
        },
      ],
      minZoom: 0.2,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    // Event handlers
    cy.on("tap", "node", (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      const nodeId = node.data("id");
      onSelectNode?.(nodeId === selectedNodeId ? null : nodeId);

      // Highlight reasoning chain on click
      const chainIds = new Set<string>();
      // Walk upstream
      const walkUp = (id: string, visited: Set<string>) => {
        if (visited.has(id)) return;
        visited.add(id);
        chainIds.add(id);
        graph.edges.filter(e => e.target === id).forEach(e => walkUp(e.source, visited));
      };
      // Walk downstream
      const walkDown = (id: string, visited: Set<string>) => {
        if (visited.has(id)) return;
        visited.add(id);
        chainIds.add(id);
        graph.edges.filter(e => e.source === id).forEach(e => walkDown(e.target, visited));
      };
      const visited = new Set<string>();
      walkUp(nodeId, visited);
      visited.delete(nodeId);
      walkDown(nodeId, visited);
      setHighlightedPath(chainIds);
    });

    cy.on("tap", (evt: EventObject) => {
      if (evt.target === cy) {
        onSelectNode?.(null);
        // Reset to strongest path
        if (strongestPath.length > 0) {
          setHighlightedPath(new Set(strongestPath));
        } else {
          setHighlightedPath(new Set());
        }
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, graph.edges, strongestPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expand upstream when double-tapping a node
  const handleExpandUpstream = useCallback(() => {
    if (revealDepth < REVEAL_LAYERS.length - 1) {
      setRevealDepth(d => d + 1);
    }
  }, [revealDepth]);

  const handleCollapseAll = useCallback(() => {
    setRevealDepth(0);
    setHighlightedPath(new Set(strongestPath));
    onSelectNode?.(null);
  }, [strongestPath, onSelectNode]);

  // Count nodes per visible type for legend
  const typeCounts = useMemo(() => {
    const counts: { type: InsightNodeType; count: number }[] = [];
    const countMap = new Map<InsightNodeType, number>();
    visibleNodes.forEach(n => countMap.set(n.type, (countMap.get(n.type) ?? 0) + 1));
    countMap.forEach((count, type) => counts.push({ type, count }));
    return counts.sort((a, b) => b.count - a.count);
  }, [visibleNodes]);

  const hiddenCount = graph.nodes.length - visibleNodes.length;

  if (graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full rounded-2xl bg-muted border border-border">
        <p className="text-sm text-muted-foreground">Run the analysis to populate the Reasoning Map.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      {/* Controls bar */}
      <div className="flex items-center gap-2 flex-wrap px-1">
        {/* Reveal depth controls */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5 bg-muted border border-border">
          {REVEAL_LAYERS.map((_, i) => {
            const labels = ["Opportunities", "+ Leverage", "+ Constraints", "+ Assumptions", "Full System"];
            return (
              <button
                key={i}
                onClick={() => setRevealDepth(i)}
                className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  background: revealDepth === i ? "hsl(var(--card))" : "transparent",
                  color: revealDepth === i ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: revealDepth === i ? "0 1px 3px hsl(0 0% 0% / 0.1)" : "none",
                }}
              >
                {labels[i]}
              </button>
            );
          })}
        </div>

        {/* Weak signals toggle */}
        {revealDepth >= 4 && (
          <button
            onClick={() => setShowAllSignals(!showAllSignals)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: showAllSignals ? "hsl(199 89% 48% / 0.1)" : "hsl(var(--muted))",
              border: showAllSignals ? "1px solid hsl(199 89% 48% / 0.3)" : "1px solid hsl(var(--border))",
              color: showAllSignals ? "hsl(199 89% 48%)" : "hsl(var(--muted-foreground))",
            }}
          >
            {showAllSignals ? "Hide" : "Show"} weak signals
          </button>
        )}

        {/* Reset */}
        {(revealDepth > 0 || selectedNodeId) && (
          <button
            onClick={handleCollapseAll}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset view
          </button>
        )}

        {/* Stats */}
        <span className="text-xs text-muted-foreground ml-auto">
          {visibleNodes.length} nodes · {visibleEdges.length} edges
          {hiddenCount > 0 && ` · ${hiddenCount} hidden`}
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-1">
        {typeCounts.map(({ type, count }) => {
          const cfg = NODE_TYPE_CONFIG[type];
          return (
            <div
              key={type}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold flex-shrink-0"
              style={{
                background: cfg.bgColor,
                border: `1px solid ${cfg.borderColor}`,
                color: cfg.color,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
              {cfg.label} ({count})
            </div>
          );
        })}
        {strongestPath.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold flex-shrink-0 bg-amber-500/10 border border-amber-500/30 text-amber-600">
            ★ Breakthrough path highlighted
          </div>
        )}
      </div>

      {/* Cytoscape canvas */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 rounded-xl overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1.5px solid hsl(var(--border))",
          minHeight: 400,
        }}
      />

      {/* Expand prompt */}
      <AnimatePresence>
        {hiddenCount > 0 && revealDepth < REVEAL_LAYERS.length - 1 && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            onClick={handleExpandUpstream}
            className="self-center px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "hsl(var(--primary) / 0.1)",
              border: "1px solid hsl(var(--primary) / 0.3)",
              color: "hsl(var(--primary))",
            }}
          >
            Reveal upstream reasoning ({hiddenCount} more nodes) →
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});
