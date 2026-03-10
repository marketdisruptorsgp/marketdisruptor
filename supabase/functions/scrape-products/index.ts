import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CustomProduct {
  imageDataUrl?: string;
  productUrl?: string;
  productName?: string;
  notes?: string;
}

interface ScrapeRequest {
  category: string;
  era: string;
  batchSize: number;
  customProducts?: CustomProduct[];
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
    const { category, era, batchSize, customProducts }: ScrapeRequest = await req.json();

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl connector not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isService = category === "Service";
    const eraLabel = era !== "All Eras / Current" ? `${era} ` : "";
    const isCurrentEra = era === "All Eras / Current";

    // Use different queries for service vs product analysis
    const queries = isService
      ? [
          `${eraLabel}${category} service review complaints "customer experience" frustration`,
          `${eraLabel}service industry customer journey friction pain points reviews 2023 2024`,
          `"worst experience" OR "terrible service" OR "switched to" OR "better alternative" ${eraLabel}service industry`,
          `${eraLabel}service business model innovation trends disruption 2024`,
          `${eraLabel}service industry automation technology transformation customer satisfaction`,
          `${eraLabel}service pricing models subscription vs retainer vs per-use comparison`,
          `${eraLabel}service reviews complaints customer feedback ratings`,
          `${eraLabel}service industry operational bottlenecks scaling challenges workforce`,
        ]
      : isCurrentEra
        ? [
            // Current-era products: focus on live market, real suppliers, competitors
            `${category} product reviews complaints "what I hate" "wish it had" 2024 2025`,
            `${category} market analysis competitor comparison "best selling" pricing`,
            `${category} supplier manufacturer distributor wholesale "minimum order"`,
            `${category} product innovation trends disruption new technology 2024 2025`,
            `${category} supply chain manufacturers vendors retailers market share`,
            `${category} community forums reddit discussion complaints improvement requests`,
            `${category} industry analysis market size growth trends revenue`,
            `${category} product teardown BOM cost breakdown materials sourcing`,
          ]
        : [
            // Vintage/era products: nostalgia + collector + revival angle
            `${eraLabel}${category} vintage discontinued products collector value price sold`,
            `${eraLabel}${category} nostalgia review complaints "wish they would bring back" community discussion`,
            `${eraLabel}${category} product reviews complaints improvement requests nostalgia 2023 2024`,
            `${eraLabel}${category} vintage products trending handmade revival marketplace`,
            `${eraLabel}${category} competitor analysis market trends "best selling" "discontinued"`,
            `${eraLabel}${category} "what happened to" OR "bring back" OR "miss this" community discussion`,
            `${eraLabel}${category} viral nostalgia trend "going viral" "gen z" "millennial" 2024`,
            `${eraLabel}${category} wholesale supplier manufacturer minimum order quantity`,
          ];

    // If custom products/URLs supplied, add targeted searches for them
    const customSearches: string[] = [];
    const customScrapedContent: string[] = [];
    
    if (customProducts && customProducts.length > 0) {
      for (const cp of customProducts) {
        if (cp.productName) {
          if (isService) {
            customSearches.push(`"${cp.productName}" service reviews customer experience complaints`);
            customSearches.push(`"${cp.productName}" OR similar service alternative competitor`);
          } else {
            customSearches.push(`"${cp.productName}" product reviews price history specifications`);
            customSearches.push(`"${cp.productName}" supplier manufacturer distributor wholesale`);
            customSearches.push(`"${cp.productName}" community sentiment review complaints reddit`);
          }
        }
        // Directly scrape custom URLs
        if (cp.productUrl) {
          try {
            const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: cp.productUrl,
                formats: ["markdown", "links", "rawHtml"],
              }),
            });
            if (scrapeRes.ok) {
              const scrapeJson = await scrapeRes.json();
              const md = scrapeJson?.data?.markdown || scrapeJson?.markdown || "";
              if (md) {
                customScrapedContent.push(`## Custom ${isService ? "Service" : "Product"} URL: ${cp.productUrl}\n${isService ? "Service" : "Product"}: ${cp.productName || "Unknown"}\nNotes: ${cp.notes || "None"}\n\n${md.slice(0, 3000)}`);
              }
              // Extract primary image from the scraped page
              const html = scrapeJson?.data?.rawHtml || scrapeJson?.rawHtml || "";
              const ogMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/i) ||
                              html.match(/content="([^"]+)"[^>]*property="og:image"/i);
              if (ogMatch?.[1]) {
                customScrapedContent.push(`## Product Image Found\nProduct: ${cp.productName || "Unknown"}\nImage URL: ${ogMatch[1]}`);
              } else {
                const mdImgMatch = md.match(/!\[.*?\]\((https?:\/\/[^\s)]+\.(jpg|jpeg|png|webp)[^\s)]*)\)/i);
                if (mdImgMatch?.[1]) {
                  customScrapedContent.push(`## Product Image Found\nProduct: ${cp.productName || "Unknown"}\nImage URL: ${mdImgMatch[1]}`);
                }
              }
            }
          } catch (e) {
            console.error("Failed to scrape custom URL:", cp.productUrl, e);
          }
        }
        // Include image data URL context
        if (cp.imageDataUrl) {
          customScrapedContent.push(`## Custom ${isService ? "Service" : "Product"} Image Provided\n${isService ? "Service" : "Product"}: ${cp.productName || "Unknown"}\nNotes: ${cp.notes || "None"}\n[User uploaded an image for analysis]`);
        }
      }
    }

    const allQueries = [...queries, ...customSearches];
    console.log(`Running ${allQueries.length} Firecrawl searches for: ${isService ? "Service" : eraLabel + category}`);

    const searchResults = await Promise.allSettled(
      allQueries.map((q) => firecrawlSearch(q, FIRECRAWL_API_KEY, Math.max(3, Math.ceil(batchSize / allQueries.length))))
    );

    const allMarkdown: string[] = [...customScrapedContent];
    const sources: { label: string; url: string }[] = [];
    const communityPosts: string[] = [];
    const complaintSignals: string[] = [];

    for (let i = 0; i < searchResults.length; i++) {
      const result = searchResults[i];
      if (result.status === "fulfilled" && result.value?.data) {
        for (const item of result.value.data) {
          if (item.url) sources.push({ label: item.title || item.url, url: item.url });
          
          if (item.markdown) {
            const snippet = item.markdown.slice(0, 2500);
            allMarkdown.push(`## Source: ${item.url}\n\n${snippet}`);
            
            if (item.url?.includes("reddit.com") || item.url?.includes("forum") || item.url?.includes("community")) {
              communityPosts.push(`### Community: ${item.title}\nURL: ${item.url}\n${snippet}`);
            }
            
            if (
              snippet.toLowerCase().includes("complaint") ||
              snippet.toLowerCase().includes("wish") ||
              snippet.toLowerCase().includes("improve") ||
              snippet.toLowerCase().includes("problem") ||
              snippet.toLowerCase().includes("broken") ||
              snippet.toLowerCase().includes("miss") ||
              snippet.toLowerCase().includes("frustrat") ||
              snippet.toLowerCase().includes("terrible") ||
              snippet.toLowerCase().includes("switched")
            ) {
              complaintSignals.push(`From ${item.url}: ${snippet.slice(0, 800)}`);
            }
          }
        }
      }
    }

    const combinedContent = allMarkdown.join("\n\n---\n\n").slice(0, 20000);
    const communityContent = communityPosts.join("\n\n---\n\n").slice(0, 5000);
    const complaintsContent = complaintSignals.join("\n\n---\n\n").slice(0, 4000);

    console.log(`Scraped ${allMarkdown.length} pages, ${communityPosts.length} community posts, ${complaintSignals.length} complaint signals`);

    return new Response(
      JSON.stringify({
        success: true,
        rawContent: combinedContent,
        communityContent,
        complaintsContent,
        sources: sources.slice(0, 30),
        queryCount: queries.length,
        stats: {
          totalPages: allMarkdown.length,
          communityPosts: communityPosts.length,
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
