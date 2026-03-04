import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VisualStory } from "@/lib/visualStoryCompiler";
import type { RankedSignal } from "@/lib/signalRanking";
import { normalizeSignalLabel } from "@/lib/visualEnforcementHelpers";

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC SIGNAL CONSTELLATION
   All signals arranged as a constellation/star field.
   Used for CLUSTERED_INTELLIGENCE and PRIORITIZED_SIGNAL_FIELD.
   ═══════════════════════════════════════════════════════════════ */

const ROLE_LABELS: Record<string, string> = {
  driver: "Driver", constraint: "Constraint", mechanism: "Mechanism",
  assumption: "Assumption", leverage: "Leverage", outcome: "Outcome",
};

const ROLE_COLORS: Record<string, { solid: string; glow: string }> = {
  driver: { solid: "hsl(var(--cin-green))", glow: "hsl(var(--cin-green-glow))" },
  constraint: { solid: "hsl(var(--cin-red))", glow: "hsl(var(--cin-red-glow))" },
  mechanism: { solid: "hsl(38 92% 50%)", glow: "hsl(38 92% 60%)" },
  assumption: { solid: "hsl(38 92% 50%)", glow: "hsl(38 92% 60%)" },
  leverage: { solid: "hsl(229 89% 63%)", glow: "hsl(229 89% 73%)" },
  outcome: { solid: "hsl(var(--cin-green))", glow: "hsl(var(--cin-green-glow))" },
};

function StarOrb({
  signal, index, total, maxScore, onSelect, isSelected,
}: {
  signal: RankedSignal; index: number; total: number; maxScore: number;
  onSelect: (s: RankedSignal | null) => void; isSelected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const label = normalizeSignalLabel(signal.label);
  const norm = signal.score / (maxScore || 1);
  const size = 32 + norm * 32;

  const { solid: color, glow: glowColor } = ROLE_COLORS[signal.role] || ROLE_COLORS.driver;

  // Distribute in a spiral pattern
  const goldenAngle = 2.399963;
  const angle = index * goldenAngle;
  const r = 18 + (index / total) * 22;
  const cx = 50 + Math.cos(angle) * r;
  const cy = 48 + Math.sin(angle) * r * 0.75;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: hovered || isSelected ? 1.2 : 1 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.5, type: "spring" }}
      className="absolute cursor-pointer"
      style={{
        left: `${cx}%`, top: `${cy}%`,
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
            ? `0 0 ${size}px ${size / 2}px ${glowColor}30`
            : `0 0 ${size / 3}px ${size / 6}px ${glowColor}12`,
        }}
        className="rounded-full flex items-center justify-center"
        style={{
          width: size, height: size,
          background: `radial-gradient(circle at 40% 35%, ${color}20, ${color}04)`,
          border: `1px solid ${color}${hovered || isSelected ? '50' : '20'}`,
        }}
      >
        <span className="text-[8px] font-bold text-center leading-tight px-0.5 select-none"
          style={{ color: `${color}` }}>
          {label.length > 16 ? label.slice(0, 14) + "…" : label}
        </span>
      </motion.div>

      <AnimatePresence>
        {hovered && !isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md text-[9px] font-bold pointer-events-none z-30"
            style={{ top: size + 4, background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", border: "1px solid hsl(var(--border))" }}
          >
            {ROLE_LABELS[signal.role]} · {signal.score}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DepthPanel({ signal, onClose }: { signal: RankedSignal; onClose: () => void }) {
  const color = (ROLE_COLORS[signal.role] || ROLE_COLORS.driver).solid;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="absolute z-30 rounded-xl p-4 max-w-[240px]"
      style={{
        right: "6%", bottom: "8%",
        background: "hsl(var(--popover) / 0.97)",
        border: `1px solid ${color}20`,
        backdropFilter: "blur(16px)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="w-2 h-2 rounded-full mt-1" style={{ background: color }} />
        <div>
          <p className="text-xs font-bold" style={{ color: "hsl(var(--foreground))" }}>{signal.label}</p>
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

export function CinematicConstellation({ story, title }: { story: VisualStory; title: string }) {
  const [selected, setSelected] = useState<RankedSignal | null>(null);

  const signals = useMemo(() =>
    [...story.drivers, ...story.constraints, ...story.mechanisms, ...story.assumptions, ...story.leverages, ...story.outcomes]
      .sort((a, b) => b.score - a.score).slice(0, 9),
    [story]
  );
  const maxScore = signals[0]?.score || 1;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        height: "clamp(300px, 42vh, 420px)",
        background: "radial-gradient(ellipse 70% 55% at 50% 50%, hsl(var(--cin-depth-mid)), hsl(var(--cin-depth-bg)))",
        border: "1px solid hsl(var(--cin-depth-fg))",
        boxShadow: "0 4px 24px -8px hsl(220 20% 80% / 0.3)",
      }}
      onClick={() => setSelected(null)}
    >
      <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-extrabold uppercase tracking-[0.25em] z-10"
        style={{ color: "hsl(var(--cin-label) / 0.4)" }}>{title}</motion.p>

      {signals.map((s, i) => (
        <StarOrb key={i} signal={s} index={i} total={signals.length} maxScore={maxScore}
          onSelect={setSelected} isSelected={selected === s} />
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
