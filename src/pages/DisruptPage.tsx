import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { HeroSection } from "@/components/HeroSection";
import { StepNavigator } from "@/components/StepNavigator";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { ReasoningSynopsis } from "@/components/ReasoningSynopsis";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton, StepNavBar } from "@/components/SectionNav";
import { KeyTakeawayBanner, getDisruptTakeaway } from "@/components/KeyTakeawayBanner";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import { ModeHeader } from "@/components/ModeHeader";
import { ActiveHypothesisBanner } from "@/components/ActiveHypothesisBanner";
import { scrollToTop } from "@/utils/scrollToTop";
import StructuralInterpretationsPanel from "@/components/StructuralInterpretationsPanel";
import { type StrategicHypothesis, rankWithProfile, adaptStrategicProfile } from "@/lib/strategicOS";

export default function DisruptPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();

  const { selectedProduct, analysisId, products } = analysis;

  const [ready, setReady] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setReady(true), 1200); return () => clearTimeout(t); }, []);

  const shouldRedirectHome = ready && analysis.step === "idle";
  React.useEffect(() => {
    if (shouldRedirectHome) {
      navigate("/", { replace: true });
    }
  }, [shouldRedirectHome, navigate]);

  if (analysis.step !== "done" || !selectedProduct) {
    if (shouldRedirectHome) return null;
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-primary" /></div>;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const governedData = analysis.governedData;
  const synopsisData = governedData?.reasoning_synopsis ?? null;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        <StepNavigator
          steps={getStepConfigs(theme.primary)}
          activeStep={3}
          visitedSteps={new Set([2, 3])}
          onStepChange={(s) => {
            scrollToTop();
            if (s === 2) navigate(`${baseUrl}/report`);
            else if (s === 4) navigate(`${baseUrl}/redesign`);
            else if (s === 5) navigate(`${baseUrl}/stress-test`);
            else if (s === 6) navigate(`${baseUrl}/pitch`);
          }}
          outdatedSteps={analysis.outdatedSteps}
          accentColor={theme.primary}
        />

        <StepNavBar backLabel="Intelligence Report" backPath={`${baseUrl}/report`} accentColor={theme.primary} />
        <div className="flex justify-end"><ShareAnalysis analysisId={analysisId || ""} analysisTitle={selectedProduct.name} accentColor={theme.primary} /></div>

        {(() => {
          const takeaway = getDisruptTakeaway(analysis.disruptData as Record<string, unknown> | null);
          return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor={theme.primary} /> : null;
        })()}

        <ActiveHypothesisBanner stepName="Disrupt" accentColor={theme.primary} />

        <ModeHeader
          stepNumber={3}
          stepTitle="Disrupt"
          subtitle={`Deconstructing <strong class="text-foreground">${selectedProduct.name}</strong>`}
          accentColor={theme.primary}
          explainerKey="step-disrupt"
        />

        {/* ── Reasoning Synopsis — interactive decision workspace ── */}
        {synopsisData && (
          <div className="rounded overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <ReasoningSynopsis
              data={synopsisData}
              analysisData={{ ...selectedProduct, governed: governedData } as any}
              products={undefined}
              title={selectedProduct?.name || ""}
              category={analysis.analysisParams?.category || ""}
              analysisType={(analysis.analysisParams as any)?.analysisType || (analysis.analysisParams as any)?.analysis_type || "product"}
              avgScore={(selectedProduct as any)?.revivalScore ?? null}
              analysisId={analysisId}
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
          </div>
        )}

        {/* ── Structural Hypotheses Panel ── */}
        {(() => {
          const cm = governedData?.constraint_map as Record<string, unknown> | undefined;
          const rawHypotheses = (cm?.root_hypotheses || governedData?.root_hypotheses) as StrategicHypothesis[] | undefined;
          if (!rawHypotheses || rawHypotheses.length === 0) return null;
          const ranking = rankWithProfile(rawHypotheses, analysis.strategicProfile);
          return (
            <div className="rounded overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <StructuralInterpretationsPanel
                ranking={ranking}
                activeBranchId={analysis.activeBranchId}
                analysisData={{ ...selectedProduct, governed: analysis.governedData }}
                title={selectedProduct?.name || ""}
                category={analysis.analysisParams?.category || ""}
                onApplyRevision={(revision) => {
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
                onSelectBranch={(id) => {
                  const selected = rawHypotheses.find(h => h.id === id);
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
            </div>
          );
        })()}

        {/* ── First Principles Analysis ── */}
        <div className="rounded overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <FirstPrinciplesAnalysis
            product={selectedProduct}
            onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)}
            flippedIdeas={selectedProduct.flippedIdeas}
            onRegenerateIdeas={(ctx) => analysis.handleRegenerateIdeas(selectedProduct, ctx)}
            generatingIdeas={analysis.generatingIdeasFor === selectedProduct.id}
            externalData={analysis.disruptData}
            onDataLoaded={(d) => {
              analysis.setDisruptData(d);
              analysis.saveStepData("disrupt", d);
              analysis.markStepOutdated("redesign");
              analysis.markStepOutdated("stressTest");
              analysis.markStepOutdated("pitch");
            }}
            onPatentSave={(patentData) => {
              const updated = products.map(p =>
                p.id === selectedProduct.id ? { ...p, patentData } : p
              );
              analysis.setProducts(updated);
              analysis.setSelectedProduct({ ...selectedProduct, patentData });
              if (analysis.analysisParams) analysis.saveAnalysis(updated, analysis.analysisParams);
            }}
            userScores={analysis.userScores}
            onScoreChange={(ideaId, scoreKey, value) => {
              analysis.setUserScore(ideaId, scoreKey, value);
              analysis.saveStepData("userScores", {
                ...analysis.userScores,
                [ideaId]: { ...(analysis.userScores[ideaId] || {}), [scoreKey]: value },
              });
            }}
          />
        </div>

        <NextStepButton
          stepNumber={4}
          label="Redesign"
          color={theme.primary}
          onClick={() => { scrollToTop(); navigate(`${baseUrl}/redesign`); }}
        />
      </main>
    </div>
  );
}
