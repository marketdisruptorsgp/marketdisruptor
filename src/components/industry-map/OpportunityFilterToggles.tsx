/**
 * OpportunityFilterToggles — Checkbox toggles for marker visibility
 */

import { memo } from "react";
import type { MarkerType } from "@/lib/industryOpportunityOverlay";

interface OpportunityFilterTogglesProps {
  visibleTypes: Set<MarkerType>;
  onToggle: (type: MarkerType) => void;
}

const TOGGLE_DEFS: { type: MarkerType; label: string; icon: string; color: string }[] = [
  { type: "constraint", label: "Constraints", icon: "⚠", color: "hsl(var(--destructive))" },
  { type: "opportunity", label: "Opportunities", icon: "★", color: "hsl(142 71% 45%)" },
  { type: "fragmentation", label: "Fragmentation", icon: "●", color: "hsl(38 92% 50%)" },
  { type: "trend", label: "Trends", icon: "▲", color: "hsl(var(--primary))" },
];

export const OpportunityFilterToggles = memo(function OpportunityFilterToggles({
  visibleTypes,
  onToggle,
}: OpportunityFilterTogglesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TOGGLE_DEFS.map(def => {
        const isActive = visibleTypes.has(def.type);
        return (
          <button
            key={def.type}
            onClick={() => onToggle(def.type)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
            style={{
              background: isActive ? `${def.color}15` : "hsl(var(--muted) / 0.3)",
              color: isActive ? def.color : "hsl(var(--muted-foreground))",
              border: `1px solid ${isActive ? `${def.color}40` : "hsl(var(--border))"}`,
              opacity: isActive ? 1 : 0.6,
            }}
          >
            <span className="text-xs">{def.icon}</span>
            {def.label}
          </button>
        );
      })}
    </div>
  );
});
