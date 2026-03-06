/**
 * Command Deck Page — Strategic overview of the entire analysis.
 * URL: /analysis/:analysisId/command-deck
 *
 * Displays 5 KPI metrics, trend graph, pipeline status, sortable opportunities table,
 * and insight graph preview. Monitoring layer — no run triggers.
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
  Zap, Gauge, BarChart3,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

const PIPELINE_STEPS = [
  { key: "report", label: "Report", icon: Target, route: "report" },
  { key: "disrupt", label: "Disrupt", icon: Crosshair, route: "disrupt" },
  { key: "redesign", label: "Redesign", icon: Lightbulb, route: "redesign" },
  { key: "stress-test", label: "Stress Test", icon: AlertTriangle, route: "stress-test" },
  { key: "pitch", label: "Pitch", icon: Rocket, route: "pitch" },
] as const;

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

/* ── KPI Metric Card ── */
function KPICard({ label, value, subtitle, icon: Icon, color, delay = 0 }: {
  label: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; delay?: number;
}) {
  return (
    <motion.div {...fadeUp} transition={{ delay, duration: 0.4 }}
      className="rounded-xl p-5 flex items-start gap-4 bg-card border border-border"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}12` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground leading-none">{label}</p>
        <p className="text-3xl font-extrabold tabular-nums text-foreground mt-1.5 leading-none">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

/* ── Pipeline Step Row ── */
function PipelineRow({ step, status, analysisId }: {
  step: typeof PIPELINE_STEPS[number];
  status: "completed" | "outdated" | "not_run";
  analysisId: string;
}) {
  const navigate = useNavigate();
  const StepIcon = step.icon;
  const statusColor = status === "completed" ? "hsl(152 60% 44%)"
    : status === "outdated" ? "hsl(38 92% 50%)"
    : "hsl(var(--muted-foreground))";
  const StatusIcon = status === "completed" ? CheckCircle2
    : status === "outdated" ? AlertTriangle : Circle;
  const statusLabel = status === "completed" ? "Completed"
    : status === "outdated" ? "Outdated" : "Not Run";

  return (
    <button
      onClick={() => navigate(`/analysis/${analysisId}/${step.route}`)}
      className="flex items-center gap-3 px-3 py-3 rounded-lg transition-colors hover:bg-muted/50 w-full text-left min-h-[52px]"
      style={status === "outdated" ? {
        background: "hsl(38 92% 50% / 0.05)",
        border: "1px solid hsl(38 92% 50% / 0.15)",
      } : { border: "1px solid transparent" }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${statusColor}12` }}>
        <StepIcon size={16} style={{ color: statusColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground leading-none">{step.label}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <StatusIcon size={10} style={{ color: statusColor }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </div>
      <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
    </button>
  );
}

/* ── Sortable Opportunity Table ── */
function OpportunityTable({ opps, analysisId, modeAccent }: {
  opps: { id: string; label: string; impact: number; confidence: string; step: string; source: string }[];
  analysisId: string;
  modeAccent: string;
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
    <div>
      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_80px_90px] sm:grid-cols-[1fr_120px_80px_80px_90px] gap-2 px-3 py-2 border-b border-border">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Opportunity</span>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground hidden sm:block">Source</span>
        <button onClick={() => toggleSort("impact")}
          className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground text-center flex items-center gap-1 justify-center">
          Impact <ArrowUpDown size={8} />
        </button>
        <button onClick={() => toggleSort("confidence")}
          className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground text-center flex items-center gap-1 justify-center">
          Confidence <ArrowUpDown size={8} />
        </button>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground text-center">Step</span>
      </div>
      {/* Rows */}
      {sorted.map(opp => {
        const impactColor = opp.impact >= 8 ? "hsl(152 60% 44%)" : opp.impact >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";
        return (
          <button key={opp.id}
            onClick={() => navigate(`/analysis/${analysisId}/insight-graph?node=${opp.id}`)}
            className="grid grid-cols-[1fr_80px_80px_90px] sm:grid-cols-[1fr_120px_80px_80px_90px] gap-2 items-center px-3 py-3 rounded-lg hover:bg-muted/40 transition-colors text-left w-full min-h-[48px]"
          >
            <span className="text-sm font-semibold text-foreground truncate">{opp.label}</span>
            <span className="text-xs text-muted-foreground truncate hidden sm:block">{opp.source}</span>
            <span className="text-sm font-bold tabular-nums text-center" style={{ color: impactColor }}>{opp.impact}/10</span>
            <span className="text-xs font-bold capitalize text-center text-muted-foreground">{opp.confidence}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-center text-muted-foreground">{opp.step}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Main Page ── */
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
  const { intelligence, graph, completedSteps, pipelineCompletion } = autoAnalysis;

  // ── Compute 5 KPI metrics ──
  const constraints = intelligence?.unifiedConstraintGraph || [];
  const leveragePoints = intelligence?.leveragePoints || [];
  const opportunities = intelligence?.opportunities || [];
  const friction = intelligence?.expandedFriction;

  // 1. Insight Density — total nodes in the reasoning graph
  const insightDensity = constraints.length + leveragePoints.length + opportunities.length;

  // 2. Constraint Severity — avg impact of constraints (0-10)
  const constraintSeverity = constraints.length > 0
    ? Math.round(constraints.reduce((s, c) => s + c.impact, 0) / constraints.length * 10) / 10
    : 0;

  // 3. Breakthrough Potential — count of high-impact (>=7) opportunities
  const breakthroughPotential = opportunities.filter(o => o.impact >= 7).length;

  // 4. Leverage Index — avg impact of leverage points (0-10)
  const leverageIndex = leveragePoints.length > 0
    ? Math.round(leveragePoints.reduce((s, l) => s + l.impact, 0) / leveragePoints.length * 10) / 10
    : 0;

  // 5. Pipeline Completion
  const pipelinePct = pipelineCompletion;

  // ── Trend data ──
  const trendData = useMemo(() => {
    const oppScore = opportunities.length > 0
      ? Math.round(opportunities.reduce((s, o) => s + o.impact, 0) / opportunities.length * 10)
      : 0;
    return [
      { step: "Report", score: completedSteps.has("report") ? Math.max(20, oppScore * 0.3) : 0 },
      { step: "Disrupt", score: completedSteps.has("disrupt") ? Math.max(30, oppScore * 0.5) : 0 },
      { step: "Redesign", score: completedSteps.has("redesign") ? Math.max(40, oppScore * 0.7) : 0 },
      { step: "Stress Test", score: completedSteps.has("stress-test") ? Math.max(50, oppScore * 0.85) : 0 },
      { step: "Pitch", score: completedSteps.has("pitch") ? oppScore : 0 },
    ];
  }, [completedSteps, opportunities]);

  // ── Top opportunities for table ──
  const topOpps = useMemo(() => {
    const allOpps = [...(intelligence?.commandDeck.topOpportunities || [])];
    // Enrich with additional opportunities if < 8
    if (allOpps.length < 8) {
      const remaining = opportunities
        .filter(o => !allOpps.some(ao => ao.id === o.id))
        .slice(0, 8 - allOpps.length);
      allOpps.push(...remaining);
    }
    return allOpps.slice(0, 8).map(opp => ({
      id: opp.id,
      label: opp.label,
      impact: opp.impact,
      confidence: opp.confidence,
      step: "Disrupt",
      source: opp.evidence?.[0]?.slice(0, 40) || "Analysis",
    }));
  }, [intelligence, opportunities]);

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

  const baseUrl = `/analysis/${analysisId}`;

  return (
    <div className="min-h-screen bg-background" data-command-deck={workspaceTheme === "dark" ? "" : undefined}>
      <HeroSection tier={tier} remainingAnalyses={null} />
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <ModeBadge />
              <h1 className="typo-h1 truncate">{selectedProduct.name}</h1>
            </div>
          </div>
          <WorkspaceThemeToggle theme={workspaceTheme} onToggle={toggleTheme} />
        </div>

        {/* Workspace Nav */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[
            { label: "Command Deck", icon: LayoutDashboard, path: `${baseUrl}/command-deck`, active: true },
            { label: "Report", icon: Target, path: `${baseUrl}/report`, active: false },
            { label: "Disrupt", icon: Crosshair, path: `${baseUrl}/disrupt`, active: false },
            { label: "Redesign", icon: Lightbulb, path: `${baseUrl}/redesign`, active: false },
            { label: "Stress Test", icon: AlertTriangle, path: `${baseUrl}/stress-test`, active: false },
            { label: "Pitch", icon: Rocket, path: `${baseUrl}/pitch`, active: false },
            { label: "Insight Graph", icon: GitBranch, path: `${baseUrl}/insight-graph`, active: false },
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
              {nav.label}
            </button>
          ))}
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <KPICard label="Insight Density" value={insightDensity} subtitle="Total signals" icon={Zap} color="hsl(229 89% 63%)" delay={0.1} />
          <KPICard label="Constraint Severity" value={constraintSeverity} subtitle="Avg. impact" icon={Shield} color="hsl(0 72% 52%)" delay={0.15} />
          <KPICard label="Breakthrough" value={breakthroughPotential} subtitle="High-impact opps" icon={Lightbulb} color="hsl(152 60% 44%)" delay={0.2} />
          <KPICard label="Leverage Index" value={leverageIndex} subtitle="Avg. leverage" icon={Gauge} color="hsl(38 92% 50%)" delay={0.25} />
          <KPICard label="Pipeline" value={`${pipelinePct}%`} subtitle={`${completedSteps.size}/5 steps`} icon={BarChart3} color={modeAccent} delay={0.3} />
        </div>

        {/* Pipeline Status */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}
          className="rounded-xl p-5 space-y-3 bg-card border border-border"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Pipeline Status</p>
            <span className="text-sm font-extrabold tabular-nums" style={{ color: modeAccent }}>
              {completedSteps.size}/{PIPELINE_STEPS.length}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pipelinePct}%`, background: modeAccent }} />
          </div>
          <div className="space-y-1">
            {PIPELINE_STEPS.map(s => {
              const isDone = completedSteps.has(s.key);
              const isOutdated = analysis.outdatedSteps.has(s.key);
              const status: "completed" | "outdated" | "not_run" =
                isOutdated ? "outdated" : isDone ? "completed" : "not_run";
              return <PipelineRow key={s.key} step={s} status={status} analysisId={analysisId!} />;
            })}
          </div>
        </motion.div>

        {/* Trend Graph */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}
          className="rounded-xl p-5 bg-card border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-foreground" />
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">
              Insight Score — Pipeline Progression
            </p>
          </div>
          <div className="h-[200px] sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="step" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={modeAccent}
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: modeAccent, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                  activeDot={{ r: 7, fill: modeAccent }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Opportunities Table */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}
          className="rounded-xl p-5 bg-card border border-border"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb size={14} style={{ color: "hsl(152 60% 44%)" }} />
              <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Top Opportunities</p>
            </div>
            {graph && graph.nodes.length > 0 && (
              <button
                onClick={() => navigate(`${baseUrl}/insight-graph`)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                style={{ background: `${modeAccent}12`, color: modeAccent }}
              >
                <GitBranch size={12} /> Explore Graph
              </button>
            )}
          </div>

          {topOpps.length > 0 ? (
            <OpportunityTable opps={topOpps} analysisId={analysisId!} modeAccent={modeAccent} />
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Run the analysis pipeline to discover opportunities.
              </p>
              <button
                onClick={() => navigate(`${baseUrl}/report`)}
                className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                style={{ background: `${modeAccent}15`, color: modeAccent }}
              >
                <ArrowRight size={14} /> Start with Report
              </button>
            </div>
          )}
        </motion.div>

        {/* Insight Graph CTA */}
        {graph && graph.nodes.length > 0 && (
          <motion.button {...fadeUp} transition={{ delay: 0.3 }}
            onClick={() => navigate(`${baseUrl}/insight-graph`)}
            className="w-full rounded-xl p-4 flex items-center justify-between gap-4 transition-all hover:shadow-md group bg-card border border-border"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${modeAccent}12` }}>
                <GitBranch size={18} style={{ color: modeAccent }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Open Insight Graph Explorer</p>
                <p className="text-xs text-muted-foreground">{graph.nodes.length} nodes · {graph.edges.length} connections</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </motion.button>
        )}
      </main>
    </div>
  );
}
