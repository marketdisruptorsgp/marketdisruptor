import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VisualSpec, VisualNode, NodeRole } from "@/lib/visualContract";
import { resolveRole } from "@/lib/visualContract";

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC STRUCTURAL VISUAL
   Replaces ReactFlow node-link diagrams with a spatial field.
   Nodes positioned by role tier (top→bottom), rendered as
   glowing orbs with relationship lines.
   ═══════════════════════════════════════════════════════════════ */

export type { NodeRole, VisualNode, VisualSpec };
export { resolveRole };
// Re-export edge/certainty types for backward compat
export type { Certainty, LegacyNodeType, VisualEdge } from "@/lib/visualContract";

const ROLE_TIER: Record<NodeRole, number> = {
  system: 0, force: 1, mechanism: 2, leverage: 3, outcome: 4,
};

const ROLE_COLORS: Record<NodeRole, { solid: string; glow: string }> = {
  system:    { solid: "hsl(var(--cin-red))",     glow: "hsl(var(--cin-red-glow))" },
  force:     { solid: "hsl(var(--cin-label))",   glow: "hsl(var(--cin-label))" },
  mechanism: { solid: "hsl(38 92% 50%)",         glow: "hsl(38 92% 60%)" },
  leverage:  { solid: "hsl(229 89% 63%)",        glow: "hsl(229 89% 73%)" },
  outcome:   { solid: "hsl(var(--cin-green))",   glow: "hsl(var(--cin-green-glow))" },
};

const ROLE_LABELS: Record<NodeRole, string> = {
  system: "System", force: "Driver", mechanism: "Mechanism",
  leverage: "Leverage", outcome: "Outcome",
};

interface NodePos {
  node: VisualNode;
  x: number;
  y: number;
  role: NodeRole;
}

function layoutNodes(spec: VisualSpec): NodePos[] {
  const tiers = new Map<number, VisualNode[]>();
  for (const n of spec.nodes) {
    const role = resolveRole(n);
    const tier = ROLE_TIER[role] ?? 2;
    if (!tiers.has(tier)) tiers.set(tier, []);
    tiers.get(tier)!.push(n);
  }

  const sorted = [...tiers.entries()].sort(([a], [b]) => a - b);
  const totalTiers = sorted.length;
  const positions: NodePos[] = [];

  sorted.forEach(([, nodes], tierIdx) => {
    const yPercent = totalTiers <= 1 ? 50 : 15 + (tierIdx / (totalTiers - 1)) * 70;
    const totalNodes = nodes.length;
    nodes.forEach((node, i) => {
      const xPercent = totalNodes <= 1 ? 50 : 15 + (i / (totalNodes - 1)) * 70;
      positions.push({ node, x: xPercent, y: yPercent, role: resolveRole(node) });
    });
  });

  return positions;
}

function StructuralOrb({
  pos, index, onSelect, isSelected,
}: {
  pos: NodePos; index: number;
  onSelect: (n: VisualNode | null) => void; isSelected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const { solid: color, glow: glowColor } = ROLE_COLORS[pos.role] || ROLE_COLORS.force;
  const priority = pos.node.priority || 2;
  const size = priority === 1 ? 56 : priority === 3 ? 38 : 46;
  const label = pos.node.label.length > 22 ? pos.node.label.slice(0, 20) + "…" : pos.node.label;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: hovered || isSelected ? 1.15 : 1 }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.4, type: "spring" }}
      className="absolute cursor-pointer"
      style={{
        left: `${pos.x}%`, top: `${pos.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isSelected ? 20 : hovered ? 15 : 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : pos.node); }}
    >
      <motion.div
        animate={{
          boxShadow: hovered || isSelected
            ? `0 0 ${size}px ${size / 3}px ${glowColor}30`
            : `0 0 ${size / 3}px ${size / 6}px ${glowColor}12`,
        }}
        className="rounded-full flex flex-col items-center justify-center"
        style={{
          width: size, height: size,
          background: `radial-gradient(circle at 40% 35%, ${color}22, ${color}04)`,
          border: `1.5px solid ${color}${hovered || isSelected ? '50' : '20'}`,
        }}
      >
        <span className="text-[7px] font-bold uppercase tracking-wider mb-0.5 opacity-60" style={{ color }}>{ROLE_LABELS[pos.role]}</span>
        <span className="text-[9px] font-bold text-center leading-tight px-1 select-none" style={{ color }}>
          {label}
        </span>
      </motion.div>
    </motion.div>
  );
}

function NodeDetail({ node, role, onClose }: { node: VisualNode; role: NodeRole; onClose: () => void }) {
  const { solid: color } = ROLE_COLORS[role] || ROLE_COLORS.force;
  const attrs = node.attributes
    ? Array.isArray(node.attributes) ? node.attributes.join(" · ") : node.attributes
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="absolute z-30 rounded-xl p-4 max-w-[220px]"
      style={{
        right: "6%", bottom: "8%",
        background: "hsl(var(--cin-depth-mid) / 0.95)",
        border: `1px solid ${color}20`,
        backdropFilter: "blur(16px)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="w-2 h-2 rounded-full mt-1" style={{ background: color }} />
        <div>
          <p className="text-xs font-bold" style={{ color: "hsl(0 0% 90%)" }}>{node.label}</p>
          <p className="text-[10px] font-semibold" style={{ color }}>{ROLE_LABELS[role]}</p>
        </div>
      </div>
      {attrs && <p className="text-[10px] leading-relaxed" style={{ color: "hsl(var(--cin-label) / 0.6)" }}>{attrs}</p>}
      {node.certainty && node.certainty !== "verified" && (
        <span className="inline-block mt-2 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded"
          style={{ background: "hsl(var(--cin-depth-fg))", color: "hsl(var(--cin-label) / 0.5)" }}>{node.certainty}</span>
      )}
      <button onClick={onClose}
        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
        style={{ background: "hsl(var(--cin-depth-fg))", color: "hsl(var(--cin-label) / 0.5)" }}>×</button>
    </motion.div>
  );
}

export function StructuralVisual({ spec }: { spec: VisualSpec }) {
  const [selected, setSelected] = useState<VisualNode | null>(null);
  const positions = useMemo(() => layoutNodes(spec), [spec]);
  const nodeMap = useMemo(() => new Map(positions.map(p => [p.node.id, p])), [positions]);

  if (!spec?.nodes?.length) return null;

  const selectedPos = selected ? nodeMap.get(selected.id) : null;
  const tierCount = new Set(positions.map(p => ROLE_TIER[p.role])).size;
  const height = Math.max(280, tierCount * 120 + 60);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        height,
        background: "radial-gradient(ellipse 75% 55% at 50% 50%, hsl(var(--cin-depth-mid)), hsl(var(--cin-depth-bg)))",
        border: "1px solid hsl(var(--cin-depth-fg) / 0.5)",
        boxShadow: "0 12px 60px -12px hsl(0 0% 0% / 0.5)",
      }}
      onClick={() => setSelected(null)}
    >
      {spec.title && (
        <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-extrabold uppercase tracking-[0.2em] z-10"
          style={{ color: "hsl(var(--cin-label) / 0.4)" }}>{spec.title}</motion.p>
      )}

      {/* Relationship lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {spec.edges.map((e, i) => {
          const from = nodeMap.get(e.from);
          const to = nodeMap.get(e.to);
          if (!from || !to) return null;
          const color = ROLE_COLORS[from.role]?.solid || "hsl(var(--cin-label))";
          return (
            <motion.line key={i}
              x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`}
              stroke={`${color}`} strokeOpacity="0.12" strokeWidth="1"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
            />
          );
        })}
      </svg>

      {/* Edge labels */}
      {spec.edges.map((e, i) => {
        const from = nodeMap.get(e.from);
        const to = nodeMap.get(e.to);
        if (!from || !to || !e.label) return null;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        return (
          <motion.span key={`lbl-${i}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.8 + i * 0.05 }}
            className="absolute text-[7px] font-bold uppercase tracking-wider pointer-events-none z-5"
            style={{
              left: `${mx}%`, top: `${my}%`,
              transform: "translate(-50%, -50%)",
              color: "hsl(var(--cin-label) / 0.3)",
            }}>
            {e.label || e.relationship}
          </motion.span>
        );
      })}

      {positions.map((pos, i) => (
        <StructuralOrb key={pos.node.id} pos={pos} index={i}
          onSelect={setSelected} isSelected={selected === pos.node} />
      ))}

      <AnimatePresence>
        {selected && selectedPos && (
          <NodeDetail node={selected} role={selectedPos.role} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      {spec.interpretation && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-medium text-center max-w-[250px] z-10"
          style={{ color: "hsl(var(--cin-label) / 0.25)" }}>
          {spec.interpretation.length > 60 ? spec.interpretation.slice(0, 58) + "…" : spec.interpretation}
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
