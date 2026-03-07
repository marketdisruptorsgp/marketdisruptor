/**
 * Scenario Banner — Shows when a user challenge is active
 * 
 * Displays the active hypothesis, with Reset to Baseline and Save Scenario actions.
 */

import { memo } from "react";
import { FlaskConical, RotateCcw, Save, X } from "lucide-react";
import { motion } from "framer-motion";

export interface ActiveChallenge {
  stage: string;
  value: string;
  timestamp: number;
}

interface ScenarioBannerProps {
  challenges: ActiveChallenge[];
  onReset: () => void;
  onSave: () => void;
}

export const ScenarioBanner = memo(function ScenarioBanner({
  challenges,
  onReset,
  onSave,
}: ScenarioBannerProps) {
  if (challenges.length === 0) return null;

  const latest = challenges[challenges.length - 1];
  const stageLabel = latest.stage.charAt(0).toUpperCase() + latest.stage.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--primary) / 0.06)",
        border: "2px solid hsl(var(--primary) / 0.25)",
      }}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "hsl(var(--primary) / 0.15)" }}
            >
              <FlaskConical size={15} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}
                >
                  Scenario Active
                </span>
                {challenges.length > 1 && (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {challenges.length} assumptions challenged
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-muted-foreground mb-0.5">
                Assumption Challenged: <span className="text-foreground">{stageLabel}</span>
              </p>
              <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                User Hypothesis: "{latest.value}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onSave}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              <Save size={11} /> Save Scenario
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "hsl(var(--muted))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <RotateCcw size={11} /> Reset to Baseline
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
