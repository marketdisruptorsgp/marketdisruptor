import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rawContent, sources, category, era, audience, batchSize } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a world-class Product Intelligence AI. You analyze scraped web content about products and extract structured product intelligence data.

You MUST respond with ONLY a valid JSON array (no markdown, no explanation, just raw JSON).

For each product you identify, return an object with this exact structure:
{
  "id": "unique-slug",
  "name": "Product Name (Year if known)",
  "category": "Category",
  "description": "2-3 sentence description of the product",
  "specs": "Key specs as a short string",
  "revivalScore": 8,
  "era": "90s",
  "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
  "sources": [{"label": "Source Name", "url": "https://example.com"}],
  "reviews": [
    {"text": "Review text", "sentiment": "positive"},
    {"text": "Complaint text", "sentiment": "negative"},
    {"text": "Neutral observation", "sentiment": "neutral"}
  ],
  "socialSignals": [
    {"platform": "Reddit", "signal": "signal description", "volume": "~50K members"},
    {"platform": "TikTok", "signal": "content type", "volume": "~100M views"}
  ],
  "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"],
  "assumptionsMap": [
    {"assumption": "Core design assumption", "challenge": "How this could be flipped/inverted"},
    {"assumption": "Another assumption", "challenge": "Inversion opportunity"}
  ],
  "flippedIdeas": [
    {
      "name": "Idea Name",
      "description": "2-3 sentence concept description",
      "visualNotes": "Physical design or UI notes",
      "reasoning": "Market + user + emotional reasoning",
      "feasibilityNotes": "Manufacturing, cost, tech notes",
      "scores": {"feasibility": 8, "desirability": 9, "profitability": 7, "novelty": 8},
      "risks": "Key risks or limitations"
    }
  ],
  "confidenceScores": {"adoptionLikelihood": 8, "feasibility": 7, "emotionalResonance": 9}
}

RULES:
- revivalScore must be 1-10 based on emotional resonance, market signals, feasibility, profitability
- All score fields must be integers 1-10
- Return 3-6 products maximum
- Use realistic Unsplash photo URLs for images (use: photo-1558618666-fcd25c85cd64, photo-1587654780291-39c9404d746b, photo-1606144042614-b2417e99c4e3, photo-1516035069371-29a1b244cc32, photo-1488590528505-98d2b5aba04b, photo-1574375927938-d5a98e8ffe85)
- Each product should have 2-3 flippedIdeas
- assumptionsMap should have 4-5 entries
- Base everything on the actual content scraped — be specific about products, brands, dates`;

    const userPrompt = `Analyze this scraped web content about ${eraLabel(era)}${category} products for ${audience} market. Extract the top ${Math.min(batchSize, 6)} most revival-worthy products.

SCRAPED CONTENT:
${rawContent}

DISCOVERED SOURCES:
${sources.map((s: { label: string; url: string }) => `- ${s.label}: ${s.url}`).join("\n")}

Return ONLY a JSON array of product objects. Be specific and actionable.`;

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
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
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

    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let products;
    try {
      products = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed, raw:", cleaned.slice(0, 500));
      throw new Error("AI returned invalid JSON. Please retry.");
    }

    if (!Array.isArray(products)) {
      products = [products];
    }

    return new Response(JSON.stringify({ success: true, products }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-products error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function eraLabel(era: string) {
  return era === "All Eras / Current" ? "" : `${era} `;
}
