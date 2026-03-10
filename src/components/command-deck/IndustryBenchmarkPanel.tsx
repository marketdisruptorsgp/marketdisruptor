/**
 * IndustryBenchmarkPanel — Archetype-based benchmark comparisons
 * Shows how this business compares to similar model types.
 */

import { memo } from "react";
import { BarChart3, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { ProvenanceBadge } from "./ProvenanceBadge";
import { trimAt } from "@/lib/humanize";
import type { BenchmarkResult } from "@/lib/benchmarkEngine";

interface IndustryBenchmarkPanelProps {
  benchmark: BenchmarkResult | null;
}

function RatingBadge({ rating }: { rating: "above_average" | "average" | "below_average" }) {
  const config = {
    above_average: { label: "Above Average", color: "hsl(142, 71%, 45%)", bg: "hsl(142, 71%, 45% / 0.1)", Icon: ArrowUp },
    average: { label: "Average", color: "hsl(38, 92%, 50%)", bg: "hsl(38, 92%, 50% / 0.1)", Icon: Minus },
    below_average: { label: "Below Average", color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.1)", Icon: ArrowDown },
  };
  const c = config[rating];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: c.bg, color: c.color }}>
      <c.Icon size={10} />
      {c.label}
    </span>
  );
}

export const IndustryBenchmarkPanel = memo(function IndustryBenchmarkPanel({ benchmark }: IndustryBenchmarkPanelProps) {
  if (!benchmark || benchmark.metrics.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
            <BarChart3 size={14} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Industry Benchmark</h3>
            <p className="text-[10px] text-muted-foreground">
              vs. <span className="font-bold text-primary">{benchmark.modelType}</span>
            </p>
          </div>
        </div>
        <ProvenanceBadge source="benchmark" />
      </div>

      <div className="px-5 pb-2">
        <p className="text-xs text-muted-foreground leading-relaxed">{benchmark.summary}</p>
      </div>

      <div className="px-5 pb-4">
        <div className="space-y-2">
          {benchmark.metrics.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg p-3"
              style={{ background: "hsl(var(--muted) / 0.25)", border: "1px solid hsl(var(--border))" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{m.label}</p>
                <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{trimAt(m.rationale, 150)}</p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <RatingBadge rating={m.rating} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
