/**
 * Risk Intelligence Panel — Command Deck Section 4
 *
 * Renders sensitivity analysis results as severity-coded risk cards.
 * Each card: variable, impact threshold, severity, affected metric.
 * Green=safe, Yellow=warning, Red=critical. Sorted by severity.
 */

import { memo, useMemo } from "react";
import { AlertTriangle, ShieldAlert, TrendingDown, Activity, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { SensitivityReport, SensitivityVariable, SensitivityImpact, RiskFactor } from "@/lib/sensitivityEngine";

interface RiskIntelligencePanelProps {
  sensitivityReports: SensitivityReport[];
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  critical: {
    color: "hsl(var(--destructive))",
    bg: "hsl(var(--destructive) / 0.06)",
    border: "hsl(var(--destructive) / 0.2)",
    icon: ShieldAlert,
    label: "Critical",
  },
  high: {
    color: "hsl(0 72% 52%)",
    bg: "hsl(0 72% 52% / 0.06)",
    border: "hsl(0 72% 52% / 0.2)",
    icon: AlertTriangle,
    label: "High",
  },
  moderate: {
    color: "hsl(var(--warning))",
    bg: "hsl(var(--warning) / 0.06)",
    border: "hsl(var(--warning) / 0.2)",
    icon: Activity,
    label: "Warning",
  },
  low: {
    color: "hsl(var(--success))",
    bg: "hsl(var(--success) / 0.06)",
    border: "hsl(var(--success) / 0.2)",
    icon: CheckCircle2,
    label: "Safe",
  },
};

const IMPACT_SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: "hsl(var(--destructive))", label: "CRITICAL" },
  warning: { color: "hsl(var(--warning))", label: "WARNING" },
  neutral: { color: "hsl(var(--muted-foreground))", label: "NEUTRAL" },
  positive: { color: "hsl(var(--success))", label: "POSITIVE" },
};

interface RiskCard {
  id: string;
  scenarioName: string;
  variableName: string;
  baseValue: number;
  unit: string;
  worstImpact: SensitivityImpact;
  riskFactor: RiskFactor | null;
  sortOrder: number;
}

export const RiskIntelligencePanel = memo(function RiskIntelligencePanel({
  sensitivityReports,
}: RiskIntelligencePanelProps) {
  const riskCards = useMemo(() => {
    const cards: RiskCard[] = [];
    const severityOrder: Record<string, number> = { critical: 0, high: 1, moderate: 2, low: 3 };

    for (const report of sensitivityReports) {
      for (const variable of report.variables) {
        // Find worst impact
        const impacts = variable.impacts.filter(i => i.severity !== "positive");
        const worstImpact = impacts.sort((a, b) => {
          const order: Record<string, number> = { critical: 0, warning: 1, neutral: 2, positive: 3 };
          return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
        })[0];

        if (!worstImpact) continue;

        const matchingRisk = report.riskFactors.find(r =>
          r.label.toLowerCase().includes(variable.variableName.toLowerCase())
        );

        const severity = worstImpact.severity === "critical" ? "critical"
          : worstImpact.severity === "warning" ? "moderate"
          : "low";

        cards.push({
          id: `${report.scenarioId}-${variable.variableName}`,
          scenarioName: report.scenarioName,
          variableName: variable.variableName,
          baseValue: variable.baseValue,
          unit: variable.unit,
          worstImpact,
          riskFactor: matchingRisk ?? null,
          sortOrder: severityOrder[severity] ?? 3,
        });
      }
    }

    return cards.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [sensitivityReports]);

  if (riskCards.length === 0) return null;

  const criticalCount = riskCards.filter(c => c.worstImpact.severity === "critical").length;
  const warningCount = riskCards.filter(c => c.worstImpact.severity === "warning").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--destructive) / 0.12)" }}>
            <ShieldAlert size={13} style={{ color: "hsl(var(--destructive))" }} />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Risk Intelligence</p>
            <p className="text-[10px] text-muted-foreground">Sensitivity analysis across {sensitivityReports.length} scenarios</p>
          </div>
        </div>
        {/* Severity summary */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}>
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--warning) / 0.1)", color: "hsl(var(--warning))" }}>
              {warningCount} warning
            </span>
          )}
        </div>
      </div>

      {/* Risk Cards */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {riskCards.slice(0, 8).map((card, i) => {
          const impactConfig = IMPACT_SEVERITY_CONFIG[card.worstImpact.severity] || IMPACT_SEVERITY_CONFIG.neutral;
          const severity = card.worstImpact.severity === "critical" ? "critical"
            : card.worstImpact.severity === "warning" ? "moderate"
            : "low";
          const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.low;
          const SevIcon = config.icon;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="rounded-xl p-4 space-y-3"
              style={{
                background: config.bg,
                border: `1px solid ${config.border}`,
              }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SevIcon size={14} style={{ color: config.color }} />
                  <span className="text-sm font-bold text-foreground">{card.variableName}</span>
                </div>
                <span
                  className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full"
                  style={{ background: `${impactConfig.color}15`, color: impactConfig.color }}
                >
                  {impactConfig.label}
                </span>
              </div>

              {/* Impact detail */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Threshold</span>
                  <span className="font-bold text-foreground">{card.worstImpact.changeLabel}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Affected Metric</span>
                  <span className="font-bold text-foreground">{card.worstImpact.resultMetric}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Impact</span>
                  <span className="font-bold tabular-nums" style={{ color: impactConfig.color }}>
                    {card.unit === "$" ? `$${card.worstImpact.adjustedValue.toLocaleString()}` : `${card.worstImpact.adjustedValue.toFixed(2)}${card.unit}`}
                    {" → "}
                    {card.worstImpact.resultValue.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Risk factor description */}
              {card.riskFactor && (
                <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-border pt-2 mt-1">
                  {card.riskFactor.description}
                </p>
              )}

              {/* Scenario label */}
              <p className="text-[9px] font-bold text-muted-foreground">
                Scenario: {card.scenarioName}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Global risk factors summary */}
      {sensitivityReports.some(r => r.riskFactors.length > 0) && (
        <div className="px-5 pb-4">
          <div className="rounded-xl p-4 space-y-2" style={{ background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Key Risk Factors</p>
            {sensitivityReports
              .flatMap(r => r.riskFactors)
              .slice(0, 5)
              .map((rf, i) => {
                const rfConfig = SEVERITY_CONFIG[rf.severity] || SEVERITY_CONFIG.moderate;
                return (
                  <div key={i} className="flex items-start gap-2 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: rfConfig.color }} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">{rf.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{rf.description}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </motion.div>
  );
});
