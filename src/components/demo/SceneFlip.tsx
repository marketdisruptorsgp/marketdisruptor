import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   SCENE 3 — CONSTRAINT DOMINANCE + FIRST PRINCIPLES FLIP [20–40s]
   The dominant constraint locks into focus.
   System reorganizes structure around it.
   Invalid paths fade. New design emerges from constraint.
   Impact shifts from 35% → 73%.
   1.5s hold after the flip — the "aha" moment.
   ═══════════════════════════════════════════════════════════════ */

const INVALID_PATHS = [
  { label: "Motor upgrade", x: 15, y: 20 },
  { label: "Filter addition", x: 12, y: 45 },
  { label: "Speed increase", x: 18, y: 70 },
];

const STRUCTURAL_CHAIN = [
  { label: "Coverage geometry", isPrimary: true },
  { label: "Nozzle angle", isPrimary: false },
  { label: "Drying surface", isPrimary: false },
  { label: "Time reduction", isPrimary: false },
];

export default function SceneFlip() {
  const [phase, setPhase] = useState<"build" | "flip" | "hold">("build");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("flip"), 5000);
    const t2 = setTimeout(() => setPhase("hold"), 10000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const isFlipped = phase === "flip" || phase === "hold";

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden min-h-[300px]">
      <div className="relative w-full max-w-lg h-[300px]">
        {/* Background energy field shifts */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{
            background: isFlipped
              ? "radial-gradient(ellipse at 65% 50%, hsl(var(--primary) / 0.06) 0%, transparent 70%)"
              : "radial-gradient(ellipse at 35% 50%, hsl(var(--foreground) / 0.015) 0%, transparent 70%)",
          }}
          transition={{ duration: 2 }}
        />

        {/* LEFT: Invalid paths — fade out on flip */}
        <div className="absolute left-4 sm:left-8 top-0 bottom-0 flex flex-col justify-center gap-5">
          {INVALID_PATHS.map((p, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2.5"
              initial={{ opacity: 0, x: -8 }}
              animate={{
                opacity: isFlipped ? 0.06 : 0.5,
                x: isFlipped ? -12 : 0,
                filter: isFlipped ? "blur(2px)" : "blur(0px)",
              }}
              transition={{
                delay: isFlipped ? i * 0.1 : 0.5 + i * 0.4,
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: isFlipped
                    ? "hsl(var(--foreground) / 0.05)"
                    : "hsl(var(--foreground) / 0.12)",
                }}
              />
              <span
                className="text-[10px] font-medium"
                style={{
                  color: isFlipped
                    ? "hsl(var(--foreground) / 0.08)"
                    : "hsl(var(--foreground) / 0.3)",
                  textDecoration: isFlipped ? "line-through" : "none",
                }}
              >
                {p.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* CENTER: Vertical divider transforms */}
        <motion.div
          className="absolute left-[38%] sm:left-[42%] top-[15%] bottom-[15%]"
          animate={{
            opacity: isFlipped ? 0.06 : 0.1,
          }}
          transition={{ duration: 1 }}
        >
          <div
            className="w-px h-full"
            style={{ background: "hsl(var(--foreground))" }}
          />
        </motion.div>

        {/* RIGHT: Structural chain — emerges and dominates */}
        <div className="absolute right-4 sm:right-8 top-0 bottom-0 flex flex-col justify-center gap-1">
          {STRUCTURAL_CHAIN.map((node, i) => (
            <div key={i} className="flex flex-col items-start">
              {/* Connecting line */}
              {i > 0 && (
                <motion.div
                  className="ml-3 rounded-full"
                  style={{
                    width: 1.5,
                    background: isFlipped
                      ? "hsl(var(--primary) / 0.3)"
                      : "hsl(var(--primary) / 0.06)",
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: isFlipped ? 16 : 8 }}
                  transition={{
                    delay: isFlipped ? 0.5 + i * 0.3 : 1 + i * 0.5,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              )}
              <motion.div
                className="flex items-center gap-2.5"
                initial={{ opacity: 0, x: 8 }}
                animate={{
                  opacity: isFlipped ? 1 : 0.3,
                  x: 0,
                  scale: isFlipped && node.isPrimary ? 1.08 : 1,
                }}
                transition={{
                  delay: isFlipped ? 0.3 + i * 0.3 : 0.8 + i * 0.5,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div
                  className="rounded-full shrink-0"
                  style={{
                    width: node.isPrimary ? 8 : 6,
                    height: node.isPrimary ? 8 : 6,
                    background: isFlipped
                      ? node.isPrimary
                        ? "hsl(var(--primary))"
                        : "hsl(var(--primary) / 0.4)"
                      : "hsl(var(--primary) / 0.1)",
                  }}
                />
                <span
                  className="text-[11px] font-semibold tracking-tight"
                  style={{
                    color: isFlipped
                      ? node.isPrimary
                        ? "hsl(var(--primary))"
                        : "hsl(var(--foreground) / 0.6)"
                      : "hsl(var(--foreground) / 0.15)",
                  }}
                >
                  {node.label}
                </span>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Impact shift indicator: 35 → 73 */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFlipped ? 1 : 0 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <span
            className="text-[11px] font-bold tabular-nums"
            style={{ color: "hsl(var(--foreground) / 0.2)" }}
          >
            35%
          </span>
          <motion.div
            className="flex items-center gap-1"
            initial={{ width: 0 }}
            animate={{ width: isFlipped ? 60 : 0 }}
            transition={{ delay: 2, duration: 0.8 }}
          >
            <div
              className="h-px flex-1"
              style={{ background: "hsl(var(--primary) / 0.3)" }}
            />
            <div
              className="w-0 h-0"
              style={{
                borderLeft: "4px solid hsl(var(--primary) / 0.4)",
                borderTop: "2px solid transparent",
                borderBottom: "2px solid transparent",
              }}
            />
          </motion.div>
          <motion.span
            className="text-base font-bold tabular-nums"
            style={{ color: "hsl(var(--primary))" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: isFlipped ? 1 : 0,
              scale: isFlipped ? 1 : 0.8,
            }}
            transition={{ delay: 2.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            73%
          </motion.span>
        </motion.div>

        {/* Hold marker — silence after flip */}
        {phase === "hold" && (
          <motion.div
            className="absolute top-4 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ duration: 1.5 }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "hsl(var(--primary))" }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
