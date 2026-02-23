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
    <div className="sticky top-0 z-30 -mx-4 px-3 sm:px-4 py-2 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto flex items-center gap-0.5 sm:gap-1">
        {steps.map((s, i, arr) => {
          const isCurrent = activeStep === s.step;
          const isPast = activeStep > s.step;
          const isUnvisited = !isCurrent && !visitedSteps.has(s.step);
          const Icon = s.icon;
          return (
            <div key={s.step} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => onStepChange(s.step)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all w-full justify-center"
                style={{
                  background: isCurrent ? "hsl(var(--primary))" : isPast ? "hsl(var(--primary) / 0.08)" : "transparent",
                  color: isCurrent ? "hsl(var(--primary-foreground))" : isPast ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  border: isCurrent ? "1px solid hsl(var(--primary))" : isPast ? "1px solid hsl(var(--primary) / 0.2)" : "1px solid transparent",
                  boxShadow: isCurrent ? "0 2px 8px hsl(var(--primary) / 0.3)" : "none",
                  fontWeight: isCurrent || isPast ? 700 : 500,
                }}
              >
                {isUnvisited && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-primary" />
                )}
                <Icon size={14} className="flex-shrink-0" style={{ color: isCurrent ? "hsl(var(--primary-foreground))" : isPast ? "hsl(var(--primary))" : undefined }} />
                <span className="text-[10px] sm:text-xs font-bold flex-shrink-0 hidden sm:inline">
                  {s.step}
                </span>
                <span className="hidden sm:inline truncate text-sm">{s.label}</span>
                <span className="sm:hidden text-[10px] leading-tight truncate">
                  {s.step === 2 ? "Report" : s.step === 3 ? "Disrupt" : s.step === 4 ? "Test" : "Pitch"}
                </span>
              </button>
              {i < arr.length - 1 && (
                <div className="flex-shrink-0 mx-1 sm:mx-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground">
                    <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
