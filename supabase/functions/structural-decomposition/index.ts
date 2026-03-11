/**
 * STRUCTURAL DECOMPOSITION — True first-principles primitive extraction
 *
 * Decomposes a product, service, or business model into its irreducible
 * structural primitives BEFORE any pattern recognition or opportunity analysis.
 *
 * Product  → Job-to-be-done, functional components, tech primitives, cost drivers, physical constraints
 * Service  → Outcome, task graph, labor inputs, tools, coordination, time constraints
 * Business → Value creation, value capture, cost structure, distribution, scaling constraints
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function resolveMode(category: string): "product" | "service" | "business" {
  const lower = (category || "").toLowerCase();
  const serviceKeywords = ["service", "consulting", "coaching", "cleaning", "repair", "salon", "spa", "therapy",
    "restaurant", "catering", "healthcare", "legal", "accounting", "marketing", "agency",
    "tutoring", "training", "fitness", "yoga", "delivery", "logistics", "maintenance"];
  if (serviceKeywords.some(kw => lower.includes(kw))) return "service";
  if (lower.includes("business") || lower.includes("model") || lower.includes("saas") || lower.includes("platform") || lower.includes("marketplace")) return "business";
  return "product";
}

// ── MODE-SPECIFIC PROMPTS ──

const PRODUCT_SCHEMA = `{
  "mode": "product",
  "jobToBeDone": {
    "coreJob": "When I [situation], I want to [motivation], so I can [outcome] — the fundamental job this product is hired for",
    "functionalNeeds": ["Functional need 1 this product addresses", "Need 2", "Need 3"],
    "emotionalNeeds": ["Emotional need 1 — how user wants to FEEL", "Need 2"],
    "socialNeeds": ["Social need — how user wants to be PERCEIVED", "Need 2"]
  },
  "functionalComponents": [
    {
      "id": "fc_1",
      "label": "Component name",
      "description": "What this component does and why it exists",
      "isIrreducible": true,
      "dependencies": []
    }
  ],
  "technologyPrimitives": [
    {
      "id": "tp_1",
      "technology": "Specific technology or material science",
      "role": "What this technology enables in the product",
      "maturityLevel": "mature|emerging|frontier",
      "alternatives": ["Alternative tech 1", "Alternative 2"]
    }
  ],
  "costDrivers": [
    {
      "id": "cd_1",
      "driver": "Specific cost driver",
      "category": "materials|manufacturing|labor|logistics|IP|compliance|overhead",
      "proportionEstimate": "~X% of unit cost",
      "reducible": true
    }
  ],
  "physicalConstraints": [
    {
      "id": "pc_1",
      "constraint": "Specific physical/structural constraint",
      "type": "physics|economics|regulation|behavior|technology",
      "bindingStrength": 8,
      "challengeable": false
    }
  ]
}`;

const SERVICE_SCHEMA = `{
  "mode": "service",
  "outcome": {
    "promisedOutcome": "What the service promises to deliver",
    "actualOutcome": "What the service actually delivers in practice",
    "outcomeMeasurability": "quantifiable|qualitative|mixed",
    "timeToValue": "How long until customer experiences the promised value"
  },
  "taskGraph": [
    {
      "id": "tg_1",
      "task": "Specific task in the service delivery",
      "performer": "provider|customer|system|third_party",
      "sequencePosition": 1,
      "parallelizable": false,
      "eliminable": false,
      "dependsOn": []
    }
  ],
  "laborInputs": [
    {
      "id": "li_1",
      "role": "Specific role involved in delivery",
      "skillLevel": "commodity|skilled|expert|specialist",
      "scarcity": "abundant|moderate|scarce",
      "automatable": true,
      "costWeight": "Relative cost contribution e.g. ~40% of service cost"
    }
  ],
  "tools": [
    {
      "id": "t_1",
      "tool": "Specific tool or system used",
      "purpose": "What it enables in the service",
      "ownershipModel": "provider_owned|customer_owned|shared|platform",
      "substitutable": true
    }
  ],
  "coordinationRequirements": [
    {
      "id": "cr_1",
      "requirement": "Specific coordination need",
      "parties": ["Party 1", "Party 2"],
      "complexity": "simple|moderate|complex",
      "failureMode": "What goes wrong when coordination fails"
    }
  ],
  "timeConstraints": [
    {
      "id": "tc_1",
      "constraint": "Specific time-bound constraint",
      "type": "time|coordination|behavior",
      "bindingStrength": 7,
      "challengeable": true
    }
  ]
}`;

const BUSINESS_SCHEMA = `{
  "mode": "business",
  "valueCreation": {
    "mechanism": "How value is actually created — the core transformation",
    "coreActivity": "The single most important activity that creates value",
    "keyResources": ["Resource 1", "Resource 2"],
    "valueChainPosition": "Where this business sits in the industry value chain",
    "defensibility": "What makes this value creation hard to replicate"
  },
  "valueCapture": {
    "mechanism": "How created value is converted to revenue",
    "pricingModel": "Current pricing mechanism and structure",
    "willingness_to_pay_driver": "What drives the customer's willingness to pay",
    "captureEfficiency": "What fraction of value created is actually captured as revenue, and why",
    "leakagePoints": ["Where value leaks to competitors/substitutes", "Leakage 2"]
  },
  "costStructure": {
    "fixedCosts": [
      { "item": "Fixed cost item", "proportion": "~X% of total", "reducible": true }
    ],
    "variableCosts": [
      { "item": "Variable cost item", "scalingBehavior": "How cost changes with scale", "unitEconomics": "Cost per unit of output" }
    ],
    "costAdvantage": "Any structural cost advantage or disadvantage vs. alternatives",
    "breakEvenDynamics": "What it takes to reach breakeven and how scale affects it"
  },
  "distribution": {
    "channels": [
      { "channel": "Distribution channel", "reachEfficiency": "How effectively it reaches target customers", "cost": "Cost to acquire through this channel", "control": "owned|rented|shared" }
    ],
    "customerAcquisition": "How customers are actually acquired today",
    "networkEffects": "Whether and how network effects exist or could be created",
    "switchingCosts": "What keeps customers from switching and how durable those barriers are"
  },
  "scalingConstraints": [
    {
      "id": "sc_1",
      "constraint": "Specific scaling constraint",
      "type": "economics|technology|regulation|behavior|coordination",
      "bindingStrength": 7,
      "challengeable": true
    }
  ]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, mode: explicitMode, adaptiveContext, extractedContext, upstreamIntel } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const mode = explicitMode || resolveMode(product?.category || "");
    const schema = mode === "service" ? SERVICE_SCHEMA : mode === "business" ? BUSINESS_SCHEMA : PRODUCT_SCHEMA;

    const modeLabel = mode === "service" ? "SERVICE" : mode === "business" ? "BUSINESS MODEL" : "PRODUCT";

    // Build context from product data and upstream intel
    let contextBlock = "";
    if (product?.name) contextBlock += `\nEntity: ${product.name}`;
    if (product?.category) contextBlock += `\nCategory: ${product.category}`;
    if (product?.description) contextBlock += `\nDescription: ${product.description}`;
    if (product?.specs) contextBlock += `\nSpecs: ${product.specs}`;
    if (extractedContext) contextBlock += `\n\nExtracted Intelligence:\n${extractedContext}`;
    if (adaptiveContext?.problemStatement) contextBlock += `\nProblem: ${adaptiveContext.problemStatement}`;

    // Include upstream scraped intelligence for grounding
    if (upstreamIntel) {
      const intelParts: string[] = [];
      if (upstreamIntel.supplyChain) intelParts.push(`Supply Chain: ${JSON.stringify(upstreamIntel.supplyChain).slice(0, 1500)}`);
      if (upstreamIntel.pricingIntel) intelParts.push(`Pricing: ${JSON.stringify(upstreamIntel.pricingIntel).slice(0, 1000)}`);
      if (upstreamIntel.competitorAnalysis) intelParts.push(`Competitors: ${JSON.stringify(upstreamIntel.competitorAnalysis).slice(0, 1000)}`);
      if (upstreamIntel.operationalIntel) intelParts.push(`Operations: ${JSON.stringify(upstreamIntel.operationalIntel).slice(0, 1000)}`);
      if (intelParts.length > 0) contextBlock += `\n\nUpstream Intelligence:\n${intelParts.join("\n")}`;
    }

    const systemPrompt = `You are a structural decomposition engine. Your ONLY job is to decompose a ${modeLabel} into its irreducible structural primitives.

CRITICAL RULES:
- You are performing DECOMPOSITION, not analysis. Break the system into its fundamental parts.
- Every primitive must be SPECIFIC to this exact ${modeLabel.toLowerCase()}, not generic.
- Do NOT suggest improvements, opportunities, or changes. Only describe what EXISTS.
- Do NOT use placeholder text. Every field must contain real, specific information.
- Components must be genuinely irreducible — if it can be broken down further, break it down.
- Use real technology names, real material names, real cost categories.
- Ground everything in the actual entity provided, not in what a generic ${modeLabel.toLowerCase()} might look like.

${mode === "product" ? `PRODUCT DECOMPOSITION MANDATE:
- jobToBeDone: Use Clayton Christensen's Jobs framework. The job is what the CUSTOMER hires this product to do.
- functionalComponents: List every physical/logical component. A toilet valve has a float, a seal, a fill tube, a shut-off mechanism, etc.
- technologyPrimitives: What specific technologies or materials science underpin each component?
- costDrivers: Where does the money actually go? Materials, molding, packaging, distribution?
- physicalConstraints: What laws of physics, plumbing codes, or material limits constrain this product?` : ""}

${mode === "service" ? `SERVICE DECOMPOSITION MANDATE:
- outcome: What is ACTUALLY delivered vs. what is promised? How long until the customer sees value?
- taskGraph: Map EVERY task in delivery. Who does it? Can it be parallelized or eliminated?
- laborInputs: What specific roles are needed? How scarce are they? Could they be automated?
- tools: What specific tools, software, or equipment are used in delivery?
- coordinationRequirements: Where must multiple parties synchronize? What fails when they don't?
- timeConstraints: What time-bound constraints exist? Scheduling, availability, perishability?` : ""}

${mode === "business" ? `BUSINESS MODEL DECOMPOSITION MANDATE:
- valueCreation: What is the core transformation this business performs? Not the output — the mechanism.
- valueCapture: How is value converted to revenue? Where does value leak to competitors/substitutes?
- costStructure: Separate fixed from variable. What scales linearly vs. sublinearly?
- distribution: How do customers actually find and access this? What channels exist?
- scalingConstraints: What limits growth? Capital, talent, regulation, technology, coordination?` : ""}

Respond ONLY with a single valid JSON object matching this schema:
${schema}`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Decompose this ${modeLabel.toLowerCase()} into its structural primitives:\n${contextBlock}` },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[structural-decomposition] API error:", errorText);
      throw new Error(`API returned ${response.status}`);
    }

    const completion = await response.json();
    let rawContent = completion.choices?.[0]?.message?.content || "";

    // Strip markdown fences if present
    rawContent = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let decomposition;
    try {
      decomposition = JSON.parse(rawContent);
    } catch (parseErr) {
      // Try to extract JSON from the response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decomposition = JSON.parse(jsonMatch[0]);
      } else {
        console.error("[structural-decomposition] Failed to parse:", rawContent.slice(0, 500));
        throw new Error("Failed to parse decomposition response");
      }
    }

    // Ensure mode is set
    decomposition.mode = mode;

    console.log(`[structural-decomposition] ${mode} decomposition complete — ${JSON.stringify(decomposition).length} bytes`);

    return new Response(
      JSON.stringify({ success: true, decomposition }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[structural-decomposition] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
