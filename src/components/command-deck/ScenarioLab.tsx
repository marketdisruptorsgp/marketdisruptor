/**
 * Scenario Lab — Multi-scenario comparison panel
 *
 * Shows saved scenarios side by side with key metric differences.
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Trash2, ChevronDown, ChevronUp, Eye } from "lucide-react";
import type { ScenarioSnapshot } from "@/lib/scenarioLabEngine";
import { compareScenarioSnapshots } from "@/lib/scenarioLabEngine";

interface ScenarioLabProps {
  scenarios: ScenarioSnapshot[];
  activeScenarioId: string | null;
  onLoadScenario: (scenario: ScenarioSnapshot) => void;
  onDeleteScenario: (id: string) => void;
}

export const ScenarioLab = memo(function ScenarioLab({
  scenarios,
  activeScenarioId,
  onLoadScenario,
  onDeleteScenario,
}: ScenarioLabProps) {
  const [expanded, setExpanded] = useState(false);

  if (scenarios.length === 0) return null;

  const comparison = compareScenarioSnapshots(scenarios);

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--primary) / 0.1)" }}>
            <FlaskConical size={14} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="text-left">
            <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">
              Scenario Lab
            </span>
            <span className="text-[10px] font-bold text-muted-foreground ml-2">
              {scenarios.length} saved scenario{scenarios.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-3">
              {/* Scenario Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {scenarios.map(s => (
                  <div key={s.id} className="rounded-lg p-3 relative group"
                    style={{
                      background: s.id === activeScenarioId ? "hsl(var(--primary) / 0.06)" : "hsl(var(--muted) / 0.3)",
                      border: s.id === activeScenarioId ? "1.5px solid hsl(var(--primary) / 0.3)" : "1px solid hsl(var(--border))",
                    }}>
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-foreground leading-tight line-clamp-2">{s.name}</span>
                      <button onClick={() => onDeleteScenario(s.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                        <Trash2 size={11} className="text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                    <div className="space-y-0.5 mb-2">
                      <p className="text-[10px] text-muted-foreground truncate">
                        Constraint: <span className="font-bold text-foreground">{s.primaryConstraint || "—"}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Playbook: <span className="font-bold text-foreground">{s.topPlaybookTitle || "—"}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Confidence: <span className="font-bold text-foreground">{Math.round(s.verdictConfidence * 100)}%</span>
                        {" · "}Leverage: <span className="font-bold text-foreground">{s.leverageScore.toFixed(1)}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => onLoadScenario(s)}
                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-all hover:scale-[1.02]"
                      style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
                    >
                      <Eye size={10} /> Load Scenario
                    </button>
                  </div>
                ))}
              </div>

              {/* Comparison Table */}
              {comparison.length > 0 && scenarios.length >= 2 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1.5 pr-3 font-extrabold text-muted-foreground uppercase tracking-wider text-[10px]">Metric</th>
                        {scenarios.map(s => (
                          <th key={s.id} className="text-left py-1.5 px-2 font-bold text-foreground text-[10px] max-w-[120px] truncate">
                            {s.name.slice(0, 30)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.map((row, idx) => (
                        <tr key={idx} className="border-b border-border/50">
                          <td className="py-1.5 pr-3 font-bold text-muted-foreground">{row.metric}</td>
                          {row.values.map((v, vi) => (
                            <td key={vi} className="py-1.5 px-2" style={{
                              color: v.isBest ? "hsl(var(--success))" : undefined,
                              fontWeight: v.isBest ? 700 : 500,
                            }}>
                              <span className="truncate block max-w-[120px]">{v.value}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
