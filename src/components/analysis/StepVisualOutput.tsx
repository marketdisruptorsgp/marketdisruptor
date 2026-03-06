/**
 * STEP VISUAL OUTPUT — Right-side visual interpretation panels
 * 
 * Renders step-specific visualizations:
 * - Report: Signal Quadrant (SWOT-style)
 * - Disrupt: Assumption Map + Constraint Heatmap
 * - Redesign: Value Stack Visualization
 * - Stress Test: Opportunity Matrix (mini)
 * - Pitch: Confidence Radar
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Shield, Lightbulb, TrendingUp, AlertTriangle,
  Zap, Target, Activity, Crosshair, CheckCircle2,
} from "lucide-react";

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

/* ── Mini Gauge (circular) ── */
function CircularGaugeSmall({ value, max, label, color }: {
  value: number; max: number; label: string; color: string;
}) {
  const pct = Math.min(value / max, 1);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="68" height="68" viewBox="0 0 68 68" className="transform -rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
        <motion.circle
          cx="34" cy="34" r={r} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute text-center" style={{ marginTop: "18px" }}>
        <p className="text-lg font-extrabold tabular-nums text-foreground">{value}</p>
      </div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center leading-tight">{label}</p>
    </div>
  );
}

/* ── Constraint Heatmap (mini) ── */
export function ConstraintHeatmapMini({ constraints }: {
  constraints: { label: string; impact: number; confidence: string }[];
}) {
  if (constraints.length === 0) return null;
  const sorted = [...constraints].sort((a, b) => b.impact - a.impact).slice(0, 6);

  return (
    <motion.div {...fadeIn} className="space-y-2">
      <div className="flex items-center gap-2">
        <Shield size={12} style={{ color: "hsl(0 72% 52%)" }} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">Constraint Heatmap</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {sorted.map((c, i) => {
          const intensity = c.impact / 10;
          const bg = `hsl(0 72% 52% / ${(intensity * 0.3).toFixed(2)})`;
          const borderColor = `hsl(0 72% 52% / ${(intensity * 0.5).toFixed(2)})`;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg p-2.5 text-center"
              style={{ background: bg, border: `1px solid ${borderColor}` }}
            >
              <p className="text-lg font-extrabold tabular-nums text-foreground leading-none">{c.impact}</p>
              <p className="text-[9px] font-bold text-foreground/70 mt-1 leading-tight truncate">{c.label}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ── Assumption Map (mini) ── */
export function AssumptionMapMini({ assumptions }: {
  assumptions: { text: string; risk: string; validated: boolean }[];
}) {
  if (assumptions.length === 0) return null;

  const riskColor = (r: string) =>
    r === "high" ? "hsl(0 72% 52%)" : r === "medium" ? "hsl(38 92% 50%)" : "hsl(152 60% 44%)";

  return (
    <motion.div {...fadeIn} className="space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle size={12} style={{ color: "hsl(38 92% 50%)" }} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">Assumption Map</p>
      </div>
      <div className="space-y-1.5">
        {assumptions.slice(0, 5).map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border"
          >
            <div
              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
              style={{ background: riskColor(a.risk) }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground leading-snug truncate">{a.text}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-bold uppercase" style={{ color: riskColor(a.risk) }}>
                  {a.risk} risk
                </span>
                {a.validated && (
                  <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-0.5">
                    <CheckCircle2 size={8} /> Validated
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Opportunity Radar (mini) ── */
export function OpportunityRadarMini({ opportunities }: {
  opportunities: { label: string; impact: number; confidence: string }[];
}) {
  if (opportunities.length === 0) return null;
  const sorted = [...opportunities].sort((a, b) => b.impact - a.impact).slice(0, 5);

  return (
    <motion.div {...fadeIn} className="space-y-2">
      <div className="flex items-center gap-2">
        <Lightbulb size={12} style={{ color: "hsl(152 60% 44%)" }} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">Top Opportunities</p>
      </div>
      <div className="space-y-1.5">
        {sorted.map((o, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-2.5"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground truncate">{o.label}</p>
                <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{
                  color: o.impact >= 8 ? "hsl(152 60% 44%)" : o.impact >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))"
                }}>
                  {o.impact}/10
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden mt-1" style={{ background: "hsl(var(--border))" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${o.impact * 10}%` }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                  style={{ background: o.impact >= 8 ? "hsl(152 60% 44%)" : o.impact >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))" }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Signal Quadrant (SWOT-style) ── */
export function SignalQuadrant({ strengths, weaknesses, opportunities, threats }: {
  strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[];
}) {
  const hasData = strengths.length + weaknesses.length + opportunities.length + threats.length > 0;
  if (!hasData) return null;

  const quadrants = [
    { label: "Working", items: strengths, color: "hsl(152 60% 44%)", icon: CheckCircle2, bgOpacity: "0.06" },
    { label: "Complaints", items: weaknesses, color: "hsl(0 72% 52%)", icon: AlertTriangle, bgOpacity: "0.06" },
    { label: "Friction", items: threats, color: "hsl(38 92% 50%)", icon: Zap, bgOpacity: "0.06" },
    { label: "Emerging", items: opportunities, color: "hsl(229 89% 63%)", icon: TrendingUp, bgOpacity: "0.06" },
  ];

  return (
    <motion.div {...fadeIn} className="space-y-2">
      <div className="flex items-center gap-2">
        <Activity size={12} style={{ color: "hsl(229 89% 63%)" }} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">Signal Overview</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {quadrants.map((q, qi) => (
          <motion.div
            key={q.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: qi * 0.06 }}
            className="rounded-lg p-2.5"
            style={{ background: `${q.color.replace(")", ` / ${q.bgOpacity})`)}`, border: `1px solid ${q.color.replace(")", " / 0.15)")}` }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <q.icon size={10} style={{ color: q.color }} />
              <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: q.color }}>
                {q.label}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground ml-auto">{q.items.length}</span>
            </div>
            {q.items.slice(0, 2).map((item, i) => (
              <p key={i} className="text-[10px] text-foreground/80 leading-snug truncate">{item}</p>
            ))}
            {q.items.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">—</p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Leverage Indicators (mini) ── */
export function LeverageIndicators({ leveragePoints }: {
  leveragePoints: { label: string; impact: number; isConvergenceZone?: boolean }[];
}) {
  if (leveragePoints.length === 0) return null;
  const top = [...leveragePoints].sort((a, b) => b.impact - a.impact).slice(0, 4);

  return (
    <motion.div {...fadeIn} className="space-y-2">
      <div className="flex items-center gap-2">
        <Crosshair size={12} style={{ color: "hsl(229 89% 63%)" }} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">Leverage Points</p>
      </div>
      <div className="space-y-1.5">
        {top.map((lp, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-2.5 p-2 rounded-lg bg-card border border-border"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(229 89% 63% / 0.1)" }}>
              <span className="text-sm font-extrabold tabular-nums" style={{ color: "hsl(229 89% 63%)" }}>
                {lp.impact}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground leading-snug truncate">{lp.label}</p>
              {lp.isConvergenceZone && (
                <span className="text-[9px] font-bold" style={{ color: "hsl(38 92% 50%)" }}>★ Convergence</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Main Step Visual Output Panel ── */
interface StepVisualOutputProps {
  step: "report" | "disrupt" | "redesign" | "stress-test" | "pitch";
  intelligence: {
    unifiedConstraintGraph?: { id: string; label: string; impact: number; confidence: string }[];
    opportunities?: { id: string; label: string; impact: number; confidence: string }[];
    leveragePoints?: { id: string; label: string; impact: number; isConvergenceZone?: boolean }[];
  } | null;
  governedData?: Record<string, unknown> | null;
  product?: Record<string, unknown> | null;
  accentColor: string;
}

export function StepVisualOutput({ step, intelligence, governedData, product, accentColor }: StepVisualOutputProps) {
  const constraints = intelligence?.unifiedConstraintGraph || [];
  const opportunities = intelligence?.opportunities || [];
  const leveragePoints = intelligence?.leveragePoints || [];

  // Extract assumptions from governed data
  const assumptions = useMemo(() => {
    const synopsis = (governedData as any)?.reasoning_synopsis;
    if (!synopsis?.key_assumptions) return [];
    return (synopsis.key_assumptions as any[]).map(a => ({
      text: a.assumption || a.label || String(a),
      risk: a.risk_level || a.risk || "medium",
      validated: a.validated || false,
    }));
  }, [governedData]);

  // Extract signal data for quadrant
  const signals = useMemo(() => {
    const ci = (product as any)?.communityInsights || (product as any)?.customerSentiment;
    return {
      strengths: (ci?.whatWorksWell || ci?.topPraises || []).slice(0, 3),
      weaknesses: (ci?.topComplaints || []).slice(0, 3),
      opportunities: (ci?.improvementRequests || []).slice(0, 3),
      threats: (ci?.frictionPoints || []).slice(0, 3),
    };
  }, [product]);

  const hasIntelligence = constraints.length > 0 || opportunities.length > 0 || leveragePoints.length > 0;
  const hasAssumptions = assumptions.length > 0;
  const hasSignals = signals.strengths.length + signals.weaknesses.length + signals.opportunities.length + signals.threats.length > 0;

  if (!hasIntelligence && !hasAssumptions && !hasSignals) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <div className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center bg-muted mb-2">
          <Activity size={18} className="text-muted-foreground" />
        </div>
        <p className="text-xs font-bold text-foreground">Visual Intelligence</p>
        <p className="text-[10px] text-muted-foreground mt-1">Run the analysis to generate visual insights</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}12` }}>
          <Activity size={12} style={{ color: accentColor }} />
        </div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">Visual Intelligence</p>
      </div>

      {/* Step-specific visualizations */}
      {step === "report" && hasSignals && (
        <SignalQuadrant {...signals} />
      )}

      {(step === "disrupt" || step === "report") && hasAssumptions && (
        <AssumptionMapMini assumptions={assumptions} />
      )}

      {hasIntelligence && (
        <>
          <ConstraintHeatmapMini constraints={constraints} />
          <OpportunityRadarMini opportunities={opportunities} />
          <LeverageIndicators leveragePoints={leveragePoints} />
        </>
      )}
    </div>
  );
}
