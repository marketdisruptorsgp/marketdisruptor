/**
 * Strategic Opportunity Board — Command Deck Module 3
 *
 * Visual cards for top opportunities with multi-factor scores:
 * upside, difficulty, leverage, simulation feasibility.
 * Expandable for deeper detail.
 */

import { memo, useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp, BarChart3, Target, Layers, FlaskConical, Zap, Sparkles, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AggregatedOpportunity } from "@/lib/commandDeckMetrics";

interface OpportunityBoardProps {
  opportunities: AggregatedOpportunity[];
  onViewInGraph?: (id: string) => void;
}

function ScorePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg" style={{ background: `${color}08` }}>
      <span className="text-lg font-extrabold tabular-nums leading-none" style={{ color }}>
        {value.toFixed(1)}
      </span>
      <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

function OpportunityCard({
  opp,
  index,
  onViewInGraph,
}: {
  opp: AggregatedOpportunity;
  index: number;
  onViewInGraph?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor = (opp.opportunityScore ?? 0) >= 6
    ? "hsl(var(--success))"
    : (opp.opportunityScore ?? 0) >= 3
      ? "hsl(var(--warning))"
      : "hsl(var(--muted-foreground))";

  const riskColor = opp.riskLevel === "low"
    ? "hsl(var(--success))"
    : opp.riskLevel === "moderate"
      ? "hsl(var(--warning))"
      : "hsl(var(--destructive))";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--muted) / 0.4)",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {/* Main card */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 space-y-3 transition-colors hover:bg-muted/30"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className="text-xs font-extrabold tabular-nums w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${scoreColor}15`, color: scoreColor }}
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-snug">{opp.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {opp.source}
                </span>
                <span
                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                  style={{ background: `${riskColor}12`, color: riskColor }}
                >
                  {opp.riskLevel || "—"} risk
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xl font-extrabold tabular-nums" style={{ color: scoreColor }}>
              {(opp.opportunityScore ?? 0).toFixed(1)}
            </span>
            {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </div>
        </div>

        {/* Quick score bar */}
        <div className="h-1.5 rounded-full overflow-hidden bg-muted">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(((opp.opportunityScore ?? 0) / 10) * 100, 100)}%` }}
            transition={{ duration: 0.6 }}
            style={{ background: scoreColor }}
          />
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {/* Multi-factor score grid */}
              <div className="grid grid-cols-5 gap-2">
                <ScorePill label="Market" value={opp.marketAttractiveness ?? 0} color="hsl(var(--success))" />
                <ScorePill label="Structure" value={opp.structuralAdvantage ?? 0} color="hsl(var(--primary))" />
                <ScorePill label="Sim. Feas." value={opp.simulationFeasibility ?? 0} color="hsl(172 66% 50%)" />
                <ScorePill label="Leverage" value={opp.strategicLeverage ?? 0} color="hsl(var(--warning))" />
                <ScorePill label="Difficulty" value={opp.executionDifficulty ?? 0} color="hsl(var(--destructive))" />
              </div>

              {/* Meta row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <BarChart3 size={10} /> Impact: <span className="font-bold text-foreground">{opp.impact}/10</span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <FlaskConical size={10} /> Sims: <span className="font-bold text-foreground">{opp.simulationCount ?? 0}</span>
                  </span>
                </div>
                {onViewInGraph && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewInGraph(opp.id); }}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg transition-colors hover:bg-muted"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    View in Graph →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const OpportunityBoard = memo(function OpportunityBoard({
  opportunities,
  onViewInGraph,
}: OpportunityBoardProps) {
  if (opportunities.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--success) / 0.12)" }}>
            <Lightbulb size={13} style={{ color: "hsl(var(--success))" }} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Strategic Opportunity Board</p>
            <p className="text-[10px] text-muted-foreground">Ranked by multi-factor scoring</p>
          </div>
        </div>
        <span className="text-xs font-bold text-muted-foreground">{opportunities.length} opportunities</span>
      </div>

      {/* Cards */}
      <div className="p-4 space-y-3">
        {opportunities.slice(0, 8).map((opp, i) => (
          <OpportunityCard key={opp.id} opp={opp} index={i} onViewInGraph={onViewInGraph} />
        ))}
      </div>
    </motion.div>
  );
});
