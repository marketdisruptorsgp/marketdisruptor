/**
 * PIPELINE PROGRESS BAR
 *
 * Lightweight bottom-of-step progress indicator replacing the heavy StepNavigator.
 * Shows pipeline progression as a visual bar with step markers and dynamic status text.
 */

import { CheckCircle2, Circle, AlertCircle, Loader2 } from "lucide-react";

interface PipelineProgressBarProps {
  completedSteps: Set<string>;
  outdatedSteps?: Set<string>;
  currentStep: string;
  accentColor: string;
}

const PIPELINE = [
  { key: "report", label: "Report", short: "Rep", activeText: "Building intelligence report…" },
  { key: "disrupt", label: "Disrupt", short: "Dis", activeText: "Generating disruption strategies…" },
  { key: "redesign", label: "Redesign", short: "Red", activeText: "Synthesizing redesign concepts…" },
  { key: "stress-test", label: "Stress Test", short: "Str", activeText: "Stress-testing assumptions…" },
  { key: "pitch", label: "Pitch", short: "Pit", activeText: "Assembling investor pitch…" },
];

export function PipelineProgressBar({
  completedSteps, outdatedSteps, currentStep, accentColor,
}: PipelineProgressBarProps) {
  const totalCompleted = completedSteps.size;
  const pct = Math.round((totalCompleted / PIPELINE.length) * 100);
  const allDone = totalCompleted === PIPELINE.length;

  // Find first incomplete step for dynamic status text
  const activeStep = PIPELINE.find(s => !completedSteps.has(s.key));
  const statusText = allDone
    ? "Pipeline complete"
    : activeStep?.activeText || "Processing…";

  return (
    <div className="rounded-xl p-4 bg-card border border-border">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Pipeline Progress
        </p>
        <span className="text-xs font-bold tabular-nums" style={{ color: accentColor }}>
          {totalCompleted}/{PIPELINE.length}
        </span>
      </div>

      {/* Dynamic status text */}
      <div className="flex items-center gap-1.5 mb-3">
        {!allDone && <Loader2 size={10} className="animate-spin text-muted-foreground" />}
        <span className="text-[10px] text-muted-foreground font-medium">{statusText}</span>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "hsl(var(--border))" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: pct === 100 ? "hsl(142 70% 45%)" : accentColor }}
        />
      </div>

      {/* Step markers */}
      <div className="flex items-center justify-between">
        {PIPELINE.map((step) => {
          const isDone = completedSteps.has(step.key);
          const isOutdated = outdatedSteps?.has(step.key);
          const isCurrent = currentStep === step.key;
          const color = isCurrent ? accentColor
            : isOutdated ? "hsl(38 92% 50%)"
            : isDone ? "hsl(142 70% 45%)"
            : "hsl(var(--muted-foreground))";

          return (
            <div key={step.key} className="flex flex-col items-center gap-1">
              {isOutdated ? (
                <AlertCircle size={14} style={{ color }} />
              ) : isDone ? (
                <CheckCircle2 size={14} style={{ color }} />
              ) : (
                <Circle size={14} style={{ color, opacity: isCurrent ? 1 : 0.4 }} />
              )}
              <span className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color, opacity: isCurrent ? 1 : isDone ? 0.8 : 0.4 }}>
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.short}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
