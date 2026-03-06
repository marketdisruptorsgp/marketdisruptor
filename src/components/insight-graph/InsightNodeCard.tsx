/**
 * Insight Node Detail Card — Reasoning Explorer Panel
 *
 * Right-side panel shown when a user clicks a node in the Insight Graph.
 * Displays: headline, reasoning, leverage score, linked nodes, evidence chain,
 * downstream opportunities influenced.
 */

import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, ArrowDown, ChevronDown, ExternalLink, Zap, Target, Wrench, ChevronRight, FlaskConical, Bookmark, Search, AlertTriangle, TrendingUp, Info } from "lucide-react";
import type { InsightGraphNode, InsightGraph } from "@/lib/insightGraph";
import { getInsightChain, NODE_TYPE_CONFIG, OPPORTUNITY_NODE_TYPES } from "@/lib/insightGraph";
import { getToolById, type LensTool } from "@/lib/lensToolkitRegistry";
import { recommendToolsForInsight, type ToolRecommendation } from "@/lib/toolReasoningEngine";

interface InsightNodeCardProps {
  node: InsightGraphNode;
  graph: InsightGraph;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  onOpenTool?: (tool: LensTool) => void;
  isMobile?: boolean;
}

export const InsightNodeCard = memo(function InsightNodeCard({
  node, graph, onClose, onSelectNode, onOpenTool, isMobile = false,
}: InsightNodeCardProps) {
  const config = NODE_TYPE_CONFIG[node.type];
  const chain = useMemo(() => getInsightChain(graph, node.id), [graph, node.id]);
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [activeSection, setActiveSection] = useState<"chain" | "linked" | "evidence">("chain");

  // Reasoning-driven tool recommendations
  const toolRecommendations = useMemo(() => {
    return recommendToolsForInsight(
      { label: node.label, detail: node.detail, type: node.type, reasoning: node.reasoning },
      node.evidence,
    );
  }, [node]);

  const relatedTools = useMemo(() => toolRecommendations.map(r => r.tool), [toolRecommendations]);

  // Linked nodes (direct connections)
  const linkedNodes = useMemo(() => {
    const ids = new Set<string>();
    graph.edges.forEach(e => {
      if (e.source === node.id) ids.add(e.target);
      if (e.target === node.id) ids.add(e.source);
    });
    return graph.nodes.filter(n => ids.has(n.id));
  }, [graph, node.id]);

  // Downstream effects
  const downstream = useMemo(() => {
    return graph.edges
      .filter(e => e.source === node.id)
      .map(e => ({ edge: e, node: graph.nodes.find(n => n.id === e.target) }))
      .filter(d => d.node);
  }, [graph, node.id]);

  // Upstream causes
  const upstream = useMemo(() => {
    return graph.edges
      .filter(e => e.target === node.id)
      .map(e => ({ edge: e, node: graph.nodes.find(n => n.id === e.source) }))
      .filter(d => d.node);
  }, [graph, node.id]);

  // Opportunities influenced (downstream BFS)
  const influencedOpportunities = useMemo(() => {
    const visited = new Set<string>();
    const opps: InsightGraphNode[] = [];
    const queue = [node.id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const outgoing = graph.edges.filter(e => e.source === current);
      for (const e of outgoing) {
        const target = graph.nodes.find(n => n.id === e.target);
        if (target && OPPORTUNITY_NODE_TYPES.includes(target.type)) {
          opps.push(target);
        }
        if (!visited.has(e.target)) queue.push(e.target);
      }
    }
    return opps;
  }, [graph, node.id]);

  const isTopLeverage = graph.topNodes.primaryConstraint?.id === node.id;
  const isBreakthrough = graph.topNodes.breakthroughOpportunity?.id === node.id;

  // Mobile: bottom sheet. Desktop: absolute right panel inside graph canvas.
  const mobileClasses = "fixed inset-x-0 bottom-0 w-full max-h-[70vh] rounded-t-2xl z-50";
  const desktopClasses = "absolute right-4 top-4 w-80 max-h-[calc(100%-32px)] rounded-2xl z-30";

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
      )}
      <motion.div
        initial={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, x: 20 }}
        animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
        exit={isMobile ? { opacity: 0, y: 100 } : { opacity: 0, x: 20 }}
        transition={{ duration: 0.25 }}
        className={`${isMobile ? mobileClasses : desktopClasses} overflow-y-auto shadow-2xl`}
        style={{
          background: "hsl(var(--card))",
          border: `2px solid ${config.borderColor}`,
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Drag handle on mobile */}
        {isMobile && (
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        )}
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: config.bgColor, border: `1.5px solid ${config.borderColor}` }}
          >
            <div className="w-3.5 h-3.5 rounded-full" style={{ background: config.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: config.color }}>
              {config.label}
            </p>
            <p className="text-sm font-bold text-foreground leading-snug">{node.label}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors flex-shrink-0">
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>

      {/* System Leverage Point badge */}
      {isTopLeverage && (
        <div
          className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: `${config.color}15`, border: `1px solid ${config.color}30` }}
        >
          <Zap size={14} style={{ color: config.color }} />
          <span className="text-xs font-bold" style={{ color: config.color }}>
            System Leverage Point — Highest structural influence
          </span>
        </div>
      )}

      {/* Breakthrough Opportunity badge */}
      {isBreakthrough && (
        <div
          className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: `${config.color}15`, border: `1px solid ${config.color}30` }}
        >
          <Target size={14} style={{ color: config.color }} />
          <span className="text-xs font-bold" style={{ color: config.color }}>
            Breakthrough Opportunity — Highest leverage potential
          </span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="px-4 pb-3 grid grid-cols-4 gap-1.5">
        <MetricPill label="Impact" value={`${node.impact}/10`} color={config.color} />
        <MetricPill label="Leverage" value={`${node.leverageScore}`} color={config.color} />
        <MetricPill label="Influence" value={`${node.influence}`} color={config.color} />
        <MetricPill label="Conf." value={node.confidence} color={config.color} />
      </div>

      {/* ── INSIGHT — Core statement ── */}
      {node.reasoning && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
            Insight
          </p>
          <p className="text-sm font-semibold text-foreground leading-relaxed">
            {node.label}
          </p>
        </div>
      )}

      {/* ── WHY IT MATTERS — Structural explanation ── */}
      {node.reasoning && (
        <div className="mx-4 mb-3 rounded-lg p-3" style={{ background: `${config.color}08`, border: `1px solid ${config.color}15` }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Info size={11} style={{ color: config.color }} />
            <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: config.color }}>
              Why It Matters
            </p>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {node.reasoning}
          </p>
        </div>
      )}

      {/* ── STRATEGIC IMPLICATION — Opportunity or risk ── */}
      {influencedOpportunities.length > 0 && (
        <div className="mx-4 mb-3 rounded-lg p-3" style={{ background: "hsl(152 60% 44% / 0.06)", border: "1px solid hsl(152 60% 44% / 0.15)" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp size={11} style={{ color: "hsl(152 60% 44%)" }} />
            <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(152 60% 44%)" }}>
              Strategic Implication
            </p>
          </div>
          <p className="text-xs font-semibold text-foreground leading-relaxed">
            {influencedOpportunities[0].label}
          </p>
          {influencedOpportunities.length > 1 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              +{influencedOpportunities.length - 1} more opportunities influenced
            </p>
          )}
        </div>
      )}

      {/* Risk implication for constraint/risk nodes */}
      {(node.type === "constraint" || node.type === "risk") && !influencedOpportunities.length && (
        <div className="mx-4 mb-3 rounded-lg p-3" style={{ background: "hsl(0 72% 52% / 0.06)", border: "1px solid hsl(0 72% 52% / 0.15)" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle size={11} style={{ color: "hsl(0 72% 52%)" }} />
            <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(0 72% 52%)" }}>
              Risk Signal
            </p>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            This {node.type === "constraint" ? "constraint" : "risk"} may limit strategic options. Impact: {node.impact}/10.
          </p>
        </div>
      )}

      {/* ── TOOLS — Always visible if available ── */}
      {toolRecommendations.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
            Explore With Tools
          </p>
          <div className="space-y-1.5">
            {toolRecommendations.slice(0, 3).map(rec => {
              const ToolIcon = rec.tool.icon;
              return (
                <button
                  key={rec.tool.id}
                  onClick={() => onOpenTool?.(rec.tool)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/40 transition-all text-left"
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${rec.tool.accentColor}12` }}>
                    <ToolIcon size={12} style={{ color: rec.tool.accentColor }} />
                  </div>
                  <span className="text-xs font-bold text-foreground flex-1 truncate">{rec.tool.title}</span>
                  <span className="text-[9px] font-bold tabular-nums text-muted-foreground">{Math.round(rec.score * 100)}%</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Opportunities influenced — compact list */}
      {influencedOpportunities.length > 1 && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
            Opportunities ({influencedOpportunities.length})
          </p>
          <div className="space-y-1">
            {influencedOpportunities.slice(0, 4).map(opp => {
              const oc = NODE_TYPE_CONFIG[opp.type];
              return (
                <button
                  key={opp.id}
                  onClick={() => onSelectNode(opp.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: oc.color }} />
                  <p className="text-xs font-semibold text-foreground truncate flex-1">{opp.label}</p>
                  <span className="text-xs font-bold tabular-nums" style={{ color: oc.color }}>Lev. {opp.leverageScore}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Section tabs */}
      <div className="px-4 pb-2 flex items-center gap-1 flex-wrap">
        {(["chain", "linked", "evidence"] as const).map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className="px-2.5 py-1 rounded-md text-xs font-bold capitalize transition-all"
            style={{
              background: activeSection === s ? config.bgColor : "transparent",
              color: activeSection === s ? config.color : "hsl(var(--muted-foreground))",
              border: activeSection === s ? `1px solid ${config.borderColor}` : "1px solid transparent",
            }}
          >
            {s === "chain" ? `Chain (${chain.length})` : s === "linked" ? `Linked (${linkedNodes.length})` : `Evidence (${node.evidenceCount})`}
          </button>
        ))}
      </div>

      {/* Insight Chain */}
      {activeSection === "chain" && chain.length > 1 && (
        <div className="px-4 pb-4">
          <div className="space-y-1">
            {chain.slice(0, 8).map((cn, i) => {
              const cnConfig = NODE_TYPE_CONFIG[cn.type];
              const isActive = cn.id === node.id;
              return (
                <div key={cn.id}>
                  <button
                    onClick={() => cn.id !== node.id && onSelectNode(cn.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-left"
                    style={{
                      background: isActive ? cnConfig.bgColor : "transparent",
                      border: isActive ? `1px solid ${cnConfig.borderColor}` : "1px solid transparent",
                      cursor: isActive ? "default" : "pointer",
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cnConfig.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase" style={{ color: cnConfig.color }}>{cnConfig.label}</p>
                      <p className="text-sm font-semibold text-foreground truncate">{cn.label}</p>
                    </div>
                    {!isActive && <ExternalLink size={10} className="text-muted-foreground flex-shrink-0" />}
                  </button>
                  {i < Math.min(chain.length, 8) - 1 && (
                    <div className="flex justify-center py-0.5">
                      <ArrowDown size={12} className="text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
            {chain.length > 8 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{chain.length - 8} more steps
              </p>
            )}
          </div>
        </div>
      )}

      {/* Linked Nodes */}
      {activeSection === "linked" && (
        <div className="px-4 pb-4 space-y-1.5">
          {upstream.length > 0 && (
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                Upstream ({upstream.length})
              </p>
              {upstream.map(({ edge, node: n }) => {
                if (!n) return null;
                const nc = NODE_TYPE_CONFIG[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => onSelectNode(n.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: nc.color }} />
                    <p className="text-xs font-semibold text-foreground truncate flex-1">{n.label}</p>
                    <span className="text-xs text-muted-foreground">{edge.relation.replace("_", " ")}</span>
                  </button>
                );
              })}
            </div>
          )}
          {downstream.length > 0 && (
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-1 mt-2">
                Downstream ({downstream.length})
              </p>
              {downstream.map(({ edge, node: n }) => {
                if (!n) return null;
                const nc = NODE_TYPE_CONFIG[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => onSelectNode(n.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: nc.color }} />
                    <p className="text-xs font-semibold text-foreground truncate flex-1">{n.label}</p>
                    <span className="text-xs text-muted-foreground">{edge.relation.replace("_", " ")}</span>
                  </button>
                );
              })}
            </div>
          )}
          {linkedNodes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No direct connections</p>
          )}
        </div>
      )}

      {/* Evidence */}
      {activeSection === "evidence" && (
        <div className="px-4 pb-4">
          {node.evidence.length > 0 ? (
            <div className="space-y-1.5">
              {node.evidence.slice(0, showAllEvidence ? undefined : 3).map((e, i) => (
                <p key={i} className="text-sm text-foreground leading-snug pl-2"
                  style={{ borderLeft: `2px solid ${config.borderColor}` }}>
                  {e}
                </p>
              ))}
              {node.evidence.length > 3 && (
                <button
                  onClick={() => setShowAllEvidence(!showAllEvidence)}
                  className="flex items-center gap-1 mt-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown
                    size={12}
                    className="transition-transform"
                    style={{ transform: showAllEvidence ? "rotate(180deg)" : "none" }}
                  />
                  {showAllEvidence ? "Show less" : `View all ${node.evidence.length}`}
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No evidence collected</p>
          )}
        </div>
      )}

      {/* Recommended Tools (reasoning-driven) */}
      {activeSection === "tools" && toolRecommendations.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
            Recommended Tools
          </p>
          {toolRecommendations.map(rec => {
            const ToolIcon = rec.tool.icon;
            return (
              <button
                key={rec.tool.id}
                onClick={() => onOpenTool?.(rec.tool)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/40 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${rec.tool.accentColor}12` }}>
                  <ToolIcon size={13} style={{ color: rec.tool.accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{rec.tool.title}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{rec.reason}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[9px] font-bold tabular-nums text-muted-foreground">{Math.round(rec.score * 100)}%</span>
                  <ChevronRight size={12} className="text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Strategic Actions */}
      <div className="px-4 pb-3">
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
          Strategic Actions
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onSelectNode(node.id)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold bg-muted hover:bg-muted/80 transition-colors text-foreground"
          >
            <Search size={11} /> Zoom Graph
          </button>
          {relatedTools.length > 0 && (
            <button
              onClick={() => relatedTools[0] && onOpenTool?.(relatedTools[0])}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-colors"
              style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
            >
              <FlaskConical size={11} /> Run Tool
            </button>
          )}
        </div>
      </div>

      {/* Pipeline step badge */}
      <div className="px-4 pb-3">
        <span
          className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
        >
          {node.pipelineStep.replace("_", " ")}
        </span>
      </div>
    </motion.div>
    </>
  );
});

function MetricPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center px-1.5 py-1.5 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-extrabold capitalize" style={{ color }}>{value}</p>
    </div>
  );
}
