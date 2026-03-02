import React from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   SCENE 2 — SYSTEM ENGAGEMENT [8–20s]
   The system decomposes the hand dryer into structural elements.
   Frictions emerge spatially. Causal connections form.
   One node intensifies — the binding constraint locks.
   ═══════════════════════════════════════════════════════════════ */

const COMPONENTS = [
  { label: "Motor", x: 18, y: 22, score: 4.1 },
  { label: "Nozzle", x: 50, y: 12, score: 3.8 },
  { label: "Coverage", x: 78, y: 28, score: 8.7 },
  { label: "Airflow", x: 25, y: 58, score: 5.2 },
  { label: "Noise", x: 65, y: 62, score: 3.4 },
  { label: "Hygiene", x: 42, y: 78, score: 6.1 },
];

const CAUSAL_LINKS = [
  { from: 0, to: 3 },
  { from: 1, to: 2 },
  { from: 3, to: 4 },
  { from: 2, to: 5 },
  { from: 3, to: 2 },
  { from: 5, to: 4 },
];

export default function SceneEngagement() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden min-h-[300px]">
      <div className="relative" style={{ width: 340, height: 300 }}>
        {/* Scanning field — the system analyzing */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 280,
            height: 280,
            left: "50%",
            top: "50%",
            marginLeft: -140,
            marginTop: -140,
            border: "1px solid hsl(var(--primary) / 0.04)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.3, 1], opacity: [0, 0.3, 0.1] }}
          transition={{ delay: 0.5, duration: 2, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Causal connection lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          style={{ overflow: "visible" }}
        >
          {CAUSAL_LINKS.map((link, i) => {
            const from = COMPONENTS[link.from];
            const to = COMPONENTS[link.to];
            const isBindingLink =
              from.score > 7 || to.score > 7;
            return (
              <motion.line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={
                  isBindingLink
                    ? "hsl(var(--primary) / 0.35)"
                    : "hsl(var(--foreground) / 0.05)"
                }
                strokeWidth={isBindingLink ? 1.5 : 0.5}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  delay: 2.5 + i * 0.35,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            );
          })}

          {/* Directional arrows on causal links */}
          {CAUSAL_LINKS.filter(
            (l) =>
              COMPONENTS[l.from].score > 7 ||
              COMPONENTS[l.to].score > 7
          ).map((link, i) => {
            const to = COMPONENTS[link.to];
            return (
              <motion.circle
                key={`arrow-${i}`}
                cx={to.x}
                cy={to.y}
                r={1.5}
                fill="hsl(var(--primary) / 0.4)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4 + i * 0.3, duration: 0.4 }}
              />
            );
          })}
        </svg>

        {/* Component nodes */}
        {COMPONENTS.map((c, i) => {
          const isBinding = c.score > 7;
          const nodeDelay = 1.2 + i * 0.3;
          return (
            <motion.div
              key={i}
              className="absolute flex flex-col items-center"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: nodeDelay,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: isBinding ? 48 : 32,
                  height: isBinding ? 48 : 32,
                  background: isBinding
                    ? "hsl(var(--primary) / 0.1)"
                    : "hsl(var(--foreground) / 0.02)",
                  border: `${isBinding ? 2 : 1}px solid ${
                    isBinding
                      ? "hsl(var(--primary) / 0.4)"
                      : "hsl(var(--foreground) / 0.06)"
                  }`,
                }}
                animate={
                  isBinding
                    ? {
                        boxShadow: [
                          "0 0 0 0px hsl(var(--primary) / 0)",
                          "0 0 0 12px hsl(var(--primary) / 0.05)",
                          "0 0 0 0px hsl(var(--primary) / 0)",
                        ],
                      }
                    : {}
                }
                transition={
                  isBinding
                    ? { delay: 5, duration: 2.5, repeat: Infinity }
                    : {}
                }
              >
                <motion.span
                  className="text-[10px] font-bold tabular-nums"
                  style={{
                    color: isBinding
                      ? "hsl(var(--primary))"
                      : "hsl(var(--foreground) / 0.25)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: nodeDelay + 0.8, duration: 0.5 }}
                >
                  {c.score}
                </motion.span>
              </motion.div>
              <span
                className="text-[8px] font-semibold mt-1.5 tracking-wide"
                style={{
                  color: isBinding
                    ? "hsl(var(--primary) / 0.7)"
                    : "hsl(var(--foreground) / 0.2)",
                }}
              >
                {c.label}
              </span>
            </motion.div>
          );
        })}

        {/* Binding constraint lock label */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: -4 }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 6.5, duration: 1 }}
        >
          <span
            className="text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ color: "hsl(var(--primary) / 0.45)" }}
          >
            Constraint isolated
          </span>
        </motion.div>
      </div>
    </div>
  );
}
