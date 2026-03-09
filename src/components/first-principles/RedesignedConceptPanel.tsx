import {
  Sparkles, Zap, Package, Cpu, Users, CheckCircle2, ShieldAlert,
} from "lucide-react";
import {
  StepCanvas, InsightCard, FrameworkPanel, SignalCard, MetricCard,
  VisualGrid, ExpandableDetail, AnalysisPanel,
} from "@/components/analysis/AnalysisComponents";
import type { RedesignedConcept } from "./types";

interface RedesignedConceptPanelProps {
  concept: RedesignedConcept;
}

export function RedesignedConceptPanel({ concept }: RedesignedConceptPanelProps) {
  const conceptIsEmpty = !concept || (!concept.conceptName && !concept.coreInsight && !concept.physicalDescription);

  if (conceptIsEmpty) {
    return (
      <StepCanvas>
        <PipelineProcessingState stepKey="redesign" title="Generating redesigned concept" />
      </StepCanvas>
    );
  }

  return (
    <StepCanvas>
      {/* Concept hero */}
      <AnalysisPanel
        title={concept.conceptName}
        subtitle={concept.tagline}
        icon={Sparkles}
        eyebrow="Redesigned Concept"
        eyebrowColor="hsl(217 91% 45%)"
        accentColor="hsl(217 91% 45%)"
      >
        <InsightCard
          headline={concept.coreInsight}
          badge="Core Insight"
          badgeColor="hsl(217 91% 45%)"
          accentColor="hsl(217 91% 45%)"
        />
      </AnalysisPanel>

      {/* Radical Differences */}
      <FrameworkPanel title="Radical Differences" icon={Zap} subtitle={`${(concept.radicalDifferences || []).length} innovations`}>
        <VisualGrid columns={1}>
          {(concept.radicalDifferences || []).map((diff: string, i: number) => (
            <SignalCard key={i} label={diff} type="strength" />
          ))}
        </VisualGrid>
      </FrameworkPanel>

      {/* Physical Form + Materials */}
      <VisualGrid columns={2}>
        <InsightCard
          headline={concept.physicalDescription}
          badge="Physical Form"
          badgeColor="hsl(271 70% 45%)"
          accentColor="hsl(271 70% 45%)"
        >
          {concept.sizeAndWeight && <MetricCard label="Size & Weight" value={concept.sizeAndWeight} />}
        </InsightCard>
        <FrameworkPanel title="Materials" icon={Package}>
          <div className="flex flex-wrap gap-2">
            {(concept.materials || []).map((m: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: "hsl(271 70% 45% / 0.08)", color: "hsl(271 70% 40%)", border: "1px solid hsl(271 70% 45% / 0.15)" }}>{m}</span>
            ))}
          </div>
        </FrameworkPanel>
      </VisualGrid>

      {/* Smart Features */}
      {concept.smartFeatures?.length > 0 && (
        <FrameworkPanel title="Smart Features" icon={Cpu} subtitle={`${concept.smartFeatures.length} features`}>
          <VisualGrid columns={2}>
            {concept.smartFeatures.map((f: string, i: number) => (
              <SignalCard key={i} label={f} type="opportunity" />
            ))}
          </VisualGrid>
        </FrameworkPanel>
      )}

      {/* UX Transformation */}
      <InsightCard
        icon={Users}
        headline={concept.userExperienceTransformation}
        badge="UX Transformation"
        badgeColor="hsl(152 60% 35%)"
        accentColor="hsl(152 60% 44%)"
      />

      {/* Friction Eliminated */}
      {concept.frictionEliminated?.length > 0 && (
        <FrameworkPanel title="Friction Eliminated" icon={CheckCircle2}>
          <VisualGrid columns={1}>
            {concept.frictionEliminated.map((f: string, i: number) => (
              <SignalCard key={i} label={f} type="strength" />
            ))}
          </VisualGrid>
        </FrameworkPanel>
      )}

      {/* Business details */}
      <VisualGrid columns={4}>
        <MetricCard label="Price Point" value={concept.pricePoint} accentColor="hsl(217 91% 45%)" />
        <MetricCard label="Target User" value={concept.targetUser} accentColor="hsl(271 70% 45%)" />
        <MetricCard label="Capital Required" value={concept.capitalRequired || "—"} accentColor="hsl(152 60% 38%)" />
        <MetricCard label="Risk Level" value={concept.riskLevel || "—"} accentColor="hsl(200 80% 42%)" />
      </VisualGrid>

      {/* Why not done + Risk */}
      <ExpandableDetail label="Why it hasn't been done & biggest risk" icon={ShieldAlert} defaultExpanded>
        <div className="space-y-3">
          <InsightCard headline={concept.whyItHasntBeenDone} badge="Why Not Yet" badgeColor="hsl(217 91% 38%)" accentColor="hsl(217 91% 45%)" />
          <InsightCard headline={concept.biggestRisk} badge="Biggest Risk" badgeColor="hsl(271 70% 38%)" accentColor="hsl(271 70% 45%)" />
          <InsightCard headline={concept.manufacturingPath} badge="Mfg Path" badgeColor="hsl(var(--foreground))" />
        </div>
      </ExpandableDetail>

      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
          <CheckCircle2 size={14} style={{ color: "hsl(142 70% 40%)" }} /> All sections explored
        </div>
      </div>
    </StepCanvas>
  );
}
