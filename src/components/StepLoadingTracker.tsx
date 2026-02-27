import { useState, useEffect, useRef } from "react";

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

const ACTIVITY_MESSAGES: Record<string, string[]> = {
  default: [
    "Initializing analysis engine…",
    "Parsing collected data points…",
    "Cross-referencing market signals…",
    "Building structured analysis…",
    "Synthesizing insights…",
    "Scoring and ranking findings…",
    "Generating final output…",
  ],
};

export function StepLoadingTracker({
  title,
  tasks,
  estimatedSeconds = 40,
  accentColor,
}: StepLoadingTrackerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [activityLog, setActivityLog] = useState<{ text: string; ts: number }[]>([]);
  const messageIdx = useRef(0);
  const accent = accentColor || "hsl(var(--primary))";

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Add activity messages at intervals
  useEffect(() => {
    const msgs = ACTIVITY_MESSAGES.default;
    const interval = setInterval(() => {
      if (messageIdx.current < msgs.length) {
        setActivityLog((prev) => [
          ...prev,
          { text: msgs[messageIdx.current], ts: Date.now() },
        ]);
        messageIdx.current++;
      }
    }, Math.max(3000, (estimatedSeconds / msgs.length) * 1000));
    // Add first message immediately
    if (messageIdx.current === 0) {
      setActivityLog([{ text: msgs[0], ts: Date.now() }]);
      messageIdx.current = 1;
    }
    return () => clearInterval(interval);
  }, [estimatedSeconds]);

  const progressPct = Math.min(95, Math.round((elapsed / estimatedSeconds) * 100));
  const remaining = Math.max(0, estimatedSeconds - elapsed);
  const remainingLabel =
    remaining > 60
      ? `~${Math.ceil(remaining / 60)}m ${remaining % 60}s`
      : remaining > 0
      ? `~${remaining}s`
      : "Finishing…";

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
            <p className="text-[10px] text-muted-foreground">{remainingLabel}</p>
          </div>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-muted">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progressPct}%`, background: accent }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">{elapsed}s elapsed</span>
          <span className="text-[10px] text-muted-foreground">
            Est. {Math.round(estimatedSeconds * 0.7)}–{Math.round(estimatedSeconds * 1.5)}s
          </span>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-b border-border">
        <div className="p-4 sm:p-5 space-y-2 sm:space-y-2.5 border-b sm:border-b-0 sm:border-r border-border" style={{ background: "hsl(var(--card))" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Tasks
          </p>
          {tasks.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.detail}</p>
              </div>
              <div
                className="w-2.5 h-2.5 rounded-full border border-t-transparent animate-spin flex-shrink-0"
                style={{ borderColor: `hsl(var(--muted-foreground) / 0.3)`, borderTopColor: "transparent" }}
              />
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-5" style={{ background: "hsl(var(--card))" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
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
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                    {Math.floor((Date.now() - entry.ts) / 1000) < 2
                      ? "now"
                      : `${Math.floor((Date.now() - entry.ts) / 1000)}s`}
                  </span>
                  <span className="text-[11px] text-foreground leading-relaxed">{entry.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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
  { label: "Logic Inversion", detail: "Flipping core paradigms" },
  { label: "Idea Generation", detail: "Radical reinvention concepts" },
  { label: "Disrupt Concept", detail: "Core disruption vision" },
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
