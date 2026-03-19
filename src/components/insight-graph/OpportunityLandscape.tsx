/**
 * Opportunity Landscape — Interactive React Flow Cluster Visualization
 *
 * Renders opportunity nodes as focal clusters connected to their
 * upstream constraints/assumptions. Visual reasoning, not text lists.
 *
 * Uses graphQuery.ts as single source of truth for node selection.
 * Classifies each opportunity as "safe" (incremental) or "moonshot"
 * (high-leverage, disruptive) and lets users filter by category.
 */

import { memo, useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  Position,
  ConnectionLineType,
  Handle,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";
import { Lightbulb, Rocket, Shield, Zap } from "lucide-react";
import type { InsightGraph, InsightGraphNode, InsightNodeType } from "@/lib/insightGraph";
import { NODE_TYPE_CONFIG } from "@/lib/insightGraph";
import { getOpportunityNodes, getUpstreamNodes, classifyOpportunity, partitionOpportunities, type OpportunityRisk } from "@/lib/graphQuery";

/* ═══════════════════════════════════════════════════════
   CUSTOM NODE COMPONENTS
   ═══════════════════════════════════════════════════════ */

/** Opportunity node — large focal card */
const OpportunityNode = memo(({ data, selected }: NodeProps) => {
  const [hovered, setHovered] = useState(false);
  const config = NODE_TYPE_CONFIG[data.nodeType as InsightNodeType] || NODE_TYPE_CONFIG.outcome;
  const isMoonshot = data.riskCategory === "moonshot";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${config.bgColor}, ${config.color}15)`
          : config.bgColor,
        border: `2px solid ${hovered || selected ? config.color : config.borderColor}`,
        borderRadius: 16,
        padding: "16px 20px",
        minWidth: 200,
        maxWidth: 280,
        boxShadow: hovered
          ? `0 8px 32px ${config.color}20, 0 2px 8px hsl(var(--foreground) / 0.05)`
          : `0 2px 8px hsl(var(--foreground) / 0.04)`,
        transition: "all 0.2s ease",
        cursor: "pointer",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />

      {/* Type badge + risk category badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <span
          style={{
            padding: "3px 10px",
            borderRadius: 8,
            fontSize: 9,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: config.color,
            background: `${config.color}12`,
          }}
        >
          {config.label}
        </span>
        {/* Safe / Moonshot classification badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            padding: "3px 8px",
            borderRadius: 8,
            fontSize: 9,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: isMoonshot ? "hsl(280 80% 60%)" : "hsl(142 70% 40%)",
            background: isMoonshot ? "hsl(280 80% 60% / 0.12)" : "hsl(142 70% 40% / 0.12)",
          }}
        >
          {isMoonshot ? "🚀 Moonshot" : "🛡 Safe"}
        </span>
        {data.confidence && (
          <span style={{
            fontSize: 9, fontWeight: 600,
            color: "hsl(var(--muted-foreground))",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            {data.confidence}
          </span>
        )}
      </div>

      {/* Label */}
      <p style={{
        margin: 0, fontSize: 13, fontWeight: 700,
        lineHeight: 1.4, color: "hsl(var(--foreground))",
      }}>
        {data.label}
      </p>

      {/* Reasoning — on hover */}
      {data.reasoning && hovered && (
        <p style={{
          margin: "8px 0 0", fontSize: 11, lineHeight: 1.5,
          color: "hsl(var(--muted-foreground))",
          borderTop: "1px solid hsl(var(--border) / 0.5)",
          paddingTop: 8,
        }}>
          {data.reasoning}
        </p>
      )}

      {/* Evidence count */}
      {data.evidenceCount > 0 && (
        <p style={{
          margin: "6px 0 0", fontSize: 10, fontWeight: 700,
          color: "hsl(var(--muted-foreground))",
        }}>
          {data.evidenceCount} evidence signal{data.evidenceCount !== 1 ? "s" : ""}
        </p>
      )}

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 1, height: 1 }} />
    </div>
  );
});
OpportunityNode.displayName = "OpportunityNode";

/** Supporting node — constraint, assumption, etc. */
const SupportingNode = memo(({ data, selected }: NodeProps) => {
  const [hovered, setHovered] = useState(false);
  const config = NODE_TYPE_CONFIG[data.nodeType as InsightNodeType] || NODE_TYPE_CONFIG.constraint;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${config.bgColor}` : "hsl(var(--card))",
        border: `1.5px ${data.nodeType === "assumption" ? "dashed" : "solid"} ${hovered || selected ? config.color : config.borderColor}`,
        borderRadius: 12,
        padding: "10px 14px",
        minWidth: 160,
        maxWidth: 220,
        boxShadow: hovered
          ? `0 4px 16px ${config.color}15`
          : "0 1px 4px hsl(var(--foreground) / 0.03)",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: config.color, flexShrink: 0,
        }} />
        <span style={{
          fontSize: 9, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.06em", color: config.color,
        }}>
          {config.label}
        </span>
      </div>

      <p style={{
        margin: 0, fontSize: 11, fontWeight: 600,
        lineHeight: 1.4, color: "hsl(var(--foreground))",
      }}>
        {data.label}
      </p>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 1, height: 1 }} />
    </div>
  );
});
SupportingNode.displayName = "SupportingNode";

const nodeTypes = {
  opportunityNode: OpportunityNode,
  supportingNode: SupportingNode,
};

/* ═══════════════════════════════════════════════════════
   LAYOUT ENGINE — Radial cluster layout
   ═══════════════════════════════════════════════════════ */

function buildClusterLayout(
  graph: InsightGraph,
  opportunities: InsightGraphNode[],
): { nodes: Node[]; edges: Edge[] } {
  const rfNodes: Node[] = [];
  const rfEdges: Edge[] = [];
  const placedIds = new Set<string>();

  const CLUSTER_SPACING_X = 420;
  const CLUSTER_SPACING_Y = 380;
  const COLS = Math.min(3, Math.ceil(Math.sqrt(opportunities.length)));

  opportunities.forEach((opp, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const centerX = col * CLUSTER_SPACING_X + 200;
    const centerY = row * CLUSTER_SPACING_Y + 60;

    // Place opportunity node at cluster center
    rfNodes.push({
      id: opp.id,
      type: "opportunityNode",
      position: { x: centerX, y: centerY },
      data: {
        label: opp.label,
        nodeType: opp.type,
        confidence: opp.confidence,
        reasoning: opp.reasoning,
        evidenceCount: opp.evidenceCount,
        riskCategory: classifyOpportunity(opp),
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });
    placedIds.add(opp.id);

    // Get upstream nodes (constraints, assumptions, signals that feed this opportunity)
    const upstreams = getUpstreamNodes(graph, opp.id);
    const uniqueUpstreams = upstreams.filter(n => !placedIds.has(n.id)).slice(0, 5);

    const UPSTREAM_RADIUS_X = 160;
    const UPSTREAM_RADIUS_Y = 130;

    uniqueUpstreams.forEach((upstream, uIdx) => {
      const angle = ((uIdx / Math.max(uniqueUpstreams.length, 1)) * Math.PI) + Math.PI;
      const ux = centerX + Math.cos(angle) * UPSTREAM_RADIUS_X;
      const uy = centerY + Math.sin(angle) * UPSTREAM_RADIUS_Y - 120;

      rfNodes.push({
        id: upstream.id,
        type: "supportingNode",
        position: { x: ux, y: uy },
        data: {
          label: upstream.label,
          nodeType: upstream.type,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
      placedIds.add(upstream.id);

      // Edge from upstream → opportunity
      const edgeConfig = NODE_TYPE_CONFIG[upstream.type as InsightNodeType] || NODE_TYPE_CONFIG.constraint;
      rfEdges.push({
        id: `e-${upstream.id}-${opp.id}`,
        source: upstream.id,
        target: opp.id,
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: edgeConfig.color },
        style: { stroke: edgeConfig.color, strokeWidth: 1.5, opacity: 0.6 },
      });
    });
  });

  // Add cross-cluster edges between opportunities if they share connections
  for (let i = 0; i < opportunities.length; i++) {
    for (let j = i + 1; j < opportunities.length; j++) {
      const edge = graph.edges.find(
        e => (e.source === opportunities[i].id && e.target === opportunities[j].id) ||
             (e.source === opportunities[j].id && e.target === opportunities[i].id)
      );
      if (edge) {
        rfEdges.push({
          id: `cross-${i}-${j}`,
          source: edge.source,
          target: edge.target,
          type: "smoothstep",
          style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "6 4", opacity: 0.3 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: "hsl(var(--muted-foreground))" },
        });
      }
    }
  }

  return { nodes: rfNodes, edges: rfEdges };
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

interface OpportunityLandscapeProps {
  graph: InsightGraph;
  onSelectNode?: (nodeId: string) => void;
  compact?: boolean;
}

export const OpportunityLandscape = memo(function OpportunityLandscape({
  graph, onSelectNode, compact = false,
}: OpportunityLandscapeProps) {
  const [riskFilter, setRiskFilter] = useState<"all" | OpportunityRisk>("all");

  // Use graph query layer as single source of truth
  const allOpportunities = useMemo(
    () => getOpportunityNodes(graph)
      .sort((a, b) => {
        if (b.impact !== a.impact) return b.impact - a.impact;
        if (b.evidenceCount !== a.evidenceCount) return b.evidenceCount - a.evidenceCount;
        return b.influence - a.influence;
      }),
    [graph],
  );

  const { safe: safeOpps, moonshot: moonshotOpps } = useMemo(
    () => partitionOpportunities(allOpportunities),
    [allOpportunities],
  );

  const opportunities = useMemo(() => {
    if (riskFilter === "safe") return safeOpps;
    if (riskFilter === "moonshot") return moonshotOpps;
    return allOpportunities;
  }, [riskFilter, allOpportunities, safeOpps, moonshotOpps]);

  const { nodes, edges } = useMemo(
    () => buildClusterLayout(graph, opportunities),
    [graph, opportunities],
  );

  const handleNodeClick = useCallback((_: any, node: Node) => {
    onSelectNode?.(node.id);
  }, [onSelectNode]);

  if (allOpportunities.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl py-10 gap-2"
        style={{ background: "hsl(var(--muted))", border: "1.5px solid hsl(var(--border))" }}
      >
        <Zap size={20} className="text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">Strategic moves will appear here</p>
        <p className="text-xs text-muted-foreground">
          The analysis pipeline will identify opportunity spaces from structural reasoning
        </p>
      </div>
    );
  }

  const clusterRows = Math.ceil(Math.max(opportunities.length, 1) / 3);
  const containerH = Math.max(400, clusterRows * 380 + 120);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* Header + filter controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--primary) / 0.1)" }}
          >
            <Lightbulb size={14} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">
              Opportunity Landscape
            </p>
            <p className="text-xs text-muted-foreground">
              {opportunities.length} of {allOpportunities.length} move{opportunities.length !== 1 ? "s" : ""} · click any node to trace reasoning
            </p>
          </div>
        </div>

        {/* Safe / Moonshot filter */}
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
          {(["all", "safe", "moonshot"] as const).map(f => (
            <button
              key={f}
              onClick={() => setRiskFilter(f)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background: riskFilter === f ? "hsl(var(--card))" : "transparent",
                color: riskFilter === f ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                boxShadow: riskFilter === f ? "0 1px 4px hsl(var(--foreground) / 0.06)" : "none",
              }}
            >
              {f === "moonshot" && <Rocket size={9} />}
              {f === "safe" && <Shield size={9} />}
              {f === "all" ? `All (${allOpportunities.length})` : f === "safe" ? `Safe (${safeOpps.length})` : `Moonshot (${moonshotOpps.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state for filtered view */}
      {opportunities.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-xl py-8 gap-2"
          style={{ background: "hsl(var(--muted))", border: "1.5px dashed hsl(var(--border))" }}
        >
          <p className="text-xs font-semibold text-muted-foreground">
            No {riskFilter} opportunities identified yet
          </p>
          <button
            onClick={() => setRiskFilter("all")}
            className="text-[10px] font-bold text-primary underline"
          >
            Show all
          </button>
        </div>
      )}

      {/* React Flow Canvas */}
      {opportunities.length > 0 && (
        <div
          className="rounded-xl overflow-hidden relative group"
          style={{
            height: containerH,
            background: "linear-gradient(180deg, hsl(var(--card)), hsl(var(--background)))",
            border: "1.5px solid hsl(var(--border))",
            boxShadow: "0 2px 12px hsl(var(--foreground) / 0.03)",
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            connectionLineType={ConnectionLineType.SmoothStep}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnDrag={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            preventScrolling={false}
            minZoom={0.3}
            maxZoom={2}
          >
            <Background gap={28} size={1} color="hsl(var(--border) / 0.15)" />
            <Controls
              showInteractive={false}
              position="bottom-right"
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 2,
                background: "hsl(var(--card) / 0.9)",
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                padding: 2,
              }}
            />
          </ReactFlow>

          {/* Interaction hint */}
          <div className="absolute bottom-3 left-3 opacity-60 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
            <span className="text-[10px] font-semibold text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
              Drag nodes · Scroll to zoom · Click to explore
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
});
