import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NEWS_QUERIES = [
  { query: "startup funding round 2025 2026 product launch", category: "Startups & Funding" },
  { query: "consumer product innovation 2025 2026 new launch", category: "Product Innovation" },
  { query: "SEC filing IPO acquisition merger 2025 2026", category: "Regulatory & M&A" },
  { query: "ecommerce DTC brand trend 2025 2026", category: "E-Commerce" },
  { query: "AI machine learning product application 2025 2026", category: "AI & Technology" },
  { query: "sustainability circular economy product 2025 2026", category: "Sustainability" },
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

    const allNews: any[] = [];

    for (const { query, category } of NEWS_QUERIES) {
      try {
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: 5,
            tbs: "qdr:w", // last week
          }),
        });

        if (!searchRes.ok) {
          console.error(`Search failed for ${category}: ${searchRes.status}`);
          continue;
        }

        const searchData = await searchRes.json();
        const results = searchData?.data || [];

        if (results.length === 0) continue;

        const extractPrompt = `Extract news items from these search results about "${query}". Return ONLY valid JSON array:
[{"title":"Headline","summary":"1-2 sentence summary","source_name":"Publication Name","source_url":"https://...","published_at":"YYYY-MM-DD"}]

Search results:
${results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description || ""}`).join("\n---\n")}

Return 3-5 items maximum. Only include real news with verifiable titles and sources. Return empty array [] if nothing qualifies.`;

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
            max_tokens: 3000,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const raw = aiData.choices?.[0]?.message?.content || "[]";
          const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          try {
            let items = JSON.parse(cleaned);
            if (!Array.isArray(items)) items = [];
            for (const item of items) {
              allNews.push({ ...item, category, scraped_at: new Date().toISOString() });
            }
          } catch { console.error(`JSON parse failed for ${category}`); }
        }
      } catch (err) {
        console.error(`Error processing ${category}:`, err);
      }
    }

    // Helper to validate date strings
    const isValidDate = (d: any) => {
      if (!d || typeof d !== "string") return false;
      return /^\d{4}-\d{2}-\d{2}/.test(d) && !isNaN(Date.parse(d));
    };

    // Clear old and insert new
    if (allNews.length > 0) {
      await supabase.from("market_news").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const rows = allNews.map((n) => ({
        title: n.title || "Untitled",
        summary: n.summary || null,
        source_name: n.source_name || "Unknown",
        source_url: n.source_url || null,
        category: n.category,
        published_at: isValidDate(n.published_at) ? n.published_at : null,
        scraped_at: n.scraped_at,
      }));

      const { error } = await supabase.from("market_news").insert(rows);
      if (error) throw new Error(`News insert failed: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, news: allNews.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Market news scraping error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
