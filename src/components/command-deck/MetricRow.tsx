/**
 * MetricRow — Tier 1: 4 compact metric cards in a row
 * Glanceable executive snapshot. No deep detail.
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { Target, Shield, BarChart3, Layers } from "lucide-react";

interface MetricRowProps {
  opportunityScore: number;
  riskScore: number;
  confidence: number;
  evidenceCount: number;
  completedSteps: number;
  totalSteps: number;
}

function scoreLabel(value: number): { text: string; color: string } {
  if (value >= 7) return { text: "Strong", color: "hsl(var(--success))" };
  if (value >= 4) return { text: "Moderate", color: "hsl(var(--warning))" };
  if (value > 0) return { text: "Early", color: "hsl(var(--muted-foreground))" };
  return { text: "—", color: "hsl(var(--muted-foreground))" };
}

function confidenceLabel(c: number): { text: string; color: string } {
  if (c >= 0.7) return { text: "Strong Evidence", color: "hsl(var(--success))" };
  if (c >= 0.4) return { text: "Moderate", color: "hsl(var(--warning))" };
  if (c >= 0.15) return { text: "Early Signal", color: "hsl(var(--muted-foreground))" };
  return { text: "Collecting", color: "hsl(var(--muted-foreground))" };
}

const METRICS = [
  {
    key: "opportunity",
    label: "Opportunity",
    icon: Target,
    getValue: (p: MetricRowProps) => scoreLabel(p.opportunityScore),
  },
  {
    key: "risk",
    label: "Risk Level",
    icon: Shield,
    getValue: (p: MetricRowProps) => {
      const s = scoreLabel(p.riskScore);
      // Invert colors for risk (high risk = bad)
      if (p.riskScore >= 7) return { text: "High", color: "hsl(var(--destructive))" };
      if (p.riskScore >= 4) return { text: "Moderate", color: "hsl(var(--warning))" };
      if (p.riskScore > 0) return { text: "Low", color: "hsl(var(--success))" };
      return { text: "—", color: "hsl(var(--muted-foreground))" };
    },
  },
  {
    key: "confidence",
    label: "Confidence",
    icon: BarChart3,
    getValue: (p: MetricRowProps) => confidenceLabel(p.confidence),
  },
  {
    key: "signals",
    label: "Signals",
    icon: Layers,
    getValue: (p: MetricRowProps) => ({
      text: `${p.evidenceCount} from ${p.completedSteps}/${p.totalSteps} steps`,
      color: p.evidenceCount > 10 ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
    }),
  },
] as const;

export const MetricRow = memo(function MetricRow(props: MetricRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {METRICS.map((m, i) => {
        const Icon = m.icon;
        const val = m.getValue(props);
        return (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="rounded-lg border border-border bg-card px-3 py-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={12} className="text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {m.label}
              </span>
            </div>
            <p className="text-sm font-bold" style={{ color: val.color }}>
              {val.text}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
});
