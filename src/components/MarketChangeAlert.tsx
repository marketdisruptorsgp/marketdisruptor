import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, X, ArrowRight, FileText, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MatchResult {
  category: string;
  patentCount: number;
  newsCount: number;
}

export function MarketChangeAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    checkForChanges();
    // Update last_seen_at
    (supabase.rpc as any)("update_last_seen", { p_user_id: user.id }).then(() => {}).catch(() => {});
  }, [user]);

  const checkForChanges = async () => {
    try {
      // Get user's last_seen_at from profile
      const { data: profile } = await (supabase.from("profiles") as any)
        .select("last_seen_at")
        .eq("user_id", user!.id)
        .single();

      const lastSeen = profile?.last_seen_at || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get user's saved analysis categories
      const { data: savedAnalyses } = await supabase
        .from("saved_analyses")
        .select("category")
        .eq("user_id", user!.id);

      if (!savedAnalyses?.length) {
        setLoading(false);
        return;
      }

      const categories = [...new Set(savedAnalyses.map((a) => a.category))];

      // Check for new patents and news since last visit
      const results: MatchResult[] = [];

      for (const category of categories) {
        const [patentRes, newsRes] = await Promise.all([
          supabase
            .from("patent_filings")
            .select("id", { count: "exact", head: true })
            .ilike("category", `%${category}%`)
            .gte("created_at", lastSeen),
          supabase
            .from("market_news")
            .select("id", { count: "exact", head: true })
            .ilike("category", `%${category}%`)
            .gte("created_at", lastSeen),
        ]);

        const patentCount = patentRes.count || 0;
        const newsCount = newsRes.count || 0;

        if (patentCount > 0 || newsCount > 0) {
          results.push({ category, patentCount, newsCount });
        }
      }

      setMatches(results);
    } catch (err) {
      console.error("Market change check failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || dismissed || matches.length === 0) return null;

  const totalPatents = matches.reduce((s, m) => s + m.patentCount, 0);
  const totalNews = matches.reduce((s, m) => s + m.newsCount, 0);

  return (
    <div
      className="rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--primary) / 0.2)",
        borderLeft: "3px solid hsl(var(--primary))",
      }}
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "hsl(var(--primary) / 0.1)" }}
        >
          <Bell size={14} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Market Intel Updated</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Since your last visit:{" "}
            {totalPatents > 0 && (
              <span className="font-semibold text-foreground">
                {totalPatents} new patent{totalPatents > 1 ? "s" : ""}
              </span>
            )}
            {totalPatents > 0 && totalNews > 0 && " and "}
            {totalNews > 0 && (
              <span className="font-semibold text-foreground">
                {totalNews} market news item{totalNews > 1 ? "s" : ""}
              </span>
            )}
            {" "}in your tracked categories.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {matches.map((m) => (
              <span
                key={m.category}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md typo-card-meta font-medium"
                style={{
                  background: "hsl(var(--primary) / 0.08)",
                  color: "hsl(var(--primary))",
                  border: "1px solid hsl(var(--primary) / 0.15)",
                }}
              >
                {m.patentCount > 0 && <><FileText size={8} /> {m.patentCount}</>}
                {m.newsCount > 0 && <><Lightbulb size={8} /> {m.newsCount}</>}
                {" "}{m.category}
              </span>
            ))}
          </div>
          <button
            onClick={() => navigate("/intel")}
            className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: "hsl(var(--primary))" }}
          >
            Review Intel Dashboard <ArrowRight size={12} />
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
        >
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
