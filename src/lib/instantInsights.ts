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
 */

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
}

/**
 * Deterministically extract instant insights from scraped product data.
 * No AI calls — pure heuristic extraction from structured fields.
 */
export function computeInstantInsights(product: any): InstantInsights | null {
  if (!product) return null;

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
      assumptions.push({
        assumption: `${name} must charge per-unit/per-visit pricing`,
        reason: "pricing_default",
        challengeHint: "Subscription, membership, or outcome-based pricing could unlock recurring revenue",
        leverageEstimate: 8,
        source: "pricingIntel",
      });
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
    assumptions.push({
      assumption: `${name} requires in-person, on-site delivery`,
      reason: "labor",
      challengeHint: "Remote diagnostics, IoT monitoring, or preventive subscription models could reduce truck rolls by 30-50%",
      leverageEstimate: 9,
      source: "service_mode",
    });

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

  // ═══ SUMMARY ═══
  const topLeverage = [...leveragePoints].sort((a, b) => b.score - a.score)[0];
  const summary = topLeverage
    ? `Initial scan reveals ${assumptions.length} hidden assumptions and ${leveragePoints.length} leverage points. Highest-impact opportunity: ${topLeverage.label.toLowerCase()}.`
    : `Initial scan of ${name} detected ${assumptions.length} structural assumptions to challenge.`;

  return {
    assumptions: assumptions.slice(0, 8), // Cap at 8 for clarity
    leveragePoints: leveragePoints.sort((a, b) => b.score - a.score).slice(0, 6),
    constraints: sorted.slice(0, 5),
    bindingConstraint,
    summary,
    computedAt: Date.now(),
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

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
