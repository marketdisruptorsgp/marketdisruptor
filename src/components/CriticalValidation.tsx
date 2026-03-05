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

import { SectionHeader, NextSectionButton, DetailPanel } from "@/components/SectionNav";
import { StepLoadingTracker, STRESS_TEST_TASKS } from "@/components/StepLoadingTracker";
import { useAnalysis } from "@/contexts/AnalysisContext";

/**
 * Error-safe wrapper for AnalysisVisualLayer in stress test context.
 * Stress test data has a different shape than product data,
 * so we catch rendering errors gracefully.
 */
class StressTestVisualWrapper extends React.Component<
  { analysis: Record<string, unknown>; governedData: Record<string, unknown> | null; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.warn("[StressTest] Visual layer error (non-fatal):", error.message); }
  render() {
    if (this.state.hasError) {
      // Render children without visual layer on error
      return <div className="space-y-4">{this.props.children}</div>;
    }
    // Use the already-imported AnalysisVisualLayer
    return (
      <AnalysisVisualLayer
        analysis={this.props.analysis}
        step="stressTest"
        governedOverride={this.props.governedData}
      >
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

export const CriticalValidation = ({ product, analysisData, activeTab, externalData, onDataLoaded, runTrigger, onLoadingChange, competitorIntel }: CriticalValidationProps) => {
  const [data, setData] = useState<ValidationData | null>((externalData as ValidationData) || null);
  const [loading, setLoading] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState("");

  // Expose loading to parent
  React.useEffect(() => { onLoadingChange?.(loading); }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parent-triggered re-run via runTrigger counter
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
      // Build branch-isolated payload if active
      let activeBranch: unknown = undefined;
      if (governedData && activeBranchId) {
        const { getBranchPayload } = await import("@/lib/branchContext");
        activeBranch = getBranchPayload(governedData, activeBranchId, strategicProfileRef);
      }
      const { data: result, error } = await invokeWithTimeout("critical-validation", {
        body: { product, analysisData, userSuggestions: userSuggestions || undefined, geoData: geoData || undefined, regulatoryData: regulatoryData || undefined, activeBranch, adaptiveContext: adaptiveContextRef || undefined, competitorIntel: competitorIntel?.length ? competitorIntel : undefined },
      }, 180_000);
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
        <p className="typo-card-meta text-muted-foreground">Requires completed Deconstruct analysis · ~20-30s</p>
      </div>
    );
  }

  const currentTabIdx = DEBATE_SECTIONS.findIndex(s => s.id === activeTab);

  if (activeTab === "debate") {
    // Build a safe analysis object for the visual layer — stress test data shape differs from product data
    const safeAnalysisForVisual: Record<string, unknown> = {
      redTeam: data.redTeam,
      blueTeam: data.blueTeam,
      blindSpots: data.blindSpots,
      strategicRecommendations: data.strategicRecommendations,
      ...(data.visualSpecs ? { visualSpecs: data.visualSpecs } : {}),
    };

    return (
      <div className="space-y-4">
        <SectionHeader current={1} total={2} label="Red vs Green Debate" icon={Swords} />

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

        {/* ═══ SPLIT ARENA: Red (left) vs Green (right) ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
          {/* ── RED TEAM (left) ── */}
          <div className="relative" style={{ background: "hsl(0 72% 52% / 0.04)" }}>
            {/* Red header band */}
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
              <div className="rounded-xl p-3.5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(0 72% 52% / 0.15)" }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: "hsl(0 72% 48%)" }}>Verdict</p>
                <p className="text-sm text-foreground leading-relaxed">{data.redTeam.verdict}</p>
              </div>

              {/* Arguments */}
              {(data.redTeam?.arguments || []).map((arg, i) => {
                const s = SEVERITY_STYLES[arg.severity] || SEVERITY_STYLES.minor;
                return (
                  <div key={i} className="rounded-xl p-3.5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-bold text-foreground">{arg.title}</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: `${s.text}15`, color: s.text }}>{s.label}</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{arg.argument}</p>
                    {arg.biasExposed && (
                      <p className="text-[11px] mt-1.5 font-medium" style={{ color: "hsl(271 81% 45%)" }}>Bias: {arg.biasExposed}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <InsightRating sectionId={`red-${i}`} compact />
                      <PitchDeckToggle contentKey={`stress-red-${i}`} label="Include in Pitch" />
                    </div>
                  </div>
                );
              })}

              {/* Kill Shot */}
              <div className="rounded-xl p-3.5" style={{ background: "hsl(0 72% 52% / 0.06)", border: "1px solid hsl(0 72% 52% / 0.18)" }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: "hsl(0 72% 48%)" }}>
                  <Flame size={11} /> Kill Shot
                </p>
                <p className="text-sm font-semibold text-foreground leading-relaxed">{data.redTeam.killShot}</p>
                <div className="flex justify-end mt-2">
                  <PitchDeckToggle contentKey="stress-killshot" label="Include in Pitch" />
                </div>
              </div>
            </div>
          </div>

          {/* ── CENTER VS DIVIDER (visible on md+) ── */}
          {/* The grid gap=0 + border between cells creates natural division */}

          {/* ── GREEN TEAM (right) ── */}
          <div className="relative" style={{ background: "hsl(142 60% 45% / 0.04)", borderLeft: "1px solid hsl(var(--border))" }}>
            {/* Green header band */}
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
              <div className="rounded-xl p-3.5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(142 60% 45% / 0.15)" }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: "hsl(142 60% 35%)" }}>Verdict</p>
                <p className="text-sm text-foreground leading-relaxed">{data.blueTeam.verdict}</p>
              </div>

              {/* Arguments */}
              {(data.blueTeam?.arguments || []).map((arg, i) => {
                const s = STRENGTH_STYLES[arg.strength] || STRENGTH_STYLES.moderate;
                return (
                  <div key={i} className="rounded-xl p-3.5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-bold text-foreground">{arg.title}</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: `${s.text}15`, color: s.text }}>{s.label}</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{arg.argument}</p>
                    {arg.enabler && (
                      <p className="text-[11px] mt-1.5 font-medium" style={{ color: "hsl(142 60% 35%)" }}>Enabler: {arg.enabler}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <InsightRating sectionId={`blue-${i}`} compact />
                      <PitchDeckToggle contentKey={`stress-green-${i}`} label="Include in Pitch" />
                    </div>
                  </div>
                );
              })}

              {/* Moonshot */}
              <div className="rounded-xl p-3.5" style={{ background: "hsl(142 60% 45% / 0.06)", border: "1px solid hsl(142 60% 45% / 0.18)" }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: "hsl(142 60% 35%)" }}>
                  <Target size={11} /> Moonshot Potential
                </p>
                <p className="text-sm font-semibold text-foreground leading-relaxed">{data.blueTeam.moonshot}</p>
                <div className="flex justify-end mt-2">
                  <PitchDeckToggle contentKey="stress-moonshot" label="Include in Pitch" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VS badge overlay — centered on the divider */}
        <div className="relative -mt-[calc(50%+1rem)] hidden md:block pointer-events-none" style={{ height: 0 }}>
          {/* Rendered via CSS below instead */}
        </div>

        {/* ═══ BELOW THE ARENA: shared sections ═══ */}

        {/* ── Competitive Landscape Panel ── */}
        {data.competitiveLandscape?.originalVsCompetitors?.length ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
                <Crosshair size={14} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <p className="text-sm font-extrabold text-foreground tracking-tight">Competitive Landscape</p>
            </div>

            {/* Positioning + Threat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--primary))" }}>Positioning Strategy</p>
                <p className="text-sm text-foreground/85 leading-relaxed">{data.competitiveLandscape.positioningRecommendation}</p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "hsl(0 72% 52% / 0.04)", border: "1px solid hsl(0 72% 52% / 0.15)" }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "hsl(0 72% 48%)" }}>Biggest Threat</p>
                <p className="text-sm text-foreground/85 leading-relaxed">{data.competitiveLandscape.biggestCompetitiveThreat}</p>
              </div>
            </div>

            {data.competitiveLandscape.categoryDynamics && (
              <div className="p-2.5 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Category Dynamics</p>
                <p className="text-xs text-foreground/80">{data.competitiveLandscape.categoryDynamics}</p>
              </div>
            )}

            {/* Competitor comparison cards */}
            <DetailPanel title={`Competitor Comparisons (${data.competitiveLandscape.originalVsCompetitors.length})`} icon={Crosshair} defaultOpen>
              <div className="space-y-2 mb-2">
                {data.competitiveLandscape.originalVsCompetitors.map((comp, i) => (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                    <div className="px-3 py-2 flex items-center justify-between" style={{ background: "hsl(var(--muted))" }}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{comp.competitor}</span>
                        {comp.url && (
                          <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                            <ArrowRight size={8} /> Visit
                          </a>
                        )}
                      </div>
                      <PitchDeckToggle contentKey={`comp-landscape-${i}`} label="Include in Pitch" />
                    </div>
                    <div className="grid grid-cols-2 gap-0">
                      {/* Original column */}
                      <div className="p-3 space-y-2" style={{ borderRight: "1px solid hsl(var(--border))" }}>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Original Product</p>
                        <div>
                          <p className="text-[10px] font-semibold" style={{ color: "hsl(142 70% 35%)" }}>Advantage</p>
                          <p className="text-xs text-foreground/75 leading-relaxed">{comp.originalAdvantage}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold" style={{ color: "hsl(0 72% 48%)" }}>Vulnerability</p>
                          <p className="text-xs text-foreground/75 leading-relaxed">{comp.originalVulnerability}</p>
                        </div>
                      </div>
                      {/* Redesign column */}
                      <div className="p-3 space-y-2">
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Redesigned Concept</p>
                        <div>
                          <p className="text-[10px] font-semibold" style={{ color: "hsl(142 70% 35%)" }}>Advantage</p>
                          <p className="text-xs text-foreground/75 leading-relaxed">{comp.redesignAdvantage}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold" style={{ color: "hsl(38 92% 45%)" }}>Remaining Gap</p>
                          <p className="text-xs text-foreground/75 leading-relaxed">{comp.redesignGap}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DetailPanel>

            {data.competitiveLandscape.pricingInsight && (
              <div className="p-3 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "hsl(38 92% 45%)" }}>Pricing Insight</p>
                <p className="text-sm text-foreground/85 leading-relaxed">{data.competitiveLandscape.pricingInsight}</p>
                <div className="flex justify-end mt-2">
                  <PitchDeckToggle contentKey="comp-pricing-insight" label="Include in Pitch" />
                </div>
              </div>
            )}
          </div>
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

        {/* Counter Examples — collapsed */}
        {data.counterExamples?.length > 0 && (
          <DetailPanel title={`Real-World Precedents (${(data.counterExamples || []).length})`} icon={BookOpen}>
            <div className="space-y-2 mb-2">
              {(data.counterExamples || []).map((ex, i) => {
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
                    <div className="flex items-center justify-end mt-2">
                      <PitchDeckToggle contentKey={`precedent-${i}`} label="Include in Pitch" />
                    </div>
                  </div>
                );
              })}
            </div>
          </DetailPanel>
        )}

        {/* Strategic Recommendations — collapsed */}
        {data.strategicRecommendations?.length ? (
          <DetailPanel title={`Strategic Recommendations (${(data.strategicRecommendations || []).length})`} icon={ArrowRight}>
            <div className="space-y-1.5 mb-2">
              {(data.strategicRecommendations || []).map((rec, i) => (
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
                  {(data.currentApproachAssessment?.keepAsIs || []).map((item, i) => (
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
                  {(data.currentApproachAssessment?.fullyReinvent || []).map((item, i) => (
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
          <DetailPanel title={`Blind Spots (${(data.blindSpots || []).length})`} icon={Eye}>
            <div className="space-y-1.5 mb-2">
              {(data.blindSpots || []).map((bs, i) => (
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
      {/* Per-item pitch toggles on scores and checklist items below */}

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
