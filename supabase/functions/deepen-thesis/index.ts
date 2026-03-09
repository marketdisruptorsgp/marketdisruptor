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
    const { structuralProfile, qualifiedPatterns, evidenceSummary, analysisType, businessContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!structuralProfile || !qualifiedPatterns || qualifiedPatterns.length === 0) {
      return new Response(JSON.stringify({ error: "structuralProfile and qualifiedPatterns are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a strategic business reconfiguration analyst. Given a structural profile of a business, qualified structural patterns, and evidence, you generate SPECIFIC, CONCRETE thesis deepenings — not generic consulting advice.

CRITICAL RULES:
1. The "reconfigurationLabel" must describe the SPECIFIC business move in plain language. Not "Infrastructure Abstraction" but "Productize internal dispatch workflow into a SaaS scheduling platform for independent plumbers."
2. The "causalChain" must trace a specific constraint to a specific outcome through a specific mechanism. No hand-waving.
3. The "economicMechanism" must describe concrete value creation — how revenue changes, what costs shift, what defensibility emerges.
4. The "firstMove" must be something a business owner can literally do next week. Not "conduct market research" but "Interview 10 repeat customers about whether they'd pay $49/mo for guaranteed same-day scheduling."
5. The "strategicBet" must articulate a genuine contrarian belief — something most people in this industry would disagree with.
6. Every field must reference specifics from the structural profile and evidence. No templated responses.

You are generating ${qualifiedPatterns.length} deepened thesis(es), one per qualified pattern.`;

    const profileSummary = [
      `Supply fragmentation: ${structuralProfile.supplyFragmentation}`,
      `Margin structure: ${structuralProfile.marginStructure}`,
      `Switching costs: ${structuralProfile.switchingCosts}`,
      `Distribution control: ${structuralProfile.distributionControl}`,
      `Labor intensity: ${structuralProfile.laborIntensity}`,
      `Revenue model: ${structuralProfile.revenueModel}`,
      `Customer concentration: ${structuralProfile.customerConcentration}`,
      `Asset utilization: ${structuralProfile.assetUtilization}`,
      `Regulatory sensitivity: ${structuralProfile.regulatorySensitivity}`,
      `Value chain position: ${structuralProfile.valueChainPosition}`,
      structuralProfile.etaActive ? `ETA Active: owner dependency=${structuralProfile.ownerDependency}, acquisition complexity=${structuralProfile.acquisitionComplexity}, improvement runway=${structuralProfile.improvementRunway}` : null,
      `Binding constraints: ${structuralProfile.bindingConstraints.map((bc: any) => `${bc.constraintName}: ${bc.explanation}`).join("; ")}`,
    ].filter(Boolean).join("\n");

    const patternsSummary = qualifiedPatterns.map((qp: any) => [
      `Pattern: ${qp.pattern.name} (${qp.pattern.id})`,
      `Transformation: ${qp.pattern.transformation}`,
      `Mechanism: ${qp.pattern.mechanism}`,
      `Precedents: ${qp.pattern.precedents.join(", ")}`,
      `Signal density: ${qp.signalDensity}`,
      `Resolves: ${qp.qualification.resolvesConstraints.join(", ")}`,
      `Strength signals: ${qp.qualification.strengthSignals.join("; ")}`,
      `Strategic bet — Industry assumes: "${qp.strategicBet.industryAssumption}" | Contrarian belief: "${qp.strategicBet.contrarianBelief}"`,
    ].join("\n")).join("\n---\n");

    const userPrompt = `STRUCTURAL PROFILE:
${profileSummary}

QUALIFIED PATTERNS:
${patternsSummary}

BUSINESS CONTEXT:
Type: ${analysisType || "product"}
${businessContext || "No additional context."}

EVIDENCE SUMMARY (top signals):
${(evidenceSummary || []).slice(0, 25).map((e: any) => `- [${e.type}] ${e.label}${e.description ? ": " + e.description.slice(0, 150) : ""}`).join("\n")}

Generate one deepened thesis per qualified pattern. Return ONLY the JSON array.`;

    // Use tool calling for structured output
    const tools = [
      {
        type: "function",
        function: {
          name: "return_deepened_theses",
          description: "Return the deepened thesis objects for each qualified pattern.",
          parameters: {
            type: "object",
            properties: {
              theses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    patternId: { type: "string", description: "The pattern ID (e.g. 'aggregation', 'infrastructure_abstraction')" },
                    reconfigurationLabel: { type: "string", description: "Concrete, specific business move in one sentence. NOT the pattern name." },
                    summary: { type: "string", description: "One-paragraph summary of the opportunity." },
                    causalChain: {
                      type: "object",
                      properties: {
                        constraint: { type: "string", description: "The binding constraint this resolves" },
                        driver: { type: "string", description: "Root cause behind the constraint" },
                        pattern: { type: "string", description: "The structural pattern applied" },
                        outcome: { type: "string", description: "Expected outcome if the pattern works" },
                        reasoning: { type: "string", description: "One sentence: Because X, applying Y should produce Z" },
                      },
                      required: ["constraint", "driver", "pattern", "outcome", "reasoning"],
                      additionalProperties: false,
                    },
                    strategicBet: {
                      type: "object",
                      properties: {
                        industryAssumption: { type: "string", description: "What most people in this market believe" },
                        contrarianBelief: { type: "string", description: "The contrarian bet this thesis makes" },
                        implication: { type: "string", description: "What follows if the contrarian belief is correct" },
                      },
                      required: ["industryAssumption", "contrarianBelief", "implication"],
                      additionalProperties: false,
                    },
                    economicMechanism: {
                      type: "object",
                      properties: {
                        valueCreation: { type: "string", description: "How new value is created" },
                        costStructureShift: { type: "string", description: "What changes in cost structure" },
                        revenueImplication: { type: "string", description: "New/improved revenue mechanism" },
                        defensibility: { type: "string", description: "What creates defensibility, or null" },
                      },
                      required: ["valueCreation", "costStructureShift", "revenueImplication"],
                      additionalProperties: false,
                    },
                    feasibility: {
                      type: "object",
                      properties: {
                        level: { type: "string", enum: ["achievable", "challenging", "requires_validation"] },
                        marketConditions: { type: "array", items: { type: "string" } },
                        requiredCapabilities: { type: "array", items: { type: "string" } },
                        executionRisks: { type: "array", items: { type: "string" } },
                        regulatoryConsiderations: { type: "string", description: "Regulatory notes or null" },
                      },
                      required: ["level", "marketConditions", "requiredCapabilities", "executionRisks"],
                      additionalProperties: false,
                    },
                    firstMove: {
                      type: "object",
                      properties: {
                        action: { type: "string", description: "The smallest concrete action to test this thesis — something doable THIS WEEK" },
                        learningObjective: { type: "string", description: "What you'd learn from the first move" },
                        timeframe: { type: "string", description: "e.g. '1 week', '10 days', '2 weeks'" },
                        successCriteria: { type: "string", description: "Go/no-go criteria" },
                      },
                      required: ["action", "learningObjective", "timeframe", "successCriteria"],
                      additionalProperties: false,
                    },
                    precedents: { type: "array", items: { type: "string" }, description: "2-3 real-world precedents of this structural move" },
                  },
                  required: ["patternId", "reconfigurationLabel", "summary", "causalChain", "strategicBet", "economicMechanism", "feasibility", "firstMove", "precedents"],
                  additionalProperties: false,
                },
              },
            },
            required: ["theses"],
            additionalProperties: false,
          },
        },
      },
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 150_000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "return_deepened_theses" } },
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error(`AI gateway error [${status}]:`, text);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI gateway error", details: text.slice(0, 500) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "return_deepened_theses") {
      // Fallback: try to parse content as JSON
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          return new Response(JSON.stringify({ theses: Array.isArray(parsed) ? parsed : parsed.theses || [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch {
          console.warn("Could not parse AI response as JSON:", content?.slice(0, 200));
        }
      }
      return new Response(JSON.stringify({ theses: [], fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let theses: any[];
    try {
      const parsed = JSON.parse(toolCall.function.arguments);
      theses = parsed.theses || [];
    } catch (e) {
      console.error("Failed to parse tool call arguments:", e);
      return new Response(JSON.stringify({ theses: [], fallback: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[deepen-thesis] Generated ${theses.length} AI theses for ${qualifiedPatterns.length} patterns`);

    return new Response(JSON.stringify({ theses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("deepen-thesis error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
