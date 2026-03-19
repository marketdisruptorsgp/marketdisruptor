import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Industry archetype keyword map ──────────────────────────────
// Maps detected industry to relevant archetype with domain-specific
// fallback assumptions for enriching shallow inputs.
const INDUSTRY_ARCHETYPES: Record<string, {
  label: string;
  criticalConstraints: string[];
  defaultChallenges: { id: string; question: string; context: string; related_mode: "product" | "service" | "business" }[];
}> = {
  saas: {
    label: "SaaS / Software Platform",
    criticalConstraints: ["churn", "activation", "pricing-model", "feature-adoption"],
    defaultChallenges: [
      { id: "churn-root-cause", question: "What is the single biggest driver of churn — pricing mismatch, onboarding failure, or product-fit gaps?", context: "SaaS churn is almost always a symptom of a deeper structural issue in the value delivery chain.", related_mode: "business" },
      { id: "activation-friction", question: "Where in the onboarding funnel do users drop before experiencing core value?", context: "Time-to-value is the #1 predictor of SaaS retention.", related_mode: "service" },
      { id: "pricing-architecture", question: "Does current pricing capture the value delivered, or are you leaving money on the table?", context: "Flat pricing vs usage-based vs outcome-based fundamentally shapes LTV.", related_mode: "business" },
    ],
  },
  logistics: {
    label: "Logistics / Supply Chain",
    criticalConstraints: ["shipping-rates", "last-mile", "inventory-turns", "carrier-dependency"],
    defaultChallenges: [
      { id: "rate-increase-upstream", question: "Are rising shipping costs caused by carrier rate increases, route inefficiency, or weight/dim misclassification?", context: "Upstream carrier rate increases often mask addressable operational inefficiencies.", related_mode: "service" },
      { id: "inventory-positioning", question: "Is inventory held at the right nodes to minimize last-mile distance and fulfillment cost?", context: "Mis-positioned inventory inflates shipping cost by 15-40% on average.", related_mode: "business" },
    ],
  },
  ecommerce: {
    label: "E-commerce / Retail",
    criticalConstraints: ["cac", "conversion-rate", "returns", "margin-compression"],
    defaultChallenges: [
      { id: "cac-vs-ltv", question: "Is the CAC:LTV ratio sustainable, or does the unit economics break at scale?", context: "E-commerce businesses often scale into negative margin if CAC isn't front-loaded into cohort analysis.", related_mode: "business" },
      { id: "conversion-bottleneck", question: "What is the highest-friction step in the purchase funnel — discovery, product page, or checkout?", context: "A 1% conversion improvement on a $1M revenue site can add $100K+ annually.", related_mode: "service" },
    ],
  },
  restaurant: {
    label: "Restaurant / Food Service",
    criticalConstraints: ["food-cost", "labor-cost", "table-turn", "delivery-margin"],
    defaultChallenges: [
      { id: "prime-cost-target", question: "Is prime cost (food + labor) below 65% of revenue, and if not, which driver is out of control?", context: "Prime cost above 65% makes profitability structurally nearly impossible without volume scale.", related_mode: "business" },
      { id: "delivery-platform-dependency", question: "What percentage of revenue flows through third-party delivery apps, and what is the effective margin after their fees?", context: "Apps typically charge 25-30% commissions, turning profitable dine-in concepts into delivery losses.", related_mode: "business" },
    ],
  },
  healthcare: {
    label: "Healthcare / Wellness",
    criticalConstraints: ["reimbursement", "regulation", "patient-acquisition", "provider-capacity"],
    defaultChallenges: [
      { id: "reimbursement-model", question: "Is revenue tied to fee-for-service reimbursement, and could a value-based or direct-pay model improve margins?", context: "Fee-for-service creates volume pressure that erodes care quality and margins simultaneously.", related_mode: "business" },
      { id: "patient-acquisition-cost", question: "What is the cost to acquire a new patient vs lifetime value, and which referral channel is most efficient?", context: "Healthcare CAC varies 10x by channel, making channel mix the #1 margin lever.", related_mode: "business" },
    ],
  },
  manufacturing: {
    label: "Manufacturing / Hardware",
    criticalConstraints: ["cogs", "yield-rate", "tooling", "supplier-concentration"],
    defaultChallenges: [
      { id: "supplier-concentration-risk", question: "Is the BOM dependent on a single-source supplier for any critical component, and what is the risk exposure?", context: "Single-source dependency can halt production on any supply disruption.", related_mode: "business" },
      { id: "yield-improvement", question: "What is current manufacturing yield rate, and where in the process do defects most commonly originate?", context: "A 1% yield improvement at scale can recoup millions in rework and scrap costs.", related_mode: "product" },
    ],
  },
};

// ── Input clarity scoring heuristics ────────────────────────────
function scoreInputClarity(text: string): number {
  const wordCount = text.trim().split(/\s+/).length;
  const hasMetrics = /\d+%|\$\d+|revenue|cost|margin|churn|cac|ltv|arr|mrr/i.test(text);
  const hasSpecificProblem = /because|due to|caused by|results in|leads to|struggle with|challenge|issue|problem/i.test(text);
  const hasContext = /we|our|my|i |the company|the business/i.test(text);
  const hasGoal = /want|goal|trying to|need to|aim|objective|target/i.test(text);

  let score = 0;
  score += Math.min(wordCount / 2, 30); // up to 30pts for length
  if (hasMetrics) score += 20;
  if (hasSpecificProblem) score += 20;
  if (hasContext) score += 15;
  if (hasGoal) score += 15;

  return Math.min(Math.round(score), 100);
}

// ── Detect industry archetype from text ─────────────────────────
function detectIndustryArchetype(text: string): string | null {
  const lower = text.toLowerCase();
  if (/saas|software|app|platform|subscription|monthly plan|dashboard|api|sdk|mobile app/.test(lower)) return "saas";
  if (/logistic|shipping|freight|warehouse|fulfillment|supply chain|carrier|delivery route/.test(lower)) return "logistics";
  if (/ecommerce|e-commerce|online store|shopify|amazon|retail|product listing|checkout/.test(lower)) return "ecommerce";
  if (/restaurant|food|menu|kitchen|cafe|dining|catering|takeout|delivery app/.test(lower)) return "restaurant";
  if (/healthcare|medical|clinic|patient|doctor|hospital|wellness|therapy|dental/.test(lower)) return "healthcare";
  if (/manufactur|factory|production|assembly|tooling|hardware|physical product|bom/.test(lower)) return "manufacturing";
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { problemText } = await req.json();
    if (!problemText || problemText.trim().length < 15) {
      return new Response(
        JSON.stringify({ error: "Problem text too short" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Pre-analysis: clarity scoring and archetype detection ──
    const inputClarity = scoreInputClarity(problemText);
    const detectedArchetype = detectIndustryArchetype(problemText);
    const archetypeData = detectedArchetype ? INDUSTRY_ARCHETYPES[detectedArchetype] : null;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ── Adaptive system prompt based on input clarity ──────────
    const clarityGuidance = inputClarity < 40
      ? `\n\nINPUT CLARITY NOTE: This input is vague or shallow (clarity score: ${inputClarity}/100). You MUST generate 2-3 targeted clarification prompts as clarificationPrompts. These should be specific questions that would unlock deeper analysis — focus on the most critical unknown constraint: cost, churn, time-to-value, or market fit. Also generate an edgeCaseType of "shallow" and populate fallbackAssumptions with 3-4 likely assumptions for this type of business.`
      : inputClarity < 70
      ? `\n\nINPUT CLARITY NOTE: This input has moderate clarity (score: ${inputClarity}/100). Generate 1-2 clarificationPrompts to refine the most uncertain strategic dimension.`
      : "";

    const archetypeGuidance = archetypeData
      ? `\n\nINDUSTRY ARCHETYPE DETECTED: "${archetypeData.label}". Critical constraints to surface for this archetype: ${archetypeData.criticalConstraints.join(", ")}. Ensure challenges include at least one archetype-specific question. Set industryArchetype to "${detectedArchetype}".`
      : "";

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are a business analysis router. Given a user's problem description, you must:

1. Detect which analysis modes apply. There are exactly 3 modes:
   - "product": The thing being sold needs to change — design, features, formulation, materials, tech, packaging, quality, durability, form factor, SKU lineup, manufacturing process.
   - "service": How value is delivered needs to change — operations, workflow, customer experience, delivery model, onboarding, support, scheduling, staffing, fulfillment, logistics, customer journey, wait times, convenience.
   - "business": How money flows or the business competes needs to change — pricing strategy, revenue model, margins, cost structure, unit economics, monetization, market expansion, geographic expansion, distribution strategy, white labeling, franchise model, competitive positioning, market share, growth model, partnerships, B2B vs B2C, acquisition strategy, funding.

2. Extract specific strategic questions/challenges from the text.

3. Identify what entity/business is being analyzed.

4. Suggest which challenges are highest priority.

5. Score input clarity and generate clarification prompts for vague inputs.

6. Detect the industry archetype and surface archetype-specific constraints.

CRITICAL MODE DETECTION RULES:
- Be VERY generous. Most real problems involve 2-3 modes. Default to including more modes, not fewer.
- If someone describes ANY physical product, item, food, drink, device, or thing they sell → include "product" mode (even if the main issue is business strategy).
- If someone mentions ANY of: customers, experience, operations, delivery, repair, appointments, scheduling, convenience, service quality, wait times, staffing → include "service" mode.
- If someone mentions ANY of: competition, saturated market, grow, expand, new market, pricing, margins, revenue, white label, distribution, scale, franchise, profitability, beat competitors, market share, business model, wholesale, retail, B2B, territory, geography (state names), ROI, investment → include "business" mode.
- A mechanic shop = service + business (always). A food product company = product + business (always). A SaaS = product + service + business (usually all three).
- When in doubt, include the mode at 30-40% confidence rather than excluding it.

EXAMPLES:
- "I run a THC drink distribution company and want to know if we should white label, expand to Florida, and beat competition" → product (60%), service (40%), business (90%)
- "My auto repair shop has too many competitors and I need to stand out" → service (80%), business (70%), product (30%)
- "I have a mobile app that's not getting downloads" → product (70%), business (60%), service (30%)
- "We sell handmade candles and want to grow beyond our local market" → product (50%), business (85%), service (30%)${clarityGuidance}${archetypeGuidance}`,
            },
            {
              role: "user",
              content: problemText,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "analyze_problem",
                description:
                  "Analyze the user's problem and return structured routing data",
                parameters: {
                  type: "object",
                  properties: {
                    modes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          mode: {
                            type: "string",
                            enum: ["product", "service", "business"],
                          },
                          confidence: {
                            type: "number",
                            description: "0-100 confidence score",
                          },
                          reason: {
                            type: "string",
                            description:
                              "Brief plain-English reason this mode applies",
                          },
                        },
                        required: ["mode", "confidence", "reason"],
                        additionalProperties: false,
                      },
                      description:
                        "All applicable modes sorted by relevance (include all that apply above 20% confidence)",
                    },
                    entity: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                          description:
                            "Name of the business/product being analyzed",
                        },
                        type: {
                          type: "string",
                          description:
                            "Brief description of what it is (e.g. 'THC beverage distributor')",
                        },
                      },
                      required: ["name", "type"],
                      additionalProperties: false,
                    },
                    challenges: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                            description: "Short unique slug like 'white-label-viability'",
                          },
                          question: {
                            type: "string",
                            description:
                              "The strategic question, phrased clearly (e.g. 'Should we add white label production?')",
                          },
                          context: {
                            type: "string",
                            description:
                              "One sentence of context explaining why this matters based on what they said",
                          },
                          priority: {
                            type: "string",
                            enum: ["high", "medium", "low"],
                          },
                          related_mode: {
                            type: "string",
                            enum: ["product", "service", "business"],
                            description: "Which mode this challenge primarily relates to",
                          },
                        },
                        required: [
                          "id",
                          "question",
                          "context",
                          "priority",
                          "related_mode",
                        ],
                        additionalProperties: false,
                      },
                    },
                    summary: {
                      type: "string",
                      description:
                        "One-sentence summary of what we understand the user is trying to solve",
                    },
                    clarificationPrompts: {
                      type: "array",
                      items: { type: "string" },
                      description: "2-3 targeted questions to ask when the input is vague or shallow — focus on the most critical unknown constraint (e.g. cost vs churn vs time). Only populate for clarity < 70.",
                    },
                    industryArchetype: {
                      type: "string",
                      description: "Detected industry archetype slug: saas | logistics | ecommerce | restaurant | healthcare | manufacturing | other. Null if unknown.",
                    },
                    edgeCaseType: {
                      type: "string",
                      enum: ["shallow", "overly_specific", "clear"],
                      description: "shallow = not enough context; overly_specific = too narrow to generalize; clear = sufficient context for full analysis.",
                    },
                    fallbackAssumptions: {
                      type: "array",
                      items: { type: "string" },
                      description: "For shallow inputs only: 3-4 likely assumptions about this business type to enrich the decomposition pipeline. E.g. 'Most revenue is from a single customer segment' or 'Pricing has not been revisited in 12+ months'.",
                    },
                  },
                  required: [
                    "modes",
                    "entity",
                    "challenges",
                    "summary",
                    "edgeCaseType",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "analyze_problem" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    // ── Augment with pre-computed fields ──────────────────────
    parsed.inputClarity = inputClarity;

    // Prefer AI-detected archetype; fall back to heuristic detection
    if (!parsed.industryArchetype && detectedArchetype) {
      parsed.industryArchetype = detectedArchetype;
    }

    // For shallow inputs: merge archetype default challenges if AI produced fewer than 2
    if (parsed.edgeCaseType === "shallow" && archetypeData) {
      const existingIds = new Set((parsed.challenges || []).map((c: { id: string }) => c.id));
      const toMerge = archetypeData.defaultChallenges
        .filter(c => !existingIds.has(c.id))
        .map(c => ({ ...c, priority: "high" as const, context: c.context }));
      parsed.challenges = [...(parsed.challenges || []), ...toMerge];
      if (!parsed.fallbackAssumptions?.length) {
        parsed.fallbackAssumptions = archetypeData.criticalConstraints.map(
          c => `This business likely faces unresolved "${c.replace(/-/g, " ")}" constraints typical of ${archetypeData.label} operators.`
        );
      }
    }

    console.log(`[analyze-problem] clarity=${inputClarity} archetype=${parsed.industryArchetype || "unknown"} edgeCase=${parsed.edgeCaseType} challenges=${parsed.challenges?.length}`);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-problem error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
