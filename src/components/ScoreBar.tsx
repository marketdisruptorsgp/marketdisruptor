interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
}

export const ScoreBar = ({ label, score, maxScore = 10 }: ScoreBarProps) => {
  const percent = (score / maxScore) * 100;
  const colorClass =
    score >= 8
      ? "from-green-500 to-emerald-400"
      : score >= 6
      ? "from-blue-500 to-blue-400"
      : "from-orange-500 to-amber-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground/70">{label}</span>
        <span className="text-sm font-bold" style={{ color: "hsl(var(--primary))" }}>
          {score}/10
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
