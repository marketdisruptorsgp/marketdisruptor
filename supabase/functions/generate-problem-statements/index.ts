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
    const { entityName, entityType, mode, description } = await req.json();

    if (!entityName) {
      return new Response(
        JSON.stringify({ error: "entityName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const modeContext = mode === "service"
      ? "service delivery, operations, and customer experience"
      : mode === "business"
      ? "business model, revenue strategy, and competitive positioning"
      : "product design, features, and market fit";

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are a senior strategic analyst. Given a business entity, generate 3 distinct, specific problem statements that represent the most critical strategic challenges this entity faces.

RULES:
- Each statement must be specific to THIS entity — not generic business advice
- Use your knowledge of the entity, its industry, competitive landscape, and market dynamics
- Frame each as a clear strategic problem/tension (not a question)
- Each should represent a DIFFERENT strategic angle or dimension
- Focus on ${modeContext}
- Be bold and specific — reference real competitors, market dynamics, or industry shifts
- Each statement should be 1-2 sentences, max 200 characters
- Do NOT use vague language like "may face challenges" — state the problem directly`,
            },
            {
              role: "user",
              content: `Entity: "${entityName}"${entityType ? ` (${entityType})` : ""}${description ? `\nContext: ${description.slice(0, 500)}` : ""}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_problem_statements",
                description: "Return 3 distinct problem statements for this entity",
                parameters: {
                  type: "object",
                  properties: {
                    statements: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          text: {
                            type: "string",
                            description: "The problem statement — specific, bold, 1-2 sentences",
                          },
                          angle: {
                            type: "string",
                            description: "Brief label for the strategic angle (e.g. 'Competitive Pressure', 'Margin Erosion', 'Customer Shift')",
                          },
                        },
                        required: ["text", "angle"],
                        additionalProperties: false,
                      },
                      minItems: 3,
                      maxItems: 3,
                    },
                  },
                  required: ["statements"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_problem_statements" },
          },
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI problem statement generation failed");
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
    console.error("generate-problem-statements error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
