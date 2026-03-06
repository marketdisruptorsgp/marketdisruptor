/**
 * VISUAL INTELLIGENCE COMPONENTS — Phase 4
 *
 * Transform text-heavy analysis into visual formats:
 *   - ConstraintBlock: structural constraint with impact bar
 *   - LeverageIndicator: leverage point with visual scoring
 *   - SignalCluster: aggregated signal groups
 *   - SignalPillRow: inline signal pill tags
 *   - ImpactMeter: compact horizontal impact gauge
 *   - ConfidenceBadge: confidence level indicator
 *   - CausalChainVisual: mini causal flow visualization
 */

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, Zap, TrendingUp, Shield, Target,
  ArrowRight, MessageSquare, ChevronDown,
} from "lucide-react";
import { useState } from "react";

/* ═══════════════════════════════════════════════════════
   1. IMPACT METER — Compact horizontal gauge (1-10)
   ═══════════════════════════════════════════════════════ */

interface ImpactMeterProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
}

function getImpactColor(value: number, max: number): string {
  const pct = value / max;
  if (pct >= 0.8) return "hsl(0 72% 50%)";
  if (pct >= 0.6) return "hsl(38 92% 50%)";
  if (pct >= 0.4) return "hsl(var(--primary))";
  return "hsl(152 60% 44%)";
}

export function ImpactMeter({ value, max = 10, label, showValue = true, size = "sm", className }: ImpactMeterProps) {
  const pct = Math.min((value / max) * 100, 100);
  const color = getImpactColor(value, max);
  const h = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={cn("space-y-1", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>}
          {showValue && <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}/{max}</span>}
        </div>
      )}
      <div className={cn("w-full rounded-full overflow-hidden bg-muted", h)}>
        <motion.div
          className={cn("rounded-full", h)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   2. CONFIDENCE BADGE — Visual confidence indicator
   ═══════════════════════════════════════════════════════ */

const CONF_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high:   { bg: "hsl(152 60% 44% / 0.12)", text: "hsl(152 60% 32%)", label: "High" },
  medium: { bg: "hsl(38 92% 50% / 0.12)",  text: "hsl(38 80% 35%)",  label: "Medium" },
  low:    { bg: "hsl(0 60% 50% / 0.12)",   text: "hsl(0 60% 42%)",   label: "Low" },
};

export function ConfidenceBadge({ confidence, className }: { confidence: string; className?: string }) {
  const style = CONF_STYLES[confidence] || CONF_STYLES.medium;
  return (
    <span
      className={cn("px-2 py-0.5 rounded-full text-xs font-bold", className)}
      style={{ background: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   3. SIGNAL PILL ROW — Inline tags for key signals
   ═══════════════════════════════════════════════════════ */

interface SignalPillRowProps {
  signals: string[];
  max?: number;
  accentColor?: string;
  className?: string;
}

export function SignalPillRow({ signals, max = 4, accentColor, className }: SignalPillRowProps) {
  if (!signals || signals.length === 0) return null;
  const visible = signals.slice(0, max);
  const remaining = signals.length - max;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visible.map((signal, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{
            background: accentColor ? `${accentColor}12` : "hsl(var(--primary) / 0.08)",
            color: accentColor || "hsl(var(--primary))",
            border: `1px solid ${accentColor ? `${accentColor}25` : "hsl(var(--primary) / 0.15)"}`,
          }}
        >
          {signal.length > 35 ? signal.slice(0, 32) + "…" : signal}
        </motion.span>
      ))}
      {remaining > 0 && (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
          +{remaining} more
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   4. CONSTRAINT BLOCK — Structural constraint with impact
   ═══════════════════════════════════════════════════════ */

interface ConstraintBlockProps {
  label: string;
  impact: number;
  confidence?: string;
  mechanism?: string;
  isBinding?: boolean;
  detail?: React.ReactNode;
  className?: string;
}

export function ConstraintBlock({ label, impact, confidence, mechanism, isBinding, detail, className }: ConstraintBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl overflow-hidden", className)}
      style={{
        background: "hsl(var(--card))",
        border: isBinding ? "2px solid hsl(0 72% 50% / 0.3)" : "1.5px solid hsl(var(--border))",
      }}
    >
      <div className="p-4 space-y-2.5">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: isBinding ? "hsl(0 72% 50%)" : "hsl(var(--destructive) / 0.1)",
            }}
          >
            <Shield size={14} style={{ color: isBinding ? "white" : "hsl(var(--destructive))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-foreground leading-snug">{label}</h4>
              {isBinding && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "hsl(0 72% 50% / 0.12)", color: "hsl(0 72% 50%)" }}>
                  Binding
                </span>
              )}
              {confidence && <ConfidenceBadge confidence={confidence} />}
            </div>
            {mechanism && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{mechanism}</p>
            )}
          </div>
        </div>

        <ImpactMeter value={impact} label="System Impact" />

        {detail && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={12} />
              </motion.span>
              {expanded ? "Less" : "Detail"}
            </button>
            {expanded && <div className="pt-2 text-sm text-foreground/80 leading-relaxed border-t border-border/50">{detail}</div>}
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   5. LEVERAGE INDICATOR — Visual leverage with scoring
   ═══════════════════════════════════════════════════════ */

interface LeverageIndicatorProps {
  label: string;
  impact: number;
  confidence?: string;
  mechanism?: string;
  isConvergence?: boolean;
  signals?: string[];
  className?: string;
}

export function LeverageIndicator({ label, impact, confidence, mechanism, isConvergence, signals, className }: LeverageIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl p-4 space-y-2.5", className)}
      style={{
        background: "hsl(var(--card))",
        border: isConvergence ? "2px solid hsl(229 89% 63% / 0.3)" : "1.5px solid hsl(var(--border))",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: isConvergence ? "hsl(229 89% 63%)" : "hsl(229 89% 63% / 0.1)",
          }}
        >
          <Zap size={14} style={{ color: isConvergence ? "white" : "hsl(229 89% 63%)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-foreground leading-snug">{label}</h4>
            {isConvergence && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "hsl(38 92% 50% / 0.12)", color: "hsl(38 92% 50%)" }}>
                ★ Convergence
              </span>
            )}
            {confidence && <ConfidenceBadge confidence={confidence} />}
          </div>
          {mechanism && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{mechanism}</p>
          )}
        </div>
      </div>

      <ImpactMeter value={impact} label="Leverage Potential" />

      {signals && signals.length > 0 && (
        <SignalPillRow signals={signals} accentColor="hsl(229 89% 63%)" />
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   6. SIGNAL CLUSTER — Aggregated signal visualization
   ═══════════════════════════════════════════════════════ */

interface SignalClusterItem {
  theme: string;
  count: number;
  type?: "complaint" | "request" | "praise" | "neutral";
}

interface SignalClusterProps {
  title?: string;
  items: SignalClusterItem[];
  icon?: React.ElementType;
  className?: string;
}

const CLUSTER_TYPE_STYLES: Record<string, { bg: string; dot: string; bar: string }> = {
  complaint: { bg: "hsl(0 60% 97%)", dot: "hsl(0 72% 50%)", bar: "hsl(0 72% 50%)" },
  request:   { bg: "hsl(217 70% 96%)", dot: "hsl(217 91% 55%)", bar: "hsl(217 91% 55%)" },
  praise:    { bg: "hsl(152 60% 95%)", dot: "hsl(152 60% 38%)", bar: "hsl(152 60% 38%)" },
  neutral:   { bg: "hsl(var(--muted))", dot: "hsl(var(--muted-foreground))", bar: "hsl(var(--muted-foreground))" },
};

export function SignalCluster({ title, items, icon: Icon = MessageSquare, className }: SignalClusterProps) {
  if (!items || items.length === 0) return null;

  const maxCount = Math.max(...items.map(i => i.count), 1);

  return (
    <div className={cn("rounded-xl overflow-hidden", className)}
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
      {title && (
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <Icon size={14} className="text-muted-foreground" />
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{title}</p>
          <span className="text-xs font-bold text-muted-foreground/60">({items.length})</span>
        </div>
      )}
      <div className="p-3 space-y-1.5">
        {items.map((item, i) => {
          const style = CLUSTER_TYPE_STYLES[item.type || "neutral"];
          const barWidth = (item.count / maxCount) * 100;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg"
              style={{ background: style.bg }}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: style.dot }} />
              <p className="text-sm font-semibold text-foreground flex-1 min-w-0 leading-snug">
                {item.theme}
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-16 h-1.5 rounded-full overflow-hidden bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.04 }}
                    style={{ background: style.bar }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums text-muted-foreground w-5 text-right">
                  {item.count}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   7. CAUSAL CHAIN VISUAL — Mini causal flow
   ═══════════════════════════════════════════════════════ */

interface CausalStep {
  label: string;
  role: "signal" | "constraint" | "leverage" | "opportunity";
}

interface CausalChainVisualProps {
  steps: CausalStep[];
  className?: string;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  signal:      { bg: "hsl(38 92% 50% / 0.08)", text: "hsl(38 80% 35%)", dot: "hsl(38 92% 50%)" },
  constraint:  { bg: "hsl(0 72% 50% / 0.08)",  text: "hsl(0 60% 42%)",  dot: "hsl(0 72% 50%)" },
  leverage:    { bg: "hsl(229 89% 63% / 0.08)", text: "hsl(229 75% 40%)", dot: "hsl(229 89% 63%)" },
  opportunity: { bg: "hsl(152 60% 44% / 0.08)", text: "hsl(152 60% 32%)", dot: "hsl(152 60% 44%)" },
};

export function CausalChainVisual({ steps, className }: CausalChainVisualProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {steps.map((step, i) => {
        const colors = ROLE_COLORS[step.role] || ROLE_COLORS.signal;
        return (
          <React.Fragment key={i}>
            {i > 0 && <ArrowRight size={12} className="text-muted-foreground flex-shrink-0" />}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ background: colors.bg, color: colors.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: colors.dot }} />
              {step.label.length > 30 ? step.label.slice(0, 28) + "…" : step.label}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
