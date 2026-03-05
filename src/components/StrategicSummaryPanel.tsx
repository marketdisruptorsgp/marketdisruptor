/**
 * Strategic Summary Synthesis Panel — Command Center Edition
 *
 * Executive-level briefing with circular gauges, visual-first layout.
 * Presentation layer only — no pipeline or scoring logic modifications.
 */

import { memo, useMemo } from "react";
import { Sparkles, TrendingUp, Compass, AlertTriangle, Zap, Activity } from "lucide-react";
import type { CommandDeck, ConstraintNode, OpportunityNode } from "@/lib/systemIntelligence";
import type { LeverageNode } from "@/lib/multiLensEngine";
import type { ConvergenceZone } from "@/lib/convergenceEngine";
import type { ExpandedFrictionScore } from "@/lib/frictionEngine";
import { CircularGauge } from "@/components/analysis/CircularGauge";

interface StrategicSummaryPanelProps {
  commandDeck: CommandDeck;
  convergenceZoneDetails?: ConvergenceZone[];
  expandedFriction?: ExpandedFrictionScore | null;
}

function deriveKeyInsight(
  constraints: ConstraintNode[],
  convergenceZones?: ConvergenceZone[],
  friction?: ExpandedFrictionScore | null,
): string {
  const topConstraint = constraints[0];
  const strategicZone = convergenceZones?.find(z => z.isStrategic);

  if (strategicZone && topConstraint) {
    return `Cross-lens convergence around "${strategicZone.label}" reveals that "${topConstraint.label}" is the structural bottleneck limiting opportunity capture.`;
  }
  if (topConstraint) {
    const frictionNote = friction && friction.overall >= 7 ? " amid high system friction" : "";
    return `The primary structural constraint — "${topConstraint.label}" (impact ${topConstraint.impact}/10) — is the dominant force shaping the opportunity landscape${frictionNote}.`;
  }
  if (strategicZone) {
    return `Multiple analytical lenses converge on "${strategicZone.label}", indicating a high-confidence structural leverage zone.`;
  }
  return "The system has identified structural patterns across the analysis that warrant strategic attention.";
}

function deriveDirection(opportunities: OpportunityNode[], constraints: ConstraintNode[]): string {
  const topOpp = opportunities[0];
  const topConstraint = constraints[0];
  if (topOpp && topConstraint) return `Focus on removing "${topConstraint.label}" to unlock "${topOpp.label}" and adjacent opportunity clusters.`;
  if (topOpp) return `Prioritize "${topOpp.label}" as the highest-leverage strategic move available.`;
  return "Gather additional data to clarify the strategic direction.";
}

function deriveMajorRisk(
  opportunities: OpportunityNode[], leveragePoints: LeverageNode[],
  constraints: ConstraintNode[], convergenceZones?: ConvergenceZone[],
): string {
  const allItems = [
    ...opportunities.map(o => ({ label: o.label, confidence: o.confidence, impact: o.impact })),
    ...leveragePoints.map(l => ({ label: l.label, confidence: l.confidence, impact: l.impact })),
    ...constraints.map(c => ({ label: c.label, confidence: c.confidence, impact: c.impact })),
  ];
  const lowConfHigh = allItems.filter(i => i.confidence === "low" && i.impact >= 6).sort((a, b) => b.impact - a.impact)[0];
  if (lowConfHigh) return `"${lowConfHigh.label}" carries high impact (${lowConfHigh.impact}/10) but low confidence — evidence is sparse.`;
  const nonConverging = opportunities.find(o => {
    const inZone = convergenceZones?.some(z => z.label.toLowerCase().includes(o.label.toLowerCase().slice(0, 20)));
    return !inZone && o.impact >= 7;
  });
  if (nonConverging) return `"${nonConverging.label}" scores high but lacks cross-lens validation — possible single-perspective bias.`;
  const medConf = allItems.find(i => i.confidence === "medium");
  if (medConf) return `"${medConf.label}" rests on medium-confidence evidence and warrants further validation.`;
  return "No critical uncertainties detected at current confidence thresholds.";
}

/** Compute gauge scores from command deck data */
function computeGaugeScores(
  commandDeck: CommandDeck,
  convergenceZones?: ConvergenceZone[],
  friction?: ExpandedFrictionScore | null,
) {
  const { topOpportunities, topLeveragePoints, topConstraints } = commandDeck;

  // Opportunity Score: avg impact of top opportunities * 10
  const oppScore = topOpportunities.length > 0
    ? Math.round(topOpportunities.slice(0, 3).reduce((sum, o) => sum + o.impact, 0) / Math.min(3, topOpportunities.length) * 10)
    : 0;

  // Market Momentum: based on convergence zone strength
  const momentum = convergenceZones?.length
    ? Math.round(convergenceZones.reduce((sum, z) => sum + z.strength, 0) / convergenceZones.length * 100)
    : topLeveragePoints.length > 0
      ? Math.round(topLeveragePoints.slice(0, 3).reduce((sum, l) => sum + l.impact, 0) / Math.min(3, topLeveragePoints.length) * 10)
      : 0;

  // Friction Intensity: inverted (high friction = high gauge value)
  const frictionScore = friction ? Math.round(friction.overall * 10) : 0;

  // Feasibility: based on confidence distribution
  const allItems = [...topOpportunities, ...topLeveragePoints];
  const highConf = allItems.filter(i => i.confidence === "high").length;
  const feasibility = allItems.length > 0 ? Math.round((highConf / allItems.length) * 100) : 0;

  return { oppScore, momentum, frictionScore, feasibility };
}

export const StrategicSummaryPanel = memo(function StrategicSummaryPanel({
  commandDeck, convergenceZoneDetails, expandedFriction,
}: StrategicSummaryPanelProps) {
  const { topConstraints, topLeveragePoints, topOpportunities } = commandDeck;

  const synthesis = useMemo(() => {
    const top3 = topOpportunities.slice(0, 3);
    const keyInsight = deriveKeyInsight(topConstraints, convergenceZoneDetails, expandedFriction);
    const direction = deriveDirection(topOpportunities, topConstraints);
    const risk = deriveMajorRisk(topOpportunities, topLeveragePoints, topConstraints, convergenceZoneDetails);
    const gauges = computeGaugeScores(commandDeck, convergenceZoneDetails, expandedFriction);
    return { top3, keyInsight, direction, risk, gauges };
  }, [topConstraints, topLeveragePoints, topOpportunities, convergenceZoneDetails, expandedFriction, commandDeck]);

  if (synthesis.top3.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--muted)) 50%, hsl(var(--card)) 100%)",
        border: "1.5px solid hsl(var(--primary) / 0.3)",
        boxShadow: "0 4px 32px hsl(var(--primary) / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.03)",
      }}
    >
      {/* Header bar */}
      <div
        className="px-5 py-3 flex items-center gap-2.5"
        style={{
          background: "hsl(var(--primary) / 0.08)",
          borderBottom: "1px solid hsl(var(--primary) / 0.15)",
        }}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.15)" }}>
          <Sparkles size={14} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
        <div className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
            Strategic Command Deck
          </div>
          <div className="text-[11px] text-foreground/60">Executive intelligence briefing</div>
        </div>
      </div>

      {/* Circular Gauges Row */}
      <div className="px-5 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center">
          <CircularGauge
            value={synthesis.gauges.oppScore}
            label="Opportunity"
            accentColor="hsl(var(--primary))"
            subtext="Score"
          />
          <CircularGauge
            value={synthesis.gauges.momentum}
            label="Momentum"
            accentColor="hsl(var(--success))"
            subtext="Market signal"
          />
          <CircularGauge
            value={synthesis.gauges.frictionScore}
            label="Friction"
            accentColor={synthesis.gauges.frictionScore >= 70 ? "hsl(var(--destructive))" : "hsl(var(--warning))"}
            subtext="System resistance"
          />
          <CircularGauge
            value={synthesis.gauges.feasibility}
            label="Feasibility"
            accentColor="hsl(152 60% 48%)"
            subtext="Confidence index"
          />
        </div>
      </div>

      <div className="h-px mx-5" style={{ background: "hsl(var(--border))" }} />

      {/* Top Insight Card */}
      <div className="px-5 py-4">
        <div
          className="rounded-xl p-4"
          style={{
            background: "hsl(var(--primary) / 0.06)",
            border: "1px solid hsl(var(--primary) / 0.12)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Compass size={12} style={{ color: "hsl(var(--primary))" }} />
            <p className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
              Top Insight
            </p>
          </div>
          <p className="text-sm font-bold text-foreground leading-relaxed">{synthesis.keyInsight}</p>
        </div>
      </div>

      {/* Strategic Levers — Top 3 Opportunities */}
      <div className="px-5 pb-4 space-y-2">
        <div className="flex items-center gap-1.5 mb-1">
          <Zap size={12} style={{ color: "hsl(var(--success))" }} />
          <p className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--success))" }}>
            Strategic Levers
          </p>
        </div>
        {synthesis.top3.map((opp, i) => (
          <div
            key={opp.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
            style={{
              background: "hsl(var(--muted) / 0.5)",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <span
              className="text-[11px] font-extrabold tabular-nums w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
              style={{
                background: "hsl(var(--success) / 0.15)",
                color: "hsl(var(--success))",
              }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-snug truncate">{opp.label}</p>
            </div>
            <span
              className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: opp.impact >= 8 ? "hsl(var(--success) / 0.15)" : "hsl(var(--muted))",
                color: opp.impact >= 8 ? "hsl(var(--success))" : "hsl(var(--foreground) / 0.6)",
              }}
            >
              {opp.impact}/10
            </span>
          </div>
        ))}
      </div>

      <div className="h-px mx-5" style={{ background: "hsl(var(--border))" }} />

      {/* Direction + Risk — compact grid */}
      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} style={{ color: "hsl(var(--success))" }} />
            <p className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--success))" }}>
              Strategic Direction
            </p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{synthesis.direction}</p>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={12} style={{ color: "hsl(var(--destructive))" }} />
            <p className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--destructive))" }}>
              Critical Uncertainty
            </p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{synthesis.risk}</p>
        </div>
      </div>
    </div>
  );
});
