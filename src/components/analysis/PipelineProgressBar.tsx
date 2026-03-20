/**
 * PIPELINE PROGRESS BAR
 *
 * Lightweight bottom-of-step progress indicator.
 * Shows pipeline progression with step markers, timing badges, and dynamic status text.
 */

import { CheckCircle2, Circle, AlertCircle, Loader2, Timer } from "lucide-react";
import type { StepTiming } from "@/hooks/usePipelineOrchestrator";

interface PipelineProgressBarProps {
  completedSteps: Set<string>;
  outdatedSteps?: Set<string>;
  currentStep: string;
  accentColor: string;
  stepTimings?: Record<string, StepTiming>;
}

const CORE_PIPELINE = [
  { key: "report", label: "Report", short: "Rep", activeText: "Building intelligence report…", lazy: false },
  { key: "disrupt", label: "Disrupt", short: "Dis", activeText: "Generating disruption strategies…", lazy: false },
  { key: "redesign", label: "Redesign", short: "Red", activeText: "Synthesizing redesign concepts…", lazy: false },
  { key: "stress-test", label: "Stress Test", short: "Str", activeText: "Stress-testing assumptions…", lazy: true },
  { key: "pitch", label: "Pitch", short: "Pit", activeText: "Assembling investor pitch…", lazy: true },
];

const CORE_STEPS = CORE_PIPELINE.filter(s => !s.lazy);

function formatSec(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${s % 60}s`;
}

export function PipelineProgressBar({
  completedSteps, outdatedSteps, currentStep, accentColor, stepTimings,
}: PipelineProgressBarProps) {
  // Core completion: only count non-lazy steps for the progress percentage
  const coreCompleted = CORE_STEPS.filter(s => completedSteps.has(s.key)).length;
  const lazyCompleted = CORE_PIPELINE.filter(s => s.lazy && completedSteps.has(s.key)).length;
  const totalCompleted = coreCompleted + lazyCompleted;
  const coreDone = coreCompleted === CORE_STEPS.length;
  const pct = coreDone
    ? (lazyCompleted > 0 ? Math.round(((CORE_STEPS.length + lazyCompleted) / CORE_PIPELINE.length) * 100) : 100)
    : Math.round((coreCompleted / CORE_STEPS.length) * 100);
  const allDone = totalCompleted === CORE_PIPELINE.length;

  // Find first incomplete core step for dynamic status text
  const activeStep = CORE_STEPS.find(s => !completedSteps.has(s.key));
  const statusText = coreDone
    ? (allDone ? "Pipeline complete" : "Core analysis complete — on-demand steps available")
    : activeStep?.activeText || "Processing…";

  // Total time from all completed step timings
  const totalMs = stepTimings
    ? Object.values(stepTimings).reduce((sum, t) => sum + (t.elapsedMs || 0), 0)
    : 0;

  return (
    <div className="rounded-xl p-4 bg-card border border-border">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Pipeline Progress
        </p>
        <div className="flex items-center gap-2">
          {totalMs > 0 && (coreDone || allDone) && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
              <Timer size={10} />
              {formatSec(totalMs)}
            </span>
          )}
          <span className="text-xs font-bold tabular-nums" style={{ color: accentColor }}>
            {coreCompleted}/{CORE_STEPS.length}
            {lazyCompleted > 0 && ` +${lazyCompleted}`}
          </span>
        </div>
      </div>

      {/* Dynamic status text */}
      <div className="flex items-center gap-1.5 mb-3">
        {!coreDone && <Loader2 size={10} className="animate-spin text-muted-foreground" />}
        {coreDone && !allDone && <CheckCircle2 size={10} className="text-green-500" />}
        <span className="text-[10px] text-muted-foreground font-medium">{statusText}</span>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "hsl(var(--border))" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: (coreDone || pct === 100) ? "hsl(142 70% 45%)" : accentColor }}
        />
      </div>

      {/* Step markers */}
      <div className="flex items-center justify-between">
        {CORE_PIPELINE.map((step) => {
          const isDone = completedSteps.has(step.key);
          const isOutdated = outdatedSteps?.has(step.key);
          const isCurrent = currentStep === step.key;
          const isLazy = step.lazy;
          const color = isCurrent ? accentColor
            : isOutdated ? "hsl(38 92% 50%)"
            : isDone ? "hsl(142 70% 45%)"
            : isLazy ? "hsl(var(--muted-foreground))"
            : "hsl(var(--muted-foreground))";

          // Map step keys to orchestrator step keys for timing lookup
          const timingKey = step.key === "report" ? "decompose"
            : step.key === "disrupt" ? "synthesis"
            : step.key === "redesign" ? "concepts"
            : step.key === "stress-test" ? "stressTest"
            : step.key === "pitch" ? "pitch" : null;
          const timing = timingKey && stepTimings ? stepTimings[timingKey] : null;

          return (
            <div key={step.key} className="flex flex-col items-center gap-1">
              {isOutdated ? (
                <AlertCircle size={14} style={{ color }} />
              ) : isDone ? (
                <CheckCircle2 size={14} style={{ color }} />
              ) : (
                <Circle size={14} style={{ color, opacity: isCurrent ? 1 : isLazy ? 0.25 : 0.4 }} />
              )}
              <span className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color, opacity: isCurrent ? 1 : isDone ? 0.8 : 0.4 }}>
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.short}</span>
              </span>
              {timing?.elapsedMs && isDone && (
                <span className="text-[8px] font-bold tabular-nums" style={{ color: "hsl(142 70% 45%)" }}>
                  {formatSec(timing.elapsedMs)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
