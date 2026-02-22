import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Shield, Swords, Target, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, RefreshCw, Brain, TrendingUp, TrendingDown,
  BookOpen, ClipboardCheck, Eye, Zap, Flame, BarChart3,
} from "lucide-react";
import { InsightRating } from "./InsightRating";

interface RedTeamArg {
  title: string;
  argument: string;
  severity: "critical" | "major" | "minor";
  biasExposed: string;
  specificEvidence?: string;
}

interface BlueTeamArg {
  title: string;
  argument: string;
  strength: "strong" | "moderate" | "conditional";
  enabler: string;
  proofPoint?: string;
}

interface CounterExample {
  name: string;
  outcome: "succeeded" | "failed" | "pivoted";
  similarity: string;
  lesson: string;
  year: string;
  revenue?: string;
}

interface FeasibilityItem {
  category: string;
  item: string;
  status: "critical" | "important" | "nice-to-have";
  detail: string;
  estimatedCost: string;
}

interface ConfidenceScore {
  score: number;
  reasoning: string;
}

interface ValidationData {
  redTeam: { verdict: string; arguments: RedTeamArg[]; killShot: string };
  blueTeam: { verdict: string; arguments: BlueTeamArg[]; moonshot: string };
  counterExamples: CounterExample[];
  feasibilityChecklist: FeasibilityItem[];
  confidenceScores: Record<string, ConfidenceScore>;
  strategicRecommendations?: string[];
  blindSpots: string[];
}

interface CriticalValidationProps {
  product: { name: string; category: string };
  analysisData: unknown;
  activeTab: "debate" | "validate";
  externalData?: unknown;
  onDataLoaded?: (data: unknown) => void;
}

const SEVERITY_STYLES = {
  critical: { bg: "hsl(var(--destructive) / 0.08)", border: "hsl(var(--destructive) / 0.3)", text: "hsl(var(--destructive))", label: "CRITICAL" },
  major: { bg: "hsl(38 92% 50% / 0.08)", border: "hsl(38 92% 50% / 0.3)", text: "hsl(38 92% 35%)", label: "MAJOR" },
  minor: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(var(--muted-foreground))", label: "MINOR" },
};

const STRENGTH_STYLES = {
  strong: { bg: "hsl(142 70% 45% / 0.08)", border: "hsl(142 70% 45% / 0.3)", text: "hsl(142 70% 30%)", label: "STRONG" },
  moderate: { bg: "hsl(var(--primary-muted))", border: "hsl(var(--primary) / 0.3)", text: "hsl(var(--primary))", label: "MODERATE" },
  conditional: { bg: "hsl(38 92% 50% / 0.08)", border: "hsl(38 92% 50% / 0.3)", text: "hsl(38 92% 35%)", label: "CONDITIONAL" },
};

const OUTCOME_STYLES = {
  succeeded: { bg: "hsl(142 70% 45% / 0.1)", text: "hsl(142 70% 30%)", icon: TrendingUp },
  failed: { bg: "hsl(var(--destructive) / 0.1)", text: "hsl(var(--destructive))", icon: TrendingDown },
  pivoted: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 35%)", icon: RefreshCw },
};

const STATUS_STYLES = {
  critical: { bg: "hsl(var(--destructive) / 0.08)", border: "hsl(var(--destructive) / 0.25)", text: "hsl(var(--destructive))" },
  important: { bg: "hsl(38 92% 50% / 0.08)", border: "hsl(38 92% 50% / 0.25)", text: "hsl(38 92% 35%)" },
  "nice-to-have": { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(var(--muted-foreground))" },
};

const SCORE_LABELS: Record<string, { label: string; icon: typeof Brain }> = {
  technicalFeasibility: { label: "Technical Feasibility", icon: Zap },
  marketDemand: { label: "Market Demand", icon: TrendingUp },
  competitiveAdvantage: { label: "Competitive Advantage", icon: Shield },
  executionComplexity: { label: "Execution Ease", icon: Target },
  overallViability: { label: "Overall Viability", icon: BarChart3 },
};

export const CriticalValidation = ({ product, analysisData, activeTab, externalData, onDataLoaded }: CriticalValidationProps) => {
  const [data, setData] = useState<ValidationData | null>((externalData as ValidationData) || null);
  const [loading, setLoading] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("critical-validation", {
        body: { product, analysisData },
      });
      if (error || !result?.success) {
        const msg = result?.error || error?.message || "Validation failed";
        toast.error(msg);
      } else {
        setData(result.validation);
        onDataLoaded?.(result.validation);
        toast.success("Critical validation complete!");
      }
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-5 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(350 80% 55% / 0.12)" }}>
          <Swords size={30} style={{ color: "hsl(350 80% 55%)" }} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Critical Validation</h3>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            Stress-test your concept with Red Team/Blue Team debate, real-world counter-examples, feasibility checklist, and confidence scoring.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-md">
          {[
            { icon: Swords, label: "Red vs Blue" },
            { icon: BookOpen, label: "Precedents" },
            { icon: ClipboardCheck, label: "Feasibility" },
            { icon: BarChart3, label: "Confidence" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="p-2.5 rounded-xl text-center" style={{ background: "hsl(var(--muted))" }}>
              <Icon size={16} className="mx-auto mb-1" style={{ color: "hsl(350 80% 55%)" }} />
              <p className="text-[9px] font-semibold text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={runValidation}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
          style={{ background: "hsl(350 80% 55%)", color: "white", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <><RefreshCw size={15} className="animate-spin" /> Stress-testing concept…</>
          ) : (
            <><Swords size={15} /> Run Critical Validation</>
          )}
        </button>
        <p className="text-[10px] text-muted-foreground">Requires completed Disrupt analysis · ~20-30s</p>
      </div>
    );
  }

  if (activeTab === "debate") {
    return (
      <div className="space-y-6">
        {/* Red Team */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl" style={{ background: "hsl(var(--destructive) / 0.06)", borderLeft: "4px solid hsl(var(--destructive))" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--destructive) / 0.15)" }}>
                <XCircle size={14} style={{ color: "hsl(var(--destructive))" }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--destructive))" }}>Red Team — Why This Fails</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground leading-relaxed">{data.redTeam.verdict}</p>
          </div>

          <div className="space-y-3">
            {data.redTeam.arguments.map((arg, i) => {
              const s = SEVERITY_STYLES[arg.severity] || SEVERITY_STYLES.minor;
              return (
                <div key={i} className="p-4 rounded-xl" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-foreground">{arg.title}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                        {s.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed mb-2">{arg.argument}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Brain size={10} style={{ color: "hsl(271 81% 50%)" }} />
                      <span className="text-[10px] font-semibold" style={{ color: "hsl(271 81% 40%)" }}>Bias: {arg.biasExposed}</span>
                    </div>
                    {arg.specificEvidence && (
                      <span className="text-[10px] text-foreground/60 italic">📊 {arg.specificEvidence}</span>
                    )}
                  </div>
                  <InsightRating sectionId={`red-${i}`} compact />
                </div>
              );
            })}
          </div>

          {/* Kill Shot */}
          <div className="p-4 rounded-xl" style={{ background: "hsl(var(--destructive) / 0.1)", border: "2px solid hsl(var(--destructive) / 0.3)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: "hsl(var(--destructive))" }}>
              <Flame size={11} /> Kill Shot
            </p>
            <p className="text-sm font-bold text-foreground leading-relaxed">{data.redTeam.killShot}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--primary))", boxShadow: "0 4px 12px -2px hsl(var(--primary) / 0.4)" }}>
            <Swords size={16} style={{ color: "white" }} />
          </div>
          <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
        </div>

        {/* Blue Team */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl" style={{ background: "hsl(142 70% 45% / 0.06)", borderLeft: "4px solid hsl(142 70% 45%)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(142 70% 45% / 0.15)" }}>
                <CheckCircle2 size={14} style={{ color: "hsl(142 70% 40%)" }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(142 70% 30%)" }}>Blue Team — Why This Wins</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground leading-relaxed">{data.blueTeam.verdict}</p>
          </div>

          <div className="space-y-3">
            {data.blueTeam.arguments.map((arg, i) => {
              const s = STRENGTH_STYLES[arg.strength] || STRENGTH_STYLES.moderate;
              return (
                <div key={i} className="p-4 rounded-xl" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-foreground">{arg.title}</p>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                      {s.label}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed mb-2">{arg.argument}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Zap size={10} style={{ color: "hsl(var(--primary))" }} />
                      <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--primary))" }}>Enabler: {arg.enabler}</span>
                    </div>
                    {arg.proofPoint && (
                      <span className="text-[10px] text-foreground/60 italic">✅ {arg.proofPoint}</span>
                    )}
                  </div>
                  <InsightRating sectionId={`blue-${i}`} compact />
                </div>
              );
            })}
          </div>

          {/* Moonshot */}
          <div className="p-4 rounded-xl" style={{ background: "hsl(142 70% 45% / 0.1)", border: "2px solid hsl(142 70% 45% / 0.3)" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: "hsl(142 70% 30%)" }}>
              <Target size={11} /> Moonshot Potential
            </p>
            <p className="text-sm font-bold text-foreground leading-relaxed">{data.blueTeam.moonshot}</p>
          </div>
        </div>

        {/* Counter Examples */}
        {data.counterExamples?.length > 0 && (
          <div className="space-y-3">
            <p className="section-label text-[10px] flex items-center gap-1">
              <BookOpen size={11} style={{ color: "hsl(var(--primary))" }} /> Real-World Precedents
            </p>
            <div className="space-y-2">
              {data.counterExamples.map((ex, i) => {
                const os = OUTCOME_STYLES[ex.outcome] || OUTCOME_STYLES.pivoted;
                const OutcomeIcon = os.icon;
                return (
                  <div key={i} className="p-4 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{ex.name}</span>
                        <span className="text-[9px] text-muted-foreground">({ex.year})</span>
                      </div>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ background: os.bg, color: os.text }}>
                        <OutcomeIcon size={9} /> {ex.outcome}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/70 leading-relaxed mb-1">{ex.similarity}</p>
                    <p className="text-xs font-semibold leading-relaxed" style={{ color: "hsl(var(--primary))" }}>
                      Lesson: {ex.lesson}
                    </p>
                    {ex.revenue && (
                      <p className="text-[10px] text-muted-foreground mt-1">📈 {ex.revenue}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Strategic Recommendations */}
        {data.strategicRecommendations?.length ? (
          <div className="space-y-2">
            <p className="section-label text-[10px] flex items-center gap-1">
              <ArrowRight size={11} style={{ color: "hsl(142 70% 40%)" }} /> Strategic Recommendations
            </p>
            {data.strategicRecommendations.map((rec, i) => (
              <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs"
                style={{ background: "hsl(142 70% 45% / 0.06)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                  style={{ background: "hsl(142 70% 45% / 0.15)", color: "hsl(142 70% 30%)" }}>{i + 1}</span>
                <span className="text-foreground/80 leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        ) : null}

        {/* Blind Spots */}
        {data.blindSpots?.length > 0 && (
          <div className="space-y-2">
            <p className="section-label text-[10px] flex items-center gap-1">
              <Eye size={11} style={{ color: "hsl(38 92% 50%)" }} /> Blind Spots the Analysis Missed
            </p>
            {data.blindSpots.map((bs, i) => (
              <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs"
                style={{ background: "hsl(38 92% 50% / 0.07)", border: "1px solid hsl(38 92% 50% / 0.2)" }}>
                <AlertTriangle size={11} style={{ color: "hsl(38 92% 45%)", flexShrink: 0, marginTop: 1 }} />
                <span className="text-foreground/80 leading-relaxed">{bs}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Validate tab
  return (
    <div className="space-y-6">
      {/* Confidence Scores */}
      {data.confidenceScores && (
        <div className="space-y-3">
          <p className="section-label text-[10px] flex items-center gap-1">
            <BarChart3 size={11} style={{ color: "hsl(var(--primary))" }} /> Confidence Scores
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(data.confidenceScores).map(([key, val]) => {
              const meta = SCORE_LABELS[key] || { label: key, icon: Brain };
              const Icon = meta.icon;
              const score = val.score;
              const barColor = score >= 7 ? "hsl(142 70% 45%)" : score >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";
              return (
                <div key={key} className="p-4 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Icon size={10} /> {meta.label}
                    </span>
                    <span className="text-sm font-black" style={{ color: barColor }}>{score}/10</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "hsl(var(--muted))" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${score * 10}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)` }} />
                  </div>
                  <p className="text-[10px] text-foreground/70 leading-relaxed">{val.reasoning}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feasibility Checklist */}
      {data.feasibilityChecklist?.length > 0 && (
        <div className="space-y-3">
          <p className="section-label text-[10px] flex items-center gap-1">
            <ClipboardCheck size={11} style={{ color: "hsl(142 70% 40%)" }} /> Feasibility Checklist
          </p>
          <div className="space-y-2">
            {data.feasibilityChecklist.map((item, i) => {
              const s = STATUS_STYLES[item.status] || STATUS_STYLES["nice-to-have"];
              return (
                <div key={i} className="p-4 rounded-xl" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                        {item.category}
                      </span>
                      <p className="text-xs font-bold text-foreground">{item.item}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                      style={{ color: s.text, background: s.bg, border: `1px solid ${s.border}` }}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed mb-1">{item.detail}</p>
                  <p className="text-[10px] font-semibold" style={{ color: "hsl(var(--primary))" }}>
                    Est. cost: {item.estimatedCost}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
