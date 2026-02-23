import { UserHeader } from "@/components/UserHeader";
import { TIERS, TierKey } from "@/hooks/useSubscription";

interface HeroSectionProps {
  tier: TierKey;
  remainingAnalyses: number | null;
  profileFirstName?: string;
}

export function HeroSection({ tier, remainingAnalyses, profileFirstName }: HeroSectionProps) {
  return (
    <header className="border-b border-border bg-background">
      {/* Top nav */}
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Market Disruptor</span>
          </div>
          <div data-tour="user-menu">
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
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-4 text-foreground">
          Analyze, Deconstruct,{" "}
          <span className="text-primary">Capitalize.</span>
        </h1>
        <p className="text-base max-w-2xl leading-relaxed text-muted-foreground">
          Advanced AI research models that challenge every assumption, flip conventional thinking, and rebuild better versions from the ground up. Built by SGP Capital to arm entrepreneurs with tools to reinvent markets.
        </p>
      </div>
    </header>
  );
}