import { useState } from "react";
import { Brain, Flame } from "lucide-react";
import { PitchDeckToggle } from "@/components/PitchDeckToggle";
import { AnalysisVisualLayer } from "@/components/AnalysisVisualLayer";
import { StructuralDiagnosisPanel } from "@/components/StructuralDiagnosisPanel";
import {
  StepCanvas, InsightCard, SignalCard, MetricCard, VisualGrid, ExpandableDetail,
} from "@/components/analysis/AnalysisComponents";
import { InsightRating } from "@/components/InsightRating";
import type { HiddenAssumption, FirstPrinciplesData } from "./types";
import { REASON_COLORS, REASON_BORDER } from "./types";

/* ── Assumption Card List ── */
function AssumptionCardList({ assumptions, showLimit }: { assumptions: HiddenAssumption[]; showLimit: number }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? assumptions : assumptions.slice(0, showLimit);

  return (
    <>
      <VisualGrid columns={1}>
        {visible.map((a, i) => {
          const reasonStyle = REASON_COLORS[a.reason] || REASON_COLORS.habit;
          const leverageColor = a.leverageScore != null
            ? a.leverageScore >= 8 ? "hsl(var(--destructive))" : a.leverageScore >= 5 ? "hsl(38 92% 42%)" : "hsl(142 70% 35%)"
            : "hsl(var(--muted-foreground))";

          return (
            <InsightCard
              key={i}
              headline={a.assumption}
              subtext={a.currentAnswer}
              accentColor={REASON_BORDER[a.reason] || "hsl(var(--border))"}
              badge={reasonStyle.label}
              badgeColor={reasonStyle.text}
              action={
                <div className="flex items-center gap-2">
                  {a.urgencySignal === "eroding" && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "hsl(0 70% 50% / 0.1)", color: "hsl(0 70% 50%)" }}>↓ Eroding</span>
                  )}
                  {a.urgencySignal === "emerging" && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "hsl(142 70% 40% / 0.1)", color: "hsl(142 70% 35%)" }}>↑ Emerging</span>
                  )}
                  {a.leverageScore != null && (
                    <span className="text-xs font-bold tabular-nums" style={{ color: leverageColor }}>{a.leverageScore}/10</span>
                  )}
                  {a.isChallengeable && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "hsl(var(--primary))" }} title="Challengeable" />
                  )}
                  <PitchDeckToggle contentKey={`assumptions-${i}`} label="Pitch" />
                </div>
              }
              detail={
                <div className="space-y-3">
                  {a.urgencySignal && a.urgencyReason && (
                    <SignalCard
                      label={a.urgencySignal === "eroding" ? "Eroding Now" : a.urgencySignal === "emerging" ? "Emerging Opportunity" : "Stable"}
                      type={a.urgencySignal === "eroding" ? "threat" : a.urgencySignal === "emerging" ? "opportunity" : "neutral"}
                      explanation={a.urgencyReason}
                    />
                  )}
                  {a.leverageScore != null && (
                    <MetricCard label="Leverage Score" value={`${a.leverageScore}/10`} accentColor={leverageColor} />
                  )}
                  {a.impactScenario && (
                    <InsightCard headline="If challenged successfully" subtext={a.impactScenario} accentColor="hsl(142 70% 40%)" />
                  )}
                  {a.competitiveBlindSpot && (
                    <InsightCard headline="Who's vulnerable" subtext={a.competitiveBlindSpot} accentColor="hsl(38 92% 35%)" />
                  )}
                  {a.challengeIdea && (
                    <InsightCard headline="How to challenge this" subtext={a.challengeIdea} accentColor="hsl(var(--primary))" />
                  )}
                </div>
              }
            />
          );
        })}
      </VisualGrid>
      {assumptions.length > showLimit && (
        <button onClick={() => setShowAll(!showAll)} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))", border: "1.5px solid hsl(var(--primary) / 0.2)" }}>
          {showAll ? "Show fewer" : `Show ${assumptions.length - showLimit} more assumptions`}
        </button>
      )}
    </>
  );
}

interface HiddenAssumptionsPanelProps {
  data: FirstPrinciplesData;
  governedData: Record<string, unknown> | null;
  onRerun: () => void;
  loading: boolean;
  rerunSuggestions: string;
  onRerunSuggestionsChange: (v: string) => void;
}

export function HiddenAssumptionsPanel({ data, governedData, onRerun, loading, rerunSuggestions, onRerunSuggestionsChange }: HiddenAssumptionsPanelProps) {
  const assumptions = data.hiddenAssumptions || [];
  const challengeableCount = assumptions.filter(a => a.isChallengeable).length;
  const avgLeverage = assumptions.length > 0
    ? (assumptions.reduce((s, a) => s + (a.leverageScore || 0), 0) / assumptions.length).toFixed(1)
    : "0";
  const SHOW_LIMIT = 10;

  return (
    <div className="space-y-4" data-fp-steps>
      {/* Header + re-run */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-foreground uppercase tracking-widest">Hidden Assumptions & Leverage Analysis</p>
        <button onClick={onRerun} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
          {loading ? <span className="animate-spin">↻</span> : "↻"} Re-run
        </button>
      </div>

      {/* Steer AI */}
      <ExpandableDetail label="Refine your analysis — add direction, then Re-run" icon={Brain}>
        <textarea
          value={rerunSuggestions}
          onChange={(e) => onRerunSuggestionsChange(e.target.value)}
          placeholder="e.g. Focus on sustainability, explore modular design, target commercial users…"
          className="w-full rounded px-3 py-2.5 text-sm leading-relaxed resize-none transition-colors focus:outline-none mb-2"
          rows={2}
          style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
        />
      </ExpandableDetail>

      {/* Structural Diagnosis */}
      <StructuralDiagnosisPanel constraintMap={governedData?.constraint_map as any} />

      {assumptions.length === 0 ? (
        <StepCanvas>
          <div className="text-center py-10 space-y-3">
            <Brain size={32} className="mx-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
            <p className="text-sm font-bold text-foreground">No assumption data available</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">Click <strong>Re-run</strong> above to regenerate.</p>
          </div>
        </StepCanvas>
      ) : (
        <StepCanvas>
          <AnalysisVisualLayer analysis={data as unknown as Record<string, unknown>} step="firstPrinciples" governedOverride={governedData}>
            {/* Highest-Leverage Move Banner */}
            {(() => {
              const topMove = assumptions
                .filter(a => a.isChallengeable && (a.leverageScore || 0) >= 7)
                .sort((a, b) => (b.leverageScore || 0) - (a.leverageScore || 0))[0];
              if (!topMove) return null;
              const erodingCount = assumptions.filter(a => a.urgencySignal === "eroding").length;
              return (
                <div className="rounded-xl p-4 space-y-2" style={{ background: "hsl(var(--foreground))", border: "none" }}>
                  <div className="flex items-center gap-2">
                    <Flame size={14} style={{ color: "hsl(var(--background))" }} />
                    <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--background) / 0.7)" }}>Highest-Leverage Move</p>
                    {erodingCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "hsl(0 70% 50% / 0.2)", color: "hsl(0 70% 65%)" }}>
                        {erodingCount} eroding now
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold leading-snug" style={{ color: "hsl(var(--background))" }}>
                    Challenge: "{topMove.assumption}"
                  </p>
                  {topMove.impactScenario && (
                    <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--background) / 0.65)" }}>
                      {topMove.impactScenario}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Metric strip */}
            <VisualGrid columns={3}>
              <MetricCard label="Total Assumptions" value={String(assumptions.length)} />
              <MetricCard label="Challengeable" value={String(challengeableCount)} accentColor="hsl(var(--primary))" />
              <MetricCard label="Avg Leverage" value={avgLeverage >= 7 ? "High" : avgLeverage >= 4 ? "Moderate" : "Low"} accentColor="hsl(38 92% 42%)" />
            </VisualGrid>

            <AssumptionCardList assumptions={assumptions} showLimit={SHOW_LIMIT} />
          </AnalysisVisualLayer>
        </StepCanvas>
      )}
    </div>
  );
}
