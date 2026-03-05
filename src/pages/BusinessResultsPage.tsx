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
import { ModeBadge } from "@/components/ModeBadge";
import { StepNavBar } from "@/components/SectionNav";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import { scrollToTop } from "@/utils/scrollToTop";
import { GovernedMissingBanner } from "@/components/GovernedMissingBanner";

import type { Product } from "@/data/mockProducts";
import {
  Target, Brain, Swords, Presentation, FileDown, Save, RefreshCw,
  XCircle, CheckCircle2, BarChart3, Building2,
} from "lucide-react";
import { toast } from "sonner";

/* ── Step config for the business mode StepNavigator ── */
const getBizStepConfigs = (accent: string) => [
  { step: 2, label: "Intelligence Report", description: "Business model deep analysis", icon: Target, color: accent },
  { step: 3, label: "Deconstruct", description: "Challenge assumptions & reinvent", icon: Brain, color: "hsl(350 80% 55%)" },
  { step: 4, label: "Stress Test", description: "Red vs Green team debate", icon: Swords, color: "hsl(38 92% 50%)" },
  { step: 5, label: "Pitch Deck", description: "Investor-ready pitch builder", icon: Presentation, color: accent },
];

/* ── Step-specific context banners ── */
const STEP_BANNERS: Record<number, { icon: React.ElementType; title: string; description: string; color: string }> = {
  2: {
    icon: Target,
    title: "Intelligence Report",
    description: "Deep business model deconstruction — operational audit, hidden assumptions, tech leverage, revenue reinvention, and disruption mapping.",
    color: "hsl(var(--mode-business))",
  },
  3: {
    icon: Brain,
    title: "Deconstruct",
    description: "Disruption vulnerabilities and a reinvented business model — flip your assumptions and discover new value creation pathways.",
    color: "hsl(350 80% 55%)",
  },
  4: {
    icon: Swords,
    title: "Stress Test",
    description: "Red Team vs Green Team adversarial debate — your business model is attacked and defended to expose blind spots and validate strengths.",
    color: "hsl(38 92% 50%)",
  },
  5: {
    icon: Presentation,
    title: "Pitch Deck",
    description: "Investor-ready pitch builder — synthesizes your analysis into a compelling narrative with data-backed slides.",
    color: "hsl(var(--mode-business))",
  },
};

/* ── Back-navigation labels per step ── */
const BACK_LABELS: Record<number, { label: string; step: number }> = {
  2: { label: "Home", step: 0 },
  3: { label: "Intelligence Report", step: 2 },
  4: { label: "Deconstruct", step: 3 },
  5: { label: "Stress Test", step: 4 },
};

export default function BusinessResultsPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const theme = useModeTheme("business");

  const [activeStep, setActiveStep] = React.useState(2);
  const [visitedSteps, setVisitedSteps] = React.useState<Set<number>>(new Set([2]));
  const [stressTestTab, setStressTestTab] = React.useState<"debate" | "validate">("debate");

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-primary" />
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

  const banner = STEP_BANNERS[activeStep];
  const backNav = BACK_LABELS[activeStep];
  const BannerIcon = banner?.icon || Target;

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* ── Mode badge ── */}
        <ModeBadge />

        {/* ── Step Navigator ── */}
        <StepNavigator
          steps={getBizStepConfigs(modeAccent)}
          activeStep={activeStep}
          visitedSteps={visitedSteps}
          onStepChange={(s) => {
            setActiveStep(s);
            setVisitedSteps(prev => new Set([...prev, s]));
            scrollToTop();
          }}
          accentColor={modeAccent}
        />

        {/* ── Back navigation bar ── */}
        {backNav && backNav.step !== 0 && (
          <StepNavBar
            backLabel={backNav.label}
            backPath="#"
            accentColor={modeAccent}
          />
        )}

        {/* ── Persistent analysis title ── */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground px-1">{bizName}</h1>

        {/* ── Compact header with step title + actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="typo-section-title">{banner?.title || "Business Analysis"}</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => downloadFullAnalysisPDF(bizSyntheticProduct, gatherBusinessAnalysisData(analysis))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded typo-button-secondary bg-background border border-border text-foreground"
            >
              <FileDown size={12} /> PDF
            </button>
            <button
              onClick={() => analysis.handleManualSave()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded typo-button-secondary bg-primary text-primary-foreground"
            >
              <Save size={12} /> Save
            </button>
          </div>
        </div>

        {/* ── Stress Test: pill-style tab buttons ── */}
        {activeStep === 4 && analysis.businessStressTestData && (
          <div className="flex items-center gap-2 flex-wrap">
            {([
              { id: "debate" as const, label: "Red Team", icon: XCircle, color: "hsl(0 72% 48%)" },
              { id: "validate" as const, label: "Validate & Score", icon: BarChart3, color: modeAccent },
            ] as const).map(tab => {
              const isActive = stressTestTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStressTestTab(tab.id);
                    analysis.setBusinessStressTestTab(tab.id);
                    analysis.setVisitedBusinessStressTestTabs(new Set([...analysis.visitedBusinessStressTestTabs, tab.id]));
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                  style={{
                    background: isActive ? tab.color : "hsl(var(--muted))",
                    color: isActive ? "white" : "hsl(var(--foreground))",
                    border: isActive ? "none" : "1px solid hsl(var(--border))",
                  }}
                >
                  <TabIcon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Divider ── */}
        <div className="h-px w-full" style={{ background: "hsl(var(--border))" }} />

        {/* ── Dark context banner ── */}
        {banner && (
          <div className="rounded-xl p-5 space-y-2.5" style={{ background: "hsl(var(--foreground))" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: banner.color }}>
                <BannerIcon size={18} style={{ color: "white" }} />
              </div>
              <h3 className="font-extrabold text-base leading-tight" style={{ color: "white" }}>{banner.title}</h3>
            </div>
            <p className="text-sm leading-relaxed pl-[48px]" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
              {banner.description}
            </p>
          </div>
        )}

        {/* ══════════ GOVERNED MISSING BANNER ══════════ */}
        <GovernedMissingBanner
          businessAnalysisData={businessAnalysisData as Record<string, unknown> | null}
          businessModelInput={businessModelInput}
          onGovernedReady={(governed) => {
            const updated = { ...businessAnalysisData, governed, _governedIncomplete: undefined } as any;
            analysis.setBusinessAnalysisData(updated);
            analysis.setGovernedData(governed);
            analysis.saveStepData("businessAnalysis", updated);
          }}
        />

        {/* ══════════ STEP CONTENT ══════════ */}

        {/* Step 2: Intelligence Report */}
        {activeStep === 2 && (
          <div className="rounded-2xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
            <BusinessModelAnalysis initialData={businessAnalysisData} renderMode="report" onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)} />
          </div>
        )}

        {/* Step 3: Deconstruct */}
        {activeStep === 3 && (
          <div className="rounded-2xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
            <BusinessModelAnalysis initialData={businessAnalysisData} renderMode="disrupt" onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)} />
          </div>
        )}

        {/* Step 4: Stress Test */}
        {activeStep === 4 && (
          <div className="rounded-2xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
            <CriticalValidation
              product={{ name: bizName, category: "Business Model" }}
              analysisData={businessAnalysisData}
              activeTab={stressTestTab}
              externalData={analysis.businessStressTestData}
              competitorIntel={analysis.scoutedCompetitors}
              onDataLoaded={(d) => {
                analysis.setBusinessStressTestData(d);
                analysis.saveStepData("businessStressTest", d);
              }}
            />
          </div>
        )}

        {/* Step 5: Pitch Deck */}
        {activeStep === 5 && (
          <div className="rounded-2xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
            <PitchDeck
              product={bizSyntheticProduct}
              externalData={analysis.pitchDeckData}
              onSave={(d) => {
                analysis.setPitchDeckData(d);
                analysis.saveStepData("businessPitchDeck", d);
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
