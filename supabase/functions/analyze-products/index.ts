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

    const systemPrompt = `You are a world-class Product Intelligence AI and venture market analyst. You analyze scraped web content to extract deep, actionable product intelligence — going far beyond surface descriptions into pricing, supply chain, trends, and capitalization strategies.

You MUST respond with ONLY a valid JSON array (no markdown, no explanation, just raw JSON).

For each product, return an object with this EXACT structure:
{
  "id": "unique-slug",
  "name": "Product Name (Year if known)",
  "category": "Category",
  "description": "2-3 sentence description",
  "specs": "Key specs as a short string",
  "revivalScore": 8,
  "era": "90s",
  "keyInsight": "The single most important non-obvious insight about this product's commercial opportunity (1-2 sentences, be specific and provocative)",
  "marketSizeEstimate": "TAM estimate with source/basis",
  "image": "https://images.unsplash.com/photo-SPECIFIC_RELEVANT_PHOTO_ID?w=600&h=400&fit=crop",
  "sources": [{"label": "Source Name", "url": "https://actual-url.com"}],
  "reviews": [
    {"text": "Specific review text with detail", "sentiment": "positive"},
    {"text": "Specific complaint with context", "sentiment": "negative"},
    {"text": "Nuanced observation", "sentiment": "neutral"}
  ],
  "socialSignals": [
    {"platform": "TikTok", "signal": "specific content type", "volume": "~50M views", "trend": "up", "url": "https://tiktok.com/tag/example"},
    {"platform": "Reddit", "signal": "subreddit activity", "volume": "~50K members", "trend": "stable", "url": "https://reddit.com/r/example"}
  ],
  "competitors": ["Competitor 1 (price)", "Competitor 2 (price)"],
  "pricingIntel": {
    "currentMarketPrice": "$X–$Y new retail",
    "collectorPremium": "Vintage/rare condition pricing with context",
    "priceRange": "$X – $Y (full range)",
    "priceDirection": "rising",
    "ebayAvgSold": "$X avg (condition)",
    "etsyAvgSold": "$X (type)",
    "msrpOriginal": "$X (year)",
    "margins": "Estimated gross margin at X price point"
  },
  "supplyChain": {
    "suppliers": [
      {"name": "Supplier Name", "region": "Country/Region", "url": "https://url.com", "role": "What they supply"}
    ],
    "manufacturers": [
      {"name": "Manufacturer", "region": "Country", "url": "https://url.com", "moq": "Min order qty"}
    ],
    "vendors": [
      {"name": "Vendor Name", "type": "Specialty/Mass/Import", "url": "https://url.com", "notes": "Context"}
    ],
    "retailers": [
      {"name": "Retailer", "type": "E-commerce/Mass/Specialty", "url": "https://url.com", "marketShare": "X%"}
    ],
    "distributors": [
      {"name": "Distributor", "region": "Region", "url": "https://url.com", "notes": "Context"}
    ]
  },
  "trendAnalysis": "Detailed 3-5 sentence trend analysis with specific data points: search volumes, YoY growth rates, key events driving interest, market dynamics",
  "actionPlan": {
    "strategy": "2-3 sentence overall strategic direction — be specific about the angle (flip, revive, license, arbitrage, innovate)",
    "phases": [
      {
        "phase": "Phase 1 Name",
        "timeline": "Month X–Y",
        "actions": ["Specific action 1 with details", "Specific action 2 with vendors/platforms named"],
        "budget": "$X–$Y",
        "milestone": "Measurable outcome to validate before proceeding"
      },
      {
        "phase": "Phase 2 Name",
        "timeline": "Month X–Y",
        "actions": ["Action with specifics"],
        "budget": "$X–$Y",
        "milestone": "Measurable milestone"
      },
      {
        "phase": "Phase 3 Name",
        "timeline": "Month X–Y",
        "actions": ["Action with specifics"],
        "budget": "$X–$Y",
        "milestone": "Measurable milestone"
      }
    ],
    "channels": ["Channel 1", "Channel 2", "Channel 3"],
    "totalInvestment": "$X–$Y",
    "expectedROI": "X–Yx in Y months based on Y assumptions",
    "quickWins": ["Immediate action 1 (can do today)", "Immediate action 2", "Immediate action 3"]
  },
  "assumptionsMap": [
    {"assumption": "Core design/market assumption", "challenge": "How this could be flipped/inverted for opportunity"}
  ],
  "flippedIdeas": [
    {
      "name": "Idea Name",
      "description": "2-3 sentence concept description with specific details",
      "visualNotes": "Physical design, materials, UX notes",
      "reasoning": "Market + user + emotional reasoning with data",
      "feasibilityNotes": "BOM estimate, manufacturer sources, tech requirements, unit economics",
      "scores": {"feasibility": 8, "desirability": 9, "profitability": 7, "novelty": 9},
      "risks": "Specific risks with mitigation strategies",
      "actionPlan": {
        "phase1": "First 60 days: specific actions",
        "phase2": "Month 3-6: scale actions",
        "phase3": "Month 7-18: growth actions",
        "timeline": "X months to market",
        "estimatedInvestment": "$X–$Y",
        "revenueProjection": "$X ARR at Y units/subscribers",
        "channels": ["Channel 1", "Channel 2"]
      }
    }
  ],
  "confidenceScores": {"adoptionLikelihood": 8, "feasibility": 7, "emotionalResonance": 9}
}

CRITICAL RULES:
- revivalScore 1-10 based on: emotional resonance + market signals + feasibility + profitability
- All score fields must be integers 1-10
- Return 3-5 products maximum — quality over quantity
- For images: use SPECIFIC Unsplash photo IDs that actually match the product (toys, cameras, electronics, games, etc.) — NOT generic tech photos. Use these verified IDs that match categories:
  * Toys/games: photo-1566240258998-c85da43741f2, photo-1558618666-fcd25c85cd64, photo-1612349317150-e413f6a5b16d
  * Cameras/photo: photo-1526170375885-4d8ecf77b99f, photo-1518791841217-8f162f1912da, photo-1495745966610-2a67f2297e5e
  * Gaming hardware: photo-1550745165-9bc0b252726f, photo-1587654780291-39c9404d746b, photo-1493711662062-fa541adb3fc8
  * Fashion/clothing: photo-1441986300917-64674bd600d8, photo-1490481651871-ab68de25d43d
  * Kitchen/food: photo-1556909114-f6e7ad7d3136, photo-1585515320310-259814833e62
  * Electronics/tech: photo-1518770660439-4636190af475, photo-1523275335684-37898b6baf30
  * Books/media: photo-1481627834876-b7833e8f5570, photo-1507003211169-0a1dd7228f2d
  * Music: photo-1511671782779-c97d3d27a1d4, photo-1510915361894-db8b60106cb1
- Include REAL, working URLs for all sources, retailers, vendors where possible
- pricingIntel must have SPECIFIC dollar figures based on actual market data from the content
- supplyChain must name REAL companies (Alibaba suppliers, Amazon, specific distributors)
- actionPlan quickWins must be actions someone could take THIS WEEK with less than $500
- trendAnalysis must include specific numbers (% growth, view counts, search volume changes)
- flippedIdeas should have 2-3 per product, each with full actionPlan
- Be specific about BOM costs, MOQs, and retail price points`;

    const userPrompt = `Analyze this scraped web content about ${eraLabel(era)}${category} products for the ${audience} market. Extract the top ${Math.min(batchSize, 5)} most revival-worthy, commercially interesting products.

Go DEEP on each product — I need pricing intel, supply chain specifics, trend data with numbers, and a detailed action plan I can actually execute. Be specific about dollar amounts, vendors, platforms, and timelines.

SCRAPED CONTENT:
${rawContent}

DISCOVERED SOURCES:
${sources.map((s: { label: string; url: string }) => `- ${s.label}: ${s.url}`).join("\n")}

Return ONLY a JSON array. Be specific, cite real companies, real prices, real platforms.`;

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
        max_tokens: 12000,
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
