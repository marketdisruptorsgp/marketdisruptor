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

    // Gather user data in parallel
    const [analysesRes, patentsRes, trendsRes, newsRes] = await Promise.all([
      supabase.from("saved_analyses").select("title, category, analysis_type, avg_revival_score, created_at, era, audience, batch_size, analysis_data, products").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("patent_filings").select("title, category, assignee, filing_date, status").order("created_at", { ascending: false }).limit(30),
      supabase.from("trend_signals").select("keyword, category, growth_note, opportunity_angle, data_quality").order("created_at", { ascending: false }).limit(20),
      supabase.from("market_news").select("title, category, source_name, summary, published_at").order("created_at", { ascending: false }).limit(10),
    ]);

    const analyses = analysesRes.data || [];
    const patents = patentsRes.data || [];
    const trends = trendsRes.data || [];
    const news = newsRes.data || [];

    // Build context summary
    const analysisSummary = analyses.map((a: any, i: number) => {
      const data = a.analysis_data || {};
      const geoSnippet = data.geoMarketData ? `Geo: ${truncate(JSON.stringify(data.geoMarketData), 200)}` : "";
      const regSnippet = data.regulatoryIntelligence ? `Regulatory: ${truncate(JSON.stringify(data.regulatoryIntelligence), 200)}` : "";
      const prodCount = Array.isArray(a.products) ? a.products.length : 0;
      return `${i + 1}. "${a.title}" | Type: ${a.analysis_type || a.category} | Score: ${a.avg_revival_score ?? "N/A"} | Era: ${a.era} | Audience: ${a.audience} | Products: ${prodCount} | Created: ${a.created_at?.slice(0, 10)}${geoSnippet ? ` | ${geoSnippet}` : ""}${regSnippet ? ` | ${regSnippet}` : ""}`;
    }).join("\n");

    const patentSummary = patents.length > 0
      ? `Patent filings (${patents.length} recent):\n` + patents.slice(0, 15).map((p: any) => `- "${truncate(p.title, 80)}" | ${p.category} | ${p.assignee || "Unknown"} | ${p.filing_date || "N/A"}`).join("\n")
      : "No patent data available.";

    const trendSummary = trends.length > 0
      ? `Trend signals (${trends.length}):\n` + trends.map((t: any) => `- ${t.keyword} (${t.category}) | ${t.growth_note || "No note"} | Quality: ${t.data_quality}`).join("\n")
      : "No trend data available.";

    const newsSummary = news.length > 0
      ? `Market news (${news.length} recent):\n` + news.map((n: any) => `- "${truncate(n.title, 80)}" | ${n.category} | ${n.source_name}`).join("\n")
      : "No market news available.";

    const hasAttachments = (Array.isArray(imageUrls) && imageUrls.length > 0) || (Array.isArray(pdfUrls) && pdfUrls.length > 0);
    const attachmentNote = hasAttachments
      ? `\n\nThe user has attached files to this message. Images are provided inline. For PDFs, the URLs are provided — describe what you can infer or suggest the user share specific sections.`
      : "";

    const systemPrompt = `You are an expert strategic intelligence analyst embedded in a product/business analysis platform. The user has a workspace with saved analyses, and you have access to their data plus platform-wide market intelligence.

Your job:
- Answer questions about their projects, scores, patterns, risks, and opportunities
- Compare projects across dimensions (score, category, market size, risk)
- Identify trends and insights from their portfolio data
- When the user shares images or documents, analyze them and incorporate findings into your strategic advice
- When useful, generate charts by calling the render_chart tool
- Keep answers strategic, concise (3-6 sentences unless more detail requested)
- Use a confident analyst tone${attachmentNote}

USER'S WORKSPACE DATA:

Projects (${analyses.length} total):
${analysisSummary || "No projects yet."}

${patentSummary}

${trendSummary}

${newsSummary}

When creating charts:
- Use "bar" for comparisons across projects/categories
- Use "line" for time-series or trends
- Labels should be short (truncate project names to ~20 chars)
- Always give charts a clear title`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history if provided
    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Build user message content (multimodal if images attached)
    const userContent: any[] = [];

    // Add images as image_url parts
    if (Array.isArray(imageUrls)) {
      for (const url of imageUrls.slice(0, 4)) {
        userContent.push({ type: "image_url", image_url: { url } });
      }
    }

    // Add PDF URLs as text context
    if (Array.isArray(pdfUrls) && pdfUrls.length > 0) {
      userContent.push({ type: "text", text: `[Attached PDFs: ${pdfUrls.join(", ")}]` });
    }

    userContent.push({ type: "text", text: question });

    // Use multimodal format if attachments, otherwise plain text
    if (userContent.length > 1) {
      messages.push({ role: "user", content: userContent });
    } else {
      messages.push({ role: "user", content: question });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
