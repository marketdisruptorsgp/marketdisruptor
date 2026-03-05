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

    // Run 4 targeted searches in parallel for deeper coverage
    const queries = [
      `${ideaName} competitor business startup similar product`,
      `"${ideaDescription?.slice(0, 80)}" business company website`,
      `${category || ""} ${ideaName} alternative similar service startup 2025 2026`,
      `${ideaName} ${category || ""} company headquarters funding revenue pricing`,
    ];

    const searchResults = await Promise.allSettled(
      queries.map(async (query) => {
        const res = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query, limit: 6, scrapeOptions: { formats: ["markdown"] } }),
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
          if (item.markdown) allContent.push(`Source: ${item.url}\nTitle: ${item.title || ""}\n${item.markdown.slice(0, 2000)}`);
        }
      }
    }

    const combinedContent = allContent.join("\n\n---\n\n").slice(0, 18000);

    // Build source URL list for the AI to reference
    const sourceUrlList = allSources.map(s => s.url).join("\n");

    // AI synthesis with enriched schema
    const aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `You are a competitive intelligence analyst producing investor-grade competitor profiles. I'm developing this business idea:

Name: ${ideaName}
Description: ${ideaDescription || "N/A"}
Category: ${category || "N/A"}

Here is web research about similar businesses and competitors:

${combinedContent}

Available source URLs from research:
${sourceUrlList}

Identify exactly 3-5 REAL competitors or similar businesses. For each, provide a comprehensive profile:

1. **name**: Their actual company/product name
2. **url**: Their actual website URL (must be a real URL from the research)
3. **description**: 1-2 sentence factual description
4. **executive_summary**: 3-4 sentence deep analysis of their business model, market position, key metrics, and strategic direction. Be specific — include revenue estimates, user counts, or growth signals if available.
5. **hq_city**: Their headquarters city and country (e.g. "San Francisco, USA"). Use "Unknown" if not findable.
6. **founded_year**: Year founded (string, e.g. "2019"). Use null if unknown.
7. **employee_range**: Approximate headcount range (e.g. "11-50", "51-200", "201-500"). Use null if unknown.
8. **funding_stage**: Funding stage (e.g. "Seed", "Series A", "Series B", "Bootstrapped", "Public"). Use null if unknown.
9. **direct_competition_score**: 1-10 integer rating of how directly they compete (10 = identical offering, 1 = tangentially related)
10. **overlap_areas**: Array of 2-4 specific areas where they overlap with this idea (e.g. "AI-powered analytics", "SMB pricing", "Self-serve onboarding")
11. **strengths**: 3-4 specific, evidence-backed strengths
12. **weaknesses**: 3-4 specific weaknesses or gaps
13. **differentiator_gap**: How to specifically beat them — reference their actual weakness
14. **pricing_model**: Their pricing approach (e.g. "Freemium, $29-99/mo plans"). Use null if unknown.
15. **target_audience**: Their primary customer segment. Use null if unknown.
16. **sources**: Array of 1-3 source URLs from the research that informed this competitor's profile

Return ONLY a valid JSON array:
[{
  "name": "Company Name",
  "url": "https://actual-url.com",
  "description": "What they do...",
  "executive_summary": "Deep analysis...",
  "hq_city": "City, Country",
  "founded_year": "2020",
  "employee_range": "51-200",
  "funding_stage": "Series A",
  "direct_competition_score": 8,
  "overlap_areas": ["area1", "area2"],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "differentiator_gap": "How to beat them...",
  "pricing_model": "Freemium, $X/mo",
  "target_audience": "Who they serve",
  "sources": ["https://source1.com", "https://source2.com"]
}]

IMPORTANT: Only include businesses that are genuinely similar. Use real URLs from the research. Every field should be evidence-based — if you can't verify it from the research, use null. Prefer specificity over generality.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 6000,
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

    // Ensure all competitors have required fields with defaults
    competitors = competitors.map((c: any) => ({
      name: c.name || "Unknown",
      url: c.url || "",
      description: c.description || "",
      executive_summary: c.executive_summary || c.description || "",
      hq_city: c.hq_city || "Unknown",
      founded_year: c.founded_year || null,
      employee_range: c.employee_range || null,
      funding_stage: c.funding_stage || null,
      direct_competition_score: c.direct_competition_score || 5,
      overlap_areas: c.overlap_areas || [],
      strengths: c.strengths || [],
      weaknesses: c.weaknesses || [],
      differentiator_gap: c.differentiator_gap || "",
      pricing_model: c.pricing_model || null,
      target_audience: c.target_audience || null,
      sources: c.sources || [],
    }));

    return new Response(JSON.stringify({ success: true, competitors, sources: allSources.slice(0, 20) }), {
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
