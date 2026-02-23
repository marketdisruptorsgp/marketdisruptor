import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useAuth } from "@/hooks/useAuth";
import { StepNavigator } from "@/components/StepNavigator";
import { ProductCard } from "@/components/ProductCard";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import { AssumptionsMap } from "@/components/AssumptionsMap";
import { ScoreBar } from "@/components/ScoreBar";
import { RevivalScoreBadge } from "@/components/RevivalScoreBadge";
import { downloadFullAnalysisPDF } from "@/lib/pdfExport";
import {
  Target, Brain, Swords, Presentation, Save, RefreshCw, FileDown,
  ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, MessageSquare,
  TrendingUp, TrendingDown, Minus, DollarSign, Package, Store, Truck,
  Factory, Rocket, Globe, Users, ThumbsDown, ThumbsUp, Wrench, Heart,
  ShieldAlert, CheckCircle2, Lightbulb, AlertTriangle, Zap, Database,
  Clock,
} from "lucide-react";
import type { Product } from "@/data/mockProducts";

function TrendBadge({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (trend === "up") return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-600"><TrendingUp size={9} /> Rising</span>;
  if (trend === "down") return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-500"><TrendingDown size={9} /> Falling</span>;
  return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-yellow-600"><Minus size={9} /> Stable</span>;
}

export default function ReportPage() {
  const analysis = useAnalysis();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const sectionTabsRef = useRef<HTMLDivElement>(null);

  const { products, selectedProduct, analysisParams, analysisId } = analysis;

  // Redirect to dashboard if no data
  if (analysis.step !== "done" || products.length === 0 || !selectedProduct) {
    navigate("/", { replace: true });
    return null;
  }

  const isCustomMode = analysisParams?.category === "Custom";
  const modeAccent = isCustomMode ? "hsl(217 91% 38%)" : "hsl(var(--primary))";
  const totalSources = products.reduce((a, p) => a + (p.sources?.length || 0), 0);
  const totalIdeas = products.reduce((acc, p) => acc + (p.flippedIdeas?.length || 0), 0);
  const avgScore = (products.reduce((acc, p) => acc + p.revivalScore, 0) / products.length).toFixed(1);

  const DETAIL_TABS = [
    { id: "overview", label: "Overview", icon: Target },
    { id: "community", label: "Community Intel", icon: MessageSquare },
    { id: "pricing", label: "Pricing Intel", icon: DollarSign },
    { id: "supply", label: "Supply Chain", icon: Package },
    { id: "action", label: "Action Plan", icon: Rocket },
    { id: "ideas", label: "Flipped Ideas", icon: Zap },
  ];

  const currentIdx = DETAIL_TABS.findIndex(t => t.id === analysis.detailTab);

  const [isSaving, setIsSaving] = React.useState(false);

  const handleManualSave = async () => {
    setIsSaving(true);
    await analysis.handleManualSave();
    setIsSaving(false);
  };

  const baseUrl = `/analysis/${analysisId}`;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        <StepNavigator
          steps={[
            { step: 2, label: "Intelligence Report", icon: Target, color: modeAccent },
            { step: 3, label: "Disrupt", icon: Brain, color: "hsl(271 81% 55%)" },
            { step: 4, label: "Stress Test", icon: Swords, color: "hsl(350 80% 55%)" },
            { step: 5, label: "Pitch Deck", icon: Presentation, color: "hsl(var(--primary))" },
          ]}
          activeStep={2}
          visitedSteps={new Set([2])}
          onStepChange={(s) => {
            if (s === 3) navigate(`${baseUrl}/disrupt`);
            else if (s === 4) navigate(`${baseUrl}/stress-test`);
            else if (s === 5) navigate(`${baseUrl}/pitch`);
          }}
        />

        {analysis.loadedFromSaved && (
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: "hsl(var(--primary))" }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        )}

        {/* Header */}
        <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
          <div className="px-3 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4" style={{ background: "hsl(var(--muted))" }}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center text-xs sm:text-sm font-semibold" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>2</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-foreground">Intelligence Report</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                  {products.length} product{products.length > 1 ? "s" : ""} · {totalSources} sources · {totalIdeas} ideas · {avgScore}/10
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => selectedProduct && downloadFullAnalysisPDF(selectedProduct)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-[11px] sm:text-xs font-medium transition-colors"
                style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
              >
                <FileDown size={12} /> PDF
              </button>
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-[11px] sm:text-xs font-medium transition-colors"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", opacity: isSaving ? 0.7 : 1 }}
              >
                {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Product Selector */}
        {products.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  analysis.setSelectedProduct(product);
                  analysis.setDetailTab("overview");
                }}
                className="flex items-center gap-2 px-3 py-2 rounded text-xs font-medium transition-colors"
                style={{
                  background: selectedProduct?.id === product.id ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  color: selectedProduct?.id === product.id ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                  border: `1px solid ${selectedProduct?.id === product.id ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                }}
              >
                <RevivalScoreBadge score={product.revivalScore} size="sm" />
                {product.name}
              </button>
            ))}
          </div>
        )}

        {/* Product Card */}
        <ProductCard product={selectedProduct} isSelected={true} onClick={() => {}} />

        {/* Detail Tab Nav */}
        <div ref={sectionTabsRef} className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
          {DETAIL_TABS.map((tab) => {
            const isActive = analysis.detailTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  analysis.setDetailTab(tab.id);
                  analysis.setVisitedDetailTabs(new Set([...analysis.visitedDetailTabs, tab.id]));
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded text-[11px] sm:text-xs font-medium transition-colors relative whitespace-nowrap flex-shrink-0"
                style={{
                  background: isActive ? "hsl(var(--primary))" : "hsl(var(--muted))",
                  color: isActive ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                  border: `1px solid ${isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                }}
              >
                {!isActive && !analysis.visitedDetailTabs.has(tab.id) && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-primary" />
                )}
                <TabIcon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content - Overview */}
        {analysis.detailTab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                {selectedProduct.keyInsight && (
                  <div className="insight-callout">
                    <p className="section-label text-[10px] mb-1">Key Insight</p>
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.85)" }}>{selectedProduct.keyInsight}</p>
                  </div>
                )}
                {selectedProduct.description && (
                  <div className="section-panel">
                    <p className="section-label text-[10px] mb-2">Description</p>
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>{selectedProduct.description}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {selectedProduct.marketSizeEstimate && (
                  <div className="insight-callout--success insight-callout">
                    <p className="text-xs font-semibold leading-relaxed" style={{ color: "hsl(142 70% 28%)" }}>
                      TAM: {selectedProduct.marketSizeEstimate}
                    </p>
                  </div>
                )}
                <div className="section-panel">
                  <p className="section-label text-[10px] mb-2.5">Live Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.sources?.map((src) => (
                      <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                        style={{ background: "hsl(var(--primary) / 0.06)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.12)" }}>
                        <ExternalLink size={10} /> {src.label?.slice(0, 40)}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="section-panel">
                  <p className="section-label text-[10px] mb-3">Confidence Scores</p>
                  <div className="grid grid-cols-1 gap-3">
                    <ScoreBar label="Adoption Likelihood" score={selectedProduct.confidenceScores?.adoptionLikelihood ?? 7} />
                    <ScoreBar label="Feasibility" score={selectedProduct.confidenceScores?.feasibility ?? 7} />
                    <ScoreBar label="Emotional Resonance" score={selectedProduct.confidenceScores?.emotionalResonance ?? 8} />
                  </div>
                </div>
              </div>
            </div>
            {selectedProduct.trendAnalysis && (
              <div className="insight-callout">
                <p className="section-label text-[10px] mb-2 flex items-center gap-1"><TrendingUp size={11} /> Trend Analysis</p>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>{selectedProduct.trendAnalysis}</p>
              </div>
            )}
            <div className="section-panel">
              <p className="section-label text-[10px] mb-3">Assumptions Map</p>
              <AssumptionsMap product={selectedProduct} />
            </div>
          </div>
        )}

        {/* Tab: Community Intel */}
        {analysis.detailTab === "community" && (
          <div className="space-y-6">
            {(selectedProduct as unknown as { communityInsights?: { redditSentiment?: string; topComplaints?: string[]; improvementRequests?: string[]; nostalgiaTriggers?: string[]; competitorComplaints?: string[] } }).communityInsights ? (
              (() => {
                const ci = (selectedProduct as unknown as { communityInsights: { redditSentiment?: string; topComplaints?: string[]; improvementRequests?: string[]; nostalgiaTriggers?: string[]; competitorComplaints?: string[] } }).communityInsights;
                return (
                  <div className="space-y-5">
                    {ci.redditSentiment && (
                      <div className="p-4 rounded-xl" style={{ background: "hsl(25 90% 50% / 0.08)", border: "1px solid hsl(25 90% 50% / 0.3)" }}>
                        <p className="section-label text-[10px] mb-2 flex items-center gap-1" style={{ color: "hsl(25 90% 40%)" }}>
                          <MessageSquare size={12} /> Community Sentiment
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: "hsl(25 90% 30%)" }}>{ci.redditSentiment}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ci.topComplaints?.length ? (
                        <div>
                          <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                            <ThumbsDown size={12} style={{ color: "hsl(var(--destructive))" }} /> Top Complaints
                          </p>
                          <div className="space-y-2">
                            {ci.topComplaints.map((c, i) => (
                              <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs" style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
                                <ShieldAlert size={12} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 1 }} />
                                <span className="text-foreground/80">{c}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {ci.improvementRequests?.length ? (
                        <div>
                          <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                            <Wrench size={12} style={{ color: "hsl(217 91% 60%)" }} /> Improvement Requests
                          </p>
                          <div className="space-y-2">
                            {ci.improvementRequests.map((r, i) => (
                              <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs" style={{ background: "hsl(217 91% 60% / 0.06)", border: "1px solid hsl(217 91% 60% / 0.25)" }}>
                                <Lightbulb size={12} style={{ color: "hsl(217 91% 55%)", flexShrink: 0, marginTop: 1 }} />
                                <span className="text-foreground/80">{r}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ci.nostalgiaTriggers?.length ? (
                        <div>
                          <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                            <Heart size={12} style={{ color: "hsl(330 80% 55%)" }} /> Nostalgia Triggers
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {ci.nostalgiaTriggers.map((t, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "hsl(330 80% 55% / 0.1)", color: "hsl(330 80% 40%)", border: "1px solid hsl(330 80% 55% / 0.3)" }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {ci.competitorComplaints?.length ? (
                        <div>
                          <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                            <ThumbsUp size={12} style={{ color: "hsl(142 70% 40%)" }} /> Why People Hate Current Alternatives
                          </p>
                          <div className="space-y-2">
                            {ci.competitorComplaints.map((c, i) => (
                              <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs" style={{ background: "hsl(142 70% 45% / 0.06)", border: "1px solid hsl(142 70% 45% / 0.25)" }}>
                                <CheckCircle2 size={12} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 1 }} />
                                <span className="text-foreground/80">{c}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="py-10 text-center">
                <Users size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">Community insights will appear here after running a live analysis.</p>
              </div>
            )}
            {/* Reviews & Social Signals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="section-label text-[10px] mb-3 flex items-center gap-1"><MessageSquare size={12} /> Reviews & Sentiment</p>
                <div className="space-y-2">
                  {selectedProduct.reviews?.map((review, i) => (
                    <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs leading-relaxed" style={{ background: "hsl(var(--muted))" }}>
                      <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${review.sentiment === "positive" ? "bg-green-500" : review.sentiment === "negative" ? "bg-red-500" : "bg-yellow-500"}`} />
                      <span className="text-foreground/80">{review.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="section-label text-[10px] mb-3 flex items-center gap-1"><TrendingUp size={12} /> Social Signals</p>
                <div className="space-y-2">
                  {selectedProduct.socialSignals?.map((sig, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.15)" }}>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold" style={{ color: "hsl(var(--primary-dark))" }}>{sig.platform}</p>
                          <TrendBadge trend={sig.trend} />
                        </div>
                        <p className="text-[11px] text-muted-foreground">{sig.signal}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>{sig.volume}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Pricing Intel */}
        {analysis.detailTab === "pricing" && selectedProduct.pricingIntel && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Current Market Price", value: selectedProduct.pricingIntel.currentMarketPrice, highlight: false },
                { label: "Collector Premium", value: selectedProduct.pricingIntel.collectorPremium, highlight: false },
                { label: "Resale Avg Sold", value: selectedProduct.pricingIntel.ebayAvgSold, highlight: true },
                { label: "Vintage Avg Sold", value: selectedProduct.pricingIntel.etsyAvgSold, highlight: true },
                { label: "Original MSRP", value: selectedProduct.pricingIntel.msrpOriginal, highlight: false },
                { label: "Price Trend", value: selectedProduct.pricingIntel.priceDirection?.toUpperCase(), highlight: true },
              ].map((item) => (
                <div key={item.label} className="p-4 rounded-xl" style={{
                  background: item.highlight ? "hsl(var(--primary-muted))" : "hsl(var(--muted))",
                  border: item.highlight ? "1px solid hsl(var(--primary) / 0.2)" : "1px solid hsl(var(--border))",
                }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-sm font-bold" style={{ color: item.highlight ? "hsl(var(--primary-dark))" : "hsl(var(--foreground))" }}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl" style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.3)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(142 70% 30%)" }}>
                <DollarSign size={10} className="inline mr-1" />Margin Analysis
              </p>
              <p className="text-sm" style={{ color: "hsl(142 70% 25%)" }}>{selectedProduct.pricingIntel.margins}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-muted-foreground">Full Price Range</p>
              <div className="flex items-center gap-3">
                <span className="text-lg font-extrabold text-foreground">{selectedProduct.pricingIntel.priceRange}</span>
                <TrendBadge trend={selectedProduct.pricingIntel.priceDirection as "up" | "down" | "stable"} />
              </div>
            </div>
          </div>
        )}
        {analysis.detailTab === "pricing" && !selectedProduct.pricingIntel && (
          <p className="text-sm text-muted-foreground text-center py-8">No pricing intelligence available for this product.</p>
        )}

        {/* Tab: Supply Chain */}
        {analysis.detailTab === "supply" && selectedProduct.supplyChain && (
          <div className="space-y-6">
            <SupplySection title="Suppliers & IP Owners" icon={<Factory size={14} style={{ color: "hsl(var(--primary))" }} />}
              items={selectedProduct.supplyChain.suppliers.map((s) => ({ name: s.name, badge: s.region, detail: s.role, url: s.url }))}
              color="hsl(var(--primary-muted))" borderColor="hsl(var(--primary) / 0.3)" />
            <SupplySection title="Manufacturers / OEM" icon={<Package size={14} style={{ color: "hsl(217 91% 60%)" }} />}
              items={selectedProduct.supplyChain.manufacturers.map((m) => ({ name: m.name, badge: m.region, detail: `MOQ: ${m.moq}`, url: m.url }))}
              color="hsl(217 91% 60% / 0.08)" borderColor="hsl(217 91% 60% / 0.3)" />
            <SupplySection title="Vendors & Specialty Sellers" icon={<Store size={14} style={{ color: "hsl(262 83% 58%)" }} />}
              items={selectedProduct.supplyChain.vendors.map((v) => ({ name: v.name, badge: v.type, detail: v.notes, url: v.url }))}
              color="hsl(262 83% 58% / 0.08)" borderColor="hsl(262 83% 58% / 0.3)" />
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-2"><Store size={14} style={{ color: "hsl(142 70% 40%)" }} /> Retailers & Market Share</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {selectedProduct.supplyChain.retailers.map((r) => (
                  <div key={r.name} className="p-3 rounded-xl text-center space-y-1" style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
                    <p className="text-xs font-bold text-foreground">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.type}</p>
                    <p className="text-lg font-extrabold" style={{ color: "hsl(142 70% 35%)" }}>{r.marketShare}</p>
                    {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: "hsl(var(--primary))" }}><ExternalLink size={9} /> Visit</a>}
                  </div>
                ))}
              </div>
            </div>
            <SupplySection title="Distributors" icon={<Truck size={14} style={{ color: "hsl(32 100% 50%)" }} />}
              items={selectedProduct.supplyChain.distributors.map((d) => ({ name: d.name, badge: d.region, detail: d.notes, url: d.url }))}
              color="hsl(32 100% 50% / 0.08)" borderColor="hsl(32 100% 50% / 0.3)" />
          </div>
        )}
        {analysis.detailTab === "supply" && !selectedProduct.supplyChain && (
          <p className="text-sm text-muted-foreground text-center py-8">No supply chain data available for this product.</p>
        )}

        {/* Tab: Action Plan */}
        {analysis.detailTab === "action" && selectedProduct.actionPlan && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: "hsl(var(--primary-muted))", borderLeft: "4px solid hsl(var(--primary))" }}>
              <p className="section-label text-[10px] mb-2">Strategic Direction</p>
              <p style={{ color: "hsl(var(--primary-dark))" }}>{selectedProduct.actionPlan.strategy}</p>
            </div>
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-1"><Zap size={11} /> Quick Wins (This Week)</p>
              <div className="space-y-2">
                {selectedProduct.actionPlan.quickWins.map((win, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg text-sm" style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.25)" }}>
                    <CheckCircle2 size={16} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: "hsl(142 70% 25%)" }}>{win}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="section-label text-[10px] mb-3">Execution Roadmap</p>
              <div className="space-y-4">
                {selectedProduct.actionPlan.phases.map((phase, i) => (
                  <div key={i} className="p-4 rounded-xl space-y-3" style={{
                    background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))",
                    borderLeft: `4px solid ${i === 0 ? "hsl(142 70% 45%)" : i === 1 ? "hsl(var(--primary))" : "hsl(32 100% 50%)"}`,
                  }}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-bold text-sm text-foreground">{phase.phase}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock size={10} /> {phase.timeline}</span>
                        <span className="flex items-center gap-1 font-semibold" style={{ color: "hsl(var(--primary))" }}><DollarSign size={10} /> {phase.budget}</span>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {phase.actions.map((action, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-foreground/80">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>{j + 1}</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                    <div className="px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary-dark))" }}>
                      Milestone: {phase.milestone}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Investment</p>
                <p className="text-lg font-extrabold text-foreground">{selectedProduct.actionPlan.totalInvestment}</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.3)" }}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "hsl(142 70% 35%)" }}>Expected ROI</p>
                <p className="text-lg font-extrabold" style={{ color: "hsl(142 70% 28%)" }}>{selectedProduct.actionPlan.expectedROI}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                <p className="section-label text-[10px] mb-2">Go-To-Market Channels</p>
                <div className="flex flex-wrap gap-1">
                  {selectedProduct.actionPlan.channels.map((ch) => (
                    <span key={ch} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>{ch}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {analysis.detailTab === "action" && !selectedProduct.actionPlan && (
          <p className="text-sm text-muted-foreground text-center py-8">No action plan available for this product.</p>
        )}

        {/* Tab: Flipped Ideas */}
        {analysis.detailTab === "ideas" && (
          <div className="space-y-4">
            {selectedProduct.flippedIdeas?.length ? (
              selectedProduct.flippedIdeas.map((idea, i) => (
                <FlippedIdeaCard key={i} idea={idea} rank={i + 1} productName={selectedProduct.name} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No flipped ideas available yet. Try running the Disrupt step.</p>
            )}
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex items-center justify-between pt-4 mt-4" style={{ borderTop: "2px solid hsl(var(--border))" }}>
          {currentIdx > 0 ? (
            <button
              onClick={() => {
                const prevTab = DETAIL_TABS[currentIdx - 1].id;
                analysis.setDetailTab(prevTab);
                analysis.setVisitedDetailTabs(new Set([...analysis.visitedDetailTabs, prevTab]));
                setTimeout(() => sectionTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "2px solid hsl(var(--border))" }}
            >
              <ChevronLeft size={16} /> {DETAIL_TABS[currentIdx - 1].label}
            </button>
          ) : <div />}
          {currentIdx < DETAIL_TABS.length - 1 ? (
            <button
              onClick={() => {
                const nextTab = DETAIL_TABS[currentIdx + 1].id;
                analysis.setDetailTab(nextTab);
                analysis.setVisitedDetailTabs(new Set([...analysis.visitedDetailTabs, nextTab]));
                setTimeout(() => sectionTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              Next: {DETAIL_TABS[currentIdx + 1].label} <ChevronRight size={16} />
            </button>
          ) : (
            <span className="text-xs font-bold px-3 py-2 rounded" style={{ background: "hsl(142 70% 45% / 0.12)", color: "hsl(142 70% 35%)" }}>
              All sections explored
            </span>
          )}
        </div>


        {/* SGP Capital CTA */}
        <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
          <div className="px-6 py-6 flex flex-col sm:flex-row items-center gap-5">
            <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
              <Rocket size={18} className="text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-foreground mb-1">Ready to Bring This to Life?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                SGP Capital helps entrepreneurs and investors turn market intelligence into real businesses.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
              <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 flex items-center gap-2"
                style={{ background: "hsl(var(--primary))" }}>
                <Globe size={14} /> Visit SGP Capital
              </a>
            </div>
          </div>
        </div>
      </main>
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
  return (
    <div>
      <p className="section-label text-[10px] mb-3 flex items-center gap-2">{icon} {title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.name} className="p-3 rounded-xl flex items-start justify-between gap-2" style={{ background: color, border: `1px solid ${borderColor}` }}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-background/80 text-foreground/70">{item.badge}</span>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: "hsl(var(--primary))" }}>
                  <ExternalLink size={9} /> Link
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
