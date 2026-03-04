/**
 * §2 — STRUCTURED OUTPUT ENFORCEMENT
 * 
 * Tool-calling based structured output extraction.
 * Replaces free-form JSON parsing with schema-constrained generation.
 * Eliminates JSON salvage logic entirely.
 */

/**
 * Build tool-calling payload for structured governed output.
 * Uses the Lovable AI Gateway's tool_choice to force schema compliance.
 */
export function buildStructuredOutputTools(stepId: string): { tools: unknown[]; tool_choice: unknown } | null {
  const schema = GOVERNED_SCHEMAS[stepId];
  if (!schema) return null;

  return {
    tools: [{
      type: "function",
      function: {
        name: `produce_${stepId.replace(/-/g, "_")}_output`,
        description: `Generate the complete structured analysis output for the ${stepId} step, including all governed reasoning artifacts.`,
        parameters: schema,
      },
    }],
    tool_choice: {
      type: "function",
      function: { name: `produce_${stepId.replace(/-/g, "_")}_output` },
    },
  };
}

/**
 * Extract structured output from a tool-call response.
 * Returns parsed JSON or throws with detailed error.
 */
export function extractStructuredResponse(aiData: Record<string, unknown>): Record<string, unknown> {
  const choices = aiData.choices as Array<Record<string, unknown>> | undefined;
  if (!choices || choices.length === 0) {
    throw new Error("AI returned no choices");
  }

  const message = choices[0].message as Record<string, unknown> | undefined;
  if (!message) throw new Error("AI returned no message");

  // Tool call response path (structured output)
  const toolCalls = message.tool_calls as Array<Record<string, unknown>> | undefined;
  if (toolCalls && toolCalls.length > 0) {
    const fn = toolCalls[0].function as Record<string, unknown> | undefined;
    if (fn?.arguments) {
      const args = typeof fn.arguments === "string" ? fn.arguments : JSON.stringify(fn.arguments);
      try {
        return JSON.parse(args);
      } catch (e) {
        console.error("[StructuredOutput] Tool call JSON parse failed:", e);
        throw new Error("Structured output parse failed — AI returned malformed tool arguments");
      }
    }
  }

  // Fallback: standard content response (for models that don't support tool calling)
  const content = message.content as string | undefined;
  if (content) {
    return parseContentFallback(content);
  }

  throw new Error("AI returned neither tool_calls nor content");
}

/**
 * Fallback parser for standard content responses.
 * Minimal cleanup — no heuristic salvage.
 */
function parseContentFallback(raw: string): Record<string, unknown> {
  let cleaned = raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[StructuredOutput] Content fallback parse failed");
    console.error("Raw (first 500):", cleaned.slice(0, 500));
    throw new Error("AI returned invalid JSON. Please retry.");
  }
}

/**
 * Validate that a parsed response contains the minimum required governed fields.
 * Returns { valid, missing } for logging.
 */
export function validateStructuredResponse(
  response: Record<string, unknown>,
  stepId: string
): { valid: boolean; missing: string[]; truncated: boolean } {
  const governed = response.governed as Record<string, unknown> | undefined;
  const requiredByStep: Record<string, string[]> = {
    "first-principles": ["domain_confirmation", "first_principles", "friction_tiers", "constraint_map", "decision_synthesis"],
    "business-model-analysis": ["domain_confirmation", "first_principles", "friction_tiers", "constraint_map", "decision_synthesis"],
    "critical-validation": ["falsification", "decision_synthesis"],
    "generate-flip-ideas": [],
    "generate-pitch-deck": ["decision_synthesis"],
  };

  const required = requiredByStep[stepId] || [];
  if (required.length === 0) return { valid: true, missing: [], truncated: false };
  if (!governed) return { valid: false, missing: required, truncated: true };

  const missing = required.filter(f => {
    const v = governed[f];
    return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
  });

  return {
    valid: missing.length === 0,
    missing,
    truncated: missing.length > 0 && missing.length === required.length,
  };
}

// ── Governed output schemas for tool calling ──

const GOVERNED_CORE_PROPERTIES = {
  domain_confirmation: {
    type: "object",
    properties: {
      system_type: { type: "string", enum: ["product", "service", "business_model"] },
      outcome_mechanism: { type: "string" },
      success_condition: { type: "string" },
      domain_lock: { type: "boolean" },
    },
    required: ["system_type", "outcome_mechanism", "success_condition", "domain_lock"],
    additionalProperties: false,
  },
  first_principles: {
    type: "object",
    properties: {
      minimum_viable_system: { type: "string" },
      causal_model: {
        type: "object",
        properties: {
          inputs: { type: "array", items: { type: "string" } },
          mechanism: { type: "string" },
          outputs: { type: "array", items: { type: "string" } },
        },
        required: ["inputs", "mechanism", "outputs"],
        additionalProperties: false,
      },
      fundamental_constraints: { type: "array", items: { type: "string" } },
      resource_limits: { type: "array", items: { type: "string" } },
      behavioral_realities: { type: "array", items: { type: "string" } },
      dependency_structure: { type: "array", items: { type: "string" } },
      viability_assumptions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            assumption: { type: "string" },
            evidence_status: { type: "string", enum: ["verified", "modeled", "speculative"] },
            leverage_if_wrong: { type: "number" },
          },
          required: ["assumption", "evidence_status", "leverage_if_wrong"],
          additionalProperties: false,
        },
      },
    },
    required: ["minimum_viable_system", "causal_model", "fundamental_constraints", "viability_assumptions"],
    additionalProperties: false,
  },
  friction_tiers: {
    type: "object",
    properties: {
      tier_1: {
        type: "array",
        items: {
          type: "object",
          properties: {
            friction_id: { type: "string" },
            description: { type: "string" },
            system_impact: { type: "string" },
          },
          required: ["friction_id", "description", "system_impact"],
          additionalProperties: false,
        },
      },
      tier_2: {
        type: "array",
        items: {
          type: "object",
          properties: {
            friction_id: { type: "string" },
            description: { type: "string" },
            optimization_target: { type: "string" },
          },
          required: ["friction_id", "description", "optimization_target"],
          additionalProperties: false,
        },
      },
      tier_3: {
        type: "array",
        items: {
          type: "object",
          properties: {
            friction_id: { type: "string" },
            description: { type: "string" },
          },
          required: ["friction_id", "description"],
          additionalProperties: false,
        },
      },
    },
    required: ["tier_1", "tier_2", "tier_3"],
    additionalProperties: false,
  },
  constraint_map: {
    type: "object",
    properties: {
      causal_chains: {
        type: "array",
        items: {
          type: "object",
          properties: {
            friction_id: { type: "string" },
            structural_constraint: { type: "string" },
            system_impact: { type: "string" },
            impact_dimension: { type: "string", enum: ["cost", "time", "adoption", "scale", "reliability", "risk"] },
          },
          required: ["friction_id", "structural_constraint", "system_impact", "impact_dimension"],
          additionalProperties: false,
        },
      },
      binding_constraint_id: { type: "string" },
      dominance_proof: { type: "string" },
      counterfactual_removal_result: { type: "string" },
      next_binding_constraint: { type: "string" },
    },
    required: ["causal_chains", "binding_constraint_id", "dominance_proof", "counterfactual_removal_result"],
    additionalProperties: false,
  },
  decision_synthesis: {
    type: "object",
    properties: {
      decision_grade: { type: "string", enum: ["proceed", "conditional", "blocked"] },
      confidence_score: { type: "number" },
      blocking_uncertainties: { type: "array", items: { type: "string" } },
      fastest_validation_experiment: { type: "string" },
      next_required_evidence: { type: "string" },
    },
    required: ["decision_grade", "confidence_score", "blocking_uncertainties"],
    additionalProperties: false,
  },
  falsification: {
    type: "object",
    properties: {
      falsification_conditions: { type: "array", items: { type: "string" } },
      redesign_invalidation_evidence: { type: "array", items: { type: "string" } },
      adoption_failure_conditions: { type: "array", items: { type: "string" } },
      economic_collapse_scenario: { type: "string" },
      model_fragility_score: { type: "number" },
    },
    required: ["falsification_conditions", "model_fragility_score"],
    additionalProperties: false,
  },
  reasoning_synopsis: {
    type: "object",
    properties: {
      problem_framing: {
        type: "object",
        properties: {
          objective_interpretation: { type: "string" },
          success_criteria: { type: "array", items: { type: "string" } },
        },
        required: ["objective_interpretation", "success_criteria"],
        additionalProperties: false,
      },
      lens_influence: {
        type: "object",
        properties: {
          lens_name: { type: "string" },
          prioritized_factors: { type: "array", items: { type: "string" } },
          deprioritized_factors: { type: "array", items: { type: "string" } },
          alternative_lens_impact: { type: "string" },
        },
        required: ["lens_name", "prioritized_factors", "deprioritized_factors", "alternative_lens_impact"],
        additionalProperties: false,
      },
      evaluation_path: {
        type: "object",
        properties: {
          dimensions_examined: { type: "array", items: { type: "string" } },
          evaluation_logic: { type: "string" },
        },
        required: ["dimensions_examined", "evaluation_logic"],
        additionalProperties: false,
      },
      core_causal_logic: {
        type: "object",
        properties: {
          primary_relationships: {
            type: "array",
            items: {
              type: "object",
              properties: {
                cause: { type: "string" },
                effect: { type: "string" },
                mechanism: { type: "string" },
              },
              required: ["cause", "effect", "mechanism"],
              additionalProperties: false,
            },
          },
          dominant_mechanism: { type: "string" },
        },
        required: ["primary_relationships", "dominant_mechanism"],
        additionalProperties: false,
      },
      decision_drivers: {
        type: "array",
        items: {
          type: "object",
          properties: {
            factor: { type: "string" },
            weight: { type: "string", enum: ["high", "medium"] },
            rationale: { type: "string" },
          },
          required: ["factor", "weight", "rationale"],
          additionalProperties: false,
        },
      },
      confidence_sensitivity: {
        type: "object",
        properties: {
          overall_confidence: { type: "string", enum: ["high", "medium", "low"] },
          confidence_score: { type: "number" },
          most_sensitive_variable: { type: "string" },
          sensitivity_explanation: { type: "string" },
        },
        required: ["overall_confidence", "confidence_score", "most_sensitive_variable"],
        additionalProperties: false,
      },
    },
    required: ["problem_framing", "lens_influence", "evaluation_path", "core_causal_logic", "decision_drivers", "confidence_sensitivity"],
    additionalProperties: false,
  },
};

const GOVERNED_SCHEMAS: Record<string, Record<string, unknown>> = {
  // Note: These schemas define the `governed` sub-object structure.
  // The full tool schema wraps the primary analysis output + governed.
  // Since the primary output varies too much per step, we keep governed
  // as the enforced schema and let the primary output remain flexible.
  "first-principles": {
    type: "object",
    properties: {
      governed: {
        type: "object",
        properties: {
          domain_confirmation: GOVERNED_CORE_PROPERTIES.domain_confirmation,
          first_principles: GOVERNED_CORE_PROPERTIES.first_principles,
          friction_tiers: GOVERNED_CORE_PROPERTIES.friction_tiers,
          constraint_map: GOVERNED_CORE_PROPERTIES.constraint_map,
          decision_synthesis: GOVERNED_CORE_PROPERTIES.decision_synthesis,
          reasoning_synopsis: GOVERNED_CORE_PROPERTIES.reasoning_synopsis,
        },
        required: ["domain_confirmation", "first_principles", "friction_tiers", "constraint_map", "decision_synthesis", "reasoning_synopsis"],
        additionalProperties: true,
      },
    },
    required: ["governed"],
    additionalProperties: true,
  },
  "critical-validation": {
    type: "object",
    properties: {
      governed: {
        type: "object",
        properties: {
          falsification: GOVERNED_CORE_PROPERTIES.falsification,
          decision_synthesis: GOVERNED_CORE_PROPERTIES.decision_synthesis,
          reasoning_synopsis: GOVERNED_CORE_PROPERTIES.reasoning_synopsis,
        },
        required: ["falsification", "decision_synthesis", "reasoning_synopsis"],
        additionalProperties: true,
      },
    },
    required: ["governed"],
    additionalProperties: true,
  },
  "business-model-analysis": {
    type: "object",
    properties: {
      governed: {
        type: "object",
        properties: {
          domain_confirmation: GOVERNED_CORE_PROPERTIES.domain_confirmation,
          first_principles: GOVERNED_CORE_PROPERTIES.first_principles,
          friction_tiers: GOVERNED_CORE_PROPERTIES.friction_tiers,
          constraint_map: GOVERNED_CORE_PROPERTIES.constraint_map,
          decision_synthesis: GOVERNED_CORE_PROPERTIES.decision_synthesis,
          reasoning_synopsis: GOVERNED_CORE_PROPERTIES.reasoning_synopsis,
        },
        required: ["domain_confirmation", "first_principles", "friction_tiers", "constraint_map", "decision_synthesis", "reasoning_synopsis"],
        additionalProperties: true,
      },
    },
    required: ["governed"],
    additionalProperties: true,
  },
};
