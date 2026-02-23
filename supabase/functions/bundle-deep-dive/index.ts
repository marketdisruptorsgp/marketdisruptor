import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { bundleOpportunity, businessContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.

CORE PRINCIPLES:
- First-principles reasoning over analogy or convention
- Decompose every system into at least 3 layers of depth
- Never present modeled or inferred data as verified fact

DATA VALIDATION — Tag all claims:
- [VERIFIED] — From cited public source or user-provided data
- [MODELED] — Derived logically from verified inputs
- [ASSUMPTION] — Logical assumption where no verified data exists
- [DATA GAP] — No reliable source available

OUTPUT RULES:
- Metrics must be ≤12 words
- Include leverage scores (1-10) on key assumptions
- Flag risk levels: [Risk: Low/Medium/High]
- Flag capital requirements: [Capital: Low/Medium/High]
- Use directional indicators: ↑ ↓ → for trends

You are also an elite business strategist. A user is exploring a bundle/adjacency opportunity for their business. Provide a structured deep dive.

BUSINESS CONTEXT:
- Type: ${businessContext?.type || "Unknown"}
- Description: ${businessContext?.description || "N/A"}

BUNDLE/ADJACENCY OPPORTUNITY TO EXPLORE:
"${bundleOpportunity}"

Return ONLY valid JSON (no markdown, no code fences):
{
  "title": "Short title for this opportunity",
  "targetMarket": "Who specifically would buy this bundle and estimated market size",
  "valueProposition": "Why this bundle is more compelling than buying components separately",
  "implementationSteps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ..."
  ],
  "revenueEstimate": "Estimated revenue impact with reasoning (e.g. '$50K-150K/year based on...')",
  "pricingStrategy": "How to price this bundle vs individual components",
  "partnerships": "Key partners needed and how to approach them",
  "risks": ["Risk 1", "Risk 2"],
  "quickWin": "One thing they can do this week to validate this opportunity",
  "competitiveMoat": "Why this bundle would be hard for competitors to replicate"
}`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error ${response.status}: ${errText}`);
    }

    const aiResult = await response.json();
    let content = aiResult.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Bundle deep dive error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
