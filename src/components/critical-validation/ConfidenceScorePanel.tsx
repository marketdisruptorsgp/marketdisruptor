import { Brain, BarChart3 } from "lucide-react";
import {
  MetricCard, VisualGrid, ExpandableDetail,
} from "@/components/analysis/AnalysisComponents";
import type { ConfidenceScore } from "./types";
import { SCORE_LABELS } from "./types";

interface ConfidenceScorePanelProps {
  scores: Record<string, ConfidenceScore>;
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
          const barColor = val.score >= 7 ? "hsl(142 70% 45%)" : val.score >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";
          return (
            <MetricCard
              key={key}
              label={meta.label}
              value={`${val.score}/10`}
              accentColor={barColor}
              subtext={val.reasoning}
            />
          );
        })}
      </VisualGrid>
      {entries.length > 3 && (
        <ExpandableDetail label={`${entries.length - 3} more confidence scores`} icon={BarChart3}>
          <VisualGrid columns={2}>
            {entries.slice(3).map(([key, val]) => {
              const meta = SCORE_LABELS[key] || { label: key, icon: Brain };
              const barColor = val.score >= 7 ? "hsl(142 70% 45%)" : val.score >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";
              return (
                <MetricCard
                  key={key}
                  label={meta.label}
                  value={`${val.score}/10`}
                  accentColor={barColor}
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
