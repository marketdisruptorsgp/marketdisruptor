/**
 * STRATEGIC ENGINE — Single Intelligence Pipeline
 *
 * Pipeline (sequential):
 *   1. collectEvidence — Extract canonical evidence from all pipeline steps
 *   2. normalizeEvidence — Deduplicate, classify, assign scores
 *   3. formSignals — Cluster evidence into interpretable signals
 *   3b. populateFacets — Compute & cache structured facets on evidence
 *   4. detectConstraints — Legacy signal-based constraint detection
 *   4b. detectConstraintHypotheses — Facet-rule-based constraint hypotheses
 *   → activeConstraints — Union of legacy + strong/moderate hypotheses (ID-based dedup)
 *   4c. discoverConstraintInteractions — Pairwise constraint interaction analysis
 *   5. scoreConstraintSeverity — Evidence strength × centrality × impact scoring
 *   6. identifyDrivers — Root causes behind constraints
 *   7. discoverLeverage — Structural intervention opportunities
 *   8. generateOpportunities — Pattern library + morphological search
 *   → graceful degradation — Exploratory opportunities if pipeline yields 0
 *   9. scoreViability — Feasibility, capital, market readiness, complexity
 *   10. constructStrategicPathways — constraint → driver → leverage → opportunity
 *   11. generateStrategicNarrative — Reasoning chain summary
 *   12. buildInsightGraph — Graph nodes from real insights only
 *   13. calculateCommandDeckMetrics — Dashboard metrics
 *
 * Progressive thresholds:
 *   4 evidence → signals
 *   8 evidence → constraints
 *   11 evidence → drivers
 *   15 evidence → leverage
 *   18 evidence → opportunities
 *   22 evidence → pathways
 *
 * Confidence propagation: Evidence → Signal → Constraint → Opportunity
 * Graceful degradation: Always returns ≥1 opportunity (exploratory if needed)
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
import { runMorphologicalSearch } from "@/lib/opportunityDesignEngine";
import { populateFacets } from "@/lib/evidenceFacets";
import { detectConstraintHypotheses, type ConstraintHypothesisSet } from "@/lib/constraintDetectionEngine";
import {
  discoverConstraintInteractions,
  type ConstraintInteractionSet,
} from "@/lib/constraintInteractionEngine";
import {
  scoreConstraintSeverity,
  type SeverityReport,
  type SeverityScore,
} from "@/lib/constraintSeverityEngine";
import {
  scoreViability,
  generateExploratoryOpportunities,
  type ViabilityReport,
  type ViabilityScore,
} from "@/lib/viabilityEngine";
import { analyzeMarketStructure, type MarketStructureReport } from "@/lib/marketStructureEngine";
import { createRunIdFactory, type RunIdFactory } from "@/lib/runIdFactory";

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
  /** Compat with Insight interface */
  tier: import("@/lib/evidenceEngine").EvidenceTier;
  mode: import("@/lib/evidenceEngine").EvidenceMode;
  confidenceScore?: number;
  recommendedTools?: string[];
  /** Morphological search metadata — only for opportunity vectors */
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
  /** The dominant strategic move — headline verdict */
  strategicVerdict: string | null;
  /** One-line rationale for the verdict */
  verdictRationale: string | null;
  /** Confidence in the verdict (0-1) */
  verdictConfidence: number;
  /** Why This Matters — contextual paragraph explaining structural significance */
  whyThisMatters: string | null;
  /** What value is trapped in the current structure */
  trappedValue: string | null;
  /** What resolving the constraint would unlock */
  unlockPotential: string | null;
  /** AI-estimated dollar/time magnitude of trapped value */
  trappedValueEstimate: string | null;
  /** Contextual benchmark for comparison */
  trappedValueBenchmark: string | null;
  /** Evidence count backing the trapped value estimate */
  trappedValueEvidenceCount: number;
  /** The single falsifiable question that validates or kills the strategy */
  killQuestion: string | null;
  /** A concrete experiment to test the kill question */
  validationExperiment: string | null;
  /** Suggested timeframe for the experiment */
  validationTimeframe: string;
  /** Concrete next validation steps (3-5 ordered actions) */
  validationSteps: ValidationStep[];
  /** Industry benchmark context for the verdict */
  verdictBenchmark: string | null;
  /** 30-second CEO-readable executive summary paragraph */
  executiveSummary: string | null;
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
  /** Pre-fetched AI alternatives for morphological search (from edge function) */
  aiAlternatives?: import("@/lib/opportunityDesignEngine").DimensionAlternative[];
  /** Geo market data (Census, CBP, World Bank) */
  geoMarketData?: any | null;
  /** Regulatory intelligence profile */
  regulatoryData?: any | null;
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
  /** Phase 1: Constraint hypotheses from structured detection engine */
  constraintHypotheses: ConstraintHypothesisSet | null;
  /** Faceted evidence (cached from Stage 3b) */
  facetedEvidence: Evidence[];
  /** Legacy signal-derived constraints (separate provenance) */
  legacyConstraints: StrategicInsight[];
  /** Active constraints: union of legacy + strong/moderate hypotheses for downstream use */
  activeConstraints: StrategicInsight[];
  /** Stage 4c: Constraint interaction pairs */
  constraintInteractions: ConstraintInteractionSet | null;
  /** Stage 5: Constraint severity scores */
  severityReport: SeverityReport | null;
  /** Stage 9: Viability scores for opportunity concepts */
  viabilityReport: ViabilityReport | null;
  /** Market structure analysis */
  marketStructure: MarketStructureReport | null;
}

// ═══════════════════════════════════════════════════════════════
//  PROGRESSIVE THRESHOLDS
// ═══════════════════════════════════════════════════════════════

const THRESHOLDS = {
  signals: 4,
  constraints: 8,
  drivers: 11,
  leverage: 15,
  opportunities: 18,
  pathways: 22,
} as const;

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

let idCounter = 0;
let activeRunFactory: RunIdFactory | null = null;

function nextId(prefix: string): string {
  if (activeRunFactory) return activeRunFactory.next(prefix);
  return `${prefix}-${++idCounter}`;
}

/**
 * Humanize internal labels — strip ID prefixes, code artifacts, and jargon.
 * Uses the shared system-wide humanizer.
 */
import { humanizeLabel as humanize } from "@/lib/humanize";

const COMPAT_DEFAULTS = {
  tier: "structural" as const,
  mode: "product" as const,
  confidenceScore: undefined as number | undefined,
  recommendedTools: [] as string[],
};

function makeInsight(partial: Omit<StrategicInsight, "tier" | "mode" | "confidenceScore" | "recommendedTools">): StrategicInsight {
  return { ...partial, label: humanize(partial.label), ...COMPAT_DEFAULTS, confidenceScore: partial.confidence };
}

function jaccard(a: string, b: string): number {
  const tokA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(t => t.length > 2));
  const tokB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(t => t.length > 2));
  if (tokA.size === 0 && tokB.size === 0) return 0;
  let inter = 0;
  for (const t of tokA) { if (tokB.has(t)) inter++; }
  return inter / (tokA.size + tokB.size - inter);
}

// ═══════════════════════════════════════════════════════════════
//  STRATEGIC CATEGORIES — For evidence classification
// ═══════════════════════════════════════════════════════════════

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  demand_signal: ["demand", "market", "growth", "customer need", "adoption", "traction"],
  cost_structure: ["cost", "expense", "margin", "pricing", "unit economics", "cogs", "overhead"],
  distribution_channel: ["distribution", "channel", "retail", "online", "direct", "wholesale", "logistics"],
  competitive_pressure: ["competitor", "competitive", "market share", "moat", "differentiation", "rival"],
  pricing_model: ["pricing", "subscription", "freemium", "premium", "revenue model", "monetization"],
  operational_dependency: ["operations", "process", "supply chain", "vendor", "dependency", "bottleneck"],
  regulatory_constraint: ["regulation", "compliance", "legal", "policy", "license", "government"],
  technology_dependency: ["technology", "tech stack", "platform", "api", "infrastructure", "legacy"],
  customer_behavior: ["user behavior", "retention", "churn", "engagement", "satisfaction", "experience"],
};

function classifyEvidence(ev: Evidence): string {
  const text = `${ev.label} ${ev.description || ""} ${ev.category || ""}`.toLowerCase();
  let best = "demand_signal";
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(k => text.includes(k)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
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
  // Deduplicate by label similarity
  const deduped: Evidence[] = [];
  const usedIds = new Set<string>();

  for (const ev of flat) {
    if (usedIds.has(ev.id)) continue;
    const isDuplicate = deduped.some(d => jaccard(d.label, ev.label) >= 0.7);
    if (isDuplicate) continue;

    // Classify into strategic category
    const category = classifyEvidence(ev);

      // Ensure scores exist — default LOW to avoid inflated confidence
      const normalized: Evidence = {
        ...ev,
        category,
        impact: ev.impact ?? 4,
        confidenceScore: ev.confidenceScore ?? 0.3,
      };

    deduped.push(normalized);
    usedIds.add(ev.id);
  }

  return deduped;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 3: SIGNAL FORMATION (NEW)
// ═══════════════════════════════════════════════════════════════

function formSignals(flat: Evidence[], analysisId: string): StrategicSignal[] {
  const signals: StrategicSignal[] = [];

  // Group evidence by strategic category
  const byCategory: Record<string, Evidence[]> = {};
  for (const ev of flat) {
    const cat = classifyEvidence(ev);
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(ev);
  }

  // Form signals from category clusters (min 2 evidence per signal)
  for (const [category, items] of Object.entries(byCategory)) {
    if (items.length < 2) continue;

    // Sub-cluster within category by semantic similarity
    const used = new Set<string>();
    for (const anchor of items) {
      if (used.has(anchor.id)) continue;
      const cluster = [anchor];
      used.add(anchor.id);

      for (const candidate of items) {
        if (used.has(candidate.id)) continue;
        if (jaccard(anchor.label, candidate.label) >= 0.35) {
          cluster.push(candidate);
          used.add(candidate.id);
        }
      }

      if (cluster.length < 2) continue;

      // Derive signal label from highest-impact evidence
      const sorted = [...cluster].sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0));
      const primary = sorted[0];
      const categoryLabel = category.replace(/_/g, " ").replace(/^./, c => c.toUpperCase());

      signals.push({
        id: nextId("signal"),
        analysisId,
        label: `${categoryLabel}: ${primary.label}`,
        description: `Pattern detected from ${cluster.length} evidence items in ${categoryLabel}. Primary indicator: ${primary.label}.${cluster.length > 2 ? ` Also involves: ${sorted.slice(1, 3).map(e => e.label).join(", ")}.` : ""}`,
        evidenceIds: cluster.map(e => e.id),
        strength: Math.round((cluster.reduce((s, e) => s + (e.impact ?? 5), 0) / cluster.length) * 10) / 10,
        confidence: Math.round((cluster.reduce((s, e) => s + (e.confidenceScore ?? 0.5), 0) / cluster.length) * 100) / 100,
        category,
      });
    }

    // If we have enough unclustered items, create a category-level signal
    const unclustered = items.filter(e => !used.has(e.id));
    if (unclustered.length >= 2) {
      const sorted = [...unclustered].sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0));
      const categoryLabel = category.replace(/_/g, " ").replace(/^./, c => c.toUpperCase());

      signals.push({
        id: nextId("signal"),
        analysisId,
        label: `${categoryLabel} Pattern`,
        description: `Broad pattern across ${unclustered.length} ${categoryLabel.toLowerCase()} indicators: ${sorted.slice(0, 3).map(e => e.label).join(", ")}.`,
        evidenceIds: unclustered.map(e => e.id),
        strength: Math.round((unclustered.reduce((s, e) => s + (e.impact ?? 5), 0) / unclustered.length) * 10) / 10,
        confidence: Math.round((unclustered.reduce((s, e) => s + (e.confidenceScore ?? 0.5), 0) / unclustered.length) * 100) / 100,
        category,
      });
    }
  }

  // Also form signals from type-based clustering (constraint, risk, assumption evidence)
  const typeGroups: Record<string, Evidence[]> = {};
  for (const ev of flat) {
    const key = ev.type;
    if (!typeGroups[key]) typeGroups[key] = [];
    typeGroups[key].push(ev);
  }

  for (const [type, items] of Object.entries(typeGroups)) {
    if (items.length < 2) continue;
    if (["signal", "constraint", "risk", "assumption", "friction"].includes(type)) {
      // Check if a signal already covers these
      const alreadyCovered = items.every(e =>
        signals.some(s => s.evidenceIds.includes(e.id))
      );
      if (alreadyCovered) continue;

      const uncovered = items.filter(e => !signals.some(s => s.evidenceIds.includes(e.id)));
      if (uncovered.length < 2) continue;

      const sorted = [...uncovered].sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0));
      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      // Use the highest-impact item's label for specificity, not a generic "X Cluster"
      const primaryLabel = humanize(sorted[0].label);
      const signalLabel = uncovered.length > 2
        ? `${primaryLabel} and ${uncovered.length - 1} related ${type}s`
        : primaryLabel;

      signals.push({
        id: nextId("signal"),
        analysisId,
        label: signalLabel,
        description: `${uncovered.length} ${type} indicators identified: ${sorted.slice(0, 3).map(e => humanize(e.label)).join(", ")}.`,
        evidenceIds: uncovered.map(e => e.id),
        strength: Math.round((uncovered.reduce((s, e) => s + (e.impact ?? 5), 0) / uncovered.length) * 10) / 10,
        confidence: Math.round((uncovered.reduce((s, e) => s + (e.confidenceScore ?? 0.5), 0) / uncovered.length) * 100) / 100,
        category: "cross_category",
      });
    }
  }

  return signals;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 4: DETECT CONSTRAINTS (from signals)
// ═══════════════════════════════════════════════════════════════

function detectConstraints(signals: StrategicSignal[], flat: Evidence[], analysisId: string): StrategicInsight[] {
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  // Constraints emerge from high-strength signals that indicate barriers
  const constraintCategories = new Set([
    "competitive_pressure", "regulatory_constraint", "operational_dependency",
    "technology_dependency", "cost_structure",
  ]);

  // Signals in barrier categories become constraints
  for (const sig of signals) {
    if (constraintCategories.has(sig.category) && sig.strength >= 4) {
      insights.push(makeInsight({
        id: nextId("constraint"),
        analysisId,
        insightType: "constraint_cluster",
        label: sig.label.replace(/^[^:]+:\s*/, ""), // Strip category prefix
        description: `Structural constraint from signal: ${sig.description}`,
        evidenceIds: sig.evidenceIds,
        relatedInsightIds: [],
        impact: Math.round(sig.strength),
        confidence: sig.confidence,
        createdAt: now,
      }));
    }
  }

  // High-strength cross-category signals with friction/risk also indicate constraints
  for (const sig of signals) {
    if (sig.strength >= 6 && !constraintCategories.has(sig.category)) {
      const hasBarrierEvidence = sig.evidenceIds.some(eid => {
        const ev = flat.find(e => e.id === eid);
        return ev && (ev.type === "constraint" || ev.type === "risk" || ev.type === "friction");
      });
      if (hasBarrierEvidence) {
        if (insights.some(i => jaccard(i.label, sig.label) >= 0.5)) continue;
        insights.push(makeInsight({
          id: nextId("constraint"),
          analysisId,
          insightType: "constraint_cluster",
          label: sig.label.replace(/^[^:]+:\s*/, ""),
          description: `High-impact constraint derived from ${sig.label}.`,
          evidenceIds: sig.evidenceIds,
          relatedInsightIds: [],
          impact: Math.round(sig.strength),
          confidence: sig.confidence,
          createdAt: now,
        }));
      }
    }
  }

  // Cluster similar constraints
  const merged: StrategicInsight[] = [];
  const used = new Set<string>();
  for (const con of insights) {
    if (used.has(con.id)) continue;
    const cluster = [con];
    used.add(con.id);
    for (const candidate of insights) {
      if (used.has(candidate.id)) continue;
      if (jaccard(con.label, candidate.label) >= 0.5) {
        cluster.push(candidate);
        used.add(candidate.id);
      }
    }
    const primary = cluster.sort((a, b) => b.impact - a.impact)[0];
    if (cluster.length > 1) {
      merged.push(makeInsight({
        ...primary,
        label: `${primary.label} (+${cluster.length - 1} related)`,
        evidenceIds: [...new Set(cluster.flatMap(c => c.evidenceIds))],
      }));
    } else {
      merged.push(primary);
    }
  }

  return merged;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 5: IDENTIFY DRIVERS (root causes behind constraints)
// ═══════════════════════════════════════════════════════════════

function identifyDrivers(
  signals: StrategicSignal[],
  constraints: StrategicInsight[],
  flat: Evidence[],
  analysisId: string,
): StrategicInsight[] {
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  // For each constraint, find signals that share evidence
  for (const con of constraints) {
    const relatedSignals = signals.filter(s =>
      s.evidenceIds.some(eid => con.evidenceIds.includes(eid)) ||
      jaccard(s.label, con.label) >= 0.3
    );

    if (relatedSignals.length === 0) continue;

    // The driver is the pattern that explains WHY the constraint exists
    const driverSignal = relatedSignals.sort((a, b) => b.strength - a.strength)[0];

    // Construct driver label as the root cause
    const label = relatedSignals.length > 1
      ? `${driverSignal.category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} Concentration`
      : driverSignal.label.replace(/^[^:]+:\s*/, "");

    if (insights.some(i => jaccard(i.label, label) >= 0.5)) continue;

    insights.push(makeInsight({
      id: nextId("driver"),
      analysisId,
      insightType: "driver",
      label,
      description: `Root cause behind "${con.label}": ${driverSignal.description.slice(0, 120)}.`,
      evidenceIds: [...new Set([...con.evidenceIds, ...driverSignal.evidenceIds])],
      relatedInsightIds: [con.id],
      impact: Math.round((con.impact + driverSignal.strength) / 2),
      confidence: Math.round(((con.confidence + driverSignal.confidence) / 2) * 100) / 100,
      createdAt: now,
    }));
  }

  // Standalone assumption-based drivers
  const assumptions = flat.filter(e => e.type === "assumption" && (e.impact ?? 0) >= 5);
  for (const asm of assumptions.slice(0, 3)) {
    if (insights.some(i => jaccard(i.label, asm.label) >= 0.5)) continue;
    const relatedConstraintIds = constraints
      .filter(c => jaccard(c.label, asm.label) >= 0.25)
      .map(c => c.id);

    insights.push(makeInsight({
      id: nextId("driver"),
      analysisId,
      insightType: "driver",
      label: asm.label,
      description: asm.description || `Assumption acting as structural driver.`,
      evidenceIds: [asm.id],
      relatedInsightIds: relatedConstraintIds,
      impact: asm.impact ?? 6,
      confidence: asm.confidenceScore ?? 0.5,
      createdAt: now,
    }));
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 6: LEVERAGE DISCOVERY
// ═══════════════════════════════════════════════════════════════

function discoverLeverage(
  signals: StrategicSignal[],
  constraints: StrategicInsight[],
  drivers: StrategicInsight[],
  flat: Evidence[],
  analysisId: string,
): StrategicInsight[] {
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  // Direct leverage evidence
  const leverageEvidence = flat.filter(e => e.type === "leverage" || e.type === "opportunity");
  for (const lev of leverageEvidence.slice(0, 8)) {
    const relatedConstraints = constraints
      .filter(c => c.evidenceIds.some(eid => {
        const relEv = flat.find(e => e.id === eid);
        return relEv && jaccard(relEv.label, lev.label) >= 0.2;
      }))
      .map(c => c.id);
    const relatedDrivers = drivers
      .filter(d => jaccard(d.label, lev.label) >= 0.2)
      .map(d => d.id);

    if (insights.some(i => jaccard(i.label, lev.label) >= 0.5)) continue;

    insights.push(makeInsight({
      id: nextId("leverage"),
      analysisId,
      insightType: "leverage_point",
      label: lev.label,
      description: lev.description || `Structural intervention point connecting ${relatedConstraints.length} constraint(s).`,
      evidenceIds: [lev.id],
      relatedInsightIds: [...relatedConstraints, ...relatedDrivers],
      impact: lev.impact ?? 7,
      confidence: lev.confidenceScore ?? 0.6,
      createdAt: now,
    }));
  }

  // Derive leverage from constraint-driver intersections
  for (const constraint of constraints.slice(0, 4)) {
    for (const driver of drivers.slice(0, 4)) {
      const sharedEvidence = constraint.evidenceIds.filter(id => driver.evidenceIds.includes(id));
      const semanticOverlap = jaccard(constraint.label, driver.label) >= 0.25;

      if (sharedEvidence.length > 0 || semanticOverlap) {
        // Generate a human-readable leverage label
        const conText = humanize(constraint.label);
        const drvText = humanize(driver.label);
        const label = `Address ${conText} through ${drvText}`;
        if (insights.some(i => jaccard(i.label, label) >= 0.5)) continue;

        insights.push(makeInsight({
          id: nextId("leverage"),
          analysisId,
          insightType: "leverage_point",
          label,
          description: `Targeting "${humanize(constraint.label)}" by working on "${humanize(driver.label)}" creates a high-impact intervention point.`,
          evidenceIds: [...new Set([...constraint.evidenceIds, ...driver.evidenceIds])],
          relatedInsightIds: [constraint.id, driver.id],
          impact: Math.round((constraint.impact + driver.impact) / 2),
          confidence: Math.round(((constraint.confidence + driver.confidence) / 2) * 100) / 100,
          createdAt: now,
        }));
      }
    }
  }

  // Derive leverage from non-barrier signal patterns (e.g., demand signals suggest distribution leverage)
  const growthSignals = signals.filter(s =>
    ["demand_signal", "distribution_channel", "pricing_model"].includes(s.category) && s.strength >= 5
  );
  for (const gs of growthSignals.slice(0, 3)) {
    const oppLabel = humanize(gs.label.replace(/^[^:]+:\s*/, ""));
    const dimVerb = DIMENSION_ACTION_VERBS[gs.category] || "Capitalize on";
    const label = `${dimVerb} ${oppLabel.charAt(0).toLowerCase() + oppLabel.slice(1)}`;
    if (insights.some(i => jaccard(i.label, label) >= 0.5)) continue;

    insights.push(makeInsight({
      id: nextId("leverage"),
      analysisId,
      insightType: "leverage_point",
      label,
      description: `Growth signal suggests leverage opportunity: ${gs.description.slice(0, 100)}.`,
      evidenceIds: gs.evidenceIds,
      relatedInsightIds: [],
      impact: Math.round(gs.strength),
      confidence: gs.confidence,
      createdAt: now,
    }));
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 7: OPPORTUNITY GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * STAGE 7 — Morphological Search (replaces old generateOpportunities).
 *
 * When sufficient evidence exists, runs the morphological search pipeline
 * to produce opportunity vectors expressed as baseline deltas.
 * Falls back to legacy label-based generation if insufficient dimensions.
 *
 * Note: This is the synchronous/deterministic part. AI-assisted alternative
 * generation happens asynchronously via the edge function and is wired at
 * the call site in runStrategicAnalysis or the Command Deck orchestrator.
 */
export function generateOpportunitiesFromVectors(
  vectors: import("@/lib/opportunityDesignEngine").OpportunityVector[],
  zones: import("@/lib/opportunityDesignEngine").OpportunityZone[],
  baseline: import("@/lib/opportunityDesignEngine").BusinessBaseline,
  constraints: StrategicInsight[],
  leveragePoints: StrategicInsight[],
  analysisId: string,
): StrategicInsight[] {
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  // Build baseline snapshot for metadata
  const baselineSnapshot: Record<string, string> = {};
  for (const [key, dim] of Object.entries(baseline)) {
    baselineSnapshot[dim.name] = dim.currentValue;
  }

  for (const vector of vectors) {
    const shifts = vector.changedDimensions
      .map(d => `${d.dimension}: ${d.from} → ${d.to}`)
      .join("; ");

    const label = formatStrategicLabel(vector.changedDimensions);

    if (insights.some(i => jaccard(i.label, label) >= 0.5)) continue;

    // Find related constraint/leverage IDs
    const relatedInsightIds = vector.triggerIds.filter(tid =>
      [...constraints, ...leveragePoints].some(i => i.id === tid)
    );

    insights.push(makeInsight({
      id: nextId("opportunity"),
      analysisId,
      insightType: "emerging_opportunity",
      label,
      description: `${vector.rationale} (${shifts})`,
      evidenceIds: vector.evidenceIds,
      relatedInsightIds,
      impact: 5, // Neutral default — not surfaced in UI
      confidence: 0.5, // Neutral default — not surfaced in UI
      createdAt: now,
      opportunityVectorData: {
        changedDimensions: vector.changedDimensions,
        baselineSnapshot,
        triggerConstraintIds: vector.triggerIds,
        explorationMode: vector.explorationMode,
      },
    }));
  }

  return insights;
}

/** Legacy fallback when morphological search can't run (insufficient dimensions) */
function generateOpportunitiesFallback(
  leveragePoints: StrategicInsight[],
  constraints: StrategicInsight[],
  analysisId: string,
): StrategicInsight[] {
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  for (const lev of leveragePoints) {
    const relatedConstraints = constraints.filter(c => lev.relatedInsightIds.includes(c.id));
    const con = relatedConstraints[0];

    const conText = con ? humanize(con.label) : "";
    const levText = humanize(lev.label);
    const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

    const label = con
      ? `Resolve ${conText} to unlock growth`
      : `Apply ${lowerFirst(levText)} for strategic advantage`;

    if (insights.some(i => jaccard(i.label, label) >= 0.5)) continue;

    insights.push(makeInsight({
      id: nextId("opportunity"),
      analysisId,
      insightType: "emerging_opportunity",
      label,
      description: con
        ? `Addressing "${humanize(con.label)}" through "${humanize(lev.label)}" may create strategic value — requires further validation.`
        : `"${humanize(lev.label)}" appears to be an emerging opportunity, though confidence depends on additional evidence.`,
      evidenceIds: [...new Set([...lev.evidenceIds, ...(con?.evidenceIds ?? [])])],
      relatedInsightIds: [lev.id, ...(con ? [con.id] : [])],
      impact: Math.max(lev.impact, con?.impact ?? 0),
      confidence: con
        ? Math.round(((lev.confidence + con.confidence) / 2) * 100) / 100
        : lev.confidence,
      createdAt: now,
    }));
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 8: STRATEGIC PATHWAYS
// ═══════════════════════════════════════════════════════════════

function constructStrategicPathways(
  constraints: StrategicInsight[],
  drivers: StrategicInsight[],
  leveragePoints: StrategicInsight[],
  opportunities: StrategicInsight[],
  analysisId: string,
): StrategicInsight[] {
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  const topConstraints = [...constraints].sort((a, b) => b.impact - a.impact).slice(0, 3);
  const topOpps = [...opportunities].sort((a, b) => b.impact - a.impact).slice(0, 3);

  for (let i = 0; i < Math.min(topConstraints.length, topOpps.length); i++) {
    const con = topConstraints[i];
    const opp = topOpps[i];

    // Find the driver and leverage connecting them
    const driver = drivers.find(d => d.relatedInsightIds.includes(con.id));
    const leverage = leveragePoints.find(l =>
      l.relatedInsightIds.includes(con.id) || opp.relatedInsightIds.includes(l.id)
    );

    // Build pathway label with word-boundary-safe truncation
    const trimWord = (s: string, max: number) => {
      const clean = humanize(s);
      if (clean.length <= max) return clean;
      // Cut at sentence boundary first, then clause, then word
      const sentenceCut = Math.max(clean.lastIndexOf(". ", max), clean.lastIndexOf("; ", max));
      if (sentenceCut > max * 0.4) return clean.slice(0, sentenceCut + 1);
      const clauseCut = clean.lastIndexOf(", ", max);
      if (clauseCut > max * 0.5) return clean.slice(0, clauseCut);
      const cut = clean.lastIndexOf(" ", max);
      return clean.slice(0, cut > max * 0.4 ? cut : max);
    };
    const parts = [trimWord(con.label, 40)];
    if (driver) parts.push(trimWord(driver.label, 40));
    if (leverage) parts.push(trimWord(leverage.label, 40));
    parts.push(trimWord(opp.label, 40));
    const label = parts.join(" → ");

    insights.push(makeInsight({
      id: nextId("pathway"),
      analysisId,
      insightType: "strategic_pathway",
      label,
      description: `Strategic pathway: address "${humanize(con.label)}" ${driver ? `(caused by "${humanize(driver.label)}")` : ""} ${leverage ? `through "${humanize(leverage.label)}"` : ""} to achieve "${humanize(opp.label)}".`,
      evidenceIds: [...new Set([
        ...con.evidenceIds, ...opp.evidenceIds,
        ...(driver?.evidenceIds ?? []), ...(leverage?.evidenceIds ?? []),
      ])],
      relatedInsightIds: [
        con.id, opp.id,
        ...(driver ? [driver.id] : []),
        ...(leverage ? [leverage.id] : []),
      ],
      impact: Math.max(con.impact, opp.impact),
      confidence: Math.round(((con.confidence + opp.confidence) / 2) * 100) / 100,
      createdAt: now,
    }));
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 9: STRATEGIC NARRATIVE
// ═══════════════════════════════════════════════════════════════

function buildStrategicNarrative(
  constraints: StrategicInsight[],
  drivers: StrategicInsight[],
  leveragePoints: StrategicInsight[],
  opportunities: StrategicInsight[],
  pathways: StrategicInsight[],
  flatEvidence: Evidence[],
): StrategicNarrative {
  const topConstraint = [...constraints].sort((a, b) => b.impact - a.impact)[0] ?? null;
  const topDriver = [...drivers].sort((a, b) => b.impact - a.impact)[0] ?? null;
  const topLeverage = [...leveragePoints].sort((a, b) => b.impact - a.impact)[0] ?? null;
  const topOpp = [...opportunities].sort((a, b) => b.impact - a.impact)[0] ?? null;
  const topPathway = [...pathways].sort((a, b) => b.impact - a.impact)[0] ?? null;

  const h = (s: string | null | undefined) => s ? humanize(s) : null;

  /** Sanitize insight labels for use in narrative text.
   *  Strips internal prefixes, enumerations (e.g. "and 11 related constraints"),
   *  truncates at word boundary — never mid-word, never mid-sentence fragment. */
  function trimAt(s: string | null | undefined, max: number): string {
    if (!s) return "";
    let clean = humanize(s);

    // Strip trailing enumerations like "and 11 related constraints" or "and 5 additional..."
    clean = clean.replace(/[.,]?\s+and\s+\d+\s+(related|additional|further|other)\s+\w+\.?$/i, "");

    // Strip internal step prefixes like "Step 1: Step 1:" or "C1:", "F1:"
    clean = clean.replace(/^(?:Step\s*\d+\s*:\s*)+/i, "");
    clean = clean.replace(/^[A-Z]\d+\s*:\s*/i, "");

    // Strip inline internal IDs like "(C1)", "(Removing C1)"
    clean = clean.replace(/\s*\((?:Removing\s+)?[A-Z]_?\d+\)\s*/gi, " ");

    // If label contains "→" (chained labels), take only the final segment
    if (clean.includes("→")) {
      const segments = clean.split("→").map(seg => seg.trim()).filter(Boolean);
      clean = segments[segments.length - 1] || clean;
    }

    // Clean up any "..." fragments
    clean = clean.replace(/\.\.\./g, "").trim();

    if (clean.length <= max) return clean;

    // Try sentence boundary first
    const sentenceCut = Math.max(
      clean.lastIndexOf(". ", max),
      clean.lastIndexOf("; ", max),
    );
    if (sentenceCut > max * 0.4) {
      return clean.slice(0, sentenceCut + 1);
    }

    // Try clause boundary
    const clauseCut = clean.lastIndexOf(", ", max);
    if (clauseCut > max * 0.5) {
      return clean.slice(0, clauseCut);
    }

    // Find the last space before max
    const cut = clean.lastIndexOf(" ", max);
    if (cut < max * 0.4) {
      const nextSpace = clean.indexOf(" ", max);
      return nextSpace > 0 ? clean.slice(0, nextSpace) : clean;
    }
    return clean.slice(0, cut);
  }

  // Build a readable narrative — skeptical, qualified language
  const parts: string[] = [];
  const evCount = [topConstraint, topDriver, topLeverage, topOpp].filter(Boolean).length;
  const confQualifier = (node: StrategicInsight | null) => {
    if (!node) return "";
    if (node.confidence >= 0.7) return "";
    if (node.confidence >= 0.4) return " (moderate confidence)";
    return " (low confidence — needs validation)";
  };

  // Narrative prose should COMPLEMENT the Verdict, not repeat it.
  // Focus on: evidence coverage, secondary factors, what's missing.
  const secondaryConstraints = constraints.filter(c => c !== topConstraint).slice(0, 2);
  const secondaryOpps = opportunities.filter(o => o !== topOpp).slice(0, 2);

  if (topConstraint) {
    const relCount = constraints.length - 1;
    if (relCount > 0) {
      parts.push(`Beyond the primary bottleneck, ${relCount} related constraint${relCount > 1 ? "s" : ""} compound the problem${secondaryConstraints.length > 0 ? `: ${secondaryConstraints.map(c => trimAt(c.label, 60).toLowerCase()).join("; ")}` : ""}.`);
    }
  }
  if (topDriver && topDriver.label !== topConstraint?.label) {
    parts.push(`The underlying driver is ${trimAt(topDriver.label, 100).toLowerCase()}${confQualifier(topDriver)}.`);
  }
  if (secondaryOpps.length > 0) {
    parts.push(`Additional opportunities include: ${secondaryOpps.map(o => trimAt(o.label, 60).toLowerCase()).join("; ")}${confQualifier(secondaryOpps[0])}.`);
  }

  if (parts.length === 0) {
    parts.push("Strategic narrative will evolve as more pipeline steps are completed. The reasoning engine is building its evidence base.");
  } else if (evCount < 4) {
    parts.push("This narrative is based on incomplete evidence. Run additional pipeline steps to strengthen conclusions.");
  }

  // ── Strategic Verdict: derive the dominant move ──
  let strategicVerdict: string | null = null;
  let verdictRationale: string | null = null;
  let verdictConfidence = 0;
  let whyThisMatters: string | null = null;
  let verdictBenchmark: string | null = null;

  if (topOpp && topConstraint) {
    const constraintPhrase = trimAt(topConstraint.label, 150).toLowerCase();
    const oppPhrase = trimAt(topOpp.label, 150).toLowerCase();
    const leveragePhrase = topLeverage ? trimAt(topLeverage.label, 120).toLowerCase() : null;

    // Prevent circular verdicts: if opportunity starts with "resolve" and references the constraint, just use the opportunity
    const oppReferencesConstraint = oppPhrase.includes(constraintPhrase.slice(0, 30));
    if (oppReferencesConstraint) {
      strategicVerdict = oppPhrase.charAt(0).toUpperCase() + oppPhrase.slice(1);
    } else {
      strategicVerdict = `The current model is constrained by ${constraintPhrase}. The strategic move is to ${oppPhrase}`;
    }

    const avgConf = (topConstraint.confidence + topOpp.confidence + (topLeverage?.confidence ?? 0)) / (topLeverage ? 3 : 2);
    verdictConfidence = Math.round(avgConf * 100) / 100;

    verdictRationale = leveragePhrase
      ? `The current structure is bottlenecked by ${constraintPhrase}. By intervening at ${leveragePhrase}, the business can unlock ${oppPhrase}.`
      : `The dominant structural barrier is ${constraintPhrase}. Resolving it opens the path to ${oppPhrase}.`;

    // Why This Matters — contextual structural significance
    const constraintCount = constraints.length;
    const oppCount = opportunities.length;
    whyThisMatters = `This isn't a surface-level optimization. ${constraintCount > 1 ? `${constraintCount} structural constraints are interconnected` : "A fundamental structural constraint"}, creating compounding friction across the business. ${oppCount > 1 ? `${oppCount} transformation opportunities` : "A clear transformation opportunity"} ${oppCount > 1 ? "emerge" : "emerges"} when ${constraintPhrase} is resolved. ${topLeverage ? `The critical intervention point — ${leveragePhrase} — suggests this is achievable without rebuilding from scratch.` : "The analysis suggests structural intervention is feasible, but the exact leverage point needs further validation."}`;

    // Contextual benchmark for verdict
    verdictBenchmark = deriveVerdictBenchmark(flatEvidence, topConstraint, topOpp);
  } else if (topConstraint) {
    const constraintPhrase = trimAt(topConstraint.label, 200).toLowerCase();
    strategicVerdict = `Resolve the core bottleneck: ${constraintPhrase}`;
    verdictConfidence = topConstraint.confidence;
    verdictRationale = `The dominant bottleneck is ${constraintPhrase}. More evidence is needed to identify the specific strategic move.`;
    whyThisMatters = `The analysis has identified a structural bottleneck that is likely constraining growth, margins, or operational efficiency. Until this is resolved, tactical improvements will yield diminishing returns.`;
  }

  // ── Trapped Value: what's locked in the current structure ──
  let trappedValue: string | null = null;
  let unlockPotential: string | null = null;
  let trappedValueEvidenceCount = 0;
  let trappedValueEstimate: string | null = null;
  let trappedValueBenchmark: string | null = null;

  if (topConstraint) {
    const costEvidence = flatEvidence.filter(e =>
      e.type === "constraint" || e.type === "friction" || e.type === "risk"
    );
    trappedValueEvidenceCount = costEvidence.length + topConstraint.evidenceIds.length;

    const quantEvidence = flatEvidence.filter(e => {
      const text = `${e.label} ${e.description}`;
      return /(\$[\d,.]+|[\d,.]+%|\d+\s*(days?|months?|weeks?|hours?|units?|customers?))/i.test(text);
    });

    if (quantEvidence.length > 0) {
      const bestQuant = quantEvidence.sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))[0];
      trappedValue = trimAt(bestQuant.description || bestQuant.label, 200);
      if (topDriver) {
        trappedValue += `. Root cause: ${trimAt(topDriver.label, 80).toLowerCase()}`;
      }
      // Extract numeric estimate from evidence
      const numMatch = `${bestQuant.label} ${bestQuant.description}`.match(/(\$[\d,.]+[KMB]?|\d+[\d,.]*%|\d+\s*(days?|months?|weeks?))/i);
      if (numMatch) {
        trappedValueEstimate = numMatch[0];
      }
    } else {
      // AI-estimated value based on constraint severity
      const severityMultiplier = topConstraint.impact >= 7 ? "significant" : topConstraint.impact >= 5 ? "moderate" : "measurable";
      trappedValue = `${severityMultiplier.charAt(0).toUpperCase() + severityMultiplier.slice(1)} economic impact from ${trimAt(topConstraint.label, 100).toLowerCase()}`;
      if (topDriver) {
        trappedValue += `, driven by ${trimAt(topDriver.label, 80).toLowerCase()}`;
      }
      trappedValueEstimate = estimateTrappedValue(topConstraint, flatEvidence);
    }

    // Contextual benchmark
    trappedValueBenchmark = deriveTrappedValueBenchmark(flatEvidence, topConstraint);

    if (topLeverage && topOpp) {
      unlockPotential = `Addressing ${trimAt(topLeverage.label, 80).toLowerCase()} could unlock: ${trimAt(topOpp.label, 100)}`;
    } else if (topOpp) {
      unlockPotential = `Resolving this bottleneck could enable: ${trimAt(topOpp.label, 100)}`;
    }
  }

  // ── Kill Question: the single falsifiable test ──
  let killQuestion: string | null = null;
  let validationExperiment: string | null = null;
  let validationTimeframe = "30 days";
  let validationSteps: ValidationStep[] = [];

  if (topOpp && topConstraint) {
    const constraintPhrase = trimAt(topConstraint.label, 150).toLowerCase();
    const oppPhrase = trimAt(topOpp.label, 150);
    const driverPhrase = topDriver ? trimAt(topDriver.label, 120).toLowerCase() : null;

    killQuestion = `Can ${oppPhrase.toLowerCase()} actually overcome ${constraintPhrase}, or is this constraint structural and immovable?`;

    const targetSegment = driverPhrase
      ? `Focus on the segment most affected by ${driverPhrase}.`
      : `Identify the 5-10 customers or stakeholders most constrained by ${constraintPhrase}.`;

    validationExperiment = `${targetSegment} Present the concept of ${oppPhrase.toLowerCase()} as a concrete alternative. Measure: (1) willingness to pay or switch, (2) specific objections, (3) whether they've tried alternatives. If fewer than 30% show strong interest, the opportunity thesis needs rethinking.`;

    if (verdictConfidence >= 0.5) validationTimeframe = "2 weeks";
    else if (verdictConfidence >= 0.3) validationTimeframe = "30 days";
    else validationTimeframe = "60 days";

    // Concrete next validation steps
    validationSteps = buildValidationSteps(constraintPhrase, oppPhrase, driverPhrase, validationTimeframe);
  }

  // ── Executive Summary: one paragraph, 30-second CEO brief ──
  let executiveSummary: string | null = null;
  if (topConstraint || topOpp) {
    const constraintText = topConstraint ? trimAt(topConstraint.label, 120).toLowerCase() : null;
    const oppText = topOpp ? trimAt(topOpp.label, 120).toLowerCase() : null;
    const leverageText = topLeverage ? trimAt(topLeverage.label, 100).toLowerCase() : null;
    const driverText = topDriver ? trimAt(topDriver.label, 100).toLowerCase() : null;
    const evTotal = flatEvidence.length;
    const conCount = constraints.length;
    const oppCount = opportunities.length;

    const confLabel = verdictConfidence >= 0.7 ? "high" : verdictConfidence >= 0.4 ? "moderate" : "early";

    const sentences: string[] = [];

    // Sentence 1: The core finding
    if (constraintText && oppText) {
      sentences.push(`This analysis identified ${constraintText} as the primary structural bottleneck, with ${oppText} as the highest-leverage opportunity to resolve it.`);
    } else if (constraintText) {
      sentences.push(`The analysis identified ${constraintText} as the dominant structural bottleneck limiting growth and margin.`);
    } else if (oppText) {
      sentences.push(`The analysis surfaced ${oppText} as the primary strategic opportunity.`);
    }

    // Sentence 2: The mechanism / driver
    if (driverText && driverText !== constraintText) {
      sentences.push(`The root cause is ${driverText}${leverageText ? `, and the critical intervention point is ${leverageText}` : ""}.`);
    } else if (leverageText) {
      sentences.push(`The recommended intervention point is ${leverageText}.`);
    }

    // Sentence 3: Scale and confidence
    if (conCount > 1 || oppCount > 1) {
      sentences.push(`Across ${evTotal} evidence signals, the engine detected ${conCount} constraint${conCount !== 1 ? "s" : ""} and ${oppCount} opportunity path${oppCount !== 1 ? "s" : ""} (${confLabel} confidence).`);
    } else {
      sentences.push(`Based on ${evTotal} evidence signals at ${confLabel} confidence.`);
    }

    // Sentence 4: The action implication
    if (killQuestion) {
      const shortKill = trimAt(killQuestion, 120);
      sentences.push(`The critical question to validate before acting: ${shortKill.charAt(0).toLowerCase() + shortKill.slice(1)}`);
    }

    executiveSummary = sentences.join(" ");
  }

  return {
    primaryConstraint: h(topConstraint?.label) ?? null,
    keyDriver: h(topDriver?.label) ?? null,
    leveragePoint: h(topLeverage?.label) ?? null,
    breakthroughOpportunity: h(topOpp?.label) ?? null,
    strategicPathway: h(topPathway?.label) ?? null,
    narrativeSummary: parts.join(" "),
    strategicVerdict,
    verdictRationale,
    verdictConfidence,
    whyThisMatters,
    trappedValue,
    unlockPotential,
    trappedValueEstimate,
    trappedValueBenchmark,
    trappedValueEvidenceCount,
    killQuestion,
    validationExperiment,
    validationTimeframe,
    validationSteps,
    verdictBenchmark,
    executiveSummary,
  };
}

// ── Validation Step Builder ──
export interface ValidationStep {
  step: number;
  action: string;
  metric: string;
  timeframe: string;
}

function buildValidationSteps(
  constraint: string, opportunity: string, driver: string | null, overallTimeframe: string,
): ValidationStep[] {
  return [
    {
      step: 1,
      action: `Map the current state: Document exactly how ${constraint} manifests in daily operations. Quantify the cost (time, money, missed deals).`,
      metric: "Baseline cost/time documented",
      timeframe: "Days 1-3",
    },
    {
      step: 2,
      action: `Identify 5-10 customers or stakeholders most affected by ${constraint}. ${driver ? `Prioritize those impacted by ${driver}.` : "Prioritize by revenue impact."}`,
      metric: "Target list with contact info",
      timeframe: "Days 3-5",
    },
    {
      step: 3,
      action: `Run structured interviews: Present ${opportunity} as a concrete alternative. Ask: Would you pay for this? What objections do you have? Have you tried alternatives?`,
      metric: "≥30% show strong interest (go/no-go gate)",
      timeframe: "Days 5-14",
    },
    {
      step: 4,
      action: `Build a minimum viable proof: Create the smallest possible demonstration of ${opportunity} that addresses the top objection from Step 3.`,
      metric: "Working prototype or mockup reviewed by 3+ prospects",
      timeframe: `Days 14-${overallTimeframe === "2 weeks" ? "14" : "21"}`,
    },
    {
      step: 5,
      action: `Decision gate: Review interview data, prototype feedback, and baseline costs. Decide: commit, pivot, or kill the strategy.`,
      metric: "Go/no-go decision with documented reasoning",
      timeframe: `Day ${overallTimeframe === "2 weeks" ? "14" : "30"}`,
    },
  ];
}

// ── AI-estimated trapped value ──
function estimateTrappedValue(constraint: StrategicInsight, evidence: Evidence[]): string {
  // Derive estimate from constraint severity and evidence patterns
  const frictionCount = evidence.filter(e => e.type === "friction" || e.type === "constraint").length;
  const costCount = evidence.filter(e => (e.description?.match(/cost|expense|spend|waste/i))).length;

  if (constraint.impact >= 8 && frictionCount >= 5) return "Est. 15-30% of revenue at risk";
  if (constraint.impact >= 6 && frictionCount >= 3) return "Est. 10-20% margin opportunity";
  if (constraint.impact >= 5 && costCount >= 2) return "Est. 5-15% efficiency gain";
  if (constraint.impact >= 4) return "Est. measurable but unquantified impact";
  return "Impact requires deeper analysis";
}

// ── Contextual benchmarks ──
function deriveVerdictBenchmark(evidence: Evidence[], constraint: StrategicInsight, opportunity: StrategicInsight): string | null {
  const text = `${constraint.label} ${constraint.description} ${opportunity.label} ${opportunity.description}`.toLowerCase();

  if (text.match(/custom|bespoke|tailored|hand-?craft/)) {
    return "Industry trend: Companies shifting from custom to productized see 2-4x gross margin improvement (McKinsey, 2024)";
  }
  if (text.match(/manual|labor|hand|workforce/)) {
    return "Benchmark: Process-heavy businesses operate at 3-5x the output per employee vs. labor-heavy competitors";
  }
  if (text.match(/subscription|recurring|saas|retention/)) {
    return "Benchmark: Recurring revenue models trade at 6-12x revenue multiples vs. 1-3x for transactional";
  }
  if (text.match(/channel|distribution|partner|resell/)) {
    return "Industry data: Channel distribution reduces customer acquisition cost by 40-60% at scale";
  }
  if (text.match(/vertical|niche|speciali[sz]/)) {
    return "Pattern: Vertical specialists command 20-40% price premiums over horizontal generalists";
  }
  if (text.match(/capital|asset|capex|equipment/)) {
    return "Benchmark: Asset-light models generate 2-5x return on invested capital vs. capital-heavy peers";
  }
  if (text.match(/pricing|price|margin|cost/)) {
    return "Industry median: Top-quartile pricing optimization yields 8-15% margin expansion";
  }
  return null;
}

function deriveTrappedValueBenchmark(evidence: Evidence[], constraint: StrategicInsight): string | null {
  const text = `${constraint.label} ${constraint.description}`.toLowerCase();

  if (text.match(/cycle|lead\s*time|delivery|turnaround/)) {
    return "Industry median lead time: Companies in top quartile are 3-5x faster";
  }
  if (text.match(/churn|retention|lifetime/)) {
    return "Benchmark: Reducing churn by 5% increases lifetime value by 25-95%";
  }
  if (text.match(/conversion|funnel|acquisition/)) {
    return "Industry average: Top performers convert at 2-3x the median rate";
  }
  if (text.match(/inventory|stock|warehouse/)) {
    return "Benchmark: Best-in-class inventory turns are 2-4x the industry average";
  }
  if (text.match(/scale|growth|capacity/)) {
    return "Pattern: Scalable businesses grow revenue 3-5x faster than cost base";
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN ENTRY POINT — runStrategicAnalysis
// ═══════════════════════════════════════════════════════════════

export function runStrategicAnalysis(input: StrategicAnalysisInput): StrategicAnalysisOutput {
  // Run-scoped ID factory — all IDs valid only within this execution
  const runFactory = createRunIdFactory();
  activeRunFactory = runFactory;
  idCounter = 0;
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

  // ── Build threshold status ──
  const thresholds = [
    { stage: "Signals", required: THRESHOLDS.signals, current: evCount, met: evCount >= THRESHOLDS.signals },
    { stage: "Constraints", required: THRESHOLDS.constraints, current: evCount, met: evCount >= THRESHOLDS.constraints },
    { stage: "Drivers", required: THRESHOLDS.drivers, current: evCount, met: evCount >= THRESHOLDS.drivers },
    { stage: "Leverage", required: THRESHOLDS.leverage, current: evCount, met: evCount >= THRESHOLDS.leverage },
    { stage: "Opportunities", required: THRESHOLDS.opportunities, current: evCount, met: evCount >= THRESHOLDS.opportunities },
    { stage: "Pathways", required: THRESHOLDS.pathways, current: evCount, met: evCount >= THRESHOLDS.pathways },
  ];

  // ── Stage 3: Form Signals ──
  let signals: StrategicSignal[] = [];
  if (evCount >= THRESHOLDS.signals) {
    const { result: sigs, stage: s3 } = traceStage("Signal Formation", flat.length, () =>
      formSignals(flat, input.analysisId)
    );
    stages.push(s3);
    signals = sigs;
    events.push(`${signals.length} signals formed`);
  } else {
    events.push(`Signals: need ${THRESHOLDS.signals} evidence (have ${evCount})`);
  }

  // ── Stage 3b: Facet Population (cached for downstream reuse) ──
  let facetedEvidence: Evidence[] = flat;
  if (evCount >= THRESHOLDS.constraints) {
    const { result: faceted, stage: s3b } = traceStage("Facet Population", flat.length, () =>
      populateFacets(flat)
    );
    stages.push(s3b);
    facetedEvidence = faceted;
    events.push(`Facets populated on ${faceted.filter((e: any) => e.facets).length}/${faceted.length} evidence items`);
  }

  // ── Stage 4: Detect Constraints (legacy signal-based) ──
  let legacyConstraints: StrategicInsight[] = [];
  if (evCount >= THRESHOLDS.constraints && signals.length >= 2) {
    const { result: cons, stage: s4 } = traceStage("Constraint Detection", signals.length, () =>
      detectConstraints(signals, flat, input.analysisId)
    );
    stages.push(s4);
    legacyConstraints = cons;
    events.push(`${legacyConstraints.length} legacy constraints detected`);
  } else {
    events.push(`Constraints: need ${THRESHOLDS.constraints} evidence + 2 signals (have ${evCount}ev, ${signals.length}sig)`);
  }

  // ── Stage 4b: Constraint Hypothesis Detection (Phase 1 — facet-based) ──
  let constraintHypotheses: ConstraintHypothesisSet | null = null;
  if (evCount >= THRESHOLDS.constraints) {
    const { result: hypotheses, stage: s4b } = traceStage("Constraint Hypotheses", facetedEvidence.length, () =>
      detectConstraintHypotheses(facetedEvidence)
    );
    stages.push(s4b);
    constraintHypotheses = hypotheses;
    events.push(`${hypotheses.hypotheses.length} constraint hypotheses (${hypotheses.totalCandidates} candidates, ${hypotheses.evidenceGaps.length} gaps, ${hypotheses.evidenceRequests.length} requests)`);
  }

  // ── Compose activeConstraints: legacy + strong/moderate hypotheses (ID-based dedup) ──
  const activeConstraints: StrategicInsight[] = [...legacyConstraints];
  if (constraintHypotheses) {
    const existingConstraintIds = new Set<string>();
    // Extract constraintIds from legacy constraints (stored in description meta)
    for (const lc of legacyConstraints) {
      const idMatch = lc.description.match(/\[(C-[A-Z]+-\d+):/);
      if (idMatch) existingConstraintIds.add(idMatch[1]);
    }

    for (const hyp of constraintHypotheses.hypotheses) {
      // Skip if already covered by a legacy constraint with same stable ID
      if (existingConstraintIds.has(hyp.constraintId)) continue;
      // Only promote strong and moderate hypotheses; limited stay advisory-only
      if (hyp.confidence === "limited") continue;

      activeConstraints.push(makeInsight({
        id: nextId("constraint-hyp"),
        analysisId: input.analysisId,
        insightType: "constraint_cluster",
        label: hyp.definition.description,
        description: `${hyp.explanation} [${hyp.constraintId}: ${hyp.constraintName}, confidence: ${hyp.confidence}]`,
        evidenceIds: hyp.evidenceIds,
        relatedInsightIds: [],
        impact: hyp.tier === 1 ? 8 : hyp.tier === 2 ? 6 : 4,
        confidence: hyp.confidence === "strong" ? 0.8 : 0.6,
        createdAt: Date.now(),
      }));
    }
  }
  // Use activeConstraints for all downstream stages
  const constraints = activeConstraints;

  // ── Stage 4c: Constraint Interaction Discovery ──
  let constraintInteractions: ConstraintInteractionSet | null = null;
  if (constraints.length >= 2) {
    const { result: interactions, stage: s4c } = traceStage("Constraint Interactions", constraints.length, () =>
      discoverConstraintInteractions(constraints, constraintHypotheses)
    );
    stages.push(s4c);
    constraintInteractions = interactions;
    events.push(`${interactions.interactions.length} constraint interactions found (${interactions.pairsEvaluated} pairs evaluated)${interactions.hasReinforcingLoops ? " — reinforcing loops detected" : ""}`);
  }

  // ── Stage 5: Constraint Severity Scoring ──
  let severityReport: SeverityReport | null = null;
  if (constraints.length > 0) {
    const { result: severity, stage: s5sev } = traceStage("Severity Scoring", constraints.length, () =>
      scoreConstraintSeverity(constraints, signals, flat, constraintInteractions)
    );
    stages.push(s5sev);
    severityReport = severity;
    if (severity.primaryBottleneck) {
      events.push(`Primary bottleneck: ${severity.primaryBottleneck.constraintLabel} (${severity.primaryBottleneck.severityLabel} severity)`);
    }
    events.push(`Average constraint severity: ${severity.averageSeverity}`);
  }

  // ── Stage 6: Identify Drivers ──
  let drivers: StrategicInsight[] = [];
  if (evCount >= THRESHOLDS.drivers && constraints.length > 0) {
    const { result: drvs, stage: s6drv } = traceStage("Driver Identification", constraints.length, () =>
      identifyDrivers(signals, constraints, flat, input.analysisId)
    );
    stages.push(s6drv);
    drivers = drvs;
    events.push(`${drivers.length} drivers identified`);
  } else {
    events.push(`Drivers: need ${THRESHOLDS.drivers} evidence + constraints`);
  }

  // ── Stage 7: Discover Leverage ──
  let leveragePoints: StrategicInsight[] = [];
  if (evCount >= THRESHOLDS.leverage && (constraints.length > 0 || drivers.length > 0)) {
    const { result: levs, stage: s7lev } = traceStage("Leverage Discovery", constraints.length + drivers.length, () =>
      discoverLeverage(signals, constraints, drivers, flat, input.analysisId)
    );
    stages.push(s7lev);
    leveragePoints = levs;
    events.push(`${leveragePoints.length} leverage points discovered`);
  } else {
    events.push(`Leverage: need ${THRESHOLDS.leverage} evidence + constraints/drivers`);
  }

  // ── Stage 8: Generate Opportunities (Pattern Library + Morphological Search or Fallback) ──
  let opportunities: StrategicInsight[] = [];
  if (evCount >= THRESHOLDS.opportunities && leveragePoints.length > 0) {
    const { result: opps, stage: s8opp } = traceStage("Opportunity Generation", leveragePoints.length, () => {
      if (input.aiAlternatives && input.aiAlternatives.length > 0) {
        const searchResult = runMorphologicalSearch(
          flat, constraints, leveragePoints, input.aiAlternatives
        );

        if (searchResult.vectors.length > 0) {
          events.push(`${searchResult.patternVectorCount} pattern vectors + ${searchResult.vectors.length - searchResult.patternVectorCount} morphological vectors`);
          return generateOpportunitiesFromVectors(
            searchResult.vectors,
            searchResult.zones,
            searchResult.baseline,
            constraints,
            leveragePoints,
            input.analysisId,
          );
        }
      }

      return generateOpportunitiesFallback(leveragePoints, constraints, input.analysisId);
    });
    stages.push(s8opp);
    opportunities = opps;
    events.push(`${opportunities.length} opportunities generated${input.aiAlternatives?.length ? " (morphological+patterns)" : " (fallback)"}`);
  } else {
    events.push(`Opportunities: need ${THRESHOLDS.opportunities} evidence + leverage`);
  }

  // ── Graceful Degradation: Never return zero opportunities ──
  if (opportunities.length === 0 && signals.length > 0) {
    const exploratory = generateExploratoryOpportunities(signals, flat, input.analysisId);
    opportunities = exploratory;
    events.push(`${exploratory.length} exploratory opportunities generated (graceful degradation)`);
  }

  // ── Stage 9: Viability Scoring ──
  let viabilityReport: ViabilityReport | null = null;
  if (opportunities.length > 0) {
    const sevScores = severityReport?.scores ?? [];
    const { result: viability, stage: s9v } = traceStage("Viability Scoring", opportunities.length, () =>
      scoreViability(opportunities, constraints, flat, sevScores)
    );
    stages.push(s9v);
    viabilityReport = viability;
    events.push(`${viability.viableCount} viable + ${viability.exploratoryCount} exploratory opportunities`);
  }

  // ── Stage 10: Strategic Pathways ──
  let pathways: StrategicInsight[] = [];
  if (evCount >= THRESHOLDS.pathways && constraints.length > 0 && opportunities.length > 0) {
    const { result: paths, stage: s10p } = traceStage("Pathway Construction", constraints.length + opportunities.length, () =>
      constructStrategicPathways(constraints, drivers, leveragePoints, opportunities, input.analysisId)
    );
    stages.push(s10p);
    pathways = paths;
    events.push(`${pathways.length} strategic pathways constructed`);
  } else {
    events.push(`Pathways: need ${THRESHOLDS.pathways} evidence + constraints + opportunities`);
  }

  // ── Stage 11: Strategic Narrative ──
  const narrative = buildStrategicNarrative(constraints, drivers, leveragePoints, opportunities, pathways, flat);

  // ── Combine all insights ──
  const allInsights: StrategicInsight[] = [
    ...constraints,
    ...drivers,
    ...leveragePoints,
    ...opportunities,
    ...pathways,
  ];

  // ── Stage 12: Build Insight Graph ──
  const insightsForGraph = allInsights.map(i => ({
    id: i.id,
    label: i.label,
    description: i.description,
    insightType: i.insightType,
    impact: i.impact,
    confidenceScore: i.confidence,
    evidenceIds: i.evidenceIds,
    recommendedTools: [] as string[],
  }));

  const signalInsightsForGraph = signals.map(s => ({
    id: s.id,
    label: s.label,
    description: s.description,
    insightType: "pattern" as const,
    impact: Math.round(s.strength),
    confidenceScore: s.confidence,
    evidenceIds: s.evidenceIds,
    recommendedTools: [] as string[],
  }));

  const scenarios = getScenarios(input.analysisId);
  const scenarioComparison = scenarios.length > 0 ? compareScenarios(scenarios) : null;
  const sensitivityReports = computeAllSensitivityReports(scenarios);

  const { result: graph, stage: sg } = traceStage("Graph Construction", flat.length + allInsights.length, () =>
    buildInsightGraph(
      flat, undefined, undefined, undefined, undefined,
      [...signalInsightsForGraph, ...insightsForGraph].length > 0
        ? [...signalInsightsForGraph, ...insightsForGraph]
        : undefined,
      scenarioComparison?.scenarios,
    )
  );
  stages.push(sg);

  // ── Inject generated opportunities into evidence for metrics ──
  // Strategic insights (opportunities, leverage) aren't in the raw evidence,
  // so we inject them so the metrics layer can aggregate them.
  for (const opp of opportunities) {
    const vectorData = opp.opportunityVectorData;
    const sourceEngine: string = vectorData?.explorationMode === "constraint"
      ? "morphological_constraint"
      : vectorData?.explorationMode === "adjacency"
        ? "morphological_adjacency"
        : input.aiAlternatives?.length
          ? "morphological"
          : "pipeline";
    
    evidence.opportunity.items.push({
      id: opp.id,
      type: "opportunity" as any,
      label: opp.label,
      description: opp.description,
      pipelineStep: "disrupt" as any,
      tier: "structural" as any,
      impact: opp.impact,
      confidenceScore: opp.confidence,
      sourceEngine: sourceEngine as any,
    });
  }

  // ── Stage 13: Command Deck Metrics ──
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

  // ── Build diagnostic ──
  const insufficientEvidence = evCount < THRESHOLDS.signals;
  let message: string | null = null;
  if (insufficientEvidence) {
    message = `Not enough evidence for signal formation. Need ${THRESHOLDS.signals}, have ${evCount}.`;
  } else if (signals.length === 0) {
    message = "Evidence collected but no coherent signals could be formed. Add more structured inputs.";
  } else if (constraints.length === 0 && evCount < THRESHOLDS.constraints) {
    message = `Signals formed but need ${THRESHOLDS.constraints} evidence for constraint detection (have ${evCount}).`;
  }

  const diagnostic: StrategicDiagnostic = {
    evidenceCount: evCount,
    signalCount: signals.length,
    constraintCount: constraints.length,
    driverCount: drivers.length,
    leverageCount: leveragePoints.length,
    opportunityCount: opportunities.length,
    pathwayCount: pathways.length,
    insufficientEvidence,
    message,
    thresholds,
  };

  buildDiagnostic(stages, graph.nodes, flat.length, allInsights.length, scenarios.length);

  events.push("Strategic intelligence computed");

  // ── Market Structure Analysis ──
  let marketStructure: MarketStructureReport | null = null;
  if (flat.length >= THRESHOLDS.constraints) {
    const { result: mktResult, stage: sMkt } = traceStage("Market Structure", flat.length, () =>
      analyzeMarketStructure(flat, input.analysisId, (prefix) => runFactory.next(prefix))
    );
    stages.push(sMkt);
    marketStructure = mktResult;

    // Merge market-level insights into the pipeline
    if (mktResult.constraints.length > 0) {
      allInsights.push(...mktResult.constraints, ...mktResult.drivers, ...mktResult.opportunities);
      events.push(`Market structure: ${mktResult.patterns.length} patterns, ${mktResult.archetypes.length} archetypes, ${mktResult.constraints.length} market constraints`);
    }
  }

  // Clean up run factory
  activeRunFactory = null;

  return {
    evidence,
    flatEvidence: flat,
    signals,
    insights: allInsights,
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
    legacyConstraints,
    activeConstraints,
    constraintInteractions,
    severityReport,
    viabilityReport,
    marketStructure,
  };
}
