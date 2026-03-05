/**
 * Strategic Command Deck
 *
 * Primary decision interface consuming systemIntelligence.commandDeck.
 * Displays system friction, convergence zones, top constraints,
 * leverage points, opportunities, and insight trace access.
 */

import { memo, useState } from "react";
import { Shield, Crosshair, Lightbulb, Zap, Eye } from "lucide-react";
import type { CommandDeck, ConstraintNode, OpportunityNode } from "@/lib/systemIntelligence";
import type { LeverageNode } from "@/lib/multiLensEngine";
import type { ExpandedFrictionScore } from "@/lib/frictionEngine";
import type { ProvenanceRegistry } from "@/lib/insightProvenance";
import type { ConvergenceZone } from "@/lib/convergenceEngine";
import { ExpandedFrictionDashboard } from "@/components/OpportunityMatrix";
import { InsightTracePanel } from "@/components/InsightTracePanel";
import { StrategicSummaryPanel } from "@/components/StrategicSummaryPanel";

interface StrategicCommandDeckProps {
  commandDeck: CommandDeck;
  convergenceCount: number;
  expandedFriction?: ExpandedFrictionScore | null;
  provenanceRegistry?: ProvenanceRegistry | null;
  convergenceZoneDetails?: ConvergenceZone[];
}

function ImpactBadge({ impact, confidence }: { impact: number; confidence: string }) {
  const color = impact >= 8 ? "hsl(0 70% 50%)" : impact >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";
  return (
    <span
      className="text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color }}
    >
      {impact}/10{confidence !== "high" && ` · ${confidence}`}
    </span>
  );
}

function TraceButton({ onTrace }: { onTrace: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onTrace(); }}
      className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer flex-shrink-0"
      title="Trace reasoning"
    >
      <Eye size={12} className="text-muted-foreground" />
    </button>
  );
}

function ConstraintRow({ node, onTrace }: { node: ConstraintNode; onTrace?: () => void }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "hsl(0 72% 50%)" }} />
      <p className="text-sm font-semibold text-foreground flex-1 leading-snug">{node.label}</p>
      <ImpactBadge impact={node.impact} confidence={node.confidence} />
      {onTrace && <TraceButton onTrace={onTrace} />}
    </div>
  );
}

function LeverageRow({ node, onTrace }: { node: LeverageNode; onTrace?: () => void }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "hsl(229 89% 63%)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug">{node.label}</p>
        {node.isConvergenceZone && (
          <span className="text-[9px] font-bold" style={{ color: "hsl(38 92% 50%)" }}>★ Multi-lens convergence</span>
        )}
      </div>
      <ImpactBadge impact={node.impact} confidence={node.confidence} />
      {onTrace && <TraceButton onTrace={onTrace} />}
    </div>
  );
}

function OpportunityRow({ node, onTrace }: { node: OpportunityNode; onTrace?: () => void }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "hsl(152 60% 44%)" }} />
      <p className="text-sm font-semibold text-foreground flex-1 leading-snug">{node.label}</p>
      <ImpactBadge impact={node.impact} confidence={node.confidence} />
      {onTrace && <TraceButton onTrace={onTrace} />}
    </div>
  );
}

function SectionHeader({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <Icon size={13} className="text-muted-foreground" />
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <span className="text-[10px] font-bold text-muted-foreground/60">({count})</span>
    </div>
  );
}

export const StrategicCommandDeck = memo(function StrategicCommandDeck({
  commandDeck,
  convergenceCount,
  expandedFriction,
  provenanceRegistry,
  convergenceZoneDetails,
}: StrategicCommandDeckProps) {
  const [tracingId, setTracingId] = useState<string | null>(null);
  const { topConstraints, topLeveragePoints, topOpportunities, convergenceZones } = commandDeck;
  const hasData = topConstraints.length > 0 || topLeveragePoints.length > 0 || topOpportunities.length > 0;

  if (!hasData) return null;

  const handleTrace = provenanceRegistry
    ? (id: string) => setTracingId(tracingId === id ? null : id)
    : undefined;

  return (
    <div className="space-y-3">
      {/* Executive Strategic Summary */}
      <StrategicSummaryPanel
        commandDeck={commandDeck}
        convergenceZoneDetails={convergenceZoneDetails}
        expandedFriction={expandedFriction}
      />

      {/* System Friction Dashboard (compact) */}
      {expandedFriction && (
        <div
          className="rounded-xl p-4"
          style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
        >
          <ExpandedFrictionDashboard friction={expandedFriction} />
        </div>
      )}

      {/* Convergence Zones detail */}
      {convergenceZoneDetails && convergenceZoneDetails.length > 0 && (
        <div
          className="rounded-xl p-4 space-y-2"
          style={{
            background: "hsl(38 92% 50% / 0.06)",
            border: "1.5px solid hsl(38 92% 50% / 0.2)",
          }}
        >
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: "hsl(38 92% 50%)" }} />
            <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(38 92% 50%)" }}>
              Convergence Zones
            </p>
            <span className="text-[10px] font-bold text-muted-foreground/60">({convergenceZoneDetails.length})</span>
          </div>
          {convergenceZoneDetails.slice(0, 5).map(zone => (
            <div key={zone.id} className="flex items-center gap-2.5 py-1">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: zone.isStrategic ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug">{zone.label}</p>
                <div className="flex gap-1 mt-0.5">
                  {zone.lenses.map(l => (
                    <span key={l} className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                      {l}
                    </span>
                  ))}
                  {zone.isStrategic && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase" style={{ background: "hsl(38 92% 50% / 0.15)", color: "hsl(38 92% 50%)" }}>
                      Strategic
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                {(zone.strength * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Legacy convergence callout (fallback) */}
      {(!convergenceZoneDetails || convergenceZoneDetails.length === 0) && convergenceCount > 0 && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
          style={{
            background: "hsl(38 92% 50% / 0.08)",
            border: "1.5px solid hsl(38 92% 50% / 0.2)",
          }}
        >
          <Zap size={15} style={{ color: "hsl(38 92% 50%)" }} />
          <p className="text-xs font-bold text-foreground">
            {convergenceCount} cross-lens convergence zone{convergenceCount !== 1 ? "s" : ""} detected
            <span className="font-semibold text-foreground/60 ml-1">
              — highest-confidence disruption opportunities
            </span>
          </p>
        </div>
      )}

      {/* Insight Trace Panel */}
      {tracingId && provenanceRegistry && (
        <InsightTracePanel
          insightId={tracingId}
          registry={provenanceRegistry}
          onClose={() => setTracingId(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Constraints */}
        <div
          className="rounded-xl p-4 space-y-1"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.03)",
          }}
        >
          <SectionHeader icon={Shield} label="Top Constraints" count={topConstraints.length} />
          <div className="h-px my-1" style={{ background: "hsl(0 72% 50% / 0.2)" }} />
          {topConstraints.map(n => (
            <ConstraintRow key={n.id} node={n} onTrace={handleTrace ? () => handleTrace(n.id) : undefined} />
          ))}
          {topConstraints.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No constraints identified</p>
          )}
        </div>

        {/* Leverage Points */}
        <div
          className="rounded-xl p-4 space-y-1"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.03)",
          }}
        >
          <SectionHeader icon={Crosshair} label="Top Leverage" count={topLeveragePoints.length} />
          <div className="h-px my-1" style={{ background: "hsl(229 89% 63% / 0.2)" }} />
          {topLeveragePoints.map(n => (
            <LeverageRow key={n.id} node={n} onTrace={handleTrace ? () => handleTrace(n.id) : undefined} />
          ))}
          {topLeveragePoints.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No leverage points identified</p>
          )}
        </div>

        {/* Opportunities */}
        <div
          className="rounded-xl p-4 space-y-1"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.03)",
          }}
        >
          <SectionHeader icon={Lightbulb} label="Top Opportunities" count={topOpportunities.length} />
          <div className="h-px my-1" style={{ background: "hsl(152 60% 44% / 0.2)" }} />
          {topOpportunities.map(n => (
            <OpportunityRow key={n.id} node={n} onTrace={handleTrace ? () => handleTrace(n.id) : undefined} />
          ))}
          {topOpportunities.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No opportunities identified</p>
          )}
        </div>
      </div>
    </div>
  );
});
