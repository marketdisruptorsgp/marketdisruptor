import React from "react";
import { ChevronRight } from "lucide-react";

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
    <div className="sticky top-0 z-30 -mx-4 px-4 py-3" style={{ background: "hsl(var(--background) / 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid hsl(var(--border))" }}>
      <div className="max-w-6xl mx-auto flex items-center gap-0">
        {steps.map((s, i, arr) => {
          const SIcon = s.icon;
          const isCurrent = activeStep === s.step;
          const isPast = activeStep > s.step;
          return (
            <div key={s.step} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => onStepChange(s.step)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all w-full justify-center relative ${!isCurrent && !visitedSteps.has(s.step) ? "animate-pulse-subtle" : ""}`}
                style={{
                  background: isCurrent ? s.color : isPast ? `color-mix(in srgb, ${s.color} 12%, transparent)` : !visitedSteps.has(s.step) ? `color-mix(in srgb, ${s.color} 8%, hsl(var(--muted)))` : "hsl(var(--muted))",
                  color: isCurrent ? "white" : isPast ? s.color : !visitedSteps.has(s.step) ? s.color : "hsl(var(--muted-foreground))",
                  boxShadow: isCurrent ? `0 4px 16px -4px ${s.color}50` : !visitedSteps.has(s.step) ? `0 0 12px -2px ${s.color}30, 0 0 0 1px ${s.color}20` : "none",
                  border: isCurrent ? `2px solid ${s.color}` : isPast ? `2px solid ${s.color}30` : !visitedSteps.has(s.step) ? `2px solid ${s.color}40` : "2px solid hsl(var(--border))",
                }}
              >
                {!isCurrent && !visitedSteps.has(s.step) && (
                  <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white z-10" style={{ background: s.color, boxShadow: `0 2px 8px -2px ${s.color}60` }}>
                    Explore
                  </span>
                )}
                <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-extrabold flex-shrink-0" style={{ background: isCurrent ? "hsl(0 0% 100% / 0.25)" : isPast ? s.color : !visitedSteps.has(s.step) ? `color-mix(in srgb, ${s.color} 20%, transparent)` : "hsl(var(--border))", color: isCurrent || isPast ? "white" : !visitedSteps.has(s.step) ? s.color : "hsl(var(--muted-foreground))" }}>
                  {isPast ? "✓" : s.step}
                </span>
                <SIcon size={14} className="hidden sm:block flex-shrink-0" />
                <span className="hidden sm:inline truncate">{s.label}</span>
                <span className="sm:hidden text-[11px]">{s.step === 2 ? "Report" : s.step === 3 ? "Disrupt" : s.step === 4 ? "Stress" : "Pitch"}</span>
              </button>
              {i < arr.length - 1 && (
                <div className="flex-shrink-0 mx-1 flex items-center">
                  <div className="w-6 h-0.5 rounded-full" style={{ background: isPast ? s.color : "hsl(var(--border))" }} />
                  <ChevronRight size={16} className="flex-shrink-0 -ml-0.5" style={{ color: isPast ? s.color : "hsl(var(--muted-foreground))" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}