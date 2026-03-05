import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useModeTheme } from "@/hooks/useModeTheme";
import { HeroSection } from "@/components/HeroSection";
import { StepNavigator } from "@/components/StepNavigator";
import { BusinessModelAnalysis } from "@/components/BusinessModelAnalysis";
import { CriticalValidation } from "@/components/CriticalValidation";
import { PitchDeck } from "@/components/PitchDeck";
import { downloadFullAnalysisPDF } from "@/lib/pdfExport";
import { gatherBusinessAnalysisData } from "@/lib/gatherAnalysisData";
import { InfoExplainer } from "@/components/InfoExplainer";

import type { Product } from "@/data/mockProducts";
import {
  Target, Brain, Swords, Presentation, ArrowLeft, FileDown,
  ChevronRight, CheckCircle2,
} from "lucide-react";
import { SectionWorkflowNav } from "@/components/SectionNav";

const BIZ_STRESS_DESCRIPTIONS: Record<string, string> = {
  debate: "Red Team attacks vs Green Team defenses",
  validate: "Feasibility checklist & confidence scores",
};

export default function BusinessResultsPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const theme = useModeTheme("business");

  const [activeStep, setActiveStep] = React.useState(2);
  const [visitedSteps, setVisitedSteps] = React.useState<Set<number>>(new Set([2]));

  const { businessAnalysisData, businessModelInput } = analysis;

  // Grace period to allow context to populate before redirecting
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (ready && !businessAnalysisData) {
      navigate("/", { replace: true });
    }
  }, [ready, businessAnalysisData, navigate]);

  if (!businessAnalysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.primary }} />
          <p className="text-sm text-muted-foreground">Loading analysis…</p>
        </div>
      </div>
    );
  }

  const bizName = businessModelInput?.type || "Business Model";
  const modeAccent = theme.primary;

  const bizSyntheticProduct: Product = {
    id: "biz-model",
    name: bizName,
    category: "Business Model",
    era: "Present",
    image: "",
    description: businessAnalysisData?.businessSummary?.trueJobToBeDone || businessModelInput?.description || "",
    specs: businessModelInput?.description || "",
    revivalScore: 75,
    keyInsight: businessAnalysisData?.businessSummary?.currentModel || "",
    sources: [],
    reviews: [],
    socialSignals: [],
    competitors: [],
    assumptionsMap: (businessAnalysisData?.hiddenAssumptions || []).map((a: { assumption: string; challengeIdea: string }) => ({ assumption: a.assumption, challenge: a.challengeIdea })),
    flippedIdeas: [],
    confidenceScores: { adoptionLikelihood: 7, feasibility: 7, emotionalResonance: 6 },
    marketSizeEstimate: businessAnalysisData?.revenueReinvention?.currentRevenueMix,
  };

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        <StepNavigator
          steps={[
            { step: 2, label: "Intelligence Report", description: "Business model deep analysis", icon: Target, color: modeAccent },
            { step: 3, label: "Deconstruct", description: "Challenge assumptions & reinvent", icon: Brain, color: "hsl(350 80% 55%)" },
            { step: 4, label: "Stress Test", description: "Red vs Green team debate", icon: Swords, color: "hsl(38 92% 50%)" },
            { step: 5, label: "Pitch Deck", description: "Investor-ready pitch builder", icon: Presentation, color: modeAccent },
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
            className="flex items-center gap-2 typo-card-body font-semibold transition-colors hover:opacity-80"
            style={{ color: modeAccent }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        )}

        {/* Step 2: Report */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", borderLeft: `3px solid ${modeAccent}` }}>
              <div className="px-5 py-4 flex items-center gap-4" style={{ background: "hsl(var(--card))" }}>
                <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white typo-card-body font-semibold" style={{ background: modeAccent }}>2</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="typo-section-title">Intelligence Report</h2>
                    <InfoExplainer explainerKey="biz-report" />
                  </div>
                  <p className="typo-card-body text-muted-foreground">Deep business model deconstruction for <strong className="text-foreground">{bizName}</strong></p>
                </div>
                
                <button onClick={() => downloadFullAnalysisPDF(bizSyntheticProduct, gatherBusinessAnalysisData(analysis))}
                  className="flex items-center gap-1.5 px-3 py-2 rounded typo-button-secondary transition-colors"
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
            <button onClick={() => setActiveStep(2)} className="flex items-center gap-2 typo-card-body font-semibold hover:opacity-80" style={{ color: "hsl(350 80% 55%)" }}>
              <ArrowLeft size={16} /> Back to Intelligence Report
            </button>
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", borderLeft: "3px solid hsl(350 80% 55%)" }}>
              <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white typo-card-body font-semibold" style={{ background: "hsl(350 80% 55%)" }}>3</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="typo-section-title">Disrupt</h2>
                    <InfoExplainer explainerKey="biz-disrupt" />
                  </div>
                  <p className="typo-card-body text-muted-foreground">Disruption vulnerabilities and reinvented model for <strong className="text-foreground">{bizName}</strong></p>
                </div>
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
            <button onClick={() => setActiveStep(2)} className="flex items-center gap-2 typo-card-body font-semibold hover:opacity-80" style={{ color: "hsl(38 92% 50%)" }}>
              <ArrowLeft size={16} /> Back to Intelligence Report
            </button>
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", borderLeft: "3px solid hsl(38 92% 50%)" }}>
              <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white typo-card-body font-semibold" style={{ background: "hsl(38 92% 50%)" }}>4</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="typo-section-title">Stress Test</h2>
                    <InfoExplainer explainerKey="biz-stress-test" />
                  </div>
                  <p className="typo-card-body text-muted-foreground">Red Team vs Green Team for <strong className="text-foreground">{bizName}</strong></p>
                </div>
              </div>
              <div className="p-5 space-y-6" style={{ background: "hsl(var(--card))" }}>
                <SectionWorkflowNav
                  tabs={[
                    { id: "debate" as const, label: "Red vs Green Debate", icon: Swords },
                    { id: "validate" as const, label: "Validate & Score", icon: CheckCircle2 },
                  ]}
                  activeId={analysis.businessStressTestTab}
                  visitedIds={analysis.visitedBusinessStressTestTabs}
                  onSelect={(id) => {
                    analysis.setBusinessStressTestTab(id);
                    analysis.setVisitedBusinessStressTestTabs(new Set([...analysis.visitedBusinessStressTestTabs, id]));
                  }}
                  descriptions={BIZ_STRESS_DESCRIPTIONS}
                  journeyLabel="Stress Test Journey"
                />
                <CriticalValidation
                  product={{ name: bizName, category: "Business Model" }}
                  analysisData={businessAnalysisData}
                  activeTab={analysis.businessStressTestTab}
                  externalData={analysis.businessStressTestData}
                  onDataLoaded={(d) => {
                    analysis.setBusinessStressTestData(d);
                    analysis.saveStepData("businessStressTest", d);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Pitch Deck */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <button onClick={() => setActiveStep(2)} className="flex items-center gap-2 typo-card-body font-semibold hover:opacity-80" style={{ color: modeAccent }}>
              <ArrowLeft size={16} /> Back to Intelligence Report
            </button>
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", borderLeft: `3px solid ${modeAccent}` }}>
              <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white typo-card-body font-semibold" style={{ background: modeAccent }}>5</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="typo-section-title">Pitch Deck</h2>
                    <InfoExplainer explainerKey="biz-pitch" />
                  </div>
                  <p className="typo-card-body text-muted-foreground">Investor-ready pitch for <strong className="text-foreground">{bizName}</strong></p>
                </div>
              </div>
              <div className="p-5" style={{ background: "hsl(var(--card))" }}>
                <PitchDeck
                  product={bizSyntheticProduct}
                  externalData={analysis.pitchDeckData}
                  onSave={(d) => {
                    analysis.setPitchDeckData(d);
                    analysis.saveStepData("businessPitchDeck", d);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
