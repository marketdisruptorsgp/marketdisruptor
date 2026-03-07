/**
 * Zone 1 — Strategic Snapshot
 * 4 mission-control cards: Disruption Potential, Execution Feasibility,
 * Economic Upside, Structural Innovation.
 * No numeric scores — uses qualitative labels.
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
  qualitative: string;
  interpretation: string;
  icon: React.ElementType;
  color: string;
}

function signalColor(score: number): string {
  if (score >= 7) return "hsl(var(--success))";
  if (score >= 4) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

function qualLabel(score: number): string {
  if (score >= 7) return "Strong";
  if (score >= 4) return "Moderate";
  return "Limited";
}

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
        label: "Disruption Potential",
        score: disruptionPotential,
        qualitative: qualLabel(disruptionPotential),
        interpretation: disruptionPotential >= 7 ? "Strong disruption vectors identified"
          : disruptionPotential >= 4 ? "Moderate disruption opportunity exists"
          : "Limited disruption leverage detected",
        icon: Zap,
        color: signalColor(disruptionPotential),
      },
      {
        label: "Execution Feasibility",
        score: executionFeasibility,
        qualitative: qualLabel(executionFeasibility),
        interpretation: executionFeasibility >= 7 ? "Clear path to execution"
          : executionFeasibility >= 4 ? "Execution complexity is manageable"
          : "High friction limits execution speed",
        icon: Settings,
        color: signalColor(executionFeasibility),
      },
      {
        label: "Economic Upside",
        score: economicUpside,
        qualitative: qualLabel(economicUpside),
        interpretation: economicUpside >= 7 ? "Significant value capture potential"
          : economicUpside >= 4 ? "Moderate economic opportunity"
          : "Economic model needs strengthening",
        icon: DollarSign,
        color: signalColor(economicUpside),
      },
      {
        label: "Innovation",
        score: structuralInnovation,
        qualitative: qualLabel(structuralInnovation),
        interpretation: structuralInnovation >= 7 ? "Novel structural advantage detected"
          : structuralInnovation >= 4 ? "Incremental innovation opportunities"
          : "Structural innovation constrained",
        icon: Layers,
        color: signalColor(structuralInnovation),
      },
    ];
  }, [metrics, opportunities, strategicPotential]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const pct = Math.min(card.score / 10, 1);
        const r = 28;
        const circ = 2 * Math.PI * r;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="rounded-2xl p-4 relative overflow-hidden flex flex-col items-center text-center gap-3"
            style={{
              background: "hsl(var(--card))",
              border: "1.5px solid hsl(var(--border))",
            }}
          >
            {/* Ring */}
            <div className="relative">
              <svg width={64} height={64} viewBox="0 0 64 64" className="transform -rotate-90">
                <circle cx={32} cy={32} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={4} />
                <motion.circle
                  cx={32} cy={32} r={r} fill="none"
                  stroke={card.color} strokeWidth={4} strokeLinecap="round"
                  strokeDasharray={circ}
                  initial={{ strokeDashoffset: circ }}
                  animate={{ strokeDashoffset: circ * (1 - pct) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Icon size={16} style={{ color: card.color }} />
              </div>
            </div>

            {/* Qualitative Label */}
            <div>
              <p className="text-lg font-extrabold text-foreground leading-none">
                {card.qualitative}
              </p>
            </div>

            {/* Label */}
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground leading-tight">
              {card.label}
            </p>

            {/* Interpretation */}
            <p className="text-xs text-muted-foreground leading-snug line-clamp-2 min-h-[32px]">
              {card.interpretation}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
});
