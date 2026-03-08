/**
 * PlaybookCard — Individual Transformation Path card
 * No numeric scores. Uses qualitative Strategy Profile attributes.
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, Star, Zap, Target, TrendingUp,
  ArrowRight, Shield, AlertTriangle, Calendar, CheckCircle2,
  FlaskConical, GitBranch, DollarSign, Gauge,
} from "lucide-react";
import type { TransformationPlaybook } from "@/lib/playbookEngine";
import type { EvidenceMode } from "@/lib/evidenceEngine";
import { getCategoryLabel, getArchetypeLabel } from "@/lib/playbookEngine";

interface PlaybookCardProps {
  playbook: TransformationPlaybook;
  rank: number;
}

const MODE_COLORS: Record<EvidenceMode, { bg: string; text: string; label: string }> = {
  product: { bg: "hsl(var(--primary) / 0.1)", text: "hsl(var(--primary))", label: "Product" },
  service: { bg: "hsl(var(--warning) / 0.1)", text: "hsl(var(--warning))", label: "Service" },
  business_model: { bg: "hsl(var(--success) / 0.1)", text: "hsl(var(--success))", label: "Business Model" },
  object_reinvention: { bg: "hsl(var(--accent) / 0.1)", text: "hsl(var(--accent))", label: "Object Reinvention" },
};

function qualLabel(score: number): { label: string; color: string } {
  if (score >= 7) return { label: "Strong", color: "hsl(var(--success))" };
  if (score >= 4) return { label: "Moderate", color: "hsl(var(--warning))" };
  return { label: "Limited", color: "hsl(var(--muted-foreground))" };
}

function diffLabel(score: number): { label: string; color: string } {
  if (score >= 7) return { label: "High", color: "hsl(var(--destructive))" };
  if (score >= 4) return { label: "Moderate", color: "hsl(var(--warning))" };
  return { label: "Low", color: "hsl(var(--success))" };
}

function speedFromDifficulty(d: number): { label: string; color: string } {
  if (d <= 3) return { label: "Fast", color: "hsl(var(--success))" };
  if (d <= 6) return { label: "Medium", color: "hsl(var(--warning))" };
  return { label: "Slow", color: "hsl(var(--muted-foreground))" };
}

function StrategyProfileRow({ label, val, Icon }: { label: string; val: { label: string; color: string }; Icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon size={11} style={{ color: val.color }} />
        <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
      </div>
      <span className="text-[11px] font-extrabold" style={{ color: val.color }}>{val.label}</span>
    </div>
  );
}

export const PlaybookCard = memo(function PlaybookCard({ playbook, rank }: PlaybookCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const archLabel = getArchetypeLabel(playbook.archetype);
  const catLabel = getCategoryLabel(playbook.category);

  const revenue = qualLabel(playbook.impact.revenueExpansion);
  const margin = qualLabel(playbook.impact.marginImprovement);
  const moat = qualLabel(playbook.impact.capitalEfficiency);
  const difficulty = diffLabel(playbook.impact.executionDifficulty);
  const speed = speedFromDifficulty(playbook.impact.executionDifficulty);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: playbook.isRecommended
          ? "2px solid hsl(var(--primary) / 0.4)"
          : "1.5px solid hsl(var(--border))",
      }}
    >
      {/* ── Header ── */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {playbook.triggeredByHypothesis && (
                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: "hsl(var(--warning) / 0.12)", color: "hsl(var(--warning))" }}>
                  <FlaskConical size={10} /> Triggered by Your Hypothesis
                </span>
              )}
              {playbook.isRecommended && !playbook.triggeredByHypothesis && (
                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  <Star size={10} /> Recommended
                </span>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {catLabel}
              </span>
              {archLabel && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {archLabel}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-foreground leading-tight">
              {playbook.title}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Strategic Thesis ── */}
      <div className="px-5 pb-3">
        <p className="text-sm text-foreground leading-relaxed font-medium">
          {playbook.strategicThesis}
        </p>
      </div>

      {/* ── Strategy Profile — qualitative attributes ── */}
      <div className="px-5 pb-3">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-1">
          Strategy Profile
        </span>
        <div className="rounded-lg p-3 divide-y divide-border" style={{ background: "hsl(var(--muted) / 0.25)" }}>
          <StrategyProfileRow label="Revenue Expansion" val={revenue} Icon={TrendingUp} />
          <StrategyProfileRow label="Cost Advantage" val={margin} Icon={DollarSign} />
          <StrategyProfileRow label="Market Control" val={moat} Icon={Shield} />
          <StrategyProfileRow label="Execution Complexity" val={difficulty} Icon={Gauge} />
          <StrategyProfileRow label="Speed to Impact" val={speed} Icon={Zap} />
        </div>
      </div>

      {/* ── Trigger Constraints ── */}
      {playbook.triggerConstraints.length > 0 && (
        <div className="px-5 pb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target size={11} className="text-destructive" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Detected Signals
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {playbook.triggerConstraints.slice(0, 6).map((signal, idx) => (
              <span key={idx} className="text-[11px] font-bold px-2 py-1 rounded-md capitalize"
                style={{ background: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))" }}>
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Strategic Moves ── */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap size={11} className="text-primary" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            Strategic Moves
          </span>
        </div>
        <div className="space-y-1.5">
          {playbook.moves.map((move, idx) => (
            <div key={idx} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-muted/40">
              <ArrowRight size={12} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground leading-snug">{move.action}</p>
                <div className="flex gap-1 mt-1">
                  {[...new Set(move.modeTags)].map(tag => {
                    const mc = MODE_COLORS[tag];
                    return (
                      <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: mc.bg, color: mc.text }}>
                        {mc.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Day 1 Action ── */}
      <div className="px-5 pb-3">
        <div className="px-4 py-3 rounded-lg" style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar size={11} className="text-primary" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
              Day 1 Action
            </span>
          </div>
          <p className="text-[12px] font-bold text-foreground leading-snug">{playbook.dayOneAction}</p>
        </div>
      </div>

      {/* ── Comparable Transformations ── */}
      {playbook.comparables.length > 0 && (
        <div className="px-5 pb-3">
          <div className="rounded-lg p-3" style={{ background: "hsl(var(--muted) / 0.3)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <GitBranch size={11} className="text-muted-foreground" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Comparable Transformations
              </span>
            </div>
            <div className="space-y-1.5">
              {playbook.comparables.map((comp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">{comp.from}</span>
                  <ArrowRight size={10} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] font-bold text-foreground">{comp.to}</span>
                  {comp.example && (
                    <span className="text-[10px] text-muted-foreground italic ml-auto hidden sm:block truncate max-w-[200px]">
                      {comp.example}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Validation & Kill Metric ── */}
      <div className="px-5 pb-3 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-muted/50">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 size={10} style={{ color: "hsl(var(--success))" }} />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Validation Question</span>
          </div>
          <p className="text-[11px] font-semibold text-foreground italic">"{playbook.validationQuestion}"</p>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: "hsl(var(--destructive) / 0.05)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={10} className="text-destructive" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Kill Metric</span>
          </div>
          <p className="text-[11px] font-semibold text-foreground">{playbook.killMetric}</p>
        </div>
      </div>

      {/* ── Expand Toggle ── */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-muted/30 transition-colors border-t border-border"
      >
        <span className="text-[11px] font-bold text-muted-foreground">
          {isExpanded ? "Less detail" : "Industry logic, execution phases & reasoning"}
        </span>
        {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
      </button>

      {/* ── Expanded Section ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Current Industry Logic</span>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{playbook.currentIndustryLogic}</p>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">The Strategic Shift</span>
                <p className="text-sm text-foreground leading-relaxed mt-1 font-medium">{playbook.strategicShift}</p>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Why This Works</span>
                <div className="mt-1.5 space-y-1">
                  {playbook.whyThisWorks.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <TrendingUp size={10} style={{ color: "hsl(var(--success))" }} className="flex-shrink-0" />
                      <span className="text-[12px] text-foreground">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Execution Roadmap</span>
                <div className="mt-2 space-y-0">
                  {playbook.phases.map((p, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-extrabold text-primary">{p.phase}</span>
                        </div>
                        {idx < playbook.phases.length - 1 && (
                          <div className="w-px flex-1 bg-border my-1" />
                        )}
                      </div>
                      <div className="pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-foreground">{p.title}</span>
                          <span className="text-[9px] font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted">{p.duration}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{p.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
