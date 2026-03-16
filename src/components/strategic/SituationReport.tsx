/**
 * SituationReport — Zone 1: What We Found (Strategic Reality)
 *
 * Executive-level display of the binding constraint and strategic verdict.
 * Uses business language translation everywhere — no technical labels visible.
 *
 * Design: Clean card, dominant typography, slightly muted tone.
 */

import { motion } from "framer-motion";
import { translateConstraintToBusinessLanguage } from "@/lib/businessLanguage";
import { humanizeLabel } from "@/lib/humanize";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";

interface SituationReportProps {
  narrative: StrategicNarrative | null;
  thesis: DeepenedOpportunity | null;
  modeAccent: string;
}

export function SituationReport({ narrative, thesis, modeAccent }: SituationReportProps) {
  const rawConstraint =
    narrative?.primaryConstraint ?? thesis?.causalChain?.constraint ?? null;
  const constraint = rawConstraint
    ? translateConstraintToBusinessLanguage(rawConstraint, rawConstraint)
    : null;

  const verdict =
    narrative?.strategicVerdict ?? thesis?.reconfigurationLabel ?? null;
  const rationale =
    narrative?.verdictRationale ?? thesis?.causalChain?.reasoning ?? null;

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
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Strategic Reality
        </span>

        {!isReady ? (
          <div className="space-y-2">
            <div className="h-4 rounded-lg animate-pulse bg-muted w-3/4" />
            <div className="h-4 rounded-lg animate-pulse bg-muted w-1/2" />
          </div>
        ) : (
          <>
            {/* Binding constraint — always in plain business English */}
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
                  The #1 thing holding this business back
                </p>
                <p className="text-sm font-bold text-foreground leading-snug">
                  {constraint}
                </p>
              </div>
            )}

            {/* Strategic verdict */}
            {verdict && (
              <div className="space-y-1">
                <p className="text-xl font-black text-foreground leading-snug">
                  {humanizeLabel(verdict)}
                </p>
                {rationale && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {rationale}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
