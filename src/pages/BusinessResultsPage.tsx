import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useModeTheme } from "@/hooks/useModeTheme";
import { StepNavigator } from "@/components/StepNavigator";
import { BusinessModelAnalysis } from "@/components/BusinessModelAnalysis";
import { CriticalValidation } from "@/components/CriticalValidation";
import { PitchDeck } from "@/components/PitchDeck";
import { downloadFullAnalysisPDF } from "@/lib/pdfExport";
import { gatherBusinessAnalysisData } from "@/lib/gatherAnalysisData";
import { ModeBadge } from "@/components/ModeBadge";
import { StepNavBar } from "@/components/SectionNav";
import { scrollToTop } from "@/utils/scrollToTop";
import { GovernedMissingBanner } from "@/components/GovernedMissingBanner";
import { getBusinessStepConfigs } from "@/lib/stepConfigs";
import { InnovationOpportunitiesPanel } from "@/components/InnovationOpportunitiesPanel";

import type { Product } from "@/data/mockProducts";
import {
  Target, Brain, Swords, Presentation,
  XCircle, BarChart3,
} from "lucide-react";

// ── Shared layout components ──
import {
  AnalysisPageShell,
  AnalysisActionToolbar,
  AnalysisTabBar,
  AnalysisDivider,
  AnalysisContextBanner,
  AnalysisContentCard,
  AnalysisLoadingSpinner,
  type TabDef,
} from "@/components/analysis/AnalysisPageShell";

/* ── Step-specific context banners ── */
const STEP_BANNERS: Record<number, { icon: React.ElementType; title: string; description: string; color: string }> = {
  2: { icon: Target, title: "Intelligence Report", description: "Deep business model deconstruction — operational audit, hidden assumptions, tech leverage, revenue reinvention, and disruption mapping.", color: "hsl(var(--mode-business))" },
  3: { icon: Brain, title: "Deconstruct", description: "Disruption vulnerabilities and a reinvented business model — flip your assumptions and discover new value creation pathways.", color: "hsl(350 80% 55%)" },
  4: { icon: Swords, title: "Stress Test", description: "Red Team vs Green Team adversarial debate — your business model is attacked and defended to expose blind spots and validate strengths.", color: "hsl(38 92% 50%)" },
  5: { icon: Presentation, title: "Pitch Deck", description: "Investor-ready pitch builder — synthesizes your analysis into a compelling narrative with data-backed slides.", color: "hsl(var(--mode-business))" },
};

const BACK_LABELS: Record<number, { label: string; step: number }> = {
  2: { label: "Home", step: 0 },
  3: { label: "Intelligence Report", step: 2 },
  4: { label: "Deconstruct", step: 3 },
  5: { label: "Stress Test", step: 4 },
};

const STRESS_TABS: TabDef<"debate" | "validate">[] = [
  { id: "debate", label: "Red Team", icon: XCircle, color: "hsl(0 72% 48%)" },
  { id: "validate", label: "Validate & Score", icon: BarChart3 },
];

export default function BusinessResultsPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const theme = useModeTheme("business");

  // Always open on Intelligence Report (Step 2) — users navigate forward manually.
  // Previously this derived the furthest completed step, causing completed analyses
  // to skip directly to Pitch Deck and bypass the intelligence layer UI.
  const deriveInitialStep = (): number => 2;
  const [activeStep, setActiveStep] = React.useState(deriveInitialStep);
  const [visitedSteps, setVisitedSteps] = React.useState<Set<number>>(() => {
    const steps = new Set([2]);
    const init = deriveInitialStep();
    for (let i = 2; i <= init; i++) steps.add(i);
    return steps;
  });
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
    return <AnalysisLoadingSpinner message="Loading analysis…" />;
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

  return (
    <AnalysisPageShell tier={tier}>
      {/* ── Mode badge ── */}
      <ModeBadge />

      {/* ── Step Navigator ── */}
      <StepNavigator
        steps={getBusinessStepConfigs(modeAccent)}
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
        <StepNavBar backLabel={backNav.label} backPath="#" accentColor={modeAccent} />
      )}

      <AnalysisActionToolbar
        analysisTitle={bizName}
        stepTitle={banner?.title || "Business Analysis"}
        analysis={analysis}
        selectedProduct={bizSyntheticProduct}
        analysisId={analysis.analysisId}
        accentColor={modeAccent}
        hideRun
        hideShare
        strategicProfile={analysis.strategicProfile}
        onChangeProfile={analysis.setStrategicProfile}
        onPdf={() => downloadFullAnalysisPDF(bizSyntheticProduct, gatherBusinessAnalysisData(analysis))}
      />

      {/* ── Stress Test: pill-style tab buttons ── */}
      {activeStep === 4 && analysis.businessStressTestData && (
        <AnalysisTabBar
          tabs={STRESS_TABS}
          activeTab={stressTestTab}
          onTabChange={(t) => {
            setStressTestTab(t as "debate" | "validate");
            analysis.setBusinessStressTestTab(t as "debate" | "validate");
            analysis.setVisitedBusinessStressTestTabs(new Set([...analysis.visitedBusinessStressTestTabs, t]));
          }}
          accentColor={modeAccent}
        />
      )}

      <AnalysisDivider />

      {/* ── Dark context banner ── */}
      {banner && (
        <AnalysisContextBanner
          icon={banner.icon}
          title={banner.title}
          description={banner.description}
          iconColor={banner.color}
        />
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

      {activeStep === 2 && (
        <AnalysisContentCard>
          <BusinessModelAnalysis initialData={businessAnalysisData} renderMode="report" onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)} />
        </AnalysisContentCard>
      )}

      {activeStep === 3 && (
        <AnalysisContentCard>
          <BusinessModelAnalysis initialData={businessAnalysisData} renderMode="disrupt" onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)} />
        </AnalysisContentCard>
      )}

      {activeStep === 4 && (
        <AnalysisContentCard>
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
        </AnalysisContentCard>
      )}

      {activeStep === 5 && (
        <AnalysisContentCard>
          <PitchDeck
            product={bizSyntheticProduct}
            externalData={analysis.pitchDeckData}
            onSave={(d) => {
              analysis.setPitchDeckData(d);
              analysis.saveStepData("businessPitchDeck", d);
            }}
          />
        </AnalysisContentCard>
      )}

      {/* ══════════ INNOVATION OPPORTUNITIES ══════════ */}
      {(activeStep === 2 || activeStep === 3) && businessAnalysisData && (
        <AnalysisContentCard>
          <InnovationOpportunitiesPanel
            governedData={analysis.governedData as Record<string, unknown> | null}
            analysisData={businessAnalysisData as Record<string, unknown>}
            stressTestData={analysis.businessStressTestData as Record<string, unknown> | null}
          />
        </AnalysisContentCard>
      )}
    </AnalysisPageShell>
  );
}
