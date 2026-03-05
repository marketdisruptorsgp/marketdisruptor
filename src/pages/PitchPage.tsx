import React from "react";
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

  if (analysis.step !== "done" || !selectedProduct) {
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
      />

      <AnalysisActionToolbar
        analysisTitle={selectedProduct.name}
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
    </AnalysisPageShell>
  );
}
