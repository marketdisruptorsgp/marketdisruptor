/**
 * ContrarianInsightCard — The "aha moment" surface.
 *
 * Displays the assumption banner with strict word limits:
 *   - everyone_assumes: max 20 words
 *   - evidence_suggests: max 20 words
 *   - so_what: max 15 words, starts with entity name
 *
 * Returns null if data can't fill the fields specifically enough.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import { enforceWordLimit, scrubBannedWords } from "@/lib/humanize";

interface ContrarianInsightCardProps {
  thesis: DeepenedOpportunity | null;
  modeAccent: string;
  entityName?: string;
}

export const ContrarianInsightCard = memo(function ContrarianInsightCard({
  thesis,
  modeAccent,
  entityName,
}: ContrarianInsightCardProps) {
  const bet = thesis?.strategicBet;
  if (!bet?.contrarianBelief || !bet?.industryAssumption) return null;

  const everyoneAssumes = useMemo(
    () => enforceWordLimit(bet.industryAssumption, 20),
    [bet.industryAssumption],
  );
  const evidenceSuggests = useMemo(
    () => enforceWordLimit(bet.contrarianBelief, 20),
    [bet.contrarianBelief],
  );
  const soWhat = useMemo(() => {
    const name = entityName || "This business";
    const implication = bet.implication || thesis?.economicMechanism?.valueCreation || "";
    if (!implication) return enforceWordLimit(`${name} can move on this before competitors do`, 15);
    return enforceWordLimit(`${name} ${scrubBannedWords(implication).toLowerCase()}`, 15);
  }, [entityName, bet.implication, thesis?.economicMechanism?.valueCreation]);

  if (!everyoneAssumes || !evidenceSuggests) return null;

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
      <div className="px-5 py-4 space-y-3">
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
              "{everyoneAssumes}"
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
              "{evidenceSuggests}"
            </p>
          </div>
        </div>

        {/* So What */}
        {soWhat && (
          <div className="pt-1 border-t border-border/50">
            <p className="text-sm text-foreground leading-snug">
              <span className="font-bold">{soWhat}</span>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
});
