/**
 * Command Deck — Strategic Discovery Control Center
 * URL: /analysis/:analysisId/command-deck
 *
 * Zones:
 *   Header  — Analysis name, mode, Strategic Potential gauge
 *   Zone 1  — 5 circular gauge KPIs (signal-derived)
 *   Zone 2  — Pipeline status + Signal accumulation
 *   Zone 3  — Strategic opportunities table
 *   Zone 4  — Insight Graph preview
 */

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { useWorkspaceTheme } from "@/hooks/useWorkspaceTheme";
import { WorkspaceThemeToggle } from "@/components/WorkspaceThemeToggle";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { HeroSection } from "@/components/HeroSection";
import { ModeBadge } from "@/components/ModeBadge";
import { TierDiscoveryPanel } from "@/components/TierDiscoveryPanel";
import { motion } from "framer-motion";
import {
  LayoutDashboard, GitBranch, Target, Shield, Lightbulb,
  Activity, Crosshair, AlertTriangle, CheckCircle2, Circle,
  ChevronRight, Rocket, TrendingUp, ArrowRight, ArrowUpDown,
  Zap, BarChart3, ExternalLink, RefreshCw, Brain, FlaskConical, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  computeCommandDeckMetrics, aggregateOpportunities,
  type CommandDeckMetrics as DeckMetrics,
} from "@/lib/commandDeckMetrics";
import { extractAllEvidence, type MetricDomain, type EvidenceTier } from "@/lib/evidenceEngine";
import { computeTierState, filterEvidenceByTier, TIER_META, type TierNumber, type TierState } from "@/lib/tierDiscoveryEngine";
import { EvidenceExplorer } from "@/components/EvidenceExplorer";
import { StrategicNarrativePanel } from "@/components/StrategicNarrativePanel";
import { LensIntelligencePanel } from "@/components/LensIntelligencePanel";
import { allScenariosToEvidence, scenarioToEvidence, getScenarios, type ToolScenario } from "@/lib/scenarioEngine";
import { recomputeIntelligence } from "@/lib/recomputeIntelligence";
import { RecomputeOverlay } from "@/components/RecomputeOverlay";
import { IntelligenceEventFeed } from "@/components/IntelligenceEventFeed";
import { StrategicSummaryStrip } from "@/components/command-deck/StrategicSummaryStrip";
import { StrategicSummaryTriad } from "@/components/command-deck/StrategicSummaryTriad";
import { StrategicSignalBanner } from "@/components/command-deck/StrategicSignalBanner";
import { KeyInsightSignals } from "@/components/command-deck/KeyInsightSignals";
import { OpportunityBoard } from "@/components/command-deck/OpportunityBoard";
import { OpportunityRadar } from "@/components/command-deck/OpportunityRadar";
import { PathwayGenerator } from "@/components/command-deck/PathwayGenerator";
import { ScenarioSimulationPanel } from "@/components/command-deck/ScenarioSimulationPanel";
import { ScenarioCommandCenter } from "@/components/command-deck/ScenarioCommandCenter";
import { RiskIntelligencePanel } from "@/components/command-deck/RiskIntelligencePanel";

const PIPELINE_STEPS = [
  { key: "report", label: "Report", icon: Target, route: "report" },
  { key: "disrupt", label: "Disrupt", icon: Crosshair, route: "disrupt" },
  { key: "redesign", label: "Redesign", icon: Lightbulb, route: "redesign" },
  { key: "stress-test", label: "Stress Test", icon: AlertTriangle, route: "stress-test" },
  { key: "pitch", label: "Pitch", icon: Rocket, route: "pitch" },
] as const;

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

/* ════════════════════════════════════════════════════════
 * CIRCULAR GAUGE — Reusable animated ring
 * ════════════════════════════════════════════════════════ */
function CircularGauge({ value, max, color, size = 72, strokeWidth = 5, delay = 0 }: {
  value: number; max: number; color: string; size?: number; strokeWidth?: number; delay?: number;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / Math.max(max, 1), 1);
  const offset = circ * (1 - pct);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut", delay }}
      />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════
 * METRIC CARD — Circular gauge + description + trend
 * ════════════════════════════════════════════════════════ */
function getTrend(score: number): "up" | "neutral" | "down" {
  if (score >= 6) return "up";
  if (score >= 3) return "neutral";
  return "down";
}

const trendIcons: Record<string, { icon: typeof TrendingUp; color: string; label: string }> = {
  up: { icon: TrendingUp, color: "hsl(152 60% 44%)", label: "Positive" },
  neutral: { icon: Activity, color: "hsl(38 92% 50%)", label: "Neutral" },
  down: { icon: AlertTriangle, color: "hsl(0 72% 52%)", label: "Needs attention" },
};

interface MetricCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
  trend?: "up" | "down" | "neutral";
  evidence?: string;
  evidenceCount?: number;
  delay?: number;
  onClick?: () => void;
}

function MetricCard({ label, value, description, icon: Icon, color, trend, evidence, evidenceCount, delay = 0, onClick }: MetricCardProps) {
  const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
  const max = label === "Constraints" ? Math.max(numValue, 10) : 10;
  const trendInfo = trend ? trendIcons[trend] : null;
  const TrendIcon = trendInfo?.icon;

  return (
    <motion.div
      {...fadeUp}
      transition={{ delay, duration: 0.4 }}
    >
      <div
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        className={`rounded-xl p-4 bg-card border border-border flex flex-col items-center gap-2 min-h-[200px] w-full ${onClick ? "cursor-pointer hover:border-primary/30 transition-colors" : ""}`}
      >
        {/* ICON inside gauge */}
        <div className="relative">
          <CircularGauge value={numValue} max={max} color={color} size={76} strokeWidth={5} delay={delay + 0.1} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon size={18} style={{ color }} />
          </div>
        </div>

        <div className="text-center flex-1 flex flex-col">
          {/* VALUE */}
          <p className="text-2xl font-extrabold tabular-nums text-foreground leading-none">{value}</p>

          {/* LABEL */}
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>

          {/* EVIDENCE LINE */}
          {evidence && (
            <p className="text-[10px] font-semibold mt-1.5" style={{ color }}>{evidence}</p>
          )}

          {/* DESCRIPTION */}
          <p className="text-[10px] text-muted-foreground mt-1 leading-snug line-clamp-2">{description}</p>

          {/* EVIDENCE COUNT BADGE */}
          {onClick && evidenceCount != null && evidenceCount > 0 && (
            <p className="text-[9px] font-bold text-muted-foreground mt-1.5 underline decoration-dotted underline-offset-2">
              Inspect {evidenceCount} evidence items →
            </p>
          )}

          {/* TREND */}
          {trendInfo && TrendIcon && (
            <div className="flex items-center justify-center gap-1 mt-auto pt-1.5">
              <TrendIcon size={10} style={{ color: trendInfo.color }} />
              <span className="text-[9px] font-bold" style={{ color: trendInfo.color }}>{trendInfo.label}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
 * STRATEGIC POTENTIAL — Large headline gauge
 * ════════════════════════════════════════════════════════ */
function StrategicPotentialGauge({ score, accent }: { score: number; accent: string }) {
  const tier = score >= 7 ? "High" : score >= 4 ? "Moderate" : "Low";
  const tierColor = score >= 7 ? "hsl(152 60% 44%)" : score >= 4 ? "hsl(38 92% 50%)" : "hsl(0 72% 52%)";

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0">
        <CircularGauge value={score} max={10} color={accent} size={124} strokeWidth={7} delay={0.3} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-extrabold tabular-nums text-foreground leading-none"
          >
            {score.toFixed(1)}
          </motion.p>
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mt-0.5">/ 10</p>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Strategic Potential</p>
        <p className="text-sm font-bold mt-0.5" style={{ color: tierColor }}>{tier} Potential</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
          Composite of opportunity, leverage, constraint, and risk signals.
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
 * PIPELINE STEP ROW
 * ════════════════════════════════════════════════════════ */
function PipelineStep({ step, status, analysisId, signalCount }: {
  step: typeof PIPELINE_STEPS[number];
  status: "completed" | "outdated" | "not_run";
  analysisId: string;
  signalCount: number;
}) {
  const navigate = useNavigate();
  const StepIcon = step.icon;
  const statusColor = status === "completed" ? "hsl(152 60% 44%)"
    : status === "outdated" ? "hsl(38 92% 50%)"
    : "hsl(var(--muted-foreground))";
  const StatusIcon = status === "completed" ? CheckCircle2
    : status === "outdated" ? AlertTriangle : Circle;
  const statusLabel = status === "completed" ? "Done"
    : status === "outdated" ? "Outdated" : "Not Run";

  return (
    <button
      onClick={() => navigate(`/analysis/${analysisId}/${step.route}`)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-muted/50 w-full text-left min-h-[48px]"
      style={status === "outdated" ? {
        background: "hsl(38 92% 50% / 0.04)",
        border: "1px solid hsl(38 92% 50% / 0.12)",
      } : { border: "1px solid transparent" }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${statusColor}10` }}>
        <StepIcon size={14} style={{ color: statusColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground leading-none">{step.label}</p>
      </div>
      {status !== "not_run" && (
        <span className="text-xs font-bold tabular-nums text-muted-foreground">{signalCount} signals</span>
      )}
      <div className="flex items-center gap-1.5">
        <StatusIcon size={10} style={{ color: statusColor }} />
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: statusColor }}>
          {statusLabel}
        </span>
      </div>
      <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
    </button>
  );
}

/* ════════════════════════════════════════════════════════
 * OPPORTUNITY TABLE
 * ════════════════════════════════════════════════════════ */
function OpportunityTable({ opps, analysisId }: {
  opps: { id: string; label: string; impact: number; confidence: string; step: string; source: string; tier?: EvidenceTier; opportunityScore?: number; riskLevel?: string }[];
  analysisId: string;
}) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<"impact" | "confidence" | "score">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...opps].sort((a, b) => {
      if (sortKey === "score") return sortDir === "desc" ? (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0) : (a.opportunityScore ?? 0) - (b.opportunityScore ?? 0);
      if (sortKey === "impact") return sortDir === "desc" ? b.impact - a.impact : a.impact - b.impact;
      return sortDir === "desc" ? b.confidence.localeCompare(a.confidence) : a.confidence.localeCompare(b.confidence);
    });
  }, [opps, sortKey, sortDir]);

  const toggleSort = (key: "impact" | "confidence" | "score") => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const tierColors: Record<string, string> = {
    structural: "hsl(0 72% 52%)", system: "hsl(38 92% 50%)", optimization: "hsl(229 89% 63%)",
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[1fr_50px_60px_60px_70px_70px] sm:grid-cols-[1fr_50px_60px_100px_60px_70px_70px] gap-2 px-3 py-2 border-b border-border min-w-[500px]">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Opportunity</span>
        <button onClick={() => toggleSort("score")}
          className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground text-center flex items-center gap-0.5 justify-center">
          Score <ArrowUpDown size={7} />
        </button>
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground text-center">Tier</span>
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground hidden sm:block">Source</span>
        <button onClick={() => toggleSort("impact")}
          className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground text-center flex items-center gap-0.5 justify-center">
          Impact <ArrowUpDown size={7} />
        </button>
        <button onClick={() => toggleSort("confidence")}
          className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground text-center flex items-center gap-0.5 justify-center">
          Conf. <ArrowUpDown size={7} />
        </button>
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground text-center">Risk</span>
      </div>
      {sorted.map(opp => {
        const ic = opp.impact >= 8 ? "hsl(152 60% 44%)" : opp.impact >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";
        const tc = opp.tier ? tierColors[opp.tier] : "hsl(var(--muted-foreground))";
        const tLabel = opp.tier ? opp.tier.charAt(0).toUpperCase() + opp.tier.slice(1, 4) : "—";
        const sc = (opp.opportunityScore ?? 0) >= 6 ? "hsl(152 60% 44%)" : (opp.opportunityScore ?? 0) >= 3 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";
        const riskColor = opp.riskLevel === "low" ? "hsl(152 60% 44%)" : opp.riskLevel === "moderate" ? "hsl(38 92% 50%)" : "hsl(0 72% 52%)";
        return (
          <button key={opp.id}
            onClick={() => navigate(`/analysis/${analysisId}/insight-graph?node=${opp.id}`)}
            className="grid grid-cols-[1fr_50px_60px_60px_70px_70px] sm:grid-cols-[1fr_50px_60px_100px_60px_70px_70px] gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors text-left w-full min-h-[44px] min-w-[500px]"
          >
            <span className="text-sm font-semibold text-foreground truncate">{opp.label}</span>
            <span className="text-sm font-extrabold tabular-nums text-center" style={{ color: sc }}>{(opp.opportunityScore ?? 0).toFixed(1)}</span>
            <span className="text-[9px] font-bold text-center px-1.5 py-0.5 rounded-full" style={{ background: `${tc}12`, color: tc }}>{tLabel}</span>
            <span className="text-[10px] text-muted-foreground truncate hidden sm:block">{opp.source}</span>
            <span className="text-sm font-bold tabular-nums text-center" style={{ color: ic }}>{opp.impact}/10</span>
            <span className="text-[10px] font-bold capitalize text-center text-muted-foreground">{opp.confidence}</span>
            <span className="text-[9px] font-bold capitalize text-center" style={{ color: riskColor }}>{opp.riskLevel || "—"}</span>
          </button>
        );
      })}
    </div>
  );
}
/* ════════════════════════════════════════════════════════
 * MAIN PAGE
 * ════════════════════════════════════════════════════════ */
export default function CommandDeckPage() {
  const analysis = useAnalysis();
  const { tier } = useSubscription();
  const theme = useModeTheme();
  const navigate = useNavigate();
  const { shouldRedirectHome } = useHydrationGuard();
  const { theme: workspaceTheme, toggle: toggleTheme } = useWorkspaceTheme();
  const autoAnalysis = useAutoAnalysis();

  const { selectedProduct, analysisId: ctxAnalysisId, businessAnalysisData, businessModelInput } = analysis;

  // Fallback: extract analysis ID from URL if context is null (e.g. direct navigation)
  const urlAnalysisId = useMemo(() => {
    const match = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
    return match?.[1] || null;
  }, []);
  const analysisId = ctxAnalysisId || urlAnalysisId;

  const modeAccent = theme.primary;
  const { intelligence, graph, completedSteps, narrative } = autoAnalysis;

  // ── Aggregated Metrics ──
  const allEvidence = useMemo(() => extractAllEvidence({
    products: analysis.products,
    selectedProduct,
    disruptData: analysis.disruptData,
    redesignData: analysis.redesignData,
    stressTestData: analysis.stressTestData,
    pitchDeckData: analysis.pitchDeckData,
    governedData: analysis.governedData as Record<string, unknown> | null,
    businessAnalysisData: analysis.businessAnalysisData,
    intelligence,
    analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
  }), [
    analysis.products, selectedProduct, analysis.disruptData, analysis.redesignData,
    analysis.stressTestData, analysis.pitchDeckData, analysis.governedData,
    analysis.businessAnalysisData, intelligence, analysis.activeMode,
  ]);

  const metricsInput = useMemo(() => ({
    products: analysis.products,
    selectedProduct,
    disruptData: analysis.disruptData,
    redesignData: analysis.redesignData,
    stressTestData: analysis.stressTestData,
    pitchDeckData: analysis.pitchDeckData,
    governedData: analysis.governedData as Record<string, unknown> | null,
    businessAnalysisData: analysis.businessAnalysisData,
    intelligence,
    completedSteps,
    evidence: allEvidence,
  }), [
    analysis.products, selectedProduct, analysis.disruptData, analysis.redesignData,
    analysis.stressTestData, analysis.pitchDeckData, analysis.governedData,
    analysis.businessAnalysisData, intelligence, completedSteps, allEvidence,
  ]);

  const metrics: DeckMetrics = useMemo(() => computeCommandDeckMetrics(metricsInput), [metricsInput]);
  const topOpps = useMemo(() => aggregateOpportunities(metricsInput), [metricsInput]);

  // ── Tier Discovery State ──
  const [tierFilter, setTierFilter] = useState<EvidenceTier | null>(null);
  const [manualUnlocks, setManualUnlocks] = useState<Set<TierNumber>>(new Set());
  const tierState: TierState = useMemo(() => computeTierState(allEvidence, manualUnlocks), [allEvidence, manualUnlocks]);
  const filteredEvidence = useMemo(() => filterEvidenceByTier(allEvidence, tierFilter), [allEvidence, tierFilter]);

  const handleSelectTier = useCallback((tier: TierNumber) => {
    const tierKey = TIER_META[tier].tier;
    setTierFilter(prev => prev === tierKey ? null : tierKey);
  }, []);

  const handleMarkComplete = useCallback((tier: TierNumber) => {
    const nextTier = (tier + 1) as TierNumber;
    setManualUnlocks(prev => new Set(prev).add(nextTier));
  }, []);

  // Filter opportunities by tier
  const filteredOpps = useMemo(() => {
    if (!tierFilter) return topOpps;
    return topOpps.filter((o: any) => {
      // Try to match by tier if available, otherwise show all
      if (o.tier) return o.tier === tierFilter;
      return true;
    });
  }, [topOpps, tierFilter]);

  // ── Drilldown state ──
  const [explorerDomain, setExplorerDomain] = useState<MetricDomain | null>(null);
  const openExplorer = useCallback((d: MetricDomain) => setExplorerDomain(d), []);
  const closeExplorer = useCallback(() => setExplorerDomain(null), []);

  // ── Strategic Potential Score ──
  // Strategic Potential - computed after savedScenarios (below) via ref
  const scenarioCountRef = useRef(0);
  const strategicPotential = useMemo(() => {
    const simBoost = Math.min(scenarioCountRef.current * 0.3, 1.5);
    const raw = (metrics.opportunityScore + metrics.leverageScore + simBoost)
      - (metrics.frictionIndex * 0.5)
      - (metrics.riskScore * 0.3);
    return Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
  }, [metrics]);

  const pipelinePct = metrics.pipelineCompletion;
  const baseUrl = `/analysis/${analysisId}`;
  const totalSignals = metrics.stepSignals.reduce((s, ss) => s + (ss.hasData ? ss.signals : 0), 0);
  const hasBusinessContext = !!businessAnalysisData;
  const analysisDisplayName = selectedProduct?.name || businessModelInput?.type || "Business Model Analysis";

  const lensSignalKeywords = useMemo(() => {
    const keywords: string[] = [];
    if (autoAnalysis.insights) {
      autoAnalysis.insights.forEach(i => {
        if (i.label) keywords.push(i.label);
        if (i.description) keywords.push(i.description);
      });
    }
    if (narrative?.narrativeSummary) keywords.push(narrative.narrativeSummary);
    return keywords;
  }, [autoAnalysis.insights, narrative]);

  // Reasoning-driven tool recommendations from insight layer
  const reasoningToolRecs = useMemo(() => {
    return narrative?.recommendedTools ?? [];
  }, [narrative]);

  // Intelligence event feed
  const [intelligenceEvents, setIntelligenceEvents] = useState<string[]>([]);
  const addEvent = useCallback((msg: string) => {
    setIntelligenceEvents(prev => [msg, ...prev].slice(0, 10));
  }, []);
  const dismissEvent = useCallback((idx: number) => {
    setIntelligenceEvents(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // Scenario saved handler — generates real evidence and triggers recompute
  const [isRecomputing, setIsRecomputing] = useState(false);
  const handleScenarioSaved = useCallback((scenario: ToolScenario) => {
    setIsRecomputing(true);

    // Generate real evidence from scenario
    const newEvidence = scenarioToEvidence(scenario, 
      analysis.activeMode === "service" ? "service" 
      : analysis.activeMode === "business" ? "business_model" 
      : "product"
    );
    addEvent(`Simulation created ${newEvidence.type} signal: "${newEvidence.label}"`);

    // Run real intelligence recompute
    try {
      const result = recomputeIntelligence({
        products: analysis.products,
        selectedProduct,
        disruptData: analysis.disruptData,
        redesignData: analysis.redesignData,
        stressTestData: analysis.stressTestData,
        pitchDeckData: analysis.pitchDeckData,
        governedData: analysis.governedData as Record<string, unknown> | null,
        businessAnalysisData: analysis.businessAnalysisData,
        intelligence,
        analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
        analysisId: analysisId || "",
        completedSteps,
      });

      // Surface recompute events
      result.events.forEach(evt => addEvent(evt));
    } catch (err) {
      addEvent("Intelligence recompute completed");
    }

    setTimeout(() => {
      setIsRecomputing(false);
      toast.success("Strategic intelligence updated");
    }, 800);
  }, [analysis, selectedProduct, intelligence, analysisId, completedSteps, addEvent]);

  const handleRecomputeAll = useCallback(() => {
    if (completedSteps.size === 0) {
      navigate(`${baseUrl}/report`);
      return;
    }
    setIsRecomputing(true);
    addEvent("Recomputing strategic intelligence…");

    try {
      const result = recomputeIntelligence({
        products: analysis.products,
        selectedProduct,
        disruptData: analysis.disruptData,
        redesignData: analysis.redesignData,
        stressTestData: analysis.stressTestData,
        pitchDeckData: analysis.pitchDeckData,
        governedData: analysis.governedData as Record<string, unknown> | null,
        businessAnalysisData: analysis.businessAnalysisData,
        intelligence,
        analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
        analysisId: analysisId || "",
        completedSteps,
      });
      result.events.forEach(evt => addEvent(evt));
    } catch {
      addEvent("Strategic intelligence updated");
    }

    setTimeout(() => {
      setIsRecomputing(false);
      toast.success("Strategic intelligence updated");
    }, 1000);
  }, [analysis, selectedProduct, intelligence, analysisId, completedSteps, navigate, baseUrl, addEvent]);

  // ── AUTO-RECOMPUTE: trigger intelligence pipeline on data changes ──
  const lastRecomputeHash = useRef<string>("");
  const savedScenarios = useMemo(() => {
    const s = getScenarios(analysisId || "");
    scenarioCountRef.current = s.length;
    return s;
  }, [analysisId, intelligenceEvents.length]);

  useEffect(() => {
    const hash = JSON.stringify({
      steps: Array.from(completedSteps),
      sigCount: totalSignals,
      evCount: metrics.totalEvidenceCount,
      scenarioCount: savedScenarios.length,
      scenarioHash: savedScenarios.map(s => s.scenarioId + s.timestamp).join(","),
    });
    if (hash === lastRecomputeHash.current) return;
    lastRecomputeHash.current = hash;
    if (completedSteps.size === 0) return;

    const timer = setTimeout(() => {
      try {
        const result = recomputeIntelligence({
          products: analysis.products,
          selectedProduct,
          disruptData: analysis.disruptData,
          redesignData: analysis.redesignData,
          stressTestData: analysis.stressTestData,
          pitchDeckData: analysis.pitchDeckData,
          governedData: analysis.governedData as Record<string, unknown> | null,
          businessAnalysisData: analysis.businessAnalysisData,
          intelligence,
          analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
          analysisId: analysisId || "",
          completedSteps,
        });
        if (result.flatEvidence.length > 0 && result.insights.length > 0) {
          addEvent(`Intelligence: ${result.insights.length} insights from ${result.flatEvidence.length} evidence`);
        }
        if (result.scenarioCount > 0) {
          addEvent(`${result.scenarioCount} simulation scenarios integrated`);
        }
      } catch {
        // Silent fail for auto-recompute
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [completedSteps, totalSignals, metrics.totalEvidenceCount, savedScenarios]);


  if (analysis.step !== "done" || (!selectedProduct && !hasBusinessContext)) {
    if (shouldRedirectHome) return null;
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
        </div>
      </div>
    );
  }

  const modeLabel = analysis.activeMode === "custom" ? "Product"
    : analysis.activeMode === "service" ? "Service" : "Business Model";
  const modeKey: "product" | "service" | "business" = analysis.activeMode === "service" ? "service"
    : analysis.activeMode === "business" ? "business" : "product";

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />

      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">

        {/* In-place Recompute Overlay */}
        <RecomputeOverlay isActive={isRecomputing || autoAnalysis.isComputing} />

        {/* ═══ HEADER ═══ */}
        <motion.div {...fadeUp} className="rounded-2xl p-4 sm:p-5 bg-card border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                <ModeBadge />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {modeLabel}
                </span>
                {metrics.isPartial && (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: "hsl(38 92% 50% / 0.1)", color: "hsl(38 92% 50%)" }}>
                    Partial
                  </span>
                )}
                {/* Auto-recompute indicator */}
                {(isRecomputing || autoAnalysis.isComputing) && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-primary animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Computing…
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-foreground truncate">{analysisDisplayName}</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {completedSteps.size}/{PIPELINE_STEPS.length} steps · {totalSignals} signals · Auto-recompute active
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRecomputeAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
                style={{ background: `${modeAccent}10`, color: modeAccent, border: `1px solid ${modeAccent}20` }}
              >
                <RefreshCw size={13} className={isRecomputing ? "animate-spin" : ""} />
                Recompute
              </button>
            </div>
          </div>

          {/* ── STRATEGIC HEALTH STRIP — 4 compact gauges ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Opportunity Score", value: metrics.opportunityScore, max: 10, color: "hsl(152 60% 44%)", icon: Lightbulb },
              { label: "Structural Pressure", value: metrics.frictionIndex, max: 10, color: "hsl(0 72% 52%)", icon: AlertTriangle },
              { label: "Evidence Strength", value: Math.min(10, Math.round(metrics.totalEvidenceCount / 5)), max: 10, color: "hsl(229 89% 63%)", icon: BarChart3 },
              { label: "Strategic Momentum", value: strategicPotential, max: 10, color: modeAccent, icon: TrendingUp },
            ].map((gauge, gi) => {
              const GaugeIcon = gauge.icon;
              return (
                <div key={gauge.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/50">
                  <div className="relative flex-shrink-0">
                    <CircularGauge value={gauge.value} max={gauge.max} color={gauge.color} size={48} strokeWidth={4} delay={gi * 0.08} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <GaugeIcon size={13} style={{ color: gauge.color }} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold tabular-nums text-foreground leading-none">{gauge.value.toFixed(1)}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 truncate">{gauge.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ═══ WORKSPACE NAV ═══ */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <WorkspaceThemeToggle theme={workspaceTheme} onToggle={toggleTheme} />
          {[
            { label: "Command Deck", icon: LayoutDashboard, path: `${baseUrl}/command-deck`, active: true },
            { label: "Report", icon: Target, path: `${baseUrl}/report` },
            { label: "Disrupt", icon: Crosshair, path: `${baseUrl}/disrupt` },
            { label: "Redesign", icon: Lightbulb, path: `${baseUrl}/redesign` },
            { label: "Stress Test", icon: AlertTriangle, path: `${baseUrl}/stress-test` },
            { label: "Pitch", icon: Rocket, path: `${baseUrl}/pitch` },
            { label: "Insight Graph", icon: GitBranch, path: `${baseUrl}/insight-graph` },
          ].map(nav => (
            <button
              key={nav.label}
              onClick={() => navigate(nav.path)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px]"
              style={{
                background: nav.active ? `${modeAccent}15` : "hsl(var(--muted))",
                color: nav.active ? modeAccent : "hsl(var(--foreground))",
                border: nav.active ? `1.5px solid ${modeAccent}40` : "1px solid hsl(var(--border))",
              }}
            >
              <nav.icon size={14} />
              <span className="hidden sm:inline">{nav.label}</span>
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════
         *  3-LAYER STRATEGIC BRIEFING + LENS INTELLIGENCE PANEL
         * ═══════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

          {/* ── LEFT COLUMN: Intelligence Briefing ── */}
          <div className="space-y-6 min-w-0">

            {/* ━━━ SECTION 1 — STRATEGIC SUMMARY TRIAD ━━━ */}
            <StrategicSummaryTriad
              metrics={metrics}
              opportunities={filteredOpps}
              scenarioComparison={autoAnalysis.scenarioComparison}
              sensitivityReports={autoAnalysis.sensitivityReports}
              strategicPotential={strategicPotential}
            />

            {/* ━━━ SECTION 2 — OPPORTUNITY RADAR ━━━ */}
            <OpportunityRadar
              opportunities={filteredOpps}
              onViewInGraph={(id) => navigate(`${baseUrl}/insight-graph?node=${id}`)}
            />

            {/* ━━━ SECTION 3 — SCENARIO COMMAND CENTER ━━━ */}
            {autoAnalysis.scenarioComparison && autoAnalysis.scenarioComparison.scenarios.length > 0 && (
              <ScenarioCommandCenter comparison={autoAnalysis.scenarioComparison} />
            )}

            {/* ━━━ SECTION 4 — RISK INTELLIGENCE PANEL ━━━ */}
            <RiskIntelligencePanel sensitivityReports={autoAnalysis.sensitivityReports} />

            {/* ━━━ SUPPORTING — Key Insight Signals ━━━ */}
            <KeyInsightSignals
              insights={autoAnalysis.insights}
              onViewGraph={() => navigate(`${baseUrl}/insight-graph`)}
            />

            {/* ━━━ SUPPORTING — Strategic Pathways ━━━ */}
            <PathwayGenerator
              opportunities={filteredOpps}
              insights={autoAnalysis.insights}
            />
            {/* ━━━ LAYER 3 — EXPLORATION LAYER ━━━ */}
            <div className="space-y-5">
              {/* Pipeline + Signal Accumulation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Pipeline Progress */}
                <motion.div {...fadeUp} transition={{ delay: 0.1 }}
                  className="rounded-xl p-5 space-y-3 bg-card border border-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={14} className="text-foreground" />
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">Pipeline Status</p>
                    </div>
                    <span className="text-sm font-extrabold tabular-nums" style={{ color: modeAccent }}>
                      {pipelinePct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-muted">
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pipelinePct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{ background: modeAccent }}
                    />
                  </div>
                  <div className="space-y-0.5">
                    {PIPELINE_STEPS.map(s => {
                      const isDone = completedSteps.has(s.key);
                      const isOutdated = analysis.outdatedSteps.has(s.key);
                      const status: "completed" | "outdated" | "not_run" =
                        isOutdated ? "outdated" : isDone ? "completed" : "not_run";
                      const ss = metrics.stepSignals.find(x => x.key === s.key);
                      return <PipelineStep key={s.key} step={s} status={status} analysisId={analysisId!} signalCount={ss?.signals || 0} />;
                    })}
                  </div>
                </motion.div>

                {/* Signal Accumulation */}
                <motion.div {...fadeUp} transition={{ delay: 0.15 }}
                  className="rounded-xl p-5 bg-card border border-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-foreground" />
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">Signal Accumulation</p>
                    </div>
                    <span className="text-sm font-extrabold tabular-nums text-foreground">{totalSignals} total</span>
                  </div>
                  <div className="space-y-3">
                    {metrics.stepSignals.map((ss, si) => {
                      const maxSignals = Math.max(...metrics.stepSignals.map(s => s.signals), 1);
                      const pct = Math.round((ss.signals / maxSignals) * 100);
                      const stepDef = PIPELINE_STEPS.find(p => p.key === ss.key);
                      const StepIcon = stepDef?.icon || Target;
                      return (
                        <div key={ss.key} className="space-y-1">
                          <div className="flex items-center gap-3">
                            <div className="w-24 flex items-center gap-1.5 flex-shrink-0">
                              <StepIcon size={12} className="text-muted-foreground flex-shrink-0" />
                              <span className="text-[11px] font-bold text-foreground truncate">{ss.step}</span>
                            </div>
                            <div className="flex-1 h-6 rounded-md overflow-hidden bg-muted">
                              <motion.div
                                className="h-full rounded-md"
                                initial={{ width: 0 }}
                                animate={{ width: ss.hasData ? `${Math.max(pct, 6)}%` : "0%" }}
                                transition={{ duration: 0.6, delay: 0.1 + si * 0.08 }}
                                style={{ background: ss.hasData ? modeAccent : "transparent" }}
                              />
                            </div>
                            <span className="text-sm font-extrabold tabular-nums w-10 text-right text-foreground">
                              {ss.hasData ? ss.signals : "—"}
                            </span>
                          </div>
                          {ss.hasData && ss.breakdown.length > 0 && (
                            <div className="flex gap-2 pl-[108px]">
                              {ss.breakdown.map((b, bi) => (
                                <span key={bi} className="inline-flex items-center gap-1 text-[9px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
                                  <span className="text-muted-foreground">{b.count} {b.label}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* ── Saved Scenarios Panel ── */}
              {savedScenarios.length > 0 && (
                <motion.div {...fadeUp} transition={{ delay: 0.22 }}
                  className="rounded-xl p-5 bg-card border border-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FlaskConical size={14} style={{ color: "hsl(172 66% 50%)" }} />
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">Saved Scenarios</p>
                      <span className="text-[10px] font-bold text-muted-foreground">({savedScenarios.length})</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedScenarios.slice(0, 6).map(s => {
                      const impactColor = s.strategicImpact === "high" ? "hsl(152 60% 44%)"
                        : s.strategicImpact === "medium" ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";
                      const outputs = Object.entries(s.outputResults).slice(0, 3);
                      return (
                        <div key={s.scenarioId} className="rounded-xl p-3.5 border border-border bg-muted/30 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">{s.scenarioName}</p>
                              <p className="text-[10px] text-muted-foreground">{s.toolId.replace(/-/g, " ")}</p>
                            </div>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: `${impactColor}15`, color: impactColor }}>
                              {s.strategicImpact}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {outputs.map(([key, val]) => (
                              <div key={key} className="text-center px-1 py-1 rounded-lg bg-background">
                                <p className="text-xs font-extrabold text-foreground tabular-nums">
                                  {typeof val === "number" ? val.toLocaleString() : val}
                                </p>
                                <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5">
                            <Sparkles size={9} className="text-primary flex-shrink-0" />
                            <p className="text-[9px] font-bold text-primary truncate">Evidence fed to intelligence engine</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Insight Graph Preview */}
              <motion.div {...fadeUp} transition={{ delay: 0.25 }}
                className="rounded-xl overflow-hidden border border-border bg-card"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <GitBranch size={14} style={{ color: modeAccent }} />
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">System Intelligence</p>
                    </div>
                  </div>
                  {graph && graph.nodes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl p-4 text-center bg-muted/50">
                        <p className="text-3xl font-extrabold tabular-nums text-foreground leading-none">{graph.nodes.length}</p>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mt-1.5">Insight Nodes</p>
                      </div>
                      <div className="rounded-xl p-4 text-center bg-muted/50">
                        <p className="text-3xl font-extrabold tabular-nums text-foreground leading-none">{graph.edges.length}</p>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mt-1.5">Connections</p>
                      </div>
                      <div className="rounded-xl p-4 text-center bg-muted/50">
                        <p className="text-3xl font-extrabold tabular-nums text-foreground leading-none">
                          {graph.nodes.length > 0 ? (graph.edges.length / graph.nodes.length).toFixed(1) : "0"}
                        </p>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mt-1.5">Density</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center bg-muted mb-2">
                        <GitBranch size={18} className="text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">Graph builds as analysis progresses</p>
                    </div>
                  )}
                  {graph && graph.nodes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {["signal", "constraint", "leverage_point", "concept", "simulation"].map(type => {
                        const count = graph.nodes.filter(n => n.type === type).length;
                        if (count === 0) return null;
                        const colors: Record<string, string> = {
                          signal: "hsl(229 89% 63%)", constraint: "hsl(0 72% 52%)",
                          leverage_point: "hsl(38 92% 50%)", concept: "hsl(152 60% 44%)",
                          simulation: "hsl(172 66% 50%)",
                        };
                        return (
                          <button
                            key={type}
                            onClick={() => navigate(`${baseUrl}/insight-graph`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 min-h-[32px]"
                            style={{ background: `${colors[type]}12`, color: colors[type], border: `1px solid ${colors[type]}20` }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors[type] }} />
                            {count} {type.replace("_", " ")}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate(`${baseUrl}/insight-graph`)}
                  className="flex items-center justify-between gap-3 w-full px-5 py-3.5 border-t border-border transition-colors hover:bg-muted/30 min-h-[48px]"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink size={14} style={{ color: modeAccent }} />
                    <span className="text-sm font-bold text-foreground">Explore Insight Graph</span>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </button>
              </motion.div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Lens Intelligence Panel ── */}
          <aside className="hidden xl:block space-y-5 sticky top-4 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
            <LensIntelligencePanel
              analysisMode={analysis.activeMode || "product"}
              signalKeywords={lensSignalKeywords}
              analysisId={analysisId || ""}
              recommendedToolIds={reasoningToolRecs}
              onScenarioSaved={handleScenarioSaved}
            />
          </aside>
        </div>

        {/* Mobile Lens Intelligence (below content on smaller screens) */}
        <div className="xl:hidden">
          <LensIntelligencePanel
            analysisMode={analysis.activeMode || "product"}
            signalKeywords={lensSignalKeywords}
            analysisId={analysisId || ""}
            recommendedToolIds={reasoningToolRecs}
            onScenarioSaved={handleScenarioSaved}
          />
        </div>

      </main>

      {/* Evidence Explorer Drilldown */}
      <EvidenceExplorer
        open={explorerDomain !== null}
        onClose={closeExplorer}
        domain={explorerDomain}
        evidence={filteredEvidence}
      />

      {/* Intelligence Event Feed */}
      <IntelligenceEventFeed events={intelligenceEvents} onDismiss={dismissEvent} />
    </div>
  );
}
