import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   SCENE 3 — THE FLIP
   The most important moment. Two force vectors visualized.
   Conventional vector shrinks. Structural vector expands.
   Impact field shifts. The system reorganizes.
   1.5s hold in silence after the flip.
   ═══════════════════════════════════════════════════════════════ */

export default function SceneFlip() {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-lg h-[280px]">
        {/* Impact field — background energy */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: flipped
              ? "radial-gradient(ellipse at 70% 50%, hsl(var(--primary) / 0.04) 0%, transparent 70%)"
              : "radial-gradient(ellipse at 30% 50%, hsl(var(--foreground) / 0.02) 0%, transparent 70%)",
          }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />

        {/* Conventional vector — left */}
        <motion.div
          className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2"
          animate={{
            opacity: flipped ? 0.15 : 0.8,
            scale: flipped ? 0.7 : 1,
            x: flipped ? -10 : 0,
          }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Force line — thin, diminishing */}
            <motion.div
              className="rounded-full"
              style={{
                width: 3,
                background: "hsl(var(--foreground) / 0.12)",
              }}
              animate={{ height: flipped ? 40 : 100 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                border: "1px solid hsl(var(--foreground) / 0.08)",
                background: "hsl(var(--foreground) / 0.02)",
              }}
            >
              <span
                className="text-[10px] font-bold tabular-nums"
                style={{ color: "hsl(var(--foreground) / 0.2)" }}
              >
                35
              </span>
            </div>
            <span
              className="text-[8px] font-semibold tracking-widest uppercase"
              style={{ color: "hsl(var(--foreground) / 0.15)" }}
            >
              Incremental
            </span>
          </div>
        </motion.div>

        {/* Center divider — transforms */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{
            scaleY: flipped ? 0.6 : 1,
            opacity: flipped ? 0.1 : 0.15,
          }}
          transition={{ duration: 1 }}
        >
          <div
            className="w-px h-40"
            style={{ background: "hsl(var(--foreground) / 0.1)" }}
          />
        </motion.div>

        {/* Structural vector — right, dominates */}
        <motion.div
          className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2"
          animate={{
            opacity: flipped ? 1 : 0.3,
            scale: flipped ? 1.1 : 0.9,
            x: flipped ? -20 : 0,
          }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Force line — strong, expanding */}
            <motion.div
              className="rounded-full"
              style={{
                width: 4,
                background: flipped
                  ? "hsl(var(--primary) / 0.6)"
                  : "hsl(var(--primary) / 0.1)",
              }}
              animate={{ height: flipped ? 120 : 60 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="rounded-full flex items-center justify-center"
              style={{
                border: `2px solid ${
                  flipped
                    ? "hsl(var(--primary) / 0.4)"
                    : "hsl(var(--primary) / 0.08)"
                }`,
                background: flipped
                  ? "hsl(var(--primary) / 0.08)"
                  : "transparent",
              }}
              animate={{
                width: flipped ? 56 : 40,
                height: flipped ? 56 : 40,
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.span
                className="text-sm font-bold tabular-nums"
                style={{ color: "hsl(var(--primary))" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: flipped ? 1 : 0 }}
                transition={{ delay: 0.6 }}
              >
                73
              </motion.span>
            </motion.div>
            <span
              className="text-[8px] font-semibold tracking-widest uppercase"
              style={{
                color: flipped
                  ? "hsl(var(--primary) / 0.7)"
                  : "hsl(var(--primary) / 0.15)",
              }}
            >
              Structural
            </span>
          </div>
        </motion.div>

        {/* Impact arc — connects the shift */}
        {flipped && (
          <motion.div
            className="absolute top-6 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 0.15, scaleX: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            <svg width="200" height="30" viewBox="0 0 200 30">
              <path
                d="M 20 28 Q 100 0 180 28"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                strokeDasharray="3 5"
              />
            </svg>
          </motion.div>
        )}

        {/* The hold — silence after flip */}
        <motion.div
          className="absolute bottom-4 left-0 right-0 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: flipped ? 1 : 0 }}
          transition={{ delay: 1.8, duration: 1 }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "hsl(var(--primary) / 0.3)" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
