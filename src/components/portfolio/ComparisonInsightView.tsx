import { useState, forwardRef } from "react";
import { RadarChart, PolarGrid as RawPolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { ChevronDown, ChevronUp, TrendingUp, ShieldAlert, Target, Zap, DollarSign, Layers } from "lucide-react";
import { InfoExplainer } from "@/components/InfoExplainer";

// Wrap PolarGrid to suppress ref warning (Recharts function component issue)
const PolarGrid = forwardRef<any, any>((props, _ref) => <RawPolarGrid {...props} />);

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
  explainer: string;
  extract: (a: SavedAnalysis) => number;
  detail: (a: SavedAnalysis) => string | null;
}

const BASE_DIMENSIONS: InsightDimension[] = [
  {
    label: "Revival Score", key: "revival", icon: TrendingUp,
    explainer: "The AI-generated revival score rates how viable this product concept is for a modern market relaunch, factoring in demand signals, competitive landscape, and differentiation potential. Scores above 7 are uncommon and indicate genuinely strong opportunities.",
    extract: (a) => a.avg_revival_score || 0,
    detail: (a) => {
      const score = a.avg_revival_score;
      if (score >= 8) return "Exceptional revival potential — strong differentiation and clear market demand";
      if (score >= 6) return "Solid foundation — needs sharper positioning or timing advantage to break through";
      if (score >= 4) return "Marginal viability — requires significant pivot or niche targeting";
      return "Weak signal — fundamental assumptions may be flawed";
    },
  },
  {
    label: "Risk Profile", key: "risk", icon: ShieldAlert,
    explainer: "Risk Profile inverts the severity of identified threats: regulatory, competitive, technical, and market risks. A score of 10 means minimal risk exposure. Low scores (below 5) indicate multiple high-severity risks that could derail execution.",
    extract: (a) => {
      const d = a.analysis_data as any;
      const risks = d?.stressTestData?.risks || d?.pitchDeck?.risks || [];
      const highCount = risks.filter((r: any) => r.severity === "high").length;
      const medCount = risks.filter((r: any) => r.severity === "medium").length;
      if (risks.length === 0) return 3;
      return Math.max(1, Math.min(10, 10 - highCount * 3 - medCount * 1));
    },
    detail: (a) => {
      const d = a.analysis_data as any;
      const risks = d?.stressTestData?.risks || d?.pitchDeck?.risks || [];
      if (!risks.length) return "No risk data available — run a stress test for accurate assessment";
      const highRisks = risks.filter((r: any) => r.severity === "high");
      if (highRisks.length > 0) return `${highRisks.length} high-severity risk${highRisks.length > 1 ? "s" : ""}: ${highRisks[0]?.risk || highRisks[0]?.title || ""}`;
      return `${risks.length} risk${risks.length > 1 ? "s" : ""} identified, none high severity`;
    },
  },
  {
    label: "Market Size", key: "market", icon: Target,
    explainer: "Market Size scores the Total Addressable Market (TAM) extracted from pitch deck data. Trillion-dollar markets score highest, but most realistic product opportunities fall in the $100M–$5B range, yielding scores of 4–6.",
    extract: (a) => {
      const d = a.analysis_data as any;
      const tam = d?.pitchDeck?.marketOpportunity?.tam;
      if (!tam) return 2;
      const numMatch = tam.match(/\$?([\d.]+)\s*(B|T|M)/i);
      if (!numMatch) return 3;
      const val = parseFloat(numMatch[1]);
      const unit = numMatch[2].toUpperCase();
      if (unit === "T") return 10;
      if (unit === "B" && val >= 100) return 9;
      if (unit === "B" && val >= 50) return 8;
      if (unit === "B" && val >= 10) return 7;
      if (unit === "B" && val >= 1) return 5;
      if (unit === "B") return 4;
      if (unit === "M" && val >= 500) return 4;
      if (unit === "M" && val >= 100) return 3;
      return 2;
    },
    detail: (a) => {
      const d = a.analysis_data as any;
      return d?.pitchDeck?.marketOpportunity?.tam || "No TAM data — generate a pitch deck to assess";
    },
  },
  {
    label: "GTM Readiness", key: "gtm", icon: Zap,
    explainer: "Go-To-Market Readiness measures how well-defined the launch strategy is: identified channels, target segments, and distribution pathways. Most early-stage concepts score 3–5 here because GTM plans are typically underdeveloped.",
    extract: (a) => {
      const d = a.analysis_data as any;
      const channels = d?.pitchDeck?.gtmStrategy?.keyChannels || [];
      const hasSegments = !!d?.pitchDeck?.gtmStrategy?.targetSegment;
      const hasTimeline = !!d?.pitchDeck?.gtmStrategy?.timeline;
      if (channels.length === 0) return 2;
      let score = Math.min(6, channels.length + 1);
      if (hasSegments) score += 1;
      if (hasTimeline) score += 1;
      return Math.min(10, score);
    },
    detail: (a) => {
      const d = a.analysis_data as any;
      const channels = d?.pitchDeck?.gtmStrategy?.keyChannels;
      if (!channels?.length) return "No GTM channels defined — generate a pitch deck to populate";
      return channels.slice(0, 3).join(", ");
    },
  },
  {
    label: "Innovation", key: "innovation", icon: Layers,
    explainer: "Innovation score reflects how differentiated and novel the product concept is, based on leverage scores from the analysis. Products that merely copy existing solutions score low; genuinely new approaches score higher.",
    extract: (a) => {
      const d = a.analysis_data as any;
      const products = d?.products || [];
      const scores = products.map((p: any) => p.leverageScore).filter(Boolean);
      if (!scores.length) return 3;
      const avg = scores.reduce((s: number, v: number) => s + v, 0) / scores.length;
      return Math.round(Math.max(1, Math.min(10, avg * 0.85)) * 10) / 10;
    },
    detail: (a) => {
      const d = a.analysis_data as any;
      return d?.disruptData?.disruptionThesis || d?.firstPrinciplesData?.thesis || "No innovation thesis generated yet";
    },
  },
  {
    label: "Unit Economics", key: "economics", icon: DollarSign,
    explainer: "Unit Economics scores the gross margin and payback period viability. Scores above 7 indicate healthy margins (>60%) with reasonable payback. Most early-stage concepts lack detailed economics data and score conservatively.",
    extract: (a) => {
      const d = a.analysis_data as any;
      const margin = d?.pitchDeck?.financialModel?.unitEconomics?.grossMargin || d?.pitchDeck?.businessModel?.unitEconomics?.grossMargin;
      if (!margin) return 2;
      const pct = parseFloat(margin);
      if (isNaN(pct)) return 3;
      return Math.max(1, Math.min(10, Math.round(pct / 10)));
    },
    detail: (a) => {
      const d = a.analysis_data as any;
      const ue = d?.pitchDeck?.financialModel?.unitEconomics || d?.pitchDeck?.businessModel?.unitEconomics;
      if (!ue) return "No unit economics data — generate a pitch deck to populate";
      return `Margin: ${ue.grossMargin || "—"} · Payback: ${ue.paybackPeriod || "—"}`;
    },
  },
];

// ETA-specific dimensions for business acquisition comparisons
const ETA_DIMENSIONS: InsightDimension[] = [
  {
    label: "Owner Dependency", key: "ownerDep", icon: ShieldAlert,
    explainer: "How dependent the business is on the current owner. Lower scores (inverted) mean higher dependency and higher transition risk. Score of 10 means the business runs independently.",
    extract: (a) => {
      const d = a.analysis_data as any;
      const score = d?.ownerDependencyAssessment?.transitionRiskScore;
      if (score == null) return 5;
      return Math.max(1, 10 - score); // Invert: high dependency = low score
    },
    detail: (a) => {
      const d = a.analysis_data as any;
      const deps = d?.ownerDependencyAssessment?.ownerDependencies;
      if (!deps?.length) return "No owner dependency data available";
      const critical = deps.filter((dep: any) => dep.severity === "critical" || dep.severity === "high");
      return `${critical.length} critical/high dependency areas: ${critical[0]?.area || "—"}`;
    },
  },
  {
    label: "Improvement Potential", key: "improvement", icon: TrendingUp,
    explainer: "How much upside exists from operational improvements, pricing changes, and revenue expansion identified in the analysis. Higher scores indicate more actionable opportunities.",
    extract: (a) => {
      const d = a.analysis_data as any;
      const streams = d?.revenueReinvention?.untappedStreams?.length || 0;
      const friction = d?.operationalAudit?.frictionPoints?.length || 0;
      const assumptions = d?.hiddenAssumptions?.filter((h: any) => h.isChallengeable)?.length || 0;
      const total = streams + Math.min(friction, 5) + Math.min(assumptions, 5);
      return Math.min(10, Math.round(total * 0.7));
    },
    detail: (a) => {
      const d = a.analysis_data as any;
      const streams = d?.revenueReinvention?.untappedStreams?.length || 0;
      const quickWins = d?.ownershipPlaybook?.quickWins?.length || 0;
      return `${streams} revenue opportunities, ${quickWins} quick wins identified`;
    },
  },
  {
    label: "Customer Concentration", key: "custConc", icon: Target,
    explainer: "Revenue diversification across customers. Higher score = more diversified (safer). If top customer is >25% of revenue, score drops significantly.",
    extract: (a) => {
      const d = a.analysis_data as any;
      const cc = d?.ownerDependencyAssessment?.customerConcentration;
      if (!cc) return 5;
      if (cc.riskLevel === "critical") return 2;
      if (cc.riskLevel === "high") return 4;
      if (cc.riskLevel === "medium") return 6;
      return 8;
    },
    detail: (a) => {
      const d = a.analysis_data as any;
      return d?.ownerDependencyAssessment?.customerConcentration?.detail || "No customer concentration data";
    },
  },
];

function getDimensions(compareList: SavedAnalysis[]): InsightDimension[] {
  const hasETA = compareList.some(a => a.analysis_type === "business_model");
  if (hasETA) {
    // Use a mix: keep core dimensions + add ETA ones
    return [...BASE_DIMENSIONS.slice(0, 2), ...ETA_DIMENSIONS, ...BASE_DIMENSIONS.slice(5)];
  }
  return BASE_DIMENSIONS;
}

const DIMENSIONS = BASE_DIMENSIONS; // default fallback

function getScoreColor(score: number) {
  if (score >= 7) return "hsl(var(--score-high))";
  if (score >= 4.5) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

function getScoreLabel(score: number) {
  if (score >= 8) return "Excellent";
  if (score >= 7) return "Strong";
  if (score >= 5) return "Moderate";
  if (score >= 3) return "Weak";
  return "Critical";
}

const RADAR_COLORS = ["hsl(var(--mode-product))", "hsl(var(--mode-service))", "hsl(var(--score-high))"];

export function ComparisonInsightView({ compareList }: { compareList: SavedAnalysis[] }) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  const activeDimensions = getDimensions(compareList);

  if (compareList.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="typo-card-body text-foreground/60">Select projects above to see a side-by-side comparison</p>
      </div>
    );
  }

  const radarData = activeDimensions.map((dim) => {
    const entry: any = { dimension: dim.label.split(" ")[0] };
    compareList.forEach((a, i) => { entry[`p${i}`] = dim.extract(a); });
    return entry;
  });

  return (
    <div className="space-y-5">
      {/* Radar chart */}
      <div className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-center gap-2 mb-3">
          <p className="typo-section-title text-foreground">Multi-Dimension Radar</p>
          <InfoExplainer text="This radar plots each project across 6 strategic dimensions. Wider coverage indicates a more well-rounded opportunity. Spikes show relative strengths; dips show gaps that need attention." />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
            <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickCount={6} />
            {compareList.map((a, i) => (
              <Radar key={a.id} name={(a.title || "Untitled").slice(0, 20)} dataKey={`p${i}`} stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]} fillOpacity={0.1} strokeWidth={2.5} />
            ))}
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          {compareList.map((a, i) => (
            <div key={a.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: RADAR_COLORS[i] }} />
              <span className="typo-card-body font-semibold text-foreground">{a.title || "Untitled"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dimension breakdown */}
      <div className="space-y-2">
        {activeDimensions.map((dim) => {
          const isExpanded = expandedDim === dim.key;
          const values = compareList.map((a, i) => ({ title: a.title, score: dim.extract(a), detail: dim.detail(a), color: RADAR_COLORS[i] }));
          const maxScore = Math.max(...values.map((v) => v.score));

          return (
            <div key={dim.key} className="rounded-xl border border-border bg-card overflow-hidden">
              <button onClick={() => setExpandedDim(isExpanded ? null : dim.key)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--muted))" }}>
                  <dim.icon size={15} className="text-foreground" />
                </div>
                <span className="typo-card-title text-foreground flex-1">{dim.label}</span>
                <div className="flex items-center gap-3">
                  {values.map((v, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-16 h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(v.score / 10) * 100}%`, background: v.color }} />
                      </div>
                      <span className="typo-card-meta font-bold tabular-nums min-w-[2rem] text-right" style={{ color: getScoreColor(v.score) }}>
                        {v.score}
                      </span>
                    </div>
                  ))}
                </div>
                <InfoExplainer text={dim.explainer} />
                {isExpanded ? <ChevronUp size={14} className="text-foreground/40" /> : <ChevronDown size={14} className="text-foreground/40" />}
              </button>

              {isExpanded && (
                <div className="px-5 pb-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${compareList.length}, 1fr)` }}>
                  {values.map((v, i) => (
                    <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: "hsl(var(--background))", border: `1.5px solid hsl(var(--border))`, borderTop: `3px solid ${v.color}` }}>
                      <p className="typo-card-meta font-bold text-foreground truncate">{v.title}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold tabular-nums" style={{ color: getScoreColor(v.score) }}>{v.score}</span>
                        <span className="typo-card-meta font-semibold" style={{ color: getScoreColor(v.score) }}>{getScoreLabel(v.score)}</span>
                      </div>
                      {v.detail && (
                        <p className="typo-card-body text-foreground/70 leading-relaxed">{v.detail}</p>
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