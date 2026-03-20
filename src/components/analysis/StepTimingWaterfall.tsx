/**
 * StepTimingWaterfall — Shows how long each pipeline step took after completion.
 * Collapsed by default, expandable via "How this was built" toggle.
 */

import { useState } from "react";
import { ChevronDown, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { StepTiming } from "@/hooks/usePipelineOrchestrator";

interface StepTimingWaterfallProps {
  stepTimings: Record<string, StepTiming>;
  pipelineStartedAt: number | null;
}

const STEP_NAMES: Record<string, string> = {
  decompose: "Decompose",
  synthesis: "Synthesis",
  concepts: "Concepts",
  stressTest: "Stress Test",
  pitch: "Pitch Deck",
};

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function StepTimingWaterfall({ stepTimings, pipelineStartedAt }: StepTimingWaterfallProps) {
  const [expanded, setExpanded] = useState(false);

  const completedSteps = Object.entries(stepTimings)
    .filter(([, t]) => t.elapsedMs && t.elapsedMs > 0)
    .sort((a, b) => (a[1].startedAt || 0) - (b[1].startedAt || 0));

  if (completedSteps.length === 0) return null;

  const totalMs = completedSteps.reduce((sum, [, t]) => sum + (t.elapsedMs || 0), 0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          <Timer size={12} className="text-muted-foreground" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            How this was built
          </span>
          <span className="text-xs font-bold tabular-nums text-foreground/70">
            {formatDuration(totalMs)} total
          </span>
        </div>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} className="text-muted-foreground" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1.5 border-t border-border pt-3">
              {completedSteps.map(([key, timing]) => {
                const label = STEP_NAMES[key] || key;
                const elapsed = timing.elapsedMs || 0;
                const pct = Math.round((elapsed / totalMs) * 100);

                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground w-20 text-right shrink-0">
                      {label}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-border">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "hsl(var(--primary))" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-foreground/70 w-10 shrink-0">
                      {formatDuration(elapsed)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
