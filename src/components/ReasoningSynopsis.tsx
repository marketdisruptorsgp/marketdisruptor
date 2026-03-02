import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip,
} from "recharts";
import { ArrowRight, Brain, Eye, Scale, Target, TrendingUp, AlertTriangle, Gauge } from "lucide-react";

/* ═══════════════════════════════════════════════════
   REASONING SYNOPSIS — Dedicated Tab Component
   Renders 4 visual modes:
   1. Lens Influence Radar
   2. Causal Flow Diagram
   3. Decision Weight Bars
   4. Structured Text
   ═══════════════════════════════════════════════════ */

interface CausalRelationship {
  cause: string;
  effect: string;
  mechanism: string;
}

interface DecisionDriver {
  factor: string;
  weight: "high" | "medium";
  rationale: string;
}

interface SynopsisData {
  problem_framing: {
    objective_interpretation: string;
    success_criteria: string[];
  };
  lens_influence: {
    lens_name: string;
    prioritized_factors: string[];
    deprioritized_factors: string[];
    alternative_lens_impact: string;
  };
  evaluation_path: {
    dimensions_examined: string[];
    evaluation_logic: string;
  };
  core_causal_logic: {
    primary_relationships: CausalRelationship[];
    dominant_mechanism: string;
  };
  decision_drivers: DecisionDriver[];
  confidence_sensitivity: {
    overall_confidence: "high" | "medium" | "low";
    confidence_score: number;
    most_sensitive_variable: string;
    sensitivity_explanation?: string;
  };
}

/* ── Color tokens ── */
const COLORS = {
  prioritized: "hsl(var(--vi-glow-outcome))",
  deprioritized: "hsl(var(--vi-glow-system))",
  mechanism: "hsl(var(--vi-glow-mechanism))",
  leverage: "hsl(var(--vi-glow-leverage))",
  muted: "hsl(var(--muted-foreground))",
  surface: "hsl(var(--vi-surface-elevated))",
  border: "hsl(var(--border))",
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "hsl(var(--vi-glow-outcome))",
  medium: "hsl(var(--vi-glow-mechanism))",
  low: "hsl(var(--vi-glow-system))",
};

/* ── Section wrapper ── */
function SynopsisCard({ title, icon: Icon, children, delay = 0 }: {
  title: string; icon: typeof Brain; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="rounded-xl p-4"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${COLORS.mechanism}12` }}>
          <Icon size={11} style={{ color: COLORS.mechanism }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.muted }}>
          {title}
        </span>
      </div>
      {children}
    </motion.div>
  );
}

/* ═══ 1. LENS INFLUENCE RADAR ═══ */
function LensInfluenceRadar({ synopsis }: { synopsis: SynopsisData }) {
  const allFactors = useMemo(() => {
    const prioritized = synopsis.lens_influence.prioritized_factors.map(f => ({
      dimension: f.length > 18 ? f.slice(0, 16) + "…" : f,
      full: f,
      value: 85,
      type: "prioritized",
    }));
    const deprioritized = synopsis.lens_influence.deprioritized_factors.map(f => ({
      dimension: f.length > 18 ? f.slice(0, 16) + "…" : f,
      full: f,
      value: 30,
      type: "deprioritized",
    }));
    return [...prioritized, ...deprioritized];
  }, [synopsis]);

  if (allFactors.length < 3) return null;

  return (
    <SynopsisCard title="Lens Influence" icon={Eye} delay={0}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-bold text-foreground">
          Active: {synopsis.lens_influence.lens_name}
        </span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={allFactors} cx="50%" cy="50%" outerRadius="72%">
            <PolarGrid stroke="hsl(var(--border) / 0.4)" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            />
            <Radar
              dataKey="value"
              stroke={COLORS.prioritized}
              fill={COLORS.prioritized}
              fillOpacity={0.15}
              strokeWidth={1.5}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: COLORS.prioritized }} />
          <span className="text-[9px] font-semibold text-muted-foreground">Amplified</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: COLORS.deprioritized }} />
          <span className="text-[9px] font-semibold text-muted-foreground">Suppressed</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
        {synopsis.lens_influence.alternative_lens_impact}
      </p>
    </SynopsisCard>
  );
}

/* ═══ 2. CAUSAL FLOW DIAGRAM ═══ */
function CausalFlowDiagram({ synopsis }: { synopsis: SynopsisData }) {
  const relationships = synopsis.core_causal_logic.primary_relationships;
  if (!relationships || relationships.length === 0) return null;

  return (
    <SynopsisCard title="Causal Logic" icon={TrendingUp} delay={0.05}>
      <div className="space-y-3">
        {relationships.map((rel, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="flex items-center gap-2 flex-wrap"
          >
            {/* Cause */}
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
              style={{ background: `${COLORS.deprioritized}12`, color: COLORS.deprioritized, border: `1px solid ${COLORS.deprioritized}25` }}
            >
              {rel.cause}
            </span>
            {/* Arrow + mechanism */}
            <div className="flex items-center gap-1">
              <ArrowRight size={10} style={{ color: COLORS.mechanism }} />
              <span className="text-[9px] font-medium italic" style={{ color: COLORS.mechanism }}>
                {rel.mechanism.length > 35 ? rel.mechanism.slice(0, 33) + "…" : rel.mechanism}
              </span>
              <ArrowRight size={10} style={{ color: COLORS.mechanism }} />
            </div>
            {/* Effect */}
            <span
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
              style={{ background: `${COLORS.prioritized}12`, color: COLORS.prioritized, border: `1px solid ${COLORS.prioritized}25` }}
            >
              {rel.effect}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 pt-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Dominant Mechanism</p>
        <p className="text-[11px] font-semibold text-foreground leading-snug">
          {synopsis.core_causal_logic.dominant_mechanism}
        </p>
      </div>
    </SynopsisCard>
  );
}

/* ═══ 3. DECISION WEIGHT BARS ═══ */
function DecisionWeightBars({ synopsis }: { synopsis: SynopsisData }) {
  const drivers = synopsis.decision_drivers;
  if (!drivers || drivers.length === 0) return null;

  const data = drivers.map((d, i) => ({
    name: d.factor.length > 28 ? d.factor.slice(0, 26) + "…" : d.factor,
    full: d.factor,
    value: d.weight === "high" ? 90 : 55,
    rationale: d.rationale,
    weight: d.weight,
  }));

  return (
    <SynopsisCard title="Decision Drivers" icon={Scale} delay={0.1}>
      <div className="h-[140px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={10}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg px-3 py-2 text-[10px] max-w-[200px]"
                    style={{ background: "hsl(var(--popover))", border: `1px solid ${COLORS.border}`, color: "hsl(var(--popover-foreground))" }}>
                    <p className="font-bold mb-0.5">{d.full}</p>
                    <p className="text-muted-foreground">{d.rationale}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.weight === "high" ? COLORS.prioritized : COLORS.mechanism} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm" style={{ background: COLORS.prioritized }} />
          <span className="text-[9px] font-semibold text-muted-foreground">High influence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm" style={{ background: COLORS.mechanism }} />
          <span className="text-[9px] font-semibold text-muted-foreground">Medium influence</span>
        </div>
      </div>
    </SynopsisCard>
  );
}

/* ═══ 4. STRUCTURED TEXT — Problem Framing + Evaluation + Confidence ═══ */
function StructuredTextSynopsis({ synopsis }: { synopsis: SynopsisData }) {
  const cc = CONFIDENCE_COLOR[synopsis.confidence_sensitivity.overall_confidence] || COLORS.muted;

  return (
    <div className="space-y-4">
      {/* Problem Framing */}
      <SynopsisCard title="Problem Framing" icon={Target} delay={0}>
        <p className="text-[12px] font-semibold text-foreground leading-snug mb-2">
          {synopsis.problem_framing.objective_interpretation}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {synopsis.problem_framing.success_criteria.map((c, i) => (
            <span key={i} className="px-2 py-0.5 rounded-md text-[9px] font-semibold"
              style={{ background: `${COLORS.mechanism}10`, color: COLORS.mechanism, border: `1px solid ${COLORS.mechanism}20` }}>
              {c}
            </span>
          ))}
        </div>
      </SynopsisCard>

      {/* Evaluation Path */}
      <SynopsisCard title="Evaluation Path" icon={Brain} delay={0.05}>
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {synopsis.evaluation_path.dimensions_examined.map((d, i) => (
            <React.Fragment key={i}>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground">
                {d}
              </span>
              {i < synopsis.evaluation_path.dimensions_examined.length - 1 && (
                <ArrowRight size={9} className="text-muted-foreground/40" />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {synopsis.evaluation_path.evaluation_logic}
        </p>
      </SynopsisCard>

      {/* Confidence + Sensitivity */}
      <SynopsisCard title="Confidence & Sensitivity" icon={Gauge} delay={0.1}>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: `conic-gradient(${cc} ${(synopsis.confidence_sensitivity.confidence_score / 100) * 360}deg, hsl(var(--border) / 0.3) 0deg)` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: COLORS.surface }}>
                <span className="text-[11px] font-extrabold" style={{ color: cc }}>
                  {synopsis.confidence_sensitivity.confidence_score}
                </span>
              </div>
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest"
                style={{ color: cc, background: `${cc}12`, border: `1px solid ${cc}25` }}>
                {synopsis.confidence_sensitivity.overall_confidence}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-start gap-1.5">
            <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" style={{ color: COLORS.deprioritized }} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Most Sensitive Variable</p>
              <p className="text-[11px] font-semibold text-foreground">
                {synopsis.confidence_sensitivity.most_sensitive_variable}
              </p>
            </div>
          </div>
          {synopsis.confidence_sensitivity.sensitivity_explanation && (
            <p className="text-[10px] text-muted-foreground leading-relaxed pl-4">
              {synopsis.confidence_sensitivity.sensitivity_explanation}
            </p>
          )}
        </div>
      </SynopsisCard>
    </div>
  );
}

/* ═══ MAIN EXPORT ═══ */
export function ReasoningSynopsis({ data }: { data: unknown }) {
  const synopsis = data as SynopsisData | undefined;

  if (!synopsis || !synopsis.problem_framing) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <Brain size={20} className="mx-auto mb-2 text-muted-foreground/40" />
        <p className="text-[11px] font-semibold text-muted-foreground">
          Reasoning Synopsis not available for this analysis.
        </p>
        <p className="text-[9px] text-muted-foreground/60 mt-1">
          Run a new analysis to generate the reasoning trace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LensInfluenceRadar synopsis={synopsis} />
        <CausalFlowDiagram synopsis={synopsis} />
      </div>
      <DecisionWeightBars synopsis={synopsis} />
      {/* Structured text sections */}
      <StructuredTextSynopsis synopsis={synopsis} />
    </div>
  );
}
