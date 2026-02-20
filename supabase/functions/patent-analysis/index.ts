import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productName, category, era } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    console.log(`Running patent analysis for: ${productName} (${category}, ${era})`);

    // === STEP 1: Gather patent data from multiple sources in parallel ===

    const [usptoData, googlePatentsData, freeIpData] = await Promise.allSettled([
      // USPTO PatentsView API — completely free, no key needed
      fetchUSPTOPatents(productName, category),
      // Google Patents via Firecrawl
      fetchGooglePatents(productName, category, FIRECRAWL_API_KEY),
      // Lens.org / Espacenet via Firecrawl for expired patents
      fetchExpiredPatents(productName, category, FIRECRAWL_API_KEY),
    ]);

    const usptoRaw = usptoData.status === "fulfilled" ? usptoData.value : "";
    const googleRaw = googlePatentsData.status === "fulfilled" ? googlePatentsData.value : "";
    const expiredRaw = freeIpData.status === "fulfilled" ? freeIpData.value : "";

    console.log(`Data gathered — USPTO: ${usptoRaw.length} chars, Google: ${googleRaw.length} chars, Expired: ${expiredRaw.length} chars`);

    // === STEP 2: Deep AI analysis of patent landscape ===

    const systemPrompt = `You are a world-class patent intelligence analyst and innovation strategist. You analyze patent data to uncover:
1. Who controls IP in a space and whether it's accessible
2. Expired patents = public domain goldmines anyone can use FREE
3. Patent gaps = unprotected opportunities with clear white space
4. Filing trends = where smart money is heading RIGHT NOW
5. Radical innovation angles inspired by prior art and gaps

You MUST return ONLY valid JSON. No markdown, no explanation.

Return this EXACT structure:
{
  "summary": "2-3 sentence strategic overview of the patent landscape — who controls it, how open it is, key opportunity",
  "landscapeScore": 8,
  "opportunityScore": 7,
  "thicketRisk": "low | medium | high",
  "thicketRiskExplanation": "Why this risk level — be specific about major patent holders",
  "keyHolders": [
    {
      "name": "Company or inventor name",
      "patentCount": 42,
      "dominance": "high | medium | low",
      "focus": "What specifically they've patented",
      "threat": "How this affects market entry",
      "opportunity": "How to route around or leverage this"
    }
  ],
  "expiredGoldmines": [
    {
      "title": "Patent or technology name",
      "originalHolder": "Who owned it",
      "expiredYear": 2010,
      "whatItCovers": "Specific technology, mechanism, or design that is now free to use",
      "commercialOpportunity": "Exactly how you can USE this expired IP to build a product or business TODAY",
      "estimatedValue": "What this IP would be worth if you had to license it — now free",
      "exampleApplication": "Specific product concept that builds on this expired patent"
    }
  ],
  "activeMinefield": [
    {
      "area": "Technology or design area that's heavily patented",
      "holder": "Who owns most of the IP here",
      "risk": "high | medium",
      "workaround": "Specific way to achieve the same outcome without infringing",
      "licenseOption": "Whether licensing is feasible and approximate cost"
    }
  ],
  "patentGaps": [
    {
      "gap": "Specific unprotected innovation area",
      "why": "Why nobody has filed here yet — market timing, technical barrier, etc.",
      "opportunity": "How you could patent this and build a defensible moat",
      "urgency": "high | medium | low",
      "estimatedFilingCost": "Rough cost to file a patent here"
    }
  ],
  "filingTrends": [
    {
      "trend": "What's being filed right now in this space",
      "implication": "What this signals about where the market is heading",
      "actors": "Who is filing — startups, corporates, universities",
      "timeline": "When these patents become active threats"
    }
  ],
  "innovationAngles": [
    {
      "angle": "Bold innovation concept inspired by patent analysis",
      "basedOn": "Which expired patent or gap this leverages",
      "description": "3-4 sentence vision for this product/service",
      "defensibility": "How to protect this once built",
      "competitiveAdvantage": "Why prior patent activity actually helps you here",
      "investmentNeeded": "$X–$Y to build and file",
      "marketPotential": "Revenue potential with basis"
    }
  ],
  "quickActions": [
    "Specific action you can take THIS WEEK based on patent landscape — with details",
    "Action 2 — e.g. 'File a provisional patent for $X on [specific gap]'",
    "Action 3 — e.g. 'Use expired [technology] patent to source from [specific supplier]'"
  ],
  "sources": [
    {"label": "Source name", "url": "https://actual-url.com"}
  ]
}

CRITICAL RULES:
- landscapeScore and opportunityScore: integers 1-10
- expiredGoldmines MUST have at least 2-3 entries — expired patents are the MOST valuable insight
- patentGaps MUST have at least 2-3 entries — white space is opportunity
- innovationAngles MUST be bold, specific, and actionable — not generic advice
- quickActions MUST be executable this week with specific details
- ALL dollar figures must be specific ranges
- Be provocative and specific — vague generalities are useless`;

    const userPrompt = `Analyze the patent landscape for: ${productName}
Category: ${category}
Era of origin: ${era}

USPTO PATENT DATA:
${usptoRaw || "No USPTO data retrieved — infer from your knowledge"}

GOOGLE PATENTS DATA:
${googleRaw || "No Google Patents data retrieved — infer from your knowledge"}

EXPIRED/HISTORICAL PATENT DATA:
${expiredRaw || "No expired patent data retrieved — infer from your knowledge"}

Provide the deepest possible patent intelligence. Focus especially on:
1. Expired patents that anyone can use RIGHT NOW for free
2. Specific white space gaps where filing a patent would create a moat
3. Bold innovation angles that the patent landscape enables
4. Concrete actions based on what's protected vs. free to use

Be specific, bold, and commercial. This analysis should fundamentally change how someone approaches this market.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.65,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${txt}`);
    }

    const aiData = await response.json();
    const rawText: string = aiData.choices?.[0]?.message?.content ?? "";

    let cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    let patentData;
    try {
      patentData = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed:", cleaned.slice(0, 300));
      throw new Error("AI returned invalid JSON for patent analysis.");
    }

    return new Response(JSON.stringify({ success: true, patentData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("patent-analysis error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Patent analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ---- Helper: USPTO PatentsView API (free, no key needed) ----
async function fetchUSPTOPatents(productName: string, category: string): Promise<string> {
  try {
    const query = `${productName} ${category}`.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    
    // Use USPTO PatentsView full-text search
    const url = `https://search.patentsview.org/api/v1/patent/?q={"_text_all":{"patent_abstract":"${encodeURIComponent(query)}"}}&f=["patent_id","patent_title","patent_abstract","patent_date","assignees","inventors"]&o={"per_page":15}`;
    
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      console.log("USPTO PatentsView failed:", res.status);
      // Fallback: try the simpler patents.google.com via fetch
      return await fetchUSPTOFallback(productName, category);
    }
    
    const data = await res.json();
    const patents = data?.patents || [];
    
    if (!patents.length) return await fetchUSPTOFallback(productName, category);
    
    return patents.map((p: { patent_id: string; patent_title: string; patent_abstract: string; patent_date: string; assignees?: { assignee_organization?: string }[] }) =>
      `ID: ${p.patent_id}\nTitle: ${p.patent_title}\nDate: ${p.patent_date}\nAssignee: ${p.assignees?.[0]?.assignee_organization || "Individual"}\nAbstract: ${(p.patent_abstract || "").slice(0, 400)}`
    ).join("\n\n");
  } catch (e) {
    console.error("USPTO fetch error:", e);
    return "";
  }
}

async function fetchUSPTOFallback(productName: string, category: string): Promise<string> {
  try {
    // Try the Open Patent Services endpoint
    const query = encodeURIComponent(`${productName} ${category}`);
    const url = `https://api.patentsview.org/patents/query?q={"_text_all":{"patent_title":"${query}"}}&f=["patent_id","patent_title","patent_date","assignee_organization"]&o={"per_page":10}`;
    
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    const patents = data?.patents || [];
    return patents.map((p: { patent_id: string; patent_title: string; patent_date: string; assignee_organization?: string }) =>
      `${p.patent_title} (${p.patent_date}) — ${p.assignee_organization || "Individual"}`
    ).join("\n");
  } catch {
    return "";
  }
}

// ---- Helper: Google Patents via Firecrawl ----
async function fetchGooglePatents(productName: string, category: string, apiKey: string): Promise<string> {
  try {
    const searchQuery = `${productName} ${category} patent site:patents.google.com`;
    
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 8,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });
    
    if (!res.ok) return "";
    const data = await res.json();
    const results = data?.data || [];
    
    return results.map((r: { url: string; title: string; description: string; markdown?: string }) =>
      `URL: ${r.url}\nTitle: ${r.title}\nDescription: ${r.description}\nContent: ${(r.markdown || "").slice(0, 600)}`
    ).join("\n\n---\n\n");
  } catch (e) {
    console.error("Google Patents fetch error:", e);
    return "";
  }
}

// ---- Helper: Expired patents via Firecrawl ----
async function fetchExpiredPatents(productName: string, category: string, apiKey: string): Promise<string> {
  try {
    // Search for expired patents + free-to-use IP 
    const queries = [
      `"${productName}" expired patent public domain free to use`,
      `${category} ${productName} patent prior art expired 20 years`,
    ];
    
    const results: string[] = [];
    
    for (const query of queries) {
      const res = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          limit: 5,
          scrapeOptions: { formats: ["markdown"] },
        }),
      });
      
      if (!res.ok) continue;
      const data = await res.json();
      const items = data?.data || [];
      results.push(items.map((r: { url: string; title: string; markdown?: string }) =>
        `URL: ${r.url}\nTitle: ${r.title}\nContent: ${(r.markdown || "").slice(0, 500)}`
      ).join("\n---\n"));
    }
    
    return results.join("\n\n=== QUERY 2 ===\n\n");
  } catch (e) {
    console.error("Expired patents fetch error:", e);
    return "";
  }
}
