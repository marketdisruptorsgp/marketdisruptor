import React, { useState, useMemo } from "react";
import { InsightSnapshotPanel } from "@/components/analysis/InsightSnapshotPanel";
import { PipelineProgressBar } from "@/components/analysis/PipelineProgressBar";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { SplitStepLayout } from "@/components/analysis/SplitStepLayout";
import { OpportunityDirectionsGrid } from "@/components/command-deck/OpportunityDirectionsGrid";
import { RecommendedMoveCard } from "@/components/command-deck/RecommendedMoveCard";
import { generatePlaybooks } from "@/lib/playbookEngine";
import { StepVisualOutput } from "@/components/analysis/StepVisualOutput";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { useAnalysisTimeout } from "@/hooks/useAnalysisTimeout";
import { AnalysisTimeoutEscape } from "@/components/analysis/AnalysisTimeoutEscape";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton } from "@/components/SectionNav";
import { scrollToTop } from "@/utils/scrollToTop";
import { type StrategicHypothesis, rankWithProfile, adaptStrategicProfile, DEFAULT_PROFILES } from "@/lib/strategicOS";
import { Target, Atom, Lightbulb, GitBranch, Brain, Shield, Sparkles } from "lucide-react";
import { PreliminaryBadge } from "@/components/PreliminaryBadge";
import { StructureTab } from "@/components/strategic/StructureTab";
import { StepLoadingTracker, DISRUPT_TASKS } from "@/components/StepLoadingTracker";
import { ReasoningSynopsis } from "@/components/ReasoningSynopsis";
import StructuralInterpretationsPanel from "@/components/StructuralInterpretationsPanel";
import { InnovationOpportunitiesPanel } from "@/components/InnovationOpportunitiesPanel";
import { FlippedIdeasPanel } from "@/components/first-principles/FlippedIdeasPanel";
import { MorphologicalExplorerPanel } from "@/components/first-principles/MorphologicalExplorerPanel";

// ── Shared layout components ──
import {
  AnalysisPageShell,
  AnalysisStepHeader,
  AnalysisActionToolbar,
  AnalysisTabBar,
  AnalysisLoadingCard,
  AnalysisContentCard,
  AnalysisLoadingSpinner,
  AnalysisPipelineErrorCard,
  type TabDef,
} from "@/components/analysis/AnalysisPageShell";

const TABS: TabDef<"assumptions" | "deconstruct" | "reasoning" | "hypotheses">[] = [
  { id: "assumptions", label: "Assumptions", icon: Shield },
  { id: "deconstruct", label: "Deconstruct", icon: Atom },
  { id: "reasoning", label: "Reasoning", icon: Lightbulb },
  { id: "hypotheses", label: "Hypotheses", icon: GitBranch },
];

type TabId = "assumptions" | "deconstruct" | "reasoning" | "hypotheses";

export default function DisruptPage() {
  const [activeTab, setActiveTab] = useState<TabId>("assumptions");
  const [runTrigger, setRunTrigger] = useState(0);
  const [rawAnalysisLoading, setAnalysisLoading] = useState(false);
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();
  const { loadingTimedOut, forceCleared, clearTimeout: clearTimeoutState } = useAnalysisTimeout(rawAnalysisLoading, !!analysis.disruptData);
  // Sync: force-clear orphaned loading when data arrives or hard timeout fires
  const analysisLoading = rawAnalysisLoading && !analysis.disruptData && !forceCleared;

  const { selectedProduct: rawSelectedProduct, analysisId, products } = analysis;

  const autoAnalysis = useAutoAnalysis();

  // For business model analyses, create a synthetic product so child components don't crash
  const selectedProduct = rawSelectedProduct || (analysis.businessAnalysisData ? {
    id: analysisId || "business-model",
    name: (analysis.businessModelInput as any)?.type || "Business Model",
    category: "Business",
    image: "",
    revivalScore: 0,
    flippedIdeas: [],
  } as any : null);

  if (analysis.step !== "done" || (!selectedProduct && !analysis.businessAnalysisData)) {
    if (shouldRedirectHome) return null;
    if (analysis.step === "error") return <AnalysisPipelineErrorCard onRetry={analysis.retryAnalysis} />;
    return <AnalysisLoadingSpinner />;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const governedData = analysis.governedData;
  const synopsisData = governedData?.reasoning_synopsis ?? null;
  const hasDisruptData = !!analysis.disruptData;
  const isEarlyData = !!(analysis.disruptData as any)?._earlyInsights || !!(analysis.disruptData as any)?._thinDataFallback;
  const hasDisruptData = !!analysis.disruptData;
  const cm = governedData?.constraint_map as Record<string, unknown> | undefined;
  const rawHypotheses = (cm?.root_hypotheses || governedData?.root_hypotheses) as StrategicHypothesis[] | undefined;
  const hasHypotheses = hasDisruptData && rawHypotheses && rawHypotheses.length > 0;
  const hasSynopsis = hasDisruptData && !!synopsisData;
  const ranking = hasHypotheses ? rankWithProfile(rawHypotheses!, analysis.strategicProfile) : null;

  const gatedTabs: TabId[] = ["reasoning", "hypotheses"];
  const effectiveTab = !hasDisruptData && gatedTabs.includes(activeTab) ? "assumptions" : activeTab;

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
        analysisId={analysisId}
      />

      <AnalysisActionToolbar
        analysisTitle={selectedProduct?.name || (analysis.businessModelInput as any)?.type || "Business Analysis"}
        stepTitle="Strategic Intelligence"
        analysis={analysis}
        selectedProduct={selectedProduct}
        analysisId={analysisId}
        accentColor={theme.primary}
        isLoading={analysisLoading}
        hasData={hasDisruptData}
        onRun={() => { setRunTrigger(t => t + 1); setActiveTab("assumptions"); }}
        strategicProfile={analysis.strategicProfile}
        onChangeProfile={analysis.setStrategicProfile}
      />

      {/* ── Tab Navigation (shared component) ── */}
      <AnalysisTabBar
        tabs={TABS}
        activeTab={effectiveTab}
        onTabChange={(t) => setActiveTab(t as TabId)}
        accentColor={theme.primary}
        hiddenTabs={hiddenTabs}
        disabledTabs={disabledTabs}
      />


      {/* ── Loading Tracker with timeout escape ── */}
      {(analysisLoading && !hasDisruptData) && (
        <AnalysisLoadingCard>
          {loadingTimedOut ? (
            <AnalysisTimeoutEscape
              analysisId={analysisId}
              onRetry={() => { clearTimeoutState(); setRunTrigger(t => t + 1); }}
              backPath={`/analysis/${analysisId}/report`}
            />
          ) : (
            <StepLoadingTracker
              title="Building Structural Analysis"
              tasks={DISRUPT_TASKS}
              estimatedSeconds={120}
              accentColor="hsl(271 81% 55%)"
            />
          )}
        </AnalysisLoadingCard>
      )}

      {/* ── Tab Content ── */}
      <SplitStepLayout
        showVisual={hasDisruptData}
        visualOutput={
          <StepVisualOutput
            step="disrupt"
            intelligence={autoAnalysis.intelligence}
            governedData={governedData as Record<string, unknown> | null}
            product={selectedProduct as unknown as Record<string, unknown>}
            accentColor={theme.primary}
          />
        }
      >
      <div style={{ display: analysisLoading && !hasDisruptData ? "none" : undefined }} className="min-h-[400px]">
        {effectiveTab === "assumptions" && (
          <StructureTab
            selectedProduct={selectedProduct}
            analysis={analysis}
            governedData={governedData as Record<string, unknown> | null}
            synopsisData={synopsisData}
            rawHypotheses={hasHypotheses ? rawHypotheses! : null}
            hasDisruptData={hasDisruptData}
            hasSynopsis={!!hasSynopsis}
            hasHypotheses={!!hasHypotheses}
            ranking={ranking}
            products={products}
            runTrigger={runTrigger}
            onLoadingChange={setAnalysisLoading}
            viewMode="assumptions"
          />
        )}

        {effectiveTab === "deconstruct" && (
          <>
            {/* ── Flipped Ideas / Reinvention Ideas — TOP of Deconstruct tab ── */}
            {hasDisruptData && (() => {
              const disruptPayload = analysis.disruptData as Record<string, unknown> | null;
              const flippedLogic = (disruptPayload?.flippedLogic as any[]) || [];
              const productIdeas = selectedProduct?.flippedIdeas || [];

              // Derive ideas from deepenedOpportunities as additional fallback
              const deepenedOps = (autoAnalysis.deepenedOpportunities as any[]) || [];
              const derivedFromDeepened = deepenedOps.map((op: any, i: number) => ({
                id: `deepened-${i}`,
                name: op.reconfigurationLabel || op.summary?.slice(0, 80) || `Opportunity ${i + 1}`,
                description: op.summary || op.reconfigurationLabel || "",
                targetPrice: null,
                feasibility: op.feasibility?.level === "challenging" ? 0.5 : op.feasibility?.level === "achievable" ? 0.8 : 0.7,
                marketPotential: "medium" as const,
                constraints: [],
                reasoning: op.whyThisMatters?.ifNotSolved?.[0] || op.strategicBet?.industryAssumption || "",
              }));

              const effectiveIdeas = productIdeas.length > 0
                ? productIdeas
                : flippedLogic.length > 0
                  ? flippedLogic.map((fl: any, i: number) => ({
                      id: `derived-${i}`,
                      name: fl.boldAlternative || fl.alternative || `Idea ${i + 1}`,
                      description: fl.rationale || fl.description || "",
                      targetPrice: null,
                      feasibility: fl.leverageScore ? fl.leverageScore / 10 : 0.7,
                      marketPotential: "medium" as const,
                      constraints: fl.originalAssumption ? [fl.originalAssumption] : [],
                    }))
                  : derivedFromDeepened;

              if (effectiveIdeas.length === 0) return null;
              return (
                <AnalysisContentCard>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={15} style={{ color: "hsl(var(--primary))" }} />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                      Reinvention Ideas
                    </h3>
                  </div>
                  <FlippedIdeasPanel
                    flippedIdeas={effectiveIdeas}
                    onRegenerateIdeas={(ctx, rejected) => analysis.handleRegenerateIdeas(selectedProduct, ctx, rejected)}
                    generatingIdeas={analysis.generatingIdeasFor === selectedProduct?.id}
                    initialRejectedIdeas={analysis.rejectedIdeasPersisted}
                    onCompetitorsScouted={(comps) => {
                      const prev = analysis.scoutedCompetitors || [];
                      const merged = [...prev, ...(comps as any[])];
                      analysis.setScoutedCompetitors(merged);
                      analysis.saveStepData("scoutedCompetitors", merged);
                    }}
                  />
                  {/* Morphological Design Space Explorer — optional, user-triggered */}
                  <MorphologicalExplorerPanel
                    onVectorsSelected={(vectors) => {
                      analysis.saveStepData("morphologicalExploration", {
                        selectedVectors: vectors,
                        selectedAt: new Date().toISOString(),
                      });
                    }}
                  />
                </AnalysisContentCard>
              );
            })()}

            {/* ── Full structural analysis below ideas ── */}
            <StructureTab
              selectedProduct={selectedProduct}
              analysis={analysis}
              governedData={governedData as Record<string, unknown> | null}
              synopsisData={synopsisData}
              rawHypotheses={hasHypotheses ? rawHypotheses! : null}
              hasDisruptData={hasDisruptData}
              hasSynopsis={!!hasSynopsis}
              hasHypotheses={!!hasHypotheses}
              ranking={ranking}
              products={products}
              runTrigger={runTrigger}
              onLoadingChange={setAnalysisLoading}
              viewMode="deconstruct"
            />
          </>
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
                const currentGoverned = { ...(analysis.governedData || {}) } as Record<string, unknown>;
                let merged = currentGoverned;
                if (revision.type === "re_rank" && revision.payload?.hypotheses) {
                  merged = { ...currentGoverned, root_hypotheses: revision.payload.hypotheses };
                } else if (revision.type === "update_assumption" && revision.payload) {
                  const synopsis = (currentGoverned as any)?.reasoning_synopsis || {};
                  const updatedAssumptions = synopsis.key_assumptions?.map((a: any) =>
                    a.assumption === revision.payload.target ? { ...a, ...revision.payload.updates } : a
                  ) || [];
                  merged = {
                    ...currentGoverned,
                    reasoning_synopsis: { ...synopsis, key_assumptions: updatedAssumptions },
                  };
                }
                analysis.setGovernedData(merged);
                analysis.saveStepData("governed", merged);
                analysis.markStepOutdated("redesign");
                analysis.markStepOutdated("stressTest");
                analysis.markStepOutdated("pitchDeck");
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
                  const currentGoverned = { ...(analysis.governedData || {}) } as Record<string, unknown>;
                  if (revision.type === "new_hypothesis" && revision.payload) {
                    const existing = (currentGoverned as any)?.root_hypotheses || [];
                    const newH = { ...revision.payload, id: `user-hyp-${Date.now()}` };
                    const merged = { ...currentGoverned, root_hypotheses: [...existing, newH] };
                    analysis.setGovernedData(merged);
                    analysis.saveStepData("governed", merged);
                    analysis.markStepOutdated("redesign");
                    analysis.markStepOutdated("stressTest");
                    analysis.markStepOutdated("pitchDeck");
                  }
                }}
                onSelectBranch={(id: string) => {
                  const selected = rawHypotheses!.find((h: StrategicHypothesis) => h.id === id);
                  if (selected) {
                    // H5 fix: reset to base archetype profile BEFORE applying branch-specific
                    // drift. This prevents cumulative adaptation from switching between branches.
                    const baseProfile = { ...DEFAULT_PROFILES[analysis.strategicProfile.archetype] };
                    const signals: { selected_high_capital?: boolean; selected_high_risk?: boolean; selected_long_horizon?: boolean } = {};
                    if (selected.estimated_capital_required && selected.estimated_capital_required > 500_000) signals.selected_high_capital = true;
                    if (selected.constraint_type === "risk" || selected.fragility_score > 6) signals.selected_high_risk = true;
                    if (selected.estimated_time_to_impact_months && selected.estimated_time_to_impact_months > baseProfile.time_horizon_months) signals.selected_long_horizon = true;
                    if (Object.keys(signals).length > 0) {
                      const evolved = adaptStrategicProfile(baseProfile, signals);
                      analysis.setStrategicProfile(evolved);
                    } else {
                      analysis.setStrategicProfile(baseProfile);
                    }
                  }
                  analysis.setActiveBranchId(id);
                }}
              />
            </AnalysisContentCard>

          </div>
        )}

        {/* Innovation Opportunities — shown inside assumptions tab */}
        {effectiveTab === "assumptions" && analysis.disruptData && (
          <AnalysisContentCard>
            <InnovationOpportunitiesPanel
              governedData={governedData as Record<string, unknown> | null}
              analysisData={analysis.disruptData as Record<string, unknown> | null}
              stressTestData={analysis.stressTestData as Record<string, unknown> | null}
            />
          </AnalysisContentCard>
        )}
      </div>
      </SplitStepLayout>

      {/* Strategic Opportunities + Recommended Move — moved from Command Deck */}
      {hasDisruptData && (
        <div className="space-y-6">
          <OpportunityDirectionsGrid
            opportunities={(autoAnalysis as any).deepenedOpportunities?.slice(0, 3) || []}
            modeAccent={theme.primary}
          />
          {(() => {
            const modeEvidence: import("@/lib/evidenceEngine").EvidenceMode =
              analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product";
            const pbs = generatePlaybooks(autoAnalysis.flatEvidence, autoAnalysis.insights, autoAnalysis.narrative, modeEvidence);
            const topPb = pbs.length > 0 ? pbs[0] : null;
            return <RecommendedMoveCard playbook={topPb} modeAccent={theme.primary} />;
          })()}
        </div>
      )}

      {/* Pipeline Progress Bar */}
      <PipelineProgressBar
        completedSteps={autoAnalysis.completedSteps}
        outdatedSteps={analysis.outdatedSteps}
        currentStep="disrupt"
        accentColor={theme.primary}
      />

      <NextStepButton
        stepNumber={4}
        label="Redesign"
        color={theme.primary}
        onClick={() => { scrollToTop(); navigate(`${baseUrl}/redesign`); }}
      />
    </AnalysisPageShell>
  );
}
