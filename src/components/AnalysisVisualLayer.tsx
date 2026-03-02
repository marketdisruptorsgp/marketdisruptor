import React, { ReactNode, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StructuralVisualList, StructuralVisual } from "./StructuralVisual";
import { ActionPlanList } from "./ActionPlanCard";
import { resolveAdaptiveVisuals } from "@/lib/adaptiveVisualEngine";
import type { AdaptiveVisualResult } from "@/lib/adaptiveVisualEngine";
import type { VisualSpec, ActionPlan } from "@/lib/visualContract";
import { enforceVisualContract } from "@/lib/visualContract";
import type { AnalysisStep } from "@/lib/stepVisualTypes";
import { getStepVisualConfig } from "@/lib/stepVisualTypes";
import { getTopSignals } from "@/lib/signalRanking";
import { ChevronRight, Layers, Cpu, Target, Eye, Shield, Zap, ArrowRight } from "lucide-react";

// Re-export for backward compatibility
export { enforceVisualContract } from "@/lib/visualContract";
export type { VisualSpec, ActionPlan } from "@/lib/visualContract";

/* ═══════════════════════════════════════════════════════════
   UNIVERSAL VISUAL INTELLIGENCE LAYER
   Step-aware, signal-ranked, premium cinematic rendering.
   
   RENDER ORDER (fixed):
   1) Strategic Question Header
   2) Step-Specific Visual (structural model / arena / architecture)
   3) Domain Intelligence Panels (ontology specs)
   4) Action Levers (action plans)
   5) Collapsed Text Depth ("Deep Insight")
   ═══════════════════════════════════════════════════════════ */

const TIER_CONFIG = {
  STRUCTURAL_MODEL: { icon: Cpu, label: "Structural Model", color: "hsl(var(--vi-glow-system))" },
  INSIGHT_MAP: { icon: Eye, label: "Insight Map", color: "hsl(var(--vi-glow-leverage))" },
  INTELLIGENCE_SURFACE: { icon: Layers, label: "Intelligence Surface", color: "hsl(var(--muted-foreground))" },
};

function TierIndicator({ tier, stepLabel }: { tier: AdaptiveVisualResult["tier"]; stepLabel?: string }) {
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${config.color}12` }}>
        <Icon size={11} style={{ color: config.color }} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: config.color }}>
        {stepLabel || config.label}
      </span>
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

/* ── Signal Summary Strip ── */
function SignalStrip({ data }: { data: Record<string, unknown> }) {
  const signals = useMemo(() => getTopSignals(data, 5), [data]);
  if (signals.length === 0) return null;

  const roleColors: Record<string, string> = {
    driver: "hsl(var(--vi-glow-outcome))",
    constraint: "hsl(var(--vi-glow-system))",
    mechanism: "hsl(var(--vi-glow-mechanism))",
    leverage: "hsl(var(--vi-glow-leverage))",
    outcome: "hsl(var(--vi-glow-outcome))",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="flex flex-wrap gap-1.5 mb-3"
    >
      {signals.map((s, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
          style={{
            background: `${roleColors[s.role] || "hsl(var(--muted-foreground))"}10`,
            color: roleColors[s.role] || "hsl(var(--muted-foreground))",
            border: `1px solid ${roleColors[s.role] || "hsl(var(--muted-foreground))"}20`,
          }}
          title={`Impact: ${s.impact} · Confidence: ${s.confidence} · Score: ${s.score}`}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: roleColors[s.role] || "hsl(var(--muted-foreground))" }} />
          {s.label.length > 40 ? s.label.slice(0, 38) + "…" : s.label}
        </span>
      ))}
    </motion.div>
  );
}

/* ── Adversarial Arena Renderer (Step 5) ── */
function AdversarialArena({ data }: { data: Record<string, unknown> }) {
  const redSignals = useMemo(() => getTopSignals(data, 4, "constraint"), [data]);
  const greenSignals = useMemo(() => getTopSignals(data, 4, "driver"), [data]);

  const redCount = redSignals.length;
  const greenCount = greenSignals.length;
  const total = redCount + greenCount || 1;
  const viability = greenCount / total;
  const verdict = viability > 0.6 ? "Resilient" : viability > 0.35 ? "Conditional" : "Breaks";
  const verdictColor = verdict === "Resilient"
    ? "hsl(var(--vi-glow-outcome))"
    : verdict === "Conditional"
      ? "hsl(var(--vi-glow-mechanism))"
      : "hsl(var(--vi-glow-system))";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--vi-surface-elevated))",
        border: "1px solid hsl(var(--border))",
        boxShadow: "var(--shadow-vi-panel)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Adversarial Arena
        </p>
        {/* Viability Ring */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: `conic-gradient(${verdictColor} ${viability * 360}deg, hsl(var(--border) / 0.3) 0deg)`,
              boxShadow: `0 0 20px ${verdictColor}30`,
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--vi-surface-elevated))" }}
            >
              <span className="text-xs font-extrabold" style={{ color: verdictColor }}>
                {Math.round(viability * 100)}%
              </span>
            </div>
          </div>
        </div>
        <span
          className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest"
          style={{ color: verdictColor, background: `${verdictColor}12`, border: `1px solid ${verdictColor}25` }}
        >
          {verdict}
        </span>
      </div>

      {/* Forces Grid */}
      <div className="grid grid-cols-2 gap-0 border-t" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
        {/* Red Team */}
        <div className="p-4 space-y-2" style={{ borderRight: "1px solid hsl(var(--border) / 0.5)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Shield size={11} style={{ color: "hsl(var(--vi-glow-system))" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--vi-glow-system))" }}>
              Red Team
            </span>
          </div>
          {redSignals.length > 0 ? redSignals.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex items-start gap-2"
            >
              <ArrowRight size={10} className="mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--vi-glow-system))" }} />
              <span className="text-[11px] font-semibold text-foreground leading-snug">
                {s.label.length > 50 ? s.label.slice(0, 48) + "…" : s.label}
              </span>
            </motion.div>
          )) : (
            <p className="text-[10px] text-muted-foreground italic">No critical threats detected</p>
          )}
        </div>

        {/* Green Team */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={11} style={{ color: "hsl(var(--vi-glow-outcome))" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--vi-glow-outcome))" }}>
              Green Team
            </span>
          </div>
          {greenSignals.length > 0 ? greenSignals.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex items-start gap-2"
            >
              <ArrowRight size={10} className="mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--vi-glow-outcome))" }} />
              <span className="text-[11px] font-semibold text-foreground leading-snug">
                {s.label.length > 50 ? s.label.slice(0, 48) + "…" : s.label}
              </span>
            </motion.div>
          )) : (
            <p className="text-[10px] text-muted-foreground italic">No supporting evidence</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Ontology Panel ── */
function OntologyPanel({ spec }: { spec: VisualSpec }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--vi-surface-elevated))",
        border: "1px solid hsl(var(--border))",
        boxShadow: "var(--shadow-vi-panel)",
      }}
    >
      {spec.title && (
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
            {spec.title}
          </span>
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
      {specs.map((spec, i) => (
        <OntologyPanel key={`ontology-${i}`} spec={spec} />
      ))}
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
  const isArena = stepConfig.type === "adversarial_arena";

  const hasCanonical = !!result.canonicalSpec;
  const hasOntologyPanels = result.ontologySpecs.length > 0;
  const hasSurface = result.surfaceSpecs.length > 0;
  const hasVisuals = hasCanonical || hasOntologyPanels || hasSurface || isArena;

  return (
    <div className="space-y-4">
      {/* Strategic Question */}
      {step && step !== "generic" && (
        <StrategicQuestion question={stepConfig.question} />
      )}

      {/* Tier indicator */}
      {hasVisuals && <TierIndicator tier={result.tier} stepLabel={stepConfig.label} />}

      {/* Signal summary strip — ranked signals */}
      <SignalStrip data={analysis} />

      {/* 1️⃣ STEP-SPECIFIC VISUAL */}
      {isArena ? (
        <AdversarialArena data={analysis} />
      ) : hasCanonical ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <StructuralVisualList specs={[result.canonicalSpec!]} />
        </motion.div>
      ) : hasSurface && !hasCanonical ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <MultiPanelDashboard specs={result.surfaceSpecs} />
        </motion.div>
      ) : null}

      {/* 2️⃣ DOMAIN INTELLIGENCE PANELS */}
      {hasOntologyPanels && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <MultiPanelDashboard specs={result.ontologySpecs} />
        </motion.div>
      )}

      {/* 3️⃣ ACTION LEVERS */}
      {result.actionPlans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <ActionPlanList plans={result.actionPlans} />
        </motion.div>
      )}

      {/* 4️⃣ COLLAPSED TEXT DEPTH — "Deep Insight" */}
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
