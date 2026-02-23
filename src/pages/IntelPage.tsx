import { useEffect, useState } from "react";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import {
  Radar, Activity, Loader2, ShieldCheck, TrendingUp, BarChart3,
  ChevronDown, ChevronUp, ExternalLink, Building2, Calendar,
  FileText, Zap, Clock, Lightbulb, Star,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  BarChart, Bar, Cell,
} from "recharts";
import { PatentTreemap } from "@/components/intel/PatentTreemap";
import { AboutDataPanel } from "@/components/intel/AboutDataPanel";
import { MarketNewsSection } from "@/components/intel/MarketNewsSection";

const CATEGORY_COLORS = [
  "hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)",
  "hsl(38 92% 50%)", "hsl(280 65% 60%)", "hsl(190 80% 42%)",
  "hsl(330 65% 55%)", "hsl(200 75% 50%)",
];

export default function IntelPage() {
  const { tier } = useSubscription();
  const [patents, setPatents] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [platformOverview, setPlatformOverview] = useState<any>(null);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPatent, setExpandedPatent] = useState<string | null>(null);
  const [patentFilter, setPatentFilter] = useState<string>("all");
  const [patentTab, setPatentTab] = useState<"active" | "expired">("active");
  const [selectedTrend, setSelectedTrend] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [topFlippedIdeas, setTopFlippedIdeas] = useState<any[]>([]);
  const [notableScores, setNotableScores] = useState<any[]>([]);

  useEffect(() => { fetchAllData(); }, []);

  async function fetchAllData() {
    setLoading(true);
    const [patentRes, trendRes, intelRes, newsRes] = await Promise.all([
      supabase.from("patent_filings").select("*").order("filing_date", { ascending: false }),
      supabase.from("trend_signals").select("*").order("scraped_at", { ascending: false }),
      supabase.from("platform_intel").select("*").order("computed_at", { ascending: false }),
      supabase.from("market_news").select("*").order("scraped_at", { ascending: false }),
    ]);

    if (patentRes.data) setPatents(patentRes.data);
    if (trendRes.data) setTrends(trendRes.data);
    if (newsRes.data) setNews(newsRes.data);

    if (intelRes.data) {
      for (const row of intelRes.data) {
        const payload = row.payload as any;
        if (row.metric_type === "overview") setPlatformOverview(payload);
        else if (row.metric_type === "top_categories") setTopCategories(Array.isArray(payload) ? payload : []);
        else if (row.metric_type === "top_flipped_ideas") setTopFlippedIdeas(Array.isArray(payload) ? payload : []);
        else if (row.metric_type === "notable_scores") setNotableScores(Array.isArray(payload) ? payload : []);
      }
      if (intelRes.data.length > 0) setLastUpdated(intelRes.data[0].computed_at);
    }

    if (patentRes.data?.[0]?.scraped_at) {
      const patentTime = patentRes.data[0].scraped_at;
      if (!lastUpdated || patentTime > lastUpdated) setLastUpdated(patentTime);
    }

    setLoading(false);
  }

  const patentCategories = [...new Set(patents.map(p => p.category))];
  const activePatents = patents.filter(p => (p.status || "active") === "active");
  const expiredPatents = patents.filter(p => p.status === "expired");
  const displayPatents = patentTab === "active" ? activePatents : expiredPatents;
  const filteredPatents = patentFilter === "all" ? displayPatents : displayPatents.filter(p => p.category === patentFilter);

  const patentCategoryStats = patentCategories.map(cat => ({
    category: cat,
    count: activePatents.filter(p => p.category === cat).length,
    topAssignees: [...new Set(activePatents.filter(p => p.category === cat).map(p => p.assignee).filter(Boolean))].slice(0, 3),
  }));

  const activeTrend = trends[selectedTrend];
  const trendChartData = activeTrend?.interest_over_time?.map((point: any) => ({
    month: point.month || point.label || "",
    value: point.value ?? 0,
  })) || [];

  const hasData = patents.length > 0 || trends.length > 0 || platformOverview || news.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
              <Radar size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Market Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-3">
            Intel Dashboard
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            Real market signals from verified sources — patent filings from public databases, search trend data, industry news, and platform usage analytics. No assumptions.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity size={12} className="text-primary" />
              <span className="font-semibold">Refreshed daily from real sources</span>
            </div>
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground">
                Last refresh: {new Date(lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>

          {/* About this data panel */}
          <div className="mt-6">
            <AboutDataPanel patentCount={patents.length} lastUpdated={lastUpdated} />
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={24} className="text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading market intelligence...</p>
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Radar size={24} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No intel data available yet. Data pipelines run daily — check back soon.</p>
          </div>
        ) : (<>

        {/* ── Patent Intelligence ── */}
        {patents.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">Patent Intelligence</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-2 max-w-2xl">
              Real patent filings from public patent databases. Click any category in the treemap to filter, or expand a patent for full details.
            </p>
            <p className="text-[10px] text-muted-foreground mb-6 flex items-center gap-1">
              <FileText size={10} /> {patents.length} filings tracked across {patentCategories.length} categories · Last 2-3 years
            </p>

            {/* Interactive treemap */}
            <div className="mb-6">
              <PatentTreemap
                stats={patentCategoryStats}
                onCategoryClick={(cat) => setPatentFilter(patentFilter === cat ? "all" : cat)}
              />
            </div>

            {/* Active / Expired tabs — only show expired tab if expired patents exist */}
            <div className="flex items-center gap-1 mb-4">
              <button
                onClick={() => { setPatentTab("active"); setPatentFilter("all"); }}
                className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${
                  patentTab === "active"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                <ShieldCheck size={12} /> Active ({activePatents.length})
              </button>
              {expiredPatents.length > 0 && (
                <button
                  onClick={() => { setPatentTab("expired"); setPatentFilter("all"); }}
                  className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${
                    patentTab === "expired"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Clock size={12} /> Expired ({expiredPatents.length})
                </button>
              )}
            </div>

            {/* Category filter chips */}
            {patentFilter !== "all" && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] text-muted-foreground">Filtered:</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {patentFilter}
                </span>
                <button onClick={() => setPatentFilter("all")} className="text-[10px] text-muted-foreground hover:text-foreground underline">
                  Clear
                </button>
              </div>
            )}

            {/* Patent list */}
            {filteredPatents.length > 0 ? (
              <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
                <div className="divide-y divide-border">
                  {filteredPatents.slice(0, 20).map((patent) => {
                    const isExpanded = expandedPatent === patent.id;
                    return (
                      <div key={patent.id}>
                        <button
                          onClick={() => setExpandedPatent(isExpanded ? null : patent.id)}
                          className="w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-start gap-3"
                        >
                          <div className="flex-shrink-0 mt-1">
                            {patentTab === "expired" ? (
                              <Clock size={14} className="text-muted-foreground" />
                            ) : (
                              <ShieldCheck size={14} className="text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground leading-snug">{patent.title}</p>
                              {isExpanded ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" /> : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {patent.assignee && (
                                <span className="text-[10px] font-medium text-primary flex items-center gap-1">
                                  <Building2 size={9} /> {patent.assignee}
                                </span>
                              )}
                              {patent.filing_date && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Calendar size={9} /> {patent.filing_date}
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{patent.category}</span>
                              {patent.status === "expired" && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">Expired</span>
                              )}
                            </div>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 pl-11 space-y-3 border-t border-border bg-muted/30">
                            <div className="pt-3">
                              {patent.patent_number && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  <span className="font-semibold text-foreground">Patent #:</span> {patent.patent_number}
                                </p>
                              )}
                              {patent.abstract && (
                                <p className="text-xs text-muted-foreground leading-relaxed mt-2">{patent.abstract}</p>
                              )}
                              {patent.source_url && (
                                <a
                                  href={patent.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-3"
                                >
                                  View Full Patent <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {filteredPatents.length > 20 && (
                  <div className="p-3 text-center border-t border-border">
                    <p className="text-xs text-muted-foreground">Showing 20 of {filteredPatents.length} patents</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-border rounded-xl bg-card shadow-sm p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {patentTab === "expired" ? "No expired patents tracked yet." : "No patents match this filter."}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── Search Trend Signals ── */}
        {trends.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">Search Trend Signals</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-2 max-w-2xl">
              Real search interest data showing relative volume over the trailing 12 months. Select a keyword to see its trajectory.
            </p>
            <p className="text-[10px] text-muted-foreground mb-6 flex items-center gap-1">
              <FileText size={10} /> {trends.length} keywords tracked · Interest scale 0–100
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {trends.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrend(i)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                    selectedTrend === i
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {t.keyword}
                </button>
              ))}
            </div>

            {trendChartData.length > 0 ? (
              <div className="border border-border rounded-xl bg-card shadow-sm p-4 sm:p-6 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{activeTrend?.keyword}</p>
                    <p className="text-[10px] text-muted-foreground">{activeTrend?.category} · Relative search interest over time (0-100)</p>
                  </div>
                </div>
                <div className="h-[240px] sm:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                      <RechartsTooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-xl bg-card shadow-sm p-6 text-center">
                <p className="text-sm text-muted-foreground">No trend line data available for this keyword yet.</p>
              </div>
            )}

            {activeTrend?.related_queries?.length > 0 && (
              <div className="border border-border rounded-lg p-4 bg-card">
                <p className="text-xs font-semibold text-foreground mb-2">Related Search Queries</p>
                <div className="flex flex-wrap gap-1.5">
                  {(activeTrend.related_queries as string[]).map((q: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground">{q}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Market News ── */}
        <MarketNewsSection news={news} />

        {/* ── Platform Analytics ── */}
        {platformOverview && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">Platform Analytics</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-2 max-w-2xl">
              Real usage data from analyses run on this platform. All metrics derived from actual user activity.
            </p>
            <p className="text-[10px] text-muted-foreground mb-6 flex items-center gap-1">
              <FileText size={10} /> {platformOverview.totalAnalyses} analyses
            </p>

            <div className="grid gap-3 sm:grid-cols-3 mb-6">
              <div className="border border-border rounded-lg p-4 bg-card">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Analyses</p>
                <p className="text-2xl font-bold text-foreground">{platformOverview.totalAnalyses}</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Avg Revival Score</p>
                <p className="text-2xl font-bold text-foreground">{platformOverview.avgScore}</p>
              </div>
              <div className="border border-border rounded-lg p-4 bg-card">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Analysis Types</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Object.entries(platformOverview.typeBreakdown || {}).map(([type, count]) => (
                    <span key={type} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                      {type}: {count as number}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {topCategories.length > 0 && (
              <div className="border border-border rounded-xl bg-card shadow-sm p-4 sm:p-6">
                <p className="text-sm font-bold text-foreground mb-4">Most Analyzed Categories</p>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCategories} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={120} />
                      <RechartsTooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                        formatter={(value: number) => [`${value} analyses`, "Count"]}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {topCategories.map((_, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Top Flipped Ideas ── */}
        {topFlippedIdeas.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb size={16} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">Top Flipped Ideas</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
              Interesting product revival concepts generated from analyses run on the platform.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {topFlippedIdeas.map((idea, i) => (
                <div key={i} className="border border-border rounded-lg p-4 bg-card hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={12} className="text-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{idea.category}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">{idea.title}</p>
                  {idea.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{idea.description}</p>
                  )}
                  {idea.analysisTitle && (
                    <p className="text-[10px] text-muted-foreground mt-2">From: {idea.analysisTitle}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Notable Revival Scores ── */}
        {notableScores.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-1">
              <Star size={16} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">Notable Revival Scores</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
              Analyses with exceptionally high or low revival potential — the standout results from platform activity.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {notableScores.map((s, i) => (
                <div key={i} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.category}</span>
                    <span className={`text-lg font-bold ${s.score >= 80 ? "text-primary" : "text-destructive"}`}>
                      {s.score}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{s.title}</p>
                  <span className={`text-[10px] mt-1 inline-block px-2 py-0.5 rounded-full font-semibold ${
                    s.score >= 80
                      ? "bg-primary/10 text-primary"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {s.score >= 80 ? "High Potential" : "Low Potential"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {patents.length === 0 && trends.length === 0 && !platformOverview && news.length === 0 && (
          <div className="text-center py-12">
            <Zap size={20} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Data pipelines are initializing. Real market intelligence will appear here after the first daily refresh completes.</p>
          </div>
        )}

        </>)}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 border-t border-border text-center">
        <p className="text-xs">
          <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:opacity-80 transition-opacity">
            Built by SGP Capital
          </a>
          <span className="text-muted-foreground"> · </span>
          <a href="mailto:steven@sgpcapital.com" className="text-muted-foreground hover:underline">steven@sgpcapital.com</a>
        </p>
      </footer>
    </div>
  );
}
