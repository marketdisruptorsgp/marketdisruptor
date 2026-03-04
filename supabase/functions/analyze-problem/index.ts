import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
- "We sell handmade candles and want to grow beyond our local market" → product (50%), business (85%), service (30%)`,
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
                  },
                  required: [
                    "modes",
                    "entity",
                    "challenges",
                    "summary",
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
