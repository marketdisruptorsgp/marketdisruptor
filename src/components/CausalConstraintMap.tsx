/**
 * CausalConstraintMap — Visual causal diagram for Deconstruct step
 *
 * Renders a left-to-right causal flow: Constraints → Leverage Points → Opportunities
 * Uses pure SVG + React for clarity and performance.
 */

import { memo, useMemo, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Zap, Lightbulb, ArrowRight, X } from "lucide-react";
import type { CommandDeck, ConstraintNode, OpportunityNode } from "@/lib/systemIntelligence";
import type { LeverageNode } from "@/lib/multiLensEngine";

interface CausalConstraintMapProps {
  commandDeck: CommandDeck;
}

interface MapNode {
  id: string;
  label: string;
  type: "constraint" | "leverage" | "opportunity";
  impact: number;
  confidence: string;
  evidence?: string[];
  x: number;
  y: number;
}

interface MapEdge {
  from: string;
  to: string;
}

const COLUMN_X = [60, 280, 500] as const;
const NODE_HEIGHT = 56;
const NODE_WIDTH = 180;
const NODE_GAP = 12;
const TOP_PADDING = 48;

const COLUMN_CONFIG = [
  { label: "Constraints", icon: Lock, color: "hsl(0 72% 50%)", bgColor: "hsl(0 72% 50% / 0.08)" },
  { label: "Leverage", icon: Zap, color: "hsl(229 89% 63%)", bgColor: "hsl(229 89% 63% / 0.08)" },
  { label: "Opportunities", icon: Lightbulb, color: "hsl(152 60% 44%)", bgColor: "hsl(152 60% 44% / 0.08)" },
] as const;

function impactLevel(impact: number): string {
  if (impact >= 8) return "Critical";
  if (impact >= 5) return "Significant";
  return "Moderate";
}

export const CausalConstraintMap = memo(function CausalConstraintMap({
  commandDeck,
}: CausalConstraintMapProps) {
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { nodes, edges, svgHeight } = useMemo(() => {
    const constraints = commandDeck.topConstraints.slice(0, 5);
    const leveragePoints = commandDeck.topLeveragePoints.slice(0, 5);
    const opportunities = commandDeck.topOpportunities.slice(0, 5);

    const maxCount = Math.max(constraints.length, leveragePoints.length, opportunities.length, 1);
    const height = TOP_PADDING + maxCount * (NODE_HEIGHT + NODE_GAP) + 24;

    const mapNodes: MapNode[] = [];

    constraints.forEach((c, i) => {
      mapNodes.push({
        id: c.id,
        label: c.label,
        type: "constraint",
        impact: c.impact,
        confidence: c.confidence,
        evidence: c.evidence,
        x: COLUMN_X[0],
        y: TOP_PADDING + i * (NODE_HEIGHT + NODE_GAP),
      });
    });

    leveragePoints.forEach((l, i) => {
      mapNodes.push({
        id: l.id,
        label: l.label,
        type: "leverage",
        impact: l.impact,
        confidence: l.confidence,
        evidence: l.evidence,
        x: COLUMN_X[1],
        y: TOP_PADDING + i * (NODE_HEIGHT + NODE_GAP),
      });
    });

    opportunities.forEach((o, i) => {
      mapNodes.push({
        id: o.id,
        label: o.label,
        type: "opportunity",
        impact: o.impact,
        confidence: o.confidence,
        evidence: (o as any).evidence,
        x: COLUMN_X[2],
        y: TOP_PADDING + i * (NODE_HEIGHT + NODE_GAP),
      });
    });

    // Create edges — connect constraints to leverage, leverage to opportunities
    const mapEdges: MapEdge[] = [];
    constraints.forEach((c) => {
      // Connect to closest leverage points by matching labels/themes
      leveragePoints.forEach((l) => {
        if (c.impact >= 5 || l.impact >= 5) {
          mapEdges.push({ from: c.id, to: l.id });
        }
      });
    });
    leveragePoints.forEach((l) => {
      opportunities.forEach((o) => {
        if (l.impact >= 5 || o.impact >= 5) {
          mapEdges.push({ from: l.id, to: o.id });
        }
      });
    });

    return { nodes: mapNodes, edges: mapEdges, svgHeight: height };
  }, [commandDeck]);

  const getNodeCenter = useCallback((node: MapNode) => ({
    x: node.x + NODE_WIDTH / 2,
    y: node.y + NODE_HEIGHT / 2,
  }), []);

  const nodeMap = useMemo(() => {
    const map = new Map<string, MapNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>([hoveredNode]);
    edges.forEach(e => {
      if (e.from === hoveredNode) connected.add(e.to);
      if (e.to === hoveredNode) connected.add(e.from);
    });
    return connected;
  }, [hoveredNode, edges]);

  if (nodes.length === 0) return null;

  const colIdx = (type: string) => type === "constraint" ? 0 : type === "leverage" ? 1 : 2;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ArrowRight size={13} className="text-muted-foreground" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Causal Constraint Flow
        </p>
      </div>

      <div
        className="rounded-xl overflow-hidden relative"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        {/* Column Headers */}
        <div className="grid grid-cols-3 px-4 pt-3">
          {COLUMN_CONFIG.map((col, i) => {
            const Icon = col.icon;
            return (
              <div key={col.label} className="flex items-center gap-1.5 px-2">
                <Icon size={11} style={{ color: col.color }} />
                <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: col.color }}>
                  {col.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* SVG Canvas */}
        <div className="overflow-x-auto px-2 pb-3">
          <svg
            width={COLUMN_X[2] + NODE_WIDTH + 40}
            height={svgHeight}
            className="block"
          >
            {/* Edges */}
            {edges.map((edge, i) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;

              const from = getNodeCenter(fromNode);
              const to = getNodeCenter(toNode);
              const isActive = hoveredNode && (connectedNodes.has(edge.from) && connectedNodes.has(edge.to));
              const isDimmed = hoveredNode && !isActive;

              return (
                <line
                  key={`${edge.from}-${edge.to}-${i}`}
                  x1={fromNode.x + NODE_WIDTH}
                  y1={from.y}
                  x2={toNode.x}
                  y2={to.y}
                  stroke={isDimmed ? "hsl(var(--border))" : "hsl(var(--muted-foreground) / 0.3)"}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={isActive ? "none" : "4 3"}
                  style={{ transition: "all 0.2s" }}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node, i) => {
              const col = COLUMN_CONFIG[colIdx(node.type)];
              const isDimmed = hoveredNode && !connectedNodes.has(node.id);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: "pointer", opacity: isDimmed ? 0.3 : 1, transition: "opacity 0.2s" }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(node)}
                >
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={10}
                    fill={col.bgColor}
                    stroke={col.color}
                    strokeWidth={1}
                    strokeOpacity={0.3}
                  />
                  {/* Label */}
                  <foreignObject x={8} y={6} width={NODE_WIDTH - 16} height={28}>
                    <p
                      className="text-xs font-bold text-foreground leading-snug"
                      style={{
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {node.label}
                    </p>
                  </foreignObject>
                  {/* Impact label */}
                  <foreignObject x={8} y={36} width={NODE_WIDTH - 16} height={16}>
                    <span className="text-[10px] font-bold" style={{ color: col.color }}>
                      {impactLevel(node.impact)} · {node.confidence}
                    </span>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-3 left-3 right-3 rounded-xl p-4"
              style={{
                background: "hsl(var(--card))",
                border: `1.5px solid ${COLUMN_CONFIG[colIdx(selectedNode.type)].color}30`,
                boxShadow: "0 8px 32px hsl(var(--foreground) / 0.1)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {(() => {
                      const Icon = COLUMN_CONFIG[colIdx(selectedNode.type)].icon;
                      const color = COLUMN_CONFIG[colIdx(selectedNode.type)].color;
                      return (
                        <>
                          <Icon size={12} style={{ color }} />
                          <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color }}>
                            {selectedNode.type === "constraint" ? "Constraint" : selectedNode.type === "leverage" ? "Leverage point" : "Opportunity"}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-sm font-bold text-foreground leading-snug">{selectedNode.label}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: COLUMN_CONFIG[colIdx(selectedNode.type)].bgColor,
                        color: COLUMN_CONFIG[colIdx(selectedNode.type)].color,
                      }}
                    >
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
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded-md hover:bg-muted transition-colors"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
