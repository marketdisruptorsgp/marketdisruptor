/**
 * WhatsNextPanel — Actionable next steps: Kill Question + First Move + "What If?" trigger
 * Replaces buried KillQuestionCard + ScenarioSimulator with a unified action surface.
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ValidationStep } from "@/lib/strategicEngine";
import {
  Crosshair, Play, Beaker, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Target,
} from "lucide-react";
import { humanizeLabel, trimAt } from "@/lib/humanize";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";

interface WhatsNextPanelProps {
  narrative: StrategicNarrative | null;
  thesis: DeepenedOpportunity | null;
  modeAccent: string;
  onOpenScenarioSimulator?: () => void;
  onChallenge?: (stage: string, value: string) => void;
}

export const WhatsNextPanel = memo(function WhatsNextPanel({
  narrative,
  thesis,
  modeAccent,
  onOpenScenarioSimulator,
  onChallenge,
}: WhatsNextPanelProps) {
  const [showValidation, setShowValidation] = useState(false);

  const killQuestion = narrative?.killQuestion;
  const firstMove = thesis?.firstMove;
  const validationSteps = narrative?.validationSteps ?? [];

  if (!killQuestion && !firstMove) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${modeAccent}15` }}
        >
          <Target size={14} style={{ color: modeAccent }} />
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          What's Next
        </span>
      </div>

      <div className="px-5 pb-4 space-y-4">
        {/* Kill Question */}
        {killQuestion && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-destructive/70">
              Kill Question
            </p>
            <p className="text-sm font-bold text-foreground leading-snug">
              {killQuestion}
            </p>
            {narrative?.validationExperiment && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Test: {narrative.validationExperiment}
              </p>
            )}
            {narrative?.validationTimeframe && (
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={11} className="text-muted-foreground" />
                <span className="text-[11px] font-bold text-muted-foreground">
                  {narrative.validationTimeframe}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Validation Steps (expandable) */}
        {validationSteps.length > 0 && (
          <div>
            <button
              onClick={() => setShowValidation(!showValidation)}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCircle2 size={12} />
              {validationSteps.length} validation steps
              {showValidation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <AnimatePresence>
              {showValidation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ol className="mt-2 space-y-1.5 pl-1">
                    {validationSteps.map((vs, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
                          style={{ background: `${modeAccent}12`, color: modeAccent }}>
                          {vs.step ?? i + 1}
                        </span>
                        <span className="leading-relaxed">{vs.action}</span>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Separator */}
        {killQuestion && firstMove && (
          <div className="border-t border-border" />
        )}

        {/* First Move */}
        {firstMove && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              First Move
            </p>
            <div className="flex items-start gap-3">
              <div
                className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${modeAccent}12`, border: `1.5px solid ${modeAccent}30` }}
              >
                <Play size={13} style={{ color: modeAccent }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground leading-snug">
                  {firstMove.action}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {firstMove.timeframe} · Success: {firstMove.successCriteria}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap pt-1">
          {onOpenScenarioSimulator && (
            <button
              onClick={onOpenScenarioSimulator}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: `${modeAccent}12`, color: modeAccent, border: `1px solid ${modeAccent}25` }}
            >
              <Beaker size={12} /> What If?
            </button>
          )}
          {onChallenge && (
            <button
              onClick={() => onChallenge("constraint", "")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
            >
              <Crosshair size={12} /> Challenge This
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
