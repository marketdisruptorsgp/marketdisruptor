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
      "label": "short signal label",
      "description": "detailed description of this evidence signal",
      "type": "signal|constraint|friction|assumption|leverage|risk",
      "category": "demand_signal|cost_structure|distribution_channel|pricing_model|operational_dependency|regulatory_constraint|technology_dependency|customer_behavior|competitive_pressure",
      "tier": "structural|system|optimization",
      "impact": 1-10,
      "confidence": 0.0-1.0
    }
  ]
}

Generate 25-35 evidence items that cover:
- Structural constraints (capacity limits, asset utilization, labor dependencies)
- Operational friction (bottlenecks, manual processes, scheduling inefficiencies)
- Revenue model characteristics (pricing power, recurring vs transactional, concentration)
- Cost structure details (fixed vs variable, labor %, overhead)
- Distribution and customer acquisition patterns
- Competitive dynamics
- Technology dependencies
- Regulatory environment
- Customer behavior patterns
- Geographic/demographic factors (when location provided): population density, income levels, insurance coverage rates, commute patterns, local competition density

Be specific and quantitative where possible. Use realistic numbers and percentages.
Include evidence that explicitly describes constraints, not just neutral observations.
Each evidence item should be a distinct, specific signal — not a generic category label.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      const locationContext = businessDescription || "";
      const userContent = locationContext
        ? `Analyze: ${businessName}. Geographic/Market Context: ${locationContext}`
        : `Analyze: ${businessName}`;

      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
    
    // Parse the JSON from the response, handling potential markdown fences
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", content.slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: content.slice(0, 1000) }), {
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
