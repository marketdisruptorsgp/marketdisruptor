import React from "react";
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
import { FlipHorizontal, Zap, Sparkles } from "lucide-react";

// ── Shared layout components ──
import {
  AnalysisPageShell,
  AnalysisStepHeader,
  AnalysisActionToolbar,
  AnalysisTabBar,
  AnalysisDivider,
  AnalysisContextBanner,
  AnalysisContentCard,
  AnalysisLoadingCard,
  AnalysisLoadingSpinner,
  type TabDef,
} from "@/components/analysis/AnalysisPageShell";

const { useState } = React;

const REDESIGN_TABS: TabDef<"flip" | "ideas" | "concept">[] = [
  { id: "flip", label: "Flip the Logic", icon: FlipHorizontal },
  { id: "ideas", label: "Flipped Ideas", icon: Zap },
  { id: "concept", label: "Redesigned Concept", icon: Sparkles },
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

  const { selectedProduct, analysisId, products } = analysis;

  if (analysis.step !== "done" || !selectedProduct) {
    return <AnalysisLoadingSpinner />;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isOutdated = analysis.outdatedSteps.has("redesign");
  const shouldAutoTrigger = isOutdated || !analysis.redesignData;
  const hasData = !!analysis.redesignData;

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
      />

      <AnalysisActionToolbar
        analysisTitle={selectedProduct.name}
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
        tabs={REDESIGN_TABS}
        activeTab={activeTab}
        onTabChange={(t) => setActiveTab(t as RedesignTabId)}
        accentColor={theme.primary}
      />

      <AnalysisDivider />

      <AnalysisContextBanner
        icon={Sparkles}
        title="Redesign Concept"
        description="Every assumption from Disrupt is inverted, recombined, and synthesized into bold product concepts — grounded in flipped logic and upstream intelligence. Each idea traces back to a specific structural constraint."
        iconColor="hsl(38 92% 50%)"
      />

      {/* ── Concept Visuals ── */}
      {activeTab === "concept" && hasData && (() => {
        const rd = analysis.redesignData as any;
        const concept = rd?.redesignedConcept || rd?.concept;
        if (!concept?.conceptName) return null;
        return (
          <RedesignVisualGenerator
            productName={selectedProduct.name}
            concept={concept}
            accentColor="hsl(38 92% 50%)"
          />
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

      {/* Content */}
      <AnalysisContentCard hidden={analysisLoading}>
        <FirstPrinciplesAnalysis
          product={selectedProduct}
          onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)}
          flippedIdeas={selectedProduct.flippedIdeas}
          onRegenerateIdeas={(ctx) => analysis.handleRegenerateIdeas(selectedProduct, ctx)}
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
      </AnalysisContentCard>

      <NextStepButton
        stepNumber={5}
        label="Stress Test"
        color={theme.primary}
        onClick={() => { scrollToTop(); navigate(`${baseUrl}/stress-test`); }}
      />
    </AnalysisPageShell>
  );
}
