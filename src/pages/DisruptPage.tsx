import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { HeroSection } from "@/components/HeroSection";
import { StepNavigator } from "@/components/StepNavigator";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton, StepNavBar } from "@/components/SectionNav";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import { scrollToTop } from "@/utils/scrollToTop";
import { type StrategicHypothesis, rankWithProfile } from "@/lib/strategicOS";
import { Target, Layers, Wrench, FileDown, Save } from "lucide-react";
import { ModeBadge } from "@/components/ModeBadge";
import StrategicProfileSelector from "@/components/StrategicProfileSelector";
import { downloadReportAsPDF } from "@/lib/downloadReportPDF";
import { gatherAllAnalysisData } from "@/lib/gatherAnalysisData";
import { toast } from "sonner";
import { SignalTab } from "@/components/strategic/SignalTab";
import { StructureTab } from "@/components/strategic/StructureTab";
import { RedesignTab } from "@/components/strategic/RedesignTab";

const TABS = [
  { id: "signal" as const, label: "Signal", icon: Target, description: "Executive decision layer" },
  { id: "structure" as const, label: "Structure", icon: Layers, description: "System mechanics" },
  { id: "redesign" as const, label: "Redesign", icon: Wrench, description: "Action strategies" },
];

type TabId = typeof TABS[number]["id"];

export default function DisruptPage() {
  const [activeTab, setActiveTab] = useState<TabId>("signal");
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
  const governedData = analysis.governedData;
  const synopsisData = governedData?.reasoning_synopsis ?? null;
  const hasDisruptData = !!analysis.disruptData;
  const cm = governedData?.constraint_map as Record<string, unknown> | undefined;
  const rawHypotheses = (cm?.root_hypotheses || governedData?.root_hypotheses) as StrategicHypothesis[] | undefined;
  const hasHypotheses = hasDisruptData && rawHypotheses && rawHypotheses.length > 0;
  const hasSynopsis = hasDisruptData && !!synopsisData;
  const ranking = hasHypotheses ? rankWithProfile(rawHypotheses!, analysis.strategicProfile) : null;

  // If no disrupt data yet, default to Structure tab (where the run button lives)
  const effectiveTab = !hasDisruptData && activeTab !== "structure" ? "structure" : activeTab;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        <ModeBadge />
        <StepNavigator
          steps={getStepConfigs(theme.primary)}
          activeStep={3}
          visitedSteps={new Set([2, 3])}
          onStepChange={(s) => {
            scrollToTop();
            if (s === 2) navigate(`${baseUrl}/report`);
            else if (s === 4) navigate(`${baseUrl}/redesign`);
            else if (s === 5) navigate(`${baseUrl}/stress-test`);
            else if (s === 6) navigate(`${baseUrl}/pitch`);
          }}
          outdatedSteps={analysis.outdatedSteps}
          accentColor={theme.primary}
        />

        <StepNavBar backLabel="Intelligence Report" backPath={`${baseUrl}/report`} accentColor={theme.primary} />

        {/* Header: title + archetype + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="typo-section-title">Strategic Intelligence</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StrategicProfileSelector
              profile={analysis.strategicProfile}
              onChangeProfile={analysis.setStrategicProfile}
            />
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

        {/* ── 3-Tab Navigation ── */}
        <div className="sticky top-0 z-20 -mx-3 sm:-mx-6 px-3 sm:px-6 py-2" style={{ background: "hsl(var(--background))", borderBottom: "2px solid hsl(var(--border))" }}>
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = effectiveTab === tab.id;
              const isDisabled = !hasDisruptData && tab.id !== "structure";
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all"
                  style={{
                    background: isActive ? "hsl(var(--foreground))" : "transparent",
                    color: isActive ? "hsl(var(--background))" : isDisabled ? "hsl(var(--muted-foreground))" : "hsl(var(--foreground))",
                    border: isActive ? "none" : "1.5px solid hsl(var(--border))",
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="min-h-[400px]">
          {effectiveTab === "signal" && (
            <SignalTab
              disruptData={analysis.disruptData as Record<string, unknown> | null}
              governedData={governedData as Record<string, unknown> | null}
              hypotheses={hasHypotheses ? rawHypotheses! : null}
              analysisType={(analysis.analysisParams as any)?.analysisType || "product"}
              lastUpdated={new Date().toISOString()}
            />
          )}

          {effectiveTab === "structure" && (
            <StructureTab
              selectedProduct={selectedProduct}
              analysis={analysis}
              governedData={governedData as Record<string, unknown> | null}
              synopsisData={synopsisData}
              rawHypotheses={hasHypotheses ? rawHypotheses! : null}
              hasDisruptData={hasDisruptData}
              hasSynopsis={hasSynopsis}
              hasHypotheses={hasHypotheses}
              ranking={ranking}
              products={products}
            />
          )}

          {effectiveTab === "redesign" && (
            <RedesignTab
              disruptData={analysis.disruptData as Record<string, unknown> | null}
              hypotheses={hasHypotheses ? rawHypotheses! : null}
              governedData={governedData as Record<string, unknown> | null}
            />
          )}
        </div>

        <NextStepButton
          stepNumber={4}
          label="Redesign"
          color={theme.primary}
          onClick={() => { scrollToTop(); navigate(`${baseUrl}/redesign`); }}
        />
      </main>
    </div>
  );
}
