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
  "structuralTransformations": [
    {
      "id": "st_1",
      "targetPrimitiveId": "id from leverageAnalysis",
      "targetPrimitiveLabel": "Human label",
      "transformationType": "elimination|substitution|reordering|aggregation",
      "currentState": "What exists now",
      "proposedState": "What replaces it",
      "mechanism": "How",
      "valueCreated": "What improves",
      "valueLost": "What degrades",
      "viabilityGate": {
        "technical": { "score": 4, "reasoning": "Why" },
        "economic": { "score": 3, "reasoning": "Why" },
        "regulatory": { "score": 5, "reasoning": "Why" },
        "behavioral": { "score": 3, "reasoning": "Why" },
        "compositeScore": 3.75,
        "verdict": "pass|conditional|fail"
      },
      "filtered": false,
      "systemImpact": {
        "valueFlowChanges": ["..."],
        "newBottleneck": "...",
        "cascadeEffects": ["..."]
      }
    }
  ],
  "transformationClusters": [
    {
      "id": "tc_1",
      "name": "Cluster name",
      "description": "How these work together",
      "transformationIds": ["st_1", "st_2"],
      "compatibilityNote": "Why compatible",
      "strategicPowerScore": 7.5
    }
  ],
  ${redesignedConceptSchema},
  ${quickValidationSchema},
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
  ],
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
2. Generate 8-12 structuralTransformations across all 4 types
3. Group surviving transformations into 2-4 clusters
4. Generate redesignedConcept from the highest-scoring cluster
5. Generate quickValidation with top 3 threats and feasibility score
6. Every claim needs an operational mechanism
7. Reference real analogous services if possible
8. Include unit economics and pricing math

VISUAL & ACTION PLAN INSTRUCTIONS:
- Generate 1-2 visual specs for dominant constraint structure
- Generate 2-3 action plans for highest-leverage interventions

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
3. Generate 8-12 structuralTransformations across all 4 types
4. Group surviving transformations into 2-4 clusters
5. Generate redesignedConcept from highest-scoring cluster
6. Generate quickValidation with top 3 threats and feasibility score
7. Every idea needs a physical mechanism
8. Reference real analogous products if possible
9. Include BOM estimate, target retail price, margin

VISUAL & ACTION PLAN INSTRUCTIONS:
- Generate 1-2 visual specs for dominant constraint structure
- Generate 2-3 action plans for highest-leverage interventions

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
      max_tokens: 10000,
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
      `transforms=${Array.isArray(analysis.structuralTransformations) ? analysis.structuralTransformations.length : 0}, ` +
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

  // ── Pad structuralTransformations ──
  const existingTransforms = Array.isArray(next.structuralTransformations)
    ? [...(next.structuralTransformations as Array<Record<string, unknown>>)]
    : [];

  // Extract leverage primitives from decomposition for grounded padding
  const leveragePrimitives = decomposition?.leverageAnalysis?.leveragePrimitives || [];
  const transformTypes = ["elimination", "substitution", "reordering", "aggregation"] as const;

  while (existingTransforms.length < 6) {
    const idx = existingTransforms.length;
    const primitive = leveragePrimitives[idx % leveragePrimitives.length];
    const tType = transformTypes[idx % transformTypes.length];
    const seed = seedPool[idx] || existingAssumptions[idx % existingAssumptions.length]?.assumption || "System constraint";
    const primId = primitive?.id || `lp_${idx + 1}`;
    const primLabel = primitive?.label || String(seed).slice(0, 60);

    existingTransforms.push({
      id: `st_${idx + 1}`,
      targetPrimitiveId: primId,
      targetPrimitiveLabel: primLabel,
      transformationType: tType,
      currentState: primitive?.currentBehavior || `Current: ${String(seed).slice(0, 80)}`,
      proposedState: `Apply ${tType} to restructure ${primLabel}`,
      mechanism: `Systematically ${tType === "elimination" ? "remove" : tType === "substitution" ? "replace" : tType === "reordering" ? "resequence" : "aggregate"} the ${primLabel} component`,
      valueCreated: primitive?.bestTransformation || "Reduced cost/friction, improved throughput",
      valueLost: "Requires change management and pilot validation",
      viabilityGate: {
        technical: { score: 4, reasoning: "Technically feasible with existing infrastructure" },
        economic: { score: 3, reasoning: "Requires investment but positive ROI within 18 months" },
        regulatory: { score: 4, reasoning: "No major regulatory barriers identified" },
        behavioral: { score: 3, reasoning: "Moderate behavioral change required" },
        compositeScore: 3.5,
        verdict: "conditional",
      },
      filtered: false,
      systemImpact: {
        valueFlowChanges: [`Restructured ${primLabel} flow`],
        newBottleneck: "Adjacent system component becomes new constraint",
        cascadeEffects: ["Downstream processes need adaptation"],
      },
    });
  }
  next.structuralTransformations = existingTransforms;

  // ── Pad transformationClusters ──
  const existingClusters = Array.isArray(next.transformationClusters)
    ? [...(next.transformationClusters as Array<Record<string, unknown>>)]
    : [];
  if (existingClusters.length < 2) {
    const nonFiltered = existingTransforms.filter((t: any) => !t.filtered);
    const half = Math.ceil(nonFiltered.length / 2);
    const cluster1Ids = nonFiltered.slice(0, half).map((t: any) => t.id);
    const cluster2Ids = nonFiltered.slice(half).map((t: any) => t.id);

    if (existingClusters.length < 1 && cluster1Ids.length > 0) {
      existingClusters.push({
        id: "tc_1",
        name: `${product?.name || "System"} Core Restructuring`,
        description: `Primary structural interventions targeting the most constrained components of ${product?.name || "the system"}`,
        transformationIds: cluster1Ids,
        compatibilityNote: "These transformations target complementary system primitives",
        strategicPowerScore: 7.0,
      });
    }
    if (existingClusters.length < 2 && cluster2Ids.length > 0) {
      existingClusters.push({
        id: "tc_2",
        name: `${product?.name || "System"} Efficiency Redesign`,
        description: `Secondary interventions that optimize delivery and reduce operational friction`,
        transformationIds: cluster2Ids,
        compatibilityNote: "These complement the core restructuring cluster",
        strategicPowerScore: 6.0,
      });
    }
  }
  next.transformationClusters = existingClusters;

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
  decomposition?: any,
): Record<string, unknown> {
  const topCluster = Array.isArray(analysis.transformationClusters) ? (analysis.transformationClusters as any[])[0] : null;
  const nonFilteredTransforms = Array.isArray(analysis.structuralTransformations)
    ? (analysis.structuralTransformations as any[]).filter((t: any) => !t.filtered)
    : [];
  const topTransform = nonFilteredTransforms[0] || null;

  // Build a real name from product context
  const productName = product?.name || "System";
  const category = product?.category || "";
  const primaryFriction = (analysis.frictionDimensions as any)?.primaryFriction || "";

  // Generate a meaningful concept name
  let conceptName = topCluster?.name;
  if (!conceptName || conceptName.includes("Reimagined")) {
    // Use the dominant transformation type + product context
    const dominantType = topTransform?.transformationType || "redesign";
    const verb = dominantType === "elimination" ? "Streamlined"
      : dominantType === "substitution" ? "Reimagined"
      : dominantType === "reordering" ? "Restructured"
      : "Unified";
    conceptName = `${verb} ${productName}${primaryFriction ? ` — ${primaryFriction.split(" ").slice(0, 3).join(" ")} Solved` : ""}`;
  }

  return {
    conceptName,
    tagline: topCluster?.description || `A first-principles ${isService ? "service" : "product"} reinvention of ${productName}`,
    coreInsight: topTransform
      ? `By applying ${topTransform.transformationType} to ${topTransform.targetPrimitiveLabel}, we unlock: ${topTransform.valueCreated}`
      : `Structural transformation of ${productName}'s core ${isService ? "delivery model" : "architecture"}`,
    radicalDifferences: nonFilteredTransforms.slice(0, 4).map((t: any) => t.proposedState || t.mechanism),
    physicalDescription: topTransform?.mechanism || `Fundamentally restructured ${isService ? "service experience" : "form factor and interaction"}`,
    sizeAndWeight: isService ? "Scalable digital-first model" : "Optimized for core use case",
    materials: nonFilteredTransforms.slice(0, 3).map((t: any) => t.mechanism || t.valueCreated),
    smartFeatures: nonFilteredTransforms.slice(0, 3).map((t: any) => `${t.transformationType}: ${(t.proposedState || "").slice(0, 60)}`),
    userExperienceTransformation: `Before: ${primaryFriction || "constrained by legacy patterns"}. After: friction removed through structural ${topTransform?.transformationType || "redesign"}.`,
    frictionEliminated: nonFilteredTransforms.slice(0, 3).map((t: any) => t.valueCreated || t.proposedState),
    whyItHasntBeenDone: "Incumbent economics, organizational inertia, and optimization of legacy architecture",
    biggestRisk: "Adoption risk — requires behavioral change from existing users and stakeholders",
    manufacturingPath: isService ? "Phased rollout: pilot → validate → scale over 12-18 months" : "Prototype → field validation → production tooling over 18-24 months",
    pricePoint: "Market-competitive with improved unit economics from structural efficiency gains",
    targetUser: `Users who directly experience the identified friction in ${category || productName}`,
    riskLevel: "Medium",
    capitalRequired: "Medium",
  };
}
