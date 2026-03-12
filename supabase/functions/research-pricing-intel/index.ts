import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * Research Pricing Intelligence
 *
 * Gathers structured pricing data for a product/service category:
 *   1. Firecrawl search for competitor pricing pages
 *   2. AI extraction of structured pricing benchmarks
 *   3. Returns price ranges, models, and competitive positioning
 *
 * Provenance: SCRAPED for found prices, AI_INFERRED for estimates
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productName, category, competitors, industry, analysisType } = await req.json();

    if (!productName && !category) {
      throw new Error("productName or category is required");
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const searchTarget = productName || category;
    const competitorList = competitors?.slice(0, 5) ?? [];
    const isProduct = analysisType === "product";

    // ═══════════════════════════════════════════
    // STEP 1: Search for pricing data via Firecrawl
    // ═══════════════════════════════════════════
    const pricingResults: any[] = [];

    if (FIRECRAWL_API_KEY) {
      const queries = [
        `"${searchTarget}" pricing cost price comparison 2025 2026`,
        `${searchTarget} ${industry || ""} market price range wholesale retail`,
        ...competitorList.map((c: string) => `"${c}" pricing plans cost`),
      ];

      const searchPromises = queries.slice(0, 5).map(async (query: string) => {
        try {
          const res = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              limit: 3,
              scrapeOptions: { formats: ["markdown"] },
            }),
          });
          const data = await res.json();
          return data.data ?? [];
        } catch (err) {
          console.warn(`[pricing-intel] Search failed for "${query}":`, err);
          return [];
        }
      });

      const results = await Promise.allSettled(searchPromises);
      for (const r of results) {
        if (r.status === "fulfilled") pricingResults.push(...r.value);
      }
    }

    console.log(`[pricing-intel] Scraped ${pricingResults.length} pricing sources`);

    // ═══════════════════════════════════════════
    // STEP 2: AI extraction of structured pricing
    // ═══════════════════════════════════════════
    const scrapedContent = pricingResults
      .slice(0, 8)
      .map((r: any) => {
        const content = r.markdown?.slice(0, 800) ?? r.description ?? "";
        return `SOURCE: ${r.url ?? "unknown"}\n${content}`;
      })
      .join("\n---\n");

    const systemPrompt = isProduct
      ? `You are a pricing analyst for physical products. Extract structured pricing data from the provided sources.`
      : `You are a pricing analyst for services and SaaS. Extract structured pricing data from the provided sources.`;

    const extractionPrompt = `
Analyze these sources about "${searchTarget}" pricing and extract structured pricing intelligence.
${competitorList.length > 0 ? `Known competitors: ${competitorList.join(", ")}` : ""}
${industry ? `Industry: ${industry}` : ""}

SOURCES:
${scrapedContent || "No scraped data available — provide your best estimates based on industry knowledge."}

Return a JSON object using this tool call.`;

    const aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: extractionPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_pricing_intel",
            description: "Report structured pricing intelligence",
            parameters: {
              type: "object",
              properties: {
                pricingModel: {
                  type: "string",
                  enum: ["per_unit", "subscription", "tiered", "usage_based", "project_based", "hourly", "freemium", "outcome_based", "mixed"],
                  description: "Primary pricing model used in this market",
                },
                priceRange: {
                  type: "object",
                  properties: {
                    low: { type: "number", description: "Low end of market pricing" },
                    mid: { type: "number", description: "Mid-market pricing" },
                    high: { type: "number", description: "Premium tier pricing" },
                    unit: { type: "string", description: "Price unit (e.g., 'per unit', 'per month', 'per project')" },
                    currency: { type: "string", description: "Currency code" },
                  },
                  required: ["low", "mid", "high", "unit"],
                },
                competitorPricing: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      price: { type: "string", description: "Price or range as displayed" },
                      model: { type: "string" },
                      positioning: { type: "string", enum: ["budget", "mid_market", "premium", "enterprise"] },
                      sourceUrl: { type: "string" },
                      provenance: { type: "string", enum: ["SCRAPED", "AI_INFERRED"] },
                    },
                    required: ["name", "price", "positioning", "provenance"],
                  },
                },
                pricingTrends: {
                  type: "array",
                  items: { type: "string" },
                  description: "Key pricing trends in this market (2-4 trends)",
                },
                marginEstimate: {
                  type: "object",
                  properties: {
                    grossMarginRange: { type: "string", description: "Estimated gross margin range (e.g., '40-60%')" },
                    industryAverage: { type: "string", description: "Industry average margin" },
                    provenance: { type: "string", enum: ["SCRAPED", "PARAMETRIC", "AI_INFERRED"] },
                  },
                },
                pricingGaps: {
                  type: "array",
                  items: { type: "string" },
                  description: "Identified pricing gaps or opportunities (1-3)",
                },
              },
              required: ["pricingModel", "priceRange", "competitorPricing", "pricingTrends"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_pricing_intel" } },
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[pricing-intel] AI error:", aiRes.status, errText);

      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limited — please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI extraction failed: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    let pricingIntel;
    if (toolCall?.function?.arguments) {
      try {
        pricingIntel = JSON.parse(toolCall.function.arguments);
      } catch {
        pricingIntel = null;
      }
    }

    if (!pricingIntel) {
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to extract structured pricing data",
      }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════
    // STEP 3: Build response with provenance
    // ═══════════════════════════════════════════
    const overallProvenance = pricingResults.length >= 3 ? "SCRAPED" : pricingResults.length >= 1 ? "PARAMETRIC" : "AI_INFERRED";

    const response = {
      success: true,
      provenance: overallProvenance,
      sourcesScraped: pricingResults.length,
      searchTarget,
      pricingIntel,
      metadata: {
        sourcesUsed: pricingResults.slice(0, 8).map((r: any) => r.url).filter(Boolean),
        analysisType,
        competitorsSearched: competitorList,
      },
    };

    console.log(`[pricing-intel] Success: ${overallProvenance} provenance, ${pricingResults.length} sources`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[pricing-intel] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
