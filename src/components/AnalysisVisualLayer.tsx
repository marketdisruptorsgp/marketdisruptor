import React, { ReactNode, useMemo } from "react";
import { motion } from "framer-motion";
import { StructuralVisualList, StructuralVisual } from "./StructuralVisual";
import { ActionPlanList } from "./ActionPlanCard";
import { resolveAdaptiveVisuals } from "@/lib/adaptiveVisualEngine";
import type { AdaptiveVisualResult } from "@/lib/adaptiveVisualEngine";
import type { VisualSpec, ActionPlan } from "@/lib/visualContract";
import { enforceVisualContract } from "@/lib/visualContract";
import type { AnalysisStep } from "@/lib/stepVisualTypes";
import { getStepVisualConfig } from "@/lib/stepVisualTypes";
import { extractAndRankSignals, getTopSignals } from "@/lib/signalRanking";
import type { RankedSignal } from "@/lib/signalRanking";
import { compileVisualStory } from "@/lib/visualStoryCompiler";
import type { VisualStory, VisualStoryType } from "@/lib/visualStoryCompiler";
import { validateVisualStory, normalizeSignalLabel } from "@/lib/visualEnforcementHelpers";
import { ChevronRight, Layers, Cpu, Target, Eye, Shield, Zap, ArrowRight, AlertTriangle, Activity, GitBranch, BarChart3 } from "lucide-react";

// Re-export for backward compatibility
export { enforceVisualContract } from "@/lib/visualContract";
export type { VisualSpec, ActionPlan } from "@/lib/visualContract";

/* ═══════════════════════════════════════════════════════════
   UNIVERSAL VISUAL INTELLIGENCE LAYER
   Signal-compiled, step-aware, premium cinematic rendering.
   
   RENDER ORDER (fixed):
   1) Strategic Question Header
   2) Story-Compiled Visual (auto-selected grammar)
   3) Structural Model (if canonical exists and story ≠ arena)
   4) Domain Intelligence Panels
   5) Action Levers
   6) Collapsed Text Depth ("Deep Insight")
   ═══════════════════════════════════════════════════════════ */

/* ── Story type icons & colors ── */
const STORY_STYLE: Record<VisualStoryType, { icon: typeof Cpu; color: string }> = {
  SURVIVAL_JUDGMENT:       { icon: Shield,       color: "hsl(var(--vi-glow-system))" },
  SYSTEM_TENSION:          { icon: Activity,     color: "hsl(var(--vi-glow-mechanism))" },
  VALUE_FLOW:              { icon: GitBranch,    color: "hsl(var(--vi-glow-leverage))" },
  FRAGILITY_STRUCTURE:     { icon: AlertTriangle,color: "hsl(var(--vi-glow-system))" },
  CLUSTERED_INTELLIGENCE:  { icon: Layers,       color: "hsl(var(--muted-foreground))" },
  PRIORITIZED_SIGNAL_FIELD:{ icon: BarChart3,    color: "hsl(var(--vi-glow-outcome))" },
};

/* ── Story Indicator Badge ── */
function StoryIndicator({ story }: { story: VisualStory }) {
  const style = STORY_STYLE[story.type];
  const Icon = style.icon;
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${style.color}12` }}>
        <Icon size={11} style={{ color: style.color }} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: style.color }}>
        {story.label}
      </span>
      <span className="text-[9px] text-muted-foreground/60 font-medium">{story.description}</span>
    </div>
  );
}

/* ── Strategic Question Banner ── */
function StrategicQuestion({ question }: { question: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl px-5 py-3 mb-4"
      style={{
        background: "hsl(var(--vi-surface-elevated))",
        border: "1px solid hsl(var(--border) / 0.5)",
      }}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
        Strategic Question
      </p>
      <p className="text-sm font-bold text-foreground leading-snug">{question}</p>
    </motion.div>
  );
}

/* ── Signal Chip ── */
const ROLE_CHIP_COLORS: Record<string, string> = {
  driver: "hsl(var(--vi-glow-outcome))",
  constraint: "hsl(var(--vi-glow-system))",
  mechanism: "hsl(var(--vi-glow-mechanism))",
  assumption: "hsl(38 92% 45%)",
  leverage: "hsl(var(--vi-glow-leverage))",
  outcome: "hsl(var(--vi-glow-outcome))",
};

function SignalChip({ signal }: { signal: RankedSignal }) {
  const c = ROLE_CHIP_COLORS[signal.role] || "hsl(var(--muted-foreground))";
  const label = normalizeSignalLabel(signal.label);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
      style={{ background: `${c}10`, color: c, border: `1px solid ${c}20` }}
      title={`${signal.role} · Impact ${signal.impact} · Confidence ${signal.confidence} · Score ${signal.score}`}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════
   STORY-SPECIFIC RENDERERS
   ══════════════════════════════════════════════════ */

/* ── Adversarial Arena (stressTest) ── */
function AdversarialArena({ story }: { story: VisualStory }) {
  const red = [...story.constraints, ...story.assumptions];
  const green = [...story.drivers, ...story.leverages];
  const total = red.length + green.length || 1;
  const viability = green.length / total;
  const verdictLabel = story.verdict.level === "strong" ? "Resilient"
    : story.verdict.level === "conditional" ? "Conditional"
    : story.verdict.level === "weak" ? "Breaks" : "Insufficient Data";
  const vc = story.verdict.level === "strong"
    ? "hsl(var(--vi-glow-outcome))"
    : story.verdict.level === "conditional" ? "hsl(var(--vi-glow-mechanism))" : "hsl(var(--vi-glow-system))";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--vi-surface-elevated))", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-vi-panel)" }}
    >
      <div className="px-5 pt-4 pb-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Survival Judgment</p>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: `conic-gradient(${vc} ${viability * 360}deg, hsl(var(--border) / 0.3) 0deg)`, boxShadow: `0 0 20px ${vc}30` }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--vi-surface-elevated))" }}>
              <span className="text-xs font-extrabold" style={{ color: vc }}>{Math.round(viability * 100)}%</span>
            </div>
          </div>
        </div>
        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest"
          style={{ color: vc, background: `${vc}12`, border: `1px solid ${vc}25` }}>{verdictLabel}</span>
        <p className="text-[10px] text-muted-foreground mt-1.5 max-w-xs mx-auto">{story.verdict.summary}</p>
      </div>
      <div className="grid grid-cols-2 gap-0 border-t" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
        <ForceColumn signals={red} label="Red Team" icon={Shield} color="hsl(var(--vi-glow-system))" side="left" />
        <ForceColumn signals={green} label="Green Team" icon={Zap} color="hsl(var(--vi-glow-outcome))" side="right" />
      </div>
    </motion.div>
  );
}

function ForceColumn({ signals, label, icon: Icon, color, side }: {
  signals: RankedSignal[]; label: string; icon: typeof Shield; color: string; side: "left" | "right";
}) {
  return (
    <div className="p-4 space-y-2" style={side === "left" ? { borderRight: "1px solid hsl(var(--border) / 0.5)" } : {}}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={11} style={{ color }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</span>
      </div>
      {signals.length > 0 ? signals.slice(0, 5).map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: side === "left" ? -8 : 8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.05 }} className="flex items-start gap-2">
          <ArrowRight size={10} className="mt-0.5 flex-shrink-0" style={{ color }} />
          <span className="text-[11px] font-semibold text-foreground leading-snug">
            {s.label.length > 50 ? s.label.slice(0, 48) + "…" : s.label}
          </span>
        </motion.div>
      )) : <p className="text-[10px] text-muted-foreground italic">No signals detected</p>}
    </div>
  );
}

/* ── System Tension Map ── */
function SystemTensionMap({ story }: { story: VisualStory }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--vi-surface-elevated))", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-vi-panel)" }}
    >
      <div className="px-5 pt-4 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">System Tension Map</p>
      </div>
      <div className="grid grid-cols-3 gap-0" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
        {/* Drivers */}
        <div className="p-4 space-y-2" style={{ borderRight: "1px solid hsl(var(--border) / 0.5)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--vi-glow-outcome))" }}>Drivers</p>
          {story.drivers.slice(0, 4).map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <SignalChip signal={s} />
            </motion.div>
          ))}
          {story.drivers.length === 0 && <p className="text-[10px] text-muted-foreground italic">None</p>}
        </div>
        {/* Mechanisms — center column */}
        <div className="p-4 space-y-2 flex flex-col items-center" style={{ borderRight: "1px solid hsl(var(--border) / 0.5)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--vi-glow-mechanism))" }}>Mechanisms</p>
          {story.mechanisms.slice(0, 3).map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <SignalChip signal={s} />
            </motion.div>
          ))}
          {story.leverages.slice(0, 2).map((s, i) => (
            <motion.div key={`l${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.05 }}>
              <SignalChip signal={s} />
            </motion.div>
          ))}
          {story.mechanisms.length === 0 && story.leverages.length === 0 && <p className="text-[10px] text-muted-foreground italic">None</p>}
        </div>
        {/* Constraints */}
        <div className="p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--vi-glow-system))" }}>Constraints</p>
          {story.constraints.slice(0, 4).map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <SignalChip signal={s} />
            </motion.div>
          ))}
          {story.constraints.length === 0 && <p className="text-[10px] text-muted-foreground italic">None</p>}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Value Flow ── */
function ValueFlowVisual({ story }: { story: VisualStory }) {
  const chain = [...story.mechanisms.slice(0, 5), ...story.outcomes.slice(0, 2)];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="rounded-xl p-5"
      style={{ background: "hsl(var(--vi-surface-elevated))", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-vi-panel)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Value Flow Architecture</p>
      <div className="flex flex-wrap items-center gap-2">
        {chain.map((s, i) => (
          <React.Fragment key={i}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }} className="flex-shrink-0">
              <SignalChip signal={s} />
            </motion.div>
            {i < chain.length - 1 && (
              <ArrowRight size={12} className="flex-shrink-0" style={{ color: "hsl(var(--vi-glow-mechanism))" }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Fragility Map ── */
function FragilityMap({ story }: { story: VisualStory }) {
  const sorted = [...story.assumptions, ...story.constraints].sort((a, b) => b.score - a.score);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="rounded-xl p-5"
      style={{ background: "hsl(var(--vi-surface-elevated))", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-vi-panel)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Fragility Structure</p>
      <p className="text-[10px] text-muted-foreground mb-3">{story.verdict.summary}</p>
      <div className="space-y-2">
        {sorted.slice(0, 6).map((s, i) => {
          const barWidth = Math.min(100, (s.score / (sorted[0]?.score || 1)) * 100);
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground">
                  {s.label.length > 45 ? s.label.slice(0, 43) + "…" : s.label}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground">{s.score}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border) / 0.3)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, hsl(var(--vi-glow-system)), hsl(var(--vi-glow-mechanism)))` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ── Cluster Landscape / Prioritized Signal Field ── */
function SignalField({ story, title }: { story: VisualStory; title: string }) {
  const all = [...story.drivers, ...story.constraints, ...story.mechanisms, ...story.assumptions, ...story.leverages, ...story.outcomes]
    .sort((a, b) => b.score - a.score).slice(0, 8);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="rounded-xl p-5"
      style={{ background: "hsl(var(--vi-surface-elevated))", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-vi-panel)" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {all.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}>
            <SignalChip signal={s} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Story Renderer Dispatcher ── */
function StoryVisual({ story }: { story: VisualStory }) {
  switch (story.type) {
    case "SURVIVAL_JUDGMENT": return <AdversarialArena story={story} />;
    case "SYSTEM_TENSION": return <SystemTensionMap story={story} />;
    case "VALUE_FLOW": return <ValueFlowVisual story={story} />;
    case "FRAGILITY_STRUCTURE": return <FragilityMap story={story} />;
    case "CLUSTERED_INTELLIGENCE": return <SignalField story={story} title="Intelligence Landscape" />;
    case "PRIORITIZED_SIGNAL_FIELD": return <SignalField story={story} title="Priority Signals" />;
  }
}

/* ── Ontology Panel ── */
function OntologyPanel({ spec }: { spec: VisualSpec }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--vi-surface-elevated))", border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-vi-panel)" }}
    >
      {spec.title && (
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>{spec.title}</span>
        </div>
      )}
      <div className="px-3 pb-3">
        <StructuralVisual spec={spec} />
      </div>
    </motion.div>
  );
}

function MultiPanelDashboard({ specs }: { specs: VisualSpec[] }) {
  if (specs.length === 0) return null;
  if (specs.length === 1) return <OntologyPanel spec={specs[0]} />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {specs.map((spec, i) => <OntologyPanel key={`ontology-${i}`} spec={spec} />)}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT: AnalysisVisualLayer
   ═══════════════════════════════════════════ */

export function AnalysisVisualLayer({
  analysis,
  children,
  suppressText = true,
  step,
}: {
  analysis: Record<string, unknown>;
  children: ReactNode;
  suppressText?: boolean;
  step?: AnalysisStep;
}) {
  const result = resolveAdaptiveVisuals(analysis);
  const stepConfig = getStepVisualConfig(step);

  // Compile visual story from ranked signals
  const rankedSignals = useMemo(() => extractAndRankSignals(analysis), [analysis]);
  const story = useMemo(() => compileVisualStory(rankedSignals, step), [rankedSignals, step]);
  const validation = useMemo(() => validateVisualStory(story, rankedSignals), [story, rankedSignals]);
  
  // Enforcement gate: only render story visual if validation passes
  const hasStorySignals = rankedSignals.length >= 2 && validation.valid;

  const hasCanonical = !!result.canonicalSpec;
  const hasOntologyPanels = result.ontologySpecs.length > 0;
  const hasSurface = result.surfaceSpecs.length > 0;
  const hasVisuals = hasCanonical || hasOntologyPanels || hasSurface || hasStorySignals;

  return (
    <div className="space-y-4">
      {/* Strategic Question — from story compiler (insight-driven) or step config fallback */}
      {hasStorySignals ? (
        <StrategicQuestion question={story.strategicQuestion} />
      ) : step && step !== "generic" ? (
        <StrategicQuestion question={stepConfig.question} />
      ) : null}

      {/* Story indicator — tells user what grammar was selected */}
      {hasStorySignals && <StoryIndicator story={story} />}

      {/* 1️⃣ STORY-COMPILED VISUAL — auto-selected grammar */}
      {hasStorySignals && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <StoryVisual story={story} />
        </motion.div>
      )}

      {/* 2️⃣ STRUCTURAL MODEL — canonical system model (if not arena, which already shows forces) */}
      {hasCanonical && story.type !== "SURVIVAL_JUDGMENT" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
          <StructuralVisualList specs={[result.canonicalSpec!]} />
        </motion.div>
      )}

      {/* 2b SURFACE fallback when no canonical */}
      {hasSurface && !hasCanonical && !hasStorySignals && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 }}>
          <MultiPanelDashboard specs={result.surfaceSpecs} />
        </motion.div>
      )}

      {/* 3️⃣ DOMAIN INTELLIGENCE PANELS */}
      {hasOntologyPanels && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.1 }}>
          <MultiPanelDashboard specs={result.ontologySpecs} />
        </motion.div>
      )}

      {/* 4️⃣ ACTION LEVERS */}
      {result.actionPlans.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }}>
          <ActionPlanList plans={result.actionPlans} />
        </motion.div>
      )}

      {/* 5️⃣ COLLAPSED TEXT DEPTH — "Deep Insight" */}
      {suppressText && hasVisuals ? (
        <details className="group mt-2">
          <summary
            className="cursor-pointer select-none inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold text-muted-foreground/70 transition-all hover:text-foreground hover:bg-muted/50"
            style={{ border: "1px solid transparent" }}
          >
            <ChevronRight size={11} className="transition-transform duration-200 group-open:rotate-90" />
            Deep Insight
            <span className="text-[9px] font-normal opacity-60">Full analysis text</span>
          </summary>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 space-y-4 pl-4"
            style={{ borderLeft: "2px solid hsl(var(--border) / 0.4)" }}
          >
            {children}
          </motion.div>
        </details>
      ) : (
        children
      )}
    </div>
  );
}
