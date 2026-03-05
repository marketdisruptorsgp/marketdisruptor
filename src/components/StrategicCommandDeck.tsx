/**
 * Strategic Command Deck
 *
 * Primary decision interface consuming systemIntelligence.commandDeck.
 * Displays top structural constraints, leverage points, opportunities,
 * and cross-lens convergence zones.
 */

import { memo } from "react";
import { Shield, Crosshair, Lightbulb, Zap } from "lucide-react";
import type { CommandDeck, ConstraintNode, OpportunityNode } from "@/lib/systemIntelligence";
import type { LeverageNode } from "@/lib/multiLensEngine";

interface StrategicCommandDeckProps {
  commandDeck: CommandDeck;
  convergenceCount: number;
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

function ConstraintRow({ node }: { node: ConstraintNode }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "hsl(0 72% 50%)" }} />
      <p className="text-sm font-semibold text-foreground flex-1 leading-snug">{node.label}</p>
      <ImpactBadge impact={node.impact} confidence={node.confidence} />
    </div>
  );
}

function LeverageRow({ node }: { node: LeverageNode }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "hsl(229 89% 63%)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug">{node.label}</p>
        {node.isConvergenceZone && (
          <span className="text-[9px] font-bold" style={{ color: "hsl(var(--warning))" }}>★ Multi-lens convergence</span>
        )}
      </div>
      <ImpactBadge impact={node.impact} confidence={node.confidence} />
    </div>
  );
}

function OpportunityRow({ node }: { node: OpportunityNode }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "hsl(152 60% 44%)" }} />
      <p className="text-sm font-semibold text-foreground flex-1 leading-snug">{node.label}</p>
      <ImpactBadge impact={node.impact} confidence={node.confidence} />
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
}: StrategicCommandDeckProps) {
  const { topConstraints, topLeveragePoints, topOpportunities, convergenceZones } = commandDeck;
  const hasData = topConstraints.length > 0 || topLeveragePoints.length > 0 || topOpportunities.length > 0;

  if (!hasData) return null;

  return (
    <div className="space-y-3">
      {/* Convergence callout */}
      {convergenceCount > 0 && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
          style={{
            background: "hsl(var(--warning) / 0.08)",
            border: "1.5px solid hsl(var(--warning) / 0.2)",
          }}
        >
          <Zap size={15} style={{ color: "hsl(var(--warning))" }} />
          <p className="text-xs font-bold text-foreground">
            {convergenceCount} cross-lens convergence zone{convergenceCount !== 1 ? "s" : ""} detected
            <span className="font-semibold text-foreground/60 ml-1">
              — highest-confidence disruption opportunities
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Constraints */}
        <div
          className="rounded-xl p-4 space-y-1"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <SectionHeader icon={Shield} label="Top Constraints" count={topConstraints.length} />
          {topConstraints.map(n => <ConstraintRow key={n.id} node={n} />)}
          {topConstraints.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No constraints identified</p>
          )}
        </div>

        {/* Leverage Points */}
        <div
          className="rounded-xl p-4 space-y-1"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <SectionHeader icon={Crosshair} label="Top Leverage" count={topLeveragePoints.length} />
          {topLeveragePoints.map(n => <LeverageRow key={n.id} node={n} />)}
          {topLeveragePoints.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No leverage points identified</p>
          )}
        </div>

        {/* Opportunities */}
        <div
          className="rounded-xl p-4 space-y-1"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <SectionHeader icon={Lightbulb} label="Top Opportunities" count={topOpportunities.length} />
          {topOpportunities.map(n => <OpportunityRow key={n.id} node={n} />)}
          {topOpportunities.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">No opportunities identified</p>
          )}
        </div>
      </div>
    </div>
  );
});
