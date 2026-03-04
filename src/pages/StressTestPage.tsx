import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { HeroSection } from "@/components/HeroSection";
import { StepNavigator } from "@/components/StepNavigator";
import { CriticalValidation } from "@/components/CriticalValidation";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton, StepNavBar } from "@/components/SectionNav";
import { KeyTakeawayBanner, getStressTestTakeaway } from "@/components/KeyTakeawayBanner";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import { OutdatedBanner } from "@/components/OutdatedBanner";
import { ModeHeader } from "@/components/ModeHeader";
import { ActiveHypothesisBanner } from "@/components/ActiveHypothesisBanner";
import { scrollToTop } from "@/utils/scrollToTop";
import { ModeBadge } from "@/components/ModeBadge";

export default function StressTestPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();

  const { selectedProduct, analysisId } = analysis;

  if (analysis.step !== "done" || !selectedProduct) {
    if (shouldRedirectHome) return null;
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-primary" /></div>;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isOutdated = analysis.outdatedSteps.has("stressTest");

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        <ModeBadge />
        <StepNavigator
          steps={getStepConfigs(theme.primary)}
          activeStep={5}
          visitedSteps={new Set([2, 3, 4, 5])}
          onStepChange={(s) => {
            scrollToTop();
            if (s === 2) navigate(`${baseUrl}/report`);
            else if (s === 3) navigate(`${baseUrl}/disrupt`);
            else if (s === 4) navigate(`${baseUrl}/redesign`);
            else if (s === 6) navigate(`${baseUrl}/pitch`);
          }}
          outdatedSteps={analysis.outdatedSteps}
          accentColor={theme.primary}
        />

        <StepNavBar backLabel="Redesign" backPath={`${baseUrl}/redesign`} accentColor={theme.primary} />
        <div className="flex justify-end"><ShareAnalysis analysisId={analysisId || ""} analysisTitle={selectedProduct.name} accentColor={theme.primary} /></div>

        {isOutdated && <OutdatedBanner stepName="Stress Test" accentColor={theme.primary} />}
        {!isOutdated && (() => {
          const takeaway = getStressTestTakeaway(analysis.stressTestData as Record<string, unknown> | null);
          return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor={theme.primary} /> : null;
        })()}

        <ActiveHypothesisBanner stepName="Stress Test" accentColor={theme.primary} />

        <ModeHeader
          stepNumber={5}
          stepTitle="Stress Test"
          subtitle={`Red vs Green validation for <strong class="text-foreground">${selectedProduct.name}</strong>`}
          accentColor={theme.primary}
          explainerKey="step-stress-test"
        />

        {/* Single view — no tabs */}
        <div className="rounded overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <CriticalValidation
            product={selectedProduct}
            analysisData={selectedProduct}
            activeTab="debate"
            externalData={analysis.stressTestData}
            onDataLoaded={(d) => {
              analysis.setStressTestData(d);
              analysis.saveStepData("stressTest", d);
              analysis.clearStepOutdated("stressTest");
              analysis.markStepOutdated("pitch");
            }}
          />
        </div>

        {/* No gating */}
        <NextStepButton
          stepNumber={6}
          label="Pitch Deck"
          color={theme.primary}
          onClick={() => { scrollToTop(); navigate(`${baseUrl}/pitch`); }}
        />
      </main>
    </div>
  );
}
