import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { businessName, businessDescription } = await req.json();
    if (!businessName) {
      return new Response(JSON.stringify({ error: "businessName required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a structural business analyst. Given a business type (and optionally a geographic market), generate a comprehensive structural analysis.

When a geographic location is provided, incorporate real demographic and economic context:
- Use known census data for the metro area (population, median household income, age distribution, population growth trends)
- Factor in local market saturation, cost of living, labor market conditions
- Reference regional industry patterns, regulatory environment, and competitive density
- Ground evidence in realistic local numbers (e.g., "St. Louis MSA population ~2.8M, median household income ~$65K")

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no explanation.

Return a JSON object with these exact keys:

{
  "systemDecomposition": {
    "supplyChain": ["step 1", "step 2", ...],
    "valueCreationSteps": ["step 1", "step 2", ...],
    "revenueArchitecture": "description of how money flows",
    "costStructure": ["major cost 1", "major cost 2", ...],
    "distributionChannels": ["channel 1", "channel 2", ...],
    "customerAcquisition": "how customers are acquired",
    "operationalAssets": ["asset 1", "asset 2", ...],
    "laborDependencies": ["dependency 1", "dependency 2", ...]
  },
  "firstPrinciples": {
    "whatCustomerPaysFor": "the fundamental value exchange",
    "whatCreatesValue": "core value creation mechanism",
    "whatLimitsScale": "primary scaling constraint",
    "whatDrivesMargins": "margin driver",
    "whatResourcesAreScarce": "scarcest resource"
  },
  "competitors": {
    "tier1": [{"name": "competitor", "model": "same model description"}],
    "tier2": [{"name": "competitor", "model": "alternative solution"}],
    "tier3": [{"name": "competitor", "model": "substitute or emerging"}]
  },
  "evidence": [
    {
      "label": "short label (3-6 words)",
      "description": "one sentence, max 20 words",
      "type": "signal|constraint|friction|assumption|leverage|risk",
      "category": "demand_signal|cost_structure|distribution_channel|pricing_model|operational_dependency|regulatory_constraint|technology_dependency|customer_behavior|competitive_pressure",
      "tier": "structural|system|optimization",
      "impact": 1-10,
      "confidence": 0.0-1.0
    }
  ]
}

CRITICAL: Keep ALL string values SHORT. Labels max 6 words. Descriptions max 20 words. Array items max 12 words each.
Keep competitor names to 2-3 per tier. Keep supply chain / cost structure to 4-5 items each.
Generate exactly 25 evidence items covering constraints, friction, revenue, costs, competition, and local market factors.
Be specific and quantitative. Include evidence that explicitly describes constraints.`;

    const locationContext = businessDescription || "";
    const userContent = locationContext
      ? `Analyze: ${businessName}. Geographic/Market Context: ${locationContext}`
      : `Analyze: ${businessName}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 8192,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse the JSON from the response, handling potential markdown fences and truncation
    let parsed;
    try {
      let jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // Attempt to repair truncated JSON by closing open braces/brackets
        let openBraces = 0, openBrackets = 0;
        for (const ch of jsonStr) {
          if (ch === "{") openBraces++;
          else if (ch === "}") openBraces--;
          else if (ch === "[") openBrackets++;
          else if (ch === "]") openBrackets--;
        }
        // Trim trailing incomplete string/value
        jsonStr = jsonStr.replace(/,\s*$/, "").replace(/,\s*"[^"]*$/, "");
        for (let i = 0; i < openBrackets; i++) jsonStr += "]";
        for (let i = 0; i < openBraces; i++) jsonStr += "}";
        parsed = JSON.parse(jsonStr);
        console.log("Recovered truncated JSON response");
      }
    } catch (parseErr) {
      console.error("Failed to parse AI response:", content.slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse AI response — likely truncated. Try again.", raw: content.slice(0, 1000) }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-business-structure error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
