import {
  Sparkles, Zap, Package, Cpu, Users, CheckCircle2, ShieldAlert,
  Wrench, DollarSign, Shield, Lightbulb, FlaskConical, Ruler,
} from "lucide-react";
import {
  StepCanvas, InsightCard, FrameworkPanel, SignalCard, MetricCard,
  VisualGrid, ExpandableDetail, AnalysisPanel,
} from "@/components/analysis/AnalysisComponents";
import { PipelineProcessingState } from "@/components/PipelineProcessingState";
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

  const hasBom = concept.bomBreakdown && concept.bomBreakdown.length > 0;
  const hasCerts = concept.certifications && concept.certifications.length > 0;
  const hasPrecedents = concept.productPrecedents && concept.productPrecedents.length > 0;
  const hasEngineeringData = hasBom || hasCerts || concept.prototypeApproach || concept.dfmNotes || hasPrecedents;

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

      {/* ══ ENGINEERING & MANUFACTURING SECTION ══ */}
      {hasEngineeringData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pt-2">
            <Wrench size={16} style={{ color: "hsl(200 80% 42%)" }} />
            <p className="text-sm font-extrabold uppercase tracking-widest" style={{ color: "hsl(200 80% 35%)" }}>
              Engineering & Manufacturing
            </p>
          </div>

          {/* BOM Breakdown */}
          {hasBom && (
            <ExpandableDetail label={`Bill of Materials${concept.totalBomEstimate ? ` — ${concept.totalBomEstimate}` : ''}`} icon={DollarSign} defaultExpanded>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                      <th className="text-left py-2 px-2 font-bold uppercase tracking-widest text-muted-foreground text-[10px]">Component</th>
                      <th className="text-left py-2 px-2 font-bold uppercase tracking-widest text-muted-foreground text-[10px]">Material</th>
                      <th className="text-left py-2 px-2 font-bold uppercase tracking-widest text-muted-foreground text-[10px]">Process</th>
                      <th className="text-right py-2 px-2 font-bold uppercase tracking-widest text-muted-foreground text-[10px]">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {concept.bomBreakdown!.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
                        <td className="py-2 px-2 font-semibold text-foreground">{row.component}</td>
                        <td className="py-2 px-2 text-foreground/80">{row.material}</td>
                        <td className="py-2 px-2 text-foreground/80">{row.process}</td>
                        <td className="py-2 px-2 text-right font-bold" style={{ color: "hsl(142 70% 35%)" }}>{row.unitCost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {concept.totalBomEstimate && (
                <div className="mt-3 p-3 rounded-lg flex items-center justify-between" style={{ background: "hsl(142 70% 40% / 0.08)", border: "1px solid hsl(142 70% 40% / 0.15)" }}>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(142 70% 30%)" }}>Total BOM (10K units)</span>
                  <span className="text-sm font-extrabold" style={{ color: "hsl(142 70% 30%)" }}>{concept.totalBomEstimate}</span>
                </div>
              )}
            </ExpandableDetail>
          )}

          {/* Certifications */}
          {hasCerts && (
            <ExpandableDetail label="Required Certifications" icon={Shield} defaultExpanded>
              <div className="flex flex-wrap gap-2 mb-3">
                {concept.certifications!.map((cert, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "hsl(38 92% 50% / 0.1)", color: "hsl(38 92% 35%)", border: "1px solid hsl(38 92% 50% / 0.15)" }}>
                    {cert}
                  </span>
                ))}
              </div>
              {concept.certificationPath && (
                <InsightCard headline={concept.certificationPath} badge="Certification Path" badgeColor="hsl(38 92% 35%)" accentColor="hsl(38 92% 50%)" />
              )}
            </ExpandableDetail>
          )}

          {/* Prototype Approach */}
          {concept.prototypeApproach && (
            <ExpandableDetail label="Prototype Approach" icon={FlaskConical} defaultExpanded>
              <InsightCard headline={concept.prototypeApproach} badge="How to Build v0.1" badgeColor="hsl(200 80% 35%)" accentColor="hsl(200 80% 42%)" />
            </ExpandableDetail>
          )}

          {/* DFM Notes */}
          {concept.dfmNotes && (
            <ExpandableDetail label="Design for Manufacturability" icon={Ruler} defaultExpanded>
              <InsightCard headline={concept.dfmNotes} badge="DFM" badgeColor="hsl(271 70% 40%)" accentColor="hsl(271 70% 45%)" />
            </ExpandableDetail>
          )}

          {/* Product Precedents */}
          {hasPrecedents && (
            <ExpandableDetail label="Product Innovation Precedents" icon={Lightbulb} defaultExpanded>
              <VisualGrid columns={1}>
                {concept.productPrecedents!.map((p, i) => (
                  <InsightCard
                    key={i}
                    headline={`${p.product} — ${p.company}`}
                    subtext={p.relevance}
                    badge="Proven Mechanism"
                    badgeColor="hsl(142 70% 35%)"
                    accentColor="hsl(142 70% 40%)"
                  />
                ))}
              </VisualGrid>
            </ExpandableDetail>
          )}
        </div>
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
