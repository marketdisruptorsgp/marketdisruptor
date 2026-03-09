/**
 * Opportunity Landscape — Strategic Move Cards + Scatter Plot
 *
 * For ≤5 opportunities: ranked insight cards showing the full reasoning.
 * For 6+ opportunities: 2-axis scatter chart with density visualization.
 *
 * Each card answers: What's the move? Why does it matter? What makes it hard?
 */

import { memo, useMemo, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, Label,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Target, Shield, ArrowRight, ChevronDown, ChevronUp,
  TrendingUp, AlertTriangle, Lightbulb,
} from "lucide-react";
import type { InsightGraph, InsightGraphNode, InsightNodeType } from "@/lib/insightGraph";
import { NODE_TYPE_CONFIG, OPPORTUNITY_NODE_TYPES } from "@/lib/insightGraph";

const CONF_MAP: Record<string, number> = { high: 8.5, medium: 5.5, low: 2.5 };

const CARD_THRESHOLD = 6; // Show cards below this count, chart at or above

interface PlotPoint {
  x: number;
  y: number;
  z: number;
  node: InsightGraphNode;
}

function toPlot(n: InsightGraphNode): PlotPoint {
  return {
    x: CONF_MAP[n.confidence] ?? 5,
    y: n.impact,
    z: n.influence,
    node: n,
  };
}

function impactLabel(impact: number): { text: string; color: string } {
  if (impact >= 8) return { text: "High impact", color: "hsl(var(--success))" };
  if (impact >= 5) return { text: "Moderate impact", color: "hsl(var(--warning))" };
  return { text: "Emerging signal", color: "hsl(var(--muted-foreground))" };
}

function feasibilityLabel(confidence: string): { text: string; color: string; explanation: string } {
  if (confidence === "high") return { text: "High feasibility", color: "hsl(var(--success))", explanation: "Strong evidence supports this direction" };
  if (confidence === "medium") return { text: "Moderate feasibility", color: "hsl(var(--warning))", explanation: "Some validation needed before committing" };
  return { text: "Needs validation", color: "hsl(var(--destructive))", explanation: "Early signal — requires further evidence" };
}

function influenceLabel(influence: number): string {
  if (influence >= 60) return "Influences multiple parts of the system";
  if (influence >= 30) return "Moderate structural influence";
  return "Focused impact area";
}

/** Find constraints this node is connected to */
function findConnectedConstraints(node: InsightGraphNode, graph: InsightGraph): InsightGraphNode[] {
  // Walk backwards through edges to find constraint sources
  const constraintIds = new Set<string>();
  const visited = new Set<string>();
  const queue = [node.id];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    // Find edges pointing TO this node
    const incomingEdges = graph.edges.filter(e => e.target === current);
    for (const edge of incomingEdges) {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      if (sourceNode?.type === "constraint") {
        constraintIds.add(sourceNode.id);
      } else if (sourceNode && visited.size < 10) {
        queue.push(sourceNode.id);
      }
    }
  }

  return graph.nodes.filter(n => constraintIds.has(n.id));
}

/* ═══════════════════════════════════════════════════════
   CARD VIEW — Rich insight cards for ≤5 opportunities
   ═══════════════════════════════════════════════════════ */

function OpportunityCard({
  node, rank, graph, isExpanded, onToggle, onSelect,
}: {
  node: InsightGraphNode;
  rank: number;
  graph: InsightGraph;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: (id: string) => void;
}) {
  const cfg = NODE_TYPE_CONFIG[node.type];
  const impact = impactLabel(node.impact);
  const feasibility = feasibilityLabel(node.confidence);
  const constraints = useMemo(() => findConnectedConstraints(node, graph), [node, graph]);
  const isPrimary = rank === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: isPrimary
          ? "1.5px solid hsl(var(--primary) / 0.4)"
          : "1.5px solid hsl(var(--border))",
        boxShadow: isPrimary
          ? "0 4px 24px hsl(var(--primary) / 0.08)"
          : "none",
      }}
    >
      {/* Main card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3.5 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
      >
        {/* Rank badge */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: isPrimary ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted))",
            color: isPrimary ? "hsl(var(--primary))" : "hsl(var(--foreground))",
          }}
        >
          <span className="text-xs font-extrabold">{rank}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Type + confidence badges */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}60` }}
              />
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${impact.color}15`, color: impact.color }}
            >
              {impact.text}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${feasibility.color}15`, color: feasibility.color }}
            >
              {feasibility.text}
            </span>
          </div>

          {/* Full label — NO truncation */}
          <p className="text-sm font-bold text-foreground leading-snug">
            {node.label}
          </p>

          {/* Quick context line */}
          {node.reasoning && !isExpanded && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
              {node.reasoning}
            </p>
          )}
        </div>

        {/* Expand indicator */}
        <div className="flex-shrink-0 mt-1">
          {isExpanded
            ? <ChevronUp size={14} className="text-muted-foreground" />
            : <ChevronDown size={14} className="text-muted-foreground" />
          }
        </div>
      </button>

      {/* Expanded detail — the reasoning behind this opportunity */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
              {/* Why this matters */}
              {node.reasoning && (
                <div
                  className="rounded-lg p-3 mt-3"
                  style={{ background: `${cfg.color}08`, border: `1px solid ${cfg.color}15` }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Lightbulb size={11} style={{ color: cfg.color }} />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>
                      Why this matters
                    </span>
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{node.reasoning}</p>
                </div>
              )}

              {/* Connected constraints — what problem this solves */}
              {constraints.length > 0 && (
                <div
                  className="rounded-lg p-3"
                  style={{ background: "hsl(var(--destructive) / 0.04)", border: "1px solid hsl(var(--destructive) / 0.1)" }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Target size={11} style={{ color: "hsl(var(--destructive))" }} />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--destructive))" }}>
                      Constraint it unlocks
                    </span>
                  </div>
                  {constraints.slice(0, 3).map(c => (
                    <p key={c.id} className="text-xs text-foreground leading-relaxed mb-1">
                      {c.label}
                    </p>
                  ))}
                </div>
              )}

              {/* Feasibility assessment */}
              <div
                className="rounded-lg p-3"
                style={{ background: `${feasibility.color}06`, border: `1px solid ${feasibility.color}12` }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Shield size={11} style={{ color: feasibility.color }} />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: feasibility.color }}>
                    Feasibility
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{feasibility.explanation}</p>
                <p className="text-xs text-muted-foreground mt-1">{influenceLabel(node.influence)}</p>
              </div>

              {/* Evidence count */}
              {node.evidenceCount > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Based on {node.evidenceCount} evidence signal{node.evidenceCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* CTA to explore in graph */}
              {onSelect && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: "hsl(var(--primary) / 0.08)",
                    color: "hsl(var(--primary))",
                    border: "1px solid hsl(var(--primary) / 0.15)",
                  }}
                >
                  <TrendingUp size={10} />
                  Explore in reasoning map
                  <ArrowRight size={10} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   SCATTER VIEW — For 6+ opportunities
   ═══════════════════════════════════════════════════════ */

const QUADRANTS = [
  { label: "Long Bets",                 x: 2.2, y: 8.5 },
  { label: "Breakthrough Opportunities", x: 7,   y: 8.5 },
  { label: "Low Priority",              x: 2.2, y: 2   },
  { label: "Incremental Wins",          x: 7,   y: 2   },
] as const;

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const pt: PlotPoint = payload[0].payload;
  const cfg = NODE_TYPE_CONFIG[pt.node.type];
  const impact = impactLabel(pt.y);
  const feasibility = feasibilityLabel(pt.node.confidence);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl px-4 py-3 shadow-2xl max-w-80"
      style={{
        background: "hsl(var(--card))",
        border: `2px solid ${cfg.borderColor}`,
        boxShadow: `0 8px 32px hsl(0 0% 0% / 0.15), 0 0 0 1px ${cfg.borderColor}`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}60` }}
        />
        <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
      <p className="text-sm font-bold text-foreground leading-snug mb-2">{pt.node.label}</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Impact", value: impact.text, color: impact.color },
          { label: "Feasibility", value: feasibility.text, color: feasibility.color },
          { label: "Influence", value: pt.z >= 60 ? "Strong" : pt.z >= 30 ? "Moderate" : "Emerging", color: cfg.color },
        ].map(m => (
          <div key={m.label} className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p className="text-[10px] font-bold" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const opportunities = useMemo(
    () => graph.nodes
      .filter(n => OPPORTUNITY_TYPES.includes(n.type))
      .sort((a, b) => {
        // Sort by impact desc, then influence desc
        if (b.impact !== a.impact) return b.impact - a.impact;
        return b.influence - a.influence;
      }),
    [graph.nodes],
  );

  const points = useMemo(() => opportunities.map(toPlot), [opportunities]);

  const breakthrough = useMemo(
    () => opportunities.reduce<InsightGraphNode | null>(
      (best, n) => (!best || n.influence > best.influence ? n : best), null,
    ),
    [opportunities],
  );

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl py-10 gap-2" style={{ background: "hsl(var(--muted))", border: "1.5px solid hsl(var(--border))" }}>
        <Zap size={20} className="text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">Strategic moves will appear here</p>
        <p className="text-xs text-muted-foreground">Run the analysis pipeline to identify opportunity spaces</p>
      </div>
    );
  }

  const useCards = opportunities.length < CARD_THRESHOLD;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(var(--primary) / 0.1)" }}
        >
          <TrendingUp size={14} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">
            Strategic Moves
          </p>
          <p className="text-xs text-muted-foreground">
            {opportunities.length} opportunit{opportunities.length === 1 ? "y" : "ies"} identified — ranked by impact and evidence strength
          </p>
        </div>
      </div>

      {useCards ? (
        /* ── CARD VIEW ── */
        <div className="space-y-2">
          {opportunities.map((opp, idx) => (
            <OpportunityCard
              key={opp.id}
              node={opp}
              rank={idx + 1}
              graph={graph}
              isExpanded={expandedId === opp.id}
              onToggle={() => setExpandedId(prev => prev === opp.id ? null : opp.id)}
              onSelect={onSelectNode}
            />
          ))}
        </div>
      ) : (
        /* ── SCATTER VIEW ── */
        <>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "hsl(var(--card))",
              border: "1.5px solid hsl(var(--border))",
            }}
          >
            <ResponsiveContainer width="100%" height={compact ? 320 : 440}>
              <ScatterChart margin={{ top: 30, right: 30, bottom: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis type="number" dataKey="x" domain={[0, 10]} ticks={[0, 2.5, 5, 7.5, 10]}
                  tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }}
                  tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }}>
                  <Label value="Feasibility →" position="insideBottom" offset={-15}
                    style={{ fontSize: 12, fontWeight: 700, fill: "hsl(var(--foreground))" }} />
                </XAxis>
                <YAxis type="number" dataKey="y" domain={[0, 10]} ticks={[0, 2.5, 5, 7.5, 10]}
                  tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }}
                  tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }}>
                  <Label value="Strategic Impact →" angle={-90} position="insideLeft" offset={5}
                    style={{ fontSize: 12, fontWeight: 700, fill: "hsl(var(--foreground))" }} />
                </YAxis>
                <ReferenceLine x={5} stroke="hsl(var(--border))" strokeDasharray="6 4" />
                <ReferenceLine y={5} stroke="hsl(var(--border))" strokeDasharray="6 4" />
                <Tooltip content={<ScatterTooltip />} cursor={false} />
                <Scatter data={points} onClick={(pt: any) => onSelectNode?.(pt.node.id)} cursor="pointer">
                  {points.map((pt, i) => {
                    const cfg = NODE_TYPE_CONFIG[pt.node.type];
                    const isBreakthrough = breakthrough && pt.node.id === breakthrough.id;
                    const radius = Math.max(7, Math.min(24, pt.z / 3.5));
                    return (
                      <Cell key={i} fill={cfg.color} fillOpacity={isBreakthrough ? 1 : 0.75}
                        stroke={isBreakthrough ? "hsl(38 92% 50%)" : cfg.borderColor}
                        strokeWidth={isBreakthrough ? 3 : 1.5} r={radius} />
                    );
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>

            {/* Quadrant labels */}
            <div className="relative" style={{ marginTop: -(compact ? 320 : 440), height: compact ? 320 : 440, pointerEvents: "none" }}>
              {QUADRANTS.map(q => (
                <span key={q.label}
                  className="absolute text-xs font-extrabold uppercase tracking-widest select-none"
                  style={{
                    left: `${(q.x / 10) * 100}%`, top: `${100 - (q.y / 10) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    color: "hsl(var(--muted-foreground))", opacity: 0.3,
                  }}>
                  {q.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 px-1">
            <span className="text-xs font-bold text-muted-foreground">
              {points.length} opportunities plotted
            </span>
            {breakthrough && (
              <span className="text-xs font-bold" style={{ color: NODE_TYPE_CONFIG[breakthrough.type].color }}>
                ★ {breakthrough.label}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
});
