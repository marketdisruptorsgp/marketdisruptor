import { Clock, Brain, Sparkles, Swords, Presentation, Zap, CheckCircle2 } from "lucide-react";

interface TimelineEvent {
  key: string;
  label: string;
  icon: typeof Clock;
  color: string;
  completed: boolean;
  snippet?: string;
}

interface AnalysisTimelineProps {
  analysisData: Record<string, unknown> | null;
  createdAt: string;
  accentColor?: string;
}

function extractSnippet(data: Record<string, unknown> | null, key: string): string | undefined {
  if (!data) return undefined;
  const step = data[key] as Record<string, unknown> | undefined;
  if (!step) return undefined;

  if (key === "disrupt") {
    const ideas = (step as any)?.flippedIdeas || (step as any)?.ideas;
    if (Array.isArray(ideas) && ideas.length > 0) return ideas[0]?.name || ideas[0]?.title;
    const assumptions = (step as any)?.assumptions;
    if (Array.isArray(assumptions) && assumptions.length > 0) return assumptions[0]?.assumption;
  }
  if (key === "redesign") {
    const concept = (step as any)?.concept || (step as any)?.name;
    if (typeof concept === "string") return concept;
    // Also check inside disrupt.redesignedConcept
    const disrupt = data?.disrupt as any;
    const rc = disrupt?.redesignedConcept;
    if (rc?.conceptName) return rc.conceptName;
  }
  if (key === "stressTest") {
    const risks = (step as any)?.risks;
    if (Array.isArray(risks) && risks.length > 0) return `${risks.length} risks identified`;
  }
  if (key === "pitchDeck") {
    const pitch = (step as any)?.elevatorPitch;
    if (typeof pitch === "string") return pitch.slice(0, 80) + (pitch.length > 80 ? "…" : "");
  }
  if (key === "userScores") {
    const keys = Object.keys(step);
    if (keys.length > 0) return `${keys.length} score adjustments`;
  }
  return undefined;
}

export function AnalysisTimeline({ analysisData, createdAt, accentColor = "hsl(var(--primary))" }: AnalysisTimelineProps) {
  const events: TimelineEvent[] = [
    {
      key: "initial",
      label: "Initial Analysis",
      icon: Zap,
      color: accentColor,
      completed: true,
      snippet: new Date(createdAt).toLocaleDateString(),
    },
    {
      key: "disrupt",
      label: "Disrupt Completed",
      icon: Brain,
      color: "hsl(271 81% 55%)",
      completed: !!(analysisData?.disrupt || analysisData?.firstPrinciples),
      snippet: extractSnippet(analysisData, "disrupt"),
    },
    {
      key: "redesign",
      label: "Redesign Generated",
      icon: Sparkles,
      color: "hsl(38 92% 50%)",
      completed: !!(analysisData?.redesign || (analysisData?.disrupt as any)?.redesignedConcept || analysisData?.productVisuals),
      snippet: extractSnippet(analysisData, "redesign"),
    },
    {
      key: "userScores",
      label: "Scores Adjusted",
      icon: CheckCircle2,
      color: "hsl(142 70% 40%)",
      completed: !!(analysisData?.userScores && Object.keys(analysisData.userScores as object).length > 0) || !!(analysisData?.disrupt as any)?.userScores,
      snippet: extractSnippet(analysisData, "userScores"),
    },
    {
      key: "stressTest",
      label: "Stress Test Complete",
      icon: Swords,
      color: "hsl(350 80% 55%)",
      completed: !!(analysisData?.stressTest || analysisData?.criticalValidation),
      snippet: extractSnippet(analysisData, "stressTest"),
    },
    {
      key: "pitchDeck",
      label: "Pitch Generated",
      icon: Presentation,
      color: "hsl(var(--primary))",
      completed: !!(analysisData?.pitchDeck || analysisData?.pitch),
      snippet: extractSnippet(analysisData, "pitchDeck"),
    },
  ];

  return (
    <div className="space-y-1">
      {events.map((event, i) => {
        const Icon = event.icon;
        const isLast = i === events.length - 1;
        return (
          <div key={event.key} className="flex gap-3">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  background: event.completed ? event.color : "hsl(var(--muted))",
                  border: event.completed ? "none" : "2px solid hsl(var(--border))",
                }}
              >
                <Icon size={12} style={{ color: event.completed ? "white" : "hsl(var(--muted-foreground))" }} />
              </div>
              {!isLast && (
                <div
                  className="w-0.5 flex-1 min-h-[16px]"
                  style={{ background: event.completed ? `${event.color}40` : "hsl(var(--border))" }}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-3 min-w-0">
              <p
                className="text-xs font-bold leading-tight"
                style={{ color: event.completed ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
              >
                {event.label}
              </p>
              {event.snippet && (
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{event.snippet}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
