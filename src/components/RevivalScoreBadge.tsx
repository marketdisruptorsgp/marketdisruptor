import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RevivalScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export const RevivalScoreBadge = ({ score, size = "md" }: RevivalScoreBadgeProps) => {
  const badgeClass =
    score >= 8 ? "score-badge-high" : score >= 6 ? "score-badge-mid" : "score-badge-low";

  const label =
    score >= 8 ? "High Potential" : score >= 6 ? "Moderate Potential" : "Limited Potential";

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs rounded font-semibold"
      : size === "lg"
      ? "px-4 py-2 text-base rounded font-bold"
      : "px-3 py-1 text-sm rounded font-semibold";

  const tooltipText =
    score >= 8
      ? `${score}/10 — Strong market demand signals, pricing headroom, and community interest suggest high revival potential.`
      : score >= 6
      ? `${score}/10 — Some positive signals in demand or sentiment, but gaps in pricing or distribution limit potential.`
      : `${score}/10 — Weak demand signals or structural barriers make revival challenging without significant repositioning.`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1.5 ${badgeClass} ${sizeClasses} cursor-help`}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px]">
          <p className="text-xs leading-relaxed">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
