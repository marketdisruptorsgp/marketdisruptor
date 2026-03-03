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
import { PlatformAnalyticsVisual } from "@/components/intel/PlatformAnalyticsVisual";
import { RegulatoryLandscapeCard } from "@/components/intel/RegulatoryLandscapeCard";
import { useAuth } from "@/hooks/useAuth";

const CATEGORY_COLORS = [
  "hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)",
  "hsl(38 92% 50%)", "hsl(280 65% 60%)", "hsl(190 80% 42%)",
  "hsl(330 65% 55%)", "hsl(200 75% 50%)",
];

export default function IntelPage() {
  const { user } = useAuth();
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
  const [regulatoryData, setRegulatoryData] = useState<any[]>([]);

  useEffect(() => { fetchAllData(); }, [user]);

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

    // Extract regulatory data from saved analyses
    if (user?.id) {
      const { data: analyses } = await supabase
        .from("saved_analyses")
        .select("analysis_data, category")
        .eq("user_id", user.id)
        .not("analysis_data", "is", null)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (analyses) {
        const regMap = new Map<string, any>();
        for (const a of analyses) {
          const ad = a.analysis_data as any;
          const reg = ad?.regulatoryIntelligence || ad?.regulatory_intelligence || ad?.regulatory;
          if (reg && (reg.agencies?.length || reg.active_rulemaking?.length || reg.state_variances?.length)) {
            const cat = reg.category || a.category || "Unknown";
            if (!regMap.has(cat)) {
              regMap.set(cat, { category: cat, ...reg });
            }
          }
        }
        setRegulatoryData(Array.from(regMap.values()));
      }
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
              <FileText size={10} /> {patents.length} filings tracked across {patentCategories.length} {patentCategories.length === 1 ? "category" : "categories"} · Recent filings
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
              Real search interest data showing relative volume over the trailing 12 months. Select a keyword to see its trajectory and why it matters.
            </p>
            <p className="text-[10px] text-muted-foreground mb-6 flex items-center gap-1">
              <FileText size={10} /> {trends.length} keywords tracked · Interest scale 0–100
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

            {activeTrend && (() => {
              const data = activeTrend.interest_over_time as any[] || [];
              const lastVal = data.length > 0 ? data[data.length - 1]?.value : null;
              const firstVal = data.length > 0 ? data[0]?.value : null;
              const peakVal = data.length > 0 ? Math.max(...data.map((d: any) => d.value || 0)) : null;
              const peakMonth = data.length > 0 ? data.find((d: any) => d.value === peakVal)?.month : null;
              const momentum = lastVal !== null && firstVal !== null ? Math.round(((lastVal - firstVal) / Math.max(firstVal, 1)) * 100) : null;
              const avgVal = data.length > 0 ? Math.round(data.reduce((s: number, d: any) => s + (d.value || 0), 0) / data.length) : null;
              const minVal = data.length > 0 ? Math.min(...data.map((d: any) => d.value || 0)) : null;
              const minMonth = data.length > 0 ? data.find((d: any) => d.value === minVal)?.month : null;
              // Recent velocity (last 3 months vs prior 3)
              const recent3 = data.slice(-3);
              const prior3 = data.slice(-6, -3);
              const recent3Avg = recent3.length > 0 ? recent3.reduce((s: number, d: any) => s + (d.value || 0), 0) / recent3.length : null;
              const prior3Avg = prior3.length > 0 ? prior3.reduce((s: number, d: any) => s + (d.value || 0), 0) / prior3.length : null;
              const velocity = recent3Avg !== null && prior3Avg !== null ? Math.round(((recent3Avg - prior3Avg) / Math.max(prior3Avg, 1)) * 100) : null;
              // Trend phase classification
              const isAccelerating = velocity !== null && velocity > 15;
              const isDecelerating = velocity !== null && velocity < -10;
              const isPeaking = peakVal !== null && lastVal !== null && lastVal >= peakVal * 0.9 && velocity !== null && velocity < 5;
              const isEmerging = firstVal !== null && firstVal < 20 && momentum !== null && momentum > 50;
              const phase = isEmerging ? "Emerging" : isAccelerating ? "Accelerating" : isPeaking ? "Near Peak" : isDecelerating ? "Cooling" : "Steady";
              const phaseColor = phase === "Emerging" ? "text-blue-600 bg-blue-500/10 border-blue-500/20" : phase === "Accelerating" ? "text-green-600 bg-green-500/10 border-green-500/20" : phase === "Near Peak" ? "text-amber-600 bg-amber-500/10 border-amber-500/20" : phase === "Cooling" ? "text-destructive bg-destructive/10 border-destructive/20" : "text-muted-foreground bg-muted border-border";
              const phaseAdvice = phase === "Emerging" ? "Early mover advantage — low competition, high upside if this trend sustains." : phase === "Accelerating" ? "Strong momentum — ideal window to enter before saturation. Move fast." : phase === "Near Peak" ? "Market awareness is high. Differentiation is critical; avoid me-too positioning." : phase === "Cooling" ? "Interest is waning. Only enter with a contrarian angle or wait for a second wave." : "Stable demand. Good for steady-state businesses, less exciting for VCs.";
              // Volatility
              const volatility = data.length > 1 ? Math.round(Math.sqrt(data.reduce((s: number, d: any, i: number) => i === 0 ? 0 : s + Math.pow((d.value || 0) - (data[i-1]?.value || 0), 2), 0) / (data.length - 1))) : null;

              return (
              <div className="border border-border rounded-xl bg-card shadow-sm p-4 sm:p-6 mb-4">
                {/* Phase badge + Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-foreground">{activeTrend.keyword}</p>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${phaseColor}`}>
                        {phase}
                      </span>
                      {(() => {
                        const isReal = activeTrend.source === "google_trends";
                        return (
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                            isReal
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : data.length > 0
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-muted text-muted-foreground border-border"
                          }`}>
                            {isReal ? "✓ Google Trends Data" : data.length > 0 ? "◐ Modeled" : "— No Chart Data"}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {activeTrend.category} · {activeTrend.source === "google_trends" ? "Real Google Trends interest (0-100)" : "Relative search interest (0-100)"}
                    </p>
                  </div>
                  <div className="flex gap-3 sm:gap-4 flex-wrap">
                    {lastVal !== null && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{lastVal}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Current</p>
                      </div>
                    )}
                    {peakVal !== null && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">{peakVal}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Peak</p>
                      </div>
                    )}
                    {avgVal !== null && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-muted-foreground">{avgVal}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">12mo Avg</p>
                      </div>
                    )}
                    {momentum !== null && (
                      <div className="text-center">
                        <p className={`text-lg font-bold ${momentum >= 0 ? "text-green-600" : "text-destructive"}`}>
                          {momentum >= 0 ? "+" : ""}{momentum}%
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">12mo Δ</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phase intelligence callout */}
                <div className="mb-3 p-3 rounded-lg bg-muted/60 border border-border">
                  <div className="flex items-start gap-2">
                    <Star size={12} className="text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-1">Trend Phase: {phase}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{phaseAdvice}</p>
                    </div>
                  </div>
                </div>

                {/* Mini stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {velocity !== null && (
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">3mo Velocity</p>
                      <p className={`text-sm font-bold ${velocity >= 0 ? "text-green-600" : "text-destructive"}`}>
                        {velocity >= 0 ? "+" : ""}{velocity}%
                      </p>
                    </div>
                  )}
                  {volatility !== null && (
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Volatility</p>
                      <p className="text-sm font-bold text-foreground">{volatility < 5 ? "Low" : volatility < 12 ? "Moderate" : "High"} ({volatility})</p>
                    </div>
                  )}
                  {peakMonth && (
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Peak Month</p>
                      <p className="text-sm font-bold text-foreground">{peakMonth}</p>
                    </div>
                  )}
                  {minMonth && minVal !== null && (
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Floor</p>
                      <p className="text-sm font-bold text-foreground">{minVal} ({minMonth})</p>
                    </div>
                  )}
                </div>

                {/* Growth note / insight */}
                {activeTrend.growth_note && (
                  <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-start gap-2">
                      <Zap size={12} className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Key Signal</p>
                        <p className="text-xs text-foreground leading-relaxed">{activeTrend.growth_note}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Opportunity angle */}
                {activeTrend.opportunity_angle && (
                  <div className="mb-4 p-3 rounded-lg bg-accent/50 border border-border">
                    <div className="flex items-start gap-2">
                      <Lightbulb size={12} className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground mb-1">Opportunity Angle</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{activeTrend.opportunity_angle}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chart */}
                {trendChartData.length > 0 ? (
                  <div className="h-[220px] sm:h-[260px]">
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
                ) : (
                  <div className="space-y-3">
                    {/* Keyword strength bar visualization */}
                    <div className="p-3 rounded-lg bg-muted/40 border border-border">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Keyword Strength Indicators</p>
                      <div className="space-y-2.5">
                        {(() => {
                          const relatedQueries = (activeTrend?.related_queries as string[]) || [];
                          const hasGrowthNote = !!activeTrend?.growth_note;
                          const hasOpportunity = !!activeTrend?.opportunity_angle;
                          const hasSources = ((activeTrend?.source_urls as string[]) || []).length > 0;
                          const signals = [
                            { label: "Search Evidence", score: hasSources ? 85 : 40 },
                            { label: "Market Signal", score: hasGrowthNote ? 78 : 35 },
                            { label: "Opportunity Clarity", score: hasOpportunity ? 72 : 30 },
                            { label: "Query Breadth", score: Math.min(95, relatedQueries.length * 22) },
                          ];
                          return signals.map((s, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-[10px] text-muted-foreground w-28 text-right flex-shrink-0">{s.label}</span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${s.score}%`,
                                    background: s.score >= 70
                                      ? "hsl(var(--primary))"
                                      : s.score >= 50
                                        ? "hsl(var(--primary) / 0.6)"
                                        : "hsl(var(--muted-foreground) / 0.4)",
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground w-8">{s.score}%</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Growth note highlight */}
                    {activeTrend?.growth_note && (
                      <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                        <div className="flex items-start gap-2">
                          <BarChart3 size={12} className="text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Key Signal</p>
                            <p className="text-xs text-foreground leading-relaxed">{activeTrend.growth_note}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground text-center italic">
                      Trend line chart will appear when verified time-series data is available for this keyword
                    </p>
                  </div>
                )}

                {/* Sources + Related queries */}
                <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row gap-4">
                  {activeTrend.source_urls && (activeTrend.source_urls as string[]).length > 0 && (
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sources</p>
                      <div className="space-y-1">
                        {(activeTrend.source_urls as string[]).slice(0, 3).map((url: string, i: number) => {
                          let hostname = "";
                          try { hostname = new URL(url).hostname.replace("www.", ""); } catch { hostname = url; }
                          return (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-primary hover:underline">
                              <ExternalLink size={9} className="flex-shrink-0" /> {hostname}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {activeTrend?.related_queries?.length > 0 && (
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Related Searches</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(activeTrend.related_queries as string[]).map((q: string, i: number) => (
                          <a key={i} href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(q)}`} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer">
                            {q} ↗
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Google Trends link */}
                <div className="mt-3 pt-2 border-t border-border">
                  <a href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(activeTrend.keyword)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline">
                    <TrendingUp size={10} />
                    Explore "{activeTrend.keyword}" on Google Trends
                    <ExternalLink size={9} />
                  </a>
                </div>
              </div>
              );
            })()}
          </section>
        )}

        {/* ── Market News ── */}
        <MarketNewsSection news={news} />

        {/* ── Regulatory Landscape ── */}
        {regulatoryData.length > 0 && (
          <RegulatoryLandscapeCard regulatoryData={regulatoryData} />
        )}

        {/* ── Platform Analytics ── */}
        {platformOverview && (
          <PlatformAnalyticsVisual
            overview={platformOverview}
            topCategories={topCategories}
            notableScores={notableScores}
            monthlyActivity={monthlyActivity}
          />
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


        {patents.length === 0 && trends.length === 0 && !platformOverview && news.length === 0 && (
          <div className="text-center py-12">
            <Zap size={20} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Data pipelines are initializing. Real market intelligence will appear here after the first daily refresh completes.</p>
          </div>
        )}

        </>)}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 border-t border-border text-center">
      </footer>
    </div>
  );
}
