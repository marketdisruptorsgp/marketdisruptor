import { useState } from "react";
import { Wrench, Beaker, Shield, DollarSign, Lightbulb } from "lucide-react";
import { PitchDeckToggle } from "@/components/PitchDeckToggle";
import { InsightRating } from "@/components/InsightRating";
import { SyntheticBadge } from "@/components/SyntheticBadge";
import {
  StepCanvas, InsightCard, MetricCard, VisualGrid, SignalCard,
} from "@/components/analysis/AnalysisComponents";
import { PipelineProcessingState } from "@/components/PipelineProcessingState";
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
          const hasEngineering = item.physicalPrinciple || item.manufacturingMethod || item.bomEstimate || item.certifications?.length;

          return (
            <div key={i} style={{ opacity: item._synthetic ? 0.6 : 1 }}>
              <InsightCard
                headline={item.boldAlternative}
                subtext={item.rationale}
                accentColor="hsl(var(--primary))"
                badge={`was: ${item.originalAssumption}`}
                badgeColor="hsl(var(--muted-foreground))"
                action={
                  <div className="flex items-center gap-2">
                    {item._synthetic && <SyntheticBadge />}
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

                  {/* ── Engineering Grounding Section ── */}
                  {hasEngineering && (
                    <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(200 80% 42% / 0.06)", border: "1px solid hsl(200 80% 42% / 0.15)" }}>
                      <p className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5" style={{ color: "hsl(200 80% 35%)" }}>
                        <Wrench size={12} /> Engineering Grounding
                      </p>
                      <VisualGrid columns={2}>
                        {item.physicalPrinciple && (
                          <div className="p-3 rounded-lg" style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1"><Beaker size={10} /> Physical Principle</p>
                            <p className="text-xs text-foreground/90 leading-relaxed">{item.physicalPrinciple}</p>
                          </div>
                        )}
                        {item.manufacturingMethod && (
                          <div className="p-3 rounded-lg" style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1"><Wrench size={10} /> Manufacturing</p>
                            <p className="text-xs text-foreground/90 leading-relaxed">{item.manufacturingMethod}</p>
                          </div>
                        )}
                      </VisualGrid>
                      <VisualGrid columns={2}>
                        {item.bomEstimate && (
                          <div className="p-3 rounded-lg" style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1"><DollarSign size={10} /> BOM Estimate</p>
                            <p className="text-xs font-semibold" style={{ color: "hsl(142 70% 35%)" }}>{item.bomEstimate}</p>
                          </div>
                        )}
                        {item.certifications && item.certifications.length > 0 && (
                          <div className="p-3 rounded-lg" style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1"><Shield size={10} /> Certifications Required</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.certifications.map((cert, ci) => (
                                <span key={ci} className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: "hsl(38 92% 50% / 0.1)", color: "hsl(38 92% 35%)" }}>{cert}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </VisualGrid>
                      {item.productPrecedent && (
                        <div className="p-3 rounded-lg" style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1"><Lightbulb size={10} /> Product Precedent</p>
                          <p className="text-xs text-foreground/90 leading-relaxed italic">{item.productPrecedent}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {matchedAssumption?.impactScenario && (
                    <InsightCard headline="Impact Scenario" subtext={matchedAssumption.impactScenario} accentColor="hsl(var(--primary))" />
                  )}
                </div>
              }
            />
            </div>
          );
        })}
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
  const engineeringGroundedCount = flips.filter(f => f.physicalPrinciple || f.manufacturingMethod || f.bomEstimate).length;
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
      <VisualGrid columns={engineeringGroundedCount > 0 ? 3 : 2}>
        <MetricCard label="Inversions" value={String(flips.length)} accentColor="hsl(var(--primary))" />
        {highLeverageCount > 0 && (
          <MetricCard label="High Leverage" value={String(highLeverageCount)} accentColor="hsl(var(--destructive))" />
        )}
        {engineeringGroundedCount > 0 && (
          <MetricCard label="Engineering Grounded" value={String(engineeringGroundedCount)} accentColor="hsl(200 80% 42%)" />
        )}
      </VisualGrid>
      <FlipCardList flips={flips} assumptions={assumptions} showLimit={SHOW_LIMIT} />
    </StepCanvas>
  );
}
