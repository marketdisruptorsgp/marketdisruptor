import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productName, category, era, industryContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

    console.log(`Running patent analysis for: ${productName} (${category}, ${era})`);
    if (industryContext) {
      console.log(`Industry context provided:`, JSON.stringify(industryContext).slice(0, 300));
    }

    // === STEP 1: Gather patent data from multiple sources in parallel ===
    // Use industry context to build better search queries
    const searchTerms = buildSearchTerms(productName, category, industryContext);

    const [usptoData, googlePatentsData, freeIpData] = await Promise.allSettled([
      fetchUSPTOPatents(searchTerms.primary, searchTerms.secondary),
      fetchGooglePatents(searchTerms.primary, searchTerms.secondary, FIRECRAWL_API_KEY),
      fetchExpiredPatents(searchTerms.primary, searchTerms.secondary, FIRECRAWL_API_KEY),
    ]);

    const usptoRaw = usptoData.status === "fulfilled" ? usptoData.value : "";
    const googleRaw = googlePatentsData.status === "fulfilled" ? googlePatentsData.value : "";
    const expiredRaw = freeIpData.status === "fulfilled" ? freeIpData.value : "";

    console.log(`Data gathered — USPTO: ${usptoRaw.length} chars, Google: ${googleRaw.length} chars, Expired: ${expiredRaw.length} chars`);

    // === STEP 2: Build industry-grounded prompt ===
    const industryGrounding = buildIndustryGrounding(productName, category, industryContext);

    const systemPrompt = `You are a world-class patent intelligence analyst and innovation strategist.

${industryGrounding}

You analyze patent data to uncover:
1. Who controls IP in this specific industry and whether it's accessible
2. Expired patents = public domain goldmines anyone can use FREE
3. Patent gaps = unprotected opportunities with clear white space
4. Filing trends = where smart money is heading RIGHT NOW
5. Radical innovation angles inspired by prior art and gaps

CRITICAL: Your analysis MUST be specific to the industry context above. Do NOT generate generic software/AI/blockchain patents unless the business is actually a software or AI company. Focus on patents relevant to the actual products, processes, and materials this business works with.

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
- Be provocative and specific — vague generalities are useless
- STAY IN THE INDUSTRY CONTEXT — if this is a manufacturing company, focus on manufacturing patents, processes, materials, equipment`;

    const userPrompt = `Analyze the patent landscape for: ${productName}
Category: ${category}
Era of origin: ${era}
${industryGrounding ? `\nINDUSTRY CONTEXT (use this to focus your analysis):\n${industryGrounding}` : ""}

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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

    const patentData = extractAndParseJson(rawText);

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

// ---- Build industry-specific search terms ----
function buildSearchTerms(
  productName: string,
  category: string,
  industryContext?: { industry?: string; products?: string[]; processes?: string[]; materials?: string[]; businessDescription?: string } | null,
): { primary: string; secondary: string } {
  // For business model analyses, productName is often the business name (e.g., "CK Woodworks")
  // which returns irrelevant patent results. Use business description and category instead.
  if (industryContext?.businessDescription) {
    // Extract key industry terms from the description, not the company name
    const desc = industryContext.businessDescription;
    const parts: string[] = [];
    if (industryContext.industry) parts.push(industryContext.industry);
    if (industryContext.products?.length) parts.push(industryContext.products.slice(0, 2).join(" "));
    if (industryContext.processes?.length) parts.push(industryContext.processes[0]);
    // Fallback: extract key terms from description
    if (parts.length === 0) {
      // Use category + first meaningful words from description
      parts.push(category);
      const descWords = desc.split(/\s+/).filter(w => w.length > 4).slice(0, 3);
      if (descWords.length > 0) parts.push(descWords.join(" "));
    }

    const primary = parts.join(" ");
    const secondary = industryContext.materials?.length
      ? industryContext.materials.slice(0, 2).join(" ")
      : category;

    return { primary, secondary };
  }

  if (!industryContext) {
    return { primary: productName, secondary: category };
  }

  const parts: string[] = [];
  if (industryContext.industry) parts.push(industryContext.industry);
  if (industryContext.products?.length) parts.push(industryContext.products.slice(0, 2).join(" "));
  if (industryContext.processes?.length) parts.push(industryContext.processes[0]);

  const primary = parts.length > 0 ? parts.join(" ") : productName;
  const secondary = industryContext.materials?.length
    ? industryContext.materials.slice(0, 2).join(" ")
    : category;

  return { primary, secondary };
}

// ---- Build industry grounding text for the prompt ----
function buildIndustryGrounding(
  productName: string,
  category: string,
  industryContext?: {
    industry?: string;
    products?: string[];
    processes?: string[];
    materials?: string[];
    businessDescription?: string;
  } | null,
): string {
  if (!industryContext) return "";

  const lines: string[] = ["INDUSTRY GROUNDING (this is the actual business being analyzed):"];
  if (industryContext.industry) lines.push(`Industry: ${industryContext.industry}`);
  if (industryContext.businessDescription) lines.push(`Business: ${industryContext.businessDescription.slice(0, 300)}`);
  if (industryContext.products?.length) lines.push(`Products/Services: ${industryContext.products.join(", ")}`);
  if (industryContext.processes?.length) lines.push(`Key Processes: ${industryContext.processes.join(", ")}`);
  if (industryContext.materials?.length) lines.push(`Materials/Inputs: ${industryContext.materials.join(", ")}`);

  if (lines.length <= 1) return "";

  lines.push("");
  lines.push("Focus your patent analysis on IP relevant to THESE specific products, processes, and materials. Do NOT default to software, AI, or blockchain patents unless this business actually operates in those domains.");

  return lines.join("\n");
}

// ---- Robust JSON extraction with truncation repair ----
function extractAndParseJson(raw: string): unknown {
  let cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1) throw new Error("No JSON object found in AI response");

  if (lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  } else {
    cleaned = cleaned.slice(firstBrace);
  }

  // Attempt 1: direct parse
  try { return JSON.parse(cleaned); } catch { /* continue */ }

  // Attempt 2: fix trailing commas and control chars
  let fixed = cleaned
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/[\x00-\x1F\x7F]/g, " ");
  try { return JSON.parse(fixed); } catch { /* continue */ }

  // Attempt 3: repair truncated JSON by closing open braces/brackets
  const openBraces = (fixed.match(/{/g) || []).length;
  const closeBraces = (fixed.match(/}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;

  // Remove trailing partial key/value
  fixed = fixed.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, "");
  fixed = fixed.replace(/,\s*$/, "");

  let suffix = "";
  for (let i = 0; i < openBrackets - closeBrackets; i++) suffix += "]";
  for (let i = 0; i < openBraces - closeBraces; i++) suffix += "}";

  try {
    const result = JSON.parse(fixed + suffix);
    console.warn("Recovered patent JSON via truncation repair");
    return result;
  } catch {
    console.error("JSON parse failed after all attempts:", cleaned.slice(0, 500));
    throw new Error("AI returned invalid JSON for patent analysis.");
  }
}

// ---- Helper: USPTO PatentsView API (free, no key needed) ----
async function fetchUSPTOPatents(primary: string, secondary: string): Promise<string> {
  try {
    const query = `${primary} ${secondary}`.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    
    // Use USPTO PatentsView full-text search
    const url = `https://search.patentsview.org/api/v1/patent/?q={"_text_all":{"patent_abstract":"${encodeURIComponent(query)}"}}&f=["patent_id","patent_title","patent_abstract","patent_date","assignees","inventors"]&o={"per_page":15}`;
    
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      console.log("USPTO PatentsView failed:", res.status);
      return await fetchUSPTOFallback(primary, secondary);
    }
    
    const data = await res.json();
    const patents = data?.patents || [];
    
    if (!patents.length) return await fetchUSPTOFallback(primary, secondary);
    
    return patents.map((p: { patent_id: string; patent_title: string; patent_abstract: string; patent_date: string; assignees?: { assignee_organization?: string }[] }) =>
      `ID: ${p.patent_id}\nTitle: ${p.patent_title}\nDate: ${p.patent_date}\nAssignee: ${p.assignees?.[0]?.assignee_organization || "Individual"}\nAbstract: ${(p.patent_abstract || "").slice(0, 400)}`
    ).join("\n\n");
  } catch (e) {
    console.error("USPTO fetch error:", e);
    return "";
  }
}

async function fetchUSPTOFallback(primary: string, secondary: string): Promise<string> {
  try {
    const query = encodeURIComponent(`${primary} ${secondary}`);
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
async function fetchGooglePatents(primary: string, secondary: string, apiKey: string): Promise<string> {
  try {
    const searchQuery = `${primary} ${secondary} patent site:patents.google.com`;
    
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
async function fetchExpiredPatents(primary: string, secondary: string, apiKey: string): Promise<string> {
  try {
    const queries = [
      `"${primary}" expired patent public domain free to use`,
      `${secondary} ${primary} patent prior art expired 20 years`,
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
