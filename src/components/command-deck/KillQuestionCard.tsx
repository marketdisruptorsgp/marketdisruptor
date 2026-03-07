/**
 * Kill Question Card — The single falsifiable question + validation experiment
 * 
 * Turns analysis into a strategic advisor guiding a decision.
 */

import { memo } from "react";
import { HelpCircle, FlaskConical, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface KillQuestionCardProps {
  /** The one question that validates or kills the strategy */
  killQuestion: string | null;
  /** A concrete experiment to test it */
  validationExperiment: string | null;
  /** Suggested timeframe */
  timeframe: string;
  /** Confidence that this is the right question */
  confidence: number;
}

export const KillQuestionCard = memo(function KillQuestionCard(props: KillQuestionCardProps) {
  const { killQuestion, validationExperiment, timeframe, confidence } = props;

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
        <div className="px-5 pb-4">
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
    </motion.div>
  );
});
