import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, disruptData, stressTestData, userScores, redesignData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.

CORE PRINCIPLES:
- First-principles reasoning over analogy or convention
- Decompose every system into at least 3 layers of depth
- Never present modeled or inferred data as verified fact

DATA VALIDATION — Tag all claims:
- [VERIFIED] — From cited public source or user-provided data
- [MODELED] — Derived logically from verified inputs
- [ASSUMPTION] — Logical assumption where no verified data exists
- [DATA GAP] — No reliable source available

OUTPUT RULES:
- Metrics must be ≤12 words
- Include leverage scores (1-10) on key assumptions
- Flag risk levels: [Risk: Low/Medium/High]
- Flag capital requirements: [Capital: Low/Medium/High]
- Use directional indicators: ↑ ↓ → for trends

You are a world-class venture analyst and pitch deck strategist. You produce investor-grade business intelligence.

CRITICAL: Use REALISTIC risk framing. Avoid optimistic bias. Base all projections on structural feasibility and competitive density.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation, just raw JSON).

Return this EXACT structure with sections in this ORDER:
{
  "problemStatement": "Concrete problem description with market evidence. Be specific about who suffers and why.",
  "solutionStatement": "How this product/opportunity solves the problem in a differentiated way",
  "whyNow": "Why this is the exact right moment — market timing, trends, regulatory shifts, tech enablers",
  "marketOpportunity": {
    "tam": "Total addressable market with source ($XB by YYYY)",
    "sam": "Serviceable addressable market",
    "som": "Serviceable obtainable market (realistic 3-year capture)",
    "growthRate": "CAGR with source and time period",
    "keyDrivers": ["Driver 1 with data", "Driver 2", "Driver 3", "Driver 4", "Driver 5"]
  },
  "productInnovation": "What makes the product/service genuinely different — technical moat, design advantage, or structural innovation. Be specific.",
  "businessModel": {
    "revenueStreams": ["Primary revenue stream", "Secondary stream", "Tertiary stream"],
    "pricingModel": "How you charge — subscription, one-time, freemium, marketplace take rate, etc.",
    "unitEconomics": {
      "cogs": "Cost per unit",
      "retailPrice": "Price per unit",
      "grossMargin": "Gross margin %",
      "contributionMargin": "After variable costs",
      "ltv": "Estimated customer lifetime value",
      "cac": "Estimated customer acquisition cost",
      "paybackPeriod": "Months to recover CAC"
    }
  },
  "tractionSignals": ["Signal 1 — specific evidence of demand or traction", "Signal 2", "Signal 3"],
  "risks": [
    {"risk": "Specific risk with context", "mitigation": "Specific mitigation strategy", "severity": "high"},
    {"risk": "Risk 2", "mitigation": "Mitigation 2", "severity": "medium"},
    {"risk": "Risk 3", "mitigation": "Mitigation 3", "severity": "low"}
  ],
  "keyMetrics": [
    {"metric": "Metric name", "target": "Target value", "why": "Why this matters"},
    {"metric": "Metric 2", "target": "Target 2", "why": "Rationale"}
  ],
  "gtmStrategy": {
    "phase1": "Month 1-3: Specific launch actions",
    "phase2": "Month 4-9: Scale actions with KPIs",
    "phase3": "Month 10-18: Growth and expansion",
    "keyChannels": ["Channel 1", "Channel 2", "Channel 3", "Channel 4"],
    "launchBudget": "$X–$Y"
  },
  "competitiveLandscape": {
    "directCompetitors": [{"name": "Competitor", "strength": "What they do well", "weakness": "Where they fall short"}],
    "indirectCompetitors": ["Category 1", "Category 2"],
    "moat": "What creates a defensible advantage over time"
  },
  "investmentAsk": {
    "amount": "$X–$Y seed/Series A",
    "useOfFunds": ["X% Product development - $Y", "X% Marketing - $Y", "X% Operations - $Y"],
    "scenarios": {
      "conservative": {"revenue": "Year 1 revenue", "units": "Units", "assumptions": "Key assumptions"},
      "base": {"revenue": "Revenue", "units": "Units", "assumptions": "Assumptions"},
      "optimistic": {"revenue": "Revenue", "units": "Units", "assumptions": "Assumptions"}
    },
    "exitStrategy": "M&A targets, IPO path, or strategic buyers"
  },
  "elevatorPitch": "2-3 sentence pitch a VC would hear in an elevator. Bold, specific, memorable.",
  "competitiveAdvantages": ["Advantage 1", "Advantage 2", "Advantage 3"],
  "customerPersona": {
    "name": "Customer archetype name",
    "age": "Age range",
    "painPoints": ["Pain 1", "Pain 2", "Pain 3"],
    "buyingBehavior": "Where and how they buy",
    "willingness": "Price they'll pay and why"
  },
  "supplierContacts": [
    {"name": "Real company name", "role": "OEM/Supplier", "region": "Region", "url": "https://...", "email": "contact@...", "phone": "+1...", "moq": "MOQ", "leadTime": "Lead time", "certifications": ["ISO 9001"], "notes": "Context"}
  ],
  "distributorContacts": [
    {"name": "Real distributor", "role": "Distributor/3PL", "region": "Region", "url": "https://...", "moq": "Min shipment", "leadTime": "Onboarding", "notes": "Context"}
  ],
  "investorHighlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4", "Highlight 5"],
  "completionMessage": "A bold, memorable closing statement that frames the core opportunity — not generic congratulations but a strategic insight about what makes this worth pursuing"
}

CRITICAL RULES:
- Structure follows the 12-section investor deck order: Problem → Solution → Why Now → Market → Product → Business Model → Traction → Risks → Metrics → GTM → Competitive → Investment Ask
- supplierContacts must include REAL company names
- All financial figures must be specific (not "varies" or "TBD")
- Risks must have 3-6 items with mix of high/medium/low severity
- keyMetrics must have 4-6 specific, measurable metrics
- Be BOLD, SPECIFIC, and COMMERCIAL
- AVOID optimistic bias — use realistic, defensible projections
- completionMessage should be a unique strategic insight, not a generic statement`;

    const userPrompt = `Generate a full investor pitch deck for this product:

Product: ${product.name}
Category: ${product.category}
Era: ${product.era}
Description: ${product.description}
Specs: ${product.specs}
Revival Score: ${product.revivalScore}/10
Key Insight: ${product.keyInsight || "Not available"}
Market Size Estimate: ${product.marketSizeEstimate || "Not available"}
Trend Analysis: ${product.trendAnalysis || "Not available"}

EXISTING SUPPLY CHAIN DATA:
${JSON.stringify(product.supplyChain || {}, null, 2)}

EXISTING PRICING INTEL:
${JSON.stringify(product.pricingIntel || {}, null, 2)}

EXISTING ACTION PLAN:
${JSON.stringify(product.actionPlan || {}, null, 2)}

COMMUNITY INSIGHTS:
${JSON.stringify((product as Record<string, unknown>).communityInsights || {}, null, 2)}

${disruptData ? `DISRUPT ANALYSIS (upstream):
- Redesigned Concept: ${JSON.stringify((disruptData as Record<string, unknown>).redesignedConcept || {}, null, 2)}
- Hidden Assumptions: ${JSON.stringify((disruptData as Record<string, unknown>).hiddenAssumptions || [], null, 2)}
- Flipped Logic: ${JSON.stringify((disruptData as Record<string, unknown>).flippedLogic || [], null, 2)}
` : ""}
${redesignData ? `REDESIGN OUTPUT (latest concept):
${JSON.stringify(redesignData, null, 2)}
` : ""}
${stressTestData ? `STRESS TEST RESULTS (upstream):
${JSON.stringify(stressTestData, null, 2)}
` : ""}
${userScores ? `USER-ADJUSTED SCORES (override AI defaults with these):
${JSON.stringify(userScores, null, 2)}
` : ""}
Build the most compelling, investor-ready pitch deck possible. Use all upstream data.
Base scores on realistic market signals, competitive density, and structural feasibility — avoid optimistic defaults.
The completionMessage should be a sharp strategic insight about WHY this opportunity is worth pursuing.

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
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits exhausted. Add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    let deck;
    try {
      deck = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed:", cleaned.slice(0, 500));
      throw new Error("AI returned invalid JSON. Please retry.");
    }

    // Ensure backward compatibility for fields the frontend expects
    if (!deck.financialModel && deck.businessModel?.unitEconomics) {
      deck.financialModel = {
        unitEconomics: deck.businessModel.unitEconomics,
        scenarios: deck.investmentAsk?.scenarios || {},
        pricingStrategy: deck.businessModel.pricingModel || "",
        breakEvenAnalysis: deck.businessModel.unitEconomics?.paybackPeriod || "",
        fundingAsk: deck.investmentAsk?.amount || "",
        useOfFunds: deck.investmentAsk?.useOfFunds || [],
        exitStrategy: deck.investmentAsk?.exitStrategy || "",
      };
    }

    return new Response(JSON.stringify({ success: true, deck }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-pitch-deck error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
