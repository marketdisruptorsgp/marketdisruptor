/**
 * Insight Graph View
 *
 * Force-directed network visualization of the entire analysis insight graph.
 * Uses ReactFlow for zoom, pan, and interactive node exploration.
 */

import { memo, useMemo, useState, useCallback } from "react";
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
import type { InsightGraph, InsightGraphNode, InsightNodeType, EdgeRelation } from "@/lib/insightGraph";
import { NODE_TYPE_CONFIG } from "@/lib/insightGraph";
import { InsightNodeCard } from "./InsightNodeCard";

// ═══════════════════════════════════════════════════════════════
//  FILTER
// ═══════════════════════════════════════════════════════════════

const PIPELINE_STEPS = ["report", "disrupt", "redesign", "stress_test", "pitch"] as const;
const ALL_NODE_TYPES: InsightNodeType[] = [
  "signal", "constraint", "assumption", "driver", "outcome",
  "leverage_point", "flipped_idea", "concept", "risk", "evidence",
];

// ═══════════════════════════════════════════════════════════════
//  EDGE RELATION COLORS
// ═══════════════════════════════════════════════════════════════

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
//  CUSTOM NODE COMPONENT
// ═══════════════════════════════════════════════════════════════

function InsightNode({ data }: NodeProps) {
  const config = NODE_TYPE_CONFIG[data.nodeType as InsightNodeType];
  const influence = data.influence as number;
  const isHighInfluence = influence >= 60;

  return (
    <div
      className="rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 hover:scale-105"
      style={{
        background: config.bgColor,
        border: `1.5px solid ${config.borderColor}`,
        boxShadow: isHighInfluence
          ? `0 0 20px ${config.color}30, 0 4px 12px hsl(0 0% 0% / 0.1)`
          : "0 2px 8px hsl(0 0% 0% / 0.06)",
        minWidth: isHighInfluence ? 180 : 140,
        maxWidth: 220,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 1, height: 1 }} />

      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: config.color }} />
        <span className="text-[8px] font-extrabold uppercase tracking-widest" style={{ color: config.color }}>
          {config.label}
        </span>
        {isHighInfluence && (
          <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
            style={{ background: `${config.color}20`, color: config.color }}>
            ★ {influence}
          </span>
        )}
      </div>
      <p className="text-[11px] font-bold text-foreground leading-snug line-clamp-2">{data.label}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[9px] font-bold tabular-nums" style={{ color: config.color }}>
          {data.impact}/10
        </span>
        <span className="text-[9px] text-muted-foreground capitalize">{data.confidence}</span>
      </div>
    </div>
  );
}

const nodeTypes = { insightNode: InsightNode };

// ═══════════════════════════════════════════════════════════════
//  LAYOUT — simple force-like layout
// ═══════════════════════════════════════════════════════════════

function layoutNodes(graphNodes: InsightGraphNode[]): Node[] {
  // Group by pipeline step, then position in columns
  const stepOrder: Record<string, number> = {
    report: 0, disrupt: 1, redesign: 2, stress_test: 3, pitch: 4,
  };

  const groups = new Map<string, InsightGraphNode[]>();
  graphNodes.forEach(n => {
    const step = n.pipelineStep;
    if (!groups.has(step)) groups.set(step, []);
    groups.get(step)!.push(n);
  });

  const flowNodes: Node[] = [];
  const colWidth = 320;
  const rowHeight = 120;

  groups.forEach((group, step) => {
    const col = stepOrder[step] ?? 0;
    // Sort by influence desc within group
    group.sort((a, b) => b.influence - a.influence);
    group.forEach((gn, row) => {
      // Add some jitter for visual interest
      const jitterX = (Math.sin(row * 2.3 + col * 1.7) * 40);
      const jitterY = (Math.cos(row * 1.8 + col * 2.1) * 30);

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
  const [filterTypes, setFilterTypes] = useState<Set<InsightNodeType>>(new Set(ALL_NODE_TYPES));
  const [filterStep, setFilterStep] = useState<string | null>(null);

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

  const flowNodes = useMemo(() => layoutNodes(filteredNodes), [filteredNodes]);

  const flowEdges: Edge[] = useMemo(() => {
    return filteredEdges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.relation === "unlocks" || e.relation === "leads_to",
      label: RELATION_LABELS[e.relation],
      labelStyle: { fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" },
      style: {
        stroke: RELATION_COLORS[e.relation],
        strokeWidth: Math.max(1, e.weight * 2.5),
        opacity: 0.6,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: RELATION_COLORS[e.relation],
        width: 12,
        height: 12,
      },
    }));
  }, [filteredEdges]);

  const selectedNode = useMemo(() => {
    return selectedNodeId ? graph.nodes.find(n => n.id === selectedNodeId) ?? null : null;
  }, [selectedNodeId, graph.nodes]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const toggleType = (type: InsightNodeType) => {
    setFilterTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  if (graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl"
        style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
        <p className="text-sm text-muted-foreground">
          Run the analysis pipeline to populate the Insight Graph.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Node type filters */}
        {ALL_NODE_TYPES.map(type => {
          const config = NODE_TYPE_CONFIG[type];
          const active = filterTypes.has(type);
          const count = graph.nodes.filter(n => n.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
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

        {/* Pipeline step filter */}
        <div className="h-5 w-px mx-1" style={{ background: "hsl(var(--border))" }} />
        {PIPELINE_STEPS.map(step => {
          const active = filterStep === step;
          const count = graph.nodes.filter(n => n.pipelineStep === step).length;
          if (count === 0) return null;
          return (
            <button
              key={step}
              onClick={() => setFilterStep(active ? null : step)}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
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
      </div>

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
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} color="hsl(var(--border))" />
          <Controls
            showInteractive={false}
            style={{ bottom: 12, left: 12 }}
          />
          <MiniMap
            nodeStrokeWidth={2}
            style={{
              background: "hsl(var(--muted))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
            }}
          />
        </ReactFlow>

        {/* Node Detail Card */}
        {selectedNode && (
          <InsightNodeCard
            node={selectedNode}
            graph={graph}
            onClose={() => setSelectedNodeId(null)}
            onSelectNode={setSelectedNodeId}
          />
        )}
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 px-2">
        <span className="text-[10px] font-bold text-muted-foreground">
          {filteredNodes.length} nodes · {filteredEdges.length} connections
        </span>
        {graph.topNodes.primaryConstraint && (
          <span className="text-[10px] font-bold" style={{ color: NODE_TYPE_CONFIG.constraint.color }}>
            Top Constraint: {graph.topNodes.primaryConstraint.label.slice(0, 40)}
          </span>
        )}
        {graph.topNodes.breakthroughOpportunity && (
          <span className="text-[10px] font-bold" style={{ color: NODE_TYPE_CONFIG.outcome.color }}>
            Top Opportunity: {graph.topNodes.breakthroughOpportunity.label.slice(0, 40)}
          </span>
        )}
      </div>
    </div>
  );
});
