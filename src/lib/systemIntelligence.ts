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
 *   5. UI-ready data preparation
 *
 * This layer runs ONCE per analysis. UI components consume the
 * SystemIntelligence object — never raw governed pipeline data.
 */

import {
  buildSystemLeverageMap,
  extractLensArtifacts,
  type LensType,
  type LensArtifacts,
  type LeverageNode,
  type SystemLeverageMap,
} from "@/lib/multiLensEngine";

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
  provenanceReport: { artifactScored: number; heuristicScored: number };
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
//  CORE BUILDER
// ═══════════════════════════════════════════════════════════════

/**
 * Build the SystemIntelligence object from pipeline outputs.
 * This is the ONLY entry point for UI consumption.
 *
 * Architecture:
 *   STRUCTURAL MODEL (governed pipeline outputs)
 *     ↓
 *   SYSTEM CONSTRAINT MAP (extracted constraints)
 *     ↓
 *   LENS INTERPRETATION LAYER (artifact-driven scoring)
 *     ↓
 *   LEVERAGE MAP (interactive graph)
 *     ↓
 *   OPPORTUNITY ENGINE (strategic interventions)
 *     ↓
 *   COMMAND DECK (top insights aggregation)
 */
export function buildSystemIntelligence(input: SystemIntelligenceInput): SystemIntelligence {
  const { analysisId, governedData, disruptData, businessAnalysisData, intelData, flipIdeas, activeLenses } = input;

  // Check cache
  const cached = intelligenceCache.get(analysisId);
  if (cached) return cached;

  // Step 1: Extract lens artifacts from pipeline outputs
  const lensArtifacts = extractLensArtifacts(disruptData, businessAnalysisData, intelData);

  // Step 2: Build the System Leverage Map (contains all nodes/edges)
  const leverageMap = buildSystemLeverageMap(
    governedData,
    disruptData,
    flipIdeas,
    activeLenses,
    lensArtifacts,
  );

  // Step 3: Extract typed node collections from the map
  const allNodes = leverageMap?.nodes || [];

  const constraints: ConstraintNode[] = allNodes
    .filter(n => n.type === "constraint")
    .map(n => ({ id: n.id, label: n.label, impact: n.impact, confidence: n.confidence, evidence: n.evidence, attributes: n.attributes }));

  const leveragePoints: LeverageNode[] = allNodes.filter(n => n.type === "leverage");

  const opportunities: OpportunityNode[] = allNodes
    .filter(n => n.type === "opportunity")
    .map(n => ({ id: n.id, label: n.label, impact: n.impact, confidence: n.confidence, evidence: n.evidence, attributes: n.attributes }));

  const convergenceZones = leverageMap?.convergenceZones || [];

  // Step 4: Build per-lens analysis summaries
  const lenses: Partial<Record<LensType, LensAnalysis>> = {};
  for (const lens of activeLenses) {
    const lensNodes = allNodes.filter(n => n.lensScores.some(ls => ls.lens === lens && ls.score >= 5));
    lenses[lens] = {
      lens,
      constraintCount: lensNodes.filter(n => n.type === "constraint").length,
      leverageCount: lensNodes.filter(n => n.type === "leverage").length,
      opportunityCount: lensNodes.filter(n => n.type === "opportunity").length,
      totalImpact: lensNodes.reduce((sum, n) => sum + n.impact, 0),
      topNodes: lensNodes.sort((a, b) => b.impact - a.impact).slice(0, 5),
    };
  }

  // Step 5: Build Command Deck (top insights)
  const commandDeck: CommandDeck = {
    topConstraints: [...constraints].sort((a, b) => b.impact - a.impact).slice(0, 3),
    topLeveragePoints: [...leveragePoints].sort((a, b) => b.impact - a.impact).slice(0, 3),
    topOpportunities: [...opportunities].sort((a, b) => b.impact - a.impact).slice(0, 3),
    convergenceZones,
  };

  const result: SystemIntelligence = {
    analysisId,
    lenses,
    unifiedConstraintGraph: constraints,
    leveragePoints,
    opportunities,
    convergenceZones,
    commandDeck,
    leverageMap,
    provenanceReport: leverageMap?.provenanceReport || { artifactScored: 0, heuristicScored: 0 },
    computedAt: Date.now(),
  };

  // Cache the result
  intelligenceCache.set(analysisId, result);

  return result;
}

// ═══════════════════════════════════════════════════════════════
//  MULTI-LENS ORCHESTRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Run multi-lens analysis.
 *
 * All lenses share the same structural model (constraint_map, causal_chains).
 * Each lens applies its own interpretation layer via artifact-driven scoring.
 * Outputs merge into a single SystemIntelligence object.
 *
 * NOTE: This does NOT run separate full pipelines per lens.
 * The structural model is shared; only interpretation differs.
 */
export function runMultiLensAnalysis(input: SystemIntelligenceInput): SystemIntelligence {
  // Invalidate stale cache for this analysis
  invalidateIntelligence(input.analysisId);

  // Ensure all three lenses are active for multi-lens mode
  const fullInput: SystemIntelligenceInput = {
    ...input,
    activeLenses: input.activeLenses.length >= 2
      ? input.activeLenses
      : ["product", "service", "business"],
  };

  return buildSystemIntelligence(fullInput);
}

// ═══════════════════════════════════════════════════════════════
//  REACT HOOK — useSystemIntelligence
// ═══════════════════════════════════════════════════════════════

// Re-export types needed by consumers
export type { LensType, LeverageNode, SystemLeverageMap } from "@/lib/multiLensEngine";
