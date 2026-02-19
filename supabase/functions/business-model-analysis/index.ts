import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { businessModel } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const systemPrompt = `You are an elite business model strategist who deconstructs businesses the same way engineers deconstruct products — from first principles. You combine:
- Clayton Christensen (disruption theory, jobs-to-be-done)
- Alex Hormozi (offers, unit economics, leverage)
- Peter Thiel (monopoly thinking, contrarian questions)
- Charlie Munger (mental models, systems thinking)
- McKinsey (ruthless operational analysis)

You question EVERYTHING about a business model:
- Why does this revenue model exist? Who decided transactions work this way?
- Why does the customer flow work this way? Where does friction hide?
- Why these cost structures? What's fixed that could be variable?
- Why this staffing model? What could be automated or eliminated?
- Why this pricing? Who set it? Is there a better structure?
- Why this location/distribution? Is proximity still required?
- What technology could eliminate entire cost centers?
- What assumptions about customers are wrong or outdated?
- What adjacent businesses could be acquired or built for asymmetric advantage?
- Where is the leverage? What scales without proportional cost?

Respond ONLY with a single valid JSON object — no markdown, no explanation.

The JSON must follow this EXACT structure:
{
  "businessSummary": {
    "trueJobToBeDone": "What customers are actually hiring this business to do (not what it thinks it does)",
    "currentModel": "How money flows today — revenue sources, cost structure, margin drivers",
    "marketPosition": "Who it competes with and why customers choose it (or don't)",
    "hiddenStrengths": ["Underutilized asset or advantage 1", "Advantage 2", "Advantage 3"]
  },
  "operationalAudit": {
    "customerJourney": ["Step 1: how customer discovers/decides", "Step 2", "Step 3: transaction", "Step 4: fulfillment", "Step 5: retention or churn"],
    "frictionPoints": [
      { "stage": "stage name", "friction": "specific friction description", "impact": "high|medium|low", "rootCause": "structural reason this exists" }
    ],
    "costStructure": {
      "biggestCostDrivers": ["Cost driver 1 and why it exists", "Cost driver 2", "Cost driver 3"],
      "fixedVsVariable": "Analysis of which costs are truly fixed vs variable, and which shouldn't be fixed",
      "eliminationCandidates": ["Cost that could be eliminated 1", "Cost 2", "Cost 3"]
    },
    "revenueLeaks": ["Revenue leak 1 — money left on table", "Leak 2", "Leak 3"]
  },
  "hiddenAssumptions": [
    {
      "assumption": "A core assumption baked into how this business operates",
      "currentAnswer": "Why it's done this way today",
      "category": "pricing | staffing | location | technology | customer | competition | timing",
      "isChallengeable": true,
      "challengeIdea": "How challenging this assumption could unlock value"
    }
  ],
  "technologyLeverage": {
    "currentTechLevel": "Honest assessment of technology usage today",
    "automationOpportunities": [
      { "process": "specific manual process", "technology": "specific tech solution", "costSaving": "estimated savings or capacity unlock", "implementationDifficulty": "easy|medium|hard" }
    ],
    "aiOpportunities": ["Specific AI application 1 and the value it creates", "AI application 2", "AI application 3"],
    "platformOpportunity": "Could this business become a platform or marketplace? What would that unlock?"
  },
  "revenueReinvention": {
    "currentRevenueMix": "Description of current revenue streams",
    "untappedStreams": [
      { "stream": "new revenue stream name", "mechanism": "how it works", "estimatedSize": "rough market size or % uplift", "effort": "low|medium|high" }
    ],
    "pricingRedesign": "A bold alternative pricing model (subscription, outcome-based, tiered, usage-based) and why it captures more value",
    "bundleOpportunities": ["Adjacent service/product to bundle 1", "Bundle 2", "Bundle 3"]
  },
  "disruptionAnalysis": {
    "vulnerabilities": ["Specific way this business could be disrupted 1", "Vulnerability 2", "Vulnerability 3"],
    "disruptorProfile": "Describe the startup that is most likely to kill this business model in 5 years",
    "defenseMoves": ["Defensive strategic move 1", "Move 2", "Move 3"],
    "attackMoves": "If YOU were trying to disrupt this industry from scratch with $1M, what would you do differently?"
  },
  "reinventedModel": {
    "modelName": "Name for the reinvented business model",
    "coreShift": "The single most important structural change (2-3 sentences)",
    "keyChanges": ["Fundamental change 1", "Change 2", "Change 3", "Change 4"],
    "newValueProposition": "How the customer experience and value delivered fundamentally changes",
    "economicTransformation": "How unit economics, margins, and scalability change with this new model",
    "implementationRoadmap": [
      { "phase": "Phase 1 (0-3 months)", "actions": ["Action 1", "Action 2"], "milestone": "what success looks like" },
      { "phase": "Phase 2 (3-12 months)", "actions": ["Action 1", "Action 2"], "milestone": "what success looks like" },
      { "phase": "Phase 3 (12-36 months)", "actions": ["Action 1", "Action 2"], "milestone": "what success looks like" }
    ],
    "estimatedROI": "Rough estimate of revenue or margin improvement with this model change",
    "biggestRisk": "The most likely failure mode and how to mitigate it",
    "requiredCapabilities": ["New capability or investment needed 1", "Needed capability 2", "Needed capability 3"]
  }
}`;

    const userPrompt = `Apply radical first-principles deconstruction to this business model.

BUSINESS TYPE: ${businessModel.type}
DESCRIPTION: ${businessModel.description}
CURRENT REVENUE MODEL: ${businessModel.revenueModel || "Not specified"}
APPROXIMATE SIZE: ${businessModel.size || "Not specified"}
GEOGRAPHY: ${businessModel.geography || "Not specified"}
KNOWN PAIN POINTS: ${businessModel.painPoints || "Not specified"}
NOTES: ${businessModel.notes || "None"}

CRITICAL INSTRUCTIONS:
1. WORKFLOW: Map every step of customer acquisition, transaction, and fulfillment. Find every friction point.
2. COSTS: Question every cost. What's fixed that shouldn't be? What can be eliminated or outsourced?
3. PRICING: Challenge the pricing model fundamentally — why charge per transaction/hour/unit? What else could work?
4. TECHNOLOGY: Where could automation, AI, or software eliminate entire roles or cost centers?
5. DISRUPTION: Who will destroy this business in 5 years and how? How do you defend against it?
6. SCALE: What's stopping this from scaling 10x? 100x? Fix those constraints.
7. Every recommendation must be specific, actionable, and grounded in real business mechanics.
8. The reinvented model must represent a STRUCTURAL shift — not a marketing tweak.

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
        temperature: 0.85,
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
      .replace(/^```(?:json)?\s*/im, "")
      .replace(/\s*```\s*$/m, "")
      .trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr);
      console.error("Raw content (first 500):", cleaned.slice(0, 500));
      throw new Error("AI returned invalid JSON. Please retry.");
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("business-model-analysis error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
