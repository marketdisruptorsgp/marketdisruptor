/**
 * Opportunity Landscape — Narrative Strategic Move Cards
 *
 * Each card tells a story:
 *   "We found [constraint] → This suggests [move] → Because [reasoning]"
 *
 * No internal jargon (CONCEPT, LEVERAGE, etc.) — users see strategic narratives.
 * Cards are always shown (no scatter chart) since density is rarely >10.
 */

import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ArrowRight, ChevronDown, ChevronUp,
  TrendingUp, Lightbulb, Search, ArrowDown,
} from "lucide-react";
import type { InsightGraph, InsightGraphNode } from "@/lib/insightGraph";
import { NODE_TYPE_CONFIG, OPPORTUNITY_NODE_TYPES } from "@/lib/insightGraph";

/* ═══════════════════════════════════════════════════════
   HELPERS — trace the reasoning chain for each opportunity
   ═══════════════════════════════════════════════════════ */

/** Walk backwards through the graph to find the constraint/signal that led to this opportunity */
function findSourceChain(node: InsightGraphNode, graph: InsightGraph): {
  sourceConstraint: InsightGraphNode | null;
  sourceSignal: InsightGraphNode | null;
  leveragePoint: InsightGraphNode | null;
} {
  const visited = new Set<string>();
  const queue = [node.id];
  let sourceConstraint: InsightGraphNode | null = null;
  let sourceSignal: InsightGraphNode | null = null;
  let leveragePoint: InsightGraphNode | null = null;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const incomingEdges = graph.edges.filter(e => e.target === current);
    for (const edge of incomingEdges) {
      const src = graph.nodes.find(n => n.id === edge.source);
      if (!src) continue;

      if (src.type === "constraint" && !sourceConstraint) sourceConstraint = src;
      else if ((src.type === "signal" || src.type === "evidence" || src.type === "friction") && !sourceSignal) sourceSignal = src;
      else if (src.type === "leverage_point" && !leveragePoint) leveragePoint = src;

      if (visited.size < 12) queue.push(src.id);
    }
  }

  return { sourceConstraint, sourceSignal, leveragePoint };
}

/* ═══════════════════════════════════════════════════════
   CARD — One strategic move, told as a narrative
   ═══════════════════════════════════════════════════════ */

function OpportunityCard({
  node, rank, graph, isExpanded, onToggle, onSelect,
}: {
  node: InsightGraphNode;
  rank: number;
  graph: InsightGraph;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: (id: string) => void;
}) {
  const { sourceConstraint, sourceSignal } = useMemo(
    () => findSourceChain(node, graph), [node, graph]
  );
  const isPrimary = rank === 1;

  // Build a one-line "origin" sentence — WHERE did this idea come from?
  const originText = sourceConstraint?.label
    ? `Based on: ${sourceConstraint.label}`
    : sourceSignal?.label
      ? `Based on: ${sourceSignal.label}`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08, duration: 0.35 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: isPrimary
          ? "1.5px solid hsl(var(--primary) / 0.4)"
          : "1.5px solid hsl(var(--border))",
        boxShadow: isPrimary
          ? "0 4px 24px hsl(var(--primary) / 0.08)"
          : "none",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3.5 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
      >
        {/* Rank */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: isPrimary ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted))",
            color: isPrimary ? "hsl(var(--primary))" : "hsl(var(--foreground))",
          }}
        >
          <span className="text-xs font-extrabold">{rank}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Origin — WHERE this idea came from (always visible, replaces jargon badges) */}
          {originText && (
            <p className="text-[11px] text-muted-foreground leading-snug mb-1 flex items-center gap-1">
              <Search size={10} className="flex-shrink-0 opacity-60" />
              <span className="line-clamp-1">{originText}</span>
            </p>
          )}

          {/* The strategic move itself */}
          <p className="text-sm font-bold text-foreground leading-snug">
            {node.label}
          </p>

          {/* Reasoning preview — WHY this matters (always visible, not hidden) */}
          {node.reasoning && !isExpanded && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">
              {node.reasoning}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 mt-1">
          {isExpanded
            ? <ChevronUp size={14} className="text-muted-foreground" />
            : <ChevronDown size={14} className="text-muted-foreground" />
          }
        </div>
      </button>

      {/* Expanded: full reasoning chain */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>

              {/* Reasoning chain visualization */}
              <div className="mt-3 space-y-0">
                {/* Step 1: What we found (constraint/signal) */}
                {sourceConstraint && (
                  <ReasoningStep
                    step="We found"
                    content={sourceConstraint.label}
                    color="hsl(var(--destructive))"
                    isFirst
                  />
                )}

                {/* Step 2: The strategic move */}
                <ReasoningStep
                  step="This suggests"
                  content={node.label}
                  color="hsl(var(--primary))"
                  isFirst={!sourceConstraint}
                />

                {/* Step 3: Why it matters */}
                {node.reasoning && (
                  <ReasoningStep
                    step="Because"
                    content={node.reasoning}
                    color="hsl(var(--success))"
                  />
                )}
              </div>

              {/* Evidence basis */}
              {node.evidenceCount > 0 && (
                <p className="text-[10px] font-bold text-muted-foreground px-1">
                  Derived from {node.evidenceCount} evidence signal{node.evidenceCount !== 1 ? "s" : ""} in the analysis
                </p>
              )}

              {/* CTA */}
              {onSelect && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: "hsl(var(--primary) / 0.08)",
                    color: "hsl(var(--primary))",
                    border: "1px solid hsl(var(--primary) / 0.15)",
                  }}
                >
                  <TrendingUp size={10} />
                  Trace reasoning in map
                  <ArrowRight size={10} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Single step in the reasoning chain */
function ReasoningStep({ step, content, color, isFirst = false }: {
  step: string;
  content: string;
  color: string;
  isFirst?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      {/* Vertical connector line */}
      <div className="flex flex-col items-center flex-shrink-0 w-4">
        {!isFirst && (
          <ArrowDown size={10} className="text-muted-foreground opacity-40 mb-0.5" />
        )}
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: color }} />
      </div>

      <div
        className="rounded-lg p-2.5 flex-1 mb-1"
        style={{ background: `${color}08`, border: `1px solid ${color}18` }}
      >
        <span className="text-[10px] font-extrabold uppercase tracking-widest block mb-0.5" style={{ color }}>
          {step}
        </span>
        <p className="text-xs text-foreground leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

interface OpportunityLandscapeProps {
  graph: InsightGraph;
  onSelectNode?: (nodeId: string) => void;
  compact?: boolean;
}

export const OpportunityLandscape = memo(function OpportunityLandscape({
  graph, onSelectNode, compact = false,
}: OpportunityLandscapeProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const opportunities = useMemo(
    () => graph.nodes
      .filter(n => OPPORTUNITY_NODE_TYPES.includes(n.type))
      .sort((a, b) => {
        // Sort by impact desc, then evidence count desc, then influence desc
        if (b.impact !== a.impact) return b.impact - a.impact;
        if (b.evidenceCount !== a.evidenceCount) return b.evidenceCount - a.evidenceCount;
        return b.influence - a.influence;
      }),
    [graph.nodes],
  );

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl py-10 gap-2" style={{ background: "hsl(var(--muted))", border: "1.5px solid hsl(var(--border))" }}>
        <Zap size={20} className="text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">Strategic moves will appear here</p>
        <p className="text-xs text-muted-foreground">Run the analysis pipeline to identify opportunity spaces</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(var(--primary) / 0.1)" }}
        >
          <Lightbulb size={14} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">
            Strategic Moves
          </p>
          <p className="text-xs text-muted-foreground">
            {opportunities.length} idea{opportunities.length !== 1 ? "s" : ""} derived from structural analysis — expand any card to see the full reasoning chain
          </p>
        </div>
      </div>

      {/* Cards — always cards, narrative-driven */}
      <div className="space-y-2">
        {opportunities.map((opp, idx) => (
          <OpportunityCard
            key={opp.id}
            node={opp}
            rank={idx + 1}
            graph={graph}
            isExpanded={expandedId === opp.id}
            onToggle={() => setExpandedId(prev => prev === opp.id ? null : opp.id)}
            onSelect={onSelectNode}
          />
        ))}
      </div>
    </div>
  );
});
