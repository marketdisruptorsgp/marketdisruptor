import { useEffect, useState } from "react";
import { UserHeader } from "@/components/UserHeader";
import { TIERS, TierKey } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Database, Zap, BarChart3, Clock, FolderOpen, Star, CalendarDays } from "lucide-react";

interface HeroSectionProps {
  tier: TierKey;
  remainingAnalyses: number | null;
  profileFirstName?: string;
  onOpenSaved?: () => void;
  savedCount?: number;
}

export function HeroSection({ tier, remainingAnalyses, profileFirstName, onOpenSaved, savedCount }: HeroSectionProps) {
  const greeting = getGreeting();
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<{ totalAnalyses: number; latestScore: number | null; memberSince: string | null }>({
    totalAnalyses: 0,
    latestScore: null,
    memberSince: null,
  });

  useEffect(() => {
    if (!user?.id) return;
    // Fetch real user stats
    (async () => {
      const { count } = await (supabase.from("saved_analyses") as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { data: latest } = await (supabase.from("saved_analyses") as any)
        .select("avg_revival_score")
        .eq("user_id", user.id)
        .not("avg_revival_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const { data: profile } = await (supabase.from("profiles") as any)
        .select("created_at")
        .eq("user_id", user.id)
        .single();

      setUserStats({
        totalAnalyses: count ?? 0,
        latestScore: latest?.avg_revival_score ?? null,
        memberSince: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : null,
      });
    })();
  }, [user?.id]);

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

      {/* Your Activity — real data */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6 overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <FolderOpen size={12} className="text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Projects:</span>
            <span className="text-[11px] font-bold text-foreground">{userStats.totalAnalyses}</span>
          </div>
          {userStats.latestScore !== null && (
            <>
              <div className="w-px h-4 bg-border flex-shrink-0" />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Star size={12} className="text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">Latest Score:</span>
                <span className="text-[11px] font-bold text-foreground">{userStats.latestScore}/10</span>
              </div>
            </>
          )}
          {userStats.memberSince && (
            <>
              <div className="w-px h-4 bg-border flex-shrink-0" />
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <CalendarDays size={12} className="text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">Member since:</span>
                <span className="text-[11px] font-bold text-foreground">{userStats.memberSince}</span>
              </div>
            </>
          )}
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
