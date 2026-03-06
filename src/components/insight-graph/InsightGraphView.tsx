/**
 * Insight Graph View — Interactive Reasoning Explorer
 *
 * Tiered horizontal layout: Signals → Constraints → Assumptions → Leverage → Opportunities
 * Features: path highlighting, leverage scoring, zoom levels, opportunity path filter,
 *           breakthrough opportunity badges, hover tooltips, expanded detail panel.
 */

import { memo, useMemo, useState, useCallback } from "react";
import { TIER_META } from "@/lib/tierDiscoveryEngine";
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
import { NODE_TYPE_CONFIG, OPPORTUNITY_NODE_TYPES, getInsightChain, getOpportunityPathNodes } from "@/lib/insightGraph";
import { InsightNodeCard } from "./InsightNodeCard";
import { OpportunityLandscape } from "./OpportunityLandscape";
import { ConstraintMap } from "./ConstraintMap";
import { StrategicPathways } from "./StrategicPathways";
import { SimulationPanel } from "@/components/SimulationPanel";
import { RecomputeOverlay } from "@/components/RecomputeOverlay";
import { IntelligenceEventFeed } from "@/components/IntelligenceEventFeed";
import { type LensTool } from "@/lib/lensToolkitRegistry";
import { type ToolScenario } from "@/lib/scenarioEngine";
import { useIsMobile } from "@/hooks/use-mobile";

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PIPELINE_STEPS = ["report", "disrupt", "redesign", "stress_test", "pitch"] as const;
const ALL_NODE_TYPES: InsightNodeType[] = [
  "signal", "constraint", "assumption", "driver", "outcome",
  "leverage_point", "flipped_idea", "concept", "risk", "evidence",
];

/** Tiered layout columns: left-to-right reasoning flow per spec */
const TIER_CONFIG: { types: InsightNodeType[]; label: string; colIndex: number }[] = [
  { types: ["signal"],                             label: "Signals",       colIndex: 0 },
  { types: ["constraint"],                         label: "Constraints",   colIndex: 1 },
  { types: ["assumption"],                         label: "Assumptions",   colIndex: 2 },
  { types: ["driver", "leverage_point"],           label: "Leverage",      colIndex: 3 },
  { types: ["outcome", "flipped_idea", "concept"], label: "Opportunities", colIndex: 4 },
  { types: ["risk", "evidence"],                   label: "Validation",    colIndex: 5 },
];

/** Zoom level definitions */
type ZoomLevel = "overview" | "structural" | "full";
const ZOOM_LEVEL_CONFIG: Record<ZoomLevel, { label: string; description: string; types: InsightNodeType[] }> = {
  overview: {
    label: "Overview",
    description: "Signals, Constraints, Opportunities",
    types: ["signal", "constraint", "outcome", "flipped_idea", "concept"],
  },
  structural: {
    label: "Structural",
    description: "All reasoning layers",
    types: ["signal", "constraint", "assumption", "driver", "leverage_point", "outcome", "flipped_idea", "concept"],
  },
  full: {
    label: "Full Reasoning",
    description: "All nodes and evidence",
    types: ALL_NODE_TYPES,
  },
};

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
//  CUSTOM NODE — with leverage glow, breakthrough badge, sizing
// ═══════════════════════════════════════════════════════════════

function InsightNode({ data }: NodeProps) {
  const config = NODE_TYPE_CONFIG[data.nodeType as InsightNodeType];
  const influence = data.influence as number;
  const leverageScore = data.leverageScore as number;
  const isTopLeverage = data.isTopLeverage as boolean;
  const isBreakthrough = data.isBreakthrough as boolean;
  const isHighlighted = data.isHighlighted as boolean;
  const isDimmed = data.isDimmed as boolean;
  const isHighLeverage = leverageScore >= 60;
  const tier = data.tier as "structural" | "system" | "optimization" | undefined;
  const tierMeta = tier ? TIER_META[tier === "structural" ? 1 : tier === "system" ? 2 : 3] : null;

  // Size scales with leverage score
  const sizeScale = 1 + (leverageScore / 100) * 0.15;

  return (
    <div
      className="rounded-xl px-3.5 py-2.5 cursor-pointer relative"
      style={{
        background: config.bgColor,
        border: `2px solid ${(isTopLeverage || isBreakthrough) ? config.color : config.borderColor}`,
        boxShadow: isBreakthrough
          ? `0 0 28px ${config.color}40, 0 0 56px ${config.color}10`
          : isTopLeverage
            ? `0 0 24px ${config.color}40, 0 0 48px ${config.color}15`
            : isHighLeverage
              ? `0 0 16px ${config.color}20`
              : "0 2px 8px hsl(0 0% 0% / 0.06)",
        minWidth: Math.round(160 * sizeScale),
        maxWidth: Math.round(220 * sizeScale),
        opacity: isDimmed ? 0.2 : 1,
        transform: `scale(${isHighlighted ? sizeScale * 1.04 : sizeScale})`,
        transition: "opacity 0.4s ease, transform 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 1, height: 1 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 1, height: 1 }} />

      {/* Tier ring — visual tier grouping */}
      {tierMeta && (
        <div
          className="absolute -inset-0.5 rounded-xl pointer-events-none"
          style={{
            border: `2.5px solid ${tierMeta.color}`,
            opacity: isDimmed ? 0.1 : 0.55,
            borderRadius: "0.85rem",
          }}
        />
      )}

      {/* Pulsing ring for top leverage or breakthrough */}
      {(isTopLeverage || isBreakthrough) && (
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
            boxShadow: (isTopLeverage || isHighLeverage) ? `0 0 10px ${config.color}80` : "none",
          }}
        />
        <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: config.color }}>
          {config.label}
        </span>
        {tierMeta && (
          <span
            className="text-[8px] font-bold px-1 py-0.5 rounded-full"
            style={{ background: `${tierMeta.color}15`, color: tierMeta.color }}
          >
            T{tier === "structural" ? 1 : tier === "system" ? 2 : 3}
          </span>
        )}
        {isBreakthrough && (
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full ml-auto"
            style={{ background: `${config.color}20`, color: config.color }}
          >
            ★ Breakthrough
          </span>
        )}
        {isTopLeverage && !isBreakthrough && (
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
        {isHighLeverage && (
          <span className="text-xs font-bold tabular-nums" style={{ color: config.color }}>
            Lev. {leverageScore}
          </span>
        )}
        <span className="text-xs text-muted-foreground capitalize ml-auto">{data.confidence}</span>
      </div>
    </div>
  );
}

const nodeTypes = { insightNode: InsightNode };

// ═══════════════════════════════════════════════════════════════
//  HOVER TOOLTIP — anchored relative to graph container, not mouse
// ═══════════════════════════════════════════════════════════════

function GraphTooltip({ node, graph }: {
  node: InsightGraphNode; graph: InsightGraph;
}) {
  const config = NODE_TYPE_CONFIG[node.type];
  const downstream = graph.edges.filter(e => e.source === node.id);
  const upstream = graph.edges.filter(e => e.target === node.id);
  const downstreamOpps = downstream.filter(e => {
    const t = graph.nodes.find(n => n.id === e.target);
    return t && OPPORTUNITY_NODE_TYPES.includes(t.type);
  }).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="absolute z-40 pointer-events-none rounded-xl px-4 py-3 shadow-2xl"
      style={{
        top: 12,
        left: 12,
        maxWidth: 280,
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
        <p className="text-xs text-muted-foreground mb-2 line-clamp-2 italic">"{node.reasoning}"</p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
        <div>
          <p className="text-xs font-bold text-muted-foreground">Impact</p>
          <p className="text-sm font-extrabold" style={{ color: config.color }}>{node.impact}/10</p>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground">Leverage</p>
          <p className="text-sm font-extrabold" style={{ color: config.color }}>{node.leverageScore}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground">Influence</p>
          <p className="text-sm font-extrabold" style={{ color: config.color }}>{node.influence}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground">Confidence</p>
          <p className="text-sm font-extrabold capitalize" style={{ color: config.color }}>{node.confidence}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-2">
        {upstream.length > 0 && <span>↑ {upstream.length} upstream</span>}
        {downstream.length > 0 && <span>↓ {downstream.length} downstream</span>}
        {downstreamOpps > 0 && <span className="font-bold" style={{ color: NODE_TYPE_CONFIG.outcome.color }}>→ {downstreamOpps} opportunities</span>}
      </div>

      <p className="text-xs text-muted-foreground mt-1.5 font-semibold">Click to explore reasoning chain</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TIERED LAYOUT — Signals → Constraints → Assumptions → Leverage → Opportunities
// ═══════════════════════════════════════════════════════════════

function layoutTiered(graphNodes: InsightGraphNode[]): Node[] {
  const colWidth = 310;
  const rowHeight = 115;
  const flowNodes: Node[] = [];

  const tierMap = new Map<string, number>();
  TIER_CONFIG.forEach(tier => {
    tier.types.forEach(t => tierMap.set(t, tier.colIndex));
  });

  const columns = new Map<number, InsightGraphNode[]>();
  graphNodes.forEach(n => {
    const col = tierMap.get(n.type) ?? 2;
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col)!.push(n);
  });

  columns.forEach((group, col) => {
    // Sort by leverage score desc, then influence
    group.sort((a, b) => (b.leverageScore - a.leverageScore) || (b.influence - a.influence));
    const colHeight = group.length * rowHeight;
    const offsetY = -colHeight / 2; // center vertically

    group.forEach((gn, row) => {
      const jitterX = Math.sin(row * 2.3 + col * 1.7) * 18;
      const jitterY = Math.cos(row * 1.8 + col * 2.1) * 12;
      flowNodes.push({
        id: gn.id,
        type: "insightNode",
        position: {
          x: col * colWidth + jitterX + 60,
          y: offsetY + row * rowHeight + jitterY + 80,
        },
        data: {
          label: gn.label,
          nodeType: gn.type,
          impact: gn.impact,
          confidence: gn.confidence,
          influence: gn.influence,
          leverageScore: gn.leverageScore,
          tier: gn.tier,
          isTopLeverage: false,
          isBreakthrough: false,
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
  analysisId?: string;
  onScenarioSaved?: (s: ToolScenario) => void;
}

type TierFilter = "all" | "structural" | "system" | "optimization";
const TIER_FILTERS: { key: TierFilter; label: string; color: string }[] = [
  { key: "all", label: "All Tiers", color: "hsl(var(--primary))" },
  { key: "structural", label: "T1 Structural", color: "hsl(0 72% 52%)" },
  { key: "system", label: "T2 System", color: "hsl(38 92% 50%)" },
  { key: "optimization", label: "T3 Optimization", color: "hsl(229 89% 63%)" },
];

export const InsightGraphView = memo(function InsightGraphView({ graph, analysisId = "", onScenarioSaved }: InsightGraphViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"graph" | "landscape" | "constraints" | "pathways">("graph");
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>("structural");
  const [showOpportunityPaths, setShowOpportunityPaths] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [simPanelOpen, setSimPanelOpen] = useState(false);
  const [simTool, setSimTool] = useState<LensTool | null>(null);
  const [intelligenceEvents, setIntelligenceEvents] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const handleOpenTool = useCallback((tool: LensTool) => {
    setSimTool(tool);
    setSimPanelOpen(true);
  }, []);

  const handleSimScenarioSaved = useCallback((scenario: ToolScenario) => {
    setIntelligenceEvents(prev => [
      `Scenario saved: ${scenario.scenarioName}`,
      `New evidence from ${scenario.toolId.replace(/-/g, " ")}`,
      ...prev,
    ].slice(0, 10));
    onScenarioSaved?.(scenario);
  }, [onScenarioSaved]);

  // Identify top leverage constraint + breakthrough opportunity
  const topLeverageId = useMemo(() => graph.topNodes.primaryConstraint?.id ?? null, [graph.topNodes]);
  const breakthroughId = useMemo(() => graph.topNodes.breakthroughOpportunity?.id ?? null, [graph.topNodes]);

  // Opportunity path node IDs
  const opportunityPathIds = useMemo(() => getOpportunityPathNodes(graph), [graph]);

  // Compute highlighted chain when a node is selected
  const highlightedIds = useMemo(() => {
    if (!selectedNodeId) return null;
    const chain = getInsightChain(graph, selectedNodeId);
    return new Set(chain.map(n => n.id));
  }, [selectedNodeId, graph]);

  const highlightedEdgeIds = useMemo(() => {
    if (!highlightedIds) return null;
    const ids = new Set<string>();
    graph.edges.forEach(e => {
      if (highlightedIds.has(e.source) && highlightedIds.has(e.target)) ids.add(e.id);
    });
    return ids;
  }, [highlightedIds, graph.edges]);

  // Apply zoom level + opportunity path filter + tier filter
  const filteredNodes = useMemo(() => {
    const zoomTypes = new Set(ZOOM_LEVEL_CONFIG[zoomLevel].types);
    return graph.nodes.filter(n => {
      if (!zoomTypes.has(n.type)) return false;
      if (showOpportunityPaths && !opportunityPathIds.has(n.id)) return false;
      if (tierFilter !== "all" && n.tier !== tierFilter) return false;
      return true;
    });
  }, [graph.nodes, zoomLevel, showOpportunityPaths, opportunityPathIds, tierFilter]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return graph.edges.filter(e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target));
  }, [graph.edges, filteredNodeIds]);

  // Build flow nodes with highlight/dim/leverage states
  const flowNodes = useMemo(() => {
    const base = layoutTiered(filteredNodes);
    return base.map(n => ({
      ...n,
      data: {
        ...n.data,
        isTopLeverage: n.id === topLeverageId,
        isBreakthrough: n.id === breakthroughId,
        isHighlighted: highlightedIds ? highlightedIds.has(n.id) : false,
        isDimmed: highlightedIds ? !highlightedIds.has(n.id) : false,
      },
    }));
  }, [filteredNodes, topLeverageId, breakthroughId, highlightedIds]);

  // Build edges with highlight states
  const flowEdges: Edge[] = useMemo(() => {
    return filteredEdges.map(e => {
      const isHL = highlightedEdgeIds?.has(e.id) ?? false;
      const isDim = highlightedEdgeIds ? !isHL : false;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isHL || e.relation === "unlocks" || e.relation === "leads_to",
        label: isHL ? RELATION_LABELS[e.relation] : undefined,
        labelStyle: { fontSize: 10, fontWeight: 700, fill: "hsl(var(--foreground))" },
        style: {
          stroke: isHL ? RELATION_COLORS[e.relation] : isDim ? "hsl(var(--border))" : RELATION_COLORS[e.relation],
          strokeWidth: isHL ? 3 : Math.max(1, e.weight * 2),
          opacity: isDim ? 0.1 : isHL ? 0.9 : 0.4,
          transition: "opacity 0.4s, stroke-width 0.3s",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isDim ? "hsl(var(--border))" : RELATION_COLORS[e.relation],
          width: isHL ? 14 : 10,
          height: isHL ? 14 : 10,
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


  if (graph.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl bg-muted border border-border gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        </div>
        <p className="typo-body text-muted-foreground text-center max-w-xs">
          Run the analysis pipeline to populate the Insight Graph.
        </p>
        <p className="typo-meta text-center">Complete Report → Disrupt to generate graph nodes</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Toolbar: Tabs + Controls (desktop only — mobile gets bottom bar) ── */}
      <div className="rounded-xl border border-border bg-card p-2 space-y-2">
        {/* Row 1: View tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {([
            { id: "graph", label: "Network Graph" },
            { id: "landscape", label: "Opportunity Landscape" },
            { id: "constraints", label: "Constraint Map" },
            { id: "pathways", label: "Strategic Pathways" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedNodeId(null); }}
              className="min-h-[44px] px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
              style={{
                borderBottom: activeTab === tab.id ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                color: activeTab === tab.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                background: "transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 2: Controls (desktop only — mobile uses bottom bar) */}
        {activeTab === "graph" && !isMobile && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Zoom levels */}
            <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              {(Object.keys(ZOOM_LEVEL_CONFIG) as ZoomLevel[]).map(level => (
                <button
                  key={level}
                  onClick={() => setZoomLevel(level)}
                  className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all"
                  style={{
                    background: zoomLevel === level ? "hsl(var(--card))" : "transparent",
                    color: zoomLevel === level ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                    boxShadow: zoomLevel === level ? "0 1px 3px hsl(0 0% 0% / 0.1)" : "none",
                  }}
                  title={ZOOM_LEVEL_CONFIG[level].description}
                >
                  {ZOOM_LEVEL_CONFIG[level].label}
                </button>
              ))}
            </div>

            {/* Tier filter chips */}
            <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              {TIER_FILTERS.map(tf => {
                const count = tf.key === "all"
                  ? graph.nodes.length
                  : graph.nodes.filter(n => n.tier === tf.key).length;
                if (count === 0 && tf.key !== "all") return null;
                return (
                  <button
                    key={tf.key}
                    onClick={() => setTierFilter(tf.key)}
                    className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1"
                    style={{
                      background: tierFilter === tf.key ? "hsl(var(--card))" : "transparent",
                      color: tierFilter === tf.key ? tf.color : "hsl(var(--muted-foreground))",
                      boxShadow: tierFilter === tf.key ? "0 1px 3px hsl(0 0% 0% / 0.1)" : "none",
                    }}
                  >
                    {tf.key !== "all" && <span className="w-2 h-2 rounded-full" style={{ background: tf.color }} />}
                    {tf.label}
                    {tf.key !== "all" && <span className="text-[10px] opacity-70">({count})</span>}
                  </button>
                );
              })}
            </div>

            {/* Opportunity paths toggle */}
            <button
              onClick={() => setShowOpportunityPaths(!showOpportunityPaths)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: showOpportunityPaths ? NODE_TYPE_CONFIG.outcome.bgColor : "hsl(var(--muted))",
                border: `1.5px solid ${showOpportunityPaths ? NODE_TYPE_CONFIG.outcome.borderColor : "hsl(var(--border))"}`,
                color: showOpportunityPaths ? NODE_TYPE_CONFIG.outcome.color : "hsl(var(--muted-foreground))",
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: showOpportunityPaths ? NODE_TYPE_CONFIG.outcome.color : "hsl(var(--muted-foreground))" }} />
              Opp. Paths
            </button>

            {selectedNodeId && (
              <button
                onClick={() => setSelectedNodeId(null)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-muted border border-border text-foreground hover:bg-card transition-colors"
              >
                ✕ Clear
              </button>
            )}

            {/* Tier legend (desktop) */}
            <div className="flex items-center gap-1 ml-auto overflow-x-auto scrollbar-hide">
              {TIER_CONFIG.map((tier) => {
                const count = filteredNodes.filter(n => tier.types.includes(n.type)).length;
                if (count === 0) return null;
                const cfg = NODE_TYPE_CONFIG[tier.types[0]];
                return (
                  <span
                    key={tier.label}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold"
                    style={{ color: cfg.color }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                    {tier.label} ({count})
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {activeTab === "landscape" ? (
        <OpportunityLandscape graph={graph} onSelectNode={setSelectedNodeId} />
      ) : activeTab === "constraints" ? (
        <ConstraintMap graph={graph} onSelectNode={setSelectedNodeId} />
      ) : activeTab === "pathways" ? (
        <StrategicPathways graph={graph} onSelectNode={setSelectedNodeId} />
      ) : (
      <>
      {/* Active path indicator */}
      <AnimatePresence>
        {selectedNode && highlightedIds && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl px-4 py-3 flex items-center gap-3 overflow-hidden"
            style={{
              background: NODE_TYPE_CONFIG[selectedNode.type].bgColor,
              border: `1.5px solid ${NODE_TYPE_CONFIG[selectedNode.type].borderColor}`,
            }}
          >
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: NODE_TYPE_CONFIG[selectedNode.type].color }} />
            <div className="flex-1 min-w-0">
              <p className="typo-meta font-bold uppercase tracking-widest" style={{ color: NODE_TYPE_CONFIG[selectedNode.type].color }}>
                Reasoning Chain Active
              </p>
              <p className="typo-body font-bold text-foreground truncate">
                Tracing {highlightedIds.size} connected nodes from "{selectedNode.label.slice(0, 50)}"
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-center">
                <p className="typo-meta">Leverage</p>
                <p className="text-sm font-extrabold" style={{ color: NODE_TYPE_CONFIG[selectedNode.type].color }}>
                  {selectedNode.leverageScore}
                </p>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md text-xs font-bold bg-muted border border-border text-foreground hover:bg-card transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graph Canvas */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          height: isMobile ? "75vh" : 580,
          minHeight: isMobile ? 400 : 360,
          background: "hsl(var(--card))",
          border: "1.5px solid hsl(var(--border))",
        }}
      >
        {/* Column labels at top */}
        {!isMobile && (
          <div className="absolute top-2 left-0 right-0 z-10 flex pointer-events-none" style={{ paddingLeft: 60 }}>
            {TIER_CONFIG.map((tier) => {
              const count = filteredNodes.filter(n => tier.types.includes(n.type)).length;
              if (count === 0) return null;
              return (
                <div key={tier.label} className="flex-1 text-center">
                  <span className="typo-meta font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-card/80 backdrop-blur-sm border border-border/50" style={{ color: NODE_TYPE_CONFIG[tier.types[0]].color }}>
                    {tier.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Onboarding overlay */}
        {showOnboarding && !selectedNodeId && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card/95 backdrop-blur-sm border border-border rounded-xl px-6 py-4 shadow-lg text-center max-w-xs pointer-events-auto"
            >
              <p className="typo-body font-semibold text-foreground mb-1">Click any node to explore its reasoning chain</p>
              <p className="typo-meta mb-3">Nodes are connected by causal relationships across the analysis pipeline</p>
              <button
                onClick={() => setShowOnboarding(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}

        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: isMobile ? 0.15 : 0.3 }}
          minZoom={0.25}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} color="hsl(var(--border))" />
          <Controls showInteractive={false} style={{ bottom: 12, left: 12 }} />
          {!isMobile && (
            <MiniMap
              nodeStrokeWidth={2}
              style={{
                background: "hsl(var(--muted))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
              }}
            />
          )}
        </ReactFlow>

        {/* Hover Tooltip — anchored inside graph canvas */}
        <AnimatePresence>
          {hoveredNode && activeTab === "graph" && !selectedNodeId && !isMobile && (
            <GraphTooltip node={hoveredNode} graph={graph} />
          )}
        </AnimatePresence>

        {/* Node detail card overlay — desktop only (right panel) */}
        {!isMobile && (
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
        )}
      </div>

      {/* Node detail card — mobile bottom sheet */}
      {isMobile && (
        <AnimatePresence>
          {selectedNode && (
            <InsightNodeCard
              node={selectedNode}
              graph={graph}
              onClose={() => setSelectedNodeId(null)}
              onSelectNode={setSelectedNodeId}
              isMobile
            />
          )}
        </AnimatePresence>
      )}

      {/* Mobile Bottom Control Bar */}
      {isMobile && activeTab === "graph" && (
        <div
          className="flex items-center gap-2 p-2 rounded-xl overflow-x-auto scrollbar-hide"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          {/* Zoom levels */}
          {(Object.keys(ZOOM_LEVEL_CONFIG) as ZoomLevel[]).map(level => (
            <button
              key={level}
              onClick={() => setZoomLevel(level)}
              className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: zoomLevel === level ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted))",
                color: zoomLevel === level ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                border: zoomLevel === level ? "1px solid hsl(var(--primary) / 0.3)" : "1px solid hsl(var(--border))",
              }}
            >
              {ZOOM_LEVEL_CONFIG[level].label}
            </button>
          ))}
          {/* Opp paths */}
          <button
            onClick={() => setShowOpportunityPaths(!showOpportunityPaths)}
            className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              background: showOpportunityPaths ? NODE_TYPE_CONFIG.outcome.bgColor : "hsl(var(--muted))",
              border: `1px solid ${showOpportunityPaths ? NODE_TYPE_CONFIG.outcome.borderColor : "hsl(var(--border))"}`,
              color: showOpportunityPaths ? NODE_TYPE_CONFIG.outcome.color : "hsl(var(--muted-foreground))",
            }}
          >
            Paths
          </button>
          {selectedNodeId && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold bg-muted border border-border text-foreground whitespace-nowrap flex-shrink-0"
            >
              ✕ Clear
            </button>
          )}
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto flex-shrink-0">
            {filteredNodes.length}n · {filteredEdges.length}e
          </span>
        </div>
      )}

      {/* Stats Bar (desktop) */}
      {!isMobile && (
        <div className="flex flex-wrap items-center gap-4 px-2">
          <span className="typo-meta font-bold">
            {ZOOM_LEVEL_CONFIG[zoomLevel].label} · {filteredNodes.length} nodes · {filteredEdges.length} edges
            {showOpportunityPaths && " · Opportunity paths only"}
          </span>
          {graph.topNodes.primaryConstraint && (
            <span className="typo-meta font-bold flex items-center gap-1" style={{ color: NODE_TYPE_CONFIG.constraint.color }}>
              ★ Top Constraint: {graph.topNodes.primaryConstraint.label.slice(0, 35)}
            </span>
          )}
          {graph.topNodes.breakthroughOpportunity && (
            <span className="typo-meta font-bold flex items-center gap-1" style={{ color: NODE_TYPE_CONFIG.outcome.color }}>
              ★ Breakthrough: {graph.topNodes.breakthroughOpportunity.label.slice(0, 35)}
            </span>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
});
