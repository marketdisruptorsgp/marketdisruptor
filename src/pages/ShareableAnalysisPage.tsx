import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StepNavigator, type StepConfig } from "@/components/StepNavigator";
import { ProductCard } from "@/components/ProductCard";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { CriticalValidation } from "@/components/CriticalValidation";
import { PitchDeck } from "@/components/PitchDeck";
import { ModeHeader } from "@/components/ModeHeader";
import { SectionWorkflowNav } from "@/components/SectionNav";
import { SectionHeader, NextSectionButton, DetailPanel } from "@/components/SectionNav";
import { ScoreBar } from "@/components/ScoreBar";
import { RevivalScoreBadge } from "@/components/RevivalScoreBadge";
import { AssumptionsMap } from "@/components/AssumptionsMap";
import { KeyTakeawayBanner, getCommunityTakeaway, getPricingTakeaway, getSupplyChainTakeaway, getVerdictBadges, getWorkflowTakeaway, getDisruptTakeaway, getStressTestTakeaway, getPitchTakeaway } from "@/components/KeyTakeawayBanner";
import { WorkflowTimeline } from "@/components/FirstPrinciplesAnalysis";
import {
  Zap, AlertTriangle, Target, Brain, Swords, Presentation, Sparkles,
  TrendingUp, TrendingDown, Minus, DollarSign, Package, MessageSquare,
  ExternalLink, ShieldAlert, Lightbulb, ThumbsDown, Clock, CheckCircle2,
  Store, Truck, Factory, Users, Globe, Wrench, Heart, Rocket,
} from "lucide-react";
import type { Product } from "@/data/mockProducts";

interface SharedData {
  title: string;
  category: string;
  avg_revival_score: number;
  products: Product[];
  analysis_data: Record<string, unknown> | null;
  analysis_type: string;
  era: string;
  batch_size: number;
}

const ACCENT = "hsl(var(--primary))";

function getSharedStepConfigs(): StepConfig[] {
  return [
    { step: 2, label: "Intelligence Report", description: "Deep market data, pricing & supply chain intel", icon: Target, color: ACCENT },
    { step: 3, label: "Disrupt", description: "Assumptions, flip the logic & flipped ideas", icon: Brain, color: "hsl(271 81% 55%)" },
    { step: 4, label: "Redesign", description: "Interactive redesigned concept with illustrations", icon: Sparkles, color: "hsl(38 92% 50%)" },
    { step: 5, label: "Stress Test", description: "Red vs Green team critical validation", icon: Swords, color: "hsl(350 80% 55%)" },
    { step: 6, label: "Pitch Deck", description: "Investor-ready presentation builder", icon: Presentation, color: ACCENT },
  ];
}

const SECTION_DESCRIPTIONS: Record<string, string> = {
  overview: "Key insights, scores & market sizing at a glance",
  community: "Community sentiment, complaints & improvement signals",
  workflow: "Step-by-step journey & friction points",
  pricing: "Market prices, margins & resale intelligence",
  supply: "Suppliers, manufacturers & distribution channels",
};

function TrendBadge({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (trend === "up") return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold" style={{ color: "hsl(142 70% 40%)" }}><TrendingUp size={9} /> Rising</span>;
  if (trend === "down") return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold" style={{ color: "hsl(var(--destructive))" }}><TrendingDown size={9} /> Falling</span>;
  return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold" style={{ color: "hsl(38 92% 50%)" }}><Minus size={9} /> Stable</span>;
}

export default function ShareableAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(2);
  const [detailTab, setDetailTab] = useState("overview");
  const [stressTestTab, setStressTestTab] = useState<"debate" | "validate">("debate");
  const sectionTabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke("fetch-shared-analysis", {
          body: { analysisId: id },
        });
        if (fnError || !result?.success) throw new Error(result?.error || "Not found");
        setData(result.analysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load analysis");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="text-center space-y-2">
          <AlertTriangle size={32} className="mx-auto text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">{error || "Analysis not found"}</p>
        </div>
      </div>
    );
  }

  const ad = data.analysis_data;
  const product = data.products?.[0] as Product | undefined;
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <p className="text-sm text-muted-foreground">No product data available</p>
      </div>
    );
  }

  // Resolve disrupt data - handle both formats (nested under 'disrupt' key or top-level)
  const disruptData = ad?.disrupt || (ad?.coreReality ? ad : null);
  const stressTestData = ad?.stressTest || null;
  const pitchDeckData = ad?.pitchDeck || null;
  const redesignData = ad?.redesign || null;
  const userScores = (ad?.userScores as Record<string, Record<string, number>>) || {};

  // Determine which steps have data
  const hasDisrupt = !!disruptData;
  const hasStressTest = !!stressTestData;
  const hasPitch = !!pitchDeckData;

  const visitedSteps = new Set<number>([2]);
  if (hasDisrupt) visitedSteps.add(3).add(4);
  if (hasStressTest) visitedSteps.add(5);
  if (hasPitch) visitedSteps.add(6);

  const isService = product.category === "Service";

  const DETAIL_TABS = [
    { id: "overview", label: "Overview", icon: Target },
    { id: "community", label: "Community Intel", icon: MessageSquare },
    { id: "workflow", label: "User Journey", icon: Clock },
    { id: "pricing", label: "Pricing Intel", icon: DollarSign },
    { id: "supply", label: "Supply Chain", icon: Package },
  ];

  const goToTab = (tabId: string) => {
    setDetailTab(tabId);
    setTimeout(() => sectionTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const currentIdx = DETAIL_TABS.findIndex(t => t.id === detailTab);
  const nextTab = currentIdx < DETAIL_TABS.length - 1 ? DETAIL_TABS[currentIdx + 1] : null;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Shared banner */}
      <div className="py-3 text-center" style={{ background: "hsl(var(--primary))" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Market Disruptor · Shared Analysis</p>
        <h1 className="text-lg font-bold text-white mt-0.5">{data.title}</h1>
        <div className="flex items-center justify-center gap-3 mt-1">
          <span className="text-xs text-white/60">{data.category}</span>
          {data.avg_revival_score && (
            <span className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded">{data.avg_revival_score}/10</span>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        {/* Step Navigator */}
        <StepNavigator
          steps={getSharedStepConfigs()}
          activeStep={activeStep}
          visitedSteps={visitedSteps}
          onStepChange={(s) => {
            setActiveStep(s);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />

        {/* ────────── STEP 2: Intelligence Report ────────── */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <ModeHeader
              stepNumber={2}
              stepTitle="Intelligence Report"
              subtitle={`Deep market intelligence for <strong class="text-foreground">${product.name}</strong>`}
              accentColor={ACCENT}
            />

            <ProductCard product={product} isSelected={true} onClick={() => {}} />

            {/* Section nav */}
            <div ref={sectionTabsRef}>
              <SectionWorkflowNav
                tabs={DETAIL_TABS}
                activeId={detailTab}
                visitedIds={new Set(DETAIL_TABS.map(t => t.id))}
                onSelect={goToTab}
                descriptions={SECTION_DESCRIPTIONS}
                journeyLabel="Analysis Sections"
              />
            </div>

            {/* Overview */}
            {detailTab === "overview" && (
              <div className="space-y-4">
                <SectionHeader current={1} total={DETAIL_TABS.length} label="Overview" description={SECTION_DESCRIPTIONS.overview} icon={Target} />
                {product.keyInsight && (
                  <KeyTakeawayBanner takeaway={product.keyInsight} accentColor={ACCENT} badges={getVerdictBadges(product as any)} />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {product.keyInsight && (
                      <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Key Insight</p>
                        <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.85)" }}>{product.keyInsight}</p>
                      </div>
                    )}
                    {product.description && (
                      <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                        <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>{product.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {product.marketSizeEstimate && (
                      <div className="p-3 rounded-lg" style={{ background: "hsl(142 70% 45% / 0.06)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
                        <p className="text-xs font-semibold" style={{ color: "hsl(142 70% 28%)" }}>TAM: {product.marketSizeEstimate}</p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Confidence Scores</p>
                      <div className="grid grid-cols-1 gap-2">
                        <ScoreBar label="Adoption Likelihood" score={product.confidenceScores?.adoptionLikelihood ?? 7} />
                        <ScoreBar label="Feasibility" score={product.confidenceScores?.feasibility ?? 7} />
                        <ScoreBar label="Emotional Resonance" score={product.confidenceScores?.emotionalResonance ?? 8} />
                      </div>
                    </div>
                  </div>
                </div>

                <DetailPanel title="Sources & Trend Analysis" icon={TrendingUp} defaultOpen>
                  {product.trendAnalysis && <p className="text-xs text-foreground/80 leading-relaxed mb-2">{product.trendAnalysis}</p>}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {product.sources?.map((src) => (
                      <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                        style={{ background: "hsl(var(--primary) / 0.06)", color: "hsl(var(--primary))" }}>
                        <ExternalLink size={9} /> {src.label?.slice(0, 30)}
                      </a>
                    ))}
                  </div>
                </DetailPanel>

                <DetailPanel title="Assumptions Map" icon={Brain}>
                  <div className="mb-2"><AssumptionsMap product={product} /></div>
                </DetailPanel>

                {nextTab && <NextSectionButton label={nextTab.label} onClick={() => goToTab(nextTab.id)} />}
              </div>
            )}

            {/* Community Intel */}
            {detailTab === "community" && (
              <div className="space-y-4">
                <SectionHeader current={currentIdx + 1} total={DETAIL_TABS.length} label="Community Intel" description={SECTION_DESCRIPTIONS.community} icon={MessageSquare} />
                {(() => {
                  const ci = (product as any).communityInsights;
                  const takeaway = ci ? getCommunityTakeaway(ci) : null;
                  return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor="hsl(25 90% 40%)" /> : null;
                })()}
                {(() => {
                  const ci = (product as any).communityInsights;
                  if (!ci) return <p className="text-sm text-muted-foreground py-8 text-center">No community data available</p>;
                  const hasRealSentiment = ci.redditSentiment && !/no direct.*found|not found/i.test(ci.redditSentiment);
                  return (
                    <>
                      {hasRealSentiment && (
                        <div className="p-4 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(25 90% 40%)" }}>Community Sentiment</p>
                          <p className="text-xs leading-relaxed" style={{ color: "hsl(25 90% 30%)" }}>{ci.redditSentiment}</p>
                        </div>
                      )}
                      <DetailPanel title={`Complaints & Requests (${(ci.topComplaints?.length || 0) + (ci.improvementRequests?.length || 0)})`} icon={ThumbsDown} defaultOpen>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                          {ci.topComplaints?.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Top Complaints</p>
                              {ci.topComplaints.map((c: string, i: number) => (
                                <div key={i} className="flex gap-2 items-start text-xs"><ShieldAlert size={10} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} /><span className="text-foreground/80">{c}</span></div>
                              ))}
                            </div>
                          )}
                          {ci.improvementRequests?.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Improvement Requests</p>
                              {ci.improvementRequests.map((r: string, i: number) => (
                                <div key={i} className="flex gap-2 items-start text-xs"><Lightbulb size={10} style={{ color: "hsl(217 91% 55%)", flexShrink: 0, marginTop: 2 }} /><span className="text-foreground/80">{r}</span></div>
                              ))}
                            </div>
                          )}
                        </div>
                      </DetailPanel>
                    </>
                  );
                })()}
                {nextTab && <NextSectionButton label={nextTab.label} onClick={() => goToTab(nextTab.id)} />}
              </div>
            )}

            {/* User Journey / Workflow */}
            {detailTab === "workflow" && (
              <div className="space-y-4">
                <SectionHeader current={currentIdx + 1} total={DETAIL_TABS.length} label="User Journey" description={SECTION_DESCRIPTIONS.workflow} icon={Clock} />
                {(() => {
                  const wf = (product as any).userWorkflow || (product as any).workflow;
                  if (!wf) return <p className="text-sm text-muted-foreground py-8 text-center">No workflow data available</p>;
                  return (
                    <>
                      {wf.stepByStep && <WorkflowTimeline steps={wf.stepByStep} frictionPoints={wf.frictionPoints || []} />}
                      {wf.contextOfUse && (
                        <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Context of Use</p>
                          <p className="text-xs text-foreground/80">{wf.contextOfUse}</p>
                        </div>
                      )}
                      {wf.cognitiveLoad && (
                        <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Cognitive Load</p>
                          <p className="text-xs text-foreground/80">{wf.cognitiveLoad}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
                {nextTab && <NextSectionButton label={nextTab.label} onClick={() => goToTab(nextTab.id)} />}
              </div>
            )}

            {/* Pricing Intel */}
            {detailTab === "pricing" && (
              <div className="space-y-4">
                <SectionHeader current={currentIdx + 1} total={DETAIL_TABS.length} label="Pricing Intel" description={SECTION_DESCRIPTIONS.pricing} icon={DollarSign} />
                {(() => {
                  const pi = product.pricingIntel as any;
                  if (!pi) return <p className="text-sm text-muted-foreground py-8 text-center">No pricing data available</p>;
                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {pi.currentMarketPrice && (
                          <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                            <p className="text-[10px] text-muted-foreground">Market Price</p>
                            <p className="text-sm font-bold text-foreground">{pi.currentMarketPrice}</p>
                          </div>
                        )}
                        {pi.margins && (
                          <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                            <p className="text-[10px] text-muted-foreground">Margins</p>
                            <p className="text-sm font-bold text-foreground">{pi.margins}</p>
                          </div>
                        )}
                        {pi.priceRange && (
                          <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                            <p className="text-[10px] text-muted-foreground">Price Range</p>
                            <p className="text-sm font-bold text-foreground">{pi.priceRange}</p>
                          </div>
                        )}
                        {pi.collectorPremium && (
                          <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                            <p className="text-[10px] text-muted-foreground">Collector Premium</p>
                            <p className="text-sm font-bold text-foreground">{pi.collectorPremium}</p>
                          </div>
                        )}
                      </div>
                      {(pi.ebayAvgSold || pi.etsyAvgSold) && (
                        <div className="grid grid-cols-2 gap-3">
                          {pi.ebayAvgSold && (
                            <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                              <p className="text-[10px] text-muted-foreground">eBay Avg Sold</p>
                              <p className="text-sm font-bold text-foreground">{pi.ebayAvgSold}</p>
                            </div>
                          )}
                          {pi.etsyAvgSold && (
                            <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                              <p className="text-[10px] text-muted-foreground">Etsy Avg Sold</p>
                              <p className="text-sm font-bold text-foreground">{pi.etsyAvgSold}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
                {nextTab && <NextSectionButton label={nextTab.label} onClick={() => goToTab(nextTab.id)} />}
              </div>
            )}

            {/* Supply Chain */}
            {detailTab === "supply" && (
              <div className="space-y-4">
                <SectionHeader current={currentIdx + 1} total={DETAIL_TABS.length} label="Supply Chain" description={SECTION_DESCRIPTIONS.supply} icon={Package} />
                {(() => {
                  const sc = (product as any).supplyChainIntel || (product as any).supplyChain;
                  if (!sc) return <p className="text-sm text-muted-foreground py-8 text-center">No supply chain data available</p>;
                  return (
                    <>
                      {sc.suppliers?.length > 0 && (
                        <DetailPanel title={`Suppliers (${sc.suppliers.length})`} icon={Factory} defaultOpen>
                          <div className="space-y-2 mb-2">
                            {sc.suppliers.map((s: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                                <p className="text-xs font-bold text-foreground">{s.name || s.supplier}</p>
                                {s.role && <p className="text-[10px] text-muted-foreground mt-0.5">{s.role}</p>}
                                {s.region && <p className="text-[10px] text-muted-foreground">{s.region}</p>}
                              </div>
                            ))}
                          </div>
                        </DetailPanel>
                      )}
                      {sc.distributors?.length > 0 && (
                        <DetailPanel title={`Distributors (${sc.distributors.length})`} icon={Truck}>
                          <div className="space-y-2 mb-2">
                            {sc.distributors.map((d: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                                <p className="text-xs font-bold text-foreground">{d.name || d.distributor}</p>
                                {d.role && <p className="text-[10px] text-muted-foreground mt-0.5">{d.role}</p>}
                              </div>
                            ))}
                          </div>
                        </DetailPanel>
                      )}
                      {sc.manufacturingInsight && (
                        <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Manufacturing Insight</p>
                          <p className="text-xs text-foreground/80">{sc.manufacturingInsight}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Next step button */}
            {hasDisrupt && (
              <button
                onClick={() => { setActiveStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-colors"
                style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
              >
                <Brain size={14} /> Continue to Disrupt →
              </button>
            )}
          </div>
        )}

        {/* ────────── STEP 3: Disrupt ────────── */}
        {activeStep === 3 && (
          <div className="space-y-4">
            {(() => {
              const takeaway = getDisruptTakeaway(disruptData as Record<string, unknown> | null);
              return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor="hsl(271 81% 55%)" /> : null;
            })()}

            <ModeHeader
              stepNumber={3}
              stepTitle="Disrupt"
              subtitle={`Deconstructing <strong class="text-foreground">${product.name}</strong> — questioning every assumption and generating radical reinvention ideas.`}
              accentColor="hsl(271 81% 55%)"
            />

            {hasDisrupt ? (
              <div className="rounded overflow-hidden p-3 sm:p-5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <FirstPrinciplesAnalysis
                  product={product}
                  flippedIdeas={product.flippedIdeas}
                  externalData={disruptData}
                  userScores={userScores}
                  renderMode="disrupt"
                />
              </div>
            ) : (
              <div className="py-12 text-center">
                <Brain size={32} className="mx-auto text-muted-foreground opacity-40 mb-2" />
                <p className="text-sm text-muted-foreground">Disrupt analysis was not completed for this project</p>
              </div>
            )}

            {hasDisrupt && (
              <button
                onClick={() => { setActiveStep(4); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-colors"
                style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
              >
                <Sparkles size={14} /> Continue to Redesign →
              </button>
            )}
          </div>
        )}

        {/* ────────── STEP 4: Redesign ────────── */}
        {activeStep === 4 && (
          <div className="space-y-4">
            <ModeHeader
              stepNumber={4}
              stepTitle="Redesign"
              subtitle={`Interactive concept illustrations for <strong class="text-foreground">${product.name}</strong> — visualizing the reinvented model.`}
              accentColor="hsl(38 92% 50%)"
            />

            {hasDisrupt ? (
              <div className="rounded overflow-hidden p-3 sm:p-5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <FirstPrinciplesAnalysis
                  product={product}
                  flippedIdeas={product.flippedIdeas}
                  externalData={disruptData}
                  renderMode="redesign"
                />
              </div>
            ) : (
              <div className="py-12 text-center">
                <Sparkles size={32} className="mx-auto text-muted-foreground opacity-40 mb-2" />
                <p className="text-sm text-muted-foreground">Redesign was not completed for this project</p>
              </div>
            )}

            {hasStressTest && (
              <button
                onClick={() => { setActiveStep(5); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-colors"
                style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
              >
                <Swords size={14} /> Continue to Stress Test →
              </button>
            )}
          </div>
        )}

        {/* ────────── STEP 5: Stress Test ────────── */}
        {activeStep === 5 && (
          <div className="space-y-4">
            {(() => {
              const takeaway = getStressTestTakeaway(stressTestData as Record<string, unknown> | null);
              return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor="hsl(350 80% 55%)" /> : null;
            })()}

            <ModeHeader
              stepNumber={5}
              stepTitle="Stress Test"
              subtitle={`Red Team vs Green Team critical validation for <strong class="text-foreground">${product.name}</strong>`}
              accentColor="hsl(350 80% 55%)"
            />

            {hasStressTest ? (
              <div className="rounded overflow-hidden p-3 sm:p-5 space-y-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <SectionWorkflowNav
                  tabs={[
                    { id: "debate" as const, label: "Red vs Green Debate", icon: Swords },
                    { id: "validate" as const, label: "Validate & Score", icon: CheckCircle2 },
                  ]}
                  activeId={stressTestTab}
                  visitedIds={new Set(["debate", "validate"])}
                  onSelect={(id) => setStressTestTab(id as "debate" | "validate")}
                  descriptions={{ debate: "Red Team attacks vs Green Team defenses", validate: "Feasibility checklist & confidence scores" }}
                  journeyLabel="Stress Test Journey"
                />
                <CriticalValidation
                  product={product}
                  analysisData={product}
                  activeTab={stressTestTab}
                  externalData={stressTestData}
                />
              </div>
            ) : (
              <div className="py-12 text-center">
                <Swords size={32} className="mx-auto text-muted-foreground opacity-40 mb-2" />
                <p className="text-sm text-muted-foreground">Stress test was not completed for this project</p>
              </div>
            )}

            {hasPitch && (
              <button
                onClick={() => { setActiveStep(6); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-colors"
                style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
              >
                <Presentation size={14} /> Continue to Pitch Deck →
              </button>
            )}
          </div>
        )}

        {/* ────────── STEP 6: Pitch Deck ────────── */}
        {activeStep === 6 && (
          <div className="space-y-4">
            {(() => {
              const takeaway = getPitchTakeaway(pitchDeckData as Record<string, unknown> | null);
              return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor={ACCENT} /> : null;
            })()}

            <ModeHeader
              stepNumber={6}
              stepTitle="Investor Pitch Deck"
              subtitle={`Professional pitch deck for <strong class="text-foreground">${product.name}</strong> — 10 slides`}
              accentColor={ACCENT}
            />

            {hasPitch ? (
              <div className="rounded overflow-hidden p-3 sm:p-5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <PitchDeck
                  product={product}
                  externalData={pitchDeckData}
                  disruptData={disruptData}
                  stressTestData={stressTestData}
                  redesignData={redesignData}
                  userScores={userScores}
                />
              </div>
            ) : (
              <div className="py-12 text-center">
                <Presentation size={32} className="mx-auto text-muted-foreground opacity-40 mb-2" />
                <p className="text-sm text-muted-foreground">Pitch deck was not completed for this project</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t text-center space-y-3" style={{ borderColor: "hsl(var(--border))" }}>
          <p className="text-[10px] text-muted-foreground">
            Generated by Market Disruptor · Analysis is for informational purposes only
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            <Rocket size={12} /> Run Your Own Analysis
          </a>
        </div>
      </main>
    </div>
  );
}