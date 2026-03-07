export const LeverageScore = ({ score }: { score?: number }) => {
  if (score == null) return null;
  const label = score >= 8 ? "High" : score >= 5 ? "Moderate" : "Low";
  const color = score >= 8 ? "hsl(var(--destructive))" : score >= 5 ? "hsl(38 92% 42%)" : "hsl(142 70% 35%)";
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded typo-status-label tabular-nums"
      style={{ color, background: `${color}12`, border: `1px solid ${color}30` }}
    >
      Leverage: {label}
    </span>
  );
};
