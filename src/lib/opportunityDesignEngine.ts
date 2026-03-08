/**
 * OPPORTUNITY DESIGN ENGINE — Morphological Search for Business Models
 *
 * Explores the design space of a business model using Fritz Zwicky's
 * morphological analysis framework. Instead of generating generic opportunity
 * labels, this engine:
 *
 *   1. Extracts the current business configuration (baseline) from evidence
 *   2. Identifies dimensions worth exploring ("hot" = constraint-linked, "warm" = evidence-dense)
 *   3. Generates controlled 1–2 variable shifts via AI-assisted alternative values
 *   4. Filters through deterministic qualification gates (no scores)
 *   5. Clusters results into opportunity zones (strategic themes)
 *
 * Every output is expressed as a delta from baseline, not an absolute idea.
 * Dimensions are derived from the 9 canonical evidence categories — no hardcoded business dimensions.
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicInsight, StrategicSignal } from "@/lib/strategicEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

/** The 9 canonical evidence categories that become morphological dimensions */
export const EVIDENCE_CATEGORIES = [
  "demand_signal",
  "cost_structure",
  "distribution_channel",
  "pricing_model",
  "operational_dependency",
  "regulatory_constraint",
  "technology_dependency",
  "customer_behavior",
  "competitive_pressure",
] as const;

export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

/** Human-readable names for each dimension */
const DIMENSION_NAMES: Record<EvidenceCategory, string> = {
  demand_signal: "Demand & Market Signal",
  cost_structure: "Cost Structure",
  distribution_channel: "Distribution Channel",
  pricing_model: "Pricing Model",
  operational_dependency: "Operational Model",
  regulatory_constraint: "Regulatory Environment",
  technology_dependency: "Technology Stack",
  customer_behavior: "Customer Behavior",
  competitive_pressure: "Competitive Landscape",
};

export type DimensionStatus = "hot" | "warm" | "inactive";

export interface BusinessDimension {
  id: string;
  name: string;
  category: EvidenceCategory;
  currentValue: string;
  evidenceIds: string[];
  evidenceCount: number;
  hasConstraint: boolean;
  hasLeverage: boolean;
  status: DimensionStatus;
}

export interface DimensionShift {
  dimension: string;
  from: string;
  to: string;
}

export type ExplorationMode = "constraint" | "adjacency";

export interface OpportunityVector {
  id: string;
  changedDimensions: DimensionShift[];
  triggerIds: string[];
  explorationMode: ExplorationMode;
  rationale: string;
  evidenceIds: string[];
}

export interface OpportunityZone {
  id: string;
  theme: string;
  vectors: OpportunityVector[];
  sharedDimensionId: string;
}

export type BusinessBaseline = Record<string, BusinessDimension>;

/** AI-generated alternative values for a single dimension */
export interface DimensionAlternative {
  dimensionId: string;
  value: string;
  rationale: string;
}

/** Full AI response from the edge function */
export interface AIAlternativesResponse {
  alternatives: DimensionAlternative[];
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

let vectorIdCounter = 0;
function nextVectorId(): string {
  return `ov-${++vectorIdCounter}`;
}

let zoneIdCounter = 0;
function nextZoneId(): string {
  return `oz-${++zoneIdCounter}`;
}

export function resetCounters(): void {
  vectorIdCounter = 0;
  zoneIdCounter = 0;
}

/**
 * Jaccard similarity on tokenized strings.
 * Used for redundancy detection.
 */
function jaccard(a: string, b: string): number {
  const tokA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(t => t.length > 2));
  const tokB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(t => t.length > 2));
  if (tokA.size === 0 && tokB.size === 0) return 0;
  let inter = 0;
  for (const t of tokA) if (tokB.has(t)) inter++;
  return inter / (tokA.size + tokB.size - inter);
}

/**
 * Classify an evidence item into one of the 9 canonical categories.
 * Uses the evidence's category field if available, otherwise infers from label/description.
 */
function classifyCategory(ev: Evidence): EvidenceCategory | null {
  // Direct match from evidence category field
  const cat = ev.category?.toLowerCase().replace(/\s+/g, "_");
  if (cat && EVIDENCE_CATEGORIES.includes(cat as EvidenceCategory)) {
    return cat as EvidenceCategory;
  }

  // Infer from label + description
  const text = `${ev.label} ${ev.description || ""}`.toLowerCase();

  if (text.match(/demand|market\s*signal|customer\s*need|growth|adoption|interest/)) return "demand_signal";
  if (text.match(/cost|expense|margin|overhead|spend|waste|efficiency/)) return "cost_structure";
  if (text.match(/distribut|channel|sales\s*model|go.to.market|reach|partner/)) return "distribution_channel";
  if (text.match(/pric|subscription|fee|revenue\s*model|monetiz|billing|usage.based/)) return "pricing_model";
  if (text.match(/operation|process|workflow|manual|automat|fulfillment|delivery\s*model/)) return "operational_dependency";
  if (text.match(/regulat|compliance|legal|permit|license|policy/)) return "regulatory_constraint";
  if (text.match(/technolog|stack|platform|software|tool|system|infra/)) return "technology_dependency";
  if (text.match(/customer|user|behavior|retention|churn|onboard|experience|segment/)) return "customer_behavior";
  if (text.match(/compet|rival|market\s*position|alternative|substitute|incumbent/)) return "competitive_pressure";

  return null;
}

/**
 * Infer the current value of a dimension from its evidence items.
 * Uses the most frequent label pattern as a proxy for current state.
 */
function inferCurrentValue(evidenceItems: Evidence[]): string {
  if (evidenceItems.length === 0) return "Unknown";

  // Use the label of the evidence with highest source count, or first item
  const sorted = [...evidenceItems].sort((a, b) => (b.sourceCount ?? 1) - (a.sourceCount ?? 1));
  const topLabel = sorted[0].label;

  // Clean the label to represent a state rather than a finding
  return topLabel.length > 80 ? topLabel.slice(0, 77) + "…" : topLabel;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 1: EXTRACT BASELINE
// ═══════════════════════════════════════════════════════════════

/**
 * Groups evidence by canonical category and infers the current business
 * configuration. Only populates dimensions with ≥2 evidence items.
 */
export function extractBaseline(
  flatEvidence: Evidence[],
  constraints: StrategicInsight[],
  leveragePoints: StrategicInsight[],
): BusinessBaseline {
  // Group evidence by category
  const categoryBuckets: Record<string, Evidence[]> = {};

  for (const ev of flatEvidence) {
    const cat = classifyCategory(ev);
    if (!cat) continue;
    if (!categoryBuckets[cat]) categoryBuckets[cat] = [];
    categoryBuckets[cat].push(ev);
  }

  const baseline: BusinessBaseline = {};

  for (const cat of EVIDENCE_CATEGORIES) {
    const items = categoryBuckets[cat] || [];
    // Evidence gate: ≥2 items required
    if (items.length < 2) continue;

    const evidenceIds = items.map(e => e.id);

    // Check if any constraint/leverage references these evidence items
    const hasConstraint = constraints.some(c =>
      c.evidenceIds.some(eid => evidenceIds.includes(eid))
    );
    const hasLeverage = leveragePoints.some(l =>
      l.evidenceIds.some(eid => evidenceIds.includes(eid))
    );

    baseline[cat] = {
      id: `dim-${cat}`,
      name: DIMENSION_NAMES[cat],
      category: cat,
      currentValue: inferCurrentValue(items),
      evidenceIds,
      evidenceCount: items.length,
      hasConstraint,
      hasLeverage,
      status: "inactive", // Will be set by identifyActiveDimensions
    };
  }

  return baseline;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 2: IDENTIFY ACTIVE DIMENSIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Marks dimensions as "hot" (constraint/leverage linked → constraint-driven exploration)
 * or "warm" (≥3 evidence, no constraint → adjacency exploration).
 */
export function identifyActiveDimensions(
  baseline: BusinessBaseline,
  constraints: StrategicInsight[],
  leveragePoints: StrategicInsight[],
): BusinessBaseline {
  const updated = { ...baseline };

  for (const [key, dim] of Object.entries(updated)) {
    const newDim = { ...dim };

    if (newDim.hasConstraint || newDim.hasLeverage) {
      newDim.status = "hot";
    } else if (newDim.evidenceCount >= 3) {
      newDim.status = "warm";
    } else {
      newDim.status = "inactive";
    }

    updated[key] = newDim;
  }

  return updated;
}

/**
 * Get dimensions by status for exploration.
 */
export function getDimensionsByStatus(baseline: BusinessBaseline, status: DimensionStatus): BusinessDimension[] {
  return Object.values(baseline).filter(d => d.status === status);
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 3: COMBINE BASELINE WITH AI ALTERNATIVES → VECTORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generates opportunity vectors by combining baseline dimensions with
 * AI-generated alternative values. Each vector represents a 1–2 dimension
 * shift from the current configuration.
 */
export function generateOpportunityVectors(
  baseline: BusinessBaseline,
  alternatives: DimensionAlternative[],
  constraints: StrategicInsight[],
  leveragePoints: StrategicInsight[],
): OpportunityVector[] {
  const vectors: OpportunityVector[] = [];
  const hotDims = getDimensionsByStatus(baseline, "hot");
  const warmDims = getDimensionsByStatus(baseline, "warm");

  // Group alternatives by dimension — normalize IDs (AI may return "pricing_model" or "dim-pricing_model")
  const altsByDim: Record<string, DimensionAlternative[]> = {};
  for (const alt of alternatives) {
    // Try exact match first, then with "dim-" prefix, then without prefix
    const normalizedId = alt.dimensionId.startsWith("dim-") ? alt.dimensionId : `dim-${alt.dimensionId}`;
    if (!altsByDim[normalizedId]) altsByDim[normalizedId] = [];
    altsByDim[normalizedId].push(alt);
  }

  // ── Single-dimension shifts ──
  for (const dim of [...hotDims, ...warmDims]) {
    const dimAlts = altsByDim[dim.id] || [];
    const mode: ExplorationMode = dim.status === "hot" ? "constraint" : "adjacency";

    // Find trigger IDs (constraints/leverage that reference this dimension's evidence)
    const triggerIds = [
      ...constraints.filter(c => c.evidenceIds.some(eid => dim.evidenceIds.includes(eid))).map(c => c.id),
      ...leveragePoints.filter(l => l.evidenceIds.some(eid => dim.evidenceIds.includes(eid))).map(l => l.id),
    ];

    for (const alt of dimAlts) {
      vectors.push({
        id: nextVectorId(),
        changedDimensions: [{ dimension: dim.name, from: dim.currentValue, to: alt.value }],
        triggerIds,
        explorationMode: mode,
        rationale: alt.rationale,
        evidenceIds: dim.evidenceIds,
      });
    }
  }

  // ── Two-dimension shifts (hot × hot only, max 2 changes) ──
  if (hotDims.length >= 2) {
    for (let i = 0; i < hotDims.length && i < 3; i++) {
      for (let j = i + 1; j < hotDims.length && j < 4; j++) {
        const dimA = hotDims[i];
        const dimB = hotDims[j];
        const altsA = altsByDim[dimA.id] || [];
        const altsB = altsByDim[dimB.id] || [];

        if (altsA.length === 0 || altsB.length === 0) continue;

        // Take first alternative from each for the combination
        const altA = altsA[0];
        const altB = altsB[0];

        const triggerIds = [
          ...constraints.filter(c =>
            c.evidenceIds.some(eid => dimA.evidenceIds.includes(eid) || dimB.evidenceIds.includes(eid))
          ).map(c => c.id),
          ...leveragePoints.filter(l =>
            l.evidenceIds.some(eid => dimA.evidenceIds.includes(eid) || dimB.evidenceIds.includes(eid))
          ).map(l => l.id),
        ];

        vectors.push({
          id: nextVectorId(),
          changedDimensions: [
            { dimension: dimA.name, from: dimA.currentValue, to: altA.value },
            { dimension: dimB.name, from: dimB.currentValue, to: altB.value },
          ],
          triggerIds,
          explorationMode: "constraint",
          rationale: `${altA.rationale} Combined with: ${altB.rationale}`,
          evidenceIds: [...new Set([...dimA.evidenceIds, ...dimB.evidenceIds])],
        });
      }
    }
  }

  return vectors;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 4: QUALIFICATION GATES
// ═══════════════════════════════════════════════════════════════

/**
 * Applies four deterministic qualification gates. No scores.
 * Vectors either pass or they don't.
 *
 * Gate 1: Evidence — dimension must have ≥2 evidence (≥3 for adjacency)
 * Gate 2: Constraint linkage — constraint-driven vectors must reference ≥1 trigger
 * Gate 3: Feasibility — reject vectors conflicting with regulatory/operational constraints
 * Gate 4: Redundancy — collapse similar shifts (Jaccard >0.7)
 */
export function applyQualificationGates(
  vectors: OpportunityVector[],
  constraints: StrategicInsight[],
  flatEvidence: Evidence[],
  baseline: BusinessBaseline,
): OpportunityVector[] {
  let surviving = [...vectors];

  // ── Gate 1: Evidence support ──
  surviving = surviving.filter(v => {
    for (const shift of v.changedDimensions) {
      const dim = Object.values(baseline).find(d => d.name === shift.dimension);
      if (!dim) return false;
      if (v.explorationMode === "adjacency" && dim.evidenceCount < 3) return false;
      if (dim.evidenceCount < 2) return false;
    }
    return true;
  });

  // ── Gate 2: Constraint linkage ──
  surviving = surviving.filter(v => {
    if (v.explorationMode === "constraint") {
      return v.triggerIds.length >= 1;
    }
    return true; // Adjacency vectors don't need constraint linkage
  });

  // ── Gate 3: Feasibility ──
  // Reject vectors whose shifted dimensions conflict with regulatory or operational constraints
  const regulatoryLabels = constraints
    .filter(c => c.label.toLowerCase().match(/regulat|compliance|legal|policy/))
    .map(c => c.label.toLowerCase());
  const operationalLabels = constraints
    .filter(c => c.label.toLowerCase().match(/operational|dependency|capacity|resource/))
    .map(c => c.label.toLowerCase());

  surviving = surviving.filter(v => {
    for (const shift of v.changedDimensions) {
      const shiftText = `${shift.dimension} ${shift.to}`.toLowerCase();
      // Check if the shift directly contradicts a regulatory constraint
      for (const reg of regulatoryLabels) {
        if (jaccard(shiftText, reg) > 0.5) return false;
      }
      // Check if the shift directly contradicts an operational constraint
      for (const op of operationalLabels) {
        if (jaccard(shiftText, op) > 0.5) return false;
      }
    }
    return true;
  });

  // ── Gate 4: Redundancy ──
  // Collapse vectors with >0.7 Jaccard similarity on dimension+value signatures
  const deduped: OpportunityVector[] = [];
  for (const v of surviving) {
    const sig = v.changedDimensions.map(d => `${d.dimension}:${d.to}`).join("|");
    const isDuplicate = deduped.some(existing => {
      const existingSig = existing.changedDimensions.map(d => `${d.dimension}:${d.to}`).join("|");
      return jaccard(sig, existingSig) > 0.7;
    });
    if (!isDuplicate) deduped.push(v);
  }

  // ── Output caps ──
  const constraintVectors = deduped.filter(v => v.explorationMode === "constraint").slice(0, 10);
  const adjacencyVectors = deduped.filter(v => v.explorationMode === "adjacency").slice(0, 5);

  return [...constraintVectors, ...adjacencyVectors];
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 5: CLUSTER INTO ZONES
// ═══════════════════════════════════════════════════════════════

/**
 * Groups vectors that share a changed dimension into opportunity zones.
 * Each zone represents a strategic theme (e.g., "Shift toward product-led delivery").
 */
export function clusterIntoZones(vectors: OpportunityVector[]): OpportunityZone[] {
  // Group by the first (primary) changed dimension
  const groups: Record<string, OpportunityVector[]> = {};

  for (const v of vectors) {
    const primaryDim = v.changedDimensions[0]?.dimension || "Unknown";
    if (!groups[primaryDim]) groups[primaryDim] = [];
    groups[primaryDim].push(v);
  }

  const zones: OpportunityZone[] = [];

  for (const [dimName, groupVectors] of Object.entries(groups)) {
    if (groupVectors.length === 0) continue;

    // Derive theme from the shared dimension
    const theme = `${dimName} Transformation`;
    const sharedDimId = groupVectors[0].changedDimensions[0]?.dimension || "";

    zones.push({
      id: nextZoneId(),
      theme,
      vectors: groupVectors,
      sharedDimensionId: sharedDimId,
    });
  }

  return zones;
}

// ═══════════════════════════════════════════════════════════════
//  ORCHESTRATOR — Full morphological search pipeline
// ═══════════════════════════════════════════════════════════════

export interface MorphologicalSearchResult {
  baseline: BusinessBaseline;
  vectors: OpportunityVector[];
  zones: OpportunityZone[];
  activeDimensionCount: number;
  hotCount: number;
  warmCount: number;
  /** Origin metadata for each vector — keyed by vector ID */
  vectorOrigins: Map<string, import("@/lib/strategicPatternLibrary").VectorOrigin>;
  patternVectorCount: number;
}

/**
 * Run the complete morphological search pipeline.
 * Called by strategicEngine Stage 7 after receiving AI alternatives.
 *
 * Execution order:
 *   1. Extract baseline
 *   2. Identify active dimensions
 *   3. Apply structural patterns (pattern library) → candidate vectors
 *   4. Generate AI alternative vectors (morphological shifts)
 *   5. Merge all vectors
 *   6. Qualification gates (uniform)
 *   7. Cluster into zones
 */
export function runMorphologicalSearch(
  flatEvidence: Evidence[],
  constraints: StrategicInsight[],
  leveragePoints: StrategicInsight[],
  aiAlternatives: DimensionAlternative[],
): MorphologicalSearchResult {
  resetCounters();

  // Stage 1: Extract baseline
  const rawBaseline = extractBaseline(flatEvidence, constraints, leveragePoints);

  // Stage 2: Identify active dimensions
  const baseline = identifyActiveDimensions(rawBaseline, constraints, leveragePoints);

  const hotDims = getDimensionsByStatus(baseline, "hot");
  const warmDims = getDimensionsByStatus(baseline, "warm");

  // Stage 3a: Apply structural patterns FIRST (deterministic, mechanism-tagged)
  const { applyPatterns } = require("@/lib/strategicPatternLibrary") as typeof import("@/lib/strategicPatternLibrary");
  const constraintInputs = constraints.map(c => ({ id: c.id, evidenceIds: c.evidenceIds }));
  const leverageInputs = leveragePoints.map(l => ({ id: l.id, evidenceIds: l.evidenceIds }));
  const { vectors: patternVectors, origins: patternOrigins } = applyPatterns(
    baseline, constraintInputs, leverageInputs, flatEvidence
  );

  // Stage 3b: Generate AI alternative vectors (morphological shifts)
  const aiVectors = generateOpportunityVectors(baseline, aiAlternatives, constraints, leveragePoints);

  // Tag AI vectors with morphological origin
  const allOrigins = new Map(patternOrigins);
  for (const v of aiVectors) {
    allOrigins.set(v.id, {
      source: "morphological" as const,
      noveltyTag: "structural" as const,
    });
  }

  // Stage 4: Merge all vectors, pattern-first
  const allVectors = [...patternVectors, ...aiVectors];

  // Stage 5: Apply qualification gates (uniform across all sources)
  const qualifiedVectors = applyQualificationGates(allVectors, constraints, flatEvidence, baseline);

  // Stage 6: Cluster into zones
  const zones = clusterIntoZones(qualifiedVectors);

  return {
    baseline,
    vectors: qualifiedVectors,
    zones,
    activeDimensionCount: hotDims.length + warmDims.length,
    hotCount: hotDims.length,
    warmCount: warmDims.length,
    vectorOrigins: allOrigins,
    patternVectorCount: patternVectors.length,
  };
}

/**
 * Prepare the payload for the generate-opportunity-vectors edge function.
 */
export function prepareEdgeFunctionPayload(
  baseline: BusinessBaseline,
  constraints: StrategicInsight[],
  leveragePoints: StrategicInsight[],
  analysisType: string,
): Record<string, unknown> {
  const hotDims = getDimensionsByStatus(baseline, "hot");
  const warmDims = getDimensionsByStatus(baseline, "warm");

  return {
    dimensions: [...hotDims, ...warmDims].map(d => ({
      id: d.id,
      name: d.name,
      category: d.category,
      currentValue: d.currentValue,
      status: d.status,
      evidenceCount: d.evidenceCount,
    })),
    constraints: constraints.map(c => ({
      id: c.id,
      label: c.label,
      description: c.description,
    })),
    leveragePoints: leveragePoints.map(l => ({
      id: l.id,
      label: l.label,
      description: l.description,
    })),
    analysisType,
  };
}
