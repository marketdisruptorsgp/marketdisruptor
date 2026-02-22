import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Product } from "@/data/mockProducts";
import { downloadPitchDeckPDF } from "@/lib/pdfExport";
import {
  Presentation,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Users,
  Factory,
  Truck,
  Package,
  Globe,
  Target,
  Zap,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  ShieldAlert,
  Lightbulb,
  Store,
  Phone,
  Mail,
  ExternalLink,
  Clock,
  Star,
  AlertTriangle,
  Download,
} from "lucide-react";

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

  const handleDownloadPDF = () => {
    if (!data) return;
    downloadPitchDeckPDF(product, data);
  };


  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("generate-pitch-deck", {
        body: { product },
      });
      if (error || !result?.success) {
        const msg = result?.error || error?.message || "Generation failed";
        if (msg.includes("429") || msg.includes("Rate limit")) {
          toast.error("Rate limit hit — please wait a moment and try again.");
        } else if (msg.includes("402") || msg.includes("credits")) {
          toast.error("AI credits exhausted — add credits in Settings → Workspace → Usage.");
        } else {
          toast.error("Pitch deck generation failed: " + msg);
        }
        return;
      }
      setData(result.deck);
      onSave?.(result.deck);
      toast.success("Pitch deck generated with full investor intel!");
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "hsl(var(--primary-muted))" }}>
          <Presentation size={36} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Investor Pitch Deck</h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Generate a full investor-ready intelligence brief for <strong>{product.name}</strong> —
            including market sizing, financial models, supplier contacts, pricing strategy, and go-to-market plan.
          </p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-xl">
          {SLIDE_TABS.map(({ id, label, icon: Icon }) => (
            <div key={id} className="p-3 rounded-xl text-center" style={{ background: "hsl(var(--muted))" }}>
              <Icon size={18} className="mx-auto mb-1" style={{ color: "hsl(var(--primary))" }} />
              <p className="text-[10px] font-semibold text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
          style={{ background: "hsl(var(--primary))", color: "white", opacity: loading ? 0.7 : 1 }}>
          {loading ? (
            <><RefreshCw size={15} className="animate-spin" />Building Pitch Deck…</>
          ) : (
            <><Presentation size={15} />Generate Full Pitch Deck</>
          )}
        </button>
        <p className="text-[11px] text-muted-foreground">
          Uses Gemini 2.5 Pro · Includes supplier contacts, cost models &amp; investor highlights · ~20–40 seconds
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Presentation size={15} style={{ color: "white" }} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Investor Pitch Deck</h3>
            <p className="text-[11px] text-muted-foreground">{product.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            <Download size={11} />
            Download PDF
          </button>
          <button onClick={runAnalysis} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
            {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Regenerate
          </button>
        </div>
      </div>

      {/* Slide nav */}
      {(() => {
        const TAB_COLORS: Record<string, string> = {
          pitch: "hsl(var(--primary))",
          market: "hsl(142 70% 40%)",
          financials: "hsl(35 90% 50%)",
          suppliers: "hsl(271 81% 55%)",
          gtm: "hsl(350 80% 55%)",
          risks: "hsl(200 80% 50%)",
        };
        return (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SLIDE_TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeSlide === id;
            const color = TAB_COLORS[id] || "hsl(var(--primary))";
            return (
              <button key={id} onClick={() => setActiveSlide(id)}
                className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-bold transition-all relative"
                style={{
                  background: isActive ? color : "hsl(var(--muted))",
                  color: isActive ? "white" : "hsl(var(--foreground) / 0.7)",
                  border: isActive ? `2px solid ${color}` : "2px solid hsl(var(--border))",
                  boxShadow: isActive ? `0 4px 12px -2px ${color}50` : "none",
                  transform: isActive ? "scale(1.03)" : "scale(1)",
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isActive ? "hsl(0 0% 100% / 0.25)" : `${color}20` }}>
                  <Icon size={16} style={{ color: isActive ? "white" : color }} />
                </div>
                <span className="text-center leading-tight text-[10px]">{label}</span>
                {!isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
                )}
              </button>
            );
          })}
        </div>
        );
      })()}

      {/* SLIDE: ELEVATOR PITCH */}
      {activeSlide === "pitch" && (
        <div className="space-y-5">
          {/* Hero */}
          <div className="p-6 rounded-2xl text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)" }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
              style={{ background: "white", transform: "translate(30%, -30%)" }} />
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3 opacity-70">Elevator Pitch</p>
            <p className="text-lg font-bold leading-relaxed">{data.elevatorPitch}</p>
          </div>

          {/* Problem + Solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl space-y-2"
              style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                style={{ color: "hsl(var(--destructive))" }}>
                <AlertTriangle size={11} /> The Problem
              </p>
              <p className="text-sm leading-relaxed text-foreground/80">{data.problemStatement}</p>
            </div>
            <div className="p-5 rounded-xl space-y-2"
              style={{ background: "hsl(142 70% 45% / 0.06)", border: "1px solid hsl(142 70% 45% / 0.25)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                style={{ color: "hsl(142 70% 35%)" }}>
                <CheckCircle2 size={11} /> The Solution
              </p>
              <p className="text-sm leading-relaxed text-foreground/80">{data.solutionStatement}</p>
            </div>
          </div>

          {/* Why Now */}
          <div className="p-4 rounded-xl"
            style={{ background: "hsl(38 92% 50% / 0.08)", border: "1px solid hsl(38 92% 50% / 0.3)", borderLeft: "4px solid hsl(38 92% 50%)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1"
              style={{ color: "hsl(38 92% 35%)" }}>
              <Clock size={11} /> Why Now?
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(38 92% 25%)" }}>{data.whyNow}</p>
          </div>

          {/* Investor Highlights */}
          <div>
            <p className="section-label text-[10px] mb-3 flex items-center gap-1">
              <Star size={11} /> Investor Highlights
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.investorHighlights.map((h, i) => (
                <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs"
                  style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                  <Zap size={12} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Competitive Advantages */}
          <div>
            <p className="section-label text-[10px] mb-3 flex items-center gap-1">
              <Target size={11} /> Competitive Advantages
            </p>
            <div className="space-y-2">
              {data.competitiveAdvantages.map((adv, i) => (
                <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs"
                  style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <ArrowRight size={12} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Persona */}
          {data.customerPersona && (
            <div className="p-5 rounded-xl space-y-3"
              style={{ background: "hsl(262 83% 58% / 0.06)", border: "1px solid hsl(262 83% 58% / 0.2)" }}>
              <p className="section-label text-[10px] flex items-center gap-1" style={{ color: "hsl(262 83% 45%)" }}>
                <Users size={11} /> Ideal Customer: {data.customerPersona.name}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="font-bold text-muted-foreground mb-1">Age / Segment</p>
                  <p>{data.customerPersona.age}</p>
                </div>
                <div>
                  <p className="font-bold text-muted-foreground mb-1">Buying Behavior</p>
                  <p>{data.customerPersona.buyingBehavior}</p>
                </div>
                <div>
                  <p className="font-bold text-muted-foreground mb-1">Price Willingness</p>
                  <p className="font-semibold" style={{ color: "hsl(142 70% 35%)" }}>{data.customerPersona.willingness}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground mb-1">Pain Points</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.customerPersona.painPoints.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-[10px]"
                      style={{ background: "hsl(262 83% 58% / 0.1)", color: "hsl(262 83% 35%)" }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SLIDE: MARKET */}
      {activeSlide === "market" && data.marketOpportunity && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Addressable Market (TAM)", value: data.marketOpportunity.tam, color: "hsl(var(--primary))" },
              { label: "Serviceable Addressable Market (SAM)", value: data.marketOpportunity.sam, color: "hsl(217 91% 55%)" },
              { label: "Serviceable Obtainable Market (SOM)", value: data.marketOpportunity.som, color: "hsl(142 70% 40%)" },
            ].map((m) => (
              <div key={m.label} className="p-5 rounded-xl text-center space-y-2"
                style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-extrabold" style={{ color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl"
            style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} style={{ color: "hsl(var(--primary))" }} />
              <p className="text-xs font-bold text-foreground">Market Growth Rate</p>
            </div>
            <p className="text-xl font-extrabold" style={{ color: "hsl(var(--primary))" }}>
              {data.marketOpportunity.growthRate}
            </p>
          </div>

          <div>
            <p className="section-label text-[10px] mb-3 flex items-center gap-1">
              <BarChart3 size={11} /> Key Market Drivers
            </p>
            <div className="space-y-2">
              {data.marketOpportunity.keyDrivers.map((d, i) => (
                <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs"
                  style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                    style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                  <span className="text-foreground/80">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SLIDE: FINANCIALS */}
      {activeSlide === "financials" && data.financialModel && (
        <div className="space-y-5">
          {/* Unit Economics */}
          <div>
            <p className="section-label text-[10px] mb-3 flex items-center gap-1">
              <DollarSign size={11} /> Unit Economics
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "COGS", value: data.financialModel.unitEconomics.cogs },
                { label: "Retail Price", value: data.financialModel.unitEconomics.retailPrice },
                { label: "Gross Margin", value: data.financialModel.unitEconomics.grossMargin, highlight: true },
                { label: "Contribution Margin", value: data.financialModel.unitEconomics.contributionMargin, highlight: true },
                { label: "Payback Period", value: data.financialModel.unitEconomics.paybackPeriod },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl text-center"
                  style={{
                    background: item.highlight ? "hsl(var(--primary-muted))" : "hsl(var(--muted))",
                    border: `1px solid ${item.highlight ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}`,
                  }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-sm font-extrabold"
                    style={{ color: item.highlight ? "hsl(var(--primary-dark))" : "hsl(var(--foreground))" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Scenarios */}
          <div>
            <p className="section-label text-[10px] mb-3 flex items-center gap-1">
              <BarChart3 size={11} /> Revenue Scenarios (Year 1)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: "conservative", label: "Conservative", color: "hsl(217 91% 55%)", data: data.financialModel.scenarios.conservative },
                { key: "base", label: "Base Case", color: "hsl(var(--primary))", data: data.financialModel.scenarios.base },
                { key: "optimistic", label: "Optimistic", color: "hsl(142 70% 40%)", data: data.financialModel.scenarios.optimistic },
              ].map((s) => (
                <div key={s.key} className="p-4 rounded-xl space-y-3"
                  style={{ background: "hsl(var(--muted))", borderTop: `3px solid ${s.color}` }}>
                  <p className="text-xs font-bold" style={{ color: s.color }}>{s.label}</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Units</span>
                      <span className="font-bold">{s.data.units}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-bold" style={{ color: s.color }}>{s.data.revenue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit</span>
                      <span className="font-bold">{s.data.profit}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed border-t pt-2"
                    style={{ borderColor: "hsl(var(--border))" }}>
                    {s.data.assumptions}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy + Funding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl space-y-2"
              style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <p className="section-label text-[10px] flex items-center gap-1"><DollarSign size={10} /> Pricing Strategy</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{data.financialModel.pricingStrategy}</p>
            </div>
            <div className="p-4 rounded-xl space-y-2"
              style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <p className="section-label text-[10px] flex items-center gap-1"><BarChart3 size={10} /> Break-Even Analysis</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{data.financialModel.breakEvenAnalysis}</p>
            </div>
          </div>

          {/* Funding */}
          <div className="p-5 rounded-xl space-y-4"
            style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.25)" }}>
            <div className="flex items-center justify-between">
              <p className="section-label text-[10px] flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
                <Zap size={11} /> Funding Ask
              </p>
              <span className="text-lg font-extrabold" style={{ color: "hsl(var(--primary))" }}>
                {data.financialModel.fundingAsk}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground mb-2">Use of Funds</p>
              <div className="space-y-1">
                {data.financialModel.useOfFunds.map((u, i) => (
                  <div key={i} className="flex gap-2 items-center text-xs">
                    <CheckCircle2 size={11} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />
                    <span>{u}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t" style={{ borderColor: "hsl(var(--primary) / 0.2)" }}>
              <p className="text-[10px] font-bold text-muted-foreground mb-1">Exit Strategy</p>
              <p className="text-xs text-foreground/80">{data.financialModel.exitStrategy}</p>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE: SUPPLIERS & CONTACTS */}
      {activeSlide === "suppliers" && (
        <div className="space-y-6">
          {/* Suppliers */}
          <div>
            <p className="section-label text-[10px] mb-3 flex items-center gap-1">
              <Factory size={11} /> Manufacturer & Supplier Contacts
            </p>
            <div className="space-y-3">
              {data.supplierContacts.map((s, i) => (
                <ContactCard key={i} contact={s} accentColor="hsl(var(--primary))" />
              ))}
            </div>
          </div>

          {/* Distributors */}
          <div>
            <p className="section-label text-[10px] mb-3 flex items-center gap-1">
              <Truck size={11} /> Distributor & Logistics Contacts
            </p>
            <div className="space-y-3">
              {data.distributorContacts.map((d, i) => (
                <ContactCard key={i} contact={d} accentColor="hsl(217 91% 55%)" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SLIDE: GO-TO-MARKET */}
      {activeSlide === "gtm" && data.gtmStrategy && (
        <div className="space-y-5">
          <div className="space-y-3">
            {[
              { label: "Phase 1: Launch", content: data.gtmStrategy.phase1, color: "hsl(142 70% 45%)" },
              { label: "Phase 2: Scale", content: data.gtmStrategy.phase2, color: "hsl(var(--primary))" },
              { label: "Phase 3: Dominate", content: data.gtmStrategy.phase3, color: "hsl(38 92% 50%)" },
            ].map((phase, i) => (
              <div key={i} className="p-4 rounded-xl"
                style={{ background: "hsl(var(--muted))", borderLeft: `4px solid ${phase.color}` }}>
                <p className="text-xs font-bold mb-2" style={{ color: phase.color }}>{phase.label}</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{phase.content}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                <Globe size={11} /> Key Channels
              </p>
              <div className="flex flex-wrap gap-2">
                {data.gtmStrategy.keyChannels.map((ch, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary-dark))", border: "1px solid hsl(var(--primary) / 0.25)" }}>
                    {ch}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl text-center"
              style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.3)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(142 70% 35%)" }}>
                Launch Budget
              </p>
              <p className="text-2xl font-extrabold" style={{ color: "hsl(142 70% 28%)" }}>
                {data.gtmStrategy.launchBudget}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE: RISKS & METRICS */}
      {activeSlide === "risks" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div>
            <p className="section-label text-[10px] mb-3 flex items-center gap-1">
              <BarChart3 size={11} /> Key Success Metrics
            </p>
            <div className="space-y-2">
              {data.keyMetrics.map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-3 p-3 rounded-xl"
                  style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <div>
                    <p className="text-xs font-bold text-foreground">{m.metric}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{m.why}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold self-start whitespace-nowrap"
                    style={{ background: "hsl(var(--primary))", color: "white" }}>
                    {m.target}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div>
            <p className="section-label text-[10px] mb-3 flex items-center gap-1">
              <ShieldAlert size={11} /> Risk Matrix & Mitigations
            </p>
            <div className="space-y-3">
              {data.risks.map((r, i) => {
                const sColor = r.severity === "high"
                  ? "hsl(var(--destructive))"
                  : r.severity === "medium"
                  ? "hsl(38 92% 45%)"
                  : "hsl(142 70% 40%)";
                return (
                  <div key={i} className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${sColor}30` }}>
                    <div className="flex items-center gap-2 px-4 py-2"
                      style={{ background: `${sColor}10` }}>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        style={{ background: `${sColor}20`, color: sColor }}>
                        {r.severity}
                      </span>
                      <p className="text-xs font-bold text-foreground">{r.risk}</p>
                    </div>
                    <div className="px-4 py-3 flex gap-2 items-start"
                      style={{ background: "hsl(var(--muted))" }}>
                      <CheckCircle2 size={12} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
                      <p className="text-xs text-foreground/70 leading-relaxed">{r.mitigation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function ContactCard({ contact, accentColor }: { contact: SupplierContact; accentColor: string }) {
  return (
    <div className="p-4 rounded-xl space-y-3"
      style={{ background: "hsl(var(--muted))", border: `1px solid hsl(var(--border))`, borderLeft: `3px solid ${accentColor}` }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-foreground">{contact.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: `${accentColor}15`, color: accentColor }}>{contact.role}</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Globe size={9} /> {contact.region}
            </span>
          </div>
        </div>
        {contact.url && (
          <a href={contact.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
            style={{ background: `${accentColor}15`, color: accentColor }}>
            <ExternalLink size={10} /> Visit
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {contact.moq && (
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold">Min. Order</p>
            <p className="font-bold text-foreground">{contact.moq}</p>
          </div>
        )}
        {contact.leadTime && (
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold">Lead Time</p>
            <p className="font-bold text-foreground">{contact.leadTime}</p>
          </div>
        )}
        {contact.email && (
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5">
              <Mail size={9} /> Email
            </p>
            <a href={`mailto:${contact.email}`} className="font-medium text-blue-600 text-[11px] break-all">
              {contact.email}
            </a>
          </div>
        )}
        {contact.phone && (
          <div>
            <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-0.5">
              <Phone size={9} /> Phone
            </p>
            <a href={`tel:${contact.phone}`} className="font-medium text-blue-600 text-[11px]">
              {contact.phone}
            </a>
          </div>
        )}
      </div>

      {contact.certifications?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {contact.certifications.map((c, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}>
              {c}
            </span>
          ))}
        </div>
      ) : null}

      <p className="text-[11px] text-muted-foreground leading-relaxed">{contact.notes}</p>
    </div>
  );
}
