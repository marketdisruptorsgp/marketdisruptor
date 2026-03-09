/**
 * PIPELINE PROCESSING STATE — Replaces all "No Data Yet" empty states
 * 
 * Shows animated processing indicators when pipeline steps are running,
 * making the system feel alive and intelligent rather than static/empty.
 */

import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, Zap, Search, Layers, Target } from "lucide-react";

interface PipelineProcessingStateProps {
  stepKey: "disrupt" | "redesign" | "stressTest" | "pitch" | "intel" | "generic";
  /** Optional custom title override */
  title?: string;
}

const STEP_CONFIG: Record<string, {
  title: string;
  icon: typeof Brain;
  messages: string[];
  accentColor: string;
}> = {
  disrupt: {
    title: "Deconstructing structural mechanics",
    icon: Layers,
    messages: [
      "Identifying hidden assumptions and biases…",
      "Mapping structural constraints and dependencies…",
      "Building causal models of the system…",
      "Extracting strategic hypotheses…",
      "Cross-referencing constraint patterns…",
    ],
    accentColor: "hsl(var(--primary))",
  },
  redesign: {
    title: "Reimagining the solution architecture",
    icon: Sparkles,
    messages: [
      "Inverting core assumptions to find new angles…",
      "Generating alternative structural configurations…",
      "Evaluating radical design possibilities…",
      "Synthesizing a redesigned concept…",
      "Mapping innovation opportunities…",
    ],
    accentColor: "hsl(38 92% 50%)",
  },
  stressTest: {
    title: "Pressure testing strategic ideas",
    icon: Target,
    messages: [
      "Identifying potential failure modes…",
      "Testing against real-world constraints…",
      "Evaluating competitive responses…",
      "Assessing implementation feasibility…",
      "Building risk mitigation strategies…",
    ],
    accentColor: "hsl(350 80% 55%)",
  },
  pitch: {
    title: "Synthesizing opportunity narrative",
    icon: Zap,
    messages: [
      "Distilling the strongest strategic thesis…",
      "Crafting the opportunity narrative…",
      "Building the investment case…",
      "Mapping action plans and next steps…",
      "Finalizing strategic recommendations…",
    ],
    accentColor: "hsl(200 80% 42%)",
  },
  intel: {
    title: "Gathering market intelligence",
    icon: Search,
    messages: [
      "Scanning market signals and trends…",
      "Analyzing competitive landscape…",
      "Processing industry data points…",
      "Building intelligence briefing…",
    ],
    accentColor: "hsl(var(--primary))",
  },
  generic: {
    title: "Analyzing your data",
    icon: Brain,
    messages: [
      "Processing analysis inputs…",
      "Building structured intelligence…",
      "Synthesizing insights…",
      "Preparing your briefing…",
    ],
    accentColor: "hsl(var(--primary))",
  },
};

export const PipelineProcessingState = memo(function PipelineProcessingState({
  stepKey,
  title,
}: PipelineProcessingStateProps) {
  const config = STEP_CONFIG[stepKey] || STEP_CONFIG.generic;
  const Icon = config.icon;
  const [messageIdx, setMessageIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx(prev => (prev + 1) % config.messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [config.messages.length]);

  return (
    <div className="rounded-xl border border-border bg-card p-8 sm:p-12">
      <div className="flex flex-col items-center text-center space-y-5 max-w-md mx-auto">
        {/* Animated icon */}
        <motion.div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: `${config.accentColor}15` }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <Icon size={26} style={{ color: config.accentColor }} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <h3 className="text-lg font-bold text-foreground">
          {title || config.title}
        </h3>

        {/* Rotating message */}
        <div className="h-6 relative w-full">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-muted-foreground absolute inset-0"
            >
              {config.messages[messageIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Pulse bar */}
        <div className="w-full max-w-[200px] h-1 rounded-full overflow-hidden bg-muted">
          <motion.div
            className="h-full rounded-full"
            style={{ background: config.accentColor }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
});
