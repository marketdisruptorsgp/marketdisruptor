/**
 * PIPELINE TIMER STRIP — Live elapsed timer per step during pipeline execution.
 * Shows exact seconds for each stage so users see how fast the engine works.
 */

import { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import type { PipelineProgress } from "@/hooks/usePipelineOrchestrator";

interface PipelineTimerStripProps {
  pipelineProgress: PipelineProgress;
}

function formatElapsed(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function PipelineTimerStrip({ pipelineProgress }: PipelineTimerStripProps) {
  const [now, setNow] = useState(Date.now());

  // Tick every second for live elapsed updates
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalElapsed = pipelineProgress.pipelineStartedAt
    ? now - pipelineProgress.pipelineStartedAt
    : 0;

  const coreSteps = pipelineProgress.steps.filter(
    s => s.key !== "stressTest" && s.key !== "pitch"
  );

  return (
    <div
      className="rounded-xl px-5 py-4 space-y-3"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--primary) / 0.3)" }}
    >
      {/* Header with total elapsed */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">
            Building Your Analysis
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Timer size={12} className="text-muted-foreground" />
          <span className="text-xs font-bold tabular-nums text-foreground">
            {formatElapsed(totalElapsed)}
          </span>
        </div>
      </div>

      {/* Step bars with individual timings */}
      <div className="flex gap-2">
        {coreSteps.map(s => {
          const timing = pipelineProgress.stepTimings[s.key];
          const stepElapsed = timing
            ? timing.elapsedMs
              ? timing.elapsedMs
              : now - timing.startedAt
            : null;

          return (
            <div key={s.key} className="flex-1">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  background: s.status === "done" ? "hsl(142 76% 36%)"
                    : s.status === "running" ? "hsl(var(--primary))"
                    : "hsl(var(--muted))",
                }}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
                {stepElapsed !== null && (
                  <span
                    className="text-[9px] font-bold tabular-nums"
                    style={{
                      color: s.status === "done" ? "hsl(142 76% 36%)"
                        : s.status === "running" ? "hsl(var(--primary))"
                        : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {formatElapsed(stepElapsed)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
