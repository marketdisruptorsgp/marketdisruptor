/**
 * LensComparisonView — Side-by-side diff of the same entity analyzed
 * through different lenses (e.g., Default vs ETA vs Custom).
 */
import { memo, useMemo } from "react";
import { Focus, Building2, Star, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SavedAnalysis {
  id: string;
  title: string;
  avg_revival_score: number;
  analysis_data?: any;
  analysis_type?: string;
  category?: string;
}

interface LensDiffRow {
  metric: string;
  values: { lens: string; value: string | number; isBetter: boolean }[];
}

function extractLensInfo(a: SavedAnalysis): { lensType: string; lensName: string; color: string; icon: typeof Focus } {
  const snap = a.analysis_data?.lensSnapshot;
  if (snap?.lensType === "eta") return { lensType: "eta", lensName: "ETA Acquisition", color: "hsl(142 70% 40%)", icon: Building2 };
  if (snap?.lensType === "custom") return { lensType: "custom", lensName: snap.name || "Custom", color: "hsl(38 92% 50%)", icon: Star };
  return { lensType: "default", lensName: "Default", color: "hsl(var(--muted-foreground))", icon: Focus };
}

function extractMetrics(a: SavedAnalysis): Record<string, string | number> {
  const d = a.analysis_data || {};
  const metrics: Record<string, string | number> = {};

  metrics["Revival Score"] = a.avg_revival_score || "—";

  // Risk count
  const risks = d?.stressTest?.risks || d?.businessStressTest?.risks || [];
  const highRisks = risks.filter((r: any) => r.severity === "high").length;
  metrics["High Risks"] = highRisks;

  // GTM channels
  const channels = d?.pitchDeck?.gtmStrategy?.keyChannels?.length || 0;
  metrics["GTM Channels"] = channels;

  // TAM
  const tam = d?.pitchDeck?.marketOpportunity?.tam;
  metrics["TAM"] = tam || "—";

  // Confidence
  const governed = d?.governed;
  const confidence = governed?.reasoning_synopsis?.overallConfidence || governed?.overall_confidence;
  metrics["Confidence"] = confidence ? `${Math.round(confidence * 100)}%` : "—";

  // Assumptions identified
  const assumptions = d?.disrupt?.assumptions?.length || d?.businessAnalysis?.hiddenAssumptions?.length || 0;
  metrics["Assumptions"] = assumptions;

  // Flipped ideas
  const ideas = d?.disrupt?.flippedIdeas?.length || 0;
  metrics["Ideas Generated"] = ideas;

  return metrics;
}

function buildDiffRows(analyses: SavedAnalysis[]): LensDiffRow[] {
  const allMetrics = analyses.map(a => ({ lens: extractLensInfo(a).lensName, metrics: extractMetrics(a) }));
  const metricKeys = Object.keys(allMetrics[0]?.metrics || {});

  return metricKeys.map(key => {
    const values = allMetrics.map(m => {
      const val = m.metrics[key];
      return { lens: m.lens, value: val, isBetter: false };
    });

    // Determine "better" for numeric comparisons
    const numericValues = values.map(v => typeof v.value === "number" ? v.value : null);
    if (numericValues.some(v => v !== null)) {
      const isLowerBetter = key === "High Risks";
      const best = isLowerBetter
        ? Math.min(...numericValues.filter((v): v is number => v !== null))
        : Math.max(...numericValues.filter((v): v is number => v !== null));
      values.forEach(v => {
        if (typeof v.value === "number") v.isBetter = v.value === best && numericValues.filter(n => n === best).length === 1;
      });
    }

    return { metric: key, values };
  });
}

export const LensComparisonView = memo(function LensComparisonView({ analyses }: { analyses: SavedAnalysis[] }) {
  // Group analyses by title/entity name to find same-entity different-lens pairs
  const entityGroups = useMemo(() => {
    const groups = new Map<string, SavedAnalysis[]>();
    for (const a of analyses) {
      // Normalize title for grouping (case-insensitive, trim)
      const key = (a.title || "").toLowerCase().trim();
      if (!key) continue;
      const existing = groups.get(key) || [];
      existing.push(a);
      groups.set(key, existing);
    }
    // Only return groups with 2+ analyses (same entity, potentially different lenses)
    return Array.from(groups.entries())
      .filter(([, items]) => items.length >= 2)
      .map(([title, items]) => ({ title: items[0].title, items }));
  }, [analyses]);

  if (entityGroups.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-muted-foreground">
          No lens comparisons available yet. Run the same business through different lenses (Default, ETA, Custom) to see a side-by-side diff.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entityGroups.map(({ title, items }) => {
        const rows = buildDiffRows(items);
        const lensInfos = items.map(a => extractLensInfo(a));

        return (
          <div key={title} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <p className="text-sm font-bold text-foreground">{title}</p>
              <div className="flex items-center gap-3 mt-1">
                {lensInfos.map((info, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: info.color }}>
                    <info.icon size={10} /> {info.lensName}
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4 font-bold text-muted-foreground text-[10px] uppercase tracking-wider">Metric</th>
                    {lensInfos.map((info, i) => (
                      <th key={i} className="text-left py-2 px-3 font-bold text-[10px] uppercase tracking-wider" style={{ color: info.color }}>
                        {info.lensName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-border/50">
                      <td className="py-2 px-4 font-medium text-muted-foreground">{row.metric}</td>
                      {row.values.map((v, vi) => (
                        <td key={vi} className="py-2 px-3" style={{
                          color: v.isBetter ? "hsl(var(--score-high))" : undefined,
                          fontWeight: v.isBetter ? 700 : 400,
                        }}>
                          <span className="flex items-center gap-1">
                            {v.value}
                            {v.isBetter && <TrendingUp size={10} />}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
});
