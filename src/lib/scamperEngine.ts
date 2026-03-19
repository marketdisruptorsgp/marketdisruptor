/**
 * SCAMPER Engine — Systematic mutation of business elements
 *
 * Applies all 7 SCAMPER operators (Osborn 1953 / Eberle 1971) to every core
 * business element extracted from analysis data. Each application produces an
 * explicit ACCEPT or REJECT verdict with reasoning — surfaced to the user for
 * transparency.
 *
 * Operators:
 *   S — Substitute   Replace a component, material, process, or rule
 *   C — Combine      Merge with another element or offering
 *   A — Adapt        Borrow and adjust from an adjacent domain
 *   M — Modify/Magnify/Minimize  Change scale, intensity, or attribute
 *   P — Put to other uses  Repurpose for a different segment or context
 *   E — Eliminate    Remove entirely; simplify to irreducible core
 *   R — Reverse/Rearrange  Invert roles, reorder sequence, flip assumptions
 */

export type ScamperOperator = "S" | "C" | "A" | "M" | "P" | "E" | "R";

export const SCAMPER_OPERATOR_NAMES: Record<ScamperOperator, string> = {
  S: "Substitute",
  C: "Combine",
  A: "Adapt",
  M: "Modify / Magnify / Minimize",
  P: "Put to Other Uses",
  E: "Eliminate",
  R: "Reverse / Rearrange",
};

export const SCAMPER_OPERATOR_QUESTIONS: Record<ScamperOperator, string[]> = {
  S: [
    "What component, material, person, or process could be replaced with something else?",
    "What would happen if you substituted the pricing model entirely?",
    "Which supplier, channel, or technology dependency could be swapped?",
  ],
  C: [
    "What could be merged with this to create a combined offering?",
    "What if two currently separate steps were unified into one?",
    "What complementary business or category could be bundled with this?",
  ],
  A: [
    "What has worked brilliantly in an adjacent industry that could be applied here?",
    "Which constraints has another domain already solved?",
    "What process from a different sector could be adapted to remove a friction point?",
  ],
  M: [
    "What if you made this 10× bigger (reach, price, speed, scope)?",
    "What if you stripped it down to the minimum viable element?",
    "Which quality, frequency, or intensity could be amplified or reduced?",
  ],
  P: [
    "Could this product/service solve a completely different job for a different segment?",
    "What waste or by-product could be repurposed as a value stream?",
    "Is there a secondary use case that generates higher margin?",
  ],
  E: [
    "What step, cost, or component could be entirely removed without losing core value?",
    "Which feature is used by < 10% of customers but costs 30%+ to maintain?",
    "What friction-generating middleman or process could be eliminated?",
  ],
  R: [
    "What if the customer became the producer? What if steps were reordered?",
    "What if the core constraint became the core feature (inversion)?",
    "What if the business operated in reverse — outcome first, then delivery?",
  ],
};

// ─── Business Element Types ───────────────────────────────────────────────────

export type BusinessElementType =
  | "pricing_model"
  | "delivery_mechanism"
  | "distribution_channel"
  | "core_offering"
  | "customer_acquisition"
  | "operational_process"
  | "technology_stack"
  | "revenue_model";

export interface BusinessElement {
  id: string;
  type: BusinessElementType;
  label: string;
  description: string;
  /** Evidence IDs supporting this element's existence/importance */
  evidenceIds: string[];
}

// ─── SCAMPER Application ──────────────────────────────────────────────────────

export type ScamperVerdict = "accept" | "reject" | "conditional";

export interface ScamperApplication {
  id: string;
  operator: ScamperOperator;
  operatorName: string;
  /** The business element this operator was applied to */
  element: BusinessElement;
  /** The generated mutation idea */
  mutationIdea: string;
  /** The key question from SCAMPER that prompted this idea */
  triggerQuestion: string;
  verdict: ScamperVerdict;
  /** Why accepted, rejected, or conditional — always surfaced to the user */
  verdictReasoning: string;
  /** If accepted/conditional: what is the highest-leverage move? */
  leverageHint: string | null;
  /** Estimated disruptive potential 1-10 */
  disruptionScore: number;
}

export interface ScamperResult {
  /** All applications across all elements × operators */
  applications: ScamperApplication[];
  /** Only accepted/conditional applications */
  accepted: ScamperApplication[];
  /** Only rejected applications — surfaced for transparency */
  rejected: ScamperApplication[];
  /** Summary: elements covered, operators applied, acceptance rate */
  summary: {
    elementCount: number;
    operatorsApplied: number;
    totalApplications: number;
    acceptedCount: number;
    rejectedCount: number;
    conditionalCount: number;
    acceptanceRate: number;
  };
}

// ─── Element Extraction ───────────────────────────────────────────────────────

/**
 * Extract core business elements from scraped product data.
 * These become the input to the SCAMPER mutation matrix.
 */
export function extractBusinessElements(product: any): BusinessElement[] {
  const elements: BusinessElement[] = [];
  let idSeq = 0;
  const nextId = () => `be-${++idSeq}`;

  const name = product?.name || "the business";
  const category = (product?.category || "").toLowerCase();
  const desc = (product?.description || "").toLowerCase();

  // Core offering — always present
  elements.push({
    id: nextId(),
    type: "core_offering",
    label: `Core value delivery at ${name}`,
    description: product?.description || `${name} delivers value through its primary product or service`,
    evidenceIds: [],
  });

  // Pricing model
  if (product?.pricingIntel) {
    const pi = product.pricingIntel;
    const pricingLabel = pi.priceDirection === "declining"
      ? "Declining price-point model"
      : pi.currentMarketPrice
        ? `Per-unit pricing at ~${pi.currentMarketPrice}`
        : "Existing pricing structure";

    elements.push({
      id: nextId(),
      type: "pricing_model",
      label: pricingLabel,
      description: `Current monetization approach — ${JSON.stringify(pi).slice(0, 120)}`,
      evidenceIds: [],
    });
  }

  // Distribution channel
  if (product?.competitorAnalysis?.distributionChannels?.length > 0 || /distribut|channel|retail|online|direct/.test(desc)) {
    elements.push({
      id: nextId(),
      type: "distribution_channel",
      label: `Distribution channel for ${name}`,
      description: `How ${name} reaches customers — direct, indirect, digital, or physical`,
      evidenceIds: [],
    });
  }

  // Delivery mechanism (service-specific)
  const isService = /service|repair|consult|install|clean|maintain|deliver/.test(desc) ||
    /home services|professional services|healthcare|education/.test(category);
  if (isService) {
    elements.push({
      id: nextId(),
      type: "delivery_mechanism",
      label: `Service delivery mechanism at ${name}`,
      description: "In-person, on-site, or field-based delivery of core service — labor-bound scaling",
      evidenceIds: [],
    });
  }

  // Technology stack
  if (product?.technologyLeverage || /tech|software|platform|digital|ai|saas/.test(desc)) {
    elements.push({
      id: nextId(),
      type: "technology_stack",
      label: `Technology infrastructure at ${name}`,
      description: "Current technology foundation — tools, platforms, automation level",
      evidenceIds: [],
    });
  }

  // Customer acquisition
  elements.push({
    id: nextId(),
    type: "customer_acquisition",
    label: `Customer acquisition model at ${name}`,
    description: "How customers discover, evaluate, and commit to the offering",
    evidenceIds: [],
  });

  // Operational process
  if (product?.userWorkflow || product?.supplyChain) {
    elements.push({
      id: nextId(),
      type: "operational_process",
      label: `Core operational process at ${name}`,
      description: "Primary workflow — intake, fulfillment, and delivery sequence",
      evidenceIds: [],
    });
  }

  // Revenue model (distinct from pricing if evidence suggests recurring vs. one-time)
  if (product?.pricingIntel?.margins || product?.pricingIntel?.revenueModel) {
    elements.push({
      id: nextId(),
      type: "revenue_model",
      label: `Revenue capture model at ${name}`,
      description: "How value created is converted into sustainable revenue",
      evidenceIds: [],
    });
  }

  return elements;
}

// ─── Mutation Templates ───────────────────────────────────────────────────────

interface MutationTemplate {
  operator: ScamperOperator;
  elementTypes: BusinessElementType[];
  generateMutation: (element: BusinessElement, product: any) => {
    idea: string;
    question: string;
    verdict: ScamperVerdict;
    verdictReasoning: string;
    leverageHint: string | null;
    score: number;
  };
}

const MUTATION_TEMPLATES: MutationTemplate[] = [
  // ── SUBSTITUTE ──────────────────────────────────────────────────────────────
  {
    operator: "S",
    elementTypes: ["pricing_model", "revenue_model"],
    generateMutation: (el, _product) => ({
      idea: `Replace per-unit/transaction pricing with a subscription or outcome-based model — customers pay for the guaranteed result, not the input`,
      question: SCAMPER_OPERATOR_QUESTIONS.S[0],
      verdict: "accept",
      verdictReasoning: "Subscription and outcome-based pricing consistently unlock 2-4× higher LTV and reduce churn by aligning incentives — high-leverage across most categories",
      leverageHint: "Start with a pilot tier: offer a 90-day outcome guarantee to a small segment and measure conversion uplift",
      score: 8,
    }),
  },
  {
    operator: "S",
    elementTypes: ["delivery_mechanism", "operational_process"],
    generateMutation: (el, product) => ({
      idea: `Substitute in-person delivery with remote, async, or AI-assisted delivery — compress truck-roll costs by 40-60% for diagnostic and routine steps`,
      question: SCAMPER_OPERATOR_QUESTIONS.S[2],
      verdict: "accept",
      verdictReasoning: "Remote delivery at field-service businesses reduces cost per unit 40-60%; already proven at Geek Squad, Lemon Squad, ServiceMax deployments",
      leverageHint: "Remote triage before dispatch: AI-assisted diagnostic step resolves 20-30% of jobs without a site visit",
      score: 9,
    }),
  },
  {
    operator: "S",
    elementTypes: ["distribution_channel", "customer_acquisition"],
    generateMutation: (el, _product) => ({
      idea: `Replace traditional channel intermediaries with direct-to-consumer or embedded distribution (partnerships that put your offer at point of need)`,
      question: SCAMPER_OPERATOR_QUESTIONS.S[2],
      verdict: "conditional",
      verdictReasoning: "DTC works when CAC is recoverable within 3 billing cycles — requires validating LTV before committing to channel switch",
      leverageHint: "Run a 60-day DTC pilot with one customer segment to benchmark CAC vs. channel CAC",
      score: 6,
    }),
  },
  {
    operator: "S",
    elementTypes: ["technology_stack"],
    generateMutation: (el, _product) => ({
      idea: `Replace proprietary or legacy technology with composable API-first tooling — cut technical debt and enable 3rd-party integrations at marginal cost`,
      question: SCAMPER_OPERATOR_QUESTIONS.S[2],
      verdict: "conditional",
      verdictReasoning: "Migration cost is real (6-18 months), but composable architecture unlocks partner distribution and AI tooling that legacy systems cannot access",
      leverageHint: "Identify the single highest-friction legacy component — replace it first as a bounded pilot",
      score: 6,
    }),
  },

  // ── COMBINE ─────────────────────────────────────────────────────────────────
  {
    operator: "C",
    elementTypes: ["core_offering", "pricing_model"],
    generateMutation: (el, _product) => ({
      idea: `Bundle the core offering with a high-margin adjacent service to create a complete solution — increase ACV and reduce churn through switching friction`,
      question: SCAMPER_OPERATOR_QUESTIONS.C[2],
      verdict: "accept",
      verdictReasoning: "Solution bundling increases ACV 30-80% and creates switching costs — proven at ServiceMaster (cleaning + restoration), Salesforce (CRM + platform)",
      leverageHint: "Identify the top 3 services customers frequently seek after purchase — bundle the #1 into a 'Complete' tier",
      score: 7,
    }),
  },
  {
    operator: "C",
    elementTypes: ["delivery_mechanism", "technology_stack"],
    generateMutation: (el, _product) => ({
      idea: `Merge physical delivery with a digital companion layer (app, dashboard, or AI model) — the hybrid creates a data moat competitors cannot replicate`,
      question: SCAMPER_OPERATOR_QUESTIONS.C[1],
      verdict: "accept",
      verdictReasoning: "Physical+digital hybrid creates defensible data assets — HomeAdvisor, Minit-Tune, and ServiceTitan all demonstrate premium pricing from this model",
      leverageHint: "Start with post-service digital touchpoints (reports, reminders, upsell prompts) to instrument usage before building full companion",
      score: 8,
    }),
  },
  {
    operator: "C",
    elementTypes: ["customer_acquisition", "revenue_model"],
    generateMutation: (el, _product) => ({
      idea: `Combine acquisition and monetization into a single flywheel — referral-as-revenue, community-led growth, or usage-based expansion pricing`,
      question: SCAMPER_OPERATOR_QUESTIONS.C[0],
      verdict: "conditional",
      verdictReasoning: "Only viable if NPS > 50 and organic referral rate > 15% — requires strong product-market fit before investing in flywheel mechanics",
      leverageHint: "Measure current NPS and word-of-mouth rate before committing to referral mechanics",
      score: 6,
    }),
  },

  // ── ADAPT ───────────────────────────────────────────────────────────────────
  {
    operator: "A",
    elementTypes: ["pricing_model", "revenue_model"],
    generateMutation: (el, _product) => ({
      idea: `Adapt the insurance industry's 'risk pooling' model — aggregate customers into a membership, pool risk, and charge a flat monthly fee that smooths revenue and locks in retention`,
      question: SCAMPER_OPERATOR_QUESTIONS.A[0],
      verdict: "accept",
      verdictReasoning: "Home warranty (American Home Shield), HVAC memberships (One Hour Air), and auto repair memberships all demonstrate 60-90% retention vs. 20-40% for transactional models",
      leverageHint: "Design the membership with 2-3 included service events per year — ensures perceived value exceeds price",
      score: 8,
    }),
  },
  {
    operator: "A",
    elementTypes: ["delivery_mechanism", "operational_process"],
    generateMutation: (el, _product) => ({
      idea: `Adapt the SaaS 'customer success' model to physical services — assign a dedicated account manager who proactively schedules maintenance and prevents emergencies`,
      question: SCAMPER_OPERATOR_QUESTIONS.A[2],
      verdict: "conditional",
      verdictReasoning: "Works at scale (50+ enterprise accounts) but unit economics break below that — pilot with high-value commercial accounts first",
      leverageHint: "Identify top 20% of customers by LTV and pilot proactive scheduling with them",
      score: 6,
    }),
  },
  {
    operator: "A",
    elementTypes: ["distribution_channel", "customer_acquisition"],
    generateMutation: (el, _product) => ({
      idea: `Adapt the franchise or licensing model from fast food — standardize operations sufficiently to allow a network of owner-operators, removing your geographic scaling constraint`,
      question: SCAMPER_OPERATOR_QUESTIONS.A[0],
      verdict: "conditional",
      verdictReasoning: "Viable only after achieving repeatable unit economics in 3+ markets — requires documented SOPs and training systems before franchising",
      leverageHint: "Document the 10 most critical operational steps before evaluating franchise viability",
      score: 5,
    }),
  },

  // ── MODIFY / MAGNIFY / MINIMIZE ──────────────────────────────────────────────
  {
    operator: "M",
    elementTypes: ["core_offering", "delivery_mechanism"],
    generateMutation: (el, _product) => ({
      idea: `Magnify the premium tier — create a white-glove 'concierge' offering at 3-5× standard price for the top 10% of customers who value certainty over cost`,
      question: SCAMPER_OPERATOR_QUESTIONS.M[0],
      verdict: "accept",
      verdictReasoning: "Premium tiers at professional services firms generate 40-60% of revenue from 10-15% of customers — high-margin, low-volume segment is underserved in most categories",
      leverageHint: "Survey your top 10% of customers: what would you pay for guaranteed same-day response and a dedicated technician?",
      score: 7,
    }),
  },
  {
    operator: "M",
    elementTypes: ["pricing_model", "revenue_model"],
    generateMutation: (el, _product) => ({
      idea: `Minimize the entry barrier — offer a 'free diagnostic' or freemium tier that converts to paid through demonstrated value before purchase commitment`,
      question: SCAMPER_OPERATOR_QUESTIONS.M[1],
      verdict: "accept",
      verdictReasoning: "Free diagnostic or assessment conversions run 40-70% in home services; reduces objection at the door and filters for higher-intent customers",
      leverageHint: "Track conversion rate from free diagnostic to paid service — optimize the 'aha moment' in the diagnostic report",
      score: 8,
    }),
  },
  {
    operator: "M",
    elementTypes: ["operational_process"],
    generateMutation: (el, _product) => ({
      idea: `Minimize manual coordination steps through automated scheduling, intake forms, and pre-visit prep — compress average job time by removing non-value-adding steps`,
      question: SCAMPER_OPERATOR_QUESTIONS.M[2],
      verdict: "accept",
      verdictReasoning: "ServiceTitan, Jobber, and Housecall Pro show 15-25% throughput gains from automation of intake and scheduling alone",
      leverageHint: "Map each step in the current job flow and identify which 3 steps are purely administrative — automate those first",
      score: 7,
    }),
  },

  // ── PUT TO OTHER USES ────────────────────────────────────────────────────────
  {
    operator: "P",
    elementTypes: ["technology_stack", "operational_process"],
    generateMutation: (el, _product) => ({
      idea: `Repurpose the operational data generated by service delivery as a standalone product — inspection reports, maintenance logs, and performance data have value to insurance, resale, and warranty markets`,
      question: SCAMPER_OPERATOR_QUESTIONS.P[1],
      verdict: "conditional",
      verdictReasoning: "Data monetization requires privacy compliance and minimum scale (10K+ data points) before the asset has commercial value — validate segment demand first",
      leverageHint: "Survey property managers and insurers: would you pay for pre-verified equipment condition reports?",
      score: 6,
    }),
  },
  {
    operator: "P",
    elementTypes: ["core_offering", "distribution_channel"],
    generateMutation: (el, _product) => ({
      idea: `Repurpose the existing customer base and trust relationship to sell adjacent categories — cross-sell into categories where trust is the primary barrier to purchase`,
      question: SCAMPER_OPERATOR_QUESTIONS.P[2],
      verdict: "accept",
      verdictReasoning: "Trust-based cross-sell conversion runs 5-15× higher than cold acquisition; home service companies that add adjacent categories see 30-50% ACV uplift",
      leverageHint: "Survey current customers: what other services have you hired someone for in the past 12 months?",
      score: 7,
    }),
  },
  {
    operator: "P",
    elementTypes: ["delivery_mechanism"],
    generateMutation: (el, _product) => ({
      idea: `Repurpose delivery infrastructure for commercial / B2B customers — the same capabilities that serve residential clients can serve property managers, HOAs, or facility managers at 3-5× ticket sizes`,
      question: SCAMPER_OPERATOR_QUESTIONS.P[0],
      verdict: "conditional",
      verdictReasoning: "B2B pivot works when average commercial ticket is ≥3× residential and sales cycle < 60 days — validate before significant resource commitment",
      leverageHint: "Identify 5 commercial accounts in your territory and close one pilot contract before full pivot",
      score: 6,
    }),
  },

  // ── ELIMINATE ────────────────────────────────────────────────────────────────
  {
    operator: "E",
    elementTypes: ["pricing_model", "customer_acquisition"],
    generateMutation: (el, _product) => ({
      idea: `Eliminate the quoting/estimation step entirely — replace with transparent, flat-rate published pricing that lets customers self-serve purchase decisions without waiting for a quote`,
      question: SCAMPER_OPERATOR_QUESTIONS.E[0],
      verdict: "accept",
      verdictReasoning: "LegalZoom (legal), 1-800-GOT-JUNK (removal), and Neighborly (home services) prove transparent flat-rate pricing increases conversion 30-50% by eliminating purchase anxiety",
      leverageHint: "Publish flat rates for your top 5 most common service calls — measure conversion vs. quoted jobs",
      score: 9,
    }),
  },
  {
    operator: "E",
    elementTypes: ["operational_process", "delivery_mechanism"],
    generateMutation: (el, _product) => ({
      idea: `Eliminate the middleman layer in the supply chain — source directly from manufacturers or suppliers and capture the margin currently lost to distributors`,
      question: SCAMPER_OPERATOR_QUESTIONS.E[2],
      verdict: "conditional",
      verdictReasoning: "Direct sourcing requires minimum volume commitments (often $250K+ annually) — only viable after achieving predictable demand",
      leverageHint: "Calculate your annual spend with the top 3 distributors — if total > $200K, direct sourcing negotiation is viable",
      score: 5,
    }),
  },
  {
    operator: "E",
    elementTypes: ["technology_stack"],
    generateMutation: (el, _product) => ({
      idea: `Eliminate the highest-friction feature(s) that cost disproportionately to maintain but serve < 10% of customers — reallocate engineering/ops resources to the 90% use case`,
      question: SCAMPER_OPERATOR_QUESTIONS.E[1],
      verdict: "reject",
      verdictReasoning: "Without usage analytics, cannot responsibly identify low-use features — requires instrumentation first before elimination decisions",
      leverageHint: "Instrument feature usage before elimination to avoid removing hidden critical paths",
      score: 3,
    }),
  },

  // ── REVERSE / REARRANGE ──────────────────────────────────────────────────────
  {
    operator: "R",
    elementTypes: ["delivery_mechanism", "core_offering"],
    generateMutation: (el, _product) => ({
      idea: `Reverse the delivery model — instead of customers coming to you (or you going to them on demand), operate on a scheduled/preventive basis that puts your team in front of problems before they become emergencies`,
      question: SCAMPER_OPERATOR_QUESTIONS.R[0],
      verdict: "accept",
      verdictReasoning: "Preventive/scheduled maintenance programs generate predictable revenue and 60-80% higher LTV vs. reactive emergency calls — already proven at HVAC, plumbing, and auto service categories",
      leverageHint: "Calculate the value of converting 20% of current reactive customers to annual maintenance plans",
      score: 9,
    }),
  },
  {
    operator: "R",
    elementTypes: ["pricing_model", "revenue_model"],
    generateMutation: (el, _product) => ({
      idea: `Reverse the payment timing — charge a retainer or membership fee upfront before service delivery rather than invoicing after completion`,
      question: SCAMPER_OPERATOR_QUESTIONS.R[1],
      verdict: "accept",
      verdictReasoning: "Upfront retainer models eliminate receivables risk, improve cash flow by 45-60 days, and filter for higher-intent customers who are 2-3× less likely to churn",
      leverageHint: "Pilot with your top 20 accounts — offer a 5% discount for annual prepayment and measure uptake",
      score: 7,
    }),
  },
  {
    operator: "R",
    elementTypes: ["customer_acquisition", "distribution_channel"],
    generateMutation: (el, _product) => ({
      idea: `Rearrange the customer journey — lead with education/diagnosis (free value) rather than the sales pitch — pull customers into conversion through demonstrated expertise`,
      question: SCAMPER_OPERATOR_QUESTIONS.R[2],
      verdict: "conditional",
      verdictReasoning: "Content-led acquisition works when CAC payback < 18 months and the category has a high 'research phase' before purchase — requires content investment of 6-12 months before returns",
      leverageHint: "Publish a free 'inspection checklist' or diagnostic tool and track how many leads it generates in 90 days",
      score: 6,
    }),
  },
];

// ─── Apply SCAMPER ────────────────────────────────────────────────────────────

/**
 * Apply all 7 SCAMPER operators to all extracted business elements.
 * Every operator is attempted against every applicable element.
 * Results include both accepted AND rejected applications for full transparency.
 */
export function applyScamper(product: any): ScamperResult {
  const elements = extractBusinessElements(product);
  const applications: ScamperApplication[] = [];
  let idSeq = 0;
  const nextId = () => `sca-${++idSeq}`;

  const appliedOperators = new Set<ScamperOperator>();

  for (const template of MUTATION_TEMPLATES) {
    for (const element of elements) {
      if (!template.elementTypes.includes(element.type)) continue;

      const generated = template.generateMutation(element, product);
      appliedOperators.add(template.operator);

      applications.push({
        id: nextId(),
        operator: template.operator,
        operatorName: SCAMPER_OPERATOR_NAMES[template.operator],
        element,
        mutationIdea: generated.idea,
        triggerQuestion: generated.question,
        verdict: generated.verdict,
        verdictReasoning: generated.verdictReasoning,
        leverageHint: generated.leverageHint,
        disruptionScore: generated.score,
      });
    }
  }

  // Ensure all 7 operators appear — add fallback entries for any missing
  const missingOperators = (Object.keys(SCAMPER_OPERATOR_NAMES) as ScamperOperator[]).filter(
    op => !appliedOperators.has(op)
  );

  const defaultElement: BusinessElement = {
    id: "be-fallback",
    type: "core_offering",
    label: elements[0]?.label ?? "Core business element",
    description: elements[0]?.description ?? "",
    evidenceIds: [],
  };

  for (const op of missingOperators) {
    applications.push({
      id: nextId(),
      operator: op,
      operatorName: SCAMPER_OPERATOR_NAMES[op],
      element: defaultElement,
      mutationIdea: `Apply ${SCAMPER_OPERATOR_NAMES[op]} to the core offering — ${SCAMPER_OPERATOR_QUESTIONS[op][0]}`,
      triggerQuestion: SCAMPER_OPERATOR_QUESTIONS[op][0],
      verdict: "conditional",
      verdictReasoning: "Requires domain-specific evidence to validate — use as an ideation prompt with the product team",
      leverageHint: null,
      disruptionScore: 4,
    });
  }

  const accepted = applications.filter(a => a.verdict === "accept" || a.verdict === "conditional");
  const rejected = applications.filter(a => a.verdict === "reject");

  return {
    applications,
    accepted,
    rejected,
    summary: {
      elementCount: elements.length,
      operatorsApplied: 7,
      totalApplications: applications.length,
      acceptedCount: applications.filter(a => a.verdict === "accept").length,
      rejectedCount: rejected.length,
      conditionalCount: applications.filter(a => a.verdict === "conditional").length,
      acceptanceRate: accepted.length / Math.max(1, applications.length),
    },
  };
}

/**
 * Get the top N accepted SCAMPER applications sorted by disruption score.
 */
export function getTopScamperMoves(result: ScamperResult, n = 5): ScamperApplication[] {
  return [...result.accepted]
    .sort((a, b) => b.disruptionScore - a.disruptionScore)
    .slice(0, n);
}
