/**
 * Strategic Verdict Banner — The dominant strategic move
 * 
 * Replaces analysis-heavy narrative as the headline conclusion.
 * Shows: The Move → Why → Confidence
 */

import { memo } from "react";
import { Zap, AlertTriangle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface StrategicVerdictBannerProps {
  verdict: string | null;
  rationale: string | null;
  confidence: number; // 0-1
  constraintLabel: string | null;
  opportunityLabel: string | null;
  completedSteps: number;
  totalSteps: number;
}

function confidenceBadge(c: number): { label: string; bg: string; text: string } {
  if (c >= 0.7) return { label: "High confidence", bg: "hsl(var(--success) / 0.12)", text: "hsl(var(--success))" };
  if (c >= 0.4) return { label: "Moderate confidence", bg: "hsl(var(--warning) / 0.12)", text: "hsl(var(--warning))" };
  if (c >= 0.15) return { label: "Hypothesis — needs validation", bg: "hsl(var(--destructive) / 0.1)", text: "hsl(var(--destructive))" };
  return { label: "Insufficient evidence", bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))" };
}

export const StrategicVerdictBanner = memo(function StrategicVerdictBanner(props: StrategicVerdictBannerProps) {
  const { verdict, rationale, confidence, constraintLabel, opportunityLabel, completedSteps, totalSteps } = props;

  if (!verdict && !constraintLabel) {
    return (
      <div
        className="rounded-xl p-5"
        style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Zap size={16} className="text-muted-foreground" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Strategic Verdict
          </span>
        </div>
        <p className="text-sm font-semibold text-muted-foreground">
          {completedSteps > 0
            ? `${completedSteps}/${totalSteps} pipeline steps complete. More evidence needed to identify the dominant strategic move.`
            : "Run pipeline steps to collect evidence, then Recompute to generate the strategic verdict."}
        </p>
      </div>
    );
  }

  const badge = confidenceBadge(confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: "hsl(var(--primary))" }} />
          <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            The Move
          </span>
        </div>
        <span
          className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: badge.bg, color: badge.text }}
        >
          {badge.label}
        </span>
      </div>

      {/* Verdict */}
      <div className="px-5 pb-2">
        <p className="text-lg sm:text-xl font-black text-foreground leading-tight">
          {verdict || `Address: ${constraintLabel}`}
        </p>
      </div>

      {/* Rationale */}
      {rationale && (
        <div className="px-5 pb-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {rationale}
          </p>
        </div>
      )}

      {/* Constraint → Opportunity flow */}
      {constraintLabel && opportunityLabel && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: "hsl(var(--destructive) / 0.08)", border: "1px solid hsl(var(--destructive) / 0.15)" }}>
              <AlertTriangle size={11} style={{ color: "hsl(var(--destructive))" }} />
              <span className="text-[11px] font-bold text-foreground">{constraintLabel}</span>
            </div>
            <span className="text-muted-foreground text-xs font-bold">→</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: "hsl(var(--success) / 0.08)", border: "1px solid hsl(var(--success) / 0.15)" }}>
              <TrendingUp size={11} style={{ color: "hsl(var(--success))" }} />
              <span className="text-[11px] font-bold text-foreground">{opportunityLabel}</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});
