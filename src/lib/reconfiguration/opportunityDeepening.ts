/**
 * OPPORTUNITY DEEPENING — Stage 4
 *
 * Takes qualified structural patterns + the structural profile and
 * produces 2-3 fully reasoned opportunity candidates, each with:
 *
 *   1. Causal Chain     — constraint → driver → pattern → outcome
 *   2. Strategic Bet    — industry assumption vs. contrarian belief
 *   3. Economic Mechanism — how value is created / captured
 *   4. Feasibility Assessment — what must be true for this to work
 *   5. First Move       — the smallest step to test the thesis
 *
 * This replaces the inline pattern-to-insight conversion that was
 * previously embedded in the strategic engine's Stage 8.
 */

import type { StructuralProfile } from "./structuralProfile";
import type { QualifiedPattern } from "./patternQualification";
import type { StrategicBetTemplate } from "./patternLibrary";
import type { Evidence } from "@/lib/evidenceEngine";
import type { ConstraintCandidate } from "@/lib/constraintDetectionEngine";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { selectRelevantDirections, type ScoredDirection } from "./strategicDirections";

// ═══════════════════════════════════════════════════════════════
//  DEEPENED OPPORTUNITY — Stage 4 Output
// ═══════════════════════════════════════════════════════════════

export interface CausalChain {
  /** The binding constraint this opportunity resolves */
  constraint: string;
  /** The root cause behind the constraint */
  driver: string;
  /** The structural pattern applied */
  pattern: string;
  /** The expected outcome if the pattern works */
  outcome: string;
  /** One-sentence summary: "Because X, applying Y should produce Z" */
  reasoning: string;
}

export interface EconomicMechanism {
  /** How does this create new value or capture existing value? */
  valueCreation: string;
  /** What changes in the cost structure? */
  costStructureShift: string;
  /** What is the new or improved revenue mechanism? */
  revenueImplication: string;
  /** Does this create defensibility (network effects, switching costs, etc.)? */
  defensibility: string | null;
}

export type FeasibilityLevel = "achievable" | "challenging" | "requires_validation";

export interface FeasibilityAssessment {
  /** Overall feasibility judgment */
  level: FeasibilityLevel;
  /** What must be true in the market for this to work */
  marketConditions: string[];
  /** What capabilities must the business have or build */
  requiredCapabilities: string[];
  /** What are the primary execution risks */
  executionRisks: string[];
  /** Regulatory or legal considerations */
  regulatoryConsiderations: string | null;
}

export interface FirstMove {
  /** The smallest concrete action to test this thesis */
  action: string;
  /** What you'd learn from the first move */
  learningObjective: string;
  /** Suggested timeframe */
  timeframe: string;
  /** Go/no-go criteria */
  successCriteria: string;
}

export interface WhyThisMatters {
  /** Why the insight matters — business consequences */
  implications: string[];
  /** What happens if this constraint is solved */
  ifSolved: string[];
}

export interface StrategicPrecedent {
  /** Company name */
  company: string;
  /** Brief description of what they did */
  description: string;
  /** The strategic pattern this maps to */
  pattern: string;
}

export interface DeepenedOpportunity {
  /** Unique ID */
  id: string;
  /** Pattern that generated this opportunity */
  patternId: string;
  patternName: string;
  /** Human-readable label (action-oriented, sentence case) */
  label: string;
  /** Concrete business reconfiguration — the specific structural move, not the pattern name */
  reconfigurationLabel: string;
  /** One-paragraph summary of the opportunity */
  summary: string;
  /** Full causal chain: constraint → driver → pattern → outcome */
  causalChain: CausalChain;
  /** The strategic bet — what industry belief is being challenged */
  strategicBet: StrategicBetTemplate;
  /** How value is created and captured */
  economicMechanism: EconomicMechanism;
  /** Feasibility assessment */
  feasibility: FeasibilityAssessment;
  /** The first move to test the thesis */
  firstMove: FirstMove;
  /** Real-world precedents (legacy string format) */
  precedents: string[];
  /** Structured strategic precedents with company details */
  strategicPrecedents?: StrategicPrecedent[];
  /** Impact layer — why the constraint matters and what changes if solved */
  whyThisMatters?: WhyThisMatters;
  /** Second-order effects if this strategic move succeeds */
  secondOrderEffects?: string[];
  /** Constraints this opportunity resolves */
  resolvesConstraints: string[];
  /** Evidence IDs that support this opportunity */
  evidenceIds: string[];
  /** Signal density from qualification (for ranking) */
  signalDensity: number;
}

// ═══════════════════════════════════════════════════════════════
//  REALISM FILTER HELPERS
// ═══════════════════════════════════════════════════════════════

const UNREALISTIC_DIRECTION_IDS = new Set([
  "platformize",
  "shared_infrastructure",
  "marketplace",
  "network_effect",
  "data_advantage",
  "freemium_flip",
]);

const UNREALISTIC_PATTERN_IDS = new Set([
  "infrastructure_abstraction",
  "network_effect",
  "data_moat",
  "freemium_flip",
  "loss_leader_ecosystem",
]);

function isTraditionalBusinessProfile(profile: StructuralProfile): boolean {
  const laborHeavy = profile.laborIntensity === "labor_heavy" || profile.laborIntensity === "artisan";
  const nonDigitalRevenue =
    profile.revenueModel === "project_based" ||
    profile.revenueModel === "transactional" ||
    profile.revenueModel === "mixed";
  const servicePosition = profile.valueChainPosition === "end_service" || profile.valueChainPosition === "application";
  const ownerDependent = profile.ownerDependency === "owner_reliant" || profile.ownerDependency === "owner_critical";

  return laborHeavy && nonDigitalRevenue && (servicePosition || ownerDependent || profile.etaActive);
}

function isUnrealisticText(text: string): boolean {
  return /(\bsaas\b|software[-\s]?as[-\s]?a[-\s]?service|\bmarketplace\b|\bplatform\b|network effects?|api[-\s]?first|developer tool|sell to other shops|shared infrastructure)/i.test(text);
}

function filterRealisticOpportunities(
  opportunities: DeepenedOpportunity[],
  profile: StructuralProfile,
): DeepenedOpportunity[] {
  if (!isTraditionalBusinessProfile(profile)) return opportunities;

  return opportunities.filter((opp) => {
    if (UNREALISTIC_PATTERN_IDS.has(opp.patternId) || UNREALISTIC_DIRECTION_IDS.has(opp.patternId)) {
      return false;
    }

    const combinedText = [
      opp.patternName,
      opp.label,
      opp.reconfigurationLabel,
      opp.summary,
      opp.strategicBet?.industryAssumption,
      opp.strategicBet?.contrarianBelief,
      opp.strategicBet?.implication,
      opp.firstMove?.action,
      opp.firstMove?.learningObjective,
    ]
      .filter(Boolean)
      .join(" ");

    return !isUnrealisticText(combinedText);
  });
}

// ═══════════════════════════════════════════════════════════════
//  DEEPENING ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Deepen qualified patterns into full opportunity candidates.
 * Produces 2-3 opportunities, never more than 4.
 */
export function deepenOpportunities(
  qualifiedPatterns: QualifiedPattern[],
  profile: StructuralProfile,
  evidence: Evidence[],
): DeepenedOpportunity[] {
  if (qualifiedPatterns.length === 0) return [];

  // Take top 3 by signal density (already sorted)
  const topPatterns = qualifiedPatterns.slice(0, 3);

  return topPatterns.map((qp, idx) => {
    const constraint = findPrimaryConstraint(qp, profile);
    const driver = inferDriver(constraint, profile, evidence);
    const causalChain = buildCausalChain(constraint, driver, qp, profile);
    const economicMechanism = deriveEconomicMechanism(qp, profile);
    const feasibility = assessFeasibility(qp, profile);
    const firstMove = designFirstMove(qp, profile, constraint);
    const label = buildOpportunityLabel(qp, profile);
    const reconfigurationLabel = buildReconfigurationLabel(qp, profile, constraint);
    const summary = buildSummary(qp, causalChain, economicMechanism);
    const relevantEvidenceIds = findRelevantEvidence(qp, evidence);

    return {
      id: `deep-opp-${idx + 1}`,
      patternId: qp.pattern.id,
      patternName: qp.pattern.name,
      label,
      reconfigurationLabel,
      summary,
      causalChain,
      strategicBet: qp.strategicBet,
      economicMechanism,
      feasibility,
      firstMove,
      precedents: qp.pattern.precedents,
      resolvesConstraints: qp.qualification.resolvesConstraints,
      evidenceIds: relevantEvidenceIds,
      signalDensity: qp.signalDensity,
    };
  });
}

// ═══════════════════════════════════════════════════════════════
//  ASYNC DEEPENING — AI-Powered via Edge Function
//  Now uses Strategic Direction Categories for 3-5 opportunities
// ═══════════════════════════════════════════════════════════════

/**
 * AI-powered thesis deepening using the hybrid approach:
 * Strategic Direction Categories (fixed scaffolding) + AI contextual generation.
 * Produces 3-5 structurally distinct opportunities per analysis.
 * Falls back to deterministic deepening if AI fails.
 */
export async function deepenOpportunitiesAsync(
  qualifiedPatterns: QualifiedPattern[],
  profile: StructuralProfile,
  evidence: Evidence[],
  analysisType: string = "product",
  businessContext?: string,
  operatorLens?: {
    lensType?: string;
    name?: string;
    risk_tolerance?: string;
    constraints?: string;
    primary_objective?: string;
    target_outcome?: string;
    time_horizon?: string;
    available_resources?: string;
    evaluation_priorities?: Record<string, number>;
  },
  biExtraction?: Record<string, unknown> | null,
): Promise<DeepenedOpportunity[]> {
  // Select relevant strategic directions based on structural profile AND analysis type
  const scoredDirections = selectRelevantDirections(profile, 5, analysisType);
  const hasDirections = scoredDirections.length >= 3;

  // Build evidence summary for the AI (top 25 most impactful)
  const evidenceSummary = evidence
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))
    .slice(0, 25)
    .map(e => ({
      type: e.type,
      label: e.label,
      description: e.description?.slice(0, 200) ?? null,
      impact: e.impact,
      category: e.category ?? null,
    }));

  try {
    const bodyPayload: Record<string, any> = {
      structuralProfile: {
        supplyFragmentation: profile.supplyFragmentation,
        marginStructure: profile.marginStructure,
        switchingCosts: profile.switchingCosts,
        distributionControl: profile.distributionControl,
        laborIntensity: profile.laborIntensity,
        revenueModel: profile.revenueModel,
        customerConcentration: profile.customerConcentration,
        assetUtilization: profile.assetUtilization,
        regulatorySensitivity: profile.regulatorySensitivity,
        valueChainPosition: profile.valueChainPosition,
        etaActive: profile.etaActive,
        ownerDependency: profile.ownerDependency,
        acquisitionComplexity: profile.acquisitionComplexity,
        improvementRunway: profile.improvementRunway,
        bindingConstraints: profile.bindingConstraints.map(bc => ({
          constraintName: bc.constraintName,
          explanation: bc.explanation,
        })),
      },
      evidenceSummary,
      analysisType,
      businessContext: businessContext ?? buildBusinessContextFromEvidence(evidence),
      operatorLens: operatorLens || null,
    };

    // Include full structured BI extraction for deep business reasoning
    if (biExtraction) {
      bodyPayload.documentIntelligence = buildDocumentIntelligencePayload(biExtraction);
    }

    // Include qualified patterns if available
    if (qualifiedPatterns.length > 0) {
      bodyPayload.qualifiedPatterns = qualifiedPatterns.map(qp => ({
        pattern: {
          id: qp.pattern.id,
          name: qp.pattern.name,
          transformation: qp.pattern.transformation,
          mechanism: qp.pattern.mechanism,
          precedents: qp.pattern.precedents,
        },
        signalDensity: qp.signalDensity,
        qualification: {
          resolvesConstraints: qp.qualification.resolvesConstraints,
          strengthSignals: qp.qualification.strengthSignals,
        },
        strategicBet: qp.strategicBet,
      }));
    }

    // Include strategic directions for multi-opportunity generation
    if (hasDirections) {
      bodyPayload.strategicDirections = scoredDirections.map(sd => ({
        id: sd.direction.id,
        label: sd.direction.label,
        description: sd.direction.description,
        aiPromptHint: sd.direction.aiPromptHint,
        relevanceScore: sd.relevanceScore,
      }));
    }

    const { data, error } = await invokeWithTimeout<{ theses: any[]; fallback?: boolean }>(
      "deepen-thesis",
      { body: bodyPayload },
      120_000,
    );

    if (error || !data?.theses || data.theses.length === 0 || data.fallback) {
      console.warn("[AI Deepening] Falling back to deterministic:", error);
      return deepenOpportunitiesDeterministic(qualifiedPatterns, profile, evidence);
    }

    console.log(`[AI Deepening] Received ${data.theses.length} AI-generated theses`);

    // Map AI output to DeepenedOpportunity format
    const mappedOpportunities = data.theses.map((thesis: any, idx: number) => {
      // Find matching qualified pattern (by patternId or directionId)
      const matchedQP = qualifiedPatterns.find(qp => qp.pattern.id === thesis.patternId)
        ?? qualifiedPatterns[Math.min(idx, qualifiedPatterns.length - 1)];

      // For direction-based theses without a matching pattern, create a synthetic wrapper
      const patternId = thesis.directionId || thesis.patternId || `direction-${idx}`;
      const patternName = thesis.directionId
        ? (scoredDirections.find(sd => sd.direction.id === thesis.directionId)?.direction.label || patternId)
        : (matchedQP?.pattern.name || patternId);

      const relevantEvidenceIds = matchedQP ? findRelevantEvidence(matchedQP, evidence) : [];

      return {
        id: `deep-opp-ai-${idx + 1}`,
        patternId,
        patternName,
        label: thesis.reconfigurationLabel || patternName,
        reconfigurationLabel: thesis.reconfigurationLabel || "Strategic reconfiguration",
        summary: thesis.summary || "",
        causalChain: {
          constraint: thesis.causalChain?.constraint || "structural constraint",
          driver: thesis.causalChain?.driver || "underlying structural friction",
          pattern: thesis.causalChain?.pattern || patternName,
          outcome: thesis.causalChain?.outcome || "improved structural position",
          reasoning: thesis.causalChain?.reasoning || "",
        },
        strategicBet: {
          industryAssumption: thesis.strategicBet?.industryAssumption || matchedQP?.strategicBet.industryAssumption || "Industry norm",
          contrarianBelief: thesis.strategicBet?.contrarianBelief || matchedQP?.strategicBet.contrarianBelief || "Contrarian view",
          implication: thesis.strategicBet?.implication || matchedQP?.strategicBet.implication || "Strategic implication",
        },
        economicMechanism: {
          valueCreation: thesis.economicMechanism?.valueCreation || "",
          costStructureShift: thesis.economicMechanism?.costStructureShift || "",
          revenueImplication: thesis.economicMechanism?.revenueImplication || "",
          defensibility: thesis.economicMechanism?.defensibility || null,
        },
        feasibility: {
          level: (thesis.feasibility?.level as any) || "requires_validation",
          marketConditions: thesis.feasibility?.marketConditions || [],
          requiredCapabilities: thesis.feasibility?.requiredCapabilities || [],
          executionRisks: thesis.feasibility?.executionRisks || [],
          regulatoryConsiderations: thesis.feasibility?.regulatoryConsiderations || null,
        },
        firstMove: {
          action: thesis.firstMove?.action || "Identify the core assumption and test it with 5-10 customers",
          learningObjective: thesis.firstMove?.learningObjective || "Whether the structural change addresses a real need",
          timeframe: thesis.firstMove?.timeframe || "2 weeks",
          successCriteria: thesis.firstMove?.successCriteria || "30%+ positive response rate",
        },
        precedents: thesis.precedents || matchedQP?.pattern.precedents || [],
        strategicPrecedents: thesis.strategicPrecedents || undefined,
        whyThisMatters: thesis.whyThisMatters || undefined,
        secondOrderEffects: thesis.secondOrderEffects || undefined,
        resolvesConstraints: matchedQP?.qualification.resolvesConstraints || [],
        evidenceIds: relevantEvidenceIds,
        signalDensity: matchedQP?.signalDensity || 0,
      } as DeepenedOpportunity;
    }).filter(Boolean) as DeepenedOpportunity[];

    const filtered = filterRealisticOpportunities(mappedOpportunities, profile);
    if (filtered.length === 0) {
      console.warn("[AI Deepening] All AI theses failed realism filter; using deterministic fallback");
      return filterRealisticOpportunities(
        deepenOpportunitiesDeterministic(qualifiedPatterns, profile, evidence),
        profile,
      ).slice(0, 5);
    }

    return filtered.slice(0, 5);
  } catch (err) {
    console.warn("[AI Deepening] Error, falling back to deterministic:", err);
    return deepenOpportunitiesDeterministic(qualifiedPatterns, profile, evidence);
  }
}

/**
 * Deterministic fallback that uses strategic directions to generate
 * 3-5 opportunities even without AI. Less specific but guarantees breadth.
 */
function deepenOpportunitiesDeterministic(
  qualifiedPatterns: QualifiedPattern[],
  profile: StructuralProfile,
  evidence: Evidence[],
): DeepenedOpportunity[] {
  // Start with pattern-based opportunities
  const patternOpps = deepenOpportunities(qualifiedPatterns, profile, evidence);

  // If we already have 3+, return them
  if (patternOpps.length >= 3) return patternOpps.slice(0, 5);

  // Use strategic directions to fill the gap
  const scoredDirections = selectRelevantDirections(profile, 5);
  const usedPatternIds = new Set(patternOpps.map(o => o.patternId));

  for (const { direction, relevanceScore } of scoredDirections) {
    if (patternOpps.length >= 5) break;
    // Skip directions that overlap with existing pattern opportunities
    if (usedPatternIds.has(direction.id)) continue;
    if (direction.id === "aggregate" && usedPatternIds.has("aggregation")) continue;
    if (direction.id === "shared_infrastructure" && usedPatternIds.has("infrastructure_abstraction")) continue;
    if (isTraditionalBusinessProfile(profile) && UNREALISTIC_DIRECTION_IDS.has(direction.id)) continue;

    const constraint = profile.bindingConstraints[0]?.explanation || "structural constraint";
    const driver = profile.bindingConstraints[0]?.constraintName.replace(/_/g, " ") || "underlying friction";

    patternOpps.push({
      id: `deep-opp-dir-${direction.id}`,
      patternId: direction.id,
      patternName: direction.label,
      label: `${direction.label}: ${direction.description.slice(0, 80)}`,
      reconfigurationLabel: `${direction.label} — ${direction.description}`,
      summary: `${direction.description} This direction has ${relevanceScore >= 6 ? "high" : relevanceScore >= 3 ? "moderate" : "exploratory"} structural relevance based on the current business profile.`,
      causalChain: {
        constraint,
        driver,
        pattern: direction.label,
        outcome: `Unlock new value through ${direction.label.toLowerCase()}`,
        reasoning: `Because ${driver}, applying ${direction.label.toLowerCase()} could address the structural constraint.`,
      },
      strategicBet: {
        industryAssumption: "The current model is the only viable approach",
        contrarianBelief: `${direction.label} could fundamentally change the economics`,
        implication: "First mover in this direction captures structural advantage",
      },
      economicMechanism: {
        valueCreation: direction.description,
        costStructureShift: "Shifts from variable to fixed costs",
        revenueImplication: "Creates new revenue stream or improves unit economics",
        defensibility: null,
      },
      feasibility: {
        level: "requires_validation" as FeasibilityLevel,
        marketConditions: ["Market readiness for this approach"],
        requiredCapabilities: ["Execution capability for this direction"],
        executionRisks: ["Unvalidated demand"],
        regulatoryConsiderations: null,
      },
      firstMove: {
        action: `Research 3-5 companies that have successfully applied ${direction.label.toLowerCase()} in adjacent industries`,
        learningObjective: "Whether the structural conditions support this direction",
        timeframe: "1 week",
        successCriteria: "At least 2 viable precedents identified with transferable mechanics",
      },
      precedents: [],
      whyThisMatters: {
        implications: [
          `Current operations are constrained by ${driver}`,
          `Growth potential is limited without addressing this structural friction`,
          `Competitors who solve this first gain a lasting advantage`,
        ],
        ifSolved: [
          `${direction.label} unlocks new revenue or margin opportunities`,
          `The business can scale without proportional cost increases`,
          `Structural position improves relative to competitors`,
        ],
      },
      secondOrderEffects: [
        `Early mover advantage in ${direction.label.toLowerCase()} creates switching costs`,
        `Data and network effects compound over time`,
        `Market position shifts from operator to infrastructure provider`,
      ],
      resolvesConstraints: profile.bindingConstraints.slice(0, 1).map(c => c.constraintName),
      evidenceIds: [],
      signalDensity: relevanceScore,
    });
  }

  return patternOpps;
}

/** Extract rough business context from evidence labels for AI prompt enrichment */
function buildBusinessContextFromEvidence(evidence: Evidence[]): string {
  const labels = evidence
    .filter(e => e.type === "signal" || e.type === "opportunity" || e.type === "constraint")
    .slice(0, 15)
    .map(e => e.label);
  return labels.length > 0 ? `Key business signals: ${labels.join("; ")}` : "";
}

// ═══════════════════════════════════════════════════════════════

function findPrimaryConstraint(qp: QualifiedPattern, profile: StructuralProfile): string {
  // Use the first resolved constraint, or the top binding constraint
  if (qp.qualification.resolvesConstraints.length > 0) {
    const constraintName = qp.qualification.resolvesConstraints[0];
    const binding = profile.bindingConstraints.find(c => c.constraintName === constraintName);
    return binding?.explanation || constraintName.replace(/_/g, " ");
  }
  if (profile.bindingConstraints.length > 0) {
    return profile.bindingConstraints[0].explanation || profile.bindingConstraints[0].constraintName.replace(/_/g, " ");
  }
  return "structural constraint limiting growth";
}

function inferDriver(constraint: string, profile: StructuralProfile, evidence: Evidence[]): string {
  // Look for driver signals in evidence that relate to the constraint
  const constraintLower = constraint.toLowerCase();

  // Map profile dimensions to driver explanations
  if (profile.laborIntensity === "artisan" || profile.laborIntensity === "labor_heavy") {
    if (constraintLower.includes("labor") || constraintLower.includes("owner") || constraintLower.includes("manual")) {
      return "revenue is directly coupled to labor hours, creating a linear scaling ceiling";
    }
  }
  if (profile.distributionControl === "intermediated") {
    if (constraintLower.includes("channel") || constraintLower.includes("margin") || constraintLower.includes("intermediar")) {
      return "intermediaries control the customer relationship and capture margin";
    }
  }
  if (profile.supplyFragmentation === "fragmented" || profile.supplyFragmentation === "atomized") {
    if (constraintLower.includes("fragment") || constraintLower.includes("supply")) {
      return "fragmented supply creates high search costs and prevents demand aggregation";
    }
  }
  if (profile.revenueModel === "transactional" || profile.revenueModel === "project_based") {
    if (constraintLower.includes("transact") || constraintLower.includes("revenue") || constraintLower.includes("project")) {
      return "episodic revenue creates cash flow unpredictability and prevents compounding";
    }
  }
  if (profile.assetUtilization === "underutilized" || profile.assetUtilization === "idle") {
    return "existing assets generate value for a single use case despite broader applicability";
  }

  // Fallback: derive from evidence text
  const frictionEvidence = evidence.filter(e => e.type === "friction" || e.type === "constraint");
  if (frictionEvidence.length > 0) {
    const top = frictionEvidence.sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))[0];
    return top.description?.slice(0, 120) || top.label.toLowerCase();
  }

  return "the current business structure creates friction that compounds with scale";
}

function buildCausalChain(
  constraint: string,
  driver: string,
  qp: QualifiedPattern,
  profile: StructuralProfile,
): CausalChain {
  const outcome = deriveOutcome(qp, profile);

  return {
    constraint,
    driver,
    pattern: `${qp.pattern.name}: ${qp.pattern.transformation}`,
    outcome,
    reasoning: `Because ${driver}, applying ${qp.pattern.name.toLowerCase()} should ${outcome.toLowerCase().replace(/^\w/, c => c)}`,
  };
}

function deriveOutcome(qp: QualifiedPattern, profile: StructuralProfile): string {
  const patternId = qp.pattern.id;

  // Context-specific outcomes based on pattern + profile
  switch (patternId) {
    case "aggregation":
      return profile.supplyFragmentation === "atomized"
        ? "create a unified demand interface that captures the relationship premium from hundreds of small providers"
        : "reduce buyer search costs and establish supply-side network effects";

    case "unbundling":
      return profile.marginStructure === "high_margin"
        ? "expose the high-value component and capture it at better margins without subsidizing waste"
        : "improve price-to-value alignment and reduce customer objections to paying for unused components";

    case "rebundling":
      return "capture willingness-to-pay that fragmented point solutions cannot, by organizing around the true job-to-be-done";

    case "supply_chain_relocation":
      if (profile.distributionControl === "intermediated") {
        return "capture the margin delta currently absorbed by intermediaries and gain direct customer data";
      }
      return "restructure where margin accrues by occupying a higher-leverage position in the chain";

    case "stakeholder_monetization":
      if (profile.assetUtilization === "underutilized" || profile.assetUtilization === "idle") {
        return "transform underutilized assets into a second revenue stream without proportional cost increase";
      }
      return "create a new revenue mechanism from a currently unmonetized participant in the value system";

    case "infrastructure_abstraction":
      if (profile.laborIntensity === "artisan" || profile.laborIntensity === "labor_heavy") {
        return "decouple revenue from labor hours by encoding expertise into repeatable, scalable infrastructure";
      }
      return "create near-zero marginal cost per additional user by abstracting the core capability into shared infrastructure";

    default:
      return "unlock structural value that the current model leaves on the table";
  }
}

// ═══════════════════════════════════════════════════════════════
//  ECONOMIC MECHANISM
// ═══════════════════════════════════════════════════════════════

function deriveEconomicMechanism(qp: QualifiedPattern, profile: StructuralProfile): EconomicMechanism {
  const patternId = qp.pattern.id;

  switch (patternId) {
    case "aggregation":
      return {
        valueCreation: "Demand liquidity — buyers get comparison and convenience; suppliers get distribution without marketing spend",
        costStructureShift: "Variable cost per transaction replaces fixed customer acquisition cost per supplier",
        revenueImplication: "Take rate on transactions (typically 10-20%) or SaaS fees to suppliers for premium placement",
        defensibility: "Supply-side network effects — more suppliers attract more buyers, creating a flywheel that is expensive to replicate",
      };

    case "unbundling":
      return {
        valueCreation: "Customers pay only for what they value, eliminating the 'tax' of unwanted components",
        costStructureShift: "Cost per component is lower than cost of the full bundle, improving unit economics on the high-value piece",
        revenueImplication: profile.marginStructure === "high_margin"
          ? "The highest-value component likely captures 60-80% of the willingness-to-pay at a fraction of the delivery cost"
          : "Component-level pricing enables expansion into price-sensitive segments previously priced out by the bundle",
        defensibility: null,
      };

    case "rebundling":
      return {
        valueCreation: "A coherent solution to a job-to-be-done that currently requires stitching together multiple point products",
        costStructureShift: "Shared infrastructure across bundled components reduces per-feature delivery cost",
        revenueImplication: "Premium pricing for the integrated experience — customers pay more for convenience and coherence than for individual tools",
        defensibility: "Integration depth creates switching costs — once users adopt the bundle, leaving requires replacing multiple tools simultaneously",
      };

    case "supply_chain_relocation":
      return {
        valueCreation: "Capturing the margin delta at a higher-leverage position in the chain",
        costStructureShift: profile.distributionControl === "intermediated"
          ? "Eliminating intermediary margin (typically 20-40%) while adding direct fulfillment cost (typically 5-15%)"
          : "Shifting from high-cost position to lower-cost position in the value chain",
        revenueImplication: "Direct customer relationships enable upselling, data capture, and relationship-based revenue that intermediaries previously blocked",
        defensibility: profile.switchingCosts === "high"
          ? "High switching costs protect the new position once established"
          : "First-mover advantage in the new position creates temporary defensibility until competitors follow",
      };

    case "stakeholder_monetization":
      return {
        valueCreation: "Extracting latent value from an asset, audience, or byproduct that currently generates no revenue",
        costStructureShift: "Marginal cost of the new revenue stream is near-zero since the underlying asset already exists",
        revenueImplication: "Second revenue stream that grows independently of the primary business — often higher margin because costs are already absorbed",
        defensibility: "The monetizable asset is a byproduct of the core business, making it difficult for competitors without the same core to replicate",
      };

    case "infrastructure_abstraction":
      return {
        valueCreation: "Others pay for access to a capability the business already built for itself, amortizing development cost across many users",
        costStructureShift: "Fixed development cost is already sunk; each additional user is near-zero marginal cost, creating operating leverage",
        revenueImplication: profile.laborIntensity === "artisan" || profile.laborIntensity === "labor_heavy"
          ? "Subscription or usage-based revenue replaces hourly/project billing, decoupling revenue from headcount"
          : "Platform fees or API pricing create a scalable revenue stream alongside the existing business",
        defensibility: "Integration depth and data accumulation create switching costs — the more users depend on the infrastructure, the harder it is to leave",
      };

    default:
      return {
        valueCreation: qp.pattern.mechanism,
        costStructureShift: "Structural shift from current cost model",
        revenueImplication: "New revenue mechanism enabled by the structural change",
        defensibility: null,
      };
  }
}

// ═══════════════════════════════════════════════════════════════
//  FEASIBILITY ASSESSMENT
// ═══════════════════════════════════════════════════════════════

function assessFeasibility(qp: QualifiedPattern, profile: StructuralProfile): FeasibilityAssessment {
  const patternId = qp.pattern.id;
  const risks: string[] = [];
  const conditions: string[] = [];
  const capabilities: string[] = [];
  let regulatory: string | null = null;
  let level: FeasibilityLevel = "achievable";

  // Universal risk checks
  if (profile.regulatorySensitivity === "moderate" || profile.regulatorySensitivity === "heavy") {
    regulatory = profile.regulatorySensitivity === "heavy"
      ? "Heavy regulatory environment — compliance costs and legal review are required before execution"
      : "Moderate regulatory sensitivity — verify that the structural change doesn't trigger new compliance requirements";
    if (profile.regulatorySensitivity === "heavy") level = "requires_validation";
  }

  switch (patternId) {
    case "aggregation":
      conditions.push("Suppliers must be willing to list on a shared platform");
      conditions.push("Buyer search costs must be high enough that aggregation adds clear value");
      capabilities.push("Marketplace technology (listing, search, transaction processing)");
      capabilities.push("Supply acquisition and onboarding at scale");
      risks.push("Cold start problem — need critical mass on both sides before the platform is useful");
      risks.push("Disintermediation risk — suppliers may bypass the platform once they have direct relationships");
      if (profile.switchingCosts === "high") {
        risks.push("High switching costs may slow supplier adoption");
        level = "challenging";
      }
      break;

    case "unbundling":
      conditions.push("Customers must perceive the bundle as containing components they don't value");
      conditions.push("The high-value component must be deliverable independently");
      capabilities.push("Ability to price and deliver individual components separately");
      risks.push("Cannibalization risk — existing bundle customers may downgrade to just the valuable component");
      risks.push("Competitors may also unbundle, reducing the first-mover advantage");
      break;

    case "rebundling":
      conditions.push("Multiple point solutions must exist that customers currently stitch together manually");
      conditions.push("The job-to-be-done must be coherent enough that a unified solution is clearly better");
      capabilities.push("Integration engineering across previously separate products");
      capabilities.push("Product design that organizes around the job rather than legacy categories");
      risks.push("The 'right' rebundling axis may not be obvious — wrong bundling is worse than no bundling");
      level = "challenging";
      break;

    case "supply_chain_relocation":
      conditions.push("The target position in the chain must be accessible without prohibitive capital requirements");
      capabilities.push("Operational capability to fulfil the function currently performed by the intermediary or adjacent player");
      risks.push("Existing chain participants may retaliate or create barriers");
      if (profile.distributionControl === "intermediated") {
        risks.push("Intermediaries may have contractual or relationship lock-in with end customers");
        conditions.push("End customers must be reachable through alternative channels");
      }
      if (profile.marginStructure === "thin_margin") level = "challenging";
      break;

    case "stakeholder_monetization":
      conditions.push("The latent asset must be valuable enough that a stakeholder will pay for access");
      conditions.push("Monetization must not degrade the primary product or alienate existing customers");
      capabilities.push("Ability to package and deliver the asset to the new stakeholder");
      risks.push("Privacy or data-sharing concerns if the monetizable asset involves customer data");
      risks.push("Brand risk if the new monetization model conflicts with customer expectations");
      break;

    case "infrastructure_abstraction":
      conditions.push("The internal capability must be generalizable beyond the specific business context");
      conditions.push("Other businesses must face a similar problem and currently solve it with custom solutions");
      capabilities.push("Productization: converting internal tools/expertise into a self-serve or API-accessible product");
      capabilities.push("Support and documentation infrastructure for external users");
      risks.push("Distraction risk — building a platform business alongside the core business splits focus");
      risks.push("The abstracted capability may be commoditized if others build similar infrastructure");
      if (profile.laborIntensity === "artisan") {
        risks.push("Codifying artisan expertise may lose the nuance that makes it valuable");
        level = "challenging";
      }
      break;
  }

  return { level, marketConditions: conditions, requiredCapabilities: capabilities, executionRisks: risks, regulatoryConsiderations: regulatory };
}

// ═══════════════════════════════════════════════════════════════
//  FIRST MOVE
// ═══════════════════════════════════════════════════════════════

function designFirstMove(qp: QualifiedPattern, profile: StructuralProfile, constraint: string): FirstMove {
  const patternId = qp.pattern.id;

  switch (patternId) {
    case "aggregation":
      return {
        action: "Identify 20-30 suppliers in the most fragmented segment and interview 10 to gauge willingness to list on a shared platform",
        learningObjective: "Whether suppliers see aggregation as distribution (positive) or commoditization (threat)",
        timeframe: "2 weeks",
        successCriteria: "At least 6 of 10 suppliers express interest in listing, and buyers confirm search cost is a real pain point",
      };

    case "unbundling":
      return {
        action: "Survey 15-20 existing customers to identify which bundle components they actively use vs. ignore",
        learningObjective: "Which component captures the most willingness-to-pay and whether customers would prefer à la carte pricing",
        timeframe: "10 days",
        successCriteria: "Clear concentration: one component used by 80%+ of customers, with 40%+ expressing preference for standalone access",
      };

    case "rebundling":
      return {
        action: "Map the top 5 point solutions that target customers currently use together, and interview 10 customers about the friction of stitching them together",
        learningObjective: "Whether the integration pain is severe enough that customers would switch to a unified solution",
        timeframe: "2 weeks",
        successCriteria: "At least 7 of 10 customers describe the integration pain as significant and express interest in a unified alternative",
      };

    case "supply_chain_relocation":
      return {
        action: profile.distributionControl === "intermediated"
          ? "Reach out directly to 15-20 end customers through a channel the intermediary doesn't control (e.g., content, referral)"
          : "Map the margin stack across each position in the value chain and identify the highest-margin position that is operationally accessible",
        learningObjective: "Whether end customers respond to direct outreach and what the intermediary's actual switching cost is",
        timeframe: "2 weeks",
        successCriteria: "Response rate above 15% from direct outreach, or clear evidence that the target position captures 2x+ the margin of the current position",
      };

    case "stakeholder_monetization":
      return {
        action: "Inventory all assets, data, and byproducts the business currently produces, then identify 3 external stakeholders who might pay for access",
        learningObjective: "Which latent asset has the highest willingness-to-pay from an external stakeholder without degrading the core product",
        timeframe: "10 days",
        successCriteria: "At least one stakeholder expresses willingness to pay at a price point that would represent 10%+ of current revenue",
      };

    case "infrastructure_abstraction":
      return {
        action: `Identify the 3 most common requests from peers or adjacent businesses for the capability that resolves ${constraint.slice(0, 60)}`,
        learningObjective: "Whether the internal capability is generalizable and whether others would pay for it vs. build their own",
        timeframe: "2 weeks",
        successCriteria: "At least 3 external entities confirm they face the same problem and currently solve it with a worse custom solution",
      };

    default:
      return {
        action: "Identify the 5-10 customers most affected by the primary constraint and interview them about the proposed structural change",
        learningObjective: "Whether the structural change addresses a real pain point with sufficient willingness to pay or switch",
        timeframe: "2 weeks",
        successCriteria: "At least 30% of interviewees express strong interest in the new model",
      };
  }
}

// ═══════════════════════════════════════════════════════════════
//  LABEL & SUMMARY HELPERS
// ═══════════════════════════════════════════════════════════════

function buildOpportunityLabel(qp: QualifiedPattern, profile: StructuralProfile): string {
  const patternId = qp.pattern.id;

  // Action-oriented labels that describe the move, not the pattern name
  switch (patternId) {
    case "aggregation":
      return profile.supplyFragmentation === "atomized"
        ? "Aggregate fragmented supply into a unified marketplace"
        : "Build a single interface over scattered providers to capture demand";

    case "unbundling":
      return "Unbundle the offering and sell the high-value component standalone";

    case "rebundling":
      return "Rebundle fragmented tools around the core job customers actually hire for";

    case "supply_chain_relocation":
      return profile.distributionControl === "intermediated"
        ? "Bypass intermediaries and go direct to capture margin and data"
        : "Relocate to a higher-leverage position in the value chain";

    case "stakeholder_monetization":
      return profile.assetUtilization === "underutilized" || profile.assetUtilization === "idle"
        ? "Monetize underutilized assets by opening them to external stakeholders"
        : "Create a second revenue stream from an unmonetized participant in the system";

    case "infrastructure_abstraction":
      return profile.laborIntensity === "artisan" || profile.laborIntensity === "labor_heavy"
        ? "Abstract expert capability into scalable infrastructure others can use"
        : "Extract the core capability into shared infrastructure with near-zero marginal cost";

    default:
      return qp.pattern.transformation;
  }
}

/**
 * Build a concrete reconfiguration label that describes the specific business move,
 * distinct from the abstract pattern name. Uses profile dimensions and constraint
 * context to generate domain-specific language.
 */
function buildReconfigurationLabel(qp: QualifiedPattern, profile: StructuralProfile, constraint: string): string {
  const patternId = qp.pattern.id;
  const constraintLower = constraint.toLowerCase();

  switch (patternId) {
    case "aggregation":
      if (constraintLower.includes("information") || constraintLower.includes("search")) {
        return "Create a demand aggregation layer that routes clients to vetted providers and captures coordination margin";
      }
      if (profile.supplyFragmentation === "atomized") {
        return "Build a single-access marketplace that consolidates hundreds of independent providers under one trusted interface";
      }
      return "Launch a comparison and booking platform that captures the relationship premium between fragmented suppliers and underserved buyers";

    case "unbundling":
      if (constraintLower.includes("value") || constraintLower.includes("mismatch")) {
        return "Extract the highest-value component and sell it standalone at a premium, eliminating forced cross-subsidy";
      }
      if (profile.marginStructure === "high_margin") {
        return "Isolate the margin-rich component from the legacy bundle and offer it as a focused, higher-value product";
      }
      return "Decompose the current offering into individually purchasable components so customers pay only for what they use";

    case "rebundling":
      if (constraintLower.includes("discovery") || constraintLower.includes("awareness")) {
        return "Assemble scattered point solutions into a unified workflow organized around the customer's actual job-to-be-done";
      }
      return "Combine fragmented tools into a single integrated platform that solves the complete problem customers currently stitch together manually";

    case "supply_chain_relocation":
      if (profile.distributionControl === "intermediated") {
        return "Bypass the intermediary layer and establish direct customer relationships to capture margin and own the data";
      }
      if (constraintLower.includes("margin") || constraintLower.includes("compress")) {
        return "Shift to a higher-leverage position in the value chain where margin accrues to the party that controls the customer relationship";
      }
      return "Relocate delivery to a different point in the chain where margin is disproportionate to value added";

    case "stakeholder_monetization":
      if (profile.assetUtilization === "underutilized" || profile.assetUtilization === "idle") {
        return "Open underutilized capacity or idle assets to external users, converting a cost center into a second revenue stream";
      }
      if (constraintLower.includes("revenue") || constraintLower.includes("concentration")) {
        return "Identify and monetize a currently unmonetized participant in the value system — data, audience, or byproduct";
      }
      return "Create a new revenue mechanism from a latent asset or stakeholder the business already produces as a byproduct";

    case "infrastructure_abstraction":
      if (profile.laborIntensity === "artisan" || profile.laborIntensity === "labor_heavy") {
        return "Productize the firm's internal workflow and expertise into a shared operational platform for peers and smaller competitors";
      }
      if (constraintLower.includes("owner") || constraintLower.includes("dependency")) {
        return "Codify owner-dependent expertise into a repeatable system that operates independently of any single practitioner";
      }
      if (constraintLower.includes("manual") || constraintLower.includes("process")) {
        return "Extract manual processes into automated tooling that can be licensed to others facing the same operational challenge";
      }
      return "Abstract the core internal capability into shared infrastructure with near-zero marginal cost per additional user";

    default:
      return qp.pattern.transformation;
  }
}

function buildSummary(
  qp: QualifiedPattern,
  causalChain: CausalChain,
  economicMechanism: EconomicMechanism,
): string {
  return [
    causalChain.reasoning + ".",
    economicMechanism.valueCreation + ".",
    economicMechanism.defensibility
      ? `Defensibility comes from ${economicMechanism.defensibility.charAt(0).toLowerCase() + economicMechanism.defensibility.slice(1)}.`
      : "",
    `Precedent: ${qp.pattern.precedents[0]}.`,
  ].filter(Boolean).join(" ");
}

function findRelevantEvidence(qp: QualifiedPattern, evidence: Evidence[]): string[] {
  const constraintNames = new Set(qp.qualification.resolvesConstraints);
  const strengthTerms = qp.qualification.strengthSignals
    .join(" ")
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 3);

  // Score each evidence item by relevance to this pattern
  const scored = evidence.map(e => {
    const text = `${e.label} ${e.description ?? ""} ${e.category ?? ""}`.toLowerCase();
    let score = 0;

    // Evidence type match
    if (e.type === "constraint" || e.type === "friction") score += 2;
    if (e.type === "leverage" || e.type === "opportunity") score += 1;

    // Term overlap with strength signals
    for (const term of strengthTerms) {
      if (text.includes(term)) score += 1;
    }

    // Impact boost
    if ((e.impact ?? 0) >= 7) score += 1;

    return { id: e.id, score };
  });

  return scored
    .filter(s => s.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(s => s.id);
}

// ═══════════════════════════════════════════════════════════════
//  DOCUMENT INTELLIGENCE PAYLOAD BUILDER
//  Converts full biExtraction into a structured payload for AI
// ═══════════════════════════════════════════════════════════════

function buildDocumentIntelligencePayload(bi: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  // Business overview
  const overview = bi.business_overview as Record<string, unknown> | undefined;
  if (overview) {
    payload.company = overview.company_name || null;
    payload.industry = overview.industry || null;
    payload.offering = overview.primary_offering || null;
    payload.customers = overview.target_customers || [];
    payload.valueProp = overview.value_proposition || null;
  }

  // Value creation system — inputs, activities, outputs, channels
  const vc = bi.value_creation_system as Record<string, unknown> | undefined;
  if (vc) {
    payload.valueCreation = {
      inputs: vc.inputs || [],
      coreActivities: vc.core_activities || [],
      outputs: vc.outputs || [],
      channels: vc.delivery_channels || [],
      evidence: (vc.evidence as string[] || []).slice(0, 5),
    };
  }

  // Revenue engine — sources, pricing, costs, margins
  const re = bi.revenue_engine as Record<string, unknown> | undefined;
  if (re) {
    payload.revenueEngine = {
      sources: re.revenue_sources || [],
      pricingModel: re.pricing_model || [],
      costDrivers: re.cost_drivers || [],
      marginLevers: re.margin_levers || [],
      evidence: (re.evidence as string[] || []).slice(0, 5),
    };
  }

  // Operating model — workflow stages with dependencies and risks
  const om = bi.operating_model as Record<string, unknown> | undefined;
  if (om) {
    const stages = (om.workflow_stages as any[]) || [];
    payload.operatingModel = {
      workflowStages: stages.slice(0, 8).map((s: any) => ({
        stage: s.stage,
        purpose: s.purpose,
        dependencies: s.dependencies || [],
        risks: s.risks || [],
      })),
      keyResources: om.key_resources || [],
      partners: om.partners || [],
      evidence: (om.evidence as string[] || []).slice(0, 3),
    };
  }

  // Constraints — structural bottlenecks
  const constraints = bi.constraints as any[] | undefined;
  if (constraints?.length) {
    payload.constraints = constraints.slice(0, 6).map((c: any) => ({
      constraint: c.constraint,
      type: c.type,
      causes: c.causes || [],
      effects: c.effects || [],
      evidence: (c.evidence || []).slice(0, 2),
    }));
  }

  // Opportunities — untapped capacity, growth runway
  const opportunities = bi.opportunities as any[] | undefined;
  if (opportunities?.length) {
    payload.opportunities = opportunities.slice(0, 6).map((o: any) => ({
      opportunity: o.opportunity,
      type: o.type,
      enablers: o.enablers || [],
      potentialImpact: o.potential_impact || [],
      evidence: (o.evidence || []).slice(0, 2),
    }));
  }

  // ETA assessment (if present)
  const eta = bi.eta_assessment as Record<string, unknown> | undefined;
  if (eta) {
    const fs = eta.financial_snapshot as Record<string, unknown> | undefined;
    payload.financials = {
      sde: fs?.sde || null,
      revenue: fs?.revenue || null,
      grossMarginPct: fs?.gross_margin_pct || null,
      addbacks: (fs?.claimed_addbacks as any[] || []).slice(0, 5),
      missingFinancials: fs?.missing_financials || [],
    };
    payload.ownerDependency = {
      score: eta.owner_dependency_score || null,
      areas: (eta.owner_dependencies as any[] || []).slice(0, 4),
    };
    payload.customerConcentration = eta.customer_concentration || null;
  }

  // Causal relationships for system-level reasoning
  const signals = bi.signals_for_visualization as Record<string, unknown> | undefined;
  if (signals) {
    payload.systemSignals = {
      nodes: signals.primary_system_nodes || [],
      relationships: (signals.causal_relationships as any[] || []).slice(0, 10),
      leveragePoints: signals.candidate_leverage_points || [],
    };
  }

  // Missing information the AI should be aware of
  if (bi.missing_critical_information) {
    payload.missingInfo = (bi.missing_critical_information as string[]).slice(0, 8);
  }

  return payload;
}
