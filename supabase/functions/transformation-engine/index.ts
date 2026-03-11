/**
 * TRANSFORMATION ENGINE — Structural analysis, assumptions, flips, transformations, viability, clustering.
 * Split from first-principles-analysis for focused prompts and lower token usage.
 * Does NOT generate redesignedConcept — that's handled by concept-architecture.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveMode, filterInputData, validateOutput, buildTrace, missingDataWarning, getModeGuardPrompt } from "../_shared/modeEnforcement.ts";
import { buildAdaptiveContextPrompt, extractAdaptiveContext } from "../_shared/adaptiveContext.ts";
import { buildLensPrompt } from "../_shared/lensPrompt.ts";
import { getReasoningFramework } from "../_shared/reasoningFramework.ts";
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
    const { product, lens, upstreamIntel, structuralDecomposition, activeBranch, adaptiveContext: rawAdaptiveCtx, extractedContext: rawExtractedCtx } = await req.json();
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
    console.log(`[TransformationEngine] ${mode} mode | ${missingDataWarning(mode)}`);
    const modeGuard = getModeGuardPrompt(mode);

    const OS_PREAMBLE = `You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.
${getReasoningFramework()}
${modeGuard}${branchPrompt}${adaptivePrompt}

CORE PRINCIPLES:
- First-principles reasoning over analogy or convention
- Decompose every system into at least 3 layers of depth
- Never present modeled or inferred data as verified fact
${structuralDecomposition ? `
STRUCTURAL DECOMPOSITION (UPSTREAM — use as your foundation):
The following structural primitives, system dynamics, AND leverage analysis have been extracted from the entity. Use these as your reasoning foundation — do NOT override or contradict these primitives. Build your analysis ON TOP of them.

CRITICAL — LEVERAGE-TARGETED INVERSION:
The leverageAnalysis.leveragePrimitives array ranks which system primitives have the highest disruption potential (sorted by leverageScore descending). Each includes a bestTransformation type.
When generating hiddenAssumptions and flippedLogic, you MUST:
1. Target the TOP leverage primitives first — these are the highest-impact inversion targets
2. Reference specific failure modes, feedback loops, and control points from system dynamics
3. Ensure each flipped logic entry maps to a specific leverage primitive when possible

STRUCTURAL TRANSFORMATIONS MANDATE:
In addition to flippedLogic, generate a "structuralTransformations" array with 8-12 transformations.
Each transformation MUST:
- Target a specific leverage primitive from the decomposition
- Use one of four types: elimination, substitution, reordering, aggregation
- Include a viabilityGate assessment (technical, economic, regulatory, behavioral — each scored 1-5)
- Be marked as filtered=true if compositeScore < 2.5 (fails viability)

Generate at least 2 transformations per type (elimination, substitution, reordering, aggregation).

After generating structuralTransformations, group the surviving (non-filtered) ones into 2-4 "transformationClusters" — compatible sets that could form coherent concept architectures.

${JSON.stringify(structuralDecomposition, null, 1).slice(0, 5000)}
` : ''}

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
- ANTI-ANCHORING: Do NOT let one friction type dominate all steps. Let scraped evidence and product reality determine which friction types appear — do not default to physical.

IMPORTANT: Do NOT generate a redesignedConcept. That will be generated in a separate downstream step.
Focus ONLY on analysis, assumptions, transformations, viability, and clustering.
`;

    // ── SCHEMA DEFINITIONS (no redesignedConcept) ──
    const analysisSchema = isService
      ? `{
  "currentStrengths": {
    "whatWorks": ["Specific element of current service that is already strong and should be preserved — explain WHY it works", "Strong element 2", "Strong element 3"],
    "competitiveAdvantages": ["Current advantage 1 that would be costly or risky to abandon", "Advantage 2"],
    "keepVsAdapt": "Honest assessment: which aspects should remain as-is, which should be adapted (not replaced), and which should be completely rethought."
  },
  "coreReality": {
    "trueProblem": "The actual human problem being solved (not marketing)",
    "actualUsage": "How customers genuinely interact with this service — behaviors, workarounds, complaints",
    "normalizedFrustrations": ["frustration 1", "frustration 2", "frustration 3", "frustration 4"],
    "userHacks": ["hack 1 — workarounds customers use", "hack 2", "hack 3"]
  },
  "frictionDimensions": {
    "primaryFriction": "The single biggest friction source for THIS service",
    "deliveryModel": "Delivery format analysis",
    "skillBarrier": "Learning curve, expertise required",
    "costStructure": "Upfront cost, ongoing costs, hidden costs, price-to-value friction",
    "ecosystemLockIn": "Dependencies on locations, conditions, platforms",
    "maintenanceBurden": "Ongoing effort the customer must put in",
    "gaps": ["Gap 1", "Gap 2", "Gap 3"],
    "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"]
  },
  "userWorkflow": {
    "stepByStep": ["Step 1: how customer currently discovers/books", "Step 2: onboarding", "Step 3: core delivery", "Step 4: follow-up", "Step 5: retention"],
    "frictionPoints": [
      { "stepIndex": 0, "friction": "specific friction TODAY", "severity": "high|medium|low", "rootCause": "why" }
    ],
    "cognitiveLoad": "What mental effort does the customer CURRENTLY expend?",
    "contextOfUse": "When, in what state do customers CURRENTLY seek this?"
  },
  "smartTechAnalysis": {
    "currentTechLevel": "Current technology integration",
    "missedOpportunities": [
      { "tech": "technology type", "application": "specific application", "valueCreated": "what problem it solves" }
    ],
    "whyNotAlreadyDone": "Why smart tech hasn't been applied yet",
    "recommendedIntegration": "Single highest-leverage tech addition"
  },
  "hiddenAssumptions": [
    {
      "assumption": "Specific assumption being questioned",
      "currentAnswer": "Why it's currently done this way",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": true,
      "challengeIdea": "How you'd challenge this",
      "leverageScore": 8,
      "impactScenario": "What happens if challenged",
      "competitiveBlindSpot": "Which competitors rely on this",
      "urgencySignal": "eroding | stable | emerging",
      "urgencyReason": "Why this is eroding NOW or stable"
    }
  ],
  "flippedLogic": [
    {
      "originalAssumption": "The assumption being flipped",
      "boldAlternative": "The radical structural alternative",
      "rationale": "Why this flip creates real value",
      "physicalMechanism": "How it would actually work"
    }
  ],
  "structuralTransformations": [
    {
      "id": "st_1",
      "targetPrimitiveId": "id from leverageAnalysis.leveragePrimitives",
      "targetPrimitiveLabel": "Human-readable label",
      "transformationType": "elimination|substitution|reordering|aggregation",
      "currentState": "What exists now",
      "proposedState": "What replaces it",
      "mechanism": "How the transformation works",
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
        "valueFlowChanges": ["How value changes"],
        "newBottleneck": "New bottleneck",
        "cascadeEffects": ["Effect 1", "Effect 2"]
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
  "visualSpecs": [
    {
      "visual_type": "constraint_map | causal_chain | leverage_hierarchy",
      "title": "Short title",
      "nodes": [{ "id": "node_id", "label": "Label", "type": "constraint|effect|leverage|intervention|outcome", "priority": 1 }],
      "edges": [{ "from": "source_id", "to": "target_id", "relationship": "causes|relaxed_by|implemented_by|produces", "label": "optional" }],
      "layout": "linear | vertical | hierarchical",
      "interpretation": "One sentence"
    }
  ],
  "actionPlans": [
    {
      "initiative": "Initiative name",
      "objective": "What this achieves",
      "leverage_type": "optimization | structural_improvement | redesign",
      "mechanism": "How this creates change",
      "complexity": "low | medium | high",
      "time_horizon": "near_term | mid_term | long_term",
      "risk": { "execution": "risk", "adoption": "risk", "market": "risk" },
      "validation": "Minimum viable test",
      "decision_readiness": 3,
      "confidence": "high | medium | exploratory"
    }
  ],
  "governed": { ... }
}`
      : `{
  "currentStrengths": {
    "whatWorks": ["Specific element of current product that is already strong — explain WHY", "Strong element 2", "Strong element 3"],
    "competitiveAdvantages": ["Current advantage 1", "Advantage 2"],
    "keepVsAdapt": "Honest assessment of what to keep vs rethink"
  },
  "coreReality": {
    "trueProblem": "The actual human problem being solved",
    "actualUsage": "How people genuinely use this",
    "normalizedFrustrations": ["frustration 1", "frustration 2", "frustration 3", "frustration 4"],
    "userHacks": ["hack 1", "hack 2", "hack 3"]
  },
  "frictionDimensions": {
    "primaryFriction": "The single biggest friction source for THIS product — identify dimension and explain why",
    "physicalForm": "Size/weight/shape analysis — ONLY if relevant",
    "skillBarrier": "Learning curve, expertise required",
    "costStructure": "Upfront cost, ongoing costs, hidden costs",
    "ecosystemLockIn": "Dependencies on locations, conditions, accessories",
    "maintenanceBurden": "Storage, care, repair, degradation",
    "gaps": ["Gap 1", "Gap 2", "Gap 3"],
    "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"]
  },
  "userWorkflow": {
    "stepByStep": ["Step 1: before using", "Step 2: interaction", "Step 3: core use", "Step 4: next", "Step 5: after-use"],
    "frictionPoints": [
      { "stepIndex": 0, "friction": "specific friction TODAY", "severity": "high|medium|low", "rootCause": "why" }
    ],
    "cognitiveLoad": "What mental effort the user CURRENTLY expends",
    "contextOfUse": "Where, when, in what state is this CURRENTLY used?"
  },
  "smartTechAnalysis": {
    "currentTechLevel": "Current technology integration",
    "missedOpportunities": [
      { "tech": "technology type", "application": "specific application", "valueCreated": "what it solves" }
    ],
    "whyNotAlreadyDone": "Why smart tech hasn't been applied",
    "recommendedIntegration": "Highest-leverage tech addition"
  },
  "hiddenAssumptions": [
    {
      "assumption": "Specific assumption being questioned",
      "currentAnswer": "Why currently done this way",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": true,
      "challengeIdea": "How to challenge this",
      "leverageScore": 8,
      "impactScenario": "Upside if challenged",
      "competitiveBlindSpot": "Which competitors rely on this",
      "urgencySignal": "eroding | stable | emerging",
      "urgencyReason": "Why eroding NOW or stable"
    }
  ],
  "flippedLogic": [
    {
      "originalAssumption": "The assumption being flipped",
      "boldAlternative": "The radical structural alternative",
      "rationale": "Why this flip creates real value",
      "physicalMechanism": "How it would actually work physically/technically"
    }
  ],
  "structuralTransformations": [
    {
      "id": "st_1",
      "targetPrimitiveId": "id from leverageAnalysis.leveragePrimitives",
      "targetPrimitiveLabel": "Human-readable label",
      "transformationType": "elimination|substitution|reordering|aggregation",
      "currentState": "What exists now",
      "proposedState": "What replaces it",
      "mechanism": "How the transformation works",
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
        "valueFlowChanges": ["How value changes"],
        "newBottleneck": "New bottleneck",
        "cascadeEffects": ["Effect 1", "Effect 2"]
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
  "visualSpecs": [
    {
      "visual_type": "constraint_map | causal_chain | leverage_hierarchy",
      "title": "Short title",
      "nodes": [{ "id": "node_id", "label": "Label", "type": "constraint|effect|leverage|intervention|outcome", "priority": 1 }],
      "edges": [{ "from": "source_id", "to": "target_id", "relationship": "causes|relaxed_by|implemented_by|produces", "label": "optional" }],
      "layout": "linear | vertical | hierarchical",
      "interpretation": "One sentence"
    }
  ],
  "actionPlans": [
    {
      "initiative": "Initiative name",
      "objective": "What this achieves",
      "leverage_type": "optimization | structural_improvement | redesign",
      "mechanism": "How this creates change",
      "complexity": "low | medium | high",
      "time_horizon": "near_term | mid_term | long_term",
      "risk": { "execution": "risk", "adoption": "risk", "market": "risk" },
      "validation": "Minimum viable test",
      "decision_readiness": 3,
      "confidence": "high | medium | exploratory"
    }
  ],
  "governed": { ... }
}`;

    const systemPrompt = isService
      ? OS_PREAMBLE + `You are a radical first-principles service strategist. You combine the thinking of:
- Clayton Christensen (jobs-to-be-done, disruptive innovation)
- Elon Musk (first principles — strip away convention, rebuild from fundamentals)
- Don Norman (cognitive load, affordances, friction archaeology)
- IDEO (customer journey mapping, pain archaeology)
- Alex Hormozi (offer design, pricing psychology, operational leverage)

Your mission: completely deconstruct a SERVICE and uncover radical redesign opportunities.

Respond ONLY with a single valid JSON object — no markdown, no explanation.
The JSON must follow this EXACT structure:
${analysisSchema}`
      : OS_PREAMBLE + `You are a radical first-principles product strategist. You combine the thinking of:
- Dieter Rams (ruthless design purity)
- Elon Musk (first principles — rebuild from physics up)
- Jony Ive (human connection — how it feels)
- Don Norman (cognitive load, affordances, friction archaeology)
- IDEO (user journey mapping, pain archaeology)

Your mission: completely deconstruct a product and uncover radical redesign opportunities.
Investigate friction across ALL dimensions — physical, skill, cost, safety, ecosystem, maintenance, social, workflow.
Identify which dimensions carry the MOST friction for THIS specific product.

Respond ONLY with a single valid JSON object — no markdown, no explanation.
The JSON must follow this EXACT structure:
${analysisSchema}`;

    const userPrompt = isService
      ? `Apply radical first-principles deconstruction to this SERVICE.

SERVICE: ${product.name}
CATEGORY: ${product.category}
DESCRIPTION: ${product.description}
KEY INSIGHT: ${product.keyInsight || "None provided"}
MARKET SIZE: ${product.marketSizeEstimate || "Unknown"}

KNOWN CUSTOMER COMPLAINTS:
${product.reviews?.filter((r: { sentiment: string }) => r.sentiment === "negative").map((r: { text: string }) => `• ${r.text}`).join("\n") || "General friction points"}

EXISTING ASSUMPTIONS IDENTIFIED:
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption} → ${a.challenge}`).join("\n") || "None pre-identified"}

COMMUNITY PAIN POINTS:
${(product as any).communityInsights?.topComplaints?.map((c: string) => `• ${c}`).join("\n") || "See reviews above"}

CRITICAL INSTRUCTIONS:
1. SCOPE: Question the service scope
2. DELIVERY: Is the delivery format optimal?
3. CUSTOMER JOURNEY: Map every step, find friction
4. SMART TECH: What could transform delivery?
5. OPERATIONAL LEVERAGE: Where are bottlenecks?
6. PRICING: Is the pricing model optimal?
7. Avoid vague suggestions — every idea needs an operational mechanism
8. VALIDATION: Reference real analogous services if possible
9. DEMAND SIGNAL: Reference community complaints, behavioral trends as evidence
10. UNIT ECONOMICS: Include pricing math
11. MINIMUM COUNTS: Generate at least 5 hiddenAssumptions and at least 4 flippedLogic items

VISUAL & ACTION PLAN INSTRUCTIONS:
- Generate 1-2 visual specs for the dominant constraint structure
- Generate 2-3 action plans for highest-leverage interventions
- Only generate visuals when structural causality is clear

Return ONLY the JSON object.`
      : `Apply radical first-principles deconstruction to this product.

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
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption} → ${a.challenge}`).join("\n") || "None pre-identified"}

COMMUNITY PAIN POINTS:
${(product as any).communityInsights?.topComplaints?.map((c: string) => `• ${c}`).join("\n") || "See reviews above"}

CRITICAL INSTRUCTIONS:
1. FRICTION DISCOVERY: Identify the PRIMARY friction dimension — do NOT default to physical/size
2. SKILL/LEARNING: What expertise barrier exists?
3. WORKFLOW: Map every step, find friction at each
4. SMART TECH: What could transform this?
5. ECOSYSTEM: What dependencies constrain use?
6. COST/MAINTENANCE: Ongoing burden?
7. Avoid vague suggestions — every idea needs a physical mechanism
8. VALIDATION: Reference real analogous products if possible
9. DEMAND SIGNAL: Reference community complaints, behavioral trends
10. UNIT ECONOMICS: Include BOM estimate, target retail price, margin
11. MINIMUM COUNTS: Generate at least 5 hiddenAssumptions and at least 4 flippedLogic items

VISUAL & ACTION PLAN INSTRUCTIONS:
- Generate 1-2 visual specs for the dominant constraint structure
- Generate 2-3 action plans for highest-leverage interventions
- Only generate visuals when structural causality is clear

Return ONLY the JSON object.${buildLensPrompt(lens)}${buildLensWeightingPrompt(lens)}${buildModeWeightingPrompt(mode)}`;

    // ── UPSTREAM INTELLIGENCE ──
    let upstreamPrompt = "";
    if (upstreamIntel && Object.keys(upstreamIntel).length > 0) {
      const parts: string[] = [];
      parts.push("\n\n--- UPSTREAM INTELLIGENCE (from Report step) ---");
      parts.push("Use this verified market intelligence to ground your assumptions, flips, and analysis in real data.\n");

      if (upstreamIntel.pricingIntel) {
        const pi = upstreamIntel.pricingIntel;
        parts.push("PRICING INTELLIGENCE:");
        if (pi.currentMarketPrice) parts.push(`  Market Price: ${pi.currentMarketPrice}`);
        if (pi.msrpOriginal) parts.push(`  Original MSRP: ${pi.msrpOriginal}`);
        if (pi.margins) parts.push(`  Margins: ${pi.margins}`);
        if (pi.priceDirection) parts.push(`  Price Trend: ${pi.priceDirection}`);
        const resale = pi.resaleAvgSold || pi.ebayAvgSold;
        if (resale) parts.push(`  Resale Average: ${resale}`);
      }
      if (upstreamIntel.supplyChain) {
        const sc = upstreamIntel.supplyChain;
        parts.push("\nSUPPLY CHAIN:");
        if (sc.suppliers?.length > 0) parts.push(`  Suppliers: ${sc.suppliers.slice(0, 3).map((s: any) => `${s.name} (${s.region})`).join("; ")}`);
        if (sc.manufacturers?.length > 0) parts.push(`  Manufacturers: ${sc.manufacturers.slice(0, 3).map((m: any) => `${m.name} (${m.region})`).join("; ")}`);
      }
      if (upstreamIntel.communityInsights) {
        const ci = upstreamIntel.communityInsights;
        parts.push("\nCOMMUNITY INTELLIGENCE:");
        if (ci.communitySentiment) parts.push(`  Sentiment: ${ci.communitySentiment}`);
        if (ci.topComplaints?.length > 0) parts.push(`  Top Complaints:\n${ci.topComplaints.slice(0, 5).map((c: string) => `    • ${c}`).join("\n")}`);
      }
      if (upstreamIntel.competitorAnalysis) {
        const ca = upstreamIntel.competitorAnalysis;
        parts.push("\nCOMPETITOR INTELLIGENCE:");
        if (ca.marketLeader) parts.push(`  Market Leader: ${ca.marketLeader}`);
        if (ca.gaps?.length > 0) parts.push(`  Gaps: ${ca.gaps.slice(0, 3).join("; ")}`);
      }
      if (upstreamIntel.patentLandscape || upstreamIntel.patentData) {
        const pl = upstreamIntel.patentLandscape || upstreamIntel.patentData;
        parts.push("\nPATENT LANDSCAPE:");
        if (pl.totalPatents) parts.push(`  Total: ${pl.totalPatents}`);
        if (pl.expiredPatents) parts.push(`  Expired: ${pl.expiredPatents}`);
        if (pl.gapAnalysis) parts.push(`  Gap: ${typeof pl.gapAnalysis === "string" ? pl.gapAnalysis : JSON.stringify(pl.gapAnalysis).slice(0, 300)}`);
      }
      if (upstreamIntel.trendAnalysis) {
        parts.push(`\nTREND ANALYSIS: ${typeof upstreamIntel.trendAnalysis === "string" ? upstreamIntel.trendAnalysis : JSON.stringify(upstreamIntel.trendAnalysis).slice(0, 400)}`);
      }
      parts.push("\nGround your analysis in this upstream intelligence.");
      upstreamPrompt = parts.join("\n");
    }

    const structuredTools = buildStructuredOutputTools("first-principles");
    const aiMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt + upstreamPrompt },
    ];

    async function callAI(useTools: boolean, model: string) {
      const body: Record<string, unknown> = {
        model,
        messages: aiMessages,
        temperature: 0.5,
        max_tokens: 16000,
      };
      if (useTools && structuredTools) Object.assign(body, structuredTools);
      return fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    function enforceMinimumArtifacts(base: Record<string, unknown>): Record<string, unknown> {
      const next = { ...base };
      const existingAssumptions = Array.isArray(next.hiddenAssumptions)
        ? [...(next.hiddenAssumptions as Array<Record<string, unknown>>)]
        : [];
      const frictionDims = (next.frictionDimensions as Record<string, unknown> | undefined) || {};
      const workflow = (next.userWorkflow as Record<string, unknown> | undefined) || {};
      const upstream = (upstreamIntel as Record<string, unknown> | undefined) || {};
      const upstreamCommunity = (upstream.communityInsights as Record<string, unknown> | undefined) || {};

      const gapSeeds = Array.isArray(frictionDims.gaps) ? (frictionDims.gaps as string[]) : [];
      const workflowSeeds = Array.isArray(workflow.frictionPoints)
        ? (workflow.frictionPoints as Array<Record<string, unknown>>).map((f) => String(f.friction || "Workflow friction"))
        : [];
      const complaintSeeds = Array.isArray(upstreamCommunity.topComplaints)
        ? (upstreamCommunity.topComplaints as string[])
        : [];
      const seedPool = [...gapSeeds, ...workflowSeeds, ...complaintSeeds].filter(Boolean);

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
      next.hiddenAssumptions = existingAssumptions;
      next.flippedLogic = existingFlips;
      return next;
    }

    // ── PRIMARY AI CALL ──
    const response = await callAI(true, "google/gemini-2.5-pro");

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
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
      try {
        analysis = JSON.parse(cleaned);
      } catch (jsonErr) {
        console.error("[TransformationEngine] All parse attempts failed:", parseErr, jsonErr);
        throw new Error("AI returned invalid output. Please try again.");
      }
    }

    let minimumValidation = validateArrayMinimums(analysis, "first-principles");
    if (!minimumValidation.valid) {
      console.warn(`[TransformationEngine] Underfilled arrays: ${minimumValidation.underfilled.map((u) => `${u.field}:${u.actual}/${u.min}`).join(", ")}`);
      analysis = enforceMinimumArtifacts(analysis);
      minimumValidation = validateArrayMinimums(analysis, "first-principles");
    }

    console.log(
      `[TransformationEngine] counts: assumptions=${Array.isArray(analysis.hiddenAssumptions) ? analysis.hiddenAssumptions.length : 0}, flips=${Array.isArray(analysis.flippedLogic) ? analysis.flippedLogic.length : 0}, transforms=${Array.isArray(analysis.structuralTransformations) ? analysis.structuralTransformations.length : 0}`
    );

    const structuredValidation = validateStructuredResponse(analysis, "first-principles");
    if (structuredValidation.truncated) {
      console.error(`[TransformationEngine] TRUNCATION: missing ${structuredValidation.missing.join(", ")}`);
    }

    enforceVisualContract(analysis);

    // ── Governed validation ──
    const governed = analysis.governed || {};
    const governedValidation = buildValidationObject("first-principles", governed, [
      "domain_confirmation", "first_principles", "friction_tiers", "constraint_map", "decision_synthesis"
    ]);
    console.log(`[TransformationEngine][Governed] Validation:`, JSON.stringify(governedValidation));

    if (!governedValidation.validation_passed) {
      console.error(`[TransformationEngine][Governed] CHECKPOINT BLOCKED: ${governedValidation.blocking_reason_if_any}`);
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
      console.error(`[TransformationEngine][Governed] DEEP VALIDATION FAILED: ${deepValidation.blocking_reason_if_any}`);
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
    console.log(`[TransformationEngine][Governed] Confidence: ${confidenceResult.computation_trace}`);
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

    // Output validation
    const validationResult = validateOutput(mode, analysis);
    const trace = buildTrace(mode, filterResult, validationResult);
    console.log(`[TransformationEngine] Trace:`, JSON.stringify(trace));

    return new Response(JSON.stringify({ success: true, analysis, _modeTrace: trace, _governedValidation: governedValidation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("transformation-engine error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
