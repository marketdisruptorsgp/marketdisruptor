/**
 * CONCEPT SYNTHESIS — Invention Engine (Product Mode only)
 * 
 * Generates 4-6 causally-traced, engineering-grounded invention concepts
 * by combining three knowledge layers:
 *   Layer 1: Structural Pressure (from decomposition)
 *   Layer 2: Assumption Breaks (from strategic-synthesis)
 *   Layer 3: Technical Mechanisms (embedded library)
 * 
 * Each concept traces: Structure + Assumption + Mechanism → Concept
 * 
 * Enhanced with:
 *   - Before/After Narrative: "The Old Way" vs "The New Way" per concept
 *   - Multi-Lens Comparison: Same analysis refracted through different personas
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ═══════════════════════════════════════════════════════════════
//  MECHANISM LIBRARY — ~40 technical enablers
// ═══════════════════════════════════════════════════════════════

const MECHANISM_LIBRARY = `
TECHNICAL MECHANISM LIBRARY — Use these as your palette when generating concepts.
Each concept MUST use at least one mechanism from this library (or a closely related variant).

## Fluid/Seal
1. Magnetic Fluid Seals | Ferrofluid held by magnets creates zero-wear seal | Applicable: rotating shafts, pumps, valves | Mfg: injection + magnet assembly
2. Hydrophobic/Oleophobic Coatings | Nano-textured surfaces repel water/oil | Applicable: surfaces, filters, optics | Mfg: spray/dip coating
3. Pressure-Sensing Membranes | Thin film deforms proportionally to pressure | Applicable: flow monitoring, leak detection | Mfg: MEMS fabrication
4. Elastomeric Lip Seals with Embedded Sensors | Traditional seal + strain gauge | Applicable: rotating equipment condition monitoring | Mfg: co-molding
5. Self-Healing Gaskets | Polymer matrix with microencapsulated sealant | Applicable: pipe joints, flanges | Mfg: extrusion with additive

## Sensing
6. Ultrasonic Flow Sensing | Non-invasive transit-time measurement | Applicable: liquid/gas flow, pipe-mounted | Mfg: transducer bonding
7. Piezoelectric Vibration Sensing | Crystal generates voltage from mechanical stress | Applicable: condition monitoring, impact detection | Mfg: ceramic sintering
8. Capacitive Touch/Proximity | Detects changes in electric field | Applicable: UI controls, level sensing, proximity | Mfg: PCB traces + firmware
9. MEMS Accelerometers | Micro-machined silicon mass on springs | Applicable: orientation, vibration, impact | Mfg: semiconductor fab
10. Infrared Thermography | Non-contact surface temperature mapping | Applicable: equipment monitoring, quality inspection | Mfg: IR sensor module
11. Ambient Light Sensing (ALS) | Photodiode measures environmental light | Applicable: adaptive displays, energy management | Mfg: SMD component
12. Time-of-Flight Distance Sensing | Laser/LED pulse timing measures distance | Applicable: level measurement, obstacle detection | Mfg: module integration

## Materials
13. Shape Memory Alloys (NiTi) | Returns to preset shape when heated | Applicable: actuators, connectors, medical | Mfg: wire drawing, heat treatment
14. Self-Healing Polymers | Microcapsule or intrinsic reversible bonds | Applicable: coatings, structural components | Mfg: compounding + molding
15. Antimicrobial Surfaces (Cu/Ag ion) | Metal ions kill bacteria on contact | Applicable: touchpoints, medical, food | Mfg: plating, co-extrusion, additive
16. Phase-Change Materials (PCM) | Absorb/release latent heat at transition | Applicable: thermal management, comfort | Mfg: microencapsulation
17. Aerogel Insulation | Ultra-low thermal conductivity solid | Applicable: thermal barriers, lightweight insulation | Mfg: sol-gel process
18. Carbon Fiber Reinforced Polymer | High strength-to-weight ratio | Applicable: structural components | Mfg: layup, pultrusion, filament winding
19. Biodegradable Polymers (PLA/PHA) | Compostable alternatives to petro-plastics | Applicable: packaging, disposable components | Mfg: extrusion, injection molding

## Assembly
20. Modular Snap-Fit | Tool-free assembly/disassembly | Applicable: consumer products, field service | Mfg: injection molding with living hinges
21. Bayonet Mount | Quarter-turn lock mechanism | Applicable: quick-change components, filters | Mfg: stamping + molding
22. Tool-Free Replacement (Quick-Release) | Lever/cam locks for field swap | Applicable: maintenance-heavy equipment | Mfg: die casting + machining
23. Magnetic Alignment/Attachment | Rare-earth magnets for self-aligning assembly | Applicable: accessories, modular systems | Mfg: magnet integration
24. Threaded Insert / Heat-Set Inserts | Brass inserts for repeatable fastening in plastic | Applicable: enclosures needing repeated access | Mfg: ultrasonic or heat insertion

## Actuation
25. Solenoid Actuation | Electromagnetic linear push/pull | Applicable: valves, locks, mechanisms | Mfg: coil winding + plunger
26. Servo/Stepper Motor | Precise rotational positioning | Applicable: positioning, dosing, adjustment | Mfg: motor assembly
27. Pneumatic Actuation | Compressed air drives linear/rotary motion | Applicable: industrial, high-force | Mfg: cylinder machining
28. Bi-Metallic Thermal Actuator | Differential expansion moves mechanism | Applicable: passive temperature response | Mfg: bonding dissimilar metals
29. Electroactive Polymers (EAP) | Polymer deforms under voltage | Applicable: soft robotics, haptics | Mfg: thin film deposition
30. Piezoelectric Stack Actuators | High force, small displacement | Applicable: precision positioning, fuel injectors | Mfg: ceramic stacking

## Surface
31. Self-Cleaning (Lotus Effect) | Micro/nanostructure causes superhydrophobicity | Applicable: exterior surfaces, solar panels | Mfg: etching, spray coating
32. Anti-Fouling Coatings | Prevents biological/mineral buildup | Applicable: marine, plumbing, medical | Mfg: chemical coating
33. Wear-Resistant Ceramics (Al₂O₃/ZrO₂) | Extreme hardness for abrasion resistance | Applicable: bearings, cutting tools, seals | Mfg: sintering, plasma spray
34. Diamond-Like Carbon (DLC) | Ultra-hard, low-friction coating | Applicable: sliding surfaces, tooling | Mfg: PVD/CVD
35. Photocatalytic Surfaces (TiO₂) | UV-activated self-cleaning and antimicrobial | Applicable: building materials, filters | Mfg: sputtering, sol-gel

## Communication
36. Bluetooth Low Energy (BLE) | Short-range, low-power wireless | Applicable: IoT, wearables, consumer | Mfg: SoC module integration
37. NFC (Near-Field Communication) | Tap-to-connect, passive tags | Applicable: authentication, pairing, data transfer | Mfg: antenna + chip module
38. LoRa (Long Range) | Low-power, long-range (km scale) | Applicable: remote monitoring, agriculture | Mfg: radio module integration
39. Passive RFID | No battery, powered by reader field | Applicable: inventory, tracking, authentication | Mfg: tag printing + chip attach
40. Thread/Matter | Mesh networking for smart home | Applicable: building automation, smart home | Mfg: SoC with Thread stack

## Energy
41. Energy Harvesting (Piezo/Solar/Thermal) | Converts ambient energy to electrical | Applicable: remote sensors, wearables | Mfg: transducer integration
42. Supercapacitors | High power density, fast charge/discharge | Applicable: burst power, regenerative systems | Mfg: electrode fabrication
43. Wireless Power Transfer (Qi) | Inductive charging without connectors | Applicable: consumer electronics, medical implants | Mfg: coil + controller integration
`.trim();

// ═══════════════════════════════════════════════════════════════
//  PERSONA LENSES — Multi-lens comparison
// ═══════════════════════════════════════════════════════════════

const PERSONA_LENSES = [
  {
    id: "garage_inventor",
    label: "Garage Inventor",
    emoji: "🔧",
    description: "Solo maker with limited budget, access to 3D printing & basic shop tools",
    constraints: "Budget under $5K for prototype. Must be buildable with consumer-grade tools (3D printer, CNC router, basic electronics). No clean room or specialized equipment. Optimize for rapid iteration and proof-of-concept.",
    priorities: "Speed to first prototype, low tooling cost, manual assembly OK, can tolerate lower volume manufacturing",
  },
  {
    id: "product_company",
    label: "Product Company",
    emoji: "🏭",
    description: "Established manufacturer with engineering team, tooling budget, and distribution",
    constraints: "Has injection molding, CNC, and assembly capabilities. Can invest $50K-500K in tooling. Needs to fit existing supply chain and distribution channels. Must meet retail price expectations.",
    priorities: "Unit economics at 10K+ scale, retail-ready quality, regulatory compliance, existing channel fit, brand differentiation",
  },
  {
    id: "deep_tech_startup",
    label: "Deep Tech Startup",
    emoji: "🚀",
    description: "VC-backed team pushing the frontier of materials science or embedded systems",
    constraints: "Can invest in R&D (6-18 months before revenue). Access to university labs and specialized equipment. Needs defensible IP. Must demonstrate 10x improvement over incumbents.",
    priorities: "Patent-worthy novelty, defensible moat, 10x performance improvement, venture-scale market, platform potential",
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      product,
      structuralDecomposition,
      assumptions,
      flippedLogic,
      conceptCount = 5,
      userLens,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const requestedCount = Math.max(3, Math.min(6, conceptCount));

    // Extract structural pressures from decomposition
    const leveragePrimitives = structuralDecomposition?.leverageAnalysis?.leveragePrimitives || [];
    const systemDynamics = structuralDecomposition?.systemDynamics || {};
    const functionalComponents = structuralDecomposition?.functionalComponents || [];

    const structuralContext = `
STRUCTURAL PRESSURES (from decomposition):
${leveragePrimitives.slice(0, 8).map((p: any, i: number) =>
  `${i + 1}. [${p.disruption_score || "?"}] ${p.label} — ${p.currentBehavior || ""} | Best transform: ${p.bestTransformation || "unknown"}`
).join("\n")}

FAILURE MODES: ${JSON.stringify(systemDynamics.failureModes?.slice(0, 5) || []).slice(0, 500)}
BOTTLENECKS: ${JSON.stringify(systemDynamics.bottlenecks?.slice(0, 3) || []).slice(0, 300)}
KEY COMPONENTS: ${functionalComponents.slice(0, 6).map((c: any) => c.name || c.label).join(", ")}
`;

    const assumptionContext = `
HIDDEN ASSUMPTIONS (ranked by leverage):
${(assumptions || []).slice(0, 10).map((a: any, i: number) =>
  `${i + 1}. [Leverage: ${a.leverageScore || "?"}] "${a.assumption}" — Why: ${a.currentAnswer || ""} | Type: ${a.reason || "unknown"} | Flip: ${a.challengeIdea || ""}`
).join("\n")}

FLIPPED LOGIC:
${(flippedLogic || []).slice(0, 6).map((f: any, i: number) =>
  `${i + 1}. Original: "${f.originalAssumption}" → Bold alternative: "${f.boldAlternative}" | Mechanism: ${f.physicalMechanism || ""}`
).join("\n")}
`;

    // Build user lens context if available
    const userLensContext = userLens ? `
USER LENS (tailor concepts to this person):
- Objective: ${userLens.primary_objective || "Not specified"}
- Resources: ${userLens.available_resources || "Not specified"}
- Risk Tolerance: ${userLens.risk_tolerance || "Not specified"}
- Time Horizon: ${userLens.time_horizon || "Not specified"}
- Constraints: ${userLens.constraints || "Not specified"}
` : "";

    // Build persona lens instructions for multi-lens comparison
    const personaInstructions = PERSONA_LENSES.map(p =>
      `"${p.id}": { label: "${p.label}", constraints: "${p.constraints}", priorities: "${p.priorities}" }`
    ).join("\n");

    const systemPrompt = `You are an Invention Synthesis Engine — a first-principles engineering system that generates physically buildable product concepts.

You combine three knowledge layers to produce inventions:
1. STRUCTURAL PRESSURE — where innovation matters (weaknesses, failure modes, bottlenecks)
2. ASSUMPTION BREAKS — what can change (challenged assumptions, flipped logic)
3. TECHNICAL MECHANISMS — how change becomes physically possible (from the mechanism library)

CONCEPT = STRUCTURAL WEAKNESS + ASSUMPTION FLIP + TECHNICAL MECHANISM

RULES:
- Every concept MUST trace to a specific structural weakness, a specific assumption being flipped, and a specific technical mechanism
- Concepts must be PHYSICALLY BUILDABLE — not software-only, not vaporware
- Include rough BOM with realistic cost estimates at scale (10K+ units)
- Include real precedent products that use similar mechanisms
- Each concept must be genuinely different — not variations of the same idea
- Avoid business model plays (no "SaaS-ify it", no "marketplace", no "subscription model")
- Focus on mechanical/electrical/material innovation

BREAKTHROUGH METRIC (DARPA-inspired) — For each concept:
- Classify as "step_change" (10× improvement) or "incremental" (2-5× improvement). Be HONEST — most ideas are incremental. Only classify as step_change if the physics/engineering enables order-of-magnitude improvement.
- State the specific metric being improved, current benchmark, and target performance.
- Step-change concepts are rare and exceptional. Default to "incremental" unless you can cite the specific mechanism enabling 10x.

PERFORMER NETWORK — For each concept, map WHO would build each piece:
- 2-4 performers per concept from: university, startup, national_lab, contract_manufacturer, component_supplier
- Name REAL organizations (e.g., "MIT Media Lab", "Jabil", "Protolabs", "Formlabs")
- Each performer has a specific role in making this concept real

SYSTEM ARCHITECTURE — For each concept, model the integrated system:
- Define 4-8 nodes (inputs → processing → outputs, with feedback loops)
- Show how components connect as an end-to-end system
- This models the REASSEMBLED system, not just decomposed parts
- Include manufacturing path and DFM considerations

BEFORE/AFTER NARRATIVE — For each concept, write a vivid contrast:
- "the_old_way": Describe the current reality in a way that makes it sound ABSURD once you see the alternative. Frame it as something people accept without question but shouldn't. Use specific, visceral details. 2-3 sentences.
- "the_new_way": Describe the new approach as OBVIOUS and INEVITABLE once understood. Make the reader feel like they can't unsee it. 2-3 sentences.
The contrast should create an "aha" moment — the reader should think "why hasn't anyone done this before?"

MULTI-LENS PERSONA FIT — For each concept, evaluate fit across three personas:
${personaInstructions}
For each persona, provide a fit_score (1-10), a one-sentence rationale, and the key_adaptation needed.

${MECHANISM_LIBRARY}

Respond with a JSON object matching this schema EXACTLY:
{
  "concepts": [
    {
      "name": "Short punchy product name",
      "tagline": "One sentence value prop",
      "origin": {
        "structural_driver": "Which structural weakness this addresses",
        "assumption_flipped": "Which assumption is being challenged",
        "enabling_mechanism": "Which mechanism(s) from the library make this possible"
      },
      "before_after": {
        "the_old_way": "Vivid description of the absurd status quo — make it feel ridiculous",
        "the_new_way": "Description of the new approach that feels obvious and inevitable"
      },
      "description": "2-3 sentence product description",
      "mechanism_description": "How the technical mechanism works in this specific application — be specific about physics/engineering",
      "materials": ["Material 1 with reason", "Material 2", ...],
      "estimated_bom": [
        { "component": "Name", "material": "Specific material", "process": "Mfg process", "unitCost": "$X.XX", "notes": "Optional" }
      ],
      "manufacturing_path": "Specific manufacturing approach, tooling, country, scale considerations",
      "certification_considerations": ["UL 1234", "FDA 510k", ...],
      "precedent_products": [
        { "product": "Name", "company": "Company", "relevance": "What's similar" }
      ],
      "prototype_approach": "How to build the first prototype",
      "dfm_notes": "Design-for-manufacturing considerations",
      "persona_fit": {
        "garage_inventor": { "fit_score": 7, "rationale": "Why this works/doesn't for a solo maker", "key_adaptation": "What they'd need to change" },
        "product_company": { "fit_score": 8, "rationale": "Why this works/doesn't for an established manufacturer", "key_adaptation": "What they'd need to change" },
        "deep_tech_startup": { "fit_score": 5, "rationale": "Why this works/doesn't for a VC-backed team", "key_adaptation": "What they'd need to change" }
      },
      "breakthrough_metric": {
        "classification": "step_change OR incremental",
        "magnitude": "e.g. 10x longer lifespan, 5x cost reduction",
        "current_benchmark": "Current industry performance for this metric",
        "target_performance": "What this concept achieves",
        "confidence": "high, medium, or low"
      },
      "performer_network": [
        { "category": "university|startup|national_lab|contract_manufacturer|component_supplier", "role": "What they would build/research", "example_organizations": ["Real org name 1", "Real org name 2"], "why": "Why they are the right performer" }
      ],
      "system_architecture": {
        "nodes": [
          { "id": "n1", "label": "Sensor Input", "type": "input|process|output|feedback" }
        ],
        "edges": [
          { "from": "n1", "to": "n2", "label": "data flow" }
        ],
        "description": "How the integrated system works end-to-end"
      }
    }
  ],
  "innovation_paths": [
    {
      "theme": "e.g. Failure Elimination",
      "description": "What this innovation direction addresses",
      "structural_pressures": ["pressure1", "pressure2"],
      "concept_indices": [0, 2]
    }
  ],
  "contrarian_narrative": {
    "industry_blind_spot": "The ONE thing the entire industry refuses to see — stated as a provocative, specific claim",
    "why_blind": "Why is the industry blind to this? What incentive structure or legacy thinking keeps them from seeing it?",
    "evidence": "What evidence from the structural analysis supports this contrarian view?",
    "unlock_statement": "If this blind spot were addressed, what massive value would be unlocked? Be specific about magnitude."
  }
}`;

    const userPrompt = `Generate ${requestedCount} invention concepts for this product:

PRODUCT: ${product.name}
CATEGORY: ${product.category}
DESCRIPTION: ${product.description}
SPECS: ${product.specs || "Not specified"}
KEY INSIGHT: ${product.keyInsight || "None"}
${userLensContext}

${structuralContext}

${assumptionContext}

CRITICAL:
1. Generate exactly ${requestedCount} concepts — each genuinely different
2. Every concept must have a clear origin trace (structural_driver + assumption_flipped + enabling_mechanism)
3. BOM estimates must be realistic for 10K+ unit production
4. Include at least 2 precedent products per concept
5. Group concepts into 2-4 innovation paths/themes
6. Each concept should target a different structural weakness when possible
7. BEFORE/AFTER: Make the "old way" sound absurd and the "new way" sound inevitable — this is the "aha" moment
8. PERSONA FIT: Score each concept for garage_inventor, product_company, and deep_tech_startup
9. CONTRARIAN NARRATIVE: Identify the industry's biggest blind spot — be provocative and specific
10. BREAKTHROUGH METRIC: Honestly classify each concept — most should be "incremental". Only mark "step_change" if 10× improvement is physically achievable.
11. PERFORMER NETWORK: Name 2-4 REAL organizations per concept who could build it — be specific about their role
12. SYSTEM ARCHITECTURE: Model 4-8 nodes showing how the concept works as an integrated system (inputs → processing → outputs → feedback)

Return ONLY the JSON object.`;

    const body = {
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 16000,
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
      const txt = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${txt}`);
    }

    const aiData = await response.json();
    const rawText: string = aiData.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response
    let result: Record<string, unknown>;
    try {
      let cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      result = JSON.parse(cleaned);
    } catch {
      // Brace balancing
      let cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const firstBrace = cleaned.indexOf("{");
      if (firstBrace !== -1) cleaned = cleaned.slice(firstBrace);
      let opens = 0, closes = 0;
      for (const ch of cleaned) { if (ch === '{') opens++; if (ch === '}') closes++; }
      if (opens > closes) {
        cleaned = cleaned.replace(/,\s*$/, '') + '}'.repeat(opens - closes);
      }
      try {
        result = JSON.parse(cleaned);
      } catch (e) {
        console.error("[ConceptSynthesis] JSON parse failed:", e);
        throw new Error("AI returned invalid output. Please try again.");
      }
    }

    // Validate concepts array
    const concepts = Array.isArray(result.concepts) ? result.concepts : [];
    if (concepts.length === 0) {
      throw new Error("No concepts generated. Please try again.");
    }

    // Validate each concept has origin trace + new fields
    for (const c of concepts) {
      if (!c.origin) {
        c.origin = {
          structural_driver: "Structural weakness identified in decomposition",
          assumption_flipped: "Industry assumption challenged",
          enabling_mechanism: "Technical mechanism from library",
        };
      }
      if (!c.before_after) {
        c.before_after = {
          the_old_way: "The current approach accepts known limitations as permanent constraints.",
          the_new_way: "This concept eliminates those constraints entirely through a fundamental mechanism change.",
        };
      }
      if (!c.persona_fit) {
        c.persona_fit = {
          garage_inventor: { fit_score: 5, rationale: "Moderate fit", key_adaptation: "Simplify manufacturing" },
          product_company: { fit_score: 7, rationale: "Good fit with existing capabilities", key_adaptation: "Integrate with existing lines" },
          deep_tech_startup: { fit_score: 6, rationale: "Potential for IP differentiation", key_adaptation: "Focus on defensible innovation" },
        };
      }
      if (!c.estimated_bom) c.estimated_bom = [];
      if (!c.materials) c.materials = [];
      if (!c.certification_considerations) c.certification_considerations = [];
      if (!c.precedent_products) c.precedent_products = [];
      if (!c.breakthrough_metric) {
        c.breakthrough_metric = {
          classification: "incremental",
          magnitude: "Moderate improvement over existing solutions",
          current_benchmark: "Industry standard",
          target_performance: "Improved performance",
          confidence: "medium",
        };
      }
      if (!c.performer_network) c.performer_network = [];
      if (!c.system_architecture) {
        c.system_architecture = {
          nodes: [
            { id: "n1", label: "Input", type: "input" },
            { id: "n2", label: "Core Process", type: "process" },
            { id: "n3", label: "Output", type: "output" },
          ],
          edges: [
            { from: "n1", to: "n2", label: "feeds" },
            { from: "n2", to: "n3", label: "produces" },
          ],
          description: "Basic system flow",
        };
      }
    }

    // Ensure innovation_paths exists
    if (!result.innovation_paths || !Array.isArray(result.innovation_paths)) {
      result.innovation_paths = [{
        theme: "Primary Innovation Direction",
        description: "Concepts addressing core structural weaknesses",
        structural_pressures: [],
        concept_indices: concepts.map((_: unknown, i: number) => i),
      }];
    }

    // Ensure contrarian_narrative exists
    if (!result.contrarian_narrative) {
      result.contrarian_narrative = {
        industry_blind_spot: "The industry optimizes for the wrong metric.",
        why_blind: "Legacy thinking and sunk costs in existing tooling.",
        evidence: "Structural analysis reveals fundamental misalignment between user needs and product design priorities.",
        unlock_statement: "Addressing this blind spot could unlock significant market share from underserved segments.",
      };
    }

    console.log(`[ConceptSynthesis] Generated ${concepts.length} concepts, ${(result.innovation_paths as any[]).length} paths, contrarian narrative: ${!!(result.contrarian_narrative)}`);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("concept-synthesis error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
