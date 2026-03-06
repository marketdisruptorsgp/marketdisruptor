/**
 * Zone 1 — Strategic Snapshot
 * 4 mission-control scorecards: Disruption Potential, Execution Feasibility,
 * Economic Upside, Structural Innovation.
 */

import { memo, useMemo } from "react";
import { Zap, Settings, DollarSign, Layers } from "lucide-react";
import { motion } from "framer-motion";
import type { CommandDeckMetrics } from "@/lib/commandDeckMetrics";
import type { AggregatedOpportunity } from "@/lib/commandDeckMetrics";

interface StrategicSnapshotProps {
  metrics: CommandDeckMetrics;
  opportunities: AggregatedOpportunity[];
  strategicPotential: number;
}

interface Scorecard {
  label: string;
  score: number;
  interpretation: string;
  icon: React.ElementType;
  trend: "up" | "flat" | "down";
}

function ScoreRing({ score, color, size = 64 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 10, 1);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={4} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={4} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
}

function signalColor(score: number): string {
  if (score >= 7) return "hsl(var(--success))";
  if (score >= 4) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

const TREND_ARROWS: Record<string, string> = { up: "↑", flat: "→", down: "↓" };
const TREND_COLORS: Record<string, string> = {
  up: "hsl(var(--success))",
  flat: "hsl(var(--warning))",
  down: "hsl(var(--destructive))",
};

export const StrategicSnapshot = memo(function StrategicSnapshot({
  metrics,
  opportunities,
  strategicPotential,
}: StrategicSnapshotProps) {
  const cards: Scorecard[] = useMemo(() => {
    const avgOppScore = opportunities.length > 0
      ? opportunities.reduce((s, o) => s + (o.opportunityScore ?? 0), 0) / opportunities.length
      : 0;

    const disruptionPotential = Math.min(10, Math.round(((metrics.opportunityScore * 0.6) + (metrics.leverageScore * 0.4)) * 10) / 10);
    const executionFeasibility = Math.min(10, Math.max(0, Math.round((10 - metrics.frictionIndex * 0.7 - metrics.riskScore * 0.3) * 10) / 10));
    const economicUpside = Math.min(10, Math.round(avgOppScore * 10) / 10);
    const structuralInnovation = strategicPotential;

    return [
      {
        label: "Market Disruption Potential",
        score: disruptionPotential,
        interpretation: disruptionPotential >= 7 ? "Strong disruption vectors identified"
          : disruptionPotential >= 4 ? "Moderate disruption opportunity exists"
          : "Limited disruption leverage detected",
        icon: Zap,
        trend: disruptionPotential >= 6 ? "up" : disruptionPotential >= 3 ? "flat" : "down",
      },
      {
        label: "Execution Feasibility",
        score: executionFeasibility,
        interpretation: executionFeasibility >= 7 ? "Clear path to execution"
          : executionFeasibility >= 4 ? "Execution complexity is manageable"
          : "High friction limits execution speed",
        icon: Settings,
        trend: executionFeasibility >= 6 ? "up" : executionFeasibility >= 3 ? "flat" : "down",
      },
      {
        label: "Economic Upside",
        score: economicUpside,
        interpretation: economicUpside >= 7 ? "Significant value capture potential"
          : economicUpside >= 4 ? "Moderate economic opportunity"
          : "Economic model needs strengthening",
        icon: DollarSign,
        trend: economicUpside >= 6 ? "up" : economicUpside >= 3 ? "flat" : "down",
      },
      {
        label: "Structural Innovation",
        score: structuralInnovation,
        interpretation: structuralInnovation >= 7 ? "Novel structural advantage detected"
          : structuralInnovation >= 4 ? "Incremental innovation opportunities"
          : "Structural innovation constrained",
        icon: Layers,
        trend: structuralInnovation >= 6 ? "up" : structuralInnovation >= 3 ? "flat" : "down",
      },
    ];
  }, [metrics, opportunities, strategicPotential]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => {
        const color = signalColor(card.score);
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="rounded-2xl p-4 relative overflow-hidden flex flex-col items-center text-center gap-3"
            style={{
              background: "hsl(var(--card))",
              border: `1.5px solid hsl(var(--border))`,
              boxShadow: `0 2px 20px ${color}08`,
            }}
          >
            {/* Ring + Score */}
            <div className="relative">
              <ScoreRing score={card.score} color={color} size={72} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold tabular-nums text-foreground leading-none">
                  {card.score.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Label */}
            <div className="flex items-center gap-1.5">
              <Icon size={13} style={{ color }} />
              <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground leading-tight">
                {card.label}
              </p>
            </div>

            {/* Interpretation */}
            <p className="text-xs text-muted-foreground leading-snug line-clamp-2 min-h-[32px]">
              {card.interpretation}
            </p>

            {/* Trend arrow */}
            <span className="text-xs font-extrabold" style={{ color: TREND_COLORS[card.trend] }}>
              {TREND_ARROWS[card.trend]}
            </span>

            {/* Glow */}
            <div
              className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl pointer-events-none"
              style={{ background: `${color}08` }}
            />
          </motion.div>
        );
      })}
    </div>
  );
});
