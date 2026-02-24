import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Product } from "@/data/mockProducts";
import { downloadPitchDeckPDF } from "@/lib/pdfExport";
import { useAuth } from "@/hooks/useAuth";
import { ReferralCTA } from "@/components/ReferralCTA";
import { ExportPanel } from "@/components/export/ExportPanel";
import { PITCH_SLIDE_DESCRIPTIONS } from "@/lib/stepConfigs";
import { Slider } from "@/components/ui/slider";
import {
  Presentation, RefreshCw, DollarSign, TrendingUp, Users, Factory, Truck,
  Package, Globe, Target, Zap, CheckCircle2, ArrowRight, BarChart3,
  ShieldAlert, Lightbulb, Store, Phone, Mail, ExternalLink, Clock,
  Star, AlertTriangle, Download, ChevronRight, Rocket, Sparkles,
  Award, Layers, Shield, LineChart,
} from "lucide-react";
import { NextSectionButton, SectionWorkflowNav, AllExploredBadge } from "@/components/SectionNav";
import { PitchSlideFrame, SlideStatCard, SlideBullet } from "@/components/pitch/PitchSlideFrame";
import { StepLoadingTracker, PITCH_DECK_TASKS } from "@/components/StepLoadingTracker";
import { CompletionExperience } from "@/components/CompletionExperience";
import { useNavigate } from "react-router-dom";

// Interfaces
interface FinancialModel {
  unitEconomics: {
    cogs: string;
    retailPrice: string;
    grossMargin: string;
    contributionMargin: string;
    paybackPeriod: string;
    ltv?: string;
    cac?: string;
  };
  scenarios: {
    conservative: { units: string; revenue: string; profit: string; assumptions: string };
    base: { units: string; revenue: string; profit: string; assumptions: string };
    optimistic: { units: string; revenue: string; profit: string; assumptions: string };
  };
  pricingStrategy: string;
  breakEvenAnalysis: string;
  fundingAsk: string;
  useOfFunds: string[];
  exitStrategy: string;
}

interface SupplierContact {
  name: string;
  role: string;
  region: string;
  url?: string;
  email?: string;
  phone?: string;
  moq?: string;
  leadTime?: string;
  certifications?: string[];
  notes: string;
}

interface PitchDeckData {
  elevatorPitch: string;
  problemStatement: string;
  solutionStatement: string;
  whyNow: string;
  marketOpportunity: {
    tam: string;
    sam: string;
    som: string;
    growthRate: string;
    keyDrivers: string[];
  };
  productInnovation?: string;
  businessModel?: {
    revenueStreams?: string[];
    pricingModel?: string;
    unitEconomics?: FinancialModel["unitEconomics"];
  };
  tractionSignals?: string[];
  competitiveAdvantages: string[];
  competitiveLandscape?: {
    directCompetitors?: { name: string; strength: string; weakness: string }[];
    indirectCompetitors?: string[];
    moat?: string;
  };
  investmentAsk?: {
    amount?: string;
    useOfFunds?: string[];
    scenarios?: FinancialModel["scenarios"];
    exitStrategy?: string;
  };
  customerPersona: {
    name: string;
    age: string;
    painPoints: string[];
    buyingBehavior: string;
    willingness: string;
  };
  financialModel: FinancialModel;
  supplierContacts: SupplierContact[];
  distributorContacts: SupplierContact[];
  gtmStrategy: {
    phase1: string;
    phase2: string;
    phase3: string;
    keyChannels: string[];
    launchBudget: string;
  };
  risks: { risk: string; mitigation: string; severity: "high" | "medium" | "low" }[];
  keyMetrics: { metric: string; target: string; why: string }[];
  investorHighlights: string[];
  completionMessage?: string;
}

interface PitchDeckProps {
  product: Product;
  analysisId?: string;
  onSave?: (deckData: PitchDeckData) => void;
  externalData?: unknown;
  disruptData?: unknown;
  stressTestData?: unknown;
  redesignData?: unknown;
  userScores?: Record<string, Record<string, number>>;
}

const SLIDE_TABS = [
  { id: "problem", label: "Problem", icon: AlertTriangle },
  { id: "solution", label: "Solution", icon: Lightbulb },
  { id: "whynow", label: "Why Now", icon: Clock },
  { id: "market", label: "Market", icon: Globe },
  { id: "product", label: "Product", icon: Layers },
  { id: "businessmodel", label: "Business Model", icon: DollarSign },
  { id: "traction", label: "Traction", icon: TrendingUp },
  { id: "risks", label: "Risks", icon: ShieldAlert },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
  { id: "gtm", label: "GTM", icon: Target },
  { id: "competitive", label: "Competitive", icon: Shield },
  { id: "invest", label: "Investment", icon: Rocket },
] as const;

type SlideTab = typeof SLIDE_TABS[number]["id"];

const TOTAL = SLIDE_TABS.length;

export const PitchDeck = ({ product, analysisId, onSave, externalData, disruptData, stressTestData, redesignData, userScores }: PitchDeckProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<PitchDeckData | null>((externalData as PitchDeckData) || null);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState<SlideTab>("problem");
  const [visitedSlides, setVisitedSlides] = useState<Set<string>>(new Set(["problem"]));
  const [userScore, setUserScore] = useState<number>(product.revivalScore || 7);
  const [showCompletion, setShowCompletion] = useState(false);

  const handleDownloadPDF = () => { if (!data) return; downloadPitchDeckPDF(product, data); };

  const currentIdx = SLIDE_TABS.findIndex(t => t.id === activeSlide);
  const currentTab = SLIDE_TABS[currentIdx];
  const nextSlide = currentIdx < TOTAL - 1 ? SLIDE_TABS[currentIdx + 1] : null;

  const goNext = () => {
    if (!nextSlide) {
      setShowCompletion(true);
      return;
    }
    setActiveSlide(nextSlide.id);
    setVisitedSlides(prev => new Set([...prev, nextSlide.id]));
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-pitch-deck", {
        body: {
          product,
          disruptData: disruptData || undefined,
          stressTestData: stressTestData || undefined,
          redesignData: redesignData || undefined,
          userScores: userScores || undefined,
        },
      });
      if (error || !result?.success) {
        const msg = result?.error || error?.message || "Generation failed";
        if (msg.includes("429") || msg.includes("Rate limit")) toast.error("Rate limit hit — please wait a moment and try again.");
        else if (msg.includes("402") || msg.includes("credits")) toast.error("AI credits exhausted.");
        else toast.error("Pitch deck generation failed: " + msg);
        return;
      }
      setData(result.deck);
      onSave?.(result.deck);
      toast.success("Pitch deck generated!");
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!data && loading) {
    return (
      <StepLoadingTracker
        title="Building Pitch Deck"
        tasks={PITCH_DECK_TASKS}
        estimatedSeconds={35}
        accentColor="hsl(var(--primary))"
      />
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
          <Presentation size={36} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Investor Pitch Deck</h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Full investor-ready brief for <strong>{product.name}</strong> — 12 structured sections covering problem, market, financials, and GTM.
          </p>
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-colors"
          style={{ background: "hsl(var(--primary))", color: "white", opacity: loading ? 0.7 : 1 }}>
          <Presentation size={15} /> Generate Full Pitch Deck
        </button>
        <p className="text-[11px] text-muted-foreground">Uses Gemini 2.5 Flash · ~20–40 seconds</p>
      </div>
    );
  }

  if (showCompletion) {
    const completionMsg = data.completionMessage || `${product.name} represents a structurally differentiated opportunity in a market where incumbents have stopped questioning their own assumptions.`;
    return (
      <CompletionExperience
        productName={product.name}
        completionMessage={completionMsg}
        onExportPDF={handleDownloadPDF}
        onBackToSections={() => setShowCompletion(false)}
        accentColor="hsl(var(--primary))"
        analysisData={(() => {
          const ad: Record<string, unknown> = {};
          if (disruptData) ad.disrupt = disruptData;
          if (redesignData) ad.redesign = redesignData;
          if (stressTestData) ad.stressTest = stressTestData;
          if (data) ad.pitchDeck = data;
          if (userScores) ad.userScores = userScores;
          return ad;
        })()}
        createdAt={new Date().toISOString()}
      />
    );
  }

  const fm = data.financialModel || (data.businessModel?.unitEconomics ? {
    unitEconomics: data.businessModel.unitEconomics,
    scenarios: data.investmentAsk?.scenarios || {} as any,
    pricingStrategy: data.businessModel.pricingModel || "",
    breakEvenAnalysis: data.businessModel.unitEconomics?.paybackPeriod || "",
    fundingAsk: data.investmentAsk?.amount || "",
    useOfFunds: data.investmentAsk?.useOfFunds || [],
    exitStrategy: data.investmentAsk?.exitStrategy || "",
  } : null);

  /* ── Helper: wrap content in a slide ── */
  const Slide = ({ children }: { children: React.ReactNode }) => (
    <PitchSlideFrame
      slideNumber={currentIdx + 1}
      totalSlides={TOTAL}
      title={currentTab.label === "GTM" ? "Go-to-Market Strategy" : currentTab.label === "Why Now" ? "Why Now" : SLIDE_TITLES[activeSlide] || currentTab.label}
      subtitle={PITCH_SLIDE_DESCRIPTIONS[activeSlide]}
      icon={currentTab.icon}
      accentColor="hsl(var(--primary))"
      productName={product.name}
    >
      {children}
    </PitchSlideFrame>
  );

  return (
    <div className="space-y-4">
      {/* Header toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Presentation size={14} style={{ color: "white" }} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Pitch Deck: {product.name}</h3>
            <p className="text-[10px] text-muted-foreground">{TOTAL} slides · Click any to jump</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportPanel
            product={product}
            pitchDeckData={data}
            analysisId={analysisId}
            userId={user?.id}
            accentColor="hsl(var(--primary))"
          />
          <button onClick={runAnalysis} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
            {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />} Regenerate
          </button>
        </div>
      </div>

      <SectionWorkflowNav
        tabs={SLIDE_TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
        activeId={activeSlide}
        visitedIds={visitedSlides}
        onSelect={(id) => { setActiveSlide(id); setVisitedSlides(prev => new Set([...prev, id])); }}
        descriptions={PITCH_SLIDE_DESCRIPTIONS}
        journeyLabel="Pitch Deck Sections"
      />

      {/* ═══════ SLIDE 1: PROBLEM ═══════ */}
      {activeSlide === "problem" && (
        <Slide>
          <div className="space-y-5 h-full flex flex-col justify-center">
            <div className="p-5 sm:p-6 rounded-xl" style={{ background: "hsl(var(--destructive) / 0.05)", border: "1px solid hsl(var(--destructive) / 0.15)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--destructive))" }}>Problem Statement</p>
              <p className="text-sm sm:text-base leading-relaxed text-foreground/90">{data.problemStatement}</p>
            </div>
            {data.customerPersona && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Target Customer</p>
                  <p className="text-sm font-bold text-foreground">{data.customerPersona.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Age: {data.customerPersona.age} · {data.customerPersona.buyingBehavior}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Key Pain Points</p>
                  <div className="space-y-1.5">
                    {data.customerPersona.painPoints.slice(0, 3).map((p, i) => (
                      <SlideBullet key={i} icon={AlertTriangle} iconColor="hsl(var(--destructive))">{p}</SlideBullet>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Slide>
      )}

      {/* ═══════ SLIDE 2: SOLUTION ═══════ */}
      {activeSlide === "solution" && (
        <Slide>
          <div className="space-y-5 h-full flex flex-col justify-center">
            <div className="p-5 sm:p-6 rounded-xl" style={{ background: "hsl(142 70% 45% / 0.05)", border: "1px solid hsl(142 70% 45% / 0.15)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(142 70% 35%)" }}>Our Solution</p>
              <p className="text-sm sm:text-base leading-relaxed text-foreground/90">{data.solutionStatement}</p>
            </div>
            <div className="p-5 sm:p-7 rounded-xl text-white" style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)" }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 opacity-60">Elevator Pitch</p>
              <p className="text-base sm:text-lg font-bold leading-relaxed">{data.elevatorPitch}</p>
            </div>
          </div>
        </Slide>
      )}

      {/* ═══════ SLIDE 3: WHY NOW ═══════ */}
      {activeSlide === "whynow" && (
        <Slide>
          <div className="h-full flex flex-col justify-center">
            <div className="p-6 sm:p-8 rounded-xl" style={{ background: "hsl(38 92% 50% / 0.05)", border: "1px solid hsl(38 92% 50% / 0.15)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "hsl(38 92% 35%)" }}>Market Timing & Tailwinds</p>
              <p className="text-sm sm:text-base leading-relaxed text-foreground/90">{data.whyNow}</p>
            </div>
          </div>
        </Slide>
      )}

      {/* ═══════ SLIDE 4: MARKET ═══════ */}
      {activeSlide === "market" && data.marketOpportunity && (
        <Slide>
          <div className="space-y-5 h-full flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-3">
              <SlideStatCard label="TAM" value={data.marketOpportunity.tam} accentColor="hsl(var(--primary))" />
              <SlideStatCard label="SAM" value={data.marketOpportunity.sam} accentColor="hsl(217 91% 55%)" />
              <SlideStatCard label="SOM" value={data.marketOpportunity.som} accentColor="hsl(142 70% 40%)" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Growth Rate</p>
                <p className="text-xl font-extrabold" style={{ color: "hsl(var(--primary))" }}>{data.marketOpportunity.growthRate}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Key Drivers</p>
                <div className="space-y-1.5">
                  {data.marketOpportunity.keyDrivers.slice(0, 3).map((d, i) => (
                    <div key={i} className="flex gap-2 items-start text-xs">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0" style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                      <span className="text-foreground/80">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Slide>
      )}

      {/* ═══════ SLIDE 5: PRODUCT ═══════ */}
      {activeSlide === "product" && (
        <Slide>
          <div className="space-y-5 h-full flex flex-col justify-center">
            {data.productInnovation && (
              <div className="p-5 sm:p-6 rounded-xl" style={{ background: "hsl(var(--primary) / 0.04)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-primary">What Makes It Different</p>
                <p className="text-sm sm:text-base leading-relaxed text-foreground/90">{data.productInnovation}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Competitive Advantages</p>
                <div className="space-y-2">
                  {data.competitiveAdvantages.slice(0, 4).map((adv, i) => (
                    <SlideBullet key={i} icon={ArrowRight}>{adv}</SlideBullet>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Investor Highlights</p>
                <div className="space-y-2">
                  {data.investorHighlights.slice(0, 4).map((h, i) => (
                    <SlideBullet key={i} icon={Zap}>{h}</SlideBullet>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Slide>
      )}

      {/* ═══════ SLIDE 6: BUSINESS MODEL ═══════ */}
      {activeSlide === "businessmodel" && (
        <Slide>
          <div className="space-y-5 h-full flex flex-col justify-center">
            {data.businessModel?.revenueStreams && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue Streams</p>
                <div className="flex flex-wrap gap-2">
                  {data.businessModel.revenueStreams.map((s, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                      <DollarSign size={11} /> {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {fm && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "COGS", value: fm.unitEconomics.cogs },
                    { label: "Price", value: fm.unitEconomics.retailPrice },
                    { label: "Gross Margin", value: fm.unitEconomics.grossMargin, highlight: true },
                    { label: "Payback", value: fm.unitEconomics.paybackPeriod },
                  ].map((item) => (
                    <SlideStatCard key={item.label} label={item.label} value={item.value} accentColor={item.highlight ? "hsl(var(--primary))" : undefined} />
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fm.pricingStrategy && (
                    <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Pricing Strategy</p>
                      <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{fm.pricingStrategy}</p>
                    </div>
                  )}
                  {fm.breakEvenAnalysis && (
                    <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Break-Even</p>
                      <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{fm.breakEvenAnalysis}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Slide>
      )}

      {/* ═══════ SLIDE 7: TRACTION ═══════ */}
      {activeSlide === "traction" && (
        <Slide>
          <div className="space-y-4 h-full flex flex-col justify-center">
            {data.tractionSignals?.length ? data.tractionSignals.map((s, i) => (
              <div key={i} className="flex gap-3 items-start p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <TrendingUp size={16} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
                <p className="text-sm text-foreground/90 leading-relaxed">{s}</p>
              </div>
            )) : (
              <div className="p-6 text-center rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-sm text-muted-foreground">No explicit traction signals available yet. This section strengthens as you gather pre-launch data.</p>
              </div>
            )}
          </div>
        </Slide>
      )}

      {/* ═══════ SLIDE 8: RISKS ═══════ */}
      {activeSlide === "risks" && (
        <Slide>
          <div className="space-y-3 h-full flex flex-col justify-center">
            {data.risks.map((r, i) => {
              const sColor = r.severity === "high" ? "hsl(var(--destructive))" : r.severity === "medium" ? "hsl(38 92% 45%)" : "hsl(142 70% 40%)";
              return (
                <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                  <div className="flex items-center gap-3 px-4 py-3" style={{ background: "hsl(var(--muted))" }}>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ color: sColor, background: `${sColor}10`, border: `1px solid ${sColor}30` }}>{r.severity}</span>
                    <p className="text-xs sm:text-sm font-bold text-foreground">{r.risk}</p>
                  </div>
                  <div className="px-4 py-3 flex gap-3 items-start">
                    <CheckCircle2 size={14} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{r.mitigation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Slide>
      )}

      {/* ═══════ SLIDE 9: METRICS ═══════ */}
      {activeSlide === "metrics" && (
        <Slide>
          <div className="space-y-4 h-full flex flex-col justify-center">
            <div className="space-y-3">
              {data.keyMetrics.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 sm:p-4 rounded-xl"
                  style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-foreground">{m.metric}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{m.why}</p>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
                    style={{ background: "hsl(var(--primary))", color: "white" }}>{m.target}</span>
                </div>
              ))}
            </div>
            {/* Score comparison */}
            <div className="p-4 sm:p-5 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Revival Potential Score</p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">AI Score</p>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-extrabold" style={{ background: "hsl(var(--primary))", color: "white" }}>
                    {product.revivalScore || "—"}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">Your Rating</p>
                    <span className="text-sm font-extrabold" style={{ color: "hsl(var(--primary))" }}>{userScore}/10</span>
                  </div>
                  <Slider value={[userScore]} onValueChange={(v) => setUserScore(v[0])} min={1} max={10} step={1} />
                </div>
              </div>
            </div>
          </div>
        </Slide>
      )}

      {/* ═══════ SLIDE 10: GTM ═══════ */}
      {activeSlide === "gtm" && data.gtmStrategy && (
        <Slide>
          <div className="space-y-4 h-full flex flex-col justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Phase 1: Launch", content: data.gtmStrategy.phase1, color: "hsl(142 70% 45%)" },
                { label: "Phase 2: Scale", content: data.gtmStrategy.phase2, color: "hsl(var(--primary))" },
                { label: "Phase 3: Dominate", content: data.gtmStrategy.phase3, color: "hsl(38 92% 50%)" },
              ].map((phase, i) => (
                <div key={i} className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", borderTop: `3px solid ${phase.color}`, border: "1px solid hsl(var(--border))" }}>
                  <p className="text-xs font-bold mb-2" style={{ color: phase.color }}>{phase.label}</p>
                  <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{phase.content}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Key Channels</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.gtmStrategy.keyChannels.map((ch, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.2)" }}>{ch}</span>
                  ))}
                </div>
              </div>
              <SlideStatCard label="Launch Budget" value={data.gtmStrategy.launchBudget} accentColor="hsl(142 70% 35%)" />
            </div>
          </div>
        </Slide>
      )}

      {/* ═══════ SLIDE 11: COMPETITIVE ═══════ */}
      {activeSlide === "competitive" && (
        <Slide>
          <div className="space-y-4 h-full flex flex-col justify-center">
            {data.competitiveLandscape?.directCompetitors?.map((c, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-sm font-bold text-foreground mb-2">{c.name}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Strength</p>
                    <p className="text-xs sm:text-sm text-foreground/80">{c.strength}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase mb-0.5" style={{ color: "hsl(var(--destructive))" }}>Weakness</p>
                    <p className="text-xs sm:text-sm text-foreground/80">{c.weakness}</p>
                  </div>
                </div>
              </div>
            ))}
            {data.competitiveLandscape?.moat && (
              <div className="p-5 rounded-xl" style={{ background: "hsl(var(--primary) / 0.04)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-primary">Defensible Moat</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{data.competitiveLandscape.moat}</p>
              </div>
            )}
            {(!data.competitiveLandscape?.directCompetitors?.length) && data.competitiveAdvantages.length > 0 && (
              <div className="space-y-2">
                {data.competitiveAdvantages.map((a, i) => (
                  <SlideBullet key={i} icon={ArrowRight}>{a}</SlideBullet>
                ))}
              </div>
            )}
          </div>
        </Slide>
      )}

      {/* ═══════ SLIDE 12: INVESTMENT ═══════ */}
      {activeSlide === "invest" && (
        <Slide>
          <div className="space-y-5 h-full flex flex-col justify-center">
            {/* Funding ask hero */}
            <div className="p-5 rounded-xl text-center" style={{ background: "hsl(var(--primary) / 0.04)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Funding Ask</p>
              <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: "hsl(var(--primary))" }}>{fm?.fundingAsk || data.investmentAsk?.amount || "TBD"}</p>
            </div>

            {/* Revenue scenarios */}
            {fm?.scenarios && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: "conservative", label: "Conservative", color: "hsl(217 91% 55%)", data: fm.scenarios.conservative },
                  { key: "base", label: "Base Case", color: "hsl(var(--primary))", data: fm.scenarios.base },
                  { key: "optimistic", label: "Optimistic", color: "hsl(142 70% 40%)", data: fm.scenarios.optimistic },
                ].map((s) => s.data && (
                  <div key={s.key} className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", borderTop: `3px solid ${s.color}` }}>
                    <p className="text-xs font-bold mb-2" style={{ color: s.color }}>{s.label}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-bold" style={{ color: s.color }}>{s.data.revenue}</span></div>
                      {s.data.units && <div className="flex justify-between"><span className="text-muted-foreground">Units</span><span className="font-bold">{s.data.units}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Use of funds & Exit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Use of Funds</p>
                <div className="space-y-1.5">
                  {(fm?.useOfFunds || data.investmentAsk?.useOfFunds || []).slice(0, 5).map((u, i) => (
                    <SlideBullet key={i} icon={CheckCircle2}>{u}</SlideBullet>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Exit Strategy</p>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">{fm?.exitStrategy || data.investmentAsk?.exitStrategy || "TBD"}</p>
              </div>
            </div>
          </div>
        </Slide>
      )}

      {/* Navigation below the slide */}
      {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
      {!nextSlide && activeSlide === "invest" && (
        <>
          <AllExploredBadge />
          {/* SGP Capital CTA */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--primary))" }}>
                  <Rocket size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">How SGP Capital Can Help</h3>
                  <p className="text-[10px] text-muted-foreground">Tailored support for bringing {product.name} to market</p>
                </div>
              </div>
              <div className="space-y-2">
                {(() => {
                  const bullets: string[] = [];
                  if (product.supplyChain?.manufacturers?.length) bullets.push(`Connect with manufacturers & suppliers in ${product.supplyChain.manufacturers[0]?.region || "key regions"}`);
                  if (data?.gtmStrategy) bullets.push(`Refine go-to-market strategy across ${data.gtmStrategy.keyChannels?.slice(0, 2).join(" & ") || "target channels"}`);
                  if (fm) bullets.push("Fine-tune financial model and identify potential investors");
                  if (product.category) bullets.push(`Strategic positioning in the ${product.category} space`);
                  if (bullets.length === 0) {
                    bullets.push("Investor introductions & fundraising strategy");
                    bullets.push("Sales, marketing & go-to-market execution");
                  }
                  return bullets.slice(0, 4).map((b, i) => (
                    <SlideBullet key={i} icon={CheckCircle2}>{b}</SlideBullet>
                  ));
                })()}
              </div>
              <a
                href={(() => {
                  const name = profile?.first_name || "there";
                  const email = user?.email || "";
                  const projectUrl = analysisId
                    ? `http://marketdisruptor.sgpcapital.com/analysis/${analysisId}/pitch`
                    : "http://marketdisruptor.sgpcapital.com";
                  const lines = [
                    `Hi SGP Capital team,`, ``,
                    `I've been working through a disruption analysis on ${product.name} in the ${product.category} space and I think there's real potential here.`, ``,
                  ];
                  if (product.revivalScore) { lines.push(`The AI scored it ${product.revivalScore}/10 for revival potential and I rated it ${userScore}/10.`); lines.push(``); }
                  lines.push(`You can view my full analysis here:`);
                  lines.push(projectUrl);
                  lines.push(``);
                  lines.push(`Best,`);
                  lines.push(name);
                  if (email) lines.push(email);
                  return `mailto:steven@sgpcapital.com?subject=${encodeURIComponent(`Help Disrupt: ${product.name}`)}&body=${encodeURIComponent(lines.join("\n"))}`;
                })()}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: "hsl(var(--primary))", color: "white" }}>
                <Rocket size={14} /> Help Disrupt
              </a>
            </div>
          </div>
          <NextSectionButton label="View Completion Summary" onClick={goNext} />
        </>
      )}

      {/* Referral CTA */}
      <div className="mt-6">
        <ReferralCTA compact />
      </div>
    </div>
  );
};

/* ── Slide title map ── */
const SLIDE_TITLES: Record<string, string> = {
  problem: "The Problem",
  solution: "The Solution",
  whynow: "Why Now",
  market: "Market Opportunity",
  product: "Product / Innovation",
  businessmodel: "Business Model",
  traction: "Traction Signals",
  risks: "Risks & Mitigation",
  metrics: "Metrics That Matter",
  gtm: "Go-to-Market Strategy",
  competitive: "Competitive Landscape",
  invest: "Investment Ask",
};

function ContactCard({ contact, accentColor }: { contact: SupplierContact; accentColor: string }) {
  return (
    <div className="p-3 rounded-lg space-y-2"
      style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm font-bold text-foreground">{contact.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${accentColor}15`, color: accentColor }}>{contact.role}</span>
            <span className="text-[10px] text-muted-foreground">{contact.region}</span>
          </div>
        </div>
        {contact.url && (
          <a href={contact.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: `${accentColor}15`, color: accentColor }}>
            <ExternalLink size={10} /> Visit
          </a>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {contact.moq && <div><p className="text-[10px] text-muted-foreground font-semibold">MOQ</p><p className="font-bold">{contact.moq}</p></div>}
        {contact.leadTime && <div><p className="text-[10px] text-muted-foreground font-semibold">Lead Time</p><p className="font-bold">{contact.leadTime}</p></div>}
        {contact.email && <div><p className="text-[10px] text-muted-foreground font-semibold">Email</p><a href={`mailto:${contact.email}`} className="font-medium text-xs break-all" style={{ color: "hsl(var(--primary))" }}>{contact.email}</a></div>}
        {contact.phone && <div><p className="text-[10px] text-muted-foreground font-semibold">Phone</p><a href={`tel:${contact.phone}`} className="font-medium text-xs" style={{ color: "hsl(var(--primary))" }}>{contact.phone}</a></div>}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{contact.notes}</p>
    </div>
  );
}
