import { Brain, BarChart3 } from "lucide-react";
import {
  MetricCard, VisualGrid, ExpandableDetail,
} from "@/components/analysis/AnalysisComponents";
import type { ConfidenceScore } from "./types";
import { SCORE_LABELS } from "./types";

interface ConfidenceScorePanelProps {
  scores: Record<string, ConfidenceScore>;
}

function qualLabel(score: number): { label: string; color: string; tooltip: string } {
  if (score >= 7) return { label: "Strong", color: "hsl(142 70% 45%)", tooltip: `${score}/10 — Well-supported by evidence. High confidence this holds up under scrutiny.` };
  if (score >= 5) return { label: "Moderate", color: "hsl(38 92% 50%)", tooltip: `${score}/10 — Some supporting evidence, but gaps remain. Worth validating before committing.` };
  return { label: "Limited", color: "hsl(var(--destructive))", tooltip: `${score}/10 — Weak evidence base. Treat as a hypothesis to test, not a conclusion.` };
}

export function ConfidenceScorePanel({ scores }: ConfidenceScorePanelProps) {
  if (!scores) return null;
  const entries = Object.entries(scores);
  if (!entries.length) return null;

  return (
    <>
      <VisualGrid columns={2}>
        {entries.slice(0, 3).map(([key, val]) => {
          const meta = SCORE_LABELS[key] || { label: key, icon: Brain };
          const qual = qualLabel(val.score);
          return (
            <MetricCard
              key={key}
              label={meta.label}
              value={qual.label}
              accentColor={qual.color}
              subtext={val.reasoning}
              tooltip={qual.tooltip}
            />
          );
        })}
      </VisualGrid>
      {entries.length > 3 && (
        <ExpandableDetail label={`${entries.length - 3} more confidence areas`} icon={BarChart3}>
          <VisualGrid columns={2}>
            {entries.slice(3).map(([key, val]) => {
              const meta = SCORE_LABELS[key] || { label: key, icon: Brain };
              const qual = qualLabel(val.score);
              return (
                <MetricCard
                  key={key}
                  label={meta.label}
                  value={qual.label}
                  accentColor={qual.color}
                  subtext={val.reasoning}
                  tooltip={qual.tooltip}
                />
              );
            })}
          </VisualGrid>
        </ExpandableDetail>
      )}
    </>
  );
}
