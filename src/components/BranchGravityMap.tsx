/**
 * STRATEGIC MIND MAP — Interactive Branching Tree
 * Premium horizontal decision tree with rich visual styling.
 * Root node → Primary branches (hypotheses) → Secondary nodes (causal chain).
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Shield, Target, GitBranch, BarChart3, AlertTriangle,
  CheckCircle2, ChevronDown, X, Sparkles, ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useIsMobile } from "@/hooks/use-mobile";
import type { StrategicHypothesis } from "@/lib/strategicOS";

/* ─── Props ─── */
interface BranchGravityMapProps {
  hypotheses: StrategicHypothesis[];
  activeBranchId: string | null;
  onSelectBranch: (id: string) => void;
  competing: boolean;
  delta: number;
}

/* ─── Icon map ─── */
const CONSTRAINT_ICONS: Record<string, typeof Zap> = {
  cost: BarChart3, time: Target, adoption: Zap, scale: GitBranch,
  reliability: Shield, risk: AlertTriangle, physical: Target,
  structural: GitBranch, economic: BarChart3,
};

/* ─── Dimension colors — rich, vibrant palette ─── */
const DIM_COLORS: Record<string, { bg: string; text: string; border: string; glow: string; gradient: string }> = {
  cost:        { bg: "hsl(var(--primary) / 0.06)", text: "hsl(var(--primary))",   border: "hsl(var(--primary) / 0.2)",   glow: "hsl(var(--primary) / 0.1)", gradient: "linear-gradient(135deg, hsl(var(--primary) / 0.04), hsl(var(--primary) / 0.10))" },
  adoption:    { bg: "hsl(38 92% 50% / 0.06)",     text: "hsl(38 92% 42%)",       border: "hsl(38 92% 50% / 0.2)",       glow: "hsl(38 92% 50% / 0.1)",   gradient: "linear-gradient(135deg, hsl(38 92% 50% / 0.03), hsl(38 92% 50% / 0.10))" },
  reliability: { bg: "hsl(152 60% 40% / 0.06)",    text: "hsl(152 60% 32%)",      border: "hsl(152 60% 40% / 0.2)",      glow: "hsl(152 60% 40% / 0.1)",  gradient: "linear-gradient(135deg, hsl(152 60% 40% / 0.03), hsl(152 60% 40% / 0.10))" },
  risk:        { bg: "hsl(0 72% 51% / 0.06)",      text: "hsl(0 72% 42%)",        border: "hsl(0 72% 51% / 0.2)",        glow: "hsl(0 72% 51% / 0.1)",    gradient: "linear-gradient(135deg, hsl(0 72% 51% / 0.03), hsl(0 72% 51% / 0.10))" },
  time:        { bg: "hsl(262 83% 58% / 0.06)",    text: "hsl(262 83% 45%)",      border: "hsl(262 83% 58% / 0.2)",      glow: "hsl(262 83% 58% / 0.1)",  gradient: "linear-gradient(135deg, hsl(262 83% 58% / 0.03), hsl(262 83% 58% / 0.10))" },
  scale:       { bg: "hsl(199 89% 48% / 0.06)",    text: "hsl(199 89% 38%)",      border: "hsl(199 89% 48% / 0.2)",      glow: "hsl(199 89% 48% / 0.1)",  gradient: "linear-gradient(135deg, hsl(199 89% 48% / 0.03), hsl(199 89% 48% / 0.10))" },
};
const DEFAULT_DIM = { bg: "hsl(var(--muted) / 0.5)", text: "hsl(var(--foreground))", border: "hsl(var(--border))", glow: "hsl(var(--muted))", gradient: "hsl(var(--muted) / 0.3)" };

/* ─── Layout constants — generous spacing to prevent overlap ─── */
const ROOT_X = 80;
const PRIMARY_X = 300;
const SECONDARY_X = 580;
const NODE_GAP_Y = 240;
const SECONDARY_GAP_Y = 80;

function computeLayout(hypotheses: StrategicHypothesis[]) {
  const totalH = hypotheses.length * NODE_GAP_Y;
  const startY = Math.max(100, 240 - totalH / 2);
  const rootY = startY + (totalH - NODE_GAP_Y) / 2;

  const primaries = hypotheses.map((h, i) => {
    const py = startY + i * NODE_GAP_Y;
    const secondaries = (h.causal_chain || []).map((c, j) => ({
      ...c,
      x: SECONDARY_X,
      y: py - ((h.causal_chain.length - 1) * SECONDARY_GAP_Y) / 2 + j * SECONDARY_GAP_Y,
    }));
    return { hypothesis: h, x: PRIMARY_X, y: py, secondaries };
  });

  const maxSecY = Math.max(...primaries.flatMap(p => p.secondaries.map(s => s.y)), 0);
  const svgH = Math.max(520, maxSecY + 140, startY + totalH + 120);
  const svgW = Math.max(1060, SECONDARY_X + 440);

  return { rootX: ROOT_X, rootY, primaries, svgW, svgH };
}

/* ─── Bezier path generator ─── */
function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = (x2 - x1) * 0.5;
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

/* ─── Evidence bar ─── */
function EvidenceBar({ mix }: { mix: StrategicHypothesis["evidence_mix"] }) {
  return (
    <div className="flex gap-0.5 h-2 rounded-full overflow-hidden w-full" style={{ background: "hsl(var(--muted) / 0.4)" }}>
      {mix.verified > 0 && <div className="rounded-l-full" style={{ width: `${mix.verified * 100}%`, background: "hsl(152 60% 42%)" }} />}
      {mix.modeled > 0 && <div style={{ width: `${mix.modeled * 100}%`, background: "hsl(38 92% 50%)" }} />}
      {mix.assumption > 0 && <div className="rounded-r-full" style={{ width: `${mix.assumption * 100}%`, background: "hsl(0 72% 55%)" }} />}
    </div>
  );
}

/* ─── Expanded detail panel ─── */
function BranchDetail({
  hypothesis,
  isActive,
  onSelect,
  onClose,
  theme,
}: {
  hypothesis: StrategicHypothesis;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  theme: ReturnType<typeof useModeTheme>;
}) {
  const fragilityColor =
    hypothesis.fragility_score <= 3 ? "hsl(152 60% 32%)" :
    hypothesis.fragility_score <= 6 ? "hsl(38 92% 38%)" : "hsl(0 72% 42%)";
  const fragilityLabel =
    hypothesis.fragility_score <= 3 ? "Resilient" :
    hypothesis.fragility_score <= 6 ? "Moderate" : "Fragile";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: -12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: -12 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="relative z-30 mt-3"
      style={{ minWidth: 320, maxWidth: 380 }}
    >
      <div
        className="rounded-2xl border-2 p-5 space-y-3.5"
        style={{
          background: `linear-gradient(145deg, hsl(var(--card)) 0%, ${isActive ? theme.primary + "06" : "hsl(var(--muted) / 0.2)"} 100%)`,
          borderColor: isActive ? `${theme.primary}50` : "hsl(var(--border) / 0.6)",
          boxShadow: isActive
            ? `0 12px 40px -8px ${theme.primary}20, 0 0 0 1px ${theme.primary}10`
            : "0 12px 40px -8px hsl(var(--foreground) / 0.06), 0 0 0 1px hsl(var(--border) / 0.3)",
        }}
      >
        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-muted hover:scale-110"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <X size={15} />
        </button>

        <p className="text-sm font-bold text-foreground leading-snug pr-8">
          {hypothesis.hypothesis_statement}
        </p>

        {/* Score grid */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
          <div className="flex justify-between items-center px-2.5 py-1.5 rounded-lg" style={{ background: "hsl(var(--muted) / 0.4)" }}>
            <span className="text-muted-foreground">Leverage</span>
            <span className="font-extrabold text-foreground">{hypothesis.leverage_score}/10</span>
          </div>
          <div className="flex justify-between items-center px-2.5 py-1.5 rounded-lg" style={{ background: "hsl(var(--muted) / 0.4)" }}>
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-extrabold text-foreground">{hypothesis.confidence}%</span>
          </div>
          <div className="flex justify-between items-center px-2.5 py-1.5 rounded-lg" style={{ background: "hsl(var(--muted) / 0.4)" }}>
            <span className="text-muted-foreground">Fragility</span>
            <span className="font-extrabold" style={{ color: fragilityColor }}>{fragilityLabel}</span>
          </div>
          <div className="flex justify-between items-center px-2.5 py-1.5 rounded-lg" style={{ background: "hsl(var(--muted) / 0.4)" }}>
            <span className="text-muted-foreground">Dominance</span>
            <span className="font-extrabold text-foreground font-mono">{hypothesis.dominance_score?.toFixed(1)}</span>
          </div>
        </div>

        {/* Evidence bar */}
        <div className="space-y-1.5">
          <EvidenceBar mix={hypothesis.evidence_mix} />
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "hsl(152 60% 42%)" }} />
              Verified {Math.round(hypothesis.evidence_mix.verified * 100)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "hsl(38 92% 50%)" }} />
              Modeled {Math.round(hypothesis.evidence_mix.modeled * 100)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "hsl(0 72% 55%)" }} />
              Assumed {Math.round(hypothesis.evidence_mix.assumption * 100)}%
            </span>
          </div>
        </div>

        {hypothesis.downstream_implications && (
          <p className="text-xs text-foreground/70 border-t pt-3" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
            <ArrowRight className="inline h-3 w-3 mr-1 text-muted-foreground" />
            {hypothesis.downstream_implications}
          </p>
        )}

        {!isActive ? (
          <Button
            size="sm"
            className="w-full text-xs font-bold h-10 rounded-xl gap-2"
            style={{ background: theme.primary, color: "white" }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Explore this interpretation
          </Button>
        ) : (
          <div
            className="w-full text-center text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"
            style={{ background: `${theme.primary}12`, color: theme.primary, border: `1.5px solid ${theme.primary}25` }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active — guiding all downstream steps
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Mobile accordion tree ─── */
function MobileTree({
  hypotheses, activeBranchId, onSelectBranch, theme,
}: BranchGravityMapProps & { theme: ReturnType<typeof useModeTheme> }) {
  return (
    <div className="space-y-2.5">
      {hypotheses.map((h, i) => {
        const isActive = h.id === activeBranchId;
        const Icon = CONSTRAINT_ICONS[h.constraint_type] || Target;
        const dim = DIM_COLORS[h.constraint_type] || DEFAULT_DIM;
        return (
          <Collapsible key={h.id} defaultOpen={isActive}>
            <CollapsibleTrigger className="w-full">
              <div
                className="flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all"
                style={{
                  borderColor: isActive ? `${theme.primary}50` : "hsl(var(--border) / 0.4)",
                  background: isActive
                    ? `linear-gradient(135deg, hsl(var(--card)) 0%, ${theme.primary}06 100%)`
                    : dim.gradient,
                }}
              >
                <div className="p-2 rounded-lg" style={{ background: isActive ? `${theme.primary}15` : dim.bg }}>
                  <Icon className="h-4 w-4" style={{ color: isActive ? theme.primary : dim.text }} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground capitalize">{h.constraint_type}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: dim.text }}>{h.dominance_score?.toFixed(1)}</span>
                    {isActive && <Badge variant="default" className="text-[10px] h-4 px-1.5">Active</Badge>}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-10 pt-1.5 space-y-1.5">
                {(h.causal_chain || []).map((c) => {
                  const cdim = DIM_COLORS[c.impact_dimension] || DEFAULT_DIM;
                  return (
                    <div
                      key={c.friction_id}
                      className="flex items-start gap-2 py-2.5 px-3 rounded-xl text-xs"
                      style={{ background: cdim.gradient, border: `1px solid ${cdim.border}` }}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: cdim.text }} />
                      <span className="flex-1 text-foreground leading-snug font-medium">{c.structural_constraint}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0 font-bold" style={{ color: cdim.text, borderColor: cdim.border }}>
                        {c.impact_dimension}
                      </Badge>
                    </div>
                  );
                })}
                <div className="pt-1.5">
                  {!isActive ? (
                    <Button size="sm" className="w-full text-xs h-8 rounded-lg gap-1.5" onClick={() => onSelectBranch(h.id)}>
                      <Sparkles className="h-3 w-3" />
                      Explore this interpretation
                    </Button>
                  ) : (
                    <p className="text-[10px] text-primary text-center font-bold py-1.5">Active — guiding downstream analysis</p>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

/* ─── Main Desktop Mind Map ─── */
export default function BranchGravityMap({
  hypotheses, activeBranchId, onSelectBranch, competing, delta,
}: BranchGravityMapProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const theme = useModeTheme();
  const isMobile = useIsMobile();

  const layout = useMemo(() => computeLayout(hypotheses), [hypotheses]);

  const handlePrimaryClick = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (isMobile) {
    return <MobileTree hypotheses={hypotheses} activeBranchId={activeBranchId} onSelectBranch={onSelectBranch} competing={competing} delta={delta} theme={theme} />;
  }

  return (
    <div
      className="relative w-full rounded-2xl overflow-x-auto overflow-y-visible"
      style={{
        border: "1.5px solid hsl(var(--border) / 0.25)",
        background: `linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.15) 50%, hsl(var(--card)) 100%)`,
      }}
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0.5px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div style={{ minWidth: layout.svgW, minHeight: layout.svgH, position: "relative" }}>

        {/* SVG layer — connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={layout.svgW}
          height={layout.svgH}
          viewBox={`0 0 ${layout.svgW} ${layout.svgH}`}
        >
          <defs>
            {/* Animated gradient for active lines */}
            <linearGradient id="activeLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={theme.primary} stopOpacity="0.6" />
              <stop offset="50%" stopColor={theme.primary} stopOpacity="0.9" />
              <stop offset="100%" stopColor={theme.primary} stopOpacity="0.5" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Root → Primary connections */}
          {layout.primaries.map(({ hypothesis: h, y }) => {
            const isActive = h.id === activeBranchId;
            const dim = DIM_COLORS[h.constraint_type] || DEFAULT_DIM;
            return (
              <g key={`root-${h.id}`}>
                {isActive && (
                  <motion.path
                    d={bezierPath(layout.rootX + 28, layout.rootY, PRIMARY_X - 28, y)}
                    fill="none"
                    stroke={theme.primary}
                    strokeWidth={6}
                    strokeOpacity={0.06}
                    filter="url(#lineGlow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                )}
                <motion.path
                  d={bezierPath(layout.rootX + 28, layout.rootY, PRIMARY_X - 28, y)}
                  fill="none"
                  stroke={isActive ? "url(#activeLineGrad)" : dim.text}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeOpacity={isActive ? 1 : 0.2}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </g>
            );
          })}

          {/* Primary → Secondary connections */}
          {layout.primaries.map(({ hypothesis: h, y: py, secondaries }) => {
            const isActive = h.id === activeBranchId;
            return secondaries.map((s) => {
              const dim = DIM_COLORS[s.impact_dimension] || DEFAULT_DIM;
              return (
                <motion.path
                  key={`sec-${s.friction_id}`}
                  d={bezierPath(PRIMARY_X + 100, py, SECONDARY_X - 8, s.y)}
                  fill="none"
                  stroke={dim.text}
                  strokeWidth={isActive ? 1.5 : 1}
                  strokeOpacity={isActive ? 0.4 : 0.15}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                />
              );
            });
          })}

          {/* Competing tension line */}
          {competing && layout.primaries.length >= 2 && (
            <motion.path
              d={bezierPath(PRIMARY_X + 50, layout.primaries[0].y + 20, PRIMARY_X + 50, layout.primaries[1].y - 20)}
              fill="none"
              stroke="hsl(var(--destructive))"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeOpacity={0.4}
              animate={{ strokeOpacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          )}
        </svg>

        {/* Root node */}
        <motion.div
          className="absolute flex flex-col items-center"
          style={{ left: layout.rootX - 30, top: layout.rootY - 30 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div
            className="w-[60px] h-[60px] rounded-full flex items-center justify-center"
            style={{
              border: `2px solid ${theme.primary}35`,
              background: `radial-gradient(circle at 40% 40%, ${theme.tint} 0%, hsl(var(--card)) 100%)`,
              boxShadow: `0 0 24px -4px ${theme.primary}15, inset 0 1px 2px hsl(var(--background) / 0.8)`,
            }}
          >
            <motion.div
              className="w-4 h-4 rounded-full"
              style={{
                background: `radial-gradient(circle, ${theme.primary}, ${theme.primary}90)`,
                boxShadow: `0 0 12px ${theme.primary}40`,
              }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <span className="mt-2 text-[10px] font-extrabold text-foreground/50 uppercase tracking-[0.15em]">
            Root
          </span>
        </motion.div>

        {/* Competing badge */}
        {competing && (
          <motion.div
            className="absolute z-20 px-3.5 py-1.5 rounded-full text-[10px] font-extrabold tracking-wide"
            style={{
              left: PRIMARY_X + 30,
              top: (layout.primaries[0].y + layout.primaries[1].y) / 2 - 12,
              color: "hsl(var(--destructive))",
              background: "hsl(var(--destructive) / 0.06)",
              border: "1.5px solid hsl(var(--destructive) / 0.2)",
              boxShadow: "0 2px 12px -2px hsl(var(--destructive) / 0.12)",
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Δ {delta.toFixed(1)} — close contest
          </motion.div>
        )}

        {/* Primary hypothesis nodes */}
        {layout.primaries.map(({ hypothesis: h, x, y }, i) => {
          const isActive = h.id === activeBranchId;
          const isExpanded = expandedId === h.id;
          const Icon = CONSTRAINT_ICONS[h.constraint_type] || Target;
          const dim = DIM_COLORS[h.constraint_type] || DEFAULT_DIM;
          const domScore = h.dominance_score ?? 5;
          const isPrimary = i === 0;

          return (
            <motion.div
              key={h.id}
              className="absolute"
              style={{ left: x - 56, top: y - 32 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Active glow ring */}
              {isActive && (
                <motion.div
                  className="absolute -inset-4 rounded-2xl"
                  style={{
                    background: `radial-gradient(ellipse at center, ${theme.primary}08 0%, transparent 70%)`,
                    border: `1.5px solid ${theme.primary}18`,
                  }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                />
              )}

              {/* Node button */}
              <motion.button
                className="relative flex items-center gap-3.5 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all"
                style={{
                  borderColor: isActive ? `${theme.primary}50` : dim.border,
                  background: isActive
                    ? `linear-gradient(145deg, hsl(var(--card)) 0%, ${theme.primary}06 100%)`
                    : dim.gradient,
                  boxShadow: isActive
                    ? `0 8px 32px -8px ${theme.primary}18, 0 0 0 1px ${theme.primary}08`
                    : `0 2px 12px -4px hsl(var(--foreground) / 0.04), 0 0 0 1px ${dim.border}`,
                }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: `0 8px 32px -6px ${isActive ? theme.primary : dim.text}18`,
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePrimaryClick(h.id)}
              >
                <div
                  className="p-2.5 rounded-xl"
                  style={{
                    background: isActive ? `${theme.primary}12` : dim.bg,
                    border: `1px solid ${isActive ? theme.primary + "20" : dim.border}`,
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: isActive ? theme.primary : dim.text }}
                  />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-foreground capitalize">{h.constraint_type}</span>
                    <span className="text-xs font-mono font-extrabold" style={{ color: isActive ? theme.primary : dim.text }}>
                      {domScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="text-xs font-bold" style={{ color: dim.text }}>{h.confidence}%</span>
                    {isActive && (
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md"
                        style={{ background: `${theme.primary}12`, color: theme.primary }}
                      >
                        Active
                      </span>
                    )}
                    {isPrimary && !isActive && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                        style={{ background: dim.bg, color: dim.text, border: `1px solid ${dim.border}` }}
                      >
                        Highest
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>

              {/* Expanded detail — below node */}
              <AnimatePresence>
                {isExpanded && (
                  <BranchDetail
                    hypothesis={h}
                    isActive={isActive}
                    onSelect={() => { onSelectBranch(h.id); setExpandedId(null); }}
                    onClose={() => setExpandedId(null)}
                    theme={theme}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Secondary causal chain nodes — always visible, styled per dimension */}
        <TooltipProvider delayDuration={200}>
          {layout.primaries.map(({ hypothesis: h, secondaries }) => {
            const isActive = h.id === activeBranchId;
            return secondaries.map((s, j) => {
              const dim = DIM_COLORS[s.impact_dimension] || DEFAULT_DIM;
              const truncated = s.structural_constraint.length > 80
                ? s.structural_constraint.slice(0, 77) + "…"
                : s.structural_constraint;
              return (
                <Tooltip key={s.friction_id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      className="absolute flex items-start gap-2 px-3.5 py-3 rounded-xl border cursor-default transition-all"
                      style={{
                        left: s.x,
                        top: s.y - 22,
                        background: isActive ? dim.gradient : "hsl(var(--card) / 0.9)",
                        borderColor: isActive ? dim.border : "hsl(var(--border) / 0.3)",
                        boxShadow: isActive
                          ? `0 4px 16px -4px ${dim.text}12, 0 0 0 1px ${dim.border}`
                          : "0 1px 4px -1px hsl(var(--foreground) / 0.03)",
                        maxWidth: 340,
                      }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: isActive ? 1 : 0.65, x: 0 }}
                      whileHover={{ opacity: 1, scale: 1.02 }}
                      transition={{ duration: 0.3, delay: 0.3 + j * 0.06 }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                        style={{
                          background: dim.text,
                          boxShadow: isActive ? `0 0 6px ${dim.text}30` : "none",
                        }}
                      />
                      <span
                        className="text-xs leading-snug font-medium flex-1"
                        style={{ color: "hsl(var(--foreground))" }}
                      >
                        {truncated}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] h-[18px] px-1.5 shrink-0 font-bold mt-0.5 rounded-md"
                        style={{
                          color: dim.text,
                          borderColor: dim.border,
                          background: dim.bg,
                        }}
                      >
                        {s.impact_dimension}
                      </Badge>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs rounded-xl p-3" sideOffset={8}>
                    <p className="text-xs font-bold mb-1.5 text-foreground">{s.structural_constraint}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{s.system_impact}</p>
                    <Badge variant="secondary" className="text-[10px] mt-2 font-bold">{s.impact_dimension}</Badge>
                  </TooltipContent>
                </Tooltip>
              );
            });
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
