import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StructuralVisualList } from "./StructuralVisual";
import { ActionPlanList } from "./ActionPlanCard";
import { toast } from "sonner";
import type { Product } from "@/data/mockProducts";
import { downloadPitchDeckPDF } from "@/lib/pdfExport";
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
  Layers, Shield,
} from "lucide-react";
import { NextSectionButton, SectionWorkflowNav, AllExploredBadge } from "@/components/SectionNav";
import {
  ScaledSlide, PitchSlideFrame, PitchCoverSlide,
  SlideStatCard, SlideBullet, MarketSizeVisual, RiskSeverityBar,
  ScenarioBarChart, SlideQuoteBlock, SlideTimeline, MetricBar,
  FunnelVisual, DonutChart, KeyMetricPanel, EmphasisBox, SplitLayout,
  InsightCard, ComparisonLayout, TakeawayCallout, ThreeColumnGrid,
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
  insightPreferences?: Record<string, "liked" | "dismissed" | "neutral">;
  steeringText?: string;
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
export const PitchDeck = ({ product, analysisId, onSave, externalData, disruptData, stressTestData, redesignData, userScores, accentColor: modeAccent, insightPreferences, steeringText }: PitchDeckProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const analysisCtx = useAnalysis();
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
  const panel: React.CSSProperties = { padding: 28, borderRadius: 10, background: "#fafafa", border: "1px solid #e8e8ec" };
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
        {data.competitiveAdvantages?.length > 0 && (
          <ComparisonLayout
            leftTitle="Market Standard"
            leftItems={data.competitiveAdvantages.slice(0, 3).map(a => `Lacks: ${a.split(" ").slice(0, 6).join(" ")}...`)}
            rightTitle="Our Differentiation"
            rightItems={data.competitiveAdvantages.slice(0, 3)}
            accentColor={accentColor}
          />
        )}
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
                  <img src={img.url} alt={img.ideaName} style={{ width: "100%", height: 240, objectFit: "cover", borderRadius: "10px 10px 0 0" }} />
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
          <ComparisonLayout
            leftTitle="Competitive Advantages"
            leftItems={data.competitiveAdvantages.slice(0, 4)}
            rightTitle="Investor Highlights"
            rightItems={data.investorHighlights.slice(0, 4)}
            accentColor={accentColor}
          />
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

    /* ═══ 8. RISKS ═══ */
    risks: (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {data.risks.slice(0, 4).map((r, i) => (
          <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e8e8ec" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 24px", background: "#fafafa" }}>
              <p style={{ fontSize: 21, fontWeight: 700, color: "#0f0f12", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 26, height: 26, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#ffffff", background: r.severity === "high" ? "#ef4444" : r.severity === "medium" ? "#f59e0b" : "#22c55e" }}>{i + 1}</span>
                {r.risk}
              </p>
              <RiskSeverityBar severity={r.severity} />
            </div>
            <div style={{ padding: "14px 24px", borderLeft: `4px solid ${r.severity === "high" ? "#ef4444" : r.severity === "medium" ? "#f59e0b" : "#22c55e"}` }}>
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
  const rawCover = (
    <PitchCoverSlide
      productName={product.name}
      subtitle={data.tagline || data.elevatorPitch?.split(".")?.[0]}
      accentColor={accentColor}
      totalSlides={TOTAL + 1}
      coverImages={analysisCtx.pitchDeckImages.length > 0 ? analysisCtx.pitchDeckImages : undefined}
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
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
          boxShadow: `0 8px 32px -8px ${accentColor}66`,
        }}
      >
        <div className="absolute inset-0 rounded-xl overflow-hidden opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles size={28} style={{ color: "white" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.8)" }}>You might be on to something</p>
            <h2 className="text-xl sm:text-2xl font-bold leading-tight mb-1" style={{ color: "white" }}>
              Well done — that's super creative.
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
              Your investor-ready pitch deck for <strong style={{ color: "white" }}>{product.name}</strong> is ready — {TOTAL} structured slides, presentation-grade.
            </p>
          </div>
          <div className="cta-container flex flex-col gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setPresenting(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: "white", color: accentColor, boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}
            >
              <Presentation size={18} /> Present Full Deck
            </button>
            <div className="flex items-center gap-2">
              <ExportPanel product={product} pitchDeckData={data} analysisId={analysisId} userId={user?.id} accentColor="white" />
              <button onClick={runAnalysis} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}>
                {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />} Regenerate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* L1 Executive Signal — Structural Visuals & Action Plans */}
      <StructuralVisualList specs={(data as any).visualSpecs} />
      <ActionPlanList plans={(data as any).actionPlans} />

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="typo-card-meta text-muted-foreground">{TOTAL} slides · Click any to jump</p>
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
