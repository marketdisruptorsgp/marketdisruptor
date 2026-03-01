import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function truncate(str: string | null, max = 120): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function safeStringify(obj: any, maxLen = 800): string {
  try {
    const s = JSON.stringify(obj);
    return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
  } catch { return ""; }
}

function extractProductDetails(products: any): string {
  if (!Array.isArray(products) || products.length === 0) return "";
  return products.slice(0, 8).map((p: any, i: number) => {
    const name = p.name || p.title || `Product ${i + 1}`;
    const score = p.revival_score ?? p.score ?? "N/A";
    const desc = truncate(p.description || p.modernTwist || p.modern_twist || "", 150);
    const pricing = p.pricing || p.price || "";
    const audience = p.targetAudience || p.target_audience || "";
    return `  • ${name} (score: ${score})${desc ? ` — ${desc}` : ""}${pricing ? ` | Price: ${pricing}` : ""}${audience ? ` | Audience: ${audience}` : ""}`;
  }).join("\n");
}

function extractAnalysisDeepData(data: any): string {
  if (!data || typeof data !== "object") return "";
  const parts: string[] = [];

  // Extract key sections with more depth
  if (data.geoMarketData) {
    parts.push(`Geographic Market Data: ${safeStringify(data.geoMarketData, 600)}`);
  }
  if (data.regulatoryIntelligence) {
    parts.push(`Regulatory Intelligence: ${safeStringify(data.regulatoryIntelligence, 600)}`);
  }
  if (data.businessModelAnalysis) {
    parts.push(`Business Model Analysis: ${safeStringify(data.businessModelAnalysis, 600)}`);
  }
  if (data.firstPrinciplesAnalysis) {
    parts.push(`First Principles Analysis: ${safeStringify(data.firstPrinciplesAnalysis, 600)}`);
  }
  if (data.criticalValidation) {
    parts.push(`Critical Validation (Red/Green Team): ${safeStringify(data.criticalValidation, 600)}`);
  }
  if (data.pitchDeck) {
    parts.push(`Pitch Deck Summary: ${safeStringify(data.pitchDeck, 400)}`);
  }
  if (data.flippedIdeas) {
    parts.push(`Disruption Ideas: ${safeStringify(data.flippedIdeas, 500)}`);
  }
  if (data.stressTest) {
    parts.push(`Stress Test Results: ${safeStringify(data.stressTest, 400)}`);
  }
  if (data.supplyChain) {
    parts.push(`Supply Chain Analysis: ${safeStringify(data.supplyChain, 400)}`);
  }
  if (data.userJourney) {
    parts.push(`User Journey: ${safeStringify(data.userJourney, 400)}`);
  }
  if (data.extractedIntelligence) {
    parts.push(`Extracted Business Intelligence: ${safeStringify(data.extractedIntelligence, 600)}`);
  }

  return parts.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { question, history, imageUrls, pdfUrls } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Missing question" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather user data in parallel — pull FULL analysis_data
    const [analysesRes, patentsRes, trendsRes, newsRes, lensRes] = await Promise.all([
      supabase.from("saved_analyses").select("title, category, analysis_type, avg_revival_score, created_at, era, audience, batch_size, analysis_data, products").eq("user_id", userId).order("created_at", { ascending: false }).limit(15),
      supabase.from("patent_filings").select("title, category, assignee, filing_date, status, abstract").order("created_at", { ascending: false }).limit(30),
      supabase.from("trend_signals").select("keyword, category, growth_note, opportunity_angle, data_quality, source, source_urls").order("created_at", { ascending: false }).limit(20),
      supabase.from("market_news").select("title, category, source_name, summary, published_at, source_url").order("created_at", { ascending: false }).limit(15),
      supabase.from("user_lenses").select("name, primary_objective, target_outcome, risk_tolerance, time_horizon, constraints, available_resources").eq("user_id", userId).limit(5),
    ]);

    const analyses = analysesRes.data || [];
    const patents = patentsRes.data || [];
    const trends = trendsRes.data || [];
    const news = newsRes.data || [];
    const lenses = lensRes.data || [];

    // Build DEEP context — unpack the full analysis data
    const analysisSummary = analyses.map((a: any, i: number) => {
      const productDetails = extractProductDetails(a.products);
      const deepData = extractAnalysisDeepData(a.analysis_data);
      return `--- PROJECT ${i + 1}: "${a.title}" ---
Type: ${a.analysis_type || a.category} | Score: ${a.avg_revival_score ?? "N/A"} | Era: ${a.era} | Audience: ${a.audience} | Created: ${a.created_at?.slice(0, 10)}
${productDetails ? `Products:\n${productDetails}` : ""}
${deepData || "No deep analysis data."}`;
    }).join("\n\n");

    const patentSummary = patents.length > 0
      ? `PATENT FILINGS (${patents.length} recent):\n` + patents.slice(0, 20).map((p: any) => `- "${truncate(p.title, 100)}" | ${p.category} | Assignee: ${p.assignee || "Unknown"} | Filed: ${p.filing_date || "N/A"} | Status: ${p.status || "N/A"}${p.abstract ? ` | Abstract: ${truncate(p.abstract, 200)}` : ""}`).join("\n")
      : "No patent data available.";

    const trendSummary = trends.length > 0
      ? `TREND SIGNALS (${trends.length}):\n` + trends.map((t: any) => `- ${t.keyword} (${t.category}) | Growth: ${t.growth_note || "Unknown"} | Opportunity: ${t.opportunity_angle || "None"} | Quality: ${t.data_quality}${t.source ? ` | Source: ${t.source}` : ""}`).join("\n")
      : "No trend data available.";

    const newsSummary = news.length > 0
      ? `MARKET NEWS (${news.length} recent):\n` + news.map((n: any) => `- "${truncate(n.title, 100)}" | ${n.category} | ${n.source_name} | ${n.published_at?.slice(0, 10) || "N/A"}${n.summary ? `\n  Summary: ${truncate(n.summary, 300)}` : ""}`).join("\n")
      : "No market news available.";

    const lensSummary = lenses.length > 0
      ? `USER'S STRATEGIC LENSES:\n` + lenses.map((l: any) => `- "${l.name}": Objective: ${l.primary_objective || "N/A"} | Outcome: ${l.target_outcome || "N/A"} | Risk tolerance: ${l.risk_tolerance || "N/A"} | Time horizon: ${l.time_horizon || "N/A"} | Constraints: ${l.constraints || "N/A"} | Resources: ${l.available_resources || "N/A"}`).join("\n")
      : "";

    const hasAttachments = (Array.isArray(imageUrls) && imageUrls.length > 0) || (Array.isArray(pdfUrls) && pdfUrls.length > 0);
    const attachmentNote = hasAttachments
      ? `\n\nThe user has attached files. Images are provided inline. For PDFs, URLs are provided — analyze what you can infer.`
      : "";

    const systemPrompt = `You are a senior strategic intelligence analyst embedded in a product/business analysis platform with deep access to the user's data.

RESPONSE FORMAT — MANDATORY:
You MUST structure EVERY response using this format. No exceptions.

1. **Lead with a visual** — ALWAYS call render_chart (bar, line, or table) FIRST before any text. If the question involves any data, create a chart. If comparing anything, create a table. Default to visual.

2. **One-sentence verdict** — After the chart, give ONE bold sentence that states your conclusion. No preamble.

3. **Insight cards** — Use this exact markdown format for key findings (2-4 cards max):

:::insight HIGH|MEDIUM|LOW
**[Insight title — 5 words max]**
[2 sentences max. Specific. Data-grounded. No filler.]
:::

4. **Only if asked** for detail, provide deeper narrative. Otherwise STOP after insight cards.

WRITING RULES:
- Maximum 120 words of prose per response (charts/tables don't count)
- ZERO filler words: no "great question", "I'd be happy to", "it's worth noting", "in terms of", "it's important to"
- Every sentence must contain a specific number, name, date, or data point from their workspace
- Use sentence fragments over full sentences when meaning is clear: "Score: 7.2 → top quartile" not "The score of 7.2 places this project in the top quartile"
- Bold the most important phrase in each insight card
- If you don't have data to answer, say exactly what's missing in one sentence. Don't pad.

ANTI-PATTERNS:
- Never write paragraphs. Use bullet fragments.
- Never repeat the user's question back.
- Never use "consider" or "you might want to" — give direct recommendations.
- Never give advice that could apply to any business. Reference THEIR specific projects by name.

PROACTIVE SIGNALS:
- If data reveals a risk/opportunity they didn't ask about, add one :::insight card flagging it.
- Cross-reference patents, trends, and projects automatically.

CHART GUIDELINES:
- ALWAYS render at least one chart per response
- Use "bar" for comparisons, "line" for time-series, "table" for multi-dimensional data
- Keep labels under 20 chars
- Clear, specific titles${attachmentNote}

${lensSummary ? `\n${lensSummary}\n` : ""}
USER'S WORKSPACE DATA:

PROJECTS (${analyses.length} total):
${analysisSummary || "No projects yet."}

${patentSummary}

${trendSummary}

${newsSummary}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    if (Array.isArray(history)) {
      for (const msg of history.slice(-8)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Build user message content (multimodal if images attached)
    const userContent: any[] = [];

    if (Array.isArray(imageUrls)) {
      for (const url of imageUrls.slice(0, 4)) {
        userContent.push({ type: "image_url", image_url: { url } });
      }
    }

    if (Array.isArray(pdfUrls) && pdfUrls.length > 0) {
      userContent.push({ type: "text", text: `[Attached PDFs: ${pdfUrls.join(", ")}]` });
    }

    userContent.push({ type: "text", text: question });

    if (userContent.length > 1) {
      messages.push({ role: "user", content: userContent });
    } else {
      messages.push({ role: "user", content: question });
    }

    // Use gemini-2.5-pro for deeper reasoning and longer context
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        stream: true,
        tools: [
          {
            type: "function",
            function: {
              name: "render_chart",
              description: "Render an inline chart or table visualization in the user's workspace. Use for comparisons, trends, or data summaries.",
              parameters: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["bar", "line", "table"], description: "Chart type" },
                  title: { type: "string", description: "Chart title" },
                  labels: { type: "array", items: { type: "string" }, description: "X-axis labels or row headers" },
                  values: { type: "array", items: { type: "number" }, description: "Y-axis values or row data" },
                  headers: { type: "array", items: { type: "string" }, description: "Table column headers (for table type)" },
                  rows: { type: "array", items: { type: "array", items: { type: "string" } }, description: "Table rows (for table type)" },
                },
                required: ["type", "title"],
                additionalProperties: false,
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("workspace-query error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
