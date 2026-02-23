import { useEffect, useState } from "react";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, Zap, AlertTriangle, Flame, Eye, ShieldCheck, TrendingDown,
  Radar, Activity, Grid3X3, BarChart3, Loader2,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RechartsRadar,
  Legend,
} from "recharts";

const SIGNAL_ICONS: Record<string, any> = {
  patent: ShieldCheck, supply_chain: AlertTriangle, viral: Flame,
  price: TrendingDown, community: Eye, regulation: ShieldCheck,
};
const SEVERITY_STYLES = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
};

const RADAR_COLORS = [
  "hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)",
  "hsl(38 92% 50%)", "hsl(280 65% 60%)", "hsl(190 80% 42%)",
];

function getHeatColor(value: number): string {
  if (value >= 85) return "bg-primary text-primary-foreground";
  if (value >= 70) return "bg-primary/70 text-primary-foreground";
  if (value >= 55) return "bg-primary/40 text-foreground";
  if (value >= 40) return "bg-primary/20 text-foreground";
  return "bg-primary/10 text-muted-foreground";
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function IntelPage() {
  const { tier } = useSubscription();
  const [trends, setTrends] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [heatMap, setHeatMap] = useState<any>({ rows: [] });
  const [radarData, setRadarData] = useState<any>({ categories: [], dimensions: [], data: [] });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrend, setSelectedTrend] = useState(0);
  const [selectedRadarCategories, setSelectedRadarCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchIntelData();
  }, []);

  async function fetchIntelData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("market_intel")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(10);

    if (!error && data && data.length > 0) {
      for (const row of data) {
        const payload = row.payload as any;
        if (row.data_type === "trend_spotlights" && Array.isArray(payload) && payload.length > 0) {
          setTrends(payload);
        } else if (row.data_type === "disruption_signals" && Array.isArray(payload) && payload.length > 0) {
          setSignals(payload);
        } else if (row.data_type === "heat_map" && payload?.rows) {
          setHeatMap(payload);
        } else if (row.data_type === "radar_data" && payload?.data) {
          setRadarData(payload);
          setSelectedRadarCategories(payload.categories?.slice(0, 2) || []);
        }
      }
      setLastUpdated(data[0]?.generated_at || null);
    }
    setLoading(false);
  }

  const trendChartData = MONTHS.map((m, i) => {
    const point: any = { month: m };
    trends.forEach((t) => {
      point[t.name] = t.trend_data?.[i] ?? 0;
    });
    return point;
  });

  const radarChartData = radarData.dimensions?.map((dim: string) => {
    const point: any = { dimension: dim };
    radarData.data?.forEach((cat: any) => {
      point[cat.category] = cat[dim] ?? 0;
    });
    return point;
  }) || [];

  const toggleRadarCategory = (cat: string) => {
    setSelectedRadarCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const heatDimensions = ["demand", "competition", "supply", "growth", "opportunity"];

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
            AI-generated market signals updated daily — trend trajectories, disruption alerts, category comparisons, and opportunity heat maps.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Activity size={12} className="text-primary" />
              <span className="font-semibold">Auto-updated daily</span>
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
        ) : trends.length === 0 && signals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Radar size={24} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No intel data available yet. Data generates daily.</p>
          </div>
        ) : (<>

        {/* ── Trend Spotlights with Line Chart ── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Trend Trajectories</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            12-month growth curves for categories with accelerating momentum.
          </p>

          {/* Chart */}
          <div className="border border-border rounded-xl bg-card shadow-sm p-4 sm:p-6 mb-4">
            <div className="h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <RechartsTooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  {trends.map((t, i) => (
                    <Line
                      key={t.name}
                      type="monotone"
                      dataKey={t.name}
                      stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                      strokeWidth={selectedTrend === i ? 3 : 1.5}
                      opacity={selectedTrend === i ? 1 : 0.3}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trends.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedTrend(i)}
                className={`text-left border rounded-lg p-4 transition-all ${
                  selectedTrend === i
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.category}</span>
                  <span className="text-xs font-bold text-primary">{t.momentum}</span>
                </div>
                <p className="text-sm font-bold text-foreground mb-1">{t.name}</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(t.score / 10) * 100}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-foreground">{t.score}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{t.insight}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Disruption Opportunity Heat Map ── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Grid3X3 size={16} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Opportunity Heat Map</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            Category-by-dimension intensity matrix — darker cells indicate stronger signals.
          </p>

          <div className="border border-border rounded-xl bg-card shadow-sm overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider p-3 sm:p-4 w-[180px]">Category</th>
                  {heatDimensions.map((d) => (
                    <th key={d} className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider p-3 sm:p-4">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatMap.rows?.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="text-sm font-semibold text-foreground p-3 sm:p-4">{row.category}</td>
                    {heatDimensions.map((d) => (
                      <td key={d} className="p-2 sm:p-3 text-center">
                        <div className={`mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center text-xs font-bold ${getHeatColor(row[d] ?? 0)}`}>
                          {row[d]}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Category Radar Comparison ── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={16} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Category Radar Comparison</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
            Select categories to compare across six strategic dimensions.
          </p>

          {/* Category toggles */}
          <div className="flex flex-wrap gap-2 mb-6">
            {radarData.categories?.map((cat: string, i: number) => (
              <button
                key={cat}
                onClick={() => toggleRadarCategory(cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  selectedRadarCategories.includes(cat)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="border border-border rounded-xl bg-card shadow-sm p-4 sm:p-6">
            <div className="h-[340px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarChartData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  {radarData.categories?.map((cat: string, i: number) =>
                    selectedRadarCategories.includes(cat) ? (
                      <RechartsRadar
                        key={cat}
                        name={cat}
                        dataKey={cat}
                        stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                        fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ) : null
                  )}
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* ── Live Disruption Signal Feed ── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Disruption Signal Feed</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            Market shifts, patent surges, supply chain changes, and viral signals creating windows of opportunity.
          </p>

          <div className="space-y-3">
            {signals.map((s: any, i: number) => {
              const Icon = SIGNAL_ICONS[s.category] || Zap;
              const severity = (s.severity || "low") as keyof typeof SEVERITY_STYLES;
              return (
                <div key={i} className="flex items-start gap-3 border border-border rounded-lg p-4 bg-card shadow-sm">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${SEVERITY_STYLES[severity]}`}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">{s.label}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[severity]}`}>
                        {severity}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{s.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
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
