import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

/* Scene 3 — FIRST-PRINCIPLES FLIP
   Split: conventional fades, structural dominates. Impact bar 35→73%.
   Holds 1.5s in silence after the flip. */
export default function SceneFlip() {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-lg grid grid-cols-2 gap-4">
        {/* Left — Conventional */}
        <motion.div
          animate={{ opacity: flipped ? 0.3 : 1, scale: flipped ? 0.96 : 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl p-5 border relative"
          style={{
            background: "hsl(var(--muted) / 0.4)",
            borderColor: "hsl(var(--border))",
          }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
          >
            Conventional
          </p>
          <p
            className="text-sm font-bold leading-snug"
            style={{ color: "hsl(var(--foreground) / 0.6)" }}
          >
            Increase airflow power
          </p>
          <p
            className="text-xs mt-2"
            style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
          >
            Optimizes symptom
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div
              className="h-2 flex-1 rounded-full overflow-hidden"
              style={{ background: "hsl(var(--border))" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: "35%",
                  background: "hsl(var(--muted-foreground) / 0.2)",
                }}
              />
            </div>
            <span
              className="text-[10px] font-bold tabular-nums"
              style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
            >
              35%
            </span>
          </div>
        </motion.div>

        {/* Right — Structural */}
        <motion.div
          animate={{
            opacity: flipped ? 1 : 0.4,
            scale: flipped ? 1 : 0.96,
          }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl p-5 border-2 relative"
          style={{
            background: flipped
              ? "hsl(var(--primary) / 0.04)"
              : "hsl(var(--muted) / 0.3)",
            borderColor: flipped
              ? "hsl(var(--primary) / 0.4)"
              : "hsl(var(--border))",
          }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: "hsl(var(--primary))" }}
          >
            Structural
          </p>
          <p
            className="text-sm font-bold leading-snug"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Redesign coverage geometry
          </p>
          <p
            className="text-xs mt-2"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Relieves binding constraint
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div
              className="h-2 flex-1 rounded-full overflow-hidden"
              style={{ background: "hsl(var(--primary) / 0.12)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: flipped ? "73%" : "0%" }}
                transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ background: "hsl(var(--primary))" }}
              />
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: flipped ? 1 : 0 }}
              transition={{ delay: 0.8 }}
              className="text-[10px] font-bold tabular-nums"
              style={{ color: "hsl(var(--primary))" }}
            >
              73%
            </motion.span>
          </div>
        </motion.div>
      </div>

      {/* Hold in silence — the mic-drop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: flipped ? 1 : 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="mt-6"
      >
        <p
          className="text-xs font-semibold tracking-wide text-center"
          style={{ color: "hsl(var(--primary))" }}
        >
          The recommendation flips when the binding constraint is identified.
        </p>
      </motion.div>
    </div>
  );
}
