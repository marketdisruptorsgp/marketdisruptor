import React from "react";
import { StepLoadingTracker, STRESS_TEST_TASKS } from "@/components/StepLoadingTracker";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { HeroSection } from "@/components/HeroSection";
import { StepNavigator } from "@/components/StepNavigator";
import { CriticalValidation } from "@/components/CriticalValidation";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton, StepNavBar } from "@/components/SectionNav";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import { OutdatedBanner } from "@/components/OutdatedBanner";

import { scrollToTop } from "@/utils/scrollToTop";
import { ModeBadge } from "@/components/ModeBadge";
import StrategicProfileSelector from "@/components/StrategicProfileSelector";
import { downloadReportAsPDF } from "@/lib/downloadReportPDF";
import { gatherAllAnalysisData } from "@/lib/gatherAnalysisData";
import { FileDown, Save, RefreshCw, Swords } from "lucide-react";
import { toast } from "sonner";

export default function StressTestPage() {
  const [runTrigger, setRunTrigger] = React.useState(0);
  const [analysisLoading, setAnalysisLoading] = React.useState(false);
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();

  const { selectedProduct, analysisId } = analysis;

  if (analysis.step !== "done" || !selectedProduct) {
    if (shouldRedirectHome) return null;
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-primary" /></div>;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isOutdated = analysis.outdatedSteps.has("stressTest");

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        <ModeBadge />
        <StepNavigator
          steps={getStepConfigs(theme.primary)}
          activeStep={5}
          visitedSteps={new Set([2, 3, 4, 5])}
          onStepChange={(s) => {
            scrollToTop();
            if (s === 2) navigate(`${baseUrl}/report`);
            else if (s === 3) navigate(`${baseUrl}/disrupt`);
            else if (s === 4) navigate(`${baseUrl}/redesign`);
            else if (s === 6) navigate(`${baseUrl}/pitch`);
          }}
          outdatedSteps={analysis.outdatedSteps}
          accentColor={theme.primary}
        />

        <StepNavBar backLabel="Redesign" backPath={`${baseUrl}/redesign`} accentColor={theme.primary} />

        {isOutdated && <OutdatedBanner stepName="Stress Test" accentColor={theme.primary} />}

        {/* ── Stress Test Context Banner ── */}
        <div className="rounded-xl p-5 space-y-2.5" style={{ background: "hsl(var(--foreground))" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(350 80% 55%)" }}>
              <Swords size={18} style={{ color: "white" }} />
            </div>
            <h3 className="font-extrabold text-base leading-tight" style={{ color: "white" }}>Stress Test</h3>
          </div>
          <p className="text-sm leading-relaxed pl-[48px]" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
            Red Team vs Green Team adversarial debate — your idea is attacked and defended to expose blind spots, validate strengths, and deliver a clear survival judgment.
          </p>
        </div>


        {/* Analysis title — persistent across all steps */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground px-1">{selectedProduct.name}</h1>

        {/* Compact header with archetype + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="typo-section-title">Stress Test</h2>
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
              {analysis.stressTestData ? "Re-run Analysis" : "Run Analysis"}
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

        {/* Loading Tracker */}
        {analysisLoading && (
          <div className="rounded-xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <StepLoadingTracker
              title="Running Stress Test"
              tasks={STRESS_TEST_TASKS}
              estimatedSeconds={30}
              accentColor="hsl(350 80% 55%)"
            />
          </div>
        )}

        {/* Content — always mounted so loading lifecycle completes */}
        <div style={{ display: analysisLoading ? "none" : undefined }}>
          <div className="rounded overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <CriticalValidation
              product={selectedProduct}
              analysisData={selectedProduct}
              activeTab="debate"
              externalData={analysis.stressTestData}
              runTrigger={runTrigger}
              onLoadingChange={setAnalysisLoading}
              onDataLoaded={(d) => {
                analysis.setStressTestData(d);
                analysis.saveStepData("stressTest", d);
                analysis.clearStepOutdated("stressTest");
                analysis.markStepOutdated("pitch");
              }}
            />
          </div>
        </div>

        {/* No gating */}
        <NextStepButton
          stepNumber={6}
          label="Pitch Deck"
          color={theme.primary}
          onClick={() => { scrollToTop(); navigate(`${baseUrl}/pitch`); }}
        />
      </main>
    </div>
  );
}
