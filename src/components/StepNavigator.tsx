import React from "react";

export interface StepConfig {
  step: number;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface StepNavigatorProps {
  steps: StepConfig[];
  activeStep: number;
  visitedSteps: Set<number>;
  onStepChange: (step: number) => void;
}

export function StepNavigator({ steps, activeStep, visitedSteps, onStepChange }: StepNavigatorProps) {
  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto flex items-center gap-1">
        {steps.map((s, i, arr) => {
          const isCurrent = activeStep === s.step;
          const isPast = activeStep > s.step;
          const isUnvisited = !isCurrent && !visitedSteps.has(s.step);
          return (
            <div key={s.step} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => onStepChange(s.step)}
                className="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium transition-colors w-full justify-center"
                style={{
                  background: isCurrent ? "hsl(var(--primary))" : "transparent",
                  color: isCurrent ? "hsl(var(--primary-foreground))" : isPast ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  border: isCurrent ? "1px solid hsl(var(--primary))" : "1px solid transparent",
                  boxShadow: isCurrent ? "0 2px 8px hsl(var(--primary) / 0.3)" : "none",
                }}
              >
                {isUnvisited && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-primary" />
                )}
                <span className="text-xs font-semibold flex-shrink-0">
                  {isPast ? s.step : s.step}
                </span>
                <span className="hidden sm:inline truncate text-sm">{s.label}</span>
                <span className="sm:hidden text-[11px]">{s.step === 2 ? "Report" : s.step === 3 ? "Disrupt" : s.step === 4 ? "Test" : "Pitch"}</span>
              </button>
              {i < arr.length - 1 && (
                <div className="flex-shrink-0 mx-1">
                  <div className="w-6 h-px bg-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}