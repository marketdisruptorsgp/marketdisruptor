/**
 * PlaybookCard — Individual Transformation Path card
 *
 * Shows: Thesis → Constraint Logic → Moves → Day 1 Action → Impact Score
 * Expands to: Industry Logic, Phases, Evidence Trail, Kill Metric
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, Star, Zap, Target, TrendingUp,
  ArrowRight, Shield, AlertTriangle, Calendar, CheckCircle2,
} from "lucide-react";
import type { TransformationPlaybook, EvidenceMode } from "@/lib/playbookEngine";
import { getCategoryLabel, getArchetypeLabel } from "@/lib/playbookEngine";

interface PlaybookCardProps {
  playbook: TransformationPlaybook;
  rank: number;
}

const MODE_COLORS: Record<EvidenceMode, { bg: string; text: string; label: string }> = {
  product: { bg: "hsl(var(--primary) / 0.1)", text: "hsl(var(--primary))", label: "Product" },
  service: { bg: "hsl(var(--warning) / 0.1)", text: "hsl(var(--warning))", label: "Service" },
  business_model: { bg: "hsl(var(--success) / 0.1)", text: "hsl(var(--success))", label: "Business Model" },
};

function ImpactBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-extrabold" style={{ color }}>{value}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value * 10}%`, background: color }}
        />
      </div>
    </div>
  );
}

export const PlaybookCard = memo(function PlaybookCard({ playbook, rank }: PlaybookCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const archLabel = getArchetypeLabel(playbook.archetype);
  const catLabel = getCategoryLabel(playbook.category);

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
              {playbook.isRecommended && (
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
          <div className="flex-shrink-0 flex flex-col items-center">
            <span className="text-2xl font-black text-primary">{playbook.impact.leverageScore}</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Leverage</span>
          </div>
        </div>
      </div>

      {/* ── Strategic Thesis ── */}
      <div className="px-5 pb-3">
        <p className="text-sm text-foreground leading-relaxed font-medium">
          {playbook.strategicThesis}
        </p>
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
              <span key={idx} className="text-[11px] font-bold px-2 py-1 rounded-md bg-destructive/8 text-destructive capitalize">
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

      {/* ── Impact Scores ── */}
      <div className="px-5 pb-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <ImpactBar label="Revenue" value={playbook.impact.revenueExpansion} color="hsl(var(--success))" />
          <ImpactBar label="Margin" value={playbook.impact.marginImprovement} color="hsl(var(--primary))" />
          <ImpactBar label="Capital Efficiency" value={playbook.impact.capitalEfficiency} color="hsl(var(--warning))" />
          <ImpactBar label="Execution Difficulty" value={playbook.impact.executionDifficulty} color="hsl(var(--destructive))" />
        </div>
      </div>

      {/* ── Validation & Kill Metric ── */}
      <div className="px-5 pb-3 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-muted/50">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 size={10} className="text-success" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Validation Question</span>
          </div>
          <p className="text-[11px] font-semibold text-foreground italic">"{playbook.validationQuestion}"</p>
        </div>
        <div className="px-3 py-2 rounded-lg bg-destructive/5">
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
              {/* Industry Logic */}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Current Industry Logic</span>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{playbook.currentIndustryLogic}</p>
              </div>

              {/* Strategic Shift */}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">The Strategic Shift</span>
                <p className="text-sm text-foreground leading-relaxed mt-1 font-medium">{playbook.strategicShift}</p>
              </div>

              {/* Why This Works */}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Why This Works</span>
                <div className="mt-1.5 space-y-1">
                  {playbook.whyThisWorks.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <TrendingUp size={10} className="text-success flex-shrink-0" />
                      <span className="text-[12px] text-foreground">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Phases */}
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
