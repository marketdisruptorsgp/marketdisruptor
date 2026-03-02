import React from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   SCENE 1 — THE LIMITATION
   Conventional output appears confident but shallow.
   Nodes float disconnected. No structure. No causality.
   A faint grid beneath reveals: there IS a structure — they just missed it.
   ═══════════════════════════════════════════════════════════════ */

const NODES = [
  { x: 15, y: 25, label: "Power", size: 38 },
  { x: 55, y: 18, label: "Filter", size: 32 },
  { x: 82, y: 35, label: "Noise", size: 28 },
  { x: 30, y: 65, label: "Speed", size: 26 },
  { x: 68, y: 70, label: "Hygiene", size: 30 },
];

export default function SceneLimitation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Ghost grid — the hidden structure they can't see */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.03 }}
        transition={{ delay: 2, duration: 2 }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute w-full h-px"
            style={{
              top: `${12.5 * (i + 1)}%`,
              background: "hsl(var(--foreground))",
            }}
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute h-full w-px"
            style={{
              left: `${12.5 * (i + 1)}%`,
              background: "hsl(var(--foreground))",
            }}
          />
        ))}
      </motion.div>

      {/* Floating disconnected nodes */}
      <div className="relative w-full max-w-lg h-[260px]">
        {NODES.map((n, i) => (
          <motion.div
            key={i}
            className="absolute flex items-center justify-center rounded-full"
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              width: n.size,
              height: n.size,
              border: "1px solid hsl(var(--foreground) / 0.08)",
              background: "hsl(var(--foreground) / 0.03)",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -3, 0, 2, 0],
            }}
            transition={{
              opacity: { delay: i * 0.3, duration: 0.6 },
              scale: { delay: i * 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
              y: {
                delay: i * 0.3 + 0.6,
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            <span
              className="text-[9px] font-semibold tracking-wide"
              style={{ color: "hsl(var(--foreground) / 0.25)" }}
            >
              {n.label}
            </span>
          </motion.div>
        ))}

        {/* Dashed lines attempting connections — but failing */}
        <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          {[
            { x1: "17%", y1: "30%", x2: "53%", y2: "22%" },
            { x1: "57%", y1: "24%", x2: "80%", y2: "38%" },
            { x1: "32%", y1: "68%", x2: "66%", y2: "73%" },
          ].map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="hsl(var(--foreground) / 0.06)"
              strokeWidth="1"
              strokeDasharray="4 6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.5 + i * 0.3, duration: 1 }}
            />
          ))}
        </svg>
      </div>

      {/* The damning verdict — no text explanation, just a visual signal */}
      <motion.div
        className="absolute bottom-8 left-0 right-0 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5, duration: 1.2 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="h-px"
            style={{ background: "hsl(var(--destructive) / 0.4)" }}
            initial={{ width: 0 }}
            animate={{ width: 40 }}
            transition={{ delay: 3.8, duration: 0.8 }}
          />
          <span
            className="text-[10px] font-semibold tracking-[0.15em] uppercase"
            style={{ color: "hsl(var(--destructive) / 0.6)" }}
          >
            No structure found
          </span>
          <motion.div
            className="h-px"
            style={{ background: "hsl(var(--destructive) / 0.4)" }}
            initial={{ width: 0 }}
            animate={{ width: 40 }}
            transition={{ delay: 3.8, duration: 0.8 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
