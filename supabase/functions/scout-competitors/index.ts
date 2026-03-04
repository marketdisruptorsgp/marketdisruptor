import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ideaName, ideaDescription, category } = await req.json();
    if (!ideaName) throw new Error("ideaName is required");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    // Run 3 targeted searches in parallel
    const queries = [
      `${ideaName} competitor business startup similar product`,
      `"${ideaDescription?.slice(0, 80)}" business company website`,
      `${category || ""} ${ideaName} alternative similar service startup 2024 2025`,
    ];

    const searchResults = await Promise.allSettled(
      queries.map(async (query) => {
        const res = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, limit: 5, scrapeOptions: { formats: ["markdown"] } }),
        });
        if (!res.ok) return null;
        return await res.json();
      })
    );

    // Collect all scraped content
    const allContent: string[] = [];
    const allSources: { url: string; title: string }[] = [];

    for (const result of searchResults) {
      if (result.status === "fulfilled" && result.value?.data) {
        for (const item of result.value.data) {
          if (item.url) allSources.push({ url: item.url, title: item.title || item.url });
          if (item.markdown) allContent.push(`Source: ${item.url}\nTitle: ${item.title || ""}\n${item.markdown.slice(0, 1500)}`);
        }
      }
    }

    const combinedContent = allContent.join("\n\n---\n\n").slice(0, 15000);

    // AI synthesis
    const aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `You are a competitive intelligence analyst. I'm developing this business idea:

Name: ${ideaName}
Description: ${ideaDescription || "N/A"}
Category: ${category || "N/A"}

Here is web research about similar businesses and competitors:

${combinedContent}

Identify exactly 3-5 REAL competitors or similar businesses. For each, provide:
1. Their actual company/product name
2. Their actual website URL (must be a real URL from the research)
3. A 2-3 sentence description of what they do
4. Their key strengths (2-3 bullet points)
5. Their weaknesses or gaps (2-3 bullet points)  
6. A "differentiator gap" — what opportunity exists to beat them

Return ONLY a valid JSON array:
[{
  "name": "Company Name",
  "url": "https://actual-url.com",
  "description": "What they do...",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "differentiator_gap": "How to beat them..."
}]

IMPORTANT: Only include businesses that are genuinely similar. Use real URLs from the research. If fewer than 3 real competitors exist, return what you find.`,
          },
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || "[]";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let competitors;
    try {
      competitors = JSON.parse(cleaned);
      if (!Array.isArray(competitors)) competitors = competitors.competitors || competitors.data || [];
    } catch {
      competitors = [];
    }

    return new Response(JSON.stringify({ success: true, competitors, sources: allSources.slice(0, 15) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scout-competitors error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
