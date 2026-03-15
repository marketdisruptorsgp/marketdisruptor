/**
 * TRIZ Engine — Contradiction-based invention seed generator
 * Zero AI calls. Zero async. Pure static lookup.
 *
 * Based on Altshuller's 40 Inventive Principles derived from 400,000 patent
 * analyses. Maps detected business constraint patterns to historically-proven
 * innovation archetypes.
 */

export interface TrizSeed {
  principleId: number;       // 1-40 (Altshuller's original numbering)
  principleName: string;     // e.g. "Segmentation"
  contradictionType: string; // e.g. "labor vs scale"
  applicationHint: string;   // How this principle applies to THIS business
  historicExample: string;   // Real product/company that used this principle
  inventiveScore: number;    // 1-10 — how transformative this principle tends to be
}

// ─── 40 Inventive Principles (Altshuller) ────────────────────────────────────
const PRINCIPLES: Record<number, { name: string; description: string; inventiveScore: number; historicExample: string }> = {
  1:  { name: "Segmentation",         description: "Divide an object or system into independent parts",                                inventiveScore: 8, historicExample: "Uber splitting taxi rides into independent trip segments" },
  2:  { name: "Taking Out",           description: "Separate an interfering part or property from an object",                         inventiveScore: 7, historicExample: "Airbnb extracting the lodging asset from hotel ownership" },
  3:  { name: "Local Quality",        description: "Transition from homogeneous to heterogeneous structure or function",               inventiveScore: 6, historicExample: "Netflix personalised homepages — different UI per user segment" },
  4:  { name: "Asymmetry",            description: "Change the shape or properties of an object from symmetrical to asymmetrical",    inventiveScore: 6, historicExample: "Apple premium pricing asymmetry vs. commodity Android market" },
  5:  { name: "Merging",              description: "Bring closer in space, assemble identical or similar objects/operations",         inventiveScore: 7, historicExample: "Stripe merging payments + fraud + invoicing in one API" },
  6:  { name: "Universality",         description: "Make a part or object perform multiple functions",                                inventiveScore: 8, historicExample: "iPhone replacing camera, GPS, wallet, and phone in one device" },
  7:  { name: "Nesting",              description: "Place one object inside another; pass each object through a cavity in the other", inventiveScore: 6, historicExample: "Dropbox nesting cloud sync inside the OS file explorer" },
  8:  { name: "Anti-Weight",          description: "Compensate for the weight of an object by merging with another providing lift",   inventiveScore: 5, historicExample: "Robinhood zero-commission trading subsidised by payment for order flow" },
  9:  { name: "Preliminary Action",   description: "Carry out the required change of an object completely or partially in advance",   inventiveScore: 7, historicExample: "Amazon pre-positioning inventory in fulfilment centres near buyers" },
  10: { name: "Preliminary Anti-Action", description: "Prepare emergency means to compensate for the harmful effects in advance",    inventiveScore: 6, historicExample: "Cloudflare DDoS protection applied before attacks hit origin servers" },
  11: { name: "Beforehand Cushioning", description: "Compensate for the relatively low reliability of an object using emergency means", inventiveScore: 5, historicExample: "Stripe automatic retry logic cushioning payment failures" },
  12: { name: "Equipotentiality",     description: "Change the operating condition to eliminate the need to raise or lower objects",  inventiveScore: 5, historicExample: "DocuSign eliminating the trip to sign documents in person" },
  13: { name: "The Other Way Round",  description: "Invert the action used to solve the problem",                                    inventiveScore: 8, historicExample: "Costco charging members to access discounts — customer pays to shop" },
  14: { name: "Spheroidality",        description: "Move from linear to rotational motion; use rollers, balls, or spirals",          inventiveScore: 5, historicExample: "LinkedIn flywheel — recruiters attract talent attract more recruiters" },
  15: { name: "Dynamics",             description: "Allow characteristics to change to find optimal operating conditions",            inventiveScore: 7, historicExample: "Surge pricing dynamically matching supply and demand in real time" },
  16: { name: "Partial or Excessive Action", description: "If 100% is hard to achieve, try slightly more or slightly less",          inventiveScore: 7, historicExample: "Freemium — give away slightly less than full value to drive upgrades" },
  17: { name: "Another Dimension",    description: "Move an object into a two- or three-dimensional space",                          inventiveScore: 6, historicExample: "Calendly turning scheduling from phone tag to async self-service" },
  18: { name: "Mechanical Vibration", description: "Cause an object to oscillate or vibrate",                                        inventiveScore: 4, historicExample: "Drip email campaigns pulsing value delivery over time" },
  19: { name: "Periodic Action",      description: "Replace a continuous action with a periodic or pulsed one",                      inventiveScore: 5, historicExample: "SaaS subscription replacing perpetual licence with monthly billing" },
  20: { name: "Continuity of Useful Action", description: "Carry on work continuously — eliminate idle or intermittent motion",      inventiveScore: 6, historicExample: "Shopify running store 24/7 with no staff via fully automated checkout" },
  21: { name: "Skipping",             description: "Conduct a process or certain stages at high speed",                              inventiveScore: 6, historicExample: "Stripe instant onboarding bypassing traditional KYC paperwork" },
  22: { name: "Blessing in Disguise", description: "Use harmful factors to obtain positive effects",                                 inventiveScore: 8, historicExample: "Lemonade using rejected claims data to improve underwriting accuracy" },
  23: { name: "Feedback",             description: "Introduce feedback to improve a process or action",                              inventiveScore: 7, historicExample: "Duolingo real-time correctness feedback making every lesson self-improving" },
  24: { name: "Intermediary",         description: "Use an intermediate object to transfer or carry out action",                     inventiveScore: 6, historicExample: "Stripe acting as intermediary so merchants never touch raw card data" },
  25: { name: "Self-Service",         description: "Make an object serve itself by performing auxiliary functions",                   inventiveScore: 9, historicExample: "ATMs replacing bank tellers for standard transactions" },
  26: { name: "Copying",              description: "Use simple, inexpensive copies instead of expensive originals",                  inventiveScore: 7, historicExample: "Canva democratising graphic design by copying designer templates" },
  27: { name: "Cheap Short-Living",   description: "Replace expensive durable objects with cheap short-lived ones",                  inventiveScore: 8, historicExample: "AWS spot instances — disposable cheap compute replacing reserved capacity" },
  28: { name: "Mechanics Substitution", description: "Replace a mechanical system with optical, acoustic, or olfactory fields",      inventiveScore: 6, historicExample: "Zoom replacing physical conference rooms with optical video fields" },
  29: { name: "Pneumatics and Hydraulics", description: "Use gas or liquid parts of an object instead of solid parts",              inventiveScore: 4, historicExample: "Digital goods eliminating physical inventory and logistics costs" },
  30: { name: "Flexible Shells",      description: "Use flexible shells and thin films instead of 3D structures",                    inventiveScore: 5, historicExample: "SaaS replacing on-premise monolith with elastic cloud infrastructure" },
  31: { name: "Porous Materials",     description: "Make an object porous or use supplementary porous elements",                    inventiveScore: 5, historicExample: "API-first architecture opening the platform to third-party integrations" },
  32: { name: "Color Changes",        description: "Change the color of an object or its environment",                               inventiveScore: 4, historicExample: "Real-time dashboards making hidden operational data instantly visible" },
  33: { name: "Homogeneity",          description: "Make objects interact with the given object of the same material",               inventiveScore: 5, historicExample: "App stores aligning developer incentives with platform growth" },
  34: { name: "Discarding and Recovering", description: "Make objects that have fulfilled their functions disappear or restore",    inventiveScore: 6, historicExample: "Serverless functions that spin up and vanish — zero idle cost" },
  35: { name: "Parameter Changes",    description: "Change an object's physical state, concentration, flexibility, or temperature",  inventiveScore: 7, historicExample: "Warby Parker changing eyewear from a luxury purchase to a subscription" },
  36: { name: "Phase Transitions",    description: "Use phenomena occurring during phase transitions",                               inventiveScore: 5, historicExample: "Figma transitioning design from desktop app to browser-native collaboration" },
  37: { name: "Thermal Expansion",    description: "Use thermal expansion or contraction of materials",                              inventiveScore: 4, historicExample: "Network effects expanding value exponentially with each new user added" },
  38: { name: "Strong Oxidants",      description: "Replace common air with oxygen-enriched air or pure oxygen",                    inventiveScore: 5, historicExample: "OpenAI releasing GPT API to supercharge every developer's product" },
  39: { name: "Inert Atmosphere",     description: "Replace normal environment with inert one or carry out process in vacuum",       inventiveScore: 5, historicExample: "Zero-trust security eliminating the assumption that internal networks are safe" },
  40: { name: "Composite Materials",  description: "Transition from homogeneous to composite materials",                             inventiveScore: 7, historicExample: "Platform businesses composing marketplace + SaaS + data into a single moat" },
};

// ─── Contradiction Shape Archetypes ──────────────────────────────────────────
type ContradictionShape =
  | "labor_vs_scale"
  | "cost_vs_quality"
  | "speed_vs_accuracy"
  | "access_vs_margin"
  | "customization_vs_efficiency"
  | "trust_vs_transparency"
  | "capital_vs_agility"
  | "fragmentation_vs_control"
  | "dependency_vs_resilience";

const CONTRADICTION_PRINCIPLES: Record<ContradictionShape, { principles: number[]; description: string; label: string }> = {
  labor_vs_scale: {
    label: "labor vs scale",
    description: "Service delivery is bottlenecked by human labor",
    principles: [25, 1, 6, 15, 10],
  },
  cost_vs_quality: {
    label: "cost vs quality",
    description: "Cost reduction and quality are in direct tension",
    principles: [27, 26, 16, 35, 3],
  },
  speed_vs_accuracy: {
    label: "speed vs accuracy",
    description: "Faster delivery trades off precision or correctness",
    principles: [9, 21, 23, 16, 10],
  },
  access_vs_margin: {
    label: "access vs margin",
    description: "Broader reach requires lower price, compressing margins",
    principles: [13, 25, 27, 1, 16],
  },
  customization_vs_efficiency: {
    label: "customization vs efficiency",
    description: "Bespoke work kills repeatability and scale",
    principles: [3, 1, 6, 35, 26],
  },
  trust_vs_transparency: {
    label: "trust vs transparency",
    description: "Full transparency undermines competitive position",
    principles: [22, 23, 24, 13, 2],
  },
  capital_vs_agility: {
    label: "capital vs agility",
    description: "Heavy assets create stability but kill pivoting",
    principles: [27, 34, 15, 2, 30],
  },
  fragmentation_vs_control: {
    label: "fragmentation vs control",
    description: "Distributed supply/demand is hard to coordinate",
    principles: [5, 40, 1, 14, 33],
  },
  dependency_vs_resilience: {
    label: "dependency vs resilience",
    description: "Single-source risk vs. consolidation savings",
    principles: [1, 5, 10, 22, 34],
  },
};

// ─── Keyword Detection ────────────────────────────────────────────────────────
const CONTRADICTION_SIGNALS: Array<{ shape: ContradictionShape; keywords: string[] }> = [
  {
    shape: "labor_vs_scale",
    keywords: ["labor", "headcount", "hiring", "scales linearly", "per job", "manual", "technician",
               "truck roll", "revenue scales", "human time", "proportional hiring", "service delivery",
               "on-site", "in-person", "staff", "employee", "workforce"],
  },
  {
    shape: "cost_vs_quality",
    keywords: ["margin", "cost structure", "compressed", "deflationary", "price erosion", "low margin",
               "commodit", "race to bottom", "price pressure", "undercutting", "discount", "cheaper"],
  },
  {
    shape: "speed_vs_accuracy",
    keywords: ["accuracy", "precision", "error rate", "quality control", "compliance", "audit",
               "verification", "validation", "manual review", "approval", "turnaround"],
  },
  {
    shape: "access_vs_margin",
    keywords: ["price point", "affordability", "broad market", "mass market", "low price", "budget",
               "freemium", "free tier", "lower price", "volume", "commoditised"],
  },
  {
    shape: "customization_vs_efficiency",
    keywords: ["bespoke", "custom", "one-off", "project-based", "scope creep", "tailored", "unique",
               "per-client", "handcrafted", "artisan", "specialist"],
  },
  {
    shape: "trust_vs_transparency",
    keywords: ["trust", "transparency", "information asymmetry", "proprietary", "trade secret",
               "reputation", "credential", "certification", "brand", "perceived value"],
  },
  {
    shape: "capital_vs_agility",
    keywords: ["capital intensive", "fixed asset", "inventory", "warehouse", "equipment", "real estate",
               "fleet", "infrastructure", "capex", "balance sheet", "heavy asset"],
  },
  {
    shape: "fragmentation_vs_control",
    keywords: ["fragmented", "distributed", "aggregation", "marketplace", "coordination", "multiple supplier",
               "multiple vendor", "supply base", "network", "platform", "two-sided"],
  },
  {
    shape: "dependency_vs_resilience",
    keywords: ["single source", "single supplier", "dependency", "vendor lock", "concentration",
               "sole supplier", "bottleneck supplier", "key person", "key dependency"],
  },
];

// ─── Application Hint Templates ───────────────────────────────────────────────
const APPLICATION_HINTS: Record<number, (entityName: string, constraintText: string) => string> = {
  1:  (e, c) => `Break ${e}'s delivery into independent modular units — each solvable without rebuilding the full system. Constraint: "${shorten(c)}"`,
  2:  (e, c) => `Separate the high-value core of ${e} from the constraint-generating periphery. Extract "${shorten(c)}" into an isolated subsystem that doesn't block scale.`,
  3:  (e, _) => `Differentiate ${e}'s offering by segment rather than serving all customers with identical service — premium, standard, and self-serve tiers break the one-size constraint.`,
  4:  (e, _) => `${e} can break symmetry by serving an underserved flank competitors ignore — asymmetric positioning escapes direct price/margin pressure.`,
  5:  (e, c) => `Merge the constraint-generating activity at ${e} with a complementary service — bundling "${shorten(c)}" with a higher-margin offering reframes the economics.`,
  6:  (e, _) => `Make a single ${e} asset perform multiple functions — multipurpose infrastructure amortises fixed costs across more value delivery.`,
  7:  (e, _) => `Nest the constraint inside a higher-value container at ${e} — make the bottleneck a feature, not a bug, by embedding it inside a premium tier.`,
  8:  (e, c) => `Counter "${shorten(c)}" by finding a complementary revenue stream that subsidises the constrained activity — offset the weight.`,
  9:  (e, _) => `Pre-stage the high-cost or slow parts of ${e}'s process in advance — front-load work to make delivery feel instant.`,
  10: (e, c) => `Build cushioning mechanisms into ${e} so that "${shorten(c)}" becomes a manageable exception rather than a catastrophic failure mode.`,
  13: (e, _) => `Invert ${e}'s model — instead of the business bearing the constraint cost, redesign so the customer or market absorbs it willingly.`,
  14: (e, _) => `Create a flywheel at ${e} — each iteration makes the next one cheaper or faster, compounding away the current constraint over time.`,
  15: (e, c) => `Make ${e}'s capacity dynamic rather than fixed — variable pricing, flexible staffing, or elastic infrastructure can absorb "${shorten(c)}".`,
  16: (e, _) => `${e} doesn't need 100% of the constrained resource — a partial solution (freemium, beta, MVP tier) unlocks revenue while the constraint is resolved.`,
  22: (e, c) => `The constraint "${shorten(c)}" at ${e} could become a competitive advantage — lean into it transparently as a quality signal rather than hiding it.`,
  23: (e, _) => `Add real-time feedback loops to ${e}'s core process — every iteration becomes a data point that reduces the constraint's impact over time.`,
  24: (e, c) => `Introduce an intermediary layer at ${e} that absorbs "${shorten(c)}" — a platform, marketplace, or broker that decouples supply from demand.`,
  25: (e, _) => `Redesign ${e} so customers perform the auxiliary work — self-service eliminates the human bottleneck and scales without hiring.`,
  26: (e, c) => `Replace the expensive constrained component at ${e} with a cheaper copy or digital equivalent — "${shorten(c)}" is often a solvable cost problem.`,
  27: (e, _) => `Shift ${e} from durable expensive assets to cheap disposable ones — pay-per-use infrastructure costs nothing when idle.`,
  35: (e, c) => `Change a key parameter of ${e}'s model — pricing model, delivery unit, or contract structure — to dissolve "${shorten(c)}" rather than fight it head-on.`,
  40: (e, _) => `${e} can build a composite moat by combining multiple weaker positions — each layer reinforces the others, making the constraint irrelevant at scale.`,
};

// ─── Detection Constants ──────────────────────────────────────────────────────
const MAX_TRIZ_SEEDS = 3;
const MIN_KEYWORD_MATCHES = 1;
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// ─── Core Detection Logic ─────────────────────────────────────────────────────
function detectContradictionShape(
  constraintText: string,
  reasoning: string,
): ContradictionShape | null {
  const haystack = `${constraintText} ${reasoning}`.toLowerCase();

  let bestShape: ContradictionShape | null = null;
  let bestScore = 0;

  for (const signal of CONTRADICTION_SIGNALS) {
    let score = 0;
    for (const kw of signal.keywords) {
      if (haystack.includes(kw.toLowerCase())) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestShape = signal.shape;
    }
  }

  return bestScore >= MIN_KEYWORD_MATCHES ? bestShape : null;
}

function buildApplicationHint(principleId: number, constraintText: string, entityName: string): string {
  const fn = APPLICATION_HINTS[principleId];
  if (fn) return fn(entityName, constraintText);

  // Generic fallback
  const p = PRINCIPLES[principleId];
  return `${entityName}: apply ${p?.name ?? `Principle #${principleId}`} — ${p?.description ?? "see TRIZ reference"} — to dissolve "${shorten(constraintText)}".`;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Derive 2-3 TRIZ invention seeds from detected constraint patterns.
 *
 * @param constraints  All detected constraints (from computeInstantInsights)
 * @param bindingConstraint  The single highest-severity constraint
 * @param entityName  Business name (e.g. "Acme Plumbing")
 * @returns  2-3 TrizSeed objects, or [] if no contradiction detected
 */
export function deriveTrizSeeds(
  constraints: Array<{ constraint: string; reasoning: string; severity: string }>,
  bindingConstraint: { label: string; reasoning: string } | null,
  entityName: string,
): TrizSeed[] {
  if (constraints.length === 0) return [];

  // Use the binding constraint text as primary signal; fall back to all constraints
  const primaryText = bindingConstraint
    ? `${bindingConstraint.label} ${bindingConstraint.reasoning}`
    : constraints.map(c => `${c.constraint} ${c.reasoning}`).join(" ");

  const primaryConstraint = bindingConstraint
    ? bindingConstraint.label
    : constraints[0].constraint;

  // Try the binding constraint first, then each other constraint
  const textsToTry: string[] = [
    primaryText,
    ...constraints.map(c => `${c.constraint} ${c.reasoning}`),
  ];

  let shape: ContradictionShape | null = null;
  for (const text of textsToTry) {
    shape = detectContradictionShape(text, "");
    if (shape) break;
  }

  if (!shape) return [];

  const cluster = CONTRADICTION_PRINCIPLES[shape];
  // Take top MAX_TRIZ_SEEDS principle IDs; skip any that have no entry in PRINCIPLES
  const principleIds = cluster.principles.filter(id => PRINCIPLES[id]).slice(0, MAX_TRIZ_SEEDS);

  return principleIds.map(id => {
    const p = PRINCIPLES[id];
    return {
      principleId: id,
      principleName: p.name,
      contradictionType: cluster.label,
      applicationHint: buildApplicationHint(id, primaryConstraint, entityName),
      historicExample: p.historicExample,
      inventiveScore: p.inventiveScore,
    };
  });
}
