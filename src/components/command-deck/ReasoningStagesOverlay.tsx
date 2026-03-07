/**
 * Reasoning Stages Overlay — Shows progressive reasoning stages
 * during strategic engine computation to build user trust.
 */

import { memo, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, Layers, Target, Lightbulb, Route, Check } from "lucide-react";

const REASONING_STAGES = [
  { key: "evidence", label: "Normalizing evidence…", icon: Search, durationMs: 200 },
  { key: "signals", label: "Detecting patterns across signals…", icon: Layers, durationMs: 300 },
  { key: "constraints", label: "Identifying structural constraints…", icon: Target, durationMs: 250 },
  { key: "drivers", label: "Mapping key drivers…", icon: Brain, durationMs: 200 },
  { key: "leverage", label: "Calculating leverage points…", icon: Lightbulb, durationMs: 250 },
  { key: "opportunities", label: "Generating strategic opportunities…", icon: Route, durationMs: 300 },
] as const;

interface ReasoningStagesOverlayProps {
  isComputing: boolean;
}

export const ReasoningStagesOverlay = memo(function ReasoningStagesOverlay({
  isComputing,
}: ReasoningStagesOverlayProps) {
  const [activeStage, setActiveStage] = useState(-1);
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasComputingRef = useRef(false);

  useEffect(() => {
    if (isComputing && !wasComputingRef.current) {
      // Started computing — animate through stages
      wasComputingRef.current = true;
      setActiveStage(0);
      setCompletedStages(new Set());

      let idx = 0;
      const advance = () => {
        if (idx < REASONING_STAGES.length - 1) {
          setCompletedStages(prev => new Set([...prev, idx]));
          idx++;
          setActiveStage(idx);
          timerRef.current = setTimeout(advance, REASONING_STAGES[idx].durationMs);
        }
      };
      timerRef.current = setTimeout(advance, REASONING_STAGES[0].durationMs);
    }

    if (!isComputing && wasComputingRef.current) {
      // Finished computing — mark all done
      wasComputingRef.current = false;
      setCompletedStages(new Set(REASONING_STAGES.map((_, i) => i)));
      setActiveStage(-1);
      if (timerRef.current) clearTimeout(timerRef.current);

      // Clear after a short display
      const clearTimer = setTimeout(() => {
        setCompletedStages(new Set());
      }, 1200);
      return () => clearTimeout(clearTimer);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isComputing]);

  const isVisible = isComputing || completedStages.size > 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: "hsl(var(--card))",
            border: "1.5px solid hsl(var(--primary) / 0.2)",
          }}
        >
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2.5">
              <Brain size={13} className="text-primary" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Strategic Reasoning
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
              {REASONING_STAGES.map((stage, i) => {
                const isActive = activeStage === i;
                const isDone = completedStages.has(i);
                const StageIcon = stage.icon;

                return (
                  <motion.div
                    key={stage.key}
                    initial={{ opacity: 0.4 }}
                    animate={{
                      opacity: isActive || isDone ? 1 : 0.35,
                    }}
                    className="flex items-center gap-1.5"
                  >
                    {isDone ? (
                      <Check size={11} className="text-primary flex-shrink-0" />
                    ) : isActive ? (
                      <StageIcon size={11} className="text-primary animate-pulse flex-shrink-0" />
                    ) : (
                      <StageIcon size={11} className="text-muted-foreground flex-shrink-0" />
                    )}
                    <span
                      className={`text-[11px] font-semibold truncate ${
                        isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {isDone ? stage.label.replace("…", "") : stage.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
