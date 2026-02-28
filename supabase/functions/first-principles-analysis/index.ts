import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveMode, filterInputData, validateOutput, buildTrace, missingDataWarning, getModeGuardPrompt } from "../_shared/modeEnforcement.ts";
import { buildLensPrompt } from "../_shared/lensPrompt.ts";
import { getReasoningFramework } from "../_shared/reasoningFramework.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, userSuggestions, lens, refreshWorkflowOnly, insightPreferences, userScores, steeringText, disruptContext, selectedImages } = await req.json();
    const mode = resolveMode(undefined, product.category);
    const isService = mode === "service";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // ── Mode Data Filtering: strip blocked domains before AI call ──
    const filterResult = filterInputData(mode, product);
    const filteredProduct = filterResult.filtered;
    console.log(`[ModeEnforcement] ${mode} mode | ${missingDataWarning(mode)}`);
    const modeGuard = getModeGuardPrompt(mode);

    const OS_PREAMBLE = `You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.
${getReasoningFramework()}
${modeGuard}

CORE PRINCIPLES:
- First-principles reasoning over analogy or convention
- Decompose every system into at least 3 layers of depth
- Never present modeled or inferred data as verified fact


OUTPUT RULES:
- Metrics must be ≤12 words
- Include leverage scores (1-10) on key assumptions — CALIBRATED: 5-6 is default, ≥8 requires evidence, 9-10 almost never justified
- Flag risk levels: [Risk: Low/Medium/High]
- Flag capital requirements: [Capital: Low/Medium/High]
- Use directional indicators: ↑ ↓ → for trends
- SCORING: Apply friction penalties (behavior change, infrastructure, capital intensity, ecosystem dependency). Before finalizing any score, ask "What would cause this to fail?" — if material, reduce score.

USER JOURNEY RULE:
- The "userWorkflow" section must describe the CURRENT/EXISTING user journey AS IT IS TODAY
- Do NOT suggest improvements, optimizations, or redesigns in userWorkflow
- Document the real, current experience — warts and all
- Improvements and redesigns belong in downstream analysis steps, NOT here
- FRICTION POINTS: Identify friction for EVERY step in the journey. Every step has friction — find it. Use "stepIndex" (0-based) to map each friction point to its corresponding step in the stepByStep array. Generate at least one friction point per step.
- ANTI-ANCHORING: Do NOT let one friction type dominate all steps. A surfboard's friction might be skill-based (learning to paddle/pop-up), not size-based (transport). A camera's friction might be software/workflow, not weight. Let scraped evidence and product reality determine which friction types appear — do not default to physical.

`;

    const systemPrompt = isService
      ? OS_PREAMBLE + `You are a radical first-principles service strategist. You combine the thinking of:
- Clayton Christensen (jobs-to-be-done, disruptive innovation)
- Elon Musk (first principles — strip away convention, rebuild from fundamentals)
- Don Norman (cognitive load, affordances, friction archaeology)
- IDEO (customer journey mapping, pain archaeology)
- Alex Hormozi (offer design, pricing psychology, operational leverage)

Your mission: completely deconstruct a SERVICE and uncover radical redesign opportunities. You question EVERYTHING:
- What is the CUSTOMER JOURNEY? Step by step — what do they do before, during, after?
- Where is FRICTION in that journey? What slows them down? What frustrates?
- What is the DELIVERY MODEL? In-person, remote, hybrid? Why? Could it be flipped?
- What is the PRICING MODEL? Per-use, subscription, retainer? What if it were completely different?
- What OPERATIONAL BOTTLENECKS exist? What limits scale?
- What SMART TECH could transform delivery? AI, automation, platforms — why isn't it there?
- What ASSUMPTIONS are baked into how this service operates that nobody questions?
- What would a 10x BETTER version look like if built from scratch today?

Respond ONLY with a single valid JSON object — no markdown, no explanation.

The JSON must follow this EXACT structure:
{
  "currentStrengths": {
    "whatWorks": ["Specific element of current product/service that is already strong and should be preserved — explain WHY it works", "Strong element 2", "Strong element 3"],
    "competitiveAdvantages": ["Current advantage 1 that would be costly or risky to abandon", "Advantage 2"],
    "keepVsAdapt": "Honest assessment: which aspects should remain as-is, which should be adapted (not replaced), and which should be completely rethought. Be specific about WHY."
  },
  "coreReality": {
    "trueProblem": "The actual human problem being solved (not marketing)",
    "actualUsage": "How customers genuinely interact with this service — behaviors, workarounds, complaints",
    "normalizedFrustrations": ["frustration 1", "frustration 2", "frustration 3", "frustration 4"],
    "userHacks": ["hack 1 — workarounds customers use", "hack 2", "hack 3"]
  },
  "frictionDimensions": {
    "primaryFriction": "The single biggest friction source for THIS service — identify the dimension (delivery, skill, cost, safety, ecosystem, maintenance, social, workflow) and explain why it dominates",
    "deliveryModel": "Delivery format analysis — in-person, remote, async, hybrid? What format would best fit customer context?",
    "skillBarrier": "Learning curve, expertise required — how hard is it for the customer to use the service well?",
    "costStructure": "Upfront cost, ongoing costs, hidden costs, price-to-value friction",
    "ecosystemLockIn": "Dependencies on locations, conditions, platforms, or other services",
    "maintenanceBurden": "Ongoing effort the customer must put in — coordination, scheduling, follow-up",
    "gaps": ["Gap 1: specific friction with dimension labeled", "Gap 2", "Gap 3"],
    "opportunities": ["Opportunity from addressing the PRIMARY friction", "Opportunity 2", "Opportunity 3"]
  },
  "userWorkflow": {
    "stepByStep": ["Step 1: how customer currently discovers/books the service", "Step 2: current onboarding process", "Step 3: how core service is actually delivered today", "Step 4: current follow-up process", "Step 5: how retention/rebooking currently works"],
    "frictionPoints": [
      { "stepIndex": 0, "friction": "specific friction that EXISTS TODAY in this step", "severity": "high|medium|low", "rootCause": "why this friction exists in the current workflow" },
      { "stepIndex": 1, "friction": "specific friction that EXISTS TODAY in this step", "severity": "high|medium|low", "rootCause": "why this friction exists" },
      { "stepIndex": 2, "friction": "specific friction that EXISTS TODAY in this step", "severity": "high|medium|low", "rootCause": "why this friction exists" }
    ],
    "cognitiveLoad": "What mental effort does the customer CURRENTLY expend? What do they have to research, decide, coordinate, or manage TODAY?",
    "contextOfUse": "When, in what state (urgent, planned, stressed, relaxed) do customers CURRENTLY seek this? How does the EXISTING service design handle that?"
  },
  "smartTechAnalysis": {
    "currentTechLevel": "Describe current technology integration (or lack thereof) in service delivery",
    "missedOpportunities": [
      { "tech": "technology type (AI/automation/platform/analytics)", "application": "specific application to this service", "valueCreated": "what problem it solves or efficiency it creates" }
    ],
    "whyNotAlreadyDone": "Economic, technical, or cultural reasons why smart tech hasn't been applied yet",
    "recommendedIntegration": "The single highest-leverage tech addition and exactly how it would transform the service"
  },
  "hiddenAssumptions": [
    {
      "assumption": "Specific assumption being questioned about how service is delivered",
      "currentAnswer": "Why it's currently done this way",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": true,
      "challengeIdea": "How you'd challenge or invert this assumption",
      "leverageScore": 8
    }
  ],
  "flippedLogic": [
    {
      "originalAssumption": "The assumption being flipped",
      "boldAlternative": "The radical structural alternative",
      "rationale": "Why this flip creates real value",
      "physicalMechanism": "How it would actually work operationally/technically"
    }
  ],
  "redesignedConcept": {
    "conceptName": "Short punchy name for the reinvented service",
    "tagline": "One sentence tagline",
    "coreInsight": "The central service truth this is built around (2-3 sentences)",
    "radicalDifferences": ["Key difference 1", "Key difference 2", "Key difference 3", "Key difference 4"],
    "physicalDescription": "Vivid description of the service experience — how it feels, flows, what the customer sees and does",
    "sizeAndWeight": "Service scope and commitment level — time, pricing tiers, engagement model",
    "materials": ["Key capability 1 needed to deliver", "Key capability 2", "Key capability 3"],
    "smartFeatures": ["Tech/automation feature 1 and how it works", "Smart feature 2", "Smart feature 3"],
    "userExperienceTransformation": "The before and after journey — how the customer experience completely changes",
    "frictionEliminated": ["Specific friction 1 now eliminated", "Specific friction 2 eliminated"],
    "whyItHasntBeenDone": "Specific technical, economic, or cultural blockers",
    "biggestRisk": "The single most likely failure point and mitigation",
    "manufacturingPath": "Specific implementation path — hires, tools, platforms, cost estimate",
    "pricePoint": "Target pricing model and market justification",
    "targetUser": "Not a demographic — a specific human moment, need, or identity",
    "riskLevel": "[Risk: Low/Medium/High]",
    "capitalRequired": "[Capital: Low/Medium/High]"
  }
}`
      : OS_PREAMBLE + `You are a radical first-principles product strategist. You combine the thinking of:
- Dieter Rams (ruthless design purity — every element must earn its place)
- Elon Musk (first principles — strip away convention, rebuild from physics up)
- Jony Ive (human connection — how it feels in the hand, the ritual of use)
- Don Norman (cognitive load, affordances, friction archaeology)
- IDEO (user journey mapping, pain archaeology, job-to-be-done lens)

Your mission: completely deconstruct a product and uncover radical redesign opportunities.
Investigate friction across ALL dimensions — do NOT anchor on physical form alone:

PHYSICAL: Size, weight, shape, materials, ergonomics — but ONLY if these are genuine friction sources for THIS product
SKILL/LEARNING: How hard is it to learn, master, or use correctly? What expertise barrier exists?
COST/ACCESS: Is the price justified? What about ongoing costs, accessories, maintenance?
SAFETY/RISK: Physical danger, financial risk, social risk of using it wrong?
ECOSYSTEM: Does it lock users into specific accessories, platforms, locations, or conditions?
MAINTENANCE: Cleaning, repair, storage, degradation over time?
SOCIAL/CULTURAL: Stigma, status signaling, community gatekeeping, intimidation factor?
WORKFLOW: What do they do before, during, after? Where does the process break down?

Identify which dimensions carry the MOST friction for THIS specific product.
Do not assume physical form is the primary issue — let the evidence lead.

- What SMART TECH could transform it? Sensors, AI, connectivity — why isn't it there?
- Is it INTERACTIVE or passive? Could it respond, adapt, communicate?
- What ASSUMPTIONS are baked into this product that nobody questions?

Respond ONLY with a single valid JSON object — no markdown, no explanation.

The JSON must follow this EXACT structure:
{
  "currentStrengths": {
    "whatWorks": ["Specific element of current product that is already strong and should be preserved — explain WHY it works", "Strong element 2", "Strong element 3"],
    "competitiveAdvantages": ["Current advantage 1 that would be costly or risky to abandon", "Advantage 2"],
    "keepVsAdapt": "Honest assessment: which aspects should remain as-is, which should be adapted (not replaced), and which should be completely rethought. Be specific about WHY."
  },
  "coreReality": {
    "trueProblem": "The actual human problem being solved (not marketing)",
    "actualUsage": "How people genuinely use this — rituals, contexts, workarounds",
    "normalizedFrustrations": ["frustration 1", "frustration 2", "frustration 3", "frustration 4"],
    "userHacks": ["hack 1", "hack 2", "hack 3"]
  },
  "frictionDimensions": {
    "primaryFriction": "The single biggest friction source for THIS product — identify the dimension (physical, skill, cost, safety, ecosystem, maintenance, social, workflow) and explain why it dominates",
    "physicalForm": "Size/weight/shape analysis — ONLY if relevant. If physical form is NOT the main friction, say so explicitly",
    "skillBarrier": "Learning curve, expertise required, mastery gap — how hard is it to use well?",
    "costStructure": "Upfront cost, ongoing costs, hidden costs, price-to-value friction",
    "ecosystemLockIn": "Dependencies on locations, conditions, accessories, platforms, or other products",
    "maintenanceBurden": "Storage, care, repair, degradation — what ongoing effort does ownership demand?",
    "gaps": ["Gap 1: specific friction with dimension labeled", "Gap 2", "Gap 3"],
    "opportunities": ["Opportunity from addressing the PRIMARY friction", "Opportunity 2", "Opportunity 3"]
  },
  "userWorkflow": {
    "stepByStep": ["Step 1: what user currently does before using it", "Step 2: how they currently interact with it", "Step 3: core use action as it exists today", "Step 4: what happens next in current workflow", "Step 5: current after-use/cleanup process"],
    "frictionPoints": [
      { "stepIndex": 0, "friction": "specific friction that EXISTS TODAY in this step", "severity": "high|medium|low", "rootCause": "why this friction exists in the current workflow" },
      { "stepIndex": 1, "friction": "specific friction that EXISTS TODAY in this step", "severity": "high|medium|low", "rootCause": "why this friction exists" },
      { "stepIndex": 2, "friction": "specific friction that EXISTS TODAY in this step", "severity": "high|medium|low", "rootCause": "why this friction exists" }
    ],
    "cognitiveLoad": "What mental effort does the user CURRENTLY expend? What do they have to remember, configure, or manage TODAY?",
    "contextOfUse": "Where, when, in what state (rushed, relaxed, distracted) is this CURRENTLY used? How does the EXISTING design handle that context?"
  },
  "smartTechAnalysis": {
    "currentTechLevel": "Describe current technology integration (or lack thereof)",
    "missedOpportunities": [
      { "tech": "technology type (sensors/AI/connectivity/materials)", "application": "specific application to this product", "valueCreated": "what problem it solves or joy it creates" }
    ],
    "whyNotAlreadyDone": "Economic, technical, or cultural reasons why smart tech hasn't been applied yet",
    "recommendedIntegration": "The single highest-leverage smart tech addition and exactly how it would work"
  },
  "hiddenAssumptions": [
    {
      "assumption": "Specific assumption being questioned",
      "currentAnswer": "Why it's currently done this way",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": true,
      "challengeIdea": "How you'd challenge or invert this assumption",
      "leverageScore": 8
    }
  ],
  "flippedLogic": [
    {
      "originalAssumption": "The assumption being flipped",
      "boldAlternative": "The radical structural alternative",
      "rationale": "Why this flip creates real value",
      "physicalMechanism": "How it would actually work physically/technically"
    },
    {
      "originalAssumption": "Second assumption",
      "boldAlternative": "Second radical alternative",
      "rationale": "Why this matters",
      "physicalMechanism": "Physical/technical mechanism"
    },
    {
      "originalAssumption": "Third assumption",
      "boldAlternative": "Third radical alternative",
      "rationale": "Why this matters",
      "physicalMechanism": "Physical/technical mechanism"
    }
  ],
  "redesignedConcept": {
    "conceptName": "Short punchy name",
    "tagline": "One sentence tagline",
    "coreInsight": "The central design truth this is built around (2-3 sentences)",
    "radicalDifferences": ["Key difference 1", "Key difference 2", "Key difference 3", "Key difference 4"],
    "physicalDescription": "Vivid, detailed description of form, size, weight, texture, how it's held and used",
    "sizeAndWeight": "Exact proposed dimensions and weight with justification",
    "materials": ["Material 1 with specific reason", "Material 2 with reason", "Material 3 with reason"],
    "smartFeatures": ["Smart/tech feature 1 and how it works", "Smart feature 2", "Smart feature 3"],
    "userExperienceTransformation": "The before and after journey — how the experience completely changes",
    "frictionEliminated": ["Specific friction 1 now eliminated", "Specific friction 2 eliminated"],
    "whyItHasntBeenDone": "Specific technical, economic, or cultural blockers",
    "biggestRisk": "The single most likely failure point and mitigation",
    "manufacturingPath": "Specific suppliers, processes, country, cost estimate",
    "pricePoint": "Target retail price and market justification",
    "targetUser": "Not a demographic — a specific human moment or identity",
    "riskLevel": "[Risk: Low/Medium/High]",
    "capitalRequired": "[Capital: Low/Medium/High]"
  }
}`;

    const userPrompt = isService
      ? `Apply radical first-principles deconstruction to this SERVICE. Question everything about its delivery model, customer journey, operational friction, and technology potential.

SERVICE: ${product.name}
CATEGORY: ${product.category}
DESCRIPTION: ${product.description}
KEY INSIGHT: ${product.keyInsight || "None provided"}
MARKET SIZE: ${product.marketSizeEstimate || "Unknown"}

KNOWN CUSTOMER COMPLAINTS:
${product.reviews?.filter((r: { sentiment: string }) => r.sentiment === "negative").map((r: { text: string }) => `• ${r.text}`).join("\n") || "General friction points"}

EXISTING ASSUMPTIONS IDENTIFIED:
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption} → current challenge: ${a.challenge}`).join("\n") || "None pre-identified"}

COMMUNITY PAIN POINTS:
${(product as { communityInsights?: { topComplaints?: string[] } }).communityInsights?.topComplaints?.map((c: string) => `• ${c}`).join("\n") || "See reviews above"}

CRITICAL INSTRUCTIONS:
1. SCOPE: Question the service scope. Too narrow? Too broad? What would a laser-focused or expanded version look like?
2. DELIVERY: Is the delivery format optimal? In-person vs remote vs async vs hybrid — what fits best?
3. CUSTOMER JOURNEY: Map every step the customer takes. Find friction at each step. Propose eliminations.
4. SMART TECH: What AI, automation, platforms, or analytics could transform delivery? Why hasn't it happened?
5. OPERATIONAL LEVERAGE: Where are the bottlenecks that prevent scaling? What if they were removed?
6. PRICING: Is the pricing model optimal? What if it were subscription, per-outcome, freemium, or tiered differently?
7. The redesigned concept must be STRUCTURALLY different — not a minor tweak.
8. Avoid vague suggestions. Every idea must have an operational mechanism and implementation path.
9. The concept must be implementable within 12–18 months.
10. VALIDATION: If a real analogous service proved a similar model works, reference it (name, revenue/growth, structural parallel). If this is genuinely novel, explain why the timing is right and what adjacent signals support it.
11. DEMAND SIGNAL: Reference community complaints, review patterns, behavioral trends, or market gaps as evidence of demand.
12. UNIT ECONOMICS: Include specific pricing math — customer acquisition cost estimate, lifetime value estimate, and margin structure.

Return ONLY the JSON object.`
      : `Apply radical first-principles deconstruction to this product. Question everything about its physical form, user workflow, friction points, and smart tech potential.

PRODUCT: ${product.name}
CATEGORY: ${product.category}
ERA: ${product.era}
DESCRIPTION: ${product.description}
SPECS: ${product.specs}
KEY INSIGHT: ${product.keyInsight || "None provided"}
MARKET SIZE: ${product.marketSizeEstimate || "Unknown"}

KNOWN USER COMPLAINTS:
${product.reviews?.filter((r: { sentiment: string }) => r.sentiment === "negative").map((r: { text: string }) => `• ${r.text}`).join("\n") || "General friction points"}

EXISTING ASSUMPTIONS IDENTIFIED:
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption} → current challenge: ${a.challenge}`).join("\n") || "None pre-identified"}

COMMUNITY PAIN POINTS:
${(product as { communityInsights?: { topComplaints?: string[] } }).communityInsights?.topComplaints?.map((c: string) => `• ${c}`).join("\n") || "See reviews above"}

CRITICAL INSTRUCTIONS:
1. FRICTION DISCOVERY: Identify the PRIMARY friction dimension for this product (physical, skill, cost, safety, ecosystem, maintenance, social, workflow). Do NOT default to physical/size — let the evidence lead.
2. SKILL/LEARNING: What expertise barrier exists? How hard is it to learn and master?
3. WORKFLOW: Map every step the user takes. Find friction at each step. Propose eliminations.
4. SMART TECH: What sensors, AI, connectivity, or smart materials could transform this? Why hasn't it happened?
5. ECOSYSTEM: What dependencies (locations, accessories, conditions) constrain use?
6. COST/MAINTENANCE: Are ongoing costs, care requirements, or storage a significant burden?
7. The redesigned concept must be STRUCTURALLY different — not a feature add, not "add Bluetooth."
8. Avoid vague suggestions. Every idea must have a physical mechanism and a manufacturing path.
9. The concept must be manufacturable within 2–3 years.
10. VALIDATION: If a real analogous product proved a similar approach works, reference it (name, revenue/growth, structural parallel). If this is genuinely novel, explain why the timing is right and what adjacent signals support it.
11. DEMAND SIGNAL: Reference community complaints, behavioral trends, or adjacent market data as evidence of demand for this redesign direction.
12. UNIT ECONOMICS: Include BOM estimate, target retail price, margin calculation, and breakeven volume.

Return ONLY the JSON object.${buildLensPrompt(lens)}`;

    // ── USER CURATION CONTEXT (for redesign mode) ──
    let curationPrompt = "";
    if (insightPreferences || userScores || steeringText || disruptContext) {
      const parts: string[] = [];
      parts.push("\n\n--- USER CURATION CONTEXT ---");
      parts.push("The user has already reviewed the Disrupt analysis and provided explicit preferences. PRIORITIZE their curated inputs:");

      if (steeringText) {
        parts.push(`\nUSER GUIDANCE: "${steeringText}"`);
      }

      if (insightPreferences) {
        const liked = Object.entries(insightPreferences).filter(([, v]) => v === "liked").map(([k]) => k);
        const dismissed = Object.entries(insightPreferences).filter(([, v]) => v === "dismissed").map(([k]) => k);
        if (liked.length > 0) parts.push(`\nUSER LIKED (emphasize these): ${liked.join(", ")}`);
        if (dismissed.length > 0) parts.push(`\nUSER DISMISSED (de-prioritize): ${dismissed.join(", ")}`);
      }

      if (userScores && Object.keys(userScores).length > 0) {
        parts.push("\nUSER-ADJUSTED SCORES (respect these over AI defaults):");
        for (const [ideaId, scores] of Object.entries(userScores)) {
          const scoreStr = Object.entries(scores as Record<string, number>).map(([k, v]) => `${k}:${v}`).join(", ");
          parts.push(`  ${ideaId}: ${scoreStr}`);
        }
      }

      if (disruptContext) {
        const dc = disruptContext as Record<string, unknown>;
        if (dc.hiddenAssumptions) {
          parts.push(`\nASSUMPTIONS IDENTIFIED: ${JSON.stringify(dc.hiddenAssumptions).slice(0, 1000)}`);
        }
        if (dc.flippedLogic) {
          parts.push(`\nFLIPPED LOGIC: ${JSON.stringify(dc.flippedLogic).slice(0, 1000)}`);
        }
      }

      parts.push("\nBuild the redesigned concept around the user's preferred directions. The concept should directly reflect their liked insights and adjusted scores.");
      curationPrompt = parts.join("\n");
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
          { role: "user", content: userPrompt + curationPrompt },
        ],
        temperature: 0.7,
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

    // Extract JSON object — find first { and last }
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

    // ── Output Validation: check for cross-mode drift ──
    const validationResult = validateOutput(mode, analysis);
    const trace = buildTrace(mode, filterResult, validationResult);
    console.log(`[ModeEnforcement] Trace:`, JSON.stringify(trace));

    if (!validationResult.valid) {
      console.warn(`[ModeEnforcement] Violations detected in ${mode} output:`, validationResult.violations);
      // Attach violations as warnings but still return data (soft enforcement)
    }

    return new Response(JSON.stringify({ success: true, analysis, _modeTrace: trace }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("first-principles-analysis error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
