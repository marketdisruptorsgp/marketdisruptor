/**
 * BRANCH GRAVITY MAP
 * Spatial orbital visualization for multi-hypothesis branch selection.
 * Active branch pulls to center; alternatives orbit at distance ∝ dominance delta.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Target, GitBranch, BarChart3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModeTheme } from "@/hooks/useModeTheme";
import type { StrategicHypothesis } from "@/lib/strategicOS";

interface BranchGravityMapProps {
  hypotheses: StrategicHypothesis[];
  activeBranchId: string | null;
  onSelectBranch: (id: string) => void;
  competing: boolean;
  delta: number;
}

const CONSTRAINT_ICONS: Record<string, typeof Zap> = {
  cost: BarChart3, time: Target, adoption: Zap, scale: GitBranch,
  reliability: Shield, risk: AlertTriangle, physical: Target,
  structural: GitBranch, economic: BarChart3,
};

const ANGLE_OFFSETS = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6, Math.PI / 3];

function getNodePositions(
  hypotheses: StrategicHypothesis[],
  activeBranchId: string | null,
  containerW: number,
  containerH: number
) {
  const cx = containerW / 2;
  const cy = containerH / 2;
  const baseRadius = Math.min(cx, cy) * 0.55;

  return hypotheses.map((h, i) => {
    const isActive = h.id === activeBranchId;
    if (isActive) return { x: cx, y: cy, radius: baseRadius };

    // Non-active nodes orbit outward
    const orbitIndex = hypotheses.filter((_, j) => j < i && hypotheses[j].id !== activeBranchId).length;
    const angle = ANGLE_OFFSETS[orbitIndex % ANGLE_OFFSETS.length];
    const r = baseRadius * (0.7 + orbitIndex * 0.15);
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, radius: baseRadius };
  });
}

function EvidenceBar({ mix }: { mix: StrategicHypothesis["evidence_mix"] }) {
  return (
    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden w-full bg-muted/30">
      {mix.verified > 0 && <div className="bg-green-500 rounded-l-full" style={{ width: `${mix.verified * 100}%` }} />}
      {mix.modeled > 0 && <div className="bg-amber-500" style={{ width: `${mix.modeled * 100}%` }} />}
      {mix.assumption > 0 && <div className="bg-red-400 rounded-r-full" style={{ width: `${mix.assumption * 100}%` }} />}
    </div>
  );
}

function NodeExpanded({
  hypothesis,
  isActive,
  onSelect,
}: {
  hypothesis: StrategicHypothesis;
  isActive: boolean;
  onSelect: () => void;
}) {
  const fragilityColor = hypothesis.fragility_score <= 3 ? "text-green-400" : hypothesis.fragility_score <= 6 ? "text-amber-400" : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute z-30 w-64 rounded-xl border border-border/30 bg-card/95 backdrop-blur-md p-4 shadow-2xl"
      style={{ transform: "translate(-50%, -50%)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs font-medium text-foreground leading-snug mb-3 line-clamp-3">
        {hypothesis.hypothesis_statement}
      </p>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Leverage: {hypothesis.leverage_score}/10</span>
          <span>Confidence: {hypothesis.confidence}%</span>
        </div>
        <EvidenceBar mix={hypothesis.evidence_mix} />
        <div className="flex justify-between text-[11px]">
          <span className={fragilityColor}>
            Fragility: {hypothesis.fragility_score}/10
          </span>
          <span className="text-muted-foreground font-mono">
            Dom: {hypothesis.dominance_score?.toFixed(1)}
          </span>
        </div>
      </div>

      {!isActive && (
        <Button size="sm" className="w-full text-xs h-7" onClick={onSelect}>
          Switch to this branch
        </Button>
      )}
      {isActive && (
        <Badge className="w-full justify-center text-xs bg-primary/20 text-primary border-primary/30">
          <CheckCircle2 className="h-3 w-3 mr-1" /> Active Branch
        </Badge>
      )}
    </motion.div>
  );
}

export default function BranchGravityMap({
  hypotheses,
  activeBranchId,
  onSelectBranch,
  competing,
  delta,
}: BranchGravityMapProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const theme = useModeTheme();

  const W = 420;
  const H = 340;

  const positions = useMemo(
    () => getNodePositions(hypotheses, activeBranchId, W, H),
    [hypotheses, activeBranchId]
  );

  const cx = W / 2;
  const cy = H / 2;

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-border/20"
      style={{ background: "hsl(var(--card) / 0.6)", aspectRatio: `${W}/${H}` }}
      onClick={() => setExpandedId(null)}
    >
      {/* SVG connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${W} ${H}`}>
        {hypotheses.map((h, i) => {
          const pos = positions[i];
          const isActive = h.id === activeBranchId;
          if (isActive) return null;
          const dominanceDelta = Math.abs(
            (hypotheses.find(x => x.id === activeBranchId)?.dominance_score ?? 0) -
            (h.dominance_score ?? 0)
          );
          const opacity = Math.max(0.1, 0.6 - dominanceDelta * 0.08);
          return (
            <motion.line
              key={h.id}
              initial={{ pathLength: 0 }}
              animate={{ x1: cx, y1: cy, x2: pos.x, y2: pos.y, pathLength: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              stroke={theme.primary}
              strokeWidth={1}
              strokeOpacity={opacity}
              strokeDasharray="4 3"
            />
          );
        })}
      </svg>

      {/* Competing indicator */}
      {competing && (
        <motion.div
          className="absolute z-10 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium"
          style={{
            left: "50%", top: 12, transform: "translateX(-50%)",
            borderColor: "hsl(var(--destructive) / 0.4)",
            color: "hsl(var(--destructive))",
            background: "hsl(var(--destructive) / 0.08)",
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Δ {delta.toFixed(1)} — close contest
        </motion.div>
      )}

      {/* Hypothesis nodes */}
      {hypotheses.map((h, i) => {
        const pos = positions[i];
        const isActive = h.id === activeBranchId;
        const Icon = CONSTRAINT_ICONS[h.constraint_type] || Target;
        const domScore = h.dominance_score ?? 5;
        const nodeSize = 28 + domScore * 3.5; // 28–63px
        const isExpanded = expandedId === h.id;

        return (
          <motion.div
            key={h.id}
            className="absolute"
            style={{ left: 0, top: 0 }}
            animate={{
              x: pos.x,
              y: pos.y,
              scale: isExpanded ? 1.1 : 1,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          >
            {/* Glow ring for active */}
            {isActive && (
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: nodeSize + 16,
                  height: nodeSize + 16,
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(circle, ${theme.primary}22 0%, transparent 70%)`,
                  border: `1.5px solid ${theme.primary}40`,
                }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            {/* Node circle */}
            <motion.button
              className="absolute flex flex-col items-center justify-center rounded-full cursor-pointer border transition-colors"
              style={{
                width: nodeSize,
                height: nodeSize,
                transform: "translate(-50%, -50%)",
                background: isActive
                  ? `radial-gradient(circle, ${theme.primary}30 0%, ${theme.primary}10 100%)`
                  : "hsl(var(--muted) / 0.5)",
                borderColor: isActive ? theme.primary : "hsl(var(--border) / 0.4)",
              }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setExpandedId(isExpanded ? null : h.id);
              }}
            >
              <Icon
                className="mb-0.5"
                style={{
                  width: nodeSize * 0.32,
                  height: nodeSize * 0.32,
                  color: isActive ? theme.primary : "hsl(var(--muted-foreground))",
                }}
              />
              <span
                className="font-mono font-semibold leading-none"
                style={{
                  fontSize: Math.max(9, nodeSize * 0.2),
                  color: isActive ? theme.primary : "hsl(var(--foreground))",
                }}
              >
                {domScore.toFixed(1)}
              </span>
            </motion.button>

            {/* Label below node */}
            <motion.span
              className="absolute text-[10px] font-medium whitespace-nowrap text-center"
              style={{
                top: nodeSize / 2 + 6,
                left: 0,
                transform: "translateX(-50%)",
                color: isActive ? theme.primary : "hsl(var(--muted-foreground))",
              }}
            >
              {h.constraint_type}
            </motion.span>

            {/* Expanded detail panel */}
            <AnimatePresence>
              {isExpanded && (
                <NodeExpanded
                  hypothesis={h}
                  isActive={isActive}
                  onSelect={() => {
                    onSelectBranch(h.id);
                    setExpandedId(null);
                  }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
