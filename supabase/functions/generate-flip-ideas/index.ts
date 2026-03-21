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
    const hasStructuralData = !!(governedReasoning?.binding_constraint || governedReasoning?.leverage_primitives?.length > 0);

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
      : `You are an expert product innovation strategist and mechanical engineer who turns deep structural analysis into "I never thought of that" product reinventions.

You think in terms of:
- Failure mode elimination (root cause → engineering solution → lifespan/quality delta)
- Material science (specific polymers, alloys, composites — named, not generic)
- Manufacturing physics (which process constraints create cost floors, and how to break them)
- Brand architecture (when commodity positioning is the REAL constraint, not the product design)
- Distribution physics (D2C margin capture, B2B contract structures, subscription mechanics for physical goods)
- Adjacent user segments that the current product accidentally excludes`;

    const qualityBarBlock = isBusinessMode
      ? `THE DIFFERENCE BETWEEN A GOOD IDEA AND A GREAT ONE:
- BAD: "Offer a subscription" (generic, no specifics)
- GOOD: "A $297/mo retainer tier for builders covering unlimited design consultations + priority scheduling. At 15 clients = $53K ARR with 72% gross margin. Upsell path: $1,200 fixed-price 'Design-to-Install' packages converting 40% of retainer clients. Precedent: fractional CFO firms average 18-month LTV at similar price points."
- BAD: "Go digital" or "Add an app" (tech-first, ignores business model)
- GOOD: "Partner with 3 regional GCs as their exclusive millwork subcontractor at net-45 terms. Guaranteed $8K/mo minimum per partner × 3 = $24K/mo baseline. Reduces sales cost to zero for those units. Model: dental labs that embedded with specific practices saw 3× revenue stability."`
      : `THE DIFFERENCE BETWEEN A GOOD IDEA AND A GREAT ONE:
- BAD: "A premium version using better materials" (no specifics — anyone could say this)
- GOOD: "Replace ABS with 30% glass-filled nylon (PA66-GF30, $0.08/unit delta at 10K MOQ from Dongguan Kingfa). 3× impact resistance enables a 'lifetime replacement guarantee' — shifts positioning from $1.50 commodity to $18/unit D2C with 74% gross margin. Precedent: OXO Good Grips replaced commodity kitchen tools with ergonomic premium versions and captured 60%+ of the knife block category."
- BAD: "Create a smart version with IoT sensors" (tech-first, ignores whether users would pay for it)
- GOOD: "Target corporate HR relocation managers as the buyer — not consumers. A $340 'New Hire Closet Kit' (40 premium hangers + cedar sachets + storage hooks) becomes a recurring B2B purchase at onboarding. No retail middlemen. Estimated 100 corporate clients × $340/quarter = $136K ARR with 68% gross margin. Zero direct competition in this segment today."
- BAD: "Add a subscription model" (mechanism-free, no specifics)
- GOOD: "Subscription hanger swap: $12/mo for 12 hangers/quarter, we take the old ones back for recycling. Targets the 2.3M r/BuyItForLife subscribers who will pay a premium to never think about this again. BOM: $0.85/unit, net revenue after shipping $7.20/mo per subscriber. At 5,000 subscribers = $432K ARR. Precedent: Dollar Shave Club applied the same logic to razors ($3 commodity → $9/mo subscription → $1B acquisition)."`;


    const derivationRuleBlock = isBusinessMode
      ? `${useImpossibilityEngine ? `Your concepts must be STRUCTURALLY DERIVED — traced from a specific leverage primitive through a specific impossibility operation. If you cannot show the derivation chain, the concept is INVALID.` : `Your flipped ideas must target the BUSINESS MODEL layer — revenue structure, pricing logic, channel strategy, customer segmentation, or value chain position. NOT product features or technology. Prioritize reinventions that create recurring revenue, reduce owner-dependence, or unlock new customer segments.`}`
      : `${useImpossibilityEngine ? `Your concepts must be STRUCTURALLY DERIVED — traced from a specific leverage primitive through a specific impossibility operation. If you cannot show the derivation chain, the concept is INVALID.` : `Your flipped ideas must be BOLD, SPECIFIC, and COMMERCIALLY GROUNDED — traced from the structural analysis above to a specific reinvention. Prioritize ideas that attack the BINDING CONSTRAINT identified in the structural data. Each idea must name specific materials, manufacturers, price points, and buyers. "Better version of the same thing" is NOT a flip — find the structural assumption that makes the current product weak, and break it.`}`;

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
      : `ANTI-GENERIC RULES (PRODUCT MODE):
- Do NOT suggest "add an app" or "make it smart" without specifying EXACTLY: what sensor/chip, what failure mode it detects, why users would pay the BOM premium, and what evidence shows they will
- Do NOT suggest "premium version" without specifying: WHICH material replaces WHICH current material, exact cost delta per unit at 10K MOQ, specific supplier names/regions, and what performance metric improves by how much
- Do NOT suggest "subscription model" for a physical product without specifying: the recurring consumption mechanism (what depletes or needs replacement?), the specific price point and frequency, and a real precedent that proves consumers accept physical subscriptions in this category
- Do NOT use vague "leverage nostalgia" or "target eco-conscious consumers" — name the SPECIFIC buyer, the specific platform they buy on, and the specific message that converts them
- Do NOT default to technology when engineering or distribution is the real lever
- Each idea MUST fall into one of these PRODUCT IDEA CATEGORIES and explicitly state it:
  • Engineering Reinvention (material/mechanism/geometry change that eliminates a specific failure mode — requires: named material, BOM cost delta, lifespan improvement)
  • Brand Architecture Flip (commodity/disposable positioning → premium/permanent — requires: named precedent brand, price tier, margin math)
  • Distribution Disruption (new channel that captures margin currently taken by intermediaries — requires: named channel, margin delta, first move)
  • Adjacent Buyer Capture (same product, radically different buyer who has MORE willingness to pay — requires: named buyer category, channel to reach them, unit economics)
  • Ecosystem Extension (accessories/refills/services that create recurring revenue from existing physical product — requires: specific recurring component, frequency of purchase, LTV math)
  • Category Creation (reframe the product's job-to-be-done to open an uncontested market — requires: the new JTBD statement, the community that holds it, why incumbents can't follow)`;

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
  "name": "Short catchy product/concept name",
  "ideaCategory": "Engineering Reinvention | Brand Architecture Flip | Distribution Disruption | Adjacent Buyer Capture | Ecosystem Extension | Category Creation",
  "description": "2-3 sentence concept pitch. Must include: specific price point, specific target buyer, specific differentiator that no current competitor offers. No vague language.",
  "visualNotes": "Physical design, materials (named specifically), color, form factor, packaging notes. If this is a distribution/brand flip, describe the brand visual identity and shelf/digital presence.",
  "reasoning": "Market + structural reasoning with SPECIFIC data points. Trace the reasoning from the binding constraint above to this opportunity. If a real analogous success exists (OXO Good Grips, Dollar Shave Club, etc.), cite it with specific numbers. If genuinely novel, explain what demand signal supports it.",
  "feasibilityNotes": "BOM cost with line-item MATH ($X per unit breakdown at 10K MOQ), specific manufacturer region/platform, MOQ, retail margin CALCULATION (BOM → wholesale → retail → gross margin %). For distribution/brand flips: show the CAC → LTV math instead.",
  "scores": {"feasibility": 5, "desirability": 6, "profitability": 5, "novelty": 7},
  "feasibilityClass": "Near-term viable | Conditional opportunity | Long-horizon concept",
  "risks": "Specific risks with named mitigation strategies. Include the #1 reason this fails and what must be true for it to succeed.",
  "preservedStrengths": "What elements of the CURRENT product this idea intentionally KEEPS and builds on. If abandoning everything, explain why a clean break is better.",
  "whyNow": "The specific market shift, material unlock, community signal, or distribution change that makes this viable TODAY — not 5 years ago, not next year.",
  "analogousSuccess": "A real company/product that proved a structurally similar move works (with data: revenue, units, timeframe), OR 'Novel approach' with explanation of why no precedent exists and why that's an advantage.",
  "demandSignal": "Evidence of demand: specific community size, complaint frequency, search trend data, adjacent market growth, or behavioral pattern. Be concrete — 'r/BuyItForLife has 2.3M members who actively discuss this exact product category' is evidence. 'Consumers want better products' is not.",
  "actionPlan": {
    "phase1": "First 60 days: 3-4 specific actions — name the Alibaba category to search, the supplier to contact, the community to post in, the prototype method",
    "phase2": "Month 3-6: scale actions with specific channels named (Amazon FBA, TikTok Shop, specific retailer, etc.) and metrics to hit",
    "phase3": "Month 7-18: growth and defensibility actions — what creates a moat?",
    "timeline": "X months to first revenue",
    "estimatedInvestment": "$X–$Y",
    "revenueProjection": "$X ARR at Y units/subscribers in year 1 — SHOW THE MATH (units × price × margin = net revenue)",
    "channels": ["Most specific channel first", "Second channel", "Third channel"]
  },
  "riskLevel": "[Risk: Low/Medium/High]",
  "capitalRequired": "[Capital: Low/Medium/High]",
  "constraint_linkage": {
    "original_assumption": "the product design or market assumption being structurally challenged",
    "structural_inversion": "the specific structural change this creates (material → new material, channel → new channel, buyer → new buyer)",
    "causal_mechanism": "how removing THIS assumption creates THESE economics",
    "constraint_relief_path": "which specific failure mode or friction from the structural analysis this resolves",
    "constraint_linkage_id": "ID linking to a specific primitive or friction from upstream structural analysis"${useImpossibilityEngine ? `,
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
      : `GROUNDING RULES — make ideas SPECIFIC to THIS PRODUCT, not generic:
1. Every idea must trace back to a SPECIFIC structural finding in the analysis above (failure mode, leverage primitive, or binding constraint). State which one.
2. Show REAL unit economics: BOM cost line-by-line → MOQ → retail/D2C price → gross margin → breakeven units. Use real supplier regions/platforms.
3. Name the SPECIFIC community, platform, or buyer segment this reaches — not "consumers" but "r/BuyItForLife subscribers" or "corporate HR managers handling 200+ onboardings/year" or "professional photographers who currently spend $X on a competitor."
4. Include a "why now" trigger — what specific material, manufacturing, distribution, or cultural development makes this viable TODAY that didn't exist 5 years ago?
5. The FIRST MOVE must be executable in a workshop or at a desk THIS WEEK — prototype the mechanism with $50 in hardware, post a survey in the specific community, call a specific Alibaba supplier.`;

    const diversityRuleBlock = isBusinessMode
      ? `- Each idea must target a DIFFERENT BA idea category (e.g., one Revenue Model Flip, one Channel Inversion, one Pricing Architecture)
- ANTI-INCREMENTALISM: If a business consultant would say "that's obvious" → REJECT and dig deeper
- Do NOT default to technology solutions — process, pricing, and structural changes first`
      : `- Each idea must target a DIFFERENT product idea category (ideaCategory field must be distinct for each)
- ANTI-INCREMENTALISM: If a product manager would say "that's on our roadmap already" → REJECT and find the structural reinvention they haven't thought of
- Do NOT cluster ideas around the same transformation (e.g. 3 variants of "use better materials" is NOT diversity)
- REQUIRED diversity: at least one idea must attack the DISTRIBUTION or BUYER assumption, not just the physical product design`;


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
NO freestyle idea generation. NO incremental optimization. ONLY structural derivation.` : `MODE: ${isBusinessMode ? "BUSINESS MODEL REINVENTION (business strategist active)" : hasStructuralData ? "PRODUCT INNOVATION ENGINE (structural analysis grounded)" : "PRODUCT INNOVATION ENGINE (first-principles mode)"}
${isBusinessMode ? "Generate bold, specific, actionable BUSINESS MODEL reinventions — NOT product ideas." : hasStructuralData ? "Generate bold, specific, actionable product reinventions GROUNDED IN THE STRUCTURAL ANALYSIS provided. Every idea must trace back to a specific failure mode, leverage primitive, or binding constraint identified above. Do NOT generate ideas that a random AI would generate without reading the structural data — that is the definition of failure." : "Generate bold, specific, actionable product ideas grounded in the product data provided."}`}

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

    // ── Governed: validate constraint_linkage on each idea (soft warning, not blocking) ──
    let linkageWarnings: string[] = [];
    for (const idea of ideas) {
      if (idea && typeof idea === "object") {
        const ideaObj = idea as Record<string, unknown>;
        const linkage = ideaObj.constraint_linkage as Record<string, unknown> | undefined;
        if (!linkage || !linkage.constraint_linkage_id || String(linkage.constraint_linkage_id).trim() === "") {
          linkageWarnings.push(`Idea "${ideaObj.name || "Unknown"}" missing constraint_linkage_id`);
          // Auto-fill a placeholder linkage so downstream consumers don't break
          if (!ideaObj.constraint_linkage) ideaObj.constraint_linkage = {};
          const cl = ideaObj.constraint_linkage as Record<string, unknown>;
          if (!cl.constraint_linkage_id) cl.constraint_linkage_id = `auto_${Date.now()}`;
          if (!cl.causal_mechanism) cl.causal_mechanism = ideaObj.reasoning || "Structural reconfiguration";
          if (!cl.original_assumption) cl.original_assumption = "Inherited assumption";
          if (!cl.structural_inversion) cl.structural_inversion = ideaObj.description || "Model inversion";
        }
      }
    }

    if (linkageWarnings.length > 0) {
      console.warn(`[Governed] FLIP LINKAGE WARNINGS (auto-filled): ${linkageWarnings.join("; ")}`);
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
