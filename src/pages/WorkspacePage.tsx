import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { HeroSection } from "@/components/HeroSection";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Database, TrendingUp, Award, Calendar, Crown, Heart, ArrowRight, PlusCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ProjectInsightCard } from "@/components/portfolio/ProjectInsightCard";
import { ScoreInsightPanel } from "@/components/portfolio/ScoreInsightPanel";
import { ComparisonInsightView } from "@/components/portfolio/ComparisonInsightView";
import { ActionItemsPanel } from "@/components/portfolio/ActionItemsPanel";
import { InfoExplainer } from "@/components/InfoExplainer";
import { LensBanner } from "@/components/workspace/LensBanner";
import { WorkspaceExplorer } from "@/components/workspace/WorkspaceExplorer";

interface SavedAnalysis {
  id: string;
  title: string;
  category: string;
  avg_revival_score: number;
  created_at: string;
  analysis_type?: string;
  products?: any[];
  analysis_data?: any;
  era: string;
  audience: string;
  batch_size: number;
  is_favorite?: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  custom: { label: "Product", color: "hsl(var(--mode-product))" },
  product: { label: "Product", color: "hsl(var(--mode-product))" },
  service: { label: "Service", color: "hsl(var(--mode-service))" },
  business: { label: "Business", color: "hsl(var(--mode-business))" },
  first_principles: { label: "First Principles", color: "hsl(var(--score-high))" },
};

function getScoreColor(score: number) {
  if (score >= 7) return "hsl(var(--score-high))";
  if (score >= 4.5) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

export default function WorkspacePage() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const navigate = useNavigate();
  const analysis = useAnalysis();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [didPreselect, setDidPreselect] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  useEffect(() => {
    if (didPreselect || analyses.length === 0) return;
    const best = [...analyses].sort((a, b) => (b.avg_revival_score || 0) - (a.avg_revival_score || 0))[0];
    if (best) setCompareIds(new Set([best.id]));
    setDidPreselect(true);
  }, [analyses, didPreselect]);

  const fetchAll = async () => {
    const { data } = await supabase
      .from("saved_analyses")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(100);
    const all = ((data as unknown as SavedAnalysis[]) || []).filter(
      (a) => a.analysis_type !== "first_principles"
    );
    setAnalyses(all);
    setLoading(false);
  };

  const [filterMode, setFilterMode] = useState<string>("all");
  const [filterScore, setFilterScore] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");

  const filteredAnalyses = useMemo(() => {
    let result = [...analyses];
    if (filterMode !== "all") result = result.filter(a => (a.analysis_type || "product") === filterMode);
    if (filterScore === "high") result = result.filter(a => (a.avg_revival_score || 0) >= 7.5);
    else if (filterScore === "mid") result = result.filter(a => (a.avg_revival_score || 0) >= 5 && (a.avg_revival_score || 0) < 7.5);
    else if (filterScore === "low") result = result.filter(a => (a.avg_revival_score || 0) < 5);
    if (sortBy === "score") result.sort((a, b) => (b.avg_revival_score || 0) - (a.avg_revival_score || 0));
    return result;
  }, [analyses, filterMode, filterScore, sortBy]);

  const totalProjects = analyses.length;
  const avgScore = totalProjects > 0
    ? Math.round((analyses.reduce((s, a) => s + (a.avg_revival_score || 0), 0) / totalProjects) * 10) / 10
    : 0;
  const topScore = totalProjects > 0 ? Math.max(...analyses.map((a) => a.avg_revival_score || 0)) : 0;
  const thisMonthCount = analyses.filter((a) => {
    const d = new Date(a.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const timeline = useMemo(() => {
    const map: Record<string, number> = {};
    analyses.forEach((a) => {
      const month = format(parseISO(a.created_at), "MMM yyyy");
      map[month] = (map[month] || 0) + 1;
    });
    return Object.entries(map).map(([month, count]) => ({ month, count })).reverse();
  }, [analyses]);

  const favorites = useMemo(() => {
    return analyses.filter(a => a.is_favorite).sort((a, b) => (b.avg_revival_score || 0) - (a.avg_revival_score || 0)).slice(0, 5);
  }, [analyses]);

  const toggleFavorite = async (id: string) => {
    const target = analyses.find(a => a.id === id);
    if (!target) return;
    const newVal = !target.is_favorite;
    setAnalyses(prev => prev.map(a => a.id === id ? { ...a, is_favorite: newVal } : a));
    await supabase.from("saved_analyses").update({ is_favorite: newVal } as any).eq("id", id);
  };

  const favoriteIds = new Set(favorites.map(f => f.id));
  const topPerformers = useMemo(() => {
    return [...analyses]
      .filter(a => (a.avg_revival_score || 0) > 0 && !favoriteIds.has(a.id))
      .sort((a, b) => (b.avg_revival_score || 0) - (a.avg_revival_score || 0))
      .slice(0, 5);
  }, [analyses, favoriteIds]);

  const compareList = analyses.filter((a) => compareIds.has(a.id));
  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <HeroSection tier={tier} remainingAnalyses={null} />
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Row 1: Title + CTA */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="typo-page-title text-foreground">My Workspace</h1>
            <p className="typo-card-meta text-foreground/70">Your operating surface for analyses and strategic work</p>
          </div>
          <button
            onClick={() => navigate("/analysis/new")}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full typo-nav-primary bg-primary text-primary-foreground hover:opacity-90 transition-colors"
          >
            <PlusCircle size={15} />
            New Analysis
          </button>
        </div>

        {/* Mobile CTA */}
        <button
          onClick={() => navigate("/analysis/new")}
          className="sm:hidden w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl typo-nav-primary bg-primary text-primary-foreground hover:opacity-90 transition-colors"
        >
          <PlusCircle size={15} />
          New Analysis
        </button>
        {/* Lens Configuration */}
        <LensBanner />

        {totalProjects === 0 ? (
          <div className="text-center py-20">
            <Database size={40} className="mx-auto mb-4 opacity-20" />
            <p className="typo-card-body text-foreground/60 mb-4">No analyses yet. Run your first analysis to build your workspace.</p>
            <button
              onClick={() => navigate("/analysis/new")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full typo-nav-primary bg-primary text-primary-foreground hover:opacity-90 transition-colors"
            >
              <PlusCircle size={15} />
              Start Your First Analysis
            </button>
          </div>
        ) : (
          <>
            {/* Row 2: Metrics strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Database, label: "Total Projects", value: totalProjects, accent: "hsl(var(--primary))" },
                { icon: TrendingUp, label: "Avg Score", value: avgScore, accent: "hsl(var(--warning))" },
                { icon: Award, label: "Top Score", value: topScore, accent: "hsl(var(--score-high))" },
                { icon: Calendar, label: "This Month", value: thisMonthCount, accent: "hsl(var(--primary))" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
                  style={{ borderLeft: `3px solid ${stat.accent}` }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${stat.accent}14` }}>
                    <stat.icon size={16} style={{ color: stat.accent }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground tabular-nums">{stat.value}</p>
                    <p className="typo-status-label text-foreground/60 uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Intelligence Explorer */}
            <WorkspaceExplorer />

            {/* Section 1: My Top Choices */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-1">
                <Heart size={16} className="text-primary fill-primary" />
                <p className="typo-section-title text-foreground">My Top Choices</p>
                <InfoExplainer text="Projects you've marked as favorites. These are your personal picks — the ideas you're most excited about pursuing." />
              </div>
              <p className="typo-card-body text-foreground/70 mb-4">
                Your hand-picked favorites — the ideas you're most excited about.
              </p>
              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {favorites.map((a) => {
                    const cat = CATEGORY_MAP[a.analysis_type || a.category] || CATEGORY_MAP.custom;
                    const score = a.avg_revival_score || 0;
                    const data = a.analysis_data as any;
                    const imgList = data?.pitchDeckImages as { url: string; ideaName: string }[] | undefined;
                    const productImg = (a.products as any[])?.[0]?.image;
                    const heroImg = imgList?.[0]?.url || productImg;
                    return (
                      <button
                        key={a.id}
                        onClick={() => analysis.handleLoadSaved(a as any)}
                        className="rounded-xl border border-primary/20 bg-primary/[0.03] overflow-hidden text-left transition-all hover:shadow-md group relative"
                      >
                        <div
                          className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-card/80 backdrop-blur-sm border border-border hover:bg-destructive/10 transition-colors"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(a.id); }}
                        >
                          <Heart size={12} className="text-primary fill-primary" />
                        </div>
                        {heroImg && (
                          <div className="w-full h-28 overflow-hidden">
                            <img src={heroImg} alt={a.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="typo-card-title text-foreground group-hover:text-primary transition-colors truncate text-sm">{a.title}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="typo-status-label px-2 py-0.5 rounded font-bold" style={{ background: `${cat.color}15`, color: cat.color }}>
                              {cat.label}
                            </span>
                            <span className="text-lg font-bold tabular-nums" style={{ color: getScoreColor(score) }}>{score}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <Heart size={28} className="text-muted-foreground/30 mb-3" />
                  <p className="typo-card-body text-foreground/60 mb-1">No favorites yet</p>
                  <p className="typo-card-meta text-foreground/50 max-w-sm">
                    Tap the heart icon on any project card below to add it to your top choices.
                  </p>
                </div>
              )}
            </div>

            {/* Section 2: Projects Grid */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-1">
                <p className="typo-section-title text-foreground">Projects</p>
                <InfoExplainer text="All your saved analyses. Select up to 3 to compare across strategic dimensions." />
              </div>
              <p className="typo-card-body text-foreground/70 mb-4">
                Select projects to compare across revival score, risk, market size, GTM readiness, innovation, and unit economics.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {analyses.slice(0, 20).map((a) => (
                  <button key={a.id} onClick={() => toggleCompare(a.id)}
                    className="px-3 py-1.5 rounded-lg typo-card-meta font-medium transition-all"
                    style={{
                      background: compareIds.has(a.id) ? "hsl(var(--primary))" : "hsl(var(--background))",
                      color: compareIds.has(a.id) ? "white" : "hsl(var(--foreground))",
                      border: `1.5px solid ${compareIds.has(a.id) ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                      boxShadow: compareIds.has(a.id) ? "0 2px 8px hsl(var(--primary) / 0.25)" : "none",
                    }}>
                    {(a.title || "Untitled").length > 25 ? (a.title || "Untitled").slice(0, 25) + "..." : (a.title || "Untitled")}
                  </button>
                ))}
              </div>
              <ComparisonInsightView compareList={compareList} />
            </div>

            {/* Section 3: Action Items */}
            <ActionItemsPanel analyses={analyses} />

            {/* Section 4: Recent Activity */}
            {timeline.length > 1 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <p className="typo-section-title text-foreground">Recent Activity</p>
                  <InfoExplainer text="Your analysis cadence over time. Consistent exploration compounds strategic intuition." />
                </div>
                <p className="typo-card-body text-foreground/70 mb-4">
                  Your analysis activity over time.
                </p>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={timeline}>
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" fill="hsl(var(--primary) / 0.12)" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Score Intelligence */}
            <ScoreInsightPanel analyses={analyses} />

            {/* Top Performers */}
            {topPerformers.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Crown size={16} className="text-foreground" />
                  <p className="typo-section-title text-foreground">{favorites.length > 0 ? "Other Top Performers" : "Top Performers"}</p>
                </div>
                <p className="typo-card-body text-foreground/70 mb-4">
                  Your strongest opportunities ranked by revival score.
                </p>
                <div className="space-y-2">
                  {topPerformers.map((a, rank) => {
                    const cat = CATEGORY_MAP[a.analysis_type || a.category] || CATEGORY_MAP.custom;
                    const score = a.avg_revival_score || 0;
                    return (
                      <button
                        key={a.id}
                        onClick={() => analysis.handleLoadSaved(a as any)}
                        className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all hover:shadow-md group"
                        style={{
                          background: rank === 0 ? "hsl(var(--primary) / 0.04)" : "hsl(var(--background))",
                          border: `1.5px solid ${rank === 0 ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))"}`,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 typo-card-title font-bold"
                          style={{
                            background: rank === 0 ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted))",
                            color: rank === 0 ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                          }}
                        >
                          #{rank + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="typo-card-title text-foreground group-hover:text-primary transition-colors truncate">{a.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="typo-status-label px-2 py-0.5 rounded font-bold" style={{ background: `${cat.color}15`, color: cat.color }}>
                              {cat.label}
                            </span>
                            <span className="typo-card-meta text-foreground/50">
                              {format(parseISO(a.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-2xl font-bold tabular-nums" style={{ color: getScoreColor(score) }}>{score}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(a.id); }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Heart size={14} className={a.is_favorite ? "text-primary fill-primary" : "text-muted-foreground"} />
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
