/**
 * Scenario Command Center — Command Deck Section 3
 *
 * Best 3 scenarios: Best Return, Lowest Risk, Highest Feasibility.
 * Each card: projected return, risk score, capital required, overall score.
 * Full comparison matrix below.
 */

import { memo } from "react";
import { FlaskConical, Trophy, TrendingUp, Shield, DollarSign, Zap, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import type { ScenarioComparison, RankedScenario } from "@/lib/scenarioComparisonEngine";

interface ScenarioCommandCenterProps {
  comparison: ScenarioComparison;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n > 0) return `$${n.toFixed(0)}`;
  return "—";
}

function HeroScenarioCard({
  scenario,
  badgeLabel,
  badgeColor,
  index,
}: {
  scenario: RankedScenario;
  badgeLabel: string;
  badgeColor: string;
  index: number;
}) {
  const riskColor = scenario.riskScore <= 3
    ? "hsl(var(--success))"
    : scenario.riskScore <= 6
      ? "hsl(var(--warning))"
      : "hsl(var(--destructive))";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="rounded-xl p-5 space-y-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${badgeColor}06 0%, hsl(var(--card)) 100%)`,
        border: `1.5px solid ${badgeColor}20`,
      }}
    >
      {/* Badge */}
      <div className="flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-full"
          style={{ background: `${badgeColor}12`, color: badgeColor }}
        >
          <Trophy size={10} /> {badgeLabel}
        </span>
        <span
          className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
          style={{
            background: scenario.strategicImpact === "high" ? "hsl(var(--success) / 0.1)" : "hsl(var(--muted))",
            color: scenario.strategicImpact === "high" ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
          }}
        >
          {scenario.strategicImpact}
        </span>
      </div>

      {/* Title */}
      <div>
        <p className="text-sm font-bold text-foreground leading-snug">{scenario.scenarioName}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{scenario.toolId.replace(/-/g, " ")}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-3 text-center" style={{ background: "hsl(var(--muted) / 0.5)" }}>
          <TrendingUp size={13} className="mx-auto mb-1.5" style={{ color: "hsl(var(--success))" }} />
          <p className="text-xl font-extrabold tabular-nums text-foreground leading-none">
            {scenario.projectedReturn > 0 ? `${scenario.projectedReturn.toFixed(1)}%` : "—"}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Projected Return</p>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: "hsl(var(--muted) / 0.5)" }}>
          <Shield size={13} className="mx-auto mb-1.5" style={{ color: riskColor }} />
          <p className="text-xl font-extrabold tabular-nums text-foreground leading-none">
            {scenario.riskScore.toFixed(1)}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Risk Score</p>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: "hsl(var(--muted) / 0.5)" }}>
          <DollarSign size={13} className="mx-auto mb-1.5" style={{ color: "hsl(var(--warning))" }} />
          <p className="text-xl font-extrabold tabular-nums text-foreground leading-none">
            {formatCurrency(scenario.capitalRequired)}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Capital Req.</p>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: "hsl(var(--muted) / 0.5)" }}>
          <BarChart3 size={13} className="mx-auto mb-1.5" style={{ color: "hsl(var(--primary))" }} />
          <p className="text-xl font-extrabold tabular-nums text-foreground leading-none">
            {scenario.overallScore.toFixed(1)}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Overall Score</p>
        </div>
      </div>
    </motion.div>
  );
}

export const ScenarioCommandCenter = memo(function ScenarioCommandCenter({
  comparison,
}: ScenarioCommandCenterProps) {
  const { bestReturnScenario, lowestRiskScenario, highestFeasibilityScenario, scenarios, comparisonMatrix } = comparison;

  // Deduplicate hero cards
  const heroCards: { scenario: RankedScenario; label: string; color: string }[] = [];
  const usedIds = new Set<string>();

  if (bestReturnScenario && !usedIds.has(bestReturnScenario.scenarioId)) {
    heroCards.push({ scenario: bestReturnScenario, label: "Best Return", color: "hsl(var(--success))" });
    usedIds.add(bestReturnScenario.scenarioId);
  }
  if (lowestRiskScenario && !usedIds.has(lowestRiskScenario.scenarioId)) {
    heroCards.push({ scenario: lowestRiskScenario, label: "Lowest Risk", color: "hsl(var(--primary))" });
    usedIds.add(lowestRiskScenario.scenarioId);
  }
  if (highestFeasibilityScenario && !usedIds.has(highestFeasibilityScenario.scenarioId)) {
    heroCards.push({ scenario: highestFeasibilityScenario, label: "Highest Feasibility", color: "hsl(172 66% 50%)" });
    usedIds.add(highestFeasibilityScenario.scenarioId);
  }

  if (heroCards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      {/* Header */}
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(172 66% 50% / 0.12)" }}>
          <FlaskConical size={13} style={{ color: "hsl(172 66% 50%)" }} />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Scenario Command Center</p>
          <p className="text-[10px] text-muted-foreground">{scenarios.length} scenarios analyzed</p>
        </div>
      </div>

      {/* Hero scenario cards */}
      <div className="p-5">
        <div className={`grid grid-cols-1 ${heroCards.length >= 3 ? "md:grid-cols-3" : heroCards.length === 2 ? "md:grid-cols-2" : ""} gap-4`}>
          {heroCards.map((hc, i) => (
            <HeroScenarioCard
              key={hc.scenario.scenarioId}
              scenario={hc.scenario}
              badgeLabel={hc.label}
              badgeColor={hc.color}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Comparison Matrix */}
      {scenarios.length > 1 && comparisonMatrix.length > 0 && (
        <div className="border-t border-border">
          <div className="px-5 py-3">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Full Comparison Matrix</p>
          </div>
          <div className="overflow-x-auto pb-4 px-5">
            <table className="w-full text-xs min-w-[400px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2.5 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Metric</th>
                  {scenarios.slice(0, 5).map(s => (
                    <th key={s.scenarioId} className="text-center px-3 py-2.5 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground max-w-[140px] truncate">
                      {s.scenarioName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonMatrix.map(row => (
                  <tr key={row.metric} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-foreground whitespace-nowrap">{row.metric}</td>
                    {row.values.slice(0, 5).map(v => (
                      <td
                        key={v.scenarioId}
                        className="text-center px-3 py-2.5 font-extrabold tabular-nums"
                        style={{
                          color: v.isBest ? "hsl(var(--success))" : "hsl(var(--foreground))",
                          background: v.isBest ? "hsl(var(--success) / 0.04)" : "transparent",
                        }}
                      >
                        {typeof v.value === "number"
                          ? v.value >= 10000 ? formatCurrency(v.value) : v.value.toFixed(1)
                          : v.value}
                        {v.isBest && <Trophy size={8} className="inline ml-1" style={{ color: "hsl(var(--success))" }} />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
});
