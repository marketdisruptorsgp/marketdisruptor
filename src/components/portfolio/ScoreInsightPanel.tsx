import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { TrendingUp, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface SavedAnalysis {
  id: string;
  title: string;
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

function getScoreColor(score: number) {
  if (score >= 8) return "hsl(142 70% 40%)";
  if (score >= 6) return "hsl(38 92% 50%)";
  if (score >= 4) return "hsl(25 90% 48%)";
  return "hsl(0 72% 51%)";
}

function getScoreLabel(score: number) {
  if (score >= 8) return "Strong";
  if (score >= 6) return "Promising";
  if (score >= 4) return "Needs Work";
  return "Weak";
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

  // Compute summary insights
  const scores = analyses.map((a) => a.avg_revival_score || 0).filter(Boolean);
  const avg = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 10) / 10 : 0;
  const highCount = scores.filter((s) => s >= 8).length;
  const lowCount = scores.filter((s) => s < 5).length;
  const median = scores.length ? [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)] : 0;

  // Top & bottom projects
  const sorted = [...analyses].filter(a => a.avg_revival_score > 0).sort((a, b) => b.avg_revival_score - a.avg_revival_score);
  const topProjects = sorted.slice(0, 3);
  const bottomProjects = sorted.slice(-3).reverse();

  // AI vs user deviation
  const deviations = analyses.map((a) => {
    const userScore = getUserAvgScore(a);
    if (userScore === null) return null;
    return { title: a.title, diff: Math.round((userScore - a.avg_revival_score) * 10) / 10 };
  }).filter(Boolean) as { title: string; diff: number }[];

  const biggestOverride = deviations.length > 0
    ? deviations.reduce((max, d) => Math.abs(d.diff) > Math.abs(max.diff) ? d : max, deviations[0])
    : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <p className="typo-status-label text-foreground uppercase tracking-wider mb-1">Score Intelligence</p>
        <p className="typo-card-body text-foreground leading-relaxed">
          How your portfolio's revival scores are distributed. Clusters on the right mean you're consistently finding strong opportunities. Spread means wider exploration.
        </p>
      </div>

      {/* Summary metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Average", value: avg, icon: TrendingUp },
          { label: "Median", value: median, icon: Info },
          { label: "Strong (8+)", value: highCount, icon: CheckCircle2 },
          { label: "Weak (<5)", value: lowCount, icon: AlertTriangle },
        ].map((m) => (
          <div key={m.label} className="rounded-lg p-3 flex items-center gap-2" style={{ background: "hsl(var(--muted))" }}>
            <m.icon size={13} className="text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">{m.value}</p>
              <p className="typo-status-label text-foreground/60 uppercase tracking-wider">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barGap={hasUserScores ? 2 : 0}>
          <XAxis dataKey="score" tick={{ fontSize: 10 }} label={{ value: "Revival Score", position: "insideBottom", offset: -2, fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} label={{ value: "Projects", angle: -90, position: "insideLeft", fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip />
          {hasUserScores && <Legend wrapperStyle={{ fontSize: 10 }} />}
          <Bar dataKey="ai" name="AI Score" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={getScoreColor(parseInt(entry.score))} />
            ))}
          </Bar>
          {hasUserScores && (
            <Bar dataKey="user" name="Your Score" fill="hsl(38 92% 50%)" radius={[3, 3, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Contextual insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Top performers */}
        {topProjects.length > 0 && (
          <div className="rounded-lg p-3" style={{ background: "hsl(142 70% 45% / 0.06)", border: "1px solid hsl(142 70% 45% / 0.15)" }}>
            <p className="typo-status-label font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(142 70% 35%)" }}>
              <CheckCircle2 size={10} className="inline mr-1" /> Top Performers
            </p>
            {topProjects.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1">
                <span className="typo-card-meta text-foreground truncate flex-1 mr-2">{p.title}</span>
                <span className="typo-card-meta font-bold flex-shrink-0" style={{ color: getScoreColor(p.avg_revival_score) }}>
                  {p.avg_revival_score} · {getScoreLabel(p.avg_revival_score)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Needs attention / AI vs User deviation */}
        {biggestOverride ? (
          <div className="rounded-lg p-3" style={{ background: "hsl(38 92% 50% / 0.06)", border: "1px solid hsl(38 92% 50% / 0.15)" }}>
            <p className="typo-status-label font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(38 80% 35%)" }}>
              <Info size={10} className="inline mr-1" /> Biggest AI vs You Gap
            </p>
            <p className="typo-card-meta text-foreground mb-1 truncate">{biggestOverride.title}</p>
            <p className="typo-card-meta text-foreground/80">
              You scored this <strong className="text-foreground">{biggestOverride.diff > 0 ? `+${biggestOverride.diff}` : biggestOverride.diff}</strong> {biggestOverride.diff > 0 ? "higher" : "lower"} than the AI.
              {Math.abs(biggestOverride.diff) >= 2 && " That's a significant gap — worth revisiting."}
            </p>
          </div>
        ) : bottomProjects.length > 0 && lowCount > 0 ? (
          <div className="rounded-lg p-3" style={{ background: "hsl(0 72% 51% / 0.06)", border: "1px solid hsl(0 72% 51% / 0.15)" }}>
            <p className="typo-status-label font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(0 72% 40%)" }}>
              <AlertTriangle size={10} className="inline mr-1" /> Needs Attention
            </p>
            {bottomProjects.filter(p => p.avg_revival_score < 5).slice(0, 2).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1">
                <span className="typo-card-meta text-foreground truncate flex-1 mr-2">{p.title}</span>
                <span className="typo-card-meta font-bold flex-shrink-0" style={{ color: getScoreColor(p.avg_revival_score) }}>
                  {p.avg_revival_score} · {getScoreLabel(p.avg_revival_score)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
