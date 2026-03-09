/**
 * Opportunity Matrix — Visual scoring components
 *
 * Renders:
 *   - Friction / Leverage meter bars
 *   - Expanded Friction dashboard (1-10 scale)
 *   - Priority classification badges
 *   - Scored opportunity cards
 *   - Quadrant summary
 */

import { memo } from "react";
import { TrendingUp, ShieldAlert, Zap, Target, Activity } from "lucide-react";
import {
  type ScoredOpportunity,
  type FrictionScore,
  type LeverageScore,
  type OpportunityPriority,
  type ExpandedFrictionScore,
  PRIORITY_META,
} from "@/lib/frictionEngine";
import type { GovernanceReport } from "@/lib/insightGovernance";

/* ── Score Bar ── */
function ScoreBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: color,
          transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

/* ── Friction Meter ── */
function FrictionMeter({ friction }: { friction: FrictionScore }) {
  const DIMS: { key: keyof typeof friction.dimensions; label: string }[] = [
    { key: "structural", label: "Structural" },
    { key: "economic", label: "Economic" },
    { key: "behavioral", label: "Behavioral" },
    { key: "competitive", label: "Competitive" },
  ];
  const color = friction.index <= 2.5 ? "hsl(152 60% 44%)" : friction.index <= 3.5 ? "hsl(38 92% 50%)" : "hsl(0 72% 50%)";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Friction</span>
        <span className="text-xs font-bold" style={{ color }}>{friction.index <= 2.5 ? "Low" : friction.index <= 3.5 ? "Moderate" : "High"}</span>
      </div>
      {DIMS.map(d => (
        <div key={d.key} className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground w-16 flex-shrink-0">{d.label}</span>
          <ScoreBar value={friction.dimensions[d.key]} color={color} />
        </div>
      ))}
    </div>
  );
}

/* ── Leverage Meter ── */
function LeverageMeter({ leverage }: { leverage: LeverageScore }) {
  const DIMS: { key: keyof typeof leverage.dimensions; label: string }[] = [
    { key: "valueExpansion", label: "Value" },
    { key: "marketExpansion", label: "Market" },
    { key: "structuralAdvantage", label: "Advantage" },
    { key: "strategicOptionality", label: "Optionality" },
  ];
  const color = leverage.index >= 4 ? "hsl(152 60% 44%)" : leverage.index >= 3 ? "hsl(229 89% 63%)" : "hsl(var(--muted-foreground))";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Leverage</span>
        <span className="text-xs font-bold" style={{ color }}>{leverage.index >= 4 ? "Strong" : leverage.index >= 3 ? "Moderate" : "Limited"}</span>
      </div>
      {DIMS.map(d => (
        <div key={d.key} className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground w-16 flex-shrink-0">{d.label}</span>
          <ScoreBar value={leverage.dimensions[d.key]} color={color} />
        </div>
      ))}
    </div>
  );
}

/* ── Priority Badge ── */
function PriorityBadge({ priority }: { priority: OpportunityPriority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

/* ── Opportunity Card ── */
function OpportunityCard({ opp, compact }: { opp: ScoredOpportunity; compact?: boolean }) {
  const priorityMeta = PRIORITY_META[opp.priority];

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: "hsl(var(--card))",
        border: `1.5px solid ${priorityMeta.color}22`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-snug">{opp.label}</p>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{opp.description}</p>
          )}
        </div>
        <PriorityBadge priority={opp.priority} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FrictionMeter friction={opp.friction} />
        <LeverageMeter leverage={opp.leverage} />
      </div>
    </div>
  );
}

/* ── Quadrant Summary ── */
function QuadrantSummary({ summary }: {
  summary: { breakthroughs: number; strategicBets: number; quickWins: number; lowPriority: number; avgFriction: number; avgLeverage: number };
}) {
  const quadrants: { priority: OpportunityPriority; count: number; icon: React.ElementType }[] = [
    { priority: "breakthrough", count: summary.breakthroughs, icon: Zap },
    { priority: "strategic_bet", count: summary.strategicBets, icon: Target },
    { priority: "quick_win", count: summary.quickWins, icon: TrendingUp },
    { priority: "low_priority", count: summary.lowPriority, icon: ShieldAlert },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {quadrants.map(q => {
        const meta = PRIORITY_META[q.priority];
        return (
          <div
            key={q.priority}
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: meta.bg, border: `1px solid ${meta.color}22` }}
          >
            <q.icon size={16} style={{ color: meta.color }} />
            <div>
              <p className="text-lg font-extrabold tabular-nums" style={{ color: meta.color }}>{q.count}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{meta.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Governance Badge ── */
function GovernanceBadge({ report }: { report: GovernanceReport }) {
  if (report.duplicatesRemoved === 0 && report.orphansRemoved === 0 && report.opportunitiesCapped === 0) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
      style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
    >
      <ShieldAlert size={12} />
      <span>
        Governance: {report.duplicatesRemoved > 0 ? `${report.duplicatesRemoved} duplicates removed` : ""}
        {report.opportunitiesCapped > 0 ? ` · ${report.opportunitiesCapped} capped` : ""}
        {report.orphansRemoved > 0 ? ` · ${report.orphansRemoved} orphans removed` : ""}
      </span>
    </div>
  );
}

/* ── Expanded Friction Dashboard ── */
const EXPANDED_DIM_LABELS: Record<string, string> = {
  customerEffort: "Customer Effort",
  timeDelays: "Time Delays",
  costInefficiency: "Cost Inefficiency",
  processComplexity: "Process Complexity",
  informationAsymmetry: "Info Asymmetry",
  industryInertia: "Industry Inertia",
};

const CATEGORY_LABELS: Record<string, string> = {
  valueDelivery: "Value Delivery",
  customerExperience: "Customer Experience",
  operationalFlow: "Operational Flow",
  marketStructure: "Market Structure",
};

export const ExpandedFrictionDashboard = memo(function ExpandedFrictionDashboard({
  friction,
}: {
  friction: ExpandedFrictionScore;
}) {
  const overallColor = friction.overall <= 4 ? "hsl(152 60% 44%)" : friction.overall <= 6 ? "hsl(38 92% 50%)" : "hsl(0 72% 50%)";

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <div className="flex items-center gap-3">
        <Activity size={16} style={{ color: overallColor }} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">System Friction Index</span>
            <span className="text-sm font-bold" style={{ color: overallColor }}>{friction.overall >= 7 ? "High" : friction.overall >= 4 ? "Moderate" : "Low"}</span>
          </div>
          <ScoreBar value={friction.overall} max={10} color={overallColor} />
        </div>
      </div>

      {/* Category scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Object.entries(friction.category).map(([key, value]) => {
          const catColor = value <= 4 ? "hsl(152 60% 44%)" : value <= 6 ? "hsl(38 92% 50%)" : "hsl(0 72% 50%)";
          return (
            <div
              key={key}
              className="rounded-xl p-3 space-y-1.5"
              style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {CATEGORY_LABELS[key] || key}
              </p>
              <p className="text-sm font-extrabold" style={{ color: catColor }}>{value >= 7 ? "High friction" : value >= 4 ? "Moderate" : "Low friction"}</p>
              <ScoreBar value={value} max={10} color={catColor} />
            </div>
          );
        })}
      </div>

      {/* Dimension breakdown */}
      <div className="space-y-1.5">
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Friction Dimensions</p>
        {Object.entries(friction.dimensions).map(([key, value]) => {
          const dimColor = value <= 4 ? "hsl(152 60% 44%)" : value <= 6 ? "hsl(38 92% 50%)" : "hsl(0 72% 50%)";
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground w-24 flex-shrink-0">
                {EXPANDED_DIM_LABELS[key] || key}
              </span>
              <div className="flex-1">
                <ScoreBar value={value} max={10} color={dimColor} />
              </div>
              <span className="text-xs font-bold w-16 text-right" style={{ color: dimColor }}>
                {value >= 7 ? "High" : value >= 4 ? "Moderate" : "Low"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Top friction points */}
      {friction.topFactors.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {friction.topFactors.map(f => (
            <span
              key={f.dimension}
              className="px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                background: f.score >= 7 ? "hsl(0 72% 50% / 0.12)" : "hsl(38 92% 50% / 0.12)",
                color: f.score >= 7 ? "hsl(0 72% 50%)" : "hsl(38 92% 50%)",
              }}
            >
              {EXPANDED_DIM_LABELS[f.dimension] || f.dimension}: {f.score >= 7 ? "High" : f.score >= 4 ? "Moderate" : "Low"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

/* ── Main Component ── */
export interface OpportunityMatrixProps {
  opportunities: ScoredOpportunity[];
  summary: {
    breakthroughs: number;
    strategicBets: number;
    quickWins: number;
    lowPriority: number;
    avgFriction: number;
    avgLeverage: number;
  };
  governanceReport?: GovernanceReport;
  expandedFriction?: ExpandedFrictionScore;
  compact?: boolean;
}

export const OpportunityMatrix = memo(function OpportunityMatrix({
  opportunities,
  summary,
  governanceReport,
  expandedFriction,
  compact = false,
}: OpportunityMatrixProps) {
  if (opportunities.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Expanded Friction Dashboard */}
      {expandedFriction && (
        <ExpandedFrictionDashboard friction={expandedFriction} />
      )}

      {/* Quadrant overview */}
      <QuadrantSummary summary={summary} />

      {/* Governance badge */}
      {governanceReport && <GovernanceBadge report={governanceReport} />}

      {/* Opportunity cards */}
      <div className="space-y-3">
        {opportunities.map(opp => (
          <OpportunityCard key={opp.id} opp={opp} compact={compact} />
        ))}
      </div>
    </div>
  );
});
