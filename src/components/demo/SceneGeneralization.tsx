import React from "react";
import { motion } from "framer-motion";

/* Scene 4 — GENERALIZATION
   Product → Service → Business mode adaptation. Rapid elegant transitions. */
export default function SceneGeneralization() {
  const modes = [
    {
      mode: "Product",
      cssVar: "--mode-product",
      leverage: "Design geometry",
      detail: "Nozzle coverage → completion rate",
    },
    {
      mode: "Service",
      cssVar: "--mode-service",
      leverage: "Placement & workflow",
      detail: "Unit position → usage throughput",
    },
    {
      mode: "Business",
      cssVar: "--mode-business",
      leverage: "Install footprint",
      detail: "Coverage per unit → cost-per-dry",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-md space-y-3">
        {modes.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: i * 0.8,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="rounded-xl p-4 border flex items-center gap-4"
            style={{
              borderColor: `hsl(var(${m.cssVar}) / 0.25)`,
              background: `hsl(var(${m.cssVar}) / 0.03)`,
            }}
          >
            <div
              className="w-1.5 h-12 rounded-full flex-shrink-0"
              style={{ background: `hsl(var(${m.cssVar}))` }}
            />
            <div className="flex-1">
              <p
                className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1"
                style={{ color: `hsl(var(${m.cssVar}))` }}
              >
                {m.mode} Mode
              </p>
              <p
                className="text-sm font-semibold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {m.leverage}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {m.detail}
              </p>
            </div>
          </motion.div>
        ))}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
          className="text-center text-xs pt-2"
          style={{ color: "hsl(var(--muted-foreground) / 0.6)" }}
        >
          Same reasoning engine. Different domains. Consistent structural insight.
        </motion.p>
      </div>
    </div>
  );
}
