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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const systemPrompt = `You are a world-class venture analyst and pitch deck strategist. You produce investor-grade business intelligence for products.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation, just raw JSON).

Return this EXACT structure:
{
  "elevatorPitch": "2-3 sentence pitch a VC would hear in an elevator. Bold, specific, memorable.",
  "problemStatement": "Concrete problem description with market evidence",
  "solutionStatement": "How this product/opportunity solves the problem",
  "whyNow": "Why this is the exact right moment in time to pursue this — market timing, trends, regulatory, tech",
  "marketOpportunity": {
    "tam": "Total addressable market with source ($XB by YYYY)",
    "sam": "Serviceable addressable market",
    "som": "Serviceable obtainable market (realistic 3-year capture)",
    "growthRate": "CAGR with source and time period",
    "keyDrivers": ["Driver 1 with data", "Driver 2", "Driver 3", "Driver 4", "Driver 5"]
  },
  "competitiveAdvantages": ["Advantage 1 (specific)", "Advantage 2", "Advantage 3", "Advantage 4"],
  "customerPersona": {
    "name": "Customer archetype name (e.g. 'The Nostalgic Millennial Parent')",
    "age": "Age range and segment description",
    "painPoints": ["Pain 1", "Pain 2", "Pain 3"],
    "buyingBehavior": "Where and how they buy",
    "willingness": "Price they'll pay and why"
  },
  "financialModel": {
    "unitEconomics": {
      "cogs": "Cost of goods sold per unit",
      "retailPrice": "Recommended retail price",
      "grossMargin": "Gross margin percentage",
      "contributionMargin": "Contribution margin after variable costs",
      "paybackPeriod": "Customer acquisition payback period"
    },
    "scenarios": {
      "conservative": {
        "units": "Units sold Year 1",
        "revenue": "Revenue",
        "profit": "Net profit/loss",
        "assumptions": "Key assumptions for this scenario"
      },
      "base": {
        "units": "Units sold Year 1",
        "revenue": "Revenue",
        "profit": "Net profit/loss",
        "assumptions": "Key assumptions for this scenario"
      },
      "optimistic": {
        "units": "Units sold Year 1",
        "revenue": "Revenue",
        "profit": "Net profit/loss",
        "assumptions": "Key assumptions for this scenario"
      }
    },
    "pricingStrategy": "Pricing model, rationale, and competitive positioning",
    "breakEvenAnalysis": "Break-even point with units and timeline",
    "fundingAsk": "$X–$Y seed/Series A ask",
    "useOfFunds": ["X% Product development - $Y", "X% Marketing & GTM - $Y", "X% Operations - $Y", "X% Working capital - $Y"],
    "exitStrategy": "M&A targets, IPO path, or strategic buyer options with rationale"
  },
  "supplierContacts": [
    {
      "name": "Real company name",
      "role": "OEM Manufacturer / Component Supplier / IP Licensor",
      "region": "Country/Region",
      "url": "https://real-url.com",
      "email": "contact@example.com or inquiry@domain.com if real",
      "phone": "+1-xxx-xxx-xxxx if known",
      "moq": "Minimum order quantity",
      "leadTime": "Production lead time",
      "certifications": ["ISO 9001", "CE", "RoHS"],
      "notes": "Specific context about why to approach them, specialization, pricing tier, negotiation tips"
    }
  ],
  "distributorContacts": [
    {
      "name": "Real distributor name",
      "role": "National Distributor / 3PL / Retail Partner",
      "region": "Region they cover",
      "url": "https://real-url.com",
      "email": "contact if known",
      "moq": "Minimum shipment",
      "leadTime": "Onboarding timeline",
      "notes": "Why this distributor, their specialty, margin expectations, how to approach"
    }
  ],
  "gtmStrategy": {
    "phase1": "Month 1-3: Specific launch actions with platform names, budget, channels",
    "phase2": "Month 4-9: Scale actions with specific targets and KPIs",
    "phase3": "Month 10-18: Growth and expansion with specific milestones",
    "keyChannels": ["Channel 1", "Channel 2", "Channel 3", "Channel 4"],
    "launchBudget": "$X–$Y"
  },
  "risks": [
    {
      "risk": "Specific risk with context",
      "mitigation": "Specific mitigation strategy",
      "severity": "high"
    },
    {
      "risk": "Risk 2",
      "mitigation": "Mitigation 2",
      "severity": "medium"
    },
    {
      "risk": "Risk 3",
      "mitigation": "Mitigation 3",
      "severity": "low"
    }
  ],
  "keyMetrics": [
    {"metric": "Metric name", "target": "Target value", "why": "Why this metric matters"},
    {"metric": "Metric 2", "target": "Target 2", "why": "Rationale"}
  ],
  "investorHighlights": [
    "Specific, bold highlight 1 (ideally with a data point)",
    "Highlight 2",
    "Highlight 3",
    "Highlight 4",
    "Highlight 5"
  ]
}

CRITICAL RULES:
- supplierContacts must include REAL company names — Alibaba suppliers, OEM factories, component suppliers
- distributorContacts must include REAL companies — UNFI, KeHE, Ingram, Entertainment Earth, etc.
- All financial figures must be specific (not "varies" or "TBD")
- Risks must have 3-6 items with mix of high/medium/low severity
- keyMetrics must have 4-6 specific, measurable metrics
- investorHighlights must be compelling and specific — a VC should want to read on
- Be BOLD, SPECIFIC, and COMMERCIAL in all analysis`;

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

Build the most compelling, investor-ready pitch deck possible. Use all existing data as a foundation and expand significantly with deeper financial modeling, real supplier contacts (with emails/phones where available), and specific go-to-market tactics.

Return ONLY the JSON object.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 8000,
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

    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let deck;
    try {
      deck = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed:", cleaned.slice(0, 500));
      throw new Error("AI returned invalid JSON. Please retry.");
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
