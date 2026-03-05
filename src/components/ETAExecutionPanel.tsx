/**
 * ETA Execution Panel
 *
 * Visual gauges for Execution Friction Index, Time-to-Value,
 * Implementation Difficulty, and Operational Complexity.
 * Derives metrics from existing governed + intelligence data.
 */

import { memo, useMemo } from "react";
import { Timer, Gauge, Wrench, Layers } from "lucide-react";
import type { CommandDeck } from "@/lib/systemIntelligence";
import type { ExpandedFrictionScore } from "@/lib/frictionEngine";

interface ETAExecutionPanelProps {
  commandDeck: CommandDeck | null;
  expandedFriction: ExpandedFrictionScore | null;
  governedData: Record<string, unknown> | null;
}

interface MetricGauge {
  label: string;
  value: number; // 0-10
  icon: React.ElementType;
  color: string;
  sublabel: string;
}

function GaugeBar({ metric }: { metric: MetricGauge }) {
  const pct = Math.min(100, Math.max(0, metric.value * 10));
  return (
    <div className="flex-1 min-w-[140px] rounded-xl p-4 space-y-2.5"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${metric.color}18` }}
        >
          <metric.icon size={14} style={{ color: metric.color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-foreground leading-tight">{metric.label}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{metric.sublabel}</p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: metric.color }}
          />
        </div>
        <p className="text-right text-[11px] font-bold tabular-nums" style={{ color: metric.color }}>
          {metric.value.toFixed(1)}/10
        </p>
      </div>
    </div>
  );
}

export const ETAExecutionPanel = memo(function ETAExecutionPanel({
  commandDeck,
  expandedFriction,
  governedData,
}: ETAExecutionPanelProps) {
  const metrics = useMemo<MetricGauge[]>(() => {
    // Derive Execution Friction Index from expanded friction scores
    const dims = expandedFriction?.dimensions;
    const frictionAvg = dims
      ? (
          (dims.customerEffort || 0) +
          (dims.timeDelays || 0) +
          (dims.costInefficiency || 0) +
          (dims.processComplexity || 0) +
          (dims.informationAsymmetry || 0) +
          (dims.industryInertia || 0)
        ) / 6
      : expandedFriction?.overall ?? 5;

    // Derive complexity from constraint count + leverage gap
    const constraintCount = commandDeck?.topConstraints.length || 0;
    const leverageCount = commandDeck?.topLeveragePoints.length || 0;
    const implementationDifficulty = Math.min(10, constraintCount * 1.5 + (10 - leverageCount));

    // Time-to-value: inverse of opportunity accessibility
    const opCount = commandDeck?.topOpportunities.length || 0;
    const avgOpImpact = opCount > 0
      ? commandDeck!.topOpportunities.reduce((s, o) => s + o.impact, 0) / opCount
      : 5;
    const timeToValue = Math.min(10, Math.max(2, 12 - avgOpImpact - opCount * 0.3));

    // Operational complexity from dependency structure + constraints
    const fp = governedData?.first_principles as { dependency_structure?: string[]; resource_limits?: string[] } | undefined;
    const depCount = fp?.dependency_structure?.length || 0;
    const resourceCount = fp?.resource_limits?.length || 0;
    const operationalComplexity = Math.min(10, Math.max(2, depCount * 1.2 + resourceCount * 0.8 + constraintCount * 0.5));

    return [
      {
        label: "Execution Friction",
        value: Math.round(frictionAvg * 10) / 10,
        icon: Gauge,
        color: frictionAvg >= 7 ? "hsl(0 70% 50%)" : frictionAvg >= 4 ? "hsl(38 92% 50%)" : "hsl(142 70% 40%)",
        sublabel: frictionAvg >= 7 ? "High resistance" : frictionAvg >= 4 ? "Moderate friction" : "Low friction",
      },
      {
        label: "Time-to-Value",
        value: Math.round(timeToValue * 10) / 10,
        icon: Timer,
        color: timeToValue >= 7 ? "hsl(0 70% 50%)" : timeToValue >= 4 ? "hsl(38 92% 50%)" : "hsl(142 70% 40%)",
        sublabel: timeToValue >= 7 ? "Long runway" : timeToValue >= 4 ? "Medium timeline" : "Quick wins available",
      },
      {
        label: "Implementation Difficulty",
        value: Math.round(implementationDifficulty * 10) / 10,
        icon: Wrench,
        color: implementationDifficulty >= 7 ? "hsl(0 70% 50%)" : implementationDifficulty >= 4 ? "hsl(38 92% 50%)" : "hsl(142 70% 40%)",
        sublabel: implementationDifficulty >= 7 ? "Complex execution" : implementationDifficulty >= 4 ? "Manageable" : "Straightforward",
      },
      {
        label: "Operational Complexity",
        value: Math.round(operationalComplexity * 10) / 10,
        icon: Layers,
        color: operationalComplexity >= 7 ? "hsl(0 70% 50%)" : operationalComplexity >= 4 ? "hsl(38 92% 50%)" : "hsl(142 70% 40%)",
        sublabel: operationalComplexity >= 7 ? "Many dependencies" : operationalComplexity >= 4 ? "Moderate scope" : "Lean operation",
      },
    ];
  }, [commandDeck, expandedFriction, governedData]);

  if (!commandDeck && !expandedFriction) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Gauge size={13} className="text-muted-foreground" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Execution Assessment
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {metrics.map((m) => (
          <GaugeBar key={m.label} metric={m} />
        ))}
      </div>
    </div>
  );
});
