import React, { useState, useMemo } from "react";
import { PricingIntelCard } from "@/components/PricingIntelCard";
import { InsightSnapshotPanel } from "@/components/analysis/InsightSnapshotPanel";
import { PipelineProgressBar } from "@/components/analysis/PipelineProgressBar";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { isServiceCategory } from "@/utils/normalizeProduct";
import { toast } from "sonner";
import { KeyTakeawayBanner, getCommunityTakeaway, getPricingTakeaway, getSupplyChainTakeaway, getVerdictBadges, getWorkflowTakeaway } from "@/components/KeyTakeawayBanner";
import { AdaptiveJourneyMap } from "@/components/AdaptiveJourneyMap";
import { useNavigate } from "react-router-dom";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useModeTheme } from "@/hooks/useModeTheme";
import { LoadingTracker } from "@/components/LoadingTracker";
import { getStepConfigs } from "@/lib/stepConfigs";
import { AnalysisVisualLayer } from "@/components/AnalysisVisualLayer";
import { PatentIntelligence } from "@/components/PatentIntelligence";
import { ObservedSignalMatrix } from "@/components/ObservedSignalMatrix";
import { ProjectNotesEditor } from "@/components/portfolio/ProjectNotesEditor";
import { ScoreBar } from "@/components/ScoreBar";
import { NextStepButton } from "@/components/SectionNav";
import { scrollToTop } from "@/utils/scrollToTop";
import { buildInsightGraph } from "@/lib/insightGraph";
import { buildSystemIntelligence, type SystemIntelligenceInput } from "@/lib/systemIntelligence";
import { StrategicDashboard } from "@/components/analysis/StrategicDashboard";
import {
  Target, RefreshCw,
  ExternalLink, MessageSquare,
  DollarSign, Package, Store, Truck,
  Factory,
  ShieldAlert, Lightbulb,
  Clock, ScrollText, StickyNote,
  LayoutDashboard,
} from "lucide-react";
import type { Product } from "@/data/mockProducts";

// ── Shared layout components ──
import {
  AnalysisPageShell,
  AnalysisStepHeader,
  AnalysisActionToolbar,
  AnalysisTabBar,
  AnalysisDivider,
  AnalysisContextBanner,
  AnalysisSectionCard,
  AnalysisLoadingSpinner,
  type TabDef,
} from "@/components/analysis/AnalysisPageShell";

// ── Standardized analysis components ──
import {
  StepCanvas,
  InsightCard,
  FrameworkPanel,
  SignalCard,
  MetricCard,
  VisualGrid,
  ExpandableDetail,
  SignalCluster,
  SignalPillRow,
} from "@/components/analysis/AnalysisComponents";

/* ── Section tab config ── */
function getAvailableSections(selectedProduct: any, isService: boolean, businessAnalysisData?: any): TabDef[] {
  const tabs: TabDef[] = [
    { id: "dashboard", label: "Command Deck", icon: LayoutDashboard },
    { id: "overview", label: "Overview", icon: Target },
  ];
  const uw = (selectedProduct as any).userWorkflow || (selectedProduct as any).userJourney;
  const uwSteps = uw?.stepByStep || uw?.steps;
  // Also check businessAnalysisData for user journey / workflow
  const buw = businessAnalysisData?.userWorkflow || businessAnalysisData?.userJourney || businessAnalysisData?.customerJourney;
  const buwSteps = buw?.stepByStep || buw?.steps || (Array.isArray(buw) ? buw : null);
  if ((uwSteps?.length > 0) || (buwSteps?.length > 0)) tabs.push({ id: "journey", label: "User Journey", icon: Clock });

  const ci = (selectedProduct as any).communityInsights || businessAnalysisData?.communityInsights || businessAnalysisData?.customerSentiment;
  if (ci) tabs.push({ id: "community", label: "Community Intel", icon: MessageSquare });

  const pricing = selectedProduct.pricingIntel || businessAnalysisData?.pricingIntel || businessAnalysisData?.pricing || businessAnalysisData?.revenueModel;
  if (pricing) tabs.push({ id: "pricing", label: "Pricing Intel", icon: DollarSign });

  const supply = selectedProduct.supplyChain || businessAnalysisData?.supplyChain || businessAnalysisData?.valueChain;
  if (!isService && supply) tabs.push({ id: "supply", label: "Supply Chain", icon: Package });

  if (!isService) tabs.push({ id: "patents", label: "Patent Intel", icon: ScrollText });
  return tabs;
}

export default function ReportPage() {
  const analysis = useAnalysis();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const [isSaving, setIsSaving] = React.useState(false);
  const [refreshingJourney, setRefreshingJourney] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("dashboard");

  const handleRefreshJourney = async () => {
    if (!selectedProduct || refreshingJourney) return;
    setRefreshingJourney(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("first-principles-analysis", {
        body: { product: selectedProduct, refreshWorkflowOnly: true },
      });
      if (error || !result?.success) {
        toast.error("Failed to refresh user journey");
        return;
      }
      const newWorkflow = result.analysis?.userWorkflow;
      if (!newWorkflow) { toast.error("No journey data returned."); return; }
      const updatedProduct = { ...selectedProduct, userWorkflow: newWorkflow } as Product;
      const updatedProducts = analysis.products.map(p => p.name === selectedProduct.name ? updatedProduct : p);
      analysis.setProducts(updatedProducts);
      analysis.setSelectedProduct(updatedProduct);
      await analysis.saveStepData("products", JSON.parse(JSON.stringify(updatedProducts)));
      toast.success("User journey refreshed.");
    } catch (err) {
      toast.error("Error: " + String(err));
    } finally {
      setRefreshingJourney(false);
    }
  };

  const { products, selectedProduct: rawSelectedProduct, analysisParams, analysisId } = analysis;
  // Synthetic product for business model analyses
  const selectedProduct = rawSelectedProduct || (analysis.businessAnalysisData ? {
    id: analysisId || "business-model", name: (analysis.businessModelInput as any)?.type || "Business Model",
    category: "Business", image: "", revivalScore: null, flippedIdeas: [],
  } as any : null);
  const { shouldRedirectHome } = useHydrationGuard();
  const isRunning = analysis.step === "scraping" || analysis.step === "analyzing";
  const autoAnalysis = useAutoAnalysis();

  const modeAccent = theme.primary;

  // Build intelligence + graph for dashboard (hooks must be before early returns)
  const intelligence = useMemo(() => {
    if (!selectedProduct || !analysisId) return null;
    try {
      const input: SystemIntelligenceInput = {
        analysisId,
        governedData: analysis.governedData,
        disruptData: analysis.disruptData as Record<string, unknown> | null,
        businessAnalysisData: analysis.businessAnalysisData as Record<string, unknown> | null,
        intelData: null,
        flipIdeas: null,
        activeLenses: [],
      };
      return buildSystemIntelligence(input);
    } catch { return null; }
  }, [selectedProduct, analysisId, analysis.disruptData, analysis.governedData, analysis.businessAnalysisData]);

  const graph = useMemo(() => {
    return buildInsightGraph(
      products,
      intelligence,
      analysis.disruptData,
      analysis.redesignData,
      analysis.stressTestData,
    );
  }, [products, intelligence, analysis.disruptData, analysis.redesignData, analysis.stressTestData]);

  const completedSteps = useMemo(() => {
    const set = new Set<string>();
    if (products.length > 0) set.add("report");
    if (analysis.disruptData) set.add("disrupt");
    if (analysis.redesignData) set.add("redesign");
    if (analysis.stressTestData) set.add("stress-test");
    if (analysis.pitchDeckData) set.add("pitch");
    return set;
  }, [products, analysis.disruptData, analysis.redesignData, analysis.stressTestData, analysis.pitchDeckData]);

  if (isRunning) {
    return (
      <AnalysisPageShell tier={tier}>
        <LoadingTracker
          step={analysis.step as "scraping" | "analyzing"}
          elapsedSeconds={analysis.elapsedSeconds}
          loadingLog={analysis.loadingLog}
        />
      </AnalysisPageShell>
    );
  }

  // Business model analyses don't have selectedProduct — use businessAnalysisData as fallback
  const hasData = !!selectedProduct || !!analysis.businessAnalysisData;
  if (analysis.step !== "done" || (!hasData && products.length === 0)) {
    if (shouldRedirectHome) return null;
    // Show meaningful empty state instead of infinite spinner
    if (analysis.step === "done" && !hasData) {
      return (
        <AnalysisPageShell tier={tier}>
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-muted">
              <Target size={24} className="text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-bold text-foreground">Analysis Not Yet Complete</p>
              <p className="text-sm text-muted-foreground max-w-md">
                This analysis hasn't been completed yet. Return to the Command Deck to run the full analysis.
              </p>
            </div>
            <button
              onClick={() => navigate(analysisId ? `/analysis/${analysisId}/command-deck` : "/")}
              className="mt-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Go to Command Deck
            </button>
          </div>
        </AnalysisPageShell>
      );
    }
    return <AnalysisLoadingSpinner message="Loading analysis..." />;
  }

  const isService = selectedProduct?.category === "Service" || isServiceCategory(selectedProduct?.category || "");
  const baseUrl = `/analysis/${analysisId}`;
  const biz = analysis.businessAnalysisData as Record<string, unknown> | null;
  const ci = selectedProduct ? ((selectedProduct as any).communityInsights || (selectedProduct as any).customerSentiment || (biz as any)?.communityInsights || (biz as any)?.customerSentiment) : null;
  const uw = selectedProduct ? ((selectedProduct as any).userWorkflow || (selectedProduct as any).userJourney || (biz as any)?.userWorkflow || (biz as any)?.userJourney || (biz as any)?.customerJourney) : null;
  const uwSteps = uw?.stepByStep || uw?.steps || (Array.isArray(uw) ? uw : null);
  const sectionTabs = selectedProduct ? getAvailableSections(selectedProduct, isService, biz) : [
    { id: "dashboard", label: "Command Deck", icon: LayoutDashboard },
  ];

  return (
    <AnalysisPageShell tier={tier}>
      <AnalysisStepHeader
        steps={getStepConfigs(modeAccent)}
        activeStep={2}
        visitedSteps={new Set([2])}
        onStepChange={(s) => {
          if (s === 3) navigate(`${baseUrl}/disrupt`);
          else if (s === 4) navigate(`${baseUrl}/redesign`);
          else if (s === 5) navigate(`${baseUrl}/stress-test`);
          else if (s === 6) navigate(`${baseUrl}/pitch`);
        }}
        accentColor={modeAccent}
        backLabel="Home"
        backPath="/"
        analysisId={analysisId}
      />

      <AnalysisActionToolbar
        analysisTitle={selectedProduct?.name || (analysis.businessModelInput as any)?.type || "Business Analysis"}
        stepTitle="Intelligence Report"
        analysis={analysis}
        selectedProduct={selectedProduct}
        analysisId={analysisId}
        accentColor={modeAccent}
        onRun={() => {
          if (analysis.activeMode === "business") {
            navigate(`/analysis/new`);
          } else {
            navigate(`/analysis/new`);
          }
        }}
        strategicProfile={analysis.strategicProfile}
        onChangeProfile={analysis.setStrategicProfile}
      />

      <AnalysisTabBar
        tabs={sectionTabs}
        activeTab={activeSection}
        onTabChange={setActiveSection}
        accentColor={modeAccent}
      />

      <AnalysisDivider />


      {/* ── Strategic Command Deck — dashboard tab ── */}
      {activeSection === "dashboard" && (
        <StrategicDashboard
          analysisId={analysisId || ""}
          analysisTitle={selectedProduct?.name || (analysis.businessModelInput as any)?.type || "Business Analysis"}
          accentColor={modeAccent}
          graph={graph}
          commandDeck={intelligence?.commandDeck ?? null}
          completedSteps={completedSteps}
          outdatedSteps={analysis.outdatedSteps}
          onRunStep={(stepKey) => {
            const baseUrl = `/analysis/${analysisId}`;
            navigate(`${baseUrl}/${stepKey}`);
          }}
        />
      )}

      {/* ── Intelligence Report Context Banner — overview only ── */}
      {activeSection === "overview" && (
        <AnalysisContextBanner
          icon={Target}
          title="Intelligence Report"
          description="A consolidated view of pricing, supply chain, community sentiment, and competitive positioning — each finding tagged by confidence level."
          iconColor={modeAccent}
        />
      )}

      {/* Observed Signal Matrix — overview only */}
      {activeSection === "overview" && (
        <ObservedSignalMatrix
          product={selectedProduct}
          analysisId={analysisId || null}
          saveStepData={analysis.saveStepData}
        />
      )}

      {/* ── Active Section Content ── */}
      {activeSection === "overview" && (
        <AnalysisVisualLayer
          analysis={selectedProduct as unknown as Record<string, unknown>}
          step="report"
          governedOverride={analysis.governedData}
        >
          <StepCanvas>
            {/* Key Insight — visual-first, leads the section */}
            {selectedProduct.keyInsight && (
              <InsightCard
                icon={Target}
                headline={selectedProduct.keyInsight}
                accentColor={modeAccent}
                badge={selectedProduct.marketSizeEstimate ? `TAM: ${selectedProduct.marketSizeEstimate}` : undefined}
                badgeColor="hsl(152 60% 44%)"
              >
                {/* Score bars — visual signal density */}
                <VisualGrid columns={3}>
                  <MetricCard
                    label="Adoption"
                    value={`${selectedProduct.confidenceScores?.adoptionLikelihood ?? 7}/10`}
                    accentColor={modeAccent}
                  />
                  <MetricCard
                    label="Feasibility"
                    value={`${selectedProduct.confidenceScores?.feasibility ?? 7}/10`}
                    accentColor={modeAccent}
                  />
                  <MetricCard
                    label="Resonance"
                    value={`${selectedProduct.confidenceScores?.emotionalResonance ?? 8}/10`}
                    accentColor={modeAccent}
                  />
                </VisualGrid>

                {/* Key signal pills — quick visual scan */}
                {(() => {
                  const pills: string[] = [];
                  if (selectedProduct.trendAnalysis) pills.push(selectedProduct.trendAnalysis.split('.')[0]);
                  const ci = (selectedProduct as any).communityInsights;
                  if (ci?.topComplaints?.[0]) pills.push(ci.topComplaints[0]);
                  if (ci?.improvementRequests?.[0]) pills.push(ci.improvementRequests[0]);
                  if ((selectedProduct.pricingIntel as any)?.strategy) pills.push((selectedProduct.pricingIntel as any).strategy);
                  return pills.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Key Signals</p>
                      <SignalPillRow signals={pills} max={4} accentColor={modeAccent} />
                    </div>
                  ) : null;
                })()}
              </InsightCard>
            )}

            {/* Description — expandable detail, not a wall of text */}
            {selectedProduct.description && (
              <InsightCard
                headline="Market Context"
                subtext={selectedProduct.description.length > 120 ? selectedProduct.description.slice(0, 120) + "…" : selectedProduct.description}
                detail={
                  <div className="space-y-3">
                    <p>{selectedProduct.description}</p>
                    {selectedProduct.trendAnalysis && (
                      <p className="text-muted-foreground">{selectedProduct.trendAnalysis}</p>
                    )}
                    {selectedProduct.sources?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedProduct.sources.map((src: any) => (
                          <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-primary/5 text-primary">
                            <ExternalLink size={9} /> {src.label?.slice(0, 30)}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                }
              />
            )}
          </StepCanvas>
        </AnalysisVisualLayer>
      )}

      {activeSection === "journey" && uwSteps?.length > 0 && (
        <AnalysisSectionCard icon={Clock} title="User Journey"
          action={
            <button
              onClick={handleRefreshJourney}
              disabled={refreshingJourney}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-muted border border-border text-foreground disabled:opacity-50"
            >
              <RefreshCw size={12} className={refreshingJourney ? "animate-spin" : ""} />
              {refreshingJourney ? "Refreshing..." : "Refresh"}
            </button>
          }
        >
          <AdaptiveJourneyMap
            steps={uwSteps}
            frictionPoints={uw.frictionPoints || []}
            cognitiveLoad={uw.cognitiveLoad}
            contextOfUse={uw.contextOfUse}
            category={selectedProduct?.category}
            productName={selectedProduct?.name}
          />
        </AnalysisSectionCard>
      )}

      {activeSection === "community" && ci && (
        <FrameworkPanel icon={MessageSquare} title="Community Intel" subtitle="Aggregated sentiment from user reviews and community discussions">
          {(() => {
            const sentiment = ci.communitySentiment || ci.redditSentiment;
            const hasReal = sentiment && !/no direct.*found|not found/i.test(sentiment);
            return (
              <div className="space-y-4">
                {hasReal && (
                  <InsightCard headline="Community Sentiment" subtext={sentiment} accentColor="hsl(217 91% 45%)" />
                )}

                {/* Aggregated complaint clusters — visual signal visualization */}
                {ci.topComplaints?.length > 0 && (
                  <SignalCluster
                    title="Top Complaints"
                    items={ci.topComplaints.map((c: string, i: number) => ({
                      theme: c,
                      count: Math.max(1, ci.topComplaints.length - i),
                      type: "complaint" as const,
                    }))}
                  />
                )}

                {/* Improvement request clusters */}
                {ci.improvementRequests?.length > 0 && (
                  <SignalCluster
                    title="Improvement Requests"
                    items={ci.improvementRequests.map((r: string, i: number) => ({
                      theme: r,
                      count: Math.max(1, ci.improvementRequests.length - i),
                      type: "request" as const,
                    }))}
                  />
                )}

                {/* Signal pills for quick scan */}
                {(() => {
                  const allSignals = [
                    ...(ci.topComplaints || []).slice(0, 2),
                    ...(ci.improvementRequests || []).slice(0, 2),
                  ].filter(Boolean);
                  return allSignals.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Key Signals</p>
                      <SignalPillRow signals={allSignals} max={6} />
                    </div>
                  ) : null;
                })()}

                {selectedProduct.reviews?.length > 0 && (
                  <ExpandableDetail label={`${selectedProduct.reviews.length} Reviews`} icon={MessageSquare}>
                    <div className="space-y-2 mt-2">
                      {selectedProduct.reviews.map((review: any, i: number) => (
                        <SignalCard
                          key={i}
                          label={review.text}
                          type={review.sentiment === "positive" ? "strength" : review.sentiment === "negative" ? "weakness" : "neutral"}
                        />
                      ))}
                    </div>
                  </ExpandableDetail>
                )}
              </div>
            );
          })()}
        </FrameworkPanel>
      )}

      {activeSection === "pricing" && (() => {
        const pricingData = selectedProduct.pricingIntel || (biz as any)?.pricingIntel || (biz as any)?.pricing || (biz as any)?.revenueModel;
        return pricingData ? (
          <AnalysisSectionCard icon={DollarSign} title="Pricing Intel">
            <PricingIntelCard pricingIntel={pricingData} />
          </AnalysisSectionCard>
        ) : null;
      })()}

      {activeSection === "supply" && !isService && (() => {
        const supplyData = selectedProduct.supplyChain || (biz as any)?.supplyChain || (biz as any)?.valueChain;
        return supplyData ? (
          <AnalysisSectionCard icon={Package} title="Supply Chain">
            <SupplySection title="Manufacturers" icon={<Factory size={11} />}
              items={(supplyData.manufacturers || []).map((m: any) => ({ name: m.name || m, badge: m.region || "—", detail: m.specialty || m.notes || "", url: m.url }))} />
            <SupplySection title="Distributors" icon={<Truck size={11} />}
              items={(supplyData.distributors || []).map((d: any) => ({ name: d.name || d, badge: d.region || "—", detail: d.specialty || d.notes || "", url: d.url }))} />
            <SupplySection title="Retailers" icon={<Store size={11} />}
              items={(supplyData.retailers || []).map((r: any) => ({ name: r.name || r, badge: r.type || "—", detail: r.notes || "", url: r.url }))} />
          </AnalysisSectionCard>
        ) : null;
      })()}

      {activeSection === "patents" && !isService && (
        <AnalysisSectionCard icon={ScrollText} title="Patent Intelligence">
          <PatentIntelligence product={selectedProduct} />
        </AnalysisSectionCard>
      )}

      <ProjectNotesSection analysisId={analysisId} saveStepData={analysis.saveStepData} />

      {/* Pipeline Progress Bar */}
      <PipelineProgressBar
        completedSteps={autoAnalysis.completedSteps}
        outdatedSteps={analysis.outdatedSteps}
        currentStep="report"
        accentColor={modeAccent}
      />

      <NextStepButton
        stepNumber={3}
        label="Disrupt"
        color={modeAccent}
        onClick={() => { scrollToTop(); navigate(`${baseUrl}/disrupt`); }}
      />
    </AnalysisPageShell>
  );
}

/* ── Page-specific helper components ── */

function ProjectNotesSection({ analysisId, saveStepData }: { analysisId: string | null; saveStepData: (key: string, data: unknown) => Promise<void> }) {
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    if (!analysisId || loaded) return;
    (async () => {
      const { data } = await (supabase.from("saved_analyses") as any)
        .select("analysis_data")
        .eq("id", analysisId)
        .single();
      const ad = data?.analysis_data as Record<string, unknown> | null;
      setNotes((ad?.projectNotes as string) || "");
      setLoaded(true);
    })();
  }, [analysisId, loaded]);

  const handleSave = async (text: string) => {
    setNotes(text);
    await saveStepData("projectNotes", text);
  };

  return (
    <div className="rounded-lg p-4 bg-muted border border-border">
      <p className="typo-card-eyebrow mb-2 flex items-center gap-1.5">
        <StickyNote size={11} /> Project Notes
      </p>
      <ProjectNotesEditor value={notes} onSave={handleSave} compact />
    </div>
  );
}

function SupplySection({ title, icon, items }: {
  title: string; icon: React.ReactNode;
  items: { name: string; badge: string; detail: string; url?: string }[];
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="typo-card-eyebrow mb-1.5 flex items-center gap-2">{icon} {title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.name} className="p-2.5 rounded-lg flex items-start justify-between gap-2 bg-muted border border-border">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">{item.badge}</span>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-xs text-primary">
                  <ExternalLink size={9} /> Visit
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
