import React from "react";
import { InsightSnapshotPanel } from "@/components/analysis/InsightSnapshotPanel";
import { PipelineProgressBar } from "@/components/analysis/PipelineProgressBar";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { SplitStepLayout } from "@/components/analysis/SplitStepLayout";
import { StepVisualOutput } from "@/components/analysis/StepVisualOutput";
import { StepLoadingTracker, STRESS_TEST_TASKS } from "@/components/StepLoadingTracker";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { useAnalysisTimeout } from "@/hooks/useAnalysisTimeout";
import { AnalysisTimeoutEscape } from "@/components/analysis/AnalysisTimeoutEscape";
import { CriticalValidation } from "@/components/CriticalValidation";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton } from "@/components/SectionNav";
import { scrollToTop } from "@/utils/scrollToTop";
import { Swords, XCircle, BarChart3, Crosshair, LayoutDashboard, Boxes, X } from "lucide-react";
import { IndustryBenchmarkPanel } from "@/components/command-deck/IndustryBenchmarkPanel";
import { CompetitiveMoatRadar } from "@/components/command-deck/CompetitiveMoatRadar";
import { StrategicScenarioSimulator } from "@/components/command-deck/StrategicScenarioSimulator";
import { LensIntelligencePanel } from "@/components/LensIntelligencePanel";
import { computeBenchmarks } from "@/lib/benchmarkEngine";
import { generatePlaybooks } from "@/lib/playbookEngine";
import { extractAllEvidence } from "@/lib/evidenceEngine";
import { buildSystemIntelligence, type SystemIntelligenceInput } from "@/lib/systemIntelligence";
import { type LensType } from "@/lib/multiLensEngine";
import { StrategicCommandDeck } from "@/components/StrategicCommandDeck";
import { OpportunityMatrix } from "@/components/OpportunityMatrix";
import { ETAExecutionPanel } from "@/components/ETAExecutionPanel";
import { ETAAcquisitionScorecard } from "@/components/ETAAcquisitionScorecard";
import { InnovationOpportunitiesPanel } from "@/components/InnovationOpportunitiesPanel";

// ── Shared layout components ──
import {
  AnalysisPageShell,
  AnalysisStepHeader,
  AnalysisActionToolbar,
  AnalysisTabBar,
  AnalysisDivider,
  AnalysisContextBanner,
  AnalysisContentCard,
  AnalysisLoadingCard,
  AnalysisLoadingSpinner,
  AnalysisPipelineErrorCard,
  type TabDef,
} from "@/components/analysis/AnalysisPageShell";

const STRATEGY_TABS: TabDef<"opportunities" | "strategy" | "debate" | "validate">[] = [
  { id: "opportunities", label: "Opportunities", icon: Crosshair },
  { id: "strategy", label: "Strategy", icon: LayoutDashboard },
  { id: "debate", label: "Red Team", icon: XCircle, color: "hsl(0 72% 48%)" },
  { id: "validate", label: "Validate & Score", icon: BarChart3 },
];

type StrategyTabId = "opportunities" | "strategy" | "debate" | "validate";

export default function StressTestPage() {
  const [runTrigger, setRunTrigger] = React.useState(0);
  const [rawAnalysisLoading, setAnalysisLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<StrategyTabId>("opportunities");
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();
  const hasStressData = !!analysis.stressTestData || !!analysis.disruptData;
  const { loadingTimedOut, forceCleared, clearTimeout: clearTimeoutState } = useAnalysisTimeout(rawAnalysisLoading, hasStressData);
  const analysisLoading = rawAnalysisLoading && !hasStressData && !forceCleared;

  const { selectedProduct: rawSelectedProduct, analysisId } = analysis;

  const autoAnalysis = useAutoAnalysis();

  // Synthetic product for business model analyses
  const selectedProduct = rawSelectedProduct || (analysis.businessAnalysisData ? {
    id: analysisId || "business-model", name: (analysis.businessModelInput as any)?.type || "Business Model",
    category: "Business", image: "", revivalScore: null, flippedIdeas: [],
  } as any : null);

  if (analysis.step !== "done" || (!selectedProduct && !analysis.businessAnalysisData)) {
    if (shouldRedirectHome) return null;
    if (analysis.step === "error") return <AnalysisPipelineErrorCard onRetry={analysis.retryAnalysis} />;
    return <AnalysisLoadingSpinner />;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isOutdated = analysis.outdatedSteps.has("stressTest");

  // Build system intelligence for Opportunities & Strategy tabs
  const governedData = analysis.governedData as Record<string, unknown> | null;
  const disruptData = analysis.disruptData as Record<string, unknown> | null;
  const businessData = analysis.businessAnalysisData as Record<string, unknown> | null;
  const flipIdeas = (disruptData?.flippedIdeas || (selectedProduct as any)?.flippedIdeas || []) as unknown[];
  const activeModes = (analysis.adaptiveContext?.activeModes || [analysis.mainTab === "service" ? "service" : analysis.mainTab === "business" ? "business" : "product"]) as LensType[];

  const intelligenceInput: SystemIntelligenceInput | null = governedData ? {
    analysisId: analysisId || selectedProduct.id || "unknown",
    governedData,
    disruptData,
    businessAnalysisData: businessData,
    intelData: null,
    flipIdeas,
    activeLenses: activeModes.length > 1 ? activeModes : ["product", "service", "business"],
  } : null;

  const systemIntelligence = intelligenceInput ? buildSystemIntelligence(intelligenceInput) : null;

  return (
    <AnalysisPageShell tier={tier}>
      <AnalysisStepHeader
        steps={getStepConfigs(theme.primary)}
        activeStep={5}
        visitedSteps={new Set([2, 3, 4, 5])}
        onStepChange={(s) => {
          if (s === 2) navigate(`${baseUrl}/report`);
          else if (s === 3) navigate(`${baseUrl}/disrupt`);
          else if (s === 4) navigate(`${baseUrl}/redesign`);
          else if (s === 6) navigate(`${baseUrl}/pitch`);
        }}
        outdatedSteps={analysis.outdatedSteps}
        accentColor={theme.primary}
        backLabel="Redesign"
        backPath={`${baseUrl}/redesign`}
        outdatedStepName={isOutdated ? "Strategy Development" : undefined}
        analysisId={analysisId}
      />


      <AnalysisActionToolbar
        analysisTitle={selectedProduct?.name || (analysis.businessModelInput as any)?.type || "Business Analysis"}
        stepTitle="Strategy Development"
        analysis={analysis}
        selectedProduct={selectedProduct}
        analysisId={analysisId}
        accentColor={theme.primary}
        isLoading={analysisLoading}
        hasData={!!analysis.stressTestData}
        onRun={() => setRunTrigger(t => t + 1)}
        strategicProfile={analysis.strategicProfile}
        onChangeProfile={analysis.setStrategicProfile}
      />

      {/* Tab navigation — always visible */}
      {!analysisLoading && (
        <AnalysisTabBar
          tabs={STRATEGY_TABS}
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t as StrategyTabId)}
          accentColor={theme.primary}
        />
      )}

      {!analysisLoading && <AnalysisDivider />}

      {/* Concept Variants Context Banner */}
      {analysis.conceptVariantsForStressTest.length > 0 && !analysisLoading && (
        <div
          className="rounded-xl p-4 mx-1"
          style={{
            background: "hsl(185 70% 42% / 0.08)",
            border: "1.5px solid hsl(185 70% 42% / 0.2)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Boxes size={14} style={{ color: "hsl(185 70% 42%)" }} />
              <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(185 70% 42%)" }}>
                Concept Variants Under Review
              </p>
            </div>
            <button
              onClick={() => analysis.setConceptVariantsForStressTest([])}
              className="p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X size={12} className="text-muted-foreground" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.conceptVariantsForStressTest.map(cv => (
              <div
                key={cv.id}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
                style={{
                  background: "hsl(185 70% 42% / 0.12)",
                  border: "1px solid hsl(185 70% 42% / 0.25)",
                  color: "hsl(185 70% 42%)",
                }}
              >
                {cv.name}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            From opportunity: {analysis.conceptVariantsForStressTest[0]?.opportunityLabel}
          </p>
        </div>
      )}

      {/* Loading Tracker with timeout escape */}
      {analysisLoading && (
        <AnalysisLoadingCard>
          {loadingTimedOut ? (
            <AnalysisTimeoutEscape
              analysisId={analysisId}
              onRetry={() => { clearTimeoutState(); setRunTrigger(t => t + 1); }}
              backPath={`/analysis/${analysisId}/redesign`}
              backLabel="Back to Redesign"
            />
          ) : (
            <StepLoadingTracker
              title="Running Strategy Development"
              tasks={STRESS_TEST_TASKS}
              estimatedSeconds={30}
              accentColor="hsl(350 80% 55%)"
            />
          )}
        </AnalysisLoadingCard>
      )}

      {/* Split Layout: main content + visual sidebar */}
      <SplitStepLayout
        showVisual={!!systemIntelligence}
        visualOutput={
          <StepVisualOutput
            step="stress-test"
            intelligence={autoAnalysis.intelligence}
            governedData={governedData}
            product={selectedProduct as unknown as Record<string, unknown>}
            accentColor={theme.primary}
          />
        }
      >
        {/* ── Opportunities Tab ── */}
        {activeTab === "opportunities" && !analysisLoading && (
          <div className="space-y-3">
            <AnalysisContentCard>
              {systemIntelligence && systemIntelligence.scoredOpportunities.length > 0 && systemIntelligence.scoringSummary ? (
                <OpportunityMatrix
                  opportunities={systemIntelligence.scoredOpportunities}
                  summary={systemIntelligence.scoringSummary}
                  governanceReport={systemIntelligence.governanceReport || undefined}
                  expandedFriction={systemIntelligence.expandedFriction || undefined}
                />
              ) : (
                <div className="text-center py-12 space-y-2">
                  <Crosshair size={28} className="mx-auto text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">No opportunities scored yet</p>
                  <p className="text-xs text-muted-foreground">Run the Structural Analysis step first to generate opportunity data.</p>
                </div>
              )}
            </AnalysisContentCard>
            {/* Innovation Opportunities from friction/constraint analysis */}
            <AnalysisContentCard>
              <InnovationOpportunitiesPanel
                governedData={governedData}
                analysisData={disruptData}
                stressTestData={analysis.stressTestData as Record<string, unknown> | null}
              />
            </AnalysisContentCard>
          </div>
        )}

        {/* ── Strategy Tab ── */}
        {activeTab === "strategy" && !analysisLoading && (
          <div className="space-y-3">
            {systemIntelligence ? (
              <>
                <AnalysisContentCard>
                  <StrategicCommandDeck
                    commandDeck={systemIntelligence.commandDeck}
                    convergenceCount={systemIntelligence.convergenceZones.length}
                    expandedFriction={systemIntelligence.expandedFriction}
                    provenanceRegistry={systemIntelligence.provenanceRegistry}
                    convergenceZoneDetails={systemIntelligence.convergenceZoneDetails}
                  />
                </AnalysisContentCard>
                {/* Only show ETA panels when biExtraction (deal/CIM data) is present */}
                {((analysis as any)?.biExtraction ?? (analysis as any)?.adaptiveContext?.biExtraction) && (
                  <>
                    <AnalysisContentCard>
                      <ETAExecutionPanel
                        commandDeck={systemIntelligence.commandDeck}
                        expandedFriction={systemIntelligence.expandedFriction}
                        governedData={governedData}
                      />
                    </AnalysisContentCard>
                    <AnalysisContentCard>
                      <ETAAcquisitionScorecard
                        governedData={governedData}
                        biExtraction={(analysis as any)?.biExtraction ?? (analysis as any)?.adaptiveContext?.biExtraction ?? null}
                      />
                    </AnalysisContentCard>
                  </>
                )}
              </>
            ) : (
              <AnalysisContentCard>
                <div className="text-center py-12 space-y-2">
                  <LayoutDashboard size={28} className="mx-auto text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">No strategic intelligence yet</p>
                  <p className="text-xs text-muted-foreground">Run the Structural Analysis step first.</p>
                </div>
              </AnalysisContentCard>
            )}
          </div>
        )}

        {/* ── Red Team / Validate Tabs (original stress test content) ── */}
        {(activeTab === "debate" || activeTab === "validate") && (
          <div style={{ display: analysisLoading ? "none" : undefined }}>
            <AnalysisContentCard>
              <CriticalValidation
                product={selectedProduct}
                analysisData={selectedProduct}
                activeTab={activeTab === "debate" ? "debate" : "validate"}
                externalData={analysis.stressTestData}
                runTrigger={runTrigger}
                onLoadingChange={setAnalysisLoading}
                competitorIntel={analysis.scoutedCompetitors}
                conceptVariants={analysis.conceptVariantsForStressTest.length > 0 ? analysis.conceptVariantsForStressTest : undefined}
                onDataLoaded={(d) => {
                  analysis.setStressTestData(d);
                  analysis.saveStepData("stressTest", d);
                  analysis.clearStepOutdated("stressTest");
                  analysis.markStepOutdated("pitchDeck");
                }}
              />
            </AnalysisContentCard>
          </div>
        )}
      </SplitStepLayout>

      {/* Benchmark + Moat + Simulator + Lens Intelligence — moved from Command Deck */}
      <div className="space-y-6 mt-6">
        {(() => {
          const biExt = (analysis as any)?.biExtraction ?? (analysis as any)?.adaptiveContext?.biExtraction ?? null;
          const flatEv = autoAnalysis.flatEvidence || [];
          const narr = autoAnalysis.narrative || null;
          const modeEv: import("@/lib/evidenceEngine").EvidenceMode =
            analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product";
          const pbs = generatePlaybooks(flatEv, autoAnalysis.insights, narr, modeEv);
          const topPb = pbs.length > 0 ? pbs[0] : null;
          const bm = computeBenchmarks(flatEv, narr, topPb, biExt);
          return <IndustryBenchmarkPanel benchmark={bm} />;
        })()}
        <CompetitiveMoatRadar
          governedData={governedData as Record<string, any> | null}
          narrative={autoAnalysis.narrative}
          modeAccent={theme.primary}
        />
        <StrategicScenarioSimulator
          evidence={autoAnalysis.flatEvidence || []}
          narrative={autoAnalysis.narrative}
        />
        <LensIntelligencePanel
          analysisMode={analysis.activeMode || "product"}
          signalKeywords={[]}
          analysisId={analysisId || ""}
          recommendedToolIds={[]}
          onScenarioSaved={() => {}}
        />
      </div>

      <PipelineProgressBar
        completedSteps={autoAnalysis.completedSteps}
        outdatedSteps={analysis.outdatedSteps}
        currentStep="stress-test"
        accentColor={theme.primary}
      />

      <NextStepButton
        stepNumber={6}
        label="Pitch Deck"
        color={theme.primary}
        onClick={() => { scrollToTop(); navigate(`${baseUrl}/pitch`); }}
      />
    </AnalysisPageShell>
  );
}
