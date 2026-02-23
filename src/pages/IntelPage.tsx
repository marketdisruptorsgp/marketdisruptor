import { useEffect, useState } from "react";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import {
  Radar, Activity, Loader2, ShieldCheck, TrendingUp, BarChart3,
  ChevronDown, ChevronUp, ExternalLink, Building2, Calendar,
  FileText, Zap,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  BarChart, Bar, Cell,
} from "recharts";

const CATEGORY_COLORS = [
  "hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)",
  "hsl(38 92% 50%)", "hsl(280 65% 60%)", "hsl(190 80% 42%)",
  "hsl(330 65% 55%)", "hsl(200 75% 50%)",
];

export default function IntelPage() {
  const { tier } = useSubscription();
  const [patents, setPatents] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [platformOverview, setPlatformOverview] = useState<any>(null);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPatent, setExpandedPatent] = useState<string | null>(null);
  const [patentFilter, setPatentFilter] = useState<string>("all");
  const [selectedTrend, setSelectedTrend] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);

    const [patentRes, trendRes, intelRes] = await Promise.all([
      supabase.from("patent_filings").select("*").order("filing_date", { ascending: false }),
      supabase.from("trend_signals").select("*").order("scraped_at", { ascending: false }),
      supabase.from("platform_intel").select("*").order("computed_at", { ascending: false }),
    ]);

    if (patentRes.data) setPatents(patentRes.data);
    if (trendRes.data) setTrends(trendRes.data);

    if (intelRes.data) {
      for (const row of intelRes.data) {
        const payload = row.payload as any;
        if (row.metric_type === "overview") setPlatformOverview(payload);
        else if (row.metric_type === "top_categories") setTopCategories(Array.isArray(payload) ? payload : []);
        else if (row.metric_type === "monthly_activity") setMonthlyActivity(Array.isArray(payload) ? payload : []);
      }
      if (intelRes.data.length > 0) setLastUpdated(intelRes.data[0].computed_at);
    }

    // Also check patent/trend timestamps
    if (patentRes.data?.[0]?.scraped_at) {
      const patentTime = patentRes.data[0].scraped_at;
      if (!lastUpdated || patentTime > lastUpdated) setLastUpdated(patentTime);
    }

    setLoading(false);
  }

  const patentCategories = [...new Set(patents.map(p => p.category))];
  const filteredPatents = patentFilter === "all" ? patents : patents.filter(p => p.category === patentFilter);

  // Patent category stats
  const patentCategoryStats = patentCategories.map(cat => ({
    category: cat,
    count: patents.filter(p => p.category === cat).length,
    topAssignees: [...new Set(patents.filter(p => p.category === cat).map(p => p.assignee).filter(Boolean))].slice(0, 3),
  }));

  // Trend chart data
  const activeTrend = trends[selectedTrend];
  const trendChartData = activeTrend?.interest_over_time?.map((point: any) => ({
    month: point.month || point.label || "",
    value: point.value ?? 0,
  })) || [];

  const hasData = patents.length > 0 || trends.length > 0 || platformOverview;

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
            Real market signals from verified sources — patent filings from Google Patents, search trend data from Google Trends, and usage analytics from our platform. No assumptions.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity size={12} className="text-primary" />
              <span className="font-semibold">Scraped from real sources daily</span>
            </div>
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground">
                Last refresh: {new Date(lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
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
              Real patent filings scraped from Google Patents. Click any patent to see full details.
            </p>
            <p className="text-[10px] text-muted-foreground mb-6 flex items-center gap-1">
              <FileText size={10} /> Source: Google Patents / USPTO · {patents.length} filings tracked
            </p>

            {/* Category overview bar */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {patentCategoryStats.map((stat, i) => (
                <button
                  key={stat.category}
                  onClick={() => setPatentFilter(patentFilter === stat.category ? "all" : stat.category)}
                  className={`text-left border rounded-lg p-4 transition-all ${
                    patentFilter === stat.category
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.category}</span>
                    <span className="text-lg font-bold text-foreground">{stat.count}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">filings tracked</p>
                  {stat.topAssignees.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {stat.topAssignees.map(a => (
                        <span key={a} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{a}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Patent list with drilldown */}
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
                          <ShieldCheck size={14} className="text-primary" />
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
                                View on Google Patents <ExternalLink size={10} />
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
              Real search interest data scraped from Google Trends. Select a keyword to see its trajectory.
            </p>
            <p className="text-[10px] text-muted-foreground mb-6 flex items-center gap-1">
              <FileText size={10} /> Source: Google Trends · {trends.length} keywords tracked
            </p>

            {/* Trend keyword selector */}
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

            {/* Trend chart */}
            {trendChartData.length > 0 ? (
              <div className="border border-border rounded-xl bg-card shadow-sm p-4 sm:p-6 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{activeTrend?.keyword}</p>
                    <p className="text-[10px] text-muted-foreground">{activeTrend?.category} · Google Trends interest over time (0-100)</p>
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

            {/* Related queries */}
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
              <FileText size={10} /> Source: Platform database · {platformOverview.totalAnalyses} analyses
            </p>

            {/* Overview metrics */}
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

            {/* Top categories bar chart */}
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

        {/* No data yet message when all sections empty */}
        {patents.length === 0 && trends.length === 0 && !platformOverview && (
          <div className="text-center py-12">
            <Zap size={20} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Data pipelines are initializing. Real market intelligence will appear here after the first daily scrape completes.</p>
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
