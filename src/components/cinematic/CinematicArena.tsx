import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VisualStory } from "@/lib/visualStoryCompiler";
import type { RankedSignal } from "@/lib/signalRanking";
import { normalizeSignalLabel } from "@/lib/visualEnforcementHelpers";

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC ADVERSARIAL ARENA
   Spatial, depth-driven composition replacing grid layout.
   Red forces (left) vs Green forces (right) in a dark field.
   Verdict orb at center. Tap signal → reveal depth.
   ═══════════════════════════════════════════════════════════════ */

const ROLE_LABELS: Record<string, string> = {
  driver: "Driver", constraint: "Constraint", mechanism: "Mechanism",
  assumption: "Assumption", leverage: "Leverage", outcome: "Outcome",
};

/* ── Signal Orb: a glowing spatial element ── */
function SignalOrb({
  signal,
  side,
  index,
  total,
  onSelect,
  isSelected,
}: {
  signal: RankedSignal;
  side: "red" | "green";
  index: number;
  total: number;
  onSelect: (s: RankedSignal | null) => void;
  isSelected: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const label = normalizeSignalLabel(signal.label);
  const scoreNorm = Math.min(1, signal.score / 60);

  // Spatial positioning: distribute signals vertically with slight horizontal variation
  const yPercent = total <= 1 ? 50 : 15 + (index / (total - 1)) * 70;
  const xBase = side === "red" ? 18 : 82;
  const xJitter = (index % 3 - 1) * 8;
  const xPercent = xBase + xJitter;

  // Size by score
  const size = 36 + scoreNorm * 28;

  const glowColor = side === "red"
    ? "hsl(var(--cin-red-glow))"
    : "hsl(var(--cin-green-glow))";
  const solidColor = side === "red"
    ? "hsl(var(--cin-red))"
    : "hsl(var(--cin-green))";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{
        opacity: 1,
        scale: hovered || isSelected ? 1.15 : 1,
      }}
      transition={{ delay: 0.15 + index * 0.08, duration: 0.5, type: "spring", stiffness: 120 }}
      className="absolute cursor-pointer"
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isSelected ? 20 : hovered ? 15 : 10 - index,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(isSelected ? null : signal);
      }}
    >
      {/* Glow halo */}
      <motion.div
        animate={{
          boxShadow: hovered || isSelected
            ? `0 0 ${size}px ${size / 3}px ${glowColor}40, 0 0 ${size * 2}px ${size / 2}px ${glowColor}15`
            : `0 0 ${size / 2}px ${size / 6}px ${glowColor}20`,
        }}
        className="rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 40% 35%, ${solidColor}30, ${solidColor}08)`,
          border: `1.5px solid ${solidColor}${hovered || isSelected ? '60' : '30'}`,
        }}
      >
        <span
          className="text-xs font-bold text-center leading-tight px-1 select-none"
          style={{ color: `${solidColor}` }}
        >
          {label.length > 20 ? label.slice(0, 18) + "…" : label}
        </span>
      </motion.div>

      {/* Hover micro-label */}
      <AnimatePresence>
        {hovered && !isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md text-xs font-bold pointer-events-none"
            style={{
              top: size + 6,
              background: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
              border: `1px solid ${solidColor}25`,
              boxShadow: `0 4px 16px ${solidColor}15`,
            }}
          >
            {ROLE_LABELS[signal.role]} · {signal.score}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Signal Detail Panel (tap-revealed, spatial) ── */
function SignalDepthPanel({
  signal,
  side,
  onClose,
}: {
  signal: RankedSignal;
  side: "red" | "green";
  onClose: () => void;
}) {
  const color = side === "red" ? "hsl(var(--cin-red))" : "hsl(var(--cin-green))";
  const glowColor = side === "red" ? "hsl(var(--cin-red-glow))" : "hsl(var(--cin-green-glow))";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.25, type: "spring", stiffness: 200 }}
      className="absolute z-30 rounded-xl p-4 max-w-[260px]"
      style={{
        [side === "red" ? "left" : "right"]: "8%",
        bottom: "10%",
        background: "hsl(var(--popover) / 0.97)",
        border: `1px solid ${color}25`,
        boxShadow: `0 8px 40px ${glowColor}20, 0 0 0 1px ${color}10`,
        backdropFilter: "blur(16px)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${glowColor}60` }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-snug" style={{ color: "hsl(var(--foreground))" }}>{signal.label}</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color }}>{ROLE_LABELS[signal.role]}</p>
        </div>
      </div>

      {/* Metric bars */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {(["impact", "confidence", "recurrence"] as const).map((key) => (
          <div key={key} className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: "hsl(var(--foreground) / 0.7)" }}>{key}</p>
            <div className="flex items-center justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05 * i }}
                  className="w-1.5 h-3 rounded-sm"
                  style={{ background: i < signal[key] ? color : "hsl(var(--cin-depth-fg))" }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Score */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(var(--foreground) / 0.5)" }}>Score</span>
          <span className="text-sm font-extrabold" style={{ color }}>{signal.score}</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--cin-depth-fg))" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (signal.score / 75) * 100)}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${glowColor})` }}
          />
        </div>
      </div>

      {signal.sourceKeys.length > 0 && (
        <div className="pt-2" style={{ borderTop: `1px solid hsl(var(--cin-depth-fg))` }}>
          <div className="flex flex-wrap gap-1">
            {signal.sourceKeys.map((src, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 rounded font-medium"
                style={{ background: "hsl(var(--cin-depth-fg))", color: "hsl(var(--foreground) / 0.7)" }}>
                {src}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{ background: "hsl(var(--cin-depth-fg))", color: "hsl(var(--cin-label) / 0.5)" }}
      >
        ×
      </button>
    </motion.div>
  );
}

/* ── Verdict Orb: center of the arena ── */
function VerdictOrb({ story }: { story: VisualStory }) {
  const viability = useMemo(() => {
    const red = story.constraints.length + story.assumptions.length;
    const green = story.drivers.length + story.leverages.length;
    return green / (red + green || 1);
  }, [story]);

  const level = story.verdict.level;
  const color = level === "strong"
    ? "hsl(var(--cin-green))"
    : level === "conditional"
    ? "hsl(var(--cin-green-glow))"
    : "hsl(var(--cin-red))";
  const glowColor = level === "strong"
    ? "hsl(var(--cin-green-glow))"
    : level === "conditional"
    ? "hsl(38 92% 50%)"
    : "hsl(var(--cin-red-glow))";

  const verdictLabel = level === "strong" ? "Resilient"
    : level === "conditional" ? "Conditional"
    : level === "weak" ? "Fragile" : "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 80 }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
    >
      {/* Outer glow ring */}
      <div
        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(${color} ${viability * 360}deg, hsl(var(--cin-verdict-ring)) 0deg)`,
          boxShadow: `0 0 60px ${glowColor}30, 0 0 120px ${glowColor}10`,
        }}
      >
        {/* Inner core */}
        <div
          className="w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full flex flex-col items-center justify-center"
          style={{ background: "hsl(var(--cin-surface))" }}
        >
          <span className="text-base sm:text-lg font-extrabold" style={{ color }}>
            {Math.round(viability * 100)}%
          </span>
          <span className="text-xs font-bold uppercase tracking-widest mt-0.5" style={{ color: "hsl(var(--foreground) / 0.5)" }}>
            Viability
          </span>
        </div>
      </div>

      {/* Verdict label */}
      <motion.span
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-3 px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest"
        style={{
          color,
          background: `${color}10`,
          border: `1px solid ${color}20`,
          boxShadow: `0 0 16px ${glowColor}15`,
        }}
      >
        {verdictLabel}
      </motion.span>

      {/* Micro verdict text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xs font-semibold text-center mt-2 max-w-[180px] leading-relaxed"
        style={{ color: "hsl(var(--foreground) / 0.5)" }}
      >
        {story.verdict.summary.length > 80
          ? story.verdict.summary.slice(0, 78) + "…"
          : story.verdict.summary}
      </motion.p>
    </motion.div>
  );
}

/* ── Pressure Wave Lines (connecting forces to center) ── */
function PressureWaves({ side }: { side: "red" | "green" }) {
  const color = side === "red" ? "hsl(var(--cin-red))" : "hsl(var(--cin-green))";
  const x1 = side === "red" ? "25%" : "75%";
  const x2 = "50%";

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <linearGradient id={`wave-${side}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={side === "red" ? color : "transparent"} stopOpacity="0.12" />
          <stop offset="50%" stopColor={color} stopOpacity="0.04" />
          <stop offset="100%" stopColor={side === "green" ? color : "transparent"} stopOpacity="0.12" />
        </linearGradient>
      </defs>
      {[30, 45, 60, 70].map((y, i) => (
        <motion.line
          key={i}
          x1={x1} y1={`${y}%`}
          x2={x2} y2={`${y + (i % 2 ? 3 : -3)}%`}
          stroke={`url(#wave-${side})`}
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.6 }}
          transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
        />
      ))}
    </svg>
  );
}

/* ── Side Label ── */
function SideLabel({ side }: { side: "red" | "green" }) {
  const color = side === "red" ? "hsl(var(--cin-red))" : "hsl(var(--cin-green))";
  const label = side === "red" ? "Attack" : "Defense";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="absolute top-4"
      style={{ [side === "red" ? "left" : "right"]: "6%" }}
    >
      <span
        className="text-xs font-extrabold uppercase tracking-[0.15em]"
        style={{ color: `${color}` }}
      >
        {label}
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */
export function CinematicArena({ story }: { story: VisualStory }) {
  const [selectedSignal, setSelectedSignal] = useState<RankedSignal | null>(null);

  const red = useMemo(() => [...story.constraints, ...story.assumptions].slice(0, 6), [story]);
  const green = useMemo(() => [...story.drivers, ...story.leverages].slice(0, 6), [story]);

  const selectedSide = selectedSignal
    ? red.includes(selectedSignal) ? "red" : "green"
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        height: "clamp(340px, 50vh, 480px)",
        background: `radial-gradient(ellipse 80% 60% at 50% 50%, hsl(var(--cin-depth-mid)), hsl(var(--cin-depth-bg)))`,
        border: "1px solid hsl(var(--cin-depth-fg))",
        boxShadow: "0 4px 24px -8px hsl(220 20% 80% / 0.3)",
      }}
      onClick={() => setSelectedSignal(null)}
    >
      {/* Background pressure waves */}
      <PressureWaves side="red" />
      <PressureWaves side="green" />

      {/* Side labels */}
      <SideLabel side="red" />
      <SideLabel side="green" />

      {/* Headline */}
      <motion.p
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-extrabold uppercase tracking-[0.2em] z-10"
        style={{ color: "hsl(var(--foreground) / 0.5)" }}
      >
        Survival Arena
      </motion.p>

      {/* Red team signals */}
      {red.map((s, i) => (
        <SignalOrb
          key={`r-${i}`}
          signal={s}
          side="red"
          index={i}
          total={red.length}
          onSelect={setSelectedSignal}
          isSelected={selectedSignal === s}
        />
      ))}

      {/* Green team signals */}
      {green.map((s, i) => (
        <SignalOrb
          key={`g-${i}`}
          signal={s}
          side="green"
          index={i}
          total={green.length}
          onSelect={setSelectedSignal}
          isSelected={selectedSignal === s}
        />
      ))}

      {/* Verdict orb — center */}
      <VerdictOrb story={story} />

      {/* Depth panel — tap revealed */}
      <AnimatePresence>
        {selectedSignal && selectedSide && (
          <SignalDepthPanel
            signal={selectedSignal}
            side={selectedSide}
            onClose={() => setSelectedSignal(null)}
          />
        )}
      </AnimatePresence>

      {/* Bottom interaction hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-widest z-10"
        style={{ color: "hsl(var(--foreground) / 0.35)" }}
      >
        Tap signal to explore
      </motion.p>
    </motion.div>
  );
}
