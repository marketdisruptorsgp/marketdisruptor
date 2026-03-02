import React from "react";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   SCENE 6 — POSITIONING
   Authority. Silence. A single structural mark resolves into text.
   The system doesn't promote itself — it states what it does.
   ═══════════════════════════════════════════════════════════════ */

export default function ScenePositioning() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="text-center max-w-md space-y-8">
        {/* Structural mark — a single resolved point */}
        <motion.div
          className="mx-auto flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: "hsl(var(--primary) / 0.3)" }}
          />
        </motion.div>

        {/* First line — emerges from the point */}
        <motion.p
          className="text-lg sm:text-xl font-bold leading-tight tracking-tight"
          style={{ color: "hsl(var(--foreground) / 0.85)" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          Stop optimizing symptoms.
        </motion.p>

        {/* Second line — the authority */}
        <motion.p
          className="text-base sm:text-lg font-semibold leading-tight tracking-tight"
          style={{ color: "hsl(var(--primary) / 0.7)" }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          Identify what actually drives outcomes.
        </motion.p>

        {/* Terminal line — earned presence */}
        <motion.div
          className="mx-auto"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.15 }}
          transition={{ delay: 4.5, duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="w-12 h-px mx-auto"
            style={{ background: "hsl(var(--primary))" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
