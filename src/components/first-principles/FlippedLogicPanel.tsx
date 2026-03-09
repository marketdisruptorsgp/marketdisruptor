import { useState } from "react";
import { FlipHorizontal } from "lucide-react";
import { PitchDeckToggle } from "@/components/PitchDeckToggle";
import { InsightRating } from "@/components/InsightRating";
import {
  StepCanvas, InsightCard, MetricCard, VisualGrid,
} from "@/components/analysis/AnalysisComponents";
import type { FlippedLogicItem, HiddenAssumption } from "./types";

/* ── Flip Card List ── */
function FlipCardList({ flips, assumptions, showLimit }: { flips: FlippedLogicItem[]; assumptions: HiddenAssumption[]; showLimit: number }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? flips : flips.slice(0, showLimit);

  return (
    <>
      <div className="space-y-4">
        {visible.map((item, i) => {
          const matchedAssumption = assumptions.find(a =>
            item.originalAssumption.toLowerCase().includes(a.assumption.toLowerCase().slice(0, 20))
          );
          const leverageScore = matchedAssumption?.leverageScore;

          return (
            <InsightCard
              key={i}
              headline={item.boldAlternative}
              subtext={item.rationale}
              accentColor="hsl(var(--primary))"
              badge={`was: ${item.originalAssumption.slice(0, 30)}${item.originalAssumption.length > 30 ? "…" : ""}`}
              badgeColor="hsl(var(--muted-foreground))"
              action={
                <div className="flex items-center gap-2">
                  {leverageScore != null && (
                    <span className="text-xs font-bold tabular-nums" style={{
                      color: leverageScore >= 8 ? "hsl(var(--primary))" : leverageScore >= 6 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))",
                    }}>
                      {leverageScore}/10
                    </span>
                  )}
                  <InsightRating sectionId={`flip-${i}`} compact />
                  <PitchDeckToggle contentKey={`flippedLogic-${i}`} label="Pitch" />
                </div>
              }
              detail={
                <div className="space-y-3">
                  <VisualGrid columns={2}>
                    <div className="p-3.5 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Why This Creates Value</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{item.rationale}</p>
                    </div>
                    <div className="p-3.5 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-2">How It Works</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{item.physicalMechanism}</p>
                    </div>
                  </VisualGrid>
                  {matchedAssumption?.impactScenario && (
                    <InsightCard headline="Impact Scenario" subtext={matchedAssumption.impactScenario} accentColor="hsl(var(--primary))" />
                  )}
                </div>
              }
            />
          );
        })}
      </div>
      {flips.length > showLimit && (
        <button onClick={() => setShowAll(!showAll)} className="w-full py-3 rounded-xl text-xs font-bold transition-all"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))", border: "1.5px solid hsl(var(--primary) / 0.2)" }}>
          {showAll ? "Show fewer" : `Show ${flips.length - showLimit} more inversions`}
        </button>
      )}
    </>
  );
}

interface FlippedLogicPanelProps {
  flips: FlippedLogicItem[];
  assumptions: HiddenAssumption[];
}

export function FlippedLogicPanel({ flips, assumptions }: FlippedLogicPanelProps) {
  const highLeverageCount = assumptions.filter(a => (a.leverageScore || 0) >= 7).length;
  const SHOW_LIMIT = 10;

  if (flips.length === 0) {
    return (
      <StepCanvas>
        <PipelineProcessingState stepKey="disrupt" title="Inverting assumptions" />
      </StepCanvas>
    );
  }

  return (
    <StepCanvas>
      <VisualGrid columns={2}>
        <MetricCard label="Inversions" value={String(flips.length)} accentColor="hsl(var(--primary))" />
        {highLeverageCount > 0 && (
          <MetricCard label="High Leverage" value={String(highLeverageCount)} accentColor="hsl(var(--destructive))" />
        )}
      </VisualGrid>
      <FlipCardList flips={flips} assumptions={assumptions} showLimit={SHOW_LIMIT} />
    </StepCanvas>
  );
}
