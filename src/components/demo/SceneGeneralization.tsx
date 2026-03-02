import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   SCENE 4 — GENERALIZATION
   Same structural core. Three lenses rotate through.
   The binding constraint visualization stays constant —
   only the domain context morphs around it.
   ═══════════════════════════════════════════════════════════════ */

const LENSES = [
  { domain: "Product", leverage: "Coverage geometry", context: "Design" },
  { domain: "Service", leverage: "Placement workflow", context: "Operations" },
  { domain: "Business", leverage: "Install footprint", context: "Strategy" },
];

export default function SceneGeneralization() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const intervals = [2500, 5500];
    const timers = intervals.map((ms, i) =>
      setTimeout(() => setActive(i + 1), ms)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const lens = LENSES[active];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Constant core — the reasoning engine */}
      <div className="relative" style={{ width: 280, height: 260 }}>
        {/* Outer context ring — morphs per domain */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: "1px solid hsl(var(--primary) / 0.08)",
          }}
          animate={{ rotate: active * 120 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Mid ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 180,
            height: 180,
            left: "50%",
            top: "50%",
            marginLeft: -90,
            marginTop: -90,
            border: "1px solid hsl(var(--primary) / 0.06)",
          }}
        />

        {/* Invariant core */}
        <div
          className="absolute rounded-full"
          style={{
            width: 60,
            height: 60,
            left: "50%",
            top: "50%",
            marginLeft: -30,
            marginTop: -30,
            background: "hsl(var(--primary) / 0.06)",
            border: "2px solid hsl(var(--primary) / 0.2)",
          }}
        >
          <div
            className="absolute inset-0 m-auto w-4 h-4 rounded-full"
            style={{ background: "hsl(var(--primary) / 0.5)" }}
          />
        </div>

        {/* Satellite nodes — representing domain-specific factors */}
        {[0, 1, 2].map((i) => {
          const angle = (i * 120 + active * 40) * (Math.PI / 180);
          const r = 100;
          const x = 140 + Math.cos(angle) * r;
          const y = 130 + Math.sin(angle) * r;
          const isHighlighted = i === active;

          return (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
              animate={{
                left: x,
                top: y,
                scale: isHighlighted ? 1.15 : 0.85,
                opacity: isHighlighted ? 1 : 0.25,
              }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: isHighlighted
                    ? "hsl(var(--primary) / 0.1)"
                    : "hsl(var(--foreground) / 0.02)",
                  border: `1px solid ${
                    isHighlighted
                      ? "hsl(var(--primary) / 0.3)"
                      : "hsl(var(--foreground) / 0.04)"
                  }`,
                }}
              >
                <span
                  className="text-[8px] font-bold"
                  style={{
                    color: isHighlighted
                      ? "hsl(var(--primary))"
                      : "hsl(var(--foreground) / 0.15)",
                  }}
                >
                  {LENSES[i].domain[0]}
                </span>
              </div>
            </motion.div>
          );
        })}

        {/* Domain label — transitions */}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-center"
          style={{ bottom: -24 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-0.5"
            >
              <span
                className="text-[9px] font-bold uppercase tracking-[0.2em]"
                style={{ color: "hsl(var(--primary) / 0.4)" }}
              >
                {lens.context}
              </span>
              <span
                className="text-[10px] font-semibold"
                style={{ color: "hsl(var(--foreground) / 0.5)" }}
              >
                {lens.leverage}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
