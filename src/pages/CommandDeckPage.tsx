/**
 * Command Deck Page — Monitoring layer for an analysis.
 * URL: /analysis/:analysisId/command-deck
 *
 * Displays pipeline status, 5 core metrics, trend graph, and top opportunities table.
 * Does NOT contain run analysis triggers — those remain on step pages.
 */

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { useWorkspaceTheme } from "@/hooks/useWorkspaceTheme";
import { WorkspaceThemeToggle } from "@/components/WorkspaceThemeToggle";
import { buildSystemIntelligence, type SystemIntelligenceInput } from "@/lib/systemIntelligence";
import { buildInsightGraph } from "@/lib/insightGraph";
import { getStepConfigs } from "@/lib/stepConfigs";
import { HeroSection } from "@/components/HeroSection";
import { ModeBadge } from "@/components/ModeBadge";
import { StepNavigator } from "@/components/StepNavigator";
import { StepNavBar } from "@/components/SectionNav";
import { scrollToTop } from "@/utils/scrollToTop";
import { motion } from "framer-motion";
import {
  LayoutDashboard, GitBranch, Target, Shield, Lightbulb,
  Activity, Crosshair, AlertTriangle, CheckCircle2, Circle,
  ChevronRight, Rocket, TrendingUp, ArrowRight,
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

/* ── Metric Card ── */
function MetricCard({ label, value, subtitle, icon: Icon, color, delay = 0 }: {
  label: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; delay?: number;
}) {
  return (
    <motion.div {...fadeUp} transition={{ delay, duration: 0.4 }}
      className="rounded-xl p-5 flex items-start gap-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
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

/* ── Opportunity Table Row ── */
function OppRow({ label, leverage, constraint, impact, confidence, onClick }: {
  label: string; leverage: number; constraint: string;
  impact: number; confidence: string; onClick: () => void;
}) {
  const impactColor = impact >= 8 ? "hsl(152 60% 44%)" : impact >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";
  return (
    <button onClick={onClick}
      className="grid grid-cols-[1fr_80px_1fr_60px_70px] gap-2 items-center px-3 py-3 rounded-lg hover:bg-muted/40 transition-colors text-left w-full min-h-[48px]"
    >
      <span className="text-sm font-semibold text-foreground truncate">{label}</span>
      <span className="text-sm font-bold tabular-nums text-center" style={{ color: impactColor }}>{leverage}/10</span>
      <span className="text-xs text-muted-foreground truncate">{constraint}</span>
      <span className="text-sm font-bold tabular-nums text-center" style={{ color: impactColor }}>{impact}/10</span>
      <span className="text-xs font-bold capitalize text-center text-muted-foreground">{confidence}</span>
    </button>
  );
}

/* ── Main Page ── */
export default function CommandDeckPage() {
  const analysis = useAnalysis();
  const { tier } = useSubscription();
  const theme = useModeTheme();
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const { shouldRedirectHome } = useHydrationGuard();
  const { theme: workspaceTheme, toggle: toggleTheme } = useWorkspaceTheme();

  const { products, selectedProduct, analysisId } = analysis;
  const modeAccent = theme.primary;

  // Build intelligence
  const intelligence = useMemo(() => {
    if (!selectedProduct || !analysisId) return null;
    try {
      const input: SystemIntelligenceInput = {
        analysisId,
        governedData: analysis.governedData,
        disruptData: analysis.disruptData as Record<string, unknown> | null,
        businessAnalysisData: analysis.businessAnalysisData as Record<string, unknown> | null,
        intelData: null,
        flipIdeas: null,
        activeLenses: [],
      };
      return buildSystemIntelligence(input);
    } catch { return null; }
  }, [selectedProduct, analysisId, analysis.disruptData, analysis.governedData, analysis.businessAnalysisData]);

  const graph = useMemo(() => {
    return buildInsightGraph(
      products, intelligence,
      analysis.disruptData, analysis.redesignData, analysis.stressTestData,
    );
  }, [products, intelligence, analysis.disruptData, analysis.redesignData, analysis.stressTestData]);

  // Completed steps
  const completedSteps = useMemo(() => {
    const set = new Set<string>();
    if (products.length > 0) set.add("report");
    if (analysis.disruptData) set.add("disrupt");
    if (analysis.redesignData) set.add("redesign");
    if (analysis.stressTestData) set.add("stress-test");
    if (analysis.pitchDeckData) set.add("pitch");
    return set;
  }, [products, analysis.disruptData, analysis.redesignData, analysis.stressTestData, analysis.pitchDeckData]);

  // ── Compute 5 metrics (must be before early returns) ──
  const constraints = intelligence?.unifiedConstraintGraph || [];
  const leveragePoints = intelligence?.leveragePoints || [];
  const opportunities = intelligence?.opportunities || [];
  const friction = intelligence?.expandedFriction;

  const opportunityScore = opportunities.length > 0
    ? Math.round(opportunities.reduce((s, o) => s + o.impact, 0) / opportunities.length * 10)
    : 0;

  const frictionIndex = friction
    ? Math.round((friction.category.valueDelivery + friction.category.customerExperience +
        friction.category.operationalFlow + friction.category.marketStructure) / 4 * 10) / 10
    : 0;

  const constraintDensity = constraints.length;

  const leveragePotential = leveragePoints.length > 0
    ? Math.round(leveragePoints.reduce((s, l) => s + l.impact, 0) / leveragePoints.length * 10) / 10
    : 0;

  const strategicRiskScore = constraints.length > 0
    ? Math.round(constraints.filter(c => c.impact >= 7).length / constraints.length * 100)
    : 0;

  // ── Trend data (pipeline progression) ──
  const trendData = useMemo(() => {
    const steps = [
      { step: "Report", score: completedSteps.has("report") ? Math.max(20, opportunityScore * 0.3) : 0 },
      { step: "Disrupt", score: completedSteps.has("disrupt") ? Math.max(30, opportunityScore * 0.5) : 0 },
      { step: "Redesign", score: completedSteps.has("redesign") ? Math.max(40, opportunityScore * 0.7) : 0 },
      { step: "Stress Test", score: completedSteps.has("stress-test") ? Math.max(50, opportunityScore * 0.85) : 0 },
      { step: "Pitch", score: completedSteps.has("pitch") ? opportunityScore : 0 },
    ];
    return steps;
  }, [completedSteps, opportunityScore]);

  // ── Top opportunities for table ──
  const topOpps = useMemo(() => {
    const allOpps = [...(intelligence?.commandDeck.topOpportunities || [])];
    return allOpps.slice(0, 8).map(opp => {
      const relatedConstraint = constraints.find(c =>
        c.evidence.some(e => opp.evidence.some(oe => e.includes(oe.slice(0, 20))))
      );
      return {
        ...opp,
        constraintBroken: relatedConstraint?.label || "—",
        leverageScore: opp.impact,
      };
    });
  }, [intelligence, constraints]);

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
          <div className="flex items-center gap-2 flex-shrink-0">
            <WorkspaceThemeToggle theme={workspaceTheme} onToggle={toggleTheme} />
          </div>
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

        {/* Section 1: Pipeline Status */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }}
          className="rounded-xl p-5 space-y-3"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Pipeline Status</p>
            <span className="text-sm font-extrabold tabular-nums" style={{ color: modeAccent }}>
              {completedSteps.size}/{PIPELINE_STEPS.length}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(completedSteps.size / PIPELINE_STEPS.length) * 100}%`, background: modeAccent }} />
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

        {/* Section 2: Core Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard label="Opportunity Score" value={opportunityScore} icon={Lightbulb} color="hsl(152 60% 44%)" delay={0.1} />
          <MetricCard label="Friction Index" value={frictionIndex} subtitle="System resistance" icon={Activity} color="hsl(0 72% 52%)" delay={0.15} />
          <MetricCard label="Constraints" value={constraintDensity} icon={Shield} color="hsl(38 92% 50%)" delay={0.2} />
          <MetricCard label="Leverage" value={leveragePotential} subtitle="Avg. impact" icon={Crosshair} color="hsl(229 89% 63%)" delay={0.25} />
          <MetricCard label="Risk Score" value={`${strategicRiskScore}%`} subtitle="High-impact %" icon={AlertTriangle} color="hsl(0 72% 52%)" delay={0.3} />
        </div>

        {/* Section 3: Trend Graph */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}
          className="rounded-xl p-5"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-foreground" />
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Opportunity Score — Pipeline Progression</p>
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

        {/* Section 4: Top Opportunities Table */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}
          className="rounded-xl p-5"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
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
            <div>
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_1fr_60px_70px] gap-2 px-3 py-2 border-b"
                style={{ borderColor: "hsl(var(--border))" }}>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Opportunity</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground text-center">Leverage</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Constraint Broken</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground text-center">Impact</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground text-center">Confidence</span>
              </div>
              {/* Rows */}
              {topOpps.map(opp => (
                <OppRow
                  key={opp.id}
                  label={opp.label}
                  leverage={opp.leverageScore}
                  constraint={opp.constraintBroken}
                  impact={opp.impact}
                  confidence={opp.confidence}
                  onClick={() => navigate(`${baseUrl}/insight-graph?node=${opp.id}`)}
                />
              ))}
            </div>
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
            className="w-full rounded-xl p-4 flex items-center justify-between gap-4 transition-all hover:shadow-md group"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
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
