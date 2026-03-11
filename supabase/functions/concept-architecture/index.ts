/**
 * CONCEPT ARCHITECTURE — Generates redesignedConcept from viable transformations and clusters.
 * Split from first-principles-analysis for focused concept generation with lower token usage.
 * Receives pre-filtered transformations (viability gate already enforced by orchestrator).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveMode, getModeGuardPrompt } from "../_shared/modeEnforcement.ts";
import { getReasoningFramework } from "../_shared/reasoningFramework.ts";
import { enforceVisualContract } from "../_shared/visualFallback.ts";
import { extractStructuredResponse } from "../_shared/structuredOutput.ts";
import { buildLensPrompt } from "../_shared/lensPrompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      product,
      viableTransformations,
      allClusters,
      hiddenAssumptions,
      flippedLogic,
      governedContext,
      decomposition,
      lens,
      // Curation context
      insightPreferences,
      userScores,
      steeringText,
    } = await req.json();

    const mode = resolveMode(undefined, product.category);
    const isService = mode === "service";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const modeGuard = getModeGuardPrompt(mode);

    // ── Build curation prompt from user preferences ──
    let curationPrompt = "";
    if (insightPreferences || userScores || steeringText) {
      const parts: string[] = [];
      parts.push("\n\n--- USER CURATION CONTEXT ---");
      parts.push("The user has reviewed the analysis and provided preferences. PRIORITIZE their inputs:");
      if (steeringText) parts.push(`\nUSER GUIDANCE: "${steeringText}"`);
      if (insightPreferences) {
        const liked = Object.entries(insightPreferences).filter(([, v]) => v === "liked").map(([k]) => k);
        const dismissed = Object.entries(insightPreferences).filter(([, v]) => v === "dismissed").map(([k]) => k);
        if (liked.length > 0) parts.push(`\nUSER LIKED (emphasize): ${liked.join(", ")}`);
        if (dismissed.length > 0) parts.push(`\nUSER DISMISSED (de-prioritize): ${dismissed.join(", ")}`);
      }
      if (userScores && Object.keys(userScores).length > 0) {
        parts.push("\nUSER-ADJUSTED SCORES:");
        for (const [ideaId, scores] of Object.entries(userScores)) {
          const scoreStr = Object.entries(scores as Record<string, number>).map(([k, v]) => `${k}:${v}`).join(", ");
          parts.push(`  ${ideaId}: ${scoreStr}`);
        }
      }
      parts.push("\nBuild the redesigned concept around the user's preferred directions.");
      curationPrompt = parts.join("\n");
    }

    // ── Governed context prompt ──
    let governedPrompt = "";
    if (governedContext) {
      const parts: string[] = [];
      if (governedContext.reasoning_synopsis?.core_causal_logic?.dominant_mechanism) {
        parts.push(`DOMINANT MECHANISM: ${governedContext.reasoning_synopsis.core_causal_logic.dominant_mechanism}`);
      }
      if (governedContext.constraint_map?.binding_constraint_id) {
        parts.push(`BINDING CONSTRAINT: ${governedContext.constraint_map.binding_constraint_id} — ${governedContext.constraint_map.dominance_proof || ""}`);
      }
      if (parts.length > 0) {
        governedPrompt = "\n\nGOVERNED REASONING CONTEXT:\n" + parts.join("\n");
      }
    }

    const conceptSchema = isService
      ? `{
  "redesignedConcept": {
    "conceptName": "Short punchy name for the reinvented service",
    "tagline": "One sentence tagline",
    "coreInsight": "The central service truth this is built around (2-3 sentences)",
    "radicalDifferences": ["Key difference 1", "Key difference 2", "Key difference 3", "Key difference 4"],
    "physicalDescription": "Vivid description of the service experience",
    "sizeAndWeight": "Service scope and commitment level",
    "materials": ["Key capability 1", "Key capability 2", "Key capability 3"],
    "smartFeatures": ["Tech/automation feature 1", "Smart feature 2", "Smart feature 3"],
    "userExperienceTransformation": "The before and after journey",
    "frictionEliminated": ["Friction 1 eliminated", "Friction 2 eliminated"],
    "whyItHasntBeenDone": "Specific blockers",
    "biggestRisk": "The single most likely failure point and mitigation",
    "manufacturingPath": "Specific implementation path",
    "pricePoint": "Target pricing model",
    "targetUser": "Not a demographic — a specific human moment or need",
    "riskLevel": "[Risk: Low/Medium/High]",
    "capitalRequired": "[Capital: Low/Medium/High]"
  },
  "visualSpecs": [
    {
      "visual_type": "constraint_map | causal_chain | leverage_hierarchy",
      "title": "Short title",
      "nodes": [{ "id": "id", "label": "Label", "type": "constraint|effect|leverage|intervention|outcome", "priority": 1 }],
      "edges": [{ "from": "src", "to": "tgt", "relationship": "causes|relaxed_by|implemented_by|produces", "label": "optional" }],
      "layout": "linear | vertical | hierarchical",
      "interpretation": "One sentence"
    }
  ],
  "actionPlans": [
    {
      "initiative": "Name",
      "objective": "Goal",
      "leverage_type": "optimization | structural_improvement | redesign",
      "mechanism": "How",
      "complexity": "low | medium | high",
      "time_horizon": "near_term | mid_term | long_term",
      "risk": { "execution": "risk", "adoption": "risk", "market": "risk" },
      "validation": "MVP test",
      "decision_readiness": 3,
      "confidence": "high | medium | exploratory"
    }
  ]
}`
      : `{
  "redesignedConcept": {
    "conceptName": "Short punchy name",
    "tagline": "One sentence tagline",
    "coreInsight": "The central design truth (2-3 sentences)",
    "radicalDifferences": ["Key difference 1", "Key difference 2", "Key difference 3", "Key difference 4"],
    "physicalDescription": "Vivid description of form, size, weight, texture, how it's held and used",
    "sizeAndWeight": "Exact proposed dimensions and weight with justification",
    "materials": ["Material 1 with reason", "Material 2", "Material 3"],
    "smartFeatures": ["Smart/tech feature 1", "Smart feature 2", "Smart feature 3"],
    "userExperienceTransformation": "The before and after journey",
    "frictionEliminated": ["Friction 1 eliminated", "Friction 2 eliminated"],
    "whyItHasntBeenDone": "Specific blockers",
    "biggestRisk": "Single most likely failure point and mitigation",
    "manufacturingPath": "Specific suppliers, processes, country, cost estimate",
    "pricePoint": "Target retail price and justification",
    "targetUser": "Not a demographic — a specific human moment or identity",
    "riskLevel": "[Risk: Low/Medium/High]",
    "capitalRequired": "[Capital: Low/Medium/High]"
  },
  "visualSpecs": [
    {
      "visual_type": "constraint_map | causal_chain | leverage_hierarchy",
      "title": "Short title",
      "nodes": [{ "id": "id", "label": "Label", "type": "constraint|effect|leverage|intervention|outcome", "priority": 1 }],
      "edges": [{ "from": "src", "to": "tgt", "relationship": "causes|relaxed_by|implemented_by|produces", "label": "optional" }],
      "layout": "linear | vertical | hierarchical",
      "interpretation": "One sentence"
    }
  ],
  "actionPlans": [
    {
      "initiative": "Name",
      "objective": "Goal",
      "leverage_type": "optimization | structural_improvement | redesign",
      "mechanism": "How",
      "complexity": "low | medium | high",
      "time_horizon": "near_term | mid_term | long_term",
      "risk": { "execution": "risk", "adoption": "risk", "market": "risk" },
      "validation": "MVP test",
      "decision_readiness": 3,
      "confidence": "high | medium | exploratory"
    }
  ]
}`;

    const systemPrompt = `You are Market Disruptor OS — a concept architecture generator by SGP Capital.
${getReasoningFramework()}
${modeGuard}

Your mission: Given structural transformations that have PASSED viability testing and their clustering into coherent strategies, generate a detailed redesigned concept that implements the winning transformation cluster.

The transformations below have been filtered through a viability gate (technical, economic, regulatory, behavioral). Only viable transformations reach you.

CRITICAL RULES:
- The redesigned concept must DIRECTLY implement transformations from the clusters provided
- It must be STRUCTURALLY different from the current product/service — not a feature add
- Every claim must have an operational mechanism and implementation path
- ${isService ? "The concept must be implementable within 12-18 months" : "The concept must be manufacturable within 2-3 years"}
- ${isService ? "" : "BOM BREAKDOWN: Include a detailed bill-of-materials with per-component cost at 10K units"}
- ${isService ? "" : "CERTIFICATIONS: Name specific industry certifications required and the path to getting them"}
- ${isService ? "" : "PROTOTYPE PATH: Describe how to build the first working prototype (materials, tools, methods)"}
- ${isService ? "" : "DFM: Include design-for-manufacturability notes (draft angles, wall thickness, assembly)"}
- ${isService ? "" : "PRODUCT PRECEDENTS: Cite 2-3 REAL product innovations that prove key mechanisms work (NOT business model analogs)"}
- ${isService ? "VALIDATION: Reference real analogous services if possible" : "VALIDATION: Reference real product innovations, NOT business model plays (no 'Uber for X')"}
- UNIT ECONOMICS: Include specific pricing math

Respond ONLY with a single valid JSON object — no markdown, no explanation.
The JSON must follow this EXACT structure:
${conceptSchema}`;

    // Build compact context from upstream analysis
    const transformationsContext = viableTransformations
      ? JSON.stringify(viableTransformations).slice(0, 3000)
      : "No transformations provided";
    const clustersContext = allClusters
      ? JSON.stringify(allClusters).slice(0, 1500)
      : "No clusters provided";
    const assumptionsContext = hiddenAssumptions
      ? JSON.stringify(hiddenAssumptions).slice(0, 1500)
      : "";
    const flipsContext = flippedLogic
      ? JSON.stringify(flippedLogic).slice(0, 1500)
      : "";
    const decompContext = decomposition
      ? JSON.stringify(decomposition).slice(0, 2000)
      : "";

    const userPrompt = `Generate a redesigned concept for:

${isService ? "SERVICE" : "PRODUCT"}: ${product.name}
CATEGORY: ${product.category}
DESCRIPTION: ${product.description || ""}

VIABLE STRUCTURAL TRANSFORMATIONS (passed viability gate):
${transformationsContext}

TRANSFORMATION CLUSTERS (coherent strategies):
${clustersContext}

HIDDEN ASSUMPTIONS IDENTIFIED:
${assumptionsContext}

FLIPPED LOGIC:
${flipsContext}

STRUCTURAL DECOMPOSITION:
${decompContext}
${governedPrompt}${curationPrompt}${buildLensPrompt(lens)}

Generate a concept that DIRECTLY implements the highest-scoring cluster. The concept should be radical, specific, and implementable.
Return ONLY the JSON object.`;

    const body: Record<string, unknown> = {
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 8000,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${txt}`);
    }

    const aiData = await response.json();

    let result: Record<string, unknown>;
    try {
      result = extractStructuredResponse(aiData);
    } catch (_parseErr) {
      const rawText: string = aiData.choices?.[0]?.message?.content ?? "";
      let cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        result = JSON.parse(cleaned);
      } catch (jsonErr) {
        console.error("[ConceptArchitecture] Parse failed:", jsonErr);
        throw new Error("AI returned invalid output. Please try again.");
      }
    }

    // Extract redesignedConcept from result (may be nested or top-level)
    const redesignedConcept = result.redesignedConcept || result;
    const visualSpecs = result.visualSpecs || [];
    const actionPlans = result.actionPlans || [];

    // Validate concept has required fields
    const concept = redesignedConcept as Record<string, unknown>;
    if (!concept.conceptName && !concept.coreInsight) {
      console.error("[ConceptArchitecture] Empty concept returned");

      // Synthesize fallback from transformations
      const topTransform = Array.isArray(viableTransformations) ? viableTransformations[0] : null;
      const topCluster = Array.isArray(allClusters) ? allClusters[0] : null;

      const fallbackConcept = {
        conceptName: topCluster?.name || `Reimagined ${product.name}`,
        tagline: topCluster?.description || "A ground-up reinvention",
        coreInsight: topTransform
          ? `By applying ${topTransform.transformationType} to ${topTransform.targetPrimitiveLabel}, we unlock: ${topTransform.valueCreated}`
          : "Structural transformation of the core system",
        radicalDifferences: (viableTransformations || []).slice(0, 4).map((t: any) => t.proposedState || t.mechanism || "Structural change"),
        physicalDescription: topTransform?.mechanism || "Fundamentally restructured approach",
        sizeAndWeight: isService ? "Scalable digital-first model" : "Optimized for core use case",
        materials: (viableTransformations || []).slice(0, 3).map((t: any) => t.mechanism || "Key capability"),
        smartFeatures: (viableTransformations || []).slice(0, 3).map((t: any) => t.proposedState || "Smart feature"),
        userExperienceTransformation: "Before: constrained by legacy assumptions. After: freed by structural transformation.",
        frictionEliminated: (viableTransformations || []).slice(0, 3).map((t: any) => t.valueCreated || "Friction removed"),
        whyItHasntBeenDone: "Incumbent economics and organizational inertia",
        biggestRisk: "Adoption risk — requires behavioral change",
        manufacturingPath: isService ? "Phased rollout with pilot" : "Prototype → validation → scale",
        pricePoint: "Market-competitive with improved unit economics",
        targetUser: "Users who actively experience identified friction",
        riskLevel: "Medium",
        capitalRequired: "Medium",
      };

      return new Response(JSON.stringify({
        success: true,
        analysis: { redesignedConcept: fallbackConcept, visualSpecs, actionPlans },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    enforceVisualContract({ visualSpecs, actionPlans });

    console.log(`[ConceptArchitecture] Generated concept: "${concept.conceptName}"`);

    return new Response(JSON.stringify({
      success: true,
      analysis: { redesignedConcept: concept, visualSpecs, actionPlans },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("concept-architecture error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
