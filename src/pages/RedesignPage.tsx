import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { HeroSection } from "@/components/HeroSection";
import { StepNavigator } from "@/components/StepNavigator";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton, StepNavBar } from "@/components/SectionNav";
import { KeyTakeawayBanner } from "@/components/KeyTakeawayBanner";
import { OutdatedBanner } from "@/components/OutdatedBanner";
import { ModeHeader } from "@/components/ModeHeader";
import { scrollToTop } from "@/utils/scrollToTop";

export default function RedesignPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();

  const { selectedProduct, analysisId, products } = analysis;

  if (analysis.step !== "done" || !selectedProduct) {
    navigate("/", { replace: true });
    return null;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isOutdated = analysis.outdatedSteps.has("redesign");

  const disruptData = analysis.disruptData as Record<string, unknown> | null;
  const concept = disruptData?.redesignedConcept as { conceptName?: string; tagline?: string } | undefined;
  const takeaway = concept?.tagline
    ? `Redesigned concept: "${concept.conceptName}" — ${concept.tagline}`
    : null;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        <StepNavigator
          steps={getStepConfigs(theme.primary)}
          activeStep={4}
          visitedSteps={new Set([2, 3, 4])}
          onStepChange={(s) => {
            scrollToTop();
            if (s === 2) navigate(`${baseUrl}/report`);
            else if (s === 3) navigate(`${baseUrl}/disrupt`);
            else if (s === 5) navigate(`${baseUrl}/stress-test`);
            else if (s === 6) navigate(`${baseUrl}/pitch`);
          }}
          outdatedSteps={analysis.outdatedSteps}
          accentColor={theme.primary}
        />

        <StepNavBar backLabel="Disrupt" backPath={`${baseUrl}/disrupt`} accentColor={theme.primary} />

        {isOutdated && <OutdatedBanner stepName="Redesign" accentColor={theme.primary} />}
        {takeaway && !isOutdated && <KeyTakeawayBanner takeaway={takeaway} accentColor={theme.primary} />}

        <ModeHeader
          stepNumber={4}
          stepTitle="Redesign"
          subtitle={`Interactive concept illustrations for <strong class="text-foreground">${selectedProduct.name}</strong> — visualizing the reinvented model.`}
          accentColor={theme.primary}
        />

        <div className="rounded overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <FirstPrinciplesAnalysis
            product={selectedProduct}
            onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)}
            flippedIdeas={selectedProduct.flippedIdeas}
            onRegenerateIdeas={(ctx) => analysis.handleRegenerateIdeas(selectedProduct, ctx)}
            generatingIdeas={analysis.generatingIdeasFor === selectedProduct.id}
            renderMode="redesign"
            externalData={analysis.disruptData}
            onDataLoaded={(d) => {
              analysis.setDisruptData(d);
              analysis.saveStepData("disrupt", d);
              analysis.clearStepOutdated("redesign");
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
          />
        </div>

        <NextStepButton
          stepNumber={5}
          label="Stress Test"
          color={theme.primary}
          onClick={() => { scrollToTop(); navigate(`${baseUrl}/stress-test`); }}
        />
      </main>
    </div>
  );
}
