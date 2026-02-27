import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OS_PREAMBLE = `You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.

You analyze product/service photos to extract deep competitive intelligence. You must infer as much as possible from visual cues: materials, build quality, design language, market positioning, user experience, and competitive landscape.

DATA VALIDATION — Tag all claims:
- [VISUAL] — Directly observed in the image
- [CONTEXTUAL] — Inferred from visual context + market knowledge
- [ASSUMPTION] — Logical assumption where no direct evidence exists

OUTPUT RULES:
- Be specific and actionable
- Include confidence levels (high/medium/low) for each insight
- Flag risk levels: [Risk: Low/Medium/High]
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrls, mode, depth } = await req.json();

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const isService = mode === "service";
    const isBusiness = mode === "business";
    const isDeep = depth === "deep";

    const modeLabel = isBusiness ? "business model" : isService ? "service" : "product";

    const quickSchema = `{
  "name": "Identified ${modeLabel} name or description",
  "category": "Inferred category",
  "description": "2-3 sentence description of what this is and its market position",
  "revivalScore": 7,
  "keyInsight": "The single most provocative insight — be bold and specific",
  "confidenceLevel": "high|medium|low",
  "userJourney": {
    "steps": ["Step 1: discovery", "Step 2: purchase/signup", "Step 3: first use", "Step 4: core experience", "Step 5: post-use/retention"],
    "frictionPoints": [
      {"step": "step name", "friction": "specific friction", "severity": "high|medium|low", "source": "[VISUAL] or [CONTEXTUAL]"}
    ]
  },
  ${isService ? `"operationalIntel": {
    "deliveryModel": "How the service appears to be delivered",
    "bottlenecks": ["Operational bottleneck 1", "Bottleneck 2"],
    "automationOpportunities": ["Opportunity 1", "Opportunity 2"]
  },` : `"supplyChain": {
    "materials": "Visible materials and build quality assessment",
    "manufacturing": "Inferred manufacturing approach",
    "estimatedCOGS": "Rough cost estimate based on materials/complexity",
    "source": "[VISUAL] or [CONTEXTUAL]"
  },`}
  "customerSentiment": {
    "likelyLikes": ["What customers probably appreciate 1", "Like 2", "Like 3"],
    "likelyDislikes": ["What customers probably dislike 1", "Dislike 2", "Dislike 3"],
    "painPoints": ["Pain point 1", "Pain point 2", "Pain point 3"],
    "adoptionBarriers": ["Barrier 1", "Barrier 2"]
  },
  "defensibility": {
    "patentLandscape": "Assessment of IP protection potential",
    "competitiveAdvantages": ["Advantage 1", "Advantage 2"],
    "vulnerabilities": ["Vulnerability 1", "Vulnerability 2"],
    "source": "[CONTEXTUAL]"
  },
  "marketPosition": {
    "segment": "Target market segment",
    "priceRange": "Estimated price positioning",
    "competitors": ["Likely competitor 1", "Competitor 2", "Competitor 3"],
    "differentiator": "What sets this apart",
    "source": "[VISUAL] or [CONTEXTUAL]"
  },
  "disruptionPotential": {
    "score": 7,
    "summary": "2-3 sentence disruption opportunity assessment",
    "topOpportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
    "risks": ["Risk 1", "Risk 2"]
  }
}`;

    const deepAdditions = isDeep ? `
Additionally, provide these deep-dive sections:
- "trendAnalysis": "4-5 sentence trend analysis with specific data points"
- "actionPlan": { "strategy": "...", "phases": [...3 phases with timeline, actions, budget, milestone], "quickWins": ["3 actions this week under $500"] }
- "assumptionsMap": [{"assumption": "...", "challenge": "..."}] (at least 5)
- "competitorAnalysis": { "marketLeader": "...", "gaps": ["..."], "differentiationOpportunity": "..." }
- "pricingIntel": { "estimatedPrice": "$X-$Y", "margins": "X%", "priceDirection": "rising|stable|falling" }
- "flippedIdeas": [{ "name": "...", "description": "...", "scores": {"feasibility": 8, "desirability": 9, "profitability": 7, "novelty": 9} }] (at least 2)
` : "";

    const systemPrompt = OS_PREAMBLE + `
Analyze the provided ${modeLabel} photo(s) and return a comprehensive intelligence report.

You MUST respond with ONLY valid JSON matching this structure:
${quickSchema}
${deepAdditions}

CRITICAL RULES:
- revivalScore 1-10 based on market potential + feasibility + disruption opportunity
- Every insight must include its inference source: [VISUAL], [CONTEXTUAL], or [ASSUMPTION]
- Be BOLD with insights — surface non-obvious opportunities
- Focus on ${modeLabel}-specific analysis
${isService ? "- Focus on customer journey, operational workflow, and service delivery — NOT physical product attributes" : ""}
${isBusiness ? "- Focus on revenue model, value chain, and business model innovation — NOT product specs" : ""}
`;

    // Build image content parts for the vision model
    const imageParts = imageUrls.map((url: string) => ({
      type: "image_url",
      image_url: { url },
    }));

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
          {
            role: "user",
            content: [
              { type: "text", text: `Analyze ${imageUrls.length > 1 ? "these" : "this"} ${modeLabel} image${imageUrls.length > 1 ? "s" : ""} and provide a complete ${isDeep ? "deep-dive" : "quick"} intelligence report.` },
              ...imageParts,
            ],
          },
        ],
        max_tokens: isDeep ? 8000 : 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Analysis credits exhausted. Please upgrade your plan." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    let content = aiResult.choices?.[0]?.message?.content || "";

    // Strip markdown fences if present
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    // Try to parse JSON
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      // Try to salvage partial JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysis = JSON.parse(jsonMatch[0]);
        } catch {
          console.error("Failed to parse AI response:", content.substring(0, 500));
          throw new Error("Failed to parse analysis results");
        }
      } else {
        throw new Error("No valid JSON in AI response");
      }
    }

    return new Response(JSON.stringify({ analysis, depth: depth || "quick" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("photo-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
