/**
 * Zone 2 — Opportunity Map
 * Impact × Feasibility quadrant matrix with plotted opportunity nodes.
 */

import { memo, useState, useMemo } from "react";
import { Target, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AggregatedOpportunity } from "@/lib/commandDeckMetrics";

interface OpportunityMapProps {
  opportunities: AggregatedOpportunity[];
  onViewInGraph?: (id: string) => void;
}

const QUADRANT_LABELS = [
  { x: 75, y: 25, label: "High Impact\nEasy Execution", color: "hsl(var(--success))" },
  { x: 25, y: 25, label: "High Impact\nHard Execution", color: "hsl(var(--warning))" },
  { x: 75, y: 75, label: "Low Impact\nEasy Execution", color: "hsl(var(--primary))" },
  { x: 25, y: 75, label: "Low Impact\nHard Execution", color: "hsl(var(--muted-foreground))" },
];

const RISK_COLORS: Record<string, string> = {
  low: "hsl(var(--success))",
  moderate: "hsl(var(--warning))",
  high: "hsl(var(--destructive))",
};

export const OpportunityMap = memo(function OpportunityMap({
  opportunities,
  onViewInGraph,
}: OpportunityMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = opportunities.find(o => o.id === selectedId) ?? null;

  const nodes = useMemo(() => {
    return opportunities.slice(0, 12).map(opp => {
      const impact = opp.impact ?? 5;
      const feasibility = 10 - (opp.executionDifficulty ?? 5);
      // Map to percentage positions (with padding)
      const x = 8 + (feasibility / 10) * 84; // left=hard, right=easy
      const y = 8 + ((10 - impact) / 10) * 84; // top=high impact
      const size = Math.max(28, Math.min(52, ((opp.opportunityScore ?? 5) / 10) * 52));
      return { opp, x, y, size };
    });
  }, [opportunities]);

  if (opportunities.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      {/* Header */}
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
          <Target size={13} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Opportunity Map</p>
          <p className="text-[10px] text-muted-foreground">Impact vs Feasibility · {opportunities.length} opportunities</p>
        </div>
      </div>

      <div className="p-4">
        {/* Matrix */}
        <div className="relative w-full aspect-[4/3] max-h-[400px] rounded-xl overflow-hidden"
          style={{ background: "hsl(var(--muted) / 0.3)" }}
        >
          {/* Grid lines */}
          <div className="absolute inset-0">
            <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: "hsl(var(--border))" }} />
            <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: "hsl(var(--border))" }} />
          </div>

          {/* Axis labels */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            ← Impact →
          </div>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">
            ← Hard · Feasibility · Easy →
          </div>

          {/* Quadrant labels */}
          {QUADRANT_LABELS.map((q, i) => (
            <div
              key={i}
              className="absolute text-[8px] font-bold uppercase tracking-wider text-center whitespace-pre-line pointer-events-none"
              style={{ left: `${q.x}%`, top: `${q.y}%`, transform: "translate(-50%, -50%)", color: `${q.color}`, opacity: 0.4 }}
            >
              {q.label}
            </div>
          ))}

          {/* Opportunity nodes */}
          {nodes.map(({ opp, x, y, size }, i) => {
            const riskColor = RISK_COLORS[opp.riskLevel || "moderate"];
            const isSelected = selectedId === opp.id;
            return (
              <motion.button
                key={opp.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 300 }}
                onClick={() => setSelectedId(isSelected ? null : opp.id)}
                className="absolute rounded-full flex items-center justify-center transition-shadow group"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  width: size,
                  height: size,
                  background: `${riskColor}20`,
                  border: `2px solid ${riskColor}${isSelected ? "90" : "50"}`,
                  boxShadow: isSelected ? `0 0 20px ${riskColor}30` : "none",
                  zIndex: isSelected ? 10 : 1,
                }}
                title={opp.label}
              >
                <span className="text-[7px] font-extrabold" style={{ color: riskColor }}>
                  {(opp.opportunityScore ?? 0) >= 7 ? "●" : (opp.opportunityScore ?? 0) >= 4 ? "◐" : "○"}
                </span>
                {/* Hover tooltip */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                  <span className="text-[9px] font-bold bg-foreground text-background px-2 py-1 rounded-md shadow-lg">
                    {opp.label}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-xl p-4 space-y-3" style={{ background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border))" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{selected.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                        style={{ background: `${RISK_COLORS[selected.riskLevel || "moderate"]}15`, color: RISK_COLORS[selected.riskLevel || "moderate"] }}>
                        {selected.riskLevel || "moderate"} risk
                      </span>
                      <span className="text-[10px] text-muted-foreground">{selected.source}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="p-1 rounded-lg hover:bg-muted"><X size={14} className="text-muted-foreground" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Impact", v: selected.impact, q: (selected.impact ?? 0) >= 7 ? "Strong" : (selected.impact ?? 0) >= 4 ? "Moderate" : "Limited" },
                    { l: "Opportunity", v: selected.opportunityScore ?? 0, q: (selected.opportunityScore ?? 0) >= 7 ? "Strong" : (selected.opportunityScore ?? 0) >= 4 ? "Moderate" : "Limited" },
                    { l: "Feasibility", v: 10 - (selected.executionDifficulty ?? 5), q: (10 - (selected.executionDifficulty ?? 5)) >= 7 ? "Easy" : (10 - (selected.executionDifficulty ?? 5)) >= 4 ? "Moderate" : "Hard" },
                  ].map(m => (
                    <div key={m.l} className="text-center p-2 rounded-lg bg-background">
                      <p className="text-sm font-extrabold text-foreground">{m.q}</p>
                      <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{m.l}</p>
                    </div>
                  ))}
                </div>
                {onViewInGraph && (
                  <button onClick={() => onViewInGraph(selected.id)}
                    className="text-xs font-bold w-full text-center py-2 rounded-lg hover:bg-muted transition-colors"
                    style={{ color: "hsl(var(--primary))" }}>
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
