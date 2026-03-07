/**
 * Strategic Verdict Banner — Diagnosis → Direction → Impact
 *
 * Mirrors consulting firm format:
 *   1. Executive Summary — one-line strategic conclusion
 *   2. Strategic Diagnosis — what's the structural problem + evidence
 *   3. Strategic Direction — what should change
 *   4. Expected Impact — what it unlocks
 *   5. Evidence Sources — what data supports this
 */

import { memo, useMemo } from "react";
import { Zap, AlertTriangle, TrendingUp, Crosshair, Database, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

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
  /** Evidence source categories backing this verdict */
  evidenceSources?: string[];
  /** Specific evidence bullets for the diagnosis */
  diagnosisEvidence?: Array<{ category: string; detail: string }>;
}

function confidenceBadge(c: number) {
  if (c >= 0.7) return { label: "High confidence", bg: "hsl(var(--success) / 0.12)", text: "hsl(var(--success))" };
  if (c >= 0.4) return { label: "Moderate confidence", bg: "hsl(var(--warning) / 0.12)", text: "hsl(var(--warning))" };
  if (c >= 0.15) return { label: "Preliminary — needs validation", bg: "hsl(var(--destructive) / 0.1)", text: "hsl(var(--destructive))" };
  return { label: "Early hypothesis", bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))" };
}

function buildDiagnosis(constraintLabel: string | null, rationale: string | null, completedSteps: number): string | null {
  if (constraintLabel && rationale) {
    if (rationale.length > 20 && rationale.length < 200) return rationale;
    return `Growth constrained by ${constraintLabel.toLowerCase()}.`;
  }
  if (constraintLabel) {
    return `Key structural constraint: ${constraintLabel.toLowerCase()}.`;
  }
  if (completedSteps > 0) {
    return "Analyzing structural constraints — a preliminary diagnosis is forming.";
  }
  return null;
}

/** Build a single-line executive summary from diagnosis + direction */
function buildExecutiveSummary(
  constraintLabel: string | null,
  verdict: string | null,
  opportunityLabel: string | null,
  completedSteps: number,
): string | null {
  if (constraintLabel && verdict) {
    return `Your business is constrained by ${constraintLabel.toLowerCase()}. ${verdict}.`;
  }
  if (constraintLabel && opportunityLabel) {
    return `${constraintLabel} is limiting growth. Resolving it could unlock ${opportunityLabel.toLowerCase()}.`;
  }
  if (verdict) {
    return verdict;
  }
  if (completedSteps > 0) {
    return "Building a strategic hypothesis from available evidence…";
  }
  return null;
}

export const StrategicVerdictBanner = memo(function StrategicVerdictBanner(props: StrategicVerdictBannerProps) {
  const {
    verdict, rationale, confidence, constraintLabel, opportunityLabel,
    completedSteps, totalSteps, whyThisMatters, verdictBenchmark,
    evidenceSources = [], diagnosisEvidence = [],
  } = props;

  const badge = confidenceBadge(confidence);
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
      ? "Forming initial strategic hypothesis from available evidence…"
      : "Begin analysis to generate strategic direction.");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      {/* Header */}
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

      {/* ── EXECUTIVE SUMMARY — single-line strategic conclusion ── */}
      {executiveSummary && (
        <div className="px-5 pb-3">
          <p className={`text-base sm:text-lg font-black leading-snug ${hasVerdict ? 'text-foreground' : 'text-muted-foreground italic'}`}>
            {executiveSummary}
          </p>
        </div>
      )}

      {/* ── 1. DIAGNOSIS ── */}
      {diagnosis && (
        <div className="px-5 pb-2">
          <div className="rounded-lg p-3" style={{ background: "hsl(var(--destructive) / 0.04)", border: "1px solid hsl(var(--destructive) / 0.1)" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Crosshair size={11} style={{ color: "hsl(var(--destructive))" }} />
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--destructive))" }}>
                Diagnosis
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground leading-snug">
              {diagnosis}
            </p>
            {/* Evidence bullets for diagnosis */}
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

      {/* ── 2. DIRECTION ── */}
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

      {/* ── 3. IMPACT ── */}
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

      {/* Constraint → Opportunity flow (compact) */}
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

      {/* Evidence Source Attribution */}
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
