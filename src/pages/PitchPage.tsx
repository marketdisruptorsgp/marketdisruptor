import React from "react";
import { InsightSnapshotPanel } from "@/components/analysis/InsightSnapshotPanel";
import { PipelineProgressBar } from "@/components/analysis/PipelineProgressBar";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { PitchDeck } from "@/components/PitchDeck";
import { getStepConfigs } from "@/lib/stepConfigs";
import { StepNavBar } from "@/components/SectionNav";
import { scrollToTop } from "@/utils/scrollToTop";

// ── Shared layout components ──
import {
  AnalysisPageShell,
  AnalysisStepHeader,
  AnalysisActionToolbar,
  AnalysisLoadingSpinner,
} from "@/components/analysis/AnalysisPageShell";

export default function PitchPage() {
  const [runTrigger, setRunTrigger] = React.useState(0);
  const [analysisLoading, setAnalysisLoading] = React.useState(false);
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();

  const { selectedProduct, analysisId } = analysis;

  const autoAnalysis = useAutoAnalysis();

  if (analysis.step !== "done" || (!selectedProduct && !analysis.businessAnalysisData)) {
    if (shouldRedirectHome) return null;
    return <AnalysisLoadingSpinner />;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isOutdated = analysis.outdatedSteps.has("pitch");

  return (
    <AnalysisPageShell tier={tier}>
      <AnalysisStepHeader
        steps={getStepConfigs(theme.primary)}
        activeStep={6}
        visitedSteps={new Set([2, 3, 4, 5, 6])}
        onStepChange={(s) => {
          if (s === 2) navigate(`${baseUrl}/report`);
          else if (s === 3) navigate(`${baseUrl}/disrupt`);
          else if (s === 4) navigate(`${baseUrl}/redesign`);
          else if (s === 5) navigate(`${baseUrl}/stress-test`);
        }}
        outdatedSteps={analysis.outdatedSteps}
        accentColor={theme.primary}
        backLabel="Stress Test"
        backPath={`${baseUrl}/stress-test`}
        outdatedStepName={isOutdated ? "Pitch Deck" : undefined}
        analysisId={analysisId}
      />

      <AnalysisActionToolbar
        analysisTitle={selectedProduct?.name || (analysis.businessModelInput as any)?.type || "Business Analysis"}
        stepTitle="Pitch Deck"
        analysis={analysis}
        selectedProduct={selectedProduct}
        analysisId={analysisId}
        accentColor={theme.primary}
        isLoading={analysisLoading}
        hasData={!!analysis.pitchDeckData}
        onRun={() => setRunTrigger(t => t + 1)}
        strategicProfile={analysis.strategicProfile}
        onChangeProfile={analysis.setStrategicProfile}
      />

      {/* Insight Snapshot Panel */}
      <InsightSnapshotPanel
        intelligence={autoAnalysis.intelligence}
        graph={autoAnalysis.graph}
        analysisId={analysisId || ""}
        accentColor={theme.primary}
        completedSteps={autoAnalysis.completedSteps}
        products={analysis.products}
        selectedProduct={selectedProduct}
        disruptData={analysis.disruptData}
        redesignData={analysis.redesignData}
        stressTestData={analysis.stressTestData}
        pitchDeckData={analysis.pitchDeckData}
        governedData={analysis.governedData as Record<string, unknown> | null}
        businessAnalysisData={analysis.businessAnalysisData}
      />

      {/* Content — always mounted so loading lifecycle completes */}
      <PitchDeck
        product={selectedProduct}
        analysisId={analysisId}
        externalData={analysis.pitchDeckData}
        disruptData={analysis.disruptData}
        stressTestData={analysis.stressTestData}
        redesignData={analysis.redesignData}
        userScores={analysis.userScores}
        accentColor={theme.primary}
        insightPreferences={analysis.insightPreferences}
        steeringText={analysis.steeringText}
        runTrigger={runTrigger}
        onLoadingChange={setAnalysisLoading}
        onSave={(d) => {
          analysis.setPitchDeckData(d);
          analysis.saveStepData("pitchDeck", d);
          analysis.clearStepOutdated("pitch");
        }}
      />

      {/* Pipeline Progress Bar */}
      <PipelineProgressBar
        completedSteps={autoAnalysis.completedSteps}
        outdatedSteps={analysis.outdatedSteps}
        currentStep="pitch"
        accentColor={theme.primary}
      />
    </AnalysisPageShell>
  );
}
