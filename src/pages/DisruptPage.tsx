import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { HeroSection } from "@/components/HeroSection";
import { StepNavigator } from "@/components/StepNavigator";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { ReasoningSynopsis } from "@/components/ReasoningSynopsis";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton, StepNavBar } from "@/components/SectionNav";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import { scrollToTop } from "@/utils/scrollToTop";
import StructuralInterpretationsPanel from "@/components/StructuralInterpretationsPanel";
import { type StrategicHypothesis, rankWithProfile, adaptStrategicProfile } from "@/lib/strategicOS";
import { Brain, GitBranch, FileDown, Save, Lightbulb } from "lucide-react";
import { ModeBadge } from "@/components/ModeBadge";
import StrategicProfileSelector from "@/components/StrategicProfileSelector";
import { downloadReportAsPDF } from "@/lib/downloadReportPDF";
import { toast } from "sonner";

/* ── Section nav items for Disrupt page ── */
const DISRUPT_SECTIONS = [
  { id: "assumptions", label: "Assumptions", icon: Brain },
  { id: "reasoning", label: "Reasoning", icon: Lightbulb },
  { id: "hypotheses", label: "Hypotheses", icon: GitBranch },
] as const;

type DisruptSection = typeof DISRUPT_SECTIONS[number]["id"];

export default function DisruptPage() {
  const [activeSection, setActiveSection] = useState<DisruptSection>("assumptions");
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const scrollToSection = (id: DisruptSection) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

        {/* Compact header with archetype + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="typo-section-title">Disrupt</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StrategicProfileSelector
              profile={analysis.strategicProfile}
              onChangeProfile={analysis.setStrategicProfile}
            />
            <button onClick={() => {
              if (!selectedProduct) return;
              const data: Record<string, unknown> = {};
              if (analysis.disruptData) data.disrupt = analysis.disruptData;
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

        {/* ── Sticky Section Navigator ── */}
        {(hasSynopsis || hasHypotheses) && (
          <div className="sticky top-0 z-20 -mx-3 sm:-mx-6 px-3 sm:px-6 py-2" style={{ background: "hsl(var(--background))", borderBottom: "2px solid hsl(var(--border))" }}>
            <div className="flex gap-1">
              {DISRUPT_SECTIONS.map((section) => {
                const isDisabled = (section.id === "reasoning" && !hasSynopsis) || (section.id === "hypotheses" && !hasHypotheses);
                if (isDisabled) return null;
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all"
                    style={{
                      background: isActive ? "hsl(var(--foreground))" : "transparent",
                      color: isActive ? "hsl(var(--background))" : "hsl(var(--foreground))",
                      border: isActive ? "none" : "1.5px solid hsl(var(--border))",
                    }}
                  >
                    <Icon size={15} />
                    {section.label}
                    {section.id === "hypotheses" && hasHypotheses && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{
                        background: isActive ? "hsl(var(--background) / 0.2)" : "hsl(var(--primary) / 0.1)",
                        color: isActive ? "hsl(var(--background))" : "hsl(var(--primary))",
                      }}>
                        {rawHypotheses!.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Section: First Principles Analysis (Assumptions) ── */}
        <div ref={(el) => { sectionRefs.current.assumptions = el; }}>
          <div className="rounded overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <FirstPrinciplesAnalysis
              product={selectedProduct}
              onSaved={() => analysis.setSavedRefreshTrigger((n) => n + 1)}
              flippedIdeas={selectedProduct.flippedIdeas}
              onRegenerateIdeas={(ctx) => analysis.handleRegenerateIdeas(selectedProduct, ctx)}
              generatingIdeas={analysis.generatingIdeasFor === selectedProduct.id}
              externalData={analysis.disruptData}
              onAnalysisStarted={() => { analysis.setGovernedData(null); }}
              onDataLoaded={(d) => {
                analysis.setDisruptData(d);
                analysis.saveStepData("disrupt", d);
                analysis.markStepOutdated("redesign");
                analysis.markStepOutdated("stressTest");
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
              userScores={analysis.userScores}
              onScoreChange={(ideaId, scoreKey, value) => {
                analysis.setUserScore(ideaId, scoreKey, value);
                analysis.saveStepData("userScores", {
                  ...analysis.userScores,
                  [ideaId]: { ...(analysis.userScores[ideaId] || {}), [scoreKey]: value },
                });
              }}
            />
          </div>
        </div>

        {/* ── Section: Reasoning ── */}
        {hasSynopsis && (
          <div ref={(el) => { sectionRefs.current.reasoning = el; }}>
            <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--foreground))" }}>
                  <Lightbulb size={15} style={{ color: "hsl(var(--background))" }} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Strategic Reasoning</h3>
                  <p className="text-sm text-foreground/70">Review the AI's reasoning chain and challenge assumptions you disagree with.</p>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <ReasoningSynopsis
                  data={synopsisData}
                  analysisData={{ ...selectedProduct, governed: governedData } as any}
                  products={undefined}
                  title={selectedProduct?.name || ""}
                  category={analysis.analysisParams?.category || ""}
                  analysisType={(analysis.analysisParams as any)?.analysisType || (analysis.analysisParams as any)?.analysis_type || "product"}
                  avgScore={(selectedProduct as any)?.revivalScore ?? null}
                  analysisId={analysisId}
                  onApplyRevision={(revision: any) => {
                    const currentGoverned = analysis.governedData || {};
                    if (revision.type === "re_rank" && revision.payload?.hypotheses) {
                      analysis.setGovernedData({ ...currentGoverned, root_hypotheses: revision.payload.hypotheses });
                    } else if (revision.type === "update_assumption" && revision.payload) {
                      const synopsis = (currentGoverned as any)?.reasoning_synopsis || {};
                      const updatedAssumptions = synopsis.key_assumptions?.map((a: any) =>
                        a.assumption === revision.payload.target ? { ...a, ...revision.payload.updates } : a
                      ) || [];
                      analysis.setGovernedData({
                        ...currentGoverned,
                        reasoning_synopsis: { ...synopsis, key_assumptions: updatedAssumptions },
                      });
                    }
                    analysis.saveStepData("governed", analysis.governedData || currentGoverned);
                    analysis.markStepOutdated("redesign");
                    analysis.markStepOutdated("stressTest");
                    analysis.markStepOutdated("pitch");
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Section: Hypotheses ── */}
        {hasHypotheses && ranking && (
          <div ref={(el) => { sectionRefs.current.hypotheses = el; }}>
            <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--foreground))" }}>
                  <GitBranch size={15} style={{ color: "hsl(var(--background))" }} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Strategic Hypotheses</h3>
                  <p className="text-sm text-foreground/70">Select a hypothesis to focus all downstream steps on that strategic path.</p>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <StructuralInterpretationsPanel
                  ranking={ranking}
                  activeBranchId={analysis.activeBranchId}
                  analysisData={{ ...selectedProduct, governed: analysis.governedData }}
                  title={selectedProduct?.name || ""}
                  category={analysis.analysisParams?.category || ""}
                  onApplyRevision={(revision) => {
                    const currentGoverned = analysis.governedData || {};
                    if (revision.type === "new_hypothesis" && revision.payload) {
                      const existing = (currentGoverned as any)?.root_hypotheses || [];
                      const newH = { ...revision.payload, id: `user-hyp-${Date.now()}` };
                      analysis.setGovernedData({ ...currentGoverned, root_hypotheses: [...existing, newH] });
                      analysis.markStepOutdated("redesign");
                      analysis.markStepOutdated("stressTest");
                      analysis.markStepOutdated("pitch");
                    }
                  }}
                  onSelectBranch={(id) => {
                    const selected = rawHypotheses!.find(h => h.id === id);
                    if (selected) {
                      const signals: { selected_high_capital?: boolean; selected_high_risk?: boolean; selected_long_horizon?: boolean } = {};
                      if (selected.estimated_capital_required && selected.estimated_capital_required > 500_000) {
                        signals.selected_high_capital = true;
                      }
                      if (selected.constraint_type === "risk" || selected.fragility_score > 6) {
                        signals.selected_high_risk = true;
                      }
                      if (selected.estimated_time_to_impact_months && selected.estimated_time_to_impact_months > analysis.strategicProfile.time_horizon_months) {
                        signals.selected_long_horizon = true;
                      }
                      if (Object.keys(signals).length > 0) {
                        const evolved = adaptStrategicProfile(analysis.strategicProfile, signals);
                        analysis.setStrategicProfile(evolved);
                      }
                    }
                    analysis.setActiveBranchId(id);
                  }}
                />
              </div>
            </div>
          </div>
        )}

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