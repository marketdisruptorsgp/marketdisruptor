/**
 * CONSTRAINT SEVERITY ENGINE — Stage 5
 *
 * Scores constraints by systemic importance using three dimensions:
 *   1. Evidence strength — depth and quality of supporting evidence
 *   2. System centrality — how connected the constraint is to other system elements
 *   3. Impact weight — structural importance based on tier and downstream effects
 *
 * Output: SeverityScore per constraint, used by pattern matching and
 * opportunity generation to prioritize the most structurally important constraints.
 */

import type { StrategicInsight, StrategicSignal } from "@/lib/strategicEngine";
import type { Evidence } from "@/lib/evidenceEngine";
import type { ConstraintInteractionSet } from "@/lib/constraintInteractionEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface SeverityScore {
  constraintId: string;
  constraintLabel: string;
  /** Evidence strength (0-1): quality and density of supporting evidence */
  evidenceStrength: number;
  /** System centrality (0-1): connectivity to other constraints, signals, and evidence */
  systemCentrality: number;
  /** Impact weight (0-1): structural tier importance and downstream effects */
  impactWeight: number;
  /** Combined severity (0-1): weighted average of three dimensions */
  severity: number;
  /** Qualitative severity label */
  severityLabel: "critical" | "high" | "moderate" | "low";
  /** Explanation of how severity was computed */
  explanation: string;
}

export interface SeverityReport {
  scores: SeverityScore[];
  /** The single most systemically important constraint */
  primaryBottleneck: SeverityScore | null;
  /** Average severity across all constraints */
  averageSeverity: number;
}

// ═══════════════════════════════════════════════════════════════
//  SEVERITY COMPUTATION
// ═══════════════════════════════════════════════════════════════

/** Weights for combining the three severity dimensions */
const WEIGHTS = {
  evidenceStrength: 0.3,
  systemCentrality: 0.35,
  impactWeight: 0.35,
} as const;

function computeEvidenceStrength(
  constraint: StrategicInsight,
  allEvidence: Evidence[],
): number {
  const evidenceItems = allEvidence.filter(e => constraint.evidenceIds.includes(e.id));
  if (evidenceItems.length === 0) return 0;

  // Factor 1: Evidence count (normalized, cap at 10)
  const countScore = Math.min(1, evidenceItems.length / 10);

  // Factor 2: Average confidence of supporting evidence
  const avgConfidence = evidenceItems.reduce(
    (sum, e) => sum + (e.confidenceScore ?? 0.3), 0
  ) / evidenceItems.length;

  // Factor 3: Evidence type diversity (more types = stronger)
  const types = new Set(evidenceItems.map(e => e.type));
  const typeScore = Math.min(1, types.size / 4);

  // Factor 4: Category diversity
  const categories = new Set(evidenceItems.map(e => e.category).filter(Boolean));
  const catScore = Math.min(1, categories.size / 3);

  return (countScore * 0.3) + (avgConfidence * 0.3) + (typeScore * 0.2) + (catScore * 0.2);
}

function computeSystemCentrality(
  constraint: StrategicInsight,
  allConstraints: StrategicInsight[],
  signals: StrategicSignal[],
  interactions: ConstraintInteractionSet | null,
  allEvidence: Evidence[],
): number {
  // Factor 1: Evidence overlap with other constraints
  const constraintEvSet = new Set(constraint.evidenceIds);
  let overlapCount = 0;
  for (const other of allConstraints) {
    if (other.id === constraint.id) continue;
    const hasOverlap = other.evidenceIds.some(id => constraintEvSet.has(id));
    if (hasOverlap) overlapCount++;
  }
  const overlapScore = Math.min(1, overlapCount / Math.max(1, allConstraints.length - 1));

  // Factor 2: Connected signals
  const connectedSignals = signals.filter(s =>
    s.evidenceIds.some(id => constraintEvSet.has(id))
  ).length;
  const signalScore = Math.min(1, connectedSignals / Math.max(1, signals.length));

  // Factor 3: Interaction count (from interaction engine)
  let interactionScore = 0;
  if (interactions) {
    const interactionCount = interactions.interactions.filter(
      i => i.constraintIds.includes(constraint.id)
    ).length;
    interactionScore = Math.min(1, interactionCount / 3);
  }

  // Factor 4: Related insight connections
  const relatedScore = Math.min(1, constraint.relatedInsightIds.length / 5);

  return (overlapScore * 0.3) + (signalScore * 0.25) + (interactionScore * 0.25) + (relatedScore * 0.2);
}

function computeImpactWeight(constraint: StrategicInsight): number {
  // Factor 1: Tier (extracted from description or default)
  let tier = 2;
  const tierMatch = constraint.description.match(/tier:\s*(\d)/i);
  if (tierMatch) tier = parseInt(tierMatch[1]);
  // Constraints from hypothesis system have stable IDs indicating tier
  const idMatch = constraint.description.match(/\[C-[A-Z]+-\d+:/);
  if (idMatch) {
    // Tier 1 constraints are structural (highest impact weight)
    const confMatch = constraint.description.match(/confidence:\s*(strong|moderate|limited)/);
    if (confMatch?.[1] === "strong") tier = 1;
  }
  const tierScore = tier === 1 ? 1 : tier === 2 ? 0.65 : 0.35;

  // Factor 2: Impact score (from constraint itself)
  const impactScore = Math.min(1, constraint.impact / 10);

  // Factor 3: Confidence
  const confidenceScore = constraint.confidence;

  return (tierScore * 0.4) + (impactScore * 0.35) + (confidenceScore * 0.25);
}

function deriveSeverityLabel(severity: number): "critical" | "high" | "moderate" | "low" {
  if (severity >= 0.75) return "critical";
  if (severity >= 0.55) return "high";
  if (severity >= 0.35) return "moderate";
  return "low";
}

// ═══════════════════════════════════════════════════════════════
//  MAIN: SCORE CONSTRAINT SEVERITY
// ═══════════════════════════════════════════════════════════════

export function scoreConstraintSeverity(
  activeConstraints: StrategicInsight[],
  signals: StrategicSignal[],
  allEvidence: Evidence[],
  interactions: ConstraintInteractionSet | null,
): SeverityReport {
  if (activeConstraints.length === 0) {
    return { scores: [], primaryBottleneck: null, averageSeverity: 0 };
  }

  const scores: SeverityScore[] = activeConstraints.map(constraint => {
    const evidenceStrength = computeEvidenceStrength(constraint, allEvidence);
    const systemCentrality = computeSystemCentrality(
      constraint, activeConstraints, signals, interactions, allEvidence
    );
    const impactWeight = computeImpactWeight(constraint);

    const severity = (
      evidenceStrength * WEIGHTS.evidenceStrength +
      systemCentrality * WEIGHTS.systemCentrality +
      impactWeight * WEIGHTS.impactWeight
    );

    const severityLabel = deriveSeverityLabel(severity);

    const parts: string[] = [];
    if (evidenceStrength >= 0.6) parts.push("strong evidence base");
    else if (evidenceStrength < 0.3) parts.push("limited evidence");
    if (systemCentrality >= 0.6) parts.push("highly connected");
    else if (systemCentrality < 0.3) parts.push("isolated");
    if (impactWeight >= 0.7) parts.push("structurally critical");

    const explanation = parts.length > 0
      ? `${severityLabel} severity: ${parts.join(", ")}`
      : `${severityLabel} severity based on combined assessment`;

    return {
      constraintId: constraint.id,
      constraintLabel: constraint.label,
      evidenceStrength,
      systemCentrality,
      impactWeight,
      severity,
      severityLabel,
      explanation,
    };
  });

  // Sort by severity descending
  scores.sort((a, b) => b.severity - a.severity);

  const averageSeverity = scores.reduce((s, sc) => s + sc.severity, 0) / scores.length;

  return {
    scores,
    primaryBottleneck: scores[0] ?? null,
    averageSeverity: Math.round(averageSeverity * 100) / 100,
  };
}
