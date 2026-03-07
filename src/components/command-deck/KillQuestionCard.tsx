/**
 * Kill Question Card — The single falsifiable question + validation steps
 */

import { memo, useState } from "react";
import { HelpCircle, FlaskConical, Clock, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ValidationStep } from "@/lib/strategicEngine";

interface KillQuestionCardProps {
  killQuestion: string | null;
  validationExperiment: string | null;
  timeframe: string;
  confidence: number;
  validationSteps?: ValidationStep[];
}

export const KillQuestionCard = memo(function KillQuestionCard(props: KillQuestionCardProps) {
  const { killQuestion, validationExperiment, timeframe, confidence, validationSteps = [] } = props;
  const [showSteps, setShowSteps] = useState(false);

  if (!killQuestion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle size={13} style={{ color: "hsl(var(--primary))" }} />
          <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
            Kill Question
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={11} className="text-muted-foreground" />
          <span className="text-[10px] font-bold text-muted-foreground">{timeframe}</span>
        </div>
      </div>

      {/* The question */}
      <div className="px-5 pb-3">
        <p className="text-base font-black text-foreground leading-snug italic">
          "{killQuestion}"
        </p>
        <p className="text-[10px] font-bold text-muted-foreground mt-1">
          If the answer is no, the strategy fails. Validate before committing resources.
        </p>
      </div>

      {/* Validation experiment */}
      {validationExperiment && (
        <div className="px-5 pb-3">
          <div
            className="rounded-lg p-3"
            style={{ background: "hsl(var(--muted) / 0.4)" }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <FlaskConical size={11} style={{ color: "hsl(var(--primary))" }} />
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
                Fastest Validation Experiment
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground leading-snug">
              {validationExperiment}
            </p>
          </div>
        </div>
      )}

      {/* Validation Steps Toggle */}
      {validationSteps.length > 0 && (
        <div className="px-5 pb-4">
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer mb-2"
            style={{ color: "hsl(var(--primary))" }}
          >
            {showSteps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showSteps ? "Hide validation roadmap" : `View ${validationSteps.length}-step validation roadmap`}
          </button>

          <AnimatePresence>
            {showSteps && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="space-y-2">
                  {validationSteps.map((vs) => (
                    <div
                      key={vs.step}
                      className="flex items-start gap-3 rounded-lg p-3"
                      style={{ background: "hsl(var(--muted) / 0.25)", border: "1px solid hsl(var(--border))" }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "hsl(var(--primary) / 0.12)" }}
                      >
                        <span className="text-[10px] font-black" style={{ color: "hsl(var(--primary))" }}>
                          {vs.step}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground leading-snug">
                          {vs.action}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 size={10} style={{ color: "hsl(var(--success))" }} />
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {vs.metric}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={10} className="text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {vs.timeframe}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
});
