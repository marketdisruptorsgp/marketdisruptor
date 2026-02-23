import { UserHeader } from "@/components/UserHeader";
import { TIERS, TierKey } from "@/hooks/useSubscription";
import { Database, Zap, BarChart3, Clock } from "lucide-react";

interface HeroSectionProps {
  tier: TierKey;
  remainingAnalyses: number | null;
  profileFirstName?: string;
  onOpenSaved?: () => void;
  savedCount?: number;
}

export function HeroSection({ tier, remainingAnalyses, profileFirstName, onOpenSaved, savedCount }: HeroSectionProps) {
  const greeting = getGreeting();

  return (
    <header style={{ background: "hsl(var(--card))" }}>
      {/* Top nav bar */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded flex items-center justify-center bg-primary text-primary-foreground">
              <Zap size={14} />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">Market Disruptor</span>
            <span className="hidden sm:inline text-[9px] font-semibold uppercase tracking-widest text-muted-foreground border border-border rounded px-1.5 py-0.5 ml-1">
              OS
            </span>
          </div>
          <div className="flex items-center gap-2" data-tour="user-menu">
            {onOpenSaved && (
              <button
                onClick={onOpenSaved}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition-colors border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Database size={12} />
                <span className="hidden sm:inline">Projects</span>
                {typeof savedCount === "number" && savedCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground leading-none">
                    {savedCount}
                  </span>
                )}
              </button>
            )}
            <UserHeader />
          </div>
        </div>
      </div>

      {/* Welcome row */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
              {greeting}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
              {profileFirstName ? `${profileFirstName}'s Workspace` : "Your Workspace"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-lg leading-relaxed">
              Deconstruct markets, stress-test strategies, and build what's next.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-4 px-4 py-2.5 rounded border border-border bg-background">
              <div className="flex items-center gap-1.5">
                <BarChart3 size={12} className="text-primary" />
                <span className="text-[11px] font-semibold text-foreground">
                  {TIERS[tier].name}
                </span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  {remainingAnalyses !== null ? `${remainingAnalyses} analyses left` : "Unlimited"}
                </span>
              </div>
            </div>
            {tier !== "disruptor" && (
              <button
                onClick={() => window.location.href = "/pricing"}
                className="px-3 py-2 rounded text-[11px] font-bold uppercase tracking-wider transition-colors bg-primary text-primary-foreground hover:bg-primary-dark"
              >
                Upgrade
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
