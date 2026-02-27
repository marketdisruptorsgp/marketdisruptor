import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, mode } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping URL for autofill:", formattedUrl, "mode:", mode);

    // Scrape with Firecrawl
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeRes.json();

    if (!scrapeRes.ok) {
      console.error("Firecrawl error:", scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to scrape URL" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
    const metadata = scrapeData?.data?.metadata || scrapeData?.metadata || {};
    const pageTitle = metadata?.title || "";
    const pageDescription = metadata?.description || "";

    // Truncate markdown to avoid token limits
    const truncatedMarkdown = markdown.substring(0, 6000);

    // Use Gemini to extract structured info
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      // Fallback: return just the scraped title/description
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            name: pageTitle,
            description: pageDescription,
            notes: truncatedMarkdown.substring(0, 500),
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractionPrompt = mode === "business"
      ? `Extract structured business information from this webpage content. Return JSON only:
{
  "name": "business/company name",
  "type": "business type (e.g. SaaS, Restaurant, Agency)",
  "description": "2-3 sentence description of the business model",
  "revenueModel": "how they make money",
  "size": "estimated size if mentioned (employees, revenue)",
  "geography": "where they operate",
  "painPoints": "customer pain points they address",
  "notes": "any other relevant strategic context"
}

Page title: ${pageTitle}
Page description: ${pageDescription}
Content:
${truncatedMarkdown}`
      : `Extract structured ${mode === "service" ? "service" : "product"} information from this webpage. Return JSON only:
{
  "name": "${mode === "service" ? "service" : "product"} name",
  "description": "2-3 sentence description",
  "notes": "target audience, pricing, competitive positioning, key features — anything useful for analysis",
  "imageUrl": "URL of the main product/service image if found, or empty string"
}

Page title: ${pageTitle}
Page description: ${pageDescription}
Content:
${truncatedMarkdown}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: extractionPrompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const geminiData = await geminiRes.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let extracted: Record<string, string> = {};
    try {
      extracted = JSON.parse(rawText);
    } catch {
      // Try to extract JSON from markdown code block
      const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        try { extracted = JSON.parse(match[1]); } catch { /* ignore */ }
      }
    }

    console.log("Extracted data:", Object.keys(extracted));

    return new Response(
      JSON.stringify({ success: true, data: extracted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Autofill error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
