import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VisualStory } from "@/lib/visualStoryCompiler";
import type { RankedSignal } from "@/lib/signalRanking";
import { normalizeSignalLabel } from "@/lib/visualEnforcementHelpers";

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC VALUE FLOW
   Mechanisms as a flowing stream from left→right with outcomes
   as convergence glows on the right side.
   ═══════════════════════════════════════════════════════════════ */

const ROLE_LABELS: Record<string, string> = {
  driver: "Driver", constraint: "Constraint", mechanism: "Mechanism",
  assumption: "Assumption", leverage: "Leverage", outcome: "Outcome",
};

function FlowOrb({
  signal, index, total, onSelect, isSelected, xBase, yBase,
}: {
  signal: RankedSignal; index: number; total: number;
  onSelect: (s: RankedSignal | null) => void; isSelected: boolean;
  xBase: number; yBase: number;
}) {
  const [hovered, setHovered] = useState(false);
  const label = normalizeSignalLabel(signal.label);
  const norm = Math.min(1, signal.score / 60);
  const size = 36 + norm * 28;

  const colorMap: Record<string, { solid: string; glow: string }> = {
    mechanism: { solid: "hsl(38 92% 50%)", glow: "hsl(38 92% 60%)" },
    driver: { solid: "hsl(var(--cin-green))", glow: "hsl(var(--cin-green-glow))" },
    leverage: { solid: "hsl(229 89% 63%)", glow: "hsl(229 89% 73%)" },
    outcome: { solid: "hsl(var(--cin-green))", glow: "hsl(var(--cin-green-glow))" },
  };
  const { solid: color, glow: glowColor } = colorMap[signal.role] || colorMap.mechanism;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0, scale: hovered || isSelected ? 1.15 : 1 }}
      transition={{ delay: 0.2 + index * 0.12, duration: 0.6, type: "spring" }}
      className="absolute cursor-pointer"
      style={{
        left: `${xBase}%`, top: `${yBase}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isSelected ? 20 : hovered ? 15 : 10,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onSelect(isSelected ? null : signal); }}
    >
      <motion.div
        animate={{
          boxShadow: hovered || isSelected
            ? `0 0 ${size}px ${size / 3}px ${glowColor}35`
            : `0 0 ${size / 2}px ${size / 5}px ${glowColor}15`,
        }}
        className="rounded-full flex items-center justify-center"
        style={{
          width: size, height: size,
          background: `radial-gradient(circle at 40% 35%, ${color}25, ${color}05)`,
          border: `1.5px solid ${color}${hovered || isSelected ? '55' : '25'}`,
        }}
      >
        <span className="text-[9px] font-bold text-center leading-tight px-1 select-none"
          style={{ color }}>{label.length > 18 ? label.slice(0, 16) + "…" : label}</span>
      </motion.div>

      <AnimatePresence>
        {hovered && !isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md text-[9px] font-bold pointer-events-none z-30"
            style={{ top: size + 6, background: "hsl(var(--cin-depth-mid))", color: "hsl(var(--cin-label))", border: `1px solid ${color}20` }}
          >
            {ROLE_LABELS[signal.role]} · {signal.score}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DepthPanel({ signal, onClose }: { signal: RankedSignal; onClose: () => void }) {
  const colorMap: Record<string, string> = {
    mechanism: "hsl(38 92% 50%)", driver: "hsl(var(--cin-green))",
    leverage: "hsl(229 89% 63%)", outcome: "hsl(var(--cin-green))",
    constraint: "hsl(var(--cin-red))", assumption: "hsl(38 92% 50%)",
  };
  const color = colorMap[signal.role] || "hsl(var(--cin-label))";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="absolute z-30 rounded-xl p-4 max-w-[240px]"
      style={{
        left: "50%", bottom: "8%", transform: "translateX(-50%)",
        background: "hsl(var(--cin-depth-mid) / 0.95)",
        border: `1px solid ${color}20`,
        backdropFilter: "blur(16px)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="w-2 h-2 rounded-full mt-1" style={{ background: color }} />
        <div>
          <p className="text-xs font-bold" style={{ color: "hsl(0 0% 90%)" }}>{signal.label}</p>
          <p className="text-[10px] font-semibold" style={{ color }}>{ROLE_LABELS[signal.role]}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(["impact", "confidence", "recurrence"] as const).map((key) => (
          <div key={key} className="space-y-1">
            <p className="text-[8px] font-bold uppercase tracking-widest text-center" style={{ color: "hsl(var(--cin-label) / 0.5)" }}>{key}</p>
            <div className="flex items-center justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="w-1.5 h-3 rounded-sm"
                  style={{ background: i < signal[key] ? color : "hsl(var(--cin-depth-fg))" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={onClose}
        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
        style={{ background: "hsl(var(--cin-depth-fg))", color: "hsl(var(--cin-label) / 0.5)" }}>×</button>
    </motion.div>
  );
}

export function CinematicValueFlow({ story }: { story: VisualStory }) {
  const [selected, setSelected] = useState<RankedSignal | null>(null);

  const chain = useMemo(() => {
    const mechs = story.mechanisms.slice(0, 4);
    const outs = story.outcomes.slice(0, 2);
    const drvs = story.drivers.slice(0, 2);
    return [...drvs, ...mechs, ...outs];
  }, [story]);

  // Arrange as a flowing stream left→right
  const positions = useMemo(() =>
    chain.map((_, i) => ({
      x: 10 + (i / (chain.length - 1 || 1)) * 75,
      y: 35 + Math.sin(i * 1.2) * 15 + (i % 2) * 8,
    })),
    [chain]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        height: "clamp(300px, 40vh, 400px)",
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, hsl(var(--cin-depth-mid)), hsl(var(--cin-depth-bg)))",
        border: "1px solid hsl(var(--cin-depth-fg) / 0.5)",
        boxShadow: "0 12px 60px -12px hsl(0 0% 0% / 0.5)",
      }}
      onClick={() => setSelected(null)}
    >
      <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-extrabold uppercase tracking-[0.25em] z-10"
        style={{ color: "hsl(var(--cin-label) / 0.4)" }}>Value Flow</motion.p>

      {/* Flow stream lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="flow-grad">
            <stop offset="0%" stopColor="hsl(152 60% 44%)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="hsl(38 92% 50%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(152 60% 44%)" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        {positions.slice(0, -1).map((p, i) => {
          const next = positions[i + 1];
          return (
            <motion.line key={i}
              x1={`${p.x}%`} y1={`${p.y}%`} x2={`${next.x}%`} y2={`${next.y}%`}
              stroke="url(#flow-grad)" strokeWidth="1.5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ delay: 0.4 + i * 0.15, duration: 0.6 }}
            />
          );
        })}
      </svg>

      {chain.map((s, i) => (
        <FlowOrb key={i} signal={s} index={i} total={chain.length}
          onSelect={setSelected} isSelected={selected === s}
          xBase={positions[i].x} yBase={positions[i].y} />
      ))}

      <AnimatePresence>
        {selected && <DepthPanel signal={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-semibold uppercase tracking-widest z-10"
        style={{ color: "hsl(var(--cin-label) / 0.25)" }}>Tap signal to explore</motion.p>
    </motion.div>
  );
}
