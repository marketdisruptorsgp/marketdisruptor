import { useState, useEffect, useMemo, useCallback } from "react";
import { useWorkspaceTheme } from "@/hooks/useWorkspaceTheme";
import { WorkspaceThemeToggle } from "@/components/WorkspaceThemeToggle";
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
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="flex items-start sm:items-center justify-between gap-2 mb-3 flex-col sm:flex-row">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${iconColor}15` }}>
          <Icon size={14} style={{ color: iconColor }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
            {badge}
          </div>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Dashboard card wrapper ── */
function DashCard({ children, className = "", span = "" }: { children: React.ReactNode; className?: string; span?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 flex flex-col ${span} ${className}`}>
      {children}
    </div>
  );
}

export default function WorkspacePage() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const { theme, toggle: toggleTheme } = useWorkspaceTheme();
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
    // Only select columns needed for the workspace list — skip the heavy analysis_data blob
    const { data } = await supabase
      .from("saved_analyses")
      .select("id, title, category, avg_revival_score, created_at, analysis_type, products, era, audience, batch_size, is_favorite")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(100);
    const all = ((data as unknown as SavedAnalysis[]) || []).filter((a) => {
      if (a.analysis_type === "first_principles") return false;
      if (a.analysis_type === "business_model") return true;
      return Array.isArray(a.products) && a.products.length > 0;
    });
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

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">My Workspace</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Your operating surface for analyses and strategic work</p>
          </div>
          <div className="flex items-center gap-2">
            <WorkspaceThemeToggle theme={theme} onToggle={toggleTheme} />
            <button
              onClick={() => navigate("/analysis/new")}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-md hover:shadow-lg"
            >
              <PlusCircle size={14} />
              New Analysis
            </button>
          </div>
        </div>

        {/* Mobile CTA */}
        <button
          onClick={() => navigate("/analysis/new")}
          className="sm:hidden w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-colors shadow-md mb-4"
        >
          <PlusCircle size={14} />
          New Analysis
        </button>

        {/* Lens Configuration */}
        <div className="mb-5">
          <LensBanner />
        </div>

        {totalProjects === 0 ? (
          <div className="text-center py-20 rounded-xl border-2 border-dashed border-border bg-card/50">
            <Database size={48} className="mx-auto mb-4 text-primary/30" />
            <p className="text-lg font-bold text-foreground mb-2">No analyses yet</p>
            <p className="text-sm text-muted-foreground mb-6">Run your first analysis to build your workspace.</p>
            <button
              onClick={() => navigate("/analysis/new")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-colors shadow-md"
            >
              <PlusCircle size={14} />
              Start Your First Analysis
            </button>
          </div>
        ) : (
          <>
            {/* ── Metrics Strip (full width) ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { icon: Database, label: "Total Projects", value: totalProjects, accent: "hsl(var(--primary))" },
                { icon: TrendingUp, label: "Avg Score", value: avgScore, accent: "hsl(var(--warning))" },
                { icon: Award, label: "Top Score", value: topScore, accent: "hsl(var(--score-high))" },
                { icon: Calendar, label: "This Month", value: thisMonthCount, accent: "hsl(var(--mode-service))" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card p-3 flex items-center gap-3 hover:shadow-sm transition-shadow"
                  style={{ borderLeft: `4px solid ${stat.accent}` }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${stat.accent}15` }}>
                    <stat.icon size={16} style={{ color: stat.accent }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground tabular-nums">{stat.value}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ═══════════ DASHBOARD GRID ═══════════ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* ── My Top Choices ── */}
              <DashCard>
                <SectionHeader
                  icon={Heart}
                  iconColor="hsl(var(--destructive))"
                  title="My Top Choices"
                  badge={<InfoExplainer text="Projects you've marked as favorites." />}
                />
                <div className="flex-1 overflow-y-auto max-h-[340px] -mx-1 px-1">
                  {favorites.length > 0 ? (
                    <div className="space-y-2">
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
                            className="w-full rounded-lg border border-primary/20 bg-primary/[0.03] overflow-hidden text-left transition-all hover:shadow-md hover:border-primary/40 group relative flex items-center gap-3 p-2.5"
                          >
                            {heroImg && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                <img src={heroImg} alt={a.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">{a.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${cat.color}15`, color: cat.color }}>
                                  {cat.label}
                                </span>
                                <span className="text-sm font-bold tabular-nums" style={{ color: getScoreColor(score) }}>{score}</span>
                              </div>
                            </div>
                            <div
                              className="p-1 rounded hover:bg-destructive/10 transition-colors flex-shrink-0"
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(a.id); }}
                            >
                              <Heart size={12} className="text-primary fill-primary" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6 text-center">
                      <Heart size={24} className="text-muted-foreground mb-2" />
                      <p className="text-xs font-semibold text-muted-foreground">No favorites yet</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tap <Heart size={9} className="inline text-primary fill-primary" /> on any project.
                      </p>
                    </div>
                  )}
                </div>
              </DashCard>

              {/* ── All Projects ── */}
              <DashCard span="lg:row-span-2">
                <SectionHeader
                  icon={FolderOpen}
                  iconColor="hsl(var(--primary))"
                  title="All Projects"
                  badge={<span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{filteredAnalyses.length}</span>}
                />

                {/* Search + Filters (compact) */}
                <div className="space-y-2 mb-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search projects..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { key: "all", label: "All" },
                      { key: "product", label: "Product" },
                      { key: "service", label: "Service" },
                      { key: "business_model", label: "Business" },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFilterMode(f.key)}
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
                        style={{
                          background: filterMode === f.key ? "hsl(var(--primary))" : "hsl(var(--muted))",
                          color: filterMode === f.key ? "white" : "hsl(var(--foreground))",
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                    <div className="w-px h-4 bg-border" />
                    {[
                      { key: "all", label: "Any" },
                      { key: "high", label: "7.5+" },
                      { key: "mid", label: "5–7" },
                      { key: "low", label: "<5" },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setFilterScore(f.key)}
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
                        style={{
                          background: filterScore === f.key ? "hsl(var(--score-high))" : "hsl(var(--muted))",
                          color: filterScore === f.key ? "white" : "hsl(var(--foreground))",
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setSortBy(sortBy === "date" ? "score" : "date")}
                      className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-muted text-foreground hover:bg-accent transition-colors ml-auto"
                    >
                      {sortBy === "date" ? "Newest" : "Top"}
                    </button>
                  </div>
                </div>

                {/* Project list */}
                <div className="flex-1 overflow-y-auto max-h-[520px] -mx-1 px-1">
                  {filteredAnalyses.length === 0 ? (
                    <div className="text-center py-8">
                      <Search size={20} className="mx-auto mb-1 text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground">No projects match.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredAnalyses.map((a) => {
                        const cat = CATEGORY_MAP[a.analysis_type || a.category] || CATEGORY_MAP.custom;
                        const score = a.avg_revival_score || 0;
                        const isCompared = compareIds.has(a.id);
                        return (
                          <div
                            key={a.id}
                            className="flex items-center gap-2 rounded-lg p-2.5 transition-all hover:shadow-sm group cursor-pointer"
                            style={{
                              border: `1.5px solid ${isCompared ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                              background: isCompared ? "hsl(var(--primary) / 0.04)" : "transparent",
                            }}
                          >
                            <button
                              onClick={() => toggleCompare(a.id)}
                              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                              style={{
                                borderWidth: "1.5px",
                                borderStyle: "solid",
                                borderColor: isCompared ? "hsl(var(--primary))" : "hsl(var(--border))",
                                background: isCompared ? "hsl(var(--primary))" : "transparent",
                              }}
                            >
                              {isCompared && <span className="text-primary-foreground text-xs font-bold">✓</span>}
                            </button>
                            <button
                              onClick={() => analysis.handleLoadSaved(a as any)}
                              className="flex-1 min-w-0 text-left"
                            >
                              <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{a.title || "Untitled"}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${cat.color}15`, color: cat.color }}>
                                  {cat.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{format(parseISO(a.created_at), "MMM d")}</span>
                              </div>
                            </button>
                            {score > 0 && (
                              <span className="text-sm font-bold tabular-nums flex-shrink-0" style={{ color: getScoreColor(score) }}>{score}</span>
                            )}
                            <button
                              onClick={() => toggleFavorite(a.id)}
                              className="p-1 rounded hover:bg-primary/10 transition-colors flex-shrink-0"
                            >
                              <Heart size={11} className={a.is_favorite ? "text-primary fill-primary" : "text-muted-foreground/20 group-hover:text-muted-foreground"} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Comparison view */}
                {compareList.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 size={12} className="text-primary" />
                      <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                        Comparing {compareList.length}
                      </p>
                    </div>
                    <ComparisonInsightView compareList={compareList} />
                  </div>
                )}
              </DashCard>

              {/* ── Score Intelligence ── */}
              <DashCard>
                <div className="flex-1 overflow-y-auto max-h-[340px]">
                  <ScoreInsightPanel analyses={analyses} />
                </div>
              </DashCard>

              {/* ── Intelligence Explorer ── */}
              <DashCard span="md:col-span-2 lg:col-span-1">
                <SectionHeader
                  icon={Zap}
                  iconColor="hsl(var(--mode-product))"
                  title="Intelligence Explorer"
                />
                <div className="flex-1 overflow-y-auto max-h-[360px] -mx-1 px-1">
                  <WorkspaceExplorer onConversationSaved={() => setConvRefreshKey(k => k + 1)} loadConversation={loadConv} onLoadComplete={() => setLoadConv(null)} />
                </div>
              </DashCard>

              {/* ── Action Items ── */}
              <DashCard>
                <div className="flex-1 overflow-y-auto max-h-[360px]">
                  <ActionItemsPanel analyses={analyses} />
                </div>
              </DashCard>

              {/* ── Top Performers ── */}
              {topPerformers.length > 0 && (
                <DashCard>
                  <SectionHeader
                    icon={Crown}
                    iconColor="hsl(var(--warning))"
                    title={favorites.length > 0 ? "Other Top Performers" : "Top Performers"}
                  />
                  <div className="flex-1 overflow-y-auto max-h-[340px] -mx-1 px-1 space-y-1.5">
                    {topPerformers.map((a, rank) => {
                      const cat = CATEGORY_MAP[a.analysis_type || a.category] || CATEGORY_MAP.custom;
                      const score = a.avg_revival_score || 0;
                      return (
                        <button
                          key={a.id}
                          onClick={() => analysis.handleLoadSaved(a as any)}
                          className="w-full flex items-center gap-3 rounded-lg p-3 text-left transition-all hover:shadow-sm group"
                          style={{
                            background: rank === 0 ? "hsl(var(--primary) / 0.04)" : "transparent",
                            border: `1.5px solid ${rank === 0 ? "hsl(var(--primary) / 0.25)" : "hsl(var(--border))"}`,
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                            style={{
                              background: rank === 0 ? "hsl(var(--primary))" : "hsl(var(--muted))",
                              color: rank === 0 ? "white" : "hsl(var(--foreground))",
                            }}
                          >
                            #{rank + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">{a.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${cat.color}15`, color: cat.color }}>
                                {cat.label}
                              </span>
                            </div>
                          </div>
                          <span className="text-lg font-bold tabular-nums flex-shrink-0" style={{ color: getScoreColor(score) }}>{score}</span>
                        </button>
                      );
                    })}
                  </div>
                </DashCard>
              )}

              {/* ── Saved Conversations ── */}
              <DashCard span="md:col-span-2 lg:col-span-3">
                <SavedConversations refreshKey={convRefreshKey} onResumeConversation={(conv) => { setLoadConv({ ...conv }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
              </DashCard>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
