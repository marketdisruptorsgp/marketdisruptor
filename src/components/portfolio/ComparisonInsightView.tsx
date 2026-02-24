interface SavedAnalysis {
  id: string;
  title: string;
  avg_revival_score: number;
  analysis_data?: any;
}

interface InsightRow {
  label: string;
  extract: (a: SavedAnalysis) => string | number | null;
  type?: "text" | "score";
}

const INSIGHT_ROWS: InsightRow[] = [
  {
    label: "Revival Score",
    extract: (a) => a.avg_revival_score || null,
    type: "score",
  },
  {
    label: "Disruption Thesis",
    extract: (a) => {
      const d = a.analysis_data as any;
      return d?.disruptData?.disruptionThesis || d?.firstPrinciplesData?.thesis || null;
    },
  },
  {
    label: "Risk Profile",
    extract: (a) => {
      const d = a.analysis_data as any;
      const risks = d?.stressTestData?.risks || d?.pitchDeck?.risks;
      if (!risks?.length) return null;
      return risks.map((r: any) => r.risk || r.title || r).slice(0, 2).join("; ");
    },
  },
  {
    label: "Market Opportunity",
    extract: (a) => {
      const d = a.analysis_data as any;
      return d?.pitchDeck?.marketOpportunity?.tam || d?.pitchDeck?.marketOpportunity?.totalSize || null;
    },
  },
  {
    label: "GTM Strategy",
    extract: (a) => {
      const d = a.analysis_data as any;
      const channels = d?.pitchDeck?.gtmStrategy?.keyChannels;
      return channels?.slice(0, 2).join(", ") || null;
    },
  },
  {
    label: "Leverage Score",
    extract: (a) => {
      const d = a.analysis_data as any;
      const products = d?.products || [];
      const scores = products.map((p: any) => p.leverageScore).filter(Boolean);
      if (!scores.length) return null;
      return Math.round(scores.reduce((s: number, v: number) => s + v, 0) / scores.length * 10) / 10;
    },
    type: "score",
  },
];

export function ComparisonInsightView({ compareList }: { compareList: SavedAnalysis[] }) {
  if (compareList.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="grid gap-3" style={{ gridTemplateColumns: `160px repeat(${compareList.length}, 1fr)` }}>
        {/* Header */}
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2">Insight</div>
        {compareList.map((a) => (
          <div key={a.id} className="text-xs font-bold text-foreground py-2 truncate">{a.title.slice(0, 25)}</div>
        ))}

        {/* Rows */}
        {INSIGHT_ROWS.map((row) => {
          const values = compareList.map((a) => row.extract(a));
          const hasAny = values.some((v) => v !== null);
          if (!hasAny) return null;

          return [
            <div key={`${row.label}-label`} className="text-[10px] font-semibold text-muted-foreground py-2 border-t border-border/50">
              {row.label}
            </div>,
            ...compareList.map((a, i) => {
              const val = values[i];
              return (
                <div key={`${row.label}-${a.id}`} className="text-[11px] text-foreground py-2 border-t border-border/50">
                  {val === null ? (
                    <span className="text-muted-foreground/50">—</span>
                  ) : row.type === "score" ? (
                    <span className="font-bold" style={{ color: Number(val) >= 7.5 ? "hsl(var(--score-high))" : "hsl(var(--foreground))" }}>
                      {val}/10
                    </span>
                  ) : (
                    <span className="leading-relaxed line-clamp-3">{String(val)}</span>
                  )}
                </div>
              );
            }),
          ];
        })}
      </div>
    </div>
  );
}
