/**
 * STRATEGIC ENGINE — Structural Insight Pipeline
 *
 * Simplified pipeline (6 core stages):
 *   1. collectEvidence — Extract canonical evidence from all pipeline steps
 *   2. normalizeEvidence — Deduplicate, assign defaults
 *   3. structuralDiagnosis — 10-dimension structural profile + binding constraints
 *   4. patternQualification — Binary gates → max 2 survivors
 *   5. thesisConstruction — Primary thesis + alternative (deepened opportunities)
 *   6. narrative — One sharp story: constraint → insight → move → mechanism
 *
 * Design principle: One sharp structural insight per analysis.
 * No morphological search, no keyword-based opportunities, no numeric scoring.
 */

import {
  extractAllEvidence,
  flattenEvidence,
  deduplicateEvidenceWithRemap,
  type Evidence,
  type MetricDomain,
  type MetricEvidence,
} from "@/lib/evidenceEngine";
import { buildInsightGraph, type InsightGraph } from "@/lib/insightGraph";
import {
  computeCommandDeckMetrics,
  aggregateOpportunities,
  type CommandDeckMetrics,
} from "@/lib/commandDeckMetrics";
import { allScenariosToEvidence, getScenarios } from "@/lib/scenarioEngine";
import { compareScenarios, type ScenarioComparison } from "@/lib/scenarioComparisonEngine";
import { computeAllSensitivityReports, type SensitivityReport } from "@/lib/sensitivityEngine";
import { traceStage, buildDiagnostic, type PipelineStageResult } from "@/lib/pipelineDiagnostics";
import type { SystemIntelligence } from "@/lib/systemIntelligence";
import { populateFacets } from "@/lib/evidenceFacets";
import {
  diagnoseStructuralProfile,
  qualifyPatterns,
  deepenOpportunities,
  deepenOpportunitiesAsync,
  type StructuralProfile,
  type QualifiedPattern,
  type DeepenedOpportunity,
  type DiagnosisLensConfig,
} from "@/lib/reconfiguration";
import { detectConstraintHypotheses, type ConstraintHypothesisSet } from "@/lib/constraintDetectionEngine";
import { createRunIdFactory, type RunIdFactory } from "@/lib/runIdFactory";
import { humanizeLabel as humanize } from "@/lib/humanize";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type StrategicInsightType =
  | "constraint_cluster"
  | "driver"
  | "leverage_point"
  | "emerging_opportunity"
  | "strategic_pathway";

export interface OpportunityVectorData {
  changedDimensions: { dimension: string; from: string; to: string }[];
  baselineSnapshot: Record<string, string>;
  triggerConstraintIds: string[];
  explorationMode: "constraint" | "adjacency";
}

export interface StrategicInsight {
  id: string;
  analysisId: string;
  insightType: StrategicInsightType;
  label: string;
  description: string;
  evidenceIds: string[];
  relatedInsightIds: string[];
  impact: number;
  confidence: number;
  createdAt: number;
  tier: import("@/lib/evidenceEngine").EvidenceTier;
  mode: import("@/lib/evidenceEngine").EvidenceMode;
  confidenceScore?: number;
  recommendedTools?: string[];
  opportunityVectorData?: OpportunityVectorData;
}

export interface StrategicSignal {
  id: string;
  analysisId: string;
  label: string;
  description: string;
  evidenceIds: string[];
  strength: number;
  confidence: number;
  category: string;
}

export interface StrategicNarrative {
  primaryConstraint: string | null;
  keyDriver: string | null;
  leveragePoint: string | null;
  breakthroughOpportunity: string | null;
  strategicPathway: string | null;
  narrativeSummary: string;
  strategicVerdict: string | null;
  verdictRationale: string | null;
  verdictConfidence: number;
  whyThisMatters: string | null;
  trappedValue: string | null;
  unlockPotential: string | null;
  trappedValueEstimate: string | null;
  trappedValueBenchmark: string | null;
  trappedValueEvidenceCount: number;
  killQuestion: string | null;
  validationExperiment: string | null;
  validationTimeframe: string;
  validationSteps: ValidationStep[];
  verdictBenchmark: string | null;
  executiveSummary: string | null;
}

export interface ValidationStep {
  step: number;
  action: string;
  metric: string;
  timeframe: string;
}

export interface StrategicDiagnostic {
  evidenceCount: number;
  signalCount: number;
  constraintCount: number;
  driverCount: number;
  leverageCount: number;
  opportunityCount: number;
  pathwayCount: number;
  insufficientEvidence: boolean;
  message: string | null;
  thresholds: { stage: string; required: number; current: number; met: boolean }[];
}

export interface StrategicAnalysisInput {
  products: any[];
  selectedProduct: any | null;
  disruptData: any | null;
  redesignData: any | null;
  stressTestData: any | null;
  pitchDeckData: any | null;
  governedData: Record<string, unknown> | null;
  businessAnalysisData: any | null;
  intelligence: SystemIntelligence | null;
  analysisType: "product" | "service" | "business_model";
  analysisId: string;
  completedSteps: Set<string>;
  aiAlternatives?: import("@/lib/opportunityDesignEngine").DimensionAlternative[];
  geoMarketData?: any | null;
  regulatoryData?: any | null;
  /** Lens configuration — when ETA, shapes structural diagnosis with acquisition dimensions */
  lensConfig?: DiagnosisLensConfig | null;
  /** Full structured BI extraction from uploaded documents (CIMs, etc.) */
  biExtraction?: Record<string, unknown> | null;
}

export interface StrategicAnalysisOutput {
  evidence: Record<MetricDomain, MetricEvidence>;
  flatEvidence: Evidence[];
  signals: StrategicSignal[];
  insights: StrategicInsight[];
  graph: InsightGraph;
  metrics: CommandDeckMetrics;
  opportunities: any[];
  narrative: StrategicNarrative | null;
  diagnostic: StrategicDiagnostic;
  scenarioComparison: ScenarioComparison | null;
  sensitivityReports: SensitivityReport[];
  events: string[];
  constraintHypotheses: ConstraintHypothesisSet | null;
  facetedEvidence: Evidence[];
  legacyConstraints: StrategicInsight[];
  activeConstraints: StrategicInsight[];
  constraintInteractions: null;
  severityReport: null;
  viabilityReport: null;
  marketStructure: null;
  structuralProfile: StructuralProfile | null;
  qualifiedPatterns: QualifiedPattern[];
  deepenedOpportunities: DeepenedOpportunity[];
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

let activeRunFactory: RunIdFactory | null = null;

function nextId(prefix: string): string {
  if (activeRunFactory) return activeRunFactory.next(prefix);
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function jaccard(a: string, b: string): number {
  const tokA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(t => t.length > 2));
  const tokB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(t => t.length > 2));
  if (tokA.size === 0 && tokB.size === 0) return 0;
  let inter = 0;
  for (const t of tokA) { if (tokB.has(t)) inter++; }
  return inter / (tokA.size + tokB.size - inter);
}

function trimAt(s: string | null | undefined, max: number): string {
  if (!s) return "";
  let clean = humanize(s);
  clean = clean.replace(/[.,]?\s+and\s+\d+\s+(related|additional|further|other)\s+\w+\.?$/i, "");
  clean = clean.replace(/^(?:Step\s*\d+\s*:\s*)+/i, "");
  clean = clean.replace(/^[A-Z]\d+\s*:\s*/i, "");
  clean = clean.replace(/\s*\((?:Removing\s+)?[A-Z]_?\d+\)\s*/gi, " ");
  if (clean.includes("→")) {
    const segments = clean.split("→").map(seg => seg.trim()).filter(Boolean);
    clean = segments[segments.length - 1] || clean;
  }
  clean = clean.replace(/\.\.\./g, "").trim();
  if (clean.length <= max) return clean;
  const sentenceCut = Math.max(clean.lastIndexOf(". ", max), clean.lastIndexOf("; ", max));
  if (sentenceCut > max * 0.4) return clean.slice(0, sentenceCut + 1);
  const clauseCut = clean.lastIndexOf(", ", max);
  if (clauseCut > max * 0.5) return clean.slice(0, clauseCut);
  const cut = clean.lastIndexOf(" ", max);
  return clean.slice(0, cut > max * 0.4 ? cut : max);
}

function makeInsight(partial: Omit<StrategicInsight, "tier" | "mode" | "confidenceScore" | "recommendedTools">): StrategicInsight {
  return {
    ...partial,
    label: humanize(partial.label),
    tier: "structural" as const,
    mode: "product" as const,
    confidenceScore: partial.confidence,
    recommendedTools: [],
  };
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 1: COLLECT EVIDENCE
// ═══════════════════════════════════════════════════════════════

function collectEvidence(input: StrategicAnalysisInput): { structured: Record<MetricDomain, MetricEvidence>; flat: Evidence[] } {
  const structured = extractAllEvidence({
    products: input.products,
    selectedProduct: input.selectedProduct,
    disruptData: input.disruptData,
    redesignData: input.redesignData,
    stressTestData: input.stressTestData,
    pitchDeckData: input.pitchDeckData,
    governedData: input.governedData,
    businessAnalysisData: input.businessAnalysisData,
    intelligence: input.intelligence,
    analysisType: input.analysisType,
    geoMarketData: input.geoMarketData,
    regulatoryData: input.regulatoryData,
  });
  const flat = flattenEvidence(structured);
  const mode = input.analysisType === "service" ? "service" as const
    : input.analysisType === "business_model" ? "business_model" as const
    : "product" as const;
  const simEvidence = allScenariosToEvidence(input.analysisId, mode);
  if (simEvidence.length > 0) flat.push(...simEvidence);
  return { structured, flat };
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 2: NORMALIZE EVIDENCE
// ═══════════════════════════════════════════════════════════════

function normalizeEvidence(flat: Evidence[]): Evidence[] {
  const deduped: Evidence[] = [];
  const usedIds = new Set<string>();
  for (const ev of flat) {
    if (usedIds.has(ev.id)) continue;
    const isDuplicate = deduped.some(d => jaccard(d.label, ev.label) >= 0.7);
    if (isDuplicate) continue;
    deduped.push({
      ...ev,
      impact: ev.impact ?? 4,
      confidenceScore: ev.confidenceScore ?? 0.3,
    });
    usedIds.add(ev.id);
  }
  return deduped;
}

// ═══════════════════════════════════════════════════════════════
//  NARRATIVE — Built from Deepened Opportunities
// ═══════════════════════════════════════════════════════════════

function buildStrategicNarrative(
  primary: DeepenedOpportunity | null,
  alternative: DeepenedOpportunity | null,
  profile: StructuralProfile | null,
  flatEvidence: Evidence[],
): StrategicNarrative {
  if (!primary || !profile) {
    return emptyNarrative("Strategic thesis will emerge as more pipeline steps complete. The reasoning engine is building its evidence base.");
  }

  const constraint = trimAt(primary.causalChain.constraint, 200);
  const driver = trimAt(primary.causalChain.driver, 200);
  const move = trimAt(primary.reconfigurationLabel, 200);
  const outcome = trimAt(primary.causalChain.outcome, 200);

  // Strategic Verdict — the headline
  const strategicVerdict = move;
  const verdictRationale = `The current structure is constrained by ${constraint.toLowerCase()}. ${primary.causalChain.reasoning}`;
  const verdictConfidence = Math.min(0.4 + primary.signalDensity * 0.15, 0.9);

  // Why This Matters — from the strategic bet
  const whyThisMatters = `Everyone in this market assumes "${primary.strategicBet.industryAssumption}" — but the evidence suggests otherwise. ${primary.strategicBet.contrarianBelief}. ${primary.strategicBet.implication}. This isn't a surface optimization: it's a structural reconfiguration that changes where and how value accrues.`;

  // Trapped Value — from economic mechanism
  const trappedValue = `${primary.economicMechanism.valueCreation}. Current cost structure: ${primary.economicMechanism.costStructureShift}`;
  const unlockPotential = `${primary.economicMechanism.revenueImplication}${primary.economicMechanism.defensibility ? `. Defensibility: ${primary.economicMechanism.defensibility}` : ""}`;

  // Kill Question — from feasibility
  const topRisk = primary.feasibility.executionRisks[0] || "structural barriers";
  const killQuestion = `Is "${primary.strategicBet.contrarianBelief.toLowerCase()}" actually true, or is the industry assumption correct?`;
  const validationExperiment = `${primary.firstMove.action}. You'll know it's working when: ${primary.firstMove.successCriteria}.`;
  const validationTimeframe = primary.firstMove.timeframe;

  // Validation steps from first move
  const validationSteps = buildValidationSteps(
    constraint,
    move,
    driver,
    validationTimeframe,
  );

  // Narrative summary — secondary context
  const parts: string[] = [];

  // ETA acquisition context
  if (profile.etaActive) {
    const etaParts: string[] = [];
    if (profile.ownerDependency === "owner_critical") etaParts.push("owner-critical (high key-person risk)");
    else if (profile.ownerDependency === "owner_reliant") etaParts.push("owner-reliant (moderate transition risk)");
    if (profile.acquisitionComplexity === "turnkey") etaParts.push("turnkey acquisition");
    else if (profile.acquisitionComplexity === "complex" || profile.acquisitionComplexity === "prohibitive") etaParts.push(`${profile.acquisitionComplexity} acquisition structure`);
    if (profile.improvementRunway === "transformative") etaParts.push("transformative operational improvement runway");
    else if (profile.improvementRunway === "significant") etaParts.push("significant improvement runway post-acquisition");
    if (etaParts.length > 0) {
      parts.push(`Acquisition profile: ${etaParts.join(", ")}.`);
    }
  }

  if (alternative) {
    parts.push(`If the primary thesis doesn't hold, an alternative move exists: ${trimAt(alternative.reconfigurationLabel, 120).toLowerCase()}, which resolves ${alternative.resolvesConstraints[0]?.replace(/_/g, " ") || "a different structural constraint"}.`);
  }
  if (profile.bindingConstraints.length > 1) {
    parts.push(`${profile.bindingConstraints.length} structural constraints are interconnected, creating compounding friction.`);
  }
  const narrativeSummary = parts.length > 0 ? parts.join(" ") : `The structural diagnosis identified ${constraint.toLowerCase()} as the binding constraint, with a clear resolution path.`;

  // Executive Summary — one paragraph
  const etaPrefix = profile.etaActive ? `[Acquisition Lens] ` : "";
  const executiveSummary = `${etaPrefix}This analysis identified a structural opportunity: ${move.toLowerCase()}. The current model is constrained by ${constraint.toLowerCase()} because ${driver.toLowerCase()}. Applying ${primary.patternName.toLowerCase()} should ${outcome.toLowerCase()}. ${primary.strategicBet.contrarianBelief}. First test: ${trimAt(primary.firstMove.action, 100).toLowerCase()} (${validationTimeframe}).${alternative ? ` Alternative path: ${trimAt(alternative.reconfigurationLabel, 80).toLowerCase()}.` : ""}`;

  return {
    primaryConstraint: constraint,
    keyDriver: driver,
    leveragePoint: move,
    breakthroughOpportunity: outcome,
    strategicPathway: primary.causalChain.reasoning,
    narrativeSummary,
    strategicVerdict,
    verdictRationale,
    verdictConfidence,
    whyThisMatters,
    trappedValue,
    unlockPotential,
    trappedValueEstimate: null,
    trappedValueBenchmark: null,
    trappedValueEvidenceCount: flatEvidence.filter(e => e.type === "constraint" || e.type === "friction").length,
    killQuestion,
    validationExperiment,
    validationTimeframe,
    validationSteps,
    verdictBenchmark: null,
    executiveSummary,
  };
}

function emptyNarrative(message: string): StrategicNarrative {
  return {
    primaryConstraint: null, keyDriver: null, leveragePoint: null,
    breakthroughOpportunity: null, strategicPathway: null,
    narrativeSummary: message,
    strategicVerdict: null, verdictRationale: null, verdictConfidence: 0,
    whyThisMatters: null, trappedValue: null, unlockPotential: null,
    trappedValueEstimate: null, trappedValueBenchmark: null, trappedValueEvidenceCount: 0,
    killQuestion: null, validationExperiment: null, validationTimeframe: "30 days",
    validationSteps: [], verdictBenchmark: null, executiveSummary: null,
  };
}

function buildValidationSteps(
  constraint: string, opportunity: string, driver: string | null, overallTimeframe: string,
): ValidationStep[] {
  return [
    {
      step: 1,
      action: `Map the current state: document how ${constraint.toLowerCase()} manifests in daily operations and quantify the cost.`,
      metric: "Baseline cost/time documented",
      timeframe: "Days 1-3",
    },
    {
      step: 2,
      action: `Identify 5-10 customers or stakeholders most affected. ${driver ? `Prioritize those impacted by ${driver.toLowerCase()}.` : "Prioritize by revenue impact."}`,
      metric: "Target list with contact info",
      timeframe: "Days 3-5",
    },
    {
      step: 3,
      action: `Run structured interviews: present the concept of ${opportunity.toLowerCase()} as a concrete alternative. Measure willingness to pay or switch.`,
      metric: "≥30% show strong interest (go/no-go gate)",
      timeframe: "Days 5-14",
    },
    {
      step: 4,
      action: `Build minimum viable proof: the smallest demonstration that addresses the top objection from Step 3.`,
      metric: "Working prototype reviewed by 3+ prospects",
      timeframe: `Days 14-${overallTimeframe === "2 weeks" ? "14" : "21"}`,
    },
    {
      step: 5,
      action: `Decision gate: review data, prototype feedback, and baseline costs. Commit, pivot, or kill.`,
      metric: "Go/no-go decision with documented reasoning",
      timeframe: `Day ${overallTimeframe === "2 weeks" ? "14" : "30"}`,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
//  MAIN ENTRY POINT — runStrategicAnalysis
// ═══════════════════════════════════════════════════════════════

export function runStrategicAnalysis(input: StrategicAnalysisInput): StrategicAnalysisOutput {
  const runFactory = createRunIdFactory();
  activeRunFactory = runFactory;
  const events: string[] = [];
  const stages: PipelineStageResult[] = [];

  // ── Stage 1: Collect Evidence ──
  const { result: evidenceResult, stage: s1 } = traceStage("Evidence Collection", 1, () =>
    collectEvidence(input)
  );
  stages.push(s1);
  const { structured: evidence, flat: rawFlat } = evidenceResult;

  // ── Stage 2: Normalize Evidence ──
  const { result: flat, stage: s2 } = traceStage("Evidence Normalization", rawFlat.length, () =>
    normalizeEvidence(rawFlat)
  );
  stages.push(s2);
  events.push(`${flat.length} evidence objects (normalized from ${rawFlat.length} raw)`);
  const evCount = flat.length;

  // ── Stage 2b: Facet Population ──
  // Minimum threshold: 2 for business models (richer but fewer evidence), 4 otherwise
  const minEvidenceThreshold = input.analysisType === "business_model" ? 2 : 4;
  let facetedEvidence: Evidence[] = flat;
  if (evCount >= minEvidenceThreshold) {
    const { result: faceted, stage: s2b } = traceStage("Facet Population", flat.length, () =>
      populateFacets(flat)
    );
    stages.push(s2b);
    facetedEvidence = faceted;
  }

  // ── Stage 3: Constraint Hypothesis Detection ──
  let constraintHypotheses: ConstraintHypothesisSet | null = null;
  if (evCount >= minEvidenceThreshold) {
    const { result: hypotheses, stage: s3 } = traceStage("Constraint Detection", facetedEvidence.length, () =>
      detectConstraintHypotheses(facetedEvidence)
    );
    stages.push(s3);
    constraintHypotheses = hypotheses;
    events.push(`${hypotheses.hypotheses.length} constraint hypotheses detected`);
  }

  // ── Stage 4: Structural Diagnosis ──
  let structuralProfile: StructuralProfile | null = null;
  const candidatesForProfile = (constraintHypotheses?.hypotheses ?? []).slice(0, 5);

  if (evCount >= minEvidenceThreshold) {
    const { result: profile, stage: s4 } = traceStage("Structural Diagnosis", flat.length, () =>
      diagnoseStructuralProfile(flat, candidatesForProfile, input.lensConfig)
    );
    stages.push(s4);
    structuralProfile = profile;
    events.push(`Structural profile: ${profile.supplyFragmentation} fragmentation, ${profile.laborIntensity} labor, ${profile.revenueModel} revenue, ${profile.distributionControl} distribution${profile.etaActive ? ` | ETA: owner=${profile.ownerDependency}, complexity=${profile.acquisitionComplexity}, runway=${profile.improvementRunway}` : ""}`);
  }

  // ── Stage 5: Pattern Qualification (max 2) ──
  let qualifiedPatternsResult: QualifiedPattern[] = [];
  if (structuralProfile) {
    const { result: qPatterns, stage: s5 } = traceStage("Pattern Qualification", 6, () => {
      const all = qualifyPatterns(structuralProfile!);
      return all.slice(0, 4); // Allow more patterns through for multi-opportunity generation
    });
    stages.push(s5);
    qualifiedPatternsResult = qPatterns;
    events.push(`${qPatterns.length} patterns qualified: ${qPatterns.map(p => p.pattern.name).join(", ") || "none"}`);
  }

  // ── Stage 6: Thesis Construction (Opportunity Deepening) ──
  let deepenedOpps: DeepenedOpportunity[] = [];
  if (structuralProfile && qualifiedPatternsResult.length > 0) {
    const { result: deepened, stage: s6 } = traceStage("Thesis Construction", qualifiedPatternsResult.length, () =>
      deepenOpportunities(qualifiedPatternsResult, structuralProfile!, flat)
    );
    stages.push(s6);
    deepenedOpps = deepened.slice(0, 5); // Allow up to 5 opportunities
    events.push(`${deepenedOpps.length} theses: ${deepenedOpps.map(d => d.reconfigurationLabel.slice(0, 60)).join(" | ")}`);
  }

  // ── Convert deepened opportunities → StrategicInsight[] for downstream compat ──
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  // Add constraint insights from structural profile
  if (structuralProfile) {
    for (const bc of structuralProfile.bindingConstraints.slice(0, 3)) {
      insights.push(makeInsight({
        id: nextId("constraint"),
        analysisId: input.analysisId,
        insightType: "constraint_cluster",
        label: bc.explanation || bc.constraintName.replace(/_/g, " "),
        description: `Binding structural constraint: ${bc.constraintName}`,
        evidenceIds: bc.evidenceIds ?? [],
        relatedInsightIds: [],
        impact: 8,
        confidence: 0.7,
        createdAt: now,
      }));
    }
  }

  // Add deepened opportunities as insights
  for (const deep of deepenedOpps) {
    insights.push(makeInsight({
      id: nextId("thesis"),
      analysisId: input.analysisId,
      insightType: "emerging_opportunity",
      label: deep.reconfigurationLabel,
      description: [
        `[${deep.patternName}] ${deep.summary}`,
        `Industry assumes: "${deep.strategicBet.industryAssumption}"`,
        `Contrarian belief: "${deep.strategicBet.contrarianBelief}"`,
        `First move: ${deep.firstMove.action.slice(0, 120)}`,
      ].join(" | "),
      evidenceIds: deep.evidenceIds,
      relatedInsightIds: insights.filter(i => i.insightType === "constraint_cluster").map(i => i.id),
      impact: Math.min(6 + deep.signalDensity, 10),
      confidence: Math.min(0.5 + deep.signalDensity * 0.1, 0.9),
      createdAt: now,
    }));
  }

  // ── Build Narrative ──
  const primary = deepenedOpps[0] ?? null;
  const alternative = deepenedOpps[1] ?? null;
  const narrative = buildStrategicNarrative(primary, alternative, structuralProfile, flat);

  // ── Inject opportunities into evidence for metrics ──
  for (const opp of insights.filter(i => i.insightType === "emerging_opportunity")) {
    evidence.opportunity.items.push({
      id: opp.id,
      type: "opportunity" as any,
      label: opp.label,
      description: opp.description,
      pipelineStep: "disrupt" as any,
      tier: "structural" as any,
      impact: opp.impact,
      confidenceScore: opp.confidence,
      sourceEngine: "reconfiguration" as any,
    });
  }

  // ── Scenarios (independent of main pipeline) ──
  const scenarios = getScenarios(input.analysisId);
  const scenarioComparison = scenarios.length > 0 ? compareScenarios(scenarios) : null;
  const sensitivityReports = computeAllSensitivityReports(scenarios);

  // ── Build Insight Graph ──
  const insightsForGraph = insights.map(i => ({
    id: i.id,
    label: i.label,
    description: i.description,
    insightType: i.insightType,
    impact: i.impact,
    confidenceScore: i.confidence,
    evidenceIds: i.evidenceIds,
    recommendedTools: [] as string[],
  }));

  const deepenedForGraph = deepenedOpps.map(d => ({
    id: d.id,
    reconfigurationLabel: d.reconfigurationLabel,
    summary: d.summary,
    causalChain: d.causalChain,
    resolvesConstraints: d.resolvesConstraints,
    evidenceIds: d.evidenceIds,
    signalDensity: d.signalDensity,
  }));
  const { result: graph, stage: sg } = traceStage("Graph Construction", flat.length + insights.length, () =>
    buildInsightGraph(
      flat, undefined, undefined, undefined, undefined,
      insightsForGraph.length > 0 ? insightsForGraph : undefined,
      scenarioComparison?.scenarios,
      deepenedForGraph.length > 0 ? deepenedForGraph : undefined,
    )
  );
  stages.push(sg);

  // ── Command Deck Metrics ──
  const metricsInput = {
    products: input.products,
    selectedProduct: input.selectedProduct,
    disruptData: input.disruptData,
    redesignData: input.redesignData,
    stressTestData: input.stressTestData,
    pitchDeckData: input.pitchDeckData,
    governedData: input.governedData,
    businessAnalysisData: input.businessAnalysisData,
    intelligence: input.intelligence,
    completedSteps: input.completedSteps,
    evidence,
  };

  const { result: metrics, stage: sm } = traceStage("Metrics Computation", flat.length, () =>
    computeCommandDeckMetrics(metricsInput)
  );
  stages.push(sm);

  const { result: aggOpps, stage: so } = traceStage("Opportunity Aggregation", flat.length, () =>
    aggregateOpportunities(metricsInput)
  );
  stages.push(so);

  // ── Diagnostic ──
  const constraintCount = structuralProfile?.bindingConstraints.length ?? 0;
  const insufficientEvidence = evCount < 4;
  let message: string | null = null;
  if (insufficientEvidence) {
    message = `Need at least ${minEvidenceThreshold} evidence items for structural diagnosis. Have ${evCount}.`;
  } else if (qualifiedPatternsResult.length === 0) {
    message = "Structural diagnosis complete but no patterns qualified. The business structure may not match common reconfiguration patterns — or more evidence is needed.";
  }

  const thresholds = [
    { stage: "Structural Diagnosis", required: minEvidenceThreshold, current: evCount, met: evCount >= minEvidenceThreshold },
    { stage: "Pattern Qualification", required: minEvidenceThreshold, current: evCount, met: qualifiedPatternsResult.length > 0 },
    { stage: "Thesis Construction", required: minEvidenceThreshold, current: evCount, met: deepenedOpps.length > 0 },
  ];

  const diagnostic: StrategicDiagnostic = {
    evidenceCount: evCount,
    signalCount: 0,
    constraintCount,
    driverCount: deepenedOpps.length > 0 ? 1 : 0,
    leverageCount: deepenedOpps.length,
    opportunityCount: deepenedOpps.length,
    pathwayCount: deepenedOpps.length > 0 ? 1 : 0,
    insufficientEvidence,
    message,
    thresholds,
  };

  buildDiagnostic(stages, graph.nodes, flat.length, insights.length, scenarios.length);
  events.push("Strategic intelligence computed");

  activeRunFactory = null;

  return {
    evidence,
    flatEvidence: flat,
    signals: [],
    insights,
    graph,
    metrics,
    opportunities: aggOpps,
    narrative,
    diagnostic,
    scenarioComparison,
    sensitivityReports,
    events,
    constraintHypotheses,
    facetedEvidence,
    legacyConstraints: [],
    activeConstraints: insights.filter(i => i.insightType === "constraint_cluster"),
    constraintInteractions: null,
    severityReport: null,
    viabilityReport: null,
    marketStructure: null,
    structuralProfile,
    qualifiedPatterns: qualifiedPatternsResult,
    deepenedOpportunities: deepenedOpps,
  };
}

/** @deprecated — Legacy export, no longer used internally */
export function generateOpportunitiesFromVectors(
  _vectors: any[], _zones: any[], _baseline: any,
  _constraints: any[], _leveragePoints: any[], _analysisId: string,
): StrategicInsight[] {
  return [];
}

// ═══════════════════════════════════════════════════════════════
//  ASYNC ENTRY POINT — AI-Powered Thesis Deepening
// ═══════════════════════════════════════════════════════════════

/**
 * Same as runStrategicAnalysis but uses AI for Stage 6 (thesis deepening).
 * Falls back to deterministic deepening if AI fails.
 */
export async function runStrategicAnalysisAsync(input: StrategicAnalysisInput): Promise<StrategicAnalysisOutput> {
  const runFactory = createRunIdFactory();
  activeRunFactory = runFactory;
  const events: string[] = [];
  const stages: PipelineStageResult[] = [];

  // ── Stages 1-5: Same as sync ──
  const { result: evidenceResult, stage: s1 } = traceStage("Evidence Collection", 1, () => collectEvidence(input));
  stages.push(s1);
  const { structured: evidence, flat: rawFlat } = evidenceResult;

  const { result: flat, stage: s2 } = traceStage("Evidence Normalization", rawFlat.length, () => normalizeEvidence(rawFlat));
  stages.push(s2);
  events.push(`${flat.length} evidence objects (normalized from ${rawFlat.length} raw)`);
  const evCount = flat.length;

  const minEvidenceThreshold = input.analysisType === "business_model" ? 2 : 4;
  let facetedEvidence: Evidence[] = flat;
  if (evCount >= minEvidenceThreshold) {
    const { result: faceted, stage: s2b } = traceStage("Facet Population", flat.length, () => populateFacets(flat));
    stages.push(s2b);
    facetedEvidence = faceted;
  }

  let constraintHypotheses: ConstraintHypothesisSet | null = null;
  if (evCount >= minEvidenceThreshold) {
    const { result: hypotheses, stage: s3 } = traceStage("Constraint Detection", facetedEvidence.length, () => detectConstraintHypotheses(facetedEvidence));
    stages.push(s3);
    constraintHypotheses = hypotheses;
    events.push(`${hypotheses.hypotheses.length} constraint hypotheses detected`);
  }

  let structuralProfile: StructuralProfile | null = null;
  const candidatesForProfile = (constraintHypotheses?.hypotheses ?? []).slice(0, 5);
  if (evCount >= minEvidenceThreshold) {
    const { result: profile, stage: s4 } = traceStage("Structural Diagnosis", flat.length, () => diagnoseStructuralProfile(flat, candidatesForProfile, input.lensConfig));
    stages.push(s4);
    structuralProfile = profile;
    events.push(`Structural profile: ${profile.supplyFragmentation} fragmentation, ${profile.laborIntensity} labor, ${profile.revenueModel} revenue`);
  }

  let qualifiedPatternsResult: QualifiedPattern[] = [];
  if (structuralProfile) {
    const { result: qPatterns, stage: s5 } = traceStage("Pattern Qualification", 6, () => {
      const all = qualifyPatterns(structuralProfile!);
      return all.slice(0, 4); // Allow more patterns for multi-opportunity generation
    });
    stages.push(s5);
    qualifiedPatternsResult = qPatterns;
    events.push(`${qPatterns.length} patterns qualified: ${qPatterns.map(p => p.pattern.name).join(", ") || "none"}`);
  }

  // ── Stage 6: Thesis Construction (AI-gated, multi-opportunity) ──
  let deepenedOpps: DeepenedOpportunity[] = [];
  const bindingConstraintCount = structuralProfile?.bindingConstraints.length ?? 0;
  // Lower AI threshold — strategic directions can fill gaps even with fewer qualified patterns
  const meetsAIThreshold = evCount >= 6 && bindingConstraintCount >= 1 && structuralProfile != null;

  if (structuralProfile) {
    if (meetsAIThreshold) {
      events.push(`AI quality gate PASSED (${evCount} evidence, ${bindingConstraintCount} constraints, ${qualifiedPatternsResult.length} patterns) — calling AI deepening with strategic directions...`);
      try {
        // Build lens context for AI
        const lensContext = input.lensConfig ? {
          lensType: input.lensConfig.lensType,
          name: input.lensConfig.name,
          risk_tolerance: input.lensConfig.risk_tolerance,
          constraints: input.lensConfig.constraints,
          primary_objective: (input.lensConfig as any).primary_objective,
          target_outcome: (input.lensConfig as any).target_outcome,
          time_horizon: (input.lensConfig as any).time_horizon,
          available_resources: (input.lensConfig as any).available_resources,
          evaluation_priorities: (input.lensConfig as any).evaluation_priorities,
        } : undefined;

        deepenedOpps = await deepenOpportunitiesAsync(
          qualifiedPatternsResult,
          structuralProfile!,
          flat,
          input.analysisType,
          undefined, // businessContext — auto-derived
          lensContext,
        );
        // No more .slice(0, 2) — allow 3-5 opportunities through
        deepenedOpps = deepenedOpps.slice(0, 5);
        events.push(`${deepenedOpps.length} AI theses: ${deepenedOpps.map(d => d.reconfigurationLabel.slice(0, 60)).join(" | ")}`);
      } catch (err) {
        console.warn("[StrategicEngine] AI deepening failed, using deterministic:", err);
        deepenedOpps = deepenOpportunities(qualifiedPatternsResult, structuralProfile!, flat).slice(0, 5);
        events.push(`${deepenedOpps.length} deterministic theses (AI fallback)`);
      }
    } else if (qualifiedPatternsResult.length > 0) {
      events.push(`AI quality gate not met (${evCount}/6 evidence, ${bindingConstraintCount}/1 constraints) — using deterministic deepening`);
      deepenedOpps = deepenOpportunities(qualifiedPatternsResult, structuralProfile!, flat).slice(0, 5);
      events.push(`${deepenedOpps.length} deterministic theses`);
    }
  }

  // ── Remaining stages same as sync ──
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  if (structuralProfile) {
    for (const bc of structuralProfile.bindingConstraints.slice(0, 3)) {
      insights.push(makeInsight({
        id: nextId("constraint"),
        analysisId: input.analysisId,
        insightType: "constraint_cluster",
        label: bc.explanation || bc.constraintName.replace(/_/g, " "),
        description: `Binding structural constraint: ${bc.constraintName}`,
        evidenceIds: bc.evidenceIds ?? [],
        relatedInsightIds: [],
        impact: 8,
        confidence: 0.7,
        createdAt: now,
      }));
    }
  }

  for (const deep of deepenedOpps) {
    insights.push(makeInsight({
      id: nextId("thesis"),
      analysisId: input.analysisId,
      insightType: "emerging_opportunity",
      label: deep.reconfigurationLabel,
      description: [
        `[${deep.patternName}] ${deep.summary}`,
        `Industry assumes: "${deep.strategicBet.industryAssumption}"`,
        `Contrarian belief: "${deep.strategicBet.contrarianBelief}"`,
        `First move: ${deep.firstMove.action.slice(0, 120)}`,
      ].join(" | "),
      evidenceIds: deep.evidenceIds,
      relatedInsightIds: insights.filter(i => i.insightType === "constraint_cluster").map(i => i.id),
      impact: Math.min(6 + deep.signalDensity, 10),
      confidence: Math.min(0.5 + deep.signalDensity * 0.1, 0.9),
      createdAt: now,
    }));
  }

  const primary = deepenedOpps[0] ?? null;
  const alternative = deepenedOpps[1] ?? null;
  const narrative = buildStrategicNarrative(primary, alternative, structuralProfile, flat);

  for (const opp of insights.filter(i => i.insightType === "emerging_opportunity")) {
    evidence.opportunity.items.push({
      id: opp.id, type: "opportunity" as any, label: opp.label, description: opp.description,
      pipelineStep: "disrupt" as any, tier: "structural" as any,
      impact: opp.impact, confidenceScore: opp.confidence, sourceEngine: "reconfiguration" as any,
    });
  }

  const scenarios = getScenarios(input.analysisId);
  const scenarioComparison = scenarios.length > 0 ? compareScenarios(scenarios) : null;
  const sensitivityReports = computeAllSensitivityReports(scenarios);

  const insightsForGraph = insights.map(i => ({
    id: i.id, label: i.label, description: i.description, insightType: i.insightType,
    impact: i.impact, confidenceScore: i.confidence, evidenceIds: i.evidenceIds, recommendedTools: [] as string[],
  }));
  const deepenedForGraph = deepenedOpps.map(d => ({
    id: d.id, reconfigurationLabel: d.reconfigurationLabel, summary: d.summary,
    causalChain: d.causalChain, resolvesConstraints: d.resolvesConstraints,
    evidenceIds: d.evidenceIds, signalDensity: d.signalDensity,
  }));
  const { result: graph, stage: sg } = traceStage("Graph Construction", flat.length + insights.length, () =>
    buildInsightGraph(flat, undefined, undefined, undefined, undefined, insightsForGraph.length > 0 ? insightsForGraph : undefined, scenarioComparison?.scenarios, deepenedForGraph.length > 0 ? deepenedForGraph : undefined)
  );
  stages.push(sg);

  const metricsInput = {
    products: input.products, selectedProduct: input.selectedProduct, disruptData: input.disruptData,
    redesignData: input.redesignData, stressTestData: input.stressTestData, pitchDeckData: input.pitchDeckData,
    governedData: input.governedData, businessAnalysisData: input.businessAnalysisData,
    intelligence: input.intelligence, completedSteps: input.completedSteps, evidence,
  };
  const { result: metrics, stage: sm } = traceStage("Metrics Computation", flat.length, () => computeCommandDeckMetrics(metricsInput));
  stages.push(sm);
  const { result: aggOpps, stage: so } = traceStage("Opportunity Aggregation", flat.length, () => aggregateOpportunities(metricsInput));
  stages.push(so);

  const constraintCount = structuralProfile?.bindingConstraints.length ?? 0;
  const insufficientEvidence = evCount < minEvidenceThreshold;
  let message: string | null = null;
  if (insufficientEvidence) message = `Need at least ${minEvidenceThreshold} evidence items. Have ${evCount}.`;
  else if (qualifiedPatternsResult.length === 0) message = "No patterns qualified — more evidence may be needed.";

  const diagnostic: StrategicDiagnostic = {
    evidenceCount: evCount, signalCount: 0, constraintCount, driverCount: deepenedOpps.length > 0 ? 1 : 0,
    leverageCount: deepenedOpps.length, opportunityCount: deepenedOpps.length,
    pathwayCount: deepenedOpps.length > 0 ? 1 : 0, insufficientEvidence, message,
    thresholds: [
      { stage: "Structural Diagnosis", required: minEvidenceThreshold, current: evCount, met: evCount >= minEvidenceThreshold },
      { stage: "Pattern Qualification", required: minEvidenceThreshold, current: evCount, met: qualifiedPatternsResult.length > 0 },
      { stage: "Thesis Construction", required: minEvidenceThreshold, current: evCount, met: deepenedOpps.length > 0 },
    ],
  };

  buildDiagnostic(stages, graph.nodes, flat.length, insights.length, scenarios.length);
  events.push("Strategic intelligence computed (AI-enhanced)");
  activeRunFactory = null;

  return {
    evidence, flatEvidence: flat, signals: [], insights, graph, metrics,
    opportunities: aggOpps, narrative, diagnostic, scenarioComparison, sensitivityReports, events,
    constraintHypotheses, facetedEvidence, legacyConstraints: [],
    activeConstraints: insights.filter(i => i.insightType === "constraint_cluster"),
    constraintInteractions: null, severityReport: null, viabilityReport: null, marketStructure: null,
    structuralProfile, qualifiedPatterns: qualifiedPatternsResult, deepenedOpportunities: deepenedOpps,
  };
}
