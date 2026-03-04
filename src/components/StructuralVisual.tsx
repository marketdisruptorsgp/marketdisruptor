import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import type { VisualSpec, VisualNode, NodeRole } from "@/lib/visualContract";
import { resolveRole } from "@/lib/visualContract";

export type { NodeRole, VisualNode, VisualSpec };
export { resolveRole };
export type { Certainty, LegacyNodeType, VisualEdge } from "@/lib/visualContract";

const ROLE_TIER: Record<NodeRole, number> = {
  system: 0, force: 1, mechanism: 2, leverage: 3, outcome: 4,
};

const ROLE_META: Record<NodeRole, { label: string; color: string; bg: string; border: string }> = {
  system:    { label: "System",   color: "hsl(var(--destructive))",        bg: "hsl(var(--destructive) / 0.06)", border: "hsl(var(--destructive) / 0.15)" },
  force:     { label: "Driver",   color: "hsl(var(--foreground) / 0.7)",   bg: "hsl(var(--muted) / 0.5)",        border: "hsl(var(--border))" },
  mechanism: { label: "Mechanism",color: "hsl(38 92% 45%)",               bg: "hsl(38 92% 50% / 0.06)",        border: "hsl(38 92% 50% / 0.15)" },
  leverage:  { label: "Leverage", color: "hsl(229 89% 58%)",              bg: "hsl(229 89% 63% / 0.06)",       border: "hsl(229 89% 63% / 0.15)" },
  outcome:   { label: "Outcome",  color: "hsl(142 60% 40%)",              bg: "hsl(142 60% 40% / 0.06)",       border: "hsl(142 60% 40% / 0.15)" },
};

interface TierGroup {
  tier: number;
  role: NodeRole;
  nodes: VisualNode[];
}

function groupByTier(spec: VisualSpec): TierGroup[] {
  const tiers = new Map<number, { role: NodeRole; nodes: VisualNode[] }>();
  for (const n of spec.nodes) {
    const role = resolveRole(n);
    const tier = ROLE_TIER[role] ?? 2;
    if (!tiers.has(tier)) tiers.set(tier, { role, nodes: [] });
    tiers.get(tier)!.nodes.push(n);
  }
  return [...tiers.entries()]
    .sort(([a], [b]) => a - b)
    .map(([tier, { role, nodes }]) => ({ tier, role, nodes }));
}

function cleanLabel(label: string): string {
  // Strip prefixes like "Constraint: ", "Friction: ", "Outcome: ", "Intervention: ", "Leverage: ", "Value: "
  return label.replace(/^(Constraint|Friction|Outcome|Intervention|Leverage|Value|Pain|Driver|Mechanism|System):\s*/i, "").trim();
}

function FlowCard({ node, role, index }: { node: VisualNode; role: NodeRole; index: number }) {
  const meta = ROLE_META[role] || ROLE_META.force;
  const label = cleanLabel(node.label);
  const attrs = node.attributes
    ? Array.isArray(node.attributes) ? node.attributes.join(" · ") : node.attributes
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.06, duration: 0.3 }}
      className="rounded-lg px-4 py-3"
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: meta.color }} />
        <div className="min-w-0 flex-1">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.08em] block mb-0.5"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          <p className="text-sm font-semibold leading-snug" style={{ color: "hsl(var(--foreground))" }}>
            {label}
          </p>
          {attrs && (
            <p className="text-xs leading-relaxed mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              {attrs}
            </p>
          )}
          {node.certainty && node.certainty !== "verified" && (
            <span
              className="inline-block mt-1.5 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded"
              style={{
                background: "hsl(var(--muted) / 0.5)",
                color: "hsl(var(--muted-foreground))",
              }}
            >
              {node.certainty}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function FlowArrow({ label, index }: { label?: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      className="flex flex-col items-center py-1"
    >
      <ArrowDown className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground) / 0.4)" }} />
      {label && (
        <span className="text-[9px] font-semibold mt-0.5" style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}>
          {label}
        </span>
      )}
    </motion.div>
  );
}

export function StructuralVisual({ spec }: { spec: VisualSpec }) {
  const tiers = useMemo(() => groupByTier(spec), [spec]);

  // Build edge label lookup: from tier → to tier → label
  const edgeLabels = useMemo(() => {
    const nodeRoleTier = new Map<string, number>();
    for (const n of spec.nodes) {
      nodeRoleTier.set(n.id, ROLE_TIER[resolveRole(n)] ?? 2);
    }
    const labels = new Map<string, string>();
    for (const e of spec.edges) {
      const fromTier = nodeRoleTier.get(e.from);
      const toTier = nodeRoleTier.get(e.to);
      if (fromTier !== undefined && toTier !== undefined && (e.label || e.relationship)) {
        labels.set(`${fromTier}-${toTier}`, (e.label || e.relationship)!);
      }
    }
    return labels;
  }, [spec]);

  if (!spec?.nodes?.length) return null;

  let nodeIdx = 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      className="rounded-xl p-4 space-y-0"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {spec.title && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-center mb-3"
          style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
        >
          {spec.title}
        </motion.p>
      )}

      {tiers.map((tierGroup, tierIdx) => {
        const prevTier = tierIdx > 0 ? tiers[tierIdx - 1].tier : null;
        const arrowLabel = prevTier !== null
          ? edgeLabels.get(`${prevTier}-${tierGroup.tier}`)
          : undefined;

        return (
          <React.Fragment key={tierGroup.tier}>
            {tierIdx > 0 && <FlowArrow label={arrowLabel} index={tierIdx} />}
            <div className={tierGroup.nodes.length > 1 ? "grid grid-cols-2 gap-2" : ""}>
              {tierGroup.nodes.map((node) => {
                const idx = nodeIdx++;
                return <FlowCard key={node.id} node={node} role={tierGroup.role} index={idx} />;
              })}
            </div>
          </React.Fragment>
        );
      })}

      {spec.interpretation && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-xs leading-relaxed text-center pt-3 mt-2"
          style={{
            color: "hsl(var(--muted-foreground) / 0.6)",
            borderTop: "1px solid hsl(var(--border) / 0.5)",
          }}
        >
          {spec.interpretation}
        </motion.p>
      )}
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
