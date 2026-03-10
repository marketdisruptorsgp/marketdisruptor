/**
 * WhyThisMattersSection — Impact layer showing business consequences
 * of a constraint and what changes if it's solved.
 */

import { memo } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { WhyThisMatters } from "@/lib/reconfiguration";

interface WhyThisMattersSectionProps {
  data: WhyThisMatters;
}

export const WhyThisMattersSection = memo(function WhyThisMattersSection({
  data,
}: WhyThisMattersSectionProps) {
  if (!data?.implications?.length && !data?.ifSolved?.length) return null;

  return (
    <div className="space-y-4">
      {/* Why This Matters */}
      {data.implications.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-warning flex-shrink-0" />
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-foreground">
              Why this matters
            </h4>
          </div>
          <ul className="space-y-1.5 pl-1">
            {data.implications.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                  style={{ background: "hsl(var(--warning))" }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* If Solved */}
      {data.ifSolved.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-success flex-shrink-0" />
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-foreground">
              If solved
            </h4>
          </div>
          <ul className="space-y-1.5 pl-1">
            {data.ifSolved.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                <span
                  className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                  style={{ background: "hsl(var(--success))" }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
