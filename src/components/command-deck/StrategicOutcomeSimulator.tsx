/**
 * StrategicOutcomeSimulator — "What happens if you actually do this?"
 *
 * Shows projected business outcomes after the Recommended Strategic Move:
 *   Revenue Model Shift · Margin Impact · Scalability · Time to Realize · Strategic Risk
 *
 * Appears directly below TransformationPaths in Tier 1 of the Command Deck.
 */

import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, TrendingUp, Maximize2, Clock, ShieldAlert,
  Zap, ChevronDown, ChevronUp,
} from "lucide-react";
import type { TransformationPlaybook } from "@/lib/playbookEngine";
import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import { projectStrategicOutcome, type ProjectedOutcome } from "@/lib/outcomeSimulatorEngine";

interface StrategicOutcomeSimulatorProps {
  playbook: TransformationPlaybook | null;
  evidence: Evidence[];
  narrative: StrategicNarrative | null;
}

function confidenceBadge(level: "high" | "moderate" | "low") {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    high: { bg: "hsl(var(--success) / 0.1)", text: "hsl(var(--success))", label: "High confidence" },
    moderate: { bg: "hsl(var(--warning) / 0.1)", text: "hsl(var(--warning))", label: "Moderate confidence" },
    low: { bg: "hsl(var(--muted) / 0.3)", text: "hsl(var(--muted-foreground))", label: "Early estimate" },
  };
  const s = styles[level];
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function riskBadge(level: "low" | "moderate" | "high") {
  const map: Record<string, { color: string; label: string }> = {
    low: { color: "hsl(var(--success))", label: "Low" },
    moderate: { color: "hsl(var(--warning))", label: "Moderate" },
    high: { color: "hsl(var(--destructive))", label: "High" },
  };
  return map[level];
}

function directionIcon(dir: "positive" | "neutral" | "negative") {
  if (dir === "positive") return <TrendingUp size={10} style={{ color: "hsl(var(--success))" }} />;
  if (dir === "negative") return <TrendingUp size={10} style={{ color: "hsl(var(--destructive))", transform: "rotate(180deg)" }} />;
  return <ArrowRight size={10} className="text-muted-foreground" />;
}

export const StrategicOutcomeSimulator = memo(function StrategicOutcomeSimulator({
  playbook,
  evidence,
  narrative,
}: StrategicOutcomeSimulatorProps) {
  const [showSignals, setShowSignals] = useState(false);

  const outcome: ProjectedOutcome | null = useMemo(() => {
    if (!playbook) return null;
    return projectStrategicOutcome(playbook, evidence, narrative);
  }, [playbook, evidence, narrative]);

  if (!outcome || !playbook) return null;

  const risk = riskBadge(outcome.strategicRisk.level);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
          <Zap size={14} className="text-primary" />
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Projected Strategic Impact
        </span>
      </div>

      {/* Subtitle */}
      <div className="px-5 pb-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you execute <span className="font-bold text-foreground">{playbook.title}</span>, here's what changes:
        </p>
      </div>

      {/* ═══ Revenue Model Shift ═══ */}
      <div className="px-5 pb-4">
        <div className="rounded-lg p-3 mb-3" style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
            Revenue Model Shift
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-muted-foreground line-through decoration-1">
              {outcome.revenueModelShift.from}
            </span>
            <ArrowRight size={14} className="text-primary flex-shrink-0" />
            <span className="text-sm font-black text-foreground">
              {outcome.revenueModelShift.to}
            </span>
          </div>
        </div>

        {/* ═══ 3-Column Impact Grid ═══ */}
        <div className="grid grid-cols-3 gap-3">
          {/* Margin Impact */}
          <div className="rounded-lg p-3" style={{ background: "hsl(var(--success) / 0.06)", border: "1px solid hsl(var(--success) / 0.12)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={11} style={{ color: "hsl(var(--success))" }} />
              <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "hsl(var(--success))" }}>
                Margin Impact
              </span>
            </div>
            <p className="text-lg font-black text-foreground leading-tight">
              {outcome.marginImpact.direction === "expansion" ? "+" : ""}{outcome.marginImpact.label}
            </p>
            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
              {outcome.marginImpact.rationale}
            </p>
            <div className="mt-1.5">{confidenceBadge(outcome.marginImpact.confidence)}</div>
          </div>

          {/* Scalability */}
          <div className="rounded-lg p-3" style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.12)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Maximize2 size={11} className="text-primary" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                Scalability
              </span>
            </div>
            <p className="text-lg font-black text-foreground leading-tight">
              {outcome.scalabilityImpact.multiplier}
            </p>
            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
              {outcome.scalabilityImpact.description}
            </p>
            <div className="mt-1.5">{confidenceBadge(outcome.scalabilityImpact.confidence)}</div>
          </div>

          {/* Time + Risk */}
          <div className="space-y-3">
            {/* Time to Realize */}
            <div className="rounded-lg p-3" style={{ background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={11} className="text-muted-foreground" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Timeline
                </span>
              </div>
              <p className="text-sm font-black text-foreground">{outcome.timeToRealize.range}</p>
              <p className="text-[9px] text-muted-foreground">{outcome.timeToRealize.phases} execution phases</p>
            </div>

            {/* Strategic Risk */}
            <div className="rounded-lg p-3" style={{ background: `${risk.color}08`, border: `1px solid ${risk.color}18` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldAlert size={11} style={{ color: risk.color }} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: risk.color }}>
                  Risk
                </span>
              </div>
              <p className="text-sm font-black text-foreground">{risk.label}</p>
              <p className="text-[9px] text-muted-foreground">{outcome.strategicRisk.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Economic Signals — expandable ═══ */}
      {outcome.economicSignals.length > 0 && (
        <div className="border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <button
            onClick={() => setShowSignals(!showSignals)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors hover:bg-muted/30"
          >
            <span className="text-muted-foreground">
              {showSignals ? "Hide" : "View"} supporting economic signals
            </span>
            {showSignals
              ? <ChevronUp size={14} className="text-muted-foreground" />
              : <ChevronDown size={14} className="text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showSignals && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 space-y-2">
                  {outcome.economicSignals.map((sig, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-lg p-2.5"
                      style={{ background: "hsl(var(--muted) / 0.2)" }}
                    >
                      {directionIcon(sig.direction)}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          {sig.label}
                        </p>
                        <p className="text-xs text-foreground leading-snug mt-0.5">
                          {sig.value}
                        </p>
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
