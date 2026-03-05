import React, { useState } from "react";
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
import {
  Target, RefreshCw,
  ExternalLink, MessageSquare,
  DollarSign, Package, Store, Truck,
  Factory,
  ShieldAlert, Lightbulb,
  Clock, ScrollText, StickyNote,
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

/* ── Section tab config ── */
function getAvailableSections(selectedProduct: any, isService: boolean): TabDef[] {
  const tabs: TabDef[] = [
    { id: "overview", label: "Overview", icon: Target },
  ];
  const uw = (selectedProduct as any).userWorkflow || (selectedProduct as any).userJourney;
  const uwSteps = uw?.stepByStep || uw?.steps;
  if (uwSteps?.length > 0) tabs.push({ id: "journey", label: "User Journey", icon: Clock });
  const ci = (selectedProduct as any).communityInsights;
  if (ci) tabs.push({ id: "community", label: "Community Intel", icon: MessageSquare });
  if (selectedProduct.pricingIntel) tabs.push({ id: "pricing", label: "Pricing Intel", icon: DollarSign });
  if (!isService && selectedProduct.supplyChain) tabs.push({ id: "supply", label: "Supply Chain", icon: Package });
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
  const [activeSection, setActiveSection] = useState<string>("overview");

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

  const { products, selectedProduct, analysisParams, analysisId } = analysis;
  const { shouldRedirectHome } = useHydrationGuard();
  const isRunning = analysis.step === "scraping" || analysis.step === "analyzing";

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

  if (analysis.step !== "done" || products.length === 0 || !selectedProduct) {
    if (shouldRedirectHome) return null;
    return <AnalysisLoadingSpinner message="Loading analysis..." />;
  }

  const modeAccent = theme.primary;
  const isService = selectedProduct?.category === "Service" || isServiceCategory(selectedProduct?.category || "");
  const baseUrl = `/analysis/${analysisId}`;
  const ci = (selectedProduct as any).communityInsights || (selectedProduct as any).customerSentiment;
  const uw = (selectedProduct as any).userWorkflow || (selectedProduct as any).userJourney;
  const uwSteps = uw?.stepByStep || uw?.steps;
  const sectionTabs = getAvailableSections(selectedProduct, isService);

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
      />

      <AnalysisActionToolbar
        analysisTitle={selectedProduct.name}
        stepTitle="Intelligence Report"
        analysis={analysis}
        selectedProduct={selectedProduct}
        analysisId={analysisId}
        accentColor={modeAccent}
        hideRun
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
          <AnalysisSectionCard icon={Target} title="Overview">
            {selectedProduct.keyInsight && (
              <div className="insight-callout mb-3">
                <p className="typo-card-body font-semibold leading-snug">{selectedProduct.keyInsight}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-3">
                {selectedProduct.description && (
                  <p className="typo-card-body text-foreground/80 leading-relaxed">{selectedProduct.description}</p>
                )}
                {selectedProduct.marketSizeEstimate && (
                  <p className="typo-card-body font-semibold text-green-700">TAM: {selectedProduct.marketSizeEstimate}</p>
                )}
              </div>
              <div className="space-y-2">
                <ScoreBar label="Adoption" score={selectedProduct.confidenceScores?.adoptionLikelihood ?? 7} />
                <ScoreBar label="Feasibility" score={selectedProduct.confidenceScores?.feasibility ?? 7} />
                <ScoreBar label="Resonance" score={selectedProduct.confidenceScores?.emotionalResonance ?? 8} />
              </div>
            </div>
            {selectedProduct.trendAnalysis && (
              <p className="typo-card-body text-foreground/70 leading-relaxed mt-3">{selectedProduct.trendAnalysis}</p>
            )}
            {selectedProduct.sources?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedProduct.sources.map((src: any) => (
                  <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded typo-card-meta font-medium bg-primary/5 text-primary">
                    <ExternalLink size={9} /> {src.label?.slice(0, 30)}
                  </a>
                ))}
              </div>
            )}
          </AnalysisSectionCard>
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
        <AnalysisSectionCard icon={MessageSquare} title="Community Intel">
          {(() => {
            const sentiment = ci.communitySentiment || ci.redditSentiment;
            const hasReal = sentiment && !/no direct.*found|not found/i.test(sentiment);
            return (
              <div className="space-y-3">
                {hasReal && <p className="typo-card-body text-foreground/80">{sentiment}</p>}
                {ci.topComplaints?.length > 0 && (
                  <div className="space-y-1">
                    <p className="typo-card-eyebrow">Complaints</p>
                    {ci.topComplaints.map((c: string, i: number) => (
                      <div key={i} className="flex gap-2 items-start typo-card-body">
                        <ShieldAlert size={10} className="text-destructive flex-shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{c}</span>
                      </div>
                    ))}
                  </div>
                )}
                {ci.improvementRequests?.length > 0 && (
                  <div className="space-y-1">
                    <p className="typo-card-eyebrow">Requests</p>
                    {ci.improvementRequests.map((r: string, i: number) => (
                      <div key={i} className="flex gap-2 items-start typo-card-body">
                        <Lightbulb size={10} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{r}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedProduct.reviews?.length > 0 && (
                  <div className="space-y-1">
                    <p className="typo-card-eyebrow">Reviews</p>
                    {selectedProduct.reviews.map((review: any, i: number) => (
                      <div key={i} className="flex gap-2 items-start text-xs">
                        <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${review.sentiment === "positive" ? "bg-green-500" : review.sentiment === "negative" ? "bg-red-500" : "bg-yellow-500"}`} />
                        <span className="text-foreground/80">{review.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </AnalysisSectionCard>
      )}

      {activeSection === "pricing" && selectedProduct.pricingIntel && (
        <AnalysisSectionCard icon={DollarSign} title="Pricing Intel">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: "Market Price", value: selectedProduct.pricingIntel.currentMarketPrice },
              { label: "Original Price", value: (selectedProduct.pricingIntel as any).originalRetailPrice },
              { label: "Price Direction", value: selectedProduct.pricingIntel.priceDirection },
              { label: "Margin Estimate", value: (selectedProduct.pricingIntel as any).marginEstimate },
              { label: "Price Range", value: selectedProduct.pricingIntel.priceRange },
            ].filter(m => m.value).map(m => (
              <div key={m.label} className="p-2.5 rounded-lg bg-muted border border-border">
                <p className="typo-card-eyebrow">{m.label}</p>
                <p className="typo-card-body font-bold text-foreground mt-0.5">{m.value}</p>
              </div>
            ))}
          </div>
          {(selectedProduct.pricingIntel as any).pricingNotes && (
            <p className="typo-card-body text-foreground/70 mt-2">{(selectedProduct.pricingIntel as any).pricingNotes}</p>
          )}
        </AnalysisSectionCard>
      )}

      {activeSection === "supply" && !isService && selectedProduct.supplyChain && (
        <AnalysisSectionCard icon={Package} title="Supply Chain">
          <SupplySection title="Manufacturers" icon={<Factory size={11} />}
            items={(selectedProduct.supplyChain.manufacturers || []).map((m: any) => ({ name: m.name, badge: m.region || "—", detail: m.specialty || m.notes || "", url: m.url }))} />
          <SupplySection title="Distributors" icon={<Truck size={11} />}
            items={(selectedProduct.supplyChain.distributors || []).map((d: any) => ({ name: d.name, badge: d.region || "—", detail: d.specialty || d.notes || "", url: d.url }))} />
          <SupplySection title="Retailers" icon={<Store size={11} />}
            items={(selectedProduct.supplyChain.retailers || []).map((r: any) => ({ name: r.name, badge: r.type || "—", detail: r.notes || "", url: r.url }))} />
        </AnalysisSectionCard>
      )}

      {activeSection === "patents" && !isService && (
        <AnalysisSectionCard icon={ScrollText} title="Patent Intelligence">
          <PatentIntelligence product={selectedProduct} />
        </AnalysisSectionCard>
      )}

      <ProjectNotesSection analysisId={analysisId} saveStepData={analysis.saveStepData} />

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
              <p className="text-[11px] text-muted-foreground">{item.detail}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-background/80 text-foreground/70">{item.badge}</span>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-primary">
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
