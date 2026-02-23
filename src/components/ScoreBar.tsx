interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
}

export const ScoreBar = ({ label, score, maxScore = 10 }: ScoreBarProps) => {
  const percent = (score / maxScore) * 100;
  const barColor =
    score >= 8
      ? "hsl(var(--success))"
      : score >= 6
      ? "hsl(var(--primary))"
      : "hsl(var(--warning))";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-sm font-bold" style={{ color: barColor }}>
          {score}/10
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, background: barColor }}
        />
      </div>
    </div>
  );
};