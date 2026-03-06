/**
 * Strategic Summary Triad — Command Deck Section 1
 *
 * Three hero insight cards: Best Opportunity, Best Scenario, Largest Risk.
 * Each card shows title, description, primary metric, confidence score.
 * Pulls from scoring engine + scenario comparison engine.
 */

import { memo, useMemo } from "react";
import { Lightbulb, FlaskConical, AlertTriangle, TrendingUp, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { AggregatedOpportunity, CommandDeckMetrics } from "@/lib/commandDeckMetrics";
import type { ScenarioComparison } from "@/lib/scenarioComparisonEngine";
import type { SensitivityReport } from "@/lib/sensitivityEngine";

interface StrategicSummaryTriadProps {
  metrics: CommandDeckMetrics;
  opportunities: AggregatedOpportunity[];
  scenarioComparison: ScenarioComparison | null;
  sensitivityReports: SensitivityReport[];
  strategicPotential: number;
}

interface TriadCard {
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  confidence: "high" | "medium" | "low";
  icon: React.ElementType;
  accentColor: string;
  bgGradient: string;
}

function ConfidenceIndicator({ level }: { level: "high" | "medium" | "low" }) {
  const config = {
    high: { color: "hsl(var(--success))", label: "High Confidence", dots: 3 },
    medium: { color: "hsl(var(--warning))", label: "Medium Confidence", dots: 2 },
    low: { color: "hsl(var(--destructive))", label: "Low Confidence", dots: 1 },
  };
  const { color, label, dots } = config[level];
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3].map(d => (
          <div
            key={d}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: d <= dots ? color : "hsl(var(--muted))" }}
          />
        ))}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

export const StrategicSummaryTriad = memo(function StrategicSummaryTriad({
  metrics,
  opportunities,
  scenarioComparison,
  sensitivityReports,
  strategicPotential,
}: StrategicSummaryTriadProps) {
  const cards: TriadCard[] = useMemo(() => {
    const result: TriadCard[] = [];

    // Card 1: Best Opportunity
    const bestOpp = opportunities[0];
    if (bestOpp) {
      const confLevel = bestOpp.confidence === "high" ? "high" : bestOpp.confidence === "medium" ? "medium" : "low";
      result.push({
        title: bestOpp.label,
        description: `Impact ${bestOpp.impact}/10 · ${bestOpp.source} · ${bestOpp.riskLevel || "moderate"} risk`,
        metric: (bestOpp.opportunityScore ?? 0).toFixed(1),
        metricLabel: "Opportunity Score",
        confidence: confLevel as "high" | "medium" | "low",
        icon: Lightbulb,
        accentColor: "hsl(var(--success))",
        bgGradient: "linear-gradient(135deg, hsl(var(--success) / 0.06) 0%, hsl(var(--card)) 100%)",
      });
    }

    // Card 2: Best Scenario
    const bestScenario = scenarioComparison?.bestReturnScenario;
    if (bestScenario) {
      const confLevel = bestScenario.feasibilityScore >= 7 ? "high" : bestScenario.feasibilityScore >= 4 ? "medium" : "low";
      result.push({
        title: bestScenario.scenarioName,
        description: `${bestScenario.toolId.replace(/-/g, " ")} · Risk ${bestScenario.riskScore.toFixed(1)}/10`,
        metric: bestScenario.projectedReturn > 0 ? `${bestScenario.projectedReturn.toFixed(1)}%` : bestScenario.overallScore.toFixed(1),
        metricLabel: bestScenario.projectedReturn > 0 ? "Projected Return" : "Overall Score",
        confidence: confLevel as "high" | "medium" | "low",
        icon: FlaskConical,
        accentColor: "hsl(172 66% 50%)",
        bgGradient: "linear-gradient(135deg, hsl(172 66% 50% / 0.06) 0%, hsl(var(--card)) 100%)",
      });
    } else {
      // Fallback: Strategic potential card
      result.push({
        title: "Strategic Potential",
        description: `${metrics.totalEvidenceCount} evidence signals · ${metrics.opportunitiesIdentified} opportunities`,
        metric: strategicPotential.toFixed(1),
        metricLabel: "Potential Score",
        confidence: metrics.totalEvidenceCount >= 15 ? "high" : metrics.totalEvidenceCount >= 5 ? "medium" : "low",
        icon: TrendingUp,
        accentColor: "hsl(var(--primary))",
        bgGradient: "linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--card)) 100%)",
      });
    }

    // Card 3: Largest Risk
    const allRisks = sensitivityReports.flatMap(r => r.riskFactors);
    const criticalRisk = allRisks.find(r => r.severity === "critical") || allRisks.find(r => r.severity === "high") || allRisks[0];
    if (criticalRisk) {
      const confLevel = criticalRisk.severity === "critical" ? "high" : criticalRisk.severity === "high" ? "high" : "medium";
      result.push({
        title: criticalRisk.label,
        description: criticalRisk.description,
        metric: criticalRisk.severity.toUpperCase(),
        metricLabel: "Risk Severity",
        confidence: confLevel as "high" | "medium" | "low",
        icon: AlertTriangle,
        accentColor: "hsl(var(--destructive))",
        bgGradient: "linear-gradient(135deg, hsl(var(--destructive) / 0.06) 0%, hsl(var(--card)) 100%)",
      });
    } else {
      // Fallback: friction-based risk
      result.push({
        title: metrics.frictionIndex >= 6 ? "High System Friction" : metrics.riskScore >= 5 ? "Elevated Execution Risk" : "Risk Profile",
        description: `${metrics.constraintsDetected} constraints · ${metrics.riskSignals} risk signals · friction index ${metrics.frictionIndex.toFixed(1)}`,
        metric: metrics.riskScore.toFixed(1),
        metricLabel: "Risk Score",
        confidence: metrics.riskSignals >= 3 ? "high" : "medium",
        icon: Shield,
        accentColor: "hsl(var(--destructive))",
        bgGradient: "linear-gradient(135deg, hsl(var(--destructive) / 0.06) 0%, hsl(var(--card)) 100%)",
      });
    }

    return result;
  }, [opportunities, scenarioComparison, sensitivityReports, metrics, strategicPotential]);

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, i) => {
        const CardIcon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="rounded-2xl p-5 space-y-4 relative overflow-hidden"
            style={{
              background: card.bgGradient,
              border: `1.5px solid ${card.accentColor}20`,
              boxShadow: `0 4px 24px ${card.accentColor}08`,
            }}
          >
            {/* Icon badge */}
            <div className="flex items-center justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${card.accentColor}12` }}
              >
                <CardIcon size={18} style={{ color: card.accentColor }} />
              </div>
              <ConfidenceIndicator level={card.confidence} />
            </div>

            {/* Primary metric */}
            <div>
              <p className="text-3xl font-extrabold tabular-nums text-foreground leading-none">
                {card.metric}
              </p>
              <p className="text-[9px] font-extrabold uppercase tracking-widest mt-1" style={{ color: card.accentColor }}>
                {card.metricLabel}
              </p>
            </div>

            {/* Title + Description */}
            <div>
              <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">{card.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{card.description}</p>
            </div>

            {/* Decorative corner glow */}
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none"
              style={{ background: `${card.accentColor}06` }}
            />
          </motion.div>
        );
      })}
    </div>
  );
});
