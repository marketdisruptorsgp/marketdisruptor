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
import {
  ScaledSlide, PitchSlideFrame, PitchCoverSlide,
  SlideStatCard, SlideBullet, MarketSizeVisual, RiskSeverityBar,
  ScenarioBarChart, SlideQuoteBlock, SlideTimeline, MetricBar,
  FunnelVisual, DonutChart, KeyMetricPanel, EmphasisBox, SplitLayout,
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
  risks: "Risks & Mitigation", gtm: "Go-to-Market & Positioning", invest: "The Ask",
};

const SLIDE_CATEGORY_LABELS: Record<string, string> = {
  problem: "Problem Discovery", solution: "Strategic Thesis", whynow: "Market Timing",
  market: "Market Sizing", product: "Product Analysis", businessmodel: "Financial Model",
  traction: "Validation", risks: "Risk Assessment", gtm: "Growth Strategy", invest: "Capital Strategy",
};

// ── Component ─────────────────────────────────────────────────
export const PitchDeck = ({ product, analysisId, onSave, externalData, disruptData, stressTestData, redesignData, userScores, accentColor: modeAccent }: PitchDeckProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<PitchDeckData | null>((externalData as PitchDeckData) || null);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState<SlideTab>("problem");
  const [visitedSlides, setVisitedSlides] = useState<Set<string>>(new Set(["problem"]));
  const [userScore, setUserScore] = useState<number>(product.revivalScore || 7);
  const [showCompletion, setShowCompletion] = useState(false);
  const [presenting, setPresenting] = useState(false);

  const accentColor = modeAccent || "hsl(var(--primary))";

  const handleDownloadPDF = () => { if (!data) return; downloadPitchDeckPDF(product, data); };

  const currentIdx = SLIDE_TABS.findIndex(t => t.id === activeSlide);
  const nextSlide = currentIdx < TOTAL - 1 ? SLIDE_TABS[currentIdx + 1] : null;

  const goNext = () => {
    if (!nextSlide) { setShowCompletion(true); return; }
    setActiveSlide(nextSlide.id);
    setVisitedSlides(prev => new Set([...prev, nextSlide.id]));
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-pitch-deck", {
        body: { product, disruptData: disruptData || undefined, stressTestData: stressTestData || undefined, redesignData: redesignData || undefined, userScores: userScores || undefined },
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
        <p className="text-xs text-muted-foreground">Uses Gemini 2.5 Flash · ~20–40 seconds</p>
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
  const panel: React.CSSProperties = { padding: 32, borderRadius: 12, background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" };
  const lbl: React.CSSProperties = { fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))", marginBottom: 14 };
  const txt: React.CSSProperties = { fontSize: 24, color: "hsl(var(--foreground))", opacity: 0.85, lineHeight: 1.55 };
  const heading: React.CSSProperties = { fontSize: 30, fontWeight: 700, color: "hsl(var(--foreground))", lineHeight: 1.3 };
  const gap32: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 32, height: "100%", justifyContent: "center" };

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
      <div style={gap32}>
        <SlideQuoteBlock quote={data.problemStatement} accentColor={accentColor} label="Problem Statement" />
        {data.customerPersona && (
          <SplitLayout
            left={
              <div style={panel}>
                <p style={lbl}>Target Customer</p>
                <p style={heading}>{data.customerPersona.name}</p>
                <p style={{ fontSize: 20, color: "hsl(var(--muted-foreground))", marginTop: 6 }}>Age: {data.customerPersona.age}</p>
                <p style={{ ...txt, fontSize: 20, marginTop: 4 }}>{data.customerPersona.buyingBehavior}</p>
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid hsl(var(--border))" }}>
                  <p style={{ ...lbl, marginBottom: 8 }}>Willingness to Pay</p>
                  <p style={{ fontSize: 22, color: "hsl(var(--foreground))", opacity: 0.8 }}>{data.customerPersona.willingness}</p>
                </div>
              </div>
            }
            right={
              <div style={panel}>
                <p style={lbl}>Key Pain Points</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {data.customerPersona.painPoints.slice(0, 4).map((p, i) => (
                    <SlideBullet key={i} index={i} accentColor={accentColor}>{p}</SlideBullet>
                  ))}
                </div>
              </div>
            }
          />
        )}
      </div>
    ),

    /* ═══ 2. SOLUTION ═══ */
    solution: (
      <div style={gap32}>
        <SlideQuoteBlock quote={data.elevatorPitch} accentColor={accentColor} label="Elevator Pitch" />
        <div style={panel}>
          <p style={lbl}>Solution Overview</p>
          <p style={txt}>{data.solutionStatement}</p>
        </div>
        {data.competitiveAdvantages?.length > 0 && (
          <div style={panel}>
            <p style={lbl}>Key Differentiators</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
      <div style={gap32}>
        <SlideQuoteBlock quote={data.whyNow} accentColor={accentColor} label="Market Timing Thesis" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          {[
            { label: "Market Shift", desc: "Structural industry change creating new entry points" },
            { label: "Tech Enabler", desc: "New capabilities reducing cost and complexity barriers" },
            { label: "Demand Signal", desc: "Consumer behavior evolution favoring this approach" },
          ].map((item) => (
            <div key={item.label} style={{ ...panel, borderTop: `3px solid ${accentColor}` }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: "hsl(var(--foreground))", marginBottom: 8 }}>{item.label}</p>
              <p style={{ fontSize: 20, color: "hsl(var(--muted-foreground))", lineHeight: 1.45 }}>{item.desc}</p>
            </div>
          ))}
        </div>
        {data.marketOpportunity?.growthRate && (
          <KeyMetricPanel label="Market CAGR" value={data.marketOpportunity.growthRate} accentColor={accentColor} sublabel="Accelerating tailwinds create a narrow window for first-mover advantage" />
        )}
      </div>
    ),

    /* ═══ 4. MARKET ═══ */
    market: data.marketOpportunity ? (
      <div style={gap32}>
        <SplitLayout
          left={<MarketSizeVisual tam={data.marketOpportunity.tam} sam={data.marketOpportunity.sam} som={data.marketOpportunity.som} accentColor={accentColor} />}
          right={
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <SlideStatCard label="Total Addressable Market (TAM)" value={data.marketOpportunity.tam} accentColor={accentColor} />
              <SlideStatCard label="Serviceable Addressable Market (SAM)" value={data.marketOpportunity.sam} accentColor={accentColor} />
              <SlideStatCard label="Serviceable Obtainable Market (SOM)" value={data.marketOpportunity.som} accentColor={accentColor} sublabel="Initial target within 3 years" />
            </div>
          }
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <EmphasisBox accentColor={accentColor} label="Growth Rate">
            <p style={{ fontSize: 28, fontWeight: 700, color: "hsl(var(--foreground))" }}>{data.marketOpportunity.growthRate}</p>
          </EmphasisBox>
          <div style={panel}>
            <p style={lbl}>Key Drivers</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
      <div style={gap32}>
        {data.productInnovation && <SlideQuoteBlock quote={data.productInnovation} accentColor={accentColor} label="Innovation Thesis" />}
        <SplitLayout
          left={
            <div style={panel}>
              <p style={lbl}>Competitive Advantages</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {data.competitiveAdvantages.slice(0, 4).map((adv, i) => (
                  <SlideBullet key={i} index={i} accentColor={accentColor}>{adv}</SlideBullet>
                ))}
              </div>
            </div>
          }
          right={
            <div style={panel}>
              <p style={{ ...lbl, color: "hsl(142 71% 45%)" }}>Investor Highlights</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {data.investorHighlights.slice(0, 4).map((h, i) => (
                  <SlideBullet key={i} index={i} accentColor="hsl(142 71% 45%)">{h}</SlideBullet>
                ))}
              </div>
            </div>
          }
        />
      </div>
    ),

    /* ═══ 6. BUSINESS MODEL ═══ */
    businessmodel: (
      <div style={gap32}>
        {data.businessModel?.revenueStreams && (
          <div>
            <p style={lbl}>Revenue Streams</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {data.businessModel.revenueStreams.map((s, i) => (
                <span key={i} style={{ padding: "10px 20px", borderRadius: 8, fontSize: 20, fontWeight: 600, background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", borderLeft: `4px solid ${accentColor}` }}>{s}</span>
              ))}
            </div>
          </div>
        )}
        {fm && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <SlideStatCard label="Lifetime Value (LTV)" value={fm.unitEconomics.ltv} accentColor="hsl(142 71% 45%)" sublabel="Total customer revenue" />
                <SlideStatCard label="Customer Acquisition Cost" value={fm.unitEconomics.cac} accentColor="hsl(38 92% 50%)" sublabel="Cost to acquire one customer" />
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
      <div style={gap32}>
        <SplitLayout
          left={
            data.tractionSignals?.length ? (
              <div style={panel}>
                <p style={{ ...lbl, color: "hsl(142 71% 45%)" }}>Traction Signals</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {data.tractionSignals.slice(0, 4).map((s, i) => (
                    <SlideBullet key={i} index={i} accentColor="hsl(142 71% 45%)">{s}</SlideBullet>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ ...panel, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: 20, color: "hsl(var(--muted-foreground))" }}>Pre-launch — traction targets defined</p>
              </div>
            )
          }
          right={
            data.keyMetrics?.length > 0 ? (
              <div style={panel}>
                <p style={lbl}>Key Performance Indicators</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
              <p style={{ fontSize: 16, color: "hsl(var(--muted-foreground))", marginBottom: 4 }}>AI Score</p>
              <p style={{ fontSize: 48, fontWeight: 800, color: "hsl(var(--foreground))", fontFamily: "'Space Grotesk', sans-serif" }}>{product.revivalScore || "—"}</p>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 18, color: "hsl(var(--muted-foreground))" }}>Your Rating</p>
                <span style={{ fontSize: 22, fontWeight: 700, color: "hsl(var(--foreground))" }}>{userScore}/10</span>
              </div>
              <Slider value={[userScore]} onValueChange={(v) => setUserScore(v[0])} min={1} max={10} step={1} />
            </div>
          </div>
        </EmphasisBox>
      </div>
    ),

    /* ═══ 8. RISKS ═══ */
    risks: (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, height: "100%", justifyContent: "center" }}>
        {data.risks.slice(0, 4).map((r, i) => (
          <div key={i} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid hsl(var(--border))" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 28px", background: "hsl(var(--muted))" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "hsl(var(--foreground))", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "white", background: r.severity === "high" ? "hsl(0 72% 51%)" : r.severity === "medium" ? "hsl(38 92% 50%)" : "hsl(142 71% 45%)" }}>{i + 1}</span>
                {r.risk}
              </p>
              <RiskSeverityBar severity={r.severity} />
            </div>
            <div style={{ padding: "16px 28px", borderLeft: `4px solid ${r.severity === "high" ? "hsl(0 72% 51%)" : r.severity === "medium" ? "hsl(38 92% 50%)" : "hsl(142 71% 45%)"}` }}>
              <p style={{ ...lbl, fontSize: 12, marginBottom: 6 }}>Mitigation Strategy</p>
              <p style={{ ...txt, fontSize: 22 }}>{r.mitigation}</p>
            </div>
          </div>
        ))}
      </div>
    ),

    /* ═══ 9. GTM ═══ */
    gtm: data.gtmStrategy ? (
      <div style={gap32}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={panel}>
            <p style={lbl}>Distribution Channels</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {data.gtmStrategy.keyChannels.map((ch, i) => (
                <span key={i} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 18, fontWeight: 600, background: "hsl(var(--card))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", borderLeft: `3px solid ${accentColor}` }}>{ch}</span>
              ))}
            </div>
          </div>
          <SlideStatCard label="Launch Budget" value={data.gtmStrategy.launchBudget} accentColor={accentColor} sublabel="Initial go-to-market investment" />
        </div>
        {data.competitiveLandscape?.moat && <SlideQuoteBlock quote={data.competitiveLandscape.moat} accentColor={accentColor} label="Defensible Moat" />}
      </div>
    ) : null,

    /* ═══ 10. THE ASK ═══ */
    invest: (
      <div style={gap32}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={panel}>
            <p style={lbl}>Use of Funds</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
  const rawCover = (
    <PitchCoverSlide
      productName={product.name}
      subtitle={data.tagline || data.elevatorPitch?.split(".")?.[0]}
      accentColor={accentColor}
      totalSlides={TOTAL + 1}
    />
  );
  const allRawSlides = [rawCover, ...SLIDE_TABS.map(tab => rawSlide(tab.id, slideContent[tab.id]))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {presenting && <PresentationMode slides={allRawSlides} onExit={() => setPresenting(false)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-foreground text-sm">Pitch Deck: {product.name}</h3>
          <p className="text-xs text-muted-foreground">{TOTAL} slides · Click any to jump</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPresenting(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
            style={{ background: accentColor, color: "white" }}>
            <Presentation size={12} /> Present
          </button>
          <ExportPanel product={product} pitchDeckData={data} analysisId={analysisId} userId={user?.id} accentColor={accentColor} />
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

      {/* Active slide with ScaledSlide wrapper */}
      <ScaledSlide>{rawSlide(activeSlide, slideContent[activeSlide])}</ScaledSlide>

      {/* Navigation */}
      {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
      {!nextSlide && activeSlide === "invest" && (
        <>
          <AllExploredBadge />
          <button
            onClick={goNext}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold py-4 rounded-md text-white transition-all hover:opacity-90 animate-pulse"
            style={{ background: accentColor }}
          >
            <Sparkles size={16} /> Complete Analysis
          </button>
        </>
      )}

      <div className="mt-6"><ReferralCTA compact /></div>
    </div>
  );
};
