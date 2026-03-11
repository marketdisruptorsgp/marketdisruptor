/**
 * Strategic Command Deck — Primary Analysis Workspace
 *
 * Central intelligence dashboard with 6 panels:
 *  1. Insight Summary (metrics row)
 *  2. Constraint Radar (polar visualization)
 *  3. Opportunity Landscape (scatter by leverage × feasibility)
 *  4. Breakthrough Opportunity (hero highlight)
 *  5. Strategic Pathways (top causal chains)
 *  6. Pipeline Progress (step status)
 *
 * Clicking insights navigates to Insight Graph; clicking opportunities
 * navigates to Redesign/Stress Test. Works on desktop and mobile.
 */

import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Shield, Crosshair, Lightbulb, GitBranch,
  CheckCircle2, Circle, ChevronRight, Zap, Rocket,
  ArrowRight, TrendingUp, AlertTriangle, Radio,
} from "lucide-react";
import type { InsightGraph, InsightGraphNode } from "@/lib/insightGraph";
import type { CommandDeck, ConstraintNode, OpportunityNode } from "@/lib/systemIntelligence";
import type { LeverageNode } from "@/lib/multiLensEngine";
import { NODE_TYPE_CONFIG } from "@/lib/insightGraph";

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

interface StrategicDashboardProps {
  analysisId: string;
  analysisTitle: string;
  accentColor: string;
  graph: InsightGraph | null;
  commandDeck: CommandDeck | null;
  completedSteps: Set<string>;
  outdatedSteps?: Set<string>;
  onRunStep?: (stepKey: string) => void;
  runningStep?: string | null;
}

const PIPELINE_STEPS = [
  { key: "report", label: "Report", action: "Run Intelligence Analysis", icon: Target },
  { key: "disrupt", label: "Disrupt", action: "Analyze Constraints", icon: Crosshair },
  { key: "redesign", label: "Redesign", action: "Generate Opportunities", icon: Lightbulb },
  { key: "stress-test", label: "Stress Test", action: "Run Strategy Stress Test", icon: AlertTriangle },
  { key: "pitch", label: "Pitch", action: "Generate Pitch", icon: Rocket },
] as const;

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

// ═══════════════════════════════════════════════════════
//  1. INSIGHT SUMMARY — Top Metrics Row
// ═══════════════════════════════════════════════════════

function MetricTile({ label, value, icon: Icon, color, delay = 0 }: {
  label: string; value: string | number; icon: React.ElementType; color: string; delay?: number;
}) {
  return (
    <motion.div {...fadeUp} transition={{ delay, duration: 0.4 }}
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}12` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground leading-none">{label}</p>
        <p className="text-2xl font-extrabold tabular-nums text-foreground mt-1 leading-none">{value}</p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
//  2. CONSTRAINT RADAR — Polar Cluster
// ═══════════════════════════════════════════════════════

function ConstraintRadar({ constraints, onSelect }: {
  constraints: ConstraintNode[]; onSelect: (id: string) => void;
}) {
  if (constraints.length === 0) return null;
  const sorted = [...constraints].sort((a, b) => b.impact - a.impact).slice(0, 6);
  const maxImpact = Math.max(...sorted.map(c => c.impact), 1);

  // Simple radial layout
  const cx = 120, cy = 120, maxR = 95;

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.15, duration: 0.5 }}
      className="rounded-xl p-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} className="text-foreground" />
        <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Constraint Radar</p>
      </div>
      <div className="flex justify-center">
        <svg viewBox="0 0 240 240" className="w-full max-w-[240px]" aria-label="Constraint radar">
          {/* Rings */}
          {[0.33, 0.66, 1].map(r => (
            <circle key={r} cx={cx} cy={cy} r={maxR * r}
              fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3 3" />
          ))}
          {/* Constraint nodes */}
          {sorted.map((c, i) => {
            const angle = (i / sorted.length) * Math.PI * 2 - Math.PI / 2;
            const r = maxR * (c.impact / maxImpact) * 0.85 + maxR * 0.15;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            const nodeR = 6 + (c.impact / maxImpact) * 10;
            const color = c.impact >= 7 ? "hsl(0 72% 52%)" : c.impact >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";

            return (
              <g key={c.id} onClick={() => onSelect(c.id)} className="cursor-pointer">
                <motion.circle
                  initial={{ r: 0, opacity: 0 }}
                  animate={{ r: nodeR, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                  cx={x} cy={y} fill={color} fillOpacity={0.15}
                  stroke={color} strokeWidth={1.5}
                />
                {c.impact >= 7 && (
                  <motion.circle cx={x} cy={y} r={nodeR + 4}
                    fill="none" stroke={color} strokeWidth={0.5} strokeOpacity={0.3}
                    initial={{ r: nodeR }}
                    animate={{ r: [nodeR + 2, nodeR + 6, nodeR + 2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                <text x={x} y={y + nodeR + 12}
                  textAnchor="middle" fontSize="8" fontWeight="700"
                  fill="hsl(var(--foreground))" className="pointer-events-none select-none"
                >
                  {c.label.length > 18 ? c.label.slice(0, 16) + "…" : c.label}
                </text>
              </g>
            );
          })}
          {/* Center label */}
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9" fontWeight="800"
            fill="hsl(var(--muted-foreground))" className="uppercase tracking-widest select-none">
            Constraints
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="18" fontWeight="900"
            fill="hsl(var(--foreground))" className="select-none">
            {sorted.length}
          </text>
        </svg>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
//  3. OPPORTUNITY LANDSCAPE — Scatter Plot
// ═══════════════════════════════════════════════════════

interface PlottedOpp {
  id: string;
  label: string;
  leverage: number;
  feasibility: number;
  impact: number;
  confidence: string;
}

function OpportunityLandscapeScatter({ opportunities, graph, onSelectOpp, onSelectNode, analysisId }: {
  opportunities: OpportunityNode[];
  graph: InsightGraph | null;
  onSelectOpp: (id: string) => void;
  onSelectNode: (id: string) => void;
  analysisId: string;
}) {
  const plotted = useMemo<PlottedOpp[]>(() => {
    if (!graph) {
      return opportunities.slice(0, 8).map(o => ({
        id: o.id, label: o.label,
        leverage: o.impact, feasibility: Math.max(3, 10 - o.impact + 3),
        impact: o.impact, confidence: o.confidence,
      }));
    }
    const oppNodes = graph.nodes
      .filter(n => ["outcome", "flipped_idea", "concept"].includes(n.type))
      .sort((a, b) => b.leverageScore - a.leverageScore)
      .slice(0, 10);

    return oppNodes.map(n => ({
      id: n.id, label: n.label,
      leverage: Math.min(10, n.leverageScore / 10),
      feasibility: n.confidence === "high" ? 8 : n.confidence === "medium" ? 6 : 4,
      impact: n.impact, confidence: n.confidence,
    }));
  }, [opportunities, graph]);

  if (plotted.length === 0) return null;

  const W = 320, H = 200, pad = 32;

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.2, duration: 0.5 }}
      className="rounded-xl p-4"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb size={14} style={{ color: "hsl(152 60% 44%)" }} />
          <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Opportunity Landscape</p>
        </div>
        <span className="text-xs text-muted-foreground">{plotted.length} mapped</span>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[280px]" aria-label="Opportunity scatter plot">
          {/* Quadrant lines */}
          <line x1={W / 2} y1={pad} x2={W / 2} y2={H - pad} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" />

          {/* Quadrant labels */}
          <text x={pad + 4} y={pad + 10} fontSize="7" fontWeight="700" fill="hsl(var(--muted-foreground))" className="uppercase select-none">Long Bets</text>
          <text x={W - pad - 4} y={pad + 10} fontSize="7" fontWeight="700" fill="hsl(152 60% 44%)" className="select-none" textAnchor="end">Breakthroughs</text>
          <text x={pad + 4} y={H - pad - 4} fontSize="7" fontWeight="700" fill="hsl(var(--muted-foreground))" className="uppercase select-none">Low Priority</text>
          <text x={W - pad - 4} y={H - pad - 4} fontSize="7" fontWeight="700" fill="hsl(38 92% 50%)" className="select-none" textAnchor="end">Quick Wins</text>

          {/* Axis labels */}
          <text x={W / 2} y={H - 4} fontSize="8" fontWeight="700" fill="hsl(var(--muted-foreground))" textAnchor="middle" className="uppercase tracking-widest select-none">Feasibility →</text>
          <text x={8} y={H / 2} fontSize="8" fontWeight="700" fill="hsl(var(--muted-foreground))" textAnchor="middle" className="uppercase tracking-widest select-none"
            transform={`rotate(-90, 8, ${H / 2})`}>Leverage →</text>

          {/* Dots */}
          {plotted.map((opp, i) => {
            const x = pad + ((opp.feasibility - 1) / 9) * (W - pad * 2);
            const y = (H - pad) - ((opp.leverage - 1) / 9) * (H - pad * 2);
            const r = 4 + (opp.impact / 10) * 6;
            const isHigh = opp.leverage >= 6 && opp.feasibility >= 6;
            const color = isHigh ? "hsl(152 60% 44%)" : "hsl(229 89% 63%)";

            return (
              <g key={opp.id} onClick={() => onSelectNode(opp.id)} className="cursor-pointer">
                <motion.circle
                  initial={{ r: 0, opacity: 0 }}
                  animate={{ r, opacity: 0.85 }}
                  transition={{ delay: 0.35 + i * 0.06, duration: 0.4 }}
                  cx={x} cy={y} fill={color} fillOpacity={0.2}
                  stroke={color} strokeWidth={1.5}
                />
                {isHigh && (
                  <motion.circle cx={x} cy={y} r={r + 3}
                    fill="none" stroke={color} strokeWidth={0.5} strokeOpacity={0.4}
                    animate={{ r: [r + 2, r + 5, r + 2] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 justify-center">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(152 60% 44%)" }} /> Breakthrough
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(229 89% 63%)" }} /> Developing
        </span>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
//  4. BREAKTHROUGH OPPORTUNITY — Hero Highlight
// ═══════════════════════════════════════════════════════

function BreakthroughHighlight({ graph, commandDeck, analysisId, onNavigate }: {
  graph: InsightGraph | null;
  commandDeck: CommandDeck | null;
  analysisId: string;
  onNavigate: (path: string) => void;
}) {
  const breakthrough = graph?.topNodes.breakthroughOpportunity ?? null;
  const topOpp = commandDeck?.topOpportunities[0] ?? null;

  const item = breakthrough || (topOpp ? {
    id: topOpp.id, label: topOpp.label, impact: topOpp.impact,
    confidence: topOpp.confidence, leverageScore: topOpp.impact * 10,
    type: "outcome" as const,
  } : null);

  if (!item) return null;

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.25, duration: 0.5 }}
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(152 60% 44% / 0.08), hsl(229 89% 63% / 0.06))",
        border: "1.5px solid hsl(152 60% 44% / 0.25)",
      }}
    >
      {/* Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(152 60% 44% / 0.4), transparent 70%)" }} />

      <div className="flex items-start gap-3 relative z-[1]">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "hsl(152 60% 44% / 0.15)" }}>
          <Rocket size={22} style={{ color: "hsl(152 60% 44%)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(152 60% 44%)" }}>
            Breakthrough Opportunity
          </p>
          <p className="text-base font-extrabold text-foreground mt-1 leading-snug">{item.label}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs font-extrabold tabular-nums" style={{ color: "hsl(152 60% 44%)" }}>
              {item.impact >= 8 ? "High impact" : item.impact >= 5 ? "Significant" : "Moderate"}
            </span>
            <span className="text-xs font-bold text-muted-foreground capitalize">{item.confidence}</span>
            {"leverageScore" in item && (
              <span className="text-xs font-bold tabular-nums text-muted-foreground">
                Leverage {(item as any).leverageScore}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 relative z-[1]">
        <button onClick={() => onNavigate(`/analysis/${analysisId}/insight-graph`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors hover:opacity-80"
          style={{ background: "hsl(152 60% 44% / 0.12)", color: "hsl(152 60% 44%)" }}>
          <GitBranch size={12} /> Explore in Graph
        </button>
        <button onClick={() => onNavigate(`/analysis/${analysisId}/redesign`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors hover:opacity-80"
          style={{ background: "hsl(229 89% 63% / 0.12)", color: "hsl(229 89% 63%)" }}>
          <ArrowRight size={12} /> Redesign
        </button>
        <button onClick={() => onNavigate(`/analysis/${analysisId}/stress-test`)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors hover:opacity-80"
          style={{ background: "hsl(38 92% 50% / 0.12)", color: "hsl(38 92% 50%)" }}>
          <AlertTriangle size={12} /> Stress Test
        </button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
//  5. STRATEGIC PATHWAYS — Top Causal Chains
// ═══════════════════════════════════════════════════════

function PathwaysSummary({ commandDeck, graph, onSelectNode }: {
  commandDeck: CommandDeck; graph: InsightGraph | null; onSelectNode: (id: string) => void;
}) {
  const chains = useMemo(() => {
    if (!graph || graph.nodes.length < 3) return [];
    const constraints = graph.nodes
      .filter(n => n.type === "constraint")
      .sort((a, b) => b.influence - a.influence)
      .slice(0, 3);

    return constraints.map(constraint => {
      const levEdges = graph.edges.filter(e => e.source === constraint.id && ["leads_to", "causes", "unlocks"].includes(e.relation));
      const levIds = new Set(levEdges.map(e => e.target));
      const leverage = graph.nodes.filter(n => levIds.has(n.id) && (n.type === "leverage_point" || n.type === "driver")).slice(0, 1);
      
      const oppIds = new Set<string>();
      leverage.forEach(lp => {
        graph.edges.filter(e => e.source === lp.id && ["unlocks", "leads_to"].includes(e.relation))
          .forEach(e => oppIds.add(e.target));
      });
      const opportunity = graph.nodes.filter(n => oppIds.has(n.id) && ["outcome", "concept", "flipped_idea"].includes(n.type)).slice(0, 1);

      return { constraint, leverage: leverage[0] || null, opportunity: opportunity[0] || null };
    }).filter(c => c.leverage || c.opportunity);
  }, [graph]);

  if (chains.length === 0 && commandDeck.topLeveragePoints.length === 0) return null;

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.3, duration: 0.5 }}
      className="rounded-xl p-4 space-y-3"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center gap-2">
        <Zap size={14} style={{ color: "hsl(var(--primary))" }} />
        <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Strategic Pathways</p>
        <span className="text-xs font-bold text-muted-foreground">({chains.length})</span>
      </div>

      {chains.map((chain, i) => (
        <motion.div key={chain.constraint.id}
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + i * 0.12 }}
          className="flex items-center gap-1.5 overflow-x-auto py-1"
        >
          <PathwayChip node={chain.constraint} onClick={() => onSelectNode(chain.constraint.id)} />
          {chain.leverage && (
            <>
              <ArrowRight size={12} className="text-muted-foreground flex-shrink-0" />
              <PathwayChip node={chain.leverage} onClick={() => onSelectNode(chain.leverage!.id)} />
            </>
          )}
          {chain.opportunity && (
            <>
              <ArrowRight size={12} className="text-muted-foreground flex-shrink-0" />
              <PathwayChip node={chain.opportunity} onClick={() => onSelectNode(chain.opportunity!.id)} />
            </>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

function PathwayChip({ node, onClick }: { node: InsightGraphNode; onClick: () => void }) {
  const cfg = NODE_TYPE_CONFIG[node.type];
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-all hover:scale-[1.02]"
      style={{ background: cfg.bgColor, border: `1px solid ${cfg.borderColor}`, color: cfg.color }}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
      <span className="text-foreground">{node.label}</span>
      <span className="opacity-70">{node.impact >= 8 ? "Strong" : node.impact >= 5 ? "Moderate" : "Early"}</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════
//  6. PIPELINE PROGRESS
// ═══════════════════════════════════════════════════════

function PipelineStatusPanel({ analysisId, completedSteps, outdatedSteps, accentColor, onRunStep, runningStep }: {
  analysisId: string; completedSteps: Set<string>; outdatedSteps: Set<string>;
  accentColor: string; onRunStep?: (key: string) => void; runningStep?: string | null;
}) {
  const navigate = useNavigate();
  const done = completedSteps.size;
  const total = PIPELINE_STEPS.length;

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.35, duration: 0.5 }}
      className="rounded-xl p-4 space-y-3"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Pipeline Status</p>
        <span className="text-sm font-extrabold tabular-nums" style={{ color: accentColor }}>
          {done}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(done / total) * 100}%`, background: accentColor }} />
      </div>

      {/* Step rows */}
      <div className="space-y-1">
        {PIPELINE_STEPS.map((s) => {
          const isDone = completedSteps.has(s.key);
          const isOutdated = outdatedSteps.has(s.key);
          const isRunning = runningStep === s.key;
          const status: "completed" | "outdated" | "not_run" =
            isOutdated ? "outdated" : isDone ? "completed" : "not_run";

          const StepIcon = s.icon;
          const statusColor = status === "completed" ? "hsl(152 60% 44%)"
            : status === "outdated" ? "hsl(38 92% 50%)"
            : "hsl(var(--muted-foreground))";
          const statusLabel = status === "completed" ? "Completed"
            : status === "outdated" ? "Outdated"
            : "Not Run";
          const StatusIcon = status === "completed" ? CheckCircle2
            : status === "outdated" ? AlertTriangle
            : Circle;

          return (
            <div key={s.key}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-muted/50 group"
              style={status === "outdated" ? {
                background: "hsl(38 92% 50% / 0.05)",
                border: "1px solid hsl(38 92% 50% / 0.15)",
              } : { border: "1px solid transparent" }}
            >
              {/* Step icon */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${statusColor}12` }}>
                <StepIcon size={14} style={{ color: statusColor }} />
              </div>

              {/* Label + status */}
              <button onClick={() => navigate(`/analysis/${analysisId}/${s.key}`)}
                className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold text-foreground leading-none">{s.label}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <StatusIcon size={10} style={{ color: statusColor }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: statusColor }}>
                    {statusLabel}
                  </span>
                </div>
              </button>

              {/* Run button — show for outdated or not_run */}
              {status !== "completed" && onRunStep && (
                <button
                  onClick={() => onRunStep(s.key)}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] disabled:opacity-50 flex-shrink-0"
                  style={{
                    background: status === "outdated" ? "hsl(38 92% 50% / 0.12)" : `${accentColor}12`,
                    color: status === "outdated" ? "hsl(38 92% 50%)" : accentColor,
                    border: `1px solid ${status === "outdated" ? "hsl(38 92% 50% / 0.25)" : accentColor + "25"}`,
                  }}
                >
                  {isRunning ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Circle size={10} />
                      </motion.div>
                      Running…
                    </>
                  ) : (
                    <>
                      <ArrowRight size={10} />
                      {s.action}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
//  INSIGHT GRAPH CTA
// ═══════════════════════════════════════════════════════

function GraphCTA({ graph, analysisId, accentColor }: {
  graph: InsightGraph; analysisId: string; accentColor: string;
}) {
  const navigate = useNavigate();
  return (
    <motion.button {...fadeUp} transition={{ delay: 0.4, duration: 0.4 }}
      onClick={() => navigate(`/analysis/${analysisId}/insight-graph`)}
      className="w-full rounded-xl p-4 flex items-center justify-between gap-4 transition-all hover:shadow-md group"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}12` }}>
          <GitBranch size={18} style={{ color: accentColor }} />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-foreground">Open Insight Graph Explorer</p>
          <p className="text-xs text-muted-foreground">{graph.nodes.length} nodes · {graph.edges.length} connections</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════

export const StrategicDashboard = memo(function StrategicDashboard({
  analysisId, analysisTitle, accentColor, graph, commandDeck, completedSteps,
  outdatedSteps = new Set(), onRunStep, runningStep,
}: StrategicDashboardProps) {
  const navigate = useNavigate();

  const totalInsights = graph?.nodes.length ?? 0;
  const constraintCount = commandDeck?.topConstraints.length ?? 0;
  const graphOppCount = graph?.nodes.filter(n => n.type === "opportunity").length ?? 0;
  const oppScore = commandDeck?.topOpportunities.length
    ? Math.round(commandDeck.topOpportunities.reduce((s, o) => s + o.impact, 0) / commandDeck.topOpportunities.length * 10)
    : graphOppCount > 0
      ? Math.min(100, graphOppCount * 15)
      : 0;
  const completionPct = Math.round((completedSteps.size / PIPELINE_STEPS.length) * 100);

  const handleNodeSelect = (nodeId: string) => {
    navigate(`/analysis/${analysisId}/insight-graph?node=${nodeId}`);
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile label="Total Insights" value={totalInsights} icon={Target} color={accentColor} delay={0} />
        <MetricTile label="Constraints" value={constraintCount} icon={Shield} color="hsl(0 72% 52%)" delay={0.05} />
        <MetricTile label="Opp. Score" value={oppScore} icon={Lightbulb} color="hsl(152 60% 44%)" delay={0.1} />
        <MetricTile label="Pipeline" value={`${completionPct}%`} icon={Zap} color="hsl(38 92% 50%)" delay={0.15} />
      </div>

      {/* Row 2: Constraint Radar + Opportunity Landscape */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {commandDeck && (
          <ConstraintRadar constraints={commandDeck.topConstraints} onSelect={handleNodeSelect} />
        )}
        {commandDeck && (
          <OpportunityLandscapeScatter
            opportunities={commandDeck.topOpportunities}
            graph={graph}
            onSelectOpp={(id) => navigate(`/analysis/${analysisId}/redesign`)}
            onSelectNode={handleNodeSelect}
            analysisId={analysisId}
          />
        )}
      </div>

      {/* Row 3: Breakthrough Opportunity */}
      <BreakthroughHighlight
        graph={graph}
        commandDeck={commandDeck}
        analysisId={analysisId}
        onNavigate={navigate}
      />

      {/* Row 4: Strategic Pathways */}
      {commandDeck && (
        <PathwaysSummary commandDeck={commandDeck} graph={graph} onSelectNode={handleNodeSelect} />
      )}

      {/* Row 5: Insight Graph CTA */}
      {graph && graph.nodes.length > 0 && (
        <GraphCTA graph={graph} analysisId={analysisId} accentColor={accentColor} />
      )}

      {/* Row 6: Pipeline Status */}
      <PipelineStatusPanel
        analysisId={analysisId}
        completedSteps={completedSteps}
        outdatedSteps={outdatedSteps}
        accentColor={accentColor}
        onRunStep={onRunStep}
        runningStep={runningStep}
      />
    </div>
  );
});
