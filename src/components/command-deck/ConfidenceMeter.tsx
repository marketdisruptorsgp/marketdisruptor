/**
 * Confidence Meter — Strategic confidence explained in business terms.
 *
 * Shows evidence strength by business domain, not signal counts or pipeline steps.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowUpRight, CheckCircle2, AlertTriangle, CircleDashed } from "lucide-react";

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
  if (c >= 0.1) return { label: "Early", color: "hsl(var(--muted-foreground))", bgColor: "hsl(var(--muted) / 0.5)" };
  return { label: "Preliminary", color: "hsl(var(--muted-foreground))", bgColor: "hsl(var(--muted) / 0.5)" };
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
  const isEarly = confidence < 0.1;

  // Build improvement hint in business terms (not pipeline steps)
  const improvementHint = useMemo(() => {
    if (confidence >= 0.7 && weakCategories.length === 0) return null;
    if (weakCategories.length > 0) {
      const missing = weakCategories.slice(0, 2).join(" or ").toLowerCase();
      return `To strengthen this analysis, add more information about ${missing}.`;
    }
    if (completedSteps < totalSteps) {
      return "Running more analysis steps will surface additional evidence across business domains.";
    }
    return null;
  }, [confidence, weakCategories, completedSteps, totalSteps]);

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
            {isEarly ? (
              <span className="text-sm font-extrabold uppercase tracking-wider" style={{ color: level.color }}>
                Early Analysis
              </span>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 min-w-0">
          {/* Bar */}
          <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "hsl(var(--muted))" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: level.color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          {/* Evidence by business domain */}
          <div className="space-y-1">
            {strongCategories.length > 0 && (
              <div className="flex items-start gap-1.5">
                <CheckCircle2 size={11} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--success))" }} />
                <span className="text-[11px] font-semibold text-foreground leading-snug">
                  Strong evidence in: {strongCategories.slice(0, 3).join(", ")}
                </span>
              </div>
            )}
            {weakCategories.length > 0 && (
              <div className="flex items-start gap-1.5">
                <CircleDashed size={11} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--warning))" }} />
                <span className="text-[11px] font-semibold text-muted-foreground leading-snug">
                  Weak evidence in: {weakCategories.slice(0, 3).join(", ")}
                </span>
              </div>
            )}
            {strongCategories.length === 0 && weakCategories.length === 0 && (
              <div className="flex items-start gap-1.5">
                <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                <span className="text-[11px] font-semibold text-muted-foreground leading-snug">
                  Collecting initial business evidence
                </span>
              </div>
            )}
          </div>

          {/* Improvement hint in business terms */}
          {improvementHint && (
            <div className="flex items-start gap-1.5 mt-1.5">
              <ArrowUpRight size={10} style={{ color: level.color }} className="flex-shrink-0 mt-0.5" />
              <span className="text-[10px] font-medium" style={{ color: level.color }}>
                {improvementHint}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
