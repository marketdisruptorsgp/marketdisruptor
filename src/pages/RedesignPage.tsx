import React from "react";
import { PipelineProgressBar } from "@/components/analysis/PipelineProgressBar";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { SplitStepLayout } from "@/components/analysis/SplitStepLayout";
import { StepVisualOutput } from "@/components/analysis/StepVisualOutput";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { RedesignVisualGenerator } from "@/components/RedesignVisualGenerator";
import { StepLoadingTracker, REDESIGN_TASKS } from "@/components/StepLoadingTracker";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton } from "@/components/SectionNav";
import { ActiveHypothesisBanner } from "@/components/ActiveHypothesisBanner";
import { scrollToTop } from "@/utils/scrollToTop";
import { FlipHorizontal, Zap, Sparkles, Lightbulb, Wrench } from "lucide-react";

// ── Shared layout components ──
import {
  AnalysisPageShell,
  AnalysisStepHeader,
  AnalysisActionToolbar,
  AnalysisTabBar,
  AnalysisDivider,
  AnalysisContentCard,
  AnalysisLoadingCard,
  AnalysisLoadingSpinner,
  type TabDef,
} from "@/components/analysis/AnalysisPageShell";

const { useState } = React;

const LEGACY_REDESIGN_TABS: TabDef<"flip" | "ideas" | "concept">[] = [
  { id: "flip", label: "Flip the Logic", icon: FlipHorizontal },
  { id: "ideas", label: "Flipped Ideas", icon: Zap },
  { id: "concept", label: "Redesigned Concept", icon: Sparkles },
];

const INVENTION_ENGINE_TABS: TabDef<"flip" | "ideas" | "concept">[] = [
  { id: "flip", label: "Hidden Assumptions", icon: FlipHorizontal },
  { id: "ideas", label: "Invention Concepts", icon: Lightbulb },
  { id: "concept", label: "Engineering Deep Dive", icon: Wrench },
];

type RedesignTabId = "flip" | "ideas" | "concept";

export default function RedesignPage() {
  const [runTrigger, setRunTrigger] = useState(0);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<RedesignTabId>("flip");
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();

  const { selectedProduct: rawSelectedProduct, analysisId, products } = analysis;
  const autoAnalysis = useAutoAnalysis();

  // Synthetic product for business model analyses
  const selectedProduct = rawSelectedProduct || (analysis.businessAnalysisData ? {
    id: analysisId || "business-model", name: (analysis.businessModelInput as any)?.type || "Business Model",
    category: "Business", image: "", revivalScore: 0, flippedIdeas: [],
  } as any : null);

  if (analysis.step !== "done" || (!selectedProduct && !analysis.businessAnalysisData)) {
    if (shouldRedirectHome) return null;
    return <AnalysisLoadingSpinner />;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isOutdated = analysis.outdatedSteps.has("redesign");
  const shouldAutoTrigger = isOutdated || !analysis.redesignData;
  const hasData = !!analysis.redesignData || !!analysis.disruptData;

  return (
    <AnalysisPageShell tier={tier}>
      <AnalysisStepHeader
        steps={getStepConfigs(theme.primary)}
        activeStep={4}
        visitedSteps={new Set([2, 3, 4])}
        onStepChange={(s) => {
          if (s === 2) navigate(`${baseUrl}/report`);
          else if (s === 3) navigate(`${baseUrl}/disrupt`);
          else if (s === 5) navigate(`${baseUrl}/stress-test`);
          else if (s === 6) navigate(`${baseUrl}/pitch`);
        }}
        outdatedSteps={analysis.outdatedSteps}
        accentColor={theme.primary}
        backLabel="Deconstruct"
        backPath={`${baseUrl}/disrupt`}
        outdatedStepName={isOutdated ? "Redesign" : undefined}
        analysisId={analysisId}
      />

      <AnalysisActionToolbar
        analysisTitle={selectedProduct?.name || (analysis.businessModelInput as any)?.type || "Business Analysis"}
        stepTitle="Redesign"
        analysis={analysis}
        selectedProduct={selectedProduct}
        analysisId={analysisId}
        accentColor={theme.primary}
        isLoading={analysisLoading}
        hasData={hasData}
        onRun={() => { setRunTrigger(t => t + 1); setActiveTab("flip"); }}
        strategicProfile={analysis.strategicProfile}
        onChangeProfile={analysis.setStrategicProfile}
      />


      <AnalysisTabBar
        tabs={analysis.conceptsData ? INVENTION_ENGINE_TABS : LEGACY_REDESIGN_TABS}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as RedesignTabId)}
        accentColor={theme.primary}
      />

      <AnalysisDivider />


      {/* ── Concept Visuals (mounted early to pre-generate AI images) ── */}
      {hasData && (() => {
        const rd = analysis.redesignData as any;
        const concept = rd?.redesignedConcept || rd?.concept;
        if (!concept?.conceptName) return null;
        return (
          <div style={{ display: activeTab === "concept" ? undefined : "none" }}>
            <RedesignVisualGenerator
              productName={selectedProduct?.name || (analysis.businessModelInput as any)?.type || "Business Analysis"}
              concept={concept}
              accentColor="hsl(38 92% 50%)"
            />
          </div>
        );
      })()}

      {/* Loading Tracker */}
      {analysisLoading && (
        <AnalysisLoadingCard>
          <StepLoadingTracker
            title="Generating Redesign Concept"
            tasks={REDESIGN_TASKS}
            estimatedSeconds={50}
            accentColor="hsl(38 92% 50%)"
          />
        </AnalysisLoadingCard>
      )}

      {/* Split layout: content + visual sidebar */}
      <SplitStepLayout
        showVisual={hasData}
        visualOutput={
          <StepVisualOutput
            step="redesign"
            intelligence={autoAnalysis.intelligence}
            governedData={analysis.governedData as Record<string, unknown> | null}
            product={selectedProduct as unknown as Record<string, unknown>}
            accentColor={theme.primary}
          />
        }
      >
        {/* Content */}
        <div style={{ display: analysisLoading ? "none" : undefined }}>
          <FirstPrinciplesAnalysis
            product={selectedProduct}
            onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)}
            flippedIdeas={selectedProduct.flippedIdeas}
            onRegenerateIdeas={(ctx, rejected) => analysis.handleRegenerateIdeas(selectedProduct, ctx, rejected)}
            generatingIdeas={analysis.generatingIdeasFor === selectedProduct.id}
            renderMode="redesign"
            autoTrigger={shouldAutoTrigger}
            externalData={isOutdated ? null : (analysis.redesignData ?? analysis.disruptData)}
            runTrigger={runTrigger}
            onLoadingChange={setAnalysisLoading}
            activeSection={activeTab}
            onDataLoaded={(d) => {
              analysis.setRedesignData(d);
              analysis.saveStepData("redesign", d);
              analysis.clearStepOutdated("redesign");
              analysis.markStepOutdated("pitchDeck");
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
      </SplitStepLayout>

      <PipelineProgressBar
        completedSteps={autoAnalysis.completedSteps}
        outdatedSteps={analysis.outdatedSteps}
        currentStep="redesign"
        accentColor={theme.primary}
      />

      <NextStepButton
        stepNumber={5}
        label="Stress Test"
        color={theme.primary}
        onClick={() => { scrollToTop(); navigate(`${baseUrl}/stress-test`); }}
      />
    </AnalysisPageShell>
  );
}
