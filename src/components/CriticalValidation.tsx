import { useState } from "react";
import { PitchDeckToggle } from "@/components/PitchDeckToggle";
import { StructuralVisualList, type VisualSpec } from "./StructuralVisual";
import { ActionPlanList, type ActionPlan } from "./ActionPlanCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Shield, Swords, Target, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, RefreshCw, Brain, TrendingUp, TrendingDown,
  BookOpen, ClipboardCheck, Eye, Zap, Flame, BarChart3,
} from "lucide-react";
import { InsightRating } from "./InsightRating";

import { SectionHeader, NextSectionButton, DetailPanel } from "@/components/SectionNav";
import { StepLoadingTracker, STRESS_TEST_TASKS } from "@/components/StepLoadingTracker";
import { useAnalysis } from "@/contexts/AnalysisContext";

interface RedTeamArg {
  title: string;
  argument: string;
  severity: "critical" | "major" | "minor";
  biasExposed: string;
  specificEvidence?: string;
  dataLabel?: string;
}

interface BlueTeamArg {
  title: string;
  argument: string;
  strength: "strong" | "moderate" | "conditional";
  enabler: string;
  proofPoint?: string;
  dataLabel?: string;
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
  dataLabel?: string;
}

interface ConfidenceScore {
  score: number;
  reasoning: string;
}

interface CurrentApproachAssessment {
  keepAsIs: string[];
  adaptNotReplace: string[];
  fullyReinvent: string[];
  verdict: string;
}

interface ValidationData {
  redTeam: { verdict: string; arguments: RedTeamArg[]; killShot: string };
  blueTeam: { verdict: string; arguments: BlueTeamArg[]; moonshot: string };
  counterExamples: CounterExample[];
  feasibilityChecklist: FeasibilityItem[];
  confidenceScores: Record<string, ConfidenceScore>;
  strategicRecommendations?: string[];
  currentApproachAssessment?: CurrentApproachAssessment;
  blindSpots: string[];
  visualSpecs?: VisualSpec[];
  actionPlans?: ActionPlan[];
}

interface CriticalValidationProps {
  product: { name: string; category: string };
  analysisData: unknown;
  activeTab: "debate" | "validate";
  externalData?: unknown;
  onDataLoaded?: (data: unknown) => void;
}

const SEVERITY_STYLES = {
  critical: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(var(--destructive))", label: "CRITICAL" },
  major: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(38 92% 35%)", label: "MAJOR" },
  minor: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(var(--muted-foreground))", label: "MINOR" },
};

const STRENGTH_STYLES = {
  strong: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(142 70% 30%)", label: "STRONG" },
  moderate: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(var(--primary))", label: "MODERATE" },
  conditional: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(38 92% 35%)", label: "CONDITIONAL" },
};

const OUTCOME_STYLES = {
  succeeded: { bg: "hsl(var(--muted))", text: "hsl(142 70% 30%)", icon: TrendingUp },
  failed: { bg: "hsl(var(--muted))", text: "hsl(var(--destructive))", icon: TrendingDown },
  pivoted: { bg: "hsl(var(--muted))", text: "hsl(38 92% 35%)", icon: RefreshCw },
};

const STATUS_STYLES = {
  critical: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(var(--destructive))" },
  important: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(38 92% 35%)" },
  "nice-to-have": { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(var(--muted-foreground))" },
};

const SCORE_LABELS: Record<string, { label: string; icon: typeof Brain }> = {
  technicalFeasibility: { label: "Technical Feasibility", icon: Zap },
  marketDemand: { label: "Market Demand", icon: TrendingUp },
  competitiveAdvantage: { label: "Competitive Advantage", icon: Shield },
  executionComplexity: { label: "Execution Ease", icon: Target },
  overallViability: { label: "Overall Viability", icon: BarChart3 },
};

const DEBATE_SECTIONS = [
  { id: "debate", label: "Red vs Green Debate", icon: Swords },
  { id: "validate", label: "Validate & Score", icon: CheckCircle2 },
];

export const CriticalValidation = ({ product, analysisData, activeTab, externalData, onDataLoaded }: CriticalValidationProps) => {
  const [data, setData] = useState<ValidationData | null>((externalData as ValidationData) || null);
  const [loading, setLoading] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState("");

  let geoData: unknown = undefined;
  try { geoData = useAnalysis().geoData; } catch { /* context may not be available in shared view */ }

  const runValidation = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("critical-validation", {
        body: { product, analysisData, userSuggestions: userSuggestions || undefined, geoData: geoData || undefined },
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

  if (!data && loading) {
    return (
      <StepLoadingTracker
        title="Running Stress Test"
        tasks={STRESS_TEST_TASKS}
        estimatedSeconds={30}
        accentColor="hsl(350 80% 55%)"
      />
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-5 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
          <Swords size={30} style={{ color: "hsl(350 80% 55%)" }} />
        </div>
        <div>
          <h3 className="typo-section-title mb-1">Critical Validation</h3>
          <p className="typo-card-body text-muted-foreground max-w-sm leading-relaxed">
            Red Team vs Green Team debate, precedents, feasibility checklist, and confidence scoring.
          </p>
        </div>
        <DetailPanel title="Steer the Stress Test (optional)" icon={Eye}>
          <textarea
            value={userSuggestions}
            onChange={(e) => setUserSuggestions(e.target.value)}
            placeholder="e.g. Focus on pricing pressure, test subscription model, consider regulatory risks…"
            className="w-full rounded-lg px-3 py-2.5 typo-card-body leading-relaxed resize-none transition-colors focus:outline-none mb-2"
            rows={2}
            style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
          />
        </DetailPanel>
        <button
          onClick={runValidation}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-lg typo-button-primary transition-colors"
          style={{ background: "hsl(350 80% 55%)", color: "white", opacity: loading ? 0.7 : 1 }}
        >
          <Swords size={15} /> Run Critical Validation
        </button>
        <p className="typo-card-meta text-muted-foreground">Requires completed Disrupt analysis · ~20-30s</p>
      </div>
    );
  }

  const currentTabIdx = DEBATE_SECTIONS.findIndex(s => s.id === activeTab);

  if (activeTab === "debate") {
    return (
      <div className="space-y-4">
        <SectionHeader current={1} total={2} label="Red vs Green Debate" icon={Swords} />

        {/* L1 Executive Signal — Structural Visuals & Action Plans */}
        <StructuralVisualList specs={data.visualSpecs} />
        <ActionPlanList plans={data.actionPlans} />

        <PitchDeckToggle contentKey="stressTestDebate" label="Include in Pitch Deck" />

        {/* Re-run (collapsed) */}
        <DetailPanel title="Refine your analysis — add direction, then Re-run" icon={Eye} defaultOpen>
          <div className="flex items-center justify-between gap-2 mb-2">
            <textarea
              value={userSuggestions}
              onChange={(e) => setUserSuggestions(e.target.value)}
              placeholder="e.g. Focus more on regulatory risks, test pricing at $X…"
              className="flex-1 rounded-lg px-3 py-2 typo-card-body leading-relaxed resize-none transition-colors focus:outline-none"
              rows={2}
              style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
            <button
              onClick={runValidation}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg typo-button-secondary transition-colors flex-shrink-0"
              style={{ background: "hsl(350 80% 55%)", color: "white", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Re-run
            </button>
          </div>
        </DetailPanel>

        {/* Red Team — AGAINST the idea */}
        <div className="p-4 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--destructive))" }}>
              <XCircle size={14} style={{ color: "white" }} />
            </div>
            <div>
              <p className="typo-card-eyebrow" style={{ color: "hsl(var(--destructive))" }}>Red Team — Against This Idea</p>
              <p className="typo-card-meta text-muted-foreground">Why this concept will fail</p>
            </div>
          </div>
          <p className="typo-card-body font-semibold text-foreground leading-relaxed">{data.redTeam.verdict}</p>
        </div>

        {data.redTeam.arguments.slice(0, 2).map((arg, i) => {
          const s = SEVERITY_STYLES[arg.severity] || SEVERITY_STYLES.minor;
          return (
            <div key={i} className="p-3 rounded-lg" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="flex items-center justify-between mb-1">
                <p className="typo-card-body font-bold text-foreground">{arg.title}</p>
                <span className="px-2 py-0.5 rounded-full typo-status-label" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{s.label}</span>
              </div>
              <p className="typo-card-body text-foreground/80 leading-relaxed">{arg.argument}</p>
              <InsightRating sectionId={`red-${i}`} compact />
            </div>
          );
        })}

        {data.redTeam.arguments.length > 2 && (
          <DetailPanel title={`${data.redTeam.arguments.length - 2} more Red Team arguments`} icon={XCircle}>
            <div className="space-y-3 mb-2">
              {data.redTeam.arguments.slice(2).map((arg, i) => {
                const s = SEVERITY_STYLES[arg.severity] || SEVERITY_STYLES.minor;
                return (
                  <div key={i} className="p-3 rounded-lg" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                    <p className="typo-card-body font-bold text-foreground mb-1">{arg.title}</p>
                    <p className="typo-card-body text-foreground/80 leading-relaxed">{arg.argument}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="typo-card-meta font-semibold" style={{ color: "hsl(271 81% 40%)" }}>Bias: {arg.biasExposed}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </DetailPanel>
        )}

        {/* Kill Shot */}
        <div className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <p className="typo-status-label mb-1 flex items-center gap-1" style={{ color: "hsl(var(--destructive))" }}>
            <Flame size={11} /> Kill Shot
          </p>
          <p className="typo-card-body font-bold text-foreground leading-relaxed">{data.redTeam.killShot}</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Swords size={14} style={{ color: "white" }} />
          </div>
          <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
        </div>

        {/* Green Team — FOR the idea */}
        <div className="p-4 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(142 70% 45%)" }}>
              <CheckCircle2 size={14} style={{ color: "white" }} />
            </div>
            <div>
              <p className="typo-card-eyebrow" style={{ color: "hsl(142 70% 30%)" }}>Green Team — For This Idea</p>
              <p className="typo-card-meta text-muted-foreground">Why this concept will succeed</p>
            </div>
          </div>
          <p className="typo-card-body font-semibold text-foreground leading-relaxed">{data.blueTeam.verdict}</p>
        </div>

        {data.blueTeam.arguments.slice(0, 2).map((arg, i) => {
          const s = STRENGTH_STYLES[arg.strength] || STRENGTH_STYLES.moderate;
          return (
            <div key={i} className="p-3 rounded-lg" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="flex items-center justify-between mb-1">
                <p className="typo-card-body font-bold text-foreground">{arg.title}</p>
                <span className="px-2 py-0.5 rounded-full typo-status-label" style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>{s.label}</span>
              </div>
              <p className="typo-card-body text-foreground/80 leading-relaxed">{arg.argument}</p>
              <InsightRating sectionId={`blue-${i}`} compact />
            </div>
          );
        })}

        {data.blueTeam.arguments.length > 2 && (
          <DetailPanel title={`${data.blueTeam.arguments.length - 2} more Green Team arguments`} icon={CheckCircle2}>
            <div className="space-y-3 mb-2">
              {data.blueTeam.arguments.slice(2).map((arg, i) => {
                const s = STRENGTH_STYLES[arg.strength] || STRENGTH_STYLES.moderate;
                return (
                  <div key={i} className="p-3 rounded-lg" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                    <p className="typo-card-body font-bold text-foreground mb-1">{arg.title}</p>
                    <p className="typo-card-body text-foreground/80 leading-relaxed">{arg.argument}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="typo-card-meta font-semibold" style={{ color: "hsl(var(--primary))" }}>Enabler: {arg.enabler}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </DetailPanel>
        )}

        {/* Moonshot */}
        <div className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <p className="typo-status-label mb-1 flex items-center gap-1" style={{ color: "hsl(142 70% 30%)" }}>
            <Target size={11} /> Moonshot Potential
          </p>
          <p className="typo-card-body font-bold text-foreground leading-relaxed">{data.blueTeam.moonshot}</p>
        </div>

        {/* Counter Examples — collapsed */}
        {data.counterExamples?.length > 0 && (
          <DetailPanel title={`Real-World Precedents (${data.counterExamples.length})`} icon={BookOpen}>
            <div className="space-y-2 mb-2">
              {data.counterExamples.map((ex, i) => {
                const os = OUTCOME_STYLES[ex.outcome] || OUTCOME_STYLES.pivoted;
                const OutcomeIcon = os.icon;
                return (
                  <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="typo-card-body font-bold text-foreground">{ex.name} ({ex.year})</span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full typo-status-label" style={{ background: os.bg, color: os.text }}>
                        <OutcomeIcon size={9} /> {ex.outcome}
                      </span>
                    </div>
                    <p className="typo-card-body font-semibold leading-relaxed" style={{ color: "hsl(var(--primary))" }}>Lesson: {ex.lesson}</p>
                  </div>
                );
              })}
            </div>
          </DetailPanel>
        )}

        {/* Strategic Recommendations — collapsed */}
        {data.strategicRecommendations?.length ? (
          <DetailPanel title={`Strategic Recommendations (${data.strategicRecommendations.length})`} icon={ArrowRight}>
            <div className="space-y-1.5 mb-2">
              {data.strategicRecommendations.map((rec, i) => (
                <div key={i} className="flex gap-2 items-start p-2 rounded-lg typo-card-body"
                  style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center typo-status-label flex-shrink-0"
                    style={{ background: "hsl(142 70% 45% / 0.15)", color: "hsl(142 70% 30%)" }}>{i + 1}</span>
                  <span className="text-foreground/80 leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </DetailPanel>
        ) : null}

        {/* Current Approach Assessment — collapsed */}
        {data.currentApproachAssessment && (
          <DetailPanel title="Current Approach Assessment" icon={Shield}>
            <div className="space-y-2 mb-2">
              {data.currentApproachAssessment.keepAsIs?.length > 0 && (
                <div>
                  <p className="typo-status-label mb-1 flex items-center gap-1" style={{ color: "hsl(142 70% 35%)" }}><CheckCircle2 size={10} /> Keep As-Is</p>
                  {data.currentApproachAssessment.keepAsIs.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start typo-card-body mb-1">
                      <CheckCircle2 size={10} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {data.currentApproachAssessment.fullyReinvent?.length > 0 && (
                <div>
                  <p className="typo-status-label mb-1 flex items-center gap-1" style={{ color: "hsl(var(--destructive))" }}><RefreshCw size={10} /> Fully Reinvent</p>
                  {data.currentApproachAssessment.fullyReinvent.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start typo-card-body mb-1">
                      <Flame size={10} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-foreground/80">{item}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="typo-card-meta font-bold mb-1" style={{ color: "hsl(var(--primary))" }}>Verdict</p>
                <p className="typo-card-body text-foreground/80 leading-relaxed">{data.currentApproachAssessment.verdict}</p>
              </div>
            </div>
          </DetailPanel>
        )}

        {/* Blind Spots — collapsed */}
        {data.blindSpots?.length > 0 && (
          <DetailPanel title={`Blind Spots (${data.blindSpots.length})`} icon={Eye}>
            <div className="space-y-1.5 mb-2">
              {data.blindSpots.map((bs, i) => (
                <div key={i} className="flex gap-2 items-start typo-card-body">
                  <AlertTriangle size={10} style={{ color: "hsl(38 92% 45%)", flexShrink: 0, marginTop: 2 }} />
                  <span className="text-foreground/80 leading-relaxed">{bs}</span>
                </div>
              ))}
            </div>
          </DetailPanel>
        )}
      </div>
    );
  }

  // Validate tab
  return (
    <div className="space-y-4">
      <SectionHeader current={2} total={2} label="Validate & Score" icon={CheckCircle2} />
      <PitchDeckToggle contentKey="stressTestValidation" label="Include in Pitch Deck" />

      {/* Confidence Scores — show top 3, rest in detail */}
      {data.confidenceScores && (() => {
        const entries = Object.entries(data.confidenceScores);
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {entries.slice(0, 3).map(([key, val]) => {
                const meta = SCORE_LABELS[key] || { label: key, icon: Brain };
                const Icon = meta.icon;
                const score = val.score;
                const barColor = score >= 7 ? "hsl(142 70% 45%)" : score >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";
                return (
                  <div key={key} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="typo-card-eyebrow flex items-center gap-1">
                        <Icon size={10} /> {meta.label}
                      </span>
                      <span className="typo-card-body font-black" style={{ color: barColor }}>{score}/10</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score * 10}%`, background: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {entries.length > 3 && (
              <DetailPanel title={`${entries.length - 3} more confidence scores`} icon={BarChart3}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  {entries.slice(3).map(([key, val]) => {
                    const meta = SCORE_LABELS[key] || { label: key, icon: Brain };
                    const Icon = meta.icon;
                    const score = val.score;
                    const barColor = score >= 7 ? "hsl(142 70% 45%)" : score >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";
                    return (
                      <div key={key} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="typo-card-eyebrow flex items-center gap-1">
                            <Icon size={10} /> {meta.label}
                          </span>
                          <span className="typo-card-body font-black" style={{ color: barColor }}>{score}/10</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${score * 10}%`, background: barColor }} />
                        </div>
                        <p className="typo-card-meta text-foreground/70 leading-relaxed mt-1.5">{val.reasoning}</p>
                      </div>
                    );
                  })}
                </div>
              </DetailPanel>
            )}
          </>
        );
      })()}

      {/* Feasibility Checklist — show top 3, rest collapsed */}
      {data.feasibilityChecklist?.length > 0 && (() => {
        const items = data.feasibilityChecklist;
        return (
          <>
            <p className="typo-card-eyebrow flex items-center gap-1">
              <ClipboardCheck size={11} style={{ color: "hsl(142 70% 40%)" }} /> Feasibility Checklist
            </p>
            <div className="space-y-2">
              {items.slice(0, 3).map((item, i) => {
                const s = STATUS_STYLES[item.status] || STATUS_STYLES["nice-to-have"];
                return (
                  <div key={i} className="p-3 rounded-lg" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded-full typo-status-label" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>{item.category}</span>
                        <p className="typo-card-body font-bold text-foreground">{item.item}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full typo-status-label uppercase" style={{ color: s.text }}>{item.status}</span>
                    </div>
                    <p className="typo-card-body text-foreground/70 leading-relaxed">{item.detail}</p>
                  </div>
                );
              })}
            </div>
            {items.length > 3 && (
              <DetailPanel title={`${items.length - 3} more checklist items`} icon={ClipboardCheck}>
                <div className="space-y-2 mb-2">
                  {items.slice(3).map((item, i) => {
                    const s = STATUS_STYLES[item.status] || STATUS_STYLES["nice-to-have"];
                    return (
                      <div key={i} className="p-3 rounded-lg" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="typo-card-body font-bold text-foreground">{item.item}</p>
                          <span className="px-2 py-0.5 rounded-full typo-status-label uppercase" style={{ color: s.text }}>{item.status}</span>
                        </div>
                        <p className="typo-card-body text-foreground/70 leading-relaxed">{item.detail}</p>
                        <p className="typo-card-meta font-semibold mt-1" style={{ color: "hsl(var(--primary))" }}>Est. cost: {item.estimatedCost}</p>
                      </div>
                    );
                  })}
                </div>
              </DetailPanel>
            )}
          </>
        );
      })()}
    </div>
  );
};
