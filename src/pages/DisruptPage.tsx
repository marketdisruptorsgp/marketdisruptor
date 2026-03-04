import React, { useState } from "react";
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
import { Brain, GitBranch, ChevronRight } from "lucide-react";
import { ModeBadge } from "@/components/ModeBadge";

export default function DisruptPage() {
  const [activeTab, setActiveTab] = useState<"reasoning" | "hypotheses">("reasoning");
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();

  const { selectedProduct, analysisId, products } = analysis;

  const [ready, setReady] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setReady(true), 1200); return () => clearTimeout(t); }, []);

  const shouldRedirectHome = ready && !analysis.isHydrating && analysis.step === "idle";
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
        <ModeBadge />
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

        {/* ActiveHypothesisBanner hidden on Disrupt — shown on Redesign and downstream */}

        <ModeHeader
          stepNumber={3}
          stepTitle="Disrupt"
          subtitle={`Deconstructing <strong class="text-foreground">${selectedProduct.name}</strong>`}
          accentColor={theme.primary}
          explainerKey="step-disrupt"
        />

        {/* ── First Principles Analysis ── */}
        <div className="rounded overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <FirstPrinciplesAnalysis
            product={selectedProduct}
            onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)}
            flippedIdeas={selectedProduct.flippedIdeas}
            onRegenerateIdeas={(ctx) => analysis.handleRegenerateIdeas(selectedProduct, ctx)}
            generatingIdeas={analysis.generatingIdeasFor === selectedProduct.id}
            externalData={analysis.disruptData}
            onAnalysisStarted={() => {
              // Clear stale governed data so reasoning/hypotheses tabs hide during regeneration
              analysis.setGovernedData(null);
            }}
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

        {/* ── Tabbed Reasoning / Hypotheses workspace (appears after analysis runs) ── */}
        {(() => {
          const cm = governedData?.constraint_map as Record<string, unknown> | undefined;
          const rawHypotheses = (cm?.root_hypotheses || governedData?.root_hypotheses) as StrategicHypothesis[] | undefined;
          const hasHypotheses = rawHypotheses && rawHypotheses.length > 0;
          const hasSynopsis = !!synopsisData;

          if (!hasSynopsis && !hasHypotheses) return null;

          const ranking = hasHypotheses ? rankWithProfile(rawHypotheses!, analysis.strategicProfile) : null;

          return (
            <div className="space-y-0">
              <h2 className="text-lg font-bold text-foreground mb-2">Review the AI's Strategic Reasoning</h2>

              {/* Tab buttons */}
              <div className="flex gap-0 border-b-2 border-border">
                {hasSynopsis && (
                  <button
                    onClick={() => setActiveTab("reasoning")}
                    className="relative flex items-center gap-2 px-5 py-3.5 font-bold text-sm transition-all rounded-t-xl"
                    style={{
                      background: activeTab === "reasoning" ? "hsl(var(--card))" : "transparent",
                      color: activeTab === "reasoning" ? theme.primary : "hsl(var(--muted-foreground))",
                      borderBottom: activeTab === "reasoning" ? `3px solid ${theme.primary}` : "3px solid transparent",
                      marginBottom: "-2px",
                    }}
                  >
                    <Brain size={16} />
                    Reasoning
                    {activeTab !== "reasoning" && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                        Explore
                      </span>
                    )}
                  </button>
                )}
                {hasHypotheses && (
                  <button
                    onClick={() => setActiveTab("hypotheses")}
                    className="relative flex items-center gap-2 px-5 py-3.5 font-bold text-sm transition-all rounded-t-xl"
                    style={{
                      background: activeTab === "hypotheses" ? "hsl(var(--card))" : "transparent",
                      color: activeTab === "hypotheses" ? theme.primary : "hsl(var(--muted-foreground))",
                      borderBottom: activeTab === "hypotheses" ? `3px solid ${theme.primary}` : "3px solid transparent",
                      marginBottom: "-2px",
                    }}
                  >
                    <GitBranch size={16} />
                    Hypotheses
                    {activeTab !== "hypotheses" && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                        {rawHypotheses!.length}
                      </span>
                    )}
                  </button>
                )}
              </div>

              <div className="rounded-b-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderTop: "none" }}>
                <div className="px-4 sm:px-6 pt-4 pb-2">
                  {activeTab === "reasoning" && hasSynopsis && (
                    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: `${theme.primary}08`, border: `1px solid ${theme.primary}20` }}>
                      <Brain size={18} className="flex-shrink-0 mt-0.5" style={{ color: theme.primary }} />
                      <div>
                        <p className="text-sm font-bold text-foreground">How we reached this conclusion</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Review the AI's reasoning chain, challenge assumptions you disagree with, and interrogate any logic that seems off.
                        </p>
                        <div className="flex items-center gap-1 mt-1.5 text-xs font-semibold" style={{ color: theme.primary }}>
                          <ChevronRight size={12} /> Click "Challenge This Reasoning" to push back on any point
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === "hypotheses" && hasHypotheses && (
                    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: `${theme.primary}08`, border: `1px solid ${theme.primary}20` }}>
                      <GitBranch size={18} className="flex-shrink-0 mt-0.5" style={{ color: theme.primary }} />
                      <div>
                        <p className="text-sm font-bold text-foreground">Strategic paths you can explore</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Each hypothesis is a different strategic interpretation. Select one to focus all downstream steps (Redesign, Stress Test, Pitch) on that specific path.
                        </p>
                        <div className="flex items-center gap-1 mt-1.5 text-xs font-semibold" style={{ color: theme.primary }}>
                          <ChevronRight size={12} /> Pick a hypothesis to lock in a strategic direction
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-6 pt-2">
                  {activeTab === "reasoning" && hasSynopsis && (
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
                  )}

                  {activeTab === "hypotheses" && hasHypotheses && ranking && (
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
                        const selected = rawHypotheses!.find(h => h.id === id);
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
                  )}
                </div>
              </div>
            </div>
          );
        })()}

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
