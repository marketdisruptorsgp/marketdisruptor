/**
 * SecondOrderEffectsSection — Shows downstream market consequences
 * if a strategic move succeeds.
 */

import { memo } from "react";
import { TrendingUp } from "lucide-react";
import { trimAt } from "@/lib/humanize";

interface SecondOrderEffectsSectionProps {
  effects: string[];
}

export const SecondOrderEffectsSection = memo(function SecondOrderEffectsSection({
  effects,
}: SecondOrderEffectsSectionProps) {
  if (!effects?.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TrendingUp size={14} className="text-accent-foreground flex-shrink-0" />
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-foreground">
          Second-order effects
        </h4>
      </div>
      <p className="text-xs text-muted-foreground">
        What happens downstream if this move succeeds
      </p>
      <ul className="space-y-1.5 pl-1">
        {effects.map((effect, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
            <span
              className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
              style={{ background: "hsl(var(--primary))" }}
            />
            {trimAt(effect, 180)}
          </li>
        ))}
      </ul>
    </div>
  );
});
