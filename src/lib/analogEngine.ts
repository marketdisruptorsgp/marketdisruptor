/**
 * CROSS-INDUSTRY ANALOG ENGINE
 *
 * Finds businesses in completely different industries that share the same
 * \"constraint shape\" — the structural pattern of what's blocking them.
 *
 * Instead of category-bound reasoning ("pricing problem → pricing solution"),
 * this engine finds cross-domain solutions:
 *   "Your dental practice has the same capacity bottleneck as a cloud kitchen.
 *    Cloud kitchens solved it by decoupling preparation from service."
 *
 * Architecture:
 *   1. Extract constraint shape (the structural signature of the problem)
 *   2. Match against analog library of cross-industry solutions
 *   3. Generate "transfer insights" — how the analog's solution maps back
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicInsight } from "@/lib/strategicEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

/** The structural signature of a constraint — what makes it hard */
export interface ConstraintShape {
  id: string;
  /** The core bottleneck type */
  bottleneckType: BottleneckType;
  /** What resource is scarce or constrained */
  scarceResource: string;
  /** How the constraint scales — does it get worse linearly, exponentially, or plateau? */
  scalingBehavior: "linear" | "exponential" | "plateau" | "binary";
  /** Is the constraint time-bound, capacity-bound, or knowledge-bound? */
  bindingMechanism: "time" | "capacity" | "knowledge" | "regulation" | "capital" | "trust" | "geography";
  /** The upstream constraint label for traceability */
  sourceConstraintLabel: string;
  sourceConstraintId?: string;
}

export type BottleneckType =
  | "human_capacity"     // Can't scale because humans are the bottleneck
  | "asset_utilization"  // Expensive assets sit idle most of the time
  | "knowledge_lock"     // Expertise trapped in a few heads
  | "geographic_tether"  // Must be physically present
  | "trust_deficit"      // Customers can't verify quality before purchase
  | "margin_squeeze"     // Costs grow faster than revenue
  | "demand_mismatch"    // Supply and demand are temporally or spatially misaligned
  | "regulatory_cage"    // Rules prevent the obvious solution
  | "switching_moat"     // Customers are locked in by switching costs
  | "information_asymmetry" // One side knows much more than the other
  | "coordination_failure"  // Multiple parties need to act together but can't
  | "fragmented_supply"    // Too many small suppliers, no aggregation;

/** A real-world business that solved a similar constraint shape */
export interface CrossIndustryAnalog {
  id: string;
  /** The business/company that solved it */
  company: string;
  /** Their industry (deliberately different from the target) */
  industry: string;
  /** The constraint shape they faced */
  constraintShape: BottleneckType;
  /** How they solved it — the structural mechanism */
  solutionMechanism: string;
  /** The specific insight that transfers */
  transferInsight: string;
  /** What changed structurally (the "aha") */
  structuralShift: string;
  /** Outcome evidence */
  outcome: string;
  /** Which binding mechanisms this analog addresses */
  addressedBindings: ConstraintShape["bindingMechanism"][];
}

/** A matched analog with relevance to the user's specific situation */
export interface AnalogMatch {
  analog: CrossIndustryAnalog;
  /** How the analog's solution maps to the user's constraint */
  transferNarrative: string;
  /** Relevance score 0-1 (internal, not shown to user) */
  relevance: number;
  /** The constraint it addresses */
  targetConstraint: ConstraintShape;
}

// ═══════════════════════════════════════════════════════════════
//  ANALOG LIBRARY — Cross-Industry Solutions
// ═══════════════════════════════════════════════════════════════

const ANALOG_LIBRARY: CrossIndustryAnalog[] = [
  // ── Human Capacity ──
  {
    id: "ana-cloud-kitchen",
    company: "CloudKitchens / Virtual Kitchens",
    industry: "Food Service",
    constraintShape: "human_capacity",
    solutionMechanism: "Decouple the preparation layer from the service layer. Multiple brands share one kitchen, each chef's output serves 3-5 virtual brands.",
    transferInsight: "If your skilled labor is the bottleneck, ask: can one skilled person's output be packaged and delivered through multiple channels simultaneously?",
    structuralShift: "1 chef → 1 restaurant becomes 1 chef → 5 brands",
    outcome: "3-5x revenue per skilled worker without additional hiring",
    addressedBindings: ["capacity", "geography"],
  },
  {
    id: "ana-angi",
    company: "Angi (formerly Angie's List)",
    industry: "Home Services",
    constraintShape: "human_capacity",
    solutionMechanism: "Instead of hiring more skilled workers, become the coordination layer. Match existing independent workers to demand, taking a platform fee.",
    transferInsight: "Instead of scaling your own labor force, become the matchmaker between existing independent operators and unserved demand.",
    structuralShift: "Employer of skilled labor → orchestrator of independent labor",
    outcome: "Scaled to 250K+ service providers without employing any",
    addressedBindings: ["capacity", "capital"],
  },
  {
    id: "ana-masterclass",
    company: "MasterClass",
    industry: "Education",
    constraintShape: "human_capacity",
    solutionMechanism: "Record the expert once, sell access infinitely. The expert's time investment is fixed but revenue scales without limit.",
    transferInsight: "If your value comes from expert knowledge, can you record/encode it once and distribute it as a product with zero marginal cost?",
    structuralShift: "Expert sells time → Expert sells recordings",
    outcome: "$100M+ revenue from finite expert time investment",
    addressedBindings: ["time", "capacity"],
  },

  // ── Asset Utilization ──
  {
    id: "ana-airbnb",
    company: "Airbnb",
    industry: "Hospitality",
    constraintShape: "asset_utilization",
    solutionMechanism: "Don't own the asset. Create a marketplace that lets others monetize their idle assets, and take a percentage.",
    transferInsight: "If your business requires expensive assets that sit idle, can you access others' idle assets instead of owning your own?",
    structuralShift: "Own hotels → Coordinate spare bedrooms",
    outcome: "More rooms than any hotel chain, zero asset ownership",
    addressedBindings: ["capital", "capacity"],
  },
  {
    id: "ana-flexport",
    company: "Flexport",
    industry: "Logistics",
    constraintShape: "asset_utilization",
    solutionMechanism: "Layer software intelligence on top of existing logistics assets. Don't own trucks/ships — orchestrate them with better data.",
    transferInsight: "If you can't afford the assets, build the intelligence layer that makes existing assets work better — then you become indispensable.",
    structuralShift: "Own logistics → Orchestrate logistics",
    outcome: "$8B valuation without owning fleet assets",
    addressedBindings: ["capital", "capacity"],
  },

  // ── Knowledge Lock ──
  {
    id: "ana-turbotax",
    company: "TurboTax",
    industry: "Tax Preparation",
    constraintShape: "knowledge_lock",
    solutionMechanism: "Encode expert decision trees into interactive software. The software asks the questions the expert would ask.",
    transferInsight: "If your business depends on expert judgment, can you map the expert's decision tree into a guided system that non-experts can follow?",
    structuralShift: "Pay an expert → Follow a guided system",
    outcome: "40M+ users doing taxes without accountants",
    addressedBindings: ["knowledge", "capacity", "time"],
  },
  {
    id: "ana-figma",
    company: "Figma",
    industry: "Design Tools",
    constraintShape: "knowledge_lock",
    solutionMechanism: "Lower the skill floor by providing templates, components, and collaborative features. Non-designers can participate in design.",
    transferInsight: "If only specialists can do the work, can you create a system where non-specialists produce 80% quality output?",
    structuralShift: "Experts create → Everyone contributes",
    outcome: "Acquired for $20B by democratizing design collaboration",
    addressedBindings: ["knowledge", "capacity"],
  },

  // ── Geographic Tether ──
  {
    id: "ana-teladoc",
    company: "Teladoc",
    industry: "Healthcare",
    constraintShape: "geographic_tether",
    solutionMechanism: "Digitize the consultation layer while keeping the physical treatment local. Split the service into 'diagnosis' (remote) and 'treatment' (local).",
    transferInsight: "Can you split your service into a remote advisory/diagnosis layer and a local execution layer? Only the execution needs physical presence.",
    structuralShift: "Doctor must be present → Doctor advises remotely, local provider executes",
    outcome: "$30B peak valuation by decoupling expertise from location",
    addressedBindings: ["geography", "capacity"],
  },
  {
    id: "ana-toptal",
    company: "Toptal",
    industry: "Talent Marketplace",
    constraintShape: "geographic_tether",
    solutionMechanism: "Create a vetted global talent pool. Screen once rigorously, then match anywhere. Geography becomes irrelevant for knowledge work.",
    transferInsight: "If you're constrained by local talent, can you create a pre-vetted remote pool that's trusted enough to replace local presence?",
    structuralShift: "Hire local → Access global vetted talent",
    outcome: "$1B+ revenue connecting global talent to local needs",
    addressedBindings: ["geography", "trust"],
  },

  // ── Trust Deficit ──
  {
    id: "ana-carfax",
    company: "Carfax",
    industry: "Automotive",
    constraintShape: "trust_deficit",
    solutionMechanism: "Create a verifiable history record that travels with the product. Transform opaque quality into transparent, checkable data.",
    transferInsight: "If customers can't trust quality before purchase, can you create a transparent provenance record that makes quality verifiable?",
    structuralShift: "Trust the seller → Trust the data",
    outcome: "Became the standard for used car transactions, $1B+ business",
    addressedBindings: ["trust"],
  },
  {
    id: "ana-stripe",
    company: "Stripe",
    industry: "Fintech",
    constraintShape: "trust_deficit",
    solutionMechanism: "Become the trusted intermediary that handles the complex, risky part. Neither side needs to trust the other — they trust the platform.",
    transferInsight: "If trust is the barrier, can you insert yourself as the trusted layer that handles risk, so both parties only need to trust you?",
    structuralShift: "Parties must trust each other → Both trust the platform",
    outcome: "$95B valuation by being the trust layer for online payments",
    addressedBindings: ["trust", "knowledge"],
  },

  // ── Margin Squeeze ──
  {
    id: "ana-costco",
    company: "Costco",
    industry: "Retail",
    constraintShape: "margin_squeeze",
    solutionMechanism: "Flip the revenue model entirely. Sell products at near-cost, make money from membership fees. Volume becomes an asset, not a cost.",
    transferInsight: "If your margins are being squeezed, can you move the revenue model to a membership/access fee and make the core product nearly free?",
    structuralShift: "Profit on products → Profit on access",
    outcome: "$230B revenue, 90%+ membership renewal rate",
    addressedBindings: ["capital"],
  },
  {
    id: "ana-michelin",
    company: "Michelin Guide",
    industry: "Tires / Dining",
    constraintShape: "margin_squeeze",
    solutionMechanism: "Create a high-status content asset that drives demand for your commodity product indirectly. The guide makes people drive more.",
    transferInsight: "If your core product is commoditized, can you create a complementary asset that increases demand for it without competing on price?",
    structuralShift: "Compete on product → Create demand through adjacent value",
    outcome: "Michelin Guide drives tire sales by encouraging travel",
    addressedBindings: ["capital", "trust"],
  },

  // ── Demand Mismatch ──
  {
    id: "ana-opentable",
    company: "OpenTable",
    industry: "Restaurant",
    constraintShape: "demand_mismatch",
    solutionMechanism: "Make demand visible and manageable. Real-time availability lets customers self-select into open slots, smoothing demand.",
    transferInsight: "If demand is lumpy (peaks and valleys), can you make capacity visible in real-time so customers shift to available slots?",
    structuralShift: "Random arrivals → Managed demand distribution",
    outcome: "700M+ diners seated, dramatically reducing restaurant no-shows",
    addressedBindings: ["time", "capacity"],
  },
  {
    id: "ana-uber-surge",
    company: "Uber Surge Pricing",
    industry: "Transportation",
    constraintShape: "demand_mismatch",
    solutionMechanism: "Use dynamic pricing to balance supply and demand in real-time. High demand raises prices, which increases supply and reduces demand simultaneously.",
    transferInsight: "If you have fixed supply and variable demand, can dynamic pricing simultaneously attract more supply and moderate excess demand?",
    structuralShift: "Fixed price → Market-clearing price",
    outcome: "Reduced wait times and increased driver availability during peaks",
    addressedBindings: ["time", "capacity"],
  },

  // ── Information Asymmetry ──
  {
    id: "ana-glassdoor",
    company: "Glassdoor",
    industry: "Employment",
    constraintShape: "information_asymmetry",
    solutionMechanism: "Let the informed side share their knowledge anonymously, creating a public information commons that eliminates the asymmetry.",
    transferInsight: "If one side has information the other doesn't, can you create a platform where the informed side shares anonymously, leveling the playing field?",
    structuralShift: "Information hoarded → Information shared",
    outcome: "55M+ reviews, fundamentally shifted employer-employee power dynamic",
    addressedBindings: ["trust", "knowledge"],
  },

  // ── Coordination Failure ──
  {
    id: "ana-buildzoom",
    company: "BuildZoom",
    industry: "Construction",
    constraintShape: "coordination_failure",
    solutionMechanism: "Create a coordination platform that manages multi-party workflows. Instead of each party coordinating bilaterally, one system orchestrates all parties.",
    transferInsight: "If your industry suffers because multiple parties can't coordinate, can you become the single orchestration layer that manages the entire workflow?",
    structuralShift: "Bilateral coordination → Centralized orchestration",
    outcome: "Reduced construction project delays by coordinating contractors, permits, and inspections",
    addressedBindings: ["time", "knowledge"],
  },

  // ── Fragmented Supply ──
  {
    id: "ana-faire",
    company: "Faire",
    industry: "Wholesale / Retail",
    constraintShape: "fragmented_supply",
    solutionMechanism: "Aggregate thousands of small makers and connect them with retailers through a single platform. Use data to recommend products and offer net-60 terms.",
    transferInsight: "If your market has thousands of small suppliers and buyers can't find them, can you aggregate supply and add intelligence (recommendations, financing) on top?",
    structuralShift: "Buyers hunt for suppliers → Platform curates and recommends",
    outcome: "$12.4B valuation aggregating independent brands",
    addressedBindings: ["trust", "knowledge", "capital"],
  },

  // ── Regulatory Cage ──
  {
    id: "ana-lemonade",
    company: "Lemonade Insurance",
    industry: "Insurance",
    constraintShape: "regulatory_cage",
    solutionMechanism: "Instead of fighting regulation, restructure as a different legal entity (Public Benefit Corp) that turns regulatory requirements into trust signals.",
    transferInsight: "If regulation blocks the obvious approach, can you restructure your entity type or business model to turn compliance into a competitive advantage?",
    structuralShift: "Regulation as constraint → Regulation as trust signal",
    outcome: "$2B+ valuation by making regulation a feature, not a bug",
    addressedBindings: ["regulation", "trust"],
  },
];

// ═══════════════════════════════════════════════════════════════
//  CONSTRAINT SHAPE EXTRACTION
// ═══════════════════════════════════════════════════════════════

/** Keywords that signal each bottleneck type */
const BOTTLENECK_SIGNALS: Record<BottleneckType, RegExp> = {
  human_capacity: /labor|staff|hiring|employee|skill|expert|specialist|worker|talent|bandwidth|capacity|hands|personnel|artisan|craftsman|technician/i,
  asset_utilization: /asset|equipment|facility|fleet|inventory|idle|utiliz|depreciat|machine|vehicle|warehouse|space|real.?estate/i,
  knowledge_lock: /expertise|knowledge|training|certif|speciali|experienced|learning.?curve|institutional|know.?how|tribal/i,
  geographic_tether: /local|location|physical|on.?site|in.?person|brick.?and.?mortar|geographic|radius|commut|travel|regional/i,
  trust_deficit: /trust|reputat|quality|verify|credib|review|transparen|credential|certif|accredit|fraud|scam/i,
  margin_squeeze: /margin|cost|price.?pressure|commod|race.?to.?bottom|discount|undercutt|price.?war|thin.?margin|squeeze/i,
  demand_mismatch: /seasonal|peak|off.?peak|capacity|utiliz|idle|demand.?fluctuat|cyclical|lumpy|feast.?or.?famine|schedule/i,
  regulatory_cage: /regulat|complian|licens|permit|certif|legal|government|policy|restrict|mandate|zoning|FDA|HIPAA/i,
  switching_moat: /lock.?in|switch|migrat|legacy|vendor|contract|proprietary|integration|embedded|depend/i,
  information_asymmetry: /opaque|hidden|asymmetr|insider|unknown|unclear|confus|complex|mystif|mislead/i,
  coordination_failure: /coordinat|fragment|silo|misalign|multi.?party|stakeholder|consensus|synchroniz|handoff|workflow/i,
  fragmented_supply: /fragment|scatter|many.?small|independent|cottage|dispersed|niche|mom.?and.?pop|local.?only|long.?tail/i,
};

/**
 * Extract constraint shapes from strategic insights (constraints).
 */
export function extractConstraintShapes(
  constraints: StrategicInsight[],
  evidence: Evidence[]
): ConstraintShape[] {
  const shapes: ConstraintShape[] = [];

  for (const constraint of constraints) {
    const text = `${constraint.label} ${constraint.description}`.toLowerCase();

    // Find the primary bottleneck type
    let bestType: BottleneckType = "human_capacity";
    let bestScore = 0;

    for (const [type, pattern] of Object.entries(BOTTLENECK_SIGNALS)) {
      const matches = text.match(pattern);
      const score = matches ? matches.length : 0;
      if (score > bestScore) {
        bestScore = score;
        bestType = type as BottleneckType;
      }
    }

    // Determine binding mechanism
    const bindingMechanism = inferBindingMechanism(text);

    // Determine scaling behavior
    const scalingBehavior = inferScalingBehavior(text, bestType);

    // Extract scarce resource
    const scarceResource = inferScarceResource(text, bestType);

    shapes.push({
      id: `shape-${constraint.id}`,
      bottleneckType: bestType,
      scarceResource,
      scalingBehavior,
      bindingMechanism,
      sourceConstraintLabel: constraint.label,
      sourceConstraintId: constraint.id,
    });
  }

  return shapes;
}

function inferBindingMechanism(text: string): ConstraintShape["bindingMechanism"] {
  if (/time|hour|schedule|slow|delay|wait|lead.?time/i.test(text)) return "time";
  if (/regulat|complian|legal|licens|permit/i.test(text)) return "regulation";
  if (/capital|invest|cost|expensive|afford/i.test(text)) return "capital";
  if (/trust|reputat|credib|verify/i.test(text)) return "trust";
  if (/local|geographic|physical|location/i.test(text)) return "geography";
  if (/know|expert|skill|train/i.test(text)) return "knowledge";
  return "capacity";
}

function inferScalingBehavior(text: string, bottleneck: BottleneckType): ConstraintShape["scalingBehavior"] {
  if (/exponential|compound|accelerat|snowball/i.test(text)) return "exponential";
  if (/plateau|flat|ceiling|cap|limit/i.test(text)) return "plateau";
  if (/binary|either|all.?or.?nothing|threshold/i.test(text)) return "binary";
  // Default based on bottleneck type
  if (bottleneck === "human_capacity" || bottleneck === "margin_squeeze") return "linear";
  if (bottleneck === "regulatory_cage") return "binary";
  return "linear";
}

function inferScarceResource(text: string, bottleneck: BottleneckType): string {
  const RESOURCE_MAP: Record<BottleneckType, string> = {
    human_capacity: "skilled labor time",
    asset_utilization: "physical asset capacity",
    knowledge_lock: "specialized expertise",
    geographic_tether: "physical proximity to customer",
    trust_deficit: "customer confidence",
    margin_squeeze: "operating margin",
    demand_mismatch: "demand-supply timing alignment",
    regulatory_cage: "regulatory permission",
    switching_moat: "customer freedom to switch",
    information_asymmetry: "information transparency",
    coordination_failure: "multi-party alignment",
    fragmented_supply: "supply aggregation",
  };
  return RESOURCE_MAP[bottleneck] || "capacity";
}

// ═══════════════════════════════════════════════════════════════
//  ANALOG MATCHING
// ═══════════════════════════════════════════════════════════════

/**
 * Find cross-industry analogs that solved similar constraint shapes.
 * Returns top matches with transfer narratives.
 */
export function findAnalogs(
  constraintShapes: ConstraintShape[],
  maxPerConstraint: number = 2,
  maxTotal: number = 5
): AnalogMatch[] {
  const allMatches: AnalogMatch[] = [];

  for (const shape of constraintShapes) {
    const candidates: { analog: CrossIndustryAnalog; relevance: number }[] = [];

    for (const analog of ANALOG_LIBRARY) {
      let relevance = 0;

      // Primary match: same bottleneck type (0.6)
      if (analog.constraintShape === shape.bottleneckType) {
        relevance += 0.6;
      }

      // Secondary match: addresses same binding mechanism (0.25)
      if (analog.addressedBindings.includes(shape.bindingMechanism)) {
        relevance += 0.25;
      }

      // Tertiary match: addresses any binding mechanism from the shape (0.15)
      const anyBindingMatch = analog.addressedBindings.some(b =>
        b === shape.bindingMechanism
      );
      if (anyBindingMatch && relevance < 0.85) {
        relevance += 0.15;
      }

      if (relevance >= 0.5) {
        candidates.push({ analog, relevance });
      }
    }

    // Sort by relevance, take top N
    candidates.sort((a, b) => b.relevance - a.relevance);
    const topMatches = candidates.slice(0, maxPerConstraint);

    for (const { analog, relevance } of topMatches) {
      allMatches.push({
        analog,
        relevance,
        targetConstraint: shape,
        transferNarrative: buildTransferNarrative(analog, shape),
      });
    }
  }

  // Deduplicate by analog id, keeping highest relevance
  const seen = new Map<string, AnalogMatch>();
  for (const match of allMatches) {
    const existing = seen.get(match.analog.id);
    if (!existing || match.relevance > existing.relevance) {
      seen.set(match.analog.id, match);
    }
  }

  // Sort by relevance, return top N
  return [...seen.values()]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxTotal);
}

/**
 * Build a narrative explaining how the analog's solution transfers.
 */
function buildTransferNarrative(
  analog: CrossIndustryAnalog,
  shape: ConstraintShape
): string {
  return (
    `Your \"${shape.sourceConstraintLabel}\" constraint has the same structural shape as what ${analog.company} faced in ${analog.industry}. ` +
    `They solved it by: ${analog.solutionMechanism} ` +
    `The transferable insight: ${analog.transferInsight}`
  );
}

/**
 * Format analog matches for injection into AI prompts.
 */
export function formatAnalogsForPrompt(matches: AnalogMatch[]): string {
  if (matches.length === 0) return "";

  const lines = matches.map((m, i) => {
    return (
      `${i + 1}. ANALOG: ${m.analog.company} (${m.analog.industry})\n` +
      `   YOUR CONSTRAINT: \"${m.targetConstraint.sourceConstraintLabel}\"\n` +
      `   THEIR CONSTRAINT: Same \"${m.targetConstraint.bottleneckType.replace(/_/g, " ")}\" shape\n` +
      `   HOW THEY SOLVED IT: ${m.analog.solutionMechanism}\n` +
      `   STRUCTURAL SHIFT: ${m.analog.structuralShift}\n` +
      `   TRANSFERABLE INSIGHT: ${m.analog.transferInsight}\n` +
      `   OUTCOME: ${m.analog.outcome}`
    );
  });

  return `CROSS-INDUSTRY ANALOGS (use these as inspiration for surprising alternatives):\n${lines.join("\n\n")}`;
}
