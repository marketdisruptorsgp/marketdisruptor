/**
 * Zone 4 — Strategic Leverage Signals
 * Top 3–5 highest-impact insight cards with expand-for-reasoning.
 */

import { memo, useMemo, useState } from "react";
import { Zap, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Insight } from "@/lib/insightLayer";

interface StrategicLeverageSignalsProps {
  insights: Insight[];
  onViewGraph?: () => void;
  /** Labels already surfaced in Verdict/Trapped/Kill cards — exclude from this list */
  excludeLabels?: string[];
}

const TYPE_ICONS: Record<string, string> = {
  constraint_cluster: "🔴",
  emerging_opportunity: "🟢",
  structural_insight: "🔵",
  strategic_pathway: "⚡",
  pattern: "🟣",
  assumption_cluster: "🟡",
  reasoning_chain: "🧠",
  tool_recommendation: "🔧",
};

const DIRECTION_MAP: Record<string, string> = {
  constraint_cluster: "Resolve this constraint to unlock adjacent opportunities",
  emerging_opportunity: "Explore this opportunity through simulation or first principles",
  structural_insight: "Leverage this structural advantage in your strategic model",
  strategic_pathway: "This pathway connects multiple leverage points",
  pattern: "Recurring pattern that signals a deeper structural dynamic",
  assumption_cluster: "Test these assumptions to validate the strategy",
  reasoning_chain: "Follow this reasoning chain to its strategic conclusion",
  tool_recommendation: "Use the recommended tool to deepen this analysis",
};

export const StrategicLeverageSignals = memo(function StrategicLeverageSignals({
  insights,
  onViewGraph,
}: StrategicLeverageSignalsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const topInsights = useMemo(() =>
    [...insights]
      .filter(i => (i.impact ?? 0) >= 4)
      .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
      .slice(0, 5),
    [insights]
  );

  if (topInsights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--warning) / 0.12)" }}>
            <Zap size={13} style={{ color: "hsl(var(--warning))" }} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Strategic Leverage Signals</p>
            <p className="text-[10px] text-muted-foreground">Top {topInsights.length} actionable insights</p>
          </div>
        </div>
        {onViewGraph && (
          <button onClick={onViewGraph}
            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
            style={{ color: "hsl(var(--primary))" }}>
            <ExternalLink size={10} /> Graph
          </button>
        )}
      </div>

      <div className="p-4 space-y-2">
        {topInsights.map((insight, i) => {
          const isExpanded = expandedId === insight.id;
          const scoreColor = (insight.impact ?? 0) >= 8 ? "hsl(var(--success))"
            : (insight.impact ?? 0) >= 5 ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))";
          const icon = TYPE_ICONS[insight.insightType] || "💡";
          const direction = DIRECTION_MAP[insight.insightType] || "Explore this signal further";

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl overflow-hidden"
              style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors min-h-[56px]"
              >
                <span className="text-lg flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-snug truncate">{insight.label}</p>
                  {!isExpanded && insight.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{insight.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-sm font-extrabold tabular-nums" style={{ color: scoreColor }}>{insight.impact ?? 0}</p>
                    <p className="text-[7px] font-bold uppercase text-muted-foreground">Impact</p>
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      {insight.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                      )}
                      <div className="rounded-lg px-3 py-2" style={{ background: "hsl(var(--warning) / 0.06)", border: "1px solid hsl(var(--warning) / 0.15)" }}>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--warning))" }}>
                          Suggested Direction
                        </p>
                        <p className="text-xs text-foreground leading-snug">{direction}</p>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>{insight.evidenceIds.length} evidence signals</span>
                        <span>·</span>
                        <span className="capitalize">{insight.insightType.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
});
