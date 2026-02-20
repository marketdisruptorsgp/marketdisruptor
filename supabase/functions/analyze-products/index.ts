import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function eraLabel(era: string) {
  return era === "All Eras / Current" ? "" : `${era} `;
}

// Search for a real product image using Firecrawl
async function findProductImage(productName: string, category: string, apiKey: string): Promise<string | null> {
  try {
    const queries = [
      `"${productName}" product image site:ebay.com OR site:amazon.com OR site:wikipedia.org`,
      `${productName} vintage original photo`,
    ];
    
    for (const query of queries) {
      const res = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit: 3,
          scrapeOptions: { formats: ["links", "markdown"] },
        }),
      });
      
      if (!res.ok) continue;
      const data = await res.json();
      
      for (const item of (data?.data || [])) {
        // Check links array for image URLs
        const links: string[] = item.links || [];
        for (const link of links) {
          if (
            /\.(jpg|jpeg|png|webp)/i.test(link) &&
            link.length > 20 &&
            !link.includes("logo") &&
            !link.includes("icon") &&
            !link.includes("favicon") &&
            !link.includes("banner") &&
            (link.includes("i.ebayimg") || link.includes("m.media-amazon") || link.includes("upload.wikimedia") || link.includes("etsy.com/il"))
          ) {
            console.log(`Found real image for ${productName}: ${link}`);
            return link;
          }
        }
        
        // Also extract from markdown — look for ![...](url) patterns
        const md: string = item.markdown || "";
        const imgMatches = md.match(/!\[.*?\]\((https?:\/\/[^\s\)]+\.(jpg|jpeg|png|webp))[^\)]*\)/gi);
        if (imgMatches?.length) {
          const imgUrl = imgMatches[0].match(/\((https?:\/\/[^\s\)]+)\)/)?.[1];
          if (imgUrl && !imgUrl.includes("logo") && !imgUrl.includes("icon")) {
            console.log(`Found markdown image for ${productName}: ${imgUrl}`);
            return imgUrl;
          }
        }
      }
    }
  } catch (e) {
    console.error("Image search error:", e);
  }
  return null;
}

// Category fallback images from Unsplash (verified IDs)
const CATEGORY_IMAGES: Record<string, string> = {
  "Electronic Toys": "https://images.unsplash.com/photo-1566240258998-c85da43741f2?w=600&h=400&fit=crop",
  "Instant Photography": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop",
  "Photography": "https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?w=600&h=400&fit=crop",
  "Gaming Hardware": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop",
  "Toys": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
  "Toys & Games": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
  "Fashion": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
  "Kitchen": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
  "Music": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop",
  "Electronics": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop",
  "default": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rawContent, redditContent, complaintsContent, sources, category, era, batchSize, customProducts } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    const systemPrompt = `You are a world-class Product Intelligence AI and venture market analyst. You analyze scraped web content (including Reddit community posts, Google discussions, competitor data, and market signals) to extract deep, actionable product intelligence.

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
  "keyInsight": "The single most provocative non-obvious commercial insight about this product — 1-2 sentences, be bold and specific",
  "marketSizeEstimate": "TAM estimate with source/basis",
  "image": "PLACEHOLDER_IMAGE",
  "sources": [{"label": "Source Name", "url": "https://actual-url.com"}],
  "reviews": [
    {"text": "Specific real review or community quote from scraped content", "sentiment": "positive"},
    {"text": "Specific real complaint with context — what people hate about it", "sentiment": "negative"},
    {"text": "Community suggestion or improvement request from Reddit/forums", "sentiment": "neutral"}
  ],
  "communityInsights": {
    "redditSentiment": "Overall Reddit community sentiment: what they love, hate, and want changed (2-3 sentences with specific subreddit references)",
    "topComplaints": ["Specific complaint 1 from community", "Specific complaint 2", "Specific complaint 3"],
    "improvementRequests": ["Feature/change request 1 from community", "Request 2", "Request 3"],
    "nostalgiaTriggers": ["What specifically triggers nostalgia", "Core emotional hook", "Community shared memory"],
    "competitorComplaints": ["What community says is wrong with current alternatives"]
  },
  "socialSignals": [
    {"platform": "TikTok", "signal": "specific content type", "volume": "~50M views", "trend": "up", "url": "https://tiktok.com/tag/example"},
    {"platform": "Reddit", "signal": "subreddit activity", "volume": "~50K members", "trend": "stable", "url": "https://reddit.com/r/example"},
    {"platform": "Google Trends", "signal": "search interest description", "volume": "Index 78/100", "trend": "up"}
  ],
  "competitors": ["Competitor 1 (price)", "Competitor 2 (price)"],
  "competitorAnalysis": {
    "marketLeader": "Who dominates and why",
    "gaps": ["Gap 1 in current market", "Gap 2", "Gap 3"],
    "differentiationOpportunity": "Specific angle to win market share"
  },
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
    "suppliers": [{"name": "Supplier Name", "region": "Country/Region", "url": "https://url.com", "role": "What they supply"}],
    "manufacturers": [{"name": "Manufacturer", "region": "Country", "url": "https://url.com", "moq": "Min order qty"}],
    "vendors": [{"name": "Vendor Name", "type": "Specialty/Mass/Import", "url": "https://url.com", "notes": "Context"}],
    "retailers": [{"name": "Retailer", "type": "E-commerce/Mass/Specialty", "url": "https://url.com", "marketShare": "X%"}],
    "distributors": [{"name": "Distributor", "region": "Region", "url": "https://url.com", "notes": "Context"}]
  },
  "trendAnalysis": "Detailed 4-5 sentence trend analysis with SPECIFIC data: search volumes, YoY growth rates, Reddit post velocity, key events driving interest, Google Trends index, TikTok view counts, demographic shift data",
  "actionPlan": {
    "strategy": "2-3 sentence overall strategic direction — be specific about the angle (flip, revive, license, arbitrage, innovate, subscription)",
    "phases": [
      {
        "phase": "Phase 1 Name",
        "timeline": "Month X–Y",
        "actions": ["Specific action 1 with concrete steps", "Action 2 naming real vendors/platforms"],
        "budget": "$X–$Y",
        "milestone": "Measurable outcome to validate"
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
    "expectedROI": "X–Yx in Y months",
    "quickWins": ["Action someone can take THIS WEEK under $500", "Quick win 2", "Quick win 3"]
  },
  "assumptionsMap": [
    {"assumption": "Core design/market assumption", "challenge": "How this could be flipped/inverted for opportunity"}
  ],
  "flippedIdeas": [
    {
      "name": "Idea Name",
      "description": "2-3 sentence concept description with specific details",
      "visualNotes": "Physical design, materials, UX notes",
      "reasoning": "Market + user + emotional reasoning with specific data from community sentiment",
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
- All score fields MUST be integers 1-10
- Return 3-5 products maximum — quality over quantity
- Set "image" to "PLACEHOLDER_IMAGE" — images will be replaced with real ones after
- communityInsights MUST be based on real Reddit/Google data from the scraped content, not invented
- topComplaints MUST be specific real complaints found in the scraped data
- improvementRequests MUST be real things the community has asked for
- competitorAnalysis.gaps must be specific market gaps visible in the data
- Include REAL, working URLs for all sources, retailers, vendors where possible
- pricingIntel must have SPECIFIC dollar figures from real market data
- supplyChain must name REAL companies (real Alibaba suppliers, real Amazon, real distributors)
- actionPlan quickWins must be actions someone could take THIS WEEK with less than $500
- trendAnalysis must include specific numbers (% growth, view counts, search volumes)
- flippedIdeas should have 2-3 per product and directly address community complaints/requests
- Be BOLD — the flipped ideas should surprise and inspire, not just iterate`;

    const customProductsContext = customProducts && customProducts.length > 0
      ? `\n\nCUSTOM PRODUCTS UPLOADED BY USER (PRIORITIZE THESE IN ANALYSIS):\n${customProducts.map((cp: { productName?: string; productUrl?: string; notes?: string; hasImage?: boolean }) =>
          `- Name: ${cp.productName || "Unknown"}\n  URL: ${cp.productUrl || "None"}\n  Notes: ${cp.notes || "None"}\n  Has Image: ${cp.hasImage ? "Yes (user uploaded)" : "No"}`
        ).join("\n")}`
      : "";

    // Trim inputs to prevent timeout — keep total prompt under ~25K chars
    const trimmedRaw = (rawContent || "").slice(0, 12000);
    const trimmedReddit = (redditContent || "").slice(0, 3000);
    const trimmedComplaints = (complaintsContent || "").slice(0, 2000);
    const trimmedSources = (sources || []).slice(0, 15);

    const userPrompt = `Analyze this scraped content about ${eraLabel(era)}${category} products.${customProductsContext}

Go DEEP — I need:
1. Real Reddit community sentiment (what people love, hate, want fixed)
2. Actual competitor gaps from community complaints  
3. Pricing intel with real dollar figures
4. Supply chain with real company names
5. Flipped ideas that directly address community pain points
6. An action plan I can start executing this week
${customProducts?.length ? "7. IMPORTANT: Include ALL custom products the user uploaded/provided as top-priority analyses" : ""}

MAIN SCRAPED CONTENT (eBay, Etsy, Google, TikTok):
${trimmedRaw}

REDDIT COMMUNITY POSTS (sentiment, complaints, discussions):
${trimmedReddit || "No Reddit content available"}

COMMUNITY COMPLAINTS & IMPROVEMENT REQUESTS:
${trimmedComplaints || "No complaint signals found"}

DISCOVERED SOURCES:
${trimmedSources.map((s: { label: string; url: string }) => `- ${s.label}: ${s.url}`).join("\n")}

Return ONLY a JSON array. Be specific, cite real companies, real prices, real platforms. Make flippedIdeas address real community pain points.`;

    console.log("Calling AI gateway for deep product analysis...");

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 16000,
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

    // Strip markdown code fences
    let cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    // Extract JSON array portion — find first [ and last ]
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.slice(firstBracket, lastBracket + 1);
    }

    let products;
    try {
      products = JSON.parse(cleaned);
    } catch {
      // If JSON is truncated, try to salvage any complete product objects
      console.error("JSON parse failed, attempting salvage. Raw:", cleaned.slice(0, 300));
      // Try to find complete objects by matching balanced braces
      const salvaged: unknown[] = [];
      let depth = 0;
      let start = -1;
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === "{") { if (depth === 0) start = i; depth++; }
        else if (cleaned[i] === "}") {
          depth--;
          if (depth === 0 && start !== -1) {
            try { salvaged.push(JSON.parse(cleaned.slice(start, i + 1))); } catch { /* skip incomplete */ }
            start = -1;
          }
        }
      }
      if (salvaged.length > 0) {
        console.log(`Salvaged ${salvaged.length} product(s) from truncated JSON`);
        products = salvaged;
      } else {
        throw new Error("AI returned invalid JSON. Please retry.");
      }
    }

    if (!Array.isArray(products)) {
      products = [products];
    }

    // Now fetch real images for each product via Firecrawl
    if (FIRECRAWL_API_KEY) {
      console.log(`Searching for real product images for ${products.length} products...`);
      const imagePromises = products.map(async (product: { name: string; category: string }) => {
        const realImage = await findProductImage(product.name, product.category, FIRECRAWL_API_KEY);
        return realImage;
      });
      
      const realImages = await Promise.all(imagePromises);
      
      products = products.map((product: { image: string; category: string }, i: number) => {
        const realImage = realImages[i];
        const fallback = CATEGORY_IMAGES[product.category] || CATEGORY_IMAGES["default"];
        return {
          ...product,
          image: realImage || fallback,
          imageSource: realImage ? "firecrawl" : "fallback",
        };
      });
      
      console.log(`Image search complete. Real images found: ${realImages.filter(Boolean).length}/${products.length}`);
    } else {
      // Use category fallbacks if no Firecrawl
      products = products.map((product: { image: string; category: string }) => ({
        ...product,
        image: product.image === "PLACEHOLDER_IMAGE"
          ? (CATEGORY_IMAGES[product.category] || CATEGORY_IMAGES["default"])
          : product.image,
      }));
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
