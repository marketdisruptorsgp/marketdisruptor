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
    const { businessName, businessDescription, competitors, industry, revenue, services, naicsCode } = await req.json();
    if (!businessName) throw new Error("businessName is required");
    if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
      throw new Error("competitors array is required");
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    // ═══════════════════════════════════════════
    // STEP 1: Firecrawl — primary web scraping
    // ═══════════════════════════════════════════
    const scrapeQueries = [
      ...competitors.slice(0, 6).map((c: string) => `"${c}" ${industry || ""} company services pricing`),
      `${industry || businessName} industry competitors market landscape 2025 2026`,
    ];

    const searchResults = await Promise.allSettled(
      scrapeQueries.map(async (query: string) => {
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

    const allContent: string[] = [];
    const allSources: { url: string; title: string; source: string }[] = [];

    for (const result of searchResults) {
      if (result.status === "fulfilled" && result.value?.data) {
        for (const item of result.value.data) {
          if (item.url) allSources.push({ url: item.url, title: item.title || item.url, source: "firecrawl" });
          if (item.markdown) allContent.push(`[FIRECRAWL] Source: ${item.url}\nTitle: ${item.title || ""}\n${item.markdown.slice(0, 2500)}`);
        }
      }
    }

    // ═══════════════════════════════════════════
    // STEP 2: Perplexity — cross-reference corroboration
    // ═══════════════════════════════════════════
    let perplexityContent: string[] = [];
    if (PERPLEXITY_API_KEY) {
      const perplexityQueries = competitors.slice(0, 4).map((c: string) =>
        `${c} company ${industry || ""} revenue employees services pricing competitive analysis`
      );

      const perplexityResults = await Promise.allSettled(
        perplexityQueries.map(async (query: string) => {
          const res = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "sonar",
              messages: [
                { role: "system", content: "Provide factual, concise information about this company. Include revenue estimates, employee count, services, and pricing if available. Cite your sources." },
                { role: "user", content: query },
              ],
              max_tokens: 1000,
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content || "";
          const citations = data.citations || [];
          return { content, citations, query };
        })
      );

      for (const result of perplexityResults) {
        if (result.status === "fulfilled" && result.value) {
          const { content, citations } = result.value;
          perplexityContent.push(`[PERPLEXITY] ${content}`);
          for (const url of citations) {
            allSources.push({ url, title: url, source: "perplexity" });
          }
        }
      }
    }

    const combinedContent = [...allContent, ...perplexityContent].join("\n\n---\n\n").slice(0, 28000);
    const sourceUrlList = allSources.map(s => `[${s.source}] ${s.url}`).join("\n");

    // ═══════════════════════════════════════════
    // STEP 3: AI synthesis with citation requirements
    // ═══════════════════════════════════════════
    const aiRes = await fetch(AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `You are a competitive intelligence analyst specializing in M&A due diligence. Produce investor-grade competitive positioning intelligence with FULL SOURCE CITATIONS on every claim.

TARGET BUSINESS:
Name: ${businessName}
Description: ${businessDescription || "N/A"}
Industry: ${industry || "N/A"}
NAICS: ${naicsCode || "N/A"}
Revenue: ${revenue || "N/A"}
Services: ${services || "N/A"}
Named Competitors from CIM: ${competitors.join(", ")}

WEB RESEARCH DATA (tagged by source):
${combinedContent}

Source URLs:
${sourceUrlList}

Produce a comprehensive competitive positioning analysis with this EXACT JSON structure:

{
  "competitorProfiles": [
    {
      "name": "Competitor Name",
      "url": "https://actual-url.com",
      "description": "2-3 sentence factual profile",
      "estimatedRevenue": "$X-YM range or null",
      "employeeRange": "10-50 or null",
      "serviceOverlap": ["service1", "service2"],
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2", "weakness3"],
      "pricingApproach": "How they price or null",
      "geographicFocus": "Where they operate",
      "positioningAxis": {
        "pricePoint": 1-10,
        "specialization": 1-10,
        "scale": 1-10,
        "reputation": 1-10
      },
      "threatLevel": "direct|indirect|peripheral",
      "sources": ["url1", "url2"],
      "citations": {
        "description": { "value": "the description text", "confidence": "scraped|ai-inferred", "sources": [{"url": "...", "title": "...", "snippet": "exact quote or context"}] },
        "estimatedRevenue": { "value": "$X-YM", "confidence": "scraped|ai-inferred", "sources": [{"url": "...", "title": "..."}] },
        "employeeRange": { "value": "10-50", "confidence": "scraped|ai-inferred", "sources": [{"url": "...", "title": "..."}] },
        "pricingApproach": { "value": "pricing info", "confidence": "scraped|ai-inferred", "sources": [{"url": "...", "title": "..."}] },
        "strengths": { "value": ["s1","s2"], "confidence": "scraped|ai-inferred", "sources": [{"url": "...", "title": "..."}] },
        "weaknesses": { "value": ["w1","w2"], "confidence": "scraped|ai-inferred", "sources": [{"url": "...", "title": "..."}] }
      },
      "corroborationScore": 0.0-1.0,
      "corroborationDetails": "Which sources agreed/disagreed"
    }
  ],
  "positioningMap": {
    "xAxis": { "label": "axis label", "description": "what it measures" },
    "yAxis": { "label": "axis label", "description": "what it measures" },
    "targetPosition": { "x": 1-10, "y": 1-10, "label": "${businessName}" },
    "competitorPositions": [{ "name": "Name", "x": 1-10, "y": 1-10 }]
  },
  "strategicGaps": [
    {
      "gap": "What no competitor is doing",
      "opportunity": "How to exploit this gap",
      "difficulty": "low|medium|high",
      "potentialImpact": "Revenue or margin impact estimate",
      "sources": [{"url": "...", "title": "...", "snippet": "evidence"}]
    }
  ],
  "competitiveAdvantages": [
    {
      "advantage": "What the target business does uniquely",
      "sustainability": "low|medium|high",
      "exploitStrategy": "How to deepen this advantage post-acquisition"
    }
  ],
  "marketDynamics": {
    "consolidationTrend": "fragmenting|stable|consolidating",
    "priceCompetition": "low|medium|high",
    "differentiationBasis": "What drives customer choice",
    "entryBarriers": "What prevents new entrants",
    "sources": [{"url": "...", "title": "..."}]
  }
}

CITATION RULES:
- EVERY claim must have a "confidence" field: "scraped" if directly from web data, "ai-inferred" if you extrapolated.
- EVERY cited claim must link back to actual source URLs from the research data above.
- "corroborationScore" = fraction of claims where Firecrawl AND Perplexity sources agree (0-1).
- If data was found in BOTH [FIRECRAWL] and [PERPLEXITY] sources, confidence should be "scraped" with higher corroborationScore.
- If only found in one source type, corroborationScore is lower.
- Profile EVERY named competitor (${competitors.join(", ")}). If web data is sparse, create a profile but mark all fields as "ai-inferred".
- Return ONLY valid JSON. No markdown, no code fences.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 10000,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      const fixed = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
      try {
        result = JSON.parse(fixed);
      } catch {
        result = { competitorProfiles: [], positioningMap: null, strategicGaps: [], competitiveAdvantages: [], marketDynamics: null };
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
      allSources: allSources.slice(0, 40),
      hasPerplexityCorroboration: !!PERPLEXITY_API_KEY && perplexityContent.length > 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("research-competitive-positioning error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
