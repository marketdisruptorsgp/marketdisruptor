/**
 * Command Deck — Strategic Intelligence Dashboard
 * URL: /analysis/:analysisId/command-deck
 *
 * Zones:
 *   Header  — Analysis name, mode, Strategic Potential gauge
 *   Zone 1  — 5 circular gauge KPIs (signal-derived)
 *   Zone 2  — Pipeline status + Signal accumulation
 *   Zone 3  — Strategic opportunities table
 *   Zone 4  — Insight Graph preview
 */

import { useMemo, useState, useCallback } from "react";
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
  Zap, BarChart3, ExternalLink,
} from "lucide-react";
import {
  computeCommandDeckMetrics, aggregateOpportunities,
  type CommandDeckMetrics as DeckMetrics,
} from "@/lib/commandDeckMetrics";
import { extractAllEvidence, type MetricDomain, type EvidenceTier } from "@/lib/evidenceEngine";
import { computeTierState, filterEvidenceByTier, TIER_META, type TierNumber, type TierState } from "@/lib/tierDiscoveryEngine";
import { EvidenceExplorer } from "@/components/EvidenceExplorer";

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
  opps: { id: string; label: string; impact: number; confidence: string; step: string; source: string; tier?: EvidenceTier }[];
  analysisId: string;
}) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<"impact" | "confidence">("impact");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    return [...opps].sort((a, b) => {
      if (sortKey === "impact") return sortDir === "desc" ? b.impact - a.impact : a.impact - b.impact;
      return sortDir === "desc" ? b.confidence.localeCompare(a.confidence) : a.confidence.localeCompare(b.confidence);
    });
  }, [opps, sortKey, sortDir]);

  const toggleSort = (key: "impact" | "confidence") => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const tierColors: Record<string, string> = {
    structural: "hsl(0 72% 52%)", system: "hsl(38 92% 50%)", optimization: "hsl(229 89% 63%)",
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[1fr_60px_70px_70px_80px] sm:grid-cols-[1fr_60px_120px_70px_70px_80px] gap-2 px-3 py-2 border-b border-border min-w-[450px]">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Opportunity</span>
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
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground text-center">Step</span>
      </div>
      {sorted.map(opp => {
        const ic = opp.impact >= 8 ? "hsl(152 60% 44%)" : opp.impact >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";
        const tc = opp.tier ? tierColors[opp.tier] : "hsl(var(--muted-foreground))";
        const tLabel = opp.tier ? opp.tier.charAt(0).toUpperCase() + opp.tier.slice(1, 4) : "—";
        return (
          <button key={opp.id}
            onClick={() => navigate(`/analysis/${analysisId}/insight-graph?node=${opp.id}`)}
            className="grid grid-cols-[1fr_60px_70px_70px_80px] sm:grid-cols-[1fr_60px_120px_70px_70px_80px] gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors text-left w-full min-h-[44px] min-w-[450px]"
          >
            <span className="text-sm font-semibold text-foreground truncate">{opp.label}</span>
            <span className="text-[9px] font-bold text-center px-1.5 py-0.5 rounded-full" style={{ background: `${tc}12`, color: tc }}>{tLabel}</span>
            <span className="text-[10px] text-muted-foreground truncate hidden sm:block">{opp.source}</span>
            <span className="text-sm font-bold tabular-nums text-center" style={{ color: ic }}>{opp.impact}/10</span>
            <span className="text-[10px] font-bold capitalize text-center text-muted-foreground">{opp.confidence}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-center text-muted-foreground">{opp.step}</span>
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

  const { selectedProduct, analysisId: ctxAnalysisId } = analysis;

  // Fallback: extract analysis ID from URL if context is null (e.g. direct navigation)
  const urlAnalysisId = useMemo(() => {
    const match = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
    return match?.[1] || null;
  }, []);
  const analysisId = ctxAnalysisId || urlAnalysisId;

  const modeAccent = theme.primary;
  const { intelligence, graph, completedSteps } = autoAnalysis;

  // ── Aggregated Metrics ──
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
  }), [
    analysis.products, selectedProduct, analysis.disruptData, analysis.redesignData,
    analysis.stressTestData, analysis.pitchDeckData, analysis.governedData,
    analysis.businessAnalysisData, intelligence, completedSteps,
  ]);

  const metrics: DeckMetrics = useMemo(() => computeCommandDeckMetrics(metricsInput), [metricsInput]);
  const topOpps = useMemo(() => aggregateOpportunities(metricsInput), [metricsInput]);
  const allEvidence = useMemo(() => extractAllEvidence(metricsInput), [metricsInput]);

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
  const strategicPotential = useMemo(() => {
    const raw = (metrics.opportunityScore + metrics.leverageScore)
      - (metrics.frictionIndex * 0.5)
      - (metrics.riskScore * 0.3);
    return Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
  }, [metrics]);

  const pipelinePct = metrics.pipelineCompletion;
  const baseUrl = `/analysis/${analysisId}`;
  const totalSignals = metrics.stepSignals.reduce((s, ss) => s + (ss.hasData ? ss.signals : 0), 0);

  if (analysis.step !== "done" || !selectedProduct) {
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

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">

        {/* ═══ HEADER ═══ */}
        <motion.div {...fadeUp} className="rounded-2xl p-5 sm:p-6 bg-card border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-2">
                <ModeBadge />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                  {modeLabel}
                </span>
                {metrics.isPartial && (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: "hsl(38 92% 50% / 0.1)", color: "hsl(38 92% 50%)" }}>
                    Partial Analysis
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground truncate">{selectedProduct.name}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {completedSteps.size}/{PIPELINE_STEPS.length} steps · {totalSignals} signals detected
                {metrics.contributingSources.length > 0 && ` · ${metrics.contributingSources.join(", ")}`}
              </p>
            </div>
            <StrategicPotentialGauge score={strategicPotential} accent={modeAccent} />
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

        {/* ═══ ZONE 1 — METRIC CARDS ═══ */}
        {tierFilter && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] font-bold text-muted-foreground">Filtered to:</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
              style={{
                background: `${tierFilter === "structural" ? "hsl(0 72% 52%)" : tierFilter === "system" ? "hsl(38 92% 50%)" : "hsl(229 89% 63%)"}15`,
                color: tierFilter === "structural" ? "hsl(0 72% 52%)" : tierFilter === "system" ? "hsl(38 92% 50%)" : "hsl(229 89% 63%)",
              }}>
              {tierFilter.charAt(0).toUpperCase() + tierFilter.slice(1)} tier
            </span>
            <button onClick={() => setTierFilter(null)} className="text-[10px] font-bold text-muted-foreground underline">Clear</button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <MetricCard
            label="Opportunity Score"
            value={metrics.opportunityScore}
            evidence={`${metrics.opportunitiesIdentified} opportunities detected`}
            evidenceCount={filteredEvidence.opportunity.evidenceCount}
            description="Potential value from redesign and leverage signals"
            icon={Lightbulb}
            color="hsl(152 60% 44%)"
            trend={getTrend(metrics.opportunityScore)}
            delay={0.05}
            onClick={() => openExplorer("opportunity")}
          />
          <MetricCard
            label="Friction Index"
            value={metrics.frictionIndex}
            evidence={`${metrics.constraintsDetected + metrics.riskSignals} friction signals`}
            evidenceCount={filteredEvidence.friction.evidenceCount}
            description="Customer complaints, friction points, and constraints"
            icon={AlertTriangle}
            color="hsl(0 72% 52%)"
            trend={metrics.frictionIndex >= 6 ? "down" : metrics.frictionIndex >= 3 ? "neutral" : "up"}
            delay={0.1}
            onClick={() => openExplorer("friction")}
          />
          <MetricCard
            label="Constraints"
            value={metrics.constraintsCount}
            evidence={`${metrics.assumptionsChallenged} assumptions challenged`}
            evidenceCount={filteredEvidence.constraint.evidenceCount}
            description="Structural constraints and assumptions discovered"
            icon={Crosshair}
            color="hsl(0 72% 52%)"
            trend="neutral"
            delay={0.15}
            onClick={() => openExplorer("constraint")}
          />
          <MetricCard
            label="Leverage Score"
            value={metrics.leverageScore}
            evidence={`${metrics.leveragePoints} leverage signals`}
            evidenceCount={filteredEvidence.leverage.evidenceCount}
            description="Hidden value and high-leverage opportunities"
            icon={Zap}
            color="hsl(38 92% 50%)"
            trend={getTrend(metrics.leverageScore)}
            delay={0.2}
            onClick={() => openExplorer("leverage")}
          />
          <MetricCard
            label="Risk Score"
            value={metrics.riskScore}
            evidence={`${metrics.riskSignals} risk signals`}
            evidenceCount={filteredEvidence.risk.evidenceCount}
            description="Execution, feasibility, and market risk"
            icon={Shield}
            color="hsl(0 72% 52%)"
            trend={metrics.riskScore >= 6 ? "down" : metrics.riskScore >= 3 ? "neutral" : "up"}
            delay={0.25}
            onClick={() => openExplorer("risk")}
          />
        </div>

        {/* ═══ ZONE 2 — PIPELINE + SIGNAL ACCUMULATION ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">
                  Signal Accumulation
                </p>
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
                    {/* Signal breakdown */}
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

        {/* ═══ ZONE 3 — STRATEGIC OPPORTUNITIES ═══ */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}
          className="rounded-xl p-5 bg-card border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb size={14} style={{ color: "hsl(152 60% 44%)" }} />
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">Top Strategic Opportunities</p>
              <span className="text-[10px] font-bold text-muted-foreground">({topOpps.length})</span>
            </div>
            {graph && graph.nodes.length > 0 && (
              <button
                onClick={() => navigate(`${baseUrl}/insight-graph`)}
                className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors hover:opacity-80 min-h-[36px]"
                style={{ background: `${modeAccent}10`, color: modeAccent }}
              >
                <GitBranch size={11} /> View in Graph
              </button>
            )}
          </div>

          {topOpps.length > 0 ? (
            <OpportunityTable opps={topOpps} analysisId={analysisId!} />
          ) : (
            <div className="text-center py-10">
              <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center bg-muted mb-3">
                <Lightbulb size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-bold text-foreground">No opportunities detected yet</p>
              <p className="text-xs text-muted-foreground mt-1">Run the analysis pipeline to discover strategic opportunities.</p>
              <button
                onClick={() => navigate(`${baseUrl}/report`)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors min-h-[44px]"
                style={{ background: `${modeAccent}12`, color: modeAccent }}
              >
                <ArrowRight size={14} /> Start Analysis
              </button>
            </div>
          )}
        </motion.div>

        {/* ═══ ZONE 4 — INSIGHT GRAPH PREVIEW ═══ */}
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
                {["signal", "constraint", "leverage_point", "concept"].map(type => {
                  const count = graph.nodes.filter(n => n.type === type).length;
                  if (count === 0) return null;
                  const colors: Record<string, string> = {
                    signal: "hsl(229 89% 63%)", constraint: "hsl(0 72% 52%)",
                    leverage_point: "hsl(38 92% 50%)", concept: "hsl(152 60% 44%)",
                  };
                  return (
                    <span key={type} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: `${colors[type]}10`, color: colors[type] }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors[type] }} />
                      {count} {type.replace("_", " ")}
                    </span>
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

      </main>

      {/* Evidence Explorer Drilldown */}
      <EvidenceExplorer
        open={explorerDomain !== null}
        onClose={closeExplorer}
        domain={explorerDomain}
        evidence={allEvidence}
      />
    </div>
  );
}
