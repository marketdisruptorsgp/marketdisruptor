import React from "react";
import { motion } from "framer-motion";
import { Target, Search, Zap, Shield, ArrowDown } from "lucide-react";

/* Scene 5 — DECISION SYNTHESIS
   Final recommendation assembles from causal chain. Confidence locks. */
export default function SceneSynthesis() {
  const chain = [
    { Icon: Target, label: "Objective", value: "Maximize drying completion" },
    { Icon: Search, label: "Binding Constraint", value: "Coverage geometry gap" },
    { Icon: Zap, label: "Leverage", value: "Nozzle spread redesign" },
    {
      Icon: Shield,
      label: "Decision",
      value: "Proceed — 73% friction reduction",
      final: true,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-sm space-y-1">
        {chain.map((s, i) => (
          <React.Fragment key={i}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.8,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="rounded-xl p-4 border flex items-center gap-3"
              style={{
                background: s.final
                  ? "hsl(var(--primary) / 0.05)"
                  : "hsl(var(--muted) / 0.3)",
                borderColor: s.final
                  ? "hsl(var(--primary) / 0.3)"
                  : "hsl(var(--border))",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: s.final
                    ? "hsl(var(--primary) / 0.12)"
                    : "hsl(var(--muted))",
                }}
              >
                <s.Icon
                  className="w-4 h-4"
                  style={{
                    color: s.final
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground))",
                  }}
                />
              </div>
              <div>
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.2em]"
                  style={{
                    color: s.final
                      ? "hsl(var(--primary) / 0.7)"
                      : "hsl(var(--muted-foreground) / 0.5)",
                  }}
                >
                  {s.label}
                </p>
                <p
                  className="text-sm font-semibold mt-0.5"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {s.value}
                </p>
              </div>
            </motion.div>
            {i < chain.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: i * 0.8 + 0.4 }}
                className="flex justify-center py-0.5"
              >
                <ArrowDown className="w-3 h-3" style={{ color: "hsl(var(--primary))" }} />
              </motion.div>
            )}
          </React.Fragment>
        ))}

        {/* Confidence lock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 3.6, duration: 0.5 }}
          className="rounded-xl p-3 mt-3 text-center border"
          style={{
            background: "hsl(var(--primary) / 0.06)",
            borderColor: "hsl(var(--primary) / 0.15)",
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{ color: "hsl(var(--primary))" }}
          >
            Confidence: High · Execution Priority: 1
          </p>
        </motion.div>
      </div>
    </div>
  );
}
