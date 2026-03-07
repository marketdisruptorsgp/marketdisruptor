/**
 * Trapped Value Card — Quantifies locked value with source attribution
 */

import { memo } from "react";
import { Lock, ArrowRight, TrendingUp, BarChart3, Database } from "lucide-react";
import { motion } from "framer-motion";

interface TrappedValueCardProps {
  trappedDescription: string | null;
  unlockDescription: string | null;
  confidence: number;
  evidenceCount: number;
  estimate: string | null;
  benchmark: string | null;
  /** Evidence categories driving this estimate */
  drivers?: string[];
}

export const TrappedValueCard = memo(function TrappedValueCard(props: TrappedValueCardProps) {
  const { trappedDescription, unlockDescription, confidence, evidenceCount, estimate, benchmark, drivers = [] } = props;

  if (!trappedDescription) return null;

  const isQuantified = !/not yet quantified/i.test(trappedDescription) && !/requires deeper/i.test(trappedDescription);

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

      {/* Estimate */}
      {estimate && (
        <div className="px-5 pb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: isQuantified ? "hsl(var(--destructive) / 0.08)" : "hsl(var(--warning) / 0.1)",
              border: isQuantified ? "1px solid hsl(var(--destructive) / 0.15)" : "1px solid hsl(var(--warning) / 0.15)",
            }}>
            <BarChart3 size={11} style={{ color: isQuantified ? "hsl(var(--destructive))" : "hsl(var(--warning))" }} />
            <span className="text-xs font-black"
              style={{ color: isQuantified ? "hsl(var(--destructive))" : "hsl(var(--warning))" }}>
              {estimate}
            </span>
          </div>
        </div>
      )}

      {/* Trapped → Unlocked */}
      <div className="px-5 pb-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 rounded-lg p-3"
            style={{
              background: isQuantified ? "hsl(var(--destructive) / 0.06)" : "hsl(var(--muted) / 0.4)",
              border: isQuantified ? "1px solid hsl(var(--destructive) / 0.12)" : "1px solid hsl(var(--border))",
            }}>
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1"
              style={{ color: isQuantified ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))" }}>
              {isQuantified ? "Currently locked" : "Impact assessment"}
            </p>
            <p className="text-sm font-bold text-foreground leading-snug">{trappedDescription}</p>
          </div>
          <div className="hidden sm:flex items-center">
            <ArrowRight size={16} className="text-muted-foreground" />
          </div>
          {unlockDescription && (
            <div className="flex-1 rounded-lg p-3"
              style={{ background: "hsl(var(--success) / 0.06)", border: "1px solid hsl(var(--success) / 0.12)" }}>
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--success))" }}>
                If resolved
              </p>
              <p className="text-sm font-bold text-foreground leading-snug">{unlockDescription}</p>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Drivers — Source Attribution */}
      {drivers.length > 0 && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Database size={10} className="text-muted-foreground" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Drivers
            </span>
          </div>
          <div className="space-y-1">
            {drivers.map((d, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: "hsl(var(--warning))" }} />
                <span className="text-[11px] font-medium text-foreground leading-snug">{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benchmark */}
      {benchmark && (
        <div className="px-5 pb-4">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(var(--muted) / 0.3)" }}>
            <TrendingUp size={11} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[11px] font-semibold text-muted-foreground leading-snug italic">{benchmark}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
});
