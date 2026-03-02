import React from "react";
import { motion } from "framer-motion";

/* Scene 6 — POSITIONING
   Clean final frame. Minimal motion. Authority. */
export default function ScenePositioning() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center max-w-md space-y-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl sm:text-2xl font-extrabold leading-tight"
          style={{ color: "hsl(var(--foreground))" }}
        >
          Stop optimizing symptoms.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg sm:text-xl font-bold leading-tight"
          style={{ color: "hsl(var(--primary))" }}
        >
          Identify what actually drives outcomes.
        </motion.p>

        {/* Subtle UI presence — just a thin line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 2.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-16 h-px"
          style={{ background: "hsl(var(--primary) / 0.3)" }}
        />
      </div>
    </div>
  );
}
