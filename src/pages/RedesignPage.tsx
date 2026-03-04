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
import { FileDown, Save, RefreshCw, FlipHorizontal, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";

const { useState } = React;

const REDESIGN_TABS = [
  { id: "flip" as const, label: "Flip the Logic", icon: FlipHorizontal },
  { id: "ideas" as const, label: "Flipped Ideas", icon: Zap },
  { id: "concept" as const, label: "Redesigned Concept", icon: Sparkles },
];

type RedesignTabId = typeof REDESIGN_TABS[number]["id"];

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
    if (shouldRedirectHome) return null;
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-primary" /></div>;
  }

  const baseUrl = `/analysis/${analysisId}`;
  const isOutdated = analysis.outdatedSteps.has("redesign");
  const shouldAutoTrigger = isOutdated || !analysis.redesignData;
  const hasData = !!analysis.redesignData;

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

        <StepNavBar backLabel="Deconstruct" backPath={`${baseUrl}/disrupt`} accentColor={theme.primary} />

        {isOutdated && (
          <OutdatedBanner
            stepName="Redesign"
            accentColor={theme.primary}
          />
        )}

        {/* ActiveHypothesisBanner hidden on Redesign — not actionable here */}

        {/* Analysis title — persistent across all steps */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground px-1">{selectedProduct.name}</h1>

        {/* Compact header with archetype + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="typo-section-title">Redesign</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StrategicProfileSelector
              profile={analysis.strategicProfile}
              onChangeProfile={analysis.setStrategicProfile}
            />
            <button
              onClick={() => { setRunTrigger(t => t + 1); setActiveTab("flip"); }}
              disabled={analysisLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all"
              style={{
                background: analysisLoading ? "hsl(var(--primary) / 0.6)" : "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                opacity: analysisLoading ? 0.7 : 1,
              }}
            >
              {analysisLoading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {hasData ? "Re-run Analysis" : "Run Analysis"}
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

        {/* ── Section Tab Bubbles — matching Intel Report & Disrupt ── */}
        <div className="flex flex-wrap items-center gap-2">
          {REDESIGN_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  background: isActive ? theme.primary : "hsl(var(--muted))",
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

        {/* ── Divider ── */}
        <div className="h-px w-full" style={{ background: "hsl(var(--border))" }} />

        {/* ── Redesign Context Banner (black with white text) ── */}
        <div className="rounded-xl p-5 space-y-2.5" style={{ background: "hsl(var(--foreground))" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(38 92% 50%)" }}>
              <Sparkles size={18} style={{ color: "white" }} />
            </div>
            <h3 className="font-extrabold text-base leading-tight" style={{ color: "white" }}>Redesign Concept</h3>
          </div>
          <p className="text-sm font-bold leading-relaxed pl-[48px]" style={{ color: "white" }}>
            Every assumption from Disrupt is inverted, recombined, and synthesized into bold product concepts — grounded in flipped logic and upstream intelligence. Each idea traces back to a specific structural constraint.
          </p>
        </div>

        {/* ── Concept Visuals — auto-generate right after banner ── */}
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

        {/* Content — always mounted so loading callbacks work */}
        <div className={analysisLoading ? "hidden" : "rounded overflow-hidden p-4 sm:p-6"} style={analysisLoading ? undefined : { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
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
        </div>

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
