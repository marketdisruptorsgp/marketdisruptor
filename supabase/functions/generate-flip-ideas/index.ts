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

    const systemPrompt = `You are an expert product innovation strategist and venture market analyst who specializes in taking existing or discontinued products and "flipping" their core assumptions to create breakthrough, commercially viable product ideas.

Your flipped ideas must be BOLD, SPECIFIC, VALIDATED, and ACTIONABLE — not vague concepts. Every idea must be grounded in PROVEN market patterns with real analogous successes, real demand signals, and real unit economics.

THE DIFFERENCE BETWEEN A GOOD IDEA AND A GREAT ONE:
- BAD: "A smart version with an app" (generic, no validation)
- GOOD: "A $39 modular version sold via TikTok Shop, similar to how PopSockets turned a $2 BOM into a $300M business by solving the specific grip problem that r/smartphones complains about weekly. BOM $4.20 via Shenzhen Silicone Co., 78% margin, breakeven at 890 units."

Respond with ONLY a valid JSON array of flipped idea objects (no markdown, no explanation).

Each object must follow this EXACT structure:
{
  "name": "Short catchy product name",
  "description": "2-3 sentence concept pitch with specific details (price point, target user, key differentiator)",
  "visualNotes": "Physical design, materials, color, form factor, packaging notes — be specific",
  "reasoning": "Market + emotional + user psychology reasoning with SPECIFIC data points. MUST include: 1) a real analogous product/company that proved this model works, 2) a specific demand signal (subreddit size, TikTok views, Google Trends data, Kickstarter success)",
  "feasibilityNotes": "BOM estimate with MATH ($X per unit breakdown), specific manufacturer category (name the platform/region), tech required, MOQ, retail margin CALCULATION (BOM → retail → margin %)",
  "scores": {"feasibility": 8, "desirability": 9, "profitability": 7, "novelty": 9},
  "risks": "Specific risks with named mitigation strategies. Include the #1 reason this could fail and what would need to be true for it to succeed.",
  "whyNow": "The specific market shift, tech unlock, or cultural moment that makes this viable RIGHT NOW",
  "analogousSuccess": "Name a REAL company/product that proved this model works, with revenue/growth data",
  "demandSignal": "Specific evidence of demand: subreddit size, hashtag views, Kickstarter data, search trends, community complaints with volume",
  "actionPlan": {
    "phase1": "First 60 days: 3-4 specific actions with platforms/vendors named",
    "phase2": "Month 3-6: scale actions with specific channels and metrics",
    "phase3": "Month 7-18: growth and distribution actions",
    "timeline": "X months to market",
    "estimatedInvestment": "$X–$Y",
    "revenueProjection": "$X ARR at Y units/subscribers in year 1 — SHOW THE MATH",
    "channels": ["TikTok Shop", "Amazon FBA", "Shopify DTC", "Kickstarter"]
  }
}`;

    const userPrompt = `Generate 3 bold, commercially viable "flipped" product ideas for this product.

PRODUCT: ${product.name}
CATEGORY: ${product.category}
DESCRIPTION: ${product.description}
SPECS: ${product.specs}
ERA: ${product.era}
TARGET AUDIENCE: ${audience}
MARKET SIZE: ${product.marketSizeEstimate || "Unknown"}
KEY INSIGHT: ${product.keyInsight || ""}

CURRENT PRICING:
${product.pricingIntel ? `- Market: ${product.pricingIntel.currentMarketPrice}\n- eBay avg: ${product.pricingIntel.ebayAvgSold}\n- Trend: ${product.pricingIntel.priceDirection}` : "See description"}

CURRENT ASSUMPTIONS TO CHALLENGE:
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption} → ${a.challenge}`).join("\n") || "All design, pricing, audience, and usage assumptions"}

KNOWN COMPLAINTS/PAIN POINTS:
${product.reviews?.filter((r: { sentiment: string }) => r.sentiment === "negative").map((r: { text: string }) => `• ${r.text}`).join("\n") || "General usability and cost concerns"}

COMMUNITY IMPROVEMENT REQUESTS:
${(product as { communityInsights?: { improvementRequests?: string[] } }).communityInsights?.improvementRequests?.map((r: string) => `• ${r}`).join("\n") || "Not available"}

COMPETITOR GAPS:
${(product as { competitorAnalysis?: { gaps?: string[] } }).competitorAnalysis?.gaps?.map((g: string) => `• ${g}`).join("\n") || "Not available"}

TREND CONTEXT:
${product.trendAnalysis || "Nostalgia-driven market with modern tech expectations"}

ADDITIONAL CONTEXT: ${additionalContext || "Focus on modern market opportunities and emerging consumer trends."}

VALIDATION RULES — EVERY IDEA MUST:
1. Name a REAL analogous product/company that proved this model works (e.g. "Similar to how Oura Ring proved wearable wellness tracking at $299" or "Following the Peloton model of hardware + subscription")
2. Cite a SPECIFIC demand signal: a subreddit with >10K members, a TikTok hashtag with >1M views, a Google Trends spike, a Kickstarter that raised >$100K, or a community complaint with >100 upvotes
3. Show REAL unit economics math: BOM cost → retail price → margin % → breakeven units (e.g. "BOM $18 via Alibaba MOQ 500 → retail $49 → 63% margin → breakeven at 340 units = $16,660")
4. Name the SPECIFIC competitive gap this fills — what existing products fail at that this solves
5. Include a "why now" trigger — what market shift, technology unlock, or cultural moment makes this viable TODAY vs 2 years ago

ANTI-GENERIC RULES:
- Do NOT suggest "add an app" or "make it smart" without specifying EXACTLY what the app/smartness does and why users would pay for it
- Do NOT suggest "subscription model" without specifying what recurring value justifies ongoing payment
- Do NOT use phrases like "leveraging nostalgia" without naming the specific emotional trigger and the audience segment size
- Each idea must be DIFFERENT in structural approach (e.g. one could be a material flip, one a business model flip, one an audience flip)
- If you can't find a real analogous success, that's a RED FLAG — reconsider the idea

Return ONLY a JSON array with exactly 3 flipped idea objects.`;

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
        temperature: 0.5,
        max_tokens: 12000,
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

    let cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    // Extract JSON array — find first [ and last ]
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.slice(firstBracket, lastBracket + 1);
    }

    let ideas;
    try {
      ideas = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed:", cleaned.slice(0, 300));
      // Attempt to salvage complete objects from truncated JSON
      const salvaged: unknown[] = [];
      let depth = 0, start = -1;
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === "{") { if (depth === 0) start = i; depth++; }
        else if (cleaned[i] === "}") {
          depth--;
          if (depth === 0 && start !== -1) {
            try { salvaged.push(JSON.parse(cleaned.slice(start, i + 1))); } catch { /* skip */ }
            start = -1;
          }
        }
      }
      if (salvaged.length > 0) {
        console.log(`Salvaged ${salvaged.length} idea(s) from truncated JSON`);
        ideas = salvaged;
      } else {
        throw new Error("AI returned invalid JSON. Please retry.");
      }
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
