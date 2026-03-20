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
import { applyPatterns, detectInteractions, type VectorOrigin, type VectorInteraction } from "@/lib/strategicPatternLibrary";
import { getModePriorityDimensions, type DiagnosticContext } from "@/lib/diagnosticContext";

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

/** Exploration type label for UI transparency */
export type ExplorationType = "constraint_resolution" | "pattern_import" | "structural_exploration";

export interface DimensionShift {
  dimension: string;
  from: string;
  to: string;
}

export interface OpportunityVector {
  id: string;
  changedDimensions: DimensionShift[];
  triggerIds: string[];
  explorationMode: ExplorationMode;
  /** UI-facing exploration type label for explainability */
  explorationType: ExplorationType;
  rationale: string;
  evidenceIds: string[];
  /** Reserved for future opportunity surface detection */
  surfaceId?: string;
  /** Constraint hypothesis that generated this vector (Phase 1) */
  constraintHypothesisId?: string;
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
//  ZWICKY BOX — Full combinatorial innovation space (PR #20)
//
//  Fritz Zwicky's morphological analysis generates a complete matrix
//  of ALL dimension × alternative combinations, not just 1-2 variable
//  shifts. This includes:
//   - Viable combinations (qualified through standard gates)
//   - Disqualified / impossible combinations with explicit reasoning
//   - "What would need to be true?" prompts for disqualified cells
//
//  References: Zwicky (1969) "Discovery, Invention, Research Through
//  the Morphological Approach"; DARPA problem-space enumeration practice
// ═══════════════════════════════════════════════════════════════

export type ZwickyCellStatus = "viable" | "disqualified" | "requires_investigation";

export interface ZwickyBoxCell {
  /** Row dimension */
  rowDimensionId: string;
  rowDimensionName: string;
  rowValue: string;
  /** Column dimension */
  colDimensionId: string;
  colDimensionName: string;
  colValue: string;
  /** Whether this combination is viable, disqualified, or needs investigation */
  status: ZwickyCellStatus;
  /** If disqualified: why this combination cannot coexist */
  disqualificationReason: string | null;
  /**
   * PR #20 requirement: for disqualified cells, surface the condition
   * under which the combination could become viable.
   */
  whatWouldNeedToBeTrue: string | null;
  /** Novelty/disruption signal for viable cells */
  noveltyScore: number; // 0-10
  /** Brief rationale for the assessment */
  rationale: string;
}

export interface ZwickyBox {
  /** All cells in the matrix (viable + disqualified) */
  cells: ZwickyBoxCell[];
  /** Only viable cells */
  viableCells: ZwickyBoxCell[];
  /** Only disqualified/impossible cells — surfaced for red-team review */
  disqualifiedCells: ZwickyBoxCell[];
  /** Cells that need more investigation before qualification */
  investigationCells: ZwickyBoxCell[];
  /** Dimensions represented in rows */
  rowDimensions: BusinessDimension[];
  /** Dimensions represented in columns */
  colDimensions: BusinessDimension[];
  /** Total combinations evaluated */
  totalCombinations: number;
  /** Disqualification rate (0-1) — high rate signals a tightly constrained system */
  disqualificationRate: number;
}

// ─── Disqualification Rules ────────────────────────────────────────────────────

interface DisqualificationRule {
  /** Pattern in row dimension value that triggers this rule */
  rowPattern: RegExp;
  /** Pattern in column dimension value that triggers this rule */
  colPattern: RegExp;
  /** Optional: only apply if these categories are involved */
  applicableCategories?: [EvidenceCategory, EvidenceCategory];
  reason: string;
  whatWouldNeedToBeTrue: string;
}

const DISQUALIFICATION_RULES: DisqualificationRule[] = [
  {
    rowPattern: /freemium|free.tier|zero.cost/i,
    colPattern: /premium|high.price|luxury|enterprise/i,
    reason: "A freemium/zero-cost positioning cannot coexist with premium pricing in the same offering — they signal contradictory value positions to the same customer segment",
    whatWouldNeedToBeTrue: "Separate the two tiers into distinct products with clearly differentiated branding and target segments (e.g., Canva Free vs. Canva Pro), OR commit fully to one pricing strategy",
  },
  {
    rowPattern: /mass.market|broad.access|commodity/i,
    colPattern: /bespoke|custom|artisan|handcrafted|specialist/i,
    reason: "Mass-market distribution requires standardization that is incompatible with bespoke/custom delivery — operational economics cannot simultaneously support both",
    whatWouldNeedToBeTrue: "Create a digital 'configurator' layer that makes customization feel bespoke while delivering standardized outputs (e.g., Custom Ink using templates for apparent custom apparel)",
  },
  {
    rowPattern: /high.frequency|daily|recurring|continuous/i,
    colPattern: /high.cost|premium.price|luxury/i,
    applicableCategories: ["pricing_model", "customer_behavior"],
    reason: "High-frequency usage with premium pricing faces affordability ceiling — customers rationalize high price for infrequent purchases but resist it for daily-frequency products",
    whatWouldNeedToBeTrue: "Justify daily premium pricing by demonstrating demonstrably superior daily outcomes (e.g., daily luxury coffee at $7 works because of ritual value), OR shift to a subscription that amortizes the per-use cost",
  },
  {
    rowPattern: /direct.to.consumer|dtc|self.serve/i,
    colPattern: /complex|expert.only|specialist|technical/i,
    reason: "DTC self-service delivery requires low complexity — highly technical or expert-only products cannot be sold DTC without expert intermediaries or significant customer education investment",
    whatWouldNeedToBeTrue: "Invest in guided-selling tools, in-app expert support, or certification programs that make expert-level complexity accessible to non-experts (e.g., LegalZoom making legal forms DTC)",
  },
  {
    rowPattern: /low.margin|commodity.pric|race.to.bottom/i,
    colPattern: /high.service|white.glove|concierge|premium.support/i,
    reason: "Commodity pricing is structurally incompatible with white-glove service — the cost structure required for premium service cannot be absorbed at commodity margins",
    whatWouldNeedToBeTrue: "Prove premium service can drive sufficient ACV uplift to justify the cost (typically 3-5× price premium required), OR automate the premium service layer to reduce its cost below commodity margin threshold",
  },
  {
    rowPattern: /asset.light|marketplace|platform/i,
    colPattern: /own.inventory|vertical.integrat|direct.manufactur/i,
    reason: "Asset-light marketplace model is structurally incompatible with owned inventory or vertical integration — they require opposite capital allocation strategies",
    whatWouldNeedToBeTrue: "Adopt a hybrid 'managed marketplace' model where some inventory is owned as quality anchor while the majority remains asset-light (e.g., Uber Eats with partner restaurants but branded delivery)",
  },
  {
    rowPattern: /open.source|free|community/i,
    colPattern: /proprietary|closed|IP.protected|patent/i,
    reason: "Open-source/community model is philosophically and legally incompatible with proprietary/closed IP protection in the same product layer",
    whatWouldNeedToBeTrue: "Separate open and proprietary layers explicitly: open-core model where the core is open but enterprise features are proprietary (e.g., HashiCorp, Elastic, GitLab)",
  },
  {
    rowPattern: /real.time|instant|live|synchronous/i,
    colPattern: /async|batch|offline|delayed/i,
    applicableCategories: ["technology_dependency", "operational_dependency"],
    reason: "Real-time delivery and async/batch processing cannot coexist in the same user experience layer — they require different infrastructure and create contradictory user expectations",
    whatWouldNeedToBeTrue: "Architect a dual-mode system: real-time for user-facing interactions, async for backend processing (e.g., Shopify real-time checkout with batch inventory reconciliation)",
  },
];

// ─── Novelty Scoring ──────────────────────────────────────────────────────────

/** Score how novel/disruptive a dimension × dimension combination is */
function scoreNovelty(
  rowDim: BusinessDimension,
  rowAlt: string,
  colDim: BusinessDimension,
  colAlt: string,
): number {
  let score = 5; // baseline

  // Boost: cross-category combinations are more novel
  if (rowDim.category !== colDim.category) score += 1;

  // Boost: constraint-linked dimensions signal higher disruption potential
  if (rowDim.hasConstraint || colDim.hasConstraint) score += 1;
  if (rowDim.hasConstraint && colDim.hasConstraint) score += 1;

  // Boost: combinations involving pricing + delivery are often transformational
  const pricingInvolved = rowDim.category === "pricing_model" || colDim.category === "pricing_model";
  const distributionInvolved = rowDim.category === "distribution_channel" || colDim.category === "distribution_channel";
  if (pricingInvolved && distributionInvolved) score += 1;

  // Penalty: same-category combinations are often incremental
  if (rowDim.category === colDim.category) score -= 1;

  // Boost: "hot" dimensions (constraint-linked)
  if (rowDim.status === "hot" && colDim.status === "hot") score += 1;

  return Math.max(1, Math.min(10, score));
}

/**
 * Generate a full Zwicky Box (combinatorial morphological matrix) from
 * the active baseline and AI-generated alternatives.
 *
 * PR #20: Systematically includes and surfaces disqualified/impossible
 * combinations with explicit "What would need to be true?" reasoning.
 *
 * @param baseline    Active business dimensions (hot + warm)
 * @param alternatives AI-generated alternative values per dimension
 * @returns Full Zwicky Box with viable + disqualified cells
 */
export function buildZwickyBox(
  baseline: BusinessBaseline,
  alternatives: DimensionAlternative[],
): ZwickyBox {
  const dims = Object.values(baseline).filter(d => d.status !== "inactive");

  // Build alternative value lookup
  const altsByDim: Record<string, string[]> = {};
  for (const alt of alternatives) {
    const normalizedId = alt.dimensionId.startsWith("dim-") ? alt.dimensionId : `dim-${alt.dimensionId}`;
    if (!altsByDim[normalizedId]) altsByDim[normalizedId] = [];
    altsByDim[normalizedId].push(alt.value);
  }

  const cells: ZwickyBoxCell[] = [];

  // Generate all dimension × dimension pairs (upper triangle only to avoid duplicates)
  for (let i = 0; i < dims.length; i++) {
    for (let j = i + 1; j < dims.length; j++) {
      const rowDim = dims[i];
      const colDim = dims[j];

      const rowAlts = [rowDim.currentValue, ...(altsByDim[rowDim.id] || [])];
      const colAlts = [colDim.currentValue, ...(altsByDim[colDim.id] || [])];

      // Cap at 3 alternatives per dimension to control matrix size
      const rowValues = rowAlts.slice(0, 3);
      const colValues = colAlts.slice(0, 3);

      for (const rowVal of rowValues) {
        for (const colVal of colValues) {
          // Skip baseline × baseline (current state)
          if (rowVal === rowDim.currentValue && colVal === colDim.currentValue) continue;

          // Check for disqualification
          let disqualified = false;
          let disqualificationReason: string | null = null;
          let whatWouldNeedToBeTrue: string | null = null;

          for (const rule of DISQUALIFICATION_RULES) {
            const rowMatch = rule.rowPattern.test(rowVal) || rule.rowPattern.test(rowDim.name);
            const colMatch = rule.colPattern.test(colVal) || rule.colPattern.test(colDim.name);

            if (!rowMatch || !colMatch) continue;

            // Optional category filter
            if (rule.applicableCategories) {
              const [catA, catB] = rule.applicableCategories;
              const catMatch =
                (rowDim.category === catA && colDim.category === catB) ||
                (rowDim.category === catB && colDim.category === catA);
              if (!catMatch) continue;
            }

            disqualified = true;
            disqualificationReason = rule.reason;
            whatWouldNeedToBeTrue = rule.whatWouldNeedToBeTrue;
            break;
          }

          // Determine status
          let status: ZwickyCellStatus;
          if (disqualified) {
            status = "disqualified";
          } else {
            // Mark cross-constraint combinations that lack strong evidence as needing investigation
            const bothHot = rowDim.status === "hot" && colDim.status === "hot";
            const lowEvidence = rowDim.evidenceCount < 3 || colDim.evidenceCount < 3;
            status = bothHot && lowEvidence ? "requires_investigation" : "viable";
          }

          const noveltyScore = status === "viable" || status === "requires_investigation"
            ? scoreNovelty(rowDim, rowVal, colDim, colVal)
            : 0;

          const rationale = disqualified
            ? `DISQUALIFIED: ${disqualificationReason}`
            : `Viable combination: ${rowDim.name} → "${rowVal}" paired with ${colDim.name} → "${colVal}"`;

          cells.push({
            rowDimensionId: rowDim.id,
            rowDimensionName: rowDim.name,
            rowValue: rowVal,
            colDimensionId: colDim.id,
            colDimensionName: colDim.name,
            colValue: colVal,
            status,
            disqualificationReason,
            whatWouldNeedToBeTrue,
            noveltyScore,
            rationale,
          });
        }
      }
    }
  }

  const viableCells = cells.filter(c => c.status === "viable");
  const disqualifiedCells = cells.filter(c => c.status === "disqualified");
  const investigationCells = cells.filter(c => c.status === "requires_investigation");

  return {
    cells,
    viableCells,
    disqualifiedCells,
    investigationCells,
    rowDimensions: dims,
    colDimensions: dims,
    totalCombinations: cells.length,
    disqualificationRate: cells.length > 0 ? disqualifiedCells.length / cells.length : 0,
  };
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
  diagnosticCtx?: DiagnosticContext | null,
): BusinessBaseline {
  const updated = { ...baseline };
  const priorityCategories = getModePriorityDimensions(diagnosticCtx);

  for (const [key, dim] of Object.entries(updated)) {
    const newDim = { ...dim };

    if (newDim.hasConstraint || newDim.hasLeverage || priorityCategories.includes(newDim.category)) {
      // hot: linked to a constraint/leverage point OR promoted by the active mode
      newDim.status = "hot";
    } else if (newDim.evidenceCount >= 2) {
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
//  CONSTRAINT STRENGTH SCORING
// ═══════════════════════════════════════════════════════════════

export interface ConstraintStrength {
  constraintId: string;
  label: string;
  /** impact × confidence × log(1 + evidenceVolume) */
  strength: number;
  impact: number;
  confidence: number;
  evidenceVolume: number;
  /** Normalized priority weight (0–1, sums to 1 across all constraints) */
  priorityWeight: number;
}

/**
 * Compute composite strength scores for constraints.
 * strength = impact × confidence × log2(1 + evidenceVolume)
 * 
 * This biases morphological exploration toward well-evidenced, high-impact
 * constraints while still allowing weaker ones to contribute.
 */
export function computeConstraintStrengths(
  constraints: StrategicInsight[],
): ConstraintStrength[] {
  const scored = constraints.map(c => {
    const evidenceVolume = c.evidenceIds.length;
    const strength = c.impact * (c.confidenceScore ?? c.confidence) * Math.log2(1 + evidenceVolume);
    return {
      constraintId: c.id,
      label: c.label,
      strength,
      impact: c.impact,
      confidence: c.confidenceScore ?? (typeof c.confidence === "number" ? c.confidence : 0.5),
      evidenceVolume,
      priorityWeight: 0, // computed below
    };
  });

  // Normalize to priority weights
  const totalStrength = scored.reduce((s, c) => s + c.strength, 0);
  if (totalStrength > 0) {
    for (const s of scored) {
      s.priorityWeight = s.strength / totalStrength;
    }
  }

  // Sort descending by strength
  scored.sort((a, b) => b.strength - a.strength);
  return scored;
}

// ═══════════════════════════════════════════════════════════════
//  STAGE 3: COMBINE BASELINE WITH AI ALTERNATIVES → VECTORS
// ═══════════════════════════════════════════════════════════════

/**
 * Generates opportunity vectors by combining baseline dimensions with
 * AI-generated alternative values. Each vector represents a 1–2 dimension
 * shift from the current configuration.
 * 
 * Constraint strength biases how many vectors are generated per dimension:
 * stronger constraints get more exploration budget.
 */
export function generateOpportunityVectors(
  baseline: BusinessBaseline,
  alternatives: DimensionAlternative[],
  constraints: StrategicInsight[],
  leveragePoints: StrategicInsight[],
  constraintStrengths?: ConstraintStrength[],
): OpportunityVector[] {
  const vectors: OpportunityVector[] = [];
  const hotDims = getDimensionsByStatus(baseline, "hot");
  const warmDims = getDimensionsByStatus(baseline, "warm");

  // Build strength lookup for priority biasing
  const strengthMap = new Map<string, number>();
  if (constraintStrengths) {
    for (const cs of constraintStrengths) {
      strengthMap.set(cs.constraintId, cs.priorityWeight);
    }
  }

  // Group alternatives by dimension — normalize IDs
  const altsByDim: Record<string, DimensionAlternative[]> = {};
  for (const alt of alternatives) {
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

    // Compute dimension priority weight from linked constraints
    const dimPriority = triggerIds.reduce((sum, tid) => sum + (strengthMap.get(tid) || 0), 0);

    // Priority-biased cap: stronger constraint-linked dims get more vectors
    const maxAlts = mode === "constraint"
      ? Math.max(2, Math.ceil(dimAlts.length * Math.min(1, 0.5 + dimPriority)))
      : Math.min(2, dimAlts.length);

    for (let ai = 0; ai < Math.min(maxAlts, dimAlts.length); ai++) {
      const alt = dimAlts[ai];
      const explorationType: ExplorationType = mode === "constraint"
        ? "constraint_resolution"
        : "structural_exploration";

      vectors.push({
        id: nextVectorId(),
        changedDimensions: [{ dimension: dim.name, from: dim.currentValue, to: alt.value }],
        triggerIds,
        explorationMode: mode,
        explorationType,
        rationale: alt.rationale,
        evidenceIds: dim.evidenceIds,
      });
    }
  }

  // ── Two-dimension shifts (hot × hot only, max 2 changes) ──
  // Priority-order hot dims by constraint strength
  const sortedHot = [...hotDims].sort((a, b) => {
    const aPriority = constraints
      .filter(c => c.evidenceIds.some(eid => a.evidenceIds.includes(eid)))
      .reduce((sum, c) => sum + (strengthMap.get(c.id) || 0), 0);
    const bPriority = constraints
      .filter(c => c.evidenceIds.some(eid => b.evidenceIds.includes(eid)))
      .reduce((sum, c) => sum + (strengthMap.get(c.id) || 0), 0);
    return bPriority - aPriority;
  });

  if (sortedHot.length >= 2) {
    for (let i = 0; i < sortedHot.length && i < 3; i++) {
      for (let j = i + 1; j < sortedHot.length && j < 4; j++) {
        const dimA = sortedHot[i];
        const dimB = sortedHot[j];
        const altsA = altsByDim[dimA.id] || [];
        const altsB = altsByDim[dimB.id] || [];

        if (altsA.length === 0 || altsB.length === 0) continue;

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
          explorationType: "constraint_resolution",
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

export interface MorphologicalSearchDiagnostics {
  /** Active constraint count */
  totalActiveConstraints: number;
  /** Constraint strength scores */
  constraintStrengths: ConstraintStrength[];
  /** Number of warm dimensions activated */
  warmDimensionCount: number;
  /** Number of hot dimensions activated */
  hotDimensionCount: number;
  /** Total vectors before qualification gates */
  vectorsBeforeGates: number;
  /** Total vectors after qualification gates */
  vectorsAfterGates: number;
  /** Pattern-sourced vector count */
  patternVectorCount: number;
  /** Morphological-sourced vector count */
  morphologicalVectorCount: number;
}

export interface MorphologicalSearchResult {
  baseline: BusinessBaseline;
  vectors: OpportunityVector[];
  zones: OpportunityZone[];
  activeDimensionCount: number;
  hotCount: number;
  warmCount: number;
  /** Origin metadata for each vector — keyed by vector ID */
  vectorOrigins: Map<string, import("@/lib/strategicPatternLibrary").VectorOrigin>;
  /** Interaction map between vectors (reinforcing/conflicting/orthogonal) */
  vectorInteractions: Map<string, import("@/lib/strategicPatternLibrary").VectorInteraction[]>;
  patternVectorCount: number;
  /** Diagnostic report for the search process */
  diagnostics: MorphologicalSearchDiagnostics;
  /**
   * PR #20 — Full Zwicky Box:
   * Complete combinatorial matrix including viable AND disqualified combinations.
   * Disqualified cells surface "What would need to be true?" prompts.
   */
  zwickyBox: ZwickyBox | null;
}

/**
 * Run the complete morphological search pipeline.
 * Called by strategicEngine Stage 7 after receiving AI alternatives.
 *
 * Execution order:
 *   1. Extract baseline
 *   2. Identify active dimensions
 *   3. Compute constraint strengths
 *   4. Apply structural patterns (pattern library) → candidate vectors
 *   5. Generate AI alternative vectors (morphological shifts, strength-biased)
 *   6. Merge all vectors
 *   7. Qualification gates (uniform)
 *   8. Cluster into zones
 */
export function runMorphologicalSearch(
  flatEvidence: Evidence[],
  constraints: StrategicInsight[],
  leveragePoints: StrategicInsight[],
  aiAlternatives: DimensionAlternative[],
  diagnosticCtx?: DiagnosticContext | null,
): MorphologicalSearchResult {
  resetCounters();

  // Stage 1: Extract baseline
  const rawBaseline = extractBaseline(flatEvidence, constraints, leveragePoints);

  // Stage 2: Identify active dimensions (mode-aware when context is provided)
  const baseline = identifyActiveDimensions(rawBaseline, constraints, leveragePoints, diagnosticCtx);

  const hotDims = getDimensionsByStatus(baseline, "hot");
  const warmDims = getDimensionsByStatus(baseline, "warm");

  // Stage 2.5: Compute constraint strengths
  const constraintStrengths = computeConstraintStrengths(constraints);

  // Stage 3a: Apply structural patterns FIRST (deterministic, mechanism-tagged)
  const constraintInputs = constraints.map(c => ({ id: c.id, evidenceIds: c.evidenceIds }));
  const leverageInputs = leveragePoints.map(l => ({ id: l.id, evidenceIds: l.evidenceIds }));
  const { vectors: patternVectors, origins: patternOrigins } = applyPatterns(
    baseline, constraintInputs, leverageInputs, flatEvidence
  );

  // Stage 3b: Generate AI alternative vectors (morphological shifts, strength-biased)
  const aiVectors = generateOpportunityVectors(
    baseline, aiAlternatives, constraints, leveragePoints, constraintStrengths
  );

  // Tag AI vectors with morphological origin
  const allOrigins = new Map(patternOrigins);
  for (const v of aiVectors) {
    allOrigins.set(v.id, {
      source: "morphological" as const,
      noveltyTag: "structural" as const,
      mechanismStrength: 2,
      feasibilityFlags: {
        regulatoryRisk: "low" as const,
        implementationComplexity: "moderate" as const,
        switchingFriction: "moderate" as const,
        operationalBurden: "moderate" as const,
      },
      precedentSignals: [],
      reasoningChain: {
        signal: "AI-generated morphological shift",
        constraint: v.triggerIds.length > 0 ? "Linked to detected constraint" : "Adjacency exploration",
        pattern: "Morphological search",
        mechanism: v.rationale.slice(0, 100),
        opportunity: v.changedDimensions.map(d => d.to).join("; "),
      },
    });
  }

  // Stage 4: Merge all vectors, pattern-first
  const allVectors = [...patternVectors, ...aiVectors];
  const vectorsBeforeGates = allVectors.length;

  // Stage 5: Apply qualification gates (uniform across all sources)
  const qualifiedVectors = applyQualificationGates(allVectors, constraints, flatEvidence, baseline);

  // Stage 6: Detect interactions between qualified vectors
  const vectorInteractions = detectInteractions(qualifiedVectors);

  // Stage 7: Cluster into zones
  const zones = clusterIntoZones(qualifiedVectors);

  // Build diagnostics
  const diagnostics: MorphologicalSearchDiagnostics = {
    totalActiveConstraints: constraints.length,
    constraintStrengths,
    warmDimensionCount: warmDims.length,
    hotDimensionCount: hotDims.length,
    vectorsBeforeGates,
    vectorsAfterGates: qualifiedVectors.length,
    patternVectorCount: patternVectors.length,
    morphologicalVectorCount: aiVectors.length,
  };

  return {
    baseline,
    vectors: qualifiedVectors,
    zones,
    activeDimensionCount: hotDims.length + warmDims.length,
    hotCount: hotDims.length,
    warmCount: warmDims.length,
    vectorOrigins: allOrigins,
    vectorInteractions,
    patternVectorCount: patternVectors.length,
    diagnostics,
    zwickyBox: (hotDims.length + warmDims.length) > 0 ? buildZwickyBox(baseline, aiAlternatives) : null,
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
