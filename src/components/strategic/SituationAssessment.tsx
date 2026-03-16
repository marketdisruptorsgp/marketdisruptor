/**
 * SituationAssessment — Zone 1: Strategic Reality (What Is)
 *
 * Executive-level display of the binding constraint and market position.
 * No technical language — strategic advisor voice only.
 */

import { motion } from "framer-motion";
import { humanizeLabel } from "@/lib/humanize";

interface SituationAssessmentProps {
  constraint: string | null;
  verdict: string | null;
  verdictRationale: string | null;
  marketPosition: string | null;
  modeAccent: string;
  isComputing: boolean;
}

export function SituationAssessment({
  constraint,
  verdict,
  verdictRationale,
  marketPosition,
  modeAccent,
  isComputing,
}: SituationAssessmentProps) {
  const isReady = !!(constraint || verdict);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <div
        className="rounded-2xl px-6 py-5 space-y-4"
        style={{
          background: "hsl(var(--card))",
          border: `1.5px solid ${modeAccent}25`,
        }}
      >
        {/* Zone label */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Strategic Reality
          </span>
          {isComputing && isReady && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: modeAccent }}
              />
              <span className="text-[10px] font-bold" style={{ color: modeAccent }}>
                Refining…
              </span>
            </div>
          )}
        </div>

        {!isReady ? (
          <div className="space-y-2">
            <div className="h-4 rounded-lg animate-pulse bg-muted w-3/4" />
            <div className="h-4 rounded-lg animate-pulse bg-muted w-1/2" />
          </div>
        ) : (
          <>
            {/* Binding constraint — business language */}
            {constraint && (
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: "hsl(var(--destructive) / 0.05)",
                  border: "1px solid hsl(var(--destructive) / 0.18)",
                }}
              >
                <p
                  className="text-[9px] font-extrabold uppercase tracking-widest mb-1.5"
                  style={{ color: "hsl(var(--destructive))" }}
                >
                  Binding Constraint
                </p>
                <p className="text-sm font-bold text-foreground leading-snug">
                  {humanizeLabel(constraint)}
                </p>
              </div>
            )}

            {/* Strategic verdict */}
            {verdict && (
              <div className="space-y-1">
                <p className="text-base sm:text-lg font-black text-foreground leading-snug">
                  {humanizeLabel(verdict)}
                </p>
                {verdictRationale && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {verdictRationale}
                  </p>
                )}
              </div>
            )}

            {/* Market position */}
            {marketPosition && (
              <p
                className="text-xs font-semibold leading-relaxed"
                style={{ color: `${modeAccent}cc` }}
              >
                {marketPosition}
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
