import { useState, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ReactFlowDiagram = lazy(() =>
  import("./ReactFlowDiagram").then((m) => ({ default: m.ReactFlowDiagram }))
);

/* ── Canonical Node Role Model ── */
export type NodeRole = "system" | "force" | "mechanism" | "leverage" | "outcome";
export type Certainty = "verified" | "modeled" | "assumption";

/** Legacy type alias for backward compatibility */
export type LegacyNodeType = "constraint" | "effect" | "leverage" | "intervention" | "outcome";

export interface VisualNode {
  id: string;
  label: string;
  /** Canonical role in the system model */
  role?: NodeRole;
  /** @deprecated Use `role` instead. Kept for legacy data compatibility. */
  type?: LegacyNodeType;
  priority?: 1 | 2 | 3;
  attributes?: string | string[];
  certainty?: Certainty;
}

export interface VisualEdge {
  from: string;
  to: string;
  relationship?: string;
  label?: string;
  strength?: number;
}

export interface VisualSpec {
  visual_type?: "constraint_map" | "causal_chain" | "leverage_hierarchy" | "system_model";
  system?: string;
  title?: string;
  purpose?: string;
  nodes: VisualNode[];
  edges: VisualEdge[];
  layout?: "linear" | "vertical" | "hierarchical";
  interpretation?: string;
  confidence?: number;
  assumptions?: string[];
  version?: number;
}

/* ── Legacy → Canonical Role Migration ── */
const LEGACY_TO_ROLE: Record<LegacyNodeType, NodeRole> = {
  constraint: "system",
  effect: "force",
  leverage: "leverage",
  intervention: "mechanism",
  outcome: "outcome",
};

export function resolveRole(node: VisualNode): NodeRole {
  if (node.role) return node.role;
  if (node.type) return LEGACY_TO_ROLE[node.type] || "force";
  return "force";
}

function resolveAttributes(attrs?: string | string[]): string | undefined {
  if (!attrs) return undefined;
  if (Array.isArray(attrs)) return attrs.join(" · ");
  return attrs;
}

/* ── Visual Encoding ── */
const ROLE_STYLES: Record<NodeRole, { bg: string; border: string; text: string; badge: string }> = {
  system:    { bg: "hsl(var(--destructive) / 0.06)", border: "hsl(var(--destructive) / 0.35)", text: "hsl(var(--foreground))", badge: "hsl(var(--destructive))" },
  force:     { bg: "hsl(var(--muted))",               border: "hsl(var(--border))",              text: "hsl(var(--foreground))", badge: "hsl(var(--muted-foreground))" },
  mechanism: { bg: "hsl(38 92% 50% / 0.06)",          border: "hsl(38 92% 50% / 0.3)",           text: "hsl(var(--foreground))", badge: "hsl(38 92% 35%)" },
  leverage:  { bg: "hsl(var(--primary) / 0.06)",      border: "hsl(var(--primary) / 0.3)",       text: "hsl(var(--foreground))", badge: "hsl(var(--primary))" },
  outcome:   { bg: "hsl(142 70% 45% / 0.06)",         border: "hsl(142 70% 45% / 0.25)",         text: "hsl(var(--foreground))", badge: "hsl(142 70% 30%)" },
};

const CERTAINTY_BORDER_STYLE: Record<string, string> = {
  verified: "solid",
  modeled: "dashed",
  assumption: "dotted",
};

const PRIORITY_SIZE: Record<number, string> = {
  1: "min-w-[150px] max-w-[260px] px-4 py-3",
  2: "min-w-[120px] max-w-[220px] px-3 py-2",
  3: "min-w-[100px] max-w-[190px] px-2.5 py-1.5",
};

const PRIORITY_INDICATOR = (p?: number) => {
  if (!p || p > 3) return null;
  const dots = Array.from({ length: 3 }, (_, i) => i < p);
  return (
    <span className="inline-flex gap-0.5 ml-1">
      {dots.map((filled, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: filled ? "hsl(var(--primary))" : "hsl(var(--border))" }} />
      ))}
    </span>
  );
};

const nodeVariant = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.15 } }),
};

function NodeCard({ node, index = 0, expandable = false }: { node: VisualNode; index?: number; expandable?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const role = resolveRole(node);
  const s = ROLE_STYLES[role];
  const priority = node.priority || 2;
  const certainty = node.certainty || "verified";
  const borderStyle = CERTAINTY_BORDER_STYLE[certainty] || "solid";
  const sizeClass = PRIORITY_SIZE[priority] || PRIORITY_SIZE[2];
  const fontSize = priority === 1 ? "text-[13px]" : priority === 3 ? "text-[11px]" : "text-xs";
  const attrStr = resolveAttributes(node.attributes);

  return (
    <motion.div
      custom={index}
      variants={nodeVariant}
      initial="hidden"
      animate="visible"
      className={cn("rounded-lg", sizeClass, expandable && "cursor-pointer")}
      style={{ background: s.bg, border: `1.5px ${borderStyle} ${s.border}`, color: s.text }}
      onClick={expandable ? () => setExpanded(!expanded) : undefined}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{ background: `${s.badge}18`, color: s.badge }}>
          {role}
        </span>
        {PRIORITY_INDICATOR(node.priority)}
        {certainty !== "verified" && (
          <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">{certainty}</span>
        )}
      </div>
      <p className={cn(fontSize, "font-semibold leading-snug")}>{node.label}</p>
      {expanded && attrStr && (
        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{attrStr}</p>
      )}
    </motion.div>
  );
}

function CausalChain({ spec }: { spec: VisualSpec }) {
  const orderedNodeIds: string[] = [];
  const edgeMap = new Map<string, VisualEdge>();

  for (const e of spec.edges) {
    edgeMap.set(e.from, e);
  }

  const targets = new Set(spec.edges.map(e => e.to));
  const starts = spec.nodes.filter(n => !targets.has(n.id));

  const visited = new Set<string>();
  const walk = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    orderedNodeIds.push(id);
    const edge = edgeMap.get(id);
    if (edge) walk(edge.to);
  };
  starts.forEach(n => walk(n.id));
  spec.nodes.forEach(n => { if (!visited.has(n.id)) orderedNodeIds.push(n.id); });

  const nodeMap = new Map(spec.nodes.map(n => [n.id, n]));

  return (
    <>
      {/* Desktop: horizontal scroll */}
      <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1">
        {orderedNodeIds.map((id, i) => {
          const node = nodeMap.get(id);
          if (!node) return null;
          const edge = edgeMap.get(id);
          return (
            <div key={id} className="flex items-center gap-2 flex-shrink-0">
              <NodeCard node={node} index={i} expandable />
              {i < orderedNodeIds.length - 1 && edge && (
                <div className="flex flex-col items-center gap-0.5 px-1">
                  <span className="text-[9px] font-semibold text-muted-foreground whitespace-nowrap">{edge.label || edge.relationship || "→"}</span>
                  <span className="text-muted-foreground text-sm">→</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Mobile: vertical stack */}
      <div className="flex sm:hidden flex-col gap-1.5">
        {orderedNodeIds.map((id, i) => {
          const node = nodeMap.get(id);
          if (!node) return null;
          const edge = edgeMap.get(id);
          return (
            <div key={id} className="space-y-1">
              <NodeCard node={node} index={i} expandable />
              {i < orderedNodeIds.length - 1 && edge && (
                <div className="flex items-center gap-1.5 pl-4">
                  <span className="text-muted-foreground text-sm">↓</span>
                  <span className="text-[9px] font-semibold text-muted-foreground">{edge.label || edge.relationship || "→"}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function LeverageHierarchy({ spec }: { spec: VisualSpec }) {
  const sorted = [...spec.nodes].sort((a, b) => (a.priority || 3) - (b.priority || 3));
  return (
    <div className="space-y-1.5">
      {sorted.map((node, i) => (
        <div key={node.id} className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
            {i + 1}
          </span>
          <NodeCard node={node} index={i} expandable />
        </div>
      ))}
    </div>
  );
}

function SystemModel({ spec }: { spec: VisualSpec }) {
  const roleOrder: NodeRole[] = ["system", "force", "mechanism", "leverage", "outcome"];
  const grouped = new Map<NodeRole, VisualNode[]>();
  for (const n of spec.nodes) {
    const role = resolveRole(n);
    if (!grouped.has(role)) grouped.set(role, []);
    grouped.get(role)!.push(n);
  }

  const nodeMap = new Map(spec.nodes.map(n => [n.id, n]));
  let idx = 0;

  return (
    <div className="space-y-3">
      {roleOrder.map(role => {
        const nodes = grouped.get(role);
        if (!nodes?.length) return null;
        return (
          <div key={role}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{role}</p>
            <div className="flex flex-wrap gap-2">
              {nodes.map(n => <NodeCard key={n.id} node={n} index={idx++} expandable />)}
            </div>
          </div>
        );
      })}
      {spec.edges.length > 0 && (
        <div className="space-y-1 pl-2" style={{ borderLeft: "2px solid hsl(var(--border))" }}>
          {spec.edges.map((e, i) => {
            const from = nodeMap.get(e.from);
            const to = nodeMap.get(e.to);
            return (
              <p key={i} className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{from?.label || e.from}</span>
                {" → "}
                <span className="font-semibold text-foreground">{to?.label || e.to}</span>
                {e.label && <span className="italic"> — {e.label}</span>}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConstraintMap({ spec }: { spec: VisualSpec }) {
  const nodeMap = new Map(spec.nodes.map(n => [n.id, n]));
  const systemNodes = spec.nodes.filter(n => resolveRole(n) === "system");
  const others = spec.nodes.filter(n => resolveRole(n) !== "system");

  return (
    <div className="space-y-3">
      {systemNodes.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">System Constraints</p>
          <div className="flex flex-wrap gap-2">
            {systemNodes.map((n, i) => <NodeCard key={n.id} node={n} index={i} expandable />)}
          </div>
        </div>
      )}
      {spec.edges.length > 0 && (
        <div className="space-y-1 pl-2" style={{ borderLeft: "2px solid hsl(var(--border))" }}>
          {spec.edges.map((e, i) => {
            const from = nodeMap.get(e.from);
            const to = nodeMap.get(e.to);
            return (
              <p key={i} className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">{from?.label || e.from}</span>
                {" → "}
                <span className="font-semibold text-foreground">{to?.label || e.to}</span>
                {e.label && <span className="italic"> — {e.label}</span>}
              </p>
            );
          })}
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {others.map((n, i) => <NodeCard key={n.id} node={n} index={i + systemNodes.length} expandable />)}
        </div>
      )}
    </div>
  );
}

function CardFallback({ spec }: { spec: VisualSpec }) {
  const vt = spec.visual_type;
  const Renderer = vt === "causal_chain" ? CausalChain
    : vt === "leverage_hierarchy" ? LeverageHierarchy
    : vt === "system_model" ? SystemModel
    : ConstraintMap;

  return (
    <div className="rounded-xl p-4" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
      {spec.title && <p className="text-xs font-bold text-foreground mb-0.5">{spec.title}</p>}
      <Renderer spec={spec} />
    </div>
  );
}

export function StructuralVisual({ spec }: { spec: VisualSpec }) {
  if (!spec?.nodes?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      {spec.title && (
        <p className="text-xs font-bold text-foreground mb-1">{spec.title}</p>
      )}
      {spec.interpretation && (
        <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">{spec.interpretation}</p>
      )}
      <Suspense fallback={<CardFallback spec={spec} />}>
        <ReactFlowDiagram spec={spec} />
      </Suspense>
    </motion.div>
  );
}

export function StructuralVisualList({ specs }: { specs?: VisualSpec[] }) {
  if (!specs?.length) return null;
  return (
    <div className="space-y-3">
      {specs.map((spec, i) => (
        <StructuralVisual key={i} spec={spec} />
      ))}
    </div>
  );
}
