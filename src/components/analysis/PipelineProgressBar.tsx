/**
 * PIPELINE PROGRESS BAR
 *
 * Lightweight bottom-of-step progress indicator replacing the heavy StepNavigator.
 * Shows pipeline progression as a visual bar with step markers.
 */

import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface PipelineProgressBarProps {
  completedSteps: Set<string>;
  outdatedSteps?: Set<string>;
  currentStep: string;
  accentColor: string;
}

const PIPELINE = [
  { key: "report", label: "Report", short: "Rep" },
  { key: "disrupt", label: "Disrupt", short: "Dis" },
  { key: "redesign", label: "Redesign", short: "Red" },
  { key: "stress-test", label: "Stress Test", short: "Str" },
  { key: "pitch", label: "Pitch", short: "Pit" },
];

export function PipelineProgressBar({
  completedSteps, outdatedSteps, currentStep, accentColor,
}: PipelineProgressBarProps) {
  const totalCompleted = completedSteps.size;
  const pct = Math.round((totalCompleted / PIPELINE.length) * 100);

  return (
    <div className="rounded-xl p-4 bg-card border border-border">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Pipeline Progress
        </p>
        <span className="text-xs font-bold tabular-nums" style={{ color: accentColor }}>
          {totalCompleted}/{PIPELINE.length}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "hsl(var(--border))" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: pct === 100 ? "hsl(142 70% 45%)" : accentColor }}
        />
      </div>

      {/* Step markers */}
      <div className="flex items-center justify-between">
        {PIPELINE.map((step, i) => {
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
