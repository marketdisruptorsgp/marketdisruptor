import React from "react";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { ReasoningSynopsis } from "@/components/ReasoningSynopsis";
import StructuralInterpretationsPanel from "@/components/StructuralInterpretationsPanel";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Brain, Lightbulb, GitBranch, ChevronDown } from "lucide-react";
import { type StrategicHypothesis, rankWithProfile, adaptStrategicProfile } from "@/lib/strategicOS";
import type { Product } from "@/data/mockProducts";

interface StructureTabProps {
  selectedProduct: Product;
  analysis: any; // AnalysisContext
  governedData: Record<string, unknown> | null;
  synopsisData: any;
  rawHypotheses: StrategicHypothesis[] | null;
  hasDisruptData: boolean;
  hasSynopsis: boolean;
  hasHypotheses: boolean;
  ranking: any;
  products: Product[];
}

function StructureSection({
  title,
  icon: Icon,
  defaultOpen,
  children,
  badge,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen ?? true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-xl text-left transition-all cursor-pointer"
        style={{
          background: open ? "hsl(var(--card))" : "hsl(var(--card))",
          border: `1.5px solid ${open ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))"}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--foreground))" }}>
            <Icon size={15} style={{ color: "hsl(var(--background))" }} />
          </div>
          <span className="text-base font-bold text-foreground">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
              {badge}
            </span>
          )}
        </div>
        <ChevronDown size={16} className="text-foreground/40 transition-transform flex-shrink-0" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 rounded-xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function StructureTab({
  selectedProduct,
  analysis,
  governedData,
  synopsisData,
  rawHypotheses,
  hasDisruptData,
  hasSynopsis,
  hasHypotheses,
  ranking,
  products,
}: StructureTabProps) {
  const assumptions = (analysis.disruptData as any)?.hiddenAssumptions || [];

  return (
    <div className="space-y-3">
      {/* A. Assumptions */}
      <StructureSection
        title="Assumptions"
        icon={Brain}
        defaultOpen={true}
        badge={assumptions.length > 0 ? `${assumptions.length} found` : undefined}
      >
        <FirstPrinciplesAnalysis
          product={selectedProduct}
          onSaved={() => analysis.setSavedRefreshTrigger((n: number) => n + 1)}
          flippedIdeas={selectedProduct.flippedIdeas}
          onRegenerateIdeas={(ctx: string | undefined) => analysis.handleRegenerateIdeas(selectedProduct, ctx)}
          generatingIdeas={analysis.generatingIdeasFor === selectedProduct.id}
          externalData={analysis.disruptData}
          onAnalysisStarted={() => { analysis.setGovernedData(null); }}
          onDataLoaded={(d: unknown) => {
            analysis.setDisruptData(d);
            analysis.saveStepData("disrupt", d);
            analysis.markStepOutdated("redesign");
            analysis.markStepOutdated("stressTest");
            analysis.markStepOutdated("pitch");
          }}
          onPatentSave={(patentData: unknown) => {
            const updated = products.map((p: Product) =>
              p.id === selectedProduct.id ? { ...p, patentData } : p
            );
            analysis.setProducts(updated);
            analysis.setSelectedProduct({ ...selectedProduct, patentData });
            if (analysis.analysisParams) analysis.saveAnalysis(updated, analysis.analysisParams);
          }}
          userScores={analysis.userScores}
          onScoreChange={(ideaId: string, scoreKey: string, value: number) => {
            analysis.setUserScore(ideaId, scoreKey, value);
            analysis.saveStepData("userScores", {
              ...analysis.userScores,
              [ideaId]: { ...(analysis.userScores[ideaId] || {}), [scoreKey]: value },
            });
          }}
        />
      </StructureSection>

      {/* B. Reasoning */}
      {hasSynopsis && (
        <StructureSection title="Reasoning" icon={Lightbulb} defaultOpen={false}>
          <ReasoningSynopsis
            data={synopsisData}
            analysisData={{ ...selectedProduct, governed: governedData } as any}
            products={undefined}
            title={selectedProduct?.name || ""}
            category={analysis.analysisParams?.category || ""}
            analysisType={(analysis.analysisParams as any)?.analysisType || (analysis.analysisParams as any)?.analysis_type || "product"}
            avgScore={(selectedProduct as any)?.revivalScore ?? null}
            analysisId={analysis.analysisId}
            onApplyRevision={(revision: any) => {
              const currentGoverned = analysis.governedData || {};
              if (revision.type === "re_rank" && revision.payload?.hypotheses) {
                analysis.setGovernedData({ ...currentGoverned, root_hypotheses: revision.payload.hypotheses });
              } else if (revision.type === "update_assumption" && revision.payload) {
                const synopsis = (currentGoverned as any)?.reasoning_synopsis || {};
                const updatedAssumptions = synopsis.key_assumptions?.map((a: any) =>
                  a.assumption === revision.payload.target ? { ...a, ...revision.payload.updates } : a
                ) || [];
                analysis.setGovernedData({
                  ...currentGoverned,
                  reasoning_synopsis: { ...synopsis, key_assumptions: updatedAssumptions },
                });
              }
              analysis.saveStepData("governed", analysis.governedData || currentGoverned);
              analysis.markStepOutdated("redesign");
              analysis.markStepOutdated("stressTest");
              analysis.markStepOutdated("pitch");
            }}
          />
        </StructureSection>
      )}

      {/* C. Hypotheses */}
      {hasHypotheses && ranking && (
        <StructureSection
          title="Hypotheses"
          icon={GitBranch}
          defaultOpen={false}
          badge={rawHypotheses ? `${rawHypotheses.length} paths` : undefined}
        >
          <StructuralInterpretationsPanel
            ranking={ranking}
            activeBranchId={analysis.activeBranchId}
            analysisData={{ ...selectedProduct, governed: analysis.governedData }}
            title={selectedProduct?.name || ""}
            category={analysis.analysisParams?.category || ""}
            onApplyRevision={(revision: any) => {
              const currentGoverned = analysis.governedData || {};
              if (revision.type === "new_hypothesis" && revision.payload) {
                const existing = (currentGoverned as any)?.root_hypotheses || [];
                const newH = { ...revision.payload, id: `user-hyp-${Date.now()}` };
                analysis.setGovernedData({ ...currentGoverned, root_hypotheses: [...existing, newH] });
                analysis.markStepOutdated("redesign");
                analysis.markStepOutdated("stressTest");
                analysis.markStepOutdated("pitch");
              }
            }}
            onSelectBranch={(id: string) => {
              const selected = rawHypotheses!.find((h: StrategicHypothesis) => h.id === id);
              if (selected) {
                const signals: { selected_high_capital?: boolean; selected_high_risk?: boolean; selected_long_horizon?: boolean } = {};
                if (selected.estimated_capital_required && selected.estimated_capital_required > 500_000) {
                  signals.selected_high_capital = true;
                }
                if (selected.constraint_type === "risk" || selected.fragility_score > 6) {
                  signals.selected_high_risk = true;
                }
                if (selected.estimated_time_to_impact_months && selected.estimated_time_to_impact_months > analysis.strategicProfile.time_horizon_months) {
                  signals.selected_long_horizon = true;
                }
                if (Object.keys(signals).length > 0) {
                  const evolved = adaptStrategicProfile(analysis.strategicProfile, signals);
                  analysis.setStrategicProfile(evolved);
                }
              }
              analysis.setActiveBranchId(id);
            }}
          />
        </StructureSection>
      )}
    </div>
  );
}
