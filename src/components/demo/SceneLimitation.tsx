import React from "react";
import { motion } from "framer-motion";

/* Scene 1 — THE LIMITATION
   Conventional output zooms in, then red annotation condemns it. */
export default function SceneLimitation() {
  const items = [
    "Increase motor wattage for faster drying",
    "Add HEPA filter for hygiene claims",
    "Reduce noise with acoustic dampening",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Conventional output card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl border p-6"
        style={{
          background: "hsl(var(--muted) / 0.4)",
          borderColor: "hsl(var(--border))",
        }}
      >
        <p
          className="text-[9px] font-bold uppercase tracking-[0.25em] mb-4"
          style={{ color: "hsl(var(--muted-foreground) / 0.5)" }}
        >
          Conventional Analysis Output
        </p>
        <div className="space-y-2.5">
          {items.map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.4, duration: 0.5, ease: "easeOut" }}
              className="flex items-center gap-3 py-2 px-3 rounded-xl"
              style={{ background: "hsl(var(--background) / 0.8)" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "hsl(var(--muted-foreground) / 0.25)" }}
              />
              <span
                className="text-sm leading-snug"
                style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
              >
                {text}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Red annotation — the condemnation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.4, duration: 0.6 }}
        className="mt-6 text-center"
      >
        <p
          className="text-xs font-semibold tracking-wide"
          style={{ color: "hsl(var(--destructive))" }}
        >
          No constraint identification. No causal chain.
        </p>
      </motion.div>
    </div>
  );
}
