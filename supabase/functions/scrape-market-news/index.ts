import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_RESULTS = 10;

const NEWS_QUERIES = [
  "startup funding round 2025 2026 product launch",
  "consumer product innovation 2025 2026 new launch",
  "SEC filing IPO acquisition merger 2025 2026",
  "ecommerce DTC brand trend 2025 2026",
  "AI machine learning product application 2025 2026",
  "sustainability circular economy product 2025 2026",
];

const FALLBACK_QUERIES = [
  "venture capital startup news",
  "product market disruption trend",
  "technology innovation business 2025",
  "retail consumer brand growth",
];

async function extractNews(
  results: any[],
  query: string,
  cutoffDate: string,
  LOVABLE_API_KEY: string,
): Promise<any[]> {
  const extractPrompt = `Extract news items from these search results about "${query}". For each item, dynamically assign the best-fitting category based on the article's actual content — do NOT use a fixed category list.

Return ONLY valid JSON array:
[{"title":"Headline","summary":"1-2 sentence summary","source_name":"Publication Name","source_url":"https://...","published_at":"YYYY-MM-DD","category":"Dynamically Assigned Category"}]

Search results:
${results.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description || ""}`).join("\n---\n")}

Return up to 5 items. Only include real news with verifiable titles and sources. CRITICAL: Only include articles published on or after ${cutoffDate}. Return empty array [] if nothing qualifies.`;

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

  if (!aiRes.ok) return [];

  const aiData = await aiRes.json();
  const raw = aiData.choices?.[0]?.message?.content || "[]";
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    let items = JSON.parse(cleaned);
    if (!Array.isArray(items)) return [];
    return items.map((item: any) => ({
      ...item,
      scraped_at: new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0];

    // Phase 1: primary queries (last month)
    for (const query of NEWS_QUERIES) {
      try {
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, limit: 5, tbs: "qdr:m" }),
        });

        if (!searchRes.ok) { console.error(`Search failed for query: ${searchRes.status}`); continue; }

        const searchData = await searchRes.json();
        const results = searchData?.data || [];
        if (results.length === 0) continue;

        const items = await extractNews(results, query, cutoffDate, LOVABLE_API_KEY);
        allNews.push(...items);
      } catch (err) {
        console.error(`Error processing query:`, err);
      }
    }

    // Phase 2: broadened fallback if below minimum
    if (allNews.length < MIN_RESULTS) {
      console.log(`Only ${allNews.length} results after phase 1, broadening to last year...`);
      const yearAgoCutoff = new Date();
      yearAgoCutoff.setFullYear(yearAgoCutoff.getFullYear() - 1);
      const yearCutoffDate = yearAgoCutoff.toISOString().split("T")[0];

      for (const query of FALLBACK_QUERIES) {
        if (allNews.length >= MIN_RESULTS) break;
        try {
          const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query, limit: 5, tbs: "qdr:y" }),
          });

          if (!searchRes.ok) continue;
          const searchData = await searchRes.json();
          const results = searchData?.data || [];
          if (results.length === 0) continue;

          const items = await extractNews(results, query, yearCutoffDate, LOVABLE_API_KEY);
          allNews.push(...items);
        } catch (err) {
          console.error(`Fallback error:`, err);
        }
      }
    }

    // Helper to validate date strings
    const isValidDate = (d: any) => {
      if (!d || typeof d !== "string") return false;
      return /^\d{4}-\d{2}-\d{2}/.test(d) && !isNaN(Date.parse(d));
    };

    // Deduplicate by title
    const seen = new Set<string>();
    const recentNews = allNews.filter((n) => {
      const key = (n.title || "").toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort newest first
    recentNews.sort((a, b) => {
      const da = isValidDate(a.published_at) ? new Date(a.published_at).getTime() : 0;
      const db = isValidDate(b.published_at) ? new Date(b.published_at).getTime() : 0;
      return db - da;
    });

    // Clear old and insert new
    if (recentNews.length > 0) {
      await supabase.from("market_news").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const rows = recentNews.map((n) => ({
        title: n.title || "Untitled",
        summary: n.summary || null,
        source_name: n.source_name || "Unknown",
        source_url: n.source_url || null,
        category: n.category || "General",
        published_at: isValidDate(n.published_at) ? n.published_at : null,
        scraped_at: n.scraped_at,
      }));

      const { error } = await supabase.from("market_news").insert(rows);
      if (error) throw new Error(`News insert failed: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, news: recentNews.length }), {
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
