/**
 * CROSS-DOMAIN ANALOGY LIBRARY
 *
 * ~40 curated structural transformations from real companies across 8+ industries.
 * Each entry captures the STRUCTURAL PRIMITIVE — the abstract mechanism that can
 * be transplanted to an unrelated industry.
 *
 * Used by analogyMatcher.ts to inject cross-domain candidates into the strategy
 * search population, ensuring the evolutionary search explores non-obvious moves.
 */

export interface CrossDomainAnalogy {
  id: string;
  /** The real company that executed this move */
  company: string;
  /** The industry this move originated in */
  sourceIndustry: string;
  /** Abstract structural primitive (transplantable) */
  structuralPrimitive: string;
  /** One-sentence description of what they did */
  moveDescription: string;
  /** Maps to an existing patternLibrary pattern */
  patternId: string;
  /** Concrete mechanism text for candidate generation */
  mechanism: string;
  /** Which constraint shapes make this analogy relevant */
  constraintShape: {
    supplyFragmentation?: "consolidated" | "moderate" | "fragmented" | "atomized";
    switchingCosts?: "high" | "moderate" | "low" | "none";
    laborIntensity?: "automated" | "mixed" | "labor_heavy" | "artisan";
    distributionControl?: "owned" | "shared" | "intermediated" | "no_control";
    revenueModel?: "recurring" | "mixed" | "transactional" | "project_based";
    marginStructure?: "high_margin" | "moderate_margin" | "thin_margin" | "negative_margin";
    customerConcentration?: "diversified" | "moderate" | "concentrated" | "single_customer";
    assetUtilization?: "high" | "moderate" | "underutilized" | "idle";
  };
}

export const CROSS_DOMAIN_ANALOGIES: CrossDomainAnalogy[] = [
  // ═══════════════════════════════════════════
  // MEDIA & ENTERTAINMENT
  // ═══════════════════════════════════════════
  {
    id: "spotify-streaming",
    company: "Spotify",
    sourceIndustry: "music",
    structuralPrimitive: "convert_ownership_to_access",
    moveDescription: "Eliminated physical inventory by converting music ownership to streaming access",
    patternId: "infrastructure_abstraction",
    mechanism: "Convert ownership of physical/discrete assets into a continuous access layer, eliminating inventory costs and enabling consumption-based pricing",
    constraintShape: { supplyFragmentation: "fragmented", switchingCosts: "low", distributionControl: "intermediated" },
  },
  {
    id: "netflix-unbundle-cable",
    company: "Netflix",
    sourceIndustry: "entertainment",
    structuralPrimitive: "unbundle_forced_bundle",
    moveDescription: "Unbundled cable TV's forced channel bundle into on-demand content selection",
    patternId: "unbundling",
    mechanism: "Decompose a forced bundle where customers pay for unwanted components — let them select only what they value",
    constraintShape: { switchingCosts: "moderate", distributionControl: "intermediated", marginStructure: "high_margin" },
  },
  {
    id: "youtube-ugc-supply",
    company: "YouTube",
    sourceIndustry: "media",
    structuralPrimitive: "crowd_source_supply",
    moveDescription: "Replaced professional content production with user-generated supply at near-zero marginal cost",
    patternId: "aggregation",
    mechanism: "Replace expensive professional supply with crowd-sourced alternatives, capturing value through curation and distribution rather than production",
    constraintShape: { supplyFragmentation: "atomized", laborIntensity: "labor_heavy", marginStructure: "thin_margin" },
  },

  // ═══════════════════════════════════════════
  // TRANSPORTATION & LOGISTICS
  // ═══════════════════════════════════════════
  {
    id: "uber-idle-capacity",
    company: "Uber",
    sourceIndustry: "transportation",
    structuralPrimitive: "monetize_idle_assets",
    moveDescription: "Unlocked idle personal vehicle capacity through dynamic demand matching",
    patternId: "aggregation",
    mechanism: "Aggregate underutilized assets from distributed owners via a real-time matching platform, converting idle capacity into revenue",
    constraintShape: { supplyFragmentation: "atomized", assetUtilization: "underutilized", distributionControl: "no_control" },
  },
  {
    id: "flexport-freight-visibility",
    company: "Flexport",
    sourceIndustry: "logistics",
    structuralPrimitive: "digitize_opaque_workflow",
    moveDescription: "Digitized opaque freight forwarding into a transparent, trackable platform",
    patternId: "infrastructure_abstraction",
    mechanism: "Replace opaque, manual coordination with a digital layer that provides real-time visibility and automated workflows",
    constraintShape: { distributionControl: "intermediated", laborIntensity: "labor_heavy", switchingCosts: "moderate" },
  },
  {
    id: "convoy-spot-market",
    company: "Convoy",
    sourceIndustry: "trucking",
    structuralPrimitive: "eliminate_broker_intermediary",
    moveDescription: "Eliminated freight broker intermediaries through algorithmic load matching",
    patternId: "supply_chain_relocation",
    mechanism: "Remove the intermediary layer by building direct matching between supply and demand, capturing the broker's margin",
    constraintShape: { supplyFragmentation: "fragmented", distributionControl: "intermediated", marginStructure: "thin_margin" },
  },

  // ═══════════════════════════════════════════
  // FINTECH & PAYMENTS
  // ═══════════════════════════════════════════
  {
    id: "stripe-api-complexity",
    company: "Stripe",
    sourceIndustry: "payments",
    structuralPrimitive: "abstract_complexity_into_api",
    moveDescription: "Abstracted payment processing complexity into a developer-friendly API",
    patternId: "infrastructure_abstraction",
    mechanism: "Encapsulate domain-specific complexity behind a simple programmatic interface, enabling non-specialists to integrate capabilities that previously required experts",
    constraintShape: { laborIntensity: "labor_heavy", switchingCosts: "high", distributionControl: "intermediated" },
  },
  {
    id: "klarna-shift-payment-timing",
    company: "Klarna",
    sourceIndustry: "fintech",
    structuralPrimitive: "shift_payment_timing",
    moveDescription: "Shifted payment timing from point-of-sale to post-delivery installments, absorbing buyer risk",
    patternId: "demand_reframing",
    mechanism: "Restructure payment timing to reduce buyer friction at the conversion moment — absorb risk to unlock demand that price sensitivity was blocking",
    constraintShape: { switchingCosts: "low", marginStructure: "moderate_margin", customerConcentration: "diversified" },
  },
  {
    id: "square-underserved-segment",
    company: "Square",
    sourceIndustry: "payments",
    structuralPrimitive: "serve_ignored_segment",
    moveDescription: "Brought payment processing to micro-merchants ignored by traditional providers",
    patternId: "demand_reframing",
    mechanism: "Target a segment that incumbents consider unprofitable by radically simplifying the offering and cost structure",
    constraintShape: { supplyFragmentation: "atomized", switchingCosts: "none", customerConcentration: "diversified" },
  },

  // ═══════════════════════════════════════════
  // HEALTHCARE & BIOTECH
  // ═══════════════════════════════════════════
  {
    id: "teladoc-remote-delivery",
    company: "Teladoc",
    sourceIndustry: "healthcare",
    structuralPrimitive: "remove_physical_constraint",
    moveDescription: "Removed the physical co-location requirement from medical consultations",
    patternId: "supply_chain_relocation",
    mechanism: "Relocate service delivery from a physical venue to a digital channel, eliminating geographic constraints and reducing cost per interaction",
    constraintShape: { laborIntensity: "labor_heavy", distributionControl: "owned", supplyFragmentation: "fragmented" },
  },
  {
    id: "hims-dtc-healthcare",
    company: "Hims & Hers",
    sourceIndustry: "healthcare",
    structuralPrimitive: "bypass_gatekeeper",
    moveDescription: "Bypassed traditional healthcare gatekeepers with direct-to-consumer telehealth",
    patternId: "supply_chain_relocation",
    mechanism: "Remove the gatekeeper that controls customer access — go directly to the end consumer with a simplified, accessible offering",
    constraintShape: { distributionControl: "intermediated", switchingCosts: "moderate", marginStructure: "high_margin" },
  },
  {
    id: "23andme-self-service-diagnostic",
    company: "23andMe",
    sourceIndustry: "genomics",
    structuralPrimitive: "self_service_expert_task",
    moveDescription: "Converted expert-mediated genetic testing into a consumer self-service product",
    patternId: "demand_reframing",
    mechanism: "Transform a task that required expert intermediation into a self-service experience, dramatically expanding the addressable market",
    constraintShape: { laborIntensity: "labor_heavy", distributionControl: "intermediated", customerConcentration: "concentrated" },
  },

  // ═══════════════════════════════════════════
  // AGRICULTURE & FOOD
  // ═══════════════════════════════════════════
  {
    id: "impossible-foods-substitute-input",
    company: "Impossible Foods",
    sourceIndustry: "food",
    structuralPrimitive: "substitute_constrained_input",
    moveDescription: "Substituted animal protein with plant-based alternatives, bypassing the agricultural supply chain",
    patternId: "supply_chain_relocation",
    mechanism: "Replace a constrained, expensive input material with a structurally different alternative that delivers the same functional output at lower cost",
    constraintShape: { supplyFragmentation: "consolidated", marginStructure: "thin_margin", assetUtilization: "moderate" },
  },
  {
    id: "farmers-business-network",
    company: "Farmers Business Network",
    sourceIndustry: "agriculture",
    structuralPrimitive: "collective_bargaining_platform",
    moveDescription: "Aggregated fragmented farmer purchasing power to negotiate better input prices",
    patternId: "aggregation",
    mechanism: "Aggregate the demand of many small buyers into collective purchasing power, negotiating prices that individual buyers could never achieve",
    constraintShape: { supplyFragmentation: "atomized", switchingCosts: "low", distributionControl: "intermediated" },
  },

  // ═══════════════════════════════════════════
  // EDUCATION & KNOWLEDGE
  // ═══════════════════════════════════════════
  {
    id: "masterclass-celebrity-supply",
    company: "MasterClass",
    sourceIndustry: "education",
    structuralPrimitive: "productize_scarce_expertise",
    moveDescription: "Productized scarce celebrity expertise into infinitely scalable video content",
    patternId: "infrastructure_abstraction",
    mechanism: "Record and productize scarce expert knowledge once, then distribute at near-zero marginal cost — decoupling value delivery from expert availability",
    constraintShape: { laborIntensity: "artisan", supplyFragmentation: "consolidated", marginStructure: "high_margin" },
  },
  {
    id: "duolingo-gamify-chore",
    company: "Duolingo",
    sourceIndustry: "education",
    structuralPrimitive: "gamify_painful_process",
    moveDescription: "Transformed painful language learning into an addictive game loop",
    patternId: "demand_reframing",
    mechanism: "Reframe a tedious but valuable activity as an engaging, gamified experience — converting dropout friction into retention through behavioral design",
    constraintShape: { switchingCosts: "none", customerConcentration: "diversified", laborIntensity: "labor_heavy" },
  },
  {
    id: "coursera-unbundle-university",
    company: "Coursera",
    sourceIndustry: "education",
    structuralPrimitive: "unbundle_institution",
    moveDescription: "Unbundled university education into individual courses accessible without admission",
    patternId: "unbundling",
    mechanism: "Extract the most valuable component from an institutional bundle and sell it independently — removing the forced purchase of unwanted bundled elements",
    constraintShape: { switchingCosts: "high", marginStructure: "high_margin", distributionControl: "owned" },
  },

  // ═══════════════════════════════════════════
  // ENERGY & UTILITIES
  // ═══════════════════════════════════════════
  {
    id: "sunrun-flip-capex-opex",
    company: "Sunrun",
    sourceIndustry: "energy",
    structuralPrimitive: "convert_capex_to_opex",
    moveDescription: "Converted solar panel purchase (CapEx) into a monthly lease (OpEx), removing the upfront cost barrier",
    patternId: "freemium_flip",
    mechanism: "Eliminate the upfront cost barrier by converting a large capital purchase into a recurring service payment — trade margin for market access",
    constraintShape: { switchingCosts: "high", marginStructure: "thin_margin", customerConcentration: "diversified" },
  },
  {
    id: "opower-monetize-data-byproduct",
    company: "Opower",
    sourceIndustry: "energy",
    structuralPrimitive: "monetize_data_byproduct",
    moveDescription: "Monetized utility consumption data by selling behavioral insights back to utilities",
    patternId: "stakeholder_monetization",
    mechanism: "Identify data generated as a byproduct of operations and sell insights derived from it to stakeholders who currently lack visibility",
    constraintShape: { customerConcentration: "concentrated", marginStructure: "thin_margin", assetUtilization: "underutilized" },
  },

  // ═══════════════════════════════════════════
  // SOFTWARE & TECHNOLOGY
  // ═══════════════════════════════════════════
  {
    id: "salesforce-saas-model",
    company: "Salesforce",
    sourceIndustry: "enterprise software",
    structuralPrimitive: "on_premise_to_cloud",
    moveDescription: "Converted on-premise software into cloud SaaS with subscription pricing",
    patternId: "infrastructure_abstraction",
    mechanism: "Move from one-time license + on-premise deployment to hosted subscription — reducing buyer friction and creating predictable recurring revenue",
    constraintShape: { switchingCosts: "high", revenueModel: "transactional", marginStructure: "high_margin" },
  },
  {
    id: "figma-multiplayer-collaboration",
    company: "Figma",
    sourceIndustry: "design tools",
    structuralPrimitive: "make_solo_tool_multiplayer",
    moveDescription: "Converted single-player design tools into real-time multiplayer collaboration",
    patternId: "network_effect",
    mechanism: "Add a collaboration layer to a traditionally single-user tool — each new user increases value for existing users and creates viral adoption",
    constraintShape: { switchingCosts: "moderate", laborIntensity: "mixed", distributionControl: "owned" },
  },
  {
    id: "notion-all-in-one",
    company: "Notion",
    sourceIndustry: "productivity",
    structuralPrimitive: "consolidate_point_solutions",
    moveDescription: "Rebundled docs, wikis, databases, and project management into a single workspace",
    patternId: "rebundling",
    mechanism: "Reassemble fragmented point solutions into an integrated workspace organized around the user's actual workflow rather than vendor categories",
    constraintShape: { supplyFragmentation: "fragmented", switchingCosts: "low", distributionControl: "shared" },
  },
  {
    id: "twilio-api-ify-telecom",
    company: "Twilio",
    sourceIndustry: "telecommunications",
    structuralPrimitive: "api_ify_legacy_infrastructure",
    moveDescription: "Wrapped legacy telecom infrastructure in developer APIs, making it programmable",
    patternId: "infrastructure_abstraction",
    mechanism: "Wrap legacy, hard-to-access infrastructure in modern APIs — make complex capabilities self-service and pay-per-use",
    constraintShape: { distributionControl: "intermediated", switchingCosts: "high", laborIntensity: "automated" },
  },

  // ═══════════════════════════════════════════
  // RETAIL & E-COMMERCE
  // ═══════════════════════════════════════════
  {
    id: "shopify-enable-long-tail",
    company: "Shopify",
    sourceIndustry: "e-commerce",
    structuralPrimitive: "enable_fragmented_supply",
    moveDescription: "Enabled millions of small merchants to sell online by abstracting e-commerce infrastructure",
    patternId: "infrastructure_abstraction",
    mechanism: "Build the missing operational infrastructure that prevents fragmented small players from competing — let them rent capabilities instead of building",
    constraintShape: { supplyFragmentation: "atomized", laborIntensity: "mixed", distributionControl: "no_control" },
  },
  {
    id: "costco-membership-model",
    company: "Costco",
    sourceIndustry: "retail",
    structuralPrimitive: "membership_subsidizes_product",
    moveDescription: "Used membership fees to subsidize near-cost product pricing, creating extreme value perception",
    patternId: "loss_leader_ecosystem",
    mechanism: "Create a membership/subscription revenue stream that subsidizes the core product to near-cost pricing — lock in customers with perceived value",
    constraintShape: { marginStructure: "thin_margin", customerConcentration: "diversified", switchingCosts: "low" },
  },
  {
    id: "warby-parker-dtc",
    company: "Warby Parker",
    sourceIndustry: "eyewear",
    structuralPrimitive: "eliminate_distribution_markup",
    moveDescription: "Cut out retail distribution to sell premium eyewear at 1/4 the price",
    patternId: "supply_chain_relocation",
    mechanism: "Move downstream past the distribution layer to own the customer relationship directly — capture the intermediary's margin and pass some to the customer as value",
    constraintShape: { distributionControl: "intermediated", marginStructure: "high_margin", switchingCosts: "none" },
  },

  // ═══════════════════════════════════════════
  // REAL ESTATE & CONSTRUCTION
  // ═══════════════════════════════════════════
  {
    id: "opendoor-instant-liquidity",
    company: "Opendoor",
    sourceIndustry: "real estate",
    structuralPrimitive: "instant_liquidity_for_illiquid_asset",
    moveDescription: "Provided instant liquidity for homes by becoming the algorithmic market maker",
    patternId: "demand_reframing",
    mechanism: "Become the market maker for an illiquid asset class — offer instant buy/sell at algorithmic prices, trading margin for speed and certainty",
    constraintShape: { switchingCosts: "high", assetUtilization: "underutilized", distributionControl: "intermediated" },
  },
  {
    id: "katerra-vertical-construction",
    company: "Katerra",
    sourceIndustry: "construction",
    structuralPrimitive: "vertically_integrate_fragments",
    moveDescription: "Vertically integrated architecture, manufacturing, and construction to eliminate coordination waste",
    patternId: "vertical_integration",
    mechanism: "Vertically integrate fragmented industry layers that currently waste 30-40% on coordination — own the full stack to eliminate handoff friction",
    constraintShape: { supplyFragmentation: "fragmented", laborIntensity: "labor_heavy", marginStructure: "thin_margin" },
  },

  // ═══════════════════════════════════════════
  // PROFESSIONAL SERVICES
  // ═══════════════════════════════════════════
  {
    id: "servicetitan-digitize-trades",
    company: "ServiceTitan",
    sourceIndustry: "home services",
    structuralPrimitive: "digitize_manual_coordination",
    moveDescription: "Digitized scheduling, dispatch, and invoicing for trades businesses",
    patternId: "infrastructure_abstraction",
    mechanism: "Build the operational OS for a fragmented, manually-coordinated industry — scheduling, dispatch, invoicing, and payments in one platform",
    constraintShape: { laborIntensity: "labor_heavy", supplyFragmentation: "atomized", distributionControl: "owned", revenueModel: "project_based" },
  },
  {
    id: "upwork-marketplace-labor",
    company: "Upwork",
    sourceIndustry: "freelancing",
    structuralPrimitive: "marketplace_for_labor",
    moveDescription: "Created a global marketplace matching fragmented freelance supply with distributed demand",
    patternId: "aggregation",
    mechanism: "Build a two-sided marketplace that matches distributed supply with distributed demand — enable price discovery and reduce search friction",
    constraintShape: { supplyFragmentation: "atomized", laborIntensity: "labor_heavy", switchingCosts: "none", distributionControl: "no_control" },
  },
  {
    id: "toast-vertical-saas",
    company: "Toast",
    sourceIndustry: "restaurants",
    structuralPrimitive: "vertical_saas_plus_payments",
    moveDescription: "Built vertical SaaS for restaurants then monetized payments flowing through the platform",
    patternId: "stakeholder_monetization",
    mechanism: "Give away or subsidize the workflow tool, then monetize the financial transactions flowing through it — capture the payments layer beneath the operational layer",
    constraintShape: { marginStructure: "thin_margin", supplyFragmentation: "atomized", laborIntensity: "labor_heavy", revenueModel: "transactional" },
  },
  {
    id: "veeva-industry-specific-crm",
    company: "Veeva Systems",
    sourceIndustry: "pharma",
    structuralPrimitive: "specialize_horizontal_tool",
    moveDescription: "Specialized Salesforce CRM for pharma with industry-specific compliance and workflows",
    patternId: "rebundling",
    mechanism: "Take a horizontal platform and deeply customize it for one industry's specific compliance, workflow, and data requirements — charge premium for specialization",
    constraintShape: { switchingCosts: "high", marginStructure: "high_margin", laborIntensity: "mixed" },
  },

  // ═══════════════════════════════════════════
  // MANUFACTURING & INDUSTRIAL
  // ═══════════════════════════════════════════
  {
    id: "protolabs-on-demand-manufacturing",
    company: "Protolabs",
    sourceIndustry: "manufacturing",
    structuralPrimitive: "on_demand_replaces_batch",
    moveDescription: "Replaced batch manufacturing with on-demand digital production at small volumes",
    patternId: "demand_reframing",
    mechanism: "Replace batch/bulk production economics with on-demand, low-MOQ digital production — serve the long tail that traditional manufacturing ignores",
    constraintShape: { assetUtilization: "underutilized", supplyFragmentation: "consolidated", switchingCosts: "moderate" },
  },
  {
    id: "rolls-royce-power-by-hour",
    company: "Rolls-Royce",
    sourceIndustry: "aerospace",
    structuralPrimitive: "outcome_based_pricing",
    moveDescription: "Shifted from selling jet engines to charging per hour of thrust ('Power by the Hour')",
    patternId: "outcome_pricing",
    mechanism: "Stop selling the asset and start selling the outcome it produces — align pricing with customer value and create predictable recurring revenue",
    constraintShape: { switchingCosts: "high", marginStructure: "moderate_margin", revenueModel: "transactional", assetUtilization: "moderate" },
  },
  {
    id: "hilti-fleet-management",
    company: "Hilti",
    sourceIndustry: "construction tools",
    structuralPrimitive: "tool_as_service",
    moveDescription: "Converted tool sales into a fleet management subscription with guaranteed uptime",
    patternId: "outcome_pricing",
    mechanism: "Convert product ownership into a managed service subscription — guarantee uptime/performance and charge recurring fees instead of one-time sales",
    constraintShape: { assetUtilization: "underutilized", revenueModel: "transactional", switchingCosts: "low" },
  },

  // ═══════════════════════════════════════════
  // INSURANCE & RISK
  // ═══════════════════════════════════════════
  {
    id: "lemonade-ai-underwriting",
    company: "Lemonade",
    sourceIndustry: "insurance",
    structuralPrimitive: "automate_expert_judgment",
    moveDescription: "Replaced human underwriters with AI-driven instant policy decisions",
    patternId: "infrastructure_abstraction",
    mechanism: "Automate expert judgment calls with algorithmic decision-making — dramatically reduce cost and time while achieving equivalent or better accuracy",
    constraintShape: { laborIntensity: "labor_heavy", marginStructure: "moderate_margin", distributionControl: "intermediated" },
  },
  {
    id: "metromile-usage-based",
    company: "Metromile",
    sourceIndustry: "auto insurance",
    structuralPrimitive: "usage_based_pricing",
    moveDescription: "Replaced flat-rate auto insurance with per-mile pricing based on actual usage",
    patternId: "outcome_pricing",
    mechanism: "Replace flat-rate pricing with usage-based pricing that reflects actual consumption — attract low-usage customers being overcharged by incumbents",
    constraintShape: { customerConcentration: "diversified", marginStructure: "moderate_margin", switchingCosts: "low" },
  },

  // ═══════════════════════════════════════════
  // ADDITIONAL HIGH-LEVERAGE PATTERNS
  // ═══════════════════════════════════════════
  {
    id: "airbnb-unlock-spare-capacity",
    company: "Airbnb",
    sourceIndustry: "hospitality",
    structuralPrimitive: "unlock_spare_capacity",
    moveDescription: "Unlocked spare room/home capacity that had zero utilization into revenue-generating assets",
    patternId: "aggregation",
    mechanism: "Create a platform that makes it trivial for asset owners to monetize spare capacity — aggregate distributed idle assets into a unified marketplace",
    constraintShape: { supplyFragmentation: "atomized", assetUtilization: "idle", distributionControl: "no_control", switchingCosts: "none" },
  },
  {
    id: "tesla-direct-sales",
    company: "Tesla",
    sourceIndustry: "automotive",
    structuralPrimitive: "disintermediate_dealer_network",
    moveDescription: "Bypassed the dealer network with direct-to-consumer sales and OTA updates",
    patternId: "supply_chain_relocation",
    mechanism: "Own the entire customer relationship end-to-end by bypassing the traditional dealer/distributor layer — capture margin and control the experience",
    constraintShape: { distributionControl: "intermediated", marginStructure: "moderate_margin", switchingCosts: "moderate" },
  },
  {
    id: "peloton-hardware-subscription",
    company: "Peloton",
    sourceIndustry: "fitness",
    structuralPrimitive: "hardware_plus_content_subscription",
    moveDescription: "Sold hardware at near-cost and monetized through ongoing content subscription",
    patternId: "loss_leader_ecosystem",
    mechanism: "Subsidize the hardware to build an installed base, then monetize through recurring content/service subscriptions that have near-zero marginal cost",
    constraintShape: { revenueModel: "transactional", switchingCosts: "low", marginStructure: "moderate_margin" },
  },
];
