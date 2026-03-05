import React, { useState } from "react";
import { PitchDeckToggle } from "@/components/PitchDeckToggle";
import { AnalysisVisualLayer } from "./AnalysisVisualLayer";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { toast } from "sonner";
import {
  Shield, Swords, Target, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, RefreshCw, Brain, TrendingUp, TrendingDown,
  BookOpen, ClipboardCheck, Eye, Zap, Flame, BarChart3, Crosshair,
} from "lucide-react";
import { InsightRating } from "./InsightRating";

import { StepLoadingTracker, STRESS_TEST_TASKS } from "@/components/StepLoadingTracker";
import { useAnalysis } from "@/contexts/AnalysisContext";

// ── Standardized analysis components ──
import {
  StepCanvas,
  InsightCard,
  FrameworkPanel,
  SignalCard,
  VisualGrid,
  ExpandableDetail,
  MetricCard,
  EvidenceCard,
  AnalysisPanel,
} from "@/components/analysis/AnalysisComponents";

/**
 * Error-safe wrapper for AnalysisVisualLayer in stress test context.
 */
class StressTestVisualWrapper extends React.Component<
  { analysis: Record<string, unknown>; governedData: Record<string, unknown> | null; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.warn("[StressTest] Visual layer error (non-fatal):", error.message); }
  render() {
    if (this.state.hasError) return <div className="space-y-4">{this.props.children}</div>;
    return (
      <AnalysisVisualLayer analysis={this.props.analysis} step="stressTest" governedOverride={this.props.governedData}>
        {this.props.children}
      </AnalysisVisualLayer>
    );
  }
}

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
  visualSpecs?: import("@/lib/visualContract").VisualSpec[];
  actionPlans?: import("@/lib/visualContract").ActionPlan[];
  competitiveLandscape?: CompetitiveLandscape;
}

interface CompetitorComparison {
  competitor: string;
  url?: string;
  originalAdvantage: string;
  originalVulnerability: string;
  redesignAdvantage: string;
  redesignGap: string;
}

interface CompetitiveLandscape {
  originalVsCompetitors: CompetitorComparison[];
  positioningRecommendation: string;
  pricingInsight?: string;
  biggestCompetitiveThreat: string;
  categoryDynamics?: string;
}

interface CriticalValidationProps {
  product: { name: string; category: string };
  analysisData: unknown;
  activeTab: "debate" | "validate";
  externalData?: unknown;
  onDataLoaded?: (data: unknown) => void;
  runTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
  competitorIntel?: unknown[];
}

const SEVERITY_MAP: Record<string, "threat" | "weakness" | "neutral"> = {
  critical: "threat", major: "weakness", minor: "neutral",
};

const STRENGTH_MAP: Record<string, "strength" | "opportunity" | "neutral"> = {
  strong: "strength", moderate: "opportunity", conditional: "neutral",
};

const OUTCOME_MAP: Record<string, "strength" | "threat" | "opportunity"> = {
  succeeded: "strength", failed: "threat", pivoted: "opportunity",
};

const STATUS_MAP: Record<string, "threat" | "weakness" | "neutral"> = {
  critical: "threat", important: "weakness", "nice-to-have": "neutral",
};

const SCORE_LABELS: Record<string, { label: string; icon: typeof Brain }> = {
  technicalFeasibility: { label: "Technical Feasibility", icon: Zap },
  marketDemand: { label: "Market Demand", icon: TrendingUp },
  competitiveAdvantage: { label: "Competitive Advantage", icon: Shield },
  executionComplexity: { label: "Execution Ease", icon: Target },
  overallViability: { label: "Overall Viability", icon: BarChart3 },
};

export const CriticalValidation = ({ product, analysisData, activeTab, externalData, onDataLoaded, runTrigger, onLoadingChange, competitorIntel }: CriticalValidationProps) => {
  const [data, setData] = useState<ValidationData | null>((externalData as ValidationData) || null);
  const [loading, setLoading] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState("");

  React.useEffect(() => { onLoadingChange?.(loading); }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const runTriggerRef = React.useRef(runTrigger ?? 0);
  React.useEffect(() => {
    if (runTrigger !== undefined && runTrigger > runTriggerRef.current && !loading) {
      runTriggerRef.current = runTrigger;
      runValidation();
    }
  }, [runTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  let geoData: unknown = undefined;
  let regulatoryData: unknown = undefined;
  let governedData: Record<string, unknown> | null = null;
  let activeBranchId: string | null = null;
  let strategicProfileRef: any = undefined;
  let adaptiveContextRef: any = undefined;
  try {
    const ctx = useAnalysis();
    geoData = ctx.geoData;
    regulatoryData = ctx.regulatoryData;
    governedData = ctx.governedData;
    activeBranchId = ctx.activeBranchId;
    strategicProfileRef = ctx.strategicProfile;
    adaptiveContextRef = ctx.adaptiveContext;
  } catch { /* context may not be available in shared view */ }

  const runValidation = async () => {
    setLoading(true);
    try {
      let activeBranch: unknown = undefined;
      if (governedData && activeBranchId) {
        const { getBranchPayload } = await import("@/lib/branchContext");
        activeBranch = getBranchPayload(governedData, activeBranchId, strategicProfileRef);
      }
      const { data: result, error } = await invokeWithTimeout("critical-validation", {
        body: { product, analysisData, userSuggestions: userSuggestions || undefined, geoData: geoData || undefined, regulatoryData: regulatoryData || undefined, activeBranch, adaptiveContext: adaptiveContextRef || undefined, competitorIntel: competitorIntel?.length ? competitorIntel : undefined },
      }, 180_000);
      if (error || !result?.success) {
        toast.error(result?.error || error?.message || "Validation failed");
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
      <StepLoadingTracker title="Running Stress Test" tasks={STRESS_TEST_TASKS} estimatedSeconds={30} accentColor="hsl(350 80% 55%)" />
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-5 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
          <Swords size={30} style={{ color: "hsl(350 80% 55%)" }} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Critical Validation</h3>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Red Team vs Green Team debate, precedents, feasibility checklist, and confidence scoring.
          </p>
        </div>
        <ExpandableDetail label="Steer the Stress Test (optional)" icon={Eye} defaultExpanded>
          <textarea
            value={userSuggestions}
            onChange={(e) => setUserSuggestions(e.target.value)}
            placeholder="e.g. Focus on pricing pressure, test subscription model, consider regulatory risks…"
            className="w-full rounded-lg px-3 py-2.5 text-sm leading-relaxed resize-none transition-colors focus:outline-none mb-2"
            rows={2}
            style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
          />
        </ExpandableDetail>
        <button
          onClick={runValidation}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-colors"
          style={{ background: "hsl(350 80% 55%)", color: "white", opacity: loading ? 0.7 : 1 }}
        >
          <Swords size={15} /> Run Critical Validation
        </button>
        <p className="text-[11px] font-bold text-muted-foreground">Requires completed Deconstruct analysis · ~20-30s</p>
      </div>
    );
  }

  // ═══ DEBATE TAB ═══
  if (activeTab === "debate") {
    const safeAnalysisForVisual: Record<string, unknown> = {
      redTeam: data.redTeam, blueTeam: data.blueTeam, blindSpots: data.blindSpots,
      strategicRecommendations: data.strategicRecommendations,
      ...(data.visualSpecs ? { visualSpecs: data.visualSpecs } : {}),
    };

    return (
      <StepCanvas>
        {/* Re-run (collapsed) */}
        <ExpandableDetail label="Refine your analysis — add direction, then Re-run" icon={Eye} defaultExpanded>
          <div className="flex items-center justify-between gap-2 mb-2">
            <textarea
              value={userSuggestions}
              onChange={(e) => setUserSuggestions(e.target.value)}
              placeholder="e.g. Focus more on regulatory risks, test pricing at $X…"
              className="flex-1 rounded-lg px-3 py-2 text-sm leading-relaxed resize-none transition-colors focus:outline-none"
              rows={2}
              style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
            <button
              onClick={runValidation}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0"
              style={{ background: "hsl(350 80% 55%)", color: "white", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Re-run
            </button>
          </div>
        </ExpandableDetail>

        {/* ═══ SPLIT ARENA: Red (left) vs Green (right) ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
          {/* ── RED TEAM ── */}
          <div className="relative" style={{ background: "hsl(0 72% 52% / 0.04)" }}>
            <div className="px-5 py-4 flex items-center gap-3" style={{ background: "hsl(0 72% 48%)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(0 0% 100% / 0.2)" }}>
                <XCircle size={18} style={{ color: "white" }} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white tracking-tight">Red Team</p>
                <p className="text-[11px] text-white/70 font-medium">Against This Idea</p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Verdict */}
              <InsightCard headline={data.redTeam.verdict} badge="VERDICT" badgeColor="hsl(0 72% 48%)" accentColor="hsl(0 72% 48%)" />

              {/* Arguments */}
              {(data.redTeam?.arguments || []).map((arg, i) => (
                <InsightCard
                  key={i}
                  headline={arg.title}
                  subtext={arg.argument.length > 100 ? arg.argument.slice(0, 100) + "…" : arg.argument}
                  badge={arg.severity.toUpperCase()}
                  badgeColor={arg.severity === "critical" ? "hsl(var(--destructive))" : arg.severity === "major" ? "hsl(38 92% 35%)" : "hsl(var(--muted-foreground))"}
                  accentColor="hsl(0 72% 48%)"
                  detail={
                    <div className="space-y-2">
                      {arg.argument.length > 100 && <p className="text-sm text-foreground/80 leading-relaxed">{arg.argument}</p>}
                      {arg.biasExposed && (
                        <p className="text-xs font-bold" style={{ color: "hsl(271 81% 45%)" }}>Bias exposed: {arg.biasExposed}</p>
                      )}
                    </div>
                  }
                  action={
                    <div className="flex items-center gap-2">
                      <InsightRating sectionId={`red-${i}`} compact />
                      <PitchDeckToggle contentKey={`stress-red-${i}`} label="Pitch" />
                    </div>
                  }
                />
              ))}

              {/* Kill Shot */}
              <InsightCard
                icon={Flame}
                headline={data.redTeam.killShot}
                badge="KILL SHOT"
                badgeColor="hsl(0 72% 48%)"
                accentColor="hsl(0 72% 48%)"
                action={<PitchDeckToggle contentKey="stress-killshot" label="Pitch" />}
              />
            </div>
          </div>

          {/* ── GREEN TEAM ── */}
          <div className="relative" style={{ background: "hsl(142 60% 45% / 0.04)", borderLeft: "1px solid hsl(var(--border))" }}>
            <div className="px-5 py-4 flex items-center gap-3" style={{ background: "hsl(142 60% 38%)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(0 0% 100% / 0.2)" }}>
                <CheckCircle2 size={18} style={{ color: "white" }} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white tracking-tight">Green Team</p>
                <p className="text-[11px] text-white/70 font-medium">For This Idea</p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Verdict */}
              <InsightCard headline={data.blueTeam.verdict} badge="VERDICT" badgeColor="hsl(142 60% 35%)" accentColor="hsl(142 60% 35%)" />

              {/* Arguments */}
              {(data.blueTeam?.arguments || []).map((arg, i) => (
                <InsightCard
                  key={i}
                  headline={arg.title}
                  subtext={arg.argument.length > 100 ? arg.argument.slice(0, 100) + "…" : arg.argument}
                  badge={arg.strength.toUpperCase()}
                  badgeColor={arg.strength === "strong" ? "hsl(142 70% 30%)" : arg.strength === "moderate" ? "hsl(var(--primary))" : "hsl(38 92% 35%)"}
                  accentColor="hsl(142 60% 35%)"
                  detail={
                    <div className="space-y-2">
                      {arg.argument.length > 100 && <p className="text-sm text-foreground/80 leading-relaxed">{arg.argument}</p>}
                      {arg.enabler && (
                        <p className="text-xs font-bold" style={{ color: "hsl(142 60% 35%)" }}>Enabler: {arg.enabler}</p>
                      )}
                    </div>
                  }
                  action={
                    <div className="flex items-center gap-2">
                      <InsightRating sectionId={`blue-${i}`} compact />
                      <PitchDeckToggle contentKey={`stress-green-${i}`} label="Pitch" />
                    </div>
                  }
                />
              ))}

              {/* Moonshot */}
              <InsightCard
                icon={Target}
                headline={data.blueTeam.moonshot}
                badge="MOONSHOT"
                badgeColor="hsl(142 60% 35%)"
                accentColor="hsl(142 60% 35%)"
                action={<PitchDeckToggle contentKey="stress-moonshot" label="Pitch" />}
              />
            </div>
          </div>
        </div>

        {/* ═══ BELOW THE ARENA: shared sections ═══ */}

        {/* ── Competitive Landscape ── */}
        {data.competitiveLandscape?.originalVsCompetitors?.length ? (
          <AnalysisPanel title="Competitive Landscape" icon={Crosshair} eyebrow="Strategy">
            <VisualGrid columns={2}>
              <InsightCard
                headline={data.competitiveLandscape.positioningRecommendation}
                badge="Positioning"
                badgeColor="hsl(var(--primary))"
                accentColor="hsl(var(--primary))"
              />
              <InsightCard
                headline={data.competitiveLandscape.biggestCompetitiveThreat}
                badge="Top Threat"
                badgeColor="hsl(var(--destructive))"
                accentColor="hsl(var(--destructive))"
              />
            </VisualGrid>

            {data.competitiveLandscape.categoryDynamics && (
              <SignalCard label={data.competitiveLandscape.categoryDynamics} type="neutral" />
            )}

            <ExpandableDetail label={`Competitor Comparisons (${data.competitiveLandscape.originalVsCompetitors.length})`} icon={Crosshair}>
              <div className="space-y-2">
                {data.competitiveLandscape.originalVsCompetitors.map((comp, i) => (
                  <InsightCard
                    key={i}
                    headline={comp.competitor}
                    badge="Competitor"
                    badgeColor="hsl(var(--primary))"
                    action={
                      <div className="flex items-center gap-2">
                        {comp.url && (
                          <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                            <ArrowRight size={8} /> Visit
                          </a>
                        )}
                        <PitchDeckToggle contentKey={`comp-landscape-${i}`} label="Pitch" />
                      </div>
                    }
                    detail={
                      <VisualGrid columns={2}>
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Original Product</p>
                          <SignalCard label={comp.originalAdvantage} type="strength" explanation="Advantage" />
                          <SignalCard label={comp.originalVulnerability} type="threat" explanation="Vulnerability" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Redesigned Concept</p>
                          <SignalCard label={comp.redesignAdvantage} type="strength" explanation="Advantage" />
                          <SignalCard label={comp.redesignGap} type="weakness" explanation="Remaining Gap" />
                        </div>
                      </VisualGrid>
                    }
                    defaultExpanded
                  />
                ))}
              </div>
            </ExpandableDetail>

            {data.competitiveLandscape.pricingInsight && (
              <InsightCard
                headline={data.competitiveLandscape.pricingInsight}
                badge="Pricing"
                badgeColor="hsl(38 92% 45%)"
                accentColor="hsl(38 92% 45%)"
                action={<PitchDeckToggle contentKey="comp-pricing-insight" label="Pitch" />}
              />
            )}
          </AnalysisPanel>
        ) : (
          !competitorIntel?.length && (
            <div className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--muted) / 0.5)", border: "1px dashed hsl(var(--border))" }}>
              <p className="text-xs text-muted-foreground">
                <Crosshair size={10} className="inline mr-1" />
                Scout competitors in the Disrupt step for deeper competitive landscape analysis here.
              </p>
            </div>
          )
        )}

        {/* Counter Examples */}
        {data.counterExamples?.length > 0 && (
          <ExpandableDetail label={`Real-World Precedents (${data.counterExamples.length})`} icon={BookOpen}>
            <VisualGrid columns={1}>
              {data.counterExamples.map((ex, i) => (
                <EvidenceCard
                  key={i}
                  statement={`${ex.name} (${ex.year}) — Lesson: ${ex.lesson}`}
                  source={ex.similarity}
                  confidence={ex.outcome === "succeeded" ? "high" : ex.outcome === "pivoted" ? "medium" : "low"}
                  detail={ex.lesson}
                />
              ))}
            </VisualGrid>
          </ExpandableDetail>
        )}

        {/* Strategic Recommendations */}
        {data.strategicRecommendations?.length ? (
          <ExpandableDetail label={`Strategic Recommendations (${data.strategicRecommendations.length})`} icon={ArrowRight}>
            <VisualGrid columns={1}>
              {data.strategicRecommendations.map((rec, i) => (
                <SignalCard key={i} label={rec} type="strength" />
              ))}
            </VisualGrid>
          </ExpandableDetail>
        ) : null}

        {/* Current Approach Assessment */}
        {data.currentApproachAssessment && (
          <ExpandableDetail label="Current Approach Assessment" icon={Shield}>
            <div className="space-y-3">
              {data.currentApproachAssessment.keepAsIs?.length > 0 && (
                <FrameworkPanel title="Keep As-Is" icon={CheckCircle2} subtitle={`${data.currentApproachAssessment.keepAsIs.length} items`}>
                  <VisualGrid columns={1}>
                    {data.currentApproachAssessment.keepAsIs.map((item, i) => (
                      <SignalCard key={i} label={item} type="strength" />
                    ))}
                  </VisualGrid>
                </FrameworkPanel>
              )}
              {data.currentApproachAssessment.fullyReinvent?.length > 0 && (
                <FrameworkPanel title="Fully Reinvent" icon={RefreshCw} subtitle={`${data.currentApproachAssessment.fullyReinvent.length} items`}>
                  <VisualGrid columns={1}>
                    {data.currentApproachAssessment.fullyReinvent.map((item, i) => (
                      <SignalCard key={i} label={item} type="threat" />
                    ))}
                  </VisualGrid>
                </FrameworkPanel>
              )}
              <InsightCard
                headline={data.currentApproachAssessment.verdict}
                badge="Verdict"
                badgeColor="hsl(var(--primary))"
                accentColor="hsl(var(--primary))"
              />
            </div>
          </ExpandableDetail>
        )}

        {/* Blind Spots */}
        {data.blindSpots?.length > 0 && (
          <ExpandableDetail label={`Blind Spots (${data.blindSpots.length})`} icon={Eye}>
            <VisualGrid columns={1}>
              {data.blindSpots.map((bs, i) => (
                <SignalCard key={i} label={bs} type="weakness" />
              ))}
            </VisualGrid>
          </ExpandableDetail>
        )}
      </StepCanvas>
    );
  }

  // ═══ VALIDATE TAB ═══
  return (
    <StepCanvas>
      {/* Confidence Scores — MetricCard grid */}
      {data.confidenceScores && (() => {
        const entries = Object.entries(data.confidenceScores);
        return (
          <>
            <VisualGrid columns={2}>
              {entries.slice(0, 3).map(([key, val]) => {
                const meta = SCORE_LABELS[key] || { label: key, icon: Brain };
                const barColor = val.score >= 7 ? "hsl(142 70% 45%)" : val.score >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";
                return (
                  <MetricCard
                    key={key}
                    label={meta.label}
                    value={`${val.score}/10`}
                    accentColor={barColor}
                    subtext={val.reasoning}
                  />
                );
              })}
            </VisualGrid>
            {entries.length > 3 && (
              <ExpandableDetail label={`${entries.length - 3} more confidence scores`} icon={BarChart3}>
                <VisualGrid columns={2}>
                  {entries.slice(3).map(([key, val]) => {
                    const meta = SCORE_LABELS[key] || { label: key, icon: Brain };
                    const barColor = val.score >= 7 ? "hsl(142 70% 45%)" : val.score >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";
                    return (
                      <MetricCard
                        key={key}
                        label={meta.label}
                        value={`${val.score}/10`}
                        accentColor={barColor}
                        subtext={val.reasoning}
                      />
                    );
                  })}
                </VisualGrid>
              </ExpandableDetail>
            )}
          </>
        );
      })()}

      {/* Feasibility Checklist — SignalCards */}
      {data.feasibilityChecklist?.length > 0 && (() => {
        const items = data.feasibilityChecklist;
        return (
          <AnalysisPanel title="Feasibility Checklist" icon={ClipboardCheck} eyebrow="Validation">
            <VisualGrid columns={1}>
              {items.slice(0, 3).map((item, i) => (
                <SignalCard
                  key={i}
                  label={item.item}
                  type={STATUS_MAP[item.status] || "neutral"}
                  explanation={item.detail}
                  detail={
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>Est. cost: {item.estimatedCost}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">{item.category}</span>
                    </div>
                  }
                />
              ))}
            </VisualGrid>
            {items.length > 3 && (
              <ExpandableDetail label={`${items.length - 3} more checklist items`} icon={ClipboardCheck}>
                <VisualGrid columns={1}>
                  {items.slice(3).map((item, i) => (
                    <SignalCard
                      key={i}
                      label={item.item}
                      type={STATUS_MAP[item.status] || "neutral"}
                      explanation={item.detail}
                      detail={
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>Est. cost: {item.estimatedCost}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">{item.category}</span>
                        </div>
                      }
                    />
                  ))}
                </VisualGrid>
              </ExpandableDetail>
            )}
          </AnalysisPanel>
        );
      })()}
    </StepCanvas>
  );
};
