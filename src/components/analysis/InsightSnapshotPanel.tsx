/**
 * INSIGHT SNAPSHOT PANEL
 *
 * Visual summary panel placed at the top of each step workspace.
 * Left: Key Insights cards, constraint signals, opportunity signals
 * Right: Insight Graph preview with "Open Insight Graph" button
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GitBranch, AlertTriangle, Lightbulb, Shield,
  TrendingUp, Zap, ArrowRight, Activity,
} from "lucide-react";
import type { SystemIntelligence } from "@/lib/systemIntelligence";
import type { InsightGraph } from "@/lib/insightGraph";
import {
  computeCommandDeckMetrics, type CommandDeckMetricsInput,
} from "@/lib/commandDeckMetrics";

interface InsightSnapshotPanelProps {
  intelligence: SystemIntelligence | null;
  graph: InsightGraph | null;
  analysisId: string;
  accentColor: string;
  completedSteps: Set<string>;
  /** Pipeline step data for aggregated metrics */
  products?: any[];
  selectedProduct?: any;
  disruptData?: any;
  redesignData?: any;
  stressTestData?: any;
  pitchDeckData?: any;
  governedData?: Record<string, unknown> | null;
  businessAnalysisData?: any;
}

const fadeUp = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

function MiniMetric({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border min-w-[140px]">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}12` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-extrabold tabular-nums text-foreground leading-none">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SignalChip({ label, type, impact }: { label: string; type: "constraint" | "opportunity"; impact: number }) {
  const color = type === "constraint" ? "hsl(0 72% 52%)" : "hsl(152 60% 44%)";
  const Icon = type === "constraint" ? Shield : Lightbulb;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm">
      <Icon size={12} style={{ color }} />
      <span className="text-foreground font-medium truncate flex-1">{label}</span>
      <span className="text-xs font-bold tabular-nums" style={{ color }}>{impact}/10</span>
    </div>
  );
}

export function InsightSnapshotPanel({
  intelligence, graph, analysisId, accentColor, completedSteps,
  products = [], selectedProduct, disruptData, redesignData,
  stressTestData, pitchDeckData, governedData, businessAnalysisData,
}: InsightSnapshotPanelProps) {
  const navigate = useNavigate();
  const baseUrl = `/analysis/${analysisId}`;

  const constraints = intelligence?.unifiedConstraintGraph || [];
  const opportunities = intelligence?.opportunities || [];
  const leveragePoints = intelligence?.leveragePoints || [];

  // Aggregated metrics from all pipeline steps
  const metrics = useMemo(() => computeCommandDeckMetrics({
    products, selectedProduct, disruptData, redesignData,
    stressTestData, pitchDeckData, governedData: governedData || null,
    businessAnalysisData, intelligence, completedSteps,
  }), [products, selectedProduct, disruptData, redesignData, stressTestData, pitchDeckData, governedData, businessAnalysisData, intelligence, completedSteps]);

  const topConstraints = useMemo(() =>
    [...constraints].sort((a, b) => b.impact - a.impact).slice(0, 3),
    [constraints]
  );
  const topOpportunities = useMemo(() =>
    [...opportunities].sort((a, b) => b.impact - a.impact).slice(0, 3),
    [opportunities]
  );

  const insightDensity = constraints.length + opportunities.length + leveragePoints.length;
  // Show panel when we have SI data OR aggregated metrics indicate signals
  const hasData = insightDensity > 0 || (graph && graph.nodes.length > 0) || metrics.constraintsCount > 0 || metrics.opportunityScore > 0;

  if (!hasData && completedSteps.size <= 1) return null;

  return (
    <motion.div {...fadeUp} transition={{ duration: 0.4 }}
      className="rounded-2xl overflow-hidden border border-border bg-card"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* LEFT: Key Insights */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: accentColor }} />
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-foreground">
              Intelligence Snapshot
            </h3>
          </div>

          {/* Mini metrics row */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            <MiniMetric label="Opportunities" value={metrics.opportunitiesIdentified} icon={Activity} color="hsl(229 89% 63%)" />
            <MiniMetric label="Constraints" value={metrics.constraintsDetected || constraints.length} icon={Shield} color="hsl(0 72% 52%)" />
            <MiniMetric label="Leverage" value={metrics.leveragePoints} icon={TrendingUp} color="hsl(38 92% 50%)" />
            <MiniMetric label="Risk" value={metrics.riskSignals} icon={AlertTriangle} color="hsl(0 72% 52%)" />
          </div>

          {/* Signal chips */}
          {(topConstraints.length > 0 || topOpportunities.length > 0) && (
            <div className="space-y-2">
              {topConstraints.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    <AlertTriangle size={10} className="inline mr-1" style={{ color: "hsl(0 72% 52%)" }} />
                    Top Constraints
                  </p>
                  <div className="space-y-1">
                    {topConstraints.map(c => (
                      <SignalChip key={c.id} label={c.label} type="constraint" impact={c.impact} />
                    ))}
                  </div>
                </div>
              )}
              {topOpportunities.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                    <Lightbulb size={10} className="inline mr-1" style={{ color: "hsl(152 60% 44%)" }} />
                    Top Opportunities
                  </p>
                  <div className="space-y-1">
                    {topOpportunities.map(o => (
                      <SignalChip key={o.id} label={o.label} type="opportunity" impact={o.impact} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {insightDensity === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                Complete more pipeline steps to generate intelligence signals.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Insight Graph Preview */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch size={14} style={{ color: accentColor }} />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-foreground">
                Insight Graph
              </h3>
            </div>

            {graph && graph.nodes.length > 0 ? (
              <div className="space-y-3">
                {/* Mini graph stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-muted p-2.5 text-center">
                    <p className="text-lg font-extrabold tabular-nums text-foreground">{graph.nodes.length}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Nodes</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2.5 text-center">
                    <p className="text-lg font-extrabold tabular-nums text-foreground">{graph.edges.length}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Edges</p>
                  </div>
                </div>

                {/* Node type breakdown */}
                <div className="flex flex-wrap gap-1.5">
                  {["signal", "constraint", "leverage_point", "concept"].map(type => {
                    const count = graph.nodes.filter(n => n.type === type).length;
                    if (count === 0) return null;
                    const colors: Record<string, string> = {
                      signal: "hsl(229 89% 63%)",
                      constraint: "hsl(0 72% 52%)",
                      leverage_point: "hsl(38 92% 50%)",
                      concept: "hsl(152 60% 44%)",
                    };
                    return (
                      <span key={type} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
                        style={{ background: `${colors[type]}12`, color: colors[type] }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors[type] }} />
                        {count} {type.replace("_", " ")}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center bg-muted mb-2">
                  <GitBranch size={18} className="text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Graph builds as you progress
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate(`${baseUrl}/insight-graph`)}
            className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: `${accentColor}15`, color: accentColor, border: `1.5px solid ${accentColor}30` }}
          >
            <GitBranch size={14} />
            Open Insight Graph
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
