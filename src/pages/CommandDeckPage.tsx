/**
 * Command Deck V2 — Strategic Mission Control Dashboard
 * URL: /analysis/:analysisId/command-deck
 *
 * Five zones:
 *   Header  — Analysis name, mode, Strategic Potential Score
 *   Zone 1  — 5 strategic metric cards
 *   Zone 2  — Pipeline intelligence (progress + trend chart)
 *   Zone 3  — Strategic opportunities table
 *   Zone 4  — Insight Graph preview + system intelligence
 */

import { useMemo, useState } from "react";
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
import { motion } from "framer-motion";
import {
  LayoutDashboard, GitBranch, Target, Shield, Lightbulb,
  Activity, Crosshair, AlertTriangle, CheckCircle2, Circle,
  ChevronRight, Rocket, TrendingUp, ArrowRight, ArrowUpDown,
  Zap, BarChart3, Info, ExternalLink,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  computeCommandDeckMetrics, computeTrendData, aggregateOpportunities,
  type CommandDeckMetrics as DeckMetrics,
} from "@/lib/commandDeckMetrics";

const PIPELINE_STEPS = [
  { key: "report", label: "Report", icon: Target, route: "report" },
  { key: "disrupt", label: "Disrupt", icon: Crosshair, route: "disrupt" },
  { key: "redesign", label: "Redesign", icon: Lightbulb, route: "redesign" },
  { key: "stress-test", label: "Stress Test", icon: AlertTriangle, route: "stress-test" },
  { key: "pitch", label: "Pitch", icon: Rocket, route: "pitch" },
] as const;

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

/* ════════════════════════════════════════════════════════
 * STRATEGIC POTENTIAL GAUGE — Large headline metric
 * ════════════════════════════════════════════════════════ */
function StrategicPotentialGauge({ score, accent }: { score: number; accent: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 10, 1);
  const offset = circ * (1 - pct);
  const tier = score >= 7 ? "High" : score >= 4 ? "Moderate" : "Low";
  const tierColor = score >= 7 ? "hsl(152 60% 44%)" : score >= 4 ? "hsl(38 92% 50%)" : "hsl(0 72% 52%)";

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex-shrink-0">
        <svg width="124" height="124" viewBox="0 0 124 124" className="transform -rotate-90">
          <circle cx="62" cy="62" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="7" />
          <motion.circle
            cx="62" cy="62" r={r} fill="none"
            stroke={accent} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
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
 * METRIC CARD — With trend indicator + tooltip
 * ════════════════════════════════════════════════════════ */
function MetricCard({ label, value, description, icon: Icon, color, delay = 0, trend, onClick }: {
  label: string; value: string | number; description: string;
  icon: React.ElementType; color: string; delay?: number;
  trend?: "up" | "down" | "neutral"; onClick?: () => void;
}) {
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "—";
  const trendColor = trend === "up" ? "hsl(152 60% 44%)" : trend === "down" ? "hsl(0 72% 52%)" : "hsl(var(--muted-foreground))";

  return (
    <motion.button
      {...fadeUp}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className="rounded-xl p-4 text-left bg-card border border-border hover:border-primary/20 transition-all group min-h-[120px] flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}12` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold" style={{ color: trendColor }}>{trendIcon}</span>
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-extrabold tabular-nums text-foreground leading-none">{value}</p>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mt-1.5">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
          {description}
        </p>
      </div>
    </motion.button>
  );
}

/* ════════════════════════════════════════════════════════
 * PIPELINE STEP — Compact row
 * ════════════════════════════════════════════════════════ */
function PipelineStep({ step, status, analysisId, accent }: {
  step: typeof PIPELINE_STEPS[number];
  status: "completed" | "outdated" | "not_run";
  analysisId: string;
  accent: string;
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
 * OPPORTUNITY TABLE — Sortable
 * ════════════════════════════════════════════════════════ */
function OpportunityTable({ opps, analysisId }: {
  opps: { id: string; label: string; impact: number; confidence: string; step: string; source: string }[];
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

  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-[1fr_70px_70px_80px] sm:grid-cols-[1fr_120px_70px_70px_80px] gap-2 px-3 py-2 border-b border-border min-w-[400px]">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Opportunity</span>
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
        return (
          <button key={opp.id}
            onClick={() => navigate(`/analysis/${analysisId}/insight-graph?node=${opp.id}`)}
            className="grid grid-cols-[1fr_70px_70px_80px] sm:grid-cols-[1fr_120px_70px_70px_80px] gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors text-left w-full min-h-[44px] min-w-[400px]"
          >
            <span className="text-sm font-semibold text-foreground truncate">{opp.label}</span>
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

  const { selectedProduct, analysisId } = analysis;
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
  const trendData = useMemo(() => computeTrendData(metricsInput), [metricsInput]);
  const topOpps = useMemo(() => aggregateOpportunities(metricsInput), [metricsInput]);

  // ── Strategic Potential Score ──
  const strategicPotential = useMemo(() => {
    const raw = (metrics.opportunityScore + metrics.leverageScore)
      - (metrics.frictionIndex * 0.5)
      - (metrics.riskScore * 0.3);
    // Normalize to 0-10 range
    return Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
  }, [metrics]);

  // ── Trend indicators for metric cards ──
  const getTrend = (value: number): "up" | "down" | "neutral" =>
    value >= 6 ? "up" : value >= 3 ? "neutral" : "down";

  const pipelinePct = metrics.pipelineCompletion;
  const baseUrl = `/analysis/${analysisId}`;

  if (analysis.step !== "done" || !selectedProduct) {
    if (shouldRedirectHome) return null;
    return (
      <div className="min-h-screen bg-background" data-command-deck={workspaceTheme === "dark" ? "" : undefined}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
        </div>
      </div>
    );
  }

  // Mode label
  const modeLabel = analysis.activeMode === "custom" ? "Product"
    : analysis.activeMode === "service" ? "Service" : "Business Model";

  return (
    <div className="min-h-screen bg-background" data-command-deck={workspaceTheme === "dark" ? "" : undefined}>
      <HeroSection tier={tier} remainingAnalyses={null} />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">

        {/* ═══ HEADER — Analysis name + Strategic Potential ═══ */}
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
                    Partial
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground truncate">{selectedProduct.name}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {completedSteps.size}/{PIPELINE_STEPS.length} steps completed
                {metrics.contributingSources.length > 0 && ` · Sources: ${metrics.contributingSources.join(", ")}`}
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

        {/* ═══ ZONE 1 — SIGNAL COUNT METRICS ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard
            label="Opportunities" value={metrics.opportunitiesIdentified} icon={Lightbulb}
            color="hsl(229 89% 63%)" delay={0.05}
            description="Strategic opportunities discovered across the analysis."
            trend={metrics.opportunitiesIdentified >= 5 ? "up" : metrics.opportunitiesIdentified >= 2 ? "neutral" : "down"}
          />
          <MetricCard
            label="Constraints" value={metrics.constraintsDetected} icon={Shield}
            color="hsl(0 72% 52%)" delay={0.1}
            description="Structural blockers and constraints detected."
            trend={metrics.constraintsDetected >= 8 ? "down" : "neutral"}
          />
          <MetricCard
            label="Assumptions" value={metrics.assumptionsChallenged} icon={Crosshair}
            color="hsl(38 92% 50%)" delay={0.15}
            description="Hidden assumptions identified and challenged."
            trend={metrics.assumptionsChallenged >= 3 ? "up" : "neutral"}
          />
          <MetricCard
            label="Leverage Pts" value={metrics.leveragePoints} icon={Zap}
            color="hsl(152 60% 44%)" delay={0.2}
            description="Leverage points and hidden value signals found."
            trend={metrics.leveragePoints >= 4 ? "up" : "neutral"}
          />
          <MetricCard
            label="Risk Signals" value={metrics.riskSignals} icon={AlertTriangle}
            color="hsl(0 72% 52%)" delay={0.25}
            description="Risk signals from stress testing and feasibility checks."
            trend={metrics.riskSignals >= 6 ? "down" : metrics.riskSignals >= 2 ? "neutral" : "up"}
          />
        </div>

        {/* ═══ ZONE 2 — PIPELINE INTELLIGENCE ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
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
                return <PipelineStep key={s.key} step={s} status={status} analysisId={analysisId!} accent={modeAccent} />;
              })}
            </div>
          </motion.div>

          {/* Trend Chart */}
          <motion.div {...fadeUp} transition={{ delay: 0.15 }}
            className="rounded-xl p-5 bg-card border border-border"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-foreground" />
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">
                Opportunity Score — Pipeline Progression
              </p>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 15, bottom: 5, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="step" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Line
                    type="monotone" dataKey="score"
                    stroke={modeAccent} strokeWidth={2.5}
                    dot={{ r: 4, fill: modeAccent, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                    activeDot={{ r: 6, fill: modeAccent }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* ═══ STRATEGIC TIMELINE — Signals per pipeline step ═══ */}
        <motion.div {...fadeUp} transition={{ delay: 0.18 }}
          className="rounded-xl p-5 bg-card border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-foreground" />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">
              Strategic Timeline — Signals by Step
            </p>
          </div>
          <div className="space-y-2">
            {metrics.stepSignals.map((ss, si) => {
              const maxSignals = Math.max(...metrics.stepSignals.map(s => s.signals), 1);
              const pct = Math.round((ss.signals / maxSignals) * 100);
              const stepIcon = PIPELINE_STEPS.find(p => p.key === ss.key);
              const StepIcon = stepIcon?.icon || Target;
              return (
                <motion.div
                  key={ss.key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: si * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-20 flex items-center gap-1.5 flex-shrink-0">
                    <StepIcon size={12} className="text-muted-foreground" />
                    <span className="text-[10px] font-bold text-foreground truncate">{ss.step}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-5 rounded-md overflow-hidden bg-muted relative">
                      <motion.div
                        className="h-full rounded-md"
                        initial={{ width: 0 }}
                        animate={{ width: ss.hasData ? `${Math.max(pct, 4)}%` : "0%" }}
                        transition={{ duration: 0.6, delay: 0.1 + si * 0.05 }}
                        style={{ background: ss.hasData ? modeAccent : "hsl(var(--muted))" }}
                      />
                      {/* Breakdown chips inside bar */}
                      {ss.hasData && ss.breakdown.length > 0 && (
                        <div className="absolute inset-0 flex items-center px-2 gap-1.5 overflow-hidden">
                          {ss.breakdown.slice(0, 3).map((b, bi) => (
                            <span key={bi} className="text-[8px] font-bold whitespace-nowrap opacity-90"
                              style={{ color: pct > 30 ? "white" : "hsl(var(--foreground))" }}>
                              {b.count} {b.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-extrabold tabular-nums w-8 text-right text-foreground">
                      {ss.hasData ? ss.signals : "—"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {/* Total */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Total Signals</span>
            <span className="text-lg font-extrabold tabular-nums text-foreground">
              {metrics.stepSignals.reduce((s, ss) => s + (ss.hasData ? ss.signals : 0), 0)}
            </span>
          </div>
        </motion.div>

        {/* ═══ ZONE 3 — STRATEGIC OPPORTUNITIES ═══ */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}
          className="rounded-xl p-5 bg-card border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb size={14} style={{ color: "hsl(152 60% 44%)" }} />
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">Strategic Opportunities</p>
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

        {/* ═══ ZONE 4 — SYSTEM INTELLIGENCE (Insight Graph Preview) ═══ */}
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
                {/* Node count */}
                <div className="rounded-xl p-4 text-center bg-muted/50">
                  <p className="text-3xl font-extrabold tabular-nums text-foreground leading-none">{graph.nodes.length}</p>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mt-1.5">Insight Nodes</p>
                </div>
                {/* Connection count */}
                <div className="rounded-xl p-4 text-center bg-muted/50">
                  <p className="text-3xl font-extrabold tabular-nums text-foreground leading-none">{graph.edges.length}</p>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mt-1.5">Connections</p>
                </div>
                {/* Intelligence density */}
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

            {/* Node type breakdown */}
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

          {/* CTA */}
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
    </div>
  );
}
