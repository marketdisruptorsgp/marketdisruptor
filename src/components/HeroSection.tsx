import { UserHeader } from "@/components/UserHeader";
import { TIERS, TierKey } from "@/hooks/useSubscription";

interface HeroSectionProps {
  tier: TierKey;
  remainingAnalyses: number | null;
  profileFirstName?: string;
}

export function HeroSection({ tier, remainingAnalyses, profileFirstName }: HeroSectionProps) {
  return (
    <header className="border-b" style={{ background: "hsl(var(--foreground))" }}>
      {/* Top nav */}
      <div style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.08)" }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Market Disruptor</span>
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
            className="px-2.5 py-1 rounded text-[11px] font-medium tracking-wide"
            style={{
              background: "hsl(0 0% 100% / 0.08)",
              color: "hsl(0 0% 100% / 0.6)",
              border: "1px solid hsl(0 0% 100% / 0.1)",
            }}
          >
            {TIERS[tier].name}{remainingAnalyses !== null ? ` · ${remainingAnalyses} left` : " · Unlimited"}
          </span>
          {tier !== "disruptor" && (
            <button
              onClick={() => window.location.href = "/pricing"}
              className="px-2.5 py-1 rounded text-[11px] font-medium tracking-wide transition-colors"
              style={{ background: "hsl(0 0% 100% / 0.12)", color: "hsl(0 0% 100% / 0.8)", border: "1px solid hsl(0 0% 100% / 0.15)" }}
            >
              Upgrade
            </button>
          )}
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-4" style={{ color: "hsl(0 0% 100%)" }}>
          Analyze, Deconstruct,{" "}
          <span style={{ color: "hsl(0 0% 100% / 0.5)" }}>Capitalize.</span>
        </h1>
        <p className="text-base max-w-2xl leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
          Advanced AI research models that challenge every assumption, flip conventional thinking, and rebuild better versions from the ground up. Built by SGP Capital to arm entrepreneurs with tools to reinvent markets.
        </p>
      </div>
    </header>
  );
}
