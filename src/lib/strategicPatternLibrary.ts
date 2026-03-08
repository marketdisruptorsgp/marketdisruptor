/**
 * STRATEGIC PATTERN LIBRARY — Structural Transformation Engine
 *
 * Named innovation patterns representing fundamental ways markets change.
 * Each pattern encodes a category-level structural shift (not parameter tweaks).
 *
 * Patterns generate candidate OpportunityVectors that flow into the same
 * qualification gates, novelty checks, and clustering as all other vectors.
 *
 * Architecture:
 *   Pattern × Hot/Warm Dimension → Candidate Vector (tagged origin: "pattern")
 *   → merges with AI alternatives → unified pipeline
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type {
  BusinessBaseline,
  BusinessDimension,
  DimensionShift,
  EvidenceCategory,
  OpportunityVector,
} from "@/lib/opportunityDesignEngine";
import { getDimensionsByStatus } from "@/lib/opportunityDesignEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type PatternMagnitude = "structural" | "parametric";

export type NoveltyTag = "breakthrough" | "structural" | "incremental" | "saturated";

export interface VectorOrigin {
  source: "pattern" | "contrarian" | "morphological" | "transfer";
  patternId?: string;
  constraintId?: string;
  noveltyTag: NoveltyTag;
  warmDerived?: boolean;
}

export interface StrategicPattern {
  id: string;
  name: string;
  /** The structural transformation this pattern represents */
  transformation: string;
  /** How the transformation creates value */
  mechanism: string;
  /** Which evidence categories this pattern can target */
  applicableDimensions: EvidenceCategory[];
  /** Magnitude — all initial patterns are structural */
  magnitude: PatternMagnitude;
  /**
   * Trigger condition: given a dimension and its evidence, should this pattern fire?
   * Only called for hot/warm dimensions whose category is in applicableDimensions.
   */
  triggerCondition: (dim: BusinessDimension, evidence: Evidence[]) => boolean;
  /**
   * Describes the target state after transformation.
   * Receives the current value and returns the shifted value description.
   */
  transformValue: (currentValue: string, dimName: string) => string;
  /** Rationale template — filled per application */
  rationaleTemplate: string;
}

// ═══════════════════════════════════════════════════════════════
//  PATTERN DEFINITIONS — 10 Structural Transformations
// ═══════════════════════════════════════════════════════════════

function textMatches(text: string, patterns: RegExp): boolean {
  return patterns.test(text.toLowerCase());
}

function dimTextOf(dim: BusinessDimension): string {
  return `${dim.name} ${dim.currentValue}`.toLowerCase();
}

export const STRATEGIC_PATTERNS: StrategicPattern[] = [
  // ── 1. Ownership → Access ──
  {
    id: "ownership_to_access",
    name: "Ownership → Access",
    transformation: "Convert ownership-based models to access-based models",
    mechanism: "Replace upfront purchase with on-demand access, lowering customer commitment and expanding addressable market.",
    applicableDimensions: ["pricing_model", "distribution_channel", "customer_behavior"],
    magnitude: "structural",
    triggerCondition: (dim) =>
      textMatches(dimTextOf(dim), /purchase|buy|own|upfront|capital|one.?time|outright|invest/),
    transformValue: (cv, name) =>
      `Access-based model: on-demand usage replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Structural shift from ownership to access reduces customer commitment barrier and expands addressable market by lowering entry cost.",
  },

  // ── 2. Bundled → Unbundled ──
  {
    id: "bundled_to_unbundled",
    name: "Bundled → Unbundled",
    transformation: "Decompose bundled offerings into independently purchasable components",
    mechanism: "Separate a monolithic offering into modular components, enabling customers to pay only for what they value.",
    applicableDimensions: ["pricing_model", "demand_signal", "customer_behavior", "cost_structure"],
    magnitude: "structural",
    triggerCondition: (dim) =>
      textMatches(dimTextOf(dim), /bundle|package|all.?in|suite|comprehensive|full.?service|combo|tier/),
    transformValue: (cv) =>
      `Unbundled: individually purchasable components from ${cv.slice(0, 50)}`,
    rationaleTemplate: "Unbundling the current offering allows customers to select and pay for individual value components, reducing waste and improving price-to-value alignment.",
  },

  // ── 3. Closed System → Platform ──
  {
    id: "closed_to_platform",
    name: "Closed System → Platform",
    transformation: "Open a closed system to third-party participation",
    mechanism: "Transform a vertically integrated system into a platform that enables external participants to create and capture value.",
    applicableDimensions: ["distribution_channel", "technology_dependency", "competitive_pressure", "operational_dependency"],
    magnitude: "structural",
    triggerCondition: (dim) =>
      textMatches(dimTextOf(dim), /proprietary|closed|vertical|integrated|exclusive|internal|in.?house|walled/),
    transformValue: (cv) =>
      `Open platform: third-party participation replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Opening the system to third-party contributors creates network effects and shifts value creation from internal capacity to ecosystem scale.",
  },

  // ── 4. Service → Productized System ──
  {
    id: "service_to_product",
    name: "Service → Productized System",
    transformation: "Convert bespoke services into repeatable, scalable products",
    mechanism: "Encode service expertise into a standardized, self-serve product that removes the labor constraint on scaling.",
    applicableDimensions: ["operational_dependency", "cost_structure", "pricing_model", "customer_behavior"],
    magnitude: "structural",
    triggerCondition: (dim) =>
      textMatches(dimTextOf(dim), /bespoke|custom|consult|manual|service|labor|hourly|per.?project|hands.?on|artisan/),
    transformValue: (cv) =>
      `Productized system: standardized, self-serve replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Productizing the service removes linear labor scaling constraints and enables margin expansion through repeatability.",
  },

  // ── 5. Fragmented Supply → Aggregated Marketplace ──
  {
    id: "fragmented_to_aggregated",
    name: "Fragmented Supply → Aggregated Marketplace",
    transformation: "Aggregate fragmented suppliers into a unified marketplace",
    mechanism: "Create a single interface over many small suppliers, reducing search costs and enabling price/quality comparison.",
    applicableDimensions: ["distribution_channel", "competitive_pressure", "demand_signal", "customer_behavior"],
    magnitude: "structural",
    triggerCondition: (dim) =>
      textMatches(dimTextOf(dim), /fragment|scatter|local|many\s*small|independ|cottage|dispersed|niche\s*player/),
    transformValue: (cv) =>
      `Aggregated marketplace: unified discovery replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Aggregating fragmented supply reduces customer search costs and creates a defensible position through supply-side network effects.",
  },

  // ── 6. Linear Value Chain → Ecosystem Network ──
  {
    id: "linear_to_ecosystem",
    name: "Linear Value Chain → Ecosystem Network",
    transformation: "Replace sequential value chains with multi-sided ecosystem networks",
    mechanism: "Enable multiple participant types to interact and create value simultaneously rather than in a fixed sequence.",
    applicableDimensions: ["distribution_channel", "operational_dependency", "competitive_pressure"],
    magnitude: "structural",
    triggerCondition: (dim) =>
      textMatches(dimTextOf(dim), /linear|sequential|chain|supply\s*chain|step.?by|intermediar|middl|pipeline|waterfall/),
    transformValue: (cv) =>
      `Ecosystem network: multi-sided value creation replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Replacing the linear chain with an ecosystem network creates compounding value through multi-directional participant interactions.",
  },

  // ── 7. Manual Service → Automated Software ──
  {
    id: "manual_to_automated",
    name: "Manual Service → Automated Software",
    transformation: "Automate manual processes through software",
    mechanism: "Replace human-dependent workflows with software automation, enabling near-zero marginal cost at scale.",
    applicableDimensions: ["operational_dependency", "cost_structure", "technology_dependency"],
    magnitude: "structural",
    triggerCondition: (dim) =>
      textMatches(dimTextOf(dim), /manual|human|labor|hand|staff|employ|workforce|paper|phone|person/),
    transformValue: (cv) =>
      `Software-automated: zero-marginal-cost system replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Automating the manual process eliminates the labor-cost scaling constraint and creates margin expansion at volume.",
  },

  // ── 8. One-Time Sale → Recurring Relationship ──
  {
    id: "onetime_to_recurring",
    name: "One-Time Sale → Recurring Relationship",
    transformation: "Convert transactional revenue to recurring revenue",
    mechanism: "Shift from one-time transactions to ongoing relationships, increasing predictability and lifetime value.",
    applicableDimensions: ["pricing_model", "customer_behavior", "demand_signal"],
    magnitude: "structural",
    triggerCondition: (dim) =>
      textMatches(dimTextOf(dim), /one.?time|transact|single|per.?unit|spot|pay.?once|project.?based|episod/),
    transformValue: (cv) =>
      `Recurring relationship: ongoing value delivery replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Converting to recurring revenue increases customer lifetime value and creates predictable cash flows that reduce business fragility.",
  },

  // ── 9. Intermediated → Direct-to-Consumer ──
  {
    id: "intermediated_to_direct",
    name: "Intermediated → Direct-to-Consumer",
    transformation: "Remove intermediaries to connect directly with end customers",
    mechanism: "Disintermediate the value chain to capture margin currently absorbed by middlemen and gain direct customer relationship.",
    applicableDimensions: ["distribution_channel", "cost_structure", "customer_behavior"],
    magnitude: "structural",
    triggerCondition: (dim) =>
      textMatches(dimTextOf(dim), /intermediar|broker|agent|dealer|reseller|wholesal|distributor|middl|retail\s*partner/),
    transformValue: (cv) =>
      `Direct-to-consumer: removing intermediaries from ${cv.slice(0, 50)}`,
    rationaleTemplate: "Disintermediating the distribution chain captures margin currently lost to middlemen and establishes a direct customer relationship for data and retention advantages.",
  },

  // ── 10. Fixed Pricing → Usage-Based ──
  {
    id: "fixed_to_usage",
    name: "Fixed Pricing → Usage-Based",
    transformation: "Replace fixed pricing with consumption-based pricing",
    mechanism: "Align price to value consumed, reducing adoption friction and enabling land-and-expand revenue growth.",
    applicableDimensions: ["pricing_model", "customer_behavior", "demand_signal"],
    magnitude: "structural",
    triggerCondition: (dim) =>
      textMatches(dimTextOf(dim), /fixed|flat|monthly|annual|subscription|seat.?based|per.?license|membership/),
    transformValue: (cv) =>
      `Usage-based pricing: pay-per-consumption replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Usage-based pricing aligns cost to value received, lowering the adoption barrier and enabling organic revenue expansion with usage growth.",
  },
];

// ═══════════════════════════════════════════════════════════════
//  PATTERN APPLICATION ENGINE
// ═══════════════════════════════════════════════════════════════

let patternVectorCounter = 0;

function nextPatternVectorId(): string {
  return `pv-${++patternVectorCounter}`;
}

export function resetPatternCounters(): void {
  patternVectorCounter = 0;
}

/**
 * Apply all structural patterns against active baseline dimensions.
 *
 * Hot dimensions: patterns fire if trigger matches.
 * Warm dimensions: patterns fire only if evidenceCount ≥ 4 AND trigger matches.
 *
 * Returns canonical OpportunityVectors with origin metadata.
 */
export function applyPatterns(
  baseline: BusinessBaseline,
  constraints: { id: string; evidenceIds: string[] }[],
  leveragePoints: { id: string; evidenceIds: string[] }[],
  flatEvidence: Evidence[],
): { vectors: OpportunityVector[]; origins: Map<string, VectorOrigin> } {
  resetPatternCounters();

  const vectors: OpportunityVector[] = [];
  const origins = new Map<string, VectorOrigin>();

  const hotDims = getDimensionsByStatus(baseline, "hot");
  const warmDims = getDimensionsByStatus(baseline, "warm").filter(d => d.evidenceCount >= 4);

  const allActiveDims = [
    ...hotDims.map(d => ({ dim: d, isWarm: false })),
    ...warmDims.map(d => ({ dim: d, isWarm: true })),
  ];

  for (const { dim, isWarm } of allActiveDims) {
    // Get evidence items for this dimension
    const dimEvidence = flatEvidence.filter(e => dim.evidenceIds.includes(e.id));

    for (const pattern of STRATEGIC_PATTERNS) {
      // Check if pattern applies to this dimension's category
      if (!pattern.applicableDimensions.includes(dim.category)) continue;

      // Check trigger condition
      if (!pattern.triggerCondition(dim, dimEvidence)) continue;

      // Generate the transformation
      const shiftedValue = pattern.transformValue(dim.currentValue, dim.name);

      // Find trigger IDs (constraints/leverage referencing this dimension's evidence)
      const triggerIds = [
        ...constraints.filter(c => c.evidenceIds.some(eid => dim.evidenceIds.includes(eid))).map(c => c.id),
        ...leveragePoints.filter(l => l.evidenceIds.some(eid => dim.evidenceIds.includes(eid))).map(l => l.id),
      ];

      const shift: DimensionShift = {
        dimension: dim.name,
        from: dim.currentValue,
        to: shiftedValue,
      };

      const id = nextPatternVectorId();

      vectors.push({
        id,
        changedDimensions: [shift],
        triggerIds,
        explorationMode: dim.hasConstraint ? "constraint" : "adjacency",
        rationale: pattern.rationaleTemplate,
        evidenceIds: dim.evidenceIds,
      });

      origins.set(id, {
        source: "pattern",
        patternId: pattern.id,
        noveltyTag: "structural", // All pattern vectors start as structural; novelty gate may adjust
        warmDerived: isWarm,
      });
    }
  }

  return { vectors, origins };
}

/**
 * Get pattern metadata by ID — used for UI display of origin traceability.
 */
export function getPatternById(patternId: string): StrategicPattern | undefined {
  return STRATEGIC_PATTERNS.find(p => p.id === patternId);
}

/**
 * Get all pattern IDs and names — for UI listing.
 */
export function listPatterns(): { id: string; name: string; transformation: string }[] {
  return STRATEGIC_PATTERNS.map(p => ({
    id: p.id,
    name: p.name,
    transformation: p.transformation,
  }));
}
