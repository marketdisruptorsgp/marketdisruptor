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
    const { structuralProfile, qualifiedPatterns, evidenceSummary, analysisType, businessContext, operatorLens, strategicDirections, documentIntelligence } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!structuralProfile) {
      return new Response(JSON.stringify({ error: "structuralProfile is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Determine thesis count ──
    // With strategic directions, we generate one per direction (3-5)
    // Without, we fall back to one per qualified pattern (1-2)
    const hasDirections = strategicDirections && strategicDirections.length > 0;
    const thesisCount = hasDirections ? strategicDirections.length : (qualifiedPatterns?.length || 1);

    // ── Build Operator Lens Context ──
    const lensBlock = buildLensBlock(operatorLens);

    // ── Build Differentiation Bias ──
    const differentiationBias = buildDifferentiationBias(structuralProfile, operatorLens);

    // ── Build Directions Block ──
    const directionsBlock = hasDirections ? buildDirectionsBlock(strategicDirections) : "";

    const systemPrompt = `You are a strategic business reconfiguration analyst. Given a structural profile of a business, you generate SPECIFIC, CONCRETE strategic opportunities — not generic consulting advice.

You must generate ${thesisCount} distinct strategic opportunities, each representing a STRUCTURALLY DIFFERENT path the business could take.

${hasDirections ? `Each opportunity corresponds to a strategic direction category provided below. Your job is to make each direction SPECIFIC and CONCRETE for this particular business.` : `Generate one thesis per qualified pattern.`}

CRITICAL RULES:
1. The "reconfigurationLabel" must describe the SPECIFIC business move in plain language. Not "Infrastructure Abstraction" but "Productize internal dispatch workflow into a SaaS scheduling platform for independent plumbers."
2. The "causalChain" must trace a specific constraint to a specific outcome through a specific mechanism.
3. The "economicMechanism" must describe concrete value creation — how revenue changes, what costs shift, what defensibility emerges.
4. The "firstMove" must be something a business owner can literally do next week.
5. The "strategicBet" must articulate a genuine contrarian belief — something most people in this industry would disagree with.
6. Every field must reference specifics from the structural profile and evidence.
7. Each opportunity must be STRUCTURALLY DISTINCT — different strategic paths, not variations of the same idea.

REQUIRED OUTPUT LAYERS — Every thesis MUST include these:

A) "whyThisMatters" — For the constraint this opportunity addresses:
   - "implications": 3-4 bullet points explaining BUSINESS CONSEQUENCES of the constraint. Write as a strategic advisor would to a founder. Focus on growth limits, margin pressure, competitive vulnerability.
   - "ifSolved": 3-4 bullet points describing what changes if the constraint is resolved. Focus on new capabilities unlocked, margin expansion, scalability.

B) "strategicPrecedents" — 2-3 REAL companies that executed a structurally similar move:
   - "company": Real company name (must be a real company)
   - "description": One sentence explaining what they did that's analogous
   - "pattern": The strategic pattern name (e.g. "platformization", "workflow automation", "marketplace creation")

C) "secondOrderEffects" — 3-5 downstream consequences if this strategic move succeeds:
   - How the move reshapes the market position over time
   - Network effects, switching costs, data advantages, ecosystem lock-in
   - How competitors or customers are affected
   - Write as strategic implications, not features

STRATEGIC REASONING LENSES — Use these to generate non-obvious insights:
1. CROSS-INDUSTRY ANALOGS: What companies in DIFFERENT industries solved a structurally similar constraint?
2. CONSTRAINT INVERSIONS: Can the binding constraint itself become a competitive advantage?
3. SECOND-ORDER EFFECTS: If this constraint were resolved, what NEW capability becomes accessible?
4. TEMPORAL ARBITRAGE: What recent changes make a previously impossible move now viable?
5. NEGATIVE SPACE: What is NO competitor doing? Why? Is the reason structural or assumed?
6. THREE-LENS MANDATE: Evaluate through: (a) structural viability, (b) economic mechanism, (c) operator execution capacity.

DIFFERENTIATION MANDATE:
${differentiationBias}

${lensBlock}

${directionsBlock}`;

    const profileSummary = buildProfileSummary(structuralProfile);
    const patternsSummary = qualifiedPatterns?.length > 0 ? buildPatternsSummary(qualifiedPatterns) : "No qualified structural patterns (using strategic directions instead).";

    const userPrompt = `STRUCTURAL PROFILE:
${profileSummary}

${qualifiedPatterns?.length > 0 ? `QUALIFIED STRUCTURAL PATTERNS:\n${patternsSummary}\n` : ""}
BUSINESS CONTEXT:
Type: ${analysisType || "product"}
${businessContext || "No additional context."}

EVIDENCE SUMMARY (top signals):
${(evidenceSummary || []).slice(0, 25).map((e: any) => `- [${e.type}] ${e.label}${e.description ? ": " + e.description.slice(0, 150) : ""}`).join("\n")}

Generate ${thesisCount} deepened strategic opportunities. Each must be specific to THIS business and structurally distinct from the others. Return ONLY the JSON via the tool call.`;

    const tools = [buildToolSchema()];

    // Model cascade: try cheaper models first, fall back to Pro only if needed
    const MODEL_CASCADE = [
      "google/gemini-2.5-flash",
      "google/gemini-2.5-pro",
    ];

    let response: Response | null = null;
    let lastError = "";

    for (const model of MODEL_CASCADE) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 150_000);

      try {
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            tools,
            tool_choice: { type: "function", function: { name: "return_deepened_theses" } },
            temperature: 0.4,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(`[deepen-thesis] Success with model: ${model}`);
          break;
        }

        const status = response.status;
        const text = await response.text();
        lastError = text;
        console.warn(`[deepen-thesis] Model ${model} failed [${status}]: ${text.slice(0, 200)}`);

        if (status === 402) {
          // Credits exhausted — try next model (might be cheaper), or return fallback
          console.warn(`[deepen-thesis] 402 on ${model}, trying next model...`);
          response = null;
          continue;
        }
        if (status === 429) {
          // Rate limited — try next model
          response = null;
          continue;
        }
        // Other errors — try next model
        response = null;
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.warn(`[deepen-thesis] Fetch error with ${model}:`, fetchErr);
        response = null;
      }
    }

    // If all models failed, return graceful fallback instead of error status
    if (!response || !response.ok) {
      console.error("[deepen-thesis] All models failed, returning fallback signal");
      return new Response(JSON.stringify({ theses: [], fallback: true, reason: "all_models_failed", details: lastError.slice(0, 300) }), {
        status: 200, // Return 200 so client can use deterministic fallback
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Defensively read response body
    let rawText: string;
    try {
      rawText = await response.text();
    } catch (readErr) {
      console.error("Failed to read response body:", readErr);
      return new Response(JSON.stringify({ theses: [], fallback: true, reason: "response_read_failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (jsonErr) {
      console.error("Failed to parse AI response JSON. Raw length:", rawText.length);
      return new Response(JSON.stringify({ theses: [], fallback: true, reason: "truncated_response" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "return_deepened_theses") {
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
    const argsStr = toolCall.function.arguments;
    try {
      const parsed = JSON.parse(argsStr);
      theses = parsed.theses || [];
    } catch (e) {
      console.warn("Tool call JSON parse failed, attempting recovery. Args length:", argsStr?.length);
      try {
        const recovered = parseWithRecovery(argsStr);
        theses = (recovered as any).theses || (Array.isArray(recovered) ? recovered : []);
        console.warn(`[deepen-thesis] Recovered ${theses.length} theses from truncated tool call`);
      } catch (recoveryErr) {
        console.error("Tool call JSON recovery also failed:", recoveryErr);
        return new Response(JSON.stringify({ theses: [], fallback: true, reason: "truncated_tool_call" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`[deepen-thesis] Generated ${theses.length} AI theses (requested ${thesisCount})`);

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

// ═══════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function buildDirectionsBlock(directions: any[]): string {
  if (!directions || directions.length === 0) return "";

  const lines = [
    "\nSTRATEGIC DIRECTION CATEGORIES — Generate one opportunity per direction below.",
    "Each direction represents a structurally distinct strategic path. Make each one SPECIFIC to this business.\n",
  ];

  for (const dir of directions) {
    const strength = dir.relevanceScore >= 6 ? "HIGH relevance" : dir.relevanceScore >= 3 ? "MODERATE relevance" : "EXPLORATORY";
    lines.push(`### ${dir.label?.toUpperCase() || dir.id?.toUpperCase()} [${strength}]`);
    lines.push(dir.description || "");
    if (dir.aiPromptHint) lines.push(`AI TASK: ${dir.aiPromptHint}`);
    lines.push(`Direction ID: ${dir.id}`);
    lines.push("");
  }

  lines.push("IMPORTANT: Generate one thesis per direction. Each must be structurally distinct — NOT variations of the same idea.");
  lines.push("If a direction truly doesn't apply to this business, still generate the best version you can — the user needs multiple options.");
  lines.push("Set the 'directionId' field to match the direction ID above.");

  return lines.join("\n");
}

function buildLensBlock(operatorLens: any): string {
  if (!operatorLens) return "";

  const parts: string[] = [`\nOPERATOR LENS — "${operatorLens.name || "Custom"}"`];

  if (operatorLens.lensType === "eta") {
    parts.push(`This operator is evaluating acquisition. Frame all recommendations as actions a new owner-operator could take within ${operatorLens.time_horizon || "3 years"}.`);
    parts.push("Do NOT default to AI/technology solutions. Prioritize: process improvement → pricing/positioning → structural model change → operational optimization → technology (only if justified).");
    parts.push("Distinguish quick wins (0-6 months), medium-term plays (6-18 months), and structural changes (18+ months).");
  }

  if (operatorLens.primary_objective) parts.push(`Primary Objective: ${operatorLens.primary_objective}`);
  if (operatorLens.target_outcome) parts.push(`Target Outcome: ${operatorLens.target_outcome}`);
  if (operatorLens.risk_tolerance) parts.push(`Risk Tolerance: ${operatorLens.risk_tolerance}`);
  if (operatorLens.time_horizon) parts.push(`Time Horizon: ${operatorLens.time_horizon}`);
  if (operatorLens.available_resources) parts.push(`Available Resources: ${operatorLens.available_resources}`);
  if (operatorLens.constraints) parts.push(`Operator Constraints: ${operatorLens.constraints}`);

  if (operatorLens.evaluation_priorities && typeof operatorLens.evaluation_priorities === "object") {
    const priorities = Object.entries(operatorLens.evaluation_priorities)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([k, v]) => `${k.replace(/_/g, " ")}=${v}`)
      .join(", ");
    parts.push(`Priority Weights: ${priorities}`);
  }

  parts.push("\nCRITICAL: The operator's lens MUST shape the thesis. Two operators in the same market with different assets, goals, or constraints should receive completely different strategic recommendations.");

  return parts.join("\n");
}

function buildDifferentiationBias(structuralProfile: any, operatorLens: any): string {
  const hasLens = operatorLens && (operatorLens.constraints || operatorLens.available_resources);
  
  const parts = [
    "Before finalizing each thesis, apply this test: 'Would most competitors in this exact industry benefit equally from this same strategy?'",
    "If YES → the strategy is GENERIC. Reject it and generate a more specific alternative that depends on:",
  ];

  if (hasLens) {
    parts.push("  - This specific operator's assets, relationships, or capabilities");
    parts.push("  - This operator's unique constraints (which competitors may not share)");
  }

  parts.push("  - A specific structural constraint that is NOT universal to the industry");
  parts.push("  - A contrarian belief that most industry participants would actively disagree with");
  parts.push("  - A mechanism that creates defensibility through structural position, not just execution speed");
  parts.push("");
  parts.push("BANNED GENERIC STRATEGIES (never recommend these without extreme specificity):");
  parts.push("  - 'Start a subscription model' (unless you can explain WHY customers would switch from transactional)");
  parts.push("  - 'Build a marketplace/platform' (unless you can identify the specific supply-side aggregation mechanism)");
  parts.push("  - 'Add AI/automation' (unless you can identify the specific manual process AND why competitors haven't already done this)");
  parts.push("  - 'Expand to adjacent markets' (unless you can identify the structural advantage that transfers)");
  parts.push("  - 'Improve customer experience' (this is a tactic, not a strategy)");

  return parts.join("\n");
}

function buildProfileSummary(sp: any): string {
  return [
    `Supply fragmentation: ${sp.supplyFragmentation}`,
    `Margin structure: ${sp.marginStructure}`,
    `Switching costs: ${sp.switchingCosts}`,
    `Distribution control: ${sp.distributionControl}`,
    `Labor intensity: ${sp.laborIntensity}`,
    `Revenue model: ${sp.revenueModel}`,
    `Customer concentration: ${sp.customerConcentration}`,
    `Asset utilization: ${sp.assetUtilization}`,
    `Regulatory sensitivity: ${sp.regulatorySensitivity}`,
    `Value chain position: ${sp.valueChainPosition}`,
    sp.etaActive ? `ETA Active: owner dependency=${sp.ownerDependency}, acquisition complexity=${sp.acquisitionComplexity}, improvement runway=${sp.improvementRunway}` : null,
    `Binding constraints: ${sp.bindingConstraints.map((bc: any) => `${bc.constraintName}: ${bc.explanation}`).join("; ")}`,
  ].filter(Boolean).join("\n");
}

function buildPatternsSummary(qualifiedPatterns: any[]): string {
  return qualifiedPatterns.map((qp: any) => [
    `Pattern: ${qp.pattern.name} (${qp.pattern.id})`,
    `Transformation: ${qp.pattern.transformation}`,
    `Mechanism: ${qp.pattern.mechanism}`,
    `Precedents: ${qp.pattern.precedents.join(", ")}`,
    `Signal density: ${qp.signalDensity}`,
    `Resolves: ${qp.qualification.resolvesConstraints.join(", ")}`,
    `Strength signals: ${qp.qualification.strengthSignals.join("; ")}`,
    `Strategic bet — Industry assumes: "${qp.strategicBet.industryAssumption}" | Contrarian belief: "${qp.strategicBet.contrarianBelief}"`,
  ].join("\n")).join("\n---\n");
}

function buildToolSchema() {
  return {
    type: "function",
    function: {
      name: "return_deepened_theses",
      description: "Return the deepened thesis objects — one per strategic direction or qualified pattern.",
      parameters: {
        type: "object",
        properties: {
          theses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                patternId: { type: "string", description: "The pattern ID or direction ID (e.g. 'aggregation', 'automate', 'platformize')" },
                directionId: { type: "string", description: "The strategic direction category ID (e.g. 'automate', 'platformize', 'go_direct'). Required when strategic directions are provided." },
                reconfigurationLabel: { type: "string", description: "Concrete, specific business move in one sentence. NOT the pattern name. Must be unique to this operator." },
                summary: { type: "string", description: "One-paragraph summary of the opportunity." },
                causalChain: {
                  type: "object",
                  properties: {
                    constraint: { type: "string", description: "The binding constraint this resolves" },
                    driver: { type: "string", description: "Root cause behind the constraint" },
                    pattern: { type: "string", description: "The structural pattern or direction applied" },
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
                whyThisMatters: {
                  type: "object",
                  properties: {
                    implications: { type: "array", items: { type: "string" }, description: "3-4 business consequences of the constraint. Plain language, strategic advisor tone." },
                    ifSolved: { type: "array", items: { type: "string" }, description: "3-4 outcomes if the constraint is resolved. Focus on new capabilities and margin expansion." },
                  },
                  required: ["implications", "ifSolved"],
                  additionalProperties: false,
                },
                strategicPrecedents: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      company: { type: "string", description: "Real company name" },
                      description: { type: "string", description: "One sentence: what they did that's analogous" },
                      pattern: { type: "string", description: "Strategic pattern name (e.g. platformization, marketplace creation)" },
                    },
                    required: ["company", "description", "pattern"],
                    additionalProperties: false,
                  },
                  description: "2-3 real companies that executed a structurally similar move",
                },
                secondOrderEffects: { type: "array", items: { type: "string" }, description: "3-5 downstream market consequences if this move succeeds" },
              },
              required: ["patternId", "reconfigurationLabel", "summary", "causalChain", "strategicBet", "economicMechanism", "feasibility", "firstMove", "precedents", "whyThisMatters", "strategicPrecedents", "secondOrderEffects"],
              additionalProperties: false,
            },
          },
        },
        required: ["theses"],
        additionalProperties: false,
      },
    },
  };
}

/** Attempt to recover a truncated JSON response */
function parseWithRecovery(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const thesesStart = content.indexOf('"theses"');
    if (thesesStart > 0) {
      const lastBrace = content.lastIndexOf("}");
      if (lastBrace > thesesStart) {
        const candidates = [
          content.substring(0, lastBrace + 1) + "]}",
          content.substring(0, lastBrace + 1) + "]",
        ];
        for (const candidate of candidates) {
          try {
            return JSON.parse(candidate);
          } catch {
            // try next
          }
        }
      }
    }
    throw new Error("Cannot repair truncated JSON");
  }
}
