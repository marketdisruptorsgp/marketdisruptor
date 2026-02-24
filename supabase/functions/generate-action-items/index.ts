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
        hasBusinessModel: !!ad.businessModel,
        hasFirstPrinciples: !!ad.firstPrinciples,
        keyInsight: firstProduct?.keyInsight || null,
        marketSize: firstProduct?.marketSizeEstimate || null,
        topComplaint: firstProduct?.communityInsights?.topComplaints?.[0] || null,
        topChannel: ad.pitchDeck?.gtmStrategy?.keyChannels?.[0] || null,
        topRisk: ad.stressTest?.criticalRisks?.[0]?.name || ad.stressTest?.vulnerabilities?.[0] || null,
        supplyChainGap: firstProduct?.supplyChainInsights?.suppliers?.[0]?.name || null,
        pricingInsight: firstProduct?.pricingInsights?.buyPrice || null,
        revivalScore: firstProduct?.revivalScore || a.avg_revival_score || 0,
        competitorCount: firstProduct?.competitorAnalysis?.competitors?.length || 0,
        demandSignal: firstProduct?.communityInsights?.demandSignal || null,
      };
    });

    const systemPrompt = `You are a strategic business advisor analyzing a user's portfolio of product/service analyses on Market Disruptor OS. You must generate 3-5 high-value, reason-backed strategic action items.

CRITICAL RULES:
1. Every action item MUST cite a specific data point from the project data that justifies it (a score, a complaint, a market size, a risk, a gap).
2. Every action item MUST explain WHY NOW — what's the urgency or opportunity cost of waiting?
3. Action items should span different projects when possible, but ONLY if there's a real reason. Don't force cross-project items.
4. Focus on the highest-leverage moves: things that unlock the most value with the least effort.
5. Be brutally specific. Not "research competitors" but "investigate why [specific complaint] hasn't been addressed by the 3 existing competitors in [market]."
6. If a project has a high revival score (7+), suggest offensive moves (launch, pitch, partner). If low (below 5), suggest diagnostic moves (validate demand, talk to customers, pivot angle).

NEVER suggest generic items like "generate pitch deck" or "run stress test" — those are platform features, not strategy.`;

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
          { role: "user", content: `Here are my portfolio projects:\n\n${JSON.stringify(projectSummaries, null, 2)}\n\nGenerate strategic action items. For each, explain the specific data point that triggered this recommendation and why it matters now.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_action_items",
              description: "Return 3-5 high-value, reason-backed strategic action items.",
              parameters: {
                type: "object",
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "The action item — specific, concrete, actionable (max 20 words)" },
                        reason: { type: "string", description: "Why this matters — cite the specific data point or pattern that triggered this (1-2 sentences)" },
                        urgency: { type: "string", description: "Why now — what's the cost of waiting or the window of opportunity (1 sentence)" },
                        projectTitle: { type: "string", description: "The project title this relates to" },
                        projectId: { type: "string", description: "The project ID this relates to" },
                        priority: { type: "string", enum: ["high", "medium", "low"], description: "Priority: high = do this week, medium = do this month, low = backlog" },
                        lever: { type: "string", enum: ["revenue", "risk", "validation", "growth", "differentiation"], description: "What strategic lever this pulls" },
                      },
                      required: ["text", "reason", "urgency", "projectTitle", "projectId", "priority", "lever"],
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
