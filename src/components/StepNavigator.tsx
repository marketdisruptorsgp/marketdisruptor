import React from "react";
import { CheckCircle2, AlertCircle, Focus, Building2, Star } from "lucide-react";
import { scrollToTop } from "@/utils/scrollToTop";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { getLensType } from "@/lib/etaLens";

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
  outdatedSteps?: Set<string>;
  accentColor?: string;
}

// Map step numbers to step keys for outdated tracking
const STEP_KEY_MAP: Record<number, string> = {
  3: "disrupt",
  4: "redesign",
  5: "stressTest",
  6: "pitch",
};

function LensBadge() {
  const analysis = useAnalysis();
  const lensType = getLensType(analysis.activeLens);
  const lensName = lensType === "eta" ? "ETA Acquisition" : lensType === "custom" ? (analysis.activeLens?.name || "Custom") : "Default";
  const LensIcon = lensType === "eta" ? Building2 : lensType === "custom" ? Star : Focus;
  const badgeColor = lensType === "eta" ? "hsl(142 70% 40%)" : lensType === "custom" ? "hsl(38 92% 50%)" : "hsl(var(--primary))";

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide flex-shrink-0"
      style={{ background: `${badgeColor}15`, color: badgeColor, border: `1.5px solid ${badgeColor}30` }}
    >
      <LensIcon size={10} />
      {lensName} Lens
    </span>
  );
}

export function StepNavigator({ steps, activeStep, visitedSteps, onStepChange, outdatedSteps, accentColor }: StepNavigatorProps) {
  const totalSteps = steps.length + 1;
  const accent = accentColor || "hsl(var(--primary))";
  return (
    <div className="sticky top-0 z-20 -mx-4 px-3 sm:px-4 py-3 sm:py-3.5 bg-background/98 backdrop-blur-md border-b" style={{ borderColor: "hsl(var(--border))" }}>
      <div className="max-w-5xl mx-auto overflow-x-auto scrollbar-hide relative">
        {/* Right fade hint for scrollability */}
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background/95 to-transparent pointer-events-none z-10 sm:hidden" />
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background/95 to-transparent pointer-events-none z-10 sm:hidden" />
        {/* Progress bar + Lens badge */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <p className="typo-status-label text-muted-foreground">
              Step {activeStep} of {totalSteps}
            </p>
            <LensBadge />
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="rounded-full transition-all" style={{
                width: i + 1 === activeStep ? 18 : 6,
                height: 6,
                background: i + 1 <= activeStep ? accent : "hsl(var(--border))",
                borderRadius: 999,
              }} />
            ))}
          </div>
        </div>

        {/* Step cards */}
        <div className="flex items-stretch gap-1.5 sm:gap-2 min-w-max snap-x snap-mandatory">
          {steps.map((s, i, arr) => {
            const isCurrent = activeStep === s.step;
            const isPast = visitedSteps.has(s.step) && !isCurrent;
            const isFuture = !isCurrent && !isPast;
            const Icon = s.icon;
            const stepKey = STEP_KEY_MAP[s.step];
            const isOutdated = stepKey && outdatedSteps?.has(stepKey);
            return (
              <React.Fragment key={s.step}>
                <button
                  onClick={() => { onStepChange(s.step); scrollToTop(); }}
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3 rounded-xl text-left transition-all flex-shrink-0 min-w-[120px] min-h-[48px] sm:min-w-0 sm:flex-1 relative snap-center"
                  style={{
                    background: isCurrent ? accent : isPast ? "hsl(var(--muted))" : "transparent",
                    color: isCurrent ? "white" : isPast ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                    border: isCurrent
                      ? `2px solid ${accent}`
                      : isPast
                        ? "1.5px solid hsl(var(--border))"
                        : "1.5px solid hsl(var(--border))",
                    boxShadow: isCurrent ? `0 4px 16px ${accent}33` : "none",
                    opacity: isFuture ? 0.5 : 1,
                  }}
                >
                  {/* Outdated indicator */}
                  {isOutdated && (
                    <div className="absolute -top-1.5 -right-1.5 z-10">
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full typo-meta"
                        style={{ background: "hsl(38 92% 50%)", color: "white", fontSize: "0.75rem" }}>
                        <AlertCircle size={10} />
                        <span className="hidden sm:inline">Outdated</span>
                      </div>
                    </div>
                  )}
                  <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center" style={{
                    background: isCurrent ? "hsla(0 0% 100% / 0.2)" : isPast ? "hsl(var(--muted))" : "hsl(var(--muted))",
                  }}>
                    {isPast ? (
                      <CheckCircle2 size={15} style={{ color: isOutdated ? "hsl(38 92% 50%)" : "hsl(142 70% 40%)" }} />
                    ) : (
                      <Icon size={15} style={{ color: isCurrent ? "white" : "hsl(var(--muted-foreground))" }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={isCurrent ? "typo-step-title-active" : "typo-step-title-inactive"}>
                      {s.label}
                    </p>
                    <p className="typo-step-subtitle hidden sm:block truncate" style={{
                      color: isCurrent ? "hsla(0 0% 100% / 0.7)" : undefined,
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
