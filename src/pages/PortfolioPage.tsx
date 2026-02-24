import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { HeroSection } from "@/components/HeroSection";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Database, TrendingUp, Award, Calendar, ArrowLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ProjectInsightCard } from "@/components/portfolio/ProjectInsightCard";
import { ScoreInsightPanel } from "@/components/portfolio/ScoreInsightPanel";
import { ComparisonInsightView } from "@/components/portfolio/ComparisonInsightView";
import { ActionItemsPanel } from "@/components/portfolio/ActionItemsPanel";

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
}

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  custom: { label: "Product", color: "#1249a3" },
  product: { label: "Product", color: "#1249a3" },
  service: { label: "Service", color: "#df2060" },
  business: { label: "Business", color: "#8b3fd9" },
  first_principles: { label: "First Principles", color: "#0d9488" },
};

export default function PortfolioPage() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const navigate = useNavigate();
  const analysis = useAnalysis();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  // Pre-populate first project in comparison once loaded
  const [didPreselect, setDidPreselect] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  // Pre-select top-scoring project for comparison
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
    setAnalyses((data as unknown as SavedAnalysis[]) || []);
    setLoading(false);
  };

  // Filters
  const [filterMode, setFilterMode] = useState<string>("all");
  const [filterScore, setFilterScore] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");

  const uniqueModes = useMemo(() => {
    const modes = new Set(analyses.map(a => a.analysis_type || "product"));
    return Array.from(modes);
  }, [analyses]);

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

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    analyses.forEach((a) => {
      const type = a.analysis_type || "custom";
      const cat = CATEGORY_MAP[type] || CATEGORY_MAP.custom;
      map[cat.label] = (map[cat.label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: Object.values(CATEGORY_MAP).find((c) => c.label === name)?.color || "#1249a3",
    }));
  }, [analyses]);

  const timeline = useMemo(() => {
    const map: Record<string, number> = {};
    analyses.forEach((a) => {
      const month = format(parseISO(a.created_at), "MMM yyyy");
      map[month] = (map[month] || 0) + 1;
    });
    return Object.entries(map).map(([month, count]) => ({ month, count })).reverse();
  }, [analyses]);

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
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <ArrowLeft size={16} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Portfolio Dashboard</h1>
            <p className="text-xs text-muted-foreground">Strategic overview of all your analyses</p>
          </div>
        </div>

        {totalProjects === 0 ? (
          <div className="text-center py-20">
            <Database size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm text-muted-foreground">No analyses yet. Run your first analysis to see portfolio insights.</p>
          </div>
        ) : (
          <>
            {/* Stats row */}
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
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Items Panel */}
            <ActionItemsPanel analyses={analyses} />

            {/* Score Intelligence Panel */}
            <ScoreInsightPanel analyses={analyses} />

            {/* Comparison Insight View */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Insight Comparison</p>
              <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                Compare up to 3 projects across revival score, risk, market size, GTM readiness, innovation, and unit economics. Expand any dimension for detailed context.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {analyses.slice(0, 20).map((a) => (
                  <button key={a.id} onClick={() => toggleCompare(a.id)}
                    className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors"
                    style={{
                      background: compareIds.has(a.id) ? "hsl(var(--primary))" : "hsl(var(--muted))",
                      color: compareIds.has(a.id) ? "white" : "hsl(var(--foreground))",
                      border: `1px solid ${compareIds.has(a.id) ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                    }}>
                    {a.title.length > 25 ? a.title.slice(0, 25) + "…" : a.title}
                  </button>
                ))}
              </div>
              <ComparisonInsightView compareList={compareList} />
            </div>

            {/* Category Breakdown */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Category Breakdown</p>
              <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                Shows the distribution of your analyses across different modes — Product, Service, Business, and First Principles.
              </p>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} labelLine={false}>
                      {categoryBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {categoryBreakdown.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                    <span className="text-[10px] font-semibold text-foreground">{entry.name}</span>
                    <span className="text-[10px] text-muted-foreground">({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            {timeline.length > 1 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Activity Timeline</p>
                <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                  Your analysis activity over time. Consistent exploration leads to better strategic pattern recognition.
                </p>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={timeline}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" fill="hsl(230 90% 63% / 0.15)" stroke="hsl(230 90% 63%)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Saved Projects Grid */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Saved Projects</p>
              <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                All your saved analyses. Click any project to reopen the full analysis flow.
              </p>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Modes</option>
                  {uniqueModes.map(m => (
                    <option key={m} value={m}>{(CATEGORY_MAP[m] || CATEGORY_MAP.custom).label}</option>
                  ))}
                </select>
                <select
                  value={filterScore}
                  onChange={(e) => setFilterScore(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Scores</option>
                  <option value="high">High (≥ 7.5)</option>
                  <option value="mid">Mid (5–7.4)</option>
                  <option value="low">Low (&lt; 5)</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "score")}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="date">Newest First</option>
                  <option value="score">Highest Score</option>
                </select>
                {(filterMode !== "all" || filterScore !== "all") && (
                  <button
                    onClick={() => { setFilterMode("all"); setFilterScore("all"); }}
                    className="text-[10px] text-primary hover:underline font-semibold"
                  >
                    Clear Filters
                  </button>
                )}
                <span className="text-[10px] text-muted-foreground ml-auto">{filteredAnalyses.length} of {analyses.length} projects</span>
              </div>

              {filteredAnalyses.length === 0 ? (
                <div className="py-10 text-center border border-border rounded-xl bg-card">
                  <p className="text-sm text-muted-foreground">No projects match the selected filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAnalyses.map((a) => (
                    <ProjectInsightCard
                      key={a.id}
                      analysis={a}
                      onOpen={() => analysis.handleLoadSaved(a as any)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
