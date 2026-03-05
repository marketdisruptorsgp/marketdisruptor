import { BookOpen } from "lucide-react";
import {
  VisualGrid, ExpandableDetail, EvidenceCard,
} from "@/components/analysis/AnalysisComponents";
import type { CounterExample } from "./types";

interface CounterExamplePanelProps {
  counterExamples: CounterExample[];
}

export function CounterExamplePanel({ counterExamples }: CounterExamplePanelProps) {
  if (!counterExamples?.length) return null;

  return (
    <ExpandableDetail label={`Real-World Precedents (${counterExamples.length})`} icon={BookOpen}>
      <VisualGrid columns={1}>
        {counterExamples.map((ex, i) => (
          <EvidenceCard
            key={i}
            statement={`${ex.name} (${ex.year}) — Lesson: ${ex.lesson}`}
            source={ex.similarity}
            confidence={ex.outcome === "succeeded" ? "high" : ex.outcome === "pivoted" ? "medium" : "low"}
            detail={ex.lesson}
          />
        ))}
      </VisualGrid>
    </ExpandableDetail>
  );
}
