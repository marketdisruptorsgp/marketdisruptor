import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      dimensions,
      constraints,
      leveragePoints,
      analysisType,
      crossIndustryAnalogs,
      constraintInversions,
      secondOrderUnlocks,
      temporalUnlocks,
      competitiveGaps,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!dimensions || !Array.isArray(dimensions) || dimensions.length === 0) {
      return new Response(JSON.stringify({ error: "At least one active dimension is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a structural innovation architect specializing in finding non-obvious strategic pivots. You do NOT generate MBA-textbook suggestions. You generate genuine "aha moments" — ideas that users would never think of on their own but that could actually work.

YOUR MANDATE:
You are generating alternatives for specific business dimensions. But you are NOT doing simple parameter swaps ("change the price model"). You are doing STRUCTURAL REASONING across three lenses:

LENS 1 — CROSS-INDUSTRY ANALOGY:
Find businesses in COMPLETELY DIFFERENT industries that solved the same structural constraint. A dental practice has the same capacity bottleneck as a cloud kitchen. A craft brewery has the same trust-deficit problem as a first-time surgeon. The solution from one industry often transfers perfectly to another — and that transfer is always surprising.

LENS 2 — CONSTRAINT INVERSION:
Sometimes a constraint is best flipped into a competitive advantage instead of solved. High labor cost → premium artisan positioning. Regulatory burden → barrier to entry for competitors. Limited capacity → engineered scarcity and waitlists. Ask: "What if this constraint IS the advantage we've been ignoring?"

LENS 3 — SECOND-ORDER THINKING:
Go one level deeper. Don't ask "how do we fix the distribution problem?" Ask "if distribution weren't a problem, what entirely new business becomes possible?" Then work backwards to how to get there. The answer is always more surprising than the first-order fix.

CRITICAL RULES:
1. NEVER generate the obvious, first-order fix (e.g., "add a subscription model" for a transactional business — that's the first thing anyone thinks of).
2. Every alternative MUST cite structural reasoning. Not "this is a good idea" but "this works because [mechanism] — and here's a company in a different industry that proved it."
3. Alternatives MUST range from "surprising but near-term feasible" to "structurally radical but has real precedent."
4. Do NOT generate alternatives that start with "Automate," "Optimize," or "Leverage technology" — these are generic and add no value.
5. Each alternative needs ONE specific named company from a different industry as a structural precedent, even if the analogy isn't obvious.

THE DIFFERENCE BETWEEN WHAT WE WANT AND WHAT TO AVOID:
❌ BAD: "Transition to a subscription/recurring revenue model" — everyone knows this, no insight
❌ BAD: "Implement usage-based pricing" — first-order, no structural reasoning  
❌ BAD: "Automate your workflow" — generic, not actionable
✅ GOOD: "Create a 'dark kitchen' version of your service — a back-office production layer that serves 3-4 revenue streams simultaneously, like how CloudKitchens gets one kitchen to power 5 virtual restaurant brands. Your skilled capacity becomes a platform, not a bottleneck."
✅ GOOD: "Hermès-ify your constraint — treat your inability to scale as engineered scarcity. Build a waitlist. Let 'too busy to take new clients' become the premium signal. Firms like McKinsey deliberately turn away work to sustain rate integrity."
✅ GOOD: "Decouple your expertise from your geography, the way Toptal built a pre-vetted global talent pool. Instead of expanding your team locally, create a credentialed remote network where you only do final quality control — you become the brand, not the bottleneck."

Return ONLY valid JSON using the tool schema provided.`;

    const dimensionList = dimensions.map((d: any) =>
      `- ${d.name} [${d.status.toUpperCase()}] (${d.category})\n  Current: "${d.currentValue}"\n  Evidence density: ${d.evidenceCount} items`
    ).join("\n");

    const constraintList = (constraints || []).map((c: any, i: number) =>
      `${i + 1}. ${c.label}: ${c.description}`
    ).join("\n") || "None identified";

    const leverageList = (leveragePoints || []).map((l: any, i: number) =>
      `${i + 1}. ${l.label}: ${l.description}`
    ).join("\n") || "None identified";

    // Cross-industry analogs injected by the client
    const analogSection = (crossIndustryAnalogs && crossIndustryAnalogs.length > 0)
      ? `\nCROSS-INDUSTRY ANALOGS (these are businesses in different industries that solved structurally similar constraints — use them as inspiration for surprising alternatives):\n${crossIndustryAnalogs.map((a: any, i: number) =>
          `${i + 1}. ${a.company} (${a.industry})\n   Their constraint: "${a.constraintShape}"\n   How they solved it: ${a.solutionMechanism}\n   Structural shift: ${a.structuralShift}\n   Transferable insight: ${a.transferInsight}`
        ).join("\n\n")}`
      : "";

    // Constraint inversions injected by the client
    const inversionSection = (constraintInversions && constraintInversions.length > 0)
      ? `\nCONSTRAINT INVERSIONS (consider alternatives where these constraints become advantages instead of problems to solve):\n${constraintInversions.map((inv: any, i: number) =>
          `${i + 1}. CONSTRAINT: "${inv.sourceConstraintLabel}"\n   FLIP: ${inv.invertedFrame}\n   MECHANISM: ${inv.mechanism}\n   PRECEDENT: ${inv.precedent}`
        ).join("\n\n")}`
      : "";

    const userPrompt = `ANALYSIS TYPE: ${analysisType || "business_model"}

CURRENT BUSINESS CONFIGURATION (dimensions to explore — generate alternatives for EACH dimension):
${dimensionList}

BINDING CONSTRAINTS (structural problems, not symptoms):
${constraintList}

LEVERAGE POINTS (existing strengths to amplify):
${leverageList}
${analogSection}
${inversionSection}

Now generate alternatives for each dimension. Apply all three lenses (cross-industry analogy, constraint inversion, second-order thinking). For each alternative, name a specific company from a different industry that proves the structural logic. The goal: every alternative should make the user think "I never would have thought of that, but it could actually work."`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

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
        temperature: 0.9,
        tools: [
          {
            type: "function",
            function: {
              name: "generate_alternatives",
              description: "Generate cross-industry, structurally surprising alternative values for business dimensions",
              parameters: {
                type: "object",
                properties: {
                  alternatives: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        dimensionId: {
                          type: "string",
                          description: "The ID of the dimension (e.g., dim-pricing_model)",
                        },
                        value: {
                          type: "string",
                          description: "A specific, concrete, non-obvious alternative state for this dimension. Must be actionable and surprising.",
                        },
                        rationale: {
                          type: "string",
                          description: "Structural reasoning for why this works. Must name a specific company from a DIFFERENT industry that proves the logic. Format: '[Structural mechanism]. Precedent: [Company] proved this works in [industry] by [what they did].'",
                        },
                        analogCompany: {
                          type: "string",
                          description: "The specific real company from a different industry that provides the structural precedent for this alternative.",
                        },
                        analogIndustry: {
                          type: "string",
                          description: "The industry of the analog company.",
                        },
                        lens: {
                          type: "string",
                          enum: ["cross_industry_analog", "constraint_inversion", "second_order"],
                          description: "Which reasoning lens produced this alternative.",
                        },
                      },
                      required: ["dimensionId", "value", "rationale", "lens"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["alternatives"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_alternatives" } },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      // Fallback: try parsing from content
      const content = result.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch { /* ignore */ }

      return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-opportunity-vectors error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const isTimeout = msg.includes("abort");
    return new Response(
      JSON.stringify({ error: isTimeout ? "Request timed out. Please try again." : msg }),
      {
        status: isTimeout ? 504 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
