/**
 * Hero Score Panel — Command Deck Top Zone
 *
 * Single dominant metric (Strategic Potential) with the top signal banner
 * fused into one high-impact header. Reduces cognitive load by giving
 * users ONE number to orient around.
 */

import { memo, useMemo } from "react";
import { Compass, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { CommandDeckMetrics, AggregatedOpportunity } from "@/lib/commandDeckMetrics";
import type { Insight } from "@/lib/insightLayer";

interface HeroScorePanelProps {
  strategicPotential: number;
  metrics: CommandDeckMetrics;
  opportunities: AggregatedOpportunity[];
  insights: Insight[];
  mode: "product" | "service" | "business";
  analysisName: string;
  completedSteps: number;
  totalSteps: number;
}

function scoreColor(score: number): string {
  if (score >= 7) return "hsl(var(--success))";
  if (score >= 4) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

function scoreLabel(score: number): string {
  if (score >= 8) return "Exceptional potential";
  if (score >= 6) return "Strong potential";
  if (score >= 4) return "Moderate potential";
  if (score >= 2) return "Limited potential";
  return "Needs more data";
}

const MODE_LABELS: Record<string, string> = {
  product: "Product",
  service: "Service",
  business: "Business Model",
};

function deriveTopSignal(
  opportunities: AggregatedOpportunity[],
  insights: Insight[],
  metrics: CommandDeckMetrics,
): { message: string; type: "opportunity" | "risk" | "info" } | null {
  const topOpp = opportunities[0];
  if (topOpp && (topOpp.opportunityScore ?? 0) >= 5) {
    return { message: `Top opportunity: "${topOpp.label}"`, type: "opportunity" };
  }
  if (metrics.frictionIndex >= 6) {
    return { message: `High friction detected — ${metrics.frictionSignals} signals`, type: "risk" };
  }
  if (topOpp) {
    return { message: `Leading signal: "${topOpp.label}"`, type: "info" };
  }
  return null;
}

export const HeroScorePanel = memo(function HeroScorePanel({
  strategicPotential,
  metrics,
  opportunities,
  insights,
  mode,
  analysisName,
  completedSteps,
  totalSteps,
}: HeroScorePanelProps) {
  const color = scoreColor(strategicPotential);
  const label = scoreLabel(strategicPotential);
  const signal = useMemo(() => deriveTopSignal(opportunities, insights, metrics), [opportunities, insights, metrics]);

  const ringSize = 120;
  const r = (ringSize - 10) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(strategicPotential / 10, 1);

  const signalIcon = signal?.type === "risk" ? AlertTriangle
    : signal?.type === "opportunity" ? TrendingUp : Zap;
  const SignalIcon = signalIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
        {/* Score Ring */}
        <div className="relative flex-shrink-0">
          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} className="transform -rotate-90">
            <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={5} />
            <motion.circle
              cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none"
              stroke={color} strokeWidth={5} strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ * (1 - pct) }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black tabular-nums text-foreground leading-none">
              {strategicPotential.toFixed(1)}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground mt-0.5">/10</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
            <Compass size={14} style={{ color }} />
            <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color }}>
              Strategic Potential
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-foreground mb-1 truncate">
            {analysisName}
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            {MODE_LABELS[mode]} analysis · {completedSteps}/{totalSteps} steps · {label}
          </p>

          {/* Top Signal — inline */}
          {signal && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{
                background: signal.type === "risk" ? "hsl(var(--destructive) / 0.08)"
                  : signal.type === "opportunity" ? "hsl(var(--success) / 0.08)"
                  : "hsl(var(--primary) / 0.08)",
                color: signal.type === "risk" ? "hsl(var(--destructive))"
                  : signal.type === "opportunity" ? "hsl(var(--success))"
                  : "hsl(var(--primary))",
              }}
            >
              <SignalIcon size={12} />
              {signal.message}
            </div>
          )}
        </div>

        {/* Mini metrics — right side */}
        <div className="flex sm:flex-col gap-3 flex-shrink-0">
          {[
            { label: "Opportunity", value: metrics.opportunityScore, color: "hsl(var(--success))" },
            { label: "Feasibility", value: Math.max(0, 10 - metrics.frictionIndex * 0.7 - metrics.riskScore * 0.3), color: "hsl(var(--primary))" },
            { label: "Risk", value: metrics.riskScore, color: "hsl(var(--destructive))" },
          ].map(m => (
            <div key={m.label} className="text-center sm:text-right">
              <span className="text-lg font-black tabular-nums text-foreground">{Math.min(10, Math.round(m.value * 10) / 10).toFixed(1)}</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
});
