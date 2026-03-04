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
  system:    { label: "System",    color: "hsl(0 72% 42%)",     bg: "hsl(0 72% 42% / 0.12)",   border: "hsl(0 72% 42% / 0.25)" },
  force:     { label: "Driver",    color: "hsl(var(--foreground))", bg: "hsl(var(--muted))",     border: "hsl(var(--border))" },
  mechanism: { label: "Mechanism", color: "hsl(28 80% 38%)",    bg: "hsl(38 80% 50% / 0.12)",  border: "hsl(38 80% 50% / 0.25)" },
  leverage:  { label: "Leverage",  color: "hsl(229 75% 45%)",   bg: "hsl(229 75% 55% / 0.12)", border: "hsl(229 75% 55% / 0.25)" },
  outcome:   { label: "Outcome",   color: "hsl(142 55% 32%)",   bg: "hsl(142 55% 40% / 0.12)", border: "hsl(142 55% 40% / 0.25)" },
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
      className="rounded-lg px-5 py-4"
      style={{
        background: meta.bg,
        border: `1.5px solid ${meta.border}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="w-2.5 h-2.5 rounded-full mt-2 shrink-0" style={{ background: meta.color }} />
        <div className="min-w-0 flex-1">
          <span
            className="text-xs font-extrabold uppercase tracking-[0.1em] block mb-1"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          <p className="text-base font-bold leading-snug text-foreground">
            {label}
          </p>
          {attrs && (
            <p className="text-sm leading-relaxed mt-1.5 text-foreground/80">
              {attrs}
            </p>
          )}
          {node.certainty && node.certainty !== "verified" && (
            <span
              className="inline-block mt-2 text-[10px] font-bold uppercase px-2 py-1 rounded"
              style={{
                background: "hsl(var(--muted))",
                color: "hsl(var(--foreground))",
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
      className="flex flex-col items-center py-2"
    >
      <ArrowDown className="w-5 h-5 text-foreground/50" />
      {label && (
        <span className="text-sm font-bold mt-1 text-foreground/70">
          {label}
        </span>
      )}
    </motion.div>
  );
}

export function StructuralVisual({ spec }: { spec: VisualSpec }) {
  const tiers = useMemo(() => groupByTier(spec), [spec]);

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
      className="rounded-xl p-5 space-y-0"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      {spec.title && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="text-sm font-extrabold uppercase tracking-[0.15em] text-center mb-4 text-foreground/70"
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
          className="text-sm font-semibold leading-relaxed text-center pt-4 mt-3 text-foreground/80"
          style={{
            borderTop: "1px solid hsl(var(--border))",
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
