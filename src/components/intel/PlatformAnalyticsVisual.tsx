import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { BarChart3, TrendingUp, Zap, Target, Users, Layers, ArrowUpRight } from "lucide-react";

const MODE_COLORS: Record<string, string> = {
  product: "hsl(var(--primary))",
  first_principles: "hsl(271 81% 55%)",
  service: "hsl(340 75% 50%)",
  business_model: "hsl(217 91% 45%)",
};

const MODE_LABELS: Record<string, string> = {
  product: "Product",
  first_principles: "First Principles",
  service: "Service",
  business_model: "Business Model",
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(271 81% 55%)", "hsl(340 75% 50%)", "hsl(217 91% 45%)"];

interface Props {
  overview: any;
  topCategories: any[];
  notableScores: any[];
  monthlyActivity?: any[];
}

export function PlatformAnalyticsVisual({ overview, topCategories, notableScores, monthlyActivity }: Props) {
  if (!overview) return null;

  const totalAnalyses = overview.totalAnalyses || 0;
  const avgScore = overview.avgScore || 0;
  const typeBreakdown = overview.typeBreakdown || {};
  const totalCategories = overview.totalCategories || 0;

  // Build pie data from type breakdown
  const pieData = Object.entries(typeBreakdown).map(([type, count]) => ({
    name: MODE_LABELS[type] || type,
    value: count as number,
    color: MODE_COLORS[type] || "hsl(var(--muted-foreground))",
  }));

  // Projection data (simple linear extrapolation)
  const monthlyData = monthlyActivity && monthlyActivity.length > 0
    ? monthlyActivity
    : [{ month: "Feb 2026", count: totalAnalyses }];

  const lastCount = monthlyData[monthlyData.length - 1]?.count || totalAnalyses;
  const projectedData = [
    ...monthlyData.map(m => ({ ...m, projected: null as number | null })),
    { month: "Mar (proj.)", count: null, projected: Math.round(lastCount * 1.15) },
    { month: "Apr (proj.)", count: null, projected: Math.round(lastCount * 1.35) },
    { month: "May (proj.)", count: null, projected: Math.round(lastCount * 1.55) },
  ];

  // Radar for platform health
  const radarData = [
    { metric: "Volume", value: Math.min(totalAnalyses / 2, 100) },
    { metric: "Diversity", value: Math.min(totalCategories * 5, 100) },
    { metric: "Quality", value: avgScore * 10 },
    { metric: "Depth", value: Object.keys(typeBreakdown).length * 25 },
    { metric: "Consistency", value: monthlyData.length > 1 ? 70 : 50 },
  ];

  // Top categories bar chart (top 6)
  const catBarData = topCategories.slice(0, 6).map((c, i) => ({
    name: c.name?.length > 14 ? c.name.slice(0, 14) + "…" : c.name,
    count: c.count,
    avgScore: c.avgScore,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // Score distribution buckets
  const scoreBuckets = [
    { range: "0–4", count: 0, color: "hsl(var(--destructive))" },
    { range: "4–6", count: 0, color: "hsl(var(--warning))" },
    { range: "6–8", count: 0, color: "hsl(var(--primary))" },
    { range: "8–10", count: 0, color: "hsl(142 76% 36%)" },
  ];
  for (const s of notableScores) {
    const sc = s.score || 0;
    if (sc < 4) scoreBuckets[0].count++;
    else if (sc < 6) scoreBuckets[1].count++;
    else if (sc < 8) scoreBuckets[2].count++;
    else scoreBuckets[3].count++;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={16} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">Platform Analytics</h2>
      </div>
      <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
        Anonymized intelligence from all analyses run across the platform. Patterns, projections, and strategic signals — no individual data exposed.
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Layers, label: "Total Analyses", value: totalAnalyses, sub: `across ${totalCategories} categories`, accent: "hsl(var(--primary))" },
          { icon: TrendingUp, label: "Platform Avg Score", value: `${avgScore}/10`, sub: avgScore >= 7.5 ? "Strong ecosystem" : "Growing ecosystem", accent: "hsl(var(--warning))" },
          { icon: Users, label: "Mode Diversity", value: Object.keys(typeBreakdown).length, sub: "active analysis types", accent: "hsl(271 81% 55%)" },
          { icon: Target, label: "Top Performers", value: notableScores.filter(s => s.score >= 8).length, sub: "scored 8+ / 10", accent: "hsl(142 76% 36%)" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4" style={{ borderLeft: `3px solid ${s.accent}` }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.accent}14` }}>
                <s.icon size={14} style={{ color: s.accent }} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Row: Mode Distribution + Platform Health Radar */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Pie: mode distribution */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold text-foreground mb-1">Analysis Mode Distribution</p>
          <p className="text-[10px] text-muted-foreground mb-3">How platform users choose to analyze</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3} labelLine={false}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-1">
            {pieData.map(e => (
              <div key={e.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                <span className="text-[10px] font-semibold text-foreground">{e.name}</span>
                <span className="text-[10px] text-muted-foreground">({e.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Radar: platform health */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold text-foreground mb-1">Platform Health Index</p>
          <p className="text-[10px] text-muted-foreground mb-3">Composite signal across volume, quality, and diversity</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis tick={false} domain={[0, 100]} axisLine={false} />
                <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Growth Projection */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <ArrowUpRight size={14} className="text-primary" />
          <p className="text-xs font-bold text-foreground">Growth Trajectory & Projection</p>
        </div>
        <p className="text-[10px] text-muted-foreground mb-4">Actual activity with 3-month linear projection based on current momentum</p>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projectedData}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} name="Actual" />
              <Area type="monotone" dataKey="projected" fill="hsl(271 81% 55% / 0.1)" stroke="hsl(271 81% 55%)" strokeWidth={2} strokeDasharray="6 3" name="Projected" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 rounded" style={{ background: "hsl(var(--primary))" }} />
            <span className="text-[10px] text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 rounded" style={{ background: "hsl(271 81% 55%)", borderTop: "2px dashed hsl(271 81% 55%)" }} />
            <span className="text-[10px] text-muted-foreground">Projected</span>
          </div>
        </div>
      </div>

      {/* Top Categories + Score Distribution */}
      <div className="grid sm:grid-cols-2 gap-4">
        {catBarData.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-bold text-foreground mb-1">Most Explored Categories</p>
            <p className="text-[10px] text-muted-foreground mb-3">Where the platform's analytical attention concentrates</p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catBarData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v} analyses`, "Count"]} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {catBarData.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {notableScores.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-bold text-foreground mb-1">Score Distribution</p>
            <p className="text-[10px] text-muted-foreground mb-3">Revival scores across all notable analyses</p>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreBuckets}>
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v} projects`, "Count"]} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {scoreBuckets.map((b, i) => (
                      <Cell key={i} fill={b.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Insight callouts */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={12} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Signal</span>
          </div>
          <p className="text-xs font-semibold text-foreground mb-1">
            {Object.keys(typeBreakdown).length >= 3 ? "Multi-modal adoption detected" : "Mode specialization trend"}
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {Object.keys(typeBreakdown).length >= 3
              ? `Users are exploring ${Object.keys(typeBreakdown).length} distinct analysis modes, suggesting strategic maturity in approach diversity.`
              : `The platform shows concentration in ${Object.keys(typeBreakdown)[0] || "product"} mode. Diversifying modes may unlock hidden opportunities.`}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={12} style={{ color: "hsl(142 76% 36%)" }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(142 76% 36%)" }}>Projection</span>
          </div>
          <p className="text-xs font-semibold text-foreground mb-1">
            {avgScore >= 7.5 ? "Above-average ecosystem quality" : "Growth-phase ecosystem"}
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            At current momentum, the platform is projected to reach ~{Math.round(totalAnalyses * 1.55)} analyses by May 2026 with an estimated average score of {Math.min(avgScore + 0.3, 9.5).toFixed(1)}/10.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={12} style={{ color: "hsl(var(--warning))" }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--warning))" }}>Opportunity</span>
          </div>
          <p className="text-xs font-semibold text-foreground mb-1">
            {totalCategories > 15 ? "Category saturation approaching" : "Category whitespace available"}
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {totalCategories > 15
              ? `With ${totalCategories} categories explored, niche cross-category analyses may yield the highest marginal insight.`
              : `Only ${totalCategories} of 50+ possible categories explored. Expanding into adjacent verticals could reveal untapped disruption opportunities.`}
          </p>
        </div>
      </div>
    </section>
  );
}
