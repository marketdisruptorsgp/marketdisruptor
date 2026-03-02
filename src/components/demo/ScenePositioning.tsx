import React from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   SCENE 5 — POSITIONING [55–60s]
   Brand statement. Authority. Fade to silence.
   "Market Disruptor. See what to change."
   ═══════════════════════════════════════════════════════════════ */

export default function ScenePositioning() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden min-h-[300px]">
      <div className="text-center max-w-sm space-y-6">
        {/* Brand name */}
        <motion.p
          className="text-xl sm:text-2xl font-bold tracking-tight"
          style={{ color: "hsl(var(--foreground) / 0.9)" }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          Market Disruptor.
        </motion.p>

        {/* Tagline */}
        <motion.p
          className="text-sm sm:text-base font-medium tracking-tight"
          style={{ color: "hsl(var(--primary) / 0.6)" }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 2,
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          See what to change.
        </motion.p>

        {/* Terminal mark */}
        <motion.div
          className="mx-auto"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.15 }}
          transition={{
            delay: 3.5,
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div
            className="w-8 h-px mx-auto"
            style={{ background: "hsl(var(--primary))" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
