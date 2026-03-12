/**
 * Primary Blocker Callout — highlights the single most impactful constraint
 */

import { memo, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { InsightGraph } from "@/lib/insightGraph";
import { getConstraintNodes } from "@/lib/graphQuery";

interface PrimaryBlockerCalloutProps {
  graph: InsightGraph;
}

export const PrimaryBlockerCallout = memo(function PrimaryBlockerCallout({ graph }: PrimaryBlockerCalloutProps) {
  const blocker = useMemo(() => {
    const constraints = getConstraintNodes(graph);
    if (constraints.length === 0) return null;
    // Sort by impact * influence to find the biggest blocker
    return constraints.sort((a, b) => (b.impact * b.influence) - (a.impact * a.influence))[0];
  }, [graph]);

  if (!blocker) return null;

  // Count how many nodes this constraint connects to (unlocking potential)
  const unlockCount = graph.edges.filter(
    e => e.source === blocker.id && (e.relation === "blocks" || e.relation === "causes" || e.relation === "leads_to")
  ).length;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl flex-shrink-0"
      style={{
        background: "hsl(38 92% 50% / 0.08)",
        border: "2px solid hsl(38 92% 50% / 0.35)",
      }}
    >
      <AlertTriangle
        size={16}
        className="flex-shrink-0 mt-0.5"
        style={{ color: "hsl(38 92% 50%)" }}
      />
      <div className="min-w-0">
        <p className="text-xs font-extrabold text-foreground">
          Primary blocker: {blocker.label}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
          {blocker.reasoning
            ? blocker.reasoning.slice(0, 120) + (blocker.reasoning.length > 120 ? "…" : "")
            : unlockCount > 0
              ? `Resolving this constraint unlocks ${unlockCount} downstream opportunity${unlockCount !== 1 ? "s" : ""}.`
              : "This is the highest-impact constraint identified in the analysis."
          }
        </p>
      </div>
    </div>
  );
});
