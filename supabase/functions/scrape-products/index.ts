import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScrapeRequest {
  category: string;
  era: string;
  audience: string;
  batchSize: number;
}

async function firecrawlSearch(query: string, apiKey: string, limit = 5) {
  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit,
      scrapeOptions: { formats: ["markdown"] },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("Firecrawl search error:", res.status, txt);
    return null;
  }
  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category, era, audience, batchSize }: ScrapeRequest = await req.json();

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl connector not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eraLabel = era !== "All Eras / Current" ? `${era} ` : "";
    const queries = [
      `${eraLabel}${category} vintage discontinued products eBay collector value`,
      `${eraLabel}${category} nostalgic products Reddit community discussion`,
      `${eraLabel}${category} Etsy vintage products trending`,
      `${eraLabel}${category} product reviews complaints nostalgia ${audience}`,
    ];

    console.log("Running Firecrawl searches for:", queries);

    const searchResults = await Promise.allSettled(
      queries.map((q) => firecrawlSearch(q, FIRECRAWL_API_KEY, Math.ceil(batchSize / queries.length)))
    );

    const allMarkdown: string[] = [];
    const sources: { label: string; url: string }[] = [];

    for (const result of searchResults) {
      if (result.status === "fulfilled" && result.value?.data) {
        for (const item of result.value.data) {
          if (item.url) sources.push({ label: item.title || item.url, url: item.url });
          if (item.markdown) allMarkdown.push(`## Source: ${item.url}\n\n${item.markdown.slice(0, 2000)}`);
        }
      }
    }

    const combinedContent = allMarkdown.join("\n\n---\n\n").slice(0, 15000);

    return new Response(
      JSON.stringify({
        success: true,
        rawContent: combinedContent,
        sources: sources.slice(0, 20),
        queryCount: queries.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("scrape-products error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
