import React from "react";
import { CheckCircle2, AlertCircle, Focus, Building2, Star, ChevronRight } from "lucide-react";
import { scrollToTop } from "@/utils/scrollToTop";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { getLensType } from "@/lib/etaLens";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const completedCount = Array.from({ length: totalSteps }, (_, i) => i + 1).filter(s => visitedSteps.has(s) || s <= activeStep).length;
  const completionPct = Math.round((completedCount / totalSteps) * 100);

  // Find current step config
  const currentStep = steps.find(s => s.step === activeStep);
  const CurrentIcon = currentStep?.icon;

  return (
    <div
      className="-mx-4 px-3 sm:px-4 py-2"
      style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Compact progress bar layout */}
        <div className="flex items-center gap-3">
          {/* Lens badge (desktop only) */}
          {!isMobile && <LensBadge />}

          {/* Step pills — horizontal, compact, clickable */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
            {/* Right fade for mobile */}
            {isMobile && (
              <>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background/95 to-transparent pointer-events-none z-10" />
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background/95 to-transparent pointer-events-none z-10" />
              </>
            )}
            {steps.map((s, i) => {
              const isCurrent = activeStep === s.step;
              const isPast = visitedSteps.has(s.step) && !isCurrent;
              const Icon = s.icon;
              const stepKey = STEP_KEY_MAP[s.step];
              const isOutdated = stepKey && outdatedSteps?.has(stepKey);

              return (
                <React.Fragment key={s.step}>
                  <button
                    onClick={() => { onStepChange(s.step); scrollToTop(); }}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all flex-shrink-0 min-h-[32px] relative"
                    style={{
                      background: isCurrent ? `${accent}15` : "transparent",
                      color: isCurrent ? accent : isPast ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                      border: isCurrent ? `1.5px solid ${accent}40` : "1.5px solid transparent",
                      opacity: !isCurrent && !isPast ? 0.5 : 1,
                    }}
                    title={s.description}
                  >
                    {isOutdated && (
                      <div className="absolute -top-1 -right-1">
                        <AlertCircle size={10} style={{ color: "hsl(38 92% 50%)" }} />
                      </div>
                    )}
                    {isPast ? (
                      <CheckCircle2 size={13} style={{ color: isOutdated ? "hsl(38 92% 50%)" : "hsl(142 70% 40%)" }} />
                    ) : (
                      <Icon size={13} />
                    )}
                    <span className={isMobile ? "hidden sm:inline" : ""}>{s.label}</span>
                    {isMobile && !isCurrent && <span className="sm:hidden">{s.label.slice(0, 3)}</span>}
                    {isMobile && isCurrent && <span className="sm:hidden">{s.label}</span>}
                  </button>
                  {i < steps.length - 1 && (
                    <ChevronRight size={10} className="text-muted-foreground/40 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Completion indicator */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-16 sm:w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%`, background: completionPct === 100 ? "hsl(142 70% 45%)" : accent }}
              />
            </div>
            <span className="text-xs font-bold tabular-nums text-muted-foreground">{completionPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
