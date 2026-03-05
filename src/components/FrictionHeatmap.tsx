/**
 * Friction Heatmap
 *
 * Matrix visualization showing friction intensity across lenses
 * and dimensions. Color scale: green (low) → yellow (mid) → red (high).
 */

import { memo } from "react";
import type { ExpandedFrictionScore } from "@/lib/frictionEngine";
import type { LensType } from "@/lib/multiLensEngine";
import { computeExpandedFriction } from "@/lib/frictionEngine";
import type { LeverageNode } from "@/lib/multiLensEngine";

interface FrictionHeatmapProps {
  allNodes: LeverageNode[];
  activeLenses: LensType[];
}

const DIMENSION_LABELS: Record<string, string> = {
  customerEffort: "Customer Effort",
  timeDelays: "Time Delays",
  costInefficiency: "Cost",
  processComplexity: "Process",
  informationAsymmetry: "Info Gap",
  industryInertia: "Inertia",
};

const LENS_LABELS: Record<LensType, string> = {
  product: "Product",
  service: "Service",
  business: "Business",
};

function heatColor(value: number): string {
  if (value <= 4) return `hsl(152 60% ${55 - value * 3}%)`;
  if (value <= 7) return `hsl(${44 - (value - 4) * 2} 90% 50%)`;
  return `hsl(${Math.max(0, 10 - (value - 7) * 3)} 72% ${55 - (value - 7) * 5}%)`;
}

function computeLensFriction(
  lens: LensType,
  allNodes: LeverageNode[],
): ExpandedFrictionScore | null {
  const lensNodes = allNodes.filter(n =>
    n.lensScores.some(ls => ls.lens === lens && ls.score >= 5),
  );
  if (lensNodes.length === 0) return null;

  const labels = lensNodes.map(n => n.label).join(" ");
  const evidence = lensNodes.flatMap(n => n.evidence);
  return computeExpandedFriction(labels, evidence);
}

export const FrictionHeatmap = memo(function FrictionHeatmap({
  allNodes,
  activeLenses,
}: FrictionHeatmapProps) {
  const dimensions = Object.keys(DIMENSION_LABELS) as Array<keyof typeof DIMENSION_LABELS>;

  // Compute friction per lens
  const lensData = activeLenses.map(lens => ({
    lens,
    friction: computeLensFriction(lens, allNodes),
  }));

  const hasData = lensData.some(d => d.friction !== null);
  if (!hasData) return null;

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
        Cross-Lens Friction Heatmap
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-20">
                Lens
              </th>
              {dimensions.map(dim => (
                <th
                  key={dim}
                  className="text-center py-2 px-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {DIMENSION_LABELS[dim]}
                </th>
              ))}
              <th className="text-center py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Avg
              </th>
            </tr>
          </thead>
          <tbody>
            {lensData.map(({ lens, friction }) => {
              if (!friction) return null;
              return (
                <tr key={lens}>
                  <td className="py-1.5 pr-3 text-xs font-semibold text-foreground">
                    {LENS_LABELS[lens]}
                  </td>
                  {dimensions.map(dim => {
                    const value = friction.dimensions[dim as keyof typeof friction.dimensions];
                    const bg = heatColor(value);
                    return (
                      <td key={dim} className="py-1.5 px-1">
                        <div
                          className="w-full h-8 rounded-md flex items-center justify-center text-[10px] font-bold tabular-nums transition-colors"
                          style={{
                            background: bg,
                            color: value >= 6 ? "white" : "hsl(var(--foreground))",
                          }}
                        >
                          {value}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-1.5 px-2">
                    <div
                      className="h-8 rounded-md flex items-center justify-center text-[10px] font-extrabold tabular-nums"
                      style={{
                        background: heatColor(friction.overall),
                        color: friction.overall >= 6 ? "white" : "hsl(var(--foreground))",
                      }}
                    >
                      {friction.overall.toFixed(1)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 justify-end">
        <span className="text-[9px] font-semibold text-muted-foreground">Low friction</span>
        <div className="flex gap-0.5">
          {[2, 4, 6, 8, 10].map(v => (
            <div
              key={v}
              className="w-5 h-3 rounded-sm"
              style={{ background: heatColor(v) }}
            />
          ))}
        </div>
        <span className="text-[9px] font-semibold text-muted-foreground">High friction</span>
      </div>
    </div>
  );
});
