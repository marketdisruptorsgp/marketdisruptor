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
   - "product": The thing itself needs to change (design, features, materials, tech, manufacturing)
   - "service": How value is delivered needs to change (operations, workflow, customer experience, delivery model, onboarding, support)
   - "business": How money flows needs to change (pricing, revenue model, margins, cost structure, unit economics, monetization, market expansion, distribution strategy, white labeling, growth model)

2. Extract specific strategic questions/challenges from the text. Each challenge should be a clear, actionable question.

3. Identify what entity/business is being analyzed (name, type).

4. Suggest which challenges are highest priority based on the problem description.

IMPORTANT RULES:
- Be generous with mode detection. If someone mentions "grow fast", "competition", "margins", "expand to new market", "white label", "distribution" — that's business mode.
- If someone mentions their product or what they sell — that's product mode.
- If someone mentions customer experience, operations, delivery — that's service mode.
- Most real problems span 2+ modes. Don't be restrictive.
- Extract at least 2-5 specific challenges from the text.
- Challenges should be phrased as clear questions a strategist would ask.`,
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
