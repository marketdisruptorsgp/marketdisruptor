import { useState, useEffect, useMemo } from "react";
import { PricingIntelCard } from "@/components/PricingIntelCard";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StepNavigator, type StepConfig } from "@/components/StepNavigator";
import { ProductCard } from "@/components/ProductCard";
import { AnalysisVisualLayer } from "@/components/AnalysisVisualLayer";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { ReasoningSynopsis } from "@/components/ReasoningSynopsis";
import { CriticalValidation } from "@/components/CriticalValidation";
import { PitchDeck } from "@/components/PitchDeck";
import { BusinessModelAnalysis, type BusinessModelAnalysisData } from "@/components/BusinessModelAnalysis";
import { AssumptionsMap } from "@/components/AssumptionsMap";
import { KeyTakeawayBanner, getCommunityTakeaway, getPricingTakeaway, getSupplyChainTakeaway, getVerdictBadges, getWorkflowTakeaway, getDisruptTakeaway, getStressTestTakeaway, getPitchTakeaway } from "@/components/KeyTakeawayBanner";
import { AdaptiveJourneyMap } from "@/components/AdaptiveJourneyMap";
import {
  Zap, AlertTriangle, Target, Brain, Swords, Presentation, Sparkles,
  TrendingUp, TrendingDown, Minus, DollarSign, Package, MessageSquare,
  ExternalLink, ShieldAlert, Lightbulb, ThumbsDown, Clock, CheckCircle2,
  Store, Truck, Factory, Users, Globe, Wrench, Heart, Rocket,
  XCircle, BarChart3, ScrollText,
} from "lucide-react";
import type { Product } from "@/data/mockProducts";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { PatentIntelligence } from "@/components/PatentIntelligence";

// ── Standardized analysis components ──
import {
  InsightCard,
  FrameworkPanel,
  SignalCard,
  MetricCard,
  VisualGrid,
  ExpandableDetail,
  AnalysisPanel,
} from "@/components/analysis/AnalysisComponents";

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
    { step: 3, label: "Deconstruct", description: "Assumptions, flip the logic & flipped ideas", icon: Brain, color: "hsl(271 81% 55%)" },
    { step: 4, label: "Redesign", description: "Interactive redesigned concept with illustrations", icon: Sparkles, color: "hsl(38 92% 50%)" },
    { step: 5, label: "Stress Test", description: "Red vs Green team critical validation", icon: Swords, color: "hsl(350 80% 55%)" },
    { step: 6, label: "Pitch Deck", description: "Investor-ready presentation builder", icon: Presentation, color: ACCENT },
  ];
}

/* ── Section Card — uses standardized AnalysisPanel ── */
function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <AnalysisPanel icon={Icon} title={title}>
      {children}
    </AnalysisPanel>
  );
}

/* ── Supply Chain sub-section ── */
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

export default function ShareableAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [governedData, setGovernedData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(2);
  const [activeSection, setActiveSection] = useState("overview");
  const [stressTestTab, setStressTestTab] = useState<"debate" | "validate">("debate");
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
        const ad = result.analysis.analysis_data;
        const gov = ad?.governed as Record<string, unknown> | null;
        setGovernedData(gov || null);

        // On-demand backfill if governed data is missing
        const hasRH = !!(gov?.root_hypotheses || (gov?.constraint_map as any)?.root_hypotheses);
        const hasSynopsis = !!gov?.reasoning_synopsis;
        if ((!hasRH || !hasSynopsis) && id) {
          supabase.functions.invoke("backfill-strategic-os", {
            body: { singleAnalysisId: id },
          }).then(({ data: bfData }) => {
            if (bfData?.hypotheses || bfData?.synopsis) {
              setGovernedData(prev => ({
                ...(prev || {}),
                ...(bfData.hypotheses ? { root_hypotheses: bfData.hypotheses } : {}),
                ...(bfData.synopsis ? { reasoning_synopsis: bfData.synopsis } : {}),
              }));
            }
          }).catch(() => { /* silent */ });
        }
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
  const isBusinessModel = data.analysis_type === "business_model";
  const product = data.products?.[0] as Product | undefined;

  if (!isBusinessModel && !product) {
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

  const isService = product?.category === "Service";

  // Section tabs for Intelligence Report — matches authenticated ReportPage
  const sectionTabs: { id: string; label: string; icon: React.ElementType }[] = [];
  sectionTabs.push({ id: "overview", label: "Overview", icon: Target });
  const uw = (product as any)?.userWorkflow || (product as any)?.userJourney;
  const uwSteps = uw?.stepByStep || uw?.steps;
  if (uwSteps?.length > 0) sectionTabs.push({ id: "journey", label: "User Journey", icon: Clock });
  const ci = (product as any)?.communityInsights;
  if (ci) sectionTabs.push({ id: "community", label: "Community Intel", icon: MessageSquare });
  if (product?.pricingIntel) sectionTabs.push({ id: "pricing", label: "Pricing Intel", icon: DollarSign });
  if (!isService && (product as any)?.supplyChain) sectionTabs.push({ id: "supply", label: "Supply Chain", icon: Package });
  if (!isService) sectionTabs.push({ id: "patents", label: "Patent Intel", icon: ScrollText });

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* Step Navigator */}
        {!isBusinessModel && (
          <StepNavigator
            steps={getSharedStepConfigs()}
            activeStep={activeStep}
            visitedSteps={visitedSteps}
            onStepChange={(s) => {
              setActiveStep(s);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {/* Analysis title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground px-1">{data.title}</h1>
        <div className="flex flex-wrap items-center gap-3 px-1">
          <span className="typo-page-meta">{data.category}</span>
          {data.avg_revival_score && (
            <span className="typo-card-meta font-bold bg-muted border border-border px-2 py-0.5 rounded">{data.avg_revival_score}/10</span>
          )}
          {/* Lens context badge — shows what evaluation lens was active */}
          {(() => {
            const lensSnap = ad?.lensSnapshot as { name?: string; lensType?: string; primary_objective?: string; risk_tolerance?: string; time_horizon?: string } | null;
            if (!lensSnap) return null;
            const lensLabel = lensSnap.lensType === "eta" ? "ETA Acquisition Lens" : lensSnap.name ? `${lensSnap.name} Lens` : "Custom Lens";
            const lensColor = lensSnap.lensType === "eta" ? "hsl(142 70% 40%)" : "hsl(38 92% 50%)";
            return (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border"
                style={{ color: lensColor, borderColor: lensColor, background: `${lensColor} / 0.08` }}
                title={lensSnap.primary_objective || undefined}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>
                {lensLabel}
                {lensSnap.risk_tolerance && <span className="opacity-70">· {lensSnap.risk_tolerance} risk</span>}
              </span>
            );
          })()}
        </div>

        {/* ────────── BUSINESS MODEL VIEW ────────── */}
        {isBusinessModel && (
          <div className="space-y-4">
            <div className="rounded-xl p-5 space-y-2.5" style={{ background: "hsl(var(--foreground))" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}>
                  <Target size={18} style={{ color: "white" }} />
                </div>
                <h3 className="font-extrabold text-base leading-tight" style={{ color: "white" }}>Business Model Analysis</h3>
              </div>
              <p className="text-sm leading-relaxed pl-[48px]" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
                First-principles deconstruction of {data.title}
              </p>
            </div>
            <div className="rounded-xl overflow-hidden p-3 sm:p-5 border border-border bg-card shadow-sm">
              <BusinessModelAnalysis initialData={ad as unknown as BusinessModelAnalysisData} />
            </div>
          </div>
        )}

        {/* ────────── STEP 2: Intelligence Report ────────── */}
        {!isBusinessModel && activeStep === 2 && (
          <div className="space-y-4">
            {/* Section title */}
            <h2 className="typo-section-title px-1">Intelligence Report</h2>

            {/* Context Banner — matches authenticated */}
            <div className="rounded-xl p-5 space-y-2.5" style={{ background: "hsl(var(--foreground))" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}>
                  <Target size={18} style={{ color: "white" }} />
                </div>
                <h3 className="font-extrabold text-base leading-tight" style={{ color: "white" }}>Intelligence Report</h3>
              </div>
              <p className="text-sm font-bold leading-relaxed pl-[48px]" style={{ color: "white" }}>
                A consolidated view of pricing, supply chain, community sentiment, and competitive positioning — each finding tagged by confidence level.
              </p>
            </div>

            {/* Tab buttons — pill style matching authenticated */}
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
                      background: isActive ? ACCENT : "hsl(var(--muted))",
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

            {/* Divider */}
            <div className="h-px w-full" style={{ background: "hsl(var(--border))" }} />

            {/* Overview */}
            {activeSection === "overview" && (
              <AnalysisVisualLayer analysis={product as unknown as Record<string, unknown>} step="report" governedOverride={governedData}>
                <SectionCard icon={Target} title="Overview">
                  {product!.keyInsight && (
                    <InsightCard
                      icon={Target}
                      headline={product!.keyInsight}
                      badge={product!.marketSizeEstimate ? `TAM: ${product!.marketSizeEstimate}` : undefined}
                      badgeColor="hsl(152 60% 44%)"
                    >
                      <VisualGrid columns={3}>
                        <MetricCard label="Adoption" value={`${product!.confidenceScores?.adoptionLikelihood ?? 7}/10`} />
                        <MetricCard label="Feasibility" value={`${product!.confidenceScores?.feasibility ?? 7}/10`} />
                        <MetricCard label="Resonance" value={`${product!.confidenceScores?.emotionalResonance ?? 8}/10`} />
                      </VisualGrid>
                    </InsightCard>
                  )}
                  {product!.description && (
                    <InsightCard
                      headline="Market Context"
                      subtext={product!.description.length > 120 ? product!.description.slice(0, 120) + "…" : product!.description}
                      detail={
                        <div className="space-y-3">
                          <p>{product!.description}</p>
                          {product!.trendAnalysis && <p className="text-foreground/80">{product!.trendAnalysis}</p>}
                          {product!.sources?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {product!.sources.map((src: any) => (
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
                </SectionCard>
              </AnalysisVisualLayer>
            )}

            {/* User Journey */}
            {activeSection === "journey" && uwSteps?.length > 0 && (
              <SectionCard icon={Clock} title="User Journey">
                <AdaptiveJourneyMap
                  steps={uwSteps}
                  frictionPoints={uw?.frictionPoints || []}
                  cognitiveLoad={uw?.cognitiveLoad}
                  contextOfUse={uw?.contextOfUse}
                  category={product?.category}
                  productName={product?.name}
                />
              </SectionCard>
            )}

            {/* Community Intel */}
            {activeSection === "community" && ci && (
              <FrameworkPanel icon={MessageSquare} title="Community Intel" subtitle="Aggregated sentiment from user reviews and community discussions">
                {(() => {
                  const sentiment = ci.communitySentiment || ci.redditSentiment;
                  const hasReal = sentiment && !/no direct.*found|not found/i.test(sentiment);
                  return (
                    <div className="space-y-3">
                      {hasReal && (
                        <InsightCard headline="Community Sentiment" subtext={sentiment} accentColor="hsl(217 91% 45%)" />
                      )}
                      {ci.topComplaints?.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Top Complaints</p>
                          <VisualGrid columns={2}>
                            {ci.topComplaints.map((c: string, i: number) => (
                              <SignalCard key={i} label={c} type="weakness" />
                            ))}
                          </VisualGrid>
                        </div>
                      )}
                      {ci.improvementRequests?.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Improvement Requests</p>
                          <VisualGrid columns={2}>
                            {ci.improvementRequests.map((r: string, i: number) => (
                              <SignalCard key={i} label={r} type="opportunity" />
                            ))}
                          </VisualGrid>
                        </div>
                      )}
                      {(product as any)?.reviews?.length > 0 && (
                        <ExpandableDetail label={`${(product as any).reviews.length} Reviews`} icon={MessageSquare}>
                          <div className="space-y-2 mt-2">
                            {(product as any).reviews.map((review: any, i: number) => (
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

            {/* Pricing Intel */}
            {activeSection === "pricing" && product?.pricingIntel && (
              <SectionCard icon={DollarSign} title="Pricing Intel">
                <PricingIntelCard pricingIntel={product.pricingIntel as any} />
              </SectionCard>
            )}

            {/* Supply Chain */}
            {activeSection === "supply" && !isService && (product as any)?.supplyChain && (
              <SectionCard icon={Package} title="Supply Chain">
                <SupplySection
                  title="Manufacturers"
                  icon={<Factory size={11} />}
                  items={((product as any).supplyChain.manufacturers || []).map((m: any) => ({
                    name: m.name, badge: m.region || "—", detail: m.specialty || m.notes || "", url: m.url,
                  }))}
                  color="hsl(var(--muted))"
                  borderColor="hsl(var(--border))"
                />
                <SupplySection
                  title="Distributors"
                  icon={<Truck size={11} />}
                  items={((product as any).supplyChain.distributors || []).map((d: any) => ({
                    name: d.name, badge: d.region || "—", detail: d.specialty || d.notes || "", url: d.url,
                  }))}
                  color="hsl(var(--muted))"
                  borderColor="hsl(var(--border))"
                />
                <SupplySection
                  title="Retailers"
                  icon={<Store size={11} />}
                  items={((product as any).supplyChain.retailers || []).map((r: any) => ({
                    name: r.name, badge: r.type || "—", detail: r.notes || "", url: r.url,
                  }))}
                  color="hsl(var(--muted))"
                  borderColor="hsl(var(--border))"
                />
              </SectionCard>
            )}

            {/* Patent Intel */}
            {activeSection === "patents" && !isService && (
              <SectionCard icon={ScrollText} title="Patent Intelligence">
                <PatentIntelligence product={product!} />
              </SectionCard>
            )}

            {/* Next step */}
            {hasDisrupt && (
              <button
                onClick={() => { setActiveStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors"
                style={{ background: ACCENT, color: "white" }}
              >
                <Brain size={14} /> Continue to Disrupt →
              </button>
            )}
          </div>
        )}

        {/* ────────── STEP 3: Disrupt ────────── */}
        {!isBusinessModel && activeStep === 3 && (
          <div className="space-y-4">
            <h2 className="typo-section-title px-1">Strategic Intelligence</h2>

            {/* Context Banner */}
            <div className="rounded-xl p-5 space-y-2.5" style={{ background: "hsl(var(--foreground))" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(271 81% 55%)" }}>
                  <Brain size={18} style={{ color: "white" }} />
                </div>
                <h3 className="font-extrabold text-base leading-tight" style={{ color: "white" }}>Deconstruct</h3>
              </div>
              <p className="text-sm leading-relaxed pl-[48px]" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
                Questioning every assumption and generating radical reinvention ideas for {product!.name}.
              </p>
            </div>

            {(() => {
              const takeaway = getDisruptTakeaway(disruptData as Record<string, unknown> | null);
              return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor="hsl(271 81% 55%)" /> : null;
            })()}

            {/* Reasoning Synopsis */}
            {governedData?.reasoning_synopsis && (
              <div className="rounded-xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <ReasoningSynopsis
                  data={governedData.reasoning_synopsis}
                  analysisData={{ ...product, governed: governedData } as any}
                  products={undefined}
                  title={product!.name || ""}
                  category={data.category || ""}
                  analysisType={data.analysis_type || "product"}
                  avgScore={data.avg_revival_score ?? null}
                />
              </div>
            )}

            {hasDisrupt ? (
              <div className="rounded-xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <FirstPrinciplesAnalysis
                  product={product!}
                  flippedIdeas={product!.flippedIdeas}
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
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors"
                style={{ background: ACCENT, color: "white" }}
              >
                <Sparkles size={14} /> Continue to Redesign →
              </button>
            )}
          </div>
        )}

        {/* ────────── STEP 4: Redesign ────────── */}
        {!isBusinessModel && activeStep === 4 && (
          <div className="space-y-4">
            <h2 className="typo-section-title px-1">Redesign</h2>

            {/* Context Banner */}
            <div className="rounded-xl p-5 space-y-2.5" style={{ background: "hsl(var(--foreground))" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(38 92% 50%)" }}>
                  <Sparkles size={18} style={{ color: "white" }} />
                </div>
                <h3 className="font-extrabold text-base leading-tight" style={{ color: "white" }}>Redesign</h3>
              </div>
              <p className="text-sm leading-relaxed pl-[48px]" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
                Interactive concept illustrations for {product!.name} — visualizing the reinvented model.
              </p>
            </div>

            {hasDisrupt ? (
              <div className="rounded-xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <FirstPrinciplesAnalysis
                  product={product!}
                  flippedIdeas={product!.flippedIdeas}
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
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors"
                style={{ background: ACCENT, color: "white" }}
              >
                <Swords size={14} /> Continue to Stress Test →
              </button>
            )}
          </div>
        )}

        {/* ────────── STEP 5: Stress Test ────────── */}
        {!isBusinessModel && activeStep === 5 && (
          <div className="space-y-4">
            <h2 className="typo-section-title px-1">Stress Test</h2>

            {/* Context Banner */}
            <div className="rounded-xl p-5 space-y-2.5" style={{ background: "hsl(var(--foreground))" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(350 80% 55%)" }}>
                  <Swords size={18} style={{ color: "white" }} />
                </div>
                <h3 className="font-extrabold text-base leading-tight" style={{ color: "white" }}>Stress Test</h3>
              </div>
              <p className="text-sm leading-relaxed pl-[48px]" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
                Red Team vs Green Team adversarial debate — your idea is attacked and defended to expose blind spots, validate strengths, and deliver a clear survival judgment.
              </p>
            </div>

            {(() => {
              const takeaway = getStressTestTakeaway(stressTestData as Record<string, unknown> | null);
              return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor="hsl(350 80% 55%)" /> : null;
            })()}

            {hasStressTest ? (
              <>
                {/* Tab buttons — pill style matching authenticated */}
                <div className="flex items-center gap-2 flex-wrap">
                  {([
                    { id: "debate" as const, label: "Red Team", icon: XCircle, color: "hsl(0 72% 48%)" },
                    { id: "validate" as const, label: "Validate & Score", icon: BarChart3, color: ACCENT },
                  ] as const).map(tab => {
                    const isActive = stressTestTab === tab.id;
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setStressTestTab(tab.id)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                        style={{
                          background: isActive ? tab.color : "hsl(var(--muted))",
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

                {/* Divider */}
                <div className="h-px w-full" style={{ background: "hsl(var(--border))" }} />

                <div className="rounded overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                  <CriticalValidation
                    product={product!}
                    analysisData={product!}
                    activeTab={stressTestTab}
                    externalData={stressTestData}
                  />
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <Swords size={32} className="mx-auto text-muted-foreground opacity-40 mb-2" />
                <p className="typo-card-body text-muted-foreground">Stress test was not completed for this project</p>
              </div>
            )}

            {hasPitch && (
              <button
                onClick={() => { setActiveStep(6); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors"
                style={{ background: ACCENT, color: "white" }}
              >
                <Presentation size={14} /> Continue to Pitch Deck →
              </button>
            )}
          </div>
        )}

        {/* ────────── STEP 6: Pitch Deck ────────── */}
        {!isBusinessModel && activeStep === 6 && (
          <div className="space-y-4">
            <h2 className="typo-section-title px-1">Investor Pitch Deck</h2>

            {/* Context Banner */}
            <div className="rounded-xl p-5 space-y-2.5" style={{ background: "hsl(var(--foreground))" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}>
                  <Presentation size={18} style={{ color: "white" }} />
                </div>
                <h3 className="font-extrabold text-base leading-tight" style={{ color: "white" }}>Pitch Deck</h3>
              </div>
              <p className="text-sm leading-relaxed pl-[48px]" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
                Professional 10-slide presentation for {product!.name}.
              </p>
            </div>

            {(() => {
              const takeaway = getPitchTakeaway(pitchDeckData as Record<string, unknown> | null);
              return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor={ACCENT} /> : null;
            })()}

            {hasPitch ? (
              <div className="rounded-xl overflow-hidden p-4 sm:p-6" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <PitchDeck
                  product={product!}
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
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-colors"
            style={{ background: ACCENT, color: "white" }}
          >
            <Rocket size={12} /> Run Your Own Analysis
          </a>
        </div>
      </main>
    </div>
  );
}
