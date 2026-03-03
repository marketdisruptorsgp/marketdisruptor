/**
 * STRATEGIC MIND MAP — Interactive Branching Tree
 * Horizontal left-to-right decision tree.
 * Root node → Primary branches (hypotheses) → Secondary nodes (causal chain).
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Shield, Target, GitBranch, BarChart3, AlertTriangle,
  CheckCircle2, ChevronDown, X,
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

/* ─── Dimension colors ─── */
const DIM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  cost: { bg: "hsl(var(--primary) / 0.08)", text: "hsl(var(--primary))", border: "hsl(var(--primary) / 0.25)" },
  adoption: { bg: "hsl(38 92% 50% / 0.08)", text: "hsl(38 92% 45%)", border: "hsl(38 92% 50% / 0.25)" },
  reliability: { bg: "hsl(142 70% 40% / 0.08)", text: "hsl(142 70% 35%)", border: "hsl(142 70% 40% / 0.25)" },
  risk: { bg: "hsl(0 72% 51% / 0.08)", text: "hsl(0 72% 45%)", border: "hsl(0 72% 51% / 0.25)" },
  time: { bg: "hsl(262 83% 58% / 0.08)", text: "hsl(262 83% 48%)", border: "hsl(262 83% 58% / 0.25)" },
  scale: { bg: "hsl(199 89% 48% / 0.08)", text: "hsl(199 89% 40%)", border: "hsl(199 89% 48% / 0.25)" },
};
const DEFAULT_DIM = { bg: "hsl(var(--muted))", text: "hsl(var(--foreground))", border: "hsl(var(--border))" };

/* ─── Layout constants ─── */
const ROOT_X = 80;
const PRIMARY_X = 280;
const SECONDARY_X = 540;
const NODE_GAP_Y = 220;
const SECONDARY_GAP_Y = 58;

function computeLayout(hypotheses: StrategicHypothesis[]) {
  const totalH = hypotheses.length * NODE_GAP_Y;
  const startY = Math.max(80, 220 - totalH / 2);
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

  const svgH = Math.max(500, startY + totalH + 100);
  const svgW = Math.max(960, SECONDARY_X + 420);

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
    <div className="flex gap-px h-2 rounded-full overflow-hidden w-full" style={{ background: "hsl(var(--muted) / 0.5)" }}>
      {mix.verified > 0 && <div style={{ width: `${mix.verified * 100}%`, background: "hsl(142 70% 45%)" }} />}
      {mix.modeled > 0 && <div style={{ width: `${mix.modeled * 100}%`, background: "hsl(38 92% 50%)" }} />}
      {mix.assumption > 0 && <div style={{ width: `${mix.assumption * 100}%`, background: "hsl(0 72% 55%)" }} />}
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
    hypothesis.fragility_score <= 3 ? "hsl(142 70% 35%)" :
    hypothesis.fragility_score <= 6 ? "hsl(38 92% 40%)" : "hsl(0 72% 45%)";
  const fragilityLabel =
    hypothesis.fragility_score <= 3 ? "Resilient" :
    hypothesis.fragility_score <= 6 ? "Moderate" : "Fragile";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative z-30 mt-3"
      style={{ minWidth: 300, maxWidth: 360 }}
    >
      <div
        className="rounded-xl border-2 p-4 space-y-3 shadow-xl"
        style={{
          background: "hsl(var(--card))",
          borderColor: isActive ? theme.primary : "hsl(var(--border))",
          boxShadow: `0 8px 32px -8px ${isActive ? theme.primary + "30" : "hsl(var(--foreground) / 0.08)"}`,
        }}
      >
        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-muted"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <X size={14} />
        </button>

        <p className="text-sm font-bold text-foreground leading-snug pr-6">
          {hypothesis.hypothesis_statement}
        </p>

        {/* Score grid */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Leverage</span>
            <span className="font-bold text-foreground">{hypothesis.leverage_score}/10</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-bold text-foreground">{hypothesis.confidence}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fragility</span>
            <span className="font-bold" style={{ color: fragilityColor }}>{fragilityLabel} ({hypothesis.fragility_score}/10)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dominance</span>
            <span className="font-bold text-foreground font-mono">{hypothesis.dominance_score?.toFixed(1)}</span>
          </div>
        </div>

        {/* Evidence bar */}
        <EvidenceBar mix={hypothesis.evidence_mix} />
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "hsl(142 70% 45%)" }} />
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

        {hypothesis.downstream_implications && (
          <p className="text-xs text-foreground/70 border-t pt-2" style={{ borderColor: "hsl(var(--border))" }}>
            → {hypothesis.downstream_implications}
          </p>
        )}

        {!isActive ? (
          <Button
            size="sm"
            className="w-full text-xs font-bold h-9"
            style={{ background: theme.primary, color: "white" }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            Explore this interpretation
          </Button>
        ) : (
          <div
            className="w-full text-center text-xs font-bold py-2 rounded-md"
            style={{ background: `${theme.primary}15`, color: theme.primary, border: `1px solid ${theme.primary}30` }}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 inline" />
            Currently active — guiding all downstream steps
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
    <div className="space-y-2">
      {hypotheses.map((h, i) => {
        const isActive = h.id === activeBranchId;
        const Icon = CONSTRAINT_ICONS[h.constraint_type] || Target;
        return (
          <Collapsible key={h.id} defaultOpen={isActive}>
            <CollapsibleTrigger className="w-full">
              <div
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  isActive ? "border-primary/60 bg-primary/5" : "border-border/40 bg-card/60"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? "bg-primary/20" : "bg-muted"}`}>
                  <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground capitalize">{h.constraint_type}</span>
                    <span className="text-xs font-mono text-muted-foreground">{h.dominance_score?.toFixed(1)}</span>
                    {isActive && <Badge variant="default" className="text-[10px] h-4 px-1.5">Active</Badge>}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-10 pt-1 space-y-1">
                {(h.causal_chain || []).map((c) => {
                  const dim = DIM_COLORS[c.impact_dimension] || DEFAULT_DIM;
                  return (
                    <div
                      key={c.friction_id}
                      className="flex items-start gap-2 py-2 px-3 rounded-lg text-xs"
                      style={{ background: dim.bg, border: `1px solid ${dim.border}` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: dim.text }} />
                      <span className="flex-1 text-foreground leading-snug">{c.structural_constraint}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 shrink-0" style={{ color: dim.text, borderColor: dim.border }}>
                        {c.impact_dimension}
                      </Badge>
                    </div>
                  );
                })}
                <div className="pt-1">
                  {!isActive ? (
                    <Button size="sm" className="w-full text-xs h-7" onClick={() => onSelectBranch(h.id)}>
                      Explore this interpretation
                    </Button>
                  ) : (
                    <p className="text-[10px] text-primary text-center font-medium py-1">Currently active — guiding downstream analysis</p>
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
      className="relative w-full rounded-xl overflow-x-auto overflow-y-visible"
      style={{
        border: "1px solid hsl(var(--border) / 0.3)",
        background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.3) 100%)",
      }}
    >
      <div style={{ minWidth: layout.svgW, minHeight: layout.svgH, position: "relative" }}>

        {/* SVG layer — connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={layout.svgW}
          height={layout.svgH}
          viewBox={`0 0 ${layout.svgW} ${layout.svgH}`}
        >
          {/* Root → Primary connections */}
          {layout.primaries.map(({ hypothesis: h, y }) => {
            const isActive = h.id === activeBranchId;
            return (
              <motion.path
                key={`root-${h.id}`}
                d={bezierPath(layout.rootX + 28, layout.rootY, PRIMARY_X - 24, y)}
                fill="none"
                stroke={isActive ? theme.primary : "hsl(var(--muted-foreground))"}
                strokeWidth={isActive ? 3 : 1.5}
                strokeOpacity={isActive ? 0.8 : 0.15}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
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
                  d={bezierPath(PRIMARY_X + 90, py, SECONDARY_X - 8, s.y)}
                  fill="none"
                  stroke={isActive ? dim.text : "hsl(var(--border))"}
                  strokeWidth={isActive ? 2 : 1}
                  strokeOpacity={isActive ? 0.5 : 0.12}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              );
            });
          })}

          {/* Competing tension line */}
          {competing && layout.primaries.length >= 2 && (
            <motion.path
              d={bezierPath(PRIMARY_X, layout.primaries[0].y, PRIMARY_X, layout.primaries[1].y)}
              fill="none"
              stroke="hsl(var(--destructive))"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeOpacity={0.5}
              animate={{ strokeOpacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </svg>

        {/* Root node */}
        <motion.div
          className="absolute flex flex-col items-center"
          style={{ left: layout.rootX - 28, top: layout.rootY - 28 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div
            className="w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-lg"
            style={{
              borderColor: `${theme.primary}50`,
              background: `radial-gradient(circle, ${theme.tint} 0%, hsl(var(--card)) 100%)`,
            }}
          >
            <motion.div
              className="w-3.5 h-3.5 rounded-full"
              style={{ background: theme.primary }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <span className="mt-1.5 text-[10px] font-bold text-foreground/60 uppercase tracking-widest">
            Root
          </span>
        </motion.div>

        {/* Competing badge */}
        {competing && (
          <motion.div
            className="absolute z-20 px-3 py-1 rounded-full border text-[10px] font-bold"
            style={{
              left: PRIMARY_X - 16,
              top: (layout.primaries[0].y + layout.primaries[1].y) / 2 - 10,
              borderColor: "hsl(var(--destructive) / 0.4)",
              color: "hsl(var(--destructive))",
              background: "hsl(var(--destructive) / 0.08)",
            }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            Δ {delta.toFixed(1)}
          </motion.div>
        )}

        {/* Primary hypothesis nodes */}
        {layout.primaries.map(({ hypothesis: h, x, y }, i) => {
          const isActive = h.id === activeBranchId;
          const isExpanded = expandedId === h.id;
          const Icon = CONSTRAINT_ICONS[h.constraint_type] || Target;
          const domScore = h.dominance_score ?? 5;
          const isPrimary = i === 0;

          return (
            <motion.div
              key={h.id}
              className="absolute"
              style={{ left: x - 48, top: y - 28 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              {/* Active glow ring */}
              {isActive && (
                <motion.div
                  className="absolute -inset-3 rounded-2xl"
                  style={{
                    background: `radial-gradient(ellipse at center, ${theme.primary}12 0%, transparent 70%)`,
                    border: `1.5px solid ${theme.primary}25`,
                  }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}

              {/* Node button */}
              <motion.button
                className="relative flex items-center gap-3 px-5 py-3.5 rounded-xl border-2 cursor-pointer transition-all"
                style={{
                  borderColor: isActive ? `${theme.primary}70` : "hsl(var(--border) / 0.5)",
                  background: isActive
                    ? `linear-gradient(135deg, hsl(var(--card)) 0%, ${theme.primary}08 100%)`
                    : "hsl(var(--card))",
                  boxShadow: isActive
                    ? `0 4px 20px -4px ${theme.primary}25`
                    : "0 2px 8px -2px hsl(var(--foreground) / 0.06)",
                }}
                whileHover={{ scale: 1.04, boxShadow: `0 6px 24px -4px ${theme.primary}20` }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePrimaryClick(h.id)}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{
                    background: isActive ? `${theme.primary}18` : "hsl(var(--muted))",
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: isActive ? theme.primary : "hsl(var(--muted-foreground))" }}
                  />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground capitalize">{h.constraint_type}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: isActive ? theme.primary : "hsl(var(--muted-foreground))" }}>
                      {domScore.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-foreground/60">{h.confidence}%</span>
                    {isActive && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                        style={{ background: `${theme.primary}15`, color: theme.primary }}
                      >
                        Active
                      </span>
                    )}
                    {isPrimary && !isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/60">
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

        {/* Secondary causal chain nodes */}
        <TooltipProvider delayDuration={200}>
          {layout.primaries.map(({ hypothesis: h, secondaries }) => {
            const isActive = h.id === activeBranchId;
            return secondaries.map((s, j) => {
              const dim = DIM_COLORS[s.impact_dimension] || DEFAULT_DIM;
              return (
                <Tooltip key={s.friction_id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      className="absolute flex items-start gap-2 px-3 py-2.5 rounded-xl border cursor-default transition-all"
                      style={{
                        left: s.x,
                        top: s.y - 18,
                        background: isActive ? dim.bg : "hsl(var(--card) / 0.7)",
                        borderColor: isActive ? dim.border : "hsl(var(--border) / 0.25)",
                        boxShadow: isActive ? `0 2px 12px -4px ${dim.text}15` : "none",
                        maxWidth: 320,
                      }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: isActive ? 1 : 0.45, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + j * 0.06 }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0 mt-1"
                        style={{ background: isActive ? dim.text : "hsl(var(--border))" }}
                      />
                      <span
                        className="text-xs leading-snug font-medium flex-1"
                        style={{ color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                      >
                        {s.structural_constraint}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] h-4 px-1.5 shrink-0 font-bold mt-0.5"
                        style={{
                          color: isActive ? dim.text : "hsl(var(--muted-foreground))",
                          borderColor: isActive ? dim.border : "hsl(var(--border) / 0.4)",
                        }}
                      >
                        {s.impact_dimension}
                      </Badge>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs font-semibold mb-1 text-foreground">{s.structural_constraint}</p>
                    <p className="text-[11px] text-muted-foreground">{s.system_impact}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1.5">{s.impact_dimension}</Badge>
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
