/**
 * STRATEGIC SYNTHESIS — Unified strategic engine (Phase 2 of 90-second pipeline).
 * 
 * Merges transformation-engine + concept-architecture into a SINGLE AI call.
 * Produces: hiddenAssumptions, flippedLogic, structuralTransformations,
 *           transformationClusters, redesignedConcept, quickValidation, governed.
 * 
 * Uses compressed reasoning framework (reasoningFrameworkLite) to save ~1700 tokens.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveMode, filterInputData, validateOutput, buildTrace, missingDataWarning, getModeGuardPrompt } from "../_shared/modeEnforcement.ts";
import { buildAdaptiveContextPrompt, extractAdaptiveContext } from "../_shared/adaptiveContext.ts";
import { getReasoningFrameworkLite } from "../_shared/reasoningFrameworkLite.ts";
import { buildLensPrompt } from "../_shared/lensPrompt.ts";
import { enforceVisualContract } from "../_shared/visualFallback.ts";
import { getGovernedSchemaPrompt, buildValidationObject } from "../_shared/governedSchema.ts";
import { buildLensWeightingPrompt } from "../_shared/lensWeighting.ts";
import { buildModeWeightingPrompt } from "../_shared/modeWeighting.ts";
import { buildStructuredOutputTools, extractStructuredResponse, validateStructuredResponse, validateArrayMinimums } from "../_shared/structuredOutput.ts";
import { extractActiveBranch, extractCombinedBranches, buildBranchIsolationPrompt } from "../_shared/branchIsolation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      product, lens, upstreamIntel, structuralDecomposition, activeBranch,
      adaptiveContext: rawAdaptiveCtx, extractedContext: rawExtractedCtx,
      preContext, strategyContext,
      // Curation context from user
      insightPreferences, userScores, steeringText,
    } = await req.json();

    const adaptiveCtx = rawAdaptiveCtx || extractAdaptiveContext({ product });
    const adaptivePrompt = buildAdaptiveContextPrompt(adaptiveCtx);

    const isCombinedMode = !activeBranch?.active_branch_id || activeBranch?.active_branch_id === "combined";
    const branchCtx = (!isCombinedMode && activeBranch) ? extractActiveBranch(
      { root_hypotheses: [activeBranch.hypothesis] },
      activeBranch.active_branch_id
    ) : null;
    const combinedCtx = (isCombinedMode && activeBranch?.allHypotheses) ? extractCombinedBranches({ root_hypotheses: activeBranch.allHypotheses }) : null;
    const branchPrompt = buildBranchIsolationPrompt(branchCtx, activeBranch?.strategicProfile || null, combinedCtx);

    const mode = resolveMode(undefined, product.category);
    const isService = mode === "service";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const filterResult = filterInputData(mode, product);
    const filteredProduct = filterResult.filtered;
    console.log(`[StrategicSynthesis] ${mode} mode`);
    const modeGuard = getModeGuardPrompt(mode);

    // ── Build curation prompt ──
    let curationPrompt = "";
    if (insightPreferences || userScores || steeringText) {
      const parts: string[] = ["\n\n--- USER CURATION CONTEXT ---"];
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
      parts.push("\nBuild the analysis and redesigned concept around the user's preferred directions.");
      curationPrompt = parts.join("\n");
    }

    const OS_PREAMBLE = `You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.
${getReasoningFrameworkLite()}
${modeGuard}${branchPrompt}${adaptivePrompt}

CORE PRINCIPLES:
- First-principles reasoning over analogy or convention
- Decompose every system into at least 3 layers of depth
- Never present modeled or inferred data as verified fact
${structuralDecomposition ? `
STRUCTURAL DECOMPOSITION (UPSTREAM — use as your foundation):
The following structural primitives, system dynamics, AND leverage analysis have been extracted. Build your analysis ON TOP of them.

LEVERAGE-TARGETED INVERSION:
The leverageAnalysis.leveragePrimitives array ranks which system primitives have the highest disruption potential. Each includes a bestTransformation type.
When generating hiddenAssumptions and flippedLogic, you MUST:
1. Target the TOP leverage primitives first
2. Reference specific failure modes, feedback loops, and control points from system dynamics
3. Ensure each flipped logic entry maps to a specific leverage primitive when possible

CROSS-DOMAIN ANALOGY MANDATE:
${strategyContext?.topStrategies?.length > 0 ? `The strategy search engine has identified these high-leverage strategic configurations. USE THEM as foundations for your hiddenAssumptions and flippedLogic:
${strategyContext.topStrategies.map((s: any, i: number) => {
  const analogyNote = s.sourceAnalogy 
    ? ` [Cross-domain: ${s.sourceAnalogy.company} in ${s.sourceAnalogy.industry} — "${s.sourceAnalogy.primitive}"]`
    : '';
  return `${i + 1}. Pattern: ${s.patternName} | Mechanism: ${s.mechanism} | Addresses: ${s.constraintName} (score: ${s.score?.toFixed(2)})${analogyNote}`;
}).join("\n")}

For strategies tagged [Cross-domain], explicitly reference the company and industry in your hiddenAssumptions or flippedLogic text. Format as:
"Cross-domain precedent: [Company] in [industry] resolved this same structural constraint by [mechanism]. This suggests [implication for target business]."
Ensure at least 2 entries reference cross-domain precedents from unrelated industries.`
: `For at least 2 of your hiddenAssumptions or flippedLogic entries, explicitly reference a structural move from an UNRELATED industry that resolved a structurally identical constraint. Format as:
"Cross-domain precedent: [Company] in [industry] resolved this same structural constraint by [mechanism]. This suggests [implication for target business]."
Look for structural parallels — same constraint shape (e.g. fragmented supply, intermediated distribution, labor-heavy delivery) solved in a completely different domain.`}

CONCEPT GENERATION MANDATE:
Generate a "redesignedConcept" directly from the highest-leverage hiddenAssumptions and flippedLogic. The concept MUST:
- Be STRUCTURALLY different from the current product/service — not a feature add
- Include operational mechanism and implementation path
- ${isService ? "Be implementable within 12-18 months" : "Be manufacturable within 2-3 years"}

QUICK VALIDATION MANDATE:
Generate a "quickValidation" with the top 3 threats, feasibility score, key risk, and confidence level.

${JSON.stringify(structuralDecomposition, null, 1).slice(0, 4000)}
` : ''}

OUTPUT RULES:
- Metrics must be ≤12 words
- Include leverage scores (1-10) — CALIBRATED: 5-6 is default, ≥8 requires evidence
- Flag risk levels: [Risk: Low/Medium/High]
- Flag capital requirements: [Capital: Low/Medium/High]
- Use directional indicators: ↑ ↓ → for trends
- SCORING: Apply friction penalties. Before finalizing any score, ask "What would cause this to fail?" — if material, reduce.
`;

    // ── Analysis + Concept + QuickValidation schema ──
    const redesignedConceptSchema = isService
      ? `"redesignedConcept": {
      "conceptName": "Short punchy name",
      "tagline": "One sentence",
      "coreInsight": "Central truth (2-3 sentences)",
      "radicalDifferences": ["Diff 1", "Diff 2", "Diff 3", "Diff 4"],
      "physicalDescription": "Vivid description of service experience",
      "sizeAndWeight": "Service scope and commitment level",
      "materials": ["Key capability 1", "Key capability 2", "Key capability 3"],
      "smartFeatures": ["Smart feature 1", "Smart feature 2", "Smart feature 3"],
      "userExperienceTransformation": "Before and after journey",
      "frictionEliminated": ["Friction 1", "Friction 2"],
      "whyItHasntBeenDone": "Specific blockers",
      "biggestRisk": "Single most likely failure + mitigation",
      "manufacturingPath": "Implementation path",
      "pricePoint": "Target pricing model",
      "targetUser": "Specific human moment or need",
      "riskLevel": "[Risk: Low/Medium/High]",
      "capitalRequired": "[Capital: Low/Medium/High]"
    }`
      : `"redesignedConcept": {
      "conceptName": "Short punchy name",
      "tagline": "One sentence",
      "coreInsight": "Central design truth (2-3 sentences)",
      "radicalDifferences": ["Diff 1", "Diff 2", "Diff 3", "Diff 4"],
      "physicalDescription": "Vivid description of form, size, texture, how held/used",
      "sizeAndWeight": "Exact proposed dimensions with justification",
      "materials": ["Material 1 with reason", "Material 2", "Material 3"],
      "smartFeatures": ["Smart feature 1", "Smart feature 2", "Smart feature 3"],
      "userExperienceTransformation": "Before and after journey",
      "frictionEliminated": ["Friction 1", "Friction 2"],
      "whyItHasntBeenDone": "Specific blockers",
      "biggestRisk": "Single most likely failure + mitigation",
      "manufacturingPath": "Suppliers, processes, country, cost estimate",
      "pricePoint": "Target retail price and justification",
      "targetUser": "Specific human moment or identity",
      "riskLevel": "[Risk: Low/Medium/High]",
      "capitalRequired": "[Capital: Low/Medium/High]"
    }`;

    const quickValidationSchema = `"quickValidation": {
      "topThreats": [
        { "threat": "Specific threat", "severity": "high|medium", "mitigation": "How to address" }
      ],
      "feasibilityScore": 6.5,
      "keyRisk": "The single biggest risk",
      "confidenceLevel": "near_term_viable|conditional|long_horizon"
    }`;

    const coreAnalysisFields = isService
      ? `"currentStrengths": { "whatWorks": [...], "competitiveAdvantages": [...], "keepVsAdapt": "..." },
  "coreReality": { "trueProblem": "...", "actualUsage": "...", "normalizedFrustrations": [...], "userHacks": [...] },
  "frictionDimensions": { "primaryFriction": "...", "deliveryModel": "...", "skillBarrier": "...", "costStructure": "...", "ecosystemLockIn": "...", "maintenanceBurden": "...", "gaps": [...], "opportunities": [...] },`
      : `"currentStrengths": { "whatWorks": [...], "competitiveAdvantages": [...], "keepVsAdapt": "..." },
  "coreReality": { "trueProblem": "...", "actualUsage": "...", "normalizedFrustrations": [...], "userHacks": [...] },
  "frictionDimensions": { "primaryFriction": "...", "physicalForm": "...", "skillBarrier": "...", "costStructure": "...", "ecosystemLockIn": "...", "maintenanceBurden": "...", "gaps": [...], "opportunities": [...] },`;

    const analysisSchema = `{
  ${coreAnalysisFields}
  "hiddenAssumptions": [
    {
      "assumption": "Specific assumption",
      "currentAnswer": "Why currently done this way",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": true,
      "challengeIdea": "How to challenge",
      "leverageScore": 8,
      "impactScenario": "Upside if challenged",
      "competitiveBlindSpot": "Who relies on this",
      "urgencySignal": "eroding | stable | emerging",
      "urgencyReason": "Why"
    }
  ],
  "flippedLogic": [
    {
      "originalAssumption": "The assumption being flipped",
      "boldAlternative": "The radical structural alternative",
      "rationale": "Why this creates real value",
      "physicalMechanism": "How it works"
    }
  ],
  ${redesignedConceptSchema},
  ${quickValidationSchema},
  "governed": { ... }
}`;

    const systemPrompt = isService
      ? OS_PREAMBLE + `You are a radical first-principles service strategist combining:
- Clayton Christensen (jobs-to-be-done, disruptive innovation)
- Elon Musk (first principles — strip away convention)
- Don Norman (cognitive load, affordances, friction archaeology)
- Alex Hormozi (offer design, pricing psychology, operational leverage)

Your mission: deconstruct a SERVICE, uncover radical redesign opportunities, AND generate the redesigned concept.

Respond ONLY with a single valid JSON object.
The JSON must follow this EXACT structure:
${analysisSchema}`
      : OS_PREAMBLE + `You are a radical first-principles product strategist combining:
- Dieter Rams (ruthless design purity)
- Elon Musk (first principles — rebuild from physics up)
- Jony Ive (human connection — how it feels)
- Don Norman (cognitive load, affordances, friction archaeology)

Your mission: deconstruct a product, uncover radical redesign opportunities, AND generate the redesigned concept.
Investigate friction across ALL dimensions.

Respond ONLY with a single valid JSON object.
The JSON must follow this EXACT structure:
${analysisSchema}`;

    // ── User prompt ──
    const userPrompt = isService
      ? `Apply radical first-principles deconstruction AND concept generation to this SERVICE.

SERVICE: ${product.name}
CATEGORY: ${product.category}
DESCRIPTION: ${product.description}
KEY INSIGHT: ${product.keyInsight || "None provided"}
MARKET SIZE: ${product.marketSizeEstimate || "Unknown"}

KNOWN CUSTOMER COMPLAINTS:
${product.reviews?.filter((r: { sentiment: string }) => r.sentiment === "negative").map((r: { text: string }) => `• ${r.text}`).join("\n") || "General friction points"}

EXISTING ASSUMPTIONS:
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption} → ${a.challenge}`).join("\n") || "None pre-identified"}

COMMUNITY PAIN POINTS:
${(product as any).communityInsights?.topComplaints?.map((c: string) => `• ${c}`).join("\n") || "See reviews above"}

CRITICAL INSTRUCTIONS:
1. Generate at least 5 hiddenAssumptions and 4 flippedLogic items
2. Generate redesignedConcept from highest-leverage assumptions/flips
3. Generate quickValidation with top 3 threats and feasibility score
4. Every claim needs an operational mechanism
5. Reference real analogous services if possible
6. Include unit economics and pricing math

Return ONLY the JSON object.${buildLensPrompt(lens)}${curationPrompt}`
      : `Apply radical first-principles deconstruction AND concept generation to this product.

PRODUCT: ${product.name}
CATEGORY: ${product.category}
ERA: ${product.era}
DESCRIPTION: ${product.description}
SPECS: ${product.specs}
KEY INSIGHT: ${product.keyInsight || "None provided"}
MARKET SIZE: ${product.marketSizeEstimate || "Unknown"}

KNOWN USER COMPLAINTS:
${product.reviews?.filter((r: { sentiment: string }) => r.sentiment === "negative").map((r: { text: string }) => `• ${r.text}`).join("\n") || "General friction points"}

EXISTING ASSUMPTIONS:
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption} → ${a.challenge}`).join("\n") || "None pre-identified"}

COMMUNITY PAIN POINTS:
${(product as any).communityInsights?.topComplaints?.map((c: string) => `• ${c}`).join("\n") || "See reviews above"}

CRITICAL INSTRUCTIONS:
1. FRICTION: Identify PRIMARY friction dimension — do NOT default to physical/size
2. Generate at least 5 hiddenAssumptions and 4 flippedLogic items
3. Generate redesignedConcept from highest-leverage assumptions/flips
4. Generate quickValidation with top 3 threats and feasibility score
5. Every idea needs a physical mechanism
6. Reference real analogous products if possible
7. Include BOM estimate, target retail price, margin

Return ONLY the JSON object.${buildLensPrompt(lens)}${buildLensWeightingPrompt(lens)}${buildModeWeightingPrompt(mode)}${curationPrompt}`;

    // ── UPSTREAM INTELLIGENCE from preContext ──
    let upstreamPrompt = "";
    if (preContext && Object.keys(preContext).length > 0) {
      const parts: string[] = ["\n\n--- UPSTREAM INTELLIGENCE ---"];
      if (preContext.pricing) {
        parts.push("PRICING:");
        const pi = preContext.pricing;
        if (pi.currentMarketPrice) parts.push(`  Market Price: ${pi.currentMarketPrice}`);
        if (pi.margins) parts.push(`  Margins: ${pi.margins}`);
        if (pi.priceDirection) parts.push(`  Trend: ${pi.priceDirection}`);
      }
      if (preContext.supplyChain) {
        const sc = preContext.supplyChain;
        parts.push("SUPPLY CHAIN:");
        if (sc.suppliers?.length) parts.push(`  Suppliers: ${sc.suppliers.map((s: any) => `${s.name} (${s.region})`).join("; ")}`);
      }
      if (preContext.complaints?.length) {
        parts.push("TOP COMPLAINTS:");
        preContext.complaints.forEach((c: string) => parts.push(`  • ${c}`));
      }
      if (preContext.competitors) {
        parts.push("COMPETITORS:");
        if (preContext.competitors.marketLeader) parts.push(`  Leader: ${preContext.competitors.marketLeader}`);
        if (preContext.competitors.gaps?.length) parts.push(`  Gaps: ${preContext.competitors.gaps.join("; ")}`);
      }
      if (preContext.patents) {
        parts.push("PATENTS:");
        if (preContext.patents.totalPatents) parts.push(`  Total: ${preContext.patents.totalPatents}`);
        if (preContext.patents.gapAnalysis) parts.push(`  Gap: ${preContext.patents.gapAnalysis}`);
      }
      if (preContext.trends) parts.push(`TRENDS: ${preContext.trends}`);
      parts.push("Ground your analysis in this intelligence.");
      upstreamPrompt = parts.join("\n");
    }
    // Also support legacy upstreamIntel object
    if (!upstreamPrompt && upstreamIntel && Object.keys(upstreamIntel).length > 0) {
      const parts: string[] = ["\n\n--- UPSTREAM INTELLIGENCE ---"];
      if (upstreamIntel.pricingIntel) {
        const pi = upstreamIntel.pricingIntel;
        parts.push("PRICING:");
        if (pi.currentMarketPrice) parts.push(`  Price: ${pi.currentMarketPrice}`);
        if (pi.margins) parts.push(`  Margins: ${pi.margins}`);
      }
      if (upstreamIntel.communityInsights?.topComplaints?.length) {
        parts.push("COMPLAINTS:");
        upstreamIntel.communityInsights.topComplaints.slice(0, 5).forEach((c: string) => parts.push(`  • ${c}`));
      }
      if (upstreamIntel.competitorAnalysis) {
        const ca = upstreamIntel.competitorAnalysis;
        if (ca.marketLeader) parts.push(`MARKET LEADER: ${ca.marketLeader}`);
        if (ca.gaps?.length) parts.push(`GAPS: ${ca.gaps.slice(0, 3).join("; ")}`);
      }
      parts.push("Ground your analysis in this intelligence.");
      upstreamPrompt = parts.join("\n");
    }

    const structuredTools = buildStructuredOutputTools("strategic-synthesis");
    const aiMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt + upstreamPrompt },
    ];

    const body: Record<string, unknown> = {
      model: "google/gemini-2.5-flash",
      messages: aiMessages,
      temperature: 0.5,
      max_tokens: 6000,
    };
    if (structuredTools) Object.assign(body, structuredTools);

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

    let analysis: Record<string, unknown>;
    try {
      analysis = extractStructuredResponse(aiData);
    } catch (parseErr) {
      const rawText: string = aiData.choices?.[0]?.message?.content ?? "";
      let cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      // Attempt truncation repair
      try {
        analysis = JSON.parse(cleaned);
      } catch {
        // Brace balancing
        let opens = 0, closes = 0;
        for (const ch of cleaned) { if (ch === '{') opens++; if (ch === '}') closes++; }
        if (opens > closes) {
          cleaned = cleaned.replace(/,\s*$/, '') + '}'.repeat(opens - closes);
        }
        try {
          analysis = JSON.parse(cleaned);
        } catch (finalErr) {
          console.error("[StrategicSynthesis] All parse attempts failed:", finalErr);
          throw new Error("AI returned invalid output. Please try again.");
        }
      }
    }

    // ── Enforce minimum artifacts ──
    let minimumValidation = validateArrayMinimums(analysis, "strategic-synthesis");
    if (!minimumValidation.valid) {
      console.warn(`[StrategicSynthesis] Underfilled: ${minimumValidation.underfilled.map(u => `${u.field}:${u.actual}/${u.min}`).join(", ")}`);
      analysis = enforceMinimumArtifacts(analysis, upstreamIntel, product, isService, structuralDecomposition);
    }

    // ── Validate concept ──
    const concept = analysis.redesignedConcept as Record<string, unknown> | undefined;
    if (!concept?.conceptName && !concept?.coreInsight) {
      console.warn("[StrategicSynthesis] Missing concept — synthesizing from transformations");
      analysis.redesignedConcept = buildFallbackConcept(analysis, product, isService, structuralDecomposition);
    }

    // ── Ensure quickValidation exists ──
    if (!analysis.quickValidation) {
      analysis.quickValidation = {
        topThreats: [{ threat: "Adoption risk — behavioral change required", severity: "medium", mitigation: "Phased rollout with early adopters" }],
        feasibilityScore: 5.5,
        keyRisk: "Market validation pending",
        confidenceLevel: "conditional",
      };
    }

    enforceVisualContract(analysis);

    console.log(
      `[StrategicSynthesis] counts: assumptions=${Array.isArray(analysis.hiddenAssumptions) ? analysis.hiddenAssumptions.length : 0}, ` +
      `flips=${Array.isArray(analysis.flippedLogic) ? analysis.flippedLogic.length : 0}, ` +
      `concept=${(analysis.redesignedConcept as any)?.conceptName || "none"}`
    );

    const structuredValidation = validateStructuredResponse(analysis, "strategic-synthesis");
    if (structuredValidation.truncated) {
      console.error(`[StrategicSynthesis] TRUNCATION: missing ${structuredValidation.missing.join(", ")}`);
    }

    // ── Governed validation ──
    const governed = analysis.governed || {};
    const governedValidation = buildValidationObject("strategic-synthesis", governed, [
      "domain_confirmation", "first_principles", "friction_tiers", "constraint_map", "decision_synthesis"
    ]);
    console.log(`[StrategicSynthesis][Governed] Validation:`, JSON.stringify(governedValidation));

    if (!governedValidation.validation_passed) {
      console.error(`[StrategicSynthesis][Governed] CHECKPOINT BLOCKED: ${governedValidation.blocking_reason_if_any}`);
      return new Response(JSON.stringify({
        success: false,
        error: "Governed validation failed — required reasoning artifacts missing",
        _governedValidation: governedValidation,
        analysis,
      }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { deepValidateGoverned } = await import("../_shared/governedSchema.ts");
    const deepValidation = deepValidateGoverned(governed);
    if (!deepValidation.validation_passed) {
      console.error(`[StrategicSynthesis][Governed] DEEP VALIDATION FAILED: ${deepValidation.blocking_reason_if_any}`);
      return new Response(JSON.stringify({
        success: false,
        error: "Governed deep validation failed",
        _governedValidation: deepValidation,
        analysis,
      }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Confidence computation
    const { computeGovernedConfidence: computeConf } = await import("../_shared/confidenceComputation.ts");
    const confidenceResult = computeConf(governed);
    console.log(`[StrategicSynthesis][Governed] Confidence: ${confidenceResult.computation_trace}`);
    if (governed.decision_synthesis) {
      const ds = governed.decision_synthesis as Record<string, unknown>;
      ds.confidence_score = confidenceResult.computed_confidence;
      ds.decision_grade = confidenceResult.computed_decision_grade;
      ds._confidence_computation = confidenceResult.computation_trace;
      ds._evidence_distribution = confidenceResult.evidence_distribution;
    }

    // Hypothesis ranking
    const { rankAndValidateHypotheses } = await import("../_shared/hypothesisRanking.ts");
    const hypothesisResult = rankAndValidateHypotheses(governed);
    if (hypothesisResult.ranked.length > 0) {
      const cm = governed.constraint_map as Record<string, unknown>;
      cm.root_hypotheses = hypothesisResult.ranked;
      (governed as Record<string, unknown>)._hypothesis_ranking = {
        primary_id: hypothesisResult.primary_id,
        competing: hypothesisResult.competing,
        delta: hypothesisResult.delta,
        trace: hypothesisResult.trace,
      };
    }

    const validationResult = validateOutput(mode, analysis);
    const trace = buildTrace(mode, filterResult, validationResult);

    return new Response(JSON.stringify({ success: true, analysis, _modeTrace: trace, _governedValidation: governedValidation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("strategic-synthesis error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Helper: enforce minimum artifact counts ──
function enforceMinimumArtifacts(
  base: Record<string, unknown>,
  upstreamIntel?: any,
  product?: any,
  isService?: boolean,
  decomposition?: any,
): Record<string, unknown> {
  const next = { ...base };
  const frictionDims = (next.frictionDimensions as Record<string, unknown> | undefined) || {};
  const workflow = (next.userWorkflow as Record<string, unknown> | undefined) || {};
  const upstream = (upstreamIntel as Record<string, unknown> | undefined) || {};
  const upstreamCommunity = (upstream?.communityInsights as Record<string, unknown> | undefined) || {};

  const gapSeeds = Array.isArray(frictionDims.gaps) ? (frictionDims.gaps as string[]) : [];
  const workflowSeeds = Array.isArray(workflow.frictionPoints)
    ? (workflow.frictionPoints as Array<Record<string, unknown>>).map(f => String(f.friction || "Workflow friction"))
    : [];
  const complaintSeeds = Array.isArray(upstreamCommunity.topComplaints)
    ? (upstreamCommunity.topComplaints as string[])
    : [];
  const seedPool = [...gapSeeds, ...workflowSeeds, ...complaintSeeds].filter(Boolean);

  // ── Pad hiddenAssumptions ──
  const existingAssumptions = Array.isArray(next.hiddenAssumptions)
    ? [...(next.hiddenAssumptions as Array<Record<string, unknown>>)]
    : [];
  while (existingAssumptions.length < 5) {
    const seed = seedPool[existingAssumptions.length] || `Recurring friction point ${existingAssumptions.length + 1}`;
    existingAssumptions.push({
      assumption: `The system must keep this constraint: ${seed}`,
      currentAnswer: "Incumbent workflow keeps this as default.",
      reason: "habit",
      isChallengeable: true,
      challengeIdea: `Re-architect the workflow to remove dependency on: ${seed}`,
      leverageScore: 7,
      impactScenario: "Reducing this constraint increases throughput, trust, and conversion.",
      competitiveBlindSpot: "Incumbents are optimized around legacy delivery assumptions.",
      urgencySignal: "emerging",
      urgencyReason: "User complaints and market behavior indicate this friction is becoming less acceptable.",
    });
  }
  next.hiddenAssumptions = existingAssumptions;

  // ── Pad flippedLogic ──
  const existingFlips = Array.isArray(next.flippedLogic)
    ? [...(next.flippedLogic as Array<Record<string, unknown>>)]
    : [];
  while (existingFlips.length < 4) {
    const assumption = existingAssumptions[existingFlips.length % existingAssumptions.length] as Record<string, unknown>;
    existingFlips.push({
      originalAssumption: String(assumption.assumption || "Legacy operating assumption"),
      boldAlternative: String(assumption.challengeIdea || "Invert the operating model"),
      rationale: "This inversion removes a proven friction cluster and unlocks scalable value delivery.",
      physicalMechanism: "Implement with a constrained pilot, instrument outcomes, then scale.",
    });
  }
  next.flippedLogic = existingFlips;

  // ── If concept still missing, build it ──
  const concept = next.redesignedConcept as Record<string, unknown> | undefined;
  if (!concept?.conceptName && !concept?.coreInsight) {
    next.redesignedConcept = buildFallbackConcept(next, product, isService, decomposition);
  }

  return next;
}

// ── Helper: build a grounded fallback concept ──
function buildFallbackConcept(
  analysis: Record<string, unknown>,
  product: any,
  isService?: boolean,
  _decomposition?: any,
): Record<string, unknown> {
  const productName = product?.name || "System";
  const category = product?.category || "";
  const primaryFriction = (analysis.frictionDimensions as any)?.primaryFriction || "";
  const topFlip = Array.isArray(analysis.flippedLogic) ? (analysis.flippedLogic as any[])[0] : null;
  const topAssumptions = Array.isArray(analysis.hiddenAssumptions) ? (analysis.hiddenAssumptions as any[]).slice(0, 3) : [];

  const conceptName = topFlip
    ? `Reimagined ${productName} — ${(topFlip.boldAlternative || "").split(" ").slice(0, 4).join(" ")}`
    : `Redesigned ${productName}`;

  return {
    conceptName,
    tagline: topFlip?.boldAlternative || `A first-principles ${isService ? "service" : "product"} reinvention of ${productName}`,
    coreInsight: topFlip
      ? `By flipping "${topFlip.originalAssumption}", we unlock: ${topFlip.rationale}`
      : `Structural redesign of ${productName}'s core ${isService ? "delivery model" : "architecture"}`,
    radicalDifferences: topAssumptions.map((a: any) => a.challengeIdea || a.assumption),
    physicalDescription: topFlip?.physicalMechanism || `Fundamentally restructured ${isService ? "service experience" : "form factor"}`,
    sizeAndWeight: isService ? "Scalable digital-first model" : "Optimized for core use case",
    materials: topAssumptions.map((a: any) => a.challengeIdea || "Novel approach"),
    smartFeatures: topAssumptions.slice(0, 3).map((a: any) => `Addresses: ${(a.assumption || "").slice(0, 50)}`),
    userExperienceTransformation: `Before: ${primaryFriction || "constrained by legacy patterns"}. After: friction removed.`,
    frictionEliminated: topAssumptions.map((a: any) => a.impactScenario || a.assumption),
    whyItHasntBeenDone: "Incumbent economics, organizational inertia, and optimization of legacy architecture",
    biggestRisk: "Adoption risk — requires behavioral change from existing users",
    manufacturingPath: isService ? "Phased rollout over 12-18 months" : "Prototype → validation → production over 18-24 months",
    pricePoint: "Market-competitive with improved unit economics",
    targetUser: `Users experiencing friction in ${category || productName}`,
    riskLevel: "Medium",
    capitalRequired: "Medium",
  };
}
