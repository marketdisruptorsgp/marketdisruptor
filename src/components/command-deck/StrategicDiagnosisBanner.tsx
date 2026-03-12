/**
 * StrategicDiagnosisBanner — The ONE bold diagnosis sentence
 * that a user reads in the first 3 seconds.
 *
 * No confidence scores, no "preliminary signal" labels.
 * Just the diagnosis in plain English.
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
  verdictRationale?: string | null;
  whyThisMatters?: string | null;
  confidence: number;
  completedSteps: number;
}

function buildDiagnosisSentence(
  constraint: string | null,
  rationale: string | null,
  verdict: string | null,
  opportunity: string | null,
  verdictRationale: string | null,
  whyThisMatters: string | null,
  completedSteps: number,
): string | null {
  // Best: verdictRationale provides the richest, most specific text
  if (verdictRationale && verdictRationale.length > 40 && verdictRationale.length < 350) {
    return verdictRationale;
  }
  // Second best: whyThisMatters
  if (whyThisMatters && whyThisMatters.length > 40 && whyThisMatters.length < 350) {
    return whyThisMatters;
  }
  // Rationale if non-template
  if (constraint && rationale && rationale.length > 20 && rationale.length < 250
      && !rationale.startsWith("If the primary thesis")) {
    return rationale;
  }
  // Constraint + verdict
  if (constraint && verdict) {
    return `${constraint}. The move: ${verdict.toLowerCase()}.`;
  }
  // Constraint + opportunity
  if (constraint && opportunity) {
    return `${constraint}. Resolving it opens up ${opportunity.toLowerCase()}.`;
  }
  // Just constraint
  if (constraint) {
    return constraint;
  }
  // Just verdict
  if (verdict) {
    return verdict;
  }
  // Nothing yet
  return null;
}

export const StrategicDiagnosisBanner = memo(function StrategicDiagnosisBanner(props: StrategicDiagnosisBannerProps) {
  const constraint = humanizeLabel(props.constraintLabel) || null;
  const opportunity = humanizeLabel(props.opportunityLabel) || null;
  const { completedSteps } = props;
  const rationale = props.rationale ? trimAt(props.rationale, 250) : null;
  const verdict = props.verdict ? humanizeLabel(props.verdict) : null;
  const verdictRationale = props.verdictRationale ? trimAt(props.verdictRationale, 350) : null;
  const whyThisMatters = props.whyThisMatters ? trimAt(props.whyThisMatters, 350) : null;

  const sentence = useMemo(
    () => buildDiagnosisSentence(constraint, rationale, verdict, opportunity, verdictRationale, whyThisMatters, completedSteps),
    [constraint, rationale, verdict, opportunity, verdictRationale, whyThisMatters, completedSteps],
  );

  if (!sentence) return null;

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
      </div>

      <p className="text-lg sm:text-xl lg:text-2xl font-black leading-snug text-foreground">
        "{sentence}"
      </p>
    </motion.div>
  );
});
