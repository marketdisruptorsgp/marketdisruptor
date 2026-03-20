import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { CheckpointValidation } from "@/utils/checkpointGate";

/* ═══════════════════════════════════════════════════════════════
   CHECKPOINT GATE STATUS
   Visual indicator for pipeline checkpoint validation results.
   Shows pass/warn/block status with configurable override.
   ═══════════════════════════════════════════════════════════════ */

interface CheckpointGateStatusProps {
  validations: CheckpointValidation[];
  onOverride?: (stepId: string) => void;
}

const RESULT_CONFIG = {
  pass: { icon: CheckCircle2, color: "hsl(var(--cin-green))", label: "Pass" },
  warn: { icon: AlertTriangle, color: "hsl(38 92% 50%)", label: "Warning" },
  block: { icon: XCircle, color: "hsl(var(--cin-red))", label: "Blocked" },
};

const STEP_LABELS: Record<string, string> = {
  domain_confirmation: "Domain Confirmation",
  first_principles: "Deep Structure Analysis",
  friction_tiers: "Friction Qualification",
  constraint_map: "Constraint Mapping",
  falsification: "Falsification Protocol",
  decision_synthesis: "Decision Synthesis",
};

export function CheckpointGateStatus({ validations, onOverride }: CheckpointGateStatusProps) {
  const activeValidations = useMemo(
    () => validations.filter(v => v.required_fields.length > 0),
    [validations]
  );

  if (activeValidations.length === 0) return null;

  const allPass = activeValidations.every(v => v.result === "pass");
  const hasBlock = activeValidations.some(v => v.result === "block");
  const overallColor = allPass
    ? "hsl(var(--cin-green))"
    : hasBlock
    ? "hsl(var(--cin-red))"
    : "hsl(38 92% 50%)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg p-3 space-y-2"
      style={{
        background: "hsl(var(--cin-depth-mid))",
        border: `1px solid ${overallColor}15`,
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: overallColor }} />
        <span className="text-[9px] font-extrabold uppercase tracking-[0.15em]" style={{ color: overallColor }}>
          Pipeline Checkpoints
        </span>
        <span className="text-[9px] font-bold ml-auto" style={{ color: "hsl(var(--cin-label) / 0.4)" }}>
          {activeValidations.filter(v => v.result === "pass").length}/{activeValidations.length} pass
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {activeValidations.map((v) => {
          const cfg = RESULT_CONFIG[v.result];
          const Icon = cfg.icon;
          return (
            <div
              key={v.step_id}
              className="flex items-center gap-1.5 px-2 py-1 rounded"
              style={{ background: `${cfg.color}08` }}
            >
              <Icon className="w-3 h-3 flex-shrink-0" style={{ color: cfg.color }} />
              <span className="text-[9px] font-bold truncate" style={{ color: "hsl(var(--cin-label) / 0.7)" }}>
                {STEP_LABELS[v.step_id] || v.step_id}
              </span>
              {v.result === "block" && !v.user_override && onOverride && (
                <button
                  onClick={() => onOverride(v.step_id)}
                  className="text-[8px] font-bold px-1 py-0.5 rounded ml-auto flex-shrink-0"
                  style={{ color: cfg.color, background: `${cfg.color}15` }}
                >
                  Override
                </button>
              )}
              {v.user_override && (
                <span className="text-[7px] font-bold ml-auto flex-shrink-0" style={{ color: "hsl(38 92% 50%)" }}>
                  ⚠ Override
                </span>
              )}
            </div>
          );
        })}
      </div>

      {hasBlock && (
        <p className="text-[9px] leading-relaxed" style={{ color: "hsl(var(--cin-label) / 0.4)" }}>
          Blocked checkpoints prevent downstream execution. Override requires explicit acknowledgment.
        </p>
      )}
    </motion.div>
  );
}
