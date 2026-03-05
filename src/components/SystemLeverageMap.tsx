import { useMemo, useState, useCallback, memo } from "react";
import ReactFlow, {
  Background,
  type Node,
  type Edge,
  MarkerType,
  Position,
  ConnectionLineType,
  Handle,
  type NodeProps,
  Controls,
} from "reactflow";
import "reactflow/dist/style.css";
import { Network, Layers, Eye, EyeOff } from "lucide-react";
import {
  type SystemLeverageMap,
  type LeverageNode,
  type LensType,
  getLensColor,
} from "@/lib/multiLensEngine";

/* ── Layer visual config ── */
const LAYER_META: Record<1 | 2 | 3, { label: string; color: string }> = {
  1: { label: "Structural Constraint", color: "hsl(0 72% 50%)" },
  2: { label: "Leverage Point", color: "hsl(229 89% 63%)" },
  3: { label: "Strategic Opportunity", color: "hsl(152 60% 44%)" },
};

const LENS_LABELS: Record<LensType, string> = {
  product: "Product",
  service: "Service",
  business: "Business Model",
};

/* ── Custom Node ── */
const LeverageMapNode = memo(({ data, selected }: NodeProps) => {
  const [hovered, setHovered] = useState(false);
  const layer = (data.layer || 1) as 1 | 2 | 3;
  const meta = LAYER_META[layer];
  const isConvergence = data.isConvergenceZone as boolean;
  const activeLenses = (data.activeLenses || []) as LensType[];
  const lensScores = (data.lensScores || []) as { lens: LensType; score: number }[];
  const confidence = data.confidence as string;

  // Determine dominant lens color for this node
  const dominantLens = lensScores.sort((a, b) => b.score - a.score)[0];
  const nodeColor = dominantLens ? `hsl(${getLensColor(dominantLens.lens)})` : meta.color;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isConvergence
          ? `linear-gradient(135deg, hsl(${getLensColor("product")} / 0.06), hsl(${getLensColor("business")} / 0.06))`
          : `hsl(var(--vi-surface-elevated))`,
        border: `${isConvergence ? 2.5 : 1.5}px ${confidence === "high" ? "solid" : "dashed"} ${hovered || selected ? nodeColor : `${nodeColor}44`}`,
        borderRadius: layer === 3 ? 16 : 12,
        padding: "12px 16px",
        minWidth: layer === 2 ? 200 : 170,
        maxWidth: 260,
        boxShadow: hovered
          ? `0 8px 32px -8px ${nodeColor}33, 0 0 0 1px ${nodeColor}22`
          : isConvergence
            ? `0 4px 16px -4px ${nodeColor}22`
            : "var(--shadow-vi-node)",
        transition: "all 0.2s ease",
        cursor: "pointer",
        transform: hovered ? "translateY(-1px)" : "none",
        position: "relative" as const,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />

      {/* Convergence marker */}
      {isConvergence && (
        <div style={{
          position: "absolute", top: -8, right: -8,
          width: 20, height: 20, borderRadius: "50%",
          background: "hsl(var(--warning))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 800, color: "white",
          boxShadow: "0 2px 8px -2px hsl(var(--warning) / 0.5)",
        }}>
          ★
        </div>
      )}

      {/* Layer badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{
          padding: "2px 7px", borderRadius: 6,
          fontSize: 8, fontWeight: 700, textTransform: "uppercase" as const,
          letterSpacing: "0.08em",
          color: nodeColor,
          background: `${nodeColor}11`,
        }}>
          {meta.label}
        </span>
        {confidence !== "high" && (
          <span style={{
            fontSize: 7, fontWeight: 600,
            color: "hsl(var(--muted-foreground))",
            textTransform: "uppercase" as const,
          }}>
            {confidence}
          </span>
        )}
      </div>

      {/* Label */}
      <p style={{
        margin: 0, fontSize: 12, fontWeight: 700,
        lineHeight: 1.35, color: "hsl(var(--foreground))",
      }}>
        {data.label}
      </p>

      {/* Lens score pills — visible on hover */}
      {hovered && activeLenses.length > 0 && (
        <div style={{
          display: "flex", gap: 4, marginTop: 8,
          borderTop: "1px solid hsl(var(--border) / 0.5)",
          paddingTop: 6, flexWrap: "wrap" as const,
        }}>
          {lensScores.filter((ls: { lens: LensType }) => activeLenses.includes(ls.lens)).map((ls: { lens: LensType; score: number }) => (
            <span key={ls.lens} style={{
              padding: "1px 6px", borderRadius: 4,
              fontSize: 9, fontWeight: 700,
              color: `hsl(${getLensColor(ls.lens)})`,
              background: `hsl(${getLensColor(ls.lens)} / 0.1)`,
            }}>
              {LENS_LABELS[ls.lens]}: {ls.score}
            </span>
          ))}
        </div>
      )}

      {/* Attributes */}
      {hovered && data.attributes && (
        <p style={{
          margin: "4px 0 0", fontSize: 10, lineHeight: 1.35,
          color: "hsl(var(--muted-foreground))",
        }}>
          {data.attributes}
        </p>
      )}

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 1, height: 1 }} />
    </div>
  );
});
LeverageMapNode.displayName = "LeverageMapNode";

const nodeTypes = { leverageNode: LeverageMapNode };

/* ── Layout engine ── */
function layoutNodes(map: SystemLeverageMap, activeLenses: LensType[]): { nodes: Node[]; edges: Edge[] } {
  const CARD_W = 220;
  const GAP_X = 70;
  const GAP_Y = 140;

  // Group by layer
  const layers: Map<number, LeverageNode[]> = new Map();
  for (const n of map.nodes) {
    if (!layers.has(n.layer)) layers.set(n.layer, []);
    layers.get(n.layer)!.push(n);
  }

  const sortedLayers = [...layers.entries()].sort(([a], [b]) => a - b);
  const maxWidth = Math.max(...sortedLayers.map(([, ns]) => ns.length), 1);

  const rfNodes: Node[] = [];
  sortedLayers.forEach(([, layerNodes], layerIdx) => {
    const totalW = layerNodes.length * CARD_W + (layerNodes.length - 1) * GAP_X;
    const startX = (maxWidth * (CARD_W + GAP_X) - totalW) / 2;

    layerNodes.forEach((n, i) => {
      rfNodes.push({
        id: n.id,
        type: "leverageNode",
        position: { x: startX + i * (CARD_W + GAP_X), y: layerIdx * (80 + GAP_Y) },
        data: {
          label: n.label,
          layer: n.layer,
          isConvergenceZone: n.isConvergenceZone,
          confidence: n.confidence,
          lensScores: n.lensScores,
          activeLenses,
          attributes: n.attributes,
          impact: n.impact,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });
  });

  const rfEdges: Edge[] = map.edges.map((e, i) => {
    const sourceNode = map.nodes.find(n => n.id === e.from);
    const isHighStrength = e.strength > 0.7;

    return {
      id: `le-${i}`,
      source: e.from,
      target: e.to,
      label: e.relationship,
      type: "smoothstep",
      animated: isHighStrength,
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "hsl(var(--vi-edge))" },
      style: {
        stroke: sourceNode?.isConvergenceZone ? "hsl(var(--warning))" : "hsl(var(--vi-edge))",
        strokeWidth: isHighStrength ? 2 : 1.5,
        strokeDasharray: isHighStrength ? undefined : "6 4",
      },
      labelStyle: { fontSize: 9, fontWeight: 600, fill: "hsl(var(--muted-foreground))" },
      labelBgStyle: { fill: "hsl(var(--vi-surface-elevated) / 0.92)", fillOpacity: 0.92 },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 4,
    };
  });

  return { nodes: rfNodes, edges: rfEdges };
}

/* ── Lens Toggle Pill ── */
function LensToggle({
  lens,
  active,
  onToggle,
}: {
  lens: LensType;
  active: boolean;
  onToggle: (lens: LensType) => void;
}) {
  const color = getLensColor(lens);
  return (
    <button
      onClick={() => onToggle(lens)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
      style={{
        background: active ? `hsl(${color} / 0.12)` : "hsl(var(--muted))",
        color: active ? `hsl(${color})` : "hsl(var(--muted-foreground))",
        border: `1.5px solid ${active ? `hsl(${color} / 0.3)` : "transparent"}`,
      }}
    >
      {active ? <Eye size={12} /> : <EyeOff size={12} />}
      {LENS_LABELS[lens]}
    </button>
  );
}

/* ── Main Component ── */
export function SystemLeverageMapView({
  map,
  availableLenses = ["product"],
}: {
  map: SystemLeverageMap;
  availableLenses?: LensType[];
}) {
  const [activeLenses, setActiveLenses] = useState<LensType[]>(availableLenses);

  const toggleLens = useCallback((lens: LensType) => {
    setActiveLenses(prev => {
      if (prev.includes(lens)) {
        return prev.length > 1 ? prev.filter(l => l !== lens) : prev; // keep at least 1
      }
      return [...prev, lens];
    });
  }, []);

  const { nodes, edges } = useMemo(() => layoutNodes(map, activeLenses), [map, activeLenses]);

  const layerCount = new Set(map.nodes.map(n => n.layer)).size;
  const containerH = Math.max(380, layerCount * 220 + 100);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(var(--foreground))" }}
          >
            <Network size={15} style={{ color: "hsl(var(--background))" }} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-foreground">System Leverage Map</p>
            <p className="text-[11px] font-semibold text-foreground/70">{map.structuralSummary}</p>
          </div>
        </div>

        {/* Lens toggles */}
        {availableLenses.length > 1 && (
          <div className="flex items-center gap-1.5">
            <Layers size={12} className="text-muted-foreground" />
            {availableLenses.map(lens => (
              <LensToggle
                key={lens}
                lens={lens}
                active={activeLenses.includes(lens)}
                onToggle={toggleLens}
              />
            ))}
          </div>
        )}
      </div>

      {/* Convergence callout */}
      {map.convergenceZones.length > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{
            background: "hsl(var(--warning) / 0.08)",
            border: "1.5px solid hsl(var(--warning) / 0.2)",
          }}
        >
          <span style={{ fontSize: 14 }}>★</span>
          <p className="text-xs font-bold text-foreground">
            {map.convergenceZones.length} high-value disruption zone{map.convergenceZones.length > 1 ? "s" : ""} detected
            <span className="font-semibold text-foreground/70 ml-1">
              — multiple lenses converge on the same leverage point
            </span>
          </p>
        </div>
      )}

      {/* ReactFlow canvas */}
      <div
        className="rounded-xl overflow-hidden relative group"
        style={{
          height: containerH,
          background: "linear-gradient(180deg, hsl(var(--vi-surface-elevated)), hsl(var(--vi-surface)))",
          border: "1px solid hsl(var(--border))",
          boxShadow: "var(--shadow-vi-panel)",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          connectionLineType={ConnectionLineType.SmoothStep}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
          zoomOnScroll={true}
          zoomOnPinch={true}
          preventScrolling={false}
          minZoom={0.3}
          maxZoom={2}
        >
          <Background gap={24} size={1} color="hsl(var(--border) / 0.15)" />
          <Controls
            showInteractive={false}
            position="bottom-right"
            style={{
              display: "flex", flexDirection: "row", gap: 2,
              background: "hsl(var(--vi-surface-elevated) / 0.9)",
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              boxShadow: "var(--shadow-vi-node)",
              padding: 2,
            }}
          />
        </ReactFlow>

        {/* Legend */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
          {([1, 2, 3] as const).map(layer => (
            <div key={layer} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: LAYER_META[layer].color }}
              />
              <span className="text-[9px] font-bold text-foreground/60 uppercase tracking-wide">
                {LAYER_META[layer].label}
              </span>
            </div>
          ))}
          {map.convergenceZones.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 10, color: "hsl(var(--warning))" }}>★</span>
              <span className="text-[9px] font-bold text-foreground/60 uppercase tracking-wide">
                Convergence Zone
              </span>
            </div>
          )}
        </div>

        {/* Interaction hint */}
        <div className="absolute bottom-3 left-3 opacity-60 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
          <span className="text-[10px] font-semibold text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
            Hover nodes for lens scores · Scroll to zoom
          </span>
        </div>
      </div>
    </div>
  );
}
