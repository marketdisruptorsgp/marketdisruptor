/**
 * COMMAND DECK METRICS — Aggregation Layer
 *
 * Computes dashboard metrics by combining outputs from ALL pipeline steps.
 * Metrics are signal COUNTS, not abstract scores.
 *
 * Data sources:
 *   Report  → product signals, community insights, market gaps
 *   Disrupt → constraints, assumptions, structural blockers
 *   Redesign → opportunities, value creation, leverage signals
 *   Stress Test → risk scores, red/green team findings, feasibility
 *   Pitch   → strategic strength, narrative confidence
 */

import type { SystemIntelligence } from "@/lib/systemIntelligence";

/* ── Input shape ── */
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
}

/* ── Output shape — signal counts ── */
export interface CommandDeckMetrics {
  /** Total opportunity signals identified */
  opportunitiesIdentified: number;
  /** Total constraints detected */
  constraintsDetected: number;
  /** Total assumptions challenged */
  assumptionsChallenged: number;
  /** Total leverage points found */
  leveragePoints: number;
  /** Total risk signals */
  riskSignals: number;
  /** Pipeline completion percentage */
  pipelineCompletion: number;
  /** Which steps contributed */
  contributingSources: string[];
  /** True if metrics are computed from partial data */
  isPartial: boolean;
  /** Per-step signal counts for timeline */
  stepSignals: StepSignalCount[];

  // Legacy compat aliases
  opportunityScore: number;
  frictionIndex: number;
  constraintsCount: number;
  leverageScore: number;
  riskScore: number;
}

/* ── Per-step signal count for timeline ── */
export interface StepSignalCount {
  step: string;
  key: string;
  signals: number;
  hasData: boolean;
  breakdown: { label: string; count: number; color: string }[];
}

/* ── Trend data point ── */
export interface TrendDataPoint {
  step: string;
  score: number;
  hasData: boolean;
}

/* ── Opportunity row for table ── */
export interface AggregatedOpportunity {
  id: string;
  label: string;
  impact: number;
  confidence: string;
  step: string;
  source: string;
}

/* ── Helpers ── */
function safeLen(arr: unknown): number {
  return Array.isArray(arr) ? arr.length : 0;
}

function safeAvg(arr: { impact?: number; score?: number }[]): number {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const sum = arr.reduce((s, item) => s + (item.impact ?? item.score ?? 0), 0);
  return Math.round((sum / arr.length) * 10) / 10;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/* ── Extract report signals ── */
function extractReportSignals(products: any[], selectedProduct: any) {
  const signals = {
    marketGapCount: 0,
    complaintCount: 0,
    strengthCount: 0,
    frictionSignals: 0,
    totalSignals: 0,
  };

  const product = selectedProduct || products[0];
  if (!product) return signals;

  const ci = product.communityInsights || product.customerSentiment || {};
  signals.complaintCount = safeLen(ci.topComplaints);
  signals.strengthCount = safeLen(ci.whatWorksWell) + safeLen(ci.topPraises);
  signals.frictionSignals = safeLen(ci.frictionPoints) + safeLen(ci.improvementRequests);
  signals.marketGapCount = safeLen(ci.improvementRequests) + safeLen(ci.marketGaps);

  const mp = product.marketPosition || {};
  if (mp.competitorCount) signals.totalSignals += mp.competitorCount;
  if (product.revivalScore) signals.totalSignals += 1;

  signals.totalSignals += signals.complaintCount + signals.strengthCount +
    signals.frictionSignals + signals.marketGapCount;

  return signals;
}

/* ── Extract disrupt signals ── */
function extractDisruptSignals(disruptData: any, governedData: any) {
  const signals = {
    constraintCount: 0,
    assumptionCount: 0,
    structuralBlockers: 0,
    constraintSeverityAvg: 0,
    opportunitySignals: 0,
  };

  if (!disruptData && !governedData) return signals;

  if (disruptData) {
    const assumptions = disruptData.assumptions || disruptData.hiddenAssumptions || [];
    signals.assumptionCount = safeLen(assumptions);

    const constraints = disruptData.constraints || disruptData.structuralConstraints || [];
    signals.constraintCount = safeLen(constraints);
    if (Array.isArray(constraints) && constraints.length > 0) {
      signals.constraintSeverityAvg = safeAvg(constraints);
    }

    signals.structuralBlockers = safeLen(disruptData.structuralBlockers) +
      safeLen(disruptData.supplyChainConstraints);

    signals.opportunitySignals = safeLen(disruptData.flippedIdeas) +
      safeLen(disruptData.ideas) + safeLen(disruptData.conceptSpecs);
  }

  if (governedData) {
    const synopsis = governedData.reasoning_synopsis as any;
    if (synopsis?.key_assumptions) {
      signals.assumptionCount = Math.max(signals.assumptionCount, safeLen(synopsis.key_assumptions));
    }
    const constraintMap = governedData.constraint_map as any;
    if (constraintMap?.constraints) {
      signals.constraintCount = Math.max(signals.constraintCount, safeLen(constraintMap.constraints));
    }
  }

  return signals;
}

/* ── Extract redesign signals ── */
function extractRedesignSignals(redesignData: any) {
  const signals = {
    opportunityCount: 0,
    valueCreationSignals: 0,
    hiddenValueSignals: 0,
    leverageSignals: 0,
    avgOpportunityImpact: 0,
  };

  if (!redesignData) return signals;

  const opps = redesignData.opportunities || redesignData.redesignedConcepts ||
    redesignData.concepts || [];
  signals.opportunityCount = safeLen(opps);
  if (Array.isArray(opps) && opps.length > 0) {
    signals.avgOpportunityImpact = safeAvg(opps);
  }

  signals.valueCreationSignals = safeLen(redesignData.valueStack) +
    safeLen(redesignData.newValuePropositions);
  signals.hiddenValueSignals = safeLen(redesignData.hiddenValues) +
    safeLen(redesignData.underservedSegments);

  signals.leverageSignals = safeLen(redesignData.leveragePoints) +
    safeLen(redesignData.convergenceZones);

  return signals;
}

/* ── Extract stress test signals ── */
function extractStressTestSignals(stressTestData: any) {
  const signals = {
    feasibilityRisk: 0,
    executionRisk: 0,
    marketAdoptionRisk: 0,
    redTeamFindings: 0,
    greenTeamFindings: 0,
    totalRiskSignals: 0,
  };

  if (!stressTestData) return signals;

  const redTeam = stressTestData.redTeam || stressTestData.redTeamArguments || [];
  const greenTeam = stressTestData.greenTeam || stressTestData.greenTeamArguments || [];
  signals.redTeamFindings = safeLen(redTeam);
  signals.greenTeamFindings = safeLen(greenTeam);

  const feasibility = stressTestData.feasibility || stressTestData.feasibilityChecklist || {};
  if (Array.isArray(feasibility.items)) {
    const failed = feasibility.items.filter((i: any) => !i.passed && !i.met).length;
    signals.feasibilityRisk = failed;
  }

  signals.totalRiskSignals = signals.redTeamFindings + signals.feasibilityRisk;

  return signals;
}

/* ── Extract pitch signals ── */
function extractPitchSignals(pitchDeckData: any) {
  const signals = {
    strategicStrength: 0,
    narrativeConfidence: 0,
    slideCount: 0,
  };

  if (!pitchDeckData) return signals;

  if (pitchDeckData.overallStrength != null) {
    signals.strategicStrength = pitchDeckData.overallStrength;
  } else if (pitchDeckData.slides) {
    signals.slideCount = safeLen(pitchDeckData.slides);
    signals.strategicStrength = Math.min(signals.slideCount, 10);
  }

  if (pitchDeckData.confidence != null) {
    signals.narrativeConfidence = typeof pitchDeckData.confidence === "number"
      ? pitchDeckData.confidence
      : (pitchDeckData.confidence.overall || 5);
  }

  return signals;
}

/* ── Extract business model signals ── */
function extractBusinessSignals(businessData: any) {
  const signals = {
    revenueInsights: 0,
    modelRisks: 0,
    growthLevers: 0,
  };

  if (!businessData) return signals;

  signals.revenueInsights = safeLen(businessData.revenueStreams) +
    safeLen(businessData.pricingInsights);
  signals.modelRisks = safeLen(businessData.risks) +
    safeLen(businessData.vulnerabilities);
  signals.growthLevers = safeLen(businessData.growthOpportunities) +
    safeLen(businessData.competitiveAdvantages);

  return signals;
}

/* ══════════════════════════════════════════════════════════
 * MAIN AGGREGATION FUNCTION — returns signal counts
 * ══════════════════════════════════════════════════════════ */
export function computeCommandDeckMetrics(input: CommandDeckMetricsInput): CommandDeckMetrics {
  const {
    products, selectedProduct, disruptData, redesignData,
    stressTestData, pitchDeckData, governedData,
    businessAnalysisData, intelligence, completedSteps,
  } = input;

  const sources: string[] = [];

  const report = extractReportSignals(products, selectedProduct);
  if (products.length > 0) sources.push("report");

  const disrupt = extractDisruptSignals(disruptData, governedData);
  if (disruptData || governedData) sources.push("disrupt");

  const redesign = extractRedesignSignals(redesignData);
  if (redesignData) sources.push("redesign");

  const stressTest = extractStressTestSignals(stressTestData);
  if (stressTestData) sources.push("stress-test");

  const pitch = extractPitchSignals(pitchDeckData);
  if (pitchDeckData) sources.push("pitch");

  const business = extractBusinessSignals(businessAnalysisData);
  if (businessAnalysisData) sources.push("business");

  // SystemIntelligence enrichment
  const siConstraints = intelligence?.unifiedConstraintGraph || [];
  const siLeverage = intelligence?.leveragePoints || [];
  const siOpportunities = intelligence?.opportunities || [];

  // ══ SIGNAL COUNTS ══
  const opportunitiesIdentified =
    redesign.opportunityCount +
    disrupt.opportunitySignals +
    safeLen(report.marketGapCount > 0 ? Array(report.marketGapCount) : []) +
    siOpportunities.length +
    business.growthLevers;

  const constraintsDetected =
    disrupt.constraintCount +
    disrupt.structuralBlockers +
    Math.max(0, siConstraints.length - disrupt.constraintCount);

  const assumptionsChallenged = disrupt.assumptionCount;

  const leveragePointsCount =
    redesign.leverageSignals +
    redesign.valueCreationSignals +
    redesign.hiddenValueSignals +
    siLeverage.length;

  const riskSignalCount =
    stressTest.totalRiskSignals +
    business.modelRisks;

  // ══ PER-STEP SIGNAL COUNTS (for timeline) ══
  const stepSignals: StepSignalCount[] = [
    {
      step: "Report", key: "report",
      signals: report.totalSignals,
      hasData: completedSteps.has("report"),
      breakdown: [
        { label: "Strengths", count: report.strengthCount, color: "hsl(152 60% 44%)" },
        { label: "Complaints", count: report.complaintCount, color: "hsl(0 72% 52%)" },
        { label: "Friction", count: report.frictionSignals, color: "hsl(38 92% 50%)" },
        { label: "Market Gaps", count: report.marketGapCount, color: "hsl(229 89% 63%)" },
      ].filter(b => b.count > 0),
    },
    {
      step: "Disrupt", key: "disrupt",
      signals: disrupt.constraintCount + disrupt.assumptionCount + disrupt.opportunitySignals,
      hasData: completedSteps.has("disrupt"),
      breakdown: [
        { label: "Constraints", count: disrupt.constraintCount, color: "hsl(0 72% 52%)" },
        { label: "Assumptions", count: disrupt.assumptionCount, color: "hsl(38 92% 50%)" },
        { label: "Ideas", count: disrupt.opportunitySignals, color: "hsl(152 60% 44%)" },
      ].filter(b => b.count > 0),
    },
    {
      step: "Redesign", key: "redesign",
      signals: redesign.opportunityCount + redesign.leverageSignals + redesign.valueCreationSignals,
      hasData: completedSteps.has("redesign"),
      breakdown: [
        { label: "Opportunities", count: redesign.opportunityCount, color: "hsl(152 60% 44%)" },
        { label: "Leverage", count: redesign.leverageSignals, color: "hsl(229 89% 63%)" },
        { label: "Value Signals", count: redesign.valueCreationSignals, color: "hsl(38 92% 50%)" },
      ].filter(b => b.count > 0),
    },
    {
      step: "Stress Test", key: "stress-test",
      signals: stressTest.redTeamFindings + stressTest.greenTeamFindings + stressTest.feasibilityRisk,
      hasData: completedSteps.has("stress-test"),
      breakdown: [
        { label: "Red Team", count: stressTest.redTeamFindings, color: "hsl(0 72% 52%)" },
        { label: "Green Team", count: stressTest.greenTeamFindings, color: "hsl(152 60% 44%)" },
        { label: "Feasibility", count: stressTest.feasibilityRisk, color: "hsl(38 92% 50%)" },
      ].filter(b => b.count > 0),
    },
    {
      step: "Pitch", key: "pitch",
      signals: pitch.slideCount + (pitch.strategicStrength > 0 ? 1 : 0),
      hasData: completedSteps.has("pitch"),
      breakdown: [
        { label: "Slides", count: pitch.slideCount, color: "hsl(229 89% 63%)" },
      ].filter(b => b.count > 0),
    },
  ];

  // ══ PIPELINE COMPLETION ══
  const pipelineCompletion = Math.round((completedSteps.size / 5) * 100);

  // Legacy compat (normalized 0-10 scores for Strategic Potential gauge)
  const oppFactors = [redesign.avgOpportunityImpact, siOpportunities.length > 0 ? safeAvg(siOpportunities) : 0, pitch.strategicStrength].filter(v => v > 0);
  const opportunityScore = oppFactors.length > 0 ? clamp(Math.round(oppFactors.reduce((s, v) => s + v, 0) / oppFactors.length * 10) / 10, 0, 10) : 0;
  const frictionIndex = disrupt.constraintSeverityAvg > 0 ? clamp(disrupt.constraintSeverityAvg, 0, 10) : 0;
  const leverageScore = siLeverage.length > 0 ? clamp(safeAvg(siLeverage), 0, 10) : 0;
  const riskScore = stressTest.totalRiskSignals > 0 ? clamp(Math.min(stressTest.totalRiskSignals, 10), 0, 10) : 0;

  return {
    opportunitiesIdentified,
    constraintsDetected,
    assumptionsChallenged,
    leveragePoints: leveragePointsCount,
    riskSignals: riskSignalCount,
    pipelineCompletion,
    contributingSources: sources,
    isPartial: sources.length < 3,
    stepSignals,
    // Legacy
    opportunityScore,
    frictionIndex,
    constraintsCount: constraintsDetected,
    leverageScore,
    riskScore,
  };
}

/* ══════════════════════════════════════════════════════════
 * TREND DATA — Score progression across pipeline
 * ══════════════════════════════════════════════════════════ */
export function computeTrendData(input: CommandDeckMetricsInput): TrendDataPoint[] {
  const { products, disruptData, redesignData, stressTestData, pitchDeckData, completedSteps } = input;
  const report = extractReportSignals(products, input.selectedProduct);
  const disrupt = extractDisruptSignals(disruptData, input.governedData);
  const redesign = extractRedesignSignals(redesignData);
  const stressTest = extractStressTestSignals(stressTestData);
  const pitch = extractPitchSignals(pitchDeckData);

  let cumulative = 0;

  const reportScore = report.totalSignals > 0 ? clamp(Math.round(report.totalSignals * 0.8), 5, 40) : 0;
  cumulative += reportScore;
  const reportPoint = { step: "Report", score: completedSteps.has("report") ? Math.max(cumulative, reportScore) : 0, hasData: completedSteps.has("report") };

  const disruptScore = (disrupt.constraintCount + disrupt.assumptionCount + disrupt.opportunitySignals) > 0
    ? clamp(Math.round((disrupt.constraintCount + disrupt.opportunitySignals) * 2), 10, 30) : 0;
  cumulative += disruptScore;
  const disruptPoint = { step: "Disrupt", score: completedSteps.has("disrupt") ? Math.max(cumulative, 20) : 0, hasData: completedSteps.has("disrupt") };

  const redesignScore = redesign.opportunityCount > 0
    ? clamp(Math.round(redesign.opportunityCount * 3 + redesign.leverageSignals * 2), 10, 25) : 0;
  cumulative += redesignScore;
  const redesignPoint = { step: "Redesign", score: completedSteps.has("redesign") ? Math.max(cumulative, 35) : 0, hasData: completedSteps.has("redesign") };

  const stressScore = (stressTest.redTeamFindings + stressTest.greenTeamFindings) > 0
    ? clamp(Math.round((stressTest.greenTeamFindings - stressTest.redTeamFindings * 0.3 + 5) * 2), 5, 20) : 0;
  cumulative += stressScore;
  const stressPoint = { step: "Stress Test", score: completedSteps.has("stress-test") ? Math.max(cumulative, 50) : 0, hasData: completedSteps.has("stress-test") };

  const pitchScore = pitch.strategicStrength > 0 ? clamp(pitch.strategicStrength * 3, 5, 15) : 0;
  cumulative += pitchScore;
  const pitchPoint = { step: "Pitch", score: completedSteps.has("pitch") ? Math.max(cumulative, 60) : 0, hasData: completedSteps.has("pitch") };

  const maxScore = Math.max(cumulative, 1);
  return [reportPoint, disruptPoint, redesignPoint, stressPoint, pitchPoint].map(p => ({
    ...p,
    score: cumulative > 0 ? Math.round(p.score / maxScore * 100) : p.score,
  }));
}

/* ══════════════════════════════════════════════════════════
 * AGGREGATED OPPORTUNITIES — from all steps
 * ══════════════════════════════════════════════════════════ */
export function aggregateOpportunities(input: CommandDeckMetricsInput): AggregatedOpportunity[] {
  const opps: AggregatedOpportunity[] = [];

  const si = input.intelligence;
  if (si) {
    (si.commandDeck?.topOpportunities || []).forEach(o => {
      opps.push({
        id: o.id, label: o.label, impact: o.impact, confidence: o.confidence,
        step: "Strategy", source: o.evidence?.[0]?.slice(0, 40) || "Analysis",
      });
    });
    (si.opportunities || []).forEach(o => {
      if (!opps.some(e => e.id === o.id)) {
        opps.push({
          id: o.id, label: o.label, impact: o.impact, confidence: o.confidence,
          step: "Disrupt", source: "Constraint Analysis",
        });
      }
    });
  }

  const redesign = input.redesignData;
  if (redesign) {
    const concepts = redesign.redesignedConcepts || redesign.concepts || redesign.opportunities || [];
    if (Array.isArray(concepts)) {
      concepts.forEach((c: any, i: number) => {
        const id = c.id || `redesign-opp-${i}`;
        if (!opps.some(e => e.id === id)) {
          opps.push({
            id, label: c.name || c.label || c.title || `Redesign Concept ${i + 1}`,
            impact: c.impact || c.score || 6, confidence: c.confidence || "medium",
            step: "Redesign", source: c.source || "Value Stack",
          });
        }
      });
    }
  }

  const disrupt = input.disruptData;
  if (disrupt) {
    const ideas = disrupt.flippedIdeas || disrupt.ideas || [];
    if (Array.isArray(ideas)) {
      ideas.forEach((idea: any, i: number) => {
        const id = idea.id || `flip-opp-${i}`;
        if (!opps.some(e => e.id === id)) {
          opps.push({
            id, label: idea.name || idea.title || idea.label || `Flipped Idea ${i + 1}`,
            impact: idea.impact || idea.score || 5, confidence: idea.confidence || "medium",
            step: "Disrupt", source: "First Principles",
          });
        }
      });
    }
  }

  const product = input.selectedProduct;
  if (product) {
    const ci = product.communityInsights || product.customerSentiment || {};
    const gaps = ci.improvementRequests || ci.marketGaps || [];
    if (Array.isArray(gaps)) {
      gaps.slice(0, 3).forEach((gap: any, i: number) => {
        const label = typeof gap === "string" ? gap : (gap.text || gap.label || `Market Gap ${i + 1}`);
        const id = `report-gap-${i}`;
        if (!opps.some(e => e.id === id)) {
          opps.push({ id, label, impact: 4 + i, confidence: "low", step: "Report", source: "Market Signals" });
        }
      });
    }
  }

  return opps.sort((a, b) => b.impact - a.impact).slice(0, 10);
}
