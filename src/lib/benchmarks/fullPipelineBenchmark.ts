/**
 * FULL PIPELINE BENCHMARK — End-to-End Strategic Reasoning Test
 *
 * Takes AI-generated business evidence and runs the complete
 * deterministic pipeline, outputting a structured diagnostic report
 * with full reasoning traces at each stage.
 */

import type { Evidence, EvidenceTier, EvidenceType } from "@/lib/evidenceEngine";
import { populateFacetsEnhanced } from "@/lib/evidenceFacets";
import { generateDiagnosticReport, type FacetDiagnosticReport } from "@/lib/facets/diagnostics";
import { inferredConstraintsToRawSignals } from "@/lib/facets/latentInference";
import {
  detectConstraintHypotheses,
  type ConstraintHypothesisSet,
  type ConstraintCandidate,
} from "@/lib/constraintDetectionEngine";
import {
  discoverConstraintInteractions,
  type ConstraintInteractionSet,
} from "@/lib/constraintInteractionEngine";
import {
  scoreConstraintSeverity,
  type SeverityReport,
} from "@/lib/constraintSeverityEngine";
import {
  scoreViability,
  generateExploratoryOpportunities,
  type ViabilityReport,
} from "@/lib/viabilityEngine";
import { runMorphologicalSearch, type OpportunityVector, type OpportunityZone, type BusinessBaseline, type MorphologicalSearchDiagnostics, type ConstraintStrength } from "@/lib/opportunityDesignEngine";
import { analyzeMarketStructure, type MarketStructureReport } from "@/lib/marketStructureEngine";
import type { EvidenceFacets } from "@/lib/facets";
import { extractFacetsFromEvidence } from "@/lib/facets";
import { humanizeLabel } from "@/lib/humanize";

// ═══════════════════════════════════════════════════════════════
//  TYPES — AI-generated business structure
// ═══════════════════════════════════════════════════════════════

export interface BusinessDecomposition {
  systemDecomposition: {
    supplyChain: string[];
    valueCreationSteps: string[];
    revenueArchitecture: string;
    costStructure: string[];
    distributionChannels: string[];
    customerAcquisition: string;
    operationalAssets: string[];
    laborDependencies: string[];
  };
  firstPrinciples: {
    whatCustomerPaysFor: string;
    whatCreatesValue: string;
    whatLimitsScale: string;
    whatDrivesMargins: string;
    whatResourcesAreScarce: string;
  };
  competitors: {
    tier1: { name: string; model: string }[];
    tier2: { name: string; model: string }[];
    tier3: { name: string; model: string }[];
  };
  evidence: {
    label: string;
    description: string;
    type: string;
    category: string;
    tier: string;
    impact: number;
    confidence: number;
  }[];
}

// ═══════════════════════════════════════════════════════════════
//  REPORT SECTIONS
// ═══════════════════════════════════════════════════════════════

export interface ConstraintReport {
  tier: 1 | 2 | 3;
  constraintId: string;
  constraintName: string;
  confidence: string;
  explanation: string;
  evidenceSignals: string[];
  facetBasis: string[];
}

export interface MorphologicalVector {
  id: string;
  shifts: { dimension: string; from: string; to: string }[];
  rationale: string;
  triggerConstraints: string[];
  explorationMode: string;
  explorationType: string;
}

export interface StressTestResult {
  opportunityId: string;
  opportunityLabel: string;
  feasibility: number;
  capitalRequirement: number;
  marketReadiness: number;
  implementationComplexity: number;
  viabilityScore: number;
  viabilityLabel: string;
  chainConfidence: number;
  explanation: string;
}

export interface RankedOpportunity {
  rank: number;
  label: string;
  viabilityScore: number;
  viabilityLabel: string;
  constraintLeverage: string;
  shifts: string;
}

export interface ReasoningTraceEntry {
  stage: string;
  inputCount: number;
  outputCount: number;
  durationMs: number;
  details: string;
}

export interface PipelineReport {
  businessName: string;
  timestamp: string;
  
  // Section 1: Business System Decomposition
  systemDecomposition: BusinessDecomposition["systemDecomposition"];
  
  // Section 2: First Principles
  firstPrinciples: BusinessDecomposition["firstPrinciples"];
  
  // Section 3: Constraint Detection (Tiered)
  constraints: ConstraintReport[];
  constraintHypotheses: ConstraintHypothesisSet | null;
  constraintInteractions: ConstraintInteractionSet | null;
  severityReport: SeverityReport | null;
  
  // Section 4: Competitor Landscape
  competitors: BusinessDecomposition["competitors"];
  
  // Section 5: Morphological Opportunities
  morphologicalVectors: MorphologicalVector[];
  opportunityZoneCount: number;
  
  // Section 6: Flipped Constraint Opportunities
  flippedConstraints: {
    constraintName: string;
    flip: string;
    rationale: string;
    analogs: string[];
  }[];
  
  // Section 7: Stress Testing
  stressTests: StressTestResult[];
  
  // Section 8: Market Structure
  marketStructure: MarketStructureReport | null;
  
  // Section 9: Idea Ranking
  rankedOpportunities: RankedOpportunity[];
  
  // Section 10: Final Recommendation
  recommendation: {
    selectedIdea: string;
    whyItWins: string;
    constraintExploited: string;
    keyAssumptions: string[];
    biggestRisks: string[];
  } | null;
  
  // Section 11: Reasoning Trace
  reasoningTrace: ReasoningTraceEntry[];
  
  // Diagnostic
  totalEvidenceItems: number;
  facetedEvidenceCount: number;
  facetDiagnostics: FacetDiagnosticReport | null;
  inferredConstraintCount: number;
  morphologicalDiagnostics: MorphologicalSearchDiagnostics | null;
  pipelineEvents: string[];
}

// ═══════════════════════════════════════════════════════════════
//  PIPELINE RUNNER
// ═══════════════════════════════════════════════════════════════

let evidenceCounter = 0;

function toEvidence(raw: BusinessDecomposition["evidence"][0]): Evidence {
  const validTypes: EvidenceType[] = ["signal", "constraint", "friction", "assumption", "leverage", "risk"];
  const validTiers: EvidenceTier[] = ["structural", "system", "optimization"];
  
  return {
    id: `pipe-ev-${++evidenceCounter}`,
    label: raw.label,
    description: raw.description,
    type: validTypes.includes(raw.type as EvidenceType) ? raw.type as EvidenceType : "signal",
    tier: validTiers.includes(raw.tier as EvidenceTier) ? raw.tier as EvidenceTier : "system",
    pipelineStep: "report",
    impact: Math.min(10, Math.max(1, raw.impact || 5)),
    confidenceScore: Math.min(1, Math.max(0, raw.confidence || 0.5)),
    category: raw.category || undefined,
  };
}

function traceStage<T>(name: string, inputCount: number, fn: () => T): { result: T; trace: ReasoningTraceEntry } {
  const start = performance.now();
  const result = fn();
  const durationMs = Math.round(performance.now() - start);
  const outputCount = Array.isArray(result) ? result.length : (result && typeof result === "object" && "hypotheses" in (result as any)) ? (result as any).hypotheses?.length ?? 0 : 1;
  return {
    result,
    trace: { stage: name, inputCount, outputCount, durationMs, details: "" },
  };
}

export function runFullPipelineBenchmark(
  businessName: string,
  decomposition: BusinessDecomposition,
): PipelineReport {
  evidenceCounter = 0;
  const events: string[] = [];
  const traces: ReasoningTraceEntry[] = [];
  const analysisId = `pipe-bench-${Date.now()}`;

  // ── Stage 1: Convert AI evidence to canonical Evidence objects ──
  const { result: rawEvidence, trace: t1 } = traceStage("Evidence Ingestion", decomposition.evidence.length, () =>
    decomposition.evidence.map(toEvidence)
  );
  t1.details = `Converted ${rawEvidence.length} AI-generated evidence items to canonical format`;
  traces.push(t1);
  events.push(`${rawEvidence.length} evidence items ingested`);

  // ── Stage 2: Facet Population (Enhanced: pattern + semantic + latent inference) ──
  let facetDiagnostics: FacetDiagnosticReport | null = null;
  let inferredConstraintCount = 0;
  const { result: enhancedResult, trace: t2 } = traceStage("Facet Population", rawEvidence.length, () =>
    populateFacetsEnhanced(rawEvidence)
  );
  const facetedEvidence = enhancedResult.evidence;
  const facetedCount = facetedEvidence.filter((e: any) => e.facets).length;
  inferredConstraintCount = enhancedResult.inferredConstraints.length;
  
  // Generate diagnostic report
  facetDiagnostics = generateDiagnosticReport(
    rawEvidence,
    enhancedResult.matchData,
    enhancedResult.inferredConstraints,
  );

  t2.details = `${facetedCount}/${facetedEvidence.length} items faceted (${facetDiagnostics.coveragePercent}% coverage). Pattern: ${facetDiagnostics.patternMatchCount}, Semantic-only: ${facetDiagnostics.semanticOnlyMatchCount}. ${inferredConstraintCount} latent constraints inferred.`;
  t2.outputCount = facetedCount;
  traces.push(t2);
  events.push(`Facets: ${facetedCount}/${facetedEvidence.length} (${facetDiagnostics.coveragePercent}% coverage, ${facetDiagnostics.semanticOnlyMatchCount} semantic-only, ${inferredConstraintCount} inferred constraints)`);

  // ── Stage 3: Constraint Detection ──
  const { result: constraintHypotheses, trace: t3 } = traceStage("Constraint Detection", facetedEvidence.length, () =>
    detectConstraintHypotheses(facetedEvidence)
  );
  t3.details = `${constraintHypotheses.hypotheses.length} hypotheses from ${constraintHypotheses.totalCandidates} candidates. Gaps: ${constraintHypotheses.evidenceGaps.length}`;
  traces.push(t3);
  events.push(`${constraintHypotheses.hypotheses.length} constraint hypotheses detected`);

  // Build constraint reports
  const constraintReports: ConstraintReport[] = constraintHypotheses.hypotheses.map(h => ({
    tier: h.tier,
    constraintId: h.constraintId,
    constraintName: h.constraintName,
    confidence: h.confidence,
    explanation: h.explanation,
    evidenceSignals: h.evidenceIds.map(eid => {
      const ev = facetedEvidence.find(e => e.id === eid);
      return ev ? ev.label : eid;
    }),
    facetBasis: h.facetBasis ?? [],
  }));

  // Build StrategicInsight-compatible constraints for downstream
  // Include "limited" confidence constraints at reduced weight — excluding them
  // starves the morphological search when most detections are low-confidence
  const constraints = constraintHypotheses.hypotheses
    .map(h => ({
      id: `c-${h.constraintId}`,
      analysisId,
      insightType: "constraint_cluster" as const,
      label: h.definition.description,
      description: `${h.explanation} [${h.constraintId}: ${h.constraintName}]`,
      evidenceIds: h.evidenceIds,
      relatedInsightIds: [] as string[],
      impact: h.tier === 1 ? 8 : h.tier === 2 ? 6 : h.tier === 3 ? 4 : 3,
      confidence: h.confidence === "strong" ? 0.8 : h.confidence === "moderate" ? 0.6 : 0.4,
      createdAt: Date.now(),
      tier: "structural" as const,
      mode: "business_model" as const,
      confidenceScore: h.confidence === "strong" ? 0.8 : h.confidence === "moderate" ? 0.6 : 0.4,
      recommendedTools: [] as string[],
    }));

  // ── Stage 4: Constraint Interactions ──
  let constraintInteractions: ConstraintInteractionSet | null = null;
  if (constraints.length >= 2) {
    const { result: interactions, trace: t4 } = traceStage("Constraint Interactions", constraints.length, () =>
      discoverConstraintInteractions(constraints, constraintHypotheses)
    );
    t4.details = `${interactions.interactions.length} interactions from ${interactions.pairsEvaluated} pairs. Reinforcing loops: ${interactions.hasReinforcingLoops}`;
    traces.push(t4);
    constraintInteractions = interactions;
    events.push(`${interactions.interactions.length} constraint interactions discovered`);
  }

  // ── Stage 5: Severity Scoring ──
  let severityReport: SeverityReport | null = null;
  if (constraints.length > 0) {
    // Build mock signals for severity scoring
    const mockSignals = constraints.map(c => ({
      id: `sig-${c.id}`,
      analysisId,
      label: c.label,
      description: c.description,
      evidenceIds: c.evidenceIds,
      strength: c.impact,
      confidence: c.confidence,
      category: "operational_dependency",
    }));

    const { result: severity, trace: t5 } = traceStage("Severity Scoring", constraints.length, () =>
      scoreConstraintSeverity(constraints, mockSignals, facetedEvidence, constraintInteractions)
    );
    t5.details = severity.primaryBottleneck
      ? `Primary bottleneck: ${severity.primaryBottleneck.constraintLabel} (${severity.primaryBottleneck.severityLabel})`
      : "No primary bottleneck identified";
    traces.push(t5);
    severityReport = severity;
    events.push(`Severity scored: avg ${severity.averageSeverity}`);
  }

  // ── Stage 6: Morphological Search ──
  // Build leverage points from constraints for morphological search
  const leveragePoints = constraints.slice(0, 3).map(c => ({
    ...c,
    insightType: "leverage_point" as const,
    id: `lev-${c.id}`,
    label: `Address ${humanizeLabel(c.label)}`,
    description: `Leverage point derived from constraint: ${c.label}`,
  }));

  let vectors: OpportunityVector[] = [];
  let zones: OpportunityZone[] = [];
  let baseline: BusinessBaseline = {};

  if (facetedEvidence.length >= 10 && constraints.length > 0) {
    const { result: searchResult, trace: t6 } = traceStage("Morphological Search", facetedEvidence.length, () =>
      runMorphologicalSearch(facetedEvidence, constraints, leveragePoints, [])
    );
    t6.details = `${searchResult.vectors.length} vectors in ${searchResult.zones.length} zones. Pattern vectors: ${searchResult.patternVectorCount}`;
    traces.push(t6);
    vectors = searchResult.vectors;
    zones = searchResult.zones;
    baseline = searchResult.baseline;
    events.push(`${vectors.length} morphological vectors generated`);
  } else {
    events.push(`Morphological search skipped: ${facetedEvidence.length} evidence, ${constraints.length} constraints`);
  }

  const morphologicalVectors: MorphologicalVector[] = vectors.map(v => ({
    id: v.id,
    shifts: v.changedDimensions,
    rationale: v.rationale,
    triggerConstraints: v.triggerIds,
    explorationMode: v.explorationMode,
    explorationType: v.explorationType,
  }));

  // ── Stage 7: Generate constraint flips ──
  const flippedConstraints = constraintReports.slice(0, 5).map(c => {
    const flipMap: Record<string, { flip: string; analogs: string[] }> = {
      capacity_ceiling: { flip: "Demand smoothing / dynamic capacity allocation", analogs: ["Uber (dynamic driver supply)", "Airbnb (distributed capacity)"] },
      asset_underutilization: { flip: "Capacity marketplace / utilization optimization", analogs: ["Flexport (asset sharing)", "Convoy (backhaul matching)"] },
      supply_fragmentation: { flip: "Aggregator model / supply consolidation platform", analogs: ["OpenDoor (fragmented real estate)", "Faire (wholesale aggregation)"] },
      labor_intensity: { flip: "Automation layer / productized service", analogs: ["TurboTax (automated tax prep)", "Canva (automated design)"] },
      owner_dependency: { flip: "Systematized delivery / delegation framework", analogs: ["McDonald's (systematized operations)", "Jiffy Lube (procedure-driven)"] },
      commoditized_pricing: { flip: "Value-based pricing / bundled outcomes", analogs: ["Salesforce (outcome-based)", "HubSpot (freemium + value tiers)"] },
      channel_dependency: { flip: "Direct-to-consumer / owned distribution", analogs: ["Dollar Shave Club (D2C)", "Warby Parker (owned retail)"] },
      operational_bottleneck: { flip: "Parallel processing / bottleneck elimination", analogs: ["Amazon (distributed fulfillment)", "Toyota (lean manufacturing)"] },
      geographic_constraint: { flip: "Remote delivery / digital-first model", analogs: ["Teladoc (remote healthcare)", "Peloton (at-home fitness)"] },
      transactional_revenue: { flip: "Subscription / recurring revenue model", analogs: ["Netflix (subscription)", "Adobe Creative Cloud (SaaS)"] },
      trust_deficit: { flip: "Verification layer / guaranteed outcomes", analogs: ["Stripe (trusted payments)", "Airbnb (host verification + insurance)"] },
      margin_compression: { flip: "Vertical integration / premium tier extraction", analogs: ["Apple (vertical integration)", "Costco (membership model)"] },
    };
    const mapped = flipMap[c.constraintName] || { flip: `Structural inversion of ${c.constraintName}`, analogs: [] };
    return {
      constraintName: c.constraintName,
      flip: mapped.flip,
      rationale: `${c.explanation} — this constraint creates opportunity because the current structure assumes it is fixed.`,
      analogs: mapped.analogs,
    };
  });

  // ── Stage 8: Stress Testing (Viability) ──
  let viabilityReport: ViabilityReport | null = null;
  const stressTests: StressTestResult[] = [];

  // Build opportunity insights for viability scoring
  const opportunityInsights = vectors.map(v => ({
    id: v.id,
    analysisId,
    insightType: "emerging_opportunity" as const,
    label: v.changedDimensions.map(d => `${d.dimension}: ${d.from} → ${d.to}`).join("; "),
    description: v.rationale,
    evidenceIds: v.evidenceIds,
    relatedInsightIds: v.triggerIds,
    impact: 6,
    confidence: 0.5,
    createdAt: Date.now(),
    tier: "structural" as const,
    mode: "business_model" as const,
    confidenceScore: 0.5,
    recommendedTools: [] as string[],
  }));

  // Add exploratory opportunities if we don't have enough
  if (opportunityInsights.length === 0) {
    const mockSignals = constraints.map(c => ({
      id: `sig-${c.id}`,
      analysisId,
      label: c.label,
      description: c.description,
      evidenceIds: c.evidenceIds,
      strength: c.impact,
      confidence: c.confidence,
      category: "operational_dependency",
    }));
    const exploratory = generateExploratoryOpportunities(mockSignals, facetedEvidence, analysisId);
    for (const exp of exploratory) {
      opportunityInsights.push(exp as typeof opportunityInsights[0]);
    }
  }

  if (opportunityInsights.length > 0) {
    const sevScores = severityReport?.scores ?? [];
    const { result: viability, trace: t8 } = traceStage("Stress Testing (Viability)", opportunityInsights.length, () =>
      scoreViability(opportunityInsights, constraints, facetedEvidence, sevScores)
    );
    t8.details = `${viability.viableCount} viable, ${viability.exploratoryCount} exploratory`;
    traces.push(t8);
    viabilityReport = viability;

    for (const score of viability.scores) {
      stressTests.push({
        opportunityId: score.opportunityId,
        opportunityLabel: score.opportunityLabel,
        feasibility: score.feasibility,
        capitalRequirement: score.capitalRequirement,
        marketReadiness: score.marketReadiness,
        implementationComplexity: score.implementationComplexity,
        viabilityScore: score.viabilityScore,
        viabilityLabel: score.viabilityLabel,
        chainConfidence: score.chainConfidence,
        explanation: score.explanation,
      });
    }
    events.push(`${viability.viableCount} ideas passed stress test`);
  }

  // ── Stage 9: Market Structure ──
  let marketStructure: MarketStructureReport | null = null;
  if (facetedEvidence.length >= 8) {
    let mktIdCounter = 0;
    const { result: mkt, trace: t9 } = traceStage("Market Structure", facetedEvidence.length, () =>
      analyzeMarketStructure(facetedEvidence, analysisId, (prefix) => `${prefix}-mkt-${++mktIdCounter}`)
    );
    t9.details = `${mkt.patterns.length} patterns, ${mkt.archetypes.length} archetypes`;
    traces.push(t9);
    marketStructure = mkt;
    events.push(`Market structure: ${mkt.patterns.length} patterns, ${mkt.archetypes.length} archetypes`);
  }

  // ── Stage 10: Ranking ──
  const rankedOpportunities: RankedOpportunity[] = stressTests
    .sort((a, b) => b.viabilityScore - a.viabilityScore)
    .map((st, i) => ({
      rank: i + 1,
      label: st.opportunityLabel,
      viabilityScore: st.viabilityScore,
      viabilityLabel: st.viabilityLabel,
      constraintLeverage: vectors.find(v => v.id === st.opportunityId)?.triggerIds.join(", ") || "general",
      shifts: vectors.find(v => v.id === st.opportunityId)
        ?.changedDimensions.map(d => `${d.dimension}: ${d.from} → ${d.to}`).join("; ") || st.opportunityLabel,
    }));

  // ── Stage 11: Final Recommendation ──
  let recommendation: PipelineReport["recommendation"] = null;
  if (rankedOpportunities.length > 0) {
    const top = rankedOpportunities[0];
    const topConstraint = constraintReports[0];
    recommendation = {
      selectedIdea: top.label,
      whyItWins: `Highest viability score (${top.viabilityLabel}) with ${top.viabilityScore.toFixed(2)} combined score. ${top.shifts}`,
      constraintExploited: topConstraint?.constraintName || "primary structural constraint",
      keyAssumptions: [
        "Market willingness to adopt structural change",
        "Operational feasibility within current resource constraints",
        "Competitive response does not neutralize advantage within 12 months",
      ],
      biggestRisks: [
        "Execution complexity may exceed available capabilities",
        "Market timing risk — structural shifts take time to materialize",
        "Capital requirements may be underestimated",
      ],
    };
  }

  return {
    businessName,
    timestamp: new Date().toISOString(),
    systemDecomposition: decomposition.systemDecomposition,
    firstPrinciples: decomposition.firstPrinciples,
    constraints: constraintReports,
    constraintHypotheses,
    constraintInteractions,
    severityReport,
    competitors: decomposition.competitors,
    morphologicalVectors,
    opportunityZoneCount: zones.length,
    flippedConstraints,
    stressTests,
    marketStructure,
    rankedOpportunities,
    recommendation,
    reasoningTrace: traces,
    totalEvidenceItems: rawEvidence.length,
    facetedEvidenceCount: facetedCount,
    facetDiagnostics,
    inferredConstraintCount,
    pipelineEvents: events,
  };
}
