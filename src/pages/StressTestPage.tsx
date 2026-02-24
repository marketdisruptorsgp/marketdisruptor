import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { usePersistedSections } from "@/hooks/usePersistedSections";
import { StepNavigator } from "@/components/StepNavigator";
import { CriticalValidation } from "@/components/CriticalValidation";
import { Swords, CheckCircle2 } from "lucide-react";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton, StepNavBar } from "@/components/SectionNav";

export default function StressTestPage() {
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

  const { visited: persistedVisited, markVisited } = usePersistedSections(analysisId, "stress-test", ["debate"]);
  const mergedVisited = new Set([...analysis.visitedStressTestTabs, ...persistedVisited]);
  const allTabsVisited = mergedVisited.has("debate") && mergedVisited.has("validate");

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
            else if (s === 5) navigate(`${baseUrl}/pitch`);
          }}
        />

        <StepNavBar backLabel="Disrupt" backPath={`${baseUrl}/disrupt`} accentColor="hsl(350 80% 55%)" />

        <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", borderLeft: "3px solid hsl(350 80% 55%)" }}>
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex items-start gap-3 sm:gap-4" style={{ background: "hsl(var(--card))" }}>
            <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center text-white font-semibold text-xs sm:text-sm" style={{ background: "hsl(350 80% 55%)" }}>4</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-foreground">Stress Test</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Red Team vs Green Team critical validation for <strong className="text-foreground">{selectedProduct.name}</strong></p>
            </div>
          </div>
          <div className="p-3 sm:p-5 space-y-4 sm:space-y-6" style={{ background: "hsl(var(--card))" }}>
            <div className="flex gap-2">
              {[
                { id: "debate" as const, label: "Red vs Green Debate", icon: Swords },
                { id: "validate" as const, label: "Validate & Score", icon: CheckCircle2 },
              ].map(tab => {
                const isActive = analysis.stressTestTab === tab.id;
                const isVisited = mergedVisited.has(tab.id);
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      analysis.setStressTestTab(tab.id);
                      analysis.setVisitedStressTestTabs(new Set([...mergedVisited, tab.id]));
                      markVisited(tab.id);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors relative"
                    style={{
                      background: isActive ? "hsl(var(--foreground))" : isVisited ? "hsl(var(--foreground) / 0.05)" : "transparent",
                      color: isActive ? "hsl(var(--background))" : isVisited ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                      border: isActive ? "1.5px solid hsl(var(--foreground))" : isVisited ? "1.5px solid hsl(var(--foreground) / 0.15)" : "1.5px dashed hsl(var(--border))",
                    }}
                  >
                    {!isActive && !isVisited && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "hsl(var(--primary))" }} />
                    )}
                    <TabIcon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <CriticalValidation
              product={selectedProduct}
              analysisData={selectedProduct}
              activeTab={analysis.stressTestTab}
              externalData={analysis.stressTestData}
              onDataLoaded={(d) => {
                analysis.setStressTestData(d);
                analysis.saveStepData("stressTest", d);
              }}
            />
          </div>
        </div>

        {/* Next Step button — gated */}
        <NextStepButton
          stepNumber={5}
          label="Pitch Deck"
          color="hsl(var(--primary))"
          onClick={() => navigate(`${baseUrl}/pitch`)}
          allSectionsVisited={allTabsVisited}
        />
      </main>
    </div>
  );
}
