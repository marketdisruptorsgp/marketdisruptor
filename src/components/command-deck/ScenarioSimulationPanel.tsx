/**
 * Scenario Simulation Panel — Command Deck Module 5
 *
 * Displays scenario comparison cards with projected return,
 * risk level, capital required, feasibility score.
 * Side-by-side comparison when multiple scenarios exist.
 */

import { memo } from "react";
import { FlaskConical, Trophy, Shield, Zap, DollarSign, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import type { ScenarioComparison, RankedScenario } from "@/lib/scenarioComparisonEngine";
import type { SensitivityReport, RiskFactor } from "@/lib/sensitivityEngine";

interface ScenarioSimulationPanelProps {
  comparison: ScenarioComparison | null;
  sensitivityReports: SensitivityReport[];
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n > 0) return `$${n.toFixed(0)}`;
  return "—";
}

function BestBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
      style={{ background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))" }}
    >
      <Trophy size={8} /> {label}
    </span>
  );
}

function ScenarioCard({
  scenario,
  isBestReturn,
  isBestRisk,
  isBestFeasibility,
  index,
}: {
  scenario: RankedScenario;
  isBestReturn: boolean;
  isBestRisk: boolean;
  isBestFeasibility: boolean;
  index: number;
}) {
  const impactColor = scenario.strategicImpact === "high"
    ? "hsl(var(--success))"
    : scenario.strategicImpact === "medium"
      ? "hsl(var(--warning))"
      : "hsl(var(--muted-foreground))";

  const riskColor = scenario.riskScore <= 3
    ? "hsl(var(--success))"
    : scenario.riskScore <= 6
      ? "hsl(var(--warning))"
      : "hsl(var(--destructive))";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="rounded-xl p-4 space-y-3"
      style={{
        background: "hsl(var(--muted) / 0.4)",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-foreground leading-snug">{scenario.scenarioName}</p>
          <span
            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: `${impactColor}12`, color: impactColor }}
          >
            {scenario.strategicImpact}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">{scenario.toolId.replace(/-/g, " ")}</p>
        <div className="flex flex-wrap gap-1">
          {isBestReturn && <BestBadge label="Best Return" />}
          {isBestRisk && <BestBadge label="Lowest Risk" />}
          {isBestFeasibility && <BestBadge label="Most Feasible" />}
        </div>
      </div>

      {/* Qualitative assessment grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-2.5 text-center" style={{ background: "hsl(var(--background))" }}>
          <TrendingUp size={12} className="mx-auto mb-1" style={{ color: "hsl(var(--success))" }} />
          <p className="text-sm font-extrabold text-foreground leading-none">
            {scenario.projectedReturn > 15 ? "High Potential" : scenario.projectedReturn > 5 ? "Moderate" : scenario.projectedReturn > 0 ? "Incremental" : "—"}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Return Potential</p>
        </div>
        <div className="rounded-lg p-2.5 text-center" style={{ background: "hsl(var(--background))" }}>
          <Shield size={12} className="mx-auto mb-1" style={{ color: riskColor }} />
          <p className="text-sm font-extrabold text-foreground leading-none">
            {scenario.riskScore <= 3 ? "Low Risk" : scenario.riskScore <= 6 ? "Moderate Risk" : "High Risk"}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Risk Level</p>
        </div>
        <div className="rounded-lg p-2.5 text-center" style={{ background: "hsl(var(--background))" }}>
          <DollarSign size={12} className="mx-auto mb-1" style={{ color: "hsl(var(--warning))" }} />
          <p className="text-sm font-extrabold text-foreground leading-none">
            {formatCurrency(scenario.capitalRequired)}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Capital Req.</p>
        </div>
        <div className="rounded-lg p-2.5 text-center" style={{ background: "hsl(var(--background))" }}>
          <Zap size={12} className="mx-auto mb-1" style={{ color: "hsl(var(--primary))" }} />
          <p className="text-sm font-extrabold text-foreground leading-none">
            {scenario.feasibilityScore >= 7 ? "Highly Feasible" : scenario.feasibilityScore >= 4 ? "Feasible" : "Challenging"}
          </p>
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Feasibility</p>
        </div>
      </div>

      {/* Strategic assessment */}
      <div className="flex items-center justify-between px-2 py-2 rounded-lg" style={{ background: "hsl(var(--primary) / 0.05)" }}>
        <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
          Strategic Assessment
        </span>
        <span className="text-sm font-extrabold" style={{ color: "hsl(var(--primary))" }}>
          {scenario.overallScore >= 7 ? "Strong Opportunity" : scenario.overallScore >= 4 ? "Worth Exploring" : "Needs Validation"}
        </span>
      </div>
    </motion.div>
  );
}

function RiskIntelligenceStrip({ reports }: { reports: SensitivityReport[] }) {
  const allRisks = reports.flatMap(r => r.riskFactors).slice(0, 5);
  if (allRisks.length === 0) return null;

  const severityColor: Record<string, string> = {
    critical: "hsl(var(--destructive))",
    high: "hsl(0 72% 52%)",
    moderate: "hsl(var(--warning))",
    low: "hsl(var(--success))",
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center gap-1.5">
        <AlertTriangle size={12} style={{ color: "hsl(var(--destructive))" }} />
        <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--destructive))" }}>
          Risk Intelligence
        </p>
      </div>
      {allRisks.map((risk, i) => (
        <div
          key={i}
          className="flex items-start gap-2.5 px-3 py-2 rounded-lg"
          style={{ background: `${severityColor[risk.severity]}06`, border: `1px solid ${severityColor[risk.severity]}15` }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
            style={{ background: severityColor[risk.severity] }}
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground leading-snug">{risk.label}</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{risk.description}</p>
          </div>
          <span
            className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: `${severityColor[risk.severity]}12`, color: severityColor[risk.severity] }}
          >
            {risk.severity}
          </span>
        </div>
      ))}
    </div>
  );
}

export const ScenarioSimulationPanel = memo(function ScenarioSimulationPanel({
  comparison,
  sensitivityReports,
}: ScenarioSimulationPanelProps) {
  const hasScenarios = comparison && comparison.scenarios.length > 0;
  const hasRisks = sensitivityReports.some(r => r.riskFactors.length > 0);

  if (!hasScenarios && !hasRisks) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(172 66% 50% / 0.12)" }}>
            <FlaskConical size={13} style={{ color: "hsl(172 66% 50%)" }} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Scenario Simulation</p>
            <p className="text-[10px] text-muted-foreground">
              {hasScenarios ? `${comparison!.scenarios.length} scenarios compared` : "Risk intelligence"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Scenario cards — side by side */}
        {hasScenarios && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {comparison!.scenarios.slice(0, 6).map((s, i) => (
              <ScenarioCard
                key={s.scenarioId}
                scenario={s}
                index={i}
                isBestReturn={comparison!.bestReturnScenario?.scenarioId === s.scenarioId}
                isBestRisk={comparison!.lowestRiskScenario?.scenarioId === s.scenarioId}
                isBestFeasibility={comparison!.highestFeasibilityScenario?.scenarioId === s.scenarioId}
              />
            ))}
          </div>
        )}

        {/* Comparison matrix summary */}
        {hasScenarios && comparison!.scenarios.length > 1 && (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
            <div className="px-3 py-2" style={{ background: "hsl(var(--muted) / 0.5)" }}>
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Comparison Matrix</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-3 py-2 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Metric</th>
                    {comparison!.scenarios.slice(0, 4).map(s => (
                      <th key={s.scenarioId} className="text-center px-3 py-2 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground truncate max-w-[120px]">
                        {s.scenarioName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison!.comparisonMatrix.map(row => (
                    <tr key={row.metric} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-bold text-foreground">{row.metric}</td>
                      {row.values.slice(0, 4).map(v => (
                        <td
                          key={v.scenarioId}
                          className="text-center px-3 py-2 font-extrabold tabular-nums"
                          style={{
                            color: v.isBest ? "hsl(var(--success))" : "hsl(var(--foreground))",
                            background: v.isBest ? "hsl(var(--success) / 0.04)" : "transparent",
                          }}
                        >
                          {typeof v.value === "number"
                            ? v.value >= 1000 ? formatCurrency(v.value) : v.value.toFixed(1)
                            : v.value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Risk Intelligence */}
        {hasRisks && <RiskIntelligenceStrip reports={sensitivityReports} />}
      </div>
    </motion.div>
  );
});
