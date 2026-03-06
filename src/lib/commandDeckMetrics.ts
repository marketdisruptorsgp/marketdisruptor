/**
 * COMMAND DECK METRICS — Evidence-First Architecture
 *
 * All metrics derive from Evidence objects.
 * No synthetic scores. Every number traces to evidence items.
 */

import type {
  Evidence,
  EvidenceTier,
  EvidenceMode,
  MetricDomain,
  MetricEvidence,
} from "@/lib/evidenceEngine";
import { flattenEvidence } from "@/lib/evidenceEngine";
import type { SystemIntelligence } from "@/lib/systemIntelligence";

// ═══════════════════════════════════════════════════════════════
//  INPUT / OUTPUT TYPES
// ═══════════════════════════════════════════════════════════════

export interface CommandDeckMetricsInput {
  products: any[];
  selectedProduct: any | null;
  disruptData: any | null;
  redesignData: any | null;
  stressTestData: any | null;
  pitchDeckData: any | null;
  governedData: Record<string, unknown> | null;
  businessAnalysisData: any | null;
  intelligence: SystemIntelligence | null;
  completedSteps: Set<string>;
  /** Canonical evidence (preferred path) */
  evidence?: Record<MetricDomain, MetricEvidence>;
}

export interface CommandDeckMetrics {
  opportunitiesIdentified: number;
  constraintsDetected: number;
  assumptionsChallenged: number;
  leveragePoints: number;
  riskSignals: number;
  frictionSignals: number;
  pipelineCompletion: number;
  contributingSources: string[];
  isPartial: boolean;
  stepSignals: StepSignalCount[];
  tierBreakdown: Record<EvidenceTier, number>;
  modeBreakdown: Record<EvidenceMode, number>;
  totalEvidenceCount: number;
  // Legacy compat
  opportunityScore: number;
  frictionIndex: number;
  constraintsCount: number;
  leverageScore: number;
  riskScore: number;
}

export interface StepSignalCount {
  step: string;
  key: string;
  signals: number;
  hasData: boolean;
  breakdown: { label: string; count: number; color: string }[];
}

export interface TrendDataPoint {
  step: string;
  score: number;
  hasData: boolean;
}

export interface AggregatedOpportunity {
  id: string;
  label: string;
  impact: number;
  confidence: string;
  step: string;
  source: string;
  tier?: EvidenceTier;
  mode?: EvidenceMode;
  opportunityScore?: number;
  simulationCount?: number;
  riskLevel?: "low" | "moderate" | "high";
  // Multi-factor scoring components
  marketAttractiveness?: number;
  structuralAdvantage?: number;
  simulationFeasibility?: number;
  strategicLeverage?: number;
  executionDifficulty?: number;
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function safeLen(arr: unknown): number {
  return Array.isArray(arr) ? arr.length : 0;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

const STEP_MAP: Record<string, string> = {
  report: "Report", disrupt: "Disrupt", redesign: "Redesign",
  stress_test: "Stress Test", pitch: "Pitch",
};

// ═══════════════════════════════════════════════════════════════
//  MAIN — Evidence-First Metrics
// ═══════════════════════════════════════════════════════════════

export function computeCommandDeckMetrics(input: CommandDeckMetricsInput): CommandDeckMetrics {
  const { completedSteps, evidence } = input;

  // If canonical evidence is provided, use it
  if (evidence) {
    return computeFromEvidence(evidence, completedSteps);
  }

  // Fallback to legacy extraction
  return computeFromLegacy(input);
}

function computeFromEvidence(
  evidence: Record<MetricDomain, MetricEvidence>,
  completedSteps: Set<string>,
): CommandDeckMetrics {
  const all = flattenEvidence(evidence);

  const opportunities = evidence.opportunity.items;
  const constraints = evidence.constraint.items;
  const friction = evidence.friction.items;
  const leverage = evidence.leverage.items;
  const risk = evidence.risk.items;

  // Tier breakdown
  const tierBreakdown: Record<EvidenceTier, number> = { structural: 0, system: 0, optimization: 0 };
  const modeBreakdown: Record<EvidenceMode, number> = { product: 0, service: 0, business_model: 0 };
  all.forEach(e => {
    tierBreakdown[e.tier]++;
    if (e.mode) modeBreakdown[e.mode]++;
  });

  // Per-step signal counts
  const stepCounts: Record<string, Evidence[]> = {};
  all.forEach(e => {
    if (!stepCounts[e.pipelineStep]) stepCounts[e.pipelineStep] = [];
    stepCounts[e.pipelineStep].push(e);
  });

  const sources = Object.keys(stepCounts);

  const stepSignals: StepSignalCount[] = [
    buildStepSignals("Report", "report", stepCounts["report"] || [], completedSteps),
    buildStepSignals("Disrupt", "disrupt", stepCounts["disrupt"] || [], completedSteps),
    buildStepSignals("Redesign", "redesign", stepCounts["redesign"] || [], completedSteps),
    buildStepSignals("Stress Test", "stress_test", stepCounts["stress_test"] || [], completedSteps),
    buildStepSignals("Pitch", "pitch", stepCounts["pitch"] || [], completedSteps),
  ];

  const pipelineCompletion = Math.round((completedSteps.size / 5) * 100);
  const assumptions = all.filter(e => e.type === "assumption");

  // Legacy compat scores derived from multi-factor evidence analysis
  const avgImpact = all.length > 0 ? all.reduce((s, e) => s + (e.impact ?? 5), 0) / all.length : 0;
  const avgConfidence = all.length > 0 ? all.reduce((s, e) => s + (e.confidenceScore ?? 0.5), 0) / all.length : 0;
  const evidenceDiversity = new Set(all.map(e => e.type)).size;
  const tierCoverage = Object.values(tierBreakdown).filter(v => v > 0).length;

  // Multi-factor opportunity score
  const oppImpactFactor = opportunities.length > 0
    ? opportunities.reduce((s, e) => s + (e.impact ?? 5), 0) / opportunities.length / 10
    : 0;
  const oppVolumeFactor = Math.min(opportunities.length / 8, 1);
  const diversityBonus = Math.min(evidenceDiversity / 6, 1) * 0.15;
  const opportunityScore = clamp(Math.round(
    (oppImpactFactor * 0.4 + oppVolumeFactor * 0.3 + avgConfidence * 0.15 + diversityBonus) * 10
  ), 0, 10);

  // Multi-factor friction index
  const frictionImpactFactor = friction.length > 0
    ? friction.reduce((s, e) => s + (e.impact ?? 5), 0) / friction.length / 10
    : 0;
  const frictionVolumeFactor = Math.min(friction.length / 6, 1);
  const frictionIndex = clamp(Math.round(
    (frictionImpactFactor * 0.5 + frictionVolumeFactor * 0.3 + (constraints.length > 3 ? 0.2 : constraints.length * 0.05)) * 10
  ), 0, 10);

  // Multi-factor leverage score
  const levImpactFactor = leverage.length > 0
    ? leverage.reduce((s, e) => s + (e.impact ?? 5), 0) / leverage.length / 10
    : 0;
  const leverageScore = clamp(Math.round(
    (levImpactFactor * 0.5 + Math.min(leverage.length / 5, 1) * 0.3 + tierCoverage * 0.07) * 10
  ), 0, 10);

  // Multi-factor risk score
  const riskImpactFactor = risk.length > 0
    ? risk.reduce((s, e) => s + (e.impact ?? 5), 0) / risk.length / 10
    : 0;
  const riskScore = clamp(Math.round(
    (riskImpactFactor * 0.5 + Math.min(risk.length / 5, 1) * 0.3 + (1 - avgConfidence) * 0.2) * 10
  ), 0, 10);
}

function buildStepSignals(
  step: string,
  key: string,
  items: Evidence[],
  completedSteps: Set<string>,
): StepSignalCount {
  const byType: Record<string, number> = {};
  items.forEach(e => {
    byType[e.type] = (byType[e.type] || 0) + 1;
  });

  const typeColors: Record<string, string> = {
    signal: "hsl(199 89% 48%)",
    assumption: "hsl(38 92% 50%)",
    constraint: "hsl(0 72% 52%)",
    friction: "hsl(0 72% 52%)",
    opportunity: "hsl(152 60% 44%)",
    leverage: "hsl(229 89% 63%)",
    risk: "hsl(14 90% 55%)",
    competitor: "hsl(262 83% 58%)",
  };

  const typeLabels: Record<string, string> = {
    signal: "Signals", assumption: "Assumptions", constraint: "Constraints",
    friction: "Friction", opportunity: "Opportunities", leverage: "Leverage",
    risk: "Risks", competitor: "Competitors",
  };

  return {
    step,
    key,
    signals: items.length,
    hasData: completedSteps.has(key) || items.length > 0,
    breakdown: Object.entries(byType)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        label: typeLabels[type] || type,
        count,
        color: typeColors[type] || "hsl(var(--muted-foreground))",
      })),
  };
}

// ═══════════════════════════════════════════════════════════════
//  LEGACY FALLBACK (preserved for backward compat)
// ═══════════════════════════════════════════════════════════════

function computeFromLegacy(input: CommandDeckMetricsInput): CommandDeckMetrics {
  const { products, selectedProduct, disruptData, redesignData, stressTestData, pitchDeckData, governedData, businessAnalysisData, intelligence, completedSteps } = input;
  const sources: string[] = [];

  if (products.length > 0) sources.push("report");
  if (disruptData || governedData) sources.push("disrupt");
  if (redesignData) sources.push("redesign");
  if (stressTestData) sources.push("stress-test");
  if (pitchDeckData) sources.push("pitch");

  const constraintCount = safeLen((disruptData as any)?.constraints || (disruptData as any)?.structuralConstraints);
  const assumptionCount = safeLen((disruptData as any)?.assumptions || (disruptData as any)?.hiddenAssumptions);
  const oppCount = safeLen((redesignData as any)?.opportunities || (redesignData as any)?.redesignedConcepts);
  const leverageCount = safeLen((redesignData as any)?.leveragePoints) + (intelligence?.leveragePoints?.length || 0);
  const riskCount = safeLen((stressTestData as any)?.redTeam || (stressTestData as any)?.redTeamArguments);
  const frictionCount = safeLen((selectedProduct as any)?.communityInsights?.frictionPoints);

  const pipelineCompletion = Math.round((completedSteps.size / 5) * 100);

  const stepSignals: StepSignalCount[] = [
    { step: "Report", key: "report", signals: products.length > 0 ? 1 : 0, hasData: completedSteps.has("report"), breakdown: [] },
    { step: "Disrupt", key: "disrupt", signals: constraintCount + assumptionCount, hasData: completedSteps.has("disrupt"), breakdown: [] },
    { step: "Redesign", key: "redesign", signals: oppCount + leverageCount, hasData: completedSteps.has("redesign"), breakdown: [] },
    { step: "Stress Test", key: "stress_test", signals: riskCount, hasData: completedSteps.has("stress-test"), breakdown: [] },
    { step: "Pitch", key: "pitch", signals: pitchDeckData ? 1 : 0, hasData: completedSteps.has("pitch"), breakdown: [] },
  ];

  return {
    opportunitiesIdentified: oppCount + (intelligence?.opportunities?.length || 0),
    constraintsDetected: constraintCount,
    assumptionsChallenged: assumptionCount,
    leveragePoints: leverageCount,
    riskSignals: riskCount,
    frictionSignals: frictionCount,
    pipelineCompletion,
    contributingSources: sources,
    isPartial: sources.length < 3,
    stepSignals,
    tierBreakdown: { structural: 0, system: 0, optimization: 0 },
    modeBreakdown: { product: 0, service: 0, business_model: 0 },
    totalEvidenceCount: 0,
    opportunityScore: 0,
    frictionIndex: 0,
    constraintsCount: constraintCount,
    leverageScore: 0,
    riskScore: 0,
  };
}

// ═══════════════════════════════════════════════════════════════
//  TREND DATA
// ═══════════════════════════════════════════════════════════════

export function computeTrendData(input: CommandDeckMetricsInput): TrendDataPoint[] {
  const { evidence, completedSteps } = input;

  if (evidence) {
    const all = flattenEvidence(evidence);
    const stepOrder: string[] = ["report", "disrupt", "redesign", "stress_test", "pitch"];
    let cumulative = 0;

    const points = stepOrder.map(step => {
      const count = all.filter(e => e.pipelineStep === step).length;
      cumulative += count;
      return {
        step: STEP_MAP[step] || step,
        score: completedSteps.has(step.replace("_", "-")) ? cumulative : 0,
        hasData: completedSteps.has(step.replace("_", "-")) || count > 0,
      };
    });

    const maxScore = Math.max(cumulative, 1);
    return points.map(p => ({ ...p, score: Math.round((p.score / maxScore) * 100) }));
  }

  // Legacy fallback
  return [
    { step: "Report", score: completedSteps.has("report") ? 20 : 0, hasData: completedSteps.has("report") },
    { step: "Disrupt", score: completedSteps.has("disrupt") ? 40 : 0, hasData: completedSteps.has("disrupt") },
    { step: "Redesign", score: completedSteps.has("redesign") ? 60 : 0, hasData: completedSteps.has("redesign") },
    { step: "Stress Test", score: completedSteps.has("stress-test") ? 80 : 0, hasData: completedSteps.has("stress-test") },
    { step: "Pitch", score: completedSteps.has("pitch") ? 100 : 0, hasData: completedSteps.has("pitch") },
  ];
}

// ═══════════════════════════════════════════════════════════════
//  AGGREGATED OPPORTUNITIES — Evidence-first
// ═══════════════════════════════════════════════════════════════

export function aggregateOpportunities(input: CommandDeckMetricsInput): AggregatedOpportunity[] {
  if (input.evidence) {
    const opps = input.evidence.opportunity.items;
    const allItems = flattenEvidence(input.evidence);
    const simCount = allItems.filter(e => e.category === "simulation" || e.id.startsWith("sim-")).length;
    const constraintCount = allItems.filter(e => e.type === "constraint").length;
    const leverageCount = allItems.filter(e => e.type === "leverage").length;
    const signalCount = allItems.filter(e => e.type === "signal").length;

    return opps
      .map(e => {
        // Multi-factor scoring (upgraded formula)
        const marketAttractiveness = clamp(((e.impact ?? 5) / 10) * 0.6 + Math.min(signalCount / 20, 1) * 0.4, 0, 1);
        const structuralAdvantage = clamp(Math.min(constraintCount / 8, 1) * 0.6 + Math.min(leverageCount / 5, 1) * 0.4, 0, 1);
        const simulationFeasibility = clamp(simCount > 0 ? Math.min(simCount / 3, 1) * 0.7 + 0.3 : 0, 0, 1);
        const strategicLeverage = clamp((e.confidenceScore ?? 0.5) * 0.5 + Math.min(leverageCount / 5, 1) * 0.5, 0, 1);
        const executionDifficulty = clamp(1 - (e.confidenceScore ?? 0.5) * 0.4 - Math.min(simCount / 5, 1) * 0.3, 0, 1);

        // New weighted formula
        const opportunityScore = Math.round(
          (
            marketAttractiveness * 0.25 +
            structuralAdvantage * 0.25 +
            simulationFeasibility * 0.20 +
            strategicLeverage * 0.20 -
            executionDifficulty * 0.10
          ) * 100
        ) / 10;

        const riskLevel: "low" | "moderate" | "high" =
          opportunityScore >= 6 ? "low" : opportunityScore >= 3 ? "moderate" : "high";

        return {
          id: e.id,
          label: e.label,
          impact: e.impact ?? 5,
          confidence: e.confidenceScore != null
            ? (e.confidenceScore >= 0.7 ? "high" : e.confidenceScore >= 0.4 ? "medium" : "low")
            : "medium",
          step: STEP_MAP[e.pipelineStep] || e.pipelineStep,
          source: e.sourceEngine || "pipeline",
          tier: e.tier,
          mode: e.mode,
          opportunityScore,
          simulationCount: simCount,
          riskLevel,
          marketAttractiveness: Math.round(marketAttractiveness * 100) / 10,
          structuralAdvantage: Math.round(structuralAdvantage * 100) / 10,
          simulationFeasibility: Math.round(simulationFeasibility * 100) / 10,
          strategicLeverage: Math.round(strategicLeverage * 100) / 10,
          executionDifficulty: Math.round(executionDifficulty * 100) / 10,
        };
      })
      .sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0))
      .slice(0, 10);
  }

  // Legacy fallback
  const opps: AggregatedOpportunity[] = [];
  const si = input.intelligence;
  if (si) {
    (si.commandDeck?.topOpportunities || []).forEach(o => {
      opps.push({ id: o.id, label: o.label, impact: o.impact, confidence: o.confidence, step: "Strategy", source: "Analysis" });
    });
  }
  return opps.sort((a, b) => b.impact - a.impact).slice(0, 10);
}
