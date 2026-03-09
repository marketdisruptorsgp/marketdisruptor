/**
 * THREE-TIER FACET ARCHITECTURE — Types & Schema Contract
 *
 * Tier 1: Structured Facets — strongly typed, versioned schema fields
 * Tier 2: Derived Metrics — computed values with extraction confidence
 * Tier 3: Raw Constraint Signals — unstructured snippets with lifecycle
 *
 * The facet schema is treated as a contract: changes are explicit,
 * versioned, and backward compatible.
 */

// ═══════════════════════════════════════════════════════════════
//  SCHEMA VERSIONING
// ═══════════════════════════════════════════════════════════════

/**
 * Current facet schema version. Increment on breaking changes.
 * Rules compiled against version N remain valid for evidence
 * tagged with version N, even after the schema advances.
 */
export const FACET_SCHEMA_VERSION = 2;

// ═══════════════════════════════════════════════════════════════
//  TIER 2: DERIVED METRICS
// ═══════════════════════════════════════════════════════════════

export interface DerivedMetric {
  /** Machine-readable key (e.g., "capacity_utilization", "collection_days") */
  key: string;
  /** Numeric or categorical value */
  value: number | string;
  /** Unit of measurement (%, days, ratio, etc.) */
  unit?: string;
  /** How this was derived: "extracted" from text, "computed" from other metrics */
  derivation: "extracted" | "computed" | "inferred";
  /** Confidence in the extraction (0-1) */
  confidence: number;
  /** Source evidence ID that produced this metric */
  sourceEvidenceId?: string;
}

// ═══════════════════════════════════════════════════════════════
//  TIER 3: RAW CONSTRAINT SIGNALS
// ═══════════════════════════════════════════════════════════════

export type SignalLifecycleStatus = "active" | "promoted" | "archived";

export interface RawConstraintSignal {
  /** Unique signal ID */
  id: string;
  /** The raw text snippet that triggered this signal */
  snippet: string;
  /** Which constraint pattern this signal has been mapped to (if any) */
  mappedConstraint?: string;
  /** How many times this signal has participated in constraint detection */
  activationCount: number;
  /** Lifecycle status */
  status: SignalLifecycleStatus;
  /** When this signal was first created */
  createdAt: number;
  /** Source evidence ID */
  sourceEvidenceId: string;
}

/**
 * Promotion thresholds for raw signal lifecycle.
 * Signals exceeding PROMOTE_THRESHOLD activations should be
 * promoted to Tier 2 derived metrics or flagged for Tier 1 inclusion.
 * Signals below ARCHIVE_THRESHOLD after ARCHIVE_AGE_MS are archived.
 */
export const SIGNAL_LIFECYCLE = {
  PROMOTE_THRESHOLD: 5,
  ARCHIVE_THRESHOLD: 1,
  ARCHIVE_AGE_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
  MAX_RAW_SIGNALS_PER_EVIDENCE: 3,
} as const;

// ═══════════════════════════════════════════════════════════════
//  TIER 1: STRUCTURED FACETS (re-exported from original)
// ═══════════════════════════════════════════════════════════════

export type ComponentRole = "structural" | "functional" | "interface" | "aesthetic" | "safety";

export interface ObjectFacets {
  domain: "object";
  componentRole?: ComponentRole;
  materialClass?: string;
  manufacturingMethod?: string;
  failureMode?: string;
  maintenanceBurden?: "none" | "low" | "moderate" | "high";
  ergonomicConstraint?: string;
  usageContext?: string;
  costDriver?: string;
  replacementCycle?: string;
}

export interface ConcentrationRisk {
  type: "customer" | "vendor" | "geographic" | "channel";
  topEntityShare?: number;
  top3Share?: number;
}

export interface LaborProfile {
  intensity: "low" | "moderate" | "high";
  ownerDependency: boolean;
  specializedRoles?: string[];
  laborCostRatio?: number;
}

export interface PricingArchitecture {
  model: "fixed" | "hourly" | "project" | "subscription" | "usage" | "hybrid";
  priceSettingPower: "weak" | "moderate" | "strong";
  contractDuration?: string;
  switchingCost: "low" | "moderate" | "high";
}

export interface MarginStructure {
  grossMargin?: number;
  adjustedEbitda?: number;
  marginTrend: "declining" | "stable" | "improving";
  marginDriver?: string;
}

export interface OperationalBottleneck {
  process: string;
  constraint: string;
  capacityUtilization?: number;
}

export interface BusinessFacets {
  domain: "business";
  concentrationRisk?: ConcentrationRisk;
  laborProfile?: LaborProfile;
  pricingArchitecture?: PricingArchitecture;
  marginStructure?: MarginStructure;
  operationalBottleneck?: OperationalBottleneck;
  /** V2: Capacity utilization as a fraction (0-1) */
  capacityUtilization?: number;
  /** V2: Average days to collect payment */
  cashCycleDays?: number;
  /** V2: Asset utilization ratio (revenue / asset value) */
  assetUtilization?: number;
}

export interface MarketFacets {
  domain: "market";
  marketGrowth?: "declining" | "stagnant" | "moderate" | "high";
  competitiveDensity?: "fragmented" | "moderate" | "concentrated" | "monopolistic";
  regulatoryEnvironment?: "permissive" | "moderate" | "restrictive" | "prohibitive";
}

export interface DemandFacets {
  domain: "demand";
  awarenessGap?: boolean;
  accessConstraint?: "geographic" | "financial" | "credential" | "knowledge";
  motivationDecay?: boolean;
  perceivedValueMismatch?: boolean;
  trustBarrier?: boolean;
}

export type EvidenceFacets = ObjectFacets | BusinessFacets | MarketFacets | DemandFacets;

// ═══════════════════════════════════════════════════════════════
//  COMPOSITE METADATA — All three tiers on an evidence item
// ═══════════════════════════════════════════════════════════════

export interface EvidenceMetadata {
  /** Schema version this metadata was created under */
  schemaVersion: number;
  /** Tier 1: Structured facets (strongly typed) */
  facets?: EvidenceFacets;
  /** Tier 2: Derived metrics (computed/extracted numeric values) */
  derivedMetrics: DerivedMetric[];
  /** Tier 3: Raw constraint signals (unstructured, lifecycle-managed) */
  rawSignals: RawConstraintSignal[];
}

/**
 * Create an empty metadata container at the current schema version.
 */
export function createEmptyMetadata(): EvidenceMetadata {
  return {
    schemaVersion: FACET_SCHEMA_VERSION,
    facets: undefined,
    derivedMetrics: [],
    rawSignals: [],
  };
}
