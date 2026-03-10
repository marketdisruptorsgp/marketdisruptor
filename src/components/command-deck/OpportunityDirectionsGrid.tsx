/**
 * OpportunityDirectionsGrid — Displays 3–5 strategic opportunity direction cards.
 * Each card shows: title, summary, strategic precedents, and key metrics.
 * Clean, advisor-grade layout with no developer terminology.
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown, ChevronUp, Building2, TrendingUp } from "lucide-react";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import { humanizeLabel, trimAt } from "@/lib/humanize";
import { StrategicPrecedentSection } from "./StrategicPrecedentSection";
import { SecondOrderEffectsSection } from "./SecondOrderEffectsSection";

interface OpportunityDirectionsGridProps {
  opportunities: DeepenedOpportunity[];
  modeAccent: string;
}

function OpportunityCard({
  opp,
  index,
  modeAccent,
}: {
  opp: DeepenedOpportunity;
  index: number;
  modeAccent: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-muted/30 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: `${modeAccent}12`, border: `1.5px solid ${modeAccent}25` }}
        >
          <span className="text-xs font-black" style={{ color: modeAccent }}>
            {index + 1}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-black text-foreground leading-snug">
            {humanizeLabel(opp.reconfigurationLabel)}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            {trimAt(opp.summary, 160)}
          </p>
        </div>
        <div className="flex-shrink-0 mt-1">
          {expanded ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Quick stats strip */}
      <div
        className="px-5 py-2 flex items-center gap-4 text-xs"
        style={{ borderTop: "1px solid hsl(var(--border))" }}
      >
        {opp.economicMechanism?.valueCreation && (
          <div className="flex items-center gap-1.5">
            <TrendingUp size={11} className="text-muted-foreground" />
            <span className="text-muted-foreground font-semibold truncate max-w-[200px]">
              {trimAt(opp.economicMechanism.valueCreation, 100)}
            </span>
          </div>
        )}
        {opp.feasibility?.level && (
          <span className="text-muted-foreground font-semibold capitalize">
            {opp.feasibility.level.replace("_", " ")} feasibility
          </span>
        )}
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 py-4 space-y-4"
              style={{ borderTop: "1px solid hsl(var(--border))" }}
            >
              {/* Contrarian belief */}
              {opp.strategicBet?.contrarianBelief && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                    Contrarian Belief
                  </p>
                  <p className="text-sm text-foreground font-semibold leading-snug">
                    "{trimAt(opp.strategicBet.contrarianBelief, 200)}"
                  </p>
                  {opp.strategicBet.industryAssumption && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Industry assumes: {opp.strategicBet.industryAssumption}
                    </p>
                  )}
                </div>
              )}

              {/* Economic mechanism */}
              {opp.economicMechanism && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                    How It Creates Value
                  </p>
                  <p className="text-sm text-foreground leading-snug">
                    {opp.economicMechanism.valueCreation}
                  </p>
                  {opp.economicMechanism.defensibility && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Defensibility: {opp.economicMechanism.defensibility}
                    </p>
                  )}
                </div>
              )}

              {/* Strategic Precedent */}
              {opp.strategicPrecedents && opp.strategicPrecedents.length > 0 && (
                <StrategicPrecedentSection precedents={opp.strategicPrecedents} />
              )}

              {/* Second-Order Effects */}
              {opp.secondOrderEffects && opp.secondOrderEffects.length > 0 && (
                <SecondOrderEffectsSection effects={opp.secondOrderEffects} />
              )}

              {/* First move */}
              {opp.firstMove && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                    First Move
                  </p>
                  <p className="text-sm text-foreground font-semibold leading-snug">
                    {opp.firstMove.action}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {opp.firstMove.timeframe} · Success: {opp.firstMove.successCriteria}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const OpportunityDirectionsGrid = memo(function OpportunityDirectionsGrid({
  opportunities,
  modeAccent,
}: OpportunityDirectionsGridProps) {
  if (!opportunities || opportunities.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(152 60% 44% / 0.1)" }}
        >
          <Lightbulb size={14} style={{ color: "hsl(152 60% 44%)" }} />
        </div>
        <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Strategic Opportunities
        </h2>
        <span className="text-xs font-bold text-muted-foreground/60">
          {opportunities.length} direction{opportunities.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Opportunity cards */}
      <div className="space-y-2">
        {opportunities.map((opp, i) => (
          <OpportunityCard
            key={opp.reconfigurationLabel || i}
            opp={opp}
            index={i}
            modeAccent={modeAccent}
          />
        ))}
      </div>
    </div>
  );
});
