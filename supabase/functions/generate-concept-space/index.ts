import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { opportunityLabel, opportunityDetail, constraints, leveragePoints, competitors, flippedIdeas } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!opportunityLabel) {
      return new Response(JSON.stringify({ error: "opportunityLabel is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a strategic innovation architect. Given an opportunity and its upstream constraints/leverage points, generate a structured design space expansion.

Your task:
1. Identify 3-6 design DIMENSIONS derived from the constraints and leverage points. Each dimension represents an axis of variation (e.g., "Interaction Surface", "Business Model", "Technology Stack", "Distribution Channel").
2. For each dimension, generate 3-5 specific VALUES (options along that axis).
3. Generate 8-15 CONCEPT VARIANTS by combining values across dimensions in interesting ways. Each variant should be a viable concept direction.

IMPORTANT:
- Dimensions MUST be derived from the upstream constraints and leverage points — they represent the structural axes where innovation is possible.
- Values should range from conventional to radical.
- Concept variants should include both safe combinations and surprising/disruptive ones.
- Every variant needs a clear, descriptive name and a one-sentence description.
- Use QUALITATIVE tiers ("strong", "moderate", "early") instead of numeric scores for all assessments. These reflect confidence in the assessment, not rankings.
  - "strong" = well-understood, clear evidence or precedent
  - "moderate" = plausible with some unknowns
  - "early" = speculative, requires significant validation

Return ONLY valid JSON using this exact schema:
{
  "dimensions": [
    {
      "id": "dim-1",
      "name": "Dimension Name",
      "derivedFrom": "constraint or leverage point label that inspired this dimension",
      "values": [
        { "id": "val-1-1", "label": "Value Label", "feasibility": "high|medium|low", "novelty": "high|medium|low" }
      ]
    }
  ],
  "variants": [
    {
      "id": "var-1",
      "name": "Concept Name",
      "description": "One sentence description",
      "dimensionValues": { "dim-1": "val-1-1", "dim-2": "val-2-3" },
      "formula": "Value A + Value B → Concept Name",
      "feasibility": "strong|moderate|early",
      "novelty": "strong|moderate|early",
      "marketReadiness": "strong|moderate|early"
    }
  ]
}`;

    const userPrompt = `OPPORTUNITY: ${opportunityLabel}
${opportunityDetail ? `DETAIL: ${opportunityDetail}` : ""}

UPSTREAM CONSTRAINTS:
${(constraints || []).map((c: string, i: number) => `${i + 1}. ${c}`).join("\n") || "None provided"}

UPSTREAM LEVERAGE POINTS:
${(leveragePoints || []).map((l: string, i: number) => `${i + 1}. ${l}`).join("\n") || "None provided"}

Generate the design space expansion now.`;

    const tierEnum = ["strong", "moderate", "early"];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_concept_space",
              description: "Generate a structured design space with dimensions and concept variants",
              parameters: {
                type: "object",
                properties: {
                  dimensions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        derivedFrom: { type: "string" },
                        values: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              label: { type: "string" },
                              feasibility: { type: "string", enum: ["high", "medium", "low"] },
                              novelty: { type: "string", enum: ["high", "medium", "low"] },
                            },
                            required: ["id", "label", "feasibility", "novelty"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["id", "name", "derivedFrom", "values"],
                      additionalProperties: false,
                    },
                  },
                  variants: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string" },
                        dimensionValues: { type: "object" },
                        formula: { type: "string" },
                        feasibility: { type: "string", enum: tierEnum },
                        novelty: { type: "string", enum: tierEnum },
                        marketReadiness: { type: "string", enum: tierEnum },
                      },
                      required: ["id", "name", "description", "dimensionValues", "formula", "feasibility", "novelty", "marketReadiness"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["dimensions", "variants"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_concept_space" } },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      const content = result.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch { /* ignore */ }

      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-concept-space error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const isTimeout = msg.includes("abort");
    return new Response(
      JSON.stringify({ error: isTimeout ? "Request timed out. Please try again." : msg }),
      {
        status: isTimeout ? 504 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
