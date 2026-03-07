/**
 * Economic Impact Snapshot — 3 visual gauges
 * Revenue Expansion · Cost Structure · Strategic Moat
 * Designed for instant economic comprehension (5-second scan).
 */

import { memo, useMemo } from "react";
import { TrendingUp, PiggyBank, Shield } from "lucide-react";
import { motion } from "framer-motion";
import type { TransformationPlaybook } from "@/lib/playbookEngine";

interface EconomicImpactSnapshotProps {
  playbook: TransformationPlaybook | null;
  completedSteps: number;
}

function levelFromScore(score: number): { label: string; color: string; bgColor: string; pct: number } {
  if (score >= 7) return { label: "High", color: "hsl(var(--success))", bgColor: "hsl(var(--success) / 0.1)", pct: Math.min(score * 10, 95) };
  if (score >= 4) return { label: "Medium", color: "hsl(var(--warning))", bgColor: "hsl(var(--warning) / 0.1)", pct: score * 10 };
  if (score >= 1) return { label: "Low", color: "hsl(var(--muted-foreground))", bgColor: "hsl(var(--muted) / 0.5)", pct: Math.max(score * 10, 15) };
  return { label: "TBD", color: "hsl(var(--muted-foreground))", bgColor: "hsl(var(--muted) / 0.3)", pct: 10 };
}

const GAUGES = [
  { key: "revenue", label: "Revenue Expansion", Icon: TrendingUp, field: "revenueExpansion" as const },
  { key: "cost", label: "Cost Structure", Icon: PiggyBank, field: "marginImprovement" as const },
  { key: "moat", label: "Strategic Moat", Icon: Shield, field: "capitalEfficiency" as const },
] as const;

export const EconomicImpactSnapshot = memo(function EconomicImpactSnapshot({
  playbook,
  completedSteps,
}: EconomicImpactSnapshotProps) {
  const gauges = useMemo(() => {
    if (!playbook) {
      return GAUGES.map(g => ({ ...g, level: levelFromScore(0) }));
    }
    return GAUGES.map(g => ({
      ...g,
      level: levelFromScore(playbook.impact[g.field]),
    }));
  }, [playbook]);

  const hasData = !!playbook;

  return (
    <div className="grid grid-cols-3 gap-3">
      {gauges.map((gauge, idx) => {
        const { level } = gauge;
        return (
          <motion.div
            key={gauge.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            className="rounded-xl p-4"
            style={{ background: level.bgColor, border: `1px solid ${level.color}20` }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <gauge.Icon size={13} style={{ color: level.color }} />
              <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: level.color }}>
                {gauge.label}
              </span>
            </div>

            {/* Visual bar */}
            <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "hsl(var(--muted) / 0.3)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: level.color }}
                initial={{ width: 0 }}
                animate={{ width: `${level.pct}%` }}
                transition={{ duration: 0.8, delay: 0.2 + idx * 0.1, ease: "easeOut" }}
              />
            </div>

            <p className="text-lg font-black text-foreground">{level.label}</p>
            {!hasData && completedSteps === 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">Run analysis to estimate</p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
});
