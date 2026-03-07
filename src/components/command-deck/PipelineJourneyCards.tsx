/**
 * Pipeline Journey Cards — The analytical story arc
 * 
 * Shows each pipeline step as a narrative chapter with:
 * - What it does (story framing)
 * - What it found (key finding if completed)
 * - Clear CTA to dive in
 * 
 * This is the core product experience — the thinking methodology.
 */

import { useNavigate } from "react-router-dom";
import {
  Search, Atom, Lightbulb, ShieldCheck, Presentation,
  ChevronRight, CheckCircle2, Circle,
} from "lucide-react";

interface StepFinding {
  headline: string;
  detail?: string;
}

interface PipelineJourneyCardsProps {
  baseUrl: string;
  completedSteps: Set<string>;
  modeAccent: string;
  /** Key findings per step — extracted from analysis data */
  findings: {
    report?: StepFinding | null;
    disrupt?: StepFinding | null;
    redesign?: StepFinding | null;
    stressTest?: StepFinding | null;
    pitch?: StepFinding | null;
  };
  isBusinessMode?: boolean;
}

const JOURNEY_STEPS = [
  {
    key: "report",
    route: "report",
    icon: Search,
    chapter: "1",
    title: "Understand What Exists",
    narrative: "Supply chain, pricing, patents, user journey, community sentiment — everything about the current landscape.",
    emptyState: "Run this step to map the current market reality.",
  },
  {
    key: "disrupt",
    route: "disrupt",
    icon: Atom,
    chapter: "2",
    title: "Deconstruct to First Principles",
    narrative: "Strip away convention. Decompose every assumption to its root — tradition, cost, physics, or habit.",
    emptyState: "Run this step to challenge underlying assumptions.",
  },
  {
    key: "redesign",
    route: "redesign",
    icon: Lightbulb,
    chapter: "3",
    title: "Flip It & Reimagine",
    narrative: "Invert assumptions, generate novel ideas, and design a reimagined concept from scratch.",
    emptyState: "Run this step to generate new product concepts.",
  },
  {
    key: "stressTest",
    route: "stress-test",
    icon: ShieldCheck,
    chapter: "4",
    title: "Stress Test the Ideas",
    narrative: "Red team attacks. Green team defends. Pressure-test every idea against real-world constraints.",
    emptyState: "Run this step to validate ideas under adversarial pressure.",
  },
  {
    key: "pitch",
    route: "pitch",
    icon: Presentation,
    chapter: "5",
    title: "Build the Pitch",
    narrative: "Package the strongest insights into an investor-ready pitch deck.",
    emptyState: "Run this step to generate your pitch deck.",
  },
];

const BUSINESS_JOURNEY_STEPS = JOURNEY_STEPS.filter(s => s.key !== "redesign").map((s, i) => ({
  ...s,
  chapter: String(i + 1),
}));

export function PipelineJourneyCards({
  baseUrl, completedSteps, modeAccent, findings, isBusinessMode,
}: PipelineJourneyCardsProps) {
  const navigate = useNavigate();
  const steps = isBusinessMode ? BUSINESS_JOURNEY_STEPS : JOURNEY_STEPS;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.15em] text-muted-foreground">
          Analysis Journey
        </h2>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid gap-2">
        {steps.map((step) => {
          const done = completedSteps.has(step.key);
          const finding = findings[step.key as keyof typeof findings];
          const Icon = step.icon;

          return (
            <button
              key={step.key}
              onClick={() => navigate(`${baseUrl}/${step.route}`)}
              className="group w-full text-left rounded-xl px-4 py-3.5 transition-all hover:scale-[1.005] active:scale-[0.998]"
              style={{
                background: "hsl(var(--card))",
                border: done
                  ? `1.5px solid ${modeAccent}30`
                  : "1px solid hsl(var(--border))",
              }}
            >
              <div className="flex items-start gap-3">
                {/* Chapter number + status */}
                <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                    style={{
                      background: done ? `${modeAccent}15` : "hsl(var(--muted))",
                      color: done ? modeAccent : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {step.chapter}
                  </div>
                  {done ? (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  ) : (
                    <Circle size={12} className="text-muted-foreground/30" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon size={14} style={{ color: done ? modeAccent : "hsl(var(--muted-foreground))" }} />
                    <span className="text-sm font-bold text-foreground">{step.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {step.narrative}
                  </p>

                  {/* Finding or empty state */}
                  {done && finding ? (
                    <div
                      className="mt-2 px-3 py-2 rounded-lg text-xs font-medium"
                      style={{
                        background: `${modeAccent}08`,
                        border: `1px solid ${modeAccent}15`,
                        color: "hsl(var(--foreground))",
                      }}
                    >
                      <span className="font-bold" style={{ color: modeAccent }}>Key finding: </span>
                      {finding.headline}
                    </div>
                  ) : !done ? (
                    <p className="mt-1.5 text-[11px] text-muted-foreground/60 italic">
                      {step.emptyState}
                    </p>
                  ) : null}
                </div>

                {/* Arrow */}
                <ChevronRight
                  size={16}
                  className="text-muted-foreground/40 group-hover:text-foreground transition-colors flex-shrink-0 mt-1"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
