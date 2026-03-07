/**
 * Confidence Meter — Shows progressive confidence tied to evidence depth.
 * Grows visually as more pipeline steps complete and evidence accumulates.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, TrendingUp } from "lucide-react";

interface ConfidenceMeterProps {
  completedSteps: number;
  totalSteps: number;
  evidenceCount: number;
  confidence: number; // 0-1
  isComputing?: boolean;
}

function getConfidenceLevel(c: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (c >= 0.7) return { label: "High", color: "hsl(var(--success))", bgColor: "hsl(var(--success) / 0.1)" };
  if (c >= 0.5) return { label: "Growing", color: "hsl(var(--primary))", bgColor: "hsl(var(--primary) / 0.1)" };
  if (c >= 0.3) return { label: "Emerging", color: "hsl(var(--warning))", bgColor: "hsl(var(--warning) / 0.1)" };
  if (c >= 0.1) return { label: "Initial", color: "hsl(var(--muted-foreground))", bgColor: "hsl(var(--muted))" };
  return { label: "Minimal", color: "hsl(var(--muted-foreground))", bgColor: "hsl(var(--muted))" };
}

export const ConfidenceMeter = memo(function ConfidenceMeter({
  completedSteps,
  totalSteps,
  evidenceCount,
  confidence,
  isComputing,
}: ConfidenceMeterProps) {
  const pct = Math.round(confidence * 100);
  const level = useMemo(() => getConfidenceLevel(confidence), [confidence]);

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-4"
      style={{ background: level.bgColor, border: `1px solid ${level.color}20` }}
    >
      {/* Confidence percentage */}
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

      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: level.color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] font-bold" style={{ color: level.color }}>
            {level.label}
            {isComputing && " · Updating…"}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground">
            {evidenceCount} signals · {completedSteps}/{totalSteps} steps
          </span>
        </div>
      </div>

      {/* Growth hint */}
      {completedSteps < totalSteps && (
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-muted-foreground flex-shrink-0">
          <TrendingUp size={10} />
          <span>Run more steps to increase</span>
        </div>
      )}
    </div>
  );
});
