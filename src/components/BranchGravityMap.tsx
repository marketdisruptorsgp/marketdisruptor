/**
 * STRATEGIC MIND MAP — Interactive Branching Tree
 * Horizontal left-to-right decision tree replacing the orbital gravity map.
 * Root node (product) → Primary branches (hypotheses) → Secondary nodes (causal chain).
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Shield, Target, GitBranch, BarChart3, AlertTriangle,
  CheckCircle2, ChevronDown, ChevronRight,
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

/* ─── Layout constants ─── */
const ROOT_X = 60;
const PRIMARY_X = 240;
const SECONDARY_X = 460;
const NODE_GAP_Y = 140;
const SECONDARY_GAP_Y = 38;

function computeLayout(hypotheses: StrategicHypothesis[]) {
  const totalH = hypotheses.length * NODE_GAP_Y;
  const startY = Math.max(60, 200 - totalH / 2);
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

  const svgH = Math.max(380, startY + totalH + 40);
  const svgW = Math.max(620, SECONDARY_X + 200);

  return { rootX: ROOT_X, rootY, primaries, svgW, svgH };
}

/* ─── Bezier path generator ─── */
function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = (x2 - x1) * 0.5;
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

/* ─── Evidence bar (inline) ─── */
function EvidenceBar({ mix }: { mix: StrategicHypothesis["evidence_mix"] }) {
  return (
    <div className="flex gap-px h-1.5 rounded-full overflow-hidden w-full bg-muted/40">
      {mix.verified > 0 && <div className="bg-green-500" style={{ width: `${mix.verified * 100}%` }} />}
      {mix.modeled > 0 && <div className="bg-amber-500" style={{ width: `${mix.modeled * 100}%` }} />}
      {mix.assumption > 0 && <div className="bg-red-400" style={{ width: `${mix.assumption * 100}%` }} />}
    </div>
  );
}

/* ─── Expanded detail panel for a primary branch ─── */
function BranchDetail({
  hypothesis,
  isActive,
  onSelect,
  theme,
}: {
  hypothesis: StrategicHypothesis;
  isActive: boolean;
  onSelect: () => void;
  theme: ReturnType<typeof useModeTheme>;
}) {
  const fragilityColor =
    hypothesis.fragility_score <= 3 ? "text-green-600" :
    hypothesis.fragility_score <= 6 ? "text-amber-600" : "text-red-600";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div
        className="mt-2 rounded-lg border border-border/40 bg-card/90 backdrop-blur-sm p-3 space-y-2 shadow-sm"
        style={{ maxWidth: 220 }}
      >
        <p className="text-[11px] text-foreground leading-snug line-clamp-3">
          {hypothesis.hypothesis_statement}
        </p>

        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Leverage: {hypothesis.leverage_score}/10</span>
          <span>Conf: {hypothesis.confidence}%</span>
        </div>

        <EvidenceBar mix={hypothesis.evidence_mix} />

        <div className="flex justify-between text-[10px]">
          <span className={fragilityColor}>
            Fragility: {hypothesis.fragility_score}/10
          </span>
          <span className="text-muted-foreground font-mono">
            Dom: {hypothesis.dominance_score?.toFixed(1)}
          </span>
        </div>

        {!isActive ? (
          <Button
            size="sm"
            className="w-full text-[11px] h-7"
            style={{ background: theme.primary, color: "white" }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            Focus on this path
          </Button>
        ) : (
          <Badge className="w-full justify-center text-[10px] bg-primary/15 text-primary border-primary/30">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Active Path
          </Badge>
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
                  isActive
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/40 bg-card/60"
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
                {(h.causal_chain || []).map((c) => (
                  <div key={c.friction_id} className="flex items-center gap-2 py-1.5 px-2 rounded-md text-xs text-muted-foreground bg-muted/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
                    <span className="truncate flex-1">{c.structural_constraint}</span>
                    <Badge variant="outline" className="text-[9px] h-4 px-1">{c.impact_dimension}</Badge>
                  </div>
                ))}
                <div className="pt-1">
                  {!isActive ? (
                    <Button size="sm" className="w-full text-xs h-7" onClick={() => onSelectBranch(h.id)}>
                      Focus on this path
                    </Button>
                  ) : (
                    <p className="text-[10px] text-primary text-center font-medium">Currently active — downstream analysis follows this path</p>
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
    <div className="relative w-full rounded-xl overflow-x-auto overflow-y-hidden border border-border/20 bg-card/40">
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
                stroke={isActive ? theme.primary : "hsl(var(--border))"}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeOpacity={isActive ? 0.9 : 0.3}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            );
          })}

          {/* Primary → Secondary connections */}
          {layout.primaries.map(({ hypothesis: h, y: py, secondaries }) => {
            const isActive = h.id === activeBranchId;
            return secondaries.map((s) => (
              <motion.path
                key={`sec-${s.friction_id}`}
                d={bezierPath(PRIMARY_X + 80, py, SECONDARY_X - 8, s.y)}
                fill="none"
                stroke={isActive ? theme.primary : "hsl(var(--border))"}
                strokeWidth={isActive ? 1.5 : 1}
                strokeOpacity={isActive ? 0.6 : 0.15}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            ));
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
          className="absolute flex items-center justify-center"
          style={{ left: layout.rootX - 28, top: layout.rootY - 28 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div
            className="w-14 h-14 rounded-full border-2 border-primary/50 flex items-center justify-center shadow-lg"
            style={{ background: `radial-gradient(circle, ${theme.tint} 0%, hsl(var(--card)) 100%)` }}
          >
            <div className="w-3 h-3 rounded-full" style={{ background: theme.primary }} />
          </div>
          <span className="absolute -bottom-5 text-[10px] font-semibold text-muted-foreground whitespace-nowrap tracking-wide uppercase">
            Root
          </span>
        </motion.div>

        {/* Competing badge */}
        {competing && (
          <motion.div
            className="absolute z-20 px-2.5 py-1 rounded-full border text-[10px] font-medium"
            style={{
              left: PRIMARY_X - 16,
              top: (layout.primaries[0].y + layout.primaries[1].y) / 2 - 10,
              borderColor: "hsl(var(--destructive) / 0.4)",
              color: "hsl(var(--destructive))",
              background: "hsl(var(--destructive) / 0.06)",
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            Δ {delta.toFixed(1)}
          </motion.div>
        )}

        {/* Primary hypothesis nodes */}
        {layout.primaries.map(({ hypothesis: h, x, y, secondaries }, i) => {
          const isActive = h.id === activeBranchId;
          const isExpanded = expandedId === h.id;
          const Icon = CONSTRAINT_ICONS[h.constraint_type] || Target;
          const domScore = h.dominance_score ?? 5;

          return (
            <motion.div
              key={h.id}
              className="absolute"
              style={{ left: x - 48, top: y - 24 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              {/* Active glow ring */}
              {isActive && (
                <motion.div
                  className="absolute -inset-2 rounded-2xl"
                  style={{
                    background: `radial-gradient(ellipse at center, ${theme.primary}15 0%, transparent 70%)`,
                    border: `1px solid ${theme.primary}30`,
                  }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}

              {/* Node button */}
              <motion.button
                className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-colors ${
                  isActive
                    ? "border-primary/60 bg-card shadow-md"
                    : "border-border/30 bg-card/80 hover:border-primary/30 hover:shadow-sm"
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePrimaryClick(h.id)}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? "bg-primary/15" : "bg-muted/60"}`}>
                  <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground capitalize">{h.constraint_type}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">{domScore.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{h.confidence}%</span>
                    {isActive && (
                      <span className="text-[9px] font-medium text-primary ml-1">ACTIVE</span>
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
            return secondaries.map((s, j) => (
              <Tooltip key={s.friction_id}>
                <TooltipTrigger asChild>
                  <motion.div
                    className={`absolute flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-default transition-colors ${
                      isActive
                        ? "border-primary/25 bg-card/90"
                        : "border-border/20 bg-card/50"
                    }`}
                    style={{ left: s.x, top: s.y - 14 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: isActive ? 1 : 0.45, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + j * 0.05 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isActive ? theme.primary : "hsl(var(--border))" }} />
                    <span className={`text-[10px] truncate max-w-[120px] ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.structural_constraint}
                    </span>
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 shrink-0 border-border/30">
                      {s.impact_dimension}
                    </Badge>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="text-xs font-medium mb-1">{s.structural_constraint}</p>
                  <p className="text-[11px] text-muted-foreground">{s.system_impact}</p>
                  <Badge variant="secondary" className="text-[10px] mt-1.5">{s.impact_dimension}</Badge>
                </TooltipContent>
              </Tooltip>
            ));
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
