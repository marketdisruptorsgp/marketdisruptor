import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_RESULTS = 10;

const DISCOVERY_QUERIES = [
  "fastest growing consumer search trends 2025 2026",
  "trending product categories rising demand 2025 2026",
  "breakout search keywords ecommerce 2025 2026",
  "viral product trends gaining traction 2025 2026",
  "emerging market categories consumer interest 2025 2026",
  "top rising search queries retail technology 2025 2026",
];

// ── Fetch REAL Google Trends interest-over-time via unofficial API ──
async function fetchRealTrendsData(keyword: string): Promise<{ month: string; value: number }[] | null> {
  try {
    // Google Trends explore endpoint (unofficial, same as what pytrends/deno-google-trends uses)
    const now = Math.floor(Date.now() / 1000);
    const oneYearAgo = now - 365 * 24 * 60 * 60;

    // Use the Google Trends multiline API with a single keyword
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=-300&req=${encodeURIComponent(
      JSON.stringify({
        time: `${new Date(oneYearAgo * 1000).toISOString().split("T")[0]} ${new Date().toISOString().split("T")[0]}`,
        resolution: "MONTH",
        locale: "en-US",
        comparisonItem: [{ keyword, geo: "", time: `${new Date(oneYearAgo * 1000).toISOString().split("T")[0]} ${new Date().toISOString().split("T")[0]}` }],
        requestOptions: { property: "", backend: "IZG", category: 0 },
      })
    )}&token=`;

    // The unofficial API requires a token; instead, use the simpler embed endpoint
    const embedUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=-300&req=${encodeURIComponent(
      JSON.stringify({
        comparisonItem: [{ keyword, geo: "", time: "today 12-m" }],
        category: 0,
        property: "",
      })
    )}`;

    const exploreRes = await fetch(embedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrendBot/1.0)" },
    });

    if (!exploreRes.ok) {
      console.log(`Google Trends explore failed for "${keyword}": ${exploreRes.status}`);
      return null;
    }

    const exploreText = await exploreRes.text();
    // Google prepends ")]}'" to prevent JSON hijacking
    const cleanExplore = exploreText.replace(/^\)\]\}\'\n/, "");
    const exploreData = JSON.parse(cleanExplore);

    // Extract the token for the TIMESERIES widget
    const timeseriesWidget = exploreData?.widgets?.find((w: any) => w.id === "TIMESERIES");
    if (!timeseriesWidget?.token) {
      console.log(`No TIMESERIES widget found for "${keyword}"`);
      return null;
    }

    // Now fetch actual timeseries data
    const timeseriesReq = timeseriesWidget.request;
    const multilineUrl = `https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=-300&req=${encodeURIComponent(
      JSON.stringify(timeseriesReq)
    )}&token=${timeseriesWidget.token}`;

    const dataRes = await fetch(multilineUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TrendBot/1.0)" },
    });

    if (!dataRes.ok) {
      console.log(`Google Trends data fetch failed for "${keyword}": ${dataRes.status}`);
      return null;
    }

    const dataText = await dataRes.text();
    const cleanData = dataText.replace(/^\)\]\}\'\n/, "");
    const parsed = JSON.parse(cleanData);

    const timelineData = parsed?.default?.timelineData;
    if (!Array.isArray(timelineData) || timelineData.length === 0) {
      console.log(`No timeline data for "${keyword}"`);
      return null;
    }

    // Convert to monthly points — take last 12 months
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const points = timelineData.slice(-12).map((point: any) => {
      const ts = parseInt(point.time) * 1000;
      const date = new Date(ts);
      const month = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      const value = point.value?.[0] ?? 0;
      return { month, value };
    });

    console.log(`✓ Real Google Trends data for "${keyword}": ${points.length} points`);
    return points;
  } catch (err) {
    console.error(`Google Trends fetch error for "${keyword}":`, err);
    return null;
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

    // ── Phase 1: Discover trending keywords via Firecrawl + AI ──
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
        allSearchContent += results.map((r: any) =>
          `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.description || ""}\nContent: ${(r.markdown || "").substring(0, 500)}`
        ).join("\n---\n") + "\n\n";
      } catch (err) {
        console.error(`Search error:`, err);
      }
    }

    if (!allSearchContent) throw new Error("No search results obtained");

    // ── Phase 2: AI extracts keyword list + enrichment (but NOT interest_over_time) ──
    const extractPrompt = `You are a market intelligence analyst. From the following real search results, identify the ${MIN_RESULTS} most compelling, specific trending keywords.

Return ONLY a valid JSON array with exactly ${MIN_RESULTS} items:
[{
  "keyword": "Specific trending keyword or product concept (2-5 words, must be a real searchable term on Google Trends)",
  "category": "Dynamically assigned 2-3 word category",
  "related_queries": ["related term 1", "related term 2", "related term 3", "related term 4"],
  "growth_note": "One sentence with specific data/stats from the sources (cite numbers, percentages, dollar figures)",
  "opportunity_angle": "2-3 sentences explaining the business opportunity this trend creates for entrepreneurs or investors. Be specific about WHO could capitalize, HOW, and what the addressable market looks like.",
  "source_urls": ["https://source1.com/article", "https://source2.com/report"]
}]

Search results:
${allSearchContent.substring(0, 12000)}

Rules:
- keyword MUST be a real, specific search term people actually type into Google (e.g. "AI code review tools" not "artificial intelligence")
- related_queries should be 3-5 real related Google search terms
- growth_note must reference specific data found in the sources — cite real numbers
- opportunity_angle must be actionable
- source_urls MUST be real URLs from the search results
- Each keyword must be distinct and specific
- Categories must be dynamically inferred from content`;

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
        max_tokens: 5000,
      }),
    });

    if (!aiRes.ok) throw new Error(`AI call failed: ${aiRes.status}`);

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || "[]";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let keywords: any[];
    try {
      keywords = JSON.parse(cleaned);
      if (!Array.isArray(keywords)) keywords = keywords.trends || keywords.data || [];
    } catch {
      throw new Error("Failed to parse keyword data");
    }

    // ── Phase 3: Fetch REAL Google Trends data in parallel batches ──
    const keywordSlice = keywords.slice(0, 12);
    console.log(`Fetching real Google Trends data for ${keywordSlice.length} keywords...`);

    // Batch in groups of 3 for parallelism without hammering
    const BATCH_SIZE = 3;
    const trendResults: { keyword: string; data: any; realData: any[] | null }[] = [];

    for (let i = 0; i < keywordSlice.length; i += BATCH_SIZE) {
      const batch = keywordSlice.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (t: any) => {
          const kw = t.keyword || "Unknown";
          const realData = await fetchRealTrendsData(kw);
          return { keyword: kw, data: t, realData };
        })
      );
      trendResults.push(...batchResults);
      // Brief pause between batches
      if (i + BATCH_SIZE < keywordSlice.length) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    let realDataCount = 0;
    let modeledDataCount = 0;
    const allTrends = trendResults.map(({ keyword, data: t, realData }) => {
      const hasRealData = realData && realData.length >= 6;
      if (hasRealData) realDataCount++;
      else modeledDataCount++;

      return {
        keyword,
        category: t.category || "General",
        interest_over_time: hasRealData ? realData : [],
        related_queries: Array.isArray(t.related_queries) ? t.related_queries : [],
        growth_note: t.growth_note || null,
        opportunity_angle: t.opportunity_angle || null,
        source_urls: Array.isArray(t.source_urls) ? t.source_urls : [],
        data_quality: hasRealData ? "high" : "medium",
        source: hasRealData ? "google_trends" : "web_search",
        scraped_at: new Date().toISOString(),
      };
    });

    console.log(`Data quality: ${realDataCount} real Google Trends, ${modeledDataCount} without chart data`);

    // ── Phase 4: Store trends ──
    if (allTrends.length > 0) {
      await supabase.from("trend_signals").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const { error } = await supabase.from("trend_signals").insert(allTrends);
      if (error) throw new Error(`Trend insert failed: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        trends: allTrends.length,
        real_data: realDataCount,
        modeled_data: modeledDataCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Trend scraping error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
