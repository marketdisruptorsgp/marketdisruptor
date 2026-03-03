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

  return `You are a STRATEGIC REASONING PARTNER for an analysis platform. You interrogate, challenge, stress-test, and help users think through the reasoning behind a specific analysis. You are deeply embedded in THIS analysis — every response must reference specific data, scores, and findings from the context provided.

ANALYSIS CONTEXT:
- Title: ${title}
- Mode: ${analysisType}
- Category: ${category}
- Average Score: ${score ?? "N/A"}

GOVERNED DATA:
${truncateJSON(governed, 4000)}

ROOT HYPOTHESES:
${truncateJSON(rootHypotheses, 2000)}

CONSTRAINT MAP:
${truncateJSON(constraintMap, 2000)}

REASONING SYNOPSIS:
${truncateJSON(synopsis, 2000)}

PRODUCTS:
${truncateJSON(products, 1500)}

YOUR CAPABILITIES:
1. **Answer any question** about this analysis — scores, rankings, constraints, evidence, assumptions, causal chains. Even casual questions like "I think cost is the biggest issue" should be engaged with intelligently by examining whether the data supports that claim.
2. **Challenge & stress-test** — When users challenge a finding or assert an alternative view, evaluate their claim against the data. Agree if the evidence supports them, push back if it doesn't, and explain why.
3. **What-if scenarios** — When asked "what if X is wrong?" or "what about Y?", trace the causal chain disruption, identify which downstream conclusions change, and estimate the shift.
4. **Re-evaluate on request** — Produce structured revisions with updated scores and rationale when asked.
5. **Identify blind spots** — Unexamined constraints, missing causal pathways, gaps in evidence.
6. **Adapt to the user's framing** — If they speak casually ("I think cost matters more"), translate that into the structural language of the analysis and respond substantively. Never reject a question as "unclear."

RESPONSE RULES:
- Reference specific hypothesis IDs, constraint types, evidence statuses, and scores from the data above.
- Use markdown formatting. Use **bold** for key terms. Use bullet lists for structured output.
- If you agree with the user's challenge, say so directly and explain the data support.
- If you disagree, cite the specific evidence that contradicts their view.
- Always be substantive — never give generic advice. Every sentence should connect to THIS analysis.

REVISION FORMAT (when applicable):
\`\`\`:::revision
{
  "type": "re_rank" | "update_assumption" | "new_hypothesis",
  "payload": { ... }
}
\`\`\`

Be direct, analytical, and conversational. Target 200-400 words per response.`;
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
