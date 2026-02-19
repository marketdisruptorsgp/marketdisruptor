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

// Searches for real product images from Google/Bing/product sites
async function searchProductImage(productName: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${productName} product photo original vintage`,
        limit: 3,
        scrapeOptions: { formats: ["links"] },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Look for image URLs in the results
    for (const item of (data?.data || [])) {
      const links: string[] = item.links || [];
      const imgLink = links.find((l: string) =>
        /\.(jpg|jpeg|png|webp)/i.test(l) &&
        !l.includes("logo") &&
        !l.includes("icon") &&
        (l.includes("ebay") || l.includes("amazon") || l.includes("wikipedia") || l.includes("etsy") || l.includes("google") || l.includes("cdn"))
      );
      if (imgLink) return imgLink;
    }
    return null;
  } catch {
    return null;
  }
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
    
    // Deep intelligence queries covering competitor data, community sentiment, complaints, pricing
    const queries = [
      // Core product discovery
      `${eraLabel}${category} vintage discontinued products eBay collector value price sold`,
      // Reddit community sentiment & reviews
      `site:reddit.com ${eraLabel}${category} nostalgia review complaints "wish they would bring back"`,
      // Google community discussions + complaints
      `${eraLabel}${category} product reviews complaints improvement requests ${audience} nostalgia 2023 2024`,
      // Etsy / vintage market
      `${eraLabel}${category} Etsy vintage products trending handmade revival`,
      // Competitor & market landscape
      `${eraLabel}${category} competitor analysis market trends "best selling" "discontinued" site:amazon.com OR site:ebay.com`,
      // Reddit subreddit deep dives
      `site:reddit.com ${eraLabel}${category} "what happened to" OR "bring back" OR "miss this" community discussion`,
      // TikTok / social sentiment
      `${eraLabel}${category} TikTok viral nostalgia trend "going viral" "gen z" "millennial" 2024`,
      // Pricing & supplier intel
      `${eraLabel}${category} wholesale supplier manufacturer alibaba minimum order quantity`,
    ];

    console.log(`Running ${queries.length} Firecrawl searches for: ${eraLabel}${category}`);

    const searchResults = await Promise.allSettled(
      queries.map((q) => firecrawlSearch(q, FIRECRAWL_API_KEY, Math.max(3, Math.ceil(batchSize / queries.length))))
    );

    const allMarkdown: string[] = [];
    const sources: { label: string; url: string }[] = [];
    const redditPosts: string[] = [];
    const complaintSignals: string[] = [];

    for (let i = 0; i < searchResults.length; i++) {
      const result = searchResults[i];
      if (result.status === "fulfilled" && result.value?.data) {
        for (const item of result.value.data) {
          if (item.url) sources.push({ label: item.title || item.url, url: item.url });
          
          if (item.markdown) {
            const snippet = item.markdown.slice(0, 2500);
            allMarkdown.push(`## Source: ${item.url}\n\n${snippet}`);
            
            // Tag Reddit-specific content for sentiment extraction
            if (item.url?.includes("reddit.com")) {
              redditPosts.push(`### Reddit: ${item.title}\nURL: ${item.url}\n${snippet}`);
            }
            
            // Extract complaint/improvement signals
            if (
              snippet.toLowerCase().includes("complaint") ||
              snippet.toLowerCase().includes("wish") ||
              snippet.toLowerCase().includes("improve") ||
              snippet.toLowerCase().includes("problem") ||
              snippet.toLowerCase().includes("broken") ||
              snippet.toLowerCase().includes("miss")
            ) {
              complaintSignals.push(`From ${item.url}: ${snippet.slice(0, 800)}`);
            }
          }
        }
      }
    }

    const combinedContent = allMarkdown.join("\n\n---\n\n").slice(0, 20000);
    const redditContent = redditPosts.join("\n\n---\n\n").slice(0, 5000);
    const complaintsContent = complaintSignals.join("\n\n---\n\n").slice(0, 4000);

    console.log(`Scraped ${allMarkdown.length} pages, ${redditPosts.length} Reddit posts, ${complaintSignals.length} complaint signals`);

    return new Response(
      JSON.stringify({
        success: true,
        rawContent: combinedContent,
        redditContent,
        complaintsContent,
        sources: sources.slice(0, 30),
        queryCount: queries.length,
        stats: {
          totalPages: allMarkdown.length,
          redditPosts: redditPosts.length,
          complaintSignals: complaintSignals.length,
        },
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
