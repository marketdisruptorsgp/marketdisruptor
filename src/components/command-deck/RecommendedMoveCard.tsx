/**
 * RecommendedMoveCard — Compact above-fold card showing the top strategic playbook.
 * Shows: title (A → B), thesis, strategy profile scores, and estimated timeline.
 */

import { memo } from "react";
import {
  Sparkles, TrendingUp, DollarSign, Shield, Settings, Zap, Clock,
} from "lucide-react";
import type { TransformationPlaybook } from "@/lib/playbookEngine";

interface RecommendedMoveCardProps {
  playbook: TransformationPlaybook | null;
  modeAccent: string;
}

const PROFILE_DIMS = [
  { key: "revenueExpansion", label: "Revenue Expansion", icon: TrendingUp },
  { key: "marginImprovement", label: "Cost Advantage", icon: DollarSign },
  { key: "capitalEfficiency", label: "Market Control", icon: Shield },
  { key: "executionDifficulty", label: "Execution Complexity", icon: Settings },
  { key: "leverageScore", label: "Speed to Impact", icon: Zap },
] as const;

function scoreLabel(value: number, inverted = false): { text: string; color: string } {
  const v = inverted ? 10 - value : value;
  if (v >= 8) return { text: "Strong", color: "hsl(var(--success))" };
  if (v >= 5) return { text: "Moderate", color: "hsl(var(--warning))" };
  return { text: "Low", color: "hsl(var(--muted-foreground))" };
}

function estimateTimeline(difficulty: number): string {
  if (difficulty <= 3) return "1–3 months";
  if (difficulty <= 5) return "3–6 months";
  if (difficulty <= 7) return "6–18 months";
  return "12–24 months";
}

export const RecommendedMoveCard = memo(function RecommendedMoveCard({
  playbook, modeAccent,
}: RecommendedMoveCardProps) {
  if (!playbook) return null;

  const impact = playbook.impact;
  const timeline = estimateTimeline(impact.executionDifficulty);

  return (
    <div
      className="rounded-lg px-4 py-4 space-y-3"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${modeAccent}20` }}
        >
          <Sparkles size={14} style={{ color: modeAccent }} />
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Recommended Strategic Move
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-black text-foreground leading-tight">
        {playbook.title}
      </h3>

      {/* Thesis */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {playbook.strategicThesis}
      </p>

      {/* Strategy Profile */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Strategy Profile
        </span>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {PROFILE_DIMS.map(dim => {
            const raw = impact[dim.key as keyof typeof impact] ?? 5;
            const inverted = dim.key === "executionDifficulty";
            const { text, color } = scoreLabel(raw, inverted);
            const Icon = dim.icon;
            return (
              <div key={dim.key} className="flex flex-col items-center gap-0.5 min-w-[80px]">
                <Icon size={14} className="text-muted-foreground" />
                <span className="text-sm font-bold" style={{ color }}>{text}</span>
                <span className="text-[10px] text-muted-foreground text-center">{dim.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex items-center gap-1.5 pt-1">
        <Clock size={12} className="text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">
          Estimated timeline: {timeline}
        </span>
      </div>
    </div>
  );
});
