/**
 * STRATEGIC ENGINE — Single Intelligence Pipeline
 *
 * Pipeline (sequential):
 *   1. collectEvidence — Extract canonical evidence from all pipeline steps
 *   2. normalizeEvidence — Deduplicate, classify, assign scores
 *   3. formSignals — Cluster evidence into interpretable signals (NEW)
 *   4. detectConstraints — Structural barriers revealed by signals
 *   5. identifyDrivers — Root causes behind constraints
 *   6. calculateLeveragePoints — Structural intervention opportunities
 *   7. generateOpportunities — Derived from leverage points
 *   8. constructStrategicPathways — constraint → driver → leverage → opportunity
 *   9. generateStrategicNarrative — Reasoning chain summary
 *   10. buildInsightGraph — Graph nodes from real insights only
 *   11. calculateCommandDeckMetrics — Dashboard metrics
 *
 * Progressive thresholds:
 *   5 evidence → signals
 *   10 evidence → constraints
 *   14 evidence → drivers
 *   18 evidence → leverage
 *   22 evidence → opportunities
 *   26 evidence → pathways
 *
 * NO FALLBACK/SYNTHETIC INSIGHTS.
 */

import {
  extractAllEvidence,
  flattenEvidence,
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

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type StrategicInsightType =
  | "constraint_cluster"
  | "driver"
  | "leverage_point"
  | "emerging_opportunity"
  | "strategic_pathway";

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
function nextId(prefix: string): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Humanize internal labels — strip ID prefixes, code artifacts, and jargon.
 * Applied to all user-facing insight labels system-wide.
 */
function humanize(text: string): string {
  if (!text) return text;
  return text
    // Strip constraint ID prefixes like "C1: ", "F_1: ", "C2: "
    .replace(/^[A-Z]_?\d+\s*[:\.]\s*/i, "")
    // Strip "Binding Constraint: " prefix
    .replace(/^Binding Constraint\s*[:\.]\s*/i, "")
    // Strip "Counterfactual: " prefix
    .replace(/^Counterfactual\s*[:\.]\s*/i, "")
    // Strip "(+N related)" suffixes
    .replace(/\s*\(\+\d+ related\)$/i, "")
    // Convert snake_case to Title Case
    .replace(/_/g, " ")
    // Clean up double spaces
    .replace(/\s{2,}/g, " ")
    .trim();
}

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
        if (jaccard(anchor.label, candidate.label) >= 0.25) {
          cluster.push(candidate);
          used.add(candidate.id);
        }
      }

      if (cluster.length < 2) continue;

      // Derive signal label from highest-impact evidence
      const sorted = [...cluster].sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0));
      const primary = sorted[0];
      const categoryLabel = category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

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
      const categoryLabel = category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

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
        const conText = humanize(constraint.label).slice(0, 40);
        const drvText = humanize(driver.label).slice(0, 40);
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
    const label = `${gs.category.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} opportunity: ${humanize(gs.label.replace(/^[^:]+:\s*/, "")).slice(0, 45)}`;
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

function generateOpportunities(
  leveragePoints: StrategicInsight[],
  constraints: StrategicInsight[],
  analysisId: string,
): StrategicInsight[] {
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  // Opportunities from leverage points
  for (const lev of leveragePoints) {
    const relatedConstraints = constraints.filter(c => lev.relatedInsightIds.includes(c.id));
    const con = relatedConstraints[0];

    const conText = con ? humanize(con.label).slice(0, 55) : "";
    const levText = humanize(lev.label).slice(0, 55);
    // Lowercase the first char when embedding in a sentence
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
        ? `Addressing "${humanize(con.label)}" through "${humanize(lev.label)}" opens a clear path to strategic value.`
        : `"${humanize(lev.label)}" represents an emerging strategic opportunity worth pursuing.`,
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
      const cut = clean.lastIndexOf(" ", max);
      return clean.slice(0, cut > max * 0.4 ? cut : max) + "…";
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
): StrategicNarrative {
  const topConstraint = [...constraints].sort((a, b) => b.impact - a.impact)[0] ?? null;
  const topDriver = [...drivers].sort((a, b) => b.impact - a.impact)[0] ?? null;
  const topLeverage = [...leveragePoints].sort((a, b) => b.impact - a.impact)[0] ?? null;
  const topOpp = [...opportunities].sort((a, b) => b.impact - a.impact)[0] ?? null;
  const topPathway = [...pathways].sort((a, b) => b.impact - a.impact)[0] ?? null;

  const h = (s: string | null | undefined) => s ? humanize(s) : null;

  /** Truncate at word boundary */
  function trimAt(s: string | null | undefined, max: number): string {
    if (!s) return "";
    const clean = humanize(s);
    if (clean.length <= max) return clean;
    const cut = clean.lastIndexOf(" ", max);
    return clean.slice(0, cut > max * 0.5 ? cut : max) + "…";
  }

  // Build a readable narrative — no raw labels, no truncation artifacts
  const parts: string[] = [];
  if (topConstraint) parts.push(`The primary constraint is ${trimAt(topConstraint.label, 120)}.`);
  if (topDriver) parts.push(`This is driven by: ${trimAt(topDriver.label, 100)}.`);
  if (topLeverage) parts.push(`A key intervention point exists: ${trimAt(topLeverage.label, 100)}.`);
  if (topOpp) parts.push(`This opens the opportunity to ${trimAt(topOpp.label, 100).toLowerCase()}.`);

  if (parts.length === 0) {
    parts.push("Insufficient evidence to generate a complete strategic narrative. Add more inputs to pipeline steps.");
  }

  return {
    primaryConstraint: h(topConstraint?.label) ?? null,
    keyDriver: h(topDriver?.label) ?? null,
    leveragePoint: h(topLeverage?.label) ?? null,
    breakthroughOpportunity: h(topOpp?.label) ?? null,
    strategicPathway: h(topPathway?.label) ?? null,
    narrativeSummary: parts.join(" "),
  };
}

// ═══════════════════════════════════════════════════════════════
//  MAIN ENTRY POINT — runStrategicAnalysis
// ═══════════════════════════════════════════════════════════════

export function runStrategicAnalysis(input: StrategicAnalysisInput): StrategicAnalysisOutput {
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

  // ── Stage 4: Detect Constraints ──
  let constraints: StrategicInsight[] = [];
  if (evCount >= THRESHOLDS.constraints && signals.length >= 2) {
    const { result: cons, stage: s4 } = traceStage("Constraint Detection", signals.length, () =>
      detectConstraints(signals, flat, input.analysisId)
    );
    stages.push(s4);
    constraints = cons;
    events.push(`${constraints.length} constraints detected`);
  } else {
    events.push(`Constraints: need ${THRESHOLDS.constraints} evidence + 2 signals (have ${evCount}ev, ${signals.length}sig)`);
  }

  // ── Stage 5: Identify Drivers ──
  let drivers: StrategicInsight[] = [];
  if (evCount >= THRESHOLDS.drivers && constraints.length > 0) {
    const { result: drvs, stage: s5 } = traceStage("Driver Identification", constraints.length, () =>
      identifyDrivers(signals, constraints, flat, input.analysisId)
    );
    stages.push(s5);
    drivers = drvs;
    events.push(`${drivers.length} drivers identified`);
  } else {
    events.push(`Drivers: need ${THRESHOLDS.drivers} evidence + constraints`);
  }

  // ── Stage 6: Discover Leverage ──
  let leveragePoints: StrategicInsight[] = [];
  if (evCount >= THRESHOLDS.leverage && (constraints.length > 0 || drivers.length > 0)) {
    const { result: levs, stage: s6 } = traceStage("Leverage Discovery", constraints.length + drivers.length, () =>
      discoverLeverage(signals, constraints, drivers, flat, input.analysisId)
    );
    stages.push(s6);
    leveragePoints = levs;
    events.push(`${leveragePoints.length} leverage points discovered`);
  } else {
    events.push(`Leverage: need ${THRESHOLDS.leverage} evidence + constraints/drivers`);
  }

  // ── Stage 7: Generate Opportunities ──
  let opportunities: StrategicInsight[] = [];
  if (evCount >= THRESHOLDS.opportunities && leveragePoints.length > 0) {
    const { result: opps, stage: s7 } = traceStage("Opportunity Generation", leveragePoints.length, () =>
      generateOpportunities(leveragePoints, constraints, input.analysisId)
    );
    stages.push(s7);
    opportunities = opps;
    events.push(`${opportunities.length} opportunities generated`);
  } else {
    events.push(`Opportunities: need ${THRESHOLDS.opportunities} evidence + leverage`);
  }

  // ── Stage 8: Strategic Pathways ──
  let pathways: StrategicInsight[] = [];
  if (evCount >= THRESHOLDS.pathways && constraints.length > 0 && opportunities.length > 0) {
    const { result: paths, stage: s8 } = traceStage("Pathway Construction", constraints.length + opportunities.length, () =>
      constructStrategicPathways(constraints, drivers, leveragePoints, opportunities, input.analysisId)
    );
    stages.push(s8);
    pathways = paths;
    events.push(`${pathways.length} strategic pathways constructed`);
  } else {
    events.push(`Pathways: need ${THRESHOLDS.pathways} evidence + constraints + opportunities`);
  }

  // ── Stage 9: Strategic Narrative ──
  const narrative = buildStrategicNarrative(constraints, drivers, leveragePoints, opportunities, pathways);

  // ── Combine all insights ──
  const allInsights: StrategicInsight[] = [
    ...constraints,
    ...drivers,
    ...leveragePoints,
    ...opportunities,
    ...pathways,
  ];

  // ── Stage 10: Build Insight Graph ──
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

  // Also add signals as graph-compatible insight nodes
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

  // ── Stage 11: Command Deck Metrics ──
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
  };
}
