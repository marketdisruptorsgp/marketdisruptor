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
  const totalSteps = steps.length + 1; // +1 for step 1 (dashboard)
  return (
    <div className="sticky top-0 z-30 -mx-4 px-3 sm:px-4 py-2 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold text-muted-foreground">
            Step {activeStep} of {totalSteps}
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="rounded-full transition-all" style={{
                width: i + 1 === activeStep ? 14 : 5,
                height: 5,
                background: i + 1 <= activeStep ? "hsl(var(--primary))" : "hsl(var(--border))",
                borderRadius: 999,
              }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {steps.map((s, i, arr) => {
            const isCurrent = activeStep === s.step;
            const isPast = activeStep > s.step;
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
                  <Icon size={14} className="flex-shrink-0" style={{ color: isCurrent ? "hsl(var(--primary-foreground))" : isPast ? "hsl(var(--primary))" : undefined }} />
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
    </div>
  );
}
