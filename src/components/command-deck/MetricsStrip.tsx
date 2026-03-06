/**
 * Metrics Strip — Compact 4-metric row
 *
 * Replaces the heavy StrategicSnapshot scorecards with a lightweight
 * horizontal strip that takes less vertical space.
 */

import { memo, useMemo } from "react";
import { Zap, Settings, DollarSign, Layers } from "lucide-react";
import { motion } from "framer-motion";
import type { CommandDeckMetrics, AggregatedOpportunity } from "@/lib/commandDeckMetrics";

interface MetricsStripProps {
  metrics: CommandDeckMetrics;
  opportunities: AggregatedOpportunity[];
  strategicPotential: number;
}

function signalColor(score: number): string {
  if (score >= 7) return "hsl(var(--success))";
  if (score >= 4) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

export const MetricsStrip = memo(function MetricsStrip({
  metrics,
  opportunities,
  strategicPotential,
}: MetricsStripProps) {
  const cards = useMemo(() => {
    const avgOppScore = opportunities.length > 0
      ? opportunities.reduce((s, o) => s + (o.opportunityScore ?? 0), 0) / opportunities.length
      : 0;

    const disruption = Math.min(10, Math.round(((metrics.opportunityScore * 0.6) + (metrics.leverageScore * 0.4)) * 10) / 10);
    const feasibility = Math.min(10, Math.max(0, Math.round((10 - metrics.frictionIndex * 0.7 - metrics.riskScore * 0.3) * 10) / 10));
    const economic = Math.min(10, Math.round(avgOppScore * 10) / 10);

    return [
      { label: "Disruption", score: disruption, icon: Zap },
      { label: "Feasibility", score: feasibility, icon: Settings },
      { label: "Economic", score: economic, icon: DollarSign },
      { label: "Innovation", score: strategicPotential, icon: Layers },
    ];
  }, [metrics, opportunities, strategicPotential]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {cards.map((card, i) => {
        const color = signalColor(card.score);
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}12` }}
            >
              <Icon size={14} style={{ color }} />
            </div>
            <div className="min-w-0">
              <span className="text-xl font-black tabular-nums text-foreground leading-none">
                {card.score.toFixed(1)}
              </span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
