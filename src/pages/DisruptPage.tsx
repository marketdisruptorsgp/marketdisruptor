import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { HeroSection } from "@/components/HeroSection";
import { StepNavigator } from "@/components/StepNavigator";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton, StepNavBar } from "@/components/SectionNav";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import { scrollToTop } from "@/utils/scrollToTop";
import { type StrategicHypothesis, rankWithProfile } from "@/lib/strategicOS";
import { Target, Layers, Wrench, FileDown, Save, RefreshCw, Atom, Lightbulb, GitBranch } from "lucide-react";
import { ModeBadge } from "@/components/ModeBadge";
import StrategicProfileSelector from "@/components/StrategicProfileSelector";
import { downloadReportAsPDF } from "@/lib/downloadReportPDF";
import { gatherAllAnalysisData } from "@/lib/gatherAnalysisData";
import { toast } from "sonner";
import { SignalTab } from "@/components/strategic/SignalTab";
import { StructureTab } from "@/components/strategic/StructureTab";
import { RedesignTab } from "@/components/strategic/RedesignTab";
import { StepLoadingTracker, DISRUPT_TASKS } from "@/components/StepLoadingTracker";
import { ReasoningSynopsis } from "@/components/ReasoningSynopsis";
import StructuralInterpretationsPanel from "@/components/StructuralInterpretationsPanel";
import { adaptStrategicProfile } from "@/lib/strategicOS";

const TABS = [
  { id: "structure" as const, label: "First Principles", icon: Atom },
  { id: "reasoning" as const, label: "Reasoning", icon: Lightbulb },
  { id: "hypotheses" as const, label: "Hypotheses", icon: GitBranch },
  { id: "signal" as const, label: "Signal", icon: Target },
  { id: "redesign" as const, label: "Redesign", icon: Wrench },
];

type TabId = typeof TABS[number]["id"];

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
    if (shouldRedirectHome) return null;
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-primary" /></div>;
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

  // If no disrupt data yet, default to First Principles tab; gate reasoning/hypotheses on data
  const gatedTabs: TabId[] = ["reasoning", "hypotheses", "signal", "redesign"];
  const effectiveTab = !hasDisruptData && gatedTabs.includes(activeTab) ? "structure" : activeTab;

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

        {/* Header: title + archetype + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="typo-section-title">Strategic Intelligence</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StrategicProfileSelector
              profile={analysis.strategicProfile}
              onChangeProfile={analysis.setStrategicProfile}
            />
            <button
              onClick={() => { setRunTrigger(t => t + 1); setActiveTab("structure"); }}
              disabled={analysisLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all"
              style={{
                background: analysisLoading ? "hsl(var(--primary) / 0.6)" : "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                opacity: analysisLoading ? 0.7 : 1,
              }}
            >
              {analysisLoading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {hasDisruptData ? "Re-run Analysis" : "Run Analysis"}
            </button>
            <button onClick={() => {
              if (!selectedProduct) return;
              const data = gatherAllAnalysisData(analysis);
              downloadReportAsPDF(selectedProduct, data, {
                title: selectedProduct.name,
                mode: (analysis.analysisParams as any)?.analysisType,
                onProgress: (msg) => toast.loading(msg, { id: "pdf-progress" }),
              }).then(() => { toast.dismiss("pdf-progress"); toast.success("PDF downloaded!"); })
                .catch(() => { toast.dismiss("pdf-progress"); toast.error("Failed to download PDF"); });
            }} className="flex items-center gap-1.5 px-3 py-1.5 rounded typo-button-secondary bg-background border border-border text-foreground">
              <FileDown size={12} /> PDF
            </button>
            <button onClick={() => analysis.handleManualSave()} className="flex items-center gap-1.5 px-3 py-1.5 rounded typo-button-secondary bg-primary text-primary-foreground">
              <Save size={12} /> Save
            </button>
            <ShareAnalysis analysisId={analysisId || ""} analysisTitle={selectedProduct.name} accentColor={theme.primary} />
          </div>
        </div>

        {/* ── 5-Tab Navigation ── */}
        <div className="sticky top-0 z-20 -mx-3 sm:-mx-6 px-3 sm:px-6 py-2" style={{ background: "hsl(var(--background))", borderBottom: "2px solid hsl(var(--border))" }}>
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = effectiveTab === tab.id;
              const isDisabled = !hasDisruptData && tab.id !== "structure";
              // Hide reasoning/hypotheses tabs if no data for them
              if (tab.id === "reasoning" && !hasSynopsis) return null;
              if (tab.id === "hypotheses" && !hasHypotheses) return null;
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
                  {tab.id === "hypotheses" && rawHypotheses && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold leading-none"
                      style={{
                        background: isActive ? "hsl(var(--background) / 0.2)" : "hsl(var(--primary) / 0.12)",
                        color: isActive ? "hsl(var(--background))" : "hsl(var(--primary))",
                      }}
                    >
                      {rawHypotheses.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Loading Tracker (front and center) ── */}
        {analysisLoading && (
          <div className="rounded-xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <StepLoadingTracker
              title="Building First Principles Analysis"
              tasks={DISRUPT_TASKS}
              estimatedSeconds={50}
              accentColor="hsl(271 81% 55%)"
            />
          </div>
        )}

        {/* ── Tab Content ── */}
        {!analysisLoading && (
          <div className="min-h-[400px]">
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
              <div className="rounded-xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
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
              </div>
            )}

            {effectiveTab === "hypotheses" && hasHypotheses && ranking && (
              <div className="rounded-xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
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
              </div>
            )}

            {effectiveTab === "signal" && (
              <SignalTab
                disruptData={analysis.disruptData as Record<string, unknown> | null}
                governedData={governedData as Record<string, unknown> | null}
                hypotheses={hasHypotheses ? rawHypotheses! : null}
                analysisType={(analysis.analysisParams as any)?.analysisType || "product"}
                lastUpdated={new Date().toISOString()}
              />
            )}

            {effectiveTab === "redesign" && (
              <RedesignTab
                disruptData={analysis.disruptData as Record<string, unknown> | null}
                hypotheses={hasHypotheses ? rawHypotheses! : null}
                governedData={governedData as Record<string, unknown> | null}
              />
            )}
          </div>
        )}

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
