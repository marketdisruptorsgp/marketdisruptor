import { useState, useCallback, useEffect, useRef } from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import {
  StepCanvas, InsightCard, ExpandableDetail,
} from "@/components/analysis/AnalysisComponents";
import { useAnalysis } from "@/contexts/AnalysisContext";
import type { FlippedIdea } from "@/data/mockProducts";

interface FlippedIdeasPanelProps {
  flippedIdeas?: FlippedIdea[];
  onRegenerateIdeas?: (userContext?: string, rejectedIdeas?: string[]) => void;
  generatingIdeas?: boolean;
  userScores?: Record<string, Record<string, number>>;
  onScoreChange?: (ideaId: string, scoreKey: string, value: number) => void;
  onCompetitorsScouted?: (comps: unknown[]) => void;
  initialRejectedIdeas?: string[];
}

export function FlippedIdeasPanel({ flippedIdeas, onRegenerateIdeas, generatingIdeas, userScores, onScoreChange, onCompetitorsScouted, initialRejectedIdeas }: FlippedIdeasPanelProps) {
  const { saveStepData, saveSteeringText, steeringText } = useAnalysis();
  const [userContext, setUserContext] = useState(steeringText || "");

  // Propagate steering text to AnalysisContext on change (debounced on blur)
  const handleContextChange = useCallback((value: string) => {
    setUserContext(value);
  }, []);

  const handleContextBlur = useCallback(() => {
    if (userContext !== steeringText) {
      saveSteeringText(userContext);
    }
  }, [userContext, steeringText, saveSteeringText]);
  const [rejectedIdeas, setRejectedIdeas] = useState<string[]>(initialRejectedIdeas || []);

  // Re-sync when hydrated data changes (e.g. loading a saved analysis)
  const lastHydratedRef = useRef<string>("");
  useEffect(() => {
    const key = JSON.stringify(initialRejectedIdeas || []);
    if (key !== lastHydratedRef.current) {
      lastHydratedRef.current = key;
      setRejectedIdeas(initialRejectedIdeas || []);
    }
  }, [initialRejectedIdeas]);

  // Persist to DB whenever rejectedIdeas changes
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    saveStepData?.("rejectedIdeas", rejectedIdeas);
  }, [rejectedIdeas]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReject = useCallback((ideaName: string) => {
    setRejectedIdeas((prev) => prev.includes(ideaName) ? prev : [...prev, ideaName]);
  }, []);

  const handleRegenerate = useCallback((ctx?: string) => {
    onRegenerateIdeas?.(ctx, rejectedIdeas.length > 0 ? rejectedIdeas : undefined);
  }, [onRegenerateIdeas, rejectedIdeas]);

  // Filter out rejected ideas from display
  const visibleIdeas = flippedIdeas?.filter((idea) => !rejectedIdeas.includes(idea.name)) || [];
  const hasRejections = rejectedIdeas.length > 0;

  return (
    <StepCanvas>
      <ExpandableDetail label="Steer ideas — add your goals, then regenerate" icon={Lightbulb}>
        <textarea
          value={userContext}
          onChange={(e) => handleContextChange(e.target.value)}
          onBlur={handleContextBlur}
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
            headline={`${visibleIdeas.length} bold reinvention ideas generated`}
            subtext={hasRejections
              ? `${rejectedIdeas.length} dismissed — regenerate to explore new directions`
              : "Based on assumptions and flipped logic from Disrupt."
            }
            accentColor="hsl(var(--primary))"
          />

          {/* Rejected ideas summary */}
          {hasRejections && (
            <div
              className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg"
              style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
            >
              <span className="text-xs font-medium text-muted-foreground">Dismissed:</span>
              {rejectedIdeas.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                  style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}
                >
                  {name}
                  <button
                    onClick={() => setRejectedIdeas((prev) => prev.filter((n) => n !== name))}
                    className="hover:opacity-70 font-bold"
                    title="Restore this idea"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            {generatingIdeas && (
              <span className="text-xs text-muted-foreground animate-pulse">
                AI is generating new ideas…
              </span>
            )}
            {onRegenerateIdeas && (
              <button
                onClick={() => handleRegenerate(userContext || undefined)}
                disabled={generatingIdeas}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:cursor-not-allowed"
                style={{
                  background: generatingIdeas ? "hsl(var(--muted))" : "hsl(var(--primary))",
                  color: generatingIdeas ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                {generatingIdeas ? (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Sparkles size={12} />
                )}
                {generatingIdeas ? "Generating…" : hasRejections ? `Regenerate (avoiding ${rejectedIdeas.length} dismissed)` : "Regenerate Ideas"}
              </button>
            )}
          </div>

          <div className="space-y-5">
            {visibleIdeas.map((idea, i) => (
              <FlippedIdeaCard
                key={idea.name || i}
                idea={idea}
                rank={i + 1}
                userScores={userScores?.[idea.name || `idea-${i}`]}
                onScoreChange={onScoreChange ? (key, val) => onScoreChange(idea.name || `idea-${i}`, key, val) : undefined}
                onRegenerateSingle={onRegenerateIdeas ? () => handleRegenerate(`REGENERATE_SINGLE:${i}:${userContext || ""}`) : undefined}
                onCompetitorsScouted={onCompetitorsScouted}
                onReject={() => handleReject(idea.name)}
                steeringContext={userContext || undefined}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-sm text-muted-foreground">
          {hasRejections
            ? "All ideas dismissed. Hit regenerate to explore new directions."
            : "No flipped ideas yet. Run the Disrupt analysis first."}
        </div>
      )}
    </StepCanvas>
  );
}
