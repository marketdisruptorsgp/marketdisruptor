/**
 * StrategicDiagnosisBanner — The ONE bold diagnosis sentence
 * that a user reads in the first 3 seconds.
 *
 * Consulting-grade: large, bold, sets the entire context.
 */

import { memo, useMemo } from "react";
import { Crosshair } from "lucide-react";
import { motion } from "framer-motion";
import { humanizeLabel, trimAt } from "@/lib/humanize";

interface StrategicDiagnosisBannerProps {
  constraintLabel: string | null;
  rationale: string | null;
  verdict: string | null;
  opportunityLabel: string | null;
  confidence: number;
  completedSteps: number;
}

function buildDiagnosisSentence(
  constraint: string | null,
  rationale: string | null,
  verdict: string | null,
  opportunity: string | null,
  completedSteps: number,
): string {
  // Best case: we have both constraint and rationale
  if (constraint && rationale && rationale.length > 20 && rationale.length < 250) {
    return rationale;
  }
  // Constraint + verdict
  if (constraint && verdict) {
    return `${constraint} is constraining growth. ${verdict}.`;
  }
  // Constraint + opportunity
  if (constraint && opportunity) {
    return `${constraint} is limiting growth. Resolving it could unlock ${opportunity.toLowerCase()}.`;
  }
  // Just constraint
  if (constraint) {
    return `Key structural constraint: ${constraint.toLowerCase()}.`;
  }
  // Just verdict
  if (verdict) {
    return verdict;
  }
  // Early state
  if (completedSteps > 0) {
    return "Early demand signals suggest structural constraints on the current model. Run the full analysis to identify specific bottlenecks.";
  }
  return "Run the analysis pipeline to generate a strategic diagnosis.";
}

function confidenceTag(c: number) {
  if (c >= 0.7) return { label: "High confidence", color: "hsl(var(--success))" };
  if (c >= 0.4) return { label: "Moderate confidence", color: "hsl(var(--warning))" };
  if (c >= 0.15) return { label: "Preliminary insight", color: "hsl(var(--muted-foreground))" };
  return { label: "Early hypothesis", color: "hsl(var(--muted-foreground))" };
}

export const StrategicDiagnosisBanner = memo(function StrategicDiagnosisBanner(props: StrategicDiagnosisBannerProps) {
  const constraint = humanizeLabel(props.constraintLabel) || null;
  const opportunity = humanizeLabel(props.opportunityLabel) || null;
  const { rationale, verdict, confidence, completedSteps } = props;

  const sentence = useMemo(
    () => buildDiagnosisSentence(constraint, rationale, verdict, opportunity, completedSteps),
    [constraint, rationale, verdict, opportunity, completedSteps],
  );

  const tag = confidenceTag(confidence);
  const hasReal = !!constraint || !!verdict || confidence >= 0.15;
  const isEarly = completedSteps === 0 && !hasReal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl px-5 sm:px-6 py-5"
      style={{
        background: "hsl(var(--card))",
        border: "2px solid hsl(var(--primary) / 0.2)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Crosshair size={14} style={{ color: "hsl(var(--primary))" }} />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Diagnosis
        </span>
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ml-auto"
          style={{ color: tag.color, background: `${tag.color}15` }}
        >
          {tag.label}
        </span>
      </div>

      <p
        className={`text-lg sm:text-xl lg:text-2xl font-black leading-snug ${
          hasReal ? "text-foreground" : "text-muted-foreground italic"
        }`}
      >
        {isEarly && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1.5">
            Preliminary Signal
          </span>
        )}
        "{sentence}"
      </p>
    </motion.div>
  );
});
