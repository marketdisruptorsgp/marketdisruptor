import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
// AnalysisVisualLayer removed — pitch renders slides directly
import { toast } from "sonner";
import type { Product } from "@/data/mockProducts";
import { downloadPitchDeckPDF } from "@/lib/pdfExport";
import { downloadSlidesPDF } from "@/lib/slidesPdfExport";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { ReferralCTA } from "@/components/ReferralCTA";
import { ExportPanel } from "@/components/export/ExportPanel";
import { PITCH_SLIDE_DESCRIPTIONS } from "@/lib/stepConfigs";
import { Slider } from "@/components/ui/slider";
import {
  Presentation, RefreshCw, DollarSign, TrendingUp,
  Globe, Target, Zap, CheckCircle2, ArrowRight, BarChart3,
  ShieldAlert, Lightbulb, Clock,
  AlertTriangle, Rocket, Sparkles,
  Layers, Shield, FileDown, ScrollText,
} from "lucide-react";
import { NextSectionButton, SectionWorkflowNav, AllExploredBadge } from "@/components/SectionNav";
import {
  ScaledSlide, PitchSlideFrame, PitchCoverSlide,
  SlideStatCard, SlideBullet, MarketSizeVisual, RiskSeverityBar,
  ScenarioBarChart, SlideQuoteBlock, SlideTimeline, MetricBar,
  FunnelVisual, DonutChart, KeyMetricPanel, EmphasisBox, SplitLayout,
  InsightCard, ComparisonLayout, TakeawayCallout, ThreeColumnGrid,
  EmptySlideSection,
} from "@/components/pitch/PitchSlideFrame";
import { PresentationMode } from "@/components/pitch/PresentationMode";
import { StepLoadingTracker, PITCH_DECK_TASKS } from "@/components/StepLoadingTracker";
import { CompletionExperience } from "@/components/CompletionExperience";
import { useNavigate } from "react-router-dom";

// ── Interfaces ────────────────────────────────────────────────
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
  tagline?: string;
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
  ipLandscape?: {
    summary?: string;
    keyPatents?: { title: string; holder: string; relevance: string; threat: string }[];
    whitespace?: string[];
    ipStrategy?: string;
    filingRecommendations?: string[];
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
  accentColor?: string;
  insightPreferences?: Record<string, "liked" | "dismissed" | "neutral">;
  steeringText?: string;
  runTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
}

// ── Slide structure ───────────────────────────────────────────
const SLIDE_TABS = [
  { id: "problem", label: "Problem", icon: AlertTriangle },
  { id: "solution", label: "Solution", icon: Lightbulb },
  { id: "whynow", label: "Why Now", icon: Clock },
  { id: "market", label: "Market", icon: Globe },
  { id: "product", label: "Product", icon: Layers },
  { id: "businessmodel", label: "Business Model", icon: DollarSign },
  { id: "traction", label: "Traction & Metrics", icon: TrendingUp },
  { id: "ip", label: "IP & Patents", icon: ScrollText },
  { id: "risks", label: "Risks", icon: ShieldAlert },
  { id: "gtm", label: "GTM & Positioning", icon: Target },
  { id: "invest", label: "The Ask", icon: Rocket },
] as const;

type SlideTab = typeof SLIDE_TABS[number]["id"];
const TOTAL = SLIDE_TABS.length;

const SLIDE_TITLES: Record<string, string> = {
  problem: "The Problem", solution: "The Solution", whynow: "Why Now",
  market: "Market Opportunity", product: "Product / Innovation",
  businessmodel: "Business Model", traction: "Traction & Metrics",
  ip: "IP & Patent Landscape",
  risks: "Risks & Mitigation", gtm: "Go-to-Market & Positioning", invest: "The Ask",
};

const SLIDE_CATEGORY_LABELS: Record<string, string> = {
  problem: "Problem Discovery", solution: "Strategic Thesis", whynow: "Market Timing",
  market: "Market Sizing", product: "Product Analysis", businessmodel: "Financial Model",
  traction: "Validation", ip: "Intellectual Property", risks: "Risk Assessment", gtm: "Growth Strategy", invest: "Capital Strategy",
};

// ── Component ─────────────────────────────────────────────────
export const PitchDeck = ({ product, analysisId, onSave, externalData, disruptData, stressTestData, redesignData, userScores, accentColor: modeAccent, insightPreferences, steeringText, runTrigger, onLoadingChange }: PitchDeckProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const analysisCtx = useAnalysis();
  const [data, setData] = useState<PitchDeckData | null>((externalData as PitchDeckData) || null);
  const [loading, setLoading] = useState(false);

  // Expose loading to parent
  React.useEffect(() => { onLoadingChange?.(loading); }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parent-triggered re-run via runTrigger counter
  const runTriggerRef = React.useRef(runTrigger ?? 0);
  React.useEffect(() => {
    if (runTrigger !== undefined && runTrigger > runTriggerRef.current && !loading) {
      runTriggerRef.current = runTrigger;
      runAnalysis();
    }
  }, [runTrigger]); // eslint-disable-line react-hooks/exhaustive-deps
  const [activeSlide, setActiveSlide] = useState<SlideTab | "cover">("cover");
  const [visitedSlides, setVisitedSlides] = useState<Set<string>>(new Set(["cover"]));
  const [userScore, setUserScore] = useState<number>(product.revivalScore || 7);
  const [showCompletion, setShowCompletion] = useState(false);
  const [presenting, setPresenting] = useState(false);

  const accentColor = modeAccent || "hsl(var(--primary))";

  const handleDownloadPDF = () => { if (!data) return; downloadPitchDeckPDF(product, data); };
  const [downloadingSlides, setDownloadingSlides] = useState(false);
  const slidesContainerRef = React.useRef<HTMLDivElement>(null);
  const handleDownloadSlidesPDF = async () => {
    if (!data) return;
    setDownloadingSlides(true);
    toast.loading("Rendering slides to PDF…", { id: "slides-pdf" });
    try {
      await downloadSlidesPDF(allRawSlides, product.name);
      toast.dismiss("slides-pdf");
      toast.success("Presentation PDF downloaded!");
    } catch (err) {
      toast.dismiss("slides-pdf");
      toast.error("Failed to export slides: " + String(err));
    } finally {
      setDownloadingSlides(false);
    }
  };

  // All slides: cover + SLIDE_TABS
  const ALL_SLIDES = ["cover" as const, ...SLIDE_TABS.map(t => t.id)];
  const allCurrentIdx = ALL_SLIDES.indexOf(activeSlide);
  const allTotal = ALL_SLIDES.length;

  const goNext = () => {
    if (allCurrentIdx >= allTotal - 1) { setShowCompletion(true); return; }
    const nextId = ALL_SLIDES[allCurrentIdx + 1];
    setActiveSlide(nextId as any);
    setVisitedSlides(prev => new Set([...prev, nextId]));
  };

  const goPrev = () => {
    if (allCurrentIdx > 0) {
      const prevId = ALL_SLIDES[allCurrentIdx - 1];
      setActiveSlide(prevId as any);
      setVisitedSlides(prev => new Set([...prev, prevId]));
    }
  };

  // Keyboard arrow navigation
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // Touch swipe navigation
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartRef.current = null;
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await invokeWithTimeout("generate-pitch-deck", {
        body: {
          product,
          disruptData: disruptData || undefined,
          stressTestData: stressTestData || undefined,
          redesignData: redesignData || undefined,
          userScores: userScores || undefined,
          insightPreferences: insightPreferences && Object.keys(insightPreferences).length > 0 ? insightPreferences : undefined,
          steeringText: steeringText || undefined,
          geoData: analysisCtx.geoData || undefined,
          regulatoryData: analysisCtx.regulatoryData || undefined,
          adaptiveContext: analysisCtx.adaptiveContext || undefined,
          patentData: product.patentData || undefined,
        },
      }, 180_000);
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
    return <StepLoadingTracker title="Building Pitch Deck" tasks={PITCH_DECK_TASKS} estimatedSeconds={35} accentColor={accentColor} />;
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
            Full investor-ready brief for <strong className="text-foreground">{product.name}</strong> — 10 structured sections.
          </p>
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-md font-bold text-sm transition-colors"
          style={{ background: accentColor, color: "white", opacity: loading ? 0.7 : 1 }}>
          <Presentation size={15} /> Generate Full Pitch Deck
        </button>
        <p className="typo-card-meta text-muted-foreground">Uses Gemini 2.5 Flash · ~20–40 seconds</p>
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
        accentColor={accentColor}
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
        sgpCapitalContext={{ product, profile, user, userScore, analysisId }}
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

  // ── Inline styles for 1920×1080 canvas ──────────────────────
  const panel: React.CSSProperties = { padding: 28, borderRadius: 10, background: "linear-gradient(135deg, #ffffff, #f8f9fc)", border: "1px solid #e8e8ec" };
  const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a1a1aa", marginBottom: 14 };
  const txt: React.CSSProperties = { fontSize: 21, color: "#0f0f12", opacity: 0.85, lineHeight: 1.55 };
  const heading: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: "#0f0f12", lineHeight: 1.3 };
  const gap28: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 24 };

  // ── Raw slide builder (1920×1080, no ScaledSlide wrapper) ───
  const rawSlide = (slideId: string, children: React.ReactNode) => (
    <PitchSlideFrame
      slideNumber={SLIDE_TABS.findIndex(t => t.id === slideId) + 2}
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

  // ── Slide Content (1920×1080 scale) ─────────────────────────
  const slideContent: Record<string, React.ReactNode> = {
    /* ═══ 1. PROBLEM ═══ */
    problem: (
      <div style={gap28}>
        <SlideQuoteBlock quote={data.problemStatement} accentColor={accentColor} label="Problem Statement" />
        {data.customerPersona && (
          <SplitLayout
            left={
              <div style={panel}>
                <p style={lbl}>Target Customer</p>
                <p style={heading}>{data.customerPersona.name}</p>
                <p style={{ fontSize: 18, color: "#71717a", marginTop: 6 }}>Age: {data.customerPersona.age}</p>
                <p style={{ ...txt, fontSize: 19, marginTop: 4 }}>{data.customerPersona.buyingBehavior}</p>
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #e8e8ec" }}>
                  <p style={{ ...lbl, marginBottom: 6 }}>Willingness to Pay</p>
                  <p style={{ fontSize: 20, color: "#0f0f12", opacity: 0.8 }}>{data.customerPersona.willingness}</p>
                </div>
              </div>
            }
            right={
              <div style={panel}>
                <p style={lbl}>Key Pain Points</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {data.customerPersona.painPoints.slice(0, 4).map((p, i) => (
                    <SlideBullet key={i} index={i} accentColor={accentColor}>{p}</SlideBullet>
                  ))}
                </div>
              </div>
            }
          />
        )}
        <TakeawayCallout text="This problem creates a structural gap — the market is underserved and ready for disruption." accentColor={accentColor} />
      </div>
    ),

    /* ═══ 2. SOLUTION ═══ */
    solution: (
      <div style={gap28}>
        <KeyMetricPanel label="Elevator Pitch" value="→" accentColor={accentColor} sublabel={data.elevatorPitch} />
        <InsightCard title="Solution Overview" body={data.solutionStatement} accentColor={accentColor} />
        {(data.competitiveAdvantages?.length || 0) > 0 ? (
          <ComparisonLayout
            leftTitle="Market Standard"
            leftItems={(data.competitiveAdvantages || []).slice(0, 3).map(a => `Lacks: ${a}`)}
            rightTitle="Our Differentiation"
            rightItems={(data.competitiveAdvantages || []).slice(0, 3)}
            accentColor={accentColor}
          />
        ) : <EmptySlideSection label="Competitive advantages" />}
      </div>
    ),

    /* ═══ 3. WHY NOW ═══ */
    whynow: (
      <div style={gap28}>
        <SlideQuoteBlock quote={data.whyNow} accentColor={accentColor} label="Market Timing Thesis" />
        <ThreeColumnGrid>
          {[
            { label: "Market Shift", desc: "Structural industry change creating new entry points" },
            { label: "Tech Enabler", desc: "New capabilities reducing cost and complexity barriers" },
            { label: "Demand Signal", desc: "Consumer behavior evolution favoring this approach" },
          ].map((item) => (
            <InsightCard key={item.label} title={item.label} body={item.desc} accentColor={accentColor} />
          ))}
        </ThreeColumnGrid>
        {data.marketOpportunity?.growthRate && (
          <KeyMetricPanel label="Market CAGR" value={data.marketOpportunity.growthRate} accentColor={accentColor} sublabel="Accelerating tailwinds create a narrow window for first-mover advantage" />
        )}
      </div>
    ),

    /* ═══ 4. MARKET ═══ */
    market: data.marketOpportunity ? (
      <div style={gap28}>
        <SplitLayout
          left={<MarketSizeVisual tam={data.marketOpportunity.tam} sam={data.marketOpportunity.sam} som={data.marketOpportunity.som} accentColor={accentColor} />}
          right={
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <SlideStatCard label="Total Addressable Market (TAM)" value={data.marketOpportunity.tam} accentColor={accentColor} />
              <SlideStatCard label="Serviceable Addressable Market (SAM)" value={data.marketOpportunity.sam} accentColor={accentColor} />
              <SlideStatCard label="Serviceable Obtainable Market (SOM)" value={data.marketOpportunity.som} accentColor={accentColor} sublabel="Initial target within 3 years" />
            </div>
          }
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <EmphasisBox accentColor={accentColor} label="Growth Rate">
            <p style={{ fontSize: 28, fontWeight: 700, color: "#0f0f12" }}>{data.marketOpportunity.growthRate}</p>
          </EmphasisBox>
          <div style={panel}>
            <p style={lbl}>Key Drivers</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.marketOpportunity.keyDrivers.slice(0, 3).map((d, i) => (
                <SlideBullet key={i}>{d}</SlideBullet>
              ))}
            </div>
          </div>
        </div>
      </div>
    ) : null,

    /* ═══ 5. PRODUCT ═══ */
    product: (() => {
      const concept = (redesignData as any)?.redesignedConcept;
      const selectedImages = analysisCtx.pitchDeckImages;
      return (
        <div style={gap28}>
          {/* User-selected pitch deck images */}
          {selectedImages.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: selectedImages.length > 1 ? "1fr 1fr" : "1fr", gap: 16 }}>
              {selectedImages.map((img, i) => (
                <div key={i} style={{ ...panel, padding: 0, overflow: "hidden" }}>
                  <img src={img.url} alt={img.ideaName} style={{ width: "100%", height: 240, objectFit: "contain", borderRadius: "10px 10px 0 0", background: "#f4f4f5" }} />
                  <div style={{ padding: "10px 14px" }}>
                    <p style={{ ...lbl, marginBottom: 4, fontSize: 11 }}>Selected Concept</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#0f0f12" }}>{img.ideaName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Product image + concept name (fallback if no selected images) */}
          {selectedImages.length === 0 && (product.image || concept?.conceptName) && (
            <SplitLayout
              left={
                product.image ? (
                  <div style={{ ...panel, padding: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220 }}>
                    <img src={product.image} alt={product.name} style={{ width: "100%", height: 220, objectFit: "contain", borderRadius: 10 }} />
                  </div>
                ) : null
              }
              right={
                concept ? (
                  <div style={panel}>
                    <p style={lbl}>Redesigned Concept</p>
                    <p style={heading}>{concept.conceptName}</p>
                    {concept.tagline && <p style={{ fontSize: 18, color: "#71717a", marginTop: 8, lineHeight: 1.5 }}>{concept.tagline}</p>}
                    {concept.coreInsight && <p style={{ ...txt, fontSize: 17, marginTop: 12 }}>{concept.coreInsight}</p>}
                  </div>
                ) : (
                  <div style={panel}>
                    <p style={lbl}>Product</p>
                    <p style={heading}>{product.name}</p>
                    {product.description && <p style={{ ...txt, fontSize: 17, marginTop: 8 }}>{product.description}</p>}
                  </div>
                )
              }
            />
          )}
          {data.productInnovation && <InsightCard title="Innovation Thesis" body={data.productInnovation} accentColor={accentColor} />}
          {(data.competitiveAdvantages?.length || 0) > 0 && (data.investorHighlights?.length || 0) > 0 ? (
            <ComparisonLayout
              leftTitle="Competitive Advantages"
              leftItems={(data.competitiveAdvantages || []).slice(0, 4)}
              rightTitle="Investor Highlights"
              rightItems={(data.investorHighlights || []).slice(0, 4)}
              accentColor={accentColor}
            />
          ) : (
            <EmptySlideSection label="Competitive analysis" />
          )}
          <TakeawayCallout text="Structurally differentiated — not just better features, but a fundamentally different approach." accentColor={accentColor} />
        </div>
      );
    })(),

    /* ═══ 6. BUSINESS MODEL ═══ */
    businessmodel: (
      <div style={gap28}>
        {data.businessModel?.revenueStreams && (
          <div>
            <p style={lbl}>Revenue Streams</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {data.businessModel.revenueStreams.map((s, i) => (
                <span key={i} style={{ padding: "8px 18px", borderRadius: 8, fontSize: 18, fontWeight: 600, background: "#fafafa", color: "#0f0f12", border: "1px solid #e8e8ec", borderLeft: `4px solid ${accentColor}` }}>{s}</span>
              ))}
            </div>
          </div>
        )}
        {fm && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
              {[
                { label: "COGS", value: fm.unitEconomics.cogs, sub: "Cost of goods sold" },
                { label: "Price", value: fm.unitEconomics.retailPrice, sub: "Retail price point" },
                { label: "Gross Margin", value: fm.unitEconomics.grossMargin, sub: "Revenue minus COGS" },
                { label: "Payback", value: fm.unitEconomics.paybackPeriod, sub: "Time to recoup CAC" },
              ].map((item) => (
                <SlideStatCard key={item.label} label={item.label} value={item.value} accentColor={accentColor} sublabel={item.sub} />
              ))}
            </div>
            {fm.unitEconomics.ltv && fm.unitEconomics.cac && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <SlideStatCard label="Lifetime Value (LTV)" value={fm.unitEconomics.ltv} accentColor="#22c55e" sublabel="Total customer revenue" />
                <SlideStatCard label="Customer Acquisition Cost" value={fm.unitEconomics.cac} accentColor="#f59e0b" sublabel="Cost to acquire one customer" />
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {fm.pricingStrategy && (
                <EmphasisBox accentColor={accentColor} label="Pricing Strategy">
                  <p style={txt}>{fm.pricingStrategy}</p>
                </EmphasisBox>
              )}
              {fm.breakEvenAnalysis && (
                <EmphasisBox accentColor={accentColor} label="Break-Even Analysis">
                  <p style={txt}>{fm.breakEvenAnalysis}</p>
                </EmphasisBox>
              )}
            </div>
          </>
        )}
      </div>
    ),

    /* ═══ 7. TRACTION & METRICS ═══ */
    traction: (
      <div style={gap28}>
        <SplitLayout
          left={
            data.tractionSignals?.length ? (
              <div style={panel}>
                <p style={{ ...lbl, color: "#22c55e" }}>Traction Signals</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {data.tractionSignals.slice(0, 4).map((s, i) => (
                    <SlideBullet key={i} index={i} accentColor="#22c55e">{s}</SlideBullet>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ ...panel, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                <p style={{ fontSize: 18, color: "#a1a1aa" }}>Pre-launch — traction targets defined</p>
              </div>
            )
          }
          right={
            data.keyMetrics?.length > 0 ? (
              <div style={panel}>
                <p style={lbl}>Key Performance Indicators</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {data.keyMetrics.slice(0, 5).map((m, i) => (
                    <MetricBar key={i} metric={m.metric} target={m.target} why={m.why} accentColor={accentColor} />
                  ))}
                </div>
              </div>
            ) : null
          }
        />
        <EmphasisBox accentColor={accentColor} label="Revival Potential Score">
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#71717a", marginBottom: 4 }}>AI Score</p>
              <p style={{ fontSize: 44, fontWeight: 800, color: accentColor, fontFamily: "'Space Grotesk', sans-serif" }}>{product.revivalScore || "—"}</p>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 16, color: "#71717a" }}>Your Rating</p>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#0f0f12" }}>{userScore}/10</span>
              </div>
              <Slider value={[userScore]} onValueChange={(v) => setUserScore(v[0])} min={1} max={10} step={1} />
            </div>
          </div>
        </EmphasisBox>
      </div>
    ),

    /* ═══ 8. IP & PATENTS ═══ */
    ip: (() => {
      const ip = data.ipLandscape;
      const patentData = product.patentData as any;
      const hasIp = ip?.summary || ip?.keyPatents?.length || patentData;
      if (!hasIp) return (
        <EmptySlideSection label="No patent data available for this analysis. Run the Intelligence Report with patent analysis enabled." />
      );
      return (
        <div style={gap28}>
          {ip?.summary && (
            <TakeawayCallout text={ip.summary} accentColor={accentColor} label="IP Landscape Overview" />
          )}
          {(ip?.keyPatents || []).length > 0 && (
            <div style={panel}>
              <p style={lbl}>Key Patents & Prior Art</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ip!.keyPatents!.slice(0, 5).map((p, i) => (
                  <div key={i} style={{ borderRadius: 10, padding: "14px 20px", border: "1px solid #e8e8ec", background: "#fafafa" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <p style={{ fontSize: 18, fontWeight: 700, color: "#0f0f12" }}>{p.title}</p>
                      <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: p.threat === "high" ? "#fee2e2" : p.threat === "medium" ? "#fef3c7" : "#dcfce7", color: p.threat === "high" ? "#dc2626" : p.threat === "medium" ? "#d97706" : "#16a34a" }}>
                        {(p.threat || "low").toUpperCase()} THREAT
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Held by <strong>{p.holder}</strong></p>
                    <p style={{ ...txt, fontSize: 16, marginTop: 6 }}>{p.relevance}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <SplitLayout
            left={
              (ip?.whitespace || []).length > 0 ? (
                <div style={panel}>
                  <p style={lbl}>IP Whitespace Opportunities</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {ip!.whitespace!.map((w, i) => (
                      <SlideBullet key={i} index={i} accentColor="#22c55e">{w}</SlideBullet>
                    ))}
                  </div>
                </div>
              ) : <div />
            }
            right={
              ip?.ipStrategy ? (
                <EmphasisBox accentColor={accentColor} label="Recommended IP Strategy">
                  <p style={txt}>{ip.ipStrategy}</p>
                  {(ip.filingRecommendations || []).length > 0 && (
                    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                      <p style={{ ...lbl, fontSize: 11 }}>Filing Recommendations</p>
                      {ip.filingRecommendations!.map((r, i) => (
                        <SlideBullet key={i} index={i} accentColor={accentColor}>{r}</SlideBullet>
                      ))}
                    </div>
                  )}
                </EmphasisBox>
              ) : <div />
            }
          />
          {patentData && !ip?.keyPatents?.length && (
            <InsightCard title="Patent Intelligence (from Report)" body={typeof patentData === "string" ? patentData : JSON.stringify(patentData).slice(0, 500)} accentColor={accentColor} />
          )}
        </div>
      );
    })(),

    /* ═══ 9. RISKS ═══ */
    risks: (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {(data.risks || []).slice(0, 4).map((r, i) => (
          <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e8e8ec" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 24px", background: "#fafafa" }}>
              <p style={{ fontSize: 21, fontWeight: 700, color: "#0f0f12", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#ffffff", background: r.severity === "high" ? "#ef4444" : r.severity === "medium" ? "#f59e0b" : "#22c55e" }}>{i + 1}</span>
                {r.risk}
              </p>
              <RiskSeverityBar severity={r.severity} />
            </div>
            <div style={{ padding: "14px 24px", borderLeft: `4px solid transparent`, backgroundImage: `linear-gradient(#fff, #fff), linear-gradient(180deg, ${r.severity === "high" ? "#ef4444" : r.severity === "medium" ? "#f59e0b" : "#22c55e"}, ${r.severity === "high" ? "#ef444444" : r.severity === "medium" ? "#f59e0b44" : "#22c55e44"})`, backgroundOrigin: "padding-box, border-box", backgroundClip: "padding-box, border-box", borderLeftWidth: 4, borderLeftStyle: "solid" }}>
              <p style={{ ...lbl, fontSize: 11, marginBottom: 4 }}>Mitigation Strategy</p>
              <p style={{ ...txt, fontSize: 19 }}>{r.mitigation}</p>
            </div>
          </div>
        ))}
      </div>
    ),

    /* ═══ 9. GTM ═══ */
    gtm: data.gtmStrategy ? (
      <div style={gap28}>
        <SplitLayout
          ratio="3:2"
          left={
            <SlideTimeline
              steps={[
                { label: "Phase 1: Launch", content: data.gtmStrategy.phase1 },
                { label: "Phase 2: Scale", content: data.gtmStrategy.phase2 },
                { label: "Phase 3: Dominate", content: data.gtmStrategy.phase3 },
              ]}
              accentColor={accentColor}
            />
          }
          right={
            <FunnelVisual
              stages={[{ label: "Awareness" }, { label: "Consideration" }, { label: "Conversion" }, { label: "Retention" }]}
              accentColor={accentColor}
            />
          }
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={panel}>
            <p style={lbl}>Distribution Channels</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {data.gtmStrategy.keyChannels.map((ch, i) => (
                <span key={i} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 16, fontWeight: 600, background: "#ffffff", color: "#0f0f12", border: "1px solid #e8e8ec", borderLeft: `3px solid ${accentColor}` }}>{ch}</span>
              ))}
            </div>
          </div>
          <SlideStatCard label="Launch Budget" value={data.gtmStrategy.launchBudget} accentColor={accentColor} sublabel="Initial go-to-market investment" />
        </div>
        {data.competitiveLandscape?.moat && (
          <TakeawayCallout text={data.competitiveLandscape.moat} accentColor={accentColor} label="Defensible Moat" />
        )}
      </div>
    ) : null,

    /* ═══ 10. THE ASK ═══ */
    invest: (
      <div style={gap28}>
        <KeyMetricPanel label="Total Funding Ask" value={fm?.fundingAsk || data.investmentAsk?.amount || "TBD"} accentColor={accentColor} />
        <SplitLayout
          left={
            fm?.scenarios ? (
              <ScenarioBarChart
                scenarios={[
                  { label: "Conservative", value: fm.scenarios.conservative?.revenue || "—" },
                  { label: "Base Case", value: fm.scenarios.base?.revenue || "—" },
                  { label: "Optimistic", value: fm.scenarios.optimistic?.revenue || "—" },
                ]}
                accentColor={accentColor}
              />
            ) : <div />
          }
          right={
            (fm?.useOfFunds || data.investmentAsk?.useOfFunds)?.length ? (
              <DonutChart
                label="Use of Funds"
                segments={(() => {
                  const funds = (fm?.useOfFunds || data.investmentAsk?.useOfFunds || []).slice(0, 5);
                  const pct = Math.floor(100 / Math.max(funds.length, 1));
                  const remainder = 100 - (pct * funds.length);
                  return funds.map((f, i) => ({ label: f.length > 25 ? f.slice(0, 25) + "..." : f, pct: i === 0 ? pct + remainder : pct }));
                })()}
                accentColor={accentColor}
                size={200}
              />
            ) : <div />
          }
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={panel}>
            <p style={lbl}>Use of Funds</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(fm?.useOfFunds || data.investmentAsk?.useOfFunds || []).slice(0, 5).map((u, i) => (
                <SlideBullet key={i} index={i} accentColor={accentColor}>{u}</SlideBullet>
              ))}
            </div>
          </div>
          <EmphasisBox accentColor={accentColor} label="Exit Strategy">
            <p style={txt}>{fm?.exitStrategy || data.investmentAsk?.exitStrategy || "TBD"}</p>
          </EmphasisBox>
        </div>
      </div>
    ),
  };

  // ── Build slides ────────────────────────────────────────────
  // Filter out broken/empty image URLs (base64 that was stripped)
  const validCoverImages = analysisCtx.pitchDeckImages.filter(img => img.url && img.url.length > 10 && !img.url.startsWith("data:image/") === false || img.url.startsWith("http"));

  const rawCover = (
    <PitchCoverSlide
      productName={product.name}
      subtitle={data.tagline || data.elevatorPitch?.split(".")?.[0]}
      accentColor={accentColor}
      totalSlides={TOTAL + 1}
      coverImages={validCoverImages.length > 0 ? validCoverImages : undefined}
      userName={/audi|mechanic|auto\s?repair|car\s?repair/i.test(`${product.name} ${product.category || ""} ${product.description || ""}`) ? "Eric Lieb" : (profile?.first_name || "Analyst")}
    />
  );
  const allRawSlides = [rawCover, ...SLIDE_TABS.map(tab => rawSlide(tab.id, slideContent[tab.id]))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {presenting && <PresentationMode slides={allRawSlides} onExit={() => setPresenting(false)} />}

      {/* Hero CTA Banner */}
      <div
        className="relative overflow-visible rounded-xl p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}06)`,
          border: `1.5px solid ${accentColor}30`,
        }}
      >
        <div className="absolute inset-0 rounded-xl overflow-hidden opacity-5 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 20% 50%, ${accentColor} 1px, transparent 1px), radial-gradient(circle at 80% 20%, ${accentColor} 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}18` }}>
            <Sparkles size={28} style={{ color: accentColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>You might be on to something</p>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-1 text-foreground">
              Well done — that's super creative.
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your investor-ready pitch deck for <strong className="text-foreground">{product.name}</strong> is ready — {TOTAL} structured slides, presentation-grade.
            </p>
          </div>
          <div className="cta-container flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setPresenting(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: accentColor, color: "white", boxShadow: `0 4px 14px ${accentColor}33` }}
            >
              <Presentation size={18} /> Present Full Deck
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadSlidesPDF}
                disabled={downloadingSlides}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
                style={{ background: "white", color: accentColor, boxShadow: `0 2px 8px ${accentColor}22` }}
              >
                <FileDown size={14} /> {downloadingSlides ? "Exporting…" : "Download Slides PDF"}
              </button>
              <ExportPanel product={product} pitchDeckData={data} analysisData={{ disrupt: analysisCtx.disruptData, stressTest: analysisCtx.stressTestData, pitchDeck: data, redesign: analysisCtx.redesignData, geoOpportunity: analysisCtx.geoData, regulatoryContext: analysisCtx.regulatoryData, ...(product.patentData ? { patentData: product.patentData } : {}), ...(analysisCtx.businessAnalysisData ? (analysisCtx.businessAnalysisData as unknown as Record<string, unknown>) : {}), ...(analysisCtx.businessStressTestData ? { stressTest: analysisCtx.businessStressTestData } : {}) } as Record<string, unknown>} analysisId={analysisId} userId={user?.id} accentColor="white" />
              <button onClick={runAnalysis} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
                {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />} Regenerate
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

       {/* Active slide with ScaledSlide wrapper + transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <ScaledSlide>{activeSlide === "cover" ? rawCover : rawSlide(activeSlide, slideContent[activeSlide as SlideTab])}</ScaledSlide>
        </motion.div>
      </AnimatePresence>

      {/* Slide counter + prev/next */}
      <div className="flex items-center justify-between gap-3 px-1">
        <button
          onClick={goPrev}
          disabled={allCurrentIdx <= 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted border border-border text-foreground"
        >
          <ArrowRight size={14} className="rotate-180" /> Prev
        </button>
        <span className="text-xs font-bold text-muted-foreground tabular-nums">
          {allCurrentIdx + 1} / {allTotal}
        </span>
        {allCurrentIdx < allTotal - 1 ? (
          <button
            onClick={goNext}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 text-white"
            style={{ background: accentColor }}
          >
            Next <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={goNext}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 text-white animate-pulse"
            style={{ background: accentColor }}
          >
            <Sparkles size={14} /> Complete
          </button>
        )}
      </div>
      </div>

      <div className="mt-6"><ReferralCTA compact /></div>
    </div>
  );
};
