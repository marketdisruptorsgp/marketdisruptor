import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { analyses } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!analyses || !Array.isArray(analyses) || analyses.length === 0) {
      return new Response(JSON.stringify({ error: "No analyses provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build a compact summary of each project for the AI
    const projectSummaries = analyses.slice(0, 10).map((a: any) => {
      const ad = a.analysis_data || {};
      const products = (a.products || []).slice(0, 2);
      const firstProduct = products[0];
      return {
        title: a.title,
        id: a.id,
        score: a.avg_revival_score || 0,
        type: a.analysis_type || "product",
        hasPitch: !!ad.pitchDeck,
        hasStressTest: !!ad.stressTest,
        hasDisrupt: !!ad.disrupt,
        keyInsight: firstProduct?.keyInsight || null,
        marketSize: firstProduct?.marketSizeEstimate || null,
        topComplaint: firstProduct?.communityInsights?.topComplaints?.[0] || null,
        topChannel: ad.pitchDeck?.gtmStrategy?.keyChannels?.[0] || null,
        topRisk: ad.stressTest?.criticalRisks?.[0]?.name || ad.stressTest?.vulnerabilities?.[0] || null,
        supplyChainGap: firstProduct?.supplyChainInsights?.suppliers?.[0]?.name || null,
        pricingInsight: firstProduct?.pricingInsights?.buyPrice || null,
      };
    });

    const systemPrompt = `You are a strategic business advisor analyzing a user's portfolio of product/service analyses. Based on the project data, generate 4-6 specific, actionable action items the user should focus on next.

Each action item should be:
- Specific to a project (reference by title)
- Actionable and concrete (not vague)
- Strategic (not just "complete step X")
- Based on actual data patterns you see (pricing gaps, community complaints, market opportunities, risks to address)

Examples of good action items:
- "Validate pricing model for [Project] — current buy price suggests 40% margin opportunity"
- "Research competitor patent filings related to [Project]'s core innovation"
- "Survey 10 target customers about [specific complaint] flagged in [Project]"
- "Develop partnership strategy with [supplier] for [Project]'s supply chain"
- "A/B test messaging around [pain point] for [Project]'s go-to-market"

Do NOT suggest generic items like "generate pitch deck" or "run stress test" — focus on strategic business actions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here are my portfolio projects:\n\n${JSON.stringify(projectSummaries, null, 2)}\n\nGenerate strategic action items based on this data.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_action_items",
              description: "Return 4-6 strategic, data-driven action items for the user's portfolio.",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "The action item text, specific and actionable" },
                        projectTitle: { type: "string", description: "The project title this relates to" },
                        projectId: { type: "string", description: "The project ID this relates to" },
                        priority: { type: "string", enum: ["high", "medium", "low"], description: "Priority level" },
                      },
                      required: ["text", "projectTitle", "projectId", "priority"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["items"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_action_items" } },
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ success: true, items: parsed.items || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-action-items error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
