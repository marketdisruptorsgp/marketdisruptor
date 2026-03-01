import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { HeroSection } from "@/components/HeroSection";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { Database, TrendingUp, Award, Calendar, Crown, Heart, ArrowRight, PlusCircle, Search, SlidersHorizontal, Briefcase, BarChart3, Zap, FolderOpen, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ProjectInsightCard } from "@/components/portfolio/ProjectInsightCard";
import { ScoreInsightPanel } from "@/components/portfolio/ScoreInsightPanel";
import { ComparisonInsightView } from "@/components/portfolio/ComparisonInsightView";
import { ActionItemsPanel } from "@/components/portfolio/ActionItemsPanel";
import { InfoExplainer } from "@/components/InfoExplainer";
import { LensBanner } from "@/components/workspace/LensBanner";
import { WorkspaceExplorer, type ExplorerConversation } from "@/components/workspace/WorkspaceExplorer";
import { SavedConversations } from "@/components/workspace/SavedConversations";

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

/* ── Section header helper ── */
function SectionHeader({ icon: Icon, iconColor, title, subtitle, badge, children }: {
  icon: any; iconColor: string; title: string; subtitle?: string; badge?: React.ReactNode; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start sm:items-center justify-between gap-3 mb-4 flex-col sm:flex-row">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${iconColor}15` }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
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
  const [convRefreshKey, setConvRefreshKey] = useState(0);
  const [loadConv, setLoadConv] = useState<ExplorerConversation | null>(null);

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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAnalyses = useMemo(() => {
    let result = [...analyses];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.category || "").toLowerCase().includes(q) ||
        (a.analysis_type || "").toLowerCase().includes(q)
      );
    }
    if (filterMode !== "all") result = result.filter(a => (a.analysis_type || "product") === filterMode);
    if (filterScore === "high") result = result.filter(a => (a.avg_revival_score || 0) >= 7.5);
    else if (filterScore === "mid") result = result.filter(a => (a.avg_revival_score || 0) >= 5 && (a.avg_revival_score || 0) < 7.5);
    else if (filterScore === "low") result = result.filter(a => (a.avg_revival_score || 0) < 5);
    if (sortBy === "score") result.sort((a, b) => (b.avg_revival_score || 0) - (a.avg_revival_score || 0));
    return result;
  }, [analyses, filterMode, filterScore, sortBy, searchQuery]);

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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">My Workspace</h1>
            <p className="text-sm text-muted-foreground mt-1">Your operating surface for analyses and strategic work</p>
          </div>
          <button
            onClick={() => navigate("/analysis/new")}
            className="hidden sm:inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-md hover:shadow-lg"
          >
            <PlusCircle size={15} />
            New Analysis
          </button>
        </div>

        {/* Mobile CTA */}
        <button
          onClick={() => navigate("/analysis/new")}
          className="sm:hidden w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-colors shadow-md"
        >
          <PlusCircle size={15} />
          New Analysis
        </button>

        {/* Lens Configuration */}
        <LensBanner />

        {totalProjects === 0 ? (
          <div className="text-center py-20 rounded-xl border-2 border-dashed border-border bg-card/50">
            <Database size={48} className="mx-auto mb-4 text-primary/30" />
            <p className="text-lg font-bold text-foreground mb-2">No analyses yet</p>
            <p className="text-sm text-muted-foreground mb-6">Run your first analysis to build your workspace.</p>
            <button
              onClick={() => navigate("/analysis/new")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-colors shadow-md"
            >
              <PlusCircle size={15} />
              Start Your First Analysis
            </button>
          </div>
        ) : (
          <>
            {/* ── Metrics Strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Database, label: "Total Projects", value: totalProjects, accent: "hsl(var(--primary))" },
                { icon: TrendingUp, label: "Avg Score", value: avgScore, accent: "hsl(var(--warning))" },
                { icon: Award, label: "Top Score", value: topScore, accent: "hsl(var(--score-high))" },
                { icon: Calendar, label: "This Month", value: thisMonthCount, accent: "hsl(var(--mode-service))" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
                  style={{ borderLeft: `4px solid ${stat.accent}` }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.accent}15` }}>
                    <stat.icon size={18} style={{ color: stat.accent }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Intelligence Explorer ── */}
            <WorkspaceExplorer onConversationSaved={() => setConvRefreshKey(k => k + 1)} loadConversation={loadConv} onLoadComplete={() => setLoadConv(null)} />

            {/* ── Saved Explorer Sessions ── */}
            <SavedConversations refreshKey={convRefreshKey} onResumeConversation={(conv) => { setLoadConv({ ...conv }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

            {/* ── My Top Choices ── */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <SectionHeader
                icon={Heart}
                iconColor="hsl(var(--destructive))"
                title="My Top Choices"
                subtitle="Your hand-picked favorites — the ideas you're most excited about."
                badge={<InfoExplainer text="Projects you've marked as favorites. These are your personal picks — the ideas you're most excited about pursuing." />}
              />
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
                        className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] overflow-hidden text-left transition-all hover:shadow-lg hover:border-primary/40 group relative"
                      >
                        <div
                          className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-card/80 backdrop-blur-sm border border-border hover:bg-destructive/10 transition-colors"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(a.id); }}
                        >
                          <Heart size={12} className="text-primary fill-primary" />
                        </div>
                        {heroImg && (
                          <div className="w-full h-32 overflow-hidden">
                            <img src={heroImg} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        )}
                        <div className="p-3.5">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{a.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${cat.color}15`, color: cat.color }}>
                              {cat.label}
                            </span>
                            <span className="text-lg font-bold tabular-nums" style={{ color: getScoreColor(score) }}>{score}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Open analysis <ChevronRight size={12} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                  <Heart size={32} className="text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-semibold text-foreground/60 mb-1">No favorites yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Tap the <Heart size={10} className="inline text-primary fill-primary" /> icon on any project card below to add it to your top choices.
                  </p>
                </div>
              )}
            </div>

            {/* ── All Projects ── */}
            <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <SectionHeader
                icon={FolderOpen}
                iconColor="hsl(var(--primary))"
                title="All Projects"
                subtitle="Search, filter, and compare your analyses."
                badge={
                  <>
                    <InfoExplainer text="All your saved analyses. Use search and filters to find projects. Select up to 3 to compare." />
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">{filteredAnalyses.length}</span>
                  </>
                }
              />

              {/* Search + Filters */}
              <div className="space-y-3 mb-5">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects by name, category..."
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SlidersHorizontal size={13} className="text-muted-foreground" />
                  {[
                    { key: "all", label: "All Types" },
                    { key: "product", label: "Product" },
                    { key: "service", label: "Service" },
                    { key: "business_model", label: "Business" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilterMode(f.key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: filterMode === f.key ? "hsl(var(--primary))" : "hsl(var(--muted))",
                        color: filterMode === f.key ? "white" : "hsl(var(--foreground))",
                        boxShadow: filterMode === f.key ? "0 2px 8px hsl(var(--primary) / 0.25)" : "none",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                  <div className="w-px h-5 bg-border" />
                  {[
                    { key: "all", label: "Any Score" },
                    { key: "high", label: "7.5+" },
                    { key: "mid", label: "5–7.4" },
                    { key: "low", label: "<5" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilterScore(f.key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: filterScore === f.key ? "hsl(var(--score-high))" : "hsl(var(--muted))",
                        color: filterScore === f.key ? "white" : "hsl(var(--foreground))",
                        boxShadow: filterScore === f.key ? "0 2px 8px hsl(142 76% 36% / 0.25)" : "none",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                  <div className="w-px h-5 bg-border" />
                  <button
                    onClick={() => setSortBy(sortBy === "date" ? "score" : "date")}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-muted text-foreground transition-colors hover:bg-accent"
                  >
                    Sort: {sortBy === "date" ? "Newest" : "Top Score"}
                  </button>
                </div>
              </div>

              {/* Project list */}
              {filteredAnalyses.length === 0 ? (
                <div className="text-center py-10 rounded-xl border-2 border-dashed border-border bg-muted/20">
                  <Search size={28} className="mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm font-semibold text-muted-foreground">No projects match your filters.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredAnalyses.map((a) => {
                    const cat = CATEGORY_MAP[a.analysis_type || a.category] || CATEGORY_MAP.custom;
                    const score = a.avg_revival_score || 0;
                    const isCompared = compareIds.has(a.id);
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 rounded-xl p-3.5 transition-all hover:shadow-md group cursor-pointer"
                        style={{
                          border: `2px solid ${isCompared ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                          background: isCompared ? "hsl(var(--primary) / 0.04)" : "hsl(var(--card))",
                        }}
                      >
                        {/* Compare checkbox */}
                        <button
                          onClick={() => toggleCompare(a.id)}
                          className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
                          style={{
                            borderColor: isCompared ? "hsl(var(--primary))" : "hsl(var(--border))",
                            background: isCompared ? "hsl(var(--primary))" : "transparent",
                          }}
                          title="Select to compare"
                        >
                          {isCompared && <span className="text-white text-xs font-bold">✓</span>}
                        </button>

                        {/* Main clickable area */}
                        <button
                          onClick={() => analysis.handleLoadSaved(a as any)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{a.title || "Untitled"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${cat.color}15`, color: cat.color }}>
                              {cat.label}
                            </span>
                            <span className="text-[11px] text-muted-foreground">{a.category}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-[11px] text-muted-foreground">{format(parseISO(a.created_at), "MMM d, yyyy")}</span>
                          </div>
                        </button>

                        {/* Score */}
                        {score > 0 && (
                          <div className="flex flex-col items-center flex-shrink-0">
                            <span className="text-base font-bold tabular-nums" style={{ color: getScoreColor(score) }}>{score}</span>
                            <span className="text-[9px] font-bold uppercase" style={{ color: getScoreColor(score) }}>
                              {score >= 8 ? "Strong" : score >= 6 ? "Good" : "Low"}
                            </span>
                          </div>
                        )}

                        {/* Favorite */}
                        <button
                          onClick={() => toggleFavorite(a.id)}
                          className="p-2 rounded-lg hover:bg-primary/10 transition-colors flex-shrink-0"
                        >
                          <Heart size={14} className={a.is_favorite ? "text-primary fill-primary" : "text-muted-foreground/30 group-hover:text-muted-foreground transition-opacity"} />
                        </button>

                        {/* Arrow */}
                        <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Comparison view */}
              {compareList.length > 0 && (
                <div className="mt-5 pt-5 border-t-2 border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={14} className="text-primary" />
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Comparing {compareList.length} project{compareList.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <ComparisonInsightView compareList={compareList} />
                </div>
              )}
            </div>

            {/* ── Action Items ── */}
            <ActionItemsPanel analyses={analyses} />

            {/* ── Score Intelligence ── */}
            <ScoreInsightPanel analyses={analyses} />

            {/* ── Top Performers ── */}
            {topPerformers.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                <SectionHeader
                  icon={Crown}
                  iconColor="hsl(var(--warning))"
                  title={favorites.length > 0 ? "Other Top Performers" : "Top Performers"}
                  subtitle="Your strongest opportunities ranked by revival score."
                />
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
                          border: `2px solid ${rank === 0 ? "hsl(var(--primary) / 0.25)" : "hsl(var(--border))"}`,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                          style={{
                            background: rank === 0 ? "hsl(var(--primary))" : "hsl(var(--muted))",
                            color: rank === 0 ? "white" : "hsl(var(--foreground))",
                          }}
                        >
                          #{rank + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">{a.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${cat.color}15`, color: cat.color }}>
                              {cat.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(a.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-2xl font-bold tabular-nums" style={{ color: getScoreColor(score) }}>{score}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(a.id); }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <Heart size={14} className={a.is_favorite ? "text-primary fill-primary" : "text-muted-foreground"} />
                          </button>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0" />
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
