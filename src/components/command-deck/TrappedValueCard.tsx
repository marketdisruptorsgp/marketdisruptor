/**
 * Trapped Value Card — Shows magnitude of value locked in current structure
 * 
 * Makes the economic impact visceral: "X is being left on the table because Y"
 */

import { memo } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface TrappedValueCardProps {
  /** What's being lost/locked — e.g. "Working capital trapped in 210-day cash cycle" */
  trappedDescription: string | null;
  /** What resolving it could unlock — e.g. "Reducing to 60 days could free $X capacity" */
  unlockDescription: string | null;
  /** 0-1 confidence in the economic estimate */
  confidence: number;
  /** Source evidence count */
  evidenceCount: number;
}

export const TrappedValueCard = memo(function TrappedValueCard(props: TrappedValueCardProps) {
  const { trappedDescription, unlockDescription, confidence, evidenceCount } = props;

  if (!trappedDescription) return null;

  const isQuantified = !/not yet quantified/i.test(trappedDescription);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock size={13} style={{ color: "hsl(var(--warning))" }} />
          <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Trapped Value
          </span>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground">
          {evidenceCount} evidence · {Math.round(confidence * 100)}% confidence
        </span>
      </div>

      <div className="px-5 pb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* What's trapped */}
          <div
            className="flex-1 rounded-lg p-3"
            style={{
              background: isQuantified
                ? "hsl(var(--destructive) / 0.06)"
                : "hsl(var(--muted) / 0.4)",
              border: isQuantified
                ? "1px solid hsl(var(--destructive) / 0.12)"
                : "1px solid hsl(var(--border))",
            }}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{
              color: isQuantified ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"
            }}>
              {isQuantified ? "Currently locked" : "Impact not yet quantified"}
            </p>
            <p className="text-sm font-bold text-foreground leading-snug">
              {trappedDescription}
            </p>
          </div>

          {/* Arrow */}
          <div className="hidden sm:flex items-center">
            <ArrowRight size={16} className="text-muted-foreground" />
          </div>

          {/* What it unlocks */}
          {unlockDescription && (
            <div
              className="flex-1 rounded-lg p-3"
              style={{ background: "hsl(var(--success) / 0.06)", border: "1px solid hsl(var(--success) / 0.12)" }}
            >
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--success))" }}>
                If resolved
              </p>
              <p className="text-sm font-bold text-foreground leading-snug">
                {unlockDescription}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
