/**
 * ContrarianInsightCard — The "aha moment" surface.
 *
 * Prominently displays the primary thesis's contrarian belief
 * vs. industry assumption, creating the key insight that
 * distinguishes this analysis from generic consulting output.
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import { trimAt } from "@/lib/humanize";

interface ContrarianInsightCardProps {
  thesis: DeepenedOpportunity | null;
  modeAccent: string;
}

export const ContrarianInsightCard = memo(function ContrarianInsightCard({
  thesis,
  modeAccent,
}: ContrarianInsightCardProps) {
  const bet = thesis?.strategicBet;
  if (!bet?.contrarianBelief || !bet?.industryAssumption) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: `1.5px solid ${modeAccent}30`,
      }}
    >
      <div className="px-5 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Zap size={13} style={{ color: modeAccent }} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            The Core Insight
          </span>
        </div>

        {/* Industry assumption → contrarian belief flow */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Industry assumes */}
          <div
            className="flex-1 rounded-lg px-4 py-3"
            style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.12)" }}
          >
            <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: "hsl(var(--destructive))" }}>
              Everyone Assumes
            </p>
            <p className="text-sm text-foreground/80 leading-snug">
              "{trimAt(bet.industryAssumption, 200)}"
            </p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center sm:py-0 py-1">
            <ArrowRight size={16} className="text-muted-foreground rotate-90 sm:rotate-0" />
          </div>

          {/* Contrarian belief */}
          <div
            className="flex-1 rounded-lg px-4 py-3"
            style={{ background: `${modeAccent}08`, border: `1px solid ${modeAccent}18` }}
          >
            <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: modeAccent }}>
              The Evidence Suggests
            </p>
            <p className="text-sm text-foreground font-semibold leading-snug">
              "{trimAt(bet.contrarianBelief, 200)}"
            </p>
          </div>
        </div>

        {/* Implication */}
        {bet.implication && (
          <div className="pt-1">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
              What This Means
            </p>
            <p className="text-sm text-foreground/80 leading-snug">
              {trimAt(bet.implication, 250)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
});
