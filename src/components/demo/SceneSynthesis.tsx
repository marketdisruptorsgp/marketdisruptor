import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   SCENE 4 — DECISION CLARITY [40–55s]
   Before vs After comparison. Impact simulation.
   Confidence indicator. Recommendation appears as inevitable.
   The causal chain produces its own conclusion.
   ═══════════════════════════════════════════════════════════════ */

const BEFORE_METRICS = [
  { label: "Dry time", value: "45s", bar: 75 },
  { label: "Coverage", value: "38%", bar: 38 },
  { label: "Satisfaction", value: "2.1", bar: 28 },
];

const AFTER_METRICS = [
  { label: "Dry time", value: "12s", bar: 20 },
  { label: "Coverage", value: "94%", bar: 94 },
  { label: "Satisfaction", value: "4.6", bar: 92 },
];

export default function SceneSynthesis() {
  const [showAfter, setShowAfter] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowAfter(true), 3000);
    const t2 = setTimeout(() => setShowConfidence(true), 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden min-h-[300px]">
      <div className="w-full max-w-md px-4">
        {/* Before / After comparison */}
        <div className="grid grid-cols-2 gap-6 sm:gap-10">
          {/* Before column */}
          <div>
            <motion.span
              className="text-[9px] font-bold uppercase tracking-[0.2em] block mb-4"
              style={{
                color: showAfter
                  ? "hsl(var(--foreground) / 0.15)"
                  : "hsl(var(--foreground) / 0.4)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Before
            </motion.span>
            <div className="space-y-4">
              {BEFORE_METRICS.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{
                    opacity: showAfter ? 0.25 : 0.8,
                    x: 0,
                  }}
                  transition={{
                    delay: 0.6 + i * 0.3,
                    duration: 0.6,
                  }}
                >
                  <div className="flex justify-between mb-1">
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: "hsl(var(--foreground) / 0.35)" }}
                    >
                      {m.label}
                    </span>
                    <span
                      className="text-[10px] font-bold tabular-nums"
                      style={{ color: "hsl(var(--foreground) / 0.3)" }}
                    >
                      {m.value}
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: "hsl(var(--foreground) / 0.04)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "hsl(var(--foreground) / 0.12)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${m.bar}%` }}
                      transition={{
                        delay: 0.8 + i * 0.3,
                        duration: 0.8,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* After column */}
          <div>
            <motion.span
              className="text-[9px] font-bold uppercase tracking-[0.2em] block mb-4"
              style={{ color: "hsl(var(--primary) / 0.5)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: showAfter ? 1 : 0 }}
              transition={{ duration: 0.6 }}
            >
              After
            </motion.span>
            <div className="space-y-4">
              {AFTER_METRICS.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{
                    opacity: showAfter ? 1 : 0,
                    x: showAfter ? 0 : 6,
                  }}
                  transition={{
                    delay: 0.3 + i * 0.3,
                    duration: 0.6,
                  }}
                >
                  <div className="flex justify-between mb-1">
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: "hsl(var(--foreground) / 0.5)" }}
                    >
                      {m.label}
                    </span>
                    <span
                      className="text-[10px] font-bold tabular-nums"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      {m.value}
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: "hsl(var(--primary) / 0.06)" }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "hsl(var(--primary) / 0.5)" }}
                      initial={{ width: 0 }}
                      animate={{ width: showAfter ? `${m.bar}%` : 0 }}
                      transition={{
                        delay: 0.5 + i * 0.3,
                        duration: 1,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Confidence lock */}
        <motion.div
          className="mt-8 flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{
            opacity: showConfidence ? 1 : 0,
            y: showConfidence ? 0 : 6,
          }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="h-px"
            style={{ background: "hsl(var(--primary) / 0.2)" }}
            initial={{ width: 0 }}
            animate={{ width: showConfidence ? 24 : 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "hsl(var(--primary) / 0.5)" }}
            />
            <span
              className="text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "hsl(var(--primary) / 0.5)" }}
            >
              Confidence 94%
            </span>
          </div>
          <motion.div
            className="h-px"
            style={{ background: "hsl(var(--primary) / 0.2)" }}
            initial={{ width: 0 }}
            animate={{ width: showConfidence ? 24 : 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />
        </motion.div>
      </div>
    </div>
  );
}
