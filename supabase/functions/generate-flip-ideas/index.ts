import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveMode, filterInputData, missingDataWarning } from "../_shared/modeEnforcement.ts";
import { getReasoningFramework } from "../_shared/reasoningFramework.ts";
import { buildLensPrompt } from "../_shared/lensPrompt.ts";
import { enforceVisualContract } from "../_shared/visualFallback.ts";
// Governed schema: constraint-driven flip linkage

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, audience, additionalContext, insightPreferences, steeringText, lens, count } = await req.json();
    const ideaCount = count || 2;
    const mode = resolveMode(undefined, product.category);
    const filterResult = filterInputData(mode, product);
    const filteredProduct = filterResult.filtered as typeof product;
    console.log(`[ModeEnforcement] flip-ideas | ${mode} | ${missingDataWarning(mode)}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.
${getReasoningFramework()}

CORE PRINCIPLES:
- First-principles reasoning over analogy or convention
- Decompose every system into at least 3 layers of depth
- Never present modeled or inferred data as verified fact


OUTPUT RULES:
- Metrics must be ≤12 words
- Include leverage scores (1-10) on key assumptions
- Flag risk levels: [Risk: Low/Medium/High]
- Flag capital requirements: [Capital: Low/Medium/High]
- Use directional indicators: ↑ ↓ → for trends

You are also an expert product innovation strategist and venture market analyst who specializes in taking existing or discontinued products and "flipping" their core assumptions to create breakthrough, commercially viable product ideas.

Your flipped ideas must be BOLD, SPECIFIC, and ACTIONABLE — not vague concepts. Prioritize NOVEL approaches that create new categories or rethink how things work. You are NOT limited to proven models — radical innovation often has no direct precedent, and that's a STRENGTH.

IMPORTANT: Not everything needs to be flipped. If parts of the current product/service already work well (pricing model, core feature, delivery method, audience), CALL THAT OUT and build on it. The best flips preserve what's strong and reinvent what's broken.

THE DIFFERENCE BETWEEN A GOOD IDEA AND A GREAT ONE:
- BAD: "A smart version with an app" (generic, no specifics)
- GOOD: "A $39 modular version sold via social commerce targeting the specific grip frustration that online communities discuss weekly. BOM $4.20 via Shenzhen suppliers, 78% margin, breakeven at 890 units."

When a real analogous success exists, cite it — it strengthens the case. When an idea is genuinely novel with no precedent, that's fine — explain WHY the timing is right and what demand signals support it.

Respond with ONLY a valid JSON array of flipped idea objects (no markdown, no explanation).

Each object must follow this EXACT structure:
{
  "name": "Short catchy product name",
  "description": "2-3 sentence concept pitch with specific details (price point, target user, key differentiator)",
  "visualNotes": "Physical design, materials, color, form factor, packaging notes — be specific",
  "reasoning": "Market + emotional + user psychology reasoning with SPECIFIC data points. Include demand signals where available (community size, search trends, cultural shifts). If a real analogous success exists, cite it. If this is genuinely novel, explain what makes the timing right.",
  "feasibilityNotes": "BOM estimate with MATH ($X per unit breakdown), specific manufacturer category (name the platform/region), tech required, MOQ, retail margin CALCULATION (BOM → retail → margin %)",
  "scores": {"feasibility": 5, "desirability": 6, "profitability": 5, "novelty": 7},
  "feasibilityClass": "Near-term viable | Conditional opportunity | Long-horizon concept",
  "risks": "Specific risks with named mitigation strategies. Include the #1 reason this could fail and what would need to be true for it to succeed.",
  "preservedStrengths": "What elements of the CURRENT product/service this idea intentionally KEEPS and builds on (and why they're worth keeping). If everything is new, explain why a clean break is better.",
  "whyNow": "The specific market shift, tech unlock, or cultural moment that makes this viable RIGHT NOW",
  "analogousSuccess": "A real company/product that proved a similar model works (with data), OR 'Novel approach' with explanation of why no precedent exists and why that's an opportunity",
  "demandSignal": "Evidence of demand: community complaints, cultural shifts, adjacent market growth, behavioral trends, or search/social signals",
  "actionPlan": {
    "phase1": "First 60 days: 3-4 specific actions with platforms/vendors named",
    "phase2": "Month 3-6: scale actions with specific channels and metrics",
    "phase3": "Month 7-18: growth and distribution actions",
    "timeline": "X months to market",
    "estimatedInvestment": "$X–$Y",
    "revenueProjection": "$X ARR at Y units/subscribers in year 1 — SHOW THE MATH",
    "channels": ["Social Commerce", "Amazon FBA", "Shopify DTC", "Kickstarter"]
  },
  "riskLevel": "[Risk: Low/Medium/High]",
  "capitalRequired": "[Capital: Low/Medium/High]",
  "constraint_linkage": {
    "original_assumption": "the assumption being structurally challenged",
    "structural_inversion": "what structural change this creates",
    "causal_mechanism": "how the flip creates value through constraint removal",
    "constraint_relief_path": "which Tier 1 or Tier 2 friction this relaxes",
    "constraint_linkage_id": "ID linking to a specific friction from upstream analysis"
  },
  "visualSpec": {
    "visual_type": "causal_chain | leverage_hierarchy",
    "title": "Short title for the visual",
    "nodes": [
      { "id": "node_id", "label": "Node label", "type": "constraint|effect|leverage|intervention|outcome", "priority": 1 }
    ],
    "edges": [
      { "from": "source_id", "to": "target_id", "relationship": "causes|relaxed_by|implemented_by|produces", "label": "optional edge label" }
    ],
    "layout": "linear | vertical",
    "interpretation": "One sentence explaining the core leverage mechanism"
  }
}

SCORE CALIBRATION RULES:
- 5-6 is the DEFAULT range for most ideas. Most flipped ideas should land here.
- 7-8 = strong but cite specific evidence and constraints.
- ≥8 requires: specific supporting evidence, enabling conditions, and what must be true. If evidence is weak → cap at 7.
- 9-10 = rare, exceptional, defensible. Almost never assigned.
- Long-horizon concepts CANNOT score above 6 on any dimension.
- Every idea MUST include "feasibilityClass": "Near-term viable", "Conditional opportunity", or "Long-horizon concept".
- Before finalizing scores, ask: "What would cause this to fail?" If failure risk is material → reduce score.`;

    const userPrompt = `Generate ${ideaCount} bold, commercially viable "flipped" product ideas for this product.

PRODUCT: ${product.name}
CATEGORY: ${product.category}
DESCRIPTION: ${product.description}
SPECS: ${product.specs}
ERA: ${product.era}
TARGET AUDIENCE: ${audience}
MARKET SIZE: ${product.marketSizeEstimate || "Unknown"}
KEY INSIGHT: ${product.keyInsight || ""}

CURRENT PRICING:
${product.pricingIntel ? `- Market: ${product.pricingIntel.currentMarketPrice}\n- Resale avg: ${product.pricingIntel.resaleAvgSold || product.pricingIntel.ebayAvgSold}\n- Trend: ${product.pricingIntel.priceDirection}` : "See description"}

CURRENT ASSUMPTIONS TO CHALLENGE:
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption} → ${a.challenge}`).join("\n") || "All design, pricing, audience, and usage assumptions"}

KNOWN COMPLAINTS/PAIN POINTS:
${product.reviews?.filter((r: { sentiment: string }) => r.sentiment === "negative").map((r: { text: string }) => `• ${r.text}`).join("\n") || "General usability and cost concerns"}

COMMUNITY IMPROVEMENT REQUESTS:
${(product as { communityInsights?: { improvementRequests?: string[] } }).communityInsights?.improvementRequests?.map((r: string) => `• ${r}`).join("\n") || "Not available"}

COMPETITOR GAPS:
${(product as { competitorAnalysis?: { gaps?: string[] } }).competitorAnalysis?.gaps?.map((g: string) => `• ${g}`).join("\n") || "Not available"}

TREND CONTEXT:
${product.trendAnalysis || "Nostalgia-driven market with modern tech expectations"}

ADDITIONAL CONTEXT: ${additionalContext || "Focus on modern market opportunities and emerging consumer trends."}
${steeringText ? `\nUSER STEERING GUIDANCE: ${steeringText}` : ""}
${insightPreferences ? `\nUSER INSIGHT PREFERENCES (prioritize liked, exclude dismissed):
${Object.entries(insightPreferences as Record<string, string>).filter(([, s]) => s === "liked").map(([id]) => `✓ LIKED: ${id}`).join("\n")}
${Object.entries(insightPreferences as Record<string, string>).filter(([, s]) => s === "dismissed").map(([id]) => `✗ DISMISSED: ${id}`).join("\n")}` : ""}

GROUNDING RULES — make ideas SPECIFIC, not generic:
1. If a real analogous product/company exists that validates this model, cite it — it strengthens the case. But don't force-fit irrelevant comparisons.
2. Show demand signals where possible: community complaints, cultural shifts, adjacent market growth, behavioral trends, search/social data
3. Show REAL unit economics math: BOM cost → retail price → margin % → breakeven units
4. Name the SPECIFIC gap this fills — what frustration or unmet need does this address?
5. Include a "why now" trigger — what makes this viable TODAY?

ANTI-GENERIC RULES:
- Do NOT suggest "add an app" or "make it smart" without specifying EXACTLY what the app/smartness does and why users would pay for it
- Do NOT suggest "subscription model" without specifying what recurring value justifies ongoing payment
- Do NOT use vague phrases like "leveraging nostalgia" — name the specific emotional trigger and who feels it
- Each idea must be DIFFERENT in structural approach (e.g. one could be a material flip, one a business model flip, one an audience flip)
- NOVEL ideas without precedent are WELCOME — explain why the timing is right and what signals support them

Return ONLY a JSON array with exactly ${ideaCount} flipped idea objects.${buildLensPrompt(lens)}`;

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
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    // Extract JSON array — find first [ and last ]
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.slice(firstBracket, lastBracket + 1);
    }

    let ideas;
    try {
      ideas = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed:", cleaned.slice(0, 300));
      // Attempt to salvage complete objects from truncated JSON
      const salvaged: unknown[] = [];
      let depth = 0, start = -1;
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === "{") { if (depth === 0) start = i; depth++; }
        else if (cleaned[i] === "}") {
          depth--;
          if (depth === 0 && start !== -1) {
            try { salvaged.push(JSON.parse(cleaned.slice(start, i + 1))); } catch { /* skip */ }
            start = -1;
          }
        }
      }
      if (salvaged.length > 0) {
        console.log(`Salvaged ${salvaged.length} idea(s) from truncated JSON`);
        ideas = salvaged;
      } else {
        throw new Error("AI returned invalid JSON. Please retry.");
      }
    }

    if (!Array.isArray(ideas)) ideas = [ideas];

    // Enforce visual contract on each idea that has a visualSpec
    for (const idea of ideas) {
      if (idea && typeof idea === "object") {
        // Per-idea visual spec is optional but enforce if schema expects it
        const ideaObj = idea as Record<string, unknown>;
        if (!ideaObj.visualSpec || !(ideaObj.visualSpec as Record<string, unknown>)?.nodes?.length) {
          // Generate a minimal per-idea visual from available data
          const name = String(ideaObj.name || "Idea");
          ideaObj.visualSpec = {
            visual_type: "causal_chain",
            title: `${name} — Mechanism`,
            nodes: [
              { id: "constraint", label: String(ideaObj.demandSignal || "Market gap").slice(0, 50), type: "constraint", priority: 1 },
              { id: "intervention", label: name.slice(0, 50), type: "intervention", priority: 2 },
              { id: "outcome", label: String(ideaObj.whyNow || "New value created").slice(0, 50), type: "outcome", priority: 3 },
            ],
            edges: [
              { from: "constraint", to: "intervention", relationship: "relaxed_by" },
              { from: "intervention", to: "outcome", relationship: "produces" },
            ],
            layout: "linear",
            interpretation: `${name} addresses the identified gap to produce the target outcome.`,
          };
        }
      }
    }

    return new Response(JSON.stringify({ success: true, ideas }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-flip-ideas error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
