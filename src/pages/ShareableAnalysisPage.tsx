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
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";

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
  if (trend === "up") return <span className="inline-flex items-center gap-0.5 text-[13px] font-bold" style={{ color: "hsl(142 70% 40%)" }}><TrendingUp size={11} /> Rising</span>;
  if (trend === "down") return <span className="inline-flex items-center gap-0.5 text-[13px] font-bold" style={{ color: "hsl(var(--destructive))" }}><TrendingDown size={11} /> Falling</span>;
  return <span className="inline-flex items-center gap-0.5 text-[13px] font-bold" style={{ color: "hsl(38 92% 50%)" }}><Minus size={11} /> Stable</span>;
}

/* Shared label component — enforces 13px minimum */
function DataLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
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
  const { tier } = useSubscription();

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

  const renderState = (content: React.ReactNode) => (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 min-h-[calc(100vh-72px)] flex items-center justify-center">
        {content}
      </div>
    </div>
  );

  if (loading) {
    return renderState(
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded flex items-center justify-center bg-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return renderState(
      <div className="text-center space-y-2">
        <AlertTriangle size={32} className="mx-auto text-muted-foreground opacity-40" />
        <p className="typo-card-body text-muted-foreground">{error || "Analysis not found"}</p>
      </div>
    );
  }

  const ad = data.analysis_data;
  const product = data.products?.[0] as Product | undefined;
  if (!product) {
    return renderState(<p className="typo-card-body text-muted-foreground">No product data available</p>);
  }

  const disruptData = ad?.disrupt || (ad?.coreReality ? ad : null);
  const stressTestData = ad?.stressTest || null;
  const pitchDeckData = ad?.pitchDeck || null;
  const redesignData = ad?.redesign || null;
  const userScores = (ad?.userScores as Record<string, Record<string, number>>) || {};

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
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
          <p className="typo-card-eyebrow">Market Disruptor · Shared Analysis</p>
          <h1 className="typo-page-title text-2xl sm:text-3xl mt-1">{data.title}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="typo-page-meta">{data.category}</span>
            {data.avg_revival_score && (
              <span className="typo-card-meta font-bold bg-muted border border-border px-2 py-0.5 rounded">{data.avg_revival_score}/10</span>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
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
                      <div className="p-3 rounded-lg bg-muted border border-border">
                        <DataLabel>Key Insight</DataLabel>
                        <p className="typo-card-body mt-1" style={{ color: "hsl(var(--foreground) / 0.85)" }}>{product.keyInsight}</p>
                      </div>
                    )}
                    {product.description && (
                      <div className="p-3 rounded-lg bg-muted border border-border">
                        <DataLabel>Description</DataLabel>
                        <p className="typo-card-meta mt-1" style={{ color: "hsl(var(--foreground) / 0.8)" }}>{product.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {product.marketSizeEstimate && (
                      <div className="p-3 rounded-lg" style={{ background: "hsl(142 70% 45% / 0.06)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
                        <p className="typo-card-meta font-semibold" style={{ color: "hsl(142 70% 28%)" }}>TAM: {product.marketSizeEstimate}</p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-muted border border-border">
                      <DataLabel>Confidence Scores</DataLabel>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        <ScoreBar label="Adoption Likelihood" score={product.confidenceScores?.adoptionLikelihood ?? 7} />
                        <ScoreBar label="Feasibility" score={product.confidenceScores?.feasibility ?? 7} />
                        <ScoreBar label="Emotional Resonance" score={product.confidenceScores?.emotionalResonance ?? 8} />
                      </div>
                    </div>
                  </div>
                </div>

                <DetailPanel title="Sources & Trend Analysis" icon={TrendingUp} defaultOpen>
                  {product.trendAnalysis && <p className="typo-card-meta text-foreground/80 leading-relaxed mb-2">{product.trendAnalysis}</p>}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {product.sources?.map((src) => (
                      <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded typo-card-meta font-medium"
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
                  if (!ci) return <p className="typo-card-body text-muted-foreground py-8 text-center">No community data available</p>;
                  const sentiment = ci.communitySentiment || ci.redditSentiment;
                  const hasRealSentiment = sentiment && !/no direct.*found|not found/i.test(sentiment);
                  return (
                    <>
                      {hasRealSentiment && (
                        <div className="p-4 rounded-lg bg-muted border border-border">
                          <DataLabel>Community Sentiment</DataLabel>
                          <p className="typo-card-meta mt-1" style={{ color: "hsl(25 90% 30%)" }}>{sentiment}</p>
                        </div>
                      )}
                      <DetailPanel title={`Complaints & Requests (${(ci.topComplaints?.length || 0) + (ci.improvementRequests?.length || 0)})`} icon={ThumbsDown} defaultOpen>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                          {ci.topComplaints?.length > 0 && (
                            <div className="space-y-1.5">
                              <DataLabel>Top Complaints</DataLabel>
                              {ci.topComplaints.map((c: string, i: number) => (
                                <div key={i} className="flex gap-2 items-start typo-card-meta"><ShieldAlert size={10} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} /><span className="text-foreground/80">{c}</span></div>
                              ))}
                            </div>
                          )}
                          {ci.improvementRequests?.length > 0 && (
                            <div className="space-y-1.5">
                              <DataLabel>Improvement Requests</DataLabel>
                              {ci.improvementRequests.map((r: string, i: number) => (
                                <div key={i} className="flex gap-2 items-start typo-card-meta"><Lightbulb size={10} style={{ color: "hsl(217 91% 55%)", flexShrink: 0, marginTop: 2 }} /><span className="text-foreground/80">{r}</span></div>
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
                  if (!wf) return <p className="typo-card-body text-muted-foreground py-8 text-center">No workflow data available</p>;
                  return (
                    <>
                      {wf.stepByStep && <WorkflowTimeline steps={wf.stepByStep} frictionPoints={wf.frictionPoints || []} />}
                      {wf.contextOfUse && (
                        <div className="p-3 rounded-lg bg-muted border border-border">
                          <DataLabel>Context of Use</DataLabel>
                          <p className="typo-card-meta text-foreground/80 mt-1">{wf.contextOfUse}</p>
                        </div>
                      )}
                      {wf.cognitiveLoad && (
                        <div className="p-3 rounded-lg bg-muted border border-border">
                          <DataLabel>Cognitive Load</DataLabel>
                          <p className="typo-card-meta text-foreground/80 mt-1">{wf.cognitiveLoad}</p>
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
                  if (!pi) return <p className="typo-card-body text-muted-foreground py-8 text-center">No pricing data available</p>;
                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {pi.currentMarketPrice && (
                          <div className="p-3 rounded-lg text-center bg-muted border border-border">
                            <DataLabel>Market Price</DataLabel>
                            <p className="typo-card-body font-bold text-foreground mt-1">{pi.currentMarketPrice}</p>
                          </div>
                        )}
                        {pi.margins && (
                          <div className="p-3 rounded-lg text-center bg-muted border border-border">
                            <DataLabel>Margins</DataLabel>
                            <p className="typo-card-body font-bold text-foreground mt-1">{pi.margins}</p>
                          </div>
                        )}
                        {pi.priceRange && (
                          <div className="p-3 rounded-lg text-center bg-muted border border-border">
                            <DataLabel>Price Range</DataLabel>
                            <p className="typo-card-body font-bold text-foreground mt-1">{pi.priceRange}</p>
                          </div>
                        )}
                        {pi.collectorPremium && (
                          <div className="p-3 rounded-lg text-center bg-muted border border-border">
                            <DataLabel>Collector Premium</DataLabel>
                            <p className="typo-card-body font-bold text-foreground mt-1">{pi.collectorPremium}</p>
                          </div>
                        )}
                      </div>
                      {((pi as any).resaleAvgSold || pi.ebayAvgSold || (pi as any).vintageAvgSold || pi.etsyAvgSold) && (
                        <div className="grid grid-cols-2 gap-3">
                          {((pi as any).resaleAvgSold || pi.ebayAvgSold) && (
                            <div className="p-3 rounded-lg text-center bg-muted border border-border">
                              <DataLabel>Resale Avg Sold</DataLabel>
                              <p className="typo-card-body font-bold text-foreground mt-1">{(pi as any).resaleAvgSold || pi.ebayAvgSold}</p>
                            </div>
                          )}
                          {((pi as any).vintageAvgSold || pi.etsyAvgSold) && (
                            <div className="p-3 rounded-lg text-center bg-muted border border-border">
                              <DataLabel>Vintage Avg Sold</DataLabel>
                              <p className="typo-card-body font-bold text-foreground mt-1">{(pi as any).vintageAvgSold || pi.etsyAvgSold}</p>
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
                  if (!sc) return <p className="typo-card-body text-muted-foreground py-8 text-center">No supply chain data available</p>;
                  return (
                    <>
                      {sc.suppliers?.length > 0 && (
                        <DetailPanel title={`Suppliers (${sc.suppliers.length})`} icon={Factory} defaultOpen>
                          <div className="space-y-2 mb-2">
                            {sc.suppliers.map((s: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-lg bg-muted border border-border">
                                <p className="typo-card-meta font-bold text-foreground">{s.name || s.supplier}</p>
                                {s.role && <p className="typo-card-meta text-muted-foreground mt-0.5">{s.role}</p>}
                                {s.region && <p className="typo-card-meta text-muted-foreground">{s.region}</p>}
                              </div>
                            ))}
                          </div>
                        </DetailPanel>
                      )}
                      {sc.distributors?.length > 0 && (
                        <DetailPanel title={`Distributors (${sc.distributors.length})`} icon={Truck}>
                          <div className="space-y-2 mb-2">
                            {sc.distributors.map((d: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-lg bg-muted border border-border">
                                <p className="typo-card-meta font-bold text-foreground">{d.name || d.distributor}</p>
                                {d.role && <p className="typo-card-meta text-muted-foreground mt-0.5">{d.role}</p>}
                              </div>
                            ))}
                          </div>
                        </DetailPanel>
                      )}
                      {sc.manufacturingInsight && (
                        <div className="p-3 rounded-lg bg-muted border border-border">
                          <DataLabel>Manufacturing Insight</DataLabel>
                          <p className="typo-card-meta text-foreground/80 mt-1">{sc.manufacturingInsight}</p>
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
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl typo-button-primary bg-primary text-primary-foreground transition-colors hover:bg-primary-dark"
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
              <div className="rounded-xl overflow-hidden p-3 sm:p-5 border border-border bg-card shadow-sm">
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
                <p className="typo-card-body text-muted-foreground">Disrupt analysis was not completed for this project</p>
              </div>
            )}

            {hasDisrupt && (
              <button
                onClick={() => { setActiveStep(4); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl typo-button-primary bg-primary text-primary-foreground transition-colors hover:bg-primary-dark"
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
              <div className="rounded-xl overflow-hidden p-3 sm:p-5 border border-border bg-card shadow-sm">
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
                <p className="typo-card-body text-muted-foreground">Redesign was not completed for this project</p>
              </div>
            )}

            {hasStressTest && (
              <button
                onClick={() => { setActiveStep(5); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl typo-button-primary bg-primary text-primary-foreground transition-colors hover:bg-primary-dark"
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
              <div className="rounded-xl overflow-hidden p-3 sm:p-5 space-y-4 border border-border bg-card shadow-sm">
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
                <p className="typo-card-body text-muted-foreground">Stress test was not completed for this project</p>
              </div>
            )}

            {hasPitch && (
              <button
                onClick={() => { setActiveStep(6); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl typo-button-primary bg-primary text-primary-foreground transition-colors hover:bg-primary-dark"
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
              <div className="rounded-xl overflow-hidden p-3 sm:p-5 border border-border bg-card shadow-sm">
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
                <p className="typo-card-body text-muted-foreground">Pitch deck was not completed for this project</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-border text-center space-y-3">
          <p className="typo-card-meta text-muted-foreground text-center">
            Generated by Market Disruptor · Analysis is for informational purposes only
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl typo-button-primary bg-primary text-primary-foreground transition-colors hover:bg-primary-dark"
          >
            <Rocket size={12} /> Run Your Own Analysis
          </a>
        </div>
      </main>
    </div>
  );
}
