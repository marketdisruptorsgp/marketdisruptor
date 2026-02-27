import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveMode, filterInputData, validateOutput, buildTrace, missingDataWarning, getModeGuardPrompt } from "../_shared/modeEnforcement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, disruptData, stressTestData, userScores, redesignData } = await req.json();
    const mode = resolveMode(product.analysisType, product.category);
    const filterResult = filterInputData(mode, product);
    console.log(`[ModeEnforcement] pitch-deck | ${mode} | ${missingDataWarning(mode)}`);
    const modeGuard = getModeGuardPrompt(mode);

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

CRITICAL CONTENT CURATION RULES:
1. Each slide section must convey ONE clear idea — do not combine multiple themes
2. Select only investor-relevant insights — exclude operational minutiae
3. Bullet points must be ≤15 words each. No paragraphs disguised as bullets.
4. Every section must include at least one quantified metric or specific data point
5. Maintain narrative flow: Problem → Why it matters now → How big → What we do → Why it works → How we grow → What could go wrong → What we need
6. Use REALISTIC risk framing. Avoid optimistic bias. Base all projections on structural feasibility and competitive density.

CRITICAL: NEVER append founding years, dates, or parenthetical years like "(1929)" or "(2015)" to the product/company name. Use the product name EXACTLY as the user provided it.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation, just raw JSON).

Return this EXACT structure:
{
  "problemStatement": "Concrete problem description with market evidence. ≤3 sentences. Be specific about who suffers and why.",
  "solutionStatement": "How this solves the problem in a differentiated way. ≤3 sentences.",
  "whyNow": "Why this is the exact right moment — market timing, trends, regulatory shifts, tech enablers. ≤3 sentences.",
  "marketOpportunity": {
    "tam": "Total addressable market with source ($XB by YYYY)",
    "sam": "Serviceable addressable market",
    "som": "Serviceable obtainable market (realistic 3-year capture)",
    "growthRate": "CAGR with source and time period",
    "keyDrivers": ["Driver 1 with data point", "Driver 2", "Driver 3", "Driver 4", "Driver 5"]
  },
  "productInnovation": "What makes this genuinely different — technical moat, design advantage, or structural innovation. ≤2 sentences.",
  "businessModel": {
    "revenueStreams": ["Primary revenue stream", "Secondary stream", "Tertiary stream"],
    "pricingModel": "Pricing structure in ≤15 words",
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
  "tractionSignals": ["Signal 1 — specific evidence", "Signal 2", "Signal 3"],
  "risks": [
    {"risk": "Specific risk ≤12 words", "mitigation": "Specific mitigation ≤20 words", "severity": "high"},
    {"risk": "Risk 2", "mitigation": "Mitigation 2", "severity": "medium"},
    {"risk": "Risk 3", "mitigation": "Mitigation 3", "severity": "low"}
  ],
  "keyMetrics": [
    {"metric": "Metric name ≤5 words", "target": "Target value", "why": "Why this matters ≤10 words"},
    {"metric": "Metric 2", "target": "Target 2", "why": "Rationale"}
  ],
  "gtmStrategy": {
    "phase1": "Month 1-3: Specific launch actions. ≤2 sentences.",
    "phase2": "Month 4-9: Scale actions. ≤2 sentences.",
    "phase3": "Month 10-18: Growth and expansion. ≤2 sentences.",
    "keyChannels": ["Channel 1", "Channel 2", "Channel 3", "Channel 4"],
    "launchBudget": "$X–$Y"
  },
  "competitiveLandscape": {
    "directCompetitors": [{"name": "Competitor", "strength": "≤10 words", "weakness": "≤10 words"}],
    "indirectCompetitors": ["Category 1", "Category 2"],
    "moat": "Defensible advantage ≤2 sentences"
  },
  "investmentAsk": {
    "amount": "$X–$Y seed/Series A",
    "useOfFunds": ["X% Product - $Y", "X% Marketing - $Y", "X% Ops - $Y"],
    "scenarios": {
      "conservative": {"revenue": "Year 1 revenue", "units": "Units", "assumptions": "Key assumption"},
      "base": {"revenue": "Revenue", "units": "Units", "assumptions": "Assumption"},
      "optimistic": {"revenue": "Revenue", "units": "Units", "assumptions": "Assumption"}
    },
    "exitStrategy": "M&A targets, IPO path, or strategic buyers. ≤1 sentence."
  },
  "tagline": "≤10-word investor headline — bold, memorable",
  "elevatorPitch": "2-3 sentence pitch. Bold, specific, memorable.",
  "competitiveAdvantages": ["Advantage 1 ≤12 words", "Advantage 2", "Advantage 3"],
  "customerPersona": {
    "name": "Archetype name",
    "age": "Age range",
    "painPoints": ["Pain 1 ≤12 words", "Pain 2", "Pain 3"],
    "buyingBehavior": "Where and how they buy ≤15 words",
    "willingness": "Price willingness ≤15 words"
  },
  "supplierContacts": [
    {"name": "Real company name", "role": "OEM/Supplier", "region": "Region", "url": "https://...", "email": "contact@...", "phone": "+1...", "moq": "MOQ", "leadTime": "Lead time", "certifications": ["ISO 9001"], "notes": "Context ≤15 words"}
  ],
  "distributorContacts": [
    {"name": "Real distributor", "role": "Distributor/3PL", "region": "Region", "url": "https://...", "moq": "Min shipment", "leadTime": "Onboarding", "notes": "Context ≤15 words"}
  ],
  "investorHighlights": ["Highlight 1 ≤12 words", "Highlight 2", "Highlight 3", "Highlight 4", "Highlight 5"],
  "completionMessage": "A bold strategic insight about what makes this worth pursuing. ≤2 sentences."
}

CRITICAL RULES:
- Structure follows the 12-section investor deck order
- supplierContacts must include REAL company names
- All financial figures must be specific (not "varies" or "TBD")
- Risks must have 3-6 items with mix of high/medium/low severity
- keyMetrics must have 4-6 specific, measurable metrics
- EVERY bullet point must be ≤15 words. No exceptions.
- Be BOLD, SPECIFIC, and COMMERCIAL
- completionMessage should be a unique strategic insight`;

    const isService = product.category === "Service";
    const isBusiness = product.analysisType === "business" || product.category === "Business Model" || product.category === "Business";

    let userPrompt: string;

    if (isBusiness) {
      userPrompt = `Generate a full investor pitch deck for this BUSINESS MODEL:

Business: ${product.name}
Category: ${product.category}
Description: ${product.description}
Revival Score: ${product.revivalScore}/10
Key Insight: ${product.keyInsight || "Not available"}
Market Size Estimate: ${product.marketSizeEstimate || "Not available"}
Trend Analysis: ${product.trendAnalysis || "Not available"}

${disruptData ? `DISRUPT ANALYSIS (upstream):
- Redesigned Concept: ${JSON.stringify((disruptData as Record<string, unknown>).redesignedConcept || {}, null, 2)}
- Hidden Assumptions: ${JSON.stringify((disruptData as Record<string, unknown>).hiddenAssumptions || [], null, 2)}
- Flipped Logic: ${JSON.stringify((disruptData as Record<string, unknown>).flippedLogic || [], null, 2)}
` : ""}
${stressTestData ? `STRESS TEST RESULTS (upstream):
${JSON.stringify(stressTestData, null, 2)}
` : ""}
${userScores ? `USER-ADJUSTED SCORES:
${JSON.stringify(userScores, null, 2)}
` : ""}

BUSINESS MODEL SPECIFIC INSTRUCTIONS:
- Focus on BUSINESS MODEL INNOVATION: revenue model, value chain positioning, platform dynamics
- Product/Innovation slide should describe the structural model innovation, not a physical product
- Supply chain contacts should focus on technology partners, platform integrators, and service providers
- Emphasize unit economics, network effects, and scalability of the business model
- GTM should focus on market entry through partnerships, pilot programs, or platform onboarding
- Do NOT reference physical manufacturing or product specs
- Base all projections on realistic competitive density and structural feasibility

Return ONLY the JSON object.`;
    } else if (isService) {
      userPrompt = `Generate a full investor pitch deck for this SERVICE:

Service: ${product.name}
Category: ${product.category}
Description: ${product.description}
Revival Score: ${product.revivalScore}/10
Key Insight: ${product.keyInsight || "Not available"}
Market Size Estimate: ${product.marketSizeEstimate || "Not available"}
Trend Analysis: ${product.trendAnalysis || "Not available"}

EXISTING PRICING INTEL:
${JSON.stringify(product.pricingIntel || {}, null, 2)}

OPERATIONAL INTEL:
${JSON.stringify((product as Record<string, unknown>).operationalIntel || {}, null, 2)}

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
${userScores ? `USER-ADJUSTED SCORES:
${JSON.stringify(userScores, null, 2)}
` : ""}
Build the most compelling, investor-ready pitch deck possible. Focus on SERVICE-specific elements: customer journey, operational efficiency, delivery model innovation, and scalability. Do NOT include product-specific fields like supplierContacts or physical manufacturing details. Instead focus on implementation partners, technology stack, and talent needs.
Base scores on realistic market signals, competitive density, and structural feasibility.

Return ONLY the JSON object.`;
    } else {
      userPrompt = `Generate a full investor pitch deck for this product:

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
${userScores ? `USER-ADJUSTED SCORES:
${JSON.stringify(userScores, null, 2)}
` : ""}
Build the most compelling, investor-ready pitch deck possible. Use all upstream data.
Base scores on realistic market signals, competitive density, and structural feasibility.

Return ONLY the JSON object.`;
    }

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

    // Ensure backward compatibility
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

    // ── Output Validation ──
    const validationResult = validateOutput(mode, deck);
    const trace = buildTrace(mode, filterResult, validationResult);
    console.log(`[ModeEnforcement] Trace:`, JSON.stringify(trace));

    return new Response(JSON.stringify({ success: true, deck, _modeTrace: trace }), {
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
