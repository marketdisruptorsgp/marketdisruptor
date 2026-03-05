import { useState, useEffect, useRef, useMemo } from "react";
import { Sparkles, Brain, Zap } from "lucide-react";

export interface StepTask {
  label: string;
  detail: string;
}

interface StepLoadingTrackerProps {
  title: string;
  tasks: StepTask[];
  estimatedSeconds?: number;
  accentColor?: string;
}

const ACTIVITY_MESSAGES: string[] = [
  "Initializing analysis engine…",
  "Parsing collected data points…",
  "Cross-referencing market signals…",
  "Building structured analysis…",
  "Synthesizing insights…",
  "Scoring and ranking findings…",
  "Generating final output…",
];

const DEEP_WORK_MESSAGES: { text: string; icon: "sparkles" | "brain" | "zap" }[] = [
  { text: "Deep structural reasoning in progress — this is where the real insights emerge.", icon: "brain" },
  { text: "Cross-referencing patterns across multiple strategic dimensions…", icon: "sparkles" },
  { text: "Almost there. Compiling your intelligence briefing.", icon: "zap" },
  { text: "Running final quality checks on every insight and recommendation.", icon: "brain" },
  { text: "Connecting the last dots between constraints and opportunities…", icon: "sparkles" },
  { text: "Your analysis is being scored, ranked, and structured for maximum clarity.", icon: "zap" },
];

const ICON_MAP = {
  sparkles: Sparkles,
  brain: Brain,
  zap: Zap,
};

export function StepLoadingTracker({
  title,
  tasks,
  estimatedSeconds = 40,
  accentColor,
}: StepLoadingTrackerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [activityLog, setActivityLog] = useState<{ text: string; ts: number }[]>([]);
  const [deepWorkIdx, setDeepWorkIdx] = useState(0);
  const messageIdx = useRef(0);
  const accent = accentColor || "hsl(var(--primary))";

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Add activity messages at intervals
  useEffect(() => {
    const msgs = ACTIVITY_MESSAGES;
    const interval = setInterval(() => {
      if (messageIdx.current < msgs.length) {
        setActivityLog((prev) => [
          ...prev,
          { text: msgs[messageIdx.current], ts: Date.now() },
        ]);
        messageIdx.current++;
      }
    }, Math.max(3000, (estimatedSeconds / msgs.length) * 1000));
    if (messageIdx.current === 0) {
      setActivityLog([{ text: msgs[0], ts: Date.now() }]);
      messageIdx.current = 1;
    }
    return () => clearInterval(interval);
  }, [estimatedSeconds]);

  // Rotate deep work messages every 8 seconds once in deep work phase
  const isDeepWork = elapsed >= estimatedSeconds * 0.85;
  useEffect(() => {
    if (!isDeepWork) return;
    const interval = setInterval(() => {
      setDeepWorkIdx((i) => (i + 1) % DEEP_WORK_MESSAGES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isDeepWork]);

  // Progress: smooth curve that slows down near the end
  const progressPct = useMemo(() => {
    const ratio = elapsed / estimatedSeconds;
    if (ratio <= 0.85) return Math.round(ratio * 90);
    // Asymptotic approach to 99 — never actually hits 100
    const overshoot = (ratio - 0.85) / 0.85;
    return Math.min(99, Math.round(90 + 9 * (1 - Math.exp(-overshoot * 2))));
  }, [elapsed, estimatedSeconds]);

  const remaining = Math.max(0, estimatedSeconds - elapsed);
  const remainingLabel = isDeepWork
    ? "Finishing…"
    : remaining > 60
    ? `~${Math.ceil(remaining / 60)}m ${remaining % 60}s`
    : `~${remaining}s`;

  const currentDeepMsg = DEEP_WORK_MESSAGES[deepWorkIdx];
  const DeepIcon = ICON_MAP[currentDeepMsg.icon];

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-5 border-b border-border" style={{ background: "hsl(var(--card))" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground text-sm">{title}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-foreground">{progressPct}%</p>
            <p className="typo-card-meta text-foreground/60">{remainingLabel}</p>
          </div>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-muted">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progressPct}%`, background: accent }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="typo-card-meta text-foreground/60">{elapsed}s elapsed</span>
          <span className="typo-card-meta text-foreground/60">
            Est. {Math.round(estimatedSeconds * 0.7)}–{Math.round(estimatedSeconds * 1.5)}s
          </span>
        </div>
      </div>

      {/* Deep Work Phase — replaces tasks/activity when near completion */}
      {isDeepWork ? (
        <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-4" style={{ background: "hsl(var(--card))" }}>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse"
            style={{ background: "hsl(var(--primary) / 0.12)" }}
          >
            <DeepIcon size={22} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="space-y-2 max-w-md">
            <p className="text-sm font-bold text-foreground leading-relaxed transition-opacity duration-500">
              {currentDeepMsg.text}
            </p>
            <p className="text-xs text-muted-foreground">
              Complex analyses require deeper reasoning — the best insights take a moment longer.
            </p>
          </div>
          {/* Subtle pulse dots */}
          <div className="flex items-center gap-1.5 mt-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "hsl(var(--primary))",
                  opacity: 0.3 + ((deepWorkIdx + i) % 3) * 0.3,
                  transition: "opacity 0.5s ease",
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Standard Tasks/Activity two columns */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-b border-border">
          <div className="p-4 sm:p-5 space-y-2 sm:space-y-2.5 border-b sm:border-b-0 sm:border-r border-border" style={{ background: "hsl(var(--card))" }}>
            <p className="typo-status-label font-semibold uppercase tracking-wider text-foreground/60 mb-2">
              Tasks
            </p>
            {tasks.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                  <p className="typo-card-meta text-foreground/60 truncate">{item.detail}</p>
                </div>
                <div
                  className="w-2.5 h-2.5 rounded-full border border-t-transparent animate-spin flex-shrink-0"
                  style={{ borderColor: `hsl(var(--muted-foreground) / 0.3)`, borderTopColor: "transparent" }}
                />
              </div>
            ))}
          </div>

          <div className="p-4 sm:p-5" style={{ background: "hsl(var(--card))" }}>
            <p className="typo-status-label font-semibold uppercase tracking-wider text-foreground/60 mb-2">
              Activity
            </p>
            <div className="space-y-1 font-mono max-h-36 sm:max-h-48 overflow-y-auto">
              {activityLog.length === 0 ? (
                <p className="text-xs text-muted-foreground">Initializing…</p>
              ) : (
                [...activityLog].reverse().map((entry, i) => (
                  <div
                    key={entry.ts}
                    className={`flex items-start gap-1.5 ${i === 0 ? "opacity-100" : "opacity-40"}`}
                  >
                    <span className="typo-card-meta text-foreground/40 flex-shrink-0 mt-0.5">
                      {Math.floor((Date.now() - entry.ts) / 1000) < 2
                        ? "now"
                        : `${Math.floor((Date.now() - entry.ts) / 1000)}s`}
                    </span>
                    <span className="typo-card-meta text-foreground leading-relaxed">{entry.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between" style={{ background: "hsl(var(--muted))" }}>
        <p className="text-xs text-muted-foreground">Auto-saves when complete</p>
      </div>
    </div>
  );
}

// ── Step-specific task configs ──

export const DISRUPT_TASKS: StepTask[] = [
  { label: "Assumption Mining", detail: "Hidden assumptions & biases" },
  { label: "Leverage Scoring", detail: "Ranking disruption potential" },
  { label: "Constraint Mapping", detail: "Structural dependencies" },
];

export const REDESIGN_TASKS: StepTask[] = [
  { label: "Logic Inversion", detail: "Flipping core paradigms" },
  { label: "Idea Generation", detail: "Radical reinvention concepts" },
  { label: "Concept Synthesis", detail: "Redesigned concept vision" },
];

export const STRESS_TEST_TASKS: StepTask[] = [
  { label: "Red Team Analysis", detail: "Critical attack vectors" },
  { label: "Green Team Defense", detail: "Counter-arguments & proof" },
  { label: "Precedent Research", detail: "Historical comparisons" },
  { label: "Feasibility Check", detail: "Technical & cost viability" },
  { label: "Confidence Scoring", detail: "Overall viability score" },
];

export const PITCH_DECK_TASKS: StepTask[] = [
  { label: "Market Sizing", detail: "TAM, SAM, SOM analysis" },
  { label: "Financial Model", detail: "Unit economics & projections" },
  { label: "Supplier Intel", detail: "Contacts & lead times" },
  { label: "GTM Strategy", detail: "Launch plan & channels" },
  { label: "Risk Assessment", detail: "Threats & mitigations" },
  { label: "Investor Brief", detail: "Elevator pitch & highlights" },
];
