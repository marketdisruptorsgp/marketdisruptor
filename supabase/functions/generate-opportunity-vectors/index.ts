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
    const { dimensions, constraints, leveragePoints, analysisType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!dimensions || !Array.isArray(dimensions) || dimensions.length === 0) {
      return new Response(JSON.stringify({ error: "At least one active dimension is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a strategic business architect. Given a company's current business configuration (expressed as dimensions with current values), generate realistic alternative values for each dimension.

CONTEXT: This is a morphological analysis of a business model. Each dimension represents an axis of the business (e.g., Pricing Model, Distribution Channel, Operational Model). The current value shows how the business currently operates along that axis. Your job is to generate 2-4 concrete alternative states for each dimension.

RULES:
1. Alternatives must be CONCRETE operational states, not vague aspirations. "Usage-based pricing with per-seat tiers" is good. "Better pricing" is bad.
2. Each alternative needs a one-sentence rationale explaining why it's viable given the constraints and leverage points.
3. Do NOT generate scores, rankings, or numeric assessments of any kind.
4. Alternatives should range from incremental shifts to more radical reconfigurations.
5. Consider the upstream constraints — alternatives should address or work around them, not ignore them.
6. Consider the leverage points — alternatives should amplify existing strengths where possible.
7. For "hot" dimensions (constraint-linked), generate 3-4 alternatives. For "warm" dimensions (evidence-dense but no constraint), generate 2-3 alternatives.

Return ONLY valid JSON using the tool schema provided.`;

    const dimensionList = dimensions.map((d: any) =>
      `- ${d.name} [${d.status.toUpperCase()}] (${d.category})\n  Current: "${d.currentValue}"\n  Evidence density: ${d.evidenceCount} items`
    ).join("\n");

    const constraintList = (constraints || []).map((c: any, i: number) =>
      `${i + 1}. ${c.label}: ${c.description}`
    ).join("\n") || "None identified";

    const leverageList = (leveragePoints || []).map((l: any, i: number) =>
      `${i + 1}. ${l.label}: ${l.description}`
    ).join("\n") || "None identified";

    const userPrompt = `ANALYSIS TYPE: ${analysisType || "business_model"}

CURRENT BUSINESS CONFIGURATION (dimensions to explore):
${dimensionList}

UPSTREAM CONSTRAINTS:
${constraintList}

UPSTREAM LEVERAGE POINTS:
${leverageList}

Generate alternative values for each dimension now.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

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
        temperature: 0.7,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_alternatives",
              description: "Generate alternative values for business dimensions",
              parameters: {
                type: "object",
                properties: {
                  alternatives: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        dimensionId: {
                          type: "string",
                          description: "The ID of the dimension (e.g., dim-pricing_model)",
                        },
                        value: {
                          type: "string",
                          description: "A concrete alternative state for this dimension",
                        },
                        rationale: {
                          type: "string",
                          description: "One-sentence rationale for why this alternative is viable",
                        },
                      },
                      required: ["dimensionId", "value", "rationale"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["alternatives"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_alternatives" } },
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
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
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
      // Fallback: try parsing from content
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
    console.error("generate-opportunity-vectors error:", e);
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
