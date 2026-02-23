import { UserHeader } from "@/components/UserHeader";
import { TIERS, TierKey } from "@/hooks/useSubscription";
import { Database } from "lucide-react";

interface HeroSectionProps {
  tier: TierKey;
  remainingAnalyses: number | null;
  profileFirstName?: string;
  onOpenSaved?: () => void;
  savedCount?: number;
}

export function HeroSection({ tier, remainingAnalyses, profileFirstName, onOpenSaved, savedCount }: HeroSectionProps) {
  return (
    <header className="border-b border-border bg-background">
      {/* Top nav */}
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Market Disruptor</span>
          </div>
          <div className="flex items-center gap-3" data-tour="user-menu">
            {onOpenSaved && (
              <button
                onClick={onOpenSaved}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold transition-colors border border-border bg-card text-foreground hover:bg-muted"
              >
                <Database size={14} />
                Saved
                {typeof savedCount === "number" && savedCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground leading-none">
                    {savedCount}
                  </span>
                )}
              </button>
            )}
            <UserHeader />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        {/* Plan badge */}
        <div className="flex items-center gap-3 mb-6">
          <span
            className="px-2.5 py-1 rounded text-[11px] font-medium tracking-wide bg-muted text-muted-foreground border border-border"
          >
            {TIERS[tier].name}{remainingAnalyses !== null ? ` · ${remainingAnalyses} left` : " · Unlimited"}
          </span>
          {tier !== "disruptor" && (
            <button
              onClick={() => window.location.href = "/pricing"}
              className="px-2.5 py-1 rounded text-[11px] font-medium tracking-wide transition-colors bg-card text-foreground border border-border hover:bg-muted"
            >
              Upgrade
            </button>
          )}
        </div>
        <div className="pl-4" style={{ borderLeft: "2px solid hsl(var(--primary))" }}>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-4 text-foreground">
            Analyze, Deconstruct,{" "}
            <span className="text-primary">Capitalize.</span>
          </h1>
          <p className="text-base max-w-2xl leading-relaxed text-muted-foreground">
            Advanced AI research models that challenge every assumption, flip conventional thinking, and rebuild better versions from the ground up. Built by SGP Capital to arm entrepreneurs with tools to reinvent markets.
          </p>
        </div>
      </div>
    </header>
  );
}