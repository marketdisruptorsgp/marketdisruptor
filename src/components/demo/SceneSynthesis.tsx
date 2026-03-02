import React from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   SCENE 5 — DECISION SYNTHESIS
   A causal chain materializes vertically.
   Each node connects to the next with a directed line.
   Confidence emerges as the chain completes.
   The decision feels inevitable — assembled, not recommended.
   ═══════════════════════════════════════════════════════════════ */

const CHAIN = [
  { label: "Objective", opacity: 0.25 },
  { label: "Constraint", opacity: 0.4 },
  { label: "Leverage", opacity: 0.65 },
  { label: "Decision", opacity: 1 },
];

export default function SceneSynthesis() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative flex flex-col items-center" style={{ height: 280 }}>
        {CHAIN.map((node, i) => {
          const isFinal = i === CHAIN.length - 1;
          const delay = i * 1.0;

          return (
            <div key={i} className="flex flex-col items-center">
              {/* Connecting line */}
              {i > 0 && (
                <motion.div
                  className="rounded-full"
                  style={{
                    width: 1.5,
                    background: isFinal
                      ? "hsl(var(--primary) / 0.4)"
                      : "hsl(var(--foreground) / 0.08)",
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: 28 }}
                  transition={{
                    delay: delay - 0.3,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              )}

              {/* Node */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <motion.div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: isFinal ? 40 : 28,
                    height: isFinal ? 40 : 28,
                    background: isFinal
                      ? "hsl(var(--primary) / 0.1)"
                      : "hsl(var(--foreground) / 0.03)",
                    border: `${isFinal ? 2 : 1}px solid ${
                      isFinal
                        ? "hsl(var(--primary) / 0.3)"
                        : "hsl(var(--foreground) / 0.06)"
                    }`,
                  }}
                  animate={
                    isFinal
                      ? {
                          boxShadow: [
                            "0 0 0 0px hsl(var(--primary) / 0)",
                            "0 0 0 10px hsl(var(--primary) / 0.04)",
                            "0 0 0 0px hsl(var(--primary) / 0)",
                          ],
                        }
                      : {}
                  }
                  transition={
                    isFinal
                      ? { delay: 4, duration: 2.5, repeat: Infinity }
                      : {}
                  }
                >
                  {isFinal && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: "hsl(var(--primary))" }}
                    />
                  )}
                </motion.div>
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{
                    color: isFinal
                      ? "hsl(var(--primary))"
                      : `hsl(var(--foreground) / ${node.opacity})`,
                  }}
                >
                  {node.label}
                </span>
              </motion.div>
            </div>
          );
        })}

        {/* Confidence lock */}
        <motion.div
          className="mt-6 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.5, duration: 0.8 }}
        >
          <motion.div
            className="h-px"
            style={{ background: "hsl(var(--primary) / 0.2)" }}
            initial={{ width: 0 }}
            animate={{ width: 20 }}
            transition={{ delay: 4.8, duration: 0.6 }}
          />
          <span
            className="text-[8px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "hsl(var(--primary) / 0.4)" }}
          >
            Confidence locked
          </span>
          <motion.div
            className="h-px"
            style={{ background: "hsl(var(--primary) / 0.2)" }}
            initial={{ width: 0 }}
            animate={{ width: 20 }}
            transition={{ delay: 4.8, duration: 0.6 }}
          />
        </motion.div>
      </div>
    </div>
  );
}
