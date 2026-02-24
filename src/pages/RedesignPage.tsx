import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { StepNavigator } from "@/components/StepNavigator";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton, StepNavBar } from "@/components/SectionNav";
import { KeyTakeawayBanner } from "@/components/KeyTakeawayBanner";
import { OutdatedBanner } from "@/components/OutdatedBanner";

export default function RedesignPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();

  const { selectedProduct, analysisId, products } = analysis;

  if (analysis.step !== "done" || !selectedProduct) {
    navigate("/", { replace: true });
    return null;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isCustomMode = analysis.analysisParams?.category === "Custom";
  const modeAccent = isCustomMode ? "hsl(217 91% 38%)" : "hsl(var(--primary))";
  const redesignColor = "hsl(38 92% 50%)";
  const isOutdated = analysis.outdatedSteps.has("redesign");

  // Derive takeaway from disrupt data
  const disruptData = analysis.disruptData as Record<string, unknown> | null;
  const concept = disruptData?.redesignedConcept as { conceptName?: string; tagline?: string } | undefined;
  const takeaway = concept?.tagline
    ? `Redesigned concept: "${concept.conceptName}" — ${concept.tagline}`
    : null;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        <StepNavigator
          steps={getStepConfigs(modeAccent)}
          activeStep={4}
          visitedSteps={new Set([2, 3, 4])}
          onStepChange={(s) => {
            if (s === 2) navigate(`${baseUrl}/report`);
            else if (s === 3) navigate(`${baseUrl}/disrupt`);
            else if (s === 5) navigate(`${baseUrl}/stress-test`);
            else if (s === 6) navigate(`${baseUrl}/pitch`);
          }}
          outdatedSteps={analysis.outdatedSteps}
        />

        <StepNavBar backLabel="Disrupt" backPath={`${baseUrl}/disrupt`} accentColor={redesignColor} />

        {isOutdated && (
          <OutdatedBanner stepName="Redesign" accentColor={redesignColor} />
        )}

        {takeaway && !isOutdated && (
          <KeyTakeawayBanner takeaway={takeaway} accentColor={redesignColor} />
        )}

        <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", borderLeft: `3px solid ${redesignColor}` }}>
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-start gap-3 sm:gap-4" style={{ background: "hsl(var(--card))" }}>
            <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center text-white font-semibold text-xs sm:text-sm" style={{ background: redesignColor }}>4</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-foreground">Redesign</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Interactive concept illustrations for <strong className="text-foreground">{selectedProduct.name}</strong> — visualizing the reinvented model.</p>
            </div>
          </div>
          <div className="p-3 sm:p-5" style={{ background: "hsl(var(--card))" }}>
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
                // Redesign regenerated — clear outdated, mark pitch outdated
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
        </div>

        <NextStepButton
          stepNumber={5}
          label="Stress Test"
          color="hsl(350 80% 55%)"
          onClick={() => navigate(`${baseUrl}/stress-test`)}
        />
      </main>
    </div>
  );
}
