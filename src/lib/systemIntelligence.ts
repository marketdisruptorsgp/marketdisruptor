/**
 * SYSTEM INTELLIGENCE LAYER
 *
 * Architectural role: Layer 2 — between Analysis Pipeline (Layer 1)
 * and Visualization/UI (Layer 3).
 *
 * Responsibilities:
 *   1. Multi-lens orchestration
 *   2. Convergence detection
 *   3. System leverage map construction
 *   4. Insight aggregation (Command Deck)
 *   5. Friction & Leverage scoring (Opportunity Matrix)
 *   6. Insight Governance (dedup, caps, orphan removal)
 *   7. UI-ready data preparation
 *
 * Staged processing pipeline:
 *   Stage 1: Structural Model extraction (constraint_map, causal_chains)
 *   Stage 2: Lens Interpretation + Leverage Map
 *   Stage 3: Friction/Leverage scoring → Priority Matrix
 *   Stage 4: Insight Governance → Command Deck
 *
 * Each stage only runs if prior stage data exists. All intermediate
 * results are cached. Never recomputes upstream unless source changes.
 */

import {
  buildSystemLeverageMap,
  extractLensArtifacts,
  type LensType,
  type LensArtifacts,
  type LeverageNode,
  type SystemLeverageMap,
} from "@/lib/multiLensEngine";
import {
  scoreOpportunities,
  type ScoredOpportunity,
  type ScoringOutput,
  computeExpandedFriction,
  type ExpandedFrictionScore,
} from "@/lib/frictionEngine";
import {
  governInsights,
  type GovernedInsight,
  type GovernanceReport,
} from "@/lib/insightGovernance";
import {
  extractCanonicalModel,
  type CanonicalModel,
} from "@/lib/canonicalSchema";
import {
  buildProvenanceRegistry,
  type ProvenanceRegistry,
} from "@/lib/insightProvenance";
import {
  orchestrateLenses,
  type MergedLensOutput,
} from "@/lib/lensOrchestrator";
import { type ConvergenceZone } from "@/lib/convergenceEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface ConstraintNode {
  id: string;
  label: string;
  impact: number;
  confidence: "high" | "medium" | "low";
  evidence: string[];
  attributes?: string;
}

export interface OpportunityNode {
  id: string;
  label: string;
  impact: number;
  confidence: "high" | "medium" | "low";
  evidence: string[];
  attributes?: string;
}

export interface LensAnalysis {
  lens: LensType;
  constraintCount: number;
  leverageCount: number;
  opportunityCount: number;
  totalImpact: number;
  topNodes: LeverageNode[];
}

export interface CommandDeck {
  topConstraints: ConstraintNode[];
  topLeveragePoints: LeverageNode[];
  topOpportunities: OpportunityNode[];
  convergenceZones: string[];
}

export interface SystemIntelligence {
  analysisId: string;
  lenses: Partial<Record<LensType, LensAnalysis>>;
  unifiedConstraintGraph: ConstraintNode[];
  leveragePoints: LeverageNode[];
  opportunities: OpportunityNode[];
  convergenceZones: string[];
  commandDeck: CommandDeck;
  leverageMap: SystemLeverageMap | null;
  // Friction & Leverage scoring
  scoredOpportunities: ScoredOpportunity[];
  scoringSummary: ScoringOutput["summary"] | null;
  governanceReport: GovernanceReport | null;
  provenanceReport: { artifactScored: number; heuristicScored: number };
  // Canonical schema + provenance
  canonicalModel: CanonicalModel | null;
  provenanceRegistry: ProvenanceRegistry | null;
  expandedFriction: ExpandedFrictionScore | null;
  // Cross-lens convergence
  convergenceZoneDetails: ConvergenceZone[];
  mergedLensOutput: MergedLensOutput | null;
  computedAt: number;
}

// ═══════════════════════════════════════════════════════════════
//  MEMOIZATION CACHE
// ═══════════════════════════════════════════════════════════════

const intelligenceCache = new Map<string, SystemIntelligence>();

/** Clear cache for a specific analysis (e.g. after re-run) */
export function invalidateIntelligence(analysisId: string): void {
  intelligenceCache.delete(analysisId);
}

/** Clear entire cache */
export function clearIntelligenceCache(): void {
  intelligenceCache.clear();
}

// ═══════════════════════════════════════════════════════════════
//  INPUT SPEC
// ═══════════════════════════════════════════════════════════════

export interface SystemIntelligenceInput {
  analysisId: string;
  governedData: Record<string, unknown> | null;
  disruptData: Record<string, unknown> | null;
  businessAnalysisData: Record<string, unknown> | null;
  intelData: Record<string, unknown> | null;
  flipIdeas: unknown[] | null;
  activeLenses: LensType[];
}

// ═══════════════════════════════════════════════════════════════
//  CORE BUILDER — Staged Processing Pipeline
// ═══════════════════════════════════════════════════════════════

export function buildSystemIntelligence(input: SystemIntelligenceInput): SystemIntelligence {
  const { analysisId, governedData, disruptData, businessAnalysisData, intelData, flipIdeas, activeLenses } = input;

  // Content-aware cache key: include data fingerprint so cache invalidates when inputs change
  const dataFingerprint = [
    Object.keys(governedData || {}).length,
    Object.keys(disruptData || {}).length,
    Object.keys(businessAnalysisData || {}).length,
    (flipIdeas || []).length,
    activeLenses.join(","),
  ].join("|");
  const cacheKey = `${analysisId}::${dataFingerprint}`;

  const cached = intelligenceCache.get(cacheKey);
  if (cached) return cached;

  // ── Stage 1: Structural Model + Lens Artifacts ──
  const lensArtifacts = extractLensArtifacts(disruptData, businessAnalysisData, intelData);

  // ── Stage 2: Leverage Map Construction ──
  const leverageMap = buildSystemLeverageMap(
    governedData, disruptData, flipIdeas, activeLenses, lensArtifacts,
  );

  const allNodes = leverageMap?.nodes || [];

  const constraints: ConstraintNode[] = allNodes
    .filter(n => n.type === "constraint")
    .map(n => ({ id: n.id, label: n.label, impact: n.impact, confidence: n.confidence, evidence: n.evidence, attributes: n.attributes }));

  const leveragePoints: LeverageNode[] = allNodes.filter(n => n.type === "leverage");

  const opportunities: OpportunityNode[] = allNodes
    .filter(n => n.type === "opportunity")
    .map(n => ({ id: n.id, label: n.label, impact: n.impact, confidence: n.confidence, evidence: n.evidence, attributes: n.attributes }));

  const convergenceZones = leverageMap?.convergenceZones || [];

  // ── Stage 3: Friction & Leverage Scoring ──
  const dominantLens = leverageMap?.dominantLens || activeLenses[0] || "product";

  const scoringInput = {
    opportunities: opportunities.map(o => ({
      id: o.id,
      label: o.label,
      description: o.evidence?.[0] || o.attributes || "",
      category: "opportunity",
      impact: o.impact,
      evidence: o.evidence,
    })),
    mode: dominantLens,
  };

  const scoringResult = scoringInput.opportunities.length > 0
    ? scoreOpportunities(scoringInput)
    : null;

  // ── Stage 4: Insight Governance ──
  const rawInsights: GovernedInsight[] = [
    ...constraints.map(c => ({ id: c.id, label: c.label, evidence: c.evidence })),
    ...leveragePoints.map(l => ({ id: l.id, label: l.label, evidence: l.evidence })),
  ];

  const governed = governInsights(rawInsights, scoringResult?.scored || []);

  // Per-lens summaries + orchestration
  const mergedLensOutput = orchestrateLenses(activeLenses, allNodes);

  const lenses: Partial<Record<LensType, LensAnalysis>> = {};
  for (const lens of activeLenses) {
    const lensNodes = allNodes.filter(n => n.lensScores.some(ls => ls.lens === lens && ls.score >= 5));
    lenses[lens] = {
      lens,
      constraintCount: lensNodes.filter(n => n.type === "constraint").length,
      leverageCount: lensNodes.filter(n => n.type === "leverage").length,
      opportunityCount: lensNodes.filter(n => n.type === "opportunity").length,
      totalImpact: lensNodes.reduce((sum, n) => sum + n.impact, 0),
      topNodes: [...lensNodes].sort((a, b) => b.impact - a.impact).slice(0, 5),
    };
  }

  // Command Deck
  const commandDeck: CommandDeck = {
    topConstraints: [...constraints].sort((a, b) => b.impact - a.impact).slice(0, 3),
    topLeveragePoints: [...leveragePoints].sort((a, b) => b.impact - a.impact).slice(0, 3),
    topOpportunities: [...opportunities].sort((a, b) => b.impact - a.impact).slice(0, 3),
    convergenceZones,
  };

  // ── Stage 5: Canonical Model ──
  const canonicalModel = extractCanonicalModel(
    dominantLens, governedData, disruptData, businessAnalysisData,
  );

  // ── Stage 6: Provenance Registry ──
  const provenanceRegistry = buildProvenanceRegistry(
    constraints, leveragePoints, opportunities, dominantLens,
  );

  // ── Stage 7: Expanded Friction Index (system-wide) ──
  const allLabels = [
    ...constraints.map(c => c.label),
    ...leveragePoints.map(l => l.label),
    ...opportunities.map(o => o.label),
  ];
  const allEvidence = [
    ...constraints.flatMap(c => c.evidence),
    ...leveragePoints.flatMap(l => l.evidence),
    ...opportunities.flatMap(o => o.evidence),
  ];
  const expandedFriction = allLabels.length > 0
    ? computeExpandedFriction(allLabels.join(" "), allEvidence)
    : null;

  const result: SystemIntelligence = {
    analysisId,
    lenses,
    unifiedConstraintGraph: constraints,
    leveragePoints,
    opportunities,
    convergenceZones,
    commandDeck,
    leverageMap,
    scoredOpportunities: governed.opportunities,
    scoringSummary: scoringResult?.summary || null,
    governanceReport: governed.report,
    provenanceReport: leverageMap?.provenanceReport || { artifactScored: 0, heuristicScored: 0 },
    canonicalModel,
    provenanceRegistry,
    expandedFriction,
    convergenceZoneDetails: mergedLensOutput.convergenceZones,
    mergedLensOutput,
    computedAt: Date.now(),
  };

  intelligenceCache.set(cacheKey, result);
  return result;
}

// ═══════════════════════════════════════════════════════════════
//  MULTI-LENS ORCHESTRATION
// ═══════════════════════════════════════════════════════════════

export function runMultiLensAnalysis(input: SystemIntelligenceInput): SystemIntelligence {
  invalidateIntelligence(input.analysisId);
  const fullInput: SystemIntelligenceInput = {
    ...input,
    activeLenses: input.activeLenses.length >= 2
      ? input.activeLenses
      : ["product", "service", "business"],
  };
  return buildSystemIntelligence(fullInput);
}

// Re-export types needed by consumers
export type { LensType, LeverageNode, SystemLeverageMap } from "@/lib/multiLensEngine";
export type { ScoredOpportunity, ScoringOutput, ExpandedFrictionScore } from "@/lib/frictionEngine";
export type { GovernanceReport } from "@/lib/insightGovernance";
export type { CanonicalModel } from "@/lib/canonicalSchema";
export type { ProvenanceRegistry } from "@/lib/insightProvenance";
export type { ConvergenceZone } from "@/lib/convergenceEngine";
export type { MergedLensOutput } from "@/lib/lensOrchestrator";
