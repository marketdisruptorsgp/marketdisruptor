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
  Presentation, RefreshCw, DollarSign, TrendingUp,
  Globe, Target, Zap, CheckCircle2, ArrowRight, BarChart3,
  ShieldAlert, Lightbulb, Clock,
  AlertTriangle, Rocket, Sparkles,
  Layers, Shield,
} from "lucide-react";
import { NextSectionButton, SectionWorkflowNav, AllExploredBadge } from "@/components/SectionNav";
import { PitchSlideFrame, PitchCoverSlide, SlideStatCard, SlideBullet, MarketSizeVisual, RiskSeverityBar, ScenarioBarChart, SlideQuoteBlock, SlideTimeline, MetricBar } from "@/components/pitch/PitchSlideFrame";
import { PresentationMode } from "@/components/pitch/PresentationMode";
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

/* ── 10-slide structure ── */
const SLIDE_TABS = [
  { id: "problem", label: "Problem", icon: AlertTriangle },
  { id: "solution", label: "Solution", icon: Lightbulb },
  { id: "whynow", label: "Why Now", icon: Clock },
  { id: "market", label: "Market", icon: Globe },
  { id: "product", label: "Product", icon: Layers },
  { id: "businessmodel", label: "Business Model", icon: DollarSign },
  { id: "traction", label: "Traction & Metrics", icon: TrendingUp },
  { id: "risks", label: "Risks", icon: ShieldAlert },
  { id: "gtm", label: "GTM & Positioning", icon: Target },
  { id: "invest", label: "The Ask", icon: Rocket },
] as const;

type SlideTab = typeof SLIDE_TABS[number]["id"];

const TOTAL = SLIDE_TABS.length;

const SLIDE_TITLES: Record<string, string> = {
  problem: "The Problem",
  solution: "The Solution",
  whynow: "Why Now",
  market: "Market Opportunity",
  product: "Product / Innovation",
  businessmodel: "Business Model",
  traction: "Traction & Metrics",
  risks: "Risks & Mitigation",
  gtm: "Go-to-Market & Positioning",
  invest: "The Ask",
};

const SLIDE_CATEGORY_LABELS: Record<string, string> = {
  problem: "Problem Discovery",
  solution: "Strategic Thesis",
  whynow: "Market Timing",
  market: "Market Sizing",
  product: "Product Analysis",
  businessmodel: "Financial Model",
  traction: "Validation",
  risks: "Risk Assessment",
  gtm: "Growth Strategy",
  invest: "Capital Strategy",
};

export const PitchDeck = ({ product, analysisId, onSave, externalData, disruptData, stressTestData, redesignData, userScores }: PitchDeckProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<PitchDeckData | null>((externalData as PitchDeckData) || null);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState<SlideTab>("problem");
  const [visitedSlides, setVisitedSlides] = useState<Set<string>>(new Set(["problem"]));
  const [userScore, setUserScore] = useState<number>(product.revivalScore || 7);
  const [showCompletion, setShowCompletion] = useState(false);
  const [presenting, setPresenting] = useState(false);

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
        <div className="w-20 h-20 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
          <Presentation size={36} style={{ color: "hsl(var(--foreground))" }} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Investor Pitch Deck</h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Full investor-ready brief for <strong className="text-foreground">{product.name}</strong> — 10 structured sections covering problem, market, financials, and GTM.
          </p>
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-md font-bold text-sm transition-colors"
          style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))", opacity: loading ? 0.7 : 1 }}>
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
        sgpCapitalContext={{
          product,
          profile,
          user,
          userScore,
          analysisId,
        }}
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

  /* ── Render a slide frame with content ── */
  const accentColor = "hsl(var(--primary))";
  const makeSlide = (slideId: string, children: React.ReactNode) => {
    const idx = SLIDE_TABS.findIndex(t => t.id === slideId);
    return (
      <PitchSlideFrame
        slideNumber={idx + 2} // +1 for cover slide
        totalSlides={TOTAL + 1}
        title={SLIDE_TITLES[slideId] || slideId}
        subtitle={PITCH_SLIDE_DESCRIPTIONS[slideId]}
        productName={product.name}
        accentColor={accentColor}
        categoryLabel={SLIDE_CATEGORY_LABELS[slideId]}
      >
        {children}
      </PitchSlideFrame>
    );
  };

  /* ── Slide content renderers ── */
  const slideContent: Record<string, React.ReactNode> = {
    /* ═══ 1. PROBLEM ═══ */
    problem: (
      <div className="space-y-5 h-full flex flex-col justify-center">
        <SlideQuoteBlock quote={data.problemStatement} accentColor={accentColor} label="Problem Statement" />
        {data.customerPersona && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Target Customer</p>
              <p className="text-sm font-bold text-foreground">{data.customerPersona.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Age: {data.customerPersona.age} · {data.customerPersona.buyingBehavior}</p>
              <p className="text-[10px] text-muted-foreground mt-1.5">Willingness: {data.customerPersona.willingness}</p>
            </div>
            <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Key Pain Points</p>
              <div className="space-y-1.5">
                {data.customerPersona.painPoints.slice(0, 4).map((p, i) => (
                  <SlideBullet key={i} index={i} accentColor={accentColor}>{p}</SlideBullet>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    ),

    /* ═══ 2. SOLUTION ═══ */
    solution: (
      <div className="space-y-5 h-full flex flex-col justify-center">
        <SlideQuoteBlock quote={data.elevatorPitch} accentColor={accentColor} label="Elevator Pitch" />
        <div className="p-5 sm:p-6 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Solution Overview</p>
          <p className="text-sm sm:text-base leading-relaxed text-foreground/85">{data.solutionStatement}</p>
        </div>
        {data.competitiveAdvantages?.length > 0 && (
          <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Key Differentiators</p>
            <div className="space-y-1.5">
              {data.competitiveAdvantages.slice(0, 3).map((a, i) => (
                <SlideBullet key={i} index={i} accentColor={accentColor}>{a}</SlideBullet>
              ))}
            </div>
          </div>
        )}
      </div>
    ),

    /* ═══ 3. WHY NOW ═══ */
    whynow: (
      <div className="space-y-5 h-full flex flex-col justify-center">
        <SlideQuoteBlock quote={data.whyNow} accentColor={accentColor} label="Market Timing & Tailwinds" />
        {/* Visual tailwind indicators */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Market Shift", icon: "↗", desc: "Structural change underway" },
            { label: "Tech Enabler", icon: "⚡", desc: "New capabilities available" },
            { label: "Demand Signal", icon: "📈", desc: "Consumer behavior evolving" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-md text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <span className="text-xl block mb-1">{item.icon}</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground mb-0.5">{item.label}</p>
              <p className="text-[9px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
        {data.marketOpportunity?.growthRate && (
          <div className="flex items-center gap-4 p-3 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", borderLeft: `3px solid ${accentColor}` }}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Market Growth</p>
              <p className="text-lg font-extrabold text-foreground">{data.marketOpportunity.growthRate}</p>
            </div>
            <div className="h-8 w-px" style={{ background: "hsl(var(--border))" }} />
            <p className="text-[11px] text-muted-foreground flex-1">Accelerating tailwinds create a narrow window for first-mover advantage</p>
          </div>
        )}
      </div>
    ),

    /* ═══ 4. MARKET ═══ */
    market: data.marketOpportunity ? (
      <div className="space-y-4 h-full flex flex-col justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] gap-4 items-start">
          {/* Concentric circles visual */}
          <MarketSizeVisual
            tam={data.marketOpportunity.tam}
            sam={data.marketOpportunity.sam}
            som={data.marketOpportunity.som}
            accentColor={accentColor}
          />
          {/* Stats stacked vertically */}
          <div className="space-y-2">
            <SlideStatCard label="TAM" value={data.marketOpportunity.tam} accentColor={accentColor} />
            <SlideStatCard label="SAM" value={data.marketOpportunity.sam} accentColor={accentColor} />
            <SlideStatCard label="SOM" value={data.marketOpportunity.som} accentColor={accentColor} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", borderLeft: `3px solid ${accentColor}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Growth Rate</p>
            <p className="text-lg font-extrabold text-foreground">{data.marketOpportunity.growthRate}</p>
          </div>
          <div className="p-3 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Key Drivers</p>
            <div className="space-y-1">
              {data.marketOpportunity.keyDrivers.slice(0, 3).map((d, i) => (
                <SlideBullet key={i}>{d}</SlideBullet>
              ))}
            </div>
          </div>
        </div>
      </div>
    ) : null,

    /* ═══ 5. PRODUCT ═══ */
    product: (
      <div className="space-y-5 h-full flex flex-col justify-center">
        {data.productInnovation && (
          <SlideQuoteBlock quote={data.productInnovation} accentColor={accentColor} label="What Makes It Different" />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Competitive Advantages</p>
            <div className="space-y-2">
              {data.competitiveAdvantages.slice(0, 4).map((adv, i) => (
                <SlideBullet key={i} index={i} accentColor={accentColor}>{adv}</SlideBullet>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Investor Highlights</p>
            <div className="space-y-2">
              {data.investorHighlights.slice(0, 4).map((h, i) => (
                <SlideBullet key={i} index={i} accentColor="hsl(142 71% 45%)">{h}</SlideBullet>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),

    /* ═══ 6. BUSINESS MODEL ═══ */
    businessmodel: (
      <div className="space-y-5 h-full flex flex-col justify-center">
        {data.businessModel?.revenueStreams && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue Streams</p>
            <div className="flex flex-wrap gap-2">
              {data.businessModel.revenueStreams.map((s, i) => (
                <span key={i} className="px-3 py-1.5 rounded-md text-xs font-semibold"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", borderLeft: `3px solid ${accentColor}` }}>
                  {s}
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
                { label: "Gross Margin", value: fm.unitEconomics.grossMargin },
                { label: "Payback", value: fm.unitEconomics.paybackPeriod },
              ].map((item) => (
                <SlideStatCard key={item.label} label={item.label} value={item.value} accentColor={accentColor} />
              ))}
            </div>
            {fm.unitEconomics.ltv && fm.unitEconomics.cac && (
              <div className="grid grid-cols-2 gap-3">
                <SlideStatCard label="LTV" value={fm.unitEconomics.ltv} accentColor="hsl(142 71% 45%)" />
                <SlideStatCard label="CAC" value={fm.unitEconomics.cac} accentColor="hsl(38 92% 50%)" />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fm.pricingStrategy && (
                <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Pricing Strategy</p>
                  <p className="text-[13px] text-foreground/85 leading-relaxed">{fm.pricingStrategy}</p>
                </div>
              )}
              {fm.breakEvenAnalysis && (
                <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Break-Even</p>
                  <p className="text-[13px] text-foreground/85 leading-relaxed">{fm.breakEvenAnalysis}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    ),

    /* ═══ 7. TRACTION & METRICS ═══ */
    traction: (
      <div className="space-y-4 h-full flex flex-col justify-center">
        {/* Traction signals */}
        {data.tractionSignals?.length ? (
          <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Traction Signals</p>
            <div className="space-y-2">
              {data.tractionSignals.slice(0, 4).map((s, i) => (
                <SlideBullet key={i} index={i} accentColor="hsl(142 71% 45%)">{s}</SlideBullet>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-sm text-muted-foreground text-center">Pre-launch — traction targets defined below</p>
          </div>
        )}
        {/* Key metrics as visual bars */}
        {data.keyMetrics?.length > 0 && (
          <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Key Metrics & Targets</p>
            <div className="space-y-3">
              {data.keyMetrics.slice(0, 5).map((m, i) => (
                <MetricBar key={i} metric={m.metric} target={m.target} accentColor={accentColor} />
              ))}
            </div>
          </div>
        )}
        {/* Score */}
        <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", borderLeft: `3px solid ${accentColor}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Revival Potential Score</p>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground mb-1">AI Score</p>
              <p className="text-2xl font-extrabold text-foreground">{product.revivalScore || "—"}</p>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">Your Rating</p>
                <span className="text-sm font-extrabold text-foreground">{userScore}/10</span>
              </div>
              <Slider value={[userScore]} onValueChange={(v) => setUserScore(v[0])} min={1} max={10} step={1} />
            </div>
          </div>
        </div>
      </div>
    ),

    /* ═══ 8. RISKS ═══ */
    risks: (
      <div className="space-y-3 h-full flex flex-col justify-center">
        {data.risks.map((r, i) => (
          <div key={i} className="rounded-md overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: "hsl(var(--muted))" }}>
              <p className="text-[13px] font-bold text-foreground flex items-center gap-2">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
                  style={{
                    background: r.severity === "high" ? "hsl(0 72% 51%)" : r.severity === "medium" ? "hsl(38 92% 50%)" : "hsl(142 71% 45%)",
                    color: "white",
                  }}
                >
                  {i + 1}
                </span>
                {r.risk}
              </p>
              <RiskSeverityBar severity={r.severity} />
            </div>
            <div className="px-4 py-3" style={{ borderLeft: `3px solid ${r.severity === "high" ? "hsl(0 72% 51%)" : r.severity === "medium" ? "hsl(38 92% 50%)" : "hsl(142 71% 45%)"}` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Mitigation</p>
              <p className="text-[13px] text-foreground/85 leading-relaxed">{r.mitigation}</p>
            </div>
          </div>
        ))}
      </div>
    ),

    /* ═══ 9. GTM & POSITIONING ═══ */
    gtm: data.gtmStrategy ? (
      <div className="space-y-4 h-full flex flex-col justify-center">
        {/* Timeline-style GTM phases */}
        <SlideTimeline
          steps={[
            { label: "Phase 1: Launch", content: data.gtmStrategy.phase1 },
            { label: "Phase 2: Scale", content: data.gtmStrategy.phase2 },
            { label: "Phase 3: Dominate", content: data.gtmStrategy.phase3 },
          ]}
          accentColor={accentColor}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Key Channels</p>
            <div className="flex flex-wrap gap-1.5">
              {data.gtmStrategy.keyChannels.map((ch, i) => (
                <span key={i} className="px-2.5 py-1 rounded-md text-xs font-semibold"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", borderLeft: `2px solid ${accentColor}` }}>{ch}</span>
              ))}
            </div>
          </div>
          <SlideStatCard label="Launch Budget" value={data.gtmStrategy.launchBudget} accentColor={accentColor} />
        </div>
        {/* Competitive positioning */}
        {data.competitiveLandscape?.moat && (
          <SlideQuoteBlock quote={data.competitiveLandscape.moat} accentColor={accentColor} label="Defensible Moat" />
        )}
      </div>
    ) : null,

    /* ═══ 10. THE ASK ═══ */
    invest: (
      <div className="space-y-5 h-full flex flex-col justify-center">
        <div className="p-5 rounded-md text-center relative overflow-hidden" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", borderLeft: `4px solid ${accentColor}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Funding Ask</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{fm?.fundingAsk || data.investmentAsk?.amount || "TBD"}</p>
        </div>
        {fm?.scenarios && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue Scenarios</p>
            <ScenarioBarChart
              scenarios={[
                { label: "Conservative", value: fm.scenarios.conservative?.revenue || "—" },
                { label: "Base Case", value: fm.scenarios.base?.revenue || "—" },
                { label: "Optimistic", value: fm.scenarios.optimistic?.revenue || "—" },
              ]}
              accentColor={accentColor}
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Use of Funds</p>
            <div className="space-y-1.5">
              {(fm?.useOfFunds || data.investmentAsk?.useOfFunds || []).slice(0, 5).map((u, i) => (
                <SlideBullet key={i} index={i} accentColor={accentColor}>{u}</SlideBullet>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-md" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Exit Strategy</p>
            <p className="text-[13px] text-foreground/85 leading-relaxed">{fm?.exitStrategy || data.investmentAsk?.exitStrategy || "TBD"}</p>
          </div>
        </div>
      </div>
    ),
  };

  /* ── Build all slides for presentation mode ── */
  const coverSlide = (
    <PitchCoverSlide
      productName={product.name}
      subtitle={data.elevatorPitch?.split(".")?.[0]}
      accentColor={accentColor}
      totalSlides={TOTAL + 1}
    />
  );
  const allSlides = [coverSlide, ...SLIDE_TABS.map(tab => makeSlide(tab.id, slideContent[tab.id]))];

  return (
    <div className="space-y-4">
      {/* Presentation mode overlay */}
      {presenting && (
        <PresentationMode
          slides={allSlides}
          onExit={() => setPresenting(false)}
        />
      )}

      {/* Header toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-foreground text-sm">Pitch Deck: {product.name}</h3>
          <p className="text-[10px] text-muted-foreground">{TOTAL} slides · Click any to jump</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPresenting(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
            style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>
            <Presentation size={12} /> Present
          </button>
          <ExportPanel
            product={product}
            pitchDeckData={data}
            analysisId={analysisId}
            userId={user?.id}
            accentColor="hsl(var(--primary))"
          />
          <button onClick={runAnalysis} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
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

      {/* Active slide */}
      {makeSlide(activeSlide, slideContent[activeSlide])}

      {/* Navigation below the slide */}
      {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
      {!nextSlide && activeSlide === "invest" && (
        <>
          <AllExploredBadge />
          <button
            onClick={goNext}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold py-4 rounded-md text-white transition-all hover:opacity-90 animate-pulse"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Sparkles size={16} /> Complete Analysis
          </button>
        </>
      )}

      {/* Referral CTA */}
      <div className="mt-6">
        <ReferralCTA compact />
      </div>
    </div>
  );
};
