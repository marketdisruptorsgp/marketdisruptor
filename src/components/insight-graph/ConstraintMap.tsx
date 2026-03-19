/**
 * Constraint Map — Causal Flow Diagram
 *
 * Visual flow showing: Signals → Constraints → Leverage Points → Opportunities
 * Uses ReactFlow for interactive causal chain visualization.
 *
 * Includes a What-If drill-down panel: click any constraint node to see
 * the simulated downstream cascade impact of removing that constraint.
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
import { X, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import type { InsightGraph, InsightGraphNode, InsightNodeType } from "@/lib/insightGraph";
import { NODE_TYPE_CONFIG } from "@/lib/insightGraph";
import { simulateConstraintRemoval, classifyOpportunity } from "@/lib/graphQuery";

/** Returns `singular` when count === 1, otherwise `plural` (defaults to `singular + "s"`). */
function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

/* ── Causal flow columns ── */
const FLOW_COLUMNS: { types: InsightNodeType[]; label: string; x: number }[] = [
  { types: ["signal"], label: "SIGNALS", x: 0 },
  { types: ["assumption"], label: "ASSUMPTIONS", x: 320 },
  { types: ["constraint"], label: "CONSTRAINTS", x: 640 },
  { types: ["leverage_point", "driver"], label: "LEVERAGE", x: 960 },
  { types: ["outcome", "flipped_idea", "concept"], label: "OPPORTUNITIES", x: 1280 },
];

/* ── Custom node ── */
function ConstraintFlowNode({ data }: NodeProps) {
  const cfg = NODE_TYPE_CONFIG[data.nodeType as InsightNodeType];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: data.colIndex * 0.1 }}
      className="rounded-xl px-3.5 py-2.5 cursor-pointer"
      style={{
        background: data.isHighlighted ? `${cfg.bgColor}` : cfg.bgColor,
        border: `2px solid ${data.isHighlighted ? cfg.color : cfg.borderColor}`,
        boxShadow: data.isHighlighted
          ? `0 0 0 3px ${cfg.color}22, 0 2px 8px hsl(0 0% 0% / 0.05)`
          : "0 2px 8px hsl(0 0% 0% / 0.05)",
        width: 200,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 1, height: 1 }} />

      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
        <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
        {data.isHighlighted && (
          <span className="text-[9px] font-bold ml-auto" style={{ color: cfg.color }}>AFFECTED</span>
        )}
      </div>
      <p className="text-xs font-bold text-foreground leading-snug line-clamp-3">{data.label}</p>
    </motion.div>
  );
}

const nodeTypes = { constraintFlowNode: ConstraintFlowNode };

/* ── Layout ── */
function layoutConstraintMap(
  graph: InsightGraph,
  highlightedIds?: Set<string>,
): { nodes: Node[]; edges: Edge[] } {
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
        position: { x: col.x, y: row * 120 + 60 },
        data: {
          label: gn.label,
          nodeType: gn.type,
          impact: gn.impact,
          confidence: gn.confidence,
          influence: gn.influence,
          colIndex: colIdx,
          isHighlighted: highlightedIds ? highlightedIds.has(gn.id) : false,
        },
      });
    });
  });

  const flowEdges: Edge[] = graph.edges
    .filter(e => usedIds.has(e.source) && usedIds.has(e.target))
    .map(e => {
      const isUnlock = e.relation === "unlocks" || e.relation === "leads_to";
      const isContradict = e.relation === "contradicts" || e.relation === "invalidates";
      const isAffected = highlightedIds
        ? highlightedIds.has(e.source) || highlightedIds.has(e.target)
        : false;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isUnlock || isAffected,
        style: {
          stroke: isContradict ? "hsl(0 72% 52%)" : isUnlock ? "hsl(152 60% 44%)" : "hsl(var(--border))",
          strokeWidth: isAffected ? Math.max(2, e.weight * 4) : Math.max(1.5, e.weight * 3),
          opacity: isAffected ? 0.8 : 0.5,
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

/* ── What-If Drill-Down Panel ── */
interface WhatIfPanelProps {
  constraintNode: InsightGraphNode;
  graph: InsightGraph;
  onClose: () => void;
  onSelectNode: (id: string) => void;
}

function WhatIfPanel({ constraintNode, graph, onClose, onSelectNode }: WhatIfPanelProps) {
  const { affectedIds, opportunitiesUnlocked } = useMemo(
    () => simulateConstraintRemoval(graph, constraintNode.id),
    [graph, constraintNode.id],
  );

  const cfg = NODE_TYPE_CONFIG[constraintNode.type] || NODE_TYPE_CONFIG.constraint;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="rounded-xl p-4 space-y-3"
      style={{
        background: "hsl(var(--card))",
        border: `1.5px solid ${cfg.borderColor}`,
        boxShadow: "0 4px 20px hsl(var(--foreground) / 0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bgColor }}>
            <Zap size={12} style={{ color: cfg.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>
              What-If: Remove This Constraint
            </p>
            <p className="text-xs font-bold text-foreground truncate">{constraintNode.label}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      {/* Cascade summary */}
      <div
        className="rounded-lg px-3 py-2 flex items-center gap-2"
        style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
      >
        <TrendingUp size={12} className="text-primary flex-shrink-0" />
        <p className="text-xs text-foreground">
          Removing this constraint would cascade through{" "}
          <span className="font-bold">{affectedIds.size}</span> downstream {pluralize(affectedIds.size, "node")}
          {opportunitiesUnlocked.length > 0 && (
            <>, unlocking <span className="font-bold text-primary">{opportunitiesUnlocked.length}</span> strategic {pluralize(opportunitiesUnlocked.length, "move")}</>
          )}.
        </p>
      </div>

      {/* Opportunities unlocked */}
      {opportunitiesUnlocked.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            Opportunities Unlocked
          </p>
          {opportunitiesUnlocked.slice(0, 4).map(opp => {
            const risk = classifyOpportunity(opp);
            const oppCfg = NODE_TYPE_CONFIG[opp.type] || NODE_TYPE_CONFIG.outcome;
            return (
              <button
                key={opp.id}
                onClick={() => onSelectNode(opp.id)}
                className="w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 transition-colors hover:bg-muted"
                style={{ border: "1px solid hsl(var(--border))" }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: oppCfg.color }} />
                <span className="text-xs font-semibold text-foreground flex-1 line-clamp-2">{opp.label}</span>
                <span
                  className="text-[9px] font-extrabold uppercase flex-shrink-0 px-1.5 py-0.5 rounded"
                  style={{
                    color: risk === "moonshot" ? "hsl(280 80% 60%)" : "hsl(142 70% 40%)",
                    background: risk === "moonshot" ? "hsl(280 80% 60% / 0.12)" : "hsl(142 70% 40% / 0.12)",
                  }}
                >
                  {risk === "moonshot" ? "🚀" : "🛡"} {risk}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle size={12} />
          No direct opportunities identified downstream of this constraint.
        </div>
      )}

      {/* Action hint */}
      <p className="text-[10px] text-muted-foreground">
        Click any opportunity above to trace its full reasoning chain in the graph.
      </p>
    </motion.div>
  );
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
  const [selectedConstraint, setSelectedConstraint] = useState<InsightGraphNode | null>(null);
  const [simulationIds, setSimulationIds] = useState<Set<string> | undefined>(undefined);

  // Rebuild layout with simulation highlights when a constraint is selected
  const { nodes, edges } = useMemo(
    () => layoutConstraintMap(graph, simulationIds),
    [graph, simulationIds],
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    const graphNode = graph.nodes.find(n => n.id === node.id);
    if (!graphNode) {
      onSelectNode?.(node.id);
      return;
    }

    // For constraint nodes: open the what-if drill-down panel
    if (graphNode.type === "constraint" || graphNode.type === "assumption") {
      setSelectedConstraint(graphNode);
      const { affectedIds } = simulateConstraintRemoval(graph, graphNode.id);
      setSimulationIds(affectedIds);
      return;
    }

    // For other nodes: propagate selection to parent
    onSelectNode?.(node.id);
  }, [graph, onSelectNode]);

  const handleClosePanel = useCallback(() => {
    setSelectedConstraint(null);
    setSimulationIds(undefined);
  }, []);

  const handleSelectFromPanel = useCallback((id: string) => {
    handleClosePanel();
    onSelectNode?.(id);
  }, [handleClosePanel, onSelectNode]);

  if (graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl py-10 bg-muted border border-border">
        <p className="text-sm text-foreground">Run the analysis to populate the Constraint Map.</p>
      </div>
    );
  }

  const height = compact ? 380 : 560;

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

      {/* What-If panel */}
      <AnimatePresence>
        {selectedConstraint && (
          <WhatIfPanel
            constraintNode={selectedConstraint}
            graph={graph}
            onClose={handleClosePanel}
            onSelectNode={handleSelectFromPanel}
          />
        )}
      </AnimatePresence>

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

        {/* Hint — only when no simulation is active */}
        {!selectedConstraint && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-[10px] font-semibold text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md whitespace-nowrap">
              Click a Constraint or Assumption node to simulate its removal
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
