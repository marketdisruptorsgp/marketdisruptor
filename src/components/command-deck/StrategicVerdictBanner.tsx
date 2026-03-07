/**
 * Strategic Verdict Banner — The dominant strategic move
 * 
 * Shows: The Move → Why → Why This Matters → Benchmark
 */

import { memo } from "react";
import { Zap, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { motion } from "framer-motion";

interface StrategicVerdictBannerProps {
  verdict: string | null;
  rationale: string | null;
  confidence: number;
  constraintLabel: string | null;
  opportunityLabel: string | null;
  completedSteps: number;
  totalSteps: number;
  whyThisMatters: string | null;
  verdictBenchmark: string | null;
}

function confidenceBadge(c: number): { label: string; bg: string; text: string } {
  if (c >= 0.7) return { label: "High confidence", bg: "hsl(var(--success) / 0.12)", text: "hsl(var(--success))" };
  if (c >= 0.4) return { label: "Moderate confidence", bg: "hsl(var(--warning) / 0.12)", text: "hsl(var(--warning))" };
  if (c >= 0.15) return { label: "Hypothesis — needs validation", bg: "hsl(var(--destructive) / 0.1)", text: "hsl(var(--destructive))" };
  return { label: "Insufficient evidence", bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))" };
}

export const StrategicVerdictBanner = memo(function StrategicVerdictBanner(props: StrategicVerdictBannerProps) {
  const { verdict, rationale, confidence, constraintLabel, opportunityLabel, completedSteps, totalSteps, whyThisMatters, verdictBenchmark } = props;

  const badge = confidenceBadge(confidence);
  const hasVerdict = !!verdict || !!constraintLabel;

  const displayVerdict = verdict
    || (constraintLabel ? `Address: ${constraintLabel}` : null)
    || "Analyzing — building initial strategic hypothesis…";

  const displayRationale = rationale
    || (completedSteps > 0 && !hasVerdict
      ? `Initial analysis underway with ${completedSteps}/${totalSteps} evidence sources. The strategic engine is forming a hypothesis as more signals are collected.`
      : !hasVerdict
        ? "The intelligence pipeline is collecting foundational evidence. A strategic hypothesis will form as signals are detected."
        : null);

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
        <p className={`text-lg sm:text-xl font-black leading-tight ${hasVerdict ? 'text-foreground' : 'text-muted-foreground'}`}>
          {displayVerdict}
        </p>
      </div>

      {/* Rationale */}
      {displayRationale && (
        <div className="px-5 pb-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {displayRationale}
          </p>
        </div>
      )}

      {/* Why This Matters */}
      {whyThisMatters && (
        <div className="px-5 pb-3">
          <div
            className="rounded-lg p-3"
            style={{ background: "hsl(var(--primary) / 0.04)", border: "1px solid hsl(var(--primary) / 0.1)" }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Info size={11} style={{ color: "hsl(var(--primary))" }} />
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
                Why This Matters
              </span>
            </div>
            <p className="text-xs font-medium text-foreground leading-relaxed">
              {whyThisMatters}
            </p>
          </div>
        </div>
      )}

      {/* Contextual Benchmark */}
      {verdictBenchmark && (
        <div className="px-5 pb-3">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(var(--muted) / 0.4)" }}>
            <TrendingUp size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[11px] font-semibold text-muted-foreground leading-snug italic">
              {verdictBenchmark}
            </p>
          </div>
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
