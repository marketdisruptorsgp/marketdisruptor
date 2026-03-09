/**
 * Strategic Pathways — Animated Decision Flow
 *
 * Shows the top 3 strategic pathways from constraints through
 * leverage points to opportunities, with animated flow indicators.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Crosshair, Lightbulb, Zap } from "lucide-react";
import type { InsightGraph, InsightGraphNode } from "@/lib/insightGraph";
import { NODE_TYPE_CONFIG } from "@/lib/insightGraph";

interface Pathway {
  id: string;
  constraint: InsightGraphNode;
  leveragePoints: InsightGraphNode[];
  opportunities: InsightGraphNode[];
  totalInfluence: number;
}

function extractPathways(graph: InsightGraph): Pathway[] {
  const constraints = graph.nodes
    .filter(n => n.type === "constraint")
    .sort((a, b) => b.influence - a.influence)
    .slice(0, 5);

  const pathways: Pathway[] = [];

  for (const constraint of constraints) {
    // Find leverage points connected to this constraint
    const levEdges = graph.edges.filter(
      e => e.source === constraint.id && ["leads_to", "causes", "unlocks"].includes(e.relation)
    );
    const levIds = new Set(levEdges.map(e => e.target));
    const leveragePoints = graph.nodes
      .filter(n => levIds.has(n.id) && (n.type === "leverage_point" || n.type === "driver"))
      .slice(0, 2);

    // Find opportunities connected to leverage points
    const oppIds = new Set<string>();
    for (const lp of leveragePoints) {
      const oppEdges = graph.edges.filter(
        e => e.source === lp.id && ["unlocks", "leads_to"].includes(e.relation)
      );
      oppEdges.forEach(e => oppIds.add(e.target));
    }
    const opportunities = graph.nodes
      .filter(n => oppIds.has(n.id) && ["outcome", "concept", "flipped_idea"].includes(n.type))
      .slice(0, 2);

    if (leveragePoints.length > 0 || opportunities.length > 0) {
      const totalInfluence = constraint.influence +
        leveragePoints.reduce((s, n) => s + n.influence, 0) +
        opportunities.reduce((s, n) => s + n.influence, 0);

      pathways.push({
        id: constraint.id,
        constraint,
        leveragePoints,
        opportunities,
        totalInfluence,
      });
    }
  }

  return pathways.sort((a, b) => b.totalInfluence - a.totalInfluence).slice(0, 3);
}

function PathwayNode({ node, index }: { node: InsightGraphNode; index: number }) {
  const cfg = NODE_TYPE_CONFIG[node.type];
  const isHigh = node.influence >= 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.4 }}
      className="rounded-xl px-3 py-2.5 min-w-0 flex-1"
      style={{
        background: cfg.bgColor,
        border: `1.5px solid ${cfg.borderColor}`,
        boxShadow: isHigh ? `0 0 16px ${cfg.color}20` : "none",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: cfg.color,
            boxShadow: isHigh ? `0 0 6px ${cfg.color}80` : "none",
          }}
        />
        <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
      <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">{node.label}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-xs font-bold" style={{ color: cfg.color }}>
          {node.impact >= 8 ? "Strong" : node.impact >= 5 ? "Moderate" : "Early"}
        </span>
      </div>
    </motion.div>
  );
}

function FlowArrow({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center justify-center flex-shrink-0 px-1"
    >
      <div className="relative">
        <ArrowRight size={14} className="text-muted-foreground" />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ArrowRight size={14} style={{ color: "hsl(var(--primary))" }} />
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Main ── */
interface StrategicPathwaysProps {
  graph: InsightGraph;
  onSelectNode?: (nodeId: string) => void;
  compact?: boolean;
}

export const StrategicPathways = memo(function StrategicPathways({
  graph, onSelectNode, compact = false,
}: StrategicPathwaysProps) {
  const pathways = useMemo(() => extractPathways(graph), [graph]);

  if (pathways.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl py-8 bg-muted border border-border">
        <p className="text-sm text-foreground">Run the full pipeline to reveal strategic pathways.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(var(--primary) / 0.1)" }}
        >
          <Zap size={14} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">
            Strategic Pathways
          </p>
          <p className="text-xs text-muted-foreground">
            {pathways.length} causal chain{pathways.length !== 1 ? "s" : ""} from constraints to opportunities
          </p>
        </div>
      </div>

      {/* Pathways */}
      {pathways.map((pw, pwIdx) => (
        <motion.div
          key={pw.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: pwIdx * 0.2, duration: 0.5 }}
          className="rounded-xl p-3 space-y-2"
          style={{
            background: "hsl(var(--card))",
            border: pwIdx === 0
              ? "1.5px solid hsl(var(--primary) / 0.3)"
              : "1px solid hsl(var(--border))",
            boxShadow: pwIdx === 0
              ? "0 0 20px hsl(var(--primary) / 0.06)"
              : "none",
          }}
        >
          {/* Pathway label */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-extrabold tabular-nums w-5 h-5 rounded flex items-center justify-center"
                style={{
                  background: pwIdx === 0 ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted))",
                  color: pwIdx === 0 ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                }}
              >
                {pwIdx + 1}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {pwIdx === 0 ? "Primary Pathway" : `Pathway ${pwIdx + 1}`}
              </span>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              {pw.totalInfluence >= 120 ? "High confidence" : pw.totalInfluence >= 60 ? "Moderate confidence" : "Early signal"}
            </span>
          </div>

          {/* Flow chain */}
          <div className="flex items-stretch gap-1 overflow-x-auto">
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectNode?.(pw.constraint.id)}>
              <PathwayNode node={pw.constraint} index={0} />
            </div>

            {pw.leveragePoints.map((lp, i) => (
              <div key={lp.id} className="contents">
                <FlowArrow delay={0.3 + i * 0.15} />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectNode?.(lp.id)}>
                  <PathwayNode node={lp} index={1 + i} />
                </div>
              </div>
            ))}

            {pw.opportunities.map((opp, i) => (
              <div key={opp.id} className="contents">
                <FlowArrow delay={0.5 + i * 0.15} />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectNode?.(opp.id)}>
                  <PathwayNode node={opp} index={3 + i} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
});
