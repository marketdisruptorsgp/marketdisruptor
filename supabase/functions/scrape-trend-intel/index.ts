import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TREND_KEYWORDS = [
  { keyword: "portable espresso machine", category: "Consumer Electronics" },
  { keyword: "AI tutoring", category: "EdTech" },
  { keyword: "modular tiny home", category: "Real Estate Tech" },
  { keyword: "pet supplements", category: "Pet Care" },
  { keyword: "micro SaaS", category: "Micro-SaaS" },
  { keyword: "sustainable fashion brand", category: "Sustainable Fashion" },
  { keyword: "smart fitness tracker", category: "Fitness Tech" },
  { keyword: "DTC skincare", category: "Health & Wellness" },
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

    const allTrends: any[] = [];

    for (const { keyword, category } of TREND_KEYWORDS) {
      try {
        // Scrape Google Trends explore page
        const trendsUrl = `https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}&date=today%2012-m`;

        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: trendsUrl,
            formats: ["markdown"],
            onlyMainContent: true,
            waitFor: 5000,
          }),
        });

        let trendContent = "";
        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json();
          trendContent = scrapeData?.data?.markdown || "";
        }

        // Also search for real trend data
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `"${keyword}" market growth trend 2024 2025 statistics`,
            limit: 5,
            tbs: "qdr:y",
          }),
        });

        let searchContent = "";
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const results = searchData?.data || [];
          searchContent = results.map((r: any) => `${r.title}: ${r.description || ""}`).join("\n");
        }

        // Use AI to extract structured trend data from both sources
        const extractPrompt = `You are a market data analyst. Extract REAL, verifiable trend data for "${keyword}" from the following sources. Do NOT fabricate numbers — only include data that is explicitly stated or directly derivable from the text.

Google Trends page content:
${trendContent.substring(0, 2000)}

Search results about market trends:
${searchContent.substring(0, 2000)}

Return ONLY valid JSON:
{
  "keyword": "${keyword}",
  "category": "${category}",
  "interest_over_time": [{"month": "Mar 2024", "value": 45}, ...],
  "related_queries": ["query1", "query2", ...],
  "growth_note": "One sentence summary of what the real data shows",
  "data_quality": "high" | "medium" | "low"
}

Rules:
- interest_over_time should have 12 monthly data points if available from Google Trends (values 0-100)
- If Google Trends data isn't extractable, set interest_over_time to [] and data_quality to "low"
- related_queries should be real related search terms found in the data
- growth_note must only state facts found in the sources, not predictions`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: extractPrompt }],
            temperature: 0.1,
            max_tokens: 2000,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const raw = aiData.choices?.[0]?.message?.content || "{}";
          const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          try {
            const trend = JSON.parse(cleaned);
            allTrends.push({
              keyword: trend.keyword || keyword,
              category: trend.category || category,
              interest_over_time: trend.interest_over_time || [],
              related_queries: trend.related_queries || [],
              source: "google_trends",
              scraped_at: new Date().toISOString(),
            });
          } catch { console.error(`Trend parse failed for ${keyword}`); }
        }
      } catch (err) {
        console.error(`Error processing trend ${keyword}:`, err);
      }
    }

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
