/**
 * FreshnessBadge — Shows data staleness indicators on saved analyses.
 * Tells returning users how old their market/competitive data is.
 */
import { memo } from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { differenceInDays, differenceInHours, parseISO } from "date-fns";

interface FreshnessBadgeProps {
  /** ISO date string of when the analysis was last updated */
  updatedAt: string;
  /** ISO date string of when the analysis was created */
  createdAt: string;
  /** Whether the analysis has scraped competitive data */
  hasCompetitiveData?: boolean;
  /** Whether the analysis has geo/census data */
  hasGeoData?: boolean;
  /** Compact mode for card layouts */
  compact?: boolean;
}

type FreshnessLevel = "fresh" | "aging" | "stale" | "expired";

function getFreshnessLevel(updatedAt: string): { level: FreshnessLevel; daysSince: number; label: string } {
  const days = differenceInDays(new Date(), parseISO(updatedAt));

  if (days <= 7) return { level: "fresh", daysSince: days, label: days === 0 ? "Today" : `${days}d ago` };
  if (days <= 30) return { level: "aging", daysSince: days, label: `${Math.round(days / 7)}w ago` };
  if (days <= 90) return { level: "stale", daysSince: days, label: `${Math.round(days / 30)}mo ago` };
  return { level: "expired", daysSince: days, label: `${Math.round(days / 30)}mo ago` };
}

const FRESHNESS_CONFIG: Record<FreshnessLevel, { color: string; bgColor: string; icon: typeof Clock; tip: string }> = {
  fresh: {
    color: "hsl(var(--score-high))",
    bgColor: "hsl(var(--score-high) / 0.08)",
    icon: CheckCircle2,
    tip: "Data is current",
  },
  aging: {
    color: "hsl(var(--warning))",
    bgColor: "hsl(var(--warning) / 0.08)",
    icon: Clock,
    tip: "Market conditions may have shifted — consider re-running competitive research",
  },
  stale: {
    color: "hsl(var(--destructive))",
    bgColor: "hsl(var(--destructive) / 0.08)",
    icon: AlertTriangle,
    tip: "Data is 1-3 months old — competitive landscape and pricing intel may be outdated",
  },
  expired: {
    color: "hsl(var(--destructive))",
    bgColor: "hsl(var(--destructive) / 0.06)",
    icon: AlertTriangle,
    tip: "Data is over 3 months old — strongly recommend re-analysis for current market conditions",
  },
};

export const FreshnessBadge = memo(function FreshnessBadge({
  updatedAt,
  createdAt,
  hasCompetitiveData,
  hasGeoData,
  compact = false,
}: FreshnessBadgeProps) {
  const { level, daysSince, label } = getFreshnessLevel(updatedAt);
  const config = FRESHNESS_CONFIG[level];
  const Icon = config.icon;

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
        style={{ color: config.color, background: config.bgColor }}
        title={config.tip}
      >
        <Icon size={9} />
        {label}
      </span>
    );
  }

  // Only show detailed badge for aging+ data
  if (level === "fresh") return null;

  const staleSignals: string[] = [];
  if (hasCompetitiveData && daysSince > 14) staleSignals.push("competitive research");
  if (hasGeoData && daysSince > 90) staleSignals.push("census/geo data");
  if (daysSince > 30) staleSignals.push("market pricing");

  return (
    <div
      className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
      style={{ background: config.bgColor, border: `1px solid ${config.color}20` }}
    >
      <Icon size={13} className="mt-0.5 flex-shrink-0" style={{ color: config.color }} />
      <div>
        <p className="font-semibold" style={{ color: config.color }}>
          Last updated {label}
          {level === "expired" && " — data may be significantly outdated"}
        </p>
        {staleSignals.length > 0 && (
          <p className="text-muted-foreground mt-0.5">
            Potentially stale: {staleSignals.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
});
