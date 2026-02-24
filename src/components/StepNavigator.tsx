import React from "react";
import { CheckCircle2 } from "lucide-react";

export interface StepConfig {
  step: number;
  label: string;
  description: string;
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
  const totalSteps = steps.length + 1;
  return (
    <div className="sticky top-0 z-30 -mx-4 px-3 sm:px-4 py-2.5 sm:py-3 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto overflow-x-auto scrollbar-hide">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Step {activeStep} of {totalSteps}
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="rounded-full transition-all" style={{
                width: i + 1 === activeStep ? 18 : 6,
                height: 6,
                background: i + 1 <= activeStep ? "hsl(var(--primary))" : "hsl(var(--border))",
                borderRadius: 999,
              }} />
            ))}
          </div>
        </div>

        {/* Step cards */}
        <div className="flex items-stretch gap-1 sm:gap-1.5 min-w-max">
          {steps.map((s, i, arr) => {
            const isCurrent = activeStep === s.step;
            const isPast = visitedSteps.has(s.step) && !isCurrent;
            const isFuture = !isCurrent && !isPast;
            const Icon = s.icon;
            return (
              <React.Fragment key={s.step}>
                <button
                  onClick={() => onStepChange(s.step)}
                  className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl text-left transition-all flex-shrink-0 min-w-[100px] sm:min-w-0 sm:flex-1"
                  style={{
                    background: isCurrent ? "hsl(var(--foreground))" : isPast ? "hsl(var(--muted))" : "transparent",
                    color: isCurrent ? "hsl(var(--background))" : isPast ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                    border: isCurrent
                      ? "2px solid hsl(var(--foreground))"
                      : isPast
                        ? "1.5px solid hsl(var(--border))"
                        : "1.5px solid hsl(var(--border))",
                    boxShadow: isCurrent ? "0 4px 16px hsl(var(--foreground) / 0.2)" : "none",
                    opacity: isFuture ? 0.5 : 1,
                  }}
                >
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{
                    background: isCurrent ? "hsl(var(--background))" : isPast ? "hsl(var(--muted))" : "hsl(var(--muted))",
                  }}>
                    {isPast ? (
                      <CheckCircle2 size={14} style={{ color: "hsl(142 70% 40%)" }} />
                    ) : (
                      <Icon size={14} style={{ color: isCurrent ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-extrabold leading-tight truncate">{s.label}</p>
                    <p className="text-[9px] sm:text-[10px] leading-tight truncate hidden sm:block" style={{
                      color: isCurrent ? "hsl(var(--background) / 0.7)" : "hsl(var(--muted-foreground))",
                    }}>
                      {s.description}
                    </p>
                  </div>
                </button>
                {i < arr.length - 1 && (
                  <div className="flex-shrink-0 flex items-center mx-0.5">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-muted-foreground/50">
                      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
