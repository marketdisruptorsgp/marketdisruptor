/**
 * ValueChainSankey — D3-powered Sankey diagram for value chain flow
 * Shows value flowing through chain stages with friction-coded link colors.
 */
import { useMemo, useState, useRef, useEffect } from "react";
import { sankey, sankeyLinkHorizontal, sankeyJustify } from "d3-sankey";
import { motion, AnimatePresence } from "framer-motion";

interface ChainStep {
  label: string;
  friction: "high" | "medium" | "low";
  description?: string;
}

interface Props {
  chain: ChainStep[];
  width?: number;
}

interface SNode {
  id: string;
  label: string;
  friction: "high" | "medium" | "low";
  description?: string;
}

interface SLink {
  source: number;
  target: number;
  value: number;
  friction: "high" | "medium" | "low";
}

const FRICTION_COLORS = {
  high: "hsl(0 72% 48%)",
  medium: "hsl(38 92% 45%)",
  low: "hsl(152 60% 38%)",
} as const;

const FRICTION_COLORS_BRIGHT = {
  high: "hsl(0 80% 58%)",
  medium: "hsl(38 95% 55%)",
  low: "hsl(152 65% 48%)",
} as const;

const FRICTION_BG = {
  high: "hsl(0 72% 48% / 0.15)",
  medium: "hsl(38 92% 45% / 0.15)",
  low: "hsl(152 60% 38% / 0.15)",
} as const;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

export function ValueChainSankey({ chain, width: propWidth }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(propWidth || 400);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SNode | null>(null);

  useEffect(() => {
    if (propWidth) return;
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(Math.max(entry.contentRect.width, 280));
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [propWidth]);

  const sankeyData = useMemo(() => {
    if (chain.length < 2) return null;

    const nodes: SNode[] = chain.map((s, i) => ({
      id: `node_${i}`,
      label: s.label,
      friction: s.friction,
      description: s.description,
    }));

    // Sequential links: each step flows to the next
    // Value encodes friction weight (high=3, medium=2, low=1) so high-friction links are thicker
    const links: SLink[] = [];
    for (let i = 0; i < chain.length - 1; i++) {
      const frictionWeight = chain[i + 1].friction === "high" ? 3 : chain[i + 1].friction === "medium" ? 2 : 1;
      links.push({
        source: i,
        target: i + 1,
        value: frictionWeight,
        friction: chain[i + 1].friction,
      });
    }

    const nodeHeight = Math.max(160, chain.length * 30);
    const margin = { top: 12, right: 16, bottom: 12, left: 16 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = nodeHeight;

    const sankeyGen = sankey<SNode, SLink>()
      .nodeId((d: SNode) => d.id)
      .nodeWidth(18)
      .nodePadding(14)
      .nodeAlign(sankeyJustify)
      .extent([[0, 0], [innerWidth, innerHeight]]);

    const graph = sankeyGen({
      nodes: nodes.map(n => ({ ...n })),
      links: links.map(l => ({ ...l })),
    });

    return { graph, margin, innerWidth, innerHeight: nodeHeight };
  }, [chain, containerWidth]);

  if (!sankeyData) return null;

  const { graph, margin, innerHeight } = sankeyData;
  const svgHeight = innerHeight + margin.top + margin.bottom;
  const linkPath = sankeyLinkHorizontal();

  return (
    <div ref={containerRef} className="w-full">
      <svg
        width={containerWidth}
        height={svgHeight}
        viewBox={`0 0 ${containerWidth} ${svgHeight}`}
        className="block"
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Links */}
          {graph.links.map((link: any, i: number) => {
            const friction = (link as any).friction as "high" | "medium" | "low";
            const isConnected = hoveredNode
              ? (link.source?.id === hoveredNode || link.target?.id === hoveredNode)
              : true;

            return (
              <path
                key={i}
                d={linkPath(link) || ""}
                fill="none"
                stroke={FRICTION_COLORS_BRIGHT[friction]}
                strokeWidth={Math.max(link.width || 1, 5)}
                strokeOpacity={hoveredNode ? (isConnected ? 0.7 : 0.1) : 0.45}
                style={{ transition: "stroke-opacity 0.2s" }}
              />
            );
          })}

          {/* Nodes */}
          {graph.nodes.map((node: any, i: number) => {
            const x0 = node.x0 ?? 0;
            const y0 = node.y0 ?? 0;
            const x1 = node.x1 ?? 18;
            const y1 = node.y1 ?? 40;
            const w = x1 - x0;
            const h = y1 - y0;
            const friction = node.friction as "high" | "medium" | "low";
            const isDimmed = hoveredNode && hoveredNode !== node.id;

            return (
              <g
                key={node.id}
                style={{
                  cursor: "pointer",
                  opacity: isDimmed ? 0.35 : 1,
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(node)}
              >
                <rect
                  x={x0}
                  y={y0}
                  width={w}
                  height={h}
                  rx={4}
                  fill={FRICTION_COLORS[friction]}
                />
                {/* Label to the right of node (or left for last node) */}
                <text
                  x={i < graph.nodes.length - 1 ? x1 + 6 : x0 - 6}
                  y={y0 + h / 2}
                  dy="0.35em"
                  textAnchor={i < graph.nodes.length - 1 ? "start" : "end"}
                  className="text-[12px] font-extrabold fill-foreground"
                  style={{ pointerEvents: "none" }}
                >
                  {truncate(node.label, 28)}
                </text>
                {/* Friction badge */}
                <text
                  x={i < graph.nodes.length - 1 ? x1 + 6 : x0 - 6}
                  y={y0 + h / 2 + 14}
                  dy="0.35em"
                  textAnchor={i < graph.nodes.length - 1 ? "start" : "end"}
                  className="text-[10px] font-extrabold uppercase"
                  fill={FRICTION_COLORS[friction]}
                  fillOpacity={1}
                >
                  {friction}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected node detail */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mt-2 rounded-lg p-3"
            style={{
              background: FRICTION_BG[selectedNode.friction],
              border: `1px solid ${FRICTION_COLORS[selectedNode.friction]}30`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground">{selectedNode.label}</p>
                {selectedNode.description && (
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{selectedNode.description}</p>
                )}
                <span
                  className="text-[9px] font-extrabold uppercase mt-1.5 inline-block px-2 py-0.5 rounded-full"
                  style={{ background: FRICTION_BG[selectedNode.friction], color: FRICTION_COLORS[selectedNode.friction] }}
                >
                  {selectedNode.friction} friction
                </span>
              </div>
              <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground p-0.5">
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
