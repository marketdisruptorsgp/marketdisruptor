/**
 * STANDARDIZED ANALYSIS COMPONENT LIBRARY
 * 
 * All analytical UI across Product, Service, and Business modes
 * must use these components. No custom card types permitted.
 * 
 * Components:
 *   StepCanvas       — Primary container for step content (staggered entry)
 *   InsightCard      — Key insight with optional expandable detail
 *   FrameworkPanel   — Structured analytical framework container
 *   SignalCard       — Single signal indicator
 *   OpportunityCard  — Structured opportunity summary
 *   VisualGrid       — Grid layout for frameworks/visuals
 *   ExpandableDetail — Collapsible detail content (animated)
 *   MetricCard       — Single metric with label and trend
 *   EvidenceCard     — Evidence/proof point with source & confidence
 *   HypothesisCard   — Strategic hypothesis with fragility score
 *   AnalysisPanel    — Generic titled panel for analysis sections
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Shared animation presets ── */
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const expandVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: "auto" as const, opacity: 1, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const hoverLift = {
  rest: { y: 0, boxShadow: "0 1px 3px 0 hsl(220 20% 80% / 0.12)" },
  hover: { y: -2, boxShadow: "0 8px 24px -4px hsl(220 20% 80% / 0.18)", transition: { duration: 0.2, ease: "easeOut" as const } },
};

/* ═══════════════════════════════════════════════════════
   1. STEP CANVAS — Primary step content container (staggered)
   ═══════════════════════════════════════════════════════ */

interface StepCanvasProps {
  children: React.ReactNode;
  className?: string;
}

export function StepCanvas({ children, className }: StepCanvasProps) {
  return (
    <motion.div
      className={cn("space-y-4", className)}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child) =>
        child ? <motion.div variants={cardVariants}>{child}</motion.div> : null
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   2. INSIGHT CARD — Key insight with expandable detail
   ═══════════════════════════════════════════════════════ */

interface InsightCardProps {
  icon?: React.ElementType;
  headline: string;
  subtext?: string;
  accentColor?: string;
  detail?: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string;
  badgeColor?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function InsightCard({
  icon: Icon, headline, subtext, accentColor, detail,
  defaultExpanded = false, badge, badgeColor, action, children, className,
}: InsightCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasDetail = !!detail;

  return (
    <motion.div
      className={cn(
        "rounded-xl overflow-hidden bg-card border border-border",
        className,
      )}
      style={accentColor ? { borderLeft: `3px solid ${accentColor}` } : undefined}
      initial="rest"
      whileHover={hasDetail ? "hover" : "rest"}
      variants={hoverLift}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {Icon && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: accentColor ? `${accentColor}14` : "hsl(var(--primary) / 0.08)" }}
              >
                <Icon size={15} style={{ color: accentColor || "hsl(var(--primary))" }} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-foreground leading-snug">{headline}</h4>
                {badge && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                    style={{
                      background: badgeColor ? `${badgeColor}14` : "hsl(var(--primary) / 0.1)",
                      color: badgeColor || "hsl(var(--primary))",
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
              {subtext && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{subtext}</p>}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>

        {children && <div className="mt-3">{children}</div>}

        {hasDetail && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={12} />
            </motion.span>
            {expanded ? "Hide detail" : "View detail"}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {hasDetail && expanded && (
          <motion.div
            key="detail"
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="exit"
            className="overflow-hidden"
          >
            <div
              className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-border/50"
              style={{ background: "hsl(var(--muted) / 0.3)" }}
            >
              <div className="pt-3 text-sm text-foreground leading-relaxed">{detail}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   3. FRAMEWORK PANEL — Structured analytical framework
   ═══════════════════════════════════════════════════════ */

interface FrameworkPanelProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  accentColor?: string;
  children: React.ReactNode;
  detail?: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function FrameworkPanel({
  title, subtitle, icon: Icon, accentColor, children,
  detail, defaultExpanded = false, className,
}: FrameworkPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      className={cn("rounded-xl overflow-hidden bg-card border border-border", className)}
      variants={cardVariants}
    >
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--foreground))" }}>
              <Icon size={16} style={{ color: "hsl(var(--background))" }} />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {detail && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? "Collapse" : "Deep dive"}
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={12} />
            </motion.span>
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5">{children}</div>

      <AnimatePresence initial={false}>
        {detail && expanded && (
          <motion.div
            key="fw-detail"
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-border/50" style={{ background: "hsl(var(--muted) / 0.3)" }}>
              <div className="pt-3 text-sm text-foreground leading-relaxed">{detail}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   4. SIGNAL CARD — Single signal indicator
   ═══════════════════════════════════════════════════════ */

interface SignalCardProps {
  label: string;
  score?: number;
  type?: "strength" | "weakness" | "opportunity" | "threat" | "neutral";
  explanation?: string;
  detail?: React.ReactNode;
  className?: string;
}

const SIGNAL_STYLES: Record<string, { dot: string; bg: string; border: string }> = {
  strength:    { dot: "bg-green-600",  bg: "hsl(152 60% 95%)", border: "hsl(152 40% 85%)" },
  weakness:    { dot: "bg-red-500",    bg: "hsl(0 60% 97%)",   border: "hsl(0 40% 88%)" },
  opportunity: { dot: "bg-blue-500",   bg: "hsl(217 70% 96%)", border: "hsl(217 40% 87%)" },
  threat:      { dot: "bg-amber-500",  bg: "hsl(38 70% 96%)",  border: "hsl(38 40% 87%)" },
  neutral:     { dot: "bg-muted-foreground", bg: "hsl(var(--muted))", border: "hsl(var(--border))" },
};

export function SignalCard({ label, score, type = "neutral", explanation, detail, className }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = SIGNAL_STYLES[type];

  return (
    <motion.div
      className={cn("rounded-lg overflow-hidden", className)}
      style={{ background: style.bg, border: `1px solid ${style.border}` }}
      initial="rest"
      whileHover="hover"
      variants={{ rest: { scale: 1 }, hover: { scale: 1.015, transition: { duration: 0.15 } } }}
    >
      <div className="p-3 flex items-start gap-2.5">
        <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", style.dot)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-foreground leading-snug">{label}</p>
            {score !== undefined && (
              <span className="text-xs font-bold tabular-nums text-foreground/70 flex-shrink-0">{score.toFixed(1)}</span>
            )}
          </div>
          {explanation && <p className="text-[11px] text-foreground/70 mt-1 leading-relaxed">{explanation}</p>}
          {detail && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1.5 text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                <ChevronRight size={10} />
              </motion.span>
              {expanded ? "Less" : "More"}
            </button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {detail && expanded && (
          <motion.div
            key="sig-detail"
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 text-[11px] text-foreground/80 leading-relaxed border-t" style={{ borderColor: style.border }}>
              <div className="pt-2">{detail}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   5. OPPORTUNITY CARD — Structured opportunity summary
   ═══════════════════════════════════════════════════════ */

interface OpportunityCardProps {
  title: string;
  impact: string;
  feasibility?: number;
  potential?: number;
  category?: string;
  detail?: React.ReactNode;
  accentColor?: string;
  className?: string;
}

export function OpportunityCard({
  title, impact, feasibility, potential, category, detail, accentColor, className,
}: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className={cn("rounded-xl overflow-hidden bg-card border border-border", className)}
      style={accentColor ? { borderTop: `3px solid ${accentColor}` } : undefined}
      initial="rest"
      whileHover="hover"
      variants={hoverLift}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-bold text-foreground leading-snug">{title}</h4>
          {category && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary flex-shrink-0">{category}</span>
          )}
        </div>
        <p className="text-xs text-foreground/80 leading-relaxed">{impact}</p>

        {(feasibility !== undefined || potential !== undefined) && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {feasibility !== undefined && (
              <div>
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1">
                  <span>Feasibility</span>
                  <span className="tabular-nums">{feasibility}/10</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${feasibility * 10}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                    style={{
                      background: feasibility >= 7 ? "hsl(152 60% 44%)" : feasibility >= 4 ? "hsl(38 80% 50%)" : "hsl(0 72% 52%)",
                    }}
                  />
                </div>
              </div>
            )}
            {potential !== undefined && (
              <div>
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1">
                  <span>Potential</span>
                  <span className="tabular-nums">{potential}/10</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${potential * 10}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
                    style={{ background: "hsl(var(--primary))" }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {detail && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={12} />
            </motion.span>
            {expanded ? "Hide detail" : "View detail"}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {detail && expanded && (
          <motion.div
            key="opp-detail"
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-border/50" style={{ background: "hsl(var(--muted) / 0.3)" }}>
              <div className="pt-3 text-sm text-foreground leading-relaxed">{detail}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   6. VISUAL GRID — Responsive grid for frameworks
   ═══════════════════════════════════════════════════════ */

interface VisualGridProps {
  columns?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

const COL_CLASSES: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function VisualGrid({ columns = 2, children, className }: VisualGridProps) {
  return (
    <div className={cn("grid gap-3", COL_CLASSES[columns], className)}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   7. EXPANDABLE DETAIL — Standalone collapsible detail (animated)
   ═══════════════════════════════════════════════════════ */

interface ExpandableDetailProps {
  label: string;
  icon?: React.ElementType;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ExpandableDetail({ label, icon: Icon, defaultExpanded = false, children, className }: ExpandableDetailProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={14} className="text-muted-foreground" />}
          <span className="text-xs font-bold text-foreground">{label}</span>
        </div>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="exp-detail"
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 text-sm text-foreground leading-relaxed">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   8. METRIC CARD — Single metric with label (animated value)
   ═══════════════════════════════════════════════════════ */

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "flat";
  accentColor?: string;
  subtext?: string;
  className?: string;
}

export function MetricCard({ label, value, trend, accentColor, subtext, className }: MetricCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      className={cn("rounded-xl p-4 bg-card border border-border", className)}
      initial="rest"
      whileHover="hover"
      variants={{ rest: { scale: 1 }, hover: { scale: 1.02, transition: { duration: 0.15 } } }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        {trend && (
          <TrendIcon
            size={12}
            style={{
              color: trend === "up" ? "hsl(152 60% 44%)" : trend === "down" ? "hsl(0 72% 52%)" : "hsl(var(--muted-foreground))",
            }}
          />
        )}
      </div>
      <motion.p
        className="text-xl font-bold tabular-nums"
        style={{ color: accentColor || "hsl(var(--foreground))" }}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {value}
      </motion.p>
      {subtext && <p className="text-[11px] text-muted-foreground mt-1">{subtext}</p>}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   9. EVIDENCE CARD — Proof point with source & confidence
   ═══════════════════════════════════════════════════════ */

interface EvidenceCardProps {
  statement: string;
  source?: string;
  sourceUrl?: string;
  confidence?: "high" | "medium" | "low" | "unverified";
  category?: string;
  detail?: React.ReactNode;
  className?: string;
}

const CONFIDENCE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high:       { bg: "hsl(152 60% 95%)", text: "hsl(152 60% 32%)", label: "High Confidence" },
  medium:     { bg: "hsl(38 80% 95%)",  text: "hsl(38 80% 35%)",  label: "Medium" },
  low:        { bg: "hsl(0 60% 97%)",   text: "hsl(0 60% 42%)",   label: "Low" },
  unverified: { bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))", label: "Unverified" },
};

export function EvidenceCard({ statement, source, sourceUrl, confidence = "unverified", category, detail, className }: EvidenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const confStyle = CONFIDENCE_STYLES[confidence];

  return (
    <motion.div
      className={cn("rounded-lg overflow-hidden border border-border bg-card", className)}
      variants={cardVariants}
    >
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: confStyle.text }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-snug">{statement}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: confStyle.bg, color: confStyle.text }}>
                {confStyle.label}
              </span>
              {category && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">{category}</span>
              )}
              {source && (
                sourceUrl ? (
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline">
                    <ExternalLink size={8} /> {source}
                  </a>
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">{source}</span>
                )
              )}
            </div>
            {detail && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                  <ChevronRight size={10} />
                </motion.span>
                {expanded ? "Less" : "More"}
              </button>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {detail && expanded && (
          <motion.div
            key="ev-detail"
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 text-sm text-foreground leading-relaxed border-t border-border/50">
              <div className="pt-2">{detail}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   10. HYPOTHESIS CARD — Strategic hypothesis with fragility
   ═══════════════════════════════════════════════════════ */

interface HypothesisCardProps {
  hypothesis: string;
  fragilityScore?: number;
  constraintType?: string;
  frictionSources?: string[];
  implications?: string;
  isActive?: boolean;
  accentColor?: string;
  detail?: React.ReactNode;
  className?: string;
}

export function HypothesisCard({
  hypothesis, fragilityScore, constraintType, frictionSources,
  implications, isActive, accentColor, detail, className,
}: HypothesisCardProps) {
  const [expanded, setExpanded] = useState(false);
  const fragilityColor = fragilityScore !== undefined
    ? fragilityScore >= 7 ? "hsl(0 70% 50%)" : fragilityScore >= 4 ? "hsl(38 80% 42%)" : "hsl(152 60% 38%)"
    : undefined;

  return (
    <motion.div
      className={cn("rounded-xl overflow-hidden bg-card border", className)}
      style={{
        borderColor: isActive ? (accentColor || "hsl(var(--primary))") : "hsl(var(--border))",
        borderWidth: isActive ? "2px" : "1px",
      }}
      initial="rest"
      whileHover="hover"
      variants={hoverLift}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isActive && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: (accentColor || "hsl(var(--primary))") + "14", color: accentColor || "hsl(var(--primary))" }}>
                  Active
                </span>
              )}
              {constraintType && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground">{constraintType}</span>
              )}
            </div>
            <p className="text-sm font-bold text-foreground leading-snug">{hypothesis}</p>
          </div>

          {fragilityScore !== undefined && (
            <motion.div
              className="flex flex-col items-center flex-shrink-0"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <span className="text-lg font-black tabular-nums" style={{ color: fragilityColor }}>{fragilityScore.toFixed(1)}</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Fragility</span>
            </motion.div>
          )}
        </div>

        {frictionSources && frictionSources.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {frictionSources.slice(0, 3).map((src, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-foreground">
                {src.length > 40 ? src.slice(0, 40) + "…" : src}
              </span>
            ))}
            {frictionSources.length > 3 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground">+{frictionSources.length - 3} more</span>
            )}
          </div>
        )}

        {implications && (
          <p className="text-xs text-foreground/80 mt-2 leading-relaxed">
            {implications.length > 120 ? implications.slice(0, 120) + "…" : implications}
          </p>
        )}

        {detail && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={12} />
            </motion.span>
            {expanded ? "Hide detail" : "View detail"}
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {detail && expanded && (
          <motion.div
            key="hyp-detail"
            variants={expandVariants}
            initial="collapsed"
            animate="expanded"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-border/50" style={{ background: "hsl(var(--muted) / 0.3)" }}>
              <div className="pt-3 text-sm text-foreground leading-relaxed">{detail}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   11. ANALYSIS PANEL — Generic titled panel for sections
   ═══════════════════════════════════════════════════════ */

interface AnalysisPanelProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  eyebrow?: string;
  eyebrowColor?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  accentColor?: string;
  className?: string;
}

export function AnalysisPanel({
  title, subtitle, icon: Icon, eyebrow, eyebrowColor,
  action, children, accentColor, className,
}: AnalysisPanelProps) {
  return (
    <motion.div
      className={cn("rounded-xl overflow-hidden bg-card border border-border", className)}
      style={accentColor ? { borderTop: `3px solid ${accentColor}` } : undefined}
      variants={cardVariants}
    >
      <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--foreground))" }}>
              <Icon size={16} style={{ color: "hsl(var(--background))" }} />
            </div>
          )}
          <div>
            {eyebrow && (
              <p className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5" style={{ color: eyebrowColor || "hsl(var(--muted-foreground))" }}>
                {eyebrow}
              </p>
            )}
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </motion.div>
  );
}
