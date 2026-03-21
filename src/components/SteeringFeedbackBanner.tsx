import React, { memo } from "react";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SteeringFeedbackBannerProps {
  steeringText: string;
  /** Which pipeline steps have completed since steering was set */
  completedSteps?: Set<string>;
  /** Optional accent color */
  accentColor?: string;
}

/** Maps internal step keys to human-readable labels */
const STEP_LABELS: Record<string, string> = {
  decompose: "Structural Decomposition",
  decomposition: "Structural Decomposition",
  synthesis: "Strategic Synthesis",
  strategicEngine: "Strategic Engine",
  concepts: "Concept Architecture",
  disrupt: "Disruption Analysis",
  stressTest: "Stress Test",
  pitchDeck: "Pitch Deck",
  redesign: "Redesign Engine",
  businessAnalysis: "Intelligence Report",
  businessStressTest: "Strategy Validation",
  businessPitchDeck: "Pitch Deck",
};

/**
 * Shows feedback confirming that the user's steering guidance
 * is actively influencing pipeline outputs.
 */
export const SteeringFeedbackBanner = memo(function SteeringFeedbackBanner({
  steeringText,
  completedSteps,
  accentColor,
}: SteeringFeedbackBannerProps) {
  if (!steeringText?.trim()) return null;

  // Truncate long steering text for display
  const displayText = steeringText.length > 80
    ? steeringText.substring(0, 77) + "…"
    : steeringText;

  // Determine which steps have been influenced
  const influencedSteps = completedSteps
    ? Array.from(completedSteps)
        .map(s => STEP_LABELS[s])
        .filter(Boolean)
        .slice(0, 4) // Show max 4
    : [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-lg border border-primary/20 bg-primary/[0.04] px-4 py-3"
      >
        <div className="flex items-start gap-2.5">
          <Sparkles
            size={14}
            className="mt-0.5 flex-shrink-0"
            style={accentColor ? { color: accentColor } : undefined}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              Your guidance is active
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 italic truncate">
              "{displayText}"
            </p>
            {influencedSteps.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-muted-foreground font-medium">Applied to:</span>
                {influencedSteps.map((step) => (
                  <span
                    key={step}
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                  >
                    <CheckCircle2 size={8} />
                    {step}
                  </span>
                ))}
                {completedSteps && completedSteps.size > 4 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{completedSteps.size - 4} more
                  </span>
                )}
              </div>
            )}
            {influencedSteps.length === 0 && (
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowRight size={8} /> Will be applied to all future analysis steps
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
