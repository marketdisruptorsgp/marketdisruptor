import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VisualStory } from "@/lib/visualStoryCompiler";
import type { RankedSignal } from "@/lib/signalRanking";
import { normalizeSignalLabel } from "@/lib/visualEnforcementHelpers";

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC TENSION SCULPTURE
   Drivers (left, green) and Constraints (right, red) as opposing
   pressure fields with mechanisms bridging them in center.
   ═══════════════════════════════════════════════════════════════ */

const ROLE_LABELS: Record<string, string> = {
  driver: "Driver", constraint: "Constraint", mechanism: "Mechanism",
  assumption: "Assumption", leverage: "Leverage", outcome: "Outcome",
};

function TensionOrb({
  signal, side, index, total, onSelect, isSelected,
}: {
  signal: RankedSignal; side: "driver" | "constraint" | "mechanism";
  index: number; total: number;
  onSelect: (s: RankedSignal | null) => void; isSelected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const label = normalizeSignalLabel(signal.label);
  const norm = Math.min(1, signal.score / 60);
  const size = 38 + norm * 26;

  const colorMap = {
    driver: { solid: "hsl(var(--cin-green))", glow: "hsl(var(--cin-green-glow))" },
    constraint: { solid: "hsl(var(--cin-red))", glow: "hsl(var(--cin-red-glow))" },
    mechanism: { solid: "hsl(38 92% 50%)", glow: "hsl(38 92% 60%)" },
  };
  const { solid: color, glow: glowColor } = colorMap[side];

  // Position: drivers left, constraints right, mechanisms center
  const yPercent = total <= 1 ? 50 : 20 + (index / (total - 1)) * 60;
  const xMap = { driver: 16 + (index % 2) * 6, constraint: 78 + (index % 2) * 6, mechanism: 45 + (index % 3 - 1) * 8 };
  const xPercent = xMap[side];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: hovered || isSelected ? 1.15 : 1 }}
      transition={{ delay: 0.15 + index * 0.08, duration: 0.5, type: "spring", stiffness: 120 }}
      className="absolute cursor-pointer"
      style={{
        left: `${xPercent}%`, top: `${yPercent}%`,
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
            transition={{ duration: 0.12 }}
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
    driver: "hsl(var(--cin-green))", constraint: "hsl(var(--cin-red))",
    mechanism: "hsl(38 92% 50%)", leverage: "hsl(229 89% 63%)",
    assumption: "hsl(38 92% 50%)", outcome: "hsl(var(--cin-green))",
  };
  const color = colorMap[signal.role] || "hsl(var(--cin-label))";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="absolute z-30 rounded-xl p-4 max-w-[240px]"
      style={{
        left: "50%", bottom: "8%", transform: "translateX(-50%)",
        background: "hsl(var(--cin-depth-mid) / 0.95)",
        border: `1px solid ${color}20`,
        backdropFilter: "blur(16px)",
        boxShadow: `0 8px 40px ${color}15`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: color }} />
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

export function CinematicTension({ story }: { story: VisualStory }) {
  const [selected, setSelected] = useState<RankedSignal | null>(null);

  const drivers = useMemo(() => story.drivers.slice(0, 4), [story]);
  const constraints = useMemo(() => story.constraints.slice(0, 4), [story]);
  const mechs = useMemo(() => [...story.mechanisms.slice(0, 2), ...story.leverages.slice(0, 2)], [story]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        height: "clamp(320px, 45vh, 440px)",
        background: "radial-gradient(ellipse 80% 60% at 50% 50%, hsl(var(--cin-depth-mid)), hsl(var(--cin-depth-bg)))",
        border: "1px solid hsl(var(--cin-depth-fg) / 0.5)",
        boxShadow: "0 12px 60px -12px hsl(0 0% 0% / 0.5)",
      }}
      onClick={() => setSelected(null)}
    >
      {/* Labels */}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-extrabold uppercase tracking-[0.25em] z-10"
        style={{ color: "hsl(var(--cin-label) / 0.4)" }}>Tension Map</motion.p>

      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="absolute top-4 left-[6%] text-[9px] font-extrabold uppercase tracking-[0.15em]"
        style={{ color: "hsl(var(--cin-green) / 0.5)" }}>Drivers</motion.span>

      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="absolute top-4 right-[6%] text-[9px] font-extrabold uppercase tracking-[0.15em]"
        style={{ color: "hsl(var(--cin-red) / 0.5)" }}>Constraints</motion.span>

      {/* Tension line through center */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <defs>
          <linearGradient id="tension-line" x1="0" x2="1">
            <stop offset="0%" stopColor="hsl(152 60% 44%)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="hsl(38 92% 50%)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(0 72% 52%)" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="url(#tension-line)" strokeWidth="1" />
      </svg>

      {drivers.map((s, i) => (
        <TensionOrb key={`d-${i}`} signal={s} side="driver" index={i} total={drivers.length}
          onSelect={setSelected} isSelected={selected === s} />
      ))}
      {constraints.map((s, i) => (
        <TensionOrb key={`c-${i}`} signal={s} side="constraint" index={i} total={constraints.length}
          onSelect={setSelected} isSelected={selected === s} />
      ))}
      {mechs.map((s, i) => (
        <TensionOrb key={`m-${i}`} signal={s} side="mechanism" index={i} total={mechs.length}
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
