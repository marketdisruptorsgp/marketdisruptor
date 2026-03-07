/**
 * ConfidenceExplanationPanel — Why should I trust this recommendation?
 *
 * Shows strong/moderate/limited evidence categories with counts
 * and improvement suggestions.
 */

import { memo } from "react";
import { ShieldCheck, CheckCircle2, AlertCircle, CircleDashed } from "lucide-react";
import type { ConfidenceExplanation } from "@/lib/benchmarkEngine";

interface ConfidenceExplanationPanelProps {
  explanation: ConfidenceExplanation | null;
}

function strengthConfig(s: "strong" | "moderate" | "limited") {
  const map = {
    strong: { Icon: CheckCircle2, color: "hsl(var(--success))", label: "Strong Evidence" },
    moderate: { Icon: AlertCircle, color: "hsl(var(--warning))", label: "Moderate Evidence" },
    limited: { Icon: CircleDashed, color: "hsl(var(--muted-foreground))", label: "Limited Evidence" },
  };
  return map[s];
}

export const ConfidenceExplanationPanel = memo(function ConfidenceExplanationPanel({
  explanation,
}: ConfidenceExplanationPanelProps) {
  if (!explanation || explanation.drivers.length === 0) return null;

  const strong = explanation.drivers.filter(d => d.strength === "strong");
  const moderate = explanation.drivers.filter(d => d.strength === "moderate");
  const limited = explanation.drivers.filter(d => d.strength === "limited");

  const groups = [
    { key: "strong" as const, items: strong },
    { key: "moderate" as const, items: moderate },
    { key: "limited" as const, items: limited },
  ].filter(g => g.items.length > 0);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
          <ShieldCheck size={14} className="text-primary" />
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Confidence Drivers
        </span>
      </div>

      <div className="px-5 pb-4 space-y-3">
        {groups.map(group => {
          const cfg = strengthConfig(group.key);
          return (
            <div key={group.key}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <cfg.Icon size={11} style={{ color: cfg.color }} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
              <div className="space-y-1">
                {group.items.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 pl-5">
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-xs text-foreground">
                      {d.category}
                      {d.count > 0 && (
                        <span className="text-muted-foreground ml-1">
                          ({d.count} indicator{d.count !== 1 ? "s" : ""})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Improvement suggestions */}
        {explanation.improvementSuggestions.length > 0 && (
          <div className="rounded-lg p-3 mt-1" style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary mb-1">
              To Improve Confidence
            </p>
            {explanation.improvementSuggestions.map((s, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-snug">
                {s}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
