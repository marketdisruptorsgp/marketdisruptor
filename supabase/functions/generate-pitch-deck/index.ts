import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveMode, filterInputData, validateOutput, buildTrace, missingDataWarning, getModeGuardPrompt } from "../_shared/modeEnforcement.ts";
import { buildAdaptiveContextPrompt, extractAdaptiveContext } from "../_shared/adaptiveContext.ts";
import { getReasoningFramework } from "../_shared/reasoningFramework.ts";
import { buildLensPrompt } from "../_shared/lensPrompt.ts";
import { enforceVisualContract } from "../_shared/visualFallback.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Trim large upstream data to essential fields only */
function trimUpstream(data: unknown, keys: string[]): Record<string, unknown> | undefined {
  if (!data || typeof data !== "object") return undefined;
  const obj = data as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const k of keys) {
    if (obj[k] !== undefined) result[k] = typeof obj[k] === "string" ? (obj[k] as string).slice(0, 300) : obj[k];
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/** Attempt to complete truncated JSON by sending it back */
async function completeTruncatedJSON(apiKey: string, truncatedText: string): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a JSON completion assistant. The user will give you a truncated JSON object. Complete it with reasonable values maintaining the same structure and style. Return ONLY the complete valid JSON object." },
        { role: "user", content: `Complete this truncated JSON object. Return ONLY the full valid JSON:\n\n${truncatedText}` },
      ],
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) throw new Error("Completion request failed");
  const d = await resp.json();
  return d.choices?.[0]?.message?.content ?? "";
}

function parseJSON(raw: string): Record<string, unknown> {
  let cleaned = raw.replace(/^```(?:json)?\s*/im, "").replace(/\s*```\s*$/m, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\t' ? ch : "");

  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt brace-balancing repair
    let repaired = cleaned;
    let braces = 0, brackets = 0;
    for (const ch of repaired) {
      if (ch === '{') braces++; if (ch === '}') braces--;
      if (ch === '[') brackets++; if (ch === ']') brackets--;
    }
    const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) repaired += '"';
    repaired = repaired.replace(/,\s*$/, "");
    while (brackets > 0) { repaired += ']'; brackets--; }
    while (braces > 0) { repaired += '}'; braces--; }
    try {
      const result = JSON.parse(repaired);
      console.log("JSON repair succeeded after brace balancing");
      return result;
    } catch {
      throw new Error("JSON_PARSE_FAILED");
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, disruptData, stressTestData, userScores, redesignData, insightPreferences, steeringText, lens, geoData, regulatoryData, adaptiveContext: rawAdaptiveCtx } = await req.json();
    const adaptiveCtx = rawAdaptiveCtx || extractAdaptiveContext({ product });
    const adaptivePrompt = buildAdaptiveContextPrompt(adaptiveCtx);
    const mode = resolveMode(product.analysisType, product.category);
    const filterResult = filterInputData(mode, product);
    console.log(`[ModeEnforcement] pitch-deck | ${mode} | ${missingDataWarning(mode)}`);
    const modeGuard = getModeGuardPrompt(mode);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Trim upstream data to reduce input tokens
    const trimmedDisrupt = trimUpstream(disruptData, ["redesignedConcept", "hiddenAssumptions", "flippedLogic"]);
    const trimmedStressTest = trimUpstream(stressTestData, ["overallVerdict", "totalScore", "categories", "criticalFindings"]);
    const trimmedRedesign = trimUpstream(redesignData, ["conceptName", "tagline", "coreInsight", "designPrinciples"]);

    const systemPrompt = `You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.
${getReasoningFramework()}
${adaptivePrompt}
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

You are a world-class venture analyst and pitch deck strategist. You produce investor-grade business intelligence.

CRITICAL CONTENT CURATION RULES:
1. Each slide section must convey ONE clear idea
2. Select only investor-relevant insights
3. Bullet points must be ≤15 words each
4. Every section must include at least one quantified metric
5. Maintain narrative flow: Problem → Why Now → Market → Solution → Product → Business Model → Traction → Risks → GTM → Ask
6. Use REALISTIC risk framing

CRITICAL: NEVER append founding years or dates to the product/company name.

You MUST respond with ONLY a valid JSON object.

Return this structure:
{
  "problemStatement": "Concrete problem description ≤3 sentences",
  "solutionStatement": "How this solves it ≤3 sentences",
  "whyNow": "Market timing thesis ≤3 sentences",
  "marketOpportunity": {
    "tam": "$XB by YYYY",
    "sam": "Serviceable market",
    "som": "Obtainable 3-year capture",
    "growthRate": "CAGR with source",
    "keyDrivers": ["Driver 1", "Driver 2", "Driver 3", "Driver 4", "Driver 5"]
  },
  "productInnovation": "What makes this different ≤2 sentences",
  "businessModel": {
    "revenueStreams": ["Stream 1", "Stream 2", "Stream 3"],
    "pricingModel": "Pricing structure ≤15 words",
    "unitEconomics": {
      "cogs": "Cost per unit", "retailPrice": "Price", "grossMargin": "%",
      "contributionMargin": "After variable costs", "ltv": "LTV", "cac": "CAC", "paybackPeriod": "Months"
    }
  },
  "tractionSignals": ["Signal 1", "Signal 2", "Signal 3"],
  "risks": [
    {"risk": "Risk ≤12 words", "mitigation": "Mitigation ≤20 words", "severity": "high|medium|low"}
  ],
  "keyMetrics": [
    {"metric": "Name ≤5 words", "target": "Target", "why": "Why ≤10 words"}
  ],
  "gtmStrategy": {
    "phase1": "Month 1-3 actions", "phase2": "Month 4-9 actions", "phase3": "Month 10-18 actions",
    "keyChannels": ["Channel 1", "Channel 2", "Channel 3", "Channel 4"],
    "launchBudget": "$X–$Y"
  },
  "competitiveLandscape": {
    "directCompetitors": [{"name": "Competitor", "strength": "≤10 words", "weakness": "≤10 words"}],
    "indirectCompetitors": ["Category 1", "Category 2"],
    "moat": "Defensible advantage ≤2 sentences"
  },
  "investmentAsk": {
    "amount": "$X–$Y",
    "useOfFunds": ["X% Product - $Y", "X% Marketing - $Y", "X% Ops - $Y"],
    "scenarios": {
      "conservative": {"revenue": "Y1 revenue", "units": "Units", "assumptions": "Assumption"},
      "base": {"revenue": "Revenue", "units": "Units", "assumptions": "Assumption"},
      "optimistic": {"revenue": "Revenue", "units": "Units", "assumptions": "Assumption"}
    },
    "exitStrategy": "Exit path ≤1 sentence"
  },
  "tagline": "≤10-word headline",
  "elevatorPitch": "2-3 sentence pitch",
  "competitiveAdvantages": ["Advantage 1", "Advantage 2", "Advantage 3"],
  "customerPersona": {
    "name": "Archetype", "age": "Range",
    "painPoints": ["Pain 1", "Pain 2", "Pain 3"],
    "buyingBehavior": "How they buy ≤15 words",
    "willingness": "Price willingness ≤15 words"
  },
  "investorHighlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4", "Highlight 5"],
  "completionMessage": "Bold strategic insight ≤2 sentences",
  "visualSpecs": [
    {
      "visual_type": "constraint_map | causal_chain | leverage_hierarchy",
      "title": "Short title",
      "nodes": [{"id": "id", "label": "Label", "type": "constraint|effect|leverage", "priority": 1}],
      "edges": [{"from": "src", "to": "dst", "relationship": "causes|relaxed_by", "label": "optional"}],
      "layout": "linear | vertical | hierarchical",
      "interpretation": "One sentence"
    }
  ],
  "actionPlans": [
    {
      "initiative": "Name", "objective": "What", "leverage_type": "optimization|structural_improvement|redesign",
      "mechanism": "How (one sentence)", "complexity": "low|medium|high",
      "time_horizon": "near_term|mid_term|long_term",
      "risk": {"execution": "risk", "adoption": "risk", "market": "risk"},
      "validation": "MVP test", "decision_readiness": 3, "confidence": "high|medium|exploratory"
    }
  ]
}

CRITICAL RULES:
- risks must have 3-6 items with mix of severities
- keyMetrics must have 4-6 items
- Every bullet ≤15 words
- All financial figures must be specific
- SCORING CALIBRATION: Revival 5-6 default. ≥8 requires evidence.
- OUTPUT FRAMING: Include opportunity strength, constraints, execution difficulty, confidence level.`;

    const isService = product.category === "Service";
    const isBusiness = product.analysisType === "business" || product.category === "Business Model" || product.category === "Business";

    let userPrompt: string;

    const upstreamBlock = [
      trimmedDisrupt ? `DISRUPT DATA:\n${JSON.stringify(trimmedDisrupt)}` : "",
      trimmedStressTest ? `STRESS TEST:\n${JSON.stringify(trimmedStressTest)}` : "",
      trimmedRedesign ? `REDESIGN:\n${JSON.stringify(trimmedRedesign)}` : "",
      userScores ? `USER SCORES:\n${JSON.stringify(userScores)}` : "",
      steeringText ? `USER GUIDANCE: ${steeringText}` : "",
      insightPreferences ? `INSIGHT PREFERENCES:\n${Object.entries(insightPreferences as Record<string, string>).filter(([, s]) => s !== "neutral").map(([id, s]) => `${s === "liked" ? "✓" : "✗"} ${id}`).join("\n")}` : "",
    ].filter(Boolean).join("\n\n");

    if (isBusiness) {
      userPrompt = `Generate investor pitch deck for BUSINESS MODEL:
Business: ${product.name} | Category: ${product.category}
Description: ${product.description}
Revival Score: ${product.revivalScore}/10
Key Insight: ${product.keyInsight || "N/A"}
Market Size: ${product.marketSizeEstimate || "N/A"}
Trend: ${product.trendAnalysis || "N/A"}
${upstreamBlock}
BUSINESS MODEL INSTRUCTIONS: Focus on revenue model innovation, platform dynamics, unit economics, network effects. GTM via partnerships/pilots. No physical manufacturing.
${buildLensPrompt(lens)}
Return ONLY the JSON object.`;
    } else if (isService) {
      userPrompt = `Generate investor pitch deck for SERVICE:
Service: ${product.name} | Category: ${product.category}
Description: ${product.description}
Revival Score: ${product.revivalScore}/10
Key Insight: ${product.keyInsight || "N/A"}
Market Size: ${product.marketSizeEstimate || "N/A"}
Pricing: ${JSON.stringify(product.pricingIntel || {}).slice(0, 300)}
${upstreamBlock}
SERVICE INSTRUCTIONS: Focus on customer journey, delivery model, operational efficiency, scalability. Implementation partners over suppliers.
${buildLensPrompt(lens)}
Return ONLY the JSON object.`;
    } else {
      userPrompt = `Generate investor pitch deck for PRODUCT:
Product: ${product.name} | Category: ${product.category} | Era: ${product.era}
Description: ${product.description}
Specs: ${product.specs}
Revival Score: ${product.revivalScore}/10
Key Insight: ${product.keyInsight || "N/A"}
Market Size: ${product.marketSizeEstimate || "N/A"}
Supply Chain: ${JSON.stringify(product.supplyChain || {}).slice(0, 400)}
Pricing: ${JSON.stringify(product.pricingIntel || {}).slice(0, 300)}
${upstreamBlock}
${geoData ? `GEO DATA: US Establishments: ${geoData.us?.totalEstablishments?.toLocaleString() || "N/A"} | Top states: ${JSON.stringify((geoData.us?.topStates || []).slice(0, 3).map((s: any) => s.name))} | Top global: ${JSON.stringify((geoData.global?.topMarkets || []).slice(0, 3).map((c: any) => c.name))}` : ""}
${regulatoryData?.regulatoryRelevance !== "none" ? `REGULATORY: ${regulatoryData?.matchedCategory} | Agencies: ${(regulatoryData?.agencies || []).join(", ")}` : ""}
${buildLensPrompt(lens)}
Return ONLY the JSON object.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 16000,
        response_format: { type: "json_object" },
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
    const finishReason = aiData.choices?.[0]?.finish_reason || aiData.choices?.[0]?.finishReason || "";

    let deck: Record<string, unknown>;

    if (finishReason === "length" || finishReason === "MAX_TOKENS") {
      console.warn(`[PitchDeck] Output truncated (finish_reason=${finishReason}). Attempting completion...`);
      try {
        const completedText = await completeTruncatedJSON(LOVABLE_API_KEY, rawText);
        deck = parseJSON(completedText);
        console.log("Truncation recovery succeeded via completion request");
      } catch {
        console.warn("Completion request failed, attempting direct parse with repair");
        deck = parseJSON(rawText);
      }
    } else {
      deck = parseJSON(rawText);
    }

    // Ensure backward compatibility
    if (!deck.financialModel && (deck.businessModel as any)?.unitEconomics) {
      const bm = deck.businessModel as any;
      const ia = deck.investmentAsk as any;
      deck.financialModel = {
        unitEconomics: bm.unitEconomics,
        scenarios: ia?.scenarios || {},
        pricingStrategy: bm.pricingModel || "",
        breakEvenAnalysis: bm.unitEconomics?.paybackPeriod || "",
        fundingAsk: ia?.amount || "",
        useOfFunds: ia?.useOfFunds || [],
        exitStrategy: ia?.exitStrategy || "",
      };
    }

    enforceVisualContract(deck);

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
