/**
 * COMMAND DECK METRICS — Aggregation Layer
 *
 * Computes dashboard metrics by combining outputs from ALL pipeline steps,
 * not just systemIntelligence/Disrupt. Supports partial analysis — metrics
 * are meaningful even when only some steps have run.
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
  /** Products from Report step */
  products: any[];
  /** Selected product */
  selectedProduct: any | null;
  /** Disrupt step data */
  disruptData: any | null;
  /** Redesign step data */
  redesignData: any | null;
  /** Stress test data */
  stressTestData: any | null;
  /** Pitch deck data */
  pitchDeckData: any | null;
  /** Governed data (reasoning synopsis, constraint maps, etc.) */
  governedData: Record<string, unknown> | null;
  /** Business analysis data */
  businessAnalysisData: any | null;
  /** SystemIntelligence (if available — used as enrichment, not sole source) */
  intelligence: SystemIntelligence | null;
  /** Completed steps set */
  completedSteps: Set<string>;
}

/* ── Output shape ── */
export interface CommandDeckMetrics {
  opportunityScore: number;
  frictionIndex: number;
  constraintsCount: number;
  leverageScore: number;
  riskScore: number;
  pipelineCompletion: number;
  /** Which steps contributed to the metrics */
  contributingSources: string[];
  /** True if metrics are computed from partial data */
  isPartial: boolean;
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

/* ── Helper: extract numeric signals safely ── */
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

  // Community insights / customer sentiment
  const ci = product.communityInsights || product.customerSentiment || {};
  signals.complaintCount = safeLen(ci.topComplaints);
  signals.strengthCount = safeLen(ci.whatWorksWell) + safeLen(ci.topPraises);
  signals.frictionSignals = safeLen(ci.frictionPoints) + safeLen(ci.improvementRequests);
  signals.marketGapCount = safeLen(ci.improvementRequests) + safeLen(ci.marketGaps);

  // Market position signals
  const mp = product.marketPosition || {};
  if (mp.competitorCount) signals.totalSignals += mp.competitorCount;

  // Revival score contributes to opportunity
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

  // From disrupt data
  if (disruptData) {
    // Assumptions
    const assumptions = disruptData.assumptions || disruptData.hiddenAssumptions || [];
    signals.assumptionCount = safeLen(assumptions);

    // Constraints
    const constraints = disruptData.constraints || disruptData.structuralConstraints || [];
    signals.constraintCount = safeLen(constraints);
    if (Array.isArray(constraints) && constraints.length > 0) {
      signals.constraintSeverityAvg = safeAvg(constraints);
    }

    // Structural blockers
    signals.structuralBlockers = safeLen(disruptData.structuralBlockers) +
      safeLen(disruptData.supplyChainConstraints);

    // Flipped ideas as opportunity signals
    signals.opportunitySignals = safeLen(disruptData.flippedIdeas) +
      safeLen(disruptData.ideas) + safeLen(disruptData.conceptSpecs);
  }

  // From governed data (reasoning synopsis)
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

  // Opportunities from redesign
  const opps = redesignData.opportunities || redesignData.redesignedConcepts ||
    redesignData.concepts || [];
  signals.opportunityCount = safeLen(opps);
  if (Array.isArray(opps) && opps.length > 0) {
    signals.avgOpportunityImpact = safeAvg(opps);
  }

  // Value signals
  signals.valueCreationSignals = safeLen(redesignData.valueStack) +
    safeLen(redesignData.newValuePropositions);
  signals.hiddenValueSignals = safeLen(redesignData.hiddenValues) +
    safeLen(redesignData.underservedSegments);

  // Leverage
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
    totalRiskScore: 0,
  };

  if (!stressTestData) return signals;

  // Red team / green team
  const redTeam = stressTestData.redTeam || stressTestData.redTeamArguments || [];
  const greenTeam = stressTestData.greenTeam || stressTestData.greenTeamArguments || [];
  signals.redTeamFindings = safeLen(redTeam);
  signals.greenTeamFindings = safeLen(greenTeam);

  // Feasibility
  const feasibility = stressTestData.feasibility || stressTestData.feasibilityChecklist || {};
  if (feasibility.overallScore != null) {
    signals.feasibilityRisk = clamp(10 - feasibility.overallScore, 0, 10);
  } else if (Array.isArray(feasibility.items)) {
    const failed = feasibility.items.filter((i: any) => !i.passed && !i.met).length;
    signals.feasibilityRisk = clamp(Math.round(failed / Math.max(feasibility.items.length, 1) * 10), 0, 10);
  }

  // Execution risk from confidence
  const confidence = stressTestData.confidence || stressTestData.confidenceScore;
  if (confidence != null) {
    const confVal = typeof confidence === "object" ? (confidence.overall || confidence.score || 5) : confidence;
    signals.executionRisk = clamp(Math.round(10 - confVal), 0, 10);
  }

  // Market adoption from competitive landscape
  const competitive = stressTestData.competitiveLandscape || stressTestData.marketRisk;
  if (competitive) {
    signals.marketAdoptionRisk = clamp(
      typeof competitive === "number" ? competitive : (competitive.riskLevel || 4),
      0, 10
    );
  }

  // Aggregate risk
  const riskFactors = [signals.feasibilityRisk, signals.executionRisk, signals.marketAdoptionRisk]
    .filter(r => r > 0);
  signals.totalRiskScore = riskFactors.length > 0
    ? Math.round(riskFactors.reduce((s, r) => s + r, 0) / riskFactors.length * 10) / 10
    : 0;

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

  // Pitch strength
  if (pitchDeckData.overallStrength != null) {
    signals.strategicStrength = pitchDeckData.overallStrength;
  } else if (pitchDeckData.slides) {
    signals.slideCount = safeLen(pitchDeckData.slides);
    signals.strategicStrength = Math.min(signals.slideCount, 10);
  }

  // Narrative confidence
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
 * MAIN AGGREGATION FUNCTION
 * ══════════════════════════════════════════════════════════ */
export function computeCommandDeckMetrics(input: CommandDeckMetricsInput): CommandDeckMetrics {
  const {
    products, selectedProduct, disruptData, redesignData,
    stressTestData, pitchDeckData, governedData,
    businessAnalysisData, intelligence, completedSteps,
  } = input;

  const sources: string[] = [];

  // ── Extract signals from each step ──
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

  // ── Enrich with systemIntelligence if available ──
  const siConstraints = intelligence?.unifiedConstraintGraph || [];
  const siLeverage = intelligence?.leveragePoints || [];
  const siOpportunities = intelligence?.opportunities || [];

  // ══ OPPORTUNITY SCORE (0–10) ══
  // Weighted combination of redesign opportunities, leverage signals, pitch strength, market gaps
  let oppScore = 0;
  let oppFactors = 0;

  if (redesign.opportunityCount > 0) {
    oppScore += redesign.avgOpportunityImpact > 0 ? redesign.avgOpportunityImpact : Math.min(redesign.opportunityCount, 10);
    oppFactors++;
  }
  if (redesign.leverageSignals > 0 || siLeverage.length > 0) {
    const leverageAvg = siLeverage.length > 0 ? safeAvg(siLeverage) : Math.min(redesign.leverageSignals, 10);
    oppScore += leverageAvg;
    oppFactors++;
  }
  if (pitch.strategicStrength > 0) {
    oppScore += pitch.strategicStrength;
    oppFactors++;
  }
  if (report.marketGapCount > 0) {
    oppScore += Math.min(report.marketGapCount * 1.5, 10);
    oppFactors++;
  }
  if (disrupt.opportunitySignals > 0) {
    oppScore += Math.min(disrupt.opportunitySignals * 1.2, 10);
    oppFactors++;
  }
  if (business.growthLevers > 0) {
    oppScore += Math.min(business.growthLevers * 1.5, 10);
    oppFactors++;
  }
  // SI opportunities
  if (siOpportunities.length > 0 && oppFactors === 0) {
    oppScore += safeAvg(siOpportunities);
    oppFactors++;
  }

  const opportunityScore = oppFactors > 0
    ? clamp(Math.round(oppScore / oppFactors * 10) / 10, 0, 10)
    : 0;

  // ══ FRICTION INDEX (0–10) ══
  let frictionScore = 0;
  let frictionFactors = 0;

  if (disrupt.constraintCount > 0) {
    frictionScore += disrupt.constraintSeverityAvg > 0 ? disrupt.constraintSeverityAvg : Math.min(disrupt.constraintCount, 10);
    frictionFactors++;
  }
  if (report.complaintCount > 0) {
    frictionScore += Math.min(report.complaintCount * 1.5, 10);
    frictionFactors++;
  }
  if (report.frictionSignals > 0) {
    frictionScore += Math.min(report.frictionSignals * 1.2, 10);
    frictionFactors++;
  }
  if (intelligence?.expandedFriction?.overall != null) {
    frictionScore += intelligence.expandedFriction.overall;
    frictionFactors++;
  }
  // SI constraints as fallback
  if (siConstraints.length > 0 && frictionFactors === 0) {
    frictionScore += safeAvg(siConstraints);
    frictionFactors++;
  }

  const frictionIndex = frictionFactors > 0
    ? clamp(Math.round(frictionScore / frictionFactors * 10) / 10, 0, 10)
    : 0;

  // ══ CONSTRAINTS COUNT ══
  const constraintsCount = Math.max(
    disrupt.constraintCount + disrupt.structuralBlockers,
    siConstraints.length,
    disrupt.assumptionCount > 0 ? Math.ceil(disrupt.assumptionCount * 0.5) : 0
  );

  // ══ LEVERAGE SCORE (0–10) ══
  let leverageVal = 0;
  let leverageFactors = 0;

  if (siLeverage.length > 0) {
    leverageVal += safeAvg(siLeverage);
    leverageFactors++;
  }
  if (redesign.valueCreationSignals > 0) {
    leverageVal += Math.min(redesign.valueCreationSignals * 1.5, 10);
    leverageFactors++;
  }
  if (redesign.hiddenValueSignals > 0) {
    leverageVal += Math.min(redesign.hiddenValueSignals * 2, 10);
    leverageFactors++;
  }
  if (report.marketGapCount > 0) {
    leverageVal += Math.min(report.marketGapCount, 8);
    leverageFactors++;
  }
  if (business.growthLevers > 0) {
    leverageVal += Math.min(business.growthLevers * 1.5, 10);
    leverageFactors++;
  }

  const leverageScore = leverageFactors > 0
    ? clamp(Math.round(leverageVal / leverageFactors * 10) / 10, 0, 10)
    : 0;

  // ══ RISK SCORE (0–10) ══
  let riskVal = stressTest.totalRiskScore;
  let riskFactors = riskVal > 0 ? 1 : 0;

  if (business.modelRisks > 0) {
    riskVal += Math.min(business.modelRisks * 1.5, 10);
    riskFactors++;
  }
  // High constraints also imply risk
  if (constraintsCount >= 5 && riskFactors === 0) {
    riskVal += Math.min(constraintsCount * 0.8, 8);
    riskFactors++;
  }

  const riskScore = riskFactors > 0
    ? clamp(Math.round(riskVal / riskFactors * 10) / 10, 0, 10)
    : 0;

  // ══ PIPELINE COMPLETION ══
  const pipelineCompletion = Math.round((completedSteps.size / 5) * 100);

  return {
    opportunityScore,
    frictionIndex,
    constraintsCount,
    leverageScore,
    riskScore,
    pipelineCompletion,
    contributingSources: sources,
    isPartial: sources.length < 3,
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

  // Cumulative insight score per step
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

  // Normalize to 0-100
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

  // From systemIntelligence (highest quality)
  const si = input.intelligence;
  if (si) {
    (si.commandDeck?.topOpportunities || []).forEach(o => {
      opps.push({
        id: o.id,
        label: o.label,
        impact: o.impact,
        confidence: o.confidence,
        step: "Strategy",
        source: o.evidence?.[0]?.slice(0, 40) || "Analysis",
      });
    });
    // Additional SI opportunities not already in commandDeck
    (si.opportunities || []).forEach(o => {
      if (!opps.some(e => e.id === o.id)) {
        opps.push({
          id: o.id,
          label: o.label,
          impact: o.impact,
          confidence: o.confidence,
          step: "Disrupt",
          source: "Constraint Analysis",
        });
      }
    });
  }

  // From redesign data
  const redesign = input.redesignData;
  if (redesign) {
    const concepts = redesign.redesignedConcepts || redesign.concepts || redesign.opportunities || [];
    if (Array.isArray(concepts)) {
      concepts.forEach((c: any, i: number) => {
        const id = c.id || `redesign-opp-${i}`;
        if (!opps.some(e => e.id === id)) {
          opps.push({
            id,
            label: c.name || c.label || c.title || `Redesign Concept ${i + 1}`,
            impact: c.impact || c.score || 6,
            confidence: c.confidence || "medium",
            step: "Redesign",
            source: c.source || "Value Stack",
          });
        }
      });
    }
  }

  // From disrupt flipped ideas
  const disrupt = input.disruptData;
  if (disrupt) {
    const ideas = disrupt.flippedIdeas || disrupt.ideas || [];
    if (Array.isArray(ideas)) {
      ideas.forEach((idea: any, i: number) => {
        const id = idea.id || `flip-opp-${i}`;
        if (!opps.some(e => e.id === id)) {
          opps.push({
            id,
            label: idea.name || idea.title || idea.label || `Flipped Idea ${i + 1}`,
            impact: idea.impact || idea.score || 5,
            confidence: idea.confidence || "medium",
            step: "Disrupt",
            source: "First Principles",
          });
        }
      });
    }
  }

  // From report product signals
  const product = input.selectedProduct;
  if (product) {
    const ci = product.communityInsights || product.customerSentiment || {};
    const gaps = ci.improvementRequests || ci.marketGaps || [];
    if (Array.isArray(gaps)) {
      gaps.slice(0, 3).forEach((gap: any, i: number) => {
        const label = typeof gap === "string" ? gap : (gap.text || gap.label || `Market Gap ${i + 1}`);
        const id = `report-gap-${i}`;
        if (!opps.some(e => e.id === id)) {
          opps.push({
            id,
            label,
            impact: 4 + i, // Moderate impact
            confidence: "low",
            step: "Report",
            source: "Market Signals",
          });
        }
      });
    }
  }

  // Sort by impact descending, take top 10
  return opps.sort((a, b) => b.impact - a.impact).slice(0, 10);
}
