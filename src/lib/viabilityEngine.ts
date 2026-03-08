/**
 * VIABILITY ENGINE — Stage 8
 *
 * Scores each opportunity concept on four dimensions:
 *   1. Feasibility — can it be implemented given current capabilities?
 *   2. Capital requirements — how much investment is needed?
 *   3. Market readiness — does the market support this transformation?
 *   4. Implementation complexity — how many moving parts?
 *
 * Also propagates confidence from upstream evidence through the
 * full reasoning chain: Evidence → Signal → Constraint → Opportunity.
 *
 * Output: ViabilityScore per opportunity, filtering out impractical ideas.
 */

import type { StrategicInsight } from "@/lib/strategicEngine";
import type { Evidence } from "@/lib/evidenceEngine";
import type { SeverityScore } from "@/lib/constraintSeverityEngine";
import { getPatternById } from "@/lib/strategicPatternLibrary";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface ViabilityScore {
  opportunityId: string;
  opportunityLabel: string;
  /** 0-1: Can it be implemented? */
  feasibility: number;
  /** 0-1: Lower = less capital needed (better) */
  capitalRequirement: number;
  /** 0-1: Is the market ready? */
  marketReadiness: number;
  /** 0-1: Lower = less complex (better) */
  implementationComplexity: number;
  /** Combined viability (0-1): higher = more viable */
  viabilityScore: number;
  /** Qualitative label */
  viabilityLabel: "strong" | "moderate" | "weak" | "exploratory";
  /** Propagated confidence from the full reasoning chain */
  chainConfidence: number;
  /** Which pattern(s) this derives from, if any */
  sourcePatternIds: string[];
  /** Explanation */
  explanation: string;
}

export interface ViabilityReport {
  scores: ViabilityScore[];
  /** Opportunities passing viability threshold */
  viableCount: number;
  /** Opportunities below threshold but kept as exploratory */
  exploratoryCount: number;
}

// ═══════════════════════════════════════════════════════════════
//  RISK LEVEL SCORING UTILITY
// ═══════════════════════════════════════════════════════════════

function riskToScore(risk: "low" | "moderate" | "high" | undefined): number {
  if (risk === "low") return 0.85;
  if (risk === "moderate") return 0.55;
  if (risk === "high") return 0.25;
  return 0.5; // unknown
}

// ═══════════════════════════════════════════════════════════════
//  CONFIDENCE PROPAGATION
// ═══════════════════════════════════════════════════════════════

/**
 * Propagate confidence through the reasoning chain:
 * Evidence confidence → Signal confidence → Constraint confidence → Opportunity confidence
 *
 * Each link applies an attenuation factor (0.85) to prevent
 * weak evidence from producing overly confident opportunities.
 */
function propagateConfidence(
  opportunity: StrategicInsight,
  constraints: StrategicInsight[],
  allEvidence: Evidence[],
  severityScores: SeverityScore[],
): number {
  const ATTENUATION = 0.85;

  // Layer 1: Average evidence confidence
  const evidenceItems = allEvidence.filter(e => opportunity.evidenceIds.includes(e.id));
  const evidenceConfidence = evidenceItems.length > 0
    ? evidenceItems.reduce((s, e) => s + (e.confidenceScore ?? 0.3), 0) / evidenceItems.length
    : 0.3;

  // Layer 2: Related constraint severity (higher severity = more confident the constraint is real)
  const relatedConstraints = constraints.filter(c =>
    opportunity.relatedInsightIds.includes(c.id)
  );
  let constraintConfidence = 0.5;
  if (relatedConstraints.length > 0) {
    const relatedSeverities = relatedConstraints
      .map(c => severityScores.find(s => s.constraintId === c.id)?.severity ?? 0.5);
    constraintConfidence = relatedSeverities.reduce((s, v) => s + v, 0) / relatedSeverities.length;
  }

  // Layer 3: Opportunity's own confidence
  const oppConfidence = opportunity.confidence;

  // Propagate with attenuation at each link
  return Math.round(
    evidenceConfidence * ATTENUATION * constraintConfidence * ATTENUATION * oppConfidence * 100
  ) / 100;
}

// ═══════════════════════════════════════════════════════════════
//  VIABILITY SCORING
// ═══════════════════════════════════════════════════════════════

function scoreOpportunityViability(
  opportunity: StrategicInsight,
  constraints: StrategicInsight[],
  allEvidence: Evidence[],
  severityScores: SeverityScore[],
): ViabilityScore {
  const vectorData = opportunity.opportunityVectorData;
  const sourcePatternIds: string[] = [];

  let feasibility = 0.5;
  let capitalRequirement = 0.5;
  let marketReadiness = 0.5;
  let implementationComplexity = 0.5;

  // If opportunity comes from pattern library, use pattern metadata
  if (vectorData) {
    // Try to find the source pattern from the description or rationale
    const descText = `${opportunity.label} ${opportunity.description}`.toLowerCase();

    // Check each pattern for alignment
    for (const shift of vectorData.changedDimensions) {
      // Match patterns by their transformation descriptions
      const allPatternIds = [
        "ownership_to_access", "bundled_to_unbundled", "closed_to_platform",
        "service_to_product", "fragmented_to_aggregated", "linear_to_ecosystem",
        "manual_to_automated", "onetime_to_recurring", "intermediated_to_direct",
        "fixed_to_usage", "expert_to_guided", "synchronous_to_async",
        "centralized_to_distributed", "inventory_to_on_demand", "linear_to_circular",
        "single_use_to_multi_use", "analog_to_digital_twin", "complex_to_simplified",
        "individual_to_community", "reactive_to_predictive",
      ];

      for (const pid of allPatternIds) {
        const pattern = getPatternById(pid);
        if (!pattern) continue;
        if (descText.includes(pattern.name.toLowerCase()) ||
            descText.includes(pattern.transformation.toLowerCase().slice(0, 30))) {
          sourcePatternIds.push(pid);

          // Use pattern feasibility data
          feasibility = (
            riskToScore(pattern.baseFeasibility.regulatoryRisk) * 0.3 +
            riskToScore(pattern.baseFeasibility.switchingFriction) * 0.3 +
            (pattern.mechanismProfile.economicLeverage ? 0.8 : 0.4) * 0.4
          );
          capitalRequirement = pattern.baseFeasibility.implementationComplexity === "high" ? 0.7
            : pattern.baseFeasibility.implementationComplexity === "moderate" ? 0.45
            : 0.2;
          marketReadiness = pattern.marketMaturity === "emerging" ? 0.4
            : pattern.marketMaturity === "growing" ? 0.7
            : pattern.marketMaturity === "mature" ? 0.85
            : 0.3; // saturated
          implementationComplexity = riskToScore(pattern.baseFeasibility.operationalBurden) > 0.6
            ? 0.35 : 0.65;

          break; // Use first matched pattern
        }
      }
    }
  }

  // If no pattern matched, score based on evidence and constraint data
  if (sourcePatternIds.length === 0) {
    const evidenceItems = allEvidence.filter(e => opportunity.evidenceIds.includes(e.id));
    feasibility = Math.min(1, 0.3 + evidenceItems.length * 0.05);
    capitalRequirement = 0.5;
    marketReadiness = 0.5;
    implementationComplexity = 0.5;
  }

  // Propagate confidence through the chain
  const chainConfidence = propagateConfidence(
    opportunity, constraints, allEvidence, severityScores
  );

  // Combined viability = feasibility and market readiness are positive,
  // capital and complexity are negative (invert them)
  const viabilityScore = Math.round((
    feasibility * 0.3 +
    (1 - capitalRequirement) * 0.2 +
    marketReadiness * 0.25 +
    (1 - implementationComplexity) * 0.25
  ) * 100) / 100;

  const viabilityLabel: ViabilityScore["viabilityLabel"] =
    viabilityScore >= 0.7 ? "strong"
    : viabilityScore >= 0.5 ? "moderate"
    : viabilityScore >= 0.3 ? "weak"
    : "exploratory";

  const parts: string[] = [];
  if (feasibility >= 0.7) parts.push("high feasibility");
  if (marketReadiness >= 0.7) parts.push("market ready");
  if (capitalRequirement >= 0.6) parts.push("capital intensive");
  if (implementationComplexity >= 0.6) parts.push("complex implementation");
  if (chainConfidence < 0.3) parts.push("low confidence chain");

  return {
    opportunityId: opportunity.id,
    opportunityLabel: opportunity.label,
    feasibility,
    capitalRequirement,
    marketReadiness,
    implementationComplexity,
    viabilityScore,
    viabilityLabel,
    chainConfidence,
    sourcePatternIds,
    explanation: parts.length > 0 ? parts.join(", ") : "standard viability assessment",
  };
}

// ═══════════════════════════════════════════════════════════════
//  MAIN: SCORE ALL OPPORTUNITIES
// ═══════════════════════════════════════════════════════════════

export function scoreViability(
  opportunities: StrategicInsight[],
  constraints: StrategicInsight[],
  allEvidence: Evidence[],
  severityScores: SeverityScore[],
): ViabilityReport {
  const scores = opportunities.map(opp =>
    scoreOpportunityViability(opp, constraints, allEvidence, severityScores)
  );

  // Sort by viability descending
  scores.sort((a, b) => b.viabilityScore - a.viabilityScore);

  return {
    scores,
    viableCount: scores.filter(s => s.viabilityLabel === "strong" || s.viabilityLabel === "moderate").length,
    exploratoryCount: scores.filter(s => s.viabilityLabel === "exploratory").length,
  };
}

// ═══════════════════════════════════════════════════════════════
//  GRACEFUL DEGRADATION — Never return zero results
// ═══════════════════════════════════════════════════════════════

/**
 * Generate exploratory opportunity hypotheses when the main pipeline
 * produces few or no results. Uses partial signals, weak constraints,
 * or industry priors to suggest lower-confidence ideas.
 */
export function generateExploratoryOpportunities(
  signals: { id: string; label: string; description: string; category: string; strength: number }[],
  allEvidence: Evidence[],
  analysisId: string,
): StrategicInsight[] {
  const now = Date.now();
  const opportunities: StrategicInsight[] = [];

  // Strategy 1: Generate from strongest signals even if below constraint threshold
  const topSignals = [...signals].sort((a, b) => b.strength - a.strength).slice(0, 3);
  for (const sig of topSignals) {
    const label = `Explore: ${sig.label.replace(/^[^:]+:\s*/, "")}`;
    opportunities.push({
      id: `exploratory-${opportunities.length + 1}`,
      analysisId,
      insightType: "emerging_opportunity",
      label,
      description: `Exploratory hypothesis based on ${sig.category.replace(/_/g, " ")} signal. ${sig.description.slice(0, 120)}. Confidence is limited — additional evidence needed.`,
      evidenceIds: [],
      relatedInsightIds: [],
      impact: 4,
      confidence: 0.25,
      createdAt: now,
      tier: "structural",
      mode: "product",
      confidenceScore: 0.25,
      recommendedTools: [],
    });
  }

  // Strategy 2: Industry prior patterns (common opportunities in most businesses)
  if (opportunities.length < 2) {
    const priors = [
      "Process automation to reduce manual labor dependency",
      "Direct customer relationship to improve margin and data access",
      "Recurring revenue model to increase predictability",
    ];
    for (const prior of priors.slice(0, 2 - opportunities.length)) {
      opportunities.push({
        id: `exploratory-prior-${opportunities.length + 1}`,
        analysisId,
        insightType: "emerging_opportunity",
        label: `Explore: ${prior}`,
        description: `Industry-common opportunity hypothesis. Not yet supported by specific evidence from this analysis. Labeled as exploratory.`,
        evidenceIds: [],
        relatedInsightIds: [],
        impact: 3,
        confidence: 0.15,
        createdAt: now,
        tier: "structural",
        mode: "product",
        confidenceScore: 0.15,
        recommendedTools: [],
      });
    }
  }

  return opportunities;
}
