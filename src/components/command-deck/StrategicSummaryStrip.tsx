/**
 * Strategic Summary Strip — Command Deck Module 1
 *
 * Displays: Market Attractiveness, Strategic Complexity,
 * Opportunity Density, Execution Risk, Recommended Direction.
 * Visual score bars + trend arrows + confidence indicators.
 */

import { memo, useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Target, Layers, Sparkles, ShieldAlert, Compass } from "lucide-react";
import { motion } from "framer-motion";
import type { CommandDeckMetrics } from "@/lib/commandDeckMetrics";
import type { AggregatedOpportunity } from "@/lib/commandDeckMetrics";

interface StrategicSummaryStripProps {
  metrics: CommandDeckMetrics;
  opportunities: AggregatedOpportunity[];
  strategicPotential: number;
  modeAccent: string;
}

interface ScoreGauge {
  label: string;
  value: number;
  max: number;
  icon: React.ElementType;
  color: string;
  trend: "up" | "down" | "neutral";
  confidence: "high" | "medium" | "low";
  description: string;
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 rounded-full overflow-hidden bg-muted w-full">
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ background: color }}
      />
    </div>
  );
}

function TrendArrow({ trend }: { trend: "up" | "down" | "neutral" }) {
  const config = {
    up: { Icon: TrendingUp, color: "hsl(var(--success))" },
    down: { Icon: TrendingDown, color: "hsl(var(--destructive))" },
    neutral: { Icon: Minus, color: "hsl(var(--muted-foreground))" },
  };
  const { Icon, color } = config[trend];
  return <Icon size={12} style={{ color }} />;
}

function ConfidenceDot({ level }: { level: "high" | "medium" | "low" }) {
  const color = level === "high" ? "hsl(var(--success))" : level === "medium" ? "hsl(var(--warning))" : "hsl(var(--destructive))";
  return (
    <span className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
        {level}
      </span>
    </span>
  );
}

export const StrategicSummaryStrip = memo(function StrategicSummaryStrip({
  metrics,
  opportunities,
  strategicPotential,
  modeAccent,
}: StrategicSummaryStripProps) {
  const gauges: ScoreGauge[] = useMemo(() => {
    // Market Attractiveness: derived from opportunity density and leverage signals
    const marketAttractiveness = Math.min(10, Math.round(
      (metrics.opportunityScore * 0.4 + metrics.leverageScore * 0.3 + Math.min(metrics.opportunitiesIdentified / 3, 3) * 0.3) * 10
    ) / 10);

    // Strategic Complexity: constraint density + friction
    const strategicComplexity = Math.min(10, Math.round(
      (metrics.frictionIndex * 0.5 + metrics.constraintsCount * 0.3 + metrics.riskScore * 0.2) * 10
    ) / 10);

    // Opportunity Density: count-weighted by total evidence
    const oppDensity = Math.min(10, Math.round(
      (metrics.opportunitiesIdentified / Math.max(metrics.totalEvidenceCount, 1)) * 50 * 10
    ) / 10);

    // Execution Risk: friction + risk - leverage offset
    const executionRisk = Math.min(10, Math.max(0, Math.round(
      (metrics.riskScore * 0.5 + metrics.frictionIndex * 0.3 - metrics.leverageScore * 0.2) * 10
    ) / 10));

    const highConfCount = opportunities.filter(o => o.confidence === "high").length;
    const totalOpp = opportunities.length;
    const confLevel = totalOpp > 0 ? (highConfCount / totalOpp >= 0.5 ? "high" : highConfCount / totalOpp >= 0.2 ? "medium" : "low") : "low";

    return [
      {
        label: "Market Attractiveness",
        value: marketAttractiveness,
        max: 10,
        icon: Target,
        color: "hsl(var(--success))",
        trend: marketAttractiveness >= 6 ? "up" : marketAttractiveness >= 3 ? "neutral" : "down",
        confidence: confLevel as "high" | "medium" | "low",
        description: "Structural opportunity density in this market",
      },
      {
        label: "Strategic Complexity",
        value: strategicComplexity,
        max: 10,
        icon: Layers,
        color: "hsl(var(--warning))",
        trend: strategicComplexity >= 7 ? "down" : strategicComplexity >= 4 ? "neutral" : "up",
        confidence: metrics.totalEvidenceCount >= 15 ? "high" : metrics.totalEvidenceCount >= 5 ? "medium" : "low",
        description: "Constraint and friction density",
      },
      {
        label: "Opportunity Density",
        value: oppDensity,
        max: 10,
        icon: Sparkles,
        color: "hsl(var(--primary))",
        trend: oppDensity >= 5 ? "up" : oppDensity >= 2 ? "neutral" : "down",
        confidence: totalOpp >= 5 ? "high" : totalOpp >= 2 ? "medium" : "low",
        description: "Actionable opportunities per evidence unit",
      },
      {
        label: "Execution Risk",
        value: executionRisk,
        max: 10,
        icon: ShieldAlert,
        color: "hsl(var(--destructive))",
        trend: executionRisk >= 6 ? "down" : executionRisk >= 3 ? "neutral" : "up",
        confidence: metrics.riskSignals >= 3 ? "high" : metrics.riskSignals >= 1 ? "medium" : "low",
        description: "Structural barriers to execution",
      },
    ];
  }, [metrics, opportunities]);

  // Derive recommended direction
  const direction = useMemo(() => {
    const topOpp = opportunities[0];
    if (!topOpp) return "Complete analysis pipeline to generate strategic direction.";
    if (strategicPotential >= 7) return `Aggressively pursue "${topOpp.label}" — high strategic potential detected.`;
    if (strategicPotential >= 4) return `Focus on "${topOpp.label}" while addressing structural constraints.`;
    return `Validate assumptions around "${topOpp.label}" before committing resources.`;
  }, [opportunities, strategicPotential]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
        boxShadow: "0 4px 24px hsl(var(--primary) / 0.06)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center gap-2.5"
        style={{ background: "hsl(var(--primary) / 0.06)", borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
          <Compass size={14} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
            Strategic Summary
          </p>
          <p className="text-[10px] text-muted-foreground">Real-time strategic intelligence</p>
        </div>
      </div>

      {/* Score Grid */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {gauges.map((g, i) => {
          const GIcon = g.icon;
          return (
            <motion.div
              key={g.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="rounded-xl p-4 space-y-2.5"
              style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <GIcon size={13} style={{ color: g.color }} />
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    {g.label}
                  </span>
                </div>
                <TrendArrow trend={g.trend} />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-extrabold tabular-nums text-foreground leading-none">
                  {g.value.toFixed(1)}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground mb-0.5">/ {g.max}</span>
              </div>
              <ScoreBar value={g.value} max={g.max} color={g.color} />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground leading-snug">{g.description}</p>
                <ConfidenceDot level={g.confidence} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recommended Direction */}
      <div className="px-5 pb-5">
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-3"
          style={{ background: `${modeAccent}08`, border: `1px solid ${modeAccent}18` }}
        >
          <Compass size={14} style={{ color: modeAccent }} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1" style={{ color: modeAccent }}>
              Recommended Direction
            </p>
            <p className="text-sm font-semibold text-foreground leading-relaxed">{direction}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
