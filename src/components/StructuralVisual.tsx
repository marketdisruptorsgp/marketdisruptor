import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface VisualNode {
  id: string;
  label: string;
  type: "constraint" | "effect" | "leverage" | "intervention" | "outcome";
  priority?: 1 | 2 | 3;
  attributes?: string;
}

export interface VisualEdge {
  from: string;
  to: string;
  relationship: "causes" | "relaxed_by" | "implemented_by" | "produces";
  label?: string;
}

export interface VisualSpec {
  visual_type: "constraint_map" | "causal_chain" | "leverage_hierarchy";
  title?: string;
  purpose?: string;
  nodes: VisualNode[];
  edges: VisualEdge[];
  layout?: "linear" | "vertical" | "hierarchical";
  interpretation?: string;
}

const NODE_STYLES: Record<VisualNode["type"], { bg: string; border: string; text: string; badge: string }> = {
  constraint:   { bg: "hsl(var(--destructive) / 0.06)", border: "hsl(var(--destructive) / 0.35)", text: "hsl(var(--foreground))", badge: "hsl(var(--destructive))" },
  effect:       { bg: "hsl(var(--muted))",               border: "hsl(var(--border))",              text: "hsl(var(--foreground))", badge: "hsl(var(--muted-foreground))" },
  leverage:     { bg: "hsl(var(--primary) / 0.06)",      border: "hsl(var(--primary) / 0.3)",       text: "hsl(var(--foreground))", badge: "hsl(var(--primary))" },
  intervention: { bg: "hsl(38 92% 50% / 0.06)",          border: "hsl(38 92% 50% / 0.3)",           text: "hsl(var(--foreground))", badge: "hsl(38 92% 35%)" },
  outcome:      { bg: "hsl(142 70% 45% / 0.06)",         border: "hsl(142 70% 45% / 0.25)",         text: "hsl(var(--foreground))", badge: "hsl(142 70% 30%)" },
};

const RELATIONSHIP_LABELS: Record<VisualEdge["relationship"], string> = {
  causes: "→ causes",
  relaxed_by: "← relaxed by",
  implemented_by: "← implemented by",
  produces: "→ produces",
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
  const s = NODE_STYLES[node.type] || NODE_STYLES.effect;
  return (
    <motion.div
      custom={index}
      variants={nodeVariant}
      initial="hidden"
      animate="visible"
      className={cn("px-3 py-2 rounded-lg min-w-[120px] max-w-[220px]", expandable && "cursor-pointer")}
      style={{ background: s.bg, border: `1.5px solid ${s.border}`, color: s.text }}
      onClick={expandable ? () => setExpanded(!expanded) : undefined}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{ background: `${s.badge}18`, color: s.badge }}>
          {node.type}
        </span>
        {PRIORITY_INDICATOR(node.priority)}
      </div>
      <p className="text-xs font-semibold leading-snug">{node.label}</p>
      {expanded && node.attributes && (
        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{node.attributes}</p>
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
                  <span className="text-[9px] font-semibold text-muted-foreground whitespace-nowrap">{edge.label || RELATIONSHIP_LABELS[edge.relationship]}</span>
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
                  <span className="text-[9px] font-semibold text-muted-foreground">{edge.label || RELATIONSHIP_LABELS[edge.relationship]}</span>
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

function ConstraintMap({ spec }: { spec: VisualSpec }) {
  const nodeMap = new Map(spec.nodes.map(n => [n.id, n]));
  const constraints = spec.nodes.filter(n => n.type === "constraint");
  const others = spec.nodes.filter(n => n.type !== "constraint");

  return (
    <div className="space-y-3">
      {constraints.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">System Constraints</p>
          <div className="flex flex-wrap gap-2">
            {constraints.map((n, i) => <NodeCard key={n.id} node={n} index={i} expandable />)}
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
                {" "}{RELATIONSHIP_LABELS[e.relationship]}{" "}
                <span className="font-semibold text-foreground">{to?.label || e.to}</span>
                {e.label && <span className="italic"> — {e.label}</span>}
              </p>
            );
          })}
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {others.map((n, i) => <NodeCard key={n.id} node={n} index={i + constraints.length} expandable />)}
        </div>
      )}
    </div>
  );
}

export function StructuralVisual({ spec }: { spec: VisualSpec }) {
  if (!spec?.nodes?.length) return null;

  const Renderer = spec.visual_type === "causal_chain" ? CausalChain
    : spec.visual_type === "leverage_hierarchy" ? LeverageHierarchy
    : ConstraintMap;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="rounded-xl p-4"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      {spec.title && (
        <p className="text-xs font-bold text-foreground mb-0.5">{spec.title}</p>
      )}
      {spec.interpretation && (
        <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">{spec.interpretation}</p>
      )}
      <Renderer spec={spec} />
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
