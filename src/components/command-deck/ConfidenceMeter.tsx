/**
 * Confidence Meter — Strategic confidence tied to evidence depth.
 *
 * Now explains WHAT drives confidence and what's missing.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowUpRight } from "lucide-react";

interface ConfidenceMeterProps {
  completedSteps: number;
  totalSteps: number;
  evidenceCount: number;
  confidence: number;
  isComputing?: boolean;
  /** Categories with strong evidence */
  strongCategories?: string[];
  /** Categories needing more data */
  weakCategories?: string[];
}

function getConfidenceLevel(c: number) {
  if (c >= 0.7) return { label: "High", color: "hsl(var(--success))", bgColor: "hsl(var(--success) / 0.08)" };
  if (c >= 0.5) return { label: "Growing", color: "hsl(var(--primary))", bgColor: "hsl(var(--primary) / 0.06)" };
  if (c >= 0.3) return { label: "Emerging", color: "hsl(var(--warning))", bgColor: "hsl(var(--warning) / 0.08)" };
  if (c >= 0.1) return { label: "Initial", color: "hsl(var(--muted-foreground))", bgColor: "hsl(var(--muted) / 0.5)" };
  return { label: "Minimal", color: "hsl(var(--muted-foreground))", bgColor: "hsl(var(--muted) / 0.5)" };
}

export const ConfidenceMeter = memo(function ConfidenceMeter({
  completedSteps,
  totalSteps,
  evidenceCount,
  confidence,
  isComputing,
  strongCategories = [],
  weakCategories = [],
}: ConfidenceMeterProps) {
  const pct = Math.round(confidence * 100);
  const level = useMemo(() => getConfidenceLevel(confidence), [confidence]);

  // Build explanation string
  const explanation = useMemo(() => {
    const parts: string[] = [];
    if (strongCategories.length > 0) {
      parts.push(`Strong evidence in ${strongCategories.slice(0, 2).join(" and ")}`);
    }
    if (weakCategories.length > 0) {
      parts.push(`weak evidence in ${weakCategories.slice(0, 2).join(" and ")}`);
    }
    if (parts.length === 0) {
      if (completedSteps === 0) return "No pipeline steps completed yet";
      if (evidenceCount < 5) return "Collecting initial signals";
      return `Based on ${evidenceCount} signals across ${completedSteps} analysis steps`;
    }
    return parts.join(" · ");
  }, [strongCategories, weakCategories, completedSteps, evidenceCount]);

  // What would improve confidence
  const improvementHint = useMemo(() => {
    if (completedSteps >= totalSteps && confidence >= 0.7) return null;
    const hints: string[] = [];
    if (completedSteps < totalSteps) {
      const remaining = totalSteps - completedSteps;
      hints.push(`Complete ${remaining} more step${remaining > 1 ? "s" : ""}`);
    }
    if (weakCategories.length > 0) {
      hints.push(`Add ${weakCategories[0]} data`);
    }
    return hints.length > 0 ? hints.join(" · ") : null;
  }, [completedSteps, totalSteps, confidence, weakCategories]);

  return (
    <div
      className="rounded-xl px-4 py-3.5"
      style={{ background: level.bgColor, border: `1px solid ${level.color}15` }}
    >
      <div className="flex items-start gap-4">
        {/* Score */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Shield size={14} style={{ color: level.color }} />
          <div className="flex items-baseline gap-1">
            <motion.span
              key={pct}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-black tabular-nums"
              style={{ color: level.color }}
            >
              {pct}%
            </motion.span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              confidence
            </span>
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 min-w-0">
          {/* Bar */}
          <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: "hsl(var(--muted))" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: level.color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          {/* Explanation */}
          <p className="text-[11px] font-medium text-foreground leading-snug">
            {explanation}
          </p>

          {/* Improvement hint */}
          {improvementHint && (
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight size={10} style={{ color: level.color }} />
              <span className="text-[10px] font-bold" style={{ color: level.color }}>
                Improve confidence → {improvementHint}
              </span>
            </div>
          )}
        </div>

        {/* Steps badge */}
        <div className="flex-shrink-0 text-right">
          <span className="text-[10px] font-bold text-muted-foreground">
            {evidenceCount} signals
          </span>
          <br />
          <span className="text-[10px] font-bold text-muted-foreground">
            {completedSteps}/{totalSteps} steps
          </span>
        </div>
      </div>
    </div>
  );
});
