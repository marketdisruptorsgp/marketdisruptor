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
 *   Pattern × Hot/Warm Dimension → Relevance Scoring → Top-2 Selection
 *   → Candidate Vector (tagged origin: "pattern") with mechanism strength,
 *     feasibility flags, precedent signals, and reasoning chain
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

export type MarketMaturity = "emerging" | "growing" | "mature" | "saturated";

export type RiskLevel = "low" | "moderate" | "high";

export interface MechanismProfile {
  /** Does the pattern shift fixed→variable cost structure? */
  economicLeverage: boolean;
  /** Does it remove a linear scaling constraint? */
  scalability: boolean;
  /** Does it create network effects or switching costs? */
  defensibility: boolean;
}

export interface FeasibilityFlags {
  regulatoryRisk: RiskLevel;
  implementationComplexity: RiskLevel;
  switchingFriction: RiskLevel;
  operationalBurden: RiskLevel;
}

export interface ReasoningChain {
  signal: string;
  constraint: string;
  pattern: string;
  mechanism: string;
  opportunity: string;
}

export interface VectorOrigin {
  source: "pattern" | "contrarian" | "morphological" | "transfer";
  patternId?: string;
  constraintId?: string;
  noveltyTag: NoveltyTag;
  warmDerived?: boolean;
  mechanismStrength: number; // 1–5
  feasibilityFlags: FeasibilityFlags;
  precedentSignals: string[];
  reasoningChain: ReasoningChain;
}

/** Interaction between two opportunity vectors */
export type VectorRelation = "reinforcing" | "orthogonal" | "conflicting";

export interface VectorInteraction {
  vectorId: string;
  relation: VectorRelation;
}

export type ConstraintStrength = "high" | "medium" | "low";

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
  /** Market maturity — how exploited is this pattern already */
  marketMaturity: MarketMaturity;
  /** Mechanism profile for strength computation */
  mechanismProfile: MechanismProfile;
  /** Known precedents for this transformation */
  precedentExamples: string[];
  /** Base feasibility profile */
  baseFeasibility: FeasibilityFlags;
  /**
   * Trigger condition: given a dimension and its evidence, should this pattern fire?
   * Returns a match strength 0–1 for relevance scoring.
   */
  triggerCondition: (dim: BusinessDimension, evidence: Evidence[]) => number;
  /**
   * Describes the target state after transformation.
   */
  transformValue: (currentValue: string, dimName: string) => string;
  /** Rationale template — filled per application */
  rationaleTemplate: string;

  // ── Phase 1 Constraint-First Fields ──

  /** Constraint types this pattern resolves, with strength per constraint */
  strengthByConstraint: Record<string, ConstraintStrength>;
  /** Constraint types where this pattern FAILS — reject if detected */
  contraindications: string[];
  /** Evidence facet types that must exist for this pattern to fire */
  minimumEvidenceRequired: string[];
  /** Industries where this pattern works best */
  strongestIn?: string[];
  /** Industries where this pattern tends to fail */
  weakestIn?: string[];
  /** Pre-conditions that must hold for this pattern to succeed */
  prerequisiteConditions?: string[];
}

// ═══════════════════════════════════════════════════════════════
//  PATTERN DEFINITIONS — 10 Structural Transformations
// ═══════════════════════════════════════════════════════════════

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.toLowerCase().match(pattern);
  return matches ? matches.length : 0;
}

function triggerStrength(dim: BusinessDimension, pattern: RegExp): number {
  const text = `${dim.name} ${dim.currentValue}`.toLowerCase();
  const matches = countMatches(text, pattern);
  if (matches === 0) return 0;
  // Normalize: 1 match = 0.4, 2 = 0.7, 3+ = 1.0
  return Math.min(1, 0.1 + matches * 0.3);
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
    marketMaturity: "mature",
    mechanismProfile: { economicLeverage: true, scalability: true, defensibility: false },
    precedentExamples: ["Netflix (DVD ownership → streaming access)", "Spotify (album purchase → streaming)", "AWS (server purchase → cloud compute)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "moderate", switchingFriction: "moderate", operationalBurden: "moderate" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /purchase|buy|own|upfront|capital|one.?time|outright|invest/g),
    transformValue: (cv) =>
      `Access-based model: on-demand usage replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Structural shift from ownership to access reduces customer commitment barrier and expands addressable market by lowering entry cost.",
    strengthByConstraint: { capital_barrier: "high", forced_bundling: "medium", transactional_revenue: "medium" },
    contraindications: ["regulatory_barrier"],
    minimumEvidenceRequired: ["pricing_model"],
  },

  // ── 2. Bundled → Unbundled ──
  {
    id: "bundled_to_unbundled",
    name: "Bundled → Unbundled",
    transformation: "Decompose bundled offerings into independently purchasable components",
    mechanism: "Separate a monolithic offering into modular components, enabling customers to pay only for what they value.",
    applicableDimensions: ["pricing_model", "demand_signal", "customer_behavior", "cost_structure"],
    magnitude: "structural",
    marketMaturity: "growing",
    mechanismProfile: { economicLeverage: true, scalability: false, defensibility: false },
    precedentExamples: ["Cable TV → streaming unbundling", "Airline unbundling (seat vs baggage vs meals)", "Software suite → modular SaaS tools"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "moderate", switchingFriction: "low", operationalBurden: "moderate" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /bundle|package|all.?in|suite|comprehensive|full.?service|combo|tier/g),
    transformValue: (cv) =>
      `Unbundled: individually purchasable components from ${cv.slice(0, 50)}`,
    rationaleTemplate: "Unbundling the current offering allows customers to select and pay for individual value components, reducing waste and improving price-to-value alignment.",
    strengthByConstraint: { forced_bundling: "high", capital_barrier: "medium", perceived_value_mismatch: "medium" },
    contraindications: [],
    minimumEvidenceRequired: ["pricing_model"],
  },

  // ── 3. Closed System → Platform ──
  {
    id: "closed_to_platform",
    name: "Closed System → Platform",
    transformation: "Open a closed system to third-party participation",
    mechanism: "Transform a vertically integrated system into a platform that enables external participants to create and capture value.",
    applicableDimensions: ["distribution_channel", "technology_dependency", "competitive_pressure", "operational_dependency"],
    magnitude: "structural",
    marketMaturity: "growing",
    mechanismProfile: { economicLeverage: true, scalability: true, defensibility: true },
    precedentExamples: ["Apple App Store (closed device → developer platform)", "Salesforce (CRM → AppExchange platform)", "WeWork (closed offices → shared infrastructure)"],
    baseFeasibility: { regulatoryRisk: "moderate", implementationComplexity: "high", switchingFriction: "moderate", operationalBurden: "moderate" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /proprietary|closed|vertical|integrated|exclusive|internal|in.?house|walled/g),
    transformValue: (cv) =>
      `Open platform: third-party participation replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Opening the system to third-party contributors creates network effects and shifts value creation from internal capacity to ecosystem scale.",
    strengthByConstraint: { capacity_ceiling: "high", linear_scaling: "high", supply_fragmentation: "medium" },
    contraindications: ["regulatory_barrier"],
    minimumEvidenceRequired: ["distribution_channel", "technology_dependency"],
  },

  // ── 4. Service → Productized System ──
  {
    id: "service_to_product",
    name: "Service → Productized System",
    transformation: "Convert bespoke services into repeatable, scalable products",
    mechanism: "Encode service expertise into a standardized, self-serve product that removes the labor constraint on scaling.",
    applicableDimensions: ["operational_dependency", "cost_structure", "pricing_model", "customer_behavior"],
    magnitude: "structural",
    marketMaturity: "growing",
    mechanismProfile: { economicLeverage: true, scalability: true, defensibility: true },
    precedentExamples: ["LegalZoom (legal services → product)", "TurboTax (tax prep → software)", "Canva (design services → self-serve tool)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "high", switchingFriction: "high", operationalBurden: "moderate" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /bespoke|custom|consult|manual|service|labor|hourly|per.?project|hands.?on|artisan/g),
    transformValue: (cv) =>
      `Productized system: standardized, self-serve replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Productizing the service removes linear labor scaling constraints and enables margin expansion through repeatability.",
    strengthByConstraint: { labor_intensity: "high", owner_dependency: "high", manual_process: "high", linear_scaling: "high", skill_scarcity: "medium" },
    contraindications: ["regulatory_barrier"],
    minimumEvidenceRequired: ["operational_dependency"],
  },

  // ── 5. Fragmented Supply → Aggregated Marketplace ──
  {
    id: "fragmented_to_aggregated",
    name: "Fragmented Supply → Aggregated Marketplace",
    transformation: "Aggregate fragmented suppliers into a unified marketplace",
    mechanism: "Create a single interface over many small suppliers, reducing search costs and enabling price/quality comparison.",
    applicableDimensions: ["distribution_channel", "competitive_pressure", "demand_signal", "customer_behavior"],
    magnitude: "structural",
    marketMaturity: "mature",
    mechanismProfile: { economicLeverage: false, scalability: true, defensibility: true },
    precedentExamples: ["Amazon Marketplace (fragmented retail → unified marketplace)", "Uber (fragmented taxi → aggregated ride platform)", "Booking.com (fragmented hotels → aggregated booking)"],
    baseFeasibility: { regulatoryRisk: "moderate", implementationComplexity: "high", switchingFriction: "moderate", operationalBurden: "high" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /fragment|scatter|local|many\s*small|independ|cottage|dispersed|niche\s*player/g),
    transformValue: (cv) =>
      `Aggregated marketplace: unified discovery replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Aggregating fragmented supply reduces customer search costs and creates a defensible position through supply-side network effects.",
    strengthByConstraint: { supply_fragmentation: "high", geographic_constraint: "medium", information_asymmetry: "medium" },
    contraindications: ["regulatory_barrier"],
    minimumEvidenceRequired: ["distribution_channel"],
  },

  // ── 6. Linear Value Chain → Ecosystem Network ──
  {
    id: "linear_to_ecosystem",
    name: "Linear Value Chain → Ecosystem Network",
    transformation: "Replace sequential value chains with multi-sided ecosystem networks",
    mechanism: "Enable multiple participant types to interact and create value simultaneously rather than in a fixed sequence.",
    applicableDimensions: ["distribution_channel", "operational_dependency", "competitive_pressure"],
    magnitude: "structural",
    marketMaturity: "emerging",
    mechanismProfile: { economicLeverage: true, scalability: true, defensibility: true },
    precedentExamples: ["iOS ecosystem (linear supply chain → developer/user/advertiser network)", "Shopify (linear retail → merchant/app/customer ecosystem)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "high", switchingFriction: "high", operationalBurden: "high" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /linear|sequential|chain|supply\s*chain|step.?by|intermediar|middl|pipeline|waterfall/g),
    transformValue: (cv) =>
      `Ecosystem network: multi-sided value creation replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Replacing the linear chain with an ecosystem network creates compounding value through multi-directional participant interactions.",
    strengthByConstraint: { channel_dependency: "high", linear_scaling: "medium", capacity_ceiling: "medium" },
    contraindications: ["regulatory_barrier"],
    minimumEvidenceRequired: ["distribution_channel"],
  },

  // ── 7. Manual Service → Automated Software ──
  {
    id: "manual_to_automated",
    name: "Manual Service → Automated Software",
    transformation: "Automate manual processes through software",
    mechanism: "Replace human-dependent workflows with software automation, enabling near-zero marginal cost at scale.",
    applicableDimensions: ["operational_dependency", "cost_structure", "technology_dependency"],
    magnitude: "structural",
    marketMaturity: "mature",
    mechanismProfile: { economicLeverage: true, scalability: true, defensibility: false },
    precedentExamples: ["Wealthfront/Betterment (financial advisors → robo-advisors)", "Duolingo (language tutors → automated learning)", "TurboTax (accountants → software)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "high", switchingFriction: "moderate", operationalBurden: "low" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /manual|human|labor|hand|staff|employ|workforce|paper|phone|person/g),
    transformValue: (cv) =>
      `Software-automated: zero-marginal-cost system replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Automating the manual process eliminates the labor-cost scaling constraint and creates margin expansion at volume.",
    strengthByConstraint: { manual_process: "high", labor_intensity: "high", skill_scarcity: "medium", operational_bottleneck: "medium" },
    contraindications: ["regulatory_barrier"],
    minimumEvidenceRequired: ["operational_dependency"],
  },

  // ── 8. One-Time Sale → Recurring Relationship ──
  {
    id: "onetime_to_recurring",
    name: "One-Time Sale → Recurring Relationship",
    transformation: "Convert transactional revenue to recurring revenue",
    mechanism: "Shift from one-time transactions to ongoing relationships, increasing predictability and lifetime value.",
    applicableDimensions: ["pricing_model", "customer_behavior", "demand_signal"],
    magnitude: "structural",
    marketMaturity: "saturated",
    mechanismProfile: { economicLeverage: true, scalability: false, defensibility: true },
    precedentExamples: ["Adobe Creative Suite (perpetual license → Creative Cloud subscription)", "Dollar Shave Club (retail purchase → subscription)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "moderate", switchingFriction: "moderate", operationalBurden: "low" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /one.?time|transact|single|per.?unit|spot|pay.?once|project.?based|episod/g),
    transformValue: (cv) =>
      `Recurring relationship: ongoing value delivery replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Converting to recurring revenue increases customer lifetime value and creates predictable cash flows that reduce business fragility.",
    strengthByConstraint: { transactional_revenue: "high", motivation_decay: "medium", commoditized_pricing: "low" },
    contraindications: [],
    minimumEvidenceRequired: ["pricing_model"],
  },

  // ── 9. Intermediated → Direct-to-Consumer ──
  {
    id: "intermediated_to_direct",
    name: "Intermediated → Direct-to-Consumer",
    transformation: "Remove intermediaries to connect directly with end customers",
    mechanism: "Disintermediate the value chain to capture margin currently absorbed by middlemen and gain direct customer relationship.",
    applicableDimensions: ["distribution_channel", "cost_structure", "customer_behavior"],
    magnitude: "structural",
    marketMaturity: "growing",
    mechanismProfile: { economicLeverage: true, scalability: false, defensibility: false },
    precedentExamples: ["Warby Parker (optician intermediary → DTC)", "Tesla (dealer network → direct sales)", "Dollar Shave Club (retail → DTC subscription)"],
    baseFeasibility: { regulatoryRisk: "moderate", implementationComplexity: "moderate", switchingFriction: "high", operationalBurden: "moderate" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /intermediar|broker|agent|dealer|reseller|wholesal|distributor|middl|retail\s*partner/g),
    transformValue: (cv) =>
      `Direct-to-consumer: removing intermediaries from ${cv.slice(0, 50)}`,
    rationaleTemplate: "Disintermediating the distribution chain captures margin currently lost to middlemen and establishes a direct customer relationship for data and retention advantages.",
    strengthByConstraint: { channel_dependency: "high", margin_compression: "medium", information_asymmetry: "medium" },
    contraindications: ["regulatory_barrier"],
    minimumEvidenceRequired: ["distribution_channel"],
  },

  // ── 10. Fixed Pricing → Usage-Based ──
  {
    id: "fixed_to_usage",
    name: "Fixed Pricing → Usage-Based",
    transformation: "Replace fixed pricing with consumption-based pricing",
    mechanism: "Align price to value consumed, reducing adoption friction and enabling land-and-expand revenue growth.",
    applicableDimensions: ["pricing_model", "customer_behavior", "demand_signal"],
    magnitude: "structural",
    marketMaturity: "growing",
    mechanismProfile: { economicLeverage: true, scalability: true, defensibility: false },
    precedentExamples: ["AWS (fixed server cost → pay-per-compute)", "Twilio (telecom contracts → pay-per-API-call)", "Snowflake (fixed license → consumption pricing)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "moderate", switchingFriction: "moderate", operationalBurden: "moderate" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /fixed|flat|monthly|annual|subscription|seat.?based|per.?license|membership/g),
    transformValue: (cv) =>
      `Usage-based pricing: pay-per-consumption replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Usage-based pricing aligns cost to value received, lowering the adoption barrier and enabling organic revenue expansion with usage growth.",
    strengthByConstraint: { capital_barrier: "high", perceived_value_mismatch: "high", forced_bundling: "medium" },
    contraindications: [],
    minimumEvidenceRequired: ["pricing_model"],
  },

  // ═══════════════════════════════════════════════════════════════
  //  NEW PATTERNS (Phase 1) — 10 additional structural transformations
  // ═══════════════════════════════════════════════════════════════

  // ── 11. Expert → Guided Self-Service ──
  {
    id: "expert_to_guided",
    name: "Expert → Guided Self-Service",
    transformation: "Replace expert-performed tasks with guided user self-service",
    mechanism: "Codify domain knowledge into step-by-step guidance that enables non-experts to achieve expert-level outcomes.",
    applicableDimensions: ["operational_dependency", "customer_behavior", "cost_structure"],
    magnitude: "structural",
    marketMaturity: "growing",
    mechanismProfile: { economicLeverage: true, scalability: true, defensibility: false },
    precedentExamples: ["TurboTax (accountant → guided tax filing)", "Wix (web developer → guided website builder)", "Robinhood (broker → guided investing)"],
    baseFeasibility: { regulatoryRisk: "moderate", implementationComplexity: "high", switchingFriction: "low", operationalBurden: "low" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /expert|specialist|professional|certified|trained|licensed|qualified|advisor/g),
    transformValue: (cv) =>
      `Guided self-service: user-driven with expert guidance replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Replacing expert-performed tasks with guided self-service democratizes access and eliminates the expertise bottleneck on scaling.",
    strengthByConstraint: { expertise_barrier: "high", skill_scarcity: "high", labor_intensity: "medium", access_constraint: "medium" },
    contraindications: ["regulatory_barrier"],
    minimumEvidenceRequired: ["operational_dependency"],
    prerequisiteConditions: ["domain knowledge can be codified", "error tolerance exists"],
  },

  // ── 12. Synchronous → Asynchronous ──
  {
    id: "synchronous_to_async",
    name: "Synchronous → Asynchronous",
    transformation: "Convert real-time delivery requirements to on-demand access",
    mechanism: "Remove time-coordination burden by enabling consumption at the user's pace and schedule.",
    applicableDimensions: ["operational_dependency", "customer_behavior", "distribution_channel"],
    magnitude: "structural",
    marketMaturity: "growing",
    mechanismProfile: { economicLeverage: true, scalability: true, defensibility: false },
    precedentExamples: ["Masterclass (live instruction → recorded courses)", "Loom (live meetings → async video)", "Coursera (classroom → on-demand learning)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "moderate", switchingFriction: "low", operationalBurden: "low" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /real.?time|live|synchronous|scheduled|appointment|in.?person|simultaneous|session/g),
    transformValue: (cv) =>
      `Asynchronous: on-demand access replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Converting synchronous delivery to async removes scheduling friction and enables geographic independence.",
    strengthByConstraint: { geographic_constraint: "high", capacity_ceiling: "medium", operational_bottleneck: "medium" },
    contraindications: [],
    minimumEvidenceRequired: ["operational_dependency"],
  },

  // ── 13. Centralized → Distributed ──
  {
    id: "centralized_to_distributed",
    name: "Centralized → Distributed",
    transformation: "Replace single-point facilities with distributed networks",
    mechanism: "Distribute value delivery across multiple nodes to improve resilience, proximity, and scale.",
    applicableDimensions: ["distribution_channel", "operational_dependency", "cost_structure"],
    magnitude: "structural",
    marketMaturity: "growing",
    mechanismProfile: { economicLeverage: false, scalability: true, defensibility: true },
    precedentExamples: ["CloudKitchens (central restaurant → distributed ghost kitchens)", "AWS (central datacenter → edge computing)", "Faire (centralized wholesale → distributed marketplace)"],
    baseFeasibility: { regulatoryRisk: "moderate", implementationComplexity: "high", switchingFriction: "moderate", operationalBurden: "high" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /centralized|single[\s-]?location|headquarter|main[\s-]?facility|hub|single[\s-]?point/g),
    transformValue: (cv) =>
      `Distributed network: multi-node delivery replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Distributing from a central point to a network improves resilience, customer proximity, and removes single-point capacity constraints.",
    strengthByConstraint: { geographic_constraint: "high", capacity_ceiling: "high", operational_bottleneck: "medium" },
    contraindications: ["regulatory_barrier"],
    minimumEvidenceRequired: ["distribution_channel"],
  },

  // ── 14. Inventory → On-Demand ──
  {
    id: "inventory_to_on_demand",
    name: "Inventory → On-Demand",
    transformation: "Replace pre-stocked inventory with on-demand production/delivery",
    mechanism: "Eliminate carrying costs and waste by producing or fulfilling only when demand materializes.",
    applicableDimensions: ["cost_structure", "operational_dependency", "distribution_channel"],
    magnitude: "structural",
    marketMaturity: "growing",
    mechanismProfile: { economicLeverage: true, scalability: false, defensibility: false },
    precedentExamples: ["Printful (print inventory → print-on-demand)", "Dell (retail inventory → build-to-order)", "Zara (seasonal inventory → fast fashion responsiveness)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "moderate", switchingFriction: "moderate", operationalBurden: "moderate" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /inventory|stock|warehouse|carrying[\s-]?cost|overstock|dead[\s-]?stock|spoilage|shelf[\s-]?life/g),
    transformValue: (cv) =>
      `On-demand: produce/deliver when needed replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Shifting from inventory to on-demand eliminates carrying costs and waste while enabling greater customization.",
    strengthByConstraint: { inventory_burden: "high", capital_barrier: "medium", asset_underutilization: "medium" },
    contraindications: [],
    minimumEvidenceRequired: ["cost_structure"],
  },

  // ── 15. Linear → Circular ──
  {
    id: "linear_to_circular",
    name: "Linear → Circular",
    transformation: "Replace consume-and-discard with reuse/recycle loops",
    mechanism: "Create closed-loop systems that recapture value from waste streams and reduce resource dependency.",
    applicableDimensions: ["cost_structure", "operational_dependency", "demand_signal"],
    magnitude: "structural",
    marketMaturity: "emerging",
    mechanismProfile: { economicLeverage: true, scalability: false, defensibility: true },
    precedentExamples: ["Patagonia (linear fashion → repair/resale)", "Loop (single-use packaging → reusable containers)", "Caterpillar (discard → remanufacturing)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "high", switchingFriction: "moderate", operationalBurden: "high" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /waste|discard|disposable|single.?use|throwaway|landfill|pollution|resource[\s-]?depletion/g),
    transformValue: (cv) =>
      `Circular model: reuse/recycle loop replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Transitioning from linear to circular captures value from waste streams, reduces input costs, and creates sustainability-driven differentiation.",
    strengthByConstraint: { inventory_burden: "medium", margin_compression: "medium", asset_underutilization: "high" },
    contraindications: [],
    minimumEvidenceRequired: ["cost_structure"],
    strongestIn: ["manufacturing", "consumer goods", "packaging"],
  },

  // ── 16. Single-Use → Multi-Use ──
  {
    id: "single_use_to_multi_use",
    name: "Single-Use → Multi-Use",
    transformation: "Expand a single-function asset to serve multiple functions or markets",
    mechanism: "Increase utilization and revenue from existing assets by finding additional use cases.",
    applicableDimensions: ["demand_signal", "operational_dependency", "pricing_model"],
    magnitude: "structural",
    marketMaturity: "emerging",
    mechanismProfile: { economicLeverage: true, scalability: false, defensibility: false },
    precedentExamples: ["Amazon (retail infrastructure → AWS cloud)", "Uber (ride network → UberEats delivery)", "Peloton (bike hardware → content/community platform)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "moderate", switchingFriction: "low", operationalBurden: "moderate" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /single[\s-]?use|one[\s-]?function|narrow|specialized|dedicated|purpose[\s-]?built|idle/g),
    transformValue: (cv) =>
      `Multi-use: additional functions/markets from ${cv.slice(0, 50)}`,
    rationaleTemplate: "Expanding from single-use to multi-use increases asset utilization and creates new revenue streams from existing infrastructure.",
    strengthByConstraint: { asset_underutilization: "high", capacity_ceiling: "medium", linear_scaling: "medium" },
    contraindications: ["regulatory_barrier"],
    minimumEvidenceRequired: ["demand_signal"],
  },

  // ── 17. Analog → Digital Twin ──
  {
    id: "analog_to_digital_twin",
    name: "Analog → Digital Twin",
    transformation: "Add a digital information layer to physical-only systems",
    mechanism: "Create a digital representation that enables data capture, remote monitoring, and predictive capabilities.",
    applicableDimensions: ["technology_dependency", "operational_dependency", "cost_structure"],
    magnitude: "structural",
    marketMaturity: "growing",
    mechanismProfile: { economicLeverage: false, scalability: true, defensibility: true },
    precedentExamples: ["GE (jet engines → digital twin monitoring)", "Tesla (car → over-the-air software updates)", "Matterport (physical space → 3D digital scan)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "high", switchingFriction: "moderate", operationalBurden: "moderate" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /analog|physical[\s-]?only|no[\s-]?data|untracked|paper|manual[\s-]?inspection|no[\s-]?visibility/g),
    transformValue: (cv) =>
      `Digital twin: data-enriched layer over ${cv.slice(0, 50)}`,
    rationaleTemplate: "Adding a digital layer to the physical system enables data capture, predictive maintenance, and new data-driven revenue streams.",
    strengthByConstraint: { analog_process: "high", information_asymmetry: "high", operational_bottleneck: "medium" },
    contraindications: [],
    minimumEvidenceRequired: ["technology_dependency"],
    strongestIn: ["manufacturing", "real estate", "industrial equipment"],
  },

  // ── 18. Complex → Simplified ──
  {
    id: "complex_to_simplified",
    name: "Complex → Simplified",
    transformation: "Reduce complexity to make products accessible to non-experts",
    mechanism: "Remove unnecessary complexity from the user experience, expanding the addressable market to non-specialists.",
    applicableDimensions: ["customer_behavior", "demand_signal", "operational_dependency"],
    magnitude: "structural",
    marketMaturity: "growing",
    mechanismProfile: { economicLeverage: false, scalability: true, defensibility: false },
    precedentExamples: ["Squarespace (web development → drag-and-drop)", "Stripe (payment integration → simple API)", "Notion (enterprise software → simple workspace)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "moderate", switchingFriction: "low", operationalBurden: "low" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /complex|complicated|steep[\s-]?learning|confusing|overwhelming|expert[\s-]?only|technical[\s-]?barrier/g),
    transformValue: (cv) =>
      `Simplified: accessible to non-experts replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Simplifying the complex experience opens the market to a much larger population of non-expert users.",
    strengthByConstraint: { expertise_barrier: "high", awareness_gap: "medium", access_constraint: "medium" },
    contraindications: [],
    minimumEvidenceRequired: ["customer_behavior"],
  },

  // ── 19. Individual → Community ──
  {
    id: "individual_to_community",
    name: "Individual → Community",
    transformation: "Transform solo experiences into shared/social experiences",
    mechanism: "Add community and social dynamics to create retention, accountability, and network effects.",
    applicableDimensions: ["customer_behavior", "demand_signal", "pricing_model"],
    magnitude: "structural",
    marketMaturity: "growing",
    mechanismProfile: { economicLeverage: false, scalability: true, defensibility: true },
    precedentExamples: ["Peloton (solo exercise → live community classes)", "Strava (solo running → social fitness)", "Discord (solo gaming → community platforms)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "moderate", switchingFriction: "moderate", operationalBurden: "moderate" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /individual|solo|alone|isolated|personal|private|single[\s-]?user|lonely/g),
    transformValue: (cv) =>
      `Community-driven: shared experience replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Adding community dynamics creates retention through social accountability, generates network effects, and increases switching costs.",
    strengthByConstraint: { motivation_decay: "high", trust_deficit: "medium", commoditized_pricing: "medium" },
    contraindications: [],
    minimumEvidenceRequired: ["customer_behavior"],
  },

  // ── 20. Reactive → Predictive ──
  {
    id: "reactive_to_predictive",
    name: "Reactive → Predictive",
    transformation: "Shift from fixing after failure to preventing before failure",
    mechanism: "Use data and patterns to predict problems and intervene proactively, reducing downtime and cost.",
    applicableDimensions: ["operational_dependency", "technology_dependency", "cost_structure"],
    magnitude: "structural",
    marketMaturity: "emerging",
    mechanismProfile: { economicLeverage: true, scalability: true, defensibility: true },
    precedentExamples: ["Uptake (reactive maintenance → predictive IoT)", "Tempus (reactive diagnosis → predictive health)", "Palantir (reactive analysis → predictive intelligence)"],
    baseFeasibility: { regulatoryRisk: "low", implementationComplexity: "high", switchingFriction: "high", operationalBurden: "moderate" },
    triggerCondition: (dim) =>
      triggerStrength(dim, /reactive|break[\s-]?fix|after[\s-]?failure|unplanned|emergency|downtime|fire[\s-]?fighting|crisis/g),
    transformValue: (cv) =>
      `Predictive: proactive prevention replacing ${cv.slice(0, 50)}`,
    rationaleTemplate: "Shifting from reactive to predictive eliminates unplanned downtime costs and creates premium pricing power through superior outcomes.",
    strengthByConstraint: { operational_bottleneck: "high", analog_process: "medium", information_asymmetry: "high", margin_compression: "medium" },
    contraindications: [],
    minimumEvidenceRequired: ["operational_dependency", "technology_dependency"],
    strongestIn: ["manufacturing", "healthcare", "industrial equipment", "infrastructure"],
  },
];

// ═══════════════════════════════════════════════════════════════
//  RELEVANCE SCORING — Prevents pattern saturation
// ═══════════════════════════════════════════════════════════════

const MATURITY_PENALTY: Record<MarketMaturity, number> = {
  emerging: 0,
  growing: 0,
  mature: -1,
  saturated: -2,
};

interface ScoredCandidate {
  pattern: StrategicPattern;
  dim: BusinessDimension;
  isWarm: boolean;
  triggerMatchStrength: number;
  relevanceScore: number;
}

/**
 * Score a pattern × dimension pair for relevance.
 * Factors: trigger match strength, evidence density, constraint linkage, maturity penalty.
 */
function scoreRelevance(
  pattern: StrategicPattern,
  dim: BusinessDimension,
  dimEvidence: Evidence[],
): number {
  const triggerMatch = pattern.triggerCondition(dim, dimEvidence);
  if (triggerMatch === 0) return 0;

  let score = 0;

  // Trigger match strength (0–3 points)
  score += triggerMatch * 3;

  // Evidence density (0–2 points): more evidence = stronger signal
  score += Math.min(2, dim.evidenceCount / 3);

  // Constraint linkage (0–2 points)
  if (dim.hasConstraint) score += 2;
  if (dim.hasLeverage) score += 1;

  // Market maturity penalty
  score += MATURITY_PENALTY[pattern.marketMaturity];

  return Math.max(0, score);
}

/** Max patterns that can fire per dimension */
const MAX_PATTERNS_PER_DIMENSION = 2;

// ═══════════════════════════════════════════════════════════════
//  MECHANISM STRENGTH COMPUTATION
// ═══════════════════════════════════════════════════════════════

/**
 * Compute mechanism strength (1–5) from pattern profile + dimension context.
 * Profile provides base (0–3), context adds (0–2).
 */
function computeMechanismStrength(
  pattern: StrategicPattern,
  dim: BusinessDimension,
  dimEvidence: Evidence[],
): number {
  let strength = 0;

  // Base from mechanism profile (each boolean = +1, max 3)
  const p = pattern.mechanismProfile;
  if (p.economicLeverage) strength++;
  if (p.scalability) strength++;
  if (p.defensibility) strength++;

  // +1 if precedent examples exist (proof this works)
  if (pattern.precedentExamples.length > 0) strength++;

  // +1 if constraint-linked (hot dimension = higher severity)
  if (dim.hasConstraint) strength++;

  return Math.min(5, Math.max(1, strength));
}

// ═══════════════════════════════════════════════════════════════
//  FEASIBILITY FLAG DETECTION
// ═══════════════════════════════════════════════════════════════

const REGULATORY_KEYWORDS = /regulat|compliance|legal|policy|license|permit|fda|hipaa|gdpr|certif/;
const COMPLEXITY_KEYWORDS = /complex|difficult|infrastructure|rebuild|overhaul|migration|legacy/;
const SWITCHING_KEYWORDS = /contract|lock.?in|commit|obligation|switching\s*cost|entrenched|habitual/;
const OPERATIONAL_KEYWORDS = /hiring|capital|equipment|training|logistics|warehouse|fleet/;

/**
 * Detect feasibility risks from evidence text + pattern base profile.
 * Evidence signals can upgrade risk levels from the pattern base.
 */
function detectFeasibilityFlags(
  pattern: StrategicPattern,
  dimEvidence: Evidence[],
): FeasibilityFlags {
  const flags = { ...pattern.baseFeasibility };
  const allText = dimEvidence.map(e => `${e.label} ${e.description || ""}`).join(" ").toLowerCase();

  if (REGULATORY_KEYWORDS.test(allText) && flags.regulatoryRisk === "low") {
    flags.regulatoryRisk = "moderate";
  }
  if (COMPLEXITY_KEYWORDS.test(allText) && flags.implementationComplexity !== "high") {
    flags.implementationComplexity = flags.implementationComplexity === "low" ? "moderate" : "high";
  }
  if (SWITCHING_KEYWORDS.test(allText) && flags.switchingFriction !== "high") {
    flags.switchingFriction = flags.switchingFriction === "low" ? "moderate" : "high";
  }
  if (OPERATIONAL_KEYWORDS.test(allText) && flags.operationalBurden !== "high") {
    flags.operationalBurden = flags.operationalBurden === "low" ? "moderate" : "high";
  }

  return flags;
}

// ═══════════════════════════════════════════════════════════════
//  PRECEDENT SIGNAL ANCHORING
// ═══════════════════════════════════════════════════════════════

const PRECEDENT_KEYWORDS = /saas|uber|netflix|airbnb|amazon|marketplace|platform|subscription|on.?demand|freemium|franchise/;

/**
 * Find precedent signals by scanning evidence for known transformation references
 * and combining with pattern-level precedent examples.
 */
function findPrecedentSignals(
  pattern: StrategicPattern,
  allEvidence: Evidence[],
): string[] {
  const precedents = [...pattern.precedentExamples];

  // Scan all evidence for precedent keywords
  for (const ev of allEvidence) {
    const text = `${ev.label} ${ev.description || ""}`.toLowerCase();
    if (PRECEDENT_KEYWORDS.test(text)) {
      // Extract a brief reference
      const match = text.match(PRECEDENT_KEYWORDS);
      if (match) {
        const ref = `Evidence reference: "${ev.label.slice(0, 60)}" suggests similar transformation`;
        if (!precedents.includes(ref)) {
          precedents.push(ref);
        }
      }
    }
  }

  return precedents.slice(0, 5); // Cap at 5
}

// ═══════════════════════════════════════════════════════════════
//  REASONING CHAIN ASSEMBLY
// ═══════════════════════════════════════════════════════════════

/**
 * Build the reasoning chain from dimension evidence, constraint, and pattern.
 */
function buildReasoningChain(
  pattern: StrategicPattern,
  dim: BusinessDimension,
  dimEvidence: Evidence[],
  constraints: { id: string; label?: string; description?: string; evidenceIds: string[] }[],
  shiftedValue: string,
): ReasoningChain {
  // Signal: summarize top evidence
  const topEvidence = dimEvidence
    .sort((a, b) => (b.sourceCount ?? 1) - (a.sourceCount ?? 1))
    .slice(0, 2);
  const signal = topEvidence.map(e => e.label).join("; ") || "Multiple market signals detected";

  // Constraint: find the linked constraint
  const linkedConstraint = constraints.find(c =>
    c.evidenceIds.some(eid => dim.evidenceIds.includes(eid))
  );
  const constraint = linkedConstraint?.label || linkedConstraint?.description || "Structural friction detected in this dimension";

  return {
    signal,
    constraint,
    pattern: pattern.name,
    mechanism: pattern.mechanism,
    opportunity: shiftedValue,
  };
}

// ═══════════════════════════════════════════════════════════════
//  OPPORTUNITY INTERACTION DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Detect relationships between opportunity vectors.
 * - Same dimension, same direction → reinforcing
 * - Same dimension, opposite direction → conflicting
 * - No shared dimensions → orthogonal
 */
export function detectInteractions(vectors: OpportunityVector[]): Map<string, VectorInteraction[]> {
  const interactions = new Map<string, VectorInteraction[]>();

  for (let i = 0; i < vectors.length; i++) {
    const v1 = vectors[i];
    const v1Interactions: VectorInteraction[] = [];
    const v1Dims = new Set(v1.changedDimensions.map(d => d.dimension));

    for (let j = 0; j < vectors.length; j++) {
      if (i === j) continue;
      const v2 = vectors[j];
      const v2Dims = new Set(v2.changedDimensions.map(d => d.dimension));

      // Check dimension overlap
      let sharedDims = 0;
      let sameDirection = 0;
      let oppositeDirection = 0;

      for (const d1 of v1.changedDimensions) {
        if (v2Dims.has(d1.dimension)) {
          sharedDims++;
          const d2 = v2.changedDimensions.find(d => d.dimension === d1.dimension);
          if (d2) {
            // Simple heuristic: if both shift from same source, likely same direction
            if (d1.from === d2.from) {
              // Check if target values are similar
              const sim = jaccardSimple(d1.to, d2.to);
              if (sim > 0.3) sameDirection++;
              else oppositeDirection++;
            }
          }
        }
      }

      // Also check evidence overlap as a proxy for reinforcement
      const ev1 = new Set(v1.evidenceIds);
      const evOverlap = v2.evidenceIds.filter(id => ev1.has(id)).length;
      const evidenceReinforcing = evOverlap >= 2;

      let relation: VectorRelation;
      if (oppositeDirection > 0) {
        relation = "conflicting";
      } else if (sameDirection > 0 || (sharedDims === 0 && evidenceReinforcing)) {
        relation = "reinforcing";
      } else {
        relation = "orthogonal";
      }

      // Only record non-orthogonal relationships to keep noise down
      if (relation !== "orthogonal") {
        v1Interactions.push({ vectorId: v2.id, relation });
      }
    }

    if (v1Interactions.length > 0) {
      interactions.set(v1.id, v1Interactions);
    }
  }

  return interactions;
}

function jaccardSimple(a: string, b: string): number {
  const tokA = new Set(a.toLowerCase().split(/\s+/).filter(t => t.length > 2));
  const tokB = new Set(b.toLowerCase().split(/\s+/).filter(t => t.length > 2));
  if (tokA.size === 0 && tokB.size === 0) return 0;
  let inter = 0;
  for (const t of tokA) if (tokB.has(t)) inter++;
  return inter / (tokA.size + tokB.size - inter);
}

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
 * Apply structural patterns against active baseline dimensions with
 * relevance scoring, saturation control (top-2 per dimension),
 * mechanism strength, feasibility flags, precedent signals, and reasoning chains.
 *
 * Hot dimensions: patterns fire if trigger matches.
 * Warm dimensions: patterns fire only if evidenceCount ≥ 4 AND trigger matches.
 */
export function applyPatterns(
  baseline: BusinessBaseline,
  constraints: { id: string; label?: string; description?: string; evidenceIds: string[] }[],
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
    const dimEvidence = flatEvidence.filter(e => dim.evidenceIds.includes(e.id));

    // ── Relevance scoring: score all applicable patterns for this dimension ──
    const candidates: ScoredCandidate[] = [];

    for (const pattern of STRATEGIC_PATTERNS) {
      if (!pattern.applicableDimensions.includes(dim.category)) continue;

      const triggerMatch = pattern.triggerCondition(dim, dimEvidence);
      if (triggerMatch === 0) continue;

      const relevance = scoreRelevance(pattern, dim, dimEvidence);
      if (relevance <= 0) continue;

      candidates.push({
        pattern,
        dim,
        isWarm,
        triggerMatchStrength: triggerMatch,
        relevanceScore: relevance,
      });
    }

    // ── Pattern saturation control: take top-2 by relevance ──
    candidates.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const selected = candidates.slice(0, MAX_PATTERNS_PER_DIMENSION);

    // ── Generate vectors from selected patterns ──
    for (const candidate of selected) {
      const { pattern } = candidate;
      const shiftedValue = pattern.transformValue(dim.currentValue, dim.name);

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
        surfaceId: undefined, // Reserved for future opportunity surface detection
      });

      origins.set(id, {
        source: "pattern",
        patternId: pattern.id,
        noveltyTag: "structural",
        warmDerived: isWarm,
        mechanismStrength: computeMechanismStrength(pattern, dim, dimEvidence),
        feasibilityFlags: detectFeasibilityFlags(pattern, dimEvidence),
        precedentSignals: findPrecedentSignals(pattern, flatEvidence),
        reasoningChain: buildReasoningChain(pattern, dim, dimEvidence, constraints, shiftedValue),
      });
    }
  }

  return { vectors, origins };
}

// ═══════════════════════════════════════════════════════════════
//  PUBLIC HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get pattern metadata by ID — used for UI display of origin traceability.
 */
export function getPatternById(patternId: string): StrategicPattern | undefined {
  return STRATEGIC_PATTERNS.find(p => p.id === patternId);
}

/**
 * Get all pattern IDs and names — for UI listing.
 */
export function listPatterns(): { id: string; name: string; transformation: string; marketMaturity: MarketMaturity }[] {
  return STRATEGIC_PATTERNS.map(p => ({
    id: p.id,
    name: p.name,
    transformation: p.transformation,
    marketMaturity: p.marketMaturity,
  }));
}
