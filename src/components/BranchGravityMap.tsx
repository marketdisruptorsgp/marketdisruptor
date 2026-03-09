/**
 * STRATEGIC MIND MAP — Interactive Branching Tree
 * Horizontal decision tree with logical color coding:
 *   Green = Active (selected hypothesis)
 *   Slate = Alternative (available to explore)
 * All bubbles fully visible. Click to expand full text.
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Shield, Target, GitBranch, BarChart3, AlertTriangle,
  CheckCircle2, ChevronDown, X, Sparkles, ArrowRight, Maximize2, Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

/* ─── Semantic status colors ─── */
const STATUS = {
  active: {
    bg: "hsl(152 60% 40% / 0.06)",
    border: "hsl(152 60% 40% / 0.35)",
    text: "hsl(152 60% 30%)",
    badge: "hsl(152 60% 40%)",
    line: "hsl(152 60% 40%)",
    glow: "hsl(152 60% 40% / 0.12)",
    gradient: "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(152 60% 40% / 0.06) 100%)",
    label: "Active",
  },
  alternative: {
    bg: "hsl(var(--muted) / 0.3)",
    border: "hsl(var(--border) / 0.5)",
    text: "hsl(var(--foreground))",
    badge: "hsl(var(--muted-foreground))",
    line: "hsl(var(--muted-foreground))",
    glow: "transparent",
    gradient: "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.2) 100%)",
    label: "Alternative",
  },
};

/* ─── Layout constants ─── */
const ROOT_X = 80;
const PRIMARY_X = 300;
const SECONDARY_X = 580;
const NODE_GAP_Y = 260;
const SECONDARY_GAP_Y = 90;

function computeLayout(hypotheses: StrategicHypothesis[]) {
  const totalH = hypotheses.length * NODE_GAP_Y;
  const startY = Math.max(120, 260 - totalH / 2);
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
  const svgH = Math.max(560, maxSecY + 160, startY + totalH + 140);
  const svgW = Math.max(1060, SECONDARY_X + 460);

  return { rootX: ROOT_X, rootY, primaries, svgW, svgH };
}

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

/* ─── Legend / Key ─── */
function MapLegend({ isCombined }: { isCombined: boolean }) {
  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-4 px-3.5 py-2 rounded-xl text-[10px] font-bold flex-wrap"
      style={{ background: "hsl(var(--card) / 0.95)", border: "1px solid hsl(var(--border) / 0.4)", backdropFilter: "blur(8px)" }}
    >
      <span className="text-muted-foreground uppercase tracking-wider">Key</span>
      {isCombined ? (
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: "hsl(210 60% 50%)" }} />
          <span style={{ color: "hsl(210 60% 35%)" }}>All active (combined)</span>
        </span>
      ) : (
        <>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: STATUS.active.badge }} />
            <span style={{ color: STATUS.active.text }}>Active path</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} />
            <span className="text-muted-foreground">Alternative</span>
          </span>
        </>
      )}
    </div>
  );
}

/* ─── Expandable secondary node (inline) ─── */
function SecondaryBubble({
  constraint,
  systemImpact,
  dimension,
  isActive,
  x,
  y,
  delay,
}: {
  constraint: string;
  systemImpact: string;
  dimension: string;
  isActive: boolean;
  x: number;
  y: number;
  delay: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = isActive ? STATUS.active : STATUS.alternative;
  const displayText = constraint;

  return (
    <motion.div
      className="absolute flex items-start gap-2 px-3.5 py-3 rounded-xl border cursor-pointer transition-colors"
      style={{
        left: x,
        top: y - 24,
        background: isActive ? STATUS.active.bg : "hsl(var(--card))",
        borderColor: isActive ? STATUS.active.border : "hsl(var(--border) / 0.4)",
        boxShadow: isActive
          ? `0 4px 16px -4px ${STATUS.active.glow}`
          : "0 2px 8px -3px hsl(var(--foreground) / 0.04)",
        maxWidth: expanded ? 420 : 360,
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={() => setExpanded(!expanded)}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
        style={{ background: isActive ? STATUS.active.badge : "hsl(var(--muted-foreground) / 0.4)" }}
      />
      <div className="flex-1 min-w-0">
        <span className="text-xs leading-snug font-medium text-foreground block">
          {displayText}
        </span>
        <AnimatePresence>
          {expanded && systemImpact && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] text-muted-foreground leading-relaxed mt-1.5 overflow-hidden"
            >
              {systemImpact}
            </motion.p>
          )}
        </AnimatePresence>
        {constraint.length > 70 && (
          <span className="text-[10px] font-bold mt-1 inline-block" style={{ color: isActive ? STATUS.active.text : "hsl(var(--primary))" }}>
            {expanded ? "Show less" : "Read more"}
          </span>
        )}
      </div>
      <Badge
        variant="outline"
        className="text-[9px] h-[18px] px-1.5 shrink-0 font-bold mt-0.5 rounded-md"
        style={{
          color: isActive ? STATUS.active.text : "hsl(var(--muted-foreground))",
          borderColor: isActive ? STATUS.active.border : "hsl(var(--border) / 0.5)",
          background: isActive ? STATUS.active.bg : "hsl(var(--muted) / 0.3)",
        }}
      >
        {dimension}
      </Badge>
    </motion.div>
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
  const status = isActive ? STATUS.active : STATUS.alternative;

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
          background: isActive ? STATUS.active.gradient : STATUS.alternative.gradient,
          borderColor: isActive ? STATUS.active.border : "hsl(var(--border) / 0.5)",
          boxShadow: isActive
            ? `0 12px 40px -8px ${STATUS.active.glow}`
            : "0 12px 40px -8px hsl(var(--foreground) / 0.06)",
        }}
      >
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

        <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
          <div className="flex justify-between items-center px-2.5 py-1.5 rounded-lg" style={{ background: "hsl(var(--muted) / 0.4)" }}>
            <span className="text-muted-foreground">Leverage</span>
            <span className="font-extrabold text-foreground">{hypothesis.leverage_score >= 8 ? "High" : hypothesis.leverage_score >= 5 ? "Moderate" : "Low"}</span>
          </div>
          <div className="flex justify-between items-center px-2.5 py-1.5 rounded-lg" style={{ background: "hsl(var(--muted) / 0.4)" }}>
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-extrabold text-foreground">{hypothesis.confidence >= 75 ? "Strong" : hypothesis.confidence >= 50 ? "Moderate" : "Early"}</span>
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

        <Button
          size="sm"
          className="w-full text-xs font-bold h-10 rounded-xl gap-2"
          style={{ background: STATUS.active.badge, color: "white" }}
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Focus on this only
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Mobile accordion tree ─── */
function MobileTree({
  hypotheses, activeBranchId, onSelectBranch, theme,
}: BranchGravityMapProps & { theme: ReturnType<typeof useModeTheme> }) {
  const isCombined = !activeBranchId || activeBranchId === "combined";

  return (
    <div className="space-y-2.5">
      {/* Combined toggle */}
      <button
        onClick={() => onSelectBranch("combined")}
        className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all"
        style={{
          borderColor: isCombined ? "hsl(210 60% 50% / 0.4)" : "hsl(var(--border) / 0.4)",
          background: isCombined
            ? "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(210 60% 50% / 0.06) 100%)"
            : "hsl(var(--card))",
        }}
      >
        <div className="p-2 rounded-lg" style={{ background: isCombined ? "hsl(210 60% 50% / 0.1)" : "hsl(var(--muted) / 0.5)" }}>
          <Layers className="h-4 w-4" style={{ color: isCombined ? "hsl(210 60% 40%)" : "hsl(var(--muted-foreground))" }} />
        </div>
        <div className="flex-1 text-left">
          <span className="text-sm font-bold text-foreground">Combined View</span>
          <p className="text-[11px] text-muted-foreground mt-0.5">All hypotheses weighed together</p>
        </div>
        {isCombined && (
          <Badge className="text-[10px] h-5 px-2 border-0 font-bold" style={{ background: "hsl(210 60% 50%)", color: "white" }}>
            Default
          </Badge>
        )}
      </button>

      <div className="flex items-center gap-2 px-1">
        <div className="h-px flex-1" style={{ background: "hsl(var(--border) / 0.4)" }} />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">or focus on one</span>
        <div className="h-px flex-1" style={{ background: "hsl(var(--border) / 0.4)" }} />
      </div>

      {hypotheses.map((h) => {
        const isActive = !isCombined && h.id === activeBranchId;
        const Icon = CONSTRAINT_ICONS[h.constraint_type] || Target;
        const status = isActive ? STATUS.active : STATUS.alternative;
        return (
          <Collapsible key={h.id} defaultOpen={isActive}>
            <CollapsibleTrigger className="w-full">
              <div
                className="flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all"
                style={{
                  borderColor: status.border,
                  background: status.gradient,
                }}
              >
                <div className="p-2 rounded-lg" style={{ background: isActive ? STATUS.active.bg : "hsl(var(--muted) / 0.5)" }}>
                  <Icon className="h-4 w-4" style={{ color: isActive ? STATUS.active.badge : "hsl(var(--muted-foreground))" }} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground capitalize">{h.constraint_type}</span>
                    <span className="text-xs font-mono font-bold text-muted-foreground">{h.dominance_score?.toFixed(1)}</span>
                    {isActive && (
                      <Badge className="text-[10px] h-4 px-1.5 border-0" style={{ background: STATUS.active.badge, color: "white" }}>
                        Focused
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 text-left">
                    {h.hypothesis_statement}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform [[data-state=open]>&]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-4 sm:pl-10 pt-1.5 space-y-1.5">
                {(h.causal_chain || []).map((c) => (
                  <div
                    key={c.friction_id}
                    className="flex items-start gap-2 py-2.5 px-3 rounded-xl text-xs"
                    style={{
                      background: isActive ? STATUS.active.bg : "hsl(var(--muted) / 0.2)",
                      border: `1px solid ${isActive ? STATUS.active.border : "hsl(var(--border) / 0.3)"}`,
                    }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: isActive ? STATUS.active.badge : "hsl(var(--muted-foreground) / 0.4)" }} />
                    <span className="flex-1 text-foreground leading-snug font-medium">{c.structural_constraint}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0 font-bold">
                      {c.impact_dimension}
                    </Badge>
                  </div>
                ))}
                <div className="pt-1.5">
                  {!isActive ? (
                    <Button size="sm" className="w-full text-xs h-8 rounded-lg gap-1.5" style={{ background: STATUS.active.badge, color: "white" }} onClick={() => onSelectBranch(h.id)}>
                      <Sparkles className="h-3 w-3" />
                      Focus on this only
                    </Button>
                  ) : (
                    <p className="text-[10px] text-center font-bold py-1.5" style={{ color: STATUS.active.text }}>
                      Focused — all downstream steps follow this angle
                    </p>
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
  const isCombined = !activeBranchId || activeBranchId === "combined";
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
        background: `linear-gradient(160deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.12) 50%, hsl(var(--card)) 100%)`,
      }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0.5px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Legend */}
      <MapLegend isCombined={isCombined} />

      {/* Combined mode toggle */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => onSelectBranch("combined")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
          style={{
            background: isCombined ? "hsl(210 60% 50% / 0.08)" : "hsl(var(--card) / 0.95)",
            border: isCombined ? "2px solid hsl(210 60% 50% / 0.35)" : "1px solid hsl(var(--border) / 0.4)",
            color: isCombined ? "hsl(210 60% 35%)" : "hsl(var(--muted-foreground))",
            backdropFilter: "blur(8px)",
          }}
        >
          <Layers className="h-3.5 w-3.5" />
          Combined View
          {isCombined && (
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ml-1" style={{ background: "hsl(210 60% 50%)", color: "white" }}>
              Default
            </span>
          )}
        </button>
      </div>

      <div style={{ minWidth: layout.svgW, minHeight: layout.svgH, position: "relative" }}>

        {/* SVG layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={layout.svgW}
          height={layout.svgH}
          viewBox={`0 0 ${layout.svgW} ${layout.svgH}`}
        >
          <defs>
            <linearGradient id="activeLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={STATUS.active.badge} stopOpacity="0.5" />
              <stop offset="50%" stopColor={STATUS.active.badge} stopOpacity="0.85" />
              <stop offset="100%" stopColor={STATUS.active.badge} stopOpacity="0.4" />
            </linearGradient>
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
            const isActive = isCombined || h.id === activeBranchId;
            return (
              <g key={`root-${h.id}`}>
                {isActive && (
                  <motion.path
                    d={bezierPath(layout.rootX + 28, layout.rootY, PRIMARY_X - 28, y)}
                    fill="none"
                    stroke={STATUS.active.badge}
                    strokeWidth={6}
                    strokeOpacity={0.08}
                    filter="url(#lineGlow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8 }}
                  />
                )}
                <motion.path
                  d={bezierPath(layout.rootX + 28, layout.rootY, PRIMARY_X - 28, y)}
                  fill="none"
                  stroke={isActive ? "url(#activeLineGrad)" : "hsl(var(--border))"}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeOpacity={isActive ? 1 : 0.5}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7 }}
                />
              </g>
            );
          })}

          {/* Primary → Secondary connections */}
          {layout.primaries.map(({ hypothesis: h, y: py, secondaries }) => {
            const isActive = isCombined || h.id === activeBranchId;
            return secondaries.map((s) => (
              <motion.path
                key={`sec-${s.friction_id}`}
                d={bezierPath(PRIMARY_X + 100, py, SECONDARY_X - 8, s.y)}
                fill="none"
                stroke={isActive ? STATUS.active.line : "hsl(var(--border))"}
                strokeWidth={isActive ? 1.5 : 1}
                strokeOpacity={isActive ? 0.5 : 0.35}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              />
            ));
          })}

          {/* Competing tension line */}
          {competing && layout.primaries.length >= 2 && (
            <motion.path
              d={bezierPath(PRIMARY_X + 50, layout.primaries[0].y + 20, PRIMARY_X + 50, layout.primaries[1].y - 20)}
              fill="none"
              stroke="hsl(38 92% 50%)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeOpacity={0.4}
              animate={{ strokeOpacity: [0.2, 0.5, 0.2] }}
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
              border: "2px solid hsl(var(--border) / 0.4)",
              background: `radial-gradient(circle at 40% 40%, hsl(var(--muted) / 0.5) 0%, hsl(var(--card)) 100%)`,
              boxShadow: "0 4px 20px -4px hsl(var(--foreground) / 0.06)",
            }}
          >
            <motion.div
              className="w-4 h-4 rounded-full"
              style={{
                background: `radial-gradient(circle, ${STATUS.active.badge}, ${STATUS.active.badge}90)`,
                boxShadow: `0 0 12px ${STATUS.active.glow}`,
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
              color: "hsl(38 92% 38%)",
              background: "hsl(38 92% 50% / 0.08)",
              border: "1.5px solid hsl(38 92% 50% / 0.25)",
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Δ {delta.toFixed(1)} — close contest
          </motion.div>
        )}

        {/* Primary hypothesis nodes */}
        {layout.primaries.map(({ hypothesis: h, x, y }, i) => {
          const isActive = isCombined || h.id === activeBranchId;
          const isExpanded = expandedId === h.id;
          const Icon = CONSTRAINT_ICONS[h.constraint_type] || Target;
          const domScore = h.dominance_score ?? 5;
          const isPrimary = i === 0;
          const status = isActive ? STATUS.active : STATUS.alternative;

          return (
            <motion.div
              key={h.id}
              className="absolute"
              style={{ left: x - 56, top: y - 32 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
            >
              {/* Active glow ring */}
              {isActive && (
                <motion.div
                  className="absolute -inset-4 rounded-2xl"
                  style={{
                    background: `radial-gradient(ellipse at center, ${STATUS.active.glow} 0%, transparent 70%)`,
                    border: `1.5px solid ${STATUS.active.border}`,
                    borderRadius: "1rem",
                  }}
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                />
              )}

              {/* Node button */}
              <motion.button
                className="relative flex items-center gap-3.5 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all"
                style={{
                  borderColor: status.border,
                  background: status.gradient,
                  boxShadow: isActive
                    ? `0 8px 32px -8px ${STATUS.active.glow}`
                    : "0 2px 12px -4px hsl(var(--foreground) / 0.04)",
                }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: `0 8px 32px -6px ${isActive ? STATUS.active.glow : "hsl(var(--foreground) / 0.08)"}`,
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePrimaryClick(h.id)}
              >
                <div
                  className="p-2.5 rounded-xl"
                  style={{
                    background: isActive ? STATUS.active.bg : "hsl(var(--muted) / 0.5)",
                    border: `1px solid ${status.border}`,
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: isActive ? STATUS.active.badge : "hsl(var(--muted-foreground))" }}
                  />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-foreground capitalize">{h.constraint_type}</span>
                    <span className="text-xs font-mono font-extrabold text-muted-foreground">
                      {domScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="text-xs font-bold text-muted-foreground">{h.confidence}%</span>
                    {isActive && !isCombined && (
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md"
                        style={{ background: STATUS.active.badge, color: "white" }}
                      >
                        Focused
                      </span>
                    )}
                    {isPrimary && !isActive && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-muted-foreground"
                        style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border) / 0.5)" }}
                      >
                        Highest
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>

              {/* Expanded detail */}
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

        {/* Secondary causal chain nodes — all fully visible, expandable */}
        {layout.primaries.map(({ hypothesis: h, secondaries }) => {
          const isActive = isCombined || h.id === activeBranchId;
          return secondaries.map((s, j) => (
            <SecondaryBubble
              key={s.friction_id}
              constraint={s.structural_constraint}
              systemImpact={s.system_impact}
              dimension={s.impact_dimension}
              isActive={isActive}
              x={s.x}
              y={s.y}
              delay={0.3 + j * 0.06}
            />
          ));
        })}
      </div>
    </div>
  );
}
