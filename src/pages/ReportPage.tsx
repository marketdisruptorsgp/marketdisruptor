import React, { useRef, useState, useCallback, useMemo } from "react";
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
import { HeroSection } from "@/components/HeroSection";
import { LoadingTracker } from "@/components/LoadingTracker";
import { StepNavigator } from "@/components/StepNavigator";
import { getStepConfigs } from "@/lib/stepConfigs";
import { AnalysisVisualLayer } from "@/components/AnalysisVisualLayer";

import { PatentIntelligence } from "@/components/PatentIntelligence";
import { ObservedSignalMatrix } from "@/components/ObservedSignalMatrix";
import { ModeBadge } from "@/components/ModeBadge";
import { ProjectNotesEditor } from "@/components/portfolio/ProjectNotesEditor";
import { ScoreBar } from "@/components/ScoreBar";
import { NextStepButton, StepNavBar } from "@/components/SectionNav";

import { downloadReportAsPDF } from "@/lib/downloadReportPDF";
import { gatherAllAnalysisData } from "@/lib/gatherAnalysisData";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import {
  Target, Save, RefreshCw, FileDown,
  ExternalLink, MessageSquare,
  DollarSign, Package, Store, Truck,
  Factory,
  ShieldAlert, Lightbulb,
  Clock, ScrollText, StickyNote,
} from "lucide-react";
import type { Product } from "@/data/mockProducts";
import StrategicProfileSelector from "@/components/StrategicProfileSelector";

/* ── Section tab config ── */
type SectionTab = { id: string; label: string; icon: React.ElementType };

function getAvailableSections(selectedProduct: any, isService: boolean): SectionTab[] {
  const tabs: SectionTab[] = [
    { id: "overview", label: "Overview", icon: Target },
  ];
  const uw = (selectedProduct as any).userWorkflow;
  if (uw?.stepByStep?.length > 0) tabs.push({ id: "journey", label: "User Journey", icon: Clock });
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
      <div className="min-h-screen bg-background">
        <HeroSection tier={tier} remainingAnalyses={null} />
        <main className="max-w-5xl mx-auto px-3 sm:px-6 py-8">
          <LoadingTracker
            step={analysis.step as "scraping" | "analyzing"}
            elapsedSeconds={analysis.elapsedSeconds}
            loadingLog={analysis.loadingLog}
          />
        </main>
      </div>
    );
  }

  if (analysis.step !== "done" || products.length === 0 || !selectedProduct) {
    if (shouldRedirectHome) {
      return null;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-primary" />
          <p className="text-sm text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  const modeAccent = theme.primary;
  const isService = selectedProduct?.category === "Service" || isServiceCategory(selectedProduct?.category || "");

  const handleManualSave = async () => {
    setIsSaving(true);
    await analysis.handleManualSave();
    setIsSaving(false);
  };

  const baseUrl = `/analysis/${analysisId}`;

  // Cast for typed access
  const ci = (selectedProduct as any).communityInsights;
  const uw = (selectedProduct as any).userWorkflow;

  const sectionTabs = getAvailableSections(selectedProduct, isService);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        <ModeBadge />
        <StepNavigator
          steps={getStepConfigs(modeAccent)}
          activeStep={2}
          visitedSteps={new Set([2])}
          onStepChange={(s) => {
            if (s === 3) navigate(`${baseUrl}/disrupt`);
            else if (s === 4) navigate(`${baseUrl}/redesign`);
            else if (s === 5) navigate(`${baseUrl}/stress-test`);
            else if (s === 6) navigate(`${baseUrl}/pitch`);
          }}
        />

        <StepNavBar backLabel="Home" backPath="/" accentColor={modeAccent} />

        {/* Analysis title — persistent across all steps */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground px-1">{selectedProduct.name}</h1>

        {/* Compact header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="typo-section-title">Intelligence Report</h2>
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
            <button onClick={handleManualSave} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded typo-button-secondary bg-primary text-primary-foreground" style={{ opacity: isSaving ? 0.7 : 1 }}>
              {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              {isSaving ? "Saving…" : "Save"}
            </button>
            <ShareAnalysis analysisId={analysisId || ""} analysisTitle={selectedProduct.name} accentColor={modeAccent} />
          </div>
        </div>

        {/* ── Section Tab Buttons — above banner, matching Disrupt layout ── */}
        <div className="flex flex-wrap items-center gap-2">
          {sectionTabs.map((tab) => {
            const isActive = activeSection === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  background: isActive ? modeAccent : "hsl(var(--muted))",
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

        {/* ── Intelligence Report Context Banner — overview only ── */}
        {activeSection === "overview" && (
          <div className="rounded-xl p-5 space-y-2.5" style={{ background: "hsl(var(--foreground))" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: modeAccent }}>
                <Target size={18} style={{ color: "white" }} />
              </div>
              <h3 className="font-extrabold text-base leading-tight" style={{ color: "white" }}>Intelligence Report</h3>
            </div>
            <p className="text-sm font-bold leading-relaxed pl-[48px]" style={{ color: "white" }}>
              A consolidated view of pricing, supply chain, community sentiment, and competitive positioning — each finding tagged by confidence level.
            </p>
          </div>
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
            <SectionCard icon={Target} title="Overview">
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
            </SectionCard>
          </AnalysisVisualLayer>
        )}

        {activeSection === "journey" && uw?.stepByStep?.length > 0 && (
          <SectionCard icon={Clock} title="User Journey"
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
              steps={uw.stepByStep}
              frictionPoints={uw.frictionPoints || []}
              cognitiveLoad={uw.cognitiveLoad}
              contextOfUse={uw.contextOfUse}
              category={selectedProduct?.category}
              productName={selectedProduct?.name}
            />
          </SectionCard>
        )}

        {activeSection === "community" && ci && (
          <SectionCard icon={MessageSquare} title="Community Intel">
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
          </SectionCard>
        )}

        {activeSection === "pricing" && selectedProduct.pricingIntel && (
          <SectionCard icon={DollarSign} title="Pricing Intel">
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
          </SectionCard>
        )}

        {activeSection === "supply" && !isService && selectedProduct.supplyChain && (
          <SectionCard icon={Package} title="Supply Chain">
            <SupplySection
              title="Manufacturers"
              icon={<Factory size={11} />}
              items={(selectedProduct.supplyChain.manufacturers || []).map((m: any) => ({
                name: m.name, badge: m.region || "—", detail: m.specialty || m.notes || "", url: m.url,
              }))}
              color="hsl(var(--muted))"
              borderColor="hsl(var(--border))"
            />
            <SupplySection
              title="Distributors"
              icon={<Truck size={11} />}
              items={(selectedProduct.supplyChain.distributors || []).map((d: any) => ({
                name: d.name, badge: d.region || "—", detail: d.specialty || d.notes || "", url: d.url,
              }))}
              color="hsl(var(--muted))"
              borderColor="hsl(var(--border))"
            />
            <SupplySection
              title="Retailers"
              icon={<Store size={11} />}
              items={(selectedProduct.supplyChain.retailers || []).map((r: any) => ({
                name: r.name, badge: r.type || "—", detail: r.notes || "", url: r.url,
              }))}
              color="hsl(var(--muted))"
              borderColor="hsl(var(--border))"
            />
          </SectionCard>
        )}

        {activeSection === "patents" && !isService && (
          <SectionCard icon={ScrollText} title="Patent Intelligence">
            <PatentIntelligence product={selectedProduct} />
          </SectionCard>
        )}


        <ProjectNotesSection analysisId={analysisId} saveStepData={analysis.saveStepData} />

        {/* Next Step — no gating */}
        <NextStepButton
          stepNumber={3}
          label="Disrupt"
          color={modeAccent}
          onClick={() => navigate(`${baseUrl}/disrupt`)}
        />
      </main>
    </div>
  );
}

/* ── Section content card wrapper ── */
function SectionCard({ icon: Icon, title, children, action }: { icon: React.ElementType; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-3" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.08)" }}>
            <Icon size={14} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h3 className="typo-card-title">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

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

function SupplySection({
  title, icon, items, color, borderColor,
}: {
  title: string;
  icon: React.ReactNode;
  items: { name: string; badge: string; detail: string; url?: string }[];
  color: string;
  borderColor: string;
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="typo-card-eyebrow mb-1.5 flex items-center gap-2">{icon} {title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.name} className="p-2.5 rounded-lg flex items-start justify-between gap-2" style={{ background: color, border: `1px solid ${borderColor}` }}>
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
