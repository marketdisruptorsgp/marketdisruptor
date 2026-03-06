import { Crosshair, ArrowRight } from "lucide-react";
import { PitchDeckToggle } from "@/components/PitchDeckToggle";
import {
  InsightCard, SignalCard, VisualGrid, ExpandableDetail, AnalysisPanel,
} from "@/components/analysis/AnalysisComponents";
import type { CompetitiveLandscape } from "./types";

interface CompetitiveLandscapePanelProps {
  landscape?: CompetitiveLandscape;
  hasCompetitorIntel: boolean;
}

export function CompetitiveLandscapePanel({ landscape, hasCompetitorIntel }: CompetitiveLandscapePanelProps) {
  if (landscape?.originalVsCompetitors?.length) {
    return (
      <AnalysisPanel title="Competitive Landscape" icon={Crosshair} eyebrow="Strategy">
        <VisualGrid columns={2}>
          <InsightCard
            headline={landscape.positioningRecommendation}
            badge="Positioning"
            badgeColor="hsl(var(--primary))"
            accentColor="hsl(var(--primary))"
          />
          <InsightCard
            headline={landscape.biggestCompetitiveThreat}
            badge="Top Threat"
            badgeColor="hsl(var(--destructive))"
            accentColor="hsl(var(--destructive))"
          />
        </VisualGrid>

        {landscape.categoryDynamics && (
          <SignalCard label={landscape.categoryDynamics} type="neutral" />
        )}

        <ExpandableDetail label={`Competitor Comparisons (${landscape.originalVsCompetitors.length})`} icon={Crosshair}>
          <div className="space-y-2">
            {landscape.originalVsCompetitors.map((comp, i) => (
              <InsightCard
                key={i}
                headline={comp.competitor}
                badge="Competitor"
                badgeColor="hsl(var(--primary))"
                action={
                  <div className="flex items-center gap-2">
                    {comp.url && (
                      <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                        <ArrowRight size={8} /> Visit
                      </a>
                    )}
                    <PitchDeckToggle contentKey={`comp-landscape-${i}`} label="Pitch" />
                  </div>
                }
                detail={
                  <VisualGrid columns={2}>
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Original Product</p>
                      <SignalCard label={comp.originalAdvantage} type="strength" explanation="Advantage" />
                      <SignalCard label={comp.originalVulnerability} type="threat" explanation="Vulnerability" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Redesigned Concept</p>
                      <SignalCard label={comp.redesignAdvantage} type="strength" explanation="Advantage" />
                      <SignalCard label={comp.redesignGap} type="weakness" explanation="Remaining Gap" />
                    </div>
                  </VisualGrid>
                }
                defaultExpanded
              />
            ))}
          </div>
        </ExpandableDetail>

        {landscape.pricingInsight && (
          <InsightCard
            headline={landscape.pricingInsight}
            badge="Pricing"
            badgeColor="hsl(38 92% 45%)"
            accentColor="hsl(38 92% 45%)"
            action={<PitchDeckToggle contentKey="comp-pricing-insight" label="Pitch" />}
          />
        )}
      </AnalysisPanel>
    );
  }

  if (!hasCompetitorIntel) {
    return (
      <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--muted) / 0.5)", border: "1px dashed hsl(var(--border))" }}>
        <p className="text-xs text-muted-foreground">
          <Crosshair size={10} className="inline mr-1" />
          Scout competitors in the Disrupt step for deeper competitive landscape analysis here.
        </p>
      </div>
    );
  }

  return null;
}
