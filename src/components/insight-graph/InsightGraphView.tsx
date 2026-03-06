/**
 * Insight Graph View — Interactive Reasoning Explorer
 *
 * Tiered horizontal layout: Signals → Assumptions → Constraints → Leverage → Opportunities
 * Features: path highlighting, leverage glow, hover tooltips, expanded detail panel.
 */

import { memo, useMemo, useState, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import type { InsightGraph, InsightGraphNode, InsightNodeType, EdgeRelation } from "@/lib/insightGraph";
import { NODE_TYPE_CONFIG, getInsightChain } from "@/lib/insightGraph";
import { InsightNodeCard } from "./InsightNodeCard";
import { OpportunityLandscape } from "./OpportunityLandscape";
import { ConstraintMap } from "./ConstraintMap";
import { StrategicPathways } from "./StrategicPathways";

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PIPELINE_STEPS = ["report", "disrupt", "redesign", "stress_test", "pitch"] as const;
const ALL_NODE_TYPES: InsightNodeType[] = [
  "signal", "constraint", "assumption", "driver", "outcome",
  "leverage_point", "flipped_idea", "concept", "risk", "evidence",
];

/** Tiered layout columns: left-to-right reasoning flow */
const TIER_CONFIG: { types: InsightNodeType[]; label: string; colIndex: number }[] = [
  { types: ["signal"],                          label: "Signals",       colIndex: 0 },
  { types: ["assumption"],                      label: "Assumptions",   colIndex: 1 },
  { types: ["constraint"],                      label: "Constraints",   colIndex: 2 },
  { types: ["driver", "leverage_point"],        label: "Leverage",      colIndex: 3 },
  { types: ["outcome", "flipped_idea", "concept"], label: "Opportunities", colIndex: 4 },
  { types: ["risk", "evidence"],                label: "Validation",    colIndex: 5 },
];

const RELATION_COLORS: Record<EdgeRelation, string> = {
  causes: "hsl(0 72% 52%)",
  leads_to: "hsl(229 89% 63%)",
  contradicts: "hsl(14 90% 55%)",
  supports: "hsl(152 60% 44%)",
  unlocks: "hsl(262 83% 58%)",
  depends_on: "hsl(210 14% 53%)",
  invalidates: "hsl(0 72% 52%)",
};

const RELATION_LABELS: Record<EdgeRelation, string> = {
  causes: "causes",
  leads_to: "leads to",
  contradicts: "contradicts",
  supports: "supports",
  unlocks: "unlocks",
  depends_on: "depends on",
  invalidates: "invalidates",
};

// ═══════════════════════════════════════════════════════════════
//  CUSTOM NODE — with glow + hover + path highlighting state
// ═══════════════════════════════════════════════════════════════

function InsightNode({ data }: NodeProps) {
  const config = NODE_TYPE_CONFIG[data.nodeType as InsightNodeType];
  const influence = data.influence as number;
  const isTopLeverage = data.isTopLeverage as boolean;
  const isHighlighted = data.isHighlighted as boolean;
  const isDimmed = data.isDimmed as boolean;
  const isHighInfluence = influence >= 60;

  return (
    <div
      className="rounded-xl px-3.5 py-2.5 cursor-pointer transition-all duration-300"
      style={{
        background: config.bgColor,
        border: `2px solid ${isTopLeverage ? config.color : config.borderColor}`,
        boxShadow: isTopLeverage
          ? `0 0 24px ${config.color}40, 0 0 48px ${config.color}15`
          : isHighInfluence
            ? `0 0 16px ${config.color}20`
            : "0 2px 8px hsl(0 0% 0% / 0.06)",
        minWidth: 160,
        maxWidth: 220,
        opacity: isDimmed ? 0.2 : 1,
        transform: isHighlighted ? "scale(1.06)" : "scale(1)",
        transition: "opacity 0.4s, transform 0.3s, box-shadow 0.3s",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 1, height: 1 }} />

      {/* Pulsing ring for top leverage */}
      {isTopLeverage && (
        <div
          className="absolute -inset-1.5 rounded-xl animate-pulse pointer-events-none"
          style={{
            border: `2px solid ${config.color}`,
            opacity: 0.4,
          }}
        />
      )}

      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            background: config.color,
            boxShadow: isTopLeverage ? `0 0 10px ${config.color}80` : "none",
          }}
        />
        <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: config.color }}>
          {config.label}
        </span>
        {isTopLeverage && (
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full ml-auto"
            style={{ background: `${config.color}20`, color: config.color }}
          >
            ★ TOP
          </span>
        )}
      </div>
      <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">{data.label}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs font-bold tabular-nums" style={{ color: config.color }}>
          {data.impact}/10
        </span>
        <span className="text-xs text-muted-foreground capitalize">{data.confidence}</span>
        <span className="text-xs font-bold tabular-nums text-muted-foreground ml-auto">
          Inf. {influence}
        </span>
      </div>
    </div>
  );
}

const nodeTypes = { insightNode: InsightNode };

// ═══════════════════════════════════════════════════════════════
//  HOVER TOOLTIP
// ═══════════════════════════════════════════════════════════════

function GraphTooltip({ node, graph, position }: { 
  node: InsightGraphNode; graph: InsightGraph; position: { x: number; y: number } 
}) {
  const config = NODE_TYPE_CONFIG[node.type];
  const downstream = graph.edges.filter(e => e.source === node.id);
  const upstream = graph.edges.filter(e => e.target === node.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="fixed z-50 pointer-events-none rounded-xl px-4 py-3 shadow-2xl max-w-xs"
      style={{
        left: position.x + 16,
        top: position.y - 8,
        background: "hsl(var(--card))",
        border: `2px solid ${config.borderColor}`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="w-3 h-3 rounded-full" style={{ background: config.color }} />
        <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>
      <p className="text-sm font-bold text-foreground leading-snug mb-2">{node.label}</p>

      {node.reasoning && (
        <p className="text-xs text-muted-foreground mb-2 line-clamp-3 italic">"{node.reasoning}"</p>
      )}

      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="text-center">
          <p className="text-xs font-bold text-muted-foreground">Impact</p>
          <p className="text-sm font-extrabold" style={{ color: config.color }}>{node.impact}/10</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-muted-foreground">Influence</p>
          <p className="text-sm font-extrabold" style={{ color: config.color }}>{node.influence}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-muted-foreground">Confidence</p>
          <p className="text-sm font-extrabold capitalize" style={{ color: config.color }}>{node.confidence}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {upstream.length > 0 && <span>↑ {upstream.length} upstream</span>}
        {downstream.length > 0 && <span>↓ {downstream.length} downstream</span>}
      </div>

      <p className="text-xs text-muted-foreground mt-1.5 font-semibold">Click to explore reasoning chain</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TIERED LAYOUT — horizontal left-to-right flow
// ═══════════════════════════════════════════════════════════════

function layoutTiered(graphNodes: InsightGraphNode[]): Node[] {
  const colWidth = 300;
  const rowHeight = 110;
  const flowNodes: Node[] = [];

  // Assign each node to a tier column
  const tierMap = new Map<string, number>();
  TIER_CONFIG.forEach(tier => {
    tier.types.forEach(t => tierMap.set(t, tier.colIndex));
  });

  // Group nodes by column
  const columns = new Map<number, InsightGraphNode[]>();
  graphNodes.forEach(n => {
    const col = tierMap.get(n.type) ?? 2;
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col)!.push(n);
  });

  // Sort each column by influence desc, layout vertically
  columns.forEach((group, col) => {
    group.sort((a, b) => b.influence - a.influence);
    group.forEach((gn, row) => {
      // Slight jitter for visual interest
      const jitterX = Math.sin(row * 2.3 + col * 1.7) * 20;
      const jitterY = Math.cos(row * 1.8 + col * 2.1) * 15;
      flowNodes.push({
        id: gn.id,
        type: "insightNode",
        position: {
          x: col * colWidth + jitterX + 60,
          y: row * rowHeight + jitterY + 80,
        },
        data: {
          label: gn.label,
          nodeType: gn.type,
          impact: gn.impact,
          confidence: gn.confidence,
          influence: gn.influence,
          isTopLeverage: false,
          isHighlighted: false,
          isDimmed: false,
        },
      });
    });
  });

  return flowNodes;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface InsightGraphViewProps {
  graph: InsightGraph;
}

export const InsightGraphView = memo(function InsightGraphView({ graph }: InsightGraphViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"graph" | "landscape" | "constraints" | "pathways">("graph");
  const [filterTypes, setFilterTypes] = useState<Set<InsightNodeType>>(new Set(ALL_NODE_TYPES));
  const [filterStep, setFilterStep] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Identify top leverage constraint
  const topLeverageId = useMemo(() => {
    return graph.topNodes.primaryConstraint?.id ?? null;
  }, [graph.topNodes]);

  // Compute highlighted chain when a node is selected
  const highlightedIds = useMemo(() => {
    if (!selectedNodeId) return null;
    const chain = getInsightChain(graph, selectedNodeId);
    return new Set(chain.map(n => n.id));
  }, [selectedNodeId, graph]);

  // Highlighted edge ids
  const highlightedEdgeIds = useMemo(() => {
    if (!highlightedIds) return null;
    const ids = new Set<string>();
    graph.edges.forEach(e => {
      if (highlightedIds.has(e.source) && highlightedIds.has(e.target)) {
        ids.add(e.id);
      }
    });
    return ids;
  }, [highlightedIds, graph.edges]);

  const filteredNodes = useMemo(() => {
    return graph.nodes.filter(n => {
      if (!filterTypes.has(n.type)) return false;
      if (filterStep && n.pipelineStep !== filterStep) return false;
      return true;
    });
  }, [graph.nodes, filterTypes, filterStep]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return graph.edges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));
  }, [graph.edges, filteredNodeIds]);

  // Build flow nodes with highlight/dim states
  const flowNodes = useMemo(() => {
    const base = layoutTiered(filteredNodes);
    return base.map(n => ({
      ...n,
      data: {
        ...n.data,
        isTopLeverage: n.id === topLeverageId,
        isHighlighted: highlightedIds ? highlightedIds.has(n.id) : false,
        isDimmed: highlightedIds ? !highlightedIds.has(n.id) : false,
      },
    }));
  }, [filteredNodes, topLeverageId, highlightedIds]);

  // Build edges with highlight states
  const flowEdges: Edge[] = useMemo(() => {
    return filteredEdges.map(e => {
      const isHighlighted = highlightedEdgeIds?.has(e.id) ?? false;
      const isDimmed = highlightedEdgeIds ? !isHighlighted : false;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isHighlighted || e.relation === "unlocks" || e.relation === "leads_to",
        label: isHighlighted ? RELATION_LABELS[e.relation] : undefined,
        labelStyle: { fontSize: 10, fontWeight: 700, fill: "hsl(var(--foreground))" },
        style: {
          stroke: isHighlighted
            ? RELATION_COLORS[e.relation]
            : isDimmed
              ? "hsl(var(--border))"
              : RELATION_COLORS[e.relation],
          strokeWidth: isHighlighted ? 3 : Math.max(1, e.weight * 2),
          opacity: isDimmed ? 0.1 : isHighlighted ? 0.9 : 0.4,
          transition: "opacity 0.4s, stroke-width 0.3s",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isDimmed ? "hsl(var(--border))" : RELATION_COLORS[e.relation],
          width: isHighlighted ? 14 : 10,
          height: isHighlighted ? 14 : 10,
        },
      };
    });
  }, [filteredEdges, highlightedEdgeIds]);

  const selectedNode = useMemo(() => {
    return selectedNodeId ? graph.nodes.find(n => n.id === selectedNodeId) ?? null : null;
  }, [selectedNodeId, graph.nodes]);

  const hoveredNode = useMemo(() => {
    return hoveredNodeId ? graph.nodes.find(n => n.id === hoveredNodeId) ?? null : null;
  }, [hoveredNodeId, graph.nodes]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(prev => prev === node.id ? null : node.id);
  }, []);

  const onNodeMouseEnter = useCallback((_: any, node: Node) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const toggleType = (type: InsightNodeType) => {
    setFilterTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Track mouse for tooltip positioning
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setHoverPos({ x: e.clientX, y: e.clientY });
  }, []);

  if (graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl bg-muted border border-border">
        <p className="text-sm text-muted-foreground">
          Run the analysis pipeline to populate the Insight Graph.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" ref={containerRef} onMouseMove={handleMouseMove}>
      {/* Tab switcher */}
      <div className="flex items-center gap-1 flex-wrap">
        {([
          { id: "graph", label: "Reasoning Explorer" },
          { id: "landscape", label: "Opportunity Landscape" },
          { id: "constraints", label: "Constraint Map" },
          { id: "pathways", label: "Strategic Pathways" },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedNodeId(null); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              background: activeTab === tab.id ? "hsl(var(--primary) / 0.1)" : "transparent",
              border: `1.5px solid ${activeTab === tab.id ? "hsl(var(--primary) / 0.3)" : "transparent"}`,
              color: activeTab === tab.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "landscape" ? (
        <OpportunityLandscape graph={graph} onSelectNode={setSelectedNodeId} />
      ) : activeTab === "constraints" ? (
        <ConstraintMap graph={graph} onSelectNode={setSelectedNodeId} />
      ) : activeTab === "pathways" ? (
        <StrategicPathways graph={graph} onSelectNode={setSelectedNodeId} />
      ) : (
      <>
      {/* Tier legend */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TIER_CONFIG.map((tier) => {
          const count = filteredNodes.filter(n => tier.types.includes(n.type)).length;
          if (count === 0) return null;
          const cfg = NODE_TYPE_CONFIG[tier.types[0]];
          return (
            <div
              key={tier.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: cfg.bgColor,
                border: `1px solid ${cfg.borderColor}`,
                color: cfg.color,
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
              {tier.label}
              <span className="text-muted-foreground ml-0.5">({count})</span>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {ALL_NODE_TYPES.map(type => {
          const config = NODE_TYPE_CONFIG[type];
          const active = filterTypes.has(type);
          const count = graph.nodes.filter(n => n.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                background: active ? config.bgColor : "hsl(var(--muted))",
                border: `1px solid ${active ? config.borderColor : "hsl(var(--border))"}`,
                color: active ? config.color : "hsl(var(--muted-foreground))",
                opacity: active ? 1 : 0.5,
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: active ? config.color : "hsl(var(--muted-foreground))" }} />
              {config.label} ({count})
            </button>
          );
        })}

        <div className="h-5 w-px mx-1" style={{ background: "hsl(var(--border))" }} />
        {PIPELINE_STEPS.map(step => {
          const active = filterStep === step;
          const count = graph.nodes.filter(n => n.pipelineStep === step).length;
          if (count === 0) return null;
          return (
            <button
              key={step}
              onClick={() => setFilterStep(active ? null : step)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                background: active ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted))",
                border: `1px solid ${active ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}`,
                color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
              }}
            >
              {step.replace("_", " ")} ({count})
            </button>
          );
        })}

        {/* Clear selection button */}
        {selectedNodeId && (
          <button
            onClick={() => setSelectedNodeId(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-muted border border-border text-foreground hover:bg-card"
          >
            ✕ Clear Path
          </button>
        )}
      </div>

      {/* Active path indicator */}
      <AnimatePresence>
        {selectedNode && highlightedIds && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: `${NODE_TYPE_CONFIG[selectedNode.type].bgColor}`,
              border: `1.5px solid ${NODE_TYPE_CONFIG[selectedNode.type].borderColor}`,
            }}
          >
            <div className="w-3 h-3 rounded-full" style={{ background: NODE_TYPE_CONFIG[selectedNode.type].color }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: NODE_TYPE_CONFIG[selectedNode.type].color }}>
                Reasoning Chain Active
              </p>
              <p className="text-sm font-bold text-foreground truncate">
                Tracing {highlightedIds.size} connected nodes from "{selectedNode.label.slice(0, 50)}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graph Canvas */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          height: 560,
          background: "hsl(var(--card))",
          border: "1.5px solid hsl(var(--border))",
        }}
      >
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} color="hsl(var(--border))" />
          <Controls showInteractive={false} style={{ bottom: 12, left: 12 }} />
          <MiniMap
            nodeStrokeWidth={2}
            style={{
              background: "hsl(var(--muted))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
            }}
          />
        </ReactFlow>

        {/* Node detail card overlay */}
        <AnimatePresence>
          {selectedNode && (
            <InsightNodeCard
              node={selectedNode}
              graph={graph}
              onClose={() => setSelectedNodeId(null)}
              onSelectNode={setSelectedNodeId}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-4 px-2">
        <span className="text-xs font-bold text-muted-foreground">
          {filteredNodes.length} nodes · {filteredEdges.length} connections
        </span>
        {graph.topNodes.primaryConstraint && (
          <span className="text-xs font-bold flex items-center gap-1" style={{ color: NODE_TYPE_CONFIG.constraint.color }}>
            ★ Top Constraint: {graph.topNodes.primaryConstraint.label.slice(0, 40)}
          </span>
        )}
        {graph.topNodes.breakthroughOpportunity && (
          <span className="text-xs font-bold" style={{ color: NODE_TYPE_CONFIG.outcome.color }}>
            Top Opportunity: {graph.topNodes.breakthroughOpportunity.label.slice(0, 40)}
          </span>
        )}
      </div>
      </>
      )}

      {/* Hover Tooltip (shared across tabs) */}
      <AnimatePresence>
        {hoveredNode && activeTab === "graph" && !selectedNodeId && (
          <GraphTooltip node={hoveredNode} graph={graph} position={hoverPos} />
        )}
      </AnimatePresence>
    </div>
  );
});
