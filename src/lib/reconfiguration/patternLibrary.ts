/**
 * STRUCTURAL INNOVATION PATTERN LIBRARY — 6 Core Moves
 *
 * Each pattern represents a fundamental structural reconfiguration.
 * Patterns have binary qualification gates (qualifies or doesn't)
 * and strength signals for ranking among qualified patterns.
 *
 * Design principle: any real-world strategic transformation can be
 * described as one pattern or a composition of two.
 *
 * The 6 patterns:
 *   1. Aggregation      — Consolidate fragmented supply into a unified interface
 *   2. Unbundling       — Decompose a bundled offering into purchasable components
 *   3. Rebundling       — Reassemble unbundled components around a new value axis
 *   4. Supply Chain Relocation — Move value delivery to a different point in the chain
 *   5. Stakeholder Monetization — Capture value from a participant who currently uses for free
 *   6. Infrastructure Abstraction — Extract a repeatable capability into shared infrastructure
 */

import type { StructuralProfile } from "./structuralProfile";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface StrategicBetTemplate {
  /** The assumption the industry currently operates under */
  industryAssumption: string;
  /** The contrarian belief this pattern bets on */
  contrarianBelief: string;
  /** The economic implication if the contrarian belief is correct */
  implication: string;
}

export interface QualificationResult {
  qualifies: boolean;
  /** Why this pattern qualifies or is disqualified */
  reason: string;
  /** Evidence dimensions that strengthened the qualification */
  strengthSignals: string[];
  /** Constraints this pattern would directly resolve */
  resolvesConstraints: string[];
}

export interface StructuralPattern {
  id: string;
  name: string;
  /** One-sentence structural transformation */
  transformation: string;
  /** How the transformation creates economic value */
  mechanism: string;
  /** The strategic bet this pattern makes against industry convention */
  strategicBet: StrategicBetTemplate;
  /** Canonical examples of this pattern in practice */
  precedents: string[];
  /** Binary qualification gate — does the structural profile support this pattern? */
  qualifies: (profile: StructuralProfile) => QualificationResult;
}

// ═══════════════════════════════════════════════════════════════
//  PATTERN DEFINITIONS
// ═══════════════════════════════════════════════════════════════

const constraintNames = (profile: StructuralProfile) =>
  new Set(profile.bindingConstraints.map(c => c.constraintName));

export const STRUCTURAL_PATTERNS: StructuralPattern[] = [
  // ── 1. AGGREGATION ──
  {
    id: "aggregation",
    name: "Aggregation",
    transformation:
      "Consolidate fragmented supply into a unified interface that reduces search costs and enables comparison.",
    mechanism:
      "A single access point over many small providers creates demand liquidity, lowers buyer search costs, and generates supply-side network effects. Revenue comes from take rates, listing fees, or data advantages.",
    strategicBet: {
      industryAssumption: "Suppliers must control their own customer relationships to compete.",
      contrarianBelief: "Customers value comparison, convenience, and trust more than supplier loyalty.",
      implication: "Aggregation unlocks demand liquidity and the aggregator captures the relationship premium.",
    },
    precedents: [
      "Booking.com (fragmented hotels → unified booking)",
      "Amazon Marketplace (fragmented retail → single storefront)",
      "Uber (fragmented taxi operators → unified ride platform)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: supply must be fragmented
      if (profile.supplyFragmentation === "consolidated") {
        return { qualifies: false, reason: "Supply is consolidated — no fragmentation to aggregate.", strengthSignals: [], resolvesConstraints: [] };
      }
      // Gate: regulatory sensitivity blocks marketplace models
      if (profile.regulatorySensitivity === "heavy") {
        return { qualifies: false, reason: "Heavy regulation makes marketplace aggregation impractical.", strengthSignals: [], resolvesConstraints: [] };
      }
      // Gate: labor-heavy businesses rarely benefit from aggregation — the constraint is delivery, not discovery
      if ((profile.laborIntensity === "labor_heavy" || profile.laborIntensity === "artisan") && profile.distributionControl !== "intermediated") {
        return { qualifies: false, reason: "Labor-heavy delivery with non-intermediated distribution — aggregation doesn't resolve the binding constraint.", strengthSignals: [], resolvesConstraints: [] };
      }
      // Gate: if distribution is already owned, aggregation adds little value
      if (profile.distributionControl === "owned") {
        return { qualifies: false, reason: "Distribution is already owned — aggregation has no leverage point.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (profile.supplyFragmentation === "atomized") strengths.push("Highly atomized supply — strong aggregation opportunity");
      if (profile.supplyFragmentation === "fragmented") strengths.push("Fragmented supply amenable to aggregation");
      if (profile.supplyFragmentation === "moderate") strengths.push("Moderate supply fragmentation — partial aggregation opportunity");
      if (profile.distributionControl === "intermediated") strengths.push("Intermediated distribution suggests disintermediation via aggregation");
      if (profile.distributionControl === "shared") strengths.push("Shared distribution control — aggregation can shift leverage");
      if (cNames.has("supply_fragmentation")) { resolves.push("supply_fragmentation"); strengths.push("Directly resolves supply fragmentation constraint"); }
      if (cNames.has("information_asymmetry")) { resolves.push("information_asymmetry"); strengths.push("Aggregation reduces information asymmetry"); }
      if (cNames.has("geographic_constraint")) { resolves.push("geographic_constraint"); strengths.push("Digital aggregation removes geographic limitation"); }
      if (cNames.has("vendor_concentration")) { resolves.push("vendor_concentration"); strengths.push("Aggregation reduces vendor concentration risk"); }

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports aggregation." : "Insufficient signal density for aggregation.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 2. UNBUNDLING ──
  {
    id: "unbundling",
    name: "Unbundling",
    transformation:
      "Decompose a monolithic offering into independently purchasable components, letting customers pay only for what they value.",
    mechanism:
      "Separating bundled value components eliminates cross-subsidy waste, improves price-to-value alignment, and often reveals that one component captures most of the willingness-to-pay.",
    strategicBet: {
      industryAssumption: "Customers want a complete, integrated solution and will pay for the whole package.",
      contrarianBelief: "Most customers only value 1-2 components and resent paying for the rest.",
      implication: "Unbundling captures the high-value component at better margins while competitors subsidize waste.",
    },
    precedents: [
      "Craigslist unbundled newspapers (classifieds, news, coupons as separate products)",
      "Spotify unbundled the album (single-track access)",
      "Stripe unbundled payment processing from banking relationships",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: thin margins + recurring revenue suggest already lean — unbundling may hurt
      if (profile.marginStructure === "thin_margin" && profile.revenueModel === "recurring") {
        return { qualifies: false, reason: "Thin margins on recurring revenue — unbundling would erode unit economics.", strengthSignals: [], resolvesConstraints: [] };
      }
      // Gate: labor-heavy services are rarely "bundled products" — unbundling doesn't apply
      if ((profile.laborIntensity === "labor_heavy" || profile.laborIntensity === "artisan") && profile.supplyFragmentation !== "consolidated") {
        return { qualifies: false, reason: "Labor-heavy service with fragmented supply — no monolithic bundle to decompose.", strengthSignals: [], resolvesConstraints: [] };
      }
      // Gate: atomized supply means the market is already unbundled
      if (profile.supplyFragmentation === "atomized") {
        return { qualifies: false, reason: "Atomized supply indicates market is already unbundled.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (cNames.has("forced_bundling")) { resolves.push("forced_bundling"); strengths.push("Forced bundling detected — direct unbundling target"); }
      if (cNames.has("perceived_value_mismatch")) { resolves.push("perceived_value_mismatch"); strengths.push("Value mismatch suggests customers overpay for unwanted components"); }
      if (cNames.has("capital_barrier")) { resolves.push("capital_barrier"); strengths.push("High upfront cost may be reducible by unbundling components"); }
      if (cNames.has("operational_bottleneck")) { resolves.push("operational_bottleneck"); strengths.push("Operational bottleneck may be isolated by unbundling affected components"); }
      if (profile.marginStructure === "high_margin") strengths.push("High margins suggest cross-subsidized components");
      if (profile.marginStructure === "moderate_margin") strengths.push("Moderate margins may hide cross-subsidized components");
      if (profile.switchingCosts === "low" || profile.switchingCosts === "none") strengths.push("Low switching costs enable component-level competition");
      if (profile.switchingCosts === "moderate") strengths.push("Moderate switching costs may be reduced via component unbundling");

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports unbundling." : "Insufficient signal density for unbundling.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 3. REBUNDLING ──
  {
    id: "rebundling",
    name: "Rebundling",
    transformation:
      "Reassemble previously unbundled components around a new value axis that the original bundle missed.",
    mechanism:
      "After an industry unbundles, customer needs that span multiple unbundled products create rebundling opportunities. The new bundle is organized around a job-to-be-done rather than a legacy category.",
    strategicBet: {
      industryAssumption: "The current category boundaries reflect how customers think about their needs.",
      contrarianBelief: "Customers organize around jobs-to-be-done, not product categories — and the current categories are wrong.",
      implication: "Rebundling around the true job captures willingness-to-pay that fragmented point solutions can't.",
    },
    precedents: [
      "Apple ecosystem (rebundled hardware + software + services around 'creative professional')",
      "WeWork (rebundled real estate + community + services around 'startup workspace')",
      "Notion (rebundled docs + wiki + project management around 'team knowledge')",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: consolidated supply means the market hasn't unbundled yet
      if (profile.supplyFragmentation === "consolidated" && profile.switchingCosts === "high") {
        return { qualifies: false, reason: "Consolidated market with high switching costs — no unbundled fragments to rebundle.", strengthSignals: [], resolvesConstraints: [] };
      }
      // Gate: consolidated supply in general — need prior fragmentation for rebundling to make sense
      if (profile.supplyFragmentation === "consolidated") {
        return { qualifies: false, reason: "Consolidated supply — rebundling requires prior unbundling or fragmentation.", strengthSignals: [], resolvesConstraints: [] };
      }
      // Gate: labor-heavy + high switching costs — rebundling is unlikely to work when delivery is bespoke and sticky
      if ((profile.laborIntensity === "labor_heavy" || profile.laborIntensity === "artisan") && profile.switchingCosts === "high") {
        return { qualifies: false, reason: "Labor-heavy delivery with high switching costs — rebundling adds insufficient value over incumbent relationships.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (profile.supplyFragmentation === "fragmented" || profile.supplyFragmentation === "atomized") {
        strengths.push("Fragmented supply suggests prior unbundling — rebundling opportunity exists");
      }
      if (profile.supplyFragmentation === "moderate") {
        strengths.push("Moderate fragmentation — partial rebundling around new value axis possible");
      }
      if (profile.switchingCosts === "low" || profile.switchingCosts === "none") {
        strengths.push("Low switching costs enable rebundling from multiple point solutions");
      }
      if (profile.switchingCosts === "moderate") {
        strengths.push("Moderate switching costs suggest rebundling can create stickier offering");
      }
      if (cNames.has("awareness_gap")) { resolves.push("awareness_gap"); strengths.push("Rebundled offering may solve discovery problem across fragmented solutions"); }
      if (cNames.has("access_constraint")) { resolves.push("access_constraint"); strengths.push("Unified bundle improves access to currently scattered capabilities"); }
      if (cNames.has("operational_bottleneck")) { resolves.push("operational_bottleneck"); strengths.push("Rebundling can eliminate operational bottlenecks across fragmented workflows"); }

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports rebundling." : "Insufficient signal density for rebundling.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 4. SUPPLY CHAIN RELOCATION ──
  {
    id: "supply_chain_relocation",
    name: "Supply Chain Relocation",
    transformation:
      "Move value delivery to a different point in the chain — bypass intermediaries, move upstream/downstream, or relocate geographically.",
    mechanism:
      "Capturing a different position in the value chain (closer to the customer, upstream to control supply, or to a lower-cost geography) restructures where margin accrues and who controls the customer relationship.",
    strategicBet: {
      industryAssumption: "The current distribution of margin across the value chain is stable and necessary.",
      contrarianBelief: "At least one position in the chain captures disproportionate margin relative to the value it adds.",
      implication: "Relocating to a higher-leverage position captures the margin delta without adding proportional cost.",
    },
    precedents: [
      "Tesla (bypassed dealer network — moved downstream to direct sales)",
      "Warby Parker (bypassed luxottica — moved upstream to own manufacturing + downstream to DTC)",
      "Dollar Shave Club (relocated from retail shelf to mailbox)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: if distribution is already owned and margins are high, relocation has limited upside
      if (profile.distributionControl === "owned" && profile.marginStructure === "high_margin") {
        return { qualifies: false, reason: "Already controls distribution with high margins — limited relocation upside.", strengthSignals: [], resolvesConstraints: [] };
      }
      // Gate: owned distribution with non-thin margins — no chain position problem to solve
      if (profile.distributionControl === "owned" && profile.marginStructure !== "thin_margin") {
        return { qualifies: false, reason: "Owns distribution with healthy margins — no chain position problem.", strengthSignals: [], resolvesConstraints: [] };
      }
      // Gate: labor-heavy + owned distribution — the constraint is delivery capacity, not chain position
      if ((profile.laborIntensity === "labor_heavy" || profile.laborIntensity === "artisan") && profile.distributionControl === "owned") {
        return { qualifies: false, reason: "Labor-heavy with owned distribution — constraint is delivery capacity, not chain position.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (profile.distributionControl === "intermediated") strengths.push("Intermediated distribution — bypass or disintermediation opportunity");
      if (profile.distributionControl === "shared") strengths.push("Shared distribution — opportunity to gain full control via relocation");
      if (profile.marginStructure === "thin_margin") strengths.push("Thin margins suggest margin is captured elsewhere in the chain");
      if (profile.marginStructure === "moderate_margin" && profile.distributionControl !== "owned") strengths.push("Moderate margins with non-owned distribution — chain position may compress returns");
      if (cNames.has("channel_dependency")) { resolves.push("channel_dependency"); strengths.push("Channel dependency is a direct relocation target"); }
      if (cNames.has("margin_compression")) { resolves.push("margin_compression"); strengths.push("Margin compression may be caused by chain position"); }
      if (cNames.has("geographic_constraint")) { resolves.push("geographic_constraint"); strengths.push("Geographic constraint suggests physical relocation opportunity"); }
      if (cNames.has("vendor_concentration")) { resolves.push("vendor_concentration"); strengths.push("Vendor concentration creates upstream relocation opportunity"); }
      if (cNames.has("operational_bottleneck")) { resolves.push("operational_bottleneck"); strengths.push("Operational bottleneck may be resolved by relocating in the chain"); }

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports supply chain relocation." : "Insufficient signal density for supply chain relocation.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 5. STAKEHOLDER MONETIZATION ──
  {
    id: "stakeholder_monetization",
    name: "Stakeholder Monetization",
    transformation:
      "Capture value from a participant in the system who currently benefits without paying — or from an asset currently generating no revenue.",
    mechanism:
      "Identify a stakeholder (data, audience, infrastructure, byproduct) that provides latent value and create a revenue mechanism around it. This often transforms a cost center into a profit center.",
    strategicBet: {
      industryAssumption: "Revenue can only come from the obvious customer — the person who currently pays.",
      contrarianBelief: "There are hidden stakeholders (data buyers, advertisers, complementary providers) willing to pay for access to what the business already produces.",
      implication: "Stakeholder monetization creates a second revenue stream without proportional cost increase.",
    },
    precedents: [
      "Google (monetized search users' attention via advertisers)",
      "Amazon AWS (monetized idle server infrastructure to external developers)",
      "Peloton (monetized hardware install base via content subscription)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: negative margins mean there may not be a viable base to monetize against
      if (profile.marginStructure === "negative_margin" && profile.assetUtilization === "high") {
        return { qualifies: false, reason: "Negative margins with fully utilized assets — no latent value to monetize.", strengthSignals: [], resolvesConstraints: [] };
      }
      // Gate: labor-heavy with high utilization — no spare capacity or latent asset to monetize
      if ((profile.laborIntensity === "labor_heavy" || profile.laborIntensity === "artisan") && profile.assetUtilization === "high") {
        return { qualifies: false, reason: "Labor-heavy with fully utilized capacity — no latent asset to monetize.", strengthSignals: [], resolvesConstraints: [] };
      }
      // Gate: thin margins + high utilization — the business is already squeezing everything
      if (profile.marginStructure === "thin_margin" && profile.assetUtilization === "high" && !cNames.has("asset_underutilization")) {
        return { qualifies: false, reason: "Thin margins with high asset utilization — no hidden value to extract.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (profile.assetUtilization === "underutilized" || profile.assetUtilization === "idle") {
        strengths.push("Underutilized assets suggest hidden monetization opportunity");
      }
      if (profile.customerConcentration === "concentrated") {
        strengths.push("Concentrated customers may indicate unmonetized peripheral stakeholders");
      }
      if (cNames.has("asset_underutilization")) { resolves.push("asset_underutilization"); strengths.push("Underutilized assets are a direct monetization target"); }
      if (cNames.has("revenue_concentration")) { resolves.push("revenue_concentration"); strengths.push("Revenue concentration suggests untapped stakeholders"); }
      if (cNames.has("transactional_revenue")) { resolves.push("transactional_revenue"); strengths.push("Transactional model may hide relationship-based monetization"); }
      if (profile.revenueModel === "project_based" || profile.revenueModel === "transactional") {
        strengths.push("Non-recurring revenue model may have hidden recurring value to capture");
      }
      if (profile.revenueModel === "mixed") {
        strengths.push("Mixed revenue model suggests untapped monetization channels");
      }
      if (cNames.has("vendor_concentration")) { resolves.push("vendor_concentration"); strengths.push("Vendor concentration may enable supplier-side monetization"); }
      if (cNames.has("operational_bottleneck")) { resolves.push("operational_bottleneck"); strengths.push("Operational bottleneck may hide monetizable process knowledge"); }

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports stakeholder monetization." : "Insufficient signal density for stakeholder monetization.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 6. INFRASTRUCTURE ABSTRACTION ──
  {
    id: "infrastructure_abstraction",
    name: "Infrastructure Abstraction",
    transformation:
      "Extract a repeatable capability from a bespoke operation and offer it as shared infrastructure — turning a cost center into a scalable product.",
    mechanism:
      "When a business develops internal expertise or systems to solve its own problem, that capability can be abstracted into a product others can use. This decouples revenue from the original labor constraint and creates leverage through repeatability.",
    strategicBet: {
      industryAssumption: "Every business in this space must build its own version of this capability.",
      contrarianBelief: "The core capability is more valuable as shared infrastructure than as a proprietary advantage.",
      implication: "Abstracting the capability creates a platform with near-zero marginal cost per additional user.",
    },
    precedents: [
      "AWS (Amazon abstracted its own server infrastructure into cloud compute)",
      "Shopify (Tobias Lütke abstracted his snowboard store's e-commerce system)",
      "Stripe (abstracted payment integration from a developer tool into infrastructure)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: if already platform/infrastructure positioned with high margins, abstraction is already done
      if (profile.valueChainPosition === "infrastructure" && profile.marginStructure === "high_margin" && profile.laborIntensity === "automated") {
        return { qualifies: false, reason: "Already operating as high-margin automated infrastructure — abstraction is complete.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (profile.laborIntensity === "labor_heavy" || profile.laborIntensity === "artisan") {
        strengths.push("Labor-heavy delivery suggests abstractable expertise");
      }
      if (profile.laborIntensity === "mixed") {
        strengths.push("Mixed labor model — manual components may be candidates for abstraction");
      }
      if (profile.valueChainPosition === "end_service") {
        strengths.push("End-service position often contains abstractable infrastructure");
      }
      if (cNames.has("labor_intensity")) { resolves.push("labor_intensity"); strengths.push("Labor intensity constraint is directly resolved by abstraction"); }
      if (cNames.has("owner_dependency")) { resolves.push("owner_dependency"); strengths.push("Owner dependency suggests expertise that could be codified into infrastructure"); }
      if (cNames.has("linear_scaling")) { resolves.push("linear_scaling"); strengths.push("Linear scaling constraint broken by infrastructure leverage"); }
      if (cNames.has("manual_process")) { resolves.push("manual_process"); strengths.push("Manual processes are candidates for systematization into shared tools"); }
      if (cNames.has("skill_scarcity")) { resolves.push("skill_scarcity"); strengths.push("Scarce skills suggest valuable expertise worth abstracting"); }
      if (cNames.has("operational_bottleneck")) { resolves.push("operational_bottleneck"); strengths.push("Operational bottleneck suggests process knowledge worth systematizing"); }

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports infrastructure abstraction." : "Insufficient signal density for infrastructure abstraction.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },
];
