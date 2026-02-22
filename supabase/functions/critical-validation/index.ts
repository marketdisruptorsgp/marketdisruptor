import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, analysisData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a rigorous critical thinking analyst. You combine:
- Charlie Munger (inversion thinking, mental models, checklist discipline)
- Daniel Kahneman (cognitive biases, System 1 vs System 2)
- Ben Horowitz (hard truths about building products)
- Warren Buffett (risk assessment, margin of safety)
- Ray Dalio (radical transparency, stress testing)

Your job: Take a product analysis and its redesigned concept and STRESS TEST it ruthlessly.

You produce TWO perspectives (Red Team attacks, Blue Team defends), find real-world counter-examples, create a feasibility checklist, and cite reasoning sources.

Respond ONLY with a single valid JSON object — no markdown, no explanation.

The JSON must follow this EXACT structure:
{
  "redTeam": {
    "verdict": "One-line harsh verdict on why this concept will fail",
    "arguments": [
      { "title": "Attack title", "argument": "Detailed argument for why this will fail (2-3 sentences)", "severity": "critical|major|minor", "biasExposed": "Name of cognitive bias this exposes (e.g. Optimism Bias, Survivorship Bias)" }
    ],
    "killShot": "The single most devastating argument against this concept"
  },
  "blueTeam": {
    "verdict": "One-line compelling case for why this could succeed",
    "arguments": [
      { "title": "Defense title", "argument": "Detailed argument for why this concern is surmountable (2-3 sentences)", "strength": "strong|moderate|conditional", "enabler": "What makes this possible (technology, market shift, cultural change)" }
    ],
    "moonshot": "The single strongest argument for why this concept could be transformative"
  },
  "counterExamples": [
    {
      "name": "Real product or company name",
      "outcome": "succeeded|failed|pivoted",
      "similarity": "How it relates to this concept",
      "lesson": "Key takeaway for this redesign",
      "year": "Year it happened"
    }
  ],
  "feasibilityChecklist": [
    {
      "category": "Technical|Manufacturing|Regulatory|Market|Financial|Talent",
      "item": "Specific thing to verify",
      "status": "critical|important|nice-to-have",
      "detail": "What exactly needs to be checked and how",
      "estimatedCost": "Rough cost or time to verify"
    }
  ],
  "confidenceScores": {
    "technicalFeasibility": { "score": 7, "reasoning": "Why this score" },
    "marketDemand": { "score": 6, "reasoning": "Why this score" },
    "competitiveAdvantage": { "score": 8, "reasoning": "Why this score" },
    "executionComplexity": { "score": 5, "reasoning": "Why this score (lower = harder)" },
    "overallViability": { "score": 7, "reasoning": "Synthesized assessment" }
  },
  "blindSpots": [
    "Critical blind spot 1 that the analysis missed entirely",
    "Blind spot 2",
    "Blind spot 3"
  ]
}`;

    const userPrompt = `STRESS TEST this product redesign concept with maximum rigor.

PRODUCT: ${product.name}
CATEGORY: ${product.category}

REDESIGNED CONCEPT: ${analysisData.redesignedConcept?.conceptName || "Unknown"}
TAGLINE: ${analysisData.redesignedConcept?.tagline || "N/A"}
CORE INSIGHT: ${analysisData.redesignedConcept?.coreInsight || "N/A"}
KEY DIFFERENCES: ${JSON.stringify(analysisData.redesignedConcept?.radicalDifferences || [])}
PHYSICAL FORM: ${analysisData.redesignedConcept?.physicalDescription || "N/A"}
MATERIALS: ${JSON.stringify(analysisData.redesignedConcept?.materials || [])}
SMART FEATURES: ${JSON.stringify(analysisData.redesignedConcept?.smartFeatures || [])}
PRICE POINT: ${analysisData.redesignedConcept?.pricePoint || "N/A"}
TARGET USER: ${analysisData.redesignedConcept?.targetUser || "N/A"}
MANUFACTURING: ${analysisData.redesignedConcept?.manufacturingPath || "N/A"}
BIGGEST RISK: ${analysisData.redesignedConcept?.biggestRisk || "N/A"}

HIDDEN ASSUMPTIONS IDENTIFIED:
${analysisData.hiddenAssumptions?.map((a: { assumption: string }) => "• " + a.assumption).join("\n") || "None"}

FLIPPED LOGIC:
${analysisData.flippedLogic?.map((f: { originalAssumption: string; boldAlternative: string }) => "• " + f.originalAssumption + " → " + f.boldAlternative).join("\n") || "None"}

CRITICAL INSTRUCTIONS:
1. RED TEAM: Be BRUTAL. Find every way this fails. Name specific cognitive biases at play.
2. BLUE TEAM: Be HONEST but compelling. Only defend what's genuinely defensible.
3. COUNTER-EXAMPLES: Use REAL companies/products — no fabrication. Include year.
4. FEASIBILITY CHECKLIST: Actionable items with cost estimates. Cover regulatory, technical, market.
5. CONFIDENCE SCORES: 1-10, evidence-based. Don't default to middle scores.
6. BLIND SPOTS: What did the original analysis completely miss?
7. Provide 4-6 arguments for both Red and Blue teams.
8. Provide 3-5 counter-examples, 6-10 feasibility items, and 3-4 blind spots.

Return ONLY the JSON object.`;

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
        temperature: 0.5,
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${txt}`);
    }

    const aiData = await response.json();
    const rawText: string = aiData.choices?.[0]?.message?.content ?? "";

    let cleaned = rawText
      .replace(/^```(?:json)?\s*/im, "")
      .replace(/\s*```\s*$/m, "")
      .trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    let validation;
    try {
      validation = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr);
      console.error("Raw content (first 500):", cleaned.slice(0, 500));
      throw new Error("AI returned invalid JSON. Please retry.");
    }

    return new Response(JSON.stringify({ success: true, validation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("critical-validation error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
