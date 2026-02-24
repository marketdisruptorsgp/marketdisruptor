import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Product } from "@/data/mockProducts";
import { downloadPitchDeckPDF } from "@/lib/pdfExport";
import { useAuth } from "@/hooks/useAuth";
import { ReferralCTA } from "@/components/ReferralCTA";
import { Slider } from "@/components/ui/slider";
import {
  Presentation, RefreshCw, DollarSign, TrendingUp, Users, Factory, Truck,
  Package, Globe, Target, Zap, CheckCircle2, ArrowRight, BarChart3,
  ShieldAlert, Lightbulb, Store, Phone, Mail, ExternalLink, Clock,
  Star, AlertTriangle, Download, ChevronRight, Rocket, Sparkles,
  Award, Layers, Shield, LineChart,
} from "lucide-react";
import { SectionHeader, NextSectionButton, SectionPills, AllExploredBadge, DetailPanel } from "@/components/SectionNav";
import { StepLoadingTracker, PITCH_DECK_TASKS } from "@/components/StepLoadingTracker";
import { useNavigate } from "react-router-dom";

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
  const nextSlide = currentIdx < SLIDE_TABS.length - 1 ? SLIDE_TABS[currentIdx + 1] : null;

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

  // Completion screen
  if (showCompletion) {
    const completionMsg = data.completionMessage || `${product.name} represents a structurally differentiated opportunity in a market where incumbents have stopped questioning their own assumptions.`;
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-2xl text-center space-y-5" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))", border: "2px solid hsl(var(--primary) / 0.2)" }}>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Sparkles size={28} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Pitch Deck Complete</h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Your 12-section investor deck for <strong className="text-foreground">{product.name}</strong> is ready.
            </p>
          </div>
          <div className="p-4 rounded-xl max-w-lg mx-auto" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Strategic Insight</p>
            <p className="text-sm text-foreground/80 leading-relaxed italic">"{completionMsg}"</p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
              style={{ background: "hsl(var(--primary))", color: "white" }}>
              <Download size={14} /> Export PDF
            </button>
            <button onClick={() => navigate("/portfolio")}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
              <Award size={14} /> View Portfolio
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            <CheckCircle2 size={10} className="inline mr-1" style={{ color: "hsl(142 70% 40%)" }} />
            Project saved to your portfolio
          </p>
        </div>

        <button onClick={() => setShowCompletion(false)}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          ← Back to deck sections
        </button>

        <ReferralCTA />
      </div>
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Presentation size={14} style={{ color: "white" }} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Pitch Deck: {product.name}</h3>
            <p className="text-[10px] text-muted-foreground">{SLIDE_TABS.length} sections · Click any to jump</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            <Download size={11} /> PDF
          </button>
          <button onClick={runAnalysis} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
            {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />} Regenerate
          </button>
        </div>
      </div>

      <SectionPills
        steps={SLIDE_TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
        activeId={activeSlide}
        visitedIds={visitedSlides}
        onSelect={(id) => { setActiveSlide(id); setVisitedSlides(prev => new Set([...prev, id])); }}
      />

      {/* 1. PROBLEM */}
      {activeSlide === "problem" && (
        <div className="space-y-4">
          <SectionHeader current={1} total={SLIDE_TABS.length} label="The Problem" icon={AlertTriangle} />
          <div className="p-5 rounded-lg" style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--destructive))" }}>Problem Statement</p>
            <p className="text-sm leading-relaxed text-foreground/90">{data.problemStatement}</p>
          </div>
          {data.customerPersona && (
            <DetailPanel title="Target Customer Persona" icon={Users}>
              <div className="space-y-2 mb-2">
                <p className="text-xs font-bold text-foreground">{data.customerPersona.name}</p>
                <p className="text-xs text-foreground/70">Age: {data.customerPersona.age} · {data.customerPersona.buyingBehavior}</p>
                <div className="space-y-1">
                  {data.customerPersona.painPoints.map((p, i) => (
                    <div key={i} className="flex gap-2 items-start text-xs">
                      <AlertTriangle size={10} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-foreground/80">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </DetailPanel>
          )}
          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* 2. SOLUTION */}
      {activeSlide === "solution" && (
        <div className="space-y-4">
          <SectionHeader current={2} total={SLIDE_TABS.length} label="The Solution" icon={Lightbulb} />
          <div className="p-5 rounded-lg" style={{ background: "hsl(142 70% 45% / 0.06)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(142 70% 35%)" }}>Solution</p>
            <p className="text-sm leading-relaxed text-foreground/90">{data.solutionStatement}</p>
          </div>
          <div className="p-5 rounded-lg text-white" style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-70">Elevator Pitch</p>
            <p className="text-base font-bold leading-relaxed">{data.elevatorPitch}</p>
          </div>
          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* 3. WHY NOW */}
      {activeSlide === "whynow" && (
        <div className="space-y-4">
          <SectionHeader current={3} total={SLIDE_TABS.length} label="Why Now" icon={Clock} />
          <div className="p-5 rounded-lg" style={{ background: "hsl(38 92% 50% / 0.06)", border: "1px solid hsl(38 92% 50% / 0.2)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(38 92% 35%)" }}>Market Timing</p>
            <p className="text-sm leading-relaxed text-foreground/90">{data.whyNow}</p>
          </div>
          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* 4. MARKET */}
      {activeSlide === "market" && data.marketOpportunity && (
        <div className="space-y-4">
          <SectionHeader current={4} total={SLIDE_TABS.length} label="Market Opportunity" icon={Globe} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "TAM", value: data.marketOpportunity.tam, color: "hsl(var(--primary))" },
              { label: "SAM", value: data.marketOpportunity.sam, color: "hsl(217 91% 55%)" },
              { label: "SOM", value: data.marketOpportunity.som, color: "hsl(142 70% 40%)" },
            ].map((m) => (
              <div key={m.label} className="p-4 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className="text-xl font-extrabold" style={{ color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-xs font-bold text-foreground flex items-center gap-1"><TrendingUp size={12} style={{ color: "hsl(var(--primary))" }} /> Growth Rate</p>
            <p className="text-lg font-extrabold" style={{ color: "hsl(var(--primary))" }}>{data.marketOpportunity.growthRate}</p>
          </div>
          <DetailPanel title={`Key Drivers (${data.marketOpportunity.keyDrivers.length})`} icon={BarChart3}>
            <div className="space-y-1.5 mb-2">
              {data.marketOpportunity.keyDrivers.map((d, i) => (
                <div key={i} className="flex gap-2 items-start text-xs">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                  <span className="text-foreground/80">{d}</span>
                </div>
              ))}
            </div>
          </DetailPanel>
          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* 5. PRODUCT / INNOVATION */}
      {activeSlide === "product" && (
        <div className="space-y-4">
          <SectionHeader current={5} total={SLIDE_TABS.length} label="Product / Innovation" icon={Layers} />
          {data.productInnovation && (
            <div className="p-5 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-primary">What Makes It Different</p>
              <p className="text-sm leading-relaxed text-foreground/90">{data.productInnovation}</p>
            </div>
          )}
          <DetailPanel title={`Competitive Advantages (${data.competitiveAdvantages.length})`} icon={Star}>
            <div className="space-y-1.5 mb-2">
              {data.competitiveAdvantages.map((adv, i) => (
                <div key={i} className="flex gap-2 items-start text-xs">
                  <ArrowRight size={11} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80">{adv}</span>
                </div>
              ))}
            </div>
          </DetailPanel>
          <DetailPanel title={`Investor Highlights (${data.investorHighlights.length})`} icon={Zap}>
            <div className="space-y-1.5 mb-2">
              {data.investorHighlights.map((h, i) => (
                <div key={i} className="flex gap-2 items-start text-xs">
                  <Zap size={11} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80">{h}</span>
                </div>
              ))}
            </div>
          </DetailPanel>
          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* 6. BUSINESS MODEL */}
      {activeSlide === "businessmodel" && (
        <div className="space-y-4">
          <SectionHeader current={6} total={SLIDE_TABS.length} label="Business Model" icon={DollarSign} />
          {data.businessModel?.revenueStreams && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Revenue Streams</p>
              {data.businessModel.revenueStreams.map((s, i) => (
                <div key={i} className="flex gap-2 items-center text-xs p-2.5 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <DollarSign size={11} style={{ color: "hsl(var(--primary))" }} />
                  <span className="text-foreground">{s}</span>
                </div>
              ))}
            </div>
          )}
          {fm && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "COGS", value: fm.unitEconomics.cogs },
                  { label: "Price", value: fm.unitEconomics.retailPrice },
                  { label: "Gross Margin", value: fm.unitEconomics.grossMargin, highlight: true },
                  { label: "Payback", value: fm.unitEconomics.paybackPeriod },
                ].map((item) => (
                  <div key={item.label} className="p-2 rounded-lg text-center"
                    style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{item.label}</p>
                    <p className="text-sm font-extrabold" style={{ color: item.highlight ? "hsl(var(--primary))" : "hsl(var(--foreground))" }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <DetailPanel title="Pricing Strategy & Break-Even" icon={DollarSign}>
                <div className="space-y-2 mb-2 text-xs">
                  {fm.pricingStrategy && <div><p className="font-bold text-foreground mb-0.5">Pricing</p><p className="text-foreground/70">{fm.pricingStrategy}</p></div>}
                  {fm.breakEvenAnalysis && <div><p className="font-bold text-foreground mb-0.5">Break-Even</p><p className="text-foreground/70">{fm.breakEvenAnalysis}</p></div>}
                </div>
              </DetailPanel>
            </>
          )}
          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* 7. TRACTION SIGNALS */}
      {activeSlide === "traction" && (
        <div className="space-y-4">
          <SectionHeader current={7} total={SLIDE_TABS.length} label="Traction Signals" icon={TrendingUp} />
          {data.tractionSignals?.map((s, i) => (
            <div key={i} className="flex gap-3 items-start p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <TrendingUp size={14} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm text-foreground/90">{s}</p>
            </div>
          ))}
          {(!data.tractionSignals || data.tractionSignals.length === 0) && (
            <div className="p-5 text-center rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-sm text-muted-foreground">No explicit traction signals available yet. This section strengthens as you gather pre-launch data.</p>
            </div>
          )}
          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* 8. RISKS & MITIGATION */}
      {activeSlide === "risks" && (
        <div className="space-y-4">
          <SectionHeader current={8} total={SLIDE_TABS.length} label="Risks & Mitigation" icon={ShieldAlert} />
          {data.risks.map((r, i) => {
            const sColor = r.severity === "high" ? "hsl(var(--destructive))" : r.severity === "medium" ? "hsl(38 92% 45%)" : "hsl(142 70% 40%)";
            return (
              <div key={i} className="rounded-lg overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: "hsl(var(--muted))" }}>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ color: sColor }}>{r.severity}</span>
                  <p className="text-xs font-bold text-foreground">{r.risk}</p>
                </div>
                <div className="px-3 py-2 flex gap-2 items-start" style={{ background: "hsl(var(--muted))" }}>
                  <CheckCircle2 size={11} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
                  <p className="text-xs text-foreground/70">{r.mitigation}</p>
                </div>
              </div>
            );
          })}
          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* 9. METRICS THAT MATTER */}
      {activeSlide === "metrics" && (
        <div className="space-y-4">
          <SectionHeader current={9} total={SLIDE_TABS.length} label="Metrics That Matter" icon={BarChart3} />
          {data.keyMetrics.map((m, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <div>
                <p className="text-xs font-bold text-foreground">{m.metric}</p>
                <p className="text-[10px] text-muted-foreground">{m.why}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                style={{ background: "hsl(var(--primary))", color: "white" }}>{m.target}</span>
            </div>
          ))}

          {/* Score Comparison */}
          <div className="p-5 rounded-lg space-y-4" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Revival Potential Score</p>
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
            {Math.abs(userScore - (product.revivalScore || 0)) >= 2 && (
              <div className="p-2.5 rounded-lg text-xs" style={{ background: "hsl(38 92% 50% / 0.08)", border: "1px solid hsl(38 92% 50% / 0.2)" }}>
                <p className="font-semibold" style={{ color: "hsl(38 92% 35%)" }}>
                  Notable difference: You rated {userScore > (product.revivalScore || 0) ? "higher" : "lower"} than the AI by {Math.abs(userScore - (product.revivalScore || 0))} points
                </p>
              </div>
            )}
          </div>

          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* 10. GO-TO-MARKET */}
      {activeSlide === "gtm" && data.gtmStrategy && (
        <div className="space-y-4">
          <SectionHeader current={10} total={SLIDE_TABS.length} label="Go-to-Market" icon={Target} />
          {[
            { label: "Phase 1: Launch", content: data.gtmStrategy.phase1, color: "hsl(142 70% 45%)" },
            { label: "Phase 2: Scale", content: data.gtmStrategy.phase2, color: "hsl(var(--primary))" },
            { label: "Phase 3: Dominate", content: data.gtmStrategy.phase3, color: "hsl(38 92% 50%)" },
          ].map((phase, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-xs font-bold mb-1" style={{ color: phase.color }}>{phase.label}</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{phase.content}</p>
            </div>
          ))}
          <DetailPanel title="Channels & Budget" icon={Globe}>
            <div className="space-y-3 mb-2">
              <div className="flex flex-wrap gap-1.5">
                {data.gtmStrategy.keyChannels.map((ch, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary-dark))", border: "1px solid hsl(var(--primary) / 0.25)" }}>{ch}</span>
                ))}
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase" style={{ color: "hsl(142 70% 35%)" }}>Launch Budget</p>
                <p className="text-xl font-extrabold" style={{ color: "hsl(142 70% 28%)" }}>{data.gtmStrategy.launchBudget}</p>
              </div>
            </div>
          </DetailPanel>
          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* 11. COMPETITIVE LANDSCAPE */}
      {activeSlide === "competitive" && (
        <div className="space-y-4">
          <SectionHeader current={11} total={SLIDE_TABS.length} label="Competitive Landscape" icon={Shield} />
          {data.competitiveLandscape?.directCompetitors?.map((c, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-sm font-bold text-foreground mb-2">{c.name}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Strength</p>
                  <p className="text-foreground/80">{c.strength}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase mb-0.5" style={{ color: "hsl(var(--destructive))" }}>Weakness</p>
                  <p className="text-foreground/80">{c.weakness}</p>
                </div>
              </div>
            </div>
          ))}
          {data.competitiveLandscape?.moat && (
            <div className="p-4 rounded-lg" style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-primary">Defensible Moat</p>
              <p className="text-sm text-foreground/90">{data.competitiveLandscape.moat}</p>
            </div>
          )}
          {/* Fallback to old competitiveAdvantages if no landscape */}
          {(!data.competitiveLandscape?.directCompetitors?.length) && data.competitiveAdvantages.length > 0 && (
            <div className="space-y-2">
              {data.competitiveAdvantages.map((a, i) => (
                <div key={i} className="flex gap-2 items-start text-xs p-2.5 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <ArrowRight size={11} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80">{a}</span>
                </div>
              ))}
            </div>
          )}
          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* 12. INVESTMENT ASK */}
      {activeSlide === "invest" && (
        <div className="space-y-4">
          <SectionHeader current={12} total={SLIDE_TABS.length} label="Investment Ask" icon={Rocket} />

          {/* Funding amount */}
          <div className="p-4 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--primary))" }}>Funding Ask</p>
              <span className="text-lg font-extrabold" style={{ color: "hsl(var(--primary))" }}>{fm?.fundingAsk || data.investmentAsk?.amount || "TBD"}</span>
            </div>
          </div>

          {/* Revenue Scenarios */}
          {fm?.scenarios && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "conservative", label: "Conservative", color: "hsl(217 91% 55%)", data: fm.scenarios.conservative },
                { key: "base", label: "Base Case", color: "hsl(var(--primary))", data: fm.scenarios.base },
                { key: "optimistic", label: "Optimistic", color: "hsl(142 70% 40%)", data: fm.scenarios.optimistic },
              ].map((s) => s.data && (
                <div key={s.key} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", borderTop: `3px solid ${s.color}` }}>
                  <p className="text-xs font-bold mb-1.5" style={{ color: s.color }}>{s.label}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-bold" style={{ color: s.color }}>{s.data.revenue}</span></div>
                    {s.data.units && <div className="flex justify-between"><span className="text-muted-foreground">Units</span><span className="font-bold">{s.data.units}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DetailPanel title="Use of Funds & Exit" icon={DollarSign}>
            <div className="space-y-3 mb-2">
              {(fm?.useOfFunds || data.investmentAsk?.useOfFunds || []).map((u, i) => (
                <div key={i} className="flex gap-2 items-center text-xs">
                  <CheckCircle2 size={10} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />
                  <span>{u}</span>
                </div>
              ))}
              <div className="pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Exit Strategy</p>
                <p className="text-xs text-foreground/80">{fm?.exitStrategy || data.investmentAsk?.exitStrategy || "TBD"}</p>
              </div>
            </div>
          </DetailPanel>

          {/* Suppliers */}
          {data.supplierContacts?.length > 0 && (
            <DetailPanel title={`Suppliers (${data.supplierContacts.length}) & Distributors (${data.distributorContacts?.length || 0})`} icon={Factory}>
              <div className="space-y-3 mb-2">
                {data.supplierContacts.slice(0, 3).map((s, i) => (
                  <ContactCard key={`s-${i}`} contact={s} accentColor="hsl(var(--primary))" />
                ))}
                {data.distributorContacts?.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-2">Distributors</p>
                    {data.distributorContacts.slice(0, 2).map((d, i) => (
                      <ContactCard key={`d-${i}`} contact={d} accentColor="hsl(217 91% 55%)" />
                    ))}
                  </>
                )}
              </div>
            </DetailPanel>
          )}

          <AllExploredBadge />

          {/* SGP Capital CTA */}
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
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
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 size={12} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                      <span className="text-foreground/80">{b}</span>
                    </div>
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
                  lines.push(`You can view my full analysis here:`); lines.push(projectUrl); lines.push(``);
                  lines.push(`Best,`); lines.push(name);
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
        </div>
      )}

      {/* Referral CTA */}
      <div className="mt-6">
        <ReferralCTA compact />
      </div>
    </div>
  );
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
