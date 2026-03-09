/**
 * Opportunity Radar — Command Deck Section 2
 *
 * Bubble visualization: size=score, color=risk, label=name.
 * Click a bubble to expand detail panel with multi-factor breakdown.
 * Pure CSS/SVG — no charting library required.
 */

import { memo, useState, useMemo, useCallback } from "react";
import { Radar, X, BarChart3, Target, Layers, FlaskConical, Zap, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AggregatedOpportunity } from "@/lib/commandDeckMetrics";

interface OpportunityRadarProps {
  opportunities: AggregatedOpportunity[];
  onViewInGraph?: (id: string) => void;
}

const RISK_COLORS: Record<string, string> = {
  low: "hsl(var(--success))",
  moderate: "hsl(var(--warning))",
  high: "hsl(var(--destructive))",
};

function ScoreRow({ label, value, max = 10, color, icon: Icon }: {
  label: string; value: number; max?: number; color: string; icon: React.ElementType;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={11} style={{ color }} />
          <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
        </div>
        <span className="text-xs font-extrabold" style={{ color }}>{value >= 7 ? "Strong" : value >= 4 ? "Moderate" : "Early"}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-muted">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export const OpportunityRadar = memo(function OpportunityRadar({
  opportunities,
  onViewInGraph,
}: OpportunityRadarProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedOpp = opportunities.find(o => o.id === selectedId) ?? null;

  // Layout: place bubbles in a responsive grid-like pattern
  const bubbles = useMemo(() => {
    const maxScore = Math.max(...opportunities.map(o => o.opportunityScore ?? 1), 1);
    return opportunities.slice(0, 12).map((opp, i) => {
      const score = opp.opportunityScore ?? 0;
      const normalizedSize = Math.max(36, Math.min(80, (score / maxScore) * 80));
      const riskColor = RISK_COLORS[opp.riskLevel || "moderate"];
      // Distribute in a flowing pattern
      const cols = Math.min(opportunities.length, 4);
      const row = Math.floor(i / cols);
      const col = i % cols;
      const xOffset = (col / cols) * 100 + (row % 2 === 1 ? 100 / (cols * 2) : 0);
      return { opp, size: normalizedSize, riskColor, x: xOffset, row, col };
    });
  }, [opportunities]);

  const handleClose = useCallback(() => setSelectedId(null), []);

  if (opportunities.length === 0) return null;

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
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
            <Radar size={13} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Opportunity Radar</p>
            <p className="text-[10px] text-muted-foreground">{opportunities.length} opportunities · Click to inspect</p>
          </div>
        </div>
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3">
          {Object.entries(RISK_COLORS).map(([level, color]) => (
            <span key={level} className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {level}
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* Bubble field */}
        <div className="px-5 py-6 flex flex-wrap items-center justify-center gap-3 min-h-[180px]">
          {bubbles.map(({ opp, size, riskColor }, i) => (
            <motion.button
              key={opp.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 300 }}
              onClick={() => setSelectedId(opp.id === selectedId ? null : opp.id)}
              className="rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative group"
              style={{
                width: size,
                height: size,
                background: `${riskColor}18`,
                border: `2px solid ${riskColor}${selectedId === opp.id ? "80" : "40"}`,
                boxShadow: selectedId === opp.id ? `0 0 20px ${riskColor}30` : "none",
              }}
              title={`${opp.label} — Score: ${(opp.opportunityScore ?? 0).toFixed(1)}`}
            >
              <span
                className="text-[9px] font-extrabold leading-tight text-center px-1 line-clamp-2"
                style={{ color: riskColor }}
              >
                {(opp.opportunityScore ?? 0).toFixed(1)}
              </span>
              {/* Tooltip on hover */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <span className="text-[9px] font-bold bg-foreground text-background px-2 py-1 rounded-md">
                  {opp.label}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedOpp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-foreground leading-snug">{selectedOpp.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {selectedOpp.source}
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${RISK_COLORS[selectedOpp.riskLevel || "moderate"]}12`,
                          color: RISK_COLORS[selectedOpp.riskLevel || "moderate"],
                        }}
                      >
                        {selectedOpp.riskLevel || "moderate"} risk
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>

                {/* Overall score */}
                <div className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: "hsl(var(--muted) / 0.5)" }}>
                  <div>
                    <p className="text-3xl font-extrabold tabular-nums text-foreground leading-none">
                      {(selectedOpp.opportunityScore ?? 0).toFixed(1)}
                    </p>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mt-1">
                      Opportunity Score
                    </p>
                  </div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-muted">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((selectedOpp.opportunityScore ?? 0) / 10) * 100, 100)}%` }}
                      transition={{ duration: 0.6 }}
                      style={{ background: RISK_COLORS[selectedOpp.riskLevel || "moderate"] }}
                    />
                  </div>
                </div>

                {/* Multi-factor breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2.5">
                    <ScoreRow label="Market Attractiveness" value={selectedOpp.marketAttractiveness ?? 0} color="hsl(var(--success))" icon={Target} />
                    <ScoreRow label="Structural Advantage" value={selectedOpp.structuralAdvantage ?? 0} color="hsl(var(--primary))" icon={Layers} />
                    <ScoreRow label="Simulation Feasibility" value={selectedOpp.simulationFeasibility ?? 0} color="hsl(172 66% 50%)" icon={FlaskConical} />
                  </div>
                  <div className="space-y-2.5">
                    <ScoreRow label="Strategic Leverage" value={selectedOpp.strategicLeverage ?? 0} color="hsl(var(--warning))" icon={Zap} />
                    <ScoreRow label="Execution Difficulty" value={selectedOpp.executionDifficulty ?? 0} color="hsl(var(--destructive))" icon={ShieldAlert} />
                    <div className="flex items-center gap-2 pt-1">
                      <BarChart3 size={11} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Impact: <span className="font-bold text-foreground">{selectedOpp.impact}/10</span></span>
                      <span className="text-[10px] text-muted-foreground">· Sims: <span className="font-bold text-foreground">{selectedOpp.simulationCount ?? 0}</span></span>
                    </div>
                  </div>
                </div>

                {onViewInGraph && (
                  <button
                    onClick={() => onViewInGraph(selectedOpp.id)}
                    className="text-xs font-bold px-3 py-2 rounded-lg transition-colors hover:bg-muted w-full text-center"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    View in Insight Graph →
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
