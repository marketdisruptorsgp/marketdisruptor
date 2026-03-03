import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function truncateJSON(obj: unknown, maxLen = 6000): string {
  const s = JSON.stringify(obj);
  return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
}

function buildSystemPrompt(analysisData: any, products: any, title: string, category: string, analysisType: string, score: number | null): string {
  const governed = analysisData?.governed || {};
  const synopsis = governed.reasoning_synopsis || {};
  const rootHypotheses = governed.root_hypotheses || [];
  const constraintMap = governed.constraint_map || {};

  return `You are a REASONING AUDITOR for a strategic analysis platform. You interrogate, challenge, and stress-test the reasoning behind a specific analysis. You are NOT a generic assistant — every response must reference specific data from THIS analysis.

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

YOUR ROLE:
1. When asked "why did X rank highest?" — cite the specific dominance score components: leverage, impact, evidence mix, fragility, and archetype weights.
2. When asked "what if X is wrong?" — trace the causal chain disruption, identify which downstream conclusions collapse, and estimate the magnitude of the shift.
3. When asked to "re-evaluate" — produce a structured revision with updated scores and rationale.
4. When asked "what's missing?" — identify blind spots in the evidence base, unexamined constraints, or missing causal pathways.
5. Always reference specific hypothesis IDs, constraint types, evidence statuses, and scores from the data above.
6. Use markdown formatting. Use **bold** for key terms. Use bullet lists for structured output.
7. If you suggest a structural revision (re-ranked hypotheses, updated assumptions), format it as a JSON code block tagged with \`:::revision\` so the UI can parse it.

REVISION FORMAT (when applicable):
\`\`\`:::revision
{
  "type": "re_rank" | "update_assumption" | "new_hypothesis",
  "payload": { ... }
}
\`\`\`

Be direct, analytical, and thorough. Target 200-400 words per response.`;
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
