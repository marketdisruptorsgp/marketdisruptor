import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { resolveMode, filterInputData, missingDataWarning } from "../_shared/modeEnforcement.ts";
import { buildAdaptiveContextPrompt, extractAdaptiveContext } from "../_shared/adaptiveContext.ts";
import { getReasoningFramework } from "../_shared/reasoningFramework.ts";
import { buildLensPrompt } from "../_shared/lensPrompt.ts";
import { enforceVisualContract } from "../_shared/visualFallback.ts";
import { extractActiveBranch, extractCombinedBranches, buildBranchIsolationPrompt } from "../_shared/branchIsolation.ts";
import { buildImpossibilityPrompt } from "../_shared/impossibilityOperations.ts";
// Governed schema: constraint-driven flip linkage

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, audience, additionalContext, insightPreferences, steeringText, lens, count, activeBranch, adaptiveContext: rawAdaptiveCtx, upstreamIntel, disruptContext, rejectedIdeas, governedReasoning } = await req.json();
    const adaptiveCtx = rawAdaptiveCtx || extractAdaptiveContext({ product });
    const adaptivePrompt = buildAdaptiveContextPrompt(adaptiveCtx);
    const ideaCount = count || 2;
    const mode = resolveMode(undefined, product.category);
    const filterResult = filterInputData(mode, product);
    const filteredProduct = filterResult.filtered as typeof product;
    console.log(`[ModeEnforcement] flip-ideas | ${mode} | ${missingDataWarning(mode)}`);
    // Extract active branch for constraint-driven flip generation
    const isCombinedMode = !activeBranch?.active_branch_id || activeBranch?.active_branch_id === "combined";
    const branchCtx = (!isCombinedMode && activeBranch) ? extractActiveBranch(
      { root_hypotheses: [activeBranch.hypothesis] },
      activeBranch.active_branch_id
    ) : null;
    const combinedCtx = (isCombinedMode && activeBranch?.allHypotheses) ? extractCombinedBranches({ root_hypotheses: activeBranch.allHypotheses }) : null;
    const branchPrompt = buildBranchIsolationPrompt(branchCtx, activeBranch?.strategicProfile || null, combinedCtx);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Determine if impossibility engine should activate
    const isStructuralMode = mode === "product" || mode === "business";
    const hasLeveragePrimitives = governedReasoning?.leverage_primitives?.length > 0 ||
      governedReasoning?.binding_constraint || governedReasoning?.transformation_clusters?.length > 0;
    const useImpossibilityEngine = isStructuralMode && hasLeveragePrimitives;

    const lensType = lens?.lensType || (lens?.name === "ETA Acquisition Lens" ? "eta" : "default");

    // Build impossibility prompt block if structural data is available
    const impossibilityBlock = useImpossibilityEngine ? buildImpossibilityPrompt({
      mode: mode === "business" ? "business" : "product",
      lensType,
      leveragePrimitives: governedReasoning?.leverage_primitives || [],
      transformationClusters: governedReasoning?.transformation_clusters || [],
      bindingConstraint: governedReasoning?.binding_constraint,
      dominantMechanism: governedReasoning?.dominant_mechanism,
      ideaCount: ideaCount,
    }) : "";

    const isBusinessMode = mode === "business";

    // ── BA-specific vs Product-specific prompt blocks ──
    const personaBlock = isBusinessMode
      ? `You are an expert BUSINESS MODEL STRATEGIST who specializes in taking existing businesses and structurally reconfiguring their revenue models, pricing architectures, customer segmentation, and channel strategies to create breakthrough, commercially viable reinventions.

You think in terms of:
- Revenue model design (recurring vs transactional vs hybrid)
- Pricing architecture (tiering, bundling, value-based pricing)
- Customer segmentation and willingness-to-pay curves
- Channel partnerships and distribution leverage
- Space/asset utilization and capacity optimization
- Service productization and scalable delivery models
- Competitive positioning and market structure`
      : `You are an expert product innovation strategist who specializes in taking existing products and structurally reconfiguring them to create breakthrough, commercially viable concepts.`;

    const qualityBarBlock = isBusinessMode
      ? `THE DIFFERENCE BETWEEN A GOOD IDEA AND A GREAT ONE:
- BAD: "Offer a subscription" (generic, no specifics)
- GOOD: "A $297/mo retainer tier for builders covering unlimited design consultations + priority scheduling. At 15 clients = $53K ARR with 72% gross margin. Upsell path: $1,200 fixed-price 'Design-to-Install' packages converting 40% of retainer clients. Precedent: fractional CFO firms average 18-month LTV at similar price points."
- BAD: "Go digital" or "Add an app" (tech-first, ignores business model)
- GOOD: "Partner with 3 regional GCs as their exclusive millwork subcontractor at net-45 terms. Guaranteed $8K/mo minimum per partner × 3 = $24K/mo baseline. Reduces sales cost to zero for those units. Model: dental labs that embedded with specific practices saw 3× revenue stability."`
      : `THE DIFFERENCE BETWEEN A GOOD IDEA AND A GREAT ONE:
- BAD: "A smart version with an app" (generic, no specifics)
- GOOD: "A $39 modular version sold via social commerce targeting the specific grip frustration that online communities discuss weekly. BOM $4.20 via Shenzhen suppliers, 78% margin, breakeven at 890 units."`;

    const derivationRuleBlock = isBusinessMode
      ? `${useImpossibilityEngine ? `Your concepts must be STRUCTURALLY DERIVED — traced from a specific leverage primitive through a specific impossibility operation. If you cannot show the derivation chain, the concept is INVALID.` : `Your flipped ideas must target the BUSINESS MODEL layer — revenue structure, pricing logic, channel strategy, customer segmentation, or value chain position. NOT product features or technology. Prioritize reinventions that create recurring revenue, reduce owner-dependence, or unlock new customer segments.`}`
      : `${useImpossibilityEngine ? `Your concepts must be STRUCTURALLY DERIVED — traced from a specific leverage primitive through a specific impossibility operation. If you cannot show the derivation chain, the concept is INVALID.` : `Your flipped ideas must be BOLD, SPECIFIC, and ACTIONABLE — not vague concepts. Prioritize NOVEL approaches that create new categories or rethink how things work.`}`;

    const antiGenericBlock = isBusinessMode
      ? `ANTI-GENERIC RULES (BA MODE):
- Do NOT suggest "add an app" or "go digital" unless you specify EXACTLY what problem it solves for this specific business and what the revenue impact is
- Do NOT suggest "subscription model" without specifying: what recurring value justifies ongoing payment, the specific price point, target customer count, and churn assumptions
- Do NOT use vague phrases like "leverage technology" — name the specific operational bottleneck it removes
- Do NOT suggest ideas that require the owner to work MORE hours — the goal is to decouple revenue from billable hours
- Each idea MUST fall into one of these BA IDEA CATEGORIES:
  • Revenue Model Flip (transactional → recurring, project → retainer, hourly → fixed-price)
  • Channel Inversion (direct → embedded partnerships, B2C → B2B, retail → wholesale)
  • Pricing Architecture (cost-plus → value-based, single-tier → tiered, bundled → unbundled)
  • Space/Asset Utilization (idle capacity → revenue, single-use → multi-use, owned → shared)
  • Customer Segmentation Flip (mass → niche, residential → commercial, local → regional)
  • Value Chain Repositioning (execution → design authority, subcontractor → prime, commodity → premium)
  • Service Productization (custom → standardized, bespoke → modular, consultation → deliverable)`
      : `ANTI-GENERIC RULES:
- Do NOT suggest "add an app" or "make it smart" without specifying EXACTLY what the app/smartness does and why users would pay for it
- Do NOT suggest "subscription model" without specifying what recurring value justifies ongoing payment
- Do NOT use vague phrases like "leveraging nostalgia" — name the specific emotional trigger and who feels it`;

    const outputSchemaBlock = isBusinessMode
      ? `Each object must follow this EXACT structure:
{
  "name": "Short catchy business concept name",
  "ideaCategory": "Revenue Model Flip | Channel Inversion | Pricing Architecture | Space/Asset Utilization | Customer Segmentation Flip | Value Chain Repositioning | Service Productization",
  "description": "2-3 sentence concept pitch with specific details (price point, target customer, key differentiator, revenue model)",
  "visualNotes": "Business model diagram notes — revenue flows, customer segments, channel architecture",
  "reasoning": "Market + business model + competitive reasoning with SPECIFIC data points. Include demand signals where available (industry benchmarks, competitor pricing, customer behavior patterns). If a real analogous business model exists, cite it. If this is genuinely novel, explain what makes the timing right.",
  "feasibilityNotes": "Revenue math: price × volume = revenue. Cost structure breakdown. Customer acquisition cost estimate. Time to first revenue. Key operational requirements. Margin analysis (revenue → COGS → gross margin → overhead → net margin %)",
  "scores": {"feasibility": 5, "desirability": 6, "profitability": 5, "novelty": 7},
  "feasibilityClass": "Near-term viable | Conditional opportunity | Long-horizon concept",
  "risks": "Specific risks with named mitigation strategies. Include the #1 reason this could fail and what would need to be true for it to succeed.",
  "preservedStrengths": "What elements of the CURRENT business model this idea intentionally KEEPS and builds on (and why they're worth keeping). If everything is new, explain why a clean break is better.",
  "whyNow": "The specific market shift, regulatory change, or industry trend that makes this viable RIGHT NOW",
  "analogousSuccess": "A real company/business that proved a similar model works (with data), OR 'Novel approach' with explanation of why no precedent exists and why that's an opportunity",
  "demandSignal": "Evidence of demand: customer complaints about current model, industry pricing shifts, adjacent market growth, behavioral trends",
  "actionPlan": {
    "phase1": "First 60 days: 3-4 specific actions — contracts to draft, customers to approach, pricing to test",
    "phase2": "Month 3-6: scale actions with specific channels, hiring triggers, and metrics",
    "phase3": "Month 7-18: growth, expansion, and defensibility actions",
    "timeline": "X months to first revenue from this model",
    "estimatedInvestment": "$X–$Y",
    "revenueProjection": "$X ARR at Y clients/contracts in year 1 — SHOW THE MATH",
    "channels": ["Referral Partners", "Industry Associations", "Direct Outbound", "Strategic Alliances"]
  },
  "riskLevel": "[Risk: Low/Medium/High]",
  "capitalRequired": "[Capital: Low/Medium/High]",
  "constraint_linkage": {
    "original_assumption": "the business model assumption being structurally challenged",
    "structural_inversion": "what structural change this creates in the business",
    "causal_mechanism": "how the flip creates value through constraint removal",
    "constraint_relief_path": "which Tier 1 or Tier 2 friction this relaxes",
    "constraint_linkage_id": "ID linking to a specific friction from upstream analysis"${useImpossibilityEngine ? `,
    "derivation": {
      "primitive_targeted": "exact label from TARGET PRIMITIVES",
      "primitive_leverage_score": 0,
      "operation_applied": "constraint_weaponization | role_inversion | waste_as_product | zero_player | time_inversion",
      "impossibility_statement": "What would it look like if [constraint] didn't exist?",
      "backward_engineering": "The path from impossible → viable",
      "structural_advantage": "Why this reconfiguration compounds over time",
      "precedent": "Real company that proved a piece of this works"
    }` : ""}
  },
  "visualSpec": {
    "visual_type": "causal_chain | leverage_hierarchy",
    "title": "Short title for the visual",
    "nodes": [
      { "id": "node_id", "label": "Node label", "type": "constraint|effect|leverage|intervention|outcome", "priority": 1 }
    ],
    "edges": [
      { "from": "source_id", "to": "target_id", "relationship": "causes|relaxed_by|implemented_by|produces", "label": "optional edge label" }
    ],
    "layout": "linear | vertical",
    "interpretation": "One sentence explaining the core leverage mechanism"
  }
}`
      : `Each object must follow this EXACT structure:
{
  "name": "Short catchy product name",
  "description": "2-3 sentence concept pitch with specific details (price point, target user, key differentiator)",
  "visualNotes": "Physical design, materials, color, form factor, packaging notes — be specific",
  "reasoning": "Market + emotional + user psychology reasoning with SPECIFIC data points. Include demand signals where available (community size, search trends, cultural shifts). If a real analogous success exists, cite it. If this is genuinely novel, explain what makes the timing right.",
  "feasibilityNotes": "BOM estimate with MATH ($X per unit breakdown), specific manufacturer category (name the platform/region), tech required, MOQ, retail margin CALCULATION (BOM → retail → margin %)",
  "scores": {"feasibility": 5, "desirability": 6, "profitability": 5, "novelty": 7},
  "feasibilityClass": "Near-term viable | Conditional opportunity | Long-horizon concept",
  "risks": "Specific risks with named mitigation strategies. Include the #1 reason this could fail and what would need to be true for it to succeed.",
  "preservedStrengths": "What elements of the CURRENT product/service this idea intentionally KEEPS and builds on (and why they're worth keeping). If everything is new, explain why a clean break is better.",
  "whyNow": "The specific market shift, tech unlock, or cultural moment that makes this viable RIGHT NOW",
  "analogousSuccess": "A real company/product that proved a similar model works (with data), OR 'Novel approach' with explanation of why no precedent exists and why that's an opportunity",
  "demandSignal": "Evidence of demand: community complaints, cultural shifts, adjacent market growth, behavioral trends, or search/social signals",
  "actionPlan": {
    "phase1": "First 60 days: 3-4 specific actions with platforms/vendors named",
    "phase2": "Month 3-6: scale actions with specific channels and metrics",
    "phase3": "Month 7-18: growth and distribution actions",
    "timeline": "X months to market",
    "estimatedInvestment": "$X–$Y",
    "revenueProjection": "$X ARR at Y units/subscribers in year 1 — SHOW THE MATH",
    "channels": ["Social Commerce", "Amazon FBA", "Shopify DTC", "Kickstarter"]
  },
  "riskLevel": "[Risk: Low/Medium/High]",
  "capitalRequired": "[Capital: Low/Medium/High]",
  "constraint_linkage": {
    "original_assumption": "the assumption being structurally challenged",
    "structural_inversion": "what structural change this creates",
    "causal_mechanism": "how the flip creates value through constraint removal",
    "constraint_relief_path": "which Tier 1 or Tier 2 friction this relaxes",
    "constraint_linkage_id": "ID linking to a specific friction from upstream analysis"${useImpossibilityEngine ? `,
    "derivation": {
      "primitive_targeted": "exact label from TARGET PRIMITIVES",
      "primitive_leverage_score": 0,
      "operation_applied": "constraint_weaponization | role_inversion | waste_as_product | zero_player | time_inversion",
      "impossibility_statement": "What would it look like if [constraint] didn't exist?",
      "backward_engineering": "The path from impossible → viable",
      "structural_advantage": "Why this reconfiguration compounds over time",
      "precedent": "Real company that proved a piece of this works"
    }` : ""}
  },
  "visualSpec": {
    "visual_type": "causal_chain | leverage_hierarchy",
    "title": "Short title for the visual",
    "nodes": [
      { "id": "node_id", "label": "Node label", "type": "constraint|effect|leverage|intervention|outcome", "priority": 1 }
    ],
    "edges": [
      { "from": "source_id", "to": "target_id", "relationship": "causes|relaxed_by|implemented_by|produces", "label": "optional edge label" }
    ],
    "layout": "linear | vertical",
    "interpretation": "One sentence explaining the core leverage mechanism"
  }
}`;

    const groundingRulesBlock = isBusinessMode
      ? `GROUNDING RULES — make ideas SPECIFIC to THIS BUSINESS, not generic:
1. If a real analogous business model exists that validates this approach, cite it — it strengthens the case. But don't force-fit irrelevant comparisons.
2. Show demand signals where possible: customer complaints about current pricing, industry margin benchmarks, competitor pricing structures, market consolidation trends
3. Show REAL revenue math: price × volume = revenue → COGS → gross margin → overhead → net margin
4. Name the SPECIFIC business model friction this resolves — what operational bottleneck or revenue ceiling does this break?
5. Include a "why now" trigger — what makes this viable TODAY for this specific industry/geography?
6. Consider the OWNER'S perspective: Does this reduce owner-dependence? Increase enterprise value? Create defensible recurring revenue?`
      : `GROUNDING RULES — make ideas SPECIFIC, not generic:
1. If a real analogous product/company exists that validates this model, cite it — it strengthens the case. But don't force-fit irrelevant comparisons.
2. Show demand signals where possible: community complaints, cultural shifts, adjacent market growth, behavioral trends, search/social data
3. Show REAL unit economics math: BOM cost → retail price → margin % → breakeven units
4. Name the SPECIFIC gap this fills — what frustration or unmet need does this address?
5. Include a "why now" trigger — what makes this viable TODAY?`;

    const diversityRuleBlock = isBusinessMode
      ? `- Each idea must target a DIFFERENT BA idea category (e.g., one Revenue Model Flip, one Channel Inversion, one Pricing Architecture)
- ANTI-INCREMENTALISM: If a business consultant would say "that's obvious" → REJECT and dig deeper
- Do NOT default to technology solutions — process, pricing, and structural changes first`
      : `- Each idea must be DIFFERENT in structural approach (e.g. one could be a material flip, one a business model flip, one an audience flip)`;

    const systemPrompt = `You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.
${getReasoningFramework()}
${branchPrompt}${adaptivePrompt}
CORE PRINCIPLES:
- First-principles reasoning over analogy or convention
- Decompose every system into at least 3 layers of depth
- Never present modeled or inferred data as verified fact

${useImpossibilityEngine ? `MODE: STRUCTURAL IMPOSSIBILITY ENGINE ACTIVE
You are NOT brainstorming ideas. You are systematically deriving structural reconfigurations
from the system's irreducible primitives using impossibility operations.
Every concept must trace back to a specific primitive + operation combination.
NO freestyle idea generation. NO incremental optimization. ONLY structural derivation.` : `MODE: ${isBusinessMode ? "BUSINESS MODEL REINVENTION" : "CREATIVE EXPLORATION"} (${isBusinessMode ? "business strategist active" : "no structural data available"})
${isBusinessMode ? "Generate bold, specific, actionable BUSINESS MODEL reinventions — NOT product ideas." : "Generate bold, specific, actionable product ideas."}`}

OUTPUT RULES:
- Metrics must be ≤12 words
- Include leverage scores (1-10) on key assumptions
- Flag risk levels: [Risk: Low/Medium/High]
- Flag capital requirements: [Capital: Low/Medium/High]
- Use directional indicators: ↑ ↓ → for trends

${personaBlock}

${derivationRuleBlock}

IMPORTANT: Not everything needs to be flipped. If parts of the current ${isBusinessMode ? "business model" : "product/service"} already work well (${isBusinessMode ? "customer relationships, reputation, craftsmanship quality, local market position" : "pricing model, core feature, delivery method, audience"}), CALL THAT OUT and build on it. The best flips preserve what's strong and reinvent what's broken.

${qualityBarBlock}

When a real analogous success exists, cite it — it strengthens the case. When an idea is genuinely novel with no precedent, that's fine — explain WHY the timing is right and what demand signals support it.

Respond with ONLY a valid JSON array of flipped idea objects (no markdown, no explanation).

${outputSchemaBlock}

SCORE CALIBRATION RULES:
- 5-6 is the DEFAULT range for most ideas. Most flipped ideas should land here.
- 7-8 = strong but cite specific evidence and constraints.
- ≥8 requires: specific supporting evidence, enabling conditions, and what must be true. If evidence is weak → cap at 7.
- 9-10 = rare, exceptional, defensible. Almost never assigned.
- Long-horizon concepts CANNOT score above 6 on any dimension.
- Every idea MUST include "feasibilityClass": "Near-term viable", "Conditional opportunity", or "Long-horizon concept".
- Before finalizing scores, ask: "What would cause this to fail?" If failure risk is material → reduce score.`;

    const userPrompt = `Generate ${ideaCount} bold, commercially viable "flipped" ${isBusinessMode ? "business model reinventions" : "product ideas"} for this ${isBusinessMode ? "business" : "product"}.

PRODUCT: ${product.name}
CATEGORY: ${product.category}
DESCRIPTION: ${product.description}
SPECS: ${product.specs}
ERA: ${product.era}
TARGET AUDIENCE: ${audience}
MARKET SIZE: ${product.marketSizeEstimate || "Unknown"}
KEY INSIGHT: ${product.keyInsight || ""}

CURRENT PRICING:
${product.pricingIntel ? `- Market: ${product.pricingIntel.currentMarketPrice}\n- Resale avg: ${product.pricingIntel.resaleAvgSold || product.pricingIntel.ebayAvgSold}\n- Trend: ${product.pricingIntel.priceDirection}` : "See description"}

CURRENT ASSUMPTIONS TO CHALLENGE:
${product.assumptionsMap?.map((a: { assumption: string; challenge: string }) => `• ${a.assumption} → ${a.challenge}`).join("\n") || `All ${isBusinessMode ? "revenue model, pricing, channel, and operational" : "design, pricing, audience, and usage"} assumptions`}

KNOWN COMPLAINTS/PAIN POINTS:
${product.reviews?.filter((r: { sentiment: string }) => r.sentiment === "negative").map((r: { text: string }) => `• ${r.text}`).join("\n") || `General ${isBusinessMode ? "operational and revenue model" : "usability and cost"} concerns`}

COMMUNITY IMPROVEMENT REQUESTS:
${(product as { communityInsights?: { improvementRequests?: string[] } }).communityInsights?.improvementRequests?.map((r: string) => `• ${r}`).join("\n") || "Not available"}

COMPETITOR GAPS:
${(product as { competitorAnalysis?: { gaps?: string[] } }).competitorAnalysis?.gaps?.map((g: string) => `• ${g}`).join("\n") || "Not available"}

TREND CONTEXT:
${product.trendAnalysis || (isBusinessMode ? "Service industry consolidation with demand for scalable, recurring-revenue models" : "Nostalgia-driven market with modern tech expectations")}

ADDITIONAL CONTEXT: ${additionalContext || (isBusinessMode ? "Focus on business model reinvention: recurring revenue, pricing architecture, channel strategy, and operational leverage." : "Focus on modern market opportunities and emerging consumer trends.")}
${steeringText ? `\nUSER STEERING GUIDANCE: ${steeringText}` : ""}
${insightPreferences ? `\nUSER INSIGHT PREFERENCES (prioritize liked, exclude dismissed):
${Object.entries(insightPreferences as Record<string, string>).filter(([, s]) => s === "liked").map(([id]) => `✓ LIKED: ${id}`).join("\n")}
${Object.entries(insightPreferences as Record<string, string>).filter(([, s]) => s === "dismissed").map(([id]) => `✗ DISMISSED: ${id}`).join("\n")}` : ""}

${upstreamIntel ? `UPSTREAM INTELLIGENCE (use to ground ideas in real market data):
${upstreamIntel.supplyChain ? `SUPPLY CHAIN:
- Suppliers: ${JSON.stringify((upstreamIntel.supplyChain as any).suppliers || [])}
- Manufacturers: ${JSON.stringify((upstreamIntel.supplyChain as any).manufacturers || [])}
- Distributors: ${JSON.stringify((upstreamIntel.supplyChain as any).distributors || [])}` : ""}
${upstreamIntel.communityInsights ? `COMMUNITY INSIGHTS:
- Sentiment: ${(upstreamIntel.communityInsights as any).communitySentiment || "N/A"}
- Top Complaints: ${((upstreamIntel.communityInsights as any).topComplaints || []).map((c: string) => `• ${c}`).join("\n  ")}
- Improvement Requests: ${((upstreamIntel.communityInsights as any).improvementRequests || []).map((r: string) => `• ${r}`).join("\n  ")}` : ""}
${upstreamIntel.pricingIntel ? `PRICING INTEL: ${JSON.stringify(upstreamIntel.pricingIntel)}` : ""}
${upstreamIntel.patentLandscape ? `PATENT LANDSCAPE:
- Total Patents: ${(upstreamIntel.patentLandscape as any).totalPatents || "unknown"}
- Expired: ${(upstreamIntel.patentLandscape as any).expiredPatents || "unknown"}
- Key Players: ${JSON.stringify((upstreamIntel.patentLandscape as any).keyPlayers || [])}
- Gap Analysis: ${(upstreamIntel.patentLandscape as any).gapAnalysis || "N/A"}` : ""}
${upstreamIntel.userWorkflow ? `USER WORKFLOW FRICTION:
- Steps: ${((upstreamIntel.userWorkflow as any).stepByStep || []).join(" → ")}
- Key Friction: ${((upstreamIntel.userWorkflow as any).frictionPoints || []).map((f: any) => `${f.friction} (${f.severity})`).join("; ")}
- Cognitive Load: ${(upstreamIntel.userWorkflow as any).cognitiveLoad || "N/A"}` : ""}` : ""}

${disruptContext ? `UPSTREAM EVIDENCE — Hidden assumptions and flipped logic (use as grounding evidence, NOT as the source of ideas):
HIDDEN ASSUMPTIONS:
${(disruptContext.hiddenAssumptions || []).map((a: any, i: number) => `${i + 1}. "${a.assumption}" — Leverage: ${a.leverageScore || "?"}/10${a.impactScenario ? `, Impact: ${a.impactScenario}` : ""}`).join("\n")}

FLIPPED LOGIC:
${(disruptContext.flippedLogic || []).map((f: any, i: number) => `${i + 1}. "${f.originalAssumption}" → "${f.boldAlternative}"`).join("\n")}
` : ""}

${useImpossibilityEngine ? impossibilityBlock : (governedReasoning ? `STRUCTURAL REASONING CONTEXT:
${governedReasoning.binding_constraint ? `BINDING CONSTRAINT: ${JSON.stringify(governedReasoning.binding_constraint)}` : ""}
${governedReasoning.dominant_mechanism ? `DOMINANT MECHANISM: ${JSON.stringify(governedReasoning.dominant_mechanism)}` : ""}
${governedReasoning.constraint_map_summary?.friction_tiers ? `FRICTION TIERS:
${(governedReasoning.constraint_map_summary.friction_tiers as any[]).map((t: any, i: number) => `${i + 1}. ${t.constraint || t.name || JSON.stringify(t)}`).join("\n")}` : ""}
${governedReasoning.transformation_clusters ? `TRANSFORMATION CLUSTERS:
${(governedReasoning.transformation_clusters as any[]).map((tc: any, i: number) => `${i + 1}. "${tc.cluster_name || tc.theme}" — ${(tc.transformations || []).join(", ")}`).join("\n")}` : ""}
${governedReasoning.reasoning_synopsis ? `SYNOPSIS: ${governedReasoning.reasoning_synopsis}` : ""}` : "")}

${groundingRulesBlock}

${antiGenericBlock}
${useImpossibilityEngine ? `- Each idea must target a DIFFERENT primitive or use a DIFFERENT impossibility operation
- ANTI-INCREMENTALISM: If an industry insider would say "that's obvious" → REJECT and dig deeper` : diversityRuleBlock}
- NOVEL ideas without precedent are WELCOME — explain why the timing is right and what signals support them

Return ONLY a JSON array with exactly ${ideaCount} flipped idea objects.${buildLensPrompt(lens)}`;

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
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    // Extract JSON array — find first [ and last ]
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleaned = cleaned.slice(firstBracket, lastBracket + 1);
    }

    let ideas;
    try {
      ideas = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed:", cleaned.slice(0, 300));
      // Attempt to salvage complete objects from truncated JSON
      const salvaged: unknown[] = [];
      let depth = 0, start = -1;
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === "{") { if (depth === 0) start = i; depth++; }
        else if (cleaned[i] === "}") {
          depth--;
          if (depth === 0 && start !== -1) {
            try { salvaged.push(JSON.parse(cleaned.slice(start, i + 1))); } catch { /* skip */ }
            start = -1;
          }
        }
      }
      if (salvaged.length > 0) {
        console.log(`Salvaged ${salvaged.length} idea(s) from truncated JSON`);
        ideas = salvaged;
      } else {
        throw new Error("AI returned invalid JSON. Please retry.");
      }
    }

    if (!Array.isArray(ideas)) ideas = [ideas];

    // Enforce visual contract on each idea that has a visualSpec
    for (const idea of ideas) {
      if (idea && typeof idea === "object") {
        // Per-idea visual spec is optional but enforce if schema expects it
        const ideaObj = idea as Record<string, unknown>;
        if (!ideaObj.visualSpec || !(ideaObj.visualSpec as Record<string, unknown>)?.nodes?.length) {
          // Generate a minimal per-idea visual from available data
          const name = String(ideaObj.name || "Idea");
          ideaObj.visualSpec = {
            visual_type: "causal_chain",
            title: `${name} — Mechanism`,
            nodes: [
              { id: "constraint", label: String(ideaObj.demandSignal || "Market gap").slice(0, 50), type: "constraint", priority: 1 },
              { id: "intervention", label: name.slice(0, 50), type: "intervention", priority: 2 },
              { id: "outcome", label: String(ideaObj.whyNow || "New value created").slice(0, 50), type: "outcome", priority: 3 },
            ],
            edges: [
              { from: "constraint", to: "intervention", relationship: "relaxed_by" },
              { from: "intervention", to: "outcome", relationship: "produces" },
            ],
            layout: "linear",
            interpretation: `${name} addresses the identified gap to produce the target outcome.`,
          };
        }
      }
    }

    // ── Governed: validate constraint_linkage on each idea ──
    let linkageErrors: string[] = [];
    for (const idea of ideas) {
      if (idea && typeof idea === "object") {
        const ideaObj = idea as Record<string, unknown>;
        const linkage = ideaObj.constraint_linkage as Record<string, unknown> | undefined;
        if (!linkage || !linkage.constraint_linkage_id || String(linkage.constraint_linkage_id).trim() === "") {
          linkageErrors.push(`Idea "${ideaObj.name || "Unknown"}" missing constraint_linkage_id`);
        }
        if (!linkage || !linkage.causal_mechanism || String(linkage.causal_mechanism).trim() === "") {
          linkageErrors.push(`Idea "${ideaObj.name || "Unknown"}" missing causal_mechanism`);
        }
      }
    }

    if (linkageErrors.length > 0) {
      console.error(`[Governed] FLIP LINKAGE FAILURES: ${linkageErrors.join("; ")}`);
      return new Response(JSON.stringify({
        success: false,
        error: "Governed validation failed — flip ideas missing constraint linkage",
        linkage_errors: linkageErrors,
        ideas, // include partial for client to display
      }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, ideas }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-flip-ideas error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
