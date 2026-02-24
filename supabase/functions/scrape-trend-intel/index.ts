import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_RESULTS = 10;
const SERPAPI_BUDGET_PER_REFRESH = 5; // Only use SerpAPI for top 5 keywords
const MONTHLY_LIMIT = 250;

const DISCOVERY_QUERIES = [
  "fastest growing consumer search trends 2025 2026",
  "trending product categories rising demand 2025 2026",
  "breakout search keywords ecommerce 2025 2026",
  "viral product trends gaining traction 2025 2026",
  "emerging market categories consumer interest 2025 2026",
  "top rising search queries retail technology 2025 2026",
];

// ── Fetch real Google Trends data via SerpAPI ──
async function fetchSerpApiTrends(
  keyword: string,
  apiKey: string
): Promise<{ month: string; value: number }[] | null> {
  try {
    const params = new URLSearchParams({
      engine: "google_trends",
      q: keyword,
      date: "today 12-m",
      api_key: apiKey,
    });

    const res = await fetch(`https://serpapi.com/search.json?${params}`);
    if (!res.ok) {
      console.log(`SerpAPI failed for "${keyword}": ${res.status}`);
      return null;
    }

    const data = await res.json();
    const timeline = data?.interest_over_time?.timeline_data;
    if (!Array.isArray(timeline) || timeline.length === 0) {
      console.log(`No SerpAPI timeline data for "${keyword}"`);
      return null;
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const points = timeline.slice(-12).map((point: any) => {
      const dateStr = point.date || "";
      // SerpAPI returns dates like "Jan 1 – 7, 2025" — extract month/year
      const match = dateStr.match(/([A-Za-z]+)\s.*?(\d{4})/);
      const month = match
        ? `${match[1].substring(0, 3)} ${match[2]}`
        : dateStr.substring(0, 8);
      const value = point.values?.[0]?.extracted_value ?? 0;
      return { month, value };
    });

    // Deduplicate by month (take last occurrence)
    const seen = new Map<string, number>();
    for (const p of points) {
      seen.set(p.month, p.value);
    }
    const deduped = Array.from(seen.entries()).map(([month, value]) => ({ month, value }));

    console.log(`✓ SerpAPI real data for "${keyword}": ${deduped.length} points`);
    return deduped.length >= 2 ? deduped : null;
  } catch (err) {
    console.error(`SerpAPI error for "${keyword}":`, err);
    return null;
  }
}

// ── Track and check API usage ──
async function getUsageThisMonth(supabase: any): Promise<number> {
  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("api_usage")
    .select("calls_used")
    .eq("service", "serpapi")
    .eq("period_start", periodStart.toISOString())
    .maybeSingle();

  return data?.calls_used ?? 0;
}

async function incrementUsage(supabase: any, count: number): Promise<void> {
  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const current = await getUsageThisMonth(supabase);

  if (current === 0) {
    await supabase.from("api_usage").insert({
      service: "serpapi",
      calls_used: count,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    });
  } else {
    await supabase
      .from("api_usage")
      .update({ calls_used: current + count, updated_at: new Date().toISOString() })
      .eq("service", "serpapi")
      .eq("period_start", periodStart.toISOString());
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SERPAPI_API_KEY = Deno.env.get("SERPAPI_API_KEY") || "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Check SerpAPI budget ──
    const usedThisMonth = await getUsageThisMonth(supabase);
    const remainingBudget = Math.max(0, MONTHLY_LIMIT - usedThisMonth);
    const serpApiSlots = SERPAPI_API_KEY
      ? Math.min(SERPAPI_BUDGET_PER_REFRESH, remainingBudget)
      : 0;

    console.log(`SerpAPI budget: ${usedThisMonth}/${MONTHLY_LIMIT} used, ${serpApiSlots} slots this refresh`);

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
        allSearchContent += results
          .map(
            (r: any) =>
              `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.description || ""}\nContent: ${(r.markdown || "").substring(0, 500)}`
          )
          .join("\n---\n") + "\n\n";
      } catch (err) {
        console.error(`Search error:`, err);
      }
    }

    if (!allSearchContent) throw new Error("No search results obtained");

    // ── Phase 2: AI extracts keyword list + enrichment ──
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

    // ── Phase 3: Hybrid data — SerpAPI for top N, modeled for rest ──
    const keywordSlice = keywords.slice(0, 12);
    const serpApiKeywords = keywordSlice.slice(0, serpApiSlots);
    const modeledKeywords = keywordSlice.slice(serpApiSlots);

    console.log(
      `Fetching: ${serpApiKeywords.length} via SerpAPI, ${modeledKeywords.length} modeled-only`
    );

    // Fetch SerpAPI data (sequential to respect rate limits)
    let serpApiCallsMade = 0;
    const allTrends: any[] = [];

    for (const t of serpApiKeywords) {
      const kw = t.keyword || "Unknown";
      const realData = await fetchSerpApiTrends(kw, SERPAPI_API_KEY);
      serpApiCallsMade++;

      allTrends.push({
        keyword: kw,
        category: t.category || "General",
        interest_over_time: realData || [],
        related_queries: Array.isArray(t.related_queries) ? t.related_queries : [],
        growth_note: t.growth_note || null,
        opportunity_angle: t.opportunity_angle || null,
        source_urls: Array.isArray(t.source_urls) ? t.source_urls : [],
        data_quality: realData ? "high" : "medium",
        source: realData ? "google_trends" : "web_search",
        scraped_at: new Date().toISOString(),
      });

      // Small delay between SerpAPI calls
      if (serpApiKeywords.indexOf(t) < serpApiKeywords.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    // Modeled keywords (no API call, AI-enriched only)
    for (const t of modeledKeywords) {
      allTrends.push({
        keyword: t.keyword || "Unknown",
        category: t.category || "General",
        interest_over_time: [],
        related_queries: Array.isArray(t.related_queries) ? t.related_queries : [],
        growth_note: t.growth_note || null,
        opportunity_angle: t.opportunity_angle || null,
        source_urls: Array.isArray(t.source_urls) ? t.source_urls : [],
        data_quality: "medium",
        source: "web_search",
        scraped_at: new Date().toISOString(),
      });
    }

    // Track SerpAPI usage
    if (serpApiCallsMade > 0) {
      await incrementUsage(supabase, serpApiCallsMade);
    }

    const realDataCount = allTrends.filter((t) => t.data_quality === "high").length;
    const modeledDataCount = allTrends.length - realDataCount;
    console.log(
      `Data quality: ${realDataCount} real (SerpAPI), ${modeledDataCount} modeled. ` +
        `SerpAPI calls this refresh: ${serpApiCallsMade}. Month total: ${usedThisMonth + serpApiCallsMade}/${MONTHLY_LIMIT}`
    );

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
        serpapi_calls_made: serpApiCallsMade,
        serpapi_budget_remaining: remainingBudget - serpApiCallsMade,
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
