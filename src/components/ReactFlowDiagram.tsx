import { useMemo, memo, useState, useCallback } from "react";
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
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import type { VisualSpec, VisualNode, NodeRole } from "@/lib/visualContract";
import { resolveRole } from "@/lib/visualContract";

/* ── Role color mapping — premium semantic palette ── */
const ROLE_COLORS: Record<NodeRole, { bg: string; border: string; badge: string; badgeBg: string; glow: string }> = {
  system:    { bg: "hsl(var(--vi-glow-system) / 0.05)",    border: "hsl(var(--vi-glow-system) / 0.25)",    badge: "hsl(var(--vi-glow-system))",    badgeBg: "hsl(var(--vi-glow-system) / 0.08)",    glow: "hsl(var(--vi-glow-system) / 0.12)" },
  force:     { bg: "hsl(var(--vi-surface))",                 border: "hsl(var(--border))",                    badge: "hsl(var(--muted-foreground))",   badgeBg: "hsl(var(--muted) / 0.6)",               glow: "hsl(var(--vi-glow-force) / 0.08)" },
  mechanism: { bg: "hsl(var(--vi-glow-mechanism) / 0.04)",  border: "hsl(var(--vi-glow-mechanism) / 0.22)", badge: "hsl(var(--vi-glow-mechanism))",  badgeBg: "hsl(var(--vi-glow-mechanism) / 0.08)", glow: "hsl(var(--vi-glow-mechanism) / 0.1)" },
  leverage:  { bg: "hsl(var(--vi-glow-leverage) / 0.04)",   border: "hsl(var(--vi-glow-leverage) / 0.22)",  badge: "hsl(var(--vi-glow-leverage))",   badgeBg: "hsl(var(--vi-glow-leverage) / 0.08)",  glow: "hsl(var(--vi-glow-leverage) / 0.12)" },
  outcome:   { bg: "hsl(var(--vi-glow-outcome) / 0.04)",    border: "hsl(var(--vi-glow-outcome) / 0.2)",    badge: "hsl(var(--vi-glow-outcome))",    badgeBg: "hsl(var(--vi-glow-outcome) / 0.08)",   glow: "hsl(var(--vi-glow-outcome) / 0.1)" },
};

const ROLE_LABELS: Record<NodeRole, string> = {
  system: "Core System",
  force: "Driver",
  mechanism: "Mechanism",
  leverage: "Leverage Point",
  outcome: "Outcome",
};

/* ── Size scaling by priority ── */
const PRIORITY_SCALE: Record<number, { minW: number; pad: string; fontSize: number; radius: number }> = {
  1: { minW: 220, pad: "14px 18px", fontSize: 13, radius: 14 },
  2: { minW: 180, pad: "11px 15px", fontSize: 12, radius: 12 },
  3: { minW: 150, pad: "9px 13px", fontSize: 11, radius: 10 },
};

/* ── Certainty border encoding ── */
const CERTAINTY_BORDER: Record<string, string> = {
  verified: "solid",
  modeled: "dashed",
  assumption: "dotted",
};

const CERTAINTY_LABELS: Record<string, string> = {
  verified: "Verified",
  modeled: "Modeled",
  assumption: "Hypothesis",
};

/* ── Custom Node Component — Premium Interactive ── */
const AnalysisNode = memo(({ data, selected }: NodeProps) => {
  const [hovered, setHovered] = useState(false);
  const role = (data.role || "force") as NodeRole;
  const colors = ROLE_COLORS[role] || ROLE_COLORS.force;
  const priority = (data.priority as number) || 2;
  const certainty = (data.certainty as string) || "verified";
  const scale = PRIORITY_SCALE[priority] || PRIORITY_SCALE[2];
  const borderStyle = CERTAINTY_BORDER[certainty] || "solid";
  const isAnchor = role === "system" || role === "leverage";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `linear-gradient(135deg, ${colors.bg}, ${colors.glow})` : colors.bg,
        border: `${isAnchor ? 2 : 1.5}px ${borderStyle} ${hovered || selected ? colors.badge : colors.border}`,
        borderRadius: scale.radius,
        padding: scale.pad,
        minWidth: scale.minW,
        maxWidth: 280,
        boxShadow: hovered
          ? `var(--shadow-vi-node-hover), var(--shadow-vi-glow) ${colors.glow}`
          : "var(--shadow-vi-node)",
        transition: "all 0.2s ease",
        cursor: "pointer",
        transform: hovered ? "translateY(-1px)" : "none",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />

      {/* Role badge row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 6,
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: colors.badge,
            background: colors.badgeBg,
          }}
        >
          {ROLE_LABELS[role]}
        </span>
        {certainty !== "verified" && (
          <span style={{
            fontSize: 8, fontWeight: 600,
            color: "hsl(var(--muted-foreground))",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            opacity: 0.7,
          }}>
            {CERTAINTY_LABELS[certainty] || certainty}
          </span>
        )}
      </div>

      {/* Label */}
      <p
        style={{
          margin: 0,
          fontSize: scale.fontSize,
          fontWeight: isAnchor ? 700 : 600,
          lineHeight: 1.4,
          color: "hsl(var(--foreground))",
        }}
      >
        {data.label}
      </p>

      {/* Attributes — shown on hover */}
      {data.attributes && hovered && (
        <p style={{
          margin: "6px 0 0", fontSize: 10, lineHeight: 1.4,
          color: "hsl(var(--muted-foreground))",
          borderTop: "1px solid hsl(var(--border) / 0.5)",
          paddingTop: 6,
        }}>
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

/* ── Auto-layout — generous spacing for spatial storytelling ── */
function autoLayout(spec: VisualSpec): { nodes: Node[]; edges: Edge[] } {
  const CARD_W = 240;
  const CARD_H = 80;
  const GAP_X = 60;
  const GAP_Y = 120;

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
    label: e.label || e.relationship || undefined,
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "hsl(var(--vi-edge))" },
    style: { stroke: "hsl(var(--vi-edge))", strokeWidth: 1.5 },
    labelStyle: { fontSize: 10, fontWeight: 600, fill: "hsl(var(--muted-foreground))" },
    labelBgStyle: { fill: "hsl(var(--vi-surface-elevated))", fillOpacity: 0.92 },
    labelBgPadding: [8, 4] as [number, number],
    labelBgBorderRadius: 6,
  }));

  return { nodes: rfNodes, edges: rfEdges };
}

/* ── MiniMap node color ── */
function miniMapNodeColor(node: Node) {
  const role = (node.data?.role || "force") as NodeRole;
  const colors = ROLE_COLORS[role];
  return colors?.badge || "hsl(var(--muted-foreground))";
}

export function ReactFlowDiagram({ spec }: { spec: VisualSpec }) {
  const { nodes, edges } = useMemo(() => autoLayout(spec), [spec]);

  if (!spec?.nodes?.length) return null;

  const tierCount = new Set(spec.nodes.map((n) => resolveRole(n))).size;
  const containerH = Math.max(320, tierCount * 200 + 80);
  const showMiniMap = spec.nodes.length > 5;

  return (
    <div
      className="rounded-xl overflow-hidden relative group"
      style={{
        height: containerH,
        background: `linear-gradient(180deg, hsl(var(--vi-surface-elevated)), hsl(var(--vi-surface)))`,
        border: "1px solid hsl(var(--border))",
        boxShadow: "var(--shadow-vi-panel)",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.35 }}
        connectionLineType={ConnectionLineType.SmoothStep}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        preventScrolling={false}
        minZoom={0.4}
        maxZoom={2}
      >
        <Background gap={24} size={1} color="hsl(var(--border) / 0.2)" />
        <Controls
          showInteractive={false}
          position="bottom-right"
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 2,
            background: "hsl(var(--vi-surface-elevated) / 0.9)",
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            boxShadow: "var(--shadow-vi-node)",
            padding: 2,
          }}
        />
        {showMiniMap && (
          <MiniMap
            nodeColor={miniMapNodeColor}
            maskColor="hsl(var(--background) / 0.7)"
            style={{
              background: "hsl(var(--vi-surface-elevated) / 0.9)",
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              boxShadow: "var(--shadow-vi-node)",
            }}
            pannable
            zoomable
          />
        )}
      </ReactFlow>
      {/* Interaction hint — fades on hover */}
      <div className="absolute bottom-3 left-3 opacity-60 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
        <span className="text-[10px] font-semibold text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
          Drag to pan · Scroll to zoom
        </span>
      </div>
    </div>
  );
}
