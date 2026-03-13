/**
 * DARPA-Inspired Impossibility Operations
 *
 * Instead of freestyle brainstorming, this module defines 5 structural
 * impossibility operations parameterized by mode (product / business) and
 * lens (default / eta / maker). For each top leverage primitive, the AI
 * is forced through specific operations that produce structurally-derived
 * concepts rather than incremental optimizations.
 *
 * The goal: "What would it look like if this constraint didn't exist?"
 * → then engineer backward to make it real.
 */

// ═══════════════════════════════════════════════════════════════
//  OPERATION DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export interface ImpossibilityOperation {
  id: string;
  name: string;
  directive: string;        // What the AI must do
  examplePattern: string;   // A real-world proof point
  outputRequirement: string; // What the output must contain
}

export interface ModeOperationSet {
  mode: "product" | "business";
  operations: ImpossibilityOperation[];
  primitiveInjectionKey: string; // Which structural data to inject
  selectionLogic: string;        // How to pick top primitives
}

// ═══════════════════════════════════════════════════════════════
//  PRODUCT MODE OPERATIONS
// ═══════════════════════════════════════════════════════════════

const PRODUCT_OPERATIONS: ImpossibilityOperation[] = [
  {
    id: "constraint_weaponization",
    name: "Constraint Weaponization",
    directive: `Take the HARDEST physics, materials, or manufacturing constraint binding this product.
Instead of solving it, WEAPONIZE it: make the constraint itself the primary feature and competitive moat.
The constraint that makes this product hard to build should make it IMPOSSIBLE for competitors to replicate.
Think: How does this limitation become an unfair advantage?`,
    examplePattern: `Dyson turned the "impossible to manufacture" cyclone geometry into a patent wall.
Gore-Tex turned membrane fragility into a premium positioning moat.
Carbon fiber's manufacturing difficulty IS the barrier to entry.`,
    outputRequirement: `Must specify: (1) the exact constraint being weaponized, (2) how it becomes a feature customers pay MORE for, (3) the competitive moat it creates, (4) why attempting to remove this constraint would actually destroy value.`
  },
  {
    id: "role_inversion",
    name: "Role Inversion",
    directive: `Invert WHO does WHAT in the product's value chain.
If the manufacturer builds it → the user builds it (and it's better).
If the user operates it → it operates itself (and captures new data).
If a specialist maintains it → the community maintains it (and creates network effects).
The inversion must create a structural advantage that didn't exist before.`,
    examplePattern: `IKEA: manufacturer → user assembles = 60% cost reduction + flat-pack logistics revolution.
Arduino: engineer designs → hobbyist designs = created entire maker economy.
Tesla: dealer maintains → OTA self-updates = eliminated dealership dependency.`,
    outputRequirement: `Must specify: (1) current role assignment, (2) the inversion, (3) the structural advantage created (cost, speed, network, data), (4) what new capability emerges that was previously impossible.`
  },
  {
    id: "waste_as_product",
    name: "Waste-as-Product",
    directive: `Identify the LARGEST waste stream, byproduct, or underutilized output in this product's lifecycle.
Transform it into the PRIMARY revenue source — the original product becomes the loss leader.
The waste must generate more value than the core product.
Think: manufacturing scrap, heat, data exhaust, packaging, user attention, failed units.`,
    examplePattern: `Sawmill waste (sawdust) → engineered wood products (MDF) = larger market than lumber.
Whey (cheese waste) → protein supplements = $15B market from dairy byproduct.
Google Search (free product) → attention data → advertising = $280B revenue from "waste."`,
    outputRequirement: `Must specify: (1) the specific waste/byproduct, (2) the new product/revenue it becomes, (3) unit economics showing waste-product exceeds core-product margin, (4) why this hasn't been done (and what's changed).`
  },
  {
    id: "zero_player",
    name: "Zero-Player Product",
    directive: `Redesign this product to ELIMINATE the need for a manufacturer, assembler, or operator entirely.
The product self-assembles, self-repairs, self-distributes, or self-evolves.
If no human touches it after raw materials, what does the business look like?
Think: biological manufacturing, 3D-printed on-site, open-source self-replicating, autonomous maintenance.`,
    examplePattern: `Seed bombs: "manufactured" by nature after deployment — zero ongoing production cost.
RepRap 3D printer: prints its own replacement parts — self-replicating manufacturing.
Roomba: self-operating + self-charging = zero-operator floor care.`,
    outputRequirement: `Must specify: (1) which human roles are eliminated, (2) what replaces them (biology, software, user labor, automation), (3) the cost structure with zero labor, (4) the new failure modes this creates and how they're handled.`
  },
  {
    id: "time_inversion",
    name: "Time Inversion",
    directive: `Invert the TEMPORAL sequence of this product's value delivery.
If the product is bought then used → it's used then bought (try-before-buy at structural level).
If it's manufactured then shipped → it's shipped as raw material then manufactured on-site.
If it degrades over time → it IMPROVES over time (biological, algorithmic, or network-driven).
The time inversion must create a fundamentally different economic model.`,
    examplePattern: `Rolls-Royce "Power by the Hour": buy engine → pay per flight hour = aligned incentives.
Wine/Whiskey: product IMPROVES with time = appreciating asset model.
Spotify: pay before listening → listen before paying (free tier) = demand-first economics.`,
    outputRequirement: `Must specify: (1) current temporal sequence, (2) the inversion, (3) how cash flow changes, (4) what new customer behavior this enables, (5) the economic model shift.`
  },
];

// ═══════════════════════════════════════════════════════════════
//  BUSINESS MODEL OPERATIONS
// ═══════════════════════════════════════════════════════════════

const BUSINESS_OPERATIONS: ImpossibilityOperation[] = [
  {
    id: "constraint_weaponization",
    name: "Constraint Weaponization",
    directive: `Take the HARDEST regulatory, capital, or structural constraint binding this business.
Instead of routing around it, WEAPONIZE it: make compliance/capital intensity the moat that kills competitors.
The constraint that makes this business hard to enter should make it IMPOSSIBLE for others to compete.
Think: How does this barrier become your castle wall?`,
    examplePattern: `Stripe turned PCI compliance (nightmare for devs) into a developer-first API = regulatory moat.
Waste Management turned EPA regulations into barriers competitors can't afford to clear.
Banks use capital reserve requirements as moats against fintech disruptors.`,
    outputRequirement: `Must specify: (1) the exact constraint being weaponized, (2) how it eliminates competitor entry, (3) the investment required to build the moat, (4) why this constraint is getting HARDER not easier (strengthening moat over time).`
  },
  {
    id: "role_inversion",
    name: "Role Inversion",
    directive: `Invert the fundamental relationship between key actors in this business model.
If you serve customers → customers serve each other (and you take a cut).
If you buy from suppliers → suppliers compete to PAY YOU for shelf space.
If you employ workers → workers are owners (and the economics are better).
The inversion must create a structural advantage that compounds over time.`,
    examplePattern: `Airbnb: hotel owns rooms → guests own rooms = zero capital, infinite inventory.
Costco: retailer marks up → retailer charges membership, sells at cost = aligned incentives.
Visa: bank lends money → merchants pay for transaction access = network-effect monopoly.`,
    outputRequirement: `Must specify: (1) current actor relationships, (2) the inversion, (3) why the new arrangement is BETTER for all parties (not just cheaper), (4) the compounding mechanism (network effects, data, trust).`
  },
  {
    id: "waste_as_product",
    name: "Waste-as-Product",
    directive: `Identify the LARGEST value leak, data exhaust, idle capacity, or operational byproduct in this business.
Transform it into a revenue stream that exceeds the core business margin.
The "waste" could be: customer data patterns, off-peak capacity, failed leads, expertise overflow, regulatory compliance knowledge.
Think: What does this business produce accidentally that someone else would pay for?`,
    examplePattern: `Amazon AWS: server idle capacity → $80B cloud business (10x retail margin).
Bloomberg: financial data terminal byproduct → media empire.
Intuit TurboTax: tax filing data → financial product recommendations = highest-margin revenue.`,
    outputRequirement: `Must specify: (1) the specific waste/byproduct/idle capacity, (2) who would pay for it and why, (3) margin comparison (waste-product vs core), (4) whether this creates conflicts with the core business (and how to manage them).`
  },
  {
    id: "zero_player",
    name: "Zero-Player Business",
    directive: `Redesign this business to operate with ZERO employees, ZERO physical presence, or ZERO marginal cost.
The business runs itself through: algorithmic matching, community governance, embedded systems, or protocol-level automation.
If the founder disappeared tomorrow and the business kept running and growing, what would it look like?
This is the "vending machine" test at maximum scale.`,
    examplePattern: `Uniswap: $1.5T trading volume, ~20 employees — protocol replaces institution.
Vanguard index funds: algorithmic rebalancing = fund management with near-zero human input.
Craigslist: <50 employees, $700M+ revenue — community self-moderates and self-serves.`,
    outputRequirement: `Must specify: (1) which human functions are eliminated, (2) what replaces them (protocol, algorithm, community, automation), (3) the resulting unit economics, (4) the governance mechanism that prevents decay without human oversight.`
  },
  {
    id: "time_inversion",
    name: "Time Inversion",
    directive: `Invert WHEN value is captured relative to when it's delivered.
If customers pay after receiving value → they pay before (and get a better deal).
If the business invests capital upfront → capital comes from customers first (negative working capital).
If the business model degrades with competition → it STRENGTHENS with more competitors.
The time inversion must create a fundamentally different cash flow architecture.`,
    examplePattern: `Dell: negative working capital — customers pay before Dell buys components = infinite scaling.
Insurance: collect premiums years before claims = float for investment (Berkshire model).
Kickstarter: revenue before production = zero inventory risk, demand-validated manufacturing.`,
    outputRequirement: `Must specify: (1) current cash flow timing, (2) the inversion, (3) working capital impact, (4) how this changes competitive dynamics, (5) what trust mechanism enables customers to accept the new timing.`
  },
];

// ═══════════════════════════════════════════════════════════════
//  LENS MODIFIERS — Adjust operation selection & emphasis
// ═══════════════════════════════════════════════════════════════

interface LensModifier {
  /** Which operations to prioritize (first 3 are used) */
  priorityOrder: string[];
  /** Additional constraints on idea output */
  filterDirective: string;
  /** Scoring weight adjustments */
  scoringOverride: string;
}

const LENS_MODIFIERS: Record<string, LensModifier> = {
  default: {
    priorityOrder: ["constraint_weaponization", "role_inversion", "waste_as_product", "zero_player", "time_inversion"],
    filterDirective: "",
    scoringOverride: "",
  },
  eta: {
    priorityOrder: ["waste_as_product", "role_inversion", "time_inversion", "constraint_weaponization", "zero_player"],
    filterDirective: `ETA FILTER: Every concept must be achievable by a NEW OWNER within 36 months.
Exclude concepts requiring: (a) >$2M additional capital beyond acquisition, (b) fundamental technology development, (c) regulatory changes.
Prioritize concepts that INCREASE enterprise value for eventual exit.
Factor in owner-dependency: concepts that reduce key-person risk score higher.`,
    scoringOverride: `SCORING OVERRIDE — ETA lens active:
- Feasibility weight: 2x (must be implementable by acquirer)
- Capital requirement: cap at "Medium" for any qualifying idea
- Timeline: must show value creation within 18 months
- Add "Exit Multiple Impact" estimate to each idea`,
  },
  maker: {
    priorityOrder: ["constraint_weaponization", "zero_player", "waste_as_product", "role_inversion", "time_inversion"],
    filterDirective: `MAKER FILTER: Every concept must pass the "garage test" — buildable with <$10K initial investment.
Exclude concepts requiring: (a) regulatory approval >6 months, (b) specialized manufacturing equipment >$50K, (c) team >3 people.
Prioritize concepts with: open-source enablers, 3D-printable components, off-the-shelf electronics.`,
    scoringOverride: `SCORING OVERRIDE — Maker lens active:
- BOM cost MUST be calculable and shown
- Manufacturing method must be named (3D print, CNC, injection mold, PCB fab)
- Prototype-to-product path must be explicit
- Patent landscape assessment required`,
  },
  deep_tech: {
    priorityOrder: ["zero_player", "constraint_weaponization", "time_inversion", "waste_as_product", "role_inversion"],
    filterDirective: `DEEP TECH FILTER: Prioritize concepts with defensible IP moats (patents, trade secrets, proprietary data).
Include concepts requiring: novel materials, algorithms, or processes that create 10x improvements.
Acceptable: 3-7 year development timelines if the moat justifies it.
Must identify the specific technical breakthrough required.`,
    scoringOverride: `SCORING OVERRIDE — Deep Tech lens active:
- Novelty weight: 3x (must be genuinely new)
- Feasibility can be lower IF moat is strong
- Must include "Technical Risk Assessment" with specific unknowns
- Patent filing strategy must be outlined`,
  },
};

// ═══════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════

export interface ImpossibilityPromptConfig {
  mode: "product" | "business";
  lensType?: string;
  leveragePrimitives?: Array<{
    primitiveId?: string;
    primitiveLabel?: string;
    bindingStrength?: number;
    cascadeReach?: number;
    challengeability?: number;
    leverageScore?: number;
    bestTransformation?: string;
    reasoning?: string;
  }>;
  transformationClusters?: Array<{
    cluster_name?: string;
    theme?: string;
    transformations?: string[];
    strategicPowerScore?: number;
  }>;
  bindingConstraint?: Record<string, unknown>;
  dominantMechanism?: Record<string, unknown>;
  ideaCount?: number;
}

/**
 * Build the impossibility operations prompt block.
 * Returns the full structured prompt section that replaces freestyle brainstorming.
 */
export function buildImpossibilityPrompt(config: ImpossibilityPromptConfig): string {
  const { mode, lensType = "default", leveragePrimitives = [], transformationClusters = [], bindingConstraint, dominantMechanism, ideaCount = 2 } = config;

  const baseOps = mode === "product" ? PRODUCT_OPERATIONS : BUSINESS_OPERATIONS;
  const modifier = LENS_MODIFIERS[lensType] || LENS_MODIFIERS.default;

  // Select top 3 operations based on lens priority
  const selectedOps = modifier.priorityOrder
    .slice(0, 3)
    .map(id => baseOps.find(op => op.id === id))
    .filter(Boolean) as ImpossibilityOperation[];

  // Select top leverage primitives (max 3, sorted by leverageScore)
  const topPrimitives = [...leveragePrimitives]
    .sort((a, b) => (b.leverageScore || 0) - (a.leverageScore || 0))
    .slice(0, 3);

  // Build the structured prompt
  const parts: string[] = [];

  parts.push(`
═══════════════════════════════════════════════════════════════
 STRUCTURAL IMPOSSIBILITY ENGINE — ${mode.toUpperCase()} MODE
═══════════════════════════════════════════════════════════════

You are NOT brainstorming. You are a STRUCTURAL ENGINEER of business/product concepts.

Your job: Take each high-leverage primitive below and apply specific impossibility
operations to derive concepts that are STRUCTURALLY INEVITABLE given the system's
architecture — not creative guesses.

METHODOLOGY (DARPA Program Manager mindset):
1. Start from what is STRUCTURALLY TRUE about this system (the primitives below)
2. Apply an impossibility operation: "What if this constraint didn't exist?"
3. Engineer BACKWARD from the impossible state to find a viable path
4. The concept that emerges is not an "idea" — it's a STRUCTURAL RECONFIGURATION

CRITICAL: Every concept MUST trace to a specific primitive + operation combination.
If you cannot show the derivation chain, the concept is REJECTED.`);

  // Inject leverage primitives
  if (topPrimitives.length > 0) {
    parts.push(`
─── TARGET PRIMITIVES (ranked by disruption potential) ───
${topPrimitives.map((p, i) => `
${i + 1}. [${p.primitiveLabel || p.primitiveId || "Unknown"}]
   Binding Strength: ${p.bindingStrength || "?"}/10 | Cascade Reach: ${p.cascadeReach || "?"}/10 | Challengeability: ${p.challengeability || "?"}/10
   Leverage Score: ${p.leverageScore || "?"}/10
   Best Transformation: ${p.bestTransformation || "unknown"}
   Reasoning: ${p.reasoning || "N/A"}`).join("\n")}`);
  }

  // Inject binding constraint & dominant mechanism
  if (bindingConstraint) {
    parts.push(`
─── BINDING CONSTRAINT (the #1 structural lock) ───
${JSON.stringify(bindingConstraint, null, 2)}
→ Every concept should either DISSOLVE, WEAPONIZE, or INVERT this constraint.`);
  }

  if (dominantMechanism) {
    parts.push(`
─── DOMINANT MECHANISM (how value currently flows) ───
${JSON.stringify(dominantMechanism, null, 2)}
→ Concepts that REDIRECT or RESTRUCTURE this mechanism are 10x higher leverage than concepts working within it.`);
  }

  // Inject transformation clusters for context
  if (transformationClusters.length > 0) {
    parts.push(`
─── UPSTREAM TRANSFORMATION CLUSTERS (proven reconfiguration paths) ───
${transformationClusters.map((tc, i) => `${i + 1}. "${tc.cluster_name || tc.theme}" — ${(tc.transformations || []).join(", ")}`).join("\n")}
→ Use these as structural foundations. EXTEND them through impossibility operations, don't just restate them.`);
  }

  // Inject the selected impossibility operations
  parts.push(`
═══════════════════════════════════════════════════════════════
 IMPOSSIBILITY OPERATIONS TO APPLY (select ${ideaCount} best combinations)
═══════════════════════════════════════════════════════════════

For each concept you generate, you MUST:
1. Select one primitive from the TARGET PRIMITIVES above
2. Apply one of the operations below to that primitive
3. Derive the concept by engineering backward from the "impossible" state
4. Show the full derivation chain in the output

${selectedOps.map((op, i) => `
── OPERATION ${i + 1}: ${op.name} ──
${op.directive}

REAL-WORLD PROOF:
${op.examplePattern}

OUTPUT REQUIREMENT:
${op.outputRequirement}`).join("\n")}`);

  // Apply lens modifiers
  if (modifier.filterDirective) {
    parts.push(`
─── LENS FILTER ───
${modifier.filterDirective}`);
  }

  if (modifier.scoringOverride) {
    parts.push(`
─── SCORING ADJUSTMENTS ───
${modifier.scoringOverride}`);
  }

  // Derivation chain requirement
  parts.push(`
═══════════════════════════════════════════════════════════════
 REQUIRED DERIVATION CHAIN (must appear in EVERY concept)
═══════════════════════════════════════════════════════════════

Each concept's "constraint_linkage" MUST include:
{
  "derivation": {
    "primitive_targeted": "exact label from TARGET PRIMITIVES",
    "primitive_leverage_score": <number>,
    "operation_applied": "${selectedOps.map(o => o.id).join(" | ")}",
    "impossibility_statement": "What would it look like if [constraint] didn't exist?",
    "backward_engineering": "The path from impossible → viable",
    "structural_advantage": "Why this reconfiguration compounds over time",
    "precedent": "Real company/product that proved a piece of this works (or 'Genuinely novel' with timing justification)"
  }
}

ANTI-INCREMENTALISM FILTER:
Before finalizing any concept, apply this test:
- Would an industry insider say "that's obvious"? → REJECT, dig deeper
- Could a competitor replicate this in <6 months? → REJECT, find the moat
- Does this preserve the current system's structure? → REJECT, it's optimization not invention
- Is the economic model 2x better? → REJECT, find the 10x reconfiguration`);

  return parts.join("\n");
}

/**
 * Get operation names for a mode + lens (useful for UI display).
 */
export function getActiveOperations(mode: "product" | "business", lensType = "default"): string[] {
  const modifier = LENS_MODIFIERS[lensType] || LENS_MODIFIERS.default;
  return modifier.priorityOrder.slice(0, 3);
}
