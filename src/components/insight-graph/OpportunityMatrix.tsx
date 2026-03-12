/**
 * Opportunity Matrix — 2×2 Impact vs Effort Grid
 *
 * Plots opportunities into quadrants:
 *   Top-Left: High Impact / Low Effort → "Start Here"
 *   Top-Right: High Impact / High Effort
 *   Bottom-Left: Low Impact / Low Effort
 *   Bottom-Right: Low Impact / High Effort
 */

import { memo, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import type { InsightGraph, InsightGraphNode, InsightNodeType } from "@/lib/insightGraph";
import { NODE_TYPE_CONFIG } from "@/lib/insightGraph";
import { getOpportunityNodes } from "@/lib/graphQuery";

interface OpportunityMatrixProps {
  graph: InsightGraph;
  onSelectNode?: (nodeId: string) => void;
}

function getEffortScore(node: InsightGraphNode): number {
  // Use feasibilityScore inverse, or derive from leverageScore/influence
  if (node.feasibilityScore != null) return 1 - Math.min(1, node.feasibilityScore);
  // Lower leverage = higher effort needed
  return 1 - Math.min(1, node.leverageScore / 10);
}

function getImpactScore(node: InsightGraphNode): number {
  return Math.min(1, Math.max(0, node.impact / 10));
}

type Quadrant = "high-impact-low-effort" | "high-impact-high-effort" | "low-impact-low-effort" | "low-impact-high-effort";

function classifyQuadrant(impact: number, effort: number): Quadrant {
  if (impact >= 0.5 && effort < 0.5) return "high-impact-low-effort";
  if (impact >= 0.5 && effort >= 0.5) return "high-impact-high-effort";
  if (impact < 0.5 && effort < 0.5) return "low-impact-low-effort";
  return "low-impact-high-effort";
}

const QUADRANT_CONFIG: Record<Quadrant, { label: string; sublabel: string }> = {
  "high-impact-low-effort": { label: "Start here", sublabel: "High impact · Low effort" },
  "high-impact-high-effort": { label: "Plan carefully", sublabel: "High impact · High effort" },
  "low-impact-low-effort": { label: "Quick wins", sublabel: "Low impact · Low effort" },
  "low-impact-high-effort": { label: "Reconsider", sublabel: "Low impact · High effort" },
};

function OpportunityCard({ node, onClick, index }: { node: InsightGraphNode; onClick: () => void; index: number }) {
  const cfg = NODE_TYPE_CONFIG[node.type as InsightNodeType] || NODE_TYPE_CONFIG.outcome;
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className="text-left w-full rounded-xl px-3.5 py-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: cfg.bgColor,
        border: `1.5px solid ${cfg.borderColor}`,
        minWidth: 180,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
        <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
      <p className="text-[13px] font-bold text-foreground leading-snug line-clamp-2">{node.label}</p>
      {node.reasoning && (
        <p className="text-[11px] text-muted-foreground leading-snug mt-1 line-clamp-1">{node.reasoning}</p>
      )}
    </motion.button>
  );
}

export const OpportunityMatrix = memo(function OpportunityMatrix({ graph, onSelectNode }: OpportunityMatrixProps) {
  const opportunities = useMemo(
    () => getOpportunityNodes(graph).sort((a, b) => b.impact - a.impact),
    [graph],
  );

  const quadrants = useMemo(() => {
    const result: Record<Quadrant, InsightGraphNode[]> = {
      "high-impact-low-effort": [],
      "high-impact-high-effort": [],
      "low-impact-low-effort": [],
      "low-impact-high-effort": [],
    };
    for (const opp of opportunities) {
      const impact = getImpactScore(opp);
      const effort = getEffortScore(opp);
      result[classifyQuadrant(impact, effort)].push(opp);
    }
    return result;
  }, [opportunities]);

  const handleClick = useCallback((id: string) => {
    onSelectNode?.(id);
  }, [onSelectNode]);

  if (opportunities.length === 0) {
    return (
      <div className="flex items-center justify-center h-full rounded-xl bg-muted border border-border">
        <p className="text-sm text-muted-foreground">Run the analysis to populate the Opportunity Matrix.</p>
      </div>
    );
  }

  const quadrantOrder: Quadrant[] = [
    "high-impact-low-effort",
    "high-impact-high-effort",
    "low-impact-low-effort",
    "low-impact-high-effort",
  ];

  return (
    <div className="h-full flex flex-col gap-2">
      {/* Axis labels */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">↑ Impact</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Effort →</span>
      </div>

      {/* 2×2 Grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
        {quadrantOrder.map((q) => {
          const cfg = QUADRANT_CONFIG[q];
          const isStartHere = q === "high-impact-low-effort";
          return (
            <div
              key={q}
              className="rounded-xl p-3 flex flex-col min-h-0 overflow-y-auto"
              style={{
                background: isStartHere
                  ? "hsl(152 60% 44% / 0.06)"
                  : "hsl(var(--muted) / 0.5)",
                border: isStartHere
                  ? "2px solid hsl(152 60% 44% / 0.3)"
                  : "1.5px solid hsl(var(--border))",
              }}
            >
              <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                <span
                  className="text-[11px] font-extrabold uppercase tracking-wide"
                  style={{
                    color: isStartHere ? "hsl(152 60% 44%)" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {cfg.label}
                </span>
                {isStartHere && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{
                    background: "hsl(152 60% 44% / 0.15)",
                    color: "hsl(152 60% 44%)",
                  }}>
                    ★
                  </span>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground mb-2 flex-shrink-0">{cfg.sublabel}</p>

              <div className="space-y-2 flex-1 min-h-0">
                {quadrants[q].length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/60 italic">No opportunities</p>
                ) : (
                  quadrants[q].map((opp, i) => (
                    <OpportunityCard
                      key={opp.id}
                      node={opp}
                      onClick={() => handleClick(opp.id)}
                      index={i}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
