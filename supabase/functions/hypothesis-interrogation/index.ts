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

function buildSystemPrompt(analysisData: any, title: string, category: string): string {
  const governed = analysisData?.governed || {};
  const rootHypotheses = governed.root_hypotheses || [];
  const constraintMap = governed.constraint_map || {};
  const synopsis = governed.reasoning_synopsis || {};

  return `You are a STRUCTURAL HYPOTHESIS PARTNER. Your job is to help the user POSE NEW HYPOTHESES or challenge existing ones about the root constraints driving this analysis.

ANALYSIS: "${title}" | Category: ${category}

CURRENT ROOT HYPOTHESES:
${truncateJSON(rootHypotheses, 3000)}

CONSTRAINT MAP:
${truncateJSON(constraintMap, 2000)}

REASONING SYNOPSIS:
${truncateJSON(synopsis, 2000)}

YOUR ROLE:
- Help users identify NEW structural constraints the system may have missed
- Challenge whether existing hypotheses are truly "root" or are symptoms of deeper issues
- Propose alternative causal chains that could explain the same observations
- Evaluate user-proposed hypotheses against the evidence base

RESPONSE FORMAT — MANDATORY:
1. **Assessment** (1-2 sentences) — Is this a valid structural hypothesis? Does it compete with or complement existing ones?
2. **Evidence** (2-4 bullets) — What in the analysis supports or contradicts this hypothesis?
3. **Structural Impact** (1-2 sentences) — If adopted, how would this reshape Disrupt, Redesign, and downstream steps?

TOTAL LENGTH: 80-150 words. NEVER exceed 200 words. Be direct and specific.

CRITICAL RULES:
- Every hypothesis MUST trace to a structural constraint (cost, time, adoption, scale, reliability, risk, etc.)
- No vague "maybe consider" language. Commit to a position.
- ALWAYS reference specific data from the analysis.
- When proposing a new hypothesis, include a dominance estimate relative to existing ones.

REVISION FORMAT (when the user's hypothesis should be added):
\`\`\`:::revision
{
  "type": "new_hypothesis",
  "payload": {
    "constraint_type": "the_type",
    "hypothesis_statement": "Clear statement of the root constraint",
    "leverage_score": 7,
    "impact_score": 6,
    "fragility_score": 4,
    "evidence_mix": { "verified": 0.3, "modeled": 0.5, "assumption": 0.2 },
    "confidence": 45,
    "downstream_implications": "How this changes the analysis"
  }
}
\`\`\``;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const { question, history, analysisData, title, category } = body;

    if (!question) throw new Error("Missing 'question' field");

    const systemPrompt = buildSystemPrompt(analysisData, title || "Untitled", category || "Unknown");

    const messages: any[] = [{ role: "system", content: systemPrompt }];
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
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    console.error("hypothesis-interrogation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
