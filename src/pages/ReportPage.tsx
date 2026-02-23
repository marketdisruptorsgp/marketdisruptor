import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useAuth } from "@/hooks/useAuth";
import { StepNavigator } from "@/components/StepNavigator";
import { ProductCard } from "@/components/ProductCard";
// FlippedIdeaCard moved to Disrupt step
import { AssumptionsMap } from "@/components/AssumptionsMap";
import { ScoreBar } from "@/components/ScoreBar";
import { RevivalScoreBadge } from "@/components/RevivalScoreBadge";
import { SectionHeader, NextSectionButton, DetailPanel, NextStepButton } from "@/components/SectionNav";
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
  ];

  const currentIdx = DETAIL_TABS.findIndex(t => t.id === analysis.detailTab);
  const currentTab = DETAIL_TABS[currentIdx];
  const nextTab = currentIdx < DETAIL_TABS.length - 1 ? DETAIL_TABS[currentIdx + 1] : null;
  const prevTab = currentIdx > 0 ? DETAIL_TABS[currentIdx - 1] : null;

  const goToTab = (tabId: string) => {
    analysis.setDetailTab(tabId);
    analysis.setVisitedDetailTabs(new Set([...analysis.visitedDetailTabs, tabId]));
    setTimeout(() => sectionTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

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

        {/* Section pill nav */}
        <div ref={sectionTabsRef} className="flex flex-wrap gap-1.5">
          {DETAIL_TABS.map((tab, i) => {
            const isActive = analysis.detailTab === tab.id;
            const isVisited = analysis.visitedDetailTabs.has(tab.id);
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => goToTab(tab.id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap"
                style={{
                  background: isActive ? "hsl(var(--primary))" : "transparent",
                  color: isActive ? "white" : isVisited ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  border: isActive ? "1px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                }}
              >
                <TabIcon size={12} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content - Overview */}
        {analysis.detailTab === "overview" && (
          <div className="space-y-4">
            <SectionHeader current={currentIdx + 1} total={DETAIL_TABS.length} label="Overview" icon={Target} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {selectedProduct.keyInsight && (
                  <div className="insight-callout">
                    <p className="section-label text-[10px] mb-1">Key Insight</p>
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.85)" }}>{selectedProduct.keyInsight}</p>
                  </div>
                )}
                {selectedProduct.description && (
                  <div className="section-panel">
                    <p className="section-label text-[10px] mb-1">Description</p>
                    <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>{selectedProduct.description}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {selectedProduct.marketSizeEstimate && (
                  <div className="insight-callout--success insight-callout">
                    <p className="text-xs font-semibold" style={{ color: "hsl(142 70% 28%)" }}>TAM: {selectedProduct.marketSizeEstimate}</p>
                  </div>
                )}
                <div className="section-panel">
                  <p className="section-label text-[10px] mb-2">Confidence Scores</p>
                  <div className="grid grid-cols-1 gap-2">
                    <ScoreBar label="Adoption Likelihood" score={selectedProduct.confidenceScores?.adoptionLikelihood ?? 7} />
                    <ScoreBar label="Feasibility" score={selectedProduct.confidenceScores?.feasibility ?? 7} />
                    <ScoreBar label="Emotional Resonance" score={selectedProduct.confidenceScores?.emotionalResonance ?? 8} />
                  </div>
                </div>
              </div>
            </div>

            <DetailPanel title={`Sources & Trend Analysis`} icon={TrendingUp}>
              {selectedProduct.trendAnalysis && (
                <p className="text-xs text-foreground/80 leading-relaxed mb-2">{selectedProduct.trendAnalysis}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedProduct.sources?.map((src) => (
                  <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                    style={{ background: "hsl(var(--primary) / 0.06)", color: "hsl(var(--primary))" }}>
                    <ExternalLink size={9} /> {src.label?.slice(0, 30)}
                  </a>
                ))}
              </div>
            </DetailPanel>

            <DetailPanel title="Assumptions Map" icon={Brain}>
              <div className="mb-2"><AssumptionsMap product={selectedProduct} /></div>
            </DetailPanel>

            {nextTab && <NextSectionButton label={nextTab.label} onClick={() => goToTab(nextTab.id)} />}
          </div>
        )}

        {/* Tab: Community Intel */}
        {analysis.detailTab === "community" && (
          <div className="space-y-4">
            <SectionHeader current={currentIdx + 1} total={DETAIL_TABS.length} label="Community Intel" icon={MessageSquare} />
            {(selectedProduct as unknown as { communityInsights?: { redditSentiment?: string; topComplaints?: string[]; improvementRequests?: string[]; nostalgiaTriggers?: string[]; competitorComplaints?: string[] } }).communityInsights ? (
              (() => {
                const ci = (selectedProduct as unknown as { communityInsights: { redditSentiment?: string; topComplaints?: string[]; improvementRequests?: string[]; nostalgiaTriggers?: string[]; competitorComplaints?: string[] } }).communityInsights;
                return (
                  <>
                    {ci.redditSentiment && (
                      <div className="p-4 rounded-lg" style={{ background: "hsl(25 90% 50% / 0.08)", border: "1px solid hsl(25 90% 50% / 0.3)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(25 90% 40%)" }}>Community Sentiment</p>
                        <p className="text-xs leading-relaxed" style={{ color: "hsl(25 90% 30%)" }}>{ci.redditSentiment}</p>
                      </div>
                    )}
                    <DetailPanel title={`Complaints & Requests (${(ci.topComplaints?.length || 0) + (ci.improvementRequests?.length || 0)})`} icon={ThumbsDown}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                        {ci.topComplaints?.length ? (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Top Complaints</p>
                            {ci.topComplaints.slice(0, 3).map((c, i) => (
                              <div key={i} className="flex gap-2 items-start text-xs"><ShieldAlert size={10} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} /><span className="text-foreground/80">{c}</span></div>
                            ))}
                          </div>
                        ) : null}
                        {ci.improvementRequests?.length ? (
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Improvement Requests</p>
                            {ci.improvementRequests.slice(0, 3).map((r, i) => (
                              <div key={i} className="flex gap-2 items-start text-xs"><Lightbulb size={10} style={{ color: "hsl(217 91% 55%)", flexShrink: 0, marginTop: 2 }} /><span className="text-foreground/80">{r}</span></div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </DetailPanel>
                    <DetailPanel title="Reviews, Signals & Triggers" icon={TrendingUp}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                        <div className="space-y-1.5">
                          {selectedProduct.reviews?.slice(0, 3).map((review, i) => (
                            <div key={i} className="flex gap-2 items-start text-xs">
                              <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${review.sentiment === "positive" ? "bg-green-500" : review.sentiment === "negative" ? "bg-red-500" : "bg-yellow-500"}`} />
                              <span className="text-foreground/80">{review.text}</span>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1.5">
                          {selectedProduct.socialSignals?.slice(0, 3).map((sig, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "hsl(var(--primary-muted))" }}>
                              <div>
                                <p className="text-[10px] font-semibold" style={{ color: "hsl(var(--primary-dark))" }}>{sig.platform}</p>
                                <p className="text-[10px] text-muted-foreground">{sig.signal}</p>
                              </div>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "hsl(var(--primary))", color: "white" }}>{sig.volume}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DetailPanel>
                  </>
                );
              })()
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Community insights appear after running a live analysis.</p>
              </div>
            )}
            {nextTab && <NextSectionButton label={nextTab.label} onClick={() => goToTab(nextTab.id)} />}
          </div>
        )}

        {/* Tab: Pricing Intel */}
        {analysis.detailTab === "pricing" && (
          <div className="space-y-4">
            <SectionHeader current={currentIdx + 1} total={DETAIL_TABS.length} label="Pricing Intel" icon={DollarSign} />
            {selectedProduct.pricingIntel ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Market Price", value: selectedProduct.pricingIntel.currentMarketPrice, highlight: false },
                    { label: "Collector Premium", value: selectedProduct.pricingIntel.collectorPremium, highlight: false },
                    { label: "Resale Avg", value: selectedProduct.pricingIntel.ebayAvgSold, highlight: true },
                    { label: "Vintage Avg", value: selectedProduct.pricingIntel.etsyAvgSold, highlight: true },
                    { label: "Original MSRP", value: selectedProduct.pricingIntel.msrpOriginal, highlight: false },
                    { label: "Price Trend", value: selectedProduct.pricingIntel.priceDirection?.toUpperCase(), highlight: true },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-lg" style={{
                      background: item.highlight ? "hsl(var(--primary-muted))" : "hsl(var(--muted))",
                      border: item.highlight ? "1px solid hsl(var(--primary) / 0.2)" : "1px solid hsl(var(--border))",
                    }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{item.label}</p>
                      <p className="text-sm font-bold" style={{ color: item.highlight ? "hsl(var(--primary-dark))" : "hsl(var(--foreground))" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <DetailPanel title="Margins & Price Range" icon={DollarSign}>
                  <div className="space-y-2 mb-2">
                    <p className="text-xs text-foreground/80">{selectedProduct.pricingIntel.margins}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-foreground">{selectedProduct.pricingIntel.priceRange}</span>
                      <TrendBadge trend={selectedProduct.pricingIntel.priceDirection as "up" | "down" | "stable"} />
                    </div>
                  </div>
                </DetailPanel>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No pricing intelligence available.</p>
            )}
            {nextTab && <NextSectionButton label={nextTab.label} onClick={() => goToTab(nextTab.id)} />}
          </div>
        )}

        {/* Tab: Supply Chain */}
        {analysis.detailTab === "supply" && (
          <div className="space-y-4">
            <SectionHeader current={currentIdx + 1} total={DETAIL_TABS.length} label="Supply Chain" icon={Package} />
            {selectedProduct.supplyChain ? (
              <>
                <SupplySection title="Suppliers & IP Owners" icon={<Factory size={14} style={{ color: "hsl(var(--primary))" }} />}
                  items={selectedProduct.supplyChain.suppliers.map((s) => ({ name: s.name, badge: s.region, detail: s.role, url: s.url }))}
                  color="hsl(var(--primary-muted))" borderColor="hsl(var(--primary) / 0.3)" />
                <DetailPanel title={`Manufacturers, Vendors & More (${selectedProduct.supplyChain.manufacturers.length + selectedProduct.supplyChain.vendors.length + selectedProduct.supplyChain.distributors.length})`} icon={Package}>
                  <div className="space-y-3 mb-2">
                    <SupplySection title="Manufacturers / OEM" icon={<Package size={12} style={{ color: "hsl(217 91% 60%)" }} />}
                      items={selectedProduct.supplyChain.manufacturers.map((m) => ({ name: m.name, badge: m.region, detail: `MOQ: ${m.moq}`, url: m.url }))}
                      color="hsl(217 91% 60% / 0.08)" borderColor="hsl(217 91% 60% / 0.3)" />
                    <SupplySection title="Vendors" icon={<Store size={12} style={{ color: "hsl(262 83% 58%)" }} />}
                      items={selectedProduct.supplyChain.vendors.map((v) => ({ name: v.name, badge: v.type, detail: v.notes, url: v.url }))}
                      color="hsl(262 83% 58% / 0.08)" borderColor="hsl(262 83% 58% / 0.3)" />
                    <SupplySection title="Distributors" icon={<Truck size={12} style={{ color: "hsl(32 100% 50%)" }} />}
                      items={selectedProduct.supplyChain.distributors.map((d) => ({ name: d.name, badge: d.region, detail: d.notes, url: d.url }))}
                      color="hsl(32 100% 50% / 0.08)" borderColor="hsl(32 100% 50% / 0.3)" />
                  </div>
                </DetailPanel>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedProduct.supplyChain.retailers.map((r) => (
                    <div key={r.name} className="p-3 rounded-lg text-center" style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
                      <p className="text-xs font-bold text-foreground">{r.name}</p>
                      <p className="text-lg font-extrabold" style={{ color: "hsl(142 70% 35%)" }}>{r.marketShare}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No supply chain data available.</p>
            )}
            {nextTab && <NextSectionButton label={nextTab.label} onClick={() => goToTab(nextTab.id)} />}
          </div>
        )}

        {/* Tab: Action Plan */}
        {analysis.detailTab === "action" && (
          <div className="space-y-4">
            <SectionHeader current={currentIdx + 1} total={DETAIL_TABS.length} label="Action Plan" icon={Rocket} />
            {selectedProduct.actionPlan ? (
              <>
                <div className="p-4 rounded-lg text-sm leading-relaxed" style={{ background: "hsl(var(--primary-muted))", borderLeft: "3px solid hsl(var(--primary))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--primary))" }}>Strategic Direction</p>
                  <p className="text-xs" style={{ color: "hsl(var(--primary-dark))" }}>{selectedProduct.actionPlan.strategy}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Quick Wins</p>
                  <div className="space-y-1.5">
                    {selectedProduct.actionPlan.quickWins.slice(0, 3).map((win, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg text-xs" style={{ background: "hsl(142 70% 45% / 0.08)" }}>
                        <CheckCircle2 size={12} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 1 }} />
                        <span style={{ color: "hsl(142 70% 25%)" }}>{win}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <DetailPanel title={`Execution Roadmap (${selectedProduct.actionPlan.phases.length} phases)`} icon={Clock}>
                  <div className="space-y-3 mb-2">
                    {selectedProduct.actionPlan.phases.map((phase, i) => (
                      <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", borderLeft: `3px solid ${i === 0 ? "hsl(142 70% 45%)" : i === 1 ? "hsl(var(--primary))" : "hsl(32 100% 50%)"}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-xs text-foreground">{phase.phase}</h4>
                          <span className="text-[10px] text-muted-foreground">{phase.timeline} · {phase.budget}</span>
                        </div>
                        <ul className="space-y-0.5">
                          {phase.actions.slice(0, 3).map((action, j) => (
                            <li key={j} className="text-[11px] text-foreground/80">• {action}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </DetailPanel>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--muted))" }}>
                    <p className="text-[10px] text-muted-foreground uppercase">Investment</p>
                    <p className="text-sm font-extrabold text-foreground">{selectedProduct.actionPlan.totalInvestment}</p>
                  </div>
                  <div className="p-3 rounded-lg text-center" style={{ background: "hsl(142 70% 45% / 0.08)" }}>
                    <p className="text-[10px] uppercase" style={{ color: "hsl(142 70% 35%)" }}>ROI</p>
                    <p className="text-sm font-extrabold" style={{ color: "hsl(142 70% 28%)" }}>{selectedProduct.actionPlan.expectedROI}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "hsl(var(--primary-muted))" }}>
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Channels</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedProduct.actionPlan.channels.slice(0, 3).map((ch) => (
                        <span key={ch} className="px-1.5 py-0.5 rounded-full text-[9px]" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>{ch}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No action plan available.</p>
            )}
            {nextTab && <NextSectionButton label={nextTab.label} onClick={() => goToTab(nextTab.id)} />}
          </div>
        )}

        {/* After last section (Action Plan), show Next Step button */}
        {analysis.detailTab === "action" && !nextTab && (
          <NextStepButton
            stepNumber={3}
            label="Disrupt"
            color="hsl(271 81% 55%)"
            onClick={() => navigate(`${baseUrl}/disrupt`)}
          />
        )}

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
            <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded text-sm font-medium text-white transition-opacity hover:opacity-90 flex items-center gap-2"
              style={{ background: "hsl(var(--primary))" }}>
              <Globe size={14} /> Visit SGP Capital
            </a>
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
      <p className="section-label text-[10px] mb-2 flex items-center gap-2">{icon} {title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.name} className="p-3 rounded-lg flex items-start justify-between gap-2" style={{ background: color, border: `1px solid ${borderColor}` }}>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
              <p className="text-[11px] text-muted-foreground">{item.detail}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-background/80 text-foreground/70">{item.badge}</span>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: "hsl(var(--primary))" }}>
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
