import { Brain, BarChart3 } from "lucide-react";
import {
  MetricCard, VisualGrid, ExpandableDetail,
} from "@/components/analysis/AnalysisComponents";
import type { ConfidenceScore } from "./types";
import { SCORE_LABELS } from "./types";

interface ConfidenceScorePanelProps {
  scores: Record<string, ConfidenceScore>;
}

function qualLabel(score: number): { label: string; color: string } {
  if (score >= 7) return { label: "Strong", color: "hsl(142 70% 45%)" };
  if (score >= 5) return { label: "Moderate", color: "hsl(38 92% 50%)" };
  return { label: "Limited", color: "hsl(var(--destructive))" };
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
                />
              );
            })}
          </VisualGrid>
        </ExpandableDetail>
      )}
    </>
  );
}
