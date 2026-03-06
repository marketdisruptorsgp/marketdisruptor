/**
 * Strategic Signal Banner — Top of Command Deck
 *
 * Displays the single highest-value insight from the analysis.
 * Auto-derives from opportunities, constraints, and insights.
 * Mode-aware labels adapt to Product/Service/Business.
 */

import { memo, useMemo } from "react";
import { Zap, TrendingUp, AlertTriangle, Layers } from "lucide-react";
import { motion } from "framer-motion";
import type { AggregatedOpportunity } from "@/lib/commandDeckMetrics";
import type { Insight } from "@/lib/insightLayer";
import type { CommandDeckMetrics } from "@/lib/commandDeckMetrics";

interface StrategicSignalBannerProps {
  opportunities: AggregatedOpportunity[];
  insights: Insight[];
  metrics: CommandDeckMetrics;
  mode: "product" | "service" | "business";
}

const MODE_LABELS: Record<string, Record<string, string>> = {
  product: { leverage: "feature leverage", opportunity: "product opportunity", constraint: "product constraint" },
  service: { leverage: "delivery leverage", opportunity: "service opportunity", constraint: "service constraint" },
  business: { leverage: "structural leverage", opportunity: "business opportunity", constraint: "model constraint" },
};

function deriveSignal(
  opportunities: AggregatedOpportunity[],
  insights: Insight[],
  metrics: CommandDeckMetrics,
  mode: string,
): { message: string; type: "opportunity" | "risk" | "constraint"; icon: React.ElementType } | null {
  const labels = MODE_LABELS[mode] || MODE_LABELS.product;
  const topOpp = opportunities[0];
  const topInsight = insights.sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))[0];

  // Priority 1: High-score opportunity
  if (topOpp && (topOpp.opportunityScore ?? 0) >= 5) {
    return {
      message: `High ${labels.opportunity} detected: "${topOpp.label}" — Score ${(topOpp.opportunityScore ?? 0).toFixed(1)}/10`,
      type: "opportunity",
      icon: TrendingUp,
    };
  }

  // Priority 2: Structural insight with high impact
  if (topInsight && (topInsight.impact ?? 0) >= 7) {
    const typeMap: Record<string, string> = {
      constraint_cluster: `Structural ${labels.constraint} identified`,
      emerging_opportunity: `Emerging ${labels.opportunity} detected`,
      structural_insight: `${labels.leverage} point discovered`,
      strategic_pathway: "Strategic pathway identified",
    };
    const prefix = typeMap[topInsight.insightType] || "Key signal detected";
    return {
      message: `${prefix}: "${topInsight.label}"`,
      type: topInsight.insightType.includes("constraint") ? "constraint" : "opportunity",
      icon: topInsight.insightType.includes("constraint") ? AlertTriangle : Zap,
    };
  }

  // Priority 3: High friction/risk
  if (metrics.frictionIndex >= 6) {
    return {
      message: `High system friction detected — ${metrics.frictionSignals} friction signals across ${metrics.contributingSources.length} pipeline steps`,
      type: "risk",
      icon: AlertTriangle,
    };
  }

  // Priority 4: General opportunity
  if (topOpp) {
    return {
      message: `Top ${labels.opportunity}: "${topOpp.label}" — Impact ${topOpp.impact}/10`,
      type: "opportunity",
      icon: TrendingUp,
    };
  }

  return null;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; accent: string }> = {
  opportunity: {
    bg: "hsl(var(--success) / 0.06)",
    border: "hsl(var(--success) / 0.2)",
    accent: "hsl(var(--success))",
  },
  risk: {
    bg: "hsl(var(--destructive) / 0.06)",
    border: "hsl(var(--destructive) / 0.2)",
    accent: "hsl(var(--destructive))",
  },
  constraint: {
    bg: "hsl(var(--warning) / 0.06)",
    border: "hsl(var(--warning) / 0.2)",
    accent: "hsl(var(--warning))",
  },
};

export const StrategicSignalBanner = memo(function StrategicSignalBanner({
  opportunities,
  insights,
  metrics,
  mode,
}: StrategicSignalBannerProps) {
  const signal = useMemo(
    () => deriveSignal(opportunities, insights, metrics, mode),
    [opportunities, insights, metrics, mode],
  );

  if (!signal) return null;

  const style = TYPE_STYLES[signal.type];
  const Icon = signal.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{
        background: style.bg,
        border: `1.5px solid ${style.border}`,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${style.accent}15` }}
      >
        <Icon size={15} style={{ color: style.accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-extrabold uppercase tracking-widest mb-0.5" style={{ color: style.accent }}>
          Strategic Signal
        </p>
        <p className="text-sm font-bold text-foreground leading-snug truncate">
          {signal.message}
        </p>
      </div>
      <div className="flex-shrink-0">
        <span
          className="text-[9px] font-extrabold uppercase px-2 py-1 rounded-full"
          style={{ background: `${style.accent}12`, color: style.accent }}
        >
          {signal.type}
        </span>
      </div>
    </motion.div>
  );
});
