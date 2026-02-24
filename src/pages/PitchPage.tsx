import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { StepNavigator } from "@/components/StepNavigator";
import { PitchDeck } from "@/components/PitchDeck";
import { getStepConfigs } from "@/lib/stepConfigs";
import { StepNavBar } from "@/components/SectionNav";
import { KeyTakeawayBanner, getPitchTakeaway } from "@/components/KeyTakeawayBanner";
import { ShareAnalysis } from "@/components/ShareAnalysis";

export default function PitchPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();

  const { selectedProduct, analysisId } = analysis;

  if (analysis.step !== "done" || !selectedProduct) {
    navigate("/", { replace: true });
    return null;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isCustomMode = analysis.analysisParams?.category === "Custom";
  const modeAccent = isCustomMode ? "hsl(217 91% 38%)" : "hsl(var(--primary))";

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        <StepNavigator
          steps={getStepConfigs(modeAccent)}
          activeStep={6}
          visitedSteps={new Set([2, 3, 4, 5, 6])}
          onStepChange={(s) => {
            if (s === 2) navigate(`${baseUrl}/report`);
            else if (s === 3) navigate(`${baseUrl}/disrupt`);
            else if (s === 4) navigate(`${baseUrl}/redesign`);
            else if (s === 5) navigate(`${baseUrl}/stress-test`);
          }}
        />

        <StepNavBar backLabel="Stress Test" backPath={`${baseUrl}/stress-test`} accentColor="hsl(var(--primary))" />
        <div className="flex justify-end"><ShareAnalysis analysisId={analysisId || ""} analysisTitle={selectedProduct.name} /></div>

        {(() => {
          const takeaway = getPitchTakeaway(analysis.pitchDeckData as Record<string, unknown> | null);
          return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor="hsl(var(--primary))" /> : null;
        })()}

        <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", borderLeft: "3px solid hsl(var(--primary))" }}>
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-start gap-3 sm:gap-4" style={{ background: "hsl(var(--card))" }}>
            <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center text-white font-semibold text-xs sm:text-sm" style={{ background: "hsl(var(--primary))" }}>6</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-foreground">Investor Pitch Deck</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Professional pitch deck for <strong className="text-foreground">{selectedProduct.name}</strong></p>
            </div>
          </div>
          <div className="p-3 sm:p-5" style={{ background: "hsl(var(--card))" }}>
            <PitchDeck
              product={selectedProduct}
              analysisId={analysisId}
              externalData={analysis.pitchDeckData}
              onSave={(d) => {
                analysis.setPitchDeckData(d);
                analysis.saveStepData("pitchDeck", d);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
