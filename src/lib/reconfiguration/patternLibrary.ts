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

  // ═══════════════════════════════════════════════════════════════
  //  NEW PATTERNS — Demand-Side, Timing, Business Model, Network
  // ═══════════════════════════════════════════════════════════════

  // ── 7. DEMAND REFRAMING ──
  {
    id: "demand_reframing",
    name: "Demand Reframing",
    transformation:
      "Redefine the buyer's job-to-be-done to create a new demand category or shift who the buyer is entirely.",
    mechanism:
      "When the existing framing of what a product does limits its addressable market, reframing the job-to-be-done unlocks latent demand from segments that never considered themselves buyers. This shifts competitive dynamics from feature comparison to category ownership.",
    strategicBet: {
      industryAssumption: "The current customer segment and use case definition is correct — we compete within it.",
      contrarianBelief: "The real demand is from a different buyer or for a different job than the industry assumes.",
      implication: "Reframing opens a larger or uncontested market and escapes zero-sum competition.",
    },
    precedents: [
      "Peloton (reframed stationary bike from gym equipment → connected fitness entertainment)",
      "Slack (reframed IRC/email from communication tool → work operating system)",
      "Canva (reframed design from professional creative tool → universal visual communication)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: if market is atomized with no control, reframing needs a product to reframe
      if (profile.supplyFragmentation === "atomized" && profile.distributionControl === "no_control") {
        return { qualifies: false, reason: "Atomized supply with no distribution control — no coherent product to reframe.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (profile.customerConcentration === "concentrated") strengths.push("Concentrated customer base suggests narrow demand framing that could be expanded");
      if (profile.customerConcentration === "diversified") strengths.push("Diversified customers may indicate multiple unrecognized use cases");
      if (profile.switchingCosts === "low" || profile.switchingCosts === "none") strengths.push("Low switching costs enable category creation without lock-in barriers");
      if (cNames.has("commoditized_pricing")) { resolves.push("commoditized_pricing"); strengths.push("Commoditized pricing suggests the current category framing invites comparison"); }
      if (cNames.has("awareness_gap")) { resolves.push("awareness_gap"); strengths.push("Awareness gap may indicate buyers don't know they need this — reframing fixes that"); }
      if (cNames.has("expertise_barrier")) { resolves.push("expertise_barrier"); strengths.push("Expertise barrier suggests the current framing targets experts — reframe for broader audience"); }
      if (cNames.has("trust_deficit")) { resolves.push("trust_deficit"); strengths.push("Trust deficit may be solved by changing the category entirely"); }
      if (profile.marginStructure === "thin_margin") strengths.push("Thin margins in current framing suggest pricing power exists in a different category");

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports demand reframing." : "Insufficient signal density for demand reframing.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 8. OUTCOME-BASED PRICING ──
  {
    id: "outcome_pricing",
    name: "Outcome-Based Pricing",
    transformation:
      "Shift from input-based pricing (per hour, per unit, per seat) to outcome-based pricing (per result, per success, per value delivered).",
    mechanism:
      "When a business can measure the outcome it creates for customers, pricing on outcomes aligns incentives, increases willingness-to-pay, and breaks the linear revenue-to-effort relationship. The business captures a share of the value it creates rather than the cost of delivering it.",
    strategicBet: {
      industryAssumption: "Pricing must reflect the cost of inputs — labor, materials, or capacity.",
      contrarianBelief: "Customers pay for outcomes, not inputs — and will pay more when pricing reflects results.",
      implication: "Outcome pricing decouples revenue from cost structure and creates massive margin expansion.",
    },
    precedents: [
      "Rolls-Royce Power-by-the-Hour (shifted from selling jet engines to selling flight hours)",
      "Upwork (shifted freelancer pricing toward project outcomes rather than hourly rates)",
      "Performance marketing (shifted from impressions to cost-per-acquisition)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: already recurring with high margins — outcome pricing may not improve
      if (profile.revenueModel === "recurring" && profile.marginStructure === "high_margin") {
        return { qualifies: false, reason: "Already recurring with high margins — outcome pricing adds complexity without clear upside.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (profile.revenueModel === "project_based") strengths.push("Project-based revenue is a direct target for outcome conversion");
      if (profile.revenueModel === "transactional") strengths.push("Transactional model could shift to outcome-based for better alignment");
      if (profile.laborIntensity === "labor_heavy" || profile.laborIntensity === "artisan") strengths.push("Labor-heavy delivery creates opportunity to decouple price from hours");
      if (profile.marginStructure === "thin_margin") strengths.push("Thin margins suggest input-based pricing compresses returns — outcomes could expand them");
      if (cNames.has("commoditized_pricing")) { resolves.push("commoditized_pricing"); strengths.push("Commoditized pricing is directly resolved by shifting to outcome value"); }
      if (cNames.has("margin_compression")) { resolves.push("margin_compression"); strengths.push("Margin compression from input pricing — outcomes break the cost floor"); }
      if (cNames.has("labor_intensity")) { resolves.push("labor_intensity"); strengths.push("Labor intensity constraint bypassed when pricing decouples from hours"); }
      if (cNames.has("transactional_revenue")) { resolves.push("transactional_revenue"); strengths.push("Transactional revenue transformed into predictable outcome streams"); }

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports outcome-based pricing." : "Insufficient signal density for outcome-based pricing.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 9. NETWORK EFFECT PLAY ──
  {
    id: "network_effect",
    name: "Network Effect Play",
    transformation:
      "Build defensibility through usage — each new user makes the product more valuable for all existing users.",
    mechanism:
      "Network effects create increasing returns to scale: data network effects (more data → better product), marketplace effects (more supply → more demand), or social effects (more users → more content). Once established, network effects create the strongest moat in business.",
    strategicBet: {
      industryAssumption: "Competitive advantage comes from better features, lower cost, or stronger brand.",
      contrarianBelief: "In a networked world, the winner is whoever builds the densest usage graph — features are secondary.",
      implication: "Network effects create winner-take-most dynamics that make competition structurally impossible.",
    },
    precedents: [
      "Waze (more drivers → better traffic data → better routing → more drivers)",
      "LinkedIn (more professionals → more recruiting value → more professionals)",
      "Figma (more designers using it → more shared design systems → stickier for teams)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: labor-heavy artisan work rarely benefits from network effects
      if (profile.laborIntensity === "artisan" && profile.valueChainPosition === "end_service") {
        return { qualifies: false, reason: "Artisan end-service — network effects require scalable digital interactions.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (profile.supplyFragmentation === "fragmented" || profile.supplyFragmentation === "atomized") strengths.push("Fragmented supply creates aggregation surface for network effects");
      if (profile.switchingCosts === "low" || profile.switchingCosts === "none") strengths.push("Low switching costs create urgency to build network-effect lock-in");
      if (profile.distributionControl === "shared" || profile.distributionControl === "no_control") strengths.push("Weak distribution control — network effects could create owned distribution");
      if (profile.valueChainPosition === "platform" || profile.valueChainPosition === "infrastructure") strengths.push("Platform/infrastructure position is ideal for network effect accumulation");
      if (cNames.has("information_asymmetry")) { resolves.push("information_asymmetry"); strengths.push("Data network effects resolve information asymmetry through usage"); }
      if (cNames.has("supply_fragmentation")) { resolves.push("supply_fragmentation"); strengths.push("Network effects aggregate fragmented supply into a defensible platform"); }
      if (cNames.has("commoditized_pricing")) { resolves.push("commoditized_pricing"); strengths.push("Network effects escape commoditization through usage-based differentiation"); }

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports network effect play." : "Insufficient signal density for network effect play.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 10. VERTICAL INTEGRATION ──
  {
    id: "vertical_integration",
    name: "Vertical Integration",
    transformation:
      "Own adjacent layers in the value chain — move upstream to control supply or downstream to control distribution.",
    mechanism:
      "Integrating vertically captures margin currently lost to intermediaries, improves quality control, and creates barriers to entry. Unlike supply chain relocation (which changes position), vertical integration expands scope to own multiple positions simultaneously.",
    strategicBet: {
      industryAssumption: "Specialization at one layer of the value chain is more efficient than integration.",
      contrarianBelief: "The margin lost to adjacent layers and the quality degradation from handoffs exceed the cost of integration.",
      implication: "Vertical integration captures the full margin stack and creates operational barriers competitors can't easily replicate.",
    },
    precedents: [
      "Apple (integrated hardware + software + services + retail)",
      "Netflix (integrated from distribution into content production)",
      "Zara/Inditex (integrated design → manufacturing → retail for 2-week fashion cycles)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: already at infrastructure level with automated ops — fully integrated
      if (profile.valueChainPosition === "infrastructure" && profile.distributionControl === "owned" && profile.laborIntensity === "automated") {
        return { qualifies: false, reason: "Already controls infrastructure with owned distribution — vertical integration complete.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (profile.distributionControl === "intermediated") strengths.push("Intermediated distribution — downstream integration captures customer relationship");
      if (profile.distributionControl === "shared") strengths.push("Shared distribution — opportunity to integrate and own the channel");
      if (profile.marginStructure === "thin_margin") strengths.push("Thin margins suggest value captured elsewhere in the chain — integration recaptures it");
      if (profile.marginStructure === "moderate_margin") strengths.push("Moderate margins with integration potential for margin expansion");
      if (cNames.has("channel_dependency")) { resolves.push("channel_dependency"); strengths.push("Channel dependency resolved by owning the distribution layer"); }
      if (cNames.has("vendor_concentration")) { resolves.push("vendor_concentration"); strengths.push("Vendor concentration resolved by upstream integration"); }
      if (cNames.has("margin_compression")) { resolves.push("margin_compression"); strengths.push("Margin compression from intermediaries — integration captures the spread"); }
      if (cNames.has("supply_fragmentation")) { resolves.push("supply_fragmentation"); strengths.push("Fragmented supply — upstream integration provides control and consistency"); }

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports vertical integration." : "Insufficient signal density for vertical integration.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 11. REGULATORY ARBITRAGE ──
  {
    id: "regulatory_arbitrage",
    name: "Regulatory Arbitrage",
    transformation:
      "Exploit gaps, asymmetries, or upcoming changes in regulation to enter markets incumbents can't or won't.",
    mechanism:
      "Regulation creates artificial constraints. When rules differ across jurisdictions, evolve over time, or create compliance burdens, there are windows where new entrants can build positions that incumbents — burdened by legacy compliance structures — cannot easily match.",
    strategicBet: {
      industryAssumption: "Current regulations are stable and compliance costs are unavoidable.",
      contrarianBelief: "Regulatory change creates temporary advantage windows, and compliance complexity is itself a market opportunity.",
      implication: "First movers in regulatory gaps capture positions that become defensible once rules stabilize.",
    },
    precedents: [
      "Uber/Lyft (exploited taxi regulation gaps before rideshare-specific laws emerged)",
      "Stripe Atlas (simplified cross-border business incorporation through regulatory complexity)",
      "Robinhood (exploited payment-for-order-flow model before SEC scrutiny)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: no regulatory signal at all means no arbitrage opportunity
      if (profile.regulatorySensitivity === "none" && !cNames.has("regulatory_barrier")) {
        return { qualifies: false, reason: "No regulatory sensitivity — no regulation to arbitrage.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (profile.regulatorySensitivity === "heavy") strengths.push("Heavy regulation creates compliance moats and arbitrage windows");
      if (profile.regulatorySensitivity === "moderate") strengths.push("Moderate regulation — potential gaps between jurisdictions or evolving rules");
      if (cNames.has("regulatory_barrier")) { resolves.push("regulatory_barrier"); strengths.push("Regulatory barrier creates opportunity for structural workaround or new category"); }
      if (profile.supplyFragmentation === "fragmented" || profile.supplyFragmentation === "atomized") strengths.push("Fragmented supply under regulation — compliance burden falls disproportionately on small players");
      if (profile.marginStructure === "thin_margin") strengths.push("Thin margins amplify regulatory compliance cost — arbitrage could restore margins");
      if (cNames.has("geographic_constraint")) { resolves.push("geographic_constraint"); strengths.push("Geographic constraint may be regulatory in nature — cross-jurisdiction arbitrage"); }

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports regulatory arbitrage." : "Insufficient signal density for regulatory arbitrage.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 12. FREEMIUM / REVERSE RAZOR-BLADE ──
  {
    id: "freemium_flip",
    name: "Freemium / Reverse Razor-Blade",
    transformation:
      "Give away what the industry charges for and monetize a different layer — inverting the traditional revenue model.",
    mechanism:
      "When the primary product becomes commoditized, giving it away eliminates the purchase barrier and builds a massive user base. Revenue shifts to premium features, services, data, or complementary products. This is structurally different from discounting — it changes what the business actually sells.",
    strategicBet: {
      industryAssumption: "The core product is the revenue source — giving it away would destroy the business.",
      contrarianBelief: "The core product's real value is as a distribution channel for something more monetizable.",
      implication: "Freemium distribution creates a massive funnel that premium conversion and cross-sell can monetize at higher margins.",
    },
    precedents: [
      "Spotify (free tier as funnel to premium subscriptions + artist platform)",
      "Gillette reverse: Dollar Shave Club (cheap razors, expensive subscription relationship)",
      "Zoom (free video calls → enterprise platform sales)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: negative margins — can't afford to give anything away
      if (profile.marginStructure === "negative_margin") {
        return { qualifies: false, reason: "Negative margins — cannot subsidize a free tier.", strengthSignals: [], resolvesConstraints: [] };
      }
      // Gate: artisan labor — can't scale free delivery
      if (profile.laborIntensity === "artisan") {
        return { qualifies: false, reason: "Artisan delivery cannot scale to support free tier economics.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (cNames.has("capital_barrier")) { resolves.push("capital_barrier"); strengths.push("High upfront cost barrier eliminated by free entry point"); }
      if (cNames.has("commoditized_pricing")) { resolves.push("commoditized_pricing"); strengths.push("Commoditized pricing — give away the commodity, monetize the complement"); }
      if (cNames.has("awareness_gap")) { resolves.push("awareness_gap"); strengths.push("Free tier eliminates awareness/trial barrier"); }
      if (cNames.has("trust_deficit")) { resolves.push("trust_deficit"); strengths.push("Free trial builds trust before purchase commitment"); }
      if (profile.switchingCosts === "low" || profile.switchingCosts === "none") strengths.push("Low switching costs — free tier can capture users before competitors");
      if (profile.distributionControl !== "owned") strengths.push("Non-owned distribution — freemium creates owned distribution channel");
      if (profile.revenueModel === "transactional") strengths.push("Transactional model could flip to freemium + premium conversion");

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports freemium / reverse razor-blade model." : "Insufficient signal density for freemium flip.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 13. TEMPORAL ARBITRAGE ──
  {
    id: "temporal_arbitrage",
    name: "Temporal Arbitrage",
    transformation:
      "Exploit timing mismatches — move faster than incumbents, pre-position for emerging shifts, or compress time-to-value.",
    mechanism:
      "Markets have timing structures: seasonal cycles, technology adoption curves, regulatory change timelines, and competitive response lags. Temporal arbitrage means positioning to capture value during windows that incumbents are too slow, too large, or too committed to exploit.",
    strategicBet: {
      industryAssumption: "Market timing is unpredictable — the best strategy is steady incremental improvement.",
      contrarianBelief: "Timing windows are detectable and exploitable — speed of repositioning is a strategic asset.",
      implication: "First movers in timing windows build positions that become defensible once the window closes.",
    },
    precedents: [
      "Zoom (pre-positioned for remote work before COVID made it essential)",
      "Beyond Meat (timed plant-based protein to the sustainability awareness wave)",
      "Coinbase (pre-built crypto exchange infrastructure before mainstream adoption)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Always somewhat relevant — timing applies broadly
      if (profile.regulatorySensitivity === "moderate" || profile.regulatorySensitivity === "heavy") strengths.push("Regulatory environment creates timing windows around policy changes");
      if (profile.switchingCosts === "high") strengths.push("High switching costs mean early positioning locks in customers for years");
      if (profile.supplyFragmentation === "fragmented" || profile.supplyFragmentation === "atomized") strengths.push("Fragmented market — fast consolidation move before competitors react");
      if (cNames.has("legacy_lock_in")) { resolves.push("legacy_lock_in"); strengths.push("Legacy lock-in creates a timing window as contracts expire or technology shifts"); }
      if (cNames.has("analog_process")) { resolves.push("analog_process"); strengths.push("Analog processes create a digitization timing window"); }
      if (cNames.has("switching_friction")) { resolves.push("switching_friction"); strengths.push("Switching friction creates urgency to capture customers during transition moments"); }
      if (profile.valueChainPosition === "application" || profile.valueChainPosition === "end_service") strengths.push("Application/service layer can pivot faster than infrastructure");

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports temporal arbitrage." : "Insufficient signal density for temporal arbitrage.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 14. LOSS-LEADER ECOSYSTEM ──
  {
    id: "loss_leader_ecosystem",
    name: "Loss-Leader Ecosystem",
    transformation:
      "Sell the initial product at or below cost to capture the customer, then monetize through a recurring ecosystem of consumables, services, or upgrades.",
    mechanism:
      "The initial purchase creates a captive relationship. Revenue and margin come from the ongoing consumption pattern rather than the upfront sale. This inverts competitor economics — they optimize for initial sale margin while you optimize for lifetime value.",
    strategicBet: {
      industryAssumption: "Each sale must be independently profitable — cross-subsidy destroys unit economics.",
      contrarianBelief: "Customer lifetime value far exceeds initial acquisition cost — subsidizing entry maximizes total value capture.",
      implication: "Loss-leader entry captures market share rapidly while competitors are constrained by per-unit profitability.",
    },
    precedents: [
      "Nespresso (cheap machines, expensive pods — 95% of profit from consumables)",
      "Amazon Kindle (subsidized hardware, monetized content purchases)",
      "HP printers (razor/blade model — printer below cost, ink at premium margins)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: already negative margins without a recurring complement
      if (profile.marginStructure === "negative_margin" && profile.revenueModel !== "recurring") {
        return { qualifies: false, reason: "Already negative margins without recurring revenue — loss-leader would deepen losses.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (cNames.has("capital_barrier")) { resolves.push("capital_barrier"); strengths.push("Capital barrier eliminated by subsidizing the initial purchase"); }
      if (cNames.has("commoditized_pricing")) { resolves.push("commoditized_pricing"); strengths.push("Commodity pricing on the product — margin shifts to ecosystem monetization"); }
      if (profile.switchingCosts === "high" || profile.switchingCosts === "moderate") strengths.push("Switching costs lock customers into the ecosystem after initial purchase");
      if (profile.revenueModel === "transactional") strengths.push("Transactional model can convert to recurring via consumable ecosystem");
      if (profile.marginStructure === "high_margin") strengths.push("High margins on current product suggest room to subsidize entry and shift margin downstream");
      if (profile.distributionControl === "intermediated") strengths.push("Intermediated distribution — loss-leader can bypass channels with direct relationship");
      if (cNames.has("awareness_gap")) { resolves.push("awareness_gap"); strengths.push("Subsidized entry eliminates trial barrier"); }

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports loss-leader ecosystem." : "Insufficient signal density for loss-leader ecosystem.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },

  // ── 15. DATA MOAT ──
  {
    id: "data_moat",
    name: "Data Moat",
    transformation:
      "Collect proprietary data through normal operations that compounds into an un-replicable competitive advantage over time.",
    mechanism:
      "Every transaction, interaction, or measurement generates data. When this data feeds back into improving the product (better predictions, recommendations, or pricing), it creates a flywheel that competitors cannot replicate without the same usage volume. The moat deepens with every customer interaction.",
    strategicBet: {
      industryAssumption: "Data is a byproduct of operations — the real value is in the service itself.",
      contrarianBelief: "The data generated by operations is more valuable than the operations themselves — it becomes the actual product.",
      implication: "Data moats create compounding advantages where each customer makes the product better for all future customers.",
    },
    precedents: [
      "Google Search (more queries → better results → more queries → more ad targeting data)",
      "Tesla Autopilot (more miles driven → better self-driving models → more buyers → more miles)",
      "Strava (more athletes → better route data → better social features → more athletes)",
    ],
    qualifies: (profile) => {
      const cNames = constraintNames(profile);
      const strengths: string[] = [];
      const resolves: string[] = [];

      // Gate: artisan service with single customer rarely generates reusable data
      if (profile.laborIntensity === "artisan" && profile.customerConcentration === "single_customer") {
        return { qualifies: false, reason: "Artisan service for single customer — insufficient data volume for moat.", strengthSignals: [], resolvesConstraints: [] };
      }

      if (profile.customerConcentration === "diversified") strengths.push("Diversified customer base generates broad, valuable data");
      if (profile.valueChainPosition === "platform" || profile.valueChainPosition === "infrastructure") strengths.push("Platform/infrastructure position sees data from all participants");
      if (cNames.has("information_asymmetry")) { resolves.push("information_asymmetry"); strengths.push("Information asymmetry — data moat creates proprietary intelligence advantage"); }
      if (profile.switchingCosts === "low" || profile.switchingCosts === "none") strengths.push("Low switching costs — data moat creates the missing stickiness");
      if (profile.supplyFragmentation === "fragmented" || profile.supplyFragmentation === "atomized") strengths.push("Fragmented market generates diverse data no single player can replicate");
      if (cNames.has("commoditized_pricing")) { resolves.push("commoditized_pricing"); strengths.push("Data moat escapes commodity competition through intelligence-driven differentiation"); }
      if (profile.revenueModel === "recurring" || profile.revenueModel === "mixed") strengths.push("Recurring interactions generate continuous data flow");

      return {
        qualifies: strengths.length >= 2,
        reason: strengths.length >= 2 ? "Structural profile supports data moat strategy." : "Insufficient signal density for data moat.",
        strengthSignals: strengths,
        resolvesConstraints: resolves,
      };
    },
  },
];
