import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function truncateJSON(obj: unknown, maxLen = 6000): string {
  if (obj === undefined || obj === null) return "null";
  const s = JSON.stringify(obj);
  if (!s) return "null";
  return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
}

function buildSystemPrompt(analysisData: any, products: any, title: string, category: string, analysisType: string, score: number | null): string {
  const governed = analysisData?.governed || {};
  const synopsis = governed.reasoning_synopsis || {};
  const rootHypotheses = governed.root_hypotheses || [];
  const constraintMap = governed.constraint_map || {};
  // Also extract product-level data for richer context
  const productList = Array.isArray(products) ? products : (analysisData?.products ? (Array.isArray(analysisData.products) ? analysisData.products : []) : []);
  const analysisScores = governed.scores || analysisData?.scores || {};

  return `You are a STRATEGIC REASONING PARTNER embedded in a specific analysis. You help users think through findings, challenge assumptions, and explore alternatives.

ANALYSIS: "${title}" | Mode: ${analysisType} | Category: ${category} | Avg Score: ${score ?? "N/A"}

GOVERNED DATA:
${truncateJSON(governed, 4000)}

ROOT HYPOTHESES:
${truncateJSON(rootHypotheses, 2000)}

CONSTRAINT MAP:
${truncateJSON(constraintMap, 2000)}

REASONING SYNOPSIS:
${truncateJSON(synopsis, 2000)}

PRODUCTS ANALYZED:
${truncateJSON(productList, 2000)}

SCORES & METRICS:
${truncateJSON(analysisScores, 1000)}

RESPONSE FORMAT — MANDATORY:
You MUST keep responses SHORT and SCANNABLE. Follow this structure:

1. **Verdict** (1 sentence, bold) — Your direct answer or position
2. **Evidence** (2-4 bullet points max) — Specific data points from THIS analysis that support/contradict the claim
3. **Implication** (1-2 sentences) — What this means for the analysis or what should change

TOTAL LENGTH: 80-150 words. NEVER exceed 200 words.

CRITICAL RULES:
- NEVER say "there is no data" or "no governed data exists." Every analysis has products, scores, and context. USE THEM.
- If root_hypotheses are empty, reason from the products, scores, category, and constraint map instead. There is ALWAYS something to work with.
- Price/cost is ALWAYS relevant — if the user raises it, engage with it using the product data, category norms, and scoring dimensions.
- Use **bold** for key terms. Use bullet points. No long paragraphs.
- Be opinionated. Take a stance. Don't hedge with "it depends."
- If you agree with the user, say so in one line and explain WHY with data.
- If you disagree, say so directly and cite the specific evidence.

REVISION FORMAT (when suggesting changes):
\`\`\`:::revision
{
  "type": "re_rank" | "update_assumption" | "new_hypothesis",
  "payload": { ... }
}
\`\`\``;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const { question, history, analysisData, products, title, category, analysisType, avgScore } = body;

    if (!question) throw new Error("Missing 'question' field");

    const systemPrompt = buildSystemPrompt(analysisData, products, title || "Untitled", category || "Unknown", analysisType || "product", avgScore ?? null);

    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    if (Array.isArray(history)) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: "user", content: question });

    const response = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error [${response.status}]`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("reasoning-interrogation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
