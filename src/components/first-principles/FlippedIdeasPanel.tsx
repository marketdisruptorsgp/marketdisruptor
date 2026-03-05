import { useState } from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import {
  StepCanvas, InsightCard, ExpandableDetail,
} from "@/components/analysis/AnalysisComponents";
import type { FlippedIdea } from "@/data/mockProducts";

interface FlippedIdeasPanelProps {
  flippedIdeas?: FlippedIdea[];
  onRegenerateIdeas?: (userContext?: string) => void;
  generatingIdeas?: boolean;
  userScores?: Record<string, Record<string, number>>;
  onScoreChange?: (ideaId: string, scoreKey: string, value: number) => void;
  onCompetitorsScouted?: (comps: unknown[]) => void;
}

export function FlippedIdeasPanel({ flippedIdeas, onRegenerateIdeas, generatingIdeas, userScores, onScoreChange, onCompetitorsScouted }: FlippedIdeasPanelProps) {
  const [userContext, setUserContext] = useState("");

  return (
    <StepCanvas>
      <ExpandableDetail label="Steer ideas — add your goals, then regenerate" icon={Lightbulb}>
        <textarea
          value={userContext}
          onChange={(e) => setUserContext(e.target.value)}
          placeholder="e.g. Focus on eco-friendly materials, target Gen Z, keep under $30…"
          className="w-full rounded px-3 py-2 text-sm leading-relaxed resize-none transition-colors focus:outline-none mb-2"
          rows={2}
          style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
        />
      </ExpandableDetail>

      {flippedIdeas && flippedIdeas.length > 0 ? (
        <>
          <InsightCard
            icon={Sparkles}
            headline={`${flippedIdeas.length} bold reinvention ideas generated`}
            subtext="Based on assumptions and flipped logic from Disrupt."
            accentColor="hsl(var(--primary))"
          />

          <div className="flex items-center justify-end">
            {onRegenerateIdeas && (
              <button
                onClick={() => onRegenerateIdeas(userContext || undefined)}
                disabled={generatingIdeas}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", opacity: generatingIdeas ? 0.6 : 1 }}
              >
                {generatingIdeas ? <span className="animate-spin">↻</span> : <Sparkles size={11} />}
                {generatingIdeas ? "Generating…" : "Regenerate Ideas"}
              </button>
            )}
          </div>

          <div className="space-y-5">
            {flippedIdeas.map((idea, i) => (
              <FlippedIdeaCard
                key={idea.name || i}
                idea={idea}
                rank={i + 1}
                userScores={userScores?.[idea.name || `idea-${i}`]}
                onScoreChange={onScoreChange ? (key, val) => onScoreChange(idea.name || `idea-${i}`, key, val) : undefined}
                onRegenerateSingle={onRegenerateIdeas ? () => onRegenerateIdeas(`REGENERATE_SINGLE:${i}:${userContext || ""}`) : undefined}
                onCompetitorsScouted={onCompetitorsScouted}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No flipped ideas yet. Run the Disrupt analysis first.
        </div>
      )}
    </StepCanvas>
  );
}
