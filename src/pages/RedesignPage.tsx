import React from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { HeroSection } from "@/components/HeroSection";
import { StepNavigator } from "@/components/StepNavigator";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { RedesignVisualGenerator } from "@/components/RedesignVisualGenerator";
import { StepLoadingTracker, REDESIGN_TASKS } from "@/components/StepLoadingTracker";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton, StepNavBar } from "@/components/SectionNav";
import { OutdatedBanner } from "@/components/OutdatedBanner";
import { ActiveHypothesisBanner } from "@/components/ActiveHypothesisBanner";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import { scrollToTop } from "@/utils/scrollToTop";
import { ModeBadge } from "@/components/ModeBadge";
import StrategicProfileSelector from "@/components/StrategicProfileSelector";
import { downloadReportAsPDF } from "@/lib/downloadReportPDF";
import { gatherAllAnalysisData } from "@/lib/gatherAnalysisData";
import { FileDown, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const { useState } = React;

export default function RedesignPage() {
  const [runTrigger, setRunTrigger] = useState(0);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();

  const { selectedProduct, analysisId, products } = analysis;

  if (analysis.step !== "done" || !selectedProduct) {
    if (shouldRedirectHome) return null;
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-primary" /></div>;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isOutdated = analysis.outdatedSteps.has("redesign");
  const shouldAutoTrigger = isOutdated || !analysis.redesignData;


  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        <ModeBadge />
        <StepNavigator
          steps={getStepConfigs(theme.primary)}
          activeStep={4}
          visitedSteps={new Set([2, 3, 4])}
          onStepChange={(s) => {
            scrollToTop();
            if (s === 2) navigate(`${baseUrl}/report`);
            else if (s === 3) navigate(`${baseUrl}/disrupt`);
            else if (s === 5) navigate(`${baseUrl}/stress-test`);
            else if (s === 6) navigate(`${baseUrl}/pitch`);
          }}
          outdatedSteps={analysis.outdatedSteps}
          accentColor={theme.primary}
        />

        <StepNavBar backLabel="Disrupt" backPath={`${baseUrl}/disrupt`} accentColor={theme.primary} />

        {isOutdated && (
          <OutdatedBanner
            stepName="Redesign"
            accentColor={theme.primary}
          />
        )}

        <ActiveHypothesisBanner stepName="Redesign" accentColor={theme.primary} />

        {/* Compact header with archetype + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="typo-section-title">Redesign</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StrategicProfileSelector
              profile={analysis.strategicProfile}
              onChangeProfile={analysis.setStrategicProfile}
            />
            <button
              onClick={() => setRunTrigger(t => t + 1)}
              disabled={analysisLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all"
              style={{
                background: analysisLoading ? "hsl(var(--primary) / 0.6)" : "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                opacity: analysisLoading ? 0.7 : 1,
              }}
            >
              {analysisLoading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {analysis.redesignData ? "Re-run Analysis" : "Run Analysis"}
            </button>
            <button onClick={() => {
              if (!selectedProduct) return;
              const data = gatherAllAnalysisData(analysis);
              downloadReportAsPDF(selectedProduct, data, {
                title: selectedProduct.name,
                mode: (analysis.analysisParams as any)?.analysisType,
                onProgress: (msg) => toast.loading(msg, { id: "pdf-progress" }),
              }).then(() => { toast.dismiss("pdf-progress"); toast.success("PDF downloaded!"); })
                .catch(() => { toast.dismiss("pdf-progress"); toast.error("Failed to download PDF"); });
            }} className="flex items-center gap-1.5 px-3 py-1.5 rounded typo-button-secondary bg-background border border-border text-foreground">
              <FileDown size={12} /> PDF
            </button>
            <button onClick={() => analysis.handleManualSave()} className="flex items-center gap-1.5 px-3 py-1.5 rounded typo-button-secondary bg-primary text-primary-foreground">
              <Save size={12} /> Save
            </button>
            <ShareAnalysis analysisId={analysisId || ""} analysisTitle={selectedProduct.name} accentColor={theme.primary} />
          </div>
        </div>

        {/* Loading Tracker (front and center) */}
        {analysisLoading && (
          <div className="rounded-xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <StepLoadingTracker
              title="Generating Redesign Concept"
              tasks={REDESIGN_TASKS}
              estimatedSeconds={50}
              accentColor="hsl(38 92% 50%)"
            />
          </div>
        )}

        {/* Content */}
        {!analysisLoading && (
          <div className="rounded overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
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
          </div>
        )}

        <NextStepButton
          stepNumber={5}
          label="Stress Test"
          color={theme.primary}
          onClick={() => { scrollToTop(); navigate(`${baseUrl}/stress-test`); }}
        />
      </main>
    </div>
  );
}
