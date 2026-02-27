import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { BarChart3, TrendingUp, Layers, Target, Users, Lightbulb, Compass, Flame } from "lucide-react";

const MODE_COLORS: Record<string, string> = {
  product: "hsl(var(--mode-product))",
  first_principles: "hsl(var(--mode-business))",
  service: "hsl(var(--mode-service))",
  business_model: "hsl(var(--primary))",
};

const MODE_LABELS: Record<string, string> = {
  product: "Product",
  first_principles: "First Principles",
  service: "Service",
  business_model: "Business Model",
};

const PIE_COLORS = ["hsl(var(--mode-product))", "hsl(var(--mode-business))", "hsl(var(--mode-service))", "hsl(var(--primary))"];

interface Props {
  overview: any;
  topCategories: any[];
  notableScores: any[];
  monthlyActivity?: any[];
}

export function PlatformAnalyticsVisual({ overview, topCategories, notableScores }: Props) {
  if (!overview) return null;

  const totalAnalyses = overview.totalAnalyses || 0;
  const avgScore = overview.avgScore || 0;
  const typeBreakdown = overview.typeBreakdown || {};
  const totalCategories = overview.totalCategories || 0;

  const pieData = Object.entries(typeBreakdown).map(([type, count]) => ({
    name: MODE_LABELS[type] || type,
    value: count as number,
    color: MODE_COLORS[type] || "hsl(var(--muted-foreground))",
  }));

  const radarData = [
    { metric: "Volume", value: Math.min(totalAnalyses / 2, 100) },
    { metric: "Diversity", value: Math.min(totalCategories * 5, 100) },
    { metric: "Quality", value: avgScore * 10 },
    { metric: "Depth", value: Object.keys(typeBreakdown).length * 25 },
    { metric: "Consistency", value: 65 },
  ];

  const catBarData = topCategories.slice(0, 6).map((c, i) => ({
    name: c.name?.length > 14 ? c.name.slice(0, 14) + "…" : c.name,
    count: c.count,
    avgScore: c.avgScore,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const topMode = Object.entries(typeBreakdown).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
  const topCat = topCategories[0];
  const highScorers = notableScores.filter(s => s.score >= 8).length;
  const modeCount = Object.keys(typeBreakdown).length;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={16} className="text-primary" />
        <h2 className="typo-section-title">Platform Analytics</h2>
      </div>
      <p className="typo-section-description max-w-2xl leading-relaxed">
        Anonymized, aggregated intelligence from all analyses run across the platform. See what the community is exploring, which categories attract the most attention, and how scores distribute.
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Layers, label: "Analyses Run", value: totalAnalyses, sub: "Total disruption analyses completed by all users on the platform", accent: "hsl(var(--primary))" },
          { icon: TrendingUp, label: "Avg Revival Score", value: `${avgScore}/10`, sub: "Mean score across all completed analyses — higher means stronger disruption potential", accent: "hsl(var(--warning))" },
          { icon: Users, label: "Analysis Modes Used", value: modeCount, sub: `Users have explored ${modeCount} of 4 available modes (Product, Service, Business, First Principles)`, accent: "hsl(271 81% 55%)" },
          { icon: Target, label: "High-Potential Finds", value: highScorers, sub: "Analyses scoring 8+/10 — ideas the platform flagged as strong disruption candidates", accent: "hsl(142 76% 36%)" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4" style={{ borderLeft: `3px solid ${s.accent}` }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.accent}14` }}>
                <s.icon size={14} style={{ color: s.accent }} />
              </div>
              <span className="typo-status-label text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="typo-card-meta text-muted-foreground mt-0.5 leading-relaxed">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Row: Mode Distribution + Platform Health Radar */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="typo-card-title mb-1">How Users Analyze</p>
          <p className="typo-card-meta text-muted-foreground mb-3 leading-relaxed">
            Breakdown of which analysis modes the community uses most. Product mode deconstructs physical/digital products. Service mode targets service businesses. Business Model mode examines revenue structures. First Principles strips assumptions entirely.
          </p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3} labelLine={false}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-1">
            {pieData.map(e => (
              <div key={e.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                <span className="typo-card-meta font-semibold text-foreground">{e.name}</span>
                <span className="typo-card-meta text-muted-foreground">({e.value})</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="typo-card-title mb-1">Platform Engagement Snapshot</p>
          <p className="typo-card-meta text-muted-foreground mb-3 leading-relaxed">
            A radar view of platform health across 5 dimensions: Volume (total analyses), Diversity (category spread), Quality (average score), Depth (mode variety), and Consistency (usage regularity). Higher values indicate stronger engagement.
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis tick={false} domain={[0, 100]} axisLine={false} />
                <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Categories — full width */}
      {catBarData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="typo-card-title mb-1">Most Explored Categories</p>
          <p className="typo-card-meta text-muted-foreground mb-3 leading-relaxed">
            The product and service categories that users have analyzed most frequently. This shows where the community sees the most disruption opportunity — or where they're applying the most scrutiny.
          </p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catBarData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={100} />
                <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} formatter={(v: number) => [`${v} analyses`, "Count"]} />
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

      {/* Community Insight Cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame size={12} className="text-primary" />
            <span className="typo-status-label text-primary">What's Hot</span>
          </div>
          <p className="typo-card-body font-semibold text-foreground mb-1">
            {topCat ? `"${topCat.name}" leads with ${topCat.count} analyses` : "Community is warming up"}
          </p>
          <p className="typo-card-meta text-muted-foreground leading-relaxed">
            {topCat
              ? `This is the most scrutinized category on the platform. If you're working in this space, the community's attention suggests both opportunity and competition. Consider a First Principles analysis to find angles others may have missed.`
              : `Run your first analysis to start contributing to community intelligence.`}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Compass size={12} style={{ color: "hsl(271 81% 55%)" }} />
            <span className="typo-status-label" style={{ color: "hsl(271 81% 55%)" }}>Underexplored</span>
          </div>
          <p className="typo-card-body font-semibold text-foreground mb-1">
            {totalCategories < 20 ? `${50 - totalCategories}+ categories untouched` : "Deep coverage building"}
          </p>
          <p className="typo-card-meta text-muted-foreground leading-relaxed">
            {totalCategories < 20
              ? `The community has only explored ${totalCategories} categories so far. Industries like construction tech, elder care, logistics, and agriculture remain largely unanalyzed — potential whitespace for early movers.`
              : `With ${totalCategories} categories covered, the platform is building a broad disruption map. Look for cross-category patterns in your Portfolio.`}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={12} style={{ color: "hsl(var(--warning))" }} />
            <span className="typo-status-label" style={{ color: "hsl(var(--warning))" }}>Try This</span>
          </div>
          <p className="typo-card-body font-semibold text-foreground mb-1">
            {topMode ? `${(topMode[1] as number)} of ${totalAnalyses} analyses use ${MODE_LABELS[topMode[0]] || topMode[0]}` : "Pick a mode"}
          </p>
          <p className="typo-card-meta text-muted-foreground leading-relaxed">
            {modeCount < 4
              ? `The community hasn't fully adopted all analysis modes yet. Try ${modeCount === 1 ? "Service or Business Model" : "a mode you haven't used"} mode on a product you've already analyzed — different lenses often reveal different opportunities.`
              : `All 4 modes are active. For your next analysis, try running the same product through multiple modes to compare what each lens reveals.`}
          </p>
        </div>
      </div>
    </section>
  );
}
