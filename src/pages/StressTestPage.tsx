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
import { CriticalValidation } from "@/components/CriticalValidation";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton } from "@/components/SectionNav";
import { scrollToTop } from "@/utils/scrollToTop";
import { Swords, XCircle, BarChart3, Crosshair, LayoutDashboard, Boxes, X } from "lucide-react";
import { buildSystemIntelligence, type SystemIntelligenceInput } from "@/lib/systemIntelligence";
import { type LensType } from "@/lib/multiLensEngine";
import { StrategicCommandDeck } from "@/components/StrategicCommandDeck";
import { OpportunityMatrix } from "@/components/OpportunityMatrix";
import { ETAExecutionPanel } from "@/components/ETAExecutionPanel";

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
  const [analysisLoading, setAnalysisLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<StrategyTabId>("opportunities");
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();

  const { selectedProduct: rawSelectedProduct, analysisId } = analysis;

  const autoAnalysis = useAutoAnalysis();

  // Synthetic product for business model analyses
  const selectedProduct = rawSelectedProduct || (analysis.businessAnalysisData ? {
    id: analysisId || "business-model", name: (analysis.businessModelInput as any)?.type || "Business Model",
    category: "Business", image: "", revivalScore: 0, flippedIdeas: [],
  } as any : null);

  if (analysis.step !== "done" || (!selectedProduct && !analysis.businessAnalysisData)) {
    if (shouldRedirectHome) return null;
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
    analysisId: selectedProduct.id || "unknown",
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


      {/* Loading Tracker */}
      {analysisLoading && (
        <AnalysisLoadingCard>
          <StepLoadingTracker
            title="Running Strategy Development"
            tasks={STRESS_TEST_TASKS}
            estimatedSeconds={30}
            accentColor="hsl(350 80% 55%)"
          />
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
                <AnalysisContentCard>
                  <ETAExecutionPanel
                    commandDeck={systemIntelligence.commandDeck}
                    expandedFriction={systemIntelligence.expandedFriction}
                    governedData={governedData}
                  />
                </AnalysisContentCard>
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
