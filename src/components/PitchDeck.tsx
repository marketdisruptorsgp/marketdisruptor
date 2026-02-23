import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Product } from "@/data/mockProducts";
import { downloadPitchDeckPDF } from "@/lib/pdfExport";
import {
  Presentation, RefreshCw, DollarSign, TrendingUp, Users, Factory, Truck,
  Package, Globe, Target, Zap, CheckCircle2, ArrowRight, BarChart3,
  ShieldAlert, Lightbulb, Store, Phone, Mail, ExternalLink, Clock,
  Star, AlertTriangle, Download, ChevronRight,
} from "lucide-react";
import { SectionHeader, NextSectionButton, SectionPills, AllExploredBadge, DetailPanel } from "@/components/SectionNav";

interface FinancialModel {
  unitEconomics: {
    cogs: string;
    retailPrice: string;
    grossMargin: string;
    contributionMargin: string;
    paybackPeriod: string;
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
  competitiveAdvantages: string[];
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
}

interface PitchDeckProps {
  product: Product;
  onSave?: (deckData: PitchDeckData) => void;
}

const SLIDE_TABS = [
  { id: "pitch", label: "Elevator Pitch", icon: Star },
  { id: "market", label: "Market", icon: Globe },
  { id: "financials", label: "Financials", icon: DollarSign },
  { id: "suppliers", label: "Suppliers & Contacts", icon: Factory },
  { id: "gtm", label: "Go-to-Market", icon: Target },
  { id: "risks", label: "Risks & Metrics", icon: ShieldAlert },
] as const;

type SlideTab = typeof SLIDE_TABS[number]["id"];

export const PitchDeck = ({ product, onSave }: PitchDeckProps) => {
  const [data, setData] = useState<PitchDeckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState<SlideTab>("pitch");
  const [visitedSlides, setVisitedSlides] = useState<Set<string>>(new Set(["pitch"]));

  const handleDownloadPDF = () => { if (!data) return; downloadPitchDeckPDF(product, data); };

  const currentIdx = SLIDE_TABS.findIndex(t => t.id === activeSlide);
  const nextSlide = currentIdx < SLIDE_TABS.length - 1 ? SLIDE_TABS[currentIdx + 1] : null;

  const goNext = () => {
    if (!nextSlide) return;
    setActiveSlide(nextSlide.id);
    setVisitedSlides(prev => new Set([...prev, nextSlide.id]));
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-pitch-deck", { body: { product } });
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

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--primary-muted))" }}>
          <Presentation size={36} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Investor Pitch Deck</h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Full investor-ready brief for <strong>{product.name}</strong> — market sizing, financials, suppliers, and GTM plan.
          </p>
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-colors"
          style={{ background: "hsl(var(--primary))", color: "white", opacity: loading ? 0.7 : 1 }}>
          {loading ? <><RefreshCw size={15} className="animate-spin" /> Building…</> : <><Presentation size={15} /> Generate Full Pitch Deck</>}
        </button>
        <p className="text-[11px] text-muted-foreground">Uses Gemini 2.5 Pro · ~20–40 seconds</p>
      </div>
    );
  }

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

      {/* SLIDE: ELEVATOR PITCH */}
      {activeSlide === "pitch" && (
        <div className="space-y-4">
          <SectionHeader current={1} total={SLIDE_TABS.length} label="Elevator Pitch" icon={Star} />
          <div className="p-5 rounded-lg text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-70">Elevator Pitch</p>
            <p className="text-lg font-bold leading-relaxed">{data.elevatorPitch}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-lg" style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--destructive))" }}>The Problem</p>
              <p className="text-sm leading-relaxed text-foreground/80">{data.problemStatement}</p>
            </div>
            <div className="p-4 rounded-lg" style={{ background: "hsl(142 70% 45% / 0.06)", border: "1px solid hsl(142 70% 45% / 0.25)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(142 70% 35%)" }}>The Solution</p>
              <p className="text-sm leading-relaxed text-foreground/80">{data.solutionStatement}</p>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ background: "hsl(38 92% 50% / 0.08)", borderLeft: "3px solid hsl(38 92% 50%)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(38 92% 35%)" }}>Why Now?</p>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(38 92% 25%)" }}>{data.whyNow}</p>
          </div>

          <DetailPanel title={`Investor Highlights (${data.investorHighlights.length}) & Competitive Advantages`} icon={Star}>
            <div className="space-y-2 mb-2">
              {data.investorHighlights.map((h, i) => (
                <div key={i} className="flex gap-2 items-start text-xs">
                  <Zap size={11} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80">{h}</span>
                </div>
              ))}
              <div className="pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Competitive Advantages</p>
                {data.competitiveAdvantages.map((adv, i) => (
                  <div key={i} className="flex gap-2 items-start text-xs mb-1">
                    <ArrowRight size={11} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                    <span className="text-foreground/80">{adv}</span>
                  </div>
                ))}
              </div>
              {data.customerPersona && (
                <div className="pt-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Ideal Customer: {data.customerPersona.name}</p>
                  <div className="text-xs text-foreground/80 space-y-0.5">
                    <p>Age: {data.customerPersona.age} · {data.customerPersona.buyingBehavior}</p>
                    <p className="font-semibold" style={{ color: "hsl(142 70% 35%)" }}>Willingness: {data.customerPersona.willingness}</p>
                  </div>
                </div>
              )}
            </div>
          </DetailPanel>

          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* SLIDE: MARKET */}
      {activeSlide === "market" && data.marketOpportunity && (
        <div className="space-y-4">
          <SectionHeader current={2} total={SLIDE_TABS.length} label="Market Opportunity" icon={Globe} />

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

          <div className="p-3 rounded-lg" style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
            <p className="text-xs font-bold text-foreground flex items-center gap-1"><TrendingUp size={12} style={{ color: "hsl(var(--primary))" }} /> Growth Rate</p>
            <p className="text-lg font-extrabold" style={{ color: "hsl(var(--primary))" }}>{data.marketOpportunity.growthRate}</p>
          </div>

          <DetailPanel title={`Key Market Drivers (${data.marketOpportunity.keyDrivers.length})`} icon={BarChart3}>
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

      {/* SLIDE: FINANCIALS */}
      {activeSlide === "financials" && data.financialModel && (
        <div className="space-y-4">
          <SectionHeader current={3} total={SLIDE_TABS.length} label="Financials" icon={DollarSign} />

          {/* Unit Economics — compact */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: "COGS", value: data.financialModel.unitEconomics.cogs },
              { label: "Price", value: data.financialModel.unitEconomics.retailPrice },
              { label: "Gross Margin", value: data.financialModel.unitEconomics.grossMargin, highlight: true },
              { label: "Contrib. Margin", value: data.financialModel.unitEconomics.contributionMargin, highlight: true },
              { label: "Payback", value: data.financialModel.unitEconomics.paybackPeriod },
            ].map((item) => (
              <div key={item.label} className="p-2 rounded-lg text-center"
                style={{ background: item.highlight ? "hsl(var(--primary-muted))" : "hsl(var(--muted))", border: `1px solid ${item.highlight ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}` }}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-sm font-extrabold" style={{ color: item.highlight ? "hsl(var(--primary-dark))" : "hsl(var(--foreground))" }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Revenue Scenarios — base case prominent */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: "conservative", label: "Conservative", color: "hsl(217 91% 55%)", data: data.financialModel.scenarios.conservative },
              { key: "base", label: "Base Case", color: "hsl(var(--primary))", data: data.financialModel.scenarios.base },
              { key: "optimistic", label: "Optimistic", color: "hsl(142 70% 40%)", data: data.financialModel.scenarios.optimistic },
            ].map((s) => (
              <div key={s.key} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", borderTop: `3px solid ${s.color}` }}>
                <p className="text-xs font-bold mb-1.5" style={{ color: s.color }}>{s.label}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-bold" style={{ color: s.color }}>{s.data.revenue}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Profit</span><span className="font-bold">{s.data.profit}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Funding ask */}
          <div className="p-4 rounded-lg" style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.25)" }}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--primary))" }}>Funding Ask</p>
              <span className="text-lg font-extrabold" style={{ color: "hsl(var(--primary))" }}>{data.financialModel.fundingAsk}</span>
            </div>
          </div>

          <DetailPanel title="Pricing Strategy, Use of Funds & Exit" icon={DollarSign}>
            <div className="space-y-3 mb-2">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Pricing Strategy</p>
                <p className="text-xs text-foreground/80">{data.financialModel.pricingStrategy}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Break-Even</p>
                <p className="text-xs text-foreground/80">{data.financialModel.breakEvenAnalysis}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Use of Funds</p>
                {data.financialModel.useOfFunds.map((u, i) => (
                  <div key={i} className="flex gap-2 items-center text-xs mb-0.5">
                    <CheckCircle2 size={10} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />
                    <span>{u}</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Exit Strategy</p>
                <p className="text-xs text-foreground/80">{data.financialModel.exitStrategy}</p>
              </div>
            </div>
          </DetailPanel>

          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* SLIDE: SUPPLIERS */}
      {activeSlide === "suppliers" && (
        <div className="space-y-4">
          <SectionHeader current={4} total={SLIDE_TABS.length} label="Suppliers & Contacts" icon={Factory} />

          {/* Show first 2 suppliers, rest collapsed */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Manufacturers & Suppliers</p>
          {data.supplierContacts.slice(0, 2).map((s, i) => (
            <ContactCard key={i} contact={s} accentColor="hsl(var(--primary))" />
          ))}

          {(data.supplierContacts.length > 2 || data.distributorContacts.length > 0) && (
            <DetailPanel title={`${Math.max(0, data.supplierContacts.length - 2)} more suppliers + ${data.distributorContacts.length} distributors`} icon={Truck}>
              <div className="space-y-3 mb-2">
                {data.supplierContacts.slice(2).map((s, i) => (
                  <ContactCard key={`s-${i}`} contact={s} accentColor="hsl(var(--primary))" />
                ))}
                {data.distributorContacts.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-2">Distributors & Logistics</p>
                    {data.distributorContacts.map((d, i) => (
                      <ContactCard key={`d-${i}`} contact={d} accentColor="hsl(217 91% 55%)" />
                    ))}
                  </>
                )}
              </div>
            </DetailPanel>
          )}

          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* SLIDE: GO-TO-MARKET */}
      {activeSlide === "gtm" && data.gtmStrategy && (
        <div className="space-y-4">
          <SectionHeader current={5} total={SLIDE_TABS.length} label="Go-to-Market" icon={Target} />

          {[
            { label: "Phase 1: Launch", content: data.gtmStrategy.phase1, color: "hsl(142 70% 45%)" },
            { label: "Phase 2: Scale", content: data.gtmStrategy.phase2, color: "hsl(var(--primary))" },
            { label: "Phase 3: Dominate", content: data.gtmStrategy.phase3, color: "hsl(38 92% 50%)" },
          ].map((phase, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", borderLeft: `3px solid ${phase.color}` }}>
              <p className="text-xs font-bold mb-1" style={{ color: phase.color }}>{phase.label}</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{phase.content}</p>
            </div>
          ))}

          <DetailPanel title="Key Channels & Launch Budget" icon={Globe}>
            <div className="space-y-3 mb-2">
              <div className="flex flex-wrap gap-1.5">
                {data.gtmStrategy.keyChannels.map((ch, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary-dark))", border: "1px solid hsl(var(--primary) / 0.25)" }}>{ch}</span>
                ))}
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.3)" }}>
                <p className="text-[10px] font-bold uppercase" style={{ color: "hsl(142 70% 35%)" }}>Launch Budget</p>
                <p className="text-xl font-extrabold" style={{ color: "hsl(142 70% 28%)" }}>{data.gtmStrategy.launchBudget}</p>
              </div>
            </div>
          </DetailPanel>

          {nextSlide && <NextSectionButton label={nextSlide.label} onClick={goNext} />}
        </div>
      )}

      {/* SLIDE: RISKS & METRICS */}
      {activeSlide === "risks" && (
        <div className="space-y-4">
          <SectionHeader current={6} total={SLIDE_TABS.length} label="Risks & Metrics" icon={ShieldAlert} />

          {/* Key Metrics — top 3 */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <BarChart3 size={11} /> Key Success Metrics
          </p>
          {data.keyMetrics.slice(0, 3).map((m, i) => (
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

          {/* Risks — top 2 */}
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <ShieldAlert size={11} /> Top Risks
          </p>
          {data.risks.slice(0, 2).map((r, i) => {
            const sColor = r.severity === "high" ? "hsl(var(--destructive))" : r.severity === "medium" ? "hsl(38 92% 45%)" : "hsl(142 70% 40%)";
            return (
              <div key={i} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${sColor}30` }}>
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: `${sColor}10` }}>
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

          {(data.risks.length > 2 || data.keyMetrics.length > 3) && (
            <DetailPanel title={`${Math.max(0, data.risks.length - 2)} more risks + ${Math.max(0, data.keyMetrics.length - 3)} more metrics`} icon={ShieldAlert}>
              <div className="space-y-2 mb-2">
                {data.keyMetrics.slice(3).map((m, i) => (
                  <div key={`m-${i}`} className="flex items-center justify-between p-2 rounded-lg text-xs" style={{ background: "hsl(var(--muted))" }}>
                    <span className="font-bold text-foreground">{m.metric}</span>
                    <span className="font-bold" style={{ color: "hsl(var(--primary))" }}>{m.target}</span>
                  </div>
                ))}
                {data.risks.slice(2).map((r, i) => (
                  <div key={`r-${i}`} className="p-2 rounded-lg text-xs" style={{ background: "hsl(var(--muted))" }}>
                    <p className="font-bold text-foreground">{r.risk}</p>
                    <p className="text-muted-foreground">→ {r.mitigation}</p>
                  </div>
                ))}
              </div>
            </DetailPanel>
          )}

          <AllExploredBadge />
        </div>
      )}
    </div>
  );
};

function ContactCard({ contact, accentColor }: { contact: SupplierContact; accentColor: string }) {
  return (
    <div className="p-3 rounded-lg space-y-2"
      style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", borderLeft: `3px solid ${accentColor}` }}>
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
        {contact.email && <div><p className="text-[10px] text-muted-foreground font-semibold">Email</p><a href={`mailto:${contact.email}`} className="font-medium text-blue-600 text-[11px] break-all">{contact.email}</a></div>}
        {contact.phone && <div><p className="text-[10px] text-muted-foreground font-semibold">Phone</p><a href={`tel:${contact.phone}`} className="font-medium text-blue-600 text-[11px]">{contact.phone}</a></div>}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{contact.notes}</p>
    </div>
  );
}
