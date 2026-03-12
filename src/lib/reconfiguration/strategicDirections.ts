/**
 * STRATEGIC DIRECTION CATEGORIES — Hybrid Scaffolding Layer
 *
 * Defines strategic direction archetypes that any constraint can fan into.
 * Mode-aware: Product mode uses inventor/engineering directions,
 * other modes use business-model directions.
 *
 * Each direction has:
 *   - A relevance scorer based on the structural profile
 *   - A user-facing label and description
 *   - A prompt hint for the AI to generate concrete versions
 *
 * The system picks the top 3-5 most relevant directions per analysis,
 * then the AI generates specific, contextual opportunities for each.
 */

import type { StructuralProfile } from "./structuralProfile";

const DIGITAL_SCALE_DIRECTION_IDS = new Set([
  "platformize",
  "shared_infrastructure",
  "marketplace",
  "network_effect",
  "data_advantage",
  "freemium_flip",
]);

function isTraditionalServiceBusiness(profile: StructuralProfile): boolean {
  const laborHeavy = profile.laborIntensity === "labor_heavy" || profile.laborIntensity === "artisan";
  const nonDigitalRevenue =
    profile.revenueModel === "project_based" ||
    profile.revenueModel === "transactional" ||
    profile.revenueModel === "mixed";
  const servicePosition = profile.valueChainPosition === "end_service" || profile.valueChainPosition === "application";
  const ownerDependent = profile.ownerDependency === "owner_reliant" || profile.ownerDependency === "owner_critical";

  return laborHeavy && nonDigitalRevenue && (servicePosition || ownerDependent || profile.etaActive);
}

// ═══════════════════════════════════════════════════════════════
//  STRATEGIC DIRECTION ARCHETYPE
// ═══════════════════════════════════════════════════════════════

export interface StrategicDirection {
  id: string;
  /** User-facing category name */
  label: string;
  /** One-sentence description of the strategic move */
  description: string;
  /** Prompt hint — tells the AI what kind of opportunity to generate */
  aiPromptHint: string;
  /** Returns a relevance score 0-10 based on the structural profile */
  relevance: (profile: StructuralProfile) => number;
}

// ═══════════════════════════════════════════════════════════════
//  PRODUCT MODE — INVENTOR/ENGINEER DIRECTIONS
// ═══════════════════════════════════════════════════════════════

export const PRODUCT_DIRECTIONS: StrategicDirection[] = [
  {
    id: "redesign_mechanism",
    label: "Redesign the core mechanism",
    description: "Replace the fundamental operating mechanism with a superior physical principle that eliminates the primary failure mode.",
    aiPromptHint: "Identify the core physical mechanism (valve, seal, spring, hinge, etc.). What physics principle does it rely on? What failure mode does that cause? Propose a SPECIFIC alternative mechanism using a different physical principle. Include: the new mechanism, why it's superior, material candidates, and estimated BOM impact. Example: 'Replace rubber flapper seal with silicone diaphragm valve — eliminates chlorine degradation (the #1 failure cause), adds $0.15/unit but extends lifespan 4x.'",
    relevance: (_p) => 9, // Always highly relevant for products
  },
  {
    id: "material_substitution",
    label: "Advanced material substitution",
    description: "Replace legacy materials with modern alternatives that improve durability, reduce cost, or enable new capabilities.",
    aiPromptHint: "Identify each material in the current product. For each: what's the failure mode? What modern material would eliminate it? Be SPECIFIC — name the polymer, alloy, or composite. Include: material name, supplier ecosystem, cost delta per unit at 10K volume, and the performance improvement. Example: 'Replace ABS housing with glass-filled nylon (PA66-GF30) — 3x impact resistance, +$0.08/unit, eliminates brittleness cracking in cold climates.'",
    relevance: (_p) => 8,
  },
  {
    id: "universal_fit",
    label: "Universal compatibility system",
    description: "Design an adapter or modular system that fits multiple product variants with a single SKU, reducing complexity for both manufacturer and consumer.",
    aiPromptHint: "Map the current compatibility landscape — how many variants exist? What causes incompatibility (dimensions, threading, mounting)? Design a SPECIFIC universal fit mechanism (compression adapter, adjustable geometry, modular inserts). Include: the mechanical approach, what % of installed base it covers, tooling requirements, and how it simplifies the consumer's purchase decision. Reference real universal-fit precedents in adjacent categories.",
    relevance: (_p) => 7,
  },
  {
    id: "smart_sensing",
    label: "Add sensing & diagnostics",
    description: "Integrate low-cost sensors to detect failure before it happens, transforming a dumb component into a predictive maintenance tool.",
    aiPromptHint: "Identify the primary failure modes and their warning signals (vibration, flow rate change, acoustic signature, temperature). Propose a SPECIFIC sensor integration: sensor type, placement, power source (battery, harvested, passive), communication method (BLE, NFC, visual indicator). Include BOM cost of the electronics at 10K units. Keep it practical — if a $0.50 thermistor can detect 80% of failures, prefer that over a $15 IoT module. Reference real products that added sensing to traditionally dumb components.",
    relevance: (_p) => 6,
  },
  {
    id: "manufacturing_innovation",
    label: "Manufacturing process innovation",
    description: "Change the manufacturing method to reduce cost, improve quality, or enable geometries impossible with current processes.",
    aiPromptHint: "Analyze the current manufacturing process (injection molding, stamping, machining, assembly). What are its constraints? Propose a SPECIFIC alternative: overmolding to eliminate assembly steps, 3D printing for complex internal channels, die-casting to replace multi-part assemblies. Include: process name, required capital equipment, unit cost at 10K/100K volumes, and quality improvements. Example: 'Replace 4-part assembly (housing + seal + spring + cap) with single overmolded part — eliminates 3 assembly steps, reduces unit cost from $2.40 to $1.65, improves seal reliability.'",
    relevance: (_p) => 7,
  },
  {
    id: "eliminate_failure",
    label: "Eliminate the #1 failure mode",
    description: "Engineer out the most common product failure through design change, material change, or mechanism change.",
    aiPromptHint: "From user complaints, warranty data patterns, and physical analysis: what is the #1 failure mode? What causes it (wear, corrosion, mineral buildup, UV degradation, impact)? Design a SPECIFIC engineering solution that eliminates or dramatically reduces this failure. Include: root cause, proposed design change, expected lifespan improvement (with reasoning), and any cost/complexity trade-offs. This should be something a product engineer could prototype in a week.",
    relevance: (_p) => 9,
  },
  {
    id: "tool_free_install",
    label: "Tool-free installation",
    description: "Redesign the product for tool-free, mistake-proof installation that any consumer can complete in under 5 minutes.",
    aiPromptHint: "Map the current installation process step by step. Where do consumers fail or need tools? Design SPECIFIC tool-free mechanisms: quarter-turn locks, snap-fit connections, bayonet mounts, compression fittings, color-coded alignment guides. Include: the mechanical connection type, tolerance requirements, and how the design prevents incorrect installation. Reference real products that transformed installation UX (e.g., Dyson filter replacement, Brita cartridge click-in).",
    relevance: (_p) => 7,
  },
  {
    id: "reduce_sku_complexity",
    label: "SKU consolidation",
    description: "Reduce the number of product variants through modular design or adjustable geometry, cutting inventory costs and simplifying distribution.",
    aiPromptHint: "How many SKUs currently exist and why? Map the dimensional or functional variations. Design a SPECIFIC modular or adjustable system that covers multiple variants: telescoping parts, reversible components, adjustable stops, universal threads. Include: current SKU count vs. proposed, the mechanical adjustment mechanism, and the inventory/logistics cost savings. Example: 'Adjustable overflow tube with indexed height stops replaces 6 fixed-height SKUs with 1, cutting warehouse inventory 83%.'",
    relevance: (_p) => 6,
  },
];

// ═══════════════════════════════════════════════════════════════
//  BUSINESS MODE — STRATEGIC DIRECTIONS (original)
// ═══════════════════════════════════════════════════════════════

export const STRATEGIC_DIRECTIONS: StrategicDirection[] = [
  {
    id: "automate",
    label: "Automate",
    description: "Replace manual, labor-intensive processes with systems that scale without proportional headcount.",
    aiPromptHint: "Identify the specific manual processes that constrain scaling and describe a concrete automation approach. What exact workflow becomes a system? What labor cost is eliminated?",
    relevance: (p) => {
      let score = 0;
      if (p.laborIntensity === "artisan") score += 4;
      if (p.laborIntensity === "labor_heavy") score += 3;
      if (p.laborIntensity === "mixed") score += 1;
      if (p.marginStructure === "thin_margin") score += 2;
      if (p.revenueModel === "project_based") score += 2;
      if (p.ownerDependency === "owner_critical") score += 2;
      if (p.ownerDependency === "owner_reliant") score += 1;
      const hasLaborConstraint = p.bindingConstraints.some(c =>
        /labor|manual|capacity|headcount|staff|scale/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasLaborConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "platformize",
    label: "Platformize",
    description: "Turn an internal capability into a product that others pay to use.",
    aiPromptHint: "Identify the specific internal capability, process, or tool that could be extracted and sold as a standalone product. Who would pay for it? What's the pricing model?",
    relevance: (p) => {
      if (isTraditionalServiceBusiness(p)) return 0;

      let score = 0;
      if (p.assetUtilization === "underutilized" || p.assetUtilization === "idle") score += 4;
      if (p.valueChainPosition === "infrastructure" || p.valueChainPosition === "platform") score += 2;
      if (p.marginStructure === "high_margin") score += 1;
      if (p.revenueModel === "transactional" || p.revenueModel === "project_based") score += 2;
      const hasAssetConstraint = p.bindingConstraints.some(c =>
        /utiliz|idle|asset|capacity|underuse/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasAssetConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "aggregate",
    label: "Aggregate",
    description: "Consolidate fragmented supply or demand into a unified interface that reduces friction.",
    aiPromptHint: "Identify the specific fragmented supply or demand. What are buyers currently doing to find/compare providers? What unified interface would eliminate that friction? What's the take rate or monetization model?",
    relevance: (p) => {
      let score = 0;
      if (p.supplyFragmentation === "atomized") score += 5;
      if (p.supplyFragmentation === "fragmented") score += 3;
      if (p.distributionControl === "no_control" || p.distributionControl === "intermediated") score += 2;
      if (p.switchingCosts === "low" || p.switchingCosts === "none") score += 2;
      const hasFragConstraint = p.bindingConstraints.some(c =>
        /fragment|scatter|search|discovery|find|match/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasFragConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "go_direct",
    label: "Go direct",
    description: "Remove intermediaries and own the customer relationship to capture more margin and data.",
    aiPromptHint: "Identify the specific intermediaries in the value chain. What margin do they capture? What customer data/relationship do they control? How would going direct change the economics?",
    relevance: (p) => {
      let score = 0;
      if (p.distributionControl === "intermediated") score += 5;
      if (p.distributionControl === "no_control") score += 3;
      if (p.marginStructure === "thin_margin") score += 2;
      if (p.customerConcentration === "concentrated") score += 1;
      const hasDistConstraint = p.bindingConstraints.some(c =>
        /intermediar|channel|distribut|margin|middl/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasDistConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "productize",
    label: "Productize",
    description: "Package expertise, services, or custom work into repeatable, scalable deliverables.",
    aiPromptHint: "Identify the specific expertise or custom service being delivered. What parts are actually repeatable? What would the productized version look like — a tool, a template, a subscription, a course? How does pricing change?",
    relevance: (p) => {
      let score = 0;
      if (p.laborIntensity === "artisan" || p.laborIntensity === "labor_heavy") score += 3;
      if (p.revenueModel === "project_based") score += 4;
      if (p.revenueModel === "transactional") score += 2;
      if (p.switchingCosts === "low" || p.switchingCosts === "none") score += 1;
      if (p.valueChainPosition === "end_service" || p.valueChainPosition === "application") score += 2;
      const hasServiceConstraint = p.bindingConstraints.some(c =>
        /custom|bespoke|project|scope|repeat|time/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasServiceConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "data_advantage",
    label: "Create a data advantage",
    description: "Monetize information asymmetry by collecting, structuring, or analyzing data others don't have.",
    aiPromptHint: "What data does this business naturally generate or have access to? Who would pay for structured access to that data? What decisions does it inform? What's the data moat?",
    relevance: (p) => {
      if (isTraditionalServiceBusiness(p)) return 0;

      let score = 0;
      if (p.supplyFragmentation === "fragmented" || p.supplyFragmentation === "atomized") score += 2;
      if (p.valueChainPosition === "infrastructure" || p.valueChainPosition === "platform") score += 3;
      if (p.customerConcentration === "diversified") score += 2;
      if (p.distributionControl === "owned" || p.distributionControl === "shared") score += 1;
      const hasInfoConstraint = p.bindingConstraints.some(c =>
        /data|inform|visib|transparen|insight|intel|pricing|benchmark/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasInfoConstraint) score += 4;
      return Math.min(10, score);
    },
  },
  {
    id: "shared_infrastructure",
    label: "Build shared infrastructure",
    description: "Extract common operational needs across competitors into shared services they all use.",
    aiPromptHint: "What operational burden do ALL competitors in this space share? What if one company built that as shared infrastructure and charged for access? What's the specific service — scheduling, logistics, compliance, procurement?",
    relevance: (p) => {
      if (isTraditionalServiceBusiness(p)) return 0;

      let score = 0;
      if (p.supplyFragmentation === "atomized" || p.supplyFragmentation === "fragmented") score += 3;
      if (p.valueChainPosition === "infrastructure") score += 3;
      if (p.regulatorySensitivity === "heavy" || p.regulatorySensitivity === "moderate") score += 2;
      if (p.assetUtilization === "underutilized") score += 2;
      const hasInfraConstraint = p.bindingConstraints.some(c =>
        /infra|operation|compliance|overhead|admin|back.?office|regulat/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasInfraConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "marketplace",
    label: "Marketplace",
    description: "Create a two-sided marketplace connecting supply and demand, capturing a transaction fee.",
    aiPromptHint: "Who are the specific supply-side and demand-side participants? Why don't they connect efficiently today? What's the matching mechanism? How do you solve the chicken-and-egg problem to bootstrap liquidity?",
    relevance: (p) => {
      if (isTraditionalServiceBusiness(p)) return 0;

      let score = 0;
      if (p.supplyFragmentation === "atomized") score += 4;
      if (p.supplyFragmentation === "fragmented") score += 2;
      if (p.distributionControl === "no_control") score += 3;
      if (p.switchingCosts === "none" || p.switchingCosts === "low") score += 2;
      if (p.customerConcentration === "diversified") score += 1;
      const hasMatchConstraint = p.bindingConstraints.some(c =>
        /match|connect|discover|find|search|fragment|scatter/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasMatchConstraint) score += 3;
      return Math.min(10, score);
    },
  },

  // ═══════════════════════════════════════════════════════════════
  //  NEW DIRECTIONS — Demand-Side, Timing, Business Model Flips
  // ═══════════════════════════════════════════════════════════════

  {
    id: "reframe_demand",
    label: "Reframe demand",
    description: "Redefine the buyer's job-to-be-done to create a new demand category or shift who the buyer is entirely.",
    aiPromptHint: "What is the current buyer's assumed job-to-be-done? Who else has an adjacent or unrecognized need? How would reframing the value proposition open a larger or uncontested market? What specific messaging and positioning would signal the new category?",
    relevance: (p) => {
      let score = 0;
      if (p.customerConcentration === "concentrated") score += 3;
      if (p.switchingCosts === "low" || p.switchingCosts === "none") score += 2;
      if (p.marginStructure === "thin_margin") score += 2;
      const hasDemandConstraint = p.bindingConstraints.some(c =>
        /demand|awareness|adoption|category|perception|brand|trust/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasDemandConstraint) score += 4;
      return Math.min(10, score);
    },
  },
  {
    id: "outcome_pricing",
    label: "Shift to outcome pricing",
    description: "Move from input-based pricing (per hour, per unit) to outcome-based pricing (per result, per success).",
    aiPromptHint: "What measurable outcome does this business create for customers? How would pricing on that outcome change the economics? What tracking/measurement is needed? What's the risk transfer and how is it managed?",
    relevance: (p) => {
      let score = 0;
      if (p.revenueModel === "project_based") score += 4;
      if (p.revenueModel === "transactional") score += 2;
      if (p.laborIntensity === "labor_heavy" || p.laborIntensity === "artisan") score += 3;
      if (p.marginStructure === "thin_margin") score += 2;
      const hasPricingConstraint = p.bindingConstraints.some(c =>
        /price|margin|commodit|revenue|hourly|billing/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasPricingConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "network_effect",
    label: "Build network effects",
    description: "Create defensibility through usage — each new user makes the product more valuable for all existing users.",
    aiPromptHint: "What type of network effect could exist here — data, social, marketplace, or protocol? What's the usage loop that creates compounding value? How do you reach critical mass? What's the cold-start strategy?",
    relevance: (p) => {
      if (isTraditionalServiceBusiness(p)) return 0;

      let score = 0;
      if (p.supplyFragmentation === "fragmented" || p.supplyFragmentation === "atomized") score += 3;
      if (p.switchingCosts === "low" || p.switchingCosts === "none") score += 2;
      if (p.valueChainPosition === "platform" || p.valueChainPosition === "infrastructure") score += 3;
      if (p.distributionControl === "no_control" || p.distributionControl === "shared") score += 2;
      const hasNetworkConstraint = p.bindingConstraints.some(c =>
        /network|scale|growth|adoption|data|information/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasNetworkConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "vertical_integrate",
    label: "Vertically integrate",
    description: "Own adjacent layers in the value chain — move upstream to control supply or downstream to control distribution.",
    aiPromptHint: "Which adjacent layer captures disproportionate margin? What would it cost to integrate (build vs. acquire)? What quality/speed improvements come from owning the handoff? What's the competitive response risk?",
    relevance: (p) => {
      let score = 0;
      if (p.distributionControl === "intermediated") score += 4;
      if (p.distributionControl === "shared") score += 2;
      if (p.marginStructure === "thin_margin") score += 3;
      const hasChainConstraint = p.bindingConstraints.some(c =>
        /channel|intermediar|margin|vendor|supply|distribut/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasChainConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "regulatory_arbitrage",
    label: "Exploit regulatory gaps",
    description: "Enter markets through regulatory asymmetries, upcoming changes, or compliance-as-a-service opportunities.",
    aiPromptHint: "What specific regulations constrain this market? Are there jurisdictional differences that create arbitrage? Is regulation about to change, and if so, who wins? Could compliance itself be productized as a service?",
    relevance: (p) => {
      let score = 0;
      if (p.regulatorySensitivity === "heavy") score += 5;
      if (p.regulatorySensitivity === "moderate") score += 3;
      if (p.supplyFragmentation === "fragmented" || p.supplyFragmentation === "atomized") score += 2;
      const hasRegConstraint = p.bindingConstraints.some(c =>
        /regulat|compliance|licens|permit|legal|certif/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasRegConstraint) score += 4;
      return Math.min(10, score);
    },
  },
  {
    id: "freemium_flip",
    label: "Freemium / model flip",
    description: "Give away what the industry charges for and monetize a different layer — invert the revenue model.",
    aiPromptHint: "What is currently the paid product? What complementary layer could generate more revenue if the primary product were free? What's the conversion mechanism from free to paid? How large does the free user base need to be?",
    relevance: (p) => {
      if (isTraditionalServiceBusiness(p)) return 0;

      let score = 0;
      if (p.switchingCosts === "low" || p.switchingCosts === "none") score += 3;
      if (p.distributionControl !== "owned") score += 2;
      if (p.revenueModel === "transactional") score += 2;
      const hasBarrierConstraint = p.bindingConstraints.some(c =>
        /barrier|capital|cost|awareness|trust|adoption/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasBarrierConstraint) score += 4;
      return Math.min(10, score);
    },
  },
  {
    id: "timing_play",
    label: "Timing / temporal arbitrage",
    description: "Pre-position for emerging market shifts, technology transitions, or regulatory changes that incumbents are too slow to exploit.",
    aiPromptHint: "What structural shift is approaching (technology, regulation, demographics, behavior)? Why are incumbents slow to respond? What position would be most valuable when the shift completes? What's the timeline and how do you survive until the window opens?",
    relevance: (p) => {
      let score = 0;
      if (p.regulatorySensitivity === "moderate" || p.regulatorySensitivity === "heavy") score += 3;
      if (p.switchingCosts === "high") score += 2;
      if (p.supplyFragmentation === "fragmented" || p.supplyFragmentation === "atomized") score += 2;
      const hasTimingConstraint = p.bindingConstraints.some(c =>
        /legacy|analog|outdated|transition|shift|change|adoption/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasTimingConstraint) score += 4;
      return Math.min(10, score);
    },
  },
];

// ═══════════════════════════════════════════════════════════════
//  DIRECTION SELECTION (MODE-AWARE)
// ═══════════════════════════════════════════════════════════════

export interface ScoredDirection {
  direction: StrategicDirection;
  relevanceScore: number;
}

/**
 * Score all directions against a structural profile and return
 * the top N most relevant (default 5, min 3).
 * Mode-aware: Product mode uses inventor directions.
 */
export function selectRelevantDirections(
  profile: StructuralProfile,
  count: number = 5,
  analysisType?: string,
): ScoredDirection[] {
  // Product mode → use inventor/engineer directions
  const directions = analysisType === "product"
    ? PRODUCT_DIRECTIONS
    : STRATEGIC_DIRECTIONS;

  const traditionalService = analysisType !== "product" && isTraditionalServiceBusiness(profile);

  let scored = directions.map(d => ({
    direction: d,
    relevanceScore: d.relevance(profile),
  }));

  if (traditionalService) {
    scored = scored.filter(s => !DIGITAL_SCALE_DIRECTION_IDS.has(s.direction.id));
  }

  // Sort by relevance descending
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Only keep meaningfully relevant directions.
  // IMPORTANT: do NOT force 3+ directions, as that introduces unrealistic ideas.
  const eligible = scored.filter(s => s.relevanceScore >= 2);
  if (eligible.length > 0) {
    return eligible.slice(0, Math.min(count, eligible.length));
  }

  return scored.filter(s => s.relevanceScore > 0).slice(0, Math.min(count, 2));
}

/**
 * Build a prompt block describing the selected directions for AI consumption.
 */
export function buildDirectionsPromptBlock(
  directions: ScoredDirection[],
): string {
  const lines = [
    "STRATEGIC DIRECTION CATEGORIES — Generate one opportunity per direction below.",
    "Each direction represents a structurally distinct strategic path. Your job is to make each one SPECIFIC to this business.",
    "",
  ];

  for (const { direction, relevanceScore } of directions) {
    const strength = relevanceScore >= 6 ? "HIGH relevance" : relevanceScore >= 3 ? "MODERATE relevance" : "EXPLORATORY";
    lines.push(`### ${direction.label.toUpperCase()} [${strength}]`);
    lines.push(direction.description);
    lines.push(`AI TASK: ${direction.aiPromptHint}`);
    lines.push("");
  }

  lines.push("IMPORTANT: Generate one thesis per direction. Each must be structurally distinct — NOT variations of the same idea.");
  lines.push("If a direction truly doesn't apply to this business, explain WHY in one sentence and skip it.");

  return lines.join("\n");
}
