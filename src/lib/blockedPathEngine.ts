/**
 * BLOCKED PATH ENGINE — Red Team & Disqualified Innovation Surfacing
 *
 * Surfaces the top blocked/disqualified innovation patterns for a business
 * system, alongside:
 *   1. The explicit gating reason (why this path is blocked)
 *   2. A "What would need to be true?" prompt — the conditions under which
 *      the block would dissolve
 *   3. A confidence score for the gating reason
 *
 * This engine implements the "Red Team" methodology from DARPA program
 * management: systematically enumerate failure modes and near-miss paths
 * BEFORE committing resources, so teams understand structural barriers.
 *
 * Per PR #20 requirements: blocked paths must be visibly surfaced in UI/report
 * export, with clear gating reason and "What would need to be true?" prompt.
 */

import type { StrategicInsight } from "@/lib/strategicEngine";
import type { BusinessDimension, EvidenceCategory } from "@/lib/opportunityDesignEngine";
import type { Evidence } from "@/lib/evidenceEngine";
import { type DiagnosticContext } from "@/lib/diagnosticContext";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type BlockedPathGateType =
  | "regulatory"       // Legal or compliance barrier
  | "capital"          // Insufficient funding or investment threshold
  | "behavioral"       // Customer adoption or behavior change required
  | "technical"        // Technology does not yet exist or is too immature
  | "economic"         // Unit economics don't pencil
  | "trust_deficit"    // Market trust not established
  | "network_effect"   // Requires scale that doesn't yet exist
  | "incumbent_moat";  // Dominant player controls the required resource

export interface BlockedPath {
  id: string;
  /** The innovation pattern or opportunity that is blocked */
  patternLabel: string;
  /** Short description of what this path would achieve if unblocked */
  potentialValue: string;
  /** Primary reason this path is blocked */
  gateType: BlockedPathGateType;
  /** Human-readable explanation of why this path is currently blocked */
  gatingReason: string;
  /**
   * "What would need to be true?" — the condition under which this block dissolves.
   * Not a prediction — a structured question for strategic planning.
   */
  whatWouldNeedToBeTrue: string;
  /** Secondary conditions that would also help */
  additionalUnlockConditions: string[];
  /** How confident are we in this gating assessment? 0-1 */
  gatingConfidence: number;
  /** How valuable would this be if unblocked? 1-10 */
  unlockedValueScore: number;
  /** Which dimensions/constraints drive this block */
  drivingConstraintIds: string[];
  /** Is this block temporary (likely to dissolve) or structural (likely permanent)? */
  blockDurability: "temporary" | "structural" | "uncertain";
}

export interface BlockedPathSurface {
  blockedPaths: BlockedPath[];
  /** Paths blocked by capital constraints */
  capitalBlocked: BlockedPath[];
  /** Paths blocked by regulatory constraints */
  regulatoryBlocked: BlockedPath[];
  /** Paths blocked by behavioral barriers */
  behavioralBlocked: BlockedPath[];
  /** Paths most likely to unblock in next 12-24 months */
  nearTermUnlocks: BlockedPath[];
  /** Summary stats */
  summary: {
    totalBlocked: number;
    temporaryBlocks: number;
    structuralBlocks: number;
    highValueIfUnblocked: number; // score >= 8
  };
}

// ═══════════════════════════════════════════════════════════════
//  BLOCKED PATH TEMPLATES
//  Canonical blocked patterns keyed by constraint category combos
// ═══════════════════════════════════════════════════════════════

interface BlockedPathTemplate {
  patternLabel: string;
  potentialValue: string;
  gateType: BlockedPathGateType;
  gatingReason: string;
  whatWouldNeedToBeTrue: string;
  additionalUnlockConditions: string[];
  unlockedValueScore: number;
  blockDurability: "temporary" | "structural" | "uncertain";
  /** Signals in evidence/constraint text that activate this template */
  triggerKeywords: string[];
  triggerCategories: EvidenceCategory[];
}

const BLOCKED_PATH_TEMPLATES: BlockedPathTemplate[] = [
  // ── Platform / Marketplace Transformation ─────────────────────────────────
  {
    patternLabel: "Platform / two-sided marketplace",
    potentialValue: "Create a network-effect-driven marketplace that grows value with each participant added — platform margin (30-40%) vs. service margin (10-20%)",
    gateType: "network_effect",
    gatingReason: "Two-sided marketplaces require critical mass on both supply and demand sides before value is delivered to either. Cold-start problem: first 500 supply-side participants won't join without demand, and first 500 demand-side participants won't join without supply.",
    whatWouldNeedToBeTrue: "What would need to be true: Subsidize one side (typically supply) to bootstrap the marketplace, OR start as a single-sided service business and transition to platform once sufficient supply concentration exists in your geography.",
    additionalUnlockConditions: [
      "Minimum 50 verified supply-side participants in a single market",
      "Documented repeat transaction rate > 40% from demand side",
      "Unit economics that survive a 2-year subsidy period for supply side",
    ],
    unlockedValueScore: 9,
    blockDurability: "temporary",
    triggerKeywords: ["marketplace", "platform", "aggregat", "supplier", "vendor", "provider"],
    triggerCategories: ["distribution_channel", "operational_dependency"],
  },

  // ── Subscription / Recurring Revenue Transformation ───────────────────────
  {
    patternLabel: "Subscription / recurring revenue conversion",
    potentialValue: "Convert one-time transaction revenue to predictable recurring revenue — 3-5× LTV improvement with 60-80% annual renewal rates in most categories",
    gateType: "behavioral",
    gatingReason: "Customers in transactional categories do not spontaneously commit to subscriptions without a compelling ongoing value event. The subscription mental model requires customers to perceive continuous ongoing benefit — which the current transactional model does not deliver.",
    whatWouldNeedToBeTrue: "What would need to be true: Define the ongoing value event (monthly tune-up, quarterly inspection, annual compliance check) that makes the subscription tangibly valuable every period — not just access to reactive service.",
    additionalUnlockConditions: [
      "Identify a recurring value event that occurs at least 2× per year",
      "Price the subscription at < 3 monthly reactive service invoices to make ROI obvious",
      "Guarantee response time for subscribers that is meaningfully faster than non-subscribers",
    ],
    unlockedValueScore: 9,
    blockDurability: "temporary",
    triggerKeywords: ["recurring", "subscription", "membership", "retainer", "annual"],
    triggerCategories: ["pricing_model", "customer_behavior"],
  },

  // ── AI / Automation-Led Delivery ──────────────────────────────────────────
  {
    patternLabel: "AI-assisted autonomous service delivery",
    potentialValue: "Remove the labor-to-revenue linearity through AI-assisted diagnosis, routing, and resolution — 3-5× throughput at equal headcount",
    gateType: "technical",
    gatingReason: "Current AI diagnostic accuracy for physical service industries ranges 60-80% for common cases — below the 95%+ threshold required for autonomous deployment without human oversight. Liability, insurance, and customer trust barriers also constrain deployment.",
    whatWouldNeedToBeTrue: "What would need to be true: AI accuracy for your specific service category reaches > 90% on primary use cases (achievable in 2-4 years for most categories), AND regulatory/insurance frameworks adapt to allow certified AI-assisted diagnosis.",
    additionalUnlockConditions: [
      "Train AI model on minimum 10,000 labeled service outcomes in your specific category",
      "Secure E&O insurance that covers AI-assisted diagnostics",
      "Pilot human-in-the-loop assisted delivery before fully autonomous deployment",
    ],
    unlockedValueScore: 8,
    blockDurability: "temporary",
    triggerKeywords: ["automat", "ai", "machine learning", "autonomous", "smart", "diagnostic"],
    triggerCategories: ["technology_dependency", "operational_dependency"],
  },

  // ── Vertical Integration ───────────────────────────────────────────────────
  {
    patternLabel: "Backward vertical integration (own supply)",
    potentialValue: "Capture distributor margin (typically 20-35%) by sourcing directly from manufacturers — material cost reduction of 15-25%",
    gateType: "capital",
    gatingReason: "Direct manufacturing relationships require minimum purchase commitments ($200K-$2M annually depending on category) and working capital to carry inventory. Most small/medium service businesses lack the purchasing volume to qualify for tier-1 distributor pricing.",
    whatWouldNeedToBeTrue: "What would need to be true: Aggregate purchasing volume across multiple locations or franchise units to meet minimum thresholds — OR join a group purchasing organization (GPO) that pools volume across multiple similar businesses.",
    additionalUnlockConditions: [
      "Achieve $200K+ annual spend with any single supplier category",
      "Establish predictable demand forecasting (±15% accuracy quarterly)",
      "Access warehouse/storage infrastructure appropriate for category",
    ],
    unlockedValueScore: 6,
    blockDurability: "structural",
    triggerKeywords: ["supply", "material", "inventory", "distributor", "manufacturer", "sourcing"],
    triggerCategories: ["cost_structure", "operational_dependency"],
  },

  // ── Geographic Scaling ────────────────────────────────────────────────────
  {
    patternLabel: "Rapid geographic expansion",
    potentialValue: "Capture market share across new geographies before competitors establish network effects — 5-10× revenue potential with standardized operations",
    gateType: "capital",
    gatingReason: "Geographic expansion requires proven unit economics in the current market (ideally 3+ units profitable), standardized operating procedures, and capital to sustain 6-18 month ramp-up periods for each new territory.",
    whatWouldNeedToBeTrue: "What would need to be true: Achieve sustainable positive unit economics in the current market for 12+ consecutive months, AND document a replicable operating playbook with < 4 weeks for a new operator to reach productivity.",
    additionalUnlockConditions: [
      "Single-market EBITDA > 15% for 12+ months",
      "Documented operating SOP that a trained manager can execute in < 4 weeks",
      "Tech infrastructure that supports multi-location operations without linear cost increase",
    ],
    unlockedValueScore: 8,
    blockDurability: "temporary",
    triggerKeywords: ["geographic", "expansion", "location", "market", "territory", "region"],
    triggerCategories: ["distribution_channel", "competitive_pressure"],
  },

  // ── Data Monetization ─────────────────────────────────────────────────────
  {
    patternLabel: "Proprietary data asset monetization",
    potentialValue: "Convert operational data into a revenue-generating asset sold to adjacent markets — insurance, property management, compliance, and warranty sectors",
    gateType: "regulatory",
    gatingReason: "Data monetization in home/business service categories triggers CCPA, GDPR, and sector-specific privacy regulations. Selling customer property data without explicit consent is legally restricted in most jurisdictions and creates material liability.",
    whatWouldNeedToBeTrue: "What would need to be true: Implement explicit informed consent in service agreements for data use, anonymize/aggregate data to remove personally identifiable property details, AND validate a paying customer exists in the target data market before building the data product.",
    additionalUnlockConditions: [
      "Legal review confirms data-sharing agreement structure",
      "Minimum 10,000 anonymized data points to have commercial value",
      "Identify and validate 3+ paying buyers in the target data market",
    ],
    unlockedValueScore: 7,
    blockDurability: "uncertain",
    triggerKeywords: ["data", "analytics", "report", "information", "insight", "intelligence"],
    triggerCategories: ["technology_dependency", "regulatory_constraint"],
  },

  // ── Franchise / Licensing ─────────────────────────────────────────────────
  {
    patternLabel: "Franchise or licensing model expansion",
    potentialValue: "Scale without proportional capital deployment — license the operating system to owner-operators who fund their own expansion",
    gateType: "trust_deficit",
    gatingReason: "Franchise buyers require demonstrated proof of concept: 3-5 profitable units operating for 2+ years before a Franchise Disclosure Document (FDD) is credible. No proven multi-unit track record = no franchisee confidence = no capital commitment.",
    whatWouldNeedToBeTrue: "What would need to be true: Operate 3-5 locations profitably for 24+ consecutive months, document the operating system thoroughly, and engage a franchise attorney to prepare the required FDD/disclosure documentation.",
    additionalUnlockConditions: [
      "3+ profitable locations operating 24+ months",
      "Documented brand standards and training system",
      "FDD prepared by qualified franchise attorney",
      "Validated franchisee ROI model demonstrating 2-3 year payback",
    ],
    unlockedValueScore: 8,
    blockDurability: "temporary",
    triggerKeywords: ["franchise", "license", "replicat", "system", "brand", "expand"],
    triggerCategories: ["distribution_channel", "operational_dependency"],
  },

  // ── Premium Pricing Shift ─────────────────────────────────────────────────
  {
    patternLabel: "Aggressive premium pricing repositioning",
    potentialValue: "Re-anchor to the premium segment and capture 2-3× higher margin per job — exit commodity price competition permanently",
    gateType: "incumbent_moat",
    gatingReason: "Premium positioning requires brand trust that typically takes 2-5 years to build through consistent delivery and visible social proof. In commoditized service categories, customers default to price comparison without strong trust signals, making premium pricing unsustainable without brand equity.",
    whatWouldNeedToBeTrue: "What would need to be true: Accumulate 200+ verified 5-star reviews in the local market, establish at minimum one trust signal (background checks, certification, warranty), and test premium pricing on new customers only — never force existing customers to absorb a sudden price increase.",
    additionalUnlockConditions: [
      "Net Promoter Score (NPS) > 60 from current customer base",
      "200+ verified reviews with average rating ≥ 4.7",
      "Differentiated service element customers cannot easily price-compare (e.g., same-technician guarantee, 2-hour arrival windows)",
    ],
    unlockedValueScore: 7,
    blockDurability: "temporary",
    triggerKeywords: ["premium", "price", "margin", "commodit", "value", "brand"],
    triggerCategories: ["pricing_model", "competitive_pressure"],
  },
];

// ═══════════════════════════════════════════════════════════════
//  MAIN ENGINE
// ═══════════════════════════════════════════════════════════════

let pathIdSeq = 0;
function nextPathId() { return `bp-${++pathIdSeq}`; }

/**
 * Surface blocked innovation paths given the current constraint/evidence profile.
 * Each blocked path includes a gating reason and "What would need to be true?" prompt.
 */
/** Gate types that each mode foregrounds (higher boost value = stronger preference) */
const MODE_GATE_BOOSTS: Record<string, Partial<Record<BlockedPathGateType, number>>> = {
  product: {
    technical:      1.4,
    capital:        1.2,
    network_effect: 0.9,
    behavioral:     0.8,
    regulatory:     1.0,
  },
  service: {
    behavioral:     1.4,
    network_effect: 1.3,
    trust_deficit:  1.2,
    technical:      1.0,
    capital:        0.9,
    regulatory:     0.9,
  },
  business_model: {
    capital:        1.4,
    incumbent_moat: 1.3,
    regulatory:     1.2,
    network_effect: 1.1,
    behavioral:     1.0,
    technical:      0.9,
  },
};

export function surfaceBlockedPaths(
  constraints: StrategicInsight[],
  activeBaseline: Record<string, BusinessDimension>,
  flatEvidence: Evidence[],
  context?: DiagnosticContext,
): BlockedPathSurface {
  pathIdSeq = 0;

  const constraintText = constraints.map(c => `${c.label} ${c.description}`).join(" ").toLowerCase();
  const evidenceText = flatEvidence.map(e => `${e.label} ${e.description || ""}`).join(" ").toLowerCase();
  const combinedText = `${constraintText} ${evidenceText}`;

  const activeCategories = Object.values(activeBaseline).map(d => d.category);

  const blockedPaths: BlockedPath[] = [];

  for (const template of BLOCKED_PATH_TEMPLATES) {
    // Keyword match
    const keywordHit = template.triggerKeywords.some(kw =>
      combinedText.includes(kw.toLowerCase())
    );

    // Category match
    const categoryHit = template.triggerCategories.some(cat =>
      activeCategories.includes(cat)
    );

    if (!keywordHit && !categoryHit) continue;

    // Compute confidence based on signal strength
    const kwMatches = template.triggerKeywords.filter(kw => combinedText.includes(kw.toLowerCase())).length;
    const catMatches = template.triggerCategories.filter(cat => activeCategories.includes(cat)).length;
    const gatingConfidence = Math.min(0.95, 0.4 + (kwMatches * 0.1) + (catMatches * 0.15));

    // Find driving constraint IDs
    const drivingConstraintIds = constraints
      .filter(c => {
        const ct = `${c.label} ${c.description}`.toLowerCase();
        return template.triggerKeywords.some(kw => ct.includes(kw));
      })
      .map(c => c.id)
      .slice(0, 3);

    blockedPaths.push({
      id: nextPathId(),
      patternLabel: template.patternLabel,
      potentialValue: template.potentialValue,
      gateType: template.gateType,
      gatingReason: template.gatingReason,
      whatWouldNeedToBeTrue: template.whatWouldNeedToBeTrue,
      additionalUnlockConditions: template.additionalUnlockConditions,
      gatingConfidence,
      unlockedValueScore: template.unlockedValueScore,
      drivingConstraintIds,
      blockDurability: template.blockDurability,
    });
  }

  // Sort by unlocked value × confidence, boosted by mode gate affinity
  const gateBoosts = context ? (MODE_GATE_BOOSTS[context.mode] ?? {}) : {};
  blockedPaths.sort((a, b) => {
    const aBoost = gateBoosts[a.gateType] ?? 1.0;
    const bBoost = gateBoosts[b.gateType] ?? 1.0;
    return (b.unlockedValueScore * b.gatingConfidence * bBoost) -
           (a.unlockedValueScore * a.gatingConfidence * aBoost);
  });

  // Slice to top 6 for surfacing
  const surfaced = blockedPaths.slice(0, 6);

  const nearTermUnlocks = surfaced.filter(p => p.blockDurability === "temporary");

  return {
    blockedPaths: surfaced,
    capitalBlocked: surfaced.filter(p => p.gateType === "capital"),
    regulatoryBlocked: surfaced.filter(p => p.gateType === "regulatory"),
    behavioralBlocked: surfaced.filter(p => p.gateType === "behavioral"),
    nearTermUnlocks,
    summary: {
      totalBlocked: surfaced.length,
      temporaryBlocks: surfaced.filter(p => p.blockDurability === "temporary").length,
      structuralBlocks: surfaced.filter(p => p.blockDurability === "structural").length,
      highValueIfUnblocked: surfaced.filter(p => p.unlockedValueScore >= 8).length,
    },
  };
}

/**
 * Format a single blocked path for inclusion in an AI prompt.
 */
export function formatBlockedPathForPrompt(path: BlockedPath): string {
  return [
    `BLOCKED PATH: ${path.patternLabel}`,
    `Potential value: ${path.potentialValue}`,
    `Gate type: ${path.gateType} | Confidence: ${Math.round(path.gatingConfidence * 100)}%`,
    `Gating reason: ${path.gatingReason}`,
    `${path.whatWouldNeedToBeTrue}`,
  ].join("\n");
}

/**
 * Format all blocked paths for injection into an AI prompt or report section.
 */
export function formatBlockedPathsForPrompt(surface: BlockedPathSurface): string {
  if (surface.blockedPaths.length === 0) return "";
  return [
    "── BLOCKED INNOVATION PATHS (Red Team Analysis) ──",
    ...surface.blockedPaths.map(formatBlockedPathForPrompt),
  ].join("\n\n");
}
