/**
 * Strategic Command Deck Dashboard
 *
 * Primary landing surface for every analysis. Shows strategic metrics,
 * insight radar, opportunity landscape snapshot, graph preview, and pipeline progress.
 * Shared across Product, Service, and Business Model modes.
 */

import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target, Shield, Crosshair, Lightbulb, GitBranch,
  ArrowRight, CheckCircle2, Circle, ChevronRight,
  BarChart3, Zap,
} from "lucide-react";
import type { InsightGraph } from "@/lib/insightGraph";
import type { CommandDeck } from "@/lib/systemIntelligence";
import { NODE_TYPE_CONFIG } from "@/lib/insightGraph";

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

interface StrategicDashboardProps {
  analysisId: string;
  analysisTitle: string;
  accentColor: string;
  /** Insight graph data */
  graph: InsightGraph | null;
  /** Command deck data (from systemIntelligence) */
  commandDeck: CommandDeck | null;
  /** Pipeline completion state */
  completedSteps: Set<string>;
}

// ═══════════════════════════════════════════════════════
//  PIPELINE CONFIG
// ═══════════════════════════════════════════════════════

const PIPELINE_STEPS = [
  { key: "report", label: "Report", step: 2 },
  { key: "disrupt", label: "Disrupt", step: 3 },
  { key: "redesign", label: "Redesign", step: 4 },
  { key: "stress-test", label: "Stress Test", step: 5 },
  { key: "pitch", label: "Pitch", step: 6 },
] as const;

// ═══════════════════════════════════════════════════════
//  METRIC CARD
// ═══════════════════════════════════════════════════════

function DashMetric({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 flex items-start gap-3"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-xl font-extrabold tabular-nums text-foreground mt-0.5">{value}</p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
//  INSIGHT RADAR (visual cluster)
// ═══════════════════════════════════════════════════════

function InsightRadar({ graph }: { graph: InsightGraph }) {
  const clusters = useMemo(() => {
    const map: Record<string, number> = {};
    graph.nodes.forEach(n => {
      const key = n.type;
      map[key] = (map[key] || 0) + 1;
    });
    return [
      { label: "Signals", count: (map["signal"] || 0), color: NODE_TYPE_CONFIG.signal.color },
      { label: "Constraints", count: (map["constraint"] || 0), color: NODE_TYPE_CONFIG.constraint.color },
      { label: "Assumptions", count: (map["assumption"] || 0), color: NODE_TYPE_CONFIG.assumption.color },
      { label: "Leverage", count: (map["leverage_point"] || 0) + (map["driver"] || 0), color: NODE_TYPE_CONFIG.leverage_point.color },
      { label: "Opportunities", count: (map["outcome"] || 0) + (map["flipped_idea"] || 0) + (map["concept"] || 0), color: NODE_TYPE_CONFIG.outcome.color },
    ].filter(c => c.count > 0);
  }, [graph]);

  const maxCount = Math.max(...clusters.map(c => c.count), 1);

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={14} className="text-muted-foreground" />
        <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Insight Radar</p>
      </div>
      {clusters.map(c => (
        <div key={c.label} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">{c.label}</span>
            <span className="text-xs font-extrabold tabular-nums" style={{ color: c.color }}>{c.count}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(c.count / maxCount) * 100}%` }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="h-full rounded-full"
              style={{ background: c.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  OPPORTUNITY CARDS (top 3)
// ═══════════════════════════════════════════════════════

function TopOpportunities({ commandDeck, accentColor }: { commandDeck: CommandDeck; accentColor: string }) {
  const opps = commandDeck.topOpportunities.slice(0, 3);
  if (opps.length === 0) return null;

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center gap-2">
        <Lightbulb size={14} style={{ color: "hsl(152 60% 44%)" }} />
        <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Top Opportunities</p>
      </div>
      {opps.map((opp, i) => (
        <motion.div
          key={opp.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-start gap-2.5 py-2 border-b border-border last:border-0"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-extrabold"
            style={{ background: "hsl(152 60% 44% / 0.12)", color: "hsl(152 60% 44%)" }}
          >
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-snug">{opp.label}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold tabular-nums" style={{ color: "hsl(152 60% 44%)" }}>
                Impact {opp.impact}/10
              </span>
              <span className="text-xs text-muted-foreground capitalize">{opp.confidence}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  PIPELINE PROGRESS
// ═══════════════════════════════════════════════════════

function PipelineProgress({ analysisId, completedSteps, accentColor }: {
  analysisId: string; completedSteps: Set<string>; accentColor: string;
}) {
  const navigate = useNavigate();
  const completionPct = Math.round((completedSteps.size / PIPELINE_STEPS.length) * 100);

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Pipeline Progress</p>
        <span className="text-xs font-extrabold tabular-nums" style={{ color: accentColor }}>{completionPct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completionPct}%`, background: accentColor }} />
      </div>
      <div className="flex flex-wrap gap-2">
        {PIPELINE_STEPS.map(s => {
          const done = completedSteps.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => navigate(`/analysis/${analysisId}/${s.key}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-muted"
              style={{
                background: done ? `${accentColor}12` : "hsl(var(--muted))",
                border: `1px solid ${done ? accentColor + "30" : "hsl(var(--border))"}`,
                color: done ? accentColor : "hsl(var(--muted-foreground))",
              }}
            >
              {done ? <CheckCircle2 size={12} /> : <Circle size={12} />}
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export const StrategicDashboard = memo(function StrategicDashboard({
  analysisId,
  analysisTitle,
  accentColor,
  graph,
  commandDeck,
  completedSteps,
}: StrategicDashboardProps) {
  const navigate = useNavigate();

  // Compute metrics
  const totalInsights = graph?.nodes.length ?? 0;
  const constraintCount = commandDeck?.topConstraints.length ?? 0;
  const oppScore = commandDeck?.topOpportunities.length
    ? Math.round(commandDeck.topOpportunities.reduce((sum, o) => sum + o.impact, 0) / commandDeck.topOpportunities.length * 10)
    : 0;
  const completionPct = Math.round((completedSteps.size / PIPELINE_STEPS.length) * 100);

  return (
    <div className="space-y-4">
      {/* Row 1: Strategic Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashMetric label="Total Insights" value={totalInsights} icon={Target} color={accentColor} />
        <DashMetric label="Constraints" value={constraintCount} icon={Shield} color="hsl(0 72% 50%)" />
        <DashMetric label="Opp. Score" value={oppScore} icon={Lightbulb} color="hsl(152 60% 44%)" />
        <DashMetric label="Pipeline" value={`${completionPct}%`} icon={Zap} color="hsl(38 92% 50%)" />
      </div>

      {/* Row 2 + 3: Insight Radar + Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {graph && graph.nodes.length > 0 && <InsightRadar graph={graph} />}
        {commandDeck && <TopOpportunities commandDeck={commandDeck} accentColor={accentColor} />}
      </div>

      {/* Row 4: Graph Snapshot CTA */}
      {graph && graph.nodes.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(`/analysis/${analysisId}/insight-graph`)}
          className="w-full rounded-xl p-5 flex items-center justify-between gap-4 transition-all hover:shadow-md group"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}15` }}>
              <GitBranch size={18} style={{ color: accentColor }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">Open Insight Graph Explorer</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {graph.nodes.length} nodes · {graph.edges.length} connections
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </motion.button>
      )}

      {/* Row 5: Pipeline Progress */}
      <PipelineProgress analysisId={analysisId} completedSteps={completedSteps} accentColor={accentColor} />
    </div>
  );
});
