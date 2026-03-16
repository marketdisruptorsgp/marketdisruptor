/**
 * BreakthroughVectors — Zone 2: Breakthrough Vectors (What Could Be)
 *
 * 2x2 grid presenting paradigm breakthrough opportunities.
 * Leads with paradigm shifts, supported by optimization and flanking plays.
 * Executive briefing aesthetic — confident assertions, action-oriented.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Target, Lightbulb, TrendingUp, Unlock } from "lucide-react";
import { humanizeLabel } from "@/lib/humanize";

export interface BreakthroughVector {
  id: string;
  title: string;
  explanation: string;
  mechanism: string;
  category: "paradigm" | "optimization" | "flanking" | "unlock";
}

const CATEGORY_CONFIG: Record<
  BreakthroughVector["category"],
  { label: string; icon: React.ElementType; color: string }
> = {
  paradigm:     { label: "Paradigm Shift",   icon: Target,    color: "hsl(var(--primary))" },
  optimization: { label: "Optimization Play", icon: Lightbulb, color: "hsl(var(--success))" },
  flanking:     { label: "Flanking Move",     icon: TrendingUp, color: "hsl(var(--warning))" },
  unlock:       { label: "Value Unlock",      icon: Unlock,    color: "hsl(263 70% 60%)" },
};

interface BreakthroughVectorsProps {
  vectors: BreakthroughVector[];
  modeAccent: string;
}

function VectorCard({
  vector,
  index,
}: {
  vector: BreakthroughVector;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[vector.category];
  const Icon = config.icon;
  const hasMechanism = !!vector.mechanism;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.35 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <div className="px-4 py-3 space-y-2">
        {/* Header */}
        <div className="flex items-start gap-2.5">
          <span
            className="text-xs font-extrabold tabular-nums w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${config.color}18`, color: config.color }}
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground leading-snug">
              {vector.title}
            </p>
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full mt-1"
              style={{ background: `${config.color}15`, color: config.color }}
            >
              <Icon size={8} />
              {config.label}
            </span>
          </div>
        </div>

        {/* Explanation */}
        {vector.explanation && (
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            {vector.explanation}
          </p>
        )}

        {/* Mechanism — expandable */}
        {hasMechanism && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              How this works
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {expanded && (
              <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/50 pt-2">
                {vector.mechanism}
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

export function BreakthroughVectors({
  vectors,
  modeAccent,
}: BreakthroughVectorsProps) {
  if (vectors.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="space-y-2.5">
        {/* Zone label */}
        <div className="flex items-center gap-2 px-1">
          <Lightbulb size={13} style={{ color: modeAccent }} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Breakthrough Vectors
          </span>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {vectors.map((vec, i) => (
            <VectorCard key={vec.id} vector={vec} index={i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
