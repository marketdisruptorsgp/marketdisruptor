import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveMode, filterInputData, missingDataWarning } from "../_shared/modeEnforcement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, audience, additionalContext } = await req.json();
    const mode = resolveMode(undefined, product.category);
    const filterResult = filterInputData(mode, product);
    const filteredProduct = filterResult.filtered as typeof product;
    console.log(`[ModeEnforcement] flip-ideas | ${mode} | ${missingDataWarning(mode)}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.

CORE PRINCIPLES:
- First-principles reasoning over analogy or convention
- Decompose every system into at least 3 layers of depth
- Never present modeled or inferred data as verified fact

DATA VALIDATION — Tag all claims:
- [VERIFIED] — From cited public source or user-provided data
- [MODELED] — Derived logically from verified inputs
- [ASSUMPTION] — Logical assumption where no verified data exists
- [DATA GAP] — No reliable source available

OUTPUT RULES:
- Metrics must be ≤12 words
- Include leverage scores (1-10) on key assumptions
- Flag risk levels: [Risk: Low/Medium/High]
- Flag capital requirements: [Capital: Low/Medium/High]
- Use directional indicators: ↑ ↓ → for trends

You are also an expert product innovation strategist and venture market analyst who specializes in taking existing or discontinued products and "flipping" their core assumptions to create breakthrough, commercially viable product ideas.

Your flipped ideas must be BOLD, SPECIFIC, and ACTIONABLE — not vague concepts. Prioritize NOVEL approaches that create new categories or rethink how things work. You are NOT limited to proven models — radical innovation often has no direct precedent, and that's a STRENGTH.

IMPORTANT: Not everything needs to be flipped. If parts of the current product/service already work well (pricing model, core feature, delivery method, audience), CALL THAT OUT and build on it. The best flips preserve what's strong and reinvent what's broken.

THE DIFFERENCE BETWEEN A GOOD IDEA AND A GREAT ONE:
- BAD: "A smart version with an app" (generic, no specifics)
- GOOD: "A $39 modular version sold via TikTok Shop targeting the specific grip frustration that r/smartphones discusses weekly. BOM $4.20 via Shenzhen suppliers, 78% margin, breakeven at 890 units."

When a real analogous success exists, cite it — it strengthens the case. When an idea is genuinely novel with no precedent, that's fine — explain WHY the timing is right and what demand signals support it.

Respond with ONLY a valid JSON array of flipped idea objects (no markdown, no explanation).

Each object must follow this EXACT structure:
{
  "name": "Short catchy product name",
  "description": "2-3 sentence concept pitch with specific details (price point, target user, key differentiator)",
  "visualNotes": "Physical design, materials, color, form factor, packaging notes — be specific",
  "reasoning": "Market + emotional + user psychology reasoning with SPECIFIC data points. Include demand signals where available (community size, search trends, cultural shifts). If a real analogous success exists, cite it. If this is genuinely novel, explain what makes the timing right.",
  "feasibilityNotes": "BOM estimate with MATH ($X per unit breakdown), specific manufacturer category (name the platform/region), tech required, MOQ, retail margin CALCULATION (BOM → retail → margin %)",
  "scores": {"feasibility": 8, "desirability": 9, "profitability": 7, "novelty": 9},
  "risks": "Specific risks with named mitigation strategies. Include the #1 reason this could fail and what would need to be true for it to succeed.",
  "preservedStrengths": "What elements of the CURRENT product/service this idea intentionally KEEPS and builds on (and why they're worth keeping). If everything is new, explain why a clean break is better.",
  "whyNow": "The specific market shift, tech unlock, or cultural moment that makes this viable RIGHT NOW",
  "analogousSuccess": "A real company/product that proved a similar model works (with data), OR 'Novel approach' with explanation of why no precedent exists and why that's an opportunity",
  "demandSignal": "Evidence of demand: community complaints, cultural shifts, adjacent market growth, behavioral trends, or search/social signals",
  "actionPlan": {
    "phase1": "First 60 days: 3-4 specific actions with platforms/vendors named",
    "phase2": "Month 3-6: scale actions with specific channels and metrics",
    "phase3": "Month 7-18: growth and distribution actions",
    "timeline": "X months to market",
    "estimatedInvestment": "$X–$Y",
    "revenueProjection": "$X ARR at Y units/subscribers in year 1 — SHOW THE MATH",
    "channels": ["TikTok Shop", "Amazon FBA", "Shopify DTC", "Kickstarter"]
  },
  "riskLevel": "[Risk: Low/Medium/High]",
  "capitalRequired": "[Capital: Low/Medium/High]",
  "dataLabels": {
    "feasibility": "[VERIFIED] or [MODELED] or [ASSUMPTION]",
    "marketSize": "[VERIFIED] or [MODELED] or [ASSUMPTION] or [DATA GAP]",
    "unitEconomics": "[MODELED] or [VERIFIED]"
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

GROUNDING RULES — make ideas SPECIFIC, not generic:
1. If a real analogous product/company exists that validates this model, cite it — it strengthens the case. But don't force-fit irrelevant comparisons.
2. Show demand signals where possible: community complaints, cultural shifts, adjacent market growth, behavioral trends, search/social data
3. Show REAL unit economics math: BOM cost → retail price → margin % → breakeven units
4. Name the SPECIFIC gap this fills — what frustration or unmet need does this address?
5. Include a "why now" trigger — what makes this viable TODAY?

ANTI-GENERIC RULES:
- Do NOT suggest "add an app" or "make it smart" without specifying EXACTLY what the app/smartness does and why users would pay for it
- Do NOT suggest "subscription model" without specifying what recurring value justifies ongoing payment
- Do NOT use vague phrases like "leveraging nostalgia" — name the specific emotional trigger and who feels it
- Each idea must be DIFFERENT in structural approach (e.g. one could be a material flip, one a business model flip, one an audience flip)
- NOVEL ideas without precedent are WELCOME — explain why the timing is right and what signals support them

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
