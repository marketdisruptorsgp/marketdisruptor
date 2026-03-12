/**
 * Data Confidence Banner — shows how many conclusions are verified vs inferred
 */

import { memo, useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import type { InsightGraph } from "@/lib/insightGraph";

interface DataConfidenceBannerProps {
  graph: InsightGraph;
}

export const DataConfidenceBanner = memo(function DataConfidenceBanner({ graph }: DataConfidenceBannerProps) {
  const { total, verified, inferred } = useMemo(() => {
    const total = graph.nodes.length;
    const verified = graph.nodes.filter(
      n => n.confidence === "high" || n.sourceEngine === "document"
    ).length;
    return { total, verified, inferred: total - verified };
  }, [graph]);

  if (total === 0) return null;

  const pct = Math.round((verified / total) * 100);

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl flex-shrink-0"
      style={{
        background: pct >= 60
          ? "hsl(152 60% 44% / 0.08)"
          : "hsl(38 92% 50% / 0.08)",
        border: `1.5px solid ${pct >= 60 ? "hsl(152 60% 44% / 0.25)" : "hsl(38 92% 50% / 0.25)"}`,
      }}
    >
      <ShieldCheck
        size={14}
        style={{ color: pct >= 60 ? "hsl(152 60% 44%)" : "hsl(38 92% 50%)", flexShrink: 0 }}
      />
      <p className="text-xs text-foreground">
        <span className="font-bold">{verified} of {total}</span> conclusions are based on verified data from your documents.{" "}
        <span className="text-muted-foreground">{inferred} were inferred.</span>
      </p>
    </div>
  );
});
