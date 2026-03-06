/**
 * Constraint Map — Causal Flow Diagram
 *
 * Visual flow showing: Signals → Constraints → Leverage Points → Opportunities
 * Uses ReactFlow for interactive causal chain visualization.
 */

import { memo, useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  Handle,
  Position,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import type { InsightGraph, InsightGraphNode, InsightNodeType } from "@/lib/insightGraph";
import { NODE_TYPE_CONFIG } from "@/lib/insightGraph";

/* ── Causal flow columns ── */
const FLOW_COLUMNS: { types: InsightNodeType[]; label: string; x: number }[] = [
  { types: ["signal"], label: "SIGNALS", x: 0 },
  { types: ["assumption"], label: "ASSUMPTIONS", x: 300 },
  { types: ["constraint"], label: "CONSTRAINTS", x: 600 },
  { types: ["leverage_point", "driver"], label: "LEVERAGE", x: 900 },
  { types: ["outcome", "flipped_idea", "concept"], label: "OPPORTUNITIES", x: 1200 },
];

/* ── Custom node ── */
function ConstraintFlowNode({ data }: NodeProps) {
  const cfg = NODE_TYPE_CONFIG[data.nodeType as InsightNodeType];
  const influence = data.influence as number;
  const isHigh = influence >= 60;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: data.colIndex * 0.1 }}
      className="rounded-xl px-3.5 py-2.5 cursor-pointer"
      style={{
        background: cfg.bgColor,
        border: `2px solid ${cfg.borderColor}`,
        boxShadow: isHigh
          ? `0 0 24px ${cfg.color}25, 0 4px 16px hsl(0 0% 0% / 0.08)`
          : "0 2px 8px hsl(0 0% 0% / 0.05)",
        minWidth: 160,
        maxWidth: 200,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 1, height: 1 }} />

      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            background: cfg.color,
            boxShadow: isHigh ? `0 0 8px ${cfg.color}60` : "none",
          }}
        />
        <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
      <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">{data.label}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs font-bold tabular-nums" style={{ color: cfg.color }}>
          Impact {data.impact}/10
        </span>
        {isHigh && (
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${cfg.color}15`, color: cfg.color }}
          >
            ★ {influence}
          </span>
        )}
      </div>
    </motion.div>
  );
}

const nodeTypes = { constraintFlowNode: ConstraintFlowNode };

/* ── Layout ── */
function layoutConstraintMap(graph: InsightGraph): { nodes: Node[]; edges: Edge[] } {
  const flowNodes: Node[] = [];
  const usedIds = new Set<string>();

  FLOW_COLUMNS.forEach((col, colIdx) => {
    const colNodes = graph.nodes
      .filter(n => col.types.includes(n.type))
      .sort((a, b) => b.influence - a.influence)
      .slice(0, 6);

    colNodes.forEach((gn, row) => {
      usedIds.add(gn.id);
      flowNodes.push({
        id: gn.id,
        type: "constraintFlowNode",
        position: { x: col.x, y: row * 100 + 60 },
        data: {
          label: gn.label,
          nodeType: gn.type,
          impact: gn.impact,
          confidence: gn.confidence,
          influence: gn.influence,
          colIndex: colIdx,
        },
      });
    });
  });

  const flowEdges: Edge[] = graph.edges
    .filter(e => usedIds.has(e.source) && usedIds.has(e.target))
    .map(e => {
      const isUnlock = e.relation === "unlocks" || e.relation === "leads_to";
      const isContradict = e.relation === "contradicts" || e.relation === "invalidates";
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isUnlock,
        style: {
          stroke: isContradict ? "hsl(0 72% 52%)" : isUnlock ? "hsl(152 60% 44%)" : "hsl(var(--border))",
          strokeWidth: Math.max(1.5, e.weight * 3),
          opacity: 0.5,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isContradict ? "hsl(0 72% 52%)" : isUnlock ? "hsl(152 60% 44%)" : "hsl(var(--muted-foreground))",
          width: 10,
          height: 10,
        },
      };
    });

  return { nodes: flowNodes, edges: flowEdges };
}

/* ── Main ── */
interface ConstraintMapProps {
  graph: InsightGraph;
  onSelectNode?: (nodeId: string) => void;
  compact?: boolean;
}

export const ConstraintMap = memo(function ConstraintMap({
  graph, onSelectNode, compact = false,
}: ConstraintMapProps) {
  const { nodes, edges } = useMemo(() => layoutConstraintMap(graph), [graph]);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const onNodeClick = useCallback((_: any, node: Node) => {
    onSelectNode?.(node.id);
  }, [onSelectNode]);

  if (graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl py-10 bg-muted border border-border">
        <p className="text-sm text-foreground">Run the analysis to populate the Constraint Map.</p>
      </div>
    );
  }

  const height = compact ? 340 : 480;

  return (
    <div className="space-y-3">
      {/* Column headers */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {FLOW_COLUMNS.map((col, i) => {
          const count = graph.nodes.filter(n => col.types.includes(n.type)).length;
          if (count === 0) return null;
          const firstType = col.types[0];
          const cfg = NODE_TYPE_CONFIG[firstType];
          return (
            <div
              key={col.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: cfg.bgColor,
                border: `1px solid ${cfg.borderColor}`,
                color: cfg.color,
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
              {col.label}
              <span className="text-muted-foreground ml-0.5">({count})</span>
            </div>
          );
        })}
      </div>

      {/* Flow canvas */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          height,
          background: "hsl(var(--card))",
          border: "1.5px solid hsl(var(--border))",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} color="hsl(var(--border))" />
          <Controls showInteractive={false} style={{ bottom: 8, left: 8 }} />
        </ReactFlow>
      </div>
    </div>
  );
});
