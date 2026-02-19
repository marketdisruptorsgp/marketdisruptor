import { TrendingUp, ExternalLink } from "lucide-react";
import type { FlippedIdea } from "@/data/mockProducts";
import { ScoreBar } from "./ScoreBar";

interface FlippedIdeaCardProps {
  idea: FlippedIdea;
  rank: number;
}

export const FlippedIdeaCard = ({ idea, rank }: FlippedIdeaCardProps) => {
  const avgScore =
    (idea.scores.feasibility +
      idea.scores.desirability +
      idea.scores.profitability +
      idea.scores.novelty) /
    4;

  return (
    <div
      className="card-intelligence p-5 space-y-4 relative overflow-hidden"
    >
      {/* Rank accent */}
      <div
        className="absolute -top-3 -right-3 w-16 h-16 rounded-full opacity-10"
        style={{ background: "hsl(var(--primary))" }}
      />

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="step-badge flex-shrink-0">#{rank}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-foreground text-base">{idea.name}</h4>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: avgScore >= 8 ? "hsl(var(--score-high) / 0.15)" : "hsl(var(--primary) / 0.12)",
                color: avgScore >= 8 ? "hsl(var(--score-high))" : "hsl(var(--primary))",
              }}
            >
              <TrendingUp size={10} />
              Avg {avgScore.toFixed(1)}/10
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{idea.description}</p>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <p className="section-label text-[10px]">Visual / Mockup Notes</p>
          <p className="text-foreground/80 text-xs leading-relaxed">{idea.visualNotes}</p>
        </div>
        <div className="space-y-1">
          <p className="section-label text-[10px]">Feasibility Notes</p>
          <p className="text-foreground/80 text-xs leading-relaxed">{idea.feasibilityNotes}</p>
        </div>
      </div>

      {/* Reasoning */}
      <div
        className="p-3 rounded-lg text-xs leading-relaxed"
        style={{
          background: "hsl(var(--primary-muted))",
          color: "hsl(var(--primary-dark))",
          borderLeft: "3px solid hsl(var(--primary))",
        }}
      >
        <span className="font-semibold">Reasoning: </span>
        {idea.reasoning}
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <ScoreBar label="Feasibility" score={idea.scores.feasibility} />
        <ScoreBar label="Desirability" score={idea.scores.desirability} />
        <ScoreBar label="Profitability" score={idea.scores.profitability} />
        <ScoreBar label="Novelty" score={idea.scores.novelty} />
      </div>

      {/* Risks */}
      <div
        className="flex items-start gap-2 p-3 rounded-lg text-xs"
        style={{
          background: "hsl(var(--destructive) / 0.06)",
          color: "hsl(var(--destructive))",
        }}
      >
        <span className="font-semibold flex-shrink-0">⚠ Risks:</span>
        <span>{idea.risks}</span>
      </div>
    </div>
  );
};
