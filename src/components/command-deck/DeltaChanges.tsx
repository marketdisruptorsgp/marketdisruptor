/**
 * Delta Changes — Shows before/after comparison when a scenario is active
 */

import { memo } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

export interface DeltaItem {
  label: string;
  before: string;
  after: string;
  direction: "up" | "down" | "changed";
}

interface DeltaChangesProps {
  deltas: DeltaItem[];
}

export const DeltaChanges = memo(function DeltaChanges({ deltas }: DeltaChangesProps) {
  if (deltas.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--primary) / 0.2)" }}
    >
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <ArrowRight size={13} style={{ color: "hsl(var(--primary))" }} />
        <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          What Changed
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">
          Scenario vs. Baseline
        </span>
      </div>

      <div className="px-5 pb-4">
        <div className="space-y-2">
          {deltas.map((delta, idx) => {
            const DirIcon = delta.direction === "up" ? TrendingUp
              : delta.direction === "down" ? TrendingDown
              : Minus;
            const dirColor = delta.direction === "up" ? "hsl(var(--success))"
              : delta.direction === "down" ? "hsl(var(--destructive))"
              : "hsl(var(--warning))";

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: "hsl(var(--muted) / 0.3)" }}
              >
                <DirIcon size={14} style={{ color: dirColor }} className="flex-shrink-0" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground w-24 flex-shrink-0">
                  {delta.label}
                </span>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[11px] font-semibold text-muted-foreground line-through truncate max-w-[40%]">
                    {delta.before}
                  </span>
                  <ArrowRight size={10} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] font-bold text-foreground truncate max-w-[40%]">
                    {delta.after}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});
