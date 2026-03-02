import { useMemo, memo } from "react";
import ReactFlow, {
  Background,
  type Node,
  type Edge,
  MarkerType,
  Position,
  ConnectionLineType,
  Handle,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import type { VisualSpec, VisualNode, NodeRole } from "@/lib/visualContract";
import { resolveRole } from "@/lib/visualContract";

/* ── Role color mapping (canonical semantic grammar) ── */
const ROLE_COLORS: Record<NodeRole, { bg: string; border: string; badge: string; badgeBg: string }> = {
  system:    { bg: "hsl(0 72% 52% / 0.06)",   border: "hsl(0 72% 52% / 0.35)",   badge: "hsl(0 72% 52%)",   badgeBg: "hsl(0 72% 52% / 0.10)" },
  force:     { bg: "hsl(var(--muted))",          border: "hsl(var(--border))",        badge: "hsl(var(--muted-foreground))", badgeBg: "hsl(var(--muted))" },
  mechanism: { bg: "hsl(38 92% 50% / 0.06)",    border: "hsl(38 92% 50% / 0.3)",    badge: "hsl(38 92% 35%)",  badgeBg: "hsl(38 92% 50% / 0.10)" },
  leverage:  { bg: "hsl(229 89% 63% / 0.06)",   border: "hsl(229 89% 63% / 0.3)",   badge: "hsl(229 89% 63%)", badgeBg: "hsl(229 89% 63% / 0.10)" },
  outcome:   { bg: "hsl(142 70% 45% / 0.06)",   border: "hsl(142 70% 45% / 0.25)",  badge: "hsl(142 70% 30%)", badgeBg: "hsl(142 70% 45% / 0.10)" },
};

const PRIORITY_DOTS = (p?: number) => {
  if (!p || p > 3) return null;
  return (
    <span style={{ display: "inline-flex", gap: 2, marginLeft: 4 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: i < p ? "hsl(var(--primary))" : "hsl(var(--border))",
          }}
        />
      ))}
    </span>
  );
};

/* ── Size scaling by priority ── */
const PRIORITY_SCALE: Record<number, { minW: number; maxW: number; pad: string; fontSize: number }> = {
  1: { minW: 190, maxW: 260, pad: "12px 16px", fontSize: 13 },
  2: { minW: 160, maxW: 220, pad: "10px 14px", fontSize: 12 },
  3: { minW: 130, maxW: 190, pad: "8px 12px", fontSize: 11 },
};

/* ── Certainty border encoding ── */
const CERTAINTY_BORDER: Record<string, string> = {
  verified: "solid",
  modeled: "dashed",
  assumption: "dotted",
};

/* ── Custom Node Component ── */
const AnalysisNode = memo(({ data }: NodeProps) => {
  const role = (data.role || "force") as NodeRole;
  const colors = ROLE_COLORS[role] || ROLE_COLORS.force;
  const priority = (data.priority as number) || 2;
  const certainty = (data.certainty as string) || "verified";
  const scale = PRIORITY_SCALE[priority] || PRIORITY_SCALE[2];
  const borderStyle = CERTAINTY_BORDER[certainty] || "solid";

  return (
    <div
      style={{
        background: colors.bg,
        border: `1.5px ${borderStyle} ${colors.border}`,
        borderRadius: 12,
        padding: scale.pad,
        minWidth: scale.minW,
        maxWidth: scale.maxW,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <span
          style={{
            padding: "1px 6px",
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: colors.badge,
            background: colors.badgeBg,
          }}
        >
          {role}
        </span>
        {PRIORITY_DOTS(priority)}
        {certainty !== "verified" && (
          <span style={{ fontSize: 8, fontWeight: 600, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.06em", marginLeft: 2 }}>
            {certainty}
          </span>
        )}
      </div>

      <p
        style={{
          margin: 0,
          fontSize: scale.fontSize,
          fontWeight: 600,
          lineHeight: 1.35,
          color: "hsl(var(--foreground))",
        }}
      >
        {data.label}
      </p>

      {data.attributes && (
        <p style={{ margin: "4px 0 0", fontSize: 10, lineHeight: 1.4, color: "hsl(var(--muted-foreground))" }}>
          {Array.isArray(data.attributes) ? data.attributes.join(" · ") : data.attributes}
        </p>
      )}

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 1, height: 1 }} />
    </div>
  );
});
AnalysisNode.displayName = "AnalysisNode";

const nodeTypes = { analysisNode: AnalysisNode };

/* ── Canonical role tier ordering ── */
const ROLE_TIER: Record<NodeRole, number> = {
  system: 0,
  force: 1,
  mechanism: 2,
  leverage: 3,
  outcome: 4,
};

/* ── Auto-layout ── */
function autoLayout(spec: VisualSpec): { nodes: Node[]; edges: Edge[] } {
  const CARD_W = 220;
  const CARD_H = 72;
  const GAP_X = 50;
  const GAP_Y = 110;

  // Group nodes by their semantic tier (role → priority fallback)
  const tiers: Map<number, VisualNode[]> = new Map();
  for (const n of spec.nodes) {
    const role = resolveRole(n);
    const tier = ROLE_TIER[role] ?? (n.priority || 2);
    if (!tiers.has(tier)) tiers.set(tier, []);
    tiers.get(tier)!.push(n);
  }

  const sortedTiers = [...tiers.entries()].sort(([a], [b]) => a - b);
  const maxWidth = Math.max(...sortedTiers.map(([, ns]) => ns.length));

  const rfNodes: Node[] = [];
  sortedTiers.forEach(([, tierNodes], tierIdx) => {
    const totalW = tierNodes.length * CARD_W + (tierNodes.length - 1) * GAP_X;
    const startX = (maxWidth * (CARD_W + GAP_X) - totalW) / 2;

    tierNodes.forEach((n, i) => {
      const role = resolveRole(n);
      rfNodes.push({
        id: n.id,
        type: "analysisNode",
        position: { x: startX + i * (CARD_W + GAP_X), y: tierIdx * (CARD_H + GAP_Y) },
        data: { label: n.label, role, priority: n.priority, certainty: n.certainty, attributes: n.attributes },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
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

  const tierCount = new Set(spec.nodes.map((n) => resolveRole(n))).size;
  const containerH = Math.max(280, tierCount * 182 + 60);

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
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
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
