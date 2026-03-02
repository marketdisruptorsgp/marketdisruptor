import React from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   SCENE 2 — SYSTEM ENGAGEMENT (Discovery)
   The system discovers structure. Nodes reorganize around a
   binding constraint that emerges from the center.
   Lines snap into causal connections. The field becomes ordered.
   ═══════════════════════════════════════════════════════════════ */

const FRICTIONS = [
  { label: "Airflow", angle: -60, score: 4.2 },
  { label: "Duration", angle: -20, score: 5.1 },
  { label: "Coverage", angle: 25, score: 8.4 },
  { label: "Noise", angle: 70, score: 3.8 },
  { label: "Placement", angle: 110, score: 6.1 },
];

const RADIUS = 105;
const CX = 50;
const CY = 50;

export default function SceneEngagement() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative" style={{ width: 320, height: 280 }}>
        {/* Scanning sweep — the system analyzing */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 260,
            height: 260,
            left: "50%",
            top: "50%",
            marginLeft: -130,
            marginTop: -130,
            border: "1px solid hsl(var(--primary) / 0.06)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: [0, 0.4, 0.15] }}
          transition={{ delay: 0.3, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Second ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            left: "50%",
            top: "50%",
            marginLeft: -80,
            marginTop: -80,
            border: "1px solid hsl(var(--primary) / 0.08)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ delay: 0.8, duration: 1 }}
        />

        {/* Connection lines from center to each node */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          style={{ overflow: "visible" }}
        >
          {FRICTIONS.map((f, i) => {
            const rad = (f.angle * Math.PI) / 180;
            const nx = CX + Math.cos(rad) * (RADIUS / 3.2);
            const ny = CY + Math.sin(rad) * (RADIUS / 3.2);
            const isBinding = f.score > 7;
            return (
              <motion.line
                key={i}
                x1={CX}
                y1={CY}
                x2={nx}
                y2={ny}
                stroke={
                  isBinding
                    ? "hsl(var(--primary) / 0.5)"
                    : "hsl(var(--foreground) / 0.06)"
                }
                strokeWidth={isBinding ? 1.5 : 0.5}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  delay: 1.5 + i * 0.25,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            );
          })}
        </svg>

        {/* Friction nodes orbiting center */}
        {FRICTIONS.map((f, i) => {
          const rad = (f.angle * Math.PI) / 180;
          const x = 160 + Math.cos(rad) * RADIUS;
          const y = 140 + Math.sin(rad) * RADIUS;
          const isBinding = f.score > 7;

          return (
            <motion.div
              key={i}
              className="absolute flex flex-col items-center"
              style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 1.5 + i * 0.25,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: isBinding ? 44 : 32,
                  height: isBinding ? 44 : 32,
                  background: isBinding
                    ? "hsl(var(--primary) / 0.12)"
                    : "hsl(var(--foreground) / 0.03)",
                  border: `1px solid ${
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
                          "0 0 0 8px hsl(var(--primary) / 0.06)",
                          "0 0 0 0px hsl(var(--primary) / 0)",
                        ],
                      }
                    : {}
                }
                transition={
                  isBinding
                    ? { delay: 3, duration: 2, repeat: Infinity }
                    : {}
                }
              >
                <span
                  className="text-[9px] font-bold tabular-nums"
                  style={{
                    color: isBinding
                      ? "hsl(var(--primary))"
                      : "hsl(var(--foreground) / 0.3)",
                  }}
                >
                  {f.score}
                </span>
              </motion.div>
              <span
                className="text-[8px] font-semibold mt-1.5 tracking-wide"
                style={{
                  color: isBinding
                    ? "hsl(var(--primary) / 0.8)"
                    : "hsl(var(--foreground) / 0.2)",
                }}
              >
                {f.label}
              </span>
            </motion.div>
          );
        })}

        {/* Center — binding constraint emerges */}
        <motion.div
          className="absolute flex items-center justify-center"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 3.2,
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: "hsl(var(--primary) / 0.08)",
              border: "2px solid hsl(var(--primary) / 0.3)",
            }}
          >
            <div
              className="w-5 h-5 rounded-full"
              style={{ background: "hsl(var(--primary))" }}
            />
          </div>
        </motion.div>

        {/* Label — minimal */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: -8 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4, duration: 0.8 }}
        >
          <span
            className="text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "hsl(var(--primary) / 0.5)" }}
          >
            Binding constraint isolated
          </span>
        </motion.div>
      </div>
    </div>
  );
}
