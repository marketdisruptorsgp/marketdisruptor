import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  Position,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";
import type { VisualSpec, VisualNode } from "./StructuralVisual";

/* ── Node color mapping using CSS variable HSL values ── */
const NODE_COLORS: Record<VisualNode["type"], { bg: string; border: string; badge: string }> = {
  constraint:   { bg: "hsl(0 72% 52% / 0.08)",   border: "hsl(0 72% 52% / 0.4)",   badge: "hsl(0 72% 52%)" },
  effect:       { bg: "hsl(220 14% 95%)",          border: "hsl(220 13% 86%)",        badge: "hsl(220 10% 40%)" },
  leverage:     { bg: "hsl(229 89% 63% / 0.08)",   border: "hsl(229 89% 63% / 0.35)", badge: "hsl(229 89% 63%)" },
  intervention: { bg: "hsl(38 92% 50% / 0.08)",    border: "hsl(38 92% 50% / 0.35)",  badge: "hsl(38 92% 35%)" },
  outcome:      { bg: "hsl(142 70% 45% / 0.08)",   border: "hsl(142 70% 45% / 0.3)",  badge: "hsl(142 70% 30%)" },
};

/**
 * Auto-layout: positions nodes in a top-down DAG layout.
 * Constraints at top, drivers in middle, outcomes at bottom.
 */
function autoLayout(spec: VisualSpec): { nodes: Node[]; edges: Edge[] } {
  const CARD_W = 200;
  const CARD_H = 64;
  const GAP_X = 60;
  const GAP_Y = 120;

  // Group by priority (1 = top, 2 = mid, 3 = bottom)
  const tiers: Map<number, VisualNode[]> = new Map();
  for (const n of spec.nodes) {
    const p = n.priority || 2;
    if (!tiers.has(p)) tiers.set(p, []);
    tiers.get(p)!.push(n);
  }

  const sortedTiers = [...tiers.entries()].sort(([a], [b]) => a - b);
  const maxWidth = Math.max(...sortedTiers.map(([, ns]) => ns.length));

  const rfNodes: Node[] = [];
  sortedTiers.forEach(([, tierNodes], tierIdx) => {
    const totalW = tierNodes.length * CARD_W + (tierNodes.length - 1) * GAP_X;
    const startX = (maxWidth * (CARD_W + GAP_X) - totalW) / 2;

    tierNodes.forEach((n, i) => {
      const colors = NODE_COLORS[n.type] || NODE_COLORS.effect;
      rfNodes.push({
        id: n.id,
        position: { x: startX + i * (CARD_W + GAP_X), y: tierIdx * (CARD_H + GAP_Y) },
        data: { label: n.label, nodeType: n.type },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: {
          background: colors.bg,
          border: `1.5px solid ${colors.border}`,
          borderRadius: 12,
          padding: "8px 14px",
          fontSize: 12,
          fontWeight: 600,
          color: "hsl(224 20% 10%)",
          width: CARD_W,
          minHeight: CARD_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center" as const,
        },
      });
    });
  });

  const rfEdges: Edge[] = spec.edges.map((e, i) => ({
    id: `e-${i}`,
    source: e.from,
    target: e.to,
    label: e.label || undefined,
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
    style: { stroke: "hsl(220 13% 76%)", strokeWidth: 1.5 },
    labelStyle: { fontSize: 10, fontWeight: 600, fill: "hsl(220 10% 40%)" },
    labelBgStyle: { fill: "hsl(0 0% 100%)", fillOpacity: 0.85 },
    labelBgPadding: [6, 3] as [number, number],
    labelBgBorderRadius: 4,
  }));

  return { nodes: rfNodes, edges: rfEdges };
}

export function ReactFlowDiagram({ spec }: { spec: VisualSpec }) {
  const { nodes, edges } = useMemo(() => autoLayout(spec), [spec]);

  if (!spec?.nodes?.length) return null;

  // Calculate container height based on tiers
  const tiers = new Set(spec.nodes.map((n) => n.priority || 2)).size;
  const containerH = Math.max(260, tiers * 184 + 60);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        height: containerH,
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        connectionLineType={ConnectionLineType.SmoothStep}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background gap={20} size={1} color="hsl(var(--border) / 0.3)" />
      </ReactFlow>
    </div>
  );
}
