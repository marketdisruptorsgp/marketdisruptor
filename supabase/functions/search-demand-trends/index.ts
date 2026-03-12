import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Search Demand Trends — Google Trends via SerpAPI
 *
 * Returns interest-over-time data, related queries, and rising trends
 * for a set of keywords related to the business being analyzed.
 *
 * Data sources:
 *   - SerpAPI Google Trends (interest_over_time, related_queries)
 *   - SerpAPI Google Trends Autocomplete (rising searches)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { keywords, industry, geo, timeRange } = await req.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      throw new Error("keywords array is required (1-5 terms)");
    }

    const SERPAPI_KEY = Deno.env.get("SERPAPI_API_KEY");
    if (!SERPAPI_KEY) {
      throw new Error("SERPAPI_API_KEY not configured");
    }

    const searchKeywords = keywords.slice(0, 5);
    const geoCode = geo || "US";
    const date = timeRange || "today 12-m"; // Last 12 months by default

    // ═══════════════════════════════════════════
    // STEP 1: Google Trends Interest Over Time
    // ═══════════════════════════════════════════
    const trendsUrl = new URL("https://serpapi.com/search.json");
    trendsUrl.searchParams.set("engine", "google_trends");
    trendsUrl.searchParams.set("q", searchKeywords.join(","));
    trendsUrl.searchParams.set("geo", geoCode);
    trendsUrl.searchParams.set("date", date);
    trendsUrl.searchParams.set("api_key", SERPAPI_KEY);

    console.log(`[demand-trends] Fetching trends for: ${searchKeywords.join(", ")}`);

    const trendsRes = await fetch(trendsUrl.toString());
    const trendsData = await trendsRes.json();

    if (trendsData.error) {
      console.warn("[demand-trends] SerpAPI error:", trendsData.error);
    }

    // Extract interest over time
    const interestOverTime = trendsData.interest_over_time?.timeline_data?.map((point: any) => ({
      date: point.date,
      values: point.values?.map((v: any) => ({
        query: v.query,
        value: v.extracted_value ?? v.value,
      })),
    })) ?? [];

    // ═══════════════════════════════════════════
    // STEP 2: Related Queries (per keyword)
    // ═══════════════════════════════════════════
    const relatedQueries: Record<string, { rising: string[]; top: string[] }> = {};

    // Only fetch related queries for top 3 keywords to stay within rate limits
    const relatedPromises = searchKeywords.slice(0, 3).map(async (keyword: string) => {
      const relUrl = new URL("https://serpapi.com/search.json");
      relUrl.searchParams.set("engine", "google_trends");
      relUrl.searchParams.set("q", keyword);
      relUrl.searchParams.set("geo", geoCode);
      relUrl.searchParams.set("date", date);
      relUrl.searchParams.set("data_type", "RELATED_QUERIES");
      relUrl.searchParams.set("api_key", SERPAPI_KEY);

      try {
        const res = await fetch(relUrl.toString());
        const data = await res.json();

        const rising = data.related_queries?.rising?.map((q: any) => q.query) ?? [];
        const top = data.related_queries?.top?.map((q: any) => q.query) ?? [];

        return { keyword, rising: rising.slice(0, 10), top: top.slice(0, 10) };
      } catch (err) {
        console.warn(`[demand-trends] Related queries failed for "${keyword}":`, err);
        return { keyword, rising: [], top: [] };
      }
    });

    const relatedResults = await Promise.allSettled(relatedPromises);
    for (const result of relatedResults) {
      if (result.status === "fulfilled" && result.value) {
        relatedQueries[result.value.keyword] = {
          rising: result.value.rising,
          top: result.value.top,
        };
      }
    }

    // ═══════════════════════════════════════════
    // STEP 3: Compute trend signals
    // ═══════════════════════════════════════════
    const trendSignals = searchKeywords.map((keyword: string) => {
      const keywordData = interestOverTime
        .map((point: any) => {
          const match = point.values?.find((v: any) => v.query === keyword);
          return match ? { date: point.date, value: match.value } : null;
        })
        .filter(Boolean);

      // Calculate trend direction
      if (keywordData.length >= 4) {
        const firstHalf = keywordData.slice(0, Math.floor(keywordData.length / 2));
        const secondHalf = keywordData.slice(Math.floor(keywordData.length / 2));
        const avgFirst = firstHalf.reduce((s: number, p: any) => s + (p?.value ?? 0), 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((s: number, p: any) => s + (p?.value ?? 0), 0) / secondHalf.length;
        const changePercent = avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0;

        return {
          keyword,
          direction: changePercent > 15 ? "rising" : changePercent < -15 ? "declining" : "stable",
          changePercent: Math.round(changePercent),
          currentInterest: keywordData[keywordData.length - 1]?.value ?? 0,
          peakInterest: Math.max(...keywordData.map((p: any) => p?.value ?? 0)),
          relatedRising: relatedQueries[keyword]?.rising ?? [],
          relatedTop: relatedQueries[keyword]?.top ?? [],
        };
      }

      return {
        keyword,
        direction: "insufficient_data",
        changePercent: 0,
        currentInterest: 0,
        peakInterest: 0,
        relatedRising: relatedQueries[keyword]?.rising ?? [],
        relatedTop: relatedQueries[keyword]?.top ?? [],
      };
    });

    // ═══════════════════════════════════════════
    // STEP 4: Build response
    // ═══════════════════════════════════════════
    const response = {
      success: true,
      provenance: "SCRAPED",
      source: "google_trends_serpapi",
      geo: geoCode,
      timeRange: date,
      trendSignals,
      interestOverTime: interestOverTime.slice(0, 52), // Cap at 52 data points
      metadata: {
        keywordsSearched: searchKeywords,
        dataPoints: interestOverTime.length,
        hasRelatedQueries: Object.keys(relatedQueries).length > 0,
      },
    };

    console.log(`[demand-trends] Success: ${trendSignals.length} signals, ${interestOverTime.length} data points`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[demand-trends] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
