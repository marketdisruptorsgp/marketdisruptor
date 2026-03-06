/**
 * STRATEGIC ENGINE — Single Intelligence Pipeline
 *
 * This is the ONLY entry point for generating strategic insights.
 * No other component may generate insights.
 *
 * Pipeline stages (sequential):
 *   1. collectEvidence — Extract canonical evidence from all pipeline steps
 *   2. detectConstraints — Identify constraint clusters from evidence
 *   3. identifyDrivers — Find key drivers from evidence patterns
 *   4. calculateLeveragePoints — Compute leverage from constraint-driver intersections
 *   5. generateOpportunities — Derive opportunities from leverage + constraints
 *   6. constructStrategicPathways — Build pathways connecting constraints → opportunities
 *   7. generateStrategicNarrative — Produce the reasoning chain summary
 *   8. buildInsightGraph — Generate graph nodes and edges from real insights
 *   9. calculateCommandDeckMetrics — Compute all dashboard metrics
 *
 * NO FALLBACK/SYNTHETIC INSIGHTS. If evidence is insufficient,
 * returns diagnostic message instead.
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
//  TYPES — Canonical Insight Schema
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
  constraintCount: number;
  driverCount: number;
  leverageCount: number;
  opportunityCount: number;
  pathwayCount: number;
  insufficientEvidence: boolean;
  message: string | null;
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
//  HELPERS
// ═══════════════════════════════════════════════════════════════

let insightIdCounter = 0;
function nextInsightId(prefix: string): string {
  return `${prefix}-${++insightIdCounter}`;
}

function jaccardSimilarity(a: string, b: string): number {
  const tokA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(t => t.length > 2));
  const tokB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(t => t.length > 2));
  if (tokA.size === 0 && tokB.size === 0) return 0;
  let inter = 0;
  for (const t of tokA) { if (tokB.has(t)) inter++; }
  return inter / (tokA.size + tokB.size - inter);
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

  // Merge simulation evidence
  const mode = input.analysisType === "service" ? "service" as const
    : input.analysisType === "business_model" ? "business_model" as const
    : "product" as const;
  const simEvidence = allScenariosToEvidence(input.analysisId, mode);
  if (simEvidence.length > 0) {
    flat.push(...simEvidence);
  }

  return { structured, flat };
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 2: DETECT CONSTRAINTS
// ═══════════════════════════════════════════════════════════════

function detectConstraints(flat: Evidence[], analysisId: string): StrategicInsight[] {
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  // Direct constraint evidence
  const constraintEvidence = flat.filter(e => e.type === "constraint" || e.type === "friction");
  
  // Cluster similar constraints
  const used = new Set<string>();
  for (const ev of constraintEvidence) {
    if (used.has(ev.id)) continue;
    const cluster = [ev];
    used.add(ev.id);
    
    for (const candidate of constraintEvidence) {
      if (used.has(candidate.id)) continue;
      if (jaccardSimilarity(ev.label, candidate.label) >= 0.5) {
        cluster.push(candidate);
        used.add(candidate.id);
      }
    }

    const primary = cluster.sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))[0];
    const label = cluster.length > 1
      ? `${primary.label} (+${cluster.length - 1} related)`
      : primary.label;

    insights.push({
      id: nextInsightId("constraint"),
      analysisId,
      insightType: "constraint_cluster",
      label,
      description: primary.description || `Constraint derived from ${cluster.length} evidence signal(s).`,
      evidenceIds: cluster.map(e => e.id),
      relatedInsightIds: [],
      impact: Math.max(...cluster.map(e => e.impact ?? 5)),
      confidence: cluster.reduce((s, e) => s + (e.confidenceScore ?? 0.5), 0) / cluster.length,
      createdAt: now,
    });
  }

  // Risk evidence that indicates structural constraints
  const riskEvidence = flat.filter(e => e.type === "risk" && (e.impact ?? 0) >= 5);
  for (const risk of riskEvidence.slice(0, 3)) {
    if (insights.some(i => jaccardSimilarity(i.label, risk.label) >= 0.5)) continue;
    insights.push({
      id: nextInsightId("constraint"),
      analysisId,
      insightType: "constraint_cluster",
      label: risk.label,
      description: risk.description || `Constraint identified from high-impact risk signal.`,
      evidenceIds: [risk.id],
      relatedInsightIds: [],
      impact: risk.impact ?? 6,
      confidence: risk.confidenceScore ?? 0.5,
      createdAt: now,
    });
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 3: IDENTIFY DRIVERS
// ═══════════════════════════════════════════════════════════════

function identifyDrivers(flat: Evidence[], constraints: StrategicInsight[], analysisId: string): StrategicInsight[] {
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  // Assumptions are key drivers — they underpin constraints
  const assumptions = flat.filter(e => e.type === "assumption");
  
  const used = new Set<string>();
  for (const asm of assumptions) {
    if (used.has(asm.id)) continue;
    const cluster = [asm];
    used.add(asm.id);

    for (const candidate of assumptions) {
      if (used.has(candidate.id)) continue;
      if (jaccardSimilarity(asm.label, candidate.label) >= 0.5) {
        cluster.push(candidate);
        used.add(candidate.id);
      }
    }

    // Find related constraints
    const relatedConstraintIds = constraints
      .filter(c => c.evidenceIds.some(eid => {
        const relatedEv = flat.find(e => e.id === eid);
        return relatedEv && jaccardSimilarity(relatedEv.label, asm.label) >= 0.3;
      }))
      .map(c => c.id);

    const primary = cluster[0];
    insights.push({
      id: nextInsightId("driver"),
      analysisId,
      insightType: "driver",
      label: primary.label,
      description: primary.description || `Key driver underlying ${relatedConstraintIds.length} constraint(s).`,
      evidenceIds: cluster.map(e => e.id),
      relatedInsightIds: relatedConstraintIds,
      impact: Math.max(...cluster.map(e => e.impact ?? 5)),
      confidence: cluster.reduce((s, e) => s + (e.confidenceScore ?? 0.5), 0) / cluster.length,
      createdAt: now,
    });
  }

  // Signals as supplementary drivers
  const signals = flat.filter(e => e.type === "signal" && (e.impact ?? 0) >= 5);
  for (const sig of signals.slice(0, 5)) {
    if (insights.some(i => jaccardSimilarity(i.label, sig.label) >= 0.5)) continue;
    insights.push({
      id: nextInsightId("driver"),
      analysisId,
      insightType: "driver",
      label: sig.label,
      description: sig.description || "Market signal acting as a strategic driver.",
      evidenceIds: [sig.id],
      relatedInsightIds: [],
      impact: sig.impact ?? 5,
      confidence: sig.confidenceScore ?? 0.5,
      createdAt: now,
    });
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 4: CALCULATE LEVERAGE POINTS
// ═══════════════════════════════════════════════════════════════

function calculateLeveragePoints(
  flat: Evidence[],
  constraints: StrategicInsight[],
  drivers: StrategicInsight[],
  analysisId: string,
): StrategicInsight[] {
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  // Direct leverage evidence
  const leverageEvidence = flat.filter(e => e.type === "leverage");
  for (const lev of leverageEvidence) {
    const relatedConstraints = constraints
      .filter(c => c.evidenceIds.some(eid => flat.find(e => e.id === eid)?.tier === lev.tier))
      .map(c => c.id);
    const relatedDrivers = drivers
      .filter(d => d.evidenceIds.some(eid => flat.find(e => e.id === eid)?.tier === lev.tier))
      .map(d => d.id);

    insights.push({
      id: nextInsightId("leverage"),
      analysisId,
      insightType: "leverage_point",
      label: lev.label,
      description: lev.description || `Leverage point connecting ${relatedConstraints.length} constraint(s) and ${relatedDrivers.length} driver(s).`,
      evidenceIds: [lev.id],
      relatedInsightIds: [...relatedConstraints, ...relatedDrivers],
      impact: lev.impact ?? 7,
      confidence: lev.confidenceScore ?? 0.6,
      createdAt: now,
    });
  }

  // Derive leverage from constraint-driver intersections
  for (const constraint of constraints.slice(0, 5)) {
    for (const driver of drivers.slice(0, 5)) {
      // Check if they share evidence or have semantic overlap
      const sharedEvidence = constraint.evidenceIds.filter(id => driver.evidenceIds.includes(id));
      const semanticOverlap = jaccardSimilarity(constraint.label, driver.label) >= 0.3;

      if (sharedEvidence.length > 0 || semanticOverlap) {
        const label = `Resolve "${constraint.label.slice(0, 40)}" via "${driver.label.slice(0, 40)}"`;
        if (insights.some(i => jaccardSimilarity(i.label, label) >= 0.5)) continue;

        insights.push({
          id: nextInsightId("leverage"),
          analysisId,
          insightType: "leverage_point",
          label,
          description: `Addressing constraint through this driver creates a high-leverage intervention point.`,
          evidenceIds: [...new Set([...constraint.evidenceIds, ...driver.evidenceIds])],
          relatedInsightIds: [constraint.id, driver.id],
          impact: Math.round((constraint.impact + driver.impact) / 2),
          confidence: Math.round(((constraint.confidence + driver.confidence) / 2) * 100) / 100,
          createdAt: now,
        });
      }
    }
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 5: GENERATE OPPORTUNITIES
// ═══════════════════════════════════════════════════════════════

function generateOpportunities(
  flat: Evidence[],
  constraints: StrategicInsight[],
  leveragePoints: StrategicInsight[],
  analysisId: string,
): StrategicInsight[] {
  const now = Date.now();
  const insights: StrategicInsight[] = [];

  // Direct opportunity evidence
  const oppEvidence = flat.filter(e => e.type === "opportunity");
  for (const opp of oppEvidence) {
    const relatedLeverage = leveragePoints
      .filter(l => l.evidenceIds.some(eid => flat.find(e => e.id === eid)?.tier === opp.tier))
      .map(l => l.id);

    insights.push({
      id: nextInsightId("opportunity"),
      analysisId,
      insightType: "emerging_opportunity",
      label: opp.label,
      description: opp.description || `Opportunity backed by ${relatedLeverage.length} leverage point(s).`,
      evidenceIds: [opp.id],
      relatedInsightIds: relatedLeverage,
      impact: opp.impact ?? 7,
      confidence: opp.confidenceScore ?? 0.5,
      createdAt: now,
    });
  }

  // Derive opportunities from leverage-constraint resolution
  for (const lev of leveragePoints.slice(0, 5)) {
    const relatedConstraints = constraints.filter(c => lev.relatedInsightIds.includes(c.id));
    if (relatedConstraints.length === 0) continue;

    const con = relatedConstraints[0];
    const label = `Unlock: ${con.label.slice(0, 60)}`;
    if (insights.some(i => jaccardSimilarity(i.label, label) >= 0.5)) continue;

    insights.push({
      id: nextInsightId("opportunity"),
      analysisId,
      insightType: "emerging_opportunity",
      label,
      description: `Resolving "${con.label}" via "${lev.label}" opens strategic value.`,
      evidenceIds: [...new Set([...lev.evidenceIds, ...con.evidenceIds])],
      relatedInsightIds: [lev.id, con.id],
      impact: Math.max(lev.impact, con.impact),
      confidence: Math.round(((lev.confidence + con.confidence) / 2) * 100) / 100,
      createdAt: now,
    });
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 6: CONSTRUCT STRATEGIC PATHWAYS
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

  // Build pathways connecting top constraints → leverage → opportunities
  const topConstraints = [...constraints].sort((a, b) => b.impact - a.impact).slice(0, 3);
  const topOpps = [...opportunities].sort((a, b) => b.impact - a.impact).slice(0, 3);

  for (let i = 0; i < Math.min(topConstraints.length, topOpps.length); i++) {
    const con = topConstraints[i];
    const opp = topOpps[i];
    const relatedLev = leveragePoints.find(l =>
      l.relatedInsightIds.includes(con.id) || l.relatedInsightIds.includes(opp.id)
    );

    const label = `${con.label.slice(0, 35)} → ${opp.label.slice(0, 45)}`;

    insights.push({
      id: nextInsightId("pathway"),
      analysisId,
      insightType: "strategic_pathway",
      label,
      description: `Strategic pathway: address "${con.label}" ${relatedLev ? `through "${relatedLev.label}"` : ""} to achieve "${opp.label}".`,
      evidenceIds: [...new Set([
        ...con.evidenceIds, ...opp.evidenceIds, ...(relatedLev?.evidenceIds ?? []),
      ])],
      relatedInsightIds: [con.id, opp.id, ...(relatedLev ? [relatedLev.id] : [])],
      impact: Math.max(con.impact, opp.impact),
      confidence: Math.round(((con.confidence + opp.confidence) / 2) * 100) / 100,
      createdAt: now,
    });
  }

  return insights;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 7: GENERATE STRATEGIC NARRATIVE
// ═══════════════════════════════════════════════════════════════

function buildStrategicNarrative(
  constraints: StrategicInsight[],
  drivers: StrategicInsight[],
  leveragePoints: StrategicInsight[],
  opportunities: StrategicInsight[],
  pathways: StrategicInsight[],
): StrategicNarrative {
  const topConstraint = constraints.sort((a, b) => b.impact - a.impact)[0] ?? null;
  const topDriver = drivers.sort((a, b) => b.impact - a.impact)[0] ?? null;
  const topLeverage = leveragePoints.sort((a, b) => b.impact - a.impact)[0] ?? null;
  const topOpp = opportunities.sort((a, b) => b.impact - a.impact)[0] ?? null;
  const topPathway = pathways.sort((a, b) => b.impact - a.impact)[0] ?? null;

  const parts: string[] = [];
  if (topConstraint) parts.push(`The primary constraint is: ${topConstraint.label}.`);
  if (topDriver) parts.push(`The key driver underlying this is: ${topDriver.label}.`);
  if (topLeverage) parts.push(`Leverage can be applied at: ${topLeverage.label}.`);
  if (topOpp) parts.push(`This unlocks the opportunity: ${topOpp.label}.`);
  if (topPathway) parts.push(`Recommended pathway: ${topPathway.label}.`);

  if (parts.length === 0) {
    parts.push("Insufficient evidence to generate a complete strategic narrative. Add more inputs to pipeline steps.");
  }

  return {
    primaryConstraint: topConstraint?.label ?? null,
    keyDriver: topDriver?.label ?? null,
    leveragePoint: topLeverage?.label ?? null,
    breakthroughOpportunity: topOpp?.label ?? null,
    strategicPathway: topPathway?.label ?? null,
    narrativeSummary: parts.join(" "),
  };
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 8 & 9: Graph + Metrics are built from existing engines
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
//  MAIN ENTRY POINT — runStrategicAnalysis
// ═══════════════════════════════════════════════════════════════

export function runStrategicAnalysis(input: StrategicAnalysisInput): StrategicAnalysisOutput {
  insightIdCounter = 0;
  const events: string[] = [];
  const stages: PipelineStageResult[] = [];

  // ── Stage 1: Collect Evidence ──
  const { result: evidenceResult, stage: s1 } = traceStage("Evidence Collection", 1, () =>
    collectEvidence(input)
  );
  stages.push(s1);
  const { structured: evidence, flat } = evidenceResult;
  events.push(`${flat.length} evidence objects collected`);

  // ── Diagnostic: Check sufficiency ──
  const insufficientEvidence = flat.length < 5;
  if (insufficientEvidence) {
    events.push("WARNING: Not enough evidence for reliable analysis.");
  }

  // ── Stage 2: Detect Constraints ──
  const { result: constraints, stage: s2 } = traceStage("Constraint Detection", flat.length, () =>
    detectConstraints(flat, input.analysisId)
  );
  stages.push(s2);
  events.push(`${constraints.length} constraints detected`);

  // ── Stage 3: Identify Drivers ──
  const { result: drivers, stage: s3 } = traceStage("Driver Identification", flat.length, () =>
    identifyDrivers(flat, constraints, input.analysisId)
  );
  stages.push(s3);
  events.push(`${drivers.length} drivers identified`);

  // ── Stage 4: Calculate Leverage Points ──
  const { result: leveragePoints, stage: s4 } = traceStage("Leverage Calculation", constraints.length + drivers.length, () =>
    calculateLeveragePoints(flat, constraints, drivers, input.analysisId)
  );
  stages.push(s4);
  events.push(`${leveragePoints.length} leverage points calculated`);

  // ── Stage 5: Generate Opportunities ──
  const { result: opportunities, stage: s5 } = traceStage("Opportunity Generation", leveragePoints.length, () =>
    generateOpportunities(flat, constraints, leveragePoints, input.analysisId)
  );
  stages.push(s5);
  events.push(`${opportunities.length} opportunities generated`);

  // ── Stage 6: Construct Strategic Pathways ──
  const { result: pathways, stage: s6 } = traceStage("Pathway Construction", constraints.length + opportunities.length, () =>
    constructStrategicPathways(constraints, drivers, leveragePoints, opportunities, input.analysisId)
  );
  stages.push(s6);
  events.push(`${pathways.length} strategic pathways constructed`);

  // ── Stage 7: Generate Strategic Narrative ──
  const narrative = buildStrategicNarrative(constraints, drivers, leveragePoints, opportunities, pathways);

  // ── Combine all insights ──
  const allInsights: StrategicInsight[] = [
    ...constraints,
    ...drivers,
    ...leveragePoints,
    ...opportunities,
    ...pathways,
  ];

  // ── Stage 8: Build Insight Graph ──
  // Convert strategic insights to the format expected by the graph builder
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

  // Scenario data
  const scenarios = getScenarios(input.analysisId);
  const scenarioComparison = scenarios.length > 0 ? compareScenarios(scenarios) : null;
  const sensitivityReports = computeAllSensitivityReports(scenarios);

  const { result: graph, stage: s7 } = traceStage("Graph Construction", flat.length + allInsights.length, () =>
    buildInsightGraph(
      flat, undefined, undefined, undefined, undefined,
      insightsForGraph.length > 0 ? insightsForGraph : undefined,
      scenarioComparison?.scenarios,
    )
  );
  stages.push(s7);

  // ── Stage 9: Calculate Command Deck Metrics ──
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

  const { result: metrics, stage: s8 } = traceStage("Metrics Computation", flat.length, () =>
    computeCommandDeckMetrics(metricsInput)
  );
  stages.push(s8);

  const { result: aggOpps, stage: s9 } = traceStage("Opportunity Aggregation", flat.length, () =>
    aggregateOpportunities(metricsInput)
  );
  stages.push(s9);

  // ── Build diagnostic ──
  const diagnostic: StrategicDiagnostic = {
    evidenceCount: flat.length,
    constraintCount: constraints.length,
    driverCount: drivers.length,
    leverageCount: leveragePoints.length,
    opportunityCount: opportunities.length,
    pathwayCount: pathways.length,
    insufficientEvidence,
    message: insufficientEvidence ? "Not enough evidence for reliable analysis." : null,
  };

  // Build pipeline diagnostic for the diagnostics panel
  buildDiagnostic(stages, graph.nodes, flat.length, allInsights.length, scenarios.length);

  events.push("Strategic intelligence computed");

  return {
    evidence,
    flatEvidence: flat,
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
