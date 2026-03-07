/**
 * Narrative Summary — Rich prose-first strategic summary
 *
 * Progressive layers:
 *   1. Prose summary (always visible)
 *   2. Contextual recommendations (when insights exist)
 *   3. Reasoning chain (progressive disclosure toggle)
 *   4. Evidence quality indicator
 */

import { memo, useState, useMemo } from "react";
import {
  Shield, TrendingUp, Crosshair, Lightbulb, Route,
  ChevronDown, ChevronUp, ArrowRight, Sparkles, AlertTriangle,
  CheckCircle2, BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { StrategicInsight } from "@/lib/strategicEngine";
import type { StrategicDiagnostic } from "@/lib/strategicEngine";

interface NarrativeSummaryProps {
  primaryConstraint: string | null;
  keyDriver: string | null;
  leveragePoint: string | null;
  breakthroughOpportunity: string | null;
  strategicPathway: string | null;
  narrativeSummary: string;
  insights?: StrategicInsight[];
  diagnostic?: StrategicDiagnostic | null;
  completedSteps?: number;
  totalSteps?: number;
  onNavigateToGraph?: () => void;
}

const CHAIN = [
  { key: "primaryConstraint", label: "Constraint", icon: Shield, colorVar: "--destructive" },
  { key: "keyDriver", label: "Driver", icon: TrendingUp, colorVar: "--primary" },
  { key: "leveragePoint", label: "Leverage", icon: Crosshair, colorVar: "--primary" },
  { key: "breakthroughOpportunity", label: "Opportunity", icon: Lightbulb, colorVar: "--success" },
  { key: "strategicPathway", label: "Pathway", icon: Route, colorVar: "--warning" },
] as const;

function confidenceLabel(score: number): { text: string; color: string } {
  if (score >= 0.7) return { text: "High confidence", color: "hsl(var(--success))" };
  if (score >= 0.4) return { text: "Medium confidence", color: "hsl(var(--warning))" };
  return { text: "Low confidence", color: "hsl(var(--destructive))" };
}

export const NarrativeSummary = memo(function NarrativeSummary(props: NarrativeSummaryProps) {
  const {
    narrativeSummary, insights = [], diagnostic, completedSteps = 0, totalSteps = 5,
    onNavigateToGraph,
  } = props;
  const [expanded, setExpanded] = useState(false);

  const hasChain = CHAIN.some(c => props[c.key]);
  const filledChainCount = CHAIN.filter(c => props[c.key]).length;

  // Derive top recommendations — require strong evidence backing
  const recommendations = useMemo(() => {
    if (!insights.length) return [];
    return insights
      .filter(i => i.impact >= 6 && i.confidence >= 0.4 && i.evidenceIds.length >= 2)
      .sort((a, b) => b.impact * b.confidence - a.impact * a.confidence)
      .slice(0, 3)
      .map(i => ({
        label: i.label,
        description: i.description,
        type: i.insightType,
        impact: i.impact,
        confidence: i.confidence,
        evidenceCount: i.evidenceIds.length,
      }));
  }, [insights]);

  // Evidence quality assessment
  const evidenceQuality = useMemo(() => {
    if (!diagnostic) return null;
    const { evidenceCount, signalCount } = diagnostic;
    if (evidenceCount >= 22) return { level: "rich", label: "Rich evidence base", pct: 100 };
    if (evidenceCount >= 14) return { level: "moderate", label: "Growing evidence", pct: Math.round((evidenceCount / 22) * 100) };
    if (evidenceCount >= 4) return { level: "early", label: "Early signals", pct: Math.round((evidenceCount / 22) * 100) };
    return { level: "minimal", label: "Needs more data", pct: Math.round((evidenceCount / 22) * 100) };
  }, [diagnostic]);

  const isEmpty = !narrativeSummary && !hasChain;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      {/* ── Header + Evidence Quality ── */}
      <div className="px-5 pt-4 pb-1 flex items-center justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Strategic Narrative
        </p>
        {evidenceQuality && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: 48,
                  background: "hsl(var(--muted))",
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${evidenceQuality.pct}%`,
                    background: evidenceQuality.level === "rich"
                      ? "hsl(var(--success))"
                      : evidenceQuality.level === "moderate"
                        ? "hsl(var(--warning))"
                        : "hsl(var(--muted-foreground))",
                  }}
                />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                {evidenceQuality.label}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Prose summary ── */}
      <div className="px-5 pb-3">
        {narrativeSummary ? (
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {narrativeSummary}
          </p>
        ) : (
          <div className="flex items-start gap-3 py-2">
            <BarChart3 size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {completedSteps > 0
                  ? "Insufficient evidence to generate a complete strategic narrative."
                  : "No analysis data yet."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {completedSteps > 0
                  ? `${completedSteps}/${totalSteps} pipeline steps complete. Add more inputs to unlock deeper reasoning.`
                  : "Run pipeline steps to collect evidence, then click Recompute to generate insights."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Contextual Recommendations ── */}
      {recommendations.length > 0 && (
        <div className="px-5 pb-3">
          <div className="rounded-lg p-3" style={{ background: "hsl(var(--muted) / 0.4)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles size={12} className="text-primary" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                Evidence-Backed Recommendations
              </span>
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, i) => {
                const conf = confidenceLabel(rec.confidence);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-2.5"
                  >
                    <div className="mt-1 flex-shrink-0">
                      {rec.type === "emerging_opportunity" ? (
                        <CheckCircle2 size={12} style={{ color: "hsl(var(--success))" }} />
                      ) : rec.type === "constraint_cluster" ? (
                        <AlertTriangle size={12} style={{ color: "hsl(var(--destructive))" }} />
                      ) : (
                        <ArrowRight size={12} className="text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground leading-snug">
                        {rec.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">
                        {rec.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-shrink-0">
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: conf.color }}
                      >
                        {conf.text}
                      </span>
                      <span className="text-[9px] font-medium text-muted-foreground whitespace-nowrap">
                        ({rec.evidenceCount} evidence)
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Chain toggle + Graph link ── */}
      <div className="px-5 pb-3 flex items-center gap-3">
        {hasChain && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Hide reasoning chain" : `View reasoning chain (${filledChainCount}/${CHAIN.length})`}
          </button>
        )}
        {onNavigateToGraph && insights.length > 0 && (
          <button
            onClick={onNavigateToGraph}
            className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-auto"
          >
            Explore full graph <ArrowRight size={11} />
          </button>
        )}
      </div>

      {/* ── Collapsible reasoning chain ── */}
      <AnimatePresence>
        {expanded && hasChain && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4">
              {/* Visual flow line */}
              <div className="space-y-1">
                {CHAIN.map((item, idx) => {
                  const value = props[item.key];
                  const Icon = item.icon;
                  const isLast = idx === CHAIN.length - 1;

                  // Find matching insight for confidence
                  const matchedInsight = insights.find(
                    i => i.label === value || i.description === value
                  );
                  const conf = matchedInsight
                    ? confidenceLabel(matchedInsight.confidence)
                    : null;

                  return (
                    <div key={item.key} className="flex items-stretch gap-3">
                      {/* Vertical connector */}
                      <div className="flex flex-col items-center w-6 flex-shrink-0">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: value
                              ? `hsl(var(${item.colorVar}) / 0.15)`
                              : "hsl(var(--muted))",
                          }}
                        >
                          <Icon
                            size={11}
                            style={{
                              color: value
                                ? `hsl(var(${item.colorVar}))`
                                : "hsl(var(--muted-foreground))",
                            }}
                          />
                        </div>
                        {!isLast && (
                          <div
                            className="w-px flex-1 min-h-[8px]"
                            style={{
                              background: value
                                ? `hsl(var(${item.colorVar}) / 0.2)`
                                : "hsl(var(--border))",
                            }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`pb-2 min-w-0 flex-1 ${!value ? "opacity-40" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-extrabold uppercase tracking-widest"
                            style={{
                              color: value
                                ? `hsl(var(${item.colorVar}))`
                                : "hsl(var(--muted-foreground))",
                            }}
                          >
                            {item.label}
                          </span>
                          {conf && (
                            <span
                              className="text-[9px] font-bold"
                              style={{ color: conf.color }}
                            >
                              {conf.text}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-foreground leading-snug mt-0.5">
                          {value || "Pending — needs more evidence"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
