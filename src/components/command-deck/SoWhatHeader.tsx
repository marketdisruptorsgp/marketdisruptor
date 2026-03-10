/**
 * SoWhatHeader — Decision-forcing one-liner at the top of Command Deck
 * "If you do nothing → [consequence]. If you act → [outcome]."
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, Zap } from "lucide-react";
import { humanizeLabel, trimAt } from "@/lib/humanize";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";

interface SoWhatHeaderProps {
  narrative: StrategicNarrative | null;
  thesis: DeepenedOpportunity | null;
  modeAccent: string;
}

export const SoWhatHeader = memo(function SoWhatHeader({
  narrative,
  thesis,
  modeAccent,
}: SoWhatHeaderProps) {
  // Build consequence of inaction
  const inactionRisk = narrative?.primaryConstraint
    ? `${humanizeLabel(narrative.primaryConstraint)} will continue eroding your position`
    : narrative?.trappedValue
      ? `Trapped value remains locked`
      : null;

  // Build projected outcome
  const actionOutcome = thesis?.economicMechanism?.valueCreation
    ? trimAt(thesis.economicMechanism.valueCreation, 150)
    : narrative?.breakthroughOpportunity
    ? trimAt(humanizeLabel(narrative.breakthroughOpportunity), 150)
    : null;

  if (!inactionRisk && !actionOutcome) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
      style={{
        background: `linear-gradient(135deg, ${modeAccent}08, ${modeAccent}04)`,
        border: `1.5px solid ${modeAccent}25`,
      }}
    >
      {inactionRisk && (
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <AlertTriangle size={14} className="text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80 leading-snug">
            <span className="font-bold text-destructive">Do nothing:</span>{" "}
            {inactionRisk}
          </p>
        </div>
      )}

      {inactionRisk && actionOutcome && (
        <ArrowRight size={14} className="text-muted-foreground flex-shrink-0 hidden sm:block" />
      )}

      {actionOutcome && (
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Zap size={14} style={{ color: modeAccent }} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80 leading-snug">
            <span className="font-bold" style={{ color: modeAccent }}>Act now:</span>{" "}
            {actionOutcome}
          </p>
        </div>
      )}
    </motion.div>
  );
});
