import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { StepNavigator } from "@/components/StepNavigator";
import { BusinessModelAnalysis } from "@/components/BusinessModelAnalysis";
import { CriticalValidation } from "@/components/CriticalValidation";
import { PitchDeck } from "@/components/PitchDeck";
import { downloadFullAnalysisPDF } from "@/lib/pdfExport";
import type { Product } from "@/data/mockProducts";
import {
  Target, Brain, Swords, Presentation, ArrowLeft, FileDown,
  ChevronRight, CheckCircle2,
} from "lucide-react";

export default function BusinessResultsPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = React.useState(2);
  const [visitedSteps, setVisitedSteps] = React.useState<Set<number>>(new Set([2]));

  const { businessAnalysisData, businessModelInput } = analysis;

  if (!businessAnalysisData) {
    navigate("/", { replace: true });
    return null;
  }

  const bizName = businessModelInput?.type || "Business Model";
  const bizAccent = "hsl(271 81% 55%)";

  const bizSyntheticProduct: Product = {
    id: "biz-model",
    name: bizName,
    category: "Business Model",
    era: "Present",
    image: "",
    description: businessAnalysisData.businessSummary?.trueJobToBeDone || businessModelInput?.description || "",
    specs: businessModelInput?.description || "",
    revivalScore: 75,
    keyInsight: businessAnalysisData.businessSummary?.currentModel || "",
    sources: [],
    reviews: [],
    socialSignals: [],
    competitors: [],
    assumptionsMap: (businessAnalysisData.hiddenAssumptions || []).map((a: { assumption: string; challengeIdea: string }) => ({ assumption: a.assumption, challenge: a.challengeIdea })),
    flippedIdeas: [],
    confidenceScores: { adoptionLikelihood: 7, feasibility: 7, emotionalResonance: 6 },
    marketSizeEstimate: businessAnalysisData.revenueReinvention?.currentRevenueMix,
  };

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        <StepNavigator
          steps={[
            { step: 2, label: "Intelligence Report", description: "Business model deep analysis", icon: Target, color: bizAccent },
            { step: 3, label: "Disrupt", description: "Challenge assumptions & reinvent", icon: Brain, color: "hsl(350 80% 55%)" },
            { step: 4, label: "Stress Test", description: "Red vs Green team debate", icon: Swords, color: "hsl(38 92% 50%)" },
            { step: 5, label: "Pitch Deck", description: "Investor-ready pitch builder", icon: Presentation, color: "hsl(var(--primary))" },
          ]}
          activeStep={activeStep}
          visitedSteps={visitedSteps}
          onStepChange={(s) => {
            setActiveStep(s);
            setVisitedSteps(prev => new Set([...prev, s]));
          }}
        />

        {analysis.loadedFromSaved && (
          <button onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: bizAccent }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        )}

        {/* Step 2: Report */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", borderLeft: `3px solid ${bizAccent}` }}>
              <div className="px-5 py-4 flex items-center gap-4" style={{ background: "hsl(var(--card))" }}>
                <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-sm" style={{ background: bizAccent }}>2</div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground">Intelligence Report</h2>
                  <p className="text-sm text-muted-foreground">Deep business model deconstruction for <strong className="text-foreground">{bizName}</strong></p>
                </div>
                <button onClick={() => downloadFullAnalysisPDF(bizSyntheticProduct)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold transition-colors"
                  style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
                  <FileDown size={12} /> PDF
                </button>
              </div>
              <div className="p-5" style={{ background: "hsl(var(--card))" }}>
                <BusinessModelAnalysis initialData={businessAnalysisData} renderMode="report" onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)} />
              </div>
            </div>

          </div>
        )}

        {/* Step 3: Disrupt */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <button onClick={() => setActiveStep(2)} className="flex items-center gap-2 text-sm font-semibold hover:opacity-80" style={{ color: "hsl(350 80% 55%)" }}>
              <ArrowLeft size={16} /> Back to Intelligence Report
            </button>
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", borderLeft: "3px solid hsl(350 80% 55%)" }}>
              <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-sm" style={{ background: "hsl(350 80% 55%)" }}>3</div>
                <div className="flex-1"><h2 className="text-lg font-bold text-foreground">Disrupt</h2>
                  <p className="text-sm text-muted-foreground">Disruption vulnerabilities and reinvented model for <strong className="text-foreground">{bizName}</strong></p></div>
              </div>
              <div className="p-5" style={{ background: "hsl(var(--card))" }}>
                <BusinessModelAnalysis initialData={businessAnalysisData} renderMode="disrupt" onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Stress Test */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <button onClick={() => setActiveStep(2)} className="flex items-center gap-2 text-sm font-semibold hover:opacity-80" style={{ color: "hsl(38 92% 50%)" }}>
              <ArrowLeft size={16} /> Back to Intelligence Report
            </button>
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", borderLeft: "3px solid hsl(38 92% 50%)" }}>
              <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-sm" style={{ background: "hsl(38 92% 50%)" }}>4</div>
                <div className="flex-1"><h2 className="text-lg font-bold text-foreground">Stress Test</h2>
                  <p className="text-sm text-muted-foreground">Red Team vs Blue Team for <strong className="text-foreground">{bizName}</strong></p></div>
              </div>
              <div className="p-5 space-y-6" style={{ background: "hsl(var(--card))" }}>
                <div className="flex gap-2">
                  {[
                    { id: "debate" as const, label: "Red vs Blue Debate", icon: Swords },
                    { id: "validate" as const, label: "Validate & Score", icon: CheckCircle2 },
                  ].map(tab => {
                    const isActive = analysis.businessStressTestTab === tab.id;
                    const TabIcon = tab.icon;
                    return (
                      <button key={tab.id}
                        onClick={() => { analysis.setBusinessStressTestTab(tab.id); analysis.setVisitedBusinessStressTestTabs(new Set([...analysis.visitedBusinessStressTestTabs, tab.id])); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium transition-colors relative"
                        style={{ background: isActive ? "hsl(38 92% 50%)" : "transparent", color: isActive ? "white" : "hsl(var(--muted-foreground))", border: isActive ? "1px solid hsl(38 92% 50%)" : "1px solid hsl(var(--border))" }}>
                        {!isActive && !analysis.visitedBusinessStressTestTabs.has(tab.id) && (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(38 92% 50%)" }} />
                        )}
                        <TabIcon size={14} /> {tab.label}
                      </button>
                    );
                  })}
                </div>
                <CriticalValidation
                  product={{ name: bizName, category: "Business Model" }}
                  analysisData={businessAnalysisData}
                  activeTab={analysis.businessStressTestTab}
                  externalData={analysis.businessStressTestData}
                  onDataLoaded={analysis.setBusinessStressTestData}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Pitch Deck */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <button onClick={() => setActiveStep(2)} className="flex items-center gap-2 text-sm font-semibold hover:opacity-80" style={{ color: "hsl(var(--primary))" }}>
              <ArrowLeft size={16} /> Back to Intelligence Report
            </button>
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", borderLeft: "3px solid hsl(var(--primary))" }}>
              <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-sm" style={{ background: "hsl(var(--primary))" }}>5</div>
                <div className="flex-1"><h2 className="text-lg font-bold text-foreground">Pitch Deck</h2>
                  <p className="text-sm text-muted-foreground">Investor-ready pitch for <strong className="text-foreground">{bizName}</strong></p></div>
              </div>
              <div className="p-5" style={{ background: "hsl(var(--card))" }}>
                <PitchDeck product={bizSyntheticProduct} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
