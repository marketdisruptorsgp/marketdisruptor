/**
 * Opportunity Landscape — Enhanced
 *
 * 2-axis scatter plot: X = Feasibility, Y = Strategic Impact
 * Node size = influence, Color = node type
 * With glow states, animation, and breakthrough highlighting.
 */

import { memo, useMemo, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, Label,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Maximize2 } from "lucide-react";
import type { InsightGraph, InsightGraphNode, InsightNodeType } from "@/lib/insightGraph";
import { NODE_TYPE_CONFIG } from "@/lib/insightGraph";

const OPPORTUNITY_TYPES: InsightNodeType[] = [
  "outcome", "leverage_point", "flipped_idea", "concept",
];

const CONF_MAP: Record<string, number> = { high: 8.5, medium: 5.5, low: 2.5 };

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

const QUADRANTS = [
  { label: "Long Bets",                 x: 2.2,  y: 8.5 },
  { label: "Breakthrough Opportunities", x: 7,    y: 8.5 },
  { label: "Low Priority",              x: 2.2,  y: 2   },
  { label: "Incremental Wins",          x: 7,    y: 2   },
] as const;

/* ── Custom tooltip ── */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const pt: PlotPoint = payload[0].payload;
  const cfg = NODE_TYPE_CONFIG[pt.node.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl px-4 py-3 shadow-2xl max-w-72"
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
          { label: "Impact", value: `${pt.y}/10` },
          { label: "Feasibility", value: pt.node.confidence },
          { label: "Influence", value: String(pt.z) },
        ].map(m => (
          <div key={m.label} className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p className="text-xs font-bold" style={{ color: cfg.color }}>{m.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Filter chip ── */
function TypeChip({
  type, active, count, onToggle,
}: { type: InsightNodeType; active: boolean; count: number; onToggle: () => void }) {
  const cfg = NODE_TYPE_CONFIG[type];
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
      style={{
        background: active ? cfg.bgColor : "hsl(var(--muted))",
        border: `1.5px solid ${active ? cfg.borderColor : "hsl(var(--border))"}`,
        color: active ? cfg.color : "hsl(var(--muted-foreground))",
        opacity: active ? 1 : 0.5,
      }}
    >
      <div
        className="w-2.5 h-2.5 rounded-full"
        style={{
          background: active ? cfg.color : "hsl(var(--muted-foreground))",
          boxShadow: active ? `0 0 6px ${cfg.color}60` : "none",
        }}
      />
      {cfg.label} ({count})
    </button>
  );
}

/* ── Main ── */
interface OpportunityLandscapeProps {
  graph: InsightGraph;
  onSelectNode?: (nodeId: string) => void;
  compact?: boolean;
}

export const OpportunityLandscape = memo(function OpportunityLandscape({
  graph, onSelectNode, compact = false,
}: OpportunityLandscapeProps) {
  const [activeTypes, setActiveTypes] = useState<Set<InsightNodeType>>(new Set(OPPORTUNITY_TYPES));

  const opportunities = useMemo(
    () => graph.nodes.filter(n => OPPORTUNITY_TYPES.includes(n.type)),
    [graph.nodes],
  );

  const points = useMemo(
    () => opportunities.filter(n => activeTypes.has(n.type)).map(toPlot),
    [opportunities, activeTypes],
  );

  const breakthrough = useMemo(
    () => opportunities.reduce<InsightGraphNode | null>(
      (best, n) => (!best || n.influence > best.influence ? n : best), null,
    ),
    [opportunities],
  );

  const toggleType = (t: InsightNodeType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  if (opportunities.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl py-10 bg-muted border border-border">
        <p className="text-sm text-foreground">Run the analysis pipeline to populate the Opportunity Landscape.</p>
      </div>
    );
  }

  const height = compact ? 320 : 440;

  return (
    <div className="space-y-3">
      {/* Header + filters */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-2">
          {OPPORTUNITY_TYPES.map(t => {
            const count = opportunities.filter(n => n.type === t).length;
            if (count === 0) return null;
            return <TypeChip key={t} type={t} active={activeTypes.has(t)} count={count} onToggle={() => toggleType(t)} />;
          })}
        </div>
      )}

      {/* Breakthrough info moved to node detail panel — removed redundant callout */}

      {/* Chart */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1.5px solid hsl(var(--border))",
        }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 30, right: 30, bottom: 30, left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 10]}
              ticks={[0, 2.5, 5, 7.5, 10]}
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            >
              <Label
                value="Feasibility →"
                position="insideBottom"
                offset={-15}
                style={{ fontSize: 12, fontWeight: 700, fill: "hsl(var(--foreground))" }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 10]}
              ticks={[0, 2.5, 5, 7.5, 10]}
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            >
              <Label
                value="Strategic Impact →"
                angle={-90}
                position="insideLeft"
                offset={5}
                style={{ fontSize: 12, fontWeight: 700, fill: "hsl(var(--foreground))" }}
              />
            </YAxis>

            <ReferenceLine x={5} stroke="hsl(var(--border))" strokeDasharray="6 4" />
            <ReferenceLine y={5} stroke="hsl(var(--border))" strokeDasharray="6 4" />

            <Tooltip content={<CustomTooltip />} cursor={false} />

            <Scatter
              data={points}
              onClick={(pt: any) => onSelectNode?.(pt.node.id)}
              cursor="pointer"
            >
              {points.map((pt, i) => {
                const cfg = NODE_TYPE_CONFIG[pt.node.type];
                const isBreakthrough = breakthrough && pt.node.id === breakthrough.id;
                const radius = Math.max(7, Math.min(24, pt.z / 3.5));
                return (
                  <Cell
                    key={i}
                    fill={cfg.color}
                    fillOpacity={isBreakthrough ? 1 : 0.75}
                    stroke={isBreakthrough ? "hsl(38 92% 50%)" : cfg.borderColor}
                    strokeWidth={isBreakthrough ? 3 : 1.5}
                    r={radius}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Quadrant labels */}
        <div className="relative" style={{ marginTop: -height, height, pointerEvents: "none" }}>
          {QUADRANTS.map(q => (
            <span
              key={q.label}
              className="absolute text-xs font-extrabold uppercase tracking-widest select-none"
              style={{
                left: `${(q.x / 10) * 100}%`,
                top: `${100 - (q.y / 10) * 100}%`,
                transform: "translate(-50%, -50%)",
                color: "hsl(var(--muted-foreground))",
                opacity: 0.3,
              }}
            >
              {q.label}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 px-1">
        <span className="text-xs font-bold text-muted-foreground">
          {points.length} opportunities plotted
        </span>
        {breakthrough && (
          <span className="text-xs font-bold" style={{ color: NODE_TYPE_CONFIG[breakthrough.type].color }}>
            ★ {breakthrough.label.slice(0, 50)}
          </span>
        )}
      </div>
    </div>
  );
});
