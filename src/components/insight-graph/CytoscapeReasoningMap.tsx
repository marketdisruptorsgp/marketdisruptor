/**
 * Cytoscape Reasoning Map — Interactive Strategic Discovery Engine
 *
 * Tier Column Lanes: nodes are forced into strict vertical columns
 * by reasoning tier (Discovery → Opportunity → Concept → Validation)
 * with HTML column headers rendered as an overlay.
 *
 * Compound cluster nodes group concept variants under parent opportunities.
 * Edge styles differentiate discovered / inherited / design relationships.
 * Auto-highlights strongest reasoning path.
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
//  REASONING TIERS
// ═══════════════════════════════════════════════════════════════

interface ReasoningTier {
  id: string;
  label: string;
  types: InsightNodeType[];
  /** Accent color for column header */
  accent: string;
  accentBg: string;
}

const REASONING_TIERS: ReasoningTier[] = [
  {
    id: "discovery",
    label: "Discovery",
    types: ["signal", "evidence", "assumption"],
    accent: "hsl(199, 89%, 48%)",
    accentBg: "hsl(199, 89%, 48%, 0.06)",
  },
  {
    id: "opportunity",
    label: "Opportunity",
    types: [
      "constraint", "friction", "leverage_point", "driver", "insight",
      "outcome", "flipped_idea", "concept", "pathway", "scenario", "competitor",
    ],
    accent: "hsl(152, 60%, 44%)",
    accentBg: "hsl(152, 60%, 44%, 0.06)",
  },
  {
    id: "concept",
    label: "Concept",
    types: ["concept_variant"],
    accent: "hsl(180, 65%, 45%)",
    accentBg: "hsl(180, 65%, 45%, 0.06)",
  },
  {
    id: "validation",
    label: "Validation",
    types: ["simulation", "risk"],
    accent: "hsl(14, 90%, 55%)",
    accentBg: "hsl(14, 90%, 55%, 0.06)",
  },
];

/** Map node type → tier rank index (0-based) */
const NODE_TYPE_TO_TIER_RANK: Map<InsightNodeType, number> = new Map();
REASONING_TIERS.forEach((tier, idx) => {
  for (const t of tier.types) NODE_TYPE_TO_TIER_RANK.set(t, idx);
});

// ═══════════════════════════════════════════════════════════════
//  EDGE STYLES
// ═══════════════════════════════════════════════════════════════

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

  let bestPath: string[] = [];
  let bestScore = 0;

  for (const start of signalNodes.slice(0, 10)) {
    const visited = new Map<string, string[]>();
    const queue: { id: string; path: string[] }[] = [{ id: start.id, path: [start.id] }];
    visited.set(start.id, [start.id]);

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      if (path.length > 8) continue;

      const outEdges = graph.edges.filter(e => e.source === id);
      for (const edge of outEdges) {
        if (visited.has(edge.target)) continue;
        const newPath = [...path, edge.target];
        visited.set(edge.target, newPath);

        const targetNode = nodeMap.get(edge.target);
        if (targetNode && (OPPORTUNITY_NODE_TYPES.includes(targetNode.type) || targetNode.type === "pathway")) {
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
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function findConceptClusters(
  nodes: InsightGraphNode[],
  edges: InsightGraphEdge[],
): Map<string, string[]> {
  const clusters = new Map<string, string[]>();
  const variantIds = new Set(nodes.filter(n => n.type === "concept_variant").map(n => n.id));

  for (const edge of edges) {
    if (edge.relation === "variant_of" && variantIds.has(edge.target)) {
      if (!clusters.has(edge.source)) clusters.set(edge.source, []);
      clusters.get(edge.source)!.push(edge.target);
    }
  }
  return clusters;
}

function resolveEdgeCategory(edge: InsightGraphEdge): "discovered" | "inherited" | "design" {
  if (edge.category) return edge.category;
  if (edge.relation === "variant_of") return "design";
  if (edge.source.startsWith("cv-") || edge.target.startsWith("cv-")) return "inherited";
  return "discovered";
}

// ═══════════════════════════════════════════════════════════════
//  COLUMN HEADER OVERLAY
// ═══════════════════════════════════════════════════════════════

interface ColumnPosition {
  tierId: string;
  label: string;
  accent: string;
  accentBg: string;
  left: number;
  width: number;
  nodeCount: number;
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
  const [activeTiers, setActiveTiers] = useState<Set<string>>(new Set(["opportunity"]));
  const [showAllSignals, setShowAllSignals] = useState(false);
  const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set());
  const [columnPositions, setColumnPositions] = useState<ColumnPosition[]>([]);

  // Compute visible node types from active tiers
  const visibleTypes = useMemo(() => {
    const types = new Set<InsightNodeType>();
    for (const tier of REASONING_TIERS) {
      if (activeTiers.has(tier.id)) {
        tier.types.forEach(t => types.add(t));
      }
    }
    return types;
  }, [activeTiers]);

  // Active tier order (for rank assignment)
  const activeTierOrder = useMemo(() => {
    return REASONING_TIERS.filter(t => activeTiers.has(t.id));
  }, [activeTiers]);

  // Filter nodes
  const visibleNodes = useMemo(() => {
    return graph.nodes.filter(n => {
      if (!visibleTypes.has(n.type)) return false;
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

  const conceptClusters = useMemo(
    () => findConceptClusters(visibleNodes, visibleEdges),
    [visibleNodes, visibleEdges],
  );

  const strongestPath = useMemo(() => findStrongestPath(graph), [graph]);

  useEffect(() => {
    if (strongestPath.length > 0 && !selectedNodeId) {
      setHighlightedPath(new Set(strongestPath));
    }
  }, [strongestPath, selectedNodeId]);

  // Map active tier id → compressed rank index (only active tiers get ranks)
  const tierToRank = useMemo(() => {
    const map = new Map<string, number>();
    activeTierOrder.forEach((tier, idx) => map.set(tier.id, idx));
    return map;
  }, [activeTierOrder]);

  // Build Cytoscape elements with tier rank constraints
  const elements = useMemo(() => {
    const els: any[] = [];

    // Compound cluster parents
    const variantToCluster = new Map<string, string>();
    for (const [oppId, variantIds] of conceptClusters) {
      const clusterId = `cluster-${oppId}`;
      for (const vid of variantIds) variantToCluster.set(vid, clusterId);

      const cvCfg = NODE_TYPE_CONFIG["concept_variant"];
      const clusterRank = tierToRank.get("concept") ?? 2;
      els.push({
        group: "nodes" as const,
        data: {
          id: clusterId,
          label: "Design Space",
          isCluster: true,
          tierRank: clusterRank,
          color: cvCfg.color,
          bgColor: cvCfg.bgColor,
          borderColor: cvCfg.borderColor,
        },
      });
    }

    // Regular nodes
    for (const n of visibleNodes) {
      const cfg = NODE_TYPE_CONFIG[n.type];
      const isOnPath = highlightedPath.has(n.id);
      const isSelected = n.id === selectedNodeId;
      const isTopLeverage = n.id === graph.topNodes.primaryConstraint?.id;
      const isBreakthrough = n.id === graph.topNodes.breakthroughOpportunity?.id;
      const isDimmed = highlightedPath.size > 0 && !isOnPath && !isSelected;
      const isVariant = n.type === "concept_variant";

      // Determine tier rank for column alignment
      const globalTierIdx = NODE_TYPE_TO_TIER_RANK.get(n.type) ?? 1;
      const tierId = REASONING_TIERS[globalTierIdx]?.id ?? "opportunity";
      const rank = tierToRank.get(tierId) ?? 0;

      els.push({
        group: "nodes" as const,
        data: {
          id: n.id,
          ...(variantToCluster.has(n.id) ? { parent: variantToCluster.get(n.id) } : {}),
          label: n.label.length > 60 ? n.label.slice(0, 57) + "…" : n.label,
          fullLabel: n.label,
          nodeType: n.type,
          typeName: cfg.label,
          tierRank: rank,
          tierId,
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
          isVariant,
        },
      });
    }

    // Edges
    for (const e of visibleEdges) {
      const cat = resolveEdgeCategory(e);
      els.push({
        group: "edges" as const,
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          relation: e.relation,
          weight: e.weight,
          color: EDGE_RELATION_COLORS[e.relation] || "hsl(210, 14%, 53%)",
          isOnPath: highlightedPath.has(e.source) && highlightedPath.has(e.target),
          edgeCategory: cat,
        },
      });
    }

    return els;
  }, [visibleNodes, visibleEdges, highlightedPath, selectedNodeId, graph.topNodes, conceptClusters, tierToRank]);

  // Compute column positions from rendered node positions
  const updateColumnPositions = useCallback((cy: Core) => {
    const tierBounds: Record<string, { minX: number; maxX: number; count: number }> = {};

    cy.nodes("[!isCluster]").forEach(node => {
      const tierId = node.data("tierId") as string;
      if (!tierId) return;
      const bb = node.boundingBox({});
      if (!tierBounds[tierId]) {
        tierBounds[tierId] = { minX: bb.x1, maxX: bb.x2, count: 0 };
      }
      tierBounds[tierId].minX = Math.min(tierBounds[tierId].minX, bb.x1);
      tierBounds[tierId].maxX = Math.max(tierBounds[tierId].maxX, bb.x2);
      tierBounds[tierId].count++;
    });

    // Also include compound nodes
    cy.nodes(":parent").forEach(node => {
      const bb = node.boundingBox({});
      const tierId = "concept";
      if (!tierBounds[tierId]) {
        tierBounds[tierId] = { minX: bb.x1, maxX: bb.x2, count: 0 };
      }
      tierBounds[tierId].minX = Math.min(tierBounds[tierId].minX, bb.x1);
      tierBounds[tierId].maxX = Math.max(tierBounds[tierId].maxX, bb.x2);
    });

    if (Object.keys(tierBounds).length === 0) return;

    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const cols: ColumnPosition[] = [];
    for (const tier of activeTierOrder) {
      const bounds = tierBounds[tier.id];
      if (!bounds) continue;

      // Convert model coords to rendered pixel coords
      const p1 = cy.renderer().projectIntoViewport(bounds.minX, 0);
      const p2 = cy.renderer().projectIntoViewport(bounds.maxX, 0);

      const padding = 20;
      const left = Math.max(0, p1[0] - padding);
      const right = Math.min(containerRect.width, p2[0] + padding);

      cols.push({
        tierId: tier.id,
        label: tier.label,
        accent: tier.accent,
        accentBg: tier.accentBg,
        left,
        width: Math.max(right - left, 80),
        nodeCount: bounds.count,
      });
    }

    setColumnPositions(cols);
  }, [activeTierOrder]);

  // Initialize/update Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    if (cyRef.current) cyRef.current.destroy();

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      layout: {
        name: "dagre",
        rankDir: "LR",
        nodeSep: 60,
        rankSep: 220,
        edgeSep: 30,
        padding: 50,
        animate: true,
        animationDuration: 600,
        // Force tier column alignment via rank assignment
        rank: (node: any) => {
          return node.data("tierRank") ?? 0;
        },
      } as any,
      style: [
        // ── Regular nodes ──
        {
          selector: "node[!isCluster]",
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
        // ── Concept variant nodes (smaller, lighter) ──
        {
          selector: "node[?isVariant]",
          style: {
            width: 150,
            height: 54,
            "font-size": "10px",
            "font-weight": 600,
            opacity: 0.85,
          },
        },
        // ── Compound cluster (parent) nodes ──
        {
          selector: ":parent",
          style: {
            "background-color": "hsl(180, 65%, 45%)" as any,
            "background-opacity": 0.04,
            "border-width": 1.5,
            "border-color": "hsl(180, 65%, 45%)" as any,
            "border-opacity": 0.2,
            "border-style": "dashed" as any,
            shape: "round-rectangle",
            "padding-top": "28px" as any,
            "padding-bottom": "12px" as any,
            "padding-left": "12px" as any,
            "padding-right": "12px" as any,
            label: "data(label)",
            "text-valign": "top",
            "text-halign": "center",
            "font-size": "10px",
            "font-weight": 700,
            color: "hsl(180, 65%, 45%)" as any,
            "text-margin-y": 8,
          } as any,
        },
        // ── State: dimmed ──
        {
          selector: "node[?isDimmed]",
          style: {
            opacity: 0.15,
          },
        },
        // ── State: on breakthrough path ──
        {
          selector: "node[?isOnPath]",
          style: {
            "border-width": 3,
            "border-color": "data(color)",
            opacity: 1,
          },
        },
        // ── State: selected ──
        {
          selector: "node[?isSelected]",
          style: {
            "border-width": 4,
            "border-color": "data(color)",
            "background-color": "data(bgColor)",
            opacity: 1,
          },
        },
        // ── State: breakthrough node ──
        {
          selector: "node[?isBreakthrough]",
          style: {
            "border-width": 3,
            "border-color": "data(color)",
            "border-style": "double" as any,
            opacity: 1,
          },
        },
        // ── Edges: base ──
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
        // ── Edge category: discovered ──
        {
          selector: 'edge[edgeCategory="discovered"]',
          style: { "line-style": "solid", width: 1.5 },
        },
        // ── Edge category: inherited ──
        {
          selector: 'edge[edgeCategory="inherited"]',
          style: { "line-style": "dashed" as any, width: 1.5 },
        },
        // ── Edge category: design ──
        {
          selector: 'edge[edgeCategory="design"]',
          style: { "line-style": "dotted" as any, width: 1, opacity: 0.25, "arrow-scale": 0.6 },
        },
        // ── Edge state: on path ──
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

    // Update column headers after layout completes
    cy.on("layoutstop", () => updateColumnPositions(cy));
    // Also update on viewport changes (pan/zoom)
    cy.on("viewport", () => updateColumnPositions(cy));

    // Node click → highlight reasoning chain
    cy.on("tap", "node[!isCluster]", (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      const nodeId = node.data("id");
      onSelectNode?.(nodeId === selectedNodeId ? null : nodeId);

      const chainIds = new Set<string>();
      const walkUp = (id: string, visited: Set<string>) => {
        if (visited.has(id)) return;
        visited.add(id);
        chainIds.add(id);
        graph.edges.filter(e => e.target === id).forEach(e => walkUp(e.source, visited));
      };
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

    // Background click → reset
    cy.on("tap", (evt: EventObject) => {
      if (evt.target === cy) {
        onSelectNode?.(null);
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
  }, [elements, graph.edges, strongestPath, updateColumnPositions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle tier
  const toggleTier = useCallback((tierId: string) => {
    setActiveTiers(prev => {
      const next = new Set(prev);
      if (next.has(tierId)) {
        if (next.size > 1) next.delete(tierId);
      } else {
        next.add(tierId);
      }
      return next;
    });
  }, []);

  const handleResetView = useCallback(() => {
    setActiveTiers(new Set(["opportunity"]));
    setHighlightedPath(new Set(strongestPath));
    onSelectNode?.(null);
  }, [strongestPath, onSelectNode]);

  // Type counts for legend
  const typeCounts = useMemo(() => {
    const counts: { type: InsightNodeType; count: number }[] = [];
    const countMap = new Map<InsightNodeType, number>();
    visibleNodes.forEach(n => countMap.set(n.type, (countMap.get(n.type) ?? 0) + 1));
    countMap.forEach((count, type) => counts.push({ type, count }));
    return counts.sort((a, b) => b.count - a.count);
  }, [visibleNodes]);

  const hiddenCount = graph.nodes.length - visibleNodes.length;

  const tierNodeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tier of REASONING_TIERS) {
      const tierTypes = new Set(tier.types);
      counts[tier.id] = graph.nodes.filter(n => tierTypes.has(n.type)).length;
    }
    return counts;
  }, [graph.nodes]);

  if (graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full rounded-2xl bg-muted border border-border">
        <p className="text-sm text-muted-foreground">Run the analysis to populate the Reasoning Map.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      {/* Tier control bar */}
      <div className="flex items-center gap-2 flex-wrap px-1">
        <div className="flex items-center gap-0.5 rounded-lg p-0.5 bg-muted border border-border">
          {REASONING_TIERS.map(tier => {
            const isActive = activeTiers.has(tier.id);
            const count = tierNodeCounts[tier.id] ?? 0;
            return (
              <button
                key={tier.id}
                onClick={() => toggleTier(tier.id)}
                className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all relative"
                style={{
                  background: isActive ? "hsl(var(--card))" : "transparent",
                  color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: isActive ? "0 1px 3px hsl(0 0% 0% / 0.1)" : "none",
                }}
              >
                {tier.label}
                {!isActive && count > 0 && (
                  <span className="ml-1 text-[9px] font-bold opacity-50">·{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {activeTiers.has("discovery") && (
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

        {(activeTiers.size > 1 || !activeTiers.has("opportunity") || selectedNodeId) && (
          <button
            onClick={handleResetView}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset view
          </button>
        )}

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
            ★ Breakthrough path
          </div>
        )}
        {/* Edge style legend */}
        <div className="flex items-center gap-2 ml-1 pl-1 border-l border-border">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-4 h-0 border-t border-muted-foreground" /> discovered
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-4 h-0 border-t border-dashed border-muted-foreground" /> inherited
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-4 h-0 border-t border-dotted border-muted-foreground" /> design
          </span>
        </div>
      </div>

      {/* Cytoscape canvas with column header overlay */}
      <div className="flex-1 min-h-0 relative">
        {/* Column headers — positioned absolutely over the canvas */}
        {columnPositions.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-10 flex pointer-events-none" style={{ height: 32 }}>
            {columnPositions.map(col => (
              <div
                key={col.tierId}
                className="absolute top-0 flex items-center justify-center"
                style={{
                  left: col.left,
                  width: col.width,
                  height: 32,
                }}
              >
                {/* Column background stripe (full height of canvas) */}
                <div
                  className="absolute inset-0 rounded-t-lg"
                  style={{
                    background: col.accentBg,
                    borderBottom: `2px solid ${col.accent}`,
                    opacity: 0.7,
                  }}
                />
                {/* Label */}
                <span
                  className="relative z-10 text-[11px] font-bold tracking-wide uppercase"
                  style={{ color: col.accent }}
                >
                  {col.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Canvas */}
        <div
          ref={containerRef}
          className="w-full h-full rounded-xl overflow-hidden"
          style={{
            background: "hsl(var(--card))",
            border: "1.5px solid hsl(var(--border))",
            minHeight: 400,
            paddingTop: columnPositions.length > 0 ? 32 : 0,
          }}
        />
      </div>

      {/* Expand prompt */}
      <AnimatePresence>
        {hiddenCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="self-center flex items-center gap-2"
          >
            {REASONING_TIERS.filter(t => !activeTiers.has(t.id) && (tierNodeCounts[t.id] ?? 0) > 0).map(tier => (
              <button
                key={tier.id}
                onClick={() => toggleTier(tier.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "hsl(var(--primary) / 0.1)",
                  border: "1px solid hsl(var(--primary) / 0.3)",
                  color: "hsl(var(--primary))",
                }}
              >
                Show {tier.label} ({tierNodeCounts[tier.id]})
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
