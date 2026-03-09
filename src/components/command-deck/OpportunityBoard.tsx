/**
 * Strategic Opportunity Board — Command Deck Module 3
 *
 * Visual cards for top opportunities with strategic bet framing,
 * multi-factor scores, and expandable detail.
 */

import { memo, useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp, BarChart3, FlaskConical, Sparkles, Cpu, ArrowRight, Crosshair } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AggregatedOpportunity } from "@/lib/commandDeckMetrics";
import { humanizeLabel } from "@/lib/humanize";

interface OpportunityBoardProps {
  opportunities: AggregatedOpportunity[];
  onViewInGraph?: (id: string) => void;
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
  const hasStrategicBet = !!opp.strategicBet;

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
        border: hasStrategicBet
          ? "1px solid hsl(var(--primary) / 0.25)"
          : "1px solid hsl(var(--border))",
      }}
    >
      {/* Main card */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 space-y-2.5 transition-colors hover:bg-muted/30"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className="text-xs font-extrabold tabular-nums w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-snug">
                {humanizeLabel(opp.label)}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {opp.source.startsWith("morphological") ? (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                    <Sparkles size={8} /> AI-Enriched
                  </span>
                ) : hasStrategicBet ? (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                    <Crosshair size={8} /> Pattern-guided
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full flex items-center gap-1 bg-muted text-muted-foreground">
                    <Cpu size={8} /> {opp.source}
                  </span>
                )}
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
            {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </div>
        </div>

        {/* Strategic bet preview — visible even when collapsed */}
        {hasStrategicBet && (
          <div
            className="rounded-lg px-3 py-2.5 ml-9"
            style={{ background: "hsl(var(--primary) / 0.04)", border: "1px solid hsl(var(--primary) / 0.1)" }}
          >
            <div className="flex items-start gap-2">
              <ArrowRight size={10} className="text-primary mt-1 flex-shrink-0" />
              <div className="space-y-1 min-w-0">
                <p className="text-xs text-muted-foreground leading-snug">
                  <span className="font-bold text-foreground">Industry assumes</span>{" "}
                  {opp.strategicBet!.assumption}
                </p>
                <p className="text-xs leading-snug">
                  <span className="font-bold" style={{ color: "hsl(var(--primary))" }}>Contrarian view</span>{" "}
                  <span className="text-foreground">{opp.strategicBet!.contrarian}</span>
                </p>
              </div>
            </div>
          </div>
        )}
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
              {/* Implication + first move */}
              {hasStrategicBet && (
                <div className="space-y-2">
                  {opp.strategicBet!.implication && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground whitespace-nowrap mt-0.5">
                        So what
                      </span>
                      <p className="text-xs text-foreground leading-relaxed">
                        {opp.strategicBet!.implication}
                      </p>
                    </div>
                  )}
                  {opp.firstMove && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground whitespace-nowrap mt-0.5">
                        First move
                      </span>
                      <p className="text-xs text-foreground leading-relaxed">
                        {opp.firstMove}
                      </p>
                    </div>
                  )}
                </div>
              )}

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

  const patternCount = opportunities.filter(o => !!o.strategicBet).length;

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
            <p className="text-[10px] text-muted-foreground">
              {patternCount > 0
                ? `${patternCount} pattern-guided · ${opportunities.length - patternCount} structural`
                : "Ranked by multi-factor scoring"}
            </p>
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
