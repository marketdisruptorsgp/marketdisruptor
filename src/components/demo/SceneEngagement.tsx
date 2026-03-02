import React from "react";
import { motion } from "framer-motion";

/* Scene 2 — SYSTEM ENGAGEMENT
   Constraint scoring animates step by step. "Binding" locks into place. */
export default function SceneEngagement() {
  const steps = [
    { label: "Objective Defined", detail: "Maximize hand-drying completion rate", binding: false },
    { label: "Friction Mapping", detail: "5 frictions — physical, temporal, cognitive", binding: false },
    { label: "Constraint Scoring", detail: "Coverage geometry — score 8.4 / 10", binding: true },
    { label: "Dominance Proof", detail: "Removing constraint resolves 73% of downstream frictions", binding: true },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-md space-y-2.5">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 1.2,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="rounded-xl p-4 border"
            style={{
              borderColor: s.binding
                ? "hsl(var(--primary) / 0.35)"
                : "hsl(var(--border))",
              background: s.binding
                ? "hsl(var(--primary) / 0.04)"
                : "hsl(var(--muted) / 0.3)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: s.binding
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted))",
                    color: s.binding
                      ? "hsl(var(--primary-foreground))"
                      : "hsl(var(--foreground) / 0.7)",
                  }}
                >
                  {i + 1}
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {s.label}
                </p>
              </div>
              {s.binding && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 1.2 + 0.4, type: "spring", stiffness: 300 }}
                  className="text-[8px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
                  style={{
                    background: "hsl(var(--primary) / 0.1)",
                    color: "hsl(var(--primary))",
                  }}
                >
                  BINDING
                </motion.span>
              )}
            </div>
            <p
              className="text-xs mt-1.5 ml-8"
              style={{
                color: s.binding
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted-foreground))",
              }}
            >
              {s.detail}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
