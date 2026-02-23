import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { StepNavigator } from "@/components/StepNavigator";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { Target, Brain, Swords, Presentation, ArrowLeft } from "lucide-react";
import { NextStepButton } from "@/components/SectionNav";

export default function DisruptPage() {
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

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        <StepNavigator
          steps={[
            { step: 2, label: "Intelligence Report", icon: Target, color: modeAccent },
            { step: 3, label: "Disrupt", icon: Brain, color: "hsl(271 81% 55%)" },
            { step: 4, label: "Stress Test", icon: Swords, color: "hsl(350 80% 55%)" },
            { step: 5, label: "Pitch Deck", icon: Presentation, color: "hsl(var(--primary))" },
          ]}
          activeStep={3}
          visitedSteps={new Set([2, 3])}
          onStepChange={(s) => {
            if (s === 2) navigate(`${baseUrl}/report`);
            else if (s === 4) navigate(`${baseUrl}/stress-test`);
            else if (s === 5) navigate(`${baseUrl}/pitch`);
          }}
        />

        <button
          onClick={() => navigate(`${baseUrl}/report`)}
          className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: "hsl(271 81% 55%)" }}
        >
          <ArrowLeft size={16} /> Back to Intelligence Report
        </button>

        <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", borderLeft: "3px solid hsl(271 81% 55%)" }}>
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-start gap-3 sm:gap-4" style={{ background: "hsl(var(--card))" }}>
            <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center text-white font-semibold text-xs sm:text-sm" style={{ background: "hsl(271 81% 55%)" }}>3</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-foreground">Disrupt</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Deconstructing <strong className="text-foreground">{selectedProduct.name}</strong> — questioning every assumption and generating radical reinvention ideas.</p>
            </div>
          </div>
          <div className="p-3 sm:p-5" style={{ background: "hsl(var(--card))" }}>
            <FirstPrinciplesAnalysis
              product={selectedProduct}
              onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)}
              flippedIdeas={selectedProduct.flippedIdeas}
              onRegenerateIdeas={(ctx) => analysis.handleRegenerateIdeas(selectedProduct, ctx)}
              generatingIdeas={analysis.generatingIdeasFor === selectedProduct.id}
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

        {/* Next Step button */}
        <NextStepButton
          stepNumber={4}
          label="Stress Test"
          color="hsl(350 80% 55%)"
          onClick={() => navigate(`${baseUrl}/stress-test`)}
        />
      </main>
    </div>
  );
}
