interface RevivalScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export const RevivalScoreBadge = ({ score, size = "md" }: RevivalScoreBadgeProps) => {
  const badgeClass =
    score >= 8 ? "score-badge-high" : score >= 6 ? "score-badge-mid" : "score-badge-low";

  const label =
    score >= 8 ? "High Revival" : score >= 6 ? "Mid Revival" : "Low Revival";

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs rounded-full font-semibold"
      : size === "lg"
      ? "px-4 py-2 text-base rounded-full font-bold"
      : "px-3 py-1 text-sm rounded-full font-semibold";

  return (
    <span className={`inline-flex items-center gap-1.5 ${badgeClass} ${sizeClasses}`}>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
      {score}/10 · {label}
    </span>
  );
};
