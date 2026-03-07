/**
 * Strategic Verdict Banner — Diagnosis → Direction → Impact
 * No numeric scores. Uses qualitative evidence labels.
 */

import { memo, useMemo } from "react";
import { Zap, AlertTriangle, TrendingUp, Crosshair, Database, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { humanizeLabel } from "@/lib/humanize";

interface StrategicVerdictBannerProps {
  verdict: string | null;
  rationale: string | null;
  confidence: number;
  constraintLabel: string | null;
  opportunityLabel: string | null;
  completedSteps: number;
  totalSteps: number;
  whyThisMatters: string | null;
  verdictBenchmark: string | null;
  evidenceSources?: string[];
  diagnosisEvidence?: Array<{ category: string; detail: string }>;
}

function evidenceBadge(c: number) {
  if (c >= 0.7) return { label: "Strong evidence", bg: "hsl(var(--success) / 0.12)", text: "hsl(var(--success))" };
  if (c >= 0.4) return { label: "Moderate evidence", bg: "hsl(var(--warning) / 0.12)", text: "hsl(var(--warning))" };
  if (c >= 0.15) return { label: "Early signal", bg: "hsl(var(--destructive) / 0.1)", text: "hsl(var(--destructive))" };
  return { label: "Preliminary", bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))" };
}

function buildDiagnosis(constraintLabel: string | null, rationale: string | null, completedSteps: number): string | null {
  if (constraintLabel && rationale) {
    if (rationale.length > 20 && rationale.length < 200) return rationale;
    return `Growth constrained by ${constraintLabel.toLowerCase()}.`;
  }
  if (constraintLabel) return `Key structural constraint: ${constraintLabel.toLowerCase()}.`;
  if (completedSteps > 0) return "Initial evidence suggests structural constraints on the current business model.";
  return "No analysis data available yet. Run the analysis pipeline to generate strategic insights.";
}

function buildExecutiveSummary(
  constraintLabel: string | null, verdict: string | null, opportunityLabel: string | null, completedSteps: number,
): string | null {
  if (constraintLabel && verdict) return `Your business is constrained by ${constraintLabel.toLowerCase()}. ${verdict}.`;
  if (constraintLabel && opportunityLabel) return `${constraintLabel} is limiting growth. Resolving it could unlock ${opportunityLabel.toLowerCase()}.`;
  if (verdict) return verdict;
  if (completedSteps > 0) return "Preliminary signals detected — run the full analysis to generate a strategic recommendation.";
  return "Run the analysis pipeline to generate a strategic briefing.";
}

export const StrategicVerdictBanner = memo(function StrategicVerdictBanner(props: StrategicVerdictBannerProps) {
  const {
    verdict, rationale, confidence,
    completedSteps, totalSteps, whyThisMatters, verdictBenchmark,
    evidenceSources = [], diagnosisEvidence = [],
  } = props;

  const constraintLabel = humanizeLabel(props.constraintLabel) || null;
  const opportunityLabel = humanizeLabel(props.opportunityLabel) || null;

  const badge = evidenceBadge(confidence);
  const hasVerdict = !!verdict || !!constraintLabel;

  const executiveSummary = useMemo(
    () => buildExecutiveSummary(constraintLabel, verdict, opportunityLabel, completedSteps),
    [constraintLabel, verdict, opportunityLabel, completedSteps],
  );

  const diagnosis = useMemo(
    () => buildDiagnosis(constraintLabel, rationale, completedSteps),
    [constraintLabel, rationale, completedSteps],
  );

  const displayVerdict = verdict
    || (constraintLabel ? `Shift away from ${constraintLabel.toLowerCase()} dependency` : null)
    || (completedSteps > 0
      ? "Preliminary analysis underway — strategic direction will sharpen as more evidence is collected."
      : "Begin analysis to generate strategic direction.");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      <div className="px-5 pt-4 pb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: "hsl(var(--primary))" }} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Strategic Briefing
          </span>
        </div>
        <span
          className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: badge.bg, color: badge.text }}
        >
          {badge.label}
        </span>
      </div>

      {executiveSummary && (
        <div className="px-5 pb-3">
          <p className={`text-base sm:text-lg font-black leading-snug ${hasVerdict ? 'text-foreground' : 'text-muted-foreground italic'}`}>
            {executiveSummary}
          </p>
        </div>
      )}

      {diagnosis && (
        <div className="px-5 pb-2">
          <div className="rounded-lg p-3" style={{ background: "hsl(var(--destructive) / 0.04)", border: "1px solid hsl(var(--destructive) / 0.1)" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Crosshair size={11} style={{ color: "hsl(var(--destructive))" }} />
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--destructive))" }}>
                Diagnosis
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground leading-snug">{diagnosis}</p>
            {diagnosisEvidence.length > 0 && (
              <div className="mt-2 space-y-1">
                {diagnosisEvidence.slice(0, 4).map((ev, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle2 size={10} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      <span className="font-bold">{ev.category}:</span> {ev.detail}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-5 pb-2">
        <div className="rounded-lg p-3" style={{ background: "hsl(var(--primary) / 0.04)", border: "1px solid hsl(var(--primary) / 0.1)" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap size={11} style={{ color: "hsl(var(--primary))" }} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
              Direction
            </span>
          </div>
          <p className={`text-sm sm:text-base font-black leading-tight ${hasVerdict ? 'text-foreground' : 'text-muted-foreground'}`}>
            {displayVerdict}
          </p>
        </div>
      </div>

      {(whyThisMatters || verdictBenchmark) && (
        <div className="px-5 pb-3">
          <div className="rounded-lg p-3" style={{ background: "hsl(var(--success) / 0.04)", border: "1px solid hsl(var(--success) / 0.1)" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp size={11} style={{ color: "hsl(var(--success))" }} />
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--success))" }}>
                Impact
              </span>
            </div>
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {verdictBenchmark || whyThisMatters}
            </p>
          </div>
        </div>
      )}

      {constraintLabel && opportunityLabel && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: "hsl(var(--destructive) / 0.08)", border: "1px solid hsl(var(--destructive) / 0.15)" }}>
              <AlertTriangle size={11} style={{ color: "hsl(var(--destructive))" }} />
              <span className="text-[11px] font-bold text-foreground">{constraintLabel}</span>
            </div>
            <span className="text-muted-foreground text-xs font-bold">→</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: "hsl(var(--success) / 0.08)", border: "1px solid hsl(var(--success) / 0.15)" }}>
              <TrendingUp size={11} style={{ color: "hsl(var(--success))" }} />
              <span className="text-[11px] font-bold text-foreground">{opportunityLabel}</span>
            </div>
          </div>
        </div>
      )}

      {evidenceSources.length > 0 && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Database size={10} className="text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground">Evidence:</span>
            {evidenceSources.map((src, idx) => (
              <span key={idx} className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ background: "hsl(var(--muted) / 0.5)", color: "hsl(var(--foreground))" }}>
                {src}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
});
