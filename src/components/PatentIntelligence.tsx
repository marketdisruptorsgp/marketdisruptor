import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ScrollText, Unlock, Lock, AlertTriangle, TrendingUp, Lightbulb,
  Zap, Shield, Globe, ChevronDown, ChevronUp, ExternalLink,
  CheckCircle2, XCircle, Clock, DollarSign, Target, Rocket,
  FileSearch, Microscope, Star,
} from "lucide-react";
import type { Product } from "@/data/mockProducts";

interface PatentData {
  summary: string;
  landscapeScore: number;
  opportunityScore: number;
  thicketRisk: "low" | "medium" | "high";
  thicketRiskExplanation: string;
  keyHolders: {
    name: string;
    patentCount: number;
    dominance: "high" | "medium" | "low";
    focus: string;
    threat: string;
    opportunity: string;
  }[];
  expiredGoldmines: {
    title: string;
    originalHolder: string;
    expiredYear: number;
    whatItCovers: string;
    commercialOpportunity: string;
    estimatedValue: string;
    exampleApplication: string;
  }[];
  activeMinefield: {
    area: string;
    holder: string;
    risk: "high" | "medium";
    workaround: string;
    licenseOption: string;
  }[];
  patentGaps: {
    gap: string;
    why: string;
    opportunity: string;
    urgency: "high" | "medium" | "low";
    estimatedFilingCost: string;
  }[];
  filingTrends: {
    trend: string;
    implication: string;
    actors: string;
    timeline: string;
  }[];
  innovationAngles: {
    angle: string;
    basedOn: string;
    description: string;
    defensibility: string;
    competitiveAdvantage: string;
    investmentNeeded: string;
    marketPotential: string;
  }[];
  quickActions: string[];
  sources: { label: string; url: string }[];
}

interface Props {
  product: Product;
  onSave?: (patentData: PatentData) => void;
}

const RISK_CONFIG = {
  low: { label: "Low Risk", color: "hsl(142 70% 38%)", bg: "hsl(142 70% 38% / 0.1)", border: "hsl(142 70% 38% / 0.3)", icon: CheckCircle2 },
  medium: { label: "Medium Risk", color: "hsl(38 92% 40%)", bg: "hsl(38 92% 40% / 0.1)", border: "hsl(38 92% 40% / 0.3)", icon: AlertTriangle },
  high: { label: "High Risk", color: "hsl(0 72% 50%)", bg: "hsl(0 72% 50% / 0.1)", border: "hsl(0 72% 50% / 0.3)", icon: XCircle },
};

const URGENCY_CONFIG = {
  high: { color: "hsl(0 72% 50%)", bg: "hsl(0 72% 50% / 0.1)" },
  medium: { color: "hsl(38 92% 40%)", bg: "hsl(38 92% 40% / 0.1)" },
  low: { color: "hsl(142 70% 38%)", bg: "hsl(142 70% 38% / 0.1)" },
};

const DOMINANCE_CONFIG = {
  high: { color: "hsl(0 72% 50%)", label: "Dominant" },
  medium: { color: "hsl(38 92% 40%)", label: "Moderate" },
  low: { color: "hsl(142 70% 38%)", label: "Minor" },
};

function ScoreMeter({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{score}/10</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score * 10}%`, background: color }}
        />
      </div>
    </div>
  );
}

function ExpandableCard({
  title, subtitle, icon: Icon, iconColor, children, defaultOpen = false,
}: {
  title: string; subtitle?: string; icon: React.ElementType; iconColor: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
        style={{ background: "hsl(var(--card))" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}18` }}>
            <Icon size={15} style={{ color: iconColor }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {open && (
        <div className="p-4 border-t space-y-3" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function PatentIntelligence({ product, onSave }: Props) {
  const [patentData, setPatentData] = useState<PatentData | null>(
    // Restore persisted patent data from product if available
    (product.patentData as PatentData | null) ?? null
  );
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("patent-analysis", {
        body: {
          productName: product.name,
          category: product.category,
          era: product.era,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Patent analysis failed");
      }

      setPatentData(data.patentData);
      onSave?.(data.patentData);
      toast.success("Patent intelligence loaded & saved!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load patent data";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!patentData && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: "hsl(271 81% 55% / 0.1)", border: "1px solid hsl(271 81% 55% / 0.3)" }}
        >
          <ScrollText size={32} style={{ color: "hsl(271 81% 55%)" }} />
        </div>
        <div className="text-center max-w-md space-y-2">
          <h3 className="text-lg font-extrabold text-foreground">Patent Intelligence</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Uncover who controls the IP in this space, which patents are expired and <strong>free to use</strong>, 
            where the white space is, and how to build a defensible moat. 
            This is the layer most founders skip — don't.
          </p>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {["Expired IP goldmines", "Patent gaps", "IP moats", "Innovation angles"].map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: "hsl(271 81% 55% / 0.1)", color: "hsl(271 81% 55%)" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={runAnalysis}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
          style={{ background: "hsl(271 81% 55%)", color: "white" }}
        >
          <FileSearch size={15} />
          Run Patent Analysis
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-3 h-3 rounded-full animate-bounce"
              style={{ background: "hsl(271 81% 55%)", animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <div className="text-center space-y-1">
          <p className="font-bold text-foreground">Scanning patent databases…</p>
          <p className="text-sm text-muted-foreground">USPTO · Google Patents · Expired IP · Filing trends</p>
        </div>
        <div className="w-64 space-y-2 pt-2">
          {["Querying USPTO PatentsView API", "Scraping Google Patents via Firecrawl", "Finding expired public domain IP", "Running Gemini AI deep analysis"].map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "hsl(271 81% 55%)", animationDelay: `${i * 0.3}s` }} />
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!patentData) return null;

  const riskCfg = RISK_CONFIG[patentData.thicketRisk] || RISK_CONFIG.medium;
  const RiskIcon = riskCfg.icon;

  return (
    <div className="space-y-6">

      {/* Header scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl space-y-3" style={{ background: "hsl(271 81% 55% / 0.08)", border: "1px solid hsl(271 81% 55% / 0.25)" }}>
          <ScoreMeter label="IP Landscape Clarity" score={patentData.landscapeScore} color="hsl(271 81% 55%)" />
          <ScoreMeter label="Innovation Opportunity" score={patentData.opportunityScore} color="hsl(142 70% 38%)" />
        </div>

        <div className="p-4 rounded-xl flex flex-col gap-2" style={{ background: riskCfg.bg, border: `1px solid ${riskCfg.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: riskCfg.color }}>
            Patent Thicket Risk
          </p>
          <div className="flex items-center gap-2">
            <RiskIcon size={18} style={{ color: riskCfg.color }} />
            <span className="text-base font-extrabold" style={{ color: riskCfg.color }}>{riskCfg.label}</span>
          </div>
          <p className="text-xs leading-relaxed text-foreground/80">{patentData.thicketRiskExplanation}</p>
        </div>

        <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Strategic Summary</p>
          <p className="text-sm leading-relaxed text-foreground">{patentData.summary}</p>
        </div>
      </div>

      {/* Expired Goldmines — MOST VALUABLE */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Unlock size={15} style={{ color: "hsl(142 70% 38%)" }} />
          <h3 className="font-extrabold text-sm text-foreground">Expired IP Goldmines</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(142 70% 38%)", color: "white" }}>
            FREE TO USE
          </span>
        </div>
        <p className="text-xs text-muted-foreground">These patents have expired — the underlying technology is now <strong>public domain</strong>. Anyone can use, build on, or sell products based on them.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patentData.expiredGoldmines?.map((item, i) => (
            <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: "hsl(142 70% 38% / 0.06)", border: "1px solid hsl(142 70% 38% / 0.25)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold text-foreground">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">Originally by {item.originalHolder} · Expired {item.expiredYear}</p>
                </div>
                <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(142 70% 38%)", color: "white" }}>
                  🔓 Free
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">What's covered</p>
                  <p className="text-xs text-foreground/80">{item.whatItCovers}</p>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: "hsl(142 70% 38% / 0.12)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(142 70% 30%)" }}>
                    💰 Commercial Opportunity
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "hsl(142 70% 25%)" }}>{item.commercialOpportunity}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Example product</p>
                  <p className="text-xs text-foreground/80 italic">"{item.exampleApplication}"</p>
                </div>
                <p className="text-[10px] text-muted-foreground">If still active, this IP would cost ~{item.estimatedValue} to license — now yours for free.</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patent Gaps — White Space */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target size={15} style={{ color: "hsl(217 91% 45%)" }} />
          <h3 className="font-extrabold text-sm text-foreground">Patent White Space</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(217 91% 45%)", color: "white" }}>
            UNPROTECTED
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Areas where nobody has filed yet. First to patent wins a defensible moat.</p>
        <div className="space-y-3">
          {patentData.patentGaps?.map((gap, i) => {
            const urgCfg = URGENCY_CONFIG[gap.urgency] || URGENCY_CONFIG.medium;
            return (
              <div key={i} className="p-4 rounded-xl" style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm font-bold text-foreground">{gap.gap}</p>
                  <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: urgCfg.bg, color: urgCfg.color }}>
                    {gap.urgency === "high" ? "🔥 High" : gap.urgency === "medium" ? "⚡ Medium" : "📌 Low"} Urgency
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Why nobody's filed</p>
                    <p className="text-foreground/80">{gap.why}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Opportunity</p>
                    <p className="text-foreground/80">{gap.opportunity}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Estimated filing cost</p>
                    <p className="font-bold" style={{ color: "hsl(217 91% 45%)" }}>{gap.estimatedFilingCost}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Innovation Angles */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={15} style={{ color: "hsl(38 92% 40%)" }} />
          <h3 className="font-extrabold text-sm text-foreground">Patent-Powered Innovation Angles</h3>
        </div>
        <p className="text-xs text-muted-foreground">Bold product concepts that the patent landscape actually enables — expired IP, gaps, and workarounds combined.</p>
        <div className="space-y-4">
          {patentData.innovationAngles?.map((angle, i) => (
            <div key={i} className="p-5 rounded-xl space-y-4" style={{ background: "hsl(38 92% 40% / 0.05)", border: "1px solid hsl(38 92% 40% / 0.25)" }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-extrabold text-sm" style={{ background: "hsl(38 92% 40%)", color: "white" }}>
                  {i + 1}
                </div>
                <div>
                  <p className="font-extrabold text-base text-foreground">{angle.angle}</p>
                  <p className="text-[10px] text-muted-foreground">Based on: {angle.basedOn}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">{angle.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Defensibility</p>
                  <p className="text-xs text-foreground">{angle.defensibility}</p>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Competitive Edge</p>
                  <p className="text-xs text-foreground">{angle.competitiveAdvantage}</p>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Investment</p>
                  <p className="text-xs font-bold text-foreground">{angle.investmentNeeded}</p>
                </div>
                <div className="p-2.5 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Market Potential</p>
                  <p className="text-xs font-bold" style={{ color: "hsl(142 70% 38%)" }}>{angle.marketPotential}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable sections */}
      <div className="space-y-3">
        <ExpandableCard
          title="Active IP Minefield"
          subtitle={`${patentData.activeMinefield?.length || 0} protected areas to navigate`}
          icon={Lock}
          iconColor="hsl(0 72% 50%)"
          defaultOpen={false}
        >
          {patentData.activeMinefield?.map((item, i) => (
            <div key={i} className="p-3 rounded-lg space-y-2" style={{ background: "hsl(0 72% 50% / 0.06)", border: "1px solid hsl(0 72% 50% / 0.2)" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">{item.area}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: item.risk === "high" ? "hsl(0 72% 50% / 0.15)" : "hsl(38 92% 40% / 0.15)", color: item.risk === "high" ? "hsl(0 72% 50%)" : "hsl(38 92% 40%)" }}>
                  {item.risk === "high" ? "⚠️ High Risk" : "⚡ Med Risk"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Holder: {item.holder}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Workaround</p>
                  <p className="text-xs text-foreground/80">{item.workaround}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">License option</p>
                  <p className="text-xs text-foreground/80">{item.licenseOption}</p>
                </div>
              </div>
            </div>
          ))}
        </ExpandableCard>

        <ExpandableCard
          title="Key IP Holders"
          subtitle={`${patentData.keyHolders?.length || 0} major players in this space`}
          icon={Shield}
          iconColor="hsl(217 91% 45%)"
        >
          <div className="space-y-3">
            {patentData.keyHolders?.map((holder, i) => {
              const domCfg = DOMINANCE_CONFIG[holder.dominance] || DOMINANCE_CONFIG.medium;
              return (
                <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-foreground">{holder.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold" style={{ color: domCfg.color }}>{domCfg.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                        ~{holder.patentCount} patents
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-1">{holder.focus}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-[10px] font-semibold" style={{ color: "hsl(0 72% 50%)" }}>Threat</p>
                      <p className="text-xs text-foreground/80">{holder.threat}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold" style={{ color: "hsl(142 70% 38%)" }}>Opportunity</p>
                      <p className="text-xs text-foreground/80">{holder.opportunity}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ExpandableCard>

        <ExpandableCard
          title="Filing Trends — Where Smart Money Is Moving"
          subtitle="Current patent activity signals market direction"
          icon={TrendingUp}
          iconColor="hsl(271 81% 55%)"
        >
          {patentData.filingTrends?.map((trend, i) => (
            <div key={i} className="p-3 rounded-lg space-y-2" style={{ background: "hsl(271 81% 55% / 0.06)", border: "1px solid hsl(271 81% 55% / 0.2)" }}>
              <p className="text-xs font-bold text-foreground">{trend.trend}</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Implication</p>
                  <p className="text-xs text-foreground/80">{trend.implication}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Who's filing</p>
                  <p className="text-xs text-foreground/80">{trend.actors}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Timeline</p>
                  <p className="text-xs text-foreground/80">{trend.timeline}</p>
                </div>
              </div>
            </div>
          ))}
        </ExpandableCard>
      </div>

      {/* Quick Actions */}
      {patentData.quickActions?.length > 0 && (
        <div className="p-5 rounded-xl space-y-3" style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.3)" }}>
          <div className="flex items-center gap-2">
            <Rocket size={14} style={{ color: "hsl(var(--primary))" }} />
            <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "hsl(var(--primary))" }}>
              Patent Quick Actions — This Week
            </p>
          </div>
          <div className="space-y-2">
            {patentData.quickActions.map((action, i) => (
              <div key={i} className="flex gap-2.5 items-start p-2.5 rounded-lg" style={{ background: "hsl(var(--background))" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 mt-0.5"
                  style={{ background: "hsl(var(--primary))", color: "white" }}>
                  {i + 1}
                </span>
                <p className="text-xs text-foreground leading-relaxed">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {patentData.sources?.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Sources</p>
          <div className="flex flex-wrap gap-2">
            {patentData.sources.map((src, i) => (
              <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors hover:bg-muted"
                style={{ border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                <ExternalLink size={10} />
                {src.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Re-run button */}
      <div className="flex justify-end">
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
        >
          <Microscope size={11} />
          Re-run Analysis
        </button>
      </div>
    </div>
  );
}
