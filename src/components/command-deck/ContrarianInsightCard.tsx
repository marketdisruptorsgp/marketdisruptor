/**
 * ContrarianInsightCard — The "aha moment" surface.
 *
 * Shows EITHER:
 *   1. AI-derived thesis (when available) — high fidelity
 *   2. Instant heuristic contrarian pair (within 5 seconds) — deterministic fallback
 *
 * Both use the same visual layout: "Everyone Assumes → Evidence Suggests → So What"
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Clock } from "lucide-react";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import type { InstantContrarianPair } from "@/lib/instantInsights";
import { enforceWordLimit, scrubBannedWords } from "@/lib/humanize";

interface ContrarianInsightCardProps {
  thesis: DeepenedOpportunity | null;
  modeAccent: string;
  entityName?: string;
  /** Instant heuristic fallback — shows within 5s, before AI arrives */
  instantPair?: InstantContrarianPair | null;
  /** How fast the instant insight was computed (ms) */
  computeTimeMs?: number;
}

export const ContrarianInsightCard = memo(function ContrarianInsightCard({
  thesis,
  modeAccent,
  entityName,
  instantPair,
  computeTimeMs,
}: ContrarianInsightCardProps) {
  const bet = thesis?.strategicBet;

  // AI-derived data (highest priority)
  const aiAssumes = useMemo(
    () => bet?.industryAssumption ? enforceWordLimit(bet.industryAssumption, 20) : null,
    [bet?.industryAssumption],
  );
  const aiEvidence = useMemo(
    () => bet?.contrarianBelief ? enforceWordLimit(bet.contrarianBelief, 20) : null,
    [bet?.contrarianBelief],
  );
  const aiSoWhat = useMemo(() => {
    const name = entityName || "This business";
    const implication = bet?.implication || thesis?.economicMechanism?.valueCreation || "";
    if (!implication) return enforceWordLimit(`${name} can move on this before competitors do`, 15);
    return enforceWordLimit(`${name} ${scrubBannedWords(implication).toLowerCase()}`, 15);
  }, [entityName, bet?.implication, thesis?.economicMechanism?.valueCreation]);

  // Choose source: AI thesis > instant heuristic
  const hasAI = !!aiAssumes && !!aiEvidence;
  const everyoneAssumes = hasAI ? aiAssumes : instantPair?.everyoneAssumes || null;
  const evidenceSuggests = hasAI ? aiEvidence : instantPair?.evidenceSuggests || null;
  const soWhat = hasAI ? aiSoWhat : instantPair?.soWhat || null;
  const isInstant = !hasAI && !!instantPair;

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
      <div className="px-4 py-3 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={13} style={{ color: modeAccent }} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              The Core Insight
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isInstant && computeTimeMs != null && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/60">
                <Clock size={9} />
                {computeTimeMs < 1000 ? `${computeTimeMs}ms` : `${(computeTimeMs / 1000).toFixed(1)}s`}
              </span>
            )}
            {isInstant && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary animate-pulse">
                Refining…
              </span>
            )}
          </div>
        </div>

        {/* Industry assumption → contrarian belief flow */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div
            className="flex-1 rounded-lg px-3 py-2"
            style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.12)" }}
          >
            <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--destructive))" }}>
              Everyone Assumes
            </p>
            <p className="text-xs text-foreground/80 leading-snug">
              "{everyoneAssumes}"
            </p>
          </div>

          <div className="flex items-center justify-center sm:py-0 py-1">
            <ArrowRight size={16} className="text-muted-foreground rotate-90 sm:rotate-0" />
          </div>

          <div
            className="flex-1 rounded-lg px-3 py-2"
            style={{ background: `${modeAccent}08`, border: `1px solid ${modeAccent}18` }}
          >
            <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1" style={{ color: modeAccent }}>
              The Evidence Suggests
            </p>
            <p className="text-xs text-foreground font-semibold leading-snug">
              "{evidenceSuggests}"
            </p>
          </div>
        </div>

        {soWhat && (
          <p className="text-xs text-foreground/70 leading-snug pt-1 border-t border-border/50">
            <span className="font-semibold">{soWhat}</span>
          </p>
        )}
      </div>
    </motion.div>
  );
});
