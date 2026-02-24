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
import { InsightRating } from "./InsightRating";
import { DetailPanel } from "@/components/SectionNav";

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
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{score}/10</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score * 10}%`, background: color }} />
      </div>
    </div>
  );
}

export function PatentIntelligence({ product, onSave }: Props) {
  const [patentData, setPatentData] = useState<PatentData | null>(
    (product.patentData as PatentData | null) ?? null
  );
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("patent-analysis", {
        body: { productName: product.name, category: product.category, era: product.era },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || "Patent analysis failed");
      setPatentData(data.patentData);
      onSave?.(data.patentData);
      toast.success("Patent intelligence loaded & saved!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load patent data");
    } finally {
      setLoading(false);
    }
  };

  if (!patentData && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(271 81% 55% / 0.1)", border: "1px solid hsl(271 81% 55% / 0.3)" }}>
          <ScrollText size={28} style={{ color: "hsl(271 81% 55%)" }} />
        </div>
        <div className="text-center max-w-sm space-y-1.5">
          <h3 className="text-base font-extrabold text-foreground">Patent Intelligence</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Find expired IP goldmines, patent gaps, and innovation angles in this space.
          </p>
        </div>
        <button onClick={runAnalysis} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: "hsl(271 81% 55%)", color: "white" }}>
          <FileSearch size={14} /> Run Patent Analysis
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-3 h-3 rounded-full animate-bounce" style={{ background: "hsl(271 81% 55%)", animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <p className="font-bold text-foreground text-sm">Scanning patent databases…</p>
        <p className="text-xs text-muted-foreground">USPTO · Google Patents · Expired IP</p>
      </div>
    );
  }

  if (!patentData) return null;

  const riskCfg = RISK_CONFIG[patentData.thicketRisk] || RISK_CONFIG.medium;
  const RiskIcon = riskCfg.icon;

  return (
    <div className="space-y-4">
      {/* Scorecards — concise top-level */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl space-y-2" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <ScoreMeter label="IP Landscape Clarity" score={patentData.landscapeScore} color="hsl(271 81% 55%)" />
          <ScoreMeter label="Innovation Opportunity" score={patentData.opportunityScore} color="hsl(142 70% 38%)" />
        </div>
        <div className="p-3 rounded-xl flex flex-col gap-1.5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Patent Thicket Risk</p>
          <div className="flex items-center gap-2">
            <RiskIcon size={16} style={{ color: riskCfg.color }} />
            <span className="text-sm font-extrabold" style={{ color: riskCfg.color }}>{riskCfg.label}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-foreground/80 line-clamp-2">{patentData.thicketRiskExplanation}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Summary</p>
          <p className="text-xs leading-relaxed text-foreground line-clamp-4">{patentData.summary}</p>
        </div>
      </div>

      {/* Expired Goldmines — top 2, rest in expand */}
      {patentData.expiredGoldmines?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Unlock size={14} style={{ color: "hsl(142 70% 38%)" }} />
            <h3 className="font-extrabold text-sm text-foreground">Expired IP Goldmines</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(142 70% 38%)", color: "white" }}>FREE</span>
          </div>
          {patentData.expiredGoldmines.slice(0, 2).map((item, i) => (
            <div key={i} className="p-3 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderLeft: "3px solid hsl(142 70% 38%)" }}>
              <p className="text-xs font-extrabold text-foreground">{item.title}</p>
              <p className="text-[10px] text-muted-foreground mb-1">By {item.originalHolder} · Expired {item.expiredYear}</p>
              <p className="text-xs text-foreground/80 line-clamp-2">{item.commercialOpportunity}</p>
              <InsightRating sectionId={`patent-goldmine-${i}`} compact />
            </div>
          ))}
          {patentData.expiredGoldmines.length > 2 && (
            <DetailPanel title={`${patentData.expiredGoldmines.length - 2} more expired patents`} icon={Unlock}>
              <div className="space-y-2 mb-2">
                {patentData.expiredGoldmines.slice(2).map((item, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                    <p className="text-xs font-bold text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">By {item.originalHolder} · Expired {item.expiredYear}</p>
                    <p className="text-xs text-foreground/80 mt-1">{item.whatItCovers}</p>
                    <p className="text-xs mt-1" style={{ color: "hsl(142 70% 30%)" }}>{item.commercialOpportunity}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Example: "{item.exampleApplication}" · Value: ~{item.estimatedValue}</p>
                  </div>
                ))}
              </div>
            </DetailPanel>
          )}
        </div>
      )}

      {/* Patent Gaps — top 2, rest in expand */}
      {patentData.patentGaps?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target size={14} style={{ color: "hsl(217 91% 45%)" }} />
            <h3 className="font-extrabold text-sm text-foreground">Patent White Space</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(217 91% 45%)", color: "white" }}>UNPROTECTED</span>
          </div>
          {patentData.patentGaps.slice(0, 2).map((gap, i) => {
            const urgCfg = URGENCY_CONFIG[gap.urgency] || URGENCY_CONFIG.medium;
            return (
              <div key={i} className="p-3 rounded-xl" style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-bold text-foreground">{gap.gap}</p>
                  <span className="flex-shrink-0 text-[10px] font-bold" style={{ color: urgCfg.color }}>
                    {gap.urgency.charAt(0).toUpperCase() + gap.urgency.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-foreground/80">{gap.opportunity}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Filing cost: {gap.estimatedFilingCost}</p>
              </div>
            );
          })}
          {patentData.patentGaps.length > 2 && (
            <DetailPanel title={`${patentData.patentGaps.length - 2} more patent gaps`} icon={Target}>
              <div className="space-y-2 mb-2">
                {patentData.patentGaps.slice(2).map((gap, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ border: "1px solid hsl(var(--border))" }}>
                    <p className="text-xs font-bold text-foreground">{gap.gap}</p>
                    <p className="text-xs text-foreground/80 mt-1">{gap.why}</p>
                    <p className="text-xs text-foreground/80 mt-1">{gap.opportunity}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Cost: {gap.estimatedFilingCost}</p>
                  </div>
                ))}
              </div>
            </DetailPanel>
          )}
        </div>
      )}

      {/* Innovation Angles — top 1, rest in expand */}
      {patentData.innovationAngles?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: "hsl(38 92% 40%)" }} />
            <h3 className="font-extrabold text-sm text-foreground">Innovation Angles</h3>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-xs font-extrabold text-foreground">{patentData.innovationAngles[0].angle}</p>
            <p className="text-[10px] text-muted-foreground">Based on: {patentData.innovationAngles[0].basedOn}</p>
            <p className="text-xs text-foreground/80 mt-1 line-clamp-2">{patentData.innovationAngles[0].description}</p>
            <InsightRating sectionId="patent-angle-0" compact />
          </div>
          {patentData.innovationAngles.length > 1 && (
            <DetailPanel title={`${patentData.innovationAngles.length - 1} more innovation angles`} icon={Zap}>
              <div className="space-y-3 mb-2">
                {patentData.innovationAngles.slice(1).map((angle, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                    <p className="text-xs font-bold text-foreground">{angle.angle}</p>
                    <p className="text-[10px] text-muted-foreground">Based on: {angle.basedOn}</p>
                    <p className="text-xs text-foreground/80 mt-1">{angle.description}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div><p className="text-[10px] font-bold text-muted-foreground">Defensibility</p><p className="text-xs text-foreground">{angle.defensibility}</p></div>
                      <div><p className="text-[10px] font-bold text-muted-foreground">Market</p><p className="text-xs" style={{ color: "hsl(142 70% 38%)" }}>{angle.marketPotential}</p></div>
                    </div>
                    <InsightRating sectionId={`patent-angle-${i + 1}`} compact />
                  </div>
                ))}
              </div>
            </DetailPanel>
          )}
        </div>
      )}

      {/* Secondary sections — all collapsed */}
      <DetailPanel title={`Active IP Minefield (${patentData.activeMinefield?.length || 0})`} icon={Lock} defaultOpen>
        <div className="space-y-2 mb-2">
          {patentData.activeMinefield?.map((item, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-foreground">{item.area}</p>
                <span className="text-[10px] font-bold" style={{ color: item.risk === "high" ? "hsl(0 72% 50%)" : "hsl(38 92% 40%)" }}>
                  {item.risk === "high" ? "High" : "Medium"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Holder: {item.holder}</p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div><p className="text-[10px] font-semibold text-muted-foreground">Workaround</p><p className="text-xs text-foreground/80">{item.workaround}</p></div>
                <div><p className="text-[10px] font-semibold text-muted-foreground">License</p><p className="text-xs text-foreground/80">{item.licenseOption}</p></div>
              </div>
            </div>
          ))}
        </div>
      </DetailPanel>

      <DetailPanel title={`Key IP Holders (${patentData.keyHolders?.length || 0})`} icon={Shield}>
        <div className="space-y-2 mb-2">
          {patentData.keyHolders?.map((holder, i) => {
            const domCfg = DOMINANCE_CONFIG[holder.dominance] || DOMINANCE_CONFIG.medium;
            return (
              <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-foreground">{holder.name}</p>
                  <span className="text-[10px] font-semibold" style={{ color: domCfg.color }}>{domCfg.label} · ~{holder.patentCount} patents</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{holder.focus}</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div><p className="text-[10px] font-semibold" style={{ color: "hsl(0 72% 50%)" }}>Threat</p><p className="text-xs text-foreground/80">{holder.threat}</p></div>
                  <div><p className="text-[10px] font-semibold" style={{ color: "hsl(142 70% 38%)" }}>Opportunity</p><p className="text-xs text-foreground/80">{holder.opportunity}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </DetailPanel>

      <DetailPanel title={`Filing Trends (${patentData.filingTrends?.length || 0})`} icon={TrendingUp}>
        <div className="space-y-2 mb-2">
          {patentData.filingTrends?.map((trend, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-xs font-bold text-foreground">{trend.trend}</p>
              <p className="text-xs text-foreground/80 mt-1">{trend.implication}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Actors: {trend.actors} · Timeline: {trend.timeline}</p>
            </div>
          ))}
        </div>
      </DetailPanel>

      {/* Quick Actions — concise */}
      {patentData.quickActions?.length > 0 && (
        <div className="p-4 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-[10px] font-extrabold uppercase tracking-wider mb-2" style={{ color: "hsl(var(--primary))" }}>
            <Rocket size={11} className="inline mr-1" /> Quick Actions
          </p>
          <div className="space-y-1.5">
            {patentData.quickActions.slice(0, 3).map((action, i) => (
              <div key={i} className="flex gap-2 items-start text-xs">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                <span className="text-foreground/80">{action}</span>
              </div>
            ))}
          </div>
          {patentData.quickActions.length > 3 && (
            <DetailPanel title={`${patentData.quickActions.length - 3} more actions`} icon={Rocket}>
              <div className="space-y-1.5 mb-2">
                {patentData.quickActions.slice(3).map((action, i) => (
                  <div key={i} className="flex gap-2 items-start text-xs">
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 4}</span>
                    <span className="text-foreground/80">{action}</span>
                  </div>
                ))}
              </div>
            </DetailPanel>
          )}
        </div>
      )}

      {/* Sources + Re-run */}
      <div className="flex items-center justify-between">
        {patentData.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {patentData.sources.slice(0, 3).map((src, i) => (
              <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium" style={{ border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                <ExternalLink size={9} /> {src.label}
              </a>
            ))}
          </div>
        )}
        <button onClick={runAnalysis} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
          <Microscope size={11} /> Re-run
        </button>
      </div>
    </div>
  );
}
