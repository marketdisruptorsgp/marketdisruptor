interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
}

function qualLabel(score: number): { label: string; color: string } {
  if (score >= 8) return { label: "Strong", color: "hsl(var(--success))" };
  if (score >= 6) return { label: "Moderate", color: "hsl(var(--primary))" };
  return { label: "Limited", color: "hsl(var(--warning))" };
}

export const ScoreBar = ({ label, score, maxScore = 10 }: ScoreBarProps) => {
  const qual = qualLabel(score);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="typo-card-meta">{label}</span>
        <span className="typo-card-title" style={{ color: qual.color }}>
          {qual.label}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(score / maxScore) * 100}%`, background: qual.color }}
        />
      </div>
    </div>
  );
};
