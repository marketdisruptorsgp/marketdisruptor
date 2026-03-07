/**
 * ExecutiveBrief — 30-Second Strategy Brief
 *
 * Single viewport card: Diagnosis → Direction → Impact
 * No scrolling needed. The entire strategic insight in one glance.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Crosshair, ArrowRight, TrendingUp, Clock, Zap,
  Shield, DollarSign, Gauge, Sparkles,
} from "lucide-react";
import { humanizeLabel } from "@/lib/humanize";
import type { Evidence, EvidenceMode } from "@/lib/evidenceEngine";
import type { StrategicInsight, StrategicNarrative } from "@/lib/strategicEngine";
import { generatePlaybooks } from "@/lib/playbookEngine";

interface ExecutiveBriefProps {
  narrative: StrategicNarrative | null;
  evidence: Evidence[];
  insights: StrategicInsight[];
  mode: "product" | "service" | "business";
  completedSteps: number;
  totalSteps: number;
  modeAccent: string;
}

function evidenceStrength(c: number): { label: string; color: string } {
  if (c >= 0.7) return { label: "Strong Evidence", color: "hsl(var(--success))" };
  if (c >= 0.4) return { label: "Moderate Evidence", color: "hsl(var(--warning))" };
  if (c >= 0.15) return { label: "Early Signal", color: "hsl(var(--muted-foreground))" };
  return { label: "Preliminary", color: "hsl(var(--muted-foreground))" };
}

function qualitative(score: number): string {
  if (score >= 7) return "Strong";
  if (score >= 4) return "Moderate";
  return "Limited";
}

function diffLabel(d: number): string {
  if (d >= 7) return "High";
  if (d >= 4) return "Moderate";
  return "Low";
}

function timeHorizon(d: number): string {
  if (d >= 7) return "18–36 mo";
  if (d >= 4) return "6–18 mo";
  return "3–6 mo";
}

export const ExecutiveBrief = memo(function ExecutiveBrief({
  narrative, evidence, insights, mode, completedSteps, totalSteps, modeAccent,
}: ExecutiveBriefProps) {
  const evidenceMode: EvidenceMode = mode === "business" ? "business_model" : mode;

  const topPlaybook = useMemo(() => {
    const pbs = generatePlaybooks(evidence, insights, narrative, evidenceMode);
    return pbs.length > 0 ? pbs[0] : null;
  }, [evidence, insights, narrative, evidenceMode]);

  const constraint = humanizeLabel(narrative?.primaryConstraint) || null;
  const opportunity = humanizeLabel(narrative?.breakthroughOpportunity) || null;
  const verdict = narrative?.strategicVerdict || null;
  const rationale = narrative?.verdictRationale || null;
  const confidence = narrative?.verdictConfidence ?? 0;
  const strength = evidenceStrength(confidence);

  // Build the diagnosis sentence
  const diagnosis = useMemo(() => {
    if (constraint && rationale && rationale.length > 20 && rationale.length < 250) return rationale;
    if (constraint && verdict) return `${constraint} is constraining growth. ${verdict}.`;
    if (constraint && opportunity) return `${constraint} is limiting growth — resolving it could unlock ${opportunity.toLowerCase()}.`;
    if (constraint) return `Key structural constraint: ${constraint.toLowerCase()}.`;
    if (verdict) return verdict;
    if (completedSteps > 0) return "Initial signals detected. Run additional analysis steps to build the strategic diagnosis.";
    return "Run the analysis pipeline to generate a strategic diagnosis.";
  }, [constraint, rationale, verdict, opportunity, completedSteps]);

  const hasData = !!constraint || !!verdict || confidence >= 0.15;
  const impact = topPlaybook?.impact;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: `2px solid ${modeAccent}25` }}
    >
      {/* ── ROW 1: Diagnosis ── */}
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Crosshair size={13} style={{ color: modeAccent }} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Diagnosis
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ml-auto"
            style={{ color: strength.color, background: `${strength.color}15` }}
          >
            {strength.label}
          </span>
        </div>
        <p className={`text-base sm:text-lg font-black leading-snug ${hasData ? "text-foreground" : "text-muted-foreground italic"}`}>
          "{diagnosis}"
        </p>
      </div>

      {/* ── ROW 2: Direction + Impact (side by side on desktop) ── */}
      {topPlaybook && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Direction */}
          <div className="px-4 sm:px-5 py-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={13} style={{ color: modeAccent }} />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Recommended Move
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-foreground leading-tight">
              {topPlaybook.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
              {topPlaybook.strategicThesis}
            </p>

            {/* Compact timeline */}
            {impact && (
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                  <Clock size={10} />
                  {timeHorizon(impact.executionDifficulty)}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground">
                  <Gauge size={10} />
                  {diffLabel(impact.executionDifficulty)} complexity
                </span>
              </div>
            )}
          </div>

          {/* Impact Profile */}
          {impact && (
            <div className="px-4 sm:px-5 py-3 lg:min-w-[220px]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={13} style={{ color: modeAccent }} />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Expected Impact
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Revenue", value: qualitative(impact.revenueExpansion), Icon: TrendingUp },
                  { label: "Cost", value: qualitative(impact.marginImprovement), Icon: DollarSign },
                  { label: "Moat", value: qualitative(impact.capitalEfficiency), Icon: Shield },
                  { label: "Speed", value: impact.executionDifficulty <= 3 ? "Fast" : impact.executionDifficulty <= 6 ? "Medium" : "Slow", Icon: Zap },
                ].map(attr => {
                  const isPositive = attr.value === "Strong" || attr.value === "Fast";
                  const isNeutral = attr.value === "Moderate" || attr.value === "Medium";
                  const color = isPositive ? "hsl(var(--success))" : isNeutral ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))";
                  return (
                    <div key={attr.label} className="flex items-center gap-2 py-1">
                      <attr.Icon size={11} style={{ color }} />
                      <div>
                        <p className="text-[10px] text-muted-foreground leading-none">{attr.label}</p>
                        <p className="text-xs font-bold" style={{ color }}>{attr.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ROW 3: Opportunity unlock (if available) ── */}
      {opportunity && (
        <div className="px-4 sm:px-5 py-2.5 border-t border-border flex items-center gap-2">
          <ArrowRight size={12} style={{ color: modeAccent }} />
          <span className="text-xs font-bold text-muted-foreground">Unlock:</span>
          <span className="text-xs font-bold text-foreground">{opportunity}</span>
        </div>
      )}
    </motion.div>
  );
});
