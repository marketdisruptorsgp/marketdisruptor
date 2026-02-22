import { Zap } from "lucide-react";
import { UserHeader } from "@/components/UserHeader";
import { TIERS, TierKey } from "@/hooks/useSubscription";

interface HeroSectionProps {
  tier: TierKey;
  remainingAnalyses: number | null;
  profileFirstName?: string;
}

export function HeroSection({ tier, remainingAnalyses, profileFirstName }: HeroSectionProps) {
  return (
    <header className="relative" style={{ background: "linear-gradient(135deg, hsl(220 25% 6%) 0%, hsl(220 30% 12%) 50%, hsl(220 25% 8%) 100%)" }}>
      {/* Subtle gradient orbs for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, hsl(217 91% 50%) 0%, transparent 70%)" }} />
      </div>
      {/* Top nav bar with user */}
      <div className="relative z-10 border-b" style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={15} style={{ color: "hsl(var(--primary-light))" }} />
            <span className="text-xs font-bold tracking-widest uppercase text-white/70">Market Disruptor</span>
          </div>
          <div data-tour="user-menu">
            <UserHeader />
          </div>
        </div>
      </div>
      <div className="relative z-[1] max-w-6xl mx-auto px-4 py-10 sm:py-14">
        {/* Usage badge */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{
              background: "hsl(142 71% 45% / 0.15)",
              color: "hsl(142 71% 55%)",
              border: "1px solid hsl(142 71% 45% / 0.3)",
            }}
          >
            {TIERS[tier].name} Plan{remainingAnalyses !== null ? ` · ${remainingAnalyses} analyses left` : " · Unlimited"}
          </span>
          {tier !== "disruptor" && (
            <button
              onClick={() => window.location.href = "/pricing"}
              className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all hover:scale-105"
              style={{ background: "hsl(var(--primary))", color: "white" }}
            >
              View Plan Options
            </button>
          )}
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight mb-4">
          Analyze, Deconstruct, <span style={{ color: "hsl(var(--primary-light))" }}>Capitalize!</span>
        </h1>
        <p className="text-lg text-white leading-relaxed">
          Developed by SGP Capital, these advanced AI research models don't just analyze products and markets — they challenge every assumption, flip conventional thinking, and rebuild better versions from the ground up. We built them to arm entrepreneurs like yourself with the tools to reinvent markets and bring bold ideas to life. Scroll below to begin your analysis!
        </p>
      </div>
    </header>
  );
}