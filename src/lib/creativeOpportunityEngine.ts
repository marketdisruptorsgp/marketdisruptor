/**
 * Creative Opportunity Engine
 *
 * Deterministic, evidence-grounded radical opportunity generation.
 * No AI calls — pure combinatorial + rule-based logic.
 *
 * Three generation methods:
 *   A. Morphological Analysis (Zwicky Box)
 *   B. SCAMPER Mutations
 *   C. Cross-industry Analogy Benchmarking
 *
 * Plus: Blocked path detection + scoring/ranking.
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { StructuralProfile } from "@/lib/reconfiguration";
import type { ConstraintHypothesis } from "@/lib/constraintDetectionEngine";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";

// ── Re-export Evidence as NormalizedEvidence alias ───────────────────────────
export type NormalizedEvidence = Evidence;

// ── Exported Types ────────────────────────────────────────────────────────────

export interface HeilmeierPanel {
  objective: string;
  todaysLimit: string;
  whatsNew: string;
  whoCares: string;
  risks: string;
  successMetric: string;
}

export interface WowCard {
  id: string;
  title: string;
  summary: string;
  innovationMethod: "morphological" | "scamper" | "analogy" | "triz";
  demandAnchor: string;
  supplyAnchor: string;
  evidenceItems: string[];
  analogPrecedent?: string;
  mutationType?: string;
  viabilityScore: number;
  radicalityScore: number;
  evidenceScore: number;
  compositeScore: number;
  heilmeier?: HeilmeierPanel;
}

export interface BlockedPath {
  id: string;
  title: string;
  summary: string;
  blockingConstraint: string;
  whatWouldNeedToBeTrue: string;
  radicalityScore: number;
  heilmeier?: HeilmeierPanel;
}

export interface IdeaCandidate extends WowCard {
  isBlocked: boolean;
  blockedReason?: string;
}

export interface CreativeOpportunityResult {
  wowCards: WowCard[];
  blockedPaths: BlockedPath[];
  allIdeas: IdeaCandidate[];
}

// ── Internal Types ────────────────────────────────────────────────────────────

interface Dimension {
  id: string;
  name: string;
  variants: string[];
}

interface IdeaVector {
  dimensionValues: Record<string, string>; // dimensionId → chosen variant
  changedDimensions: number;              // how many differ from "baseline" slot 0
  evidenceSupport: string[];              // labels of matching evidence
  structuralFit: number;                  // 0–1
  constraintResolution: boolean;
}

// ── Cross-industry Analogy Library ───────────────────────────────────────────

interface AnalogyPattern {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  structuralSignals: Array<keyof StructuralProfile>;
}

const ANALOGY_LIBRARY: AnalogyPattern[] = [
  {
    id: "platform_inversion",
    label: "Platform Inversion",
    description: "Turn a linear value chain into a multi-sided platform (e.g., Airbnb inverting hotel supply).",
    keywords: ["platform", "marketplace", "two-sided", "aggregation", "network"],
    structuralSignals: ["supplyFragmentation", "distributionControl"],
  },
  {
    id: "subscription_unbundling",
    label: "Subscription Unbundling",
    description: "Disaggregate a bundled offering into modular subscriptions (e.g., newspaper → Substack).",
    keywords: ["subscription", "recurring", "unbundle", "modular", "saas"],
    structuralSignals: ["revenueModel", "switchingCosts"],
  },
  {
    id: "supply_chain_bypass",
    label: "Supply Chain Bypass",
    description: "Go direct-to-consumer by eliminating intermediary layers (e.g., Warby Parker).",
    keywords: ["direct", "bypass", "dtc", "distribution", "intermediary", "channel"],
    structuralSignals: ["distributionControl", "valueChainPosition"],
  },
  {
    id: "demand_aggregation",
    label: "Demand Aggregation",
    description: "Pool fragmented demand to gain pricing or supply power (e.g., GPO purchasing cooperatives).",
    keywords: ["aggregate", "pooling", "cooperative", "buying group", "demand"],
    structuralSignals: ["supplyFragmentation", "customerConcentration"],
  },
  {
    id: "asset_light_pivot",
    label: "Asset-Light Pivot",
    description: "Shed owned assets and operate as a capital-light orchestrator (e.g., Uber, WeWork).",
    keywords: ["asset-light", "orchestration", "capital-light", "lease", "outsource"],
    structuralSignals: ["assetUtilization", "laborIntensity"],
  },
  {
    id: "freemium_wedge",
    label: "Freemium Wedge",
    description: "Use a free tier to acquire users at near-zero CAC, then convert to paid (e.g., Slack, Dropbox).",
    keywords: ["free", "freemium", "trial", "open", "entry"],
    structuralSignals: ["switchingCosts", "revenueModel"],
  },
  {
    id: "marketplace_creation",
    label: "Marketplace Creation",
    description: "Create a neutral marketplace from a previously bilateral transaction (e.g., Etsy, Faire).",
    keywords: ["marketplace", "exchange", "buyer", "seller", "listing"],
    structuralSignals: ["supplyFragmentation", "distributionControl"],
  },
  {
    id: "outcome_based_pricing",
    label: "Outcome-Based Pricing",
    description: "Charge for results delivered, not inputs consumed (e.g., risk-sharing pharma contracts).",
    keywords: ["outcome", "results", "performance", "risk-sharing", "pay-for-results"],
    structuralSignals: ["revenueModel", "marginStructure"],
  },
  {
    id: "community_led_distribution",
    label: "Community-Led Distribution",
    description: "Turn customers into growth agents via referral, ambassador, or community-led loops (e.g., Figma).",
    keywords: ["community", "referral", "ambassador", "viral", "word-of-mouth", "network effect"],
    structuralSignals: ["switchingCosts", "customerConcentration"],
  },
  {
    id: "vertical_integration_unlock",
    label: "Vertical Integration Unlock",
    description: "Capture margin by integrating up or downstream in the value chain (e.g., Zara's fast fashion).",
    keywords: ["vertical", "integration", "own", "control", "upstream", "downstream", "margin"],
    structuralSignals: ["valueChainPosition", "marginStructure"],
  },
];

// ── Dimension Library ─────────────────────────────────────────────────────────

/**
 * Build morphological dimensions from evidence + structural profile.
 * Returns 5–6 dimensions, each with 3–5 variants.
 */
function buildDimensions(
  evidence: NormalizedEvidence[],
  profile: StructuralProfile | null,
): Dimension[] {
  // Delivery model
  const deliveryVariants = ["direct-to-consumer", "intermediated", "platform-mediated", "white-label", "franchise"];
  // Pricing mechanism
  const pricingVariants = ["subscription", "transactional", "outcome-based", "freemium", "auction"];
  // Customer segment
  const customerVariants = ["mass market", "niche/vertical", "enterprise", "prosumer", "micro-SMB"];
  // Value chain position
  const valueChainVariants = ["infrastructure provider", "platform orchestrator", "application layer", "end-service", "data layer"];
  // Technology lever
  const techVariants = ["AI/automation", "network effects", "proprietary data", "API-driven", "community/social"];
  // Revenue timing
  const revenueTimingVariants = ["upfront", "recurring/ARR", "usage-based", "deferred/milestone", "rev-share"];

  // Bias toward variants that match current profile if available
  const biasedDelivery = profile
    ? [
        profile.distributionControl === "owned" ? "direct-to-consumer" : "intermediated",
        ...deliveryVariants.filter(v =>
          profile.distributionControl === "owned" ? v !== "direct-to-consumer" : v !== "intermediated"
        ).slice(0, 3),
      ].slice(0, 4)
    : deliveryVariants.slice(0, 4);

  const biasedPricing = profile
    ? [
        profile.revenueModel === "recurring" ? "subscription" : "transactional",
        ...pricingVariants.filter(v =>
          profile.revenueModel === "recurring" ? v !== "subscription" : v !== "transactional"
        ).slice(0, 3),
      ].slice(0, 4)
    : pricingVariants.slice(0, 4);

  // Count evidence categories to bias segment dimension
  const evidenceCategories = new Set(evidence.map(e => e.category ?? ""));
  const hasBehaviorEvidence = evidenceCategories.has("customer_behavior");
  const biasedCustomer = hasBehaviorEvidence
    ? ["niche/vertical", "mass market", "enterprise", "prosumer"]
    : customerVariants.slice(0, 4);

  return [
    { id: "delivery", name: "Delivery Model", variants: biasedDelivery },
    { id: "pricing", name: "Pricing Mechanism", variants: biasedPricing },
    { id: "customer", name: "Customer Segment", variants: biasedCustomer },
    { id: "value_chain", name: "Value Chain Position", variants: valueChainVariants.slice(0, 4) },
    { id: "tech", name: "Technology Lever", variants: techVariants.slice(0, 4) },
    { id: "revenue_timing", name: "Revenue Timing", variants: revenueTimingVariants.slice(0, 4) },
  ];
}

/**
 * Generate cross-product of dimension variants up to MAX_VECTORS limit.
 * To keep it tractable we only vary 2–3 dimensions at a time from the baseline.
 */
function generateMorphologicalVectors(
  dimensions: Dimension[],
  evidence: NormalizedEvidence[],
  profile: StructuralProfile | null,
  constraints: ConstraintHypothesis[],
): IdeaVector[] {
  const MAX_VECTORS = 60;
  const vectors: IdeaVector[] = [];

  // Baseline = first variant of each dimension
  const baseline: Record<string, string> = {};
  for (const dim of dimensions) {
    baseline[dim.id] = dim.variants[0];
  }

  const bindingConstraintNames = constraints
    .filter(c => c.tier === 1)
    .map(c => c.constraintName.toLowerCase());

  // Generate vectors where 1–3 dimensions differ from baseline
  for (const dim1 of dimensions) {
    for (const v1 of dim1.variants.slice(1)) {
      // Single-dimension change
      const vec: Record<string, string> = { ...baseline, [dim1.id]: v1 };
      vectors.push(scoreVector(vec, baseline, dimensions, evidence, profile, bindingConstraintNames));
      if (vectors.length >= MAX_VECTORS) break;

      // Two-dimension change
      for (const dim2 of dimensions.filter(d => d.id !== dim1.id)) {
        for (const v2 of dim2.variants.slice(1)) {
          const vec2: Record<string, string> = { ...baseline, [dim1.id]: v1, [dim2.id]: v2 };
          vectors.push(scoreVector(vec2, baseline, dimensions, evidence, profile, bindingConstraintNames));
          if (vectors.length >= MAX_VECTORS) break;
        }
        if (vectors.length >= MAX_VECTORS) break;
      }
      if (vectors.length >= MAX_VECTORS) break;
    }
    if (vectors.length >= MAX_VECTORS) break;
  }

  return vectors;
}

function scoreVector(
  vec: Record<string, string>,
  baseline: Record<string, string>,
  dimensions: Dimension[],
  evidence: NormalizedEvidence[],
  profile: StructuralProfile | null,
  bindingConstraintNames: string[],
): IdeaVector {
  const changedDimensions = Object.keys(vec).filter(k => vec[k] !== baseline[k]).length;

  // Evidence support: count evidence labels mentioning the changed variant values
  const changedValues = Object.entries(vec)
    .filter(([k]) => vec[k] !== baseline[k])
    .map(([, v]) => v.toLowerCase());

  const supportingEvidence = evidence.filter(e => {
    const text = `${e.label ?? ""} ${e.description ?? ""}`.toLowerCase();
    return changedValues.some(cv => text.includes(cv.split("/")[0].split("-")[0]));
  });

  // Structural fit
  let structuralFit = 0.5;
  if (profile) {
    const pricingVal = vec["pricing"];
    const deliveryVal = vec["delivery"];
    // Penalize high-margin plays in thin-margin businesses
    if (profile.marginStructure === "thin_margin" && pricingVal === "outcome-based") structuralFit -= 0.15;
    if (profile.marginStructure === "high_margin" && pricingVal === "freemium") structuralFit -= 0.1;
    // Reward recurring revenue if switching costs are high
    if (profile.switchingCosts === "high" && pricingVal === "subscription") structuralFit += 0.2;
    // Reward platform if supply is fragmented
    if (profile.supplyFragmentation === "fragmented" && deliveryVal === "platform-mediated") structuralFit += 0.2;
    if (profile.supplyFragmentation === "atomized" && deliveryVal === "platform-mediated") structuralFit += 0.3;
    // Reward DTC if distribution is intermediated
    if (profile.distributionControl === "intermediated" && deliveryVal === "direct-to-consumer") structuralFit += 0.15;
  }
  structuralFit = Math.max(0, Math.min(1, structuralFit));

  // Constraint resolution: does this vector address a binding constraint?
  const constraintResolution = bindingConstraintNames.some(cn =>
    changedValues.some(cv => cv.includes(cn.split(" ")[0]))
  );

  return {
    dimensionValues: vec,
    changedDimensions,
    evidenceSupport: supportingEvidence.map(e => e.label ?? e.id),
    structuralFit,
    constraintResolution,
  };
}

// ── SCAMPER Mutations ─────────────────────────────────────────────────────────

type ScamperType = "Substitute" | "Combine" | "Adapt" | "Modify" | "Put to other uses" | "Eliminate" | "Reverse";

interface ScamperIdea {
  mutationType: ScamperType;
  title: string;
  summary: string;
  demandAnchor: string;
  supplyAnchor: string;
  evidenceItems: string[];
  radicalityBonus: number; // extra radicality for this mutation type
}

const SCAMPER_RADICALITY: Record<ScamperType, number> = {
  Substitute: 0.4,
  Combine: 0.5,
  Adapt: 0.55,
  Modify: 0.3,
  "Put to other uses": 0.6,
  Eliminate: 0.7,
  Reverse: 0.8,
};

function applyScamper(
  opportunities: DeepenedOpportunity[],
  evidence: NormalizedEvidence[],
): ScamperIdea[] {
  const results: ScamperIdea[] = [];

  for (const opp of opportunities.slice(0, 3)) {
    const label = opp.reconfigurationLabel || opp.label || "";
    const mechanism = opp.economicMechanism?.valueCreation || "";
    const constraint = opp.causalChain?.constraint || "";
    const evidenceItems = (opp.evidenceIds || [])
      .map(eid => evidence.find(e => e.id === eid)?.label ?? eid)
      .filter(Boolean)
      .slice(0, 4);

    // Substitute: swap the primary delivery mechanism
    results.push({
      mutationType: "Substitute",
      title: `Substitute: Replace ${shortLabel(label)} delivery`,
      summary: `Instead of the current delivery model for "${label}", substitute with a digital-first or platform-mediated alternative to remove the primary friction point.`,
      demandAnchor: `Customers seeking ${shortLabel(label)} without the current operational overhead`,
      supplyAnchor: constraint || "Delivery model substitution",
      evidenceItems,
      radicalityBonus: SCAMPER_RADICALITY.Substitute,
    });

    // Combine: merge this opportunity with adjacent market
    results.push({
      mutationType: "Combine",
      title: `Combine: ${shortLabel(label)} + adjacent capability`,
      summary: `Merge the "${label}" model with an adjacent capability or platform to create a combined offering that serves a broader job-to-be-done.`,
      demandAnchor: `Buyers seeking an integrated solution combining ${shortLabel(label)} and adjacent services`,
      supplyAnchor: mechanism || "Combined capability stack",
      evidenceItems,
      radicalityBonus: SCAMPER_RADICALITY.Combine,
    });

    // Adapt: apply a cross-industry pattern
    results.push({
      mutationType: "Adapt",
      title: `Adapt: Apply SaaS-style model to ${shortLabel(label)}`,
      summary: `Adapt the subscription/SaaS model from software to "${label}", turning a one-time transaction into a recurring relationship.`,
      demandAnchor: `Operators seeking predictable access to ${shortLabel(label)} outcomes`,
      supplyAnchor: "Recurring revenue model adaptation",
      evidenceItems,
      radicalityBonus: SCAMPER_RADICALITY.Adapt,
    });

    // Modify/Magnify: amplify the primary constraint inversion
    results.push({
      mutationType: "Modify",
      title: `Magnify: Double down on ${shortLabel(constraint || label)}`,
      summary: `Amplify the ${constraint || "primary constraint"} inversion in "${label}" — instead of a gradual shift, make the constraint inversion the entire product thesis.`,
      demandAnchor: `Customers most frustrated by "${constraint || label}" friction`,
      supplyAnchor: `Amplified constraint inversion of: ${constraint || label}`,
      evidenceItems,
      radicalityBonus: SCAMPER_RADICALITY.Modify,
    });

    // Put to other uses: apply core mechanism to adjacent market
    results.push({
      mutationType: "Put to other uses",
      title: `Repurpose: ${shortLabel(label)} mechanism in new market`,
      summary: `Take the core operational mechanism of "${label}" and apply it to an adjacent vertical where the same constraint exists but no incumbent has addressed it.`,
      demandAnchor: `Adjacent-market buyers with the same underlying constraint as "${constraint || label}"`,
      supplyAnchor: "Mechanism reapplication to new vertical",
      evidenceItems,
      radicalityBonus: SCAMPER_RADICALITY["Put to other uses"],
    });

    // Eliminate: remove assumed dependency
    const dependency = opp.causalChain?.reasoning?.split(" ")[0] || "the assumed dependency";
    results.push({
      mutationType: "Eliminate",
      title: `Eliminate: Remove "${shortLabel(dependency)}" from ${shortLabel(label)}`,
      summary: `Strip out the assumed dependency on "${dependency}" from "${label}". What does the business look like if that dependency simply doesn't exist?`,
      demandAnchor: `Customers who are priced out or blocked by the current dependency on "${dependency}"`,
      supplyAnchor: `Dependency elimination: ${dependency}`,
      evidenceItems,
      radicalityBonus: SCAMPER_RADICALITY.Eliminate,
    });

    // Reverse: invert the customer flow
    results.push({
      mutationType: "Reverse",
      title: `Reverse: Invert customer flow in ${shortLabel(label)}`,
      summary: `Instead of the business finding customers for "${label}", invert the flow so customers opt-in and providers compete for access to them.`,
      demandAnchor: `Buyers who currently have no leverage against ${shortLabel(label)} providers`,
      supplyAnchor: "Inverted customer flow / reverse marketplace",
      evidenceItems,
      radicalityBonus: SCAMPER_RADICALITY.Reverse,
    });
  }

  return results;
}

function shortLabel(s: string): string {
  return s.length > 40 ? s.slice(0, 38) + "…" : s;
}

// ── Analogy Matching ──────────────────────────────────────────────────────────

function findBestAnalogy(
  opp: DeepenedOpportunity,
  profile: StructuralProfile | null,
): AnalogyPattern | null {
  const haystack = `${opp.reconfigurationLabel} ${opp.label} ${opp.summary}`.toLowerCase();

  let bestScore = 0;
  let best: AnalogyPattern | null = null;

  for (const analogy of ANALOGY_LIBRARY) {
    let score = 0;

    // Keyword match
    for (const kw of analogy.keywords) {
      if (haystack.includes(kw)) score += 2;
    }

    // Structural profile match
    if (profile) {
      for (const signal of analogy.structuralSignals) {
        const val = (profile as unknown as Record<string, unknown>)[signal];
        if (val && typeof val === "string") {
          const valStr = val.replace(/_/g, " ");
          if (haystack.includes(valStr)) score += 1;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = analogy;
    }
  }

  // Return only if there's at least a weak match
  return bestScore >= 1 ? best : ANALOGY_LIBRARY[0];
}

// ── Heilmeier Panel Auto-generation ──────────────────────────────────────────

function buildHeilmeier(
  title: string,
  demandAnchor: string,
  supplyAnchor: string,
  innovationMethod: string,
  mutationType: string | undefined,
  evidenceItems: string[],
  blockingConstraint?: string,
  viabilityScore?: number,
): HeilmeierPanel {
  return {
    objective: `${title} — enabling ${demandAnchor} by addressing ${supplyAnchor}.`,
    todaysLimit: blockingConstraint
      ? `Currently blocked by: ${blockingConstraint}.`
      : `The current model is constrained by ${supplyAnchor}, preventing scale.`,
    whatsNew: mutationType
      ? `Generated via ${innovationMethod} (${mutationType} mutation) — a novel recombination not present in the existing pipeline.`
      : `Generated via ${innovationMethod} analysis — structural recombination of existing dimensions.`,
    whoCares: evidenceItems.length > 0
      ? `Directly relevant to customers evidenced by: ${evidenceItems.slice(0, 3).join(", ")}.`
      : `Relevant to customers seeking ${demandAnchor}.`,
    risks: viabilityScore !== undefined && viabilityScore < 0.4
      ? `Low viability signal (${(viabilityScore * 100).toFixed(0)}%) — execution risk is elevated. Requires structural condition change before pursuing.`
      : blockingConstraint
        ? `Primary risk: the blocking constraint "${blockingConstraint}" must change before this path opens.`
        : `Execution risk: requires aligning ${supplyAnchor} with market timing.`,
    successMetric: `First validation: a paying cohort of customers specifically citing ${shortLabel(demandAnchor)} as their primary reason for switching.`,
  };
}

// ── Blocked Path Detection ────────────────────────────────────────────────────

interface BlockSignal {
  isBlocked: boolean;
  blockingConstraint: string;
  whatWouldNeedToBeTrue: string;
}

function detectBlockSignal(
  title: string,
  supplyAnchor: string,
  pricing: string | undefined,
  delivery: string | undefined,
  constraints: ConstraintHypothesis[],
  profile: StructuralProfile | null,
): BlockSignal {
  const anchorLower = supplyAnchor.toLowerCase();
  const titleLower = title.toLowerCase();

  // Check binding constraints (tier 1)
  for (const c of constraints.filter(h => h.tier === 1)) {
    const constraintLower = c.constraintName.toLowerCase();
    // If the constraint appears in the idea's supply anchor and the idea does NOT explicitly resolve it
    if (anchorLower.includes(constraintLower.split(" ")[0]) || titleLower.includes(constraintLower.split(" ")[0])) {
      return {
        isBlocked: true,
        blockingConstraint: c.constraintName,
        whatWouldNeedToBeTrue: c.counterfactualExplanation ||
          `The binding constraint "${c.constraintName}" would need to be resolved — specifically: ${c.explanation}`,
      };
    }
  }

  // Structural incompatibility checks
  if (profile) {
    if (profile.marginStructure === "thin_margin" && pricing === "freemium") {
      return {
        isBlocked: true,
        blockingConstraint: "thin_margin ↔ freemium incompatibility",
        whatWouldNeedToBeTrue:
          "The business would need to achieve high-margin contribution from a paid tier before the free tier is economically sustainable.",
      };
    }
    if (profile.marginStructure === "negative_margin" && (pricing === "outcome-based" || pricing === "subscription")) {
      return {
        isBlocked: true,
        blockingConstraint: "negative_margin ↔ recurring model incompatibility",
        whatWouldNeedToBeTrue:
          "Margin structure would need to recover to at least break-even before a recurring model creates investor-grade unit economics.",
      };
    }
    if (
      (profile.assetUtilization === "underutilized" || profile.assetUtilization === "idle") &&
      delivery === "platform-mediated"
    ) {
      return {
        isBlocked: true,
        blockingConstraint: "asset utilization ↔ platform model mismatch",
        whatWouldNeedToBeTrue:
          "Idle/underutilized assets would need to be monetized or shed before a platform model can achieve the density needed for network effects.",
      };
    }
    if (profile.regulatorySensitivity === "heavy" && (delivery === "direct-to-consumer" || pricing === "outcome-based")) {
      return {
        isBlocked: true,
        blockingConstraint: "heavy regulatory sensitivity ↔ DTC/outcome-based model",
        whatWouldNeedToBeTrue:
          "Regulatory clearance and compliance scaffolding would need to be in place before direct consumer access or performance-contingent billing is viable.",
      };
    }
  }

  return { isBlocked: false, blockingConstraint: "", whatWouldNeedToBeTrue: "" };
}

// ── Idea Scoring ──────────────────────────────────────────────────────────────

function computeScores(
  evidenceSupport: string[],
  totalEvidence: number,
  structuralFit: number,
  changedDimensions: number,
  maxDimensions: number,
): { viabilityScore: number; radicalityScore: number; evidenceScore: number; compositeScore: number } {
  const evidenceScore = totalEvidence > 0
    ? Math.min(1, evidenceSupport.length / Math.max(1, Math.sqrt(totalEvidence)))
    : 0;
  const viabilityScore = Math.min(1, evidenceScore * 0.6 + structuralFit * 0.4);
  const radicalityScore = maxDimensions > 0 ? changedDimensions / maxDimensions : 0;
  const compositeScore = viabilityScore * 0.5 + radicalityScore * 0.3 + evidenceScore * 0.2;
  return {
    viabilityScore: round2(viabilityScore),
    radicalityScore: round2(radicalityScore),
    evidenceScore: round2(evidenceScore),
    compositeScore: round2(compositeScore),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── ID generation ─────────────────────────────────────────────────────────────

let _idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}_${++_idCounter}_${Date.now().toString(36)}`;
}

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Generate creative radical opportunities from the existing analysis pipeline outputs.
 * Deterministic — no AI calls.
 */
export function generateCreativeOpportunities(
  evidence: NormalizedEvidence[],
  structuralProfile: StructuralProfile | null,
  constraintHypotheses: ConstraintHypothesis[],
  deepenedOpportunities: DeepenedOpportunity[],
): CreativeOpportunityResult {
  const allIdeas: IdeaCandidate[] = [];
  const totalEvidence = evidence.length;
  const maxDimensions = 6;

  // ── A. Morphological Analysis ─────────────────────────────────────────────
  const dimensions = buildDimensions(evidence, structuralProfile);
  const morphVectors = generateMorphologicalVectors(dimensions, evidence, structuralProfile, constraintHypotheses);

  for (const vec of morphVectors) {
    const pricingVal = vec.dimensionValues["pricing"];
    const deliveryVal = vec.dimensionValues["delivery"];
    const customerVal = vec.dimensionValues["customer"];
    const techVal = vec.dimensionValues["tech"];
    const revenueTimingVal = vec.dimensionValues["revenue_timing"];

    const title = `${humanizeDelivery(deliveryVal)} + ${humanizePricing(pricingVal)}`;
    const summary = `A ${deliveryVal} model with ${pricingVal} pricing targeting ${customerVal} segments, leveraging ${techVal}.`;
    const demandAnchor = `${customerVal} customers seeking ${deliveryVal} access with ${pricingVal} economics`;
    const supplyAnchor = `${deliveryVal} delivery mechanism, ${revenueTimingVal} revenue timing`;

    const blockSignal = detectBlockSignal(title, supplyAnchor, pricingVal, deliveryVal, constraintHypotheses, structuralProfile);

    const scores = computeScores(
      vec.evidenceSupport,
      totalEvidence,
      vec.structuralFit,
      vec.changedDimensions,
      maxDimensions,
    );

    // Find analogy
    const syntheticOpp: Partial<DeepenedOpportunity> = {
      reconfigurationLabel: title,
      label: title,
      summary,
    };
    const analogy = findBestAnalogy(syntheticOpp as DeepenedOpportunity, structuralProfile);

    const heilmeier = buildHeilmeier(
      title, demandAnchor, supplyAnchor, "morphological",
      undefined, vec.evidenceSupport, blockSignal.blockingConstraint, scores.viabilityScore,
    );

    allIdeas.push({
      id: nextId("morph"),
      title,
      summary,
      innovationMethod: "morphological",
      demandAnchor,
      supplyAnchor,
      evidenceItems: vec.evidenceSupport,
      analogPrecedent: analogy?.label,
      viabilityScore: scores.viabilityScore,
      radicalityScore: scores.radicalityScore,
      evidenceScore: scores.evidenceScore,
      compositeScore: scores.compositeScore,
      isBlocked: blockSignal.isBlocked,
      blockedReason: blockSignal.isBlocked ? blockSignal.whatWouldNeedToBeTrue : undefined,
      heilmeier,
    });
  }

  // ── B. SCAMPER Mutations ──────────────────────────────────────────────────
  const scamperIdeas = applyScamper(deepenedOpportunities, evidence);

  for (const s of scamperIdeas) {
    const blockSignal = detectBlockSignal(
      s.title, s.supplyAnchor, undefined, undefined, constraintHypotheses, structuralProfile,
    );

    // Radicality boosted by mutation type
    const rawRadicality = s.radicalityBonus;
    const evidenceScore = totalEvidence > 0
      ? Math.min(1, s.evidenceItems.length / Math.max(1, Math.sqrt(totalEvidence)))
      : 0;
    const viabilityScore = round2(evidenceScore * 0.5 + (blockSignal.isBlocked ? 0.1 : 0.4));
    const radicalityScore = round2(Math.min(1, rawRadicality));
    const compositeScore = round2(viabilityScore * 0.5 + radicalityScore * 0.3 + evidenceScore * 0.2);

    const heilmeier = buildHeilmeier(
      s.title, s.demandAnchor, s.supplyAnchor, "scamper",
      s.mutationType, s.evidenceItems, blockSignal.blockingConstraint, viabilityScore,
    );

    allIdeas.push({
      id: nextId("scamper"),
      title: s.title,
      summary: s.summary,
      innovationMethod: "scamper",
      demandAnchor: s.demandAnchor,
      supplyAnchor: s.supplyAnchor,
      evidenceItems: s.evidenceItems,
      mutationType: s.mutationType,
      viabilityScore,
      radicalityScore,
      evidenceScore: round2(evidenceScore),
      compositeScore,
      isBlocked: blockSignal.isBlocked,
      blockedReason: blockSignal.isBlocked ? blockSignal.whatWouldNeedToBeTrue : undefined,
      heilmeier,
    });
  }

  // ── C. Analogy-based Ideas ────────────────────────────────────────────────
  for (const opp of deepenedOpportunities.slice(0, 3)) {
    const analogy = findBestAnalogy(opp, structuralProfile);
    if (!analogy) continue;

    const title = `${analogy.label}: Applied to ${shortLabel(opp.reconfigurationLabel || opp.label || "")}`;
    const summary = `${analogy.description} Applied here: ${opp.summary?.slice(0, 120) ?? ""}`;
    const demandAnchor = opp.causalChain?.outcome || `Customers seeking ${analogy.label.toLowerCase()} economics`;
    const supplyAnchor = analogy.label;
    const evidenceItems = (opp.evidenceIds || [])
      .map(eid => evidence.find(e => e.id === eid)?.label ?? eid)
      .filter(Boolean)
      .slice(0, 4);

    const blockSignal = detectBlockSignal(title, supplyAnchor, undefined, undefined, constraintHypotheses, structuralProfile);
    const evidenceScore = round2(totalEvidence > 0 ? Math.min(1, evidenceItems.length / Math.max(1, Math.sqrt(totalEvidence))) : 0);
    const viabilityScore = round2(evidenceScore * 0.5 + (blockSignal.isBlocked ? 0.15 : 0.45));
    const radicalityScore = round2(0.65); // Analogies tend to be radical
    const compositeScore = round2(viabilityScore * 0.5 + radicalityScore * 0.3 + evidenceScore * 0.2);

    const heilmeier = buildHeilmeier(
      title, demandAnchor, supplyAnchor, "analogy",
      undefined, evidenceItems, blockSignal.blockingConstraint, viabilityScore,
    );

    allIdeas.push({
      id: nextId("analogy"),
      title,
      summary,
      innovationMethod: "analogy",
      demandAnchor,
      supplyAnchor,
      evidenceItems,
      analogPrecedent: analogy.label,
      viabilityScore,
      radicalityScore,
      evidenceScore,
      compositeScore,
      isBlocked: blockSignal.isBlocked,
      blockedReason: blockSignal.isBlocked ? blockSignal.whatWouldNeedToBeTrue : undefined,
      heilmeier,
    });
  }

  // ── D. Blocked Paths ──────────────────────────────────────────────────────
  const blockedIdeas = allIdeas.filter(i => i.isBlocked);
  const unblocked = allIdeas.filter(i => !i.isBlocked);

  // Surface top 3 blocked by radicality (always synthesize at least 2 if needed)
  const blockedPaths: BlockedPath[] = blockedIdeas
    .sort((a, b) => b.radicalityScore - a.radicalityScore)
    .slice(0, 3)
    .map(idea => {
      // Find the binding constraint object for this idea
      const matchingConstraint = constraintHypotheses.find(c =>
        (idea.blockedReason ?? "").toLowerCase().includes(c.constraintName.toLowerCase().split(" ")[0])
      );
      const heilmeier = buildHeilmeier(
        idea.title, idea.demandAnchor, idea.supplyAnchor, idea.innovationMethod,
        idea.mutationType, idea.evidenceItems,
        matchingConstraint?.constraintName ?? idea.supplyAnchor,
        idea.viabilityScore,
      );
      return {
        id: nextId("blocked"),
        title: idea.title,
        summary: idea.summary,
        blockingConstraint: matchingConstraint?.constraintName ?? extractBlockingLabel(idea.blockedReason ?? idea.supplyAnchor),
        whatWouldNeedToBeTrue: idea.blockedReason ?? "The structural condition preventing this path would need to change.",
        radicalityScore: idea.radicalityScore,
        heilmeier,
      };
    });

  // If we have fewer than 2 blocked paths, synthesize from highest-radicality unblocked ideas
  // marked as "aspirational" (just surface them as informational blocked paths)
  if (blockedPaths.length < 2) {
    const aspirational = unblocked
      .sort((a, b) => b.radicalityScore - a.radicalityScore)
      .slice(0, 2 - blockedPaths.length);

    for (const a of aspirational) {
      const heilmeier = buildHeilmeier(
        a.title, a.demandAnchor, a.supplyAnchor, a.innovationMethod,
        a.mutationType, a.evidenceItems, "execution complexity", a.viabilityScore,
      );
      blockedPaths.push({
        id: nextId("aspirational"),
        title: `Aspirational: ${a.title}`,
        summary: a.summary,
        blockingConstraint: "execution complexity",
        whatWouldNeedToBeTrue:
          "This path is unblocked by structural constraints but requires significant execution complexity — team capability and capital would need to be assembled.",
        radicalityScore: a.radicalityScore,
        heilmeier,
      });
    }
  }

  // ── E. WowCards — top 5 non-blocked by composite score ───────────────────
  const wowCards: WowCard[] = unblocked
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 5)
    .map(({ isBlocked: _isBlocked, blockedReason: _blockedReason, ...card }) => card);

  return { wowCards, blockedPaths, allIdeas };
}

// ── Humanizers ────────────────────────────────────────────────────────────────

function humanizeDelivery(v: string): string {
  const map: Record<string, string> = {
    "direct-to-consumer": "DTC",
    "intermediated": "Channel-led",
    "platform-mediated": "Platform",
    "white-label": "White-label",
    "franchise": "Franchise",
  };
  return map[v] || v;
}

function humanizePricing(v: string): string {
  const map: Record<string, string> = {
    "subscription": "Subscription",
    "transactional": "Pay-per-use",
    "outcome-based": "Outcome-based",
    "freemium": "Freemium",
    "auction": "Auction/Dynamic",
  };
  return map[v] || v;
}

function extractBlockingLabel(s: string): string {
  // Take first sentence or first 60 chars
  const dot = s.indexOf(".");
  return dot > 0 ? s.slice(0, dot) : s.slice(0, 60);
}
