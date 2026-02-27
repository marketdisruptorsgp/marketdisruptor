import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { ChevronDown, ChevronUp, TrendingUp, ShieldAlert, Target, Zap, DollarSign, Layers } from "lucide-react";

interface SavedAnalysis {
  id: string;
  title: string;
  avg_revival_score: number;
  analysis_data?: any;
  analysis_type?: string;
  category?: string;
}

interface InsightDimension {
  label: string;
  key: string;
  icon: any;
  extract: (a: SavedAnalysis) => number;
  detail: (a: SavedAnalysis) => string | null;
}

const DIMENSIONS: InsightDimension[] = [
  {
    label: "Revival Score", key: "revival", icon: TrendingUp,
    extract: (a) => a.avg_revival_score || 0,
    detail: (a) => { const score = a.avg_revival_score; if (score >= 8) return "High revival potential — strong candidate for market entry"; if (score >= 6) return "Moderate potential — needs differentiation to stand out"; return "Low score — significant pivots likely needed"; },
  },
  {
    label: "Risk Profile", key: "risk", icon: ShieldAlert,
    extract: (a) => { const d = a.analysis_data as any; const risks = d?.stressTestData?.risks || d?.pitchDeck?.risks || []; const highCount = risks.filter((r: any) => r.severity === "high").length; if (risks.length === 0) return 5; return Math.max(0, 10 - highCount * 2); },
    detail: (a) => { const d = a.analysis_data as any; const risks = d?.stressTestData?.risks || d?.pitchDeck?.risks || []; if (!risks.length) return null; const highRisks = risks.filter((r: any) => r.severity === "high"); if (highRisks.length > 0) return `${highRisks.length} high-severity risk${highRisks.length > 1 ? "s" : ""}: ${highRisks[0]?.risk || highRisks[0]?.title || ""}`; return `${risks.length} risk${risks.length > 1 ? "s" : ""} identified, none high severity`; },
  },
  {
    label: "Market Size", key: "market", icon: Target,
    extract: (a) => { const d = a.analysis_data as any; const tam = d?.pitchDeck?.marketOpportunity?.tam; if (!tam) return 3; const numMatch = tam.match(/\$?([\d.]+)\s*(B|T|M)/i); if (!numMatch) return 5; const val = parseFloat(numMatch[1]); const unit = numMatch[2].toUpperCase(); if (unit === "T") return 10; if (unit === "B" && val >= 50) return 9; if (unit === "B" && val >= 10) return 8; if (unit === "B") return 7; if (unit === "M" && val >= 500) return 6; return 4; },
    detail: (a) => { const d = a.analysis_data as any; return d?.pitchDeck?.marketOpportunity?.tam || null; },
  },
  {
    label: "GTM Readiness", key: "gtm", icon: Zap,
    extract: (a) => { const d = a.analysis_data as any; const channels = d?.pitchDeck?.gtmStrategy?.keyChannels || []; return Math.min(10, channels.length * 2 + 2); },
    detail: (a) => { const d = a.analysis_data as any; const channels = d?.pitchDeck?.gtmStrategy?.keyChannels; return channels?.slice(0, 3).join(", ") || null; },
  },
  {
    label: "Innovation", key: "innovation", icon: Layers,
    extract: (a) => { const d = a.analysis_data as any; const products = d?.products || []; const scores = products.map((p: any) => p.leverageScore).filter(Boolean); if (!scores.length) return 5; return Math.round(scores.reduce((s: number, v: number) => s + v, 0) / scores.length * 10) / 10; },
    detail: (a) => { const d = a.analysis_data as any; return d?.disruptData?.disruptionThesis || d?.firstPrinciplesData?.thesis || null; },
  },
  {
    label: "Unit Economics", key: "economics", icon: DollarSign,
    extract: (a) => { const d = a.analysis_data as any; const margin = d?.pitchDeck?.financialModel?.unitEconomics?.grossMargin || d?.pitchDeck?.businessModel?.unitEconomics?.grossMargin; if (!margin) return 4; const pct = parseFloat(margin); if (isNaN(pct)) return 5; return Math.min(10, Math.round(pct / 10)); },
    detail: (a) => { const d = a.analysis_data as any; const ue = d?.pitchDeck?.financialModel?.unitEconomics || d?.pitchDeck?.businessModel?.unitEconomics; if (!ue) return null; return `Margin: ${ue.grossMargin || "—"} · Payback: ${ue.paybackPeriod || "—"}`; },
  },
];

function getScoreColor(score: number) {
  if (score >= 7.5) return "hsl(142 70% 40%)";
  if (score >= 5) return "hsl(38 92% 50%)";
  return "hsl(0 72% 51%)";
}

export function ComparisonInsightView({ compareList }: { compareList: SavedAnalysis[] }) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);

  if (compareList.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="typo-card-body text-muted-foreground">Select projects above to see a side-by-side comparison</p>
      </div>
    );
  }

  const radarData = DIMENSIONS.map((dim) => {
    const entry: any = { dimension: dim.label };
    compareList.forEach((a, i) => { entry[`p${i}`] = dim.extract(a); });
    return entry;
  });

  const RADAR_COLORS = ["hsl(230 90% 63%)", "hsl(340 75% 55%)", "hsl(142 70% 45%)"];

  const barData = compareList.map((a) => ({
    name: a.title.length > 18 ? a.title.slice(0, 18) + "…" : a.title,
    score: a.avg_revival_score || 0,
    fill: getScoreColor(a.avg_revival_score || 0),
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="typo-status-label text-muted-foreground mb-2">Multi-Dimension Comparison</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              {compareList.map((a, i) => (
                <Radar key={a.id} name={a.title.slice(0, 20)} dataKey={`p${i}`} stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]} fillOpacity={0.12} strokeWidth={2} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-1">
            {compareList.map((a, i) => (
              <div key={a.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: RADAR_COLORS[i] }} />
                <span className="typo-card-meta font-semibold text-foreground">{a.title.length > 22 ? a.title.slice(0, 22) + "…" : a.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="typo-status-label text-muted-foreground mb-2">Revival Score Comparison</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} layout="vertical" barSize={24}>
              <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {barData.map((entry, i) => (
                  <Bar key={i} dataKey="score" fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-2">
        {DIMENSIONS.map((dim) => {
          const isExpanded = expandedDim === dim.key;
          const values = compareList.map((a) => ({ title: a.title, score: dim.extract(a), detail: dim.detail(a) }));
          const maxScore = Math.max(...values.map((v) => v.score));

          return (
            <div key={dim.key} className="rounded-lg border border-border bg-card overflow-hidden">
              <button onClick={() => setExpandedDim(isExpanded ? null : dim.key)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors">
                <dim.icon size={14} className="text-muted-foreground flex-shrink-0" />
                <span className="typo-card-body font-bold text-foreground flex-1">{dim.label}</span>
                <div className="flex items-center gap-2">
                  {values.map((v, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="h-2 rounded-full" style={{ width: `${Math.max(16, (v.score / 10) * 60)}px`, background: v.score === maxScore ? getScoreColor(v.score) : "hsl(var(--border))" }} />
                      <span className="typo-card-meta font-bold" style={{ color: v.score === maxScore ? getScoreColor(v.score) : "hsl(var(--muted-foreground))" }}>
                        {v.score}
                      </span>
                    </div>
                  ))}
                </div>
                {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${compareList.length}, 1fr)` }}>
                  {values.map((v, i) => (
                    <div key={i} className="rounded-lg p-3" style={{ background: "hsl(var(--muted))", borderLeft: `3px solid ${getScoreColor(v.score)}` }}>
                      <p className="typo-card-meta font-bold text-foreground truncate mb-1">{v.title.length > 25 ? v.title.slice(0, 25) + "…" : v.title}</p>
                      <p className="text-lg font-bold mb-1" style={{ color: getScoreColor(v.score) }}>{v.score}/10</p>
                      {v.detail && (
                        <p className="typo-card-meta text-muted-foreground leading-relaxed">{v.detail}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
