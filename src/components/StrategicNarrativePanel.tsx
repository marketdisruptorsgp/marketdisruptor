/**
 * Strategic Narrative Panel — Command Deck
 *
 * Displays the core strategic reasoning chain:
 * Primary Constraint → Key Driver → Leverage Point → Breakthrough Opportunity → Strategic Pathway
 */

import { memo } from "react";
import { Shield, TrendingUp, Crosshair, Lightbulb, Route, ArrowRight } from "lucide-react";

interface StrategicNarrativePanelProps {
  primaryConstraint: string | null;
  keyDriver: string | null;
  leveragePoint: string | null;
  breakthroughOpportunity: string | null;
  strategicPathway: string | null;
  narrativeSummary: string;
}

const CHAIN = [
  { key: "primaryConstraint", label: "Primary Constraint", icon: Shield, color: "hsl(0 72% 52%)" },
  { key: "keyDriver", label: "Key Driver", icon: TrendingUp, color: "hsl(262 83% 58%)" },
  { key: "leveragePoint", label: "Leverage Point", icon: Crosshair, color: "hsl(229 89% 63%)" },
  { key: "breakthroughOpportunity", label: "Breakthrough Opportunity", icon: Lightbulb, color: "hsl(152 60% 44%)" },
  { key: "strategicPathway", label: "Strategic Pathway", icon: Route, color: "hsl(45 93% 47%)" },
] as const;

export const StrategicNarrativePanel = memo(function StrategicNarrativePanel(props: StrategicNarrativePanelProps) {
  const { narrativeSummary } = props;
  const hasAny = CHAIN.some(c => props[c.key]);

  if (!hasAny) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          Narrative
        </p>
      </div>

      {/* Chain visualization */}
      <div className="px-4 py-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0">
          {CHAIN.map((item, i) => {
            const value = props[item.key];
            const Icon = item.icon;

            return (
              <div key={item.key} className="flex items-center gap-0 flex-1 min-w-0">
                <div
                  className="flex-1 min-w-0 rounded-lg p-3"
                  style={{
                    background: value ? `${item.color}08` : "hsl(var(--muted) / 0.3)",
                    border: `1px solid ${value ? `${item.color}20` : "hsl(var(--border))"}`,
                    opacity: value ? 1 : 0.5,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} style={{ color: value ? item.color : "hsl(var(--muted-foreground))" }} />
                    <span
                      className="text-xs font-extrabold uppercase tracking-widest"
                      style={{ color: value ? item.color : "hsl(var(--muted-foreground))" }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-snug line-clamp-3">
                    {value || "Pending — run more pipeline steps."}
                  </p>
                </div>
                {i < CHAIN.length - 1 && (
                  <ArrowRight size={14} className="text-muted-foreground flex-shrink-0 mx-1 hidden sm:block" />
                )}
              </div>
            );
          })}
        </div>

        {/* Narrative summary — clean sentences */}
        {narrativeSummary && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">{narrativeSummary}</p>
          </div>
        )}
      </div>
    </div>
  );
});
