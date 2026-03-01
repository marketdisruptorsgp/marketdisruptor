import { useEffect, useState } from "react";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import {
  Radar, Activity, Loader2, ShieldCheck, TrendingUp, BarChart3,
  ChevronDown, ChevronUp, ExternalLink, Building2, Calendar,
  FileText, Clock, Lightbulb, Star, Database,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  BarChart, Bar, Cell,
} from "recharts";
import { PatentTreemap } from "@/components/intel/PatentTreemap";
import { AboutDataPanel } from "@/components/intel/AboutDataPanel";
import { MarketNewsSection } from "@/components/intel/MarketNewsSection";
import { PlatformAnalyticsVisual } from "@/components/intel/PlatformAnalyticsVisual";

const CATEGORY_COLORS = [
  "hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)",
  "hsl(38 92% 50%)", "hsl(280 65% 60%)", "hsl(190 80% 42%)",
  "hsl(330 65% 55%)", "hsl(200 75% 50%)",
];

const TABS = [
  { id: "signals", label: "Market Signals" },
  { id: "insights", label: "Platform Insights" },
  { id: "radar", label: "Opportunity Radar" },
  { id: "sources", label: "Data Sources" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function IntelligencePage() {
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
  const [monthlyActivity, setMonthlyActivity] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("signals");

  useEffect(() => { fetchAllData(); }, []);

  async function fetchAllData() {
    setLoading(true);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString();

    const [patentRes, trendRes, intelRes, newsRes] = await Promise.all([
      supabase.from("patent_filings").select("*").order("scraped_at", { ascending: false }).limit(50),
      supabase.from("trend_signals").select("*").order("scraped_at", { ascending: false }),
      supabase.from("platform_intel").select("*").order("computed_at", { ascending: false }),
      supabase.from("market_news").select("*").gte("published_at", cutoff).order("scraped_at", { ascending: false }),
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
        else if (row.metric_type === "monthly_activity") setMonthlyActivity(Array.isArray(payload) ? payload : []);
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

      {/* Intelligence Overview */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
              <Radar size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Intelligence Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight mb-2">
            Intelligence
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Real market signals from verified sources — patent filings, search trend data, industry news, and platform usage analytics.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4">
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
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "text-foreground border-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={24} className="text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading intelligence data...</p>
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Radar size={24} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No intelligence data available yet. Data pipelines run daily — check back soon.</p>
          </div>
        ) : (
          <>
            {/* Market Signals tab */}
            {activeTab === "signals" && (
              <div className="space-y-10">
                {/* Patent Intelligence */}
                {patents.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck size={16} className="text-primary" />
                      <h2 className="text-lg font-bold text-foreground">Patent Intelligence</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 max-w-2xl">
                      Real patent filings from public databases. Click any category in the treemap to filter.
                    </p>
                    <p className="text-[10px] text-muted-foreground mb-6 flex items-center gap-1">
                      <FileText size={10} /> {patents.length} filings across {patentCategories.length} categories
                    </p>

                    <div className="mb-6">
                      <PatentTreemap
                        stats={patentCategoryStats}
                        onCategoryClick={(cat) => setPatentFilter(patentFilter === cat ? "all" : cat)}
                      />
                    </div>

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
                      </div>
                    ) : (
                      <div className="border border-border rounded-xl bg-card shadow-sm p-6 text-center">
                        <p className="text-sm text-muted-foreground">No patents match this filter.</p>
                      </div>
                    )}
                  </section>
                )}

                {/* Search Trend Signals */}
                {trends.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp size={16} className="text-primary" />
                      <h2 className="text-lg font-bold text-foreground">Search Trend Signals</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                      Real search interest data showing relative volume over the trailing 12 months.
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {trends.map((t, i) => {
                        const data = t.interest_over_time as any[] || [];
                        const lastVal = data.length > 0 ? data[data.length - 1]?.value : null;
                        const firstVal = data.length > 0 ? data[0]?.value : null;
                        const momentum = lastVal && firstVal ? Math.round(((lastVal - firstVal) / Math.max(firstVal, 1)) * 100) : null;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTrend(i)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                              selectedTrend === i
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {t.keyword}
                            {momentum !== null && (
                              <span className={`text-[9px] font-bold ${selectedTrend === i ? "text-primary-foreground/80" : momentum > 0 ? "text-green-600" : "text-destructive"}`}>
                                {momentum > 0 ? "+" : ""}{momentum}%
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {activeTrend && trendChartData.length > 0 && (
                      <div className="rounded-xl border border-border bg-card p-5">
                        <p className="typo-card-title mb-1">{activeTrend.keyword}</p>
                        {activeTrend.growth_note && (
                          <p className="text-xs text-muted-foreground mb-4">{activeTrend.growth_note}</p>
                        )}
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={trendChartData}>
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                            <RechartsTooltip />
                            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </section>
                )}

                {/* Market News */}
                {news.length > 0 && <MarketNewsSection news={news} />}
              </div>
            )}

            {/* Platform Insights tab */}
            {activeTab === "insights" && (
              <div className="space-y-10">
                {platformOverview && (
                  <PlatformAnalyticsVisual
                    overview={platformOverview}
                    topCategories={topCategories}
                    notableScores={notableScores}
                    monthlyActivity={monthlyActivity}
                  />
                )}
                {!platformOverview && (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Database size={24} className="text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Platform insights are computed daily. Check back soon.</p>
                  </div>
                )}
              </div>
            )}

            {/* Opportunity Radar tab */}
            {activeTab === "radar" && (
              <div className="space-y-8">
                {topFlippedIdeas.length > 0 ? (
                  <section>
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb size={16} className="text-primary" />
                      <h2 className="text-lg font-bold text-foreground">Top Disruption Ideas</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
                      The highest-rated flipped concepts generated across all analyses on the platform.
                    </p>
                    <div className="space-y-3">
                      {topFlippedIdeas.map((idea: any, i: number) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 flex-shrink-0">
                            <Star size={14} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="typo-card-title text-foreground">{idea.name || idea.title || `Idea ${i + 1}`}</p>
                            {idea.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{idea.description}</p>}
                          </div>
                          {idea.score && (
                            <span className="text-lg font-bold tabular-nums text-primary flex-shrink-0">{idea.score}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Lightbulb size={24} className="text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No opportunity data available yet. Run analyses to populate the radar.</p>
                  </div>
                )}
              </div>
            )}

            {/* Data Sources tab */}
            {activeTab === "sources" && (
              <div className="space-y-8">
                <AboutDataPanel patentCount={patents.length} lastUpdated={lastUpdated} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
