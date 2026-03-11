/**
 * STRUCTURAL DECOMPOSITION — True first-principles primitive extraction + system dynamics + leverage analysis
 *
 * Decomposes a product, service, or business model into its irreducible
 * structural primitives, system dynamics, AND leverage analysis BEFORE any pattern recognition.
 *
 * Structural Primitives: static components, costs, constraints
 * System Dynamics: failure modes, feedback loops, bottlenecks, control points, substitution paths
 * Leverage Analysis: dependency graph + ranked leverage primitives
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

// ── SYSTEM DYNAMICS SCHEMA (shared across all modes) ──

const SYSTEM_DYNAMICS_SCHEMA = `"systemDynamics": {
    "failureModes": [
      {
        "id": "fm_1",
        "component": "Which structural primitive fails (reference a component/task/resource above)",
        "mode": "How it fails — the specific failure mechanism",
        "cascadeEffect": "What breaks downstream when this fails",
        "frequency": "rare|occasional|frequent",
        "detectability": "obvious|hidden|delayed"
      }
    ],
    "feedbackLoops": [
      {
        "id": "fl_1",
        "name": "Name of the feedback loop",
        "type": "reinforcing|balancing",
        "components": ["id_1", "id_2"],
        "mechanism": "How the loop works — what reinforces or balances what",
        "strength": "weak|moderate|strong"
      }
    ],
    "bottlenecks": [
      {
        "id": "bn_1",
        "location": "Which primitive or process is the bottleneck",
        "throughputLimit": "What is the throughput ceiling and in what units",
        "cause": "Root cause of the bottleneck",
        "workaround": "Current workaround if any, or 'none'"
      }
    ],
    "controlPoints": [
      {
        "id": "cp_1",
        "point": "What is controlled or gatekept",
        "leverageType": "gatekeeping|pricing|quality|access|information",
        "controller": "Who or what controls this point",
        "switchability": "locked|negotiable|open"
      }
    ],
    "substitutionPaths": [
      {
        "id": "sp_1",
        "target": "Which primitive could be replaced",
        "substitute": "What could replace it",
        "feasibility": "ready|emerging|theoretical",
        "tradeoff": "What you gain and lose from the substitution"
      }
    ]
  }`;

// ── LEVERAGE ANALYSIS SCHEMA (shared across all modes) ──

const LEVERAGE_ANALYSIS_SCHEMA = `"leverageAnalysis": {
    "dependencyGraph": [
      {
        "from": "primitive_id (source)",
        "to": "primitive_id (target)",
        "relationship": "depends_on|enables|constrains|feeds"
      }
    ],
    "leveragePrimitives": [
      {
        "primitiveId": "id of the structural primitive this references",
        "primitiveLabel": "Human-readable label of the primitive",
        "bindingStrength": 8,
        "cascadeReach": 7,
        "challengeability": 6,
        "leverageScore": 7.2,
        "bestTransformation": "elimination|substitution|reordering|aggregation",
        "reasoning": "Why this is a high-leverage target — what breaks or improves if you change it"
      }
    ]
  }`;

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
  ],
  ${SYSTEM_DYNAMICS_SCHEMA},
  ${LEVERAGE_ANALYSIS_SCHEMA}
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
  ],
  ${SYSTEM_DYNAMICS_SCHEMA},
  ${LEVERAGE_ANALYSIS_SCHEMA}
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
  ],
  ${SYSTEM_DYNAMICS_SCHEMA},
  ${LEVERAGE_ANALYSIS_SCHEMA}
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

      // Patent + Trend data for temporal leverage scoring
      if (upstreamIntel.patentLandscape || upstreamIntel.patentData) {
        const patents = upstreamIntel.patentLandscape || upstreamIntel.patentData;
        intelParts.push(`Patent Intelligence: ${JSON.stringify(patents).slice(0, 1500)}`);
        intelParts.push(`INSTRUCTION: Use patent expiration dates and IP gaps to adjust challengeability scores. Primitives protected by expiring patents should have HIGHER challengeability.`);
      }
      if (upstreamIntel.trendAnalysis) {
        intelParts.push(`Market Trends: ${JSON.stringify(upstreamIntel.trendAnalysis).slice(0, 1000)}`);
        intelParts.push(`INSTRUCTION: Use trend momentum to adjust challengeability. Primitives aligned with growing trends have HIGHER challengeability. Declining trends reduce it.`);
      }

      if (intelParts.length > 0) contextBlock += `\n\nUpstream Intelligence:\n${intelParts.join("\n")}`;
    }

    const systemPrompt = `You are a structural decomposition engine. Your job is to decompose a ${modeLabel} into THREE layers:
1. STRUCTURAL PRIMITIVES — the irreducible static components of the system
2. SYSTEM DYNAMICS — how those components interact, fail, and evolve over time
3. LEVERAGE ANALYSIS — which primitives have the highest disruption potential and why

CRITICAL RULES:
- You are performing DECOMPOSITION, not analysis. Break the system into its fundamental parts, map how they behave, then RANK which parts matter most.
- Every primitive must be SPECIFIC to this exact ${modeLabel.toLowerCase()}, not generic.
- Do NOT suggest improvements, opportunities, or changes. Only describe what EXISTS and which parts are highest-leverage.
- Do NOT use placeholder text. Every field must contain real, specific information.
- Components must be genuinely irreducible — if it can be broken down further, break it down.
- Use real technology names, real material names, real cost categories.
- Ground everything in the actual entity provided.

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

SYSTEM DYNAMICS MANDATE (REQUIRED for all modes):
- failureModes: How does each critical component FAIL? What cascades when it does? How detectable is the failure?
- feedbackLoops: What reinforcing loops accelerate growth or decline? What balancing loops maintain equilibrium? Reference specific component IDs.
- bottlenecks: Where does throughput hit a ceiling? What causes it? What workarounds exist?
- controlPoints: Who or what gatekeeps critical resources, pricing, quality, access, or information? How locked-in are they?
- substitutionPaths: Which primitives could be replaced with alternatives? What's the feasibility and tradeoff?
- Generate at least 2-3 items per dynamics category. These must reference SPECIFIC structural primitives from above.

LEVERAGE ANALYSIS MANDATE (REQUIRED for all modes):
- dependencyGraph: Map how structural primitives depend on each other. Use actual IDs from the primitives above. Show at least 8-12 edges.
- leveragePrimitives: Rank the 5-8 highest-leverage primitives using these three factors:
  * bindingStrength (1-10): How tightly this constraint locks the system
  * cascadeReach (1-10): How many downstream components break if this changes
  * challengeability (1-10): Whether technology/economics make change feasible NOW
  * leverageScore = (bindingStrength × 0.4) + (cascadeReach × 0.4) + (challengeability × 0.2)
- For each leverage primitive, identify the BEST transformation type:
  * elimination — remove the component entirely
  * substitution — replace with a different mechanism (mechanical→digital, manual→automated)
  * reordering — change the sequence or timing
  * aggregation — combine multiple components into one
- Sort leveragePrimitives by leverageScore descending (highest first).

Respond ONLY with a single valid JSON object matching this schema:
${schema}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Decompose this ${modeLabel.toLowerCase()} into its structural primitives, system dynamics, AND leverage analysis:\n${contextBlock}` },
        ],
        temperature: 0.3,
        max_tokens: 8000,
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
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        decomposition = JSON.parse(jsonMatch[0]);
      } else {
        console.error("[structural-decomposition] Failed to parse:", rawContent.slice(0, 500));
        throw new Error("Failed to parse decomposition response");
      }
    }

    // Ensure mode is set and systemDynamics exists
    decomposition.mode = mode;
    if (!decomposition.systemDynamics) {
      decomposition.systemDynamics = {
        failureModes: [],
        feedbackLoops: [],
        bottlenecks: [],
        controlPoints: [],
        substitutionPaths: [],
      };
    }

    // Ensure leverageAnalysis exists with defaults
    if (!decomposition.leverageAnalysis) {
      decomposition.leverageAnalysis = {
        dependencyGraph: [],
        leveragePrimitives: [],
      };
    }
    if (!decomposition.leverageAnalysis.dependencyGraph) {
      decomposition.leverageAnalysis.dependencyGraph = [];
    }
    if (!decomposition.leverageAnalysis.leveragePrimitives) {
      decomposition.leverageAnalysis.leveragePrimitives = [];
    }

    // Sort leverage primitives by score descending
    decomposition.leverageAnalysis.leveragePrimitives.sort(
      (a: any, b: any) => (b.leverageScore || 0) - (a.leverageScore || 0)
    );

    const dynamicsCount = (decomposition.systemDynamics.failureModes?.length || 0) +
      (decomposition.systemDynamics.feedbackLoops?.length || 0) +
      (decomposition.systemDynamics.bottlenecks?.length || 0) +
      (decomposition.systemDynamics.controlPoints?.length || 0) +
      (decomposition.systemDynamics.substitutionPaths?.length || 0);

    console.log(`[structural-decomposition] ${mode} decomposition complete — ${JSON.stringify(decomposition).length} bytes, dynamics: ${dynamicsCount} items, leverage: ${decomposition.leverageAnalysis.leveragePrimitives.length} primitives, deps: ${decomposition.leverageAnalysis.dependencyGraph.length} edges`);

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
