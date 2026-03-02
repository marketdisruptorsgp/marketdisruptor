import React from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   SCENE 1 — FAILURE OF CONVENTIONAL ANALYSIS [0–8s]
   Generic recommendations appear confidently, then dissolve.
   They have no causal backing. No structure. No reasoning.
   The viewer recognizes: optimization without causality fails.
   ═══════════════════════════════════════════════════════════════ */

const RECOMMENDATIONS = [
  { text: "Increase motor wattage", delay: 0.4 },
  { text: "Add HEPA filter", delay: 0.9 },
  { text: "Reduce noise level", delay: 1.4 },
  { text: "Improve airflow speed", delay: 1.9 },
  { text: "Upgrade heating element", delay: 2.4 },
];

export default function SceneLimitation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden min-h-[300px]">
      <div className="relative w-full max-w-md">
        {/* Recommendations appear then collapse */}
        <div className="space-y-2.5 px-4">
          {RECOMMENDATIONS.map((rec, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -12 }}
              animate={{
                opacity: [0, 0.7, 0.7, 0.08],
                x: [-12, 0, 0, 4],
                filter: [
                  "blur(0px)",
                  "blur(0px)",
                  "blur(0px)",
                  "blur(3px)",
                ],
              }}
              transition={{
                delay: rec.delay,
                duration: 5,
                times: [0, 0.15, 0.55, 0.85],
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Bullet — hollow, no weight */}
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  border: "1px solid hsl(var(--foreground) / 0.15)",
                }}
              />
              <span
                className="text-[13px] font-medium tracking-tight"
                style={{ color: "hsl(var(--foreground) / 0.45)" }}
              >
                {rec.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Structural absence — no connections exist */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: "visible" }}
        >
          {/* Attempted connection lines that break */}
          {[
            { x1: "30%", y1: "20%", x2: "70%", y2: "35%" },
            { x1: "25%", y1: "50%", x2: "75%", y2: "65%" },
            { x1: "40%", y1: "75%", x2: "60%", y2: "85%" },
          ].map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="hsl(var(--destructive) / 0.08)"
              strokeWidth="0.5"
              strokeDasharray="2 8"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 0.6, 0.6, 0],
                opacity: [0, 0.4, 0.4, 0],
              }}
              transition={{
                delay: 3,
                duration: 3.5,
                times: [0, 0.3, 0.6, 1],
              }}
            />
          ))}
        </svg>

        {/* Red verdict line — appears as everything fades */}
        <motion.div
          className="mt-10 flex items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5, duration: 1.5 }}
        >
          <motion.div
            className="h-px"
            style={{ background: "hsl(var(--destructive) / 0.35)" }}
            initial={{ width: 0 }}
            animate={{ width: 32 }}
            transition={{ delay: 5.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <span
            className="text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "hsl(var(--destructive) / 0.5)" }}
          >
            No causal chain
          </span>
          <motion.div
            className="h-px"
            style={{ background: "hsl(var(--destructive) / 0.35)" }}
            initial={{ width: 0 }}
            animate={{ width: 32 }}
            transition={{ delay: 5.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      </div>
    </div>
  );
}
