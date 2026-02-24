import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { HeroSection } from "@/components/HeroSection";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Database, TrendingUp, Award, Calendar, ArrowLeft,
  ChevronRight, Star,
} from "lucide-react";
import { format, parseISO, startOfMonth } from "date-fns";

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

const TYPE_COLORS: Record<string, string> = {
  product: "hsl(var(--primary))",
  service: "hsl(340 75% 50%)",
  business_model: "hsl(217 91% 45%)",
};

const PIE_COLORS = ["#4f68e8", "#df2060", "#1249a3", "#8b3fd9"];

export default function PortfolioPage() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const navigate = useNavigate();
  const analysis = useAnalysis();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

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

  // Stats
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

  // Score distribution
  const scoreDistribution = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (let i = 1; i <= 10; i++) buckets[`${i}`] = 0;
    analyses.forEach((a) => {
      const score = Math.round(a.avg_revival_score || 0);
      if (score >= 1 && score <= 10) buckets[`${score}`]++;
    });
    return Object.entries(buckets).map(([score, count]) => ({ score, count }));
  }, [analyses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    analyses.forEach((a) => {
      const type = a.analysis_type || "product";
      map[type] = (map[type] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [analyses]);

  // Timeline
  const timeline = useMemo(() => {
    const map: Record<string, number> = {};
    analyses.forEach((a) => {
      const month = format(parseISO(a.created_at), "MMM yyyy");
      map[month] = (map[month] || 0) + 1;
    });
    return Object.entries(map)
      .map(([month, count]) => ({ month, count }))
      .reverse();
  }, [analyses]);

  // Comparison
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

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Score distribution */}
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Score Distribution</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={scoreDistribution}>
                    <XAxis dataKey="score" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(230 90% 63%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Category breakdown */}
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Category Breakdown</p>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryBreakdown.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {timeline.length > 1 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Activity Timeline</p>
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

            {/* Comparison */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Side-by-Side Comparison</p>
              <p className="text-[10px] text-muted-foreground mb-3">Select up to 3 projects to compare</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {analyses.slice(0, 20).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => toggleCompare(a.id)}
                    className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors"
                    style={{
                      background: compareIds.has(a.id) ? "hsl(var(--primary))" : "hsl(var(--muted))",
                      color: compareIds.has(a.id) ? "white" : "hsl(var(--foreground))",
                      border: `1px solid ${compareIds.has(a.id) ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                    }}
                  >
                    {a.title.length > 25 ? a.title.slice(0, 25) + "…" : a.title}
                  </button>
                ))}
              </div>

              {compareList.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Metric</th>
                        {compareList.map((a) => (
                          <th key={a.id} className="text-left py-2 px-3 font-semibold text-foreground">{a.title.slice(0, 20)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Revival Score", key: "avg_revival_score" },
                        { label: "Category", key: "category" },
                        { label: "Type", key: "analysis_type" },
                        { label: "Created", key: "created_at" },
                      ].map((row) => (
                        <tr key={row.key} className="border-b border-border/50">
                          <td className="py-2 pr-3 font-medium text-muted-foreground">{row.label}</td>
                          {compareList.map((a) => (
                            <td key={a.id} className="py-2 px-3 text-foreground">
                              {row.key === "created_at"
                                ? format(parseISO(a.created_at), "MMM d, yyyy")
                                : row.key === "avg_revival_score"
                                  ? <span className="font-bold" style={{ color: (a.avg_revival_score || 0) >= 7.5 ? "hsl(var(--score-high))" : "hsl(var(--foreground))" }}>{a.avg_revival_score}/10</span>
                                  : (a as any)[row.key] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* All projects list */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">All Projects</p>
              <div className="space-y-2">
                {analyses.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => analysis.handleLoadSaved(a as any)}
                    className="w-full text-left p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors flex items-center gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground">{a.category} · {format(parseISO(a.created_at), "MMM d, yyyy")}</p>
                    </div>
                    {a.avg_revival_score >= 7.5 && <Star size={12} style={{ color: "hsl(var(--score-high))", fill: "hsl(var(--score-high))" }} />}
                    <span className="text-[11px] font-bold" style={{ color: (a.avg_revival_score || 0) >= 7.5 ? "hsl(var(--score-high))" : "hsl(var(--foreground))" }}>
                      {a.avg_revival_score}/10
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
