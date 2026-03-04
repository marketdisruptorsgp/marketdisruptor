import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VisualStory } from "@/lib/visualStoryCompiler";
import type { RankedSignal } from "@/lib/signalRanking";
import { normalizeSignalLabel } from "@/lib/visualEnforcementHelpers";

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC FRAGILITY FIELD
   Assumptions rendered as fracture points in a dark field.
   Larger = more dangerous. Tap to reveal depth.
   ═══════════════════════════════════════════════════════════════ */

const ROLE_LABELS: Record<string, string> = {
  driver: "Driver", constraint: "Constraint", mechanism: "Mechanism",
  assumption: "Assumption", leverage: "Leverage", outcome: "Outcome",
};

function FractureOrb({
  signal, index, total, maxScore, onSelect, isSelected,
}: {
  signal: RankedSignal; index: number; total: number; maxScore: number;
  onSelect: (s: RankedSignal | null) => void; isSelected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const label = normalizeSignalLabel(signal.label);
  const norm = signal.score / (maxScore || 1);

  // Arrange in a scattered pattern across the field
  const angle = (index / total) * Math.PI * 1.6 + 0.3;
  const radius = 25 + (1 - norm) * 15 + (index % 2) * 5;
  const cx = 50 + Math.cos(angle) * radius;
  const cy = 48 + Math.sin(angle) * radius * 0.7;
  const size = 40 + norm * 30;

  const isAssumption = signal.role === "assumption";
  const color = isAssumption ? "hsl(38 92% 50%)" : "hsl(var(--cin-red))";
  const glowColor = isAssumption ? "hsl(38 92% 60%)" : "hsl(var(--cin-red-glow))";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: 1, scale: hovered || isSelected ? 1.18 : 1 }}
      transition={{ delay: 0.2 + index * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
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
            ? `0 0 ${size}px ${size / 2}px ${glowColor}35, 0 0 ${size * 2.5}px ${size}px ${glowColor}10`
            : `0 0 ${size / 2}px ${size / 4}px ${glowColor}15`,
        }}
        className="rounded-full flex items-center justify-center"
        style={{
          width: size, height: size,
          background: `radial-gradient(circle at 35% 30%, ${color}25, ${color}06)`,
          border: `1.5px ${isAssumption ? 'dashed' : 'solid'} ${color}${hovered || isSelected ? '55' : '25'}`,
        }}
      >
        <span className="text-xs font-bold text-center leading-tight px-1 select-none"
          style={{ color }}>
          {label.length > 18 ? label.slice(0, 16) + "…" : label}
        </span>
      </motion.div>

      <AnimatePresence>
        {hovered && !isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.12 }}
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md text-xs font-bold pointer-events-none z-30"
            style={{ top: size + 6, background: "hsl(var(--popover))", color: "hsl(var(--popover-foreground))", border: `1px solid ${color}20` }}
          >
            {ROLE_LABELS[signal.role]} · {signal.score}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DepthPanel({ signal, onClose }: { signal: RankedSignal; onClose: () => void }) {
  const isAssumption = signal.role === "assumption";
  const color = isAssumption ? "hsl(38 92% 50%)" : "hsl(var(--cin-red))";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.25, type: "spring", stiffness: 200 }}
      className="absolute z-30 rounded-xl p-4 max-w-[240px]"
      style={{
        right: "6%", bottom: "8%",
        background: "hsl(var(--popover) / 0.97)",
        border: `1px solid ${color}20`,
        boxShadow: `0 8px 40px ${color}15`,
        backdropFilter: "blur(16px)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0"
          style={{ background: color, boxShadow: `0 0 8px ${color}50` }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-snug" style={{ color: "hsl(var(--foreground))" }}>{signal.label}</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color }}>{ROLE_LABELS[signal.role]}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        {(["impact", "confidence", "recurrence"] as const).map((key) => (
          <div key={key} className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: "hsl(var(--foreground) / 0.7)" }}>{key}</p>
            <div className="flex items-center justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="w-1.5 h-3 rounded-sm"
                  style={{ background: i < signal[key] ? color : "hsl(var(--cin-depth-fg))" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(var(--foreground) / 0.5)" }}>Score</span>
        <span className="text-sm font-extrabold" style={{ color }}>{signal.score}</span>
      </div>
      <button onClick={onClose}
        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{ background: "hsl(var(--cin-depth-fg))", color: "hsl(var(--cin-label) / 0.5)" }}>×</button>
    </motion.div>
  );
}

export function CinematicFragility({ story }: { story: VisualStory }) {
  const [selected, setSelected] = useState<RankedSignal | null>(null);
  const signals = useMemo(
    () => [...story.assumptions, ...story.constraints].sort((a, b) => b.score - a.score).slice(0, 7),
    [story]
  );
  const maxScore = signals[0]?.score || 1;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        height: "clamp(320px, 45vh, 440px)",
        background: "radial-gradient(ellipse 70% 55% at 50% 50%, hsl(var(--cin-depth-mid)), hsl(var(--cin-depth-bg)))",
        border: "1px solid hsl(var(--cin-depth-fg))",
        boxShadow: "0 4px 24px -8px hsl(220 20% 80% / 0.3)",
      }}
      onClick={() => setSelected(null)}
    >
      <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-extrabold uppercase tracking-[0.2em] z-10"
        style={{ color: "hsl(var(--foreground) / 0.5)" }}>
        Fragility Field
      </motion.p>

      {/* Center risk indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-5 flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "radial-gradient(circle, hsl(var(--cin-red) / 0.08), transparent)",
            border: "1px solid hsl(var(--cin-red) / 0.12)",
          }}>
          <span className="text-lg font-extrabold" style={{ color: "hsl(var(--cin-red) / 0.4)" }}>{signals.length}</span>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest mt-1"
          style={{ color: "hsl(var(--foreground) / 0.4)" }}>Risk Points</span>
      </motion.div>

      {signals.map((s, i) => (
        <FractureOrb key={i} signal={s} index={i} total={signals.length} maxScore={maxScore}
          onSelect={setSelected} isSelected={selected === s} />
      ))}

      <AnimatePresence>
        {selected && <DepthPanel signal={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-widest z-10"
        style={{ color: "hsl(var(--foreground) / 0.35)" }}>
        Tap to explore risk
      </motion.p>
    </motion.div>
  );
}
