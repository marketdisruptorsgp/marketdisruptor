import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VisualStory } from "@/lib/visualStoryCompiler";
import type { RankedSignal } from "@/lib/signalRanking";
import { normalizeSignalLabel } from "@/lib/visualEnforcementHelpers";
import { ChevronDown } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   SIGNAL SUMMARY — Clean, scannable intelligence overview
   Replaces decorative constellation with actionable grouped list.
   Used for CLUSTERED_INTELLIGENCE and PRIORITIZED_SIGNAL_FIELD.
   ═══════════════════════════════════════════════════════════════ */

const ROLE_META: Record<string, { label: string; color: string; description: string }> = {
  driver:     { label: "Drivers",     color: "hsl(142 55% 32%)",  description: "Forces pushing this forward" },
  constraint: { label: "Constraints", color: "hsl(0 65% 42%)",    description: "Forces holding this back" },
  mechanism:  { label: "Mechanisms",  color: "hsl(28 80% 38%)",   description: "How the system actually works" },
  assumption: { label: "Assumptions", color: "hsl(271 55% 42%)",  description: "Untested beliefs at risk" },
  leverage:   { label: "Leverage",    color: "hsl(229 70% 42%)",  description: "High-impact intervention points" },
  outcome:    { label: "Outcomes",    color: "hsl(160 50% 32%)",  description: "Expected results" },
};

const ROLE_ORDER = ["driver", "constraint", "leverage", "mechanism", "assumption", "outcome"];

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / (max || 1)) * 100, 100);
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

function SignalRow({ signal, maxScore, color, index }: { signal: RankedSignal; maxScore: number; color: string; index: number }) {
  const label = normalizeSignalLabel(signal.label);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="flex items-center gap-3 py-2 px-3 rounded-lg transition-colors hover:bg-muted/40 group"
    >
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <p className="text-sm text-foreground font-semibold flex-1 min-w-0 leading-snug">
        {label}
      </p>
      <div className="w-16 flex-shrink-0">
        <ScoreBar value={signal.score} max={maxScore} color={color} />
      </div>
      <span className="text-xs font-bold text-foreground w-5 text-right flex-shrink-0">
        {signal.score}
      </span>
    </motion.div>
  );
}

function RoleGroup({ role, signals, maxScore, defaultOpen }: { role: string; signals: RankedSignal[]; maxScore: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = ROLE_META[role] || ROLE_META.driver;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
        style={{ background: open ? `${meta.color}06` : "transparent" }}
      >
        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: meta.color }} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-foreground">{meta.label}</span>
          <span className="text-xs text-muted-foreground ml-2">{meta.description}</span>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: `${meta.color}12`, color: meta.color }}>
          {signals.length}
        </span>
        <ChevronDown size={14} className="text-muted-foreground transition-transform flex-shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-0.5">
              {signals.map((s, i) => (
                <SignalRow key={i} signal={s} maxScore={maxScore} color={meta.color} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CinematicConstellation({ story, title }: { story: VisualStory; title: string }) {
  const allSignals = useMemo(() =>
    [...story.drivers, ...story.constraints, ...story.mechanisms, ...story.assumptions, ...story.leverages, ...story.outcomes]
      .sort((a, b) => b.score - a.score),
    [story]
  );

  const maxScore = allSignals[0]?.score || 1;

  // Group by role, only show roles that have signals
  const groups = useMemo(() => {
    const byRole: Record<string, RankedSignal[]> = {};
    for (const s of allSignals) {
      if (!byRole[s.role]) byRole[s.role] = [];
      byRole[s.role].push(s);
    }
    return ROLE_ORDER
      .filter(role => byRole[role]?.length > 0)
      .map(role => ({ role, signals: byRole[role] }));
  }, [allSignals]);

  // Derive a contextual insight from signal distribution
  const topDriverCount = groups.find(g => g.role === "driver")?.signals.length || 0;
  const topConstraintCount = groups.find(g => g.role === "constraint")?.signals.length || 0;
  const topLeverageCount = groups.find(g => g.role === "leverage")?.signals.length || 0;

  const contextInsight = useMemo(() => {
    if (topConstraintCount > topDriverCount + 1) {
      return "This market is constraint-heavy — more forces are holding things back than pushing forward. Focus on which constraints can be broken.";
    }
    if (topDriverCount > topConstraintCount + 2) {
      return "Strong momentum signals detected — the tailwinds significantly outnumber the headwinds. Timing matters here.";
    }
    if (topLeverageCount >= 2) {
      return `${topLeverageCount} high-impact intervention points identified — these are the levers most likely to shift the outcome.`;
    }
    return "The forces shaping this market are balanced — success depends on which constraints you choose to break first.";
  }, [topDriverCount, topConstraintCount, topLeverageCount]);

  if (allSignals.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Header with signal count + context */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.15em] text-foreground">
              {title}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
              {allSignals.length} signals
            </span>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">Score →</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed font-medium">
          {contextInsight}
        </p>
      </div>

      {/* Role groups */}
      <div className="space-y-2">
        {groups.map(({ role, signals }, gi) => (
          <RoleGroup
            key={role}
            role={role}
            signals={signals}
            maxScore={maxScore}
            defaultOpen={gi < 3} // First 3 groups open by default
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
        {groups.map(({ role }) => {
          const meta = ROLE_META[role];
          return (
            <div key={role} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: meta.color }} />
              <span className="text-xs font-semibold text-foreground">{meta.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
