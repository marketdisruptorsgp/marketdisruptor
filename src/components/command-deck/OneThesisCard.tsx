/**
 * OneThesisCard — Displays the primary strategic thesis in a causal chain:
 * Core Constraint → Contrarian Belief → Strategic Move → Economic Mechanism → First Move
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, Lightbulb, Rocket, DollarSign, Play,
  ChevronDown, ChevronUp, Crosshair, Clock, CheckCircle2,
} from "lucide-react";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";

interface OneThesisCardProps {
  thesis: DeepenedOpportunity | null;
  alternative: DeepenedOpportunity | null;
  modeAccent: string;
}

const CHAIN_STEPS = [
  {
    key: "constraint",
    label: "Core Constraint",
    icon: AlertTriangle,
    extract: (t: DeepenedOpportunity) => t.causalChain.constraint,
    subtext: (t: DeepenedOpportunity) => `Root cause: ${t.causalChain.driver}`,
  },
  {
    key: "belief",
    label: "Contrarian Belief",
    icon: Lightbulb,
    extract: (t: DeepenedOpportunity) => `"${t.strategicBet.contrarianBelief}"`,
    subtext: (t: DeepenedOpportunity) => `Industry assumes: ${t.strategicBet.industryAssumption}`,
  },
  {
    key: "move",
    label: "Strategic Move",
    icon: Rocket,
    extract: (t: DeepenedOpportunity) => t.reconfigurationLabel,
    subtext: (t: DeepenedOpportunity) => t.summary,
  },
  {
    key: "economics",
    label: "Economic Mechanism",
    icon: DollarSign,
    extract: (t: DeepenedOpportunity) => t.economicMechanism.valueCreation,
    subtext: (t: DeepenedOpportunity) =>
      [t.economicMechanism.costStructureShift, t.economicMechanism.revenueImplication]
        .filter(Boolean).join(" · "),
  },
  {
    key: "first-move",
    label: "First Move",
    icon: Play,
    extract: (t: DeepenedOpportunity) => t.firstMove.action,
    subtext: (t: DeepenedOpportunity) =>
      `${t.firstMove.timeframe} · Learn: ${t.firstMove.learningObjective}`,
  },
] as const;

export const OneThesisCard = memo(function OneThesisCard({
  thesis,
  alternative,
  modeAccent,
}: OneThesisCardProps) {
  const [showAlternative, setShowAlternative] = useState(false);

  if (!thesis) return null;

  return (
    <div className="space-y-3">
      {/* ═══ PRIMARY THESIS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "2px solid hsl(var(--primary) / 0.3)" }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${modeAccent}15` }}
          >
            <Crosshair size={14} style={{ color: modeAccent }} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Strategic Thesis
          </span>
        </div>

        {/* Reconfiguration label */}
        <div className="px-5 pb-1">
          <h3 className="text-lg sm:text-xl font-black text-foreground leading-tight">
            {thesis.reconfigurationLabel}
          </h3>
        </div>

        {/* ═══ CAUSAL CHAIN ═══ */}
        <div className="px-5 pb-5 space-y-0">
          {CHAIN_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const mainText = step.extract(thesis);
            const sub = step.subtext(thesis);
            const isLast = idx === CHAIN_STEPS.length - 1;

            return (
              <div key={step.key} className="relative">
                {/* Connector line */}
                {!isLast && (
                  <div
                    className="absolute left-[15px] top-[36px] w-[2px] bottom-0"
                    style={{ background: `${modeAccent}25` }}
                  />
                )}
                <div className="flex gap-3 py-2.5">
                  {/* Icon circle */}
                  <div
                    className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative z-10"
                    style={{
                      background: `${modeAccent}12`,
                      border: `1.5px solid ${modeAccent}30`,
                    }}
                  >
                    <Icon size={13} style={{ color: modeAccent }} />
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-0.5">
                      {step.label}
                    </p>
                    <p className="text-sm font-bold text-foreground leading-snug">
                      {mainText}
                    </p>
                    {sub && (
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                        {sub}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feasibility + success criteria */}
        <div
          className="px-5 py-3 flex flex-wrap gap-x-6 gap-y-2 text-xs"
          style={{ borderTop: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-muted-foreground" />
            <span className="font-bold text-muted-foreground">
              Feasibility: <span className="capitalize">{thesis.feasibility.level.replace("_", " ")}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-muted-foreground" />
            <span className="font-bold text-muted-foreground">
              {thesis.firstMove.timeframe}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Crosshair size={12} className="text-muted-foreground" />
            <span className="font-bold text-muted-foreground">
              Go/No-Go: {thesis.firstMove.successCriteria}
            </span>
          </div>
        </div>

        {/* Defensibility */}
        {thesis.economicMechanism.defensibility && (
          <div
            className="px-5 py-2.5 text-xs"
            style={{ borderTop: "1px solid hsl(var(--border))" }}
          >
            <span className="font-extrabold text-muted-foreground uppercase tracking-widest text-[10px]">
              Defensibility:{" "}
            </span>
            <span className="text-muted-foreground">
              {thesis.economicMechanism.defensibility}
            </span>
          </div>
        )}
      </motion.div>

      {/* ═══ ALTERNATIVE THESIS (collapsible) ═══ */}
      {alternative && (
        <div>
          <button
            onClick={() => setShowAlternative(!showAlternative)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors hover:bg-muted/50"
            style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}
          >
            <span className="text-muted-foreground">
              {showAlternative ? "Hide" : "View"} alternative thesis
            </span>
            {showAlternative
              ? <ChevronUp size={14} className="text-muted-foreground" />
              : <ChevronDown size={14} className="text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showAlternative && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden mt-3"
              >
                <OneThesisCard thesis={alternative} alternative={null} modeAccent={modeAccent} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});
