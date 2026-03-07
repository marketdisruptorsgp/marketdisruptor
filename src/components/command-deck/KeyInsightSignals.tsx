/**
 * Key Insight Signals — Command Deck Module 2
 *
 * Top 5 most impactful insights with title, explanation,
 * impact/confidence scores, and linked evidence count.
 */

import { memo } from "react";
import { Brain, Zap, Link2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Insight } from "@/lib/insightLayer";

interface KeyInsightSignalsProps {
  insights: Insight[];
  onViewGraph?: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  pattern: "hsl(var(--primary))",
  constraint_cluster: "hsl(var(--destructive))",
  assumption_cluster: "hsl(var(--warning))",
  emerging_opportunity: "hsl(var(--success))",
  structural_insight: "hsl(271 81% 55%)",
  strategic_pathway: "hsl(172 66% 50%)",
  reasoning_chain: "hsl(229 89% 63%)",
  tool_recommendation: "hsl(38 92% 50%)",
};

const TYPE_LABELS: Record<string, string> = {
  pattern: "Pattern",
  constraint_cluster: "Constraint",
  assumption_cluster: "Assumption",
  emerging_opportunity: "Opportunity",
  structural_insight: "Structural",
  strategic_pathway: "Pathway",
  reasoning_chain: "Reasoning",
  tool_recommendation: "Tool Rec.",
};

function ImpactBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value >= 8 ? "hsl(var(--success))" : value >= 5 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))";
  const label = value >= 8 ? "Strong" : value >= 5 ? "Moderate" : "Limited";
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          style={{ background: color }}
        />
      </div>
      <span className="text-[11px] font-extrabold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

export const KeyInsightSignals = memo(function KeyInsightSignals({
  insights,
  onViewGraph,
}: KeyInsightSignalsProps) {
  // Sort by impact descending, take top 5
  const top5 = [...insights]
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
    .slice(0, 5);

  if (top5.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(271 81% 55% / 0.12)" }}>
            <Brain size={13} style={{ color: "hsl(271 81% 55%)" }} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Key Insight Signals</p>
            <p className="text-[10px] text-muted-foreground">Top {top5.length} by strategic impact</p>
          </div>
        </div>
        {onViewGraph && (
          <button
            onClick={onViewGraph}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors hover:bg-muted min-h-[32px]"
            style={{ color: "hsl(271 81% 55%)" }}
          >
            View in Graph <ChevronRight size={10} />
          </button>
        )}
      </div>

      {/* Insight Cards */}
      <div className="p-4 space-y-3">
        {top5.map((insight, i) => {
          const typeColor = TYPE_COLORS[insight.insightType] || "hsl(var(--muted-foreground))";
          const typeLabel = TYPE_LABELS[insight.insightType] || insight.insightType;
          const confColor = (insight.confidenceScore ?? 0) >= 0.7
            ? "hsl(var(--success))"
            : (insight.confidenceScore ?? 0) >= 0.4
              ? "hsl(var(--warning))"
              : "hsl(var(--destructive))";
          const confLabel = (insight.confidenceScore ?? 0) >= 0.7 ? "Strong" : (insight.confidenceScore ?? 0) >= 0.4 ? "Moderate" : "Early";

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="rounded-xl p-4 space-y-2.5"
              style={{
                background: "hsl(var(--muted) / 0.4)",
                border: "1px solid hsl(var(--border))",
                borderLeft: `3px solid ${typeColor}`,
              }}
            >
              {/* Type badge + confidence */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: `${typeColor}12`, color: typeColor }}
                  >
                    {typeLabel}
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${confColor}12`, color: confColor }}
                  >
                    {confLabel} Confidence
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Link2 size={9} />
                  <span className="font-bold tabular-nums">{insight.evidenceIds.length}</span>
                </div>
              </div>

              {/* Title */}
              <p className="text-sm font-bold text-foreground leading-snug">{insight.label}</p>

              {/* Description */}
              {insight.description && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{insight.description}</p>
              )}

              {/* Impact bar */}
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Impact</p>
                <ImpactBar value={insight.impact ?? 0} />
              </div>

              {/* Tool recommendations */}
              {insight.recommendedTools && insight.recommendedTools.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <Zap size={10} style={{ color: "hsl(var(--warning))" }} />
                  <span className="text-[9px] font-bold" style={{ color: "hsl(var(--warning))" }}>
                    {insight.recommendedTools.length} tool{insight.recommendedTools.length > 1 ? "s" : ""} recommended
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
});
