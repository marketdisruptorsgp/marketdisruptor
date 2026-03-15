/**
 * Disruption Archetype Classifier — Standalone deterministic classifier
 *
 * Reads scraped product data and returns the single most likely disruption
 * archetype the business is vulnerable to. Zero AI calls — pure keyword
 * scoring with word-boundary matching.
 */

export type DisruptionArchetypeId =
  | "platform_encroachment"
  | "zero_marginal_cost_substitute"
  | "regulatory_arbitrage"
  | "disintermediation"
  | "unbundling"
  | "direct_to_consumer"
  | "labor_automation"
  | "data_network_effect"
  | "vertical_integration"
  | "demand_reframing";

export interface DisruptionArchetype {
  id: DisruptionArchetypeId;
  label: string;         // human-readable name e.g. "Platform Encroachment"
  mechanism: string;     // one sentence: how this disruption works
  matchedSignals: string[]; // which keywords/fields triggered this
  score: number;         // 0-1 confidence
}

interface ArchetypeDefinition {
  id: DisruptionArchetypeId;
  label: string;
  mechanism: string;
  triggers: string[];
}

const ARCHETYPES: ArchetypeDefinition[] = [
  {
    id: "platform_encroachment",
    label: "Platform Encroachment",
    mechanism: "A dominant platform (Amazon, Google, Apple) expands into this category and commoditizes the core value proposition.",
    triggers: ["marketplace", "platform", "aggregator", "amazon", "google", "app store", "plugin", "extension", "api", "third-party"],
  },
  {
    id: "zero_marginal_cost_substitute",
    label: "Zero-Marginal-Cost Substitute",
    mechanism: "A digital or AI-powered alternative delivers the same outcome at near-zero cost per unit, collapsing pricing power.",
    triggers: ["software", "digital", "ai", "automated", "free", "open source", "saas", "subscription", "template", "algorithm"],
  },
  {
    id: "regulatory_arbitrage",
    label: "Regulatory Arbitrage",
    mechanism: "A new entrant exploits a regulatory gap or operates in a jurisdiction without the compliance burden incumbents carry.",
    triggers: ["regulated", "license", "compliance", "certification", "fda", "legal", "insurance", "permit", "jurisdiction", "offshore"],
  },
  {
    id: "disintermediation",
    label: "Disintermediation",
    mechanism: "Buyers and sellers connect directly, cutting out the middleman and the margin they captured.",
    triggers: ["broker", "agent", "middleman", "distributor", "wholesale", "reseller", "intermediary", "commission", "markup", "channel"],
  },
  {
    id: "unbundling",
    label: "Unbundling",
    mechanism: "A competitor strips out the single most-used feature and offers it cheaper and simpler, pulling customers away from the full bundle.",
    triggers: ["bundle", "suite", "all-in-one", "full service", "package", "comprehensive", "integrated", "end-to-end", "one-stop", "complete"],
  },
  {
    id: "direct_to_consumer",
    label: "Direct-to-Consumer Bypass",
    mechanism: "A manufacturer or creator bypasses the current distribution layer and sells directly, eliminating channel margin.",
    triggers: ["retail", "wholesale", "distributor", "store", "shop", "reseller", "stockist", "outlet", "dealership", "franchise"],
  },
  {
    id: "labor_automation",
    label: "Labor Automation",
    mechanism: "Robotics, AI, or software automates the skilled labor this business model depends on, structurally collapsing cost.",
    triggers: ["labor", "manual", "technician", "skilled", "worker", "staff", "headcount", "human", "operator", "crew"],
  },
  {
    id: "data_network_effect",
    label: "Data Network Effect",
    mechanism: "A competitor accumulates proprietary data at scale, making their product improve faster than incumbents can match.",
    triggers: ["data", "network effect", "users", "scale", "proprietary", "training", "feedback loop", "personalization", "recommendation", "analytics"],
  },
  {
    id: "vertical_integration",
    label: "Vertical Integration",
    mechanism: "A supplier or customer integrates into this layer of the value chain, capturing the margin and removing the need for this business.",
    triggers: ["supplier", "manufacturer", "upstream", "downstream", "value chain", "vertical", "in-house", "own", "acquire", "integrate"],
  },
  {
    id: "demand_reframing",
    label: "Demand Reframing",
    mechanism: "A competitor redefines what the customer is actually buying, making the current category definition obsolete.",
    triggers: ["outcome", "result", "guarantee", "pay per", "performance", "subscription", "access", "membership", "as a service", "model"],
  },
];

const MIN_MATCHES = 2;
const MIN_SCORE = 0.15;

/**
 * Build a text corpus from all available product fields.
 * Returns { directCorpus, narrativeCorpus } — direct fields get full weight,
 * narrative/description fields get 0.6 weight.
 */
function buildCorpus(product: any): { direct: string; narrative: string } {
  const direct = [
    product.name || "",
    product.category || "",
  ].join(" ").toLowerCase();

  const narrative = [
    product.description || "",
    product.competitorAnalysis ? JSON.stringify(product.competitorAnalysis) : "",
    product.communityInsights ? JSON.stringify(product.communityInsights) : "",
    product.pricingIntel ? JSON.stringify(product.pricingIntel) : "",
  ].join(" ").toLowerCase();

  return { direct, narrative };
}

/**
 * Count how many times a keyword appears in text using word-boundary matching.
 * Multi-word phrases use a simple includes() check since \b doesn't work well
 * for phrases containing spaces.
 */
function matchKeyword(keyword: string, text: string): boolean {
  if (keyword.includes(" ")) {
    return text.includes(keyword);
  }
  const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  return pattern.test(text);
}

/**
 * Score a single archetype against the corpus.
 * Returns { weightedScore, matchedSignals }.
 */
function scoreArchetype(
  archetype: ArchetypeDefinition,
  direct: string,
  narrative: string,
): { weightedScore: number; matchedSignals: string[] } {
  const matchedSignals: string[] = [];
  let weightedScore = 0;

  for (const trigger of archetype.triggers) {
    const inDirect = matchKeyword(trigger, direct);
    const inNarrative = matchKeyword(trigger, narrative);

    if (inDirect) {
      weightedScore += 1.0;
      matchedSignals.push(trigger);
    } else if (inNarrative) {
      weightedScore += 0.6;
      matchedSignals.push(trigger);
    }
  }

  return { weightedScore, matchedSignals };
}

/**
 * Classify the single most likely disruption archetype a business is
 * vulnerable to. Returns null if product data is sparse or no archetype
 * reaches the confidence threshold.
 */
export function classifyDisruptionArchetype(product: any): DisruptionArchetype | null {
  try {
    if (!product) return null;

    const { direct, narrative } = buildCorpus(product);

    let bestArchetype: DisruptionArchetype | null = null;
    let bestScore = 0;

    for (const archetype of ARCHETYPES) {
      const { weightedScore, matchedSignals } = scoreArchetype(archetype, direct, narrative);

      if (matchedSignals.length < MIN_MATCHES) continue;

      const normalizedScore = weightedScore / archetype.triggers.length;

      if (normalizedScore > bestScore) {
        bestScore = normalizedScore;
        bestArchetype = {
          id: archetype.id,
          label: archetype.label,
          mechanism: archetype.mechanism,
          matchedSignals,
          score: Math.round(normalizedScore * 100) / 100,
        };
      }
    }

    if (!bestArchetype || bestScore < MIN_SCORE) return null;

    return bestArchetype;
  } catch {
    return null;
  }
}
