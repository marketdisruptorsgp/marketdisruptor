/**
 * Strategic Summary Synthesis Panel
 *
 * Executive-level briefing card that synthesizes existing
 * systemIntelligence outputs. Presentation layer only —
 * no pipeline or scoring logic modifications.
 */

import { memo, useMemo } from "react";
import { Sparkles, TrendingUp, Compass, AlertTriangle } from "lucide-react";
import type { CommandDeck, ConstraintNode, OpportunityNode } from "@/lib/systemIntelligence";
import type { LeverageNode } from "@/lib/multiLensEngine";
import type { ConvergenceZone } from "@/lib/convergenceEngine";
import type { ExpandedFrictionScore } from "@/lib/frictionEngine";

interface StrategicSummaryPanelProps {
  commandDeck: CommandDeck;
  convergenceZoneDetails?: ConvergenceZone[];
  expandedFriction?: ExpandedFrictionScore | null;
}

/** Derive a one-line structural insight from convergence + constraints + friction */
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
    const frictionNote = friction && friction.overall >= 7
      ? " amid high system friction"
      : "";
    return `The primary structural constraint — "${topConstraint.label}" (impact ${topConstraint.impact}/10) — is the dominant force shaping the opportunity landscape${frictionNote}.`;
  }
  if (strategicZone) {
    return `Multiple analytical lenses converge on "${strategicZone.label}", indicating a high-confidence structural leverage zone.`;
  }
  return "The system has identified structural patterns across the analysis that warrant strategic attention.";
}

/** Derive strategic direction from top opportunities + constraints */
function deriveDirection(
  opportunities: OpportunityNode[],
  constraints: ConstraintNode[],
): string {
  const topOpp = opportunities[0];
  const topConstraint = constraints[0];

  if (topOpp && topConstraint) {
    return `Focus on removing "${topConstraint.label}" to unlock "${topOpp.label}" and adjacent opportunity clusters.`;
  }
  if (topOpp) {
    return `Prioritize "${topOpp.label}" as the highest-leverage strategic move available.`;
  }
  return "Gather additional data to clarify the strategic direction.";
}

/** Surface the biggest uncertainty from low-confidence or single-lens items */
function deriveMajorRisk(
  opportunities: OpportunityNode[],
  leveragePoints: LeverageNode[],
  constraints: ConstraintNode[],
  convergenceZones?: ConvergenceZone[],
): string {
  // Find lowest-confidence high-impact item
  const allItems = [
    ...opportunities.map(o => ({ label: o.label, confidence: o.confidence, impact: o.impact })),
    ...leveragePoints.map(l => ({ label: l.label, confidence: l.confidence, impact: l.impact })),
    ...constraints.map(c => ({ label: c.label, confidence: c.confidence, impact: c.impact })),
  ];

  const lowConfHigh = allItems
    .filter(i => i.confidence === "low" && i.impact >= 6)
    .sort((a, b) => b.impact - a.impact)[0];

  if (lowConfHigh) {
    return `"${lowConfHigh.label}" carries high impact (${lowConfHigh.impact}/10) but low confidence — evidence is sparse and this assumption is fragile.`;
  }

  // Check for non-converging high-impact opportunities
  const nonConverging = opportunities.find(o => {
    const inZone = convergenceZones?.some(z =>
      z.label.toLowerCase().includes(o.label.toLowerCase().slice(0, 20))
    );
    return !inZone && o.impact >= 7;
  });

  if (nonConverging) {
    return `"${nonConverging.label}" scores high but lacks cross-lens validation — it may reflect a single-perspective bias.`;
  }

  const medConf = allItems.find(i => i.confidence === "medium");
  if (medConf) {
    return `"${medConf.label}" rests on medium-confidence evidence and warrants further validation.`;
  }

  return "No critical uncertainties detected at current confidence thresholds.";
}

export const StrategicSummaryPanel = memo(function StrategicSummaryPanel({
  commandDeck,
  convergenceZoneDetails,
  expandedFriction,
}: StrategicSummaryPanelProps) {
  const { topConstraints, topLeveragePoints, topOpportunities } = commandDeck;

  const synthesis = useMemo(() => {
    const top3 = topOpportunities.slice(0, 3);
    const keyInsight = deriveKeyInsight(topConstraints, convergenceZoneDetails, expandedFriction);
    const direction = deriveDirection(topOpportunities, topConstraints);
    const risk = deriveMajorRisk(topOpportunities, topLeveragePoints, topConstraints, convergenceZoneDetails);
    return { top3, keyInsight, direction, risk };
  }, [topConstraints, topLeveragePoints, topOpportunities, convergenceZoneDetails, expandedFriction]);

  if (synthesis.top3.length === 0) return null;

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)",
        border: "1.5px solid hsl(var(--primary) / 0.25)",
        boxShadow: "0 2px 16px hsl(var(--primary) / 0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(var(--primary) / 0.12)" }}
        >
          <Sparkles size={14} className="text-primary" />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Strategic Summary
          </p>
          <p className="text-[10px] text-muted-foreground">Executive briefing</p>
        </div>
      </div>

      {/* Top 3 Opportunities */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 mb-1">
          <TrendingUp size={12} className="text-muted-foreground" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Highest-Leverage Opportunities
          </p>
        </div>
        {synthesis.top3.map((opp, i) => (
          <div key={opp.id} className="flex items-start gap-2.5">
            <span
              className="text-[10px] font-extrabold tabular-nums w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: "hsl(152 60% 44% / 0.12)",
                color: "hsl(152 60% 44%)",
              }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-snug">{opp.label}</p>
              {opp.evidence?.[0] && (
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-1">
                  {opp.evidence[0]}
                </p>
              )}
            </div>
            <span
              className="text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: opp.impact >= 8 ? "hsl(152 60% 44% / 0.12)" : "hsl(var(--muted))",
                color: opp.impact >= 8 ? "hsl(152 60% 44%)" : "hsl(var(--muted-foreground))",
              }}
            >
              {opp.impact}/10
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: "hsl(var(--border))" }} />

      {/* Key Insight + Direction + Risk — compact grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Key Insight */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Compass size={11} className="text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Key Insight</p>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{synthesis.keyInsight}</p>
        </div>

        {/* Strategic Direction */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={11} style={{ color: "hsl(152 60% 44%)" }} />
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(152 60% 44%)" }}>
              Direction
            </p>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{synthesis.direction}</p>
        </div>

        {/* Major Risk */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={11} style={{ color: "hsl(0 70% 50%)" }} />
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 70% 50%)" }}>
              Major Uncertainty
            </p>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{synthesis.risk}</p>
        </div>
      </div>
    </div>
  );
});
