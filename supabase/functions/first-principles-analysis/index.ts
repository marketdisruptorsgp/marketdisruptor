import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveMode, filterInputData, validateOutput, buildTrace, missingDataWarning, getModeGuardPrompt } from "../_shared/modeEnforcement.ts";
import { buildAdaptiveContextPrompt, extractAdaptiveContext } from "../_shared/adaptiveContext.ts";
import { buildLensPrompt } from "../_shared/lensPrompt.ts";
import { getReasoningFramework } from "../_shared/reasoningFramework.ts";
import { enforceVisualContract } from "../_shared/visualFallback.ts";
import { getGovernedSchemaPrompt, buildValidationObject } from "../_shared/governedSchema.ts";
import { buildLensWeightingPrompt } from "../_shared/lensWeighting.ts";
import { computeGovernedConfidence } from "../_shared/confidenceComputation.ts";
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
    const { product, userSuggestions, lens, refreshWorkflowOnly, insightPreferences, userScores, steeringText, disruptContext, selectedImages, activeBranch, governedContext, adaptiveContext: rawAdaptiveCtx, upstreamIntel, structuralDecomposition, focusTerritory } = await req.json();
    const adaptiveCtx = rawAdaptiveCtx || extractAdaptiveContext({ product });
    const adaptivePrompt = buildAdaptiveContextPrompt(adaptiveCtx);
    // Extract active branch context for isolated or combined downstream reasoning
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

    // ── Mode Data Filtering: strip blocked domains before AI call ──
    const filterResult = filterInputData(mode, product);
    const filteredProduct = filterResult.filtered;
    console.log(`[ModeEnforcement] ${mode} mode | ${missingDataWarning(mode)}`);
    const modeGuard = getModeGuardPrompt(mode);

    const OS_PREAMBLE = `You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.
${getReasoningFramework()}
${modeGuard}${branchPrompt}${adaptivePrompt}
${focusTerritory ? `
FOCUS TERRITORY: ${focusTerritory.name}
${focusTerritory.census ? `- Population: ${focusTerritory.census.population?.toLocaleString()}
- Median Income: $${focusTerritory.census.medianIncome?.toLocaleString()}
- Median Age: ${focusTerritory.census.medianAge}
- Education (bachelor's+): ${focusTerritory.census.educationRate}%
- Labor Force Participation: ${focusTerritory.census.laborForceParticipation}%` : ""}
${focusTerritory.business ? `- Business Establishments: ${focusTerritory.business.establishments?.toLocaleString()}
- Opportunity Score: ${focusTerritory.business.opportunityScore}/100 (National Rank: #${focusTerritory.business.nationalRank})` : ""}
${focusTerritory.regulatory ? `- Legal Status for this product: ${focusTerritory.regulatory.legalStatus}
- Key regulatory requirements: ${(focusTerritory.regulatory.keyRules || []).join(", ") || "None identified"}
- State-specific compliance: ${focusTerritory.regulatory.complianceNotes || "N/A"}` : ""}

IMPORTANT: All market sizing, distribution strategy, pricing, and go-to-market recommendations MUST be grounded in ${focusTerritory.name} realities. Reference actual state regulations and census demographics — not national averages.
` : ""}
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
- ANTI-ANCHORING: Do NOT let one friction type dominate all steps. A surfboard's friction might be skill-based (learning to paddle/pop-up), not size-based (transport). A camera's friction might be software/workflow, not weight. Let scraped evidence and product reality determine which friction types appear — do not default to physical.

`;

    const systemPrompt = isService
      ? OS_PREAMBLE + `You are a radical first-principles service strategist. You combine the thinking of:
- Clayton Christensen (jobs-to-be-done, disruptive innovation)
- Elon Musk (first principles — strip away convention, rebuild from fundamentals)
- Don Norman (cognitive load, affordances, friction archaeology)
- IDEO (customer journey mapping, pain archaeology)
- Alex Hormozi (offer design, pricing psychology, operational leverage)

Your mission: completely deconstruct a SERVICE and uncover radical redesign opportunities. You question EVERYTHING:
- What is the CUSTOMER JOURNEY? Step by step — what do they do before, during, after?
- Where is FRICTION in that journey? What slows them down? What frustrates?
- What is the DELIVERY MODEL? In-person, remote, hybrid? Why? Could it be flipped?
- What is the PRICING MODEL? Per-use, subscription, retainer? What if it were completely different?
- What OPERATIONAL BOTTLENECKS exist? What limits scale?
- What SMART TECH could transform delivery? AI, automation, platforms — why isn't it there?
- What ASSUMPTIONS are baked into how this service operates that nobody questions?
- What would a 10x BETTER version look like if built from scratch today?

Respond ONLY with a single valid JSON object — no markdown, no explanation.

The JSON must follow this EXACT structure:
{
  "currentStrengths": {
    "whatWorks": ["Specific element of current product/service that is already strong and should be preserved — explain WHY it works", "Strong element 2", "Strong element 3"],
    "competitiveAdvantages": ["Current advantage 1 that would be costly or risky to abandon", "Advantage 2"],
    "keepVsAdapt": "Honest assessment: which aspects should remain as-is, which should be adapted (not replaced), and which should be completely rethought. Be specific about WHY."
  },
  "coreReality": {
    "trueProblem": "The actual human problem being solved (not marketing)",
    "actualUsage": "How customers genuinely interact with this service — behaviors, workarounds, complaints",
    "normalizedFrustrations": ["frustration 1", "frustration 2", "frustration 3", "frustration 4"],
    "userHacks": ["hack 1 — workarounds customers use", "hack 2", "hack 3"]
  },
  "frictionDimensions": {
    "primaryFriction": "The single biggest friction source for THIS service — identify the dimension (delivery, skill, cost, safety, ecosystem, maintenance, social, workflow) and explain why it dominates",
    "deliveryModel": "Delivery format analysis — in-person, remote, async, hybrid? What format would best fit customer context?",
    "skillBarrier": "Learning curve, expertise required — how hard is it for the customer to use the service well?",
    "costStructure": "Upfront cost, ongoing costs, hidden costs, price-to-value friction",
    "ecosystemLockIn": "Dependencies on locations, conditions, platforms, or other services",
    "maintenanceBurden": "Ongoing effort the customer must put in — coordination, scheduling, follow-up",
    "gaps": ["Gap 1: specific friction with dimension labeled", "Gap 2", "Gap 3"],
    "opportunities": ["Opportunity from addressing the PRIMARY friction", "Opportunity 2", "Opportunity 3"]
  },
  "userWorkflow": {
    "stepByStep": ["Step 1: how customer currently discovers/books the service", "Step 2: current onboarding process", "Step 3: how core service is actually delivered today", "Step 4: current follow-up process", "Step 5: how retention/rebooking currently works"],
    "frictionPoints": [
      { "stepIndex": 0, "friction": "specific friction that EXISTS TODAY in this step", "severity": "high|medium|low", "rootCause": "why this friction exists in the current workflow" },
      { "stepIndex": 1, "friction": "specific friction that EXISTS TODAY in this step", "severity": "high|medium|low", "rootCause": "why this friction exists" },
      { "stepIndex": 2, "friction": "specific friction that EXISTS TODAY in this step", "severity": "high|medium|low", "rootCause": "why this friction exists" }
    ],
    "cognitiveLoad": "What mental effort does the customer CURRENTLY expend? What do they have to research, decide, coordinate, or manage TODAY?",
    "contextOfUse": "When, in what state (urgent, planned, stressed, relaxed) do customers CURRENTLY seek this? How does the EXISTING service design handle that?"
  },
  "smartTechAnalysis": {
    "currentTechLevel": "Describe current technology integration (or lack thereof) in service delivery",
    "missedOpportunities": [
      { "tech": "technology type (AI/automation/platform/analytics)", "application": "specific application to this service", "valueCreated": "what problem it solves or efficiency it creates" }
    ],
    "whyNotAlreadyDone": "Economic, technical, or cultural reasons why smart tech hasn't been applied yet",
    "recommendedIntegration": "The single highest-leverage tech addition and exactly how it would transform the service"
  },
  "hiddenAssumptions": [
    {
      "assumption": "Specific assumption being questioned about how service is delivered",
      "currentAnswer": "Why it's currently done this way",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": true,
      "challengeIdea": "How you'd challenge or invert this assumption",
      "leverageScore": 8,
      "impactScenario": "What happens if this assumption is successfully challenged — the specific upside, market shift, or value unlocked (1-2 sentences)",
      "competitiveBlindSpot": "Which competitors or incumbents rely on this same assumption and would be vulnerable if it were broken (name specific players or categories)",
      "urgencySignal": "eroding | stable | emerging",
      "urgencyReason": "Why this assumption is eroding NOW due to tech/market shifts, OR why it remains stable, OR why it's an emerging opportunity (1 sentence)"
    }
  ],
  "flippedLogic": [
    {
      "originalAssumption": "The assumption being flipped — must correspond to a hiddenAssumption above",
      "boldAlternative": "The radical structural alternative",
      "rationale": "Why this flip creates real value",
      "physicalMechanism": "How it would actually work operationally/technically"
    },
    {
      "originalAssumption": "Second assumption being flipped",
      "boldAlternative": "Second radical alternative",
      "rationale": "Why this matters",
      "physicalMechanism": "Implementation mechanism"
    },
    {
      "originalAssumption": "Third assumption being flipped",
      "boldAlternative": "Third bold alternative",
      "rationale": "Value creation rationale",
      "physicalMechanism": "Operational mechanism"
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
      "mechanism": "How the transformation works operationally",
      "valueCreated": "What improves",
      "valueLost": "What degrades or is sacrificed",
      "viabilityGate": {
        "technical": { "score": 4, "reasoning": "Why technically feasible or not" },
        "economic": { "score": 3, "reasoning": "Unit economics assessment" },
        "regulatory": { "score": 5, "reasoning": "Regulatory risk assessment" },
        "behavioral": { "score": 3, "reasoning": "How much behavior change required" },
        "compositeScore": 3.75,
        "verdict": "pass|conditional|fail"
      },
      "filtered": false,
      "systemImpact": {
        "valueFlowChanges": ["How value creation/delivery changes if this transformation is applied"],
        "newBottleneck": "What becomes the new system bottleneck after this change",
        "cascadeEffects": ["Downstream effect 1 on other system components", "Effect 2"]
      }
    }
  ],
  "transformationClusters": [
    {
      "id": "tc_1",
      "name": "Cluster name",
      "description": "How these transformations work together",
      "transformationIds": ["st_1", "st_2"],
      "compatibilityNote": "Why compatible",
      "strategicPowerScore": 7.5
    }
  ],
  "redesignedConcept": {
    "conceptName": "Short punchy name for the reinvented service",
    "tagline": "One sentence tagline",
    "coreInsight": "The central service truth this is built around (2-3 sentences)",
    "radicalDifferences": ["Key difference 1", "Key difference 2", "Key difference 3", "Key difference 4"],
    "physicalDescription": "Vivid description of the service experience — how it feels, flows, what the customer sees and does",
    "sizeAndWeight": "Service scope and commitment level — time, pricing tiers, engagement model",
    "materials": ["Key capability 1 needed to deliver", "Key capability 2", "Key capability 3"],
    "smartFeatures": ["Tech/automation feature 1 and how it works", "Smart feature 2", "Smart feature 3"],
    "userExperienceTransformation": "The before and after journey — how the customer experience completely changes",
    "frictionEliminated": ["Specific friction 1 now eliminated", "Specific friction 2 eliminated"],
    "whyItHasntBeenDone": "Specific technical, economic, or cultural blockers",
    "biggestRisk": "The single most likely failure point and mitigation",
    "manufacturingPath": "Specific implementation path — hires, tools, platforms, cost estimate",
    "pricePoint": "Target pricing model and market justification",
    "targetUser": "Not a demographic — a specific human moment, need, or identity",
    "riskLevel": "[Risk: Low/Medium/High]",
    "capitalRequired": "[Capital: Low/Medium/High]"
  }
}`
      : OS_PREAMBLE + `You are a radical first-principles product strategist. You combine the thinking of:
- Dieter Rams (ruthless design purity — every element must earn its place)
- Elon Musk (first principles — strip away convention, rebuild from physics up)
- Jony Ive (human connection — how it feels in the hand, the ritual of use)
- Don Norman (cognitive load, affordances, friction archaeology)
- IDEO (user journey mapping, pain archaeology, job-to-be-done lens)

Your mission: completely deconstruct a product and uncover radical redesign opportunities.
Investigate friction across ALL dimensions — do NOT anchor on physical form alone:

PHYSICAL: Size, weight, shape, materials, ergonomics — but ONLY if these are genuine friction sources for THIS product
SKILL/LEARNING: How hard is it to learn, master, or use correctly? What expertise barrier exists?
COST/ACCESS: Is the price justified? What about ongoing costs, accessories, maintenance?
SAFETY/RISK: Physical danger, financial risk, social risk of using it wrong?
ECOSYSTEM: Does it lock users into specific accessories, platforms, locations, or conditions?
MAINTENANCE: Cleaning, repair, storage, degradation over time?
SOCIAL/CULTURAL: Stigma, status signaling, community gatekeeping, intimidation factor?
WORKFLOW: What do they do before, during, after? Where does the process break down?

Identify which dimensions carry the MOST friction for THIS specific product.
Do not assume physical form is the primary issue — let the evidence lead.

- What SMART TECH could transform it? Sensors, AI, connectivity — why isn't it there?
- Is it INTERACTIVE or passive? Could it respond, adapt, communicate?
- What ASSUMPTIONS are baked into this product that nobody questions?

Respond ONLY with a single valid JSON object — no markdown, no explanation.

The JSON must follow this EXACT structure:
{
  "currentStrengths": {
    "whatWorks": ["Specific element of current product that is already strong and should be preserved — explain WHY it works", "Strong element 2", "Strong element 3"],
    "competitiveAdvantages": ["Current advantage 1 that would be costly or risky to abandon", "Advantage 2"],
    "keepVsAdapt": "Honest assessment: which aspects should remain as-is, which should be adapted (not replaced), and which should be completely rethought. Be specific about WHY."
  },
  "coreReality": {
    "trueProblem": "The actual human problem being solved (not marketing)",
    "actualUsage": "How people genuinely use this — rituals, contexts, workarounds",
    "normalizedFrustrations": ["frustration 1", "frustration 2", "frustration 3", "frustration 4"],
    "userHacks": ["hack 1", "hack 2", "hack 3"]
  },
  "frictionDimensions": {
    "primaryFriction": "The single biggest friction source for THIS product — identify the dimension (physical, skill, cost, safety, ecosystem, maintenance, social, workflow) and explain why it dominates",
    "physicalForm": "Size/weight/shape analysis — ONLY if relevant. If physical form is NOT the main friction, say so explicitly",
    "skillBarrier": "Learning curve, expertise required, mastery gap — how hard is it to use well?",
    "costStructure": "Upfront cost, ongoing costs, hidden costs, price-to-value friction",
    "ecosystemLockIn": "Dependencies on locations, conditions, accessories, platforms, or other products",
    "maintenanceBurden": "Storage, care, repair, degradation — what ongoing effort does ownership demand?",
    "gaps": ["Gap 1: specific friction with dimension labeled", "Gap 2", "Gap 3"],
    "opportunities": ["Opportunity from addressing the PRIMARY friction", "Opportunity 2", "Opportunity 3"]
  },
  "userWorkflow": {
    "stepByStep": ["Step 1: what user currently does before using it", "Step 2: how they currently interact with it", "Step 3: core use action as it exists today", "Step 4: what happens next in current workflow", "Step 5: current after-use/cleanup process"],
    "frictionPoints": [
      { "stepIndex": 0, "friction": "specific friction that EXISTS TODAY in this step", "severity": "high|medium|low", "rootCause": "why this friction exists in the current workflow" },
      { "stepIndex": 1, "friction": "specific friction that EXISTS TODAY in this step", "severity": "high|medium|low", "rootCause": "why this friction exists" },
      { "stepIndex": 2, "friction": "specific friction that EXISTS TODAY in this step", "severity": "high|medium|low", "rootCause": "why this friction exists" }
    ],
    "cognitiveLoad": "What mental effort does the user CURRENTLY expend? What do they have to remember, configure, or manage TODAY?",
    "contextOfUse": "Where, when, in what state (rushed, relaxed, distracted) is this CURRENTLY used? How does the EXISTING design handle that context?"
  },
  "smartTechAnalysis": {
    "currentTechLevel": "Describe current technology integration (or lack thereof)",
    "missedOpportunities": [
      { "tech": "technology type (sensors/AI/connectivity/materials)", "application": "specific application to this product", "valueCreated": "what problem it solves or joy it creates" }
    ],
    "whyNotAlreadyDone": "Economic, technical, or cultural reasons why smart tech hasn't been applied yet",
    "recommendedIntegration": "The single highest-leverage smart tech addition and exactly how it would work"
  },
  "hiddenAssumptions": [
    {
      "assumption": "Specific assumption being questioned",
      "currentAnswer": "Why it's currently done this way",
      "reason": "tradition | manufacturing | cost | physics | habit",
      "isChallengeable": true,
      "challengeIdea": "How you'd challenge or invert this assumption",
      "leverageScore": 8,
      "impactScenario": "What happens if this assumption is successfully challenged — the specific upside, market shift, or value unlocked (1-2 sentences)",
      "competitiveBlindSpot": "Which competitors or incumbents rely on this same assumption and would be vulnerable if it were broken (name specific players or categories)",
      "urgencySignal": "eroding | stable | emerging",
      "urgencyReason": "Why this assumption is eroding NOW due to tech/market shifts, OR why it remains stable, OR why it's an emerging opportunity (1 sentence)"
    }
  ],
  "flippedLogic": [
    {
      "originalAssumption": "The assumption being flipped",
      "boldAlternative": "The radical structural alternative",
      "rationale": "Why this flip creates real value",
      "physicalMechanism": "How it would actually work physically/technically"
    },
    {
      "originalAssumption": "Second assumption",
      "boldAlternative": "Second radical alternative",
      "rationale": "Why this matters",
      "physicalMechanism": "Physical/technical mechanism"
    },
    {
      "originalAssumption": "Third assumption",
      "boldAlternative": "Third radical alternative",
      "rationale": "Why this matters",
      "physicalMechanism": "Physical/technical mechanism"
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
      "mechanism": "How the transformation works physically/operationally",
      "valueCreated": "What improves",
      "valueLost": "What degrades or is sacrificed",
      "viabilityGate": {
        "technical": { "score": 4, "reasoning": "Why technically feasible or not" },
        "economic": { "score": 3, "reasoning": "Unit economics assessment" },
        "regulatory": { "score": 5, "reasoning": "Regulatory risk assessment" },
        "behavioral": { "score": 3, "reasoning": "How much behavior change required" },
        "compositeScore": 3.75,
        "verdict": "pass|conditional|fail"
      },
      "filtered": false,
      "systemImpact": {
        "valueFlowChanges": ["How value creation/delivery changes if this transformation is applied"],
        "newBottleneck": "What becomes the new system bottleneck after this change",
        "cascadeEffects": ["Downstream effect 1 on other system components", "Effect 2"]
      }
    }
  ],
  "transformationClusters": [
    {
      "id": "tc_1",
      "name": "Cluster name — the coherent concept direction",
      "description": "How these transformations work together",
      "transformationIds": ["st_1", "st_2"],
      "compatibilityNote": "Why these transformations are compatible (or conflicts to watch)",
      "strategicPowerScore": 7.5
    }
  ],
  "redesignedConcept": {
    "conceptName": "Short punchy name",
    "tagline": "One sentence tagline",
    "coreInsight": "The central design truth this is built around (2-3 sentences)",
    "radicalDifferences": ["Key difference 1", "Key difference 2", "Key difference 3", "Key difference 4"],
    "physicalDescription": "Vivid, detailed description of form, size, weight, texture, how it's held and used",
    "sizeAndWeight": "Exact proposed dimensions and weight with justification",
    "materials": ["Material 1 with specific reason", "Material 2 with reason", "Material 3 with reason"],
    "smartFeatures": ["Smart/tech feature 1 and how it works", "Smart feature 2", "Smart feature 3"],
    "userExperienceTransformation": "The before and after journey — how the experience completely changes",
    "frictionEliminated": ["Specific friction 1 now eliminated", "Specific friction 2 eliminated"],
    "whyItHasntBeenDone": "Specific technical, economic, or cultural blockers",
    "biggestRisk": "The single most likely failure point and mitigation",
    "manufacturingPath": "Specific suppliers, processes, country, cost estimate",
    "pricePoint": "Target retail price and market justification",
    "targetUser": "Not a demographic — a specific human moment or identity",
    "riskLevel": "[Risk: Low/Medium/High]",
    "capitalRequired": "[Capital: Low/Medium/High]"
  },
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
  "governed": { ... structured output enforced via tool calling schema — fill ALL governed fields completely ... }
}`;

    const userPrompt = isService
      ? `Apply radical first-principles deconstruction to this SERVICE. Question everything about its delivery model, customer journey, operational friction, and technology potential.

SERVICE: ${product.name}
CATEGORY: ${product.category}
DESCRIPTION: ${product.description}
KEY INSIGHT: ${product.keyInsight || "None provided"}
MARKET SIZE: ${product.marketSizeEstimate || "Unknown"}

KNOWN CUSTOMER COMPLAINTS:
${product.reviews?.filter((r: { sentiment: string }) => r.sentiment === "negative").map((r: { text: string }) => `• ${r.text}`).join("\n") || "General friction points"}

EXISTING ASSUMPTIONS IDENTIFIED:
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption} → current challenge: ${a.challenge}`).join("\n") || "None pre-identified"}

COMMUNITY PAIN POINTS:
${(product as { communityInsights?: { topComplaints?: string[] } }).communityInsights?.topComplaints?.map((c: string) => `• ${c}`).join("\n") || "See reviews above"}

CRITICAL INSTRUCTIONS:
1. SCOPE: Question the service scope. Too narrow? Too broad? What would a laser-focused or expanded version look like?
2. DELIVERY: Is the delivery format optimal? In-person vs remote vs async vs hybrid — what fits best?
3. CUSTOMER JOURNEY: Map every step the customer takes. Find friction at each step. Propose eliminations.
4. SMART TECH: What AI, automation, platforms, or analytics could transform delivery? Why hasn't it happened?
5. OPERATIONAL LEVERAGE: Where are the bottlenecks that prevent scaling? What if they were removed?
6. PRICING: Is the pricing model optimal? What if it were subscription, per-outcome, freemium, or tiered differently?
7. The redesigned concept must be STRUCTURALLY different — not a minor tweak.
8. Avoid vague suggestions. Every idea must have an operational mechanism and implementation path.
9. The concept must be implementable within 12–18 months.
10. VALIDATION: If a real analogous service proved a similar model works, reference it (name, revenue/growth, structural parallel). If this is genuinely novel, explain why the timing is right and what adjacent signals support it.
11. DEMAND SIGNAL: Reference community complaints, review patterns, behavioral trends, or market gaps as evidence of demand.
12. UNIT ECONOMICS: Include specific pricing math — customer acquisition cost estimate, lifetime value estimate, and margin structure.
13. MINIMUM COUNTS: Generate at least 5 hiddenAssumptions and at least 4 flippedLogic items. Each flipped logic MUST correspond to a specific hidden assumption. Cover different friction dimensions — pricing, delivery, skill, ecosystem, operational model. Do NOT generate just 1 flip.

VISUAL & ACTION PLAN INSTRUCTIONS:
- Generate 1-2 visual specs for the dominant constraint structure. Use constraint_map for showing how constraints connect, causal_chain for cause-effect flows, leverage_hierarchy for ranked interventions.
- Generate 2-3 action plans for highest-leverage interventions. Each must connect to a specific constraint.
- Only generate visuals when structural causality is clear. Do not force visuals.

Return ONLY the JSON object.`
      : `Apply radical first-principles deconstruction to this product. Question everything about its physical form, user workflow, friction points, and smart tech potential.

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
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption} → current challenge: ${a.challenge}`).join("\n") || "None pre-identified"}

COMMUNITY PAIN POINTS:
${(product as { communityInsights?: { topComplaints?: string[] } }).communityInsights?.topComplaints?.map((c: string) => `• ${c}`).join("\n") || "See reviews above"}

CRITICAL INSTRUCTIONS:
1. FRICTION DISCOVERY: Identify the PRIMARY friction dimension for this product (physical, skill, cost, safety, ecosystem, maintenance, social, workflow). Do NOT default to physical/size — let the evidence lead.
2. SKILL/LEARNING: What expertise barrier exists? How hard is it to learn and master?
3. WORKFLOW: Map every step the user takes. Find friction at each step. Propose eliminations.
4. SMART TECH: What sensors, AI, connectivity, or smart materials could transform this? Why hasn't it happened?
5. ECOSYSTEM: What dependencies (locations, accessories, conditions) constrain use?
6. COST/MAINTENANCE: Are ongoing costs, care requirements, or storage a significant burden?
7. The redesigned concept must be STRUCTURALLY different — not a feature add, not "add Bluetooth."
8. Avoid vague suggestions. Every idea must have a physical mechanism and a manufacturing path.
9. The concept must be manufacturable within 2–3 years.
10. VALIDATION: If a real analogous product proved a similar approach works, reference it (name, revenue/growth, structural parallel). If this is genuinely novel, explain why the timing is right and what adjacent signals support it.
11. DEMAND SIGNAL: Reference community complaints, behavioral trends, or adjacent market data as evidence of demand for this redesign direction.
12. UNIT ECONOMICS: Include BOM estimate, target retail price, margin calculation, and breakeven volume.
13. MINIMUM COUNTS: Generate at least 5 hiddenAssumptions and at least 4 flippedLogic items. Each flipped logic MUST correspond to a specific hidden assumption. Cover different friction dimensions — physical, cost, skill, ecosystem, workflow. Do NOT generate just 1 or 2 flips.

VISUAL & ACTION PLAN INSTRUCTIONS:
- Generate 1-2 visual specs for the dominant constraint structure. Use constraint_map for showing how constraints connect, causal_chain for cause-effect flows, leverage_hierarchy for ranked interventions.
- Generate 2-3 action plans for highest-leverage interventions. Each must connect to a specific constraint.
- Only generate visuals when structural causality is clear. Do not force visuals.

Return ONLY the JSON object.${buildLensPrompt(lens)}${buildLensWeightingPrompt(lens)}${buildModeWeightingPrompt(mode)}`;

    // ── USER CURATION CONTEXT (for redesign mode) ──
    let curationPrompt = "";
    if (insightPreferences || userScores || steeringText || disruptContext) {
      const parts: string[] = [];
      parts.push("\n\n--- USER CURATION CONTEXT ---");
      parts.push("The user has already reviewed the Disrupt analysis and provided explicit preferences. PRIORITIZE their curated inputs:");

      if (steeringText) {
        parts.push(`\nUSER GUIDANCE: "${steeringText}"`);
      }

      if (insightPreferences) {
        const liked = Object.entries(insightPreferences).filter(([, v]) => v === "liked").map(([k]) => k);
        const dismissed = Object.entries(insightPreferences).filter(([, v]) => v === "dismissed").map(([k]) => k);
        if (liked.length > 0) parts.push(`\nUSER LIKED (emphasize these): ${liked.join(", ")}`);
        if (dismissed.length > 0) parts.push(`\nUSER DISMISSED (de-prioritize): ${dismissed.join(", ")}`);
      }

      if (userScores && Object.keys(userScores).length > 0) {
        parts.push("\nUSER-ADJUSTED SCORES (respect these over AI defaults):");
        for (const [ideaId, scores] of Object.entries(userScores)) {
          const scoreStr = Object.entries(scores as Record<string, number>).map(([k, v]) => `${k}:${v}`).join(", ");
          parts.push(`  ${ideaId}: ${scoreStr}`);
        }
      }

      if (disruptContext) {
        const dc = disruptContext as Record<string, unknown>;
        if (dc.hiddenAssumptions) {
          parts.push(`\nASSUMPTIONS IDENTIFIED: ${JSON.stringify(dc.hiddenAssumptions).slice(0, 1000)}`);
        }
        if (dc.flippedLogic) {
          parts.push(`\nFLIPPED LOGIC: ${JSON.stringify(dc.flippedLogic).slice(0, 1000)}`);
        }
      }

      parts.push("\nBuild the redesigned concept around the user's preferred directions. The concept should directly reflect their liked insights and adjusted scores.");

      // Include governed reasoning context (reasoning revisions, causal chains, constraint maps)
      if (governedContext) {
        if (governedContext.reasoning_synopsis) {
          const rs = governedContext.reasoning_synopsis;
          if (rs.core_causal_logic?.dominant_mechanism) {
            parts.push(`\nDOMINANT MECHANISM (from reasoning analysis): ${rs.core_causal_logic.dominant_mechanism}`);
          }
          if (rs.key_assumptions?.length > 0) {
            parts.push(`\nKEY ASSUMPTIONS (user-reviewed): ${JSON.stringify(rs.key_assumptions).slice(0, 800)}`);
          }
          if (rs.decision_drivers?.length > 0) {
            parts.push(`\nDECISION DRIVERS: ${JSON.stringify(rs.decision_drivers).slice(0, 600)}`);
          }
        }
        if (governedContext.constraint_map) {
          const cm = governedContext.constraint_map;
          if (cm.binding_constraint_id) {
            parts.push(`\nBINDING CONSTRAINT: ${cm.binding_constraint_id} — ${cm.dominance_proof || ""}`);
          }
          if (cm.causal_chains) {
            parts.push(`\nCAUSAL CHAINS: ${JSON.stringify(cm.causal_chains).slice(0, 600)}`);
          }
        }
        if (governedContext.root_hypotheses?.length > 0) {
          parts.push(`\nACTIVE HYPOTHESES: ${JSON.stringify(governedContext.root_hypotheses.slice(0, 3).map((h: any) => ({ id: h.id, statement: h.hypothesis_statement, type: h.constraint_type }))).slice(0, 500)}`);
        }
      }

      curationPrompt = parts.join("\n");
    }


    // ── UPSTREAM INTELLIGENCE REPORT DATA ──
    let upstreamPrompt = "";
    if (upstreamIntel && Object.keys(upstreamIntel).length > 0) {
      const parts: string[] = [];
      parts.push("\n\n--- UPSTREAM INTELLIGENCE (from Report step) ---");
      parts.push("Use this verified market intelligence to ground your assumptions, flips, and redesign in real data. Reference specific findings below when identifying constraints and leverage points.\n");

      if (upstreamIntel.pricingIntel) {
        const pi = upstreamIntel.pricingIntel;
        parts.push("PRICING INTELLIGENCE:");
        if (pi.currentMarketPrice) parts.push(`  Market Price: ${pi.currentMarketPrice}`);
        if (pi.msrpOriginal) parts.push(`  Original MSRP: ${pi.msrpOriginal}`);
        if (pi.margins) parts.push(`  Margins: ${pi.margins}`);
        if (pi.collectorPremium) parts.push(`  Collector Premium: ${pi.collectorPremium}`);
        if (pi.priceDirection) parts.push(`  Price Trend: ${pi.priceDirection}`);
        const resale = pi.resaleAvgSold || pi.ebayAvgSold;
        if (resale) parts.push(`  Resale Average: ${resale}`);
      }

      if (upstreamIntel.supplyChain) {
        const sc = upstreamIntel.supplyChain;
        parts.push("\nSUPPLY CHAIN INTELLIGENCE:");
        if (sc.suppliers?.length > 0) parts.push(`  Key Suppliers: ${sc.suppliers.map((s: any) => `${s.name} (${s.region}, ${s.role || ""})`).join("; ")}`);
        if (sc.manufacturers?.length > 0) parts.push(`  Manufacturers: ${sc.manufacturers.map((m: any) => `${m.name} (${m.region}, MOQ: ${m.moq || "?"})`).join("; ")}`);
        if (sc.vendors?.length > 0) parts.push(`  Vendors: ${sc.vendors.map((v: any) => `${v.name} (${v.type || ""}) ${v.url || ""}`).join("; ")}`);
        if (sc.retailers?.length > 0) parts.push(`  Retailers: ${sc.retailers.map((r: any) => `${r.name} (${r.type || ""}, share: ${r.marketShare || "?"}) ${r.url || ""}`).join("; ")}`);
        if (sc.distributors?.length > 0) parts.push(`  Distributors: ${sc.distributors.map((d: any) => `${d.name} (${d.region})`).join("; ")}`);
      }

      if (upstreamIntel.communityInsights) {
        const ci = upstreamIntel.communityInsights;
        parts.push("\nCOMMUNITY INTELLIGENCE (verified signals):");
        if (ci.communitySentiment) parts.push(`  Overall Sentiment: ${ci.communitySentiment}`);
        if (ci.topComplaints?.length > 0) parts.push(`  Top Complaints:\n${ci.topComplaints.map((c: string) => `    • ${c}`).join("\n")}`);
        if (ci.improvementRequests?.length > 0) parts.push(`  Improvement Requests:\n${ci.improvementRequests.map((r: string) => `    • ${r}`).join("\n")}`);
      }

      if (upstreamIntel.userWorkflow) {
        const uw = upstreamIntel.userWorkflow;
        parts.push("\nCURRENT USER WORKFLOW (mapped in Report):");
        if (uw.stepByStep?.length > 0) parts.push(`  Steps: ${uw.stepByStep.map((s: string, i: number) => `${i + 1}. ${s}`).join(" → ")}`);
        if (uw.frictionPoints?.length > 0) parts.push(`  Known Friction:\n${uw.frictionPoints.map((f: any) => `    • Step ${(f.stepIndex || 0) + 1}: ${f.friction} [${f.severity}] — Root: ${f.rootCause || "unknown"}`).join("\n")}`);
        if (uw.cognitiveLoad) parts.push(`  Cognitive Load: ${uw.cognitiveLoad}`);
      }

      if (upstreamIntel.patentLandscape) {
        const pl = upstreamIntel.patentLandscape;
        parts.push("\nPATENT LANDSCAPE:");
        if (pl.totalPatents) parts.push(`  Total Patents: ${pl.totalPatents}`);
        if (pl.expiredPatents) parts.push(`  Expired Patents: ${pl.expiredPatents}`);
        if (pl.keyPlayers?.length > 0) parts.push(`  Key Players: ${pl.keyPlayers.join(", ")}`);
        if (pl.gapAnalysis) parts.push(`  IP Gap Analysis: ${typeof pl.gapAnalysis === "string" ? pl.gapAnalysis : JSON.stringify(pl.gapAnalysis).slice(0, 400)}`);
      }

      if (upstreamIntel.competitorAnalysis) {
        const ca = upstreamIntel.competitorAnalysis;
        parts.push("\nCOMPETITOR INTELLIGENCE:");
        if (ca.marketLeader) parts.push(`  Market Leader: ${ca.marketLeader}`);
        if (ca.gaps?.length > 0) parts.push(`  Market Gaps:\n${ca.gaps.map((g: string) => `    • ${g}`).join("\n")}`);
        if (ca.differentiationOpportunity) parts.push(`  Differentiation: ${ca.differentiationOpportunity}`);
      }

      if (upstreamIntel.operationalIntel) {
        const oi = upstreamIntel.operationalIntel;
        parts.push("\nOPERATIONAL INTELLIGENCE:");
        if (oi.deliveryModel) parts.push(`  Delivery Model: ${oi.deliveryModel}`);
        if (oi.operationalBottlenecks?.length > 0) parts.push(`  Bottlenecks:\n${oi.operationalBottlenecks.map((b: string) => `    • ${b}`).join("\n")}`);
        if (oi.scalingChallenges) parts.push(`  Scaling Challenges: ${oi.scalingChallenges}`);
      }

      if (upstreamIntel.trendAnalysis) {
        parts.push(`\nTREND ANALYSIS: ${typeof upstreamIntel.trendAnalysis === "string" ? upstreamIntel.trendAnalysis : JSON.stringify(upstreamIntel.trendAnalysis).slice(0, 500)}`);
      }

      parts.push("\nINSTRUCTION: Ground your hidden assumptions and flipped logic in this upstream intelligence. If pricing data reveals margin compression, that's a structural constraint. If community complaints cluster around a specific friction, that should dominate your friction analysis. If supply chain is concentrated, that's a vulnerability to exploit in redesign.");
      upstreamPrompt = parts.join("\n");
    }

    const structuredTools = buildStructuredOutputTools("first-principles");
    const aiMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt + curationPrompt + upstreamPrompt },
    ];

    // Helper: make AI gateway call with optional tool calling
    async function callAI(
      useTools: boolean,
      model: string,
      messages: Array<{ role: string; content: string }> = aiMessages
    ) {
      const body: Record<string, unknown> = {
        model,
        messages,
        temperature: 0.5,
        max_tokens: 24000,
      };
      if (useTools && structuredTools) {
        Object.assign(body, structuredTools);
      }
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      return r;
    }

    function enforceMinimumArtifacts(base: Record<string, unknown>): Record<string, unknown> {
      const next = { ...base } as Record<string, unknown>;

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
        const assumptionText = String(assumption.assumption || "Legacy operating assumption");
        const challengeIdea = String(assumption.challengeIdea || "Invert the operating model around the core constraint");

        existingFlips.push({
          originalAssumption: assumptionText,
          boldAlternative: challengeIdea,
          rationale: "This inversion removes a proven friction cluster and unlocks scalable value delivery.",
          physicalMechanism: "Implement with a constrained pilot, instrument outcomes, then scale the validated mechanism.",
        });
      }

      next.hiddenAssumptions = existingAssumptions;
      next.flippedLogic = existingFlips;

      // ── Enforce redesignedConcept is never empty ──
      const concept = next.redesignedConcept as Record<string, unknown> | undefined;
      const conceptIsEmpty = !concept || (!concept.conceptName && !concept.coreInsight);

      if (conceptIsEmpty) {
        console.warn("[EnforceMinimum] redesignedConcept is empty — synthesizing from flippedLogic & assumptions");

        // Synthesize a unified concept from the top flipped logic entries
        const topFlips = existingFlips.slice(0, 3);
        const topAssumptions = existingAssumptions.slice(0, 3);

        const productName = String((base as any)?.product?.name || filteredProduct?.name || "this product");
        const productCategory = String((base as any)?.product?.category || filteredProduct?.category || "Product");

        // Build concept name from the boldest flip
        const primaryFlip = topFlips[0] || {};
        const secondaryFlip = topFlips[1] || {};
        const primaryAssumption = topAssumptions[0] || {};

        // Derive radical differences from all flips
        const radicalDiffs = topFlips
          .map((f: Record<string, unknown>) => String(f.boldAlternative || f.rationale || ""))
          .filter(Boolean);

        // Derive materials/capabilities from physical mechanisms
        const materials = topFlips
          .map((f: Record<string, unknown>) => String(f.physicalMechanism || ""))
          .filter(Boolean)
          .slice(0, 3);

        // Build friction eliminated from challenged assumptions
        const frictionEliminated = topAssumptions
          .filter((a: Record<string, unknown>) => a.isChallengeable)
          .map((a: Record<string, unknown>) => `Eliminated: ${String(a.assumption || "legacy constraint")}`)
          .slice(0, 3);

        const frictionDims = (next.frictionDimensions as Record<string, unknown> | undefined) || {};

        next.redesignedConcept = {
          conceptName: String(primaryFlip.boldAlternative || `Reimagined ${productName}`).slice(0, 60),
          tagline: `A ground-up reinvention that challenges ${topFlips.length} core assumptions`,
          coreInsight: [
            String(primaryFlip.rationale || ""),
            String(secondaryFlip?.rationale || ""),
            String(primaryAssumption.impactScenario || ""),
          ].filter(Boolean).join(" ").slice(0, 500) || `This concept inverts the dominant constraints holding ${productName} back.`,
          radicalDifferences: radicalDiffs.length > 0 ? radicalDiffs : [
            "Structural inversion of the primary operating constraint",
            "Removal of legacy friction patterns",
            "Technology-enabled delivery model",
          ],
          physicalDescription: String(frictionDims.primaryFriction || primaryFlip.physicalMechanism || `A fundamentally restructured approach to ${productCategory.toLowerCase()} delivery`),
          sizeAndWeight: isService ? "Scalable digital-first model" : "Optimized for the core use case",
          materials: materials.length > 0 ? materials : ["Primary mechanism from constraint inversion", "Supporting technology layer", "User experience framework"],
          smartFeatures: topFlips
            .map((f: Record<string, unknown>) => String(f.physicalMechanism || ""))
            .filter(Boolean)
            .slice(0, 3),
          userExperienceTransformation: `Before: users face ${topAssumptions.length} structural constraints. After: each constraint is inverted into a value-creating feature, reducing friction and unlocking new capability.`,
          frictionEliminated: frictionEliminated.length > 0 ? frictionEliminated : ["Primary friction source addressed through structural redesign"],
          whyItHasntBeenDone: String(primaryAssumption.urgencyReason || "Incumbent economics and organizational inertia have prevented this inversion"),
          biggestRisk: `Adoption risk — the ${topFlips.length} inversions require users to change established behavior patterns`,
          manufacturingPath: isService ? "Phased rollout: pilot with early adopters, instrument outcomes, scale validated model" : "Prototype → small-batch validation → scale manufacturing",
          pricePoint: "Positioned at market-competitive pricing with improved unit economics from constraint removal",
          targetUser: "Users who actively experience the friction identified in the assumption analysis — early adopters willing to try a fundamentally different approach",
          riskLevel: "Medium",
          capitalRequired: "Medium",
        };
      }

      return next;
    }

    // ── PRIMARY AI CALL ──
    // Use Pro directly — Flash consistently fails with tool calling on this complex schema,
    // wasting 40-60s before the inevitable Pro retry. Going straight to Pro saves ~45s.
    const response = await callAI(true, "google/gemini-2.5-pro");

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

    // §2: Structured output extraction
    let analysis: Record<string, unknown>;
    try {
      analysis = extractStructuredResponse(aiData);
    } catch (parseErr) {
      // Fallback: try raw content parse
      const rawText: string = aiData.choices?.[0]?.message?.content ?? "";
      let cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }
      try {
        analysis = JSON.parse(cleaned);
      } catch (jsonErr) {
        console.error("[StructuredOutput] All parse attempts failed:", parseErr, jsonErr);
        throw new Error("AI returned invalid output. Please try again.");
      }
    }

    // Enforce minimum analytical depth: assumptions + flips + concept
    let minimumValidation = validateArrayMinimums(analysis, "first-principles");
    
    // Also check if redesignedConcept is empty (AI sometimes returns {})
    const conceptObj = analysis.redesignedConcept as Record<string, unknown> | undefined;
    const conceptEmpty = !conceptObj || (!conceptObj.conceptName && !conceptObj.coreInsight);
    
    if (!minimumValidation.valid || conceptEmpty) {
      if (conceptEmpty) {
        console.warn("[StructuredOutput] redesignedConcept is empty — will be synthesized from flips/assumptions");
      }
      if (!minimumValidation.valid) {
        console.warn(`[StructuredOutput] Underfilled arrays detected: ${minimumValidation.underfilled.map((u) => `${u.field}:${u.actual}/${u.min}`).join(", ")}`);
      }

      console.warn("[StructuredOutput] Applying deterministic expansion fallback (skipping repair pass for speed).");
      analysis = enforceMinimumArtifacts(analysis);
      minimumValidation = validateArrayMinimums(analysis, "first-principles");
    }

    console.log(
      `[StructuredOutput] first-principles counts: assumptions=${Array.isArray(analysis.hiddenAssumptions) ? analysis.hiddenAssumptions.length : 0}, flips=${Array.isArray(analysis.flippedLogic) ? analysis.flippedLogic.length : 0}`
    );

    // §2: Validate governed fields are present
    const structuredValidation = validateStructuredResponse(analysis, "first-principles");
    if (structuredValidation.truncated) {
      console.error(`[StructuredOutput] TRUNCATION DETECTED: missing ${structuredValidation.missing.join(", ")}`);
    }
    console.log(`[StructuredOutput] Validation: valid=${structuredValidation.valid}, missing=${structuredValidation.missing.length}`);

    enforceVisualContract(analysis);

    // ── Governed: build validation object for checkpoint gates ──
    const governed = analysis.governed || {};
    const governedValidation = buildValidationObject("first-principles", governed, [
      "domain_confirmation", "first_principles", "friction_tiers", "constraint_map", "decision_synthesis"
    ]);
    console.log(`[Governed] Validation:`, JSON.stringify(governedValidation));

    // ── RUNTIME ENFORCEMENT: Return 422 if governed validation fails ──
    if (!governedValidation.validation_passed) {
      console.error(`[Governed] CHECKPOINT BLOCKED: ${governedValidation.blocking_reason_if_any}`);
      return new Response(JSON.stringify({
        success: false,
        error: "Governed validation failed — required reasoning artifacts missing",
        _governedValidation: governedValidation,
        // Include partial analysis so client can show what was produced
        analysis,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Deep validation: check field quality (empty strings, etc.) ──
    const { deepValidateGoverned } = await import("../_shared/governedSchema.ts");
    const deepValidation = deepValidateGoverned(governed);
    if (!deepValidation.validation_passed) {
      console.error(`[Governed] DEEP VALIDATION FAILED: ${deepValidation.blocking_reason_if_any}`);
      return new Response(JSON.stringify({
        success: false,
        error: "Governed deep validation failed — structural artifacts incomplete",
        _governedValidation: deepValidation,
        analysis,
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Evidence-governed confidence computation ──
    const { computeGovernedConfidence: computeConf } = await import("../_shared/confidenceComputation.ts");
    const confidenceResult = computeConf(governed);
    console.log(`[Governed] Computed confidence: ${confidenceResult.computation_trace}`);
    // Override AI-generated confidence with computed confidence
    if (governed.decision_synthesis) {
      const ds = governed.decision_synthesis as Record<string, unknown>;
      ds.confidence_score = confidenceResult.computed_confidence;
      ds.decision_grade = confidenceResult.computed_decision_grade;
      ds._confidence_computation = confidenceResult.computation_trace;
      ds._evidence_distribution = confidenceResult.evidence_distribution;
    }

    // ── Multi-Hypothesis Ranking: score and validate root_hypotheses ──
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
      console.log(`[HypothesisRanking] ${hypothesisResult.trace}`);
    }

    // ── Output Validation: check for cross-mode drift ──
    const validationResult = validateOutput(mode, analysis);
    const trace = buildTrace(mode, filterResult, validationResult);
    console.log(`[ModeEnforcement] Trace:`, JSON.stringify(trace));

    if (!validationResult.valid) {
      console.warn(`[ModeEnforcement] Violations detected in ${mode} output:`, validationResult.violations);
    }

    return new Response(JSON.stringify({ success: true, analysis, _modeTrace: trace, _governedValidation: governedValidation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("first-principles-analysis error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
