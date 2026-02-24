import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_RESULTS = 10;

// Dynamic discovery queries — NOT hardcoded categories
const DISCOVERY_QUERIES = [
  "fastest growing consumer search trends 2025 2026",
  "trending product categories rising demand 2025 2026",
  "breakout search keywords ecommerce 2025 2026",
  "viral product trends gaining traction 2025 2026",
  "emerging market categories consumer interest 2025 2026",
  "top rising search queries retail technology 2025 2026",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Phase 1: Search for real trend data across multiple queries
    let allSearchContent = "";
    for (const query of DISCOVERY_QUERIES) {
      try {
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, limit: 8, tbs: "qdr:m" }),
        });

        if (!searchRes.ok) continue;
        const searchData = await searchRes.json();
        const results = searchData?.data || [];
        allSearchContent += results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.description || ""}\nContent: ${(r.markdown || "").substring(0, 500)}`).join("\n---\n") + "\n\n";
      } catch (err) {
        console.error(`Search error:`, err);
      }
    }

    if (!allSearchContent) throw new Error("No search results obtained");

    // Phase 2: Use AI to extract real trends with data — no hardcoded categories
    const extractPrompt = `You are a market intelligence analyst. From the following real search results, identify the ${MIN_RESULTS} most compelling search trend signals with verifiable data.

IMPORTANT: Do NOT use a fixed category list. Dynamically assign a short category name (2-3 words) based on what each trend actually covers.

Return ONLY a valid JSON array with exactly ${MIN_RESULTS} items:
[{
  "keyword": "Specific trending keyword or product concept",
  "category": "Dynamically assigned 2-3 word category",
  "interest_over_time": [{"month": "Mar 2025", "value": 45}, {"month": "Apr 2025", "value": 52}, ...],
  "related_queries": ["related term 1", "related term 2", "related term 3"],
  "growth_note": "One sentence with specific data/stats from the sources (cite numbers, percentages, dollar figures)",
  "opportunity_angle": "2-3 sentences explaining the business opportunity this trend creates for entrepreneurs or investors. Be specific about WHO could capitalize, HOW, and what the addressable market looks like.",
  "data_quality": "high" or "medium" (high = multiple corroborating sources with hard data, medium = single source or directional signals only),
  "source_urls": ["https://source1.com/article", "https://source2.com/report"]
}]

Search results:
${allSearchContent.substring(0, 12000)}

Rules:
- interest_over_time MUST have exactly 12 monthly data points (values 0-100, showing growth trajectory)
- Base the trajectory shape on real evidence from the articles (growing, peaking, accelerating, etc.)
- related_queries should be 3-5 real related search terms
- growth_note must reference specific data found in the sources — cite real numbers
- opportunity_angle must be actionable — explain the gap, the timing advantage, and the target customer
- source_urls MUST be real URLs extracted from the search results — include 1-3 per trend
- Each keyword should be distinct and specific (not generic like "AI" — use "AI code assistants" or "AI skincare diagnostics")
- Categories must be dynamically inferred from content, NOT from any preset list`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: extractPrompt }],
        temperature: 0.3,
        max_tokens: 6000,
      }),
    });

    if (!aiRes.ok) throw new Error(`AI call failed: ${aiRes.status}`);

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || "[]";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let trends: any[];
    try {
      trends = JSON.parse(cleaned);
      if (!Array.isArray(trends)) trends = trends.trends || trends.data || [];
    } catch {
      throw new Error("Failed to parse trend data");
    }

    const allTrends = trends.slice(0, 15).map((t: any) => ({
      keyword: t.keyword || "Unknown",
      category: t.category || "General",
      interest_over_time: Array.isArray(t.interest_over_time) ? t.interest_over_time : [],
      related_queries: Array.isArray(t.related_queries) ? t.related_queries : [],
      growth_note: t.growth_note || null,
      opportunity_angle: t.opportunity_angle || null,
      source_urls: Array.isArray(t.source_urls) ? t.source_urls : [],
      data_quality: t.data_quality || "medium",
      source: "web_search",
      scraped_at: new Date().toISOString(),
    }));

    // Store trends
    if (allTrends.length > 0) {
      await supabase.from("trend_signals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error } = await supabase.from("trend_signals").insert(allTrends);
      if (error) throw new Error(`Trend insert failed: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, trends: allTrends.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Trend scraping error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
