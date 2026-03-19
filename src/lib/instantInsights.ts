/**
 * Instant Insights Engine — Zero-latency, deterministic pre-computation
 *
 * Runs immediately when scraping completes (~0ms) using only the scraped
 * product data. Produces structural hypotheses that render on OverviewPage
 * and CommandDeckPage BEFORE the AI-powered decomposition/synthesis arrive.
 *
 * These are replaced/refined when Phase 1 (decomposition) and Phase 2
 * (synthesis) complete. They exist to ensure sub-5-second time-to-insight
 * after scraping finishes.
 *
 * PR #20 upgrades:
 *  - System-mapping layer: value creation mechanism, binding coupling,
 *    rate limiter (constraint that, if changed, unlocks the system)
 *  - Evidence-backed contrarian pairs: only surface when a data point
 *    from the scraped product directly supports the claim
 *  - JTBD integration: primaryUnderservedJob extracted alongside insights
 */

import { classifyDisruptionArchetype } from "./disruptionArchetypeClassifier";
import { deriveTrizSeeds, type TrizSeed } from "./trizEngine";
import { extractJtbdProfile, type JtbdProfile } from "./jtbdEngine";
import { type DiagnosticContext } from "./diagnosticContext";

export interface InstantAssumption {
  assumption: string;
  reason: "industry_norm" | "pricing_default" | "supply_chain" | "distribution" | "labor";
  challengeHint: string;
  leverageEstimate: number; // 1-10
  source: string; // which data field drove this
}

export interface InstantLeveragePoint {
  label: string;
  description: string;
  score: number; // 1-10
  type: "friction" | "cost" | "bottleneck" | "distribution" | "pricing";
}

export interface InstantConstraint {
  constraint: string;
  reasoning: string;
  severity: "high" | "medium" | "low";
}

export interface InstantContrarianPair {
  everyoneAssumes: string;
  evidenceSuggests: string;
  soWhat: string;
  source: string; // which heuristic produced this
  /**
   * PR #20 upgrade: the specific data point from scraped product that supports
   * evidenceSuggests. Only present when the pair is evidence-backed.
   * Null means the pair is heuristic-inferred and should be labeled as such.
   */
  evidenceDataPoint: string | null;
  isEvidenceBacked: boolean;
}

/**
 * PR #20 — System Mapping Layer
 *
 * Replaces heuristic-based assumption triggers with explicit value mechanism,
 * binding coupling, and rate limiter analysis. Maps the system at three layers:
 *
 * 1. Value mechanism: How value is created (not just what the business does)
 * 2. Binding coupling: What locks the current system in place (the mechanism
 *    that makes the constraint self-reinforcing)
 * 3. Rate limiter: The single constraint that, if changed, would unlock
 *    disproportionate improvement — the highest-leverage intervention point
 */
export interface SystemMapping {
  valueMechanism: {
    description: string;
    /** The core activity that creates value */
    coreActivity: string;
    /** Who captures the value created and how */
    valueCaptureRoute: string;
    /** What prevents value from leaking to competitors or substitutes */
    defensibilitySignal: string | null;
  };
  bindingCoupling: {
    description: string;
    /** The mechanism that makes the primary constraint self-reinforcing */
    couplingMechanism: string;
    /** What would have to break for this coupling to dissolve */
    dissolutionCondition: string;
    /** Evidence from product data supporting this coupling assessment */
    evidenceSource: string;
  };
  rateLimiter: {
    /** The single constraint whose removal unlocks the most value */
    constraint: string;
    /** How removing this constraint propagates through the system */
    unlockMechanism: string;
    /** Estimated value unlock score 1-10 if this constraint is removed */
    unlockScore: number;
    /** What type of intervention is required */
    interventionType: "technology" | "pricing" | "process" | "distribution" | "capital" | "behavior";
  };
}

export interface InstantInsights {
  assumptions: InstantAssumption[];
  leveragePoints: InstantLeveragePoint[];
  constraints: InstantConstraint[];
  bindingConstraint: {
    label: string;
    reasoning: string;
    leverageScore: number;
  } | null;
  /** The "aha moment" — contrarian pair derived from deterministic heuristics */
  contrarianPair: InstantContrarianPair | null;
  summary: string;
  computedAt: number;
  computeTimeMs: number;
  /** The single most dangerous assumption — highest leverageEstimate from assumptions array */
  dangerousAssumption: InstantAssumption | null;
  /** The single highest leverage point — highest score from leveragePoints array */
  highestLeverage: InstantLeveragePoint | null;
  /** The disruption category this business is most vulnerable to */
  disruptionVulnerability: import("./disruptionArchetypeClassifier").DisruptionArchetype | null;
  /** TRIZ invention seeds — 2-3 historically-proven principles for resolving the binding constraint */
  trizSeeds: TrizSeed[];
  /**
   * PR #20 upgrade — System Mapping Layer:
   * Explicit value mechanism, binding coupling, and rate limiter analysis.
   * Null if insufficient product data to construct a meaningful map.
   */
  systemMapping: SystemMapping | null;
  /**
   * PR #20 upgrade — JTBD Profile:
   * Extracted functional, emotional, and social customer jobs.
   */
  jtbdProfile: JtbdProfile | null;
}

/**
 * Deterministically extract instant insights from scraped product data.
 * No AI calls — pure heuristic extraction from structured fields.
 *
 * PR #20 upgrades:
 * - Builds SystemMapping layer (value mechanism, binding coupling, rate limiter)
 * - Upgrades contrarian pair to require evidence-backed data points
 * - Extracts JTBD profile (functional, emotional, social jobs)
 */
export function computeInstantInsights(product: any, context?: DiagnosticContext): InstantInsights | null {
  if (!product) return null;
  const startTime = performance.now();

  const assumptions: InstantAssumption[] = [];
  const leveragePoints: InstantLeveragePoint[] = [];
  const constraints: InstantConstraint[] = [];

  const name = product.name || "This business";
  const category = product.category || "";
  const isService = isServiceLike(category, product);

  // ═══ PRICING INSIGHTS ═══
  if (product.pricingIntel) {
    const pi = product.pricingIntel;

    if (pi.currentMarketPrice || pi.msrpOriginal) {
      const pricingText = JSON.stringify(pi).toLowerCase();
      const alreadySubscription = /subscri|recurring|monthly|annual|membership|saas|per.seat|per.user/.test(pricingText);
      if (!alreadySubscription) {
        assumptions.push({
          assumption: `${name} must charge per-unit/per-visit pricing`,
          reason: "pricing_default",
          challengeHint: "Subscription, membership, or outcome-based pricing could unlock recurring revenue",
          leverageEstimate: 8,
          source: "pricingIntel",
        });
      }
    }

    if (pi.margins && typeof pi.margins === "object") {
      const marginVal = pi.margins.gross || pi.margins.net || pi.margins.average;
      if (typeof marginVal === "number" && marginVal < 30) {
        leveragePoints.push({
          label: "Low margin structure",
          description: `Current margins (~${marginVal}%) suggest cost structure is a constraint. Margin expansion through bundling or premium tiers could be high-leverage.`,
          score: 8,
          type: "cost",
        });
        constraints.push({
          constraint: "Compressed margins limit growth investment",
          reasoning: `With ~${marginVal}% margins, reinvestment capacity is limited. This constrains marketing spend, talent acquisition, and technology adoption.`,
          severity: "high",
        });
      }
    }

    if (pi.priceDirection === "declining" || pi.priceDirection === "deflationary") {
      assumptions.push({
        assumption: `${name} operates in a price-eroding market`,
        reason: "industry_norm",
        challengeHint: "Value-based pricing or outcome guarantees can decouple from price erosion",
        leverageEstimate: 7,
        source: "pricingIntel.priceDirection",
      });
    }
  }

  // ═══ SUPPLY CHAIN INSIGHTS ═══
  if (product.supplyChain) {
    const sc = product.supplyChain;
    const supplierCount = sc.suppliers?.length || 0;
    const manufacturerCount = sc.manufacturers?.length || 0;

    if (supplierCount > 3) {
      leveragePoints.push({
        label: "Fragmented supply base",
        description: `${supplierCount} suppliers detected — aggregation or vertical integration could reduce costs and improve reliability.`,
        score: 6,
        type: "bottleneck",
      });
    }

    if (supplierCount <= 1 && manufacturerCount <= 1) {
      constraints.push({
        constraint: "Single-source dependency risk",
        reasoning: "Reliance on one or two suppliers creates fragility. Any disruption cascades through the entire operation.",
        severity: "high",
      });
    }

    assumptions.push({
      assumption: `${name} requires a traditional supply chain`,
      reason: "supply_chain",
      challengeHint: "Direct-to-consumer, platform models, or digital-first delivery could eliminate intermediaries",
      leverageEstimate: 7,
      source: "supplyChain",
    });
  }

  // ═══ COMMUNITY / COMPLAINT INSIGHTS ═══
  if (product.communityInsights) {
    const ci = product.communityInsights;
    const complaints = ci.topComplaints || [];
    const requests = ci.improvementRequests || [];

    if (complaints.length > 0) {
      // The #1 complaint is often the #1 leverage point
      leveragePoints.push({
        label: `Top customer pain: "${truncate(complaints[0], 60)}"`,
        description: `Community data reveals ${complaints.length} recurring complaints. Solving the #1 pain point could be the highest-ROI move.`,
        score: 9,
        type: "friction",
      });
    }

    if (requests.length > 0) {
      assumptions.push({
        assumption: `Current feature set is sufficient for the market`,
        reason: "industry_norm",
        challengeHint: `${requests.length} improvement requests suggest unmet demand: "${truncate(requests[0], 50)}"`,
        leverageEstimate: 6,
        source: "communityInsights.improvementRequests",
      });
    }

    const sentiment = ci.communitySentiment || ci.redditSentiment;
    if (sentiment && typeof sentiment === "string") {
      const isNegative = /negative|frustrated|disappointed|angry|poor/i.test(sentiment);
      if (isNegative) {
        constraints.push({
          constraint: "Negative community sentiment",
          reasoning: `Market sentiment is ${sentiment.toLowerCase()}. Customer trust deficit limits organic growth and word-of-mouth.`,
          severity: "medium",
        });
      }
    }
  }

  // ═══ SERVICE-SPECIFIC INSIGHTS ═══
  if (isService) {
    const isRemote = isRemoteLike(category, product);

    if (!isRemote) {
      assumptions.push({
        assumption: `${name} requires in-person, on-site delivery`,
        reason: "labor",
        challengeHint: "Remote diagnostics, IoT monitoring, or preventive subscription models could reduce truck rolls by 30-50%",
        leverageEstimate: 9,
        source: "service_mode",
      });
    }

    assumptions.push({
      assumption: `Pricing must be per-job with manual quoting`,
      reason: "pricing_default",
      challengeHint: "Transparent upfront pricing (like LegalZoom did for legal) or subscription maintenance plans could eliminate quoting friction",
      leverageEstimate: 8,
      source: "service_mode",
    });

    leveragePoints.push({
      label: "Labor-bound capacity ceiling",
      description: "Service delivery scales linearly with headcount. Technology-assisted dispatch, training platforms, or franchise models could break the linear scaling constraint.",
      score: 8,
      type: "bottleneck",
    });

    constraints.push({
      constraint: "Revenue scales linearly with labor hours",
      reasoning: "Each dollar of revenue requires proportional human time. Without productization or technology leverage, growth requires proportional hiring — the fundamental constraint of service businesses.",
      severity: "high",
    });
  }

  // ═══ COMPETITOR INSIGHTS ═══
  if (product.competitorAnalysis) {
    const ca = product.competitorAnalysis;
    if (ca.gaps?.length) {
      leveragePoints.push({
        label: `Competitive gap: "${truncate(ca.gaps[0], 60)}"`,
        description: `${ca.gaps.length} competitive gaps identified. The market leader (${ca.marketLeader || "unknown"}) hasn't addressed these.`,
        score: 7,
        type: "distribution",
      });
    }

    if (ca.marketLeader) {
      assumptions.push({
        assumption: `Must compete head-on with ${ca.marketLeader}`,
        reason: "industry_norm",
        challengeHint: "Flanking strategies (different segment, different model) often outperform direct competition",
        leverageEstimate: 7,
        source: "competitorAnalysis.marketLeader",
      });
    }
  }

  // ═══ USER WORKFLOW INSIGHTS ═══
  if (product.userWorkflow) {
    const uw = product.userWorkflow;
    const frictionPoints = uw.frictionPoints || [];
    if (frictionPoints.length > 2) {
      leveragePoints.push({
        label: `${frictionPoints.length} workflow friction points`,
        description: `User journey has ${frictionPoints.length} friction points. Eliminating the top 2 could dramatically improve conversion and satisfaction.`,
        score: 8,
        type: "friction",
      });
    }
  }

  // ═══ PATENT INSIGHTS ═══
  if (product.patentData) {
    const pd = product.patentData;
    if (pd.expiredPatents > 0) {
      leveragePoints.push({
        label: `${pd.expiredPatents} expired patents`,
        description: `${pd.expiredPatents} patents have expired in this space. Previously protected innovations are now available for use.`,
        score: 6,
        type: "distribution",
      });
    }
  }

  // ═══ UNIVERSAL ASSUMPTIONS ═══
  assumptions.push({
    assumption: `${name} must acquire customers through traditional channels`,
    reason: "distribution",
    challengeHint: "Marketplace aggregation, referral loops, or embedded distribution (like Stripe did for payments) could transform acquisition economics",
    leverageEstimate: 7,
    source: "universal",
  });

  // ═══ BINDING CONSTRAINT HYPOTHESIS ═══
  // Pick the highest-severity constraint as the binding one
  const sorted = [...constraints].sort((a, b) => {
    const sev = { high: 3, medium: 2, low: 1 };
    return (sev[b.severity] || 0) - (sev[a.severity] || 0);
  });

  const bindingConstraint = sorted.length > 0 ? {
    label: sorted[0].constraint,
    reasoning: sorted[0].reasoning,
    leverageScore: sorted[0].severity === "high" ? 8.5 : sorted[0].severity === "medium" ? 6 : 4,
  } : null;

  // ═══ PR #20 — SYSTEM MAPPING LAYER ═══
  // Replace heuristic assumptions with explicit value mechanism + binding coupling + rate limiter
  const systemMapping = buildSystemMapping(product, sorted, leveragePoints, name, isService);

  // ═══ SUMMARY ═══
  const topLeverage = [...leveragePoints].sort((a, b) => b.score - a.score)[0];
  const summary = topLeverage
    ? `Initial scan reveals ${assumptions.length} hidden assumptions and ${leveragePoints.length} leverage points. Highest-impact opportunity: ${topLeverage.label.toLowerCase()}.`
    : `Initial scan of ${name} detected ${assumptions.length} structural assumptions to challenge.`;

  // ═══ CONTRARIAN PAIR — PR #20 upgrade: require evidence-backed data point ═══
  const contrarianPair = deriveContrarianPair(assumptions, constraints, leveragePoints, name, product);

  const computeTimeMs = Math.round(performance.now() - startTime);

  // ═══ THREE NAMED OUTPUTS ═══
  const dangerousAssumption = assumptions.length > 0
    ? [...assumptions].sort((a, b) => b.leverageEstimate - a.leverageEstimate)[0]
    : null;

  const highestLeverage = leveragePoints.length > 0
    ? [...leveragePoints].sort((a, b) => b.score - a.score)[0]
    : null;

  const disruptionVulnerability = classifyDisruptionArchetype(product);

  // Build evidence text for TRIZ two-axis detection (PR #20)
  const evidenceTextForTriz = [
    product?.description || "",
    sorted.map((c) => c.reasoning).join(" "),
    leveragePoints.map((l) => l.description).join(" "),
  ].join(" ");

  const trizSeeds = deriveTrizSeeds(sorted, bindingConstraint, name, evidenceTextForTriz, context);

  // ═══ PR #20 — JTBD PROFILE ═══
  const jtbdProfile = extractJtbdProfile(product);

  return {
    assumptions: assumptions.slice(0, 8),
    leveragePoints: leveragePoints.sort((a, b) => b.score - a.score).slice(0, 6),
    constraints: sorted.slice(0, 5),
    bindingConstraint,
    contrarianPair,
    summary,
    computedAt: Date.now(),
    computeTimeMs,
    dangerousAssumption,
    highestLeverage,
    disruptionVulnerability,
    trizSeeds,
    systemMapping,
    jtbdProfile,
  };
}

/**
 * Derive a contrarian "Everyone Assumes / Evidence Suggests" pair.
 *
 * PR #20 upgrade: require that "evidenceSuggests" references an actual
 * business-specific data point from the scraped product. Suppress the
 * isEvidenceBacked flag when no such data point is found.
 */
function deriveContrarianPair(
  assumptions: InstantAssumption[],
  constraints: InstantConstraint[],
  leveragePoints: InstantLeveragePoint[],
  entityName: string,
  product: any,
): InstantContrarianPair | null {
  // Pick the highest-leverage assumption
  const sorted = [...assumptions].sort((a, b) => b.leverageEstimate - a.leverageEstimate);
  const top = sorted[0];
  if (!top) return null;

  // The assumption IS the "everyone assumes" — the challenge hint IS the "evidence suggests"
  const everyoneAssumes = top.assumption;
  const evidenceSuggests = top.challengeHint;

  // "So What" from the binding constraint or top leverage point
  const topLeverage = [...leveragePoints].sort((a, b) => b.score - a.score)[0];
  const soWhat = topLeverage
    ? `${entityName} could unlock ${topLeverage.type === "cost" ? "margin expansion" : topLeverage.type === "friction" ? "customer satisfaction" : topLeverage.type === "bottleneck" ? "capacity growth" : "competitive advantage"} by challenging this assumption`
    : `${entityName} has structural leverage that competitors aren't exploiting`;

  // PR #20: find a specific data point from product that backs evidenceSuggests
  const evidenceDataPoint = findEvidenceDataPoint(top, product);

  return {
    everyoneAssumes,
    evidenceSuggests,
    soWhat,
    source: top.source,
    evidenceDataPoint,
    isEvidenceBacked: evidenceDataPoint !== null,
  };
}

/**
 * Find a specific scraped data point that supports an assumption's challengeHint.
 * PR #20: contrarian pairs must cite actual business data, not generic claims.
 * Returns null if no supporting data point is found in the product object.
 */
function findEvidenceDataPoint(assumption: InstantAssumption, product: any): string | null {
  if (!product) return null;

  // Pricing evidence — use actual margin or price data
  if (assumption.source === "pricingIntel" || assumption.reason === "pricing_default") {
    const pi = product.pricingIntel;
    if (pi) {
      if (pi.margins?.gross != null) return `Gross margin: ${pi.margins.gross}% (source: pricing intel)`;
      if (pi.currentMarketPrice) return `Current market price: ${pi.currentMarketPrice} (source: pricing intel)`;
      if (pi.priceDirection) return `Price direction: ${pi.priceDirection} (source: pricing intel)`;
    }
  }

  // Community complaint evidence — use top complaint as data point
  if (assumption.source.includes("communityInsights") || assumption.reason === "industry_norm") {
    const ci = product.communityInsights;
    if (ci?.topComplaints?.[0]) {
      return `Top community complaint: "${truncate(ci.topComplaints[0], 80)}" (source: community insights)`;
    }
    if (ci?.improvementRequests?.[0]) {
      return `Top improvement request: "${truncate(ci.improvementRequests[0], 80)}" (source: community insights)`;
    }
  }

  // Supply chain evidence
  if (assumption.source === "supplyChain" || assumption.reason === "supply_chain") {
    const sc = product.supplyChain;
    if (sc?.suppliers?.length > 0) {
      return `${sc.suppliers.length} supplier(s) detected: ${sc.suppliers.slice(0, 2).join(", ")} (source: supply chain)`;
    }
  }

  // Competitor evidence
  if (assumption.source.includes("competitor") || assumption.reason === "distribution") {
    const ca = product.competitorAnalysis;
    if (ca?.marketLeader) return `Market leader identified: ${ca.marketLeader} (source: competitor analysis)`;
    if (ca?.gaps?.[0]) return `Competitive gap: "${truncate(ca.gaps[0], 80)}" (source: competitor analysis)`;
  }

  // Service mode evidence — use category as the backing data
  if (assumption.source === "service_mode" || assumption.reason === "labor") {
    const category = product.category;
    if (category) return `Business category "${category}" confirms service delivery model (source: product category)`;
  }

  // Universal assumptions — cannot be evidence-backed deterministically
  return null;
}

/**
 * PR #20 — Build the System Mapping Layer.
 *
 * Analyzes the scraped product data to extract:
 * 1. Value mechanism (how value is created, captured, defended)
 * 2. Binding coupling (the self-reinforcing mechanism that locks constraints in)
 * 3. Rate limiter (the single constraint whose removal unlocks the most value)
 *
 * This replaces heuristic-based assumption triggers with explicit structural
 * reasoning, following the First Principles Decomposition requirements.
 */
function buildSystemMapping(
  product: any,
  sortedConstraints: InstantConstraint[],
  leveragePoints: InstantLeveragePoint[],
  name: string,
  isService: boolean,
): SystemMapping | null {
  // Require at minimum: constraints + leverage points to build a meaningful map
  if (sortedConstraints.length === 0 && leveragePoints.length === 0) return null;

  const desc = (product?.description || "").toLowerCase();
  const category = (product?.category || "").toLowerCase();
  const pi = product?.pricingIntel;
  const ca = product?.competitorAnalysis;
  const sc = product?.supplyChain;
  const ci = product?.communityInsights;

  // ── 1. Value Mechanism ──────────────────────────────────────────────────────
  const coreActivity = isService
    ? `Labor-delivered ${category || "service"} — skilled technicians/specialists create value through in-person expertise`
    : `Physical product or digital platform — value created through ${desc.slice(0, 60) || "functional delivery"}`;

  const valueCaptureRoute = pi?.priceDirection === "declining"
    ? `Transaction-based pricing under margin pressure — value captured per unit but rate is eroding`
    : pi?.currentMarketPrice
      ? `Per-unit transaction pricing at ~${pi.currentMarketPrice} — value capture is transactional`
      : "Transaction-based pricing — each job/sale is a discrete capture event";

  const defensibilitySignal = ca?.competitiveAdvantages?.[0] || ca?.marketLeader
    ? ca.competitiveAdvantages?.[0] ?? `Market leadership context: ${ca.marketLeader}`
    : null;

  // ── 2. Binding Coupling ─────────────────────────────────────────────────────
  // The binding coupling is the mechanism that makes the primary constraint self-reinforcing
  const primaryConstraint = sortedConstraints[0];
  let couplingMechanism: string;
  let dissolutionCondition: string;
  let evidenceSource: string;

  if (isService && /labor|headcount|manual|person/.test(primaryConstraint?.reasoning || "")) {
    couplingMechanism = "Labor-to-revenue coupling: each incremental unit of revenue requires proportional labor — hiring is the only growth lever, which itself creates capacity constraints and margin dilution";
    dissolutionCondition = "Coupling dissolves when technology (remote delivery, AI triage, or self-service) or productization decouples revenue from headcount";
    evidenceSource = `Service category "${category}" confirms labor-based delivery model`;
  } else if (pi?.margins?.gross != null && pi.margins.gross < 30) {
    couplingMechanism = `Margin-cost coupling: compressed ${pi.margins.gross}% gross margins limit reinvestment capacity — low margins constrain marketing, talent acquisition, and technology adoption simultaneously`;
    dissolutionCondition = "Coupling dissolves when pricing model shifts (subscription, outcome-based, or premium tier) OR cost structure is restructured through vertical integration";
    evidenceSource = `Gross margin data: ${pi.margins.gross}% (source: pricing intel)`;
  } else if (sc?.suppliers?.length <= 1) {
    couplingMechanism = "Single-source dependency coupling: supply chain concentrated in ≤1 supplier — any disruption cascades to all delivery, making resilience impossible at current configuration";
    dissolutionCondition = "Coupling dissolves when supply base is diversified to ≥3 suppliers or direct manufacturing relationship is established";
    evidenceSource = `${sc.suppliers?.length || 0} supplier(s) detected (source: supply chain data)`;
  } else if (ci?.topComplaints?.length > 0) {
    couplingMechanism = `Customer complaint coupling: "${truncate(ci.topComplaints[0], 60)}" is driving negative sentiment which limits organic growth — NPS depression creates a ceiling on referral-led acquisition`;
    dissolutionCondition = "Coupling dissolves when the root cause of the top complaint is systematically removed from the customer journey";
    evidenceSource = `Top complaint: "${truncate(ci.topComplaints[0], 80)}" (source: community insights)`;
  } else {
    couplingMechanism = "Distribution-reach coupling: current channel structure limits addressable market — growth requires proportionally more distribution effort per new customer";
    dissolutionCondition = "Coupling dissolves when network effects, platform leverage, or embedded distribution reduce per-customer acquisition cost";
    evidenceSource = "Inferred from market structure analysis";
  }

  // ── 3. Rate Limiter ─────────────────────────────────────────────────────────
  // The rate limiter is the single constraint whose removal unlocks the most value
  const topLeverage = [...leveragePoints].sort((a, b) => b.score - a.score)[0];
  const highestSeverityConstraint = sortedConstraints[0];

  let rateConstraint: string;
  let unlockMechanism: string;
  let unlockScore: number;
  let interventionType: SystemMapping["rateLimiter"]["interventionType"];

  if (topLeverage?.type === "bottleneck" || (isService && sortedConstraints.some(c => /labor|linear|headcount/.test(c.reasoning)))) {
    rateConstraint = "Labor-bound capacity ceiling — revenue cannot grow faster than headcount";
    unlockMechanism = "Removing this constraint requires decoupling delivery from labor: technology-assisted service, productized offering, or self-service layer that scales without proportional hiring";
    unlockScore = 9;
    interventionType = "technology";
  } else if (topLeverage?.type === "cost" || (pi?.margins?.gross != null && pi.margins.gross < 30)) {
    rateConstraint = `Margin compression (${pi?.margins?.gross != null ? `~${pi.margins.gross}%` : "below 30%"}) — constrains reinvestment and growth capital`;
    unlockMechanism = "Removing this constraint requires a pricing model shift (subscription/outcome-based) or structural cost reduction (vertical integration, automation) that breaks the margin ceiling";
    unlockScore = 8;
    interventionType = "pricing";
  } else if (topLeverage?.type === "friction" && ci?.topComplaints?.length > 0) {
    rateConstraint = `Customer friction: "${truncate(ci.topComplaints[0], 60)}" — depressing NPS and limiting organic growth`;
    unlockMechanism = "Removing this constraint requires solving the root cause identified in community data — unlocks referral growth and reduces CAC through improved NPS";
    unlockScore = 8;
    interventionType = "process";
  } else if (topLeverage?.type === "distribution") {
    rateConstraint = "Distribution constraint — current channel limits addressable market";
    unlockMechanism = "Removing this constraint requires adding a digital, self-serve, or embedded distribution channel that reaches customers at point of need";
    unlockScore = 7;
    interventionType = "distribution";
  } else {
    rateConstraint = highestSeverityConstraint?.constraint || "Primary structural constraint limiting growth";
    unlockMechanism = highestSeverityConstraint?.reasoning || "Systematic removal requires identifying and targeting the binding mechanism";
    unlockScore = 7;
    interventionType = "process";
  }

  return {
    valueMechanism: {
      description: `${name} creates value through ${coreActivity.toLowerCase()}. Value is captured via ${valueCaptureRoute.toLowerCase()}.`,
      coreActivity,
      valueCaptureRoute,
      defensibilitySignal,
    },
    bindingCoupling: {
      description: `The primary constraint at ${name} is self-reinforcing via: ${couplingMechanism}`,
      couplingMechanism,
      dissolutionCondition,
      evidenceSource,
    },
    rateLimiter: {
      constraint: rateConstraint,
      unlockMechanism,
      unlockScore,
      interventionType,
    },
  };
}

function isServiceLike(category: string, product: any): boolean {
  const serviceCategories = new Set([
    "home services", "professional services", "consulting", "skilled trades",
    "healthcare", "education", "financial services", "legal services",
    "cleaning", "landscaping", "plumbing", "electrical", "hvac",
    "personal care", "fitness", "beauty", "repair", "maintenance",
    "transportation", "logistics", "hospitality", "food service",
  ]);

  const cat = category.toLowerCase().trim();
  if (serviceCategories.has(cat)) return true;

  // Check description for service indicators
  const desc = (product.description || "").toLowerCase();
  const serviceKeywords = ["service", "repair", "install", "maintenance", "consult", "deliver", "clean", "fix"];
  return serviceKeywords.some(kw => desc.includes(kw));
}

function isRemoteLike(category: string, product: any): boolean {
  const remoteCategories = new Set([
    "saas", "software", "digital", "online", "remote", "virtual",
    "consulting", "coaching", "financial services", "legal services",
    "education", "e-learning", "marketing", "seo", "content",
  ]);
  const cat = category.toLowerCase().trim();
  if (remoteCategories.has(cat)) return true;
  const desc = (product.description || "").toLowerCase();
  const remoteKeywords = ["online", "remote", "virtual", "digital", "software", "saas", "cloud", "platform"];
  return remoteKeywords.some(kw => desc.includes(kw));
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
