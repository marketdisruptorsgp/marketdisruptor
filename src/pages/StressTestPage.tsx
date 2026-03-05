import React from "react";
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
import { Swords, XCircle, BarChart3 } from "lucide-react";

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

const STRESS_TABS: TabDef<"debate" | "validate">[] = [
  { id: "debate", label: "Red Team", icon: XCircle, color: "hsl(0 72% 48%)" },
  { id: "validate", label: "Validate & Score", icon: BarChart3 },
];

export default function StressTestPage() {
  const [runTrigger, setRunTrigger] = React.useState(0);
  const [analysisLoading, setAnalysisLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"debate" | "validate">("debate");
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();

  const { selectedProduct, analysisId } = analysis;

  if (analysis.step !== "done" || !selectedProduct) {
    return <AnalysisLoadingSpinner />;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isOutdated = analysis.outdatedSteps.has("stressTest");

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
        outdatedStepName={isOutdated ? "Stress Test" : undefined}
      />

      <AnalysisContextBanner
        icon={Swords}
        title="Stress Test"
        description="Red Team vs Green Team adversarial debate — your idea is attacked and defended to expose blind spots, validate strengths, and deliver a clear survival judgment."
        iconColor="hsl(350 80% 55%)"
      />

      <AnalysisActionToolbar
        analysisTitle={selectedProduct.name}
        stepTitle="Stress Test"
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

      {/* Tab buttons — only show after data loaded */}
      {analysis.stressTestData && !analysisLoading && (
        <AnalysisTabBar
          tabs={STRESS_TABS}
          activeTab={activeTab}
          onTabChange={(t) => setActiveTab(t as "debate" | "validate")}
          accentColor={theme.primary}
        />
      )}

      {analysis.stressTestData && !analysisLoading && <AnalysisDivider />}

      {/* Loading Tracker */}
      {analysisLoading && (
        <AnalysisLoadingCard>
          <StepLoadingTracker
            title="Running Stress Test"
            tasks={STRESS_TEST_TASKS}
            estimatedSeconds={30}
            accentColor="hsl(350 80% 55%)"
          />
        </AnalysisLoadingCard>
      )}

      {/* Content */}
      <div style={{ display: analysisLoading ? "none" : undefined }}>
        <AnalysisContentCard>
          <CriticalValidation
            product={selectedProduct}
            analysisData={selectedProduct}
            activeTab={activeTab}
            externalData={analysis.stressTestData}
            runTrigger={runTrigger}
            onLoadingChange={setAnalysisLoading}
            competitorIntel={analysis.scoutedCompetitors}
            onDataLoaded={(d) => {
              analysis.setStressTestData(d);
              analysis.saveStepData("stressTest", d);
              analysis.clearStepOutdated("stressTest");
              analysis.markStepOutdated("pitch");
            }}
          />
        </AnalysisContentCard>
      </div>

      <NextStepButton
        stepNumber={6}
        label="Pitch Deck"
        color={theme.primary}
        onClick={() => { scrollToTop(); navigate(`${baseUrl}/pitch`); }}
      />
    </AnalysisPageShell>
  );
}
