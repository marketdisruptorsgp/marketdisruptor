/**
 * CausalConstraintSankey — D3 Sankey for Constraints → Leverage → Opportunities
 * Replaces straight-line edges with proportional flow ribbons.
 */
import { memo, useMemo, useState, useRef, useEffect } from "react";
import { sankey, sankeyLinkHorizontal, sankeyJustify } from "d3-sankey";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Zap, Lightbulb, X } from "lucide-react";
import type { CommandDeck } from "@/lib/systemIntelligence";

interface CausalConstraintSankeyProps {
  commandDeck: CommandDeck;
}

interface SNode {
  id: string;
  label: string;
  type: "constraint" | "leverage" | "opportunity";
  impact: number;
  confidence: string;
  evidence?: string[];
}

interface SLink {
  source: string | number;
  target: string | number;
  value: number;
  type: "constraint-leverage" | "leverage-opportunity";
}

const TYPE_CONFIG = {
  constraint: { label: "Constraint", icon: Lock, color: "hsl(0 72% 50%)", bg: "hsl(0 72% 50% / 0.10)" },
  leverage: { label: "Leverage", icon: Zap, color: "hsl(229 89% 63%)", bg: "hsl(229 89% 63% / 0.10)" },
  opportunity: { label: "Opportunity", icon: Lightbulb, color: "hsl(152 60% 44%)", bg: "hsl(152 60% 44% / 0.10)" },
} as const;

const LINK_COLORS = {
  "constraint-leverage": "hsl(0 72% 50%)",
  "leverage-opportunity": "hsl(229 89% 63%)",
} as const;

function impactLevel(impact: number): string {
  if (impact >= 8) return "Critical";
  if (impact >= 5) return "Significant";
  return "Moderate";
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}

export const CausalConstraintSankey = memo(function CausalConstraintSankey({
  commandDeck,
}: CausalConstraintSankeyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SNode | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) setContainerWidth(Math.max(entry.contentRect.width, 320));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const sankeyData = useMemo(() => {
    const constraints = commandDeck.topConstraints.slice(0, 5);
    const leveragePoints = commandDeck.topLeveragePoints.slice(0, 5);
    const opportunities = commandDeck.topOpportunities.slice(0, 5);

    if (constraints.length === 0 && leveragePoints.length === 0 && opportunities.length === 0) return null;

    const nodes: SNode[] = [
      ...constraints.map(c => ({ id: c.id, label: c.label, type: "constraint" as const, impact: c.impact, confidence: c.confidence, evidence: c.evidence })),
      ...leveragePoints.map(l => ({ id: l.id, label: l.label, type: "leverage" as const, impact: l.impact, confidence: l.confidence, evidence: l.evidence })),
      ...opportunities.map(o => ({ id: o.id, label: o.label, type: "opportunity" as const, impact: o.impact, confidence: o.confidence, evidence: (o as any).evidence })),
    ];

    const links: SLink[] = [];
    // Constraints → Leverage: link by impact threshold
    constraints.forEach(c => {
      leveragePoints.forEach(l => {
        if (c.impact >= 5 || l.impact >= 5) {
          links.push({
            source: c.id,
            target: l.id,
            value: Math.max(c.impact, l.impact),
            type: "constraint-leverage",
          });
        }
      });
    });
    // Leverage → Opportunities
    leveragePoints.forEach(l => {
      opportunities.forEach(o => {
        if (l.impact >= 5 || o.impact >= 5) {
          links.push({
            source: l.id,
            target: o.id,
            value: Math.max(l.impact, o.impact),
            type: "leverage-opportunity",
          });
        }
      });
    });

    if (links.length === 0) return null;

    const margin = { top: 8, right: 120, bottom: 8, left: 120 };
    const maxNodes = Math.max(constraints.length, leveragePoints.length, opportunities.length);
    const innerHeight = Math.max(200, maxNodes * 60);
    const innerWidth = containerWidth - margin.left - margin.right;

    const sankeyGen = sankey<SNode, SLink>()
      .nodeId((d: SNode) => d.id)
      .nodeWidth(16)
      .nodePadding(16)
      .nodeAlign(sankeyJustify)
      .extent([[0, 0], [innerWidth, innerHeight]]);

    const graph = sankeyGen({
      nodes: nodes.map(n => ({ ...n })),
      links: links.map(l => ({ ...l })),
    });

    return { graph, margin, innerHeight };
  }, [commandDeck, containerWidth]);

  // Compute connected set for hover highlighting
  const connectedNodes = useMemo(() => {
    if (!hoveredNode || !sankeyData) return null;
    const set = new Set<string>([hoveredNode]);
    sankeyData.graph.links.forEach((l: any) => {
      const sid = typeof l.source === "object" ? l.source.id : l.source;
      const tid = typeof l.target === "object" ? l.target.id : l.target;
      if (sid === hoveredNode) set.add(tid);
      if (tid === hoveredNode) set.add(sid);
    });
    return set;
  }, [hoveredNode, sankeyData]);

  if (!sankeyData) return null;

  const { graph, margin, innerHeight } = sankeyData;
  const svgHeight = innerHeight + margin.top + margin.bottom;
  const linkPath = sankeyLinkHorizontal();

  return (
    <div className="space-y-3">
      {/* Column legend */}
      <div className="flex items-center gap-4">
        {(["constraint", "leverage", "opportunity"] as const).map(type => {
          const cfg = TYPE_CONFIG[type];
          const Icon = cfg.icon;
          return (
            <div key={type} className="flex items-center gap-1.5">
              <Icon size={11} style={{ color: cfg.color }} />
              <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>
                {cfg.label}s
              </span>
            </div>
          );
        })}
      </div>

      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden relative"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <svg
          width={containerWidth}
          height={svgHeight}
          viewBox={`0 0 ${containerWidth} ${svgHeight}`}
          className="block"
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Links */}
            {graph.links.map((link: any, i: number) => {
              const linkType = (link as any).type as "constraint-leverage" | "leverage-opportunity";
              const sid = typeof link.source === "object" ? link.source.id : link.source;
              const tid = typeof link.target === "object" ? link.target.id : link.target;
              const isConnected = connectedNodes
                ? (connectedNodes.has(sid) && connectedNodes.has(tid))
                : true;

              return (
                <path
                  key={i}
                  d={linkPath(link) || ""}
                  fill="none"
                  stroke={LINK_COLORS[linkType]}
                  strokeWidth={Math.max(link.width || 1, 3)}
                  strokeOpacity={connectedNodes ? (isConnected ? 0.45 : 0.06) : 0.2}
                  style={{ transition: "stroke-opacity 0.2s" }}
                />
              );
            })}

            {/* Nodes */}
            {graph.nodes.map((node: any) => {
              const x0 = node.x0 ?? 0;
              const y0 = node.y0 ?? 0;
              const x1 = node.x1 ?? 16;
              const y1 = node.y1 ?? 40;
              const w = x1 - x0;
              const h = y1 - y0;
              const type = node.type as "constraint" | "leverage" | "opportunity";
              const cfg = TYPE_CONFIG[type];
              const isDimmed = connectedNodes && !connectedNodes.has(node.id);

              // Label position: left for first column, right for last, right for middle
              const isFirst = type === "constraint";
              const isLast = type === "opportunity";

              return (
                <g
                  key={node.id}
                  style={{
                    cursor: "pointer",
                    opacity: isDimmed ? 0.25 : 1,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(node)}
                >
                  <rect x={x0} y={y0} width={w} height={h} rx={4} fill={cfg.color} />
                  <text
                    x={isFirst ? x0 - 6 : x1 + 6}
                    y={y0 + h / 2}
                    dy="0.35em"
                    textAnchor={isFirst ? "end" : "start"}
                    className="text-[10px] font-bold fill-foreground"
                    style={{ pointerEvents: "none" }}
                  >
                    {truncate(node.label, isFirst || isLast ? 20 : 18)}
                  </text>
                  <text
                    x={isFirst ? x0 - 6 : x1 + 6}
                    y={y0 + h / 2 + 13}
                    dy="0.35em"
                    textAnchor={isFirst ? "end" : "start"}
                    className="text-[9px] font-extrabold"
                    fill={cfg.color}
                    fillOpacity={0.7}
                    style={{ pointerEvents: "none" }}
                  >
                    {impactLevel(node.impact)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedNode && (() => {
            const cfg = TYPE_CONFIG[selectedNode.type];
            const Icon = cfg.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-3 left-3 right-3 rounded-xl p-4"
                style={{
                  background: "hsl(var(--card))",
                  border: `1.5px solid ${cfg.color}30`,
                  boxShadow: "0 8px 32px hsl(var(--foreground) / 0.1)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={12} style={{ color: cfg.color }} />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-foreground leading-snug">{selectedNode.label}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                        {impactLevel(selectedNode.impact)}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground capitalize">
                        {selectedNode.confidence} confidence
                      </span>
                    </div>
                    {selectedNode.evidence && selectedNode.evidence.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {selectedNode.evidence.slice(0, 2).map((e, i) => (
                          <p key={i} className="text-xs text-muted-foreground leading-relaxed">• {e}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="p-1 rounded-md hover:bg-muted transition-colors">
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
});
