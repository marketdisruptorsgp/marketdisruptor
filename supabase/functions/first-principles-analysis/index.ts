import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a radical first-principles product strategist and industrial designer. You deconstruct products to their atomic truths and redesign them from scratch. Your analysis is bold, specific, and commercially grounded.

You think like a combination of Dieter Rams (design purity), Elon Musk (first principles), and Jony Ive (form and human connection).

Respond ONLY with a single valid JSON object — no markdown, no explanation.

The JSON must follow this EXACT structure:
{
  "coreReality": {
    "trueProblem": "The actual human problem being solved (not what marketing says)",
    "actualUsage": "How people genuinely use this — observed behaviors, rituals, workarounds",
    "normalizedFrustrations": ["frustration 1", "frustration 2", "frustration 3", "frustration 4"],
    "userHacks": ["hack or workaround 1", "hack or workaround 2", "hack or workaround 3"]
  },
  "hiddenAssumptions": [
    {
      "assumption": "Why this specific shape/form?",
      "currentAnswer": "Because...",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": true
    },
    {
      "assumption": "Why this material?",
      "currentAnswer": "Because...",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": true
    },
    {
      "assumption": "Why this size/scale?",
      "currentAnswer": "Because...",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": false
    },
    {
      "assumption": "Why is it static/rigid?",
      "currentAnswer": "Because...",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": true
    },
    {
      "assumption": "Why does the human adapt to it?",
      "currentAnswer": "Because...",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": true
    },
    {
      "assumption": "Why this interaction model?",
      "currentAnswer": "Because...",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": true
    }
  ],
  "flippedLogic": [
    {
      "originalAssumption": "State the assumption being flipped",
      "boldAlternative": "The radical alternative approach",
      "rationale": "Why this flip creates real value",
      "physicalMechanism": "How it would actually work physically"
    },
    {
      "originalAssumption": "Second assumption",
      "boldAlternative": "Second radical alternative",
      "rationale": "Why this matters",
      "physicalMechanism": "Physical/technical mechanism"
    },
    {
      "originalAssumption": "Third assumption",
      "boldAlternative": "Third radical alternative",
      "rationale": "Why this matters",
      "physicalMechanism": "Physical/technical mechanism"
    }
  ],
  "redesignedConcept": {
    "conceptName": "Short punchy name",
    "tagline": "One sentence tagline",
    "coreInsight": "The central design truth this is built around (2-3 sentences)",
    "radicalDifferences": ["Key difference 1", "Key difference 2", "Key difference 3", "Key difference 4"],
    "physicalDescription": "Detailed description of what it looks like, feels like, how it's held/used. Be vivid and specific.",
    "materials": ["Material 1 with reason", "Material 2 with reason", "Material 3 with reason"],
    "userExperienceTransformation": "How the experience of using this completely changes — describe the before and after journey",
    "whyItHasntBeenDone": "Specific technical, economic, or cultural reasons why this hasn't existed yet",
    "biggestRisk": "The single most likely failure point and how to mitigate it",
    "manufacturingPath": "How you'd actually make this — specific suppliers, processes, cost estimate",
    "pricePoint": "Target retail price and why the market will pay it",
    "targetUser": "Exactly who buys this first — not a demographic, a specific human moment or identity"
  }
}`;

    const userPrompt = `Apply brutal first-principles deconstruction to this product. Challenge every assumption. Propose ONE bold redesigned concept.

PRODUCT: ${product.name}
CATEGORY: ${product.category}
ERA: ${product.era}
DESCRIPTION: ${product.description}
SPECS: ${product.specs}
KEY INSIGHT: ${product.keyInsight || "None provided"}
MARKET SIZE: ${product.marketSizeEstimate || "Unknown"}

KNOWN USER COMPLAINTS:
${product.reviews?.filter((r: { sentiment: string }) => r.sentiment === "negative").map((r: { text: string }) => `• ${r.text}`).join("\n") || "General friction points"}

EXISTING ASSUMPTIONS IDENTIFIED:
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption} → current challenge: ${a.challenge}`).join("\n") || "None pre-identified"}

COMMUNITY PAIN POINTS:
${(product as { communityInsights?: { topComplaints?: string[] } }).communityInsights?.topComplaints?.map((c: string) => `• ${c}`).join("\n") || "See reviews above"}

INSTRUCTIONS:
- Be BOLD. The redesigned concept must be structurally different, not a feature add.
- Avoid "add an app" or "make it Bluetooth" as the primary innovation.
- Focus on physical, ergonomic, material, or interaction model breakthroughs.
- The concept must be plausible to manufacture within 2–3 years.
- Name a real manufacturing path (specific country, process, or supplier category).
- The price point must be justified by the value transformation described.

Return ONLY the JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 8000,
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

    // Robust JSON extraction: strip markdown fences, then find first { to last }
    let cleaned = rawText
      .replace(/^```(?:json)?\s*/im, "")
      .replace(/\s*```\s*$/m, "")
      .trim();

    // Find the outermost JSON object in case there's any preamble text
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr);
      console.error("Raw content (first 500):", cleaned.slice(0, 500));
      // Last resort: try to fix common truncation by attempting a partial parse
      throw new Error("AI returned invalid JSON. Please retry.");
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("first-principles-analysis error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
