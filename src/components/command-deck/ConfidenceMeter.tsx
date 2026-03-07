/**
 * Evidence Quality Panel — Replaces numeric confidence meter.
 * Shows evidence strength by business domain using qualitative labels.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, ArrowUpRight, CheckCircle2, AlertTriangle, CircleDashed } from "lucide-react";

interface ConfidenceMeterProps {
  completedSteps: number;
  totalSteps: number;
  evidenceCount: number;
  confidence: number;
  isComputing?: boolean;
  strongCategories?: string[];
  weakCategories?: string[];
}

function getEvidenceLevel(c: number) {
  if (c >= 0.7) return { label: "Strong Evidence", color: "hsl(var(--success))", bgColor: "hsl(var(--success) / 0.08)" };
  if (c >= 0.5) return { label: "Moderate Evidence", color: "hsl(var(--primary))", bgColor: "hsl(var(--primary) / 0.06)" };
  if (c >= 0.3) return { label: "Early Signal", color: "hsl(var(--warning))", bgColor: "hsl(var(--warning) / 0.08)" };
  if (c >= 0.1) return { label: "Limited Evidence", color: "hsl(var(--muted-foreground))", bgColor: "hsl(var(--muted) / 0.5)" };
  return { label: "Collecting Evidence", color: "hsl(var(--muted-foreground))", bgColor: "hsl(var(--muted) / 0.5)" };
}

export const ConfidenceMeter = memo(function ConfidenceMeter({
  completedSteps,
  totalSteps,
  evidenceCount,
  confidence,
  isComputing,
  strongCategories = [],
  weakCategories = [],
}: ConfidenceMeterProps) {
  const level = useMemo(() => getEvidenceLevel(confidence), [confidence]);

  const improvementHint = useMemo(() => {
    if (confidence >= 0.7 && weakCategories.length === 0) return null;
    if (weakCategories.length > 0) {
      const missing = weakCategories.slice(0, 2).join(" or ").toLowerCase();
      return `Evidence will strengthen with more data on ${missing}.`;
    }
    if (completedSteps < totalSteps) {
      return "Running additional analysis steps will deepen evidence across business domains.";
    }
    return null;
  }, [confidence, weakCategories, completedSteps, totalSteps]);

  return (
    <div
      className="rounded-xl px-4 py-3.5"
      style={{ background: level.bgColor, border: `1px solid ${level.color}15` }}
    >
      <div className="flex items-start gap-4">
        {/* Evidence Quality Label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Shield size={14} style={{ color: level.color }} />
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Evidence Quality
            </span>
            <span className="text-sm font-black" style={{ color: level.color }}>
              {level.label}
            </span>
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 min-w-0">
          {/* Evidence by business domain */}
          <div className="space-y-1">
            {strongCategories.length > 0 && (
              <div className="flex items-start gap-1.5">
                <CheckCircle2 size={11} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--success))" }} />
                <span className="text-[11px] font-semibold text-foreground leading-snug">
                  Strong signals in: {strongCategories.slice(0, 3).join(", ")}
                </span>
              </div>
            )}
            {weakCategories.length > 0 && (
              <div className="flex items-start gap-1.5">
                <CircleDashed size={11} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--warning))" }} />
                <span className="text-[11px] font-semibold text-muted-foreground leading-snug">
                  Limited data in: {weakCategories.slice(0, 3).join(", ")}
                </span>
              </div>
            )}
            {strongCategories.length === 0 && weakCategories.length === 0 && (
              <div className="flex items-start gap-1.5">
                <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                <span className="text-[11px] font-semibold text-muted-foreground leading-snug">
                  Collecting initial business evidence
                </span>
              </div>
            )}
          </div>

          {/* Improvement hint */}
          {improvementHint && (
            <div className="flex items-start gap-1.5 mt-1.5">
              <ArrowUpRight size={10} style={{ color: level.color }} className="flex-shrink-0 mt-0.5" />
              <span className="text-[10px] font-medium" style={{ color: level.color }}>
                {improvementHint}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
