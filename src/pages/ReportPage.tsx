import React, { useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyTakeawayBanner, getCommunityTakeaway, getPricingTakeaway, getSupplyChainTakeaway, getVerdictBadges, getWorkflowTakeaway } from "@/components/KeyTakeawayBanner";
import { WorkflowTimeline } from "@/components/FirstPrinciplesAnalysis";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useModeTheme } from "@/hooks/useModeTheme";
import { HeroSection } from "@/components/HeroSection";
import { LoadingTracker } from "@/components/LoadingTracker";
import { StepNavigator } from "@/components/StepNavigator";
import { getStepConfigs } from "@/lib/stepConfigs";
import { ProductCard } from "@/components/ProductCard";
import { AnalysisVisualLayer } from "@/components/AnalysisVisualLayer";

import { PatentIntelligence } from "@/components/PatentIntelligence";
import { ProjectNotesEditor } from "@/components/portfolio/ProjectNotesEditor";
import { ScoreBar } from "@/components/ScoreBar";
import { RevivalScoreBadge } from "@/components/RevivalScoreBadge";
import { DetailPanel, NextStepButton, StepNavBar } from "@/components/SectionNav";
import { downloadFullAnalysisPDF, downloadPatentPDF } from "@/lib/pdfExport";
import { gatherAllAnalysisData } from "@/lib/gatherAnalysisData";
import { ShareAnalysis } from "@/components/ShareAnalysis";
import {
  Target, Brain, Swords, Presentation, Save, RefreshCw, FileDown,
  ExternalLink, MessageSquare,
  TrendingUp, TrendingDown, Minus, DollarSign, Package, Store, Truck,
  Factory, Rocket, Globe, Users, ThumbsDown, ThumbsUp, Wrench, Heart,
  ShieldAlert, CheckCircle2, Lightbulb, AlertTriangle, Zap, Database,
  Clock, ScrollText, StickyNote,
} from "lucide-react";
import type { Product } from "@/data/mockProducts";
import StrategicProfileSelector from "@/components/StrategicProfileSelector";

function TrendBadge({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (trend === "up") return <span className="inline-flex items-center gap-0.5 typo-card-meta font-bold text-green-600"><TrendingUp size={9} /> Rising</span>;
  if (trend === "down") return <span className="inline-flex items-center gap-0.5 typo-card-meta font-bold text-red-500"><TrendingDown size={9} /> Falling</span>;
  return <span className="inline-flex items-center gap-0.5 typo-card-meta font-bold text-yellow-600"><Minus size={9} /> Stable</span>;
}

export default function ReportPage() {
  const analysis = useAnalysis();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const [isSaving, setIsSaving] = React.useState(false);
  const [refreshingJourney, setRefreshingJourney] = useState(false);

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

  // Allow time for state to hydrate from handleLoadSaved before redirecting
  const [waitedForLoad, setWaitedForLoad] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setWaitedForLoad(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const shouldRedirectHome = waitedForLoad && analysis.step === "idle" && products.length === 0;
  React.useEffect(() => {
    if (shouldRedirectHome) {
      navigate("/", { replace: true });
    }
  }, [shouldRedirectHome, navigate]);

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
  const isService = selectedProduct?.category === "Service";

  const handleManualSave = async () => {
    setIsSaving(true);
    await analysis.handleManualSave();
    setIsSaving(false);
  };

  const baseUrl = `/analysis/${analysisId}`;

  // Cast for typed access
  const ci = (selectedProduct as any).communityInsights;
  const uw = (selectedProduct as any).userWorkflow;

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
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

        {/* Compact header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="typo-section-title">Intelligence Report</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StrategicProfileSelector
              profile={analysis.strategicProfile}
              onChangeProfile={analysis.setStrategicProfile}
            />
            <button onClick={() => selectedProduct && downloadFullAnalysisPDF(selectedProduct, gatherAllAnalysisData(analysis))} className="flex items-center gap-1.5 px-3 py-1.5 rounded typo-button-secondary bg-background border border-border text-foreground">
              <FileDown size={12} /> PDF
            </button>
            <button onClick={handleManualSave} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded typo-button-secondary bg-primary text-primary-foreground" style={{ opacity: isSaving ? 0.7 : 1 }}>
              {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              {isSaving ? "Saving…" : "Save"}
            </button>
            <ShareAnalysis analysisId={analysisId || ""} analysisTitle={selectedProduct.name} accentColor={modeAccent} />
          </div>
        </div>

        {/* Product Card */}
        <ProductCard product={selectedProduct} isSelected={true} onClick={() => {}} />

        {/* Adaptive Visual Layer — enforces visual primacy + text suppression */}
        <AnalysisVisualLayer
          analysis={selectedProduct as unknown as Record<string, unknown>}
          step="report"
          governedOverride={analysis.governedData}
        >
          {/* === ALL SECTIONS AS ACCORDIONS === */}

          {/* 1. Overview — open by default */}
          <DetailPanel title="Overview" icon={Target}>
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
          </DetailPanel>

          {/* Assumptions Map removed — belongs in Disrupt step (downstream) */}

          {/* 2. User Journey */}
          {uw?.stepByStep?.length > 0 && (
            <DetailPanel title="User Journey" icon={Clock}>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={handleRefreshJourney}
                    disabled={refreshingJourney}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-muted border border-border text-foreground disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={refreshingJourney ? "animate-spin" : ""} />
                    {refreshingJourney ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
                <WorkflowTimeline steps={uw.stepByStep} frictionPoints={uw.frictionPoints || []} />
                {(uw.cognitiveLoad || uw.contextOfUse) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {uw.cognitiveLoad && (
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="typo-card-eyebrow mb-1">Cognitive Load</p>
                        <p className="text-xs text-foreground/80">{uw.cognitiveLoad}</p>
                      </div>
                    )}
                    {uw.contextOfUse && (
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="typo-card-eyebrow mb-1">Context of Use</p>
                        <p className="text-xs text-foreground/80">{uw.contextOfUse}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DetailPanel>
          )}

          {/* 3. Community Intel */}
          {ci && (
            <DetailPanel title="Community Intel" icon={MessageSquare}>
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
            </DetailPanel>
          )}

          {/* 5. Pricing Intel */}
          {selectedProduct.pricingIntel && (
            <DetailPanel title="Pricing Intel" icon={DollarSign}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Market Price", value: selectedProduct.pricingIntel.currentMarketPrice },
                    { label: "Resale Avg", value: (selectedProduct.pricingIntel as any).resaleAvgSold || selectedProduct.pricingIntel.ebayAvgSold },
                    { label: "Original MSRP", value: selectedProduct.pricingIntel.msrpOriginal },
                    { label: "Collector Premium", value: selectedProduct.pricingIntel.collectorPremium },
                    { label: "Margins", value: selectedProduct.pricingIntel.margins },
                    { label: "Trend", value: selectedProduct.pricingIntel.priceDirection?.toUpperCase() },
                  ].filter(x => x.value).map((item) => (
                    <div key={item.label} className="p-2.5 rounded-lg bg-muted border border-border">
                      <p className="typo-card-eyebrow mb-0.5">{item.label}</p>
                      <p className="typo-card-body font-bold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </DetailPanel>
          )}

          {/* 6. Supply Chain (products only) */}
          {!isService && selectedProduct.supplyChain && (
            <DetailPanel title="Supply Chain" icon={Package}>
              <div className="space-y-3">
                <SupplySection title="Suppliers" icon={<Factory size={12} className="text-primary" />}
                  items={(selectedProduct.supplyChain.suppliers || []).map((s: any) => ({ name: s.name, badge: s.region, detail: s.role, url: s.url }))}
                  color="hsl(var(--primary-muted))" borderColor="hsl(var(--primary) / 0.3)" />
                <SupplySection title="Manufacturers" icon={<Package size={12} className="text-blue-500" />}
                  items={(selectedProduct.supplyChain.manufacturers || []).map((m: any) => ({ name: m.name, badge: m.region, detail: `MOQ: ${m.moq}`, url: m.url }))}
                  color="hsl(217 91% 60% / 0.08)" borderColor="hsl(217 91% 60% / 0.3)" />
                <SupplySection title="Vendors" icon={<Store size={12} className="text-purple-500" />}
                  items={(selectedProduct.supplyChain.vendors || []).map((v: any) => ({ name: v.name, badge: v.type, detail: v.notes, url: v.url }))}
                  color="hsl(262 83% 58% / 0.08)" borderColor="hsl(262 83% 58% / 0.3)" />
                <SupplySection title="Distributors" icon={<Truck size={12} className="text-orange-500" />}
                  items={(selectedProduct.supplyChain.distributors || []).map((d: any) => ({ name: d.name, badge: d.region, detail: d.notes, url: d.url }))}
                  color="hsl(32 100% 50% / 0.08)" borderColor="hsl(32 100% 50% / 0.3)" />
                {selectedProduct.supplyChain.retailers?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedProduct.supplyChain.retailers.map((r: any) => (
                      <div key={r.name} className="p-2.5 rounded-lg text-center" style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
                        <p className="text-xs font-bold text-foreground">{r.name}</p>
                        <p className="text-sm font-bold" style={{ color: "hsl(142 70% 35%)" }}>{r.marketShare}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DetailPanel>
          )}

          {/* 7. Patent Intel (products only) */}
          {!isService && (
            <DetailPanel title="Patent Intel" icon={ScrollText}>
              {selectedProduct.patentData && (
                <div className="flex justify-end mb-2">
                  <button
                    onClick={() => downloadPatentPDF(selectedProduct, selectedProduct.patentData)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded typo-button-secondary text-white text-xs"
                    style={{ background: modeAccent }}
                  >
                    <FileDown size={12} /> Patent PDF
                  </button>
                </div>
              )}
              <PatentIntelligence
                product={selectedProduct}
                onSave={(patentData) => {
                  const updated = products.map(p =>
                    p.id === selectedProduct.id ? { ...p, patentData } : p
                  );
                  analysis.setProducts(updated);
                  analysis.setSelectedProduct({ ...selectedProduct, patentData });
                  if (analysisId) {
                    (async () => {
                      try {
                        await (supabase.from("saved_analyses") as any)
                          .update({ products: JSON.parse(JSON.stringify(updated)) })
                          .eq("id", analysisId);
                      } catch (err) { console.error("Failed to persist patent data:", err); }
                    })();
                  }
                }}
              />
            </DetailPanel>
          )}
        </AnalysisVisualLayer>

        {/* Project Notes */}
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
