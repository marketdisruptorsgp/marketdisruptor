/**
 * StrategicPrecedentSection — Shows real companies that executed
 * similar strategic moves, building credibility and pattern recognition.
 */

import { memo } from "react";
import { Building2 } from "lucide-react";
import type { StrategicPrecedent } from "@/lib/reconfiguration";

interface StrategicPrecedentSectionProps {
  precedents: StrategicPrecedent[];
}

export const StrategicPrecedentSection = memo(function StrategicPrecedentSection({
  precedents,
}: StrategicPrecedentSectionProps) {
  if (!precedents?.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Building2 size={14} className="text-primary flex-shrink-0" />
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-foreground">
          Strategic precedent
        </h4>
      </div>
      <p className="text-xs text-muted-foreground">
        Companies that executed similar moves
      </p>
      <div className="space-y-2">
        {precedents.map((p, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg px-3 py-2.5"
            style={{ background: "hsl(var(--muted))" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black"
              style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
            >
              {p.company.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">{p.company}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                {p.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
