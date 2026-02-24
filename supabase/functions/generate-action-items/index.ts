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

    // Pick the 1-2 most promising projects to focus on
    const sorted = [...projectSummaries].sort((a, b) => (b.score || 0) - (a.score || 0));
    const focusProjects = sorted.slice(0, 2);
    const otherProjects = sorted.slice(2);

    const systemPrompt = `You are a sharp strategic advisor on Market Disruptor OS. The user has ${projectSummaries.length} projects. Your job: identify the 1-2 projects with the MOST untapped potential and go DEEP on those. Do NOT spread thin across many projects.

SELECTION LOGIC — pick the focus project(s) by:
- Highest revival score WITH unaddressed gaps (missing pitch, no stress test, unvalidated pricing)
- Strongest demand signals paired with unfixed community complaints
- Largest market size estimate with fewest competitors

THEN generate 3-5 action items — ALL focused on those 1-2 projects. Each item must be:
1. A concrete next step someone could do THIS WEEK (not "think about" or "consider")
2. Backed by a specific number, quote, or data point from the analysis ("your revival score of 8.2 with 0 competitors means…")
3. Tied to a clear business outcome: revenue, de-risking, or competitive advantage
4. Written as if you're advising a founder who's paying you $500/hour — no filler, no fluff

GOOD: "Cold-email 5 DTC brands selling [category] — your supply chain data shows [supplier] has 40% margin room that competitors aren't exploiting"
BAD: "Research potential partnerships in the supply chain space"

GOOD: "The top community complaint '[specific complaint]' has no competing solution — draft a landing page testing this exact pain point and run $50 in ads to validate demand"  
BAD: "Consider addressing community complaints"

If you reference other projects, ONLY do so to contrast ("Project B scored 4.1 — park it. Project A at 8.7 is your highest-leverage bet right now because…").

Start your reasoning by explaining WHY you chose this project to focus on. What makes it the best use of the user's time right now?

NEVER suggest platform actions like "generate pitch deck" or "run stress test."`;

    const contextBlock = `FOCUS PROJECTS (highest potential):\n${JSON.stringify(focusProjects, null, 2)}\n\n${otherProjects.length > 0 ? `OTHER PROJECTS (for context only):\n${JSON.stringify(otherProjects.map(p => ({ title: p.title, id: p.id, score: p.score })), null, 2)}` : ""}`;

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
          { role: "user", content: `${contextBlock}\n\nGenerate focused, data-backed action items. Explain why you chose this project to prioritize.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_action_items",
              description: "Return a focus rationale and 3-5 deep, data-backed action items for 1-2 projects.",
              parameters: {
                type: "object",
                properties: {
                  focusSummary: { type: "string", description: "1-2 sentences explaining why you chose this project(s) to focus on. Reference scores, gaps, or signals." },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "The action item — specific, concrete, doable this week (max 20 words)" },
                        reason: { type: "string", description: "The specific data point that triggered this — cite a number, complaint, or gap (1-2 sentences)" },
                        urgency: { type: "string", description: "Why now — cost of waiting or window closing (1 sentence)" },
                        outcome: { type: "string", description: "What this unlocks if done well (1 sentence, be specific)" },
                        projectTitle: { type: "string", description: "The project title" },
                        projectId: { type: "string", description: "The project ID" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        lever: { type: "string", enum: ["revenue", "risk", "validation", "growth", "differentiation"] },
                      },
                      required: ["text", "reason", "urgency", "outcome", "projectTitle", "projectId", "priority", "lever"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["focusSummary", "items"],
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
    return new Response(JSON.stringify({ success: true, focusSummary: parsed.focusSummary || "", items: parsed.items || [] }), {
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
