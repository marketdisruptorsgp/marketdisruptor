import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { HeroSection } from "@/components/HeroSection";
import { StepNavigator } from "@/components/StepNavigator";
import { CriticalValidation } from "@/components/CriticalValidation";
import { Swords, CheckCircle2 } from "lucide-react";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton, StepNavBar } from "@/components/SectionNav";
import { SectionWorkflowNav } from "@/components/SectionNav";
import { KeyTakeawayBanner, getStressTestTakeaway } from "@/components/KeyTakeawayBanner";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import { OutdatedBanner } from "@/components/OutdatedBanner";
import { ModeHeader } from "@/components/ModeHeader";
import { LensToggle } from "@/components/LensToggle";
import { scrollToTop } from "@/utils/scrollToTop";
import { usePersistedSections } from "@/hooks/usePersistedSections";

const STRESS_TEST_DESCRIPTIONS: Record<string, string> = {
  debate: "Red Team attacks vs Green Team defenses",
  validate: "Feasibility checklist & confidence scores",
};

export default function StressTestPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();

  const { selectedProduct, analysisId } = analysis;

  if (analysis.step !== "done" || !selectedProduct) {
    navigate("/", { replace: true });
    return null;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isOutdated = analysis.outdatedSteps.has("stressTest");

  const { visited: persistedVisited, markVisited } = usePersistedSections(analysisId, "stress-test", ["debate"]);
  const mergedVisited = new Set([...analysis.visitedStressTestTabs, ...persistedVisited]);
  const allTabsVisited = mergedVisited.has("debate") && mergedVisited.has("validate");

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
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

        <ModeHeader
          stepNumber={5}
          stepTitle="Stress Test"
          subtitle={`Red Team vs Green Team critical validation for <strong class="text-foreground">${selectedProduct.name}</strong>`}
          accentColor={theme.primary}
          explainerKey="step-stress-test"
          actions={<LensToggle />}
        />

        <div className="rounded overflow-hidden p-4 sm:p-6 space-y-4 sm:space-y-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <SectionWorkflowNav
            tabs={[
              { id: "debate" as const, label: "Red vs Green Debate", icon: Swords },
              { id: "validate" as const, label: "Validate & Score", icon: CheckCircle2 },
            ]}
            activeId={analysis.stressTestTab}
            visitedIds={mergedVisited}
            onSelect={(id) => {
              analysis.setStressTestTab(id);
              analysis.setVisitedStressTestTabs(new Set([...mergedVisited, id]));
              markVisited(id);
            }}
            descriptions={STRESS_TEST_DESCRIPTIONS}
            journeyLabel="Stress Test Journey"
            accentColor={theme.primary}
            explainerKeys={{ debate: "stress-debate", validate: "stress-validate" }}
          />
          <CriticalValidation
            product={selectedProduct}
            analysisData={selectedProduct}
            activeTab={analysis.stressTestTab}
            externalData={analysis.stressTestData}
            onDataLoaded={(d) => {
              analysis.setStressTestData(d);
              analysis.saveStepData("stressTest", d);
              analysis.clearStepOutdated("stressTest");
              analysis.markStepOutdated("pitch");
            }}
          />
        </div>

        <NextStepButton
          stepNumber={6}
          label="Pitch Deck"
          color={theme.primary}
          onClick={() => { scrollToTop(); navigate(`${baseUrl}/pitch`); }}
          allSectionsVisited={allTabsVisited}
        />
      </main>
    </div>
  );
}
