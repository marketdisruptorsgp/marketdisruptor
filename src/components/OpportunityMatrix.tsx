/**
 * Opportunity Matrix — Visual scoring components
 *
 * Renders:
 *   - Friction / Leverage meter bars
 *   - Priority classification badges
 *   - Scored opportunity cards
 *   - Quadrant summary
 */

import { memo } from "react";
import { TrendingUp, ShieldAlert, Zap, Target } from "lucide-react";
import {
  type ScoredOpportunity,
  type FrictionScore,
  type LeverageScore,
  type OpportunityPriority,
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
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Friction</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{friction.index.toFixed(1)}/5</span>
      </div>
      {DIMS.map(d => (
        <div key={d.key} className="flex items-center gap-2">
          <span className="text-[9px] font-semibold text-muted-foreground w-16 flex-shrink-0">{d.label}</span>
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
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Leverage</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{leverage.index.toFixed(1)}/5</span>
      </div>
      {DIMS.map(d => (
        <div key={d.key} className="flex items-center gap-2">
          <span className="text-[9px] font-semibold text-muted-foreground w-16 flex-shrink-0">{d.label}</span>
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
      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
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
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{meta.label}</p>
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
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-semibold"
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
  compact?: boolean;
}

export const OpportunityMatrix = memo(function OpportunityMatrix({
  opportunities,
  summary,
  governanceReport,
  compact = false,
}: OpportunityMatrixProps) {
  if (opportunities.length === 0) return null;

  return (
    <div className="space-y-4">
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
