import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, audience, additionalContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert product innovation strategist who specializes in taking existing or discontinued products and "flipping" their core assumptions to create breakthrough product ideas.

Your job is to challenge every assumption about how a product is designed, who it's for, how it's priced, and how it's used — then generate 3 bold, commercially viable new product concepts.

Respond with ONLY a valid JSON array of flipped idea objects (no markdown, no explanation).

Each object must follow this exact structure:
{
  "name": "Short catchy product name",
  "description": "2-3 sentence concept pitch",
  "visualNotes": "Physical design, materials, color, form factor notes",
  "reasoning": "Market + emotional + user psychology reasoning (2-3 sentences)",
  "feasibilityNotes": "Manufacturing cost, BOM estimate, supply chain, tech required",
  "scores": {"feasibility": 8, "desirability": 9, "profitability": 7, "novelty": 9},
  "risks": "Key risks and how to mitigate them"
}`;

    const userPrompt = `Generate 3 bold, commercially viable "flipped" product ideas for this product:

PRODUCT: ${product.name}
CATEGORY: ${product.category}
DESCRIPTION: ${product.description}
SPECS: ${product.specs}
ERA: ${product.era}
TARGET AUDIENCE: ${audience}

CURRENT ASSUMPTIONS TO CHALLENGE:
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption}`).join("\n") || "All design, pricing, audience, and usage assumptions"}

KNOWN COMPLAINTS/PAIN POINTS:
${product.reviews?.filter((r: { sentiment: string }) => r.sentiment === "negative").map((r: { text: string }) => `• ${r.text}`).join("\n") || "General usability and cost concerns"}

ADDITIONAL CONTEXT: ${additionalContext || "Focus on modern market opportunities and emerging consumer trends."}

Rules:
- Make ideas bold and specific (not vague)
- Include realistic BOM/cost estimates
- Score all fields as integers 1-10
- Think about: material inversion, audience flip, pricing model inversion, usage context flip, technology substitution

Return ONLY a JSON array with exactly 3 flipped idea objects.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${txt}`);
    }

    const aiData = await response.json();
    const rawText: string = aiData.choices?.[0]?.message?.content ?? "";

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let ideas;
    try {
      ideas = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed:", cleaned.slice(0, 300));
      throw new Error("AI returned invalid JSON. Please retry.");
    }

    if (!Array.isArray(ideas)) ideas = [ideas];

    return new Response(JSON.stringify({ success: true, ideas }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-flip-ideas error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
