import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SavedAnalysis {
  id: string;
  avg_revival_score: number;
  analysis_data?: any;
}

function getUserAvgScore(a: SavedAnalysis): number | null {
  const data = a.analysis_data as any;
  if (!data?.userScores) return null;
  const scores = Object.values(data.userScores).filter((v): v is number => typeof v === "number");
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 10) / 10;
}

export function ScoreInsightPanel({ analyses }: { analyses: SavedAnalysis[] }) {
  const chartData = useMemo(() => {
    const buckets: { score: string; ai: number; user: number }[] = [];
    for (let i = 1; i <= 10; i++) buckets.push({ score: `${i}`, ai: 0, user: 0 });

    analyses.forEach((a) => {
      const aiScore = Math.round(a.avg_revival_score || 0);
      if (aiScore >= 1 && aiScore <= 10) buckets[aiScore - 1].ai++;

      const userScore = getUserAvgScore(a);
      if (userScore !== null) {
        const rounded = Math.round(userScore);
        if (rounded >= 1 && rounded <= 10) buckets[rounded - 1].user++;
      }
    });

    return buckets;
  }, [analyses]);

  const hasUserScores = chartData.some((d) => d.user > 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Score Intelligence</p>
      <p className="text-[10px] text-muted-foreground mb-3">
        {hasUserScores ? "AI-generated scores vs your adjusted scores" : "Revival score distribution across all projects"}
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} barGap={2}>
          <XAxis dataKey="score" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
          <Tooltip />
          {hasUserScores && <Legend wrapperStyle={{ fontSize: 10 }} />}
          <Bar dataKey="ai" name="AI Score" fill="hsl(230 90% 63%)" radius={[3, 3, 0, 0]} />
          {hasUserScores && (
            <Bar dataKey="user" name="Your Score" fill="hsl(38 92% 50%)" radius={[3, 3, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
