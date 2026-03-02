import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveMode, filterInputData, validateOutput, buildTrace, missingDataWarning, getModeGuardPrompt } from "../_shared/modeEnforcement.ts";
import { getReasoningFramework } from "../_shared/reasoningFramework.ts";
import { buildLensPrompt } from "../_shared/lensPrompt.ts";
import { enforceVisualContract } from "../_shared/visualFallback.ts";
import { buildValidationObject } from "../_shared/governedSchema.ts";
import { computeGovernedConfidence } from "../_shared/confidenceComputation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, analysisData, userSuggestions, lens, geoData, regulatoryData } = await req.json();
    const mode = resolveMode(product.analysisType, product.category);
    const filterResult = filterInputData(mode, { ...product, ...analysisData });
    console.log(`[ModeEnforcement] critical-validation | ${mode} | ${missingDataWarning(mode)}`);
    const modeGuard = getModeGuardPrompt(mode);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.
${getReasoningFramework()}

CORE PRINCIPLES:
- First-principles reasoning over analogy or convention
- Decompose every system into at least 3 layers of depth
- Never present modeled or inferred data as verified fact


OUTPUT RULES:
- Metrics must be ≤12 words
- Include leverage scores (1-10) on key assumptions
- Flag risk levels: [Risk: Low/Medium/High]
- Flag capital requirements: [Capital: Low/Medium/High]
- Use directional indicators: ↑ ↓ → for trends

You are a rigorous critical thinking analyst AND constructive strategist. You combine:
- Charlie Munger (inversion thinking, mental models, checklist discipline)
- Daniel Kahneman (cognitive biases, System 1 vs System 2)
- Ben Horowitz (hard truths about building products)
- Warren Buffett (risk assessment, margin of safety)
- Ray Dalio (radical transparency, stress testing)
- Y Combinator partners (pattern matching from 4000+ startups)

Your job: Take a product/service analysis and its redesigned concept and STRESS TEST it with SPECIFICITY and CONSTRUCTIVE rigor. 

CRITICAL RULES:
1. NEVER give generic dismissals like "undifferentiated offering" or "no competitive moat" without citing SPECIFIC evidence.
2. Every attack must name a specific constraint, market reality, or technical challenge — not just "it's generic."
3. For NOVEL concepts with no direct competitors, evaluate based on: customer behavior change required, technical complexity, market timing, and adjacent market signals — don't penalize innovation for being unprecedented.
4. Green Team should be genuinely constructive — find the real reasons this COULD work, including structural advantages of being first-to-market or creating a new category.
5. If the concept is truly novel, compare to ADJACENT category successes (e.g., how Airbnb had no direct competitor but could be compared to Couchsurfing + hotels).
6. IMPORTANT: If parts of the CURRENT product/service already have strong market fit, feasibility, or user loyalty, explicitly call that out. Not everything needs to change — identify what should be PRESERVED and what should be EVOLVED vs completely reinvented.

THE DIFFERENCE BETWEEN GENERIC AND USEFUL STRESS TESTING:
- BAD RED TEAM: "This is a generic, undifferentiated offering destined to fail" (lazy, unhelpful)
- GOOD RED TEAM: "The core challenge is customer education — users don't know they need this yet. Customer acquisition costs for new-category products average 3-5x higher than established categories (per a16z benchmarks)."
- BAD GREEN TEAM: "This could succeed with good execution" (empty)
- GOOD GREEN TEAM: "Category-creation plays like Peloton and Oura Ring show that passionate niche communities can drive viral adoption before mass-market awareness. The key metric is whether the first 100 users become evangelists."

Respond ONLY with a single valid JSON object — no markdown, no explanation.

The JSON must follow this EXACT structure:
{
  "redTeam": {
    "verdict": "One-line specific verdict citing the #1 concrete challenge (market reality, behavioral barrier, or technical constraint)",
    "arguments": [
      { "title": "Attack title", "argument": "Detailed argument citing SPECIFIC market realities, behavioral barriers, or technical constraints. Reference real data points where available. (2-3 sentences)", "severity": "critical|major|minor", "biasExposed": "Name of cognitive bias this exposes (e.g. Optimism Bias, Survivorship Bias)", "specificEvidence": "The specific data point, market reality, or constraint behind this attack" }
    ],
    "killShot": "The single most devastating challenge — must cite a specific market reality or behavioral barrier"
  },
  "blueTeam": {
    "verdict": "One-line compelling case — cite an analogous success if one exists, or explain the first-mover / new-category advantage",
    "arguments": [
      { "title": "Defense title", "argument": "Detailed argument citing market signals, behavioral trends, or analogous successes where available. For novel concepts, explain structural advantages of being first. (2-3 sentences)", "strength": "strong|moderate|conditional", "enabler": "What makes this possible (technology, market shift, cultural change, behavioral trend)", "proofPoint": "A real proof point — analogous success, demand signal, or structural advantage" }
    ],
    "moonshot": "The single strongest argument for transformative potential"
  },
  "counterExamples": [
    {
      "name": "Real product or company name",
      "outcome": "succeeded|failed|pivoted",
      "similarity": "How it relates to this concept — be specific about the structural parallel",
      "lesson": "Key takeaway for this redesign — what to copy or avoid",
      "year": "Year it happened",
      "revenue": "Revenue/funding/growth data if available"
    }
  ],
  "feasibilityChecklist": [
    {
      "category": "Technical|Manufacturing|Regulatory|Market|Financial|Talent",
      "item": "Specific thing to verify",
      "status": "critical|important|nice-to-have",
      "detail": "What exactly needs to be checked, WHO to ask, and WHERE to look",
      "estimatedCost": "Rough cost or time to verify"
    }
  ],
  "confidenceScores": {
    "technicalFeasibility": { "score": 7, "reasoning": "Cite specific technical precedent or constraint" },
    "marketDemand": { "score": 6, "reasoning": "Cite specific demand signals: search volume, community size, comparable sales data" },
    "competitiveAdvantage": { "score": 8, "reasoning": "Name the specific moat and how long it lasts before competitors copy it" },
    "executionComplexity": { "score": 5, "reasoning": "Name the hardest operational challenge and who has solved it before (lower = harder)" },
    "overallViability": { "score": 7, "reasoning": "Synthesized assessment with the single most important factor" }
  },
  "strategicRecommendations": [
    "Specific strategic recommendation 1 — what to do FIRST and why, with a named validation method",
    "Recommendation 2 — a specific pivot option if the primary strategy fails",
    "Recommendation 3 — the cheapest way to validate demand before investing ($X budget, Y timeline)"
  ],
  "currentApproachAssessment": {
    "keepAsIs": ["Element of current product/service that should NOT change — explain why it already has strong market fit or feasibility"],
    "adaptNotReplace": ["Element that should be evolved/improved but not completely replaced — explain what to change and what to keep"],
    "fullyReinvent": ["Element that genuinely needs to be rethought from scratch — explain why the current approach is fundamentally broken"],
    "verdict": "Overall: should this be a radical reinvention, a strategic evolution, or a focused improvement on specific weak points? Be honest — sometimes the current approach is 70% right."
  },
  "blindSpots": [
    "Critical blind spot 1 — be specific about what data is missing and where to find it",
    "Blind spot 2",
    "Blind spot 3"
  ],
  "visualSpecs": [
    {
      "visual_type": "constraint_map | causal_chain | leverage_hierarchy",
      "title": "Short title for the visual",
      "nodes": [
        { "id": "node_id", "label": "Node label", "type": "constraint|effect|leverage|intervention|outcome", "priority": 1 }
      ],
      "edges": [
        { "from": "source_id", "to": "target_id", "relationship": "causes|relaxed_by|implemented_by|produces", "label": "optional edge label" }
      ],
      "layout": "linear | vertical | hierarchical",
      "interpretation": "One sentence explaining what limits performance and where to intervene"
    }
  ],
  "actionPlans": [
    {
      "initiative": "Initiative name",
      "objective": "What this achieves",
      "leverage_type": "optimization | structural_improvement | redesign",
      "mechanism": "How this creates change (one sentence)",
      "complexity": "low | medium | high",
      "time_horizon": "near_term | mid_term | long_term",
      "risk": { "execution": "execution risk", "adoption": "adoption risk", "market": "market risk" },
      "validation": "Minimum viable test to validate",
      "decision_readiness": 3,
      "confidence": "high | medium | exploratory"
    }
  ],
  "governed": {
    "falsification": {
      "falsification_conditions": ["specific condition that would prove this model wrong"],
      "redesign_invalidation_evidence": ["evidence that would invalidate the proposed redesign"],
      "adoption_failure_conditions": ["conditions under which user adoption fails"],
      "economic_collapse_scenario": "specific scenario where unit economics collapse",
      "model_fragility_score": 45
    },
    "decision_synthesis": {
      "decision_grade": "decision_grade|conditional|blocked",
      "confidence_score": 55,
      "blocking_uncertainties": ["key uncertainty that blocks decision"],
      "fastest_validation_experiment": "cheapest test to validate viability — under $500, specific method",
      "next_required_evidence": "what evidence would change the assessment"
    }
  }
}`;

    const userPrompt = `STRESS TEST this product/service redesign concept with SPECIFIC, EVIDENCE-BASED analysis.

PRODUCT/SERVICE: ${product.name}
CATEGORY: ${product.category}

REDESIGNED CONCEPT: ${analysisData.redesignedConcept?.conceptName || "Unknown"}
TAGLINE: ${analysisData.redesignedConcept?.tagline || "N/A"}
CORE INSIGHT: ${analysisData.redesignedConcept?.coreInsight || "N/A"}
KEY DIFFERENCES: ${JSON.stringify(analysisData.redesignedConcept?.radicalDifferences || [])}
PHYSICAL FORM / DELIVERY: ${analysisData.redesignedConcept?.physicalDescription || "N/A"}
MATERIALS / CAPABILITIES: ${JSON.stringify(analysisData.redesignedConcept?.materials || [])}
SMART FEATURES: ${JSON.stringify(analysisData.redesignedConcept?.smartFeatures || [])}
PRICE POINT: ${analysisData.redesignedConcept?.pricePoint || "N/A"}
TARGET USER: ${analysisData.redesignedConcept?.targetUser || "N/A"}
MANUFACTURING / IMPLEMENTATION: ${analysisData.redesignedConcept?.manufacturingPath || "N/A"}
BIGGEST RISK: ${analysisData.redesignedConcept?.biggestRisk || "N/A"}

MARKET CONTEXT:
- Market Size: ${product.marketSizeEstimate || "Unknown"}
- Key Insight: ${product.keyInsight || "N/A"}
- Trend Analysis: ${product.trendAnalysis || "N/A"}
- Competitors: ${JSON.stringify(product.competitors || [])}
- Competitor Gaps: ${JSON.stringify((product as { competitorAnalysis?: { gaps?: string[] } }).competitorAnalysis?.gaps || [])}
- Pricing Intel: ${JSON.stringify(product.pricingIntel || {})}

COMMUNITY DATA:
- Top Complaints: ${JSON.stringify((product as { communityInsights?: { topComplaints?: string[] } }).communityInsights?.topComplaints || [])}
- Improvement Requests: ${JSON.stringify((product as { communityInsights?: { improvementRequests?: string[] } }).communityInsights?.improvementRequests || [])}
- Social Signals: ${JSON.stringify(product.socialSignals || [])}

HIDDEN ASSUMPTIONS IDENTIFIED:
${analysisData.hiddenAssumptions?.map((a: { assumption: string }) => "• " + a.assumption).join("\n") || "None"}

FLIPPED LOGIC:
${analysisData.flippedLogic?.map((f: { originalAssumption: string; boldAlternative: string }) => "• " + f.originalAssumption + " → " + f.boldAlternative).join("\n") || "None"}

CRITICAL INSTRUCTIONS:
1. RED TEAM: Be SPECIFIC. Every attack must name a real competitor, cite a real market data point, or identify a specific technical constraint. NO generic dismissals.
2. GREEN TEAM: Be EVIDENCE-BASED. Every defense must cite a real analogous success (company name, revenue/growth data, year).
3. COUNTER-EXAMPLES: Use REAL companies/products — no fabrication. Include year AND revenue/funding data. Pick examples that are STRUCTURALLY similar, not just thematically similar.
4. FEASIBILITY CHECKLIST: Actionable items with cost estimates. Tell me WHO to call, WHERE to look, WHAT to test.
5. CONFIDENCE SCORES: 1-10, evidence-based. Each score must cite specific evidence. Don't default to middle scores — take a position.
6. STRATEGIC RECOMMENDATIONS: Give 3 specific next steps, including the CHEAPEST way to validate demand (under $500).
7. BLIND SPOTS: What data is missing? Where would you find it?
8. Provide 4-6 arguments for both Red and Green teams.
9. Provide 3-5 counter-examples, 6-10 feasibility items, and 3-4 blind spots.

10. VISUAL SPECS: Generate 1 visual spec (constraint_map or causal_chain) for the dominant risk/opportunity structure. Generate 2-3 action plans for highest-leverage next steps. Only generate visuals when structural causality is clear.
${geoData ? `
GEOGRAPHIC MARKET DATA (from US Census ACS & World Bank — use these REAL data points in your analysis):
- Data Sources: ${JSON.stringify(geoData.dataSources || {})}
- US Total Population: ${geoData.us?.totalPopulation?.toLocaleString() || "N/A"}
- US Avg Median Income: $${geoData.us?.avgMedianIncome?.toLocaleString() || "N/A"}
- US Business Establishments in Category: ${geoData.us?.totalEstablishments?.toLocaleString() || "N/A"}
- US Employees in Category: ${geoData.us?.totalEmployees?.toLocaleString() || "N/A"}
- Top 5 US States by Opportunity: ${JSON.stringify((geoData.us?.topStates || []).slice(0, 5).map((s: any) => ({ state: s.name, pop: s.population, income: s.medianIncome, bizDensity: s.bizPerCapita, score: s.opportunityScore })))}
- Bottom 3 US States: ${JSON.stringify((geoData.us?.bottomStates || []).slice(0, 3).map((s: any) => ({ state: s.name, score: s.opportunityScore })))}
- Top 5 Global Markets: ${JSON.stringify((geoData.global?.topMarkets || []).slice(0, 5).map((c: any) => ({ country: c.name, gdpPC: c.gdpPerCapita, popGrowth: c.populationGrowth, urbanRate: c.urbanizationRate, score: c.opportunityScore })))}

IMPORTANT: Use these real geographic data points to:
- Identify geographic concentration risks in Red Team arguments
- Support TAM estimates with real population and income data
- Flag competitive density warnings using business establishment counts
- Recommend specific geographic launch strategies in recommendations
` : ""}
${regulatoryData && regulatoryData.regulatoryRelevance !== "none" ? `
REGULATORY & LEGAL INTELLIGENCE (REAL DATA — use these in Red Team/Green Team arguments):
- Regulatory Relevance: ${regulatoryData.regulatoryRelevance?.toUpperCase()}
- Regulated Category: ${regulatoryData.matchedCategory}
- Governing Agencies: ${(regulatoryData.agencies || []).join(", ")}
- Active Rulemaking (Federal Register): ${JSON.stringify((regulatoryData.activeRulemaking || []).slice(0, 3).map((r: any) => ({ title: r.title, type: r.type, date: r.publishedDate, agencies: r.agencyNames })))}
- State-Level Variance: ${JSON.stringify((regulatoryData.stateVariance || []).slice(0, 3))}
- Key Regulatory Risks: ${JSON.stringify(regulatoryData.risks || [])}
- Web-Sourced Regulatory Insights: ${JSON.stringify((regulatoryData.firecrawlInsights || []).slice(0, 3).map((i: any) => ({ title: i.title, snippet: i.snippet?.slice(0, 200) })))}

IMPORTANT: Use this REAL regulatory data to:
- Red Team: Cite specific regulatory barriers, licensing requirements, state-by-state legal variance as concrete obstacles
- Green Team: Identify states/jurisdictions with favorable regulatory environments as strategic entry points
- Feasibility Checklist: Include specific regulatory compliance items with real agency names and requirements
- Blind Spots: Flag missing regulatory data (e.g., pending state legislation, enforcement patterns)
` : ""}
Return ONLY the JSON object.${buildLensPrompt(lens)}`;

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
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

    let validation;
    try {
      validation = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr);
      console.error("Raw content (first 500):", cleaned.slice(0, 500));
      throw new Error("AI returned invalid JSON. Please retry.");
    }

    enforceVisualContract(validation);

    // ── Governed: build validation object for checkpoint gates ──
    const governed = validation.governed || {};
    const governedValidation = buildValidationObject("critical-validation", governed, [
      "falsification", "decision_synthesis"
    ]);
    console.log(`[Governed] Validation:`, JSON.stringify(governedValidation));

    // ── RUNTIME ENFORCEMENT: Return 422 if governed validation fails ──
    if (!governedValidation.validation_passed) {
      console.error(`[Governed] CHECKPOINT BLOCKED: ${governedValidation.blocking_reason_if_any}`);
      return new Response(JSON.stringify({
        success: false,
        error: "Governed validation failed — required reasoning artifacts missing",
        _governedValidation: governedValidation,
        validation,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Deep validation ──
    const { deepValidateGoverned } = await import("../_shared/governedSchema.ts");
    const deepValidation = deepValidateGoverned(governed);
    if (!deepValidation.validation_passed) {
      console.error(`[Governed] DEEP VALIDATION FAILED: ${deepValidation.blocking_reason_if_any}`);
      return new Response(JSON.stringify({
        success: false,
        error: "Governed deep validation failed — structural artifacts incomplete",
        _governedValidation: deepValidation,
        validation,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Evidence-governed confidence computation ──
    const confidenceResult = computeGovernedConfidence(governed);
    console.log(`[Governed] critical-validation computed confidence: ${confidenceResult.computation_trace}`);
    if (governed.decision_synthesis) {
      const ds = governed.decision_synthesis as Record<string, unknown>;
      ds.confidence_score = confidenceResult.computed_confidence;
      ds.decision_grade = confidenceResult.computed_decision_grade;
      ds._confidence_computation = confidenceResult.computation_trace;
      ds._evidence_distribution = confidenceResult.evidence_distribution;
    }

    // ── Output Validation ──
    const validationResult = validateOutput(mode, validation);
    const trace = buildTrace(mode, filterResult, validationResult);
    console.log(`[ModeEnforcement] Trace:`, JSON.stringify(trace));

    return new Response(JSON.stringify({ success: true, validation, _modeTrace: trace, _governedValidation: governedValidation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("critical-validation error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
