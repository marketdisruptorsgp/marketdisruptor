/**
 * Strategic Summary Triad — Command Deck Section 1
 *
 * Three hero insight cards: Best Opportunity, Best Scenario, Largest Risk.
 * No numeric scores — uses qualitative evidence strength labels.
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
  evidenceLevel: "strong" | "moderate" | "early";
  icon: React.ElementType;
  accentColor: string;
  bgGradient: string;
}

function EvidenceIndicator({ level }: { level: "strong" | "moderate" | "early" }) {
  const config = {
    strong: { color: "hsl(var(--success))", label: "Strong Evidence", dots: 3 },
    moderate: { color: "hsl(var(--warning))", label: "Moderate Evidence", dots: 2 },
    early: { color: "hsl(var(--destructive))", label: "Early Signal", dots: 1 },
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

function qualLabel(score: number): string {
  if (score >= 7) return "Strong";
  if (score >= 4) return "Moderate";
  return "Limited";
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
      const evLevel = bestOpp.confidence === "high" ? "strong" : bestOpp.confidence === "medium" ? "moderate" : "early";
      result.push({
        title: bestOpp.label,
        description: `${qualLabel(bestOpp.impact)} impact · ${bestOpp.source} · ${bestOpp.riskLevel || "moderate"} risk`,
        metric: qualLabel(bestOpp.impact),
        metricLabel: "Impact Strength",
        evidenceLevel: evLevel,
        icon: Lightbulb,
        accentColor: "hsl(var(--success))",
        bgGradient: "linear-gradient(135deg, hsl(var(--success) / 0.06) 0%, hsl(var(--card)) 100%)",
      });
    }

    // Card 2: Best Scenario
    const bestScenario = scenarioComparison?.bestReturnScenario;
    if (bestScenario) {
      const evLevel = bestScenario.feasibilityScore >= 7 ? "strong" : bestScenario.feasibilityScore >= 4 ? "moderate" : "early";
      result.push({
        title: bestScenario.scenarioName,
        description: `${bestScenario.toolId.replace(/-/g, " ")} · ${bestScenario.riskScore >= 7 ? "High" : bestScenario.riskScore >= 4 ? "Moderate" : "Low"} risk`,
        metric: bestScenario.projectedReturn > 0 ? `${bestScenario.projectedReturn.toFixed(0)}%` : qualLabel(bestScenario.overallScore),
        metricLabel: bestScenario.projectedReturn > 0 ? "Projected Return" : "Potential",
        evidenceLevel: evLevel,
        icon: FlaskConical,
        accentColor: "hsl(172 66% 50%)",
        bgGradient: "linear-gradient(135deg, hsl(172 66% 50% / 0.06) 0%, hsl(var(--card)) 100%)",
      });
    } else {
      // Fallback: Strategic potential card
      const potentialLevel = strategicPotential >= 7 ? "strong" : strategicPotential >= 4 ? "moderate" : "early";
      result.push({
        title: "Strategic Potential",
        description: `${metrics.totalEvidenceCount} evidence signals · ${metrics.opportunitiesIdentified} opportunities`,
        metric: qualLabel(strategicPotential),
        metricLabel: "Potential",
        evidenceLevel: potentialLevel,
        icon: TrendingUp,
        accentColor: "hsl(var(--primary))",
        bgGradient: "linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--card)) 100%)",
      });
    }

    // Card 3: Largest Risk
    const allRisks = sensitivityReports.flatMap(r => r.riskFactors);
    const criticalRisk = allRisks.find(r => r.severity === "critical") || allRisks.find(r => r.severity === "high") || allRisks[0];
    if (criticalRisk) {
      const evLevel = criticalRisk.severity === "critical" ? "strong" : criticalRisk.severity === "high" ? "strong" : "moderate";
      result.push({
        title: criticalRisk.label,
        description: criticalRisk.description,
        metric: criticalRisk.severity === "critical" ? "CRITICAL" : criticalRisk.severity === "high" ? "HIGH" : "MODERATE",
        metricLabel: "Risk Severity",
        evidenceLevel: evLevel,
        icon: AlertTriangle,
        accentColor: "hsl(var(--destructive))",
        bgGradient: "linear-gradient(135deg, hsl(var(--destructive) / 0.06) 0%, hsl(var(--card)) 100%)",
      });
    } else {
      // Fallback: friction-based risk
      const riskLabel = metrics.frictionIndex >= 6 ? "High" : metrics.riskScore >= 5 ? "Elevated" : "Moderate";
      result.push({
        title: metrics.frictionIndex >= 6 ? "High System Friction" : metrics.riskScore >= 5 ? "Elevated Execution Risk" : "Risk Profile",
        description: `${metrics.constraintsDetected} constraints · ${metrics.riskSignals} risk signals`,
        metric: riskLabel,
        metricLabel: "Risk Level",
        evidenceLevel: metrics.riskSignals >= 3 ? "strong" : "moderate",
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
              <EvidenceIndicator level={card.evidenceLevel} />
            </div>

            {/* Primary metric */}
            <div>
              <p className="text-2xl font-extrabold text-foreground leading-none">
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
