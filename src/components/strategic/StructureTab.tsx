import React from "react";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { ReasoningSynopsis } from "@/components/ReasoningSynopsis";
import StructuralInterpretationsPanel from "@/components/StructuralInterpretationsPanel";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Brain, Lightbulb, GitBranch, ChevronDown, Atom, ArrowRight } from "lucide-react";
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
  runTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
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

/* ── First Principles Display ── */
function FirstPrinciplesSection({ governedData }: { governedData: Record<string, unknown> | null }) {
  const fp = governedData?.first_principles as {
    minimum_viable_system?: string;
    causal_model?: { inputs?: string[]; mechanism?: string; outputs?: string[] };
    fundamental_constraints?: string[];
    resource_limits?: string[];
    behavioral_realities?: string[];
    dependency_structure?: string[];
    viability_assumptions?: Array<{ assumption: string; evidence_status: string; leverage_if_wrong: number }>;
  } | undefined;

  if (!fp) {
    return (
      <div className="text-center py-8 space-y-2">
        <Atom size={28} className="mx-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
        <p className="text-sm font-bold text-foreground">No first principles data yet</p>
        <p className="text-xs text-muted-foreground">Run the analysis to decompose this system into fundamental truths.</p>
      </div>
    );
  }

  const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    verified: { bg: "hsl(142 70% 40% / 0.12)", text: "hsl(142 70% 40%)", label: "Verified" },
    modeled: { bg: "hsl(38 92% 50% / 0.12)", text: "hsl(38 92% 50%)", label: "Modeled" },
    speculative: { bg: "hsl(0 70% 50% / 0.12)", text: "hsl(0 70% 50%)", label: "Speculative" },
  };

  return (
    <div className="space-y-5">
      {/* Minimum Viable System */}
      {fp.minimum_viable_system && (
        <div className="space-y-1.5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Minimum Viable System</p>
          <p className="text-sm leading-relaxed text-foreground">{fp.minimum_viable_system}</p>
        </div>
      )}

      {/* Causal Model */}
      {fp.causal_model && (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Causal Model</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
            {/* Inputs */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Inputs</p>
              <div className="flex flex-wrap gap-1.5">
                {(fp.causal_model.inputs || []).map((inp, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
                    {inp}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight size={16} className="text-muted-foreground hidden sm:block flex-shrink-0" />
            {/* Mechanism */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Mechanism</p>
              <p className="text-xs leading-relaxed text-foreground font-medium">{fp.causal_model.mechanism}</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground hidden sm:block flex-shrink-0" />
            {/* Outputs */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Outputs</p>
              <div className="flex flex-wrap gap-1.5">
                {(fp.causal_model.outputs || []).map((out, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                    {out}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fundamental Constraints */}
      {fp.fundamental_constraints && fp.fundamental_constraints.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Fundamental Constraints</p>
          <ul className="space-y-1">
            {fp.fundamental_constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(0 70% 50%)" }} />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resource Limits */}
      {fp.resource_limits && fp.resource_limits.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Resource Limits</p>
          <ul className="space-y-1">
            {fp.resource_limits.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(38 92% 50%)" }} />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Behavioral Realities */}
      {fp.behavioral_realities && fp.behavioral_realities.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Behavioral Realities</p>
          <ul className="space-y-1">
            {fp.behavioral_realities.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(271 81% 50%)" }} />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dependency Structure */}
      {fp.dependency_structure && fp.dependency_structure.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Dependency Structure</p>
          <ul className="space-y-1">
            {fp.dependency_structure.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(217 91% 55%)" }} />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Viability Assumptions */}
      {fp.viability_assumptions && fp.viability_assumptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Viability Assumptions</p>
          <div className="space-y-2">
            {fp.viability_assumptions
              .sort((a, b) => b.leverage_if_wrong - a.leverage_if_wrong)
              .map((va, i) => {
                const status = STATUS_COLORS[va.evidence_status] || STATUS_COLORS.speculative;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-relaxed font-medium">{va.assumption}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: status.bg, color: status.text }}>
                          {status.label}
                        </span>
                        <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                          Leverage if wrong: {va.leverage_if_wrong}/10
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
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
  runTrigger,
  onLoadingChange,
}: StructureTabProps) {
  const assumptions = (analysis.disruptData as any)?.hiddenAssumptions || [];

  return (
    <div className="space-y-3">
      {/* First Principles */}
      <StructureSection
        title="First Principles"
        icon={Atom}
        defaultOpen={true}
        badge={hasDisruptData ? "Decomposed" : undefined}
      >
        <FirstPrinciplesSection governedData={governedData} />
      </StructureSection>

      {/* A. Assumptions */}
      <StructureSection
        title="Assumptions"
        icon={Brain}
        defaultOpen={hasDisruptData}
        badge={assumptions.length > 0 ? `${assumptions.length} found` : undefined}
      >
        <FirstPrinciplesAnalysis
          product={selectedProduct}
          onSaved={() => analysis.setSavedRefreshTrigger((n: number) => n + 1)}
          flippedIdeas={selectedProduct.flippedIdeas}
          onRegenerateIdeas={(ctx: string | undefined) => analysis.handleRegenerateIdeas(selectedProduct, ctx)}
          generatingIdeas={analysis.generatingIdeasFor === selectedProduct.id}
          externalData={analysis.disruptData}
          runTrigger={runTrigger}
          onLoadingChange={onLoadingChange}
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
