import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton } from "@/components/SectionNav";
import { scrollToTop } from "@/utils/scrollToTop";
import { type StrategicHypothesis, rankWithProfile, adaptStrategicProfile } from "@/lib/strategicOS";
import { Target, Atom, Lightbulb, GitBranch } from "lucide-react";
import { StructureTab } from "@/components/strategic/StructureTab";
import { RedesignTab } from "@/components/strategic/RedesignTab";
import { StepLoadingTracker, DISRUPT_TASKS } from "@/components/StepLoadingTracker";
import { ReasoningSynopsis } from "@/components/ReasoningSynopsis";
import StructuralInterpretationsPanel from "@/components/StructuralInterpretationsPanel";

// ── Shared layout components ──
import {
  AnalysisPageShell,
  AnalysisStepHeader,
  AnalysisActionToolbar,
  AnalysisTabBar,
  AnalysisLoadingCard,
  AnalysisContentCard,
  AnalysisLoadingSpinner,
  type TabDef,
} from "@/components/analysis/AnalysisPageShell";

const TABS: TabDef<"structure" | "reasoning" | "hypotheses">[] = [
  { id: "structure", label: "First Principles", icon: Atom },
  { id: "reasoning", label: "Reasoning", icon: Lightbulb },
  { id: "hypotheses", label: "Hypotheses", icon: GitBranch },
];

type TabId = "structure" | "reasoning" | "hypotheses";

export default function DisruptPage() {
  const [activeTab, setActiveTab] = useState<TabId>("structure");
  const [runTrigger, setRunTrigger] = useState(0);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();

  const { selectedProduct, analysisId, products } = analysis;

  if (analysis.step !== "done" || !selectedProduct) {
    return <AnalysisLoadingSpinner />;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const governedData = analysis.governedData;
  const synopsisData = governedData?.reasoning_synopsis ?? null;
  const hasDisruptData = !!analysis.disruptData;
  const cm = governedData?.constraint_map as Record<string, unknown> | undefined;
  const rawHypotheses = (cm?.root_hypotheses || governedData?.root_hypotheses) as StrategicHypothesis[] | undefined;
  const hasHypotheses = hasDisruptData && rawHypotheses && rawHypotheses.length > 0;
  const hasSynopsis = hasDisruptData && !!synopsisData;
  const ranking = hasHypotheses ? rankWithProfile(rawHypotheses!, analysis.strategicProfile) : null;

  const gatedTabs: TabId[] = ["reasoning", "hypotheses"];
  const effectiveTab = !hasDisruptData && gatedTabs.includes(activeTab) ? "structure" : activeTab;

  // Hide tabs that have no data
  const hiddenTabs: TabId[] = [];
  if (!hasSynopsis) hiddenTabs.push("reasoning");
  if (!hasHypotheses) hiddenTabs.push("hypotheses");

  // Disable tabs before data is ready
  const disabledTabs: TabId[] = !hasDisruptData ? ["reasoning", "hypotheses"] : [];

  return (
    <AnalysisPageShell tier={tier}>
      <AnalysisStepHeader
        steps={getStepConfigs(theme.primary)}
        activeStep={3}
        visitedSteps={new Set([2, 3])}
        onStepChange={(s) => {
          if (s === 2) navigate(`${baseUrl}/report`);
          else if (s === 4) navigate(`${baseUrl}/redesign`);
          else if (s === 5) navigate(`${baseUrl}/stress-test`);
          else if (s === 6) navigate(`${baseUrl}/pitch`);
        }}
        outdatedSteps={analysis.outdatedSteps}
        accentColor={theme.primary}
        backLabel="Intelligence Report"
        backPath={`${baseUrl}/report`}
      />

      <AnalysisActionToolbar
        analysisTitle={selectedProduct.name}
        stepTitle="Strategic Intelligence"
        analysis={analysis}
        selectedProduct={selectedProduct}
        analysisId={analysisId}
        accentColor={theme.primary}
        isLoading={analysisLoading}
        hasData={hasDisruptData}
        onRun={() => { setRunTrigger(t => t + 1); setActiveTab("structure"); }}
        strategicProfile={analysis.strategicProfile}
        onChangeProfile={analysis.setStrategicProfile}
      />

      {/* ── Sticky Tab Navigation ── */}
      <div className="sticky top-0 z-20 -mx-3 sm:-mx-6 px-3 sm:px-6 py-2" style={{ background: "hsl(var(--background))", borderBottom: "2px solid hsl(var(--border))" }}>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            if (hiddenTabs.includes(tab.id)) return null;
            const Icon = tab.icon;
            const isActive = effectiveTab === tab.id;
            const isDisabled = disabledTabs.includes(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0"
                style={{
                  background: isActive ? "hsl(var(--foreground))" : "transparent",
                  color: isActive ? "hsl(var(--background))" : isDisabled ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
                  border: isActive ? "none" : "1.5px solid hsl(var(--border))",
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Loading Tracker ── */}
      {analysisLoading && (
        <AnalysisLoadingCard>
          <StepLoadingTracker
            title="Building First Principles Analysis"
            tasks={DISRUPT_TASKS}
            estimatedSeconds={50}
            accentColor="hsl(271 81% 55%)"
          />
        </AnalysisLoadingCard>
      )}

      {/* ── Tab Content ── */}
      <div style={{ display: analysisLoading ? "none" : undefined }} className="min-h-[400px]">
        {effectiveTab === "structure" && (
          <StructureTab
            selectedProduct={selectedProduct}
            analysis={analysis}
            governedData={governedData as Record<string, unknown> | null}
            synopsisData={synopsisData}
            rawHypotheses={hasHypotheses ? rawHypotheses! : null}
            hasDisruptData={hasDisruptData}
            hasSynopsis={false}
            hasHypotheses={false}
            ranking={ranking}
            products={products}
            runTrigger={runTrigger}
            onLoadingChange={setAnalysisLoading}
          />
        )}

        {effectiveTab === "reasoning" && hasSynopsis && (
          <AnalysisContentCard>
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
          </AnalysisContentCard>
        )}

        {effectiveTab === "hypotheses" && hasHypotheses && ranking && (
          <div className="space-y-3">
            {/* Problem Framing context */}
            {(() => {
              const pf = (synopsisData as any)?.problem_framing;
              if (!pf) return null;
              return (
                <div className="rounded-xl px-5 py-4 space-y-3" style={{ background: "hsl(var(--muted))", border: "1.5px solid hsl(var(--border))" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--primary) / 0.12)" }}>
                      <Target size={15} style={{ color: "hsl(var(--primary))" }} />
                    </div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Problem Framing</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-relaxed">{pf.objective_interpretation}</p>
                  {pf.success_criteria && pf.success_criteria.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {pf.success_criteria.map((c: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "hsl(142 70% 45% / 0.08)", color: "hsl(142 60% 32%)", border: "1px solid hsl(142 70% 45% / 0.15)" }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <AnalysisContentCard>
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
                    if (selected.estimated_capital_required && selected.estimated_capital_required > 500_000) signals.selected_high_capital = true;
                    if (selected.constraint_type === "risk" || selected.fragility_score > 6) signals.selected_high_risk = true;
                    if (selected.estimated_time_to_impact_months && selected.estimated_time_to_impact_months > analysis.strategicProfile.time_horizon_months) signals.selected_long_horizon = true;
                    if (Object.keys(signals).length > 0) {
                      const evolved = adaptStrategicProfile(analysis.strategicProfile, signals);
                      analysis.setStrategicProfile(evolved);
                    }
                  }
                  analysis.setActiveBranchId(id);
                }}
              />
            </AnalysisContentCard>

            <RedesignTab
              disruptData={analysis.disruptData as Record<string, unknown> | null}
              hypotheses={hasHypotheses ? rawHypotheses! : null}
              governedData={governedData as Record<string, unknown> | null}
            />
          </div>
        )}
      </div>

      <NextStepButton
        stepNumber={4}
        label="Redesign"
        color={theme.primary}
        onClick={() => { scrollToTop(); navigate(`${baseUrl}/redesign`); }}
      />
    </AnalysisPageShell>
  );
}
