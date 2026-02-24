import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { StepNavigator } from "@/components/StepNavigator";
import { PitchDeck } from "@/components/PitchDeck";
import { getStepConfigs } from "@/lib/stepConfigs";
import { StepNavBar } from "@/components/SectionNav";
import { KeyTakeawayBanner, getPitchTakeaway } from "@/components/KeyTakeawayBanner";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import { OutdatedBanner } from "@/components/OutdatedBanner";
import { ModeHeader } from "@/components/ModeHeader";
import { scrollToTop } from "@/utils/scrollToTop";

export default function PitchPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();

  const { selectedProduct, analysisId } = analysis;

  if (analysis.step !== "done" || !selectedProduct) {
    navigate("/", { replace: true });
    return null;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isOutdated = analysis.outdatedSteps.has("pitch");

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        <StepNavigator
          steps={getStepConfigs(theme.primary)}
          activeStep={6}
          visitedSteps={new Set([2, 3, 4, 5, 6])}
          onStepChange={(s) => {
            scrollToTop();
            if (s === 2) navigate(`${baseUrl}/report`);
            else if (s === 3) navigate(`${baseUrl}/disrupt`);
            else if (s === 4) navigate(`${baseUrl}/redesign`);
            else if (s === 5) navigate(`${baseUrl}/stress-test`);
          }}
          outdatedSteps={analysis.outdatedSteps}
        />

        <StepNavBar backLabel="Stress Test" backPath={`${baseUrl}/stress-test`} accentColor={theme.primary} />
        <div className="flex justify-end"><ShareAnalysis analysisId={analysisId || ""} analysisTitle={selectedProduct.name} accentColor={theme.primary} /></div>

        {isOutdated && <OutdatedBanner stepName="Pitch Deck" accentColor={theme.primary} />}
        {!isOutdated && (() => {
          const takeaway = getPitchTakeaway(analysis.pitchDeckData as Record<string, unknown> | null);
          return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor={theme.primary} /> : null;
        })()}

        <ModeHeader
          stepNumber={6}
          stepTitle="Investor Pitch Deck"
          subtitle={`Professional pitch deck for <strong class="text-foreground">${selectedProduct.name}</strong>`}
          accentColor={theme.primary}
        />

        <div className="rounded overflow-hidden p-3 sm:p-5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <PitchDeck
            product={selectedProduct}
            analysisId={analysisId}
            externalData={analysis.pitchDeckData}
            disruptData={analysis.disruptData}
            stressTestData={analysis.stressTestData}
            redesignData={analysis.redesignData}
            userScores={analysis.userScores}
            onSave={(d) => {
              analysis.setPitchDeckData(d);
              analysis.saveStepData("pitchDeck", d);
              analysis.clearStepOutdated("pitch");
            }}
          />
        </div>
      </main>
    </div>
  );
}
