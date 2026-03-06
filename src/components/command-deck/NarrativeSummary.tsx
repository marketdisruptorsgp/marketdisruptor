/**
 * Narrative Summary — Clean prose-first strategic summary
 *
 * Shows the narrative summary prominently, with the reasoning chain
 * available via progressive disclosure (collapsible).
 */

import { memo, useState } from "react";
import { Shield, TrendingUp, Crosshair, Lightbulb, Route, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NarrativeSummaryProps {
  primaryConstraint: string | null;
  keyDriver: string | null;
  leveragePoint: string | null;
  breakthroughOpportunity: string | null;
  strategicPathway: string | null;
  narrativeSummary: string;
}

const CHAIN = [
  { key: "primaryConstraint", label: "Constraint", icon: Shield, color: "hsl(0 72% 52%)" },
  { key: "keyDriver", label: "Driver", icon: TrendingUp, color: "hsl(262 83% 58%)" },
  { key: "leveragePoint", label: "Leverage", icon: Crosshair, color: "hsl(229 89% 63%)" },
  { key: "breakthroughOpportunity", label: "Opportunity", icon: Lightbulb, color: "hsl(152 60% 44%)" },
  { key: "strategicPathway", label: "Pathway", icon: Route, color: "hsl(45 93% 47%)" },
] as const;

export const NarrativeSummary = memo(function NarrativeSummary(props: NarrativeSummaryProps) {
  const { narrativeSummary } = props;
  const [expanded, setExpanded] = useState(false);
  const hasChain = CHAIN.some(c => props[c.key]);

  if (!narrativeSummary && !hasChain) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      {/* Prose summary — always visible */}
      <div className="px-5 py-4">
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
          Strategic Narrative
        </p>
        {narrativeSummary ? (
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {narrativeSummary}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Run more pipeline steps to generate a strategic narrative.
          </p>
        )}

        {/* Expand toggle */}
        {hasChain && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Hide reasoning chain" : "View reasoning chain"}
          </button>
        )}
      </div>

      {/* Collapsible reasoning chain */}
      <AnimatePresence>
        {expanded && hasChain && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-5 gap-2">
              {CHAIN.map(item => {
                const value = props[item.key];
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="rounded-lg p-3"
                    style={{
                      background: value ? `${item.color}08` : "hsl(var(--muted) / 0.3)",
                      border: `1px solid ${value ? `${item.color}20` : "hsl(var(--border))"}`,
                      opacity: value ? 1 : 0.4,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={11} style={{ color: value ? item.color : "hsl(var(--muted-foreground))" }} />
                      <span
                        className="text-[10px] font-extrabold uppercase tracking-widest"
                        style={{ color: value ? item.color : "hsl(var(--muted-foreground))" }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-snug line-clamp-3">
                      {value || "Pending"}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
